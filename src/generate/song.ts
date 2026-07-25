/**
 * Top-level song generation.
 *
 * Decides era, dance, key, tempo and form; lays out sections; then hands each
 * section to the part generators and assembles the Song IR.
 *
 * The form logic encodes the two structural clichés that make iskelmä sound
 * like iskelmä:
 *  - a solo chorus (accordion or sax takes the tune while the "voice" rests),
 *  - and the final-chorus key change up a semitone or a tone.
 */

import { parseRoman, type Chord } from '../core/chord.js';
import { keyLabel, type Pc } from '../core/pitch.js';
import { Rng } from '../core/rng.js';
import type { Mode } from '../core/scale.js';
import type {
  DrumEvent, DrumTrack, LayerId, NoteEvent, Section, SectionKind, Song, Track,
} from '../core/types.js';
import { getEra, type EraProfile } from '../style/eras.js';
import { INSTRUMENTS, type Instrument, type InstrumentId } from '../style/instruments.js';
import { getMood, type Mood } from '../style/moods.js';
import { getStyle, STYLES } from '../style/styles.js';
import type { Progression, Style } from '../style/types.js';
import { generateMelody } from './melody.js';
import {
  generateBass, generateBrass, generateComp, generateCounter, generateDrums, generatePad,
  type PartContext,
} from './parts.js';
import { generateTitle } from './titles.js';

export interface GenerateOptions {
  seed?: string | number;
  era?: string;
  style?: string;
  mood?: string;
  /** Force a key, e.g. 9 for A. */
  tonic?: Pc;
  mode?: Mode;
  bpm?: number;
  /** Target song length in seconds; the form is stretched to fit. */
  targetSeconds?: number;
}

/** Keys that sit well for accordion, guitar and singers. */
const MINOR_KEYS: (readonly [Pc, number])[] = [
  [9, 5], [4, 4], [2, 4], [7, 3], [11, 3], [0, 2], [5, 2], [6, 1],
];
const MAJOR_KEYS: (readonly [Pc, number])[] = [
  [0, 5], [7, 4], [5, 4], [2, 3], [10, 3], [9, 2], [3, 2],
];

interface FormStep {
  kind: SectionKind;
  bars: number;
}

