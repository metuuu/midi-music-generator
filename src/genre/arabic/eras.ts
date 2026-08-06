/**
 * Arabic era profiles.
 *
 * The era decides who is in the room and what they are playing, which in this
 * genre is a bigger decision than usual: the same maqsum in the same maqam is a
 * different piece of music played by four people around a microphone in 1938
 * and by forty behind a conductor in 1968, and the *notes are the same*. Every
 * other axis this generator has — tempo, mode, progression, iqa' — leaves those
 * two indistinguishable. Only this one separates them.
 *
 * ## Three things that are true of every era below
 *
 * **`keyChangeChance` is 0 everywhere, and it is the strongest statement in the
 * file.** Lifting the final chorus a semitone is the iskelmä gesture and here it
 * would not be a lift, it would be a *different maqam*: the genre's hook picks
 * the maqam from the tonic (see `index.ts`), and the tonic is what a key change
 * moves. A song that modulated would change scale halfway through and the change
 * would be silent — the tables would look innocent and the second half would be
 * in Hijazkar where the first half was in Ajam. `relativeMajorChorus` is 0 on
 * every style for exactly the same reason.
 *
 * **There used to be no bank in the sample pack that was a darbuka**, and the
 * paragraph this replaces said so at length because pretending otherwise would
 * have been worse. The pack was 71 drum *machines* and nothing else, and what
 * this genre asks them for is a low hand stroke, a mid one, a high one and a
 * tambourine — `lp`,
 * `mp`, `hp` and `tb`. So the banks were chosen by what they could *resolve*
 * rather than by period: every one carrying a floor tom, a spare percussion
 * sample, a rim and a tambourine, which is what sent the three hand strokes to
 * three different surfaces instead of collapsing two of them onto the same
 * `perc`. `KorgKR55` has no floor tom, so on it the doum and the tek came out as
 * the same click, and a maqsum with one stroke in it is not a maqsum.
 *
 * **There is one now, and this table has taken it.** `SAMPLE_RACKS.darbuka` in
 * `render/drum-banks.ts` is a real goblet drum, indexed stroke by stroke against
 * a measurement rather than approximated — `lp` `mp` `hp` are Versilian's doum,
 * tek and ka at 99.5%, 79% and 4% low-band share, `tb` is the riq and `perc` the
 * bendir. A rack rides a machine under the `+` mark and claims exactly the
 * auxiliary voices, never `bd`, `sd`, `hh` or the cymbals, so the resolution
 * argument above is not so much answered as made unnecessary: on a racked bank
 * the doum is a doum rather than a floor tom standing in for one.
 *
 * **Twelve of the sixteen bank entries below carry it**, which is three eras of
 * four — `takht`, `firqa` and `satellite`, every entry in each. `shaabi` is the
 * exception and it is a statement rather than an oversight: its four banks are
 * bare `RolandTR808`, `LinnDrum`, `RolandTR626` and `Linn9000`, because in 1988
 * the box *is* the sound, and putting a sampled goblet drum on a cassette-shop
 * arrangement would be restoring the instrument the era is defined by having
 * replaced. `npm run genres` covers the seam directly, as *"darbuka over an 808
 * — bare indexed names on the rack, a prefix on the machine"*.
 *
 * **The bass palette is an anachronism in the first era and is filled anyway.**
 * A takht has no bass line at all: the lowest sound in the room is the oud's
 * bottom course and the qanun's left hand, and both of them are playing the
 * tune. The layer exists because instrument assignment fills every role before
 * the arrangement decides which ones play, so it is filled with the instruments
 * a *recording* of a takht would have had if it had had one — a contrabass and a
 * cello, which is what the firqa added the moment it could afford to.
 */

import type { EraProfile } from '../../style/types.js';

