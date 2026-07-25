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
  melody: { leap: 0.32, ornament: 0.3, span: 18, sequence: 0.3 },
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
  melody: { leap: 0.3, ornament: 0.4, span: 22, sequence: 0.25 },
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
  melody: { leap: 0.24, ornament: 0.18, span: 16, sequence: 0.4 },
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
  melody: { leap: 0.22, ornament: 0.2, span: 15, sequence: 0.42 },
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
  melody: { leap: 0.3, ornament: 0.32, span: 17, sequence: 0.45 },
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
  melody: { leap: 0.28, ornament: 0.24, span: 18, sequence: 0.38 },
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
  melody: { leap: 0.34, ornament: 0.36, span: 20, sequence: 0.35 },
};

export const STYLES: Record<string, Style> = {
  swing, bebop, ballad, bossa, blues, modal, gypsy,
};
