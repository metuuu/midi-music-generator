/**
 * Strictness calibration report.
 *
 *   npm run strictness [songsPerLevel]
 *
 * Generates the *same songs* at every strictness level and counts how often
 * each rule is still broken, alongside the musical cost of the filtering. The
 * point is to make both halves of the trade visible: violations should fall as
 * the level rises, and so should melodic variety. If a level tightens nothing,
 * or flattens the tune to nothing, this is where it shows.
 */

import { parseRoman, type Chord } from './core/chord.js';
import { pc } from './core/pitch.js';
import { makeScale, type Scale } from './core/scale.js';
import type { NoteEvent, Song } from './core/types.js';
import {
  buildAccompaniment, RULES, STRICTNESS_LEVELS, violationsOf,
  type Accompaniment, type NoteContext,
} from './generate/constraints.js';
import { generateSong } from './generate/song.js';

const SLOTS_PER_BEAT = 4;

function metricStrength(slot: number, slotsPerBar: number): number {
  if (slot === 0) return 4;
  if (slotsPerBar % 2 === 0 && slot === slotsPerBar / 2) return 3;
  if (slot % SLOTS_PER_BEAT === 0) return 2;
  if (slot % 2 === 0) return 1;
  return 0;
}

interface Measurement {
  violations: Record<string, number>;
  notes: number;
  intervals: number;
  steps: number;
  distinctPitches: number;
  chordTonesOnBeat: number;
  beatNotes: number;
  range: number;
  songs: number;
}

function measure(song: Song, m: Measurement): void {
  const mel = song.tracks.find((t) => t.layer === 'melody');
  if (!mel) return;
  m.songs++;

  const { beatsPerBar, mode, tonic } = song.meta;
  const slotsPerBar = beatsPerBar * SLOTS_PER_BEAT;

  // Rebuild harmony and accompaniment exactly as the generator saw them.
  const chordAt = new Map<number, Chord>();
  const scaleAt = new Map<number, Scale>();
  for (const sec of song.sections) {
    const localTonic = ((tonic + sec.transpose) % 12 + 12) % 12;
    for (let i = 0; i < sec.lengthBars; i++) {
      const label = sec.chordLabels[i];
      if (!label) continue;
      const base = parseRoman(label, sec.mode);
      const chord: Chord = { ...base, root: pc(base.root + localTonic) };
      chordAt.set(sec.startBar + i, chord);
      scaleAt.set(
        sec.startBar + i,
        mode === 'minor' && chord.dominantFunction
          ? makeScale(localTonic, 'harmonicMinor')
          : makeScale(localTonic, mode === 'minor' ? 'minor' : 'major'),
      );
    }
  }

  const accompaniment: Accompaniment = buildAccompaniment(
    song.tracks.filter((t) => t.layer === 'bass' || t.layer === 'comp' || t.layer === 'pad')
      .map((t) => t.notes as NoteEvent[]),
  );

  const notes = mel.notes.slice().sort((a, b) => a.beat - b.beat);
  const pitches = new Set<number>();
  let lo = Infinity, hi = -Infinity;

  for (let i = 0; i < notes.length; i++) {
    const n = notes[i]!;
    m.notes++;
    pitches.add(n.midi);
    lo = Math.min(lo, n.midi); hi = Math.max(hi, n.midi);

    const bar = Math.floor(n.beat / beatsPerBar);
    const chord = chordAt.get(bar);
    const scale = scaleAt.get(bar);
    if (!chord || !scale) continue;

    const slot = Math.round((n.beat - bar * beatsPerBar) * SLOTS_PER_BEAT);
    const strength = metricStrength(slot, slotsPerBar);

    if (strength >= 2) {
      m.beatNotes++;
      if (chordPcsOf(chord).includes(pc(n.midi))) m.chordTonesOnBeat++;
    }

    const ctx: NoteContext = {
      candidate: n.midi,
      chord, scale, mode, tonic,
      strength,
      duration: n.duration,
      beat: n.beat,
      accompaniment,
      ...(i >= 1 ? { prev: notes[i - 1]!.midi, prevChord: chordAt.get(Math.floor(notes[i - 1]!.beat / beatsPerBar)) } : {}),
      ...(i >= 2 ? { prevPrev: notes[i - 2]!.midi } : {}),
    };
    for (const id of violationsOf(ctx)) m.violations[id] = (m.violations[id] ?? 0) + 1;

    if (i >= 1) {
      m.intervals++;
      if (Math.abs(n.midi - notes[i - 1]!.midi) <= 2 && n.midi !== notes[i - 1]!.midi) m.steps++;
    }
  }
  m.distinctPitches += pitches.size;
  if (Number.isFinite(lo)) m.range += hi - lo;
}

