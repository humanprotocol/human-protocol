#!/bin/bash

# Run forge build
forge build --silent

for file in ./out/*.sol/*.json; do
    if [[ -f "$file" ]]; then
        echo "Extracting ABI from $file"
        jq '.abi' "$file"
    fi
done