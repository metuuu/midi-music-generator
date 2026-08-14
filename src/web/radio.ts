/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The listener's page. Eight stations, three buttons, everything else behind a
 * key.
 *
 * `web/main.ts` is the other half of this pair and the two are aimed at
 * different people. That page is a bench: every axis the generator has is a
 * control on it, the seed is a text field, and the thing it is for is judging
 * what the engine wrote. This one shows a title, a genre and three buttons.
 * The seed — the property the whole project is built on — appears only as the
 * string behind ♥.
 *
 * ## The transport is the same sequence, deliberately
 *
 * Cue the next record under the one that is playing, stop at the loop point,
 * compile inside the ring-out, start on the floor. That order is the whole
 * difference between a station and a demo, and `web/main.ts` explains at length
 * why each step is where it is — the compile is 0.5–1.9 s of blocked main
 * thread and must not run while the scheduler needs it.
 *
 * It is written out again here rather than shared, and that is a debt rather
 * than a design. The state machines are close but not equal: this page has no
 * layer muting, no controls to disable mid-write, and a skip, which is a
 * changeover with the ring-out taken out and the fader pulled. Extracting a
 * common transport is worth doing once both pages have stopped moving.
 *
 * ## What is not here, and why
 *
 * No artwork, no visualiser, no listener count, no accounts. The page has to
 * survive an hour of being left alone, and each of those is a thing that would
 * have to go on being right for that hour without ever being looked at.
 *
 * There *is* a volume, which there was an argument against — the OS has one and
 * Media Session puts this station on the lock screen beside everything else.
 * The argument loses on the desktop, where per-tab volume is not a thing a
 * listener can reach without going hunting in the browser's own menus.
 */

import {
  initAudio, loadCode, pausePlayback, playCode, preloadSounds, setOutputLevel, silenceVoices,
  startLoaded, stopPlayback, stopSounding,
} from './audio.js';
import { generateSongAsync } from './generator.js';
import { createSungVoice, withoutSungVoice } from './sung-voice.js';

import { songDurationBeats, type Song } from '../core/types.js';
import type { GenerateOptions } from '../generate/song.js';
import { HOOK_LEVELS } from '../generate/hook.js';
import { renderStrudel } from '../render/strudel.js';
import {
  DEFAULT_WANDER, STATIONS, getStation, newToken, recordOptions, sourceLabel,
  type Station, type VoicePolicy,
} from '../station.js';

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el as T;
};

const els = {
  title: $<HTMLHeadingElement>('title'),
  sub: $<HTMLDivElement>('sub'),
  era: $<HTMLDivElement>('era'),
  play: $<HTMLButtonElement>('play'),
  skip: $<HTMLButtonElement>('skip'),
  stationsToggle: $<HTMLButtonElement>('stations-toggle'),
  stationsWrap: $<HTMLDivElement>('stations-wrap'),
  stations: $<HTMLDivElement>('stations'),
  oops: $<HTMLParagraphElement>('oops'),
  debug: $<HTMLDivElement>('debug'),
  debugOpen: $<HTMLAnchorElement>('debug-open'),
  debugCopy: $<HTMLButtonElement>('debug-copy'),
  debugRef: $<HTMLElement>('debug-ref'),
  settings: $<HTMLDialogElement>('settings'),
  openSettings: $<HTMLButtonElement>('open-settings'),
  closeSettings: $<HTMLButtonElement>('close-settings'),
  voice: $<HTMLDivElement>('voice'),
  wander: $<HTMLInputElement>('wander'),
  wanderName: $<HTMLElement>('wander-name'),
  wanderGloss: $<HTMLElement>('wander-gloss'),
  scrim: $<HTMLDivElement>('scrim'),
  vol: $<HTMLDivElement>('vol'),
  volBtn: $<HTMLButtonElement>('volume-btn'),
  volume: $<HTMLInputElement>('volume'),
};

/** One record, and everything needed to prove it is that record again. */
interface Cut {
  station: Station;
  wander: number;
  token: string;
  song: Song;
  /**
   * What the generator was actually asked for. Kept rather than recomputed
   * because `?debug` hands these to the bench, and a link rebuilt from a second
   * call to `recordOptions` would be a second answer to trust.
   */
  opts: GenerateOptions;
  /** Its Strudel, rendered when the cut was written rather than in the gap. */
  code: string;
}

let station: Station = STATIONS[0];
let wander = DEFAULT_WANDER;
let voice: VoicePolicy = 'instrumental';
/**
 * The listener's own fader, 0..1, over everything the master already does.
 *
 * There is no `<audio>` element to hang a system volume off — the mix is
 * assembled in Web Audio — so this is the only volume this page has, and every
 * place that brings the sound back up has to bring it back to *this* rather
 * than to 1. See `setOutputLevel`.
 */
