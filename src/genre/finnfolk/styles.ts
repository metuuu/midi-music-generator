/**
 * The Finnish folk catalogue — twenty-four styles across four layers of the
 * tradition, and the layers do not agree with each other about anything.
 *
 * Iskelmä is organised by *dance*, because a tanssilava band's set list is a
 * rotation of dances and that is the whole of what distinguishes one number from
 * the next. Eleven of the styles below are organised the same way and for the
 * same reason — a polkka and a masurkka are two rhythms a fiddler plays at the
 * same wedding. The other thirteen are not, and the file has to hold both:
 *
 *  - **The archaic layer** (`runolaulu`, `itkuvirsi`, `soitto`, `karjanhuuto`,
 *    `virsi`, `piirileikki`) is older than the dances by centuries and has no
 *    functional harmony in it at all. What holds a runo tune up is a drone, and
 *    the four styles that state one carry their own `scaleForChord` — see
 *    `drone` below, which is the single most important eight lines in this file.
 *  - **The pelimanni layer** is imported dance music: the polska came from
 *    Sweden, the menuetti and the masurkka from Central Europe, and they brought
 *    tonic-dominant harmony with them. These tables *do* write `V`, and they are
 *    the only ones that do.
 *  - **The revival** (from 1968) is the pelimanni layer played by a large
 *    ensemble in front of a seated audience, which changes the arrangement and
 *    not the tune.
 *  - **The contemporary layer** amplifies all three and counts in sevens.
 *
 * ## Two rhythmic facts that carry the whole genre
 *
 * **The Kalevala metre is in five.** Eight syllables, four trochees, and five
 * quarter-note beats grouped three-and-two — `groups: [12, 8]` on `runolaulu`
 * and again on `karjalanlaulu` eight hundred years later. It is written out in
 * full at `runolaulu`.
 *
 * **The polska's three is uneven.** `groups: [5, 3, 4]` on `polska` and
 * `[4, 3, 5]` on `soittokunta` — the same dance from two regions, leaning
 * opposite ways. The argument for expressing it there rather than in `swing` or
 * in `feels` is at `polska`, and it is the longest comment in this file because
 * it is the thing the repertoire is most often got wrong about.
 *
 * Progressions are roman numerals read relative to the *mode*, so in D dorian
 * `VII` is C major and `VI` is B♭ major — see `core/chord.ts`. Slot indices are
 * sixteenths from the top of the bar: a 4/4 bar is 16 slots, a 3/4 bar 12, a 2/4
 * bar 8, a 5/4 bar 20 and the 7/8 fourteen.
 */

import type { Chord } from '../../core/chord.js';
import type { Pc } from '../../core/pitch.js';
import { makeScale, type Mode, type Scale, type ScaleName } from '../../core/scale.js';
import type { DrumPattern, Style } from '../../style/types.js';

/**
 * The drone rule, as a factory, for the styles that have no harmony to consult.
 *
 * Ambient's `scaleForChord` bends the mode of the tonic to absorb whatever chord
 * has arrived underneath, and it is right to: an ambient chord genuinely changes
 * every eight bars and the line has to admit it. **A kantele drone does not
 * change.** The instrument has no dampers and no stopping hand — the two lowest
 * strings are tuned to the tonic and its fifth and are simply left ringing — so
 * there is exactly one sonority under the tune for the length of the piece and
 * nothing for a ladder to search. The scale is fixed at the top of the piece and
 * stays there, which is a *simpler* rule than ambient's and a stronger claim.
 *
 * The two arguments are the mode in minor and the mode in major, because a style
 * still gets asked for both — `npm run genres` generates every style in both
 * modes, and so it should: a runo singer transposes to wherever their voice sits
 * and the tune keeps its own intervals either way.
 *
 * The `chord` parameter is deliberately not taken. That is the whole content of
 * the rule and it is worth being unable to spell the alternative.
 */
const drone = (inMinor: ScaleName, inMajor: ScaleName) =>
  (tonic: Pc, mode: Mode): Scale => makeScale(tonic, mode === 'minor' ? inMinor : inMajor);

/**
 * No kit, said once instead of fourteen times.
 *
 * Sixteen of the twenty-four styles below carry `excludeLayers: ['drums']`, and
 * a style that excludes the kit still has to hand the type a `drums` table —
 * `Style.drums` is not optional, and a style with an empty array would hand
 * `rng.weighted` nothing to draw from. Ambient solved this with a `none` pattern
 * per style; here the same object is shared, because fourteen identical empty
 * tables are not fourteen decisions.
 *
 * **It is not a quiet kit.** A Finnish pelimanni band is a fiddle, a second
 * fiddle, a clarinet and a bass, and the pulse is a foot on a board — there is
 * no percussionist in the room to be turned down. Where percussion *is* right,
 * it is a frame drum or a pair of hands, and those styles write real tables.
 */
const SILENT: DrumPattern[] = [{ name: 'none', weight: 1, voices: {} }];

// ---------------------------------------------------------------------------
// The archaic layer
// ---------------------------------------------------------------------------

/**
 * RUNOLAULU — Kalevala-metre sung poetry, and the oldest thing in this project.
 *
 * The metre is trochaic tetrameter: eight syllables to the line, four long-short
 * pairs, and no rhyme anywhere — the line is bound by alliteration and by being
 * said twice in different words, which is why a runo singer can go on for four
 * thousand lines. What matters here is that the *tune* is one line long, five
 * beats, and comes round again unchanged for as long as the poem lasts.
 *
 * ## Why five, and why grouped three-and-two
 *
 * Eight syllables do not fit four beats without either doubling the whole line
 * into eighths or cutting the last trochee short, and the tradition does
 * neither. What it does is run the first three trochees at two syllables to the
 * beat — six syllables in three beats — and then hand the closing pair a beat
 * each. That is `[2, 2, 2, 2, 2, 2, 4, 4]`, which is twenty sixteenths, which is
 * five quarter-note beats, and the break falls after the sixth syllable.
 *
 * So `groups: [12, 8]`: three beats then two, the long group first. This is the
 * case `Style.groups` exists for and its own doc says so — there is no formula
 * that recovers a grouping from the number 20, and 2+3 is a different piece of
 * music from 3+2. Handed the grouping, `metricStrength` puts the bar's second
 * accent on slot 12, where the line turns; left to the arithmetic it would put a
 * half-bar accent on slot 10, in the middle of the fifth syllable, and the whole
 * line would read as a bar of five with a limp in it.
 *
 * ## And no harmony at all
 *
 * `scaleForChord` is the drone rule and the progressions are one chord. `isus2`
 * is a root and a fifth with nothing between them, which is not a decorated
 * minor triad — it is the two open strings of a five-string kantele, and the
 * absence of the third is the reason the same tune serves a wedding song and a
 * lament without changing. A chord table that moved would be asserting that
 * somebody in the room was hearing a progression, and nobody was.
 *
 * `hook: 'earworm'` is the strongest setting in the project and the only place
 * it is unambiguously correct: the tune is *supposed* to be identical every
 * line, because the poem is the thing being listened to.
 */
