# Human app - Frontend

## Build With

| Tool-Name                                                                                                                                                     | Description                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| [ESlint](https://github.com/vercel/style-guide) with [Prettier plugin](https://github.com/prettier/eslint-plugin-prettier)                                    | Linting and Formatting          |
| [ESlint Vercel style guide](https://github.com/vercel/style-guide)                                                                                            | eslint config preset            |
| [Husky](https://typicode.github.io/husky/get-started.html) with [lint-staged](https://github.com/lint-staged/lint-staged?tab=readme-ov-file#-lint-staged----) | pre-commit                      |
| [TypeScript](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)                                                                       | Static typing                   |
| [Vite](https://vitejs.dev/guide/why.html)                                                                                                                     | Bundler                         |
| [React](https://react.dev/learn/describing-the-ui)                                                                                                            | Frontend Framework              |
| [React Router](https://reactrouter.com/en/main/start/tutorial)                                                                                                | Client Side Routing             |
| [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview)                                                                             | Async state management          |
| [Material UI](https://mui.com/material-ui/getting-started/)                                                                                                   | UI Components                   |
| [Material Icons](https://mui.com/material-ui/material-icons/)                                                                                                 | Icons                           |
| [Material React Table](https://www.material-react-table.com/about)                                                                                            | Table component for material ui |
| [Zod](https://github.com/colinhacks/zod?tab=readme-ov-file#table-of-contents)                                                                                 | Runtime Validations             |
| [i18next](https://react.i18next.com/getting-started)                                                                                                          | Internationalization Framework  |

## Getting Started

### Prerequisites

- [Node.js minimal v18](https://nodejs.org/en)
- [pnpm](https://pnpm.io/installation)

### Install Packages

```sh
yarn install
```

### Compile and Hot-Reload for Development

```sh
yarn dev
```

### Type-Check, Compile and Minify for Production

```sh
yarn build
```

### Linting and Formatting

```sh
yarn lint
```

### Tests

```sh
yarn test
```

## Web3 setup

The Web3 setup is closely tied to contract addresses. The best explanation for this can be found in the `.env.example` file, which shows where to set your smart contract addresses.

`.env.example`
```
...
## Web3 setup
# set SC addresses according to https://human-protocol.gitbook.io/hub/human-tech-docs/architecture/components/smart-contracts/contract-addresses

## testnet

# Amoy
VITE_TESTNET_AMOY_STAKING_CONTRACT=
VITE_TESTNET_AMOY_HMTOKEN_CONTRACT=
VITE_TESTNET_AMOY_ETH_KV_STORE_CONTRACT=

## mainnet

# Polygon
VITE_MAINNET_POLYGON_STAKING_CONTRACT=
VITE_MAINNET_POLYGON_HMTOKEN_CONTRACT=
VITE_MAINNET_POLYGON_ETH_KV_STORE_CONTRACT=

## other networks
# if you wish to add new network follow this instruction:
# - add your env-s set to .env file
# - add new env-s to validation schema in: ./src/shared/env.ts
# - include new valid env-s in: ./src/smart-contracts/contracts.ts
# - add chain data in: .src/smart-contracts/chains.ts

# all new chains will be available in wallet-connect modal
```
