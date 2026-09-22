import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // local dev: the API runs on :4000 (see yumero-backend); production is same-origin behind Caddy
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: false },
      "/uploads": { target: "http://localhost:4000", changeOrigin: false },
    },
  },
})
