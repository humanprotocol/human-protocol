#!/bin/bash

# Check if forge is already installed
if command -v forge &> /dev/null; then
    echo "Forge is already installed."
    
else
    echo "Forge is not installed, installing Foundry..."
    curl -L https://foundry.paradigm.xyz | bash
    forge --version
    echo "Forge version is $(forge --version)"

    source $HOME/.profile || source $HOME/.bashrc || echo "Note: Unable to source profile files. You may need to manually update your PATH or start a new shell session."

    sleep 10

    if command -v foundryup &> /dev/null; then
        foundryup || echo "Failed to run foundryup."
    else
        echo "foundryup
