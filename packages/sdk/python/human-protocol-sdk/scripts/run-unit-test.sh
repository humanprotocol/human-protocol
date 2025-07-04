#!/bin/bash
set -eux

# Run test
pipenv run pytest -s ./test/human_protocol_sdk/operator/test_operator_utils.py