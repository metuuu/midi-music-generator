/**
 * Drum and bass era profiles, 1992–2012.
 *
 * Four eras, and the axis is **what the drums are made of**, which is the same
 * question the style catalogue is sorted by and is asked here at a coarser
 * grain. In iskelmä an era is a change of clothes, in synth it is the
 * instrument, in funk it is who is keeping time and in hiphop it is where the
 * loop came from. Here it is *how finely somebody can cut a recording of a
 * drummer, and whether they still want to.*
 *
 *   1992  a break is sampled whole, pitched up and looped. The kit is
 *         **borrowed**.
 *   1995  the same break is cut into sixteen pieces and reassembled. The kit is
 *         **operated**.
 *   2002  the pieces are thrown away and each drum is a separate sample, layered
 *         and gated. The kit is **assembled**.
 *   2012  the samples are synthesised too, and the loudest thing on the record
 *         is a bass patch. The kit is **what is left over**.
 *
 * ## `drumSources`, and the fact this genre has to state four times
 *
 * **Nobody is in the room, in any era.** Two of the four tables below are single
 * entries reading `[['programmed', 10]]`, which before this genre existed only
 * funk's 1968 and hiphop's 2015 did — and those two are the opposite ends of one
 * argument, a person placing every sixteenth by hand against a machine placing
 * them all. This genre is the only one in the project where *every* era is the
 * second answer.
 *
 * The two that are not single entries admit `electronic-kit` at a weight of one,
 * and that is a specific historical thing rather than a hedge: from about 1997
 * a handful of these acts toured with a drummer on pads, and one of them won a
 * national album prize doing it. One in ten is roughly how often that was true.
 * There is no `kit` weight anywhere and no `box` weight anywhere — a preset
 * rhythm machine has no fills and cannot be cut, and cutting is the genre.
 *
 * ## On the banks
 *
 * None of these machines is what the records were made on, and that is worth
 * being honest about rather than pretending otherwise. The instrument of this
 * genre is an **Akai sampler** — an S950, an S1000, later an MPC — loaded with
 * somebody else's six seconds, and a sampler is not a drum machine: it has no
 * sounds of its own, which is precisely why it is not in `BANK_VOICES` and
 * cannot be. What the tables name instead are the machines whose *individual
 * samples* ended up on these records anyway, which is a real and different
 * claim: a 909 kick under a sampled break is what half of 1995 sounds like, and
 * `MPC1000`'s seven-sample kit with no cymbals in it is a better description of
 * a 2012 drum bus than any full acoustic kit in the library.
 *
 * **One rack, in one era.** `AlesisSR16+congas` sits at a low weight in 2002 for
 * one style — `sambass`, whose whole proposition is a batucada overdubbed onto a
 * two-step, and which is the only style in this genre whose drum tables reach
 * the auxiliary voices at all. The residual is named rather than hidden: a rack
 * is drawn per era, so a liquid track drawn in that era occasionally gets a
 * conga beside its break. That is a thing those records did.
 *
 * ## On `keyChangeChance`, which is 0.01 throughout
 *
 * The lowest set of values in the project, below even hiphop's. A final chorus a
 * tone up is something an arranger does to a song; what is under these records
 * is one chord and a sub, and a DJ has a *second copy* of it running on the
 * other deck. Transposing the last thirty seconds would put the two out of tune
 * with each other, which is not a musical objection but is the one that decides
 * it. `Genre.preparedModulation: false` says the other half of the same sentence.
 */

import type { EraProfile } from '../../style/types.js';

/**
 * RAVE — 1992.
 *
 * A warehouse, a hired rig and a twelve-bit sampler with eight seconds in it.
 * The break is taken whole, pitched up by a fifth of its own speed and looped;
 * the piano is played with two fingers; the orchestra hit is on more of these
 * records than anybody now admits, which is why `orchestraHit` is high in the
 * brass list and appears nowhere else in this file above a weight of 3.
 *
 * `density: 0.66` is the highest here and the number falls in every era after
 * it. That is the whole arc of the genre in one column: from 1995 onward the
 * expensive thing about one of these records is how little is on it.
 *
 * The palette is the only one in this file with a piano at the top of it. Two
 * years later there is no piano in this music at all.
 */
