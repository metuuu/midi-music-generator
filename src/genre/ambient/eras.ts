/**
 * Ambient era profiles.
 *
 * The era decides what the sound is *made* of, and in this genre that is very
 * nearly the whole composition. A drone on a Mellotron and the same drone on a
 * granular string patch are different pieces of music in a way that a tango on
 * an accordion and the same tango on a bandoneon are not.
 *
 * Two notes on the tables:
 *
 * **`keyChangeChance` is 0 everywhere.** Lifting the final chorus a tone is an
 * iskelmä cliché and the single most anti-ambient device available — the whole
 * proposition of this music is that the tonal centre does not move.
 *
 * **The `brass` palette is vestigial.** Every ambient style excludes the brass
 * layer, so nothing here ever sounds; the field exists because instrument
 * assignment fills every role before the arrangement decides which ones play.
 * It is filled with plausible entries rather than left arbitrary so that a
 * style which later stops excluding brass does not get a trumpet section.
 */

import type { EraProfile } from '../../style/types.js';

/**
 * TAPE — analogue, 1970s–80s.
 *
 * String machines, Mellotron-adjacent choir patches, analogue pads and the
 * Rhodes. Warm, slightly out of tune with itself, and the register centre of
 * gravity is low.
 */
const tape: EraProfile = {
  id: 'tape',
  label: '1970s–80s tape',
  description:
    'Analogue and magnetic. String machines, choir patches, warm pads, Rhodes and a slightly detuned everything.',
  // Machines that predate the sampler, chosen for soft kicks and quiet hats
  // rather than for punch — an ambient beat sits under the pad, not over it.
  //
  // Every bank listed in this genre carries all six voices its styles can
  // emit: bd, sd, rim, hh, oh and perc. That is a real constraint rather than
  // a preference — a bank missing a voice does not substitute, it throws
  // "sound not found" and the pattern stops. The obvious period choices here
  // (Minipops, CompuRhythm 78) have no side stick at all, which is what cost
  // them their place.
  drumBanks: [
    ['RolandTR808', 4],
    ['KorgKR55', 3],
    ['RolandCompurhythm1000', 3],
    ['LinnDrum', 2],
  ],
  palette: {
    melody: [
      ['leadCalliope', 3], ['epiano1', 3], ['leadVoice', 3], ['vibraphone', 3],
      ['fxSoundtrack', 2], ['leadSquare', 2], ['flute', 2], ['celesta', 2],
      ['musicBox', 2], ['harmonica', 1],
    ],
    counter: [
      ['celesta', 3], ['vibraphone', 3], ['musicBox', 2], ['epiano2', 2],
      ['glockenspiel', 2], ['harp', 2], ['kalimba', 2],
    ],
    comp: [
      ['epiano1', 4], ['epiano2', 3], ['padPoly', 3], ['drawbarOrgan', 3],
      ['nylonGuitar', 2], ['harp', 2], ['reedOrgan', 2],
    ],
    pad: [
      ['strings1', 4], ['padWarm', 4], ['synthStrings', 3], ['padChoir', 3],
      ['tremoloStrings', 2], ['padNewAge', 2], ['choirAahs', 2],
    ],
    bass: [['synthBass', 4], ['fingerBass', 3], ['fretlessBass', 3], ['contrabass', 2]],
    brass: [['padHalo', 3], ['padBowed', 2], ['trombone', 1]],
  },
  styleWeights: {
    hauntology: 6, wasteland: 2, drone: 5, kosmische: 6, choral: 3, aquatic: 1,
  },
  tempoScale: 1,
  keyChangeChance: 0,
  density: 0.48,
  // A plate and a tape echo, not a hall. Shorter and closer than the two
  // digital eras below, because that is what the hardware could do — the long
  // decays this music is now associated with arrived with the reverb units of
  // the late eighties.
  space: { reverbSize: 0.62, delayBeats: 0.75, delayFeedback: 0.5 },
  effects: {
    // Tape rolls off the top of everything. This one number does more for the
    // period than any choice of patch does.
    pad: { reverb: 0.7, lowpass: 3600 },
    comp: { reverb: 0.55, lowpass: 4200 },
    melody: { reverb: 0.6, delay: 0.32, lowpass: 4800 },
    counter: { reverb: 0.7, delay: 0.4, lowpass: 4200 },
    bass: { reverb: 0.08, lowpass: 900 },
    drums: { reverb: 0.35, lowpass: 1800 },
  },
};

/**
 * SAMPLER — 12-bit and FM, 1990s.
 *
 * The era Mark Morgan's Fallout score comes out of, and it sounds the way it
 * does partly because of what the hardware could not do: short looped samples,
 * audible aliasing, metallic FM bells, and pads assembled out of the "effects"
 * bank because there was no room for anything richer.
 */
