/**
 * The instrument bench — every sound in the catalogue, one note at a time.
 *
 * This exists because two things about how the songs sound are decided in
 * `style/instruments.ts` by eye and can only be settled by ear:
 *
 *   1. **The envelope.** Each idiom carries a default shape and a handful of
 *      instruments override it (see `IDIOM_ENVELOPES`). Those numbers were a
 *      considered first pass, nothing more.
 *   2. **The bank.** Every GM program has five to eight soundfonts behind it —
 *      conversions of different 1990s soundcard banks — and the renderer has
 *      always taken the first one, because `.n()` is never emitted. Nobody has
 *      ever heard the other seven.
 *
 * So the page is not a toy keyboard; it is the tool that turns both of those
 * into a line you paste back into the catalogue. Everything it plays goes
 * through `playNote`, which is the same superdough path a generated song takes,
 * so what you hear here is what the song will do.
 *
 * It deliberately does not touch the concert or the generator. The model bench
 * on `/models` is the *geometry* turntable, and its dropdown lists 3D models
 * — one of which stands in for six instruments — so it is the wrong place for
 * this by exactly that much.
 */

import { midiToNoteName, type Midi } from '../core/pitch.js';
import type { Envelope } from '../core/types.js';
import {
  envelopeFor, IDIOM_ENVELOPES, INSTRUMENTS, rangeOfInstrument,
  type Idiom, type Instrument, type InstrumentId,
} from '../style/instruments.js';
import { playNote, soundfontsFor } from './audio.js';

const el = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

const pick = el<HTMLSelectElement>('instrument');
const bankPick = el<HTMLSelectElement>('bank');
const phrasePick = el<HTMLSelectElement>('phrase');
const keys = el<HTMLDivElement>('keys');
const facts = el<HTMLDivElement>('facts');
const code = el<HTMLPreElement>('code');
const sliders = {
  attack: el<HTMLInputElement>('attack'),
  decay: el<HTMLInputElement>('decay'),
  sustain: el<HTMLInputElement>('sustain'),
  release: el<HTMLInputElement>('release'),
};

/** Held down long enough that a sustaining instrument shows it is sustaining. */
const HOLD = 1.2;
const GAIN = 0.7;

let current: InstrumentId = 'vibraphone';
let bank = 0;
/** What the sliders say, which is not what the catalogue says until you save it. */
let env: Envelope = envelopeFor(INSTRUMENTS[current]);

// --- what to play ----------------------------------------------------------

/**
 * A note and a phrase are different questions.
 *
 * A single strike says what the sample is. It says nothing about the envelope,
 * because the two mistakes this page exists to catch — a struck bar that holds
 * instead of ringing, a pad that arrives instantly — are both only audible
 * against a *neighbouring* note. Hence the held chord, which exposes a looped
 * sustain immediately, and the fast run, which exposes a decay so long that
 * every note is still sounding when the next one lands.
 */
interface Phrase {
  label: string;
  /** Semitones from the root, and when each lands, in seconds. */
  notes: { at: number; semitones: number; hold: number }[];
}

const chord = (hold: number, spread = 0) =>
  [0, 4, 7, 12].map((semitones, i) => ({ at: i * spread, semitones, hold }));

const PHRASES: Record<string, Phrase> = {
  strike: { label: 'one strike', notes: [{ at: 0, semitones: 0, hold: HOLD }] },
  short: { label: 'one short note', notes: [{ at: 0, semitones: 0, hold: 0.12 }] },
  chord: { label: 'struck chord', notes: chord(HOLD) },
  arpeggio: { label: 'arpeggio', notes: chord(HOLD, 0.16) },
  held: { label: 'held chord — 4 seconds', notes: chord(4) },
  run: {
    label: 'fast run',
    notes: [0, 2, 4, 5, 7, 9, 11, 12].map((semitones, i) => ({
      at: i * 0.14, semitones, hold: 0.14,
    })),
  },
  repeated: {
    label: 'repeated note',
    notes: Array.from({ length: 8 }, (_, i) => ({ at: i * 0.28, semitones: 0, hold: 0.28 })),
  },
};

