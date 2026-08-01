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
 * Thirds and sixths rather than unisons and octaves — which is a statement about
 * *this* device rather than about doubling in general. A third is two lines and an
 * octave is one line played twice, so the two are different gestures and want
 * different rules; the octave one is `joinIn` below, and it has to declare itself.
 */
export function harmonise(
  melody: readonly NoteEvent[],
  from: number,
  to: number,
  below: number,
  /**
   * The note's own beat is handed to the caller because the harmony has to be
   * measured against the chord sounding *there*: a span four bars wide is
   * several chords, and a third taken off the first of them is not a third
   * against the rest.
   */
  step: (midi: number, steps: number, beat: number) => number,
  [lo, hi]: [number, number],
): NoteEvent[] {
  const out: NoteEvent[] = [];
  for (const n of melody) {
    if (n.beat < from - 1e-6 || n.beat >= to - 1e-6) continue;
    const midi = step(n.midi, -below, n.beat);
    if (midi < lo || midi > hi) continue;
    out.push({ beat: n.beat, duration: n.duration, midi, velocity: n.velocity * 0.82 });
  }
  return out;
}

/**
 * Two players on the same line.
 *
 * `harmonise` above is the arranger's other answer to "what do the two horns do
 * together", and for a long time it was the only one this project would allow: a
 * doubling at the octave is one line played twice, the checks call that a fault,
 * and so the head was never once stated the way this repertoire actually states
 * heads — trumpet and tenor on the tune, in octaves, nobody harmonising anybody.
 *
 * The objection was aimed at the wrong thing. What makes an octave doubling mud is
 * that it is *incidental*: one note of an answering line landing on the tune,
 * fusing two parts into one for a beat and then separating again, which the ear
 * reads as a mistake because it is one. A whole phrase in octaves is not that. It
 * has a beginning, it has both players arriving on it together, and the ear reads
 * it as weight rather than as blur.
 *
 * Hence the two conditions this function enforces and `undoubleAgainst` trusts:
 * it takes a *span* rather than notes, and every note it returns carries
 * `doubling: 'lead'`. An unmarked note on the tune is still a fault everywhere it
 * was before. A marked one is the arrangement.
 *
 * The octave is chosen away from the line's own register rather than fixed, so a
 * counter instrument sitting under the lead doubles below it and one sitting above
 * doubles above, instead of both being dragged to the same octave as the tune —
 * which would be the one case where this really is one line played twice.
 */
export function joinIn(
  melody: readonly NoteEvent[],
  from: number,
  to: number,
  atOctave: boolean,
  [lo, hi]: [number, number],
): NoteEvent[] {
  const taken = melody.filter((n) => n.beat >= from - 1e-6 && n.beat < to - 1e-6);
  if (taken.length < 3) return [];

  /**
   * Which octave, decided by what fits rather than by arithmetic on the mean.
   *
   * The first version computed one transposition from the average pitch and
   * dropped the whole span if any single note fell outside the second player's
   * range — which discarded most of them, because a tune's mean sits comfortably
   * inside a window that its highest note does not. Searching instead costs three
   * comparisons and is also the more honest model: a player asked to take the head
   * with somebody picks the octave they can actually play it in.
   *
   * Order of preference is the device's own. At pitch is the tightest version and
   * the one that most sounds like one instrument, so `atOctave` false tries it
   * first; either way the fallbacks are ±1 before ±2, because a tune two octaves
   * off is no longer the same line in a second voice, it is a piccolo part.
   */
  const wanted = atOctave ? [-1, 1, 0, -2, 2] : [0, -1, 1, -2, 2];
  const low = Math.min(...taken.map((n) => n.midi));
  const high = Math.max(...taken.map((n) => n.midi));
  const octaves = wanted.find((o) => low + o * 12 >= lo && high + o * 12 <= hi);
  if (octaves === undefined) return [];

  return taken.map((n) => ({
    ...n,
    midi: n.midi + octaves * 12,
    // Under the lead rather than beside it: the tune is still the tune, and the
    // second player is agreeing with it rather than competing to state it.
    velocity: n.velocity * 0.88,
    doubling: 'lead' as const,
  }));
}

/**
 * Hand a phrase to somebody else.
 *
 * The answering line otherwise lives in the holes of the tune — it finds the largest
 * silence in each bar and speaks into it, which is a fill however well it is shaped.
 * Trading is the other thing two melodic players do, and it is the one the ear reads
 * as a conversation: the lead states a phrase and then *stops*, and the second
 * instrument has the floor for two bars. Only the drummer could do that here, and
 * only inside a solo.
 *
 * What gets handed over is the phrase just heard, moved into the other player's
 * register by whole octaves. Octaves rather than a transposition, because the point
 * is that it is recognisably the same phrase coming back in a different voice — the
 * answer *is* the quotation, and a version at some other interval would be a new idea
 * arriving at the moment the listener is waiting for a reply.
 */
export function handOff(
  model: readonly NoteEvent[],
  fromBeat: number,
  toBeat: number,
  atBeat: number,
  [lo, hi]: [number, number],
): NoteEvent[] {
  const taken = model.filter((n) => n.beat >= fromBeat - 1e-6 && n.beat < toBeat - 1e-6);
  if (taken.length < 2) return [];

  const shift = atBeat - taken[0]!.beat;
  const mean = taken.reduce((sum, n) => sum + n.midi, 0) / taken.length;
  const centre = (lo + hi) / 2;
  const octaves = Math.round((centre - mean) / 12);

  return taken
    .map((n) => ({
      ...n,
      beat: n.beat + shift,
      midi: n.midi + octaves * 12,
      velocity: Math.min(1, n.velocity * 0.95),
    }))
    .filter((n) => n.midi >= lo && n.midi <= hi && n.beat < atBeat + (toBeat - fromBeat) - 1e-6);
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
