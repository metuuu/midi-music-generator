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
import { IDIOMS, type HandSpec, type IdiomProfile } from '../style/instruments.js';
import type {
  BassPattern, CompHit, CompPattern, DrumPattern, LeftHandMode, Style,
} from '../style/types.js';
import { metricStrength, SLOTS_PER_BEAT } from './rhythm.js';

export interface PartContext {
  chords: Chord[];
  beatsPerBar: number;
  startBeat: number;
  rng: Rng;
  style: Style;
}

const BASS_RANGE: [Midi, Midi] = [28, 52];

/**
 * Every slot a repeating figure lands on across a whole section, paired with the
 * bar it lands in.
 *
 * One helper for all three pattern generators, because "walk the section in
 * figures rather than in bars" is the same sentence in each of them and getting
 * it subtly different in three places is how a cycle ends up drifting in the
 * bass and not in the drums.
 *
 * The bar is carried alongside the slot because the harmony is still bar-shaped
 * — see `Cycle` in `style/types.ts`. A figure that straddles a barline takes the
 * chord it lands in, one hit at a time, which is what a player reading a chart
 * does and is the whole reason an ostinato over moving changes sounds like
 * music rather than like a sequencer left running.
 *
 * The last partial cycle is played rather than dropped. A three-beat figure in a
 * four-bar phrase does not stop five beats early because the maths ran out; it
 * plays until the section does, and the tail lands wherever the drift put it.
 */
function* cycleHits<T extends { at: number }>(
  hits: readonly T[],
  opts: { cycle: number; bars: number; slotsPerBar: number },
): Generator<{ hit: T; bar: number; slot: number }> {
  const total = opts.bars * opts.slotsPerBar;
  const cycle = Math.max(1, Math.round(opts.cycle));
  for (let base = 0; base < total; base += cycle) {
    for (const hit of hits) {
      const slot = base + hit.at;
      if (slot >= total) continue;
      yield { hit, bar: Math.floor(slot / opts.slotsPerBar), slot };
    }
  }
}

export function generateBass(ctx: PartContext, pattern: BassPattern): NoteEvent[] {
  if (pattern.walking) return generateWalkingBass(ctx);
  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const slotsPerBar = beatsPerBar * SLOTS_PER_BEAT;
  const out: NoteEvent[] = [];

  for (const { hit, bar, slot } of cycleHits(pattern.hits, {
    cycle: pattern.cycle ?? slotsPerBar, bars: chords.length, slotsPerBar,
  })) {
    const chord = chords[bar]!;
    const next = chords[bar + 1] ?? chords[0]!;
    const pcs = chordPcs(chord);
    const rootMidi = clampToRange(nearestPc(chord.root, 40), BASS_RANGE[0], BASS_RANGE[1]);

    {
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
        beat: startBeat + slot / SLOTS_PER_BEAT,
        duration: hit.dur / SLOTS_PER_BEAT,
        midi,
        velocity: (hit.vel ?? 0.85) * rng.float(0.94, 1.0),
      });
    }
  }
  out.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
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
  const slotsPerBar = beatsPerBar * SLOTS_PER_BEAT;
  const out: NoteEvent[] = [];
  // With a ceiling in force the window is anchored to it rather than to the
  // instrument's centre: a comp given five semitones to voice a seventh chord
  // in has no choice but to make a cluster, so it is given a proper octave and
  // a bit underneath the tune instead.
  const hi = limits.ceiling ?? centre + 12;
  const lo = limits.ceiling !== undefined ? Math.min(centre - 10, hi - 17) : centre - 10;
  // Runs across barlines on purpose — see `arpeggio` in style/types.ts.
  let step = 0;

  /**
   * Every bar's voicing, decided before a hit is placed.
   *
   * Voicings are led bar to bar — each one is chosen to move as little as
   * possible from the one before — and a cycle that straddles a barline needs
   * two of them in the same breath. Building the chain up front keeps the voice
   * leading a property of the *harmony*, where it belongs, rather than of the
   * order the figure happened to visit the bars in.
   */
  const voicings: Midi[][] = [];
  let previous: Midi[] | undefined;
  for (const chord of chords) {
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
    voicings.push(voicing);
    previous = voicing;
  }

  for (const { hit, bar, slot } of cycleHits(pattern.hits, {
    cycle: pattern.cycle ?? slotsPerBar, bars: chords.length, slotsPerBar,
  })) {
    const voicing = voicings[bar]!;
    const sounding = pattern.arpeggio ? [voicing[step++ % voicing.length]!] : voicing;
    for (const midi of sounding) {
      out.push({
        beat: startBeat + slot / SLOTS_PER_BEAT,
        duration: hit.dur / SLOTS_PER_BEAT,
        midi,
        velocity: (hit.vel ?? 0.65) * rng.float(0.92, 1.0),
      });
    }
  }
  out.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
  return pattern.sustain ? mergeHeld(out) : out;
}

