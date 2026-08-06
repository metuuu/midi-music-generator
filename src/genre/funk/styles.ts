/**
 * The funk catalogue, 1968–1986.
 *
 * Organised by **what the rhythm section has agreed to do with the sixteenth
 * grid**, because that is the only axis on which this repertoire actually
 * separates. Sort it by tempo and twenty styles collapse into three; sort it by
 * key or by mode and they collapse into one, since half of this music has no
 * harmony to sort. Sort it by what the drummer, the bass and the guitar have
 * agreed about where the holes go and they stay apart — a JB side, a Meters
 * side, a go-go groove and an 808 record are four different agreements about the
 * same sixteen slots, and everything else follows from which one is in force.
 *
 * ## The four things every table below is made of
 *
 * **The One.** The bar's weight is on slot 0 and the rest of the bar is
 * negotiation. Every bass figure here puts its loudest hit at slot 0 — `vel: 1`,
 * with nothing else in the bar above 0.85 — and every `shots` table opens on
 * slot 0. That is not emphasis for its own sake: in this music the downbeat is
 * the thing the other fifteen slots are late for or early for, and a groove
 * whose bar-one is level with its bar-three is a groove with no gravity in it.
 *
 * **The chank.** A guitar playing all sixteen sixteenths with most of them
 * ghosted. Written as a `CompPattern` with a hit on *every* slot and `vel` doing
 * the whole job — the sounding notes sit at 0.65–0.8 and the damped ones at
 * 0.1–0.16, which is the difference between the pick crossing the strings and
 * the strings being allowed to speak. `mutedGuitar` in the catalogue carries a
 * 0.25-second decay for exactly this, a quarter of what an unmuted plucked
 * instrument gets. Writing the same part as four hits on the accents produces a
 * correct rhythm with no *hand* in it, which is the one thing a listener can
 * always hear.
 *
 * **The bass is a written figure, not a function.** Every riff below spells its
 * notes as **numbers** — semitones from the chord root, taken literally — and
 * not as `root`/`fifth`/`seventh`. The named functions re-outline whatever chord
 * they land on, and a riff that renegotiates has stopped being a riff: the whole
 * proposition of a funk bass line is that it is the *same fourteen notes* for
 * four minutes while everything else moves around it. See `BassTone`, which
 * makes the same argument from the other end.
 *
 * **The hole is the part.** Nothing here fills its bar. The figures are two to
 * six onsets in sixteen slots, and the silence between them is not economy — it
 * is where the next player is. See `Genre.comping`, which is set an order of
 * magnitude below jazz's for this reason: a jazz comper varies because the
 * figure is a suggestion, and a funk comper does not because the figure is the
 * song.
 *
 * ## What is uniform across all twenty-two, and why
 *
 *  - **Nothing swings but two styles.** `swing: 0` everywhere except `jbshuffle`,
 *    which is the corner of the repertoire built on a triplet sixteenth, and
 *    `souljazz`, which still has one foot in the jazz organ trio. Laying a
 *    triplet feel over a sixteenth grid deletes the grid, and the grid is the
 *    music.
 *  - **`relativeMajorChorus: 0` everywhere.** The lift into the relative major
 *    is a dance-band arranger's gesture and there is no arranger here. A funk
 *    chorus arrives because the horns came in or because the band stopped, and
 *    a modulation would announce that somebody had written a middle eight.
 *  - **Two chords is a lot.** Most verse tables below are one chord for eight
 *    bars, and the ones with four are the exception rather than the norm. That
 *    is the sharpest single difference from every other genre in this project
 *    and it is what makes `scaleForChord` answer the way it does — see
 *    `funk/index.ts`. A generator that gave this music a chord a bar would
 *    produce something perfectly respectable that no one has ever recorded.
 *  - **`syncopation` is never below 0.55.** The field is documented as an
 *    appetite for rhythm that crosses the barline, and in this repertoire the
 *    anticipated downbeat is not a decoration on the phrase, it is how the
 *    phrase knows where The One is.
 *
 * ## `cycle`, and the styles that need it
 *
 * A figure whose length is not the bar is the clav part on half the records
 * worth naming, and six styles below carry one. `cycle: 12` is three beats
 * against a four-beat bar and comes home every three bars; `cycle: 32` is a
 * two-bar riff that answers its own first half, which a bar-shaped pattern
 * cannot do at all; `cycle: 24` is a bar and a half, which is what a go-go
 * conga part is doing while the snare stays where it is.
 */

import { makeScale } from '../../core/scale.js';
import type { Style } from '../../style/types.js';

/**
 * ONE-CHORD VAMP — the JB side, and the centre of the whole genre.
 *
 * One dominant-seventh chord for four minutes. *Sex Machine*, *Give It Up or
 * Turnit a Loose*, *Mother Popcorn* — the record is a groove and a shout, the
 * band goes to the IV once for eight bars because the singer said "take it to
 * the bridge", and then it comes back. That single move is the entire harmonic
 * content, and it is in the `chorus` table below rather than the verse for
 * exactly that reason: the section boundary *is* the chord change.
 *
 * The bass figures are the reason this style exists as data rather than as an
 * anecdote. All three are numeric shapes rooted on the chord — 0, the ♭7 a tone
 * below it, the ♭3 above — and the octave leap in `octave-drop` is written as
 * `12` rather than as `'octave'` for the same reason the rest are numbers. What
 * a listener remembers off one of these records is fourteen notes in a fixed
 * order, and the fixed order is the composition.
 *
 * Major-primary and it is not a major key. `I7` is a dominant chord with no
 * dominant function anywhere in sight — nothing resolves, and the ♭3 the melody
 * puts over its major third is the blue third rather than a mistake, which is
 * the whole reason `funk/index.ts` roots the melody scale on the tonic and
 * leaves it there.
 */
const vamp: Style = {
  id: 'vamp',
  label: 'One-chord vamp',
  description:
    'One dominant seventh for the whole side, a bass riff spelled in semitones, and a guitar chanking sixteenths with most of them damped.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [96, 116],
  swing: 0,
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0,
  /**
   * The figure comes back identical and that is the point. `earworm` is the
   * honest setting for music whose proposition is the same bar again — this
   * style has one chord, so if the tune develops there is nothing underneath it
   * holding the record together.
   */
  hook: 'earworm',
  /**
   * The one style in the catalogue where `funk` is not a colour on the feel but
   * a description of the part. Short comp, ghosted snare, subdivided chords —
   * `style/feel.ts` built the gesture and named it after this.
   */
  feels: [['funk', 5], ['straight', 4], ['pocket', 2]],
  /**
   * Stop-time is native here and is at the same weight as the fill. "Give it to
   * me" and the band vanishes for a bar: that is a `break`, it is a signature
   * rather than an option, and no other genre in this project would put it level
   * with the drummer's roll. `elide` is absent — this band does not arrive
   * early, it arrives on The One.
   */
  transitions: [['fill', 4], ['break', 4], ['shot', 3]],
  shots: [[[0, 6], 5], [[0, 6, 7], 3], [[0, 3, 6], 2], [[0, 10], 2]],
  progressions: {
    intro: [
      { chords: ['I7', 'I7', 'I7', 'I7'], weight: 6, note: 'The drummer counts it off and the chord is already there' },
      { chords: ['I9', 'I9', 'I9', 'I9'], weight: 3 },
    ],
    verse: [
      { chords: ['I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7'], weight: 6, note: 'Eight bars of one chord. Not an omission — the harmony of this record is over' },
      { chords: ['I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9'], weight: 5 },
      { chords: ['I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'IV7'], weight: 3, note: 'One bar of IV in eight, on the way round — the smallest amount of movement this music admits' },
      { chords: ['I7sus4', 'I7sus4', 'I7', 'I7', 'I7sus4', 'I7sus4', 'I7', 'I7'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV7', 'IV7', 'IV7', 'IV7', 'I7', 'I7', 'I7', 'I7'], weight: 6, note: 'Take it to the bridge: four bars of IV and back. The whole modulation budget of the style' },
      { chords: ['IV9', 'IV9', 'I9', 'I9', 'IV9', 'IV9', 'I9', 'I9'], weight: 4 },
      { chords: ['bVII7', 'bVII7', 'I7', 'I7', 'bVII7', 'bVII7', 'I7', 'I7'], weight: 3, note: 'A tone below and back, which is the other direction a vamp is allowed to move' },
    ],
    bridge: [
      { chords: ['IV7', 'IV7', 'IV7', 'IV7', 'IV7', 'IV7', 'IV7', 'IV7'], weight: 5 },
      { chords: ['bVII7', 'bVII7', 'IV7', 'IV7', 'I7', 'I7', 'I7', 'I7'], weight: 3 },
    ],
    solo: [
      { chords: ['I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7'], weight: 6 },
      { chords: ['I9', 'I9', 'I9', 'I9', 'IV9', 'IV9', 'I9', 'I9'], weight: 3 },
    ],
    outro: [
      { chords: ['I7', 'I7', 'I7', 'I7'], weight: 6 },
      { chords: ['IV7', 'IV7', 'I7', 'I7'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 4 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'iv7'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv7', 'iv7', 'iv7', 'iv7', 'i7', 'i7', 'i7', 'i7'], weight: 6 },
      { chords: ['VII7', 'VII7', 'i7', 'i7', 'VII7', 'VII7', 'i7', 'i7'], weight: 3 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'iv7', 'iv7', 'iv7', 'iv7', 'iv7', 'iv7'], weight: 5 }],
    solo: [{ chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6 }],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  melodyCells: [
    { cell: [3, 3, 2, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 2, 2, 4], weight: 4 },
    { cell: [-4, 2, 2, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 2, 2, 4], weight: 3 },
    { cell: [-6, 2, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
    { cell: [-2, 3, 3, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 2 },
    { cell: [-8, 8], weight: 2 },
  ],
  bass: [
    /**
     * The One and the ♭7 under it. Slot 0 at full level, a repeat on the "and"
     * of 2 at two-thirds of it, the ♭7 a tone below the root on slot 10, and
     * home on 12. Four onsets in sixteen slots; the other twelve are the part.
     */
    { name: 'the-one', weight: 6, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.62 },
      { at: 10, dur: 2, tone: -2, vel: 0.78 },
      { at: 12, dur: 4, tone: 0, vel: 0.7 },
    ] },
    /**
     * The octave, spelled `12` rather than `'octave'`. The named function would
     * be identical here and would stop the whole figure being read as a shape by
     * anything that looks at it, including `npm run genres`, which measures the
     * declared span against what came out.
     *
     * The ♭7 sits *above* the root at 10 rather than below it at −2, and that is
     * arithmetic as much as taste: `generateBass` places the root within a
     * tritone of MIDI 40 and repairs by whole octaves, so a shape spanning more
     * than an octave from −2 to +12 has one root position — F, at 41 — where
     * neither direction fits and the top note is clamped. A clamped note is a
     * *flattened* figure, which is the one damage the numeric spelling exists to
     * prevent. Twelve semitones is the widest a riff can be here and still
     * always arrive whole.
     */
    { name: 'octave-drop', weight: 5, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 2, dur: 2, tone: 12, vel: 0.6 },
      { at: 6, dur: 2, tone: 0, vel: 0.72 },
      { at: 10, dur: 2, tone: 10, vel: 0.75 },
      { at: 14, dur: 2, tone: 0, vel: 0.68 },
    ] },
    /**
     * Two bars, and it answers itself. `cycle: 32` is the difference between a
     * riff and a bar: the first half asks and the second half comes down to the
     * ♭3 and the fourth, which is an answer that structurally cannot exist
     * inside a bar-shaped pattern.
     */
    { name: 'call-answer', weight: 4, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.6 },
      { at: 10, dur: 2, tone: 7, vel: 0.7 },
      { at: 12, dur: 4, tone: 0, vel: 0.68 },
      { at: 16, dur: 4, tone: 0, vel: 0.88 },
      { at: 22, dur: 2, tone: 3, vel: 0.66 },
      { at: 24, dur: 2, tone: 5, vel: 0.7 },
      { at: 26, dur: 2, tone: 3, vel: 0.64 },
      { at: 28, dur: 4, tone: -2, vel: 0.72 },
    ] },
  ],
  comp: [
    /**
     * The chank. Sixteen hits, four of them audible.
     *
     * Read the `vel` column rather than the `at` column: slots 2, 6, 10 and 14
     * sound at 0.7 and everything else is between 0.1 and 0.16, which is a pick
     * crossing damped strings on its way to the next accent. The hand never
     * stops moving and that is the entire technique — take the ghosts out and
     * what is left is a correct rhythm played by nobody.
     */
    { name: 'chank', weight: 6, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.18 }, { at: 1, dur: 1, vel: 0.1 },
      { at: 2, dur: 1, vel: 0.7 }, { at: 3, dur: 1, vel: 0.12 },
      { at: 4, dur: 1, vel: 0.14 }, { at: 5, dur: 1, vel: 0.1 },
      { at: 6, dur: 1, vel: 0.72 }, { at: 7, dur: 1, vel: 0.12 },
      { at: 8, dur: 1, vel: 0.16 }, { at: 9, dur: 1, vel: 0.1 },
      { at: 10, dur: 1, vel: 0.7 }, { at: 11, dur: 1, vel: 0.12 },
      { at: 12, dur: 1, vel: 0.14 }, { at: 13, dur: 1, vel: 0.1 },
      { at: 14, dur: 1, vel: 0.74 }, { at: 15, dur: 1, vel: 0.12 },
    ] },
    // The same hand, accenting the downbeat instead of the offbeat — which is
    // what a second guitar does so the two are not one thicker guitar.
    { name: 'chank-on', weight: 4, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.75 }, { at: 1, dur: 1, vel: 0.12 },
      { at: 2, dur: 1, vel: 0.14 }, { at: 3, dur: 1, vel: 0.62 },
      { at: 4, dur: 1, vel: 0.16 }, { at: 5, dur: 1, vel: 0.1 },
      { at: 6, dur: 1, vel: 0.68 }, { at: 7, dur: 1, vel: 0.12 },
      { at: 8, dur: 1, vel: 0.7 }, { at: 9, dur: 1, vel: 0.12 },
      { at: 10, dur: 1, vel: 0.14 }, { at: 11, dur: 1, vel: 0.6 },
      { at: 12, dur: 1, vel: 0.16 }, { at: 13, dur: 1, vel: 0.1 },
      { at: 14, dur: 1, vel: 0.66 }, { at: 15, dur: 1, vel: 0.12 },
    ] },
    // Three stabs and eleven slots of nothing. The other way to play this part,
    // and the one an organ or a horn section plays rather than a guitar.
    { name: 'stabs', weight: 3, voices: 3, voicing: 'guide', hits: [
      { at: 2, dur: 2, vel: 0.72 },
      { at: 6, dur: 1, vel: 0.66 },
      { at: 14, dur: 2, vel: 0.7 },
    ] },
  ],
  drums: [
    // Kick on The One and on the "a" of 2; snare on 2 and 4; sixteenths on the
    // hat. The bar every other pattern in this file is a variation on.
    { name: 'the-one', weight: 6, voices: {
      bd: [0, 7, 10],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'sixteenth-hat', weight: 5, voices: {
      bd: [0, 3, 10],
      sd: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    } },
    // A tambourine in sixteenths over the top — a signature of this repertoire
    // and a voice the project did not have until this week.
    { name: 'tambourine', weight: 4, voices: {
      bd: [0, 7, 10],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      tb: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'open-hat', weight: 3, voices: {
      bd: [0, 6, 10, 11],
      sd: [4, 12],
      hh: [0, 2, 4, 8, 10, 12],
      oh: [6, 14],
    } },
  ],
  melody: { leap: 0.24, ornament: 0.35, span: 12, sequence: 0.7, syncopation: 0.78 },
};

/**
 * JB SHUFFLE — the swung sixteenth, and the only swing in the genre.
 *
 * *Cold Sweat*, *Licking Stick*, *There Was a Time*: the same band as `vamp` with
 * the sixteenths dragged into a triplet. It is a small number and an enormous
 * difference — at 0.18 the offbeat sixteenth lands about a fifth of the way into
 * the second half of the beat rather than exactly on it, which is the shuffle
 * every Southern drummer plays and none of them writes down.
 *
 * It is a separate style rather than a `swing` value on `vamp` because the whole
 * band has to agree: the bass figure loses its straight sixteenths, the chank
 * stops being a machine and becomes a wrist, and the kick moves off slot 10 onto
 * the triplet. A style is what a rhythm section has agreed about the grid, and
 * this is a different agreement.
 *
 * `boxDrums: false`. A preset box cannot shuffle sixteenths — the whole
 * character here is the distance between the drummer's two hands, and a machine
 * has one.
 */
const jbshuffle: Style = {
  id: 'jbshuffle',
  label: 'JB shuffle',
  description:
    'The one-chord vamp with the sixteenths swung into a triplet. Kick off the grid, chank on the wrist, and a band that has to agree about it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [100, 122],
  swing: 0.18,
  boxDrums: false,
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  /**
   * `driving` and nothing else beside `straight`. A shuffle at 116 is already
   * leaning forward, and `pocket` — the backbeat laid back — is the one thing
   * this style must not draw, because a shuffle dragged behind the beat is a
   * blues rather than a funk.
   */
  feels: [['straight', 6], ['driving', 4]],
  shots: [[[0, 6], 4], [[0, 6, 7], 3], [[0, 10], 2]],
  progressions: {
    intro: [{ chords: ['I7', 'I7', 'I7', 'I7'], weight: 5 }],
    verse: [
      { chords: ['I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7'], weight: 6 },
      { chords: ['I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9'], weight: 4 },
      { chords: ['I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'I7', 'I7'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV7', 'IV7', 'IV7', 'IV7', 'I7', 'I7', 'I7', 'I7'], weight: 5 },
      { chords: ['IV9', 'IV9', 'I9', 'I9', 'IV9', 'IV9', 'I9', 'I9'], weight: 4 },
    ],
    bridge: [{ chords: ['IV7', 'IV7', 'IV7', 'IV7', 'bVII7', 'bVII7', 'I7', 'I7'], weight: 4 }],
    solo: [{ chords: ['I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7'], weight: 5 }],
    outro: [{ chords: ['I7', 'I7', 'I7', 'I7'], weight: 5 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6 },
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'i7', 'i7'], weight: 3 },
    ],
    chorus: [{ chords: ['iv7', 'iv7', 'iv7', 'iv7', 'i7', 'i7', 'i7', 'i7'], weight: 5 }],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 2, 2, 4], weight: 5 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 2, 2, 4], weight: 4 },
    { cell: [-4, 2, 2, 2, 2, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [8, 2, 2, 4], weight: 2 },
    { cell: [-2, 2, 2, 2, 2, 2, 2, 2], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'shuffle-riff', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 0, vel: 0.6 },
      { at: 6, dur: 2, tone: 3, vel: 0.7 },
      { at: 10, dur: 2, tone: -2, vel: 0.76 },
      { at: 12, dur: 4, tone: 0, vel: 0.68 },
    ] },
    { name: 'walk-up', weight: 4, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 3, vel: 0.66 },
      { at: 8, dur: 2, tone: 5, vel: 0.7 },
      { at: 10, dur: 2, tone: 7, vel: 0.72 },
      { at: 14, dur: 2, tone: 5, vel: 0.62 },
    ] },
    { name: 'two-note', weight: 3, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 10, dur: 6, tone: -2, vel: 0.74 },
    ] },
  ],
  comp: [
    { name: 'shuffle-chank', weight: 6, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.2 }, { at: 2, dur: 1, vel: 0.68 },
      { at: 4, dur: 1, vel: 0.14 }, { at: 6, dur: 1, vel: 0.72 },
      { at: 8, dur: 1, vel: 0.18 }, { at: 10, dur: 1, vel: 0.68 },
      { at: 12, dur: 1, vel: 0.14 }, { at: 14, dur: 1, vel: 0.74 },
    ] },
    { name: 'skank', weight: 4, voices: 3, voicing: 'guide', hits: [
      { at: 2, dur: 2, vel: 0.7 },
      { at: 6, dur: 2, vel: 0.72 },
      { at: 10, dur: 2, vel: 0.7 },
      { at: 14, dur: 2, vel: 0.74 },
    ] },
    { name: 'organ-pad', weight: 2, voices: 4, hits: [
      { at: 0, dur: 8, vel: 0.5 },
      { at: 10, dur: 6, vel: 0.46 },
    ] },
  ],
  drums: [
    { name: 'shuffle', weight: 6, voices: {
      bd: [0, 6, 10],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'shuffle-busy', weight: 4, voices: {
      bd: [0, 3, 6, 11],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      tb: [4, 12],
    } },
    { name: 'shuffle-ride', weight: 3, voices: {
      bd: [0, 6, 10],
      sd: [4, 12],
      rd: [0, 2, 4, 6, 8, 10, 12, 14],
      hh: [4, 12],
    } },
  ],
  melody: { leap: 0.28, ornament: 0.4, span: 14, sequence: 0.62, syncopation: 0.7 },
};

