#!/bin/bash

yarn workspace @human-protocol/core local &

sleep 5

pipenv run python -m unittest discover

trap 'kill $(jobs -p)' EXIT
