from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from src import app
from src.db import Base, SessionLocal, engine


@pytest.fixture(scope="session", autouse=True)
def _create_schema() -> None:
    """Create the schema once for the whole session; per-test cleanup only clears data (below)."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # The per-test cleanup only DELETEs rows; it does not reset sequences. Guard that assumption so
    # a future model adding a serial/identity column fails loudly here rather than silently leaking
    # sequence state (e.g. auto-increment ids) across tests.
    sequences = inspect(engine).get_sequence_names()
    assert not sequences, (
        f"Found DB sequences {sequences}: the per-test cleanup DELETEs rows without resetting "
        "sequences, so ids would leak between tests. Reset them per test (e.g. TRUNCATE ... "
        "RESTART IDENTITY, or ALTER SEQUENCE) and update the cleanup."
    )


# Clear every table between tests. DELETE in reverse dependency order is ~0 on empty tables, versus
# recreating the whole schema (drop_all + create_all, ~140ms) on every test. No autoincrement PKs,
# so there are no sequences to reset (guarded in _create_schema). Each DELETE is a single SQL
# expression.
_CLEANUP_SQL = text(
    ";\n".join(
        str(table.delete().compile(dialect=engine.dialect))
        for table in reversed(Base.metadata.sorted_tables)
    )
)


@pytest.fixture(autouse=True)
def db(_create_schema) -> None:
    """Reset the database to an empty schema before each test."""
    with engine.begin() as connection:
        connection.execute(_CLEANUP_SQL)


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
