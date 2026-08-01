/**
 * Five pages, not one.
 *
 * The dev server finds any HTML file by path on its own, so this exists only
 * for `vite build` — which defaults to `index.html` alone and would silently
 * ship a bundle with no voice lab, no concert and no model bench in it.
 */

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// `__dirname` does not exist here: package.json says `"type": "module"`, so
// Vite loads this config as ESM.
const here = (file: string) => fileURLToPath(new URL(file, import.meta.url));

export default defineConfig({
  /**
   * One copy of three.js, not two.
   *
   * `three/examples/jsm/*` imports `three` by bare specifier, and Vite's dep
   * pre-bundling can resolve that to a second instance. Two copies means two
   * separate class identities, so `instanceof Mesh` starts returning false for
   * objects built by the other half and the failures are baffling.
   */
  resolve: { dedupe: ['three'] },
  build: {
    rollupOptions: {
      input: {
        radio: here('index.html'),
        voice: here('voice.html'),
        concert: here('concert.html'),
        models: here('models.html'),
        bench: here('bench.html'),
      },
    },
  },
});
