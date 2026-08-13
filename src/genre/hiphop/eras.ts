/**
 * Hiphop era profiles, 1980–2015.
 *
 * Four eras, and the axis is **where the loop comes from**. In iskelmä an era is
 * a change of clothes and in synth it is the instrument; funk's is who is keeping
 * time, and this is the next question along, asked of a music where the answer
 * stopped being a person almost immediately.
 *
 *   1980  a band plays the break, or two copies of a record are cut against
 *         each other by hand. The loop is *performed*.
 *   1991  a twelve-bit sampler holds four bars of somebody else's record. The
 *         loop is *taken*.
 *   2001  nothing is sampled at all: the sub, the hat and the plucked figure are
 *         drawn into a grid a step at a time. The loop is *made*.
 *   2015  the same, minus most of it, with the bottom two octaves doing the work
 *         of an arrangement. The loop is *what is left*.
 *
 * That is a genuinely four-point axis rather than four decorations of one, and
 * the tables below reflect it in the one field that matters: `drumSources` goes
 * `kit`-led, then `programmed`-led, then `programmed` alone. By 2015 there is
 * nobody in the room and the era says so in a single-entry table, which only
 * `jb` in funk does from the other end.
 *
 * ## On the banks
 *
 * Four of the five machines named here are the ones the records were made on,
 * which is a luxury the older genres in this project do not have. `AkaiMPC60`
 * and `EmuSP12` are the two samplers the golden era was built on; `RolandTR808`
 * is the sound of the bottom of this music from 1982 to now and is in three of
 * the four eras for that reason; `MPC1000` is a seven-sample sampler with no
 * cymbals at all, which is not a poor kit but an accurate one — its own note in
 * `BANK_VOICES` says a fill on it lands on the shaker and the spare percussion,
 * *"which is closer to the genre than a tom roll would have been."*
 *
 * **The racks, and why only two eras have one.** `AkaiMPC60+congas` puts a real
 * sampled conga rack beside the machine, and a rack is additive: it is not what
 * the drummer switched to, it is what the person next to them is playing. That
 * is period-correct for 1980, where the band had a percussionist, and for 1991,
 * where the four bars being looped had one on them. It is absent from 2001 and
 * 2015 for the reason the rack rule enforces anyway — but note that the rule
 * would not have stopped either, because neither era offers `box`. They have no
 * rack because there is nobody there.
 *
 * ## On `keyChangeChance`, which is under 0.03 throughout
 *
 * The lowest set of values in the project. A final chorus a tone up is a thing
 * an arranger does to a song, and what is under these records is not a song, it
 * is two bars that have been playing since the first second. Transposing them
 * for the last thirty would not be a lift, it would be an edit — and `Genre`'s
 * `preparedModulation: false` says the other half of the same sentence.
 */

import type { EraProfile } from '../../style/types.js';

/**
 * PARK JAM — 1980.
 *
 * Two turntables and a crate, or the house band the label hired because
 * fifteen minutes of somebody else's record could not be pressed. Both are here
 * and they produce the same table, which is the interesting part: the
 * instruments are a funk rhythm section because on the records that got made,
 * they were one.
 *
 * `drumSources` is `kit` at 6 against `programmed` at 4 and there is no `box`.
 * A preset rhythm machine existed in 1980 and would have been the wrong object
 * — this music's whole proposition at this date is a *break*, four bars of a
 * drummer, cut back and forth, and a box has no fills and cannot be cut because
 * it never varies. `programmed` at 4 is the 808 and the CR-78 arriving, which
 * they genuinely did in this exact year.
 *
 * `density: 0.62` and it is the highest here. There are still nine people on
 * some of these records; from 1991 the number falls every era.
 */
