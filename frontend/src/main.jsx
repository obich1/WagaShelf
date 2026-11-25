import { createRoot } from 'react-dom/client'

import './index.css'
import Root from './Root'

createRoot(document.getElementById('root')).render(<Root />)

// Register the service worker, which makes WagaShelf installable as an app (PWA).
// Only in the built app: during development it would cache files you're still changing.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => console.error('Service worker failed:', error))
  })
}
