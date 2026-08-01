/**
 * The jazz catalogue.
 *
 * Organised by feel rather than by dance, because that is how the music is
 * actually grouped: a rhythm section asks "medium swing or bossa?", not "which
 * dance?". Each entry fixes a tempo band, a swing amount, a comping figure and
 * a harmonic vocabulary.
 *
 * Three things separate this from the iskelmä tables and matter more than any
 * individual progression:
 *
 *  - **Swing is a number, not a style.** 0.33 is the triplet feel of straight-
 *    ahead jazz; bossa nova is 0 and is *not* swung, which is the single most
 *    common way to get it wrong.
 *  - **Harmony is seventh chords by default.** Plain triads barely appear;
 *    `Imaj7 vi7 ii7 V7` is the resting state, not an embellishment.
 *  - **Form is head–solos–head** over a fixed chorus, not verse/chorus. The
 *    12-bar blues and the 32-bar AABA are the two that matter.
 */

import { isAlteredDominant } from '../../core/chord.js';
import { pc } from '../../core/pitch.js';
import { makeScale } from '../../core/scale.js';
import type { Style } from '../../style/types.js';

/**
 * MEDIUM SWING — the standards repertoire.
 *
 * Walking bass in quarters, ride cymbal on 1, 2-and, 3, 4-and, hi-hat clamping
 * on 2 and 4, piano comping in syncopated stabs that deliberately avoid the
 * downbeat. Harmony is ii–V–I and its endless variations.
 */
