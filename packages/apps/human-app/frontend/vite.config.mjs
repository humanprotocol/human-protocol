import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

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
  test: {
    environment: 'jsdom',
    globals: true,
    includeSource: ['./src/**/*.{ts,tsx}'],
    setupFiles: ['./src/setup-tests.ts/'],
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

// eslint-disable-next-line import/no-default-export -- export vite config
export default config;
