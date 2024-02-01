#!/bin/bash

FOUND_BIN="$HOME/.foundry/bin"

if ! command -v cargo &> /dev/null; then
    echo "Rust and Cargo are not installed. Installing now..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    source "$HOME/.cargo/env"
fi

echo "Installing or updating Foundry..."
curl -L https://foundry.paradigm.xyz | bash

export PATH="$FOUND_BIN:$PATH"
echo "Updated PATH to include Foundry bin: $PATH"

if [ -x "$FOUND_BIN/foundryup" ]; then
    echo "Running foundryup to update Foundry tools..."
    "$FOUND_BIN/foundryup"
else
    echo "Foundryup is not found or executable. Installation may have failed."
    exit 1
fi

if command -v forge &> /dev/null; then
    echo "Forge is installed. Version: $(forge --version)"
else
    echo "Forge installation failed or Forge is not in your PATH."
    exit 1
fi

forge build
node postProcessABIs.js
yarn abi:typechain
