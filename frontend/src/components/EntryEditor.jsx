// The form for a saved title's personal details: status, progress, rating and private notes.
// Used on the title page and the shelf page.
import { useState } from 'react'

import { MEDIA_TYPES, STATUSES, statusLabel, totalFor } from '../lib/media'

function toNumberOrNull(value) {
  return value === '' ? null : Number(value)
}

export default function EntryEditor({ entry, onSave, onRemove, compact = false }) {
  const { title } = entry
  const unit = MEDIA_TYPES[title.media_type]?.unit || 'part'
  const total = totalFor(title)

  const [status, setStatus] = useState(entry.status ?? '')
  const [progress, setProgress] = useState(entry.progress ?? '')
  const [rating, setRating] = useState(entry.rating ?? '')
  const [notes, setNotes] = useState(entry.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Only send what actually changed, so a PATCH never overwrites other fields by accident.
  function changes() {
    const updated = {
      status: status || null,
      progress: toNumberOrNull(progress),
      rating: toNumberOrNull(rating),
      notes: notes.trim() || null,
    }
    return Object.fromEntries(Object.entries(updated).filter(([field, value]) => value !== (entry[field] ?? null)))
  }

  async function save(event) {
    event.preventDefault()
    const changed = changes()
    if (Object.keys(changed).length === 0) {
      setMessage({ type: 'info', text: 'Nothing to save.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await onSave(changed)
      setMessage({ type: 'success', text: 'Saved.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm(`Remove "${title.title}" from your shelf? Your status, rating and notes will be deleted.`)) return
    try {
      await onRemove()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  return (
    <form className={`entry-editor${compact ? ' entry-editor-compact' : ''}`} onSubmit={save}>
      <div className="field-row">
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">No status</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value, title.media_type)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Progress ({unit}s{total ? ` of ${total}` : ''})
          <input
            type="number"
            min="0"
            max={total || undefined}
            inputMode="numeric"
            value={progress}
            placeholder="Not tracking"
            onChange={(e) => setProgress(e.target.value)}
          />
        </label>
        <label>
          Rating (1–10)
          <input
            type="number"
            min="1"
            max="10"
            step="0.5"
            inputMode="decimal"
            value={rating}
            placeholder="Unrated"
            onChange={(e) => setRating(e.target.value)}
          />
        </label>
      </div>
      {!compact && (
        <label>
          Private notes <span className="hint">Only you can see these.</span>
          <textarea
            rows="4"
            maxLength="5000"
            value={notes}
            placeholder="Thoughts, favourite moments, where you left off…"
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
      )}
      <div className="form-actions">
        <button className="button" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {onRemove && (
          <button className="button button-ghost button-danger" type="button" onClick={remove}>
            Remove from shelf
          </button>
        )}
        {message && (
          <span className={`form-message form-message-${message.type}`} role="status">
            {message.text}
          </span>
        )}
      </div>
    </form>
  )
}