let volume = 1;
let current: Cut | undefined;
let playing = false;
let loading = false;
/**
 * Held rather than stopped — the scheduler keeps its phase and the record
 * resumes where it left off.
 *
 * Distinct from `!playing` because the two press differently: an idle button
 * starts whatever record is showing from its top, and a paused one puts the
 * needle back down in the middle of the bar it lifted from.
 */
let paused = false;
/**
 * When the record playing now runs out, as a `performance.now()` reading.
 *
 * Kept alongside the timer because a pause has to put back what is *left* of
 * the record on resume, and a `setTimeout` cannot be asked how much of itself
 * is unspent.
 */
let endsAt = 0;
/** What `endsAt` had left at the moment of the pause. */
let heldMs = 0;
/**
 * Which press the audio belongs to, bumped by every play and every stop.
 *
 * A load is a window a second or two wide, and without this a stop pressed
 * inside that window is answered by music starting.
 */
let generation = 0;
let timer: number | undefined;
/**
 * The next record, cued under this one. Resolves to `undefined` rather than
 * rejecting — a station must not fall silent because the record *after* the one
 * playing could not be written early.
 */
let pending: Promise<Cut | undefined> | undefined;

const sungVoice = createSungVoice();

// ---------------------------------------------------------------------------
// What a record is called when it is written down
// ---------------------------------------------------------------------------

/**
 * `station.wander.token` — everything `recordOptions` needs to rebuild a record.
 *
 * Nothing on the page writes one of these any more; this is the reader, kept so
 * that a `?s=` link somebody already has goes on resolving to the record it
 * names. The voice policy is deliberately not part of it: the generator draws
 * `vocals` from its own stream, so the arrangement is identical either way, and
 * a linked record heard with the voice off is that record without the voice
 * rather than a different one.
 */
function parseRef(ref: string): { station: Station; wander: number; token: string } | undefined {
  const [id, pct, token] = ref.split('.');
  const found = id ? getStation(id) : undefined;
  const n = Number(pct);
  // Checked rather than trusted: this arrives from an address bar and from
  // storage written by older versions of this file, and a station that has been
  // renamed should cost the link its record, not the page its boot.
  if (!found || !token || !/^[a-z0-9]+$/.test(token)) return undefined;
  if (!Number.isFinite(n) || n < 0 || n > 100) return undefined;
  return { station: found, wander: n / 100, token };
}

// ---------------------------------------------------------------------------
// Painting
// ---------------------------------------------------------------------------

/**
 * The play button, which is the only place the transport's state is written.
 *
 * Three states on one control and no status row anywhere on the page: a line
 * that narrates what the machinery is doing changes too fast to read and goes
 * quiet through the slow part, which makes it both noise and a lie.
 */
function paintPlay(): void {
  els.play.dataset.state = loading ? 'load' : playing ? 'pause' : 'play';
  els.play.setAttribute('aria-label', loading ? 'Loading' : playing ? 'Pause' : 'Play');
  // The glow reads this, and it is the whole of what drives it: lit and
  // breathing while the flag is set, grey when it is not. See `.glow`.
  document.body.classList.toggle('playing', playing);
}

/**
 * How long this record will sound for, which is not always how long it is
 * written to be.
 *
 * Strudel's tempo is one global number per pattern, so a piece that ramps plays
 * flat at `meta.bpm` and runs longer than it is written. The changeover timer
 * takes this reading rather than `songDurationSeconds`, or the ending would be
 * cut off every record that ramps.
 */
function durationMs(song: Song): number {
  return (songDurationBeats(song) / song.meta.bpm) * 60 * 1000;
}

function showError(message: string): void {
  els.oops.textContent = message;
  els.oops.hidden = false;
}

function clearError(): void {
  els.oops.hidden = true;
}

function describe(cut: Cut): void {
  const { meta } = cut.song;
  els.title.textContent = meta.title;
  els.sub.textContent = `${meta.genreLabel} · ${meta.styleLabel}`;
  // `eraLabel` is where the year lives — "1960s–70s tanssilava", "1972–77
  // modular", "Romantic, c. 1870". The shape varies by genre because the
  // periods do, and it is the era's own sentence rather than one assembled out
  // of its `year` here.
  els.era.textContent = meta.eraLabel;
  paintKey(cut.song);
  // The placeholders have something to be replaced by now. One-way: the first
  // record is the only time there is nothing to show.
  document.body.classList.remove('booting');
  if (debugging) paintDebug(cut);
  announce(cut);
}

// ---------------------------------------------------------------------------
// ?debug — the seam back to the bench
// ---------------------------------------------------------------------------

/** Whether the address bar asked for the developer row. */
const debugging = new URLSearchParams(location.search).has('debug');

/**
 * This record, as a link to the page with every control on it.
 *
 * Built from the options the generator was actually handed rather than from
 * `song.meta`, and spoken in `web/main.ts`'s own link vocabulary so the two
 * pages go on describing a song in the same words.
 *
 * One field does not survive the trip: `targetSeconds`. The bench has no link
 * key for a target length, so a station that sets one — `longwave` and three
 * others — opens over there at whatever length its form comes out at. Same key,
 * same tempo, same instruments, different number of bars. Everything else is
 * exact.
 */
