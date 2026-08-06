/**
 * Four layers of Finnish folk music, and they are not four decades of one thing.
 *
 * Every other era table in this project covers a lifetime or two: iskelmä's two
 * are 1968 and 1985, reggae's four span twenty-two years, and what separates
 * them is a drum machine and a haircut. This one spans about two hundred and
 * thirty years and the boundaries are not production changes — they are the
 * arrival of an *instrument* and, twice, the arrival of an audience.
 *
 *   runo          before the fiddle. A voice and a kantele, and nobody watching
 *                 who is not also singing.
 *   pelimanni     the violin arrives from Sweden with a repertoire of dances
 *                 attached to it, and so does functional harmony.
 *   revival       1968: the dance stops and the concert starts. The same tunes,
 *                 ten players, and people sitting in rows.
 *   contemporary  amplification, a drummer, and a conservatoire department.
 *
 * ## The years are earlier than anything else here, and two gates care
 *
 * `DRUM_SOURCE_FROM` puts the preset box at 1964 and the programmed machine at
 * 1978, and `SEQUENCER_FROM` gates the sequenced layers later still. Two of the
 * eras below are centuries in front of all of it, which means their tables could
 * name a Mini Pops and get a drummer anyway — so they do not name one, because a
 * weight for something the gate will refuse looks like an opinion about a
 * question that was never open. Only `contemporary` says anything at all here.
 *
 * ## What a drum bank means in a genre with almost no drums
 *
 * Fourteen of the twenty-four styles exclude the kit outright — this said
 * sixteen, and `styles.ts` records where that number had spread to. The banks named
 * below are therefore doing one narrow job: standing in for a **frame drum**,
 * which is `lp`/`mp`/`hp` — the three strokes of one drum played with two hands,
 * argued at length on `DrumVoice`. No sample bank in `BANK_VOICES` has those
 * three sounds, so `resolveVoice` substitutes, and the substitution is only
 * honest on a bank with *toms and a rim and a spare percussion sample*: the low
 * stroke goes to the floor tom, the mid to the percussion, the high to the
 * cross-stick, and the three strokes stay three sounds. On a thin bank two of
 * them collapse onto the same sample and the pattern stops being a rhythm.
 *
 * So every bank named in the first three eras has been checked for that, and it
 * is why `AlesisSR16` — which several other genres reach for happily — appears
 * nowhere here: it has a rim and a percussion sample and **no toms at all**, so
 * the low and mid strokes would both land on `perc` and a frame-drum part would
 * come out as one click repeated.
 *
 * ## The brass palettes are vestigial, and are here to be total
 *
 * `EraProfile.palette` is a complete record and every era has to fill all six
 * slots, so each table below names two or three brass instruments — and not one
 * of them will ever sound, because **every style in `styles.ts` excludes the
 * `brass` layer**. Ambient says the same thing about its own for the same
 * reason. The entries chosen are at least the right ones: a French horn and a
 * trombone are what a village *torviseitsikko* was built around, which is the
 * ensemble this genre is deliberately not about.
 */

import type { EraProfile } from '../../style/types.js';

/**
 * RUNO — before the fiddle.
 *
 * Dated 1780 for the sake of a number that has to exist, and the honest thing to
 * say about it is that the date is nearly meaningless: this material was
 * collected in the 1830s from singers who had it from singers, and it is older
 * than any date anybody could put on it. What 1780 buys is a year that is
 * unambiguously *before* the pelimanni era, which is the only comparison the
 * `year` field is ever asked to make.
 *
 * The palette is four objects. The kantele leads every layer it can appear in
 * because it is the only chordal instrument in the era, and the wind entries are
 * substitutions that should be read as substitutions: there is no birch-bark
 * horn in the catalogue and a `recorder` is the nearest thing to the wooden
 * flutes and whistles that were genuinely there. `bagpipes` is the säkkipilli,
 * which is real, was played in Finland into the eighteenth century, and died out
 * exactly at the point this era ends — so it is here at a small weight and is
 * absent from every era after it, which is the shape of the historical fact.
 *
 * `strings1` in the pad slot is the one entry in this table that is not an
 * object anybody owned. It is there because `pad` is drawn for the styles that
 * do not exclude it and a genre that left the slot empty would get whatever the
 * fallback is; a distant string bed under a drone is at least the *sound* of a
 * room full of ringing strings, which is what a kantele in a wooden house is.
 *
 * It used to share the slot with `choirAahs` and `padWarm`, and a warm synth
 * pad in 1780 is not a substitution anybody would defend — it is a line nobody
 * re-read after the era was written. The stage is where it showed: both are
 * staged as a keyboard by `concert/instruments.ts`, so a third of the runo
 * numbers that drew a pad put a player behind a synthesiser a hundred and
 * eighty years early, and `rigPoolFor` had no honest rig to hand them. The slot
 * is all strings now, which is what the paragraph above already said it was
 * for.
 */
