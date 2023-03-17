#!/bin/bash

set -e

CURR_DIR=$(basename $(pwd))
if [ "$CURR_DIR" != "mx" ]; then
    echo "Please run this script from the packages/mx folder"
    exit 1
fi


SMART_CONTRACT_JSONS=$(find . -name "multiversx.json")
for smart_contract_json in $SMART_CONTRACT_JSONS
do
    smart_contract_folder=$(dirname $smart_contract_json)
    echo "> Building $smart_contract_folder"
    (set -x; mxpy --verbose contract build $smart_contract_folder)
    echo "> Done"
    echo ""
done
