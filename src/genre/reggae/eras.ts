/**
 * Four Jamaican eras, 1963 to 1985, and each one is a different rhythm section
 * rather than a different set of clothes on the same one.
 *
 * The tempo curve is the shape to read them by, because nothing else in this
 * project has one. Ska runs at 150; rocksteady drops to 80 in about eighteen
 * months and the bass becomes the tune in the space that makes; roots sits there
 * for a decade; and then the machines arrive and it climbs again. Two of those
 * four boundaries are *events* — a specific year, a specific studio — and the era
 * tables are where that gets said, because a style table cannot say "and then
 * everybody stopped doing it".
 *
 * ## The cross-stick rule, and the one era that breaks it
 *
 * `rim` is the backbeat of this music from 1966 onward: the stick laid flat
 * across the head and struck on the shaft, a short woody knock with no rattle
 * behind it. It is not a quiet snare and a genre that substitutes one has
 * recorded a different decade — see `styles.ts`, where every one-drop pattern in
 * the catalogue is written on it.
 *
 * So **every bank named by `ska`, `rocksteady` and `roots` below carries a
 * cross-stick of its own**, checked against `BANK_VOICES` rather than assumed.
 * `resolveVoice` would happily fall a rim back onto a snare and nothing would
 * report it, which is precisely the failure this rule exists to prevent: the
 * music would still play and would simply be wrong about its own backbeat.
 *
 * `digital` deliberately does not hold to it, and the exception is the point.
 * `CasioSK1` stands in for the Casiotone MT-40 that made "Under Mi Sleng Teng" in
 * February 1985, and it has six sounds in it: kick, snare, two hats and two toms.
 * There is no cross-stick because there was no cross-stick, and putting one back
 * would be correcting the most consequential record in the genre. The absence is
 * what 1985 sounds like.
 *
 * ## Why the early banks are drum machines standing in for a drummer
 *
 * The same argument jazz's 1938 era makes, and it applies here for two decades
 * rather than one: `AkaiMPC60`, `AlesisSR16` and `EmuSP12` are sample libraries of
 * acoustic kits, and `DrumSource` is the field that says what is actually in the
 * room. Three of the four eras below name `kit` and nothing else, because there
 * was a drummer at Studio One, at Treasure Isle and at Channel One, and there was
 * never once a rhythm box on any of those sessions. The box arrives in 1985 and it
 * arrives as the whole industry rather than as an option.
 */

import type { EraProfile } from '../../style/types.js';

/**
 * SKA — 1962–66.
 *
 * A big band: four horns, a piano, a guitar, an upright bass and a drummer, most
 * of them trained at the Alpha Boys School and most of them capable of playing
 * something considerably more complicated than this. The palette is the only one
 * in the genre with a clarinet in it and the only one where the melody layer is
 * overwhelmingly brass, because in ska the horns are the front line and the singer
 * — where there is one — is the guest.
 *
 * `drumSources` says `kit` and says nothing else, and it does not have to say why:
 * `DRUM_SOURCE_FROM` gates the preset box at 1964 and everything else later, so
 * this era could not have a machine even if a table asked for one. Listing them at
 * zero would look like an opinion about a question that was never open.
 */
