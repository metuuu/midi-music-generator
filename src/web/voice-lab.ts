/**
 * The voice lab.
 *
 * A bench for the three questions the vocal work keeps running into, none of
 * which can be answered by reading a table:
 *
 *  - **Does a word sound like itself?** Type it, see the syllables it hashes
 *    to, hear it alone or in a line, and confirm it comes out the same way
 *    every time.
 *  - **Do the vowels separate?** The map plots what the line actually used in
 *    the openness/frontness plane and measures how far it travels between
 *    syllables. A line that reads as "duu du du duu" is one whose points are
 *    all on top of each other, and this is where you can see that happening.
 *  - **Where is the line between talking and singing?** Two selects and about
 *    ten sliders, all live, so the boundary can be found by ear rather than
 *    guessed at.
 *
 * Nothing here is Strudel and nothing here is the song generator. The synth is
 * plain Web Audio, which is what makes legato and melisma possible at all, and
 * the song page is left alone so the sound that already works stays available
 * to compare against.
 */

import { Rng } from '../core/rng.js';
import { degreeToMidi, makeScale, type Mode } from '../core/scale.js';
import { keyLabel } from '../core/pitch.js';
import type { Consonant, Vowel } from '../core/types.js';
import {
  PHONETIC_STYLES, PHONETIC_STYLE_ORDER, pronounce, spellSyllables,
  type PhoneticStyle, type PhoneticWord,
} from '../generate/phonetics.js';
import {
  layOutUtterance, type PitchNote, type SungSyllable,
} from '../generate/utterance.js';
import { DELIVERIES, DELIVERY_ORDER, type Delivery, type DeliveryId } from '../style/delivery.js';
import { VOWEL_FRONTNESS, VOWEL_OPENNESS } from '../style/vocals.js';
import {
  SIGNATURE_ORDER, VOICE_SIGNATURES, type VoiceSignature, type VoiceSignatureId,
} from '../style/voices.js';
import { VoiceSynth, type SynthEvent, type VoicePatch } from './voice-synth.js';

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el as T;
};

const els = {
  text: $<HTMLTextAreaElement>('text'),
  play: $<HTMLButtonElement>('play'),
  stop: $<HTMLButtonElement>('stop'),
  reroll: $<HTMLButtonElement>('reroll'),
  status: $<HTMLDivElement>('status'),
  signature: $<HTMLSelectElement>('signature'),
  signatureGloss: $<HTMLDivElement>('signature-gloss'),
  signatureSliders: $<HTMLDivElement>('signature-sliders'),
  delivery: $<HTMLSelectElement>('delivery'),
  deliveryGloss: $<HTMLDivElement>('delivery-gloss'),
  deliverySliders: $<HTMLDivElement>('delivery-sliders'),
  deliveryMore: $<HTMLDivElement>('delivery-more'),
  phonetics: $<HTMLSelectElement>('phonetics'),
  phoneticsGloss: $<HTMLDivElement>('phonetics-gloss'),
  phoneticSliders: $<HTMLDivElement>('phonetic-sliders'),
  contour: $<HTMLSelectElement>('contour'),
  contourGloss: $<HTMLDivElement>('contour-gloss'),
  key: $<HTMLSelectElement>('key'),
  tuneSliders: $<HTMLDivElement>('tune-sliders'),
  words: $<HTMLDivElement>('words'),
  readingSummary: $<HTMLDivElement>('reading-summary'),
  timeline: $<HTMLTableElement>('timeline'),
  vowelMap: document.getElementById('vowel-map') as unknown as SVGSVGElement,
  vowelLegend: $<HTMLDivElement>('vowel-legend'),
  json: $<HTMLPreElement>('json'),
  saveA: $<HTMLButtonElement>('save-a'),
  saveB: $<HTMLButtonElement>('save-b'),
  playA: $<HTMLButtonElement>('play-a'),
  playB: $<HTMLButtonElement>('play-b'),
  ab: $<HTMLButtonElement>('ab'),
  labelA: $<HTMLSpanElement>('label-a'),
  labelB: $<HTMLSpanElement>('label-b'),
};

// --- sample texts ---------------------------------------------------------

