from concurrent.futures import process
from subprocess import Popen, PIPE
import selectors
import json
import os

class InMemoryBackend:
    catalogs = {}
    states = {}
    def __init__(self, path=None):
        self.path = path
        
    def get_catalog(self, command):
        discover = Popen(command, stdout=PIPE, stderr=PIPE, universal_newlines=True)
        raw_catalog = ""
        
        for outline, errline in InMemoryBackend.__read_pipes(self.path, [discover], discover.stdout, discover.stderr):
            if outline:
                raw_catalog += outline
            if errline:
                print("\t" + errline.rstrip())

        if (discover.returncode != 0 and discover.returncode is not None):
            return True
        
        catalog = json.loads(raw_catalog) if raw_catalog else None
        
        with open(self.path+"/catalog.json", "w") as catalog_file:
            json.dump(self.__annotate_catalog(catalog), catalog_file)
            
        return False
    
    def run_sync(self, command):
        sync = Popen(command, stdout=PIPE, stderr=PIPE, universal_newlines=True)
        if os.path.isfile(self.path + "/sync.json"):
            os.remove(self.path + "/sync.json")
        for outline, errline in InMemoryBackend.__read_pipes(self.path, [sync], sync.stdout, sync.stderr):
            if outline:
                data = outline
                try:
                    with open(self.path + "/sync.json","a+") as sync_file_obj:
                        json.dump(json.loads(data),sync_file_obj)
                        sync_file_obj.write("\n")
                except Exception:
                    raise Exception("Not able to write result into file")
                # result=os.system("echo {} {} {}/sync.json".format(json.dumps(data), operation, self.path))
                # if result !=0:
                if data.startswith('{"type": "STATE"'):
                    with open(self.path+"/state.json", "w") as state_file_obj:
                        json.dump({"bookmarks": json.loads(data).get('value', {}).get("bookmarks", json.loads(data).get('value', {}))}, state_file_obj)
                    
                
            if errline:
                print("\t" + errline.rstrip())
                
        if (sync.returncode != 0 and sync.returncode is not None):
            return True
        
        return False
        
    @staticmethod
    def __read_pipes(path, procs, *pipes):
        sel = selectors.DefaultSelector()
        for pipe in pipes:
            sel.register(pipe, selectors.EVENT_READ)

        done = False
        log_file_mode = "w"
        c = 0
        while not done:
            for key, _ in sel.select():
                c += 1
                return_value = [""] * len(pipes)
                data = key.fileobj.readline() #TODO: call read() instead?
                for i in ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL", "FATAL", "EXCEPTION"]:
                    if data.startswith(i):
                        with open(path+"/logs.txt", log_file_mode) as log_file:
                            log_file_mode = 'a'
                            log_file.write(data)
                            
                if not data and all(x.poll() is not None for x in procs ):
                    # Proc has exited, read the rest, align the lengths, and yield
                    rest_outputs = [pipe.read().split('\n') for pipe in pipes]
                    max_length = max(len(x) for x in rest_outputs)
                    for i, output in enumerate(rest_outputs):
                        rest_outputs[i] += [''] * (max_length - len(output))
                    yield from zip(*rest_outputs)
                    done = True

                for i, pipe in enumerate(pipes):
                    if key.fileobj is pipe:
                        return_value[i] = data
                        break
                yield tuple(return_value)

    def __annotate_catalog(self, catalog):
        """
        Takes a catalog of the structure {"streams": […catalog_entries]} and annotates each entry
        """
        
        catalog["streams"] = [self.__annotate_catalog_entry(entry) for entry in catalog["streams"]]
        return catalog
    
    def __annotate_schema_with_metadata(self, schema, metadata):
        for md in metadata:
            notable_metadata = {k: v for k, v in md["metadata"].items() if k in {"inclusion", "selected"}}
            if md["breadcrumb"] == []:
                schema.update(notable_metadata)
            else:
                # Assume only one level deep breadcrumbs
                property_name = md["breadcrumb"][1]
                schema["properties"][property_name].update(notable_metadata)
        return schema
    
    def __annotate_catalog_entry(self, entry):
        entry["schema"] = self.__annotate_schema_with_metadata(entry['schema'], entry['metadata'])
        return entry