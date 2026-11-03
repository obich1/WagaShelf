from pydantic import BaseModel

class EntryCreate(BaseModel):
    anilist_id: int | None = None
    title: str
    type: str
    status: str
    rating: float | None = None
    chapters: int | None = None
    episodes: int | None = None
    cover: str | None = None

class EntryUpdate(BaseModel):
    anilist_id: int | None = None
    title: str | None = None
    type: str | None = None
    status: str | None = None
    rating: float | None = None
    chapters: int | None = None
    episodes: int | None = None
    cover: str | None = None