/**
 * Four texts that stress different parts of the mapping.
 *
 * Finnish because that is the target language and it is front-rounded, which is
 * exactly the region a five-vowel palette cannot reach. English because its
 * spelling lies about its vowels, so it is where the letter mapping is least
 * reliable and the hash has to carry the word. Nonsense because a word with no
 * language behind it is the honest test of whether the algorithm produces
 * variety on its own. Minimal because the real question about a game vocal is
 * whether four syllables can be listened to for ten minutes.
 */
const SAMPLES: Record<string, string> = {
  finnish: 'kuutamo satumaa hiljaisuus, ilta laskeutuu meren ylle, kaiho ja muisto',
  english: 'the long light over the water, a slow river turning, someone calling home',
  nonsense: 'vaelo nurimi tashende, oloa kirunta velmo, susanteli morava',
  minimal: 'aa noo lii maa',
};

// --- state ----------------------------------------------------------------

type ContourId = 'monotone' | 'arch' | 'fall' | 'walk' | 'leaps' | 'held';

interface TuneParams {
  bpm: number;
  /** Reach of the contour in scale steps, either side of the centre. */
  span: number;
  /** Base note length in beats. */
  noteBeats: number;
  /** Notes between phrase breaks. 0 for none — the voice never breathes. */
  restEvery: number;
}

const CONTOURS: Record<ContourId, string> = {
  monotone: 'One note. Everything you hear is the delivery, not the tune.',
  arch: 'Rise and fall across each phrase — the shape most sung lines have.',
  fall: 'Descending. Where a melisma sounds most like a melisma.',
  walk: 'Small steps in the scale, up and down. The neutral test.',
  leaps: 'Wide intervals, so the octave fold and the vowel migration get exercised.',
  held: 'Long notes. This is where a syllable has to sustain or turn into a drone.',
};

const KEYS: [number, Mode][] = [
  [9, 'minor'], [2, 'minor'], [4, 'minor'], [0, 'major'], [5, 'major'], [7, 'major'],
];

interface Settings {
  text: string;
  signatureId: VoiceSignatureId;
  deliveryId: DeliveryId;
  paletteId: string;
  contour: ContourId;
  keyIndex: number;
  tuneSeed: number;
  signature: VoiceSignature;
  delivery: Delivery;
  palette: PhoneticStyle;
  tune: TuneParams;
  patch: { gain: number; reverb: number; consonantGain: number };
}

function makeSettings(): Settings {
  return {
    text: SAMPLES.finnish!,
    signatureId: 'female',
    deliveryId: 'sung',
    paletteId: 'finnish',
    contour: 'arch',
    keyIndex: 0,
    tuneSeed: 1,
    signature: { ...VOICE_SIGNATURES.female },
    delivery: { ...DELIVERIES.sung },
    palette: clonePalette(PHONETIC_STYLES.finnish!),
    tune: { bpm: 84, span: 4, noteBeats: 1, restEvery: 6 },
    patch: { gain: 0.85, reverb: 0.3, consonantGain: 0.45 },
  };
}

function clonePalette(p: PhoneticStyle): PhoneticStyle {
  return { ...p, vowels: p.vowels.map((v) => [...v] as const), consonants: p.consonants.map((c) => [...c] as const) };
}

function cloneSettings(s: Settings): Settings {
  return {
    ...s,
    signature: { ...s.signature, range: [...s.signature.range] as [number, number] },
    delivery: { ...s.delivery },
    palette: clonePalette(s.palette),
    tune: { ...s.tune },
    patch: { ...s.patch },
  };
}

let settings = makeSettings();
let slotA: Settings | undefined;
let slotB: Settings | undefined;

let ctx: AudioContext | undefined;
let synth: VoiceSynth | undefined;

// --- controls -------------------------------------------------------------

interface SliderSpec {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  /** Marked in the accent colour — the ones that change the character. */
  key_?: boolean;
  format?: (v: number) => string;
}

function buildSliders(
  host: HTMLElement,
  target: Record<string, unknown>,
  specs: SliderSpec[],
  onChange: () => void,
): void {
  host.replaceChildren();
  for (const spec of specs) {
    const row = document.createElement('div');
    row.className = `slider${spec.key_ ? ' key' : ''}`;

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = spec.label;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(spec.min);
    input.max = String(spec.max);
    input.step = String(spec.step);
    input.value = String(target[spec.key] ?? spec.min);

    const val = document.createElement('span');
    val.className = 'val';
    const show = () => {
      const v = Number(target[spec.key]);
      val.textContent = spec.format ? spec.format(v) : String(Math.round(v * 100) / 100);
    };
    show();

    input.oninput = () => {
      target[spec.key] = Number(input.value);
      show();
      onChange();
    };

    row.append(name, input, val);
    host.append(row);
  }
}

