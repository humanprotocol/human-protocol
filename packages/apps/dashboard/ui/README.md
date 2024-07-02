<p align="center">
  <a href="https://www.humanprotocol.org/" target="blank"><img src="https://s2.coinmarketcap.com/static/img/coins/64x64/10347.png" width="100" alt="Human Protocol" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

<h1 align="center">HUMAN Dashboard</h1>
  <p align="center">HUMAN Dashboard is a comprehensive interface that provides users with detailed insights of the HUMAN Protocol ecosystem. This dashboard is designed to facilitate the tracking of HMT token transactions, escrows, payouts, staking and to provide up-to-date information about available oracles and their reputations</p>

<p align="center">
  <a href="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-dashboard-ui.yaml">
    <img src="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-dashboard-ui.yaml/badge.svg?branch=main" alt="Dashboard Check">
  </a>
</p>

## ✨ Demo

First, let's install the dependencies, `yarn` is used as a package manager:

```bash
$ yarn install
```

The application needs access to environment variables in order to work correctly, for this, create one of the `.env.<NODE_ENV>` files, depending on the state of your environment:

```bash
$ export NODE_ENV=development
```

Use the `.env.example` file as an example to create a configuration file with certain environment variables:

```bash
$ cp .env.example .env.development
```

## 🚀 Usage

### Running the app

```bash
$ yarn run start
```

### Testing the app

```bash
# unit tests
$ yarn run test
```

# Branching

[GitFlow convention](https://www.gitkraken.com/learn/git/git-flow) is to be followed (and feature PRs should target `develop` branch rather than `main`)

## Deployment Endpoints

`main` branch → production: https://dashboard.humanprotocol.org/

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/humanprotocol/human-protocol/blob/main/LICENSE) file for details.
