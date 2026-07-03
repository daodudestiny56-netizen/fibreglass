import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { join } from 'node:path';

// ESM-safe __dirname equivalent (works on Windows too)
const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Resolve fiberglass-react directly from SDK source in dev
      // (avoids needing to build the library first)
      'fiberglass-react': join(__dirname, '../../packages/fiberglass-react/src/index.ts'),
    },
  },
  server: {
    port: 5173,
  },
});
