# Exchange Oracle

## Contributing

Prerequisites:
```
1. poetry shell
2. poetry install
3. pre-commit install
4. Make sure you have postgres-devel packages installed on your OS. It is required for psycopg2 build phase.
   `libpq-dev` in Debian/Ubuntu, `libpq-devel` on Centos/Fedora/Cygwin/Babun.)
   `postgres` package in the homebrew for macOS
```   
   

For deployment it is required to have PostgreSQL(v14.4)


### Run the oracle locally:

```
docker-compose -f docker-compose.dev.yml up -d
./bin/start_dev.sh
```

or 

```
docker-compose -f docker-compose.dev.yml up -d
./bin/start_debug.sh
```

When running service from `./bin/start_debug.sh` (`debug.py`), simplified development flow is available:

- When JWT token is required, simple JSON can be used instead of JWT token.
- When webhook signature is required, `{oracle_name}:unique_string` can be used
- You can upload manifest.json to minio `manifests` bucket and use its filename as an escrow_address

### Environemt
Env example file: [.env.example](https://github.com/humanprotocol/human-protocol/blob/feat/cvat/exchange-oracle/packages/examples/cvat/exchange-oracle/src/.env.example)

Config: [config file](https://github.com/humanprotocol/human-protocol/blob/feat/cvat/exchange-oracle/packages/examples/cvat/exchange-oracle/src/config.py)


### Migrations
To simplify the process and use `--autogenerate` flag, you need to import a new model to `/alembic/env.py`
Example: [Alembic env file](https://github.com/humanprotocol/human-protocol/blob/feat/cvat/exchange-oracle/packages/examples/cvat/exchange-oracle/alembic/env.py)


Adding new migration:
```
alembic revision --autogenerate -m "your-migration-name"
```

Upgrade:
```
alembic upgrade head
```

Downgrade:
```
alembic downgrade -{number of migrations}
```



### Endpoints and API schema

Available at `/docs` route


### Tests

To run tests
```
docker-compose -f docker-compose.test.yml up --build test --attach test --exit-code-from test
```