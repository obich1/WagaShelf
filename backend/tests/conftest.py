import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from database import create_db_and_tables, get_session, make_engine
from main import app


@pytest.fixture
def engine(tmp_path):
    """An engine connected to a fresh, empty SQLite file for each test."""
    test_engine = make_engine(f"sqlite:///{tmp_path / 'test.db'}")
    create_db_and_tables(test_engine)
    yield test_engine
    test_engine.dispose()


@pytest.fixture
def session(engine):
    """A database session for tests that work with the models directly."""
    with Session(engine) as test_session:
        yield test_session


@pytest.fixture
def client(engine):
    """A test client whose requests use the test database instead of the real one."""

    def get_test_session():
        with Session(engine) as test_session:
            yield test_session

    # dependency_overrides tells FastAPI: wherever a route asks for get_session, use this instead.
    app.dependency_overrides[get_session] = get_test_session
    yield TestClient(app)
    app.dependency_overrides.clear()
