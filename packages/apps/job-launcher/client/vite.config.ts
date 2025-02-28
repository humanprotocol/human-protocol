/// <reference types="vitest" />
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
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  worker: {
    plugins: [react()],
  },
  resolve: {
    alias: [{ find: 'src', replacement: path.resolve(__dirname, 'src') }],
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    passWithNoTests: true,
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
    port: 3005,
  },
});
