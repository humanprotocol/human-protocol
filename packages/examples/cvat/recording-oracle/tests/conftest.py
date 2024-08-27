from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from src import app
from src.db import Base, engine


@pytest.fixture(autouse=True)
def db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


@pytest.fixture(scope="module")
def client() -> Generator:
    with TestClient(app) as c:
        yield c
