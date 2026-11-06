from datetime import datetime, timezone
from typing import Annotated, Literal

from sqlalchemy import JSON, Column, UniqueConstraint
from pydantic import field_validator
from sqlmodel import Field, SQLModel

# Allowed values, used by the API models at the bottom of this file.
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
    creators: list[str] = Field(default_factory=list, sa_column=Column(JSON))  # e.g. book authors
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


# ---------------------------------------------------------------------------
# API models: the shapes of request and response bodies (no table=True).
# ---------------------------------------------------------------------------


class CatalogueItem(SQLModel):
    """A title in WagaShelf's common format, whichever source it came from."""

    source: Source
    source_id: str
    media_type: MediaType
    title: str
    creators: list[str] = []
    cover_url: str | None = None
    description: str | None = None
    genres: list[str] = []
    release_year: int | None = None
    release_status: str | None = None
    total_episodes: int | None = None
    total_chapters: int | None = None
    total_volumes: int | None = None
    total_pages: int | None = None
    external_links: list[dict] = []


class TitleRead(CatalogueItem):
    """A catalogue title stored in WagaShelf's database (so it has an id)."""

    id: int


class SearchResponse(SQLModel):
    results: list[CatalogueItem]
    # Sources that couldn't be reached, so the page can say results may be incomplete.
    unavailable_sources: list[str] = []


Rating = Annotated[float, Field(ge=1, le=10)]
Progress = Annotated[int, Field(ge=0)]
Notes = Annotated[str, Field(max_length=5000)]


class LibraryEntryCreate(SQLModel):
    """Body of POST /library: which title to save, plus optional tracking details."""

    source: Source
    source_id: str
    status: Status | None = None
    progress: Progress | None = None
    rating: Rating | None = None
    notes: Notes | None = None


class LibraryEntryUpdate(SQLModel):
    """Body of PATCH /library/{id}. Only the fields that are sent are changed; null clears one."""

    status: Status | None = None
    progress: Progress | None = None
    rating: Rating | None = None
    notes: Notes | None = None


class LibraryEntryRead(SQLModel):
    id: int
    status: Status | None
    progress: int | None
    rating: float | None
    notes: str | None
    added_at: datetime
    updated_at: datetime
    title: TitleRead

    @field_validator("added_at", "updated_at")
    @classmethod
    def mark_as_utc(cls, value: datetime) -> datetime:
        """SQLite forgets time zones, so say explicitly that stored times are UTC."""
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
