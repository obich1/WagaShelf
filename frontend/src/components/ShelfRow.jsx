// One shelf on My Shelves: a wall, a curved row of covers facing out, and a plank with brackets.
// Each cover opens its title page; the heading, the count, the "See all" card and the empty
// wall open the full shelf.
import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { MEDIA_TYPES, plural, statusLabel, titlePath, totalFor } from '../lib/media'
import { usePrefersReducedMotion, useCurvedRow } from '../lib/useCurvedRow'
import { Cover } from './common'

const PREVIEW = 10
const IN_PROGRESS = new Set(['current', 'revisiting'])

// What's being read or watched comes first. Otherwise the order stays as the API sends it
// (most recently updated first), because sort() keeps equal items in their original order.
function previewOf(entries) {
  const inProgress = (entry) => (IN_PROGRESS.has(entry.status) ? 1 : 0)
  return [...entries].sort((a, b) => inProgress(b) - inProgress(a)).slice(0, PREVIEW)
}

function ShelfBook({ entry }) {
  const { title } = entry
  const total = totalFor(title)
  const percent = total && entry.progress != null ? Math.min(100, Math.round((entry.progress / total) * 100)) : null

  return (
    <li className="shelf-book">
      <Link to={titlePath(title)} className="shelf-book-link">
        <Cover src={title.cover_url} alt={title.title} />
        <span className="shelf-book-title">{title.title}</span>
      </Link>
      <span className="shelf-book-status">
        <span className={`status-dot status-dot-${entry.status || 'none'}`} aria-hidden="true" />
        {statusLabel(entry.status, title.media_type)}
      </span>
      {/* Every book keeps a progress row, invisible when there's no total, so all covers line up. */}
      {percent !== null ? (
        <span className="shelf-book-progress" role="img" aria-label={`${percent}% complete`}>
          <span style={{ width: `${percent}%` }} />
        </span>
      ) : (
        <span className="shelf-book-progress shelf-book-progress-empty" aria-hidden="true" />
      )}
    </li>
  )
}

// The last spot on a shelf with more titles than the preview: a cover-sized card to the full shelf.
// It has the same parts as a book (cover, title, status, progress), so it lines up with them.
function SeeAll({ path, count }) {
  return (
    <li className="shelf-book shelf-see-all">
      <Link to={path} className="shelf-book-link">
        <span className="cover shelf-see-all-cover" aria-hidden="true">
          <span className="shelf-see-all-more">+{count - PREVIEW}</span>
          more
        </span>
        <span className="shelf-book-title">See all {count} →</span>
      </Link>
      <span className="shelf-book-status shelf-book-placeholder" aria-hidden="true">&nbsp;</span>
      <span className="shelf-book-progress shelf-book-progress-empty" aria-hidden="true" />
    </li>
  )
}

export default function ShelfRow({ type, entries }) {
  const shelfPath = `/shelf/${type}`
  const preview = previewOf(entries)
  const hasMore = entries.length > PREVIEW
  const rowRef = useRef(null)
  const navigate = useNavigate()
  // Curved by default; a flat row for people who've asked their device for less motion.
  const curved = !usePrefersReducedMotion()
  useCurvedRow(rowRef, curved, preview.length + (hasMore ? 1 : 0))

  // Tapping the wall itself (not a cover or a link) opens the full shelf. One handler on the whole
  // wall covers every empty spot ("event delegation"). Keyboard and screen-reader users have the
  // heading link, so the wall doesn't need to be focusable. A swipe never fires a click, and a
  // click that ends a text selection is ignored.
  function openFromWall(event) {
    if (event.target.closest('a, button')) return
    if (window.getSelection()?.toString()) return
    navigate(shelfPath)
  }

  return (
    <section className="shelf-wall shelf-wall-tappable" aria-labelledby={`shelf-${type}`} onClick={openFromWall}>
      <div className="shelf-wall-header">
        <h2 id={`shelf-${type}`}>
          <Link to={shelfPath}>{MEDIA_TYPES[type].plural}</Link>
        </h2>
        <Link to={shelfPath} className="shelf-wall-count">
          {plural(entries.length, 'title')} →
        </Link>
      </div>

      <ul ref={rowRef} className={`shelf-books${curved ? ' shelf-books-curved' : ''}`}>
        {preview.map((entry) => (
          <ShelfBook key={entry.id} entry={entry} />
        ))}
        {hasMore && <SeeAll path={shelfPath} count={entries.length} />}
      </ul>

      {/* Decoration only: the plank's top surface and front edge, with brackets drawn in CSS. */}
      <div className="plank" aria-hidden="true">
        <div className="plank-top" />
        <div className="plank-front" />
      </div>
    </section>
  )
}
