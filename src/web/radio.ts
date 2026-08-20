/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The listener's page. Twelve stations, three buttons, everything else behind a
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
  getSpectrum, initAudio, installBand, pausePlayback, preloadSounds, setOutputLevel,
  silenceVoices, stageBand, startLoaded, stopPlayback, stopSounding, warmBand,
  type StagedBand,
} from './audio.js';
import { generateSongAsync } from './generator.js';
import {
  mountGlowField, mountLamp, type GlowField, type Lamp, type SpectrumMode,
} from './glow-field.js';
import { createSungVoice, withoutSungVoice } from './sung-voice.js';
import { CLOUD_MS } from './title-cloud.js';
import { inkReady, readTitleInk } from './title-ink.js';

import { Rng } from '../core/rng.js';
import { songDurationBeats, type Song } from '../core/types.js';
import type { GenerateOptions } from '../generate/song.js';
import { HOOK_LEVELS } from '../generate/hook.js';
import { renderStrudelParts, type StrudelParts } from '../render/strudel.js';
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
  stationsGrip: $<HTMLDivElement>('stations-grip'),
  settings: $<HTMLDialogElement>('settings'),
  settingsGrip: $<HTMLDivElement>('settings-grip'),
  openSettings: $<HTMLButtonElement>('open-settings'),
  closeSettings: $<HTMLButtonElement>('close-settings'),
  voice: $<HTMLDivElement>('voice'),
  glowMode: $<HTMLDivElement>('glow-mode'),
  glowRange: $<HTMLDivElement>('glow-range'),
  hdrSection: $<HTMLElement>('hdr'),
  hdrFlag: $<HTMLParagraphElement>('hdr-flag'),
  hdrFlagBrand: document.querySelectorAll<HTMLElement>('.flag-brand'),
  hdrFlagUrl: $<HTMLElement>('hdr-flag-url'),
  hdrFlagCopy: $<HTMLButtonElement>('hdr-flag-copy'),
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
  parts: StrudelParts;
  /** The same record compiled, once anybody has asked for it. See `bandFor`. */
  staged?: Promise<StagedBand>;
}

let station: Station = STATIONS[0];
let wander = DEFAULT_WANDER;
let voice: VoicePolicy = 'instrumental';
/**
 * Where the fader sits until somebody moves it. The markup carries the same
 * figure as the slider's own `value`, so the control is in the right place on
 * the first paint rather than snapping there when `paintVolume` runs.
 */
const DEFAULT_VOLUME = 0.8;
/**
 * The listener's own fader, 0..1, over everything the master already does.
 *
 * There is no `<audio>` element to hang a system volume off — the mix is
 * assembled in Web Audio — so this is the only volume this page has, and every
 * place that brings the sound back up has to bring it back to *this* rather
 * than to 1. See `setOutputLevel`.
 *
 * Opens at four fifths rather than at the top, which is the one setting on this
 * page that can only be found by looking for it: a listener who wants it louder
 * has somewhere to go, where a fader already at its ceiling can only ever
 * disappoint. The master is mixed to sit under a limiter with headroom to
 * spare, so this costs nothing audible.
 */
let volume = DEFAULT_VOLUME;
let current: Cut | undefined;
let playing = false;
/**
 * Whether the transport is fetching, compiling or otherwise not yet able to
 * make a noise.
 *
 * Opens `true`, matching the `data-state="load"` the markup carries and the
 * placeholders standing in for the title: writing the first record *is* a load,
 * and a page that offered a triangle over three grey bars was offering to play
 * something that did not exist yet. See `opening` for why a press there cannot
 * mean what it means during every other load.
 */
let loading = true;
/**
 * Whether that first record is still the one being waited for.
 *
 * `loading` covers the wait so the button breathes rather than lying, but a
 * press inside it cannot be the stop that a press during any other load is:
 * there is nothing to call off, and somebody who presses Play on a page that has
 * only just opened has plainly asked for music. So it is remembered and answered
 * when the record lands.
 */
let opening = true;
/** Somebody pressed Play while the page was still opening. See `opening`. */
let wanted = false;
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
  const state = loading ? 'load' : playing ? 'pause' : 'play';
  if (els.play.dataset.state === 'load' && state !== 'load') releaseBreath();
  els.play.dataset.state = state;
  els.play.setAttribute('aria-label', loading ? 'Loading' : playing ? 'Pause' : 'Play');
  // The glow reads this, and it is the whole of what drives it: lit and
  // breathing while the flag is set, grey when it is not. See `.glow`.
  document.body.classList.toggle('playing', playing);
  // A station that is on with no record on it yet: the page drains its colour
  // and gets it back on the button's own clock. See `body.waiting`.
  const waiting = playing && loading;
  if (document.body.classList.contains('waiting') && !waiting) releaseDrain();
  document.body.classList.toggle('waiting', waiting);
  // The class dims the field; this stops it being a live thing underneath the
  // dimming — a grey bar that still emits gas and still tears under the cursor
  // is only pretending to be off. The CSS cannot say that, so it is said here.
  glowField?.setPlaying(playing);
  // And the button's own light, which spends the screen's range on the same
  // condition the title does: there is a record on. See `mountLamp`.
  lamp?.setPlaying(playing);
}

/**
 * Hand the button's opacity back from the load breath to the stylesheet.
 *
 * The breath is a CSS animation hung off `[data-state="load"]`, so leaving the
 * state drops it — and a dropped animation does not reliably start a
 * transition out of the value it was last drawn at. The button was simply at
 * .6 in one frame and 1 in the next, which is the one moment in the whole
 * sequence the eye is guaranteed to be on the button.
 *
 * So the value is pinned to wherever the breath had got to *before* the state
 * changes, and let go a frame later. An animation outranks an inline style, so
 * pinning it early costs nothing while the breath is still running; when the
 * animation goes, the inline value is already underneath it, and clearing that
 * is an ordinary style change the `opacity` transition on `.controls button`
 * can pick up. Two frames of bookkeeping for the fade the CSS should have
 * given for free.
 */
function releaseBreath(): void {
  els.play.style.opacity = getComputedStyle(els.play).opacity;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { els.play.style.opacity = ''; });
  });
}

/**
 * Hand the page's colour back from the wait drain to the stylesheet.
 *
 * The same two frames of bookkeeping as `releaseBreath`, and for the same
 * reason: the drain is an animation hung off a class, and dropping it snaps the
 * filter rather than transitioning out of it. Pinned before the class goes and
 * cleared a frame later, onto the `filter` transition each of these already
 * carries.
 */
function releaseDrain(): void {
  const drained = document.querySelectorAll<HTMLElement>('.title, .sub, .era, .glow, .glow-field');
  drained.forEach((el) => { el.style.filter = getComputedStyle(el).filter; });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { drained.forEach((el) => { el.style.filter = ''; }); });
  });
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
  // Both immediate, and neither is part of the page's own choreography: the lock
  // screen is the OS's business and the debug row is a developer's. The two that
  // are — the key and the lines — go together, inside `showLines`.
  if (debugging) paintDebug(cut);
  announce(cut);
  showLines(cut);
}

/**
 * How long the lines take to leave, and how long the title takes to come back.
 *
 * Separate figures because none of them is the same gesture, and every one of
 * them is the particles': the leaving traces a name dropping to a tenth of
 * itself, the arriving traces one condensing back out of the field, and the
 * beat between is what keeps the first record's reveal legible — the
 * placeholders are fading out across it, and two fades starting on the same
 * frame read as one thing changing rather than as one leaving and another
 * coming.
 *
 * Only the last two are spent on that first record, where there is no outgoing
 * title to clear. See `showLines`.
 *
 * Every one is stated again in the stylesheet and the two sets have to agree —
 * these decide when the *text* is swapped and how long the page has to wait for
 * the lines before it may block the main thread; the CSS decides what any of it
 * looks like.
 */
const LINES_OUT_MS = 450;
const LINES_WAIT_MS = 100;
const LINES_IN_MS = 620;
/**
 * And the genre and era with it: how long they wait, and how long they take.
 *
 * A shade ahead of the title rather than behind it — see the stylesheet — so
 * the name, not these two, is the end of the span the page may not be
 * interrupted for. `LINES_MS` takes whichever of the pair finishes last, which
 * is what keeps that true if either figure moves again.
 */
const LINES_SUB_MS = 80;
const LINES_SUB_IN_MS = 580;

/**
 * The whole changeover, from the old title beginning to leave to the new one
 * being fully up — and the bar's turn to the new key is the same span, begun on
 * the same call. That is what makes the two one gesture rather than two things
 * that happen near each other. The stylesheet and `KEY_MS` in `web/glow-field.ts`
 * both carry it as .59s.
 *
 * It is also how long the page may not be interrupted for. Neither half of the
 * turn is composited — the CSS one repaints a gradient through `var(--hue)`, the
 * field's runs on `requestAnimationFrame` — so both stop dead under a blocked
 * main thread, where the lines' own fade would have carried on. `arm` waits this
 * long before it compiles anything. See there.
 */
