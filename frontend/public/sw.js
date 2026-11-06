// WagaShelf's service worker: a small script the browser runs in the background.
// Having one (plus the web app manifest) is what makes WagaShelf installable as an app.
//
// Strategy: "network first" for the app's own files. The newest version is always used when
// online; if the network fails, the last saved copy is shown instead, so the app still opens.
// Requests to other sites (the API, Clerk, AniList covers) are left alone: shelf data
// must always come fresh from the server.

const CACHE = 'wagashelf-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  // Delete caches left by older versions of this file.
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('./'))),
  )
})
