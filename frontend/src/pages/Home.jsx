// Home: a personal-library dashboard when signed in, a welcome page when signed out.
import { Link } from 'react-router-dom'

import { SignInLink, useSession } from '../auth'
import { Cover, EmptyState, ErrorMessage, Loading, TitleCard } from '../components/common'
import { MEDIA_TYPES, groupByMediaType, plural, progressLabel, statusLabel, titlePath } from '../lib/media'
import { useLibrary } from '../library/LibraryContext'

function Welcome() {
  return (
    <div className="page home-welcome">
      <section className="hero">
        <p className="eyebrow">我が · “my”</p>
        <h1>One cozy shelf for everything you watch and read.</h1>
        <p className="lede">
          Save Anime, Manga, Manhwa, Manhua, Light Novels and Books in one library. Track your progress if you want to,
          keep private notes, and find where to watch or read officially.
        </p>
        <div className="hero-actions">
          <SignInLink>Start your shelf</SignInLink>
          <Link className="button button-ghost" to="/discover">
            Browse titles
          </Link>
        </div>
      </section>
      <ul className="feature-list">
        <li>
          <h2>Saving comes first</h2>
          <p>Add a title in one click. Status and progress are optional, and you can add them later.</p>
        </li>
        <li>
          <h2>Shelves that build themselves</h2>
          <p>A shelf appears for each kind of media you save, with filters for what you're reading or watching.</p>
        </li>
        <li>
          <h2>Private by default</h2>
          <p>Your shelves and notes are yours. Nothing is public.</p>
        </li>
      </ul>
    </div>
  )
}

function ContinueCard({ entry }) {
  const { title } = entry
  return (
    <Link to={titlePath(title)} className="continue-card">
      <Cover src={title.cover_url} alt={title.title} size="small" />
      <div>
        <h3>{title.title}</h3>
        <p className="muted">{statusLabel(entry.status, title.media_type)}</p>
        {progressLabel(entry.progress, title) && <p>{progressLabel(entry.progress, title)}</p>}
      </div>
    </Link>
  )
}

export default function Home() {
  const { isLoaded, isSignedIn, userName } = useSession()
  const { entries, state, error, reload } = useLibrary()

  if (!isLoaded) return <div className="page"><Loading /></div>
  if (!isSignedIn) return <Welcome />

  const inProgress = entries.filter((e) => e.status === 'current' || e.status === 'revisiting').slice(0, 6)
  const recentlyAdded = [...entries].sort((a, b) => b.added_at.localeCompare(a.added_at)).slice(0, 6)
  const shelves = groupByMediaType(entries)

  return (
    <div className="page">
      <header className="page-header">
        <h1>{userName ? `Welcome back, ${userName}` : 'Welcome back'}</h1>
        {state === 'ready' && entries.length > 0 && (
          <p className="lede">You have {plural(entries.length, 'title')} on your shelves.</p>
        )}
      </header>

      {state === 'loading' && <Loading label="Loading your library…" />}
      {state === 'error' && <ErrorMessage message={error} onRetry={reload} />}

      {state === 'ready' && entries.length === 0 && (
        <EmptyState
          title="Your library is ready"
          action={<Link className="button" to="/discover">Find your first title</Link>}
        >
          Search for something you're watching or reading, open it, and add it to your shelf.
        </EmptyState>
      )}

      {state === 'ready' && entries.length > 0 && (
        <>
          {inProgress.length > 0 && (
            <section>
              <h2 className="section-title">Continue where you left off</h2>
              <div className="continue-list">
                {inProgress.map((entry) => (
                  <ContinueCard key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="section-title">Recently added</h2>
            <div className="title-grid">
              {recentlyAdded.map((entry) => (
                <TitleCard key={entry.id} title={entry.title} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="section-title">Your shelves</h2>
            <div className="overview">
              {shelves.map(({ type, entries: shelfEntries }) => (
                <Link key={type} to={`/shelf/${type}`} className="overview-card">
                  <span className="overview-count">{shelfEntries.length}</span>
                  <span>{MEDIA_TYPES[type].plural}</span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
