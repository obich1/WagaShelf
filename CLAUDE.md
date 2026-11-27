# CLAUDE.md

Guidance for Claude Code when working in this repository.

## About me and this project

I'm Obi, a second-year Computer Science student at UPEI. WagaShelf is my portfolio project, and I'm using it to learn frontend, backend, APIs, databases, React and system architecture.


## Workflow 

How the work is organised (Scrum, the board, the Definition of Done) is in `docs/process.md`.

- **Obi creates the issues** and decides priorities. `main` is protected: changes only arrive
  through pull requests with passing CI.
- **Claude may create branches, commit, push, open pull requests and merge them**, following
  these rules:
  1. Investigate first, then propose options with a recommendation, and wait for Obi's approval
     before writing code.
  2. One item per branch, named `<issue number>-<short-description>`. Bugs before design changes.
  3. Small, clear commits. The pull request uses the template, links the issue (`Closes #N`) and
     explains what changed and why.
  4. **Merge only when CI passes and Obi has said to merge** ("merge it"). Never push directly
     to `main`, never force-push, never rewrite shared history.
  5. After merging, check the live site (Vercel and Render deploy automatically) and report back.
- Explain every change at a learning level: what it does, why, and the alternatives. Obi reviews
  each pull request before saying "merge it".
- Significant decisions get a decision record in `docs/decisions/`.
- Docs affected by a change are updated in the same pull request.
- **Never commit secrets** (Clerk secret key, database URL). They live in `.env` files (ignored by
  Git) and in the hosting dashboards.
- Prefer simple, maintainable solutions. Before adding a new library, explain why it's needed and
  what the alternatives are.

## How I learn best

- Explain **what** each new concept does and **why** it fits here, and mention the main alternatives.
- Explain how the pieces communicate (browser → API → database and back).
- Keep explanations clear and concrete; tables and small diagrams help.

## Environment

- Windows, PowerShell, PyCharm.
- Backend: `backend\.venv` (activate with `.\.venv\Scripts\Activate.ps1` from `backend`), `alembic upgrade head` to create/update the database, run with `fastapi dev main.py`, test with `pytest -v`.
- Frontend: from `frontend`, `npm install` once, then `npm run dev`; `npm run lint`, `npm test` and `npm run build` before pushing.
- Local settings: `backend/.env` and `frontend/.env.local` (copy the `.env.example` files). Deployment steps: `docs/deployment.md`.
- **Don't write files with PowerShell's `>` redirect** (it saves UTF-16). Use `Out-File -Encoding utf8` or write the file directly.

## Architecture

See `docs/architecture.md` for the full description and diagrams, and `docs/decisions/` for why each major choice was made.

```
React app (frontend/, Vercel, installable PWA)
   │  JSON over HTTPS, Clerk session token in the Authorization header
   ▼
FastAPI (backend/, Render)  ──►  AniList GraphQL API, Open Library API
   │  SQLModel
   ▼
PostgreSQL in production (Neon), SQLite locally and in tests
```

- **Sign-in:** Clerk. The backend verifies Clerk's session tokens (JWTs) with Clerk's public keys and never handles passwords.
- **Data model:** `users` (Clerk id, optional username), `titles` (shared catalogue, unique per source + source id), `library_entries` (one user's status, progress, rating and private notes for one title; unique per user + title).
- **Search:** the backend calls AniList and Open Library and returns one common result format.

## MVP scope (from the product plan)

**Status (November 20):** the MVP is live at https://waga-shelf.vercel.app/ (Vercel, Render, Neon, Clerk). It moved from GitHub Pages on November 20 (ADR 010). Current work is tracked on the GitHub Projects board; the current sprint is in `docs/sprints/`.

**In:** universal search with category filters (anime, manga, manhwa, manhua, light novels via AniList; books via Open Library); title detail pages with official links where available; add to shelf with optional status; shelves per media type that appear dynamically, with status filters; editing status, progress, rating and private notes; removing titles; Home dashboard; sign-in with Clerk; dark, cozy UI; installable PWA.

**Deferred:** public profiles and shelf visibility, reviews and comments, following and feeds, movies/TV/games, popular-on-WagaShelf rankings, recommendations, AniList import, volumes and seasons in progress tracking.
