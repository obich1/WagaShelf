"""Checks that the Alembic migrations and the models in models.py tell the same story."""

from pathlib import Path

from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from sqlalchemy import inspect
from sqlmodel import SQLModel

import models  # noqa: F401  Importing the models registers their tables with SQLModel.
from database import make_engine

BACKEND = Path(__file__).resolve().parent.parent


def alembic_config(database_url: str) -> Config:
    config = Config(str(BACKEND / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND / "migrations"))
    config.set_main_option("sqlalchemy.url", database_url.replace("%", "%%"))
    return config


def test_migrations_build_the_schema_the_models_describe(tmp_path):
    url = f"sqlite:///{tmp_path / 'migrated.db'}"
    command.upgrade(alembic_config(url), "head")

    engine = make_engine(url)
    try:
        assert {"users", "titles", "library_entries"} <= set(inspect(engine).get_table_names())
        with engine.connect() as connection:
            # Anything left here means a model changed without a migration (or the reverse).
            differences = compare_metadata(MigrationContext.configure(connection), SQLModel.metadata)
        assert differences == []
    finally:
        engine.dispose()


def test_migrations_can_be_undone(tmp_path):
    url = f"sqlite:///{tmp_path / 'downgraded.db'}"
    config = alembic_config(url)
    command.upgrade(config, "head")
    command.downgrade(config, "base")

    engine = make_engine(url)
    try:
        assert set(inspect(engine).get_table_names()) <= {"alembic_version"}
    finally:
        engine.dispose()
