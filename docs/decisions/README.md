# Architecture Decision Records

An **Architecture Decision Record (ADR)** is a short note about one significant decision: the
problem, the options considered, what was chosen, and the trade-offs that come with it. Together
they explain *why* WagaShelf is built the way it is, which the code alone can't show.

- One file per decision, numbered in order: `NNN-short-title.md`, based on [`template.md`](template.md).
- Records aren't rewritten when things change. A new record **supersedes** the old one, and the
  old one's status is updated to point to it. The history of thinking is part of the value.
- Records 001–006 were written on 2026-11-07, after the MVP shipped, to document decisions made
  between November 4 and 7.

| # | Decision | Status |
|---|---|---|
| [001](001-shared-catalogue-and-personal-entries.md) | Shared catalogue and personal library entries | Accepted |
| [002](002-backend-calls-external-catalogues.md) | The backend calls AniList and Open Library | Accepted |
| [003](003-clerk-for-sign-in.md) | Clerk for sign-in | Accepted |
| [004](004-postgresql-with-sqlmodel.md) | PostgreSQL in production, SQLite in tests, through SQLModel | Accepted |
| [005](005-react-frontend-in-the-mvp.md) | Rebuild the frontend in React as part of the MVP | Accepted |
| [006](006-focused-launch-categories.md) | Focus the launch on anime, manga and related media | Accepted |
| [007](007-data-router-for-scroll-restoration.md) | A data router, so Back returns to the same scroll position | Accepted |
