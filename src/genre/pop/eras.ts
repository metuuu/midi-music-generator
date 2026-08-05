/**
 * Pop era profiles, 1963 to now — named after the desk rather than after the
 * decade.
 *
 * Every other genre here names its eras after a scene, a technology or a place:
 * `tanssilava`, `modular`, `roots`, `bebop`. This one names them
 * `twotrack`, `multitrack`, `gated`, `sidechain`, and the naming *is* the
 * genre's argument. `index.ts` claims that pop is the one repertoire where the
 * production is the composition, and the cheapest way to test that claim is to
 * ask what changes between 1965 and 1975 in a music whose forms, keys and
 * harmonic vocabulary barely move. The answer is not the songs. It is that the
 * band stopped being recorded in one room at one time.
 *
 * So the four eras are four **recording situations**, and each one produces a
 * different arrangement from the same song:
 *
 *  - **`twotrack`** — everybody plays at once and the balance is committed
 *    before anybody hears it. Density is low because there is nowhere to put a
 *    seventh part, and the reverb is a room rather than a send.
 *  - **`multitrack`** — twenty-four tracks, so every instrument can be heard
 *    separately, so the arranging changes: a bass playing a countermelody is
 *    only worth writing if somebody will be able to hear it.
 *  - **`gated`** — the drum machine and the noise gate. This is the era where
 *    the *treatment of one voice in the kit* becomes the thing people recognise
 *    the record by, which is what `DrumTrack.voiceEffects` exists for.
 *  - **`sidechain`** — a grid, a sub bass and a pad that ducks under every kick.
 *    Density is the highest here and the arrangement is the loudest thing about
 *    the record.
 *
 * **Every style is weighted in every era**, which is the sharpest structural
 * difference from `synth`, whose three eras have palettes that barely overlap
 * and style weights that move by a factor of three. Nothing in this genre could
 * not have been recorded in any of these four years, and several styles were: a
 * ballad is a ballad in 1963 and in 2016, and the era decides what it is played
 * on rather than whether it exists. The weights still move by a lot — `hinrg` is
 * at 0.5 in 1965 and 9 in 1985 — but nothing is ever zero, because a zero would
 * be a claim about the repertoire that is false.
 *
 * `keyChangeChance` is the field this genre uses most deliberately and
 * `index.ts` argues it at length: the final-chorus lift is one of the most
 * characteristic gestures in the whole repertoire, and it is *not* evenly spread
 * across the decades.
 */

import type { EraProfile } from '../../style/types.js';

/**
 * TWO-TRACK — 1963–68.
 *
 * The band plays the song and somebody balances it while they play. There are
 * three or four tracks and two of them are already spoken for, so the
 * arrangement has to be decided in the room: an overdub is a decision to erase
 * something. That is why the density is the lowest of the four and why the
 * `pad` palette is short — a string section here is a real string section that
 * had to be booked, and most records did not have one.
 *
 * **The reverb is a room and not a send**, which is why `space.reverbSize` is
 * high while the per-layer `reverb` numbers are modest. A chamber puts the whole
 * band in the same tail; a plate on one channel puts the singer in a different
 * building from the drummer, and that is a later decade's sound.
 *
 * No sequencer, by year: `SEQUENCER_FROM` is 1971 and the gate runs before this
 * table. No preset box either — `DRUM_SOURCE_FROM.box` is 1964, so one could
 * technically be drawn, and there is not a single pop record of these five years
 * with one on it. `drumSources` says `kit` alone rather than listing the box at
 * zero, because a zero looks like an opinion about a question somebody asked.
 */
