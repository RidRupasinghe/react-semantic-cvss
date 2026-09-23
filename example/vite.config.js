import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Use the library source directly so edits in ../src hot-reload instantly
    alias: {
      'react-semantic-cvss': path.resolve(import.meta.dirname, '../src/index.ts')
    },
    // Make sure the library and the example share a single copy of these
    dedupe: ['react', 'react-dom', 'styled-components', 'semantic-ui-react']
  },
  css: {
    // semantic-ui-css contains an invalid selector; skip it instead of failing the build
    lightningcss: { errorRecovery: true }
  },
  server: {
    port: 3000
  }
});
