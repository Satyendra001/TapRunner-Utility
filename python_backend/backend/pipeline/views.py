import os, subprocess
import json
import pandas as pd
import glob
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from backend.settings import DATA_DIR
from .in_memory import InMemoryBackend
from dashboard.models import SyncRecordCount
from rest_framework.permissions import IsAuthenticated


def fieldTransfom(row):
    ans = []
    preselected = []
    for metadata in row.metadata:
        if metadata["breadcrumb"]:
            ans.append(
                {
                    "label": metadata["breadcrumb"][1],
                    "value": metadata["breadcrumb"][1],
                    "stream": row["tap_stream_id"],
                }
            )
            if metadata["metadata"].get("selected") is True:
                preselected.append(
                    {
                        "label": metadata["breadcrumb"][1],
                        "value": metadata["breadcrumb"][1],
                        "stream": row["tap_stream_id"],
                    }
                )

    return row.append(
        pd.Series(data=[ans, preselected], index=["Fields", "preSelected"])
    )


def applyStreamSelection(row, data):
    selected_fields = data.get(row.streams["tap_stream_id"], [])
    for ind, metadata in enumerate(row.streams["metadata"]):
        if ind != 0:
            row.streams["metadata"][ind]["metadata"]["selected"] = False
            for field in selected_fields:
                if field["value"] == metadata["breadcrumb"][1]:
                    row.streams["metadata"][ind]["metadata"]["selected"] = True
                    row.streams["metadata"][0]["metadata"]["selected"] = True
    return row


def data_from_metadata(metadata):
    data = {
        "key_properties": [],
        "replication_method": "",
        "replication_keys": "",
        "automatic_fields": [],
        "selected_fields": [],
        "unselected_fields": [],
        "total_records": [],
        "unique_records": set(),
        "max_bookmarks": {},
        "duplicates_records": [],
    }
    for value in metadata:

        if value.get("breadcrumb") == []:
            data["replication_method"] = value.get("metadata").get(
                "forced-replication-method", ""
            )
            data["replication_keys"] = (
                value.get("metadata").get("valid-replication-keys", [])
                if type(value.get("metadata").get("valid-replication-keys", [])) == list
                else [value.get("metadata").get("valid-replication-keys", [])]
            )
            data["key_properties"] = (
                value.get("metadata").get("table-key-properties", [])
                if type(value.get("metadata").get("table-key-properties", [])) == list
                else [value.get("metadata").get("table-key-properties", [])]
            )

        else:
            if value.get("metadata").get("inclusion") == "automatic":
                data["automatic_fields"].append(value.get("breadcrumb")[1])

            if value.get("metadata").get("selected") == True:
                data["selected_fields"].append(value.get("breadcrumb")[1])

            else:
                data["unselected_fields"].append(value.get("breadcrumb")[1])

    return pd.Series(data)


