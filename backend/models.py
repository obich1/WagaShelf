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

