/**
 * Indian era profiles — and the word "era" is being asked to do something here
 * it is not asked to do anywhere else in this project.
 *
 * Everywhere else an era is a *decade*: the same music, recorded on different
 * equipment by people wearing different clothes. Ambient's three eras are one
 * genre through a tape machine, a sampler and a laptop; jazz's three are one
 * bandstand in 1938, 1955 and 1968. The `year` field exists precisely because
 * that is what an era means — `EraProfile.year` says so at length, and the
 * reason it is a year rather than an id is that a synthesiser in 1974 looks the
 * same whichever genre is playing it.
 *
 * Two of the four below are not that. **Hindustani and Carnatic are not two
 * decades of one tradition.** They are two traditions, with different
 * repertoires, different instruments, a different rhythmic system, different
 * words for the same things and different things called by the same word, which
 * have been separate for something like five hundred years. Nothing about the
 * split is chronological and neither one came after the other.
 *
 * They are eras here anyway, and the reason is that `EraProfile` is the only
 * place a genre can say *which instruments play this and how densely* — the
 * palette, the percussion, the tempo scale and the style weights are all era
 * fields, and every one of them differs between North and South. A sitar and a
 * tabla against a veena and a mridangam is exactly the kind of statement this
 * table is shaped to make; the fact that the axis is geography rather than time
 * is a mismatch in the label and not in the content. The `year` values below are
 * therefore honest about something narrower than the tradition: they are the
 * decade of the *concert format* each one is staged in — the sabhā and the
 * gramophone recital of the 1930s, the Madras concert season of the 1950s — and
 * that is what the stage reads them for.
 *
 * `keyChangeChance` is 0 on all four, and it is the least negotiable number in
 * the genre. A performance is *in* a rāga; lifting the last chorus a tone does
 * not modulate it, it ends it and starts a different one.
 */

import type { EraProfile } from '../../style/types.js';