/**
 * TAKHT — the small classical ensemble, 1930s–50s Cairo.
 *
 * Four to six players and a singer: oud, qanun, nay, kamanja and riq, sitting
 * in a row on a low platform. It is the ensemble Umm Kulthum and Abdel Wahab
 * started in, and its defining property is that **everybody is playing the same
 * line**. There is no accompaniment in a takht in the sense the rest of this
 * project means it — the oud and the qanun and the violin all play the melody
 * and decorate it differently, which is heterophony, and it is why this era's
 * `density` is the lowest of the four while its `unison` weighting at the genre
 * level is the highest in the project.
 *
 * The instruments and what carries them, since three of the five are not in the
 * catalogue and one of them never will be:
 *
 *  - **oud → `nylonGuitar`.** The oud is a fretless gut-strung lute with a
 *    wooden belly, struck with a long plectrum. `shamisen` has the right hand —
 *    fretless, plectrum, a note gone in half a second — and the wrong body,
 *    since its belly is a skin and the sound is a slap. `sitar` has the wrong
 *    everything: sympathetic strings and a two-second decay. Gut over wood wins,
 *    and the fretting is the price. It is audible and it is the smaller error.
 *  - **qanun → `dulcimer`.** The catalogue's own entry says it covers the
 *    santur, the santouri and the cimbalom under one name, which is exactly the
 *    right generosity. The error here is the hand rather than the body: a qanun
 *    is plucked with two finger-picks and a dulcimer is struck with two hammers.
 *    `kantele` is the plucked one — a psaltery with no dampers, which is a
 *    better description of the *action* — and it loses on compass, fifteen
 *    strings against the qanun's twenty-six courses.
 *  - **nay → `panFlute` and `shakuhachi`.** Both are end-blown and both have
 *    breath in the sample, which is the whole of what a nay sounds like. GM's
 *    `flute` is transverse and clean and would be wrong twice.
 *  - **mizmar → `shanai`.** A conical double reed played outdoors, loud and
 *    nasal. This one is nearly exact.
 *  - **kamanja → `violin`.** The Arabic violin *is* a violin; it has been since
 *    about 1900. Nothing to substitute.
 */