/**
 * The other hand.
 *
 * Everything else in this file writes a part for a *player*. This writes one for
 * a **hand** — the left one, under a line the same person is playing with their
 * right — and that is the only structural idea in it. The notes go into the same
 * layer as the line, so the Song IR carries one track with two things happening
 * in it at once, which is what a piano is.
 *
 * ## Four things, not one
 *
 * This function had one behaviour for as long as there was one style using it,
 * and the behaviour was good enough that it took a second instrument to notice
 * it was also the *only* one. A left hand that exclusively answers in the holes
 * is a real and recognisable sound — it is post-war comping — but a player who
 * did nothing else for four minutes would sound like a player with a tic. See
 * `LeftHandMode` for what the four are and why they are drawn per section.
 *
 * ## What every mode has in common
 *
 * **It stays out of the right hand's way, by more than a hand's width.**
 * `HandSpec.gap` semitones of daylight, which is three rules at once: it is why
 * a real pianist does not voice there, it is why `keyboardPart` splits the group
 * into two hands on stage, and it is how `melodicLine` gets the tune back out of
 * a track that has an accompaniment interleaved with it. A mode that voiced
 * closer would not merely sound wrong — it would make the part unmeasurable.
 *
 * **It is written against the finished line**, which is the order the playing
 * happens in and the reason this cannot be a second independent generator: the
 * left hand knows what the right hand did, thins out where the right hand is
 * busy, and shuts up entirely when the right hand has the whole bar.
 *
 * **Its anatomy comes from the instrument, not the style.** How low it goes,
 * how many notes it holds and how it stacks them are `HandSpec` — see
 * `style/instruments.ts`, where the piano's rootless shell, the vibraphone's two
 * mallets and the accordion's stradella triad are three different sets of
 * numbers for what used to be one hardcoded hand.
 */
export function generateLeftHand(
  ctx: PartContext,
  /** What the right hand is playing. Already written; this answers it. */
  line: readonly NoteEvent[],
  opts: LeftHandOptions,
): NoteEvent[] {
  switch (opts.mode) {
    case 'unison': return unisonHand(ctx, line, opts);
    case 'block': return blockHand(ctx, line, opts);
    case 'ostinato': return ostinatoHand(ctx, opts);
    default: return answeringHand(ctx, line, opts);
  }
}

export interface LeftHandOptions {
  /** What this hand is doing in this section. See `LeftHandMode`. */
  mode: LeftHandMode;
  /** The instrument's anatomy. See `HandSpec`. */
  spec: HandSpec;
  /**
   * How much the hand speaks, 0..1.
   *
   * Read by `answer` and `block`, which choose whether to place each chord, and
   * ignored by `unison` and `ostinato`, which cannot use it: a unison line that
   * dropped out for one bar in five is not a sparser unison, it is a mistake,
   * and the same is true of a vamp with holes in it. Sparseness in those two is
   * a property of the figure, which is where it belongs.
   */
  density: number;
  /** Needed where the genre voices from the chord scale. */
  scaleFor?: (chord: Chord) => Scale;
  clarity?: number;
  /** The figure, for `ostinato`. Ignored by every other mode. */
  ostinato?: { cycle: number; hits: CompHit[] };
}

