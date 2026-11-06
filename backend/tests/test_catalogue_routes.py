"""Tests for GET /search and GET /titles/{source}/{source_id}.

The external sources are replaced with fakes (monkeypatch), so these tests never call
AniList or Open Library and always give the same results.
"""

import pytest
from sqlmodel import select

from models import CatalogueItem, Title
from sources import anilist, openlibrary
from sources.errors import SourceUnavailable, TitleNotFound


def anime(**changes):
    data = {"source": "anilist", "source_id": "21", "media_type": "anime", "title": "One Piece"}
    return CatalogueItem(**{**data, **changes})


def book(**changes):
    data = {"source": "openlibrary", "source_id": "OL893414W", "media_type": "book", "title": "Dune"}
    return CatalogueItem(**{**data, **changes})


def unavailable(*args):
    raise SourceUnavailable("down")


def not_found(*args):
    raise TitleNotFound("missing")


@pytest.fixture
def fake_sources(monkeypatch):
    """Both sources work and return one result each. Tests can override them."""
    monkeypatch.setattr(anilist, "search", lambda query, category: [anime()])
    monkeypatch.setattr(openlibrary, "search", lambda query: [book()])
    monkeypatch.setattr(anilist, "get_title", lambda source_id: anime(source_id=source_id))
    monkeypatch.setattr(openlibrary, "get_title", lambda source_id: book(source_id=source_id))


# --- Search ---------------------------------------------------------------


def test_search_all_combines_both_sources(client, fake_sources):
    response = client.get("/search", params={"q": "one"})

    assert response.status_code == 200
    body = response.json()
    assert [r["source"] for r in body["results"]] == ["anilist", "openlibrary"]
    assert body["unavailable_sources"] == []


def test_search_books_only_uses_open_library(client, fake_sources, monkeypatch):
    monkeypatch.setattr(anilist, "search", unavailable)  # would show up as unavailable if called

    response = client.get("/search", params={"q": "dune", "category": "book"})

    assert response.status_code == 200
    assert response.json() == {"results": [book().model_dump()], "unavailable_sources": []}


def test_search_anime_only_uses_anilist(client, fake_sources, monkeypatch):
    monkeypatch.setattr(openlibrary, "search", unavailable)

    response = client.get("/search", params={"q": "one", "category": "anime"})

    assert [r["source"] for r in response.json()["results"]] == ["anilist"]


def test_search_returns_partial_results_when_one_source_is_down(client, fake_sources, monkeypatch):
    monkeypatch.setattr(openlibrary, "search", unavailable)

    response = client.get("/search", params={"q": "one"})

    assert response.status_code == 200
    assert len(response.json()["results"]) == 1
    assert response.json()["unavailable_sources"] == ["Open Library"]


def test_search_fails_when_every_source_is_down(client, monkeypatch):
    monkeypatch.setattr(anilist, "search", unavailable)
    monkeypatch.setattr(openlibrary, "search", unavailable)

    response = client.get("/search", params={"q": "one"})

    assert response.status_code == 502


def test_search_needs_a_query(client):
    assert client.get("/search").status_code == 422
    assert client.get("/search", params={"q": ""}).status_code == 422


def test_search_rejects_unknown_category(client):
    response = client.get("/search", params={"q": "one", "category": "podcast"})

    assert response.status_code == 422


# --- Title details --------------------------------------------------------


def test_title_details_are_stored_in_the_catalogue(client, session, fake_sources):
    response = client.get("/titles/anilist/21")

    assert response.status_code == 200
    assert response.json()["title"] == "One Piece"
    assert response.json()["id"] is not None
    assert session.exec(select(Title)).one().source_id == "21"


def test_viewing_a_title_again_updates_it_instead_of_duplicating(client, session, fake_sources, monkeypatch):
    client.get("/titles/anilist/21")
    monkeypatch.setattr(anilist, "get_title", lambda source_id: anime(title="ONE PIECE", total_episodes=1100))

    response = client.get("/titles/anilist/21")

    assert response.json()["title"] == "ONE PIECE"
    titles = session.exec(select(Title)).all()
    assert len(titles) == 1
    assert titles[0].total_episodes == 1100


def test_stored_title_is_used_when_the_source_is_down(client, fake_sources, monkeypatch):
    client.get("/titles/openlibrary/OL893414W")
    monkeypatch.setattr(openlibrary, "get_title", unavailable)

    response = client.get("/titles/openlibrary/OL893414W")

    assert response.status_code == 200
    assert response.json()["title"] == "Dune"


def test_title_fails_when_source_is_down_and_nothing_is_stored(client, monkeypatch):
    monkeypatch.setattr(anilist, "get_title", unavailable)

    assert client.get("/titles/anilist/21").status_code == 502


def test_missing_title_returns_404(client, monkeypatch):
    monkeypatch.setattr(anilist, "get_title", not_found)

    response = client.get("/titles/anilist/999999999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Title not found"


def test_unknown_source_returns_422(client):
    assert client.get("/titles/netflix/1").status_code == 422
