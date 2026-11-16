import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore Plain Node module is shared with the production HTTP/serverless handlers.
import { mediaCatalogPlugin } from './server/catalog.mjs'

export default defineConfig({
  plugins: [react(),mediaCatalogPlugin()],
  server: { port: 3000, strictPort: true },
})
