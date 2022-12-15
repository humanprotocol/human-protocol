#!/bin/bash
set -eux

# Run hardhat node, and deploy contract locally
yarn workspace @human-protocol/core local &

# Wait for the contracts to be deployed properly
sleep 5

# Run test
pipenv run pytest ./human_protocol_sdk/*.py

# Kill running hardhat node
trap 'kill $(jobs -p)' EXIT
