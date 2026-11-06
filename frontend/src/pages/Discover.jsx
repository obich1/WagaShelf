// Discover: universal search with media-category filters, plus trending titles when nothing is searched.
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { request } from '../api/client'
import { EmptyState, ErrorMessage, Loading, TitleCard } from '../components/common'
import { MEDIA_ORDER, MEDIA_TYPES } from '../lib/media'
import { useLibrary } from '../library/LibraryContext'

const CATEGORIES = [['all', 'All'], ...MEDIA_ORDER.map((type) => [type, MEDIA_TYPES[type].plural])]

export default function Discover() {
  // The search lives in the URL (?q=...&category=...), so results survive a refresh,
  // the back button works, and a search can be shared as a link.
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''
  const category = params.get('category') || 'all'

  const [draft, setDraft] = useState(query)
  const [results, setResults] = useState(null)
  const [unavailable, setUnavailable] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const { entryFor } = useLibrary()

  useEffect(() => setDraft(query), [query])

  useEffect(() => {
    let cancelled = false // ignore answers to old searches if the user has already searched again
    setLoading(true)
    setError(null)
    const path = query ? '/search' : '/trending'
    request(path, { params: { q: query || undefined, category } })
      .then((data) => {
        if (cancelled) return
        setResults(data.results)
        setUnavailable(data.unavailable_sources)
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [query, category, attempt])

  function update(changes) {
    const next = { q: query, category, ...changes }
    const cleaned = Object.fromEntries(Object.entries(next).filter(([key, value]) => value && !(key === 'category' && value === 'all')))
    setParams(cleaned)
  }

  function submit(event) {
    event.preventDefault()
    update({ q: draft.trim() })
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Discover</h1>
        <p className="lede">Search anime, manga, manhwa, manhua, novels and books in one place.</p>
      </header>

      <form className="search-bar" role="search" onSubmit={submit}>
        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search for a title…"
          aria-label="Search for a title"
          maxLength={100}
        />
        <button className="button" type="submit">
          Search
        </button>
      </form>

      <div className="chips" role="group" aria-label="Media category">
        {CATEGORIES.map(([value, label]) => (
          <button
            key={value}
            className={`chip${category === value ? ' chip-active' : ''}`}
            aria-pressed={category === value}
            onClick={() => update({ category: value })}
          >
            {label}
          </button>
        ))}
      </div>

      <h2 className="section-title">{query ? `Results for “${query}”` : 'Trending now'}</h2>

      {unavailable.length > 0 && !loading && (
        <div className="notice">
          <p>{unavailable.join(' and ')} couldn't be reached, so some results may be missing.</p>
        </div>
      )}

      {loading && <Loading label={query ? 'Searching…' : 'Loading trending titles…'} />}
      {error && !loading && <ErrorMessage message={error} onRetry={() => setAttempt((n) => n + 1)} />}
      {!loading && !error && results?.length === 0 && (
        <EmptyState title="No results found">Try a different spelling, or search in another category.</EmptyState>
      )}
      {!loading && !error && results?.length > 0 && (
        <div className="title-grid">
          {results.map((title) => {
            const saved = entryFor(title.source, title.source_id)
            return (
              <TitleCard
                key={`${title.source}-${title.source_id}`}
                title={title}
                footer={saved && <span className="saved-tag">On your shelf</span>}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
