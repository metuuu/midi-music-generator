/**
 * Four eras, 1938 to 1997, and each one is a different *room full of people*
 * rather than a different set of production tricks.
 *
 * The tempo curve that reads the reggae eras will not read these, because this
 * repertoire did not accelerate or slow down as a whole — a bolero was slow in
 * 1940 and slow in 1995. What changes instead is **the size of the band and
 * where it is standing**, and that is the axis these four are cut along:
 *
 *   conjunto  a septet in a Havana courtyard, acoustic, one microphone
 *   orquesta  eighteen people in a New York ballroom, reading parts
 *   salsa     a nine-piece in a cold recording studio with a Fender Rhodes
 *   moderno   a laptop, a horn section that came in for the afternoon, and a
 *             singer who is the act
 *
 * ## The two things an era table has to get right here
 *
 * **The trumpet-to-trombone ratio.** It is the single most legible production
 * fact in the whole genre and it is not a taste: a Cuban conjunto has two or
 * three trumpets and no trombone at all; a Palladium orchestra has four
 * trumpets, four trombones and five saxophones; a Fania band has two trombones
 * and one trumpet, played loud and low. Three eras, three completely different
 * `brass` palettes, and a listener can date a record off that one number.
 *
 * **What carries the tres and the cuatro**, because the catalogue has neither.
 * A **tres** is three courses of doubled steel strings played with a pick — no
 * sustain, enormous attack, and metallic. Of what exists, `steelGuitar` is the
 * nearest on both counts and `banjo` is the nearest on *envelope*, so the two
 * appear side by side in the acoustic eras with the banjo weighted lower: it is
 * wrong about the drum head and the fifth string, and right about the fact that
 * the note stops almost as soon as it starts. `nylonGuitar` is deliberately not
 * the substitute — it is the opposite of a tres in string material and in decay
 * — but it stays in every palette, because the *other* Cuban guitar, the one a
 * trova bolero is built on, genuinely is one.
 *
 * The **cuatro** is two instruments with one name. Venezuela's is a small
 * four-string nylon guitar, which is `nylonGuitar` and very nearly exact. Puerto
 * Rico's is five doubled steel courses played as a lead, which is `steelGuitar`
 * again. The **bajo sexto** and the **vihuela** are both steel and both take the
 * same entry; the **guitarrón** is `acousticBass`, which is what it is.
 *
 * ## The percussion is not on the drum machine
 *
 * `drumSources` says `kit` and nothing else in three of the four eras, and the
 * word is doing something slightly different here than it does in a genre with a
 * drummer in it: in this repertoire it means *hands*, three or four pairs of
 * them, and the bank tables below are chosen for what they carry in the way of
 * bells, scrapers and toms rather than for their kick.
 *
 * **`RolandTR727` is not named anywhere below, and it is the obvious mistake.**
 * It is the Latin percussion box — congas, bongos, agogôs, whistles — and it
 * looks like it was made for this folder. It carries `perc` and `sh` and nothing
 * else, so an era table naming it would resolve every kick, snare, hat and tom
 * to `undefined` and stage a song of woodblocks. `render/drum-banks.ts` says the
 * same thing at greater length and it is right: the box is a layer, and nothing
 * here can play two banks at once.
 */

import type { EraProfile } from '../../style/types.js';

/**
 * CONJUNTO — 1930s and 40s, Havana and the provinces.
 *
 * The septeto becoming the conjunto: tres, guitar, contrabass, bongó, maracas,
 * claves and one trumpet, then Arsenio Rodríguez adds a piano, a conga and two
 * more trumpets and the shape of every later band on the list is fixed. In
 * parallel and mostly unaware of each other: the charanga playing danzones with
 * a flute and two violins, the mariachi in Jalisco, the vallenato trio in
 * Valledupar, and a samba school in Rio.
 *
 * The palette is the only one here with no electric instrument in it and the
 * only one where `nylonGuitar` and `steelGuitar` are both near the top of the
 * comp table, because the tres and the guitar are two different chairs.
 *
 * `keyChangeChance` is the highest of the four, which looks backwards until you
 * remember what these bands were: reading musicians playing arranged music in
 * flat keys for dancers, with a written coda. The riddim logic that keeps a
 * later era in one key has not arrived yet — that is the montuno's doing, and
 * the montuno is only starting to eat the form in this decade.
 */
