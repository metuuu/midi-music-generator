/**
 * Four eras, 1972 to 1995, and each one is a different *amount of gain* rather
 * than a different set of instruments.
 *
 * This is the fact that makes a metal era table read unlike any other one in this
 * project. Reggae's four eras are four rhythm sections; ambient's three are three
 * generations of synthesiser; iskelmä's two are a pavilion and a studio. Here the
 * line-up barely moves — two guitars, a bass, a kit and a singer, in 1972 and in
 * 1995 — and what changes is the signal chain, which is why the `effects` blocks
 * below are doing more work than the `palette` blocks are.
 *
 * The curve to read them by is the guitar's own frequency response:
 *
 *  - **1972** is a valve amplifier at the edge of breakup, a single 4×12, and a
 *    tape machine with everything on it at once. Warm, mid-heavy, and audibly a
 *    room. `lowpass: 5200` on the comp is the cabinet — a Celestion-loaded 4×12
 *    is down about 20 dB by 5 kHz and the sound has nothing above it at all.
 *  - **1982** is the same amplifier with a pedal in front of it and a second
 *    guitar next to it, close-miked and dry. Brighter, and the *room* has gone.
 *  - **1988** is a solid-state preamp with the mids taken out on purpose — the
 *    "scooped" setting, which is a bass shelf and a treble shelf with a hole
 *    between them at 800 Hz. Nothing else in this project sounds like that, and
 *    it is the single most identifiable production decision in the genre.
 *  - **1995** is either the driest thing here or the wettest, and the eras' own
 *    tables cannot split the difference: a death metal record is close-miked and
 *    clinical and a black metal one is one microphone in a cold room. The
 *    compromise below is a long reverb on a *filtered* kit, which is the shape
 *    both of them have from a distance.
 *
 * ## Why every era says `kit`
 *
 * `drumSources` names `kit` at overwhelming weight in all four, and the last two
 * name `box` and `programmed` at a weight small enough to be reached by exactly
 * one style. That is deliberate and it interacts with `Style.boxDrums`, which is
 * `false` on twenty-three of the twenty-four styles: the era makes the machine
 * *possible* after 1978 and the style table makes it possible on `industrial`
 * alone. A preset box playing a blast beat would not be a quieter blast beat, it
 * would be the style with its subject — a person, and their stamina — removed.
 *
 * ## Why the banks are what they are
 *
 * Every bank named below is a sampler or a machine standing in for an acoustic
 * kit, which is the same substitution jazz's 1938 era makes and states. There was
 * never a drum machine on any of these sessions. The three that are genuinely of
 * the period rather than standing in for it are `SimmonsSDS5` — the hexagonal
 * electronic pads that were on half the stages of 1984 and on nearly every metal
 * record's snare by accident, because studios had them — `AlesisHR16` and
 * `YamahaRX5`. They appear in the later eras at low weight for that reason, and
 * `resolveVoice` has been checked against all three: none of them has a ride, so
 * every ride in this genre falls to the open hat on those banks, which is
 * audibly a substitution and is the honest price of naming them.
 */

import type { EraProfile } from '../../style/types.js';

/**
 * HEAVY — 1970–75.
 *
 * One guitarist, and a Hammond in the corner as often as not. The palette is the
 * only one here with `drawbarOrgan` and `rockOrgan` near the top of the comp
 * table, because for the first five years of this genre the second harmonic
 * instrument was a keyboard rather than a second guitar — Deep Purple, Uriah
 * Heep, Atomic Rooster, and Sabbath's own mellotron.
 *
 * `overdriveGuitar` outweighs `distortionGuitar` and that ordering is the era.
 * A 1972 lead sound is a valve amplifier turned all the way up and nothing else
 * in the chain; the distortion is the *power stage* compressing, which is a soft
 * asymmetric clipping with a great deal of the dry signal still in it.
 * `distortionGuitar` is a fuzz pedal or a preamp, which is a harder and later
 * thing, and it is here at a real weight only because the fuzz box existed and
 * Tony Iommi used one.
 *
 * `density: 0.72` is the highest of the four, which looks backwards next to three
 * eras of increasingly extreme music and is right: this is the era with the
 * organ, the acoustic interlude and the flute solo in it. Everything after it is
 * a *narrower* arrangement played harder.
 */