def schema_difference(row):
    data = {
        "deprecating_fields": [],
        "newly_added_fields": [],
        "unchanged_fields": [],
        "first_instance_pk": [],
        "first_instance_rk": [],
        "first_instance_rm": "",
        "first_instance_field": [],
        "second_instance_pk": [],
        "second_instance_rk": [],
        "second_instance_rm": "",
        "second_instance_field": [],
    }

    first_instance_fields = row["schema.properties_x"].keys()
    second_instance_fields = row["schema.properties_y"].keys()
    deprecating_fields = first_instance_fields - second_instance_fields
    newly_added_fields = second_instance_fields - first_instance_fields
    common_fields = set(first_instance_fields).intersection(set(second_instance_fields))
    all_fields = set(first_instance_fields).union(set(second_instance_fields))

    for field in all_fields:
        if field in common_fields:
            if row["schema.properties_x"][field] == row["schema.properties_y"][field]:
                data["unchanged_fields"].append(
                    {"field": field, "type": row["schema.properties_x"][field]}
                )
            else:
                data["first_instance_field"].append(
                    {"field": field, "type": row["schema.properties_x"][field]}
                )
                data["second_instance_field"].append(
                    {"field": field, "type": row["schema.properties_y"][field]}
                )
        elif field in deprecating_fields:
            data["deprecating_fields"].append(
                {"field": field, "type": row["schema.properties_x"][field]}
            )
        elif field in newly_added_fields:
            data["newly_added_fields"].append(
                {"field": field, "type": row["schema.properties_y"][field]}
            )

    for metadata in row.metadata_x:
        if metadata.get("breadcrumb") == []:
            data["first_instance_pk"] = (
                metadata["metadata"]["table-key-properties"]
                if type(metadata["metadata"]["table-key-properties"]) == list
                else [metadata["metadata"]["table-key-properties"]]
            )
            data["first_instance_rk"] = (
                metadata["metadata"]["valid-replication-keys"]
                if type(metadata["metadata"]["valid-replication-keys"]) == list
                else [metadata["metadata"]["valid-replication-keys"]]
            )
            data["first_instance_rm"] = metadata["metadata"][
                "forced-replication-method"
            ]
            break

    for metadata in row.metadata_y:
        if metadata.get("breadcrumb") == []:
            data["second_instance_pk"] = (
                metadata["metadata"]["table-key-properties"]
                if type(metadata["metadata"]["table-key-properties"]) == list
                else [metadata["metadata"]["table-key-properties"]]
            )
            data["second_instance_rk"] = (
                metadata["metadata"]["valid-replication-keys"]
                if type(metadata["metadata"]["valid-replication-keys"]) == list
                else [metadata["metadata"]["valid-replication-keys"]]
            )
            data["second_instance_rm"] = metadata["metadata"][
                "forced-replication-method"
            ]
            break

    return row.append(pd.Series(data))


class Discovery(APIView):
    def get(self, request):
        username = request.query_params.get("user")
        instance_name = request.query_params.get("instance_name")
        tap_name = request.query_params.get("tap_name")
        tap_path = os.path.abspath(
            DATA_DIR + "{}/{}/{}/".format(username, instance_name, tap_name)
        )
        config_path = tap_path + "/config.json"
        venv_path = tap_path + "/venv/bin/{}".format(tap_name)
        discover_command = [venv_path, "-c", config_path, "-d"]
        memory_obj = InMemoryBackend(tap_path)
        is_error = memory_obj.get_catalog(discover_command)

        return Response({"data": {"is_error": is_error}})


class StreamSelection(APIView):
    def get(self, request):
        username = request.query_params.get("user")
        instance_name = request.query_params.get("instance_name")
        tap_name = request.query_params.get("tap_name")
        tap_path = DATA_DIR + "{}/{}/{}/".format(username, instance_name, tap_name)
        catalog_path = tap_path + "catalog.json"
        catalog_df = pd.read_json(catalog_path)
        catalog_df = pd.json_normalize(catalog_df["streams"], max_level=1)
        catalog_df = catalog_df.apply(fieldTransfom, axis=1)[
            ["tap_stream_id", "Fields", "preSelected"]
        ]
        data = catalog_df.set_index("tap_stream_id").to_dict("index")
        return Response({"data": data})

    def post(self, request):
        username = request.query_params.get("user")
        instance_name = request.query_params.get("instance_name")
        tap_name = request.query_params.get("tap_name")
        tap_path = DATA_DIR + "{}/{}/{}/".format(username, instance_name, tap_name)
        catalog_path = tap_path + "catalog.json"
        data = json.loads(request.data["data"])
        catalog_df = pd.read_json(catalog_path)
        catalog_df = catalog_df.apply(applyStreamSelection, args=[data], axis=1)
        with open(catalog_path, "w") as catalog_file:
            json.dump(catalog_df.to_dict("list"), catalog_file)
        return Response({"data": "", "message": "Successfully reated Catalog.json"})