const runo: EraProfile = {
  id: 'runo',
  year: 1780,
  label: 'Runo (the archaic layer)',
  description:
    'Before the violin: a voice, a five-string kantele left ringing, a wooden whistle, and the last of the Finnish bagpipes.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['EmuSP12', 3],
    ['SakataDPM48', 2],
  ],
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['kantele', 5], ['recorder', 3], ['flute', 2], ['clarinet', 2],
      ['bagpipes', 1], ['panFlute', 1],
    ],
    counter: [
      ['kantele', 4], ['recorder', 3], ['flute', 2], ['panFlute', 1],
    ],
    comp: [
      ['kantele', 7], ['harp', 2], ['nylonGuitar', 1],
    ],
    pad: [
      ['strings1', 3], ['strings2', 2], ['tremoloStrings', 1],
    ],
    bass: [['contrabass', 3], ['acousticBass', 3], ['cello', 2]],
    brass: [['frenchHorn', 2], ['trombone', 1]],
  },
  styleWeights: {
    runolaulu: 9, itkuvirsi: 6, soitto: 8, karjanhuuto: 5, virsi: 5, piirileikki: 6,
    polska: 1, menuetti: 0, polkka: 0, sottiisi: 0, masurkka: 0, katrilli: 0,
    haavalssi: 0, purpuri: 0, marssi: 0, rekilaulu: 2, hambo: 0,
    soittokunta: 0, hidasvalssi: 0, konserttikantele: 0, tanhu: 0,
    poljento: 0, sahkopelimanni: 0, karjalanlaulu: 0,
  },
  tempoScale: 1,
  /**
   * Zero, and it is the only zero in the project.
   *
   * A key change is a composed gesture: somebody decided the last chorus should
   * be a tone higher and wrote it down. There is no last chorus here and there
   * is nobody to write anything down — a runo singer sings in the key their
   * voice is in and stays there for four thousand lines. `preparedModulation` is
   * false genre-wide for a related reason, argued in `index.ts`; this is the
   * stronger version of it for the one era where even an unprepared lift would
   * be an anachronism.
   */
  keyChangeChance: 0,
  density: 0.34,
  /**
   * A wooden room and nothing else. No delay — every echo in this project is a
   * machine, and the only one in a log house is the house.
   */
  space: { reverbSize: 0.46, delayBeats: 0, delayFeedback: 0 },
  effects: {
    melody: { reverb: 0.34, lowpass: 8000 },
    counter: { reverb: 0.4, lowpass: 7500 },
    comp: { reverb: 0.4, lowpass: 8000 },
    pad: { reverb: 0.55, lowpass: 4500 },
    bass: { reverb: 0.12, lowpass: 2200 },
    drums: { reverb: 0.2, lowpass: 6000 },
    vocal: { reverb: 0.36, lowpass: 7000 },
  },
};

/**
 * PELIMANNI — the violin arrives, and brings the whole of Europe with it.
 *
 * A *pelimanni* is a village fiddler, and the word is a Finnicisation of the
 * Swedish *spelman*, which is most of the story: the instrument, the repertoire
 * and the harmony all came across the Gulf of Bothnia within a couple of
 * generations. By 1860 a wedding has a first fiddle, a second fiddle, a
 * clarinet, a bass, and a repertoire of Central European dances that would have
 * been unrecognisable to anybody in the era above.
 *
 * **`fiddle` and not `violin`, and they are both in the table.** GM 110 and GM
 * 40 are genuinely different patches — the first is flatter, reedier and more
 * nasal, which is what an instrument played with the bow close to the bridge and
 * no vibrato sounds like — and the pelimanni style is the reason the catalogue
 * distinguishes them. `violin` is here at a third of the weight because some of
 * these players had lessons.
 *
 * The accordion arrives late in this window and is weighted accordingly. It went
 * on to eat the tradition — by 1920 the fiddle had lost the wedding to the box —
 * and a table that gave it the weight it eventually had would be describing the
 * era after this one.
 */
