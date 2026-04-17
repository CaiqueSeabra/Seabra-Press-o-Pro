import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  console.log("VITE CONFIG process.env.GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "EXISTS" : "UNDEFINED");
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script',
        includeAssets: ['icon.png', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/i\.postimg\.cc\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'external-images',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        manifest: {
          id: 'seabra-pressao-pro-stable-v1',
          name: 'Seabra Pressão Pro',
          short_name: 'Pressão Pro',
          description: 'Acompanhamento profissional de pressão arterial com tecnologia Seabra.',
          theme_color: '#18181b',
          background_color: '#09090b',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          categories: ['medical', 'health', 'fitness'],
          prefer_related_applications: false,
          icons: [
            {
              src: '/icon.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          screenshots: [
            {
              src: 'https://i.postimg.cc/9MZYCDPN/Seabra.jpg',
              sizes: '1024x1024',
              type: 'image/jpeg',
              form_factor: 'narrow'
            },
            {
              src: 'https://i.postimg.cc/9MZYCDPN/Seabra.jpg',
              sizes: '1024x1024',
              type: 'image/jpeg',
              form_factor: 'wide'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
