/**
 * Dynamics — how loud each section is, and why.
 *
 * A song had none. Velocity came from metric weight plus a little jitter, and
 * the accompaniment layers used flat constants, so every section came out at
 * the same level. Measured before this file existed, across 75 songs:
 *
 *     verse   mean 0.626
 *     chorus  mean 0.641
 *     pad     sd 0.000
 *
 * A chorus arriving 2% louder than the verse it follows does not arrive. The
 * chords change and the layer count goes up and the ear still hears one
 * unbroken plateau, which is most of what "it feels flat" means — the material
 * was fine, nothing ever *happened* to it. And a pad whose every note is
 * exactly 0.42 is not being played, it is being held down.
 *
 * **The numbers were widened once the arrangement was measured end to end.** The
 * table above fixed a song that had no dynamics at all, and it fixed it by about
 * as much as was needed to prove the mechanism worked. Measured across the
 * catalogue afterwards, the mean velocity change from one section to the next was
 * 10% in iskelmä and 11% in synth — audible if you are listening for it, and not
 * what a listener means by a chorus arriving. Jazz measured 31% and is the one
 * genre nobody describes as flat, which is the tell: the range that reads as
 * *arranged* is roughly three times the range that reads as *not broken*.
 *
 * Three things are combined here, in decreasing order of how much they matter:
 *
 *  1. **What kind of section this is.** A chorus is the loudest thing in the
 *     song and a bridge is deliberately not — a bridge that competes with the
 *     chorus destroys the chorus, which is the whole reason bridges drop back.
 *  2. **Where it falls in the form.** Records build. The last chorus is bigger
 *     than the first one, and the outro is the one place that goes the other
 *     way.
 *  3. **How much the layer responds.** Not every part swings equally. A drummer
 *     plays a chorus visibly harder; a pad barely changes at all, because a pad
 *     is a bed and a bed that surges is a different instrument.
 */

import type { LayerId, NoteEvent, SectionKind } from '../core/types.js';

/**
 * Base level for each kind of section.
 *
 * The gap between chorus and bridge is the important one. Everything else is
 * shading; that pair is structural.
 */
const KIND_LEVEL: Record<SectionKind, number> = {
  intro: 0.62,
  verse: 0.80,
  chorus: 1.00,
  bridge: 0.72,
  solo: 0.90,
  outro: 0.56,
};

/**
 * How far each layer swings between the quietest section and the loudest.
 *
 * 0 would mean a layer that plays identically all the way through — which is
 * what every layer used to do. 1 would mean one that disappears in the intro.
 * The pad is deliberately near the bottom: it is the floor the rest of the
 * arrangement stands on, and a floor that moves is unsettling rather than
 * dynamic.
 */
const LAYER_RESPONSE: Record<LayerId, number> = {
  drums: 0.85,
  bass: 0.55,
  comp: 0.80,
  pad: 0.35,
  melody: 0.72,
  counter: 0.80,
  brass: 0.95,
  vocal: 0.70,
};

export interface SectionPlacement {
  kind: SectionKind;
  /** Index of this section in the form. */
  index: number;
  /** How many sections the form has. */
  total: number;
  /** Which instance of its own kind this is, 0-based. */
  ordinal: number;
}

/**
 * How hard the band plays this section, roughly 0.6..1.05.
 *
 * The value is deliberately allowed slightly above 1: the last chorus of a song
 * that has been building for three minutes is louder than the first one, and
 * capping it at the first chorus's level is what makes a final chorus feel like
 * a repeat rather than a conclusion.
 */
export function sectionIntensity(at: SectionPlacement): number {
  const base = KIND_LEVEL[at.kind];

  // Records build. Spread over the form, not over the clock, so a long song and
  // a short one arc the same shape.
  const through = at.total > 1 ? at.index / (at.total - 1) : 0;
  const arc = at.kind === 'outro' ? 0 : through * 0.16;

  // And each return of a kind is a little more than the last — the second
  // chorus is the one that has something to live up to.
  const returns = Math.min(at.ordinal, 3) * 0.035;

  return clamp(base + arc + returns, 0.45, 1.06);
}

/**
 * Scale a section's notes to its intensity, layer by layer.
 *
 * Applied to the whole section at once rather than folded into each part
 * generator, so the parts stay ignorant of the form and one table decides how
 * the arrangement breathes.
 */
export function applyDynamics(
  notes: NoteEvent[],
  layer: LayerId,
  intensity: number,
  /**
   * The genre's response table, merged over `LAYER_RESPONSE`.
   *
   * The defaults describe a dance band breathing: the drummer plays a chorus
   * visibly harder and the pad barely changes, because a pad is a bed and a bed
   * that surges is unsettling. True of a band with a singer in front of it, and
   * not true everywhere — see `Genre.layerPlan`.
   */
  override?: Partial<Record<LayerId, number>>,
): void {
  const response = override?.[layer] ?? LAYER_RESPONSE[layer] ?? 0.6;
  const factor = 1 - response + response * intensity;
  for (const n of notes) {
    n.velocity = clamp(n.velocity * factor, 0.08, 1);
  }
}

/**
 * Swell a sustained part across its section.
 *
 * A pad measured a standard deviation of exactly zero — every note the same
 * value, which is what a sustained patch sounds like when nobody has touched
 * the expression pedal. Real sustained playing moves continuously, and the
 * shape it moves in is a swell: in toward the middle of the phrase, out toward
 * the end. It is subtle by design; the point is that it is not *nothing*.
 */
export function swell(
  notes: NoteEvent[],
  startBeat: number,
  lengthBeats: number,
  depth: number,
): void {
  if (lengthBeats <= 0 || depth <= 0) return;
  for (const n of notes) {
    const t = clamp((n.beat - startBeat) / lengthBeats, 0, 1);
    // One arch across the section: quietest at the edges, fullest in the middle.
    const shape = Math.sin(t * Math.PI);
    n.velocity = clamp(n.velocity * (1 - depth + depth * (0.55 + 0.45 * shape)), 0.08, 1);
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