const LINES_MS = LINES_OUT_MS
  + Math.max(LINES_WAIT_MS + LINES_IN_MS, LINES_SUB_MS + LINES_SUB_IN_MS);

/** The swap in progress, if any, so a second record does not land inside it. */
let swapping: number | undefined;
/**
 * When the three lines were last taken out, which is not always here.
 *
 * A skip takes them out at the press and most of the leaving is spent under the
 * compile; what is left of it by the downbeat is all the text swap has to wait
 * for. See `skip`.
 */
let linesOutAt = 0;
/**
 * Whose lines are up, or on their way up.
 *
 * Two routes describe a record twice — `nextCold` names it before handing it to
 * `play`, which names it again on the downbeat, and `boot` does the same for a
 * press that arrived while the page was opening. Both were free when the text was
 * simply assigned. A swap is not free: it would fade the title that had just
 * arrived out and bring the identical one back.
 */
let shown: Cut | undefined;
/**
 * When the lines now arriving will have arrived, as a `performance.now()`.
 *
 * Read by `arm`, which has a compile to run and must not run it through the
 * reveal. See there.
 */
let linesBy = 0;

/**
 * Put a record's three lines up, over the top of whatever was there.
 *
 * Out and then in on the same three elements rather than a cross-fade between
 * two copies of them, which would need a second set of nodes in the layout and
 * is the one thing this page will not spend: the title box reserves two lines
 * and the genre box two, and nothing on the page may move when a record changes.
 *
 * One class, and it is taken off rather than answered by a second one: the lines
 * are already at nothing when the text under them is swapped, so letting the
 * class go is the arrival. Nothing has to be pinned for a frame first, which is
 * what a swap that *moved* would have needed — see `releaseBreath` for what that
 * costs.
 *
 * The first record is the one case that is a real cross-fade, and it gets one
 * for free: the placeholders are painted on the *boxes* rather than on the
 * lines, so they are a layer the lines' own fade cannot reach. There is nothing
 * to get out of the way and no out-half to wait through — the text goes up at
 * once, and the bars leave over it as it arrives. See the skeleton rules in
 * `radio.html`.
 */
function showLines(cut: Cut): void {
  if (shown === cut) return;
  shown = cut;
  /**
   * The bar starts turning as the old title starts leaving, and arrives with the
   * new one — one movement across the whole changeover rather than a colour that
   * follows a name.
   *
   * It was painted at the top of `describe` once, which is the downbeat, and ran
   * for 1.8 s: the bar changed key under the previous record's name and was
   * still changing it a second after the new one had settled. The boot is the
   * one case where the two lengths differ — there is no title to clear, so the
   * lines are up in .4s and the turn takes the full .59s — and a hue arriving
   * fractionally late once a page load is not worth a second figure to carry.
   */
  paintKey(cut.song);
  // A record landing inside another one's arrival takes it over from wherever it
  // had got to: the class going back on turns the fade around rather than
  // starting a second one underneath it.
  window.clearTimeout(swapping);
  swapping = undefined;
  /**
   * The first record is the placeholders' own reveal and the cloud stays out of
   * it: the bars narrow onto the words and the words come up under them, which
   * is a gesture about a page finishing loading rather than about a name being
   * replaced. There is no name to replace yet.
   */
  const booting = document.body.classList.contains('booting');
  // Taken over from wherever the last one had got to, exactly as the fade is.
  // Somebody who has asked for less movement keeps the particles and is not
  // handed back the element's own words — nothing evaporates, and the title is
  // put up where it belongs and faded in.
  //
  // A skip has already asked for this at the press, and asking twice does
  // nothing; a record that ended has not, and this is where it happens. See
  // `skip`.
  const cloud = booting || STILL?.matches ? null : titleCloud();
  cloud?.release();
  /**
   * Both branches are held for the whole span, not for the half of it their own
   * text spends: the turn is the longer thing here, and it is the thing a
   * compile would freeze. See `LINES_MS`.
   *
   * The cloud is longer than the turn and is held for its own length, because
   * it is the least interruptible thing on the page — the fade is composited
   * and survives a blocked main thread, and a simulation on
   * `requestAnimationFrame` stops dead in the middle of it.
   */
  /**
   * A record that ended is taking the lines out here; a skip took them out at
   * the press; the first record has nothing up to take out.
   *
   * The text is swapped when the leaving is over and not a fixed wait after
   * this, which is the difference between the two: a skip has already spent
   * most of it under the compile, so what is left is usually nothing and the
   * new words start arriving on the downbeat itself.
   */
  if (!booting && !document.body.classList.contains('text-out')) {
    document.body.classList.add('text-out');
    linesOutAt = performance.now();
  }
  // Whatever is left of the leaving, which is all of it for a record that ended
  // and whatever the compile did not already spend for a skip.
  const left = booting ? 0 : Math.max(0, linesOutAt + LINES_OUT_MS - performance.now());
  linesBy = performance.now() + (cloud ? Math.max(LINES_MS, left + CLOUD_MS) : LINES_MS);
  if (left <= 0) {
    writeLines(cut);
    return;
  }
  swapping = window.setTimeout(() => {
    swapping = undefined;
    writeLines(cut);
  }, left);
}

/**
 * Somebody who has asked for less movement, for whom a title that comes apart
 * into gas is precisely the thing being asked against.
 */
const STILL = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;

/**
 * Whether the fonts the title will be drawn in are the ones it was measured
 * against. Rasterising before they land bakes a fallback face into the cloud.
 */
let inkable = false;

/**
 * The cloud, where there is one and it is allowed to have the pixels.
 *
 * Asked for each time rather than kept, because every one of the answers can
 * change mid-hour: the field is dropped when the setting says plain and when
 * the context is lost, and the motion query is a system preference.
 */
function titleCloud(): ReturnType<GlowField['title']> {
  if (!inkable) return null;
  return glowField?.title() ?? null;
}

/**
 * Hand the cloud the title that is now in the document, and say so on the body.
 *
 * The class is what makes the element's own text transparent, and it goes on
 * only once there is actually a cloud holding ink to replace it — a title that
 * could not be read back is a title the page must keep painting itself.
 */
function handTitleOver(): void {
  const cloud = titleCloud();
  if (!cloud) {
    document.body.classList.remove('title-live');
    return;
  }
  const ink = readTitleInk(els.title, Math.min(window.devicePixelRatio || 1, 2));
  // Nothing readable is not a reason to hand the pixels back. Before the first
  // record there is no title to take, and after it a reading that failed would
  // put the element's own words up in place of the particles — which the page
  // is not going to do, because the particles are what can be lit.
  if (!ink) return;
  cloud.arrive(ink);
  document.body.classList.add('title-live');
}

void inkReady().then(() => {
  inkable = true;
  // The first record can land before the fonts do, and it is the page that has
  // been painting it until now.
  handTitleOver();
});

/**
 * Put the three lines back after a changeover that never arrived.
 *
 * A skip lets them all go at the press, before there is a record to put in
 * their place — so every way out that does not reach `writeLines` has to hand
 * back what is still in the document, or the page keeps the space and shows
 * nothing standing in it.
 */
function keepLines(): void {
  document.body.classList.remove('text-out');
  handTitleOver();
}

function writeLines(cut: Cut): void {
  const { meta } = cut.song;
  els.title.textContent = meta.title;
  els.sub.textContent = `${meta.genreLabel} · ${meta.styleLabel}`;
  // `eraLabel` is where the year lives — "1960s–70s tanssilava", "1972–77
  // modular", "Romantic, c. 1870". The shape varies by genre because the
  // periods do, and it is the era's own sentence rather than one assembled out
  // of its `year` here.
  els.era.textContent = meta.eraLabel;
  // The placeholders have something to be replaced by now. One-way: the first
  // record is the only time there is nothing to show.
  const booting = document.body.classList.contains('booting');
  if (booting) shapeSkeletons();
  document.body.classList.remove('booting');
  document.body.classList.remove('text-out');
  // Measured after the skeletons are, so the two readings of this layout are
  // one, and handed over at the moment the cloud stops needing the old shape.
  handTitleOver();
  // The first title is not a changeover and is not thrown anywhere: it is
  // already in place and simply comes up, on the wait, the length and the curve
  // the element's own text would have taken, under the same bars narrowing onto
  // it. The curve is `revealed` in `web/title-cloud.ts`; the other two are here.
  if (booting) titleCloud()?.reveal(LINES_WAIT_MS, LINES_IN_MS);
  else if (STILL?.matches) titleCloud()?.reveal(0, LINES_IN_MS);
}

