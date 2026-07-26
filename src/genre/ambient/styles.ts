/**
 * The ambient catalogue.
 *
 * Organised by *what the music is made of* rather than by feel or by dance,
 * because ambient has no shared repertoire to sort — there is no standard, no
 * dance floor and no chorus. What distinguishes one kind from another is
 * material: a tape loop, a drone, a sequencer, a choir, a dub chord.
 *
 * Four things separate these tables from every other genre here, and they
 * matter far more than any individual progression:
 *
 *  - **Harmony barely moves.** A progression here is usually two chords across
 *    eight bars, and often one. The interest has to come from register,
 *    texture and layering, which is why the arrangement rules do more work in
 *    this genre than the harmony does.
 *  - **There is no dominant.** `V` is almost entirely absent, and where a
 *    chord on the fifth appears it is minor. A leading tone creates a pull
 *    toward resolution, and the whole proposition of the idiom is that nothing
 *    resolves. This is asserted deliberately, the way bossa nova's `swing: 0`
 *    is.
 *  - **Sustain is the instrument.** The bass pedals rather than pulses and the
 *    pad merges across repeated harmony — hence `sustain` on the bass patterns
 *    and `requireLayers: ['pad']` on every style. The pad is the piece.
 *  - **Nothing announces itself.** Every style sets `drumFills: false`. A tom
 *    roll into a crash is how a dance band signposts the next section; ambient
 *    sections are supposed to arrive without being noticed.
 */

import type { Style } from '../../style/types.js';

/**
 * HAUNTOLOGY — the Boards of Canada sound.
 *
 * Warm, tape-degraded, and nostalgic for something that never happened. The
 * harmony is plagal and modal-mixture: IV to I rather than V to I, ♭VII and
 * ♭VI borrowed freely into major, and the melody kept childlike — small span,
 * few notes, and the same figure again and again.
 *
 * The one style here with a real beat, and it lopes: a light swing, a kick
 * pushed off the grid, and a snare that arrives late enough to sound tired.
 */
