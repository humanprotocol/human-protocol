#!/bin/bash

yarn workspace @human-protocol/core local &

npx jest

trap 'kill $(jobs -p)' EXIT
