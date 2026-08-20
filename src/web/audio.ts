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

import {
  evalScope, evaluate, ref, silence, stack,
  type Pattern, type StrudelRepl,
} from '@strudel/core';
import {
  getAudioContext,
  getDefaultValue,
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
import { getFontBufferSource, registerSoundfonts, setSoundfontUrl } from '@strudel/soundfonts';
/**
 * The soundfont-name → bank-list map, which the package exports only as the
 * default of this module. `list.mjs`, the one on the public entry point, opens
 * by saying it is not used any more.
 */
import GM_FONTS from '@strudel/soundfonts/gm.mjs';

import type { Envelope, LayerId, Song } from '../core/types.js';
import { resolveDrumSample } from '../render/drum-banks.js';
import {
  SAMPLE_MANIFESTS, duckBuses, localManifest, type StrudelParts,
} from '../render/strudel.js';

/**
 * Where the 125 General MIDI soundfonts come from.
 *
 * The package defaults to `felixroos.github.io/webaudiofontdata` — one person's
 * GitHub Pages, and the last third-party host anything here depended on. The
 * fonts are 17.6 MB in total and MIT-licensed, so they sit beside the samples
 * on the CDN. See CREDITS.md.
 */
const SOUNDFONT_URL = 'https://music-generator-audio.b-cdn.net/soundfonts';

let instance: StrudelRepl | undefined;
let preparing: Promise<StrudelRepl> | undefined;
let starting: Promise<StrudelRepl> | undefined;

/**
 * The engine, once it is allowed to make a noise.
 *
 * Which is a later moment than being built, and the gap between the two was
 * most of this file's cold start. A browser will not let a page produce sound
 * until somebody has touched it, so `initAudioOnFirstClick` resolves on the
 * first `mousedown` — and *everything* used to sit behind that: the eval scope,
 * the repl, the soundfont registrations and the three sample manifests. So the
 * first press paid for assembling the engine before it could begin paying for
 * the record, with the listener watching a button they had already pressed.
 *
 * Only the last step actually needs the click. See `prepareAudio` for the rest,
 * which now happens while the page is still being read.
 */
export function initAudio(): Promise<StrudelRepl> {
  if (!starting) starting = start();
  return starting;
}

async function start(): Promise<StrudelRepl> {
  const repl = await prepareAudio();
  /**
   * The same promise `prepare` armed, awaited rather than armed again — it is
   * memoised inside superdough, so this is the listener that is already there.
   * superdough's own `initAudio` runs off that listener and is what resumes the
   * context and loads the worklets, so nothing may sound before it resolves.
   */
  await initAudioOnFirstClick();
  return repl;
}

/**
 * Everything that can be built before the listener has touched anything.
 *
 * All of it: the eval scope, the repl, the sound registries and the sample
 * manifests. None of it makes a sound, and none of it needs the context to be
 * running — which is the point, because the context is created here too, and a
 * suspended `AudioContext` decodes audio and compiles patterns perfectly well.
 * `preloadSounds` and `loadCode` come here rather than to `initAudio` for
 * exactly that reason: a page can have a whole record fetched, decoded and
 * compiled before the first press, and then the press is a `start()`.
 *
 * The one thing this costs is a console warning in Chrome, which notices a
 * context that was created before a gesture and says so. Its state is
 * `suspended` until superdough resumes it on the click, which is the ordinary
 * create-early-resume-on-gesture arrangement every web audio library uses.
 */
function prepareAudio(): Promise<StrudelRepl> {
  if (!preparing) preparing = prepare();
  return preparing;
}

async function prepare(): Promise<StrudelRepl> {
  // Armed before anything is awaited. The listener is registered synchronously
  // and resolves on the *next* `mousedown`, so arming it behind an await would
  // spend the listener's own press on waking the page up and leave the first
  // real press appearing to do nothing.
  void initAudioOnFirstClick();

  // Make the pattern vocabulary (note, s, stack, sound, …) available to
  // evaluated code.
  await evalScope(
    import('@strudel/core'),
    import('@strudel/mini'),
    import('@strudel/tonal'),
    import('@strudel/webaudio'),
  );

  // Creating the repl also injects setcpm/setcps into the eval scope, which the
  // generated code relies on. `editPattern` is Strudel's own hook on the way
  // into the scheduler, and every route to a pattern goes through it — see
  // `playOnce`.
  const repl = webaudioRepl({ transpiler, editPattern: playOnce });

  registerSynthSounds();
  setSoundfontUrl(SOUNDFONT_URL);
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
   *
   * Read off our own origin — see `localManifest`. The audio behind them is on
   * the CDN, which is what each file's own `_base` says.
   */
  await Promise.all(SAMPLE_MANIFESTS.map((url) => samples(localManifest(url))));

  installLimiter();

  instance = repl;
  return repl;
}

// ---------------------------------------------------------------------------
// Where the piece ends
// ---------------------------------------------------------------------------

/**
 * How many cycles the loaded piece lasts, or `undefined` to let it run round
 * for as long as the clock does.
 *
 * ## Why the ending has to be in the pattern
 *
 * `render/strudel.ts` emits every part as `<bar bar bar …>`, which is a
 * `slowcat`: it steps one bar per cycle and then starts again from the first,
 * forever. So a piece here has a written ending and no *stop*, and everything
 * that wanted one — the concert's `endNumber`, the radio's `advance` — got it by
 * halting the scheduler at the right moment instead.
 *
 * **No caller can be on time for that moment.** Strudel's clock runs ahead of
 * the ear by construction: `zyklus` queries the pattern in 50 ms chunks out to
 * `interval + overlap` = 0.2 s past the audio clock, and each hap it finds is
 * handed to superdough for `latency` = 0.1 s later again. So at every instant
 * roughly **0.3 seconds of music is already scheduled and cannot be recalled** —
 * which is exactly the property the rest of this file depends on, since it is
 * what lets a last chord ring out over applause that has already started.
 *
 * The result was an audible stutter at the end of every piece: a number, or a
 * record, finished and was followed about a tenth of a second later by *its own
 * first downbeat* — kick, bass and the top of the melody, once, and then
 * nothing, because the scheduler stopped before the second beat could be
 * queried. Not a loop that was cut short so much as a loop nobody heard the rest
 * of, sounding underneath the applause or the changeover.
 *
 * So the loop point is taken out of the pattern rather than raced by a caller,
 * and the stop goes back to being what it is for everywhere else — the thing
 * that ends the *clock*, over whatever is still ringing.
 *
 * Read at query time rather than compiled in, so setting it is an assignment
 * rather than a re-evaluation and it reaches a band that is already playing.
 * Left `undefined` by the benches and by the audition page with radio off, where
 * hearing the same eight bars come round again is the point.
 */
let pieceCycles: number | undefined;

/**
 * The end of the piece, as the pattern sees it.
 *
 * Installed on every pattern the repl sets — `loadBand`, `loadCode` and
 * `playCode` all reach the scheduler through `setPattern`, and Strudel calls
 * this hook there — so there is no route to a running pattern that can forget
 * it.
 *
 * Onsets are the whole of what has to go. A hap with no `whole` is a continuous
 * signal and triggers nothing; a hap whose `whole` began before the end is the
 * last chord, still turning up in the chunks queried past the boundary and still
 * wanted, because that is the note that is doing the ringing.
 */
function playOnce(pattern: Pattern): Pattern {
  return pattern.filterHaps(
    (hap) => pieceCycles === undefined || !hap.whole || hap.whole.begin.lt(pieceCycles),
  );
}

/**
 * Whether what is loaded is meant to come round again.
 *
 * For the singer, who is not in the pattern and therefore not covered by
 * `playOnce`: `sung-voice.ts` places her phrases against the scheduler's clock
 * and wraps them itself, with a 0.9 s lookahead — three times Strudel's — so a
 * line that opens the piece would be handed to the synth, and sung, over the end
 * of it. She rounds with the band or she stops with it; this is how she knows
 * which.
 */
export function pieceLoops(): boolean {
  return pieceCycles === undefined;
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
  fader = new GainNode(ctx, { gain: 1 });
  master.disconnect();
  master.connect(limiter);
  limiter.connect(openSpectrum(ctx));
  limiter.connect(fader);
  fader.connect(ctx.destination);
}

/**
 * The fader, downstream of both the limiter and the glow's tap.
 *
 * Where it sits is the whole point. `destinationGain` is Strudel's and stays at
 * unity; this is what every level change moves, so the analyser reads the mix
 * as mixed and the bar looks the same at any volume — a listener turning the
 * sound down is not asking to turn the picture down with it.
 *
 * It also puts the limiter where a limiter belongs. Hung off `destinationGain`
 * it saw post-fader signal, so anything under about half volume never reached
 * the −1 dBFS threshold and the peak catching quietly switched itself off at
 * exactly the settings a listener is most likely to use. Now the mix is caught
 * first and turned down second, which is the ordinary order and makes the
 * limiter's behaviour independent of the knob.
 */
let fader: GainNode | undefined;

/**
 * The window the glow looks through. Post-limiter, ahead of the fader.
 *
 * An `AnalyserNode` is a tap, not a link in the chain: it needs no output
 * connection to fill its buffer, so nothing downstream of it can go wrong and
 * the sound is the same whether anything reads it or not.
 *
 * Post-limiter and pre-fader: a peak the limiter caught reads caught, and the
 * volume knob downstream cannot reach it. Pausing still stills the bar, but by
 * `setPlaying` rather than by the level, which is why the two can be separated
 * at all.
 *
 * Smoothing is off. `AnalyserNode` only offers a symmetric time constant, and a
 * visualiser wants to jump on a transient and fall away slowly, so the release
 * is shaped where the bands are folded instead.
 */
let spectrum: AnalyserNode | undefined;

function openSpectrum(ctx: BaseAudioContext): AnalyserNode {
  spectrum ??= new AnalyserNode(ctx, { fftSize: 4096, smoothingTimeConstant: 0 });
  return spectrum;
}

/**
 * Undefined until the first record has armed the chain, and never on its own
 * account: asking must not build an `AudioContext`, because the one this would
 * build is the one the browser refuses to start outside a gesture.
 */
export function getSpectrum(): AnalyserNode | null {
  return spectrum ?? null;
}

/**
 * How long the master fader takes to travel. Long enough not to click.
 *
 * A hard `gain = 0` on a sounding chord is a step discontinuity in the
 * waveform, which is a click — and a loud one, because the chord it interrupts
 * is at whatever amplitude it happened to be at. Twelve milliseconds is under a
 * frame and is heard as an immediate stop rather than as a fade.
 */
const CUT_SECONDS = 0.012;

/**
 * Take the whole output down, or bring it back. The only real stop there is.
 *
 * `stopPlayback` halts the *scheduler*, and everywhere else in this project
 * that is exactly right: the last bar of a piece is a held chord and letting it
 * ring over the applause is what a room does — `endNumber` and the radio's
 * `RING_OUT_SECONDS` both depend on it and both say so.
 *
 * It is wrong for a pause. Voices already handed to Web Audio have their whole
 * envelope scheduled on the audio clock and nothing in Strudel can recall them,
 * so a paused transport went on sounding for as long as the longest note had
 * left — up to several seconds of pad over a stage that had visibly stopped.
 * The scheduler cannot fix that because the notes are no longer its business.
 * The master gain can, because everything goes through it.
 *
 * Fails soft for `installLimiter`'s reason, and falls back to the node it used
 * to move: without the splice there is no `fader`, and `destinationGain` is
 * then the only fader there is.
 */
export function setOutputLevel(level: number, seconds = CUT_SECONDS): void {
  try {
    const master = fader ?? getSuperdoughAudioController()?.output?.destinationGain;
    if (!master) return;
    const now = getAudioContext().currentTime;
    // Cancel first: a second press during the ramp would otherwise ramp from a
    // value that is itself still moving, and the two schedules fight.
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(level, now + Math.max(seconds, 0.001));
  } catch (err) {
    console.warn('audio: the master fader would not move', err);
  }
}

/**
 * Cut what is still sounding, rather than covering it up.
 *
 * `setOutputLevel(0)` is a fader, and a fader only hides: the voices behind it
 * go on running on the audio clock, wherever they had got to in their envelopes.
 * So the last chord of a record that has been faded out, or the pad and the
 * reverb tail of one that simply ended, come *back* the moment the fader returns
 * for the next record — swelling in underneath a downbeat they have nothing to
 * do with. That is a changeover that sounds like two records overlapping, and no
 * amount of fading fixes it, because the fade is what is hiding it.
 *
 * Strudel has nothing to ask for this with. `stop()` halts the *scheduler*,
 * which only decides what is triggered next; a hap already handed to superdough
 * owns its own source node with its whole envelope scheduled, and nothing
 * upstream can recall it. What can be reached is the bus it plays into:
 * superdough sums every voice into an `Orbit` per orbit number, ahead of that
 * orbit's delay and reverb, so disconnecting one takes the notes *and* their
 * tails out of the graph in the same instant.
 *
 * The orbits are then dropped rather than kept, because `getOrbit` only builds
 * one when the slot is empty — leaving a disconnected orbit in place would
 * silence that orbit for the rest of the session. Everything downstream
 * survives, which is why this is not `resetGlobalEffects()`: that rebuilds the
 * master gain too, and would take the limiter spliced onto it and the singer
 * wired straight to it with it.
 *
 * A disconnect is a step discontinuity, which is a click at whatever amplitude
 * the tail still had. **Callers do this with the fader already down.**
 */
export function silenceVoices(): void {
  try {
    const controller = getSuperdoughAudioController();
    if (!controller) return;
    const open = Object.keys(controller.nodes ?? {}).map(Number);
    for (const orbit of Object.values(controller.nodes ?? {})) orbit?.disconnect?.();
    for (const bus of Object.values(controller.buses ?? {})) bus?.disconnect?.();
    controller.nodes = {};
    controller.buses = {};
    /**
     * The numbers come straight back, empty. Dropping the orbit *objects* is
     * the whole point above, but dropping the **slots** takes the sidechain's
     * targets with them — a changeover runs this between the preload that opens
     * the next record's buses and its downbeat, so without this the first kick
     * of every record after the first names buses that were just deleted. See
     * `openDuckBuses`.
     */
    for (const orbit of open) openOrbit(controller, orbit);
  } catch (err) {
    console.warn('audio: the sounding voices would not cut', err);
  }
}

/**
 * The outputs superdough would have given a bus, zero-based.
 *
 * Read from superdough's own defaults rather than written down, because the
 * only thing that must not drift is the agreement with the buses it opens
 * itself. Its other branch — a channel pair per orbit — is reachable only with
 * `multiChannelOrbits`, which nothing here turns on.
 */
function orbitChannels(): number[] {
  const channels = getDefaultValue('channels');
  const list = Array.isArray(channels) ? channels : [channels];
  // superdough's own note: gear counts outputs from 1 and the Web Audio API
  // from 0.
  return list.map((ch) => Number(ch) - 1);
}

type Controller = ReturnType<typeof getSuperdoughAudioController>;

function openOrbit(controller: Controller, orbit: number): void {
  controller.getOrbit?.(orbit, orbitChannels());
}

/**
 * Open the buses this song's sidechain is going to name.
 *
 * superdough builds an orbit the first time something sounds on it, and the
 * kick ducks from bar one — so a record whose pad enters at bar 32 spends its
 * first third logging *duck target orbit n does not exist* and not pumping. The
 * fix is the same thing an engineer does before a take: the bus exists because
 * it is on the desk, not because something is on it yet.
 *
 * Never throws. A desk that could not be set up is a record that plays without
 * its compressor, which is where every record was before this existed.
 */
export function openDuckBuses(song: Song): void {
  try {
    const controller = getSuperdoughAudioController();
    if (!controller) return;
    for (const orbit of duckBuses(song)) openOrbit(controller, orbit);
  } catch (err) {
    console.warn('audio: the sidechain buses would not open', err);
  }
}

/**
 * A few quanta of grace between the fader arriving at zero and the cut behind
 * it, so a disconnect can never land on a ramp that is still moving — which is
 * the one way `silenceVoices` makes a noise rather than removing one.
 */
const CUT_GRACE_MS = 30;

/**
 * Stop, as a listener means it: fader down, and then what the fader was hiding.
 *
 * The pair above in the order they have to happen in, which is the whole of what
 * a caller needs from them. Resolves once the sound is actually gone, so a caller
 * that has a fader to raise afterwards — a stage abandoning a number, a page
 * about to start another record — can wait for the silence rather than guess at
 * it.
 *
 * Not for a *pause*. A pause is meant to be picked up again, and the tail that
 * comes back with the fader is the same chord the listener left ringing. It is
 * for stops and for changeovers: the two places where what is sounding belongs
 * to a piece nobody is going to hear the rest of.
 */
export async function stopSounding(fade = CUT_SECONDS): Promise<void> {
  setOutputLevel(0, fade);
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, fade * 1000 + CUT_GRACE_MS);
  });
  silenceVoices();
}