const FORM_TEMPLATES: (readonly [FormStep[], number])[] = [
  [[
    { kind: 'intro', bars: 4 }, { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'solo', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'outro', bars: 4 },
  ], 5],
  [[
    { kind: 'intro', bars: 4 }, { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 }, { kind: 'bridge', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'outro', bars: 4 },
  ], 5],
  [[
    { kind: 'intro', bars: 4 }, { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'outro', bars: 4 },
  ], 3],
  [[
    { kind: 'intro', bars: 4 }, { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'solo', bars: 8 }, { kind: 'chorus', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 4],
];

export function generateSong(opts: GenerateOptions = {}): Song {
  const seed = String(opts.seed ?? Math.floor(Math.random() * 1e9));
  const rng = new Rng(seed);

  const era = getEra(opts.era ?? rng.weighted([['tanssilava', 1], ['eighties', 1]] as const));
  const mood = getMood(opts.mood ?? 'neutraali');
  const style = getStyle(opts.style ?? chooseStyle(rng, era, mood));
  const mode = opts.mode ?? chooseMode(rng, style, mood);
  const tonic = opts.tonic ?? rng.weighted(mode === 'minor' ? MINOR_KEYS : MAJOR_KEYS);
  const bpm = opts.bpm ?? chooseTempo(rng, style, mood, era);

  const density = clamp(era.density + mood.density, 0.25, 1);
  const instruments = chooseInstruments(rng, era);

  // ---- Form ------------------------------------------------------------
  const steps = buildForm(rng, style, bpm, opts.targetSeconds ?? rng.float(105, 185));
  const liftAt = rng.chance(era.keyChangeChance) ? lastChorusIndex(steps) : -1;
  const lift = liftAt >= 0 ? rng.weighted([[1, 3], [2, 2]] as const) : 0;

  const sections: Section[] = [];
  let bar = 0;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    const transpose = liftAt >= 0 && i >= liftAt ? lift : 0;
    sections.push({
      kind: step.kind,
      startBar: bar,
      lengthBars: step.bars,
      transpose,
      mode,
      activeLayers: layersFor(step.kind, density, mood, rng),
      chordLabels: [],
    });
    bar += step.bars;
  }
  const totalBars = bar;

  // ---- Parts -----------------------------------------------------------
  const byLayer = new Map<LayerId, NoteEvent[]>();
  const drumEvents: DrumEvent[] = [];
  for (const l of ['drums', 'bass', 'comp', 'pad', 'melody', 'counter', 'brass'] as LayerId[]) {
    byLayer.set(l, []);
  }

  // Fix the rhythm-section figures for the whole song — a band does not change
  // its comping pattern every eight bars.
  const bassPattern = rng.weightedBy(style.bass, (p) => p.weight);
  const compPattern = rng.weightedBy(style.comp, (p) => p.weight);
  const drumPattern = rng.weightedBy(style.drums, (p) => p.weight);
  const drumBank = rng.weighted(era.drumBanks);

  for (const section of sections) {
    const localTonic = ((tonic + section.transpose) % 12 + 12) % 12;
    const progression = pickProgression(rng, style, section.kind, mode);
    const chords = expandProgression(progression, section.lengthBars, mode);
    section.chordLabels = chords.map((c) => c.label);

    // Roman numerals parse to offsets *from the tonic*, so shifting by the
    // local tonic is what actually puts the song in its key.
    const ctx: PartContext = {
      chords: chords.map((c) => transposeChord(c, localTonic)),
      beatsPerBar: style.beatsPerBar,
      startBeat: section.startBar * style.beatsPerBar,
      rng,
      style,
    };

    const active = new Set(section.activeLayers);
    const intensity = section.kind === 'chorus' ? 1 : section.kind === 'intro' || section.kind === 'outro' ? 0.78 : 0.9;

    if (active.has('drums')) {
      drumEvents.push(...generateDrums(ctx, drumPattern, {
        fillAtEnd: section.kind !== 'outro',
        intensity,
      }));
    }
    if (active.has('bass')) push(byLayer, 'bass', generateBass(ctx, bassPattern));
    if (active.has('comp')) push(byLayer, 'comp', generateComp(ctx, compPattern, instruments.comp.centre));
    if (active.has('pad')) push(byLayer, 'pad', generatePad(ctx, instruments.pad.centre));
    if (active.has('brass')) push(byLayer, 'brass', generateBrass(ctx, instruments.brass.centre));

    // In a solo section the "voice" rests and the counter instrument takes the
    // tune — which is exactly how these arrangements work.
    const isSolo = section.kind === 'solo';
    const leadLayer: LayerId = isSolo ? 'counter' : 'melody';
    const leadInstrument = isSolo ? instruments.counter : instruments.melody;

    if (active.has('melody')) {
      const range: [number, number] = [
        leadInstrument.centre - Math.round(style.melody.span * 0.6),
        leadInstrument.centre + Math.round(style.melody.span * 0.6),
      ];
      const melody = generateMelody({
        chords: ctx.chords,
        beatsPerBar: style.beatsPerBar,
        style,
        rng,
        tonic: localTonic,
        mode,
        range,
        startBeat: ctx.startBeat,
        ornamentScale: mood.ornament,
        leapScale: mood.leap,
        soloistic: isSolo,
      });
      push(byLayer, leadLayer, melody);

      if (!isSolo && active.has('counter')) {
        push(byLayer, 'counter', generateCounter(ctx, melody, instruments.counter.centre));
      }
    }
  }

  // ---- Assemble --------------------------------------------------------
  const layerInstruments: Record<Exclude<LayerId, 'drums'>, Instrument> = {
    bass: instruments.bass,
    comp: instruments.comp,
    pad: instruments.pad,
    melody: instruments.melody,
    counter: instruments.counter,
    brass: instruments.brass,
  };

  const gains: Record<Exclude<LayerId, 'drums'>, number> = {
    bass: 0.9, comp: 0.62, pad: 0.45, melody: 0.85, counter: 0.55, brass: 0.6,
  };

  const tracks: Track[] = [];
  for (const [layer, instrument] of Object.entries(layerInstruments) as [Exclude<LayerId, 'drums'>, Instrument][]) {
    const notes = byLayer.get(layer) ?? [];
    if (!notes.length) continue;
    notes.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
    tracks.push({
      layer,
      instrument: instrument.name,
      gmProgram: instrument.gm,
      strudelSound: instrument.strudel,
      notes: applySwing(notes, style.swing),
      gain: gains[layer],
    });
  }

  drumEvents.sort((a, b) => a.beat - b.beat);
  const drums: DrumTrack = {
    bank: drumBank,
    events: applySwingDrums(drumEvents, style.swing),
    gain: 0.8,
  };

  return {
    meta: {
      seed,
      title: generateTitle(rng),
      style: style.id,
      styleLabel: style.label,
      era: era.id,
      eraLabel: era.label,
      mood: mood.id,
      tonic,
      mode,
      keyLabel: keyLabel(tonic, mode),
      bpm,
      beatsPerBar: style.beatsPerBar,
      beatUnit: style.beatUnit,
      totalBars,
      swing: style.swing,
    },
    sections,
    tracks,
    drums,
  };
}

// ---------------------------------------------------------------------------

function push(map: Map<LayerId, NoteEvent[]>, layer: LayerId, notes: NoteEvent[]): void {
  const arr = map.get(layer);
  if (arr) arr.push(...notes);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function chooseStyle(rng: Rng, era: EraProfile, mood: Mood): string {
  const options = Object.keys(STYLES)
    .map((id) => {
      const eraW = era.styleWeights[id] ?? 0;
      const moodW = mood.styleBias[id] ?? 1;
      return [id, eraW * moodW] as const;
    })
    .filter(([, w]) => w > 0);
  if (!options.length) throw new Error('No style available for this era/mood combination');
  return rng.weighted(options);
}

function chooseMode(rng: Rng, style: Style, mood: Mood): Mode {
  const minor = style.modeWeights.minor * mood.modeBias.minor;
  const major = style.modeWeights.major * mood.modeBias.major;
  return rng.weighted([['minor', minor], ['major', major]] as const) as Mode;
}

function chooseTempo(rng: Rng, style: Style, mood: Mood, era: EraProfile): number {
  const [lo, hi] = style.bpm;
  const mid = (lo + hi) / 2;
  const half = (hi - lo) / 2;
  // Mood pushes toward one end of the band; a little jitter keeps it human.
  const target = mid + mood.tempo * half;
  const value = target + rng.float(-half * 0.25, half * 0.25);
  return Math.round(clamp(value * era.tempoScale, lo, hi));
}

/**
 * Assign one instrument per layer, keeping them distinct.
 *
 * Two layers on the same voice — a pad and a comp both on drawbar organ, say —
 * blur into one thick texture instead of reading as an arrangement. Roles are
 * filled in order of how much the choice matters, so the lead gets first pick
 * and the brass, which is sparse anyway, absorbs any collision that is left.
 */
function chooseInstruments(rng: Rng, era: EraProfile) {
  const taken = new Set<string>();
  const pick = (list: (readonly [InstrumentId, number])[]): Instrument => {
    const free = list.filter(([id]) => !taken.has(INSTRUMENTS[id].name));
    const instrument = INSTRUMENTS[rng.weighted(free.length ? free : list)];
    taken.add(instrument.name);
    return instrument;
  };
  const melody = pick(era.palette.melody);
  const bass = pick(era.palette.bass);
  const comp = pick(era.palette.comp);
  const pad = pick(era.palette.pad);
  const counter = pick(era.palette.counter);
  const brass = pick(era.palette.brass);
  return { melody, counter, comp, pad, bass, brass };
}

function buildForm(rng: Rng, style: Style, bpm: number, targetSeconds: number): FormStep[] {
  const steps = rng.weighted(FORM_TEMPLATES).map((s) => ({ ...s }));
  const secondsPerBar = (style.beatsPerBar / bpm) * 60;

  const duration = () => steps.reduce((a, s) => a + s.bars, 0) * secondsPerBar;

  // Waltzes and fast dances run short at these bar counts, so extend by whole
  // verse/chorus pairs rather than by padding sections.
  let guard = 0;
  while (duration() < targetSeconds * 0.82 && guard++ < 4) {
    const insertAt = Math.max(1, steps.findIndex((s) => s.kind === 'chorus') + 1);
    steps.splice(insertAt, 0, { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 });
  }
  guard = 0;
  while (duration() > targetSeconds * 1.25 && steps.length > 5 && guard++ < 4) {
    const idx = steps.findIndex((s, i) => i > 0 && i < steps.length - 1 && (s.kind === 'verse' || s.kind === 'solo'));
    if (idx < 0) break;
    steps.splice(idx, 1);
  }
  return steps;
}

function lastChorusIndex(steps: FormStep[]): number {
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i]!.kind === 'chorus') return i;
  }
  return -1;
}

