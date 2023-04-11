#!/bin/bash
set -eux

rm -rf artifacts
yarn workspace @human-protocol/core compile
cp -r ../../../core/artifacts .
