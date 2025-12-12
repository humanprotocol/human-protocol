import childProcess from 'child_process';
import fs from 'fs';
import readline from 'readline';


function maybeCreateGitTagForPackage({ name, version }) {
  if (!name || !version) {
    console.warn('Missing package data for git tag, skipping', { name, version });
    return;
  }

  const tag = `js/${name}@${version}`;

  try {
    childProcess.execSync(`git rev-parse --verify ${tag}`, { stdio: "ignore" });
    console.warn(`Git tag already exists, skipping: ${tag}`);
  } catch {
    childProcess.execSync(`git tag -a "${tag}" -m "Released JS package: @human-protocol/${name} - ${version}"`);
    console.log(`Created tag: ${tag}`);
  }
}

async function tagPublishedPackages(publishLogFilePath) {
  if (!publishLogFilePath || !fs.existsSync(publishLogFilePath)) {
    throw new Error(`Publish log file not found: ${publishLogFilePath}`);
  }

  const logFileStream = fs.createReadStream(publishLogFilePath);

  const logFileRl = readline.createInterface({
    input: logFileStream,
    crlfDelay: Infinity,
  });

  for await (const logLine of logFileRl) {
    let logEntry;
    try {
      logEntry = JSON.parse(logLine);
    } catch {
      continue;
    }

    const {
      published: isPublished,
      name: packageName,
      version: packageVersion,
    } = logEntry;
    if (isPublished && packageName && packageVersion) {
      console.log(`Found published package: ${packageName} - ${packageVersion}`);

      maybeCreateGitTagForPackage({
        name: packageName,
        version: packageVersion,
      });
    }
  }
}


(async () => {
  try {
    const publishLogFilePath = process.argv[2];
    await tagPublishedPackages(publishLogFilePath);

    process.exit(0);
  } catch (error) {
    console.error('Failed to create git tags for published packages', error);
    process.exit(1);
  }
})();