/**
 * Tell each placeholder bar what the line replacing it actually came out as, so
 * it can go to that shape on its way out.
 *
 * A bar guessed at the median title and a real title is never the median, so a
 * bar that only faded left a 72% rectangle dissolving over a line of words some
 * other width — two things in the same place at the same moment, agreeing about
 * nothing. Given the measurement it narrows onto the words as it goes, and a
 * title that came out two lines long has the bar stand up to meet it.
 *
 * Measured here and nowhere else because this is the one moment both shapes
 * exist: the text is in the document and the placeholders are still standing.
 * All three read before any is written, so the three forced layouts are one.
 *
 * The bars are drawn by pseudo-elements and cannot be given a style of their
 * own, so the figures go on the boxes and are inherited. The `calc` around them
 * lives in the stylesheet — what is handed over is the line box, and what the
 * bar keeps is that less the padding a placeholder always stood inside.
 */
function shapeSkeletons(): void {
  const measured = [els.title, els.sub, els.era].map((line) => ({
    box: line.parentElement,
    rect: line.getBoundingClientRect(),
  }));
  for (const { box, rect } of measured) {
    box?.style.setProperty('--sk-w', `${rect.width.toFixed(1)}px`);
    box?.style.setProperty('--sk-h', `${rect.height.toFixed(1)}px`);
  }
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
 * How far apart the bar's two colours sit, in degrees of hue.
 *
 * A spread rather than a second hue, and that is the whole of the fix. The pair
 * used to be two independently unwrapped numbers, each taking its own short way
 * to its own target — which pins each of them only to within a full turn, so
 * the arc *between* them was free to walk by up to 360° a record. Being a random
 * walk it wandered off and did not come back, and a few dozen records in the bar
 * had passed a whole revolution and was a rainbow for good. Carried as a plain
 * bounded number the arc cannot do that: whatever the hues themselves get up to,
 * the bar only ever spans what is named here.
 *
 * Near in major and half as far again in minor, which is the one thing about a
 * piece a listener hears in the first bar. Never so near that the bar reads as
 * one colour, never past a third of the wheel.
 */
const SPAN_NEAR = 48;
const SPAN_WIDE = 104;
const SPAN_JITTER = 20;

/**
 * Where the two hues stand now, unwrapped — free to sit past 360 or below 0.
 *
 * `tonicNow` is the record's own colour and the only one that travels; the two
 * ends are read off it and the spread each time. The starting pair is what
 * `@property` declares as their initial values, so the first record turns from
 * the same place the page was painted in.
 */
let tonicNow = 32;
let hueNow = 32;
let hue2Now = 8;

/**
 * The particle field, if this browser would draw one.
 *
 * Undefined is the ordinary case rather than a failure: the CSS glow in
 * `radio.html` is complete on its own, and everything here is written so that a
 * page without WebGL2 — or one whose context is taken away halfway through an
 * hour — simply goes on showing it.
 */
let glowField: GlowField | undefined;

/** Which of the two glows the listener has asked for. */
type GlowMode = 'particles' | 'plain';
let glowMode: GlowMode = 'particles';

/**
 * The light on the play button, which is not the glow and does not come and go
 * with it: the particles are a look the listener chooses between, and the one
 * bright control on the page is not. It has a canvas of its own inside the
 * button, so none of what the field's canvas wears — the stopped grayscale,
 * the six-second breath — lands on a control.
 */
let lamp: Lamp | undefined;

/**
 * Whether the bar may use a screen's room above white, where there is any.
 * Kept whatever the machine can do, so that carrying the same browser to a
 * monitor that has the range finds the answer already given.
 */
let hdr = true;

/**
 * How the bar reads what is playing, or `off` for not at all.
 *
 * One key doing both jobs, set with `localStorage.setItem('radio.spectrum', …)`
 * and a reload. There is deliberately no control for it: `off` is a way of
 * taking the feature back out rather than a thing to choose between.
 */
let spectrum: SpectrumMode | 'off' = 'flux';

/**
 * Whether a tap on the bar cycles the look. Parked, not removed — the cycle is
 * built and works, and there is one look worth showing at the moment, so there
 * is nothing for it to cycle to.
 */
const SPECTRUM_TAP: boolean = false;

function paintGlowMode(): void {
  els.glowMode.querySelectorAll('button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.glow === glowMode));
  });
}

const FLAG_PAGE = 'flags/#enable-experimental-web-platform-features';

/** Every Chromium fork keeps that page, under a scheme named after itself. */
const FORKS: readonly (readonly [string, string, string])[] = [
  ['Microsoft Edge', 'Edge', 'edge://'],
  ['Brave', 'Brave', 'brave://'],
  ['Opera', 'Opera', 'opera://'],
  ['Vivaldi', 'Vivaldi', 'vivaldi://'],
  ['Google Chrome', 'Chrome', 'chrome://'],
];

/**
 * Which browser is holding the range back and where its flag lives, read from
 * the brand list rather than the user agent string — every fork writes
 * "Chrome" into that string whether or not it is Chrome.
 *
 * Null where there is no flag worth naming: a browser that is not Chromium,
 * and a page served insecurely, where the brand list is withheld and a guess
 * would send someone to an address their browser does not have.
 */
function flagHome(): { name: string; url: string } | null {
  const brands = (navigator as Navigator & {
    userAgentData?: { brands?: { brand: string }[] };
  }).userAgentData?.brands;
  if (!brands?.some((b) => b.brand === 'Chromium')) return null;
  const fork = FORKS.find(([brand]) => brands.some((b) => b.brand === brand));
  return { name: fork?.[1] ?? 'this browser', url: (fork?.[2] ?? 'chrome://') + FLAG_PAGE };
}

const FLAG_HOME = flagHome();

/**
 * The range switch, shown only where it would do something — the particles
 * drawing and the screen having somewhere above white to go — and in its place
 * the address to go and turn on, where the screen has the range and only the
 * browser is in the way.
 *
 * Asked of the field each time rather than remembered, because the answer
 * belongs to the screen the window is on and a window can be dragged to
 * another one. Called wherever that could have changed: the mode switching,
 * and the panel being opened.
 */
function paintGlowRange(): void {
  const ready = !!glowField?.hdrReady();
  const flag = glowField?.hdrBlocked() ? FLAG_HOME : null;
  els.hdrSection.hidden = !ready && !flag;
  els.glowRange.hidden = !ready;
  els.hdrFlag.hidden = !flag;
  if (flag) {
    els.hdrFlagBrand.forEach((el) => { el.textContent = flag.name; });
    els.hdrFlagUrl.textContent = flag.url;
  }
  els.glowRange.querySelectorAll('button').forEach((b) => {
    b.setAttribute('aria-pressed', String((b.dataset.hdr === 'on') === hdr));
  });
}

/**
 * Tap the bar to change what it is doing with the music. See `SPECTRUM_TAP`.
 *
 * Two looks and no more in the cycle. `off` is not one of them: a listener who
 * has taken the drive out is not asking to be walked back through it by
 * touching the thing they took it out of.
 *
 * Kept, because a look is a preference. The mode goes straight to the field
 * rather than through a remount, so the bar carries its own state across the
 * change instead of starting again flat.
 */
function cycleSpectrum(): void {
  if (spectrum === 'off') return;
  spectrum = spectrum === 'bands' ? 'flux' : 'bands';
  try { localStorage.setItem(SPECTRUM_KEY, spectrum); } catch { /* private mode */ }
  glowField?.setSpectrumMode(spectrum);
}

/**
 * Put the chosen glow on the page, taking the other one off.
 *
 * Both directions have to work at any moment, not just at boot: this is reached
 * from the settings while a record is playing. Mounting hands the field the
 * colour the page is already showing, or the bar would open on the default
 * amber and slide to the right hue over the next couple of seconds, in the
 * middle of a record that has been that colour all along.
 *
 * Failure is not an error. `mountGlowField` returns null on a machine without
 * WebGL2, and the page simply keeps the CSS glow — the same state it is in when
 * the context is lost mid-hour, and the same one this setting's other position
 * asks for on purpose.
 */
