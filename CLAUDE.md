# CLAUDE.md

Guidance for Claude Code when working in this repository.

## About me and this project

I'm Obi, a second-year Computer Science student at UPEI. WagaShelf is my portfolio project, and I'm using it to learn frontend, backend, APIs, databases, React and system architecture.

**Goal:** a finished, shipped MVP built from my product plan (`docs/product-planning.md`), for a meeting with a local tech leader on **November 16, 2026**. After the build, we walk through every architecture decision and then the codebase together, so I can explain all of it.

## Workflow (updated November 7, 2026)

How the work is organised (Scrum, the board, the Definition of Done) is in `docs/process.md`.

- **Obi creates the issues and branches**, and **commits, pushes and merges** everything. `main`
  is protected: changes only arrive through pull requests with passing CI.
- **Claude never commits, pushes or merges.** For each item, Claude:
  1. investigates the relevant code and finds the cause or the constraints;
  2. proposes options, explains why each would work, and recommends one;
  3. waits for Obi's approval and branch name;
  4. gives the exact change, explained (for many files, as a patch file for `git apply`);
  5. says how to test it locally before pushing.
- One item per branch. Bugs come before design changes.
- Significant decisions get a decision record in `docs/decisions/`.
- Docs affected by a change are updated in the same pull request.
- **Never commit secrets** (Clerk secret key, database URL). They live in `.env` files (ignored by Git) and in the hosting dashboards.
- Prefer simple, maintainable solutions. Before adding a new library, explain why it's needed and what the alternatives are.

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

See `docs/architecture.md` for the full description and diagrams, and `docs/decisions/` for why each major choice was made.

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

**Status (November 7):** the MVP is live at https://obich1.github.io/WagaShelf/ (GitHub Pages, Render, Neon, Clerk). Current work is tracked on the GitHub Projects board; the current sprint is in `docs/sprints/`.

**In:** universal search with category filters (anime, manga, manhwa, manhua, light novels via AniList; books via Open Library); title detail pages with official links where available; add to shelf with optional status; shelves per media type that appear dynamically, with status filters; editing status, progress, rating and private notes; removing titles; Home dashboard; sign-in with Clerk; dark, cozy UI; installable PWA.

**Deferred:** public profiles and shelf visibility, reviews and comments, following and feeds, movies/TV/games, popular-on-WagaShelf rankings, recommendations, AniList import, volumes and seasons in progress tracking.
