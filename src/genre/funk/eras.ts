/**
 * Funk era profiles, 1968–1984.
 *
 * Four eras, and the axis they move along is **who or what is keeping time**. In
 * iskelmä the era is a change of clothes and in synth it is the instrument
 * itself; here it is neither, quite. The chord does not change across these four
 * decades-in-miniature — a one-chord vamp is a one-chord vamp in 1968 and in
 * 1984 — and neither does the sixteenth grid. What changes is the *object making
 * the grid*: a man with sticks, then a man with sticks and a synthesiser bass
 * player beside him, then a LinnDrum with a man playing along to it, then an 808
 * with nobody in the room at all.
 *
 * That is why `drumSources` and `drumBanks` are doing more work in this file
 * than the palettes are. The instrument lists below overlap heavily between
 * neighbouring eras — a Fender bass and a clavinet are in three of the four —
 * and the thing that actually dates a funk record at ten paces is what the
 * backbeat is made of.
 *
 * ## On the banks
 *
 * The pack is a set of drum *machines*, so an acoustic kit in 1968 has to be
 * approximated by the most kit-like sample sets in it — `AkaiMPC60`, `RolandR8`,
 * `AlesisSR16`, `YamahaRY30`, which are sampled-acoustic boxes rather than
 * analogue ones. That is a caveat on the audition and not on the MIDI, which
 * writes to General MIDI channel 10 and gets a real kit from any decent
 * soundfont. It is the same caveat `jazz/eras.ts` states, and the same one that
 * stops applying entirely by 1980: from `boogie` onward every bank named here is
 * the machine the records were actually made on.
 *
 * **The tambourine is why the bank choices moved.** `tb` arrived in the
 * `DrumVoice` union this week, sixteenths on a tambourine is a signature of this
 * whole repertoire, and eleven of the fourteen banks below carry one. The three
 * that do not — `RolandTR808`, `EmuSP12`, `SimmonsSDS5` — are in the electro era
 * where a tambourine would be wrong anyway, and there `resolveVoice` sends it to
 * the shaker or the hat, which is what a programmer with an 808 did.
 *
 * ## On `keyChangeChance`, which is near zero throughout
 *
 * The final-chorus lift is a dance-band arranger's gesture and there is no
 * arranger here. A funk record ends by fading over the same chord it started on,
 * or by the band hitting The One and stopping; a modulation into the last chorus
 * would announce that somebody had written an arrangement, which in this idiom
 * is an admission rather than a flourish. The one non-zero value is `boogie`'s,
 * because post-disco pop genuinely does it and 1980 is where this genre touches
 * the radio.
 */

import type { EraProfile } from '../../style/types.js';

/**
 * JB — 1968.
 *
 * Nine people in a room, one chord, and a bandleader counting it off. Every
 * instrument in this palette is something a human being is physically operating:
 * a Fender bass with flatwounds, a hollow-body through a small amp with the tone
 * rolled back, a Hammond, and four horns. There is no synthesiser here and that
 * is a decision rather than an accident of the year — a Moog existed in 1968 and
 * this band would not have had one on the bus.
 *
 * `drumSources` is `kit` alone, which no other era in this project states so
 * flatly. A funk record of this decade is a *drummer* — the whole proposition is
 * that a person is placing sixteenths by hand and placing some of them
 * fractionally late — and a preset box in front of this band would be a rhythm
 * ace on a JB session, which never happened and would not have been kept if it
 * had.
 *
 * `density: 0.62` is the lowest here and it is about the *holes*. A nine-piece
 * band playing all at once is a big band; this one plays in shifts, and the
 * arranger's job is deciding who is out.
 */
