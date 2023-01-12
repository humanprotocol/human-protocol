#!/bin/bash
set -eux

rm -rf contracts
yarn workspace @human-protocol/core compile
cp -r ../../core/artifacts/contracts .
