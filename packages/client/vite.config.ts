import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const sharedSrc = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../shared/src/index.ts'
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@fodinha/shared': sharedSrc,
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        configure: (proxy) => {
          proxy.on('error', () => { /* suppress ECONNRESET on disconnect */ });
        },
      },
    },
  },
});