const parkjam: EraProfile = {
  id: 'parkjam',
  year: 1980,
  label: '1980 park jam',
  description:
    'Two turntables and a crate, or the house band hired to play the break: a chanking guitar, a bass that walks, and an 808 arriving.',
  drumBanks: [
    ['AkaiMPC60+congas', 4],
    ['RolandR8+congas', 3],
    ['LinnLM1', 3],
    ['AlesisSR16+congas', 2],
    ['RolandTR808', 2],
  ],
  drumSources: [['kit', 6], ['programmed', 4]],
  // Low and non-zero. Some of this is a bass player and some of it is a Moog
  // somebody stepped in one note at a time; a fifth is about where that sits.
  sequenced: { bass: 0.2 },
  palette: {
    melody: [
      ['leadSquare', 4], ['clavinet', 4], ['cleanGuitar', 3], ['leadSaw', 3],
      ['tenorSax', 3], ['epiano1', 3], ['trumpet', 2], ['drawbarOrgan', 2],
    ],
    counter: [
      ['clavinet', 4], ['cleanGuitar', 3], ['trumpet', 3], ['epiano1', 3],
      ['leadSquare', 2], ['vibraphone', 2], ['trombone', 1],
    ],
    // The muted guitar leads the comp palette here for the same reason it leads
    // funk's: a 0.25-second decay is the only thing in the catalogue that can
    // play sixteen sixteenths without turning them into a chord.
    comp: [
      ['mutedGuitar', 6], ['clavinet', 5], ['epiano1', 4], ['cleanGuitar', 3],
      ['drawbarOrgan', 3], ['piano', 2], ['epiano2', 2],
    ],
    pad: [['strings1', 4], ['synthStrings', 3], ['drawbarOrgan', 3], ['brassSection', 2]],
    bass: [['fingerBass', 6], ['slapBass', 4], ['synthBass', 3], ['pickBass', 2], ['slapBass2', 1]],
    brass: [
      ['brassSection', 4], ['synthBrass', 3], ['trumpet', 3], ['tenorSax', 3],
      ['trombone', 2],
    ],
  },
  styleWeights: {
    oldschool: 9, electrorap: 6, miami: 3, breaks: 8, boombap: 1, jazzrap: 1,
    soulloop: 2, hornloop: 2, hardcore: 0, conscious: 2, party: 8, gfunk: 0,
    clubrap: 1, bounce: 1, dirtysouth: 0, crunk: 0, chopped: 0, phonk: 0,
    trap: 0, drill: 0, cloud: 0, lofi: 1, abstract: 1, minimal: 2,
  },
  tempoScale: 1,
  keyChangeChance: 0.02,
  density: 0.62,
  /**
   * A room, and a lot of top. These records were cut fast and loud onto tape
   * with the whole band in one space, and the tape is the only thing rolling
   * anything off — which is why the comp is up at 9 kHz here where `golden`
   * puts it at 6200 with a bit-crusher over it.
   *
   * **This used to claim it was the brightest era in the genre and the only one
   * whose comp is allowed above 9 kHz, and it is neither.** The comp is *at*
   * 9 kHz rather than above it; `southern` sits at the same 9000; and `modern`
   * is higher on every one of the four layers this era names — comp 11000
   * against 9000, melody 12000 against 8500, drums 13000 against 11000, pad
   * 7000 against 5000. All four eras are in this file and could have been read.
   * The claim that survives is the local one and it is the one the paragraph
   * was actually making: **this is the brightest of the two eras that predate
   * digital**, which is what "the tape is the only thing rolling anything off"
   * argues, and `golden` at 6200 with a `crush: 12` on it is the contrast.
   */
  effects: {
    comp: { reverb: 0.16, lowpass: 9000 },
    drums: { reverb: 0.2, lowpass: 11000 },
    melody: { reverb: 0.24, delay: 0.14, lowpass: 8500 },
    pad: { reverb: 0.4, lowpass: 5000 },
  },
};

/**
 * GOLDEN — 1991.
 *
 * A twelve-bit sampler with about eight seconds of memory in it, and four bars
 * of a record made twenty years earlier. This is the era the genre is a
 * photograph of, and every number in the table is downstream of one hardware
 * fact: **there was not enough memory to be tidy.** The loop is short because
 * memory is short, the sample is dark because it was recorded at 26 kHz, and it
 * is dirty because a twelve-bit converter is dirty.
 *
 * `drumSources` is `programmed` at 8 against `kit` at 2, and the two are not
 * what those words usually mean here. `programmed` is somebody tapping four
 * pads and quantising it, which is a person playing a machine; the `kit` weight
 * is the records with a live drummer overdubbed on top of the loop, which is a
 * real and much-loved corner of this decade.
 *
 * The palette is where the era diverges hardest from its neighbours. The comp
 * and melody lists are full of **acoustic instruments played in 1969** — a
 * Rhodes, an upright, a vibraphone, a flute — because that is what was on the
 * records being sampled, and the sampler is a transparent object: what you hear
 * is a jazz quartet, filtered.
 */
