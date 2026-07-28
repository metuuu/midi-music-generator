/**
 * The vintage-electronic catalogue, 1972–1990.
 *
 * Organised by *what composes the music*, because in this repertoire that is a
 * different thing in every corner of it and it is never the melody. A Tangerine
 * Dream side is composed by the sequencer; a Vangelis cue by a player with two
 * hands on a CS-80; a Kraftwerk single by its bass line; a Moroder record by the
 * kick drum; a Carpenter title sequence by one ostinato that never stops. Sort
 * this music by mood or by tempo and the five collapse into two. Sort it by
 * which machine is in charge and they stay five.
 *
 * Five things separate these tables from the ambient ones next door, and the
 * first two matter more than any progression here:
 *
 *  - **Harmony moves.** One chord every two to four bars, never one every
 *    eight. This is the sharpest single difference from ambient, and it is what
 *    makes the same synthesisers sound like records rather than like weather.
 *  - **There is no harmonic minor and no raised seventh.** Not one `V` or `V7`
 *    appears in a minor table anywhere in this genre. This is modal pop: `VII`
 *    is a whole tone below the tonic and a major triad, and it goes where
 *    another idiom would put a dominant. The `VI–VII–i` that results is the
 *    cadence of the entire repertoire. In *major* the ban lifts — Kraftwerk
 *    cadences, and `machine` and `cosmic` both do — so the claim is precisely
 *    "no dominant in minor" rather than "no dominant".
 *  - **Sus2, sus4 and the ninth are the vocabulary, not the garnish.** A
 *    triad with the third taken out is the default sound of a polysynth pad,
 *    and every style here reaches for one.
 *  - **Nothing swings.** `swing: 0` on all five. The sequencer is the clock, and
 *    a triplet feel laid over a sixteenth-note step grid deletes the machine.
 *  - **The chorus never lifts to the relative major.** `relativeMajorChorus: 0`
 *    throughout. That gesture belongs to a dance band with a key-change arranger
 *    in it; here a section arrives because the filter opened, or because the
 *    kick came in, or because the sequence changed cycle.
 *
 * Three fields get their first real use in this file, and two of them exist
 * because of it. `cycle` — the figure that is not the bar — is what a step
 * sequencer *is*: a fixed number of steps that has no opinion about where the
 * barline is. `counterMode: 'ostinato'` is the Berlin-school texture, two
 * sequencers of different lengths phasing against each other, which no
 * answering counter-melody can imitate. `filter` is the sweep, and `berlin` is
 * the reason it was added.
 */

import type { Style } from '../../style/types.js';

/**
 * BERLIN — eighties Tangerine Dream, and the engine under *Oxygène*.
 *
 * The one style here whose composer is the sequencer. A four-bar step figure
 * runs in sixteenths underneath harmony that changes every two bars, so the
 * figure and the chords agree only every other time round; a second, shorter
 * figure runs on top of it on its own cycle and lines up with neither. That is
 * the whole texture — `Sorcerer`, `Thief`, the long middle of `Équinoxe` — and
 * it is mechanically unreachable without both `cycle` and
 * `counterMode: 'ostinato'`, because an answering counter-melody by definition
 * waits for a gap and this music has none.
 *
 * `filter: { shape: 'ramp' }` is the field's reason for existing. The sixteen
 * bars in which a closed filter opens over a running sequence are not a mix
 * decision applied to a composition; in this style they *are* the composition,
 * and the depth is set deep enough (0.75) that the opening is the event.
 *
 * A real kit, unlike its ambient cousin `kosmische`: a gated snare on 3 and a
 * hat on every eighth. This is the film-score end of the school, where somebody
 * decided the sequence needed a backbeat, and that decision is most of what
 * separates 1982 from 1974.
 */