const SIGNATURE_SLIDERS: SliderSpec[] = [
  { key: 'formantScale', label: 'tract length', min: 0.8, max: 1.45, step: 0.01, key_: true,
    format: (v) => `×${v.toFixed(2)}` },
  { key: 'centre', label: 'centre pitch', min: 36, max: 79, step: 1, format: (v) => String(Math.round(v)) },
  // 1.0 is a sawtooth — the neutral source. Below is pressed and bright, above
  // is soft and dark; the useful range is narrow and sits around it.
  { key: 'rolloff', label: 'source rolloff', min: 0.6, max: 1.8, step: 0.05, key_: true },
  { key: 'breath', label: 'breath', min: 0, max: 0.4, step: 0.01 },
  { key: 'ring', label: 'singer’s formant', min: 0, max: 18, step: 0.5, format: (v) => `${v} dB` },
  { key: 'vibRate', label: 'vibrato rate', min: 3, max: 8, step: 0.1, format: (v) => `${v.toFixed(1)} Hz` },
  { key: 'vibDepth', label: 'vibrato depth', min: 0, max: 0.6, step: 0.01 },
];

/**
 * The four that decide whether this is talking or singing, plus the two that
 * decide how fast. Everything else is behind a fold, because sixteen sliders
 * presented at once is a wall rather than an instrument.
 */
const DELIVERY_SLIDERS: SliderSpec[] = [
  { key: 'legato', label: 'legato in word', min: 0, max: 1, step: 0.01, key_: true },
  { key: 'melisma', label: 'melisma', min: 0, max: 0.8, step: 0.01, key_: true },
  { key: 'flatten', label: 'sung → spoken', min: 0, max: 1, step: 0.01, key_: true },
  { key: 'intonation', label: 'intonation', min: 0, max: 8, step: 0.1, key_: true, format: (v) => `${v.toFixed(1)} st` },
  { key: 'syllableBeats', label: 'syllable (beats)', min: 0.25, max: 3, step: 0.25 },
  { key: 'syllableRate', label: 'speech (syl/s)', min: 2, max: 9, step: 0.1 },
];

const DELIVERY_MORE_SLIDERS: SliderSpec[] = [
  { key: 'wordGap', label: 'word gap', min: 0, max: 1, step: 0.02 },
  { key: 'breathGap', label: 'breath gap', min: 0, max: 1.6, step: 0.02 },
  { key: 'scoop', label: 'scoop', min: 0, max: 3, step: 0.05, format: (v) => `${v.toFixed(2)} st` },
  { key: 'vibrato', label: 'vibrato amount', min: 0, max: 2, step: 0.05 },
  { key: 'articulation', label: 'syllable dip', min: 0.1, max: 1, step: 0.01 },
  { key: 'glide', label: 'mouth speed', min: 0.015, max: 0.2, step: 0.005, format: (v) => `${Math.round(v * 1000)} ms` },
  { key: 'attack', label: 'attack', min: 0.004, max: 0.12, step: 0.002, format: (v) => `${Math.round(v * 1000)} ms` },
  { key: 'sustain', label: 'sustain', min: 0.4, max: 1, step: 0.01 },
  { key: 'release', label: 'release', min: 0.02, max: 0.6, step: 0.01, format: (v) => `${Math.round(v * 1000)} ms` },
  { key: 'stressLength', label: 'stress: length', min: 0, max: 1, step: 0.02 },
  { key: 'stressLevel', label: 'stress: level', min: 0, max: 1, step: 0.02 },
  { key: 'voiced', label: 'voiced → whisper', min: 0, max: 1, step: 0.01 },
];

const PHONETIC_SLIDERS: SliderSpec[] = [
  { key: 'spelling', label: 'hash → letters', min: 0, max: 1, step: 0.01, key_: true },
  { key: 'separation', label: 'vowel separation', min: 0, max: 0.7, step: 0.01, key_: true },
  { key: 'onsetDensity', label: 'consonant: word', min: 0, max: 1, step: 0.02 },
  { key: 'interiorDensity', label: 'consonant: inside', min: 0, max: 1, step: 0.02 },
  { key: 'maxSyllables', label: 'max syllables', min: 1, max: 6, step: 1, format: (v) => String(Math.round(v)) },
];

