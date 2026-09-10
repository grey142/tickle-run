import { defineConfig } from 'vite';

// GitHub Pages project site: https://grey142.github.io/tickle-run/
export default defineConfig({
  base: '/tickle-run/',
  server: { port: 5173, host: true },
  build: { outDir: 'dist', sourcemap: true },
});
