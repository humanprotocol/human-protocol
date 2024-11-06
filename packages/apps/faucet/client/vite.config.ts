/// <reference types="vitest" />
/// <reference types="vite/client" />
import path from 'path';
import react from '@vitejs/plugin-react';
import * as dotenv from 'dotenv';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      nodePolyfills({
        // Whether to polyfill `node:` protocol imports.
        protocolImports: true,
      }),
    ],
    worker: {
      plugins: () => react(),
    },
    resolve: {
      alias: [
        { find: 'src', replacement: path.resolve(__dirname, 'src') },
        { find: 'tests', replacement: path.resolve(__dirname, 'tests') },
      ],
    },
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: './tests/setup.ts',
      coverage: {
        reporter: ['text', 'json', 'html'],
      },
    },
    optimizeDeps: {
      include: ['@human-protocol/sdk'],
    },
    build: {
      commonjsOptions: {
        include: [/human-protocol-sdk/, /node_modules/],
      },
    },
    server: {
      port: 3002,
    },
  };
});
