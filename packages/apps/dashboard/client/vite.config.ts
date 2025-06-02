import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';
import svgr from 'vite-plugin-svgr';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

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
