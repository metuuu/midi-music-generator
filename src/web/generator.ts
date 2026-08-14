/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Asking the generator for music without stopping the page.
 *
 * The main thread's half of `generator-worker.ts`: one worker, kept for the life
 * of the page, and three promises over it. Everything here is about the seam
 * rather than the music — what happens while the answer is being written, and
 * what happens when it cannot be.
 *
 * **The worker is an optimisation, not a dependency.** If it cannot be built —
 * an environment without module workers, a blocked blob URL, a bundle served
 * somewhere that will not fetch it — every call here runs the identical function
 * inline and the page is exactly as correct and exactly as janky as it was
 * before this file existed. That is why `serve` is exported from the worker
 * module and called from both sides: a fallback that reimplemented the work
 * would be a second generator to keep in step, and the whole value of this
 * codebase is that there is one.
 */

import type { Concert, ConcertNumber, ConcertOptions } from '../concert/types.js';
import type { LayerId, Song } from '../core/types.js';
import type { GenerateOptions } from '../generate/song.js';
import { serve, type GenerateRequest, type GenerateResponse } from './generator-worker.js';

let worker: Worker | undefined;
/** Set once the construction has been tried, so a failure is not retried. */
let tried = false;
let nextId = 1;
const waiting = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

/**
 * The worker, or `undefined` if this page cannot have one.
 *
 * Built on first use rather than at import: a page that never generates
 * anything — and the concert opens on a programme that is nothing but a
 * bill — should not spend a thread and a module graph on the possibility.
 */
function ensureWorker(): Worker | undefined {
  if (tried) return worker;
  tried = true;
  try {
    worker = new Worker(new URL('./generator-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<GenerateResponse>) => {
      const pending = waiting.get(e.data.id);
      if (!pending) return;
      waiting.delete(e.data.id);
      if (e.data.ok) pending.resolve(e.data.result);
      else pending.reject(new Error(e.data.error));
    };
    /**
     * A dead worker fails every request it was holding, rather than leaving
     * them pending for ever.
     *
     * A promise that never settles is the worst failure available here: the
     * radio would sit on "Writing a song…" and the stage would leave a player
     * sulking for the rest of the number, both silently and neither with
     * anything in the console.
     */
    worker.onerror = () => {
      const held = [...waiting.values()];
      waiting.clear();
      worker?.terminate();
      worker = undefined;
      for (const p of held) p.reject(new Error('the generator worker stopped'));
    };
  } catch {
    worker = undefined;
  }
  return worker;
}

/**
 * A request before it is given an id.
 *
 * Written as a conditional so it distributes over the union — a plain
 * `Omit<GenerateRequest, 'id'>` collapses three shapes into their common
 * fields, which is one field and none of the ones that matter.
 */
type Unsent<T> = T extends { id: number } ? Omit<T, 'id'> : never;

function ask<T>(req: Unsent<GenerateRequest>): Promise<T> {
  const w = ensureWorker();
  // No worker, or one that has since died: do the work here. Same function.
  if (!w) return Promise.resolve(serve({ ...req, id: 0 } as GenerateRequest) as T);
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    waiting.set(id, { resolve: resolve as (v: unknown) => void, reject });
    w.postMessage({ ...req, id } as GenerateRequest);
  });
}

/** One song, off the main thread. */
export function generateSongAsync(options: GenerateOptions): Promise<Song> {
  return ask<Song>({ kind: 'song', options });
}

/** A whole evening — the set, the room, the cast, the choreography, the lights. */
export function buildConcertAsync(options: ConcertOptions): Promise<Concert> {
  return ask<Concert>({ kind: 'concert', options });
}

/**
 * One player's part, rewritten, while the number goes on playing.
 *
 * The call the whole file is for. It is 21–144 ms of generation plus a
 * choreography rebuild, and it lands eight beats after a tomato — in the middle
 * of a number, on a scene animating at 60 fps, with the audience watching the
 * player who was hit. Off the thread it is a message.
 *
 * The wait is not a cost here so much as the mechanic: the player is sulking,
 * and a sulk that runs a few frames long reads as sulking. See
 * `returnToPlaying` in `concert/show.ts`, which holds them out until this
 * resolves rather than to a fixed count of beats.
 */
export function revoiceNumberAsync(
  number: ConcertNumber, layer: LayerId, attempt: number,
): Promise<ConcertNumber> {
  return ask<ConcertNumber>({ kind: 'revoice', number, layer, attempt });
}

/** Whether the work is actually going somewhere else. For status text only. */
export function generatorIsThreaded(): boolean {
  return ensureWorker() !== undefined;
}