const takht: EraProfile = {
  id: 'takht',
  year: 1938,
  label: '1930s–50s takht',
  description:
    'The small classical ensemble: oud, qanun, nay, violin and riq, everybody playing the same line and decorating it differently.',
  // Chosen for their hand-percussion coverage rather than their decade — see
  // the note at the top. The R8 leads because its spare percussion samples are
  // struck skins, which is the nearest thing in the pack to a hand on a head.
  drumBanks: [
    ['RolandR8+darbuka', 5],
    ['AkaiXR10+darbuka', 3],
    ['YamahaRY30+darbuka', 3],
    ['RolandD110+darbuka', 2],
  ],
  // 1938, so `DRUM_SOURCE_FROM` strikes out everything but the hands before any
  // weight here is read. Written out rather than omitted because in this genre
  // it is a claim rather than a default: a takht's percussion is one person with
  // a frame drum, and it stays one person for the whole of the era.
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['violin', 5], ['nylonGuitar', 4], ['dulcimer', 3], ['panFlute', 3],
      ['shakuhachi', 2], ['accordion', 2], ['shanai', 1],
    ],
    counter: [
      ['dulcimer', 4], ['nylonGuitar', 3], ['violin', 3], ['panFlute', 2],
      ['shakuhachi', 2], ['harp', 1],
    ],
    comp: [
      ['dulcimer', 5], ['nylonGuitar', 4], ['accordion', 2], ['harp', 2],
    ],
    // A takht has no pad. What sustains in one is the ensemble holding a note
    // together, so the entries here are the string patches that read as several
    // people rather than as a synthesiser.
    //
    // `choirAahs` sat at the end of this list and broke the sentence above:
    // `concert/instruments.ts` stages a choir patch as a keyboard, so one draw
    // in ten put a player behind a synthesiser at a 1938 takht. Dropped rather
    // than reweighted — there is no weight at which that is a takht.
    pad: [
      ['strings1', 4], ['tremoloStrings', 3], ['strings2', 2],
    ],
    bass: [['contrabass', 4], ['cello', 3], ['acousticBass', 2]],
    // Vestigial except under `zaffa`, `saidi` and `dabke` — the three styles
    // that keep the layer, all of them outdoor or wedding music. This comment
    // said `zaffa` was the only one; `styles.ts` has the measurement, which is
    // 1111 brass notes to zaffa, 700 to saidi and 665 to dabke over forty seeds
    // each and 0 to the other eighteen. The mizmar leads it, because a
    // procession band is a shawm band with whatever brass the family could hire
    // standing behind it.
    brass: [['shanai', 3], ['trumpet', 2], ['trombone', 2]],
  },
  styleWeights: {
    maqsum: 4, baladi: 3, saidi: 2,
    fallahi: 2, malfuf: 3, ayyub: 3,
    jurjina: 3, samai: 6, aqsaq: 3, dawrhindi: 4, bashraf: 6,
    wahda: 5, masmoudi: 4, chiftetelli: 4,
    zaffa: 2, dabke: 2, khaleeji: 2,
    longa: 5, muwashshah: 6, dulab: 5, taqsim: 6,
  },
  tempoScale: 1,
  keyChangeChance: 0,
  // The lowest of the four, and it is heterophony rather than restraint: the
  // players are not adding parts, they are adding versions of one part.
  density: 0.42,
  // A room with people in it and a single microphone, which is what 1938 was.
  // Short and dry, and the delay is barely there — a tape echo on a takht is
  // twenty years early.
  space: { reverbSize: 0.4, delayBeats: 0.5, delayFeedback: 0.2 },
  effects: {
    // Shellac rolls off both ends. The highpass does more for the period than
    // any choice of instrument does, and it is why the era sounds thin in a way
    // no amount of arranging would produce.
    melody: { reverb: 0.3, lowpass: 5200, highpass: 140 },
    counter: { reverb: 0.34, lowpass: 4800, highpass: 140 },
    comp: { reverb: 0.28, lowpass: 4600, highpass: 160 },
    pad: { reverb: 0.4, lowpass: 4000, highpass: 160 },
    bass: { reverb: 0.05, lowpass: 900, highpass: 60 },
    drums: { reverb: 0.22, lowpass: 5000, highpass: 120 },
    vocal: { reverb: 0.35, lowpass: 5200, highpass: 150 },
  },
};

/**
 * FIRQA — the large orchestra, 1960s–70s.
 *
 * The takht with a string section bolted onto it and a conductor in front. Ten
 * or fifteen violins playing the line in unison, cellos and a contrabass under
 * them, an electric bass by about 1965, and the oud and qanun still there but
 * now one voice in forty. This is the sound of the long Cairo radio broadcasts
 * and of Abdel Halim's film songs, and it is what most listeners outside the
 * region mean when they say Arabic orchestral music.
 *
 * The thing it changed is not the harmony, which is still four chords, and not
 * the ornament, which is still there. It is the **weight** of a unison: fifteen
 * violins playing one line an inch out of tune with each other produce a chorus
 * effect that no single instrument can, and that is what the era is for. Hence
 * the highest `density` of the four, and hence `strings1` at the top of three
 * separate palettes.
 */
