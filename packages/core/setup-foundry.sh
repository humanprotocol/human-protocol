#!/bin/bash

FOUNDRY_BIN="$HOME/.foundry/bin"

if [ -x "$FOUNDRY_BIN/forge" ]; then
    echo "Forge is already installed."
    "$FOUNDRY_BIN/forge" --version
else
    echo "Installing Foundry..."
    curl -L https://foundry.paradigm.xyz | bash

    if [ -x "$FOUNDRY_BIN/forge" ]; then
        echo "Forge installation was successful."
        "$FOUNDRY_BIN/forge" --version
    else
        echo "Forge installation failed or Forge is not in your PATH."
        exit 1
    fi
fi

if [ -x "$FOUNDRY_BIN/forge" ]; then
    "$FOUNDRY_BIN/forge" build
    node postProcessABIs.js
    yarn abi:typechain
else
    echo "Unable to locate forge command."
    exit 1
fi
