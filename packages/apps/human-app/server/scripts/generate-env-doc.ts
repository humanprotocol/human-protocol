import * as fs from 'fs';
import * as path from 'path';

const CONFIG_FOLDER_PATH = path.join(__dirname, '../src/common/config');
const OUTPUT_FILE_PATH = path.join(__dirname, '../ENV.md');

const envVarRegex =
  /(?:this\.configService\.)?(?:getOrThrow|get)(?:<[\w<>[\]]+>)?\(\s*'(\w+)'\s*(?:,\s*[^)]*)?\)/gs;
const commentRegex = /\/\*\*([^*]*\*+([^/*][^*]*\*+)*)\//g;

function extractEnvVarsWithComments(content: string) {
  const envVarsWithComments: { comment: string; envVar: string }[] = [];
  let match: RegExpExecArray | null;

  // Extract comments
  const comments: string[] = [];
  while ((match = commentRegex.exec(content)) !== null) {
    const cleanedComment = match[1]
      .split('\n') // Split the comment by lines
      .map((line) => line.replace(/^\s*\*\s?/, '').trim()) // Remove leading * and extra whitespace
      .filter((line) => line.length > 0) // Remove any empty lines
      .join('\n'); // Join lines back with line breaks
    comments.push(cleanedComment);
  }

  // Extract environment variables and their comments
  const envVarsMap = new Map<string, string>();
  let commentIndex = 0;

  while ((match = envVarRegex.exec(content)) !== null) {
    const envVar = match[1];
    if (!envVarsMap.has(envVar)) {
      if (comments[commentIndex]) {
        const comment = comments[commentIndex];
        envVarsMap.set(envVar, comment);
      }
      commentIndex++;
    }
  }

  envVarsMap.forEach((comment, envVar) => {
    envVarsWithComments.push({ comment, envVar });
  });

  return envVarsWithComments;
}

function generateEnvMarkdown(
  envVarsWithComments: { comment: string; envVar: string }[],
) {
  let markdown = '# Environment Variables\n\n';
  let currentSection: string | null = null;

  envVarsWithComments.forEach(({ comment, envVar }) => {
    if (comment.startsWith('Web3 config variables')) {
      if (currentSection) {
        markdown += `\n\n`;
      }
      markdown += `## ${comment}\n\n`;
      currentSection = comment;
    } else {
      markdown += `### ${envVar}\n`;
      markdown += `${comment}\n\n`;
    }
  });

  return markdown;
}

function processConfigFiles() {
  const files = fs
    .readdirSync(CONFIG_FOLDER_PATH)
    .filter(
      (file) =>
        file.endsWith('.ts') &&
        !['index.ts', 'env-schema.ts', 'config.module.ts', 'cache-factory.config.ts', 'common-config.module.ts', 'gateway-config.service.ts', 'gateway-config.types.ts', 'params-decorators.ts', 'spec'].includes(file),
    );

  let allEnvVarsWithComments: { comment: string; envVar: string }[] = [];

  files.forEach((file) => {
    const filePath = path.join(CONFIG_FOLDER_PATH, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const envVarsWithComments = extractEnvVarsWithComments(content);
    allEnvVarsWithComments = allEnvVarsWithComments.concat(envVarsWithComments);
  });

  const markdown = generateEnvMarkdown(allEnvVarsWithComments);
  fs.writeFileSync(OUTPUT_FILE_PATH, markdown, 'utf-8');
}

processConfigFiles();