/**
 * DEEP FUNK — the 45 nobody has heard, and the reason crate-digging exists.
 *
 * A six-piece band with one riff, three minutes of tape and no budget for a
 * second take. This is the *raw* end of the repertoire — the regional 45s on
 * labels that pressed four hundred copies — and what separates it from `vamp` is
 * not tempo or harmony but *density*: the band is smaller, the horn section is
 * two people rather than five, and the arrangement is one figure played by
 * everybody at once rather than four figures interlocking.
 *
 * So the bass and the guitar play the **same rhythm** here, which is a thing no
 * other style in this file does. Interlocking parts are what a well-drilled band
 * produces; a band with one rehearsal plays the riff in unison and leans on it,
 * and that is a different and better-sounding record than a badly interlocked
 * one.
 *
 * Minor-primary, which is unusual at this end of the genre and is the thing that
 * makes these records sound haunted rather than celebratory.
 */
const deepfunk: Style = {
  id: 'deepfunk',
  label: 'Deep funk',
  description:
    'The regional 45: a small band, one riff played by bass and guitar together, and no budget for a second take.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [104, 128],
  swing: 0,
  modeWeights: { minor: 0.62, major: 0.38 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  transitions: [['fill', 5], ['break', 3], ['shot', 3]],
  shots: [[[0, 6], 4], [[0, 3, 6], 3], [[0, 6, 12], 2]],
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 4 },
      { chords: ['i7', 'i7', 'VII', 'VII', 'i7', 'i7', 'VII', 'VII'], weight: 3, note: 'Rocking a whole tone down and back, which in this idiom is a lot of harmony' },
    ],
    chorus: [
      { chords: ['iv7', 'iv7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 5 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 4 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'iv7', 'iv7', 'i7', 'i7', 'i7', 'i7'], weight: 4 }],
    solo: [{ chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 5 }],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7'], weight: 6 },
      { chords: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7'], weight: 4 },
    ],
    chorus: [{ chords: ['IV7', 'IV7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7'], weight: 5 }],
    outro: [{ chords: ['I7', 'I7', 'I7', 'I7'], weight: 5 }],
  },
  melodyCells: [
    { cell: [3, 3, 2, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 2, 2, 4], weight: 4 },
    { cell: [-4, 4, 2, 2, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [-6, 2, 4, 4], weight: 2 },
    { cell: [2, 2, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [-4, 12], weight: 3 },
    { cell: [-2, 14], weight: 2 },
  ],
  bass: [
    // The unison riff. The comp pattern `unison-riff` below is the same slots,
    // which is the whole arrangement of this style.
    { name: 'unison-riff', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 3, dur: 3, tone: 0, vel: 0.6 },
      { at: 6, dur: 2, tone: 3, vel: 0.74 },
      { at: 10, dur: 2, tone: 5, vel: 0.72 },
      { at: 12, dur: 4, tone: 0, vel: 0.7 },
    ] },
    { name: 'stomp', weight: 4, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 2, tone: 0, vel: 0.7 },
      { at: 11, dur: 2, tone: -2, vel: 0.74 },
      { at: 14, dur: 2, tone: -5, vel: 0.7 },
    ] },
    { name: 'climb', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.6 },
      { at: 10, dur: 2, tone: 3, vel: 0.72 },
      { at: 14, dur: 2, tone: 5, vel: 0.68 },
      { at: 16, dur: 4, tone: 7, vel: 0.86 },
      { at: 22, dur: 2, tone: 5, vel: 0.62 },
      { at: 26, dur: 2, tone: 3, vel: 0.68 },
      { at: 28, dur: 4, tone: 0, vel: 0.72 },
    ] },
  ],
  comp: [
    // Not a chank: the guitar is playing the bass figure. Slot for slot with
    // `unison-riff`, which is why the whole record sounds like one instrument.
    { name: 'unison-riff', weight: 6, voices: 2, voicing: 'guide', hits: [
      { at: 0, dur: 2, vel: 0.78 },
      { at: 3, dur: 2, vel: 0.5 },
      { at: 6, dur: 2, vel: 0.68 },
      { at: 10, dur: 2, vel: 0.66 },
      { at: 12, dur: 2, vel: 0.62 },
    ] },
    { name: 'chank', weight: 4, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.16 }, { at: 1, dur: 1, vel: 0.1 },
      { at: 2, dur: 1, vel: 0.72 }, { at: 3, dur: 1, vel: 0.12 },
      { at: 6, dur: 1, vel: 0.7 }, { at: 7, dur: 1, vel: 0.12 },
      { at: 8, dur: 1, vel: 0.14 }, { at: 10, dur: 1, vel: 0.68 },
      { at: 11, dur: 1, vel: 0.1 }, { at: 14, dur: 1, vel: 0.74 },
      { at: 15, dur: 1, vel: 0.12 },
    ] },
    { name: 'organ-stabs', weight: 3, voices: 4, hits: [
      { at: 0, dur: 2, vel: 0.66 },
      { at: 6, dur: 2, vel: 0.6 },
      { at: 12, dur: 3, vel: 0.62 },
    ] },
  ],
  drums: [
    { name: 'stomp', weight: 6, voices: {
      bd: [0, 6, 10],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'raw', weight: 5, voices: {
      bd: [0, 3, 8, 11],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      tb: [2, 6, 10, 14],
    } },
    { name: 'two-and-four', weight: 3, voices: {
      bd: [0, 10],
      sd: [4, 12],
      hh: [0, 4, 8, 12],
      rim: [7, 14],
    } },
  ],
  melody: { leap: 0.3, ornament: 0.3, span: 13, sequence: 0.68, syncopation: 0.74 },
};

/**
 * HORN-DRIVEN — the section is the tune.
 *
 * Memphis and the JB horns: two trumpets, a tenor and a baritone playing a
 * written figure that is the melody rather than an accompaniment to one. A horn
 * chart is the one place in this genre where the line is *composed* — everything
 * else here is a riff or an improvisation, and a section of four people playing
 * in unison cannot be either.
 *
 * Which is why this style's `melody.span` is 18 against the genre's usual 12 and
 * its `leap` is nearly double: a five-note pentatonic riff sits under a guitarist's
 * fingers and a horn line does not. It is also the one style here whose melodic
 * material wants the fourth and the major third that a riff would leave out, and
 * major-primary is how it gets them.
 *
 * The comp table is deliberately thin. Where the horns are the subject the
 * guitar's job is to stay out of their way, which in this idiom means the
 * quietest chank in the file and a stab pattern that only plays where the
 * section has stopped.
 */
const horns: Style = {
  id: 'horns',
  label: 'Horn-driven',
  description:
    'Two trumpets, a tenor and a baritone playing a written figure that is the tune. The guitar stays out of the way.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [98, 118],
  swing: 0,
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0,
  transitions: [['fill', 4], ['shot', 4], ['break', 2]],
  shots: [[[0, 6], 4], [[0, 6, 7], 4], [[0, 4, 6], 2], [[0, 10, 14], 2]],
  progressions: {
    intro: [{ chords: ['I9', 'I9', 'I9', 'I9'], weight: 5 }],
    verse: [
      { chords: ['I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9'], weight: 5 },
      { chords: ['I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'I7', 'I7'], weight: 5 },
      { chords: ['I7', 'I7', 'I7', 'I7', 'bVII7', 'bVII7', 'I7', 'I7'], weight: 4 },
      { chords: ['I9', 'I9', 'IV9', 'IV9', 'I9', 'I9', 'V7', 'IV7'], weight: 3, note: 'The one place a V appears in this genre, and it is a blues turnaround rather than a cadence' },
    ],
    chorus: [
      { chords: ['IV9', 'IV9', 'IV9', 'IV9', 'I9', 'I9', 'I9', 'I9'], weight: 5 },
      { chords: ['bVII7', 'bVII7', 'IV7', 'IV7', 'I7', 'I7', 'I7', 'I7'], weight: 4, note: 'The double-plagal walk home — two fourths, no leading tone anywhere' },
      { chords: ['IV7', 'IV7', 'I7', 'I7', 'bVII7', 'bVII7', 'I7', 'I7'], weight: 3 },
    ],
    bridge: [
      { chords: ['IV7', 'IV7', 'IV7', 'IV7', 'bVII7', 'bVII7', 'bVII7', 'bVII7'], weight: 4 },
      { chords: ['vi7', 'vi7', 'ii7', 'ii7', 'IV7', 'IV7', 'I7', 'I7'], weight: 2 },
    ],
    solo: [{ chords: ['I9', 'I9', 'I9', 'I9', 'IV9', 'IV9', 'I9', 'I9'], weight: 5 }],
    outro: [{ chords: ['IV7', 'IV7', 'I7', 'I7'], weight: 5 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 5 },
      { chords: ['i7', 'i7', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv7', 'iv7', 'i7', 'i7', 'VII', 'VII', 'i7', 'i7'], weight: 5 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 4 },
    ],
    outro: [{ chords: ['iv7', 'iv7', 'i7', 'i7'], weight: 5 }],
  },
  melodyCells: [
    { cell: [4, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 4, 2, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [3, 3, 2, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'section-riff', weight: 6, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.62 },
      { at: 8, dur: 2, tone: 7, vel: 0.72 },
      { at: 12, dur: 4, tone: 5, vel: 0.68 },
    ] },
    { name: 'push', weight: 4, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 0, vel: 0.58 },
      { at: 7, dur: 3, tone: -2, vel: 0.74 },
      { at: 12, dur: 4, tone: 0, vel: 0.7 },
    ] },
    { name: 'held', weight: 2, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 10, dur: 6, tone: 7, vel: 0.7 },
    ] },
  ],
  comp: [
    // The quietest chank in the file. Under a four-piece horn section the
    // guitar is a texture and nothing else, and the accents come down to 0.5.
    { name: 'under-horns', weight: 6, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.14 }, { at: 2, dur: 1, vel: 0.5 },
      { at: 4, dur: 1, vel: 0.12 }, { at: 6, dur: 1, vel: 0.52 },
      { at: 8, dur: 1, vel: 0.14 }, { at: 10, dur: 1, vel: 0.5 },
      { at: 12, dur: 1, vel: 0.12 }, { at: 14, dur: 1, vel: 0.54 },
    ] },
    { name: 'answer-stabs', weight: 4, voices: 3, voicing: 'guide', hits: [
      { at: 4, dur: 2, vel: 0.62 },
      { at: 10, dur: 2, vel: 0.66 },
      { at: 14, dur: 2, vel: 0.6 },
    ] },
    { name: 'organ-bed', weight: 3, voices: 4, hits: [
      { at: 0, dur: 12, vel: 0.46 },
    ] },
  ],
  drums: [
    { name: 'straight-eight', weight: 6, voices: {
      bd: [0, 8, 11],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'section-kick', weight: 4, voices: {
      bd: [0, 6, 7, 10],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      tb: [4, 12],
    } },
    { name: 'ride', weight: 3, voices: {
      bd: [0, 10],
      sd: [4, 12],
      rd: [0, 2, 4, 6, 8, 10, 12, 14],
      cb: [0, 8],
    } },
  ],
  melody: { leap: 0.42, ornament: 0.22, span: 18, sequence: 0.55, syncopation: 0.68 },
};

/**
 * MEMPHIS — the instrumental, played by four people who never hurry.
 *
 * Booker T. and the MGs, and the house band on every Southern soul side of the
 * decade. What defines it is *how little is played*: an organ holding one chord,
 * a guitar answering with three notes, a bass on the root and the fifth, and a
 * drummer whose whole part is a kick, a rimshot backbeat and a closed hat. The
 * groove is entirely in the space.
 *
 * That is the hardest thing in this file to express, because a table of onsets
 * naturally fills up — every pattern here has under five hits in sixteen slots
 * and that restraint is the style. `pocket` is in the feel table for the same
 * reason and at the highest weight it takes anywhere in this genre: a Memphis
 * backbeat is measurably behind the beat, and the bass is measurably in front of
 * it, and that gap is the sound of the label.
 *
 * Slower than the JB end and major-leaning: this is soul rather than funk
 * proper, and the harmony has a real IV and a real V in it because the songs it
 * accompanied were songs.
 */
