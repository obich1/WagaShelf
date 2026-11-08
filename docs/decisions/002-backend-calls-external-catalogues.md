# 002. The backend calls AniList and Open Library

- **Date:** 2026-11-07 (decided 2026-11-06)
- **Status:** Accepted

## Context

WagaShelf gets title data from two outside services with different APIs and data shapes: AniList
(GraphQL; anime, manga, manhwa, manhua, light novels) and Open Library (REST; books). In the
first version, the browser called AniList directly.

## Options considered

1. **The browser calls each source directly.** No extra hop, but the frontend must know every
   source's API and data format, and adding a source means changing the frontend.
2. **The backend calls the sources and returns one common format** (`CatalogueItem`).

## Decision

The backend calls the sources. `sources/anilist.py` and `sources/openlibrary.py` each convert
their API's data into `CatalogueItem`; `catalogue.py` combines them and keeps the shared `titles`
table up to date.

## Consequences

- The frontend only knows WagaShelf's own API. New sources can be added in the backend alone.
- Search keeps working with partial results if one source is down, and the response says which
  source was unavailable.
- An extra network hop, and more backend code to test (tested with fake sources, so the tests
  don't need the internet).
- When AniList is down, finding new anime and manga titles is limited. Improving this is
  planned as the "resilient catalogue" change.