const ska: EraProfile = {
  id: 'ska',
  year: 1963,
  label: '1962–66 ska',
  description:
    'A big band at speed: four horns out front, a shuffled kit, a walking bass, and piano and guitar chopping the after-beat together.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['AlesisSR16', 3],
    ['EmuSP12', 3],
    ['RolandCompurhythm1000', 2],
  ],
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['trombone', 5], ['tenorSax', 5], ['trumpet', 4], ['altoSax', 3],
      ['cleanGuitar', 2], ['piano', 2], ['clarinet', 2], ['mutedTrumpet', 1],
    ],
    counter: [
      ['trombone', 4], ['tenorSax', 3], ['trumpet', 3], ['altoSax', 3],
      ['cleanGuitar', 2], ['piano', 2], ['clarinet', 1],
    ],
    comp: [
      ['piano', 5], ['jazzGuitar', 4], ['cleanGuitar', 3], ['drawbarOrgan', 2],
      ['banjo', 1],
    ],
    pad: [
      ['drawbarOrgan', 4], ['strings1', 2], ['brassSection', 2],
    ],
    bass: [['acousticBass', 6], ['fingerBass', 3], ['pickBass', 1]],
    brass: [
      ['brassSection', 4], ['trombone', 4], ['trumpet', 3], ['tenorSax', 2],
      ['altoSax', 2],
    ],
  },
  styleWeights: {
    mento: 5, shuffle: 5, ska: 9, rocksteady: 1, skinhead: 0,
    onedrop: 0, rockers: 0, steppers: 0, flyers: 0, roots: 0, dub: 0,
    nyabinghi: 3, lovers: 0, bubble: 1, horns: 3, twotone: 0, dubpoetry: 0,
    rubadub: 0, slengteng: 0, dancehall: 0, ragga: 0,
  },
  tempoScale: 1,
  /**
   * The one era here with any real appetite for a key change, and even then it is
   * the smallest number in the project.
   *
   * Ska is descended from American rhythm and blues, where a last-chorus lift is a
   * normal thing for an arranger to write, and a horn band can play one. Every
   * later era in this file is riddim music, where a key change would break the one
   * property that matters — that somebody else can sing a different song over the
   * same two bars next month.
   */
  keyChangeChance: 0.15,
  density: 0.74,
  /**
   * Mono, close, and dry, because it was cut to one track in a room with no
   * treatment in it. The bass is already dark: a Jamaican bass tone is flatwound
   * strings with the tone control shut, and 900 Hz is roughly where that lands.
   */
  effects: {
    drums: { reverb: 0.12, lowpass: 6500 },
    bass: { reverb: 0.02, lowpass: 900 },
    comp: { reverb: 0.14, lowpass: 7000 },
    brass: { reverb: 0.22, lowpass: 7500 },
    melody: { reverb: 0.2, lowpass: 7500 },
    pad: { reverb: 0.25, lowpass: 5000 },
    vocal: { reverb: 0.2, lowpass: 6500 },
  },
  space: { reverbSize: 0.32, delayBeats: 0.75, delayFeedback: 0.2 },
};

/**
 * ROCKSTEADY — 1966–70.
 *
 * The band gets smaller and the bass gets bigger, and those are the same sentence.
 * The upright goes and an electric bass arrives — `fingerBass` at six against the
 * upright's two, which is the inverse of the era above and is the single most
 * important number in this file. A Fender bass through a small amp with the tone
 * off is what makes a rocksteady record sound like a rocksteady record, and the
 * horn section that was the front line two years ago is now three men playing an
 * arrangement behind a singer.
 *
 * The organ arrives here too, which is why `drawbarOrgan` heads the comp palette,
 * and it stays at the head of it for the rest of the genre.
 *
 * `tempoScale: 0.96` is the only place in the project where the era pulls the
 * tempo down, and it is not decoration: the deceleration is the historical event
 * this era *is*. The style bands already sit low; this leans on them a little
 * further, so a rocksteady drawn in its own era is slower than the same style
 * drawn in the roots era, which is true.
 */
const rocksteady: EraProfile = {
  id: 'rocksteady',
  year: 1967,
  label: '1966–70 rocksteady',
  description:
    'The shuffle gone, the tempo down thirty, the upright bass replaced by a Fender with the tone shut, and a Hammond in the corner.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['AlesisSR16', 3],
    ['SakataDPM48', 3],
    ['EmuSP12', 2],
  ],
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['tenorSax', 4], ['drawbarOrgan', 4], ['trombone', 3], ['cleanGuitar', 3],
      ['trumpet', 2], ['vibraphone', 2], ['harmonica', 2], ['altoSax', 2],
    ],
    counter: [
      ['drawbarOrgan', 4], ['cleanGuitar', 3], ['trombone', 3], ['tenorSax', 2],
      ['vibraphone', 2], ['mutedTrumpet', 2],
    ],
    comp: [
      ['drawbarOrgan', 5], ['cleanGuitar', 4], ['piano', 3], ['jazzGuitar', 3],
      ['mutedGuitar', 2], ['percussiveOrgan', 2],
    ],
    pad: [
      ['drawbarOrgan', 4], ['strings1', 3], ['percussiveOrgan', 2], ['strings2', 1],
    ],
    bass: [['fingerBass', 6], ['pickBass', 3], ['acousticBass', 2]],
    brass: [
      ['trombone', 4], ['brassSection', 3], ['trumpet', 3], ['tenorSax', 2],
      ['mutedTrumpet', 2],
    ],
  },
  styleWeights: {
    mento: 1, shuffle: 1, ska: 2, rocksteady: 9, skinhead: 5,
    onedrop: 4, rockers: 0, steppers: 0, flyers: 0, roots: 2, dub: 1,
    nyabinghi: 2, lovers: 3, bubble: 4, horns: 4, twotone: 1, dubpoetry: 0,
    rubadub: 0, slengteng: 0, dancehall: 0, ragga: 0,
  },
  tempoScale: 0.96,
  keyChangeChance: 0.1,
  density: 0.62,
  effects: {
    drums: { reverb: 0.2, lowpass: 5500 },
    bass: { reverb: 0.02, lowpass: 850 },
    comp: { reverb: 0.24, delay: 0.1, lowpass: 6200 },
    brass: { reverb: 0.3, lowpass: 6800 },
    melody: { reverb: 0.3, delay: 0.12, lowpass: 7000 },
    pad: { reverb: 0.4, lowpass: 4800 },
    vocal: { reverb: 0.3, delay: 0.1, lowpass: 6200 },
  },
  space: { reverbSize: 0.45, delayBeats: 0.75, delayFeedback: 0.3 },
};

