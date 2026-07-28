/**
 * Jazz era profiles.
 *
 * A note on the drum banks: every bank available to the browser preview is a
 * drum *machine*, so a swing ride pattern in the preview will sound like a
 * drum machine playing a ride pattern. The banks chosen here are the most
 * acoustic-leaning ones that actually carry a ride cymbal and a shaker
 * (`rd` and `sh`) — without those two voices a jazz kit is not possible at all.
 *
 * This only affects the audition render. MIDI output maps drums to General MIDI
 * channel 10, so a decent soundfont gives real ride cymbals and brushes.
 */

import type { EraProfile } from '../../style/types.js';

const swingEra: EraProfile = {
  id: 'swingera',
  label: '1930s–40s swing',
  description:
    'Big-band and small-group swing. Clarinet and muted brass over acoustic piano, upright bass and brushes.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['AlesisSR16', 3],
    ['RolandR8', 3],
  ],
  palette: {
    melody: [
      ['clarinet', 4], ['mutedTrumpet', 4], ['trumpet', 3], ['tenorSax', 3],
      ['altoSax', 3], ['trombone', 2], ['piano', 2], ['jazzGuitar', 2],
      ['violin', 2], ['nylonGuitar', 2],
    ],
    counter: [
      ['clarinet', 3], ['mutedTrumpet', 3], ['trombone', 3], ['altoSax', 2],
      ['jazzGuitar', 2], ['piano', 2], ['violin', 2],
    ],
    comp: [['piano', 6], ['jazzGuitar', 4], ['nylonGuitar', 3], ['drawbarOrgan', 2]],
    pad: [['brassSection', 3], ['strings1', 3], ['trombone', 2], ['clarinet', 2]],
    bass: [['acousticBass', 8], ['baritoneSax', 1]],
    brass: [['brassSection', 4], ['mutedTrumpet', 3], ['trombone', 3], ['trumpet', 2]],
  },
  styleWeights: {
    swing: 6, bebop: 1, ballad: 4, bossa: 0, blues: 4, modal: 0, gypsy: 3, trio: 1,
    odd: 0, fusion: 0,
  },
  tempoScale: 1,
  keyChangeChance: 0.1,
  density: 0.6,
};

const bop: EraProfile = {
  id: 'bop',
  label: '1950s–60s bop',
  description:
    'Small-group bebop and hard bop. Tenor and alto sax, trumpet, piano trio, walking bass, ride cymbal.',
  drumBanks: [
    ['RolandR8', 4],
    ['AlesisSR16', 3],
    ['AkaiMPC60', 3],
    ['YamahaRY30', 2],
  ],
  palette: {
    melody: [
      ['tenorSax', 5], ['altoSax', 4], ['trumpet', 4], ['mutedTrumpet', 2],
      ['piano', 2], ['trombone', 2], ['jazzGuitar', 2],
    ],
    counter: [
      ['piano', 4], ['trumpet', 3], ['trombone', 3], ['altoSax', 2],
      ['jazzGuitar', 2], ['vibraphone', 2],
    ],
    comp: [['piano', 7], ['jazzGuitar', 3], ['drawbarOrgan', 2], ['vibraphone', 2]],
    pad: [['brassSection', 2], ['strings1', 2], ['trombone', 2]],
    bass: [['acousticBass', 9]],
    brass: [['trumpet', 4], ['trombone', 3], ['brassSection', 3], ['mutedTrumpet', 2]],
  },
  styleWeights: {
    swing: 5, bebop: 5, ballad: 4, bossa: 2, blues: 5, modal: 4, gypsy: 1, trio: 4,
    // Take Five was 1959. Fusion was not.
    odd: 2, fusion: 0,
  },
  tempoScale: 1,
  keyChangeChance: 0.05,
  density: 0.62,
};

