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

import { initAudio, playCode, preloadSounds, stopPlayback } from './audio.js';
import { generateSongAsync, generatorIsThreaded } from './generator.js';
import { createSungVoice, withoutSungVoice } from './sung-voice.js';

import type { GenerateOptions } from '../generate/song.js';
import { renderStrudel } from '../render/strudel.js';
import { renderMidi } from '../render/midi.js';
import {
  meterLabel, songDurationBeats, songDurationSeconds, type LayerId, type Song,
} from '../core/types.js';
import { Rng } from '../core/rng.js';
import { GENRES, getGenre } from '../genre/index.js';
import { formatChaosMixing, type ChaosLevel } from '../genre/chaos.js';
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
  play: $<HTMLButtonElement>('play'),
  next: $<HTMLButtonElement>('next'),
  radio: $<HTMLButtonElement>('radio'),
  watch: $<HTMLButtonElement>('watch'),
  dl: $<HTMLButtonElement>('dl'),
  status: $<HTMLDivElement>('status'),
  title: $<HTMLSpanElement>('title'),
  meta: $<HTMLDivElement>('meta'),
  form: $<HTMLDivElement>('form'),
  layers: $<HTMLDivElement>('layers'),
  code: $<HTMLPreElement>('code'),
};

let current: Song | undefined;
let playing = false;
let radioMode = false;
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

function fillSelect(select: HTMLSelectElement, entries: [string, string][], anyLabel?: string): void {
  if (anyLabel) select.append(new Option(anyLabel, ''));
  for (const [value, label] of entries) select.append(new Option(label, value));
}

fillSelect(els.genre, Object.values(GENRES).map((g) => [g.id, g.label]));
els.genre.value = 'iskelma';
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
  slider.onchange = () => { if (chosenLevels().length) void regenerateSameSeed(); };
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
  els.chaosSpread.value = on ? '50' : '100';
  for (const [id] of CHAOS_BOXES) mixSlider(id).value = on ? '50' : '100';
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

function updateStrictnessHint(): void {
  const level = getStrictness(els.strictness.value as StrictnessId);
  els.strictnessHint.textContent = els.seed.value.trim()
    ? `${level.gloss} — seed is pinned, so changing this replays the same song filtered differently.`
    : `${level.gloss} — pin a seed to hear the same song at different levels.`;
}

/**
 * Both level controls are meant to be A/B'd against a fixed arrangement: the
 * seed pins the form, key, tempo, instruments and groove, and only the tune
 * moves underneath them. Say so, because a control you can compare against
 * itself is a different thing from one that rerolls the song.
 */
function updateHookHint(): void {
  const level = getHook(els.hook.value as HookId);
  els.hookHint.textContent =
    `${level.gloss} — the arrangement is fixed by the seed, so this changes only how much the tune returns.`;
}

function setStatus(text: string, isError = false): void {
  els.status.textContent = text;
  els.status.className = isError ? 'status err' : 'status';
}

/**
 * Ask the worker for a song, and say so while it is being written.
 *
 * Generation is 21–144 ms and a long house track more, and on this page it fell
 * between pressing a button and anything happening — the controls stayed live,
 * the status stayed on the last thing it said, and the page simply stopped for a
 * moment. Off the thread it is a wait with a name on it.
 *
 * The buttons go dead for the duration rather than queueing: two presses of Next
 * are two songs written and one thrown away, and the thrown-away one is the one
 * the person was looking at. `generatorIsThreaded` decides the wording, because
 * a page that fell back to generating inline cannot repaint to show this at all
 * and promising otherwise would be a lie told at exactly the wrong moment.
 */