const rave: EraProfile = {
  id: 'rave',
  year: 1992,
  label: '1992 rave',
  description:
    'A warehouse, a hired rig and eight seconds of sampler: the break taken whole and pitched up, with a piano over it.',
  drumBanks: [
    ['AkaiMPC60', 5],
    ['EmuSP12', 4],
    ['RolandTR909', 4],
    ['AlesisSR16', 2],
    ['RolandR8', 2],
  ],
  // Nobody is in the room. See the header — two of these four tables are single
  // entries and this is the first of them.
  drumSources: [['programmed', 10]],
  sequenced: { bass: 0.5, counter: 0.2 },
  palette: {
    melody: [
      ['leadSquare', 5], ['piano', 4], ['leadSaw', 4], ['leadCalliope', 3],
      ['synthStrings', 3], ['brassSection', 2], ['leadCharang', 2], ['celesta', 1],
    ],
    counter: [
      ['leadSquare', 4], ['celesta', 3], ['piano', 3], ['leadSaw', 3],
      ['glockenspiel', 2], ['vibraphone', 2], ['orchestraHit', 1],
    ],
    // The piano leads a comp list here and in no other era of this genre. It is
    // the single clearest marker of the eighteen months before the turn.
    comp: [
      ['piano', 6], ['synthStrings', 4], ['epiano1', 3], ['drawbarOrgan', 3],
      ['padPoly', 2], ['leadSquare', 2],
    ],
    pad: [
      ['synthStrings', 5], ['padWarm', 3], ['strings1', 3], ['synthChoir', 3],
      ['padPoly', 2],
    ],
    bass: [['synthBass', 7], ['synthBass2', 5], ['fingerBass', 2], ['fretlessBass', 1]],
    brass: [
      ['orchestraHit', 5], ['synthBrass', 4], ['brassSection', 3], ['synthBrass2', 3],
      ['trumpet', 1],
    ],
  },
  styleWeights: {
    bleep: 8, hardcore: 9, darkcore: 8, jungle: 4, ragga: 3, hardstep: 1,
    jazzstep: 0, atmospheric: 2, intelligent: 1, drumfunk: 0, techstep: 0,
    neurofunk: 0, liquid: 0, rollers: 0, jumpup: 0, dancefloor: 0, sambass: 0,
    breakcore: 1, dubwise: 1, deep: 0, autonomic: 0, halftime: 0, minimal: 1,
    revival: 0,
  },
  tempoScale: 1,
  keyChangeChance: 0.01,
  density: 0.66,
  /**
   * Bright, wet and cheap. These were mixed onto DAT in a bedroom and cut to
   * vinyl loud; the reverb is a rack unit on everything at once rather than a
   * room, and the top end is a twelve-bit converter's, which is to say it is
   * gritty rather than dark. The bass is at 1200 Hz — the highest in this genre,
   * because in 1992 the bottom is still a synthesiser with a filter open rather
   * than a sine.
   */
  effects: {
    comp: { reverb: 0.3, lowpass: 8000, crush: 12 },
    melody: { reverb: 0.34, delay: 0.18, lowpass: 8500, crush: 12 },
    drums: { reverb: 0.22, lowpass: 10000 },
    bass: { reverb: 0.04, lowpass: 1200 },
    pad: { reverb: 0.5, lowpass: 5000 },
  },
};

/**
 * DUBPLATE — 1995.
 *
 * The sampler stops being a tape machine and becomes a scalpel. The break is cut
 * into sixteen pieces and put back in an order nobody played, the piano is gone,
 * the key is minor, and the finished track is cut to a one-off acetate the same
 * afternoon and tested in a room that night — which is where the era gets its
 * name and why it is a *production* era rather than a technological one.
 *
 * The palette turns acoustic in one step and this is the era's real signature.
 * `epiano1`, `vibraphone`, `flute`, `acousticBass`: every one of them is an
 * instrument somebody played in about 1968 and nobody played in 1995, and they
 * are here for the same reason hiphop's golden era is full of them — what is
 * being heard is a jazz quartet, sampled, filtered, and stripped for parts.
 *
 * `sequenced.bass` at 0.6 against 1992's 0.5, and the increase is the sub
 * arriving. From here the bottom of the record is a keyboard part rather than an
 * instrument.
 */
