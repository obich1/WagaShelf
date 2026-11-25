// Themes: which colour set the app uses.
// A theme is just a set of CSS variable values (see :root in index.css). Switching one means
// putting data-theme="light" or "dark" on <html>; every colour in the app follows from that.
//
// The person's choice is "light", "dark" or "system" (follow the device). Until they pick one
// it is "system", so a phone in light mode gets the light theme. The choice is kept in
// localStorage, in this browser only (saving it to the account is a later step).
//
// index.html runs a tiny script with the same rules before the page paints, so there is no
// flash of the wrong theme. If you change the rules here, change them there too.
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'wagashelf-theme'

// The themes people can pick. Adding one later = a new entry here and a :root[data-theme] block.
// The colours are for the swatches in the menu and the browser's toolbar colour (theme-color).
export const THEMES = [
  { id: 'light', name: 'Cream', hint: 'Warm parchment, walnut shelves', background: '#ece0ca', accent: '#945020' },
  { id: 'dark', name: 'Cozy dark', hint: 'Dim lamp, dark wood', background: '#1b1512', accent: '#e0a458' },
]

function readChoice() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return THEMES.some((theme) => theme.id === saved) ? saved : 'system'
  } catch {
    return 'system' // storage can be blocked (private mode, strict settings)
  }
}

const deviceQuery = () => window.matchMedia('(prefers-color-scheme: light)')
const deviceTheme = () => (deviceQuery().matches ? 'light' : 'dark')

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [choice, setChoice] = useState(readChoice)
  const [device, setDevice] = useState(deviceTheme)

  // Follow the device while the choice is "system" (e.g. a phone switching to dark at night).
  useEffect(() => {
    const query = deviceQuery()
    const onChange = () => setDevice(query.matches ? 'light' : 'dark')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const theme = choice === 'system' ? device : choice

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    // The colour of the browser's toolbar on phones.
    const color = THEMES.find((t) => t.id === theme).background
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
  }, [theme])

  const value = useMemo(
    () => ({
      theme, // what is showing: "light" or "dark"
      choice, // what the person picked: "light", "dark" or "system"
      setChoice: (next) => {
        setChoice(next)
        try {
          if (next === 'system') localStorage.removeItem(STORAGE_KEY)
          else localStorage.setItem(STORAGE_KEY, next)
        } catch {
          // Not saved; the choice still works until the page is closed.
        }
      },
    }),
    [theme, choice],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside <ThemeProvider>')
  return value
}
