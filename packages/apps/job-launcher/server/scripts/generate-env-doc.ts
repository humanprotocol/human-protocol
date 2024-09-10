import * as fs from 'fs';
import * as path from 'path';

// Define the folder containing configuration files and the output file path
const CONFIG_FOLDER_PATH = path.join(__dirname, '../src/common/config');
const OUTPUT_FILE_PATH = path.join(__dirname, '../ENV.md');

// Regular expressions to match environment variables and their associated comments
const envVarRegex =
  /get\s+(\w+)\(\):\s*[\w<>\[\]]+\s*{\s*return\s*this\.configService\.get<[\w<>\[\]]+>\('(\w+)'/g;
const commentRegex = /\/\*\*([^*]*\*+([^/*][^*]*\*+)*)\//g;

// Function to extract comments and environment variables from the file content
function extractEnvVarsWithComments(content: string) {
  const envVarsWithComments: { comment: string; envVar: string }[] = [];
  const sections: { [section: string]: { comment: string; envVar: string }[] } =
    {};
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

  // Extract environment variables and categorize them by their section
  let section: string | null = null;
  let i = 0;
  while ((match = envVarRegex.exec(content)) !== null) {
    const envVar = match[2];
    const comment = comments[i] || 'No comment available'; // Default comment if none found

    // Check for section header
    if (i === 0 || comment.startsWith('Web3 config variables')) {
      section = comment; // Use the comment as the section name
      if (!sections[section]) {
        sections[section] = [];
      }
    }

    if (section) {
      sections[section].push({ comment, envVar });
    }

    i++;
  }

  // Flatten the sections into a single array for processing
  for (const sectionName in sections) {
    if (sections.hasOwnProperty(sectionName)) {
      sections[sectionName].forEach(({ comment, envVar }) => {
        envVarsWithComments.push({ comment, envVar });
      });
    }
  }

  return envVarsWithComments;
}

// Function to generate the ENV.md content
function generateEnvMarkdown(
  envVarsWithComments: { comment: string; envVar: string }[],
) {
  let markdown = '# Environment Variables\n\n';
  let currentSection: string | null = null;

  envVarsWithComments.forEach(({ comment, envVar }) => {
    // Detect section change
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

// Function to process all files in the config folder
function processConfigFiles() {
  const files = fs
    .readdirSync(CONFIG_FOLDER_PATH)
    .filter(
      (file) =>
        file.endsWith('.ts') &&
        !['index.ts', 'env-schema.ts', 'config.module.ts'].includes(file),
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
  console.log('ENV.md file generated successfully!');
}

// Run the script
processConfigFiles();