const heavy: EraProfile = {
  id: 'heavy',
  year: 1972,
  label: '1970–75 heavy',
  description:
    'One guitar into a valve amplifier at the edge of breakup, a Hammond in the corner, and a tape machine with a room on it.',
  drumBanks: [
    ['AkaiMPC60', 5],
    ['EmuSP12', 3],
    ['AlesisSR16', 3],
    ['RolandCompurhythm1000', 2],
  ],
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['overdriveGuitar', 6], ['distortionGuitar', 4], ['drawbarOrgan', 3],
      ['rockOrgan', 2], ['cleanGuitar', 2], ['flute', 1], ['harmonica', 1],
    ],
    counter: [
      ['overdriveGuitar', 5], ['drawbarOrgan', 4], ['distortionGuitar', 3],
      ['cleanGuitar', 2], ['rockOrgan', 2], ['flute', 1],
    ],
    comp: [
      ['overdriveGuitar', 6], ['distortionGuitar', 4], ['rockOrgan', 3],
      ['drawbarOrgan', 3], ['cleanGuitar', 2], ['percussiveOrgan', 1],
    ],
    pad: [
      ['drawbarOrgan', 4], ['strings1', 3], ['rockOrgan', 2], ['choirAahs', 1],
    ],
    bass: [['pickBass', 5], ['fingerBass', 5], ['fretlessBass', 1]],
    /**
     * There is no horn section in this music and never has been, so the `brass`
     * layer carries whatever the arrangement puts *behind* the band instead —
     * strings, an organ, a choir. Naming it honestly would mean renaming a layer
     * this genre does not own; naming it accurately in the palette is the version
     * available, and every style that would sound wrong with a section behind it
     * excludes the layer outright in `styles.ts`.
     */
    brass: [
      ['strings1', 4], ['drawbarOrgan', 3], ['choirAahs', 2], ['frenchHorn', 1],
    ],
  },
  styleWeights: {
    heavy: 9, doom: 6, stoner: 5, sludge: 1,
    nwobhm: 2, speed: 1, power: 0, glam: 0, shred: 0,
    thrash: 0, crossover: 0, groove: 1, metalcore: 0, industrial: 0,
    progressive: 4, djent: 0, techdeath: 0,
    death: 0, black: 0, melodeath: 0, symphonic: 1, gothic: 1, folkmetal: 2,
    postmetal: 2,
  },
  tempoScale: 0.94,
  /**
   * The largest key-change appetite of the four, and still small.
   *
   * This is the era whose bands had been playing in soul revues and reading
   * charts, and a last-verse lift is a thing a 1972 arranger did. Every era after
   * it is riff music: a riff is a *shape on a fretboard*, and moving it up a
   * semitone means moving it off the open string it was built on, which is not a
   * key change so much as a different riff. `preparedModulation: false` in
   * `index.ts` says the other half of this.
   */
  keyChangeChance: 0.1,
  density: 0.72,
  effects: {
    /**
     * The 4×12 cabinet, which is most of the sound and all of the top end.
     *
     * A Celestion-loaded 4×12 rolls off hard above about 5 kHz — it is a
     * mechanical low-pass built out of a heavy paper cone, and it is the reason a
     * distorted guitar is listenable at all: the clipping generates harmonics
     * forever and the speaker throws away everything above the fifth. Written as
     * a filter here because that is what it is, and every era below moves the
     * number rather than removing it.
     */
    comp: { reverb: 0.2, lowpass: 5200 },
    melody: { reverb: 0.28, delay: 0.14, lowpass: 5600 },
    counter: { reverb: 0.28, delay: 0.12, lowpass: 5400 },
    bass: { reverb: 0.06, lowpass: 2600 },
    drums: { reverb: 0.3, lowpass: 9000 },
    pad: { reverb: 0.4, lowpass: 4600 },
    brass: { reverb: 0.4, lowpass: 5500 },
    vocal: { reverb: 0.32, delay: 0.12, lowpass: 6500 },
  },
  space: { reverbSize: 0.58, delayBeats: 0.5, delayFeedback: 0.22 },
};