const golden: EraProfile = {
  id: 'golden',
  year: 1991,
  label: '1991 golden era',
  description:
    'A twelve-bit sampler with eight seconds of memory, four bars of a 1969 jazz record, and a kick sitting on top of it.',
  drumBanks: [
    ['AkaiMPC60', 5],
    ['EmuSP12', 4],
    ['RolandTR808', 3],
    ['AkaiMPC60+congas', 3],
    ['LinnLM2', 2],
  ],
  drumSources: [['programmed', 8], ['kit', 2]],
  sequenced: { bass: 0.3, counter: 0.15 },
  palette: {
    // A jazz quartet, filtered. Every one of the top five is an instrument
    // somebody played in about 1969 and nobody played in 1991.
    melody: [
      ['vibraphone', 5], ['epiano1', 5], ['tenorSax', 4], ['flute', 3],
      ['trumpet', 3], ['piano', 3], ['leadSquare', 2], ['mutedTrumpet', 2],
    ],
    counter: [
      ['vibraphone', 4], ['epiano1', 4], ['mutedTrumpet', 3], ['celesta', 2],
      ['kalimba', 2], ['flute', 2], ['trumpet', 2], ['clavinet', 1],
    ],
    comp: [
      ['epiano1', 6], ['piano', 4], ['jazzGuitar', 4], ['drawbarOrgan', 3],
      ['vibraphone', 3], ['clavinet', 2], ['epiano2', 2],
    ],
    pad: [
      ['strings1', 4], ['synthStrings', 3], ['padWarm', 2], ['synthChoir', 2],
      ['drawbarOrgan', 2],
    ],
    // The upright is at the top here and nowhere else in the genre, and it is
    // not a jazz bass — it is a jazz bass *sampled*, which is a different and
    // much shorter object.
    bass: [
      ['acousticBass', 5], ['fingerBass', 5], ['synthBass', 3], ['fretlessBass', 2],
      ['pickBass', 2],
    ],
    brass: [
      ['brassSection', 5], ['tenorSax', 4], ['trumpet', 3], ['trombone', 3],
      ['baritoneSax', 2], ['synthBrass', 1],
    ],
  },
  styleWeights: {
    oldschool: 2, electrorap: 1, miami: 3, breaks: 6, boombap: 9, jazzrap: 8,
    soulloop: 8, hornloop: 8, hardcore: 7, conscious: 7, party: 5, gfunk: 6,
    clubrap: 3, bounce: 3, dirtysouth: 1, crunk: 0, chopped: 2, phonk: 4,
    trap: 0, drill: 0, cloud: 1, lofi: 5, abstract: 5, minimal: 3,
  },
  tempoScale: 1,
  keyChangeChance: 0.01,
  density: 0.6,
  /**
   * Dark and dirty, and both on purpose. `lowpass` at 6200 on the comp is the
   * 26 kHz sample rate; `crush: 12` is the converter. The drums are *not*
   * crushed to the same depth, because the kick and snare on these records were
   * usually the one thing sampled at full rate, and a genre that bit-reduced its
   * own backbeat would have thrown away the reason the loop was worth burying.
   */
  effects: {
    comp: { reverb: 0.22, lowpass: 6200, crush: 12 },
    melody: { reverb: 0.26, delay: 0.12, lowpass: 6800, crush: 12 },
    counter: { reverb: 0.26, lowpass: 6500, crush: 12 },
    drums: { reverb: 0.14, lowpass: 9500 },
    bass: { reverb: 0.03, lowpass: 1400 },
    pad: { reverb: 0.42, lowpass: 4200, crush: 12 },
  },
};

