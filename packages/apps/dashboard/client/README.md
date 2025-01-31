<p align="center">
  <a href="https://www.humanprotocol.org/" target="blank"><img src="https://s2.coinmarketcap.com/static/img/coins/64x64/10347.png" width="100" alt="Human Protocol" /></a>
</p>

<h1 align="center">Dashboard Client</h1>
<p align="center">The Dashboard Client is a client application for managing operations on the Human Protocol. It provides a user-friendly interface for checking with the protocol activity.</p>

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

## 📝 License

This project is licensed under the MIT License. See the LICENSE file for more details.
