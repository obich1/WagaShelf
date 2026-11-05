# CLAUDE.md

Guidance for Claude Code when working in this repository.

## About me and this project

I'm Obi, a second-year Computer Science student at UPEI. WagaShelf is my portfolio project. I'm using it to learn frontend, backend, APIs, databases and React, and to get ready for co-op applications (first work term: Summer 2027).

**Deadline:** a stable, demonstrable MVP by **November 13, 2026**, for a meeting with a local tech leader on **November 16**. I must be able to explain every design choice and the whole architecture myself, so understanding matters as much as working code.

## Workflow rules (always follow)

1. **Never run `git commit`, `git push`, `git merge` or anything that changes Git history.** I review, commit and push every change myself. You may run read-only Git commands (`git status`, `git diff`, `git log`) and create or switch branches **only when I ask**.
2. **For every feature, follow these steps in order:**
   1. Investigate the existing code involved.
   2. Propose an implementation plan.
   3. Explain the architectural implications and any alternatives.
   4. **Wait for my approval before changing any files.**
   5. Implement the feature.
   6. Run the tests and review the changes.
   7. Summarize what changed and what I should understand about it.
3. **One feature at a time.** Each feature gets its own GitHub issue and branch (named like `23-add-cors`); I open the PR and write "Closes #N".
4. **Don't rewrite or replace working code unnecessarily,** and don't make unrelated changes in the same branch.
5. **No significant architectural changes without my approval.** Prefer simple, maintainable solutions over clever or complex ones.
6. **No scope expansion before November 13.** If you notice something worth doing that isn't on the roadmap, suggest it and add it to the "Deferred" list instead of doing it.

## How I learn best

- Explain **what** a new concept does and **why** it fits here before or as you use it, and mention the main alternatives.
- Explain how the pieces communicate (browser → API → database and back).
- Keep explanations clear and concrete; tables and small diagrams help.
- Don't just generate code: after each change, I should be able to explain it in an interview.

## Environment

