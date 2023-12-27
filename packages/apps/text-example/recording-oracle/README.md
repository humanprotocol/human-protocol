# Text Annotation Example - Recording Oracle

This directory contains a Recording Oracle Server for text span annotation jobs on Human Protocol.

## Setup
Make sure you have the following software installed and available on your path:

- [Python](https://www.python.org/downloads/) (>=3.10)
- [Poetry](https://python-poetry.org/docs/#installing-with-the-official-installer) (>=1.5.1)
- [Docker](https://docs.docker.com/desktop) (>=24.0)

and install all dependencies

```shell
poetry install
```

## Running the Oracle

1. Create an appropriate ``.env`` file under `docker/prod/`. (See `docker/test/.env` for an example.)
2. Run ``docker compose -f docker/prod/compose.yaml up``

## API

For details on the API, start the server and check the `/docs` route, e.g. http://127.0.0.1:8000/docs if you run the server locally.

## Tests

Navigate to the exchange oracle direcotry and run

````shell
docker compose -f docker/test/compose.yaml up --build test --attach test --exit-code-from test
````

## Contributing

1. Make sure to install pre commit ``pre-commit install``
2. Make sure you have postgres-devel packages installed on your OS. It is required for psycopg2 build phase.
   `libpq-dev` in Debian/Ubuntu, `libpq-devel` on Centos/Fedora/Cygwin/Babun.)
   `postgres` package in the homebrew for macO