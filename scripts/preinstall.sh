#!/bin/sh
set -eu

WORKSPACE_NAME="${1:-}"
if [ -z "$WORKSPACE_NAME" ]; then
  echo "Usage: $0 <workspace-package-name>"
  exit 1
fi

export WORKSPACE_NAME

node <<'NODE'
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const workspace = process.env.WORKSPACE_NAME;
const repoRoot = process.cwd();

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

yarn workspaces focus "$WORKSPACE_NAME"
