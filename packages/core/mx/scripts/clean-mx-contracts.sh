#!/bin/bash

set -e
CURR_DIR=$(basename $(pwd))
if [ "$CURR_DIR" != "mx" ]; then
    echo "Please run this script from the packages/mx folder"
    exit 1
fi


# cleans all wasm targets
SMART_CONTRACT_JSONS=$(find . -name "multiversx.json")
for smart_contract_json in $SMART_CONTRACT_JSONS
do
    smart_contract_folder=$(dirname $smart_contract_json)
    echo ""
    (set -x; mxpy --verbose contract clean $smart_contract_folder)
done

# not wasm, but worth cleaning from time to time
cargo clean
