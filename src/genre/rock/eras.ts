/**
 * Four rock eras, 1965 to 1993, and each one is a different *amplifier*.
 *
 * That is the axis to read them by, because in this repertoire it is the one
 * that actually changes and the others follow it. The instruments barely move —
 * two guitars, a bass, a kit and a keyboard, in 1965 and in 1993 alike, which is
 * not true of any other genre in this project. What moves is how loud the guitar
 * is allowed to be before it stops sounding like a guitar, and every era below
 * is that question answered differently:
 *
 *   1965  a 30-watt combo, clean, because there was nothing else
 *   1972  a 100-watt stack with the input valve overdriven on purpose
 *   1982  the same stack, in a building, through a desk with a reverb on it
 *   1993  a small nasty amplifier recorded in a large room, deliberately
 *
 * ## Nothing here is a drum machine, and one field says so four times
 *
 * `drumSources` names `kit` in every era, and `box` in none of them. The gate in
 * `eligibleDrumSources` would have allowed a preset box from 1964 onward and the
 * two later eras could have had `programmed` and `electronic-kit` on a technical
 * reading of the years — but a rhythm box with fourteen buttons on it marked
 * *Bossa Nova* has never once been what a rock band had, in any decade, and the
 * two eras that do admit a machine admit the *right* machines: a Simmons kit,
 * which is a drummer hitting hexagonal pads, and a programmed LinnDrum, which is
 * a producer replacing one. Listing `box` at a low weight would not be a quiet
 * version of that, it would be a category error firing one song in twenty.
 *
 * The consequence is that `Style.boxDrums` is not set anywhere in `styles.ts`,
 * and `styles.ts` says why: a style forbidding something no era offers is a
 * second statement of one fact, and the second one is the one that rots.
 *
 * ## The one thing these tables cannot say
 *
 * **Gated reverb on the snare, and nothing else.** `DrumTrack.voiceEffects`
 * exists for precisely this — its own doc names it as the most recognisable
 * production sound of 1984 and explains that applying it to the whole kit puts a
 * two-second tail on the hi-hats, which is a mess rather than a period — and
 * nothing in `generate/` populates the field. An era can state `effects.drums`
 * and that is the whole kit. So the `arena` table below asks for the largest
 * plausible whole-kit reverb and pulls the low-pass down to keep the hats out of
 * it, which is an approximation of a gate by other means and is audibly not one.
 * See the report.
 */

import type { EraProfile } from '../../style/types.js';

/**
 * BEAT — 1963–67.
 *
 * A Vox AC30 and a Fender Bassman, both of which are thirty watts, both of which
 * were designed to be clean, and neither of which was being played clean by 1965
 * because the only way to be heard in a ballroom was to turn it all the way up.
 * That is the era's whole sound: a valve amplifier past the point it was
 * designed for, which is *warm* rather than distorted, and a four-track machine
 * with everything already mixed down onto two of them.
 *
 * `cleanGuitar` and `jazzGuitar` lead the palettes because a semi-hollow
 * archtop through a small combo is genuinely nearer a jazz box than to anything
 * later in this file. `overdriveGuitar` is present at weight 2 and no higher —
 * it is 1966 arriving early, which happened, but a beat single with a fuzz box
 * on it was a novelty and the weights should say so.
 *
 * The organ is a Vox Continental, which is a transistor instrument with no
 * drawbars and one horrible bright sound, and `percussiveOrgan` is the closest
 * thing in the catalogue. `drawbarOrgan` is the Hammond that a few of the better
 * paid groups actually had.
 *
 * `keyChangeChance: 0.14` is the highest in the genre and it is the only era
 * with any real appetite for one. A beat group was writing pop singles for a
 * publisher and a last-chorus lift was a normal thing to write; by 1970 the
 * music is modal and a semitone lift would sound like a different band walked
 * in. `preparedModulation: false` on the genre means it arrives unannounced
 * even here, which is right — these lifts were straight-cut, with no applied
 * dominant in front of them, on record after record.
 */