const modern: EraProfile = {
  id: 'modern',
  label: '1960s–70s modern',
  description:
    'Cooler and more open. Rhodes and vibraphone, flute and soprano sax, bossa and modal material.',
  drumBanks: [
    ['KorgM1', 3],
    ['AlesisSR16', 3],
    ['YamahaRY30', 3],
    ['RolandD70', 2],
  ],
  palette: {
    melody: [
      ['sopranoSax', 4], ['tenorSax', 4], ['flute', 3], ['vibraphone', 3],
      ['epiano1', 3], ['trumpet', 2], ['nylonGuitar', 2], ['jazzGuitar', 2],
    ],
    counter: [
      ['vibraphone', 4], ['epiano1', 3], ['flute', 3], ['nylonGuitar', 2],
      ['jazzGuitar', 2], ['piano', 2],
    ],
    comp: [['epiano1', 5], ['piano', 4], ['nylonGuitar', 3], ['jazzGuitar', 3], ['vibraphone', 2]],
    pad: [['strings1', 3], ['padWarm', 3], ['epiano2', 2], ['synthStrings', 2]],
    bass: [['acousticBass', 6], ['fingerBass', 3]],
    brass: [['trumpet', 3], ['trombone', 2], ['brassSection', 2], ['mutedTrumpet', 2]],
  },
  styleWeights: {
    swing: 3, bebop: 2, ballad: 4, bossa: 6, blues: 3, modal: 6, gypsy: 1, trio: 6,
    odd: 4, fusion: 2,
  },
  tempoScale: 1,
  keyChangeChance: 0.05,
  density: 0.58,
};

/**
 * The band plugs in.
 *
 * A fourth era rather than a shading of the third, because the difference is not
 * a choice of patch — it is a different set of instruments in a different room.
 * The upright is gone, the piano is a Rhodes, the guitar has an amplifier and
 * the reverb is short and bright rather than long and wooden. An `odd` or
 * `fusion` chart played by the `modern` band would come out with a double bass
 * walking under it, which is a fair description of nothing anybody recorded.
 *
 * The drum banks are the one place the preview's limits work *for* the music:
 * every bank available here is a drum machine, which has been a caveat on every
 * other jazz era in this file and is simply correct for this one.
 */
const electric: EraProfile = {
  id: 'electric',
  label: '1970s electric',
  description:
    'Fusion and odd metres. Rhodes and synth over electric bass, clean guitar and a kit playing straight.',
  drumBanks: [
    ['LinnDrum', 4],
    ['RolandMT32', 3],
    ['OberheimDMX', 3],
    ['YamahaRY30', 2],
  ],
  palette: {
    melody: [
      ['epiano1', 5], ['sopranoSax', 3], ['vibraphone', 3], ['leadSaw', 2],
      ['cleanGuitar', 2], ['flute', 2], ['tenorSax', 2],
    ],
    counter: [
      ['epiano2', 4], ['cleanGuitar', 3], ['vibraphone', 3], ['leadSquare', 2],
      ['sopranoSax', 2], ['flute', 2],
    ],
    comp: [['epiano1', 5], ['cleanGuitar', 4], ['rockOrgan', 3], ['epiano2', 3]],
    pad: [['synthStrings', 4], ['padWarm', 3], ['padPoly', 3], ['strings1', 2]],
    bass: [['fingerBass', 6], ['pickBass', 3], ['synthBass', 2], ['fretlessBass', 2]],
    brass: [['synthBrass', 3], ['trumpet', 3], ['brassSection', 2], ['mutedTrumpet', 2]],
  },
  styleWeights: {
    swing: 1, bebop: 1, ballad: 2, bossa: 2, blues: 2, modal: 4, gypsy: 0, trio: 3,
    odd: 6, fusion: 7,
  },
  tempoScale: 1,
  keyChangeChance: 0.02,
  density: 0.66,
};

export const ERAS: Record<string, EraProfile> = { swingera: swingEra, bop, modern, electric };
