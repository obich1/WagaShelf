// My Shelves: one shelf per media type the user has saved. Empty shelves aren't shown.
import { Link, useSearchParams } from 'react-router-dom'

import { useSession } from '../auth'
import { EmptyState, ErrorMessage, Loading, SignInPrompt } from '../components/common'
import ShelfRow from '../components/ShelfRow'
import ShelfSearch from '../components/ShelfSearch'
import { groupByMediaType, plural } from '../lib/media'
import { filterEntries } from '../lib/search'
import { useLibrary } from '../library/LibraryContext'

export default function Shelves() {
  const { isLoaded, isSignedIn } = useSession()
  const { entries, state, error, reload } = useLibrary()
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''

  if (!isLoaded) return <div className="page"><Loading /></div>
  if (!isSignedIn) return <div className="page"><SignInPrompt message="Your shelves keep everything you watch and read in one place." /></div>

  const matches = filterEntries(entries, query)
  const shelves = groupByMediaType(matches)

  function search(text) {
    setParams(text ? { q: text } : {}, { replace: true, preventScrollReset: true })
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>My Shelves</h1>
        {state === 'ready' && entries.length > 0 && matches.length > 0 && (
          <p className="lede">
            {query
              ? `${matches.length} ${matches.length === 1 ? 'match' : 'matches'} for “${query}”.`
              : `${plural(entries.length, 'title')} across ${plural(shelves.length, 'shelf').replace('shelfs', 'shelves')}.`}
          </p>
        )}
      </header>

      {state === 'ready' && entries.length > 0 && (
        <ShelfSearch value={query} onChange={search} placeholder="Search your shelves…" label="Search your shelves" />
      )}

      {state === 'loading' && <Loading label="Loading your shelves…" />}
      {state === 'error' && <ErrorMessage message={error} onRetry={reload} />}
      {state === 'ready' && entries.length > 0 && matches.length === 0 && (
        <EmptyState
          title="Nothing on your shelves matches"
          action={
            <Link className="button" to={`/discover?q=${encodeURIComponent(query)}`}>
              Search Discover for “{query}”
            </Link>
          }
        >
          Check the spelling, or look for it in the catalogue to add it.
        </EmptyState>
      )}
      {state === 'ready' && entries.length === 0 && (
        <EmptyState
          title="Your shelves are empty"
          action={<Link className="button" to="/discover">Find something to add</Link>}
        >
          A shelf appears here as soon as you save your first title of that type.
        </EmptyState>
      )}

      <div className="shelf-list">
        {shelves.map(({ type, entries: shelfEntries }) => (
          <ShelfRow key={type} type={type} entries={shelfEntries} query={query} />
        ))}
      </div>
    </div>
  )
}
