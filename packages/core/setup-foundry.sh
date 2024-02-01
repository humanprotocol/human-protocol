#!/bin/bash

# Check if forge is already installed
if ! command -v forge &> /dev/null; then
    echo "Forge is not installed, installing Foundry..."
    curl -L https://foundry.paradigm.xyz | bash
    source $HOME/.profile || source $HOME/.bashrc || echo "Note: If forge command is not found, you may need to manually update your PATH or start a new shell session."
fi

sleep 20

if command -v forge &> /dev/null; then
    echo "Forge version is $(forge --version)"
else
    echo "Forge installation failed or Forge is not in your PATH."
    exit 1
fi

echo "Running forge fmt --check to verify format..."
if forge fmt --check; then
    echo "Format check passed."
else
    echo "Format check failed. Please format your Solidity files."
    exit 1
fi