const pelimanni: EraProfile = {
  id: 'pelimanni',
  year: 1860,
  label: 'Pelimanni (the village fiddler)',
  description:
    'The violin from across the Gulf of Bothnia with a repertoire of dances attached: two fiddles, a clarinet, a bass, and tonic-and-dominant harmony arriving for the first time.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['EmuSP12', 3],
    ['RolandR8', 2],
    ['SakataDPM48', 2],
  ],
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['fiddle', 7], ['clarinet', 4], ['violin', 3], ['accordion', 2],
      ['harmonica', 2], ['kantele', 2], ['recorder', 1], ['flute', 1],
    ],
    counter: [
      ['fiddle', 6], ['clarinet', 4], ['violin', 3], ['viola', 2],
      ['accordion', 2], ['harmonica', 1],
    ],
    /**
     * `dulcimer` is the one borrowed entry in this table and it should be read
     * as a Karelian one rather than an Appalachian one. The hammered dulcimer is
     * a single design at four sizes — the santur, the santouri, the cimbalom and
     * the Appalachian instrument — and the eastern end of it reached Karelia
     * with everything else that did. `strumstick` is deliberately *not* here
     * despite being new in the catalogue: it is a mountain dulcimer built as a
     * stick, which is a twentieth-century American object, and the Finnish
     * instrument that occupies the same place in the room is the kantele, which
     * heads this table already.
     */
    comp: [
      ['nylonGuitar', 4], ['reedOrgan', 4], ['accordion', 3], ['kantele', 3],
      ['dulcimer', 2], ['harp', 1],
    ],
    pad: [
      ['reedOrgan', 4], ['strings1', 3], ['strings2', 2], ['pipeOrganQuiet', 1],
    ],
    bass: [['contrabass', 5], ['acousticBass', 4], ['cello', 2]],
    brass: [['frenchHorn', 3], ['trombone', 2], ['trumpet', 1]],
  },
  styleWeights: {
    runolaulu: 2, itkuvirsi: 2, soitto: 3, karjanhuuto: 2, virsi: 5, piirileikki: 5,
    polska: 9, menuetti: 6, polkka: 8, sottiisi: 7, masurkka: 6, katrilli: 6,
    haavalssi: 7, purpuri: 5, marssi: 6, rekilaulu: 6, hambo: 4,
    soittokunta: 1, hidasvalssi: 0, konserttikantele: 0, tanhu: 0,
    poljento: 0, sahkopelimanni: 0, karjalanlaulu: 0,
  },
  tempoScale: 1,
  /**
   * Small, and it is a fiddler's number rather than an arranger's.
   *
   * The one place a key genuinely changes in this repertoire is a two-strain
   * tune whose second strain is in the relative major, and that is not a
   * modulation — it is a chord table, and `relativeMajorChorus` on the styles is
   * where it lives. What is left for this field is the rare tune that really
   * does go up a tone for the last time round, which happens, and does not
   * happen often.
   */
  keyChangeChance: 0.08,
  density: 0.55,
  space: { reverbSize: 0.42, delayBeats: 0, delayFeedback: 0 },
  effects: {
    melody: { reverb: 0.28, lowpass: 9000 },
    counter: { reverb: 0.32, lowpass: 8500 },
    comp: { reverb: 0.3, lowpass: 8000 },
    pad: { reverb: 0.45, lowpass: 5000 },
    bass: { reverb: 0.1, lowpass: 2400 },
    drums: { reverb: 0.22, lowpass: 6500 },
    vocal: { reverb: 0.3, lowpass: 7500 },
  },
};