const beat: EraProfile = {
  id: 'beat',
  year: 1965,
  label: '1963–67 beat',
  description:
    'Two guitars and a bass through thirty-watt combos turned all the way up, a four-piece kit with a tambourine on it, and everything mixed down to two tracks.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['AlesisSR16', 3],
    ['EmuSP12', 3],
    ['SakataDPM48', 2],
  ],
  /**
   * A drummer, and only a drummer. `DRUM_SOURCE_FROM` gates the preset box at
   * 1964, so this era could technically have one — and did not, anywhere, ever.
   * Listing it at zero would look like an opinion about a question nobody asked.
   */
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['cleanGuitar', 5], ['jazzGuitar', 4], ['harmonica', 3], ['percussiveOrgan', 3],
      ['drawbarOrgan', 2], ['piano', 2], ['overdriveGuitar', 2], ['tenorSax', 2],
    ],
    counter: [
      ['cleanGuitar', 4], ['percussiveOrgan', 3], ['jazzGuitar', 3], ['harmonica', 2],
      ['piano', 2], ['vibraphone', 1],
    ],
    comp: [
      ['cleanGuitar', 5], ['jazzGuitar', 4], ['percussiveOrgan', 3], ['piano', 3],
      ['mutedGuitar', 2], ['drawbarOrgan', 2], ['steelGuitar', 1],
    ],
    pad: [
      ['drawbarOrgan', 4], ['strings1', 3], ['percussiveOrgan', 2], ['choirAahs', 1],
    ],
    bass: [['pickBass', 6], ['fingerBass', 4], ['acousticBass', 1]],
    brass: [
      ['brassSection', 3], ['trumpet', 3], ['tenorSax', 3], ['trombone', 2],
      ['altoSax', 2],
    ],
  },
  styleWeights: {
    beat: 9, garage: 8, surf: 7, jangle: 6,
    bluesrock: 5, boogie: 3, hard: 1, riff: 0, glam: 0, psych: 4,
    southern: 0, prog: 0, math: 0, motorik: 0, stoner: 0,
    punk: 1, newwave: 0, postpunk: 0, arena: 0, ballad: 1,
    grunge: 0, alt: 0, indie: 1, shoegaze: 0,
  },
  tempoScale: 1,
  keyChangeChance: 0.14,
  density: 0.66,
  /**
   * Close, dry and bright, because it was cut in an afternoon onto four tracks
   * in a room with a curtain across one wall. The 8 kHz ceiling on the guitars
   * is the tape rather than the amplifier: a beat record has nothing above about
   * 10 kHz on it and the guitar is the loudest thing that reaches even that far.
   */
  effects: {
    drums: { reverb: 0.14, lowpass: 6500 },
    bass: { reverb: 0.02, lowpass: 1400 },
    comp: { reverb: 0.16, lowpass: 8000 },
    melody: { reverb: 0.2, lowpass: 8500 },
    counter: { reverb: 0.2, lowpass: 8000 },
    brass: { reverb: 0.2, lowpass: 7500 },
    pad: { reverb: 0.28, lowpass: 5000 },
    vocal: { reverb: 0.24, lowpass: 7000 },
  },
  space: { reverbSize: 0.3, delayBeats: 0.5, delayFeedback: 0.2 },
};

/**
 * HARD — 1969–75.
 *
 * The stack arrives and everything follows from it. A hundred watts through four
 * twelve-inch speakers is loud enough that the *guitar* becomes the loudest
 * instrument on the stage for the first time, which is why the riff can be the
 * composition — there is no longer anything it has to leave room for — and why
 * the drummer starts hitting harder, which is why the kit needs more
 * microphones, which is why the record starts sounding like a room.
 *
 * `overdriveGuitar` and `distortionGuitar` are the two ends of the same
 * amplifier here and both lead their palettes. `rockOrgan` sits just under them:
 * a Hammond through a Leslie and a second amplifier is the one keyboard that can
 * survive at this volume, which is exactly why every band of this decade that
 * had a keyboard player had that keyboard.
 *
 * **The Mellotron has no entry in the catalogue and this is where it should
 * have been.** What is here instead is `padChoir` and `tremoloStrings`, and the
 * substitution is worth naming rather than hiding: a Mellotron is a tape replay
 * keyboard whose notes last eight seconds and then stop dead, with audible wow
 * and a different tape for each key. `padChoir` has the timbre and none of the
 * mechanism; `tremoloStrings` has the wobble and none of the eight-second limit.
 * Neither is right and the two together are as close as this gets.
 *
 * `density` is the highest of the four eras at 0.78. A hard rock arrangement is
 * everybody playing at once for six minutes, and the restraint the other eras
 * spend on dynamics this one spends on the solo section.
 */