/**
 * NWOBHM — 1979–86.
 *
 * The second guitarist arrives and the organ leaves, and those are the same
 * sentence. `distortionGuitar` takes the head of every guitar table here, because
 * the sound is now a pedal or a hot preamp in front of the amp rather than the
 * amp alone — harder, tighter, and with an attack you can gallop on.
 *
 * The `counter` palette is the one that matters. In this era it is *another
 * guitar*, at nearly the same weight as the lead, which is what makes the
 * genre-level `arrangement.harmony` weighting mean anything: two distorted
 * guitars a third apart is the sound this decade invented and it needs both
 * layers to be the same instrument for it to read as one gesture rather than as
 * two players.
 *
 * `keyChangeChance: 0.04`. From here on the riff is a shape on a fretboard.
 */
const nwobhm: EraProfile = {
  id: 'nwobhm',
  year: 1982,
  label: '1979–86 new wave',
  description:
    'Two guitars where there was one, a pedal in front of the amp, the organ gone, and everything close-miked and dry.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['AlesisSR16', 4],
    ['EmuSP12', 3],
    ['RolandR8', 3],
    ['SimmonsSDS5', 2],
    ['LinnDrum', 1],
  ],
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['distortionGuitar', 7], ['overdriveGuitar', 4], ['leadSaw', 1],
      ['drawbarOrgan', 1],
    ],
    counter: [
      ['distortionGuitar', 7], ['overdriveGuitar', 4],
    ],
    comp: [
      ['distortionGuitar', 8], ['overdriveGuitar', 4], ['cleanGuitar', 1],
    ],
    pad: [
      ['strings1', 4], ['drawbarOrgan', 3], ['synthStrings', 2], ['choirAahs', 2],
    ],
    bass: [['pickBass', 6], ['fingerBass', 4], ['synthBass', 1]],
    brass: [
      ['strings1', 4], ['synthStrings', 3], ['choirAahs', 2], ['brassSection', 1],
    ],
  },
  styleWeights: {
    heavy: 4, doom: 2, stoner: 1, sludge: 0,
    nwobhm: 9, speed: 8, power: 6, glam: 7, shred: 6,
    thrash: 4, crossover: 3, groove: 1, metalcore: 0, industrial: 1,
    progressive: 3, djent: 0, techdeath: 0,
    death: 1, black: 1, melodeath: 0, symphonic: 1, gothic: 2, folkmetal: 1,
    postmetal: 0,
  },
  tempoScale: 1,
  keyChangeChance: 0.04,
  density: 0.66,
  effects: {
    comp: { reverb: 0.12, lowpass: 6000 },
    melody: { reverb: 0.24, delay: 0.16, lowpass: 6500 },
    counter: { reverb: 0.24, delay: 0.14, lowpass: 6200 },
    bass: { reverb: 0.04, lowpass: 3000 },
    /**
     * The one production cliché of this decade that is genuinely audible on the
     * kit: a gated plate on the snare, long enough to be a room and cut off
     * before it can be one. `reverb` alone cannot express the gate, so what is
     * left is the size — and a bright kit with a big send is the right half of it.
     */
    drums: { reverb: 0.42, lowpass: 11000 },
    pad: { reverb: 0.45, lowpass: 5000 },
    brass: { reverb: 0.4, lowpass: 6000 },
    vocal: { reverb: 0.34, delay: 0.16, lowpass: 7500 },
  },
  space: { reverbSize: 0.62, delayBeats: 0.5, delayFeedback: 0.25 },
};