/**
 * The code the repl is holding, so a compile can be recognised as one that has
 * already been paid for.
 *
 * A transpile is 0.5–1.9 s of blocked main thread, and it is the whole of what a
 * press on a warmed page would otherwise still have to wait for: the radio
 * compiles its first record while nothing is playing — see `arm` in
 * `web/radio.ts` — and the press that follows asks for exactly the same text.
 * Being able to answer *that one is already loaded, start it* is the difference
 * between a button that answers and a button that thinks about it.
 */
let loadedCode: string | undefined;

/**
 * Compiles, in the order they were asked for.
 *
 * `repl.evaluate` installs the pattern the scheduler reads, so two of them in
 * flight at once leave whichever *finished* last on the air rather than whichever
 * was *asked for* last — and the later one is the one somebody pressed for. Not
 * hypothetical now that a page compiles ahead of the press: a skip landing inside
 * that compile is two evaluations racing, and the loser was the record playing.
 *
 * Chained rather than cancelled, because a transpile already running cannot be
 * abandoned. The loser is simply overwritten a moment later by the winner.
 */
let compiling: Promise<unknown> = Promise.resolve();

function queued<T>(work: () => Promise<T>): Promise<T> {
  const mine = compiling.then(work);
  // Never rejects: one compile that threw must not poison every compile behind
  // it. The caller still sees its own failure, through `mine`.
  compiling = mine.catch(() => undefined);
  return mine;
}