const hauntology: Style = {
  id: 'hauntology',
  label: 'Hauntology',
  description:
    'Warm tape-degraded analogue. Plagal, mode-mixture harmony, a childlike melody, and a dusty half-time beat that lopes.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [68, 96],
  // Not straight, and not swing either. Enough to pull the offbeats late so the
  // beat drags behind itself — which is most of why this music sounds like a
  // worn cassette rather than a sequencer.
  swing: 0.15,
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0,
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  counterSpacing: 1,
  progressions: {
    intro: [
      { chords: ['IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'], weight: 3 },
    ],
    verse: [
      { chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7'], weight: 5, note: 'Plagal rocking — the tonic and its fourth, and no dominant anywhere' },
      { chords: ['vi7', 'vi7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['Imaj7', 'Imaj7', 'bVIImaj7', 'bVIImaj7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7'], weight: 4, note: 'The borrowed ♭VII: major with a flat seventh, which is mixolydian and reads as warmth rather than as a change of key' },
      { chords: ['Imaj7', 'iii7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'iii7', 'vi7', 'vi7'], weight: 3 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'IVmaj7', 'bVImaj7', 'bVImaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'], weight: 5, note: 'The ♭VI borrowed out of the parallel minor — the single most recognisable move in this music' },
      { chords: ['vi7', 'vi7', 'IVmaj7', 'IVmaj7', 'Isus2', 'Isus2', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9'], weight: 3 },
    ],
    bridge: [
      { chords: ['bVImaj7', 'bVImaj7', 'bVIImaj7', 'bVIImaj7', 'vi7', 'vi7', 'IVmaj7', 'IVmaj7'], weight: 4 },
      { chords: ['ii7', 'ii7', 'IVmaj7', 'IVmaj7', 'vi7', 'vi7', 'Imaj7', 'Imaj7'], weight: 3 },
    ],
    outro: [
      { chords: ['IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 3 },
    ],
  },
  minorProgressions: {
    intro: [
      { chords: ['i9', 'i9', 'VI', 'VI'], weight: 4 },
      { chords: ['i9', 'i9', 'i9', 'i9'], weight: 3 },
    ],
    verse: [
      { chords: ['i9', 'i9', 'VI', 'VI', 'i9', 'i9', 'VI', 'VI'], weight: 5 },
      { chords: ['i9', 'i9', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4, note: 'Aeolian rocking with no leading tone — VII is the natural seventh, a whole tone below the tonic' },
      { chords: ['i7', 'i7', 'III', 'III', 'VII', 'VII', 'VI', 'VI'], weight: 4 },
      { chords: ['i9', 'i9', 'IV', 'IV', 'i9', 'i9', 'IV', 'IV'], weight: 3, note: 'The major IV in a minor key is the dorian ♮6 — brighter than aeolian without leaving the mode' },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'III', 'III', 'VII', 'VII', 'i9', 'i9'], weight: 5, note: 'Out through the relative major and back, without ever touching a dominant' },
      { chords: ['iv9', 'iv9', 'VI', 'VI', 'i9', 'i9', 'i9', 'i9'], weight: 4 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i9', 'i9', 'i9', 'i9'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv9', 'iv9', 'iv9', 'iv9', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
      { chords: ['III', 'III', 'VII', 'VII', 'iv9', 'iv9', 'i9', 'i9'], weight: 3 },
    ],
    outro: [
      { chords: ['VI', 'VI', 'i9', 'i9'], weight: 4 },
      { chords: ['i9', 'i9', 'i9', 'i9'], weight: 3 },
    ],
  },
  // Short phrases with a lot of air around them. Every cell either opens with a
  // rest or ends in a long note; a bar packed with notes is not this music.
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 5 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [-8, 4, 4], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [-2, 2, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'pedal', weight: 6, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.86 },
    ] },
    { name: 'root-fifth', weight: 4, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.88 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.78 },
    ] },
    { name: 'pushed', weight: 3, hits: [
      { at: 0, dur: 6, tone: 'root', vel: 0.88 },
      { at: 10, dur: 5, tone: 'root', vel: 0.74 },
    ] },
  ],
  comp: [
    { name: 'half-bar-chords', weight: 5, voices: 4, hits: [
      { at: 0, dur: 8, vel: 0.5 },
      { at: 8, dur: 8, vel: 0.44 },
    ] },
    { name: 'whole-bar', weight: 4, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.46 }] },
    { name: 'slow-arpeggio', weight: 4, voices: 4, arpeggio: true, hits: [
      { at: 0, dur: 4, vel: 0.5 },
      { at: 4, dur: 4, vel: 0.42 },
      { at: 8, dur: 4, vel: 0.46 },
      { at: 12, dur: 4, vel: 0.42 },
    ] },
  ],
  drums: [
    { name: 'dusty-halftime', weight: 5, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [0, 4, 8, 12],
    } },
    { name: 'loping', weight: 4, voices: {
      bd: [0, 6, 10],
      rim: [8],
      hh: [2, 6, 10, 14],
    } },
    { name: 'ticking', weight: 3, voices: {
      bd: [0],
      rim: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    // Beatless. A third of this repertoire has no drums at all, and leaving
    // that to chance would produce a station where everything ticks.
    { name: 'none', weight: 4, voices: {} },
  ],
  melody: { leap: 0.16, ornament: 0.08, span: 12, sequence: 0.55 },
};

/**
 * WASTELAND — the Mark Morgan sound.
 *
 * The Fallout score, and the branch of ambient that descends from industrial
 * rather than from minimalism. A low drone that does not move for eight bars,
 * a ♭II leaning on it from a semitone above, and detuned metallic fragments
 * arriving out of the distance with nothing connecting them.
 *
 * `strictness: 'light'` is deliberate. The sour intervals the constraint table
 * exists to suppress — the held minor second, the tritone against a pedal —
 * are what this music is *for*. Smoothing them produces something ominous in
 * theory and pleasant in fact, which is worse than either.
 */
const wasteland: Style = {
  id: 'wasteland',
  label: 'Wasteland',
  description:
    'Dark industrial drone. A motionless low pedal, ♭II leaning on it from a semitone up, and sparse detuned metallic fragments over the top.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [50, 72],
  swing: 0,
  modeWeights: { minor: 0.94, major: 0.06 },
  relativeMajorChorus: 0,
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  // Two beats between answering notes. The gaps in this music are bars long,
  // and an eighth-note reply to an eight-second silence reads as a different
  // piece breaking in.
  counterSpacing: 2,
  strictness: 'light',
  // Fragments, not themes. Nothing here should come back sounding like it was
  // meant to — the harmony holds and the surface refuses to.
  hook: 'loose',
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5, note: 'Eight bars of nothing moving. The texture has to carry all of it, which is the point' },
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 5, note: 'The Phrygian ♭II — a major triad a semitone above the tonic, leaning down onto it and never arriving' },
      { chords: ['i', 'i', 'VI', 'VI', 'i', 'i', 'v', 'v'], weight: 4, note: 'A *minor* v. The major dominant would resolve, and nothing here resolves' },
      { chords: ['iv', 'iv', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'bII', 'bII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['isus4', 'isus4', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'iv', 'iv', 'bII', 'bII', 'bII', 'bII'], weight: 4 },
      { chords: ['VI', 'VI', 'VI', 'VI', 'v', 'v', 'v', 'v'], weight: 3 },
    ],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 4 }],
    verse: [
      { chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2', 'bVI', 'bVI', 'bVI', 'bVI'], weight: 5 },
      { chords: ['Imaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'iv', 'iv', 'iv', 'iv'], weight: 3 },
    ],
    chorus: [{ chords: ['bVI', 'bVI', 'bVII', 'bVII', 'Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 4 }],
    bridge: [{ chords: ['iv', 'iv', 'iv', 'iv', 'bVI', 'bVI', 'bVI', 'bVI'], weight: 4 }],
    outro: [{ chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 4 }],
  },
  // Mostly silence with something in it. The leading rests are not decoration:
  // a fragment that starts on the downbeat sounds played, and one that starts
  // late sounds overheard.
  melodyCells: [
    { cell: [-8, 8], weight: 5 },
    { cell: [16], weight: 5 },
    { cell: [-12, 4], weight: 4 },
    { cell: [-4, 12], weight: 4 },
    { cell: [-8, 4, 4], weight: 3 },
    { cell: [8, 8], weight: 3 },
    { cell: [-6, 2, 8], weight: 2 },
    // A bar of nothing. Rare, and worth having: it is the only way the line
    // ever stops for longer than it plays.
    { cell: [-16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 3 },
    { cell: [-4, 12], weight: 2 },
  ],
  bass: [
    { name: 'drone', weight: 8, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.9 },
    ] },
    { name: 'drone-octave', weight: 3, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.9 },
      { at: 0, dur: 16, tone: 'octave', vel: 0.5 },
    ] },
  ],
  comp: [
    { name: 'late-swell', weight: 5, voices: 3, hits: [{ at: 8, dur: 7, vel: 0.34 }] },
    { name: 'held', weight: 4, voices: 3, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.3 }] },
    { name: 'metallic-stab', weight: 3, voices: 2, hits: [
      { at: 6, dur: 2, vel: 0.4 },
      { at: 14, dur: 2, vel: 0.34 },
    ] },
  ],
  drums: [
    // Not a kit. Isolated struck metal, far apart, with nothing keeping time.
    { name: 'none', weight: 6, voices: {} },
    { name: 'distant-metal', weight: 4, voices: {
      perc: [0],
      rim: [10],
    } },
    { name: 'slow-machine', weight: 3, voices: {
      bd: [0],
      perc: [8],
    } },
  ],
  melody: { leap: 0.28, ornament: 0.05, span: 20, sequence: 0.25 },
};