const firqa: EraProfile = {
  id: 'firqa',
  year: 1968,
  label: '1960s–70s firqa',
  description:
    'The orchestra: fifteen violins on the line, cellos and electric bass under them, and the oud and qanun still in there somewhere.',
  drumBanks: [
    ['RolandR8+darbuka', 4],
    ['YamahaRY30+darbuka', 4],
    ['RolandMT32+darbuka', 3],
    ['BossDR550+darbuka', 2],
  ],
  /**
   * Still only hands, and by 1968 that is a choice rather than a date.
   *
   * `box` clears the year gate — the Rhythm Ace is 1964 — and it does not go in
   * the table. A firqa is forty musicians on a stage with a conductor, and the
   * one thing an orchestra of that size does not do is hire a rhythm box; the
   * percussion section is three players with a riq, a darbuka and a tabla, and
   * they are reading. The box arrives in the era below, where the argument for
   * it is that there was nobody else left to pay.
   */
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['violin', 6], ['strings1', 4], ['accordion', 3], ['dulcimer', 3],
      ['cello', 2], ['panFlute', 2], ['nylonGuitar', 2], ['shanai', 1],
    ],
    counter: [
      ['dulcimer', 4], ['accordion', 3], ['violin', 3], ['harp', 2],
      ['panFlute', 2], ['cello', 2], ['nylonGuitar', 2],
    ],
    comp: [
      ['dulcimer', 4], ['accordion', 4], ['nylonGuitar', 3], ['harp', 2],
      ['piano', 2], ['drawbarOrgan', 2],
    ],
    pad: [
      ['strings1', 5], ['strings2', 4], ['tremoloStrings', 3], ['choirAahs', 2],
      ['synthStrings', 1],
    ],
    bass: [['contrabass', 4], ['fingerBass', 4], ['cello', 2], ['acousticBass', 2]],
    brass: [['brassSection', 3], ['trumpet', 3], ['shanai', 2], ['trombone', 2]],
  },
  styleWeights: {
    maqsum: 6, baladi: 5, saidi: 4,
    fallahi: 3, malfuf: 3, ayyub: 2,
    jurjina: 2, samai: 4, aqsaq: 2, dawrhindi: 3, bashraf: 3,
    wahda: 6, masmoudi: 4, chiftetelli: 4,
    zaffa: 3, dabke: 3, khaleeji: 2,
    longa: 4, muwashshah: 3, dulab: 4, taqsim: 4,
  },
  tempoScale: 1,
  keyChangeChance: 0,
  density: 0.72,
  // A studio big enough to hold forty people, which is a hall. The first era
  // here with a reverb worth the name and it was used on everything.
  space: { reverbSize: 0.68, delayBeats: 0.75, delayFeedback: 0.28 },
  effects: {
    melody: { reverb: 0.42, lowpass: 8500 },
    counter: { reverb: 0.46, lowpass: 8000 },
    comp: { reverb: 0.38, lowpass: 7500 },
    pad: { reverb: 0.55, lowpass: 7000 },
    bass: { reverb: 0.08, lowpass: 1400 },
    drums: { reverb: 0.3, lowpass: 7000 },
    vocal: { reverb: 0.45, lowpass: 8000 },
  },
};

/**
 * SHAABI — synths and a drum machine, 1980s–90s.
 *
 * *Shaabi* means "of the people" and the connotation is street rather than
 * folk: cassette-shop music, made by three or four people with a keyboard, a
 * drum machine and an accordion, for weddings and microbuses. Ahmed Adaweyah,
 * Hakim, and the Lebanese and Syrian dabke that came off the same equipment.
 *
 * The instrument that survives the transition intact is the **accordion**, and
 * it is worth saying why it was there in the first place: Egyptian accordions
 * were physically retuned, reeds filed, so that they could play the quarter
 * tones the maqam system needs. That is the single most characteristic sound of
 * this era and this engine cannot make it — 12-tone equal temperament is the
 * scope decision the whole genre is built inside — so what is left is the
 * timbre and the phrasing without the tuning. Named here rather than buried,
 * because an Egyptian accordion in equal temperament is a *French* accordion,
 * and that is a real loss rather than an approximation.
 *
 * The first era with a machine in it, and the box is in the table for one
 * reason: by 1988 the arrangement that made this music cheap enough to make was
 * one person with a keyboard whose rhythm section is a start button.
 */
