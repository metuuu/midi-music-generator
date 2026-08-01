/**
 * Four eras, 1927 to 1990, and each one is a different set of objects in the room
 * rather than a different set of clothes on the same ones.
 *
 * The line to read them by is **how many of the instruments are plugged in**,
 * because in this repertoire that is the only production question and everything
 * else follows from it. In 1927 none of them are and the whole band is standing
 * round one carbon microphone; by 1955 the steel and the lead guitar are through
 * amplifiers and there is a drummer; by 1968 the record is a multitrack made in a
 * control room with a string section overdubbed onto it; and by 1978 the artist
 * owns the tape and has taken the band that plays the roadhouses into the studio
 * instead of the one that plays the sessions. Two of those four boundaries are
 * *arguments somebody had in public* rather than technologies arriving, which is
 * exactly the kind of thing a style table cannot say and an era table can.
 *
 * ## Why the fourth era is outlaw and not 1995
 *
 * The obvious fourth is new country — Garth Brooks, 1991, the biggest commercial
 * moment this music has ever had. It is not here, and the reason is that this file
 * would have nothing to write in it. A 1995 country record's rhythm section is a
 * rock rhythm section, its guitars are rock guitars, its drums are a rock kit
 * recorded in a rock room, and the only thing in the palette that would differ
 * from a rock genre's is one fiddle overdub and one steel overdub. An era whose
 * whole content is two overdubs is not an era, it is a mix note.
 *
 * Outlaw is a real fourth object. The palette genuinely changes — a phase shifter,
 * a Fender bass played with a pick, a band that has been on the road together for
 * six years rather than eight players who met at ten o'clock — and the tempo,
 * density and key-change numbers all move with it. `keyChangeChance` is the
 * cleanest single measurement of the argument: 0.28 in 1968 and 0.16 in 1978,
 * because the last-chorus gear change is precisely the Nashville device that
 * outlaw records were made in order not to do.
 *
 * ## Two instruments this genre needs and the catalogue does not have
 *
 * **The pedal steel.** There is no pedal steel in `style/instruments.ts` and there
 * is no General MIDI programme for one — GM 25's "steel guitar" is an acoustic
 * flat-top with steel strings on it, which is the bluegrass rhythm guitar and a
 * completely different object. So the instrument arrives here split across two
 * layers, because what a pedal steel actually does on a record is two jobs:
 *
 *  - **The answering fill between the vocal lines**, which is most of it, and
 *    which `guitarHarmonics` carries. It is a struck string touched at a node, so
 *    it rings for 2.2 seconds where a fretted note rings for one; it sits between
 *    C4 and C7, which is exactly the steel's fill register; and what it sounds
 *    like is a bell made out of a guitar. It is at or near the head of the
 *    `counter` palette in three of the four eras below, and that placement is the
 *    substitution.
 *  - **The held chord underneath the chorus**, which `strings1` carries in the
 *    `pad`. A steel player pressing a pedal moves one note of a sustained triad
 *    while the others hold, and a bowed ensemble is the only thing in the
 *    catalogue that sustains that way.
 *
 * What is lost is the bend itself, which is the whole instrument, and there is no
 * honest way to get it from a sampler triggered on note boundaries.
 *
 * **The mandolin.** Also absent, also without a GM programme. It is carried as a
 * *figure* rather than as a patch — see `chop` in `styles.ts`, played by
 * `mutedGuitar`, whose 0.25-second decay is the mandolin chop's envelope almost
 * exactly. Where a mandolin plays a tune rather than a backbeat, the palettes
 * below reach for `dulcimer`: paired courses struck rather than plucked, ringing
 * for well over two seconds, centred at G4 with a range of G3 to A6, which is the
 * mandolin's own compass to within a tone. A tremoloed mandolin is a fast repeated
 * note on a double course, and a hammered dulcimer is the only object here that
 * does that.
 *
 * ## The fiddle is not the violin, and the palettes never confuse them
 *
 * `fiddle` is General MIDI 110 and `violin` is 40, and they are different samples
 * of different playing. A fiddle is bowed nearer the bridge with a shorter stroke
 * and almost no vibrato, frequently with two strings sounding at once because the
 * bridge is filed flatter; its agility in the catalogue is 0.65 against the
 * violin's 0.6 and its attack is harder. Every era below names `fiddle` and none
 * of them names `violin`, including 1968, where the men playing on the session had
 * conservatory training — because what they were hired to play was still a fiddle
 * part, and the one place a country record wants a violin section it is called
 * `strings1` and there are sixteen of them.
 *
 * ## Why the early banks are drum machines standing in for a drummer
 *
 * The same argument jazz's 1938 era and reggae's 1963 one both make, and it holds
 * for three of the four eras here: `AkaiMPC60`, `AlesisSR16` and `EmuSP12` are
 * sample libraries of acoustic kits, and `drumSources` is the field that says what
 * is actually in the room. The first three eras name `kit` and nothing else. The
 * box arrives in `outlaw` — late, at a small weight, and for one style, which is
 * the only style in the catalogue whose subject is a record made with one.
 */

