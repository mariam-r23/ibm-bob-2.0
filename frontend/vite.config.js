import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxies /api/* to graph-service (localhost:4100) during local dev so the
// frontend can just call fetch('/api/graph') without hardcoding a host.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4100',
        changeOrigin: true,
      },
    },
  },
});
