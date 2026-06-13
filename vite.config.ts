import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const isVercel = Boolean(process.env.VERCEL);

export default defineConfig({
  plugins: [react()],
  root: 'frontend',
  base: isVercel ? '/' : './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'frontend'),
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5175,
    proxy: {
      '/api': {
        target: 'http://localhost:3847',
        changeOrigin: true,
      },
    },
  },
});
