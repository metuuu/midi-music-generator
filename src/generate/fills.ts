/**
 * Drum fills — how the kit announces that the section is changing.
 *
 * There was one fill. Descending toms from the half-bar, then a crash, in every
 * genre, at every section boundary, at every tempo, regardless of what the
 * section was turning into. A tom roll is a dance-band gesture; a drummer plays
 * it into a chorus and would not dream of playing it into the head of a bebop
 * tune, where the fill is a cymbal and a couple of kicks and no toms at all.
 *
 * The old one also had a quiet bug: it walked `ht, mt, lt` and then clamped to
 * the end of the list, so a sixteenth-note fill played three toms and then five
 * repeats of the low one. That is not a roll, it is a stutter.
 *
 * Two things decide what gets played:
 *
 *  - **The idiom**, which is what makes a fill sound like it belongs to the
 *    music around it rather than to a drum-machine demo.
 *  - **What it is landing on.** A fill exists to deliver the next section, so
 *    its size is a property of the arrival, not of the departure. The biggest
 *    one in a song goes into the last chorus; the one into a quiet verse is two
 *    notes and a cymbal, and the most effective of all is often no fill at
 *    all — a bar of near-silence that makes the downbeat land twice as hard.
 */

import type { Rng } from '../core/rng.js';
import type { DrumEvent, DrumVoice } from '../core/types.js';

export type FillShape =
  | 'tom-roll'    // descending toms — the dance-band signature
  | 'snare-roll'  // sixteenths on the snare, building
  | 'snare-toms'  // snare on the beat, toms answering off it
  | 'cymbal'      // jazz: cymbal and kick, no toms anywhere
  | 'rim'         // Latin: rim and percussion, a clave-ish figure
  | 'lead-in'     // two or three hits on the last beat, and nothing else
  | 'drop';       // the kit stops; the silence is the fill

/** Weighted fill vocabulary. */
export type FillPalette = (readonly [FillShape, number])[];

export const DEFAULT_FILLS: FillPalette = [
  ['tom-roll', 4], ['snare-roll', 3], ['snare-toms', 3], ['lead-in', 2], ['drop', 1],
];

export interface FillOptions {
  /** Beat the fill's bar starts on. */
  barStart: number;
  beatsPerBar: number;
  slotsPerBar: number;
  rng: Rng;
  /** How hard this section is playing. */
  intensity: number;
  /**
   * How hard the *next* section plays. A fill is a delivery, so this is what
   * decides how much of one it needs to be.
   */
  arrival: number;
  palette: FillPalette;
}

export interface Fill {
  events: DrumEvent[];
  /**
   * First slot the fill occupies. The pattern is silenced from here to the
   * barline, so the kit does not play through its own fill — which the old code
   * approximated with a hardcoded half-bar whatever the fill actually was.
   */
  fromSlot: number;
}

const SLOTS_PER_BEAT = 4;

export function buildFill(opts: FillOptions): Fill {
  const { barStart, beatsPerBar, slotsPerBar, rng, intensity, arrival, palette } = opts;
  const shape = rng.weighted(palette);

  /**
   * How much of the bar the fill takes.
   *
   * Scaled by the arrival: a big landing earns a long run-up. Held to a whole
   * beat at minimum, because a fill shorter than that reads as a flam rather
   * than as an announcement.
   */
  const beats = arrival > 0.95 ? rng.weighted([[2, 3], [1, 2]] as const)
    : arrival > 0.8 ? rng.weighted([[2, 2], [1, 3]] as const)
      : 1;
  const span = Math.min(slotsPerBar, beats * SLOTS_PER_BEAT);
  const fromSlot = slotsPerBar - span;

  const events: DrumEvent[] = [];
  const at = (slot: number, voice: DrumVoice, velocity: number) => {
    events.push({
      beat: barStart + slot / SLOTS_PER_BEAT,
      voice,
      velocity: Math.max(0.05, Math.min(1, velocity)),
    });
  };

  // A fill crescendos into its landing — that is most of why it reads as one.
  const swellAt = (slot: number) => 0.62 + 0.34 * ((slot - fromSlot) / Math.max(1, span));
  const level = intensity;

  switch (shape) {
    case 'tom-roll': {
      // Cycle the toms properly rather than clamping to the lowest one.
      const toms: DrumVoice[] = ['ht', 'mt', 'lt'];
      const step = rng.pick([2, 2, 4]);
      let i = 0;
      for (let slot = fromSlot; slot < slotsPerBar; slot += step) {
        at(slot, toms[i % toms.length]!, swellAt(slot) * level);
        i++;
      }
      break;
    }
    case 'snare-roll': {
      const step = span >= 8 ? rng.pick([2, 2, 1]) : rng.pick([2, 1]);
      for (let slot = fromSlot; slot < slotsPerBar; slot += step) {
        at(slot, 'sd', swellAt(slot) * level * (slot % SLOTS_PER_BEAT === 0 ? 1 : 0.82));
      }
      break;
    }
    case 'snare-toms': {
      const toms: DrumVoice[] = ['ht', 'mt', 'lt'];
      let i = 0;
      for (let slot = fromSlot; slot < slotsPerBar; slot += 2) {
        const onBeat = slot % SLOTS_PER_BEAT === 0;
        at(slot, onBeat ? 'sd' : toms[i++ % toms.length]!, swellAt(slot) * level);
      }
      break;
    }
    case 'cymbal': {
      /**
       * The jazz answer. A drummer setting up the next chorus plays the cymbal
       * and drops a couple of kicks under it; the toms stay where they are. The
       * hits land off the beat because that is where a swung fill sits.
       */
      at(fromSlot, 'rd', 0.72 * level);
      at(fromSlot + 2, 'bd', 0.66 * level);
      if (span >= 8) {
        at(fromSlot + 4, 'rd', 0.8 * level);
        at(fromSlot + 6, 'sd', 0.7 * level);
      }
      at(slotsPerBar - 2, 'sd', 0.85 * level);
      break;
    }
    case 'rim': {
      // A Latin fill is a wood sound, not a skin one.
      const voices: DrumVoice[] = ['rim', 'perc', 'rim'];
      let i = 0;
      for (let slot = fromSlot; slot < slotsPerBar; slot += 2) {
        at(slot, voices[i++ % voices.length]!, swellAt(slot) * level * 0.9);
      }
      break;
    }
    case 'lead-in': {
      const step = rng.pick([2, 1]);
      for (let slot = slotsPerBar - SLOTS_PER_BEAT; slot < slotsPerBar; slot += step) {
        at(slot, 'sd', swellAt(slot) * level * 0.9);
      }
      return { events, fromSlot: slotsPerBar - SLOTS_PER_BEAT };
    }
    case 'drop':
      // Nothing at all. The bar empties and the downbeat that follows lands
      // twice as hard for it — which is why this is in the vocabulary and not
      // an absence of one.
      return { events, fromSlot };
  }

  return { events, fromSlot };
}

/**
 * The cymbal on the downbeat the fill was aiming at.
 *
 * Deliberately separate: it belongs to the *next* section, sounds on its first
 * beat, and its weight comes from that section rather than from the one just
 * finished. A fill into something quiet gets an open hat instead, because a
 * crash into a hushed verse announces the wrong thing.
 */
export function landing(beat: number, arrival: number): DrumEvent {
  return {
    beat,
    voice: arrival > 0.82 ? 'cr' : 'oh',
    velocity: Math.min(1, 0.6 + arrival * 0.35),
  };
}
