/**
 * R&B era profiles, 1965–1998.
 *
 * Four eras, and the axis they move along is **what is holding the backbeat and
 * what is sweetening it**. Funk's four decades argue about who is keeping time
 * and the answer walks steadily from a drummer to a machine; this genre asks the
 * same question and gets a *loop* rather than a line, because the last era here
 * spends real money hiring a programmer to make a machine sound like the man in
 * the first one.
 *
 * The second half of the axis is the one nothing else in the project has. Every
 * era below has something on top of the rhythm section whose entire job is to
 * make the record *sweet* — a tambourine and four horns in 1965, eighteen violins
 * in 1974, a DX7 and a stack of backing vocals in 1989, a Rhodes and a flugelhorn
 * in 1998 — and which of those it is dates a record faster than the drums do.
 *
 * ## On the banks, and on why every one of them carries a rack
 *
 * `tb` is the single most important voice in this genre and the pack's own
 * tambourines are the weak part of it: a machine's tambourine is one short metal
 * tick, which is right for a sixteenth-note shimmer under a funk chorus and wrong
 * for the thing that *is* the backbeat on a Motown side. `SAMPLE_RACKS` fixes it,
 * and this is the reason the rack mechanism should be reached for rather than
 * merely tolerated — a rack claims the auxiliary voices from the machine riding
 * under it, so `+congas` on a 1965 bank replaces the box's tick with a recorded
 * tambourine while leaving the kick and the snare exactly where they were.
 *
 * So nineteen of the twenty-two bank entries below carry `+congas`. The three
 * that do not are in `newjack`, where the point is that nothing on the record was
 * recorded in a room.
 *
 * **It cost this genre its preset boxes and that was the right trade.**
 * `npm run genres` asserts that an era offering `box` at any weight names no
 * sampled rack — the source and the bank are drawn independently, so a box will
 * eventually turn up under every bank an era lists, and there is no way to write
 * *rack, except then*. Five eras in four other genres settled that by dropping
 * the rack. Both eras here that had a unit of box weight dropped the box instead,
 * and the notes on them say why.
 *
 * The usual caveat applies to the first two eras and stops applying at the third:
 * the pack is a set of drum *machines*, so a 1965 studio kit has to be
 * approximated by the sampled-acoustic boxes — `AkaiMPC60`, `RolandR8`,
 * `AlesisSR16`, `YamahaRY30` — and that is a caveat on the audition rather than
 * on the MIDI, which writes General MIDI channel 10 and gets a real kit from any
 * soundfont. From 1989 onward every bank named here is the machine the records
 * were actually made on.
 *
 * ## On `keyChangeChance`, which is high and is *supposed* to be
 *
 * This is the one genre in the project where the last-chorus lift is not an
 * embarrassment. Funk's file argues at length that a modulation would announce
 * that somebody had written an arrangement, and in that music it would; here
 * somebody *had* written an arrangement, they were paid for it, their name is on
 * the label, and taking the last chorus up a tone under a singer already at the
 * top of their range is the most reliable gesture in the whole repertoire. It
 * falls across the four eras from 0.15 to 0.05 as the record stops being a song
 * with an arranger and starts being a groove with a singer over it.
 */

import type { EraProfile } from '../../style/types.js';

/**
 * SOUL — 1965.
 *
 * Detroit and Memphis in one era, which is a compression and is defensible: the
 * two houses disagreed about almost everything — an assembly line against a bar
 * band, strings against no strings, a written bass part against one invented on
 * the date — and they agreed about the object making the noise. A drummer, an
 * electric bass, a guitar, a piano or an organ, a horn section, and somebody
 * standing beside the kit hitting a tambourine on two and four. Where the two
 * houses part company is in `styles.ts`, which is the right place for it: they
 * are different *bands*, not different decades.
 *
 * `drumSources: [['kit', 1]]` and nothing else, matching the one other era in the
 * project that states it that flatly. There is no version of this year with a box
 * on it.
 *
 * The palette's oddity is `glockenspiel` in the counter list and `celesta` in the
 * comp list, both at low weight. A bell doubling the top of a chorus is a Motown
 * arranger's fingerprint and it is *inaudible as an instrument* — nobody hears a
 * glockenspiel on those records, they hear the chorus being brighter than the
 * verse — which is exactly the standing a low weight gives it.
 *
 * `density: 0.72` is high for a first era. There are a lot of people on these
 * records and, unlike a funk band, they all play at once.
 */
