# Running and deploying WagaShelf

## Run it locally

You need Python 3.12+ and Node.js 22+.

**1. Clerk (sign-in), once**

1. Create a free account at clerk.com and create an application (email sign-in is enough).
2. In the Clerk dashboard, open **API keys** and note the **Publishable key** (`pk_test_...`) and
   the **Frontend API URL** (`https://<something>.clerk.accounts.dev`).
3. **Usernames** (ADR 013). Both steps are needed, in each Clerk instance (development and, later, production):
   - **User & authentication → Username**: turn it on (and make it required if every account should have one).
   - **Sessions → Customize session token**: add the claim `{ "username": "{{user.username}}" }`.
     The backend copies it to `users.username` on the person's next request. Without the claim, nothing is saved.

**2. Backend** (from `backend`, in PowerShell)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env      # then edit .env: set CLERK_ISSUER to your Frontend API URL
alembic upgrade head        # create or update the database tables (run again after pulling schema changes)
fastapi dev main.py         # API at http://127.0.0.1:8000, docs at /docs
pytest -v                   # run the tests
```

The backend reads `backend/.env` when it starts (`database.py` loads it). Without `DATABASE_URL`, data is stored in
`backend/wagashelf.db` (SQLite).

**Database changes (migrations).** The tables are created and changed by Alembic migrations in
`backend/migrations/`, not by the app. After pulling a change that touches `models.py`, run
`alembic upgrade head`. To make a change yourself: edit `models.py`, then
`alembic revision --autogenerate -m "what changed"`, read the generated file (autogenerate is a
draft), and run `alembic upgrade head`.

If your local `wagashelf.db` was created before Alembic (tables exist, but no `alembic_version`
table), run `alembic stamp head` once instead. That marks it as already up to date.

**3. Frontend** (from `frontend`, in a second terminal)

```powershell
npm install
copy .env.example .env.local   # then edit: set VITE_CLERK_PUBLISHABLE_KEY
npm run dev                    # app at http://localhost:5173
```

## Deploy it

The live setup: React app on **Vercel**, API on **Render**, database on **Neon**
(PostgreSQL). All three have free tiers; check their current limits.

**1. Database: Neon**

1. Create a free project at neon.tech.
2. Copy its connection string (`postgresql://...`). This is a password: never commit it or
   paste it anywhere public.

**2. API: Render**

1. At render.com, choose **New → Blueprint** and connect the WagaShelf repository. Render reads
   `render.yaml` and creates the `wagashelf-api` service.
2. When asked, set `DATABASE_URL` (the Neon string) and `CLERK_ISSUER` (your Clerk Frontend API URL).
3. When it's live, open `https://<your-service>.onrender.com/health`. It should show `{"status":"ok"}`.

Render's start command runs `alembic upgrade head` before the API starts, so each deploy brings
the Neon database up to date. Two things must be true for that to work, and neither is checked
by Git:

- **The Start Command in the Render dashboard must match `render.yaml`**
  (`alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT`). `render.yaml` only
  sets the command when the service is created from the Blueprint; later edits to the file
  don't change a service that already exists. Check **Settings → Start Command** after changing it.
- **`DATABASE_URL` in Render must be the current Neon string.** It is a value you paste into the
  dashboard, so it does not change when Neon's string changes (for example after resetting the
  password or switching branch). Migrations can't fix it: they run against whatever database the
  variable points to, so a stale value migrates the *old* database and leaves the live one behind.
  Never point it at a Neon *branch* you made for an experiment: branches can expire, and the
  users and entries written to one disappear with it. Production is the main branch.

**One-time step when Alembic was introduced (ADR 012):** the Neon
database already had its tables, so it must be told it is at the baseline version *before* the first
deploy that includes Alembic. Otherwise the baseline migration would try to create tables that exist.

1. In Neon, create a branch or backup of the production database first.
2. From `backend`, with the Neon string: `$env:DATABASE_URL = "<Neon string>"; alembic stamp head`
   (then clear it: `Remove-Item Env:DATABASE_URL`). This only adds an `alembic_version` table.
3. Check with `alembic current`; it should show `0001 (head)`.
4. Deploy.

The free tier sleeps after a period without requests; the first request afterwards can take
around a minute. Open the app a minute before a demo.

**3. Frontend: Vercel**

1. At vercel.com, sign in with GitHub, choose **Add New → Project** and import the WagaShelf
   repository.
2. Set **Root Directory** to `frontend`. Vercel detects Vite and uses `npm run build`, with the
   output in `dist`.
3. Under **Environment Variables**, add:
   - `VITE_API_URL` = your Render URL (e.g. `https://wagashelf-api.onrender.com`)
   - `VITE_CLERK_PUBLISHABLE_KEY` = your Clerk publishable key
4. Deploy. The app is published at `https://waga-shelf.vercel.app/`, and every merge into `main` deploys again
   automatically.