/**
 * Where the hand can be, in a bar whose line reaches down to `lineFloor`.
 *
 * From the *lowest* note the right hand touches in the bar rather than from the
 * nearest one, because a hand does not re-voice between two stabs a beat apart:
 * it finds a position for the bar and works in it, which is also why the voice
 * leading has anything to lead.
 *
 * Daylight wins over width where the two conflict. A window squeezed to nothing
 * is a right hand playing in the basement, and the honest answer there is that
 * the left hand has nowhere to go and says nothing — which `roomToVoice` is what
 * the callers ask.
 */
function handWindow(spec: HandSpec, lineFloor: Midi): [Midi, Midi] {
  const hi = Math.min(spec.ceiling, lineFloor - spec.gap);
  return [Math.max(spec.floor, hi - spec.window), hi];
}

/** Below this a "voicing" is a cluster on the bottom note. See `handWindow`. */
function roomToVoice([lo, hi]: [Midi, Midi]): boolean {
  return hi - lo >= 4;
}

/**
 * Is this a chord, or is it one note?
 *
 * `voiceChord` drops voices rather than clustering when the window is tight —
 * correctly, because two notes a semitone apart at A2 is mud and one note is
 * not — so a hand squeezed low enough comes back holding a single pitch. That
 * is fine as a voicing and fatal as a *left hand*: `melodicLine` recovers the
 * tune from a two-handed track by reading a note sounding alone as the right
 * hand, so a lone accompaniment note is not merely thin, it is counted as
 * melody. Measured before this guard: one onset in roughly six hundred, always
 * in the bars where the tune had dropped low enough to squeeze the hand.
 *
 * Silence is the honest answer. A player whose left hand has nowhere to voice
 * does not play half a chord there; they wait for the next bar.
 */
function isChord(voicing: readonly Midi[]): boolean {
  return voicing.length >= 2;
}

/** One chord for the hand, in the window, led from where it last was. */
function handVoicing(
  chord: Chord, [lo, hi]: [Midi, Midi], opts: LeftHandOptions, previous?: Midi[],
): Midi[] {
  return voiceChord(chord, {
    voices: opts.spec.voices,
    centre: Math.round((lo + hi) / 2),
    lo,
    hi,
    style: opts.spec.voicing,
    ...(opts.clarity !== undefined ? { clarity: opts.clarity } : {}),
    ...(opts.scaleFor ? { scale: opts.scaleFor(chord) } : {}),
    ...(previous ? { previous } : {}),
  });
}

/**
 * ANSWER — punctuate where the line has stopped.
 *
 * Not what the comp generator does. A comp pattern is a *figure*: it states two
 * or four hits and repeats them bar after bar, which is right for a rhythm
 * guitar and is the one thing a pianist accompanying themselves never does. This
 * hand is reactive. It punctuates where the right hand has stopped, it pushes
 * ahead of a phrase, and it says nothing at all through a busy passage — because
 * there is only one player and their attention is on the line.
 *
 * Two rules produce that, and each is a thing the alternative gets wrong:
 *
 *  - **It answers, or it punches, and it prefers the offbeat.** Where the line
 *    has stopped, a chord goes in the hole; where the line attacks, a chord can
 *    land *with* it and make the accent. Both are real and the second one is the
 *    one worth insisting on: a left hand that only ever played in the gaps would
 *    alternate with the right hand for four minutes and the two would never once
 *    be seen doing something together, which is not what a piano looks like.
 *  - **It thins out where the right hand is busy**, which is the one thing a
 *    two-part texture written by two independent generators can never do: a bar
 *    of running eighths gets one chord and a bar with air in it gets two.
 */