function studioUrl(cut: Cut): string {
  const o = cut.opts;
  const p = new URLSearchParams();
  if (o.seed !== undefined) p.set('seed', String(o.seed));
  for (const [key, value] of [
    ['genre', o.genre], ['era', o.era], ['style', o.style], ['mood', o.mood],
  ] as const) {
    if (value) p.set(key, value);
  }
  // The bench's select holds hook *ids*; `recordOptions` works in levels, and a
  // number here would not match any option and would be dropped on arrival.
  const hook = HOOK_LEVELS.find((l) => l.level === o.hook)?.id;
  if (hook) p.set('hook', hook);
  p.set('vocals', o.vocals ? 'sung' : 'instrumental');
  if (o.chaos?.levels?.length) {
    p.set('chaos', o.chaos.levels.join(','));
    if (o.chaos.spread !== undefined) p.set('spread', o.chaos.spread.toFixed(2));
  }
  return `/?${p.toString()}`;
}

function paintDebug(cut: Cut): void {
  els.debug.hidden = false;
  els.debugOpen.href = studioUrl(cut);
  els.debugRef.textContent = `${cut.station.id}.${Math.round(cut.wander * 100)}.${cut.token}`;
  els.debugCopy.textContent = 'Copy link';
}

els.debugCopy.onclick = () => {
  const url = new URL(els.debugOpen.getAttribute('href') ?? '/', location.origin).href;
  // Says whether it worked on the control that was pressed, and puts itself
  // back — a copy that silently failed is worse than one that says so.
  void navigator.clipboard.writeText(url).then(
    () => { els.debugCopy.textContent = 'Copied'; },
    () => { els.debugCopy.textContent = 'Copy failed'; },
  ).finally(() => {
    window.setTimeout(() => { els.debugCopy.textContent = 'Copy link'; }, 1600);
  });
};

/**
 * The bar's two colours are the record's key.
 *
 * Hue from the tonic, so the twelve keys are twelve colours and a station that
 * stays in one of them looks like it. The second hue is a near neighbour in
 * major and most of the way round the wheel in minor — which is the one thing
 * about a piece a listener hears in the first bar, and the only reason to pick
 * the pairing off the mode rather than off another random number.
 */
function paintKey(song: Song): void {
  const hue = (song.meta.tonic * 30 + 10) % 360;
  const away = song.meta.mode === 'major' ? 40 : 195;
  const root = document.documentElement.style;
  root.setProperty('--hue', String(hue));
  root.setProperty('--hue-2', String((hue + away) % 360));
}

/**
 * Hand the record to the OS.
 *
 * Twenty lines, and the difference between a browser tab and something with
 * lock-screen controls, a title on the car stereo and a skip on the headphones.
 * Guarded because support has moved more than once and a station that threw
 * here would be a station that did not play.
 */
function announce(cut: Cut): void {
  if (!('mediaSession' in navigator)) return;
  try {
    const { meta } = cut.song;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: meta.title,
      artist: cut.station.name,
      album: `${meta.genreLabel} · ${meta.styleLabel}`,
    });
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  } catch (err) {
    console.warn('radio: the lock screen would not take the record', err);
  }
}

// ---------------------------------------------------------------------------
// Writing records
// ---------------------------------------------------------------------------

async function write(st: Station, w: number, token: string): Promise<Cut> {
  const opts = recordOptions(st, w, token, voice);
  const song = await generateSongAsync(opts);
  // Rendered here rather than in the changeover: it is single-figure
  // milliseconds, but the gap between two records has none to spare.
  return { station: st, wander: w, token, song, opts, code: renderStrudel(withoutSungVoice(song)) };
}

/**
 * Cue the next record over the top of this one.
 *
 * Generation is tens of milliseconds on a worker and the render is single
 * figures, so neither is why this exists. `preloadSounds` is why: it is network,
 * and a station that changes genre between records asks for a band nobody has
 * heard yet more often than not. Done here it happens under music, where
 * latency costs nothing.
 */
function cueNext(): void {
  const st = station;
  const w = wander;
  pending = (async () => {
    try {
      const next = await write(st, w, newToken());
      await preloadSounds(next.song);
      return next;
    } catch (err) {
      console.warn('radio: could not cue the next record in advance', err);
      return undefined;
    }
  })();
}

/**
 * Throw away a cued record because the recipe changed under it.
 *
 * A record written for the station you were on two seconds ago is a preload
 * that bought nothing, and playing it after the settings moved would be the
 * settings appearing not to work.
 */
function recue(): void {
  pending = undefined;
  if (playing) cueNext();
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

/** Wait until a `performance.now()` reading, or not at all if it has passed. */
function until(mark: number): Promise<void> {
  const ms = mark - performance.now();
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => { window.setTimeout(resolve, ms); });
}

