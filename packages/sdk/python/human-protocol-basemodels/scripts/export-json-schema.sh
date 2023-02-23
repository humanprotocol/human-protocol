#!/bin/bash

cat << EOF > pyscript.py
#!/usr/bin/python3
import json
# from basemodels import Manifest, Preprocess
from basemodels.pydantic.manifest.manifest import Manifest
from basemodels.pydantic.manifest.data.preprocess import Preprocess

def export_json_schema(cls, file_name):
    with open(file_name, "w") as outfile:
        outfile.write(cls.schema_json(indent=2))

export_json_schema(Manifest, "../../json-schema/manifest.json")
export_json_schema(Preprocess, "../../json-schema/preprocess.json")

EOF

chmod 755 pyscript.py

pipenv run python ./pyscript.py

rm -rf pyscript.py
