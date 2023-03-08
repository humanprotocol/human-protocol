# Fortune Recording Oracle

Fortune Recording Oracle 

## Set Up

- Install the dependencies.

```bash
yarn install
```

or npm/yarn

- Start the server in development mode.

```bash
yarn dev
```

or npm/yarn

## Env vars

Loaded from `.env` file, with schema validation

## Backend API Development

There are a number of handy commands you can run to help with development.

|Command | Action |
|---|---|
|`yarn run dev` | Run the server in dev mode, automatically restarts on file change |
|`yarn build`| Compile TypeScript to JavaScript |
|`yarn start`| Start JavaScript from 'build' directory |
|`yarn test`| Run unit tests (run `yarn build` before) |
|`yarn test:watch`| Run backend tests in watch mode, running on changed test files |
|`yarn lint`| Run eslint |
|`yarn lint:fix`| Run eslint in fix mode |

## CI

Run tests on push/PR to 'main' branch
Check `.github/workflows/CI.yml`

## Recommended Vscode Extensions

[Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
[ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

## Deployment on Vercel
1. On Github fork this repository. (Skip this step for Human Protocol team)
2. Then go to your Vercel dashboard and click on Add New... Project.
3. Choose the forked repository or this repository if you are on Human Protocol team.
4. Give to the project a name.
5. Choose the root directory as `packages/examples/fortune/recording-oracle`
6. Leave Build and Output Settings section empty, it will use `vercel.json` config.
7. Set Environnment Variables from `.env.development` with your own values.