// One shelf on My Shelves: a wall, a row of covers facing out, and a plank with brackets.
// Each cover opens its title page; the heading opens the full shelf.
import { Link } from 'react-router-dom'

import { MEDIA_TYPES, plural, statusLabel, titlePath, totalFor } from '../lib/media'
import { Cover } from './common'

const PREVIEW = 8

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

export default function ShelfRow({ type, entries }) {
  const shelfPath = `/shelf/${type}`
  return (
    <section className="shelf-wall" aria-labelledby={`shelf-${type}`}>
      <div className="shelf-wall-header">
        <h2 id={`shelf-${type}`}>
          <Link to={shelfPath}>{MEDIA_TYPES[type].plural}</Link>
        </h2>
        <Link to={shelfPath} className="shelf-wall-count">
          {plural(entries.length, 'title')} →
        </Link>
      </div>

      <ul className="shelf-books">
        {entries.slice(0, PREVIEW).map((entry) => (
          <ShelfBook key={entry.id} entry={entry} />
        ))}
      </ul>

      {/* Decoration only: the plank's top surface and front edge, with brackets drawn in CSS. */}
      <div className="plank" aria-hidden="true">
        <div className="plank-top" />
        <div className="plank-front" />
      </div>
    </section>
  )
}
