import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const mapboxToken = env.VITE_MAPBOX_TOKEN || env.MAPBOX_TOKEN || ''

  return {
    plugins: [react()],
    // Vercel blocks VITE_* as "sensitive" env vars. MAPBOX_TOKEN works at build time.
    define: {
      'import.meta.env.VITE_MAPBOX_TOKEN': JSON.stringify(mapboxToken),
    },
  }
})
