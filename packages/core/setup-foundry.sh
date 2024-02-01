#!/bin/bash

FOUND_BIN="/home/runner/.foundry/bin"

source /home/runner/.bashrc || echo "Unable to source /home/runner/.bashrc"

if command -v forge &> /dev/null; then
    echo "Forge is available. Version: $(forge --version)"
else
    echo "Attempting to install or update Foundry..."
    curl -L https://foundry.paradigm.xyz | bash
    export PATH="$FOUND_BIN:$PATH"
    echo "Attempting to source bashrc again..."
    source /home/runner/.bashrc || echo "Still unable to source /home/runner/.bashrc"
    if command -v forge &> /dev/null; then
        echo "Forge installation verified. Version: $(forge --version)"
    else
        echo "Forge installation failed or Forge is not in your PATH."
        exit 1
    fi
fi

forge build
node postProcessABIs.js
yarn abi:typechain
