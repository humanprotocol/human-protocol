#!/bin/sh
set -eu

WORKSPACE_NAME="${1:-}"
if [ -z "$WORKSPACE_NAME" ]; then
  echo "Usage: $0 <workspace-package-name>"
  exit 1
fi

REPO_URL="https://github.com/humanprotocol/human-protocol.git"

in_git_repo() { git rev-parse --is-inside-work-tree >/dev/null 2>&1; }
has_origin()  { git remote get-url origin >/dev/null 2>&1; }

# Branch name
CURRENT_BRANCH="${CURRENT_BRANCH:-${GITHUB_REF_NAME:-${CI_COMMIT_REF_NAME:-${BITBUCKET_BRANCH:-${VERCEL_GIT_COMMIT_REF:-${HEAD:-${BRANCH:-}}}}}}}"
if [ -z "$CURRENT_BRANCH" ] && in_git_repo; then
  CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"
fi
[ -n "$CURRENT_BRANCH" ] || CURRENT_BRANCH="unknown"

if in_git_repo; then
  if ! has_origin && [ -n "$REPO_URL" ]; then
    git remote add origin "$REPO_URL" || true
  fi
  git fetch origin main >/dev/null 2>&1 || true
fi

SDK_CHANGED=false
CORE_CHANGED=false
LOGGER_CHANGED=false

if [ "${USE_NPM_PACKAGES:-}" = "true" ]; then
  SDK_CHANGED=false
  CORE_CHANGED=false
  LOGGER_CHANGED=false
elif [ "$CURRENT_BRANCH" != "main" ]; then
  if in_git_repo && git rev-parse --verify origin/main >/dev/null 2>&1; then
    CHANGED_FILES="$(git diff --name-only origin/main HEAD 2>/dev/null || true)"
    if [ -n "$CHANGED_FILES" ]; then
      echo "$CHANGED_FILES" | grep -q '^packages/sdk/typescript/human-protocol-sdk/' && SDK_CHANGED=true || true
      echo "$CHANGED_FILES" | grep -q '^packages/core/' && CORE_CHANGED=true || true
      echo "$CHANGED_FILES" | grep -q '^packages/libs/logger/' && LOGGER_CHANGED=true || true
    fi
  else
    echo "No usable origin/main for diffs. Proceeding without change flags."
  fi
fi

export WORKSPACE_NAME
export SDK_CHANGED
export CORE_CHANGED
export LOGGER_CHANGED

node <<'NODE'
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const workspace = process.env.WORKSPACE_NAME;
let repoRoot = process.cwd();
try {
  repoRoot = cp.execSync("git rev-parse --show-toplevel", { stdio: ["ignore", "pipe", "ignore"] })
    .toString()
    .trim();
} catch {
  // Fall back to current working directory if not in a git repo.
}
const sdkChanged = process.env.SDK_CHANGED === "true";
const coreChanged = process.env.CORE_CHANGED === "true";
const loggerChanged = process.env.LOGGER_CHANGED === "true";

// Map workspace package names to their package.json paths
const workspaceMap = {
  "@apps/job-launcher-server": "packages/apps/job-launcher/server/package.json",
  "@apps/human-app-server": "packages/apps/human-app/server/package.json",
  "@apps/reputation-oracle-server": "packages/apps/reputation-oracle/server/package.json",
  "@apps/dashboard-server": "packages/apps/dashboard/server/package.json",
  "@apps/fortune-exchange-oracle-server": "packages/apps/fortune/exchange-oracle/server/package.json",
  "@apps/fortune-recording-oracle": "packages/apps/fortune/recording-oracle/package.json",
  "@human-protocol/core": "packages/core/package.json",
  "@human-protocol/sdk": "packages/sdk/typescript/human-protocol-sdk/package.json",
  "@human-protocol/logger": "packages/libs/logger/package.json"
};

const workspacePackageJson = workspaceMap[workspace];
if (!workspacePackageJson) {
  console.error(`Workspace "${workspace}" not found in workspace map.`);
  console.error("Add it to workspaceMap in scripts/preinstall2.sh.");
  process.exit(1);
}

const packageJsonPath = path.join(repoRoot, workspacePackageJson);
if (!fs.existsSync(packageJsonPath)) {
  console.error(`package.json not found at ${packageJsonPath}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const depBlocks = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];

let updated = false;
for (const block of depBlocks) {
  const deps = pkg[block];
  if (!deps) continue;
  for (const [depName, depVersion] of Object.entries(deps)) {
    if (depVersion !== "workspace:*") continue;
    if (depName === "@human-protocol/sdk" && sdkChanged) {
      console.log("Skipping @human-protocol/sdk replacement due to local changes.");
      continue;
    }
    if (depName === "@human-protocol/core" && coreChanged) {
      console.log("Skipping @human-protocol/core replacement due to local changes.");
      continue;
    }
    if (depName === "@human-protocol/logger" && loggerChanged) {
      console.log("Skipping @human-protocol/logger replacement due to local changes.");
      continue;
    }
    let latest = "";
    try {
      latest = cp.execSync(`npm view ${depName} version`, {
        stdio: ["ignore", "pipe", "ignore"]
      })
        .toString()
        .trim();
    } catch {
      console.error(`Failed to fetch latest version for ${depName}`);
      process.exit(1);
    }
    if (!latest) {
      console.error(`No version returned for ${depName}`);
      process.exit(1);
    }
    deps[depName] = `npm:${depName}@${latest}`;
    updated = true;
    console.log(`Updated ${depName} -> npm:${depName}@${latest}`);
  }
}

if (updated) {
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`Wrote updates to ${packageJsonPath}`);
} else {
  console.log("No workspace:* dependencies found to update.");
}
NODE

yarn_focus_list=""
if [ "$CORE_CHANGED" = "true" ]; then
  yarn_focus_list="$yarn_focus_list @human-protocol/core @human-protocol/sdk"
elif [ "$SDK_CHANGED" = "true" ]; then
  yarn_focus_list="$yarn_focus_list @human-protocol/sdk"
fi
if [ "$LOGGER_CHANGED" = "true" ]; then
  yarn_focus_list="$yarn_focus_list @human-protocol/logger"
fi

if [ -n "$yarn_focus_list" ]; then
  echo "Focusing workspaces:$yarn_focus_list"
  yarn workspaces focus $yarn_focus_list
  if [ "$CORE_CHANGED" = "true" ]; then
    yarn workspace @human-protocol/core build
    yarn workspace @human-protocol/sdk build
  elif [ "$SDK_CHANGED" = "true" ]; then
    yarn workspace @human-protocol/sdk build
  fi
  if [ "$LOGGER_CHANGED" = "true" ]; then
    yarn workspace @human-protocol/logger build
  fi
fi

yarn workspaces focus "$WORKSPACE_NAME"
yarn workspace "$WORKSPACE_NAME" build