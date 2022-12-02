#!/bin/bash

yarn workspace @human-protocol/core local &

sleep 5

npx jest

trap 'kill $(jobs -p)' EXIT
