from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

import catalogue
from database import get_session
from models import MediaType, SearchResponse, Source, TitleRead
from sources.errors import SourceUnavailable, TitleNotFound

router = APIRouter(tags=["catalogue"])

SessionDep = Annotated[Session, Depends(get_session)]


@router.get("/search", response_model=SearchResponse)
def search(
    q: Annotated[str, Query(min_length=1, max_length=100)],
    category: MediaType | Literal["all"] = "all",
):
    """Search every supported catalogue at once, or one media category."""
    try:
        return catalogue.search(q.strip(), category)
    except SourceUnavailable:
        raise HTTPException(status_code=502, detail="The title catalogues can't be reached right now")


@router.get("/trending", response_model=SearchResponse)
def trending(category: MediaType | Literal["all"] = "all"):
    """Popular titles right now, for browsing Discover before searching."""
    try:
        return catalogue.trending(category)
    except SourceUnavailable:
        raise HTTPException(status_code=502, detail="The title catalogues can't be reached right now")


@router.get("/titles/{source}/{source_id}", response_model=TitleRead)
def get_title(source: Source, source_id: str, session: SessionDep):
    """A title's detail page data, refreshed from its source and stored in the shared catalogue."""
    try:
        return catalogue.refresh_title(session, source, source_id)
    except TitleNotFound:
        raise HTTPException(status_code=404, detail="Title not found")
    except SourceUnavailable:
        raise HTTPException(status_code=502, detail="The title catalogue can't be reached right now")