const hard: EraProfile = {
  id: 'hard',
  year: 1972,
  label: '1969–75 hard rock',
  description:
    'A hundred-watt stack, a Hammond through a Leslie, and a drummer with enough microphones to sound like the room they are in.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['EmuSP12', 3],
    ['AlesisSR16', 3],
    ['RolandR8', 2],
    ['SakataDPM48', 2],
  ],
  drumSources: [['kit', 1]],
  palette: {
    melody: [
      ['overdriveGuitar', 5], ['distortionGuitar', 4], ['rockOrgan', 3],
      ['cleanGuitar', 2], ['harmonica', 2], ['flute', 2], ['tenorSax', 1],
      ['drawbarOrgan', 2],
    ],
    counter: [
      ['overdriveGuitar', 4], ['rockOrgan', 3], ['distortionGuitar', 3],
      ['cleanGuitar', 2], ['drawbarOrgan', 2], ['harmonica', 2], ['flute', 1],
    ],
    comp: [
      ['overdriveGuitar', 5], ['distortionGuitar', 4], ['rockOrgan', 4],
      ['cleanGuitar', 3], ['drawbarOrgan', 3], ['clavinet', 2], ['piano', 2],
      ['epiano1', 1],
    ],
    pad: [
      ['rockOrgan', 4], ['strings1', 3], ['padChoir', 3], ['tremoloStrings', 2],
      ['drawbarOrgan', 2], ['churchOrgan', 1],
    ],
    bass: [['pickBass', 6], ['fingerBass', 5], ['acousticBass', 1]],
    brass: [
      ['brassSection', 3], ['trombone', 3], ['trumpet', 3], ['tenorSax', 2],
      ['baritoneSax', 1],
    ],
  },
  styleWeights: {
    beat: 1, garage: 3, surf: 1, jangle: 2,
    bluesrock: 8, boogie: 7, hard: 9, riff: 8, glam: 7, psych: 5,
    southern: 6, prog: 7, math: 2, motorik: 5, stoner: 2,
    punk: 3, newwave: 1, postpunk: 1, arena: 2, ballad: 3,
    grunge: 0, alt: 0, indie: 0, shoegaze: 0,
  },
  tempoScale: 1,
  keyChangeChance: 0.05,
  density: 0.78,
  /**
   * A large room, and the drums are in it.
   *
   * The change from the era above is almost entirely in that one line: the kit
   * goes from 0.14 reverb to 0.38, because the room microphones that made Bonham
   * famous are picking up a stone stairwell and the engineer has stopped trying
   * to keep them out. Everything else stays fairly dry — a hard rock guitar with
   * reverb on it sounds like a surf record, and the amplifier is already
   * providing more sustain than a reverb would.
   */
  effects: {
    drums: { reverb: 0.38, lowpass: 7500 },
    bass: { reverb: 0.03, lowpass: 1800 },
    comp: { reverb: 0.14, lowpass: 6800 },
    melody: { reverb: 0.22, delay: 0.12, lowpass: 7200 },
    counter: { reverb: 0.24, delay: 0.14, lowpass: 7000 },
    brass: { reverb: 0.26, lowpass: 7000 },
    pad: { reverb: 0.42, lowpass: 5200 },
    vocal: { reverb: 0.3, delay: 0.14, lowpass: 6800 },
  },
  space: { reverbSize: 0.6, delayBeats: 0.75, delayFeedback: 0.3 },
};

/**
 * ARENA — 1978–87.
 *
 * The building is the instrument. Everything characteristic of this decade's
 * rock records is a consequence of playing to twenty thousand people and then
 * making a record that sounds like it: the tempo settles into a narrow band
 * because a room that size has a reverb time of two seconds and anything faster
 * turns to mush; the chorus gains three voices because a crowd sings along and
 * the record has to sound like they already are; and the snare acquires a
 * second and a half of reverb chopped off with a noise gate.
 *
 * That gate is the era's signature and it is the one thing the tables cannot
 * ask for — see the header. `effects.drums` here is the largest in the genre at
 * 0.5 with the ceiling pulled down to 5.5 kHz, which keeps the worst of the tail
 * off the hi-hats and is emphatically not the same object.
 *
 * `SimmonsSDS5` heads the bank table and `drumSources` puts `electronic-kit`
 * second, and those two go together: the Simmons is hexagonal pads hit by a
 * drummer, it has three toms, a gated snare and no cymbals at all, and it is the
 * sound of 1982 to 1986 rock. The cymbals on those stages were still bronze,
 * which is why the fallback chain matters here more than anywhere else in the
 * genre — every crash and ride this era writes lands on the acoustic kit's own
 * substitute.
 *
 * `programmed` is present at a real weight and it is not the band. It is the
 * producer, on the ballad, replacing a drummer with a LinnDrum because the
 * click has to be perfect for the string overdub — which is a true and
 * unglamorous fact about a great many records of this decade.
 */
