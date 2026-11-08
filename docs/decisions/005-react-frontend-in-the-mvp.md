# 005. Rebuild the frontend in React as part of the MVP

- **Date:** 2026-11-07 (decided 2026-11-06)
- **Status:** Accepted

## Context

The original frontend was plain HTML, CSS and JavaScript storing the shelf in localStorage, and
the plan changed twice in two days:

1. **November 5:** connect the existing frontend to the backend first, then migrate to React,
   so only one new thing was learned at a time.
2. **November 5, later:** a friend's advice was that a *shipped* product matters most, so React
   was postponed until after November 16 in favour of deploying and making a PWA.
3. **November 6:** the product plan was written. It describes several pages (Home, Discover,
   title pages, shelves) and accounts.

## Options considered

1. **Keep plain JavaScript and add pages.** No new framework, but routing between pages,
   shared state and sign-in would have to be built by hand, and redone later in React.
2. **Rebuild in React now** (Vite, React Router, Clerk's React components).

## Decision

Rebuild the frontend in React as part of the MVP, because the product plan's multi-page design
is what React and a router are for. The old plain-JavaScript frontend was removed once the React
app matched and exceeded it.

## Consequences

- Pages, shared library state and sign-in fit naturally (`HashRouter`, a React context, Clerk).
- More to learn at once (React, the router, Vite), which is why the architecture walkthrough is
  part of the plan.
- GitHub Pages can't redirect unknown paths, so the app uses hash URLs (`/#/discover`).
- Shipping still came first: deployment and the PWA were part of the same MVP.
