# 003. Clerk for sign-in

- **Date:** 2026-11-07 (decided 2026-11-06)
- **Status:** Accepted

## Context

Once WagaShelf is online, a shelf without accounts would be one shared shelf that anyone could
edit, so the MVP needs accounts. Authentication is security-critical (password storage, sessions,
password resets) and isn't what makes WagaShelf different.

## Options considered

1. **Build it:** hash passwords, issue and verify our own JWTs, build sign-in and reset screens.
   Full control and good learning, but about two extra days and easy to get subtly wrong.
2. **Use a managed provider (Clerk):** sign-up, sign-in, email verification, password reset and
   ready-made React components.

## Decision

Use Clerk. The frontend uses Clerk's React components; the backend verifies Clerk's session
tokens (JWTs) itself, using Clerk's public keys, and never sees a password. Users are stored by
their Clerk user id.

## Consequences

- Much less code and risk; time goes into the product instead.
- WagaShelf depends on an outside service, with keys to manage (the publishable key is public;
  the secret key never goes in the code).
- The backend checks each token's signature, expiry, issuer and authorised website without
  calling Clerk on every request.
- Lesson learned (2026-11-07): Clerk resolves relative redirect addresses from the site's root,
  which broke sign-out on GitHub Pages; WagaShelf now gives Clerk full addresses.
- A Clerk production instance needs a custom domain; development keys are used for now.