const arena: EraProfile = {
  id: 'arena',
  year: 1982,
  label: '1978–87 arena',
  description:
    'A stadium and a mixing desk: sixteenths on the hat, a gated snare, a polysynth pad, and four voices on every chorus.',
  drumBanks: [
    ['SimmonsSDS5', 5],
    ['LinnDrum', 4],
    ['LinnLM2', 3],
    ['OberheimDMX', 3],
    ['AkaiMPC60', 3],
    ['RolandTR707', 2],
    ['AlesisHR16', 2],
    ['YamahaRX21', 2],
  ],
  drumSources: [['kit', 6], ['electronic-kit', 4], ['programmed', 2]],
  palette: {
    melody: [
      ['distortionGuitar', 5], ['overdriveGuitar', 4], ['leadSaw', 2],
      ['synthBrass', 2], ['rockOrgan', 2], ['guitarHarmonics', 1],
      ['leadSquare', 1], ['cleanGuitar', 2],
    ],
    counter: [
      ['distortionGuitar', 4], ['overdriveGuitar', 3], ['leadSaw', 3],
      ['synthBrass', 2], ['guitarHarmonics', 2], ['cleanGuitar', 2],
      ['epiano2', 1],
    ],
    comp: [
      ['distortionGuitar', 5], ['overdriveGuitar', 4], ['cleanGuitar', 3],
      ['mutedGuitar', 3], ['epiano2', 2], ['rockOrgan', 2], ['piano', 2],
      ['clavinet', 1],
    ],
    pad: [
      ['synthStrings', 4], ['padPoly', 3], ['padWarm', 3], ['strings1', 2],
      ['synthStrings2', 2], ['rockOrgan', 1],
    ],
    bass: [['pickBass', 5], ['fingerBass', 4], ['synthBass', 3], ['slapBass2', 1]],
    brass: [
      ['synthBrass', 4], ['brassSection', 3], ['synthBrass2', 2], ['trumpet', 2],
      ['orchestraHit', 1],
    ],
  },
  styleWeights: {
    beat: 0, garage: 1, surf: 0, jangle: 3,
    bluesrock: 3, boogie: 4, hard: 6, riff: 4, glam: 4, psych: 0,
    southern: 3, prog: 3, math: 0, motorik: 2, stoner: 0,
    punk: 5, newwave: 7, postpunk: 7, arena: 9, ballad: 8,
    grunge: 1, alt: 2, indie: 2, shoegaze: 1,
  },
  tempoScale: 1,
  keyChangeChance: 0.08,
  density: 0.74,
  /**
   * Everything wet, and the kit wettest.
   *
   * 0.5 on the drums is the largest number in the genre and it is a substitute
   * for a gate rather than a taste — see the header. The 5.5 kHz ceiling under
   * it is the compensation: with the whole kit going to the same reverb, pulling
   * the top down keeps the tail off the hats, at the cost of a snare that is
   * duller than the real thing. A gate would have let the snare stay bright and
   * simply stop.
   *
   * The bass goes the other way and stays almost dry, which is the one
   * production value this decade shares with every other era here. A reverb on a
   * sustained low note arrives while the note is still sounding and the two beat
   * against each other; it is true in a dub mix and it is true in a stadium.
   */
  effects: {
    drums: { reverb: 0.5, lowpass: 5500 },
    bass: { reverb: 0.05, lowpass: 2200 },
    comp: { reverb: 0.3, delay: 0.16, lowpass: 7000 },
    melody: { reverb: 0.42, delay: 0.28, lowpass: 8000 },
    counter: { reverb: 0.44, delay: 0.3, lowpass: 7500 },
    brass: { reverb: 0.4, lowpass: 7500 },
    pad: { reverb: 0.55, lowpass: 6000 },
    vocal: { reverb: 0.45, delay: 0.24, lowpass: 7500 },
  },
  space: { reverbSize: 0.85, delayBeats: 0.75, delayFeedback: 0.34 },
};

/**
 * ALT — 1988–97, and the whole decade is a reaction to the one above it.
 *
 * Every production decision inverts. The gated snare goes and what replaces it
 * is a drum kit in a large live room with two microphones on it, which is where
 * the eighties started before the gate was invented; the polysynth goes
 * altogether; the guitar goes from a rack of processors back to a small nasty
 * amplifier; and the vocal, which had been the most treated thing on the record,
 * comes forward and dries out.
 *
 * `distortionGuitar` still leads, and it is a different distortion — a fuzz or
 * a cheap solid-state overdrive rather than a cranked valve stack, which is
 * grittier and much less sustaining. The catalogue has one patch for both, which
 * is a real limitation and is the reason `guitarHarmonics` is at a genuine
 * weight here: a pinched harmonic and a feedback squeal are the two things that
 * distinguish this decade's lead sound and neither of them is a distortion
 * setting.
 *
 * `tremoloStrings` in the pad palette is not an orchestra. It is a bowed guitar,
 * an EBow and a violin through a fuzzbox, all of which happened repeatedly on
 * these records and none of which the catalogue has — and what they share is a
 * sustained string tone with the attack removed, which is what this patch is.
 *
 * `density: 0.62` is the lowest of the four, and it is the loud/quiet dynamic
 * showing up as a number. A grunge record is not consistently dense; it is
 * consistently *variable*, and the way this generator produces that is a low
 * base density with the mood's `restraint` and the section arc doing the rest.
 */