interface Handover {
  /**
   * A floor on the downbeat, not a delay before starting work. The compile runs
   * *before* this is waited on, so a compile that ate the whole window starts
   * the moment it finishes: the gap is the longer of the ring and the compile
   * rather than the two added together.
   */
  notBefore: number;
  /**
   * The fader was already pulled before the gap started — a skip pulls it — so
   * the floor above has been spent in silence and there is nothing left to fade.
   * An unfaded handover is the ring-out, which sounds at full level and is taken
   * down at the end of it instead. Either way the fader is at zero by the time
   * the last record is cut, and comes back up on the downbeat.
   */
  faded: boolean;
}

async function play(cut: Cut, handover?: Handover): Promise<void> {
  const mine = ++generation;
  try {
    if (!handover) {
      // Nothing is sounding to hide the wait behind, so the button says so for
      // the whole of it. On a handover there is nothing to report: the previous
      // record is still ringing and the station is audibly still playing.
      loading = true;
      paintPlay();
    }
    await preloadSounds(cut.song);
    if (mine !== generation) return;

    if (handover) {
      /**
       * The compile, in the one window where a blocked main thread costs
       * nothing. `skip` and `advance` have both already stopped the scheduler,
       * so there is nothing here to starve; the last chord is ringing on the
       * audio clock, which this thread cannot reach and does not need to.
       */
      await loadCode(cut.code);
      if (mine !== generation) return;
      await until(handover.notBefore);
      if (mine !== generation) return;
      if (!handover.faded) {
        // The ring-out has had its full length at full level; this is the last
        // sliver of it, taken down so the cut below lands on silence.
        setOutputLevel(0, TAIL_FADE_SECONDS);
        await until(performance.now() + TAIL_FADE_SECONDS * 1000);
        if (mine !== generation) return;
      }
      /**
       * The record that was playing stops here — actually stops, rather than
       * being hidden by the fader that is about to come back up. Without this,
       * a held final chord and its reverb ride the fader's return into the next
       * record's opening bar, which is the one thing a changeover must not do.
       */
      sungVoice.end();
      silenceVoices();
      setOutputLevel(volume, 0.08);
      await startLoaded();
    } else {
      // Back up in case the last thing that happened was a stop. Unconditional:
      // a fader left down by any route is silence nobody can explain.
      setOutputLevel(volume);
      await playCode(cut.code);
    }

    sungVoice.begin(cut.song);
    current = cut;
    playing = true;
    paused = false;
    loading = false;
    paintPlay();
    clearError();
    describe(cut);
    schedule(cut);
  } catch (err) {
    playing = false;
    loading = false;
    paintPlay();
    showError('That record would not play. Press next for another.');
    console.error(err);
  }
}

function stop(): void {
  generation += 1;
  sungVoice.end();
  /**
   * The sound stops as well as the scheduler.
   *
   * `stopPlayback` halts the scheduler and leaves whatever Web Audio already
   * holds to finish, which is exactly right for a changeover and is not what a
   * stop button means — a held final chord would go on for seconds after the
   * press and the page would look like it ignored the click. `stopSounding` is
   * the fader *and* the cut behind it, so nothing is left running to come back
   * up with the next press.
   */
  void stopSounding();
  void stopPlayback();
  playing = false;
  paused = false;
  loading = false;
  paintPlay();
  if (timer) { clearTimeout(timer); timer = undefined; }
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
}

/** How long a pause takes to fade down, and a resume to come back up. */
const PAUSE_FADE_SECONDS = 0.22;

/**
 * Hold the record where it is.
 *
 * Three things have to stop together and only one of them is Strudel.
 *
 *  - **The scheduler**, via `pausePlayback` rather than `stopPlayback`. The
 *    difference is one line inside Strudel and the whole difference here:
 *    `stop()` resets the tick and phase to zero, so resuming would start the
 *    record again from its top. `pause()` leaves them, and `startLoaded` picks
 *    up the bar it was in.
 *  - **What is already sounding**, via the master fader. Voices handed to Web
 *    Audio have their whole envelope scheduled on the audio clock and nothing
 *    in Strudel can recall them, so without this a held chord goes on for
 *    seconds over a transport that has visibly stopped.
 *  - **The changeover timer**, which is wall-clock and knows nothing about any
 *    of this. Left running it would advance to the next record while this one
 *    sat paused.
 *
 * The singer needs no help: `sung-voice.ts` schedules against the scheduler's
 * own clock and gives up early whenever it reports `!started`, so she stalls
 * with the band and comes back with it.
 */
function pause(): void {
  if (!playing) return;
  heldMs = Math.max(0, endsAt - performance.now());
  if (timer) { clearTimeout(timer); timer = undefined; }
  setOutputLevel(0, PAUSE_FADE_SECONDS);
  void pausePlayback();
  playing = false;
  paused = true;
  paintPlay();
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
}