const conjunto: EraProfile = {
  id: 'conjunto',
  year: 1938,
  label: '1930–48 conjunto',
  description:
    'A septet in a courtyard: tres, one trumpet, bongó, maracas and claves — and next door a charanga with a flute, two violins and a pair of timbales.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['EmuSP12', 3],
    ['RolandCompurhythm1000', 3],
    ['SakataDPM48', 2],
    ['AlesisSR16', 2],
  ],
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['trumpet', 5], ['nylonGuitar', 4], ['flute', 3], ['steelGuitar', 3],
      ['violin', 3], ['clarinet', 2], ['mutedTrumpet', 2], ['piano', 2],
      ['accordion', 2], ['marimba', 1],
    ],
    counter: [
      ['trumpet', 4], ['nylonGuitar', 3], ['flute', 3], ['violin', 3],
      ['clarinet', 2], ['steelGuitar', 2], ['mutedTrumpet', 2], ['banjo', 1],
    ],
    /**
     * The tres at the head of the table, spelled `steelGuitar`, with the banjo
     * behind it. See the header: the argument is about attack and decay rather
     * than about the number of strings, and a nylon guitar has neither.
     */
    comp: [
      ['steelGuitar', 5], ['piano', 4], ['nylonGuitar', 4], ['banjo', 2],
      ['accordion', 2], ['jazzGuitar', 1],
    ],
    pad: [
      ['strings1', 3], ['reedOrgan', 2], ['accordion', 2], ['choirAahs', 1],
    ],
    bass: [['acousticBass', 8], ['tuba', 2]],
    brass: [
      ['trumpet', 6], ['mutedTrumpet', 3], ['clarinet', 2], ['trombone', 1],
      ['brassSection', 1],
    ],
  },
  styleWeights: {
    son: 9, guaracha: 7, guajira: 6, bolero: 7,
    danzon: 8, chachacha: 0, mambo: 2,
    guaguanco: 6, columbia: 5,
    salsadura: 0, songo: 0, timba: 0,
    merengue: 4, bachata: 0,
    cumbia: 3, vallenato: 4, joropo: 4, plena: 5, bomba: 4,
    samba: 5, partidoalto: 3, baiao: 2, frevo: 4,
    norteno: 4, ranchera: 5, banda: 3,
  },
  tempoScale: 1,
  keyChangeChance: 0.16,
  density: 0.6,
  /**
   * One microphone in a live room, and everything is a shade dark because the
   * top octave was never captured. The bass is the most obviously period thing
   * here: an upright played hard through a ribbon microphone has very little
   * above 1.5 kHz in it, and a modern-sounding bass on a 1938 son is the fastest
   * way to make the whole thing read as a pastiche.
   */
  effects: {
    drums: { reverb: 0.18, lowpass: 6000 },
    bass: { reverb: 0.06, lowpass: 1500 },
    comp: { reverb: 0.22, lowpass: 6500 },
    brass: { reverb: 0.24, lowpass: 6800 },
    melody: { reverb: 0.24, lowpass: 7000 },
    pad: { reverb: 0.32, lowpass: 4800 },
    vocal: { reverb: 0.24, lowpass: 6200 },
  },
  space: { reverbSize: 0.4, delayBeats: 0.75, delayFeedback: 0.15 },
};

/**
 * ORQUESTA — 1949 to 1960, the Palladium and the mambo craze.
 *
 * The largest band this project can produce, and the reason the room in
 * `staging.ts` is as wide as it is. Machito, Tito Puente and Tito Rodríguez are
 * playing opposite each other on the same bill on 53rd Street, the arrangers
 * have written for Basie and Kenton, and the rhythm section is Cuban and
 * non-negotiable. In Havana the charanga answers with the cha-cha-chá, which is
 * the same decade's other enormous export and is a flute band rather than a
 * brass one.
 *
 * The `brass` palette is the widest here and it is the era's signature: four
 * trumpets, four trombones, five saxophones including a baritone that is
 * genuinely audible. `baritoneSax` appears in no other era's table for that
 * reason — it is a big-band chair, and the nine-piece that replaces this band
 * in 1970 does not have one.
 *
 * `density` is the highest of the four and `keyChangeChance` is already falling,
 * because the montuno has arrived and a vamp does not modulate.
 */
