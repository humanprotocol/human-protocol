#!/bin/bash

yarn workspace @human-protocol/core local &

yarn test

trap 'kill $(jobs -p)' EXIT
