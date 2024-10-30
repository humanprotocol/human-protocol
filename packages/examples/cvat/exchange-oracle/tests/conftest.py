import os
from collections.abc import Generator

os.environ["DEBUG"] = "1"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src import app
from src.db import Base, SessionLocal, engine


@pytest.fixture(autouse=True)
def db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


@pytest.fixture(scope="module")
def client() -> Generator:
    with TestClient(app) as c:
        yield c


@pytest.fixture
def session() -> Generator[Session, None, None]:
    session = SessionLocal()

    try:
        yield session
    finally:
        session.rollback()
        session.close()
