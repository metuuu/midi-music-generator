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

import { generateSong, type GenerateOptions } from '../generate/song.js';
import { renderStrudel } from '../render/strudel.js';
import { renderMidi } from '../render/midi.js';
import { meterLabel, songDurationSeconds, type LayerId, type Song } from '../core/types.js';
import { GENRES, getGenre } from '../genre/index.js';
import { STRICTNESS_LEVELS, getStrictness, type StrictnessId } from '../core/rules.js';
import { HOOK_LEVELS, getHook, type HookId } from '../generate/hook.js';

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
  vocals: $<HTMLInputElement>('vocals'),
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

function currentOptions(): GenerateOptions {
  const opts: GenerateOptions = { genre: els.genre.value };
  if (els.seed.value.trim()) opts.seed = els.seed.value.trim();
  if (els.era.value) opts.era = els.era.value;
  if (els.style.value) opts.style = els.style.value;
  if (els.mood.value) opts.mood = els.mood.value;
  if (els.strictness.value) opts.strictness = els.strictness.value as StrictnessId;
  if (els.hook.value) opts.hook = els.hook.value as HookId;
  if (els.vocals.checked) opts.vocals = true;
  return opts;
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

async function play(song: Song): Promise<void> {
  const generation = ++playGeneration;
  const code = renderStrudel(audible(song));
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
  const ms = songDurationSeconds(song) * 1000;
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
  current = generateSong(opts);
  describe(current);
  els.dl.disabled = false;
  if (playing || radioMode) await play(current);
}

els.play.onclick = async () => {
  if (playing) { stop(); setStatus('Stopped.'); return; }
  if (!current) { current = generateSong(currentOptions()); describe(current); els.dl.disabled = false; }
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
 * `/concert.html` and the wrong answer to this button.
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
  });
  location.href = `/concert.html?${q}`;
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
  if (!opts.seed && current) opts.seed = current.meta.seed;
  current = generateSong(opts);
  describe(current);
  if (playing) await play(current);
}

function boot(): void {
  // Kick the audio stack off now so its first-click listener is already armed
  // when the user presses Play.
  void initAudio().catch((err) => {
    setStatus(`Failed to initialise Strudel: ${String(err)}`, true);
    console.error(err);
  });

  updateStrictnessHint();
  updateHookHint();
  current = generateSong(currentOptions());
  describe(current);
  els.play.disabled = false;
  els.next.disabled = false;
  els.radio.disabled = false;
  els.dl.disabled = false;
  els.play.textContent = 'Play ▶';
  setStatus('Ready. Instruments come from the soundfont CDN, so the first press has a moment of loading.');
}

boot();