function answeringHand(
  ctx: PartContext, line: readonly NoteEvent[], opts: LeftHandOptions,
): NoteEvent[] {
  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const out: NoteEvent[] = [];
  const sorted = line.slice().sort((a, b) => a.beat - b.beat);
  let previous: Midi[] | undefined;

  for (let bar = 0; bar < chords.length; bar++) {
    const chord = chords[bar]!;
    const barStart = startBeat + bar * beatsPerBar;
    const barEnd = barStart + beatsPerBar;
    const inBar = sorted.filter((n) => n.beat < barEnd && n.beat + n.duration > barStart);

    const lineFloor = inBar.length ? Math.min(...inBar.map((n) => n.midi)) : opts.spec.lead;
    const window = handWindow(opts.spec, lineFloor);
    if (!roomToVoice(window)) continue;
    const [lo, hi] = window;

    /**
     * How much of the bar the right hand is actually sounding, 0..1.
     *
     * The one number that makes this a part for a *hand* rather than a second
     * player. A generator that did not have it would comp identically through a
     * held whole note and through a bar of running eighths, and the second of
     * those is where a pianist's left hand goes quiet — not out of taste, but
     * because the same person is playing both and the line is where they are.
     */
    // As the *union* of the notes, not the sum of their lengths. The line is
    // written a section at a time and its overlaps are only cleared once it has
    // been concatenated — see `trimOverlaps` — so a plain sum reads a phrase of
    // eighths as more than a bar of sound and pins this to 1, which silenced
    // the left hand almost everywhere. `inBar` is sorted, so one sweep does it.
    let sounding = 0;
    let covered = barStart;
    for (const n of inBar) {
      const from = Math.max(n.beat, covered);
      const to = Math.min(n.beat + n.duration, barEnd);
      if (to > from) { sounding += to - from; covered = to; }
    }
    const busy = Math.max(0, Math.min(1, sounding / beatsPerBar));

    const voicing = handVoicing(chord, [lo, hi], opts, previous);
    previous = voicing;
    if (!isChord(voicing)) continue;

    /**
     * How many chords this bar gets: nought, one, or two.
     *
     * Two is for a bar with room in it. The `busy` term is what takes the second
     * one away as the line fills up, and takes the first one away too once the
     * right hand has the whole bar — at which point the left hand has nothing to
     * say and a real one says nothing.
     */
    if (!rng.chance(opts.density * (1 - busy * 0.25))) continue;
    const want = rng.chance(0.5 * (1 - busy * 0.6)) ? 2 : 1;

    /**
     * Every eighth in the bar, weighted, and the weights are the whole idiom.
     *
     * **Metrically**, the offbeat wins by a wide margin. A left-hand chord on
     * the downbeat lands with the bass and the ride and adds nothing to either;
     * the same chord an eighth later is the anticipation that makes a rhythm
     * section sound like it is listening to itself.
     *
     * **Against the line**, all three relationships are worth having and they
     * are worth different amounts. A hole is the best of them — that is an
     * answer. An attack is next: both hands together, which is the accent and,
     * not incidentally, the only moment the audience sees a pianist play a
     * chord and a note at once. Under a note that is merely sustaining is the
     * quietest of the three and still idiomatic — it is a fill under a held
     * tone — so it is kept and weighted last rather than excluded.
     */
    const slots: (readonly [number, number])[] = [];
    for (let at = barStart; at < barEnd - 1e-6; at += 0.5) {
      const onBeat = Math.abs(at - Math.round(at)) < 1e-6;
      const attacks = inBar.some((n) => Math.abs(n.beat - at) < 1e-6);
      const under = !attacks && inBar.some((n) => n.beat < at && n.beat + n.duration > at + 1e-6);
      const metric = onBeat ? (Math.abs(at - barStart) < 1e-6 ? 1 : 2) : 5;
      slots.push([at, metric * (attacks ? 1.6 : under ? 0.7 : 2.2)]);
    }

    let free = slots;
    for (let k = 0; k < want && free.length; k++) {
      const at = rng.weighted(free);
      // A hand does not play two chords an eighth apart; the next one, if there
      // is one, goes somewhere else in the bar.
      free = free.filter(([b]) => Math.abs(b - at) >= 1);
      const duration = Math.min(
        rng.weighted([[0.5, 5], [0.75, 3], [1.5, 2], [0.25, 2]] as const),
        barEnd - at,
      );
      if (duration < 0.25) continue;
      const velocity = 0.5 * rng.float(0.86, 1.06);
      for (const midi of voicing) out.push({ beat: at, duration, midi, velocity });
    }
  }
  return out.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
}