const berlin: Style = {
  id: 'berlin',
  label: 'Berlin school',
  description:
    'A four-bar sixteenth-note sequence under harmony that moves every two bars, a second sequence phasing against it, and a filter that opens across the section.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [108, 140],
  swing: 0,
  modeWeights: { minor: 0.8, major: 0.2 },
  relativeMajorChorus: 0,
  requireLayers: ['comp'],
  excludeLayers: ['brass'],
  /**
   * The second sequencer. Not a reply — it runs whether or not the lead is
   * playing, which is the distinction `counterMode` was added to express.
   */
  counterMode: 'ostinato',
  filter: { depth: 0.75, shape: 'ramp' },
  progressions: {
    intro: [
      { chords: ['i9', 'i9', 'VI', 'VI'], weight: 4 },
      { chords: ['i', 'i', 'VII', 'VII'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5, note: 'Aeolian rocking two bars at a time: the seventh is natural, a whole tone below the tonic, and nothing leads anywhere' },
      { chords: ['i9', 'i9', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'III', 'III', 'iv', 'iv', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5, note: '♭VI–♭VII–i, the cadence this whole genre uses where another would put a dominant' },
      { chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['VI', 'VI', 'III', 'III', 'VII', 'VII', 'i9', 'i9'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'VII', 'VII', 'III', 'III', 'VI', 'VI'], weight: 4 },
      { chords: ['bII', 'bII', 'i', 'i', 'bII', 'bII', 'VII', 'VII'], weight: 3, note: 'The Phrygian ♭II a semitone above the tonic — the darkest chord available without leaving the mode behind entirely' },
    ],
    outro: [
      { chords: ['VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i9', 'i9', 'i9', 'i9'], weight: 2 },
    ],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'bVII', 'bVII'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 5, note: 'The double-plagal I–♭VII–IV–I: mixolydian, and the major-key equivalent of refusing the dominant' },
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'bVII', 'bVII'], weight: 4 },
      { chords: ['I', 'I', 'V', 'V', 'vi', 'vi', 'IV', 'IV'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'V', 'V', 'I', 'I', 'I', 'I'], weight: 4 },
      { chords: ['bVI', 'bVI', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 4, note: 'Both chords borrowed out of the parallel minor, which is how a major-key sequence stays cold' },
    ],
    bridge: [
      { chords: ['bVII', 'bVII', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 3 },
      { chords: ['vi', 'vi', 'iii', 'iii', 'IV', 'IV', 'V', 'V'], weight: 3 },
    ],
    outro: [{ chords: ['bVII', 'bVII', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [-8, 4, 4], weight: 3 },
    { cell: [12, 4], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 2 },
    { cell: [-4, 4, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  /**
   * Bar-shaped, all three, and deliberately so. Everything that drifts in this
   * style drifts above the bass — the sequence and the counter-sequence — and a
   * floor that moved with them would leave nothing for them to move *against*.
   */
  bass: [
    { name: 'eighth-pulse', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.95 },
      { at: 4, dur: 3, tone: 'root', vel: 0.8 },
      { at: 8, dur: 3, tone: 'root', vel: 0.88 },
      { at: 12, dur: 3, tone: 'root', vel: 0.8 },
    ] },
    { name: 'octave-pulse', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.95 },
      { at: 4, dur: 3, tone: 'octave', vel: 0.76 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.86 },
      { at: 12, dur: 3, tone: 'octave', vel: 0.76 },
    ] },
    { name: 'pedal', weight: 3, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.9 },
    ] },
  ],
  comp: [
    /**
     * The style, in one pattern: sixty-four sixteenth steps, which is four bars,
     * against harmony that moves every two. The figure therefore plays the same
     * steps over two different chords and comes back round on the third change,
     * and the accent row — a strong step on every bar head, a lesser one on
     * every beat — is what a sequencer's accent switches actually do.
     *
     * **Seven steps are missing, and they are the reason this reads as a
     * sequence rather than as a texture.** A gate switch that is on for all
     * sixty-four steps produces an unbroken stream of sixteenths, and an
     * unbroken stream has no figure in it to remember — which is what this
     * pattern was for as long as every step fired. The gaps fall at the end of
     * bar two, in the middle of bar three and across the last beat of bar four,
     * so no two bars of the four have the same silhouette.
     *
     * They also make the arithmetic work. Fifty-seven steps against an
     * eight-rung ladder leaves a remainder of one, so each pass through the
     * four bars starts one rung further up than the last and the figure takes
     * eight passes — thirty-two bars — to return to where it began. A
     * gapless sixty-four would have divided the ladder exactly and come back
     * every four.
     *
     * Written out rather than generated because the accent row is the part
     * anyone would want to edit, and a loop that emitted it would hide exactly
     * the thing worth reading.
     */
    { name: 'sequence-4-bar', weight: 6, voices: 4, arpeggio: true, arpOctaves: 2, cycle: 64, hits: [
      { at: 0, dur: 1, vel: 0.54 }, { at: 1, dur: 1, vel: 0.36 }, { at: 2, dur: 1, vel: 0.42 }, { at: 3, dur: 1, vel: 0.36 },
      { at: 4, dur: 1, vel: 0.48 }, { at: 5, dur: 1, vel: 0.36 }, { at: 6, dur: 1, vel: 0.42 }, { at: 7, dur: 1, vel: 0.36 },
      { at: 8, dur: 1, vel: 0.48 }, { at: 9, dur: 1, vel: 0.36 }, { at: 10, dur: 1, vel: 0.42 }, { at: 11, dur: 1, vel: 0.36 },
      { at: 12, dur: 1, vel: 0.48 }, { at: 13, dur: 1, vel: 0.36 }, { at: 14, dur: 1, vel: 0.42 }, { at: 15, dur: 1, vel: 0.36 },
      { at: 16, dur: 1, vel: 0.54 }, { at: 17, dur: 1, vel: 0.36 }, { at: 18, dur: 1, vel: 0.42 }, { at: 19, dur: 1, vel: 0.36 },
      { at: 20, dur: 1, vel: 0.48 }, { at: 21, dur: 1, vel: 0.36 }, { at: 22, dur: 1, vel: 0.42 },
      { at: 24, dur: 1, vel: 0.48 }, { at: 25, dur: 1, vel: 0.36 }, { at: 26, dur: 1, vel: 0.42 }, { at: 27, dur: 1, vel: 0.36 },
      { at: 28, dur: 1, vel: 0.48 }, { at: 29, dur: 1, vel: 0.36 }, { at: 30, dur: 1, vel: 0.42 },
      { at: 32, dur: 1, vel: 0.54 }, { at: 33, dur: 1, vel: 0.36 }, { at: 34, dur: 1, vel: 0.42 },
      { at: 36, dur: 1, vel: 0.48 }, { at: 37, dur: 1, vel: 0.36 }, { at: 38, dur: 1, vel: 0.42 }, { at: 39, dur: 1, vel: 0.36 },
      { at: 40, dur: 1, vel: 0.48 }, { at: 41, dur: 1, vel: 0.36 }, { at: 42, dur: 1, vel: 0.42 },
      { at: 44, dur: 1, vel: 0.48 }, { at: 45, dur: 1, vel: 0.36 }, { at: 46, dur: 1, vel: 0.42 }, { at: 47, dur: 1, vel: 0.36 },
      { at: 48, dur: 1, vel: 0.54 }, { at: 49, dur: 1, vel: 0.36 }, { at: 50, dur: 1, vel: 0.42 }, { at: 51, dur: 1, vel: 0.36 },
      { at: 52, dur: 1, vel: 0.48 }, { at: 53, dur: 1, vel: 0.36 }, { at: 54, dur: 1, vel: 0.42 },
      { at: 56, dur: 1, vel: 0.48 }, { at: 57, dur: 1, vel: 0.36 }, { at: 58, dur: 1, vel: 0.42 }, { at: 59, dur: 1, vel: 0.36 },
      { at: 60, dur: 1, vel: 0.48 }, { at: 61, dur: 1, vel: 0.36 },
    ] },
    /**
     * The same machine set to two bars, and set to walk up and back down.
     *
     * Three voices over two octaves is six rungs, which the fold turns into
     * ten — so this pattern's thirty-two steps and its ladder share no factor
     * but two, and the figure needs five passes to come home. The `updown`
     * is not decoration: it is what makes ten out of six.
     */
    { name: 'sequence-2-bar', weight: 4, voices: 3, arpeggio: true, arpDirection: 'updown', arpOctaves: 2, cycle: 32, hits: [
      { at: 0, dur: 1, vel: 0.52 }, { at: 1, dur: 1, vel: 0.36 }, { at: 2, dur: 1, vel: 0.42 }, { at: 3, dur: 1, vel: 0.36 },
      { at: 4, dur: 1, vel: 0.46 }, { at: 5, dur: 1, vel: 0.36 }, { at: 6, dur: 1, vel: 0.42 },
      { at: 8, dur: 1, vel: 0.46 }, { at: 9, dur: 1, vel: 0.36 }, { at: 10, dur: 1, vel: 0.42 }, { at: 11, dur: 1, vel: 0.36 },
      { at: 12, dur: 1, vel: 0.46 }, { at: 13, dur: 1, vel: 0.36 }, { at: 14, dur: 1, vel: 0.42 }, { at: 15, dur: 1, vel: 0.36 },
      { at: 16, dur: 1, vel: 0.52 }, { at: 17, dur: 1, vel: 0.36 }, { at: 18, dur: 1, vel: 0.42 }, { at: 19, dur: 1, vel: 0.36 },
      { at: 20, dur: 1, vel: 0.46 }, { at: 21, dur: 1, vel: 0.36 }, { at: 22, dur: 1, vel: 0.42 },
      { at: 24, dur: 1, vel: 0.46 }, { at: 25, dur: 1, vel: 0.36 }, { at: 26, dur: 1, vel: 0.42 }, { at: 27, dur: 1, vel: 0.36 },
      { at: 28, dur: 1, vel: 0.46 }, { at: 29, dur: 1, vel: 0.36 }, { at: 30, dur: 1, vel: 0.42 },
    ] },
    /**
     * Twenty-four steps: a bar and a half, in eighths. It arrives on the
     * downbeat every third bar and on the *and* of 3 in between, which is the
     * cheapest way this genre has of making four bars sound like something other
     * than four bars.
     *
     * The one descending figure in the style. A falling sequence under a rising
     * lead is the oldest trick in this repertoire and it was unreachable while
     * every arpeggio in the project walked upward.
     */
    { name: 'sequence-twelve-eighths', weight: 3, voices: 5, arpeggio: true, arpDirection: 'down', cycle: 24, hits: [
      { at: 0, dur: 2, vel: 0.5 }, { at: 2, dur: 2, vel: 0.38 },
      { at: 4, dur: 2, vel: 0.46 }, { at: 6, dur: 2, vel: 0.38 },
      { at: 8, dur: 2, vel: 0.46 }, { at: 10, dur: 2, vel: 0.38 },
      { at: 12, dur: 2, vel: 0.48 }, { at: 14, dur: 2, vel: 0.38 },
      { at: 16, dur: 2, vel: 0.46 }, { at: 18, dur: 2, vel: 0.38 },
      { at: 20, dur: 2, vel: 0.46 }, { at: 22, dur: 2, vel: 0.38 },
    ] },
  ],
  /**
   * The second sequencer, and every one of these is a prime-ish length against
   * sixteen so that none of them ever settles: twelve returns every three bars,
   * twenty every five, six every three. They are the layer the ear follows when
   * the main sequence has become furniture.
   */
  counterPatterns: [
    /** Six steps against a four-rung ladder: the pair rotate by two a bar. */
    { name: 'phase-12', weight: 5, voices: 3, arpeggio: true, arpDirection: 'updown', cycle: 12, hits: [
      { at: 0, dur: 2, vel: 0.44 }, { at: 2, dur: 2, vel: 0.34 },
      { at: 4, dur: 2, vel: 0.4 }, { at: 6, dur: 2, vel: 0.34 },
      { at: 8, dur: 2, vel: 0.4 }, { at: 10, dur: 2, vel: 0.34 },
    ] },
    /**
     * Five steps against eight rungs, on a cycle of twenty against a bar of
     * sixteen. Nothing in this pattern shares a factor with anything else in
     * it, and it takes forty bars to repeat exactly — which is roughly the
     * length of a side, and is the point.
     */
    { name: 'phase-20', weight: 4, voices: 4, arpeggio: true, arpOctaves: 2, cycle: 20, hits: [
      { at: 0, dur: 3, vel: 0.44 }, { at: 4, dur: 3, vel: 0.36 },
      { at: 8, dur: 3, vel: 0.4 }, { at: 12, dur: 3, vel: 0.36 },
      { at: 16, dur: 3, vel: 0.4 },
    ] },
    /** The shortest one, falling, so it reads against the rising main figure. */
    { name: 'phase-6', weight: 3, voices: 3, arpeggio: true, arpDirection: 'down', cycle: 6, hits: [
      { at: 0, dur: 2, vel: 0.42 }, { at: 3, dur: 2, vel: 0.34 },
    ] },
  ],
  drums: [
    { name: 'gated-backbeat', weight: 6, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'sixteenth-hats', weight: 5, voices: {
      bd: [0, 6, 8],
      sd: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    } },
    { name: 'open-hat-drive', weight: 4, voices: {
      bd: [0, 8],
      sd: [8],
      cp: [8],
      oh: [4, 12],
      hh: [0, 2, 6, 10, 14],
    } },
    { name: 'quiet-kit', weight: 3, voices: {
      bd: [0, 8],
      rim: [4, 12],
      hh: [2, 6, 10, 14],
    } },
  ],
  melody: { leap: 0.22, ornament: 0.06, span: 14, sequence: 0.6, syncopation: 0.25 },
};

