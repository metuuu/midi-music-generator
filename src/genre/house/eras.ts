/**
 * House and techno eras, 1986 to 2007 — named after **the room**, not the desk
 * and not the decade.
 *
 * Pop names its four eras `twotrack`, `multitrack`, `gated`, `sidechain`, and
 * that naming is that genre's whole argument: what changes across sixty years of
 * a music whose forms and harmony barely move is the recording situation. This
 * genre borrows the *shape* of that argument and points it the other way, which
 * is the cleanest single statement of where the line between the two falls.
 *
 * **A house record is not made for a desk. It is made for a room, by somebody
 * who will never be in it.** The producer is not the performer; the record is
 * raw material handed to a third party who will play it against another record,
 * in a building, at a volume, at four in the morning. So what changes between
 * 1988 and 2006 is not the console — it is *where the record is going to be
 * played and how many people will be in there*, and every field below follows
 * from that:
 *
 *  - **`warehouse`** (1988) — a room in a building that used to be something
 *    else, with a rented rig and no licence. Four hundred people, one speaker
 *    stack, and a record pressed in a run of five hundred.
 *  - **`rave`** (1993) — a hangar or a field. Ten thousand people who cannot see
 *    each other, which is why the sounds get bigger, brighter and more shrill:
 *    at that distance a Rhodes chord is inaudible and a hoover is not.
 *  - **`superclub`** (1999) — a licensed venue with a name on the door and the
 *    DJ's name above it. The room is engineered, the sound system is installed
 *    rather than hired, and the record is aimed at a *peak time* that somebody
 *    is being paid to programme.
 *  - **`afterhours`** (2006) — a small dark room at six in the morning with
 *    ninety people left in it. The density is the lowest of the four and it is a
 *    fact about the room rather than about the equipment: everything the record
 *    needs to do, it has to do to people who have been there for eight hours.
 *
 * ## What that buys, tested against the fields
 *
 * `density` is the field that carries it and it runs 0.5 → 0.62 → 0.68 → 0.45,
 * which is a shape no technology story would produce. A laptop in 2006 could put
 * forty tracks on a record and the era asks for fewer parts than 1988 did,
 * because the room got smaller. Nothing about the *desk* went backwards.
 *
 * `keyChangeChance` is **0 in all four**, and it is the sharpest single number in
 * this genre. Two of its neighbours put the final-chorus lift near the centre of
 * their identity — pop calls it "one of the most characteristic gestures in the
 * whole repertoire" and synth calls it "a signature move" — and here it is not
 * merely absent, it is *forbidden by the delivery format*. A record that changes
 * key in its last ninety seconds cannot be mixed out of, because the record
 * coming in was beat-matched and pitch-matched to the one that was playing.
 * Ambient is the only other genre with a zero in every era, and it gets there
 * from the opposite direction: it has no cadence to lift. This has cadences and
 * declines to use them, because somebody else owns the ending.
 *
 * `drumSources` never says `kit` in any era, which no other genre in the project
 * does. There is no drummer in this music at any point in its twenty years —
 * `programmed` throughout, with `electronic-kit` appearing from 1993 for the live
 * techno PA, which is a real object (a person behind pads, playing the record's
 * own parts on a stage) and is the only way anybody in this genre has ever been
 * seen hitting something.
 *
 * `sequenced` is the highest in the project at 0.85–0.92 on the bass. In synth's
 * peak era it is 0.5, and the difference is the whole difference between the two
 * genres: there, sequencing the bass is a choice a keyboard player made; here it
 * is what a bass line *is*.
 *
 * ## No era weight is ever zero, and the reason is the record box
 *
 * Every style is weighted in every era, which follows pop rather than synth — and
 * for a reason particular to this music rather than by imitation. A DJ set is a
 * *rack of records from twenty years*, played one after another into the same
 * room: a 1987 Chicago jack track goes on after a 2005 minimal track and the
 * floor does not know or care which decade it is standing in. Every style in this
 * genre is still in circulation in every era, because circulation is what the
 * format is for. The weights still move by more than an order of magnitude —
 * `minimal` runs 0.3 to 9 — but the floor is 0.3 rather than 0, because a zero
 * would be claiming that a record stopped existing.
 */

import type { EraProfile } from '../../style/types.js';