class State(APIView):
    def get(self, request):
        username = request.query_params.get("user")
        instance_name = request.query_params.get("instance_name")
        tap_name = request.query_params.get("tap_name")
        tap_path = DATA_DIR + "{}/{}/{}/".format(username, instance_name, tap_name)
        state_path = tap_path + "state.json"
        df = pd.read_json(state_path)[["bookmarks"]]
        data = df.to_dict("index")
        return Response({"data": data})

    def post(self, request):
        username = request.query_params.get("user")
        instance_name = request.query_params.get("instance_name")
        tap_name = request.query_params.get("tap_name")
        tap_path = DATA_DIR + "{}/{}/{}/".format(username, instance_name, tap_name)
        state_path = tap_path + "state.json"
        data = request.data["data"]
        if request.data["is_upload"] == "no":
            data = pd.DataFrame(json.loads(data)).transpose().to_dict()
        else:
            data = json.loads(data.read().decode())
        with open(state_path, "w") as state_file:
            json.dump(data, state_file)

        return Response({"data": "", "message": "Successfully reated state.json"})


class Sync(APIView):
    def post(self, request):
        username = request.query_params.get("user")
        with_state = request.query_params.get("with_state")
        instance_name = request.query_params.get("instance_name")
        tap_name = request.query_params.get("tap_name")
        tap_path = os.path.abspath(
            DATA_DIR + "{}/{}/{}/".format(username, instance_name, tap_name)
        )
        state_path = tap_path + "/state.json"
        config_path = tap_path + "/config.json"
        catalog_path = tap_path + "/catalog.json"
        venv_path = tap_path + "/venv/bin/{}".format(tap_name)
        command = [
            venv_path,
            "-c",
            config_path,
            "--catalog",
            catalog_path,
            "-p",
            catalog_path,
        ] + (["--state", state_path] if with_state == "true" else [])
        memory_obj = InMemoryBackend(tap_path)
        is_error = memory_obj.run_sync(command)
        if not is_error:
            if os.path.isfile(tap_path + "/sync.json"):
                with open(tap_path + "/sync.json", "r") as f:

                    stream_to_record_count = {}
                    streams = []
                    for row in f:
                        row = json.loads(row)
                        type = row.get("type")

                        if type == "RECORD":
                            if row.get("stream") not in stream_to_record_count:
                                stream_to_record_count[row.get("stream")] = 1
                            else:
                                stream_to_record_count[row.get("stream")] += 1

                        if type == "SCHEMA":
                            streams.append(row.get("stream"))

                for stream in streams:
                    if stream not in stream_to_record_count:
                        stream_to_record_count[stream] = 0
                    db = SyncRecordCount(
                        userName=username,
                        instanceName=instance_name,
                        tapName=tap_name,
                        stream=stream,
                        recordCount=stream_to_record_count[stream],
                    )
                    db.save()
        return Response({"data": {"is_error": is_error}})


class Logs(APIView):
    def get(self, request):
        username = request.query_params.get("user")
        instance_name = request.query_params.get("instance_name")
        tap_name = request.query_params.get("tap_name")
        file = request.query_params.get("file", "").replace("%20", "_")
        tap_path = os.path.abspath(
            DATA_DIR + "{}/{}/{}/".format(username, instance_name, tap_name)
        )
        logs_path = tap_path + "/{}logs.txt".format(file + "_" if file else "")

        with open(logs_path, "r") as log_file_obj:
            data = log_file_obj.readlines()

        return Response({"data": data})


class ViewFiles(APIView):
    def get(self, request, *args, **kwargs):
        username = request.query_params.get("user")
        instance_name = request.query_params.get("instance_name")
        tap_name = request.query_params.get("tap_name")
        tap_path = os.path.abspath(
            DATA_DIR + "{}/{}/{}/".format(username, instance_name, tap_name)
        )
        file_path = tap_path + "/{}.json".format(kwargs.get("file"))
        with open(file_path, "r") as file:
            data = file.read()
        return Response({"data": json.loads(data)})


