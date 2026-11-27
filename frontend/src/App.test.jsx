// Render test (#41): draws the whole app in a simulated browser (jsdom) and checks that the page
// isn't blank. It would have caught the November 7 bug, when AuthProvider rendered ClerkProvider
// without {children} and the site went blank, although lint and build both passed.
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Pretend sign-in is configured, so AuthProvider really goes through ClerkProvider.
// (Without a key it skips Clerk entirely, and the blank-site bug couldn't happen.)
vi.mock('./config', () => ({
  API_URL: 'http://api.test',
  CLERK_PUBLISHABLE_KEY: 'pk_test_render_test',
}))

// A stand-in for Clerk, so the test runs offline. Its ClerkProvider shows exactly the children
// it's given: if AuthProvider ever forgets to pass {children} again, the page comes out empty
// and this test fails.
// Like real Clerk, useAuth hands back the same getToken function every time: the library reloads
// whenever getToken changes, so a new function on every render would make it reload forever.
vi.mock('@clerk/react', () => {
  const getToken = async () => null
  return {
    ClerkProvider: ({ children }) => children ?? null,
    useAuth: () => ({ isLoaded: true, isSignedIn: false, getToken }),
    useUser: () => ({ user: null }),
    SignInButton: ({ children }) => children,
    UserButton: () => null,
  }
})

import Root from './Root'

beforeEach(() => {
  window.location.hash = '#/'
  // jsdom can't scroll; ScrollRestoration calls it on every page change.
  window.scrollTo = () => {}
  // jsdom has no matchMedia either; the theme switcher asks the device for its colour scheme.
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }))
  // No real network in tests: any API call gets an empty, successful answer.
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ results: [], unavailable_sources: [] }))))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('the app renders', () => {
  it('shows the header and the main navigation', () => {
    render(<Root />)

    expect(screen.getByRole('link', { name: 'WagaShelf home' })).toBeTruthy()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    for (const page of ['Home', 'Discover', 'My Shelves']) {
      expect(nav.textContent).toContain(page)
    }
  })

  it('shows the home page content, not a blank page', () => {
    render(<Root />)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/cozy shelf/i)
  })
})
