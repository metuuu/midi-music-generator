/**
 * Accompaniment generation: bass, chordal comping, pads, brass, counter-melody
 * and drums.
 *
 * These are pattern-driven rather than search-driven — which is correct for the
 * genre. A dance band's rhythm section plays a figure and keeps playing it; the
 * interest comes from the harmony moving underneath it and from the
 * arrangement adding and removing layers. The one place real decision-making
 * happens is voice leading in the comp, and approach notes in the bass.
 */

import type { Chord } from '../core/chord.js';
import { chordPcs, voiceChord } from '../core/chord.js';
import type { Midi } from '../core/pitch.js';
import { clampToRange, nearestPc, pc } from '../core/pitch.js';
import type { Rng } from '../core/rng.js';
import type { DrumEvent, DrumVoice, NoteEvent } from '../core/types.js';
import type { Scale } from '../core/scale.js';
import type { BassPattern, CompPattern, DrumPattern, Style } from '../style/types.js';
import { SLOTS_PER_BEAT } from './melody.js';

export interface PartContext {
  chords: Chord[];
  beatsPerBar: number;
  startBeat: number;
  rng: Rng;
  style: Style;
}

const BASS_RANGE: [Midi, Midi] = [28, 52];

export function generateBass(ctx: PartContext, pattern: BassPattern): NoteEvent[] {
  if (pattern.walking) return generateWalkingBass(ctx);
  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const out: NoteEvent[] = [];

  for (let bar = 0; bar < chords.length; bar++) {
    const chord = chords[bar]!;
    const next = chords[bar + 1] ?? chords[0]!;
    const pcs = chordPcs(chord);
    const rootMidi = clampToRange(nearestPc(chord.root, 40), BASS_RANGE[0], BASS_RANGE[1]);
    const barStart = startBeat + bar * beatsPerBar;

    for (const hit of pattern.hits) {
      let midi: Midi;
      switch (hit.tone) {
        case 'root':
          midi = rootMidi;
          break;
        case 'fifth':
          midi = nearestPc(pc(chord.root + 7), rootMidi + 2);
          break;
        case 'third':
          midi = nearestPc(pcs[1] ?? chord.root, rootMidi + 2);
          break;
        case 'seventh':
          midi = nearestPc(pcs[3] ?? pc(chord.root + 10), rootMidi + 2);
          break;
        case 'octave':
          midi = rootMidi + 12;
          break;
        case 'approach':
          midi = approachNote(rootMidi, next.root, rng);
          break;
      }
      midi = clampToRange(midi, BASS_RANGE[0], BASS_RANGE[1]);
      out.push({
        beat: barStart + hit.at / SLOTS_PER_BEAT,
        duration: hit.dur / SLOTS_PER_BEAT,
        midi,
        velocity: (hit.vel ?? 0.85) * rng.float(0.94, 1.0),
      });
    }
  }
  return out;
}

/**
 * A true walking bass line.
 *
 * The fixed-degree patterns cannot produce one: a walking line is defined by
 * *connection*, not by which chord tone lands on which beat. The rules a bass
 * player actually follows are —
 *
 *  - beat 1 is the chord root, so the harmony is unambiguous,
 *  - the last beat approaches the next root by a semitone (or a fifth above it),
 *  - and the beats in between move mostly by step toward that approach note,
 *    preferring chord tones but taking scale tones freely.
 *
 * The result is a line that walks somewhere rather than outlining a chord in
 * place, which is the whole point.
 */
