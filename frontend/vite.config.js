import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',

      includeAssets: [
        'favicon.svg',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable-512x512.png',
      ],

      manifest: {
        name: 'FarmXnap',
        short_name: 'FarmXnap',
        description: 'AI crop disease detection for Nigerian farmers — Xnap it. Know it. Fix it.',
        theme_color: '#0A1F0F',
        background_color: '#0A1F0F',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'en',
        categories: ['agriculture', 'utilities', 'productivity'],

        icons: [
          // Standard icon — 192x192 required for Android install
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          // Standard icon — 512x512 required for splash screen
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          // Maskable icon — separate file, purpose MUST be only 'maskable'
          // Chrome requires this to show the install prompt on Android
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],

        shortcuts: [
          {
            name: 'Scan a crop',
            short_name: 'Scan',
            description: 'Instantly diagnose a crop disease',
            url: '/scan',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'My dashboard',
            short_name: 'Dashboard',
            description: 'View your farm health and scan history',
            url: '/dashboard',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Track order',
            short_name: 'Orders',
            description: 'Check your treatment delivery status',
            url: '/order-tracking',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
        ],

        screenshots: [
          {
            src: '/screenshot-mobile.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'FarmXnap crop diagnosis screen',
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // Offline fallback page
        navigateFallback: null,
        offlineGoogleAnalytics: false,
        additionalManifestEntries: [
          { url: '/offline.html', revision: '1' }
        ],

        runtimeCaching: [
          {
            // Never cache any external requests — always hit the network directly
            // This covers the API (via VITE_API_URL), Interswitch, fonts, maps, etc.
            urlPattern: ({ url }) => url.origin !== self.location.origin,
            handler: 'NetworkOnly',
          },
        ],
      },

      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],
})