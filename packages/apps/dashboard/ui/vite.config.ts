/// <reference types="vitest" />
/// <reference types="vite/client" />
import * as fs from 'fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import * as dotenv from 'dotenv';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import generateMerkleTree from './scripts/generateMerkleTree';

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
      {
        name: 'generate-merkle-tree',
        apply: 'build',
        async writeBundle() {
          const merkleTreeJson = await generateMerkleTree(
            mode === 'development'
              ? 'localhost'
              : 'dashboard.humanprotocol.org',
            process.env.VITE_APP_NFT_STORAGE_API as string
          );

          const indexPath = path.resolve(__dirname, './dist/index.html');
          const indexContent = fs.readFileSync(indexPath, 'utf-8');
          const newIndexContent = indexContent.replace(
            '<script id="binary-transparency-manifest" type="application/json"></script>',
            `<script id="binary-transparency-manifest" type="application/json">${merkleTreeJson}</script>`
          );
          fs.writeFileSync(indexPath, newIndexContent);
        },
      },
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
