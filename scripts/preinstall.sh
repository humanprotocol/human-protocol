#!/bin/sh
set -eu

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

SDK_CHANGED=false
CORE_CHANGED=false
LOGGER_CHANGED=false
ALWAYS_UPDATE=false

if [ "$CURRENT_BRANCH" = "main" ]; then
  ALWAYS_UPDATE=true
else
  if ! git show-ref --verify --quiet refs/remotes/origin/main; then
    git fetch origin main
  fi

  MERGE_BASE="$(git merge-base "$CURRENT_BRANCH" origin/main || true)"
  if [ -z "$MERGE_BASE" ]; then
    echo "Could not determine merge-base with origin/main."
    exit 1
  fi

  # Set flags based on diffs with main branch
  if git diff --quiet "$MERGE_BASE" -- packages/sdk; then SDK_CHANGED=false; else SDK_CHANGED=true; fi
  if git diff --quiet "$MERGE_BASE" -- packages/core; then CORE_CHANGED=false; else CORE_CHANGED=true; fi
  if git diff --quiet "$MERGE_BASE" -- packages/libs/logger; then LOGGER_CHANGED=false; else LOGGER_CHANGED=true; fi
fi

env_is_set() {
  eval "[ -n \"\${$1+x}\" ]"
}

update_dependency() {
  DEP_NAME="$1"
  ENV_VAR_NAME="$2"

  # If ENV_VAR_NAME is set, use it; else fetch latest from npm
  if env_is_set "$ENV_VAR_NAME"; then
    eval "VERSION=\${$ENV_VAR_NAME}"
    if [ -z "${VERSION}" ]; then
      echo "$ENV_VAR_NAME is set but empty. Please provide a non-empty version (e.g. 3.2.1)."
      exit 1
    fi
    echo "Using $ENV_VAR_NAME from environment: $VERSION"
  else
    VERSION="$(npm view "$DEP_NAME" version 2>/dev/null || true)"
    if [ -z "$VERSION" ]; then
      echo "Could not fetch latest version of $DEP_NAME from npm."
      exit 1
    fi
    echo "Latest $DEP_NAME version on npm: $VERSION"
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

# SDK
if env_is_set "HUMAN_SDK_VERSION"; then
  echo "HUMAN_SDK_VERSION provided → updating SDK regardless of changes."
  update_dependency "@human-protocol/sdk" "HUMAN_SDK_VERSION"
else
  if [ "$ALWAYS_UPDATE" = "true" ]; then
    echo "On $CURRENT_BRANCH: updating SDK."
    update_dependency "@human-protocol/sdk" "HUMAN_SDK_VERSION"
  else
    if [ "$CORE_CHANGED" = "true" ]; then
      echo "Core has changes. Skipping SDK update (no env override)." #Because of dependency of SDK with Core
    elif [ "$SDK_CHANGED" = "true" ]; then
      echo "SDK has changes. Skipping SDK update (no env override)."
    else
      echo "SDK has no changes. Updating SDK."
      update_dependency "@human-protocol/sdk" "HUMAN_SDK_VERSION"
    fi
  fi
fi

# CORE
if env_is_set "HUMAN_CORE_VERSION"; then
  echo "HUMAN_CORE_VERSION provided → updating Core regardless of changes."
  update_dependency "@human-protocol/core" "HUMAN_CORE_VERSION"
else
  if [ "$ALWAYS_UPDATE" = "true" ]; then
    echo "On $CURRENT_BRANCH: updating Core."
    update_dependency "@human-protocol/core" "HUMAN_CORE_VERSION"
  else
    if [ "$CORE_CHANGED" = "true" ]; then
      echo "Core has changes. Skipping Core update (no env override)."
    else
      echo "Core has no changes. Updating Core."
      update_dependency "@human-protocol/core" "HUMAN_CORE_VERSION"
    fi
  fi
fi

# LOGGER
if env_is_set "HUMAN_LOGGER_VERSION"; then
  echo "HUMAN_LOGGER_VERSION provided → updating Logger regardless of changes."
  update_dependency "@human-protocol/logger" "HUMAN_LOGGER_VERSION"
else
  if [ "$ALWAYS_UPDATE" = "true" ]; then
    echo "On $CURRENT_BRANCH: updating Logger."
    update_dependency "@human-protocol/logger" "HUMAN_LOGGER_VERSION"
  else
    if [ "$LOGGER_CHANGED" = "true" ]; then
      echo "Logger has changes. Skipping Logger update (no env override)."
    else
      echo "Logger has no changes. Updating Logger."
      update_dependency "@human-protocol/logger" "HUMAN_LOGGER_VERSION"
    fi
  fi
fi

echo "Done."