function applyGlowMode(): void {
  if (glowMode === 'plain') {
    glowField?.destroy();
    glowField = undefined;
    document.body.classList.remove('glow-live');
    paintGlowRange();
    // The words go back to the element in the same breath as the canvas goes.
    // A title left marked live has no particles and no ink of its own either,
    // and stays that way until the next record.
    handTitleOver();
    return;
  }
  if (glowField) return;
  const host = document.querySelector<HTMLElement>('.glow');
  if (!host) return;
  glowField = mountGlowField(host, {
    onLost: () => {
      glowField = undefined;
      document.body.classList.remove('glow-live');
      handTitleOver();
    },
    // A cut may be drawn from anywhere on the page, so the field has to be told
    // what a finger might be doing instead — the controls, and the two panels
    // that scroll under one.
    keepTouch: 'button, a, input, select, textarea, dialog, #stations-wrap, #scrim, .vol',
    // The setting can be switched mid-song, so the field is not entitled to
    // assume it is being mounted onto a stopped page.
    playing,
    // Opened in the state that was chosen, rather than lighting up and being
    // turned down a frame later.
    hdr,
    // Polled, because the analyser does not exist until a click has built the
    // audio chain, and the bar is on the page well before that.
    spectrum: spectrum === 'off' ? undefined : getSpectrum,
    spectrumMode: spectrum === 'off' ? undefined : spectrum,
    onTap: SPECTRUM_TAP ? cycleSpectrum : undefined,
  }) ?? undefined;
  if (!glowField) return;
  document.body.classList.add('glow-live');
  glowField.setKey(hueNow, hue2Now);
  // And the title becomes particles now rather than at the next record. Nothing
  // was let go of, so the cloud places the points on the shape the element is
  // already showing instead of condensing them onto it.
  handTitleOver();
}

/**
 * `from`, moved to wherever `to` is by the shorter of the two ways round.
 *
 * The result is not reduced to 0–360, and must not be: the hue is transitioned
 * as a plain number, so the browser sweeps between the two figures it is given
 * arithmetically. 350 to 10 is four degrees the short way and a backwards
 * scroll through green, cyan and blue the way a wrapped value states it. Left
 * unwrapped, 350 to 370 says the same colour and takes the arc that is meant.
 * `hsl()` wraps whatever it is handed, so nothing downstream cares how far the
 * figure has drifted.
 */
function turn(from: number, to: number): number {
  return from + ((((to - from) % 360) + 540) % 360) - 180;
}

/**
 * The bar's two colours are the record's key.
 *
 * Hue from the tonic, so the twelve keys are twelve colours and a station that
 * stays in one of them looks like it. The tonic takes the short way round, and
 * it is the only thing that does: the far end is the tonic plus the spread, so
 * the two can never drift apart into a rainbow however many records pass.
 *
 * Everything else about the pairing comes off the record's own seed, which is
 * why the same record is the same colours every time it comes round rather than
 * a fresh throw. The spread is jittered so that two songs in the same mode are
 * not the same picture, it takes either way round the wheel, and either end may
 * hold the tonic — so a bar sometimes runs warm into cool and sometimes cool
 * into warm. Turning over passes through one flat colour on the way, which is a
 * moment of the transition rather than a place the bar ever rests.
 */
function paintKey(song: Song): void {
  const hue = (song.meta.tonic * 30 + 10) % 360;
  tonicNow = turn(tonicNow, hue);

  const rng = new Rng(`${song.meta.seed}:glow`);
  const near = song.meta.mode === 'major' ? SPAN_NEAR : SPAN_WIDE;
  const span = (near + (rng.next() * 2 - 1) * SPAN_JITTER) * (rng.next() < 0.5 ? -1 : 1);
  const flip = rng.next() < 0.5;
  hueNow = flip ? tonicNow + span : tonicNow;
  hue2Now = flip ? tonicNow : tonicNow + span;

  const root = document.documentElement.style;
  root.setProperty('--hue', String(hueNow));
  root.setProperty('--hue-2', String(hue2Now));
  // Told the same two figures rather than reading them back off the custom
  // property, so the field's sweep and the CSS one are the same sweep — and so
  // that the fallback is already correct if the context is lost mid-record.
  glowField?.setKey(hueNow, hue2Now);
}

/**
 * Hand the record to the OS — a title on the car stereo, a name on the lock
 * screen.
 *
 * Guarded because support has moved more than once and a station that threw
 * here would be a station that did not play. What the transport is *doing* is
 * `tellOs`; this is only what is on.
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
  } catch (err) {
    console.warn('radio: the lock screen would not take the record', err);
  }
}

/**
 * A tone under the floor of hearing, sounding from an `<audio>` element for as
 * long as a record is on air.
 *
 * Every browser gates the controls on audio leaving a *media element*, and this
 * page's mix is assembled entirely in Web Audio — so without this the handlers
 * at the foot of the file are registered against a session the OS never shows.
 * The element is the claim on the transport; the music stays the graph's.
 */
const KEEP_ALIVE_HZ = 30;
const KEEP_ALIVE_RATE = 8000;
/** Chromium files anything shorter as a sound effect and gives it no session at all. */
const KEEP_ALIVE_SECONDS = 6;
/**
 * How loud that tone is, which may not be zero.
 *
 * Chromium decides a tab is silent by measuring the power it renders against
 * roughly −72 dBFS, and a stream of zeroes fails that test and takes the
 * controls down with it. This is −60 dBFS at 30 Hz, where the ear is some 50 dB
 * less sensitive again and most speakers do not respond at all.
 */
const KEEP_ALIVE_PEAK = 0.001;

