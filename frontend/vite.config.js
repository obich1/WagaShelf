import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // Relative paths, so the built app works at any address: at the root of a site
  // (https://waga-shelf.vercel.app/) or in a folder (as it did on GitHub Pages).
  base: './',
  // Tests (npm test) run in jsdom, a simulated browser, so components can be rendered without one.
  test: {
    environment: 'jsdom',
  },
})
