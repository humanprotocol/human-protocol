#!/bin/bash

cat << EOF > pyscript.py
#!/usr/bin/python3
import json
from basemodels import Manifest

# Writing to manifest.json
with open("../../json-schema/manifest.json", "w") as outfile:
    outfile.write(Manifest.schema_json(indent=2))

EOF

chmod 755 pyscript.py

pipenv run python ./pyscript.py

rm -rf pyscript.py
