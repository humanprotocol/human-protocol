#!/bin/bash
set -eux

rm -rf artifacts
yarn workspace @human-protocol/core build
cp -r ../../../core/artifacts .
