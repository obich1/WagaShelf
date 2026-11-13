import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createHashRouter } from 'react-router-dom'

import App from './App'
import { AuthProvider } from './auth'
import './index.css'
import { LibraryProvider } from './library/LibraryContext'

// The router uses "hash" URLs: the page lives in the part after "#", e.g. /WagaShelf/#/discover.
// GitHub Pages only serves real files, so this avoids 404 errors when refreshing a page.
// createHashRouter (a "data router") instead of <HashRouter> so that <ScrollRestoration> in App works.
// Every path goes to App, which picks the page with its own <Routes>.
const router = createHashRouter([{ path: '*', element: <App /> }])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <LibraryProvider>
        <RouterProvider router={router} />
      </LibraryProvider>
    </AuthProvider>
  </StrictMode>,
)

// Register the service worker, which makes WagaShelf installable as an app (PWA).
// Only in the built app: during development it would cache files you're still changing.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => console.error('Service worker failed:', error))
  })
}