async function writing<T>(what: string, work: () => Promise<T>): Promise<T> {
  const buttons = [els.play, els.next, els.radio, els.dl];
  const was = buttons.map((b) => b.disabled);
  const said = els.status.textContent;
  const saying = `${what}…`;
  for (const b of buttons) b.disabled = true;
  if (generatorIsThreaded()) setStatus(saying);
  try {
    return await work();
  } finally {
    buttons.forEach((b, i) => { b.disabled = was[i]!; });
    /**
     * Put the line back, but only if it is still ours.
     *
     * A song that is about to be played has a `play` behind it which will say
     * "Loading instruments…" a moment later, and a failure has already said
     * what went wrong. Overwriting either would replace news with history. What
     * is left is the case this is for: a song written while nothing is playing,
     * which otherwise leaves the page claiming to be writing it for ever.
     */
    if (els.status.textContent === saying) setStatus(said ?? '');
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

  els.code.textContent = renderStrudel(song);
}

/**
 * The vocal layer, sung rather than played.
 *
 * One for the page rather than one per song: it holds an `AudioContext` and a
 * reverb impulse, and building those per track would be a lot of garbage for a
 * radio that never stops changing tracks.
 */
const voice = createSungVoice();

async function play(song: Song): Promise<void> {
  const generation = ++playGeneration;
  // The vocal layer leaves the pattern and is sung by `web/voice-synth.ts`
  // instead — see `sung-voice.ts` for why it cannot stay in it.
  const code = renderStrudel(withoutSungVoice(audible(song)));
  try {
    /**
     * Get the instruments onto the machine before the downbeat, not on it.
     *
     * Strudel fetches a sound the first time a hap plays it, so without this
     * the opening bars are a race between the pattern and the band arriving
     * over the wire — see `preloadSounds`. It is bounded and it is cached, so
     * the wait is a second or so on the first song of a session and nothing at
     * all on a track that reuses instruments already heard.
     */
    setStatus('Loading instruments…');
    await preloadSounds(song);
    // Stopped, or superseded by a newer press, while the band was loading.
    // Whoever bumped the generation has already said what the status is.
    if (generation !== playGeneration) return;
    await playCode(code);
    voice.begin(audible(song));
    playing = true;
    els.play.textContent = 'Stop ■';
    setStatus('Playing.');
    scheduleRadioAdvance(song);
  } catch (err) {
    playing = false;
    els.play.textContent = 'Play ▶';
    setStatus(`Strudel could not evaluate the pattern: ${String(err)}`, true);
    console.error(err);
  }
}

function stop(): void {
  playGeneration += 1;
  voice.end();
  void stopPlayback();
  playing = false;
  els.play.textContent = 'Play ▶';
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
  radioTimer = window.setTimeout(() => {
    // Stop at the loop point rather than let the pattern come round again
    // underneath the ring.
    void stopPlayback();
    radioTimer = window.setTimeout(() => { void nextTrack(); }, RING_OUT_SECONDS * 1000);
  }, ms);
}

async function nextTrack(): Promise<void> {
  // Radio mode should keep moving, so drop any pinned seed.
  const opts = currentOptions();
  if (radioMode) delete opts.seed;
  current = await writing('Writing the next song', () => generateSongAsync(opts));
  describe(current);
  els.dl.disabled = false;
  if (playing || radioMode) await play(current);
}

els.play.onclick = async () => {
  if (playing) { stop(); setStatus('Stopped.'); return; }
  if (!current) {
    current = await writing('Writing a song', () => generateSongAsync(currentOptions()));
    describe(current);
    els.dl.disabled = false;
  }
  await play(current);
};

els.next.onclick = () => { void nextTrack(); };

els.radio.onclick = () => {
  radioMode = !radioMode;
  els.radio.textContent = `Radio mode: ${radioMode ? 'on' : 'off'}`;
  els.radio.classList.toggle('primary', radioMode);
  if (radioMode && current) scheduleRadioAdvance(current);
  else if (radioTimer) { clearTimeout(radioTimer); radioTimer = undefined; }
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
 * Everything comes from `song.meta` rather than from the controls, because the
 * controls can say "any era" and a song cannot. Meta records what was actually
 * chosen, which is precisely why regenerating from it is exact.
 *
 * Muted layers are not carried across. A muted layer is an audition tool — the
 * player is still on stage, still playing, and silencing an instrument you can
 * watch being played is a different feature with a different name.
 */
els.watch.onclick = () => {
  if (!current) return;
  stop();
  const { meta } = current;
  const q = new URLSearchParams({
    single: '1',
    seed: meta.seed,
    genre: meta.genre,
    era: meta.era,
    style: meta.style,
    mood: meta.mood,
    strictness: String(meta.strictness),
    hook: String(meta.hook),
    vocals: current.tracks.some((t) => t.voice) ? 'sung' : 'instrumental',
    // Without these the stage would play the *host's* song — `meta.genre` names
    // the genre a chimera is filed under, not the band that turned up. See
    // `SongMeta.chaos`.
    ...(meta.chaos ? {
      chaos: meta.chaos.levels.join(','),
      spread: String(meta.chaos.spread),
      // …and the per-kind rates, when there were any. Without them the stage
      // would play the same kinds mixed evenly, which is a different chimera.
      ...(meta.chaos.mixing ? { mix: formatChaosMixing(meta.chaos.mixing) } : {}),
      // …and the band's own seed, or the stage would assemble a different band
      // out of the song's.
      ...(meta.chaos.seed ? { chaosSeed: meta.chaos.seed } : {}),
    } : {}),
  });
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

for (const el of [els.mood, els.era, els.style]) {
  el.onchange = () => { if (!els.seed.value.trim()) void nextTrack(); };
}

/**
 * The spread slider is meaningless with every box clear, and regenerating on
 * every step of it would be a new song per pixel — so it takes effect on
 * release, which is what `onchange` is for a range input.
 *
 * Both regenerate on the *same seed* rather than drawing a new song, like the
 * smoothness and hook controls above and for the same reason: the whole value of
 * these two is hearing one piece two ways, and a control that rerolled the song
 * would leave nothing to compare.
 */
function onChaosChange(): void {
  syncChaosVisible();
  syncFullChaos();
  void regenerateSameSeed();
}
// Painted on `input` and regenerated on `change`: the bar has to follow the
// thumb while it is being dragged, and the song must not.
els.chaosSpread.oninput = () => { paintSpread(); syncFullChaos(); };
els.chaosSpread.onchange = () => { if (chosenLevels().length) void regenerateSameSeed(); };
els.chaosAll.onclick = () => {
  toggleFullChaos();
  onChaosChange();
};
els.chaosAdvanced.onclick = () => {
  toggleAdvanced();
  onChaosChange();
};
// Same seed, different band: this is the one control that redraws the borrowings
// and leaves the piece alone, so it regenerates like the rest rather than
// waiting for the next track.
els.chaosSeed.onchange = () => { if (chosenLevels().length) void regenerateSameSeed(); };

// The same seed, with and without the singer: `vocals` is documented as an A/B
// that leaves the instrumental arrangement identical, and it was the one control
// on this page that did nothing until the next track.
els.vocals.onchange = () => { void regenerateSameSeed(); };

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
  void regenerateSameSeed();
};

// Same reasoning as strictness: hook is meant to be heard against the same
// arrangement, not against a fresh song.
els.hook.onchange = () => {
  updateHookHint();
  void regenerateSameSeed();
};

// Vocals draw from their own RNG stream, so the same seed gives the identical
// arrangement either way — toggling this is a straight A/B on the voice.
els.vocals.onchange = () => { void regenerateSameSeed(); };

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
  current = await writing('Rewriting this song', () => generateSongAsync(opts));
  describe(current);
  if (playing) await play(current);
}

async function boot(): Promise<void> {
  // Kick the audio stack off now so its first-click listener is already armed
  // when the user presses Play.
  void initAudio().catch((err) => {
    setStatus(`Failed to initialise Strudel: ${String(err)}`, true);
    console.error(err);
  });

  updateStrictnessHint();
  updateHookHint();
  /**
   * The first song is written off the thread like every other one, so the page
   * paints its controls and its status before the generator has finished rather
   * than arriving whole a tenth of a second late. Nothing is enabled until it
   * lands — there is no song for the buttons to act on until then — which is
   * what `writing` already says, so this only has to say what is happening.
   */
  setStatus('Writing the opening song…');
  current = await generateSongAsync(currentOptions());
  describe(current);
  els.play.disabled = false;
  els.next.disabled = false;
  els.radio.disabled = false;
  els.dl.disabled = false;
  els.play.textContent = 'Play ▶';
  setStatus('Ready. Instruments come from the soundfont CDN, so the first press has a moment of loading.');
}

void boot();
