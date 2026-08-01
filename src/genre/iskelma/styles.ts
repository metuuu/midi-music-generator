/**
 * The iskelmä rhythm catalogue.
 *
 * Iskelmä is not one groove — it is the repertoire of the Finnish dance
 * pavilion, organised by dance. A band's set list rotates tango, humppa,
 * valssi, jenkka, foksi and a latin number, and each of those carries its own
 * tempo band, comping figure and harmonic habits. Modelling them as separate
 * styles (rather than as one "iskelmä" style with random parameters) is what
 * makes the output recognisable.
 *
 * Progressions are written as roman numerals relative to the *mode*, so in
 * A minor `VII` is G major and `VI` is F major — no flats needed.
 */

import type { Style } from '../../style/types.js';

/**
 * SUOMALAINEN TANGO — the centrepiece of the genre.
 *
 * The rules that separate it from Argentine tango, and which are enforced here:
 *  - It is almost always in a minor key. Argentine tango moves freely between
 *    major and minor; Finnish tango essentially does not.
 *  - Slower and heavier, with a squarer, more march-like bass than the
 *    syncopated Argentine feel.
 *  - The descending tetrachord i–VII–VI–V is its signature harmonic gesture.
 *  - Melodies are stepwise and end phrases on a long held note — the "kaipuu"
 *    (longing) note that the whole style is built around.
 */
