import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // Relative paths, so the built app works at any address
  // (e.g. https://obich1.github.io/WagaShelf/ on GitHub Pages).
  base: './',
})