/**
 * REVIVAL — 1968, and the year the audience sat down.
 *
 * The Kaustinen festival started in 1968 in a village of four thousand people
 * and within a decade the whole tradition had been reorganised around it. What
 * changed was not the tunes: it was that a fiddler who had played for a floor
 * now played for a hall, in a group of ten, from an arrangement, wearing a
 * costume. Konsta Jylhä's ensemble is the sound this era is a description of —
 * fiddles in thirds and sixths, a harmonium underneath, a double bass, and a
 * repertoire that is half traditional dances and half new slow waltzes written
 * to be listened to.
 *
 * `density: 0.72` is the highest here by some distance and it is the arithmetic
 * of the change: the pelimanni era's band is four people and this one's is ten,
 * and every one of them is playing all the time because that is what an
 * arrangement for ten people is for.
 *
 * `strings1` and `strings2` climb the pad table for a reason worth naming
 * exactly. There is no string section in this music. What there is is *nine
 * fiddles playing the same line*, which is the same object arrived at from the
 * other end, and it is the only place in the project where a synthesised string
 * ensemble is standing in for something acoustic rather than the reverse.
 */
const revival: EraProfile = {
  id: 'revival',
  year: 1975,
  label: 'Revival (Kaustinen)',
  description:
    'The dance stops and the concert starts: ten players, fiddles in thirds over a harmonium, national costume, and a hall full of people sitting down.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['RolandR8', 3],
    ['EmuSP12', 2],
    ['SakataDPM48', 2],
  ],
  /**
   * Still hands, and by 1975 that is a choice rather than a limitation — the
   * Rhythm Ace and the Mini Pops were both on sale in Finland and iskelmä's own
   * era table two folders away is full of them. A folk ensemble did not buy one,
   * and the reason is the same reason the audience is sitting down: the whole
   * proposition of this era is that these are the old tunes played properly.
   */
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['fiddle', 7], ['violin', 4], ['kantele', 3], ['clarinet', 3],
      ['accordion', 3], ['harmonica', 1], ['flute', 1],
    ],
    counter: [
      ['fiddle', 6], ['violin', 4], ['viola', 3], ['clarinet', 2],
      ['accordion', 2], ['kantele', 2], ['cello', 1],
    ],
    comp: [
      ['reedOrgan', 5], ['nylonGuitar', 4], ['accordion', 3], ['kantele', 3],
      ['piano', 2], ['dulcimer', 1],
    ],
    pad: [
      ['strings1', 5], ['strings2', 3], ['reedOrgan', 3], ['tremoloStrings', 2],
    ],
    bass: [['contrabass', 6], ['acousticBass', 3], ['cello', 2], ['fingerBass', 1]],
    brass: [['frenchHorn', 3], ['trombone', 2], ['brassSection', 2]],
  },
  styleWeights: {
    runolaulu: 3, itkuvirsi: 2, soitto: 4, karjanhuuto: 2, virsi: 3, piirileikki: 3,
    polska: 6, menuetti: 4, polkka: 6, sottiisi: 5, masurkka: 4, katrilli: 4,
    haavalssi: 5, purpuri: 5, marssi: 5, rekilaulu: 4, hambo: 4,
    soittokunta: 9, hidasvalssi: 8, konserttikantele: 6, tanhu: 6,
    poljento: 0, sahkopelimanni: 1, karjalanlaulu: 1,
  },
  tempoScale: 0.97,
  keyChangeChance: 0.12,
  density: 0.72,
  space: { reverbSize: 0.6, delayBeats: 0, delayFeedback: 0 },
  effects: {
    melody: { reverb: 0.4, lowpass: 9500 },
    counter: { reverb: 0.45, lowpass: 9000 },
    comp: { reverb: 0.4, lowpass: 8000 },
    pad: { reverb: 0.55, lowpass: 5500 },
    bass: { reverb: 0.14, lowpass: 2600 },
    drums: { reverb: 0.28, lowpass: 7000 },
    vocal: { reverb: 0.4, lowpass: 7500 },
  },
};