/** Put the needle back down where it lifted. */
async function resume(): Promise<void> {
  if (!paused || !current) return;
  const mine = generation;
  setOutputLevel(volume, PAUSE_FADE_SECONDS);
  await startLoaded();
  // A stop or a skip landing during the resume owns the transport now.
  if (mine !== generation) return;
  playing = true;
  paused = false;
  paintPlay();
  // What was left of the record when it was held, not the whole of it again.
  endsAt = performance.now() + heldMs;
  timer = window.setTimeout(() => { void advance(); }, heldMs);
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
}

/**
 * Seconds of air between two records.
 *
 * The last bar is a held chord, and stopping the scheduler leaves it ringing —
 * so this gap *is* the ending, and it is the beat of air a station leaves
 * between records rather than a wait for anything.
 */
const RING_OUT_SECONDS = 1.8;

/**
 * …and how long the very end of that ring is faded over.
 *
 * The gap is the ending, so it sounds at full level for all of `RING_OUT_SECONDS`
 * — but what is left at the end of it is then cut outright rather than left to
 * bleed into the next record, and a cut on a signal that is still moving is a
 * click. Short enough to be heard as the ending stopping rather than as a fade.
 */
const TAIL_FADE_SECONDS = 0.12;

/** How long a skip's fade takes. Short enough to feel like a press. */
const SKIP_FADE_SECONDS = 0.18;

function schedule(cut: Cut): void {
  if (timer) clearTimeout(timer);
  const ms = durationMs(cut.song);
  endsAt = performance.now() + ms;
  timer = window.setTimeout(() => { void advance(); }, ms);
  // …and write the one after it now, while there is a record's worth of time to
  // do it in. Returns immediately.
  cueNext();
}

/**
 * One record ends and the next begins.
 *
 * The generation is *read* rather than bumped: this is not a press, it is the
 * press that started this record carrying on into the next. What the checks
 * guard against is Stop landing during the ring-out, after the timer that got
 * us here has already fired.
 */
async function advance(): Promise<void> {
  const mine = generation;
  void stopPlayback();
  await changeover(mine, performance.now() + RING_OUT_SECONDS * 1000, false);
}

/**
 * Something else, now.
 *
 * A changeover with the ring-out taken out: somebody has said they do not want
 * to hear the end of this one. The fader is pulled first so the cut does not
 * sound like a crash, and the floor is only as long as that fade — what is left
 * is the compile, which is the same limit every other route into `play` has.
 */
async function skip(): Promise<void> {
  if (!playing) { void nextCold(); return; }
  const mine = generation;
  setOutputLevel(0, SKIP_FADE_SECONDS);
  void stopPlayback();
  await changeover(mine, performance.now() + SKIP_FADE_SECONDS * 1000, true);
}

async function changeover(mine: number, notBefore: number, faded: boolean): Promise<void> {
  const cued = await pending;
  // Consumed either way — whatever happens next ends in `play`, which cues
  // another against whatever the settings say by then.
  pending = undefined;
  if (mine !== generation) return;

  let next = cued;
  if (!next) {
    try {
      next = await write(station, wander, newToken());
    } catch (err) {
      showError('The generator stopped. Reload to start it again.');
      console.error(err);
      return;
    }
  }
  if (mine !== generation) return;
  await play(next, { notBefore, faded });
}

/** A record from a standing start — nothing is playing and nothing is ringing. */
async function nextCold(): Promise<void> {
  loading = true;
  paintPlay();
  try {
    const cued = await pending;
    pending = undefined;
    const cut = cued ?? await write(station, wander, newToken());
    current = cut;
    describe(cut);
    await play(cut);
  } catch (err) {
    loading = false;
    paintPlay();
    showError('The generator stopped. Reload to start it again.');
    console.error(err);
  }
}

// ---------------------------------------------------------------------------
// Stations
// ---------------------------------------------------------------------------

const STATION_KEY = 'radio.station';
const WANDER_KEY = 'radio.wander';
const VOICE_KEY = 'radio.voice';
/** The last calendar day this page was opened on. See `openingStation`. */
const DAY_KEY = 'radio.day';

/**
 * Today, in the listener's own timezone.
 *
 * Local rather than an ISO/UTC stamp on purpose: "the day has changed" is a
 * claim about the person, and someone opening the page at eleven at night in
 * Helsinki has not reached tomorrow because London says so.
 */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * Which station a cold open lands on.
 *
 * A station is remembered *within* a day and redrawn across one. Keeping it for
 * ever means the first thing anybody ever pressed becomes the only thing they
 * hear; redrawing every load means the page never settles and a refresh loses
 * your place mid-listen. A day is the unit that behaves like a radio you left
 * switched on and came back to tomorrow.
 *
 * The draw excludes what was on yesterday, so "a new day" is always audibly a
 * new day rather than a coin that came up the same eight times running.
 */