const soul: EraProfile = {
  id: 'soul',
  year: 1965,
  label: '1965 soul',
  description:
    'A rhythm section, four horns and somebody on a tambourine: Detroit’s assembly line and Memphis’s bar band, a year apart and a world apart.',
  drumBanks: [
    ['RolandR8+congas', 4],
    ['AkaiMPC60+congas', 4],
    ['AlesisSR16+congas', 3],
    ['YamahaRY30+congas', 2],
  ],
  /**
   * A drummer, and there is no second answer. The tambourine beside him is a
   * second pair of hands rather than a second source — see `styles.ts`, where it
   * is written into the kit tables on `tb` because on these records it is part of
   * the drum part rather than a percussion overdub.
   */
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['tenorSax', 5], ['trumpet', 4], ['altoSax', 3], ['drawbarOrgan', 3],
      ['vibraphone', 3], ['cleanGuitar', 3], ['flute', 2], ['trombone', 2],
      ['baritoneSax', 1],
    ],
    counter: [
      ['trumpet', 4], ['tenorSax', 3], ['cleanGuitar', 3], ['vibraphone', 3],
      ['drawbarOrgan', 3], ['trombone', 2], ['mutedTrumpet', 2],
      ['glockenspiel', 1], ['flute', 1],
    ],
    // The piano leads the comp list here and nowhere else in this genre. A
    // Detroit date had two of them and a Memphis one had a Wurlitzer; both are a
    // struck instrument playing eighths, and the electric pianos that take this
    // slot from 1974 onward are a different job entirely.
    comp: [
      ['piano', 6], ['drawbarOrgan', 5], ['cleanGuitar', 4], ['epiano1', 3],
      ['jazzGuitar', 2], ['nylonGuitar', 2], ['celesta', 1],
    ],
    pad: [
      ['strings1', 4], ['drawbarOrgan', 4], ['brassSection', 3],
      ['choirAahs', 2], ['strings2', 2],
    ],
    // Flatwounds on a Precision, played with one finger. The upright is here at a
    // token weight for the 1962 end of the era and for nothing else.
    bass: [['fingerBass', 8], ['pickBass', 3], ['acousticBass', 1]],
    brass: [
      ['brassSection', 5], ['tenorSax', 4], ['trumpet', 4], ['trombone', 3],
      ['baritoneSax', 3], ['mutedTrumpet', 1],
    ],
  },
  styleWeights: {
    motown: 9, stax: 8, doowop: 6, girlgroup: 7, southern: 7, deepsoul: 7,
    gospelsoul: 6, blueeyed: 5, stomper: 7, funksoul: 4,
    philly: 1, chicago: 3, discosoul: 0, crossover: 1, ballad: 5, quietstorm: 0,
    synthsoul: 0, newjack: 0, slowjam: 0, hiphopsoul: 0,
    neosoul: 0, offgrid: 0, bedroom: 0, contemporary: 0,
  },
  tempoScale: 1,
  // The highest in the genre and the highest in the project. See the header: in
  // 1965 there is an arranger, they are being paid, and the last chorus goes up.
  keyChangeChance: 0.15,
  density: 0.72,
};

/**
 * PHILLY — 1974.
 *
 * The rhythm section stays where it was and everything above it doubles. Sigma
 * Sound, Curtis Mayfield's band in Chicago, Barry White's forty-piece: a hi-hat
 * playing sixteenths, a Rhodes, a guitar with the tone rolled back, and then
 * eighteen violins, a harp, a vibraphone and a flute over the top of it. This is
 * the fullest era in the genre and `density: 0.82` is the highest number in the
 * project, which is correct rather than greedy — a Philadelphia arrangement is a
 * record with *everybody on it*, and the restraint is in the writing rather than
 * in the seating plan.
 *
 * `harp` at weight 2 in the counter list is the one instrument here that no other
 * genre in this project reaches for outside a concert hall, and it is not
 * decoration. The upward glissando under the top of a chorus is a Philadelphia
 * signature, it was played by a session harpist on scale, and it is the clearest
 * single thing separating this era from the one above it.
 *
 * `drumSources: [['kit', 1]]`, which is the second era in this project to state it
 * that flatly and the only one that does so as a *trade* rather than as a fact
 * about the year. 1974 genuinely has a Rhythm Ace on some of these dates; the note
 * on the field below has the argument for why it is not here anyway.
 *
 * The disco hinge lives here rather than in an era of its own. Four-on-the-floor
 * with an open hat on the off-eighth is one *style* in this table, `discosoul`,
 * and giving it a decade would have been a claim that 1977 is a different music
 * with different people on it, which for the R&B end of it is simply untrue: the
 * same rhythm section made both records, sometimes in the same week.
 */
