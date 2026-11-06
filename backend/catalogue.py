"""The catalogue service: searches the external sources and keeps the shared titles table up to date.

Routes call these functions instead of talking to AniList or Open Library directly, so the
rest of the app only ever sees WagaShelf's common format (CatalogueItem / Title).
"""

from sqlmodel import Session, select

from models import CatalogueItem, SearchResponse, Title
from sources import anilist, openlibrary
from sources.errors import SourceUnavailable

ANILIST_CATEGORIES = {"anime", "manga", "manhwa", "manhua", "novel"}


def search(query: str, category: str | None) -> SearchResponse:
    """Search the sources that cover the category ("all" or None searches every source)."""
    return _from_sources(
        category,
        anilist_lookup=lambda: anilist.search(query, category),
        openlibrary_lookup=lambda: openlibrary.search(query),
    )


def trending(category: str | None) -> SearchResponse:
    """Titles that are popular right now in the external catalogues (for Discover)."""
    return _from_sources(
        category,
        anilist_lookup=lambda: anilist.trending(category),
        openlibrary_lookup=openlibrary.trending,
    )


def _from_sources(category, anilist_lookup, openlibrary_lookup) -> SearchResponse:
    """Run the lookup for each source that covers the category and combine the results.

    If one source is down, the others' results are still returned, and the response says
    which source was unavailable.
    """
    searches = []
    if category in (None, "all") or category in ANILIST_CATEGORIES:
        searches.append(("AniList", anilist_lookup))
    if category in (None, "all", "book"):
        searches.append(("Open Library", openlibrary_lookup))

    results: list[CatalogueItem] = []
    unavailable: list[str] = []
    for source_name, run_search in searches:
        try:
            results.extend(run_search())
        except SourceUnavailable:
            unavailable.append(source_name)

    if searches and len(unavailable) == len(searches):
        raise SourceUnavailable("No catalogue source could be reached")
    return SearchResponse(results=results, unavailable_sources=unavailable)


def fetch_from_source(source: str, source_id: str) -> CatalogueItem:
    if source == "anilist":
        return anilist.get_title(source_id)
    return openlibrary.get_title(source_id)


def find_title(session: Session, source: str, source_id: str) -> Title | None:
    statement = select(Title).where(Title.source == source, Title.source_id == source_id)
    return session.exec(statement).first()


def refresh_title(session: Session, source: str, source_id: str) -> Title:
    """Fetch the latest details from the source and save them in the shared catalogue.

    If the source is down but the title is already stored, the stored copy is returned instead.
    """
    stored = find_title(session, source, source_id)
    try:
        item = fetch_from_source(source, source_id)
    except SourceUnavailable:
        if stored:
            return stored
        raise

    title = stored or Title(source=source, source_id=source_id, media_type=item.media_type, title=item.title)
    # Copy every field from the fresh data onto the stored row (insert or update).
    for field, value in item.model_dump().items():
        setattr(title, field, value)
    session.add(title)
    session.commit()
    session.refresh(title)
    return title


def get_or_fetch_title(session: Session, source: str, source_id: str) -> Title:
    """Use the stored title if WagaShelf already has it; otherwise fetch and store it."""
    return find_title(session, source, source_id) or refresh_title(session, source, source_id)
