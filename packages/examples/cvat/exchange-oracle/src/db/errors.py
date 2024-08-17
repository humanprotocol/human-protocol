from src.db import engine as db_engine

if db_engine.driver != "psycopg2":
    raise NotImplementedError


# These errors can be found, e.g., in the .orig field of sqlalchemy errors
