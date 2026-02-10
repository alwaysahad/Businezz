import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['invoice-icon.svg', 'fonts/**/*.woff2'],
      manifest: {
        name: 'Businezz - Smart Invoice Generator',
        short_name: 'Businezz',
        description: 'Create and manage professional invoices offline',
        theme_color: '#0a1929',
        background_color: '#0a1929',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/invoice-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        globIgnores: ['**/node_modules/**/*'],
        runtimeCaching: [
          {
            // Cache Supabase API calls
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html'
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Data fetching and state management
          'react-query': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          // Supabase client
          'supabase': ['@supabase/supabase-js'],
          // UI libraries
          'ui-libs': ['lucide-react', 'jspdf', 'html2canvas', 'jspdf-autotable'],
          // Date utilities
          'date-utils': ['date-fns'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    // Enable source maps for better debugging
    sourcemap: false,
  },
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        format: 'es',
      },
    },
  },
  // Optimize dev server
  server: {
    port: 5173,
    strictPort: false,
    open: false,
  },
  // Enable dependency pre-bundling for faster dev startup
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'lucide-react',
    ],
  },
});
