import pytest
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from models import LibraryEntry, Title, User


def make_title(**changes):
    data = {
        "source": "anilist",
        "source_id": "21",
        "media_type": "anime",
        "title": "One Piece",
    }
    data.update(changes)
    return Title(**data)


def add_user_and_title(session, user_id="user_a"):
    user = User(id=user_id)
    title = make_title()
    session.add_all([user, title])
    session.commit()
    return user, title


def test_title_gets_an_id_when_saved(session):
    title = make_title()
    session.add(title)
    session.commit()

    assert title.id is not None


def test_genres_and_links_are_stored_as_lists(session):
    links = [{"site": "Crunchyroll", "url": "https://www.crunchyroll.com/series/one-piece"}]
    session.add(make_title(genres=["Action", "Adventure"], external_links=links))
    session.commit()
    session.expire_all()  # forget cached objects, so the next query really reads the database

    saved = session.exec(select(Title)).one()
    assert saved.genres == ["Action", "Adventure"]
    assert saved.external_links == links


def test_same_title_can_only_be_stored_once(session):
    session.add(make_title())
    session.commit()

    session.add(make_title())
    with pytest.raises(IntegrityError):
        session.commit()


def test_same_source_id_from_different_sources_is_allowed(session):
    session.add(make_title(source="anilist", source_id="21"))
    session.add(make_title(source="openlibrary", source_id="21"))
    session.commit()

    assert len(session.exec(select(Title)).all()) == 2


def test_title_can_be_saved_without_a_status(session):
    user, title = add_user_and_title(session)
    entry = LibraryEntry(user_id=user.id, title_id=title.id)
    session.add(entry)
    session.commit()

    assert entry.id is not None
    assert entry.status is None
    assert entry.progress is None
    assert entry.added_at is not None


def test_user_cannot_save_the_same_title_twice(session):
    user, title = add_user_and_title(session)
    session.add(LibraryEntry(user_id=user.id, title_id=title.id))
    session.commit()

    session.add(LibraryEntry(user_id=user.id, title_id=title.id, status="current"))
    with pytest.raises(IntegrityError):
        session.commit()


def test_two_users_share_one_title_with_their_own_details(session):
    user_a, title = add_user_and_title(session, "user_a")
    user_b = User(id="user_b")
    session.add(user_b)
    session.add(LibraryEntry(user_id=user_a.id, title_id=title.id, status="completed", rating=9))
    session.add(LibraryEntry(user_id=user_b.id, title_id=title.id, status="planning"))
    session.commit()

    entries = session.exec(select(LibraryEntry).order_by(LibraryEntry.user_id)).all()
    assert len(session.exec(select(Title)).all()) == 1
    assert [e.status for e in entries] == ["completed", "planning"]
    assert [e.rating for e in entries] == [9, None]


def test_entry_must_belong_to_an_existing_user(session):
    title = make_title()
    session.add(title)
    session.commit()

    session.add(LibraryEntry(user_id="nobody", title_id=title.id))
    with pytest.raises(IntegrityError):
        session.commit()


def test_entry_must_point_to_an_existing_title(session):
    session.add(User(id="user_a"))
    session.commit()

    session.add(LibraryEntry(user_id="user_a", title_id=999))
    with pytest.raises(IntegrityError):
        session.commit()