const TUNE_SLIDERS: SliderSpec[] = [
  { key: 'bpm', label: 'tempo', min: 40, max: 180, step: 1, format: (v) => `${Math.round(v)}` },
  { key: 'span', label: 'range (steps)', min: 0, max: 10, step: 1, format: (v) => String(Math.round(v)) },
  { key: 'noteBeats', label: 'note length', min: 0.25, max: 4, step: 0.25 },
  { key: 'restEvery', label: 'breath every', min: 0, max: 16, step: 1, format: (v) => (v ? `${Math.round(v)} notes` : 'never') },
];

const PATCH_SLIDERS: SliderSpec[] = [
  { key: 'gain', label: 'level', min: 0, max: 1.5, step: 0.01 },
  { key: 'reverb', label: 'reverb', min: 0, max: 1, step: 0.01 },
  { key: 'consonantGain', label: 'consonant level', min: 0, max: 1, step: 0.01 },
];

// --- the tune -------------------------------------------------------------

/**
 * A pitch skeleton to sing on.
 *
 * This is not the song generator — it is six shapes chosen because each one
 * breaks something different. `held` finds anything that turns into a drone,
 * `leaps` exercises the octave fold and the vowel migration at the top of the
 * range, and `monotone` removes the tune entirely so that whatever remains
 * audible is the delivery and nothing else.
 */