/**
 * SOUTHERN — 2001.
 *
 * Nothing is sampled. The sub, the hat, the plucked figure and the string stab
 * are drawn into a grid a step at a time, and the record is *built* rather than
 * found — which is the largest single change in this genre's history and the
 * reason this era exists as its own row rather than as a variant of the last
 * one.
 *
 * Two consequences show up in the table. The palette turns synthetic in one
 * step: `synthBass` and `synthBass2` take the whole bottom of the list because
 * the bottom of the record is one tuned sine, and the melodic instruments become
 * the ones a workstation had presets for — plucked strings, a celesta, a marimba
 * and, unapologetically, a pan flute, which is on more of these records than
 * anybody involved would now admit.
 *
 * `drumSources` has `electronic-kit` at 1 and it is the only appearance of that
 * value in the genre: the corner of this decade where somebody triggered the
 * sounds off pads in front of an audience. There is no `kit` weight at all from
 * here on.
 */
const southern: EraProfile = {
  id: 'southern',
  year: 2001,
  label: '2001 southern',
  description:
    'Nothing sampled: a tuned sine for a bass, a hat that has started subdividing, and a plucked figure entered a step at a time.',
  drumBanks: [
    ['RolandTR808', 5],
    ['MPC1000', 5],
    ['RolandMC303', 3],
    ['AkaiXR10', 2],
    ['AlesisSR16', 2],
  ],
  drumSources: [['programmed', 9], ['electronic-kit', 1]],
  sequenced: { bass: 0.6, counter: 0.3 },
  palette: {
    melody: [
      ['leadSquare', 5], ['leadSaw', 4], ['synthStrings2', 3], ['celesta', 3],
      ['marimba', 3], ['panFlute', 2], ['epiano2', 2], ['leadCharang', 2],
    ],
    counter: [
      ['celesta', 4], ['marimba', 3], ['kalimba', 3], ['leadSquare', 3],
      ['xylophone', 2], ['glockenspiel', 2],
    ],
    comp: [
      ['synthStrings', 4], ['padPoly', 4], ['nylonGuitar', 3], ['epiano2', 3],
      ['leadSquare', 3], ['harp', 2], ['celesta', 2],
    ],
    pad: [
      ['synthStrings2', 5], ['padPoly', 3], ['synthChoir', 3], ['padWarm', 2],
      ['strings2', 2],
    ],
    // The whole bottom of the list is a synthesiser, and the two acoustic
    // survivors are there for the styles that predate the change.
    bass: [
      ['synthBass', 7], ['synthBass2', 6], ['fingerBass', 2], ['slapBass2', 1],
    ],
    brass: [
      ['synthBrass2', 5], ['synthBrass', 4], ['orchestraHit', 3], ['brassSection', 2],
      ['trumpet', 1],
    ],
  },
  styleWeights: {
    oldschool: 0, electrorap: 0, miami: 2, breaks: 2, boombap: 4, jazzrap: 3,
    soulloop: 3, hornloop: 2, hardcore: 4, conscious: 4, party: 4, gfunk: 5,
    clubrap: 8, bounce: 7, dirtysouth: 9, crunk: 9, chopped: 8, phonk: 5,
    trap: 3, drill: 0, cloud: 2, lofi: 3, abstract: 3, minimal: 3,
  },
  tempoScale: 1,
  keyChangeChance: 0.02,
  density: 0.55,
  /**
   * Bright, wide and dry. This is the first era here mixed for a car rather than
   * a room: the reverb sends fall to about half the golden era's on every layer,
   * and the low-pass corners go up by two or three kilohertz, because a
   * reverberant record in a small hard space with a large subwoofer is mud. The
   * bass is the darkest object in the project at 700 Hz and that is not a
   * filtering decision — it is what a sine wave is.
   */
  effects: {
    comp: { reverb: 0.14, lowpass: 9000 },
    melody: { reverb: 0.18, delay: 0.14, lowpass: 10000 },
    drums: { reverb: 0.08, lowpass: 12000 },
    bass: { reverb: 0.0, lowpass: 700 },
    pad: { reverb: 0.32, lowpass: 6000 },
  },
};