const swing: Style = {
  id: 'swing',
  label: 'Medium swing',
  description:
    'Straight-ahead swing at a comfortable tempo. Walking bass, ride cymbal, syncopated piano comping, ii–V–I harmony.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [120, 184],
  swing: 0.33,
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [
      { chords: ['ii7', 'V7', 'Imaj7', 'V7'], weight: 4 },
      { chords: ['Imaj7', 'VI7', 'ii7', 'V7'], weight: 3 },
    ],
    verse: [
      { chords: ['Imaj7', 'vi7', 'ii7', 'V7', 'Imaj7', 'vi7', 'ii7', 'V7'], weight: 5, note: 'The "rhythm changes" A section — the most reused eight bars in jazz' },
      { chords: ['Imaj7', 'VI7', 'ii7', 'V7', 'iii7', 'VI7', 'ii7', 'V7'], weight: 4, note: 'Same shape with secondary dominants sharpening every other chord' },
      { chords: ['ii7', 'V7', 'Imaj7', 'Imaj7', 'ii7', 'V7', 'Imaj7', 'V7'], weight: 4 },
      { chords: ['Imaj7', 'IVmaj7', 'iii7', 'VI7', 'ii7', 'V7', 'Imaj7', 'V7'], weight: 3 },
      { chords: ['Imaj7', 'I7', 'IVmaj7', '#ivo7', 'Imaj7', 'ii7', 'V7', 'Imaj7'], weight: 3, note: 'Diminished passing chord between IV and I' },
    ],
    chorus: [
      { chords: ['Imaj7', 'vi7', 'ii7', 'V7', 'Imaj7', 'vi7', 'ii7', 'V7'], weight: 4 },
      { chords: ['IVmaj7', 'iv7', 'Imaj7', 'VI7', 'ii7', 'V7', 'Imaj7', 'V7'], weight: 4, note: 'Borrowed minor iv — the standard way to darken bar two' },
      { chords: ['ii7', 'V7', 'iii7', 'VI7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 3 },
    ],
    bridge: [
      { chords: ['III7', 'III7', 'VI7', 'VI7', 'II7', 'II7', 'V7', 'V7'], weight: 5, note: 'The rhythm-changes bridge: four dominants round the circle of fifths' },
      { chords: ['IVmaj7', 'IVmaj7', 'iv7', 'iv7', 'iii7', 'VI7', 'ii7', 'V7'], weight: 3 },
    ],
    solo: [
      { chords: ['Imaj7', 'vi7', 'ii7', 'V7', 'Imaj7', 'vi7', 'ii7', 'V7'], weight: 4 },
      { chords: ['Imaj7', 'VI7', 'ii7', 'V7', 'iii7', 'VI7', 'ii7', 'V7'], weight: 3 },
    ],
    outro: [
      { chords: ['ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['IVmaj7', 'iv7', 'Imaj7', 'Imaj7'], weight: 2 },
    ],
  },
  minorProgressions: {
    intro: [{ chords: ['ii%7', 'V7b9', 'i7', 'i7'], weight: 4 }],
    verse: [
      { chords: ['i7', 'i7', 'ii%7', 'V7b9', 'i7', 'i7', 'ii%7', 'V7b9'], weight: 5, note: 'The minor ii–V: half-diminished ii, flat-ninth V' },
      { chords: ['i7', 'iv7', 'i7', 'V7b9', 'i7', 'iv7', 'V7b9', 'i7'], weight: 4 },
      { chords: ['i7', 'VI7', 'ii%7', 'V7b9', 'i7', 'VI7', 'ii%7', 'V7b9'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv7', 'iv7', 'i7', 'i7', 'ii%7', 'V7b9', 'i7', 'i7'], weight: 4 },
      { chords: ['VImaj7', 'VII7', 'i7', 'i7', 'ii%7', 'V7b9', 'i7', 'i7'], weight: 3 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'VII7', 'VII7', 'IIImaj7', 'IIImaj7', 'ii%7', 'V7b9'], weight: 4 }],
    solo: [{ chords: ['i7', 'i7', 'ii%7', 'V7b9', 'i7', 'i7', 'ii%7', 'V7b9'], weight: 4 }],
    outro: [{ chords: ['ii%7', 'V7b9', 'i7', 'i7'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 2, 2, 2, 2], weight: 4 },
    { cell: [-2, 2, 2, 2, 2, 2, 4], weight: 4 },
    { cell: [4, 2, 2, 2, 2, 4], weight: 4 },
    { cell: [2, 2, 4, 2, 2, 4], weight: 3 },
    { cell: [-4, 2, 2, 2, 2, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [4, 4, 2, 2, 4], weight: 3 },
    { cell: [-2, 2, 4, 4, 4], weight: 3 },
    { cell: [8, 2, 2, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'walking', weight: 8, walking: true, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.95 },
      { at: 4, dur: 3, tone: 'third', vel: 0.82 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.86 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.82 },
    ] },
    { name: 'two-feel', weight: 2, hits: [
      { at: 0, dur: 6, tone: 'root', vel: 0.95 },
      { at: 8, dur: 6, tone: 'fifth', vel: 0.85 },
    ] },
  ],
  comp: [
    { name: 'charleston', weight: 5, voices: 4, voicing: 'guide', hits: [
      { at: 0, dur: 3, vel: 0.6 },
      { at: 6, dur: 4, vel: 0.55 },
    ] },
    { name: 'offbeat-stabs', weight: 4, voices: 4, voicing: 'guide', hits: [
      { at: 6, dur: 3, vel: 0.55 },
      { at: 14, dur: 3, vel: 0.6 },
    ] },
    { name: 'and-of-four', weight: 3, voices: 4, voicing: 'guide', hits: [
      { at: 4, dur: 2, vel: 0.5 },
      { at: 14, dur: 4, vel: 0.6 },
    ] },
    { name: 'sparse', weight: 2, voices: 4, voicing: 'guide', hits: [{ at: 0, dur: 10, vel: 0.45 }] },
  ],
  drums: [
    // The ride pattern is the pulse of the music; swing displaces slots 6 and
    // 14 into the triplet.
    { name: 'ride-swing', weight: 6, voices: {
      rd: [0, 6, 8, 14],
      hh: [4, 12],
      bd: [0],
    } },
    { name: 'ride-busy', weight: 4, voices: {
      rd: [0, 4, 6, 8, 12, 14],
      hh: [4, 12],
      bd: [0],
      rim: [10],
    } },
    { name: 'brushes', weight: 3, voices: {
      sh: [0, 4, 8, 12],
      rd: [0, 6, 8, 14],
      hh: [4, 12],
    } },
  ],
  melody: { leap: 0.32, ornament: 0.3, span: 18, sequence: 0.3, syncopation: 0.5 },
};

/**
 * BEBOP — fast, dense, chromatic.
 *
 * Continuous eighth-note lines over ii–V chains at tempos where a singer would
 * simply give up. Tritone substitution (♭II7 standing in for V7) is standard
 * rather than exotic.
 *
 * Constraints are turned off deliberately. Chromatic approach notes, enclosures
 * and unprepared dissonances are the *content* of a bebop line, not defects in
 * it — policing them would produce something politely wrong.
 */
const bebop: Style = {
  id: 'bebop',
  label: 'Bebop',
  description:
    'Fast, chromatic eighth-note lines over dense ii–V chains, with tritone substitutions. Constraint checking is off by design.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [196, 280],
  swing: 0.33,
  strictness: 'free',
  // Repetition is off for the same reason the constraints are. A bebop line is
  // an argument that never repeats itself; recalling a phrase would be the one
  // thing the idiom actively refuses to do.
  hook: 'through',
  /**
   * The one style in the catalogue where a rhythm section playing a hair in
   * front of the grid is not a fault. Bebop at 240 is a music about forward
   * motion, and `driving` is the only feel in the library that says forward:
   * short, in front, no ghosts and no subdivision, because at this tempo a
   * sixteenth is 62 milliseconds and anything added inside a beat is a smear.
   *
   * Two entries and no third. Bebop has no use for `pocket` — laying the
   * backbeat back at this tempo is not a groove, it is the drummer falling off
   * — so the choice this style is offered is between its own default and its own
   * excess, which is what a bebop rhythm section is actually choosing between.
   */
  feels: [['straight', 7], ['driving', 3]],
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['ii7', 'V7', 'Imaj7', 'V7'], weight: 4 }],
    verse: [
      { chords: ['Imaj7', 'VI7', 'ii7', 'V7', 'iii7', 'VI7', 'ii7', 'V7'], weight: 5 },
      { chords: ['Imaj7', 'bII7', 'ii7', 'bII7', 'Imaj7', 'VI7', 'ii7', 'V7'], weight: 4, note: 'bII7 is the tritone substitute for V7 — bebop’s favourite sidestep' },
      { chords: ['ii7', 'V7', 'iii7', 'VI7', 'ii7', 'V7', 'Imaj7', 'bII7'], weight: 4 },
      { chords: ['Imaj7', 'vi7', 'ii7', 'V7', 'Imaj7', 'IV7', 'iii7', 'VI7'], weight: 3 },
    ],
    chorus: [
      { chords: ['ii7', 'V7', 'Imaj7', 'VI7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['Imaj7', 'bIIImaj7', 'bVImaj7', 'bII7', 'Imaj7', 'ii7', 'V7', 'Imaj7'], weight: 3, note: 'Coltrane-adjacent thirds motion' },
    ],
    bridge: [
      { chords: ['III7', 'III7', 'VI7', 'VI7', 'II7', 'II7', 'V7', 'V7'], weight: 5 },
      { chords: ['iii7', 'VI7', 'ii7', 'V7', 'iii7', 'VI7', 'ii7', 'V7'], weight: 3 },
    ],
    solo: [
      { chords: ['Imaj7', 'VI7', 'ii7', 'V7', 'iii7', 'VI7', 'ii7', 'V7'], weight: 4 },
      { chords: ['ii7', 'V7', 'Imaj7', 'VI7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 3 },
    ],
    outro: [{ chords: ['ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 }],
  },
  minorProgressions: {
    intro: [{ chords: ['ii%7', 'V7b9', 'i7', 'i7'], weight: 4 }],
    verse: [
      { chords: ['i7', 'ii%7', 'V7b9', 'i7', 'i7', 'ii%7', 'V7b9', 'i7'], weight: 5, note: 'The minor ii–V, with the flat ninth that defines it' },
      { chords: ['i7', 'bII7', 'ii%7', 'V7b9', 'i7', 'ii%7', 'V7b9', 'i7'], weight: 4 },
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'ii%7', 'V7b9', 'i7', 'V7b9'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv7', 'VII7', 'IIImaj7', 'VImaj7', 'ii%7', 'V7b9', 'i7', 'i7'], weight: 4, note: 'Round the circle of fifths out of the relative major and back' },
      { chords: ['i7', 'VI7', 'ii%7', 'V7b9', 'i7', 'ii%7', 'V7b9', 'i7'], weight: 3 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'VII7', 'VII7', 'IIImaj7', 'IIImaj7', 'V7b9', 'V7b9'], weight: 4 }],
    solo: [{ chords: ['i7', 'ii%7', 'V7b9', 'i7', 'i7', 'ii%7', 'V7b9', 'i7'], weight: 4 }],
    outro: [{ chords: ['ii%7', 'V7b9', 'i7', 'i7'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 2, 2, 2, 2], weight: 8 },
    { cell: [-2, 2, 2, 2, 2, 2, 2, 2], weight: 5 },
    { cell: [2, 2, 2, 2, 2, 2, 4], weight: 4 },
    { cell: [4, 2, 2, 2, 2, 2, 2], weight: 4 },
    { cell: [-4, 2, 2, 2, 2, 2, 2], weight: 3 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 4 },
    { cell: [4, 2, 2, 8], weight: 3 },
    { cell: [16], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
  ],
  bass: [
    { name: 'walking', weight: 9, walking: true, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.95 },
      { at: 4, dur: 3, tone: 'third', vel: 0.82 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.86 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.82 },
    ] },
  ],
  comp: [
    { name: 'sparse-stabs', weight: 6, voices: 4, voicing: 'guide', hits: [
      { at: 6, dur: 2, vel: 0.5 },
      { at: 14, dur: 2, vel: 0.55 },
    ] },
    { name: 'charleston', weight: 4, voices: 4, voicing: 'guide', hits: [
      { at: 0, dur: 2, vel: 0.55 },
      { at: 6, dur: 3, vel: 0.5 },
    ] },
  ],
  drums: [
    { name: 'ride-bop', weight: 6, voices: {
      rd: [0, 6, 8, 14],
      hh: [4, 12],
      bd: [0],
      sd: [10],
    } },
    { name: 'ride-comping', weight: 4, voices: {
      rd: [0, 6, 8, 14],
      hh: [4, 12],
      sd: [6, 13],
    } },
  ],
  melody: { leap: 0.3, ornament: 0.4, span: 22, sequence: 0.25, syncopation: 0.55 },
};

/**
 * BALLAD — slow, lush, spacious.
 *
 * Rich extended harmony (maj9, min9, altered dominants) moving slowly, with a
 * melody that leaves as much silence as sound. Brushes rather than sticks.
 */
const ballad: Style = {
  id: 'ballad',
  label: 'Ballad',
  description:
    'Slow and lush. Extended harmony, brushed drums, a melody built as much from silence as from notes.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [56, 80],
  swing: 0.22,
  /**
   * The mirror of bebop's table, and the reason the pair is worth having: a
   * ballad's only excess is in the other direction. Behind the beat, held long,
   * the metre allowed to go soft — which is what a rhythm section does behind a
   * singer at 64 and which reads as sloppiness at any tempo where the listener
   * is counting.
   *
   * `laidback`'s accent array runs *against* `metricStrength`, and a ballad is
   * where that is safe: the notes are far enough apart that flattening the bar
   * loosens it rather than obscuring it.
   */
  feels: [['straight', 7], ['laidback', 3]],
  modeWeights: { minor: 0.42, major: 0.58 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['ii7', 'V7b9', 'Imaj9', 'Imaj9'], weight: 4 }],
    verse: [
      { chords: ['Imaj9', 'vi7', 'ii7', 'V7', 'iii7', 'VI7', 'ii7', 'V7'], weight: 5 },
      { chords: ['Imaj9', 'IVmaj7', 'iii7', 'VI7b9', 'ii7', 'V7', 'Imaj9', 'Imaj9'], weight: 4 },
      { chords: ['Imaj9', 'I7', 'IVmaj7', 'iv7', 'iii7', 'VI7', 'ii7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'iv7', 'Imaj9', 'VI7b9', 'ii7', 'V7', 'Imaj9', 'Imaj9'], weight: 4 },
      { chords: ['ii7', 'V7', 'Imaj9', 'IVmaj7', 'iii7', 'VI7', 'ii7', 'V7'], weight: 4 },
    ],
    bridge: [
      { chords: ['IVmaj7', 'IVmaj7', 'iv7', 'iv7', 'iii7', 'VI7b9', 'ii7', 'V7'], weight: 4 },
    ],
    solo: [
      { chords: ['Imaj9', 'vi7', 'ii7', 'V7', 'iii7', 'VI7', 'ii7', 'V7'], weight: 4 },
    ],
    outro: [{ chords: ['ii7', 'V7', 'Imaj9', 'Imaj9'], weight: 4 }],
  },
  minorProgressions: {
    intro: [{ chords: ['ii%7', 'V7b9', 'i9', 'i9'], weight: 4 }],
    verse: [
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'ii%7', 'V7b9', 'i9', 'i9'], weight: 5 },
      { chords: ['i9', 'VImaj7', 'ii%7', 'V7b9', 'i9', 'iv9', 'V7b9', 'i9'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv9', 'iv9', 'VII7', 'IIImaj7', 'ii%7', 'V7b9', 'i9', 'i9'], weight: 4 },
      { chords: ['VImaj7', 'VII7', 'i9', 'i9', 'ii%7', 'V7b9', 'i9', 'i9'], weight: 3 },
    ],
    bridge: [{ chords: ['iv9', 'iv9', 'VImaj7', 'VImaj7', 'ii%7', 'ii%7', 'V7b9', 'V7b9'], weight: 4 }],
    solo: [{ chords: ['i9', 'i9', 'iv9', 'iv9', 'ii%7', 'V7b9', 'i9', 'i9'], weight: 4 }],
    outro: [{ chords: ['ii%7', 'V7b9', 'i9', 'i9'], weight: 4 }],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [-8, 4, 4], weight: 3 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [4, 2, 2, 8], weight: 3 },
    { cell: [-4, 2, 2, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'half-notes', weight: 5, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.85 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.75 },
    ] },
    { name: 'walking-slow', weight: 4, walking: true, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.85 },
      { at: 4, dur: 3, tone: 'third', vel: 0.72 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.78 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.72 },
    ] },
    { name: 'whole-note', weight: 2, hits: [{ at: 0, dur: 15, tone: 'root', vel: 0.8 }] },
  ],
  comp: [
    { name: 'sustained', weight: 5, voices: 4, voicing: 'guide', hits: [{ at: 0, dur: 16, vel: 0.42 }] },
    { name: 'half-bar', weight: 4, voices: 4, voicing: 'guide', hits: [
      { at: 0, dur: 8, vel: 0.45 },
      { at: 8, dur: 8, vel: 0.4 },
    ] },
    { name: 'gentle-charleston', weight: 3, voices: 4, voicing: 'guide', hits: [
      { at: 0, dur: 4, vel: 0.45 },
      { at: 6, dur: 6, vel: 0.4 },
    ] },
  ],
  drums: [
    { name: 'brushes-ballad', weight: 6, voices: {
      sh: [0, 4, 8, 12],
      rd: [0, 8],
      hh: [4, 12],
    } },
    { name: 'brushes-sparse', weight: 4, voices: {
      sh: [0, 8],
      rim: [4, 12],
    } },
  ],
  melody: { leap: 0.24, ornament: 0.18, span: 16, sequence: 0.4, syncopation: 0.28 },
};

/**
 * BOSSA NOVA.
 *
 * Straight eighths — this is the point. Bossa is routinely and wrongly played
 * with a swing feel; `swing: 0` here is a deliberate assertion, not an
 * oversight. The bass plays a two-beat root–fifth figure with the fifth pushed
 * onto the and-of-two, and the comping syncopates against it.
 */
const bossa: Style = {
  id: 'bossa',
  label: 'Bossa nova',
  description:
    'Brazilian bossa. Straight eighths (never swung), two-beat root–fifth bass, syncopated guitar comping, maj7 and min7 harmony.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [122, 152],
  swing: 0,
  modeWeights: { minor: 0.28, major: 0.72 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['Imaj7', 'Imaj7', 'ii7', 'V7'], weight: 4 }],
    verse: [
      { chords: ['Imaj7', 'Imaj7', 'ii7', 'V7', 'Imaj7', 'Imaj7', 'ii7', 'V7'], weight: 5 },
      { chords: ['Imaj7', 'II7', 'ii7', 'V7', 'Imaj7', 'II7', 'ii7', 'V7'], weight: 4, note: 'The major II7 before ii7 — a bossa fingerprint' },
      { chords: ['Imaj7', 'vi7', 'ii7', 'V7', 'iii7', 'VI7', 'ii7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['ii7', 'V7', 'Imaj7', 'VI7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['iv7', 'bVII7', 'Imaj7', 'Imaj7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 3 },
    ],
    bridge: [
      { chords: ['IVmaj7', 'IVmaj7', 'bVII7', 'bVII7', 'Imaj7', 'Imaj7', 'ii7', 'V7'], weight: 4 },
    ],
    solo: [
      { chords: ['Imaj7', 'Imaj7', 'ii7', 'V7', 'Imaj7', 'Imaj7', 'ii7', 'V7'], weight: 4 },
    ],
    outro: [{ chords: ['ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 }],
  },
  minorProgressions: {
    intro: [{ chords: ['i7', 'i7', 'ii%7', 'V7b9'], weight: 4 }],
    verse: [
      { chords: ['i7', 'i7', 'ii%7', 'V7b9', 'i7', 'i7', 'ii%7', 'V7b9'], weight: 5 },
      { chords: ['i7', 'VII7', 'VImaj7', 'V7b9', 'i7', 'VII7', 'VImaj7', 'V7b9'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv7', 'iv7', 'i7', 'i7', 'ii%7', 'V7b9', 'i7', 'i7'], weight: 4 },
      { chords: ['VImaj7', 'VII7', 'IIImaj7', 'IIImaj7', 'ii%7', 'V7b9', 'i7', 'i7'], weight: 3 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'VII7', 'VII7', 'i7', 'i7', 'ii%7', 'V7b9'], weight: 4 }],
    solo: [{ chords: ['i7', 'i7', 'ii%7', 'V7b9', 'i7', 'i7', 'ii%7', 'V7b9'], weight: 4 }],
    outro: [{ chords: ['ii%7', 'V7b9', 'i7', 'i7'], weight: 4 }],
  },
  melodyCells: [
    { cell: [-2, 2, 4, 4, 4], weight: 5 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [6, 6, 4], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 3 },
    { cell: [6, 6, 4], weight: 3 },
  ],
  bass: [
    { name: 'bossa-two-beat', weight: 7, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 0.9 },
      { at: 6, dur: 2, tone: 'fifth', vel: 0.75 },
      { at: 8, dur: 5, tone: 'root', vel: 0.85 },
      { at: 14, dur: 2, tone: 'fifth', vel: 0.75 },
    ] },
    { name: 'bossa-simple', weight: 3, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.9 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.78 },
    ] },
  ],
  comp: [
    { name: 'bossa-guitar', weight: 6, voices: 4, voicing: 'guide', hits: [
      { at: 0, dur: 3, vel: 0.55 },
      { at: 6, dur: 2, vel: 0.5 },
      { at: 10, dur: 2, vel: 0.52 },
      { at: 14, dur: 2, vel: 0.5 },
    ] },
    { name: 'bossa-sparse', weight: 4, voices: 4, voicing: 'guide', hits: [
      { at: 0, dur: 6, vel: 0.5 },
      { at: 10, dur: 4, vel: 0.48 },
    ] },
  ],
  drums: [
    { name: 'bossa-rim', weight: 6, voices: {
      rim: [0, 6, 10, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      bd: [0, 8],
    } },
    { name: 'bossa-brush', weight: 4, voices: {
      rim: [0, 6, 10, 12],
      sh: [0, 2, 4, 6, 8, 10, 12, 14],
      bd: [0, 8],
    } },
  ],
  melody: { leap: 0.22, ornament: 0.2, span: 15, sequence: 0.42, syncopation: 0.65 },
};

/**
 * BLUES — twelve bars.
 *
 * `chorusBars: 12` drives the form: every section is a 12-bar chorus rather
 * than the 8-bar unit everything else uses. Harmony is dominant sevenths
 * throughout, which is why the blues scale clashes so productively with it.
 */
const blues: Style = {
  id: 'blues',
  label: 'Blues',
  description:
    'Twelve-bar jazz blues. Dominant sevenths throughout, blue notes over the top, walking bass and shuffling ride.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [92, 176],
  swing: 0.33,
  // Every chorus is twelve bars, not eight. The form builder rewrites section
  // lengths to match, which is what makes the blues a blues.
  chorusBars: 12,
  // A blues head is a riff, and a riff is stated again. The twelve-bar form is
  // already a repetition machine; this just stops the tune fighting it.
  hook: 'standard',
  /**
   * Fixed on the *key*, not the chord — the tonic blues scale over everything,
   * except that a ii–V turnaround is a real ii–V and gets treated as one. The
   * jazz blues progressions in this table have one in bars nine and ten, and a
   * line that ignored it would be playing over the changes rather than through
   * them.
   *
   * The only style in the catalogue that overrides its genre here, and the
   * reason is measurable. Jazz's chord-scale mapping gives every dom7
   * mixolydian rooted on the *chord*, so a blues in F played F mixolydian over
   * I7 and B♭ mixolydian over IV7, re-orienting every bar. Across 25 major-key
   * blues songs that put the ♭3 on 1.4% of melody notes over I7 against 17.5%
   * for the ♮3 — exactly backwards. The grind between a held ♭3 and the I7's
   * own major third is the sound of the idiom, and the mapping guaranteed it
   * could not occur; the ♭3 that did show up was over IV7, where it is that
   * chord's own ♭7 and has no friction in it at all.
   *
   * In a minor blues this barely fires, and does not need to: `i7` and `iv7`
   * are min7, so they take dorian on their own roots, and B♭ dorian under an F
   * minor blues is the same seven pitch classes as F aeolian. The mapping is
   * already key-relative there, ♭3 included. Major is where it was wrong.
   *
   * The min7/halfdim7/altered arm is jazz's own switch, copied rather than
   * called: `jazz/index.ts` imports this file, so reaching back for
   * `jazz.scaleForChord` would close an import cycle. Three cases is a cheap
   * copy, and they are the settled end of that switch, but they do have to stay
   * in step with it.
   *
   * Six notes with no 2nd, 6th or major 3rd is thin, and a head built purely
   * from it reads as pentatonic noodling. Shipped pure on purpose: the
   * blues-scale/mixolydian mixture that fixes it wants a blend chosen off these
   * numbers rather than guessed in front of them.
   */
  scaleForChord: (tonic, _mode, chord) => {
    if (chord.quality === 'min7') return makeScale(chord.root, 'dorian');
    if (chord.quality === 'halfdim7') return makeScale(chord.root, 'locrian');
    if (isAlteredDominant(chord.quality)) return makeScale(pc(chord.root + 1), 'melodicMinor');
    return makeScale(tonic, 'blues');
  },
  /**
   * Two of the three sections are in the pocket and one is dead straight, and
   * the difference between those is a shuffle that swings and a shuffle that
   * marches. A blues is the obvious first place to ask for it: the idiom is a
   * rhythm section and a soloist, everybody has heard hundreds of them, and the
   * thing being added is the one people mean when they say a band is *in* it.
   *
   * Weighted toward straight rather than at parity, because the point of the
   * pair is that the sections differ from each other. A table of pocket alone
   * would be a style change dressed up as a per-section draw.
   */
  feels: [['straight', 6], ['pocket', 4]],
  modeWeights: { minor: 0.24, major: 0.76 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['V7', 'IV7', 'I7', 'V7'], weight: 4 }],
    verse: [
      {
        chords: ['I7', 'IV7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'],
        weight: 5, note: 'The plain twelve-bar blues',
      },
      {
        chords: ['I7', 'IV7', 'I7', 'v7', 'IV7', '#ivo7', 'I7', 'VI7', 'ii7', 'V7', 'I7', 'V7'],
        weight: 5, note: 'Jazz blues: a ii–V turnaround and a diminished passing chord in bar six',
      },
      {
        chords: ['I7', 'IV7', 'I7', 'bIII7', 'IV7', '#ivo7', 'I7', 'VI7', 'ii7', 'bII7', 'I7', 'V7'],
        weight: 3, note: 'With tritone substitutions in the turnaround',
      },
    ],
    chorus: [
      {
        chords: ['I7', 'IV7', 'I7', 'v7', 'IV7', '#ivo7', 'I7', 'VI7', 'ii7', 'V7', 'I7', 'V7'],
        weight: 5,
      },
      {
        chords: ['I7', 'IV7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'],
        weight: 4,
      },
    ],
    solo: [
      {
        chords: ['I7', 'IV7', 'I7', 'v7', 'IV7', '#ivo7', 'I7', 'VI7', 'ii7', 'V7', 'I7', 'V7'],
        weight: 5,
      },
    ],
    bridge: [
      { chords: ['IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'], weight: 3 },
    ],
    outro: [{ chords: ['ii7', 'V7', 'I7', 'I7'], weight: 4 }],
  },
  minorProgressions: {
    intro: [{ chords: ['V7b9', 'iv7', 'i7', 'V7b9'], weight: 4 }],
    verse: [
      {
        chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'ii%7', 'V7b9', 'i7', 'V7b9'],
        weight: 5, note: 'Minor blues',
      },
      {
        chords: ['i7', 'iv7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'VI7', 'V7b9', 'i7', 'V7b9'],
        weight: 4, note: 'With the flat-six dominant in bar nine',
      },
    ],
    chorus: [
      {
        chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'ii%7', 'V7b9', 'i7', 'V7b9'],
        weight: 5,
      },
    ],
    solo: [
      {
        chords: ['i7', 'iv7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'VI7', 'V7b9', 'i7', 'V7b9'],
        weight: 5,
      },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'i7', 'i7', 'V7b9', 'iv7', 'i7', 'V7b9'], weight: 3 }],
    outro: [{ chords: ['ii%7', 'V7b9', 'i7', 'i7'], weight: 4 }],
  },
  melodyCells: [
    { cell: [-4, 2, 2, 4, 4], weight: 5 },
    { cell: [4, 2, 2, 8], weight: 4 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [-2, 2, 2, 2, 8], weight: 4 },
    { cell: [6, 2, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [-8, 2, 2, 4], weight: 3 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    { name: 'walking', weight: 7, walking: true, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.95 },
      { at: 4, dur: 3, tone: 'third', vel: 0.82 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.86 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.82 },
    ] },
    { name: 'two-feel', weight: 3, hits: [
      { at: 0, dur: 6, tone: 'root', vel: 0.95 },
      { at: 8, dur: 6, tone: 'fifth', vel: 0.85 },
    ] },
  ],
  comp: [
    { name: 'shuffle-stabs', weight: 5, voices: 4, voicing: 'guide', hits: [
      { at: 6, dur: 3, vel: 0.58 },
      { at: 14, dur: 3, vel: 0.6 },
    ] },
    { name: 'charleston', weight: 4, voices: 4, voicing: 'guide', hits: [
      { at: 0, dur: 3, vel: 0.6 },
      { at: 6, dur: 4, vel: 0.55 },
    ] },
  ],
  drums: [
    { name: 'shuffle', weight: 6, voices: {
      rd: [0, 6, 8, 14],
      hh: [4, 12],
      sd: [4, 12],
      bd: [0, 8],
    } },
    { name: 'ride-blues', weight: 4, voices: {
      rd: [0, 6, 8, 14],
      hh: [4, 12],
      bd: [0],
      rim: [10],
    } },
  ],
  melody: { leap: 0.3, ornament: 0.32, span: 17, sequence: 0.45, syncopation: 0.42 },
};

/**
 * MODAL — static harmony, quartal voicings.
 *
 * One chord for eight or sixteen bars. With the harmony holding still, tertian
 * voicings turn to wallpaper fast, so the comp stacks fourths instead; that
 * ambiguity is what keeps a motionless chord interesting.
 */
const modal: Style = {
  id: 'modal',
  label: 'Modal',
  description:
    'Static Dorian harmony held for eight or sixteen bars, quartal piano voicings, floating melody. The So What sound.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [112, 168],
  swing: 0.33,
  // With the harmony holding still, a recalled tune would be the only thing
  // marking time — and modal jazz is precisely the music that declines to mark
  // it. The line floats or it is not modal.
  hook: 'through',
  /**
   * The one style where turning the swing off for a section is a statement
   * rather than a bug, and therefore the only place `halftime` is enabled.
   *
   * `Feel.swing` is the field that crosses the divide — it is applied at
   * assembly, to the melody as well as the band — and it wanted a style with
   * swing to switch off. Modal has 0.33 of it and eight bars of one chord
   * underneath, which is exactly the music where a straight, long, wide section
   * reads as the band settling into the mode rather than as the drummer losing
   * the feel. Under a style whose form moves every bar the same gesture would
   * sound like the swing had been forgotten.
   *
   * What it does *not* do is move the snare onto beat three, which is what half
   * time actually is. See the entry: that is a figure and a figure is a style.
   */
  feels: [['straight', 7], ['halftime', 3]],
  modeWeights: { minor: 0.82, major: 0.18 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 4 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6, note: 'Eight bars of one chord — the melody has to carry everything' },
      { chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 3 },
    ],
    chorus: [
      { chords: ['bii7', 'bii7', 'bii7', 'bii7', 'bii7', 'bii7', 'bii7', 'bii7'], weight: 5, note: 'The So What shift: the whole modal centre slides up a semitone' },
      { chords: ['bIIImaj7', 'bIIImaj7', 'bIIImaj7', 'bIIImaj7', 'i7', 'i7', 'i7', 'i7'], weight: 3 },
    ],
    bridge: [
      { chords: ['bVImaj7', 'bVImaj7', 'bVImaj7', 'bVImaj7', 'bVII7', 'bVII7', 'bVII7', 'bVII7'], weight: 4 },
    ],
    solo: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 5 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'bii7', 'bii7', 'bii7', 'bii7'], weight: 3 },
    ],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'], weight: 4 }],
    verse: [
      { chords: ['Imaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'], weight: 5, note: 'Static Lydian-leaning major — same idea, brighter' },
      { chords: ['Imaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'IVmaj7', 'IVmaj7'], weight: 3 },
    ],
    chorus: [
      { chords: ['bIImaj7', 'bIImaj7', 'bIImaj7', 'bIImaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'], weight: 4 },
    ],
    bridge: [{ chords: ['bVImaj7', 'bVImaj7', 'bVImaj7', 'bVImaj7', 'bVII7', 'bVII7', 'bVII7', 'bVII7'], weight: 4 }],
    solo: [{ chords: ['Imaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'], weight: 5 }],
    outro: [{ chords: ['Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'], weight: 4 }],
  },
  melodyCells: [
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [16], weight: 3 },
    { cell: [-8, 4, 4], weight: 3 },
    { cell: [6, 2, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    { name: 'walking', weight: 5, walking: true, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.92 },
      { at: 4, dur: 3, tone: 'third', vel: 0.8 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.84 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.8 },
    ] },
    { name: 'pedal', weight: 4, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.9 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.78 },
      { at: 12, dur: 3, tone: 'root', vel: 0.8 },
    ] },
  ],
  comp: [
    { name: 'quartal-stabs', weight: 6, voices: 4, voicing: 'quartal', hits: [
      { at: 0, dur: 4, vel: 0.5 },
      { at: 6, dur: 4, vel: 0.45 },
    ] },
    { name: 'quartal-sparse', weight: 4, voices: 4, voicing: 'quartal', hits: [
      { at: 6, dur: 6, vel: 0.48 },
    ] },
    { name: 'quartal-sustained', weight: 3, voices: 4, voicing: 'quartal', hits: [
      { at: 0, dur: 14, vel: 0.4 },
    ] },
  ],
  drums: [
    { name: 'ride-modal', weight: 6, voices: {
      rd: [0, 6, 8, 14],
      hh: [4, 12],
      bd: [0],
    } },
    { name: 'ride-open', weight: 4, voices: {
      rd: [0, 6, 8, 14],
      hh: [4, 12],
      sd: [6],
      bd: [10],
    } },
  ],
  melody: { leap: 0.28, ornament: 0.24, span: 18, sequence: 0.38, syncopation: 0.35 },
};

