import pytest


@pytest.fixture(autouse=True)
def db():
    # Override the root autouse DB fixture: unit tests here need no database.
    yield
