// One shelf (e.g. Anime), filterable by status, with quick status and progress updates.
import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { useSession } from '../auth'
import { Cover, EmptyState, ErrorMessage, Loading, SignInPrompt } from '../components/common'
import { MEDIA_TYPES, STATUSES, plural, progressLabel, statusLabel, titlePath, totalFor } from '../lib/media'
import { useLibrary } from '../library/LibraryContext'

// The progress text ("12 / 24 episodes ✎"). Tapping it turns it into a number box:
// Enter or tapping away saves, Escape cancels. Saving happens on blur only, so Enter just blurs
// the box (otherwise Enter would save once and the blur that follows would save again).
function ProgressEditor({ entry, total, unit, busy, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [problem, setProblem] = useState(null)
  const cancelled = useRef(false)
  const returnFocus = useRef(false) // after Enter or Escape, put the keyboard focus back on the button
  const button = useRef(null)
  const label = progressLabel(entry.progress, entry.title) || 'Add progress'

  useEffect(() => {
    if (!editing && returnFocus.current) {
      returnFocus.current = false
      button.current?.focus()
    }
  }, [editing])

  function open() {
    if (busy) return // not disabled while saving, so the keyboard focus can come back to it
    setDraft(entry.progress == null ? '' : String(entry.progress))
    setProblem(null)
    cancelled.current = false
    setEditing(true)
  }

  function finish() {
    setEditing(false)
    if (cancelled.current) return
    const text = draft.trim()
    const progress = text === '' ? null : Number(text)
    if (progress === (entry.progress ?? null)) return
    if (progress !== null && (!Number.isInteger(progress) || progress < 0)) {
      setProblem(`Progress has to be a whole number of ${unit}s.`)
      return
    }
    if (progress !== null && total != null && progress > total) {
      setProblem(`There ${total === 1 ? 'is' : 'are'} only ${plural(total, unit)}.`)
      return
    }
    setProblem(null)
    onSave(progress)
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') cancelled.current = true
    if (event.key === 'Escape' || event.key === 'Enter') {
      event.preventDefault()
      returnFocus.current = true
      event.currentTarget.blur()
    }
  }

  return (
    <>
      {editing ? (
        <span className="progress-edit">
          <input
            className="progress-edit-input"
            type="number"
            min="0"
            max={total ?? undefined}
            inputMode="numeric"
            aria-label={`Progress for ${entry.title.title}, in ${unit}s`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.target.select()}
            onKeyDown={onKeyDown}
            onBlur={finish}
            autoFocus
          />
          {total != null && <span>/ {plural(total, unit)}</span>}
        </span>
      ) : (
        <button
          ref={button}
          type="button"
          className="progress-edit-button"
          onClick={open}
          aria-busy={busy}
          aria-label={`Edit progress: ${label}`}
        >
          {label} <span aria-hidden="true">✎</span>
        </button>
      )}
      {problem && <span className="form-message form-message-error progress-edit-problem">{problem}</span>}
    </>
  )
}

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

  // The same rules for +1 and for typing a number: starting to track something with no status
  // (or "planning") means you've started it, and reaching the total means you've finished it.
  function setProgress(progress) {
    const changes = { progress }
    if (progress != null && progress > 0 && (!entry.status || entry.status === 'planning')) changes.status = 'current'
    if (progress != null && total != null && progress >= total) changes.status = 'completed'
    change(changes)
  }

  function addOne() {
    setProgress((entry.progress ?? 0) + 1)
  }

  return (
    <li className="shelf-item">
      <Link to={titlePath(title)} className="shelf-item-cover">
        <Cover src={title.cover_url} alt={title.title} size="list" />
      </Link>
      <div className="shelf-item-body">
        <Link to={titlePath(title)} className="shelf-item-title">
          {title.title}
        </Link>
        <div className="shelf-item-meta">
          <ProgressEditor entry={entry} total={total} unit={unit} busy={busy} onSave={setProgress} />
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
                onClick={() => setParams(value === 'all' ? {} : { status: value }, { preventScrollReset: true })}
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