class Reports(APIView):
    def get(self, request):
        username = request.query_params.get("user")
        instance_name = request.query_params.get("instance_name")
        tap_name = request.query_params.get("tap_name")
        tap_path = os.path.abspath(
            DATA_DIR + "{}/{}/{}/".format(username, instance_name, tap_name)
        )
        state_path = tap_path + "/state.json"
        catalog_path = tap_path + "/catalog.json"
        sync_path = tap_path + "/sync.json"

        with open(state_path) as state_file_obj:
            state_data = json.load(state_file_obj).get("bookmarks")

        catalog_df = pd.read_json(catalog_path)
        catalog_df = pd.json_normalize(catalog_df["streams"], max_level=1)
        catalog_df[
            [
                "key_properties",
                "replication_method",
                "replication_keys",
                "automatic_fields",
                "selected_fields",
                "unselected_fields",
                "total_records",
                "unique_records",
                "max_bookmarks",
                "duplicates_records",
            ]
        ] = catalog_df["metadata"].apply(data_from_metadata)
        catalog_df = catalog_df[
            [
                "stream",
                "tap_stream_id",
                "key_properties",
                "replication_method",
                "replication_keys",
                "automatic_fields",
                "selected_fields",
                "unselected_fields",
                "total_records",
                "unique_records",
                "max_bookmarks",
                "duplicates_records",
            ]
        ].set_index("stream")
        data = catalog_df.to_dict("index")

        with open(sync_path, "r") as sync_file_obj:
            for row in sync_file_obj:
                row_dict = json.loads(row)

                if row_dict["type"] == "RECORD":
                    pk_value_list = []
                    for pk in data[row_dict["stream"]]["key_properties"]:
                        pk_value_list.append(str(row_dict["record"][pk]))

                    "||".join(pk_value_list) in data[row_dict["stream"]][
                        "unique_records"
                    ] and data[row_dict["stream"]]["duplicates_records"].append(
                        "||".join(pk_value_list)
                    )
                    data[row_dict["stream"]]["total_records"].append(
                        "||".join(pk_value_list)
                    )
                    data[row_dict["stream"]]["unique_records"].add(
                        "||".join(pk_value_list)
                    )
                    for rk in data[row_dict["stream"]]["replication_keys"]:
                        data[row_dict["stream"]]["max_bookmarks"][rk] = max(
                            data[row_dict["stream"]]["max_bookmarks"].get(rk, ""),
                            row_dict["record"][rk],
                        )

        for stream in data:
            data[stream]["total_records"] = len(data[stream]["total_records"])
            data[stream]["unique_records"] = len(data[stream]["unique_records"])

        is_normal_bookmarks = False
        for state_key in state_data.keys():
            if state_key in data:
                is_normal_bookmarks = True
                data[state_key]["bookmarks"] = state_data[state_key]

        return Response(
            {
                "data": {
                    "data": data,
                    "headers": [
                        "key_properties",
                        "replication_method",
                        "replication_keys",
                        "automatic_fields",
                        "selected_fields",
                        "unselected_fields",
                    ],
                    "extra_state": {} if is_normal_bookmarks else state_data,
                }
            }
        )


