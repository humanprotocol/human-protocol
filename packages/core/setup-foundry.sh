#!/bin/bash

if command -v foundryup &> /dev/null; then
    echo "Updating Foundry tools..."
    foundryup
else
    echo "Installing Foundry..."
    curl -L https://foundry.paradigm.xyz | bash
    source $HOME/.profile || source $HOME/.bashrc || echo "Unable to source profile files. You may need to manually update your PATH or start a new shell session."
    foundryup || echo "Failed to run foundryup. Please ensure it's installed and in your PATH."
fi

if command -v forge &> /dev/null; then
    echo "Forge installation verified."
    echo "Forge version is $(forge --version)"
else
    echo "Forge installation failed or Forge is not in your PATH."
    exit 1
fi