/**
 * HINDUSTANI — the North Indian classical tradition.
 *
 * A soloist, a tanpura behind them, a tabla beside them and — for a singer — a
 * sārangī or a harmonium shadowing the line a beat behind. Four people, two of
 * whom are drones.
 *
 * ## What is standing in for what, and where the catalogue simply has nothing
 *
 * This is the era where the substitutions are worst, so they are all listed
 * here and the other three inherit the argument.
 *
 *  - **The tanpura does not exist in the catalogue, and it is the one instrument
 *    this entire music rests on.** A tanpura is four plucked strings with a
 *    thread laid under the bridge — the *jawārī* — which makes each string
 *    sound a whole shimmering column of overtones rather than a pitch, and the
 *    rāga's notes are heard *against that column*. What is used instead is
 *    **`reedOrgan`**, and it replaces a pad palette — `padHalo`, `padWarm`,
 *    `padBowed`, `padNewAge` — that was chosen for having the most motion in it
 *    and was wrong on both counts.
 *
 *    It was wrong about the sound, by this file's own complaint: a pad holds
 *    the pitch and loses the buzz, and what is wanted is a texture with a
 *    rāga's worth of upper partials already in it. A free-reed drone box has
 *    them. It is also not a substitution at all but the actual object — when
 *    there is no tanpura player on the platform, what is droning under a
 *    Carnatic or Hindustani recital is a śruti box or a harmonium, and has been
 *    for a century. The `comp` slot below already knew this and had `reedOrgan`
 *    in it.
 *
 *    And it was wrong about the year, which is what forced the correction. The
 *    pad family is staged as a synthesiser by `concert/instruments.ts`, so a
 *    1935 sabhā and a 1952 Madras concert season were both putting a keyboard
 *    player behind a rig that did not exist; `rigPoolFor` has no honest object
 *    for those years and now returns none, which is what surfaced it. A
 *    harmonium is `organ` on the boards and needs no window.
 *  - **The harmonium is not in the catalogue either, and it is answered twice.**
 *    It is a free-reed box with a bellows the player pumps with one hand while
 *    playing with the other, which makes the accordion its nearest relative by
 *    construction rather than by resemblance — the same reeds, the same air
 *    supply, the same inability to vary a note once it has started. The audible
 *    difference is that an accordion has a vibrato register and a harmonium does
 *    not, and that the harmonium is played one-handed. Neither is expressible
 *    here, and `accordion` stays the pick everywhere the harmonium is *playing*:
 *    the melodic shadow behind a singer, in `counter` and `comp`.
 *
 *    `reedOrgan` is the pick where it is droning, and the split is not a
 *    hedge — it is the difference between the two jobs. A parlour reed organ is
 *    pumped with the feet and played with both hands, which is wrong for a
 *    harmonium accompanist and exactly right for an instrument nobody has to
 *    hold a tune on. It is also nearer the śruti box, which is the same reeds
 *    with the keyboard taken off. The sentence this replaces said every other
 *    reed in the catalogue is blown by a mouth, and it was wrong: this one is
 *    not, and the `comp` slot below was already drawing it.
 *  - **The bansuri is `shakuhachi`, and not `panFlute`.** Both bamboo, both in
 *    the catalogue, and the choice turns on one thing: a bansuri is a single
 *    tube whose pitch is bent constantly by rolling the embouchure and
 *    half-covering the holes — a bansuri phrase is very largely one long meend
 *    — and a pan flute is a rank of stopped pipes each of which plays exactly
 *    one note and cannot bend at all. The shakuhachi is the wrong country and
 *    the right instrument.
 *  - **The sārangī is `violin`.** A bowed short-necked lute with three playing
 *    strings and thirty-five sympathetic ones, fingered with the nails rather
 *    than the pads. The violin is a bowed string with no sympathetics and the
 *    wrong articulation, and it is what there is — and it is not a cheat in the
 *    South, where the violin is a genuine member of the ensemble.
 *  - **The santoor is `dulcimer`**, which is exactly what a santoor is.
 *  - **The shehnai is `shanai`**, which is the same instrument correctly named.
 *  - **The swarmandal is `harp`**, a small strummed zither for a large plucked
 *    one, which is closer than it sounds because the swarmandal is only ever
 *    strummed.
 *  - **The sitar is `sitar`.** One of two things in this list that needed no
 *    argument at all.
 */