const memphis: Style = {
  id: 'memphis',
  label: 'Memphis instrumental',
  description:
    'Four people playing as little as possible: organ, three-note guitar answers, root-and-fifth bass, rimshot backbeat.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [86, 106],
  swing: 0,
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0,
  /**
   * The highest `pocket` weight anywhere in this genre. The whole identity of
   * this band is the distance between where the bass lands and where the snare
   * does, and `pocket` is the only thing in the feel library that says so.
   */
  feels: [['pocket', 6], ['straight', 4]],
  progressions: {
    intro: [{ chords: ['I', 'I', 'IV', 'IV'], weight: 5 }],
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'IV', 'IV'], weight: 5, note: 'Two chords, four bars apart. The entire form of a great many of these' },
      { chords: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7'], weight: 4 },
      { chords: ['I', 'I', 'vi7', 'vi7', 'IV', 'IV', 'V', 'V'], weight: 3 },
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'IV', 'IV', 'V', 'V'], weight: 5 },
      { chords: ['IV', 'IV', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 4 },
      { chords: ['vi7', 'vi7', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'V', 'V', 'I', 'I', 'vi7', 'vi7'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'IV', 'IV'], weight: 5 }],
    outro: [{ chords: ['IV', 'IV', 'I', 'I'], weight: 5 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'iv7', 'iv7'], weight: 5 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv7', 'iv7', 'i7', 'i7', 'VII', 'VII', 'i7', 'i7'], weight: 5 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 3 },
    ],
    outro: [{ chords: ['iv7', 'iv7', 'i7', 'i7'], weight: 5 }],
  },
  melodyCells: [
    { cell: [4, 4, 8], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 5 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [-2, 2, 4, 8], weight: 4 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [4, 2, 2, 8], weight: 3 },
    { cell: [16], weight: 3 },
    { cell: [-8, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [-8, 8], weight: 2 },
  ],
  bass: [
    { name: 'root-fifth', weight: 6, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 7, vel: 0.72 },
      { at: 14, dur: 2, tone: 0, vel: 0.62 },
    ] },
    { name: 'three-note', weight: 5, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.6 },
      { at: 12, dur: 4, tone: -5, vel: 0.72 },
    ] },
    { name: 'almost-nothing', weight: 3, hits: [
      { at: 0, dur: 10, tone: 0, vel: 1 },
      { at: 12, dur: 4, tone: 5, vel: 0.68 },
    ] },
  ],
  comp: [
    // Three notes, on the offbeats, and eleven slots of nothing. A guitar in
    // this band answers the organ and then gets out of the way.
    { name: 'three-answers', weight: 6, voices: 3, hits: [
      { at: 6, dur: 2, vel: 0.6 },
      { at: 10, dur: 2, vel: 0.58 },
      { at: 14, dur: 2, vel: 0.62 },
    ] },
    { name: 'soft-chank', weight: 4, voices: 3, hits: [
      { at: 2, dur: 1, vel: 0.52 }, { at: 3, dur: 1, vel: 0.12 },
      { at: 6, dur: 1, vel: 0.56 }, { at: 7, dur: 1, vel: 0.12 },
      { at: 10, dur: 1, vel: 0.52 }, { at: 11, dur: 1, vel: 0.12 },
      { at: 14, dur: 1, vel: 0.58 }, { at: 15, dur: 1, vel: 0.12 },
    ] },
    { name: 'organ-hold', weight: 4, voices: 4, sustain: true, hits: [
      { at: 0, dur: 16, vel: 0.44 },
    ] },
  ],
  drums: [
    // A rimshot rather than a snare on the backbeat, which is the single most
    // recognisable thing about this band's records.
    { name: 'rimshot', weight: 6, voices: {
      bd: [0, 10],
      rim: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'plain', weight: 5, voices: {
      bd: [0, 8],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'tambourine-backbeat', weight: 3, voices: {
      bd: [0, 10],
      sd: [4, 12],
      hh: [0, 4, 8, 12],
      tb: [4, 12],
    } },
  ],
  melody: { leap: 0.3, ornament: 0.25, span: 15, sequence: 0.6, syncopation: 0.56 },
};

/**
 * SWAMP FUNK — New Orleans, and the bar line that is not where you left it.
 *
 * The Meters, and the second-line parade rhythm the whole city plays. Slower
 * than anything else at the JB end, and the kick is the reason: instead of
 * landing on The One and again around slot 10, it plays a *pattern* — 0, 3, 6,
 * 11 — that has more in common with a bass drum in a marching band than with a
 * rock kit. The snare answers off the beat rather than on it, and there is a
 * rimshot where a backbeat should be.
 *
 * The guitar part is the other half. A Meters guitar figure is written in
 * sixteenths and *starts on slot 3*, so the ear hears the downbeat arrive
 * underneath a phrase that is already in progress. That is the thing this style
 * exists to produce and it is why the chank tables here are asymmetric where
 * every other style's are on the grid.
 *
 * `laidback` is in the feel table because it is the only entry that says "behind
 * the beat, and not by accident". A second line played on top of the beat is a
 * march.
 */
const swamp: Style = {
  id: 'swamp',
  label: 'Swamp funk',
  description:
    'New Orleans second line: a marching-band kick pattern, a rimshot where the backbeat should be, and a guitar figure that starts before the bar does.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [82, 102],
  swing: 0,
  modeWeights: { minor: 0.42, major: 0.58 },
  relativeMajorChorus: 0,
  feels: [['laidback', 5], ['straight', 4], ['pocket', 3]],
  shots: [[[0, 3, 6], 4], [[0, 6, 11], 3], [[0, 6], 2]],
  progressions: {
    intro: [{ chords: ['I7', 'I7', 'I7', 'I7'], weight: 5 }],
    verse: [
      { chords: ['I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7'], weight: 5 },
      { chords: ['I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'IV7', 'IV7'], weight: 5 },
      { chords: ['I9', 'I9', 'I9', 'I9', 'bVII9', 'bVII9', 'I9', 'I9'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV7', 'IV7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7'], weight: 5 },
      { chords: ['bVII7', 'bVII7', 'IV7', 'IV7', 'I7', 'I7', 'I7', 'I7'], weight: 4 },
    ],
    bridge: [{ chords: ['IV7', 'IV7', 'IV7', 'IV7', 'I7', 'I7', 'I7', 'I7'], weight: 4 }],
    solo: [{ chords: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7'], weight: 5 }],
    outro: [{ chords: ['I7', 'I7', 'I7', 'I7'], weight: 5 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 5 },
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'iv7', 'iv7'], weight: 4 },
    ],
    chorus: [{ chords: ['iv7', 'iv7', 'i7', 'i7', 'VII', 'VII', 'i7', 'i7'], weight: 5 }],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  melodyCells: [
    { cell: [3, 3, 2, 4, 4], weight: 5 },
    { cell: [-3, 3, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [-2, 2, 4, 4, 4], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [-4, 2, 2, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [6, 10], weight: 2 },
  ],
  bass: [
    // Nothing on slot 0 but the loudest note of the bar, then the figure runs
    // across the middle of it and stops. The Meters bass line in one sentence.
    { name: 'second-line', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 3, dur: 3, tone: 0, vel: 0.58 },
      { at: 6, dur: 2, tone: -2, vel: 0.72 },
      { at: 11, dur: 3, tone: 0, vel: 0.7 },
      { at: 14, dur: 2, tone: 3, vel: 0.6 },
    ] },
    { name: 'rolling', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 7, vel: 0.68 },
      { at: 11, dur: 3, tone: 5, vel: 0.66 },
      { at: 16, dur: 4, tone: 0, vel: 0.86 },
      { at: 22, dur: 2, tone: -2, vel: 0.7 },
      { at: 24, dur: 2, tone: -5, vel: 0.66 },
      { at: 28, dur: 4, tone: 0, vel: 0.7 },
    ] },
    { name: 'loping', weight: 3, hits: [
      { at: 0, dur: 5, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 5, vel: 0.66 },
      { at: 10, dur: 2, tone: 3, vel: 0.68 },
      { at: 12, dur: 4, tone: 0, vel: 0.66 },
    ] },
  ],
  comp: [
    // Starts on slot 3, not on slot 0. The downbeat arrives under a phrase that
    // is already going, which is the whole trick.
    { name: 'late-start', weight: 6, voices: 3, voicing: 'guide', hits: [
      { at: 3, dur: 1, vel: 0.68 }, { at: 4, dur: 1, vel: 0.12 },
      { at: 6, dur: 1, vel: 0.62 }, { at: 7, dur: 1, vel: 0.14 },
      { at: 10, dur: 1, vel: 0.7 }, { at: 11, dur: 1, vel: 0.12 },
      { at: 13, dur: 1, vel: 0.6 }, { at: 14, dur: 1, vel: 0.66 },
    ] },
    { name: 'scratch', weight: 4, voices: 2, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.14 }, { at: 1, dur: 1, vel: 0.1 },
      { at: 2, dur: 1, vel: 0.62 }, { at: 3, dur: 1, vel: 0.14 },
      { at: 5, dur: 1, vel: 0.6 }, { at: 6, dur: 1, vel: 0.12 },
      { at: 8, dur: 1, vel: 0.14 }, { at: 9, dur: 1, vel: 0.62 },
      { at: 11, dur: 1, vel: 0.12 }, { at: 13, dur: 1, vel: 0.64 },
      { at: 14, dur: 1, vel: 0.12 },
    ] },
    { name: 'piano-tumble', weight: 3, voices: 4, hits: [
      { at: 0, dur: 2, vel: 0.58 },
      { at: 3, dur: 2, vel: 0.5 },
      { at: 6, dur: 2, vel: 0.54 },
      { at: 11, dur: 2, vel: 0.52 },
    ] },
  ],
  drums: [
    // The second line: a marching-band kick, and the snare answering off the
    // beat rather than landing on it.
    { name: 'second-line', weight: 6, voices: {
      bd: [0, 3, 6, 11],
      sd: [4, 7, 12, 14],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'rim-and-kick', weight: 4, voices: {
      bd: [0, 3, 10],
      rim: [4, 12],
      sd: [7, 14],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'parade', weight: 3, voices: {
      bd: [0, 3, 6, 8, 11],
      sd: [4, 12],
      lp: [0, 6],
      mp: [3, 10, 14],
      hh: [0, 4, 8, 12],
    } },
  ],
  melody: { leap: 0.28, ornament: 0.32, span: 14, sequence: 0.6, syncopation: 0.8 },
};

/**
 * SOUL-JAZZ — the organ trio, on the way from one genre to the other.
 *
 * Jimmy Smith and Lou Donaldson: a Hammond, a guitar, a drummer, sometimes a
 * tenor, and a repertoire of boogaloo heads over blues changes. It is the one
 * style in this file with a foot still in the previous genre and the tables show
 * it — a real ii–V appears, the changes move every two bars rather than every
 * eight, and `swing` is 0.12 rather than 0, which is not a shuffle but is not
 * straight either.
 *
 * `hook: 'loose'` for the same reason. Everything else in this genre repeats its
 * figure until the record ends; an organ trio states a head and then blows over
 * it, and a soul-jazz side that recalled its solos would have stopped being one.
 *
 * The organ is doing two jobs at once and the tables acknowledge it: the comp
 * patterns are the right hand and the bass patterns are the pedals, which is why
 * the bass here plays more notes than anywhere else in this file. A bass pedal
 * has no fret hand to get tired.
 */
const souljazz: Style = {
  id: 'souljazz',
  label: 'Soul-jazz',
  description:
    'The organ trio at the boogaloo end: a Hammond over blues changes, a lightly swung sixteenth, and a head that gets left behind.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [110, 138],
  swing: 0.12,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  hook: 'loose',
  progressions: {
    intro: [{ chords: ['I9', 'I9', 'IV9', 'IV9'], weight: 5 }],
    verse: [
      { chords: ['I9', 'I9', 'I9', 'I9', 'IV9', 'IV9', 'I9', 'I9'], weight: 5, note: 'The first eight of a blues, which is what most of these heads are sitting on' },
      { chords: ['I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'ii7', 'V7'], weight: 4 },
      { chords: ['I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9'], weight: 3 },
      { chords: ['I7', 'bIII7', 'IV7', 'bVI7', 'I7', 'I7', 'ii7', 'V7'], weight: 2, note: 'Chromatic side-slipping between the chord tones — the organ player showing they can' },
    ],
    chorus: [
      { chords: ['IV9', 'IV9', 'I9', 'I9', 'ii7', 'V7', 'I9', 'I9'], weight: 5 },
      { chords: ['IV9', 'IV9', 'IV9', 'IV9', 'I9', 'I9', 'I9', 'I9'], weight: 4 },
    ],
    bridge: [{ chords: ['IV9', 'IV9', 'bVII9', 'bVII9', 'I9', 'I9', 'ii7', 'V7'], weight: 4 }],
    solo: [{ chords: ['I9', 'I9', 'I9', 'I9', 'IV9', 'IV9', 'I9', 'I9'], weight: 5 }],
    outro: [{ chords: ['ii7', 'V7', 'I9', 'I9'], weight: 5 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 5 },
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'VI', 'VII', 'i7', 'i7'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv7', 'iv7', 'i7', 'i7', 'VI', 'VII', 'i7', 'i7'], weight: 5 },
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'VII', 'VII'], weight: 3 },
    ],
    outro: [{ chords: ['iv7', 'iv7', 'i7', 'i7'], weight: 5 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 2, 2, 2, 2], weight: 5 },
    { cell: [-2, 2, 2, 2, 2, 2, 4], weight: 5 },
    { cell: [4, 2, 2, 2, 2, 4], weight: 4 },
    { cell: [2, 2, 4, 2, 2, 4], weight: 4 },
    { cell: [-4, 2, 2, 2, 2, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [3, 3, 2, 4, 4], weight: 3 },
    { cell: [8, 2, 2, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [12, 4], weight: 4 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    // The pedals. More onsets than any other bass table here, because the left
    // foot is not the hand that is also comping.
    { name: 'pedal-walk', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 3, vel: 0.66 },
      { at: 6, dur: 2, tone: 5, vel: 0.62 },
      { at: 8, dur: 3, tone: 7, vel: 0.76 },
      { at: 12, dur: 2, tone: 5, vel: 0.64 },
      { at: 14, dur: 2, tone: 3, vel: 0.62 },
    ] },
    { name: 'boogaloo', weight: 5, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 7, vel: 0.68 },
      { at: 8, dur: 2, tone: 10, vel: 0.7 },
      { at: 12, dur: 4, tone: 7, vel: 0.66 },
    ] },
    { name: 'two-feel', weight: 3, hits: [
      { at: 0, dur: 7, tone: 0, vel: 1 },
      { at: 8, dur: 7, tone: 7, vel: 0.72 },
    ] },
  ],
  comp: [
    { name: 'organ-comp', weight: 6, voices: 4, voicing: 'guide', hits: [
      { at: 2, dur: 2, vel: 0.62 },
      { at: 6, dur: 2, vel: 0.58 },
      { at: 11, dur: 3, vel: 0.6 },
    ] },
    { name: 'shuffle-chank', weight: 4, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.16 }, { at: 2, dur: 1, vel: 0.66 },
      { at: 4, dur: 1, vel: 0.14 }, { at: 6, dur: 1, vel: 0.68 },
      { at: 8, dur: 1, vel: 0.16 }, { at: 10, dur: 1, vel: 0.64 },
      { at: 12, dur: 1, vel: 0.14 }, { at: 14, dur: 1, vel: 0.7 },
    ] },
    { name: 'sustained', weight: 3, voices: 4, sustain: true, hits: [
      { at: 0, dur: 14, vel: 0.48 },
    ] },
  ],
  drums: [
    { name: 'boogaloo', weight: 6, voices: {
      bd: [0, 6, 10],
      sd: [4, 12],
      rd: [0, 2, 4, 6, 8, 10, 12, 14],
      hh: [4, 12],
    } },
    { name: 'ride-and-cowbell', weight: 4, voices: {
      bd: [0, 10],
      sd: [4, 12],
      rd: [0, 4, 6, 8, 12, 14],
      cb: [0, 4, 8, 12],
    } },
    { name: 'hat', weight: 3, voices: {
      bd: [0, 3, 10],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      tb: [2, 6, 10, 14],
    } },
  ],
  melody: { leap: 0.4, ornament: 0.34, span: 17, sequence: 0.42, syncopation: 0.6 },
};

/**
 * GO-GO — the groove that never stops, from Washington and nowhere else.
 *
 * Chuck Brown and the whole DC scene: a percussion section of congas, cowbell
 * and timbales laid over a kit, a bass that plays almost nothing, and a band
 * that does not stop between numbers. The recorded artefact of go-go is a
 * *set*, not a song, which is why this style's forms come out longest and why
 * the drum tables here carry three hand-drum voices where every other style in
 * the file carries none.
 *
 * `lp`/`mp`/`hp` are the low, mid and high strokes of a hand drum, and go-go is
 * the reason a funk genre needs them: the conga trio is playing a *rhythm*, not
 * a colour, and collapsed onto `perc` the tumba, the conga and the quinto come
 * out as one click repeated. The pattern below interleaves them at sixteenth
 * speed, which is the thing a single voice cannot express at all.
 *
 * `cycle: 24` on the second conga figure — a bar and a half against a four-beat
 * bar, so the hand pattern and the backbeat come back together every three bars.
 * A go-go percussionist is not playing the bar; they are playing across it.
 */
const gogo: Style = {
  id: 'gogo',
  label: 'Go-go',
  description:
    'Washington DC: a conga trio and a cowbell over the kit, a bass playing almost nothing, and a groove that does not stop between numbers.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [92, 112],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['pocket', 5], ['straight', 5]],
  /**
   * `break` and nothing else beside the fill. Go-go's join is the band dropping
   * to percussion alone while somebody talks over it — which is a stop-time bar
   * by any definition the engine has — and a shot would be the wrong gesture
   * entirely: this band does not punctuate, it continues.
   */
  transitions: [['fill', 4], ['break', 5]],
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'iv9', 'iv9', 'i9', 'i9'], weight: 4 },
      { chords: ['i7', 'i7', 'VII', 'VII', 'i7', 'i7', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv7', 'iv7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 5 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 4 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'iv7', 'iv7', 'i7', 'i7', 'i7', 'i7'], weight: 4 }],
    solo: [{ chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 5 }],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9'], weight: 6 },
      { chords: ['I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'I7', 'I7'], weight: 4 },
    ],
    chorus: [{ chords: ['IV9', 'IV9', 'I9', 'I9', 'IV9', 'IV9', 'I9', 'I9'], weight: 5 }],
    outro: [{ chords: ['I9', 'I9', 'I9', 'I9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [3, 3, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 2, 2, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [-4, 2, 2, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [-6, 2, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [-2, 14], weight: 2 },
  ],
  bass: [
    // Two onsets. In a band with five percussionists the bass is a pitch
    // reference, and anything busier fights the congas for the same slots.
    { name: 'anchor', weight: 6, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 10, dur: 4, tone: 0, vel: 0.7 },
    ] },
    { name: 'pocket', weight: 5, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.6 },
      { at: 11, dur: 3, tone: -2, vel: 0.72 },
    ] },
    { name: 'roll', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 10, dur: 4, tone: 0, vel: 0.66 },
      { at: 16, dur: 4, tone: 0, vel: 0.86 },
      { at: 22, dur: 2, tone: 3, vel: 0.64 },
      { at: 26, dur: 2, tone: 5, vel: 0.66 },
      { at: 28, dur: 4, tone: 3, vel: 0.68 },
    ] },
  ],
  comp: [
    { name: 'chank', weight: 6, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.16 }, { at: 2, dur: 1, vel: 0.68 },
      { at: 3, dur: 1, vel: 0.12 }, { at: 6, dur: 1, vel: 0.7 },
      { at: 7, dur: 1, vel: 0.12 }, { at: 10, dur: 1, vel: 0.66 },
      { at: 11, dur: 1, vel: 0.12 }, { at: 14, dur: 1, vel: 0.72 },
      { at: 15, dur: 1, vel: 0.12 },
    ] },
    { name: 'three-beat', weight: 4, voices: 3, cycle: 12, voicing: 'guide', hits: [
      { at: 0, dur: 2, vel: 0.7 },
      { at: 4, dur: 1, vel: 0.5 },
      { at: 7, dur: 2, vel: 0.62 },
    ] },
    { name: 'organ-swell', weight: 2, voices: 4, sustain: true, hits: [
      { at: 0, dur: 16, vel: 0.42 },
    ] },
  ],
  drums: [
    /**
     * The conga trio, interleaved with the kit. Low stroke on the pulse, mid on
     * the offbeats, high cracking on 3 and 11 — three surfaces at sixteenth
     * speed, which is what one drum and two hands actually does.
     */
    { name: 'congas', weight: 6, voices: {
      bd: [0, 7, 10],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      lp: [0, 8],
      mp: [2, 6, 10, 14],
      hp: [3, 11],
      cb: [0, 4, 8, 12],
    } },
    { name: 'cowbell', weight: 5, voices: {
      bd: [0, 6, 10],
      sd: [4, 12],
      cb: [0, 3, 6, 8, 11, 14],
      hh: [2, 6, 10, 14],
      tb: [0, 4, 8, 12],
    } },
    { name: 'pocket', weight: 4, voices: {
      bd: [0, 7, 10],
      sd: [4, 12],
      rim: [6, 14],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      lp: [0, 10],
      mp: [6, 14],
    } },
  ],
  melody: { leap: 0.26, ornament: 0.3, span: 12, sequence: 0.72, syncopation: 0.76 },
};