/**
 * GYPSY JAZZ (jazz manouche).
 *
 * Django's idiom: fast minor-key acoustic swing driven by "la pompe" — the
 * two-guitar pump that hits all four beats, short and hard, with the accent on
 * two and four. Harmony leans on minor sixth chords and diminished passing
 * chords rather than the ii–V world.
 */
const gypsy: Style = {
  id: 'gypsy',
  label: 'Gypsy jazz',
  description:
    'Jazz manouche. Fast acoustic minor swing, "la pompe" guitar on all four beats, minor sixth and diminished harmony.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [176, 248],
  swing: 0.26,
  modeWeights: { minor: 0.72, major: 0.28 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['i6', 'V7b9', 'i6', 'i6'], weight: 4 }],
    verse: [
      { chords: ['i6', 'i6', 'V7b9', 'V7b9', 'i6', 'i6', 'iv6', 'V7b9'], weight: 5 },
      { chords: ['i6', 'VI7', 'II7', 'V7', 'i6', 'VI7', 'II7', 'V7'], weight: 4, note: 'Circle of fifths — the manouche workhorse' },
      { chords: ['i6', 'iv6', 'i6', 'V7b9', 'i6', 'iv6', 'V7b9', 'i6'], weight: 4 },
      { chords: ['Imaj7', 'VI7', 'ii7', 'V7', 'Imaj7', 'VI7', 'ii7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv6', 'iv6', 'i6', 'i6', 'V7b9', 'V7b9', 'i6', 'i6'], weight: 4 },
      { chords: ['VI7', 'VI7', 'II7', 'II7', 'V7', 'V7', 'i6', 'i6'], weight: 4 },
    ],
    bridge: [
      { chords: ['III7', 'III7', 'VI7', 'VI7', 'II7', 'II7', 'V7b9', 'V7b9'], weight: 4 },
    ],
    solo: [
      { chords: ['i6', 'i6', 'V7b9', 'V7b9', 'i6', 'i6', 'iv6', 'V7b9'], weight: 4 },
      { chords: ['i6', 'VI7', 'II7', 'V7', 'i6', 'VI7', 'II7', 'V7'], weight: 3 },
    ],
    outro: [{ chords: ['iv6', 'V7b9', 'i6', 'i6'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I6', 'V7', 'I6', 'I6'], weight: 4 }],
    verse: [
      { chords: ['I6', 'VI7', 'II7', 'V7', 'I6', 'VI7', 'II7', 'V7'], weight: 5 },
      { chords: ['I6', 'I6', 'II7', 'II7', 'V7', 'V7', 'I6', 'I6'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV6', 'IV6', 'I6', 'I6', 'V7', 'V7', 'I6', 'I6'], weight: 4 },
      { chords: ['VI7', 'VI7', 'II7', 'II7', 'V7', 'V7', 'I6', 'I6'], weight: 3 },
    ],
    bridge: [{ chords: ['III7', 'III7', 'VI7', 'VI7', 'II7', 'II7', 'V7', 'V7'], weight: 4 }],
    solo: [{ chords: ['I6', 'VI7', 'II7', 'V7', 'I6', 'VI7', 'II7', 'V7'], weight: 4 }],
    outro: [{ chords: ['IV6', 'V7', 'I6', 'I6'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 2, 2, 2, 2], weight: 5 },
    { cell: [-2, 2, 2, 2, 2, 2, 4], weight: 4 },
    { cell: [4, 2, 2, 2, 2, 4], weight: 4 },
    { cell: [3, 1, 4, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [-4, 2, 2, 2, 2, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    { name: 'two-feel', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.95 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.85 },
    ] },
    { name: 'walking', weight: 4, walking: true, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.95 },
      { at: 4, dur: 3, tone: 'third', vel: 0.8 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.85 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.8 },
    ] },
  ],
  comp: [
    // La pompe: all four beats, very short, accents on two and four.
    { name: 'la-pompe', weight: 8, voices: 4, hits: [
      { at: 0, dur: 1, vel: 0.5 },
      { at: 4, dur: 2, vel: 0.75 },
      { at: 8, dur: 1, vel: 0.5 },
      { at: 12, dur: 2, vel: 0.75 },
    ] },
    { name: 'la-pompe-light', weight: 3, voices: 3, hits: [
      { at: 4, dur: 2, vel: 0.72 },
      { at: 12, dur: 2, vel: 0.72 },
    ] },
  ],
  drums: [
    // Manouche is usually drummerless; when drums appear they stay out of the
    // way of the guitars.
    { name: 'brushes-light', weight: 5, voices: {
      sh: [0, 4, 8, 12],
      rim: [4, 12],
    } },
    { name: 'none', weight: 4, voices: {} },
  ],
  melody: { leap: 0.34, ornament: 0.36, span: 20, sequence: 0.35, syncopation: 0.4 },
};

/**
 * PIANO TRIO — the pianist is the band.
 *
 * Piano, bass and drums, and the one thing that makes it a different style
 * rather than swing with the horns deleted: **the piano plays both parts at
 * once**. The right hand states the head and then blows for chorus after
 * chorus; the left hand comps underneath it, rootless, in the holes the right
 * hand leaves. Corea, Evans, Jarrett, Tyner — four completely different players
 * whose *texture* is this one, and the texture is what this table describes.
 *
 * Everything unusual about the entry follows from there.
 *
 *  - **`twoHanded` is the whole style.** It names the instrument, moves it up an
 *    octave so the left hand has somewhere to live, and says how densely that
 *    hand speaks. Without it this is a quartet missing its horn.
 *  - **`comp`, `pad`, `brass` and `counter` are excluded.** Not thinned —
 *    excluded. A second chord instrument comping behind a pianist who is
 *    comping for themselves is two people doing one job, and it is the specific
 *    thing a trio exists to not have. `requireLayers` then pins the piano into
 *    every section, because a trio in which the piano lays out is a bass solo.
 *  - **The tempo band is wide and the harmony is modern.** Suspensions that
 *    never resolve, quartal-friendly modal stretches, a ♭II7 sidestep, and
 *    ii–Vs that move in thirds rather than in fifths. This is the post-1960
 *    language rather than the standards repertoire `swing` already covers, and
 *    it is where a pianist gets something to *play on* — a I chord for eight
 *    bars is only interesting if you are the one filling it.
 *  - **`hook: 'through'`.** With one instrument carrying the tune, the solos and
 *    the accompaniment, a recalled phrase is the same voice saying the same
 *    thing three times. The form is repetitive enough on its own.
 */
const trio: Style = {
  id: 'trio',
  label: 'Piano trio',
  description:
    'Post-bop piano trio. The right hand takes the head and the choruses, the left hand comps rootless voicings underneath it, and the bass and drums are the only other people in the room.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [128, 208],
  swing: 0.31,
  hook: 'through',
  modeWeights: { minor: 0.46, major: 0.54 },
  relativeMajorChorus: 0,
  twoHanded: {
    /**
     * Three pianos, weighted, and no fourth instrument.
     *
     * A trio led from a vibraphone is a real group and a different record —
     * Burton's, Jackson's — rather than this one, and it belongs in its own
     * entry with its own tempo band rather than as a one-in-eight surprise here.
     * What the Rhodes buys is the same room a decade later, which is a shading
     * of this style rather than a departure from it.
     */
    instruments: [['piano', 8], ['epiano1', 2], ['epiano2', 1]],
    /**
     * High, and it has to be: this is the rate *before* the line's own busyness
     * takes chords away, and this line is busy nearly all the time. A jazz
     * melody at `gait: 0.5` covers close to the whole bar, so anything under
     * about 0.9 here comes out the far side as a left hand speaking in one bar
     * in four — which is a pianist who has forgotten they have one.
     */
    density: 0.92,
    /**
     * Mostly answering, because that is what this idiom is, with the other three
     * as the departures they should be. A unison line every fifth section is a
     * gesture; every other section it would be a mannerism.
     */
    modes: [['answer', 6], ['block', 2], ['unison', 2], ['ostinato', 1]],
    /**
     * Three beats against a four-beat bar, so the figure arrives on a different
     * beat every bar and comes back round every three. Two notes and a rest:
     * a vamp is mostly space, and the space is where the right hand goes.
     */
    ostinato: {
      cycle: 12,
      hits: [
        { at: 0, dur: 2, vel: 0.5 },
        { at: 6, dur: 2, vel: 0.44 },
        { at: 10, dur: 2, vel: 0.4 },
      ],
    },
  },
  excludeLayers: ['comp', 'pad', 'brass', 'counter'],
  requireLayers: ['melody'],
  progressions: {
    intro: [
      { chords: ['ii7', 'V7sus4', 'Imaj9', 'Imaj9'], weight: 4 },
      { chords: ['Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9'], weight: 3 },
    ],
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'iii7', 'VI7b9', 'ii7', 'V7sus4', 'Imaj9', 'Imaj9'], weight: 5, note: 'The V that never quite resolves — a suspension held where bebop would have put the leading tone' },
      { chords: ['Imaj9', 'bIIImaj9', 'bVImaj9', 'bIImaj9', 'Imaj9', 'ii7', 'V7', 'Imaj9'], weight: 4, note: 'Thirds motion: the harmony walks down in major thirds instead of round the circle' },
      { chords: ['ii7', 'ii7', 'V7#9', 'V7#9', 'Imaj9', 'IVmaj9', 'iii7', 'VI7b9'], weight: 4 },
      { chords: ['Imaj9', 'IVmaj9', 'Imaj9', 'IVmaj9', 'iii7', 'VI7b9', 'ii7', 'V7sus4'], weight: 3, note: 'Two chords rocking for four bars, which is a vamp and is somewhere to play' },
    ],
    chorus: [
      { chords: ['IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'ii7', 'V7sus4', 'Imaj9', 'Imaj9'], weight: 4 },
      { chords: ['ii7', 'V7#9', 'Imaj9', 'bII7', 'ii7', 'V7', 'Imaj9', 'Imaj9'], weight: 4 },
      { chords: ['Imaj9', 'VI7#9', 'ii7', 'V7b9', 'iii7', 'VI7b9', 'ii7', 'V7sus4'], weight: 3 },
    ],
    bridge: [
      { chords: ['IVmaj9', 'IVmaj9', 'bVII7', 'bVII7', 'bIIImaj9', 'bIIImaj9', 'ii7', 'V7sus4'], weight: 4 },
      { chords: ['iv9', 'iv9', 'bVII7', 'bVII7', 'Imaj9', 'Imaj9', 'ii7', 'V7'], weight: 3 },
    ],
    solo: [
      { chords: ['Imaj9', 'Imaj9', 'iii7', 'VI7b9', 'ii7', 'V7sus4', 'Imaj9', 'Imaj9'], weight: 4 },
      { chords: ['ii7', 'ii7', 'V7#9', 'V7#9', 'Imaj9', 'IVmaj9', 'iii7', 'VI7b9'], weight: 4 },
      { chords: ['Imaj9', 'IVmaj9', 'Imaj9', 'IVmaj9', 'ii7', 'V7sus4', 'Imaj9', 'Imaj9'], weight: 3 },
    ],
    outro: [
      { chords: ['ii7', 'V7sus4', 'Imaj9', 'Imaj9'], weight: 4 },
      { chords: ['IVmaj9', 'bVII7', 'Imaj9', 'Imaj9'], weight: 2 },
    ],
  },
  minorProgressions: {
    intro: [{ chords: ['i9', 'i9', 'ii%7', 'V7b9'], weight: 4 }],
    verse: [
      { chords: ['i11', 'i11', 'i11', 'i11', 'iv9', 'iv9', 'ii%7', 'V7b9'], weight: 5, note: 'Four bars of one minor eleventh: the modal half of the idiom, and the left hand voices it in fourths' },
      { chords: ['i9', 'VII7', 'VImaj9', 'V7#9', 'i9', 'VII7', 'ii%7', 'V7b9'], weight: 4 },
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'bIImaj9', 'bIImaj9', 'i9', 'V7b9'], weight: 3, note: 'The Neapolitan sitting where a ii–V would be — a semitone sidestep and back' },
    ],
    chorus: [
      { chords: ['iv9', 'iv9', 'i9', 'i9', 'ii%7', 'V7b9', 'i9', 'i9'], weight: 4 },
      { chords: ['VImaj9', 'VII7', 'i9', 'i9', 'iv9', 'V7#9', 'i9', 'i9'], weight: 3 },
    ],
    bridge: [{ chords: ['iv11', 'iv11', 'bVIImaj9', 'bVIImaj9', 'IIImaj9', 'IIImaj9', 'ii%7', 'V7b9'], weight: 4 }],
    solo: [
      { chords: ['i11', 'i11', 'i11', 'i11', 'iv9', 'iv9', 'ii%7', 'V7b9'], weight: 4 },
      { chords: ['i9', 'VII7', 'VImaj9', 'V7#9', 'i9', 'VII7', 'ii%7', 'V7b9'], weight: 3 },
    ],
    outro: [{ chords: ['ii%7', 'V7b9', 'i9', 'i9'], weight: 4 }],
  },
  /**
   * Long lines with room in them. The right hand is carrying a whole band's
   * worth of interest, and a cell that never rests gives the left hand nowhere
   * to answer — the holes in these are what the other hand is written into.
   */
  melodyCells: [
    { cell: [2, 2, 2, 2, 2, 2, 4], weight: 5 },
    { cell: [-4, 2, 2, 2, 2, 4], weight: 5 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [-2, 2, 2, 2, 8], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [-8, 2, 2, 2, 2], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'walking', weight: 6, walking: true, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.94 },
      { at: 4, dur: 3, tone: 'third', vel: 0.8 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.85 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.8 },
    ] },
    // A pedal under a vamp, which is what the bass does when the harmony stops
    // moving and the piano is the one filling the space.
    { name: 'pedal', weight: 3, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.9 },
      { at: 10, dur: 2, tone: 'fifth', vel: 0.76 },
      { at: 12, dur: 3, tone: 'root', vel: 0.8 },
    ] },
    { name: 'two-feel', weight: 2, hits: [
      { at: 0, dur: 6, tone: 'root', vel: 0.94 },
      { at: 8, dur: 6, tone: 'fifth', vel: 0.84 },
    ] },
  ],
  /**
   * Never read.
   *
   * `excludeLayers` removes the comp layer in every section, because on this
   * style the comper is the pianist and their comping is `twoHanded`. `Style`
   * requires the table, so this is the honest minimum rather than a figure
   * anybody plays — and a quartal shape, so that if the exclusion is ever
   * relaxed what turns up is at least the right sound.
   */
  comp: [
    { name: 'unused', weight: 1, voices: 4, voicing: 'quartal', hits: [{ at: 6, dur: 4, vel: 0.45 }] },
  ],
  drums: [
    { name: 'ride-open', weight: 6, voices: {
      rd: [0, 6, 8, 14],
      hh: [4, 12],
      bd: [0],
      sd: [10],
    } },
    { name: 'ride-conversational', weight: 5, voices: {
      rd: [0, 6, 8, 14],
      hh: [4, 12],
      sd: [6, 13],
      bd: [10],
    } },
    { name: 'brushes-trio', weight: 3, voices: {
      sh: [0, 4, 8, 12],
      rd: [0, 8],
      hh: [4, 12],
    } },
  ],
  melody: { leap: 0.34, ornament: 0.2, span: 20, sequence: 0.34, syncopation: 0.55 },
};