const hindustani: EraProfile = {
  id: 'hindustani',
  year: 1935,
  label: 'Hindustani',
  description:
    'The North Indian classical tradition. A soloist, a tanpura, a tabla, and a sārangī or harmonium shadowing the line.',
  /**
   * Banks chosen for one property and one only: they carry a low tom, spare
   * percussion **and** a rim, which is what `render/drum-banks.ts` needs to keep
   * the three hand strokes on three different surfaces. Its own note on the
   * fallback chains says what happens otherwise — `lp` and `mp` both land on
   * `perc` and the theka flattens into one sample repeated, which is the exact
   * collapse those voices were added to undo.
   *
   * That they are drum machines and this era is 1935 is the same licence jazz
   * takes for its swing era, and for the same reason its table gives: a bank is
   * a sample library, not an object in the room. What is standing on the carpet
   * is decided by `drumSources` below.
   */
  drumBanks: [
    ['RolandR8+mridangam', 4],
    ['AkaiMPC60+mridangam', 3],
    ['SakataDPM48+mridangam', 3],
    ['ViscoSpaceDrum+mridangam', 2],
  ],
  /**
   * A person, with their hands, and nothing else — which is both correct and
   * not quite expressible.
   *
   * `kit` is the only value on this list that means "a human being is playing
   * this", and a tabla player is emphatically that. What `kit` also means is a
   * drum kit on a riser, and `core/types.ts` has a long note about why a fifth
   * `DrumSource` for a pair of hands on a hand drum is not this file's to add:
   * it needs an archetype in `concert/cast.ts` and a model for the hands to sit
   * behind, or it stages a drum machine for a person. So the part is written
   * for two hands and the stage puts a kit under them, and that is the largest
   * single thing this genre gets wrong visually.
   *
   * The year gate does the rest of the work for free. `box` is 1964 and
   * `programmed` is 1978, so neither is reachable from 1935 whatever anybody
   * later writes in this table.
   */
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['sitar', 5], ['shakuhachi', 4], ['shanai', 3], ['dulcimer', 3],
      ['violin', 3], ['cello', 1],
    ],
    counter: [
      ['violin', 4], ['accordion', 3], ['shakuhachi', 2], ['sitar', 2],
      ['dulcimer', 2], ['harp', 1],
    ],
    comp: [
      ['accordion', 5], ['harp', 3], ['dulcimer', 3], ['sitar', 2],
      ['reedOrgan', 2],
    ],
    pad: [
      ['reedOrgan', 6], ['strings1', 4], ['tremoloStrings', 3], ['strings2', 2],
    ],
    bass: [['contrabass', 4], ['cello', 3], ['acousticBass', 2], ['fretlessBass', 1]],
    /**
     * Vestigial: every style in this era excludes the brass layer. Filled with
     * the double reeds anyway rather than left arbitrary, because the one loud
     * outdoor wind this tradition has — the shehnai, and its enormous Southern
     * cousin the nāgasvaram — is genuinely the closest thing here to a brass
     * section's job, and a style that later stopped excluding brass should get
     * that rather than a trumpet.
     */
    brass: [['shanai', 3], ['englishHorn', 2], ['oboe', 2]],
  },
  styleWeights: {
    alap: 6, jor: 4, jhala: 4, dhrupad: 4, vilambit: 5, bandish: 6, gat: 5,
    tarana: 4, thumri: 5, ghazal: 4, bhajan: 4, qawwali: 3, dhun: 4,
  },
  tempoScale: 1,
  keyChangeChance: 0,
  /**
   * The lowest density in the project, and it is a description rather than a
   * preference: there are four people on the stage and two of them are playing
   * a drone. Anything that adds a layer here adds a person who is not in this
   * music.
   */
  density: 0.36,
  // A hall with a hard floor and a lot of soft furnishing, which is what a
  // sabhā is. Not a cathedral and not a studio: the reverb is short enough that
  // a fast tabla passage stays legible, which is the constraint that actually
  // decides it.
  space: { reverbSize: 0.44, delayBeats: 1, delayFeedback: 0.16 },
  effects: {
    pad: { reverb: 0.55, lowpass: 5200 },
    comp: { reverb: 0.4, lowpass: 5000 },
    melody: { reverb: 0.34, lowpass: 8000 },
    counter: { reverb: 0.42, lowpass: 6500 },
    // The drone stays dry for the reason ambient's does, and more so: a
    // sustained low tone with a tail on it beats against itself, and this one
    // never stops, so the beating never resolves.
    bass: { reverb: 0.06, lowpass: 1000 },
    // Barely any. A tabla in a recital is two metres from the audience and the
    // damped strokes are the ones carrying the pattern — put a hall on them and
    // the tin and the te become the same sound.
    drums: { reverb: 0.16, lowpass: 9000 },
    vocal: { reverb: 0.4, lowpass: 7000 },
  },
};