const runolaulu: Style = {
  id: 'runolaulu',
  label: 'Runolaulu (Kalevala metre)',
  description:
    'Trochaic tetrameter in 5/4 grouped three-and-two, sung over a kantele drone. One line of tune, repeated for as long as the poem lasts, and no functional harmony anywhere.',
  beatsPerBar: 5,
  beatUnit: 4,
  /** Three beats of syllable pairs, then the closing trochee a beat each. */
  groups: [12, 8],
  bpm: [56, 78],
  swing: 0,
  modeWeights: { minor: 0.82, major: 0.18 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  excludeLayers: ['drums', 'brass'],
  requireLayers: ['comp'],
  drumFills: false,
  counterSpacing: 1,
  scaleForChord: drone('dorian', 'mixolydian'),
  progressions: {
    intro: [{ chords: ['isus2', 'isus2', 'isus2', 'isus2'], weight: 5 }],
    verse: [
      { chords: ['isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2'], weight: 6, note: 'One sonority for eight bars. The poem is the event and the drone is the floor it stands on' },
      { chords: ['isus2', 'isus2', 'isus2', 'isus4', 'isus2', 'isus2', 'isus2', 'isus2'], weight: 3, note: 'The fourth leaning in and going away again — a finger laid on one string, not a chord change' },
    ],
    chorus: [
      { chords: ['isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2'], weight: 6 },
      { chords: ['isus2', 'isus4', 'isus2', 'isus2', 'isus2', 'isus4', 'isus2', 'isus2'], weight: 3 },
    ],
    bridge: [{ chords: ['isus4', 'isus4', 'isus2', 'isus2', 'isus4', 'isus4', 'isus2', 'isus2'], weight: 4 }],
    outro: [{ chords: ['isus2', 'isus2', 'isus2', 'isus2'], weight: 5 }],
  },
  majorProgressions: {
    intro: [{ chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 5 }],
    verse: [
      { chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 6 },
      { chords: ['Isus2', 'Isus2', 'Isus2', 'Isus4', 'Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 3 },
    ],
    chorus: [
      { chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 6 },
      { chords: ['Isus2', 'Isus4', 'Isus2', 'Isus2', 'Isus2', 'Isus4', 'Isus2', 'Isus2'], weight: 3 },
    ],
    bridge: [{ chords: ['Isus4', 'Isus4', 'Isus2', 'Isus2', 'Isus4', 'Isus4', 'Isus2', 'Isus2'], weight: 4 }],
    outro: [{ chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 5 }],
  },
  /**
   * The line, and the four ways a singer gets through it.
   *
   * The first cell is the metre written out — six syllables in eighths, then the
   * closing pair a beat each — and it takes the largest weight because it is not
   * one option among several, it is what the words do. The rest are the licences
   * the tradition actually takes: the *murrelmasäe*, where a long syllable falls
   * on a weak position and the pair inverts, and the held final syllable that
   * ends a run of lines.
   */
  melodyCells: [
    { cell: [2, 2, 2, 2, 2, 2, 4, 4], weight: 7 },
    { cell: [2, 2, 2, 2, 2, 2, 8], weight: 5 },
    { cell: [4, 2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 4, 4, 4], weight: 4 },
    { cell: [4, 4, 4, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 4, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 2, 2, 2, 2, 4], weight: 2 },
    { cell: [12, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [2, 2, 2, 2, 2, 2, 8], weight: 5 },
    { cell: [12, 8], weight: 4 },
    { cell: [20], weight: 3 },
    { cell: [4, 4, 4, 8], weight: 2 },
  ],
  /**
   * The kantele's two lowest strings, and they never stop.
   *
   * `sustain: true` is the whole of it: same pitch, meeting end to end, merged
   * rather than re-struck. A root re-attacked on every downbeat at 60 bpm is a
   * slow crotchet figure; held through, it is a drone, and a drone is what this
   * music stands on. The second pattern is the only motion allowed and it is the
   * player's thumb finding the fifth halfway through a line rather than a bass
   * part.
   */
  bass: [
    { name: 'drone', weight: 7, sustain: true, hits: [{ at: 0, dur: 20, tone: 'root', vel: 0.78 }] },
    { name: 'drone-thumbed', weight: 3, sustain: true, hits: [
      { at: 0, dur: 12, tone: 'root', vel: 0.78 },
      { at: 12, dur: 8, tone: 'fifth', vel: 0.68 },
    ] },
  ],
  comp: [
    { name: 'open-fifth', weight: 6, voices: 2, voicing: 'quartal', sustain: true, hits: [
      { at: 0, dur: 20, vel: 0.42 },
    ] },
    { name: 'line-heads', weight: 4, voices: 2, voicing: 'quartal', hits: [
      { at: 0, dur: 12, vel: 0.44 },
      { at: 12, dur: 8, vel: 0.38 },
    ] },
    { name: 'stroked', weight: 3, voices: 2, voicing: 'quartal', hits: [
      { at: 0, dur: 4, vel: 0.44 },
      { at: 4, dur: 4, vel: 0.3 },
      { at: 8, dur: 4, vel: 0.32 },
      { at: 12, dur: 4, vel: 0.4 },
      { at: 16, dur: 4, vel: 0.3 },
    ] },
  ],
  drums: SILENT,
  /**
   * A fifth of range, almost no leaps, and the same shape every line.
   *
   * `span: 7` is the narrowest in the project and it is a measurement rather
   * than a preference: the collected runo melodies sit inside a fifth, most of
   * them inside a fourth, and a tune that opened out to an octave would be a
   * hymn. `sequence: 0.75` is the other half of the same fact — the second line
   * is the first line again, which is what the poem's own parallelism does to
   * the tune.
   */
  melody: { leap: 0.07, ornament: 0.28, span: 7, sequence: 0.75, syncopation: 0.05 },
};

/**
 * ITKUVIRSI — the lament, and the one style here that does not end.
 *
 * A Karelian lament is sung by a woman at a wedding or a death, half sung and
 * half wept, in a language deliberately different from the one anybody speaks —
 * the dead are addressed in circumlocutions, so the words are as unfamiliar as
 * the delivery. It is unmetred. There is no pulse in it at all: the phrase is as
 * long as the breath and the next one starts when the crying allows.
 *
 * Which means every number below is a compromise, and the honest thing is to say
 * which way the compromise leans rather than pretend the engine can do this.
 * There is no way to write "no metre" in a table whose unit is a sixteenth, so
 * the lament gets the same five beats the runo singer has and the **opposite**
 * grouping: `groups: [8, 12]`, two beats then three. That is not symmetry for
 * its own sake. A runo line drives through six quick syllables and lands; a
 * lament opens on the wail — the highest note of the phrase, struck and held —
 * and then falls away for as long as it takes, so the weight is at the front and
 * the long group is behind it.
 *
 * `phrygian` in minor, through the drone rule, and that is the second decision.
 * The lament's phrase is a descent onto the tonic from above, and the note
 * immediately above the tonic is the one that carries it; a semitone leans and a
 * whole tone merely steps. It is also why `hook` is `loose` where `runolaulu` is
 * `earworm` — the poem repeats and the grief does not.
 */
const itkuvirsi: Style = {
  id: 'itkuvirsi',
  label: 'Itkuvirsi (lament)',
  description:
    'The Karelian lament: a wail struck at the top of the phrase and falling onto the tonic from a semitone above. Unmetred by tradition, written here as a five that leans the opposite way to the runo singer.',
  beatsPerBar: 5,
  beatUnit: 4,
  /** Two beats then three — the weight at the front, and the fall behind it. */
  groups: [8, 12],
  bpm: [42, 62],
  swing: 0,
  modeWeights: { minor: 0.96, major: 0.04 },
  relativeMajorChorus: 0,
  hook: 'loose',
  strictness: 'light',
  excludeLayers: ['drums', 'brass', 'pad'],
  requireLayers: ['melody'],
  drumFills: false,
  counterSpacing: 2,
  scaleForChord: drone('phrygian', 'mixolydian'),
  progressions: {
    intro: [{ chords: ['isus2', 'isus2', 'isus2', 'isus2'], weight: 5 }],
    verse: [
      { chords: ['isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2'], weight: 6 },
      { chords: ['isus2', 'isus2', 'isus2', 'isus2', 'i', 'i', 'isus2', 'isus2'], weight: 3, note: 'The third arriving once and going away. In a lament even that much harmony is an event' },
    ],
    chorus: [
      { chords: ['isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2'], weight: 6 },
      { chords: ['isus4', 'isus4', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2'], weight: 3 },
    ],
    outro: [{ chords: ['isus2', 'isus2', 'isus2', 'isus2'], weight: 5 }],
  },
  majorProgressions: {
    intro: [{ chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 5 }],
    verse: [
      { chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 6 },
      { chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2', 'I', 'I', 'Isus2', 'Isus2'], weight: 3 },
    ],
    chorus: [
      { chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 6 },
      { chords: ['Isus4', 'Isus4', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 3 },
    ],
    outro: [{ chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 5 }],
  },
  /**
   * Every cell is front-heavy, and the two that are not open with a rest.
   *
   * A lament phrase is struck and then let go of. `[8, 12]` is the bar itself —
   * the wail on the two-beat group and the descent over the three — and
   * `[-4, 4, 12]` is the same phrase with the breath in front of it, which is
   * the commonest thing on the recordings.
   */
  melodyCells: [
    { cell: [8, 12], weight: 6 },
    { cell: [8, 4, 8], weight: 5 },
    { cell: [4, 4, 12], weight: 4 },
    { cell: [-4, 4, 12], weight: 4 },
    { cell: [8, 4, 4, 4], weight: 3 },
    { cell: [4, 4, 4, 8], weight: 3 },
    { cell: [-8, 4, 8], weight: 3 },
    { cell: [20], weight: 2 },
  ],
  cadenceCells: [
    { cell: [20], weight: 6 },
    { cell: [8, 12], weight: 4 },
    { cell: [-4, 16], weight: 3 },
  ],
  bass: [
    { name: 'drone', weight: 7, sustain: true, hits: [{ at: 0, dur: 20, tone: 'root', vel: 0.7 }] },
    { name: 'drone-low', weight: 3, sustain: true, hits: [{ at: 0, dur: 20, tone: 'root', vel: 0.6 }] },
  ],
  comp: [
    { name: 'open-fifth', weight: 6, voices: 2, voicing: 'quartal', sustain: true, hits: [
      { at: 0, dur: 20, vel: 0.34 },
    ] },
    { name: 'struck-once', weight: 4, voices: 2, voicing: 'quartal', hits: [
      { at: 0, dur: 20, vel: 0.38 },
    ] },
  ],
  drums: SILENT,
  /**
   * `ornament: 0.55` is the highest melodic ornament figure in the project and
   * it is the subject rather than the decoration: what a lament *is*, as a
   * sound, is a note approached from above with a catch in it and left with a
   * slide. `leap: 0.09` because none of that motion goes anywhere — the whole
   * phrase is a descent by step onto a note it was never far from.
   */
  melody: { leap: 0.09, ornament: 0.55, span: 10, sequence: 0.3, syncopation: 0.04 },
};

/**
 * SOITTO — the kantele piece, with nobody singing over it.
 *
 * The instrument is a shallow box with a string per note, no dampers of any kind
 * and no stopping hand, and everything about the writing here follows from the
 * absence of dampers: the notes do not stop when the finger leaves, so a fast
 * passage is not a line, it is a chord accumulating. That wash is the sound. It
 * is why `INSTRUMENTS.kantele` carries a 2.6-second decay rather than a harp's,
 * and it is why the comp figures below are short and repetitive — a busy one
 * turns the whole bar into a cluster within three beats.
 *
 * ## The cycle is the point
 *
 * `cycle: 12` against a four-beat bar: a three-beat figure that arrives on a
 * different beat every bar and comes back round every three. This is the one
 * place in the genre where the drift `Cycle` was built for is not a progressive
 * affectation but a description of the object — the small kantele is five
 * strings and the accompaniment is a repeating right-hand figure across all
 * five, which has no reason whatever to be four notes long. A four-against-four
 * figure would put the same string on the same beat for the length of the piece.
 *
 * `voicing: 'quartal'` for the reason `HANDS.kantele` gives: the traditional
 * accompaniment is an open fifth with the melody picked above it, and stacking
 * fourths is the closest this table comes to saying so. A tertian voicing would
 * put a third in the drone, which is the one interval kantele accompaniment does
 * not use.
 */
const soitto: Style = {
  id: 'soitto',
  label: 'Soitto (kantele piece)',
  description:
    'A kantele on its own: an open fifth left ringing, a three-beat right-hand figure drifting against a four-beat bar, and no dampers to stop any of it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [60, 88],
  swing: 0,
  modeWeights: { minor: 0.62, major: 0.38 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  excludeLayers: ['drums', 'brass'],
  requireLayers: ['comp'],
  drumFills: false,
  counterSpacing: 1,
  scaleForChord: drone('dorian', 'mixolydian'),
  /**
   * The one style in the genre that *is* an instrument, which is the exact case
   * `TwoHandedKeys.instruments` says it exists for: a kantele piece with a
   * saxophone on the tune is not a kantele piece, and without this the era
   * palettes would deal one about a third of the time in the two later eras.
   *
   * It is also the only honest way to write this music down. A player at a
   * kantele is not a melody instrument with an accompanist — the right hand
   * picks the tune out of the top strings and the left hand holds the drone on
   * the bottom two, on the same instrument, and `HANDS.kantele` already
   * describes exactly that: two voices, a fifth of daylight, voiced in fourths
   * because a third in the drone is the one interval this accompaniment does not
   * use.
   *
   * `ostinato` leads, and it is the mode the object forces. `answer` is a left
   * hand replying in the gaps, which needs gaps, and an undamped instrument has
   * none — the previous note is still sounding. A figure that repeats regardless
   * of what the right hand is doing is what a kantele left hand physically is.
   *
   * No `stride`: `HANDS.kantele` has no `bass` side, because the instrument's
   * lowest string is G3 and there is nowhere beneath the comping register to
   * leap to. `chooseLeftHandMode` drops it rather than writing one.
   */
  twoHanded: {
    instruments: [['kantele', 9], ['harp', 1]],
    density: 0.8,
    modes: [['ostinato', 5], ['block', 3], ['answer', 2]],
    /**
     * Three beats against a four-beat bar, the same disagreement the comp
     * figures make and for the same reason — five strings and no reason at all
     * for the figure across them to be four notes long.
     */
    ostinato: {
      cycle: 12,
      hits: [
        { at: 0, dur: 3, vel: 0.5 },
        { at: 4, dur: 3, vel: 0.38 },
        { at: 8, dur: 4, vel: 0.42 },
      ],
    },
  },
  progressions: {
    intro: [{ chords: ['isus2', 'isus2', 'isus2', 'isus2'], weight: 5 }],
    verse: [
      { chords: ['isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2'], weight: 5 },
      { chords: ['isus2', 'isus2', 'isus4', 'isus4', 'isus2', 'isus2', 'isus2', 'isus2'], weight: 4 },
      { chords: ['i', 'i', 'isus2', 'isus2', 'i', 'i', 'isus2', 'isus2'], weight: 3 },
    ],
    chorus: [
      { chords: ['isus4', 'isus4', 'isus2', 'isus2', 'isus4', 'isus4', 'isus2', 'isus2'], weight: 5 },
      { chords: ['isus2', 'isus2', 'isus2', 'isus2', 'i', 'i', 'isus2', 'isus2'], weight: 4 },
    ],
    bridge: [{ chords: ['isus4', 'isus4', 'isus4', 'isus4', 'isus2', 'isus2', 'isus2', 'isus2'], weight: 4 }],
    outro: [{ chords: ['isus2', 'isus2', 'isus2', 'isus2'], weight: 5 }],
  },
  majorProgressions: {
    intro: [{ chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 5 }],
    verse: [
      { chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 5 },
      { chords: ['Isus2', 'Isus2', 'Isus4', 'Isus4', 'Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 4 },
      { chords: ['I', 'I', 'Isus2', 'Isus2', 'I', 'I', 'Isus2', 'Isus2'], weight: 3 },
    ],
    chorus: [
      { chords: ['Isus4', 'Isus4', 'Isus2', 'Isus2', 'Isus4', 'Isus4', 'Isus2', 'Isus2'], weight: 5 },
      { chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2', 'I', 'I', 'Isus2', 'Isus2'], weight: 4 },
    ],
    bridge: [{ chords: ['Isus4', 'Isus4', 'Isus4', 'Isus4', 'Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 4 }],
    outro: [{ chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 5 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 8], weight: 4 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [4, 12], weight: 3 },
  ],
  bass: [
    { name: 'drone', weight: 7, sustain: true, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.74 }] },
    { name: 'drone-fifth', weight: 3, sustain: true, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 0.76 },
      { at: 8, dur: 8, tone: 'fifth', vel: 0.66 },
    ] },
  ],
  comp: [
    // Three beats of figure against a four-beat bar. See the header.
    { name: 'five-string-roll', weight: 6, voices: 3, voicing: 'quartal', arpeggio: true,
      arpDirection: 'updown', cycle: 12, hits: [
        { at: 0, dur: 2, vel: 0.5 },
        { at: 2, dur: 2, vel: 0.36 },
        { at: 4, dur: 2, vel: 0.42 },
        { at: 6, dur: 2, vel: 0.36 },
        { at: 8, dur: 2, vel: 0.44 },
        { at: 10, dur: 2, vel: 0.36 },
      ] },
    { name: 'open-fifth', weight: 4, voices: 2, voicing: 'quartal', sustain: true, hits: [
      { at: 0, dur: 16, vel: 0.4 },
    ] },
    { name: 'thumb-and-back', weight: 4, voices: 3, voicing: 'quartal', arpeggio: true,
      arpDirection: 'downup', cycle: 20, hits: [
        { at: 0, dur: 4, vel: 0.48 },
        { at: 4, dur: 4, vel: 0.36 },
        { at: 8, dur: 4, vel: 0.4 },
        { at: 12, dur: 4, vel: 0.36 },
        { at: 16, dur: 4, vel: 0.34 },
      ] },
  ],
  drums: SILENT,
  melody: { leap: 0.16, ornament: 0.2, span: 12, sequence: 0.62, syncopation: 0.12 },
};

/**
 * KARJANHUUTO — the herding call, and the only unaccompanied style here.
 *
 * A woman standing at the edge of a forest pasture calling cattle home, and
 * another one a kilometre away answering her. It is not song and it is not
 * speech: it is a signal built to travel, which is why it lives at the top of
 * the voice, why it is made almost entirely of leaps, and why every phrase ends
 * on a note held until the breath runs out. The two callers are the whole
 * texture, so every layer but `melody` and `counter` is excluded — there is no
 * bass in a field.
 *
 * **This is not a joik and is deliberately not written as one.** The obvious
 * neighbouring material is Sámi, and a Finnish genre helping itself to it would
 * be the same mistake reggae's title generator refuses when it declines to write
 * in patois. The herding calls are Finnish and Karelian, they are documented at
 * length, and they do the musical job the brief wanted a chant for — free
 * rhythm, no harmony, and a melody built out of the interval rather than the
 * scale. What is *not* here is any claim about anybody else's tradition.
 *
 * ## Pentatonic, and the rule that has to come off for it
 *
 * `majorPentatonic` and `minorPentatonic` through the drone rule, because the
 * calls are built on the fourth, the fifth and the octave and the notes between
 * them are passed through rather than landed on — which is exactly what removing
 * the fourth and seventh degrees from the table does. The genre disables
 * `augmented-second` in its `ruleOverrides`, and this is one of the two styles
 * that need it: a minor pentatonic's tonic-to-♭3 and a major pentatonic's
 * third-to-fifth are both one scale step and three semitones, which is precisely
 * the interval the rule vetoes. Left on, the generator refuses every
 * characteristic move the scale exists to make.
 */
const karjanhuuto: Style = {
  id: 'karjanhuuto',
  label: 'Karjanhuuto (herding call)',
  description:
    'Two voices calling across a pasture. Pentatonic, unaccompanied, built out of leaps rather than steps, and every phrase held until the breath goes.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [48, 72],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  hook: 'loose',
  strictness: 'light',
  excludeLayers: ['drums', 'brass', 'comp', 'pad', 'bass'],
  requireLayers: ['melody'],
  drumFills: false,
  counterSpacing: 2,
  scaleForChord: drone('minorPentatonic', 'majorPentatonic'),
  progressions: {
    verse: [
      { chords: ['isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2'], weight: 6, note: 'Nothing is playing these. They exist so the tune has a tonic to be a fifth above' },
    ],
    chorus: [
      { chords: ['isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2'], weight: 6 },
    ],
    outro: [{ chords: ['isus2', 'isus2', 'isus2', 'isus2'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 6 },
    ],
    chorus: [
      { chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 6 },
    ],
    outro: [{ chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 5 }],
  },
  melodyCells: [
    { cell: [4, 12], weight: 5 },
    { cell: [16], weight: 5 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [2, 2, 12], weight: 3 },
    { cell: [-8, 8], weight: 3 },
    { cell: [8, 8], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [4, 12], weight: 3 },
    { cell: [-4, 12], weight: 2 },
  ],
  bass: [
    { name: 'silent', weight: 1, sustain: true, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.5 }] },
  ],
  comp: [
    { name: 'silent', weight: 1, voices: 2, voicing: 'quartal', sustain: true, hits: [
      { at: 0, dur: 16, vel: 0.3 },
    ] },
  ],
  drums: SILENT,
  /**
   * `leap: 0.55` is by a distance the largest in the project, and it is the
   * definition rather than a taste. A call is a fourth or a fifth thrown as far
   * as it will go and then a long note at the top; a call that moved by step
   * would not carry past the first stand of trees. `span: 19` — an octave and a
   * fifth — is the range those leaps need to have somewhere to go.
   */
  melody: { leap: 0.55, ornament: 0.34, span: 19, sequence: 0.24, syncopation: 0.08 },
};

/**
 * VIRSI — the folk hymn, sung the way a congregation actually sang it.
 *
 * The Lutheran hymnal arrived in Finland as printed four-part harmony at a
 * measured tempo, and what came back out of the parishes two centuries later was
 * something else entirely: half the speed, every note ornamented into three or
 * four, and the harmony either gone or reduced to whatever the precentor could
 * hold on a harmonium. The recordings of it are startling — a tune that takes
 * forty seconds a line and never once arrives where the printed version says.
 *
 * So this is not a hymn style. It is the *ornament* style: `ornament: 0.48` with
 * almost no leaping and a very small span, which is the whole gesture — the
 * written note is a destination and everything between two of them is invention.
 *
 * Unlike the four styles above it this one keeps the genre's own chord rule
 * rather than a drone, and the difference is real: a hymn does have harmony
 * under it, it is simply plagal and modal rather than functional. `iv–i` and
 * `VII–i` throughout, and no dominant anywhere — which is the one thing the
 * printed hymnal had that the parishes threw away first.
 */
const virsi: Style = {
  id: 'virsi',
  label: 'Virsi (folk hymn)',
  description:
    'The hymnal as a congregation actually sang it: half speed, every printed note ornamented into three, plagal and modal harmony, and no dominant anywhere.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [44, 66],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0.15,
  hook: 'catchy',
  excludeLayers: ['drums', 'brass'],
  requireLayers: ['comp'],
  drumFills: false,
  counterSpacing: 1,
  progressions: {
    intro: [
      { chords: ['i', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'iv', 'i', 'i'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'i', 'i'], weight: 5, note: 'Down a tone, down another, and home. An aeolian cadence needs no leading tone and this repertoire never had one' },
      { chords: ['i', 'iv', 'i', 'VII', 'VI', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'III', 'III', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'iv', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 4, note: 'The plagal close — iv to i, which is what a congregation does when nobody has told it about V' },
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 4 }],
    outro: [{ chords: ['iv', 'VII', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'IV', 'I', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'VII', 'VII', 'IV', 'IV', 'I', 'I'], weight: 5, note: 'The flat seventh in a major hymn, which is mixolydian and is what the ear reads as old' },
      { chords: ['I', 'IV', 'I', 'V', 'I', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'vi', 'vi', 'IV', 'IV', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'VII', 'VII', 'I', 'I'], weight: 4 },
      { chords: ['I', 'VII', 'IV', 'I', 'I', 'VII', 'I', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['vi', 'vi', 'IV', 'IV', 'VII', 'VII', 'I', 'I'], weight: 4 }],
    outro: [{ chords: ['IV', 'I', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [12, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'whole-bar', weight: 5, sustain: true, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.8 }] },
    { name: 'half-bars', weight: 4, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 0.82 },
      { at: 8, dur: 8, tone: 'fifth', vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'held', weight: 6, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.46 }] },
    { name: 'half-bars', weight: 4, voices: 4, hits: [
      { at: 0, dur: 8, vel: 0.48 },
      { at: 8, dur: 8, vel: 0.44 },
    ] },
    { name: 'per-beat', weight: 2, voices: 3, hits: [
      { at: 0, dur: 4, vel: 0.46 },
      { at: 4, dur: 4, vel: 0.4 },
      { at: 8, dur: 4, vel: 0.44 },
      { at: 12, dur: 4, vel: 0.4 },
    ] },
  ],
  drums: SILENT,
  melody: { leap: 0.11, ornament: 0.48, span: 11, sequence: 0.48, syncopation: 0.06 },
};

/**
 * PIIRILEIKKI — the ring dance, danced to singing and nothing else.
 *
 * A circle of people going round, singing the tune themselves, with the beat
 * kept by feet and hands. It is the one style here with percussion and no
 * instruments — `comp`, `pad` and `bass` are all excluded and the kit is a pair
 * of hands and a boot, written on `cp`, `lp` and `hp`. That combination reads as
 * an oversight and is the opposite: a village that owned no fiddle still had a
 * midsummer, and this is what it danced to.
 *
 * 2/4, because the step is a step: eight sixteenths to the bar and the whole
 * figure inside four of them. The tune is the plainest in the file and
 * `hook: 'earworm'` is why — everybody has to be able to sing it on the second
 * time round, since there is nobody else to carry it.
 */
const piirileikki: Style = {
  id: 'piirileikki',
  label: 'Piirileikki (ring dance)',
  description:
    'A circle of people singing their own dance music: 2/4, one plain tune, and the beat kept by clapping and stamping because there is no band.',
  beatsPerBar: 2,
  beatUnit: 4,
  bpm: [104, 134],
  swing: 0,
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0.2,
  hook: 'earworm',
  boxDrums: false,
  excludeLayers: ['brass', 'pad', 'comp', 'bass'],
  requireLayers: ['melody', 'drums'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'i'], weight: 5 },
      { chords: ['i', 'VII', 'i', 'VII', 'i', 'VII', 'i', 'i'], weight: 4, note: 'Two chords rocking. The double tonic, which is older than either of them being a chord' },
      { chords: ['i', 'i', 'III', 'III', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'i', 'i'], weight: 4 },
    ],
    outro: [{ chords: ['VII', 'i', 'VII', 'i'], weight: 4 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'V', 'V', 'I', 'I', 'V', 'I'], weight: 5 },
      { chords: ['I', 'I', 'VII', 'VII', 'I', 'I', 'VII', 'I'], weight: 4 },
      { chords: ['I', 'IV', 'I', 'V', 'I', 'IV', 'V', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 4 },
      { chords: ['I', 'V', 'I', 'V', 'I', 'V', 'I', 'I'], weight: 4 },
    ],
    outro: [{ chords: ['V', 'I', 'V', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2], weight: 6 },
    { cell: [4, 2, 2], weight: 5 },
    { cell: [2, 2, 4], weight: 4 },
    { cell: [4, 4], weight: 4 },
    { cell: [2, 2, 2, 1, 1], weight: 3 },
    { cell: [3, 1, 4], weight: 3 },
    { cell: [8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [8], weight: 5 },
    { cell: [4, 4], weight: 3 },
    { cell: [2, 2, 4], weight: 2 },
  ],
  bass: [
    { name: 'unused', weight: 1, hits: [{ at: 0, dur: 4, tone: 'root', vel: 0.8 }] },
  ],
  comp: [
    { name: 'unused', weight: 1, voices: 3, hits: [{ at: 4, dur: 3, vel: 0.6 }] },
  ],
  /**
   * A boot and two hands. `lp` is the stamp — the low stroke of a hand drum is
   * the nearest voice to a foot on a board, and it is emphatically not `bd`,
   * which is somebody's foot on a pedal attached to a different object. The
   * clap lands where a backbeat would and is a whole room doing it.
   */
  drums: [
    { name: 'stamp-and-clap', weight: 6, voices: {
      lp: [0], cp: [4], hp: [2, 6],
    } },
    { name: 'clapped-through', weight: 4, voices: {
      lp: [0, 4], cp: [2, 6], hp: [1, 3, 5, 7],
    } },
    { name: 'stamp-only', weight: 3, voices: {
      lp: [0, 4], hp: [6],
    } },
  ],
  melody: { leap: 0.18, ornament: 0.12, span: 12, sequence: 0.66, syncopation: 0.14 },
};

// ---------------------------------------------------------------------------
// The pelimanni layer
// ---------------------------------------------------------------------------

/**
 * POLSKA — the uneven three, and the most characteristic rhythmic fact in this
 * repertoire.
 *
 * A polska is in three and its three beats are not the same length. In the
 * Finnish and Swedish playing this comes down from, the first beat is long, the
 * second arrives late and is short, and the third is somewhere in between; the
 * dance is built on exactly that limp, and a polska played evenly is a mazurka
 * with the accent in the wrong place. Measured off the Nordic fiddle recordings
 * the proportions come out at roughly 40 : 25 : 35 per cent of the bar. In
 * sixteenths of a twelve-sixteenth bar that is 4.8 : 3.0 : 4.2, and the nearest
 * whole numbers are **5 : 3 : 4**.
 *
 * ## Why this is `groups` and not `swing`, and not a `feel`
 *
 * `Style.swing` was the obvious lever and it is the wrong one. Swing displaces
 * *offbeats* — it lengthens the first eighth of every beat and shortens the
 * second, uniformly — and the polska's asymmetry is between beats rather than
 * inside them. A swung polska is three equal beats each with a limp of its own,
 * which is a different and much worse thing: it is a shuffle in three.
 *
 * `feels` cannot say it either, and the library says so itself. `halftime`'s
 * comment is the exact statement of the boundary: *moving a hit from one beat to
 * another is rewriting the figure, which is a style and not a feel*, and
 * `displace` moves a sixteenth precisely so that it cannot do this. There is no
 * entry in `FEELS` that moves a beat, and there should not be.
 *
 * `groups` can, and it is the one field whose documentation says there is no
 * formula that recovers a grouping from a bar length. Handed `[5, 3, 4]`,
 * `metricStrength` accents slot 0, slot **5** and slot 8 — not 0, 4, 8 — and the
 * bass, comp and shot tables below are written to those slots, so the second
 * beat genuinely arrives a sixteenth late and the third a sixteenth early. That
 * is the limp, in the notes rather than only in the accents.
 *
 * ## And the other region leans the other way
 *
 * `soittokunta` in the revival era carries `[4, 3, 5]` — short second beat,
 * *long* third — which is the Kaustinen playing and the reverse of this one. The
 * two are the same dance and the pair is the point: the unevenness is a regional
 * dialect, not a genre-wide swing setting, which is the second reason it could
 * not have lived on a genre or a feel.
 *
 * The band is a fiddle, a second fiddle and a bass, and there is no drummer in
 * it. The pulse of a polska is a boot on a plank and the boot belongs to the
 * fiddler.
 */
const polska: Style = {
  id: 'polska',
  label: 'Polska',
  description:
    'The uneven three: a long first beat, a short second arriving late, and a third in between. 5:3:4 in sixteenths, which is what the Nordic fiddle recordings measure.',
  beatsPerBar: 3,
  beatUnit: 4,
  /** Long, short, medium — 40:25:35 of the bar, to the nearest sixteenth. */
  groups: [5, 3, 4],
  bpm: [104, 134],
  /** Nought, and deliberately: the limp is in `groups`. See the header. */
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.56, major: 0.44 },
  relativeMajorChorus: 0.3,
  excludeLayers: ['drums', 'brass'],
  drumFills: false,
  /**
   * The band together on the group heads, and the second figure without the
   * third beat — which is what a fiddler's foot does when the tune turns over.
   * Written out rather than derived, because the derived default would offer the
   * anticipated version of these and an anticipation in an uneven three lands
   * inside the short beat, where there is no room for it.
   */
  shots: [[[0, 5, 8], 5], [[0, 5], 3], [[0, 8], 2]],
  /**
   * The dance goes forward, and that is all this table says.
   *
   * `driving` is the whole band a hair in front of the grid playing short, which
   * is a polska at the end of a long evening. `pocket` is deliberately absent
   * and its absence is the argument: a pocket is the bass leaning early and the
   * *backbeat* dragging, and there is no backbeat here — there is no kit at all,
   * and the one thing that must not drag is the second beat, which is already
   * the shortest thing in the bar.
   */
  feels: [['straight', 6], ['driving', 3]],
  progressions: {
    intro: [
      { chords: ['i', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'V', 'i'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'V', 'i'], weight: 5, note: 'The flat seventh going out and a real dominant coming back — the two harmonic layers of this repertoire in one strain' },
      { chords: ['i', 'iv', 'i', 'V', 'i', 'iv', 'V', 'i'], weight: 4 },
      { chords: ['i', 'i', 'III', 'III', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VII', 'VII', 'i', 'i', 'V', 'i'], weight: 5, note: 'Out to the relative major for the second strain, which is what a two-strain fiddle tune does' },
      { chords: ['i', 'V', 'i', 'V', 'i', 'iv', 'V', 'i'], weight: 4 },
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'i', 'i', 'VII', 'VII', 'V', 'V'], weight: 3 }],
    outro: [{ chords: ['V', 'i', 'V', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'V', 'V', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V', 'V', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'I', 'V', 'I', 'IV', 'V', 'I'], weight: 4 },
      { chords: ['I', 'I', 'VII', 'VII', 'IV', 'IV', 'I', 'I'], weight: 4, note: 'The mixolydian strain — a flat seventh with no dominant in sight, and the older of the two habits' },
      { chords: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'V', 'I'], weight: 2 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'VII', 'IV', 'I', 'I', 'V', 'I', 'I'], weight: 4 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'V', 'V', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'V', 'V', 'I', 'I', 'V', 'I'], weight: 3 }],
    outro: [{ chords: ['V', 'I', 'V', 'I'], weight: 4 }],
  },
  /**
   * Twelve sixteenths, and every cell says five-three-four somewhere.
   *
   * The first is the bar itself. The rest either break at slot 5 and slot 8 —
   * which is the grouping — or run through one of them, which is the syncopation
   * that only means anything against it. A generic 3/4 cell padded to length by
   * `fitCell` would state three equal beats and quietly undo the entire style.
   */
  melodyCells: [
    { cell: [5, 3, 4], weight: 6 },
    { cell: [5, 3, 2, 2], weight: 5 },
    { cell: [2, 3, 3, 4], weight: 5 },
    { cell: [3, 2, 3, 4], weight: 4 },
    { cell: [5, 1, 2, 4], weight: 3 },
    { cell: [1, 1, 3, 3, 4], weight: 3 },
    { cell: [5, 3, 1, 1, 2], weight: 3 },
    { cell: [2, 1, 2, 3, 2, 2], weight: 2 },
    { cell: [5, 7], weight: 2 },
    { cell: [12], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 5 },
    { cell: [5, 7], weight: 4 },
    { cell: [5, 3, 4], weight: 3 },
    { cell: [8, 4], weight: 2 },
  ],
  /**
   * The bass takes the long beat and gets out of the way of the short one.
   *
   * `strong-first` is the commonest polska bass there is: the whole of beat one
   * and then nothing until the third. `all-three` plays every beat and is the
   * pattern that makes the grouping audible on its own, since the three notes
   * are 5, 3 and 4 sixteenths long rather than 4, 4 and 4.
   */
  bass: [
    { name: 'strong-first', weight: 6, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.74 },
    ] },
    { name: 'all-three', weight: 5, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 },
      { at: 5, dur: 2, tone: 'fifth', vel: 0.68 },
      { at: 8, dur: 3, tone: 'root', vel: 0.8 },
    ] },
    { name: 'held-first', weight: 3, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 1 },
      { at: 8, dur: 4, tone: 'approach', vel: 0.72 },
    ] },
  ],
  comp: [
    { name: 'two-and-three', weight: 6, voices: 3, hits: [
      { at: 5, dur: 3, vel: 0.66 },
      { at: 8, dur: 4, vel: 0.6 },
    ] },
    { name: 'short-second', weight: 4, voices: 3, hits: [
      { at: 5, dur: 2, vel: 0.72 },
      { at: 8, dur: 3, vel: 0.58 },
    ] },
    { name: 'sustained', weight: 2, voices: 3, hits: [{ at: 0, dur: 12, vel: 0.44 }] },
  ],
  drums: SILENT,
  melody: { leap: 0.26, ornament: 0.32, span: 15, sequence: 0.55, syncopation: 0.26 },
};

/**
 * MENUETTI — the Finnish fiddle minuet, and the even three the polska is not.
 *
 * The two belong together: across Ostrobothnia the standard unit of a dance
 * evening was a minuet followed by a polska, played by the same fiddler, and the
 * pair survived in Finland for a century after the minuet had disappeared from
 * everywhere else in Europe. Which is why this style declares no `groups` at
 * all. Three equal beats is the *statement* here — a menuetti is the courtly
 * import played straight, and every uneven thing in the dance evening happens in
 * the number after it.
 *
 * Slower than a polska, plainer harmonically, and stepwise: this is the tune the
 * fiddler learned from a written part two generations back.
 */
const menuetti: Style = {
  id: 'menuetti',
  label: 'Menuetti (fiddle minuet)',
  description:
    'The Ostrobothnian fiddle minuet — three even beats, courtly harmony and a stepwise tune. Played immediately before a polska, and the opposite of one.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [112, 138],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.32, major: 0.68 },
  relativeMajorChorus: 0.2,
  excludeLayers: ['drums', 'brass'],
  drumFills: false,
  progressions: {
    intro: [{ chords: ['i', 'V', 'V', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'V', 'V', 'V', 'V', 'i', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'V', 'i', 'i', 'iv', 'V', 'i'], weight: 4 },
      { chords: ['i', 'III', 'VII', 'III', 'i', 'V', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VII', 'III', 'i', 'V', 'i', 'i'], weight: 4 },
      { chords: ['i', 'V', 'i', 'V', 'iv', 'i', 'V', 'i'], weight: 4 },
    ],
    outro: [{ chords: ['V', 'i', 'V', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'V', 'V', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V', 'V', 'V', 'V', 'I', 'I'], weight: 5, note: 'Tonic and dominant, eight bars, nothing else. The imported dance brought its harmony with it' },
      { chords: ['I', 'IV', 'I', 'V', 'I', 'IV', 'V', 'I'], weight: 4 },
      { chords: ['I', 'V', 'I', 'I', 'IV', 'I', 'V', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['V', 'V', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 4 },
      { chords: ['I', 'ii', 'V', 'I', 'IV', 'I', 'V', 'I'], weight: 3 },
    ],
    outro: [{ chords: ['V', 'I', 'V', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4], weight: 6 },
    { cell: [2, 2, 4, 4], weight: 5 },
    { cell: [4, 2, 2, 4], weight: 4 },
    { cell: [8, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 4], weight: 3 },
    { cell: [4, 4, 2, 2], weight: 3 },
    { cell: [6, 2, 4], weight: 2 },
    { cell: [12], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 5 },
    { cell: [8, 4], weight: 3 },
    { cell: [4, 8], weight: 3 },
  ],
  bass: [
    { name: 'one', weight: 6, hits: [{ at: 0, dur: 3, tone: 'root', vel: 1 }] },
    { name: 'one-and-three', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'two-three', weight: 6, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.66 },
      { at: 8, dur: 3, vel: 0.6 },
    ] },
    { name: 'sustained', weight: 3, voices: 3, hits: [{ at: 0, dur: 12, vel: 0.44 }] },
  ],
  drums: SILENT,
  melody: { leap: 0.18, ornament: 0.24, span: 14, sequence: 0.52, syncopation: 0.1 },
};

/**
 * POLKKA — 2/4, fast, and the tune in eighths from the first bar to the last.
 *
 * The polka arrived from Bohemia in the 1840s and went through Finland like
 * weather; within twenty years it was the thing a village fiddler was most
 * likely to be asked for. It is the plainest harmony in the repertoire — tonic
 * and dominant and very little else — because everything that is interesting
 * about it is in the right hand.
 *
 * 2/4 rather than 4/4 and the difference is not notation. Eight sixteenths to
 * the bar means the phrase turns over every two beats rather than every four,
 * and the melody cells are correspondingly one gesture long: a polkka strain is
 * a two-beat figure said four times with the last one changed.
 *
 * A frame drum where there is one, which by the pelimanni era is a wedding with
 * money in it. `lp`/`mp`/`hp` rather than a kit, because a drum played with two
 * hands is the object — see `DrumVoice`, which argues the three strokes at
 * length.
 */
const polkka: Style = {
  id: 'polkka',
  label: 'Polkka',
  description:
    'The Bohemian import at speed: 2/4, eighths throughout, tonic and dominant and nothing else, with a frame drum under it where the wedding could afford one.',
  beatsPerBar: 2,
  beatUnit: 4,
  bpm: [112, 142],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.24, major: 0.76 },
  relativeMajorChorus: 0.15,
  hook: 'catchy',
  excludeLayers: ['brass', 'pad'],
  progressions: {
    intro: [{ chords: ['i', 'V', 'V', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'V', 'V', 'V', 'V', 'i', 'i'], weight: 5 },
      { chords: ['i', 'V', 'i', 'V', 'i', 'V', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'V', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'V', 'V', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'i', 'i', 'V', 'V', 'i', 'i'], weight: 4 },
    ],
    outro: [{ chords: ['V', 'V', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'V', 'V', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V', 'V', 'V', 'V', 'I', 'I'], weight: 6, note: 'The bluntest frame in the file, and the one most polkka strains are actually built on' },
      { chords: ['I', 'V', 'I', 'V', 'I', 'V', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'V', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['V', 'V', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 3 },
    ],
    outro: [{ chords: ['V', 'V', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2], weight: 6 },
    { cell: [1, 1, 2, 2, 2], weight: 4 },
    { cell: [2, 2, 4], weight: 4 },
    { cell: [4, 2, 2], weight: 4 },
    { cell: [3, 1, 2, 2], weight: 3 },
    { cell: [1, 1, 1, 1, 2, 2], weight: 3 },
    { cell: [-2, 2, 2, 2], weight: 3 },
    { cell: [4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [8], weight: 5 },
    { cell: [4, 4], weight: 3 },
    { cell: [2, 2, 4], weight: 3 },
  ],
  bass: [
    { name: 'oom-pah', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.82 },
    ] },
    { name: 'root-only', weight: 3, hits: [{ at: 0, dur: 3, tone: 'root', vel: 1 }] },
  ],
  comp: [
    { name: 'off-beats', weight: 6, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.7 },
      { at: 6, dur: 2, vel: 0.7 },
    ] },
    { name: 'pah', weight: 4, voices: 3, hits: [{ at: 4, dur: 3, vel: 0.74 }] },
  ],
  drums: [
    { name: 'frame-drum', weight: 5, voices: {
      lp: [0], mp: [4], hp: [2, 6],
    } },
    { name: 'frame-drum-driving', weight: 4, voices: {
      lp: [0, 4], mp: [6], hp: [2, 3, 6, 7],
    } },
    { name: 'none', weight: 4, voices: {} },
  ],
  melody: { leap: 0.3, ornament: 0.22, span: 14, sequence: 0.6, syncopation: 0.18 },
};

/**
 * SOTTIISI — the schottische, and the one pelimanni style with a genuine lean.
 *
 * Four beats and a dotted figure inside every one of them. Where the polkka runs
 * in even eighths, the sottiisi snaps: dotted-eighth, sixteenth, and the pair of
 * them repeated until the strain turns. The dance is a step-step-step-hop and
 * the snap is where the hop goes.
 *
 * `feels: [['straight', 5], ['pocket', 4]]` and this is the one place in the
 * genre a pocket belongs, for exactly the reason iskelmä's `foksi` gives about
 * itself: a pocket is a rhythm-section phenomenon and it needs a rhythm section
 * to sit in. A sottiisi has one — a bass, a comping instrument and, by this era,
 * something being hit — and the tempo is low enough that eighteen milliseconds
 * behind reads as a lean rather than as a mistake. Every other pelimanni style
 * here is a fiddle and a boot, and there is nothing for a pocket to be measured
 * against.
 */
const sottiisi: Style = {
  id: 'sottiisi',
  label: 'Sottiisi (schottische)',
  description:
    'Four beats with a dotted snap in each of them, at walking pace. Step-step-step-hop, and the hop is the sixteenth.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [112, 140],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0.2,
  excludeLayers: ['brass'],
  feels: [['straight', 5], ['pocket', 4]],
  progressions: {
    intro: [{ chords: ['i', 'V', 'V', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'V', 'V', 'V', 'V', 'i', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'i', 'V', 'i', 'iv', 'V', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'V', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VII', 'VII', 'i', 'V', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'i', 'i', 'V', 'V', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'iv', 'iv', 'V', 'V', 'i', 'i'], weight: 3 }],
    outro: [{ chords: ['V', 'V', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'V', 'V', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V', 'V', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'I', 'V', 'I', 'IV', 'V', 'I'], weight: 4 },
      { chords: ['I', 'I', 'VII', 'VII', 'IV', 'IV', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'V', 'V', 'I', 'I', 'V', 'I'], weight: 3 }],
    outro: [{ chords: ['V', 'V', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [3, 1, 4, 3, 1, 4], weight: 6 },
    { cell: [3, 1, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 3, 1, 4], weight: 4 },
    { cell: [3, 1, 3, 1, 4, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 3, 1, 4], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [6, 2, 3, 1, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'two-feel', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.82 },
    ] },
    { name: 'quarters', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.74 },
      { at: 8, dur: 3, tone: 'root', vel: 0.86 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.74 },
    ] },
  ],
  comp: [
    { name: 'off-beats', weight: 6, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.72 },
      { at: 12, dur: 3, vel: 0.72 },
    ] },
    { name: 'off-eighths', weight: 3, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.58 },
      { at: 6, dur: 2, vel: 0.66 },
      { at: 10, dur: 2, vel: 0.58 },
      { at: 14, dur: 2, vel: 0.66 },
    ] },
  ],
  drums: [
    { name: 'frame-drum', weight: 5, voices: {
      lp: [0, 8], mp: [4, 12], hp: [2, 6, 10, 14],
    } },
    { name: 'none', weight: 5, voices: {} },
  ],
  melody: { leap: 0.26, ornament: 0.24, span: 13, sequence: 0.55, syncopation: 0.24 },
};

/**
 * MASURKKA — three beats with the weight in the wrong place.
 *
 * The mazurka came up through Poland and Sweden and kept the one thing that
 * makes it itself: the accent is on the second or the third beat rather than the
 * first. That is a different asymmetry from the polska's and the pair of them
 * next to each other is worth reading — the polska bends the *lengths* of the
 * beats and the masurkka bends their *weights*, so this style declares no
 * `groups` at all and does all its work in the velocities of the comp and bass
 * tables below.
 *
 * Which is also the honest limit of what can be said here. `metricStrength` will
 * still call slot 0 the strongest slot in the bar, because it is, and no field
 * in `Style` can tell it otherwise. What the tables can do is make the *played*
 * accent land on two — a quiet root and a hard chord after it — and that is
 * enough, because a mazurka is recognised by what the band plays and not by
 * where the barline is drawn.
 */
const masurkka: Style = {
  id: 'masurkka',
  label: 'Masurkka (mazurka)',
  description:
    'Three beats with the weight on the second: a quiet root on the downbeat and the chord landing after it. The other Nordic asymmetry, and it is an accent rather than a length.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [132, 162],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.44, major: 0.56 },
  relativeMajorChorus: 0.25,
  excludeLayers: ['drums', 'brass'],
  drumFills: false,
  /** The accent, as a figure the whole band can hit: two and three, not one. */
  shots: [[[4, 8], 4], [[0, 4], 3]],
  progressions: {
    intro: [{ chords: ['i', 'V', 'V', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'V', 'V', 'V', 'V', 'i', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'V', 'i', 'i', 'iv', 'V', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'III', 'VII', 'i', 'V', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VII', 'VII', 'i', 'V', 'i', 'i'], weight: 4 },
      { chords: ['i', 'V', 'i', 'V', 'iv', 'i', 'V', 'i'], weight: 4 },
    ],
    outro: [{ chords: ['V', 'i', 'V', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'V', 'V', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V', 'V', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'I', 'V', 'I', 'IV', 'V', 'I'], weight: 4 },
      { chords: ['I', 'V', 'I', 'V', 'I', 'V', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'ii', 'V', 'I', 'IV', 'V', 'I'], weight: 3 },
    ],
    outro: [{ chords: ['V', 'I', 'V', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 4, 4], weight: 5 },
    { cell: [3, 1, 4, 4], weight: 5 },
    { cell: [4, 4, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 4], weight: 4 },
    { cell: [-2, 2, 4, 4], weight: 3 },
    { cell: [1, 1, 2, 4, 4], weight: 3 },
    { cell: [4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [4, 8], weight: 5 },
    { cell: [12], weight: 3 },
    { cell: [4, 4, 4], weight: 3 },
  ],
  /**
   * A soft root on one and a firm note on two, which is the whole style. The
   * velocity inversion is deliberate and it is the only thing here doing the
   * work: `vel: 0.6` under `vel: 0.95` says mazurka in one line where a comment
   * would only have described one.
   */
  bass: [
    { name: 'weak-one', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.6 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.95 },
    ] },
    { name: 'weak-one-three', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.62 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.95 },
      { at: 8, dur: 3, tone: 'root', vel: 0.88 },
    ] },
  ],
  comp: [
    { name: 'two-hard', weight: 6, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.86 },
      { at: 8, dur: 3, vel: 0.56 },
    ] },
    { name: 'three-hard', weight: 4, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.56 },
      { at: 8, dur: 4, vel: 0.86 },
    ] },
  ],
  drums: SILENT,
  melody: { leap: 0.28, ornament: 0.26, span: 14, sequence: 0.5, syncopation: 0.3 },
};

/**
 * KATRILLI — the quadrille, which is a form rather than a rhythm.
 *
 * Six or eight figures danced in sequence by four couples, each figure a
 * different strain and a caller shouting the changes. What that means for this
 * table is `hook: 'through'` — the one style in the genre that never brings a
 * tune back, because the whole architecture of a katrilli is *the next figure*,
 * and a set that repeated its second strain in the fifth figure would be a set
 * the dancers walked into each other during.
 *
 * The harmony is deliberately blunt for the same reason a jazz odd-metre vamp's
 * is: attention is elsewhere. Somebody is being told where to put their feet.
 */
const katrilli: Style = {
  id: 'katrilli',
  label: 'Katrilli (quadrille)',
  description:
    'Six figures for four couples with a caller over the top. A new strain every figure and none of them ever comes back.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [108, 134],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.25, major: 0.75 },
  relativeMajorChorus: 0.1,
  hook: 'through',
  excludeLayers: ['brass'],
  progressions: {
    intro: [{ chords: ['i', 'V', 'V', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'V', 'V', 'i', 'i', 'V', 'i'], weight: 5 },
      { chords: ['i', 'V', 'i', 'V', 'i', 'iv', 'V', 'i'], weight: 4 },
      { chords: ['i', 'i', 'III', 'III', 'V', 'V', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'V', 'V', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'i', 'i', 'V', 'V', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'III', 'III', 'V', 'V', 'i', 'i'], weight: 3 }],
    outro: [{ chords: ['V', 'V', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'V', 'V', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V', 'V', 'I', 'I', 'V', 'I'], weight: 5 },
      { chords: ['I', 'V', 'I', 'V', 'I', 'IV', 'V', 'I'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'IV', 'V', 'V', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['V', 'V', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'ii', 'ii', 'V', 'V', 'I', 'I'], weight: 3 }],
    outro: [{ chords: ['V', 'V', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [4, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 2, 2, 4], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 3 },
    { cell: [3, 1, 4, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  bass: [
    { name: 'two-feel', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.84 },
    ] },
    { name: 'quarters', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.76 },
      { at: 8, dur: 3, tone: 'root', vel: 0.88 },
      { at: 12, dur: 3, tone: 'fifth', vel: 0.76 },
    ] },
  ],
  comp: [
    { name: 'off-beats', weight: 6, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.74 },
      { at: 12, dur: 3, vel: 0.74 },
    ] },
    { name: 'off-eighths', weight: 3, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.6 },
      { at: 6, dur: 2, vel: 0.68 },
      { at: 10, dur: 2, vel: 0.6 },
      { at: 14, dur: 2, vel: 0.68 },
    ] },
  ],
  drums: [
    { name: 'frame-drum', weight: 5, voices: {
      lp: [0, 8], mp: [4, 12], hp: [2, 6, 10, 14],
    } },
    { name: 'none', weight: 4, voices: {} },
  ],
  melody: { leap: 0.3, ornament: 0.2, span: 14, sequence: 0.42, syncopation: 0.2 },
};

/**
 * HÄÄVALSSI — the wedding waltz, which is the number the whole evening is for.
 *
 * Fast, bright and in three, and played at the point where the bride dances with
 * everybody in the room in turn — so it goes on, which is the one thing a table
 * cannot say and the reason this style's forms lean long. Harmonically it is the
 * simplest thing here after the polkka; melodically it is the widest, because a
 * fiddler playing the number everybody has waited for plays the top of the
 * instrument.
 *
 * Related to iskelmä's `valssi` and it is worth saying how. That one is a
 * pavilion waltz written by a composer and sung by a soloist; this one is
 * anonymous, in a farmhouse, and nobody is singing. The audible difference is
 * the tempo band — a tanssilava valssi sits at 150 to 190 and this sits at 150
 * to 184 — which is to say there is barely one, and what separates them is who
 * is in the room. That is a genre distinction and not a style one, and it is
 * argued at the top of `index.ts`.
 */
const haavalssi: Style = {
  id: 'haavalssi',
  label: 'Häävalssi (wedding waltz)',
  description:
    'The wedding waltz: three beats, bright harmony, and a fiddle at the top of its range because this is the number the evening was for.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [150, 184],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.34, major: 0.66 },
  relativeMajorChorus: 0.35,
  excludeLayers: ['drums', 'brass'],
  drumFills: false,
  progressions: {
    intro: [{ chords: ['i', 'V', 'V', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'V', 'V', 'V', 'V', 'i', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'V', 'i', 'VI', 'VII', 'V', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'V', 'i', 'iv', 'V', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VII', 'VII', 'VI', 'VI', 'V', 'V'], weight: 4 },
      { chords: ['i', 'VI', 'iv', 'V', 'i', 'VI', 'V', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'iv', 'iv', 'V', 'V', 'i', 'i'], weight: 3 }],
    outro: [{ chords: ['iv', 'V', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'V', 'V', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V', 'V', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'V', 'I', 'I', 'IV', 'V', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'ii', 'V', 'I', 'IV', 'V', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'V', 'V', 'I', 'I', 'V', 'I'], weight: 3 }],
    outro: [{ chords: ['IV', 'V', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4], weight: 5 },
    { cell: [8, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 4], weight: 4 },
    { cell: [-4, 4, 4], weight: 3 },
    { cell: [4, 2, 2, 4], weight: 3 },
    { cell: [12], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 5 },
    { cell: [8, 4], weight: 3 },
    { cell: [4, 8], weight: 3 },
  ],
  bass: [
    { name: 'one', weight: 6, hits: [{ at: 0, dur: 3, tone: 'root', vel: 1 }] },
    { name: 'one-five', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.72 },
    ] },
  ],
  comp: [
    { name: 'two-three', weight: 6, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.72 },
      { at: 8, dur: 3, vel: 0.66 },
    ] },
    { name: 'sustained', weight: 2, voices: 3, hits: [{ at: 0, dur: 12, vel: 0.46 }] },
  ],
  drums: SILENT,
  melody: { leap: 0.24, ornament: 0.28, span: 17, sequence: 0.5, syncopation: 0.16 },
};

/**
 * PURPURI — the wedding suite, which is fourteen dances in a row.
 *
 * A purpuri is a fixed sequence of figures — a march in, a minuet, a polska, a
 * polkka, more marching — danced without stopping for anything up to half an
 * hour, and the fiddler is expected to know the join between each pair. Nothing
 * in this engine can generate half an hour, so what is modelled is the *seam*:
 * `hook: 'through'` so nothing comes back, and a march-shaped 2/4 that is
 * recognisably the connective tissue rather than any one of the dances it
 * connects.
 *
 * The honest note is that this is the style where the abstraction fits worst. A
 * purpuri is a container for other styles and `Style` is not a container for
 * anything; what the form and the hook setting buy is the *feeling* of a suite
 * moving forward and never repeating, which is most of what a listener takes
 * from one, and nothing at all of its actual architecture.
 */
const purpuri: Style = {
  id: 'purpuri',
  label: 'Purpuri (wedding suite)',
  description:
    'The wedding suite: a march into a minuet into a polska, danced without stopping. Modelled as the connective tissue rather than as any one of the dances.',
  beatsPerBar: 2,
  beatUnit: 4,
  bpm: [104, 128],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0.15,
  hook: 'through',
  excludeLayers: ['brass', 'pad'],
  progressions: {
    intro: [{ chords: ['i', 'V', 'V', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'V', 'V', 'i', 'i', 'V', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'V', 'i', 'i', 'VII', 'V', 'i'], weight: 4 },
      { chords: ['i', 'III', 'VII', 'III', 'i', 'V', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VII', 'VII', 'i', 'V', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'i', 'V', 'i', 'iv', 'i', 'V', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'III', 'III', 'V', 'V', 'i', 'i'], weight: 3 }],
    outro: [{ chords: ['V', 'V', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'V', 'V', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V', 'V', 'I', 'I', 'V', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'V', 'I', 'I', 'IV', 'V', 'I'], weight: 4 },
      { chords: ['I', 'I', 'VII', 'VII', 'IV', 'I', 'V', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V', 'I', 'V', 'IV', 'I', 'V', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'ii', 'ii', 'V', 'V', 'I', 'I'], weight: 3 }],
    outro: [{ chords: ['V', 'V', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 2, 2], weight: 5 },
    { cell: [2, 2, 2, 2], weight: 5 },
    { cell: [3, 1, 4], weight: 4 },
    { cell: [4, 4], weight: 4 },
    { cell: [2, 2, 4], weight: 3 },
    { cell: [-2, 2, 4], weight: 3 },
    { cell: [6, 2], weight: 2 },
  ],
  cadenceCells: [
    { cell: [8], weight: 5 },
    { cell: [4, 4], weight: 3 },
    { cell: [6, 2], weight: 2 },
  ],
  bass: [
    { name: 'march', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.82 },
    ] },
    { name: 'root-only', weight: 3, hits: [{ at: 0, dur: 4, tone: 'root', vel: 1 }] },
  ],
  comp: [
    { name: 'off-beats', weight: 6, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.68 },
      { at: 6, dur: 2, vel: 0.68 },
    ] },
    { name: 'on-two', weight: 3, voices: 3, hits: [{ at: 4, dur: 3, vel: 0.72 }] },
  ],
  drums: [
    { name: 'walked-in', weight: 5, voices: {
      lp: [0, 4], hp: [2, 6],
    } },
    { name: 'none', weight: 4, voices: {} },
  ],
  melody: { leap: 0.26, ornament: 0.22, span: 13, sequence: 0.34, syncopation: 0.18 },
};

/**
 * MARSSI — the wedding march, played walking.
 *
 * The fiddler goes first and everybody follows: out of the house, across the
 * yard, into wherever the food is. It is the one style here with a tempo
 * constraint that comes from outside the music — a march that is faster than
 * people walk is not a march, it is a polkka with the wrong name on it, and the
 * band is behind an elderly relative.
 *
 * Dotted throughout, and in 4/4 rather than the purpuri's 2/4 because a marssi
 * is a *tune* rather than a link: four beats gives a strain room to say
 * something and turn over, which is why this is the one number of the day that
 * anybody could hum afterwards.
 */
const marssi: Style = {
  id: 'marssi',
  label: 'Marssi (wedding march)',
  description:
    'The march out of the house and across the yard, at the speed people walk. Dotted figures, four beats, and the fiddler in front.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [92, 116],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.28, major: 0.72 },
  relativeMajorChorus: 0.2,
  excludeLayers: ['brass'],
  progressions: {
    intro: [{ chords: ['i', 'V', 'V', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'V', 'V', 'i', 'i', 'V', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'i', 'V', 'i', 'iv', 'V', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'III', 'VII', 'i', 'V', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VII', 'VII', 'i', 'V', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'i', 'i', 'V', 'V', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'iv', 'iv', 'V', 'V', 'i', 'i'], weight: 3 }],
    outro: [{ chords: ['V', 'V', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'V', 'V', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V', 'V', 'I', 'I', 'V', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'I', 'V', 'I', 'IV', 'V', 'I'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'IV', 'V', 'V', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V', 'IV', 'I', 'I', 'V', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'ii', 'ii', 'V', 'V', 'I', 'I'], weight: 3 }],
    outro: [{ chords: ['V', 'V', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [6, 2, 4, 4], weight: 5 },
    { cell: [3, 1, 4, 3, 1, 4], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 6, 2], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    { name: 'march', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.84 },
    ] },
    { name: 'march-quarters', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.74 },
      { at: 8, dur: 3, tone: 'root', vel: 0.88 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.74 },
    ] },
  ],
  comp: [
    { name: 'off-beats', weight: 6, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.72 },
      { at: 12, dur: 3, vel: 0.72 },
    ] },
    { name: 'held', weight: 3, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.46 }] },
  ],
  drums: [
    { name: 'walking', weight: 5, voices: {
      lp: [0, 8], mp: [4, 12], hp: [6, 14],
    } },
    { name: 'none', weight: 4, voices: {} },
  ],
  melody: { leap: 0.24, ornament: 0.22, span: 14, sequence: 0.5, syncopation: 0.22 },
};

/**
 * REKILAULU — the rhymed couplet song, and the mixolydian showcase.
 *
 * Four lines, end rhyme, two of imagery and two of what the singer actually
 * wanted to say — the form Finnish popular song came out of, and the one that
 * carried gossip, insult and courtship around a parish for two hundred years. It
 * is sung, usually unaccompanied or with a fiddle doubling, and the tunes are
 * overwhelmingly major *with a flat seventh*.
 *
 * That last fact is why this style is here rather than being folded into the
 * dances. The genre's chord rule tries mixolydian on the tonic before it tries
 * major and only falls back when a chord insists on the leading tone — see
 * `index.ts` — so a style whose tables never write a `V` is mixolydian from the
 * first bar to the last. These tables never write a `V`. `VII` does the work
 * that a dominant does elsewhere, which is exactly what a subtonic is: a note a
 * whole tone below the tonic that is going there anyway and is not being pulled.
 */
const rekilaulu: Style = {
  id: 'rekilaulu',
  label: 'Rekilaulu (rhymed couplet song)',
  description:
    'Four rhymed lines, two of scenery and two of grievance, sung to a major tune with a flat seventh. No dominant anywhere, which is what makes it mixolydian rather than major.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [88, 116],
  swing: 0,
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0.1,
  hook: 'catchy',
  excludeLayers: ['drums', 'brass'],
  drumFills: false,
  progressions: {
    intro: [{ chords: ['i', 'VII', 'i', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'i'], weight: 5 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'III', 'III', 'VII', 'VII', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['i', 'iv', 'VII', 'i', 'i', 'iv', 'i', 'i'], weight: 4 },
    ],
    outro: [{ chords: ['VII', 'VII', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'VII', 'I', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'VII', 'VII', 'I', 'I', 'VII', 'I'], weight: 6, note: 'The flat seventh doing a dominant’s job. Every bar of this is mixolydian, because no chord in it contains a leading tone for the rule to fall back on' },
      { chords: ['I', 'VII', 'IV', 'I', 'I', 'VII', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'v', 'v', 'IV', 'IV', 'I', 'I'], weight: 3, note: 'A *minor* five. The chord a functional idiom would spell as the dominant, with its third flattened so that it is not one' },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'VII', 'VII', 'I', 'I'], weight: 5 },
      { chords: ['VII', 'VII', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    outro: [{ chords: ['VII', 'VII', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [4, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    { name: 'half-bars', weight: 5, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.9 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.76 },
    ] },
    { name: 'whole-bar', weight: 4, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.84 },
    ] },
  ],
  comp: [
    { name: 'held', weight: 5, voices: 3, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.44 }] },
    { name: 'off-beats', weight: 4, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.6 },
      { at: 12, dur: 3, vel: 0.6 },
    ] },
  ],
  drums: SILENT,
  melody: { leap: 0.18, ornament: 0.3, span: 13, sequence: 0.58, syncopation: 0.14 },
};

/**
 * HAMBO — the polska with the limp taken out.
 *
 * A hambo is what happened to the polska when it went into a nineteenth-century
 * ballroom: the same dance, standardised, with the beats made equal so that
 * couples who had learned it from a book could do it. It is genuinely popular in
 * Finland-Swedish Ostrobothnia and it is genuinely not a polska, and the pair of
 * them in one file is the clearest statement this genre can make about what an
 * evening class does to a tradition.
 *
 * So: no `groups`, three even beats, and a slightly slower band than the polska
 * because a standardised dance is a dance somebody is counting. Everything else
 * — the bass on the long beat, the chords behind it — is the polska's, which is
 * the point.
 */
const hambo: Style = {
  id: 'hambo',
  label: 'Hambo',
  description:
    'The polska standardised for a ballroom: the same dance with its beats made equal. What an evening class does to a tradition, in three even beats.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [100, 124],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0.3,
  excludeLayers: ['drums', 'brass'],
  drumFills: false,
  progressions: {
    intro: [{ chords: ['i', 'V', 'V', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'V', 'V', 'V', 'V', 'i', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'V', 'i', 'i', 'iv', 'V', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'III', 'VII', 'i', 'V', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VII', 'VII', 'i', 'V', 'i', 'i'], weight: 4 },
      { chords: ['VI', 'VII', 'i', 'i', 'iv', 'V', 'i', 'i'], weight: 4 },
    ],
    outro: [{ chords: ['V', 'i', 'V', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'V', 'V', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V', 'V', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'V', 'I', 'I', 'IV', 'V', 'I'], weight: 4 },
      { chords: ['I', 'V', 'I', 'V', 'IV', 'I', 'V', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'ii', 'V', 'I', 'IV', 'V', 'I'], weight: 3 },
    ],
    outro: [{ chords: ['V', 'I', 'V', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4], weight: 6 },
    { cell: [8, 4], weight: 4 },
    { cell: [2, 2, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4], weight: 3 },
    { cell: [6, 2, 4], weight: 3 },
    { cell: [-4, 4, 4], weight: 3 },
    { cell: [12], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 5 },
    { cell: [8, 4], weight: 3 },
    { cell: [4, 8], weight: 2 },
  ],
  bass: [
    { name: 'one', weight: 6, hits: [{ at: 0, dur: 4, tone: 'root', vel: 1 }] },
    { name: 'one-three', weight: 4, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.74 },
    ] },
  ],
  comp: [
    { name: 'two-three', weight: 6, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.7 },
      { at: 8, dur: 4, vel: 0.62 },
    ] },
    { name: 'sustained', weight: 2, voices: 3, hits: [{ at: 0, dur: 12, vel: 0.44 }] },
  ],
  drums: SILENT,
  melody: { leap: 0.22, ornament: 0.26, span: 14, sequence: 0.55, syncopation: 0.18 },
};

// ---------------------------------------------------------------------------
// The revival
// ---------------------------------------------------------------------------

/**
 * SOITTOKUNTA — the pelimanni ensemble, and the polska leaning the other way.
 *
 * From 1968 the village fiddler stops being a village fiddler and becomes a
 * member of a group: eight or ten players, first and second fiddles in thirds, a
 * harmonium holding the middle, a double bass on the floor, and an audience
 * sitting in rows rather than dancing. Everything below follows from those two
 * changes — the band got large and the floor went away.
 *
 * ## `groups: [4, 3, 5]`, which is `polska`'s numbers rearranged
 *
 * The other regional polska. Where the older style has the long beat first and
 * the short one second, the Kaustinen playing this era is built on has the short
 * second beat and lengthens the **third**, so the bar leans forward into the
 * next downbeat instead of settling back from it. Same dance, same three
 * numbers, different order, and the pair is the argument for the unevenness
 * living in `groups` rather than in a genre-wide `swing`: a swing setting is one
 * number for a whole idiom and this is a dialect boundary about eighty
 * kilometres wide.
 *
 * `requireLayers: ['counter']` is the other half of the era. A second fiddle
 * playing a third under the tune is not decoration a dense arrangement adds when
 * there is room — it is what distinguishes an ensemble from a fiddler, and the
 * whole revival is the moment that stopped being optional.
 */
const soittokunta: Style = {
  id: 'soittokunta',
  label: 'Soittokunta (ensemble polska)',
  description:
    'The revival ensemble: fiddles in thirds, a harmonium in the middle and a bass on the floor — playing the Kaustinen polska, which shortens the second beat and lengthens the third.',
  beatsPerBar: 3,
  beatUnit: 4,
  /** Short second, long third — the other region's limp, and the reverse of `polska`'s. */
  groups: [4, 3, 5],
  bpm: [96, 122],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.52, major: 0.48 },
  relativeMajorChorus: 0.35,
  excludeLayers: ['drums', 'brass'],
  requireLayers: ['counter'],
  drumFills: false,
  shots: [[[0, 4, 7], 4], [[0, 7], 3]],
  progressions: {
    intro: [{ chords: ['i', 'VII', 'V', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'V', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'i', 'V', 'i', 'iv', 'V', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'V', 'i', 'i'], weight: 4 },
      { chords: ['i', 'III', 'VII', 'iv', 'VI', 'VII', 'V', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VII', 'VII', 'VI', 'VI', 'V', 'i'], weight: 5 },
      { chords: ['VI', 'VII', 'i', 'i', 'iv', 'V', 'i', 'i'], weight: 4 },
      { chords: ['i', 'V', 'i', 'V', 'iv', 'i', 'V', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'V', 'V'], weight: 3 }],
    outro: [{ chords: ['iv', 'V', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'V', 'V', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V', 'V', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'I', 'V', 'I', 'IV', 'V', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'IV', 'V', 'I', 'IV', 'V', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'VII', 'IV', 'I', 'ii', 'V', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'ii', 'ii', 'V', 'V', 'I', 'I'], weight: 3 }],
    outro: [{ chords: ['IV', 'V', 'I', 'I'], weight: 4 }],
  },
  /**
   * Twelve sixteenths again, and every cell breaks at slot 4 and slot 7 — the
   * heads of *this* grouping, which are not the heads of the polska's. A cell
   * shared between the two styles would state neither.
   */
  melodyCells: [
    { cell: [4, 3, 5], weight: 6 },
    { cell: [4, 3, 2, 3], weight: 5 },
    { cell: [2, 2, 3, 5], weight: 5 },
    { cell: [4, 1, 2, 5], weight: 4 },
    { cell: [2, 2, 3, 2, 3], weight: 3 },
    { cell: [4, 3, 1, 1, 3], weight: 3 },
    { cell: [1, 1, 2, 3, 5], weight: 3 },
    { cell: [7, 5], weight: 2 },
    { cell: [12], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 5 },
    { cell: [7, 5], weight: 4 },
    { cell: [4, 3, 5], weight: 3 },
    { cell: [4, 8], weight: 2 },
  ],
  bass: [
    { name: 'first-and-third', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 7, dur: 4, tone: 'fifth', vel: 0.78 },
    ] },
    { name: 'all-three', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 4, dur: 2, tone: 'fifth', vel: 0.68 },
      { at: 7, dur: 4, tone: 'root', vel: 0.82 },
    ] },
    { name: 'held', weight: 3, hits: [
      { at: 0, dur: 6, tone: 'root', vel: 0.96 },
      { at: 7, dur: 5, tone: 'approach', vel: 0.74 },
    ] },
  ],
  comp: [
    { name: 'harmonium-two-three', weight: 6, voices: 4, hits: [
      { at: 4, dur: 3, vel: 0.6 },
      { at: 7, dur: 5, vel: 0.56 },
    ] },
    { name: 'harmonium-held', weight: 4, voices: 4, sustain: true, hits: [
      { at: 0, dur: 12, vel: 0.46 },
    ] },
    { name: 'short-second', weight: 3, voices: 3, hits: [
      { at: 4, dur: 2, vel: 0.66 },
      { at: 7, dur: 4, vel: 0.56 },
    ] },
  ],
  drums: SILENT,
  melody: { leap: 0.24, ornament: 0.3, span: 16, sequence: 0.55, syncopation: 0.24 },
};

/**
 * HIDASVALSSI — the slow waltz the revival wrote for itself.
 *
 * The one style in the file that is not traditional material and does not
 * pretend to be. What the pelimanni revival mostly produced, once it had an
 * audience sitting down in front of it, was *new tunes in the idiom*: slow
 * waltzes in a minor key, fiddles in thirds and sixths over a harmonium, a
 * melody with a long held note at the end of every phrase, and a title about
 * something that has stopped. They are unembarrassed and enormously popular and
 * they are the reason this genre has a concert audience at all.
 *
 * `feels: [['straight', 5], ['laidback', 4]]` — behind the beat, held long, and
 * the metre allowed to go soft, which is exactly what an ensemble of ten fiddles
 * does to a waltz when nobody is dancing to it. The accent array `laidback`
 * carries is periodic in four sixteenths and a 3/4 bar is twelve, so it tiles
 * cleanly here; that is not true of everything in the library and it is why this
 * table names two entries rather than four.
 */
const hidasvalssi: Style = {
  id: 'hidasvalssi',
  label: 'Hidas valssi (slow waltz)',
  description:
    'The revival’s own music rather than anybody’s tradition: a slow minor waltz, fiddles in thirds over a harmonium, and a held note at the end of every phrase.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [78, 104],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.76, major: 0.24 },
  relativeMajorChorus: 0.45,
  excludeLayers: ['drums', 'brass'],
  requireLayers: ['counter'],
  drumFills: false,
  feels: [['straight', 5], ['laidback', 4]],
  progressions: {
    intro: [{ chords: ['i', 'VII', 'V', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'V', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'VII', 'III', 'VI', 'iv', 'V', 'i'], weight: 4, note: 'Round the circle and home, which is what a revival composer reached for when they wanted the tune to sound written' },
      { chords: ['i', 'VII', 'VI', 'V', 'i', 'iv', 'V', 'i'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'V', 'V', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VI', 'VI', 'iv', 'iv', 'V', 'V'], weight: 5 },
      { chords: ['VI', 'VII', 'i', 'i', 'iv', 'V', 'i', 'i'], weight: 4 },
      { chords: ['i', 'VI', 'iv', 'V', 'i', 'VI', 'V', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'VI', 'VI', 'III', 'VII', 'V', 'V'], weight: 3 }],
    outro: [{ chords: ['iv', 'V', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'V', 'V', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'IV', 'I', 'V', 'vi', 'IV', 'V', 'I'], weight: 5 },
      { chords: ['I', 'vi', 'ii', 'V', 'I', 'IV', 'V', 'I'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'IV', 'V', 'V', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'ii', 'V', 'I', 'I'], weight: 4 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'V', 'V', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'vi', 'vi', 'ii', 'V', 'I', 'I'], weight: 3 }],
    outro: [{ chords: ['IV', 'V', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4], weight: 5 },
    { cell: [8, 4], weight: 5 },
    { cell: [4, 8], weight: 4 },
    { cell: [2, 2, 4, 4], weight: 4 },
    { cell: [12], weight: 4 },
    { cell: [6, 2, 4], weight: 3 },
    { cell: [-4, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [12], weight: 6 },
    { cell: [8, 4], weight: 3 },
    { cell: [4, 8], weight: 2 },
  ],
  bass: [
    { name: 'one', weight: 6, hits: [{ at: 0, dur: 4, tone: 'root', vel: 0.94 }] },
    { name: 'one-five', weight: 4, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 0.94 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.7 },
    ] },
    { name: 'held', weight: 3, sustain: true, hits: [{ at: 0, dur: 12, tone: 'root', vel: 0.82 }] },
  ],
  comp: [
    { name: 'two-three', weight: 6, voices: 4, hits: [
      { at: 4, dur: 3, vel: 0.58 },
      { at: 8, dur: 4, vel: 0.52 },
    ] },
    { name: 'harmonium-held', weight: 4, voices: 4, sustain: true, hits: [
      { at: 0, dur: 12, vel: 0.44 },
    ] },
  ],
  drums: SILENT,
  melody: { leap: 0.2, ornament: 0.32, span: 16, sequence: 0.48, syncopation: 0.12 },
};

/**
 * KONSERTTIKANTELE — the big kantele, on a stage, with a music stand.
 *
 * The revival did one thing to the kantele that nothing else had: it made it a
 * concert instrument. The thirty-six-string chromatic kantele has a lever
 * mechanism, a repertoire written for it, and players who studied. Everything
 * `soitto` is defined by — five strings, one sonority, a figure that drifts —
 * stops being true, and what replaces it is *range*.
 *
 * Hence `arpOctaves: 2`, which is the field's own argument arriving in the one
 * place it is literally true: the figure climbs two octaves and drops back, and
 * `generateComp` voices the chord an octave lower to make room so it occupies
 * the same span it always did and starts from further down. On a five-string
 * instrument that would be a lie; here it is a description of what the right
 * hand does.
 *
 * The harmony moves, too, which is the other half of the difference. `soitto`
 * has one chord for eight bars because the strings are tuned to it; this has a
 * progression, because the levers exist precisely so that it can.
 */
const konserttikantele: Style = {
  id: 'konserttikantele',
  label: 'Konserttikantele (concert kantele)',
  description:
    'The thirty-six-string kantele with levers on it: two octaves of arpeggio, a harmony that actually moves, and a player who studied.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [64, 92],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0.3,
  excludeLayers: ['drums', 'brass'],
  requireLayers: ['comp'],
  drumFills: false,
  counterSpacing: 1,
  /**
   * The same instrument and a different player. `soitto` vamps because a
   * five-string kantele can only vamp; this one has thirty-six strings, levers
   * and a repertoire, so the left hand does what a trained left hand does —
   * chords with the line, answers in the gaps, and the occasional octave.
   * `ostinato` is gone entirely, which is the difference between an instrument
   * you hold a drone on and an instrument you accompany yourself on.
   */
  twoHanded: {
    instruments: [['kantele', 8], ['harp', 2]],
    density: 0.75,
    modes: [['block', 4], ['answer', 4], ['unison', 2]],
  },
  progressions: {
    intro: [{ chords: ['i', 'VII', 'VI', 'VII'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'iv', 'VII', 'III', 'VI', 'iv', 'V', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'iv', 'V'], weight: 4 },
      { chords: ['i', 'i', 'III', 'III', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'III', 'III', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'V', 'V'], weight: 3 }],
    outro: [{ chords: ['VI', 'VII', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'IV', 'I', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 5 },
      { chords: ['I', 'VII', 'IV', 'I', 'I', 'VII', 'IV', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'IV', 'V', 'I', 'IV', 'V', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'V', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'vi', 'vi', 'V', 'V', 'I', 'I'], weight: 3 }],
    outro: [{ chords: ['IV', 'I', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [4, 2, 2, 8], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [16], weight: 3 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 3 },
    { cell: [4, 12], weight: 2 },
  ],
  bass: [
    { name: 'half-bars', weight: 5, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.84 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.72 },
    ] },
    { name: 'held', weight: 4, sustain: true, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.78 }] },
  ],
  comp: [
    { name: 'two-octave-roll', weight: 6, voices: 4, arpeggio: true, arpDirection: 'updown',
      arpOctaves: 2, hits: [
        { at: 0, dur: 2, vel: 0.5 },
        { at: 2, dur: 2, vel: 0.38 },
        { at: 4, dur: 2, vel: 0.44 },
        { at: 6, dur: 2, vel: 0.38 },
        { at: 8, dur: 2, vel: 0.46 },
        { at: 10, dur: 2, vel: 0.38 },
        { at: 12, dur: 2, vel: 0.44 },
        { at: 14, dur: 2, vel: 0.38 },
      ] },
    { name: 'spread', weight: 4, voices: 4, arpeggio: true, arpDirection: 'up', arpOctaves: 2,
      cycle: 12, hits: [
        { at: 0, dur: 3, vel: 0.48 },
        { at: 3, dur: 3, vel: 0.38 },
        { at: 6, dur: 3, vel: 0.42 },
        { at: 9, dur: 3, vel: 0.38 },
      ] },
    { name: 'held', weight: 3, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.42 }] },
  ],
  drums: SILENT,
  melody: { leap: 0.2, ornament: 0.24, span: 16, sequence: 0.5, syncopation: 0.12 },
};

/**
 * TANHU — folk dance performed rather than danced.
 *
 * A tanhu group is thirty people in national costume doing a set of figures on a
 * stage in front of an audience that is not going to join in, and the music for
 * it is a specific thing: brighter, tighter and about eight beats per minute
 * faster than the same tune played for a floor, because it has to be visible
 * from the back row rather than danceable from the middle of it. It is also the
 * one part of this repertoire that acquired percussion for a reason that has
 * nothing to do with the tradition — a stage needs the entries to land together.
 *
 * `boxDrums: false` and it matters more here than anywhere else in the file: the
 * whole point of the drum in a tanhu is that somebody is watching the dancers
 * and hitting it where they land, which is precisely what a preset pattern is
 * incapable of.
 */
const tanhu: Style = {
  id: 'tanhu',
  label: 'Tanhu (performed folk dance)',
  description:
    'Folk dance on a stage rather than a floor: the same tunes, brighter and a shade faster, with a drum keeping thirty pairs of feet landing together.',
  beatsPerBar: 2,
  beatUnit: 4,
  bpm: [118, 148],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0.2,
  hook: 'catchy',
  excludeLayers: ['pad', 'brass'],
  progressions: {
    intro: [{ chords: ['i', 'V', 'V', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'V', 'V', 'i', 'i', 'V', 'i'], weight: 5 },
      { chords: ['i', 'VII', 'i', 'V', 'i', 'VII', 'V', 'i'], weight: 4 },
      { chords: ['i', 'iv', 'i', 'V', 'i', 'iv', 'V', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VII', 'VII', 'i', 'V', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'i', 'i', 'V', 'V', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'III', 'III', 'V', 'V', 'i', 'i'], weight: 3 }],
    outro: [{ chords: ['V', 'V', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'V', 'V', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V', 'V', 'I', 'I', 'V', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'I', 'V', 'I', 'IV', 'V', 'I'], weight: 4 },
      { chords: ['I', 'V', 'I', 'V', 'I', 'V', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'VII', 'IV', 'I', 'V', 'V', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'ii', 'ii', 'V', 'V', 'I', 'I'], weight: 3 }],
    outro: [{ chords: ['V', 'V', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2], weight: 6 },
    { cell: [3, 1, 4], weight: 5 },
    { cell: [4, 2, 2], weight: 4 },
    { cell: [1, 1, 2, 2, 2], weight: 4 },
    { cell: [2, 2, 4], weight: 3 },
    { cell: [4, 4], weight: 3 },
    { cell: [-2, 2, 2, 2], weight: 2 },
  ],
  cadenceCells: [
    { cell: [8], weight: 5 },
    { cell: [4, 4], weight: 3 },
    { cell: [6, 2], weight: 2 },
  ],
  bass: [
    { name: 'oom-pah', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.84 },
    ] },
    { name: 'quarters', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 2, dur: 2, tone: 'root', vel: 0.7 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.84 },
      { at: 6, dur: 2, tone: 'approach', vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'off-beats', weight: 6, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.74 },
      { at: 6, dur: 2, vel: 0.74 },
    ] },
    { name: 'on-two', weight: 3, voices: 3, hits: [{ at: 4, dur: 3, vel: 0.78 }] },
  ],
  drums: [
    { name: 'stage-drum', weight: 6, voices: {
      lp: [0], mp: [4], hp: [2, 6], tb: [2, 6],
    } },
    { name: 'stage-drum-driving', weight: 4, voices: {
      lp: [0, 4], mp: [6], hp: [1, 3, 5, 7], tb: [4],
    } },
  ],
  melody: { leap: 0.3, ornament: 0.2, span: 14, sequence: 0.58, syncopation: 0.2 },
};

// ---------------------------------------------------------------------------
// The contemporary layer
// ---------------------------------------------------------------------------

/**
 * POLJENTO — seven eight, and the one metre in this genre nobody inherited.
 *
 * The Sibelius Academy folk department opened in 1983 and the first thing it
 * produced was players who could read, had heard Balkan music, and were not
 * going to spend a career playing polkkas at weddings. What came out is a
 * repertoire of new tunes in odd metres over dorian riffs — and this style is
 * the honest version of that: `beatsPerBar: 3.5` at `beatUnit: 8` with
 * `groups: [4, 4, 6]`, which is fourteen sixteenths grouped 2+2+3.
 *
 * The metre is genuinely a borrowing rather than a survival, and that is worth
 * saying out loud in a file whose other twenty-three styles are all claiming
 * descent from something. Nothing in the Finnish tradition is in seven. What the
 * tradition *does* have is an uneven bar — the polska's, three beats of three
 * different lengths — and the argument the Academy players make, which is a good
 * one, is that a fiddler raised on a 5:3:4 already knows how to play a 2+2+3 and
 * a fiddler raised on a march does not.
 *
 * Full kit here, and it is the first one in the file. By this point the band has
 * a drummer, a bass player with an amplifier and a sound engineer, and the honest
 * consequence is that this style shares more with a rock rhythm section than
 * with anything above it.
 */
const poljento: Style = {
  id: 'poljento',
  label: 'Poljento (odd metre)',
  description:
    'Seven eight, grouped two-two-three, over a dorian riff: the Sibelius Academy folk department, a full kit, and a metre nobody in Finland inherited.',
  beatsPerBar: 3.5,
  beatUnit: 8,
  /** 2+2+3, in sixteenths. Fourteen of them, which is three and a half quarters. */
  groups: [4, 4, 6],
  bpm: [126, 168],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.78, major: 0.22 },
  relativeMajorChorus: 0.15,
  hook: 'catchy',
  excludeLayers: ['brass'],
  requireLayers: ['drums'],
  feels: [['straight', 5], ['driving', 4]],
  shots: [[[0, 4, 8], 5], [[0, 8], 3], [[0, 4, 8, 12], 2]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'VII', 'VII'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 5, note: 'A vamp. In a metre the listener is still counting, the harmony has to hold still — the same argument jazz’s odd metre makes' },
      { chords: ['i', 'i', 'IV', 'IV', 'i', 'i', 'VII', 'VII'], weight: 4, note: 'The major IV under a minor tonic: the dorian sixth, and the brightest note this genre has' },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['IV', 'IV', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 3 }],
    solo: [
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'IV', 'IV', 'i', 'i', 'VII', 'VII'], weight: 3 },
    ],
    outro: [{ chords: ['VII', 'VII', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'VII', 'VII'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'VII', 'VII', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'IV', 'IV', 'VII', 'VII', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'VII', 'VII', 'I', 'I', 'I', 'I'], weight: 5 },
      { chords: ['VII', 'VII', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['vi', 'vi', 'IV', 'IV', 'VII', 'VII', 'I', 'I'], weight: 3 }],
    solo: [{ chords: ['I', 'I', 'I', 'I', 'VII', 'VII', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['VII', 'VII', 'I', 'I'], weight: 4 }],
  },
  /**
   * Fourteen sixteenths, and the ones that break at 4 and 8 are the grouping.
   * `[4, 4, 6]` is the bar said plainly; `[6, 4, 4]` is the same three lengths in
   * the other order, which is the commonest thing these tunes do to keep a vamp
   * from becoming a loop.
   */
  melodyCells: [
    { cell: [4, 4, 6], weight: 6 },
    { cell: [2, 2, 4, 6], weight: 5 },
    { cell: [4, 4, 2, 2, 2], weight: 4 },
    { cell: [6, 4, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 3, 3], weight: 3 },
    { cell: [4, 2, 2, 2, 4], weight: 3 },
    { cell: [-2, 2, 4, 6], weight: 3 },
    { cell: [8, 6], weight: 2 },
    { cell: [14], weight: 2 },
  ],
  cadenceCells: [
    { cell: [14], weight: 5 },
    { cell: [8, 6], weight: 4 },
    { cell: [4, 4, 6], weight: 3 },
  ],
  bass: [
    { name: 'grouping', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 4, dur: 3, tone: 'root', vel: 0.82 },
      { at: 8, dur: 5, tone: 'fifth', vel: 0.9 },
    ] },
    { name: 'riff', weight: 5, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 },
      { at: 3, dur: 1, tone: 'root', vel: 0.7 },
      { at: 4, dur: 3, tone: -2, vel: 0.86 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.9 },
      { at: 12, dur: 2, tone: 'root', vel: 0.76 },
    ] },
    { name: 'heads-only', weight: 3, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 },
      { at: 8, dur: 5, tone: 'root', vel: 0.86 },
    ] },
  ],
  comp: [
    { name: 'chopped', weight: 6, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.72 },
      { at: 4, dur: 2, vel: 0.62 },
      { at: 8, dur: 2, vel: 0.68 },
      { at: 11, dur: 2, vel: 0.56 },
    ] },
    { name: 'off-the-heads', weight: 4, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.62 },
      { at: 6, dur: 2, vel: 0.62 },
      { at: 10, dur: 2, vel: 0.66 },
    ] },
    { name: 'held', weight: 2, voices: 4, sustain: true, hits: [{ at: 0, dur: 14, vel: 0.44 }] },
  ],
  drums: [
    { name: 'two-two-three', weight: 6, voices: {
      bd: [0, 8], sd: [4], hh: [0, 2, 4, 6, 8, 10, 12],
    } },
    { name: 'two-two-three-open', weight: 4, voices: {
      bd: [0, 6, 8], sd: [4, 11], hh: [0, 2, 4, 6, 8, 11], oh: [12],
    } },
    { name: 'ride-in-seven', weight: 3, voices: {
      bd: [0, 8], rim: [4], rd: [0, 4, 8, 11],
    } },
  ],
  melody: { leap: 0.32, ornament: 0.24, span: 17, sequence: 0.5, syncopation: 0.4 },
};

