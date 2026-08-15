/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Browser audition page.
 *
 * This is the only place the app talks to Strudel. Everything musical happens
 * in the generator; Strudel just plays back the code the renderer emitted.
 * Layer toggles regenerate the pattern with tracks muted, which is the same
 * mechanism a game would use to duck stems.
 */

import {
  initAudio, loadCode, playCode, preloadSounds, setOutputLevel, silenceVoices, startLoaded,
  stopPlayback, stopSounding,
} from './audio.js';
import { generateSongAsync } from './generator.js';
import { createSungVoice, withoutSungVoice } from './sung-voice.js';

import type { GenerateOptions } from '../generate/song.js';
import { renderStrudel } from '../render/strudel.js';
import { renderMidi } from '../render/midi.js';
import {
  meterLabel, songDurationBeats, songDurationSeconds, type LayerId, type Song,
} from '../core/types.js';
import { Rng } from '../core/rng.js';
import { GENRES, GENRE_IDS, getGenre } from '../genre/index.js';
import { formatChaosMixing, readChaosMixing, type ChaosLevel } from '../genre/chaos.js';
import { STRICTNESS_LEVELS, getStrictness, type StrictnessId } from '../core/rules.js';
import { HOOK_LEVELS, getHook, type HookId } from '../generate/hook.js';
import { DEFAULT_SUNG_CHANCE, SUNG_CHANCE } from '../concert/setlist.js';

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el as T;
};

const els = {
  genre: $<HTMLSelectElement>('genre'),
  mood: $<HTMLSelectElement>('mood'),
  era: $<HTMLSelectElement>('era'),
  style: $<HTMLSelectElement>('style'),
  strictness: $<HTMLSelectElement>('strictness'),
  strictnessHint: $<HTMLDivElement>('strictness-hint'),
  hook: $<HTMLSelectElement>('hook'),
  hookHint: $<HTMLDivElement>('hook-hint'),
  seed: $<HTMLInputElement>('seed'),
  chaos: $<HTMLDivElement>('chaos'),
  chaosSpread: $<HTMLInputElement>('chaos-spread'),
  chaosMixBlock: $<HTMLDivElement>('chaos-mix-block'),
  chaosOne: $<HTMLDivElement>('chaos-one'),
  chaosMixing: $<HTMLDivElement>('chaos-mixing'),
  chaosSeed: $<HTMLInputElement>('chaos-seed'),
  chaosSeedRow: $<HTMLDivElement>('chaos-seed-row'),
  chaosAll: $<HTMLButtonElement>('chaos-all'),
  chaosAdvanced: $<HTMLButtonElement>('chaos-advanced'),
  vocals: $<HTMLSelectElement>('vocals'),
  reset: $<HTMLButtonElement>('reset'),
  play: $<HTMLButtonElement>('play'),
  next: $<HTMLButtonElement>('next'),
  radio: $<HTMLButtonElement>('radio'),
  watch: $<HTMLButtonElement>('watch'),
  copy: $<HTMLButtonElement>('copy'),
  dl: $<HTMLButtonElement>('dl'),
  oops: $<HTMLDivElement>('oops'),
  title: $<HTMLSpanElement>('title'),
  meta: $<HTMLDivElement>('meta'),
  form: $<HTMLDivElement>('form'),
  layers: $<HTMLDivElement>('layers'),
  code: $<HTMLPreElement>('code'),
  codeBox: $<HTMLDetailsElement>('code-box'),
};

/**
 * The mixing rate before anybody moves it, taken from the markup rather than
 * written down a second time here — `Reset` and the `full chaos` chip both need
 * to know where the middle is, and two of them would be one of them wrong.
 *
 * Read now, at the top, because a copied link overwrites the control a moment
 * later and the default would go with it.
 */
const DEFAULT_SPREAD = els.chaosSpread.value;

let current: Song | undefined;
let playing = false;
/**
 * The band is on its way over the wire — see `preloadSounds`.
 *
 * A second or two on a cold page, and it used to be announced in the status line
 * while the button went on saying "Play ▶", so the one control the page is about
 * looked untouched for the whole of it. It is a state of *this button*, like the
 * other two, and `paintPlay` is the only thing that reads it.
 */
let loading = false;
/**
 * On by default, because a station is what this page is for.
 *
 * Off, the page writes one song and waits to be asked for another, which is the
 * bench behaviour the level controls want and not what somebody opening the site
 * came for. Nothing sounds until Play is pressed either way — the browser would
 * not allow it — so the default costs nothing and means the second press is the
 * next record rather than a button nobody found.
 */
let radioMode = true;
let radioTimer: number | undefined;
/**
 * Which press the audio belongs to. Bumped by every play and every stop.
 *
 * `play` waits for the instruments to load before it starts anything, which is
 * a window a second or two wide on a cold page — long enough for the user to
 * press Stop, or to toggle a layer and ask for a different render, while the
 * first request is still in the air. Without a generation the stale one lands
 * afterwards and starts music nobody asked for any more.
 */
let playGeneration = 0;
const muted = new Set<LayerId>();

/** A record, written and rendered, waiting for its turn. */
interface Prepared {
  song: Song;
  /** Its Strudel. Cheap to produce, but not free in the gap between two records. */
  code: string;
}

/**
 * The next record, cued while this one is still playing. See `prepareNext`.
 *
 * A promise rather than a value because the changeover may arrive before the
 * worker has answered — on a short piece, or a cold fetch of a band nobody has
 * heard yet — and `advance` would rather wait on the work already in flight than
 * start a second copy of it. It resolves to `undefined` rather than rejecting;
 * nothing on a station should stop because the record after next could not be
 * written early.
 */
let pending: Promise<Prepared | undefined> | undefined;

function fillSelect(select: HTMLSelectElement, entries: [string, string][], anyLabel?: string): void {
  if (anyLabel) select.append(new Option(anyLabel, ''));
  for (const [value, label] of entries) select.append(new Option(label, value));
}

/**
 * What a copied link says, and the only keys this page will take out of its own
 * address bar.
 *
 * The concert's vocabulary rather than a second one — `web/concert/main.ts`
 * reads exactly these names, and `Watch on stage` already hands them across, so
 * the two pages go on describing the same song in the same words. A private
 * spelling here would be the pair of them drifting one rename at a time.
 */
const LINK_KEYS = [
  'seed', 'genre', 'era', 'style', 'mood', 'strictness', 'hook', 'vocals',
  'chaos', 'spread', 'mix', 'chaosSeed',
] as const;

const linked = new URLSearchParams(location.search);
/** Was this page opened from a link somebody copied, or cold? */
const cameFromLink = LINK_KEYS.some((key) => linked.has(key));

/**
 * A linked value, but only if the control it is for can actually hold it.
 *
 * A link is a string that people edit, forward and keep for months, and the
 * tables behind these selects move — a style that has been renamed would
 * otherwise leave its select on a value with no option, which reads back as the
 * empty string and generates from a blank mood. Checked against the options,
 * so a field the page cannot honour costs that field its default and nothing
 * else.
 */
function linkedOption(select: HTMLSelectElement, key: string): string | undefined {
  const want = linked.get(key);
  if (!want) return undefined;
  return Array.from(select.options).some((o) => o.value === want) ? want : undefined;
}

