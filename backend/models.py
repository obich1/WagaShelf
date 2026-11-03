from pydantic import BaseModel,Field
from typing import Literal,Annotated

MediaType = Literal["Manga","Anime","Manhwa","Comic","Novel","Manhua"]
Status = Literal["planning","current","completed","on-hold","dropped","revisiting"]
Rating = Annotated[float,Field(ge=1, le=10)]
Title = Annotated[str,Field(min_length=1)]


class EntryCreate(BaseModel):
    anilist_id: int | None = None
    title: Title
    type: MediaType
    status: Status
    rating: Rating | None = None
    chapters: int | None = None
    episodes: int | None = None
    cover: str | None = None


class EntryUpdate(BaseModel):
    anilist_id: int | None = None
    # No |None: the field can be left out and None(default) is skipped in the checks, but sending null is rejected. Applies to title, type and status.
    title: Title = None
    type: MediaType = None
    status: Status = None
    rating:  Rating | None = None
    chapters: int | None = None
    episodes: int | None = None
    cover: str | None = None