import type { EraProfile } from '../../style/types.js';

/**
 * STRING BAND — 1927–50.
 *
 * The Bristol sessions, the Carter Family, Charlie Poole, the Skillet Lickers, and
 * at the far end of it Bill Monroe in 1946. Everything acoustic, everybody round
 * one microphone, and the loudest instrument in the band physically standing
 * nearest to it. The palette below is the whole inventory of the music: a fiddle,
 * a banjo, a flat-top guitar, a bass fiddle if the band can afford one, a
 * harmonica in somebody's pocket and a dulcimer if this is Kentucky.
 *
 * `density: 0.58` is the lowest here, and it is not restraint. It is a physical
 * constraint: a single microphone cannot hold more than about four things before
 * the fourth becomes noise, and the entire arrangement practice of this era is
 * people stepping toward the mic and stepping back again.
 *
 * `keyChangeChance: 0.02`. A modulation is close to unavailable to this band and
 * the reason is the objects: a fiddle is playing in cross-tuning with two drones
 * ringing, a banjo is in open G with a capo on it, and both of them would have to
 * stop and retune. The two per cent is a band that has thought about it in advance.
 */
const stringband: EraProfile = {
  id: 'stringband',
  year: 1932,
  label: '1927–50 string band',
  description:
    'Everything acoustic and everybody round one microphone: fiddle, banjo, flat-top guitar and a bass fiddle if the band can afford one. Nobody modulates and nobody plugs in.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['EmuSP12', 3],
    ['AlesisSR16', 3],
  ],
  /**
   * A drummer, and mostly a drummer with nothing to do.
   *
   * Every style this era actually draws sets `excludeLayers: ['drums']`, so the
   * banks above are read only when somebody asks for a honky-tonk number in 1932
   * on the command line — which is a legitimate thing to ask for and produces a
   * band that did exist, playing a room that did not yet have a drum kit in it.
   * `DRUM_SOURCE_FROM` gates every machine well past this year in any case, so
   * listing them at zero would be an opinion about a question nobody could open.
   */
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['fiddle', 6], ['banjo', 3], ['harmonica', 3], ['steelGuitar', 3],
      ['dulcimer', 2], ['strumstick', 2], ['nylonGuitar', 1],
    ],
    counter: [
      ['fiddle', 5], ['banjo', 4], ['harmonica', 3], ['dulcimer', 2],
      ['steelGuitar', 2], ['strumstick', 1],
    ],
    comp: [
      ['steelGuitar', 7], ['banjo', 4], ['mutedGuitar', 3], ['nylonGuitar', 2],
      ['piano', 2], ['dulcimer', 1],
    ],
    /**
     * The pad is people.
     *
     * There is no sustaining instrument in a string band — a banjo note is gone in
     * half a second and a plucked guitar in one — so the only thing capable of
     * holding a chord under the tune is the other three members of the quartet
     * singing it. `choirAahs` and `voiceOohs` at the head of this table are not a
     * substitution for anything; they are the object.
     */
    pad: [
      ['choirAahs', 5], ['voiceOohs', 4], ['reedOrgan', 3], ['dulcimer', 1],
    ],
    bass: [['acousticBass', 8], ['steelGuitar', 2]],
    /**
     * The section, and in this era it is two fiddles.
     *
     * The `brass` layer in this genre is almost never brass, and the palettes say
     * so era by era. What the layer is *for* is the thing that answers the singer
     * in thirds and swells under the last line, and in a string band that is a
     * second fiddle, or a harmonica, or the banjo player putting the tune in
     * octaves. Only western swing and zydeco ever draw an actual horn out of it,
     * and both of those live two eras further on.
     */
    brass: [['fiddle', 5], ['harmonica', 3], ['recorder', 2], ['banjo', 1]],
  },
  styleWeights: {
    breakdown: 9, bluegrass: 8, bluegrasswaltz: 6, gospel: 7, cowboy: 6,
    murderballad: 7, newgrass: 1,
    honkytonk: 1, twostep: 2, waltz: 3, westernswing: 4, trainsong: 0,
    rockabilly: 0, cajun: 5, zydeco: 0,
    countrypolitan: 0, ballad: 2, duet: 7, bakersfield: 0, truckdriving: 0,
    outlaw: 0, countryrock: 0, altcountry: 0, countrypop: 0,
  },
  tempoScale: 1,
  keyChangeChance: 0.02,
  density: 0.58,
  /**
   * One microphone, one room, and a lathe cutting wax.
   *
   * Everything is dark because the medium was: a 1928 electrical recording rolls
   * off hard above about 5 kHz and has nothing below 100 Hz at all, which is why
   * the bass is filtered here rather than merely quiet. The reverb is the room —
   * a hotel dining room in Bristol with the furniture pushed back — and it is on
   * everything equally because there was one microphone and no way to send
   * anything anywhere.
   */
  effects: {
    drums: { reverb: 0.18, lowpass: 4200 },
    bass: { reverb: 0.18, lowpass: 1600 },
    comp: { reverb: 0.2, lowpass: 5000 },
    brass: { reverb: 0.22, lowpass: 5000 },
    melody: { reverb: 0.22, lowpass: 5200 },
    counter: { reverb: 0.22, lowpass: 5000 },
    pad: { reverb: 0.28, lowpass: 4000 },
    vocal: { reverb: 0.22, lowpass: 5000 },
  },
  space: { reverbSize: 0.38, delayBeats: 0.75, delayFeedback: 0.12 },
};