/**
 * LATIN FUNK — the conga trio arrives, and the bass stops playing on the beat.
 *
 * War, Santana's rhythm section, Mongo Santamaría, and every band on the West
 * Coast with a percussionist in it. What separates this from `gogo` — which also
 * has three hand drums — is what the *bass* does about them: a go-go bass gets
 * out of the way, and a latin-funk bass plays a tumbao, which is an anticipated
 * figure landing on the "and" of 2 and on 4 with nothing at all on the downbeat
 * of the second half.
 *
 * That anticipation is the reason the style is minor-primary and the reason its
 * `syncopation` is the highest in the file at 0.85. A tumbao that lands on the
 * beat is a bass line; a tumbao that lands a sixteenth early is Cuban, and every
 * band named above learned it from the same records.
 *
 * The clave is deliberately not modelled as a `DrumPattern` voice on its own.
 * What the tables carry instead is the 3+3+2 distribution across `lp`, `mp` and
 * `hp`, because the clave in this repertoire is a *guide* the players agree on
 * rather than a part somebody strikes — and a woodblock playing 3-2 over a funk
 * kit is a salsa record, which is a real and different music.
 */
const latin: Style = {
  id: 'latin',
  label: 'Latin funk',
  description:
    'A conga trio over the kit and a bass playing a tumbao — anticipated, off the downbeat, and the reason nothing here lands where you expect.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [102, 124],
  swing: 0,
  modeWeights: { minor: 0.66, major: 0.34 },
  relativeMajorChorus: 0,
  fills: [['rim', 5], ['snare-toms', 3], ['lead-in', 3], ['drop', 2], ['tom-roll', 1]],
  shots: [[[0, 3, 6], 4], [[0, 6, 11], 3], [[0, 6], 2]],
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 5 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 4 },
      { chords: ['i7', 'i7', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4, note: 'The descending tetrachord, two bars a chord — the montuno every Latin band shares with every modal one' },
      { chords: ['iv7', 'iv7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 5 },
      { chords: ['iv7', 'iv7', 'VII', 'VII', 'III', 'III', 'i7', 'i7'], weight: 4 },
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'VII', 'VII', 'i7', 'i7'], weight: 3 },
    ],
    bridge: [{ chords: ['III', 'III', 'VI', 'VI', 'iv7', 'iv7', 'VII', 'VII'], weight: 4 }],
    solo: [{ chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 5 }],
    outro: [{ chords: ['VII', 'VII', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I9', 'I9', 'I9', 'I9', 'IV9', 'IV9', 'I9', 'I9'], weight: 5 },
      { chords: ['I7', 'I7', 'bVII7', 'bVII7', 'IV7', 'IV7', 'I7', 'I7'], weight: 4 },
    ],
    chorus: [{ chords: ['IV9', 'IV9', 'bVII7', 'bVII7', 'I9', 'I9', 'I9', 'I9'], weight: 5 }],
    outro: [{ chords: ['IV9', 'IV9', 'I9', 'I9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [3, 3, 2, 4, 4], weight: 6 },
    { cell: [-3, 3, 2, 4, 4], weight: 4 },
    { cell: [3, 3, 3, 3, 4], weight: 4 },
    { cell: [2, 2, 4, 2, 2, 4], weight: 4 },
    { cell: [-2, 3, 3, 4, 4], weight: 3 },
    { cell: [4, 2, 2, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [-2, 14], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [6, 10], weight: 3 },
  ],
  bass: [
    /**
     * The tumbao. Nothing on slot 4 and nothing on slot 8 — the two places a
     * rock bass would certainly be — and the weight of the bar carried by an
     * anticipation on slot 6 and a landing on slot 12.
     */
    { name: 'tumbao', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 7, vel: 0.78 },
      { at: 12, dur: 4, tone: 0, vel: 0.74 },
      { at: 14, dur: 2, tone: 10, vel: 0.6 },
    ] },
    { name: 'tumbao-two-bar', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 7, vel: 0.76 },
      { at: 12, dur: 4, tone: 0, vel: 0.7 },
      { at: 16, dur: 3, tone: 0, vel: 0.86 },
      { at: 22, dur: 2, tone: 3, vel: 0.68 },
      { at: 26, dur: 2, tone: 5, vel: 0.66 },
      { at: 28, dur: 4, tone: 7, vel: 0.72 },
    ] },
    { name: 'cascara', weight: 3, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 3, dur: 3, tone: 7, vel: 0.66 },
      { at: 6, dur: 2, tone: 0, vel: 0.64 },
      { at: 11, dur: 3, tone: -5, vel: 0.72 },
    ] },
  ],
  comp: [
    // A montuno rather than a chank: three notes of the chord, arpeggiated
    // across the 3+3+2, which is what a piano does in this band and what a
    // guitar copies off it.
    { name: 'montuno', weight: 6, voices: 3, arpeggio: true, arpDirection: 'updown', hits: [
      { at: 0, dur: 2, vel: 0.7 },
      { at: 3, dur: 2, vel: 0.6 },
      { at: 6, dur: 2, vel: 0.66 },
      { at: 8, dur: 2, vel: 0.58 },
      { at: 11, dur: 2, vel: 0.64 },
      { at: 14, dur: 2, vel: 0.62 },
    ] },
    { name: 'chank', weight: 5, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.16 }, { at: 3, dur: 1, vel: 0.66 },
      { at: 4, dur: 1, vel: 0.12 }, { at: 6, dur: 1, vel: 0.7 },
      { at: 8, dur: 1, vel: 0.14 }, { at: 11, dur: 1, vel: 0.66 },
      { at: 12, dur: 1, vel: 0.12 }, { at: 14, dur: 1, vel: 0.7 },
    ] },
    { name: 'three-beat-clav', weight: 3, voices: 3, cycle: 12, voicing: 'guide', hits: [
      { at: 0, dur: 2, vel: 0.7 },
      { at: 3, dur: 1, vel: 0.52 },
      { at: 6, dur: 2, vel: 0.64 },
      { at: 9, dur: 1, vel: 0.5 },
    ] },
  ],
  drums: [
    { name: 'conga-trio', weight: 6, voices: {
      bd: [0, 6, 11],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      lp: [0, 6, 11],
      mp: [3, 8, 14],
      hp: [2, 10],
    } },
    { name: 'cascara', weight: 5, voices: {
      bd: [0, 6, 10],
      rim: [4, 12],
      cb: [0, 3, 6, 8, 11, 14],
      lp: [0, 8],
      mp: [6, 14],
      hh: [2, 6, 10, 14],
    } },
    { name: 'timbale', weight: 3, voices: {
      bd: [0, 6, 11],
      sd: [4, 12],
      ht: [3, 7],
      mt: [10, 14],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      tb: [0, 4, 8, 12],
    } },
  ],
  melody: { leap: 0.32, ornament: 0.34, span: 14, sequence: 0.6, syncopation: 0.85 },
};

/**
 * AFRO-FUNK — the vamp made continental, and the horn line that never lands.
 *
 * Fela and the Africa 70, Tony Allen behind them, and the West African bands who
 * heard the JB records on tour in 1970 and sent them back changed. Harmonically
 * it is `vamp` — one chord, sometimes two, for as long as anybody wants. What is
 * different is that the *parts do not share a bar*: the guitar figure is three
 * beats long, the shekere is on the bar, the bass is on two bars, and the point
 * at which all three agree comes round every six.
 *
 * `cycle: 12` on the guitar is the whole style. Against a four-beat bar a
 * three-beat figure starts on slot 0, then on slot 12 of the next bar, then on
 * slot 8, and comes home on the fourth. Nothing else in this project produces
 * that drift and no amount of writing clever bar-shaped patterns can fake it,
 * which is the argument `Cycle` makes about itself in `style/types.ts`.
 *
 * The kit is Tony Allen's, which means the *kick* is doing the syncopation and
 * the hi-hat is doing something almost but not quite in eighths. Ghosted hats
 * were not expressible per-hit when this was written, so the pattern
 * approximates the effect by leaving holes at 5 and 13 — the two slots where
 * his hand is on its way somewhere. `DrumPattern.ghosts` would say it directly
 * now, on `hh` at those two slots, and this table has not been moved onto it;
 * the `breakbeat` header carries the count and the argument.
 */
const afrofunk: Style = {
  id: 'afrofunk',
  label: 'Afro-funk',
  description:
    'One chord, a horn line, and parts that do not share a bar: a three-beat guitar figure over a two-bar bass over a four-beat kit.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [104, 126],
  swing: 0,
  modeWeights: { minor: 0.62, major: 0.38 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  shots: [[[0, 6], 4], [[0, 3, 6], 3], [[0, 6, 12], 2]],
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'iv7', 'iv7'], weight: 3, note: 'Four bars each. The two-chord version of this music, and the only version with a second chord in it' },
    ],
    chorus: [
      { chords: ['iv7', 'iv7', 'iv7', 'iv7', 'i7', 'i7', 'i7', 'i7'], weight: 5 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 4, note: 'The chorus is the same chord as the verse. What changes is that the horns have arrived' },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'iv7', 'iv7', 'iv7', 'iv7', 'iv7', 'iv7'], weight: 5 }],
    solo: [{ chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6 }],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9'], weight: 6 },
      { chords: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'IV7', 'IV7'], weight: 3 },
    ],
    chorus: [{ chords: ['IV7', 'IV7', 'IV7', 'IV7', 'I7', 'I7', 'I7', 'I7'], weight: 5 }],
    outro: [{ chords: ['I7', 'I7', 'I7', 'I7'], weight: 5 }],
  },
  melodyCells: [
    { cell: [3, 3, 2, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 2, 2, 2, 2, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [-4, 4, 2, 2, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [3, 3, 3, 3, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'two-bar-riff', weight: 6, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.6 },
      { at: 10, dur: 2, tone: 3, vel: 0.7 },
      { at: 12, dur: 4, tone: 5, vel: 0.68 },
      { at: 16, dur: 4, tone: 7, vel: 0.86 },
      { at: 22, dur: 2, tone: 5, vel: 0.62 },
      { at: 26, dur: 2, tone: 3, vel: 0.66 },
      { at: 28, dur: 4, tone: 0, vel: 0.72 },
    ] },
    { name: 'walking-riff', weight: 4, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 3, vel: 0.64 },
      { at: 6, dur: 2, tone: 5, vel: 0.62 },
      { at: 10, dur: 2, tone: 7, vel: 0.74 },
      { at: 14, dur: 2, tone: 5, vel: 0.6 },
    ] },
    { name: 'root-and-fifth', weight: 3, hits: [
      { at: 0, dur: 5, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 7, vel: 0.68 },
      { at: 11, dur: 3, tone: 0, vel: 0.7 },
    ] },
  ],
  comp: [
    /**
     * Three beats against a four-beat bar. The figure starts on slot 0, then on
     * slot 12, then on slot 8, and comes home on the fourth bar — and a listener
     * who is following it has lost the downbeat by the second, which is exactly
     * the effect this whole style is built around.
     */
    { name: 'three-beat', weight: 6, voices: 3, cycle: 12, voicing: 'guide', hits: [
      { at: 0, dur: 2, vel: 0.7 },
      { at: 3, dur: 1, vel: 0.5 },
      { at: 5, dur: 1, vel: 0.62 },
      { at: 8, dur: 2, vel: 0.66 },
      { at: 10, dur: 1, vel: 0.5 },
    ] },
    { name: 'six-beat', weight: 4, voices: 3, cycle: 24, voicing: 'guide', hits: [
      { at: 0, dur: 2, vel: 0.7 },
      { at: 4, dur: 1, vel: 0.54 },
      { at: 7, dur: 2, vel: 0.64 },
      { at: 12, dur: 2, vel: 0.66 },
      { at: 17, dur: 1, vel: 0.52 },
      { at: 20, dur: 2, vel: 0.62 },
    ] },
    { name: 'chank', weight: 3, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.16 }, { at: 2, dur: 1, vel: 0.66 },
      { at: 3, dur: 1, vel: 0.12 }, { at: 6, dur: 1, vel: 0.68 },
      { at: 8, dur: 1, vel: 0.14 }, { at: 10, dur: 1, vel: 0.66 },
      { at: 11, dur: 1, vel: 0.12 }, { at: 14, dur: 1, vel: 0.7 },
    ] },
  ],
  drums: [
    // The kick is doing the syncopation and the hat has holes in it at 5 and
    // 13 — the two slots where the hand is on its way somewhere.
    { name: 'allen', weight: 6, voices: {
      bd: [0, 3, 7, 10],
      sd: [4, 12],
      hh: [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 14, 15],
      mp: [2, 6, 10, 14],
    } },
    { name: 'shekere', weight: 5, voices: {
      bd: [0, 6, 10],
      sd: [4, 12],
      sh: [0, 2, 4, 6, 8, 10, 12, 14],
      lp: [0, 8],
      hp: [3, 11],
      hh: [4, 12],
    } },
    { name: 'sticks', weight: 3, voices: {
      bd: [0, 3, 10],
      sd: [4, 12],
      rim: [0, 3, 6, 8, 11, 14],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  melody: { leap: 0.3, ornament: 0.28, span: 15, sequence: 0.7, syncopation: 0.8 },
};

/**
 * FUNK ROCK — the amplifier is the fourth member of the rhythm section.
 *
 * Sly's later band, the Isleys with Ernie on the guitar, and everything the
 * seventies called "heavy" that still had a sixteenth grid under it. The
 * distinguishing fact is not tempo or attitude, it is *sustain*: an overdriven
 * guitar chord rings for two and a half seconds where a palm-muted one dies in a
 * quarter, so the chank is structurally unavailable and the part becomes a
 * two-note double-stop held across the beat instead.
 *
 * So this is the one style in the file whose comp patterns have **long
 * durations**. The figure is still four onsets in sixteen slots; what changed is
 * that each one lasts three or four slots rather than one, and the space between
 * them is filled by a chord still sounding rather than by silence. That is a
 * different kind of hole and it is why a funk-rock band can be a trio where a
 * JB band needs nine people.
 *
 * The kick doubles up — 0, 1 — which is the sound of two feet or one very good
 * one, and belongs to this end of the repertoire and nowhere else in this file.
 */
const funkrock: Style = {
  id: 'funkrock',
  label: 'Funk rock',
  description:
    'Overdrive instead of a damped string: held double-stops where the chank would be, a doubled kick, and a trio doing a nine-piece band’s job.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [100, 126],
  swing: 0,
  modeWeights: { minor: 0.62, major: 0.38 },
  relativeMajorChorus: 0,
  transitions: [['fill', 5], ['shot', 3], ['break', 2]],
  shots: [[[0, 6], 5], [[0, 6, 7], 3], [[0, 4, 6], 2]],
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 5 },
      { chords: ['i7', 'i7', 'VII', 'VII', 'i7', 'i7', 'VII', 'VII'], weight: 5 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 4 },
      { chords: ['i7', 'VII', 'VI', 'VII', 'i7', 'VII', 'VI', 'VI'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 5 },
      { chords: ['iv7', 'iv7', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 4 },
      { chords: ['III', 'III', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 3 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'iv7', 'iv7', 'VII', 'VII', 'VII', 'VII'], weight: 4 }],
    solo: [{ chords: ['i7', 'i7', 'i7', 'i7', 'VII', 'VII', 'i7', 'i7'], weight: 5 }],
    outro: [{ chords: ['VII', 'VII', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I7', 'I7', 'I7', 'I7', 'bVII7', 'bVII7', 'I7', 'I7'], weight: 5 },
      { chords: ['I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'I7', 'I7'], weight: 4 },
    ],
    chorus: [{ chords: ['bVII7', 'bVII7', 'IV7', 'IV7', 'I7', 'I7', 'I7', 'I7'], weight: 5 }],
    outro: [{ chords: ['bVII7', 'bVII7', 'I7', 'I7'], weight: 5 }],
  },
  melodyCells: [
    { cell: [4, 2, 2, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [3, 3, 2, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [-6, 2, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 3 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'heavy-riff', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 3, dur: 3, tone: 0, vel: 0.62 },
      { at: 6, dur: 2, tone: -2, vel: 0.76 },
      { at: 10, dur: 2, tone: 0, vel: 0.7 },
      { at: 12, dur: 4, tone: 3, vel: 0.68 },
    ] },
    { name: 'octave-riff', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 12, vel: 0.6 },
      { at: 8, dur: 2, tone: 0, vel: 0.66 },
      { at: 12, dur: 4, tone: 7, vel: 0.7 },
      { at: 16, dur: 3, tone: 0, vel: 0.86 },
      { at: 20, dur: 2, tone: 12, vel: 0.58 },
      { at: 24, dur: 2, tone: 10, vel: 0.68 },
      { at: 28, dur: 4, tone: 7, vel: 0.7 },
    ] },
    { name: 'pedal', weight: 3, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 0, vel: 0.58 },
      { at: 8, dur: 4, tone: 0, vel: 0.7 },
      { at: 14, dur: 2, tone: -2, vel: 0.66 },
    ] },
  ],
  comp: [
    /**
     * The chank is not available here and this is what replaces it. Four onsets
     * with durations of three and four slots: an overdriven double-stop rings
     * for two and a half seconds and the hole between two of them is a chord
     * still sounding, not silence.
     */
    { name: 'held-stops', weight: 6, voices: 2, voicing: 'guide', hits: [
      { at: 0, dur: 3, vel: 0.72 },
      { at: 6, dur: 4, vel: 0.7 },
      { at: 11, dur: 4, vel: 0.68 },
    ] },
    { name: 'stab-and-ring', weight: 5, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 2, vel: 0.76 },
      { at: 3, dur: 3, vel: 0.6 },
      { at: 10, dur: 6, vel: 0.7 },
    ] },
    { name: 'wah-chank', weight: 3, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.2 }, { at: 2, dur: 1, vel: 0.7 },
      { at: 4, dur: 1, vel: 0.16 }, { at: 6, dur: 1, vel: 0.72 },
      { at: 8, dur: 1, vel: 0.18 }, { at: 10, dur: 1, vel: 0.7 },
      { at: 12, dur: 1, vel: 0.16 }, { at: 14, dur: 1, vel: 0.74 },
    ] },
  ],
  drums: [
    // The doubled kick — 0 and 1 — is one foot playing two notes a sixteenth
    // apart, and it belongs to this end of the repertoire and nowhere else here.
    { name: 'doubled-kick', weight: 6, voices: {
      bd: [0, 1, 10],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'heavy', weight: 5, voices: {
      bd: [0, 6, 8, 11],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      cr: [0],
    } },
    { name: 'open-hats', weight: 3, voices: {
      bd: [0, 1, 8, 10],
      sd: [4, 12],
      hh: [0, 2, 4, 8, 10, 12],
      oh: [6, 14],
    } },
  ],
  melody: { leap: 0.38, ornament: 0.28, span: 16, sequence: 0.58, syncopation: 0.7 },
};

