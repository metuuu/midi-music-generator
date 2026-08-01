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
  year: 1978,
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
  /**
   * A machine, and no drummer at all — and the one ambient era where that is
   * the whole answer rather than the older half of it.
   *
   * The box belongs here and very nearly nowhere else in this genre. 1978 has
   * no pads to hit: `electronic-kit` is 1981, so the year gate would strike it
   * out of this table even if it were written in. What is left is a rhythm box
   * left running in the corner, which is exactly right for the music — `drone`
   * and `choral` already exclude the kit outright, and a drummer on a riser in
   * the fog would be the loudest thing in a room built to have no loudest
   * thing. The two eras below have somewhere else to put a pulse; this one does
   * not, and does not need one.
   */
  drumSources: [['box', 5], ['programmed', 4]],
  /**
   * Lower than synth's, and the difference is what the two genres want from a
   * repeating figure. Berlin school is *built* on a sequence you can hear
   * cycling; tape-era ambient is built on a drone, and a sequencer is one
   * texture among several rather than the engine.
   */
  sequenced: { bass: 0.4, counter: 0.35 },
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
  year: 1993,
  label: '1990s sampler',
  description:
    'Twelve-bit samplers and FM. Metallic bells, aliased pads, atmospheres and effects patches — the CD-era game-score palette.',
  drumBanks: [
    ['EmuSP12', 4],
    ['AkaiMPC60', 3],
    ['ViscoSpaceDrum', 3],
    ['RolandR8', 2],
  ],
  /**
   * Pads first, the sequencer second.
   *
   * By 1993 the electronic kit is a decade old and is the ordinary way this
   * sound gets made: an Octapad or a set of triggers into the same sampler the
   * pads are coming out of, played by somebody rather than written in. It is
   * the machine end of the drum world with a person attached, which is what
   * this music wants — the hits breathe from bar to bar without a riser and an
   * acoustic kit arriving in the middle of a Fallout corridor.
   *
   * `programmed` stays, because an SP-12 written into a bar at a time is the
   * other half of the era, but it is no longer the whole story. The preset box
   * does not appear at all: it is the tape era's object, and by now the choice
   * to loop something is a choice rather than the only thing the hardware
   * offered.
   */
  drumSources: [['electronic-kit', 5], ['programmed', 3]],
  /** Everything on this record came out of a machine, including the bass. */
  sequenced: { bass: 0.5, counter: 0.4 },
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
  year: 2006,
  label: '2000s hybrid',
  description:
    'Processed acoustics alongside synthetic ones. Strings, cello and voices treated until they hold like pads.',
  drumBanks: [
    ['KorgM1', 3],
    ['RolandD70', 3],
    ['RolandMT32', 3],
    ['KorgT3', 2],
  ],
  /**
   * Played, and mostly played on pads.
   *
   * The whole point of 2000s hybrid is that the sources went back to being
   * played — real strings, real voices — and the percussion follows them. Pads
   * lead because they are the version of that which still sits under a drone:
   * a struck sound with a person's timing on it and none of an acoustic kit's
   * volume. The brushed kit is the same move taken all the way and stays a
   * minority for exactly that reason.
   *
   * The sequencer is behind both now, where in the two earlier eras it was in
   * front. It is not zero: a loop chosen over a drummer is still what a lot of
   * this music is, and it is the thread back to the tape era.
   */
  drumSources: [['electronic-kit', 6], ['programmed', 3], ['kit', 3]],
  /**
   * The lowest of the six, for the reason the drums are: 2000s hybrid is where
   * the sources went back to being played, and a sequenced bass under a real
   * cello is the arrangement this era spent its time getting away from.
   */
  sequenced: { bass: 0.35, counter: 0.3 },
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
