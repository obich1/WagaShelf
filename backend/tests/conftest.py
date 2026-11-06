import pytest
from sqlmodel import Session

from database import create_db_and_tables, make_engine


@pytest.fixture
def session(tmp_path):
    """A database session connected to a fresh, empty SQLite file for each test."""
    engine = make_engine(f"sqlite:///{tmp_path / 'test.db'}")
    create_db_and_tables(engine)
    with Session(engine) as test_session:
        yield test_session
    engine.dispose()
