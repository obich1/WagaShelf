// Tests for searching your shelves (#34), on My Shelves and on a single shelf.
// Sign-in and the library are replaced with stand-ins, so only the pages themselves are tested.
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../auth', () => ({ useSession: () => ({ isLoaded: true, isSignedIn: true }) }))
vi.mock('../lib/useCurvedRow', () => ({ usePrefersReducedMotion: () => true, useCurvedRow: () => {} }))

const make = (id, title, media_type, creators, status = 'current') => ({
  id,
  status,
  progress: null,
  rating: null,
  notes: null,
  title: { source: 'anilist', source_id: String(id), title, media_type, creators, cover_url: null, total_units: null },
})
const library = {
  state: 'ready',
  error: null,
  reload: () => {},
  updateEntry: async () => ({}),
  entries: [
    make(1, 'One Piece', 'manga', ['Eiichiro Oda']),
    make(2, 'Frieren', 'anime', []),
    make(3, 'Frieren: Beyond Journey’s End', 'manga', ['Kanehito Yamada'], 'planning'),
    make(4, 'Dune', 'book', ['Frank Herbert']),
  ],
}
vi.mock('../library/LibraryContext', () => ({ useLibrary: () => library }))

import Shelf from './Shelf'
import Shelves from './Shelves'

function Where() {
  const { pathname, search } = useLocation()
  return <p data-testid="where">{pathname + search}</p>
}

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/shelves" element={<Shelves />} />
        <Route path="/shelf/:mediaType" element={<Shelf />} />
      </Routes>
      <Where />
    </MemoryRouter>,
  )
}

afterEach(cleanup)

describe('My Shelves search', () => {
  it('shows every shelf with no search, and a search box', () => {
    renderAt('/shelves')
    expect(screen.getByRole('searchbox', { name: 'Search your shelves' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Anime' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Books' })).toBeTruthy()
  })

  it('groups matches by shelf and hides shelves without any', () => {
    renderAt('/shelves?q=frieren')
    expect(screen.getByText('2 matches for “frieren”.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Anime' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Manga' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Books' })).toBeNull()
  })

  it('finds a title by its author, and the shelf link carries the search', () => {
    renderAt('/shelves?q=herbert')
    expect(screen.getByRole('link', { name: 'Books' }).getAttribute('href')).toBe('/shelf/book?q=herbert')
  })

  it('typing puts the search in the address, and clearing removes it', () => {
    renderAt('/shelves')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'one pi' } })
    expect(screen.getByTestId('where').textContent).toBe('/shelves?q=one+pi')
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.getByTestId('where').textContent).toBe('/shelves')
  })

  it('with no match, offers to search Discover for the same words', () => {
    renderAt('/shelves?q=zzz')
    expect(screen.getByText('Nothing on your shelves matches')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Search Discover for/ }).getAttribute('href')).toBe('/discover?q=zzz')
  })
})

describe('a single shelf search', () => {
  it('filters the shelf and the status counts follow the search', () => {
    renderAt('/shelf/manga?q=frieren')
    expect(screen.getAllByRole('link', { name: 'Frieren: Beyond Journey’s End' }).length).toBeGreaterThan(0)
    expect(screen.queryByText('One Piece')).toBeNull()
    expect(screen.getByRole('button', { name: /^All 1$/ })).toBeTruthy()
  })

  it('keeps the search when a status chip is chosen', () => {
    renderAt('/shelf/manga?q=frieren')
    fireEvent.click(screen.getByRole('button', { name: /Plan to read/ }))
    expect(screen.getByTestId('where').textContent).toBe('/shelf/manga?q=frieren&status=planning')
  })

  it('with no match, offers Discover in the same category', () => {
    renderAt('/shelf/manga?q=zzz')
    expect(screen.getByRole('link', { name: /Search Discover for/ }).getAttribute('href')).toBe('/discover?q=zzz&category=manga')
  })
})