const dubplate: EraProfile = {
  id: 'dubplate',
  year: 1995,
  label: '1995 dubplate',
  description:
    'The sampler as a scalpel: the break cut into sixteen pieces, the piano gone, and the finished track on acetate by evening.',
  drumBanks: [
    ['AkaiMPC60', 5],
    ['AkaiXR10', 4],
    ['EmuSP12', 3],
    ['RolandTR909', 3],
    ['YamahaRX5', 2],
  ],
  // The second single-entry table. See the header.
  drumSources: [['programmed', 10]],
  sequenced: { bass: 0.6, counter: 0.3 },
  palette: {
    // A jazz quartet, stripped for parts. Four of the top five are instruments
    // nobody in this scene owned or could play.
    melody: [
      ['epiano1', 5], ['vibraphone', 4], ['flute', 4], ['leadSquare', 3],
      ['tenorSax', 3], ['celesta', 2], ['mutedTrumpet', 2], ['kalimba', 2],
    ],
    counter: [
      ['vibraphone', 4], ['celesta', 3], ['flute', 3], ['epiano1', 3],
      ['kalimba', 2], ['glockenspiel', 2], ['harp', 2],
    ],
    comp: [
      ['epiano1', 6], ['jazzGuitar', 4], ['drawbarOrgan', 3], ['piano', 3],
      ['vibraphone', 3], ['padWarm', 2],
    ],
    pad: [
      ['padWarm', 5], ['strings1', 4], ['synthStrings', 3], ['synthChoir', 3],
      ['padHalo', 2], ['padNewAge', 2],
    ],
    // The upright is here and nowhere else in the genre, and it is `jazzstep`'s
    // — a double bass sampled off a 1963 record, which is a much shorter object
    // than a double bass.
    bass: [
      ['synthBass', 6], ['synthBass2', 5], ['acousticBass', 3], ['fretlessBass', 2],
      ['fingerBass', 2],
    ],
    brass: [
      ['brassSection', 4], ['tenorSax', 4], ['trumpet', 3], ['synthBrass', 3],
      ['trombone', 2], ['orchestraHit', 2],
    ],
  },
  styleWeights: {
    bleep: 2, hardcore: 3, darkcore: 5, jungle: 9, ragga: 9, hardstep: 8,
    jazzstep: 7, atmospheric: 8, intelligent: 8, drumfunk: 6, techstep: 6,
    neurofunk: 2, liquid: 1, rollers: 3, jumpup: 3, dancefloor: 1, sambass: 3,
    breakcore: 4, dubwise: 4, deep: 2, autonomic: 0, halftime: 0, minimal: 2,
    revival: 0,
  },
  tempoScale: 1,
  keyChangeChance: 0.01,
  density: 0.58,
  /**
   * Dark and close. `lowpass` at 6400 on the comp is the sample rate somebody
   * chose to fit four bars into the memory they had; `crush: 12` is the
   * converter. The drums are not crushed to the same depth, because the break
   * was usually the one thing sampled at full rate — a genre that bit-reduced
   * its own drums would have thrown away the reason for the record.
   *
   * The bass drops to 800 Hz. This is where the sub arrives.
   */
  effects: {
    comp: { reverb: 0.28, lowpass: 6400, crush: 12 },
    melody: { reverb: 0.3, delay: 0.16, lowpass: 7000, crush: 12 },
    counter: { reverb: 0.34, lowpass: 6800, crush: 12 },
    drums: { reverb: 0.16, lowpass: 10500 },
    bass: { reverb: 0.02, lowpass: 800 },
    pad: { reverb: 0.52, lowpass: 4600 },
  },
};

