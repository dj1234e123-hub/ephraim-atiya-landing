import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// ארבעה עמודים: דף הנחיתה, /terms/ (תנאי מסירה ושירות), /accessibility/ (נגישות ופרטיות) ו-/journal/ (הדגמת היומן האישי).
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        terms: resolve(__dirname, 'terms/index.html'),
        accessibility: resolve(__dirname, 'accessibility/index.html'),
        journal: resolve(__dirname, 'journal/index.html'),
      },
    },
  },
})