const shaabi: EraProfile = {
  id: 'shaabi',
  year: 1988,
  label: '1980s–90s shaabi',
  description:
    'Cassette-shop music: a keyboard, a drum machine, a retuned accordion and a very large bass, made for weddings and microbuses.',
  drumBanks: [
    ['RolandTR808', 4],
    ['LinnDrum', 4],
    ['RolandTR626', 3],
    ['Linn9000', 2],
  ],
  /**
   * Programmed first, hands second, and the box last but present.
   *
   * The drum on a shaabi cassette is nearly always written in a bar at a time —
   * that is what `programmed` means and it is what an 808 in a two-room studio
   * was for. The hands do not go away, because the one place a real darbuka
   * survived this decade is the wedding the record was made to be played at, and
   * that gig had a player. The box is the smallest weight and is the honest
   * bottom of the market: the preset rhythm on the keyboard itself, which is
   * what the cheapest of these records used and is audible on all of them.
   */
  drumSources: [['programmed', 5], ['kit', 4], ['electronic-kit', 2], ['box', 1]],
  /** The bass line is a keyboard part on half these records, and it shows. */
  sequenced: { bass: 0.35, counter: 0.2 },
  palette: {
    melody: [
      ['accordion', 5], ['leadSquare', 4], ['synthStrings', 3], ['violin', 3],
      ['leadSaw', 2], ['dulcimer', 2], ['shanai', 2], ['leadCalliope', 2],
    ],
    counter: [
      ['leadSquare', 3], ['dulcimer', 3], ['accordion', 3], ['epiano1', 2],
      ['glockenspiel', 2], ['leadSaw', 2], ['violin', 2],
    ],
    comp: [
      ['rockOrgan', 4], ['drawbarOrgan', 3], ['epiano1', 3], ['accordion', 3],
      ['nylonGuitar', 2], ['cleanGuitar', 2],
    ],
    pad: [
      ['synthStrings', 5], ['synthStrings2', 3], ['strings2', 3],
      ['padWarm', 2], ['padPoly', 2],
    ],
    bass: [['synthBass', 5], ['fingerBass', 4], ['synthBass2', 2], ['pickBass', 2]],
    brass: [['synthBrass', 4], ['brassSection', 2], ['shanai', 2], ['trumpet', 2]],
  },
  styleWeights: {
    maqsum: 6, baladi: 6, saidi: 5,
    fallahi: 4, malfuf: 4, ayyub: 3,
    jurjina: 2, samai: 1, aqsaq: 2, dawrhindi: 2, bashraf: 1,
    wahda: 2, masmoudi: 3, chiftetelli: 3,
    zaffa: 4, dabke: 6, khaleeji: 5,
    longa: 2, muwashshah: 1, dulab: 2, taqsim: 2,
  },
  tempoScale: 1.04,
  keyChangeChance: 0,
  density: 0.66,
  // A small room and a spring reverb, and the delay is on the vocal and nothing
  // else. This is a two-room studio with a mixing desk somebody bought secondhand.
  space: { reverbSize: 0.5, delayBeats: 0.75, delayFeedback: 0.35 },
  effects: {
    melody: { reverb: 0.34, delay: 0.14, lowpass: 9500 },
    counter: { reverb: 0.38, delay: 0.18, lowpass: 9000 },
    comp: { reverb: 0.3, lowpass: 8500 },
    pad: { reverb: 0.48, lowpass: 7500 },
    bass: { reverb: 0.05, lowpass: 1800 },
    // The one era where the kit is bright: an 808 through a cheap desk has no
    // top end to lose and every record of it is mixed as though it did.
    drums: { reverb: 0.2, lowpass: 11000 },
    vocal: { reverb: 0.4, delay: 0.22, lowpass: 9000 },
  },
};

/**
 * SATELLITE — the studio pop era, 2000s onward.
 *
 * The fourth era, and the case for it is one specific thing rather than a
 * decade. Everything before this is a picture of an ensemble: a takht is six
 * people in a row, a firqa is forty, a shaabi record is three and a machine. By
 * about 2000 the Beirut and Cairo studios feeding the satellite channels were
 * making records where **the darbuka is a sample of a darbuka** — a loop of a
 * real player, chopped and laid under a programmed arrangement, with a live riq
 * overdubbed on top of it because the loop had no jingles. That is a new
 * arrangement of the same instruments rather than a new set of them, and it is
 * the first era in which the percussion is both played and not played at once.
 *
 * Musically it is a return: the strings come back after shaabi did without
 * them, the qanun comes back as a plug-in, and the harmony goes back to holding
 * still. What does not come back is the ensemble — nobody is in a room with
 * anybody. Hence `sequenced.bass` at its highest here and a `density` between
 * the firqa's and the shaabi's rather than above either.
 */
