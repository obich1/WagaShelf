"""AniList: anime, manga, manhwa, manhua and novels, through its GraphQL API."""

import html
import re

import httpx

from models import CatalogueItem
from sources.errors import SourceUnavailable, TitleNotFound

URL = "https://graphql.anilist.co"
TIMEOUT_SECONDS = 10

# The fields WagaShelf needs, written once and reused by both queries below.
MEDIA_FIELDS = """
    id type format countryOfOrigin status
    title { romaji english }
    description(asHtml: false)
    startDate { year }
    episodes chapters volumes
    genres
    coverImage { large }
    siteUrl
    externalLinks { site url type }
"""

SEARCH_QUERY = f"""
query ($search: String, $type: MediaType, $country: CountryCode,
       $format: MediaFormat, $formatNot: MediaFormat) {{
  Page(perPage: 12) {{
    media(search: $search, type: $type, countryOfOrigin: $country,
          format: $format, format_not: $formatNot, isAdult: false) {{
      {MEDIA_FIELDS}
    }}
  }}
}}
"""

TRENDING_QUERY = f"""
query ($type: MediaType, $country: CountryCode, $format: MediaFormat, $formatNot: MediaFormat) {{
  Page(perPage: 12) {{
    media(sort: TRENDING_DESC, type: $type, countryOfOrigin: $country,
          format: $format, format_not: $formatNot, isAdult: false) {{
      {MEDIA_FIELDS}
    }}
  }}
}}
"""

TITLE_QUERY = f"""
query ($id: Int) {{
  Media(id: $id) {{
    {MEDIA_FIELDS}
  }}
}}
"""

# How each WagaShelf category maps to AniList's search filters. AniList files manga,
# manhwa, manhua and light novels all under type MANGA, so country and format tell them apart.
CATEGORY_FILTERS = {
    "anime": {"type": "ANIME"},
    "manga": {"type": "MANGA", "country": "JP", "formatNot": "NOVEL"},
    "manhwa": {"type": "MANGA", "country": "KR", "formatNot": "NOVEL"},
    "manhua": {"type": "MANGA", "country": "CN", "formatNot": "NOVEL"},
    "novel": {"type": "MANGA", "format": "NOVEL"},
}

RELEASE_STATUSES = {
    "FINISHED": "finished",
    "RELEASING": "releasing",
    "NOT_YET_RELEASED": "upcoming",
    "CANCELLED": "cancelled",
    "HIATUS": "on hiatus",
}


def _post(query: str, variables: dict) -> dict:
    """Send a GraphQL query to AniList and return its "data" part."""
    try:
        response = httpx.post(
            URL, json={"query": query, "variables": variables}, timeout=TIMEOUT_SECONDS
        )
    except httpx.HTTPError as error:
        raise SourceUnavailable(f"Couldn't reach AniList: {error}") from error

    if response.status_code == 404:
        raise TitleNotFound("AniList has no title with that id")
    if response.status_code != 200:
        raise SourceUnavailable(f"AniList returned status {response.status_code}")

    body = response.json()
    if body.get("errors"):
        raise SourceUnavailable(f"AniList error: {body['errors'][0].get('message')}")
    return body["data"]


def media_type_of(media: dict) -> str:
    """Work out WagaShelf's media type from AniList's type, format and country."""
    if media["type"] == "ANIME":
        return "anime"
    if media.get("format") == "NOVEL":
        return "novel"
    if media.get("countryOfOrigin") == "KR":
        return "manhwa"
    if media.get("countryOfOrigin") in ("CN", "TW"):
        return "manhua"
    return "manga"


def clean_description(text: str | None) -> str | None:
    """AniList descriptions contain some HTML (<br>, <i>): turn them into plain text."""
    if not text:
        return None
    text = re.sub(r"<br\s*/?>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip() or None


def official_links(media: dict) -> list[dict]:
    """Keep links to official platforms and the official site; skip social media."""
    links = []
    seen_sites = set()
    for link in media.get("externalLinks") or []:
        # Some platforms are listed once per region; one link per platform is enough.
        if link["site"] in seen_sites:
            continue
        seen_sites.add(link["site"])
        if link["type"] == "STREAMING":
            links.append({"site": link["site"], "url": link["url"], "kind": "official"})
        elif link["site"] == "Official Site":
            links.append({"site": "Official site", "url": link["url"], "kind": "info"})
    if media.get("siteUrl"):
        links.append({"site": "AniList", "url": media["siteUrl"], "kind": "info"})
    return links


def to_catalogue_item(media: dict) -> CatalogueItem:
    """Convert one AniList media object into WagaShelf's common format."""
    titles = media.get("title") or {}
    return CatalogueItem(
        source="anilist",
        source_id=str(media["id"]),
        media_type=media_type_of(media),
        title=titles.get("english") or titles.get("romaji") or "Untitled",
        cover_url=(media.get("coverImage") or {}).get("large"),
        description=clean_description(media.get("description")),
        genres=media.get("genres") or [],
        release_year=(media.get("startDate") or {}).get("year"),
        release_status=RELEASE_STATUSES.get(media.get("status")),
        total_episodes=media.get("episodes"),
        total_chapters=media.get("chapters"),
        total_volumes=media.get("volumes"),
        external_links=official_links(media),
    )


def search(query: str, category: str | None) -> list[CatalogueItem]:
    filters = CATEGORY_FILTERS.get(category, {}) if category else {}
    data = _post(SEARCH_QUERY, {"search": query, **filters})
    return [to_catalogue_item(media) for media in data["Page"]["media"]]


def trending(category: str | None) -> list[CatalogueItem]:
    filters = CATEGORY_FILTERS.get(category, {}) if category else {}
    data = _post(TRENDING_QUERY, filters)
    return [to_catalogue_item(media) for media in data["Page"]["media"]]


def get_title(source_id: str) -> CatalogueItem:
    if not source_id.isdigit():
        raise TitleNotFound("AniList ids are numbers")
    data = _post(TITLE_QUERY, {"id": int(source_id)})
    if not data.get("Media"):
        raise TitleNotFound("AniList has no title with that id")
    return to_catalogue_item(data["Media"])
