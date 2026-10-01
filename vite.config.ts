/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// VITE_BASE_PATH must start and end with "/".
//   local dev:      unset            -> "/"
//   inmydna.com:    "/chromasome/"
//   GitHub Pages:   "/<repo-name>/"  (set by .github/workflows/deploy.yml)
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