function makeTune(s: Settings, targetBeats: number): PitchNote[] {
  const [tonic, mode] = KEYS[s.keyIndex] ?? KEYS[0]!;
  const scale = makeScale(tonic, mode);
  const rng = new Rng(`tune:${s.contour}:${s.tuneSeed}:${s.keyIndex}`);
  const reach = Math.max(0, Math.round(s.tune.span));
  const period = Math.max(2, s.tune.restEvery || 8);

  const notes: PitchNote[] = [];
  let beat = 0;
  let degree = 0;
  let i = 0;

  while (beat < targetBeats && notes.length < 512) {
    let duration = s.tune.noteBeats;
    if (s.contour === 'held') duration *= rng.pick([2, 3, 3, 4]);
    else duration *= rng.pick([1, 1, 1, 0.5, 2]);
    duration = Math.max(0.25, duration);

    const phase = i % period;
    switch (s.contour) {
      case 'monotone': degree = 0; break;
      case 'arch': degree = Math.round(reach * Math.sin((Math.PI * phase) / period)); break;
      case 'fall': degree = reach - Math.round((phase / period) * reach * 2); break;
      case 'leaps': degree = clamp(degree + rng.pick([-4, -3, 3, 4, -5, 5]), -reach - 2, reach + 2); break;
      case 'held':
      case 'walk':
      default: degree = clamp(degree + rng.pick([-2, -1, -1, 0, 1, 1, 2]), -reach, reach); break;
    }

    notes.push({
      beat,
      duration,
      midi: degreeToMidi(scale, degree, 4),
      velocity: 0.7 + rng.float(0, 0.22),
    });
    beat += duration;
    i++;
    if (s.tune.restEvery > 0 && i % s.tune.restEvery === 0) beat += 1.5;
  }
  return notes;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// --- rendering the line ---------------------------------------------------

interface Line {
  words: PhoneticWord[];
  syllables: SungSyllable[];
  tune: PitchNote[];
}

function buildLine(s: Settings, text = s.text): Line {
  const words = pronounce(text, s.palette);
  const syllableCount = words.reduce((n, w) => n + w.syllables.length, 0);
  if (!syllableCount) return { words, syllables: [], tune: [] };

  // Enough tune to carry every syllable, with a little slack — the layout
  // stops at whichever runs out first and a text cut off mid-phrase is a
  // confusing thing to be auditioning.
  const perSyllable = s.delivery.timing === 'speech'
    ? (s.tune.bpm / 60) / Math.max(0.5, s.delivery.syllableRate)
    : s.delivery.syllableBeats;
  const targetBeats = syllableCount * perSyllable * 1.35 + 4;

  const tune = makeTune(s, targetBeats);
  const syllables = layOutUtterance({
    words,
    tune,
    delivery: s.delivery,
    signature: s.signature,
    bpm: s.tune.bpm,
    rng: new Rng(`line:${s.tuneSeed}:${text.length}`),
    loopText: false,
  });
  return { words, syllables, tune };
}

function toEvents(line: SungSyllable[], bpm: number): SynthEvent[] {
  const spb = 60 / bpm;
  const start = line[0]?.beat ?? 0;
  return line.map((s) => ({
    time: (s.beat - start) * spb,
    duration: s.duration * spb,
    midi: s.midi,
    velocity: s.velocity,
    vowel: s.vowel,
    consonant: s.consonant,
    tie: s.tie,
    legatoToNext: s.legatoToNext,
  }));
}

function patchOf(s: Settings): VoicePatch {
  return {
    signature: s.signature,
    delivery: s.delivery,
    gain: s.patch.gain,
    reverb: s.patch.reverb,
    consonantGain: s.patch.consonantGain,
  };
}

async function ensureSynth(): Promise<VoiceSynth> {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') await ctx.resume();
  if (!synth) synth = new VoiceSynth(ctx);
  return synth;
}

async function playSettings(s: Settings, text?: string): Promise<number> {
  const v = await ensureSynth();
  v.stop();
  const line = buildLine(s, text);
  if (!line.syllables.length) {
    setStatus('Nothing to sing — the text has no letters in it.', true);
    return 0;
  }
  const end = v.speak(toEvents(line.syllables, s.tune.bpm), patchOf(s));
  return end - (ctx?.currentTime ?? 0);
}

function setStatus(text: string, error = false): void {
  els.status.textContent = text;
  els.status.className = error ? 'status err' : 'status';
}

// --- readout --------------------------------------------------------------

const ONSET_MARK: Record<Consonant, string> = {
  none: '–', stop: 'stop', fricative: 'fric', nasal: 'nasal', liquid: 'liquid',
};

/**
 * Which words in this text are homophones of each other.
 *
 * Two different words landing on the same syllables is not a bug — it is the
 * price of the constraints, and the constraints are right. With four consonant
 * manners and a nine-vowel palette, a two-syllable word has a few hundred
 * possible sounds, so a page of text will collide occasionally exactly as the
 * birthday problem says it must. Real languages are full of homophones for the
 * same reason.
 *
 * But it should be *visible*, because it is the one failure mode that looks
 * like the mapping is broken when it is working correctly, and because the
 * remedy is a decision rather than a fix: widen the palette, allow more
 * consonants, or accept it. Repeating the same word is of course not a
 * collision, so this compares distinct spellings rather than counting.
 */
function findHomophones(words: PhoneticWord[]): Set<string> {
  const bySound = new Map<string, Set<string>>();
  for (const w of words) {
    const sound = spellSyllables(w);
    const norm = w.text.toLowerCase().replace(/[^\p{L}]/gu, '');
    const set = bySound.get(sound) ?? new Set<string>();
    set.add(norm);
    bySound.set(sound, set);
  }
  const clashing = new Set<string>();
  for (const [sound, texts] of bySound) if (texts.size > 1) clashing.add(sound);
  return clashing;
}

function renderReadout(line: Line): void {
  // Words, each showing what it hashes to. Clicking one sings it alone, which
  // is the fastest way to confirm the mapping is stable.
  els.words.replaceChildren();
  const sungWords = new Set(line.syllables.map((s) => s.wordIndex));
  const homophones = findHomophones(line.words);
  line.words.forEach((word, i) => {
    const clash = homophones.has(spellSyllables(word));
    const el = document.createElement('div');
    el.className = `word${sungWords.has(i) ? ' lit' : ''}${clash ? ' dup' : ''}`;
    if (clash) el.title = 'Another word in this text sounds identical to this one.';
    const w = document.createElement('div');
    w.className = 'w';
    w.textContent = word.text;
    const p = document.createElement('div');
    p.className = 'p';
    p.textContent = spellSyllables(word);
    const h = document.createElement('div');
    h.className = 'h';
    h.textContent = word.hash.toString(16).padStart(8, '0');
    el.append(w, p, h);
    el.onclick = () => {
      void playSettings(settings, word.text);
      setStatus(`"${word.text}" — ${spellSyllables(word)}`);
    };
    els.words.append(el);
  });

  // Timeline.
  const body = els.timeline.tBodies[0] ?? els.timeline.createTBody();
  body.replaceChildren();
  for (const s of line.syllables.slice(0, 200)) {
    const tr = document.createElement('tr');
    const cells = [
      s.beat.toFixed(2),
      s.duration.toFixed(2),
      s.midi.toFixed(2),
      s.tie ? '–' : s.word,
      s.vowel,
      s.tie ? '–' : ONSET_MARK[s.consonant],
      s.tie ? 'melisma' : (s.legatoToNext ? 'joined' : ''),
    ];
    cells.forEach((text, i) => {
      const td = document.createElement('td');
      td.textContent = text;
      if (s.tie && (i === 3 || i === 6)) td.className = 'tie';
      tr.append(td);
    });
    body.append(tr);
  }

  const ties = line.syllables.filter((s) => s.tie).length;
  const joined = line.syllables.filter((s) => s.legatoToNext).length;
  const onsets = line.syllables.filter((s) => !s.tie && s.consonant !== 'none').length;
  const beats = line.syllables.length
    ? (line.syllables[line.syllables.length - 1]!.beat + line.syllables[line.syllables.length - 1]!.duration)
    : 0;
  const clashes = findHomophones(line.words).size;
  els.readingSummary.textContent = line.syllables.length
    ? `${line.syllables.length} syllables over ${beats.toFixed(1)} beats `
      + `(${(beats * 60 / settings.tune.bpm).toFixed(1)}s) · `
      + `${ties} held across a note · ${joined} run into the next with no gap · `
      + `${Math.round((onsets / Math.max(1, line.syllables.length - ties)) * 100)}% have a consonant`
      + (clashes ? ` · ${clashes} sound${clashes > 1 ? 's' : ''} shared by two words (outlined blue)` : '')
    : 'Nothing to sing.';
}

/**
 * The vowel quadrilateral, with the line's own path drawn on it.
 *
 * This is the chart that answers "why does everything sound the same". Distance
 * in the openness/frontness plane is very nearly a measure of how different two
 * vowels sound, so a line whose points cluster is a line the ear hears as one
 * vowel repeated — and the mean step below the chart puts a number on it.
 * Anything under about 0.25 is the "duu du du duu" failure, whatever the
 * palette nominally contains.
 */
function renderVowelMap(line: Line): void {
  const W = 460;
  const H = 330;
  const pad = 46;
  const x = (v: Vowel) => pad + (1 - VOWEL_FRONTNESS[v]) * (W - pad * 2);
  const y = (v: Vowel) => pad + VOWEL_OPENNESS[v] * (H - pad * 2);

  const used = new Map<Vowel, number>();
  for (const s of line.syllables) used.set(s.vowel, (used.get(s.vowel) ?? 0) + 1);
  const most = Math.max(1, ...used.values());

  const parts: string[] = [];
  parts.push(
    `<rect x="${pad}" y="${pad}" width="${W - pad * 2}" height="${H - pad * 2}"`
    + ' fill="none" stroke="#372e29"/>',
    `<text x="${pad}" y="${pad - 14}" fill="#a2938a" font-size="11">front</text>`,
    `<text x="${W - pad}" y="${pad - 14}" fill="#a2938a" font-size="11" text-anchor="end">back</text>`,
    `<text x="${pad - 8}" y="${pad + 4}" fill="#a2938a" font-size="11" text-anchor="end">close</text>`,
    `<text x="${pad - 8}" y="${H - pad}" fill="#a2938a" font-size="11" text-anchor="end">open</text>`,
  );

  // The path the line actually walked, in order.
  const path = line.syllables.map((s) => `${x(s.vowel).toFixed(1)},${y(s.vowel).toFixed(1)}`);
  if (path.length > 1) {
    parts.push(`<polyline points="${path.join(' ')}" fill="none" stroke="#79b0c4" stroke-width="1" opacity="0.45"/>`);
  }

  // Everything the palette allows, whether the line reached it or not — an
  // unlit dot is a vowel that is available and never being chosen.
  for (const [vowel] of settings.palette.vowels) {
    const n = used.get(vowel) ?? 0;
    const r = n ? 5 + 9 * (n / most) : 3.5;
    const fill = n ? '#e0a24a' : 'none';
    parts.push(
      `<circle cx="${x(vowel).toFixed(1)}" cy="${y(vowel).toFixed(1)}" r="${r.toFixed(1)}"`
      + ` fill="${fill}" fill-opacity="0.75" stroke="#e0a24a" stroke-opacity="${n ? 1 : 0.35}"/>`,
      `<text x="${(x(vowel) + r + 4).toFixed(1)}" y="${(y(vowel) + 4).toFixed(1)}"`
      + ` fill="${n ? '#efe6dc' : '#6d605a'}" font-size="11">${vowel}</text>`,
    );
  }

  els.vowelMap.innerHTML = parts.join('');

  // How far the line travels between neighbouring syllables, on average.
  let steps = 0;
  let sum = 0;
  for (let i = 1; i < line.syllables.length; i++) {
    const a = line.syllables[i - 1]!.vowel;
    const b = line.syllables[i]!.vowel;
    if (a === b && line.syllables[i]!.tie) continue;
    sum += Math.hypot(
      VOWEL_OPENNESS[a] - VOWEL_OPENNESS[b],
      VOWEL_FRONTNESS[a] - VOWEL_FRONTNESS[b],
    );
    steps++;
  }
  // Calibrated against the palettes rather than guessed: two vowels drawn at
  // random from a palette spread across the quadrilateral average about 0.6
  // apart, so 0.6 is "no worse than chance" and anything well under it means
  // the line is circling one corner of the mouth.
  const mean = steps ? sum / steps : 0;
  const verdict = mean < 0.3 ? 'too close — this is the "duu du du" failure'
    : mean < 0.55 ? 'gentle, floaty'
    : mean < 0.85 ? 'clearly articulated'
    : 'wide, almost declamatory';
  els.vowelLegend.textContent =
    `${used.size} of ${settings.palette.vowels.length} palette vowels used · `
    + `mean step between syllables ${mean.toFixed(2)} — ${verdict}`;
}

// --- refresh --------------------------------------------------------------

function refresh(): void {
  const line = buildLine(settings);
  renderReadout(line);
  renderVowelMap(line);
  els.json.textContent = JSON.stringify({
    signature: settings.signature,
    delivery: settings.delivery,
    phonetics: settings.palette,
    tune: { ...settings.tune, contour: settings.contour, key: keyOf(settings) },
    patch: settings.patch,
  }, null, 2);
}

function keyOf(s: Settings): string {
  const [tonic, mode] = KEYS[s.keyIndex] ?? KEYS[0]!;
  return keyLabel(tonic, mode);
}

// --- wiring ---------------------------------------------------------------

function fillSelect(select: HTMLSelectElement, entries: [string, string][]): void {
  select.replaceChildren();
  for (const [value, label] of entries) select.append(new Option(label, value));
}

fillSelect(els.signature, SIGNATURE_ORDER.map((id) => [id, VOICE_SIGNATURES[id].label]));
fillSelect(els.delivery, DELIVERY_ORDER.map((id) => [id, DELIVERIES[id].label]));
fillSelect(els.phonetics, PHONETIC_STYLE_ORDER.map((id) => [id, id]));
fillSelect(els.contour, (Object.keys(CONTOURS) as ContourId[]).map((id) => [id, id]));
fillSelect(els.key, KEYS.map(([t, m], i) => [String(i), keyLabel(t, m)]));

function syncSignature(): void {
  els.signature.value = settings.signatureId;
  els.signatureGloss.textContent = VOICE_SIGNATURES[settings.signatureId].gloss;
  buildSliders(els.signatureSliders, settings.signature as unknown as Record<string, unknown>,
    SIGNATURE_SLIDERS, refresh);
}

function syncDelivery(): void {
  els.delivery.value = settings.deliveryId;
  els.deliveryGloss.textContent = DELIVERIES[settings.deliveryId].gloss;
  const target = settings.delivery as unknown as Record<string, unknown>;
  buildSliders(els.deliverySliders, target, DELIVERY_SLIDERS, refresh);
  buildSliders(els.deliveryMore, target, DELIVERY_MORE_SLIDERS, refresh);
}

function syncPhonetics(): void {
  els.phonetics.value = settings.paletteId;
  const n = settings.palette.vowels.length;
  els.phoneticsGloss.textContent =
    `${n} vowels, ${settings.palette.consonants.length} consonant manners. `
    + 'Letters place the syllable in the mouth; the hash chooses within that region.';
  buildSliders(els.phoneticSliders, settings.palette as unknown as Record<string, unknown>,
    PHONETIC_SLIDERS, refresh);
}

function syncTune(): void {
  els.contour.value = settings.contour;
  els.key.value = String(settings.keyIndex);
  els.contourGloss.textContent = CONTOURS[settings.contour];
  const host = els.tuneSliders;
  buildSliders(host, settings.tune as unknown as Record<string, unknown>, TUNE_SLIDERS, refresh);
  const patchHost = document.createElement('div');
  patchHost.className = 'sliders';
  patchHost.style.marginTop = '.5rem';
  buildSliders(patchHost, settings.patch as unknown as Record<string, unknown>, PATCH_SLIDERS, refresh);
  host.append(patchHost);
}

els.signature.onchange = () => {
  settings.signatureId = els.signature.value as VoiceSignatureId;
  settings.signature = { ...VOICE_SIGNATURES[settings.signatureId] };
  syncSignature();
  refresh();
};

els.delivery.onchange = () => {
  settings.deliveryId = els.delivery.value as DeliveryId;
  settings.delivery = { ...DELIVERIES[settings.deliveryId] };
  syncDelivery();
  refresh();
};

els.phonetics.onchange = () => {
  settings.paletteId = els.phonetics.value;
  settings.palette = clonePalette(PHONETIC_STYLES[settings.paletteId] ?? PHONETIC_STYLES.finnish!);
  syncPhonetics();
  refresh();
};

els.contour.onchange = () => {
  settings.contour = els.contour.value as ContourId;
  els.contourGloss.textContent = CONTOURS[settings.contour];
  refresh();
};

els.key.onchange = () => {
  settings.keyIndex = Number(els.key.value);
  refresh();
};

els.text.oninput = () => {
  settings.text = els.text.value;
  refresh();
};

els.reroll.onclick = () => {
  settings.tuneSeed++;
  refresh();
  setStatus(`New tune (seed ${settings.tuneSeed}). The words are unchanged — they always are.`);
};

els.play.onclick = () => {
  void playSettings(settings).then((seconds) => {
    if (seconds > 0) {
      setStatus(`Singing — ${seconds.toFixed(1)}s, ${settings.signature.label.toLowerCase()}, `
        + `${settings.delivery.label.toLowerCase()}.`);
    }
  }).catch((err) => {
    setStatus(`Audio failed: ${String(err)}`, true);
    console.error(err);
  });
};

els.stop.onclick = () => {
  synth?.stop();
  setStatus('Stopped.');
};

for (const button of Array.from(document.querySelectorAll<HTMLButtonElement>('[data-sample]'))) {
  button.onclick = () => {
    const key = button.dataset.sample ?? 'finnish';
    settings.text = SAMPLES[key] ?? SAMPLES.finnish!;
    els.text.value = settings.text;
    refresh();
  };
}

function describeSlot(s: Settings): string {
  return `${s.signature.label} · ${s.delivery.label} · ${s.paletteId}`;
}

els.saveA.onclick = () => {
  slotA = cloneSettings(settings);
  els.labelA.textContent = `A: ${describeSlot(slotA)}`;
  els.playA.disabled = false;
  els.ab.disabled = !slotB;
};

els.saveB.onclick = () => {
  slotB = cloneSettings(settings);
  els.labelB.textContent = `B: ${describeSlot(slotB)}`;
  els.playB.disabled = false;
  els.ab.disabled = !slotA;
};

els.playA.onclick = () => { if (slotA) void playSettings(slotA); };
els.playB.onclick = () => { if (slotB) void playSettings(slotB); };

els.ab.onclick = async () => {
  if (!slotA || !slotB) return;
  const seconds = await playSettings(slotA);
  setStatus(`A — ${describeSlot(slotA)}`);
  window.setTimeout(() => {
    if (!slotB) return;
    void playSettings(slotB);
    setStatus(`B — ${describeSlot(slotB)}`);
  }, (seconds + 0.6) * 1000);
};

function boot(): void {
  els.text.value = settings.text;
  syncSignature();
  syncDelivery();
  syncPhonetics();
  syncTune();
  refresh();
  setStatus('Ready. Audio starts on the first press of Sing.');
}

boot();
