"""Open Library: books, through its free search and works APIs (no key needed)."""

import re

import httpx

from models import CatalogueItem
from sources.errors import SourceUnavailable, TitleNotFound

BASE_URL = "https://openlibrary.org"
COVER_URL = "https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"
TIMEOUT_SECONDS = 10
SEARCH_FIELDS = "key,title,author_name,first_publish_year,cover_i,number_of_pages_median,subject"
WORK_ID_PATTERN = re.compile(r"^OL\d+W$")  # Open Library work ids look like OL893414W
MAX_GENRES = 6


def _get(path: str, params: dict | None = None) -> dict:
    try:
        response = httpx.get(
            f"{BASE_URL}{path}", params=params, timeout=TIMEOUT_SECONDS, follow_redirects=True
        )
    except httpx.HTTPError as error:
        raise SourceUnavailable(f"Couldn't reach Open Library: {error}") from error

    if response.status_code == 404:
        raise TitleNotFound("Open Library has no book with that id")
    if response.status_code != 200:
        raise SourceUnavailable(f"Open Library returned status {response.status_code}")
    return response.json()


def work_id_of(key: str) -> str:
    """"/works/OL893414W" -> "OL893414W"."""
    return key.rsplit("/", 1)[-1]


def cover_url_of(cover_id: int | None) -> str | None:
    return COVER_URL.format(cover_id=cover_id) if cover_id else None


def clean_genres(subjects: list[str] | None) -> list[str]:
    """Open Library "subjects" are long and messy; keep a few short, readable ones."""
    genres = []
    for subject in subjects or []:
        if ":" in subject or "=" in subject or len(subject) > 30:
            continue  # skips tags like "nyt:mass-market-monthly=2021-11-07"
        name = subject.strip().title()
        if name not in genres:
            genres.append(name)
        if len(genres) == MAX_GENRES:
            break
    return genres


def to_catalogue_item(doc: dict, description: str | None = None) -> CatalogueItem:
    """Convert one Open Library search result into WagaShelf's common format."""
    work_id = work_id_of(doc["key"])
    return CatalogueItem(
        source="openlibrary",
        source_id=work_id,
        media_type="book",
        title=doc.get("title") or "Untitled",
        creators=doc.get("author_name") or [],
        cover_url=cover_url_of(doc.get("cover_i")),
        description=description,
        genres=clean_genres(doc.get("subject")),
        release_year=doc.get("first_publish_year"),
        total_pages=doc.get("number_of_pages_median"),
        external_links=[
            {"site": "Open Library", "url": f"{BASE_URL}/works/{work_id}", "kind": "official"}
        ],
    )


def description_of(work: dict) -> str | None:
    """A work's description is either plain text or {"type": ..., "value": text}."""
    description = work.get("description")
    if isinstance(description, dict):
        description = description.get("value")
    return description.strip() if description else None


def search(query: str) -> list[CatalogueItem]:
    data = _get("/search.json", {"q": query, "limit": 12, "fields": SEARCH_FIELDS})
    return [to_catalogue_item(doc) for doc in data.get("docs", [])]


def trending() -> list[CatalogueItem]:
    data = _get("/trending/weekly.json", {"limit": 12})
    return [to_catalogue_item(work) for work in data.get("works", [])]


def get_title(source_id: str) -> CatalogueItem:
    if not WORK_ID_PATTERN.match(source_id):
        raise TitleNotFound("Open Library work ids look like OL893414W")
    # The search API has the authors, cover and page count; the works API has the description.
    data = _get("/search.json", {"q": f"key:/works/{source_id}", "fields": SEARCH_FIELDS})
    if not data.get("docs"):
        raise TitleNotFound("Open Library has no book with that id")
    work = _get(f"/works/{source_id}.json")
    return to_catalogue_item(data["docs"][0], description=description_of(work))
