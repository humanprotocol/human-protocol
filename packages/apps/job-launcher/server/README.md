<p align="center">
  <a href="https://www.humanprotocol.org/" target="blank"><img src="https://s2.coinmarketcap.com/static/img/coins/64x64/10347.png" width="100" alt="Human Protocol" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

<h1 align="center">Job Launcher Server</h1>
  <p align="center">Job Launcher Server is an API that allows Human Protocol users to create jobs.</p>

<p align="center">
  <a href="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-job-launcher.yaml">
    <img src="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-job-launcher.yaml/badge.svg?branch=main" alt="Job Launcher Check">
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

Next, the requirement that the application puts forward is to set up a database, for this there are two different options, `manually` or using `docker`.

### Set up the database manually

First of all, postgres needs to be installed, please see here <a href="https://www.postgresql.org/download/">please see here</a>.

Then run the following commands in the postgres console to create the database and issue permissions:

```bash
$ CREATE DATABASE "job-launcher";
$ CREATE USER operator WITH ENCRYPTED PASSWORD 'qwerty';
$ GRANT ALL PRIVILEGES ON DATABASE "job-launcher" TO "operator";
$ \c "job-launcher" postgres
$ GRANT CREATE ON SCHEMA public TO operator;
```

Now we're ready to run the migrations:

```bash
yarn migration:run
```

### Set up the database with Docker

To run with docker, you need to enter the following command, which raises the container with postgres and runs the migrations:

```bash
yarn docker:db:up
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

### Migrations

```bash
# Create new migration
$ yarn migration:create addNameTable

# Generate new migration
$ yarn migration:generate addNameTable

# Revert latest migration
$ yarn migration:revert

# Run all pending migrations
$ yarn migration:run

# Show all migrations
$ yarn migration:show
```

### Docker

```bash
# Up a postgres container and run migrations
$ docker:db:up

# Down postgres container
$ docker:db:down
```

## 📚 Documentation

For detailed information about the Exchange Oracle, please refer to the [Human Protocol Tech Docs](https://human-protocol.gitbook.io/hub/human-tech-docs/architecture/components/job-launcher).

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/humanprotocol/human-protocol/blob/main/LICENSE) file for details.
