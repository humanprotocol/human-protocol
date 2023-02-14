# Job Launcher client
Job Launcher client is the GUI to allow Human Protocol users can create jobs.

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