import { describe, expect, it } from 'vitest'

import { filterEntries } from './search'

const entry = (title, creators = []) => ({ title: { title, creators } })
const entries = [
  entry('One Piece', ['Eiichiro Oda']),
  entry('Pokémon Adventures', ['Hidenori Kusaka']),
  entry('Frieren: Beyond Journey’s End', ['Kanehito Yamada']),
  entry('Dune', ['Frank Herbert']),
]
const titles = (list) => list.map((e) => e.title.title)

describe('filterEntries', () => {
  it('keeps everything for an empty or blank search', () => {
    expect(filterEntries(entries, '')).toHaveLength(4)
    expect(filterEntries(entries, '   ')).toHaveLength(4)
  })

  it('matches part of a title, ignoring case', () => {
    expect(titles(filterEntries(entries, 'PIECE'))).toEqual(['One Piece'])
  })

  it('ignores accents in both directions', () => {
    expect(titles(filterEntries(entries, 'pokemon'))).toEqual(['Pokémon Adventures'])
    expect(titles(filterEntries(entries, 'pokémon'))).toEqual(['Pokémon Adventures'])
  })

  it('matches authors and creators', () => {
    expect(titles(filterEntries(entries, 'herbert'))).toEqual(['Dune'])
  })

  it('needs every word, in any order, across title and creators', () => {
    expect(titles(filterEntries(entries, 'oda piece'))).toEqual(['One Piece'])
    expect(filterEntries(entries, 'oda dune')).toEqual([])
  })

  it('copes with titles that have no creators listed', () => {
    expect(filterEntries([{ title: { title: 'Solo' } }], 'solo')).toHaveLength(1)
  })
})