function generateWalkingBass(ctx: PartContext): NoteEvent[] {
  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const out: NoteEvent[] = [];
  let previous: Midi | undefined;

  for (let bar = 0; bar < chords.length; bar++) {
    const chord = chords[bar]!;
    const next = chords[bar + 1] ?? chords[0]!;
    const barStart = startBeat + bar * beatsPerBar;
    const tones = chordPcs(chord);

    // Beat 1: the root, kept near where the previous bar left off.
    const root = clampToRange(
      previous === undefined ? nearestPc(chord.root, 40) : nearestPc(chord.root, previous),
      BASS_RANGE[0], BASS_RANGE[1],
    );
    const beats = Math.max(1, Math.round(beatsPerBar));
    const line: Midi[] = [root];

    // Final beat: approach the next root, usually chromatically from below.
    const nextRoot = nearestPc(next.root, root);
    const approach = clampToRange(
      rng.weighted([
        [nextRoot - 1, 5],
        [nextRoot + 1, 3],
        [nearestPc(pc(next.root + 7), root), 2],
      ] as const),
      BASS_RANGE[0], BASS_RANGE[1],
    );

    // Middle beats: step from the root toward the approach note.
    for (let b = 1; b < beats - 1; b++) {
      const from = line[line.length - 1]!;
      const remaining = beats - 1 - b;
      const gap = approach - from;
      const ideal = from + Math.round(gap / (remaining + 1));
      const candidates: (readonly [Midi, number])[] = [];
      for (let semi = -4; semi <= 4; semi++) {
        const cand = from + semi;
        if (cand < BASS_RANGE[0] || cand > BASS_RANGE[1] || cand === from) continue;
        const stepSize = Math.abs(semi);
        // A walking line walks: the overwhelming majority of its motion is by
        // semitone or tone, with the one real leap saved for the arrival on the
        // next root. Pulling too hard toward the target turns every beat into a
        // leap, so the target is a lean rather than a destination.
        let w = stepSize <= 2 ? 7 : stepSize === 3 ? 1.2 : stepSize === 4 ? 0.6 : 0.15;
        w *= Math.exp(-Math.abs(cand - ideal) / 5);
        if (tones.includes(pc(cand))) w *= 2.2;
        candidates.push([cand, w]);
      }
      line.push(candidates.length ? rng.weighted(candidates) : from);
    }
    if (beats > 1) line.push(approach);

    for (let b = 0; b < line.length; b++) {
      out.push({
        beat: barStart + b,
        duration: 0.92,
        midi: line[b]!,
        velocity: (b === 0 ? 0.95 : 0.82) * rng.float(0.95, 1.02),
      });
    }
    previous = line[line.length - 1];
  }
  return out;
}

/**
 * Walk into the next chord's root from a semitone or whole tone away.
 * The chromatic approach from below is the strongest and most common.
 */
function approachNote(from: Midi, nextRoot: number, rng: Rng): Midi {
  const target = nearestPc(nextRoot, from);
  const options: (readonly [Midi, number])[] = [
    [target - 1, 4],
    [target + 1, 2],
    [target - 2, 2],
    [nearestPc(pc(nextRoot + 7), from), 2],
  ];
  return rng.weighted(options);
}

export function generateComp(
  ctx: PartContext,
  pattern: CompPattern,
  centre: Midi,
  /** Needed for quartal voicings, which draw on the scale rather than the chord. */
  scaleFor?: (chord: Chord) => Scale,
): NoteEvent[] {
  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const out: NoteEvent[] = [];
  const lo = centre - 10;
  const hi = centre + 12;
  let previous: Midi[] | undefined;

  for (let bar = 0; bar < chords.length; bar++) {
    const chord = chords[bar]!;
    const voicing = voiceChord(chord, {
      voices: pattern.voices,
      centre,
      lo,
      hi,
      style: pattern.voicing ?? 'tertian',
      ...(scaleFor ? { scale: scaleFor(chord) } : {}),
      ...(previous ? { previous } : {}),
    });
    previous = voicing;
    const barStart = startBeat + bar * beatsPerBar;

    for (const hit of pattern.hits) {
      for (const midi of voicing) {
        out.push({
          beat: barStart + hit.at / SLOTS_PER_BEAT,
          duration: hit.dur / SLOTS_PER_BEAT,
          midi,
          velocity: (hit.vel ?? 0.65) * rng.float(0.92, 1.0),
        });
      }
    }
  }
  return out;
}

/** Sustained chords, merged across repeated harmony so the pad breathes. */
export function generatePad(ctx: PartContext, centre: Midi, voices = 4): NoteEvent[] {
  const { chords, beatsPerBar, startBeat } = ctx;
  const out: NoteEvent[] = [];
  const lo = centre - 8;
  const hi = centre + 14;
  let previous: Midi[] | undefined;

  let bar = 0;
  while (bar < chords.length) {
    const chord = chords[bar]!;
    let span = 1;
    while (
      bar + span < chords.length &&
      chords[bar + span]!.label === chord.label
    ) span++;

    const voicing = voiceChord(chord, {
      voices, centre, lo, hi,
      ...(previous ? { previous } : {}),
    });
    previous = voicing;

    for (const midi of voicing) {
      out.push({
        beat: startBeat + bar * beatsPerBar,
        duration: span * beatsPerBar - 0.05,
        midi,
        velocity: 0.42,
      });
    }
    bar += span;
  }
  return out;
}

/**
 * Brass punctuation: short stabs on the downbeat of alternate bars, plus a
 * pickup stab into section-ending bars. Deliberately sparse — brass in this
 * music answers the tune, it does not compete with it.
 */
