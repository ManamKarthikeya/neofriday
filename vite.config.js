import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'NeoFriday',
        short_name: 'NeoFriday',
        description: 'AI E-Commerce Generator',
        theme_color: '#121212',
        background_color: '#121212',
        display: 'standalone',
        icons: [
          {
            src: 'https://res.cloudinary.com/dmdrn1bge/image/upload/v1779031156/Create_a_premium_futuristic_AI_202605172048_a3kbgr.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: 'https://res.cloudinary.com/dmdrn1bge/image/upload/v1779031156/Create_a_premium_futuristic_AI_202605172048_a3kbgr.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api/nvidia': {
        target: 'https://integrate.api.nvidia.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nvidia/, '')
      }
    }
  }
})
