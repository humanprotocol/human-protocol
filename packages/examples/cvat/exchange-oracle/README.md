# Exchange Oracle

## Contributing

Prerequisites:
```
1. poetry config virtualenvs.in-project true  # create .venv inside the project so editors/debuggers pick it up
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

When running service from `./bin/start_debug.sh` (`src/entrypoints/debug.py`), simplified development flow is available:

- When JWT token is required, simple JSON can be used instead of JWT token.
- When webhook signature is required, `{oracle_name}:unique_string` can be used
- You can upload manifest.json to minio `manifests` bucket and use its filename as an escrow_address

### Environment
Env example file: [.env.example](https://github.com/humanprotocol/human-protocol/blob/feat/cvat/exchange-oracle/packages/examples/cvat/exchange-oracle/src/.env.example)

Config: [config file](https://github.com/humanprotocol/human-protocol/blob/feat/cvat/exchange-oracle/packages/examples/cvat/exchange-oracle/src/config.py)


### Migrations
To simplify the process and use `--autogenerate` flag, you need to import a new model to `/alembic/env.py`
Example: [Alembic env file](https://github.com/humanprotocol/human-protocol/blob/feat/cvat/exchange-oracle/packages/examples/cvat/exchange-oracle/alembic/env.py)


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

#### "oneshot" run

A single command to build, run, and tear down the test suite:

```sh
docker compose -p eo-test \
      -f docker-compose.test.yml \
      -f docker-compose.test.head.yml \
      up --build test --attach test --exit-code-from test; \
   docker compose -p eo-test \
      -f docker-compose.test.yml \
      -f docker-compose.test.head.yml \
      down
```

Use this option for CI and for clean single time test runs.

#### Running separate elements

Dev builds require faster iteration and some components may require more control. The following
commands allow running just the services, build, tear down, and run the test suite:

```sh
# run services
docker compose -p eo-test \
  -f docker-compose.test.yml \
  up -d --build

# run the tests
docker compose -p eo-test \
  -f docker-compose.test.yml \
  -f docker-compose.test.head.yml \
  -f docker-compose.test.head.dev.yml \
  up --build test --attach test --exit-code-from test

# tear down
docker compose -p eo-test \
  -f docker-compose.test.yml \
  -f docker-compose.test.head.yml \
  -f docker-compose.test.head.dev.yml \
  down
```

The dev setup mounts the local directory to speed the things up.

#### Regenerating the audio-validation fixture

The recording oracle's audio-transcription validation test runs against a golden fixture — real
builder output (`gt.tsv`, `assignments.json`, `task_clips.json`, `manifest.json`) vendored under
`recording-oracle/tests/assets/cloud/audio_validation/`. Regenerate it whenever the builder output
layout or the shared audio task setup (`tests/utils/audio_transcription.py`) changes.

The wrapper script `tests/assets/utils/gen_audio_validation_fixture.py` runs the real EO builder
once (against a mocked CVAT) and writes the fixture. Easiest is to run it inside the test-suite
container, which already has the env, minio and postgres — it overrides the service's `pytest`
command, applies migrations, and writes to a mounted output dir (the recording-oracle tree isn't
visible in the container, so mount it and pass its path):

```sh
docker compose -p eo-test \
  -f docker-compose.test.yml \
  -f docker-compose.test.head.yml \
  -f docker-compose.test.head.dev.yml \
  run --rm \
  -v "$(pwd)/../recording-oracle/tests/assets/cloud/audio_validation:/out" \
  test sh -c "alembic upgrade head && PYTHONPATH=. \
    python tests/assets/utils/gen_audio_validation_fixture.py /out"
```

To run it directly instead (against your own reachable minio + postgres, with the test-service env
exported and migrations applied):

```sh
PYTHONPATH=. python tests/assets/utils/gen_audio_validation_fixture.py [OUTPUT_DIR]
```

`OUTPUT_DIR` defaults to the recording-oracle assets tree; pass a path to write elsewhere (e.g. a
scratch dir to diff before committing).
