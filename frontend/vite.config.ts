import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward API calls to the FastAPI backend during development, so the
    // frontend can simply call "/api/..." without worrying about ports or CORS.
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
