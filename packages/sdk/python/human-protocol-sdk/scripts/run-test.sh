#!/bin/bash
set -eux

# Run hardhat node, and deploy contract locally
yarn workspace @human-protocol/core local &

# Wait for the contracts to be deployed properly
sleep 10

# Run test
pipenv run pytest ./test/human_protocol_sdk/storage/test_storage.py

# Kill running hardhat node
trap 'kill $(jobs -p)' EXIT
