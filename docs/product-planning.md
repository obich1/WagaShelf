# WagaShelf — Product Planning

## 1. Product Vision

### What is WagaShelf?

WagaShelf is a general-purpose media library and tracking platform. It gives people one place to save, organize, and optionally track the media they are interested in or consume across different platforms.

WagaShelf is not intended to host the media itself. Users may read, watch, or play titles on other services and use WagaShelf to keep their library organized, record their progress if they want to, and share their opinions.

The product should be designed around a general media model from the beginning. The system should be able to support different media types, even if the first release supports only a manageable selection.

### What problem does it solve?

People discover and consume media across many different platforms. Their lists, bookmarks, progress, and thoughts can become scattered across services or forgotten when they take a break from a hobby.

WagaShelf aims to give users one organized place to keep track of their interests, return to titles later, and find where those titles can be accessed officially.

## 2. Target Users and User Problem

The initial target audience is people who enjoy multiple forms of media and want a central place to organize them, especially when they use different platforms to consume that media.

The core user problem is behavioural rather than personality-based: users want to save titles, keep their interests organized, and optionally remember where they are in a title without having to maintain separate lists on multiple services.

This is an initial target-user hypothesis, not a validated market conclusion. It should be tested through conversations with potential users and feedback from an MVP.

## 3. Product Principles

1. **One library for different media:** WagaShelf should provide a consistent organizing experience across media types while adapting details and tracking controls to each type.
2. **Saving comes first:** Adding a title to a user's library must be simple. A user can save a title without entering a status or progress.
3. **Tracking is encouraged, not required:** Users can enable progress tracking when adding a title or configure it later from their shelf.
4. **Shared catalogue, personal library entry:** A title has shared catalogue information, while each user's status, progress, rating, and private notes belong to that user's own library entry.
5. **WagaShelf organizes and connects:** WagaShelf does not need to host the actual media. Where possible, it should link users to official platforms or the title's official page.
6. **Privacy by default:** New accounts and their shelves start private. Users choose what to make public.

## 4. Core User Experience

### 4.1 Finding and adding a title

1. A user searches for a title using a universal search experience.
2. Search results can be filtered by media category.
3. Selecting a result opens a dedicated detail page.
4. The detail page displays shared catalogue information such as the cover, title, description, genres, release information, and available official access links.
5. The user selects **Add to My Shelf**. WagaShelf adds the title to the appropriate media-type shelf.
6. The user may optionally set a status and enable a progress tracker. They can skip this step and still save the title.

A title should not be duplicated in the user's shelf if it has already been added.

### 4.2 My Shelves

- The user's library is organized into separate shelves by media type.
- Shelves appear dynamically when the user adds their first title of that type. WagaShelf should not display empty shelves for media types the user does not track.
- Selecting a shelf opens a page showing the titles in that category.
- Users can filter titles within a shelf by status, such as currently reading or completed. Statuses are filters, not separate shelves.
- Users can update status and progress, add or edit personal information, or remove a title from their shelf from the shelf or title detail page.
- The visual design should feel like a cozy, organized personal library, with a dark-mode direction.

### 4.3 Home

The Home page is primarily the user's personal-library dashboard, rather than a community feed or discovery-first page.

Proposed content:
- A welcoming message.
- A **Continue where you left off** area for titles with progress information.
- Recently added titles.
- A quick overview of the user's library and media categories.
- A helpful empty state for new users who have not added any titles yet.

### 4.4 Discover

Discover should remain useful even when WagaShelf has few users.

Proposed MVP direction:
- A universal search bar with media-category filters.
- Browsing by media category.
- Popular or notable titles sourced from external media catalogues, where supported.

A separate **Popular on WagaShelf** section can be introduced later, once there is enough user activity to make internal popularity meaningful. This is different from titles that are popular overall according to an external catalogue.

## 5. Media Catalogue and Personal Tracking

### 5.1 Shared title information

Each title should have one shared catalogue record that can be referenced by many users. Shared information may include:
- Title and alternate titles.
- Cover image.
- Description or synopsis.
- Genres and tags.
- Release information and publication/broadcast status.
- Available official access links.

### 5.2 Personal library information

Each user has their own library entry for a title. This may include:
- Status.
- Optional progress.
- Personal rating.
- Private notes.

For example, two users can have the same title in their libraries while having different statuses, progress, ratings, and notes.

### 5.3 Optional, media-aware progress tracking

Progress controls should adapt to the media type. Users may leave tracking disabled and add it later.

Examples of suitable tracking models:
- Manga, manhwa, and manhua: chapters and, where useful, volumes.
- Anime and TV shows: episodes and, where useful, seasons.
- Books and novels: pages or chapters.
- Movies: watched/unwatched or a completion status.
- Video games: a completion/status model, with optional playtime if appropriate.

The catalogue should supply known totals when available. If a total is unknown or a series is ongoing, users should not be forced to enter a maximum. Progress fields should be appropriate to the title and media type rather than assuming every title has chapters or episodes.

Possible statuses include Want to Read/Watch/Play, Currently Reading/Watching/Playing, Completed, On Hold, and Dropped. The wording should adapt to the media type where practical. A user should also be able to save a title without selecting any status.

