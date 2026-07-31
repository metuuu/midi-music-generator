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
