// One shelf (e.g. Anime), filterable by status, with quick status and progress updates.
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { useSession } from '../auth'
import { Cover, EmptyState, ErrorMessage, Loading, SignInPrompt } from '../components/common'
import { MEDIA_TYPES, STATUSES, progressLabel, statusLabel, titlePath, totalFor } from '../lib/media'
import { useLibrary } from '../library/LibraryContext'

function ShelfItem({ entry }) {
  const { updateEntry } = useLibrary()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const { title } = entry
  const total = totalFor(title)
  const unit = MEDIA_TYPES[title.media_type]?.unit || 'part'
  const finished = total != null && entry.progress != null && entry.progress >= total

  async function change(changes) {
    setBusy(true)
    setError(null)
    try {
      await updateEntry(entry.id, changes)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function addOne() {
    const progress = (entry.progress ?? 0) + 1
    const changes = { progress }
    // Starting to track something with no status means you've started it.
    if (!entry.status || entry.status === 'planning') changes.status = 'current'
    if (total != null && progress >= total) changes.status = 'completed'
    change(changes)
  }

  return (
    <li className="shelf-item">
      <Link to={titlePath(title)} className="shelf-item-cover">
        <Cover src={title.cover_url} alt={title.title} size="small" />
      </Link>
      <div className="shelf-item-body">
        <Link to={titlePath(title)} className="shelf-item-title">
          {title.title}
        </Link>
        <div className="shelf-item-meta">
          {progressLabel(entry.progress, title) && <span>{progressLabel(entry.progress, title)}</span>}
          {entry.rating != null && <span>★ {entry.rating}</span>}
        </div>
        <div className="shelf-item-actions">
          <select
            aria-label={`Status for ${title.title}`}
            value={entry.status ?? ''}
            disabled={busy}
            onChange={(e) => change({ status: e.target.value || null })}
          >
            <option value="">No status</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value, title.media_type)}
              </option>
            ))}
          </select>
          <button className="button button-small button-ghost" onClick={addOne} disabled={busy || finished}>
            +1 {unit}
          </button>
        </div>
        {error && <p className="form-message form-message-error">{error}</p>}
      </div>
    </li>
  )
}

export default function Shelf() {
  const { mediaType } = useParams()
  const [params, setParams] = useSearchParams()
  const statusFilter = params.get('status') || 'all'
  const { isLoaded, isSignedIn } = useSession()
  const { entries, state, error, reload } = useLibrary()
  const info = MEDIA_TYPES[mediaType]

  if (!info) return <div className="page"><EmptyState title="Shelf not found" action={<Link className="button" to="/shelves">Back to My Shelves</Link>} /></div>
  if (!isLoaded) return <div className="page"><Loading /></div>
  if (!isSignedIn) return <div className="page"><SignInPrompt /></div>

  const shelfEntries = entries.filter((entry) => entry.title.media_type === mediaType)
  const counts = {}
  for (const entry of shelfEntries) counts[entry.status ?? 'none'] = (counts[entry.status ?? 'none'] || 0) + 1
  const filters = [
    ['all', 'All', shelfEntries.length],
    ...STATUSES.filter((s) => counts[s]).map((s) => [s, statusLabel(s, mediaType), counts[s]]),
    ...(counts.none ? [['none', 'No status', counts.none]] : []),
  ]
  const visible = shelfEntries.filter(
    (entry) => statusFilter === 'all' || (entry.status ?? 'none') === statusFilter,
  )

  return (
    <div className="page">
      <header className="page-header">
        <p className="breadcrumb">
          <Link to="/shelves">My Shelves</Link> /
        </p>
        <h1>{info.plural}</h1>
      </header>

      {state === 'loading' && <Loading label="Loading your shelf…" />}
      {state === 'error' && <ErrorMessage message={error} onRetry={reload} />}
      {state === 'ready' && shelfEntries.length === 0 && (
        <EmptyState title={`No ${info.plural.toLowerCase()} yet`} action={<Link className="button" to={`/discover?category=${mediaType}`}>Find {info.plural.toLowerCase()}</Link>} />
      )}

      {shelfEntries.length > 0 && (
        <>
          <div className="chips" role="group" aria-label="Filter by status">
            {filters.map(([value, label, count]) => (
              <button
                key={value}
                className={`chip${statusFilter === value ? ' chip-active' : ''}`}
                aria-pressed={statusFilter === value}
                onClick={() => setParams(value === 'all' ? {} : { status: value })}
              >
                {label} <span className="chip-count">{count}</span>
              </button>
            ))}
          </div>
          {visible.length === 0 ? (
            <p className="muted">Nothing here with that status.</p>
          ) : (
            <ul className="shelf-items">
              {visible.map((entry) => (
                <ShelfItem key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