fillSelect(els.genre, Object.values(GENRES).map((g) => [g.id, g.label]));
/**
 * A different genre every time the page is opened — unless a link named one.
 *
 * It defaulted to iskelmä because iskelmä was the first genre written, and the
 * effect after eighteen more was a site that sounded like one of them: the other
 * genres were a dropdown away and the opening record never came from them. Drawn
 * fresh instead, so what plays first is a fair sample of what the thing does.
 *
 * `Math.random` rather than a seeded stream on purpose — the seed reproduces a
 * *song*, and which genre a visitor happens to land on is not part of it. Which
 * is also why a link beats the draw: somebody who was handed an address was
 * handed one record, not a fresh sample of the site.
 */
els.genre.value = linkedOption(els.genre, 'genre')
  ?? GENRE_IDS[Math.floor(Math.random() * GENRE_IDS.length)]!;
fillSelect(els.strictness, STRICTNESS_LEVELS.map((l) => [l.id, `${l.level} · ${l.label}`]));
els.strictness.value = 'standard';
fillSelect(els.hook, HOOK_LEVELS.map((l) => [l.id, `${l.level} · ${l.label}`]));
els.hook.value = 'standard';
/**
 * Whether there is a singer, in the vocabulary the concert already uses.
 *
 * It was a checkbox, which could say two of the three things worth saying. The
 * third is the interesting one on a page with a radio mode: **let the genre
 * decide**, at the rate `SUNG_CHANCE` sets, so a station plays mostly
 * instrumentals with a sung one every third or fourth track the way the concert
 * programmes an evening. Two of nineteen genres never sing at all and the table
 * says so, which a checkbox could not.
 *
 * `VocalPolicy`'s three ids rather than three of this page's own, because the
 * showbill, the concert URL and `buildSetlist` all speak them already and a
 * fourth vocabulary for the same idea is how two of them drift.
 */
fillSelect(els.vocals, [
  ['instrumental', 'instrumental'],
  ['sung', 'sung'],
  ['mixed', 'mixed — the genre decides'],
]);
els.vocals.value = 'instrumental';
/**
 * The chaos boxes — one per kind of property, independently tickable.
 *
 * A dropdown was the first version and it was wrong for one reason: it could
 * only express a *reach*, so `harmony` implied `band` and there was no way to
 * ask for somebody else's chords played by the host's own band. The kinds do not
 * presuppose each other in the engine and should not in the control.
 *
 * Labelled by what each one *changes* rather than by its id, because the id is
 * only legible once you have read `genre/chaos.ts` and the whole point of the
 * control is to be turned without reading anything. The genre picker above goes
 * on meaning what it means: it names the **host**, the band whose room and whose
 * bar the piece keeps, and these say how much of everything else comes from
 * somewhere else.
 */
const CHAOS_BOXES: [ChaosLevel, string, string][] = [
  ['band', 'band', 'who is playing — instruments and the drum machine'],
  ['performance', 'performance', 'how they play it — feels, fills, seams, effects'],
  ['figures', 'figures', 'what they play — bass, comp and drum patterns, melodic cells'],
  ['harmony', 'harmony', 'what it is played over — progressions and the chord-scale rule'],
  ['form', 'form', 'what shape it is — form, length, ending, the title'],
  ['staging', 'staging', 'what it looks like — clothes, their colours, the body, the programme'],
];
for (const [id, label, hint] of CHAOS_BOXES) {
  const wrap = document.createElement('label');
  wrap.className = 'check';
  wrap.title = hint;
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.id = `chaos-${id}`;
  box.value = id;
  box.onchange = onChaosChange;
  const text = document.createElement('span');
  text.textContent = label;
  wrap.append(box, text);
  // Before the `full chaos` chip, which is written into the container in the
  // markup so it lands at the end of the row it sets rather than the start.
  els.chaos.insertBefore(wrap, els.chaosAll);
}

/**
 * **Advanced** — the same Mixing slider, once per kind.
 *
 * One rate for everything is the right *first* control and it cannot say the
 * thing people actually want to say, which is a rate per kind: a wholly foreign
 * band playing our own chords, with one thing about the form from elsewhere.
 * With a single dial that is three different songs and none of them is it.
 *
 * Built from the same table as the boxes, in the same order, so the two rows
 * read down: the third box and the third slider are the same kind, and adding a
 * seventh kind adds both without touching this file twice.
 *
 * The panel is a *view* of the rates rather than a second set of them — the
 * simple slider goes on existing underneath, and a kind with no slider of its
 * own falls back to it in `planChaos` exactly as `ChaosOptions.mixing` says.
 */
for (const [id, label, hint] of CHAOS_BOXES) {
  const wrap = document.createElement('div');
  wrap.className = 'mixing';
  const text = document.createElement('label');
  text.htmlFor = `chaos-mix-${id}`;
  text.title = hint;
  const value = document.createElement('b');
  value.id = `chaos-mix-${id}-value`;
  text.append(document.createTextNode(label), value);
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.id = `chaos-mix-${id}`;
  slider.min = '0';
  slider.max = '100';
  slider.step = '5';
  slider.value = els.chaosSpread.value;
  // Same split as the single slider: painted while it is dragged, heard when it
  // is let go. And once one of these has been moved the panel is the user's, so
  // opening it again does not reset it to whatever the simple slider says.
  slider.oninput = () => { mixTouched = true; paintMix(id); syncFullChaos(); };
  slider.onchange = () => { if (chosenLevels().length) onControlChange(); };
  wrap.append(text, slider);
  els.chaosMixing.append(wrap);
}

/** Has anybody moved a per-kind slider? See the `advanced` chip. */
let mixTouched = false;

const mixSlider = (id: ChaosLevel): HTMLInputElement => $<HTMLInputElement>(`chaos-mix-${id}`);

function advancedChaos(): boolean {
  return els.chaosAdvanced.classList.contains('on');
}

/** Fill one per-kind track and write its rate beside the name. */
function paintMix(id: ChaosLevel): void {
  const slider = mixSlider(id);
  slider.style.setProperty('--fill', `${slider.value}%`);
  $<HTMLElement>(`chaos-mix-${id}-value`).textContent = `${slider.value}%`;
}

function paintAllMix(): void {
  for (const [id] of CHAOS_BOXES) paintMix(id);
}

/**
 * A rate with nothing to apply to is not shown at all.
 *
 * With no kind ticked the whole block goes, because a Mixing slider above six
 * clear boxes is a control for a thing that is not happening. In the advanced
 * panel it is per kind, for the same reason one step down: the boxes already
 * say which kinds are off, and repeating it in six dead sliders reads as a
 * broken panel rather than an available one.
 */
function syncChaosVisible(): void {
  const chosen = new Set(chosenLevels());
  els.chaosMixBlock.hidden = chosen.size === 0;
  for (const [id] of CHAOS_BOXES) {
    (mixSlider(id).parentElement as HTMLElement).hidden = !chosen.has(id);
  }
}

paintSpread();
paintAllMix();
syncChaosVisible();

/** Which kinds are ticked, in `CHAOS_LEVELS` order rather than DOM order. */
function chosenLevels(): ChaosLevel[] {
  return CHAOS_BOXES
    .map(([id]) => id)
    .filter((id) => ($<HTMLInputElement>(`chaos-${id}`)).checked);
}

/**
 * **Full chaos** — every kind at once, mixing at 100%, and off again.
 *
 * A chip rather than a checkbox or a plain button, because it is doing the job
 * of both and the panel already has the idiom: the layer mutes two rows down are
 * small things that are either on or off and say which by their colour. This is
 * the same object. Pressing it when it is off sets everything; pressing it when
 * it is on clears everything, which is the only sensible reading of pressing
 * *full chaos* on a stage that is already in full chaos.
 *
 * **It holds no state of its own.** `isFullChaos` asks the controls, so the
 * highlight is a rendering of them rather than a fourth thing that can disagree
 * — untick one box and the chip goes out by itself. That is what a checkbox
 * could not do without a flag to keep in step, and it is why this reads as one
 * control rather than two.
 *
 * A shortcut rather than a mode, still: everything it asked for stays visible
 * and nudgeable, so "everything, but leave the chords alone" is two clicks.
 */
