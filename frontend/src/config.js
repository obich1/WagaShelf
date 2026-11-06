// Settings that differ between your laptop and the live site.
// Vite reads them from frontend/.env.local (locally) or from the build environment (GitHub Actions).
// Only variables starting with VITE_ are included in the app, and everything here is public:
// never put a secret key in a VITE_ variable.

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''