/**
 * UNISON — both hands playing the same line, an octave apart.
 *
 * The gesture this whole union was built to reach. It is the sound of Corea and
 * of everyone who learned it from him, it is most of what anyone means by
 * "complicated piano jazz", and it was not merely missing before — it was
 * unreachable, because the only thing the left hand could do was voice a chord
 * somewhere, and this is not a chord at all.
 *
 * An octave, not two. Two puts the left hand in the bass player's register and
 * the effect stops being a doubled line and starts being a bass part in the
 * wrong place. Where even one octave will not fit — a line already low, or an
 * instrument whose other hand cannot reach — the note is simply not doubled,
 * which is what a player does with the bottom of a run.
 *
 * The dynamic is the tell. A doubling is played *under* the line rather than
 * with it: a shade quieter, so the octave reads as weight rather than as two
 * people playing.
 */
function unisonHand(
  ctx: PartContext, line: readonly NoteEvent[], opts: LeftHandOptions,
): NoteEvent[] {
  const { spec } = opts;
  const out: NoteEvent[] = [];
  for (const note of line) {
    const midi = note.midi - 12;
    if (midi < spec.floor || midi > spec.ceiling) continue;
    out.push({
      beat: note.beat,
      duration: note.duration,
      midi,
      velocity: note.velocity * 0.82,
    });
  }
  return out.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
}

/**
 * BLOCK — a chord struck *with* the line rather than around it.
 *
 * Locked hands, in the sense that matters: the two move together, so a phrase
 * arrives as a series of harmonised events instead of a tune with comping
 * scattered through it. It is the other half of the post-bop piano vocabulary
 * and the one that makes a passage sound emphatic rather than conversational.
 *
 * **Not full locked-hands harmony**, which would put the melody note in the top
 * of a five-part voicing with chord tones a second and a third below it. That is
 * genuinely how Shearing and Garland voiced it, and it would break the one thing
 * the rest of the system relies on: `melodicLine` recovers the tune from a
 * two-handed track by finding the note standing `gap` above the rest, and a
 * harmonisation that close leaves no daylight to find it by. So this is a left
 * hand locked to the line's rhythm, which is the same gesture from the audience
 * and keeps the part measurable.
 *
 * Only the notes worth landing on. Every attack in a running passage would be a
 * chord on every eighth, which no one plays and which would bury the line it is
 * supposed to be supporting; the accented and the longer notes get the chord,
 * and the rest of the line is left alone.
 */
function blockHand(
  ctx: PartContext, line: readonly NoteEvent[], opts: LeftHandOptions,
): NoteEvent[] {
  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const out: NoteEvent[] = [];
  const sorted = line.slice().sort((a, b) => a.beat - b.beat);
  const slotsPerBar = beatsPerBar * SLOTS_PER_BEAT;
  let previous: Midi[] | undefined;

  for (let bar = 0; bar < chords.length; bar++) {
    const chord = chords[bar]!;
    const barStart = startBeat + bar * beatsPerBar;
    const barEnd = barStart + beatsPerBar;
    const inBar = sorted.filter((n) => n.beat >= barStart - 1e-6 && n.beat < barEnd - 1e-6);
    if (!inBar.length) continue;

    const lineFloor = Math.min(...inBar.map((n) => n.midi));
    const window = handWindow(opts.spec, lineFloor);
    if (!roomToVoice(window)) continue;

    const voicing = handVoicing(chord, window, opts, previous);
    previous = voicing;
    if (!isChord(voicing)) continue;

    for (const note of inBar) {
      const slot = Math.round((note.beat - barStart) * SLOTS_PER_BEAT);
      const strength = metricStrength(slot, slotsPerBar, ctx.style.groups);
      /**
       * Long notes and strong ones. A held note is where a chord has room to
       * sound, and an accented one is where the emphasis was going anyway — so
       * the two together are exactly the passing notes' complement.
       */
      const worth = (note.duration >= 0.75 ? 0.55 : 0) + strength * 0.16;
      if (!rng.chance(Math.min(0.95, opts.density * worth * 1.6))) continue;
      const duration = Math.min(note.duration, barEnd - note.beat);
      if (duration < 0.25) continue;
      for (const midi of voicing) {
        out.push({ beat: note.beat, duration, midi, velocity: note.velocity * 0.72 });
      }
    }
  }
  return out.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
}

