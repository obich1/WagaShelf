// Labels and rules for each media type, so the rest of the app can stay general.

export const MEDIA_TYPES = {
  anime: { label: 'Anime', plural: 'Anime', unit: 'episode', totalField: 'total_episodes', verb: 'watch' },
  manga: { label: 'Manga', plural: 'Manga', unit: 'chapter', totalField: 'total_chapters', verb: 'read' },
  manhwa: { label: 'Manhwa', plural: 'Manhwa', unit: 'chapter', totalField: 'total_chapters', verb: 'read' },
  manhua: { label: 'Manhua', plural: 'Manhua', unit: 'chapter', totalField: 'total_chapters', verb: 'read' },
  novel: { label: 'Light Novel', plural: 'Light Novels', unit: 'chapter', totalField: 'total_chapters', verb: 'read' },
  book: { label: 'Book', plural: 'Books', unit: 'page', totalField: 'total_pages', verb: 'read' },
}

export const MEDIA_ORDER = ['anime', 'manga', 'manhwa', 'manhua', 'novel', 'book']

export const STATUSES = ['planning', 'current', 'completed', 'on-hold', 'dropped', 'revisiting']

// Status wording adapts to the media type: "Watching" for anime, "Reading" for books.
export function statusLabel(status, mediaType) {
  const watch = MEDIA_TYPES[mediaType]?.verb === 'watch'
  switch (status) {
    case 'planning':
      return watch ? 'Want to watch' : 'Want to read'
    case 'current':
      return watch ? 'Watching' : 'Reading'
    case 'revisiting':
      return watch ? 'Rewatching' : 'Rereading'
    case 'completed':
      return 'Completed'
    case 'on-hold':
      return 'On hold'
    case 'dropped':
      return 'Dropped'
    default:
      return 'No status'
  }
}

export function totalFor(title) {
  return title[MEDIA_TYPES[title.media_type]?.totalField] ?? null
}

export function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

// e.g. "12 / 24 episodes", "Chapter 40", or "120 pages"
export function progressLabel(progress, title) {
  const unit = MEDIA_TYPES[title.media_type]?.unit || 'part'
  const total = totalFor(title)
  if (progress == null) return total ? plural(total, unit) : null
  if (total) return `${progress} / ${plural(total, unit)}`
  return `${unit[0].toUpperCase()}${unit.slice(1)} ${progress}`
}

export function titlePath(title) {
  return `/title/${title.source}/${encodeURIComponent(title.source_id)}`
}

// Split saved entries into shelves, one per media type, in a fixed order. Empty shelves are left out.
export function groupByMediaType(entries) {
  const groups = {}
  for (const entry of entries) {
    const type = entry.title.media_type
    ;(groups[type] ||= []).push(entry)
  }
  return MEDIA_ORDER.filter((type) => groups[type]).map((type) => ({ type, entries: groups[type] }))
}