/**
 * DRONE — the Eno and Stars of the Lid end.
 *
 * One chord, held, for as long as the piece lasts. No drums, no answering
 * figures, no pulse of any kind. The comp stacks fourths for the same reason
 * modal jazz does: with the harmony motionless, a tertian voicing is wallpaper
 * inside a bar and fourths are ambiguous enough to stay interesting.
 *
 * `strictness: 'strict'` here and nowhere else in this genre. Everything sounds
 * at once and holds, so a semitone that would pass unnoticed as a passing note
 * anywhere else sits in the air for four seconds.
 */
const drone: Style = {
  id: 'drone',
  label: 'Drone',
  description:
    'One chord held as long as the piece. No pulse, no drums, quartal voicings, a line that moves once a bar at most.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [48, 64],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  drumFills: false,
  excludeLayers: ['drums', 'brass', 'counter'],
  requireLayers: ['pad'],
  strictness: 'strict',
  // Everything is the same as everything else, on purpose. This is the one
  // place in the project where maximum repetition is a description of the
  // genre rather than a setting applied to it.
  hook: 'earworm',
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 4 }],
    verse: [
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 6 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'iv9', 'iv9', 'iv9', 'iv9'], weight: 3 },
      { chords: ['i11', 'i11', 'i11', 'i11', 'i11', 'i11', 'i11', 'i11'], weight: 3 },
    ],
    chorus: [
      { chords: ['VImaj7', 'VImaj7', 'VImaj7', 'VImaj7', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['IIImaj7', 'IIImaj7', 'IIImaj7', 'IIImaj7', 'i9', 'i9', 'i9', 'i9'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv9', 'iv9', 'iv9', 'iv9', 'iv9', 'iv9', 'iv9', 'iv9'], weight: 4 },
      { chords: ['VII', 'VII', 'VII', 'VII', 'VI', 'VI', 'VI', 'VI'], weight: 3 },
    ],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 4 }],
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 6 },
      { chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9'], weight: 3 },
      { chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 3 },
    ],
    chorus: [
      { chords: ['IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 },
      { chords: ['vi9', 'vi9', 'vi9', 'vi9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 3 },
    ],
    bridge: [{ chords: ['bVImaj9', 'bVImaj9', 'bVImaj9', 'bVImaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9'], weight: 4 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 4 }],
  },
  // One note a bar, or none. At 52 BPM a whole-bar note lasts four and a half
  // seconds, which is the shortest event this style has any use for.
  melodyCells: [
    { cell: [16], weight: 8 },
    { cell: [-8, 8], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [-4, 12], weight: 3 },
    { cell: [-16], weight: 2 },
    { cell: [12, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 9 },
    { cell: [-4, 12], weight: 2 },
  ],
  bass: [
    { name: 'drone', weight: 9, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.85 },
    ] },
    { name: 'drone-fifth', weight: 3, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.85 },
      { at: 0, dur: 16, tone: 'fifth', vel: 0.55 },
    ] },
  ],
  comp: [
    { name: 'quartal-held', weight: 7, voices: 4, voicing: 'quartal', sustain: true, hits: [{ at: 0, dur: 16, vel: 0.4 }] },
    // The one comp here that re-strikes, and it is still only twice a bar —
    // about once every four seconds at these tempos.
    { name: 'quartal-half', weight: 3, voices: 4, voicing: 'quartal', hits: [
      { at: 0, dur: 7, vel: 0.38 },
      { at: 8, dur: 7, vel: 0.34 },
    ] },
    { name: 'held', weight: 3, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.38 }] },
  ],
  // Never reached — `excludeLayers` removes the drums entirely — but the type
  // requires a table and an empty one would be a trap for anyone who later
  // removes the exclusion.
  drums: [{ name: 'none', weight: 1, voices: {} }],
  melody: { leap: 0.12, ornament: 0.02, span: 14, sequence: 0.5 },
};