function isFullChaos(): boolean {
  if (chosenLevels().length !== CHAOS_BOXES.length) return false;
  // Whichever control is the one in force: in advanced mode the single slider
  // applies to nothing, so a page with six sliders at 100 is in full chaos
  // however that one happens to be sitting.
  return advancedChaos()
    ? CHAOS_BOXES.every(([id]) => mixSlider(id).value === '100')
    : els.chaosSpread.value === '100';
}

function syncFullChaos(): void {
  els.chaosAll.classList.toggle('on', isFullChaos());
}

function toggleFullChaos(): void {
  const on = isFullChaos();
  for (const [id] of CHAOS_BOXES) $<HTMLInputElement>(`chaos-${id}`).checked = !on;
  // Turning it on pushes the rate to the top; turning it off puts it back in the
  // middle rather than leaving it at 100, which would be the one setting nobody
  // asked for — every box clear and the slider still pinned, so the next box
  // ticked would arrive at full strength.
  //
  // Both controls move, whichever is showing. The one out of sight is where the
  // page lands if it is switched to, and full chaos followed by a switch that
  // dropped back to half chaos would be the chip lying about what it did.
  els.chaosSpread.value = on ? DEFAULT_SPREAD : '100';
  for (const [id] of CHAOS_BOXES) mixSlider(id).value = on ? DEFAULT_SPREAD : '100';
  mixTouched = true;
  paintSpread();
  paintAllMix();
}

/**
 * Open or close the per-kind panel.
 *
 * Opening it for the first time copies the single slider into all six, so the
 * panel starts as a picture of the setting it replaces and the song does not
 * move underneath the click. After that the six are the user's — flipping the
 * chip is then an A/B between one rate and their own mix, which is the reason
 * to have a chip rather than a mode you cannot get out of.
 */
function toggleAdvanced(): void {
  const on = !advancedChaos();
  els.chaosAdvanced.classList.toggle('on', on);
  els.chaosOne.hidden = on;
  els.chaosMixing.hidden = !on;
  els.chaosSeedRow.hidden = !on;
  // Six sliders need the row; one is happy in a column beside the boxes.
  els.chaosMixBlock.classList.toggle('wide', on);
  if (on && !mixTouched) {
    for (const [id] of CHAOS_BOXES) mixSlider(id).value = els.chaosSpread.value;
  }
  paintAllMix();
}

/**
 * Paint the slider's track up to the thumb.
 *
 * A native range gives no way to fill the bar behind the thumb, so the CSS reads
 * this custom property and the value has to be pushed into it whenever it moves.
 * Without it the control could not show the one setting it most needs to — a
 * mixing rate of 100 looked like a bar two thirds full.
 */
function paintSpread(): void {
  els.chaosSpread.style.setProperty('--fill', `${els.chaosSpread.value}%`);
}

/**
 * Styles, eras and moods all belong to a genre, so switching genre has to
 * rebuild them. The "any" option stays first so the generator keeps its own
 * weighted choice unless the user overrides it.
 */
function populateForGenre(): void {
  const genre = getGenre(els.genre.value);
  els.mood.replaceChildren();
  els.era.replaceChildren();
  els.style.replaceChildren();
  fillSelect(els.mood, Object.values(genre.moods).map((m) => [m.id, `${m.label} — ${m.gloss}`]));
  fillSelect(els.era, Object.values(genre.eras).map((e) => [e.id, e.label]), 'Any era');
  fillSelect(els.style, Object.values(genre.styles).map((s) => [s.id, s.label]), 'Any style');
  // Every genre defines a neutral mood last; default to it.
  const moodIds = Object.keys(genre.moods);
  els.mood.value = moodIds[moodIds.length - 1]!;
  els.strictness.value = genre.defaultStrictness;
  els.hook.value = genre.defaultHook;
}
populateForGenre();

/**
 * Put a copied link's settings into the controls.
 *
 * After `populateForGenre`, which fills the three per-genre selects and pushes
 * the genre's own defaults into the two level ones — a link is more specific
 * than a default and has to land on top of it, not under it.
 *
 * Radio mode goes off with the seed, because the station's whole business is
 * dropping one: `nextTrack` deletes a pinned seed, and the advance timer would
 * have thrown this song away a few minutes after the page opened, with nobody
 * having touched anything. The link is one record; the button is right there
 * when the listener wants a station instead.
 */
function applyLink(): void {
  if (!cameFromLink) return;

  for (const [select, key] of [
    [els.mood, 'mood'], [els.era, 'era'], [els.style, 'style'],
    [els.strictness, 'strictness'], [els.hook, 'hook'], [els.vocals, 'vocals'],
  ] as const) {
    const value = linkedOption(select, key);
    if (value !== undefined) select.value = value;
  }

  const seed = linked.get('seed')?.trim();
  if (seed) {
    els.seed.value = seed;
    radioMode = false;
  }

  /**
   * Chaos, spelled the way the stage reads it in `optionsFromUrl`: the ticked
   * kinds as a comma list, the one rate that applies to them, and the per-kind
   * rates when the advanced panel was open. Unknown kinds are dropped rather
   * than refused, for the same reason a renamed style is.
   */
  const levels = new Set((linked.get('chaos') ?? '')
    .split(',')
    .map((id) => CHAOS_BOXES.find(([l]) => l === id.trim())?.[0])
    .filter((l): l is ChaosLevel => l !== undefined));
  for (const [id] of CHAOS_BOXES) $<HTMLInputElement>(`chaos-${id}`).checked = levels.has(id);

  const spread = Number(linked.get('spread'));
  if (linked.has('spread') && Number.isFinite(spread)) {
    els.chaosSpread.value = String(Math.min(100, Math.max(0, Math.round(spread * 100))));
  }

  const mixing = readChaosMixing(linked.get('mix') ?? '');
  if (Object.keys(mixing).length) {
    // A kind the spec leaves out keeps the single rate, which is what an absent
    // entry means everywhere else — see `ChaosOptions.mixing`.
    for (const [id] of CHAOS_BOXES) {
      const rate = mixing[id];
      mixSlider(id).value = rate === undefined
        ? els.chaosSpread.value
        : String(Math.round(rate * 100));
    }
    // Before the panel opens, or opening it would copy the single slider over
    // the six rates that were just read out of the link.
    mixTouched = true;
    toggleAdvanced();
  }

  const chaosSeed = linked.get('chaosSeed')?.trim();
  if (chaosSeed) els.chaosSeed.value = chaosSeed;

  paintSpread();
  paintAllMix();
  syncChaosVisible();
  syncFullChaos();
}

/**
 * …and take them back out of the address bar.
 *
 * They are in the controls now, and the controls are the state. Left in the
 * query the address would go on describing the moment the page was opened
 * rather than anything done since — press Next a dozen times, refresh, and the
 * link's song comes back over the top of the station, which is the one thing
 * nobody asked a reload to do.
 *
 * `replaceState` rather than `pushState`: the clean address takes the place of
 * the one that was loaded instead of stacking a second entry on top of it, so
 * Back leaves the site the way it always did rather than stepping from the page
 * to the same page without its parameters.
 *
 * Only our own keys go. Anything else in the query belongs to somebody else and
 * is none of this page's business.
 */
