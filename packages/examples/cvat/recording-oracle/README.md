# Recording Oracle

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

```sh
docker compose -f docker-compose.dev.yml up -d
./bin/start_dev.sh
```

or 

```sh
docker compose -f docker-compose.dev.yml up -d
./bin/start_debug.sh
```

When running service from `./bin/start_debug.sh` (`debug.py`), simplified development flow is available:

- When webhook signature is required, `{oracle_name}:unique_string` can be used
- You can upload manifest.json to minio `manifests` bucket and use its filename as an escrow_address


### Environemt
Env example file: `/src/.env.example`

Config file: `/src/config.py`


### Migrations
To simplify the process and use `--autogenerate` flag, you need to import a new model to `/alembic/env.py`

Adding new migration:
```sh
alembic revision --autogenerate -m "your-migration-name"
```

Upgrade:
```sh
alembic upgrade head
```

Downgrade:
```sh
alembic downgrade -{number of migrations}
```


### Endpoints and API schema

Available at `/docs` route


### Tests

The blockchain node is split into `docker-compose.test.blockchain.yml`. Include it for tests that
hit the chain (most integration tests); omit it to run the rest of the suite without building and
starting the node.

#### "oneshot" run

A single command to build, run, and tear down the test suite:

```sh
docker compose -p "test" \
     -f docker-compose.test.yml \
     -f docker-compose.test.blockchain.yml \
     -f docker-compose.test.head.yml \
      up --build test --attach test --exit-code-from test; \
   docker compose -p "test" \
     -f docker-compose.test.yml \
     -f docker-compose.test.blockchain.yml \
     -f docker-compose.test.head.yml down
```

Use this option for CI and for clean single time test runs.

#### Running separate elements

Dev builds require faster iteration and some components may require more control. The following
commands allow running just the services, build, tear down, and run the test suite:

```sh
# run services
docker compose -p "test" \
  -f docker-compose.test.yml \
  -f docker-compose.test.blockchain.yml \
  -f docker-compose.test.head.yml \
  up -d --build postgres minio minio-mc blockchain-node

# run the tests
docker compose -p "test" \
  -f docker-compose.test.yml \
  -f docker-compose.test.blockchain.yml \
  -f docker-compose.test.head.yml \
  -f docker-compose.test.head.dev.yml \
  up --build test --attach test --exit-code-from test

# tear down
docker compose -p "test" \
  -f docker-compose.test.yml \
  -f docker-compose.test.blockchain.yml \
  -f docker-compose.test.head.yml \
  -f docker-compose.test.head.dev.yml \
  down
```

The dev setup mounts the local directory to speed the things up.