/**
 * KOSMISCHE — the Berlin school.
 *
 * Tangerine Dream and Klaus Schulze: a sequencer running underneath a pad that
 * changes about once a minute. The sequence is the whole appeal and it is the
 * one thing a chordal comp cannot produce, so this is the style that needs
 * `arpeggio` — one note of the voicing per hit, cycling *across* barlines so
 * the figure and the bar drift out of phase with each other.
 *
 * Faster than the rest of the genre by a long way, and it does not matter: the
 * harmony still moves once every four bars. Tempo and harmonic rhythm are
 * separate things, and confusing them is how ambient gets written as slow pop.
 */
const kosmische: Style = {
  id: 'kosmische',
  label: 'Kosmische',
  description:
    'Berlin-school sequencer music. A running arpeggio that drifts against the bar, under a pad that changes once every four bars.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [96, 132],
  swing: 0,
  modeWeights: { minor: 0.78, major: 0.22 },
  relativeMajorChorus: 0,
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  counterSpacing: 1,
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 4 }],
    verse: [
      { chords: ['i9', 'i9', 'i9', 'i9', 'VI', 'VI', 'VI', 'VI'], weight: 5 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 4 },
      { chords: ['i9', 'i9', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'iv9', 'iv9', 'iv9', 'iv9'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VI', 'VI', 'III', 'III', 'III', 'III'], weight: 4 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i9', 'i9', 'i9', 'i9'], weight: 4 },
      { chords: ['iv9', 'iv9', 'iv9', 'iv9', 'i9', 'i9', 'i9', 'i9'], weight: 3 },
    ],
    bridge: [
      { chords: ['III', 'III', 'III', 'III', 'VII', 'VII', 'VII', 'VII'], weight: 4 },
      { chords: ['bII', 'bII', 'bII', 'bII', 'i9', 'i9', 'i9', 'i9'], weight: 2 },
    ],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 4 }],
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9'], weight: 5 },
      { chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'bVII', 'bVII', 'bVII', 'bVII'], weight: 4 },
    ],
    chorus: [
      { chords: ['vi9', 'vi9', 'vi9', 'vi9', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9'], weight: 4 },
      { chords: ['IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 3 },
    ],
    bridge: [{ chords: ['bVImaj9', 'bVImaj9', 'bVImaj9', 'bVImaj9', 'bVII', 'bVII', 'bVII', 'bVII'], weight: 4 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 4 }],
  },
  melodyCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 5 },
    { cell: [-8, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
    { cell: [-4, 12], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    { name: 'pedal', weight: 5, sustain: true, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.88 }] },
    { name: 'pulse', weight: 5, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.9 },
      { at: 8, dur: 7, tone: 'root', vel: 0.78 },
    ] },
    { name: 'octave-pulse', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.9 },
      { at: 4, dur: 3, tone: 'octave', vel: 0.7 },
      { at: 8, dur: 3, tone: 'root', vel: 0.82 },
      { at: 12, dur: 3, tone: 'octave', vel: 0.7 },
    ] },
  ],
  comp: [
    // Sixteen steps against four beats. The voicing has four notes, so the
    // figure lands on a different chord tone on every downbeat.
    { name: 'sequence-16', weight: 6, voices: 4, arpeggio: true, hits: [
      { at: 0, dur: 1, vel: 0.5 }, { at: 1, dur: 1, vel: 0.4 },
      { at: 2, dur: 1, vel: 0.46 }, { at: 3, dur: 1, vel: 0.4 },
      { at: 4, dur: 1, vel: 0.48 }, { at: 5, dur: 1, vel: 0.4 },
      { at: 6, dur: 1, vel: 0.46 }, { at: 7, dur: 1, vel: 0.4 },
      { at: 8, dur: 1, vel: 0.5 }, { at: 9, dur: 1, vel: 0.4 },
      { at: 10, dur: 1, vel: 0.46 }, { at: 11, dur: 1, vel: 0.4 },
      { at: 12, dur: 1, vel: 0.48 }, { at: 13, dur: 1, vel: 0.4 },
      { at: 14, dur: 1, vel: 0.46 }, { at: 15, dur: 1, vel: 0.4 },
    ] },
    { name: 'sequence-8', weight: 5, voices: 3, arpeggio: true, hits: [
      { at: 0, dur: 2, vel: 0.5 }, { at: 2, dur: 2, vel: 0.42 },
      { at: 4, dur: 2, vel: 0.48 }, { at: 6, dur: 2, vel: 0.42 },
      { at: 8, dur: 2, vel: 0.5 }, { at: 10, dur: 2, vel: 0.42 },
      { at: 12, dur: 2, vel: 0.48 }, { at: 14, dur: 2, vel: 0.42 },
    ] },
    { name: 'sequence-offbeat', weight: 3, voices: 5, arpeggio: true, hits: [
      { at: 2, dur: 2, vel: 0.46 }, { at: 6, dur: 2, vel: 0.46 },
      { at: 10, dur: 2, vel: 0.46 }, { at: 14, dur: 2, vel: 0.46 },
    ] },
  ],
  drums: [
    { name: 'none', weight: 5, voices: {} },
    { name: 'motorik', weight: 4, voices: {
      bd: [0, 8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      rim: [4, 12],
    } },
    { name: 'soft-pulse', weight: 3, voices: {
      bd: [0, 8],
      hh: [4, 12],
    } },
  ],
  melody: { leap: 0.2, ornament: 0.1, span: 16, sequence: 0.5 },
};