const philly: EraProfile = {
  id: 'philly',
  year: 1974,
  label: '1974 sweet soul',
  description:
    'Sigma Sound and Curtis Mayfield: hi-hat sixteenths, a Rhodes, a guitar through a Bad Stone, and eighteen violins over the top of it.',
  drumBanks: [
    ['RolandR8+congas', 4],
    ['AkaiXR10+congas', 3],
    ['YamahaRY30+congas', 3],
    ['AlesisSR16+congas', 3],
    ['RolandCompurhythm78+congas', 1],
  ],
  /**
   * A drummer, and the preset box that 1974 genuinely had is the thing that gives
   * way.
   *
   * `npm run genres` asserts that no era offering `box` at any weight also lists a
   * sampled rack, and the reasoning is in the check: the bank and the source are
   * drawn from two independent weightings, so an era that can roll a box will
   * sooner or later put one under every bank it names, and there is no way to say
   * *rack, except when the box comes up*. Five eras across four genres resolved
   * that by dropping the rack. This one resolves it the other way, because the
   * rack is not a garnish here — it is where the tambourine comes from, and a
   * tambourine on the backbeat is what this genre is. A Rhythm Ace on one Sigma
   * date in ten is a smaller loss than a machine tick where the metal should be.
   */
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['tenorSax', 4], ['flute', 4], ['epiano1', 3], ['trumpet', 3],
      ['cleanGuitar', 3], ['vibraphone', 3], ['altoSax', 2], ['drawbarOrgan', 2],
      ['sopranoSax', 1],
    ],
    counter: [
      ['flute', 4], ['cleanGuitar', 3], ['vibraphone', 3], ['epiano1', 3],
      ['trumpet', 2], ['harp', 2], ['glockenspiel', 2], ['tenorSax', 2],
      ['celesta', 1],
    ],
    comp: [
      ['epiano1', 6], ['cleanGuitar', 5], ['piano', 4], ['clavinet', 3],
      ['drawbarOrgan', 3], ['nylonGuitar', 2], ['epiano2', 1],
    ],
    // Strings first, and by a distance. This is the only era in the project
    // where the pad layer is a section of people rather than a keyboard.
    pad: [
      ['strings1', 7], ['strings2', 5], ['synthStrings', 3], ['choirAahs', 2],
      ['brassSection', 2], ['drawbarOrgan', 2],
    ],
    bass: [
      ['fingerBass', 7], ['pickBass', 3], ['fretlessBass', 2], ['synthBass', 1],
      ['acousticBass', 1],
    ],
    brass: [
      ['brassSection', 5], ['tenorSax', 3], ['trumpet', 3], ['trombone', 3],
      ['frenchHorn', 1], ['baritoneSax', 2],
    ],
  },
  styleWeights: {
    motown: 3, stax: 3, doowop: 1, girlgroup: 1, southern: 3, deepsoul: 3,
    gospelsoul: 4, blueeyed: 3, stomper: 2, funksoul: 6,
    philly: 9, chicago: 8, discosoul: 8, crossover: 7, ballad: 7, quietstorm: 5,
    synthsoul: 1, newjack: 0, slowjam: 2, hiphopsoul: 0,
    neosoul: 1, offgrid: 0, bedroom: 0, contemporary: 1,
  },
  tempoScale: 1,
  keyChangeChance: 0.12,
  // The fullest arrangement in the project, and the one place a number that high
  // is a description rather than an ambition.
  density: 0.82,
};

