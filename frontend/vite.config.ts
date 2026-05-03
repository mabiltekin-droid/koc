import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/banks': 'http://localhost:3000',
      '/solve': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    }
  }
})
