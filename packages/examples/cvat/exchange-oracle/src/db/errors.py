from src.db import engine as db_engine

if db_engine.driver != "psycopg2":
    raise NotImplementedError

from psycopg2.errors import LockNotAvailable