/**
 * CINEMATIC — Vangelis.
 *
 * *Blade Runner*, *Chariots of Fire*, *Antarctica*: a very large lyrical line
 * over slow modal-romantic harmony, played rather than programmed. The harmony
 * is maj7 and sus2 and sus4, plagal and mediant — `IV` to `I`, `i` to `III`,
 * `bVII` and `bVI` borrowed in whenever the major key gets too clean — and it
 * changes about once a bar, which at 66 BPM is slow enough to feel like weather
 * and fast enough that it is unmistakably a progression.
 *
 * **There is not one `cycle` in this style, on purpose.** Every bass, comp and
 * drum pattern here is bar-shaped. Vangelis genuinely does not riff: there is no
 * sequencer running under the *Blade Runner* end titles, there is a man holding
 * chords down, and a drifting ostinato would turn the most identifiable style in
 * this catalogue into `berlin` with the tempo halved. The same instinct governs
 * `filter`, which is `step` rather than `ramp` and shallow at that — the chorus
 * is brighter than the verse and nothing sweeps.
 *
 * This is the style that carries solos, and the only one here with a `solo`
 * table. It has the only long-breathed melodic vocabulary in the genre — cells
 * of a whole bar, `syncopation` at 0.12, a nineteen-semitone span — which is
 * exactly what a soloist needs and exactly what `machine` refuses to have.
 */