const twotrack: EraProfile = {
  id: 'twotrack',
  year: 1965,
  label: '1963–68 two-track',
  description:
    'The band plays the song and somebody balances it while they play. Three tracks, one echo chamber, and an arrangement that had to be decided in the room.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['EmuSP12', 3],
    ['AlesisSR16', 3],
    ['SakataDPM48', 2],
  ],
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['piano', 4], ['cleanGuitar', 4], ['jazzGuitar', 3], ['percussiveOrgan', 3],
      ['harpsichord', 2], ['flute', 2], ['tenorSax', 2], ['vibraphone', 2],
      ['trumpet', 2], ['celesta', 1],
    ],
    counter: [
      ['cleanGuitar', 4], ['piano', 3], ['percussiveOrgan', 3], ['flute', 2],
      ['glockenspiel', 2], ['vibraphone', 2], ['jazzGuitar', 2], ['oboe', 1],
    ],
    comp: [
      ['piano', 5], ['cleanGuitar', 4], ['jazzGuitar', 3], ['percussiveOrgan', 3],
      ['harpsichord', 3], ['nylonGuitar', 2], ['drawbarOrgan', 2], ['epiano1', 1],
    ],
    pad: [
      ['strings1', 4], ['drawbarOrgan', 3], ['choirAahs', 2], ['tremoloStrings', 2],
      ['strings2', 2], ['reedOrgan', 1],
    ],
    bass: [['fingerBass', 5], ['pickBass', 4], ['acousticBass', 2]],
    brass: [
      ['brassSection', 4], ['trumpet', 3], ['tenorSax', 3], ['trombone', 2],
      ['frenchHorn', 2], ['altoSax', 2],
    ],
  },
  styleWeights: {
    girlgroup: 9, merseybeat: 9, brill: 8, bubblegum: 7, baroque: 7, sunshine: 7,
    softrock: 2, ballad: 5, torch: 4, discopop: 0.5, powerpop: 1, chamber: 3,
    synthpop: 0.5, newromantic: 0.5, stadium: 0.5, jangle: 2, hinrg: 0.5, dreampop: 0.5,
    europop: 0.5, teen: 0.5, dancepop: 0.5, electropop: 0.5, indiepop: 1, tropical: 0.5,
  },
  tempoScale: 1,
  /**
   * 0.34, and the highest of the four — which is the opposite of what a reader
   * expects, because the truck-driver's gear change is remembered as an
   * eighties cliché.
   *
   * It is here because this is the era where the lift is *announced*. The genre
   * sets `preparedModulation: true` (see `index.ts`) and the pivot is a real
   * applied dominant in the bar before the change, which is a Brill Building
   * device: the writers were trained, and a modulation without preparation would
   * have read to them as a mistake. Six of this era's top styles take the
   * `functional` chord-scale rule and every one of them can carry the pivot.
   */
  keyChangeChance: 0.34,
  density: 0.6,
  /**
   * Close, warm and short at the top. The 8 kHz ceiling is the tape and the
   * console rather than the instruments — nothing on a 1965 pop single reaches
   * further than that, and the vocal is deliberately the brightest thing here
   * because it was compressed hard and rode over everything.
   */
  effects: {
    drums: { reverb: 0.26, lowpass: 6000 },
    bass: { reverb: 0.04, lowpass: 1300 },
    comp: { reverb: 0.3, lowpass: 7500 },
    melody: { reverb: 0.34, lowpass: 8000 },
    counter: { reverb: 0.34, lowpass: 7500 },
    brass: { reverb: 0.3, lowpass: 7000 },
    pad: { reverb: 0.4, lowpass: 5000 },
    vocal: { reverb: 0.38, lowpass: 8500 },
  },
  /** A chamber, not a plate: the whole band shares one tail. */
  space: { reverbSize: 0.55, delayBeats: 0.5, delayFeedback: 0.18 },
};

/**
 * MULTITRACK — 1971–79.
 *
 * Twenty-four tracks, a click when anybody wants one, and a rhythm section who
 * are session players rather than a band. What that buys is *separation*, and
 * separation changes the writing rather than only the mixing: a bass part that
 * moves against the tune is only worth writing if it can be heard on its own,
 * and a Wurlitzer holding a seventh under a guitar is a chord only if the two
 * are not fighting for the same fader.
 *
 * The palettes are the widest of the four for that reason. This is the decade
 * when a pop record could have a clavinet, a string section, a saxophone and a
 * pedal steel on it and still sound tidy, because each of them was on its own
 * track.
 *
 * `sequenced` is present but small. The technology existed from 1971 and pop
 * used it late — a sequenced bass on a 1975 pop record is a Giorgio Moroder
 * record, which is one producer rather than a decade.
 */