/**
 * CHORAL — sacred minimalism.
 *
 * Pärt, Górecki, and further back the modal writing they were reaching for.
 * In 3/4 rather than 4/4, because that is where this repertoire lives: the
 * three-beat bar has no backbeat and no half-bar accent, so it never implies a
 * groove the way a four-beat bar does even when nothing is playing on the beats.
 *
 * The only style here written to be sung — `--vocals` belongs on this one.
 */
const choral: Style = {
  id: 'choral',
  label: 'Choral',
  description:
    'Sacred minimalism in 3/4. Modal, stepwise, voices and strings, no percussion of any kind.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [54, 76],
  swing: 0,
  modeWeights: { minor: 0.8, major: 0.2 },
  relativeMajorChorus: 0,
  drumFills: false,
  excludeLayers: ['drums', 'brass'],
  requireLayers: ['pad'],
  // A beat between answering notes. The default eighth is a melisma at these
  // tempos, and a choir that suddenly runs is a choir singing something else.
  counterSpacing: 1,
  strictness: 'strict',
  progressions: {
    intro: [{ chords: ['i', 'i', 'VI', 'VI'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'v', 'v'], weight: 5, note: 'The descending aeolian tetrachord — i VII VI v — which is what modal lament sounds like in every tradition that has one' },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'v', 'v'], weight: 4 },
      { chords: ['i', 'III', 'VII', 'i', 'iv', 'VI', 'v', 'i'], weight: 4 },
      { chords: ['i', 'i', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'III', 'III', 'VII', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'VI', 'VI', 'v', 'v', 'i', 'i'], weight: 4 },
      { chords: ['III', 'III', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'iv', 'iv', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
      { chords: ['bII', 'bII', 'VI', 'VI', 'v', 'v', 'i', 'i'], weight: 2 },
    ],
    outro: [{ chords: ['VI', 'VI', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'IV', 'IV'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'vi', 'vi', 'IV', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'iii', 'iii', 'IV', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'IV', 'I', 'ii', 'IV', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'vi', 'vi', 'ii', 'ii', 'I', 'I'], weight: 4 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['ii', 'ii', 'IV', 'IV', 'vi', 'vi', 'IV', 'IV'], weight: 4 }],
    outro: [{ chords: ['IV', 'IV', 'I', 'I'], weight: 4 }],
  },
  // Twelve slots to a bar. A dotted half is the resting state and everything
  // else is a subdivision of it.
  melodyCells: [
    { cell: [12], weight: 6 },
    { cell: [6, 6], weight: 5 },
    { cell: [-4, 8], weight: 4 },
    { cell: [4, 4, 4], weight: 4 },
    { cell: [8, 4], weight: 3 },
    { cell: [-6, 6], weight: 3 },
    { cell: [3, 3, 6], weight: 2 },
    { cell: [6, 3, 3], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 7 },
    { cell: [-4, 8], weight: 3 },
    { cell: [6, 6], weight: 2 },
  ],
  bass: [
    { name: 'pedal', weight: 6, sustain: true, hits: [{ at: 0, dur: 12, tone: 'root', vel: 0.82 }] },
    { name: 'root-fifth', weight: 3, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 0.84 },
      { at: 6, dur: 5, tone: 'fifth', vel: 0.72 },
    ] },
  ],
  comp: [
    { name: 'held', weight: 6, voices: 4, sustain: true, hits: [{ at: 0, dur: 12, vel: 0.42 }] },
    { name: 'organum', weight: 4, voices: 3, hits: [
      { at: 0, dur: 5, vel: 0.44 },
      { at: 6, dur: 5, vel: 0.4 },
    ] },
    { name: 'slow-arpeggio', weight: 3, voices: 4, arpeggio: true, hits: [
      { at: 0, dur: 4, vel: 0.44 },
      { at: 4, dur: 4, vel: 0.4 },
      { at: 8, dur: 4, vel: 0.4 },
    ] },
  ],
  drums: [{ name: 'none', weight: 1, voices: {} }],
  melody: { leap: 0.14, ornament: 0.05, span: 13, sequence: 0.55 },
};

