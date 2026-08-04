/**
 * Solos — the passage where one player is the piece.
 *
 * `SectionKind` has had `'solo'` since the first jazz form landed, and what
 * happened musically was thin: the lead rested, the counter instrument was
 * handed the melody engine with `soloistic: true`, and the result was a second
 * tune over the same changes. Measured over 60 jazz songs, a solo written that
 * way and a head written the ordinary way differed by nothing worth counting —
 * 1.02 against 0.98 onsets per beat and 78% against 80% stepwise motion. Two
 * descriptions of the same material. Nobody was soloing, nothing was developed,
 * and there was no drum solo anywhere in the codebase at all.
 *
 * A solo is not a melody with more notes in it. Five properties separate them,
 * none of which the melody engine has and all of which are countable:
 *
 *  1. **It is played over the form, not as the form.** The changes keep coming
 *     and the soloist plays across the barline. The melody engine writes
 *     phrases that fit into bars, which is correct for a tune and wrong here —
 *     so this file's unit is the *cell*, placed at a slot cursor that walks the
 *     whole chorus and does not care where the bars are.
 *  2. **Motivic development.** State an idea, restate it displaced by a beat,
 *     sequence it up a step, fragment it, expand it. This is the entire
 *     difference between a solo and a scale exercise, and it is mechanical
 *     enough to generate. `generate/motto.ts` already holds a short recurring
 *     cell for the song; this is that idea applied *within* a section.
 *  3. **Guide tones on the changes.** A line that lands on the third or seventh
 *     of the new chord on its downbeat sounds like it knows where it is. One
 *     that lands on the root sounds like an exercise; one that lands anywhere
 *     sounds like an accident. Highest-value rule in the file.
 *  4. **An arc.** Density, register and velocity rise across the chorus and
 *     peak near the end — and then the last bars get out of the way for
 *     whatever comes back in. `generate/dynamics.ts` does this between
 *     sections; this does it within one.
 *  5. **Space.** A solo with no rests in it is not exciting, it is exhausting.
 *     Rest placement is decided first, as a fraction of the chorus, rather than
 *     being whatever the notes leave behind.
 *
 * The constraint system stays in force throughout. A solo is freer, not
 * unconstrained — and that distinction is load-bearing, because the concert
 * lifts smoothness above jazz's `light` default (see `docs/concert-plan.md` §6)
 * and the vocabulary here has to carry the interest at `strict` on its own.
 * Chromatic enclosures and metric displacement are things this file does *on
 * purpose*; they are not the same as the rule table letting an ugly leap
 * through by accident.
 */

import type { Chord } from '../core/chord.js';
import { chordPcs } from '../core/chord.js';
import type { Midi, Pc } from '../core/pitch.js';
import { clampToRange, nearestPc, pc } from '../core/pitch.js';
import type { Rng } from '../core/rng.js';
import type { Mode, Scale } from '../core/scale.js';
import { scaleStepsBetween, snapToScale, stepInScale } from '../core/scale.js';
import type {
  BackingPolicy, DrumEvent, DrumVoice, LayerId, NoteEvent, Section,
} from '../core/types.js';
/**
 * The one thing this file borrows from the stage, and it is a fact about
 * instruments rather than about staging: which object a drum voice needs
 * standing under it. A drum solo has to know whether the player is at a kit or
 * at a hand drum before it can write a note for them, and `STATION_OF` is
 * already the answer casting and choreography both read. See `generateDrumSolo`.
 */
import { drumStations } from '../concert/instruments.js';
import { IDIOMS, type IdiomProfile } from '../style/instruments.js';
import {
  comfortableLeap, EMPTY_ACCOMPANIMENT, evaluate as evaluateRules, RULES,
  type Accompaniment, type NoteContext, type Rule,
} from '../core/rules.js';
import type { Motto } from './motto.js';
import { metricStrength, SLOTS_PER_BEAT, trimOverlaps } from './rhythm.js';

// ---------------------------------------------------------------------------
// The genre's side of the contract
// ---------------------------------------------------------------------------

/**
 * Layers that can carry a solo.
 *
 * `pad` and `brass` are absent on purpose: a pad is a bed and a brass section
 * is punctuation, and neither has ever taken a chorus in any of this
 * repertoire. `drums` means a drum solo, which has its own generator below.
 */
export type SoloLayer = Extract<LayerId, 'melody' | 'counter' | 'comp' | 'bass' | 'drums'>;

/**
 * How a genre's soloist actually talks.
 *
 * Every number here is a dialect knob rather than a quality setting. The two
 * genres that solo at all want opposite things from most of them, which is the
 * point: a jazz chorus is improvisation and an iskelmä break is an ornamented
 * statement of the tune, and generating the second by turning the first down
 * would be wrong about the genre rather than merely tame.
 */
export interface SoloVocabulary {
  /** Beats between successive notes at rest. 0.5 is an eighth-note line. */
  gait: number;
  /** Chance a cell doubles up into the next subdivision. Jazz double-time. */
  doubleTime: number;
  /**
   * How much louder an offbeat note is than the one on the beat, 0..1.
   *
   * Swung eighths accented off the beat are most of what makes a line read as
   * jazz phrasing rather than as notes at the right pitches. Zero for iskelmä,
   * where the accent belongs to the dance.
   */
  offbeatAccent: number;
  /** Chance of approaching a guide tone from above and below — the enclosure. */
  enclosure: number;
  /** Appetite for notes outside the chord scale, 0..1. */
  chromatic: number;
  /** Grace notes and mordents, 0..1. The whole of the iskelmä break. */
  ornament: number;
  /**
   * How strongly a phrase develops the running cell rather than inventing a new
   * one, 0..1. This is the dial that decides whether the result is a solo or a
   * sequence of unrelated licks.
   */
  develop: number;
  /** Chance a restatement is displaced off the beat it was first played on. */
  displace: number;
  /** Target fraction of the chorus left silent. */
  space: number;
  /** Semitones the line's centre climbs across the chorus. */
  climb: number;
  /**
   * How far the line is the *tune*, ornamented, rather than invented, 0..1.
   *
   * Iskelmä's break is not improvisation and pretending otherwise would be
   * wrong about the genre: the accordion takes the melody and decorates it.
   * Cells are lifted from the head's own contour — as scale steps, so no
   * transposition is needed and the figure fits whatever chord it lands on.
   */
  paraphrase: number;
  /**
   * Chance the last solo chorus ends on a rising run into whatever comes back.
   *
   * The two genres want opposite things from the same bars and both are right.
   * An iskelmä break exists to *deliver* the final chorus and the run up into
   * it is the gesture everybody in the hall is waiting for. A jazz chorus hands
   * back to the head, and the head has a melody of its own that a soloist still
   * climbing would be playing over — there, the space is the gesture.
   */
  liftIntoReturn: number;
}

export interface SoloProfile {
  /**
   * Who takes a chorus, weighted. An empty rotation means the genre does not
   * solo, and ambient's is empty on purpose.
   */
  rotation: (readonly [SoloLayer, number])[];
  vocabulary: SoloVocabulary;
  /** What the band plays behind each soloist. Falls back to `Genre.soloBacking`. */
  backing?: Partial<Record<SoloLayer, BackingPolicy>>;
  /**
   * Chance the last solo chorus trades fours with the drummer: four bars
   * soloist, four bars drums, alternating.
   *
   * The most recognisable gesture in the idiom, which is exactly why it is a
   * probability rather than a rule. A band that trades on every single tune has
   * turned a signature into a formula, and the whole reason the gesture lands
   * is that the audience did not know it was coming.
   */
  tradeFours?: number;
  /**
   * Chance the top of a chorus quotes the song's motto, so the solo is heard as
   * belonging to *this* tune rather than to the changes in general.
   */
  quoteMotto?: number;
}

// ---------------------------------------------------------------------------
// Rotation
// ---------------------------------------------------------------------------

/** A bar span within a section, `[from, to)`, relative to the section start. */
export type BarSpan = readonly [number, number];

export interface SoloChorus {
  /** Index into `song.sections`. */
  section: number;
  layer: SoloLayer;
  /** What goes on `Section.solo` — the policy for the section as a whole. */
  backing: BackingPolicy;
  /**
   * What the band does in the bars it *is* playing.
   *
   * The same thing as `backing` except while trading, where the section-level
   * answer is "alternating blocks" and the question of what the rhythm section
   * sounds like in its own four bars is still open. It is not full: a jazz band
   * trading fours comps behind the horn exactly as it did on the previous
   * chorus and then stops dead, and losing that distinction would make the
   * trading chorus the one place the pad comes back.
   *
   * **This was called `feel` and the name was wrong twice over.** It holds a
   * `BackingPolicy`, so `solo.feel === 'comping'` read as a category error long
   * before anything else wanted the word — and now something does: a `Feel` is a
   * genre-neutral statement about timing and articulation over a span of bars
   * (`style/feel.ts`), which is a different question from what the rhythm
   * section is playing behind a soloist. `backing` was the obvious new name and
   * is taken by the field directly above, for the answer that goes on the IR.
   */
  whilePlaying: BackingPolicy;
  /** Bar spans the named soloist plays. Empty for a drum chorus. */
  soloBars: BarSpan[];
  /** Bar spans the drummer has to themselves. Empty unless trading. */
  drumBars: BarSpan[];
  /** Which chorus of this song's solo this is, 0-based. */
  index: number;
  /** How many solo choruses the song has. */
  total: number;
}

/**
 * Decide who takes each chorus.
 *
 * Two rules, and both are what a bandstand actually does. **Nobody takes two
 * choruses in a row** — the whole point of a rotation is that the texture
 * changes, and a horn that keeps going for sixteen bars has not rotated, it has
 * taken a longer solo. And **the kit does not open the blowing**: a drum chorus
 * before anyone has stated anything is a solo with nothing to be a solo *from*.
 *
 * Trading fours lands on the last chorus because that is where it belongs — it
 * is the gesture that hands the tune back to the head, and putting it earlier
 * leaves the band with nowhere left to go.
 */
