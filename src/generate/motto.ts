/**
 * The motto — the one figure a song is *about*.
 *
 * This is the scale of repetition the generator had no way to express. It had
 * exactly two: a motif restated inside its own phrase (one bar) and a section
 * replayed verbatim (thirty-two). Nothing between them, and `motifA` was thrown
 * away at every phrase boundary, so a song could be locally shapely and
 * globally arbitrary at the same time — every phrase well-formed, no two
 * phrases related to each other.
 *
 * A motto closes that gap. It is a rhythm and a contour, chosen once for the
 * whole song, and phrases are built from it in proportion to `hook`. That is
 * how nearly every memorable tune is actually constructed: three notes and a
 * shape, turned over, moved around the scale, answered, inverted, and brought
 * back. The chorus of a hit is not thirty-two bars of invention, it is one
 * gesture and its consequences.
 *
 * Two things it deliberately is *not*:
 *
 *  - It is not a fixed sequence of pitches. Storing pitches would make every
 *    phrase the same tune, not the same idea, and the harmony moves underneath
 *    it. The contour is held as **scale steps between successive notes**, so it
 *    can be replayed over any chord and still fit.
 *  - It is not mandatory. At `through` the adherence is zero and nothing is
 *    quoted at all, which is the correct setting for a bebop head and for any
 *    music whose value proposition is never playing it twice.
 */

import type { Rng } from '../core/rng.js';
import type { RhythmCell, Style } from '../style/types.js';
import { fitCell, pickCell } from './rhythm.js';

export interface Motto {
  /** The song's rhythmic figure, one bar long. */
  cell: RhythmCell;
  /**
   * Its melodic shape, as scale steps from each note to the next. The first
   * entry is relative to whatever note the phrase arrives on, so the figure
   * transposes itself wherever it lands.
   */
  contour: number[];
}

/**
 * Choose the song's figure.
 *
 * The rhythm is drawn from the style's own vocabulary, so a tango's motto is
 * made of tango cells. The contour is generated here rather than drawn, because
 * what makes a figure memorable is a property of its *shape* — and the shapes
 * that work are a short, well-known list.
 */
export function chooseMotto(rng: Rng, style: Style, slotsPerBar: number): Motto {
  // A motto with one note is not a motto, and one with eight is a run. Redraw
  // for something in the range a listener can actually hold.
  let cell = pickCell(rng, style.melodyCells, slotsPerBar);
  for (let tries = 0; tries < 6; tries++) {
    const n = cell.filter((c) => c > 0).length;
    if (n >= 2 && n <= 5) break;
    cell = pickCell(rng, style.melodyCells, slotsPerBar);
  }
  cell = fitCell(cell, slotsPerBar);
  const notes = cell.filter((c) => c > 0).length;

  return { cell, contour: makeContour(rng, notes, style) };
}

/**
 * The shapes worth building a tune on.
 *
 * Each is a way of moving that the ear can hold onto after one hearing, which
 * is the only test that matters. A random walk through the scale is not on the
 * list, because a random walk is precisely what a listener cannot remember —
 * and it is what the generator produced by default.
 *
 * Expressed in scale steps, so `[1, 1, -1]` is up, up, down a scale degree
 * whatever the mode and whatever the chord underneath.
 */
function makeContour(rng: Rng, notes: number, style: Style): number[] {
  const leapy = style.melody.leap > 0.26;

  type Shaper = () => number[];
  const shapes: (readonly [Shaper, number])[] = [
    // Rising scale fragment — the plainest and most singable thing there is.
    [() => fill(notes, () => 1), 5],
    // Falling fragment. Slightly more common in minor-key vocal music.
    [() => fill(notes, () => -1), 6],
    // Turn: up then back down, or the mirror. The Beethoven-5 shape.
    [() => fill(notes, (i) => (i === 0 ? 0 : i < notes / 2 ? 1 : -1)), 5],
    // Arch: rise to a peak, then fall away from it.
    [() => fill(notes, (i) => (i < (notes - 1) / 2 ? 1 : -1)), 4],
    // Repeated note answered by a step — "da-da-da-DAA".
    [() => fill(notes, (i) => (i < notes - 1 ? 0 : -1)), 4],
    // A leap out and a stepwise walk home. The classic opening gesture.
    [() => fill(notes, (i) => (i === 0 ? 0 : i === 1 ? 2 : -1)), leapy ? 5 : 2],
    // Neighbour figure: away and straight back. Small, and very sticky.
    [() => fill(notes, (i) => (i % 2 === 0 ? 1 : -1)), 3],
    // Descending thirds — arpeggiated, which suits an instrument better than a
    // voice, so it follows the style's own appetite for leaps.
    [() => fill(notes, () => -2), leapy ? 4 : 1],
  ];

  const contour = rng.weighted(shapes)();
  // The first interval is how the figure *arrives*; leaving it at zero would
  // make every restatement begin on the note the previous phrase ended on.
  contour[0] = 0;
  return contour;
}

function fill(n: number, f: (i: number) => number): number[] {
  return Array.from({ length: Math.max(1, n) }, (_, i) => f(i));
}
