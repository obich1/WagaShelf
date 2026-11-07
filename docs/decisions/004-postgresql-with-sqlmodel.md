# 004. PostgreSQL in production, SQLite in tests, through SQLModel

- **Date:** 2026-11-07 (decided 2026-11-06)
- **Status:** Accepted

## Context

The first backend used SQLite with hand-written SQL through Python's `sqlite3` module. Going
online with many users raised two problems: free hosting (Render) deletes local files when the
server restarts, which would erase a SQLite database, and the database layer needed to work
with more than one database engine.

## Options considered

1. **Keep SQLite on a host with persistent storage.** Familiar, but persistent disks usually
   aren't free, and SQLite isn't designed for a server handling many users.
2. **Hosted PostgreSQL (Neon) with raw SQL.** Data survives restarts, but SQL would differ
   between PostgreSQL and the tests' SQLite.
3. **Hosted PostgreSQL with SQLModel.** One set of models works with both databases; tables and
   API validation are written in the same style (SQLModel combines Pydantic and SQLAlchemy).

## Decision

PostgreSQL (Neon, free tier) in production, SQLite locally and in tests, with SQLModel. The
database address comes from the `DATABASE_URL` environment variable.

## Consequences

- Data is safe across deploys and restarts.
- Tests are fast and isolated: each one gets a fresh temporary SQLite database.
- A new library to learn instead of raw SQL (it generates the SQL).
- The two databases differ in places (time zones, foreign keys in SQLite), which needs care.
  The library flow has also been checked against a real PostgreSQL database.
- `create_db_and_tables()` only creates missing tables. Changing an existing table (e.g. adding
  a `username` column) needs a **migration**, planned with Alembic.
