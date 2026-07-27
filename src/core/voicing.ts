/**
 * Chord voicing — deciding *which* notes of a chord sound, and *where*.
 *
 * This is the difference between a chord symbol and an arrangement, and it is
 * the place where music that is theoretically correct most reliably sounds
 * wrong. Two rules do nearly all the work, and both are about register rather
 * than about harmony:
 *
 *  1. **Low-interval limits.** A major third is a warm interval at C4 and mud
 *     at C2. The ear resolves two close partials in the bass as a beating
 *     rumble rather than as harmony, because the critical band is roughly
 *     constant in Hz and so covers ever more semitones the lower you go. Every
 *     orchestration text states this as a table, and the table is not advice:
 *     an E2/G2 third makes the whole arrangement sound cheap no matter what is
 *     written above it. Measured on this generator before the rule existed,
 *     10% of jazz and ambient voicings had a second or smaller below middle C.
 *
 *  2. **The third and the seventh are not optional.** They are what the chord
 *     *is* — the fifth is nearly redundant and the root is usually in the bass
 *     already. The previous priority order dropped the third first, so 16% of
 *     iskelmä voicings had no quality at all, and a `V7` routinely sounded as
 *     root-fifth-seventh with the leading tone missing. A dominant without its
 *     third does not pull anywhere, which makes every cadence in the song limp.
 *
 * The construction is bottom-up: place the lowest voice, then require each
 * voice above it to clear the minimum interval for the register it lands in.
 * That guarantees both rules by construction rather than checking for them
 * afterwards, and it makes unison doubling impossible — each voice is strictly
 * above the last.
 */

import type { Chord, ChordQuality } from './chord.js';
import { chordPcs } from './chord.js';
import type { Midi, Pc } from './pitch.js';
import { pc } from './pitch.js';
import type { Scale } from './scale.js';
import { snapToScale, stepInScale } from './scale.js';

export type VoicingStyle = 'tertian' | 'guide' | 'quartal' | 'spread';

export interface VoicingOptions {
  voices: number;
  centre: Midi;
  lo?: Midi;
  hi?: Midi;
  /**
   * `tertian` stacks the chord from the root — right for dance-band comping.
   * `guide` drops the root and leads with the 3rd and 7th, which is how a jazz
   * pianist voices under a walking bass that already owns the root.
   * `quartal` stacks fourths from the scale — the modal-jazz sound.
   * `spread` opens the stack out, which is what a pad wants: a pad voiced in
   * close position is indistinguishable from the comp playing the same chord.
   */
  style?: VoicingStyle;
  /** Required by `quartal`. */
  scale?: Scale;
  /** The previous voicing, for voice leading. */
  previous?: Midi[];
  /**
   * Hard ceiling — no voice may reach this note or above.
   *
   * This is how the arrangement keeps out of the tune's way. Supplied per bar
   * from the melody's planned register, so a comp that would otherwise voice
   * itself straight through the melody gets pushed underneath it instead.
   */
  ceiling?: Midi;
  /**
   * How strictly the low-interval limits apply, 0..1. Driven by smoothness:
   * at 0 the arrangement is allowed to be muddy on purpose, at 1 the spacing is
   * textbook.
   */
  clarity?: number;
}

/**
 * Minimum interval permitted between two adjacent voices whose *lower* note is
 * `bottom`, in semitones.
 *
 * The strict column is the conventional low-interval-limit table. The loose
 * column is what the ear will tolerate when the music wants to be dense on
 * purpose. `clarity` mixes between them.
 *
 * Above middle C the limit falls to a semitone, which matters: a jazz voicing
 * *wants* its seconds, and forbidding them everywhere would flatten the genre.
 * Seconds are not the problem — seconds in the bass are the problem.
 */
