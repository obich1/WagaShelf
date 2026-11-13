// Discover: universal search with media-category filters, plus trending titles when nothing is searched.
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { request } from '../api/client'
import { EmptyState, ErrorMessage, Loading, TitleCard } from '../components/common'
import { MEDIA_ORDER, MEDIA_TYPES } from '../lib/media'
import { useLibrary } from '../library/LibraryContext'

const CATEGORIES = [['all', 'All'], ...MEDIA_ORDER.map((type) => [type, MEDIA_TYPES[type].plural])]

// Recent results, kept in memory until the app is closed or refreshed. Going back to Discover
// shows them straight away instead of searching again, so the page is already full-length and
// the scroll position can be restored. Only complete answers are kept (no unreachable sources).
const MAX_CACHED = 20
const resultCache = new Map()
const cacheKey = (query, category) => `${query}|${category}`

function remember(key, data) {
  resultCache.delete(key) // re-adding moves it to the end, so the oldest search is first
  resultCache.set(key, data)
  if (resultCache.size > MAX_CACHED) resultCache.delete(resultCache.keys().next().value)
}

export default function Discover() {
  // The search lives in the URL (?q=...&category=...), so results survive a refresh,
  // the back button works, and a search can be shared as a link.
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''
  const category = params.get('category') || 'all'

  const [draft, setDraft] = useState(query)
  const cached = resultCache.get(cacheKey(query, category))
  const [results, setResults] = useState(cached?.results ?? null)
  const [unavailable, setUnavailable] = useState([])
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const { entryFor } = useLibrary()
  const searchInput = useRef(null)

  useEffect(() => setDraft(query), [query])

  useEffect(() => {
    const key = cacheKey(query, category)
    const saved = attempt === 0 && resultCache.get(key) // "Try again" always asks the server
    if (saved) {
      setResults(saved.results)
      setUnavailable([])
      setError(null)
      setLoading(false)
      return undefined
    }

    let cancelled = false // ignore answers to old searches if the user has already searched again
    setLoading(true)
    setError(null)
    const path = query ? '/search' : '/trending'
    request(path, { params: { q: query || undefined, category } })
      .then((data) => {
        if (cancelled) return
        setResults(data.results)
        setUnavailable(data.unavailable_sources)
        if (data.unavailable_sources.length === 0) remember(key, { results: data.results })
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [query, category, attempt])

  // `options` go to React Router, e.g. { preventScrollReset: true } to stay where you are.
  function update(changes, options) {
    const next = { q: query, category, ...changes }
    const cleaned = Object.fromEntries(Object.entries(next).filter(([key, value]) => value && !(key === 'category' && value === 'all')))
    setParams(cleaned, options)
  }

  function submit(event) {
    event.preventDefault()
    update({ q: draft.trim() })
  }

  // Empty the search box and go back to trending titles. The cursor stays in the box,
  // ready for a new search.
  function clearSearch() {
    setDraft('')
    if (query) update({ q: '' })
    searchInput.current?.focus()
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Discover</h1>
        <p className="lede">Search Anime, Manga, Manhwa, Manhua, Light Novels and Books in one place.</p>
      </header>

      <form className="search-bar" role="search" onSubmit={submit}>
        <div className="search-field">
          <input
            ref={searchInput}
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && clearSearch()}
            placeholder="Search for a title…"
            aria-label="Search for a title"
            maxLength={100}
          />
          {/* Our own clear button: browsers only sometimes draw one (not on iPhones), so we don't rely on it. */}
          {draft && (
            <button type="button" className="search-clear" aria-label="Clear search" onClick={clearSearch}>
              ×
            </button>
          )}
        </div>
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
            onClick={() => update({ category: value }, { preventScrollReset: true })}
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
