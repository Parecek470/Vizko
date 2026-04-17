import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Tells Vite to listen on all IP addresses (0.0.0.0)
    port: 5173,
    watch: {
      usePolling: true, // Forces Vite to actively check for saved files
    }
  }
})
