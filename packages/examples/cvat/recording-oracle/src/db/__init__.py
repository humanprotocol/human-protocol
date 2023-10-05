import sqlalchemy
from sqlalchemy.orm import declarative_base, sessionmaker

from src.core.config import Config

DATABASE_URL = Config.postgres_config.connection_url()
engine = sqlalchemy.create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, bind=engine)

Base = declarative_base()