/**
 * BREAKBEAT FUNK — the four bars everybody else built a genre out of.
 *
 * *Funky Drummer*, *Amen, Brother*, *Synthetic Substitution*: records whose
 * lasting contribution is a drum figure with nothing on top of it. The style
 * exists because the *arrangement* is different from everything else in this
 * file — the band drops out for four bars in the middle and the kit plays alone,
 * and the whole record is remembered for those four bars.
 *
 * The engine can express that: `transitions` weights `break` above everything,
 * and `drop` is the heaviest entry in the fill palette. What it could not
 * express, when this was written, was per-hit velocity on the kit — a break is
 * *made* of ghost notes at a third of the level of the accents, and a
 * `DrumPattern` carried slot indices with no velocity column. The patterns
 * below therefore write the loud strokes and let `metricStrength` do the rest,
 * which is a fair approximation and is not the thing itself.
 *
 * **The premise is still true and the conclusion is not.** `DrumPattern` still
 * has no velocity column and is not getting one — the field that arrived is
 * `DrumPattern.ghosts`, a *second slot list* per voice, and `style/types.ts`
 * argues at length why a ghost is a category rather than a point on a
 * continuum and why a number in a style table would outrank the metre, the
 * section and the feel all at once. That doc comment quotes the sentence above
 * verbatim and names this header as the report it was built from.
 *
 * So the gesture is sayable here and is not said: **86 of the catalogue's 389
 * styles write `ghosts`, across five genres, and none of them is in this
 * file.** What is below is still the approximation, and it is an unadopted
 * mechanism now rather than an absent one. Noted here rather than worked
 * around, which is what the paragraph above always said and is now a choice
 * instead of a fact.
 *
 * Sixteen hi-hat slots on every pattern, which is the one thing about these
 * records that is *not* an approximation: the hat genuinely never stops.
 */
const breakbeat: Style = {
  id: 'breakbeat',
  label: 'Breakbeat funk',
  description:
    'The record remembered for four bars of drums alone: a kit playing continuous sixteenths, and a band that gets out of its way.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [104, 128],
  swing: 0,
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0,
  boxDrums: false,
  hook: 'earworm',
  feels: [['funk', 5], ['straight', 5]],
  /**
   * `break` above `fill`, which no other style in the project does. The gesture
   * this music is remembered for is the band stopping and the drummer carrying
   * on, and the seam is where the engine can put one.
   */
  transitions: [['break', 5], ['fill', 4], ['shot', 2]],
  fills: [['drop', 5], ['snare-toms', 4], ['snare-roll', 3], ['lead-in', 2]],
  shots: [[[0, 6], 4], [[0, 3, 6], 3]],
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 4 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv7', 'iv7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 5 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 3 },
    ],
    bridge: [{ chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 5, note: 'The bridge is the break. The harmony has nothing to add and does not try' }],
    solo: [{ chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6 }],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7'], weight: 6 },
      { chords: ['I9', 'I9', 'I9', 'I9', 'IV9', 'IV9', 'I9', 'I9'], weight: 3 },
    ],
    chorus: [{ chords: ['IV9', 'IV9', 'I9', 'I9', 'IV9', 'IV9', 'I9', 'I9'], weight: 5 }],
    outro: [{ chords: ['I7', 'I7', 'I7', 'I7'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [3, 3, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 2, 2, 2, 2, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [-4, 2, 2, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    { name: 'under-the-break', weight: 6, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.6 },
      { at: 10, dur: 2, tone: -2, vel: 0.74 },
      { at: 12, dur: 4, tone: 0, vel: 0.68 },
    ] },
    { name: 'sparse', weight: 4, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 11, dur: 3, tone: 3, vel: 0.68 },
    ] },
    { name: 'two-bar', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 7, dur: 2, tone: 0, vel: 0.6 },
      { at: 12, dur: 4, tone: 5, vel: 0.68 },
      { at: 16, dur: 4, tone: 0, vel: 0.86 },
      { at: 22, dur: 2, tone: -2, vel: 0.7 },
      { at: 26, dur: 2, tone: 3, vel: 0.64 },
      { at: 28, dur: 4, tone: 0, vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'chank', weight: 6, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.16 }, { at: 1, dur: 1, vel: 0.1 },
      { at: 2, dur: 1, vel: 0.68 }, { at: 3, dur: 1, vel: 0.12 },
      { at: 6, dur: 1, vel: 0.7 }, { at: 7, dur: 1, vel: 0.12 },
      { at: 10, dur: 1, vel: 0.66 }, { at: 11, dur: 1, vel: 0.1 },
      { at: 14, dur: 1, vel: 0.72 }, { at: 15, dur: 1, vel: 0.12 },
    ] },
    { name: 'two-stabs', weight: 4, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 2, vel: 0.72 },
      { at: 10, dur: 2, vel: 0.68 },
    ] },
    { name: 'organ', weight: 2, voices: 4, sustain: true, hits: [
      { at: 0, dur: 16, vel: 0.42 },
    ] },
  ],
  drums: [
    // The one everybody sampled. Ghost notes were not expressible per hit when
    // this was written, so what is here is where the loud strokes are;
    // `DrumPattern.ghosts` exists now and this table has not been moved onto
    // it. See the style header.
    { name: 'the-break', weight: 6, voices: {
      bd: [0, 10],
      sd: [4, 12, 14],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    } },
    { name: 'amen', weight: 5, voices: {
      bd: [0, 2, 10],
      sd: [4, 7, 12, 13],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      cr: [0],
    } },
    { name: 'rolling', weight: 4, voices: {
      bd: [0, 3, 8, 11],
      sd: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      rim: [7, 15],
    } },
  ],
  melody: { leap: 0.26, ornament: 0.26, span: 12, sequence: 0.7, syncopation: 0.72 },
};

/**
 * BALLAD FUNK — the slow one, and the only place in this genre with a real
 * chord progression.
 *
 * Deep soul at 68: a Rhodes, a bass that finally gets to move, strings, and a
 * drummer playing sixteenths so slowly that they read as ornament rather than as
 * pulse. It is the one style here whose harmony is genuinely functional — the
 * `ii7 V7 I` in the chorus table below is not a borrowing from jazz, it is what
 * these songs were written on — and the one whose melody has phrases in it
 * rather than a riff.
 *
 * Which is why `span` is 19, the widest in the file, and `syncopation` is 0.55,
 * the narrowest. A ballad line has to be *singable*, and the anticipated
 * downbeat that carries every other style here would put the singer a sixteenth
 * ahead of a band that is barely moving.
 *
 * At 68 BPM a sixteenth is 220 milliseconds, which is long enough for each one
 * to be heard as an event. That is the whole reason the drum patterns below can
 * afford sixteen hi-hat slots and still leave the bar feeling empty.
 */
