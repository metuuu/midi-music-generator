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
import { chordPcs } from '../core/chord.js';
import { voiceChord } from '../core/voicing.js';
import type { Midi } from '../core/pitch.js';
import { clampToRange, nearestPc, pc } from '../core/pitch.js';
import type { Rng } from '../core/rng.js';
import type { DrumEvent, DrumVoice, NoteEvent } from '../core/types.js';
import { scaleStepsBetween, stepInScale, type Scale } from '../core/scale.js';
import { buildFill, DEFAULT_FILLS, landing, type FillPalette } from './fills.js';
import { IDIOMS, type IdiomProfile } from '../style/instruments.js';
import type { BassPattern, CompPattern, DrumPattern, Style } from '../style/types.js';
import { SLOTS_PER_BEAT } from './rhythm.js';

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
  return pattern.sustain ? mergeHeld(out) : out;
}

/**
 * Join notes that are the same pitch and meet end to end into one long note.
 *
 * The difference between a pedal and a pulse, and audible long before it is
 * theoretical: at 60 BPM a re-articulated whole note is an attack every four
 * seconds, which the ear reads as a part being played. Held through, the same
 * pitches are one sustained tone that the rest of the arrangement moves over.
 *
 * Grouped by pitch before merging, because the parts that most want this are
 * chordal: a four-note voicing repeated bar after bar is four independent held
 * tones, and a scan that only ever compared each note to the one before it in
 * time would never find its own pitch again through the three notes stacked on
 * top of it.
 *
 * The tolerance is a sixteenth of a beat, so a pattern that leaves a deliberate
 * breath — a `dur` short of the full bar — keeps it.
 */
function mergeHeld(notes: NoteEvent[]): NoteEvent[] {
  const byPitch = new Map<Midi, NoteEvent[]>();
  for (const n of notes) {
    const arr = byPitch.get(n.midi);
    if (arr) arr.push({ ...n });
    else byPitch.set(n.midi, [{ ...n }]);
  }

  const out: NoteEvent[] = [];
  for (const voice of byPitch.values()) {
    voice.sort((a, b) => a.beat - b.beat);
    let held: NoteEvent | undefined;
    for (const note of voice) {
      if (held && Math.abs(held.beat + held.duration - note.beat) < 0.0625) {
        held.duration = note.beat + note.duration - held.beat;
        continue;
      }
      out.push(note);
      held = note;
    }
  }
  return out.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
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
  /** Register discipline from the arranger — see `generate/arrange.ts`. */
  limits: { ceiling?: Midi; clarity?: number } = {},
): NoteEvent[] {
  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const out: NoteEvent[] = [];
  // With a ceiling in force the window is anchored to it rather than to the
  // instrument's centre: a comp given five semitones to voice a seventh chord
  // in has no choice but to make a cluster, so it is given a proper octave and
  // a bit underneath the tune instead.
  const hi = limits.ceiling ?? centre + 12;
  const lo = limits.ceiling !== undefined ? Math.min(centre - 10, hi - 17) : centre - 10;
  let previous: Midi[] | undefined;
  // Runs across barlines on purpose — see `arpeggio` in style/types.ts.
  let step = 0;

  for (let bar = 0; bar < chords.length; bar++) {
    const chord = chords[bar]!;
    const voicing = voiceChord(chord, {
      voices: pattern.voices,
      centre,
      lo,
      hi,
      style: pattern.voicing ?? 'tertian',
      ...(limits.clarity !== undefined ? { clarity: limits.clarity } : {}),
      ...(scaleFor ? { scale: scaleFor(chord) } : {}),
      ...(previous ? { previous } : {}),
    });
    previous = voicing;
    const barStart = startBeat + bar * beatsPerBar;

    for (const hit of pattern.hits) {
      const sounding = pattern.arpeggio ? [voicing[step++ % voicing.length]!] : voicing;
      for (const midi of sounding) {
        out.push({
          beat: barStart + hit.at / SLOTS_PER_BEAT,
          duration: hit.dur / SLOTS_PER_BEAT,
          midi,
          velocity: (hit.vel ?? 0.65) * rng.float(0.92, 1.0),
        });
      }
    }
  }
  return pattern.sustain ? mergeHeld(out) : out;
}

