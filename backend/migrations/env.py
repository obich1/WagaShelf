"""Alembic's setup: tells it which database to change and what the models say it should look like.

Run from the backend folder:
    alembic upgrade head      bring the database up to the newest version
    alembic revision --autogenerate -m "describe the change"    draft a migration from model changes
"""

from alembic import context
from sqlmodel import SQLModel

import models  # noqa: F401  Importing the models registers their tables with SQLModel.
from database import DATABASE_URL, make_engine

config = context.config

# What the database should look like: every table defined in models.py.
target_metadata = SQLModel.metadata


def get_engine():
    """The database to migrate: the one in DATABASE_URL (backend/.env or Render's settings),
    unless a different address was given in the Alembic config (the tests do this)."""
    return make_engine(config.get_main_option("sqlalchemy.url") or DATABASE_URL)


def run_migrations() -> None:
    engine = get_engine()
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # SQLite can't change a table in place (drop a column, add a constraint...).
            # "Batch mode" makes Alembic copy the table instead. PostgreSQL ignores it.
            render_as_batch=connection.dialect.name == "sqlite",
        )
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


run_migrations()