/**
 * SÄHKÖPELIMANNI — the pelimanni band plugged in.
 *
 * Fiddle through a pickup and a bit of gain, an electric bass, a drummer, and a
 * polska riff played as a riff. The tunes are the same tunes and the harmony is
 * the same two chords; what has changed is that the fiddle is now the loudest
 * thing in a room rather than the only thing in it, and a part written to carry
 * over a hall full of dancers is being played through a wedge.
 *
 * `layerPlan` on the genre already says the rhythm section here does not swell
 * much, and this is the style where that is least true — so it is also the style
 * that names `driving` in its own `feels`, which is the band leaning in at the
 * last chorus rather than the arrangement adding anything. Nothing is added,
 * because there is nothing left to add: this band is five people and all five
 * are already playing.
 */
const sahkopelimanni: Style = {
  id: 'sahkopelimanni',
  label: 'Sähköpelimanni (amplified folk)',
  description:
    'The pelimanni band through an amplifier: the same two chords and the same tune, played as a riff, with a drummer and a wedge.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [112, 148],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.72, major: 0.28 },
  relativeMajorChorus: 0.2,
  hook: 'catchy',
  excludeLayers: ['brass'],
  requireLayers: ['drums'],
  feels: [['straight', 5], ['driving', 4]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'VII', 'VII'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'IV', 'IV', 'i', 'i', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['IV', 'IV', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['III', 'VII', 'iv', 'VI', 'III', 'VII', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 3 }],
    solo: [
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'IV', 'IV', 'i', 'i', 'VII', 'VII'], weight: 3 },
    ],
    outro: [{ chords: ['VII', 'VII', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'VII', 'VII'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'VII', 'VII', 'I', 'I', 'VII', 'VII'], weight: 5 },
      { chords: ['I', 'I', 'IV', 'IV', 'VII', 'VII', 'I', 'I'], weight: 4 },
      { chords: ['I', 'V', 'IV', 'I', 'I', 'V', 'IV', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'VII', 'VII', 'I', 'I'], weight: 5 },
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'vi', 'vi', 'VII', 'VII', 'I', 'I'], weight: 3 }],
    solo: [{ chords: ['I', 'I', 'VII', 'VII', 'I', 'I', 'VII', 'VII'], weight: 5 }],
    outro: [{ chords: ['VII', 'VII', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [4, 2, 2, 4, 4], weight: 5 },
    { cell: [3, 1, 4, 3, 1, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 2, 2, 4], weight: 4 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    { name: 'riff', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 3, dur: 1, tone: 'root', vel: 0.7 },
      { at: 6, dur: 2, tone: -2, vel: 0.84 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.9 },
      { at: 12, dur: 3, tone: 'root', vel: 0.82 },
    ] },
    { name: 'eighths', weight: 4, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 },
      { at: 2, dur: 2, tone: 'root', vel: 0.7 },
      { at: 4, dur: 2, tone: 'root', vel: 0.82 },
      { at: 6, dur: 2, tone: 'root', vel: 0.7 },
      { at: 8, dur: 2, tone: 'root', vel: 0.88 },
      { at: 10, dur: 2, tone: 'root', vel: 0.7 },
      { at: 12, dur: 2, tone: 'fifth', vel: 0.82 },
      { at: 14, dur: 2, tone: 'approach', vel: 0.72 },
    ] },
    { name: 'two-feel', weight: 3, hits: [
      { at: 0, dur: 6, tone: 'root', vel: 1 },
      { at: 8, dur: 6, tone: 'fifth', vel: 0.84 },
    ] },
  ],
  comp: [
    { name: 'chop', weight: 6, voices: 3, hits: [
      { at: 4, dur: 2, vel: 0.78 },
      { at: 12, dur: 2, vel: 0.78 },
    ] },
    { name: 'chopped-eighths', weight: 4, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.6 },
      { at: 6, dur: 2, vel: 0.7 },
      { at: 10, dur: 2, vel: 0.6 },
      { at: 14, dur: 2, vel: 0.7 },
    ] },
    { name: 'held', weight: 2, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.46 }] },
  ],
  drums: [
    { name: 'backbeat', weight: 6, voices: {
      bd: [0, 8], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'driving', weight: 4, voices: {
      bd: [0, 6, 8, 14], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'hands-and-kit', weight: 3, voices: {
      bd: [0, 8], sd: [4, 12], lp: [6], hp: [2, 10, 14], tb: [4, 12],
    } },
  ],
  melody: { leap: 0.3, ornament: 0.26, span: 16, sequence: 0.55, syncopation: 0.34 },
};

/**
 * KARJALANLAULU — the Kalevala metre with a rhythm section behind it.
 *
 * The vocal ensembles that came out of the folk department took their material
 * from the Karelian and Ingrian collections, which is to say from exactly the
 * repertoire `runolaulu` is: trochaic tetrameter, eight syllables, five beats
 * grouped three-and-two. So this style carries the *same* `groups: [12, 8]`
 * eight hundred years later, and the pair of them at opposite ends of the file
 * is the strongest single thing this genre can say about itself.
 *
 * What changed is everything underneath. `runolaulu` is one voice over a drone
 * with no harmony and no pulse to speak of; this is four voices in unison over a
 * bass, a kit and a chopped fiddle, at a hundred and ten, with the harmony
 * moving every two bars. The metre survived the trip intact and nothing else
 * did, which is a fair description of what a revival is.
 *
 * `hook: 'earworm'` for the same reason `runolaulu` has it, arrived at from the
 * other direction: there the tune repeats because the poem is the event, here it
 * repeats because it is a hook and the band knows it.
 */
const karjalanlaulu: Style = {
  id: 'karjalanlaulu',
  label: 'Karjalanlaulu (Karelian song, amplified)',
  description:
    'Kalevala metre with a band behind it: the same five beats grouped three-and-two as the runo singer, over a bass, a kit and a chopped fiddle.',
  beatsPerBar: 5,
  beatUnit: 4,
  /** The runo singer's grouping, unchanged. See the header. */
  groups: [12, 8],
  bpm: [92, 124],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.82, major: 0.18 },
  relativeMajorChorus: 0.15,
  hook: 'earworm',
  excludeLayers: ['brass'],
  requireLayers: ['drums'],
  shots: [[[0, 12], 5], [[0, 6, 12], 3], [[0, 12, 16], 2]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'VII', 'VII'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'IV', 'IV', 'i', 'i', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['III', 'VII', 'i', 'i', 'III', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 3 }],
    solo: [{ chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 5 }],
    outro: [{ chords: ['VII', 'VII', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'VII', 'VII'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'VII', 'VII', 'I', 'I', 'VII', 'VII'], weight: 5 },
      { chords: ['I', 'I', 'IV', 'IV', 'VII', 'VII', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'VII', 'VII', 'I', 'I', 'I', 'I'], weight: 5 },
      { chords: ['vi', 'IV', 'I', 'I', 'vi', 'IV', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'vi', 'vi', 'VII', 'VII', 'I', 'I'], weight: 3 }],
    solo: [{ chords: ['I', 'I', 'VII', 'VII', 'I', 'I', 'VII', 'VII'], weight: 5 }],
    outro: [{ chords: ['VII', 'VII', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 2, 2, 4, 4], weight: 6 },
    { cell: [2, 2, 2, 2, 2, 2, 8], weight: 5 },
    { cell: [4, 2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 2, 2, 2, 2, 4], weight: 3 },
    { cell: [-2, 2, 2, 2, 2, 2, 4, 4], weight: 3 },
    { cell: [4, 4, 4, 4, 4], weight: 3 },
    { cell: [12, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12, 8], weight: 5 },
    { cell: [20], weight: 4 },
    { cell: [2, 2, 2, 2, 2, 2, 8], weight: 3 },
  ],
  bass: [
    { name: 'grouping', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 6, dur: 2, tone: 'root', vel: 0.74 },
      { at: 12, dur: 4, tone: 'fifth', vel: 0.9 },
    ] },
    { name: 'riff', weight: 5, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 },
      { at: 3, dur: 1, tone: 'root', vel: 0.7 },
      { at: 6, dur: 2, tone: -2, vel: 0.82 },
      { at: 12, dur: 3, tone: 'fifth', vel: 0.9 },
      { at: 16, dur: 3, tone: 'root', vel: 0.78 },
    ] },
    { name: 'heads', weight: 3, hits: [
      { at: 0, dur: 10, tone: 'root', vel: 1 },
      { at: 12, dur: 7, tone: 'root', vel: 0.86 },
    ] },
  ],
  comp: [
    { name: 'chopped', weight: 6, voices: 3, hits: [
      { at: 4, dur: 2, vel: 0.7 },
      { at: 8, dur: 2, vel: 0.62 },
      { at: 12, dur: 2, vel: 0.74 },
      { at: 16, dur: 2, vel: 0.62 },
    ] },
    { name: 'group-heads', weight: 4, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.7 },
      { at: 12, dur: 4, vel: 0.66 },
    ] },
    { name: 'held', weight: 2, voices: 4, sustain: true, hits: [{ at: 0, dur: 20, vel: 0.44 }] },
  ],
  drums: [
    { name: 'five-backbeat', weight: 6, voices: {
      bd: [0, 12], sd: [6, 16], hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18],
    } },
    { name: 'five-hands', weight: 4, voices: {
      bd: [0, 12], lp: [8], mp: [6, 16], hp: [2, 4, 10, 14, 18], tb: [6, 16],
    } },
    { name: 'five-open', weight: 3, voices: {
      bd: [0, 10, 12], sd: [6, 16], hh: [0, 4, 8, 12, 16], oh: [18],
    } },
  ],
  melody: { leap: 0.2, ornament: 0.26, span: 13, sequence: 0.68, syncopation: 0.16 },
};

export const STYLES: Record<string, Style> = {
  // The archaic layer.
  runolaulu,
  itkuvirsi,
  soitto,
  karjanhuuto,
  virsi,
  piirileikki,
  // The pelimanni layer.
  polska,
  menuetti,
  polkka,
  sottiisi,
  masurkka,
  katrilli,
  haavalssi,
  purpuri,
  marssi,
  rekilaulu,
  hambo,
  // The revival.
  soittokunta,
  hidasvalssi,
  konserttikantele,
  tanhu,
  // The contemporary layer.
  poljento,
  sahkopelimanni,
  karjalanlaulu,
};

export const STYLE_IDS = Object.keys(STYLES);

export function getStyle(id: string): Style {
  const s = STYLES[id];
  if (!s) throw new Error(`Unknown style "${id}". Known: ${STYLE_IDS.join(', ')}`);
  return s;
}