5. **Preview deployments:** Vercel also builds each pull request at its own address. They are
   useful for checking how a change looks, but they can't load any data: the API refuses requests
   from addresses that aren't in its `FRONTEND_ORIGINS` (and sign-in needs `CLERK_AUTHORIZED_PARTIES`),
   so a preview shows "Can't reach WagaShelf". To test a change with real data, merge it and check
   the live site, or add that one preview address to `FRONTEND_ORIGINS` temporarily.
6. **Link previews:** the `og:` tags in `frontend/index.html` give LinkedIn, Discord and others
   a title, description and image (`frontend/public/og-image.png`, 1200 × 630). `og:url` and
   `og:image` are full addresses, so **update them if the site moves**. Sites keep a preview for
   days: after a change, paste the link into LinkedIn's Post Inspector
   (linkedin.com/post-inspector) to refresh it.

The frontend was on GitHub Pages until November 20, 2026 (see ADR 010). Its deploy workflow was
removed and the Pages site unpublished.

**When the frontend's address changes,** update these together, or sign-in and shelves stop working
on the new address:
- Render: `FRONTEND_ORIGINS` and `CLERK_AUTHORIZED_PARTIES`
- Clerk: the allowed origins or domains for your instance
- `frontend/index.html`: `og:url` and `og:image`

**4. Clerk settings**

In the Clerk dashboard, make sure `https://waga-shelf.vercel.app` is allowed for your instance.
Clerk **development** instances show a small "development mode" badge and have usage limits;
a **production** instance requires a domain you own. A development instance is fine for the MVP.

## When the live site stops working

| What you see | Likely cause | Check |
|---|---|---|
| "Can't reach WagaShelf" on the live site, and the browser console shows a **CORS error** together with `500` | The API crashed on that request. A crashed (500) response carries no CORS headers, so the browser reports it as a network failure, not as a server error. | Render → **Logs** for the traceback. If it mentions a missing table or column, the database is behind: see the next rows. |
| Same, right after a deploy that changed the database | The migration didn't run against the live database | Render → **Events**: did the deploy succeed? Is the Start Command correct (above)? From `backend`, run `alembic current` with the Neon string: it should show the newest revision, not an older one. |
| Signed-in pages fail with the CORS-looking error, but `/health` and public pages work (for example `curl https://wagashelf-api.onrender.com/titles/anilist/21`) | The live database is behind: a migration (say, `users.username`) was never applied, usually because Render's Start Command lacks `alembic upgrade head` | Compare `SELECT * FROM alembic_version;` in Neon with the newest file in `backend/migrations/versions`. Fix the Start Command (above), then from `backend` run `alembic upgrade head` with the Neon string. |
| Everything fails right after you created or used a Neon **branch** | Render's `DATABASE_URL` points at a branch, and branches can expire and be deleted (with their users and entries) | Render must point at the **main** branch only. Use branches for experiments and never paste their string into Render. Neon → Branches: does the branch in your `DATABASE_URL` still exist? |
| The migration "succeeded" but the live data is still missing or the app still fails | Render's `DATABASE_URL` points at a different (older) database than the one you migrated | Compare Render's `DATABASE_URL` with the Neon dashboard's current connection string. |
| "Can't reach WagaShelf" only on a Vercel preview | The preview address isn't in `FRONTEND_ORIGINS` | Expected: see "Preview deployments" above. |
| Sign-in finishes (Clerk's logs show it) but the page keeps loading or looks signed out until a reload | Clerk waiting for a page load that never comes, because of the `#/` URLs. Fixed in #97 by giving Clerk the router; if it returns, check that `AuthProvider` still gets `navigate` in `Root.jsx`. | Reproduce with an iPhone profile in Playwright WebKit: sign in starting from `#/shelves` (the Home page hides it, because its redirect does reload). |
| Slow first load, then it works | The free tier woke up from sleep | Wait about a minute. |

To tell a CORS problem from a crash, open the browser's **Network** tab, click the failed request,
and look at its status: `500` means the API crashed (read Render's logs); a request that shows
no status at all, with a CORS message in the console, usually means the origin isn't allowed.

## Configuration reference

| Where | Variable | Example | Secret? |
|---|---|---|---|
| Backend | `DATABASE_URL` | `postgresql://user:pass@host/db` | **Yes** |
| Backend | `CLERK_ISSUER` | `https://example-12.clerk.accounts.dev` | No |
| Backend | `CLERK_AUTHORIZED_PARTIES` | `https://waga-shelf.vercel.app` | No |
| Backend | `FRONTEND_ORIGINS` | `https://waga-shelf.vercel.app` | No |
| Frontend (Vercel) | `VITE_API_URL` | `https://wagashelf-api.onrender.com` | No |
| Frontend (Vercel) | `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | No (public by design) |