const cinematic: Style = {
  id: 'cinematic',
  label: 'Cinematic',
  description:
    'A big lyrical synth lead over slow modal-romantic harmony: maj7 and sus chords, plagal and mediant motion, one chord a bar, and nothing repeating underneath it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [60, 84],
  swing: 0,
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0,
  requireLayers: ['pad'],
  excludeLayers: ['brass'],
  /**
   * A beat between answering notes. The gaps this lead leaves are bars long, and
   * an eighth-note reply to a four-second held note is a different piece of
   * music breaking in — the same reasoning as ambient's `wasteland`.
   */
  counterSpacing: 1,
  drumFills: false,
  filter: { depth: 0.2, shape: 'step' },
  progressions: {
    intro: [
      { chords: ['isus2', 'isus2', 'VImaj7', 'VImaj7'], weight: 4 },
      { chords: ['i9', 'iv9', 'VI', 'VII'], weight: 3 },
    ],
    verse: [
      { chords: ['i9', 'i9', 'VImaj7', 'VImaj7', 'iv9', 'iv9', 'VII', 'VII'], weight: 5, note: 'Plagal minor — the fourth degree where a dominant would be, and the seventh natural underneath it' },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VI'], weight: 4, note: 'The descending aeolian tetrachord walked one chord to the bar, with no leading tone anywhere in it' },
      { chords: ['i9', 'III', 'VII', 'iv9', 'VI', 'III', 'VII', 'i9'], weight: 4, note: 'Mediant motion: the tonic and its relative major traded bar by bar, which is most of what makes this harmony sound like a film rather than a song' },
      { chords: ['isus2', 'isus2', 'IIImaj7', 'IIImaj7', 'VImaj7', 'VImaj7', 'iv9', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VImaj7', 'VImaj7', 'VII', 'VII', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['iv9', 'iv9', 'VII', 'VII', 'IIImaj7', 'IIImaj7', 'VImaj7', 'VImaj7'], weight: 4 },
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'III', 'III'], weight: 3 },
    ],
    bridge: [
      { chords: ['IIImaj7', 'IIImaj7', 'VImaj7', 'VImaj7', 'iv9', 'iv9', 'i9', 'i9'], weight: 4 },
      { chords: ['iv9', 'iv9', 'bII', 'bII', 'VI', 'VI', 'VII', 'VII'], weight: 3 },
    ],
    solo: [
      { chords: ['i9', 'i9', 'VImaj7', 'VImaj7', 'iv9', 'iv9', 'VII', 'VII'], weight: 5 },
      { chords: ['i9', 'III', 'VII', 'iv9', 'VI', 'III', 'VII', 'i9'], weight: 3 },
    ],
    outro: [
      { chords: ['iv9', 'VII', 'i9', 'i9'], weight: 4 },
      { chords: ['VImaj7', 'VII', 'i9', 'i9'], weight: 3 },
    ],
  },
  majorProgressions: {
    intro: [
      { chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7'], weight: 4 },
      { chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2'], weight: 2 },
    ],
    verse: [
      { chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'bVIImaj7', 'bVIImaj7'], weight: 5, note: 'IV to I and back, with the borrowed ♭VII on the way out — plagal all the way down' },
      { chords: ['Imaj7', 'iii7', 'IVmaj7', 'Isus2', 'vi7', 'iii7', 'IVmaj7', 'IVmaj7'], weight: 4, note: 'Chords a third apart, one to the bar: the mediant chain this composer built half a career on' },
      { chords: ['Isus2', 'Isus2', 'bVImaj7', 'bVImaj7', 'bVIImaj7', 'bVIImaj7', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['Imaj7', 'Imaj7', 'vi7', 'vi7', 'IVsus2', 'IVsus2', 'Isus4', 'Imaj7'], weight: 3, note: 'The suspension resolving into the tonic rather than onto it — sus4 to maj7 with no dominant in between' },
    ],
    chorus: [
      { chords: ['IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'Isus2', 'Imaj7'], weight: 5, note: 'Plagal rocking, which is the *Chariots* cadence and is why that tune sounds like an anthem without ever cadencing' },
      { chords: ['bVImaj7', 'bVImaj7', 'bVIImaj7', 'bVIImaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['vi7', 'vi7', 'IVmaj7', 'IVmaj7', 'Isus2', 'Isus2', 'V', 'V'], weight: 3 },
    ],
    bridge: [
      { chords: ['bVIImaj7', 'bVIImaj7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['ii7', 'ii7', 'IVmaj7', 'IVmaj7', 'vi7', 'vi7', 'Vsus4', 'V'], weight: 3 },
    ],
    solo: [
      { chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'bVIImaj7', 'bVIImaj7'], weight: 5 },
      { chords: ['vi7', 'iii7', 'IVmaj7', 'Imaj7', 'vi7', 'iii7', 'IVmaj7', 'IVmaj7'], weight: 3 },
    ],
    outro: [
      { chords: ['IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['IVsus2', 'bVIImaj7', 'Imaj7', 'Imaj7'], weight: 2 },
    ],
  },
  /**
   * Whole bars, and phrases that begin after the downbeat rather than on it. At
   * 66 BPM a bar is nearly four seconds, so `[16]` is one very long note and
   * `[4, 4, 8]` is already a busy bar. Nothing here subdivides past an eighth:
   * this lead is a singer with unlimited breath, not a keyboard player.
   */
  melodyCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 5 },
    { cell: [-4, 12], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [-8, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [6, 2, 8], weight: 2 },
    { cell: [-2, 6, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-4, 12], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'pedal', weight: 6, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.9 },
    ] },
    { name: 'half-bar', weight: 4, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.9 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.78 },
    ] },
    { name: 'rise', weight: 3, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.9 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.76 },
      { at: 12, dur: 3, tone: 'octave', vel: 0.72 },
    ] },
  ],
  comp: [
    { name: 'held', weight: 6, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.42 }] },
    { name: 'half-bar-chords', weight: 4, voices: 4, hits: [
      { at: 0, dur: 8, vel: 0.44 },
      { at: 8, dur: 8, vel: 0.38 },
    ] },
    /**
     * A broken chord, not a sequence. It arpeggiates within the bar and restarts
     * at every barline, which is what a player does and the opposite of what
     * `cycle` would do.
     *
     * `updown` for the same reason: a hand rolling a chord under a held melody
     * note goes up and comes back, where a machine goes up and starts again
     * from the bottom. Six rungs against four hits a bar also means the turn
     * lands in a different place every bar without any cycle being involved.
     */
    { name: 'broken-chord', weight: 3, voices: 4, arpeggio: true, arpDirection: 'updown', hits: [
      { at: 0, dur: 4, vel: 0.44 },
      { at: 4, dur: 4, vel: 0.36 },
      { at: 8, dur: 4, vel: 0.4 },
      { at: 12, dur: 4, vel: 0.36 },
    ] },
  ],
  drums: [
    /** Half of this repertoire has no kit at all, and leaving that to chance
     *  would produce a composer who always brought a drummer. */
    { name: 'none', weight: 5, voices: {} },
    { name: 'slow-kit', weight: 4, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [0, 4, 8, 12],
    } },
    { name: 'toms', weight: 3, voices: {
      bd: [0],
      lt: [8],
      mt: [12],
    } },
    { name: 'shaker-pulse', weight: 2, voices: {
      sh: [0, 4, 8, 12],
      rim: [8],
    } },
  ],
  melody: { leap: 0.24, ornament: 0.06, span: 19, sequence: 0.5, syncopation: 0.12 },
};

