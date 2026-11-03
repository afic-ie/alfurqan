import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Multi-page static site. Relative base so it works on GitHub Pages
// (/alfurqan/) and later on a custom domain without changes.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
  },
});
