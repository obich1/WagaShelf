// Small building blocks used on several pages.
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { SignInLink } from '../auth'
import { MEDIA_TYPES, titlePath } from '../lib/media'

export function Loading({ label = 'Loading…' }) {
  return (
    <p className="loading" role="status">
      <span className="spinner" aria-hidden="true" /> {label}
    </p>
  )
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="notice notice-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button className="button button-small" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

export function SignInPrompt({ message }) {
  return (
    <EmptyState title="Sign in to see your shelves" action={<SignInLink>Sign in</SignInLink>}>
      {message}
    </EmptyState>
  )
}

export function Cover({ src, alt, size = 'medium' }) {
  // If the image is missing or fails to load, show the title on a plain cover instead.
  const [failed, setFailed] = useState(false)
  return src && !failed ? (
    <img className={`cover cover-${size}`} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
  ) : (
    <div className={`cover cover-${size} cover-missing`} role="img" aria-label={alt}>
      <span>{alt}</span>
    </div>
  )
}

export function MediaBadge({ mediaType }) {
  return <span className={`badge badge-${mediaType}`}>{MEDIA_TYPES[mediaType]?.label || mediaType}</span>
}

// A cover with its title underneath, linking to the title's page.
export function TitleCard({ title, footer }) {
  return (
    <article className="title-card">
      <Link to={titlePath(title)} className="title-card-link">
        <Cover src={title.cover_url} alt={title.title} />
        <h3>{title.title}</h3>
      </Link>
      <div className="title-card-meta">
        <MediaBadge mediaType={title.media_type} />
        {title.release_year && <span>{title.release_year}</span>}
      </div>
      {footer}
    </article>
  )
}
