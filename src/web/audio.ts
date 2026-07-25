/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The Strudel playback layer — the entire AGPL surface of this project.
 *
 * Everything else (theory, styles, generator, MIDI renderer) is independent and
 * MIT-licensed. If the licence ever becomes a problem, this file and
 * `render/strudel.ts` are what you delete.
 *
 * We deliberately build the REPL from the granular packages instead of using
 * the convenience bundle `@strudel/web`. That bundle inlines its own copy of
 * `@strudel/core` and `@strudel/webaudio`, so `registerSoundfonts()` — which
 * imports the standalone copies — would register the `gm_*` instruments into a
 * registry the player never consults. The symptom is subtle and easy to miss:
 * drums play, every melodic instrument is silent.
 */

import { evalScope, type StrudelRepl } from '@strudel/core';
import {
  initAudioOnFirstClick,
  registerSynthSounds,
  samples,
  webaudioRepl,
} from '@strudel/webaudio';
import { transpiler } from '@strudel/transpiler';
import { registerSoundfonts } from '@strudel/soundfonts';

import { DRUM_SAMPLES_URL } from '../render/strudel.js';

let instance: StrudelRepl | undefined;
let booting: Promise<StrudelRepl> | undefined;

/**
 * Start loading immediately. `initAudioOnFirstClick` registers a `mousedown`
 * listener synchronously and resolves when it fires, so it has to be called
 * before the user can reach the Play button — otherwise it waits for the
 * *next* click and the first press appears to do nothing.
 */
export function initAudio(): Promise<StrudelRepl> {
  if (instance) return Promise.resolve(instance);
  if (!booting) booting = boot();
  return booting;
}

async function boot(): Promise<StrudelRepl> {
  const audioReady = initAudioOnFirstClick();

  // Make the pattern vocabulary (note, s, stack, sound, …) available to
  // evaluated code.
  await evalScope(
    import('@strudel/core'),
    import('@strudel/mini'),
    import('@strudel/tonal'),
    import('@strudel/webaudio'),
  );

  await audioReady;

  // Creating the repl also injects setcpm/setcps into the eval scope, which the
  // generated code relies on.
  const repl = webaudioRepl({ transpiler });

  registerSynthSounds();
  registerSoundfonts();
  await samples(DRUM_SAMPLES_URL);

  instance = repl;
  return repl;
}

export async function playCode(code: string): Promise<void> {
  const repl = await initAudio();
  await repl.evaluate(code);
}

export async function stopPlayback(): Promise<void> {
  if (instance) instance.stop();
}