/**
 * MODERN — 2015.
 *
 * The same object as 2001 with most of it removed. Two octaves at the bottom, a
 * hi-hat at the top, and about eight seconds of air in between where the
 * arrangement used to be — the *sparseness* is the production value, and the
 * expensive part of one of these records is how little is on it.
 *
 * `drumSources: [['programmed', 10]]`. A single-entry table, which only funk's
 * `jb` does elsewhere and from the opposite end: there the claim is that a human
 * being is placing every sixteenth by hand and nothing else will do, and here it
 * is that nobody is in the room at all. Between them those two rows are the arc
 * this whole project's percussion has travelled.
 *
 * `density: 0.44` is the lowest outside ambient. The pad list is long and its
 * weights are real, but a pad in this era is a *tail* on the plucked figure
 * rather than a bed under the band, which is why `mix.pad` in `hiphop/index.ts`
 * is where it is.
 */
const modern: EraProfile = {
  id: 'modern',
  year: 2015,
  label: '2015 modern',
  description:
    'Two octaves at the bottom, a hi-hat at the top, and eight seconds of air where the arrangement used to be.',
  drumBanks: [
    ['MPC1000', 5],
    ['RolandTR808', 5],
    ['RolandMC303', 3],
    ['KorgM1', 2],
  ],
  /**
   * Nobody is in the room. See the header — this is the only single-entry
   * `drumSources` table in the project besides funk's 1968, and the two of them
   * are the two ends of the same argument.
   */
  drumSources: [['programmed', 10]],
  sequenced: { bass: 0.75, counter: 0.4 },
  palette: {
    melody: [
      ['leadSquare', 5], ['musicBox', 4], ['celesta', 4], ['kalimba', 3],
      ['leadSaw', 3], ['tubularBells', 3], ['panFlute', 2], ['synthChoir', 2],
    ],
    counter: [
      ['celesta', 4], ['musicBox', 3], ['glockenspiel', 3], ['kalimba', 3],
      ['leadSquare', 2], ['harp', 2],
    ],
    comp: [
      ['nylonGuitar', 4], ['celesta', 4], ['harp', 3], ['padPoly', 3],
      ['leadSquare', 3], ['musicBox', 2], ['epiano2', 2],
    ],
    pad: [
      ['padWarm', 4], ['padHalo', 4], ['synthChoir', 3], ['padSweep', 2],
      ['synthStrings2', 2], ['padNewAge', 2],
    ],
    bass: [['synthBass', 8], ['synthBass2', 6], ['fingerBass', 1]],
    brass: [['synthBrass2', 4], ['orchestraHit', 3], ['brassSection', 2], ['synthBrass', 2]],
  },
  styleWeights: {
    oldschool: 0, electrorap: 0, miami: 1, breaks: 1, boombap: 3, jazzrap: 2,
    soulloop: 2, hornloop: 1, hardcore: 3, conscious: 3, party: 2, gfunk: 2,
    clubrap: 2, bounce: 3, dirtysouth: 5, crunk: 3, chopped: 4, phonk: 7,
    trap: 9, drill: 9, cloud: 7, lofi: 8, abstract: 4, minimal: 6,
  },
  tempoScale: 1,
  keyChangeChance: 0.01,
  density: 0.44,
  /**
   * The widest and the emptiest. Reverb comes back up from 2001's figures — not
   * as a room but as a *tail*, which is what a plucked bell in eight seconds of
   * silence needs to be audible as an event — while the drums stay bone dry,
   * because a hat pattern with a tail on it is a wash and the pattern is the
   * point. The bass is at 600 Hz, which was the darkest number in the project
   * when this was written and is now the second darkest: dnb's `design` era
   * went to 520 afterwards, and dnb's `studio` ties this at 600. Kept in the
   * past tense because the *reason* is unchanged and is the interesting half —
   * 600 Hz is not a taste, it is where a sub stops being a note and starts
   * being a pressure, and dnb arriving below it from a different decade is
   * confirmation rather than competition.
   */
  effects: {
    comp: { reverb: 0.34, delay: 0.2, lowpass: 11000 },
    melody: { reverb: 0.4, delay: 0.26, lowpass: 12000 },
    counter: { reverb: 0.44, delay: 0.3, lowpass: 12000 },
    drums: { reverb: 0.06, lowpass: 13000 },
    bass: { reverb: 0.0, lowpass: 600 },
    pad: { reverb: 0.6, lowpass: 7000 },
  },
};

export const ERAS: Record<string, EraProfile> = { parkjam, golden, southern, modern };
