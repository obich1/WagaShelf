"""The signed-in user's personal library (their shelves)."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, select

import catalogue
from auth import CurrentUser
from database import get_session
from models import (
    LibraryEntry,
    LibraryEntryCreate,
    LibraryEntryRead,
    LibraryEntryUpdate,
    MediaType,
    Status,
    Title,
    TitleRead,
    utc_now,
)
from sources.errors import SourceUnavailable, TitleNotFound

router = APIRouter(prefix="/library", tags=["library"])

SessionDep = Annotated[Session, Depends(get_session)]


def to_read_model(entry: LibraryEntry, title: Title) -> LibraryEntryRead:
    """Combine an entry with its catalogue title into the shape the frontend receives."""
    return LibraryEntryRead(
        **entry.model_dump(exclude={"user_id", "title_id"}),
        title=TitleRead.model_validate(title),
    )


def find_own_entry(session: Session, user_id: str, entry_id: int) -> LibraryEntry:
    """Only return entries that belong to this user; anyone else's entry looks like a 404."""
    entry = session.get(LibraryEntry, entry_id)
    if entry is None or entry.user_id != user_id:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@router.get("", response_model=list[LibraryEntryRead])
def list_library(
    user: CurrentUser,
    session: SessionDep,
    media_type: MediaType | None = None,
    status: Status | None = None,
):
    """The user's saved titles, most recently updated first, optionally filtered."""
    statement = (
        select(LibraryEntry, Title)
        .join(Title)
        .where(LibraryEntry.user_id == user.id)
        .order_by(LibraryEntry.updated_at.desc(), LibraryEntry.id.desc())
    )
    if media_type:
        statement = statement.where(Title.media_type == media_type)
    if status:
        statement = statement.where(LibraryEntry.status == status)
    return [to_read_model(entry, title) for entry, title in session.exec(statement).all()]


@router.post("", response_model=LibraryEntryRead, status_code=201)
def add_to_library(body: LibraryEntryCreate, user: CurrentUser, session: SessionDep):
    """Save a title to the user's library. Status and progress are optional."""
    try:
        title = catalogue.get_or_fetch_title(session, body.source, body.source_id)
    except TitleNotFound:
        raise HTTPException(status_code=404, detail="Title not found")
    except SourceUnavailable:
        raise HTTPException(status_code=502, detail="The title catalogue can't be reached right now")

    existing = session.exec(
        select(LibraryEntry).where(LibraryEntry.user_id == user.id, LibraryEntry.title_id == title.id)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="This title is already on your shelf")

    entry = LibraryEntry(
        user_id=user.id,
        title_id=title.id,
        **body.model_dump(include={"status", "progress", "rating", "notes"}),
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return to_read_model(entry, title)


@router.patch("/{entry_id}", response_model=LibraryEntryRead)
def update_entry(entry_id: int, body: LibraryEntryUpdate, user: CurrentUser, session: SessionDep):
    """Change status, progress, rating or notes. Fields that aren't sent stay the same."""
    entry = find_own_entry(session, user.id, entry_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    entry.updated_at = utc_now()
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return to_read_model(entry, session.get(Title, entry.title_id))


@router.delete("/{entry_id}", status_code=204)
def remove_from_library(entry_id: int, user: CurrentUser, session: SessionDep):
    """Remove a title from the user's library (the shared catalogue title stays)."""
    entry = find_own_entry(session, user.id, entry_id)
    session.delete(entry)
    session.commit()
    return Response(status_code=204)
