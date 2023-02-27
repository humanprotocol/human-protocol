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
1. docker-compose -f docker-compose.dev.yml up -d
2. ./bin/start_dev.sh
```


There are no migrations yet on the project. All schemas are created during the first run
So if you are making any changes to the schemas you have to delete all tables and other objects in the database manually
to apply these changes. For development environment get credentials from the `src/config.py`


## Endpoints and API schema

Available at `/docs` route