/**
 * WAREHOUSE — 1986–90.
 *
 * A drum machine in a room. Chicago, the first Detroit records, the first
 * London warehouses, and the 303 that nobody could sell.
 *
 * The palette is deliberately short and cheap, and that is the period fact
 * rather than an aesthetic. The instruments on these records are the ones a
 * twenty-year-old could get on hire purchase in 1987: a TR-909 or a second-hand
 * 808, a TB-303 that had been in a shop window since 1982, a Juno-106, a DX100,
 * and — if the record had any money behind it — a Rhodes or a borrowed
 * Ensoniq. There is no sampler worth the name until the very end of it, which is
 * why the `pad` table is synth strings rather than anything sampled and why the
 * `brass` table has an orchestra hit in it exactly once the Fairlight's most
 * famous preset had leaked down to everybody's rack.
 *
 * **The banks are the argument.** `RolandTR909` and `RolandTR808` at the top,
 * with `RolandTR707` and `RolandTR606` under them, is not four drum machines
 * chosen for variety — it is the four boxes this music was physically made on,
 * and three of them were cheap in 1987 *because nobody wanted them*. Read from
 * the sample pack rather than assumed: **`RolandTR909` has no `perc`, `cb` or
 * `sh`**, and **`RolandTR808` has no ride** — both facts `synth/eras.ts` already
 * recorded, and both of them bite here rather than there, because the patterns in
 * `styles.ts` are written on those two machines by name.
 */
const warehouse: EraProfile = {
  id: 'warehouse',
  year: 1988,
  label: '1986–90 warehouse',
  description:
    'A drum machine in a room that used to be a factory. A 909, a 303 nobody wanted, a Juno, and five hundred copies pressed.',
  drumBanks: [
    ['RolandTR909', 6],
    ['RolandTR808', 5],
    ['RolandTR707', 4],
    ['RolandTR606', 2],
    ['KorgDDM110', 2],
    ['EmuSP12', 2],
  ],
  /**
   * No drummer, in any era, and this is where that starts.
   *
   * `programmed` is a machine written into a step at a time, which is exactly
   * what a 909 is and exactly what this music is. `box` survives at 1 because
   * the cheapest end of 1987 really was somebody pressing *Rock 1* on a
   * pawn-shop rhythm unit and playing a bass line over it — and because
   * `Style.boxDrums` is available to any style that cannot survive it, which
   * several here use.
   *
   * `kit` is absent rather than weighted low, and the difference matters: a low
   * weight would say *rarely a drummer*, and the truth is *never a drummer*. See
   * `staging.ts`, where the same fact has to be said about a stage.
   */
  drumSources: [['programmed', 9], ['box', 1]],
  /**
   * The highest in the project, and it is not close. Synth's peak era says 0.5
   * on the bass; this says 0.9, because in this music a bass line is not a part
   * a player was asked to sequence, it is a row of sixteen knobs.
   */
  sequenced: { bass: 0.9, counter: 0.75 },
  palette: {
    melody: [
      ['leadSquare', 4], ['percussiveOrgan', 4], ['leadSaw', 3], ['epiano1', 3],
      ['synthBrass', 2], ['leadCalliope', 2], ['voiceOohs', 2], ['marimba', 2],
      ['glockenspiel', 1],
    ],
    counter: [
      ['leadSquare', 4], ['leadSaw', 3], ['glockenspiel', 2], ['celesta', 2],
      ['marimba', 2], ['epiano2', 2], ['kalimba', 1],
    ],
    comp: [
      ['epiano1', 5], ['percussiveOrgan', 4], ['padPoly', 3], ['piano', 3],
      ['drawbarOrgan', 2], ['synthStrings', 2], ['clavinet', 2], ['epiano2', 2],
    ],
    pad: [
      ['synthStrings', 4], ['padPoly', 4], ['padWarm', 3], ['synthStrings2', 3],
      ['padHalo', 2], ['choirAahs', 2], ['strings1', 1],
    ],
    bass: [
      ['synthBass', 6], ['synthBass2', 4], ['leadBassLead', 3], ['fingerBass', 2],
      ['pickBass', 1],
    ],
    brass: [['synthBrass', 4], ['synthBrass2', 3], ['orchestraHit', 2], ['brassSection', 1]],
  },
  styleWeights: {
    chicago: 9, jackin: 8, acid: 8, deep: 7, piano: 5, garage: 6, ghetto: 2,
    tribal: 1, disco: 1, frenchtouch: 0.4, speedgarage: 0.3, ukgarage: 0.3,
    hardhouse: 1, progressive: 1, trance: 0.5, techhouse: 0.5, detroit: 8,
    bleep: 4, dubtechno: 1, hardgroove: 0.6, minimal: 0.4, microhouse: 0.3,
    ambienthouse: 2, newbeat: 5,
  },
  tempoScale: 1,
  // Zero, here and in all four. See the header — a record that lifts a semitone
  // in its last chorus cannot be mixed out of.
  keyChangeChance: 0,
  density: 0.5,
  /**
   * A small plate and the dotted-eighth echo this project has now standardised
   * on in three genres. The feedback is modest: on a sixteenth hat pattern a long
   * echo tail fills the gaps between the strokes, and the gaps are where the
   * swing lives.
   */
  space: { reverbSize: 0.42, delayBeats: 0.75, delayFeedback: 0.3 },
  effects: {
    // Dark and dry. A DX100 bass through a mixing desk is the sound, and the top
    // end of the record belongs to the hats.
    bass: { reverb: 0.03, lowpass: 1200, resonance: 0.3 },
    // The 909 hat is the brightest thing on a Chicago record and the ear takes
    // its impression of the whole track from it.
    drums: { reverb: 0.16, lowpass: 12000 },
    comp: { reverb: 0.34, delay: 0.28, lowpass: 6000 },
    pad: { reverb: 0.6, lowpass: 4200 },
    melody: { reverb: 0.4, delay: 0.3, lowpass: 7000, resonance: 0.2 },
    counter: { reverb: 0.45, delay: 0.4, lowpass: 6500 },
    brass: { reverb: 0.3, lowpass: 6000 },
    vocal: { reverb: 0.45, delay: 0.3, lowpass: 6500 },
  },
};