/**
 * Compile, load and start, in one call.
 *
 * `bars` is the piece's length in bars, which is its length in cycles — pass it
 * and the pattern plays once, leave it out and it loops. See `pieceCycles`.
 */
export async function playCode(code: string, bars?: number): Promise<void> {
  const repl = await initAudio();
  await queued(async () => {
    pieceCycles = bars;
    await repl.evaluate(code);
    loadedCode = code;
  });
}

// ---------------------------------------------------------------------------
// A band you can change one player in
// ---------------------------------------------------------------------------

/**
 * The layers the running pattern is reading, by layer id.
 *
 * Module state rather than a returned handle because there is one scheduler and
 * one audible band; two of these would be two songs playing at once, and the
 * bug that produces is not one anybody would diagnose from the sound.
 */
const band = new Map<LayerId, Pattern>();

/**
 * A song compiled and waiting, as patterns rather than as text.
 *
 * Everything expensive about putting a record on has already happened by the
 * time one of these exists, which is the whole point of the shape: installing
 * it is a handful of map writes and a `setPattern`.
 */
export interface StagedBand {
  cpm: number;
  bars: number;
  layers: { layer: LayerId; pattern: Pattern }[];
}

/**
 * A task between compiles, so a running clock gets its tick.
 *
 * A task rather than a frame, because a hidden page fires no frames and the
 * clock this is making room for is a `setInterval` on this same thread.
 */
