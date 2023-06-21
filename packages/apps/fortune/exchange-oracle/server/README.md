# Exchange Oracle Server

Exchange Oracle Server is an API built with Nest in TypeScript that allows Human Protocol users to interact with created jobs. It provides endpoints to retrieve a list of jobs, get the job details
and submit a solution using the worker address, escrow addres, chainId, and solution field.

## Endpoints

### `GET /jobs`

Returns a list of similar jobs in JSON format.

### `POST /jobs/solutions`

Receives job parameters in the request body and add a new to solution to the job based on address, chainId, and solution fields. Returns a JSON response with a boolean value indicating whether the job exists or not.

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Contributing

Contributions are welcome! Please create a pull request or open an issue for any improvements or bug fixes.

## License

This project is licensed under the [MIT License](LICENSE).
