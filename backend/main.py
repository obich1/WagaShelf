import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_db_and_tables
from routers import catalogue

# Websites allowed to call this API from a browser (comma-separated).
# Locally that's the Vite dev server; in production, the GitHub Pages site.
FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once when the server starts, not when this file is imported.
    create_db_and_tables()
    yield
    # Code after yield would run when the server shuts down.


app = FastAPI(title="WagaShelf API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in FRONTEND_ORIGINS if origin.strip()],
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(catalogue.router)


@app.get("/health")
def health():
    """A simple check that the server is running (used by the host and the frontend)."""
    return {"status": "ok"}
