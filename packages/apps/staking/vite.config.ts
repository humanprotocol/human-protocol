/// <reference types="vite/client" />

import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({ fastRefresh: false }),
    nodePolyfills({
      protocolImports: true,
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        implementation: require('sass'),
      },
    },
  },
  resolve: {
    alias: [{ find: 'src', replacement: path.resolve(__dirname, 'src') }],
  },
  optimizeDeps: {
    include: ['@human-protocol/sdk'],
    force: true,
  },
  build: {
    commonjsOptions: {
      include: [/core/, /human-protocol-sdk/, /node_modules/],
    },
  },
  server: {
    port: 3005,
  },
});
