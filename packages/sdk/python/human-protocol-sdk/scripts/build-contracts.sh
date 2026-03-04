#!/bin/bash
set -eux

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../../.." && pwd)"

yarn --cwd "$REPO_ROOT" workspaces focus @human-protocol/python-sdk

yarn --cwd "$REPO_ROOT" workspaces foreach -Rpt --from @human-protocol/python-sdk run build

rm -rf artifacts
cp -r "${REPO_ROOT}/node_modules/@human-protocol/core/artifacts" .

# `workspaces focus` prunes tooling for unrelated packages (e.g. eslint).
# Restore full workspace dependencies after local runs to avoid breaking
# top-level commands like `yarn lint`.
if [[ -z "${CI:-}" ]]; then
  yarn --cwd "$REPO_ROOT" install --mode=skip-build
fi
