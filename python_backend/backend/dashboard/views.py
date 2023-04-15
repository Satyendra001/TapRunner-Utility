import json
import re
import shutil
import stat
import time
from django.http import Http404
from .models import SyncRecordCount
from rest_framework.views import APIView
from rest_framework.response import Response
import os, subprocess
from pathlib import Path
from backend.settings import DATA_DIR, DEFAULT_TIMEOUT, PYTHON_FOR_TAP
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
import pandas as pd


class GetInstance(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def post(self, request):
        username = request.user
        instance_name = request.data.get("instance_name")
        tap_name = request.data.get("tap_name")
        branch_name = request.data.get("branch_name")
        instance_path = os.path.abspath(
            DATA_DIR + "{}/{}/".format(username, instance_name)
        )
        tap_path = instance_path + "/{}".format(tap_name)
        repo_url = "https://github.com/singer-io/{}.git".format(tap_name)
        print("----> {}".format(instance_path))

        if not os.path.isdir(instance_path):
            os.makedirs(instance_path)

            ##################### Cloning repo ##############
            clone_process = subprocess.Popen(
                ["git", "clone", repo_url], cwd=instance_path
            )
            (stdout, stderr) = clone_process.communicate()
            clone_process.wait(timeout=DEFAULT_TIMEOUT)
            clone_process.kill()

            ##################Switching the branch #####################
            branch_switch_process = subprocess.Popen(
                ["git", "checkout", branch_name], cwd=tap_path
            )
            branch_switch_process.wait()
            branch_switch_process.kill()

            ################ Creating virtual env ###########
            env_path = os.path.abspath(instance_path + "/{}".format(tap_name))
            env_process = subprocess.Popen(
                [PYTHON_FOR_TAP, "-m", "venv", "venv"], cwd=env_path
            )
            env_process.wait()
            env_process.kill()

            config_path = ""
            for item in os.listdir(tap_path):
                if os.path.isfile(os.path.join(tap_path, item)) and "config" in item:
                    config_path = os.path.join(tap_path, item)

            if config_path:
                with open(config_path, "r") as config_obj:
                    config_data = config_obj.read()
                    config = json.loads(config_data)
            else:
                return Response(
                    {
                        "data": {
                            "msg": "Sample Config not available. Upload your own config.json",
                            "data": {
                                "tap_name": tap_name,
                                "instance_name": instance_name,
                                "branch_name": branch_name,
                            },
                        }
                    }
                )
            return Response(
                {
                    "data": {
                        "msg": "The Instance for the tap is created",
                        "config": config,
                        "data": {
                            "tap_name": tap_name,
                            "instance_name": instance_name,
                            "branch_name": branch_name,
                        },
                    }
                }
            )

        else:
            return Response(
                {
                    "data": {
                        "msg": "The Instance for the tap is already created! Try creating a new instance",
                    }
                }
            )

    def patch(self, request):
        username = request.user
        config = request.data["config"]
        is_upload = request.data["is_upload"]
        tap_info = json.loads(request.data["tap_info"])
        instance_name = tap_info.get("instance_name")
        tap_name = tap_info.get("tap_name")
        tap_path = os.path.abspath(
            DATA_DIR + "{}/{}/{}/".format(username, instance_name, tap_name)
        )

        if is_upload == "yes":
            json_config = json.loads(config.read().decode())
        if is_upload == "no":
            json_config = json.loads(config)

        config_path = tap_path + "/config.json"
        with open(config_path, "w") as config_file:
            json.dump(json_config, config_file)

        venv_path = tap_path + "/venv/bin/{}".format(PYTHON_FOR_TAP)

        # ########### Install the dependencies ###########
        env_process = subprocess.Popen(
            [venv_path, "-m", "pip", "install", "-e", "."],
            stderr=subprocess.PIPE,
            cwd=tap_path,
        )
        (stdout, stderr) = env_process.communicate()
        if stderr.decode().find("ERROR") != -1:
            print("+-+-+-+-+-+-", stderr.decode())
            shutil.rmtree(
                os.path.abspath(DATA_DIR + "{}/{}".format(username, instance_name)),
                ignore_errors=True,
            )
            raise Http404()
        env_process.wait(timeout=DEFAULT_TIMEOUT)
        env_process.kill()

        ############## Install pylint ###############
        env_process = subprocess.Popen(
            [venv_path, "-m", "pip", "install", ".[dev]"],
            stderr=subprocess.PIPE,
            cwd=tap_path,
        )
        (stdout, stderr) = env_process.communicate()
        if stderr.decode().find("ERROR") != -1:
            print("+-+-+-+-+-+-", stderr.decode())
            shutil.rmtree(
                os.path.abspath(DATA_DIR + "{}/{}".format(username, instance_name)),
                ignore_errors=True,
            )
            raise Http404()
        env_process.wait(timeout=DEFAULT_TIMEOUT)
        env_process.kill()

        return Response(
            {"data": {"msg": "Config Saved Successfully", "data": request.data}}
        )

    def get(self, request):
        print(request.user)
        data = []
        username = request.user
        instance_parent_dir_path = os.path.abspath(DATA_DIR + "{}".format(username))
        instances_dir_list = sorted(
            Path(instance_parent_dir_path).iterdir(), key=os.path.getctime, reverse=True
        )

        record_count = {}

        # df.rename(columns={"tapName": "name"}) \
        #     .groupby(["diggerclass", "truckclass", "rank", "color"])[["name", "severity", "value", "rank", "color"]].apply(lambda x: x.to_dict('r')).reset_index(name="children") \
        #     .rename(columns={"truckclass": "name"}) \
        #     .groupby(["diggerclass", "color"])[["name", "children", "rank", "color"]].apply(lambda x: x.to_dict('r')).reset_index(name="children") \
        #     .rename(columns={"diggerclass":"name"}).to_dict("r")

        instance_tap_mapping = {}
        for instance_dir in instances_dir_list:
            for tap_dir in os.listdir(instance_dir):
                tap_path = os.path.join(instance_dir, tap_dir)
                ########### Check for catalog and sync files #############
                all_files = set(os.listdir(tap_path))
                f = [
                    time.strftime(
                        "%Y-%m-%d %H:%M:%S",
                        time.localtime(
                            os.stat(os.path.join(tap_path, "catalog.json")).st_mtime
                        ),
                    )
                    if "catalog.json" in all_files
                    else None,
                    time.strftime(
                        "%Y-%m-%d %H:%M:%S",
                        time.localtime(
                            os.stat(os.path.join(tap_path, "sync.json")).st_mtime
                        ),
                    )
                    if "sync.json" in all_files
                    else None,
                ]

                if tap_dir not in instance_tap_mapping:
                    instance_tap_mapping[tap_dir] = 1
                else:
                    instance_tap_mapping[tap_dir] += 1

                m_data = {
                    "instance_name": str(instance_dir).split("/")[-1],
                    "tap_name": tap_dir,
                    "sync_m_time": f[1],
                    "catalog_m_time": f[0],
                }

                data.append(m_data)

        return Response(
            {
                "data": {
                    "data": data,
                    "mapping": instance_tap_mapping,
                    "record_count": record_count,
                }
            }
        )

    def delete(self, request):
        username = request.user
        instance_name = request.data.get("instance_name")
        # tap_name = request.data.get("tap_name")
        # tap_path = os.path.abspath(DATA_DIR + "{}/{}/{}/".format(username, instance_name, tap_name))
        instance_path = os.path.abspath(
            DATA_DIR + "{}/{}".format(username, instance_name)
        )

        if SyncRecordCount.objects.filter(
            userName=username, instanceName=instance_name
        ).values():
            SyncRecordCount.objects.filter(
                userName=username, instanceName=instance_name
            ).delete()

        ############### To use when running on windows #####################
        # def on_rm_error(func, path, exc_info):
        #     os.chmod(path, stat.S_IWRITE)
        #     os.unlink(path)
        # Checking for any .git folder(i.e hidden folder)
        # for i in os.listdir(tap_dir):
        #     if i.endswith("git"):
        #         tmp = os.path.join(tap_dir, i)
        #         # We want to unhide the .git folder before unlinking it.
        #         while True:
        #             subprocess.call(["attrib", "-H", tmp])
        #             break
        #         shutil.rmtree(tmp, onerror=on_rm_error)
        #####################################################################
        shutil.rmtree(instance_path, ignore_errors=True)

        return Response({"data": {"data": "data"}})

    def put(self, request):
        username = request.user
        instance_name = request.data.get("instance_name")
        instance_path = os.path.abspath(
            DATA_DIR + "{}/{}".format(username, instance_name)
        )
        tap_name = os.listdir(instance_path)[0]
        tap_path = instance_path + "/" + tap_name
        config_path = tap_path + "/config.json"

        branch_fetch_process = subprocess.Popen(
            ["git", "branch"], stdout=subprocess.PIPE, cwd=tap_path
        )
        (stdout, stderr) = branch_fetch_process.communicate()
        branch_name = stdout.decode(encoding="utf-8")[1:]

        tap_data = {
            "tap_name": tap_name,
            "instance_name": instance_name,
            "branch_name": branch_name,
        }

        with open(config_path, "r") as f:
            config_data = f.read()
            config = json.loads(config_data)

        return Response({"data": {"tap_data": tap_data, "config": config}})


class ChartData(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):

        username = request.user

        if not os.path.isdir(DATA_DIR + "{}".format(username)):
            os.mkdir(DATA_DIR + "{}".format(username))
        instance_parent_dir_path = os.path.abspath(DATA_DIR + "{}".format(username))
        instances_dir_list = sorted(
            Path(instance_parent_dir_path).iterdir(), key=os.path.getctime, reverse=True
        )
        instance_tap_mapping = {}

        for instance_dir in instances_dir_list:
            for tap_dir in os.listdir(instance_dir):

                if tap_dir not in instance_tap_mapping:
                    instance_tap_mapping[tap_dir] = 1
                else:
                    instance_tap_mapping[tap_dir] += 1

        if SyncRecordCount.objects.filter(userName=username).values():

            df = pd.DataFrame(
                list(SyncRecordCount.objects.filter(userName=username).values())
            )
            chart_data = {
                "name": "AllTaps",
                "children": df.rename(
                    columns={"stream": "name", "recordCount": "value"}
                )
                .groupby(["tapName", "instanceName"])[["name", "value"]]
                .apply(lambda x: x.to_dict("r"))
                .reset_index(name="children")
                .rename(columns={"instanceName": "name"})
                .groupby(["tapName"])[["name", "children"]]
                .apply(lambda x: x.to_dict("r"))
                .reset_index(name="children")
                .rename(columns={"tapName": "name"})
                .to_dict("r"),
            }

            return Response(
                {
                    "data": {
                        "allData": chart_data,
                        "mapping": instance_tap_mapping,
                    }
                }
            )
        else:
            return Response(
                {
                    "data": {
                        "allData": {},
                        "mapping": instance_tap_mapping,
                    }
                }
            )