/**
 * MACHINE — Kraftwerk.
 *
 * *Trans-Europe Express*, *The Man-Machine*, *Computer World*. The style whose
 * composer is the bass line: `the-hook` is a two-bar figure on `cycle: 32`, it
 * is the thing anyone can hum afterwards, and the tune on top of it is four or
 * five notes stated exactly the same way every time. That balance is the whole
 * design, and the numbers enforce it — `melody.span` is seven semitones,
 * `sequence` is 0.9 and `syncopation` is 0.05, which together describe a line
 * with almost nowhere to go and no interest in going there. `hook: 'earworm'`
 * makes the chorus come back note for note.
 *
 * Verse and chorus, unlike everything else in this genre. These are songs, in
 * major as often as the mode weights allow, and in major they cadence: `IV–V–I`
 * appears in this table and appears nowhere else in the file. The genre's ban on
 * the dominant is a claim about its minor tables and this style is where that
 * matters most, because it is the one that would otherwise sound like pop.
 *
 * `swing: 0` is stated rather than defaulted, and `drumFills: false` with it.
 * `motorik` — a kick on every beat, a hat on every eighth, and nothing ever
 * announcing anything — lives here as one drum pattern among four rather than
 * as a style of its own, because motorik is a groove and not a body of work.
 */
const machine: Style = {
  id: 'machine',
  label: 'Machine',
  description:
    'Man-machine pop: a two-bar bass line that is the hook, a tune of four notes repeated exactly, mechanical eighths and a drum machine that never fills.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [116, 132],
  swing: 0,
  modeWeights: { minor: 0.65, major: 0.35 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  requireLayers: ['bass'],
  excludeLayers: ['brass'],
  drumFills: false,
  filter: { depth: 0.3, shape: 'step' },
  progressions: {
    intro: [
      { chords: ['i', 'i', 'VI', 'VI'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'i', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 5, note: 'Four chords, two bars each, round and round: in this style the loop is the form and the bass line is the tune' },
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'III', 'III', 'VII', 'VII', 'VI', 'VI'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['VI', 'VI', 'III', 'III', 'iv', 'iv', 'VII', 'VII'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'VII', 'VII', 'VI', 'VI', 'III', 'III'], weight: 4 },
      { chords: ['bII', 'bII', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 2 },
    ],
    outro: [
      { chords: ['VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i'], weight: 2 },
    ],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'V', 'V'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'V', 'V', 'I', 'I'], weight: 5, note: 'A plain major cadence, and the only place in this genre one belongs — Kraftwerk cadences, and the ban on the dominant is a claim about *minor*' },
      { chords: ['I', 'I', 'vi', 'vi', 'IV', 'IV', 'V', 'V'], weight: 4 },
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'V', 'V', 'I', 'I', 'I', 'I'], weight: 5 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 4 },
    ],
    bridge: [
      { chords: ['ii', 'ii', 'V', 'V', 'I', 'I', 'vi', 'vi'], weight: 3 },
      { chords: ['IV', 'IV', 'iv', 'iv', 'I', 'I', 'I', 'I'], weight: 3, note: 'The borrowed minor iv, which is the one wistful chord this style permits itself' },
    ],
    outro: [{ chords: ['V', 'V', 'I', 'I'], weight: 4 }],
  },
  /**
   * Even, blunt, and few. Nothing dotted, nothing tied, nothing that starts on
   * an offbeat — the tune has to be singable by someone who has heard it once,
   * and every cell here is four notes or fewer laid on the beat.
   */
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 6 },
    { cell: [4, 4, 8], weight: 5 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [-8, 4, 4], weight: 3 },
    { cell: [16], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 3 },
    { cell: [-8, 8], weight: 2 },
  ],
  bass: [
    /**
     * The hook. Thirty-two sixteenths is two bars, which is one full turn of the
     * harmony at this style's rate of change, so the figure states itself once
     * per chord pair and the listener has it by the second time round.
     *
     * The shape matters as much as the length: root, root, octave, fifth in the
     * first bar and root, seventh, fifth, third in the second, so the two halves
     * answer each other and the second half is the one that moves. A bar-shaped
     * bass cannot do that — it can only say the same thing twice.
     */
    { name: 'the-hook', weight: 6, cycle: 32, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.98 },
      { at: 4, dur: 3, tone: 'root', vel: 0.82 },
      { at: 8, dur: 3, tone: 'octave', vel: 0.9 },
      { at: 12, dur: 3, tone: 'fifth', vel: 0.84 },
      { at: 16, dur: 3, tone: 'root', vel: 0.96 },
      { at: 20, dur: 3, tone: 'seventh', vel: 0.82 },
      { at: 24, dur: 3, tone: 'fifth', vel: 0.88 },
      { at: 28, dur: 3, tone: 'third', vel: 0.8 },
    ] },
    /** Two bars again, in sixteenths for the first half only, so the figure has
     *  a busy end and a plain one. The *Computer World* bass. */
    { name: 'sixteenth-hook', weight: 4, cycle: 32, hits: [
      { at: 0, dur: 1, tone: 'root', vel: 0.98 },
      { at: 2, dur: 1, tone: 'root', vel: 0.8 },
      { at: 4, dur: 1, tone: 'octave', vel: 0.88 },
      { at: 6, dur: 1, tone: 'root', vel: 0.78 },
      { at: 8, dur: 3, tone: 'seventh', vel: 0.88 },
      { at: 12, dur: 3, tone: 'fifth', vel: 0.84 },
      { at: 16, dur: 3, tone: 'root', vel: 0.96 },
      { at: 20, dur: 3, tone: 'root', vel: 0.82 },
      { at: 24, dur: 7, tone: 'fifth', vel: 0.86 },
    ] },
    /** The plain pumping eighth, for when the hook belongs to something else. */
    { name: 'eighth-pump', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.96 },
      { at: 4, dur: 3, tone: 'root', vel: 0.82 },
      { at: 8, dur: 3, tone: 'root', vel: 0.9 },
      { at: 12, dur: 3, tone: 'root', vel: 0.82 },
    ] },
  ],
  comp: [
    /** Whole chords struck on every eighth and released immediately. Not an
     *  arpeggio: the sequencer in this style is the bass, and a second one on
     *  top would be arguing with it. */
    { name: 'eighth-stabs', weight: 6, voices: 3, hits: [
      { at: 0, dur: 1, vel: 0.48 }, { at: 2, dur: 1, vel: 0.38 },
      { at: 4, dur: 1, vel: 0.44 }, { at: 6, dur: 1, vel: 0.38 },
      { at: 8, dur: 1, vel: 0.46 }, { at: 10, dur: 1, vel: 0.38 },
      { at: 12, dur: 1, vel: 0.44 }, { at: 14, dur: 1, vel: 0.38 },
    ] },
    { name: 'offbeat-stabs', weight: 4, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.44 },
      { at: 6, dur: 2, vel: 0.4 },
      { at: 10, dur: 2, vel: 0.44 },
      { at: 14, dur: 2, vel: 0.4 },
    ] },
    { name: 'sequence-eighths', weight: 3, voices: 4, arpeggio: true, hits: [
      { at: 0, dur: 2, vel: 0.46 }, { at: 2, dur: 2, vel: 0.36 },
      { at: 4, dur: 2, vel: 0.42 }, { at: 6, dur: 2, vel: 0.36 },
      { at: 8, dur: 2, vel: 0.44 }, { at: 10, dur: 2, vel: 0.36 },
      { at: 12, dur: 2, vel: 0.42 }, { at: 14, dur: 2, vel: 0.36 },
    ] },
  ],
  drums: [
    /**
     * Motorik: the kick on all four, the hat on every eighth, the snare on the
     * backbeat and no variation of any kind for the length of the piece. It is
     * a groove rather than a genre, which is why it is one row in a table here
     * and not a sixth style.
     */
    { name: 'motorik', weight: 6, voices: {
      bd: [0, 4, 8, 12],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'eight-oh-eight', weight: 5, voices: {
      bd: [0, 10],
      sd: [8],
      cp: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      cb: [4, 12],
    } },
    { name: 'open-hat-four', weight: 4, voices: {
      bd: [0, 4, 8, 12],
      oh: [2, 6, 10, 14],
      rim: [8],
    } },
    { name: 'metal-on-metal', weight: 3, voices: {
      bd: [0, 8],
      sd: [8],
      cb: [0, 3, 6, 9, 12],
      hh: [4, 12],
    } },
  ],
  melody: { leap: 0.1, ornament: 0.02, span: 7, sequence: 0.9, syncopation: 0.05 },
};

