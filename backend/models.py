from datetime import datetime, timezone
from typing import Literal

from sqlalchemy import JSON, Column, UniqueConstraint
from sqlmodel import Field, SQLModel

# Allowed values, shared by the API models added in the next steps.
MediaType = Literal["anime", "manga", "manhwa", "manhua", "novel", "book"]
Status = Literal["planning", "current", "completed", "on-hold", "dropped", "revisiting"]
Source = Literal["anilist", "openlibrary"]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    """A WagaShelf user. Sign-in is handled by Clerk, so the id is Clerk's user id."""

    __tablename__ = "users"

    id: str = Field(primary_key=True)
    created_at: datetime = Field(default_factory=utc_now)


class Title(SQLModel, table=True):
    """Shared catalogue: one row per title, referenced by every user who saves it."""

    __tablename__ = "titles"
    # The same AniList or Open Library title can only be stored once.
    __table_args__ = (UniqueConstraint("source", "source_id"),)

    id: int | None = Field(default=None, primary_key=True)
    source: str  # where the data comes from: "anilist" or "openlibrary"
    source_id: str  # the title's id in that source (text, because Open Library ids aren't numbers)
    media_type: str
    title: str
    cover_url: str | None = None
    description: str | None = None
    genres: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    release_year: int | None = None
    release_status: str | None = None  # e.g. "finished" or "releasing"
    # Known totals; None when unknown or still releasing.
    total_episodes: int | None = None
    total_chapters: int | None = None
    total_volumes: int | None = None
    total_pages: int | None = None
    # Official links, e.g. [{"site": "Crunchyroll", "url": "https://..."}]
    external_links: list[dict] = Field(default_factory=list, sa_column=Column(JSON))


class LibraryEntry(SQLModel, table=True):
    """Personal library: one user's relationship to one title."""

    __tablename__ = "library_entries"
    # A user can't have the same title in their library twice.
    __table_args__ = (UniqueConstraint("user_id", "title_id"),)

    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    title_id: int = Field(foreign_key="titles.id")
    # Everything personal is optional: saving comes first, tracking is optional.
    status: str | None = None
    progress: int | None = None  # episodes, chapters or pages, depending on the media type
    rating: float | None = None
    notes: str | None = None  # private: only the owner ever sees these
    added_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
