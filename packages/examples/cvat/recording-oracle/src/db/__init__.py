import logging

import sqlalchemy
from sqlalchemy.orm import declarative_base, sessionmaker

from src.core.config import Config

DATABASE_URL = Config.postgres_config.connection_url()
engine = sqlalchemy.create_engine(
    DATABASE_URL,
    echo="debug" if Config.loglevel <= logging.DEBUG else False,
    connect_args={"options": "-c lock_timeout={:d}".format(Config.postgres_config.lock_timeout)},
)
SessionLocal = sessionmaker(autocommit=False, bind=engine)

Base = declarative_base()
