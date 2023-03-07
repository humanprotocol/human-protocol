from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.config import Config

engine = create_engine(Config.postgres_config.connection_url(), pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
