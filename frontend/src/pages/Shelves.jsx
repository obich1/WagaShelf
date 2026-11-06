// My Shelves: one shelf per media type the user has saved. Empty shelves aren't shown.
import { Link } from 'react-router-dom'

import { useSession } from '../auth'
import { Cover, EmptyState, ErrorMessage, Loading, SignInPrompt } from '../components/common'
import { MEDIA_TYPES, groupByMediaType, plural } from '../lib/media'
import { useLibrary } from '../library/LibraryContext'

export default function Shelves() {
  const { isLoaded, isSignedIn } = useSession()
  const { entries, state, error, reload } = useLibrary()

  if (!isLoaded) return <div className="page"><Loading /></div>
  if (!isSignedIn) return <div className="page"><SignInPrompt message="Your shelves keep everything you watch and read in one place." /></div>

  const shelves = groupByMediaType(entries)

  return (
    <div className="page">
      <header className="page-header">
        <h1>My Shelves</h1>
        {state === 'ready' && entries.length > 0 && (
          <p className="lede">
            {plural(entries.length, 'title')} across {plural(shelves.length, 'shelf').replace('shelfs', 'shelves')}.
          </p>
        )}
      </header>

      {state === 'loading' && <Loading label="Loading your shelves…" />}
      {state === 'error' && <ErrorMessage message={error} onRetry={reload} />}
      {state === 'ready' && shelves.length === 0 && (
        <EmptyState
          title="Your shelves are empty"
          action={<Link className="button" to="/discover">Find something to add</Link>}
        >
          A shelf appears here as soon as you save your first title of that type.
        </EmptyState>
      )}

      <div className="shelf-list">
        {shelves.map(({ type, entries: shelfEntries }) => (
          <Link key={type} to={`/shelf/${type}`} className="shelf-row">
            <div className="shelf-row-header">
              <h2>{MEDIA_TYPES[type].plural}</h2>
              <span className="muted">{plural(shelfEntries.length, 'title')} →</span>
            </div>
            <div className="shelf-row-covers" aria-hidden="true">
              {shelfEntries.slice(0, 8).map((entry) => (
                <Cover key={entry.id} src={entry.title.cover_url} alt={entry.title.title} size="small" />
              ))}
            </div>
            <div className="shelf-plank" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  )
}
