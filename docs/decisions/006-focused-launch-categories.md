# 006. Focus the launch on anime, manga and related media

- **Date:** 2026-11-07
- **Status:** Accepted

## Context

WagaShelf's vision is one library for every kind of media. A friend's feedback after trying it:
*keep it more niche to the media it already has; being too broad could hurt more than help.*
Each media type needs its own data source and tracking rules, and a product "for everyone"
competes with many specialised apps at once (AniList, Goodreads, Letterboxd) and is harder to
explain.

Separately, two categories overlapped: **Novels** (AniList's light and web novels) and **Books**
(Open Library, which also contains regular novels such as *Dune*).

## Options considered

1. **Keep expanding** (movies, TV, games next). Matches the vision, but spreads the product thin
   before it has users.
2. **Narrow to anime and manga only.** Very focused, but loses the cross-category idea that makes
   WagaShelf different.
3. **Broad vision, focused launch:** keep the current categories, which belong to one community
   (anime, manga, manhwa, manhua and light novels, plus books), and expand only with evidence.

## Decision

Option 3. WagaShelf launches for people who follow stories across formats (e.g. *Solo Leveling*
as a manhwa, an anime and a novel), plus the books they read. **Novels** is renamed **Light
novels**, which describes what AniList's category contains and removes the overlap with Books.

**Expansion rule:** add a new media type when at least a third of active users ask for it (in
interviews or feedback), and a dependable data source exists.

## Consequences

- A clear audience and message, and a narrower set of categories to make excellent.
- Movies, TV and games stay in the backlog until the expansion rule is met.
- Some translated light novels appear in both Light novels (AniList) and Books (Open Library);
  linking them is a possible future feature.
- The rename is a display change only; the stored value stays `novel`, so no database change.
