#!/bin/sh
set -eu

REPO_URL="https://github.com/humanprotocol/human-protocol.git"

# Branch name
CURRENT_BRANCH="${CURRENT_BRANCH:-${GITHUB_REF_NAME:-${CI_COMMIT_REF_NAME:-${BITBUCKET_BRANCH:-${VERCEL_GIT_COMMIT_REF:-${HEAD:-${BRANCH:-}}}}}}}"
if [ -z "$CURRENT_BRANCH" ] && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"
fi
[ -n "$CURRENT_BRANCH" ] || CURRENT_BRANCH="unknown"


# Helpers
in_git_repo() { git rev-parse --is-inside-work-tree >/dev/null 2>&1; }
has_origin()  { git remote get-url origin >/dev/null 2>&1; }

# Ensure origin exists + fetch main
if in_git_repo; then
  if ! has_origin && [ -n "$REPO_URL" ]; then
    git remote add origin "$REPO_URL" || true
  fi
  git fetch --depth=1 origin main >/dev/null 2>&1 || true
fi

# Change detection vs main

SDK_CHANGED=false
CORE_CHANGED=false
LOGGER_CHANGED=false
ALWAYS_UPDATE=false

if [ "$CURRENT_BRANCH" = "main" ]; then
  ALWAYS_UPDATE=true
else
  if in_git_repo && git rev-parse --verify origin/main >/dev/null 2>&1; then
    MERGE_BASE="$(git merge-base "$CURRENT_BRANCH" origin/main 2>/dev/null || true)"
    if [ -n "$MERGE_BASE" ]; then
      if git diff --quiet "$MERGE_BASE" -- packages/sdk;            then SDK_CHANGED=false; else SDK_CHANGED=true; fi
      if git diff --quiet "$MERGE_BASE" -- packages/core;           then CORE_CHANGED=false; else CORE_CHANGED=true; fi
      if git diff --quiet "$MERGE_BASE" -- packages/libs/logger;    then LOGGER_CHANGED=false; else LOGGER_CHANGED=true; fi
    else
      echo "Could not determine merge-base with origin/main. Proceeding without change flags."
    fi
  else
    echo "No usable origin/main for diffs. Proceeding with defaults."
  fi
fi

# Dependency updater

env_is_set() {
  eval "[ -n \"\${$1+x}\" ]"
}

update_dependency() {
  DEP_NAME="$1"
  ENV_VAR_NAME="$2"

  if env_is_set "$ENV_VAR_NAME"; then
    eval "VERSION=\${$ENV_VAR_NAME}"
    if [ -z "${VERSION}" ]; then
      echo "$ENV_VAR_NAME is set but empty. Please provide a non-empty version (e.g. 3.2.1)."
      exit 1
    fi
    echo "Using $DEP_NAME from $ENV_VAR_NAME: $VERSION"
  else
    VERSION="$(npm view "$DEP_NAME" version 2>/dev/null || true)"
    if [ -z "$VERSION" ]; then
      echo "Could not fetch latest version of $DEP_NAME from npm."
      exit 1
    fi
    echo "Latest $DEP_NAME on npm: $VERSION"
  fi

  SAFE_VERSION=$(printf '%s' "$VERSION" | sed 's/[\\&/]/\\&/g')
  OS="$(uname -s 2>/dev/null || echo unknown)"
  REPLACEMENT="\"$DEP_NAME\": \"npm:$DEP_NAME@$SAFE_VERSION\""

  FILES=$(grep -rl --include=package.json -E "\"$DEP_NAME\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" . || true)
  [ -n "$FILES" ] || { echo "No package.json files with \"$DEP_NAME\" found."; return; }

  for FILE in $FILES; do
    echo "Updating $FILE for $DEP_NAME"
    if [ "$OS" = "Darwin" ]; then
      sed -i '' -E "s|(\"$DEP_NAME\"[[:space:]]*:[[:space:]]*\")[^\"]*\"|$REPLACEMENT|g" "$FILE"
    else
      sed -i -E "s|(\"$DEP_NAME\"[[:space:]]*:[[:space:]]*\")[^\"]*\"|$REPLACEMENT|g" "$FILE"
    fi
  done
}

should_update_sdk() {
  if env_is_set "HUMAN_SDK_VERSION"; then return 0; fi
  if [ "$ALWAYS_UPDATE" = "true" ]; then return 0; fi
  if [ "$CORE_CHANGED" = "true" ]; then return 1; fi
  if [ "$SDK_CHANGED" = "true" ]; then return 1; fi
  return 0
}
should_update_core() {
  if env_is_set "HUMAN_CORE_VERSION"; then return 0; fi
  if [ "$ALWAYS_UPDATE" = "true" ]; then return 0; fi
  if [ "$CORE_CHANGED" = "true" ]; then return 1; fi
  return 0
}
should_update_logger() {
  if env_is_set "HUMAN_LOGGER_VERSION"; then return 0; fi
  if [ "$ALWAYS_UPDATE" = "true" ]; then return 0; fi
  if [ "$LOGGER_CHANGED" = "true" ]; then return 1; fi
  return 0
}

# Apply updates

# SDK
if env_is_set "HUMAN_SDK_VERSION"; then
  echo "HUMAN_SDK_VERSION provided → updating SDK."
  update_dependency "@human-protocol/sdk" "HUMAN_SDK_VERSION"
elif should_update_sdk; then
  echo "Updating SDK."
  update_dependency "@human-protocol/sdk" "HUMAN_SDK_VERSION"
else
  echo "Skipping SDK update."
fi

# CORE
if env_is_set "HUMAN_CORE_VERSION"; then
  echo "HUMAN_CORE_VERSION provided → updating Core."
  update_dependency "@human-protocol/core" "HUMAN_CORE_VERSION"
elif should_update_core; then
  echo "Updating Core."
  update_dependency "@human-protocol/core" "HUMAN_CORE_VERSION"
else
  echo "Skipping Core update."
fi

# LOGGER
if env_is_set "HUMAN_LOGGER_VERSION"; then
  echo "HUMAN_LOGGER_VERSION provided → updating Logger."
  update_dependency "@human-protocol/logger" "HUMAN_LOGGER_VERSION"
elif should_update_logger; then
  echo "Updating Logger."
  update_dependency "@human-protocol/logger" "HUMAN_LOGGER_VERSION"
else
  echo "Skipping Logger update."
fi

echo "Done."