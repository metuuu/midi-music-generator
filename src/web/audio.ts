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
  getSampleBuffer,
  getSound,
  getSuperdoughAudioController,
  initAudioOnFirstClick,
  registerSynthSounds,
  samples,
  superdough,
  webaudioRepl,
} from '@strudel/webaudio';
import { transpiler } from '@strudel/transpiler';
import { getFontBufferSource, registerSoundfonts } from '@strudel/soundfonts';
/**
 * The soundfont-name → bank-list map, which the package exports only as the
 * default of this module. `list.mjs`, the one on the public entry point, opens
 * by saying it is not used any more.
 */
import GM_FONTS from '@strudel/soundfonts/gm.mjs';

import type { Envelope, Song } from '../core/types.js';
import { resolveDrumSample } from '../render/drum-banks.js';
import { SAMPLE_MANIFESTS } from '../render/strudel.js';

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
  /**
   * All three manifests, together, and all three awaited.
   *
   * `samples()` fetches a map of names to URLs and no audio, so this is three
   * small JSON files in parallel rather than three sample libraries — the WAVs
   * are still pulled inside the trigger, which is what `preloadSounds` exists to
   * get ahead of. The wrapper on `samples` is not decoration: passing the
   * function straight to `map` hands it the array index as its second argument,
   * which `samples()` reads as a base URL.
   *
   * Awaited as a group rather than left to settle, because a manifest that has
   * not arrived is a `sound not found` at playback for every part that needed
   * it, and the fetch happens once per page load.
   */
  await Promise.all(SAMPLE_MANIFESTS.map((url) => samples(url)));

  installLimiter();

  instance = repl;
  return repl;
}

/**
 * A brickwall on the way out, because the finished mix goes over full scale.
 *
 * Measured, not assumed: whole songs rendered offline through this same chain
 * peak at 1.03–1.09 — every iskelmä song probed clipped, by up to 0.8 dB. That
 * is what seven layers summing with no headroom management does, and Web Audio
 * hard-clips at the destination, which is a far uglier sound than a limiter
 * that touches the top decibel and nothing else.
 *
 * Set as a peak catcher rather than as a mix-bus compressor: −1 dBFS threshold
 * with a hard knee, so it is inert through the roughly 16 dB of crest a song
 * spends most of its time in, and 20:1 above that, which puts a +0.8 dB
 * overshoot back to about −0.96. A 1 ms attack is short enough to catch a kick
 * transient and long enough not to distort the bass it sits on.
 *
 * No makeup gain, deliberately. `render/strudel.ts` explains at length why a
 * `DynamicsCompressorNode` is the wrong tool *inside* the arrangement — it only
 * attenuates, so it buys quiet rather than loudness. Out here that is exactly
 * the job.
 *
 * This is the one place in the project that reaches past Strudel's documented
 * surface, so it fails soft: if the output does not have the shape we expect —
 * a version bump, a context reset calling `SuperdoughOutput.reset()` — the
 * splice is skipped and the audio still plays, unlimited. It also means the
 * limiter is the audition's, not the music's: code pasted into strudel.cc does
 * not get it, which is another reason the gains upstream have to be right on
 * their own.
 */
