/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The generator, on a thread of its own.
 *
 * Everything under `src/generate/` and `src/concert/` is pure, deterministic and
 * browser-free — it runs headless under `tsx` for every check in this repo, it
 * never samples a clock, and `Math.random` appears nowhere in it. That is the
 * entire precondition for a worker, and it was true long before anybody wanted
 * one. So this file is short on purpose: it is a switchboard, and the reason it
 * can be is that nothing it calls had to be changed to run here.
 *
 * What it is *for* is the main thread. Writing a song is 21–144 ms and a whole
 * evening about 235 ms, and on the radio that landed between pressing Next and
 * hearing anything while the page sat still. On the stage it landed in the
 * middle of a number, eight beats after a tomato, on a scene animating at 60 fps.
 * Neither is a correctness problem and both are the difference between an app
 * that feels alive and one that hitches.
 *
 * **What stays on the main thread, and why it is not an oversight.** Turning a
 * `Song` into a Strudel pattern cannot come here: `evaluate` builds objects
 * bound to the `AudioContext` and the scheduler, and neither exists on a worker.
 * Rendering the pattern *text* could, and does not — it is 2–8 ms for a whole
 * song against the 20–141 ms of evaluating it, so moving it would buy noise and
 * cost this file an import of `web/sung-voice.ts`, which reaches straight into
 * `@strudel/webaudio`. See `render/strudel.ts` for what the text is split into
 * and `web/audio.ts` for what is done with it.
 *
 * The protocol is a request id and a discriminated `kind`, because two presses
 * of Next in quick succession must not have their answers swapped. Payloads go
 * by structured clone — a `ConcertNumber` is 41–149 KB and clones in under a
 * millisecond, so there is nothing to be gained by transferring buffers and a
 * great deal of legibility to be lost.
 */

import { buildConcert, revoiceNumber } from '../concert/index.js';
import type { ConcertNumber, ConcertOptions } from '../concert/types.js';
import type { LayerId, Song } from '../core/types.js';
import { generateSong, type GenerateOptions } from '../generate/song.js';

/** Everything the worker can be asked for. */
export type GenerateRequest =
  | { id: number; kind: 'song'; options: GenerateOptions }
  | { id: number; kind: 'concert'; options: ConcertOptions }
  | { id: number; kind: 'revoice'; number: ConcertNumber; layer: LayerId; attempt: number };

export type GenerateResponse =
  | { id: number; ok: true; result: unknown }
  | { id: number; ok: false; error: string };

/**
 * Do the work named by one request.
 *
 * Exported so the main thread can run it directly when a worker cannot be
 * built — see `runInline` in `generator.ts`. One implementation, two places to
 * run it, which is the only way the fallback stays honest about what it does.
 */
export function serve(req: GenerateRequest): Song | ReturnType<typeof buildConcert> | ConcertNumber {
  switch (req.kind) {
    case 'song': return generateSong(req.options);
    case 'concert': return buildConcert(req.options);
    case 'revoice': return revoiceNumber(req.number, req.layer, req.attempt);
  }
}

// A worker scope has `postMessage` at the top level; a module imported by the
// main thread for `serve` does not, and must not start listening.
if (typeof self !== 'undefined' && typeof (self as unknown as Worker).postMessage === 'function'
  && typeof (globalThis as { window?: unknown }).window === 'undefined') {
  self.onmessage = (e: MessageEvent<GenerateRequest>) => {
    const req = e.data;
    try {
      const result = serve(req);
      const response: GenerateResponse = { id: req.id, ok: true, result };
      self.postMessage(response);
    } catch (err) {
      // The message rather than the `Error`: a thrown value is not always
      // cloneable, and a worker that dies reporting a failure reports nothing.
      const response: GenerateResponse = {
        id: req.id, ok: false, error: err instanceof Error ? err.message : String(err),
      };
      self.postMessage(response);
    }
  };
}