function play(root: Midi): void {
  const instrument = INSTRUMENTS[current];
  const phrase = PHRASES[phrasePick.value] ?? PHRASES.strike!;
  for (const n of phrase.notes) {
    void playNote({
      sound: instrument.strudel,
      bank,
      midi: root + n.semitones,
      when: n.at,
      duration: n.hold,
      gain: GAIN,
      envelope: env,
    }).catch((err) => { facts.innerHTML = `<span class="warn">${String(err)}</span>`; });
  }
}

/**
 * The same note through every bank this program has, spaced far enough apart to
 * tell them apart. This is the comparison the catalogue has never had.
 *
 * The first pass through an instrument is ragged, and it is worth knowing why
 * rather than chasing it: each bank is fetched on its first note, and the
 * soundfont loader starts the buffer at a time that has usually gone past by
 * the time the download lands. Everything is cached afterwards, so the second
 * sweep is the one to judge by.
 */
function sweepBanks(root: Midi): void {
  const instrument = INSTRUMENTS[current];
  const fonts = soundfontsFor(instrument.strudel);
  fonts.forEach((_, i) => {
    void playNote({
      sound: instrument.strudel,
      bank: i,
      midi: root,
      when: i * 1.5,
      duration: HOLD,
      gain: GAIN,
      envelope: env,
    });
  });
  facts.textContent = `sweeping ${fonts.length} banks, 1.5 s apart — `
    + fonts.map((f, i) => `${i}:${shortFont(f)}`).join('  ');
}

// --- the keyboard ----------------------------------------------------------

const BLACK = new Set([1, 3, 6, 8, 10]);
/** Two octaves, which is enough to hear an instrument change character. */
const SPAN = 24;

/**
 * Keys are laid out from the instrument's own centre, and the ones it cannot
 * reach are marked rather than removed.
 *
 * Removing them would hide the fact worth knowing. A glockenspiel that starts
 * two octaves above where you clicked is not a bug in the page, it is the
 * instrument, and `rangeOfInstrument` is the same table the generator folds
 * notes into — so a key shown out of range is a note the song will never write.
 */
function buildKeys(): void {
  const instrument = INSTRUMENTS[current];
  const [lo, hi] = rangeOfInstrument(instrument);
  const start = Math.round(instrument.centre) - 12;
  keys.replaceChildren();
  for (let midi = start; midi < start + SPAN; midi++) {
    const key = document.createElement('button');
    key.className = BLACK.has(midi % 12) ? 'key black' : 'key';
    if (midi < lo || midi > hi) key.classList.add('out');
    key.textContent = midi % 12 === 0 ? midiToNoteName(midi) : '';
    key.title = `${midiToNoteName(midi)} (${midi})`;
    key.addEventListener('mousedown', () => play(midi));
    keys.append(key);
  }
}

// --- the catalogue line this page exists to produce ------------------------

/** `0110_JCLive_sf2_file` → `JCLive`, which is the only part that identifies it. */
function shortFont(font: string): string {
  return font.replace(/^\d+_/, '').replace(/_sf2_file$/, '');
}

const n = (x: number): string => String(Math.round(x * 1000) / 1000);

/**
 * What to paste back into `style/instruments.ts`, as the diff from the idiom
 * default rather than the whole envelope — which is the form the catalogue
 * wants, and also the honest one: it shows whether this instrument is really
 * contradicting its family or just being nudged.
 */
function catalogueLine(): string {
  const instrument = INSTRUMENTS[current];
  const base = IDIOM_ENVELOPES[instrument.idiom];
  const diff = (Object.keys(base) as (keyof Envelope)[])
    .filter((k) => env[k] !== base[k])
    .map((k) => `${k}: ${n(env[k])}`);

  const decl = `I('${instrument.name}', ${instrument.gm}, '${instrument.strudel}', `
    + `${instrument.centre}, ${instrument.agility}, '${instrument.idiom}')`;

  if (!diff.length) {
    return `${current}: ${decl},\n// unchanged from the ${instrument.idiom} default`;
  }
  return `${current}: E(${decl},\n  { ${diff.join(', ')} }),`;
}

