# 001. Shared catalogue and personal library entries

- **Date:** 2026-11-07 (decided 2026-11-06)
- **Status:** Accepted

## Context

The first backend stored everything about a saved title in one `entries` table: title, cover and
episode count next to the user's status and rating. The product plan introduced accounts and a
principle: *a title has shared catalogue information, while each user's status, progress, rating
and notes belong to that user's own library entry.* With many users, the one-table design would
store the same title's details once per user who saved it.

## Options considered

1. **Keep one table, one row per user per title.** Simple, but duplicates title data, and an
   update (e.g. a new episode count) would have to change many rows.
2. **Separate tables:** `titles` (one row per title, shared) and `library_entries` (one row per
   user per title, linking to the title). Matches the product principle; no duplication.

## Decision

Use three tables: `users`, `titles` and `library_entries`. The database enforces the rules:
unique `(source, source_id)` in `titles`, unique `(user_id, title_id)` in `library_entries`, and
foreign keys from entries to users and titles.

## Consequences

- Title details are stored once and refreshed in one place.
- Duplicate saves are impossible even if application code has a bug (the database rejects them).
- Reading a library needs a JOIN between `library_entries` and `titles`.
- Supports future features naturally: public reviews, "popular on WagaShelf" and related titles
  all hang off the shared `titles` table.
