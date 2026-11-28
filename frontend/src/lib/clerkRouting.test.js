import { describe, expect, it } from 'vitest'

import { inAppPath } from './clerkRouting'

describe('inAppPath', () => {
  it('keeps only what comes after the #', () => {
    expect(inAppPath('/#/shelves')).toBe('/shelves')
    expect(inAppPath('/#/title/anilist/21')).toBe('/title/anilist/21')
  })

  it('keeps the search part of the page', () => {
    expect(inAppPath('/#/shelves?q=dune')).toBe('/shelves?q=dune')
  })

  it('turns an empty hash into the home page', () => {
    expect(inAppPath('/#')).toBe('/')
    expect(inAppPath('/#/')).toBe('/')
  })

  it('leaves an address without a # as it is', () => {
    expect(inAppPath('/')).toBe('/')
    expect(inAppPath('/discover')).toBe('/discover')
    expect(inAppPath('')).toBe('/')
  })
})