function breathe(): Promise<void> {
  return new Promise((resolve) => { window.setTimeout(resolve, 0); });
}

/**
 * The largest block that may be compiled under music, in bytes.
 *
 * Measured over 309 blocks. At 16 KB the worst compile was 124 ms and the
 * median 77, against the ~0.3 s of audio the scheduler always has in hand — see
 * `pieceCycles`. Past that the curve turns hard: 32 KB and over measured 524 ms,
 * which is not a pause but a dropout.
 *
 * Three quarters of records have no block over this and are compiled through
 * before the changeover reaches them. The rest arrive with their one dense part
 * still to do, which is the whole of what a changeover used to be.
 */
const UNDER_MUSIC_BYTES = 16 * 1024;

/**
 * Blocks already compiled for a set of parts, so a later pass pays for the rest.
 *
 * Weak on the parts rather than keyed by text: a record's compiled halves die
 * with the record, and two records that happened to emit the same bass line
 * never reach into each other's work.
 */
const warmed = new WeakMap<StrudelParts, Map<string, Pattern>>();

function blocksOf(parts: StrudelParts): Map<string, Pattern> {
  let done = warmed.get(parts);
  if (!done) warmed.set(parts, done = new Map());
  return done;
}

/**
 * Compile as much of a song as can be compiled without starving the clock.
 *
 * ## What this is for
 *
 * Handing Strudel a whole song is 27–194 KB of generated JavaScript through an
 * acorn parse and a pattern graph of several thousand combinators — 88 ms to
 * near a second of blocked main thread, on the thread the clock runs on. That is
 * why a record used to be compiled in the gap between two records and nowhere
 * else: a gap is the one place there is nothing to starve.
 *
 * Blocks are what makes most of it fit *under* music instead. A song emits 2–19
 * of them, the median record's largest is 11 KB, and with a task between each
 * the thread comes back long before the scheduler runs out of queried audio.
 *
 * ## What it deliberately leaves
 *
 * Compile cost is not linear in a block's length — a dense comp is one
 * mini-notation string of 224 bars, and the two biggest measured 443 and 400 ms
 * on their own. Those are left for the changeover rather than slowed down,
 * because a starved scheduler is an audible hole and a longer gap is not.
 *
 * Nothing is returned: the work lands where `stageBand` will find it.
 */