/**
 * HONKY-TONK — 1950–62.
 *
 * The amplifier arrives and the room changes with it. A honky-tonk is a bar with a
 * jukebox in it and a band in the corner, and the two instruments that got plugged
 * in first are the two that had to be heard over a hundred people who were not
 * listening: the steel guitar and the lead guitar. Everything else about the band
 * is the string band with a drummer added — the rhythm guitar is still chucking on
 * two and four, the bass is still upright, and the fiddle is still a fiddle.
 *
 * `slapBass2` in the bass palette is here rather than anywhere else and it is the
 * rockabilly pop: GM 37 is the popping finger where 36 is the thumb, and a slapped
 * upright alternates the two at a rate no other bass technique does. It is at a
 * real weight rather than a token one because for about eighteen months in the
 * middle of this era it was the loudest bass sound in America.
 *
 * The `counter` palette is where the pedal steel lives — `guitarHarmonics` at the
 * head of it, for the reason set out at the top of this file. In this era the
 * answering fill between the vocal lines is the single most identifiable thing on
 * the record, and it is a steel player.
 */
const honkytonk: EraProfile = {
  id: 'honkytonk',
  year: 1955,
  label: '1950–62 honky-tonk',
  description:
    'The steel and the lead guitar get amplified and a drummer gets hired: a bar band playing over a hundred people who are not listening, with a full triplet under everything.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['EmuSP12', 3],
    ['AlesisSR16', 3],
    ['SakataDPM48', 2],
  ],
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['fiddle', 5], ['cleanGuitar', 4], ['guitarHarmonics', 4], ['piano', 3],
      ['harmonica', 3], ['steelGuitar', 2], ['accordion', 2], ['tenorSax', 1],
    ],
    counter: [
      ['guitarHarmonics', 6], ['fiddle', 5], ['cleanGuitar', 3], ['harmonica', 3],
      ['piano', 2], ['accordion', 2], ['dulcimer', 1],
    ],
    comp: [
      ['steelGuitar', 6], ['cleanGuitar', 4], ['piano', 4], ['mutedGuitar', 3],
      ['nylonGuitar', 2], ['accordion', 2], ['banjo', 2],
    ],
    pad: [
      ['strings1', 3], ['guitarHarmonics', 3], ['choirAahs', 3], ['drawbarOrgan', 2],
      ['reedOrgan', 2],
    ],
    bass: [['acousticBass', 7], ['slapBass2', 3], ['pickBass', 2], ['fingerBass', 1]],
    brass: [
      ['fiddle', 5], ['tenorSax', 3], ['trumpet', 2], ['brassSection', 2],
      ['trombone', 1],
    ],
  },
  styleWeights: {
    breakdown: 2, bluegrass: 6, bluegrasswaltz: 4, gospel: 4, cowboy: 4,
    murderballad: 2, newgrass: 0,
    honkytonk: 9, twostep: 7, waltz: 7, westernswing: 7, trainsong: 6,
    rockabilly: 7, cajun: 5, zydeco: 2,
    countrypolitan: 1, ballad: 4, duet: 5, bakersfield: 1, truckdriving: 0,
    outlaw: 0, countryrock: 0, altcountry: 0, countrypop: 0,
  },
  tempoScale: 1,
  keyChangeChance: 0.12,
  density: 0.68,
  /**
   * Slapback, and it is on the voice and nothing else.
   *
   * The one production gesture this era invented: a second tape head about 120 ms
   * behind the first, fed back once and no more, so a syllable arrives twice and
   * stops. `delayFeedback: 0.16` is that literally — a single repeat — and it is
   * the number that separates a Sun record from a dub plate, where the same
   * mechanism is opened up to six repeats and becomes a second drummer.
   */
  effects: {
    drums: { reverb: 0.16, lowpass: 6000 },
    bass: { reverb: 0.06, lowpass: 1400 },
    comp: { reverb: 0.18, lowpass: 6800 },
    brass: { reverb: 0.24, lowpass: 7000 },
    melody: { reverb: 0.26, delay: 0.18, lowpass: 7200 },
    counter: { reverb: 0.28, delay: 0.16, lowpass: 7000 },
    pad: { reverb: 0.32, lowpass: 5000 },
    vocal: { reverb: 0.24, delay: 0.26, lowpass: 6500 },
  },
  space: { reverbSize: 0.42, delayBeats: 0.25, delayFeedback: 0.16 },
};

