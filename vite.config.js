import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const base = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'http://localhost:10000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './client/test/setup.js',
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
