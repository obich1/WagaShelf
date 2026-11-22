# 010. Host the frontend on Vercel

- **Date:** 2026-11-20
- **Status:** Accepted

## Context

Since the MVP, the React app was published to GitHub Pages by a GitHub Actions workflow. That
worked, but caused friction:

- On merge, GitHub Pages and the Actions deploy raced each other while Pages was still set to
  "Deploy from a branch", and the site showed `README.md` instead of the app (2026-11-07).
- The app lived in a folder (`/WagaShelf/`), which led to the sign-out 404 (#21), because Clerk
  resolves relative addresses from the site's root.
- GitHub Pages only serves real files, so the app had to use hash URLs (`/#/discover`).
- There are no preview builds of pull requests.

The address was about to be shared (LinkedIn, resume, first users), so moving had to happen
before that, while the only user was the developer.

## Options considered

1. **Stay on GitHub Pages.** Free and already working, but keeps the problems above.
2. **Vercel.** Free plan, builds and deploys from GitHub on every merge, a preview build for
   every pull request, the app at the root of its own address, and rewrite rules (which make
   clean URLs possible later). The free "Hobby" plan is for personal, non-commercial use.
3. **Netlify or Cloudflare Pages.** Similar features and free plans. No strong reason to prefer
   them; Vercel was recommended and is widely used with Vite and React.

## Decision

Host the frontend on Vercel at `https://waga-shelf.vercel.app/`, built from the `frontend` folder with the same two
environment variables (`VITE_API_URL`, `VITE_CLERK_PUBLISHABLE_KEY`). The GitHub Pages deploy
workflow is removed and the Pages site unpublished. No redirect page was needed, because the
developer was the only user. Hash URLs stay for now: switching to clean URLs is a separate,
smaller change.

## Consequences

- Every merge deploys automatically, and every pull request gets a preview build. Sign-in doesn't
  work on previews, because their addresses aren't allowed by the API, which is a safe default.
- Moving the frontend means updating, together: Render's `FRONTEND_ORIGINS` and
  `CLERK_AUTHORIZED_PARTIES`, Clerk's allowed origins, and the `og:` tags in `index.html`
  (listed in `docs/deployment.md`).
- Old links and installs from `obich1.github.io/WagaShelf/` stop working.
- Revisit if WagaShelf ever earns money (Vercel's free plan is non-commercial), or if a custom
  domain is bought, which would also allow a Clerk production instance.