const jb: EraProfile = {
  id: 'jb',
  year: 1968,
  label: '1968 hard funk',
  description:
    'Nine people, one chord, a drummer placing every sixteenth by hand. Fender bass, hollow-body guitar with the tone rolled off, Hammond and four horns.',
  drumBanks: [
    ['AkaiMPC60+congas', 4],
    ['RolandR8+congas', 4],
    ['AlesisSR16+congas', 3],
    ['YamahaRY30+congas', 2],
  ],
  /**
   * A drummer, and nothing else. Every other era in this project hedges here;
   * this one does not, because the single most characteristic sound of 1968 funk
   * is a human being deciding, four hundred times a minute, which sixteenths to
   * play quietly.
   */
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['tenorSax', 5], ['trumpet', 4], ['altoSax', 3], ['drawbarOrgan', 3],
      ['cleanGuitar', 3], ['trombone', 2], ['baritoneSax', 2], ['harmonica', 1],
    ],
    counter: [
      ['trumpet', 4], ['trombone', 3], ['altoSax', 3], ['drawbarOrgan', 3],
      ['cleanGuitar', 2], ['tenorSax', 2], ['mutedTrumpet', 2],
    ],
    // The muted guitar leads, and it leads by a distance. Palm-damped with a
    // 0.25-second decay, it is the only thing in the catalogue that can play
    // sixteen sixteenths in a bar without turning them into a chord.
    comp: [
      ['mutedGuitar', 7], ['drawbarOrgan', 4], ['cleanGuitar', 4],
      ['piano', 3], ['clavinet', 2], ['epiano1', 2],
    ],
    pad: [['drawbarOrgan', 4], ['brassSection', 3], ['strings1', 2], ['epiano1', 2]],
    // Flatwound strings on a Precision, played with the fingers. The upright is
    // in here at a token weight for the ballads and for nothing else.
    bass: [['fingerBass', 8], ['pickBass', 3], ['acousticBass', 1], ['baritoneSax', 1]],
    brass: [
      ['brassSection', 5], ['tenorSax', 4], ['trumpet', 4], ['trombone', 3],
      ['baritoneSax', 3], ['mutedTrumpet', 2],
    ],
  },
  styleWeights: {
    vamp: 8, jbshuffle: 7, deepfunk: 7, horns: 7, memphis: 6, swamp: 5,
    souljazz: 6, gogo: 0, latin: 4, afrofunk: 3, funkrock: 3, breakbeat: 5,
    ballad: 4, pfunk: 0, clav: 1, jazzfunk: 2, disco: 0, slap: 1,
    boogie: 0, minneapolis: 0, electro: 0, talkbox: 0,
  },
  tempoScale: 1,
  keyChangeChance: 0.02,
  density: 0.62,
};

/**
 * P-FUNK — 1975.
 *
 * The band gets bigger, the record gets longer, and a Minimoog joins the rhythm
 * section — not as a lead but as a *bass player*, which is the change that
 * matters. A synthesiser bass has no fret hand, so the figures get denser and
 * wider, and the era's `sequenced` field stays empty even so: a Bootsy line is
 * played, and a sequencer running it would take out the one thing that makes it
 * a performance.
 *
 * The clavinet is the era's other signature and it goes to the top of the comp
 * palette here. Its 0.45-second damper is what turns a chord into a rhythm part,
 * and 1975 is the year every band in this repertoire owned one.
 *
 * A box at weight 1 against a kit at 9. The disco end of this decade genuinely
 * did have a Rhythm Ace on some sessions, so it is not zero — but it has no
 * fills, cannot vary, and putting it any higher would take the drummer off a
 * decade of records that are remembered for their drummers.
 */
