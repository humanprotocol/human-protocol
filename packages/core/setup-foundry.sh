#!/bin/bash

if command -v forge &> /dev/null; then
    echo "Forge is already installed."
    echo "Forge version is $(forge --version)"
else
    echo "Forge is not installed, installing Foundry..."
    curl -L https://foundry.paradigm.xyz | bash

    sleep 10

    if command -v foundryup &> /dev/null; then
        foundryup || echo "Failed to run foundryup."
        if command -v forge &> /dev/null; then
            echo "Forge installation was successful."
            echo "Forge version is $(forge --version)"
        else
            echo "Forge installation failed. Please check your PATH or Foundry installation."
            exit 1
        fi
    else
        echo "foundryup command not found. Please ensure the Foundry installation script ran successfully and your PATH is correctly updated."
        exit 1
    fi
fi
