#!/bin/bash

FOUNDRY_BIN="$HOME/.foundry/bin"

add_foundry_to_path() {
    export PATH="$FOUNDRY_BIN:$PATH"
}

if [ -x "$FOUNDRY_BIN/forge" ]; then
    echo "Forge is already installed."
else
    echo "Installing Foundry..."
    curl -L https://foundry.paradigm.xyz | bash
    # Add Foundry's bin directory to PATH
    add_foundry_to_path
fi

if forge --version; then
    echo "Forge installation verified."
else
    echo "Forge installation failed or Forge is not in your PATH."
    exit 1
fi

echo "Building with Foundry..."
if forge build; then
    echo "Build successful."
else
    echo "Build failed with Forge."
    exit 1
fi

echo "Running post-processing scripts..."
if node postProcessABIs.js && yarn abi:typechain; then
    echo "Post-processing successful."
else
    echo "Post-processing failed."
    exit 1
fi