const multitrack: EraProfile = {
  id: 'multitrack',
  year: 1975,
  label: '1971–79 multitrack',
  description:
    'Twenty-four tracks and a rhythm section who were hired. Everything can be heard separately, so the arrangement gets written rather than balanced.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['RolandR8', 3],
    ['EmuSP12', 3],
    ['AlesisSR16', 2],
    ['YamahaRY30', 2],
  ],
  drumSources: [['kit', 8], ['box', 1]],
  sequenced: { bass: 0.08, counter: 0.1 },
  palette: {
    melody: [
      ['epiano1', 4], ['piano', 4], ['cleanGuitar', 3], ['tenorSax', 3],
      ['leadSaw', 2], ['flute', 2], ['harmonica', 2], ['vibraphone', 2],
      ['overdriveGuitar', 2], ['drawbarOrgan', 2], ['steelGuitar', 1],
    ],
    counter: [
      ['cleanGuitar', 4], ['epiano1', 3], ['piano', 3], ['flute', 2],
      ['tenorSax', 2], ['glockenspiel', 2], ['leadSquare', 2], ['oboe', 2],
      ['marimba', 1],
    ],
    comp: [
      ['epiano1', 5], ['piano', 4], ['cleanGuitar', 4], ['epiano2', 3],
      ['clavinet', 3], ['nylonGuitar', 2], ['drawbarOrgan', 2], ['harp', 1],
      ['mutedGuitar', 2],
    ],
    pad: [
      ['strings1', 5], ['strings2', 3], ['synthStrings', 3], ['padWarm', 2],
      ['choirAahs', 2], ['tremoloStrings', 2], ['padChoir', 1],
    ],
    bass: [['fingerBass', 5], ['pickBass', 3], ['fretlessBass', 2], ['synthBass', 2], ['acousticBass', 1]],
    brass: [
      ['brassSection', 4], ['tenorSax', 3], ['trumpet', 3], ['trombone', 2],
      ['synthBrass', 2], ['altoSax', 2], ['frenchHorn', 1],
    ],
  },
  styleWeights: {
    girlgroup: 2, merseybeat: 2, brill: 3, bubblegum: 3, baroque: 3, sunshine: 4,
    softrock: 9, ballad: 8, torch: 6, discopop: 8, powerpop: 7, chamber: 6,
    synthpop: 1, newromantic: 1, stadium: 1, jangle: 2, hinrg: 2, dreampop: 1,
    europop: 0.5, teen: 0.5, dancepop: 0.5, electropop: 0.5, indiepop: 1, tropical: 0.5,
  },
  tempoScale: 0.98,
  /**
   * 0.2. The lift is still normal and it is quieter about itself: the
   * singer-songwriter half of this decade wrote songs that end where they
   * started, and a gear change on a soft-rock record would sound like a
   * television theme.
   */
  keyChangeChance: 0.2,
  density: 0.72,
  effects: {
    drums: { reverb: 0.22, lowpass: 9000 },
    bass: { reverb: 0.03, lowpass: 1600 },
    comp: { reverb: 0.26, lowpass: 10000 },
    melody: { reverb: 0.3, lowpass: 11000 },
    counter: { reverb: 0.3, lowpass: 10000 },
    brass: { reverb: 0.26, lowpass: 9000 },
    pad: { reverb: 0.42, lowpass: 7000 },
    vocal: { reverb: 0.3, lowpass: 10000 },
  },
  space: { reverbSize: 0.5, delayBeats: 0.375, delayFeedback: 0.24 },
};

/**
 * GATED — 1980–89.
 *
 * The drum machine and the noise gate, and the era this genre most obviously
 * shares equipment with `synth`. The line between them is not the hardware, and
 * `index.ts` says so: `synth/digital` is the same decade with the *song* taken
 * out, and what is here instead is a verse, a chorus, a bridge and a key change.
 *
 * **The gate is the era.** A snare fed through a long ambient reverb with a
 * noise gate across the return arrives with an enormous room and then the room
 * stops, and that one treatment on one voice is what makes a record identifiable
 * as 1984 from a single bar. It belongs to `stadium`'s own `effects` and to
 * `DrumTrack.voiceEffects` rather than to this table, because applying it to the
 * whole kit puts a two-second tail on the hi-hats.
 *
 * The banks are the Linn family and the Simmons kit, which between them are what
 * was actually on the radio: `BANK_VOICES` says all four Linns carry a
 * tambourine and that the SDS-5 has no cymbals at all, which is correct — an
 * SDS-V stage still had bronze on it and the pads did not.
 */