/**
 * ODD METRE — five beats, grouped three and two.
 *
 * The oldest of the "difficult" jazz metres and by some distance the most
 * playable: a 5/4 grouped 3+2 is a bar of waltz followed by a bar of two, and a
 * rhythm section that can feel those two things can feel this. Everything that
 * makes it sound like five rather than like a mistake is in `groups`.
 *
 *  - **The accents.** `metricStrength` is handed the grouping and puts the
 *    second pulse on slot 12, where the ear expects it, instead of on slot 10,
 *    where the arithmetic would have put a half-bar. The melody phrases to it,
 *    the drums accent to it, and the soloist lands on it.
 *  - **The bass does not walk.** A walking line is four quarters connecting one
 *    root to the next, and a fifth quarter has nowhere to be in that sentence;
 *    what a bassist actually plays in five is a *figure* that states the
 *    grouping — root on 1, the fifth on the 4, an approach on the way out. So
 *    the patterns here are fixed-degree and each of them spells 3+2 out loud.
 *  - **The kit rides in five.** The ride pattern is the pulse of the music, and
 *    a swing ride in five puts its skip beat inside the long group only.
 *
 * The harmony is deliberately plainer than the trio's. A listener counting a
 * metre they do not know has no attention left for a reharmonisation, and every
 * record that made five work knew it: hold a vamp, let the metre be the event.
 */
