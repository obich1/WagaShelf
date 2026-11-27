// The search box on My Shelves and on each shelf (#34). It filters as you type, so it has no
// Search button, unlike Discover's box, which asks the catalogues and so waits for Enter.
// The text lives in the page's address (?q=...), so a refresh or the back button keeps it.
import { useState } from 'react'

export default function ShelfSearch({ value, onChange, placeholder, label }) {
  const [draft, setDraft] = useState(value)
  const [seen, setSeen] = useState(value)

  // Follow the address when it changes from outside (back button, a link). The address holds the
  // trimmed text, so a space typed at the end of the draft is kept instead of being overwritten.
  // (Adjusting state while rendering is React's way to do this without an extra effect.)
  if (value !== seen) {
    setSeen(value)
    if (draft.trim() !== value) setDraft(value)
  }

  function change(text) {
    setDraft(text)
    onChange(text.trim())
  }

  return (
    <div className="search-bar shelf-search" role="search">
      <div className="search-field">
        <input
          type="search"
          value={draft}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && change('')}
          placeholder={placeholder}
          aria-label={label}
          maxLength={100}
        />
        {/* Our own clear button, because browsers only sometimes draw one (not on iPhones). */}
        {draft && (
          <button type="button" className="search-clear" aria-label="Clear search" onClick={() => change('')}>
            ×
          </button>
        )}
      </div>
    </div>
  )
}