const gated: EraProfile = {
  id: 'gated',
  year: 1985,
  label: '1980–89 gated',
  description:
    'A LinnDrum, a DX7, and a snare through a gate across an enormous reverb. The one treatment on the one voice that dates a record from a single bar.',
  drumBanks: [
    ['LinnDrum', 5],
    ['LinnLM2', 4],
    ['OberheimDMX', 3],
    ['SimmonsSDS5', 3],
    ['RolandTR707', 2],
    ['YamahaRX5', 2],
    ['EmuSP12', 2],
  ],
  drumSources: [['programmed', 5], ['electronic-kit', 3], ['kit', 3], ['box', 1]],
  sequenced: { bass: 0.4, counter: 0.35 },
  palette: {
    melody: [
      ['leadSaw', 4], ['leadSquare', 3], ['synthBrass2', 3], ['epiano2', 3],
      ['leadCharang', 2], ['cleanGuitar', 3], ['tenorSax', 2], ['leadCalliope', 2],
      ['overdriveGuitar', 2], ['synthChoir', 1],
    ],
    counter: [
      ['leadSquare', 3], ['cleanGuitar', 3], ['epiano2', 3], ['glockenspiel', 2],
      ['leadSaw', 2], ['marimba', 2], ['synthBrass', 2], ['celesta', 1],
      ['tubularBells', 1],
    ],
    comp: [
      ['epiano2', 4], ['synthStrings2', 4], ['cleanGuitar', 4], ['padPoly', 3],
      ['piano', 3], ['leadSquare', 2], ['mutedGuitar', 2], ['clavinet', 1],
      ['drawbarOrgan', 1],
    ],
    pad: [
      ['synthStrings2', 5], ['padWarm', 4], ['padPoly', 3], ['synthChoir', 3],
      ['padHalo', 2], ['strings1', 2], ['padNewAge', 2],
    ],
    bass: [['synthBass', 5], ['synthBass2', 4], ['fingerBass', 3], ['fretlessBass', 2], ['pickBass', 2]],
    brass: [
      ['synthBrass2', 5], ['synthBrass', 4], ['brassSection', 3], ['tenorSax', 3],
      ['trumpet', 2], ['orchestraHit', 1],
    ],
  },
  styleWeights: {
    girlgroup: 0.5, merseybeat: 0.5, brill: 1, bubblegum: 1, baroque: 1, sunshine: 1,
    softrock: 3, ballad: 7, torch: 3, discopop: 3, powerpop: 3, chamber: 2,
    synthpop: 9, newromantic: 8, stadium: 9, jangle: 7, hinrg: 8, dreampop: 5,
    europop: 2, teen: 1, dancepop: 1, electropop: 1, indiepop: 2, tropical: 0.5,
  },
  tempoScale: 1,
  /**
   * 0.3, and the second-highest — but the pivot is where this era differs from
   * `twotrack` rather than the rate. Only two of the six styles that peak here
   * take `functional`, so most of these lifts arrive in a modal minor key where
   * the applied dominant is a chromatic chord rather than a functional one. That
   * is what the eighties gear change actually sounded like: a bar of something
   * that did not belong to either key, and then the chorus a semitone up.
   */
  keyChangeChance: 0.3,
  density: 0.76,
  effects: {
    drums: { reverb: 0.4, lowpass: 12000 },
    bass: { reverb: 0.02, lowpass: 1800 },
    comp: { reverb: 0.34, lowpass: 12000 },
    melody: { reverb: 0.38, delay: 0.375, lowpass: 13000 },
    counter: { reverb: 0.4, delay: 0.375, lowpass: 12000 },
    brass: { reverb: 0.32, lowpass: 11000 },
    pad: { reverb: 0.55, lowpass: 9000 },
    vocal: { reverb: 0.42, delay: 0.375, lowpass: 12000 },
  },
  /**
   * The big plate, and a dotted-eighth delay. Three sixteenths against a
   * four-beat bar never lands where the beat does, which is the convention
   * ambient and synth both state and which this decade took from them and put on
   * the guitar.
   */
  space: { reverbSize: 0.8, delayBeats: 0.75, delayFeedback: 0.32 },
};

/**
 * SIDECHAIN — 1993 to now.
 *
 * A grid, a sub bass, and everything ducking under the kick. The era is named
 * after the one production technique that became a compositional one: a
 * compressor keyed off the kick drum pulls the whole track down on every beat
 * and lets it back up across it, so the *pulse* of a modern pop record is
 * carried by a pad breathing rather than by anything struck.
 *
 * **This engine cannot render that**, and `index.ts` lists it under what could
 * not be expressed. `Effects` has filtering, reverb, delay and drive and no
 * envelope follower, and there is no way to say that one layer's gain is a
 * function of another layer's onsets. What is here instead is the rest of the
 * situation — the highest density in the genre, a `pad` palette built on
 * sustained saws, a bass palette that is three kinds of sub, and drum banks that
 * are the 909, the 808 and a sampler.
 *
 * `keyChangeChance: 0.08` is the lowest by a distance and it is a real
 * observation rather than a shrug. The final-chorus lift very nearly died: a
 * modern pop record is built on a four-bar loop that is the same in the verse
 * and the chorus, and transposing the last chorus up a semitone would break the
 * one thing the arrangement is made of. It is not zero, because the ballad
 * survived and so did the gesture inside it.
 */
