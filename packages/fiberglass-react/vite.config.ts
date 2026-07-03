/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/**/*'],
      exclude: ['src/__tests__/**/*'],
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'FiberglassReact',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      // Externalize peer dependencies — consumers supply them
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true,
    minify: false, // Unminified for hackathon — easier for judges to inspect
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/__tests__/**/*', 'src/lib/mockFixtures.ts'],
    },
  },
});