## 6. Official Access Links

WagaShelf should help users find where a title can be accessed legally without hosting the content itself.

Where reliable information is available, a title detail page can link to the specific title on an official service. Examples of platforms include:
- Crunchyroll for anime.
- WEBTOON for webcomics.
- Tapas for comics and novels.
- KakaoPage for Korean digital content.

Links should point to the specific title's official page whenever possible, rather than only to a platform homepage. Availability can vary by region and may change, so links should be treated as external destinations rather than a guarantee that a title is available to every user.

## 7. Profiles, Shelves, and Privacy

- Users have a profile that can display information they choose to share.
- New profiles and shelves are private by default.
- Users can choose to make their profile public and can control shelf visibility individually.
- If a user makes a shelf public, other users who visit the profile can browse that shelf.
- A user may make one shelf public while keeping another private.
- Private notes and other personal information must never become public just because a profile or shelf is public.
- Public profiles may eventually display public shelves, ratings, reviews, and public activity, subject to the user's visibility settings.

## 8. Reviews, Comments, and Notes

WagaShelf should distinguish between private personal notes and public contributions:

- **Private notes:** Personal thoughts, reminders, or favourite moments attached to a title. Only the author can see these.
- **Public reviews/comments:** Deliberately published opinions or discussion that other users can see.

A user should be able to comment on a title without entering or sharing their reading/watching progress. WagaShelf must not assume that someone is consuming a title through the platform or that a comment means they have reached a particular chapter or episode.

Public reviews, comments, and broader community interactions are valuable, but they can be treated as post-MVP features so the first release can focus on the core library experience.

## 9. MVP Scope and Priorities

The MVP should prove that someone can discover a title, save it in one organized library, and optionally keep track of it while consuming it elsewhere.

### Core MVP

- Clean, welcoming interface with a dark-mode direction.
- Account registration and login.
- General media-library structure designed to support multiple media types.
- A manageable initial set of supported media categories; the exact launch categories still need to be selected based on data-source availability and implementation effort.
- Universal media search with category filters.
- Search results that open dedicated title detail pages.
- Shared catalogue information for titles, including covers and available metadata.
- Add and remove titles from a user's personal library.
- Separate, dynamically appearing shelves for the media types a user has saved.
- Shelf views with basic status filtering.
- Optional, media-aware status and progress tracking, editable later from the shelf.
- Personal ratings and private notes.
- Official access links when reliable title-specific links are available.
- Basic user profiles and private-by-default visibility controls, including the ability to make shelves public.
- A personal-library Home page and a useful Discover/search experience.

### Defer until after the MVP

- Following other users.
- Activity feeds and social notifications.
- Public reviews and comments, and more advanced discussion tools.
- User-created fandom communities.
- Popular-on-WagaShelf rankings based on user activity.
- Advanced recommendations based on similar users or shared tastes.
- Extensive shelf customization and complex shelf animations.
- Native mobile applications, unless the core product is already stable and there is time to extend it responsibly.

### Scope guidance

The system should be designed to accommodate more media types, but the MVP does not need to launch with every category. Choose the initial categories based on the quality and availability of catalogue data and the effort required to support their different tracking models.

The shelf metaphor and cozy visual identity are important to the product, but the first release should prioritize a reliable search, detail, save, and tracking flow over elaborate animations or customization.

## 10. Success Criteria for the MVP

A user should be able to:
1. Create an account and sign in.
2. Search for a supported media title.
3. Open a title's detail page and understand what it is.
4. Find an official access link when one is available.
5. Add the title to the correct shelf without being forced to enter progress.
6. Optionally configure or update a media-appropriate status and progress.
7. Find the title again in their library and filter their shelf by status.
8. Control whether their profile and individual shelves are private or public.

If these flows work reliably, WagaShelf will have demonstrated its central value without needing to launch as a full social network.

## 11. Open Product Decisions

These decisions should be resolved before implementation expands:
- ~~Which media categories will be supported in the first release?~~ Resolved: see section 12.
- ~~Which catalogue/API sources can provide dependable title metadata, covers, and official links for those categories?~~ Resolved: AniList for anime, manga, manhwa, manhua and light novels; Open Library for books.
- What exact fields and status options are appropriate for each initial media type?
- What profile information should users be able to customize?
- Should users have one editable review per title, or be able to publish multiple reviews over time? This can be decided when public reviews move into scope.

## 12. Focus and Expansion

*Added 2026-11-07 after user feedback. Full reasoning: [decision record 006](decisions/006-focused-launch-categories.md).*

The long-term vision stays broad: one library for every kind of media. The launch is focused on
one community: people who follow stories across formats (for example *Solo Leveling* as a
manhwa, an anime and a novel), plus the books they read.

**Launch categories:** anime, manga, manhwa, manhua and light novels (from AniList), and books
(from Open Library). "Light novels" replaces the earlier "Novels" label, because AniList's novel
category contains light and web novels, while regular novels such as *Dune* are books.

**Expansion rule:** a new media type (such as movies, TV or games) is added when at least a third
of active users ask for it in interviews or feedback, and a dependable data source exists.
