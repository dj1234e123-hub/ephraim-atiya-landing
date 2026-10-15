import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// שלושה עמודים: דף הנחיתה, /terms/ (תנאי מסירה ושירות) ו-/accessibility/ (נגישות ופרטיות).
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        terms: resolve(__dirname, 'terms/index.html'),
        accessibility: resolve(__dirname, 'accessibility/index.html'),
      },
    },
  },
})