/**
 * RAVE — 1991–95.
 *
 * A hangar, a field, and ten thousand people who cannot see each other.
 *
 * Everything that changes here changes because of the distance. A Rhodes chord
 * does not survive two hundred metres of open air; a detuned saw stab and a
 * Korg M1 organ do, and that is why both are at the top of tables where a Rhodes
 * was in 1988. This is also the sampler's era — the Akai S1000 is what makes a
 * *stab* an object you can own rather than a chord somebody played — and the
 * consequence for the tables is that `brass` finally has a reader: the orchestra
 * hit and the synth-brass stab are the two loudest sounds of this five-year
 * window and neither one is being played by anybody.
 *
 * `KorgM1` leads the banks, and it is the one bank in this genre chosen for a
 * sound rather than for a machine: the M1's own piano and organ are on more
 * records of these years than any drum machine, and its kit came with them.
 * `RolandJD990` is the other side of it, which is where the pads that got called
 * *ambient* in this decade actually came from.
 *
 * **`electronic-kit` appears here at 1**, and it is the only object in this genre
 * anybody has ever been seen hitting. A live techno PA — a person behind a set of
 * pads, playing the record's own parts standing up — is a real thing from about
 * 1992 and it is the entire honest case for a drummer on this stage. One weight
 * in twelve, which is roughly how often the bill actually had one.
 */
