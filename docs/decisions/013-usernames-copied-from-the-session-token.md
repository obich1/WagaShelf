# 013. Usernames live in Clerk and are copied from the session token

- **Date:** 2026-11-27
- **Status:** Accepted

## Context

People should have a username (#35), stored in the WagaShelf database so the backend can use it
without calling Clerk (later: public profiles, looking people up). Clerk already supports
usernames and enforces that they are unique. The question was how a username gets from Clerk into
the `users` table, and who owns it.

## Options considered

1. **A claim in the session token.** Clerk adds `username` to every session token (a dashboard setting). The backend already verifies that token on each request, so it compares the claim with the stored value and updates the column when they differ. No new secret or endpoint. A change in Clerk appears at the person's next request.
2. **A Clerk webhook.** Clerk calls an endpoint when a user changes. Immediate, but it needs a public endpoint, signature checking and retries on failure.
3. **Clerk's backend API.** The server asks Clerk for the user. Simple, but it needs Clerk's secret key on the server and an extra network call.
4. **Don't store it.** Read it from Clerk each time. Nothing to sync, but the backend can't use usernames on its own.

## Decision

Option 1. Clerk owns the username; `users.username` is a nullable, unique copy (migration `0002`).
`auth.py` syncs it in `get_current_user`. A missing claim leaves the stored value alone, so the
code is safe before the dashboard is set up. If another row still holds a username that Clerk now
gives to someone else (a rename not yet synced), that stale copy is cleared first.

## Consequences

- No new secrets, endpoints or dependencies.
- A username appears in the database only after the person's next request, not the moment they change it.
- The setup is a dashboard step that has to be repeated in each Clerk instance (development and production); it's in `docs/deployment.md`.
- People who signed up before usernames existed have no username until they add one in Clerk.
- Switch to a webhook if the copy ever needs to be exact in real time.