/**
 * NEW JACK — 1989.
 *
 * The band leaves and the swing stays. That sentence is the whole era and it is
 * what separates this from `funk`'s `electro` next door, which arrives at the
 * same equipment five years earlier and takes the swing out with the drummer.
 * Teddy Riley's contribution was not the machine, it was **putting the shuffle
 * back into it** — a sixteenth grid with the second and fourth sixteenths pushed
 * late, entered by hand on an SP-1200, which is a drummer's feel typed into a
 * box by somebody who missed drummers.
 *
 * `drumSources: [['programmed', 7], ['kit', 2]]`. The kit at 2 is higher than the
 * equivalent number in funk's `electro` next door, and the absent third entry is
 * the argument: there is no preset box in this era at all, which is a stronger
 * claim than any weight and is made twice — see the field below and `boxDrums` on
 * the `newjack` style.
 *
 * The DX7 takes the comp slot the Rhodes held for fifteen years, and the two
 * electric pianos in the catalogue happen to line up with that exactly —
 * `epiano1` is the tine piano and `epiano2` is the FM one. It is the single
 * clearest palette change in the genre and it is one line.
 *
 * `orchestraHit` at weight 2, which is a joke everywhere else in this project and
 * is not one here. The stab was on the machine, it was on the records, and 1989
 * is the year it stopped being a Fairlight demo and became a hook.
 */
const newjack: EraProfile = {
  id: 'newjack',
  year: 1989,
  label: '1989 new jack swing',
  description:
    'The band leaves and the swing stays: an SP-1200 with the sixteenths pushed late, a DX7, a synth bass and four stacked backing vocals.',
  drumBanks: [
    ['EmuSP12', 5],
    ['LinnLM2+congas', 4],
    ['AkaiLinn+congas', 3],
    ['OberheimDMX+congas', 3],
    ['RolandTR909', 2],
    ['AkaiMPC60+congas', 2],
    ['RolandTR808', 2],
  ],
  /**
   * Programmed, or a drummer, and no preset box — for the reason `philly` states
   * above and one more that belongs to this era specifically. The whole
   * proposition of a new jack record is that a person entered every stroke of it
   * a step at a time; a machine playing what is already in its ROM is the one
   * object on the 1989 shelf that this music is *not*, and `newjack` in
   * `styles.ts` says so a second time with `boxDrums: false`.
   *
   * The kit at 2 is the slow half of the era. A ballad in 1989 frequently still
   * had a drummer on it, because a machine playing a slow jam sounds like a
   * machine playing a slow jam.
   */
  drumSources: [['programmed', 7], ['kit', 2]],
  /**
   * A third of the bass parts are typed rather than played, which is a lot lower
   * than the equipment would suggest and is deliberate. The bass on a new jack
   * record is usually a synthesiser played on a keyboard by somebody with a left
   * hand, and the difference between that and a step-entered line is audible in
   * exactly the place this era cares about — where the note sits against the
   * swung sixteenth.
   */
  sequenced: { bass: 0.35, counter: 0.15 },
  palette: {
    melody: [
      ['epiano2', 5], ['synthBrass', 4], ['leadSaw', 3], ['tenorSax', 3],
      ['leadSquare', 2], ['cleanGuitar', 2], ['trumpet', 2], ['vibraphone', 2],
    ],
    counter: [
      ['epiano2', 4], ['synthBrass', 3], ['leadSquare', 3], ['cleanGuitar', 3],
      ['orchestraHit', 2], ['vibraphone', 2], ['glockenspiel', 1],
    ],
    comp: [
      ['epiano2', 7], ['synthBrass', 4], ['cleanGuitar', 3], ['epiano1', 3],
      ['padPoly', 2], ['clavinet', 2], ['drawbarOrgan', 1],
    ],
    pad: [
      ['synthStrings2', 5], ['padPoly', 4], ['synthStrings', 3], ['padWarm', 3],
      ['synthChoir', 3], ['strings1', 2],
    ],
    bass: [
      ['synthBass', 6], ['synthBass2', 4], ['slapBass', 3], ['fingerBass', 3],
      ['slapBass2', 2], ['fretlessBass', 2],
    ],
    brass: [
      ['synthBrass', 5], ['synthBrass2', 4], ['brassSection', 3],
      ['orchestraHit', 2], ['tenorSax', 2], ['trumpet', 1],
    ],
  },
  styleWeights: {
    motown: 0, stax: 0, doowop: 0, girlgroup: 0, southern: 0, deepsoul: 1,
    gospelsoul: 3, blueeyed: 1, stomper: 0, funksoul: 2,
    philly: 1, chicago: 1, discosoul: 2, crossover: 3, ballad: 4, quietstorm: 7,
    synthsoul: 8, newjack: 9, slowjam: 9, hiphopsoul: 6,
    neosoul: 2, offgrid: 0, bedroom: 2, contemporary: 5,
  },
  tempoScale: 1,
  keyChangeChance: 0.1,
  // Lower than either era above it and much lower than the equipment implies.
  // Four stacked vocals and a synth pad read as a full record with six tracks on
  // it, which is what a machine bought you.
  density: 0.62,
};