const pfunk: EraProfile = {
  id: 'pfunk',
  year: 1975,
  label: '1975 P-Funk',
  description:
    'The band gets bigger and the side gets longer: a Minimoog on the bass, a clavinet through a wah, two guitars and a horn section.',
  drumBanks: [
    ['RolandR8', 4],
    ['AkaiXR10', 3],
    ['YamahaRY30', 3],
    ['AlesisSR16', 2],
  ],
  drumSources: [['kit', 9], ['box', 1]],
  palette: {
    melody: [
      ['leadSaw', 4], ['tenorSax', 4], ['clavinet', 3], ['overdriveGuitar', 3],
      ['trumpet', 3], ['epiano1', 3], ['drawbarOrgan', 2], ['leadSquare', 2],
      ['altoSax', 2],
    ],
    counter: [
      ['clavinet', 4], ['trumpet', 3], ['cleanGuitar', 3], ['epiano1', 3],
      ['leadSquare', 2], ['trombone', 2], ['tenorSax', 2], ['vibraphone', 1],
    ],
    comp: [
      ['clavinet', 6], ['mutedGuitar', 6], ['epiano1', 4], ['cleanGuitar', 3],
      ['drawbarOrgan', 3], ['rockOrgan', 2], ['epiano2', 2],
    ],
    pad: [
      ['synthStrings', 4], ['strings1', 3], ['padWarm', 2], ['drawbarOrgan', 2],
      ['brassSection', 2], ['synthChoir', 1],
    ],
    // Three basses and a synthesiser, and the slap is here at real weight for
    // the first time: Graham's technique is five years old by now and every
    // player in this idiom has learned it.
    bass: [
      ['fingerBass', 5], ['synthBass', 4], ['slapBass', 3], ['pickBass', 2],
      ['fretlessBass', 1], ['slapBass2', 1],
    ],
    brass: [
      ['brassSection', 4], ['tenorSax', 3], ['trumpet', 3], ['trombone', 3],
      ['baritoneSax', 2], ['synthBrass', 2],
    ],
  },
  styleWeights: {
    vamp: 5, jbshuffle: 3, deepfunk: 4, horns: 5, memphis: 3, swamp: 4,
    souljazz: 4, gogo: 4, latin: 6, afrofunk: 6, funkrock: 6, breakbeat: 5,
    ballad: 5, pfunk: 8, clav: 8, jazzfunk: 7, disco: 5, slap: 6,
    boogie: 1, minneapolis: 0, electro: 0, talkbox: 2,
  },
  tempoScale: 1,
  keyChangeChance: 0.03,
  density: 0.68,
  /**
   * The envelope filter, and this is the era it arrives in.
   *
   * `docs/engine-gaps.md` §3.5 is this genre's entry: it declined `Genre.filter`
   * outright rather than fake a wah as a section sweep, and it was right to —
   * that field moves once per section and this moves on every note. It is the
   * only thing in this file that changes *while a note is sounding*, and this
   * era's opening paragraph is what it is for. A Bootsy line has more onsets than a JB
   * one and covers a wider span, *because a synthesiser has no fret hand and an
   * envelope filter makes every note an event* — that sentence is already in
   * `styles.ts` twice, on `pfunk`'s header and on its `sixteenth` figure, and
   * until now nothing behind it was true.
   *
   * **Dated rather than genre-wide, which is the whole of why it is here and not
   * in `index.ts`.** The Mu-Tron III is a 1972 box. In 1968 it does not exist and
   * the bass is a Precision through an Ampeg, which is why `jb` says nothing;
   * by 1984 the bass is entered on a grid — `electro` writes `sequenced: { bass: 0.4 }` —
   * and an envelope filter with no player's attack driving it is a filter
   * envelope on a sequencer, which is a different record and a different genre's
   * gesture. The gap between those two dates is exactly this era and the next.
   *
   * **Two octaves, measured against the number above it rather than chosen.**
   * The genre's `effects.bass` cutoff is 1600 Hz, and `FilterEnvelope` opens
   * *up* to the part's cutoff rather than past it — so two octaves rests the
   * filter at 400 Hz and snaps it to 1600. Both ends land inside a Mu-Tron III's
   * own sweep, which is the reason this number is 2 and not 3: three octaves
   * would rest at 200 Hz, which is below the box, and on the median bass note
   * here — MIDI 41, an F at 87 Hz — would leave two harmonics where the pedal
   * leaves four. Opened, that note has eighteen. Four harmonics to eighteen and
   * back, inside 150 ms, is the quack.
   *
   * **And it fires.** 22,934 bass notes across 71 songs in 300, median length
   * 294 ms against an envelope 150 ms long — so the filter is home again with a
   * third of the note left to sound on it, and the 8.5% of notes shorter than
   * the envelope get the front of the shape, which is what the pedal does to a
   * ghost note too.
   *
   * **The comp is deliberately not here**, and the arithmetic is the argument.
   * A wah pedal's own range tops out around 2.2 kHz; the comp sits at 9000 Hz,
   * so reaching a pedal's territory under it takes four and a half octaves,
   * which would rest a palm-muted chank at 400 Hz — and that is not a darker
   * chank, it is no chank at all, fourteen times a bar. The bass's 1600 Hz is
   * the one ceiling in this genre's table that a pedal fits underneath. That is
   * `LAYER_RESPONSE` in `generate/filter.ts` read backwards: it puts the bass
   * last because a lowpass closing on a part already below the cutoff removes
   * it, and the same fact is what makes the bass the only part here with room
   * for a filter to move *in*.
   */
  effects: {
    bass: { filterEnv: { octaves: 2, shape: 'wah' } },
  },
};