/**
 * ROOTS — 1971–80, and the era most people mean by the word reggae.
 *
 * Also the era of the *mix*, which is the thing this table has to carry that no
 * other era table in the project does. Dub was invented here — not as a style of
 * playing but as a second pass over a finished tape, with a spring reverb, a tape
 * echo and a high-pass filter, and with an engineer taking things out. The genre's
 * `effects` and `space` describe a band; these describe the desk every record in
 * this decade went through on the way out of the room.
 *
 * **The desk, and not the dub.** That distinction is newer than the numbers and
 * it is worth stating, because these numbers used to do both jobs and it showed:
 * `dub` had nothing of its own and borrowed the drench from here, so the same
 * style drawn in `digital` came out dry. It states its own sends now — see
 * `styles.ts` — and what is left below is a claim about 1975 that the other
 * fifteen styles drawing in this era were always the ones paying for. **Nothing was
 * handed back**, and the reason is the same per-key rule that let `dub` state
 * anything: what it took over is `reverb` and `delay`, and what it deliberately
 * did *not* take over is `lowpass` — so the 3.2 kHz below is still the number a
 * roots-era dub is filtered by, and brightening it to "give something back"
 * would brighten the one style it was supposed to be doing a favour for. The kit
 * of this decade is dark on a Culture record and on a Burning Spear record, not
 * only on a version, and 3200 is a fact about the desk rather than a loan.
 *
 * **The kit is filtered rather than merely quiet**, which is the sentence ambient's
 * `sampler` era already writes about itself and which applies here more literally
 * than it does there. Rolling the drums off at 3.2 kHz is not a way of making them
 * distant — it is the actual signal path, a high-pass and a low-pass on the drum
 * group of a Tubby's-modified MCI desk, and it is why a dub kick sounds like it is
 * arriving through a wall while the snare sounds like it is in the room. A quieter
 * kit would just be a quieter kit.
 *
 * The delay is the other half. Three sixteenths against a four-beat bar never
 * lands where the beat does, which is why every tape echo in this music has been
 * set there since the first one, and the feedback is high enough that a single
 * snare hit comes back six times. Below about 0.5 it is an effect; above it, it is
 * a second drummer, and this era is where that stopped being a mistake.
 */
