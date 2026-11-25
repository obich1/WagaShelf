// Tests for the theme switcher (#79): the first visit follows the device, a pick sticks, and the
// choice survives a reload. jsdom has no matchMedia, so each test says what the "device" prefers.
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ThemeMenu from './components/ThemeMenu'
import { ThemeProvider } from './theme'

function pretendDevicePrefers(scheme) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: scheme === 'light', addEventListener: () => {}, removeEventListener: () => {} })),
  )
}

const renderMenu = () =>
  render(
    <ThemeProvider>
      <ThemeMenu />
    </ThemeProvider>,
  )

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
  document.head.innerHTML = '<meta name="theme-color" content="#1b1512">'
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('theme switcher', () => {
  it('follows a light device on the first visit', () => {
    pretendDevicePrefers('light')
    renderMenu()
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('follows a dark device on the first visit', () => {
    pretendDevicePrefers('dark')
    renderMenu()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('applies and remembers a pick, whatever the device prefers', () => {
    pretendDevicePrefers('dark')
    renderMenu()

    fireEvent.click(screen.getByRole('button', { name: 'Theme' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Cream/ }))

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('wagashelf-theme')).toBe('light')
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe('#ece0ca')
    // The menu closes after a pick.
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('uses the saved pick on the next visit', () => {
    localStorage.setItem('wagashelf-theme', 'dark')
    pretendDevicePrefers('light')
    renderMenu()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('goes back to following the device with "Match my device"', () => {
    localStorage.setItem('wagashelf-theme', 'dark')
    pretendDevicePrefers('light')
    renderMenu()

    fireEvent.click(screen.getByRole('button', { name: 'Theme' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Match my device/ }))

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('wagashelf-theme')).toBeNull()
  })
})
