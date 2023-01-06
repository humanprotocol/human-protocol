# Job Launcher Client App

## Note:
The application is in active development state and can have breaking changes.

### Prerequisites:

* `REACT_APP_API_URL`: Job Launcher API
* `REACT_APP_JOB_LAUNCHER_ADDRESS`: Job Launcher contract ADDRESS
* `REACT_APP_HMT_TOKEN_ADDRESS`: Human hmt token contract ADDRESS

### Environment variables:
Normally, CRA uses .env file and REACT_APP_* templates for environment variables. They are passed to the build phase
of the app and are injected directly to the build. This is not very convinient when we want to redeploy the app
by changing one or several variable.
Considering all REACT_APP_* env variables as application variables we can assume that by changing 
them the build should not be changed. So, all REACT_APP_* env variables are injected into `window.env` properties.
For env variables access only window.env should be used instead of process.env


### Adding new environment variable
Every time new environment variable is added - you should add it to 2 places: `.env` file in the root folder 
and to the `generateEnv.js` script.

### Running locally:
 `cp .env.example .env`

 `yarn`

 `yarn start`

### Running in the production:
 `cp .env.example .env`

 `yarn`

 `yarn build`

## Found a bug?

Please search for any existing issues at our [Issues](https://github.com/humanprotocol/job-launcher-client) page before submitting your own.

