// Tests for quick add (#30): the button on a cover, its status picker, and Undo.
// The library and sign-in are replaced with simple stand-ins, so only QuickAdd itself is tested.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const session = { isLoaded: true, isSignedIn: true }
vi.mock('../auth', () => ({
  useSession: () => session,
  SignInLink: ({ children, className, ...props }) => (
    <button className={className} {...props}>
      {children}
    </button>
  ),
}))

let library
vi.mock('../library/LibraryContext', () => ({ useLibrary: () => library }))

import QuickAdd from './QuickAdd'
import { ToastProvider } from './Toast'

const title = { source: 'anilist', source_id: '1', media_type: 'anime', title: 'Frieren' }

function renderQuickAdd() {
  return render(
    <ToastProvider>
      <QuickAdd title={title} />
    </ToastProvider>,
  )
}

beforeEach(() => {
  session.isSignedIn = true
  library = {
    state: 'ready',
    entryFor: vi.fn(() => null),
    addTitle: vi.fn(async () => ({ id: 7 })),
    updateEntry: vi.fn(async () => ({})),
    removeEntry: vi.fn(async () => {}),
  }
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('quick add', () => {
  it('adds with the chosen status and shows a toast', async () => {
    renderQuickAdd()
    fireEvent.click(screen.getByRole('button', { name: 'Quick add Frieren' }))
    fireEvent.click(screen.getByRole('button', { name: 'Watching' }))

    await waitFor(() => expect(library.addTitle).toHaveBeenCalledWith(title, { status: 'current' }))
    expect(await screen.findByText(/Added “Frieren” to Anime/)).toBeTruthy()
  })

  it('"Just save" adds with no status', async () => {
    renderQuickAdd()
    fireEvent.click(screen.getByRole('button', { name: 'Quick add Frieren' }))
    fireEvent.click(screen.getByRole('button', { name: 'Just save' }))

    await waitFor(() => expect(library.addTitle).toHaveBeenCalledWith(title, {}))
  })

  it('Undo removes the title that was just added', async () => {
    renderQuickAdd()
    fireEvent.click(screen.getByRole('button', { name: 'Quick add Frieren' }))
    fireEvent.click(screen.getByRole('button', { name: 'Plan to watch' }))

    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }))

    await waitFor(() => expect(library.removeEntry).toHaveBeenCalledWith(7))
  })

  it('changes the status of a saved title, and Undo puts the old one back', async () => {
    library.entryFor = vi.fn(() => ({ id: 3, status: 'planning' }))
    renderQuickAdd()
    fireEvent.click(screen.getByRole('button', { name: /On your shelf: Plan to watch/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Completed' }))

    await waitFor(() => expect(library.updateEntry).toHaveBeenCalledWith(3, { status: 'completed' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    await waitFor(() => expect(library.updateEntry).toHaveBeenLastCalledWith(3, { status: 'planning' }))
  })

  it('removes a saved title, and Undo saves it again with its details', async () => {
    library.entryFor = vi.fn(() => ({ id: 3, status: 'current', progress: null, rating: null, notes: null }))
    renderQuickAdd()
    fireEvent.click(screen.getByRole('button', { name: /On your shelf/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    await waitFor(() => expect(library.removeEntry).toHaveBeenCalledWith(3))
    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    await waitFor(() =>
      expect(library.addTitle).toHaveBeenCalledWith(title, { status: 'current', progress: null, rating: null, notes: null }),
    )
  })

  it('asks before removing a title that has progress, a rating or notes', () => {
    library.entryFor = vi.fn(() => ({ id: 3, status: 'current', progress: 5, rating: null, notes: null }))
    vi.stubGlobal('confirm', vi.fn(() => false))
    renderQuickAdd()
    fireEvent.click(screen.getByRole('button', { name: /On your shelf/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    expect(window.confirm).toHaveBeenCalled()
    expect(library.removeEntry).not.toHaveBeenCalled()
  })

  it('a saved title shows its status under the card instead of a button on the cover', () => {
    library.entryFor = vi.fn(() => ({ id: 3, status: 'current' }))
    renderQuickAdd()

    expect(screen.queryByRole('button', { name: /Quick add/ })).toBeNull()
    expect(screen.getByRole('button', { name: /On your shelf: Watching/ }).textContent).toBe('✓ Watching')
  })

  it('Escape closes the picker', () => {
    renderQuickAdd()
    fireEvent.click(screen.getByRole('button', { name: 'Quick add Frieren' }))
    expect(screen.getByRole('group')).toBeTruthy()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('group')).toBeNull()
  })

  it('offers sign-in instead of the picker when signed out', () => {
    session.isSignedIn = false
    renderQuickAdd()

    expect(screen.getByRole('button', { name: 'Sign in to save Frieren' })).toBeTruthy()
    expect(screen.queryByRole('group')).toBeNull()
  })

  it('shows an error in the toast when saving fails', async () => {
    library.addTitle = vi.fn(async () => {
      throw new Error('The title catalogue can’t be reached right now')
    })
    renderQuickAdd()
    fireEvent.click(screen.getByRole('button', { name: 'Quick add Frieren' }))
    fireEvent.click(screen.getByRole('button', { name: 'Just save' }))

    expect(await screen.findByText(/can’t be reached/)).toBeTruthy()
  })
})