function consumeLink(): void {
  if (!cameFromLink) return;
  const url = new URL(location.href);
  for (const key of LINK_KEYS) url.searchParams.delete(key);
  history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

applyLink();
consumeLink();

function updateStrictnessHint(): void {
  const level = getStrictness(els.strictness.value as StrictnessId);
  els.strictnessHint.textContent = radioMode
    ? `${level.gloss} — radio mode is on, so this starts a new song. Turn it off to hear the same one filtered differently.`
    : els.seed.value.trim()
      ? `${level.gloss} — seed is pinned, so changing this replays the same song filtered differently.`
      : `${level.gloss} — pin a seed to hear the same song at different levels.`;
}

/**
 * Both level controls are meant to be A/B'd against a fixed arrangement: the
 * seed pins the form, key, tempo, instruments and groove, and only the tune
 * moves underneath them. Say so, because a control you can compare against
 * itself is a different thing from one that rerolls the song.
 *
 * Except on a station, where every touch of a control is the next record — see
 * `onControlChange`. The hint follows the mode rather than describing the one
 * the page is not in.
 */
function updateHookHint(): void {
  const level = getHook(els.hook.value as HookId);
  els.hookHint.textContent = radioMode
    ? `${level.gloss} — radio mode is on, so this starts a new song. Turn it off to hear it against the same arrangement.`
    : `${level.gloss} — the arrangement is fixed by the seed, so this changes only how much the tune returns.`;
}

/**
 * Say that something broke, or take the notice away.
 *
 * What is left of a status line that used to narrate the ordinary running of the
 * page — "Writing the next song…", "Loading instruments…", "Playing.",
 * "Stopped." — none of which anybody could read, because each was replaced by
 * the next within a few hundred milliseconds while the thing they described was
 * still going on. The state of the machine belongs on the control that has it,
 * which is `paintPlay`. This is only for the three things that are genuinely
 * news and stay true until something is done about them.
 */
function showError(text: string): void {
  els.oops.textContent = text;
  els.oops.hidden = false;
}

function clearError(): void {
  els.oops.textContent = '';
  els.oops.hidden = true;
}

/**
 * What the one button says, from the only two flags that decide it.
 *
 * Loading, playing and stopped are three states of the same control, and they
 * used to be spread across two places — the label knew about two of them and a
 * line underneath announced all three, so the page said "Playing." below a
 * button reading "Stop ■" and said "Loading instruments…" below one still
 * offering to play. Written here once instead.
 */
function paintPlay(): void {
  els.play.textContent = loading ? 'Loading…' : playing ? 'Stop ■' : 'Play ▶';
}

/**
 * One song at a time, however fast the buttons are pressed.
 *
 * The buttons go dead for the duration rather than queueing: two presses of Next
 * are two songs written and one thrown away, and the thrown-away one is the one
 * the person was looking at.
 *
 * It used to announce the wait as well ("Writing the next song…"). It no longer
 * does, because generation is the *short* part — 13–89 ms on a worker thread,
 * against a preload measured in hundreds of milliseconds and a transpile of up
 * to 240 KB after it. The line was on screen for a twentieth of the wait it
 * claimed to be describing and gone before the part that actually stalls, which
 * is why it read as a flicker. The button says "Loading…" across the whole of
 * it instead — see `paintPlay`.
 */
async function writing<T>(work: () => Promise<T>): Promise<T> {
  const buttons = [els.play, els.next, els.radio, els.reset, els.copy, els.dl];
  const was = buttons.map((b) => b.disabled);
  for (const b of buttons) b.disabled = true;
  try {
    return await work();
  } finally {
    buttons.forEach((b, i) => { b.disabled = was[i]!; });
  }
}

function currentOptions(): GenerateOptions {
  const opts: GenerateOptions = { genre: els.genre.value };
  if (els.seed.value.trim()) opts.seed = els.seed.value.trim();
  if (els.era.value) opts.era = els.era.value;
  if (els.style.value) opts.style = els.style.value;
  if (els.mood.value) opts.mood = els.mood.value;
  if (els.strictness.value) opts.strictness = els.strictness.value as StrictnessId;
  if (els.hook.value) opts.hook = els.hook.value as HookId;
  opts.vocals = wantsVocals(opts.seed);
  const levels = chosenLevels();
  if (levels.length) {
    opts.chaos = { levels, spread: Number(els.chaosSpread.value) / 100 };
    // Only the ticked kinds: an entry for a kind nobody selected changes
    // nothing, and leaving it out keeps the recipe printed below down to what
    // was actually heard.
    if (advancedChaos()) {
      opts.chaos.mixing = Object.fromEntries(
        levels.map((id) => [id, Number(mixSlider(id).value) / 100]),
      );
      /**
       * The band's own seed, when one is typed.
       *
       * Empty means the song's, which is what it has always been and what the
       * placeholder says. Typing anything here redraws every borrowing and
       * leaves the piece exactly where it was — the two streams were always
       * separate, so this is the one control on the page that can change who is
       * playing without changing what they are playing. See `ChaosOptions.seed`.
       */
      const seed = els.chaosSeed.value.trim();
      if (seed) opts.chaos.seed = seed;
    }
  }
  return opts;
}

/**
 * The recipe for the *next* record on the station.
 *
 * `currentOptions` with any pinned seed dropped, which is the whole of what makes
 * it the next record rather than this one again. One function rather than the two
 * lines written out at each site, because `nextTrack` and `prepareNext` have to
 * draw from the same hat — a record fetched in advance under a different recipe
 * from the one that plays is a preload that bought nothing.
 *
 * The seed is dropped *after* `currentOptions` has read it, deliberately: that is
 * what settles `vocals` for a pinned seed before it goes, and it is the order the
 * page has always used here.
 */
function stationOptions(): GenerateOptions {
  const opts = currentOptions();
  delete opts.seed;
  return opts;
}

/**
 * Is this one sung?
 *
 * `instrumental` and `sung` are the caller overriding the draw outright, exactly
 * as `planVocals` describes them. `mixed` is the draw itself, at this genre's own
 * rate, and it is resolved *here* rather than inside the generator because the
 * generator has no notion of a policy — `GenerateOptions.vocals` is a boolean and
 * should stay one.
 *
 * Which stream it comes from depends on whether a seed is pinned, and the two
 * answers are both right:
 *
 *  - **Pinned** — derived from the seed, so a song sings or does not sing, and
 *    goes on doing the same thing every time it is regenerated. That keeps the
 *    documented A/B intact: `vocals` draws from its own stream inside the
 *    generator, so the instrumental arrangement is identical either way, and a
 *    control that re-flipped the coin on every redraw would hide that.
 *  - **Unpinned** — a fresh coin, which is only reachable from radio mode, where
 *    every track is a new song anyway and a station that decided once would be a
 *    station that never changed its mind.
 */
function wantsVocals(seed: GenerateOptions['seed']): boolean {
  const policy = els.vocals.value;
  if (policy !== 'mixed') return policy === 'sung';
  const rate = SUNG_CHANCE[els.genre.value] ?? DEFAULT_SUNG_CHANCE;
  return seed === undefined ? Math.random() < rate : new Rng(`${seed}:sung`).chance(rate);
}

/** Strip muted layers so the audition matches what the game would hear. */
function audible(song: Song): Song {
  if (!muted.size) return song;
  return {
    ...song,
    tracks: song.tracks.filter((t) => !muted.has(t.layer)),
    drums: muted.has('drums') ? { ...song.drums, events: [] } : song.drums,
  };
}

function describe(song: Song): void {
  const { meta } = song;
  els.title.textContent = meta.title;
  const mins = songDurationSeconds(song);
  const lift = song.sections.find((s) => s.transpose > 0);
  // Ambient styles frequently have no kit at all, and naming a drum machine
  // that never plays is worse than saying nothing.
  const hasDrums = song.drums.events.length > 0;
  els.meta.innerHTML = [
    `<b>${meta.genreLabel}</b> — <b>${meta.styleLabel}</b> · ${meta.eraLabel}`,
    `${meta.keyLabel} · ${meta.bpm} BPM · ${meterLabel(meta)} · ${meta.totalBars} bars · ${Math.floor(mins / 60)}:${String(Math.round(mins % 60)).padStart(2, '0')}`,
    `${hasDrums ? `Drums: ${song.drums.bank}` : 'No drums'}${lift ? ` · key change +${lift.transpose} for the last chorus` : ''}`,
    `Smoothness: <b>${meta.strictnessLabel}</b> — ${getStrictness(meta.strictness as StrictnessId).gloss}`,
    `Hook: <b>${meta.hookLabel}</b> — ${getHook(meta.hook as HookId).gloss}`,
    song.tracks.map((t) => `${t.layer}: <b>${t.instrument}</b>`).join(' · '),
    // Only on a chimera, and it names the donors rather than counting them: a
    // listener who can hear something foreign wants to know what it was.
    // A kind mixed at a rate of its own carries that rate; the bare ones are on
    // the rate that follows the list.
    ...(meta.chaos ? [`Chaos: <b>${meta.chaos.levels.map((l) => (
      meta.chaos!.mixing?.[l] !== undefined ? `${l} ${Math.round(meta.chaos!.mixing[l]! * 100)}%` : l
    )).join(' + ')}</b> at ${Math.round(meta.chaos.spread * 100)}% over <b>${
      meta.chaos.host.genre}:${meta.chaos.host.style}</b>${
      meta.chaos.seed ? ` · band from seed <b>${meta.chaos.seed}</b>` : ''}<br>${
      Object.entries(meta.chaos.borrowed).map(([k, v]) => `${k} ← <b>${v}</b>`).join(' · ') || 'nothing borrowed'}`] : []),
    `seed: <b>${meta.seed}</b>`,
  ].join('<br>');

  els.form.innerHTML = '';
  for (const s of song.sections) {
    const el = document.createElement('span');
    el.className = `seg ${s.kind}${s.transpose ? ' lift' : ''}`;
    el.textContent = `${s.kind}${s.transpose ? ` +${s.transpose}` : ''}`;
    el.title = s.chordLabels.join(' · ');
    els.form.append(el);
  }

  els.layers.innerHTML = '';
  const layers: LayerId[] = [
    ...(hasDrums ? ['drums' as LayerId] : []),
    ...song.tracks.map((t) => t.layer),
  ];
  for (const layer of layers) {
    const el = document.createElement('span');
    el.className = `layer${muted.has(layer) ? '' : ' on'}`;
    el.textContent = layer;
    el.onclick = () => {
      if (muted.has(layer)) muted.delete(layer);
      else muted.add(layer);
      el.className = `layer${muted.has(layer) ? '' : ' on'}`;
      if (playing && current) void play(current);
    };
    els.layers.append(el);
  }

  paintCode();
}

/**
 * The emitted Strudel, but only for somebody who has opened the drawer.
 *
 * It was written out with the rest of the description, on every song — a whole
 * second render of a piece that is 47 to 94 KB of text, plus the DOM write, on
 * the main thread, between a control being nudged and the music starting, for a
 * panel that is closed. The song that is playing is `current`, so this can be
 * left until the disclosure is opened and cost nothing until then.
 */
function paintCode(): void {
  if (!els.codeBox.open || !current) return;
  els.code.textContent = renderStrudel(current);
}

els.codeBox.ontoggle = paintCode;

/**
 * The vocal layer, sung rather than played.
 *
 * One for the page rather than one per song: it holds an `AudioContext` and a
 * reverb impulse, and building those per track would be a lot of garbage for a
 * radio that never stops changing tracks.
 */
const voice = createSungVoice();

/**
 * A record cued behind the one that is playing, and the moment it may begin.
 */
interface Handover {
  /** Already rendered, by `prepareNext`. */
  code: string;
  /**
   * The downbeat may not land before this `performance.now()` reading — the end
   * of the previous record's ring-out.
   *
   * A floor, not a delay. The compile happens *before* this is waited on, so a
   * compile that ate the whole window starts the moment it finishes: the gap
   * between two records is the longer of the ring and the compile, where it used
   * to be the two of them added together.
   */
  notBefore: number;
}

/**
 * Start a record. Two ways in, and the difference between them is most of what
 * makes an hour of this listenable.
 *
 *  - **Cold** — Play was pressed, or a control moved. There is nothing to hide
 *    the wait behind, so compile and start in one call and let the button say
 *    "Loading…" for the whole of it.
 *  - **Handover** — the record before this one has just stopped and is ringing
 *    out. Its replacement was written, rendered and fetched during it, so all
 *    that is left to do is the compile, and there is a window to do it in. See
 *    `advance`.
 */
async function play(song: Song, handover?: Handover): Promise<void> {
  const generation = ++playGeneration;
  // The vocal layer leaves the pattern and is sung by `web/voice-synth.ts`
  // instead — see `sung-voice.ts` for why it cannot stay in it.
  const code = handover?.code ?? renderStrudel(withoutSungVoice(audible(song)));
  try {
    /**
     * Get the instruments onto the machine before the downbeat, not on it.
     *
     * Strudel fetches a sound the first time a hap plays it, so without this
     * the opening bars are a race between the pattern and the band arriving
     * over the wire — see `preloadSounds`. It is bounded and it is cached, so
     * the wait is a second or so on the first song of a session and nothing at
     * all on a track that reuses instruments already heard.
     *
     * Already warm on a handover — `prepareNext` fetched this band under the
     * previous record — so the call is kept rather than skipped: it costs
     * nothing when it has nothing to do, and it is the guarantee rather than the
     * optimisation.
     */
    if (!handover) {
      /**
       * The button says "Loading…" for a cold start and says nothing at all for
       * a handover, because on a handover there is nothing to report: the
       * previous record is ringing, the station is audibly still playing, and a
       * control that announced a load over the top of music would be describing
       * the machinery instead of the state. `playing` is still true throughout,
       * so the button goes on offering the stop it should.
       */
      loading = true;
      paintPlay();
    }
    await preloadSounds(song);
    /**
     * Stopped, or superseded by a newer press, while the band was loading.
     *
     * The flag is deliberately left alone here: whoever bumped the generation
     * owns the button now — a stop has already cleared it, and a newer press has
     * set it for its own load — so clearing it on the way out would paint this
     * dead press's state over theirs.
     */
    if (generation !== playGeneration) return;
    if (handover) {
      /**
       * The compile, in the one window where a blocked main thread costs nothing.
       *
       * This is where the wait actually is. Measured in the page, turning the
       * emitted code into a pattern is **0.5–1.9 s of blocked main thread** —
       * 60–65% of it the drum layer — and it does not warm up, so the same string
       * costs the same every time. Generation, by comparison, is tens of
       * milliseconds on a worker.
       *
       * It cannot run while the scheduler is going: a second of blocked thread
       * is a second in which nothing hands Web Audio the notes it was about to
       * play, and the pattern tears. And running it *after* the ring-out — which
       * is what the page did before — adds the whole of it to the silence
       * between two records, so the gap was the ring plus the compile plus the
       * fetch, three to four seconds, twenty times an hour.
       *
       * `advance` has already stopped the scheduler, so here there is nothing to
       * starve. The last chord is ringing on the audio clock, which this thread
       * cannot reach and does not need to.
       */
      await loadCode(code, endsItself(song));
      if (generation !== playGeneration) return;
      await until(handover.notBefore);
      if (generation !== playGeneration) return;
      /**
       * The ring-out ends here, and it ends *properly*.
       *
       * The fader is the only thing that reaches a voice already handed to Web
       * Audio, and a fader only hides — so a last chord with four seconds of
       * pad left in it would go on sounding straight through the next record's
       * opening bar, at full level, with nothing on the page to say why. The
       * last sliver of the ring is faded rather than cut on the spot, because a
       * disconnect on a signal that is still moving is a click.
       */
      setOutputLevel(0, TAIL_FADE_SECONDS);
      await until(performance.now() + TAIL_FADE_SECONDS * 1000);
      if (generation !== playGeneration) return;
      voice.end();
      silenceVoices();
      setOutputLevel(1, 0.08);
      await startLoaded();
    } else {
      /**
       * Whatever the last press left ringing stops before this one begins, and
       * the fader comes back up for it — unconditionally, because a fader left
       * down by any route is silence nobody can explain. Both matter on this
       * page for a reason the station does not have: a mute toggled mid-song is
       * a cold start over the top of a record that is still sounding, and
       * without the cut the muted layer goes on playing until its notes run out.
       *
       * The scheduler goes first, or there would be nothing to cut: it is still
       * running the *old* pattern here, and the compile below blocks for up to
       * two seconds, so a disconnect on its own would be undone by the next hap
       * it triggered.
       */
      void stopPlayback();
      await stopSounding();
      if (generation !== playGeneration) return;
      voice.end();
      setOutputLevel(1);
      await playCode(code, endsItself(song));
    }
    voice.begin(audible(song));
    playing = true;
    loading = false;
    paintPlay();
    // Whatever went wrong last time did not go wrong this time, and a failure
    // notice that outlives the failure is the same lie the status line told.
    clearError();
    scheduleRadioAdvance(song);
  } catch (err) {
    playing = false;
    loading = false;
    paintPlay();
    showError(`Strudel could not evaluate the pattern: ${String(err)}`);
    console.error(err);
  }
}

/**
 * The piece's length in bars when it is meant to end, and `undefined` when it is
 * meant to go round.
 *
 * The one place on this page where the two modes are actually different music
 * rather than a different label. A record on the station ends and the next one
 * follows, so the pattern is cut at the double bar — otherwise the scheduler's
 * lookahead sounds the song's own opening downbeat underneath the ring-out, a
 * tenth of a second after the ending. See `playOnce` in `web/audio.ts`.
 *
 * With radio off this is an audition: you press Play, listen, change a control
 * and listen again, and a song that fell silent after one pass would mean
 * pressing Play between every comparison. So it loops, as it always has.
 */
function endsItself(song: Song): number | undefined {
  return radioMode ? song.meta.totalBars : undefined;
}

/**
 * Stop, as a listener means it.
 *
 * `stopPlayback` halts the scheduler and leaves whatever was already handed to
 * Web Audio to finish — which is the *right* behaviour a few lines down, where
 * `RING_OUT_SECONDS` uses it to let one record's last chord die under the next
 * one. It is not what a stop button means. A held pad on the final bar goes on
 * for seconds after the press, and the page looks like it ignored the click.
 *
 * So the sound comes down as well, and the fader goes back up in `play`.
 * `stopSounding` is the fader and then the disconnect behind it, because the
 * fader alone only hides: the voices go on running and would come back up with
 * the next press, seconds later, under a record that has nothing to do with
 * them.
 */
function stop(): void {
  playGeneration += 1;
  voice.end();
  void stopSounding();
  void stopPlayback();
  playing = false;
  // Also the cancel: the generation bump above makes a load that is still in the
  // air land on nothing, and this is what takes the button off "Loading…" the
  // moment it is pressed rather than whenever the fetch happens to finish.
  loading = false;
  paintPlay();
  if (radioTimer) { clearTimeout(radioTimer); radioTimer = undefined; }
}

/**
 * Seconds between one track ending and the next starting.
 *
 * The song's last bar is now a held chord rather than whatever the pattern was
 * doing at the loop point — see `landEnding` — and a segue that starts the next
 * track on top of it throws that away. Stopping the scheduler leaves the voices
 * already sounding to finish, so this gap *is* the ending, and it is the same
 * beat of air a station leaves between records.
 */
const RING_OUT_SECONDS = 1.8;

/**
 * …and how long the very end of that ring is faded over.
 *
 * The gap is the ending, so it sounds at full level for the whole of the ring —
 * but what is left at the end of it is then cut outright rather than left to
 * bleed into the next record, and a cut on a signal that is still moving is a
 * click. See `play`.
 */
const TAIL_FADE_SECONDS = 0.12;

function scheduleRadioAdvance(song: Song): void {
  if (radioTimer) clearTimeout(radioTimer);
  if (!radioMode) return;
  /**
   * How long the **audition** lasts, which is not always how long the piece is.
   *
   * `songDurationSeconds` runs the tempo map and is the length of the `.mid`.
   * What is sounding here is Strudel, whose tempo is one global number per
   * pattern — so a song that ramps plays flat at `meta.bpm` and runs *longer*
   * than it is written, by the whole of the ramp. Handing this timer the written
   * length would cut the last stretch off every ramping record on the station,
   * which is a bug that would present as "radio mode clips the endings" and take
   * an afternoon to trace back to a tempo curve. See `render/strudel.ts`.
   *
   * Identical arithmetic for every song that holds one tempo, which is all of
   * them today.
   */
  const ms = (songDurationBeats(song) / song.meta.bpm) * 60 * 1000;
  radioTimer = window.setTimeout(() => { void advance(); }, ms);
  // …and write the one after it now, while there is a whole record's worth of
  // time to do it in. Costs nothing here: it returns immediately.
  prepareNext();
}

/** Wait until a `performance.now()` reading, or not at all if it has passed. */
function until(mark: number): Promise<void> {
  const ms = mark - performance.now();
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => { window.setTimeout(resolve, ms); });
}