function openingStation(): Station {
  const saved = localStorage.getItem(STATION_KEY);
  const last = saved ? getStation(saved) : undefined;
  if (last && localStorage.getItem(DAY_KEY) === today()) return last;
  const pool = STATIONS.filter((s) => s.id !== last?.id);
  return pool[Math.floor(Math.random() * pool.length)] ?? STATIONS[0];
}

function paintStations(): void {
  els.stations.querySelectorAll('button').forEach((b) => {
    b.setAttribute('aria-current', String(b.dataset.id === station.id));
  });
}

/**
 * Tune. Immediate, because that is what a station button is for — a station you
 * have to confirm is a dropdown.
 */
function tune(next: Station): void {
  if (next.id === station.id) return;
  station = next;
  try { localStorage.setItem(STATION_KEY, next.id); } catch { /* private mode */ }
  paintStations();
  pending = undefined;
  if (playing) { void skip(); return; }
  // A held record belongs to the station you have just left, and resuming it
  // would be the dial appearing not to work. Let it go and show what the new
  // station would play instead.
  if (paused) stop();
  void refreshIdle();
}

/** Show what the new station would play, without starting it. */
async function refreshIdle(): Promise<void> {
  try {
    const cut = await write(station, wander, newToken());
    if (playing) return;
    current = cut;
    describe(cut);
  } catch (err) {
    console.warn('radio: could not write a record for the new station', err);
  }
}

function buildStations(): void {
  els.stations.replaceChildren(...STATIONS.map((s) => {
    const b = document.createElement('button');
    // The label sits in its own inline box so it can be slid inside the clipped
    // one when it does not fit. See `fitStationLabels`.
    b.innerHTML = '<b></b><span><i></i></span>';
    b.querySelector('b')!.textContent = s.name;
    b.querySelector('span > i')!.textContent = sourceLabel(s);
    b.dataset.id = s.id;
    b.onclick = () => { tune(s); showStations(false); };
    return b;
  }));
  fitStationLabels();
}

/**
 * Mark the genre lines that are too wide for their card, so they slide.
 *
 * Measured rather than guessed at, because whether "Ambient · Synth · Classical"
 * fits depends on the column count, which depends on the width of the screen.
 * Only the ones that overflow are animated; the rest are ordinary static text.
 *
 * Safe to run while the panel is hidden — it is `visibility: hidden` and
 * translated off, both of which still lay out, unlike `display: none`.
 */
function fitStationLabels(): void {
  els.stations.querySelectorAll<HTMLElement>('span').forEach((span) => {
    const inner = span.firstElementChild as HTMLElement | null;
    if (!inner) return;
    span.classList.remove('scroll');
    const over = Math.ceil(inner.scrollWidth - span.clientWidth);
    if (over <= 1) return;
    span.style.setProperty('--shift', `${-over}px`);
    // A reading speed rather than a fixed duration, so a label twice as long
    // over takes about twice as long to cross.
    span.style.setProperty('--dur', `${(6 + over / 10).toFixed(1)}s`);
    span.classList.add('scroll');
  });
}

/**
 * Re-measure when the column count can have changed.
 *
 * Debounced because a desktop drag-resize fires this continuously, and each
 * pass reads layout for eight elements.
 */
let refit: number | undefined;
window.addEventListener('resize', () => {
  window.clearTimeout(refit);
  refit = window.setTimeout(fitStationLabels, 150);
});
// Web fonts land after first layout and change every one of these widths.
if (document.fonts?.ready) void document.fonts.ready.then(fitStationLabels);

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/**
 * What each stretch of the slider actually does.
 *
 * Two settings move and the readout names them rather than evoking them: the
 * hook level goes one step either way across the range, and chaos does not
 * start at all below `CHAOS_FROM` — which is why the lower two say nothing
 * about borrowing. `web/main.ts` glosses its own levels the same way.
 */
const VARIETY: readonly { from: number; name: string; gloss: string }[] = [
  { from: 0, name: 'Repetitive', gloss: '' },
  { from: 0.3, name: 'Default', gloss: '' },
  { from: 0.56, name: 'Mixed', gloss: '' },
  { from: 0.8, name: 'Wild', gloss: '' },
];

function paintWander(): void {
  els.wander.value = String(Math.round(wander * 100));
  els.wander.style.setProperty('--fill', `${wander * 100}%`);
  // Last band whose floor this clears — the table is in ascending order.
  const band = [...VARIETY].reverse().find((v) => wander >= v.from) ?? VARIETY[0]!;
  els.wanderName.textContent = band.name;
  els.wanderGloss.textContent = band.gloss;
}

function paintVoice(): void {
  els.voice.querySelectorAll('button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.voice === voice));
  });
}

// ---------------------------------------------------------------------------
// Volume
// ---------------------------------------------------------------------------

const VOLUME_KEY = 'radio.volume';

