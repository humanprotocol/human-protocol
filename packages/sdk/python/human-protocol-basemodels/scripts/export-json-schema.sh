#!/bin/bash

cat << EOF > pyscript.py
#!/usr/bin/python3
import json
from basemodels import Manifest, Preprocess

def export_json_schema(cls, file_name):
    with open(file_name, "w") as outfile:
        outfile.write(cls.schema_json(indent=2))

export_json_schema(Manifest, "../../json-schema/manifest.json")
export_json_schema(Preprocess, "../../json-schema/preprocess.json")

EOF

chmod 755 pyscript.py

pipenv run python ./pyscript.py

rm -rf pyscript.py