function refresh(): void {
  const instrument = INSTRUMENTS[current];
  const [lo, hi] = rangeOfInstrument(instrument);
  const fonts = soundfontsFor(instrument.strudel);
  const base = IDIOM_ENVELOPES[instrument.idiom];

  facts.innerHTML = [
    `<b>${instrument.name}</b> · GM ${instrument.gm} · ${instrument.strudel}`,
    `idiom <b>${instrument.idiom}</b> · range ${midiToNoteName(lo)}–${midiToNoteName(hi)}`
    + ` · centre ${midiToNoteName(instrument.centre)}`,
    `catalogue envelope: a ${n(base.attack)} d ${n(base.decay)}`
    + ` s ${n(base.sustain)} r ${n(base.release)}`
    + (instrument.envelope ? ' <b>(overridden)</b>' : ''),
    fonts.length
      ? `${fonts.length} banks: ${fonts.map(shortFont).join(', ')}`
      : '<span class="warn">no soundfont registered for this name</span>',
  ].join('\n');

  code.textContent = catalogueLine();
}

function loadInstrument(id: InstrumentId): void {
  current = id;
  bank = 0;
  env = envelopeFor(INSTRUMENTS[id]);
  for (const [key, slider] of Object.entries(sliders)) {
    slider.value = String(env[key as keyof Envelope]);
    (slider.nextElementSibling as HTMLElement).textContent = n(env[key as keyof Envelope]);
  }

  const fonts = soundfontsFor(INSTRUMENTS[id].strudel);
  bankPick.replaceChildren(...fonts.map((font, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `${i} — ${shortFont(font)}`;
    return opt;
  }));

  buildKeys();
  refresh();
}

// --- wiring ----------------------------------------------------------------

/** Grouped by idiom, because that is the axis the envelope defaults key on. */
function buildInstrumentPicker(): void {
  const byIdiom = new Map<Idiom, [InstrumentId, Instrument][]>();
  for (const [id, instrument] of Object.entries(INSTRUMENTS) as [InstrumentId, Instrument][]) {
    const list = byIdiom.get(instrument.idiom) ?? [];
    list.push([id, instrument]);
    byIdiom.set(instrument.idiom, list);
  }
  for (const idiom of Object.keys(IDIOM_ENVELOPES) as Idiom[]) {
    const group = document.createElement('optgroup');
    group.label = idiom;
    for (const [id, instrument] of byIdiom.get(idiom) ?? []) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = instrument.name + (instrument.envelope ? ' ·' : '');
      group.append(opt);
    }
    pick.append(group);
  }
  pick.value = current;
}

for (const [key, slider] of Object.entries(sliders)) {
  slider.addEventListener('input', () => {
    env = { ...env, [key]: Number(slider.value) };
    (slider.nextElementSibling as HTMLElement).textContent = n(Number(slider.value));
    refresh();
  });
}

pick.addEventListener('change', () => loadInstrument(pick.value as InstrumentId));
bankPick.addEventListener('change', () => { bank = Number(bankPick.value); });
el<HTMLButtonElement>('sweep').addEventListener('click',
  () => sweepBanks(Math.round(INSTRUMENTS[current].centre)));
el<HTMLButtonElement>('reset').addEventListener('click', () => loadInstrument(current));
el<HTMLButtonElement>('again').addEventListener('click',
  () => play(Math.round(INSTRUMENTS[current].centre)));

/**
 * A tracker keyboard, so both hands are free: notes on the home rows, and the
 * phrase and bank on the keys either side of them.
 */
const TYPING = 'zsxdcvgbhnjmq2w3er5t6y7ui';
window.addEventListener('keydown', (e) => {
  if (e.repeat || e.metaKey || e.ctrlKey) return;
  if (e.key === ' ') { play(Math.round(INSTRUMENTS[current].centre)); e.preventDefault(); return; }
  const i = TYPING.indexOf(e.key);
  if (i >= 0) play(Math.round(INSTRUMENTS[current].centre) - 12 + i);
});

for (const [id, phrase] of Object.entries(PHRASES)) {
  const opt = document.createElement('option');
  opt.value = id;
  opt.textContent = phrase.label;
  phrasePick.append(opt);
}

buildInstrumentPicker();
loadInstrument(current);