/**
 * CARNATIC — the South Indian classical tradition, which is a different music
 * and not a regional accent.
 *
 * Six differences, none of them cosmetic:
 *
 *  - **The repertoire is composed.** A Carnatic concert is built on kṛtis by
 *    named composers, learned as fixed pieces, with the improvisation hung off
 *    them. A Hindustani concert is built on a rāga, and the bandish is a peg.
 *  - **The rhythmic system is different.** Tāla is counted with the hand — a
 *    clap, finger-counts, a wave — and the mridangam has no fixed theka the way
 *    the tabla does; a mridangam player is composing over the cycle every time
 *    round.
 *  - **The accompanist answers.** The violin plays the ālāpana phrase by phrase
 *    with the soloist, which is why `alapana` here does not exclude the counter
 *    layer and `alap` in the North does.
 *  - **The instruments are different.** Veena and mridangam and ghaṭam against
 *    sitar and tabla; the violin is a full member here and a visitor there.
 *  - **The melakarta system.** Seventy-two parent scales, generated
 *    exhaustively and named, against the North's ten thāṭs assembled from
 *    practice. The rāga list in `styles.ts` names both where both exist.
 *  - **It is loud.** A nāgasvaram ensemble plays outdoors at temple processions
 *    and is designed to be heard a street away.
 *
 * The veena is written as `sitar`, which is the worst substitution in the file
 * and the only one available: a Saraswati veena is a fretted plucked lute with
 * a resonator at each end, played resting on the floor across the lap, and the
 * catalogue's other plucked entries — `koto`, `shamisen`, `dantranh`, `banjo` —
 * are all further away. It is at least the right family and the right
 * continent.
 */
const carnatic: EraProfile = {
  id: 'carnatic',
  year: 1952,
  label: 'Carnatic',
  description:
    'The South Indian classical tradition: a composed repertoire, a violin that answers phrase by phrase, and a mridangam composing over the cycle.',
  drumBanks: [
    ['AkaiMPC60+mridangam', 4],
    ['RolandR8+mridangam', 3],
    ['EmuSP12+mridangam', 3],
    ['YamahaRY30+mridangam', 2],
  ],
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['violin', 5], ['shakuhachi', 4], ['sitar', 3], ['shanai', 3],
      ['cello', 1],
    ],
    counter: [
      ['violin', 5], ['shakuhachi', 2], ['sitar', 2], ['accordion', 2],
      ['dulcimer', 1],
    ],
    comp: [
      ['accordion', 4], ['sitar', 3], ['harp', 2], ['dulcimer', 2],
      ['reedOrgan', 2],
    ],
    // The śruti box, and then the violin section doubling it. See the tanpura
    // paragraph under `hindustani`: 1952 is eleven years before the earliest
    // object in `SYNTH_RIGS`, and this is the era `npm run concert` caught a
    // polysynth standing in.
    pad: [
      ['reedOrgan', 6], ['strings1', 4], ['strings2', 3], ['tremoloStrings', 2],
    ],
    bass: [['contrabass', 4], ['cello', 3], ['acousticBass', 2], ['fretlessBass', 1]],
    brass: [['shanai', 4], ['oboe', 2], ['englishHorn', 2]],
  },
  styleWeights: {
    alapana: 6, tanam: 4, varnam: 5, kriti: 7, tillana: 5, padam: 4, svara: 4,
    // The two traditions do share some ground, and this is honestly where it
    // is: devotional song crosses freely and nobody polices it.
    bhajan: 3, dhun: 2,
  },
  tempoScale: 1,
  keyChangeChance: 0,
  // A shade denser than the North: the violin is a full member rather than a
  // shadow, and there is frequently a second percussionist on a ghaṭam.
  density: 0.42,
  space: { reverbSize: 0.5, delayBeats: 1, delayFeedback: 0.14 },
  effects: {
    pad: { reverb: 0.55, lowpass: 5400 },
    comp: { reverb: 0.4, lowpass: 5200 },
    melody: { reverb: 0.3, lowpass: 9000 },
    counter: { reverb: 0.36, lowpass: 8000 },
    bass: { reverb: 0.06, lowpass: 1000 },
    drums: { reverb: 0.18, lowpass: 9500 },
    vocal: { reverb: 0.38, lowpass: 7500 },
  },
};

