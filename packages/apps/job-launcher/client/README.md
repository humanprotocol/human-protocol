<p align="center">
  <a href="https://www.humanprotocol.org/" target="blank"><img src="https://s2.coinmarketcap.com/static/img/coins/64x64/10347.png" width="100" alt="Human Protocol" /></a>
</p>

<h1 align="center">Job Launcher Client</h1>
<p align="center">Job Launcher Client is a client application for the Human Protocol Job Launcher. It provides a user interface for creating and managing jobs.</p>

<p align="center">
  <a href="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-job-launcher.yaml">
    <img src="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-job-launcher.yaml/badge.svg?branch=main" alt="Job Launcher Check">
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

The application needs access to environment variables in order to work correctly, for this, create one of the `.env.<NODE_ENV>` files, depending on the state of your environment:

```bash
$ export NODE_ENV=development
```

Use the `.env.example` file as an example to create a configuration file with certain environment variables:

```bash
$ cp .env.example .env.development
```

### Running the Application

#### Development

To start the application in development mode, run:

```bash
$ yarn start
```

#### Production

To build and start the application in production mode, run:

```bash
$ yarn build
$ yarn start:prod
```

#### Preview

To preview the production build, run:

```bash
$ yarn preview
```

## 🔧 Commands

### Linting

To lint the codebase, run:

```bash
$ yarn lint
```

### Formatting

To format the codebase using Prettier and ESLint, run:

```bash
$ yarn format
```

### Testing

To run the tests, use:

```bash
$ yarn test
```

## 📝 License

This project is licensed under the MIT License. See the LICENSE file for details.