const sampler: EraProfile = {
  id: 'sampler',
  label: '1990s sampler',
  description:
    'Twelve-bit samplers and FM. Metallic bells, aliased pads, atmospheres and effects patches — the CD-era game-score palette.',
  drumBanks: [
    ['EmuSP12', 4],
    ['AkaiMPC60', 3],
    ['ViscoSpaceDrum', 3],
    ['RolandR8', 2],
  ],
  palette: {
    melody: [
      ['fxCrystal', 4], ['tubularBells', 3], ['fxAtmosphere', 3], ['padMetallic', 3],
      ['leadChiff', 2], ['shakuhachi', 2], ['panFlute', 2], ['fxBrightness', 2],
      ['musicBox', 1],
    ],
    counter: [
      ['tubularBells', 3], ['fxCrystal', 3], ['kalimba', 2], ['marimba', 2],
      ['glockenspiel', 2], ['pizzStrings', 2], ['harp', 2],
    ],
    comp: [
      ['padMetallic', 4], ['fxEchoes', 3], ['epiano2', 2], ['harp', 2],
      ['padPoly', 2], ['sitar', 1],
    ],
    pad: [
      ['fxAtmosphere', 4], ['padMetallic', 3], ['padSweep', 3], ['synthStrings2', 3],
      ['fxGoblins', 2], ['fxSciFi', 2], ['padHalo', 2], ['synthChoir', 2],
    ],
    bass: [['synthBass2', 4], ['synthBass', 3], ['fretlessBass', 2], ['contrabass', 2]],
    brass: [['padHalo', 3], ['synthBrass', 2], ['padBowed', 1]],
  },
  styleWeights: {
    hauntology: 4, wasteland: 7, drone: 4, kosmische: 3, choral: 3, aquatic: 5,
  },
  tempoScale: 1,
  keyChangeChance: 0,
  density: 0.42,
  // The first era with a reverb unit worth the name, and it was used
  // accordingly — long, bright and on everything.
  space: { reverbSize: 0.85, delayBeats: 0.75, delayFeedback: 0.55 },
  effects: {
    pad: { reverb: 0.9, lowpass: 5600, highpass: 90 },
    comp: { reverb: 0.8, lowpass: 6000 },
    melody: { reverb: 0.8, delay: 0.35, lowpass: 7500 },
    counter: { reverb: 0.9, delay: 0.42, lowpass: 6500 },
    bass: { reverb: 0.12, lowpass: 1100 },
    // The furthest back the kit gets anywhere in the project. This is the
    // Fallout end of the genre, where percussion is a sound in a room three
    // corridors away rather than a beat.
    drums: { reverb: 0.6, lowpass: 1400 },
  },
};

/**
 * HYBRID — processed acoustics, 2000s onward.
 *
 * Where ambient stopped being a synthesiser genre. Real strings and voices
 * treated until they behave like pads, sitting alongside the synthetic ones —
 * the palette Stars of the Lid, Tim Hecker and modern game scoring share.
 */
const hybrid: EraProfile = {
  id: 'hybrid',
  label: '2000s hybrid',
  description:
    'Processed acoustics alongside synthetic ones. Strings, cello and voices treated until they hold like pads.',
  drumBanks: [
    ['KorgM1', 3],
    ['RolandD70', 3],
    ['RolandMT32', 3],
    ['KorgT3', 2],
  ],
  palette: {
    melody: [
      ['violin', 3], ['cello', 3], ['leadVoice', 3], ['vibraphone', 2],
      ['padBowed', 2], ['flute', 2], ['fxBrightness', 2], ['clarinet', 2],
      ['tubularBells', 2], ['celesta', 2],
    ],
    counter: [
      ['harp', 3], ['celesta', 3], ['pizzStrings', 2], ['vibraphone', 2],
      ['marimba', 2], ['kalimba', 2], ['glockenspiel', 2],
    ],
    comp: [
      ['harp', 3], ['piano', 3], ['padBowed', 3], ['churchOrgan', 2],
      ['nylonGuitar', 2], ['epiano2', 2], ['padNewAge', 2],
    ],
    pad: [
      ['strings2', 4], ['padBowed', 4], ['choirAahs', 3], ['voiceOohs', 3],
      ['padWarm', 3], ['padNewAge', 2], ['tremoloStrings', 2], ['fxSoundtrack', 2],
    ],
    bass: [['contrabass', 4], ['cello', 3], ['fretlessBass', 2], ['acousticBass', 2]],
    brass: [['padHalo', 3], ['trombone', 2], ['padBowed', 1]],
  },
  styleWeights: {
    hauntology: 3, wasteland: 4, drone: 7, kosmische: 2, choral: 7, aquatic: 4,
  },
  tempoScale: 1,
  keyChangeChance: 0,
  density: 0.45,
  // The largest space of the three and the least filtered. Once the sources are
  // real strings and real voices there is nothing to hide, so this era leans on
  // the room rather than on the filter.
  space: { reverbSize: 0.9, delayBeats: 1.5, delayFeedback: 0.35 },
  effects: {
    pad: { reverb: 0.92, lowpass: 8000 },
    comp: { reverb: 0.75, lowpass: 9000 },
    melody: { reverb: 0.75, delay: 0.2, lowpass: 10000 },
    counter: { reverb: 0.88, delay: 0.25, lowpass: 9000 },
    bass: { reverb: 0.15, lowpass: 1600 },
    drums: { reverb: 0.5, lowpass: 2400 },
    vocal: { reverb: 0.95, lowpass: 7000 },
  },
};

export const ERAS: Record<string, EraProfile> = { tape, sampler, hybrid };