const ballad: Style = {
  id: 'ballad',
  label: 'Ballad funk',
  description:
    'Deep soul at 68: a Rhodes, strings, a bass that gets to move, and sixteenths slow enough to be heard one at a time.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [60, 78],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  /**
   * The only style here that draws `laidback` at weight. A ballad drummer sits
   * behind the beat and stays there; at 68 that is not a lean, it is the whole
   * performance.
   */
  feels: [['laidback', 5], ['straight', 4], ['pocket', 3]],
  progressions: {
    intro: [{ chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7'], weight: 5 }],
    verse: [
      { chords: ['Imaj7', 'Imaj7', 'vi7', 'vi7', 'ii7', 'ii7', 'V7', 'V7'], weight: 5 },
      { chords: ['Imaj7', 'iii7', 'IVmaj7', 'V7', 'Imaj7', 'iii7', 'ii7', 'V7'], weight: 4 },
      { chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'bVII7', 'bVII7'], weight: 4 },
      { chords: ['I9', 'I9', 'IV9', 'IV9', 'I9', 'I9', 'IV9', 'IV9'], weight: 3 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'IVmaj7', 'iii7', 'vi7', 'ii7', 'ii7', 'V7', 'V7'], weight: 5 },
      { chords: ['IVmaj7', 'V7', 'iii7', 'vi7', 'IVmaj7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['bVImaj7', 'bVImaj7', 'bVII7', 'bVII7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'], weight: 3, note: 'Both chords borrowed out of the parallel minor, which is how a sweet chorus stays sad' },
    ],
    bridge: [{ chords: ['vi7', 'vi7', 'ii7', 'ii7', 'IVmaj7', 'IVmaj7', 'V7', 'V7'], weight: 4 }],
    solo: [{ chords: ['Imaj7', 'Imaj7', 'vi7', 'vi7', 'ii7', 'ii7', 'V7', 'V7'], weight: 5 }],
    outro: [{ chords: ['IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7'], weight: 5 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'iv9', 'iv9', 'iv9', 'iv9'], weight: 4 },
      { chords: ['i7', 'i7', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'III', 'III', 'iv7', 'iv7', 'VII', 'VII'], weight: 5 },
      { chords: ['iv7', 'iv7', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 4 },
    ],
    outro: [{ chords: ['iv7', 'iv7', 'i7', 'i7'], weight: 5 }],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [6, 2, 8], weight: 4 },
    { cell: [-2, 2, 4, 8], weight: 3 },
    { cell: [4, 2, 2, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
    { cell: [-8, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 4 },
    { cell: [-8, 8], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    // The one bass table in this file written in chord functions rather than in
    // numbers, and the reason is that this is the one style whose harmony
    // actually moves — a fixed shape dragged across a ii–V would be wrong about
    // the music rather than faithful to a riff.
    { name: 'moving', weight: 6, hits: [
      { at: 0, dur: 6, tone: 'root', vel: 1 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.7 },
      { at: 12, dur: 4, tone: 'third', vel: 0.66 },
    ] },
    { name: 'walking-in', weight: 4, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 },
      { at: 6, dur: 2, tone: 'octave', vel: 0.62 },
      { at: 10, dur: 2, tone: 'seventh', vel: 0.66 },
      { at: 12, dur: 4, tone: 'approach', vel: 0.68 },
    ] },
    { name: 'held', weight: 3, sustain: true, hits: [
      { at: 0, dur: 12, tone: 'root', vel: 1 },
      { at: 12, dur: 4, tone: 'fifth', vel: 0.66 },
    ] },
  ],
  comp: [
    { name: 'rhodes-hold', weight: 6, voices: 4, sustain: true, hits: [
      { at: 0, dur: 10, vel: 0.52 },
      { at: 12, dur: 4, vel: 0.46 },
    ] },
    { name: 'rhodes-figure', weight: 5, voices: 4, hits: [
      { at: 0, dur: 3, vel: 0.56 },
      { at: 6, dur: 2, vel: 0.48 },
      { at: 10, dur: 2, vel: 0.5 },
      { at: 14, dur: 2, vel: 0.46 },
    ] },
    { name: 'soft-chank', weight: 3, voices: 3, voicing: 'guide', hits: [
      { at: 2, dur: 1, vel: 0.48 }, { at: 6, dur: 1, vel: 0.5 },
      { at: 10, dur: 1, vel: 0.46 }, { at: 14, dur: 1, vel: 0.52 },
    ] },
  ],
  drums: [
    { name: 'slow-sixteenths', weight: 6, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    } },
    { name: 'rim-ballad', weight: 5, voices: {
      bd: [0, 11],
      rim: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      tb: [8],
    } },
    { name: 'triplet-feel', weight: 3, voices: {
      bd: [0, 6, 10],
      sd: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      oh: [14],
    } },
  ],
  melody: { leap: 0.34, ornament: 0.5, span: 19, sequence: 0.5, syncopation: 0.55 },
};

/**
 * P-FUNK — the long side, the synth bass, and the third chord.
 *
 * Parliament and Funkadelic after 1974: a Minimoog playing the bass line, a
 * clavinet and two guitars, a horn section, and a record long enough for the
 * groove to change twice. It is the first style in this file whose harmony is
 * allowed to *go somewhere* — not a progression, but a second and third area
 * that the vamp visits and returns from — and the first whose form is long
 * enough to make that worth doing.
 *
 * The bass patterns are the difference. A Bootsy or a Bernie Worrell bass line
 * has more onsets than a JB one and covers a wider span, because a synthesiser
 * has no fret hand and an envelope filter makes every note an event. `sixteenth`
 * below has seven onsets in the bar against `vamp/the-one`'s four, and the
 * eleventh slot is the one nobody expects.
 *
 * Major-primary, and the reason is not brightness. A P-Funk vamp is built on a
 * dominant seventh with a ♯9 sitting on top of it — the chord with a major third
 * and a minor third in it at the same time — and that is spelled in a major-mode
 * table or it is not spelled at all.
 */
const pfunk: Style = {
  id: 'pfunk',
  label: 'P-Funk',
  description:
    'The long side: a Minimoog on the bass line, a clavinet, two guitars, horns, and a groove with room to change twice.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [92, 114],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  transitions: [['fill', 4], ['break', 3], ['shot', 3]],
  shots: [[[0, 6], 4], [[0, 6, 7], 3], [[0, 3, 6], 3], [[0, 10], 2]],
  progressions: {
    intro: [
      { chords: ['I7#9', 'I7#9', 'I7#9', 'I7#9'], weight: 5, note: 'The chord with both thirds in it, which is what this whole band is tuned to' },
      { chords: ['I9', 'I9', 'I9', 'I9'], weight: 3 },
    ],
    verse: [
      { chords: ['I7#9', 'I7#9', 'I7#9', 'I7#9', 'I7#9', 'I7#9', 'I7#9', 'I7#9'], weight: 5 },
      { chords: ['I9', 'I9', 'I9', 'I9', 'IV9', 'IV9', 'I9', 'I9'], weight: 5 },
      { chords: ['I7', 'I7', 'I7', 'I7', 'bIII7', 'bIII7', 'I7', 'I7'], weight: 3, note: 'A minor third up and back — the second area, and about as far as this music travels' },
      { chords: ['I7sus4', 'I7sus4', 'I7', 'I7', 'I7sus4', 'I7sus4', 'I7', 'I7'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV9', 'IV9', 'IV9', 'IV9', 'I9', 'I9', 'I9', 'I9'], weight: 5 },
      { chords: ['bVII9', 'bVII9', 'IV9', 'IV9', 'I9', 'I9', 'I9', 'I9'], weight: 4 },
      { chords: ['bVImaj7', 'bVImaj7', 'bVII9', 'bVII9', 'I9', 'I9', 'I9', 'I9'], weight: 3 },
    ],
    bridge: [
      { chords: ['bIII7', 'bIII7', 'bVI7', 'bVI7', 'bII7', 'bII7', 'I7', 'I7'], weight: 3, note: 'The mothership section: three flat areas in a row and no way back except straight down' },
      { chords: ['IV9', 'IV9', 'IV9', 'IV9', 'bVII9', 'bVII9', 'bVII9', 'bVII9'], weight: 4 },
    ],
    solo: [{ chords: ['I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9'], weight: 5 }],
    outro: [{ chords: ['IV9', 'IV9', 'I9', 'I9'], weight: 5 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 5 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'iv9', 'iv9', 'i9', 'i9'], weight: 4 },
      { chords: ['i7', 'i7', 'III7', 'III7', 'i7', 'i7', 'VII7', 'VII7'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv9', 'iv9', 'iv9', 'iv9', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['VI', 'VI', 'VII7', 'VII7', 'i9', 'i9', 'i9', 'i9'], weight: 4 },
    ],
    outro: [{ chords: ['iv9', 'iv9', 'i9', 'i9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 2, 2, 4], weight: 5 },
    { cell: [3, 3, 2, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 2, 2, 4], weight: 4 },
    { cell: [-4, 2, 2, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [8, 2, 2, 4], weight: 2 },
    { cell: [-6, 2, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    /**
     * Seven onsets where the JB figure has four. A synthesiser has no fret hand
     * to tire and an envelope filter makes every one of them an event, so the
     * bar can carry a figure this dense without turning into a wall.
     */
    { name: 'sixteenth', weight: 6, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 2, dur: 1, tone: 0, vel: 0.5 },
      { at: 3, dur: 2, tone: 3, vel: 0.66 },
      { at: 6, dur: 2, tone: 5, vel: 0.7 },
      { at: 8, dur: 2, tone: 0, vel: 0.62 },
      { at: 11, dur: 2, tone: -2, vel: 0.74 },
      { at: 14, dur: 2, tone: 0, vel: 0.68 },
    ] },
    { name: 'moog-riff', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 12, vel: 0.62 },
      { at: 7, dur: 2, tone: 10, vel: 0.66 },
      { at: 10, dur: 2, tone: 7, vel: 0.7 },
      { at: 14, dur: 2, tone: 5, vel: 0.64 },
      { at: 16, dur: 3, tone: 0, vel: 0.86 },
      { at: 21, dur: 2, tone: 3, vel: 0.62 },
      { at: 24, dur: 2, tone: 5, vel: 0.66 },
      { at: 27, dur: 2, tone: 3, vel: 0.6 },
      { at: 30, dur: 2, tone: 0, vel: 0.7 },
    ] },
    { name: 'wide', weight: 4, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 5, dur: 2, tone: 12, vel: 0.62 },
      { at: 8, dur: 2, tone: 7, vel: 0.68 },
      { at: 11, dur: 3, tone: 3, vel: 0.7 },
      { at: 14, dur: 2, tone: 0, vel: 0.66 },
    ] },
  ],
  comp: [
    { name: 'clav-chank', weight: 6, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.18 }, { at: 1, dur: 1, vel: 0.1 },
      { at: 2, dur: 1, vel: 0.7 }, { at: 3, dur: 1, vel: 0.14 },
      { at: 5, dur: 1, vel: 0.6 }, { at: 6, dur: 1, vel: 0.72 },
      { at: 8, dur: 1, vel: 0.14 }, { at: 10, dur: 1, vel: 0.68 },
      { at: 11, dur: 1, vel: 0.12 }, { at: 13, dur: 1, vel: 0.58 },
      { at: 14, dur: 1, vel: 0.72 },
    ] },
    { name: 'two-guitars', weight: 5, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 2, vel: 0.7 },
      { at: 3, dur: 1, vel: 0.56 },
      { at: 6, dur: 2, vel: 0.68 },
      { at: 10, dur: 1, vel: 0.6 },
      { at: 12, dur: 2, vel: 0.66 },
      { at: 15, dur: 1, vel: 0.54 },
    ] },
    { name: 'three-beat-clav', weight: 4, voices: 3, cycle: 12, voicing: 'guide', hits: [
      { at: 0, dur: 2, vel: 0.7 },
      { at: 3, dur: 1, vel: 0.5 },
      { at: 6, dur: 2, vel: 0.66 },
      { at: 10, dur: 1, vel: 0.52 },
    ] },
  ],
  drums: [
    { name: 'the-one', weight: 6, voices: {
      bd: [0, 7, 10],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      tb: [2, 6, 10, 14],
    } },
    { name: 'sixteenth-hat', weight: 5, voices: {
      bd: [0, 3, 8, 11],
      sd: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    } },
    { name: 'open-and-clap', weight: 4, voices: {
      bd: [0, 6, 10],
      sd: [4, 12],
      cp: [4, 12],
      hh: [0, 2, 4, 8, 10, 12],
      oh: [6, 14],
    } },
  ],
  melody: { leap: 0.32, ornament: 0.34, span: 15, sequence: 0.62, syncopation: 0.78 },
};

/**
 * CLAVINET FUNK — the instrument that made rhythm out of harmony.
 *
 * A rubber tangent strikes the string and a yarn damper stops it dead the moment
 * the key comes up — the catalogue's own comment on `clavinet` says so, and adds
 * the sentence this whole style is built on: *that is why a clav riff is heard as
 * rhythm and a Rhodes chord as harmony*. Half a second of decay against an
 * electric piano's two, and the same notes stop being a chord and become a
 * pattern.
 *
 * So this style inverts the usual division of labour. The comp is the subject
 * and the bass is the accompaniment: every comp table below is a *riff* — a
 * specific shape at a specific set of slots — and the bass tables are the
 * simplest in this file, two or three onsets holding still underneath. Where
 * every other style writes the memorable figure on the bass, this one writes it
 * on the keyboard, which is what the records do.
 *
 * `cycle: 12` on the leading figure. A three-beat clav pattern against a
 * four-beat bar is the part on half the records worth naming, and the reason it
 * works is that the *left* hand and the drums stay on the bar while the right
 * hand does not.
 */
const clav: Style = {
  id: 'clav',
  label: 'Clavinet funk',
  description:
    'The keyboard is the riff and the bass is the accompaniment: a three-beat clav figure over a four-beat bar, damped dead on release.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [96, 118],
  swing: 0,
  modeWeights: { minor: 0.7, major: 0.3 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  requireLayers: ['comp'],
  shots: [[[0, 6], 4], [[0, 3, 6], 3], [[0, 6, 12], 2]],
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'iv9', 'iv9', 'i9', 'i9'], weight: 4 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'VII', 'VII', 'i7', 'i7'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv7', 'iv7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 5 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 4 },
      { chords: ['iv7', 'iv7', 'VII', 'VII', 'III', 'III', 'i7', 'i7'], weight: 3 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'iv7', 'iv7', 'VII', 'VII', 'VII', 'VII'], weight: 4 }],
    solo: [{ chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 5 }],
    outro: [{ chords: ['VII', 'VII', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9'], weight: 6 },
      { chords: ['I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'I7', 'I7'], weight: 4 },
    ],
    chorus: [{ chords: ['IV9', 'IV9', 'I9', 'I9', 'bVII7', 'bVII7', 'I9', 'I9'], weight: 5 }],
    outro: [{ chords: ['bVII7', 'bVII7', 'I9', 'I9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [3, 3, 2, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 2, 2, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [-4, 2, 2, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    // Holding still. In this style the memorable figure is on the keyboard and
    // a bass playing a second one would be two lead parts.
    { name: 'hold', weight: 6, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 10, dur: 4, tone: 0, vel: 0.7 },
    ] },
    { name: 'root-octave', weight: 5, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 12, vel: 0.58 },
      { at: 10, dur: 2, tone: 0, vel: 0.7 },
      { at: 14, dur: 2, tone: 3, vel: 0.64 },
    ] },
    { name: 'answer', weight: 3, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 8, dur: 2, tone: 5, vel: 0.66 },
      { at: 11, dur: 2, tone: 3, vel: 0.68 },
      { at: 14, dur: 2, tone: 0, vel: 0.64 },
    ] },
  ],
  comp: [
    /**
     * The three-beat clav. Twelve slots against a sixteen-slot bar, so the
     * figure starts on the downbeat, then on beat four, then on beat three, and
     * comes back round every three bars — while the kit and the bass have not
     * moved. That disagreement is the record.
     */
    { name: 'three-beat-riff', weight: 6, voices: 3, cycle: 12, hits: [
      { at: 0, dur: 2, vel: 0.78 },
      { at: 2, dur: 1, vel: 0.5 },
      { at: 4, dur: 1, vel: 0.62 },
      { at: 6, dur: 2, vel: 0.72 },
      { at: 9, dur: 1, vel: 0.56 },
      { at: 10, dur: 2, vel: 0.66 },
    ] },
    { name: 'bar-riff', weight: 5, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.8 },
      { at: 2, dur: 1, vel: 0.5 },
      { at: 3, dur: 1, vel: 0.62 },
      { at: 6, dur: 2, vel: 0.74 },
      { at: 8, dur: 1, vel: 0.5 },
      { at: 10, dur: 2, vel: 0.7 },
      { at: 13, dur: 1, vel: 0.56 },
      { at: 14, dur: 2, vel: 0.68 },
    ] },
    { name: 'two-bar-riff', weight: 4, voices: 3, cycle: 32, hits: [
      { at: 0, dur: 2, vel: 0.8 },
      { at: 3, dur: 1, vel: 0.56 },
      { at: 6, dur: 2, vel: 0.72 },
      { at: 10, dur: 1, vel: 0.6 },
      { at: 12, dur: 2, vel: 0.68 },
      { at: 16, dur: 2, vel: 0.76 },
      { at: 18, dur: 1, vel: 0.52 },
      { at: 21, dur: 1, vel: 0.6 },
      { at: 24, dur: 2, vel: 0.7 },
      { at: 28, dur: 2, vel: 0.66 },
      { at: 31, dur: 1, vel: 0.54 },
    ] },
  ],
  drums: [
    { name: 'straight', weight: 6, voices: {
      bd: [0, 6, 10],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'sixteenth-hat', weight: 5, voices: {
      bd: [0, 3, 10],
      sd: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      tb: [4, 12],
    } },
    { name: 'clap', weight: 3, voices: {
      bd: [0, 7, 10],
      sd: [4, 12],
      cp: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  melody: { leap: 0.28, ornament: 0.3, span: 13, sequence: 0.7, syncopation: 0.78 },
};

/**
 * JAZZ-FUNK — the one style here whose harmony moves, and the one exception to
 * the genre's scale rule.
 *
 * Herbie's band after 1973, Donald Byrd, the CTI shelf: a head over changes that
 * actually change, played by people whose other job was bebop. Two chords a bar
 * in places, min11 and maj9 and sus voicings, and a bass line that has to know
 * which chord it is on.
 *
 * ## Why this is the file's only `scaleForChord`
 *
 * `funk/index.ts` roots the melody scale on the *tonic* and leaves it there,
 * because a funk line is a fixed scale over a bass that is not moving and
 * re-orienting onto each chord would be a bebop line over a vamp. That is right
 * for twenty-one of these twenty-two styles and it is flatly wrong for this one.
 * Here the changes are the content: a `min11` on the ♭III and a `dom7sus4` on the
 * ♭VII are two different colours the player is *aiming at*, and a tonic
 * pentatonic dragged over both hears neither.
 *
 * So this style makes a claim about itself rather than about its genre, which is
 * exactly what `Style.scaleForChord` documents itself as being for — and it is
 * the mirror image of the one other use in the project. Jazz follows the chord
 * and its blues overrides to a tonic scale; funk follows the tonic and its
 * jazz-funk overrides to the chord. One field, two genres, opposite directions.
 */
const jazzfunk: Style = {
  id: 'jazzfunk',
  label: 'Jazz-funk',
  description:
    'A head over changes that actually change: min11 and sus voicings, a bass that has to know where it is, and a line that re-orients bar by bar.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [98, 126],
  swing: 0,
  modeWeights: { minor: 0.7, major: 0.3 },
  relativeMajorChorus: 0,
  /**
   * `loose` rather than the genre's `catchy`. This is the corner of the
   * repertoire that improvises, and a solo chorus recalled bar for bar would be
   * the one thing the idiom refuses.
   */
  hook: 'loose',
  strictness: 'light',
  /**
   * The chord decides, not the key. See the header — this is the exception the
   * genre's rule is stated against, and it is deliberately the *jazz* mapping
   * rather than a third answer: min11 and min7 take dorian on their own root,
   * the suspended dominant takes mixolydian, and a maj9 takes lydian because in
   * this repertoire a major seventh chord is nearly always a ♯11 chord with the
   * fourth left out.
   */
  scaleForChord: (tonic, mode, chord) => {
    switch (chord.quality) {
      case 'min7': case 'min9': case 'min11': case 'min6': case 'min':
        return makeScale(chord.root, 'dorian');
      case 'dom7': case 'dom9': case 'dom13': case 'dom7sus4': case 'sus4': case 'sus2':
        return makeScale(chord.root, 'mixolydian');
      case 'maj7': case 'maj9': case 'maj6': case 'maj':
        return makeScale(chord.root, 'lydian');
      case 'dom7sharp9':
        // Both thirds at once. The blues scale is the one that has them.
        return makeScale(chord.root, 'blues');
      default:
        return makeScale(tonic, mode === 'minor' ? 'dorian' : 'mixolydian');
    }
  },
  progressions: {
    intro: [{ chords: ['i11', 'i11', 'bII9', 'bII9'], weight: 5 }],
    verse: [
      { chords: ['i11', 'i11', 'IV9', 'IV9', 'i11', 'i11', 'VII9', 'VII9'], weight: 5, note: 'The dorian vamp with a real major IV in it — the sixth degree raised, which is what makes this dorian rather than aeolian' },
      { chords: ['i11', 'i11', 'i11', 'i11', 'IIImaj7', 'IIImaj7', 'VImaj7', 'VImaj7'], weight: 1 },
      { chords: ['i11', 'IIImaj7', 'iv9', 'VII9', 'i11', 'IIImaj7', 'iv9', 'VII9'], weight: 4 },
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'VII9', 'VII9', 'IIImaj7', 'IIImaj7'], weight: 1 },
      { chords: ['i11', 'i11', 'VII9', 'VII9', 'VImaj7', 'VImaj7', 'VII9', 'VII9'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv9', 'iv9', 'VII9', 'VII9', 'IIImaj7', 'IIImaj7', 'VImaj7', 'VImaj7'], weight: 5, note: 'Round the circle out of the relative major and back, which is the bebop half of this music showing' },
      { chords: ['bIImaj7', 'bIImaj7', 'i11', 'i11', 'bIImaj7', 'bIImaj7', 'i11', 'i11'], weight: 4 },
      { chords: ['VImaj7', 'VImaj7', 'VII9', 'VII9', 'i11', 'i11', 'i11', 'i11'], weight: 4 },
    ],
    bridge: [
      { chords: ['iv9', 'iv9', 'VIImaj7', 'VIImaj7', 'IIImaj7', 'IIImaj7', 'VII9', 'VII9'], weight: 4 },
      { chords: ['bII9', 'bII9', 'i11', 'i11', 'bII9', 'bII9', 'VII9', 'VII9'], weight: 3 },
    ],
    solo: [{ chords: ['i11', 'i11', 'IV9', 'IV9', 'i11', 'i11', 'VII9', 'VII9'], weight: 5 }],
    outro: [{ chords: ['VII9', 'VII9', 'i11', 'i11'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'bVII9', 'bVII9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9'], weight: 5 },
      { chords: ['Imaj9', 'Imaj9', 'vi11', 'vi11', 'ii11', 'ii11', 'V7sus4', 'V7sus4'], weight: 1 },
      { chords: ['I9', 'I9', 'IV9', 'IV9', 'bVII9', 'bVII9', 'I9', 'I9'], weight: 4 },
    ],
    chorus: [
      { chords: ['IVmaj9', 'IVmaj9', 'bVII9', 'bVII9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 },
      { chords: ['bVImaj9', 'bVImaj9', 'bVII9', 'bVII9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 3 },
    ],
    outro: [{ chords: ['bVII9', 'bVII9', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 2, 2, 2, 2], weight: 5 },
    { cell: [-2, 2, 2, 2, 2, 2, 4], weight: 5 },
    { cell: [4, 2, 2, 2, 2, 4], weight: 4 },
    { cell: [3, 3, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 2, 2, 4], weight: 4 },
    { cell: [-4, 2, 2, 2, 2, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [8, 2, 2, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [12, 4], weight: 4 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    // Chord functions, not numbers, and this is the one place in the genre
    // where that is the right answer: the changes are the content, and a fixed
    // shape dragged across a bIII would be deaf to it.
    { name: 'changes', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 4, dur: 2, tone: 'fifth', vel: 0.64 },
      { at: 7, dur: 2, tone: 'seventh', vel: 0.68 },
      { at: 10, dur: 2, tone: 'octave', vel: 0.66 },
      { at: 13, dur: 3, tone: 'fifth', vel: 0.62 },
    ] },
    { name: 'sixteenth-changes', weight: 5, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 },
      { at: 3, dur: 2, tone: 'root', vel: 0.56 },
      { at: 6, dur: 2, tone: 'third', vel: 0.68 },
      { at: 8, dur: 2, tone: 'fifth', vel: 0.62 },
      { at: 11, dur: 2, tone: 'seventh', vel: 0.7 },
      { at: 14, dur: 2, tone: 'approach', vel: 0.64 },
    ] },
    { name: 'held-changes', weight: 3, hits: [
      { at: 0, dur: 6, tone: 'root', vel: 1 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.68 },
      { at: 12, dur: 4, tone: 'seventh', vel: 0.62 },
    ] },
  ],
  comp: [
    { name: 'rhodes-stabs', weight: 6, voices: 4, voicing: 'guide', hits: [
      { at: 0, dur: 2, vel: 0.62 },
      { at: 3, dur: 1, vel: 0.5 },
      { at: 6, dur: 2, vel: 0.6 },
      { at: 11, dur: 2, vel: 0.58 },
      { at: 14, dur: 2, vel: 0.56 },
    ] },
    { name: 'rhodes-chank', weight: 5, voices: 4, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.16 }, { at: 2, dur: 1, vel: 0.6 },
      { at: 4, dur: 1, vel: 0.14 }, { at: 6, dur: 1, vel: 0.62 },
      { at: 8, dur: 1, vel: 0.16 }, { at: 10, dur: 1, vel: 0.6 },
      { at: 12, dur: 1, vel: 0.14 }, { at: 14, dur: 1, vel: 0.64 },
    ] },
    { name: 'held', weight: 3, voices: 4, voicing: 'guide', sustain: true, hits: [
      { at: 0, dur: 12, vel: 0.5 },
      { at: 14, dur: 2, vel: 0.46 },
    ] },
  ],
  drums: [
    { name: 'straight-sixteenth', weight: 6, voices: {
      bd: [0, 6, 10],
      sd: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    } },
    { name: 'ride-funk', weight: 4, voices: {
      bd: [0, 3, 10],
      sd: [4, 12],
      rd: [0, 2, 4, 6, 8, 10, 12, 14],
      hh: [4, 12],
    } },
    { name: 'busy', weight: 4, voices: {
      bd: [0, 3, 7, 10],
      sd: [4, 12, 15],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      mp: [2, 6, 10, 14],
    } },
  ],
  melody: { leap: 0.44, ornament: 0.32, span: 18, sequence: 0.4, syncopation: 0.68 },
};

/**
 * DISCO-FUNK — the kick lands on all four, and everything else has to move.
 *
 * The moment the bass drum stops syncopating is the moment this genre turns into
 * another one, and it is worth being exact about what changes. A four-on-the-floor
 * kick occupies slots 0, 4, 8 and 12 — the four the funk kick was carefully
 * *avoiding* — so the syncopation has nowhere left to live on the kit and moves
 * onto the open hi-hat, which now sounds on every offbeat eighth. That single
 * swap is the whole difference between a 1974 record and a 1977 one, and every
 * other change (the strings, the length, the tempo) follows from a floor that no
 * longer has to be told where the beat is.
 *
 * The bass keeps its riff and loses its holes: `octave-eighths` below is the
 * root and the octave alternating on every eighth, which is the most-copied bass
 * part of the decade and is *not* a funk bass line — it has no space in it at
 * all, and space is what funk is made of.
 *
 * Minor-leaning, which surprises people who remember the genre as cheerful. The
 * records are in D minor and A minor because a string section over a four-four
 * kick is euphoric whatever the mode, and the mode is free to be sad.
 */
const disco: Style = {
  id: 'disco',
  label: 'Disco-funk',
  description:
    'Four on the floor, the syncopation moved onto the open hat, strings on top, and a bass that alternates root and octave with no holes at all.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [110, 128],
  swing: 0,
  modeWeights: { minor: 0.58, major: 0.42 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
    verse: [
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'iv7', 'iv7'], weight: 5 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'VII9', 'VII9', 'VII9', 'VII9'], weight: 4 },
      { chords: ['i7', 'i7', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'VII9', 'VII9', 'III', 'III'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 5 },
      { chords: ['iv7', 'iv7', 'VII7', 'VII7', 'III', 'III', 'VI', 'VI'], weight: 4 },
      { chords: ['iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9', 'i9', 'i9'], weight: 4 },
    ],
    bridge: [{ chords: ['III', 'III', 'VI', 'VI', 'iv7', 'iv7', 'VII7', 'VII7'], weight: 4 }],
    solo: [{ chords: ['i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'VII7', 'VII7'], weight: 5 }],
    outro: [{ chords: ['VII7', 'VII7', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7'], weight: 5 },
      { chords: ['I9', 'I9', 'vi7', 'vi7', 'ii7', 'ii7', 'V7', 'V7'], weight: 4 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'IVmaj7', 'V7', 'V7', 'iii7', 'iii7', 'vi7', 'vi7'], weight: 5 },
      { chords: ['IV9', 'IV9', 'I9', 'I9', 'IV9', 'IV9', 'I9', 'I9'], weight: 3 },
    ],
    outro: [{ chords: ['IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7'], weight: 5 }],
  },
  melodyCells: [
    { cell: [4, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 4, 2, 4], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [3, 3, 2, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    /**
     * Root and octave on every eighth. Eight onsets in sixteen slots and not a
     * single hole — the most-copied bass part of the decade and the least funk
     * thing in this file, which is the whole reason the style is separate.
     */
    { name: 'octave-eighths', weight: 6, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 2, dur: 2, tone: 12, vel: 0.66 },
      { at: 4, dur: 2, tone: 0, vel: 0.74 },
      { at: 6, dur: 2, tone: 12, vel: 0.64 },
      { at: 8, dur: 2, tone: 0, vel: 0.78 },
      { at: 10, dur: 2, tone: 12, vel: 0.64 },
      { at: 12, dur: 2, tone: 0, vel: 0.74 },
      { at: 14, dur: 2, tone: 12, vel: 0.66 },
    ] },
    { name: 'disco-riff', weight: 5, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 0, vel: 0.66 },
      { at: 6, dur: 2, tone: 7, vel: 0.7 },
      { at: 8, dur: 2, tone: 12, vel: 0.64 },
      { at: 11, dur: 3, tone: 10, vel: 0.7 },
      { at: 14, dur: 2, tone: 7, vel: 0.64 },
    ] },
    { name: 'chugging', weight: 3, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 3, dur: 2, tone: 0, vel: 0.6 },
      { at: 6, dur: 2, tone: 0, vel: 0.68 },
      { at: 8, dur: 2, tone: 7, vel: 0.7 },
      { at: 11, dur: 2, tone: 5, vel: 0.66 },
      { at: 14, dur: 2, tone: 3, vel: 0.64 },
    ] },
  ],
  comp: [
    // Nile Rodgers' hand: the chank at a higher accent-to-ghost ratio than
    // anywhere else here, because in this arrangement the guitar is the only
    // thing carrying the sixteenth grid the kick has stopped implying.
    { name: 'disco-chank', weight: 6, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.2 }, { at: 1, dur: 1, vel: 0.12 },
      { at: 2, dur: 1, vel: 0.74 }, { at: 3, dur: 1, vel: 0.16 },
      { at: 4, dur: 1, vel: 0.2 }, { at: 5, dur: 1, vel: 0.12 },
      { at: 6, dur: 1, vel: 0.76 }, { at: 7, dur: 1, vel: 0.16 },
      { at: 8, dur: 1, vel: 0.2 }, { at: 9, dur: 1, vel: 0.12 },
      { at: 10, dur: 1, vel: 0.74 }, { at: 11, dur: 1, vel: 0.16 },
      { at: 12, dur: 1, vel: 0.2 }, { at: 13, dur: 1, vel: 0.12 },
      { at: 14, dur: 1, vel: 0.78 }, { at: 15, dur: 1, vel: 0.16 },
    ] },
    { name: 'string-stabs', weight: 4, voices: 4, hits: [
      { at: 0, dur: 2, vel: 0.62 },
      { at: 6, dur: 2, vel: 0.6 },
      { at: 12, dur: 3, vel: 0.64 },
    ] },
    { name: 'piano-eighths', weight: 3, voices: 4, hits: [
      { at: 2, dur: 1, vel: 0.58 }, { at: 6, dur: 1, vel: 0.6 },
      { at: 10, dur: 1, vel: 0.58 }, { at: 14, dur: 1, vel: 0.62 },
    ] },
  ],
  drums: [
    // Four on the floor, and the syncopation on the open hat. Slots 0, 4, 8, 12
    // for the kick — the four the funk kick spends its whole life avoiding.
    { name: 'four-on-the-floor', weight: 6, voices: {
      bd: [0, 4, 8, 12],
      sd: [4, 12],
      hh: [0, 4, 8, 12],
      oh: [2, 6, 10, 14],
    } },
    { name: 'clap-and-hat', weight: 5, voices: {
      bd: [0, 4, 8, 12],
      cp: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      oh: [14],
      tb: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'sixteenth-hat', weight: 3, voices: {
      bd: [0, 4, 8, 12],
      sd: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      cb: [0, 8],
    } },
  ],
  melody: { leap: 0.36, ornament: 0.3, span: 17, sequence: 0.6, syncopation: 0.62 },
};

/**
 * SLAP FEATURE — the bass takes the tune, and the thumb is a percussion
 * instrument.
 *
 * Larry Graham invented the technique to replace a drummer, and the tables here
 * take that literally: the bass figure below has more onsets than the kit's kick
 * pattern, and the two are written to interlock rather than to double. `slapBass`
 * is the thumb and `slapBass2` is the popped finger — General MIDI happens to
 * have given the two halves of one technique two programmes, and a funk line
 * alternates them, which is why both are in the era palettes.
 *
 * The style's real claim is on the *arrangement* rather than the groove:
 * `solo.rotation` in `funk/index.ts` gives the bass a chorus more often than any
 * other genre here does, and this is the style where that pays. Everything else
 * is written to leave the bottom of the mix alone — the comp table is thin and
 * high, the kick is spare, and the melody's span is the narrowest in the file,
 * because the tune is not the point of this number.
 */
const slap: Style = {
  id: 'slap',
  label: 'Slap feature',
  description:
    'The bass is the lead: thumb and popped finger alternating, a kit written to interlock rather than double, and everything else out of the way.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [100, 122],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  transitions: [['fill', 4], ['break', 4], ['shot', 2]],
  shots: [[[0, 6], 4], [[0, 3, 6], 3], [[0, 10], 2]],
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'iv9', 'iv9', 'i9', 'i9'], weight: 4 },
      { chords: ['i7', 'i7', 'VII', 'VII', 'i7', 'i7', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv7', 'iv7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 5 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 4 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'iv7', 'iv7', 'i7', 'i7', 'i7', 'i7'], weight: 4 }],
    solo: [{ chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6 }],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9'], weight: 6 },
      { chords: ['I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'I7', 'I7'], weight: 4 },
    ],
    chorus: [{ chords: ['IV9', 'IV9', 'I9', 'I9', 'IV9', 'IV9', 'I9', 'I9'], weight: 5 }],
    outro: [{ chords: ['I9', 'I9', 'I9', 'I9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [3, 3, 2, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [16], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [-8, 8], weight: 3 },
  ],
  bass: [
    /**
     * Eight onsets, and the technique is audible in the velocities: the thumb
     * lands hard on 0 and 8 and the popped notes sit at two-thirds of that
     * between them. This is the figure the drummer is written around rather
     * than the other way round.
     */
    { name: 'thumb-and-pop', weight: 6, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 2, dur: 1, tone: 12, vel: 0.62 },
      { at: 3, dur: 1, tone: 10, vel: 0.56 },
      { at: 6, dur: 2, tone: 0, vel: 0.72 },
      { at: 8, dur: 2, tone: 0, vel: 0.86 },
      { at: 10, dur: 1, tone: 12, vel: 0.6 },
      { at: 11, dur: 1, tone: 10, vel: 0.54 },
      { at: 14, dur: 2, tone: 7, vel: 0.68 },
    ] },
    { name: 'hammer', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 3, dur: 1, tone: 3, vel: 0.58 },
      { at: 5, dur: 1, tone: 12, vel: 0.62 },
      { at: 8, dur: 2, tone: 0, vel: 0.78 },
      { at: 11, dur: 1, tone: 5, vel: 0.6 },
      { at: 14, dur: 2, tone: 7, vel: 0.66 },
      { at: 16, dur: 2, tone: 0, vel: 0.9 },
      { at: 19, dur: 1, tone: 12, vel: 0.6 },
      { at: 22, dur: 2, tone: 10, vel: 0.66 },
      { at: 26, dur: 2, tone: 7, vel: 0.64 },
      { at: 29, dur: 1, tone: 3, vel: 0.58 },
    ] },
    { name: 'thumbed-riff', weight: 4, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 1, tone: 12, vel: 0.6 },
      { at: 7, dur: 2, tone: 0, vel: 0.7 },
      { at: 10, dur: 1, tone: 12, vel: 0.58 },
      { at: 12, dur: 4, tone: 10, vel: 0.72 },
    ] },
  ],
  comp: [
    // Thin and high, and two voices rather than three. In a number where the
    // bass is the lead the guitar's whole job is to stay off the bottom of it.
    { name: 'high-chank', weight: 6, voices: 2, voicing: 'guide', hits: [
      { at: 2, dur: 1, vel: 0.6 }, { at: 3, dur: 1, vel: 0.12 },
      { at: 6, dur: 1, vel: 0.62 }, { at: 7, dur: 1, vel: 0.12 },
      { at: 10, dur: 1, vel: 0.6 }, { at: 11, dur: 1, vel: 0.12 },
      { at: 14, dur: 1, vel: 0.64 }, { at: 15, dur: 1, vel: 0.12 },
    ] },
    { name: 'two-stabs', weight: 4, voices: 3, voicing: 'guide', hits: [
      { at: 4, dur: 2, vel: 0.6 },
      { at: 12, dur: 2, vel: 0.62 },
    ] },
    { name: 'clav-answer', weight: 3, voices: 3, cycle: 12, hits: [
      { at: 4, dur: 1, vel: 0.56 },
      { at: 7, dur: 2, vel: 0.6 },
    ] },
  ],
  drums: [
    // Spare, and interlocking. The kick avoids slots 2, 3, 10 and 11 because
    // the bass is already there.
    { name: 'interlock', weight: 6, voices: {
      bd: [0, 8],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'open-hat', weight: 4, voices: {
      bd: [0, 6, 8],
      sd: [4, 12],
      hh: [0, 2, 4, 8, 10, 12],
      oh: [6, 14],
    } },
    { name: 'sixteenth-hat', weight: 4, voices: {
      bd: [0, 8, 13],
      sd: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      tb: [4, 12],
    } },
  ],
  melody: { leap: 0.24, ornament: 0.26, span: 11, sequence: 0.66, syncopation: 0.74 },
};