/**
 * BOOGIE — 1980.
 *
 * The LinnDrum arrives and the argument about who keeps time is settled for
 * five years. `programmed` at 6 against `kit` at 4 is the whole era in two
 * numbers: better than half these records were made to a machine somebody
 * entered a step at a time, and the rest were made by a drummer trying to sound
 * like one.
 *
 * The Linn family is the bank list and it is four entries of one instrument —
 * `LinnLM1` is 1980, `LinnLM2` is the LinnDrum proper, `Linn9000` adds the
 * sequencer, `AkaiLinn` is what came after. They are the sound of most of what
 * was on the radio between 1982 and 1986, which is the definition of an era
 * table doing its job.
 *
 * `sequenced: { bass: 0.15 }`. Low, and non-zero for the first time in this
 * genre. A boogie bass line is usually still a bass *player* — that is what
 * separates it from `electro` next door — but the ones that are not are the ones
 * that point at what happens in 1984, and a sixth of them is where that sits.
 *
 * The one era here with a real `keyChangeChance`. Post-disco is pop music with
 * a producer on it, and the last chorus going up a tone is a thing that
 * genuinely happens on these records where it never happens on a JB side.
 */
const boogie: EraProfile = {
  id: 'boogie',
  year: 1980,
  label: '1980 boogie',
  description:
    'A LinnDrum, a slap bass, a synth where the horns were, and the four-on-the-floor kick that disco left behind.',
  drumBanks: [
    ['LinnLM1+congas', 4],
    ['LinnLM2+congas', 4],
    ['OberheimDMX+congas', 3],
    ['SequentialCircuitsDrumtracks+congas', 2],
    ['EmuDrumulator+congas', 2],
  ],
  drumSources: [['programmed', 6], ['kit', 4]],
  sequenced: { bass: 0.15 },
  palette: {
    melody: [
      ['leadSaw', 4], ['synthBrass', 4], ['leadSquare', 3], ['epiano2', 3],
      ['cleanGuitar', 3], ['tenorSax', 3], ['clavinet', 2], ['trumpet', 2],
    ],
    counter: [
      ['synthBrass', 4], ['leadSquare', 3], ['epiano2', 3], ['cleanGuitar', 3],
      ['clavinet', 2], ['vibraphone', 2], ['xylophone', 1],
    ],
    comp: [
      ['mutedGuitar', 6], ['epiano2', 4], ['clavinet', 3], ['synthBrass', 3],
      ['cleanGuitar', 3], ['rockOrgan', 2], ['padPoly', 1],
    ],
    pad: [
      ['synthStrings', 5], ['padPoly', 3], ['synthStrings2', 3],
      ['strings1', 2], ['padWarm', 2],
    ],
    // The slap goes to the top, and both halves of it are here: `slapBass` is
    // the thumb and `slapBass2` is the popped finger, which is one technique
    // that General MIDI happens to have given two programmes.
    bass: [
      ['slapBass', 5], ['slapBass2', 4], ['synthBass', 4], ['fingerBass', 3],
      ['synthBass2', 2], ['pickBass', 1],
    ],
    brass: [
      ['synthBrass', 4], ['brassSection', 3], ['trumpet', 2], ['tenorSax', 2],
      ['trombone', 2], ['synthBrass2', 2],
    ],
  },
  styleWeights: {
    vamp: 2, jbshuffle: 1, deepfunk: 1, horns: 3, memphis: 1, swamp: 2,
    souljazz: 2, gogo: 6, latin: 3, afrofunk: 3, funkrock: 3, breakbeat: 3,
    ballad: 4, pfunk: 3, clav: 3, jazzfunk: 5, disco: 7, slap: 7,
    boogie: 8, minneapolis: 6, electro: 3, talkbox: 6,
  },
  tempoScale: 1,
  keyChangeChance: 0.12,
  density: 0.7,
  /**
   * The same box, five years on and turned down.
   *
   * 1.5 rather than the 1975 era's 2, and the reason is in the palette four
   * lines up: the slap goes to the top here, `slapBass` at 5 and `slapBass2` at
   * 4, and a popped string already *is* a transient. A full-travel envelope on
   * top of one is two attacks on the same note — the filter opening a second
   * time after the string has already cracked — where in 1975 the fingered
   * Precision and the Minimoog underneath it needed the pedal to supply the
   * event. 1.5 octaves rests at 566 Hz against 1975's 400, which on the median
   * note is six harmonics rather than four: the same gesture, half a pedal
   * stroke shallower, which is where a player sets it when the technique is
   * doing part of the work.
   *
   * It is still the same date argument, running out. Musitronics is gone by the
   * turn of this decade, and what replaces the box on these records is a
   * synthesiser's own contour on a bass patch — a shallower thing set from a
   * panel rather than a pedal pushed to the end of its travel.
   */
  effects: {
    bass: { filterEnv: { octaves: 1.5, shape: 'wah' } },
  },
};

