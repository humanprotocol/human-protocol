#!/bin/bash
set -eux

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../../.." && pwd)"

rm -rf artifacts
cp -r "${REPO_ROOT}/node_modules/@human-protocol/core/artifacts" .
