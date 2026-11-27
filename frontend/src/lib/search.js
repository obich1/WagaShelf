// Searching your own shelves (#34). It runs in the browser on the library that is already loaded,
// so typing never waits for the server.

// Lower case, and accents removed, so "Pokemon" finds "Pokémon" and "Kuroshitsuji" finds "Kuroshitsuji".
export function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

// Every word you typed has to appear somewhere in the title or in the creators (authors), in any
// order: "oda piece" finds One Piece by Eiichiro Oda. An empty search keeps everything.
export function filterEntries(entries, query) {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return entries
  return entries.filter(({ title }) => {
    const haystack = normalize([title.title, ...(title.creators ?? [])].join(' '))
    return words.every((word) => haystack.includes(word))
  })
}