/**
 * FILMĪ — Bombay playback, roughly 1950 to 1975.
 *
 * The only era here that is an era. A film song of this period is a rāga in the
 * tune, a string section behind it, a dholak and a kit under that, and a
 * playback singer in front of all of it — and it was made in a single room in
 * one take with fifty people in it, because multitrack had not arrived and
 * nobody could afford it if it had.
 *
 * That production fact is why this era's `density` is nearly double the
 * classical ones and why it is the only one with a brass palette that gets
 * used. It is also why the reverb is the largest here: a fifty-piece orchestra
 * and a singer in one live room is a room you can hear.
 */
const filmi: EraProfile = {
  id: 'filmi',
  year: 1962,
  label: 'Filmī',
  description:
    'Bombay playback. A rāga in the tune, a string section behind it, a dholak and a kit under that, and fifty people in one room in one take.',
  drumBanks: [
    ['RolandCompurhythm1000+mridangam', 4],
    ['AkaiMPC60+mridangam', 3],
    ['RolandTR626+mridangam', 3],
    ['EmuDrumulator+mridangam', 2],
  ],
  // 1962, so the preset box misses its own invention by two years and the gate
  // in `eligibleDrumSources` strikes it whatever this table says. Which is the
  // right answer anyway: what is on these records is a session drummer and a
  // dholak player sitting next to each other.
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['violin', 4], ['sitar', 3], ['shakuhachi', 3], ['strings1', 3],
      ['accordion', 2], ['flute', 2], ['clarinet', 1], ['harmonica', 1],
      ['dulcimer', 1],
    ],
    counter: [
      ['violin', 3], ['flute', 3], ['sitar', 2], ['pizzStrings', 2],
      ['harp', 2], ['accordion', 2], ['mutedTrumpet', 1],
    ],
    comp: [
      ['accordion', 4], ['piano', 3], ['nylonGuitar', 3], ['harp', 2],
      ['dulcimer', 2], ['epiano1', 1],
    ],
    // 1962 misses `polysynth.from` by a single year, and the year is right:
    // there is no synthesiser on a Bombay soundtrack in 1962, so `choirAahs`,
    // `padWarm` and `synthStrings` come out and the string section — which is
    // the actual sound of this pad, fifty players in one room — takes their
    // weight. The harmonium behind them is on these records too.
    pad: [
      ['strings1', 6], ['strings2', 5], ['tremoloStrings', 4], ['reedOrgan', 2],
    ],
    bass: [['acousticBass', 4], ['contrabass', 3], ['fingerBass', 2], ['cello', 2]],
    brass: [
      ['brassSection', 3], ['trumpet', 3], ['trombone', 2], ['frenchHorn', 2],
      ['altoSax', 2], ['shanai', 1],
    ],
  },
  styleWeights: {
    filmi: 7, cabaret: 5, mujra: 5, bhangra: 4, ghazal: 4, qawwali: 4,
    bhajan: 3, thumri: 2, dhun: 2,
  },
  tempoScale: 1,
  keyChangeChance: 0,
  density: 0.66,
  // A large live room with a lot of people in it, and a tape echo on the voice.
  space: { reverbSize: 0.68, delayBeats: 0.5, delayFeedback: 0.24 },
  effects: {
    pad: { reverb: 0.6, lowpass: 4600 },
    comp: { reverb: 0.45, lowpass: 4800 },
    // Rolled off at the top, which is most of what makes a 1962 optical
    // soundtrack sound like one — the negative could not carry it.
    melody: { reverb: 0.4, delay: 0.12, lowpass: 5600 },
    counter: { reverb: 0.5, lowpass: 5000 },
    bass: { reverb: 0.1, lowpass: 900 },
    drums: { reverb: 0.3, lowpass: 5000 },
    brass: { reverb: 0.42, lowpass: 5400 },
    vocal: { reverb: 0.55, delay: 0.18, lowpass: 5200 },
  },
};

