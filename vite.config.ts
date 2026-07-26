/**
 * Two pages, not one.
 *
 * The dev server finds any HTML file by path on its own, so this exists only
 * for `vite build` — which defaults to `index.html` alone and would silently
 * ship a bundle with no voice lab in it.
 */

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// `__dirname` does not exist here: package.json says `"type": "module"`, so
// Vite loads this config as ESM.
const here = (file: string) => fileURLToPath(new URL(file, import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        radio: here('index.html'),
        voice: here('voice.html'),
      },
    },
  },
});
