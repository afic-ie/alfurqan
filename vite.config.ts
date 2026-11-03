import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Builds one self-contained index.html (fonts, images and code inlined),
// so the app also works offline by just opening the file.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { outDir: 'dist', assetsInlineLimit: 100_000_000 },
});
