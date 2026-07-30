/**
 * The band, patched against the finished tune.
 *
 * Every other pass in this engine writes the melody *around* an accompaniment that
 * was decided first. This one runs the other way: the tune exists, and the rhythm
 * section is edited to agree with it. That is what an arranger does and what a
 * generator almost never does, because the accompaniment is usually written by a
 * pattern that cannot be told about anything.
 *
 * Two operations, and both are deliberately small. The failure mode here is not
 * subtlety, it is a band that follows the tune everywhere — which stops being an
 * arrangement and becomes a doubling, and takes the groove with it. So the patch is
 * capped at a couple of moments per section, and it never adds or removes a bass
 * onset: it moves one, by an eighth at most, keeping its pitch.
 *
 * **Accent agreement.** Where the tune leans hard on a note just before a beat — an
 * anticipated downbeat, the most characteristic gesture in this repertoire — the
 * bass moves onto that eighth with it. One player pushing is a player; the band
 * pushing together is an arrangement.
 *
 * **A hole at the peak.** The comp stops for the second half of the bar carrying the
 * section's highest note. Nothing else in the project can express "get out of the
 * way", and it is the cheapest way there is to make a high note sound like an event
 * rather than like a note that happens to be high.
 */

import type { NoteEvent } from '../core/types.js';

export interface PatchOptions {
  /** The finished tune for this section. */
  melody: readonly NoteEvent[];
  bass: NoteEvent[];
  comp: NoteEvent[];
  beatsPerBar: number;
  /** Absolute beat where the section starts. */
  startBeat: number;
  bars: number;
  /**
   * How far the arranger goes, 0..1. Zero leaves both parts untouched, which is what
   * every section that is not making a point should get.
   */
  amount: number;
}

export interface Patch {
  bass: NoteEvent[];
  comp: NoteEvent[];
  /** What was done, for a report or a printed plan. */
  moves: string[];
}

export function patchBand(opts: PatchOptions): Patch {
  const moves: string[] = [];
  if (opts.amount <= 0 || !opts.melody.length) {
    return { bass: opts.bass, comp: opts.comp, moves };
  }

  const bass = agree(opts, moves);
  const comp = hole(opts, moves);
  return { bass, comp, moves };
}

/**
 * Move the bass onto the tune's anticipations.
 *
 * An anticipation is a note that lands an eighth or a sixteenth before a beat and
 * carries more weight than the beat it displaces — which is exactly what the tune
 * engine's accent field records, so no guessing is needed. The bass note that would
 * have played *on* that beat moves back to meet it.
 *
 * At most two per section. The third one stops being an arrangement decision and
 * starts being a different bass pattern.
 */
function agree(opts: PatchOptions, moves: string[]): NoteEvent[] {
  const { melody, bass, beatsPerBar, startBeat, bars } = opts;
  if (!bass.length) return bass;

  const step = 1 / 2;                      // an eighth, in beats
  const budget = Math.max(1, Math.round(opts.amount * 2));
  const out = bass.map((n) => ({ ...n }));
  let used = 0;

  /**
   * Beats the tune anticipates: a strong note sitting an eighth or a sixteenth before
   * one.
   *
   * "Strong" measured against this section rather than against an absolute, because
   * by the time the patch runs `applyDynamics` has already scaled every velocity by
   * how hard the section is playing — an absolute threshold made the whole operation
   * dead code in twelve songs out of twelve.
   */
  const loud = melody.map((n) => n.velocity).sort((a, b) => b - a);
  const strong = loud[Math.floor(loud.length * 0.25)] ?? 1;

  const candidates = melody
    .map((n) => {
      const local = n.beat - startBeat;
      if (local < beatsPerBar || local > (bars - 1) * beatsPerBar) return undefined;  // not the seams
      if (n.velocity < strong) return undefined;
      for (const ahead of [step, step / 2]) {
        if (Math.abs(Math.round(n.beat + ahead) - (n.beat + ahead)) < 1e-6) {
          return { note: n, ahead };
        }
      }
      return undefined;
    })
    .filter((c): c is { note: NoteEvent; ahead: number } => c !== undefined)
    .sort((a, b) => b.note.velocity - a.note.velocity);

  for (const { note: n, ahead } of candidates) {
    if (used >= budget) break;
    const beat = n.beat + ahead;
    const onBeat = out.find((b) => Math.abs(b.beat - beat) < 1e-6);
    if (!onBeat) continue;
    // Only where there is room to move into: a bass note already sounding on the
    // eighth means the pattern is busy there and moving one onto another is a
    // collision rather than an agreement.
    if (out.some((b) => Math.abs(b.beat - n.beat) < 1e-6)) continue;
    onBeat.beat = n.beat;
    onBeat.duration += ahead;
    used++;
    moves.push(`bass pushes with the tune at ${n.beat.toFixed(2)}`);
  }
  return out;
}