/**
 * BOOGIE — 1980, and the drummer is a LinnDrum.
 *
 * Post-disco: the four-on-the-floor kick stays, the strings go, a slap bass and
 * a synth take everything the horn section used to do, and the whole thing is
 * played to a machine. The Linn family is the actual sound — an LM-1 or an
 * LM-2 in front of a band that is still a band — and the era table weights those
 * banks accordingly.
 *
 * What a drum machine changes in these tables is *regularity*. A human kit
 * pattern here would carry a ghost note and an open hat placed by feel; a
 * programmed one carries neither, because somebody entered it a step at a time
 * and entered the same thing sixteen times. So the drum patterns below are the
 * flattest in this file — every hat slot filled, every clap exactly on 2 and 4 —
 * and the *bass* takes over the job of moving the bar around, which is why the
 * slap figures here have more onsets than the JB-era ones do.
 *
 * The synth stab is the other half. Where 1968 had four horns playing a written
 * line, 1980 has one keyboard playing a two-note chord on the offbeat, and
 * `stab` below is that: two voices, four onsets, and the shortest durations in
 * the comp tables.
 */
const boogie: Style = {
  id: 'boogie',
  label: 'Boogie',
  description:
    '1980 post-disco: a LinnDrum, a slap bass carrying the syncopation the machine cannot, and a synth stab where the horns used to be.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [106, 122],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
    verse: [
      { chords: ['i9', 'i9', 'i9', 'i9', 'iv9', 'iv9', 'i9', 'i9'], weight: 5 },
      { chords: ['i7', 'i7', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 4 },
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'VII7', 'VII7', 'III', 'III'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['iv9', 'iv9', 'VII7', 'VII7', 'III', 'III', 'i9', 'i9'], weight: 4 },
      { chords: ['iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9', 'i9', 'i9'], weight: 3 },
    ],
    bridge: [{ chords: ['III', 'III', 'VI', 'VI', 'iv9', 'iv9', 'VII7', 'VII7'], weight: 4 }],
    solo: [{ chords: ['i9', 'i9', 'i9', 'i9', 'iv9', 'iv9', 'i9', 'i9'], weight: 5 }],
    outro: [{ chords: ['VII7', 'VII7', 'i9', 'i9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7'], weight: 5 },
      { chords: ['I9', 'I9', 'ii7', 'ii7', 'IVmaj7', 'IVmaj7', 'V7', 'V7'], weight: 4 },
      { chords: ['I9', 'I9', 'I9', 'I9', 'bVII9', 'bVII9', 'bVII9', 'bVII9'], weight: 3 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'IVmaj7', 'V7', 'V7', 'Imaj7', 'Imaj7', 'vi7', 'vi7'], weight: 5 },
      { chords: ['bVImaj7', 'bVImaj7', 'bVII9', 'bVII9', 'I9', 'I9', 'I9', 'I9'], weight: 1 },
    ],
    outro: [{ chords: ['IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7'], weight: 5 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [4, 2, 2, 4, 4], weight: 5 },
    { cell: [3, 3, 2, 4, 4], weight: 4 },
    { cell: [-2, 2, 2, 4, 2, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'slap-boogie', weight: 6, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 3, dur: 1, tone: 12, vel: 0.6 },
      { at: 6, dur: 2, tone: 0, vel: 0.72 },
      { at: 8, dur: 2, tone: 10, vel: 0.7 },
      { at: 11, dur: 1, tone: 12, vel: 0.58 },
      { at: 13, dur: 3, tone: 7, vel: 0.68 },
    ] },
    { name: 'synth-riff', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 0, vel: 0.6 },
      { at: 7, dur: 2, tone: 7, vel: 0.68 },
      { at: 10, dur: 2, tone: 10, vel: 0.7 },
      { at: 14, dur: 2, tone: 12, vel: 0.62 },
      { at: 16, dur: 3, tone: 0, vel: 0.86 },
      { at: 20, dur: 2, tone: 0, vel: 0.58 },
      { at: 23, dur: 2, tone: 5, vel: 0.66 },
      { at: 26, dur: 2, tone: 3, vel: 0.64 },
      { at: 30, dur: 2, tone: 0, vel: 0.68 },
    ] },
    { name: 'eighths', weight: 3, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 2, dur: 2, tone: 0, vel: 0.6 },
      { at: 6, dur: 2, tone: 7, vel: 0.7 },
      { at: 8, dur: 2, tone: 12, vel: 0.64 },
      { at: 12, dur: 2, tone: 10, vel: 0.68 },
      { at: 14, dur: 2, tone: 7, vel: 0.62 },
    ] },
  ],
  comp: [
    // Two voices, four onsets, one slot each. Where 1968 had four horns playing
    // a written line, 1980 has one keyboard on the offbeat.
    { name: 'stab', weight: 6, voices: 2, voicing: 'guide', hits: [
      { at: 2, dur: 1, vel: 0.72 },
      { at: 6, dur: 1, vel: 0.7 },
      { at: 10, dur: 1, vel: 0.72 },
      { at: 14, dur: 1, vel: 0.74 },
    ] },
    { name: 'chank', weight: 5, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.18 }, { at: 2, dur: 1, vel: 0.7 },
      { at: 3, dur: 1, vel: 0.12 }, { at: 6, dur: 1, vel: 0.72 },
      { at: 8, dur: 1, vel: 0.16 }, { at: 10, dur: 1, vel: 0.68 },
      { at: 11, dur: 1, vel: 0.12 }, { at: 14, dur: 1, vel: 0.74 },
    ] },
    { name: 'pad-stabs', weight: 3, voices: 4, hits: [
      { at: 0, dur: 3, vel: 0.6 },
      { at: 6, dur: 2, vel: 0.56 },
      { at: 12, dur: 4, vel: 0.58 },
    ] },
  ],
  drums: [
    // The flattest patterns in the file, on purpose. Somebody entered this a
    // step at a time and entered the same thing sixteen times.
    { name: 'linn', weight: 6, voices: {
      bd: [0, 4, 8, 12],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      cp: [4, 12],
    } },
    { name: 'linn-sixteenth', weight: 5, voices: {
      bd: [0, 6, 8, 12],
      sd: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      tb: [2, 6, 10, 14],
    } },
    { name: 'linn-open', weight: 4, voices: {
      bd: [0, 4, 8, 12],
      cp: [4, 12],
      hh: [0, 2, 4, 8, 10, 12],
      oh: [6, 14],
      cb: [0, 8],
    } },
  ],
  melody: { leap: 0.34, ornament: 0.28, span: 16, sequence: 0.64, syncopation: 0.66 },
};

/**
 * MINNEAPOLIS — the band is one person and the bass has gone.
 *
 * Prince's records after 1981 and everything Minneapolis made in their wake. Two
 * things separate it from `boogie`, both structural. The first is that the
 * rhythm section is *programmed by the same person who plays the guitar over
 * it*, so the parts lock in a way a band cannot — the synth stab lands on the
 * same sixteenth as the snare, every time, because it was quantised there.
 *
 * The second is the famous one: **sometimes there is no bass at all.** That
 * turns out to be two claims rather than one, and this table now makes both,
 * which is why neither mechanism replaced the other:
 *
 *  - **the bass stops and comes back.** `drops` below, and it is the one this
 *    style could not make at all — `docs/engine-gaps.md` §1.2 names
 *    `minneapolis` as one of the two styles that reported the gap, so the header
 *    you are reading was one of the two pieces of evidence the mechanism was
 *    argued from.
 *  - **and when it is there, there is hardly any of it.** The bass tables, one
 *    or two onsets, low in the bar and out of the way of a synth part doing the
 *    work an octave up.
 *
 * This header used to call the second one "the audible half of the effect", by
 * which it meant *all of the effect that was reachable*. It stays exactly as it
 * was, because it was never a fake of the first: a thin bass part and a bass
 * part that stops are two different sounds, both of them on these records, and
 * the tables are what the two songs in three that draw `none` are made of.
 *
 * The kit is a LinnDrum with its snare turned into an event: `cp` doubling the
 * backbeat, `rim` where a ghost would be, and no ride anywhere. The genre's own
 * `drumMix` puts the clap at 0.75 for this and the electro style next door.
 */
