// Quick add: a round button on a cover that saves the title to your shelf without leaving the page.
// "+" opens a small status picker over the cover; "✓" means it's already on your shelf, and opens
// the same picker to change the status or remove it. Every change can be undone from the toast.
import { useEffect, useRef, useState } from 'react'

import { SignInLink, useSession } from '../auth'
import { MEDIA_TYPES, statusLabel } from '../lib/media'
import { useLibrary } from '../library/LibraryContext'
import { useToast } from './Toast'

const QUICK_STATUSES = ['planning', 'current', 'completed']

// The sparks of the "added" burst: where each one flies (in pixels) and its colour.
const SPARKS = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2
  const distance = i % 2 === 0 ? 34 : 24
  return {
    dx: Math.round(Math.cos(angle) * distance),
    dy: Math.round(Math.sin(angle) * distance),
    colour: ['--accent', '--success', '--accent-strong'][i % 3],
  }
})

export default function QuickAdd({ title }) {
  const { isLoaded, isSignedIn } = useSession()
  const library = useLibrary()
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [bursts, setBursts] = useState(0) // changing it restarts the burst animation
  const root = useRef(null)
  const button = useRef(null)

  const entry = library.entryFor(title.source, title.source_id)
  const shelf = MEDIA_TYPES[title.media_type]?.plural ?? 'your shelf'

  // Close on Escape (focus goes back to the button) or a click elsewhere. Focus the first choice on open.
  useEffect(() => {
    if (!open) return undefined
    root.current.querySelector('.quick-picker button')?.focus({ preventScroll: true })
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    const onPointerDown = (event) => {
      if (!root.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  if (!isLoaded) return null

  // Signed out: the button opens sign-in, because there's no shelf to add to yet.
  if (!isSignedIn) {
    return (
      <SignInLink className="quick-add-button" aria-label={`Sign in to save ${title.title}`}>
        +
      </SignInLink>
    )
  }
  if (library.state === 'error') return null // the shelf couldn't load; the page's other features cover this
  if (library.state !== 'ready') {
    return (
      <button type="button" className="quick-add-button" disabled aria-label="Loading your shelf">
        +
      </button>
    )
  }

  function close() {
    setOpen(false)
    button.current?.focus()
  }

  // Run a change, then tell the person what happened (and how to undo it).
  async function run(change) {
    setBusy(true)
    try {
      const { message, undo, celebrate } = await change()
      if (celebrate) setBursts((n) => n + 1)
      showToast(message, undo && { label: 'Undo', onClick: () => undo().catch((err) => showToast(err.message)) })
    } catch (err) {
      showToast(err.message)
    } finally {
      setBusy(false)
      close()
    }
  }

  const save = (status) =>
    run(async () => {
      if (!entry) {
        const added = await library.addTitle(title, status ? { status } : {})
        return {
          message: `Added “${title.title}” to ${shelf}`,
          undo: () => library.removeEntry(added.id),
          celebrate: true,
        }
      }
      const before = entry.status
      await library.updateEntry(entry.id, { status })
      return {
        message: `${title.title}: ${statusLabel(status, title.media_type)}`,
        undo: () => library.updateEntry(entry.id, { status: before }),
      }
    })

  const remove = () => {
    const hasDetails = entry.progress != null || entry.rating != null || entry.notes
    if (hasDetails && !window.confirm(`Remove "${title.title}" from your shelf? Your progress, rating and notes will be deleted.`)) {
      return undefined
    }
    return run(async () => {
      const { id, status, progress, rating, notes } = entry
      await library.removeEntry(id)
      return {
        message: `Removed “${title.title}” from your shelf`,
        // Undo saves it again with everything it had.
        undo: () => library.addTitle(title, { status, progress, rating, notes }),
      }
    })
  }

  return (
    <div className="quick-add" ref={root}>
      <button
        type="button"
        ref={button}
        className={`quick-add-button${entry ? ' quick-add-saved' : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={
          entry
            ? `On your shelf: ${statusLabel(entry.status, title.media_type)}. Change ${title.title}`
            : `Quick add ${title.title}`
        }
        onClick={() => setOpen(!open)}
      >
        {entry ? '✓' : '+'}
      </button>

      {bursts > 0 && (
        <span className="quick-add-burst" key={bursts} aria-hidden="true">
          {SPARKS.map((spark, i) => (
            <i key={i} style={{ '--dx': `${spark.dx}px`, '--dy': `${spark.dy}px`, background: `var(${spark.colour})` }} />
          ))}
        </span>
      )}

      {open && (
        <div className="quick-picker" role="group" aria-label={`Add ${title.title} to your shelf`}>
          <p>{entry ? 'On your shelf' : `Add to ${shelf}`}</p>
          {QUICK_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              disabled={busy}
              className={entry?.status === status ? 'current' : ''}
              aria-pressed={entry ? entry.status === status : undefined}
              onClick={() => save(status)}
            >
              {statusLabel(status, title.media_type)}
            </button>
          ))}
          {!entry && (
            <button type="button" disabled={busy} onClick={() => save(null)}>
              Just save
            </button>
          )}
          <div className="quick-picker-footer">
            {entry && (
              <button type="button" className="quick-remove" disabled={busy} onClick={remove}>
                Remove
              </button>
            )}
            <button type="button" className="quick-cancel" onClick={close}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
