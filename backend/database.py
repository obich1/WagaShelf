import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import event
from sqlmodel import Session, SQLModel, create_engine

# Read settings from backend/.env if it exists (local development). On Render, the same
# settings come from the dashboard instead. Real environment variables always win.
load_dotenv(Path(__file__).resolve().parent / ".env")

# By default the database is a SQLite file next to this file, so it's the same file
# wherever the server is started from. In production, DATABASE_URL points to PostgreSQL.
DEFAULT_DATABASE_FILE = Path(__file__).resolve().parent / "wagashelf.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DATABASE_FILE}")


def normalize_url(url: str) -> str:
    """Hosts give PostgreSQL URLs as postgres:// or postgresql://; SQLAlchemy needs to be told
    to use the psycopg (version 3) driver."""
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


def make_engine(url: str):
    """Create an engine: the object that manages connections to one database."""
    url = normalize_url(url)
    is_sqlite = url.startswith("sqlite")
    # FastAPI can use a SQLite connection from a different thread than the one that opened it.
    connect_args = {"check_same_thread": False} if is_sqlite else {}
    # pool_pre_ping checks a connection still works before using it (hosted databases close idle ones).
    new_engine = create_engine(url, connect_args=connect_args, pool_pre_ping=True)

    if is_sqlite:
        # SQLite ignores foreign keys unless each new connection turns them on.
        @event.listens_for(new_engine, "connect")
        def enable_foreign_keys(dbapi_connection, _connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return new_engine


engine = make_engine(DATABASE_URL)


def create_db_and_tables(target_engine=None):
    """Create every table model (table=True). Tables that already exist are skipped."""
    import models  # noqa: F401  Importing the models registers their tables with SQLModel.

    SQLModel.metadata.create_all(target_engine or engine)


def get_session():
    """FastAPI dependency: opens one database session per request and closes it afterwards."""
    with Session(engine) as session:
        yield session
