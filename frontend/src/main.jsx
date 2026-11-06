import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'

import App from './App'
import { AuthProvider } from './auth'
import './index.css'
import { LibraryProvider } from './library/LibraryContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* HashRouter keeps the page in the part of the URL after "#", e.g. /WagaShelf/#/discover.
        GitHub Pages only serves real files, so this avoids 404 errors when refreshing a page. */}
    <HashRouter>
      <AuthProvider>
        <LibraryProvider>
          <App />
        </LibraryProvider>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)

// Register the service worker, which makes WagaShelf installable as an app (PWA).
// Only in the built app: during development it would cache files you're still changing.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => console.error('Service worker failed:', error))
  })
}