const odd: Style = {
  id: 'odd',
  label: 'Odd metre',
  description:
    'Five beats to the bar, grouped three-and-two, over a modal vamp. The metre is the event, so the harmony holds still and the rhythm section spells the grouping out.',
  beatsPerBar: 5,
  beatUnit: 4,
  /** Three and two, in sixteenths. The long group first, which is how it swings. */
  groups: [12, 8],
  bpm: [116, 168],
  swing: 0.3,
  hook: 'through',
  modeWeights: { minor: 0.66, major: 0.34 },
  relativeMajorChorus: 0,
  twoHanded: {
    instruments: [['piano', 6], ['vibraphone', 4], ['epiano1', 2]],
    density: 0.85,
    /**
     * Ostinato-heavy, which is the reverse of the trio's balance and follows
     * from the metre. A left hand answering in the holes of a bar the listener
     * cannot yet count adds a second thing to work out; a figure that states the
     * grouping every bar is how the band teaches it to them.
     */
    modes: [['ostinato', 5], ['answer', 3], ['block', 2], ['unison', 2]],
    /**
     * The grouping itself, as a figure: the long pulse, its offbeat, the short
     * pulse. A cycle of 20 is the bar, and here that is deliberate — this vamp
     * is teaching the metre, and a figure that drifted would teach the opposite.
     */
    ostinato: {
      cycle: 20,
      hits: [
        { at: 0, dur: 3, vel: 0.55 },
        { at: 6, dur: 2, vel: 0.42 },
        { at: 12, dur: 3, vel: 0.5 },
      ],
    },
  },
  excludeLayers: ['comp', 'pad', 'brass'],
  requireLayers: ['melody'],
  progressions: {
    intro: [
      { chords: ['i11', 'i11', 'i11', 'i11'], weight: 4 },
      { chords: ['i11', 'iv9', 'i11', 'i11'], weight: 3 },
    ],
    verse: [
      { chords: ['i11', 'i11', 'i11', 'i11', 'iv9', 'iv9', 'i11', 'i11'], weight: 5, note: 'A vamp on one chord: in an unfamiliar metre the harmony is what holds still' },
      { chords: ['i11', 'i11', 'bVIImaj9', 'bVIImaj9', 'i11', 'i11', 'iv9', 'V7b9'], weight: 4 },
      { chords: ['i9', 'bVImaj9', 'bVIImaj9', 'i9', 'i9', 'bVImaj9', 'ii%7', 'V7b9'], weight: 3, note: 'The aeolian cadence — down a third, up a tone, home — which needs no leading tone' },
    ],
    chorus: [
      { chords: ['iv9', 'iv9', 'i11', 'i11', 'bVIImaj9', 'bVIImaj9', 'i11', 'i11'], weight: 4 },
      { chords: ['bVImaj9', 'bVIImaj9', 'i11', 'i11', 'bVImaj9', 'bVIImaj9', 'i9', 'V7b9'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv11', 'iv11', 'iv11', 'iv11', 'bIImaj9', 'bIImaj9', 'ii%7', 'V7b9'], weight: 4 },
    ],
    solo: [
      { chords: ['i11', 'i11', 'i11', 'i11', 'iv9', 'iv9', 'i11', 'i11'], weight: 5 },
      { chords: ['i11', 'i11', 'bVIImaj9', 'bVIImaj9', 'i11', 'i11', 'iv9', 'V7b9'], weight: 3 },
    ],
    outro: [
      { chords: ['iv9', 'i11', 'i11', 'i11'], weight: 4 },
    ],
  },
  majorProgressions: {
    intro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 4 }],
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9'], weight: 5 },
      { chords: ['Imaj9', 'IVmaj9', 'Imaj9', 'IVmaj9', 'ii7', 'V7sus4', 'Imaj9', 'Imaj9'], weight: 4 },
    ],
    chorus: [
      { chords: ['IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'ii7', 'V7sus4', 'Imaj9', 'Imaj9'], weight: 4 },
      { chords: ['Imaj9', 'bVIImaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'bVIImaj9', 'ii7', 'V7sus4'], weight: 3 },
    ],
    bridge: [{ chords: ['IVmaj9', 'IVmaj9', 'bVIImaj9', 'bVIImaj9', 'iii7', 'VI7b9', 'ii7', 'V7sus4'], weight: 4 }],
    solo: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
    outro: [{ chords: ['IVmaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 4 }],
  },
  /**
   * Twenty sixteenths, and every cell says three-and-two somewhere.
   *
   * `fitCell` would pad a 4/4 cell out to length by lengthening its last note,
   * which fills the bar and states nothing — the extra beat would arrive as a
   * held note rather than as part of the count. These are written to the metre
   * instead: the ones that break at slot 12 are the grouping, and the ones that
   * run through it are the syncopation that only means anything against it.
   */
  melodyCells: [
    { cell: [4, 4, 4, 4, 4], weight: 4 },
    { cell: [6, 6, 4, 4], weight: 5 },
    { cell: [-4, 4, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 4, 4, 4], weight: 4 },
    { cell: [12, 4, 4], weight: 4 },
    { cell: [4, 4, 4, 8], weight: 3 },
    { cell: [-6, 6, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 4, 8], weight: 3 },
    { cell: [8, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [20], weight: 5 },
    { cell: [12, 8], weight: 4 },
    { cell: [-4, 16], weight: 3 },
    { cell: [8, 12], weight: 2 },
  ],
  bass: [
    /**
     * Three and two, stated. Root on the downbeat, the fifth where the second
     * group starts, and the walk-up only inside the long group — which is the
     * one place five beats leaves room for one.
     */
    { name: 'five-figure', weight: 6, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 0.95 },
      { at: 6, dur: 2, tone: 'fifth', vel: 0.8 },
      { at: 8, dur: 3, tone: 'octave', vel: 0.78 },
      { at: 12, dur: 3, tone: 'root', vel: 0.9 },
      { at: 16, dur: 3, tone: 'approach', vel: 0.8 },
    ] },
    { name: 'five-pedal', weight: 4, hits: [
      { at: 0, dur: 11, tone: 'root', vel: 0.94 },
      { at: 12, dur: 7, tone: 'fifth', vel: 0.82 },
    ] },
    /**
     * A three-beat figure against a five-beat bar, which comes back round every
     * three bars. The most disorienting thing in the style and the reason
     * `cycle` exists — no bar-shaped pattern can produce it.
     */
    { name: 'three-against-five', weight: 3, cycle: 12, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.92 },
      { at: 6, dur: 2, tone: 'fifth', vel: 0.78 },
      { at: 8, dur: 3, tone: 'seventh', vel: 0.76 },
    ] },
  ],
  comp: [
    { name: 'unused', weight: 1, voices: 4, voicing: 'quartal', hits: [{ at: 6, dur: 4, vel: 0.45 }] },
  ],
  drums: [
    { name: 'ride-five', weight: 6, voices: {
      rd: [0, 6, 8, 12, 16],
      hh: [8, 16],
      bd: [0],
      sd: [12],
    } },
    { name: 'ride-five-busy', weight: 4, voices: {
      rd: [0, 4, 6, 8, 12, 14, 16],
      hh: [8, 16],
      bd: [0, 10],
      rim: [6],
    } },
    /**
     * A four-slot hat cycle under a five-beat bar: the hat and the barline agree
     * once every four bars and disagree everywhere else. The ride and the kick
     * hold the metre while it happens, which is what stops it sounding like a
     * mistake.
     */
    { name: 'hat-against-five', weight: 3, cycle: 4, voices: {
      hh: [0],
      rd: [0, 2],
    } },
    { name: 'brushes-five', weight: 2, voices: {
      sh: [0, 4, 8, 12, 16],
      rd: [0, 12],
      hh: [8],
    } },
  ],
  melody: { leap: 0.3, ornament: 0.22, span: 18, sequence: 0.42, syncopation: 0.45 },
};

/**
 * FUSION — seven eighths, grouped two-two-three, and nothing swings.
 *
 * The style the whole rhythm rewrite was for. Everything in it is a thing the
 * generator could not previously express:
 *
 *  - **The metre is written in eighths.** `beatsPerBar: 3.5` is not a fudge —
 *    seven eighths genuinely is three and a half quarters, the bar is fourteen
 *    sixteenths, and every slot index below is an honest one. The MIDI file
 *    still says 7/8, because `renderMidi` works the numerator back out.
 *  - **The grouping is declared**, so the pulses land on slots 0, 6 and 10 — the
 *    long, long, short that the whole style is built on. Without it the accents
 *    fall on the quarters, which in this bar are three notes that mean nothing.
 *  - **The bass is an ostinato, not a walk.** Fusion bass is a *riff*: a fixed
 *    shape re-rooted on each chord, repeating until the section ends. Two of
 *    the three here run on their own cycle and drift against the bar.
 *  - **The lead plays two-handed and mostly in octaves.** The unison line is the
 *    sound — both hands, an octave apart, through changes that do not resolve —
 *    and it was flatly unreachable before `LeftHandMode` existed.
 *
 * Straight eighths throughout. Swinging this would be as wrong as swinging a
 * bossa, and for the same reason: the sixteenth grid *is* the idiom, and a
 * triplet feel laid over it deletes the thing being played.
 */
const fusion: Style = {
  id: 'fusion',
  label: 'Fusion',
  description:
    'Seven eighths grouped two-two-three, straight, electric. Ostinato bass, quartal harmony that refuses to resolve, and a lead playing two-handed octaves over the top.',
  beatsPerBar: 3.5,
  beatUnit: 8,
  /** 2+2+3 eighths, in sixteenths. The defining fact about the style. */
  groups: [4, 4, 6],
  bpm: [132, 196],
  swing: 0,
  hook: 'through',
  /**
   * Free, for the same reason bebop is. The vocabulary here is the altered
   * scale, the chromatic sidestep and the fourth stacked on a fourth; the rules
   * exist to police exactly those, and policing them produces a fusion line
   * with the fusion taken out.
   */
  strictness: 'free',
  /**
   * The other half of the experiment, and deliberately the opposite case: a
   * straight-eighths electric band in seven, where the blues is a swung acoustic
   * one in four. If `pocket` is genuinely genre-neutral it should read as the
   * same gesture under both, and if it only works under the shuffle then it is a
   * jazz field wearing a neutral name.
   *
   * **And the only style in the catalogue that may play `funk`.** One style, on
   * purpose: funk is the feel that reads as a genre if it is overused, so it
   * ships where it can be listened to rather than spread across the four styles
   * it would flatter. A straight sixteenth grid is what the stabs and the ghosts
   * are made of, and a swung style handed the same numbers would be a shuffle
   * with the eighths chopped out of it. The bar being 2+2+3 rather than
   * four-four is a feature of the test and not an obstacle: it is what forced
   * `funk`'s accent array to say something metre-neutral instead of quietly
   * asserting a backbeat.
   *
   * ## And it is the wrong style, for a reason worth writing down
   *
   * **Fusion has no comp layer.** It is two-handed: the comping is the lead's
   * left hand, `generateLeftHand` writes it into the `melody` track, and a feel
   * may not touch that track because it was auditioned. Over six seeds this
   * style produces zero notes on `comp`, and so do `trio` and `odd` for the same
   * reason.
   *
   * So what fusion receives from `funk` is the push, the accent and the ghosts —
   * measured over twelve songs: bass 11.2 ms in front, snare 18.0 ms behind,
   * hats level, bass duration 0.69 → 0.33 beats, 1854 bass ghosts and 892 snare
   * ghosts added, all under a fifth of the level around them. That is a real
   * gesture and it is a good one. It is not the stabs, and the stabs are what
   * the word funk is doing in the name.
   *
   * Left as it is rather than moved, because "ship it on one style and listen"
   * is the instruction and this is the style named. The listening will show it.
   * The style that would show the whole feel is `blues` or `swing` — both have a
   * comp — and neither is straight, which is the other half of what funk wants.
   * The catalogue currently has no straight style with a comp layer.
   *
   * Straight still leads, and pocket and funk are level behind it, because the
   * point of a table is that the sections differ from each other. A table with
   * funk at the top would be a style change wearing a per-section draw.
   */
  feels: [['straight', 5], ['pocket', 3], ['funk', 3]],
  /**
   * …and the only style in the catalogue whose band does anything at a seam. See
   * `generate/transition.ts`.
   *
   * One style, on the same instruction `funk` above shipped under: ship it where
   * it can be listened to, then widen. Fusion is the right one and not merely
   * the available one — the bar is 2+2+3, so a shot here exercises the
   * metre-derived figure in the case that most needs it. A generic table would
   * put the band on slots 0 and 8 of a fourteen-slot bar, which is the middle of
   * the third group and the last place anybody accents; the grouping puts them
   * on 0, 4 and 8, which is the character of the bar. A break in seven is worth
   * hearing for the opposite reason: nothing about stopping is metre-specific,
   * so if it reads here it reads anywhere.
   *
   * **The plan's own numbers, less the kind that is not built.** The table there
   * is `fill 5, shot 3, break 2, elide 2`; `elide` is missing rather than
   * re-weighted, because drawing it would take the drummer's fill away — the
   * veto reads the *kind*, not whether anything was played — and put nothing in
   * its place. The remaining three keep their weights against each other, so
   * adding `break` costs `shot` a fifth of its draws and nothing else moves.
   *
   * **And no `shots` table**, deliberately. Authoring one here would be the
   * feature shipping with its fallback never having sounded, and the fallback is
   * the reason the other seventeen styles can opt in without eighteen tables
   * being written first. If the derived figure is wrong anywhere it is wrong
   * here, in seven, where it is loudest.
   */
  transitions: [['fill', 5], ['shot', 3], ['break', 2]],
  modeWeights: { minor: 0.72, major: 0.28 },
  relativeMajorChorus: 0,
  twoHanded: {
    instruments: [['epiano1', 6], ['epiano2', 3], ['piano', 3], ['vibraphone', 2]],
    density: 0.8,
    /**
     * Unison first, which is the one place in the catalogue where it should be.
     * A fusion head *is* the two hands playing the same line an octave apart;
     * the comping modes are what happens between heads.
     */
    modes: [['unison', 6], ['ostinato', 4], ['block', 3], ['answer', 2]],
    /**
     * Five slots against a fourteen-slot bar: the figure returns to the downbeat
     * once every five bars and lands somewhere new in between. Short and
     * insistent, because a vamp under a busy right hand is a pulse rather than
     * a part.
     */
    ostinato: {
      cycle: 5,
      hits: [
        { at: 0, dur: 2, vel: 0.5 },
        { at: 3, dur: 2, vel: 0.4 },
      ],
    },
  },
  excludeLayers: ['comp', 'brass'],
  requireLayers: ['melody'],
  /**
   * Suspended, quartal and modal — harmony that provides a *place* rather than a
   * direction. Seven eighths is already asking the listener to count; a
   * functional progression underneath would be a second thing happening, and the
   * records this comes from all made the same choice.
   */
  progressions: {
    intro: [
      { chords: ['i11', 'i11', 'i11', 'i11'], weight: 5 },
      { chords: ['i11', 'i11', 'bIImaj9', 'i11'], weight: 2 },
    ],
    verse: [
      { chords: ['i11', 'i11', 'i11', 'i11', 'i11', 'i11', 'iv11', 'iv11'], weight: 5, note: 'Six bars of one chord and a lift: the vamp is the form' },
      { chords: ['i11', 'i11', 'bVII7', 'bVII7', 'bVImaj9', 'bVImaj9', 'V7#9', 'V7#9'], weight: 4, note: 'The descending tetrachord as a vamp rather than as a cadence' },
      { chords: ['i9', 'i9', 'iv11', 'iv11', 'bIImaj9', 'bIImaj9', 'i9', 'V7#9'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv11', 'iv11', 'bVIImaj9', 'bVIImaj9', 'i11', 'i11', 'i11', 'V7#9'], weight: 4 },
      { chords: ['bVImaj9', 'bVImaj9', 'bVII7', 'bVII7', 'i11', 'i11', 'i11', 'i11'], weight: 4 },
    ],
    bridge: [
      { chords: ['bIImaj9', 'bIImaj9', 'bVImaj9', 'bVImaj9', 'iv11', 'iv11', 'V7#9', 'V7#9'], weight: 4, note: 'Semitone sidestep and back — the fusion way out of a vamp' },
    ],
    solo: [
      { chords: ['i11', 'i11', 'i11', 'i11', 'i11', 'i11', 'iv11', 'iv11'], weight: 5 },
      { chords: ['i11', 'i11', 'bVII7', 'bVII7', 'bVImaj9', 'bVImaj9', 'V7#9', 'V7#9'], weight: 4 },
    ],
    outro: [
      { chords: ['iv11', 'i11', 'i11', 'i11'], weight: 4 },
    ],
  },
  majorProgressions: {
    intro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 4 }],
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9'], weight: 5 },
      { chords: ['Imaj9', 'Imaj9', 'bVIImaj9', 'bVIImaj9', 'IVmaj9', 'IVmaj9', 'V7sus4', 'V7sus4'], weight: 4 },
    ],
    chorus: [
      { chords: ['IVmaj9', 'IVmaj9', 'bVIImaj9', 'bVIImaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'V7sus4'], weight: 4 },
      { chords: ['Imaj9', 'II7', 'IVmaj9', 'bVII7', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 3 },
    ],
    bridge: [{ chords: ['bIImaj9', 'bIImaj9', 'bVImaj9', 'bVImaj9', 'IVmaj9', 'IVmaj9', 'V7sus4', 'V7sus4'], weight: 4 }],
    solo: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
    outro: [{ chords: ['IVmaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 4 }],
  },
  /**
   * Fourteen sixteenths, and every one of these is a way of counting to seven.
   *
   * The straight ones spell 2+2+3 and the rest cut across it — a figure that
   * runs through slot 6 only sounds like anything because the kit is accenting
   * it. Written in sixteenths rather than eighths because at these tempos the
   * sixteenth is the fusion unit: this is the one style here whose melodies are
   * genuinely faster than its beat.
   */
  melodyCells: [
    { cell: [4, 4, 6], weight: 5 },
    { cell: [2, 2, 2, 2, 2, 2, 2], weight: 5 },
    { cell: [4, 2, 4, 2, 2], weight: 4 },
    { cell: [-2, 2, 2, 2, 2, 2, 2], weight: 4 },
    { cell: [6, 4, 4], weight: 4 },
    { cell: [3, 3, 4, 4], weight: 3 },
    { cell: [2, 4, 2, 4, 2], weight: 3 },
    { cell: [-4, 2, 4, 4], weight: 3 },
    { cell: [10, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [14], weight: 5 },
    { cell: [10, 4], weight: 3 },
    { cell: [-2, 12], weight: 3 },
    { cell: [6, 8], weight: 2 },
  ],
  bass: [
    /**
     * The riff, on the grouping: root, root, the fifth at the head of the long
     * group, and the flat seventh a tone *below* the root arriving under the
     * barline. This is what a fusion bassist plays and it is nothing like a
     * walk — it is a shape, re-rooted every time the harmony moves.
     *
     * **Written as intervals, which is the only spelling under which the
     * sentence above is true.** As chord functions the last note was `seventh`,
     * and this style's vamps run through `bIImaj9`, `bVImaj9` and `bVIImaj9`,
     * where the chord's seventh is *major*. The figure therefore came out a
     * semitone different in a third of the bars it played, which is not a
     * re-rooted shape — it is a second shape nobody wrote.
     *
     * The intervals are the ones the old spelling *sounded*, not a new line:
     * `nearestPc` put the fifth above the root and the seventh below it, so
     * `7` and `-2` are what a correct bar already played. Only the wrong bars
     * move. See `BassTone`.
     */
    { name: 'seven-riff', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 0.98 },
      { at: 4, dur: 3, tone: 0, vel: 0.86 },
      { at: 8, dur: 3, tone: 7, vel: 0.9 },
      { at: 12, dur: 2, tone: -2, vel: 0.8 },
    ] },
    { name: 'seven-octaves', weight: 4, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.98 },
      { at: 2, dur: 2, tone: 'octave', vel: 0.76 },
      { at: 4, dur: 2, tone: 'root', vel: 0.9 },
      { at: 6, dur: 2, tone: 'octave', vel: 0.74 },
      { at: 8, dur: 6, tone: 'fifth', vel: 0.86 },
    ] },
    /**
     * A three-slot figure — a dotted eighth — against a fourteen-slot bar. It
     * returns to the downbeat once every three bars, and in between the bass and
     * the kit are audibly counting different things. The oldest trick in
     * progressive rock and the one this engine could not do at all.
     */
    { name: 'dotted-drift', weight: 3, cycle: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.9 },
    ] },
  ],
  comp: [
    { name: 'unused', weight: 1, voices: 4, voicing: 'quartal', hits: [{ at: 6, dur: 4, vel: 0.45 }] },
  ],
  drums: [
    /**
     * The hat on the eighths, the kick and snare on the grouping. Every accent
     * here is on a slot `groups` calls a pulse, which is what makes fourteen
     * sixteenths audible as three beats instead of as a bar going wrong.
     */
    { name: 'seven-straight', weight: 6, voices: {
      hh: [0, 2, 4, 6, 8, 10, 12],
      bd: [0, 4],
      sd: [8],
    } },
    { name: 'seven-busy', weight: 5, voices: {
      hh: [0, 2, 4, 6, 8, 10, 12],
      bd: [0, 3, 8, 11],
      sd: [4, 8],
      rd: [0, 4, 8],
    } },
    /**
     * A four-slot ride under a fourteen-slot bar: two cycles that meet every
     * seven bars. The kick still spells the grouping underneath, because
     * something has to, and this is exactly the division of labour a fusion
     * drummer is doing when it sounds like they have grown an extra limb.
     */
    { name: 'ride-drift', weight: 3, cycle: 4, voices: {
      rd: [0, 2],
      hh: [0],
    } },
  ],
  melody: { leap: 0.4, ornament: 0.16, span: 24, sequence: 0.45, syncopation: 0.6 },
};

export const STYLES: Record<string, Style> = {
  swing, bebop, ballad, bossa, blues, modal, gypsy, trio, odd, fusion,
};
