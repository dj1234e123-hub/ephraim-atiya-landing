import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// שני עמודים: דף הנחיתה ו-/terms/ (תנאי מסירה ושירות).
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        terms: resolve(__dirname, 'terms/index.html'),
      },
    },
  },
})