/**
 * THRASH — 1986–92, and the era of the scoop.
 *
 * A solid-state preamp with the mid control at zero: a shelf up at 100 Hz, a
 * shelf up at 4 kHz, and a hole between them centred around 800. It sounds
 * enormous on its own and it disappears in a mix, which is the entire history of
 * eight years of records and of every argument any of these bands ever had with a
 * producer. This table cannot express a mid scoop — `Effects` has one low-pass
 * and one high-pass and no bell — so what it does instead is push the comp's
 * low-pass *up* to 7 kHz, which gets the fizz right and leaves the hole
 * unexpressed. That is the largest thing missing from this file and it is worth
 * saying rather than pretending the number is doing it.
 *
 * The room goes. `reverb: 0.06` on the comp is the lowest of the four eras and
 * essentially zero: a thrash rhythm guitar is close-miked with nothing on it,
 * because sixteen downstrokes to the bar through any reverb at all becomes a
 * smear. The kit keeps a little, and the snare on these records is famously the
 * one thing anybody argued about.
 *
 * `sequenced` is absent and `drumSources` names `box` and `programmed` at 1 each
 * against the kit's 12 — reachable, by `industrial` alone, and by nothing else in
 * the catalogue. See the header.
 */
const thrash: EraProfile = {
  id: 'thrash',
  year: 1988,
  label: '1986–92 thrash',
  description:
    'A solid-state preamp with the mids taken out, no room on anything, and a rhythm guitar close-miked so hard it has no space around it at all.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['AlesisSR16', 3],
    ['RolandR8', 3],
    ['AkaiXR10', 3],
    ['AlesisHR16', 2],
    ['SimmonsSDS5', 2],
    ['YamahaRX5', 1],
  ],
  drumSources: [['kit', 12], ['programmed', 1], ['box', 1]],
  palette: {
    melody: [
      ['distortionGuitar', 9], ['overdriveGuitar', 3],
    ],
    counter: [
      ['distortionGuitar', 9], ['overdriveGuitar', 3],
    ],
    comp: [
      ['distortionGuitar', 10], ['overdriveGuitar', 2],
    ],
    pad: [
      ['strings1', 3], ['synthStrings', 3], ['choirAahs', 2], ['padWarm', 1],
    ],
    bass: [['pickBass', 7], ['fingerBass', 4], ['synthBass', 1]],
    brass: [
      ['strings1', 3], ['synthStrings', 3], ['choirAahs', 2], ['frenchHorn', 1],
    ],
  },
  styleWeights: {
    heavy: 2, doom: 3, stoner: 2, sludge: 4,
    nwobhm: 3, speed: 5, power: 4, glam: 3, shred: 4,
    thrash: 9, crossover: 7, groove: 6, metalcore: 3, industrial: 5,
    progressive: 5, djent: 1, techdeath: 4,
    death: 6, black: 3, melodeath: 2, symphonic: 1, gothic: 2, folkmetal: 1,
    postmetal: 2,
  },
  tempoScale: 1.04,
  keyChangeChance: 0.02,
  density: 0.6,
  effects: {
    comp: { reverb: 0.06, lowpass: 7000 },
    melody: { reverb: 0.2, delay: 0.14, lowpass: 7200 },
    counter: { reverb: 0.2, delay: 0.12, lowpass: 7000 },
    bass: { reverb: 0.02, lowpass: 3400 },
    drums: { reverb: 0.24, lowpass: 12000 },
    pad: { reverb: 0.42, lowpass: 5200 },
    brass: { reverb: 0.38, lowpass: 6200 },
    vocal: { reverb: 0.26, delay: 0.12, lowpass: 7000 },
  },
  space: { reverbSize: 0.44, delayBeats: 0.5, delayFeedback: 0.2 },
};

