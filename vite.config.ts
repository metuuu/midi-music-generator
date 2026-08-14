/**
 * Eight pages, not one.
 *
 * The dev server finds any HTML file by path on its own, so this exists only
 * for `vite build` — which defaults to `index.html` alone and would silently
 * ship a bundle with no radio, no voice lab, no mix lab, no concert, no model
 * bench and no costume bench in it.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

import {
  AT_EASE_FILE, SAVE_ROUTE, readTuning, writeTables,
} from './src/web/concert/at-ease-edit.js';

// `__dirname` does not exist here: package.json says `"type": "module"`, so
// Vite loads this config as ESM.
const here = (file: string) => fileURLToPath(new URL(file, import.meta.url));

/**
 * The dev server's half of the model bench's idle tuner.
 *
 * The bench can put a player at ease and drag the pose around with a gizmo, and
 * the numbers it is dragging are two tables in `at-ease.ts`. This is what turns
 * its save button into an edit: the page posts the tables, `readTuning` refuses
 * anything that is not numbers, and `writeTables` puts them back into the file
 * without disturbing the prose around them. HMR then reloads the page from the
 * source it just wrote, which is the check that the save was real.
 *
 * **`apply: 'serve'`.** A production bundle has no business carrying a route
 * that writes files, and there is nowhere for it to write to. Nothing here
 * exists under `vite build`.
 *
 * Bounded on purpose: one route, one file, no path in the request. What can be
 * changed is which numbers are in two named tables, and that is the whole of it.
 */
function idleTuning(): Plugin {
  const file = here(AT_EASE_FILE);
  return {
    name: 'idle-tuning',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(SAVE_ROUTE, (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('POST only');
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          try {
            const tuning = readTuning(JSON.parse(Buffer.concat(chunks).toString('utf8')));
            writeFileSync(file, writeTables(readFileSync(file, 'utf8'), tuning));
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: true, file: AT_EASE_FILE }));
          } catch (e) {
            res.statusCode = 400;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: String(e) }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [idleTuning()],
  // Without this, `/concert` falls through to `index.html` (SPA fallback).
  // With it, `/concert` resolves to `concert.html` — same for every page.
  appType: 'mpa',
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
        studio: here('index.html'),
        radio: here('radio.html'),
        voice: here('voice.html'),
        mix: here('mix.html'),
        concert: here('concert.html'),
        models: here('models.html'),
        looks: here('looks.html'),
        bench: here('bench.html'),
      },
    },
  },
});