export function generateBrass(ctx: PartContext, centre: Midi): NoteEvent[] {
  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const out: NoteEvent[] = [];
  let previous: Midi[] | undefined;

  for (let bar = 0; bar < chords.length; bar++) {
    const chord = chords[bar]!;
    const voicing = voiceChord(chord, {
      voices: 3, centre, lo: centre - 9, hi: centre + 12,
      ...(previous ? { previous } : {}),
    });
    previous = voicing;
    const barStart = startBeat + bar * beatsPerBar;
    const isEven = bar % 2 === 0;
    const isLast = bar === chords.length - 1;

    if (isEven && rng.chance(0.55)) {
      for (const midi of voicing) {
        out.push({ beat: barStart, duration: 0.5, midi, velocity: 0.72 });
      }
    }
    if (isLast) {
      // Pickup into whatever comes next.
      const at = barStart + beatsPerBar - 1;
      for (const midi of voicing) {
        out.push({ beat: at, duration: 0.5, midi, velocity: 0.66 });
      }
    }
  }
  return out;
}

/**
 * Counter-melody: short answering figures placed in the melody's gaps.
 *
 * Call and response between the singer and the accordion (or sax) is a
 * signature of the arrangement style, so rather than inventing an independent
 * line we look for holes — rests, or notes long enough to leave room — and
 * answer into them with chord tones.
 */
export function generateCounter(
  ctx: PartContext,
  melody: NoteEvent[],
  centre: Midi,
): NoteEvent[] {
  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const out: NoteEvent[] = [];
  const lo = centre - 9;
  const hi = centre + 9;

  for (let bar = 0; bar < chords.length; bar++) {
    const barStart = startBeat + bar * beatsPerBar;
    const barEnd = barStart + beatsPerBar;
    const inBar = melody.filter((n) => n.beat >= barStart && n.beat < barEnd);

    // Find the largest silent window in this bar.
    let cursor = barStart;
    let bestStart = barStart;
    let bestLen = 0;
    for (const n of inBar.slice().sort((a, b) => a.beat - b.beat)) {
      const gap = n.beat - cursor;
      if (gap > bestLen) { bestLen = gap; bestStart = cursor; }
      cursor = Math.max(cursor, n.beat + n.duration);
    }
    if (barEnd - cursor > bestLen) { bestLen = barEnd - cursor; bestStart = cursor; }

    if (bestLen < 1 || !rng.chance(0.45)) continue;

    const chord = chords[bar]!;
    const tones = chordPcs(chord);
    const count = Math.min(3, Math.max(1, Math.floor(bestLen)));
    let prev = clampToRange(nearestPc(tones[0]!, centre), lo, hi);
    for (let i = 0; i < count; i++) {
      const target = tones[(i + 1) % tones.length]!;
      const midi = clampToRange(nearestPc(target, prev), lo, hi);
      prev = midi;
      out.push({
        beat: bestStart + i * 0.5,
        duration: 0.45,
        midi,
        velocity: 0.5 * rng.float(0.9, 1.05),
      });
    }
  }
  return out.filter((n) => n.beat + n.duration <= startBeat + chords.length * beatsPerBar);
}

export function generateDrums(
  ctx: PartContext,
  pattern: DrumPattern,
  opts: { fillAtEnd: boolean; intensity: number },
): DrumEvent[] {
  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const slotsPerBar = beatsPerBar * SLOTS_PER_BEAT;
  const out: DrumEvent[] = [];

  for (let bar = 0; bar < chords.length; bar++) {
    const barStart = startBeat + bar * beatsPerBar;
    const isLastBar = bar === chords.length - 1;
    const doFill = opts.fillAtEnd && isLastBar;

    for (const [voice, slots] of Object.entries(pattern.voices) as [DrumVoice, number[]][]) {
      for (const slot of slots) {
        // Leave the back half of the bar clear for the fill.
        if (doFill && slot >= slotsPerBar / 2 && voice !== 'bd') continue;
        const strength = slot === 0 ? 1 : slot % SLOTS_PER_BEAT === 0 ? 0.85 : 0.68;
        out.push({
          beat: barStart + slot / SLOTS_PER_BEAT,
          voice,
          velocity: Math.min(1, strength * opts.intensity * rng.float(0.92, 1.05)),
        });
      }
    }

    if (doFill) {
      const toms: DrumVoice[] = ['ht', 'mt', 'lt'];
      const start = slotsPerBar / 2;
      const step = rng.pick([2, 2, 4]);
      let i = 0;
      for (let slot = start; slot < slotsPerBar; slot += step) {
        out.push({
          beat: barStart + slot / SLOTS_PER_BEAT,
          voice: toms[Math.min(i, toms.length - 1)]!,
          velocity: Math.min(1, (0.7 + i * 0.06) * opts.intensity),
        });
        i++;
      }
      out.push({ beat: barStart + beatsPerBar, voice: 'cr', velocity: 0.85 * opts.intensity });
    }
  }
  return out;
}