function layersFor(kind: SectionKind, density: number, mood: Mood, rng: Rng): LayerId[] {
  const base: Record<SectionKind, LayerId[]> = {
    intro: ['drums', 'bass', 'comp'],
    verse: ['drums', 'bass', 'comp', 'melody'],
    chorus: ['drums', 'bass', 'comp', 'pad', 'melody'],
    bridge: ['drums', 'bass', 'comp', 'pad'],
    solo: ['drums', 'bass', 'comp', 'pad', 'melody'],
    outro: ['drums', 'bass', 'comp', 'pad'],
  };
  const layers = new Set(base[kind]);

  const add = (layer: LayerId, p: number) => { if (rng.chance(p)) layers.add(layer); };

  if (kind === 'verse') add('pad', density * 0.7);
  if (kind === 'chorus') { add('brass', density * 0.8); add('counter', density * 0.7); }
  if (kind === 'verse') add('counter', density * 0.45);
  if (kind === 'bridge') add('counter', density * 0.5);
  if (kind === 'intro') { add('pad', density); add('melody', 0.35); }
  if (kind === 'outro') { add('melody', 0.5); add('brass', density * 0.4); }

  // Restrained moods thin the texture out.
  if (mood.restraint > 0 && rng.chance(mood.restraint * 0.35)) {
    for (const candidate of ['brass', 'counter', 'pad'] as LayerId[]) {
      if (layers.has(candidate)) { layers.delete(candidate); break; }
    }
  }
  return [...layers];
}