/**
 * NEO — 1998.
 *
 * Somebody spends real money making a machine sound like the man in 1965. The
 * quantise comes off, the Rhodes comes back, the chords get an extra note each,
 * and the drums are programmed by a person who is trying to reproduce a break
 * they know by heart — which is a different intention from either playing or
 * programming and has no separate word for it.
 *
 * `drumSources: [['programmed', 6], ['kit', 4]]` is the flattest split in this
 * file and it is honest rather than a fence-sit: about that many of these records
 * are a loop and about that many are a drummer who was asked to sound like one,
 * and there is no listening test that reliably separates them.
 *
 * The palette is the *1974* palette with the strings pulled back and the bass
 * changed. `epiano1`, `clavinet`, `drawbarOrgan`, `fingerBass`, `nylonGuitar`,
 * `vibraphone`, `flute` — this era buys the same instruments the sweet-soul one
 * did, secondhand, and the difference is entirely in what is played on them.
 * `fretlessBass` at 3 is the one genuinely new thing in the list and it is the
 * one nobody expects: the sliding, unfretted bass note under a neo-soul verse is
 * this era's harp glissando.
 *
 * `keyChangeChance: 0.05` is the floor. This is the era where the arranger
 * finally leaves, and a record built on two bars of a `min11` has nowhere to
 * modulate *to*.
 */
const neo: EraProfile = {
  id: 'neo',
  year: 1998,
  label: '1998 neo-soul',
  description:
    'The quantise comes off and the Rhodes comes back: a loop that breathes, chords with an extra note each, and a bass playing behind the beat on purpose.',
  drumBanks: [
    ['AkaiMPC60+congas', 5],
    ['MPC1000+congas', 4],
    ['EmuSP12+congas', 3],
    ['RolandR8+congas', 3],
    ['AkaiLinn+congas', 2],
    ['AkaiXR10+congas', 2],
  ],
  drumSources: [['programmed', 6], ['kit', 4]],
  sequenced: { bass: 0.18, counter: 0.12 },
  palette: {
    melody: [
      ['epiano1', 5], ['tenorSax', 3], ['flute', 3], ['vibraphone', 3],
      ['mutedTrumpet', 3], ['cleanGuitar', 3], ['drawbarOrgan', 2],
      ['sopranoSax', 2], ['nylonGuitar', 2],
    ],
    counter: [
      ['epiano1', 4], ['cleanGuitar', 3], ['vibraphone', 3], ['flute', 3],
      ['clavinet', 2], ['mutedTrumpet', 2], ['harp', 1], ['kalimba', 1],
    ],
    comp: [
      ['epiano1', 7], ['drawbarOrgan', 4], ['clavinet', 3], ['cleanGuitar', 3],
      ['nylonGuitar', 3], ['piano', 3], ['epiano2', 2], ['jazzGuitar', 2],
    ],
    pad: [
      ['padWarm', 4], ['strings1', 4], ['drawbarOrgan', 3], ['synthStrings', 3],
      ['choirAahs', 2], ['padHalo', 2],
    ],
    bass: [
      ['fingerBass', 6], ['synthBass', 4], ['fretlessBass', 3],
      ['acousticBass', 2], ['pickBass', 2], ['synthBass2', 1],
    ],
    brass: [
      ['brassSection', 4], ['tenorSax', 3], ['mutedTrumpet', 3], ['trombone', 2],
      ['frenchHorn', 2], ['synthBrass', 1],
    ],
  },
  styleWeights: {
    motown: 1, stax: 2, doowop: 0, girlgroup: 0, southern: 2, deepsoul: 2,
    gospelsoul: 4, blueeyed: 1, stomper: 0, funksoul: 4,
    philly: 3, chicago: 4, discosoul: 1, crossover: 3, ballad: 4, quietstorm: 6,
    synthsoul: 2, newjack: 2, slowjam: 5, hiphopsoul: 7,
    neosoul: 9, offgrid: 8, bedroom: 7, contemporary: 6,
  },
  // Slower. Not a style-by-style decision — the whole era sits a few BPM under
  // the same music twenty years earlier, because the grid it is laid over is a
  // hip-hop grid and that is where a hip-hop grid lives.
  tempoScale: 0.95,
  keyChangeChance: 0.05,
  density: 0.6,
};

export const ERAS: Record<string, EraProfile> = { soul, philly, newjack, neo };
