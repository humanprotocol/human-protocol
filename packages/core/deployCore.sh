#!/bin/bash

# Run forge build
forge build --silent

# Extract the contract name from the path (adjust the path pattern as needed)
for file in ./out/*.sol/*.json; do
    if [[ -f "$file" ]]; then
        echo "Extracting ABI from $file"
        jq '.abi' "$file"
    fi
done