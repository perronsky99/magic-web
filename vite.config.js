import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const pathResolve = (p) => resolve(__dirname, p)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': pathResolve('src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: pathResolve('index.html'),
        favicon: pathResolve('public/favicon.ico')
      }
    }
  }
})