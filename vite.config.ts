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
        includeAssets: ['icon.png'],
          manifest: {
            name: 'Seabra Pressão Pro',
            short_name: 'Pressão Pro',
            description: 'Aplicativo para monitoramento de pressão arterial',
            theme_color: '#18181b',
            background_color: '#09090b',
            display: 'standalone',
            icons: [
              {
                src: 'https://img.icons8.com/fluency/192/blood-pressure.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'https://img.icons8.com/fluency/512/blood-pressure.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: 'https://img.icons8.com/fluency/512/blood-pressure.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
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
