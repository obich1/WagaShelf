# Running and deploying WagaShelf

## Run it locally

You need Python 3.12+ and Node.js 22+.

**1. Clerk (sign-in), once**

1. Create a free account at clerk.com and create an application (email sign-in is enough).
2. In the Clerk dashboard, open **API keys** and note the **Publishable key** (`pk_test_...`) and
   the **Frontend API URL** (`https://<something>.clerk.accounts.dev`).

**2. Backend** (from `backend`, in PowerShell)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env      # then edit .env: set CLERK_ISSUER to your Frontend API URL
fastapi dev main.py         # API at http://127.0.0.1:8000, docs at /docs
pytest -v                   # run the tests
```

The backend reads `backend/.env` when it starts (`database.py` loads it). Without `DATABASE_URL`, data is stored in
`backend/wagashelf.db` (SQLite).

**3. Frontend** (from `frontend`, in a second terminal)

```powershell
npm install
copy .env.example .env.local   # then edit: set VITE_CLERK_PUBLISHABLE_KEY
npm run dev                    # app at http://localhost:5173
```

## Deploy it

The live setup: React app on **GitHub Pages**, API on **Render**, database on **Neon**
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

The free tier sleeps after a period without requests; the first request afterwards can take
around a minute. Open the app a minute before a demo.

**3. Frontend: GitHub Pages**

1. In the GitHub repository: **Settings → Pages → Source: GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables**, add:
   - `VITE_API_URL` = your Render URL (e.g. `https://wagashelf-api.onrender.com`)
   - `VITE_CLERK_PUBLISHABLE_KEY` = your Clerk publishable key
3. Merging into `main` runs `.github/workflows/deploy-frontend.yml`, which builds the app and
   publishes it at `https://obich1.github.io/WagaShelf/`. You can also run it by hand from the
   **Actions** tab.

**4. Clerk settings**

In the Clerk dashboard, make sure `https://obich1.github.io` is allowed for your instance.
Clerk **development** instances show a small "development mode" badge and have usage limits;
a **production** instance requires a domain you own. A development instance is fine for the MVP.

## Configuration reference

| Where | Variable | Example | Secret? |
|---|---|---|---|
| Backend | `DATABASE_URL` | `postgresql://user:pass@host/db` | **Yes** |
| Backend | `CLERK_ISSUER` | `https://example-12.clerk.accounts.dev` | No |
| Backend | `CLERK_AUTHORIZED_PARTIES` | `https://obich1.github.io` | No |
| Backend | `FRONTEND_ORIGINS` | `https://obich1.github.io` | No |
| Frontend | `VITE_API_URL` | `https://wagashelf-api.onrender.com` | No |
| Frontend | `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | No (public by design) |
