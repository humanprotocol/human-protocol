# Recording Oracle Server for Fortune App

The Fortune Recording Oracle application works directly with the results from Exchange Oracle, validating them and recording them to a file.

## API

- <b>POST</b> `/job/solve`

  Submits a solution from exchange oracle.

  Request Payload:

  ```json
  {
    "escrowAddress": string,
    "chainId": number,
    "exchangeAddress": string,
    "workerAddress": string,
    "solution": string
  }
  ```

## Development

- Install dependencies with `yarn`.
- Run minio docker container.
  ```bash
  cd ..
  docker compose up
  ```
- Run dev server with `yarn start:dev`.

## Deployment
