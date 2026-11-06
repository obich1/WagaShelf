"""Tests for converting AniList and Open Library data into WagaShelf's common format.

The sample data below copies the shape of real API responses, so these tests run
without a network connection.
"""

from sources import anilist, openlibrary

ANILIST_MEDIA = {
    "id": 105398,
    "type": "MANGA",
    "format": "MANGA",
    "countryOfOrigin": "KR",
    "status": "FINISHED",
    "title": {"romaji": "Na Honjaman Level Up", "english": "Solo Leveling"},
    "description": "Hunters battle monsters.\n<br><br>\n(Source: Tappytoon)<br><i>Note: extras.</i> &amp; more",
    "startDate": {"year": 2018},
    "episodes": None,
    "chapters": 201,
    "volumes": 15,
    "genres": ["Action", "Fantasy"],
    "coverImage": {"large": "https://s4.anilist.co/cover.jpg"},
    "siteUrl": "https://anilist.co/manga/105398",
    "externalLinks": [
        {"site": "KakaoPage", "url": "https://page.kakao.com/content/50866481", "type": "STREAMING"},
        {"site": "KakaoPage", "url": "https://page.kakao.com/other-region", "type": "STREAMING"},
        {"site": "Official Site", "url": "https://example.com", "type": "INFO"},
        {"site": "Twitter", "url": "https://twitter.com/example", "type": "SOCIAL"},
    ],
}

OPENLIBRARY_DOC = {
    "key": "/works/OL893414W",
    "title": "Dune",
    "author_name": ["Frank Herbert"],
    "first_publish_year": 1965,
    "cover_i": 11481354,
    "number_of_pages_median": 608,
    "subject": [
        "Science fiction",
        "nyt:mass-market-monthly=2021-11-07",
        "Fiction",
        "science fiction",
        "A very long subject name that is not useful as a genre",
    ],
}


def test_anilist_media_types():
    assert anilist.media_type_of({"type": "ANIME"}) == "anime"
    assert anilist.media_type_of({"type": "MANGA", "format": "NOVEL", "countryOfOrigin": "JP"}) == "novel"
    assert anilist.media_type_of({"type": "MANGA", "format": "MANGA", "countryOfOrigin": "KR"}) == "manhwa"
    assert anilist.media_type_of({"type": "MANGA", "format": "MANGA", "countryOfOrigin": "CN"}) == "manhua"
    assert anilist.media_type_of({"type": "MANGA", "format": "MANGA", "countryOfOrigin": "JP"}) == "manga"


def test_anilist_description_becomes_plain_text():
    text = anilist.clean_description(ANILIST_MEDIA["description"])

    assert "<" not in text
    assert "&amp;" not in text
    assert text.startswith("Hunters battle monsters.")
    assert text.endswith("Note: extras. & more")


def test_anilist_keeps_official_links_and_skips_social():
    links = anilist.official_links(ANILIST_MEDIA)

    assert [link["site"] for link in links] == ["KakaoPage", "Official site", "AniList"]
    assert links[0]["kind"] == "official"


def test_anilist_media_converts_to_catalogue_item():
    item = anilist.to_catalogue_item(ANILIST_MEDIA)

    assert item.source == "anilist"
    assert item.source_id == "105398"
    assert item.media_type == "manhwa"
    assert item.title == "Solo Leveling"  # English title preferred
    assert item.total_chapters == 201
    assert item.release_status == "finished"
    assert item.release_year == 2018


def test_anilist_falls_back_to_romaji_title():
    media = {**ANILIST_MEDIA, "title": {"romaji": "Na Honjaman Level Up", "english": None}}

    assert anilist.to_catalogue_item(media).title == "Na Honjaman Level Up"


def test_openlibrary_doc_converts_to_catalogue_item():
    item = openlibrary.to_catalogue_item(OPENLIBRARY_DOC, description="A desert planet.")

    assert item.source == "openlibrary"
    assert item.source_id == "OL893414W"
    assert item.media_type == "book"
    assert item.creators == ["Frank Herbert"]
    assert item.total_pages == 608
    assert item.cover_url == "https://covers.openlibrary.org/b/id/11481354-L.jpg"
    assert item.description == "A desert planet."
    assert item.external_links[0]["url"] == "https://openlibrary.org/works/OL893414W"


def test_openlibrary_genres_are_cleaned():
    assert openlibrary.clean_genres(OPENLIBRARY_DOC["subject"]) == ["Science Fiction", "Fiction"]


def test_openlibrary_book_without_cover():
    item = openlibrary.to_catalogue_item({"key": "/works/OL1W", "title": "No Cover"})

    assert item.cover_url is None
    assert item.creators == []


def test_openlibrary_description_can_be_text_or_object():
    assert openlibrary.description_of({"description": "Plain text"}) == "Plain text"
    assert openlibrary.description_of({"description": {"type": "/type/text", "value": "Wrapped"}}) == "Wrapped"
    assert openlibrary.description_of({}) is None