/** The next record, written and rendered. */
async function writeNext(): Promise<Prepared> {
  const song = await generateSongAsync(stationOptions());
  return { song, code: renderStrudel(withoutSungVoice(audible(song))) };
}

/**
 * Cue the next record over the top of this one.
 *
 * Everything here used to happen in the gap between two records, in series with
 * it. Generation is 13–89 ms on a worker and the render is single figures, so
 * neither is the point; `preloadSounds` is the point. It is network, and a
 * station that changes genre every few minutes asks for a band nobody has heard
 * yet more often than not, so the gap carried a cold fetch as well as a compile.
 * Done here it happens under a record that is already playing, where latency is
 * free.
 *
 * Deliberately **not** wrapped in `writing`. That disables the controls, and a
 * panel that went dead for a moment in the middle of every song would be a bug
 * nobody could describe, let alone reproduce.
 *
 * Never rejects, and that is load-bearing rather than tidy: a station that fell
 * silent because the worker died while writing the record *after* next would be
 * failing at a moment that has nothing to do with what is playing. `advance`
 * writes its own when this comes back empty, which is what the page did before
 * any of this existed.
 */
function prepareNext(): void {
  pending = (async () => {
    try {
      const next = await writeNext();
      await preloadSounds(next.song);
      return next;
    } catch (err) {
      console.warn('radio: could not cue the next record in advance', err);
      return undefined;
    }
  })();
}