/**
 * Sustained chords, merged across repeated harmony so the pad breathes.
 *
 * Voiced `spread` rather than close. A pad in close position occupies the same
 * few semitones as the comp playing the same chord, and the two stop reading as
 * two layers — the pad becomes thickness rather than colour. Opening the stack
 * out is what gives it its own place in the texture.
 */
export function generatePad(
  ctx: PartContext,
  centre: Midi,
  voices = 4,
  limits: { ceiling?: Midi; clarity?: number } = {},
): NoteEvent[] {
  const { chords, beatsPerBar, startBeat } = ctx;
  const out: NoteEvent[] = [];
  const hi = limits.ceiling ?? centre + 14;
  const lo = limits.ceiling !== undefined ? Math.min(centre - 10, hi - 22) : centre - 10;
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
      voices, centre, lo, hi, style: 'spread',
      ...(limits.clarity !== undefined ? { clarity: limits.clarity } : {}),
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
 * Brass — punctuation, not a third melody.
 *
 * What was here fired a three-note stab on the downbeat of alternate bars
 * behind a coin flip, plus one pickup in the last bar. Measured across 68 songs
 * that carried the layer: **every one of its 1325 notes was exactly half a beat
 * long**, 72% landed on the downbeat and 25% on beat four, and **79% sounded on
 * top of the melody** rather than around it. A brass section that only ever
 * plays eighth-note stabs, always in the same two places, always over the tune,
 * is a sample library demonstrating itself.
 *
 * Brass in this music does three things, and the choice between them belongs to
 * what the melody is doing at that moment:
 *
 *  - **Stabs** in the tune's gaps. Short, often off the beat, answering. This
 *    is the call-and-response gesture the layer exists for, and it has to be in
 *    a *gap* — a stab over a sustained vocal line is a collision, not an answer.
 *  - **Swells** underneath a held note. Where the tune stops moving, the brass
 *    is what stops the arrangement going with it: a long chord that grows under
 *    a held melody note is the oldest trick in dance-band scoring.
 *  - **Punctuation** into the next section, which is the one gesture the old
 *    code had, and it kept it.
 *
 * And, most of the time, nothing at all. A brass section that plays in every
 * bar has no punctuation left to give.
 */
export function generateBrass(
  ctx: PartContext,
  centre: Midi,
  limits: { ceiling?: Midi; clarity?: number } = {},
  opts: {
    /** What the tune is doing. Brass works around it, so it has to know. */
    melody?: readonly NoteEvent[];
    /** How busy this section is; drives how often the brass speaks at all. */
    intensity?: number;
  } = {},
): NoteEvent[] {
  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const out: NoteEvent[] = [];
  const hi = limits.ceiling ?? centre + 12;
  const lo = limits.ceiling !== undefined ? Math.min(centre - 9, hi - 15) : centre - 9;
  const melody = (opts.melody ?? []).slice().sort((a, b) => a.beat - b.beat);
  const intensity = opts.intensity ?? 0.9;
  let previous: Midi[] | undefined;

  for (let bar = 0; bar < chords.length; bar++) {
    const chord = chords[bar]!;
    const barStart = startBeat + bar * beatsPerBar;
    const barEnd = barStart + beatsPerBar;
    const isLast = bar === chords.length - 1;

    const voicing = voiceChord(chord, {
      voices: 3, centre, lo, hi,
      ...(limits.clarity !== undefined ? { clarity: limits.clarity } : {}),
      ...(previous ? { previous } : {}),
    });
    previous = voicing;

    const sound = (beat: number, duration: number, velocity: number) => {
      for (const midi of voicing) out.push({ beat, duration, midi, velocity });
    };

    if (isLast) {
      // Punctuation into whatever comes next — the one gesture worth keeping.
      sound(barStart + beatsPerBar - 1, 0.75, 0.7 * intensity);
      continue;
    }

    // Where is the tune resting, and where is it holding?
    const inBar = melody.filter((n) => n.beat < barEnd && n.beat + n.duration > barStart);
    const held = inBar.find((n) => n.duration >= 2 && n.beat <= barStart + 1);

    if (held && rng.chance(0.45 * intensity)) {
      /**
       * A swell under a held note. Length follows the note it is supporting,
       * so the brass arrives with the tune's long note and leaves with it —
       * which is what makes it read as support rather than as a second part.
       */
      const from = Math.max(barStart, held.beat);
      const length = Math.min(held.beat + held.duration, barEnd) - from;
      if (length >= 1) {
        sound(from, length * 0.94, 0.5 * intensity);
        continue;
      }
    }

    // Otherwise look for a hole to answer into.
    let cursor = barStart;
    let gapStart = barStart;
    let gapLen = 0;
    for (const n of inBar) {
      const gap = n.beat - cursor;
      if (gap > gapLen) { gapLen = gap; gapStart = cursor; }
      cursor = Math.max(cursor, n.beat + n.duration);
    }
    if (barEnd - cursor > gapLen) { gapLen = barEnd - cursor; gapStart = cursor; }

    if (gapLen < 0.75 || !rng.chance(0.4 * intensity)) continue;

    /**
     * Place the stab off the beat where there is room for it. A brass hit on
     * the downbeat doubles the accent the rhythm section is already making; one
     * an eighth after it is the thing that makes a chart sound scored.
     */
    const onBarline = Math.abs(gapStart - barStart) < 1e-6;
    const offset = gapLen >= 1.5
      ? rng.weighted([[0.5, 5], [1.5, 3], [1, 2], [0, onBarline ? 0 : 3]] as const)
      // A short hole still gets pushed off the barline: a brass hit on the
      // downbeat only thickens the accent the rhythm section already made,
      // where one an eighth later is what makes a chart sound scored.
      : rng.weighted([[0.5, onBarline ? 5 : 2], [0, onBarline ? 1 : 4]] as const);
    const at = gapStart + Math.min(offset, Math.max(0, gapLen - 0.5));
    const duration = rng.weighted([[0.5, 4], [0.25, 3], [0.75, 2], [1.5, 1]] as const);
    sound(at, Math.min(duration, barEnd - at), 0.72 * intensity);
  }
  return out;
}

/**
 * Counter-melody — the line that answers the tune.
 *
 * Call and response between the singer and the accordion (or the sax, or the
 * vibraphone) is a signature of every arrangement style here, and the reason it
 * works is that the answer is *about* the call. What was here before was not:
 * it found a hole in the melody, started on the chord root nearest the
 * instrument's centre, and walked root–third–fifth. Every bar. The same figure
 * from the same starting note, with no memory across barlines and no
 * relationship to the phrase it was supposedly answering. It was decoration,
 * and the ear hears decoration as filler.
 *
 * Three things make it an answer instead:
 *
 *  - **Imitation.** The figure echoes the shape of the lead notes immediately
 *    before the gap, held as scale steps so it transposes onto the current
 *    chord. Sometimes inverted, which is a real device and has the useful side
 *    effect of guaranteeing contrary motion.
 *  - **Continuity.** The line carries across barlines instead of resetting to
 *    the instrument's centre, so it reads as one part rather than as a series
 *    of unrelated fills.
 *  - **Independence where it overlaps.** When the answer does sound against a
 *    held melody note — rare, since it lives in the gaps — it must not double
 *    it at the unison or octave, and must not move in parallel fifths with it.
 *    Two lines moving together are one line.
 *
 * How fast the answer moves is the style's business. An eighth-note figure is
 * right for anything danced to and absurd in ambient, where the holes are bars
 * long and the answer should be a bell, not a run. Everything is expressed in
 * multiples of `counterSpacing` so both come out of the same code.
 */
export function generateCounter(
  ctx: PartContext,
  melody: NoteEvent[],
  centre: Midi,
  opts: {
    /** Where this line may sit. Kept under the lead by the arranger. */
    range?: [Midi, Midi];
    /** The answering instrument's figuration. See `style/instruments.ts`. */
    idiom?: IdiomProfile;
    /** Needed to transpose an imitated shape onto the current harmony. */
    scaleFor?: (chord: Chord) => Scale;
  } = {},
): NoteEvent[] {
  const { chords, beatsPerBar, startBeat, rng, style } = ctx;
  const out: NoteEvent[] = [];
  const [lo, hi] = opts.range ?? [centre - 9, centre + 9];
  const spacing = style.counterSpacing ?? 0.5;
  const idiom = opts.idiom ?? IDIOMS.vocal;

  const sortedMelody = melody.slice().sort((a, b) => a.beat - b.beat);
  /** The melody note sounding at a given beat, if any. */
  const melodyAt = (beat: number): NoteEvent | undefined =>
    sortedMelody.find((n) => n.beat <= beat + 1e-6 && n.beat + n.duration > beat + 1e-6);

  // Carried across bars: this is what makes it a part rather than a series of
  // fills, and it costs one variable.
  let prev: Midi | undefined;
  let prevMelody: Midi | undefined;

  for (let bar = 0; bar < chords.length; bar++) {
    const barStart = startBeat + bar * beatsPerBar;
    const barEnd = barStart + beatsPerBar;
    const inBar = sortedMelody.filter((n) => n.beat >= barStart && n.beat < barEnd);

    // Find the largest silent window in this bar.
    let cursor = barStart;
    let bestStart = barStart;
    let bestLen = 0;
    for (const n of inBar) {
      const gap = n.beat - cursor;
      if (gap > bestLen) { bestLen = gap; bestStart = cursor; }
      cursor = Math.max(cursor, n.beat + n.duration);
    }
    if (barEnd - cursor > bestLen) { bestLen = barEnd - cursor; bestStart = cursor; }

    // Two notes' worth of room is the price of admission, whatever a note costs
    // in this style.
    if (bestLen < spacing * 2 || !rng.chance(0.45)) continue;

    const chord = chords[bar]!;
    const scale = opts.scaleFor?.(chord);
    const tones = chordPcs(chord);
    /**
     * How many notes the answer gets, and how long they last.
     *
     * Dividing the gap by *two* note-lengths gave a single note in almost every
     * hole, and a single note cannot be an answer — there is no shape to it, so
     * the imitation below had nothing to work with and never fired. The right
     * count is however many fit, given that each occupies nine tenths of its
     * slot and only the last one needs room to finish.
     */
    const count = Math.min(4, Math.max(1, Math.floor(bestLen / spacing + 0.1)));
    /**
     * When only one note fits, hold it.
     *
     * A lone short note dropped into a hole is a blip — the ear files it as a
     * stray attack rather than as a reply. Sustained across the gap it becomes
     * a countersubject, which is what a second part holding one note under a
     * moving line has always been.
     */
    const held = count === 1 ? Math.max(spacing * 0.9, bestLen * 0.8) : spacing * 0.9;

    /**
     * The shape to answer with.
     *
     * Taken from the lead notes immediately before the gap — literally the
     * phrase being answered — as scale steps, and inverted about half the time.
     * An inverted answer is the oldest trick in counterpoint and it is worth the
     * line of code: it makes the two parts move apart, which is the only way the
     * ear keeps hearing two of them.
     */
    const call = sortedMelody.filter((n) => n.beat < bestStart && n.beat >= bestStart - beatsPerBar * 2);
    const shape: number[] = [];
    if (scale && call.length >= 2) {
      const invert = rng.chance(0.5) ? -1 : 1;
      for (let i = Math.max(1, call.length - count); i < call.length; i++) {
        shape.push(scaleStepsBetween(scale, call[i - 1]!.midi, call[i]!.midi) * invert);
      }
    }

    // Start on a chord tone, near where the line last was rather than near the
    // instrument's centre.
    const anchor = prev ?? centre;
    let midi = clampToRange(nearestPc(tones[0]!, anchor), lo, hi);

    for (let i = 0; i < count; i++) {
      const beat = bestStart + i * spacing;
      if (i > 0) {
        const step = shape[i - 1];
        midi = step !== undefined && scale
          ? clampToRange(stepInScale(scale, midi, step), lo, hi)
          // No call to answer: fall back to the chord, moving as little as
          // possible, and arpeggiate only as far as the instrument wants to.
          : clampToRange(nearestPc(tones[(i + 1) % tones.length]!, midi), lo, hi);
      }
      midi = avoidClash(midi, melodyAt(beat)?.midi, prevMelody, prev, tones, [lo, hi], idiom);
      out.push({
        beat,
        duration: held,
        midi,
        velocity: 0.5 * rng.float(0.9, 1.05),
      });
      prevMelody = melodyAt(beat)?.midi ?? prevMelody;
      prev = midi;
    }
  }
  return out.filter((n) => n.beat + n.duration <= startBeat + chords.length * beatsPerBar);
}

/**
 * Keep the answer independent of the tune where the two overlap.
 *
 * Only three faults matter here, and all three are ways of stopping the ear
 * hearing two parts: doubling at the unison or octave, and moving in parallel
 * fifths or octaves. The repair is a step through the chord rather than a
 * semitone nudge, because a counter-line is chord-based and a chromatic
 * correction would read as a wrong note rather than as a different one.
 */
function avoidClash(
  midi: Midi,
  melodyNow: Midi | undefined,
  melodyPrev: Midi | undefined,
  prev: Midi | undefined,
  tones: readonly number[],
  [lo, hi]: [Midi, Midi],
  idiom: IdiomProfile,
): Midi {
  if (melodyNow === undefined) return midi;

  const bad = (cand: Midi): boolean => {
    const gap = Math.abs(cand - melodyNow);
    if (gap % 12 === 0) return true;                       // unison or octave
    if (cand > melodyNow) return true;                     // the answer stays under the tune
    if (prev !== undefined && melodyPrev !== undefined) {
      const now = ((melodyNow - cand) % 12 + 12) % 12;
      const before = ((melodyPrev - prev) % 12 + 12) % 12;
      const perfect = (n: number) => n === 0 || n === 7;
      const moved = cand !== prev && melodyNow !== melodyPrev;
      if (moved && perfect(now) && now === before
        && Math.sign(cand - prev) === Math.sign(melodyNow - melodyPrev)) return true;
    }
    return false;
  };

  if (!bad(midi)) return midi;
  // Try the chord tones either side, nearest first. A mallet will happily take
  // the one further away; a wind instrument would rather stay put.
  const spread = idiom.arpeggio > 0.5 ? 8 : 5;
  for (let d = 1; d <= spread; d++) {
    for (const dir of [-1, 1]) {
      const cand = midi + d * dir;
      if (cand < lo || cand > hi) continue;
      if (!tones.includes(((cand % 12) + 12) % 12)) continue;
      if (!bad(cand)) return cand;
    }
  }
  return midi;
}

export function generateDrums(
  ctx: PartContext,
  pattern: DrumPattern,
  opts: {
    fillAtEnd: boolean;
    intensity: number;
    /** How hard the section this fill delivers plays. See `generate/fills.ts`. */
    arrival?: number;
    palette?: FillPalette;
  },
): DrumEvent[] {
  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const slotsPerBar = beatsPerBar * SLOTS_PER_BEAT;
  const out: DrumEvent[] = [];

  for (let bar = 0; bar < chords.length; bar++) {
    const barStart = startBeat + bar * beatsPerBar;
    const isLastBar = bar === chords.length - 1;
    const arrival = opts.arrival ?? opts.intensity;

    const fill = opts.fillAtEnd && isLastBar
      ? buildFill({
        barStart, beatsPerBar, slotsPerBar, rng,
        intensity: opts.intensity,
        arrival,
        palette: opts.palette ?? DEFAULT_FILLS,
      })
      : undefined;

    for (const [voice, slots] of Object.entries(pattern.voices) as [DrumVoice, number[]][]) {
      for (const slot of slots) {
        // Clear exactly as much of the bar as the fill actually occupies —
        // which used to be hardcoded to half a bar whatever was played there.
        // The kick keeps going: a drummer's right foot does not stop for a fill.
        if (fill && slot >= fill.fromSlot && voice !== 'bd') continue;
        const strength = slot === 0 ? 1 : slot % SLOTS_PER_BEAT === 0 ? 0.85 : 0.68;
        out.push({
          beat: barStart + slot / SLOTS_PER_BEAT,
          voice,
          velocity: Math.min(1, strength * opts.intensity * rng.float(0.92, 1.05)),
        });
      }
    }

    if (fill) {
      out.push(...fill.events);
      out.push(landing(barStart + beatsPerBar, arrival));
    }
  }
  return out;
}