/**
 * OSTINATO — a figure that repeats regardless of what the right hand is doing.
 *
 * The montuno, the vamp, the riff the whole band is sitting on. It is the one
 * mode that does not read the line at all, and that indifference is the point:
 * `answer` correctly falls silent under a busy right hand, which is right for
 * conversation and leaves the texture thin in exactly the passage — a long
 * blowing chorus over two chords — where a real trio is at its densest. A vamp
 * does not care that the soloist is busy. That is what a vamp is for.
 *
 * Its window is fixed rather than taken from the bar, for the same reason: a
 * figure that re-voiced itself around whatever the line happened to be doing
 * would not be a repeating figure. It sits under where the line *lives*, which
 * is `HandSpec.lead`, and stays there.
 *
 * The cycle is usually not the bar — see `Cycle` in `style/types.ts`. A montuno
 * that came back round on every downbeat would be a comp pattern with extra
 * steps; the drift against the barline is the whole gesture.
 */
function ostinatoHand(ctx: PartContext, opts: LeftHandOptions): NoteEvent[] {
  const figure = opts.ostinato;
  if (!figure?.hits.length) return [];

  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const slotsPerBar = beatsPerBar * SLOTS_PER_BEAT;
  const window = handWindow(opts.spec, opts.spec.lead);
  if (!roomToVoice(window)) return [];

  const voicings: Midi[][] = [];
  let previous: Midi[] | undefined;
  for (const chord of chords) {
    const voicing = handVoicing(chord, window, opts, previous);
    voicings.push(voicing);
    previous = voicing;
  }

  /**
   * Two notes of the voicing per hit, walking up through it.
   *
   * A montuno is a *shape* made out of a chord rather than the chord struck
   * repeatedly — that is what separates it from a comp figure, and the walking
   * index is the same mechanism as `arpeggio` on a comp pattern, carried across
   * barlines for the same reason.
   *
   * Two rather than one, and this is not a stylistic preference — it is the
   * invariant the whole two-handed IR rests on. `melodicLine` takes a track that
   * has one player's two hands interleaved in it and gets the tune back out by
   * reading **a note sounding alone as the right hand**; a left hand playing
   * single notes in the holes would be read, correctly by that rule and wrongly
   * in fact, as the melody. Measured when this mode first played one note at a
   * time: the reported mean low note of the jazz melody line fell four semitones
   * overnight, which was not a melody that had moved but an accompaniment being
   * counted as one.
   *
   * A dyad costs nothing musically. A left-hand vamp on a piano is a shell — two
   * notes — far more often than it is a single line, and on a vibraphone the
   * left hand *is* two mallets and could not play one note if it wanted to.
   */
  const out: NoteEvent[] = [];
  let step = 0;
  for (const { hit, bar, slot } of cycleHits(figure.hits, {
    cycle: figure.cycle, bars: chords.length, slotsPerBar,
  })) {
    const voicing = voicings[bar]!;
    if (!isChord(voicing)) continue;
    const at = step++ % voicing.length;
    const pair = [voicing[at]!, voicing[(at + 1) % voicing.length]!];
    const beat = startBeat + slot / SLOTS_PER_BEAT;
    const velocity = (hit.vel ?? 0.55) * rng.float(0.9, 1.05);
    for (const midi of new Set(pair)) {
      out.push({ beat, duration: hit.dur / SLOTS_PER_BEAT, midi, velocity });
    }
  }
  return out.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
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
 *
 * **Two tiers, and the second one is what makes the first one safe.** Staying
 * under the tune is a preference; not doubling it is a rule. Enforced together
 * they can contradict each other outright — when the melody drops into the
 * bottom of its range, *every* pitch the answer can reach is above it, so a
 * search that vetoed both would find nothing and return the note it came in
 * with, which is the octave it was called to remove. Measured: one doubling in
 * 138 overlaps, every one of them a melody note below the counter's floor. So
 * the register rule is dropped on the second pass and the independence rules
 * are not, which is the correct order to give way in — an answer sitting above
 * a low tune is ordinary counterpoint, and an answer doubling it is the one
 * thing this function exists to prevent.
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

  /** Doubling and parallel motion: the two the ear hears as one part. */
  const clashes = (cand: Midi): boolean => {
    if (Math.abs(cand - melodyNow) % 12 === 0) return true;   // unison or octave
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
  /** And the preference: the answer sits under the tune where it can. */
  const bad = (cand: Midi): boolean => clashes(cand) || cand > melodyNow;

  if (!bad(midi)) return midi;
  // Try the chord tones either side, nearest first. A mallet will happily take
  // the one further away; a wind instrument would rather stay put.
  const spread = idiom.arpeggio > 0.5 ? 8 : 5;
  const nearest = (reject: (cand: Midi) => boolean): Midi | undefined => {
    for (let d = 1; d <= spread; d++) {
      for (const dir of [-1, 1]) {
        const cand = midi + d * dir;
        if (cand < lo || cand > hi) continue;
        if (!tones.includes(((cand % 12) + 12) % 12)) continue;
        if (!reject(cand)) return cand;
      }
    }
    return undefined;
  };
  return nearest(bad) ?? nearest(clashes) ?? midi;
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
  const { chords, beatsPerBar, startBeat, rng, style } = ctx;
  const slotsPerBar = beatsPerBar * SLOTS_PER_BEAT;
  const bars = chords.length;
  const out: DrumEvent[] = [];
  const arrival = opts.arrival ?? opts.intensity;

  /**
   * The fill belongs to the last *bar*, whatever the figure's cycle is.
   *
   * A drummer setting up the next section plays into the barline, not into
   * whatever point a three-beat ostinato happens to have reached. So the fill is
   * still bar-shaped, and the cycle is what has to give way around it.
   */
  const lastBarStart = startBeat + (bars - 1) * beatsPerBar;
  const fill = opts.fillAtEnd && bars > 0
    ? buildFill({
      barStart: lastBarStart, beatsPerBar, slotsPerBar, rng,
      intensity: opts.intensity,
      arrival,
      palette: opts.palette ?? DEFAULT_FILLS,
    })
    : undefined;
  const clearFrom = fill ? (bars - 1) * slotsPerBar + fill.fromSlot : Infinity;

  for (const [voice, slots] of Object.entries(pattern.voices) as [DrumVoice, number[]][]) {
    for (const { slot } of cycleHits(slots.map((at) => ({ at })), {
      cycle: pattern.cycle ?? slotsPerBar, bars, slotsPerBar,
    })) {
      // Clear exactly as much of the bar as the fill actually occupies — which
      // used to be hardcoded to half a bar whatever was played there. The kick
      // keeps going: a drummer's right foot does not stop for a fill.
      if (slot >= clearFrom && voice !== 'bd') continue;
      const inBar = slot % slotsPerBar;
      const strength = accentOf(inBar, slotsPerBar, style.groups);
      out.push({
        beat: startBeat + slot / SLOTS_PER_BEAT,
        voice,
        velocity: Math.min(1, strength * opts.intensity * rng.float(0.92, 1.05)),
      });
    }
  }

  if (fill) {
    out.push(...fill.events);
    out.push(landing(lastBarStart + beatsPerBar, arrival));
  }
  return out.sort((a, b) => a.beat - b.beat);
}

/**
 * How hard a kit voice hits, by where in the bar it lands.
 *
 * The old arithmetic — downbeat, then every fourth slot, then everything else —
 * is right in 4/4 and silently wrong the moment a bar groups asymmetrically: in
 * a 2+2+3 it accents slot 12, which is the *weak* eighth of the last group,
 * two groups, and leaves the head of the third group as an offbeat. A drummer
 * playing that is not playing 7/8, and no amount of writing better patterns in
 * the table fixes an accent applied after the fact.
 *
 * So the grouping decides it where there is one. `metricStrength` already knows
 * how; this only maps its five levels onto the three velocities a kit uses.
 */
function accentOf(slot: number, slotsPerBar: number, groups?: readonly number[]): number {
  const strength = metricStrength(slot, slotsPerBar, groups);
  if (strength === 4) return 1;
  return strength >= 2 ? 0.85 : 0.68;
}
