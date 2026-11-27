// The theme switcher in the header: a button that opens a small menu of themes.
import { useEffect, useRef, useState } from 'react'

import { THEMES, useTheme } from '../theme'

const OPTIONS = [...THEMES, { id: 'system', name: 'Match my device', hint: 'Light or dark, like your phone or computer' }]

export default function ThemeMenu() {
  const { choice, setChoice } = useTheme()
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const button = useRef(null)

  // Close on a click elsewhere or on Escape (and give the focus back to the button).
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event) => {
      if (!root.current.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        button.current.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function pick(id) {
    setChoice(id)
    setOpen(false)
    button.current.focus()
  }

  return (
    <div className="theme-menu" ref={root}>
      <button
        type="button"
        ref={button}
        className="theme-button"
        aria-label="Theme"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.9 1.4-1.8-.4-1.2.4-2.2 1.6-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z" />
          <circle cx="7.5" cy="11" r="1.2" fill="currentColor" />
          <circle cx="10" cy="7" r="1.2" fill="currentColor" />
          <circle cx="14.5" cy="7" r="1.2" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="theme-popup" role="menu" aria-label="Theme">
          <p className="theme-popup-title">Theme</p>
          {OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitemradio"
              aria-checked={choice === option.id}
              className="theme-option"
              onClick={() => pick(option.id)}
            >
              <span className="theme-swatch" aria-hidden="true">
                {/* "Match my device" shows both themes' backgrounds side by side. */}
                <i style={{ background: option.background ?? THEMES[0].background }} />
                <i style={{ background: option.accent ?? THEMES[1].background }} />
              </span>
              <span>
                {option.name}
                <small>{option.hint}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
