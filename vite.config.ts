import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // This ensures all routes fallback to index.html in development
    historyApiFallback: true,
  },
  preview: {
    // This handles SPA routing for preview mode
    historyApiFallback: true,
  }
})