function installLimiter(): void {
  const ctx = getAudioContext();
  const out = getSuperdoughAudioController().output;
  const master = out?.destinationGain;
  if (!master) return;

  const limiter = new DynamicsCompressorNode(ctx, {
    threshold: -1,
    knee: 0,
    ratio: 20,
    attack: 0.001,
    release: 0.1,
  });
  master.disconnect();
  master.connect(limiter);
  limiter.connect(ctx.destination);
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
 *
 * From cycle 0 only after a **stop**. After `pausePlayback` the clock kept its
 * phase, so this resumes where the music left off — which is the whole of what
 * makes the pair below a pause rather than a slower stop.
 */
export async function startLoaded(): Promise<void> {
  const repl = await initAudio();
  await repl.start();
}

export async function stopPlayback(): Promise<void> {
  if (instance) instance.stop();
}

/**
 * Hold the clock where it is, to be resumed by `startLoaded`.
 *
 * The difference from `stopPlayback` is one line inside Strudel and the whole
 * difference to a listener: `stop()` resets the scheduler's tick and phase to
 * zero, `pause()` clears the timer and leaves them. So a stop restarts the song
 * and a pause holds the bar you were in.
 *
 * Which matters for a bench rather than for a player. Judging whether the ride
 * is too loud means hearing the same eight bars either side of a fader move, and
 * a transport that can only return to the top makes that comparison a fresh
 * intro every time.
 */
export async function pausePlayback(): Promise<void> {
  if (instance) instance.pause();
}

/**
 * Seconds a preload is allowed to take before the music starts without it.
 *
 * A bound rather than a promise, because a stalled CDN must not hold the
 * curtain: an opening bar that is thin is a disappointment, a stage that never
 * starts is a bug. Generous enough that it only ever catches a black hole and
 * never a merely slow link — a whole band is well under a megabyte, fetched in
 * parallel — and the loads that miss it are not cancelled, they simply stop
 * being waited for and arrive during the first bars.
 */
const PRELOAD_SECONDS = 6;

/**
 * Fetch and decode everything a song will ask for, before it asks.
 *
 * **Nothing in Strudel loads a sound until a hap triggers it.**
 * `registerSoundfonts` registers a callback and no audio; `samples()` fetches
 * the map of URLs and no audio. The instrument itself — 25 to 200 kB per
 * soundfont, one WAV per drum voice — is fetched *inside* the trigger, on the
 * beat it is first needed. So the opening of a number arrives while its band is
 * still on the wire, and what is heard depends on which requests won the race.
 *
 * The two loaders lose that race differently and both badly. The soundfont one
 * awaits the fetch and then calls `start()` with a time that has long since
 * passed, so the note plays immediately and in the wrong place. The sampler
 * checks, sees the deadline is gone, and *drops the hit* — which is why the
 * count-in of a cold page can be missing its first kick entirely.
 *
 * Every call here is the one the trigger itself would make, so it fills the
 * same caches: both loaders key by font-and-pitch and by URL, and both store
 * the promise rather than the result, so a load still in flight is what the
 * trigger waits on rather than a second request for the same bytes.
 *
 * Exactly the pitches the song plays, rather than each instrument's full range:
 * the soundfont cache decodes per pitch, so this is precisely the work the song
 * was going to do anyway, moved to a moment where there is nothing to be late
 * for.
 *
 * Never rejects, and that is part of the contract rather than laziness: this is
 * a warm-up, callers await it on the way to the downbeat, and a band that could
 * not be warmed is a band that plays cold — which is where the show was before
 * any of this existed.
 */
export async function preloadSounds(song: Song): Promise<void> {
  try {
    await warm(song);
  } catch (err) {
    console.warn('audio: the instruments could not be preloaded', err);
  }
}

async function warm(song: Song): Promise<void> {
  await initAudio();
  const ctx = getAudioContext();
  const loads: Promise<unknown>[] = [];

  for (const track of song.tracks) {
    // Bank 0 rather than a choice: the renderer never emits `.n()`, so that is
    // the one the trigger will pick. No entry at all means this part is not a
    // soundfont — a sung line rides an oscillator, which needs no loading.
    const font = GM_FONTS[track.strudelSound]?.[0];
    if (!font) continue;
    for (const midi of new Set(track.notes.map((n) => n.midi))) {
      loads.push(getFontBufferSource(font, { note: midi }, ctx));
    }
  }

  for (const voice of new Set(song.drums.events.map((e) => e.voice))) {
    // The kit's own substitution, so what gets warmed is the sample that will
    // actually sound. A voice it cannot play at all is dropped from the pattern
    // by the renderer, and there is nothing to load for it here either.
    const played = resolveDrumSample(song.drums.bank, voice);
    if (!played) continue;
    /**
     * The key superdough will look up, which is not the same shape for the two
     * kinds of percussion: `.bank()` is applied by prefixing the name at trigger
     * time, so a machine's voice is `linndrum_bd` rather than `bd` — while a
     * sampled rack's names are bare and the stroke is chosen by index instead.
     * See `SAMPLE_RACKS` in `render/drum-banks.ts`.
     */
    const name = played.bank === undefined ? played.sample : `${played.bank}_${played.sample}`;
    const set = getSound(name)?.data?.samples;
    if (!set) continue;
    loads.push(getSampleBuffer({ s: played.sample, n: played.n ?? 0 }, set));
  }

  // Settled rather than all: an instrument that will not load is one that was
  // going to fail on the downbeat regardless, and the rest of the band is
  // waiting behind this promise.
  const done = Promise.allSettled(loads).then(() => undefined);
  const deadline = new Promise<void>((resolve) => {
    window.setTimeout(resolve, PRELOAD_SECONDS * 1000);
  });
  await Promise.race([done, deadline]);
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