- Windows, PowerShell, PyCharm.
- Backend virtual environment: `backend\.venv`, activated with `.\.venv\Scripts\Activate.ps1` from `backend`.
- Run the backend from `backend`: `fastapi dev main.py` (API docs at http://127.0.0.1:8000/docs).
- Run the tests from `backend`: `pytest -v`.
- **Don't write files with PowerShell's `>` redirect** (it saves UTF-16). Use `Out-File -Encoding utf8` or write the file directly.

## Architecture (as of November 5, 2026)

```
Browser (GitHub Pages)                    Local only
┌───────────────────────────┐            ┌────────────────────────────┐
│ index.html + app.js       │            │ FastAPI (main.py)          │
│  ├─ search → AniList API  │            │  ├─ Pydantic (models.py)   │
│  └─ shelf → localStorage  │            │  └─ SQLite (database.py)   │
└───────────────────────────┘            └────────────────────────────┘
        The frontend and backend are NOT connected yet.
```

**Frontend (repo root):** `index.html`, `style.css` (Pico.css from a CDN), `api.js` (AniList GraphQL search, `getMediaType`, `getProgressLabel`), `app.js` (shelf rendering, add/edit/delete, status labels, duplicate checks, search UI). The shelf is stored in localStorage under `FollowingList`, with ids from `crypto.randomUUID()`. Live at https://obich1.github.io/WagaShelf/.

**Backend (`backend/`):**
- `database.py`: `DATABASE_FILE = "wagashelf.db"`, `get_connection()` (with `sqlite3.Row`), `create_table()` for the `entries` table (`id`, `anilist_id`, `title`, `type`, `chapters`, `episodes`, `status`, `rating`, `cover`).
- `models.py`: `EntryCreate` and `EntryUpdate` (Pydantic), with `Literal` types for media type and status, rating 1–10, non-empty title. In `EntryUpdate`, title, type and status default to `None` but don't accept `null`, by design.
- `main.py`: `GET /entries`, `POST /entries` (201), `PATCH /entries/{id}` (partial update with `exclude_unset=True`, 404 if missing), `DELETE /entries/{id}` (200, 404 if missing). Named SQL placeholders throughout.
- `test_main.py`: 15 pytest tests using a `client` fixture (temporary database through `tmp_path` and `monkeypatch` on `database.DATABASE_FILE`) and a `created_entry` fixture. All pass.

**Shared values** (must stay in sync between frontend and backend):
- Media types: `Manga`, `Anime`, `Manhwa`, `Comic`, `Novel`, `Manhua`
- Statuses: `planning`, `current`, `completed`, `on-hold`, `dropped`, `revisiting`

## Known issues (found November 5)

**Will break the frontend–backend integration:**
1. The backend has no CORS setup, so the browser will block frontend requests to it.
2. The frontend stores ratings as strings (`"7"`, or `""` when empty); the backend expects a number or `null`.
3. `selectedMedia` isn't cleared when the title is typed by hand, so a manual entry can get the wrong AniList id and cover.
4. Chapters and episodes aren't saved, though the backend supports them.

**Backend cleanup:**

5. `main.py` line 2 is an unused, accidental `opentelemetry` import.
6. The database path is relative to the folder the server is started from; it should be relative to `database.py`.
7. `create_table()` runs on import; it should move to FastAPI's lifespan startup.
8. `requirements.txt` is UTF-16 encoded (from PowerShell `>`) and lists about 60 packages, many unused.

**Missing:**

9. No CI.
10. The README is out of date.

## Roadmap

| When | Phase | Work |
|---|---|---|
| Nov 5 | 0. Foundations | Fix issues 5–8; add GitHub Actions CI that runs pytest on every PR |
| Nov 6–7 | 1. Integration (vanilla JS) | CORS; `getEntries`/`createEntry`/`updateEntry`/`deleteEntry` in `api.js`; replace localStorage; fix issues 2–4; friendly errors when the backend is unreachable |
| Nov 8–11 | 2. React migration | Vite + React app in `frontend/`, built one component at a time until it matches the old frontend, then remove the old files |
| Nov 12 | 3. Polish | Layout, empty and loading states, in-page messages instead of `alert()`, README with an architecture diagram |
| Nov 13 | Feature freeze | Only bug fixes after this |
| Nov 14–15 | Rehearsal | Architecture walkthrough and practice questions |

Connecting the backend comes before React on purpose: only one new thing at a time, and a working full-stack version is on `main` by November 7 as a fallback if React runs late.

**Proposed React structure (to be confirmed before Phase 2):**
```
App                  ← holds the entries state, loads it from the API
├─ SearchPanel       → SearchResultCard
├─ AddEntryForm
└─ Shelf             → ShelfItem (status, rating, delete)
api/entries.js, api/anilist.js, utils/labels.js
```

**Decisions still open** (ask me before acting on them):
- Confirm the roadmap order (integration before React).
- Demo setup: run frontend and backend locally for the meeting (recommended; free hosting resets SQLite data).
- Trim `requirements.txt` to direct dependencies (`fastapi[standard]`, `pytest`) and save it as UTF-8.

**Deferred until after November 16:** deploying the backend, user accounts, books (Open Library) and movies (TMDB), AI recommendations, a page for each title, `parametrize`/`conftest.py` test refactors.


I create GitHub issues and feature branches.
Claude works only on the branch I have checked out.
Claude must not create, switch, commit, push or merge branches.

## Dependencies

Before introducing a new library or framework:
- Explain why it is needed.
- Identify alternatives.
- Explain its impact on project complexity.
- Wait for my approval.

Prefer existing dependencies and standard library functionality
where appropriate.

## Repository Verification

The architecture and implementation descriptions in this document
represent my understanding of the project at the time of writing.

Verify them against the actual repository before making decisions.

If the code differs from this document:
1. Identify the discrepancy.
2. Explain what you found.
3. Ask me before changing the documented architecture.

## Definition of Done

A feature is complete only when:

- Its expected functionality works.
- Existing functionality hasn't regressed.
- Appropriate tests pass.
- Errors are handled appropriately.
- The implementation follows the approved architecture.
- I understand the implementation and can explain it.

For frontend/backend integration:
- Adding an entry persists it in SQLite.
- Refreshing the page preserves the entry.
- Editing updates the database.
- Deleting removes the entry.
- Invalid requests are handled correctly.
- Backend connection failures produce understandable messages.
