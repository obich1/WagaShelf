# 012. Schema changes go through Alembic migrations

- **Date:** 2026-11-26
- **Status:** Accepted

## Context

The app created its tables on every start with `SQLModel.metadata.create_all()`. That only creates
tables that are missing. It never changes one that exists, so adding a column (the `username`
column planned in #35) would do nothing on the live Neon database, and the app would then fail on
the missing column. As soon as real users have data, the schema has to change without losing it.

## Options considered

1. **Keep `create_all` and recreate the database when it changes.** Fine with no data; destroys data once there is some.
2. **Hand-written SQL scripts, run by hand.** No new dependency, but you track which scripts ran where, and SQLite and PostgreSQL differ.
3. **Alembic.** The standard tool for SQLAlchemy (which SQLModel is built on). Versioned `upgrade`/`downgrade` scripts, with a table in each database recording its version. It can draft a migration by comparing the models to the database. One new dependency.
4. **Other tools (Atlas, yoyo).** Less common, with weaker SQLModel support.

## Decision

Alembic (option 3). Migrations live in `backend/migrations/`. `0001` is a baseline that matches
the schema as it was when Alembic was added. `env.py` uses the same `DATABASE_URL` and engine as the
app, with batch mode on SQLite (which can't alter tables in place). The app no longer creates tables
when it starts; Render's start command runs `alembic upgrade head` first. Tests still build their
temporary databases with `create_all` for speed, and two extra tests run the real migrations: one
checks that they produce exactly what the models describe, the other that they can be undone.

The existing Neon database is marked as being at the baseline with `alembic stamp head` (steps in
`docs/deployment.md`) instead of running the baseline on it.

## Consequences

- Adding a column or constraint is a reviewed migration file in the pull request, not a surprise.
- If a model changes without a migration, the drift test fails in CI.
- Local databases created before Alembic need `alembic stamp head` once; fresh ones need `alembic upgrade head`.
- Running `alembic upgrade head` in the start command also runs it on every restart, which is a no-op when nothing changed. If a migration ever takes long, move it to a separate deploy step.
- Autogenerate is a draft: renames and data changes need hand-written steps.