const orquesta: EraProfile = {
  id: 'orquesta',
  year: 1953,
  label: '1949–60 orquesta',
  description:
    'Eighteen people on 53rd Street: four trumpets, four trombones, five saxes and a Cuban rhythm section nobody was allowed to simplify — and a charanga in Havana answering with a flute.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['EmuSP12', 3],
    ['RolandCompurhythm1000', 3],
    ['AlesisSR16', 3],
    ['SakataDPM48', 2],
    ['AkaiXR10', 2],
  ],
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['trumpet', 5], ['flute', 4], ['tenorSax', 3], ['altoSax', 3],
      ['violin', 3], ['piano', 3], ['trombone', 2], ['vibraphone', 2],
      ['mutedTrumpet', 2], ['nylonGuitar', 1],
    ],
    counter: [
      ['trumpet', 4], ['trombone', 3], ['flute', 3], ['altoSax', 3],
      ['violin', 3], ['tenorSax', 2], ['vibraphone', 2], ['mutedTrumpet', 2],
    ],
    comp: [
      ['piano', 6], ['steelGuitar', 3], ['nylonGuitar', 2], ['jazzGuitar', 2],
      ['vibraphone', 2], ['accordion', 1],
    ],
    pad: [
      ['strings1', 4], ['brassSection', 3], ['strings2', 2], ['choirAahs', 1],
    ],
    bass: [['acousticBass', 7], ['fingerBass', 2], ['tuba', 1]],
    brass: [
      ['brassSection', 5], ['trumpet', 5], ['trombone', 4], ['tenorSax', 3],
      ['altoSax', 3], ['baritoneSax', 2], ['mutedTrumpet', 1],
    ],
  },
  styleWeights: {
    son: 6, guaracha: 8, guajira: 4, bolero: 8,
    danzon: 5, chachacha: 9, mambo: 9,
    guaguanco: 5, columbia: 3,
    salsadura: 1, songo: 0, timba: 0,
    merengue: 6, bachata: 1,
    cumbia: 5, vallenato: 4, joropo: 3, plena: 5, bomba: 3,
    samba: 6, partidoalto: 3, baiao: 5, frevo: 5,
    norteno: 5, ranchera: 7, banda: 4,
  },
  tempoScale: 1.02,
  keyChangeChance: 0.1,
  density: 0.78,
  effects: {
    drums: { reverb: 0.24, lowpass: 8000 },
    bass: { reverb: 0.06, lowpass: 2000 },
    comp: { reverb: 0.26, lowpass: 8000 },
    brass: { reverb: 0.3, lowpass: 9000 },
    melody: { reverb: 0.3, lowpass: 9000 },
    pad: { reverb: 0.4, lowpass: 6000 },
    vocal: { reverb: 0.3, lowpass: 7500 },
  },
  space: { reverbSize: 0.58, delayBeats: 0.75, delayFeedback: 0.18 },
};

/**
 * SALSA — 1968 to 1985, and the band gets smaller and louder at the same time.
 *
 * New York, and a nine-piece: two trombones, one trumpet, piano, electric bass,
 * congas, bongó-and-bell, timbales and a singer. Everything about it is a
 * reduction of the era above and none of it sounds smaller, because the
 * trombones are playing in a register the trumpets left empty and everybody is
 * recording into a desk rather than into a room.
 *
 * The electric instruments arrive here and they arrive specifically: a **Fender
 * Rhodes** and a **clavinet** in the comp table beside the acoustic piano, and
 * an electric bass — `fingerBass` at seven against the upright's two, which is
 * the same inversion the reggae genre records in its rocksteady era and happens
 * in this repertoire about five years later.
 *
 * Elsewhere in the same fifteen years: cumbia becomes the most popular music in
 * Latin America, vallenato gets amplified, and Brazil's samba goes into a studio
 * and comes out with strings on it.
 */
