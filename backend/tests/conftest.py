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


@pytest.fixture
def sign_in(client):
    """Call sign_in("user_a") to make the client's requests come from that user.

    This replaces Clerk token checking (tested separately in test_auth.py), so library
    tests don't need real tokens.
    """
    from fastapi import Depends

    from auth import get_current_user
    from models import User

    def sign_in_as(user_id: str):
        def fake_current_user(session: Session = Depends(get_session)) -> User:
            user = session.get(User, user_id)
            if user is None:
                user = User(id=user_id)
                session.add(user)
                session.commit()
                session.refresh(user)
            return user

        app.dependency_overrides[get_current_user] = fake_current_user
        return client

    return sign_in_as