/**
 * COSMIC — Moroder, *Équinoxe* part 5, Space, and everything else that put a
 * four-on-the-floor kick under a sequencer.
 *
 * The euphoric one, and the only style in the genre that leans major:
 * `modeWeights` puts major at 0.6, so `progressions` is the *major* table here
 * and `minorProgressions` is the override — the reverse of every other style in
 * this file. That is not a formatting detail. A minor-primary table read as the
 * default would make this the same music as `berlin` at a slightly higher tempo,
 * and the difference between "I Feel Love" and a Tangerine Dream side is
 * entirely that one of them is in a major key and going somewhere.
 *
 * The mechanism is one number: `sequence-2-bar` runs sixteenths on `cycle: 32`
 * over a kick that is bar-shaped and lands on all four beats. Two bars against
 * one, so the sequence states itself twice per turn of the figure and the kick
 * arrives underneath a different step of it each bar. Every element pointing the
 * same way would be a machine; these two disagreeing is a groove.
 *
 * Instrumental — `excludeLayers` names `vocal` deliberately, because the vocal
 * layer here would be a wordless sung line and this repertoire's voices are
 * either a vocoder or a session singer with a lyric, neither of which this
 * generator has. Fills stay on: this is arrival music, and the crash into the
 * chorus is the arrival.
 */
