<p align="center">
  <a href="https://www.humanprotocol.org/" target="blank"><img src="https://s2.coinmarketcap.com/static/img/coins/64x64/10347.png" width="100" alt="Human Protocol" /></a>
</p>

<h1 align="center">HUMAN Faucet</h1>
<p align="center">The HUMAN Faucet allows users to claim small amounts of HMT tokens to test and explore functionalities within the HUMAN Protocol ecosystem.</p>

<p align="center">
  <a href="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-faucet-ui.yaml">
    <img src="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-faucet-ui.yaml/badge.svg?branch=main" alt="Faucet Check">
  </a>
</p>

## ✨ Demo

First, install the dependencies using `yarn` as the package manager:

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

# Branching

[GitFlow convention](https://www.gitkraken.com/learn/git/git-flow) is to be followed (and feature PRs should target `develop` branch rather than `main`)

## Deployment Endpoints

`main` branch → production: https://faucet.humanprotocol.org/

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/humanprotocol/human-protocol/blob/main/LICENSE) file for details.