/**
 * STUDIO — 2002.
 *
 * Nothing is cut any more. Each drum is a separate sample, layered two or three
 * deep, gated and compressed until it hits like a door closing, and the record
 * is assembled on a screen rather than played into anything. It is the largest
 * single change in this genre's history and it is what divides the ghosted half
 * of `styles.ts` from the unghosted half — a snare made of three samples cannot
 * have a quiet copy of itself a sixteenth later, because there is no arm.
 *
 * The bass changes at the same moment and in the same way. `synthBass` and
 * `synthBass2` take the whole top of the list, because the bottom of one of
 * these records is a patch that has been resampled and re-filtered four times
 * and is no longer a note anybody could play.
 *
 * `electronic-kit` at 1 is the live-act experiment — a drummer on pads in front
 * of an audience, which for about five years genuinely happened. It is the only
 * appearance of a human drummer in this genre and it is one draw in ten.
 */
const studio: EraProfile = {
  id: 'studio',
  year: 2002,
  label: '2002 studio',
  description:
    'Each drum a separate sample, layered and gated until it lands like a door closing, and the record built on a screen.',
  drumBanks: [
    ['MPC1000', 5],
    ['RolandTR909', 4],
    ['YamahaRY30', 3],
    ['RolandJD990', 3],
    ['AkaiXR10', 2],
    // The one rack in this genre, and it is `sambass`'s. See the header.
    ['AlesisSR16+congas', 2],
  ],
  drumSources: [['programmed', 9], ['electronic-kit', 1]],
  sequenced: { bass: 0.8, counter: 0.4 },
  palette: {
    melody: [
      ['leadSaw', 5], ['leadSquare', 4], ['epiano2', 4], ['celesta', 3],
      ['synthStrings2', 3], ['kalimba', 2], ['padHalo', 2], ['glockenspiel', 2],
    ],
    counter: [
      ['celesta', 4], ['leadSquare', 3], ['glockenspiel', 3], ['kalimba', 3],
      ['guitarHarmonics', 2], ['harp', 2], ['electricVibes', 2],
    ],
    comp: [
      ['epiano2', 5], ['padPoly', 4], ['synthStrings', 4], ['nylonGuitar', 3],
      ['leadSquare', 3], ['harp', 2],
    ],
    pad: [
      ['padPoly', 4], ['synthStrings2', 4], ['padWarm', 3], ['synthChoir', 3],
      ['padSweep', 2], ['strings2', 2],
    ],
    // The whole top of the list is a synthesiser and the two survivors are for
    // the styles that predate the change.
    bass: [['synthBass', 8], ['synthBass2', 7], ['fretlessBass', 2], ['fingerBass', 1]],
    brass: [
      ['synthBrass2', 5], ['synthBrass', 4], ['orchestraHit', 3], ['brassSection', 2],
      ['tenorSax', 1],
    ],
  },
  styleWeights: {
    bleep: 0, hardcore: 1, darkcore: 2, jungle: 3, ragga: 3, hardstep: 4,
    jazzstep: 4, atmospheric: 4, intelligent: 3, drumfunk: 7, techstep: 8,
    neurofunk: 9, liquid: 9, rollers: 8, jumpup: 8, dancefloor: 8, sambass: 6,
    breakcore: 5, dubwise: 6, deep: 6, autonomic: 1, halftime: 1, minimal: 4,
    revival: 1,
  },
  tempoScale: 1,
  keyChangeChance: 0.01,
  density: 0.5,
  /**
   * Loud, wide and nearly dry. This is the first era here mixed for a club
   * system rather than for a room: the reverb sends fall to about half the
   * dubplate era's on every layer and the low-pass corners go up by three or
   * four kilohertz, because a reverberant record on a rig with four
   * eighteen-inch drivers is mud. The bass sits at 600 Hz and that is not a
   * filtering decision — it is what a sine wave with a pitch envelope on it is.
   */
  effects: {
    comp: { reverb: 0.16, lowpass: 10000 },
    melody: { reverb: 0.22, delay: 0.18, lowpass: 11000 },
    counter: { reverb: 0.28, delay: 0.22, lowpass: 11000 },
    drums: { reverb: 0.09, lowpass: 13000 },
    bass: { reverb: 0.0, lowpass: 600 },
    pad: { reverb: 0.38, lowpass: 6500 },
  },
};

