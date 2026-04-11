import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
