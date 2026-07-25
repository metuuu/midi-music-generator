/**
 * Era profiles.
 *
 * The era decides the *production*, not the notes: which drum machine, which
 * instruments take the melody, how dense the arrangement gets. The same tango
 * progression sounds like 1968 or 1985 almost entirely because of these
 * choices.
 *
 * Drum bank names are Strudel `tidal-drum-machines` banks (verified present in
 * that sample set); the MIDI renderer ignores them and uses GM channel 10.
 */

import type { InstrumentId } from './instruments.js';

export interface EraProfile {
  id: string;
  label: string;
  description: string;
  /** Strudel drum-machine banks, weighted. */
  drumBanks: (readonly [string, number])[];
  /** Instrument choices per layer, weighted. */
  palette: {
    melody: (readonly [InstrumentId, number])[];
    counter: (readonly [InstrumentId, number])[];
    comp: (readonly [InstrumentId, number])[];
    pad: (readonly [InstrumentId, number])[];
    bass: (readonly [InstrumentId, number])[];
    brass: (readonly [InstrumentId, number])[];
  };
  /** Style weights — some dances belong more to one era than the other. */
  styleWeights: Record<string, number>;
  /** Multiplier applied to the style's tempo range. */
  tempoScale: number;
  /** How likely the final chorus lifts by a semitone or tone. */
  keyChangeChance: number;
  /** Overall arrangement density 0..1, nudges how many layers play at once. */
  density: number;
}

const tanssilava: EraProfile = {
  id: 'tanssilava',
  label: '1960s–70s tanssilava',
  description:
    'Dance-pavilion era. Preset rhythm boxes, accordion and bandoneon, tremolo guitar, string ensemble, muted brass.',
  drumBanks: [
    ['KorgMinipops', 4],
    ['RhythmAce', 3],
    ['RolandCompurhythm78', 3],
    ['KorgKR55', 2],
  ],
  palette: {
    melody: [
      ['accordion', 5], ['bandoneon', 3], ['tenorSax', 3], ['strings1', 3],
      ['mutedTrumpet', 2], ['cleanGuitar', 2], ['vibraphone', 2], ['altoSax', 2],
      ['harmonica', 1], ['clarinet', 1],
    ],
    counter: [
      ['accordion', 4], ['cleanGuitar', 3], ['vibraphone', 2], ['mutedTrumpet', 2],
      ['clarinet', 2], ['flute', 1], ['harp', 1],
    ],
    comp: [
      ['accordion', 4], ['cleanGuitar', 4], ['jazzGuitar', 3], ['drawbarOrgan', 3],
      ['piano', 2], ['nylonGuitar', 2], ['mutedGuitar', 2],
    ],
    pad: [
      ['strings1', 5], ['tremoloStrings', 3], ['strings2', 2], ['drawbarOrgan', 2], ['padWarm', 1],
    ],
    bass: [['acousticBass', 4], ['fingerBass', 4], ['pickBass', 2]],
    brass: [['mutedTrumpet', 3], ['trombone', 3], ['brassSection', 3], ['trumpet', 2]],
  },
  styleWeights: {
    tango: 5, humppa: 4, valssi: 4, jenkka: 3, foksi: 3, beguine: 4, iskelmapop: 0,
  },
  tempoScale: 1,
  keyChangeChance: 0.45,
  density: 0.62,
};

const eighties: EraProfile = {
  id: 'eighties',
  label: '1980s iskelmäpop',
  description:
    'Radio-era iskelmä. LinnDrum and DMX, synth strings, electric piano, electric bass, synth brass stabs, big key changes.',
  drumBanks: [
    ['LinnDrum', 4],
    ['OberheimDMX', 3],
    ['RolandTR707', 3],
  ],
  palette: {
    melody: [
      ['synthStrings', 4], ['tenorSax', 4], ['strings2', 3], ['accordion', 2],
      ['epiano1', 2], ['synthBrass', 2], ['altoSax', 2], ['glockenspiel', 1],
    ],
    counter: [
      ['epiano1', 3], ['synthStrings', 3], ['cleanGuitar', 3], ['glockenspiel', 2],
      ['accordion', 2], ['synthBrass', 2],
    ],
    comp: [
      ['epiano1', 5], ['epiano2', 3], ['cleanGuitar', 3], ['piano', 2],
      ['rockOrgan', 2], ['accordion', 2],
    ],
    pad: [
      ['synthStrings', 5], ['synthStrings2', 3], ['strings2', 3], ['padWarm', 2],
    ],
    bass: [['fingerBass', 5], ['pickBass', 3], ['synthBass', 2]],
    brass: [['synthBrass', 4], ['brassSection', 3], ['trumpet', 2], ['trombone', 2]],
  },
  styleWeights: {
    tango: 4, humppa: 2, valssi: 3, jenkka: 1, foksi: 2, beguine: 2, iskelmapop: 6,
  },
  tempoScale: 1,
  keyChangeChance: 0.7,
  density: 0.78,
};

export const ERAS: Record<string, EraProfile> = { tanssilava, eighties };
export const ERA_IDS = Object.keys(ERAS);

export function getEra(id: string): EraProfile {
  const e = ERAS[id];
  if (!e) throw new Error(`Unknown era "${id}". Known: ${ERA_IDS.join(', ')}`);
  return e;
}
