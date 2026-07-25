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

import { initAudio, playCode, stopPlayback } from './audio.js';

import { generateSong, type GenerateOptions } from '../generate/song.js';
import { renderStrudel } from '../render/strudel.js';
import { renderMidi } from '../render/midi.js';
import { songDurationSeconds, type LayerId, type Song } from '../core/types.js';
import { MOODS } from '../style/moods.js';
import { ERAS } from '../style/eras.js';
import { STYLES } from '../style/styles.js';
import { STRICTNESS_LEVELS, getStrictness, type StrictnessId } from '../generate/constraints.js';

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el as T;
};

const els = {
  mood: $<HTMLSelectElement>('mood'),
  era: $<HTMLSelectElement>('era'),
  style: $<HTMLSelectElement>('style'),
  strictness: $<HTMLSelectElement>('strictness'),
  strictnessHint: $<HTMLDivElement>('strictness-hint'),
  seed: $<HTMLInputElement>('seed'),
  play: $<HTMLButtonElement>('play'),
  next: $<HTMLButtonElement>('next'),
  radio: $<HTMLButtonElement>('radio'),
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
const muted = new Set<LayerId>();

function fillSelect(select: HTMLSelectElement, entries: [string, string][], anyLabel?: string): void {
  if (anyLabel) select.append(new Option(anyLabel, ''));
  for (const [value, label] of entries) select.append(new Option(label, value));
}

fillSelect(els.mood, Object.values(MOODS).map((m) => [m.id, `${m.label} — ${m.gloss}`]));
els.mood.value = 'neutraali';
fillSelect(els.era, Object.values(ERAS).map((e) => [e.id, e.label]), 'Kumpi tahansa / either');
fillSelect(els.style, Object.values(STYLES).map((s) => [s.id, s.label]), 'Mikä tahansa / any');
fillSelect(els.strictness, STRICTNESS_LEVELS.map((l) => [l.id, `${l.level} · ${l.label}`]));
els.strictness.value = 'standard';

function updateStrictnessHint(): void {
  const level = getStrictness(els.strictness.value as StrictnessId);
  els.strictnessHint.textContent = els.seed.value.trim()
    ? `${level.gloss} — seed is pinned, so changing this replays the same song filtered differently.`
    : `${level.gloss} — pin a seed to hear the same song at different levels.`;
}

function setStatus(text: string, isError = false): void {
  els.status.textContent = text;
  els.status.className = isError ? 'status err' : 'status';
}

function currentOptions(): GenerateOptions {
  const opts: GenerateOptions = {};
  if (els.seed.value.trim()) opts.seed = els.seed.value.trim();
  if (els.era.value) opts.era = els.era.value;
  if (els.style.value) opts.style = els.style.value;
  if (els.mood.value) opts.mood = els.mood.value;
  if (els.strictness.value) opts.strictness = els.strictness.value as StrictnessId;
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
  els.meta.innerHTML = [
    `<b>${meta.styleLabel}</b> · ${meta.eraLabel}`,
    `${meta.keyLabel} · ${meta.bpm} BPM · ${meta.beatsPerBar}/${meta.beatUnit} · ${meta.totalBars} bars · ${Math.floor(mins / 60)}:${String(Math.round(mins % 60)).padStart(2, '0')}`,
    `Drums: ${song.drums.bank}${lift ? ` · key change +${lift.transpose} for the last chorus` : ''}`,
    `Smoothness: <b>${meta.strictnessLabel}</b> — ${getStrictness(meta.strictness as StrictnessId).gloss}`,
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
  const layers: LayerId[] = ['drums', ...song.tracks.map((t) => t.layer)];
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
  const code = renderStrudel(audible(song));
  try {
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
  void stopPlayback();
  playing = false;
  els.play.textContent = 'Play ▶';
  if (radioTimer) { clearTimeout(radioTimer); radioTimer = undefined; }
}

function scheduleRadioAdvance(song: Song): void {
  if (radioTimer) clearTimeout(radioTimer);
  if (!radioMode) return;
  const ms = songDurationSeconds(song) * 1000;
  radioTimer = window.setTimeout(() => { void nextTrack(); }, ms);
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

// Strictness regenerates even with a pinned seed — hearing the same tune
// filtered two ways is the whole point of the control.
els.strictness.onchange = () => {
  updateStrictnessHint();
  void regenerateSameSeed();
};
els.seed.oninput = updateStrictnessHint;

async function regenerateSameSeed(): Promise<void> {
  current = generateSong(currentOptions());
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
  current = generateSong(currentOptions());
  describe(current);
  els.play.disabled = false;
  els.next.disabled = false;
  els.radio.disabled = false;
  els.dl.disabled = false;
  els.play.textContent = 'Play ▶';
  setStatus('Ready. Instruments stream from the soundfont CDN on first use, so the opening bar can be thin.');
}

boot();