const rave: EraProfile = {
  id: 'rave',
  year: 1993,
  label: '1991–95 rave',
  description:
    'A hangar and ten thousand people. Sampled stabs, detuned saws, an M1 organ and a sub that carries two hundred metres.',
  drumBanks: [
    ['KorgM1', 5],
    ['RolandTR909', 5],
    ['AkaiMPC60', 4],
    ['RolandJD990', 3],
    ['EmuSP12', 3],
    ['RolandR8', 2],
  ],
  drumSources: [['programmed', 10], ['electronic-kit', 1]],
  sequenced: { bass: 0.88, counter: 0.7 },
  palette: {
    melody: [
      ['leadSaw', 5], ['percussiveOrgan', 4], ['synthBrass', 3], ['leadSquare', 3],
      ['voiceOohs', 3], ['choirAahs', 2], ['leadCharang', 2], ['steelDrums', 2],
      ['fxCrystal', 2], ['piano', 2],
    ],
    counter: [
      ['leadSaw', 4], ['leadSquare', 3], ['fxCrystal', 3], ['glockenspiel', 2],
      ['celesta', 2], ['marimba', 2], ['kalimba', 2], ['synthBass', 1],
    ],
    comp: [
      ['padPoly', 4], ['percussiveOrgan', 4], ['piano', 4], ['synthStrings', 3],
      ['epiano1', 3], ['synthBrass', 2], ['harp', 2], ['pizzStrings', 1],
    ],
    pad: [
      ['synthStrings', 4], ['padPoly', 4], ['padSweep', 3], ['padHalo', 3],
      ['choirAahs', 3], ['synthChoir', 3], ['fxAtmosphere', 2], ['padWarm', 2],
      ['strings1', 2],
    ],
    bass: [
      ['synthBass', 6], ['synthBass2', 5], ['leadBassLead', 3], ['fingerBass', 2],
      ['fretlessBass', 1],
    ],
    brass: [
      ['synthBrass', 5], ['orchestraHit', 4], ['synthBrass2', 4], ['brassSection', 2],
      ['trumpet', 1],
    ],
  },
  styleWeights: {
    chicago: 3, jackin: 3, acid: 6, deep: 5, piano: 6, garage: 5, ghetto: 8,
    tribal: 6, disco: 3, frenchtouch: 1, speedgarage: 1.5, ukgarage: 0.6,
    hardhouse: 6, progressive: 8, trance: 5, techhouse: 2, detroit: 7,
    bleep: 6, dubtechno: 7, hardgroove: 4, minimal: 1.5, microhouse: 0.6,
    ambienthouse: 7, newbeat: 2,
  },
  tempoScale: 1.02,
  keyChangeChance: 0,
  density: 0.62,
  // A big bright room. The reverb goes up because the record is aimed at one,
  // and the delay feedback with it — a long echo across a hangar is not an
  // effect on the record, it is the building answering.
  space: { reverbSize: 0.68, delayBeats: 0.75, delayFeedback: 0.44 },
  effects: {
    bass: { reverb: 0.04, lowpass: 1000 },
    drums: { reverb: 0.24, lowpass: 13000 },
    comp: { reverb: 0.46, delay: 0.34, lowpass: 8000 },
    pad: { reverb: 0.75, lowpass: 5200 },
    melody: { reverb: 0.5, delay: 0.36, lowpass: 9000, resonance: 0.25 },
    counter: { reverb: 0.55, delay: 0.45, lowpass: 8000 },
    brass: { reverb: 0.4, lowpass: 8500 },
    vocal: { reverb: 0.55, delay: 0.34, lowpass: 7500 },
  },
};

/**
 * SUPERCLUB — 1996–2001.
 *
 * A licensed venue with the DJ's name above the door, an installed rig, and a
 * peak time somebody is being paid to programme.
 *
 * This is the era where the *record* stops being the unit and the *set* becomes
 * it. Everything here is louder, tighter and more compressed than either
 * neighbour, and the reason is not a fashion in mastering: a room with a
 * permanently installed system has a known frequency response, and once a
 * producer knows what the room will do they stop leaving headroom for it. The
 * effects table says so with the highest `lowpass` numbers and the lowest
 * `reverb` in the genre — a superclub record is dry and forward, because the
 * room is supplying the reverberation and doubling it turns the low mid to soup.
 *
 * It is also the era with two of the genre's three sung styles in it —
 * `speedgarage` and `ukgarage` — and one of its two disco-sampling ones. The
 * `comp` table carries a guitar for the first time for exactly that reason: a
 * filtered disco loop is a rhythm guitar somebody else recorded in 1979.
 *
 * `RolandMC303` is the period joke with a straight face behind it. It is a
 * *groovebox* — a machine sold in 1996 to make this music with, containing
 * imitations of the 909 and the 303 the previous ten years had used — and by
 * 1999 a great many records were made on the imitation rather than on the thing.
 */