class Compare(APIView):
    def get(self, request):
        user_name = "superuser"
        tap_name = request.query_params.get("tap_name")
        instance_dir = os.path.abspath(DATA_DIR + "{}".format(user_name))
        data = []

        for instance in os.listdir(instance_dir):
            if tap_name in os.listdir(os.path.join(instance_dir, instance)):
                data.append(instance)

        return Response({"data": data})

    def post(self, request):
        username = request.data["user"]
        instance_1 = request.data["instance_1"]
        instance_2 = request.data["instance_2"]
        tap_path_1 = os.path.abspath(
            [i for i in os.scandir(DATA_DIR + "{}/{}".format(username, instance_1))][
                0
            ].path
        )
        tap_path_2 = os.path.abspath(
            [i for i in os.scandir(DATA_DIR + "{}/{}".format(username, instance_2))][
                0
            ].path
        )
        catalog_1_path = tap_path_1 + "/catalog.json"
        catalog_2_path = tap_path_2 + "/catalog.json"
        sync_1_path = tap_path_1 + "/sync.json"
        sync_2_path = tap_path_2 + "/sync.json"
        message = ""

        if not os.path.exists(catalog_1_path):
            message += "\n - catalog.json is not available in first instance."

        if not os.path.exists(catalog_2_path):
            message += "\n - catalog.json is not available in second instance."

        if not os.path.exists(sync_1_path):
            message += "\n - sync.json is not available in first instance."

        if not os.path.exists(sync_2_path):
            message += "\n - sync.json is not available in second instance."

        if message != "":
            return Response(data={"message": message}, status=status.HTTP_404_NOT_FOUND)

        catalog_1_df = pd.json_normalize(
            pd.read_json(catalog_1_path)["streams"], max_level=1
        )
        catalog_2_df = pd.json_normalize(
            pd.read_json(catalog_2_path)["streams"], max_level=1
        )
        join_catalog_df = pd.merge(
            catalog_1_df, catalog_2_df, on="stream", how="outer", indicator=True
        )
        join_catalog_df = join_catalog_df.apply(schema_difference, axis=1)[
            [
                "tap_stream_id_x",
                "tap_stream_id_y",
                "stream",
                "deprecating_fields",
                "newly_added_fields",
                "unchanged_fields",
                "first_instance_pk",
                "first_instance_rk",
                "first_instance_rm",
                "first_instance_field",
                "second_instance_pk",
                "second_instance_rk",
                "second_instance_rm",
                "second_instance_field",
            ]
        ].set_index("stream")

        data = join_catalog_df.to_dict("index")

        return Response({"data": data})


class Coverage(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):
        username = request.user
        name = request.query_params["name"]
        instance_name = request.query_params.get("instance_name")
        tap_name = request.query_params.get("tap_name")
        tap_path = os.path.abspath(
            DATA_DIR + "{}/{}/{}/".format(username, instance_name, tap_name)
        )
        # cci_config_path = tap_path + "/.circleci/config.yml"
        cmd_list = []
        package = "_".join(tap_name.split("-"))
        all_cmds = {
            "pylint": ["pip install pylint", "pylint {} -d C,W,R".format(package)],
            "Unit Tests": [
                "pip install nose coverage parameterized",
                "nosetests --with-coverage --cover-erase --cover-package={} --cover-html-dir=htmlcov tests/unittests".format(
                    package
                ),
            ],
        }
        result = 0

        # with open(cci_config_path) as cci_config_obj:
        #     data = yaml.load(cci_config_obj, Loader=SafeLoader)['jobs']['build']['steps']

        try:
            # for i in data:
            #     if type(i)==dict and i.get("run", {}).get("name")==name:
            #         cmd_list = i["run"]["command"].split("\n")
            #         break
            cmd_list = all_cmds.get(name)
            for cmd_str in cmd_list:
                if cmd_str and (not cmd_str.startswith("coverage")):
                    cmd = tap_path + "/venv/bin/" + cmd_str
                    cmd_process = subprocess.Popen(
                        cmd.split(" "),
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        cwd=tap_path,
                    )
                    (stdout, stderr) = cmd_process.communicate()
                    cmd_process.wait()
                    if cmd_str.startswith("pylint"):
                        result = (
                            stdout.decode()
                            .split("Your code has been rated at ")[1]
                            .split(" ")[0]
                        )
                    if cmd_str.startswith("nosetests"):
                        result = (
                            stderr.decode()
                            .split("TOTAL")[1]
                            .split("\n")[0]
                            .split(" ")
                            .pop()[:2]
                        )
        except Exception as e:
            return Response(
                data={"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        with open(
            "{}/{}_logs.txt".format(tap_path, name.replace(" ", "_")), "w"
        ) as file_obj:

            if stdout.decode():
                file_obj.write(stdout.decode())
            if stderr.decode():
                file_obj.write(stderr.decode())

        return Response({"data": {"result": result, "logs": stdout.decode()}})
