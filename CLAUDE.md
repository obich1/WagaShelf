# CLAUDE.md

Guidance for Claude Code when working in this repository.

## About me and this project

I'm Obi, a second-year Computer Science student at UPEI. WagaShelf is my portfolio project, and I'm using it to learn frontend, backend, APIs, databases, React and system architecture.

**Goal:** a finished, shipped MVP built from my product plan (`docs/product-planning.md`), for a meeting with a local tech leader on **November 16, 2026**. After the build, we walk through every architecture decision and then the codebase together, so I can explain all of it.

## Workflow (updated November 6, 2026)

- **Claude builds the MVP from `docs/product-planning.md`.** I review the result and give feedback prompts until I'm happy with the product.
- **Claude may commit and push to feature branches** (currently `mvp`). **I merge into `main`.** Never push to `main` directly, force-push, or rewrite history.
- One logical change per commit, with clear commit messages.
- Run the backend tests and the frontend build before every push.
- **Never commit secrets** (Clerk secret key, database URL). They live in `.env` files (ignored by Git) and in the hosting dashboards.
- Prefer simple, maintainable solutions. Before adding a new library, explain why it's needed and what the alternatives are.
- Keep `docs/architecture.md` and this file up to date when the architecture changes.

## How I learn best

- Explain **what** each new concept does and **why** it fits here, and mention the main alternatives.
- Explain how the pieces communicate (browser → API → database and back).
- Keep explanations clear and concrete; tables and small diagrams help.

## Environment

- Windows, PowerShell, PyCharm.
- Backend: `backend\.venv` (activate with `.\.venv\Scripts\Activate.ps1` from `backend`), run with `fastapi dev main.py`, test with `pytest -v`.
- Frontend: from `frontend`, `npm install` once, then `npm run dev`; `npm run lint` and `npm run build` before pushing.
- Local settings: `backend/.env` and `frontend/.env.local` (copy the `.env.example` files). Deployment steps: `docs/deployment.md`.
- **Don't write files with PowerShell's `>` redirect** (it saves UTF-16). Use `Out-File -Encoding utf8` or write the file directly.

## Architecture

See `docs/architecture.md` for the full description and diagrams.

```
React app (frontend/, GitHub Pages, installable PWA)
   │  JSON over HTTPS, Clerk session token in the Authorization header
   ▼
FastAPI (backend/, Render)  ──►  AniList GraphQL API, Open Library API
   │  SQLModel
   ▼
PostgreSQL in production (Neon), SQLite locally and in tests
```

- **Sign-in:** Clerk. The backend verifies Clerk's session tokens (JWTs) with Clerk's public keys and never handles passwords.
- **Data model:** `users` (Clerk id), `titles` (shared catalogue, unique per source + source id), `library_entries` (one user's status, progress, rating and private notes for one title; unique per user + title).
- **Search:** the backend calls AniList and Open Library and returns one common result format.

## MVP scope (from the product plan)

**Status (November 6):** the MVP below is built on the `mvp` branch (backend tests, CI, deploy config). Deployment needs Obi's Clerk, Neon and Render accounts.

**In:** universal search with category filters (anime, manga, manhwa, manhua, novels via AniList; books via Open Library); title detail pages with official links where available; add to shelf with optional status; shelves per media type that appear dynamically, with status filters; editing status, progress, rating and private notes; removing titles; Home dashboard; sign-in with Clerk; dark, cozy UI; installable PWA.

**Deferred:** public profiles and shelf visibility, reviews and comments, following and feeds, movies/TV/games, popular-on-WagaShelf rankings, recommendations, AniList import, volumes and seasons in progress tracking.