function chordPcsOf(chord: Chord): number[] {
  // Local copy to avoid importing the whole chord module surface.
  const INTERVALS: Record<string, number[]> = {
    maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8],
    maj6: [0, 4, 7, 9], min6: [0, 3, 7, 9], dom7: [0, 4, 7, 10], min7: [0, 3, 7, 10],
    maj7: [0, 4, 7, 11], dim7: [0, 3, 6, 9], halfdim7: [0, 3, 6, 10], minmaj7: [0, 3, 7, 11],
    sus4: [0, 5, 7], sus2: [0, 2, 7], dom9: [0, 4, 7, 10, 14], dom7b9: [0, 4, 7, 10, 13],
  };
  return (INTERVALS[chord.quality] ?? [0, 4, 7]).map((i) => pc(chord.root + i));
}

function empty(): Measurement {
  return {
    violations: {}, notes: 0, intervals: 0, steps: 0, distinctPitches: 0,
    chordTonesOnBeat: 0, beatNotes: 0, range: 0, songs: 0,
  };
}

function main(): void {
  const count = Number(process.argv[2] ?? 40);
  const genre = process.argv[3];
  const results = new Map<string, Measurement>();

  for (const level of STRICTNESS_LEVELS) {
    const m = empty();
    for (let i = 0; i < count; i++) {
      measure(generateSong({
        seed: `strict-${i}`, strictness: level.id, ...(genre ? { genre } : {}),
      }), m);
    }
    results.set(level.id, m);
  }

  const per1000 = (m: Measurement, id: string) =>
    m.notes ? ((m.violations[id] ?? 0) / m.notes) * 1000 : 0;

  console.log(`\nSame ${count} ${genre ?? 'mixed-genre'} seeds regenerated at each strictness level.\n`);

  // --- Violations -------------------------------------------------------
  const header = STRICTNESS_LEVELS.map((l) => l.id.padStart(10)).join('');
  console.log('Rule violations per 1000 melody notes');
  console.log('  (! = forbidden at this level, ~ = penalised, blank = rule inactive)\n');
  console.log('  ' + ' '.repeat(28) + header);
  for (const rule of RULES) {
    const cells = STRICTNESS_LEVELS.map((l) => {
      const v = per1000(results.get(l.id)!, rule.id);
      const mark = l.level >= rule.vetoLevel ? '!' : l.level >= rule.minLevel ? '~' : ' ';
      return `${(v === 0 ? '·' : v.toFixed(1)).padStart(8)}${mark} `;
    }).join('');
    console.log(`  ${rule.id.padEnd(28)}${cells}`);
  }

  const totals = STRICTNESS_LEVELS.map((l) => {
    const m = results.get(l.id)!;
    const total = Object.values(m.violations).reduce((a, b) => a + b, 0);
    return `${((total / Math.max(1, m.notes)) * 1000).toFixed(1).padStart(8)}  `;
  }).join('');
  console.log(`  ${'ALL RULES'.padEnd(28)}${totals}`);

  // --- Cost -------------------------------------------------------------
  console.log('\nMusical cost of the filtering');
  const row = (label: string, fn: (m: Measurement) => string) =>
    console.log(`  ${label.padEnd(28)}${STRICTNESS_LEVELS.map((l) => `${fn(results.get(l.id)!).padStart(8)}  `).join('')}`);

  row('stepwise motion %', (m) => ((m.steps / Math.max(1, m.intervals)) * 100).toFixed(1));
  row('chord tone on beat %', (m) => ((m.chordTonesOnBeat / Math.max(1, m.beatNotes)) * 100).toFixed(1));
  row('distinct pitches / song', (m) => (m.distinctPitches / Math.max(1, m.songs)).toFixed(1));
  row('melodic range (semitones)', (m) => (m.range / Math.max(1, m.songs)).toFixed(1));
  row('notes / song', (m) => (m.notes / Math.max(1, m.songs)).toFixed(0));
  console.log();
}

main();
