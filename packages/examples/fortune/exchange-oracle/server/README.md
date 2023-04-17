# Exchange Oracle Server

This is a simple API built with Express in TypeScript that provides endpoints to retrieve a list of similar jobs and check if a job exists based on address, chainId, and solution field.

## Endpoints

### `GET /jobs`

Returns a list of similar jobs in JSON format.

### `POST /jobs/solutions`

Receives job parameters in the request body and add a new to solution to the job based on address, chainId, and solution fields. Returns a JSON response with a boolean value indicating whether the job exists or not.

## Usage

1. Start the API server: `yarn start`
2. Access the API endpoints at `http://localhost:3000/jobs` and `http://localhost:3000/jobs/check` using a REST client or a web browser.

## Contributing

Contributions are welcome! Please create a pull request or open an issue for any improvements or bug fixes.

## License

This project is licensed under the [MIT License](LICENSE).