const salsa: EraProfile = {
  id: 'salsa',
  year: 1975,
  label: '1968–85 salsa',
  description:
    'The Fania nine-piece: two trombones and one trumpet, a Rhodes, an electric bass, and a rhythm section recorded into a desk instead of a room.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['RolandR8', 3],
    ['EmuSP12', 3],
    ['AlesisSR16', 3],
    ['BossDR550', 2],
    ['LinnDrum', 2],
  ],
  /**
   * Still hands, and by 1975 that is a choice. The preset box existed and was
   * cheap; a Fania session had four percussionists on it instead, and the whole
   * sound of the decade is the interlock between them. A box on this bandstand
   * would be staging the wrong object.
   */
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['trombone', 5], ['trumpet', 4], ['epiano1', 3], ['flute', 3],
      ['piano', 3], ['tenorSax', 2], ['cleanGuitar', 2], ['vibraphone', 2],
      ['violin', 2], ['nylonGuitar', 2],
    ],
    counter: [
      ['trombone', 5], ['trumpet', 3], ['flute', 3], ['epiano1', 2],
      ['cleanGuitar', 2], ['tenorSax', 2], ['agogo', 1], ['woodblock', 1],
    ],
    comp: [
      ['piano', 6], ['epiano1', 4], ['clavinet', 2], ['cleanGuitar', 2],
      ['steelGuitar', 2], ['nylonGuitar', 2], ['drawbarOrgan', 2],
      ['accordion', 1],
    ],
    pad: [
      ['strings1', 4], ['drawbarOrgan', 3], ['synthStrings', 2], ['brassSection', 2],
    ],
    bass: [['fingerBass', 7], ['acousticBass', 2], ['pickBass', 2], ['tuba', 1]],
    /**
     * Two trombones and one trumpet, and the weights say so. `trombone` at six
     * against `trumpet` at four inverts the era above, which had no trombone in
     * its conjunto palette at all — and that inversion is the fastest way to
     * date a record in this repertoire.
     */
    brass: [
      ['trombone', 6], ['trumpet', 4], ['brassSection', 3], ['tenorSax', 2],
      ['mutedTrumpet', 1],
    ],
  },
  styleWeights: {
    son: 4, guaracha: 5, guajira: 3, bolero: 5,
    danzon: 1, chachacha: 4, mambo: 4,
    guaguanco: 5, columbia: 3,
    salsadura: 9, songo: 7, timba: 1,
    merengue: 7, bachata: 4,
    cumbia: 8, vallenato: 7, joropo: 4, plena: 5, bomba: 4,
    samba: 6, partidoalto: 6, baiao: 4, frevo: 4,
    norteno: 6, ranchera: 6, banda: 5,
  },
  tempoScale: 1,
  keyChangeChance: 0.05,
  density: 0.72,
  effects: {
    drums: { reverb: 0.22, lowpass: 10000 },
    bass: { reverb: 0.04, lowpass: 2400 },
    comp: { reverb: 0.26, delay: 0.1, lowpass: 9000 },
    brass: { reverb: 0.32, lowpass: 10000 },
    melody: { reverb: 0.34, delay: 0.12, lowpass: 10000 },
    pad: { reverb: 0.44, lowpass: 6500 },
    counter: { reverb: 0.34, delay: 0.12, lowpass: 9500 },
    vocal: { reverb: 0.34, delay: 0.14, lowpass: 8000 },
  },
  space: { reverbSize: 0.52, delayBeats: 0.75, delayFeedback: 0.25 },
};

/**
 * MODERNO — 1988 onward: timba, salsa romántica, Latin pop and a sequencer.
 *
 * Two things happen at once and they pull in opposite directions, which is why
 * this is one era rather than two. In Havana the musicians get *more* virtuosic
 * — timba is conservatory-trained players making a Cuban band as dense as a funk
 * band — and in Miami and San Juan the arrangements get thinner, sweeter and
 * more programmed, because the product is now the singer. Bachata gets an
 * electric guitar and stops being disreputable; norteño gets a synthesiser and
 * becomes the largest-selling music in Mexico.
 *
 * So the palette holds both: a real horn section next to `synthBrass`, a real
 * piano next to a stack of Rhodes and DX presets, and `sequenced.bass` at a
 * small but non-zero number — small, because a timba bassist is playing a
 * written line that no sequencer could have suggested, and non-zero because half
 * the salsa romántica records of 1993 have a programmed one.
 *
 * `drumSources` is the only table here with a machine in it. `density` comes
 * down slightly from the salsa era, which is not a claim that timba is sparse —
 * it is the average of two decades in which one half of the music got denser
 * and the other half emptied out.
 */