const tango: Style = {
  id: 'tango',
  label: 'Tango (suomalainen tango)',
  description:
    'Slow, heavy, minor-key Finnish tango. Descending i–VII–VI–V bass, harmonic-minor dominants, long held phrase endings.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [96, 126],
  swing: 0,
  /**
   * The Finnish tango is a band's dance. Its whole character is rubato that a
   * preset pattern cannot bend to — the pull against the beat is the thing, and
   * a box holds the beat exactly, which is the one thing this must not do.
   */
  boxDrums: false,
  modeWeights: { minor: 0.94, major: 0.06 },
  relativeMajorChorus: 0.45,
  progressions: {
    intro: [
      { chords: ['i', 'VII', 'VI', 'V7'], weight: 4, note: 'Descending tetrachord — the tango calling card' },
      { chords: ['i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'VII', 'VI', 'V7', 'i', 'iv', 'V7', 'i'], weight: 5, note: 'Andalusian descent then a plagal-to-authentic close' },
      { chords: ['i', 'i', 'iv', 'iv', 'V7', 'V7', 'i', 'i'], weight: 4, note: 'The plainest tango frame' },
      { chords: ['i', 'iv', 'i', 'V7', 'i', 'iv', 'V7', 'i'], weight: 3 },
      { chords: ['i', 'V7/iv', 'iv', 'bII', 'V7', 'V7', 'i', 'i'], weight: 2, note: 'Neapolitan bII as a dramatic pre-dominant' },
      { chords: ['i', 'iv', 'VII', 'III', 'VI', 'iio', 'V7', 'i'], weight: 3, note: 'Circle of fifths through the relative major' },
      { chords: ['i', 'i', 'V7', 'V7', 'V7', 'V7', 'i', 'i'], weight: 2 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VI', 'VI', 'iv', 'iv', 'V7', 'V7'], weight: 4, note: 'Lift into the relative major, then fall back to minor' },
      { chords: ['i', 'VI', 'iv', 'V7', 'i', 'VI', 'V7', 'i'], weight: 4 },
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'III', 'V7'], weight: 3 },
      { chords: ['iv', 'V7', 'i', 'i', 'iv', 'V7', 'i', 'V7'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'i', 'i', 'V7/V', 'V7/V', 'V7', 'V7'], weight: 3, note: 'Secondary dominant winds the tension up before the last chorus' },
      { chords: ['VI', 'III', 'iv', 'i', 'iio', 'V7', 'i', 'i'], weight: 2 },
    ],
    outro: [
      { chords: ['iv', 'V7', 'i', 'i'], weight: 3 },
      { chords: ['i', 'VII', 'VI', 'V7', 'i', 'i'], weight: 2 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 5 }, // dotted quarter + eighth — the tango lilt
    { cell: [4, 2, 2, 8], weight: 4 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [-2, 2, 4, 4, 4], weight: 2 },
    { cell: [3, 1, 4, 4, 4], weight: 2 }, // dotted-sixteenth snap
    { cell: [2, 2, 2, 2, 8], weight: 2 },
    { cell: [12, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 }, // the held "kaipuu" note
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 3 },
    { cell: [4, 12], weight: 2 },
    { cell: [6, 2, 8], weight: 2 },
  ],
  bass: [
    { name: 'strong-beats', weight: 5, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 8, dur: 3, tone: 'root', vel: 0.85 },
    ] },
    { name: 'march-quarters', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.72 },
      { at: 8, dur: 3, tone: 'root', vel: 0.88 },
      { at: 12, dur: 3, tone: 'fifth', vel: 0.72 },
    ] },
    { name: 'root-fifth-approach', weight: 4, hits: [
      { at: 0, dur: 6, tone: 'root', vel: 1 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.8 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.75 },
    ] },
    { name: 'octave-drop', weight: 2, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 6, dur: 2, tone: 'octave', vel: 0.7 },
      { at: 8, dur: 3, tone: 'root', vel: 0.85 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.72 },
    ] },
  ],
  comp: [
    { name: 'backbeat-stabs', weight: 5, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.7 },
      { at: 12, dur: 3, vel: 0.7 },
    ] },
    { name: 'offbeat-eighths', weight: 3, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.55 },
      { at: 6, dur: 2, vel: 0.6 },
      { at: 10, dur: 2, vel: 0.55 },
      { at: 14, dur: 2, vel: 0.6 },
    ] },
    { name: 'sustained', weight: 3, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.5 }] },
    { name: 'half-note-pads', weight: 2, voices: 3, hits: [
      { at: 0, dur: 8, vel: 0.55 },
      { at: 8, dur: 8, vel: 0.5 },
    ] },
  ],
  drums: [
    { name: 'tango-light', weight: 5, voices: {
      bd: [0, 8],
      rim: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'tango-brush', weight: 4, voices: {
      bd: [0, 8],
      sd: [4, 12],
      hh: [2, 6, 10, 14],
    } },
    { name: 'tango-marcato', weight: 3, voices: {
      bd: [0, 4, 8, 12],
      rim: [12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  /**
   * The drag into the downbeat, which is what a tango *is*.
   *
   * `melody.syncopation` already says this about the tune — *"a tango pushes its
   * downbeats because that is what a tango is"* — and until now the rhythm
   * section underneath it could not join in. High, because on this style the
   * gesture is not a decoration.
   *
   * The comper joins at a lower weight. A tango's chords are stabs on the
   * offbeat and pushing one into the barline is the same gesture the bass is
   * making, which is the argument for it and also the argument for not matching
   * the weight: two players leaning on the same beat every phrase is one player
   * too many. `iskelmapop` is left bass-only on purpose, so there is something
   * to hear this against.
   */
  vary: { bass: 0.45, comp: 0.3 },
  /**
   * Two hands **if the palette happens to deal them**, which is the weaker claim
   * and the one that is true of this style.
   *
   * A humppa fixes its lead because a humppa without an accordion is a foxtrot.
   * A tango does not: the tune belongs to the accordion, the bandoneon, the tenor
   * saxophone or the strings depending on the night, and naming instruments here
   * would have delivered a genre of accordion tangos. What is true every time is
   * narrower and more useful — *on the nights it is the accordion, that
   * accordion plays its own bass and chords*, because a tanssilava accordionist
   * has never in the history of the form played the tune with one hand and left
   * the other in their lap. See `TwoHandedKeys.instruments`.
   *
   * `stride` leads, which in a tango is the left hand marking the beat under a
   * line that is deliberately behind it, and `answer` follows because a tango
   * melody leaves long holes and a bandoneon fills them. No `block`: locking the
   * hands together would square up exactly the rhythm this style bends.
   */
  twoHanded: {
    density: 0.7,
    modes: [['stride', 6], ['answer', 4]],
  },
  melody: { leap: 0.22, ornament: 0.14, span: 14, sequence: 0.42, syncopation: 0.55 },
};

/**
 * HUMPPA — fast, relentless, cheerful 2-feel.
 *
 * Written in 4/4 here with the oom-pah landing on the quarter note, which is
 * how it is actually charted. Harmony is deliberately simple and leans on
 * circle-of-fifths turnarounds (VI7–II7–V7–I) that let the accordion run.
 */
const humppa: Style = {
  id: 'humppa',
  label: 'Humppa',
  description:
    'Fast, cheerful oom-pah in a bright major key. Simple harmony with circle-of-fifths turnarounds; accordion carries the tune.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [132, 164],
  swing: 0,
  /**
   * No rhythm box, ever. A humppa is 132–164 bpm of oom-pah with a hall full of
   * people dancing to it, and what keeps them together is a drummer pushing —
   * the accordion states the tune and the kit does the driving. A preset box
   * plays one pattern at one weight and cannot push anything; the dance would
   * still be in time and would have nothing behind it.
   */
  boxDrums: false,
  // Humppa is relentless by design — the whole dance depends on the tune coming
  // round again without asking anyone to follow a development.
  hook: 'catchy',
  modeWeights: { minor: 0.12, major: 0.88 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [
      { chords: ['I', 'V7', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 5, note: 'The bluntest humppa frame — tonic and dominant, nothing else' },
      { chords: ['I', 'IV', 'I', 'V7', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'I7', 'IV', 'IV', 'I', 'V7', 'I', 'I'], weight: 3, note: 'I7 turns the tonic into a dominant of IV' },
      { chords: ['I', 'vi', 'ii', 'V7', 'I', 'vi', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['I', 'VI7', 'II7', 'V7', 'I', 'VI7', 'II7', 'V7'], weight: 5, note: 'Circle of fifths — the definitive humppa turnaround' },
      { chords: ['IV', 'IV', 'I', 'I', 'V7', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'IV', 'V7', 'V7', 'I', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['V7/V', 'V7/V', 'V7', 'V7', 'I', 'I', 'V7', 'I'], weight: 3 },
      { chords: ['IV', 'iv', 'I', 'VI7', 'II7', 'V7', 'I', 'I'], weight: 2, note: 'Borrowed minor iv for a moment of shade' },
    ],
    outro: [
      { chords: ['I', 'VI7', 'II7', 'V7', 'I', 'I'], weight: 3 },
      { chords: ['V7', 'V7', 'I', 'I'], weight: 2 },
    ],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 2, 2, 2, 2], weight: 5 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 2, 2, 4], weight: 4 },
    { cell: [4, 4, 2, 2, 4], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 2 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 3 },
    { cell: [3, 1, 2, 2, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 4 },
    { cell: [16], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'oom-pah', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.85 },
    ] },
    { name: 'oom-pah-quarters', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.8 },
      { at: 8, dur: 3, tone: 'root', vel: 0.9 },
      { at: 12, dur: 3, tone: 'fifth', vel: 0.8 },
    ] },
    { name: 'walking-ish', weight: 2, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 4, dur: 3, tone: 'third', vel: 0.78 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.85 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.78 },
    ] },
  ],
  comp: [
    { name: 'pah-on-2-4', weight: 6, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.8 },
      { at: 12, dur: 3, vel: 0.8 },
    ] },
    { name: 'pah-eighths', weight: 3, voices: 3, hits: [
      { at: 4, dur: 2, vel: 0.75 },
      { at: 6, dur: 2, vel: 0.6 },
      { at: 12, dur: 2, vel: 0.75 },
      { at: 14, dur: 2, vel: 0.6 },
    ] },
  ],
  drums: [
    { name: 'humppa-basic', weight: 5, voices: {
      bd: [0, 8],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'humppa-driving', weight: 3, voices: {
      bd: [0, 4, 8, 12],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  /**
   * The one iskelmä style whose lead is genuinely one player with two hands.
   *
   * A humppa accordionist is not a melody instrument with a rhythm section behind
   * it — the right hand states the tune and the left hand is on the button side
   * playing the same oom-pah the band is playing, which is why `HANDS.accordion`
   * voices a full triad low down rather than a rootless shell. Declaring it here
   * *fixes* the lead for every humppa, and that is the correct reading of this
   * style rather than a narrowing of it: the description above already says the
   * accordion carries the tune, and a humppa fronted by a muted trumpet is a foxtrot
   * with the wrong tempo.
   *
   * `stride` first, and by a distance, because in this style the two words mean the
   * same thing: the oom-pah *is* the left hand, bass button then chord button, and
   * for as long as this table said `block` the accordionist was hitting the chord
   * with the tune and never once playing the bass note the dance is counted on.
   * `block` and `answer` stay as the other two things the same player does — a
   * chorus where the hands lock together, a bar where the left one answers a held
   * note — but they are what the style does *between* oom-pahs.
   *
   * No `unison`: two hands an octave apart is a virtuoso's gesture and this style's
   * left hand has a job to do. No `ostinato`: the left hand is the oom-pah, and an
   * oom-pah that ignores the harmony is a drone.
   */
  twoHanded: {
    instruments: [['accordion', 7], ['bandoneon', 3]],
    // High, because the button side plays on nearly every beat of a humppa. What
    // takes chords away is the right hand being busy, not this number being low.
    density: 0.85,
    modes: [['stride', 7], ['block', 3], ['answer', 2]],
  },
  melody: { leap: 0.3, ornament: 0.2, span: 12, sequence: 0.5, syncopation: 0.12 },
};

/**
 * VALSSI — Finnish waltz, in 3/4.
 *
 * Splits fairly evenly between major and minor; the minor ones are among the
 * most melancholy things in the repertoire. Bass on beat 1, chords on 2 and 3.
 */
const valssi: Style = {
  id: 'valssi',
  label: 'Valssi (waltz)',
  description:
    'Finnish waltz in 3/4. Bass on one, chords on two and three. Splits between wistful minor and warm major.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [150, 190],
  swing: 0,
  /**
   * A rhythm box has a *Waltz* button, and that is precisely the trap. The
   * preset is a metronome in three; a pavilion valssi lives on the lift into
   * the downbeat, which is a drummer listening to a room.
   */
  boxDrums: false,
  modeWeights: { minor: 0.58, major: 0.42 },
  relativeMajorChorus: 0.35,
  progressions: {
    intro: [
      { chords: ['i', 'V7', 'V7', 'i'], weight: 3 },
      { chords: ['i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'V7', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['i', 'iv', 'V7', 'i', 'VI', 'VII', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'V7', 'i', 'iv', 'V7', 'i'], weight: 3 },
      { chords: ['i', 'V7', 'i', 'i', 'iv', 'V7', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VII', 'VII', 'VI', 'VI', 'V7', 'V7'], weight: 4 },
      { chords: ['i', 'VI', 'iv', 'V7', 'i', 'VI', 'V7', 'i'], weight: 4 },
      { chords: ['iv', 'i', 'V7', 'i', 'iv', 'i', 'V7', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['VI', 'VI', 'iv', 'iv', 'V7/V', 'V7/V', 'V7', 'V7'], weight: 3 },
    ],
    outro: [
      { chords: ['iv', 'V7', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'IV', 'V7', 'I', 'VI7', 'II7', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'ii', 'V7', 'I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V7', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'VI7', 'II7', 'V7', 'I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['IV', 'iv', 'I', 'VI7', 'II7', 'V7', 'I', 'I'], weight: 3 },
    ],
    outro: [{ chords: ['IV', 'V7', 'I', 'I'], weight: 3 }],
  },
  melodyCells: [
    { cell: [4, 4, 4], weight: 5 },
    { cell: [8, 4], weight: 4 },
    { cell: [4, 2, 2, 4], weight: 3 },
    { cell: [-4, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 4], weight: 3 },
    { cell: [6, 2, 4], weight: 3 },
    { cell: [12], weight: 2 },
    { cell: [4, 4, 2, 2], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 5 },
    { cell: [8, 4], weight: 3 },
    { cell: [4, 8], weight: 2 },
  ],
  bass: [
    { name: 'waltz-one', weight: 6, hits: [{ at: 0, dur: 3, tone: 'root', vel: 1 }] },
    { name: 'waltz-one-five', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'two-three', weight: 6, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.7 },
      { at: 8, dur: 3, vel: 0.65 },
    ] },
    { name: 'sustained', weight: 2, voices: 4, hits: [{ at: 0, dur: 12, vel: 0.5 }] },
  ],
  drums: [
    { name: 'waltz-light', weight: 5, voices: { bd: [0], sd: [4, 8], hh: [0, 4, 8] } },
    { name: 'waltz-brush', weight: 3, voices: { bd: [0], hh: [0, 2, 4, 6, 8, 10] } },
  ],
  /**
   * Oom-pah-pah, which is the same left hand as the humppa's with one more chord
   * in it and is the reason `stride` reads the metre rather than a fixed pattern.
   * A waltz bass takes the downbeat and the two chords take the rest; the bass
   * note itself walks root, fifth, root across bars rather than resetting, which
   * is the difference between a waltz and a metronome with a chord on it.
   */
  twoHanded: {
    density: 0.8,
    modes: [['stride', 7], ['answer', 3]],
  },
  melody: { leap: 0.2, ornament: 0.16, span: 14, sequence: 0.45, syncopation: 0.18 },
};

/**
 * JENKKA — bouncy Finnish schottische.
 *
 * Notated here in 4/4 at a brisk tempo; the bounce comes from dotted-eighth /
 * sixteenth cells rather than from the meter.
 */
const jenkka: Style = {
  id: 'jenkka',
  label: 'Jenkka (schottische)',
  description:
    'Brisk, bouncy schottische. Dotted rhythms drive it; harmony stays close to tonic and dominant.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [140, 170],
  swing: 0,
  /**
   * As humppa, and more so: at 140–170 with the dotted figure doing the work,
   * the bounce *is* the drummer. See `boxDrums` there.
   */
  boxDrums: false,
  modeWeights: { minor: 0.14, major: 0.86 },
  relativeMajorChorus: 0,
  progressions: {
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'I', 'V7', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'V7', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V7', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'VI7', 'II7', 'V7', 'I', 'IV', 'V7', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['V7/V', 'V7/V', 'V7', 'V7', 'I', 'I', 'V7', 'I'], weight: 3 }],
    outro: [{ chords: ['V7', 'V7', 'I', 'I'], weight: 3 }],
  },
  melodyCells: [
    { cell: [3, 1, 4, 3, 1, 4], weight: 5 }, // the schottische snap
    { cell: [3, 1, 4, 4, 4], weight: 4 },
    { cell: [4, 4, 3, 1, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 2 },
    { cell: [6, 2, 3, 1, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [16], weight: 2 },
  ],
  bass: [
    { name: 'two-feel', weight: 5, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.85 },
    ] },
    { name: 'quarters', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.75 },
      { at: 8, dur: 3, tone: 'root', vel: 0.88 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.75 },
    ] },
  ],
  comp: [
    { name: 'offbeats', weight: 5, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.78 },
      { at: 12, dur: 3, vel: 0.78 },
    ] },
    { name: 'offbeat-eighths', weight: 3, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.6 },
      { at: 6, dur: 2, vel: 0.68 },
      { at: 10, dur: 2, vel: 0.6 },
      { at: 14, dur: 2, vel: 0.68 },
    ] },
  ],
  drums: [
    { name: 'jenkka', weight: 5, voices: {
      bd: [0, 8], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  /**
   * The bounciest oom-pah in the genre, and the least interested in comping.
   * A schottische left hand does one thing very fast for the length of the tune,
   * which is why `stride` takes almost the whole table here.
   */
  twoHanded: {
    density: 0.85,
    modes: [['stride', 8], ['block', 2]],
  },
  melody: { leap: 0.28, ornament: 0.22, span: 12, sequence: 0.5, syncopation: 0.3 },
};

/**
 * FOKSI — the Finnish take on foxtrot / slow fox.
 *
 * The "sophisticated" slot in a dance set: lightly swung, jazzier harmony with
 * ii–V motion, secondary dominants and sixth chords. Vibraphone, muted trumpet
 * and jazz guitar live here.
 */
const foksi: Style = {
  /**
   * A foxtrot bass turning the phrase over, which is what the style is for.
   *
   * The same instinct `feels: [['straight', 6], ['pocket', 4]]` below already
   * declares — this band leans — carried from *how* it plays into *what* it
   * plays at the phrase end. Both its bass figures can take the gesture.
   *
   * `humppa`, `jenkka` and `beguine` are deliberately absent despite being just
   * as eligible: the first two are relentless on purpose and the third's bass is
   * the 3-3-2 itself, where a push blurs the figure the style is named after.
   */
  vary: { bass: 0.3 },
  id: 'foksi',
  label: 'Foksi (foxtrot)',
  description:
    'Lightly swung foxtrot. Jazzier harmony — ii–V motion, secondary dominants, sixth chords on the tonic.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [100, 128],
  swing: 0.16,
  /**
   * The claim being tested, said out loud: **`pocket` under a foksi and `pocket`
   * under a jazz blues are the same object with the same numbers in it.** If a
   * feel is genre-neutral then this costs nothing to write and sounds like a
   * tanssilava band; if it is not, then `pocket` is a jazz field that was given
   * a neutral name, and this is where that shows.
   *
   * It holds. Bass twelve milliseconds in front and the backbeat eighteen
   * behind is a description of players and not of an idiom — a foksi rhythm
   * section is a bass, a comping keyboard and a kit playing a light shuffle, and
   * it leans exactly like the acoustic quartet under a blues does. Measured over
   * twelve songs the offsets come out where they do under jazz, to the
   * millisecond, because the numbers are in milliseconds and nothing about them
   * consults the style.
   *
   * Foksi rather than humppa or jenkka on purpose, and the difference is the
   * useful part of the result. Foksi is the iskelmä style with jazz harmony and
   * a light swing already in it, so it is the one where a pocket has somewhere
   * to sit. A humppa is a march played at 200 with the whole band on the
   * quarter; leaning the bass in front of that would not be a groove, it would
   * be the band coming apart, which is why humppa's answer to this question is
   * still to say nothing.
   */
  feels: [['straight', 6], ['pocket', 4]],
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0.2,
  progressions: {
    verse: [
      { chords: ['I6', 'vi', 'ii7', 'V7', 'I6', 'vi', 'ii7', 'V7'], weight: 5, note: 'The rhythm-changes-adjacent turnaround at the heart of foxtrot' },
      { chords: ['I', 'VI7', 'ii7', 'V7', 'iii', 'VI7', 'ii7', 'V7'], weight: 4 },
      { chords: ['I', 'I7', 'IV', 'iv', 'I', 'V7', 'I', 'I'], weight: 3, note: 'Borrowed minor iv — the classic wistful sidestep' },
      { chords: ['I', 'ii7', 'V7', 'I', 'IV', 'iv', 'I', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'iv', 'I6', 'VI7', 'ii7', 'V7', 'I6', 'I6'], weight: 4 },
      { chords: ['I6', 'IV', 'iii', 'VI7', 'ii7', 'V7', 'I6', 'V7'], weight: 4 },
      { chords: ['ii7', 'V7', 'I6', 'I6', 'ii7', 'V7', 'I6', 'V7'], weight: 3 },
    ],
    bridge: [
      { chords: ['III7', 'III7', 'VI7', 'VI7', 'II7', 'II7', 'V7', 'V7'], weight: 4, note: 'Full circle-of-fifths bridge' },
    ],
    outro: [{ chords: ['ii7', 'V7', 'I6', 'I6'], weight: 3 }],
  },
  majorProgressions: {},
  melodyCells: [
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [4, 4, 2, 2, 2, 2], weight: 3 },
    { cell: [2, 2, 2, 2, 2, 2, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 2 },
    { cell: [-4, 2, 2, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
    { cell: [-4, 12], weight: 2 },
  ],
  bass: [
    { name: 'walking', weight: 5, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 4, dur: 3, tone: 'third', vel: 0.78 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.85 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.78 },
    ] },
    { name: 'two-feel', weight: 4, hits: [
      { at: 0, dur: 6, tone: 'root', vel: 1 },
      { at: 8, dur: 6, tone: 'fifth', vel: 0.82 },
    ] },
  ],
  comp: [
    { name: 'charleston', weight: 4, voices: 4, hits: [
      { at: 0, dur: 3, vel: 0.7 },
      { at: 6, dur: 3, vel: 0.62 },
    ] },
    { name: 'backbeat', weight: 4, voices: 4, hits: [
      { at: 4, dur: 3, vel: 0.68 },
      { at: 12, dur: 3, vel: 0.68 },
    ] },
    { name: 'sustained', weight: 2, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.45 }] },
  ],
  drums: [
    { name: 'brush-swing', weight: 5, voices: {
      bd: [0, 8], sd: [4, 12], hh: [0, 3, 4, 7, 8, 11, 12, 15],
    } },
    { name: 'ride-feel', weight: 3, voices: {
      bd: [0], rim: [4, 12], rd: [0, 3, 4, 7, 8, 11, 12, 15],
    } },
  ],
  /**
   * A slow fox is the one style here where the three things are genuinely even.
   * The bass-chord alternation is the dance's own pulse, the left hand answers
   * across the long held notes the tempo leaves room for, and locking the hands
   * together is what a pianist does to push into the last chorus.
   */
  twoHanded: {
    density: 0.65,
    modes: [['stride', 4], ['answer', 4], ['block', 3]],
  },
  melody: { leap: 0.26, ornament: 0.24, span: 15, sequence: 0.35, syncopation: 0.45 },
};

/**
 * BEGUINE — the latin-flavoured iskelmä that the preset rhythm boxes made
 * ubiquitous on 60s and 70s Finnish records.
 *
 * The bass is the giveaway: dotted-quarter, dotted-quarter, quarter.
 */
const beguine: Style = {
  id: 'beguine',
  label: 'Beguine / rumba',
  description:
    'Latin-flavoured iskelmä from the preset-rhythm-box era. Dotted 3-3-2 bass, offbeat comping, gentle tempo.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [108, 132],
  swing: 0,
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0.4,
  progressions: {
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'V7', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'V7', 'i', 'VII', 'VI', 'V7'], weight: 4 },
      { chords: ['i', 'VI', 'iio', 'V7', 'i', 'VI', 'iio', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'VI', 'iio', 'V7', 'III', 'VI', 'V7', 'i'], weight: 4 },
      { chords: ['iv', 'V7', 'III', 'VI', 'iio', 'V7', 'i', 'i'], weight: 3 },
      { chords: ['i', 'VI', 'iv', 'V7', 'i', 'VI', 'V7', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'iio', 'iio', 'V7/V', 'V7/V', 'V7', 'V7'], weight: 3 }],
    outro: [{ chords: ['iv', 'V7', 'i', 'i'], weight: 3 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'ii7', 'V7', 'I', 'vi', 'ii7', 'V7'], weight: 4 },
      { chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'ii7', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'VI7', 'ii7', 'V7', 'I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'ii7', 'ii7', 'V7/V', 'V7/V', 'V7', 'V7'], weight: 3 }],
    outro: [{ chords: ['IV', 'V7', 'I', 'I'], weight: 3 }],
  },
  melodyCells: [
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [-2, 2, 4, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [6, 6, 4], weight: 4 }, // mirrors the 3-3-2 bass
    { cell: [2, 2, 2, 2, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 2 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [6, 6, 4], weight: 3 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    { name: 'beguine-332', weight: 6, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 1 },
      { at: 6, dur: 5, tone: 'fifth', vel: 0.82 },
      { at: 12, dur: 3, tone: 'root', vel: 0.85 },
    ] },
    { name: 'beguine-simple', weight: 3, hits: [
      { at: 0, dur: 6, tone: 'root', vel: 1 },
      { at: 8, dur: 6, tone: 'fifth', vel: 0.8 },
    ] },
  ],
  comp: [
    { name: 'offbeat-comp', weight: 5, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.62 },
      { at: 6, dur: 2, vel: 0.7 },
      { at: 10, dur: 2, vel: 0.62 },
      { at: 14, dur: 2, vel: 0.7 },
    ] },
    { name: 'stab-2-4', weight: 3, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.7 },
      { at: 12, dur: 3, vel: 0.7 },
    ] },
  ],
  drums: [
    { name: 'beguine', weight: 5, voices: {
      bd: [0, 6, 12], rim: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'rumba', weight: 3, voices: {
      bd: [0, 6, 12], perc: [2, 6, 10, 14], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  /**
   * The one style in the genre whose left hand is *not* an oom-pah.
   *
   * A beguine's pulse is already carried by the bass and the rim, and a bass
   * note on one and three over the top of it flattens exactly the syncopation
   * the dance is made of. So no `stride` here — the same accordion that strides
   * through a jenkka comps through a beguine, which is the point of drawing the
   * mode per style rather than per instrument.
   */
  twoHanded: {
    density: 0.6,
    modes: [['answer', 6], ['block', 4]],
  },
  melody: { leap: 0.24, ornament: 0.18, span: 14, sequence: 0.4, syncopation: 0.6 },
};

/**
 * ISKELMÄPOP — the 1980s radio sound.
 *
 * Straight eighths, drum machine, synth strings, electric bass. Harmonically
 * this is where iskelmä meets aeolian pop loops (i–VII–VI–VII) and where the
 * final-chorus key change becomes almost obligatory.
 */
const iskelmapop: Style = {
  id: 'iskelmapop',
  label: 'Iskelmäpop (1980s)',
  description:
    '1980s radio iskelmä. Straight eighths, drum machine, synth strings. Aeolian verse loops lifting into a relative-major chorus.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [100, 126],
  swing: 0,
  // Radio pop, and unembarrassed about it: the chorus is a fixed tune with a
  // fixed rhythm, and the key change exists to deliver it one more time a tone
  // higher. This is the style the hook axis was written for.
  hook: 'catchy',
  modeWeights: { minor: 0.68, major: 0.32 },
  relativeMajorChorus: 0.7,
  progressions: {
    intro: [
      { chords: ['i', 'VII', 'VI', 'VII'], weight: 4 },
      { chords: ['VI', 'VII', 'i', 'i'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 5, note: 'The aeolian pop loop that defines 80s minor-key iskelmä' },
      { chords: ['i', 'i', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'III', 'VII'], weight: 4 },
      { chords: ['i', 'iv', 'VI', 'V7', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'III', 'VII', 'i', 'VI', 'III', 'VII', 'i'], weight: 5, note: 'VI–III–VII–i: the big singable 80s chorus' },
      { chords: ['III', 'VII', 'iv', 'VI', 'III', 'VII', 'V7', 'V7'], weight: 4 },
      { chords: ['VI', 'VII', 'III', 'III', 'VI', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'iv', 'V7'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'V7', 'V7'], weight: 4 },
      { chords: ['VI', 'VII', 'i', 'i', 'iv', 'V7', 'i', 'V7'], weight: 3 },
    ],
    outro: [
      { chords: ['VI', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'vi', 'IV'], weight: 5 },
      { chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'IV', 'V'], weight: 4 },
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'I', 'vi', 'IV', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'IV'], weight: 4 },
    ],
    bridge: [{ chords: ['vi', 'vi', 'IV', 'IV', 'ii', 'ii', 'V', 'V'], weight: 3 }],
    outro: [{ chords: ['IV', 'V', 'I', 'I'], weight: 3 }],
  },
  melodyCells: [
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [3, 1, 4, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 3 },
    { cell: [-4, 12], weight: 2 },
  ],
  bass: [
    { name: 'eighth-drive', weight: 5, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 },
      { at: 2, dur: 2, tone: 'root', vel: 0.7 },
      { at: 4, dur: 2, tone: 'root', vel: 0.82 },
      { at: 6, dur: 2, tone: 'root', vel: 0.7 },
      { at: 8, dur: 2, tone: 'root', vel: 0.88 },
      { at: 10, dur: 2, tone: 'root', vel: 0.7 },
      { at: 12, dur: 2, tone: 'fifth', vel: 0.82 },
      { at: 14, dur: 2, tone: 'approach', vel: 0.72 },
    ] },
    { name: 'root-octave', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 6, dur: 2, tone: 'octave', vel: 0.72 },
      { at: 8, dur: 3, tone: 'root', vel: 0.88 },
      { at: 14, dur: 2, tone: 'fifth', vel: 0.72 },
    ] },
    { name: 'sustained-root', weight: 3, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.95 },
      { at: 8, dur: 7, tone: 'root', vel: 0.85 },
    ] },
  ],
  comp: [
    { name: 'epiano-offbeats', weight: 5, voices: 4, hits: [
      { at: 2, dur: 2, vel: 0.6 },
      { at: 6, dur: 2, vel: 0.68 },
      { at: 10, dur: 2, vel: 0.6 },
      { at: 14, dur: 2, vel: 0.68 },
    ] },
    { name: 'stab-backbeat', weight: 4, voices: 4, hits: [
      { at: 4, dur: 3, vel: 0.72 },
      { at: 12, dur: 3, vel: 0.72 },
    ] },
    { name: 'whole-bar', weight: 3, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.5 }] },
  ],
  drums: [
    { name: 'linn-backbeat', weight: 5, voices: {
      bd: [0, 10], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'linn-clap', weight: 4, voices: {
      bd: [0, 8], sd: [4, 12], cp: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'sixteenth-hats', weight: 3, voices: {
      bd: [0, 10], sd: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    } },
  ],
  /**
   * A bass guitar turning a phrase over, which is most of what an eighties
   * arrangement does to keep eight bars of one figure from being eight bars of
   * one figure. Lower than the tango's: here it is a detail rather than the
   * subject.
   */
  vary: { bass: 0.3 },
  /**
   * A radio-era electric piano has the same two hands the accordion had, and it
   * uses them the way the decade did: chords with the line, or in the holes.
   * `stride` is on the table but last — an eighties arrangement reaches for it
   * as a period gesture rather than as the way the song is held together, and
   * the bass guitar has the root either way.
   */
  twoHanded: {
    density: 0.6,
    modes: [['block', 5], ['answer', 4], ['stride', 2]],
  },
  melody: { leap: 0.24, ornament: 0.12, span: 14, sequence: 0.5, syncopation: 0.4 },
};

export const STYLES: Record<string, Style> = {
  tango,
  humppa,
  valssi,
  jenkka,
  foksi,
  beguine,
  iskelmapop,
};

export const STYLE_IDS = Object.keys(STYLES);

export function getStyle(id: string): Style {
  const s = STYLES[id];
  if (!s) throw new Error(`Unknown style "${id}". Known: ${STYLE_IDS.join(', ')}`);
  return s;
}
