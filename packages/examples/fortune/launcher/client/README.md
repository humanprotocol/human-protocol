# Job Launcher client
Job Launcher client is the GUI to allow Human Protocol users to create jobs.

## Development

Run this script at the root of monorepo to install all dependencies.

```bash
$ yarn
```

Before running the client app, you need to make sure that you have correct environment variables.

```
REACT_APP_JOB_LAUNCHER_SERVER_URL=<Job launcher back-end API url>
REACT_APP_JOB_LAUNCHER_ADDRESS=<Job launcher contract address>
```

Now run this command to start fortune launcher client.

at the root of monorepo
```bash
$ yarn workspace @human-protocol/fortune launcher-client
```

or at project directory
```bash
$ yarn start
```

## Test

at project directory
```bash
$ yarn test
``` 

## Deployment on Vercel
1. On Github fork this repository. (Skip this step for Human Protocol team)
2. Then go to your Vercel dashboard and click on Add New... Project.
3. Choose the forked repository or this repository if you are on Human Protocol team.
4. Give to the project a name.
5. Choose the root directory as `packages/examples/fortune/launcher/client`
6. In Build and Output Settings section set these values:
    - Build Command: `yarn workspace @human-protocol/job-launcher-client build`
    - Output Directory: `build`
    - Install Command: `yarn install`
7. Set Environnment Variables:
    - REACT_APP_JOB_LAUNCHER_ADDRESS
    - REACT_APP_JOB_LAUNCHER_SERVER_URL
