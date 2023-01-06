require('dotenv').config();

const fs = require('fs');
const path = require('path');

const applicationEnvironment = process.env.NODE_ENV;
const isProduction = applicationEnvironment === 'production';

const staticFolder = isProduction ? 'build' : 'public';
const ENV_FRONTEND_SCRIPT = 'env.js';
const envFilePath = path.join(__dirname, staticFolder, ENV_FRONTEND_SCRIPT);

const environmentObj = {
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  REACT_APP_JOB_LAUNCHER_ADDRESS: process.env.REACT_APP_JOB_LAUNCHER_ADDRESS,
  REACT_APP_HMT_TOKEN_ADDRESS: process.env.REACT_APP_HMT_TOKEN_ADDRESS,
};

const fileContent = `window.env = ${JSON.stringify(environmentObj)};`;

fs.writeFileSync(envFilePath, fileContent);
