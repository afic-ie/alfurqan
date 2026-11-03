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
        timetable: resolve(__dirname, 'timetable/index.html'),
        about: resolve(__dirname, 'about/index.html'),
        services: resolve(__dirname, 'services/index.html'),
        project: resolve(__dirname, 'project/index.html'),
        donate: resolve(__dirname, 'donate/index.html'),
        contact: resolve(__dirname, 'contact/index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
  },
});