export function minInterval(bottom: Midi, clarity = 1): number {
  const strict = bottom < 40 ? 12    // below E2 — octaves and fifths only
    : bottom < 48 ? 7                // E2–B2 — a fifth
      : bottom < 55 ? 5              // C3–F#3 — a fourth
        : bottom < 60 ? 4            // G3–B3 — a major third
          : bottom < 67 ? 2          // C4–F#4 — a whole tone
            : 1;                     // above G4 — anything
  // Even the loose column keeps a minor third below middle C. Smoothness 0 is
  // meant to allow chaos, and chaos is a musical choice in the melodic line and
  // in upper-structure clusters — but a second in the bass is not a choice
  // anyone makes, it is a defect, and no style benefits from it. A style that
  // turns the rules off (bebop sets `strictness: 'free'`) is asking for
  // chromatic freedom in the *tune*; it is not asking for a muddy piano.
  const loose = bottom < 40 ? 10
    : bottom < 48 ? 5
      : bottom < 55 ? 4
        : bottom < 60 ? 3
          : 1;
  return Math.max(1, Math.round(loose + (strict - loose) * clamp01(clarity)));
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Which chord tones survive, in ascending order of their interval above the
 * root, when only `voices` of them can sound.
 *
 * The order things are dropped is the whole content of this function, and it is
 * the standard arranging answer: the fifth first (it is implied by the root and
 * adds no information), then the root (the bass has it), then the extensions.
 * The third and the seventh are kept to the last possible moment because they
 * are the only two notes that say what the chord is.
 */
export function chooseTones(chord: Chord, voices: number, opts: {
  /** Drop the root when the bass is already holding it. */
  rootInBass?: boolean;
} = {}): Pc[] {
  const pcs = chordPcs(chord);
  const root = pcs[0]!;
  const third = pcs[1];
  const fifth = pcs[2];
  const seventh = pcs[3];
  const extensions = pcs.slice(4);

  /**
   * Suspensions have no third; their whole identity is the 4th or 2nd standing
   * in for it, so that note is the one that must survive.
   *
   * The *suspended dominant* is deliberately not in this set even though it is
   * suspended, and the omission is doing work rather than being an oversight. A
   * `sus4` triad is three notes and losing any of them loses the chord, so it is
   * taken whole. A `dom7sus4` is four, and its suspended fourth already sits
   * where a third would in the stack — so `essential` picks up that fourth and
   * the seventh without being told, and the *root* stays droppable. Which is
   * exactly what a rootless left-hand voicing of one needs, and taking it whole
   * would put the root back under a bass player who already has it.
   */
  const isSus = chord.quality === 'sus4' || chord.quality === 'sus2';

  const essential: Pc[] = [];
  if (third !== undefined) essential.push(third);
  if (seventh !== undefined) essential.push(seventh);

  // Altered fifths are not the ordinary droppable fifth — a ♯5 or ♭5 *is* the
  // alteration, and dropping it leaves a plain dominant.
  const alteredFifth = chord.quality === 'aug'
    || chord.quality === 'dom7sharp5' || chord.quality === 'dom7flat5'
    || chord.quality === 'dim' || chord.quality === 'dim7' || chord.quality === 'halfdim7';

  const optional: Pc[] = [];
  if (alteredFifth && fifth !== undefined) optional.push(fifth);
  if (!opts.rootInBass) optional.push(root);
  optional.push(...extensions);
  if (!alteredFifth && fifth !== undefined) optional.push(fifth);
  if (opts.rootInBass) optional.push(root);

  const chosen: Pc[] = isSus ? [root, ...pcs.slice(1)] : [...essential];
  for (const p of optional) {
    if (chosen.length >= voices) break;
    if (!chosen.includes(p)) chosen.push(p);
  }
  // Fewer tones than voices: double from the bottom of the chord upward. The
  // doubling is by octave, never at unison — placement guarantees that.
  let i = 0;
  while (chosen.length < voices && pcs.length) {
    chosen.push(pcs[i % pcs.length]!);
    i++;
  }
  while (chosen.length > voices) chosen.pop();

  // Stack in ascending order of interval above the root, which is what makes a
  // tertian voicing read as the chord rather than as an inversion by accident.
  const order = (p: Pc) => ((p - root) % 12 + 12) % 12;
  return chosen.slice().sort((a, b) => order(a) - order(b));
}

/**
 * Place a set of pitch classes as a stack, bottom-up, honouring the minimum
 * interval for whatever register each voice lands in.
 *
 * Returns undefined if the stack cannot fit under `hi` — the caller retries
 * with a lower bottom note or fewer voices.
 */
function stack(pcs: Pc[], bottom: Midi, hi: Midi, clarity: number): Midi[] | undefined {
  const out: Midi[] = [bottom];
  for (let i = 1; i < pcs.length; i++) {
    const prev = out[out.length - 1]!;
    const floor = prev + minInterval(prev, clarity);
    // Lowest note of this pitch class at or above the floor.
    let note = Math.floor(floor / 12) * 12 + pcs[i]!;
    while (note < floor) note += 12;
    if (note > hi) return undefined;
    out.push(note);
  }
  return out;
}

/** Total motion from one voicing to another, voice by voice from the top down. */
function motion(from: readonly Midi[], to: readonly Midi[]): number {
  if (!from.length) return 0;
  let total = 0;
  for (let i = 0; i < to.length; i++) {
    // Compare against the nearest voice of the previous chord; a voicing with a
    // different number of voices still leads sensibly this way.
    let best = Infinity;
    for (const f of from) best = Math.min(best, Math.abs(to[i]! - f));
    total += best;
  }
  return total / to.length;
}

/**
 * Voice a chord as `voices` notes inside a register window.
 *
 * Every inversion is tried — each chord tone gets a turn as the bottom voice,
 * at every octave that fits — and the candidates are scored on voice leading,
 * register fit and span. Trying inversions is what makes the voice leading real
 * rather than nominal: keeping common tones and moving the rest by step is
 * mostly a matter of choosing the right inversion, and a routine that always
 * stacks from the root cannot do it at all.
 */
export function voiceChord(chord: Chord, opts: VoicingOptions): Midi[] {
  const { voices, centre } = opts;
  const style = opts.style ?? 'tertian';
  const clarity = opts.clarity ?? 1;
  const lo = opts.lo ?? centre - 12;
  const hardHi = Math.min(opts.hi ?? centre + 12, (opts.ceiling ?? Infinity) - 1);

  if (style === 'quartal' && opts.scale) {
    return voiceQuartal(chord, opts.scale, { voices, centre, lo, hi: hardHi });
  }

  const tones = chooseTones(chord, voices, { rootInBass: style === 'guide' });
  const spread = style === 'spread';
  // A pad opens the stack out by asking for a wider floor between voices; the
  // effect is the classic open-position sound, and it also stops the pad from
  // occupying the identical register as the comp playing the same chord.
  const effectiveClarity = spread ? 1 : clarity;

  const previous = opts.previous ?? [];
  let best: Midi[] | undefined;
  let bestScore = Infinity;

  // Each rotation makes a different chord tone the bottom voice — i.e. tries
  // every inversion — and each octave slides the whole stack.
  for (let rot = 0; rot < tones.length; rot++) {
    const rotated = [...tones.slice(rot), ...tones.slice(0, rot)];
    const bottomPc = rotated[0]!;
    for (let octave = Math.floor(lo / 12) * 12; octave <= hardHi; octave += 12) {
      const bottom = octave + bottomPc;
      if (bottom < lo || bottom > hardHi) continue;
      let placed = stack(rotated, bottom, hardHi, effectiveClarity);
      if (!placed && spread) placed = stack(rotated, bottom, hardHi, clarity);
      if (!placed) continue;

      const top = placed[placed.length - 1]!;
      const span = top - bottom;
      let score = motion(previous, placed) * 1.6;
      // Keep the body of the chord near where the instrument lives.
      score += Math.abs((bottom + top) / 2 - centre) * 0.5;
      // Very wide stacks stop reading as one chord; very narrow ones are muddy.
      const wantSpan = spread ? 19 : 12;
      score += Math.abs(span - wantSpan) * (spread ? 0.35 : 0.25);
      // Root position is the plainest and most stable, so break ties toward it.
      if (rot !== 0) score += 0.4;

      if (score < bestScore) { bestScore = score; best = placed; }
    }
  }

  if (best) return best;

  // Nothing fit — the window is narrower than the chord needs. Drop a voice and
  // try again rather than emitting a cluster, and fall back to a bare stack of
  // whatever fits if even that fails.
  if (voices > 2) return voiceChord(chord, { ...opts, voices: voices - 1 });
  const pcs = chordPcs(chord);
  return [lo + ((pcs[0]! - lo) % 12 + 12) % 12];
}

/**
 * Quartal voicing — stacked fourths drawn from the scale rather than the chord.
 *
 * This is the defining sound of modal jazz. Because the harmony sits still for
 * eight or sixteen bars at a time, tertian voicings become monotonous fast;
 * fourths are ambiguous enough to keep a static chord interesting.
 *
 * The stack is built by taking every other scale degree twice over (a fourth is
 * three scale steps), which keeps it diatonic instead of parallel-chromatic.
 */
function voiceQuartal(
  chord: Chord,
  scale: Scale,
  opts: { voices: number; centre: Midi; lo: Midi; hi: Midi },
): Midi[] {
  const { voices, centre, lo, hi } = opts;
  const tones = chordPcs(chord).filter((p) => scale.pcs.includes(p));
  const startPc = tones[0] ?? chord.root;
  let cursor = snapToScale(scale, nearest(startPc, centre - 4));

  const out: Midi[] = [];
  for (let i = 0; i < voices; i++) {
    out.push(cursor);
    cursor = stepInScale(scale, cursor, 3); // a fourth, diatonically
  }

  // Slide the whole stack into the register window rather than clamping each
  // voice, which would collapse the fourths.
  const top = Math.max(...out);
  const bottom = Math.min(...out);
  let shift = 0;
  while (top + shift > hi) shift -= 12;
  while (bottom + shift < lo) shift += 12;
  return out.map((m) => m + shift).sort((a, b) => a - b);
}

function nearest(target: Pc, reference: Midi): Midi {
  const base = Math.floor(reference / 12) * 12 + target;
  let best = base;
  let bestDist = Math.abs(base - reference);
  for (const cand of [base - 12, base + 12]) {
    const d = Math.abs(cand - reference);
    if (d < bestDist) { best = cand; bestDist = d; }
  }
  return best;
}

/** Exposed for the ensemble audit. */
export function voicingFaults(voicing: readonly Midi[], clarity = 1): string[] {
  const faults: string[] = [];
  const v = voicing.slice().sort((a, b) => a - b);
  for (let i = 1; i < v.length; i++) {
    const d = v[i]! - v[i - 1]!;
    if (d === 0) faults.push('unison-double');
    else if (d < minInterval(v[i - 1]!, clarity)) faults.push('low-interval-limit');
  }
  return faults;
}

export type { ChordQuality };