export async function warmBand(parts: StrudelParts): Promise<void> {
  // `prepareAudio` rather than `initAudio` for the reason `loadCode` gives: a
  // compile is arithmetic and needs nobody's permission.
  const repl = await prepareAudio();
  const done = blocksOf(parts);
  for (const { blocks } of parts.layers) {
    for (const block of blocks) {
      if (done.has(block) || block.length > UNDER_MUSIC_BYTES) continue;
      done.set(block, await compile(block));
      if (repl.scheduler.started) await breathe();
    }
  }
}

/**
 * A song as patterns, compiling whatever `warmBand` did not get to.
 *
 * The pause between blocks is taken only while the clock is running, which is
 * what lets one function serve an idle page arming its first record and a
 * changeover that has already stopped the scheduler. Neither has anything to be
 * polite to, so both compile in a single run.
 */
export async function stageBand(parts: StrudelParts): Promise<StagedBand> {
  const repl = await prepareAudio();
  const done = blocksOf(parts);
  const layers: StagedBand['layers'] = [];
  for (const { layer, blocks } of parts.layers) {
    const patterns: Pattern[] = [];
    for (const block of blocks) {
      let pattern = done.get(block);
      if (!pattern) {
        pattern = await compile(block);
        done.set(block, pattern);
        if (repl.scheduler.started) await breathe();
      }
      patterns.push(pattern);
    }
    layers.push({
      layer,
      pattern: patterns.length === 1 ? patterns[0]! : stack(...patterns),
    });
  }
  return { cpm: parts.cpm, bars: parts.bars, layers };
}

