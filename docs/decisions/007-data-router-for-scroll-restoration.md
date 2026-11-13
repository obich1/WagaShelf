# 007. A data router, so Back returns to the same scroll position

- **Date:** 2026-11-13
- **Status:** Accepted

## Context

Issue #65: after opening a title from Discover or a shelf and going back (browser button or
swipe), the page loaded again and jumped to the top. A shelf page also opened already scrolled
down if My Shelves was scrolled.

Two causes:

- **Nothing managed the scroll position.** The browser tries to restore it on Back, but React
  draws the previous page a moment later, so there is often nothing to scroll to yet. Going
  forward, the browser keeps the old position, so a new page can open halfway down.
- **Discover kept its results in its own state.** Leaving the page discards them, so Back
  starts a new search and shows the loading spinner.

React Router has a component for the first problem, `<ScrollRestoration>`, but it only works
with a "data router" (`createHashRouter` + `<RouterProvider>`), not with `<HashRouter>`.

## Options considered

1. **Data router + `<ScrollRestoration>`, plus an in-memory cache of recent Discover results.**
   Uses React Router's own tool: new pages open at the top, Back restores the exact position.
   Small change (`main.jsx`, `App.jsx`, `Discover.jsx`). The cache is needed because a position
   can only be restored once the page is full-length again.
2. **Our own scroll saver** (save `scrollY` per page in `sessionStorage`, restore after render).
   No router change, but more code of our own doing what the router already does.
3. **TanStack Query for all API data.** Proper caching with background refresh, but a new
   library and a bigger change than this bug needs.

## Decision

Option 1. Routes stay in `App.jsx` as `<Routes>`; the data router sends every path to `App`.
Filter chips (shelf statuses, Discover categories) pass `preventScrollReset`, because changing a
filter isn't a new page.

## Consequences

- Back and swipe-back return to the same place on Discover, shelves and shelf pages.
- Discover shows a recent search instantly. Results can be up to one session old; "Try again"
  and a refresh always ask the server. Results with an unreachable source aren't cached.
- The data router also unlocks loaders, actions and `useNavigation` later. Moving the routes
  into the router configuration is the next step if we use them.
- Revisit if caching grows beyond Discover (e.g. infinite scroll): that's when TanStack Query
  (option 3) starts to pay for itself.
