#!/bin/bash

if ! command -v cargo &> /dev/null; then
    echo "Rust and Cargo are not installed. Installing now..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    source "$HOME/.cargo/env"
else
    echo "Rust and Cargo are already installed."
fi

FOUND_BIN="$HOME/.foundry/bin"

if [ ! -f "$FOUND_BIN/forge" ]; then
    echo "Installing Foundry..."
    curl -L https://foundry.paradigm.xyz | bash
fi

if [ -f "$FOUND_BIN/foundryup" ]; then
    "$FOUND_BIN/foundryup"
else
    echo "Foundry installation seems to have failed. `foundryup` not found."
    exit 1
fi

if [ -f "$FOUND_BIN/forge" ]; then
    echo "Forge version: "
    "$FOUND_BIN/forge" --version
else
    echo "Forge installation failed or Forge is not in your PATH."
    exit 1
fi

echo "Building with Foundry..."
"$FOUND_BIN/forge" build

node postProcessABIs.js
yarn abi:typechain
