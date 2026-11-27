import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import catalogue, library

# Websites allowed to call this API from a browser (comma-separated).
# Locally that's the Vite dev server; in production, the GitHub Pages site.
FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")


# The database tables are no longer created here. Alembic migrations do that (and every later
# schema change): run `alembic upgrade head` before starting the server (see docs/deployment.md).
app = FastAPI(title="WagaShelf API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in FRONTEND_ORIGINS if origin.strip()],
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(catalogue.router)
app.include_router(library.router)


@app.get("/health")
def health():
    """A simple check that the server is running (used by the host and the frontend)."""
    return {"status": "ok"}