const cosmic: Style = {
  id: 'cosmic',
  label: 'Cosmic disco',
  description:
    'Four-on-the-floor under a running sixteenth-note sequence two bars long, bright and major-leaning, built around the moment the chorus arrives.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [118, 130],
  swing: 0,
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  requireLayers: ['comp'],
  excludeLayers: ['vocal'],
  filter: { depth: 0.45, shape: 'ramp' },
  /**
   * The major table, because major is this style's primary mode. Everything else
   * in the genre has minor here.
   */
  progressions: {
    intro: [
      { chords: ['I', 'I', 'IV', 'IV'], weight: 4 },
      { chords: ['Imaj7', 'Imaj7', 'vi7', 'vi7'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'I', 'vi', 'vi', 'IV', 'IV', 'V', 'V'], weight: 5, note: 'The disco round: four chords, two bars each, and the arrival is the fourth one' },
      { chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7'], weight: 4 },
      { chords: ['vi7', 'vi7', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 4 },
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'V', 'V', 'I', 'I', 'I', 'I'], weight: 5, note: 'The arrival. Everything before it in the form is a run-up, and it is the one cadence this genre takes at face value' },
      { chords: ['IV', 'IV', 'I', 'I', 'IV', 'IV', 'V', 'V'], weight: 4 },
      { chords: ['vi7', 'vi7', 'V', 'V', 'IV', 'IV', 'I', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['ii7', 'ii7', 'V', 'V', 'vi7', 'vi7', 'IV', 'IV'], weight: 4 },
      { chords: ['bVI', 'bVI', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['IV', 'V', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'I', 'I'], weight: 2 },
    ],
  },
  minorProgressions: {
    intro: [{ chords: ['i', 'i', 'VI', 'VI'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 5 },
      { chords: ['i9', 'i9', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5, note: 'Modal even here: the euphoria comes from the kick and the filter opening, not from a chord that wants to resolve' },
      { chords: ['III', 'III', 'VII', 'VII', 'VI', 'VI', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'III', 'III'], weight: 4 }],
    outro: [{ chords: ['VII', 'VII', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [8, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [-8, 8], weight: 3 },
    { cell: [2, 2, 4, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [16], weight: 3 },
    { cell: [-2, 2, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    /** Octaves on the eighths, which is the disco bass and is bar-shaped
     *  because the kick is: these two are meant to agree, and the sequence
     *  above them is the thing that does not. */
    { name: 'octave-pump', weight: 6, hits: [
      { at: 0, dur: 1, tone: 'root', vel: 0.96 },
      { at: 2, dur: 1, tone: 'octave', vel: 0.78 },
      { at: 4, dur: 1, tone: 'root', vel: 0.9 },
      { at: 6, dur: 1, tone: 'octave', vel: 0.78 },
      { at: 8, dur: 1, tone: 'root', vel: 0.94 },
      { at: 10, dur: 1, tone: 'octave', vel: 0.78 },
      { at: 12, dur: 1, tone: 'root', vel: 0.9 },
      { at: 14, dur: 1, tone: 'octave', vel: 0.78 },
    ] },
    { name: 'offbeat-eighths', weight: 4, hits: [
      { at: 2, dur: 1, tone: 'root', vel: 0.88 },
      { at: 6, dur: 1, tone: 'root', vel: 0.84 },
      { at: 10, dur: 1, tone: 'fifth', vel: 0.86 },
      { at: 14, dur: 1, tone: 'root', vel: 0.84 },
    ] },
    { name: 'driving-quarters', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.96 },
      { at: 4, dur: 3, tone: 'root', vel: 0.84 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.9 },
      { at: 12, dur: 3, tone: 'seventh', vel: 0.82 },
    ] },
  ],
  comp: [
    /**
     * Thirty-two sixteenth steps against a one-bar kick. The sequence is the
     * only element in the arrangement that is not bar-shaped, which is why it
     * sounds like it is running *through* the track rather than sitting on it.
     */
    { name: 'sequence-2-bar', weight: 6, voices: 4, arpeggio: true, cycle: 32, hits: [
      { at: 0, dur: 1, vel: 0.52 }, { at: 1, dur: 1, vel: 0.36 }, { at: 2, dur: 1, vel: 0.44 }, { at: 3, dur: 1, vel: 0.36 },
      { at: 4, dur: 1, vel: 0.48 }, { at: 5, dur: 1, vel: 0.36 }, { at: 6, dur: 1, vel: 0.44 }, { at: 7, dur: 1, vel: 0.36 },
      { at: 8, dur: 1, vel: 0.48 }, { at: 9, dur: 1, vel: 0.36 }, { at: 10, dur: 1, vel: 0.44 }, { at: 11, dur: 1, vel: 0.36 },
      { at: 12, dur: 1, vel: 0.48 }, { at: 13, dur: 1, vel: 0.36 }, { at: 14, dur: 1, vel: 0.44 }, { at: 15, dur: 1, vel: 0.36 },
      { at: 16, dur: 1, vel: 0.52 }, { at: 17, dur: 1, vel: 0.36 }, { at: 18, dur: 1, vel: 0.44 }, { at: 19, dur: 1, vel: 0.36 },
      { at: 20, dur: 1, vel: 0.48 }, { at: 21, dur: 1, vel: 0.36 }, { at: 22, dur: 1, vel: 0.44 }, { at: 23, dur: 1, vel: 0.36 },
      { at: 24, dur: 1, vel: 0.48 }, { at: 25, dur: 1, vel: 0.36 }, { at: 26, dur: 1, vel: 0.44 }, { at: 27, dur: 1, vel: 0.36 },
      { at: 28, dur: 1, vel: 0.48 }, { at: 29, dur: 1, vel: 0.36 }, { at: 30, dur: 1, vel: 0.44 }, { at: 31, dur: 1, vel: 0.36 },
    ] },
    { name: 'sequence-eighths', weight: 4, voices: 3, arpeggio: true, hits: [
      { at: 0, dur: 2, vel: 0.48 }, { at: 2, dur: 2, vel: 0.36 },
      { at: 4, dur: 2, vel: 0.44 }, { at: 6, dur: 2, vel: 0.36 },
      { at: 8, dur: 2, vel: 0.46 }, { at: 10, dur: 2, vel: 0.36 },
      { at: 12, dur: 2, vel: 0.44 }, { at: 14, dur: 2, vel: 0.36 },
    ] },
    /** The string chop on the offbeats — the one thing in this style that came
     *  from a room full of players rather than out of a rack. */
    { name: 'string-chop', weight: 4, voices: 4, hits: [
      { at: 2, dur: 2, vel: 0.46 },
      { at: 6, dur: 2, vel: 0.42 },
      { at: 10, dur: 2, vel: 0.46 },
      { at: 14, dur: 2, vel: 0.42 },
    ] },
  ],
  drums: [
    { name: 'four-floor', weight: 6, voices: {
      bd: [0, 4, 8, 12],
      sd: [4, 12],
      oh: [2, 6, 10, 14],
      hh: [0, 4, 8, 12],
    } },
    { name: 'four-floor-sixteenths', weight: 5, voices: {
      bd: [0, 4, 8, 12],
      cp: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    } },
    { name: 'disco-shuffle', weight: 4, voices: {
      bd: [0, 4, 8, 12],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      oh: [6, 14],
    } },
    { name: 'shaker-floor', weight: 3, voices: {
      bd: [0, 4, 8, 12],
      sh: [0, 2, 4, 6, 8, 10, 12, 14],
      rim: [4, 12],
    } },
  ],
  melody: { leap: 0.18, ornament: 0.08, span: 12, sequence: 0.6, syncopation: 0.35 },
};

/**
 * STALKER — John Carpenter, and Goblin.
 *
 * *Halloween*, *Escape from New York*, *Assault on Precinct 13*; *Profondo
 * rosso* and *Suspiria*. The ostinato **is** the composition: the bass figure
 * arrives first, nothing is added for sixteen bars, and when something is added
 * it is one held chord. Everything else in this file has a tune over an
 * accompaniment. This one has a figure, and whatever else happens is commentary
 * on it — hence `requireLayers: ['bass']`, which is the only place in the genre
 * that declaration is load-bearing.
 *
 * `cycle: 20` is the style. Twenty sixteenths is five beats against a four-beat
 * bar: the figure lands on the downbeat, then on beat 2, then on beat 3, and
 * comes home every fourth bar. That slow rotation is precisely this music's
 * unease — a listener can feel that something does not fit and cannot say what.
 *
 * **It is not written in 5/4, and that was considered.** `beatsPerBar` is a
 * property of the *style*, not of a pattern, so "some of its patterns in five"
 * is not a thing the type can express; and writing the whole style in 5/4 would
 * make `cycle: 20` exactly one bar long, which is the one value at which the
 * figure stops drifting and the entire effect disappears. Four-four is what
 * makes twenty interesting. Carpenter agrees: *Halloween* is famously in 5/4 and
 * *Escape from New York* is not, and it is the second one this style is built on.
 *
 * `drumFills: false` and `hook: 'earworm'`. Nothing announces a section, and
 * what comes back comes back identical, because the horror is the repetition.
 */
const stalker: Style = {
  id: 'stalker',
  label: 'Stalker',
  description:
    'Horror-score minimalism: one bass ostinato five beats long against a four-beat bar, ♭II and the tritone above it, a sparse machine and no fills at all.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [84, 104],
  swing: 0,
  modeWeights: { minor: 0.92, major: 0.08 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  drumFills: false,
  requireLayers: ['bass'],
  excludeLayers: ['brass'],
  /** Two beats between answering notes. What replies to an ostinato is a shape
   *  in the distance, not a second line. */
  counterSpacing: 2,
  filter: { depth: 0.35, shape: 'step' },
  progressions: {
    intro: [
      { chords: ['i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'bII', 'bII'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 5, note: 'The Phrygian ♭II leaning down from a semitone above and never resolving — Carpenter\'s entire harmonic vocabulary in one move' },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 4, note: 'One chord for eight bars, which is the one place this genre borrows from ambient: when the ostinato is the composition, a change of harmony is an interruption' },
      { chords: ['i', 'i', 'VI', 'VI', 'i', 'i', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'i', '#IV', '#IV', 'i', 'i', 'bII', 'bII'], weight: 3, note: 'The tritone: a major triad six semitones above the tonic, which belongs to no mode of the key and is exactly why it is here' },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'VI', 'VI', 'bII', 'bII', 'i', 'i'], weight: 4 },
      { chords: ['#IV', '#IV', 'bII', 'bII', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['bII', 'bII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i'], weight: 3 },
    ],
  },
  /**
   * Major, rarely, and still wrong on purpose. A borrowed minor `iv` and the
   * Neapolitan keep it from ever reading as relief — a Goblin cue in a major key
   * is more frightening than one in minor, not less.
   */
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'bII', 'bII'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'bVI', 'bVI', 'bVII', 'bVII', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'iv', 'iv', 'I', 'I', 'bII', 'bII'], weight: 3, note: 'The minor iv borrowed into a major key — one chord, and the light goes out' },
    ],
    chorus: [
      { chords: ['bVI', 'bVI', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 4 },
      { chords: ['bII', 'bII', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'bVI', 'bVI', 'bII', 'bII', 'I', 'I'], weight: 4 }],
    outro: [{ chords: ['bII', 'bII', 'I', 'I'], weight: 4 }],
  },
  /**
   * Late, short and mostly absent. The lead in this style is not a tune, it is
   * an intrusion, and every cell either starts after the downbeat or holds a
   * single note through the bar.
   */
  melodyCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 12], weight: 4 },
    { cell: [-12, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [-8, 4, 4], weight: 3 },
    { cell: [2, 2, 12], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 3 },
    { cell: [-4, 12], weight: 2 },
  ],
  bass: [
    /**
     * Five beats against four. Twenty sixteenths, so the figure's head walks a
     * beat later through every bar and returns to the downbeat every fourth one.
     * The shape is deliberately plain — root, root, octave, root, fifth, held
     * root — because the drift has to be the only thing the listener notices,
     * and a figure with its own melodic interest would hide it.
     */
    { name: 'twenty', weight: 7, cycle: 20, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.98 },
      { at: 2, dur: 2, tone: 'root', vel: 0.8 },
      { at: 4, dur: 2, tone: 'octave', vel: 0.86 },
      { at: 8, dur: 2, tone: 'root', vel: 0.84 },
      { at: 12, dur: 2, tone: 'fifth', vel: 0.88 },
      { at: 16, dur: 4, tone: 'root', vel: 0.82 },
    ] },
    /**
     * The four-bar version, for the sections that need the figure to agree with
     * the barline: sixty-four sixteenths, which *is* four bars, so it settles.
     * The pair matters — a style where the ostinato always drifts has no way to
     * stop drifting, and stopping is what makes the drift mean anything.
     */
    { name: 'four-bar-crawl', weight: 4, cycle: 64, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 0.96 },
      { at: 8, dur: 4, tone: 'root', vel: 0.82 },
      { at: 16, dur: 4, tone: 'seventh', vel: 0.86 },
      { at: 24, dur: 4, tone: 'root', vel: 0.8 },
      { at: 32, dur: 4, tone: 'fifth', vel: 0.9 },
      { at: 40, dur: 4, tone: 'root', vel: 0.8 },
      { at: 48, dur: 4, tone: 'octave', vel: 0.86 },
      { at: 56, dur: 8, tone: 'root', vel: 0.84 },
    ] },
    { name: 'eighth-pulse', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.94 },
      { at: 4, dur: 3, tone: 'root', vel: 0.78 },
      { at: 8, dur: 3, tone: 'root', vel: 0.86 },
      { at: 12, dur: 3, tone: 'root', vel: 0.78 },
    ] },
  ],
  comp: [
    /** One chord, arriving late in the bar and gone again. Half of what this
     *  style's harmony ever does. */
    { name: 'late-stab', weight: 5, voices: 3, hits: [
      { at: 6, dur: 2, vel: 0.4 },
      { at: 14, dur: 2, vel: 0.36 },
    ] },
    { name: 'held', weight: 5, voices: 3, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.34 }] },
    { name: 'downbeat-only', weight: 3, voices: 4, hits: [{ at: 0, dur: 6, vel: 0.42 }] },
  ],
  drums: [
    /** No kit at all, and weighted high. The figure and a held chord is the
     *  whole record on half of these cues. */
    { name: 'none', weight: 5, voices: {} },
    { name: 'rim-and-hat', weight: 4, voices: {
      rim: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'menace', weight: 4, voices: {
      bd: [0, 10],
      rim: [8],
      sh: [2, 6, 10, 14],
    } },
    /**
     * A three-beat hat cycle under a four-beat bar. It agrees with the barline
     * every fourth bar and with the bass ostinato — five beats long — every
     * fifteenth, which is longer than most sections. Two things drifting at
     * different rates is the sound of a machine nobody is minding.
     */
    { name: 'hat-against-four', weight: 3, cycle: 12, voices: {
      hh: [0, 6],
    } },
  ],
  melody: { leap: 0.15, ornament: 0.03, span: 10, sequence: 0.7, syncopation: 0.15 },
};

export const STYLES: Record<string, Style> = {
  berlin, cinematic, machine, cosmic, stalker,
};
