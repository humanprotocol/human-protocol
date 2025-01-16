<p align="center">
  <a href="https://www.humanprotocol.org/" target="blank"><img src="https://s2.coinmarketcap.com/static/img/coins/64x64/10347.png" width="100" alt="Human Protocol" /></a>
</p>

<h1 align="center">Staking Dashboard</h1>
<p align="center">The Staking Dashboard is a client application for managing staking operations on the Human Protocol. It allows users to stake, unstake, withdraw HMT tokens, and interact with the KVStore contract to view and modify stored values.</p>

<p align="center">
  <a href="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-staking-dashboard.yaml">
    <img src="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-staking-dashboard.yaml/badge.svg?branch=main" alt="Staking Dashboard Check">
  </a>
</p>

## 🚀 Getting Started

### Prerequisites

- Node.js
- Yarn (as a package manager)

### Installation

First, install the dependencies:

```bash
$ yarn install
```

### Environment Variables

The application requires environment variables to function correctly. Create a `.env` file, use the `.env.example` file as a template:

```bash
$ cp .env.example .env
```

### Running the Application

#### Development

To start the application in development mode:

```bash
$ yarn start
```

#### Production

To build and start the application in production mode:

```bash
$ yarn build
$ yarn start:prod
```

#### Preview

To preview the production build:

```bash
$ yarn preview
```

## 🔧 Features

- **Stake HMT Tokens**: Easily stake your HMT tokens with a user-friendly interface.
- **Unstake Tokens**: Unstake your tokens with a click.
- **Withdraw Tokens**: Withdraw available tokens after the lock period.
- **KVStore Management**: View and modify stored key-value pairs in the KVStore contract.

## 🔧 Commands

### Linting

To lint the codebase:

```bash
$ yarn lint
```

### Formatting

To format the codebase with Prettier and ESLint:

```bash
$ yarn format
```

### Testing

To run tests:

```bash
$ yarn test
```

## 📝 License

This project is licensed under the MIT License. See the LICENSE file for more details.