/**
 * DESIGN — 2012.
 *
 * The samples are synthesised too. Nothing on one of these records was recorded
 * by anybody: the kick is a sine with an envelope, the snare is noise through a
 * gate, and the loudest object in the mix is a bass patch that has been
 * resampled so many times it has a formant contour. The arrangement is that
 * patch, a hat, and about nine seconds of air.
 *
 * `density: 0.42` is the lowest outside ambient and it completes the arc the
 * first era started at 0.66. The pad list is long and its weights are real, but
 * a pad in this era is a *tail* on something else rather than a bed under a
 * band — see `dnb/index.ts`, where `mix.pad` sits where it does for exactly this
 * reason.
 *
 * `styleWeights` puts `revival` at 8, which is the era's own joke about itself:
 * the year everything stopped being sampled is also the year a generation who
 * grew up on the sampled records started making them again.
 */
const design: EraProfile = {
  id: 'design',
  year: 2012,
  label: '2012 design',
  description:
    'Nothing recorded by anybody: a sine for a kick, noise through a gate for a snare, and a bass patch that has learned to talk.',
  drumBanks: [
    ['MPC1000', 5],
    ['RolandTR909', 4],
    ['YamahaRM50', 3],
    ['RolandMC303', 3],
    ['KorgM1', 2],
  ],
  drumSources: [['programmed', 9], ['electronic-kit', 1]],
  sequenced: { bass: 0.85, counter: 0.45 },
  palette: {
    melody: [
      ['leadSaw', 5], ['leadSquare', 4], ['musicBox', 3], ['celesta', 3],
      ['padHalo', 3], ['glockenspiel', 2], ['synthChoir', 2], ['kalimba', 2],
    ],
    counter: [
      ['celesta', 4], ['musicBox', 3], ['glockenspiel', 3], ['guitarHarmonics', 3],
      ['harp', 2], ['electricVibes', 2], ['leadSquare', 2],
    ],
    comp: [
      ['padPoly', 4], ['nylonGuitar', 4], ['celesta', 3], ['epiano2', 3],
      ['harp', 3], ['crushedPad', 2],
    ],
    pad: [
      ['padHalo', 4], ['padWarm', 4], ['padSweep', 3], ['synthChoir', 3],
      ['padNewAge', 2], ['crushedPad', 2],
    ],
    bass: [['synthBass', 9], ['synthBass2', 7], ['fretlessBass', 1]],
    brass: [['synthBrass2', 5], ['synthBrass', 3], ['orchestraHit', 3], ['brassSection', 1]],
  },
  styleWeights: {
    bleep: 0, hardcore: 0, darkcore: 1, jungle: 3, ragga: 2, hardstep: 2,
    jazzstep: 2, atmospheric: 3, intelligent: 2, drumfunk: 4, techstep: 4,
    neurofunk: 7, liquid: 7, rollers: 6, jumpup: 6, dancefloor: 7, sambass: 2,
    breakcore: 3, dubwise: 3, deep: 7, autonomic: 8, halftime: 9, minimal: 8,
    revival: 8,
  },
  tempoScale: 1,
  keyChangeChance: 0.01,
  density: 0.42,
  /**
   * The widest and the emptiest. Reverb comes back up from 2002's figures — not
   * as a room but as a *tail*, which is what a single plucked bell in nine
   * seconds of silence needs in order to be an event — while the drums stay bone
   * dry, because a hat pattern with a tail on it is a wash and the pattern is
   * the point. The bass is at 520 Hz, the darkest number in the project.
   */
  effects: {
    comp: { reverb: 0.34, delay: 0.24, lowpass: 12000 },
    melody: { reverb: 0.42, delay: 0.28, lowpass: 13000 },
    counter: { reverb: 0.46, delay: 0.32, lowpass: 13000 },
    drums: { reverb: 0.07, lowpass: 14000 },
    bass: { reverb: 0.0, lowpass: 520 },
    pad: { reverb: 0.62, lowpass: 7500 },
  },
};

export const ERAS: Record<string, EraProfile> = { rave, dubplate, studio, design };
