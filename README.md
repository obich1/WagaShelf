# WagaShelf

*Waga* (我が) means "my" in Japanese: **WagaShelf** is your personal shelf for anime, manga, manhwa, manhua and novels, all tracked in one place.


## Features

- **Search real titles** from the AniList database, with cover art, media type and episode or chapter counts
- **Select a result to fill in the form**, then choose your status and rating before adding it
- **Add titles manually** when they aren't on AniList
- **Edit entries in place**: change status from a dropdown and update ratings (1–10) directly on your shelf
- **Delete entries**, with a confirmation step
- **Status labels that match the media type**: "Watching" and "Plan to Watch" for anime, "Reading" and "Plan to Read" for everything else
- **Duplicate protection**: exact duplicates are blocked by AniList ID, and matching titles trigger a warning
- **Error handling**: clear messages when a search fails, finds nothing, or can't reach the API
- **Search with Enter**, and clear results with the search box's × button
- **Saves your shelf** in the browser, so it's still there after a reload

## Tech Stack

- **Frontend:** HTML, CSS ([Pico.css](https://picocss.com)), JavaScript
- **Data source:** [AniList GraphQL API](https://docs.anilist.co)
- **Storage:** Browser localStorage (to be replaced by a backend database)

## How It Works

- Searches send a GraphQL query to AniList using `fetch` with `async`/`await`
- AniList labels manhwa and manga both as `MANGA`, so WagaShelf works out the type from the `format` and `countryOfOrigin` fields (e.g. Korean → Manhwa, Chinese → Manhua)
- Each shelf entry gets its own unique ID (`crypto.randomUUID()`), separate from the AniList ID of the title, so entries can be updated and deleted reliably

## How to Run

1. Clone the repository
2. Open `index.html` through a local web server, for example:
   - PyCharm's built-in browser preview, or
   - run `python -m http.server` in the project folder, then visit `http://localhost:8000`

No installation or API key is needed.

> **Note:** Searching depends on the AniList API. If AniList is down or has temporarily disabled its API, WagaShelf shows an error message and search won't return results. Manual adding and your saved shelf still work.

## Roadmap

- [x] Shelf with add, edit, and delete (CRUD)
- [x] AniList search with covers and episode/chapter counts
- [ ] Separate shelf page
- [ ] Python **FastAPI** backend with a REST API
- [ ] SQL database for storing shelves
- [ ] User accounts
- [ ] Western comics via a second API (e.g. Comic Vine)
- [ ] Collections for grouping titles
- [ ] Taste matching: find users with similar ratings
