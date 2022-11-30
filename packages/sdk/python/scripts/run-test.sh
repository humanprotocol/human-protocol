#!/bin/bash

yarn workspace @human-protocol/core local &

sleep 5

pipenv run pytest

trap 'kill $(jobs -p)' EXIT
