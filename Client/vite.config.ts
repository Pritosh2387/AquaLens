import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      // Allow serving files from one level up to access Server/data/processed
      allow: ['..'],
    },
  },
  // Expose Server/data/processed as /data/processed at build time
  publicDir: 'public',
})