function paintVolume(): void {
  els.volume.value = String(Math.round(volume * 100));
  // On the container rather than the input: the bar is drawn by `.vol-pop`'s
  // own pseudo-element, which can only see a value set on an ancestor.
  els.vol.style.setProperty('--fill', `${volume * 100}%`);
  // The speaker's arcs are the level, so the button says where it is set
  // without the slider having to be showing.
  els.volBtn.dataset.level = volume === 0 ? '0' : volume < 0.5 ? '1' : '2';
}

function showVolume(open: boolean): void {
  els.vol.classList.toggle('open', open);
  els.volBtn.setAttribute('aria-expanded', String(open));
}

els.volume.oninput = () => {
  volume = Number(els.volume.value) / 100;
  paintVolume();
  try { localStorage.setItem(VOLUME_KEY, els.volume.value); } catch { /* private mode */ }
  // Only while something is sounding: off-air the fader is held at 0 by `stop`,
  // and moving it here would start leaking the next record's opening bar.
  if (playing) setOutputLevel(volume, 0.05);
};

els.volBtn.onclick = (e) => {
  e.stopPropagation();
  showVolume(!els.vol.classList.contains('open'));
};

/** Hover opens it, where there is a pointer to hover with. */
if (window.matchMedia('(hover: hover)').matches) {
  let closing: number | undefined;
  els.vol.addEventListener('pointerenter', () => {
    window.clearTimeout(closing);
    showVolume(true);
  });
  els.vol.addEventListener('pointerleave', () => {
    window.clearTimeout(closing);
    // Just enough grace to cross the few pixels between the button and the
    // slider under it. Longer than that and the pill reads as stuck to the
    // cursor, hanging about after the pointer has plainly gone elsewhere.
    closing = window.setTimeout(() => showVolume(false), 140);
  });
}

document.addEventListener('click', (e) => {
  if (!els.vol.classList.contains('open')) return;
  const target = e.target as Node | null;
  if (target && els.vol.contains(target)) return;
  showVolume(false);
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

els.openSettings.onclick = () => els.settings.showModal();
els.closeSettings.onclick = () => els.settings.close();
// Clicking the backdrop closes it: the dialog itself fills none of that area,
// so a press landing on `dialog` rather than on a child is a press outside.
els.settings.onclick = (e) => { if (e.target === els.settings) els.settings.close(); };

els.voice.onclick = (e) => {
  const picked = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-voice]');
  if (!picked) return;
  voice = picked.dataset.voice as VoicePolicy;
  try { localStorage.setItem(VOICE_KEY, voice); } catch { /* private mode */ }
  paintVoice();
  // Takes effect on the next record rather than this one. Nothing audible
  // changes under the listener.
  recue();
};

els.wander.oninput = () => {
  wander = Number(els.wander.value) / 100;
  paintWander();
  try { localStorage.setItem(WANDER_KEY, els.wander.value); } catch { /* private mode */ }
  recue();
};

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

/**
 * One button, four meanings, and only one of them is "stop".
 *
 * A load is the odd one out: there is no record to hold, so the press calls the
 * load off outright rather than pausing something that has not started.
 */
function pressPlay(): void {
  if (loading) { stop(); return; }
  if (playing) { pause(); return; }
  if (paused) { void resume(); return; }
  if (current) void play(current);
  else void nextCold();
}

els.play.onclick = pressPlay;
els.skip.onclick = () => { void skip(); };

/**
 * The stations, shown or hidden.
 *
 * Their space is reserved either way — see `.stations-wrap` — so this only ever
 * fades, and nothing on the page moves.
 */
function showStations(open: boolean): void {
  document.body.classList.toggle('stations-open', open);
  els.stationsToggle.setAttribute('aria-expanded', String(open));
  if (!open) pinned = false;
}

/**
 * Was it opened by a press rather than by a hover?
 *
 * A pinned panel ignores the pointer leaving and stays until it is pressed off,
 * dismissed, or a station is chosen. This is what makes the control work with
 * no pointer at all: on a touch screen every open is a pinned one, because
 * there is no hover to hold it up.
 */
let pinned = false;
/**
 * When the panel was last opened, as a `performance.now()` reading.
 *
 * A touch screen can deliver a second `click` for one tap — the delayed
 * "ghost" click browsers still emit after `touchend`, landing wherever the
 * sheet has since slid to. Without this the sheet opened and shut again inside
 * the same tap, which reads as the button not working at all.
 */
let openedAt = 0;

els.stationsToggle.onclick = (e) => {
  // Kept from the document listener below, which would otherwise read the
  // press that opens the panel as a press outside it.
  e.stopPropagation();
  if (pinned) { showStations(false); return; }
  pinned = true;
  openedAt = performance.now();
  showStations(true);
};

/** A press anywhere else puts it away — including on the phone's scrim. */
document.addEventListener('click', (e) => {
  if (!pinned) return;
  // Still inside the tap that opened it.
  if (performance.now() - openedAt < 350) return;
  const target = e.target as Node | null;
  if (target && els.stationsWrap.contains(target)) return;
  showStations(false);
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (document.body.classList.contains('stations-open')) showStations(false);
});

/**
 * …and on hover, where there is a pointer to hover with.
 *
 * Reaching a list of eight things should not cost a press. Gated on
 * `(hover: hover)` because a touch screen reports `pointerenter` on the tap
 * that precedes the click, so on a phone this would open the panel and the
 * click would immediately shut it again.
 *
 * The close is deferred only when the pointer leaves *towards the other half of
 * the control* — down out of the button, or up out of the panel — because that
 * is the one direction where the gap between them has to be crossable. Leaving
 * any other way is someone going somewhere else, and waiting 400 ms to admit it
 * makes the panel feel stuck to the cursor.
 */
if (window.matchMedia('(hover: hover)').matches) {
  let shutting: number | undefined;
  const hold = (): void => { window.clearTimeout(shutting); shutting = undefined; };

  /** `down` for the button, which the panel sits under; `up` for the panel. */
  const leave = (el: HTMLElement, toward: 'down' | 'up') => (e: Event): void => {
    hold();
    // A pinned panel was asked for and stays until it is asked away.
    if (pinned) return;
    const box = el.getBoundingClientRect();
    const y = (e as PointerEvent).clientY;
    const crossing = toward === 'down' ? y >= box.bottom : y <= box.top;
    if (crossing) shutting = window.setTimeout(() => showStations(false), 400);
    else showStations(false);
  };

  for (const [el, toward] of [
    [els.stationsToggle, 'down'], [els.stationsWrap, 'up'],
  ] as const) {
    el.addEventListener('pointerenter', () => { hold(); showStations(true); });
    el.addEventListener('pointerleave', leave(el, toward));
  }
}

if ('mediaSession' in navigator) {
  const handlers: [MediaSessionAction, () => void][] = [
    ['play', () => { if (!playing) pressPlay(); }],
    ['pause', () => pause()],
    ['stop', () => stop()],
    ['nexttrack', () => { void skip(); }],
  ];
  for (const [action, handler] of handlers) {
    // Not every browser knows every action, and setting an unknown one throws.
    try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* unsupported */ }
  }
}

