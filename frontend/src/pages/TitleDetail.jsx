// A title's detail page: shared catalogue information, official links, and the user's own entry.
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { request } from '../api/client'
import { SignInLink, useSession } from '../auth'
import { Cover, ErrorMessage, Loading, MediaBadge } from '../components/common'
import EntryEditor from '../components/EntryEditor'
import { MEDIA_TYPES, STATUSES, plural, statusLabel, totalFor } from '../lib/media'
import { useLibrary } from '../library/LibraryContext'

function Facts({ title }) {
  const unit = MEDIA_TYPES[title.media_type]?.unit
  const total = totalFor(title)
  const facts = [
    title.creators.length > 0 && ['By', title.creators.slice(0, 3).join(', ')],
    title.release_year && ['Released', title.release_year],
    title.release_status && ['Status', title.release_status[0].toUpperCase() + title.release_status.slice(1)],
    total && ['Length', plural(total, unit)],
    title.total_volumes && ['Volumes', title.total_volumes],
  ].filter(Boolean)
  return (
    <dl className="facts">
      {facts.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function AddToShelf({ title }) {
  const { addTitle } = useLibrary()
  const [status, setStatus] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(null)

  async function add() {
    setAdding(true)
    setError(null)
    try {
      await addTitle(title, status ? { status } : {})
    } catch (err) {
      setError(err.message)
      setAdding(false)
    }
  }

  return (
    <div className="add-to-shelf">
      <label>
        Status <span className="hint">(optional)</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">No status yet</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {statusLabel(value, title.media_type)}
            </option>
          ))}
        </select>
      </label>
      <button className="button" onClick={add} disabled={adding}>
        {adding ? 'Adding…' : 'Add to My Shelf'}
      </button>
      {error && <p className="form-message form-message-error">{error}</p>}
    </div>
  )
}

function ShelfPanel({ title }) {
  const { isLoaded, isSignedIn } = useSession()
  const library = useLibrary()
  const navigate = useNavigate()
  const entry = library.entryFor(title.source, title.source_id)
  const shelfName = MEDIA_TYPES[title.media_type]?.plural

  let content
  if (!isLoaded || (isSignedIn && library.state === 'loading')) {
    content = <Loading label="Checking your shelf…" />
  } else if (!isSignedIn) {
    content = (
      <>
        <p>Sign in to save this title and track your progress.</p>
        <SignInLink>Sign in to save</SignInLink>
      </>
    )
  } else if (library.state === 'error') {
    content = <ErrorMessage message={library.error} onRetry={library.reload} />
  } else if (entry) {
    content = (
      <>
        <p className="shelf-panel-note">
          On your <Link to={`/shelf/${title.media_type}`}>{shelfName} shelf</Link>.
        </p>
        <EntryEditor
          key={entry.id}
          entry={entry}
          onSave={(changes) => library.updateEntry(entry.id, changes)}
          onRemove={async () => {
            await library.removeEntry(entry.id)
            navigate(`/shelf/${title.media_type}`)
          }}
        />
      </>
    )
  } else {
    content = <AddToShelf title={title} />
  }

  return (
    <section className="panel shelf-panel" aria-label="Your shelf">
      <h2>Your shelf</h2>
      {content}
    </section>
  )
}

export default function TitleDetail() {
  const { source, sourceId } = useParams()
  const [title, setTitle] = useState(null)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setTitle(null)
    setError(null)
    request(`/titles/${source}/${encodeURIComponent(sourceId)}`)
      .then((data) => !cancelled && setTitle(data))
      .catch((err) => !cancelled && setError(err.status === 404 ? "We couldn't find that title." : err.message))
    return () => {
      cancelled = true
    }
  }, [source, sourceId, attempt])

  if (error) return <div className="page"><ErrorMessage message={error} onRetry={() => setAttempt((n) => n + 1)} /></div>
  if (!title) return <div className="page"><Loading label="Loading title…" /></div>

  const officialLinks = title.external_links.filter((link) => link.kind === 'official')
  const infoLinks = title.external_links.filter((link) => link.kind !== 'official')
  const verb = MEDIA_TYPES[title.media_type]?.verb === 'watch' ? 'watch' : 'read'

  return (
    <div className="page title-page">
      <div className="title-hero">
        <Cover src={title.cover_url} alt={title.title} size="large" />
        <div className="title-hero-text">
          <MediaBadge mediaType={title.media_type} />
          <h1>{title.title}</h1>
          <Facts title={title} />
          {title.genres.length > 0 && (
            <ul className="genres">
              {title.genres.map((genre) => (
                <li key={genre}>{genre}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="title-columns">
        <div>
          <section className="panel">
            <h2>About</h2>
            {title.description ? (
              title.description.split(/\n{2,}/).map((paragraph, i) => <p key={i}>{paragraph}</p>)
            ) : (
              <p className="muted">No description available.</p>
            )}
          </section>

          <section className="panel">
            <h2>Where to {verb}</h2>
            {officialLinks.length > 0 ? (
              <ul className="link-list">
                {officialLinks.map((link) => (
                  <li key={link.url}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      {link.site} ↗
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No official links are known for this title yet.</p>
            )}
            {infoLinks.length > 0 && (
              <p className="more-links">
                More info:{' '}
                {infoLinks.map((link, i) => (
                  <span key={link.url}>
                    {i > 0 && ' · '}
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      {link.site}
                    </a>
                  </span>
                ))}
              </p>
            )}
            <p className="hint">Availability can vary by region and may change.</p>
          </section>
        </div>

        <ShelfPanel title={title} />
      </div>
    </div>
  )
}