const superclub: EraProfile = {
  id: 'superclub',
  year: 1999,
  label: '1996–2001 superclub',
  description:
    'An installed rig, a name above the door and a peak time. Filtered disco, swung sixteenths, and a breakdown built for a room.',
  drumBanks: [
    ['RolandMC303', 4],
    ['RolandTR909', 4],
    ['MPC1000', 4],
    ['RolandR8', 3],
    ['AlesisSR16', 3],
    ['KorgT3', 2],
  ],
  drumSources: [['programmed', 10], ['electronic-kit', 1]],
  sequenced: { bass: 0.85, counter: 0.65 },
  palette: {
    melody: [
      ['leadSaw', 5], ['voiceOohs', 4], ['percussiveOrgan', 3], ['leadSquare', 3],
      ['epiano1', 3], ['choirAahs', 3], ['synthBrass', 2], ['piano', 2],
      ['cleanGuitar', 2], ['leadCharang', 2],
    ],
    counter: [
      ['leadSaw', 4], ['cleanGuitar', 3], ['leadSquare', 3], ['celesta', 2],
      ['glockenspiel', 2], ['epiano2', 2], ['marimba', 2], ['guitarHarmonics', 1],
    ],
    comp: [
      ['epiano1', 4], ['percussiveOrgan', 4], ['piano', 4], ['cleanGuitar', 3],
      ['padPoly', 3], ['jazzGuitar', 2], ['synthStrings', 2], ['clavinet', 2],
      ['drawbarOrgan', 2],
    ],
    pad: [
      ['padPoly', 4], ['synthStrings', 4], ['padSweep', 3], ['synthStrings2', 3],
      ['padWarm', 3], ['padHalo', 2], ['synthChoir', 2], ['strings1', 2],
      ['fxAtmosphere', 2],
    ],
    bass: [
      ['synthBass', 6], ['synthBass2', 5], ['fingerBass', 3], ['leadBassLead', 3],
      ['pickBass', 2], ['slapBass', 1],
    ],
    brass: [
      ['synthBrass', 4], ['brassSection', 3], ['synthBrass2', 3], ['orchestraHit', 2],
      ['trumpet', 2],
    ],
  },
  styleWeights: {
    chicago: 2, jackin: 3, acid: 3, deep: 5, piano: 3, garage: 4, ghetto: 3,
    tribal: 5, disco: 8, frenchtouch: 8, speedgarage: 8, ukgarage: 8,
    hardhouse: 7, progressive: 7, trance: 9, techhouse: 5, detroit: 4,
    bleep: 1.5, dubtechno: 4, hardgroove: 7, minimal: 3, microhouse: 2,
    ambienthouse: 2, newbeat: 0.5,
  },
  tempoScale: 1.03,
  keyChangeChance: 0,
  density: 0.68,
  // The driest era and deliberately so — see the header. The room is supplying
  // the tail.
  space: { reverbSize: 0.4, delayBeats: 0.75, delayFeedback: 0.36 },
  effects: {
    bass: { reverb: 0.03, lowpass: 1300 },
    drums: { reverb: 0.14, lowpass: 15000 },
    comp: { reverb: 0.3, delay: 0.26, lowpass: 11000 },
    pad: { reverb: 0.6, lowpass: 6500 },
    melody: { reverb: 0.34, delay: 0.28, lowpass: 11000, resonance: 0.2 },
    counter: { reverb: 0.4, delay: 0.36, lowpass: 10000 },
    brass: { reverb: 0.26, lowpass: 10000 },
    vocal: { reverb: 0.38, delay: 0.24, lowpass: 9500 },
  },
};

/**
 * AFTERHOURS — 2002–07.
 *
 * A small dark room at six in the morning with ninety people left in it.
 *
 * The lowest density in the genre by a distance — 0.45, below even the warehouse
 * — and this is the era whose number a technology story cannot explain. By 2005
 * the record is made on a laptop with an unlimited track count, and it has
 * *fewer parts on it* than a record made in 1988 on four machines and a mixer.
 * The room is the reason. Ninety people who have been awake for eleven hours do
 * not need to be persuaded; the record's job is to keep something going, and
 * every element it adds is one the listener has to account for.
 *
 * So this is the era of `minimal`, `microhouse` and `techhouse`, and the era in
 * which `dubtechno` finally makes sense as a whole record rather than as a
 * texture. The palette is the shortest of the four for the same reason, and the
 * `brass` table is nearly vestigial: a stab is a 1993 object, and nothing in a
 * minimal record announces itself.
 *
 * **`DoepferMS404` is here because of what it lacks.** It carries `bd`, `sd`,
 * `hh`, `oh` and one tom, which is five voices — the least complete bank in the
 * genre and the second-least in the project — and `resolveVoice` will fold
 * anything else onto them. On any other style that is a degradation to be
 * avoided; on a minimal record it is the instrument, because the whole aesthetic
 * is that there are four sounds and you are going to hear all of them for nine
 * minutes.
 */
