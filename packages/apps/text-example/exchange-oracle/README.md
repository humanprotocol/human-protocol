# Text Annotation Example - Exchange Oracle

This directory contains a Recording Oracle Server for text span annotation jobs on Human Protocol.

## Setup
Make sure you have the following software installed and available on your path:

- [Python](https://www.python.org/downloads/) (>=3.10)
- [Poetry](https://python-poetry.org/docs/#installing-with-the-official-installer) (>=1.5.1)

and install all dependencies

```shell
poetry install
```

## Running the Oracle
To run the oracle locally, change to the source directory and start the server using uvicorn.

````shell
poetry run uvicorn main:exchange_oracle --app-dir src
````

## API

For details on the API, start the server and check the `/docs` route, e.g. http://127.0.0.1:8000/docs if you run the server locally.