/**
 * Put a staged song on, as a stack of layers that can be replaced individually.
 *
 * What makes a player swappable afterwards is `ref`, whose own docstring in
 * `@strudel/core` says it: *exposes a custom value at query time. basically
 * allows mutating state without evaluation*. The pattern the scheduler holds
 * asks this map for each layer every time it is queried, so `mutePlayer` is a
 * map write and costs nothing at all, and `swapPlayer` costs one layer.
 *
 * `autostart` is false for the same reason `loadCode` exists: a stage decides
 * when bar one happens, and evaluating onto a running clock starts the song
 * somewhere in its middle. See `startLoaded`.
 */
export async function installBand(staged: StagedBand, autostart = false): Promise<void> {
  const repl = await initAudio();
  band.clear();
  // The pattern about to be installed is a stack of `ref`s rather than anybody's
  // text, so whatever `loadedCode` names is no longer what the scheduler is
  // reading and a later `loadCode` for that text must not believe otherwise.
  loadedCode = undefined;
  // The number ends where it ends rather than starting again over the applause.
  // Taken from the parts rather than asked of the caller, because a stage that
  // forgot to say would be a stage with a stutter on the end of every number.
  // See `pieceCycles`.
  pieceCycles = staged.bars;
  for (const { layer, pattern } of staged.layers) band.set(layer, pattern);
  // `setcpm` in the emitted preamble, called directly — there is no code left
  // to evaluate it in. One cycle is one bar, so cps is cpm/60.
  repl.setCps(staged.cpm / 60);
  /**
   * Snapshot the layer ids, not the map's keys at query time.
   *
   * A `ref` per layer that existed when the song was loaded, and no more: the
   * stack itself is fixed for the number, and only what each `ref` returns
   * moves. Reading the live key set here would let a swap change the *shape* of
   * the stack, which is a re-evaluation by another route.
   */
  const layers = staged.layers.map((l) => l.layer);
  await repl.setPattern(
    stack(...layers.map((layer) => ref(() => band.get(layer) ?? silence))),
    autostart,
  );
}

