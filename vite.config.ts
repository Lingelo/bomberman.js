import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: '/bomberman.js/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 4200,
    open: true,
  },
});
