// The signed-in user's library, loaded once and shared by every page.
// Home, the shelves and the title pages all read from here, so they always agree,
// and a change made on one page shows up everywhere without reloading.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useApi } from '../api/client'
import { useSession } from '../auth'

const LibraryContext = createContext(null)

export function LibraryProvider({ children }) {
  const { isLoaded, isSignedIn } = useSession()
  const api = useApi()
  const [entries, setEntries] = useState([])
  const [state, setState] = useState('idle') // idle | loading | ready | error
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      setEntries(await api('/library'))
      setState('ready')
    } catch (err) {
      setError(err.message)
      setState('error')
    }
  }, [api])

  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn) {
      reload()
    } else {
      setEntries([])
      setState('idle')
    }
  }, [isLoaded, isSignedIn, reload])

  const addTitle = useCallback(
    async (title, details = {}) => {
      const entry = await api('/library', {
        method: 'POST',
        body: { source: title.source, source_id: title.source_id, ...details },
      })
      setEntries((current) => [entry, ...current])
      return entry
    },
    [api],
  )

  const updateEntry = useCallback(
    async (id, changes) => {
      const updated = await api(`/library/${id}`, { method: 'PATCH', body: changes })
      // Most recently updated first, the same order the API uses.
      setEntries((current) => [updated, ...current.filter((entry) => entry.id !== id)])
      return updated
    },
    [api],
  )

  const removeEntry = useCallback(
    async (id) => {
      await api(`/library/${id}`, { method: 'DELETE' })
      setEntries((current) => current.filter((entry) => entry.id !== id))
    },
    [api],
  )

  const entryFor = useCallback(
    (source, sourceId) =>
      entries.find((entry) => entry.title.source === source && entry.title.source_id === sourceId) || null,
    [entries],
  )

  const value = useMemo(
    () => ({ entries, state, error, reload, addTitle, updateEntry, removeEntry, entryFor }),
    [entries, state, error, reload, addTitle, updateEntry, removeEntry, entryFor],
  )
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const library = useContext(LibraryContext)
  if (!library) throw new Error('useLibrary must be used inside <LibraryProvider>')
  return library
}