const afterhours: EraProfile = {
  id: 'afterhours',
  year: 2006,
  label: '2002–07 afterhours',
  description:
    'Six in the morning, ninety people, four sounds. The laptop era, and the one with the fewest parts on the record.',
  drumBanks: [
    ['MPC1000', 5],
    ['RolandTR909', 4],
    ['DoepferMS404', 3],
    ['RolandMC303', 3],
    ['RolandTR808', 2],
    ['YamahaRY30', 2],
  ],
  drumSources: [['programmed', 12], ['electronic-kit', 1]],
  /**
   * The highest sequencing figure anywhere in the project. By this decade there
   * is no plausible reading under which the bass line was performed: it is a
   * clip in an arrangement window, and it repeats to the sample.
   */
  sequenced: { bass: 0.92, counter: 0.8 },
  palette: {
    melody: [
      ['leadSquare', 4], ['epiano1', 3], ['marimba', 3], ['leadSaw', 3],
      ['kalimba', 2], ['voiceOohs', 2], ['percussiveOrgan', 2], ['glockenspiel', 2],
      ['fxCrystal', 2],
    ],
    counter: [
      ['leadSquare', 3], ['kalimba', 3], ['marimba', 3], ['celesta', 2],
      ['glockenspiel', 2], ['epiano2', 2], ['guitarHarmonics', 2], ['leadSaw', 2],
    ],
    comp: [
      ['epiano1', 5], ['padPoly', 3], ['percussiveOrgan', 3], ['epiano2', 3],
      ['clavinet', 2], ['jazzGuitar', 2], ['synthStrings', 2], ['harp', 1],
    ],
    pad: [
      ['padWarm', 4], ['padPoly', 4], ['padHalo', 3], ['fxAtmosphere', 3],
      ['synthStrings', 3], ['padNewAge', 2], ['synthChoir', 2], ['padSweep', 2],
    ],
    bass: [
      ['synthBass', 6], ['synthBass2', 5], ['leadBassLead', 3], ['fingerBass', 2],
      ['fretlessBass', 1],
    ],
    brass: [['synthBrass', 3], ['synthBrass2', 2], ['brassSection', 1], ['trumpet', 1]],
  },
  styleWeights: {
    chicago: 2, jackin: 2, acid: 2, deep: 6, piano: 1, garage: 2, ghetto: 1.5,
    tribal: 3, disco: 3, frenchtouch: 3, speedgarage: 1, ukgarage: 3,
    hardhouse: 1, progressive: 3, trance: 3, techhouse: 9, detroit: 4,
    bleep: 1, dubtechno: 8, hardgroove: 3, minimal: 9, microhouse: 8,
    ambienthouse: 3, newbeat: 0.3,
  },
  tempoScale: 0.98,
  keyChangeChance: 0,
  density: 0.45,
  // Long, and the one era where the tail is a compositional element rather than
  // a room. This is `dubtechno`'s decade and a chord going into a delay and not
  // coming back is most of what that style is.
  space: { reverbSize: 0.72, delayBeats: 0.75, delayFeedback: 0.58 },
  effects: {
    bass: { reverb: 0.05, lowpass: 900 },
    drums: { reverb: 0.2, lowpass: 14000 },
    comp: { reverb: 0.5, delay: 0.44, lowpass: 7000 },
    pad: { reverb: 0.8, lowpass: 4600 },
    melody: { reverb: 0.44, delay: 0.4, lowpass: 9000 },
    counter: { reverb: 0.5, delay: 0.48, lowpass: 8000 },
    brass: { reverb: 0.34, lowpass: 7000 },
    vocal: { reverb: 0.5, delay: 0.36, lowpass: 8000 },
  },
};

export const ERAS: Record<string, EraProfile> = {
  warehouse, rave, superclub, afterhours,
};