/**
 * ELECTRO — 1984.
 *
 * An 808, a synth bass entered on a grid, a vocoder, and no band. This is the
 * end of the line the genre has been walking since 1968 and the first era here
 * with nobody keeping time at all: `programmed` at 7, `electronic-kit` at 2 for
 * the rock-adjacent end where a drummer is hitting Simmons pads, and `box` at 1
 * for the cheap records made on a preset machine, which are a real and much-loved
 * corner of this music.
 *
 * `RolandTR808` at 5 and it is the highest single bank weight in this file.
 * There is no substitute — the sound of this era is one specific machine, and a
 * generator that spread the weight evenly across five plausible boxes would be
 * describing 1984 rather than sounding like it.
 *
 * `sequenced: { bass: 0.4, counter: 0.25 }`. The highest in this genre and still
 * well under synth's, which reaches 0.55: an electro bass line is a *sequence*
 * more often than not, but even here the records that last are the ones where
 * somebody played it.
 *
 * The palette is almost entirely synthetic and the two exceptions earn their
 * place. `mutedGuitar` survives because a chank is a chank in any decade and
 * there are electro records with a guitarist on them; `slapBass2` survives
 * because the popped finger is the one acoustic sound this era kept.
 */
const electro: EraProfile = {
  id: 'electro',
  year: 1984,
  label: '1984 electro',
  description:
    'An 808, a sequenced synth bass, a vocoder and nobody in the room. The sample era beginning, and the drummer finally gone.',
  drumBanks: [
    ['RolandTR808', 5],
    ['Linn9000', 3],
    ['EmuSP12', 3],
    ['OberheimDMX', 2],
    ['AkaiLinn', 2],
    ['YamahaRX21', 2],
    ['SimmonsSDS5', 1],
  ],
  drumSources: [['programmed', 7], ['electronic-kit', 2], ['box', 1]],
  sequenced: { bass: 0.4, counter: 0.25 },
  palette: {
    melody: [
      ['leadSquare', 5], ['leadSaw', 4], ['synthBrass2', 4], ['leadCharang', 3],
      ['leadCalliope', 2], ['epiano2', 2], ['leadBassLead', 2],
    ],
    counter: [
      ['leadSquare', 4], ['synthBass', 3], ['clavinet', 2], ['xylophone', 2],
      ['agogo', 2], ['celesta', 2], ['leadCharang', 2],
    ],
    comp: [
      ['synthBrass2', 4], ['epiano2', 3], ['mutedGuitar', 3], ['clavinet', 3],
      ['padPoly', 2], ['orchestraHit', 2], ['leadSquare', 2],
    ],
    pad: [
      ['padPoly', 4], ['synthStrings2', 4], ['padWarm', 2], ['synthChoir', 2],
      ['padSweep', 2],
    ],
    bass: [
      ['synthBass', 6], ['synthBass2', 5], ['slapBass2', 3], ['fingerBass', 2],
      ['slapBass', 2],
    ],
    brass: [
      ['synthBrass2', 5], ['synthBrass', 4], ['orchestraHit', 2],
      ['brassSection', 2], ['trumpet', 1],
    ],
  },
  styleWeights: {
    vamp: 1, jbshuffle: 0, deepfunk: 1, horns: 1, memphis: 0, swamp: 1,
    souljazz: 1, gogo: 5, latin: 2, afrofunk: 2, funkrock: 2, breakbeat: 4,
    ballad: 3, pfunk: 2, clav: 2, jazzfunk: 3, disco: 3, slap: 4,
    boogie: 6, minneapolis: 8, electro: 9, talkbox: 6,
  },
  tempoScale: 1,
  keyChangeChance: 0.04,
  density: 0.66,
};

export const ERAS: Record<string, EraProfile> = { jb, pfunk, boogie, electro };