/**
 * A stored setting, or the default — told apart from a stored zero.
 *
 * `Number(null)` is 0, and 0 is a position the slider can legitimately be in,
 * so the unset case and the hard-left case are the same number. Tested for
 * absence before conversion, or the default silently becomes "keep it steady"
 * for everybody who has never opened the settings.
 */
function storedNumber(key: string, lo: number, hi: number): number | undefined {
  const raw = localStorage.getItem(key);
  if (raw === null) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= lo && n <= hi ? n : undefined;
}

async function boot(): Promise<void> {
  // Arm the audio stack's first-click listener before the user can reach Play.
  void initAudio().catch((err) => {
    showError('The audio engine would not start. Reloading usually fixes it.');
    console.error(err);
  });

  buildStations();

  const linked = new URLSearchParams(location.search).get('s');
  const fromLink = linked ? parseRef(linked) : undefined;

  try {
    const storedVoice = localStorage.getItem(VOICE_KEY);
    if (storedVoice === 'instrumental' || storedVoice === 'mixed' || storedVoice === 'sung') {
      voice = storedVoice;
    }
    if (fromLink) {
      station = fromLink.station;
      wander = fromLink.wander;
    } else {
      station = openingStation();
      /**
       * Pinned while the Variety control is hidden — see the shelved section in
       * the markup. Reading `WANDER_KEY` here would let a figure chosen before
       * the control disappeared go on shaping every record with nothing on the
       * page admitting to it. Restore the stored read when the control returns.
       */
      wander = DEFAULT_WANDER;
      // Written back even when nothing was redrawn, so the day rolls forward
      // with use rather than only when the station happens to change.
      localStorage.setItem(STATION_KEY, station.id);
      localStorage.setItem(DAY_KEY, today());
    }
    volume = (storedNumber(VOLUME_KEY, 0, 100) ?? 100) / 100;
  } catch { /* private mode: the defaults are already right */ }

  paintStations();
  paintWander();
  paintVoice();
  paintVolume();
  paintPlay();

  /**
   * Write the first record now, so the page has a title before anybody presses
   * anything — but do not make a noise. The browser would not allow it, and a
   * page that began playing because somebody opened it is a page nobody trusts.
   */
  try {
    const cut = await write(station, wander, fromLink?.token ?? newToken());
    current = cut;
    describe(cut);
    els.skip.disabled = false;
    loading = false;
    paintPlay();
    void preloadSounds(cut.song);
  } catch (err) {
    loading = false;
    paintPlay();
    showError('The generator would not start. Reloading usually fixes it.');
    console.error(err);
  }
}

void boot();