const moderno: EraProfile = {
  id: 'moderno',
  year: 1997,
  label: '1988– moderno',
  description:
    'Timba and salsa romántica at once: five horns and a laptop, a written funk bass or a programmed one, and a singer who is now the whole act.',
  drumBanks: [
    ['RolandR8', 4],
    ['YamahaRY30', 3],
    ['AkaiXR10', 3],
    ['AlesisHR16', 2],
    ['LinnLM2', 2],
    ['RolandMC303', 2],
    ['KorgM1', 2],
    ['BossDR550', 2],
  ],
  drumSources: [['kit', 5], ['programmed', 3], ['electronic-kit', 2], ['box', 1]],
  sequenced: { bass: 0.16 },
  palette: {
    melody: [
      ['trumpet', 4], ['trombone', 4], ['piano', 3], ['epiano1', 3],
      ['synthBrass', 3], ['flute', 2], ['cleanGuitar', 2], ['nylonGuitar', 2],
      ['tenorSax', 2], ['steelDrums', 1], ['leadSquare', 1],
    ],
    counter: [
      ['trombone', 4], ['trumpet', 3], ['synthBrass', 3], ['epiano1', 2],
      ['cleanGuitar', 2], ['flute', 2], ['agogo', 1], ['balafon', 1],
      ['steelDrums', 1],
    ],
    comp: [
      ['piano', 6], ['epiano1', 4], ['epiano2', 3], ['cleanGuitar', 3],
      ['nylonGuitar', 3], ['clavinet', 2], ['steelGuitar', 2], ['accordion', 2],
      ['drawbarOrgan', 1],
    ],
    pad: [
      ['synthStrings', 4], ['strings1', 3], ['padWarm', 2], ['synthStrings2', 2],
    ],
    bass: [['fingerBass', 6], ['synthBass', 3], ['pickBass', 2], ['acousticBass', 1], ['tuba', 1]],
    brass: [
      ['brassSection', 4], ['trombone', 4], ['trumpet', 4], ['synthBrass', 3],
      ['tenorSax', 2], ['synthBrass2', 2],
    ],
  },
  styleWeights: {
    son: 3, guaracha: 3, guajira: 2, bolero: 4,
    danzon: 1, chachacha: 2, mambo: 2,
    guaguanco: 3, columbia: 2,
    salsadura: 6, songo: 5, timba: 9,
    merengue: 7, bachata: 9,
    cumbia: 8, vallenato: 6, joropo: 3, plena: 4, bomba: 3,
    samba: 5, partidoalto: 5, baiao: 3, frevo: 3,
    norteno: 7, ranchera: 5, banda: 8,
  },
  tempoScale: 1.02,
  keyChangeChance: 0.06,
  density: 0.68,
  /**
   * Bright, close and dry, and the bass comes up. A digital desk and a
   * multitrack take the room out entirely; what reverb there is was put on the
   * voice on purpose. The one thing that did not change is that the low end is
   * still the floor of the record, which is why `bass` keeps a low-pass at all —
   * a modern Latin bass is bright by 1970s standards and still nothing like a
   * rock one.
   */
  effects: {
    drums: { reverb: 0.14, lowpass: 12000 },
    bass: { reverb: 0.02, lowpass: 3000 },
    comp: { reverb: 0.16, delay: 0.08, lowpass: 11000 },
    brass: { reverb: 0.2, lowpass: 11000 },
    melody: { reverb: 0.22, delay: 0.12, lowpass: 12000 },
    pad: { reverb: 0.34, lowpass: 8000 },
    counter: { reverb: 0.22, delay: 0.12, lowpass: 11000 },
    vocal: { reverb: 0.3, delay: 0.18, lowpass: 9000 },
  },
  space: { reverbSize: 0.42, delayBeats: 0.75, delayFeedback: 0.2 },
};

export const ERAS: Record<string, EraProfile> = { conjunto, orquesta, salsa, moderno };