/**
 * One record ends and the next begins.
 *
 * The generation is *read* rather than bumped: this is not a press, it is the
 * press that started this record carrying on into the next one. What it guards
 * against is Stop landing during the ring-out — the timer that got us here has
 * already fired, so clearing `radioTimer` no longer cancels anything, and
 * without these checks the station would answer a stop by starting a song.
 */
async function advance(): Promise<void> {
  const generation = playGeneration;
  // The clock stops; the sound does not. The voices already handed to Web Audio
  // play the last chord out over the gap — see `RING_OUT_SECONDS` — and there is
  // nothing after it for the scheduler to find, because the pattern was cut at
  // the double bar when it was loaded. See `endsItself`.
  void stopPlayback();
  const notBefore = performance.now() + RING_OUT_SECONDS * 1000;

  const cued = await pending;
  // Consumed either way. Whatever happens next ends in `play`, which cues
  // another one against whatever the panel says by then.
  pending = undefined;
  if (generation !== playGeneration) return;

  const next = cued ?? await writeNext();
  if (generation !== playGeneration) return;

  current = next.song;
  describe(current);
  els.dl.disabled = false;
  await play(current, { code: next.code, notBefore });
}

async function nextTrack(): Promise<void> {
  // Radio mode should keep moving, so drop any pinned seed — `stationOptions`.
  const opts = radioMode ? stationOptions() : currentOptions();
  current = await writing(() => generateSongAsync(opts));
  describe(current);
  els.dl.disabled = false;
  /**
   * Playing carries on playing; silence stays silent.
   *
   * This used to start the audio whenever radio mode was on, which was harmless
   * while the mode was something you had to switch on deliberately and is not
   * now that it is the default: every route into here is a control being nudged
   * or Next being pressed, and a page that began making a noise because somebody
   * looked at the genre list is a page nobody trusts. It also un-pressed Stop —
   * the timer is cleared by `stop`, but a control moved afterwards would start
   * the music again.
   *
   * Nothing is lost on the station: `playing` stays true across an advance —
   * `scheduleRadioAdvance` halts the scheduler rather than calling `stop` — so
   * once Play has been pressed the records keep coming.
   */
  if (playing) await play(current);
}