/**
 * The rhythm of a band figure, in sixteenths from the start of a bar.
 *
 * Taken from the section's own hook rather than invented, because a tutti that plays
 * something nobody has heard is a fanfare and a tutti that plays *the hook* is an
 * arrangement. Fragmented to what a whole band can hit together: three or four
 * attacks, quantised to eighths, because five players landing on a sixteenth is not
 * an ensemble figure, it is a smear.
 */
export function figureSlots(
  onsets: readonly { at: number; dur: number }[], slotsPerBar: number,
): number[] {
  const inBar = onsets
    .filter((o) => o.at >= 0 && o.at < slotsPerBar)
    .map((o) => Math.round(o.at / 2) * 2);
  const unique = [...new Set(inBar)].sort((a, b) => a - b);
  // A figure has to start where the bar does, or the band is answering something.
  if (unique[0] !== 0) unique.unshift(0);
  return unique.slice(0, 4);
}

/**
 * A line in parallel thirds or sixths under the tune.
 *
 * The deliberate half of a question this project otherwise only answers negatively:
 * the arranger spends real effort keeping the accompaniment *off* the melody, and
 * `npm run genres` forbids the answering line from doubling it at the unison or the
 * octave outright. All of that is right about an accident and wrong about a decision.
 * Two horns in thirds is one of the most characteristic sounds in this repertoire,
 * and the only thing separating it from mud is that it is sustained and parallel
 * rather than momentary and incidental.
 *
 * Thirds and sixths rather than unisons and octaves, and that is not timidity. A
 * doubling at the octave *is* one line played twice, which is why the checks call it
 * a fault; a third is two lines. True unison doubling already exists in this project
 * where it belongs — the `unison` mode of a two-handed player's left hand, which is
 * one instrument and therefore one voice.
 */
export function harmonise(
  melody: readonly NoteEvent[],
  from: number,
  to: number,
  below: number,
  step: (midi: number, steps: number) => number,
  [lo, hi]: [number, number],
): NoteEvent[] {
  const out: NoteEvent[] = [];
  for (const n of melody) {
    if (n.beat < from - 1e-6 || n.beat >= to - 1e-6) continue;
    const midi = step(n.midi, -below);
    if (midi < lo || midi > hi) continue;
    out.push({ beat: n.beat, duration: n.duration, midi, velocity: n.velocity * 0.82 });
  }
  return out;
}

/**
 * Take the comp out for half a bar under the section's high note.
 *
 * The second half of the bar rather than the whole of it: the chord still arrives,
 * and then the room opens underneath the note the section was climbing towards. A
 * bar of silence would be a stop-time break, which is a different and much larger
 * gesture than this is trying to make.
 */
function hole(opts: PatchOptions, moves: string[]): NoteEvent[] {
  const { melody, comp, beatsPerBar, startBeat, bars } = opts;
  if (!comp.length || opts.amount < 0.55 || bars < 4) return comp;

  const peak = melody.reduce((a, b) => (b.midi > a.midi ? b : a));
  const bar = Math.floor((peak.beat - startBeat) / beatsPerBar);
  if (bar < 1 || bar >= bars - 1) return comp;   // not the first bar, not the cadence

  const from = startBeat + bar * beatsPerBar + beatsPerBar / 2;
  const to = startBeat + (bar + 1) * beatsPerBar;
  const kept = comp.filter((n) => n.beat < from - 1e-6 || n.beat >= to - 1e-6);
  if (kept.length === comp.length) return comp;

  moves.push(`comp clears bar ${bar + 1} under the peak`);
  return kept;
}