/**
 * CONTEMPORARY — the folk department, and the first drummer in two hundred
 * years.
 *
 * The Sibelius Academy opened a folk-music department in 1983 and its graduates
 * did the thing conservatoire graduates do: they took a repertoire that had been
 * transmitted by ear and started composing for it. What comes out is amplified,
 * has a rhythm section, is frequently in seven, and would be unrecognisable to
 * Konsta Jylhä — and every player in it can also play a Kaustinen polska
 * correctly, which is the argument the department has always made for itself.
 *
 * This is the only era with anything to say about `drumSources`, and it says
 * very little: a kit, overwhelmingly, with a programmed machine at a small
 * weight because the electronic end of this scene is real and is not most of it.
 * There is no `box` at any weight — a preset rhythm cannot play a bar of seven,
 * which is the one thing this era is for.
 *
 * `electricViolin` heads the melody palette and it is not a fashion. A fiddle in
 * a band with a drummer and a bass amp is inaudible acoustically; the pickup is
 * what makes the ensemble possible at all, and it changes the tone enough that
 * pretending it is the same instrument would be wrong about the sound.
 */
const contemporary: EraProfile = {
  id: 'contemporary',
  year: 2005,
  label: 'Contemporary (the folk department)',
  description:
    'Amplified, composed and frequently in seven: an electric fiddle, a bass amp, a drummer, and players who can still count a polska.',
  drumBanks: [
    ['RolandR8', 4],
    ['YamahaRY30', 3],
    ['AkaiMPC60', 3],
    ['BossDR550', 2],
    ['RolandTR626', 2],
  ],
  /**
   * A kit, and a programmed machine at the edge of it. No `box` at any weight:
   * a preset rhythm has one button per pattern and none of the patterns is in
   * seven, so it is not a small probability here, it is an impossibility.
   */
  drumSources: [['kit', 8], ['programmed', 2]],
  palette: {
    melody: [
      ['electricViolin', 5], ['fiddle', 5], ['kantele', 3], ['clarinet', 3],
      ['accordion', 3], ['violin', 2], ['flute', 2], ['sopranoSax', 1],
    ],
    counter: [
      ['fiddle', 5], ['electricViolin', 4], ['viola', 3], ['clarinet', 3],
      ['accordion', 2], ['kantele', 2], ['electricCello', 1],
    ],
    comp: [
      ['nylonGuitar', 4], ['cleanGuitar', 3], ['reedOrgan', 3], ['accordion', 3],
      ['kantele', 3], ['piano', 2], ['overdriveGuitar', 2], ['dulcimer', 1],
    ],
    pad: [
      ['strings2', 4], ['padWarm', 3], ['strings1', 3], ['synthStrings', 2],
    ],
    bass: [['contrabass', 5], ['fingerBass', 4], ['fretlessBass', 2], ['acousticBass', 2]],
    brass: [['trombone', 3], ['frenchHorn', 2], ['brassSection', 2], ['baritoneSax', 1]],
  },
  styleWeights: {
    runolaulu: 3, itkuvirsi: 3, soitto: 3, karjanhuuto: 2, virsi: 2, piirileikki: 2,
    polska: 6, menuetti: 3, polkka: 4, sottiisi: 3, masurkka: 3, katrilli: 2,
    haavalssi: 3, purpuri: 2, marssi: 2, rekilaulu: 3, hambo: 2,
    soittokunta: 4, hidasvalssi: 4, konserttikantele: 5, tanhu: 3,
    poljento: 9, sahkopelimanni: 8, karjalanlaulu: 8,
  },
  tempoScale: 1.03,
  keyChangeChance: 0.06,
  density: 0.7,
  space: { reverbSize: 0.55, delayBeats: 0.75, delayFeedback: 0.2 },
  effects: {
    melody: { reverb: 0.32, delay: 0.14, lowpass: 11000 },
    counter: { reverb: 0.36, delay: 0.16, lowpass: 10000 },
    comp: { reverb: 0.28, lowpass: 9000 },
    pad: { reverb: 0.5, lowpass: 6500 },
    bass: { reverb: 0.06, lowpass: 3200 },
    drums: { reverb: 0.2, lowpass: 9000 },
    vocal: { reverb: 0.34, delay: 0.14, lowpass: 8000 },
  },
};

export const ERAS: Record<string, EraProfile> = { runo, pelimanni, revival, contemporary };