const alt: EraProfile = {
  id: 'alt',
  year: 1993,
  label: '1988–97 alternative',
  description:
    'A small nasty amplifier in a large live room: no gate, no polysynth, the drums two microphones away and the vocal dry and in front.',
  drumBanks: [
    ['AkaiMPC60', 4],
    ['RolandR8', 4],
    ['AlesisSR16', 3],
    ['EmuSP12', 3],
    ['YamahaRY30', 2],
    ['AlesisHR16', 2],
  ],
  /**
   * A drummer, with the pads kept in at a token weight for the two or three
   * bands of this decade who genuinely used them. `programmed` is absent: the
   * whole cultural proposition of this music was that four people played it in a
   * room, and a machine on this bandstand would be staging the wrong object in
   * the one era whose subject is the object.
   */
  drumSources: [['kit', 9], ['electronic-kit', 1]],
  palette: {
    melody: [
      ['distortionGuitar', 5], ['overdriveGuitar', 4], ['cleanGuitar', 3],
      ['guitarHarmonics', 2], ['mutedGuitar', 2], ['rockOrgan', 1],
      ['epiano1', 1], ['tremoloStrings', 1],
    ],
    counter: [
      ['distortionGuitar', 4], ['cleanGuitar', 4], ['overdriveGuitar', 3],
      ['guitarHarmonics', 3], ['mutedGuitar', 2], ['epiano1', 1],
      ['glockenspiel', 1],
    ],
    comp: [
      ['distortionGuitar', 5], ['overdriveGuitar', 4], ['cleanGuitar', 4],
      ['mutedGuitar', 3], ['jazzGuitar', 2], ['epiano1', 2], ['rockOrgan', 2],
      ['piano', 1],
    ],
    pad: [
      ['tremoloStrings', 4], ['padWarm', 3], ['strings1', 3], ['rockOrgan', 2],
      ['synthStrings', 2], ['choirAahs', 1],
    ],
    bass: [['fingerBass', 6], ['pickBass', 5], ['synthBass', 1], ['fretlessBass', 1]],
    brass: [
      ['brassSection', 3], ['trumpet', 2], ['trombone', 2], ['tenorSax', 2],
      ['baritoneSax', 1],
    ],
  },
  styleWeights: {
    beat: 1, garage: 3, surf: 1, jangle: 5,
    bluesrock: 2, boogie: 1, hard: 3, riff: 4, glam: 1, psych: 2,
    southern: 1, prog: 1, math: 5, motorik: 4, stoner: 6,
    punk: 4, newwave: 2, postpunk: 4, arena: 1, ballad: 3,
    grunge: 9, alt: 9, indie: 8, shoegaze: 7,
  },
  tempoScale: 1,
  keyChangeChance: 0.02,
  density: 0.62,
  /**
   * The kit is back in a room and everything above it is drier than the decade
   * before by a factor of two.
   *
   * The vocal is the number that moved most: 0.45 down to 0.18, with the low-pass
   * *opened* rather than closed. A nineties rock vocal is close-miked, barely
   * compressed and has almost nothing on it, and that is audible as intimacy
   * rather than as an absence — it is the single clearest production difference
   * between this era and the one above it, on records that otherwise share a
   * chord vocabulary.
   */
  effects: {
    drums: { reverb: 0.36, lowpass: 9000 },
    bass: { reverb: 0.04, lowpass: 2000 },
    comp: { reverb: 0.16, lowpass: 6500 },
    melody: { reverb: 0.24, delay: 0.14, lowpass: 7500 },
    counter: { reverb: 0.28, delay: 0.18, lowpass: 7000 },
    brass: { reverb: 0.24, lowpass: 7000 },
    pad: { reverb: 0.48, lowpass: 5000 },
    vocal: { reverb: 0.18, delay: 0.08, lowpass: 9000 },
  },
  space: { reverbSize: 0.66, delayBeats: 0.5, delayFeedback: 0.26 },
};

export const ERAS: Record<string, EraProfile> = { beat, hard, arena, alt };
