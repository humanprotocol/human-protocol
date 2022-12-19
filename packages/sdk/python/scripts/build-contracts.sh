#!/bin/bash
set -eux

yarn workspace @human-protocol/core compile
cp -r ../../core/artifacts/contracts .
