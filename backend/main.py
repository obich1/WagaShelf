from contextlib import asynccontextmanager

from fastapi import FastAPI

from database import create_db_and_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once when the server starts, not when this file is imported.
    create_db_and_tables()
    yield
    # Code after yield would run when the server shuts down.


app = FastAPI(title="WagaShelf API", lifespan=lifespan)


@app.get("/health")
def health():
    """A simple check that the server is running (useful once it's deployed)."""
    return {"status": "ok"}