/**
 * NASHVILLE — 1962–72, and the era that is an argument rather than a technology.
 *
 * Chet Atkins at RCA and Owen Bradley at Decca decided that the fiddle and the
 * steel guitar were what was keeping this music off pop radio, took them off the
 * records and put a string section and a vocal group on instead. It worked
 * completely. It also produced the only era in this genre whose palette leads with
 * `strings1` and `piano` and whose `pad` is the biggest thing in the arrangement.
 *
 * The fiddle is still in the table at 2 rather than at 0, and that number is the
 * whole history: it did not vanish, it stopped being the first thing you heard.
 *
 * `keyChangeChance: 0.28` is the highest in the project outside iskelmä's own
 * eras, and it is this era's signature more than any instrument is. The last
 * chorus up a semitone with the strings arriving on the downbeat of it is what an
 * arranger was being paid for, and `preparedModulation` in `index.ts` is the other
 * half of the same gesture — the band announces it with the dominant of where it
 * is going, and everybody in the control room hears it coming.
 *
 * `density: 0.76` is the highest here for the obvious reason: this is the first
 * era in the genre where the number of people on the record is not limited by how
 * many will fit round a microphone.
 */
const nashville: EraProfile = {
  id: 'nashville',
  year: 1968,
  label: '1962–72 the Nashville sound',
  description:
    'The fiddle and the steel taken off and a string section and a vocal group put on: a multitrack made in a control room, with the last chorus up a semitone.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['AlesisSR16', 3],
    ['SakataDPM48', 3],
    ['EmuSP12', 2],
    ['RolandR8', 2],
  ],
  /**
   * Still a drummer, and by 1968 that is a decision. The Rhythm Ace existed and
   * was affordable; Nashville had Buddy Harman instead, who played on something
   * like eighteen thousand sessions. A box on this date would be staging the wrong
   * object in the one era where the object had a diary.
   */
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['piano', 4], ['guitarHarmonics', 4], ['cleanGuitar', 3], ['strings1', 3],
      ['vibraphone', 2], ['harmonica', 2], ['fiddle', 2], ['nylonGuitar', 2],
      ['tenorSax', 1],
    ],
    counter: [
      ['guitarHarmonics', 6], ['strings1', 3], ['piano', 3], ['cleanGuitar', 3],
      ['vibraphone', 2], ['harmonica', 2], ['fiddle', 2],
    ],
    comp: [
      ['cleanGuitar', 5], ['nylonGuitar', 4], ['piano', 4], ['steelGuitar', 4],
      ['mutedGuitar', 3], ['epiano1', 2], ['jazzGuitar', 2], ['banjo', 1],
    ],
    pad: [
      ['strings1', 6], ['strings2', 4], ['choirAahs', 4], ['voiceOohs', 3],
      ['drawbarOrgan', 2], ['padWarm', 1],
    ],
    bass: [['fingerBass', 5], ['acousticBass', 4], ['pickBass', 3]],
    brass: [
      ['strings1', 4], ['fiddle', 3], ['trumpet', 2], ['tenorSax', 2],
      ['brassSection', 2], ['trombone', 1],
    ],
  },
  styleWeights: {
    breakdown: 1, bluegrass: 4, bluegrasswaltz: 3, gospel: 3, cowboy: 2,
    murderballad: 2, newgrass: 1,
    honkytonk: 5, twostep: 5, waltz: 5, westernswing: 2, trainsong: 5,
    rockabilly: 2, cajun: 3, zydeco: 4,
    countrypolitan: 9, ballad: 8, duet: 5, bakersfield: 8, truckdriving: 8,
    outlaw: 2, countryrock: 3, altcountry: 0, countrypop: 1,
  },
  // A shade slower across the board. The Nashville sound is a tempo decision as
  // much as an instrumentation one: a string section cannot be got out of the way
  // in time at 160, so the whole catalogue drifts down about four beats.
  tempoScale: 0.97,
  keyChangeChance: 0.28,
  density: 0.76,
  /**
   * A chamber, and a great deal of it.
   *
   * RCA Studio B had a genuine reverb chamber in the basement and it is on
   * everything except the bass and the kick. What makes these records sound like
   * 1968 rather than like 1955 is not the strings, it is that the strings are
   * *further away* than anything else and the voice is closer than anything has
   * ever been — a large plate on the pad and almost none on the lead is the whole
   * production style in two numbers.
   */
  effects: {
    drums: { reverb: 0.22, lowpass: 6500 },
    bass: { reverb: 0.05, lowpass: 1200 },
    comp: { reverb: 0.3, lowpass: 7000 },
    brass: { reverb: 0.4, lowpass: 7000 },
    melody: { reverb: 0.3, delay: 0.1, lowpass: 7500 },
    counter: { reverb: 0.38, delay: 0.12, lowpass: 7200 },
    pad: { reverb: 0.55, lowpass: 5200 },
    vocal: { reverb: 0.26, delay: 0.08, lowpass: 7000 },
  },
  space: { reverbSize: 0.66, delayBeats: 0.5, delayFeedback: 0.18 },
};

