"""Tests for the signed-in user's library: /library routes."""

import pytest

from models import CatalogueItem
from sources import anilist, openlibrary
from sources.errors import SourceUnavailable


@pytest.fixture(autouse=True)
def fake_sources(monkeypatch):
    """Any title id can be fetched: AniList ids become anime, Open Library ids become books."""
    monkeypatch.setattr(
        anilist,
        "get_title",
        lambda source_id: CatalogueItem(
            source="anilist", source_id=source_id, media_type="anime", title=f"Anime {source_id}", total_episodes=12
        ),
    )
    monkeypatch.setattr(
        openlibrary,
        "get_title",
        lambda source_id: CatalogueItem(
            source="openlibrary", source_id=source_id, media_type="book", title=f"Book {source_id}"
        ),
    )


def add(client, source="anilist", source_id="21", **details):
    return client.post("/library", json={"source": source, "source_id": source_id, **details})


# --- Signing in ------------------------------------------------------------


def test_library_requires_sign_in(client, monkeypatch):
    import auth

    monkeypatch.setattr(auth, "CLERK_ISSUER", "https://example.clerk.accounts.dev")

    assert client.get("/library").status_code == 401
    assert add(client).status_code == 401


# --- Adding ----------------------------------------------------------------


def test_save_a_title_without_status_or_progress(sign_in):
    client = sign_in("user_a")

    response = add(client)

    assert response.status_code == 201
    body = response.json()
    assert body["status"] is None
    assert body["progress"] is None
    assert body["title"]["title"] == "Anime 21"
    assert body["title"]["media_type"] == "anime"
    assert body["added_at"].endswith("Z")  # times are sent as UTC


def test_save_a_title_with_tracking_details(sign_in):
    client = sign_in("user_a")

    response = add(client, status="current", progress=3, rating=8.5, notes="Great so far")

    assert response.status_code == 201
    assert response.json()["status"] == "current"
    assert response.json()["progress"] == 3
    assert response.json()["rating"] == 8.5
    assert response.json()["notes"] == "Great so far"


def test_same_title_cannot_be_saved_twice(sign_in):
    client = sign_in("user_a")
    add(client)

    response = add(client)

    assert response.status_code == 409
    assert response.json()["detail"] == "This title is already on your shelf"


@pytest.mark.parametrize(
    "details",
    [
        {"status": "banana"},
        {"rating": 11},
        {"rating": 0},
        {"progress": -1},
        {"notes": "x" * 5001},
    ],
)
def test_invalid_details_are_rejected(sign_in, details):
    client = sign_in("user_a")

    assert add(client, **details).status_code == 422


def test_saving_fails_cleanly_when_the_catalogue_is_down(sign_in, monkeypatch):
    def unavailable(source_id):
        raise SourceUnavailable("down")

    monkeypatch.setattr(anilist, "get_title", unavailable)
    client = sign_in("user_a")

    assert add(client).status_code == 502


# --- Listing and filtering -------------------------------------------------


def test_library_starts_empty(sign_in):
    response = sign_in("user_a").get("/library")

    assert response.status_code == 200
    assert response.json() == []


def test_library_lists_saved_titles_newest_first(sign_in):
    client = sign_in("user_a")
    add(client, source_id="1")
    add(client, source="openlibrary", source_id="OL1W")

    titles = [entry["title"]["title"] for entry in client.get("/library").json()]

    assert titles == ["Book OL1W", "Anime 1"]


def test_library_filters_by_media_type_and_status(sign_in):
    client = sign_in("user_a")
    add(client, source_id="1", status="current")
    add(client, source_id="2", status="completed")
    add(client, source="openlibrary", source_id="OL1W", status="current")

    anime = client.get("/library", params={"media_type": "anime"}).json()
    current_anime = client.get("/library", params={"media_type": "anime", "status": "current"}).json()

    assert len(anime) == 2
    assert [entry["title"]["title"] for entry in current_anime] == ["Anime 1"]


def test_users_only_see_their_own_library(sign_in):
    add(sign_in("user_a"), source_id="1")
    add(sign_in("user_b"), source_id="2")

    titles = [entry["title"]["title"] for entry in sign_in("user_b").get("/library").json()]

    assert titles == ["Anime 2"]


def test_two_users_can_save_the_same_title(sign_in):
    assert add(sign_in("user_a")).status_code == 201
    assert add(sign_in("user_b")).status_code == 201


# --- Updating --------------------------------------------------------------


def test_update_only_changes_the_fields_sent(sign_in):
    client = sign_in("user_a")
    entry = add(client, status="current", rating=7, notes="Keep").json()

    response = client.patch(f"/library/{entry['id']}", json={"progress": 5})

    assert response.status_code == 200
    body = response.json()
    assert body["progress"] == 5
    assert body["status"] == "current"
    assert body["rating"] == 7
    assert body["notes"] == "Keep"
    assert body["updated_at"] >= entry["updated_at"]


def test_update_with_null_clears_a_field(sign_in):
    client = sign_in("user_a")
    entry = add(client, status="current", rating=7).json()

    response = client.patch(f"/library/{entry['id']}", json={"rating": None, "status": None})

    assert response.json()["rating"] is None
    assert response.json()["status"] is None


def test_update_rejects_invalid_values(sign_in):
    client = sign_in("user_a")
    entry = add(client).json()

    assert client.patch(f"/library/{entry['id']}", json={"rating": 20}).status_code == 422


def test_cannot_update_someone_elses_entry(sign_in):
    entry = add(sign_in("user_a")).json()

    response = sign_in("user_b").patch(f"/library/{entry['id']}", json={"rating": 1})

    assert response.status_code == 404


def test_update_missing_entry_returns_404(sign_in):
    assert sign_in("user_a").patch("/library/999", json={"rating": 5}).status_code == 404


# --- Removing --------------------------------------------------------------


def test_remove_a_title(sign_in):
    client = sign_in("user_a")
    entry = add(client).json()

    response = client.delete(f"/library/{entry['id']}")

    assert response.status_code == 204
    assert client.get("/library").json() == []


def test_cannot_remove_someone_elses_entry(sign_in):
    entry = add(sign_in("user_a")).json()

    assert sign_in("user_b").delete(f"/library/{entry['id']}").status_code == 404
    assert len(sign_in("user_a").get("/library").json()) == 1


def test_removed_title_can_be_saved_again(sign_in):
    client = sign_in("user_a")
    entry = add(client).json()
    client.delete(f"/library/{entry['id']}")

    assert add(client).status_code == 201