const satellite: EraProfile = {
  id: 'satellite',
  year: 2006,
  label: '2000s satellite pop',
  description:
    'The Beirut and Cairo studios: sampled strings, a programmed darbuka loop with a live riq over it, and a qanun that is a plug-in.',
  drumBanks: [
    ['RolandMC303+darbuka', 4],
    ['YamahaRY30+darbuka', 3],
    ['RolandR8+darbuka', 3],
    ['AkaiXR10+darbuka', 2],
  ],
  /**
   * Programmed first and hands still third rather than absent, which is the
   * era's whole picture: the loop is written in, the pads are played over it,
   * and somebody real is brought in for the riq. `box` is gone — a preset
   * rhythm is a 1988 economy and by now the cheap option is a library of loops,
   * which is `programmed` by any definition this project has.
   */
  drumSources: [['programmed', 6], ['electronic-kit', 3], ['kit', 3]],
  sequenced: { bass: 0.5, counter: 0.3 },
  palette: {
    melody: [
      ['violin', 4], ['strings2', 3], ['dulcimer', 3], ['leadSaw', 3],
      ['panFlute', 2], ['nylonGuitar', 2], ['shanai', 2], ['leadVoice', 2],
    ],
    counter: [
      ['dulcimer', 4], ['harp', 3], ['celesta', 2], ['violin', 2],
      ['glockenspiel', 2], ['leadSquare', 2], ['kalimba', 1],
    ],
    comp: [
      ['nylonGuitar', 3], ['dulcimer', 3], ['epiano2', 3], ['padPoly', 3],
      ['piano', 2], ['cleanGuitar', 2],
    ],
    pad: [
      ['strings2', 5], ['synthStrings2', 4], ['padWarm', 3],
      ['padNewAge', 2], ['choirAahs', 2],
    ],
    bass: [['synthBass2', 4], ['fingerBass', 3], ['synthBass', 3], ['contrabass', 2]],
    brass: [['synthBrass', 3], ['brassSection', 2], ['synthBrass2', 2], ['shanai', 2]],
  },
  styleWeights: {
    maqsum: 6, baladi: 4, saidi: 3,
    fallahi: 3, malfuf: 3, ayyub: 3,
    jurjina: 2, samai: 2, aqsaq: 2, dawrhindi: 2, bashraf: 2,
    wahda: 4, masmoudi: 3, chiftetelli: 4,
    zaffa: 3, dabke: 5, khaleeji: 5,
    longa: 2, muwashshah: 2, dulab: 2, taqsim: 3,
  },
  tempoScale: 1,
  keyChangeChance: 0,
  density: 0.68,
  // Big, clean and long. The room is a plug-in and it is used the way plug-in
  // rooms are: on everything, at length, with nothing in the way.
  space: { reverbSize: 0.82, delayBeats: 0.75, delayFeedback: 0.3 },
  effects: {
    melody: { reverb: 0.4, delay: 0.16, lowpass: 12000 },
    counter: { reverb: 0.48, delay: 0.2, lowpass: 11000 },
    comp: { reverb: 0.36, lowpass: 10500 },
    pad: { reverb: 0.62, lowpass: 9000 },
    bass: { reverb: 0.06, lowpass: 2000 },
    drums: { reverb: 0.24, lowpass: 12000 },
    vocal: { reverb: 0.44, delay: 0.18, lowpass: 10000 },
  },
};

export const ERAS: Record<string, EraProfile> = { takht, firqa, shaabi, satellite };