function pickProgression(rng: Rng, style: Style, kind: SectionKind, mode: Mode): Progression {
  const useMajorTable = mode === 'major' && style.majorProgressions;
  const table = useMajorTable
    ? style.majorProgressions![kind] ?? style.majorProgressions!.verse ?? style.progressions.verse
    : style.progressions[kind] ?? style.progressions.verse;

  const candidates = table.length ? table : style.progressions.verse;

  // In minor, boost the chorus progressions that open on III or VI — the
  // relative-major region. That lift is the genre's core emotional device.
  if (kind === 'chorus' && mode === 'minor' && style.relativeMajorChorus > 0) {
    return rng.weighted(candidates.map((p) => {
      const first = p.chords[0] ?? '';
      const lifted = first === 'III' || first === 'VI';
      return [p, p.weight * (lifted ? 1 + style.relativeMajorChorus * 2 : 1)] as const;
    }));
  }
  return rng.weightedBy(candidates, (p) => p.weight);
}

function expandProgression(prog: Progression, bars: number, mode: Mode): Chord[] {
  const out: Chord[] = [];
  for (let i = 0; i < bars; i++) {
    const label = prog.chords[i % prog.chords.length]!;
    out.push(parseRoman(label, mode));
  }
  return out;
}

function transposeChord(chord: Chord, semitones: number): Chord {
  if (!semitones) return chord;
  return { ...chord, root: ((chord.root + semitones) % 12 + 12) % 12 };
}

/**
 * Swing: delay the second eighth of each beat. Applied in the IR so both
 * renderers inherit it identically.
 */
function applySwing(notes: NoteEvent[], swing: number): NoteEvent[] {
  if (swing <= 0) return notes;
  return notes.map((n) => {
    const frac = n.beat - Math.floor(n.beat);
    if (Math.abs(frac - 0.5) < 1e-6) {
      return { ...n, beat: n.beat + swing * 0.5, duration: Math.max(0.05, n.duration - swing * 0.5) };
    }
    return n;
  });
}

function applySwingDrums(events: DrumEvent[], swing: number): DrumEvent[] {
  if (swing <= 0) return events;
  return events.map((e) => {
    const frac = e.beat - Math.floor(e.beat);
    if (Math.abs(frac - 0.5) < 1e-6) return { ...e, beat: e.beat + swing * 0.5 };
    return e;
  });
}