/**
 * AQUATIC — deep ambient techno.
 *
 * Basic Channel, Gas, Biosphere: a soft four-on-the-floor with a chord landing
 * on every offbeat, everything filtered as though it were being heard through
 * water. The pulse is real but it is not a groove — nothing syncopates against
 * it and nothing fills.
 *
 * The chord on the *and* is the whole idiom, and it is why this style comps on
 * the offbeats and nowhere else.
 */
const aquatic: Style = {
  id: 'aquatic',
  label: 'Aquatic',
  description:
    'Deep ambient techno. Soft four-on-the-floor, a submerged chord on every offbeat, sub bass, and no fills anywhere.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [100, 124],
  swing: 0,
  modeWeights: { minor: 0.72, major: 0.28 },
  relativeMajorChorus: 0,
  drumFills: false,
  excludeLayers: ['brass', 'counter'],
  requireLayers: ['pad'],
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 4 }],
    verse: [
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'iv9', 'iv9', 'iv9', 'iv9'], weight: 4 },
      { chords: ['i9', 'i9', 'VI', 'VI', 'i9', 'i9', 'VI', 'VI'], weight: 4 },
      { chords: ['i11', 'i11', 'i11', 'i11', 'VII', 'VII', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VI', 'VI', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['iv9', 'iv9', 'VII', 'VII', 'i9', 'i9', 'i9', 'i9'], weight: 4 },
    ],
    bridge: [
      { chords: ['III', 'III', 'III', 'III', 'VI', 'VI', 'VI', 'VI'], weight: 4 },
      { chords: ['iv9', 'iv9', 'iv9', 'iv9', 'iv9', 'iv9', 'iv9', 'iv9'], weight: 3 },
    ],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 4 }],
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9'], weight: 5 },
      { chords: ['vi9', 'vi9', 'vi9', 'vi9', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9'], weight: 3 },
    ],
    chorus: [{ chords: ['IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 4 }],
    bridge: [{ chords: ['ii9', 'ii9', 'ii9', 'ii9', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9'], weight: 4 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 4 }],
  },
  melodyCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 12], weight: 4 },
    { cell: [-12, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 8 },
    { cell: [-8, 8], weight: 3 },
  ],
  bass: [
    { name: 'sub-pedal', weight: 6, sustain: true, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.92 }] },
    { name: 'sub-pulse', weight: 5, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.94 },
      { at: 8, dur: 7, tone: 'root', vel: 0.84 },
    ] },
    { name: 'offbeat-sub', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.94 },
      { at: 6, dur: 3, tone: 'root', vel: 0.76 },
      { at: 8, dur: 3, tone: 'root', vel: 0.86 },
      { at: 14, dur: 3, tone: 'fifth', vel: 0.74 },
    ] },
  ],
  comp: [
    // The dub-techno chord: never on a beat, never on a downbeat, always
    // arriving a moment after the kick has gone.
    { name: 'offbeat-chords', weight: 6, voices: 4, hits: [
      { at: 2, dur: 3, vel: 0.44 },
      { at: 6, dur: 3, vel: 0.4 },
      { at: 10, dur: 3, vel: 0.44 },
      { at: 14, dur: 3, vel: 0.4 },
    ] },
    { name: 'offbeat-sparse', weight: 4, voices: 4, hits: [
      { at: 6, dur: 4, vel: 0.42 },
      { at: 14, dur: 4, vel: 0.42 },
    ] },
    { name: 'held', weight: 3, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.36 }] },
  ],
  drums: [
    { name: 'four-floor', weight: 6, voices: {
      bd: [0, 4, 8, 12],
      hh: [2, 6, 10, 14],
    } },
    { name: 'four-floor-open', weight: 4, voices: {
      bd: [0, 4, 8, 12],
      oh: [2, 6, 10, 14],
      rim: [4, 12],
    } },
    { name: 'kick-only', weight: 3, voices: { bd: [0, 4, 8, 12] } },
    { name: 'none', weight: 2, voices: {} },
  ],
  melody: { leap: 0.15, ornament: 0.05, span: 12, sequence: 0.5 },
};

export const STYLES: Record<string, Style> = {
  hauntology, wasteland, drone, kosmische, choral, aquatic,
};
