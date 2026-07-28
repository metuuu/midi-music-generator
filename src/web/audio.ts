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
  getAudioContext,
  initAudioOnFirstClick,
  registerSynthSounds,
  samples,
  superdough,
  webaudioRepl,
} from '@strudel/webaudio';
import { transpiler } from '@strudel/transpiler';
import { registerSoundfonts } from '@strudel/soundfonts';
/**
 * The soundfont-name → bank-list map, which the package exports only as the
 * default of this module. `list.mjs`, the one on the public entry point, opens
 * by saying it is not used any more.
 */
import GM_FONTS from '@strudel/soundfonts/gm.mjs';

import type { Envelope } from '../core/types.js';
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

/**
 * Compile a pattern and load it, without starting the clock.
 *
 * The pair to `startLoaded`, and the two exist because a stage needs to decide
 * *when* bar one happens. `playCode` compiles and starts in one call, so the
 * downbeat lands whenever the transpiler happens to finish — tens of
 * milliseconds of variance, on the frame the audience is watching a drummer
 * lift their sticks. Loading behind the curtain and starting on the cue costs
 * nothing and puts the first click exactly where the show asked for it.
 */
export async function loadCode(code: string): Promise<void> {
  const repl = await initAudio();
  await repl.evaluate(code, false);
}

/**
 * Start the loaded pattern, from cycle 0.
 *
 * The scheduler zeroes its cycle counter here, which is the other half of why
 * the concert stops between numbers: `<a b c>` indexes the *global* cycle, so
 * a song evaluated onto a running clock starts somewhere in its middle. See
 * `web/concert/transport.ts`.
 */
export async function startLoaded(): Promise<void> {
  const repl = await initAudio();
  await repl.start();
}

export async function stopPlayback(): Promise<void> {
  if (instance) instance.stop();
}

/** One struck note, for the bench. See `playNote`. */
export interface NoteRequest {
  /** Soundfont name, e.g. `gm_vibraphone`. */
  sound: string;
  /**
   * Which of that program's soundfonts to use — an index into `soundfontsFor`,
   * wrapped modulo the list length by Strudel. Absent means the first, which is
   * what the song renderer always gets, since it never emits `.n()`.
   */
  bank?: number;
  midi: number;
  /** Seconds from now. */
  when?: number;
  /** Seconds the key is held down. What happens after that is `envelope`. */
  duration: number;
  gain: number;
  envelope: Envelope;
}

/**
 * Play a single note, now-ish, outside the pattern engine.
 *
 * `playCode` is the wrong tool for a keyboard: a pattern loops, and a bench
 * wants one strike per click. `superdough` is the layer underneath the repl that
 * the pattern engine itself calls per hap, so this is the same code path a
 * generated song takes — which is the entire point of a bench. It still needs
 * `initAudio` first, because that is what registers the `gm_*` sounds.
 *
 * It lives in this file rather than in the bench module for the reason stated at
 * the top: this is the AGPL surface, and it stays one file wide.
 */
export async function playNote(req: NoteRequest): Promise<void> {
  await initAudio();
  const { attack, decay, sustain, release } = req.envelope;
  // superdough wants an absolute time on the audio clock and refuses anything
  // already in the past, so even "now" needs a little headroom.
  const at = getAudioContext().currentTime + 0.05 + (req.when ?? 0);
  await superdough(
    {
      s: req.sound,
      note: req.midi,
      ...(req.bank !== undefined ? { n: req.bank } : {}),
      gain: req.gain,
      attack, decay, sustain, release,
    },
    at,
    req.duration,
  );
}

/**
 * Every soundfont registered for one GM program, newest-sounding first.
 *
 * These are webaudiofont's conversions of 1990s soundcard banks — the names say
 * which: `JCLive`, `Aspirin`, `FluidR3_GM`, `SoundBlasterOld`. Strudel picks
 * index 0 unless `.n()` says otherwise, so for every instrument in the
 * catalogue the entire audible difference between one bank and the next is a
 * choice nobody in this project has made yet.
 */
export function soundfontsFor(sound: string): string[] {
  return GM_FONTS[sound] ?? [];
}