const roots: EraProfile = {
  id: 'roots',
  year: 1975,
  label: '1971–80 roots',
  description:
    'The one drop, the organ bubble and the arranged horns — and the mixing desk as an instrument: spring reverb, tape echo, and a kit filtered rather than merely turned down.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['EmuSP12', 3],
    ['AlesisSR16', 3],
    ['RolandR8', 2],
    ['SakataDPM48', 2],
  ],
  /**
   * Still a drummer, and by 1975 that is a choice rather than a limitation — the
   * Rhythm Ace and the Mini Pops both existed and both were affordable. Channel
   * One had Sly Dunbar instead, and the whole militant sound of the decade is a
   * specific pair of hands. A box on this bandstand would be staging the wrong
   * object in the one era where the object is famous.
   */
  drumSources: [['kit', 1]],
  palette: {
    /**
     * `harmonica` at the head of the melody palette is a substitution and it
     * should be read as one. The instrument this music actually put here is a
     * melodica — Augustus Pablo's, blown through a tape echo — and there is no
     * melodica in the catalogue and no General MIDI programme for one. Of what
     * exists, a harmonica is the closest: a free reed excited by a player's own
     * breath, which is the half of the sound that matters, and it wobbles in
     * roughly the same way. What it is not is a keyboard, so it cannot play the
     * two-note chords a melodica lead sometimes carries, and its tone is
     * grittier where a melodica is hollow and slightly sad. `reedOrgan` has the
     * hollowness and no breath; the breath was judged the more important half.
     */
    melody: [
      ['harmonica', 4], ['drawbarOrgan', 3], ['tenorSax', 3], ['cleanGuitar', 3],
      ['trombone', 2], ['mutedTrumpet', 2], ['flute', 2], ['epiano1', 1],
    ],
    counter: [
      ['drawbarOrgan', 4], ['cleanGuitar', 3], ['harmonica', 3], ['mutedGuitar', 2],
      ['tenorSax', 2], ['trombone', 2],
    ],
    comp: [
      ['drawbarOrgan', 5], ['cleanGuitar', 4], ['rockOrgan', 3], ['mutedGuitar', 3],
      ['percussiveOrgan', 2], ['clavinet', 2], ['epiano1', 2], ['jazzGuitar', 2],
    ],
    pad: [
      ['drawbarOrgan', 4], ['strings1', 3], ['padWarm', 2], ['synthStrings', 2],
    ],
    bass: [['fingerBass', 7], ['pickBass', 3], ['fretlessBass', 1]],
    brass: [
      ['trombone', 4], ['brassSection', 3], ['trumpet', 3], ['tenorSax', 2],
      ['mutedTrumpet', 1],
    ],
  },
  styleWeights: {
    mento: 0, shuffle: 0, ska: 1, rocksteady: 1, skinhead: 2,
    onedrop: 7, rockers: 6, steppers: 5, flyers: 4, roots: 9, dub: 6,
    nyabinghi: 4, lovers: 4, bubble: 4, horns: 4, twotone: 3, dubpoetry: 3,
    rubadub: 2, slengteng: 0, dancehall: 0, ragga: 0,
  },
  tempoScale: 1,
  keyChangeChance: 0.04,
  density: 0.66,
  effects: {
    // Through a wall, on purpose. See the paragraph above.
    drums: { reverb: 0.42, delay: 0.28, lowpass: 3200 },
    // And the bass is not touched by any of it. Reverb on a sustained low note
    // arrives while the note is still sounding and the two beat against each
    // other — the reason ambient states this too, and the reason a dub mix sends
    // everything except the bass and keeps the floor solid while the room falls
    // apart above it.
    bass: { reverb: 0.02, lowpass: 800 },
    comp: { reverb: 0.5, delay: 0.42, lowpass: 5200 },
    brass: { reverb: 0.55, delay: 0.35, lowpass: 6000 },
    melody: { reverb: 0.6, delay: 0.5, lowpass: 6500 },
    pad: { reverb: 0.6, lowpass: 4200 },
    counter: { reverb: 0.6, delay: 0.48, lowpass: 6000 },
    vocal: { reverb: 0.5, delay: 0.38, lowpass: 6000 },
  },
  space: { reverbSize: 0.82, delayBeats: 0.75, delayFeedback: 0.62 },
};

/**
 * DIGITAL — 1985–90, and the shortest distance in this project between one record
 * and an entire industry.
 *
 * "Under Mi Sleng Teng" was cut in February 1985 on a Casiotone MT-40, a small
 * home keyboard with eight preset rhythms and a one-finger auto-bass. Within two
 * years every studio in Kingston was working the same way and the musicians who
 * had played everything in the three eras above were not being called. This is the
 * one era table in the project whose subject is a redundancy.
 *
 * So the tables are thin on purpose. `density` is the lowest of the four; the
 * palette is preset keyboards rather than instruments; `sequenced.bass` is high,
 * because on a great many of these records nobody is playing the bass at all — the
 * keyboard is; and `drumSources` puts `box` and `programmed` between them well
 * ahead of the drummer, with the kit kept at a real weight only because the
 * eighties dancehall stage still had one when the record did not.
 *
 * `CasioSK1` leads the bank table and has six sounds in it. See the header: that
 * is the one place this genre's cross-stick rule is deliberately let go, and the
 * gap it leaves is the sound of the era.
 */