els.play.onclick = async () => {
  // Loading counts as playing for the purpose of this press: the button says
  // something is happening, so pressing it has to be able to call that off.
  if (playing || loading) { stop(); return; }
  if (!current) {
    current = await writing(() => generateSongAsync(currentOptions()));
    describe(current);
    els.dl.disabled = false;
  }
  await play(current);
};

els.next.onclick = () => { void nextTrack(); };

function paintRadio(): void {
  els.radio.textContent = `Radio mode: ${radioMode ? 'on' : 'off'}`;
  els.radio.classList.toggle('primary', radioMode);
  // The level hints describe what their control does *in this mode*, and the
  // mode just changed underneath them.
  updateStrictnessHint();
  updateHookHint();
}

els.radio.onclick = () => {
  radioMode = !radioMode;
  paintRadio();
  // Only against something that is actually sounding. Scheduling an advance
  // over a stopped page armed a timer that would have started the music by
  // itself a few minutes later, with nobody having pressed anything.
  if (radioMode && playing && current) scheduleRadioAdvance(current);
  else if (radioTimer) { clearTimeout(radioTimer); radioTimer = undefined; }
};

/**
 * Everything that steers *this* song, as query parameters.
 *
 * Read out of `song.meta` rather than off the controls, because the controls can
 * say "any era" and a song cannot: meta records what was actually drawn, which
 * is precisely why regenerating from it is exact. A link built from the panel
 * would reproduce the *dropdowns*, and hand the reader a different record.
 *
 * `vocals` likewise comes from the tracks rather than from the policy — `mixed`
 * is a coin, and copying the coin instead of how it landed is a link that sings
 * for one person and not the other.
 *
 * One builder for both buttons: the stage and the radio describe the same song
 * with the same words, and the second copy of this list is where they would stop
 * agreeing. `applyLink` reads it back at this end and `optionsFromUrl` at that
 * one.
 */
function songParams(song: Song): URLSearchParams {
  const { meta } = song;
  return new URLSearchParams({
    seed: meta.seed,
    genre: meta.genre,
    era: meta.era,
    style: meta.style,
    mood: meta.mood,
    strictness: String(meta.strictness),
    hook: String(meta.hook),
    vocals: song.tracks.some((t) => t.voice) ? 'sung' : 'instrumental',
    // Without these the link would reproduce the *host's* song — `meta.genre`
    // names the genre a chimera is filed under, not the band that turned up.
    // See `SongMeta.chaos`.
    ...(meta.chaos ? {
      chaos: meta.chaos.levels.join(','),
      spread: String(meta.chaos.spread),
      // …and the per-kind rates, when there were any, or the same kinds would
      // come back mixed evenly, which is a different chimera.
      ...(meta.chaos.mixing ? { mix: formatChaosMixing(meta.chaos.mixing) } : {}),
      // …and the band's own seed, or a different band would be assembled out of
      // the song's.
      ...(meta.chaos.seed ? { chaosSeed: meta.chaos.seed } : {}),
    } : {}),
  });
}

/**
 * The address of this exact record, for somebody else's browser.
 *
 * Built from `location.origin` and the path rather than from the current href,
 * so nothing that happens to be hanging off this page's own address travels
 * with it. `consumeLink` has already emptied the query anyway; this is what
 * keeps that true whichever route the page arrived by.
 */
function shareLink(song: Song): string {
  return `${location.origin}${location.pathname}?${songParams(song)}`;
}

/**
 * Copy it, and say so on the button that was pressed.
 *
 * The clipboard needs permission and does not always have it, and a share
 * button that silently does nothing is worse than no button. When it is refused
 * the address is written out below as selectable text — the reader can still
 * take it, and nothing has been lost. That notice is the failure notice, which
 * is what a refused clipboard is.
 */
const COPY_LABEL = els.copy.textContent ?? 'Copy link';
let copyTimer: number | undefined;

els.copy.onclick = () => {
  if (!current) return;
  const link = shareLink(current);
  const done = (ok: boolean): void => {
    if (!ok) { showError(`The clipboard was refused. The link is ${link}`); return; }
    clearError();
    els.copy.textContent = 'Copied ✓';
    // The label comes back from the constant rather than from whatever the
    // button said a moment ago: two presses inside the window would otherwise
    // restore "Copied ✓" over itself and leave it there for good.
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = window.setTimeout(() => { els.copy.textContent = COPY_LABEL; }, 1600);
  };
  void (navigator.clipboard?.writeText(link).then(() => done(true), () => done(false))
    ?? done(false));
};

/**
 * Watch this song being played, rather than a concert like it.
 *
 * The stage is a renderer of the same IR, so the number it plays is the number
 * loaded here — the one Play would start — note for note, and then the band
 * bows. `single=1` is what says so; without it the concert programmes its own
 * evening of three to five contrasting numbers, which is the right default for
 * `/concert` and the wrong answer to this button.
 *
 * The song itself is described by `songParams`, which is the same list the copy
 * button hands out — the stage and this page have to mean the same record by the
 * same words, and a second copy of that list is where they would stop.
 *
 * Muted layers are not carried across. A muted layer is an audition tool — the
 * player is still on stage, still playing, and silencing an instrument you can
 * watch being played is a different feature with a different name.
 */
