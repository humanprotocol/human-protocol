import * as path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      include: '**/*.svg',
      exclude: 'src/assets/icons/excluded/**/*.svg',
    }),
    nodePolyfills({
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['@human-protocol/sdk'],
  },
  build: {
    commonjsOptions: {
      include: [/core/, /human-protocol-sdk/, /node_modules/],
    },
  },
  server: {
    port: 3004,
  },
});