/** The tone as a WAV, built at the first press rather than shipped as 128 kB of base64. */
function keepAliveUrl(): string {
  const frames = KEEP_ALIVE_RATE * KEEP_ALIVE_SECONDS;
  const buffer = new ArrayBuffer(44 + frames * 2);
  const view = new DataView(buffer);
  const tag = (at: number, text: string): void => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(at + i, text.charCodeAt(i));
  };
  tag(0, 'RIFF');
  view.setUint32(4, 36 + frames * 2, true);
  tag(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, KEEP_ALIVE_RATE, true);
  view.setUint32(28, KEEP_ALIVE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  tag(36, 'data');
  view.setUint32(40, frames * 2, true);
  // A whole number of cycles across the buffer, so the loop has no seam.
  const peak = Math.round(32767 * KEEP_ALIVE_PEAK);
  for (let i = 0; i < frames; i += 1) {
    const sample = Math.sin((2 * Math.PI * KEEP_ALIVE_HZ * i) / KEEP_ALIVE_RATE);
    view.setInt16(44 + i * 2, Math.round(peak * sample), true);
  }
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

let keepAlive: HTMLAudioElement | undefined;

/**
 * Claim the OS transport, or let it go.
 *
 * Fails soft, as the rest of this seam does: a rejected `play` costs the
 * lock-screen controls and nothing else, and the record it was called for is
 * already sounding.
 */
function holdTransport(on: boolean): void {
  if (!on) { keepAlive?.pause(); return; }
  if (!keepAlive) {
    keepAlive = new Audio(keepAliveUrl());
    keepAlive.loop = true;
  }
  void keepAlive.play().catch((err) => {
    console.warn('radio: the OS would not hand this page the transport', err);
  });
}

/**
 * A station has no runtime, and this is how that is said.
 *
 * An infinite duration is the sanctioned way to declare live media, and it is
 * given rather than left unset because the keep-alive element is six seconds
 * long — cleared, the OS falls back to *its* timeline and draws a bar that
 * fills and starts over ten times under one song. Declared, there is no
 * scrubber at all: a title, a station and the transport, which is what a radio
 * looks like.
 */
const LIVE: MediaPositionState = { duration: Infinity, position: 0, playbackRate: 1 };

/** What the OS is told every time the transport moves. */
function tellOs(): void {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  // Not every browser has the scrubber to be told about.
  try { navigator.mediaSession.setPositionState(LIVE); } catch { /* unsupported */ }
}

// ---------------------------------------------------------------------------
// Writing records
// ---------------------------------------------------------------------------

async function write(st: Station, w: number, token: string): Promise<Cut> {
  const opts = recordOptions(st, w, token, voice);
  const song = await generateSongAsync(opts);
  // Rendered here rather than in the changeover: it is single-figure
  // milliseconds, but the gap between two records has none to spare.
  return {
    station: st, wander: w, token, song, opts,
    parts: renderStrudelParts(withoutSungVoice(song)),
  };
}

/**
 * A record's compiled band, finishing whatever `warmBand` did not get to.
 *
 * Memoised on the cut, so the three routes to a downbeat — armed on an idle
 * page, cued under the record before, or neither because the press beat both —
 * never pay for the same compile twice and never race each other for it.
 */
function bandFor(cut: Cut): Promise<StagedBand> {
  if (!cut.staged) cut.staged = stageBand(cut.parts);
  return cut.staged;
}

/**
 * Cue the next record over the top of this one.
 *
 * Generation is tens of milliseconds on a worker and the render is single
 * figures, so neither is why this exists. The other two are: `preloadSounds` is
 * network, and the compile is 88 ms to near a second of blocked main thread.
 * Done here both happen under music, where latency costs nothing.
 */
function cueNext(): void {
  const st = station;
  const w = wander;
  pending = (async () => {
    try {
      const next = await write(st, w, newToken());
      await preloadSounds(next.song);
      // Not awaited, because nothing is waiting: a record cued three minutes
      // out has three minutes. A skip landing mid-warm goes to `bandFor`, which
      // keeps every block this got through and compiles the rest itself.
      void warmBand(next.parts).catch((err) => {
        // A record that would not compile early compiles in the gap instead,
        // which is where every record compiled before this existed.
        console.warn('radio: could not compile the next record in advance', err);
      });
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

/**
 * Everything the first press would otherwise be charged for, paid while nobody
 * is waiting.
 *
 * The band over the wire is the large half — a median 1.6 MB of soundfonts and
 * kit for a record, and it used to begin moving on the press — and the compile is
 * the slow half. Done here, a cold press is a `startLoaded` and the button never
 * has anything to say.
 *
 * Only ever for the record showing on an idle page, and the only route that
 * compiles a whole record in one run — a record cued under a playing one goes
 * through `warmBand`, which leaves its densest part alone. Nothing is playing
 * here, so there is nothing to leave it alone for.
 */
async function arm(cut: Cut): Promise<void> {
  try {
    await preloadSounds(cut.song);
    /**
     * An idle page has no clock to be polite to, so `stageBand` compiles this
     * one in a single run — and a transition that has not started yet cannot
     * start until the thread comes back. One already running is composited and
     * survives it, which is why waiting for the lines is enough. See `showLines`.
     */
    await until(linesBy);
    const staged = await bandFor(cut);
    /**
     * Somebody pressed something, and the transport is theirs now. Installing
     * puts this record under the scheduler, so arming one nobody is waiting for
     * any more would put it underneath one that is playing.
     */
    if (current !== cut || playing || paused || loading) return;
    await installBand(staged);
  } catch (err) {
    // A record that would not get ready early is one that gets ready on the
    // press instead, which is where every record was before this existed. Not
    // something the listener can do anything about, so the page does not say so.
    console.warn('radio: could not get the record ready ahead of the press', err);
  }
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

/**
 * Wait for a frame to have been *drawn*, before taking the thread away.
 *
 * A press and the compile it leads to are the same task — every `await` between
 * them settles as a microtask — so a changeover told to begin at the press had
 * not been drawn once by the time the thread went away for up to half a second.
 * Measured: the long task begins on the click and the first paint is on the far
 * side of it.
 *
 * Waiting on the frame callback alone is not enough, and this is the whole
 * reason for the timer inside it: a callback runs *before* the style and paint
 * of the frame it belongs to, so resolving there hands the thread straight back
 * with nothing recomputed. A class put on at the press and taken off in that
 * continuation is a class the style engine never sees twice — no transition
 * runs at all and the genre line jumps to the next record. A task scheduled
 * from inside the callback is the first thing after that frame is on the glass.
 *
 * The outer timeout is not a deadline, it is the answer for anywhere frames are
 * not coming — a background tab, a hidden pane — where waiting would never end.
 */
function painted(): Promise<void> {
  // Nothing to wait for where nothing is drawn, and waiting there is expensive:
  // a hidden page fires no frames at all and throttles its timers to about the
  // second, so this measured 794 ms in a background tab. A skip from the lock
  // screen would have spent every one of them waiting for a paint nobody was
  // going to see.
  if (document.hidden) return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = (): void => { if (!done) { done = true; resolve(); } };
    requestAnimationFrame(() => { window.setTimeout(finish, 0); });
    window.setTimeout(finish, 60);
  });
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
   *
   * It is also the answer to whether the gap is worth reporting, and the only
   * one there is: a gap with the ending still sounding over it needs no notice,
   * and the same gap in silence needs one. See `play`.
   */
  faded: boolean;
}

async function play(cut: Cut, handover?: Handover): Promise<void> {
  const mine = ++generation;
  try {
    /**
     * The button says so for the whole of the wait, unless there is music over
     * it — and whether there is depends on which changeover this is rather than
     * on it being one. A record that ended has 1.8 s of ring-out sounding while
     * this runs and the station is audibly still playing, so there is nothing to
     * report; a skip pulled the fader to zero before it got here, so the same
     * gap is silence, and up to two seconds of it under a Pause glyph is a
     * station that looks like it has failed. `faded` is exactly that difference.
     *
     * The glow stays lit either way, which is deliberate: `paintPlay` takes it
     * from `playing`, and a changeover does not touch that. It says *this
     * station is on*, not *sound is leaving the speaker this instant*, and both
     * directions of its fade are 1.2 s — so blinking it off across a gap this
     * short would dip, reverse and recover, which reads as a fault rather than
     * as information.
     */
    if (!handover || handover.faded) {
      loading = true;
      paintPlay();
    }
    await preloadSounds(cut.song);
    if (mine !== generation) return;

    if (handover) {
      /**
       * Most of it already done: `cueNext` compiled this record under the one
       * that has just ended, all but any block too dense to compile under music.
       * What is left lands here, and here is where it costs least — `skip` and
       * `advance` have both already stopped the scheduler, so there is nothing
       * to starve and the last chord is ringing on a clock this thread cannot
       * reach.
       */
      await installBand(await bandFor(cut));
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
      /**
       * The same two steps as the handover above, rather than one `playCode`
       * that does both, and for the same reason plus one: `arm` has usually
       * compiled this record already and `bandFor` knows it — so what is left of
       * the press is the scheduler starting.
       */
      await installBand(await bandFor(cut));
      if (mine !== generation) return;
      await startLoaded();
    }

    sungVoice.begin(cut.song);
    current = cut;
    playing = true;
    paused = false;
    loading = false;
    holdTransport(true);
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
    keepLines();
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
  holdTransport(false);
  tellOs();
  // A stop landing inside a skip's gap is a changeover that will never arrive,
  // and the record on the screen is the one that was playing. See `keepLines`.
  keepLines();
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
  holdTransport(false);
  paintPlay();
  tellOs();
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
  holdTransport(true);
  paintPlay();
  // What was left of the record when it was held, not the whole of it again.
  endsAt = performance.now() + heldMs;
  timer = window.setTimeout(() => { void advance(); }, heldMs);
  tellOs();
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
  // `endsAt` is this record's now, so the scrubber is told here rather than in
  // `announce`, which runs a step earlier.
  tellOs();
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
  /**
   * All three lines go now, not on the downbeat.
   *
   * What is between the press and the downbeat is a fader and a compile —
   * measured at 190–500 ms — and lines that wait for the far side of it are a
   * button that looks like it was not pressed. The gas is the thing that covers
   * a wait, so it cannot be on the other side of one, and the genre and era go
   * with the title rather than standing there under a name that has left. The
   * new words still arrive on the downbeat with everything else: `release` and
   * `arrive` keep their own clocks. See `CLOUD_MS` in `web/title-cloud.ts`.
   *
   * Somebody who has asked for less movement keeps the whole changeover on the
   * downbeat, where it is one fade rather than a fade and then a wait.
   */
  if (!STILL?.matches) {
    titleCloud()?.release();
    document.body.classList.add('text-out');
    linesOutAt = performance.now();
  }
  setOutputLevel(0, SKIP_FADE_SECONDS);
  void stopPlayback();
  // The words above are on the screen going before the compile takes the thread.
  await painted();
  await changeover(mine, performance.now() + SKIP_FADE_SECONDS * 1000, true);
}

async function changeover(mine: number, notBefore: number, faded: boolean): Promise<void> {
  /**
   * A faded changeover is silence from here, and the wait starts at this line
   * rather than at `play`: the record after this one is only usually written,
   * and a skip taken early in a record waits on the generator with the button
   * still holding a steady Pause over nothing.
   */
  if (faded) { loading = true; paintPlay(); }
  const cued = await pending;
  // Consumed either way — whatever happens next ends in `play`, which cues
  // another against whatever the settings say by then.
  pending = undefined;
  /**
   * Somebody pressed something else and the lines are theirs now.
   *
   * Nothing is handed back here, and handing it back was a bug worth naming:
   * `keepLines` puts the words that are still in the document back into the
   * cloud, which spends the letting-go the *newer* changeover is in the middle
   * of. Its own title then had nothing to condense out of and was placed
   * instead — a record that changed with no animation at all, every time two
   * presses landed inside one changeover. A stop hands them back itself.
   */
  if (mine !== generation) return;

  let next = cued;
  if (!next) {
    try {
      next = await write(station, wander, newToken());
    } catch (err) {
      loading = false;
      paintPlay();
      showError('The generator stopped. Reload to start it again.');
      console.error(err);
      keepLines();
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
const GLOW_KEY = 'radio.glow';
const SPECTRUM_KEY = 'radio.spectrum';
const HDR_KEY = 'radio.hdr';
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
    // Tuned while stopped, which is the other place a record sits on an idle
    // page waiting to be pressed. Same treatment as the first one. See `arm`.
    void arm(cut);
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
    /**
     * A floor rather than "anything that overflows at all", because a label
     * one character over is worse animated than clipped.
     *
     * `1` was right when `Ambient · Synth · Classical` was the only line that
     * overflowed, at 23 px. Now that every station names its genres rather than
     * counting them, two of the twelve came within 6 and 7 px of fitting — and
     * at `.67rem` a character is about five, so those slid one letter back and
     * forth for seven seconds a cycle. That reads as a wobble, not a reveal.
     *
     * The panel is now wide enough that both of them fit outright (see the
     * width sweep in `radio.html`), so this is insurance rather than a fix: the
     * next station added will land wherever it lands.
     */
    if (over < 12) return;
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
  refit = window.setTimeout(() => {
    fitStationLabels();
    // Ink is viewport geometry, so a resize has moved every point of it.
    handTitleOver();
  }, 150);
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

/**
 * Whether there is a mouse — a pointer that hovers, and points precisely.
 *
 * The speaker answers to it: where hover already brings the slider up, the
 * button itself has nothing left to open and is free to be the mute. Where
 * there is no mouse — a phone — the tap is the only way to the slider and stays
 * that. `pointer: fine` is in the query because phone browsers have claimed
 * `hover: hover` with nothing hovering, and on one of those the tap muted.
 */
const HOVERS = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * Whether a mouse made this press, asked of the press rather than of the
 * device. A pointer type is what actually arrived; keyboard activation brings
 * none and falls back to what the device claimed.
 */
function byMouse(e: Event): boolean {
  const kind = e instanceof PointerEvent ? e.pointerType : '';
  return kind ? kind === 'mouse' : HOVERS;
}

/**
 * The level to come back to when the speaker is clicked a second time. Follows
 * the fader while it is above zero, so unmuting lands where the listener last
 * left it rather than at the default.
 */
let premute = DEFAULT_VOLUME;

function paintVolume(): void {
  els.volume.value = String(Math.round(volume * 100));
  // On the container rather than the input: the bar is drawn by `.vol-pop`'s
  // own pseudo-element, which can only see a value set on an ancestor.
  els.vol.style.setProperty('--fill', `${volume * 100}%`);
  // The speaker's arcs are the level, so the button says where it is set
  // without the slider having to be showing.
  els.volBtn.dataset.level = volume === 0 ? '0' : volume < 0.5 ? '1' : '2';
  if (volume > 0) premute = volume;
  if (HOVERS) els.volBtn.setAttribute('aria-label', volume === 0 ? 'Unmute' : 'Mute');
}

/** Move the fader from somewhere other than the fader, and tell everything. */
function setVolume(next: number): void {
  volume = next;
  paintVolume();
  try { localStorage.setItem(VOLUME_KEY, els.volume.value); } catch { /* private mode */ }
  // Only while something is sounding: off-air the fader is held at 0 by `stop`,
  // and moving it here would start leaking the next record's opening bar.
  if (playing) setOutputLevel(volume, 0.05);
}

function showVolume(open: boolean): void {
  els.vol.classList.toggle('open', open);
  els.volBtn.setAttribute('aria-expanded', String(open));
}

els.volume.oninput = () => {
  setVolume(Number(els.volume.value) / 100);
};

els.volBtn.onclick = (e) => {
  e.stopPropagation();
  // A finger has no hover, so nothing has opened the fader for it and the tap
  // has to. Only a mouse, which brought the pill up on its way in, is free to
  // spend the press on the mute.
  if (byMouse(e)) {
    setVolume(volume === 0 ? premute : 0);
    return;
  }
  showVolume(!els.vol.classList.contains('open'));
};

// ---------------------------------------------------------------------------
// A pointer that meant it
// ---------------------------------------------------------------------------

/**
 * How much recent movement counts towards how fast the pointer is going.
 *
 * A single interval between two samples is too small a thing to judge on: at a
 * hundred-odd samples a second any sweep contains instants that measure slow,
 * and a fling only has to produce one of those over a button for the button to
 * light up. A few samples put one of those in context. Much more than that and
 * the window becomes a memory of how the pointer got here, which is the other
 * failure — a pointer that crossed the page fast and is now moving slowly over
 * a control has arrived, and making it wait for the crossing to age out of the
 * average is a delay by another name.
 */
const SPEED_WINDOW_MS = 50;

/**
 * Where the pointer has been, lately, oldest first.
 *
 * Stamped with `performance.now()` at the moment the event is handled rather
 * than with the event's own `timeStamp`, because everything that reads this
 * compares against `performance.now()` and the two are not guaranteed to be the
 * same clock. A few milliseconds of handler latency is noise; two epochs
 * subtracted from each other is a speed of any size at all.
 */
const trail: { x: number; y: number; t: number }[] = [];
document.addEventListener('pointermove', (e) => {
  const t = performance.now();
  while (trail.length > 0 && t - trail[0]!.t > SPEED_WINDOW_MS) trail.shift();
  trail.push({ x: e.clientX, y: e.clientY, t });
}, { passive: true });

/**
 * How fast the pointer is going, in pixels per millisecond — the distance it
 * has travelled between the samples still inside the window, over the time
 * those samples span.
 *
 * Fewer than two of them and there is nothing to divide: the pointer has moved
 * once from somewhere unknown, or has not moved recently at all. Both are the
 * shape of a mouse that was sitting still and has just been thrown, and calling
 * either of them *slow* is what let a fling through every time it started from
 * a rest. Unknown is not slow. The next sample is a handful of milliseconds
 * behind and answers it properly.
 */
function pointerSpeed(): number {
  const now = performance.now();
  while (trail.length > 0 && now - trail[0]!.t > SPEED_WINDOW_MS) trail.shift();
  if (trail.length < 2) return Infinity;
  let path = 0;
  for (let i = 1; i < trail.length; i++) {
    path += Math.hypot(trail[i]!.x - trail[i - 1]!.x, trail[i]!.y - trail[i - 1]!.y);
  }
  const span = trail[trail.length - 1]!.t - trail[0]!.t;
  return span > 0 ? path / span : Infinity;
}

/**
 * Above this, in pixels per millisecond, the pointer is passing over rather
 * than arriving.
 *
 * A hand bringing a mouse onto a target is still moving when it gets there —
 * the samples either side of the arrival run a few hundred pixels a second — so
 * the figure has to clear that, or nothing answers until the pointer has come to
 * a full stop, which is a delay however it is dressed up. A fling runs several
 * times higher.
 */
const FLYBY = 1;

/**
 * Do it, but only for a pointer that was moving slowly enough to have meant it.
 *
 * There is no timer here and there must not be one. Everything this gates is
 * asked on `pointerenter` and again on every `pointermove`, so a pointer that
 * swept in fast and then slowed answers on its next movement, a few
 * milliseconds later — and a pointer that never slows never gets an answer at
 * all, which is the whole point. A timer that fires anyway is a second way in
 * that measures nothing, and it was letting flings through.
 *
 * The one thing this gives up: a fling that ends dead on a control, pointer
 * frozen on the pixel it landed on, leaves the control unlit until the mouse is
 * moved again. Any movement at all opens it, because that movement is slow.
 */
function ifAimed(act: () => void): void {
  if (pointerSpeed() <= FLYBY) act();
}

/**
 * The accent every control wears under the pointer, on the same terms.
 *
 * This is `:hover` in every respect but one, and the one is why it is here: a
 * mouse thrown across the page lit up whatever it crossed, and on a row of six
 * controls that is six flashes for a gesture aimed at none of them. The class
 * says the pointer is on this control *and meant to be*; the stylesheet hangs
 * the accent off that instead. Only under `(hover: hover)`, so a touch screen —
 * which has no pointer to aim and would leave the class behind on whatever it
 * last tapped — never gets one.
 */
if (window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll<HTMLElement>('.controls button').forEach((el) => {
    const ask = (): void => {
      if (!el.classList.contains('aimed')) ifAimed(() => el.classList.add('aimed'));
    };
    el.addEventListener('pointerenter', ask);
    el.addEventListener('pointermove', ask);
    el.addEventListener('pointerleave', () => el.classList.remove('aimed'));
  });
}

// ---------------------------------------------------------------------------
// Volume, on hover
// ---------------------------------------------------------------------------

/** Hover opens it, where there is a pointer to hover with — and aims it. */
if (HOVERS) {
  // Touch sends this whole set too — enter on the press, leave on the release,
  // both before the click. Unguarded on a device that claims a hover it has
  // not got, the tap opened the pill and the leave closed it again.
  const ask = (e: PointerEvent): void => {
    if (!byMouse(e)) return;
    // Already up — this is the pointer moving about on the control it opened,
    // not a fresh approach, and there is nothing left to be sure of.
    if (els.vol.classList.contains('open')) return;
    ifAimed(() => showVolume(true));
  };
  els.vol.addEventListener('pointerenter', ask);
  els.vol.addEventListener('pointermove', ask);
  // Away the moment the pointer goes, like the stations do. There is no strip
  // of page between the button and the pill for a grace period to protect: the
  // button's press target reaches .7rem out and the pill starts at .45rem, so
  // the two overlap and the pointer never leaves anything on the way across.
  els.vol.addEventListener('pointerleave', (e) => {
    if (!byMouse(e)) return;
    showVolume(false);
  });
}

document.addEventListener('click', (e) => {
  if (!els.vol.classList.contains('open')) return;
  const target = e.target as Node | null;
  if (target && els.vol.contains(target)) return;
  showVolume(false);
});

// ---------------------------------------------------------------------------
// Sheets
// ---------------------------------------------------------------------------

/**
 * On a phone both panels are the same object — a sheet docked to the bottom
 * edge with a bar across the top of it — and a bar drawn there is a promise:
 * everything else shaped like this can be pulled down and thrown away.
 *
 * The bar is the only handle, and that is the whole reason this can be as
 * simple as it is. Making the *sheet* draggable means telling a pull apart from
 * a scroll and from a press on a station card, which is where these get
 * complicated; a grip that does nothing else needs none of that, and the
 * gesture lands where the eye already says it should.
 *
 * Nothing here knows which panel it is driving. See `draggable`.
 */

/**
 * Whether the two panels are sheets at the moment, rather than the floating
 * pair the desktop layout uses.
 *
 * Asked of the grip rather than of a `matchMedia` copy of the breakpoint. The
 * break is written once, in the stylesheet, and it is not only a width — it is
 * `(hover: none), (max-width: 34rem)`, so a *desktop* window narrowed past 34rem
 * is in the sheet layout with a mouse in it. A second copy of that here would be
 * a second definition free to drift from the first, and the whole reason this
 * function exists is that something drifted. The grip is `display: none` in
 * exactly the layout where the panels are not sheets, which makes reading it the
 * stylesheet's own answer to the question.
 */
function isSheet(): boolean {
  return getComputedStyle(els.stationsGrip).display !== 'none';
}

/** How far down a pull has to get before letting go puts the sheet away. */
const SHEET_CLOSE_PX = 64;
/**
 * …or how fast it has to be travelling when it is let go, in px per ms.
 *
 * A flick is a short, quick pull, and it means the same thing as a long slow
 * one. Without this, throwing the sheet down and lifting off after 40 px is a
 * gesture that visibly went somewhere and then snapped back.
 */
const SHEET_FLICK = 0.5;
/** Below which a flick is a wobble on a tap rather than a throw. */
const SHEET_FLICK_FLOOR_PX = 8;
/**
 * How long a stretch of the pull the throw is measured over, in ms.
 *
 * Not optional smoothing. Measured across the single frame it ended on, an
 * ordinary drag *is* a flick: pointer moves arrive every 8 ms or so, and 6 px in
 * one of them reads as 0.75 px/ms — half again over the threshold, from a hand
 * moving at 6 px a frame. Every deliberate pull closed the sheet.
 *
 * A window this long also gets the other half for free. Speed is only taken
 * from moves, so a hand that drags, stops, and *then* lifts off leaves the last
 * fast reading standing however long it waited; measured against a stamp rather
 * than a frame, the pause is in the divisor and the speed falls to nothing where
 * it belongs.
 */
const SHEET_FLICK_WINDOW_MS = 90;
/** The furthest the sheet will lift above its dock, however hard it is pulled. */
const SHEET_LIFT_PX = 40;

/**
 * Upward travel, damped — the sheet's answer to being pulled the way it does
 * not go.
 *
 * A hard clamp would be one line, and it stops dead: the thumb goes on moving
 * and the sheet does not, which reads as the page having lost the touch. This
 * never quite stops, so the sheet is always still answering; it just costs
 * exponentially more travel to get anywhere. The first pixel is nearly free and
 * the twentieth is most of the fight, which is what "stiff" is.
 *
 * `SHEET_LIFT_PX` is the asymptote rather than a reachable figure: half of it is
 * spent by 55 px of pull, three quarters by 110, and the rest is never had.
 */
function rubber(px: number): number {
  return SHEET_LIFT_PX * (1 - Math.exp(-px / (SHEET_LIFT_PX * 2)));
}

/** A panel that docks to the bottom of the screen, as much as a drag needs. */
interface Sheet {
  /** What moves. */
  el: HTMLElement;
  /** The bar across its top, and the only thing that starts a drag. */
  grip: HTMLElement;
  /** Whether it is on screen. A pull on a sheet that is away is nothing. */
  isOpen: () => boolean;
  /** Put it away, by whatever route this panel is put away by. */
  close: () => void;
}

/**
 * Let the thumb move the sheet.
 *
 * The transform is inline only while a finger is down. Both endings hand the
 * element straight back to the stylesheet — releasing sets `transform` to the
 * empty string rather than to a figure of its own — so the settle back and the
 * slide away are the panel's own CSS running from wherever the drag left it,
 * and there is no inline state left behind to fight the next open or close.
 * That is why `close()` can be called in the same breath: the removal and the
 * close land in one style pass, so what the browser sees is a single move from
 * the dragged position to the closed one.
 */
function draggable({ el, grip, isOpen, close }: Sheet): void {
  /** Where the finger went down. */
  let from = 0;
  /** Where the sheet is now, in pixels below its dock. */
  let at = 0;
  /**
   * Two marks left behind along the way, each a reading and its stamp. The
   * throw is measured against the older of them, which is what keeps the
   * measurement a window wide rather than a frame wide — see
   * `SHEET_FLICK_WINDOW_MS`. Kept as a pair rather than one that is moved up
   * each time, because a single mark is a window only until the moment it is
   * replaced, and the release can land in that moment.
   */
  let older = 0;
  let olderAt = 0;
  let newer = 0;
  let newerAt = 0;

  grip.addEventListener('pointerdown', (e) => {
    if (!isOpen()) return;
    // Every later move and the release come here whatever they are over, which
    // is most of them: a pull that closes the sheet ends well below it.
    grip.setPointerCapture(e.pointerId);
    from = e.clientY;
    at = 0;
    older = 0;
    newer = 0;
    olderAt = e.timeStamp;
    newerAt = e.timeStamp;
    // The sheet is under the thumb now, and nothing may be interpolating
    // between where it is and where the thumb has got to.
    el.style.transition = 'none';
  });

  grip.addEventListener('pointermove', (e) => {
    if (!grip.hasPointerCapture(e.pointerId)) return;
    const dy = e.clientY - from;
    at = dy >= 0 ? dy : -rubber(-dy);
    if (e.timeStamp - newerAt > SHEET_FLICK_WINDOW_MS) {
      older = newer;
      olderAt = newerAt;
      newer = at;
      newerAt = e.timeStamp;
    }
    el.style.transform = `translateY(${at.toFixed(1)}px)`;
  });

  const letGo = (e: PointerEvent): void => {
    if (!grip.hasPointerCapture(e.pointerId)) return;
    grip.releasePointerCapture(e.pointerId);
    /**
     * The stylesheet's transition, back on — and armed a style pass *before*
     * the transform moves rather than in the same one as it. Dropping
     * `transition: none` is itself a change, and a browser handed both at once
     * has no before-change style with a transition in it to start one from, so
     * the sheet would jump to its resting place. Reading a layout property is
     * what forces the pass in between.
     */
    el.style.transition = '';
    void el.offsetHeight;
    // Against the release's own stamp, so a hand that stopped before it lifted
    // off has that pause counted against it.
    const over = e.timeStamp - olderAt;
    const speed = over > 0 ? (at - older) / over : 0;
    const away = at > SHEET_CLOSE_PX
      || (speed > SHEET_FLICK && at > SHEET_FLICK_FLOOR_PX);
    el.style.transform = '';
    if (away) close();
  };

  grip.addEventListener('pointerup', letGo);
  // A system gesture taking the pointer away mid-pull leaves the sheet wherever
  // it had got to unless this puts it back.
  grip.addEventListener('pointercancel', letGo);
}

draggable({
  el: els.stationsWrap,
  grip: els.stationsGrip,
  isOpen: () => document.body.classList.contains('stations-open'),
  close: () => showStations(false),
});

draggable({
  el: els.settings,
  grip: els.settingsGrip,
  isOpen: () => els.settings.open,
  close: () => els.settings.close(),
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

els.openSettings.onclick = () => {
  // The screen may have changed since the panel was last open.
  paintGlowRange();
  els.settings.showModal();
};
els.closeSettings.onclick = () => els.settings.close();
/**
 * A press outside the panel closes it.
 *
 * `e.target === dialog` is the usual way to ask this — a press on the backdrop
 * is reported against the dialog itself, because the backdrop is a
 * pseudo-element and has no node of its own to name. On its own it is not
 * enough: the dialog's *padding* belongs to the dialog too, so a press on the
 * air inside the panel says exactly the same thing. On the desktop card that is
 * a 1.5 rem frame and was already wrong; on the phone sheet it is the full
 * width of the screen, and a thumb landing beside the voice buttons would put
 * the settings away.
 *
 * So: the target says it is not on a control, and the point says whether it is
 * on the panel. The target test stays because it is what rules out a keyboard
 * press on a child — those arrive as clicks at (0, 0), which is outside every
 * sheet docked to the bottom of the screen.
 */
els.settings.onclick = (e) => {
  if (e.target !== els.settings) return;
  const box = els.settings.getBoundingClientRect();
  const outside = e.clientX < box.left || e.clientX > box.right
    || e.clientY < box.top || e.clientY > box.bottom;
  if (outside) els.settings.close();
};

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

els.glowMode.onclick = (e) => {
  const picked = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-glow]');
  if (!picked) return;
  glowMode = picked.dataset.glow as GlowMode;
  try { localStorage.setItem(GLOW_KEY, glowMode); } catch { /* private mode */ }
  paintGlowMode();
  applyGlowMode();
  paintGlowRange();
};

els.hdrFlagCopy.onclick = () => {
  void navigator.clipboard.writeText(els.hdrFlagUrl.textContent ?? '').then(
    () => { els.hdrFlagCopy.textContent = 'Copied'; },
    () => { els.hdrFlagCopy.textContent = 'Copy failed'; },
  ).finally(() => {
    window.setTimeout(() => { els.hdrFlagCopy.textContent = 'Copy'; }, 1600);
  });
};

els.glowRange.onclick = (e) => {
  const picked = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-hdr]');
  if (!picked) return;
  hdr = picked.dataset.hdr === 'on';
  try { localStorage.setItem(HDR_KEY, hdr ? 'on' : 'off'); } catch { /* private mode */ }
  paintGlowRange();
  glowField?.setHdr(hdr);
  lamp?.setHdr(hdr);
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
 * One button, five meanings, and only one of them is "stop".
 *
 * A load is the odd one out: there is no record to hold, so the press calls the
 * load off outright rather than pausing something that has not started. Except
 * during the *first* load, where there is nothing to call off either — that
 * press is kept and answered by `boot`. See `opening`.
 */
function pressPlay(): void {
  if (opening) { wanted = true; return; }
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
 * …and on hover, where there is a pointer to hover with *and* a panel worth
 * hovering over.
 *
 * Reaching a list of eight things should not cost a press. Gated on
 * `(hover: hover)` because a touch screen reports `pointerenter` on the tap
 * that precedes the click, so on a phone this would open the panel and the
 * click would immediately shut it again.
 *
 * And gated again, per event, on the panel not being a sheet — because the two
 * questions are not the same one, and a desktop window narrowed past the break
 * answers them differently. There, hover opened a sheet that docks to the
 * bottom of the screen, half a page from the pointer; the sheet brought its
 * scrim up with it, the scrim covered the button the pointer was still on, so
 * `pointerleave` fired against a pointer that had not moved and shut the sheet
 * again — which uncovered the button, which fired `pointerenter`. The button
 * flickered, wore the scrim's cursor rather than its own, and could not be
 * clicked at all: every press landed on the scrim. Read at event time rather
 * than latched at load, so a window dragged across the break is right on the
 * next movement rather than at the next reload.
 *
 * The close is deferred only when the pointer leaves *towards the other half of
 * the control* — down out of the button, or up out of the panel — because that
 * is the one direction where the gap between them has to be crossable. Leaving
 * any other way is someone going somewhere else, and waiting 400 ms to admit it
 * makes the panel feel stuck to the cursor.
 *
 * Towards is read as the half of the box the pointer left from, not as the one
 * edge it left through. A pointer aimed at a panel below and to one side leaves
 * a round button through its *side*, low down, and calling that a sideways
 * departure faded the stations out from under a cursor that was on its way to
 * them. Anywhere on the facing half is on the way; the far half is not.
 *
 * And towards means the far side of that half as well: the panel is 37 rem wide
 * against a button of three, so most of the panel's top edge has nothing above
 * it but page. Leaving up through *there* is leaving, and only the strip the
 * button actually stands on is the gap worth holding open.
 */
if (window.matchMedia('(hover: hover)').matches) {
  let shutting: number | undefined;
  const hold = (): void => { window.clearTimeout(shutting); shutting = undefined; };

  /**
   * How far to either side of the button still counts as heading for it.
   *
   * A pointer crossing a 1.25 rem gap at speed lands a few pixels off the line
   * it left on, and the events either side of the gap are sampled, not
   * continuous. Wide enough to forgive that, narrow enough that the rest of a
   * 37 rem edge is not in it.
   */
  const SLACK = 12;

  /** `down` for the button, which the panel sits under; `up` for the panel. */
  const leave = (el: HTMLElement, toward: 'down' | 'up') => (e: Event): void => {
    hold();
    if (isSheet()) return;
    // A pinned panel was asked for and stays until it is asked away.
    if (pinned) return;
    const box = el.getBoundingClientRect();
    const to = (el === els.stationsToggle ? els.stationsWrap : els.stationsToggle)
      .getBoundingClientRect();
    const { clientX: x, clientY: y } = e as PointerEvent;
    const mid = (box.top + box.bottom) / 2;
    const crossing = (toward === 'down' ? y >= mid : y <= mid)
      && x >= to.left - SLACK && x <= to.right + SLACK;
    if (crossing) shutting = window.setTimeout(() => showStations(false), 400);
    else showStations(false);
  };

  for (const [el, toward] of [
    [els.stationsToggle, 'down'], [els.stationsWrap, 'up'],
  ] as const) {
    const ask = (): void => {
      if (isSheet()) return;
      hold();
      // Already open — this is the pointer crossing the gap between the two
      // halves of the control, which `hold` has just rescued, or moving about
      // inside the panel. Nothing left to be sure of.
      if (document.body.classList.contains('stations-open')) return;
      ifAimed(() => showStations(true));
    };
    el.addEventListener('pointerenter', ask);
    el.addEventListener('pointermove', ask);
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
  /**
   * Build the audio stack now, which is also what arms its first-click listener
   * before the user can reach Play.
   *
   * Everything but the click itself happens off this call — the eval scope, the
   * repl, the sound registries, the three sample manifests — so by the time a
   * record exists to warm, the engine behind it is already there. See
   * `prepareAudio` in `web/audio.ts`. The promise itself does not resolve until
   * somebody has touched the page, so this is not awaited; it is here for the
   * work it starts and for the error it might report.
   */
  void initAudio().catch((err) => {
    showError('The audio engine would not start. Reloading usually fixes it.');
    console.error(err);
  });

  buildStations();

  /**
   * Before the first record, so the field is already showing the opening colour
   * rather than arriving under one. It draws one frame and goes to sleep.
   */
  try {
    const storedGlow = localStorage.getItem(GLOW_KEY);
    if (storedGlow === 'particles' || storedGlow === 'plain') glowMode = storedGlow;
    const storedHdr = localStorage.getItem(HDR_KEY);
    if (storedHdr === 'on' || storedHdr === 'off') hdr = storedHdr === 'on';
    const storedSpectrum = localStorage.getItem(SPECTRUM_KEY);
    if (storedSpectrum === 'off' || storedSpectrum === 'bands' || storedSpectrum === 'flux') {
      spectrum = storedSpectrum;
    }
  } catch { /* private mode */ }
  paintGlowMode();
  // Outside the glow and before it: the button is lit whichever glow is on
  // show, and on a page whose WebGL2 never came up it simply is not.
  lamp = mountLamp(els.play, { hdr, playing }) ?? undefined;
  applyGlowMode();
  paintGlowRange();

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
    volume = (storedNumber(VOLUME_KEY, 0, 100) ?? DEFAULT_VOLUME * 100) / 100;
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
    opening = false;
    /**
     * Pressed while the page was opening, so the wait the listener has already
     * begun goes on being a wait — `play` owns the button from here and it is
     * already in the state it needs to be in.
     */
    if (wanted) { await play(cut); return; }
    loading = false;
    paintPlay();
    // …and then get this record ready to start on the first press rather than
    // making that press wait for it. Returns immediately.
    void arm(cut);
  } catch (err) {
    opening = false;
    loading = false;
    paintPlay();
    showError('The generator would not start. Reloading usually fixes it.');
    console.error(err);
  }
}

void boot();