els.watch.onclick = () => {
  if (!current) return;
  stop();
  const q = songParams(current);
  q.set('single', '1');
  location.href = `/concert?${q}`;
};

els.dl.onclick = () => {
  if (!current) return;
  const bytes = renderMidi(current);
  const blob = new Blob([bytes as BlobPart], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${current.meta.title.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.mid`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * A control moved — hear it.
 *
 * Two readings, and which one is right is exactly what radio mode is for:
 *
 *  - **Off** — the same song, rewritten with the new setting. The seed holds the
 *    form, key, tempo, instruments and groove, so smoothness, hook, the singer
 *    and the chaos rates can be A/B'd against a fixed arrangement, which is the
 *    only way to hear what any of them actually do.
 *  - **On** — the next record. A station that answered "give me a moodier one"
 *    by playing the same song again in a different mood is not a station; and
 *    since a listener nudging a control there is asking for something new rather
 *    than for a comparison, the seed goes with it. `nextTrack` drops any pinned
 *    one for the same reason.
 *
 * One place rather than a decision repeated at each control, because the two
 * that disagreed would be the bug.
 */
function onControlChange(): void {
  if (radioMode) void nextTrack();
  else void regenerateSameSeed();
}

for (const el of [els.mood, els.era, els.style]) {
  // A pinned seed is somebody holding one song, so off-station these wait for
  // the next track rather than pulling it out from under them.
  el.onchange = () => { if (radioMode || !els.seed.value.trim()) void nextTrack(); };
}

/**
 * Every field back to what a fresh page would have said — except the genre.
 *
 * There is a lot to put back. Eight controls, six boxes, seven sliders and two
 * seeds is a panel somebody can wander a long way into, and the way out was to
 * remember what the neutral mood was called and which of the levels this genre
 * defaults to. That is not knowledge a listener has.
 *
 * **The genre stays.** It is the one control on the page with no default to go
 * back to — the opening one is a coin toss, redrawn per visit, precisely so the
 * site is not one genre — so "reset" would have to mean "and now you are
 * listening to something else", which is Next's job and not this button's. What
 * this clears is everything said *about* a genre; which genre remains the
 * listener's.
 *
 * `populateForGenre` is where the per-genre defaults are decided, so it is used
 * here rather than copied: mood, era, style and both levels are reset by the
 * same code that fills them, and a genre that changes its default hook changes
 * this button with it.
 */
function resetControls(): void {
  populateForGenre();
  els.vocals.value = 'instrumental';
  els.seed.value = '';
  for (const [id] of CHAOS_BOXES) {
    $<HTMLInputElement>(`chaos-${id}`).checked = false;
    mixSlider(id).value = DEFAULT_SPREAD;
  }
  els.chaosSpread.value = DEFAULT_SPREAD;
  els.chaosSeed.value = '';
  // The panel is only the user's while they have touched it, and they have just
  // asked for none of it — so it closes, and opening it again starts as a
  // picture of the single slider the way it does on a fresh page.
  mixTouched = false;
  if (advancedChaos()) toggleAdvanced();
  paintSpread();
  paintAllMix();
  syncChaosVisible();
  syncFullChaos();
  updateStrictnessHint();
  updateHookHint();
}

/**
 * Cleared, and then heard, on the same rule as every other control: the next
 * record on a station, and the same song rewritten plainly when the station is
 * off. A reset that left the last chimera playing under a panel with every box
 * clear would be the panel and the music disagreeing about what is happening.
 */
els.reset.onclick = () => {
  resetControls();
  onControlChange();
};

/**
 * The spread slider is meaningless with every box clear, and regenerating on
 * every step of it would be a new song per pixel — so it takes effect on
 * release, which is what `onchange` is for a range input.
 */
function onChaosChange(): void {
  syncChaosVisible();
  syncFullChaos();
  onControlChange();
}
// Painted on `input` and regenerated on `change`: the bar has to follow the
// thumb while it is being dragged, and the song must not.
els.chaosSpread.oninput = () => { paintSpread(); syncFullChaos(); };
els.chaosSpread.onchange = () => { if (chosenLevels().length) onControlChange(); };
els.chaosAll.onclick = () => {
  toggleFullChaos();
  onChaosChange();
};
els.chaosAdvanced.onclick = () => {
  toggleAdvanced();
  onChaosChange();
};
/**
 * Same seed, different band — the one control that keeps its seed on air.
 *
 * It *is* a seed, and the whole of what it does is hold the piece still while
 * the borrowings are redrawn. Rerolling the song because this moved would leave
 * it with nothing to do, so it stays on `regenerateSameSeed` in both modes.
 */
els.chaosSeed.onchange = () => { if (chosenLevels().length) void regenerateSameSeed(); };

// Vocals draw from their own RNG stream, so off-station the same seed gives the
// identical arrangement either way — a straight A/B on the voice.
els.vocals.onchange = onControlChange;

els.genre.onchange = () => {
  populateForGenre();
  updateStrictnessHint();
  updateHookHint();
  void nextTrack();
};

// Strictness regenerates even with a pinned seed — hearing the same tune
// filtered two ways is the whole point of the control.
els.strictness.onchange = () => {
  updateStrictnessHint();
  onControlChange();
};

// Same reasoning as strictness: hook is meant to be heard against the same
// arrangement, not against a fresh song.
els.hook.onchange = () => {
  updateHookHint();
  onControlChange();
};

els.seed.oninput = updateStrictnessHint;

/**
 * Regenerate the song already loaded, with whatever the controls now say.
 *
 * When no seed is pinned it falls back to the current song's own seed. Both
 * controls that call this exist to be compared against themselves, and
 * rerolling the tune underneath the comparison would make it meaningless.
 */
async function regenerateSameSeed(): Promise<void> {
  const opts = currentOptions();
  if (!opts.seed && current) {
    opts.seed = current.meta.seed;
    // …and settle the voice against *that* seed, or `mixed` would re-flip its
    // coin every time smoothness or hook was nudged. See `wantsVocals`.
    opts.vocals = wantsVocals(opts.seed);
  }
  current = await writing(() => generateSongAsync(opts));
  describe(current);
  if (playing) await play(current);
}

async function boot(): Promise<void> {
  // Kick the audio stack off now so its first-click listener is already armed
  // when the user presses Play.
  void initAudio().catch((err) => {
    showError(`Failed to initialise Strudel: ${String(err)}`);
    console.error(err);
  });

  // Wording, highlight and both hints from `radioMode` rather than from the
  // markup, so the default lives in one place.
  paintRadio();
  /**
   * The first song is written off the thread like every other one, so the page
   * paints its controls and its status before the generator has finished rather
   * than arriving whole a tenth of a second late. Nothing is enabled until it
   * lands — there is no song for the buttons to act on until then — which is
   * what `writing` already says, so this only has to say what is happening.
   *
   * And it says it on the button, which is the thing that is not ready yet. The
   * markup starts it on "Loading…" for the moment before this module runs at
   * all; the flag is what keeps that true through the write and takes it off
   * again afterwards.
   */
  loading = true;
  paintPlay();
  current = await generateSongAsync(currentOptions());
  describe(current);
  els.play.disabled = false;
  els.next.disabled = false;
  els.radio.disabled = false;
  els.copy.disabled = false;
  els.dl.disabled = false;
  loading = false;
  paintPlay();
}

void boot();