/**
 * Compile a song and put it on, in one call.
 *
 * The pair is worth keeping apart wherever the two halves can happen at
 * different times — see `stageBand`, and the radio's `cueNext`.
 */
export async function loadBand(parts: StrudelParts, autostart = false): Promise<void> {
  await installBand(await stageBand(parts), autostart);
}

/**
 * Take a player out, in place, for nothing.
 *
 * No transpile, no evaluation, no `setPattern` — the running pattern reads this
 * map on its next query and finds silence. Strudel queries a cycle ahead, so the
 * player drops out at the top of the next bar, which is where a musician would
 * have dropped out anyway.
 */
export function mutePlayer(layer: LayerId): void {
  band.set(layer, silence);
}

/**
 * Put a player back with different music.
 *
 * The one evaluation a re-voice pays for, and it is this layer's text rather
 * than the song's — a few KB against 60–124. A layer that is not part of the
 * loaded stack is written anyway and simply never read, which is the right
 * answer for a chimera that arrived with a part nobody is holding a `ref` for.
 */
export async function swapPlayer(layer: LayerId, code: string): Promise<void> {
  await initAudio();
  band.set(layer, await compile(code));
}

/** Whether a band is loaded, so a caller can tell a swap from a cold start. */
export function bandLoaded(): boolean {
  return band.size > 0;
}

/**
 * Whether the clock is running.
 *
 * Asked before starting rather than started blindly: `scheduler.start()` rewinds
 * to cycle 0, so calling it on a running number would take the band back to the
 * top of the song. The old path could not get this wrong because `playCode`
 * evaluated and started in one call and a swap always came with an evaluation;
 * a swap that touches no pattern has to check.
 */
export async function isPlaying(): Promise<boolean> {
  const repl = await initAudio();
  return repl.scheduler.started;
}

/** Forget the band. The scheduler keeps whatever it was last given. */
export function clearBand(): void {
  band.clear();
}

/**
 * One layer's code to one pattern, without disturbing what is playing.
 *
 * `repl.evaluate` would install the result as *the* pattern, which is the
 * opposite of the point. `evaluate` from `@strudel/core` is the same machinery
 * with no scheduler attached: transpile, run, hand back the value.
 */
