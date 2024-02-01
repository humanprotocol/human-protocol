#!/bin/bash

if ! command -v cargo &> /dev/null; then
    echo "Cargo (Rust) is not installed, installing now..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    source "$HOME/.cargo/env"
fi

FOUNDRY_BIN="$HOME/.foundry/bin"

if [ ! -x "$FOUNDRY_BIN/forge" ]; then
    echo "Installing Foundry..."
    curl -L https://foundry.paradigm.xyz | bash
    export PATH="$FOUNDRY_BIN:$PATH"
fi

if ! command -v forge &> /dev/null; then
    echo "Forge installation failed or Forge is not in your PATH."
    exit 1
else
    echo "Forge is installed."
    forge --version
fi