/**
 * OUTLAW — 1973–90.
 *
 * Waylon Jennings renegotiated his contract in 1972 and got the right to produce
 * his own records with his own band, and Willie Nelson moved back to Texas and did
 * the same. What that changes is not a technology, it is *who is playing*: the
 * road band instead of the session players, which means a rhythm section that has
 * been together for six years and a guitarist with a phase shifter, and it means
 * the arrangements stop having anything overdubbed onto them.
 *
 * So the pad drops back to what a road band can produce, the electric guitars come
 * forward, and `keyChangeChance` falls to 0.16 — because the last-chorus gear
 * change is exactly the Nashville device these records were made in order not to
 * do. It is not zero: Willie Nelson has done it, cheerfully, and the point of
 * outlaw was that nobody was telling anybody what to do.
 *
 * This is also where the machine finally arrives, at a small weight and late, and
 * it arrives for one style. `countrypop` is the only entry in the catalogue with
 * `boxDrums` left true, and the whole of this era's `drumSources` table is written
 * to give that style a LinnDrum about one time in five while leaving a drummer
 * behind every other number in the era. The box is not the era; it is one thing
 * that happened inside it.
 */
const outlaw: EraProfile = {
  id: 'outlaw',
  year: 1978,
  label: '1973–90 outlaw and after',
  description:
    'The road band instead of the session players: a phase-shifted Telecaster, a Fender bass played with a pick, no overdubs, and pointedly no key change.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['RolandR8', 3],
    ['EmuSP12', 3],
    ['LinnDrum', 2],
    ['LinnLM2', 2],
    ['AlesisHR16', 2],
  ],
  drumSources: [['kit', 7], ['box', 2], ['programmed', 1]],
  palette: {
    melody: [
      ['cleanGuitar', 5], ['guitarHarmonics', 4], ['fiddle', 3], ['harmonica', 3],
      ['overdriveGuitar', 3], ['piano', 2], ['dulcimer', 2], ['banjo', 2],
      ['nylonGuitar', 2],
    ],
    counter: [
      ['guitarHarmonics', 5], ['cleanGuitar', 4], ['fiddle', 3], ['harmonica', 3],
      ['dulcimer', 2], ['banjo', 2], ['epiano1', 1],
    ],
    comp: [
      ['cleanGuitar', 5], ['steelGuitar', 5], ['mutedGuitar', 4], ['piano', 3],
      ['overdriveGuitar', 2], ['epiano1', 2], ['banjo', 2], ['nylonGuitar', 2],
    ],
    pad: [
      ['strings1', 4], ['padWarm', 3], ['choirAahs', 3], ['synthStrings', 2],
      ['drawbarOrgan', 2],
    ],
    bass: [['fingerBass', 6], ['pickBass', 4], ['acousticBass', 3], ['synthBass', 1]],
    brass: [
      ['fiddle', 4], ['strings1', 3], ['tenorSax', 2], ['brassSection', 2],
      ['synthBrass', 1],
    ],
  },
  styleWeights: {
    breakdown: 1, bluegrass: 3, bluegrasswaltz: 2, gospel: 2, cowboy: 1,
    murderballad: 2, newgrass: 6,
    honkytonk: 4, twostep: 4, waltz: 3, westernswing: 2, trainsong: 3,
    rockabilly: 2, cajun: 3, zydeco: 5,
    countrypolitan: 3, ballad: 5, duet: 3, bakersfield: 4, truckdriving: 4,
    outlaw: 9, countryrock: 8, altcountry: 7, countrypop: 6,
  },
  tempoScale: 1,
  keyChangeChance: 0.16,
  density: 0.7,
  /**
   * Dry, close and wide, and it is a live-room sound rather than a chamber one.
   *
   * The reverb comes off nearly everything relative to the era above it, because
   * these records were cut with the band playing together in a room with the
   * baffles up rather than one instrument at a time into a plate. The guitar keeps
   * a delay and the pad keeps a send, and that is most of what is left of the
   * previous decade's production.
   */
  effects: {
    drums: { reverb: 0.14, lowpass: 8000 },
    bass: { reverb: 0.03, lowpass: 1500 },
    comp: { reverb: 0.18, delay: 0.14, lowpass: 8000 },
    brass: { reverb: 0.24, lowpass: 8000 },
    melody: { reverb: 0.22, delay: 0.16, lowpass: 8500 },
    counter: { reverb: 0.26, delay: 0.2, lowpass: 8000 },
    pad: { reverb: 0.4, lowpass: 6000 },
    vocal: { reverb: 0.2, delay: 0.12, lowpass: 7500 },
  },
  space: { reverbSize: 0.5, delayBeats: 0.75, delayFeedback: 0.24 },
};

export const ERAS: Record<string, EraProfile> = {
  stringband, honkytonk, nashville, outlaw,
};
