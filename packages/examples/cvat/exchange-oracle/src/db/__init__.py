from contextlib import contextmanager

import sqlalchemy
from psycopg2.errors import Error
from sqlalchemy import DDL, event
from sqlalchemy.exc import SQLAlchemyError, StatementError
from sqlalchemy.orm import declarative_base, sessionmaker

import src.utils.logging
from src.core.config import Config

DATABASE_URL = Config.postgres_config.connection_url()
engine = sqlalchemy.create_engine(
    DATABASE_URL,
    echo="debug" if Config.loglevel <= src.utils.logging.TRACE else False,
    connect_args={"options": f"-c lock_timeout={Config.postgres_config.lock_timeout:d}"},
)
SessionLocal = sessionmaker(autocommit=False, bind=engine)

Base = declarative_base()

create_uuid_extension = DDL('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
event.listen(Base.metadata, "before_create", create_uuid_extension)


@contextmanager
def suppress(*exceptions: type[SQLAlchemyError] | type[Error]):
    """
    Works similarly to `contextlib.suppress`, but also checks for `e.orig`.
    """
    try:
        yield
    except exceptions:
        pass
    except StatementError as e:
        if not isinstance(e.orig, exceptions):
            raise