/**
 * EXTREME — 1992–2000, and the one era here that is two eras pretending to be
 * one.
 *
 * A Florida death metal record and a Norwegian black metal record were made in
 * the same three years by people who had heard each other, and they sound as
 * different as any two things in this project: one is triggered, gridded and
 * clinical, and the other is a four-track in an unheated room. There is no single
 * `effects` block that is true of both, and the one below is the shape they share
 * seen from outside — **a long reverb on a filtered kit**, which is the black
 * metal record honestly and the death metal one's ambience mics.
 *
 * `lowpass: 4200` on the drums is the same gesture reggae's roots era makes and
 * means something different: there it is a dub engineer's high-pass on the drum
 * group, here it is a cymbal-heavy kit recorded too far away with a machine that
 * could not take it. Both produce a kit arriving through a wall; only one of them
 * meant to.
 *
 * The orchestra arrives, and it arrives properly. `strings1`, `strings2`,
 * `timpani`, `tubularBells`, `churchOrgan`, `pipeOrgan` and `choirAahs` are all
 * in the palette for the first time, because 1996 is when `symphonic` and
 * `gothic` become real styles rather than a keyboard on the side. `timpani` is in
 * the `pad` table rather than anywhere percussive, which is a compromise: it is a
 * pitched drum and the kit tables have no room for one, so it plays sustained low
 * notes underneath, which is at least what it is doing on the records.
 */
const extreme: EraProfile = {
  id: 'extreme',
  year: 1995,
  label: '1992–2000 extreme',
  description:
    'Blast beats, tremolo picking and a kit arriving through a wall — with a string section and a church organ arriving alongside it.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['RolandR8', 4],
    ['AkaiXR10', 3],
    ['AlesisSR16', 3],
    ['YamahaRY30', 2],
    ['AlesisHR16', 2],
    ['YamahaRX5', 1],
  ],
  drumSources: [['kit', 12], ['programmed', 2], ['electronic-kit', 1], ['box', 1]],
  palette: {
    melody: [
      ['distortionGuitar', 8], ['overdriveGuitar', 3], ['strings1', 2],
      ['fiddle', 1], ['recorder', 1],
    ],
    counter: [
      ['distortionGuitar', 7], ['strings1', 3], ['overdriveGuitar', 3],
      ['churchOrgan', 2], ['fiddle', 1], ['panFlute', 1], ['bagpipes', 1],
    ],
    comp: [
      ['distortionGuitar', 9], ['overdriveGuitar', 3], ['churchOrgan', 2],
      ['pipeOrgan', 1], ['cleanGuitar', 1],
    ],
    pad: [
      ['strings1', 4], ['strings2', 3], ['choirAahs', 3], ['churchOrgan', 2],
      ['synthStrings', 2], ['timpani', 1], ['padWarm', 1],
    ],
    bass: [['pickBass', 6], ['fingerBass', 5], ['synthBass', 1]],
    brass: [
      ['strings1', 4], ['choirAahs', 3], ['frenchHorn', 2], ['strings2', 2],
      ['tubularBells', 1], ['brassSection', 1],
    ],
  },
  styleWeights: {
    heavy: 1, doom: 4, stoner: 3, sludge: 5,
    nwobhm: 1, speed: 2, power: 6, glam: 0, shred: 2,
    thrash: 3, crossover: 3, groove: 5, metalcore: 6, industrial: 5,
    progressive: 4, djent: 5, techdeath: 6,
    death: 9, black: 9, melodeath: 8, symphonic: 6, gothic: 6, folkmetal: 5,
    postmetal: 6,
  },
  tempoScale: 1.06,
  keyChangeChance: 0.02,
  density: 0.64,
  effects: {
    comp: { reverb: 0.16, lowpass: 6600 },
    melody: { reverb: 0.3, delay: 0.16, lowpass: 6800 },
    counter: { reverb: 0.3, delay: 0.14, lowpass: 6600 },
    bass: { reverb: 0.04, lowpass: 3200 },
    // Through a wall — see the header. The one number in this file that is a
    // recording accident promoted to a style.
    drums: { reverb: 0.5, lowpass: 4200 },
    pad: { reverb: 0.6, lowpass: 5400 },
    brass: { reverb: 0.58, lowpass: 6000 },
    vocal: { reverb: 0.4, delay: 0.18, lowpass: 6800 },
  },
  space: { reverbSize: 0.76, delayBeats: 0.5, delayFeedback: 0.28 },
};

export const ERAS: Record<string, EraProfile> = { heavy, nwobhm, thrash, extreme };