export function planSolos(args: {
  sections: readonly Section[];
  profile: SoloProfile | undefined;
  /** Layers this style never uses, plus anything with no instrument. */
  excluded: ReadonlySet<LayerId>;
  rng: Rng;
  /** Genre-wide default, used where the profile does not name one. */
  fallback: BackingPolicy;
}): Map<number, SoloChorus> {
  const out = new Map<number, SoloChorus>();
  const { profile, excluded, rng, fallback } = args;
  if (!profile?.rotation.length) return out;

  const pool = profile.rotation.filter(([layer]) => !excluded.has(layer));
  if (!pool.length) return out;

  const indices: number[] = [];
  for (let i = 0; i < args.sections.length; i++) {
    if (args.sections[i]!.kind === 'solo') indices.push(i);
  }
  if (!indices.length) return out;

  /**
   * Drawn once for the song rather than per chorus, because "do we trade at the
   * end" is a decision the band makes about the tune. Two choruses at minimum:
   * trading is a hand-off from a solo that has already been going on, and the
   * first thing anybody plays cannot be that.
   */
  const canTrade = !excluded.has('drums')
    && indices.length >= 2
    && rng.chance(profile.tradeFours ?? 0);
  let previous: SoloLayer | undefined;

  for (let i = 0; i < indices.length; i++) {
    const index = indices[i]!;
    const section = args.sections[index]!;
    const isLast = i === indices.length - 1;
    const trading = canTrade && isLast && section.lengthBars >= 8;

    /**
     * Narrow the pool, then fall back to the whole thing rather than failing.
     *
     * Iskelmä's rotation has one entry in it, so the "never twice in a row"
     * filter empties it on a second consecutive break — and the right answer
     * there is that the accordion keeps playing, not that the break falls
     * silent. The filter is a preference the moment it stops being satisfiable.
     */
    let candidates = pool.filter(([layer]) => layer !== previous);
    if (trading || i === 0) candidates = candidates.filter(([layer]) => layer !== 'drums');
    if (!candidates.length) candidates = pool.filter(([layer]) => layer !== 'drums');
    if (!candidates.length) candidates = pool;

    const layer = rng.weighted(candidates);
    previous = layer;

    const bars = section.lengthBars;
    const whilePlaying = profile.backing?.[layer] ?? fallback;
    let backing = whilePlaying;
    let soloBars: BarSpan[] = [[0, bars]];
    let drumBars: BarSpan[] = [];

    if (layer === 'drums') {
      /**
       * A drum chorus is `trade` with every block belonging to the drummer.
       *
       * The policy table has no "everyone stops" entry and does not need one:
       * `trade` already means the band drops out for the drummer's bars and
       * comes back in on a downbeat, which is exactly what a drum chorus is —
       * one block long instead of two.
       */
      backing = 'trade';
      soloBars = [];
      drumBars = [[0, bars]];
    } else if (trading) {
      backing = 'trade';
      soloBars = [];
      drumBars = [];
      // Four bars each. A twelve-bar blues therefore gives soloist, drums,
      // soloist — which is what trading over a blues sounds like.
      for (let bar = 0; bar < bars; bar += 4) {
        const span: BarSpan = [bar, Math.min(bars, bar + 4)];
        (bar % 8 === 0 ? soloBars : drumBars).push(span);
      }
    }

    out.set(index, {
      section: index, layer, backing,
      whilePlaying: layer === 'drums' ? 'trade' : whilePlaying,
      soloBars, drumBars,
      index: i, total: indices.length,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Cells — the unit of development
// ---------------------------------------------------------------------------

/**
 * One idea, held the way a player holds one: a rhythm and a shape, with no
 * pitches in it.
 *
 * Storing scale steps rather than notes is the same decision `generate/motto.ts`
 * made and for the same reason — the harmony moves underneath the figure, so a
 * cell that remembered its pitches could only ever be replayed over the chord
 * it was invented on. Steps replay anywhere.
 */
interface Cell {
  /** Onset offsets from the cell's start, in sixteenths. Ascending, `[0] = 0`. */
  onsets: number[];
  /** Scale steps from each note to the next. Length is `onsets.length - 1`. */
  steps: number[];
  /** Total length in sixteenths, the last note included. */
  span: number;
}

/** How a cell relates to the one before it. Named for what a player would call it. */
type Development =
  | 'state' | 'sequence' | 'displace' | 'fragment' | 'expand' | 'invert' | 'recast' | 'new';

/**
 * The shapes worth improvising on.
 *
 * Deliberately the same argument as `makeContour` in `generate/motto.ts`: a
 * random walk through the scale is what a generator produces by default and
 * precisely what a listener cannot hold on to. These are the gestures that
 * survive being played once — a run, a turn, an arch, a leap answered by a
 * walk home. The difference from the motto list is that these are longer,
 * because a solo cell is a lick rather than a hook.
 */
const SHAPES: (readonly [(n: number) => number[], number])[] = [
  // Scalar runs. The backbone of a bebop line and of an accordion break alike.
  [(n) => fill(n, () => 1), 5],
  [(n) => fill(n, () => -1), 6],
  // Turn — up and back down, or the mirror.
  [(n) => fill(n, (i) => (i < n / 2 ? 1 : -1)), 4],
  [(n) => fill(n, (i) => (i < n / 2 ? -1 : 1)), 3],
  // Arch over a longer span.
  [(n) => fill(n, (i) => (i < (n - 1) / 2 ? 1 : -1)), 3],
  // A leap out and a stepwise walk home — the oldest opening gesture there is.
  [(n) => fill(n, (i) => (i === 0 ? 2 : -1)), 3],
  [(n) => fill(n, (i) => (i === 0 ? -3 : 1)), 2],
  // Broken chord: thirds in alternation, which on a scale is a step of two.
  [(n) => fill(n, (i) => (i % 2 === 0 ? 2 : -1)), 2],
  // A repeated note answered by a step. Small, and very sticky.
  [(n) => fill(n, (i) => (i < n - 1 ? 0 : -1)), 2],
];

function fill(n: number, f: (i: number) => number): number[] {
  return Array.from({ length: Math.max(1, n) }, (_, i) => f(i));
}

/**
 * Invent a cell from nothing.
 *
 * The rhythm is built rather than sampled from the style's melody cells,
 * because a style's cells are one bar long and fit inside it — which is the
 * property a solo has to break. What comes out here runs for as long as the
 * idea does and starts wherever the cursor happens to be.
 */
function inventCell(rng: Rng, vocab: SoloVocabulary, unitSlots: number, energy = 0.6): Cell {
  /**
   * Longer ideas later.
   *
   * The arc has to be visible in what is *played* and not only in how loudly:
   * a chorus whose second half is the same three-note figures at a higher
   * velocity has got louder, not busier, and the ear reads that as a mix move
   * rather than as a player building. Together with the shrinking rest below,
   * this is what puts 11% more onsets in the back half of a jazz chorus than
   * the front.
   */
  const notes = rng.weighted([
    [3, 4 - 3 * energy], [4, 5], [5, 3 + 2 * energy],
    [6, 1 + 3 * energy], [7, 0.5 + 2.5 * energy],
  ] as const);
  const doubled = rng.chance(vocab.doubleTime * (0.4 + energy));
  const base = Math.max(1, doubled ? Math.round(unitSlots / 2) : unitSlots);

  const onsets: number[] = [0];
  for (let i = 1; i < notes; i++) {
    // Mostly even motion, with the occasional long note and the occasional
    // pair squeezed into one slot's worth of time. A line that is nothing but
    // even eighths is a scale exercise however good its pitches are.
    const gap = rng.weighted([
      [base, 7],
      [base * 2, 2],
      [Math.max(1, Math.round(base / 2)), doubled ? 1 : 2],
    ] as const);
    onsets.push(onsets[i - 1]! + gap);
  }
  const steps = rng.weighted(SHAPES)(notes - 1);
  const tail = onsets[onsets.length - 1]! - onsets[onsets.length - 2]!;
  return { onsets, steps, span: onsets[onsets.length - 1]! + Math.max(base, tail) };
}

/**
 * Lift the head's own figures, one bar at a time.
 *
 * This is what an iskelmä break *is*. The accordion does not invent over the
 * changes, it plays the tune with more notes in it — so the cells come from the
 * tune, held as scale steps so no transposition is needed and the figure bends
 * onto whatever chord it lands on. Bars carrying fewer than two notes are
 * skipped: one note is not a shape.
 */
function cellsFromTheme(
  theme: readonly NoteEvent[], scale: Scale, beatsPerBar: number, bars: number,
): Cell[] {
  const out: Cell[] = [];
  for (let bar = 0; bar < bars; bar++) {
    const from = bar * beatsPerBar;
    const inBar = theme
      .filter((n) => n.beat >= from - 1e-6 && n.beat < from + beatsPerBar - 1e-6)
      .sort((a, b) => a.beat - b.beat);
    if (inBar.length < 2) continue;
    const onsets = inBar.map((n) => Math.round((n.beat - inBar[0]!.beat) * SLOTS_PER_BEAT));
    const steps: number[] = [];
    for (let i = 1; i < inBar.length; i++) {
      steps.push(scaleStepsBetween(scale, inBar[i - 1]!.midi, inBar[i]!.midi));
    }
    const last = inBar[inBar.length - 1]!;
    out.push({
      onsets,
      steps,
      span: onsets[onsets.length - 1]! + Math.max(1, Math.round(last.duration * SLOTS_PER_BEAT)),
    });
  }
  return out;
}

/**
 * Put a cell's onsets on the grid the renderer will actually hear.
 *
 * Notes that collapse onto the same slot are dropped along with their step,
 * which shortens the figure rather than stacking two pitches on one attack —
 * a monophonic line cannot sound both, and the second would simply eat the
 * first's duration. See `swing` in `SoloOptions`.
 */
function snapCell(cell: Cell, grid: number): Cell {
  if (grid <= 1) return cell;
  const onsets: number[] = [];
  const steps: number[] = [];
  for (let i = 0; i < cell.onsets.length; i++) {
    const at = Math.round(cell.onsets[i]! / grid) * grid;
    if (i > 0 && at <= onsets[onsets.length - 1]!) continue;
    onsets.push(at);
    if (i > 0) steps.push(cell.steps[i - 1] ?? 0);
  }
  if (onsets.length < 2) return cell;
  return { onsets, steps, span: Math.max(cell.span, onsets[onsets.length - 1]! + grid) };
}

/** The motto, read as a cell so a chorus can open by quoting the tune's figure. */
function cellFromMotto(motto: Motto): Cell | undefined {
  const onsets: number[] = [];
  let slot = 0;
  for (const entry of motto.cell) {
    if (entry > 0) onsets.push(slot);
    slot += Math.abs(entry);
  }
  if (onsets.length < 2) return undefined;
  const steps = motto.contour.slice(1, onsets.length);
  while (steps.length < onsets.length - 1) steps.push(-1);
  return { onsets, steps, span: slot };
}

/**
 * Develop the running cell.
 *
 * Every operation here is one a player would name out loud, and between them
 * they are the whole difference between a solo and a sequence of licks:
 *
 *   state      play it again as it was
 *   sequence   the same figure starting a scale step away
 *   displace   the same figure, arriving off the beat it arrived on before
 *   fragment   the front of it only, which is how a phrase gets urgent
 *   expand     stretched — wider intervals or longer notes
 *   invert     turned upside down
 *   recast     the same shape on a different rhythm
 *
 * `recast` is in the list because every other verb preserves the rhythm, so
 * without it a cell's rhythm can only ever be inherited whole or thrown away
 * with the shape attached to it — and there is no way to say "that idea, on a
 * different rhythm", which is a thing players do constantly. Its measured
 * effect is small: the share of a chorus's short inter-onset gaps taken by the
 * single most common one moves from 46% to 45%. It is in the vocabulary
 * because the vocabulary would be missing a verb without it, not because it
 * rescued a number.
 *
 * `new` is in the table so the solo is not one idea for thirty-two bars, and it
 * is weighted against `develop` rather than being a fixed rate: at the low end
 * this file writes a chain of unrelated figures, which is exactly what the
 * generator used to do and what the measurement below is for.
 */
function developCell(
  cell: Cell, rng: Rng, vocab: SoloVocabulary, unitSlots: number, energy: number,
): { cell: Cell; how: Development } {
  const d = vocab.develop;
  const how = rng.weighted([
    ['sequence', 4 * d],
    ['state', 2 * d],
    ['displace', 3 * d * vocab.displace],
    ['fragment', 2.5 * d],
    ['expand', 1.8 * d],
    ['invert', 0.9 * d],
    ['recast', 1.6 * d],
    ['new', 4 * (1 - d) + 0.6],
  ] as const);

  switch (how) {
    case 'new':
      return { cell: inventCell(rng, vocab, unitSlots, energy), how };
    case 'recast': {
      const fresh = inventCell(rng, vocab, unitSlots, energy);
      const n = Math.min(fresh.onsets.length, cell.steps.length + 1);
      const onsets = fresh.onsets.slice(0, n);
      return {
        cell: {
          onsets,
          steps: cell.steps.slice(0, n - 1),
          span: onsets[onsets.length - 1]! + unitSlots,
        },
        how,
      };
    }
    case 'fragment': {
      const keep = Math.max(2, Math.min(cell.onsets.length - 1, rng.int(2, 3)));
      const onsets = cell.onsets.slice(0, keep);
      return {
        cell: {
          onsets,
          steps: cell.steps.slice(0, keep - 1),
          span: onsets[onsets.length - 1]! + unitSlots,
        },
        how,
      };
    }
    case 'expand': {
      // Two ways to expand, and they are genuinely different gestures: widen
      // the intervals, or stretch the rhythm. Widening keeps the rhythm
      // recognisable, which is the half of a figure the ear holds hardest.
      if (rng.chance(0.6)) {
        return { cell: { ...cell, steps: cell.steps.map((s) => (s === 0 ? 1 : s * 2)) }, how };
      }
      const onsets = cell.onsets.map((s) => Math.round(s * 1.5));
      return { cell: { onsets, steps: cell.steps, span: Math.round(cell.span * 1.5) }, how };
    }
    case 'invert':
      return { cell: { ...cell, steps: cell.steps.map((s) => -s) }, how };
    default:
      // `state`, `sequence` and `displace` all replay the cell untouched. What
      // differs is where it is anchored — in pitch for a sequence, in time for
      // a displacement — and both of those are the caller's business.
      return { cell, how };
  }
}

// ---------------------------------------------------------------------------
// Guide tones
// ---------------------------------------------------------------------------

/**
 * The notes that say which chord this is.
 *
 * The third carries the quality and the seventh carries the function, and
 * between them they are the chord — root and fifth are shared by half the
 * harmony in any key and land like an exercise. A sixth chord's fourth tone
 * *is* its sixth, which falls out of `chordPcs` for free and is exactly the
 * note a dance-band lead aims at.
 */
function guideTones(chord: Chord): Pc[] {
  const pcs = chordPcs(chord);
  const out: Pc[] = [];
  if (pcs[1] !== undefined) out.push(pcs[1]);
  if (pcs[3] !== undefined) out.push(pcs[3]);
  return out.length ? out : pcs.slice(0, 1);
}

/** The nearest guide tone of `chord` to `from`, inside the range. */
function guideToneNear(chord: Chord, from: Midi, [lo, hi]: [Midi, Midi]): Midi {
  let best = from;
  let bestDist = Infinity;
  for (const p of guideTones(chord)) {
    const cand = clampToRange(nearestPc(p, from), lo, hi);
    const d = Math.abs(cand - from);
    if (d < bestDist) { bestDist = d; best = cand; }
  }
  return best;
}

// ---------------------------------------------------------------------------
// The line
// ---------------------------------------------------------------------------

export interface SoloOptions {
  /** One chord per bar of the section, already in the local key. */
  chords: Chord[];
  beatsPerBar: number;
  /**
   * How the bar groups, where it does not group evenly. A soloist in 7/8 phrases
   * to the 2+2+3 or they are playing in a different metre from the band.
   */
  groups?: readonly number[];
  /** Absolute beat the section starts on. */
  startBeat: number;
  rng: Rng;
  range: [Midi, Midi];
  tonic: Pc;
  mode: Mode;
  scaleForChord: (tonic: Pc, mode: Mode, chord: Chord) => Scale;
  vocabulary: SoloVocabulary;
  /** Bar spans of the section this soloist plays. Trading gives more than one. */
  blocks: readonly BarSpan[];
  /** Which chorus of the solo this is, 0-based, and how many there are. */
  chorus: number;
  choruses: number;
  intensity: number;
  strictness: number;
  rules?: Rule[];
  accompaniment?: Accompaniment;
  agility?: number;
  idiom?: IdiomProfile;
  /** The song's figure, for the quote at the top of a chorus. */
  motto?: Motto;
  quoteMotto?: number;
  /** The head, relative to its own section start, for a genre that paraphrases. */
  theme?: readonly NoteEvent[];
  /**
   * The style's swing amount, because it changes what onsets are *available*.
   *
   * `song.ts` swings the IR by delaying the second eighth of each beat and
   * holding its end fixed, so a sixteenth placed immediately after one is left
   * with 0.08 of a beat — audible as a click and meaningless as a pitch, and
   * observed in exactly that form on a bass solo before this existed. The melodic layers are trimmed after swinging and survive it; a comp
   * or bass line is not, because trimming a polyphonic layer would eat its
   * chords. Quantising a swung solo to the eighth grid removes the whole class
   * of fault, and costs nothing: a line at 200 BPM playing straight eighths
   * against a walking quarter *is* the double time.
   */
  swing?: number;
  /**
   * Beats of pickup allowed before the section starts.
   *
   * Non-zero only for the monophonic layers, which `song.ts` trims for overlaps
   * once the sections are concatenated. A comp or bass line written backwards
   * across the join would sound on top of a chord that is still ringing, and
   * nothing downstream would clean it up.
   */
  pickupBeats?: number;
}

export function generateSolo(opts: SoloOptions): NoteEvent[] {
  const {
    chords, beatsPerBar, startBeat, rng, range, tonic, mode, vocabulary: vocab,
  } = opts;
  const bars = chords.length;
  if (!bars || !opts.blocks.length) return [];

  const slotsPerBar = beatsPerBar * SLOTS_PER_BEAT;
  const totalSlots = bars * slotsPerBar;
  const rules = opts.rules ?? RULES;
  const accompaniment = opts.accompaniment ?? EMPTY_ACCOMPANIMENT;
  const agility = opts.agility ?? 0.7;
  const idiom = opts.idiom ?? IDIOMS.vocal;
  const scaleFor = (chord: Chord) => opts.scaleForChord(tonic, mode, chord);
  const barOf = (slot: number) => Math.min(bars - 1, Math.max(0, Math.floor(slot / slotsPerBar)));
  const chordAt = (slot: number) => chords[barOf(slot)]!;

  /**
   * How much of the chorus is reserved for getting out of the way.
   *
   * Two bars on the last chorus, because what follows is the head coming back
   * and a soloist still blowing over it is the single most common way for a
   * generated arrangement to sound like it has no idea what a form is. One bar
   * otherwise — a player does breathe before taking another chorus, but they do
   * not stop for eight beats.
   */
  const tailBars = Math.min(bars - 1, opts.chorus >= opts.choruses - 1 ? 2 : 1);
  const tail = Math.min(0.4, tailBars / bars);
  /**
   * No new phrase begins after this. A phrase already under way is allowed to
   * finish — a soloist who stops mid-figure has been cut off, not deferred —
   * but nothing fresh starts, which is what "getting out of the way" means when
   * it is a decision rather than a fade.
   */
  const stopSlot = totalSlots - tailBars * slotsPerBar;

  /** Rising to a peak near the end, then standing aside. */
  const energyAt = (slot: number): number => {
    const p = slot / Math.max(1, totalSlots);
    if (p >= 1 - tail) return 0.12;
    const q = p / (1 - tail);
    return q <= 0.85 ? 0.3 + 0.7 * (q / 0.85) : 1 - ((q - 0.85) / 0.15) * 0.18;
  };

  /**
   * Where the changes are.
   *
   * Bar 0 counts: the top of a chorus is the biggest change in the form, and a
   * solo that arrives there on a guide tone is a solo that has been counting.
   */
  const changeSlots = new Set<number>([0]);
  for (let bar = 1; bar < bars; bar++) {
    const here = chords[bar]!;
    const before = chords[bar - 1]!;
    if (here.root !== before.root || here.quality !== before.quality) {
      changeSlots.add(bar * slotsPerBar);
    }
  }
  // Enclosures are decided per landing rather than per note, so a target is
  // approached from both sides or from neither. Half an enclosure is a wrong
  // note with an explanation.
  const enclosed = new Set<number>();
  for (const slot of changeSlots) if (rng.chance(vocab.enclosure)) enclosed.add(slot);

  const unitSlots = Math.max(1, Math.round(vocab.gait * SLOTS_PER_BEAT));
  /** See `swing` above: a swung line lives on the eighth grid. */
  const grid = (opts.swing ?? 0) > 0 ? 2 : 1;
  const themeCells = opts.theme?.length
    ? cellsFromTheme(opts.theme, scaleFor(chords[0]!), beatsPerBar, bars)
    : [];

  const out: NoteEvent[] = [];
  const [lo, hi] = range;
  let prev = clampToRange(snapToScale(scaleFor(chords[0]!), Math.round((lo + hi) / 2)), lo, hi);
  let prevPrev: Midi | undefined;
  let prevChord: Chord | undefined;
  let cell: Cell | undefined;
  let cellStart: Midi | undefined;
  let placed = 0;

  for (let b = 0; b < opts.blocks.length; b++) {
    const [fromBar, toBar] = opts.blocks[b]!;
    const blockStart = fromBar * slotsPerBar;
    const blockEnd = toBar * slotsPerBar;
    // The pickup writes backwards across the section join, which is the most
    // characteristic entrance a soloist has and is only safe on a layer that
    // gets trimmed afterwards. See `pickupBeats`.
    const pickup = b === 0 && opts.pickupBeats
      ? Math.round(opts.pickupBeats * SLOTS_PER_BEAT) : 0;
    let cursor = blockStart - (fromBar === 0 ? pickup : 0);
    const lastEntry = Math.min(blockEnd, Math.max(blockStart + 1, stopSlot));

    while (cursor < lastEntry - 1) {
      const energy = energyAt(Math.max(0, cursor));

      /**
       * Quote the tune at the top of the chorus.
       *
       * A solo that could belong to any song over these changes is a solo that
       * has not been listening to the head. One quotation at the top is enough
       * — it is the thing the ear catches, and repeating it would turn the
       * chorus back into the melody.
       */
      const atTop = b === 0 && placed === 0;
      let how: Development = 'new';
      if (atTop && opts.motto && rng.chance(opts.quoteMotto ?? 0)) {
        cell = cellFromMotto(opts.motto) ?? inventCell(rng, vocab, unitSlots, energy);
      } else if (themeCells.length && rng.chance(vocab.paraphrase)) {
        // The break is the tune. Take the bar of it that belongs here where
        // there is one, so the ornamented line tracks the melody's own shape
        // through the form rather than shuffling it.
        cell = themeCells[Math.min(themeCells.length - 1, barOf(Math.max(0, cursor)))]!;
        how = 'state';
      } else if (cell) {
        const developed = developCell(cell, rng, vocab, unitSlots, energy);
        cell = developed.cell;
        how = developed.how;
      } else {
        cell = inventCell(rng, vocab, unitSlots, energy);
      }

      /**
       * Where the restatement lands, in time and in pitch.
       *
       * Displacement moves it off the beat it arrived on last time, which is
       * the cheapest way to make a repeat sound like a decision. A sequence
       * moves it a scale step instead and leaves the placement alone — doing
       * both at once is a different figure, not a development of this one.
       */
      let start = cursor;
      if (how === 'displace') {
        // An eighth is the idiomatic amount and the only one available under
        // swing — a sixteenth displacement puts the cell's onsets between the
        // swung ones, where the seam with the next cell can leave a note of
        // 80 ms. Straight styles have no such problem and keep the sharper
        // version. Same argument as `snapCell`.
        start = cursor + (grid > 1
          ? rng.weighted([[2, 5], [-2, 2]] as const)
          : rng.weighted([[2, 4], [1, 2], [-2, 1]] as const));
      }
      start = Math.max(fromBar === 0 ? blockStart - pickup : blockStart, start);

      const arrival = how === 'sequence' && cellStart !== undefined
        ? rng.weighted([[1, 4], [-1, 4], [2, 2], [-2, 2]] as const)
        : undefined;

      const result = placeCell({
        cell: snapCell(cell, grid), start, blockEnd,
        anchor: arrival !== undefined && cellStart !== undefined
          ? { from: cellStart, steps: arrival } : undefined,
        prev, prevPrev, prevChord,
        chordAt, scaleFor, barOf, slotsPerBar, groups: opts.groups, beatsPerBar, startBeat,
        range, rng, rules, strictness: opts.strictness, accompaniment,
        agility, idiom, mode, tonic, vocab,
        changeSlots, enclosed, energy,
        intensity: opts.intensity,
        climb: vocab.climb * (opts.choruses > 1 ? (opts.chorus + 1) / opts.choruses : 1),
      });

      if (result.notes.length) {
        out.push(...result.notes);
        prev = result.last;
        prevPrev = result.prevPrev ?? prevPrev;
        prevChord = chordAt(Math.max(0, result.lastSlot));
        cellStart = result.first;
        placed++;
      }

      /**
       * The rest, sized so the chorus lands on its target silence.
       *
       * Space is decided here rather than being whatever the notes leave over,
       * because a solo with no rests in it is not exciting — it is exhausting,
       * and it is what every generator that thinks of rests as leftovers
       * produces. The gap shrinks as the energy rises, which is what makes the
       * arc audible as urgency rather than merely as volume.
       */
      const played = Math.max(unitSlots, result.span);
      const ratio = vocab.space / Math.max(0.05, 1 - vocab.space);
      const gap = Math.round(played * ratio * (1.9 - 1.35 * energy));
      cursor = start + played + Math.max(1, Math.min(slotsPerBar, gap));
      // Land the next entrance on an eighth: a phrase that starts on a stray
      // sixteenth reads as a mistake rather than as placement.
      cursor = Math.round(cursor / 2) * 2;

      /**
       * Come in on the change where the entrance lands near one — most of the
       * time, and not all of it.
       *
       * Without this the entrances landed wherever the arithmetic left them,
       * which cost the guide-tone rule most of its opportunities: a target only
       * exists where the line is actually playing. Worse, it *locked* — one
       * displacement early in a chorus shifted every following cell by the same
       * amount, because each cell starts where the last one's gap ended, and a
       * whole twelve-bar chorus came out entering on the & of one with no
       * downbeat in it anywhere.
       *
       * Pulling the cursor either way by up to an eighth fixes both. Leaving it
       * alone four times in ten is what keeps entrances off the beat often
       * enough to sound like phrasing rather than like a grid.
       */
      if (rng.chance(0.6)) {
        for (const change of changeSlots) {
          if (Math.abs(change - cursor) <= 2 && change > start) { cursor = change; break; }
        }
      }
    }
  }

  /**
   * The run up into whatever comes back.
   *
   * Deliberately written into the bars the arc reserved for silence, because
   * this is the one genre where those bars are not silence — an iskelmä break
   * exists to hand the final chorus its entrance, and the ascending figure into
   * it is the gesture the whole hall is waiting for. Jazz sets
   * `liftIntoReturn` near zero and keeps the space, because what comes back
   * there is a head with a tune of its own.
   */
  const lastBlock = opts.blocks[opts.blocks.length - 1]!;
  if (
    tailBars > 0 && opts.chorus >= opts.choruses - 1
    && lastBlock[1] * slotsPerBar >= totalSlots
    && rng.chance(vocab.liftIntoReturn)
  ) {
    /**
     * As long as the ceiling allows, and no longer.
     *
     * The run has to start from a note the line can legally reach — a third
     * below where it left off, which is inside the leap ceiling at every
     * strictness — and then climb until the register runs out. Sizing it any
     * other way produced a figure that rose four notes, hit the top of the
     * range and *restarted an octave down*, because the scoring's only
     * remaining candidates were below it. A run that wraps is not a lift; it is
     * two runs, and the second one is a mistake.
     */
    const liftScale = scaleFor(chordAt(stopSlot));
    const liftFrom = Math.max(lo, stepInScale(liftScale, snapToScale(liftScale, prev), -2));
    let headroom = 1;
    for (let m = liftFrom; headroom < 8;) {
      const up = stepInScale(liftScale, m, 1);
      if (up > hi) break;
      m = up;
      headroom++;
    }
    const room = Math.max(0, totalSlots - stopSlot);
    const count = clamp(Math.min(headroom, Math.floor(room / unitSlots) - 1), 3, 7);
    const from = totalSlots - count * unitSlots;
    const rise = snapCell({
      onsets: Array.from({ length: count }, (_, i) => i * unitSlots),
      steps: fill(count - 1, () => 1),
      span: count * unitSlots,
    }, grid);
    const lift = placeCell({
      cell: rise, start: from, blockEnd: totalSlots,
      anchor: { from: liftFrom, steps: 0 },
      prev, prevPrev, prevChord,
      chordAt, scaleFor, barOf, slotsPerBar, groups: opts.groups, beatsPerBar, startBeat,
      range, rng, rules, strictness: opts.strictness, accompaniment,
      agility, idiom, mode, tonic, vocab,
      // No landing target inside a run: the run *is* the gesture, and pulling
      // its middle onto a guide tone would flatten the one thing it does.
      changeSlots: new Set<number>(), enclosed: new Set<number>(),
      energy: 1, intensity: opts.intensity, climb: vocab.climb,
    });
    /**
     * A lift ends on its highest note.
     *
     * Chord tones win on strong beats — correctly, and that is the constraint
     * system doing its job — so the realised run sometimes takes a third where
     * the figure asked for a step and reaches the ceiling with onsets to spare.
     * Whatever it plays after that can only go down, and a rising phrase whose
     * last note falls is not a rising phrase. Trimming the tail is the honest
     * repair: the gesture ends where it ran out of register, which is exactly
     * where a player would end it.
     */
    const climbed = lift.notes;
    while (climbed.length > 2 && climbed[climbed.length - 1]!.midi <= climbed[climbed.length - 2]!.midi) {
      climbed.pop();
    }
    out.push(...climbed);
  }

  return trimOverlaps(out.filter((n) => n.duration > 0)).sort((a, b) => a.beat - b.beat);
}

/**
 * Realise one cell as notes.
 *
 * Everything the cell does not know lives here: which octave it starts in, what
 * the chord underneath is doing, whether a note of it happens to fall on a
 * change, and whether the rules will allow any of it.
 */
function placeCell(args: {
  cell: Cell;
  start: number;
  blockEnd: number;
  /** For a sequence: where the previous statement began, and how far to move. */
  anchor?: { from: Midi; steps: number };
  prev: Midi;
  prevPrev?: Midi;
  prevChord?: Chord;
  chordAt: (slot: number) => Chord;
  scaleFor: (chord: Chord) => Scale;
  barOf: (slot: number) => number;
  slotsPerBar: number;
  groups?: readonly number[];
  beatsPerBar: number;
  startBeat: number;
  range: [Midi, Midi];
  rng: Rng;
  rules: Rule[];
  strictness: number;
  accompaniment: Accompaniment;
  agility: number;
  idiom: IdiomProfile;
  mode: Mode;
  tonic: Pc;
  vocab: SoloVocabulary;
  changeSlots: ReadonlySet<number>;
  enclosed: ReadonlySet<number>;
  energy: number;
  intensity: number;
  climb: number;
}): { notes: NoteEvent[]; first: Midi; last: Midi; lastSlot: number; prevPrev?: Midi; span: number } {
  const { cell, start, blockEnd, range, rng, vocab } = args;
  const [lo, hi] = range;
  const notes: NoteEvent[] = [];

  let prev = args.prev;
  let prevPrev = args.prevPrev;
  let prevChord = args.prevChord;
  let first: Midi | undefined;
  let lastSlot = start;

  /**
   * Where the line should be sitting.
   *
   * A solo climbs. Register is the property the ear reads as effort — a horn
   * that ends a chorus in the same octave it started in has not built anything
   * however many notes it played — so the target height rises with the energy
   * and again with each chorus taken.
   */
  const centre = (lo + hi) / 2;
  const span = hi - lo;
  const height = clamp(
    centre - span * 0.32 + span * 0.58 * args.energy + args.climb,
    lo + 2, hi - 2,
  );

  for (let i = 0; i < cell.onsets.length; i++) {
    const slot = start + cell.onsets[i]!;
    if (slot >= blockEnd) break;
    const nextSlot = i + 1 < cell.onsets.length ? start + cell.onsets[i + 1]! : start + cell.span;
    const chord = args.chordAt(Math.max(0, slot));
    const scale = args.scaleFor(chord);
    const beat = args.startBeat + slot / SLOTS_PER_BEAT;
    const duration = Math.max(0.125, (Math.min(nextSlot, blockEnd) - slot) / SLOTS_PER_BEAT * 0.92);

    /**
     * What this note wants to be, in descending order of authority.
     *
     * The guide tone wins because landing on the changes is what makes the line
     * sound like it knows where it is; the enclosure wins next because it is
     * the approach *to* that landing and is meaningless without it; the cell's
     * own step is what is left, which is most of the time.
     */
    let preferred: Midi | undefined;
    let wanted: number | undefined = i === 0 ? undefined : cell.steps[i - 1];

    if (i === 0 && args.anchor) {
      preferred = clampToRange(stepInScale(scale, args.anchor.from, args.anchor.steps), lo, hi);
    }

    const onChange = args.changeSlots.has(slot);
    if (onChange) {
      preferred = guideToneNear(chord, prev, range);
      wanted = undefined;
    } else {
      // Look ahead for a landing this note is the approach to.
      for (const ahead of [1, 2] as const) {
        const at = i + ahead < cell.onsets.length ? start + cell.onsets[i + ahead]! : -1;
        if (at < 0 || !args.changeSlots.has(at) || !args.enclosed.has(at)) continue;
        const target = guideToneNear(args.chordAt(at), prev, range);
        /**
         * The enclosure: above, then a semitone below, then the target.
         *
         * This is the single most characteristic thing a bebop line does and it
         * is chromatic by construction — which is why jazz disables
         * `chromatic-tone` in its rule overrides rather than why this file
         * ignores the rules. If the approach is vetoed the scorer simply falls
         * back to the cell's own step, and the landing still happens.
         */
        preferred = ahead === 1 ? target - 1 : stepInScale(scale, target, 1);
        wanted = undefined;
        break;
      }
    }

    const midi = choose({
      scale, chord, prev, prevPrev, prevChord,
      preferred, wanted, height, range, rng,
      strength: metricStrength(slot, args.slotsPerBar, args.groups),
      duration, beat,
      accompaniment: args.accompaniment,
      strictness: args.strictness,
      rules: args.rules,
      agility: args.agility,
      idiom: args.idiom,
      mode: args.mode,
      tonic: args.tonic,
      vocab,
    });

    /**
     * Velocity: the arc, plus where in the bar the note sits.
     *
     * The offbeat accent is the one that matters. A swung eighth-note line with
     * its weight on the beat is a line of correct pitches that does not swing;
     * the accent belongs to the *and*, and that is true of nothing else in this
     * generator, which is why it is a solo-vocabulary number rather than a
     * property of the style.
     */
    const off = (slot % SLOTS_PER_BEAT) !== 0;
    const velocity = clamp(
      (0.5 + 0.28 * args.energy) * args.intensity
        * (off ? 1 + vocab.offbeatAccent * 0.22 : 1 - vocab.offbeatAccent * 0.1)
        * rng.float(0.95, 1.05),
      0.25, 1,
    );

    notes.push({ beat, duration, midi, velocity });
    if (first === undefined) first = midi;
    prevPrev = prev;
    prevChord = chord;
    prev = midi;
    lastSlot = slot;
  }

  /**
   * Ornaments thicken as the break builds.
   *
   * A grace note adds an onset, so scaling the rate by the energy is the arc
   * expressed in the one vocabulary this genre actually has. An accordionist
   * decorates more heavily as the break goes on for exactly the same reason a
   * horn player plays more notes: that is what building sounds like on an
   * instrument whose idiom is decoration rather than invention.
   */
  if (vocab.ornament > 0) {
    ornament(
      notes, args.scaleFor, args.chordAt, args.startBeat, range, rng,
      Math.min(1, vocab.ornament * (0.45 + args.energy)),
    );
  }

  return {
    notes,
    first: first ?? prev,
    last: prev,
    lastSlot,
    ...(prevPrev !== undefined ? { prevPrev } : {}),
    span: Math.max(cell.span, lastSlot - start + 1),
  };
}

/**
 * Choose one note.
 *
 * The same shape as `choosePitch` in `generate/melody.ts` — a narrow candidate
 * window, a stylistic score, then the rule table with graceful relaxation — and
 * deliberately not a call to it. What is being scored is different: the melody
 * asks which note best continues a singable line, and this asks which note best
 * serves the figure being developed and the chord it is about to land on. Every
 * weight below is one of those two questions.
 */
function choose(args: {
  scale: Scale;
  chord: Chord;
  prev: Midi;
  prevPrev?: Midi;
  prevChord?: Chord;
  /** A specific pitch this note wants to be — a guide tone or an enclosure. */
  preferred?: Midi;
  /** The cell's own step from the previous note, in scale degrees. */
  wanted?: number;
  height: number;
  range: [Midi, Midi];
  rng: Rng;
  strength: number;
  duration: number;
  beat: number;
  accompaniment: Accompaniment;
  strictness: number;
  rules: Rule[];
  agility: number;
  idiom: IdiomProfile;
  mode: Mode;
  tonic: Pc;
  vocab: SoloVocabulary;
}): Midi {
  const { scale, chord, prev, range, rng, vocab } = args;
  const [lo, hi] = range;
  const tones = new Set(chordPcs(chord));

  /**
   * Reach.
   *
   * The physical part is the instrument's, exactly as in the melody engine; the
   * extra semitone at the loose end is the solo's, because a soloist over
   * changes reaches further than a tune does and the axis should say so. It is
   * still a ceiling — a solo is freer, not unconstrained.
   */
  const reach = comfortableLeap(args.agility) + Math.max(0, 3 - args.strictness) + 1;

  const candidates = new Set<Midi>();
  for (let step = -5; step <= 5; step++) {
    const cand = stepInScale(scale, prev, step);
    if (cand >= lo && cand <= hi) candidates.add(cand);
  }
  for (const p of tones) {
    for (const oct of [-12, 0, 12]) {
      const cand = Math.floor(prev / 12) * 12 + p + oct;
      if (cand >= lo && cand <= hi) candidates.add(cand);
    }
  }
  if (vocab.chromatic > 0) {
    for (const d of [-2, -1, 1, 2]) {
      const cand = prev + d;
      if (cand >= lo && cand <= hi) candidates.add(cand);
    }
  }
  if (args.preferred !== undefined && args.preferred >= lo && args.preferred <= hi) {
    candidates.add(args.preferred);
  }

  const scored: (readonly [Midi, number])[] = [];
  for (const cand of candidates) {
    const semis = Math.abs(cand - prev);
    if (semis > reach && cand !== args.preferred) continue;

    let w = 1;
    const inScale = scale.pcs.includes(pc(cand));
    const isChordTone = tones.has(pc(cand));

    /**
     * The preference, when there is one, is nearly a decision.
     *
     * Nearly, and not entirely: a guide tone that breaks a rule at this
     * strictness has to be able to lose, or the whole constraint system stops
     * applying to the one layer under the spotlight.
     */
    if (args.preferred !== undefined) w *= cand === args.preferred ? 40 : 1;

    // The cell's shape. A figure that only *approximately* keeps its intervals
    // is not a restatement, so the falloff is steep.
    if (args.wanted !== undefined) {
      const err = Math.abs(scaleStepsBetween(scale, prev, cand) - args.wanted);
      w *= err === 0 ? 9 : err === 1 ? 1.4 : err === 2 ? 0.3 : 0.06;
    }

    // The arc, as a pull rather than a magnet.
    const err = cand - args.height;
    w *= Math.exp(-(err * err) / (2 * 9 * 9));

    // Harmony, by metric position. Strong beats want chord tones whatever the
    // rule level says; this is taste, and the rules are law.
    if (args.strength >= 3) w *= isChordTone ? 2.2 : 0.4;
    else if (args.strength >= 2) w *= isChordTone ? 1.35 : 0.9;

    // Chromaticism is a resource with a budget. Off it, the line is a scale
    // exercise; unbudgeted, it is a wrong note every second beat.
    if (!inScale && !isChordTone) w *= 0.12 + vocab.chromatic * 1.5;

    // Figuration, as in the melody engine: continuing a figure is what makes a
    // line sound played rather than assembled.
    if (semis === 0) w *= 0.3 + args.idiom.repeat * 0.4;
    else if (semis <= 2) w *= 2.4;
    else if (semis <= 4) w *= 1.1 + args.idiom.arpeggio * 0.6;
    else w *= 0.35;

    if (w > 0) scored.push([cand, w]);
  }

  if (!scored.length) return clampToRange(snapToScale(scale, prev), lo, hi);

  // Vetoes can empty the field — a bar where every reachable note breaks
  // something — so relax one level at a time rather than failing. Music that
  // obeys no rule beats music that stops.
  for (let level = args.strictness; level >= 1; level--) {
    const allowed: (readonly [Midi, number])[] = [];
    for (const [cand, w] of scored) {
      const verdict = evaluateRules(context(args, cand), level, args.rules);
      if (!verdict.vetoed && verdict.weight > 0) allowed.push([cand, w * verdict.weight]);
    }
    if (allowed.length) return rng.weighted(allowed);
  }
  return rng.weighted(scored);
}

function context(args: {
  scale: Scale; chord: Chord; prev: Midi; prevPrev?: Midi; prevChord?: Chord;
  mode: Mode; tonic: Pc; strength: number; duration: number; beat: number;
  accompaniment: Accompaniment; agility: number;
}, candidate: Midi): NoteContext {
  return {
    candidate,
    prev: args.prev,
    chord: args.chord,
    scale: args.scale,
    mode: args.mode,
    tonic: args.tonic,
    strength: args.strength,
    duration: args.duration,
    beat: args.beat,
    accompaniment: args.accompaniment,
    agility: args.agility,
    ...(args.prevPrev !== undefined ? { prevPrev: args.prevPrev } : {}),
    ...(args.prevChord !== undefined ? { prevChord: args.prevChord } : {}),
  };
}

/**
 * Grace notes and mordents.
 *
 * The entire content of an iskelmä instrumental break, and near-absent from a
 * jazz one — a bebop player's decoration is chromatic approach, not a crushed
 * note before the beat. Both are made by *splitting* a note rather than adding
 * one, so the line keeps its onsets and its phrasing and simply arrives with
 * more in front of it.
 */
function ornament(
  notes: NoteEvent[],
  scaleFor: (chord: Chord) => Scale,
  chordAt: (slot: number) => Chord,
  startBeat: number,
  [lo, hi]: [Midi, Midi],
  rng: Rng,
  amount: number,
): void {
  const grace = 1 / SLOTS_PER_BEAT;
  for (let i = notes.length - 1; i >= 0; i--) {
    const note = notes[i]!;
    if (note.duration < grace * 2.5 || !rng.chance(amount)) continue;
    /**
     * Never crush the note in front.
     *
     * A grace note is taken out of the note it decorates, not out of the one
     * before it — an ornament that leaves its predecessor an eighth of a beat
     * long has not decorated anything, it has manufactured a click. Swing makes
     * this worse rather than better, since it delays the offbeat and holds its
     * end fixed.
     */
    const before = notes[i - 1];
    if (before && before.beat + before.duration > note.beat - grace - 0.05) continue;
    const slot = Math.round((note.beat - startBeat) * SLOTS_PER_BEAT);
    const scale = scaleFor(chordAt(Math.max(0, slot)));

    if (rng.chance(0.55)) {
      // Grace: a crushed note a step away, immediately before the beat.
      const from = clampToRange(stepInScale(scale, note.midi, rng.chance(0.6) ? 1 : -1), lo, hi);
      if (from === note.midi) continue;
      notes.splice(i, 0, {
        beat: note.beat - grace,
        duration: grace * 0.9,
        midi: from,
        velocity: note.velocity * 0.72,
      });
    } else {
      // Mordent: the note, its upper neighbour, the note again. Three
      // sixteenths out of the front of a note that had room for them.
      const upper = clampToRange(stepInScale(scale, note.midi, 1), lo, hi);
      if (upper === note.midi) continue;
      const held = note.duration - grace * 2;
      note.beat += grace * 2;
      note.duration = held;
      notes.splice(i, 0,
        { beat: note.beat - grace * 2, duration: grace * 0.9, midi: note.midi, velocity: note.velocity },
        { beat: note.beat - grace, duration: grace * 0.9, midi: upper, velocity: note.velocity * 0.85 },
      );
    }
  }
  notes.sort((a, b) => a.beat - b.beat);
}

// ---------------------------------------------------------------------------
// Drum solos
// ---------------------------------------------------------------------------

export interface DrumSoloOptions {
  startBeat: number;
  beatsPerBar: number;
  /** Bars in the section, so the phrase grid knows where the form is. */
  bars: number;
  /** Bar spans the drummer has to themselves. */
  blocks: readonly BarSpan[];
  rng: Rng;
  intensity: number;
  /**
   * Land a crash on the downbeat after the last block, because the band comes
   * back in there. False when something else already owns that beat.
   */
  landing: boolean;
  /**
   * Every voice the style's own drum table writes, from which the *object* the
   * solo is played on is read. A caller that names none gets a kit.
   *
   * Not the voices the solo may use — the object it is played on, which is a
   * different and much smaller question. A style's table says what is in the
   * room; the vocabulary below says what a player does with it, and those two
   * have always disagreed on purpose. Jazz's `swing` writes `rd hh bd rim sh`
   * and names neither a snare nor a tom, while a jazz drum solo has stated its
   * figures on the snare and answered them down three toms since this function
   * was written — because a drummer sitting at a kit has a snare and toms
   * whether or not the tune asked for any. The same licence has to survive for
   * a darbuka: a solo reaching for a stroke the head never used is a soloist,
   * not a bug.
   *
   * So this is read for one bit: whether `drumStations` finds a kit in it. See
   * `orchestrationFor`.
   *
   * Optional, and the default is the one every drum solo in this project got
   * before the field existed, which is what makes adding it safe: a caller that
   * has not been taught to pass a table stages exactly the kit it staged
   * yesterday. `DrumTrack.source` is optional for the same reason and says so.
   */
  table?: Iterable<DrumVoice>;
}

/**
 * Which voice does which job, once it is known what the player is sitting at.
 *
 * This function named a trap kit in literals — snare, three toms, kick, hi-hat,
 * crash — and the indian author found the cost of that before anybody else did:
 * they took `drums` out of the solo rotation and set `tradeFours: 0`, which
 * deletes the *tani āvartanam* — a listed item on a Carnatic programme, where
 * the mridangam plays alone for ten minutes — and the *sawāl-jawāb*, which
 * their own note calls one of the two or three moments a live audience comes
 * for. They did that rather than have a tabla solo come out as a rock drum solo
 * on instruments that are not in the room, and they were right to: a missing
 * tani āvartanam is a gap, and one played on a Ludwig is a mistake with a
 * reason behind it.
 *
 * Arabic did not opt out and so it is the measurement. Its rotation carries
 * `drums: 2` and `tradeFours: 0.3`, and every one of its styles but `saidi` and
 * `zaffa` writes a table of nothing but `lp`/`hp`/`mp` and a riq on `tb`. A
 * `dabke` drum chorus at seed `solo-3` came out with eight voices in it —
 * `sd bd hh ht mt lt cr` and a shaker — sixteen bars of trap kit in a takht,
 * which then conscripted a full acoustic kit onto the stage to be played,
 * because `drumStations` reads the events and the events said drum kit.
 *
 * ## The tier is not decided here
 *
 * `STATION_OF` in `concert/instruments.ts` already answers *which object does
 * this voice need*, in three tiers — `kit`, `hand`, and the `either` that
 * covers the tambourine and the shaker sitting at both stations — and inventing
 * a second answer beside it is how the two would drift. `drumStations` is the
 * seam casting and choreography already read, this is the third reader, and the
 * rule it hands back is the same one they use: **the kit has first claim.**
 *
 * That decides the case worth being explicit about. A third of the tables that
 * write hand voices write kit voices in the same bar — funk's `congas`, latin's
 * `cumbia-kit`, reggae's `roots-rockers` — and those are not one player
 * choosing an instrument, they are two people. When both are on the stage the
 * chorus belongs to the drummer at the kit: it is what a funk band does, it is
 * what `Section.solo.instrument` already claims in as many words, and it leaves
 * the percussionist doing what a percussionist does behind a drum solo, which
 * is keep playing. A hand-drum solo happens where there is no kit to hand it
 * to, which is exactly the room this was broken in.
 *
 * ## What generalises, and what does not
 *
 * The shapes are not the voices. Four of the five gestures here are about a
 * *drum* rather than about a kit and survive the move intact:
 *
 *  - **State, then answer.** An idea on the ordinary stroke, the same idea with
 *    its offbeats moved onto other surfaces. Snare answered by toms; open tone
 *    answered by slap and doum. Identical gesture, different object.
 *  - **A run down the drum.** `ht`→`mt`→`lt` is three drums in a row and
 *    `hp`→`mp`→`lp` is three places on one head, and `core/types.ts` says
 *    outright that the second was named to be the first one family over.
 *  - **Weight under the phrase.** The kick is a foot on another object and the
 *    doum is the same hand as everything else, and that difference is real —
 *    but *dropping weight where the phrase wants it* is the gesture, and both
 *    instruments have a voice for it. `DEFAULT_DRUM_MIX` puts `lp` a fifth
 *    under `bd` and above the toms for this exact reason: it is the pulse.
 *  - **A run-in to the ending.** So the last note is arrived at rather than
 *    merely struck. A snare roll on a kit; alternating fingers on a hand drum,
 *    which is what a roll *is* there.
 *
 * Two are genuinely kit-only and are simply absent on the other station:
 *
 *  - **The left foot on the hi-hat.** Not a timekeeping decision — a *limb*.
 *    `ARCHETYPES.handdrum` has no `pedal` in its points at all, and
 *    `concert/choreograph.ts` says a hand drummer's feet do nothing. What keeps
 *    the form audible instead is the doum on the first of each phrase, which is
 *    the marker the cycle is counted from in every tradition that plays these
 *    drums.
 *  - **The crash.** A cymbal rings and a skin does not, so there is no honest
 *    substitution for it; a hand drum ends a phrase with its brightest stroke
 *    and lands the band with its lowest. This is why `a drum solo lands the
 *    band back in` stays true of every kit style — the crash is still there,
 *    for everyone who owns one.
 */
interface SoloOrchestration {
  /** The stroke a figure is stated on: neutral, and the one there is most of. */
  ordinary: DrumVoice;
  /** The surfaces an answer runs down, high to low. */
  ladder: readonly DrumVoice[];
  /** The accent dropped under the phrase where it wants weight. */
  weight: DrumVoice;
  /** A spare limb marking two and four, where the player has one to spare. */
  pulse?: DrumVoice;
  /** What closes a phrase an eighth before it ends. */
  punctuation: DrumVoice;
  /** The run-in to the hand-off, cycled a slot at a time. */
  roll: readonly DrumVoice[];
  /**
   * The hand-off itself, with the levels it is always played at.
   *
   * Fixed rather than drawn, because it is a fixed gesture: this is the loudest
   * moment in the solo and the one the audience is actually waiting for.
   */
  land: readonly (readonly [DrumVoice, number])[];
  /**
   * Whether two strokes written at one instant are one player or a mistake.
   *
   * A kick under a snare is a foot and a hand; a crash over a snare is two
   * sticks' worth of kit. One skin has neither: two voices at the same instant
   * there are two hands landing on the same head, which is a flam played by
   * accident. `handPart` will stage it — it has to, the record is total — and
   * its own comment says a hand-drum part with simultaneous voices is a part
   * with a mistake in it. So on one skin the later stroke *replaces* the
   * earlier rather than joining it, which is also the order a player decides
   * them in: the figure is what the hands are playing, and an accent is the
   * decision to play a different stroke at that point instead.
   */
  oneSkin: boolean;
}

const TRAP_KIT: SoloOrchestration = {
  ordinary: 'sd',
  ladder: ['ht', 'mt', 'lt'],
  weight: 'bd',
  pulse: 'hh',
  punctuation: 'cr',
  roll: ['sd'],
  land: [['cr', 0.95], ['bd', 0.9]],
  oneSkin: false,
};

/**
 * One drum, two hands, three strokes — and the three strokes doing five jobs.
 *
 * A hand drum cannot field seven voices and should not be asked to. What it has
 * is a full low tone in the middle of the head, a ringing tone at the edge and a
 * pinched crack with the hand left lying on the skin, and the assignment below
 * is the one every tradition that plays them already made:
 *
 *  - **`mp` states.** The open ringing tone is the ordinary stroke of the
 *    instrument — the tek, the na, the conga's open tone — and it is what most
 *    of any phrase is made of. Putting the doum here instead was the first
 *    draft and it is wrong on paper before it is wrong by ear: the figure
 *    states its strong slots on the ordinary stroke, so a doum there is a bar
 *    of eight doums and no pulse left to accent.
 *  - **`hp` answers and punctuates.** The slap is the brightest, driest and
 *    most cutting of the three, which is what a phrase ending wants — and
 *    `…ka-TEK | DOUM` across the barline is the commonest close there is.
 *  - **`lp` carries the weight and lands the band.** The doum is the pulse of
 *    the bar, so it is both the accent under the phrase and the arrival at the
 *    end of it, and both of those are one stroke because the instrument only
 *    has the one.
 *
 * The ladder keeps all three. A run down a hand drum uses the whole drum — that
 * is what makes it a run — and unlike the kit's, where the snare stands outside
 * the toms, here the ordinary stroke is a rung of the same ladder. It is one
 * object; that is the entire point of the tier.
 */
const HAND_DRUM: SoloOrchestration = {
  ordinary: 'mp',
  ladder: ['hp', 'mp', 'lp'],
  weight: 'lp',
  punctuation: 'hp',
  roll: ['mp', 'hp'],
  land: [['lp', 0.95]],
  oneSkin: true,
};

/** Which of the two, from the style's table. See `SoloOrchestration`. */
function orchestrationFor(table: Iterable<DrumVoice> | undefined): SoloOrchestration {
  if (!table) return TRAP_KIT;
  return drumStations(table).kit ? TRAP_KIT : HAND_DRUM;
}

/**
 * A drum solo.
 *
 * Shares its vocabulary with `generate/fills.ts` and none of its scale. A fill
 * is a delivery — one or two beats, aimed at the next downbeat — and a solo is
 * a form being played with no harmony stating it, which changes four things:
 *
 *  - **Phrases in two- and four-bar units.** The form is still running
 *    underneath even when nothing is spelling it out, and a drummer who loses
 *    it has not soloed, they have stopped playing the tune.
 *  - **Orchestration around the drum.** An idea stated on the ordinary stroke,
 *    answered on the surfaces beside it, punctuated on the brightest thing in
 *    reach. A drum solo that stays on one voice is a drum roll.
 *  - **A build.** Density and velocity rise across the section, the same arc
 *    the melodic solo takes and for the same reason.
 *  - **An ending that lands.** A crash on the downbeat as the band returns, or
 *    a doum where there is no cymbal. The hand-off is the part the audience
 *    hears; get it wrong and the solo sounds like it was interrupted rather
 *    than finished.
 *
 * Something marks the form under all of it — the drummer's left foot on two and
 * four, or the doum on the first of each phrase for a player with no feet to
 * spare. It costs one line either way, and it is the difference between a solo
 * you can still hear the form through and a burst of noise.
 *
 * *Which* drum, and therefore which voices, comes from `opts.table` and is the
 * whole of `SoloOrchestration`. Everything below is written in terms of jobs —
 * state, answer, weight, punctuate, land — and none of it names an object.
 */
export function generateDrumSolo(opts: DrumSoloOptions): DrumEvent[] {
  const { startBeat, beatsPerBar, bars, rng, intensity } = opts;
  const slotsPerBar = beatsPerBar * SLOTS_PER_BEAT;
  const totalSlots = bars * slotsPerBar;
  const out: DrumEvent[] = [];
  if (!opts.blocks.length) return out;

  const orch = orchestrationFor(opts.table);

  /**
   * Where each slot's stroke ended up, so a one-skin station can overwrite it.
   *
   * Only kept for a player who has one surface. On a kit the map is never
   * written and every path below behaves exactly as it did before this
   * function could be pointed at anything else. See `SoloOrchestration.oneSkin`.
   */
  const struck = new Map<number, number>();

  const at = (slot: number, voice: DrumVoice, velocity: number) => {
    const event: DrumEvent = {
      beat: startBeat + slot / SLOTS_PER_BEAT,
      voice,
      velocity: Math.max(0.05, Math.min(1, velocity)),
    };
    const already = orch.oneSkin ? struck.get(slot) : undefined;
    if (already !== undefined) {
      out[already] = event;
      return;
    }
    if (orch.oneSkin) struck.set(slot, out.length);
    out.push(event);
  };

  /** Rising across the whole section, so trading blocks build on each other. */
  const energyAt = (slot: number) => 0.45 + 0.55 * (slot / Math.max(1, totalSlots));

  /** The running idea: onsets within a phrase, in sixteenths. */
  let figure: number[] | undefined;

  for (const [fromBar, toBar] of opts.blocks) {
    for (let bar = fromBar; bar < toBar; bar += 2) {
      const phraseBars = Math.min(2, toBar - bar);
      const phraseStart = bar * slotsPerBar;
      const phraseSlots = phraseBars * slotsPerBar;
      const energy = energyAt(phraseStart);
      const closing = bar + phraseBars >= toBar;

      /**
       * State, then answer.
       *
       * The first phrase of a block invents a figure and plays it on the
       * ordinary stroke; the next plays the same figure down the ladder. That
       * call-and-response around the instrument is what a drum solo is made of,
       * and it is the same develop-the-cell idea the melodic solo uses, with
       * orchestration standing in for pitch.
       */
      const running = figure;
      const fresh = running === undefined || rng.chance(0.35);
      figure = fresh ? inventFigure(rng, phraseSlots, energy) : developFigure(running, rng, phraseSlots);
      const answering = !fresh;

      /**
       * The ordinary stroke keeps the beats and the ladder takes what falls
       * between them.
       *
       * Both halves of the call and response are orchestrated, just in
       * different proportions — the statement is snare-led with the toms
       * colouring its offbeats, the answer moves the offbeats onto the toms
       * wholesale. Before the statement had any toms in it at all, a dense
       * phrase came out as sixteen consecutive snare hits, which is not a drum
       * solo, it is a press roll with gaps in it.
       *
       * Read it on a darbuka and it is the same sentence: the statement is
       * tek-led with the slap and the doum colouring its offbeats, and the
       * answer moves them onto the whole drum.
       */
      let rung = 0;
      for (const offset of figure) {
        if (offset >= phraseSlots) break;
        const slot = phraseStart + offset;
        const strong = offset % SLOTS_PER_BEAT === 0;
        const voice: DrumVoice = !strong && (answering || rng.chance(0.3))
          ? orch.ladder[rung++ % orch.ladder.length]!
          : orch.ordinary;
        at(slot, voice, (0.55 + 0.35 * energy) * intensity * (strong ? 1 : 0.82));
      }

      // The weight punctuates rather than keeps time — a drummer soloing drops
      // the foot in where the phrase wants it, not on every beat, and a hand
      // drummer leans on a doum in the same places for the same reason.
      for (let beat = 0; beat < phraseBars * beatsPerBar; beat++) {
        if (!rng.chance(0.22 + 0.25 * energy)) continue;
        at(phraseStart + beat * SLOTS_PER_BEAT, orch.weight, (0.6 + 0.3 * energy) * intensity);
      }

      /**
       * The left foot, marking two and four — or, for a player with no feet in
       * the argument, the first of the phrase.
       *
       * This is what keeps the form audible with nothing else stating it, and
       * the two versions of it are the same claim about different bodies. A
       * drummer has a limb spare and spends it on the hat every other beat. A
       * hand drummer has two hands and both are on the skin, so the form is
       * marked the way these traditions have always marked it: the phrase
       * begins on the low stroke, and everyone counts from there. It is written
       * after the weight above so that it cannot be the one that gets dropped —
       * on one skin the later stroke wins, and this is the stroke that matters.
       */
      if (orch.pulse) {
        for (let beat = 1; beat < phraseBars * beatsPerBar; beat += 2) {
          at(phraseStart + beat * SLOTS_PER_BEAT, orch.pulse, 0.34 * intensity);
        }
      } else {
        at(phraseStart, orch.weight, (0.6 + 0.3 * energy) * intensity);
      }

      /**
       * A crash to close a phrase, once the solo is properly under way — but
       * never the one immediately before the hand-off. Two crashes half a beat
       * apart do not read as an emphatic ending, they read as a mistake, and
       * the one that matters is the one the band comes back on.
       *
       * A skin has nothing that rings, so where there is no cymbal this is the
       * slap on the last eighth instead: the phrase is closed by the brightest
       * stroke on the drum, and the next one opens on the lowest.
       */
      const handsOff = closing && opts.landing && toBar === opts.blocks[opts.blocks.length - 1]![1];
      if (!handsOff && (closing || (energy > 0.7 && rng.chance(0.45)))) {
        at(phraseStart + phraseSlots - 2, orch.punctuation, (0.6 + 0.3 * energy) * intensity);
      }
    }
  }

  /**
   * The hand-off.
   *
   * A crash on the downbeat the band comes back in on, at the top of the range,
   * because this is the loudest thing in the solo and the moment the audience
   * is actually waiting for. Placed at the section boundary, which belongs to
   * whatever follows — the same convention `landing()` in `generate/fills.ts`
   * uses, and for the same reason.
   *
   * On a hand drum it is a doum in the same place, arrived at by the fingers
   * rather than by a stick, and it is the only ending available: nothing on the
   * instrument rings, so the arrival has to be the lowest and loudest stroke on
   * it rather than a cymbal left to decay under the band.
   */
  if (opts.landing) {
    const end = opts.blocks[opts.blocks.length - 1]![1] * slotsPerBar;
    // A run-in, so the arrival is arrived at rather than merely struck.
    // Whatever the last phrase left in this beat is replaced: the ending is a
    // fixed gesture and half of it played twice is a stumble.
    for (let i = out.length - 1; i >= 0; i--) {
      if (out[i]!.beat >= startBeat + (end - SLOTS_PER_BEAT) / SLOTS_PER_BEAT - 1e-6) out.splice(i, 1);
    }
    // Those indices are now wrong, and nothing below writes a slot twice —
    // the run-in walks one slot at a time and the arrival is the slot after it.
    struck.clear();
    for (let s = SLOTS_PER_BEAT; s >= 1; s--) {
      const rung = (SLOTS_PER_BEAT - s) % orch.roll.length;
      at(end - s, orch.roll[rung]!, (0.7 + (SLOTS_PER_BEAT - s) * 0.07) * intensity);
    }
    for (const [voice, level] of orch.land) at(end, voice, Math.min(1, level * intensity));
  }
  return out.sort((a, b) => a.beat - b.beat);
}

/** A phrase's worth of onsets, denser as the solo builds. */
function inventFigure(rng: Rng, phraseSlots: number, energy: number): number[] {
  const out: number[] = [];
  const step = rng.weighted([[2, 5], [1, energy > 0.7 ? 3 : 1], [3, 2]] as const);
  for (let slot = 0; slot < phraseSlots; slot += step) {
    // Holes are what make it a phrase rather than a roll.
    if (slot > 0 && rng.chance(0.42 - 0.22 * energy)) continue;
    out.push(slot);
  }
  return out.length >= 2 ? out : [0, Math.floor(phraseSlots / 2)];
}

/** Fragment, displace or double the running figure. The same four verbs. */
function developFigure(figure: number[], rng: Rng, phraseSlots: number): number[] {
  const how = rng.weighted([['state', 3], ['fragment', 3], ['displace', 2], ['double', 2]] as const);
  switch (how) {
    case 'fragment':
      return figure.slice(0, Math.max(2, Math.ceil(figure.length / 2)));
    case 'displace': {
      const by = rng.weighted([[1, 2], [2, 3], [-1, 1]] as const);
      return figure.map((s) => s + by).filter((s) => s >= 0 && s < phraseSlots);
    }
    case 'double': {
      const out: number[] = [];
      for (const s of figure) { out.push(s); if (s + 1 < phraseSlots) out.push(s + 1); }
      return out;
    }
    default:
      return figure;
  }
}

// ---------------------------------------------------------------------------
// Backing
// ---------------------------------------------------------------------------

/**
 * Thin the comp so it answers the soloist instead of running its pattern.
 *
 * This is the change that most makes a solo sound like a solo rather than like
 * a different melody over the same accompaniment, and it is deliberately a
 * *transformation* of the written comp rather than a second comp generator: the
 * band is playing the same figure, less of it, later. Three moves, all of them
 * what a pianist actually does behind a horn —
 *
 *  - **drop hits**, because the holes are where the soloist lives;
 *  - **displace what survives** off the beat it was written on;
 *  - **thin the voicing to its top**, which is where the guide tones are and
 *    where a comper's right hand is.
 */
export function compBehindSolo(notes: NoteEvent[], rng: Rng): NoteEvent[] {
  if (!notes.length) return notes;
  const byOnset = new Map<number, NoteEvent[]>();
  for (const n of notes) {
    const key = Math.round(n.beat * 1000);
    const arr = byOnset.get(key);
    if (arr) arr.push(n);
    else byOnset.set(key, [n]);
  }

  const out: NoteEvent[] = [];
  const onsets = [...byOnset.keys()].sort((a, b) => a - b);
  for (let i = 0; i < onsets.length; i++) {
    const chord = byOnset.get(onsets[i]!)!;
    // A comper behind a soloist plays about half of what they would play
    // behind the head. Below that it stops sounding like comping and starts
    // sounding like a fault.
    if (!rng.chance(0.55)) continue;

    const nextBeat = i + 1 < onsets.length ? onsets[i + 1]! / 1000 : Infinity;
    const shift = rng.chance(0.35) ? 0.5 : 0;
    const beat = chord[0]!.beat + shift;
    if (beat + 0.1 >= nextBeat) continue;

    // Keep the top of the stack: the third and seventh live up there, and the
    // root is the bass player's job.
    const sorted = chord.slice().sort((a, b) => b.midi - a.midi);
    const keep = sorted.slice(0, Math.max(2, sorted.length - 1));
    for (const n of keep) {
      out.push({
        ...n,
        beat,
        duration: Math.min(n.duration, Math.max(0.25, nextBeat - beat - 0.05)),
        velocity: n.velocity * 0.86,
      });
    }
  }
  return out;
}

/**
 * Move the kit to where it belongs behind this soloist.
 *
 * Not a different pattern — the same pattern, played on different surfaces,
 * which is what actually happens. A jazz drummer behind a blowing chorus moves
 * the time from the hats to the ride and leaves everything else where it was;
 * behind a bass solo they pick up brushes, and the difference between a bass
 * solo you can hear and one you cannot is entirely that decision.
 */
export function drumsBehindSolo(events: DrumEvent[], policy: BackingPolicy): DrumEvent[] {
  if (policy === 'comping') {
    return events.map((e) => (e.voice === 'hh' || e.voice === 'oh'
      ? { ...e, voice: 'rd' as DrumVoice, velocity: e.velocity * 0.95 }
      : e));
  }
  if (policy === 'sparse') {
    /**
     * Brushes, via the shaker.
     *
     * Every drum bank the preview can reach is a drum machine and none of them
     * has a brush sample, which is why `sh` exists in `DrumVoice` at all — it
     * is the softest sustained-noise voice available and it stands in. The MIDI
     * render maps it to GM channel 10 where a decent soundfont does have
     * brushes.
     */
    const swap: Partial<Record<DrumVoice, DrumVoice>> = {
      sd: 'sh', cp: 'sh', cr: 'sh', oh: 'sh', hh: 'sh', rd: 'sh',
      lt: 'sh', mt: 'sh', ht: 'sh',
    };
    return events
      .map((e) => ({ ...e, voice: swap[e.voice] ?? e.voice, velocity: e.velocity * 0.62 }));
  }
  return events;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