const minneapolis: Style = {
  id: 'minneapolis',
  label: 'Minneapolis',
  description:
    'One person playing everything to a Linn: stabs quantised onto the snare, a clap on the backbeat, and a bass part that has almost gone.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [108, 126],
  swing: 0,
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  /**
   * The bass stops and the Linn carries on, which is the record this style is
   * named after and the thing the tables below could only imitate.
   *
   * The gesture is a fader, not an arrangement: the same programmed part, still
   * running, with two bars of it muted and then back. `dub` is the shape for it
   * — the bass leaves and the kit keeps time — and the kit is what it is heard
   * against, which here is stronger than in the idiom the shape is named after.
   * A LinnDrum does not stop, get quieter or play a fill; the whole point of the
   * machine is that it is still exactly where it was, so what a listener hears
   * across these two bars is unambiguously *one channel gone* rather than the
   * band thinning out.
   *
   * ## `dropBars: 2`, and it is the field that makes this real rather than
   * decorative
   *
   * Every section this style builds is **eight bars** — verse, chorus, bridge
   * and solo alike, measured over 60 songs, with only the odd sixteen-bar chorus
   * when the form doubles. A drop needs three phrases inside one section, so the
   * shipped four-bar shape wants twelve, and at four bars this style places
   * **0 in 200**. That is the failure this project keeps finding: a table that
   * reads as working and does nothing. At two it places **200 of 200** —
   * 139 in a chorus, 27 in a verse, 21 in a doubled chorus, 13 in an outro —
   * which is two bars of band, two with the bass gone, two back, and the last
   * two left to whatever the seam wants to do.
   *
   * `Style.dropBars`' own doc names this style as the case it was written for.
   * Two bars is not a compromise on four: a phrase here *is* two bars, because
   * the section is eight and the harmony below moves in fours.
   *
   * ## Two to one
   *
   * The same arithmetic reggae's `dub` takes and for the same reason — a mute
   * that arrives every chorus is a texture rather than a gesture — but the
   * restraint costs less here than it looks, because this style is the one that
   * is *already* short of bass. One song in three has the fader move; the other
   * two have `barely-there` at the head of the table.
   *
   * **Measured.** Under the weights, over 400 songs: **124**. The bass loses a
   * median of **4 onsets** across the span and **never zero** — the thinnest
   * draw loses a single note, which is `barely-there`'s one onset a bar, and
   * that is still the root of the bar going missing rather than a part getting
   * sparser. **0 empty sections**, and **0 songs** differed anywhere outside the
   * span. The 276 that drew `none` are byte-identical to the tree before this
   * field existed, all 276 of them.
   */
  drops: [['none', 2], ['dub', 1]],
  dropBars: 2,
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 5 },
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9'], weight: 4 },
      { chords: ['i7', 'i7', 'VII', 'VII', 'i7', 'i7', 'VII', 'VII'], weight: 4 },
      { chords: ['i7sus4', 'i7sus4', 'i7', 'i7', 'i7sus4', 'i7sus4', 'i7', 'i7'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 5 },
      { chords: ['iv9', 'iv9', 'VII', 'VII', 'i9', 'i9', 'i9', 'i9'], weight: 4 },
      { chords: ['III', 'III', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 3 },
    ],
    bridge: [{ chords: ['iv9', 'iv9', 'iv9', 'iv9', 'VII', 'VII', 'VII', 'VII'], weight: 4 }],
    solo: [{ chords: ['i7', 'i7', 'i7', 'i7', 'VII', 'VII', 'i7', 'i7'], weight: 5 }],
    outro: [{ chords: ['VII', 'VII', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I9', 'I9', 'I9', 'I9', 'IV9', 'IV9', 'I9', 'I9'], weight: 5 },
      { chords: ['Isus2', 'Isus2', 'IVmaj7', 'IVmaj7', 'Isus2', 'Isus2', 'IVmaj7', 'IVmaj7'], weight: 4 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'IVmaj7', 'V7', 'V7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'], weight: 5 },
      { chords: ['bVII9', 'bVII9', 'IV9', 'IV9', 'I9', 'I9', 'I9', 'I9'], weight: 3 },
    ],
    outro: [{ chords: ['IV9', 'IV9', 'I9', 'I9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [3, 3, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    // One onset. This used to be as close as the tables could get to a record
    // with no bass guitar on it at all; `drops` above is the rest of the way,
    // and this is still the right head of the table for the songs that do not
    // draw one. A bass that plays a single note a bar and a bass that stops are
    // different sounds and this style makes both.
    { name: 'barely-there', weight: 6, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
    ] },
    { name: 'two-onsets', weight: 5, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 10, dur: 2, tone: 0, vel: 0.66 },
    ] },
    { name: 'synth-line', weight: 4, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 3, dur: 1, tone: 0, vel: 0.56 },
      { at: 6, dur: 2, tone: 7, vel: 0.68 },
      { at: 11, dur: 2, tone: 5, vel: 0.66 },
      { at: 14, dur: 2, tone: 3, vel: 0.62 },
    ] },
  ],
  comp: [
    // Quantised onto the snare. Slot 4 and slot 12 are where the clap is, and
    // the stab is written to land on them rather than around them — which is
    // what happens when the guitarist is also the programmer.
    { name: 'locked-stab', weight: 6, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.7 },
      { at: 4, dur: 1, vel: 0.74 },
      { at: 7, dur: 1, vel: 0.6 },
      { at: 12, dur: 1, vel: 0.74 },
      { at: 14, dur: 1, vel: 0.62 },
    ] },
    { name: 'chank', weight: 5, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.18 }, { at: 2, dur: 1, vel: 0.72 },
      { at: 3, dur: 1, vel: 0.12 }, { at: 6, dur: 1, vel: 0.7 },
      { at: 8, dur: 1, vel: 0.16 }, { at: 10, dur: 1, vel: 0.7 },
      { at: 11, dur: 1, vel: 0.12 }, { at: 14, dur: 1, vel: 0.74 },
    ] },
    { name: 'sustained-synth', weight: 3, voices: 4, sustain: true, hits: [
      { at: 0, dur: 16, vel: 0.48 },
    ] },
  ],
  drums: [
    { name: 'linn-clap', weight: 6, voices: {
      bd: [0, 6, 10],
      cp: [4, 12],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'linn-rim', weight: 5, voices: {
      bd: [0, 3, 8, 11],
      cp: [4, 12],
      rim: [2, 6, 14],
      hh: [0, 4, 8, 12],
    } },
    { name: 'linn-sixteenth', weight: 4, voices: {
      bd: [0, 6, 10],
      cp: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      tb: [4, 12],
    } },
  ],
  melody: { leap: 0.3, ornament: 0.26, span: 15, sequence: 0.7, syncopation: 0.72 },
};

/**
 * ELECTRO-FUNK — an 808, and nothing anybody played.
 *
 * 1982–1985: the TR-808, a monophonic synth bass programmed rather than fingered,
 * a vocoder, and no band on the record at all. The bass line is the same
 * *material* as the JB one — a numeric shape rooted on the chord, holes in the
 * bar — but it is entered on a grid instead of played, and the tables say so by
 * putting every onset on an exact sixteenth with no anticipation anywhere.
 *
 * The 808 is a specific object with a specific limitation and the drum tables
 * respect it: the bank carries no ride, so the cymbal on these patterns is the
 * open hat and the crash; the cowbell is a first-class voice rather than a
 * garnish; and the kick is a long sine that occupies its whole slot, which is
 * why the patterns below place it more sparsely than anywhere else here — two
 * 808 kicks a sixteenth apart is one muddy kick.
 *
 * Minor-dominant at 0.75, the highest in this file. Electro is cold, and the
 * mode is most of what makes it so — the same records in major read as
 * children's television.
 */
const electro: Style = {
  id: 'electro',
  label: 'Electro-funk',
  description:
    'An 808 and a programmed synth bass: the same shape as a JB riff, entered on a grid, with a cowbell where the guitar used to be.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [108, 128],
  swing: 0,
  modeWeights: { minor: 0.75, major: 0.25 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  /**
   * No brass. This is a record with nobody on it — the layer writes an arranged
   * stab into the tune's gaps, which is a section of players answering a singer,
   * and in this style the gaps are full of an 808 cowbell instead.
   */
  excludeLayers: ['brass'],
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6 },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'VII', 'VII'], weight: 4 },
      { chords: ['i7', 'i7', 'VI', 'VI', 'i7', 'i7', 'VII', 'VII'], weight: 4 },
      { chords: ['isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2', 'isus2'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 5 },
      { chords: ['iv7', 'iv7', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 4 },
      { chords: ['bII', 'bII', 'i7', 'i7', 'bII', 'bII', 'i7', 'i7'], weight: 3, note: 'A semitone above and back — the coldest chord available without leaving the mode' },
    ],
    bridge: [{ chords: ['VI', 'VI', 'VI', 'VI', 'VII', 'VII', 'VII', 'VII'], weight: 4 }],
    solo: [{ chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 5 }],
    outro: [{ chords: ['VII', 'VII', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9'], weight: 6 },
      { chords: ['I', 'I', 'bVII', 'bVII', 'I', 'I', 'bVII', 'bVII'], weight: 4 },
    ],
    chorus: [{ chords: ['bVI', 'bVI', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['bVII', 'bVII', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [3, 3, 2, 4, 4], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 3 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    // Entered, not played. Every onset on an exact sixteenth and nothing
    // anticipated: a step sequencer has no wrist to push with.
    { name: 'programmed', weight: 6, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 0, vel: 0.7 },
      { at: 6, dur: 2, tone: 3, vel: 0.7 },
      { at: 10, dur: 2, tone: 0, vel: 0.72 },
      { at: 12, dur: 2, tone: -2, vel: 0.7 },
    ] },
    { name: 'sequenced-two-bar', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 0, vel: 0.68 },
      { at: 8, dur: 2, tone: 7, vel: 0.7 },
      { at: 12, dur: 2, tone: 3, vel: 0.68 },
      { at: 16, dur: 2, tone: 0, vel: 0.86 },
      { at: 20, dur: 2, tone: 0, vel: 0.66 },
      { at: 24, dur: 2, tone: 10, vel: 0.7 },
      { at: 28, dur: 2, tone: 7, vel: 0.68 },
    ] },
    { name: 'sub', weight: 4, sustain: true, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 8, dur: 8, tone: 0, vel: 0.74 },
    ] },
  ],
  comp: [
    { name: 'sequenced-stab', weight: 6, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.72 },
      { at: 3, dur: 1, vel: 0.6 },
      { at: 6, dur: 1, vel: 0.7 },
      { at: 8, dur: 1, vel: 0.62 },
      { at: 11, dur: 1, vel: 0.68 },
      { at: 14, dur: 1, vel: 0.7 },
    ] },
    { name: 'arpeggiated', weight: 5, voices: 3, arpeggio: true, arpDirection: 'updown', arpOctaves: 2, cycle: 12, hits: [
      { at: 0, dur: 1, vel: 0.64 }, { at: 2, dur: 1, vel: 0.56 },
      { at: 4, dur: 1, vel: 0.62 }, { at: 6, dur: 1, vel: 0.56 },
      { at: 8, dur: 1, vel: 0.62 }, { at: 10, dur: 1, vel: 0.56 },
    ] },
    { name: 'held-synth', weight: 3, voices: 4, sustain: true, hits: [
      { at: 0, dur: 16, vel: 0.5 },
    ] },
  ],
  drums: [
    // The 808's kick is a long sine and occupies its whole slot, so it is placed
    // more sparsely here than anywhere else in the file: two of them a sixteenth
    // apart is one muddy kick.
    { name: '808', weight: 6, voices: {
      bd: [0, 10],
      sd: [4, 12],
      cp: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      cb: [0, 8],
    } },
    { name: '808-sixteenth', weight: 5, voices: {
      bd: [0, 6, 10],
      cp: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      cb: [3, 11],
    } },
    { name: '808-open', weight: 4, voices: {
      bd: [0, 10],
      sd: [4, 12],
      hh: [0, 2, 4, 8, 10, 12],
      oh: [6, 14],
      lt: [7, 15],
    } },
  ],
  melody: { leap: 0.26, ornament: 0.2, span: 13, sequence: 0.75, syncopation: 0.6 },
};

/**
 * TALKBOX — the voice through a tube, and the synth that answers it.
 *
 * Zapp, Roger Troutman, the Ohio Players' later records: a synthesiser played
 * through a plastic hose held in the mouth, so the *player's* mouth is the
 * filter. The engine has no talkbox and cannot have one, so what this style does
 * instead is put the character where the character can go — the vocal profile is
 * the genre's own, the melody's `ornament` is the highest in the file at 0.55
 * because a talkbox line is all bends and articulations, and the `span` is
 * narrow because a hose is not a keyboard.
 *
 * Musically it is `boogie` in major with a slower kick pattern and a much
 * heavier synth-bass presence. Major-primary and unusually so at 0.62, because
 * this end of the repertoire is warm: these are party records with an ostentatious
 * gimmick on them, and a minor talkbox record sounds like a warning.
 *
 * The bass and the comp are written on the same instrument here, which is why
 * the comp tables are the lowest-voiced in the file at two voices: a synth
 * playing chords under a synth playing a bass line has to leave it room.
 */
const talkbox: Style = {
  id: 'talkbox',
  label: 'Talkbox funk',
  description:
    'A synth through a hose in the player’s mouth: bends instead of notes, a heavy synth bass under it, and a party going on in major.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [100, 118],
  swing: 0,
  modeWeights: { minor: 0.38, major: 0.62 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['I9', 'I9', 'I9', 'I9'], weight: 5 }],
    verse: [
      { chords: ['I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9'], weight: 5 },
      { chords: ['I9', 'I9', 'IV9', 'IV9', 'I9', 'I9', 'IV9', 'IV9'], weight: 5 },
      { chords: ['Imaj7', 'Imaj7', 'vi7', 'vi7', 'IVmaj7', 'IVmaj7', 'V7', 'V7'], weight: 3 },
      { chords: ['I7sus4', 'I7sus4', 'I7', 'I7', 'I7sus4', 'I7sus4', 'I7', 'I7'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV9', 'IV9', 'IV9', 'IV9', 'I9', 'I9', 'I9', 'I9'], weight: 5 },
      { chords: ['IVmaj7', 'IVmaj7', 'V7', 'V7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['bVII9', 'bVII9', 'IV9', 'IV9', 'I9', 'I9', 'I9', 'I9'], weight: 3 },
    ],
    bridge: [{ chords: ['vi7', 'vi7', 'ii7', 'ii7', 'IVmaj7', 'IVmaj7', 'V7', 'V7'], weight: 4 }],
    solo: [{ chords: ['I9', 'I9', 'I9', 'I9', 'IV9', 'IV9', 'I9', 'I9'], weight: 5 }],
    outro: [{ chords: ['IV9', 'IV9', 'I9', 'I9'], weight: 5 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i9', 'i9', 'i9', 'i9', 'iv9', 'iv9', 'i9', 'i9'], weight: 5 },
      { chords: ['i7', 'i7', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [{ chords: ['VI', 'VI', 'VII', 'VII', 'i9', 'i9', 'i9', 'i9'], weight: 5 }],
    outro: [{ chords: ['iv9', 'iv9', 'i9', 'i9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [4, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 2, 2, 4], weight: 4 },
    { cell: [-2, 2, 2, 4, 2, 4], weight: 4 },
    { cell: [3, 3, 2, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'synth-bass', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 0, vel: 0.62 },
      { at: 6, dur: 2, tone: 7, vel: 0.72 },
      { at: 10, dur: 2, tone: 10, vel: 0.7 },
      { at: 12, dur: 4, tone: 7, vel: 0.66 },
    ] },
    { name: 'bounce', weight: 5, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 3, dur: 1, tone: 12, vel: 0.6 },
      { at: 6, dur: 2, tone: 0, vel: 0.7 },
      { at: 8, dur: 2, tone: 7, vel: 0.68 },
      { at: 11, dur: 1, tone: 12, vel: 0.58 },
      { at: 14, dur: 2, tone: 5, vel: 0.64 },
    ] },
    { name: 'held-sub', weight: 3, sustain: true, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 10, dur: 6, tone: 7, vel: 0.7 },
    ] },
  ],
  comp: [
    // Two voices, and low ones. A synthesiser playing chords underneath a
    // synthesiser playing a bass line has to leave it somewhere to be.
    { name: 'synth-chank', weight: 6, voices: 2, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.18 }, { at: 2, dur: 1, vel: 0.7 },
      { at: 3, dur: 1, vel: 0.12 }, { at: 6, dur: 1, vel: 0.72 },
      { at: 8, dur: 1, vel: 0.16 }, { at: 10, dur: 1, vel: 0.68 },
      { at: 11, dur: 1, vel: 0.12 }, { at: 14, dur: 1, vel: 0.72 },
    ] },
    { name: 'stab', weight: 5, voices: 2, voicing: 'guide', hits: [
      { at: 2, dur: 2, vel: 0.7 },
      { at: 6, dur: 1, vel: 0.66 },
      { at: 11, dur: 2, vel: 0.7 },
    ] },
    { name: 'held-pad', weight: 3, voices: 4, sustain: true, hits: [
      { at: 0, dur: 16, vel: 0.46 },
    ] },
  ],
  drums: [
    { name: 'boogie-kit', weight: 6, voices: {
      bd: [0, 6, 10],
      sd: [4, 12],
      cp: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'party', weight: 5, voices: {
      bd: [0, 4, 8, 12],
      cp: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      tb: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'sixteenth', weight: 3, voices: {
      bd: [0, 3, 8, 11],
      sd: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      cb: [0, 8],
    } },
  ],
  melody: { leap: 0.28, ornament: 0.55, span: 12, sequence: 0.66, syncopation: 0.7 },
};


export const STYLES: Record<string, Style> = {
  vamp,
  jbshuffle,
  deepfunk,
  horns,
  memphis,
  swamp,
  souljazz,
  gogo,
  latin,
  afrofunk,
  funkrock,
  breakbeat,
  ballad,
  pfunk,
  clav,
  jazzfunk,
  disco,
  slap,
  boogie,
  minneapolis,
  electro,
  talkbox,
};
