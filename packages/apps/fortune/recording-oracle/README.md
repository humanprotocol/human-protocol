<p align="center">
  <a href="https://www.humanprotocol.org/" target="blank"><img src="https://s2.coinmarketcap.com/static/img/coins/64x64/10347.png" width="100" alt="Human Protocol" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

<h1 align="center">Fortune Recording Oracle</h1>
  <p align="center">Recording Oracle application works directly with the results from Exchange Oracle, validating them and recording them to a file.</p>

<p align="center">
  <a href="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-fortune.yaml">
    <img src="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-fortune.yaml/badge.svg?branch=main" alt="Fortune Oracles Check">
  </a>
</p>

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
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod

# debug mode
$ yarn run start:debug
```

### Testing the app

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## 📚 Documentation

For detailed information about the Recording Oracle, please refer to the [Human Protocol Tech Docs](https://human-protocol.gitbook.io/hub/human-tech-docs/architecture/components/recording-oracle).

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/humanprotocol/human-protocol/blob/main/LICENSE) file for details.