async function compile(code: string): Promise<Pattern> {
  const { pattern } = await evaluate(code, transpiler);
  return pattern as Pattern;
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
export async function loadCode(code: string, bars?: number): Promise<void> {
  // `prepareAudio` rather than `initAudio`: a compile is arithmetic on a
  // suspended context and needs nobody's permission, so a page may have its
  // first record loaded before anything has been pressed. The press then only
  // has `startLoaded` left to do.
  const repl = await prepareAudio();
  await queued(async () => {
    pieceCycles = bars;
    // Already the pattern the repl is holding — see `loadedCode`.
    if (code === loadedCode) return;
    await repl.evaluate(code, false);
    loadedCode = code;
  });
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
 * never a merely slow link — and the loads that miss it are not cancelled, they simply stop
 * being waited for and arrive during the first bars.
 */
const PRELOAD_SECONDS = 6;

/**
 * Fetch and decode everything a song will ask for, before it asks.
 *
 * **Nothing in Strudel loads a sound until a hap triggers it.**
 * `registerSoundfonts` registers a callback and no audio; `samples()` fetches
 * the map of URLs and no audio. The instrument itself is fetched *inside* the
 * trigger, on the beat it is first needed. So the opening of a number arrives
 * while its band is still on the wire, and what is heard depends on which
 * requests won the race.
 *
 * **How much is on that wire, measured rather than guessed.** This said "25 to
 * 200 kB per soundfont" and that a whole band is "well under a megabyte". Over
 * the 115 bank-0 fonts the catalogue actually reaches: median **71 kB**, mean
 * 151 kB, from 2.7 kB for `gm_synth_drum` to **1,338 kB** for `gm_harpsichord`
 * — 27 of the 115 are over 200 kB, so the stated range holds for barely half of
 * them. Per song the melodic band runs to a median of **696 kB** and a p90 of
 * 1.5 MB, with **29% of songs over a megabyte** before a single drum, and the
 * kit adds a median eight voices at roughly 118 kB each. A typical number is
 * about 1.6 MB of assets and the worst is near 4 MB.
 *
 * That is not an argument against the preload — it is the argument *for* it,
 * and for anything downstream that has to budget rather than shrug.
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
  // Here because this is the one call every page already makes with the song in
  // hand on the way to a downbeat, and the desk has to be set up by then for the
  // same reason the band does. See `openDuckBuses`.
  openDuckBuses(song);
}

async function warm(song: Song): Promise<void> {
  // `prepareAudio` rather than `initAudio`, which is the whole of what makes
  // this a *pre*load on a cold page. Every call below is a fetch and a decode
  // against a context that is allowed to be suspended, so none of them needs the
  // listener to have touched anything — and waiting for the click meant the
  // 1.6 MB this exists to get ahead of only started moving on the press it was
  // supposed to be ahead of.
  await prepareAudio();
  const ctx = getAudioContext();
  const loads: Promise<unknown>[] = [];

  for (const track of song.tracks) {
    /**
     * Bank 0 rather than a choice: the renderer never emits `.n()`, so that is
     * the one the trigger will pick.
     *
     * **No entry does not mean no audio, which is what this comment used to
     * say.** It read *"a sung line rides an oscillator, which needs no
     * loading"*, and that is true of the sung line and of nothing else:
     * **seven of the 126 catalogue instruments have no GM font** — `kantele`,
     * `pipeOrgan`, `pipeOrganQuiet`, `steinway`, `dantranh`, `strumstick` and
     * `balafon` — and every one of them is a VCSL *sample* name that plays
     * perfectly well. They were skipped here, so they alone were never
     * preloaded and lost the race on the downbeat that this whole function
     * exists to win. `samples()` has already registered them by the time this
     * runs, so warming them is the same call with a name instead of a font.
     */
    const font = GM_FONTS[track.strudelSound]?.[0];
    if (!font) {
      // A registered sample name. `getSound` resolves it the way the trigger
      // will, and touching it is enough to start the fetch.
      loads.push(Promise.resolve(getSound(track.strudelSound)).catch(() => undefined));
      continue;
    }
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