const sidechain: EraProfile = {
  id: 'sidechain',
  year: 2010,
  label: '1993–now sidechain',
  description:
    'A grid, a sub bass and a pad that ducks under every kick. The loop is the same in the verse and the chorus, and what changes is how much is on it.',
  drumBanks: [
    ['RolandTR909', 4],
    ['RolandTR808', 4],
    ['MPC1000', 3],
    ['AlesisSR16', 2],
    ['KorgM1', 2],
    ['RolandMC303', 2],
  ],
  drumSources: [['programmed', 8], ['electronic-kit', 2], ['kit', 2]],
  sequenced: { bass: 0.5, counter: 0.45 },
  palette: {
    melody: [
      ['leadSaw', 4], ['leadSquare', 3], ['marimba', 3], ['leadCharang', 2],
      ['synthBrass2', 2], ['cleanGuitar', 2], ['piano', 2], ['steelDrums', 2],
      ['leadCalliope', 2], ['synthChoir', 2],
    ],
    counter: [
      ['marimba', 3], ['leadSquare', 3], ['glockenspiel', 3], ['leadSaw', 2],
      ['kalimba', 2], ['cleanGuitar', 2], ['celesta', 2], ['steelDrums', 2],
      ['musicBox', 1],
    ],
    comp: [
      ['padPoly', 4], ['piano', 4], ['leadSaw', 3], ['cleanGuitar', 3],
      ['epiano2', 3], ['synthStrings2', 3], ['marimba', 2], ['nylonGuitar', 2],
    ],
    pad: [
      ['padPoly', 5], ['padSweep', 4], ['synthStrings2', 4], ['padWarm', 3],
      ['synthChoir', 3], ['padHalo', 2], ['strings1', 2],
    ],
    bass: [['synthBass2', 5], ['synthBass', 4], ['fingerBass', 2], ['pickBass', 2], ['slapBass', 1]],
    brass: [
      ['synthBrass2', 4], ['brassSection', 3], ['synthBrass', 3], ['trumpet', 2],
      ['tenorSax', 2], ['orchestraHit', 1],
    ],
  },
  styleWeights: {
    girlgroup: 0.5, merseybeat: 0.5, brill: 0.5, bubblegum: 1, baroque: 1, sunshine: 1,
    softrock: 2, ballad: 6, torch: 2, discopop: 2, powerpop: 2, chamber: 4,
    synthpop: 3, newromantic: 1, stadium: 2, jangle: 3, hinrg: 2, dreampop: 5,
    europop: 8, teen: 8, dancepop: 9, electropop: 8, indiepop: 7, tropical: 8,
  },
  tempoScale: 1,
  keyChangeChance: 0.08,
  /**
   * The highest density in the genre, and it is not the same statement funk's
   * 0.78 makes. There the number is nine people playing at once; here it is one
   * person with a laptop stacking eleven parts, and the arrangement's whole
   * dynamic is how many of them are switched on. That is the axis
   * `Chart.exits` was added for, and this era is where it bites hardest.
   */
  density: 0.82,
  effects: {
    drums: { reverb: 0.24, lowpass: 16000 },
    bass: { reverb: 0.01, lowpass: 2000 },
    comp: { reverb: 0.28, lowpass: 15000 },
    melody: { reverb: 0.3, delay: 0.375, lowpass: 16000 },
    counter: { reverb: 0.34, delay: 0.375, lowpass: 15000 },
    brass: { reverb: 0.24, lowpass: 13000 },
    pad: { reverb: 0.5, lowpass: 12000 },
    vocal: { reverb: 0.3, delay: 0.375, lowpass: 15000 },
  },
  space: { reverbSize: 0.6, delayBeats: 0.375, delayFeedback: 0.28 },
};

export const ERAS: Record<string, EraProfile> = {
  twotrack, multitrack, gated, sidechain,
};
