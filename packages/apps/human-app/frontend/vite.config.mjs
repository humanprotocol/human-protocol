import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
const config = defineConfig({
  plugins: [
    react(),
    svgr({
      include: '**/*.svg',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
  },
  server: {
    host: '127.0.0.1',
    port: 3001,
  },
  optimizeDeps: {
    include: [
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material/Tooltip',
      '@mui/material/Paper',
    ],
  },
});

export default config;