/**
 * FUSION — 1970 onward, and the era where the drone met a rhythm section.
 *
 * The records this is named for did one consistent thing: they handed the tāla
 * to instruments that had never had one — a fretless bass, a kit, an electric
 * violin — and left everything else alone. So the palette here is the
 * classical palette with amplification added rather than replaced, and the
 * pitch material is unchanged. That is why `fusiongat` and `jugalbandi` are the
 * same tālas as `gat` and `tarana` at higher tempos and not new metres: the
 * fusion of the title is a fusion of *ensembles*, not of grammars.
 *
 * The one era where a sequencer is technically available — 1978 is past
 * `SEQUENCER_FROM` — and it is not used. `sequenced` is absent, because a
 * sequenced part is a part nobody is playing, and the entire proposition of
 * these records is that the players were in a room together doing arithmetic at
 * each other.
 */
const fusion: EraProfile = {
  id: 'fusion',
  year: 1978,
  label: 'Fusion',
  description:
    'From 1970: the drone handed to a rhythm section. The classical palette with amplification added rather than replaced.',
  drumBanks: [
    ['RolandR8+mridangam', 4],
    ['AkaiXR10+mridangam', 3],
    ['YamahaRY30+mridangam', 3],
    ['RolandTR808+mridangam', 2],
  ],
  /**
   * Mostly hands, and a little programming. A tabla player is on every one of
   * these records and a drum machine is on some of them, which is 1978 exactly.
   */
  drumSources: [['kit', 8], ['programmed', 2]],
  palette: {
    melody: [
      ['sitar', 4], ['dulcimer', 4], ['violin', 3], ['shakuhachi', 3],
      ['electricViolin', 2], ['jazzGuitar', 2], ['vibraphone', 2],
      ['leadSquare', 1],
    ],
    counter: [
      ['dulcimer', 3], ['vibraphone', 3], ['violin', 3], ['electricVibes', 2],
      ['marimba', 2], ['harp', 2], ['sitar', 2],
    ],
    comp: [
      ['epiano1', 4], ['accordion', 3], ['jazzGuitar', 3], ['harp', 2],
      ['dulcimer', 2], ['padPoly', 2],
    ],
    pad: [
      ['padWarm', 4], ['padNewAge', 3], ['strings2', 3], ['synthStrings', 2],
      ['padHalo', 2], ['choirAahs', 1],
    ],
    bass: [['fretlessBass', 4], ['fingerBass', 3], ['acousticBass', 3], ['contrabass', 2]],
    brass: [['sopranoSax', 3], ['flute', 2], ['synthBrass', 1], ['trumpet', 1]],
  },
  styleWeights: {
    ragarock: 5, jugalbandi: 6, santoor: 5, fusiongat: 6,
    // The classical items survive into this era intact, played by the same
    // people on louder equipment. The ones that do not are the ones whose
    // identity is the absence of a rhythm section.
    gat: 4, jhala: 4, bandish: 3, dhun: 4, tarana: 3, bhangra: 3, thumri: 2,
  },
  tempoScale: 1,
  keyChangeChance: 0,
  density: 0.58,
  // The biggest space of the four, and the only one that is a production choice
  // rather than a description of a room: a 1975 studio plate on everything, at
  // a length nobody in a sabhā would tolerate.
  space: { reverbSize: 0.74, delayBeats: 0.75, delayFeedback: 0.34 },
  effects: {
    pad: { reverb: 0.72, lowpass: 6400 },
    comp: { reverb: 0.5, lowpass: 6800 },
    melody: { reverb: 0.42, delay: 0.2, lowpass: 9000 },
    counter: { reverb: 0.55, delay: 0.24, lowpass: 8000 },
    bass: { reverb: 0.08, lowpass: 1300 },
    drums: { reverb: 0.24, lowpass: 9000 },
    vocal: { reverb: 0.6, delay: 0.22, lowpass: 6800 },
  },
};

export const ERAS: Record<string, EraProfile> = {
  hindustani, carnatic, filmi, fusion,
};
