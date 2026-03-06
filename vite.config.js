import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
  },

  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom'],
          'vendor-charts':   ['recharts'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'pages-analytics': ['./src/components/Analytics', './src/components/pages/Insights'],
          'pages-tools':     ['./src/components/pages/RiskCalculator', './src/components/pages/TradingCalendar'],
          'pages-review':    ['./src/components/pages/Review', './src/components/pages/Playbook'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
})