/**
 * The timing grid every renderer agrees on.
 *
 * A `NoteEvent.beat` is a real number — swing is baked into it before rendering
 * (`generate/song.ts`), phrases start on pickups, and nothing in the generator
 * rounds anything. Renderers, on the other hand, have grids: the Strudel
 * renderer lays notes out on sixteenths and writes mini-notation, because a
 * pattern language needs slots.
 *
 * That rounding used to live inside `render/strudel.ts` as a bare
 * `Math.round(beat * 4)`, which was fine while audio was the only consumer.
 * It stopped being fine the moment a second renderer had to line up with the
 * first: the concert stage animates hands from the IR, and a hand that arrives
 * on the un-rounded beat while the sample fires on the rounded one is visibly
 * wrong on exactly the notes the ear is most sensitive to.
 *
 * Worked example, and the reason this file exists rather than a comment. At
 * `swing: 0.15` an offbeat eighth is delayed by 0.075 beats — 0.3 of a slot —
 * so it rounds *straight back to where it started*. The audio plays it
 * unswung; the IR still says it is late. A drummer animated from the raw beat
 * hits a third of a sixteenth after the snare he is supposedly hitting.
 *
 * So: **anything that has to agree with the audio quantises through here.**
 * Musical decisions upstream keep working in continuous beats, which is
 * correct — the grid is a property of playback, not of the music.
 */

/** Grid resolution. Sixteenths, i.e. four slots to the beat. */
export const SLOTS_PER_BEAT = 4;

/** Slot index for a beat position, from song start. */
export function slotOf(beat: number): number {
  return Math.round(beat * SLOTS_PER_BEAT);
}

/**
 * The beat a renderer will actually sound this note on.
 *
 * The inverse of `slotOf`, and the function the concert's choreographer uses
 * to place a gesture. `quantise(b)` is idempotent and always lands on a slot
 * boundary, which `npm run concert` asserts of every gesture in every show.
 */
export function quantise(beat: number): number {
  return slotOf(beat) / SLOTS_PER_BEAT;
}

/**
 * The last slot boundary at or before `beat`.
 *
 * For the gestures that *cause* a sound rather than accompany it. `quantise`
 * rounds to the nearest slot and may therefore round forward, which is harmless
 * for a hand that lands with a note and wrong for a hand that starts a machine:
 * a first note at 165.44 quantises to 165.5, and a start gesture placed there is
 * a player pressing the button after the box has already spoken. Sixteenths of a
 * beat early is a player being ready; any amount late is cause following effect.
 */
export function quantiseDown(beat: number): number {
  return Math.floor(beat * SLOTS_PER_BEAT) / SLOTS_PER_BEAT;
}

/** How far a note moves when it is put on the grid. Signed, in beats. */
export function gridError(beat: number): number {
  return quantise(beat) - beat;
}

// ---------------------------------------------------------------------------
// The other half of the grid: beats to seconds
// ---------------------------------------------------------------------------

/**
 * **How fast the grid runs.**
 *
 * Everything above converts beats to *slots*, which is a question about
 * resolution. This half converts beats to *seconds*, which is a question about
 * speed, and until now it did not need owning: it was `60 / meta.bpm`, one
 * multiplication, written out longhand in nine files because a constant divided
 * by a constant cannot drift.
 *
 * It can drift the moment the tempo stops being a constant. `docs/engine-gaps.md`
 * §1.1 is the report — a qawwāli accelerates across its length because that is
 * what the form *is*, the pelimanni repertoire does the same, and a build in
 * house or dnb is a tempo-and-density ramp with half of it unavailable — and the
 * reason that entry is the largest one left is precisely that nine files each
 * knew the conversion by heart. Nine copies of `60 / bpm` are nine copies of the
 * assumption that there is one bpm.
 *
 * So the conversion moves here, beside the quantiser, for the reason the top of
 * this file gives about `slotOf`: **anything that has to agree with the audio
 * about when a beat happens converts through this file.** The failure it
 * prevents is the same one, one axis over — a drummer animated from a clock that
 * has not been told the band is accelerating hits behind the snare he is
 * supposedly hitting, and gets further behind every bar.
 *
 * ## Piecewise constant, and that is the whole argument
 *
 * A tempo map is a list of `(beat, bpm)` breakpoints, and the tempo is the bpm
 * of the last breakpoint at or before the beat. It does **not** interpolate.
 * That was the one real decision in this feature and it was made against three
 * alternatives:
 *
 *  - **A function `(beat) => bpm`.** Expressive, uninspectable, unserialisable,
 *    and impossible to render: MIDI has to be handed events at ticks, so a
 *    function would have to be sampled at some resolution anyway, and the
 *    resolution would then be a private decision inside the renderer rather than
 *    a property of the piece. Two renderers sampling at two resolutions is
 *    exactly the disagreement `slotOf` exists to stop.
 *  - **Linear interpolation between breakpoints.** The obvious answer, and the
 *    one a DAW's tempo lane draws. It makes beats-to-seconds a logarithm —
 *    `60 (b₁-b₀) ln(t₁/t₀) / (t₁-t₀)` — which is exact on paper and, written out
 *    twice in TypeScript, is two functions that agree to fourteen digits and
 *    disagree at the fifteenth. Worse, **MIDI cannot express it**: a set-tempo
 *    event is a step, so a ramp in a .mid is *already* a staircase, and every
 *    DAW that draws a smooth line exports one. Choosing interpolation would mean
 *    choosing a semantics the shipping format has to approximate, and then
 *    arguing about how finely.
 *  - **A scalar plus a ramp description** — `bpm: 92, accelerate: 1.3`. Compact,
 *    and it puts the curve's shape in the reader rather than in the data, so
 *    every consumer has to implement the same easing or produce a different
 *    piece. The IR's job is to have already decided.
 *
 * Piecewise constant is the only one of the four that **both renderers, the
 * clock and the report can implement identically without arithmetic they can
 * disagree about**, and it is what MIDI natively is. The staircase is not a
 * compromise either, once the steps are placed where `generate/tempo.ts` places
 * them: at bar lines, at one bpm a step. A band accelerating into a chorus
 * changes speed at the bar line too.
 *
 * ## The map is always present in the reader and usually absent in the data
 *
 * A song with no `meta.tempo` is a song at one tempo, and `songTempo` in
 * `core/types.ts` fabricates the one-entry map for it. That asymmetry is
 * deliberate and it is the same one `meta.feels`, `meta.transitions` and
 * `meta.drops` all make: **absent means the question was never asked**, so a
 * catalogue that has not opted in serialises byte-for-byte to what it was.
 */