const digital: EraProfile = {
  id: 'digital',
  year: 1985,
  label: '1985–90 digital',
  description:
    'A Casiotone preset and a drum machine: the riddim programmed rather than played, the bass sequenced, and no cross-stick anywhere.',
  drumBanks: [
    ['CasioSK1', 5],
    ['RolandTR808', 3],
    ['RolandTR505', 3],
    ['OberheimDMX', 2],
    ['LinnDrum', 2],
    ['YamahaRX21', 2],
    ['RolandTR626', 2],
    ['Linn9000', 1],
  ],
  drumSources: [['box', 5], ['programmed', 5], ['kit', 3], ['electronic-kit', 1]],
  /**
   * The bass, nearly half the time, and it is the literal truth about the record
   * this era is named after: the MT-40's auto-bass played the line and the
   * producer chose the key. Not the counter layer — a second sequenced figure
   * phasing against the first is a Berlin-school texture, and a dancehall riddim
   * has one machine in it, not two.
   */
  sequenced: { bass: 0.45 },
  palette: {
    melody: [
      ['synthBrass', 3], ['leadSquare', 3], ['epiano1', 3], ['steelDrums', 2],
      ['drawbarOrgan', 2], ['leadSaw', 2], ['tenorSax', 1], ['harmonica', 1],
    ],
    counter: [
      ['leadSquare', 3], ['synthBrass', 3], ['steelDrums', 2], ['epiano1', 2],
      ['cleanGuitar', 2], ['agogo', 1], ['woodblock', 1],
    ],
    comp: [
      ['epiano1', 4], ['clavinet', 3], ['rockOrgan', 3], ['cleanGuitar', 3],
      ['percussiveOrgan', 2], ['mutedGuitar', 2], ['epiano2', 2],
    ],
    pad: [
      ['synthStrings', 4], ['padWarm', 3], ['synthStrings2', 2], ['drawbarOrgan', 2],
    ],
    bass: [['synthBass', 5], ['fingerBass', 4], ['slapBass2', 2], ['pickBass', 2]],
    /**
     * The stab. `orchestraHit` is here rather than in any of the three eras above
     * because it did not exist above them — it is a Fairlight sample that arrived
     * in 1984 and was on every record made anywhere for about four years, and a
     * dancehall producer with a sampler reached for it exactly as often as a
     * house producer did.
     */
    brass: [
      ['synthBrass', 4], ['synthBrass2', 3], ['orchestraHit', 2], ['brassSection', 2],
      ['trombone', 1],
    ],
  },
  styleWeights: {
    mento: 0, shuffle: 0, ska: 1, rocksteady: 1, skinhead: 1,
    onedrop: 3, rockers: 2, steppers: 3, flyers: 1, roots: 3, dub: 4,
    nyabinghi: 1, lovers: 3, bubble: 2, horns: 2, twotone: 2, dubpoetry: 2,
    rubadub: 5, slengteng: 9, dancehall: 8, ragga: 6,
  },
  tempoScale: 1.04,
  keyChangeChance: 0.03,
  density: 0.54,
  /**
   * Dry, hard and bright — the opposite of the era above it in every field.
   *
   * A digital riddim is not reverberant. There is no room in it because there was
   * no room: the sounds came out of a keyboard's ROM and went into a desk, and the
   * only echo on the record is one the producer put on the voice on purpose. The
   * bass comes *up* in the mix and stays dark, which is the one thing that did not
   * change in 1985 and is most of why these records still sound Jamaican.
   */
  effects: {
    drums: { reverb: 0.08, lowpass: 9000 },
    bass: { reverb: 0, lowpass: 950 },
    comp: { reverb: 0.12, delay: 0.1, lowpass: 8000 },
    brass: { reverb: 0.15, lowpass: 8000 },
    melody: { reverb: 0.18, delay: 0.2, lowpass: 8500 },
    pad: { reverb: 0.3, lowpass: 6000 },
    vocal: { reverb: 0.35, delay: 0.3, lowpass: 7000 },
  },
  space: { reverbSize: 0.4, delayBeats: 0.75, delayFeedback: 0.42 },
};

export const ERAS: Record<string, EraProfile> = { ska, rocksteady, roots, digital };
