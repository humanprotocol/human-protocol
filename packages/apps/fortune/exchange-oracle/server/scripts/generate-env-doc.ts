import * as fs from 'fs';
import * as path from 'path';

const CONFIG_FOLDER_PATH = path.join(__dirname, '../src/common/config');
const OUTPUT_FILE_PATH = path.join(__dirname, '../ENV.md');

const envVarRegex =
  /(?:this\.configService\.)?(?:getOrThrow|get)(?:<[\w<>[\]]+>)?\(\s*'(\w+)'\s*(?:,\s*([^)]*))?\)/gs; // captures variable name and additional options
const commentRegex = /\/\*\*([^*]*\*+([^/*][^*]*\*+)*)\//g; // captures comments

function extractEnvVarsWithComments(content: string) {
  const envVarsWithComments: {
    comment: string;
    envVar: string;
    defaultValue?: string;
  }[] = [];
  let match: RegExpExecArray | null;

  // Extract comments
  const comments: string[] = [];
  while ((match = commentRegex.exec(content)) !== null) {
    const cleanedComment = match[1]
      .split('\n') // Split the comment by lines
      .map((line) => line.replace(/^\s*\*\s?/, '').trim()) // Remove leading * and extra whitespace
      .filter((line) => line.length > 0) // Remove any empty lines
      .join(' '); // Join lines back with spaces (not line breaks)
    comments.push(cleanedComment);
  }

  // Extract environment variables and their comments
  const envVarsMap = new Map<
    string,
    { comment: string; defaultValue?: string; required?: boolean }
  >();
  let commentIndex = 0;

  while ((match = envVarRegex.exec(content)) !== null) {
    const envVar = match[1];
    const additionalOptions = match[2]; // capture additional options

    if (!envVarsMap.has(envVar)) {
      const comment = comments[commentIndex] || '';
      let required = false;
      let defaultValue: string | undefined;

      // Check if the additional options include a default value or a required marker
      if (additionalOptions) {
        const defaultMatch = additionalOptions.match(/['"]([^'"]+)['"]/); // Match default values inside quotes
        if (defaultMatch) {
          defaultValue = defaultMatch[1];
        }
        required = additionalOptions.includes('required');
      }

      // Check for default values in comments
      const defaultCommentMatch = comment.match(
        /Default:\s*['"]?([^'"]+)['"]?/,
      );
      if (defaultCommentMatch) {
        defaultValue = defaultCommentMatch[1];
      }

      envVarsMap.set(envVar, {
        comment: `${comment}${required ? ' (Required)' : ''}${defaultValue ? `` : ''}`,
        defaultValue,
        required,
      });
      commentIndex++;
    }
  }

  envVarsMap.forEach(({ comment, defaultValue }, envVar) => {
    envVarsWithComments.push({ comment, envVar, defaultValue });
  });

  return envVarsWithComments;
}

function generateEnvMarkdown(
  envVarsWithComments: {
    comment: string;
    envVar: string;
    defaultValue?: string;
  }[],
) {
  let markdown = '# Environment Variables\n\n';

  envVarsWithComments.forEach(({ comment, envVar, defaultValue }) => {
    markdown += `### ${comment}\n${envVar}${defaultValue !== undefined ? `="${defaultValue}"` : '='}\n\n`;
  });

  return markdown;
}

function processConfigFiles() {
  const files = fs
    .readdirSync(CONFIG_FOLDER_PATH)
    .filter(
      (file) =>
        file.endsWith('.ts') &&
        ![
          'index.ts',
          'env-schema.ts',
          'config.module.ts',
          'cache-factory.config.ts',
          'common-config.module.ts',
          'gateway-config.service.ts',
          'gateway-config.types.ts',
          'params-decorators.ts',
          'spec',
        ].includes(file),
    );

  let allEnvVarsWithComments: {
    comment: string;
    envVar: string;
    defaultValue?: string;
  }[] = [];

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