export interface TempoPoint {
  /** Beat from song start, absolute. The first point is always at 0. */
  beat: number;
  /**
   * Beats per minute from here until the next point.
   *
   * A whole number, because MIDI's set-tempo carries microseconds per quarter
   * note and every reader in the world displays `60000000 / that`. Integers
   * round-trip through it recognisably; 113.4 comes back as 113.40003 and shows
   * up in a DAW's tempo lane as a number nobody typed. `generate/tempo.ts` is
   * what enforces it, by only emitting a point where the rounded value moves.
   */
  bpm: number;
}

/**
 * A tempo, over the length of a piece.
 *
 * Non-empty and sorted, with the first entry at beat 0. Both are invariants of
 * whoever builds it rather than things checked here, on the same reasoning
 * `quantise` uses for not clamping: the callers are `generate/tempo.ts` and
 * `songTempo`, there are two of them, and a defensive sort in the middle of the
 * clock would hide the bug rather than fix it.
 */
export type TempoMap = readonly TempoPoint[];

/** One tempo for the whole piece — what every song in the catalogue is today. */
export function flatTempo(bpm: number): TempoMap {
  return [{ beat: 0, bpm }];
}

/** The tempo sounding at `beat`. */
export function tempoAt(tempo: TempoMap, beat: number): number {
  let bpm = tempo[0]!.bpm;
  for (const point of tempo) {
    if (point.beat > beat) break;
    bpm = point.bpm;
  }
  return bpm;
}

/**
 * When `beat` happens, in seconds from the top of the piece.
 *
 * The integral of `60 / tempoAt`, which for a step function is a sum of
 * rectangles and therefore exact rather than approximated — the property the
 * piecewise-constant decision above was made for. Every consumer that needs to
 * know what time it is asks this, so there is one accumulation order and one
 * rounding history, and two systems comparing their answers compare the same
 * arithmetic rather than two implementations of the same formula.
 */
export function secondsAt(tempo: TempoMap, beat: number): number {
  let seconds = 0;
  for (let i = 0; i < tempo.length; i++) {
    const from = tempo[i]!.beat;
    if (from >= beat) break;
    const next = tempo[i + 1]?.beat ?? Infinity;
    const to = Math.min(beat, next);
    seconds += ((to - from) * 60) / tempo[i]!.bpm;
  }
  return seconds;
}

/**
 * The inverse: what beat is sounding at `second`.
 *
 * Written as its own walk rather than as a search over `secondsAt`, because a
 * bisection would converge to a beat that is *nearly* the one `secondsAt` maps
 * back from, and a hand placed at nearly the right beat is the entire failure
 * this file exists to prevent. Walking the same segments in the same order makes
 * the round trip exact at every breakpoint.
 */
export function beatsAt(tempo: TempoMap, second: number): number {
  let seconds = 0;
  for (let i = 0; i < tempo.length; i++) {
    const from = tempo[i]!.beat;
    const next = tempo[i + 1]?.beat;
    const span = next === undefined ? Infinity : ((next - from) * 60) / tempo[i]!.bpm;
    if (second - seconds <= span || next === undefined) {
      return from + ((second - seconds) * tempo[i]!.bpm) / 60;
    }
    seconds += span;
  }
  return 0;
}

/**
 * The slowest and fastest tempo in the piece.
 *
 * For labels and reports, which want to say *92→128 BPM* rather than pick one of
 * them and be wrong about the other. See `tempoLabel` in `core/types.ts`.
 */
export function tempoRange(tempo: TempoMap): [low: number, high: number] {
  let low = tempo[0]!.bpm;
  let high = tempo[0]!.bpm;
  for (const point of tempo) {
    if (point.bpm < low) low = point.bpm;
    if (point.bpm > high) high = point.bpm;
  }
  return [low, high];
}
