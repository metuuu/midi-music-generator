/**
 * The vintage-electronic catalogue, 1972–1990.
 *
 * Organised by *what composes the music*, because in this repertoire that is a
 * different thing in every corner of it and it is never the melody. A Tangerine
 * Dream side is composed by the sequencer; a Vangelis cue by a player with two
 * hands on a CS-80; a Kraftwerk single by its bass line; a Moroder record by the
 * kick drum; a Carpenter title sequence by one ostinato that never stops. Sort
 * this music by mood or by tempo and the six collapse into two. Sort it by
 * which machine is in charge and they stay six.
 *
 * `optical` is the sixth and the one that does not fit that sentence cleanly,
 * which is why it is argued at length where it is defined rather than here. The
 * short version: it is composed by the sequencer, exactly as `berlin` is, and it
 * is a different record because the machine it is running on has no filter to
 * open. When the genre's signature gesture becomes physically unavailable, what
 * replaces it is not a variation on the style — it is the next style.
 *
 * ## How much of each style is a table row
 *
 * Every one of these has three to seven figures per layer, and that is the
 * deliberate second axis. A style is a claim about *what makes the music*; the
 * rows underneath it are the records that claim covers, and they are not
 * interchangeable — `machine`'s four bass figures are 1974, 1977, 1981 and 1983,
 * and the header on that style names which is which. One figure per layer would
 * have made every song in a style the same song with a different tune on it,
 * which is what a generator sounds like when it is caught.
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
 *  - **Nothing swings.** `swing: 0` on all six. The sequencer is the clock, and
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
  /**
   * No brass, and the argument is about texture rather than about palette.
   *
   * The brass layer looks for a hole in the tune and stabs into it, and the
   * holes in this style's tune are not empty: a sixteenth-note sequence runs
   * through them and a second sequence phases against that. A stab placed there
   * is a third thing arriving on top of two that never stop, not an answer to
   * anything. What announces a section here is the filter opening across
   * sixteen bars, which is the one gesture this style was built to make and the
   * one a horn would be competing with.
   */
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
      { chords: ['isus2', 'isus2', 'isus2', 'isus2'], weight: 3, note: 'One chord for four bars while the sequence establishes itself — on this side of the repertoire the introduction is a machine being switched on, not a harmony being stated' },
      { chords: ['iv', 'iv', 'i', 'i'], weight: 2 },
    ],
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5, note: 'Aeolian rocking two bars at a time: the seventh is natural, a whole tone below the tonic, and nothing leads anywhere' },
      { chords: ['i9', 'i9', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'III', 'III', 'iv', 'iv', 'VII', 'VII'], weight: 3 },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'VII', 'VII'], weight: 4, note: 'Two chords, four bars each, for eight bars — the whole harmonic content of an *Oxygène* side, and the slowest this style is allowed to move before it becomes ambient' },
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'VII', 'VII'], weight: 3, note: 'Plagal rocking with the ninth left on: minor, and still nowhere near a dominant' },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VI'], weight: 3, note: 'The one place this style changes chord every bar rather than every two — the descending tetrachord walked at double the usual rate, which is what the long middle of a Berlin side does when it finally moves' },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5, note: '♭VI–♭VII–i, the cadence this whole genre uses where another would put a dominant' },
      { chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['VI', 'VI', 'III', 'III', 'VII', 'VII', 'i9', 'i9'], weight: 3 },
      { chords: ['III', 'III', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 3, note: 'It arrives on the relative major rather than on the tonic, and never comes home — the section is brighter and the key has not changed' },
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'III', 'III'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'VII', 'VII', 'III', 'III', 'VI', 'VI'], weight: 4 },
      { chords: ['bII', 'bII', 'i', 'i', 'bII', 'bII', 'VII', 'VII'], weight: 3, note: 'The Phrygian ♭II a semitone above the tonic — the darkest chord available without leaving the mode behind entirely' },
      { chords: ['VI', 'VI', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 3 },
      { chords: ['III', 'III', 'VI', 'VI', 'iv', 'iv', 'VII', 'VII'], weight: 2 },
    ],
    outro: [
      { chords: ['VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i9', 'i9', 'i9', 'i9'], weight: 2 },
      { chords: ['VI', 'VII', 'i', 'i'], weight: 3 },
      { chords: ['iv', 'iv', 'i', 'i'], weight: 2 },
    ],
  },
  majorProgressions: {
    intro: [
      { chords: ['I', 'I', 'bVII', 'bVII'], weight: 4 },
      { chords: ['Isus2', 'Isus2', 'IVsus2', 'IVsus2'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 5, note: 'The double-plagal I–♭VII–IV–I: mixolydian, and the major-key equivalent of refusing the dominant' },
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'bVII', 'bVII'], weight: 4 },
      { chords: ['I', 'I', 'V', 'V', 'vi', 'vi', 'IV', 'IV'], weight: 3 },
      { chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'bVII', 'bVII'], weight: 4, note: 'The two-chord rock again, in major. A sequence over one chord for four bars is the sound of the machine being the subject, and the mode is the only thing that decides whether it reads as menace or as weather' },
      { chords: ['Isus2', 'Isus2', 'iii', 'iii', 'IV', 'IV', 'bVII', 'bVII'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'V', 'V', 'I', 'I', 'I', 'I'], weight: 4 },
      { chords: ['bVI', 'bVI', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 4, note: 'Both chords borrowed out of the parallel minor, which is how a major-key sequence stays cold' },
      { chords: ['I', 'I', 'IV', 'IV', 'bVII', 'bVII', 'IV', 'IV'], weight: 3 },
    ],
    bridge: [
      { chords: ['bVII', 'bVII', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 3 },
      { chords: ['vi', 'vi', 'iii', 'iii', 'IV', 'IV', 'V', 'V'], weight: 3 },
      { chords: ['IV', 'IV', 'bVI', 'bVI', 'bVII', 'bVII', 'I', 'I'], weight: 2 },
    ],
    outro: [
      { chords: ['bVII', 'bVII', 'I', 'I'], weight: 4 },
      { chords: ['IV', 'IV', 'I', 'I'], weight: 3 },
    ],
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
    { cell: [6, 2, 8], weight: 3 },
    { cell: [-2, 6, 8], weight: 2 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [4, 12], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 2 },
    { cell: [-8, 8], weight: 2 },
    { cell: [12, 4], weight: 2 },
  ],
  /**
   * The floor, and the three that hold still are still the majority of it.
   *
   * Everything that drifts in this style drifts above the bass — the sequence and
   * the counter-sequence — and a floor that moved with them would leave nothing
   * for them to move *against*. That argument is exactly as good as it ever was
   * and it is why `eighth-pulse` still carries the most weight here.
   *
   * What it does not survive is being read as a claim about the whole school.
   * The other half of this repertoire hands the bass to the sequencer as well —
   * *Oxygène*'s low line is a sixteenth-note figure a bar and a half long, not a
   * pulse — and the era tables have said so all along: `sequenced: { bass: 0.55 }`
   * means better than half of these songs have nobody playing the bass by hand.
   * The three cycled figures below are what that number was describing, and
   * without them a sequenced bass was still a bar-shaped one.
   *
   * They are deliberately kept away from the comp's cycle lengths. Sixty-four
   * against twenty-four is the sequence coming home every fourth pass of the bass
   * and the bass every eighth pass of the bar, and *neither* of them agreeing
   * with the harmony, which is three clocks rather than two.
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
    /**
     * The bass as a sequencer: twenty-four sixteenths, which is a bar and a half,
     * so the figure's head alternates between the downbeat and the middle of the
     * bar and comes home every third one. The *Oxygène* low line, and the one
     * bass figure in the style that is itself a machine rather than a floor under
     * one.
     */
    { name: 'sequenced-bass', weight: 4, cycle: 24, hits: [
      { at: 0, dur: 1, tone: 'root', vel: 0.96 },
      { at: 2, dur: 1, tone: 'root', vel: 0.76 },
      { at: 4, dur: 1, tone: 'octave', vel: 0.86 },
      { at: 6, dur: 1, tone: 'root', vel: 0.74 },
      { at: 8, dur: 1, tone: 'fifth', vel: 0.88 },
      { at: 10, dur: 1, tone: 'root', vel: 0.74 },
      { at: 12, dur: 1, tone: 'octave', vel: 0.84 },
      { at: 16, dur: 1, tone: 'fifth', vel: 0.86 },
      { at: 18, dur: 1, tone: 'root', vel: 0.74 },
      { at: 20, dur: 3, tone: 'root', vel: 0.9 },
    ] },
    /**
     * Three beats. The shortest cycle in the style's floor, and the cheapest way
     * it has of making a four-bar phrase refuse to sit still: the figure lands on
     * beat 1, then beat 4, then beat 3, then beat 2, and takes three bars to come
     * back — which is the *Magnetic Fields* pulse, and is a different unease from
     * `stalker`'s five because it rotates the other way.
     */
    { name: 'three-beat', weight: 3, cycle: 12, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.95 },
      { at: 4, dur: 3, tone: 'root', vel: 0.78 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.86 },
    ] },
    /**
     * Two bars that climb. Root and octave in the first, seventh and fifth
     * falling back through the second, so the halves answer each other the way
     * `machine`'s hook does — but in eighths and at half the density, because
     * this style's bass is holding a floor rather than carrying the tune.
     */
    { name: 'two-bar-climb', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.95 },
      { at: 4, dur: 3, tone: 'root', vel: 0.78 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.86 },
      { at: 12, dur: 3, tone: 'octave', vel: 0.78 },
      { at: 16, dur: 3, tone: 'seventh', vel: 0.9 },
      { at: 20, dur: 3, tone: 'fifth', vel: 0.76 },
      { at: 24, dur: 3, tone: 'third', vel: 0.84 },
      { at: 28, dur: 3, tone: 'root', vel: 0.78 },
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
    /**
     * Fourteen steps: seven eighths, which is one eighth short of two bars.
     *
     * The oldest trick a step sequencer has and the one this style had no row
     * for — you set eight knobs, then switch the last step off. The figure walks
     * an eighth earlier every time it comes round and takes sixteen bars to
     * return to the downbeat, which is slower drift than anything else in the
     * comp table and is a different sensation from it: the four-bar sequence
     * *rotates* and this one *slips*.
     *
     * Three voices over two octaves is six rungs, and six against fourteen shares
     * only a factor of two, so the ladder and the cycle need twenty-one passes to
     * agree — longer than any section this genre writes.
     */
    { name: 'sequence-seven-eighths', weight: 4, voices: 3, arpeggio: true, arpDirection: 'updown', arpOctaves: 2, cycle: 14, hits: [
      { at: 0, dur: 2, vel: 0.52 }, { at: 2, dur: 2, vel: 0.36 },
      { at: 4, dur: 2, vel: 0.46 }, { at: 6, dur: 2, vel: 0.36 },
      { at: 8, dur: 2, vel: 0.46 }, { at: 10, dur: 2, vel: 0.36 },
      { at: 12, dur: 2, vel: 0.44 },
    ] },
    /**
     * Three bars of sixteenths, falling and then rising. The longest figure in
     * the genre: forty-eight steps against harmony that moves every two bars
     * means the sequence and the chords agree only every six, so a sixteen-bar
     * section never hears the same pass twice.
     *
     * `downup` rather than `updown` because a figure this long needs to start
     * somewhere the ear can find, and the top of a two-octave ladder is the one
     * place a sixteenth-note stream is unambiguous.
     */
    { name: 'sequence-3-bar', weight: 3, voices: 4, arpeggio: true, arpDirection: 'downup', arpOctaves: 2, cycle: 48, hits: [
      { at: 0, dur: 1, vel: 0.54 }, { at: 1, dur: 1, vel: 0.36 }, { at: 2, dur: 1, vel: 0.42 }, { at: 3, dur: 1, vel: 0.36 },
      { at: 4, dur: 1, vel: 0.48 }, { at: 5, dur: 1, vel: 0.36 }, { at: 6, dur: 1, vel: 0.42 },
      { at: 8, dur: 1, vel: 0.48 }, { at: 9, dur: 1, vel: 0.36 }, { at: 10, dur: 1, vel: 0.42 }, { at: 11, dur: 1, vel: 0.36 },
      { at: 12, dur: 1, vel: 0.48 }, { at: 13, dur: 1, vel: 0.36 }, { at: 14, dur: 1, vel: 0.42 },
      { at: 16, dur: 1, vel: 0.52 }, { at: 17, dur: 1, vel: 0.36 }, { at: 18, dur: 1, vel: 0.42 }, { at: 19, dur: 1, vel: 0.36 },
      { at: 20, dur: 1, vel: 0.48 }, { at: 21, dur: 1, vel: 0.36 }, { at: 22, dur: 1, vel: 0.42 }, { at: 23, dur: 1, vel: 0.36 },
      { at: 24, dur: 1, vel: 0.48 }, { at: 25, dur: 1, vel: 0.36 }, { at: 26, dur: 1, vel: 0.42 },
      { at: 28, dur: 1, vel: 0.48 }, { at: 29, dur: 1, vel: 0.36 }, { at: 30, dur: 1, vel: 0.42 }, { at: 31, dur: 1, vel: 0.36 },
      { at: 32, dur: 1, vel: 0.52 }, { at: 33, dur: 1, vel: 0.36 }, { at: 34, dur: 1, vel: 0.42 },
      { at: 36, dur: 1, vel: 0.48 }, { at: 37, dur: 1, vel: 0.36 }, { at: 38, dur: 1, vel: 0.42 }, { at: 39, dur: 1, vel: 0.36 },
      { at: 40, dur: 1, vel: 0.48 }, { at: 41, dur: 1, vel: 0.36 }, { at: 42, dur: 1, vel: 0.42 }, { at: 43, dur: 1, vel: 0.36 },
      { at: 44, dur: 1, vel: 0.48 }, { at: 45, dur: 1, vel: 0.36 }, { at: 46, dur: 1, vel: 0.42 },
    ] },
    /**
     * The one comp in this style that is not a sequence, and the reason it earns
     * a row is that the style has three bass figures that are.
     *
     * Two sequencers running at once is the school's texture; three is porridge.
     * When the floor has taken the sixteenths — `sequenced-bass`, `three-beat` —
     * what the chordal part should do is hold still and let the counter figure be
     * the thing that moves. Whole chords on the eighths, no ladder, no cycle.
     */
    { name: 'gate-chords', weight: 2, voices: 4, hits: [
      { at: 0, dur: 2, vel: 0.46 }, { at: 2, dur: 2, vel: 0.34 },
      { at: 4, dur: 2, vel: 0.42 }, { at: 6, dur: 2, vel: 0.34 },
      { at: 8, dur: 2, vel: 0.44 }, { at: 10, dur: 2, vel: 0.34 },
      { at: 12, dur: 2, vel: 0.42 }, { at: 14, dur: 2, vel: 0.34 },
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
    /**
     * Ten sixteenths — two and a half beats — in sixteenths rather than eighths,
     * so this is the fastest thing in the arrangement and the one that reads as a
     * shimmer rather than as a line. Two octaves of ladder against five steps
     * means it needs eight passes to repeat, which is twenty bars.
     */
    { name: 'phase-10', weight: 4, voices: 3, arpeggio: true, arpOctaves: 2, cycle: 10, hits: [
      { at: 0, dur: 1, vel: 0.44 }, { at: 2, dur: 1, vel: 0.34 },
      { at: 4, dur: 1, vel: 0.4 }, { at: 6, dur: 1, vel: 0.34 },
      { at: 8, dur: 1, vel: 0.4 },
    ] },
    /**
     * Fourteen against the comp's own fourteen — deliberately the same length,
     * and the only pair in the style that is.
     *
     * Two figures of equal cycle drifting together against the bar is the other
     * Berlin texture and it is not the same as two figures phasing apart: they
     * stay locked to each other and the *pair* slips against the barline, which
     * is what happens when one player patches both sequencers off one clock.
     * `downup` keeps them from sounding like one part doubled — same length,
     * opposite contour.
     */
    { name: 'phase-14', weight: 3, voices: 4, arpeggio: true, arpDirection: 'downup', cycle: 14, hits: [
      { at: 0, dur: 2, vel: 0.44 }, { at: 2, dur: 2, vel: 0.34 },
      { at: 4, dur: 2, vel: 0.4 }, { at: 6, dur: 2, vel: 0.34 },
      { at: 8, dur: 2, vel: 0.4 }, { at: 10, dur: 2, vel: 0.34 },
      { at: 12, dur: 2, vel: 0.38 },
    ] },
    /** Eighteen: a bar and an eighth, in quarters. The slowest counter figure
     *  here, for the sections where the main sequence is already in sixteenths
     *  and a second fast part would only thicken it. */
    { name: 'phase-18', weight: 2, voices: 3, arpeggio: true, arpOctaves: 2, cycle: 18, hits: [
      { at: 0, dur: 3, vel: 0.44 }, { at: 4, dur: 3, vel: 0.34 },
      { at: 8, dur: 3, vel: 0.4 }, { at: 12, dur: 3, vel: 0.34 },
      { at: 16, dur: 2, vel: 0.38 },
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
    /** The clap on the backbeat and the kick pushed off it — the programmed box
     *  playing what a drummer would not, which is the half of this school that
     *  arrives once the machine is one you write a bar into rather than one you
     *  patch. */
    { name: 'clap-backbeat', weight: 4, voices: {
      bd: [0, 6, 11],
      cp: [8],
      hh: [2, 6, 10, 14],
      oh: [14],
    } },
    /** No kick at all. A sixteenth hat over a sequenced bass has all the pulse it
     *  needs, and taking the floor out is how the long middle of one of these
     *  sides gets somewhere without anything being added. */
    { name: 'no-floor', weight: 3, voices: {
      rim: [8],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    } },
    /**
     * A kit that drifts, which nothing else in the genre's percussion does except
     * `stalker`'s hat.
     *
     * Twenty-four sixteenths is a bar and a half: the kick alternates between the
     * downbeat and the middle of the bar and the snare answers it a beat late,
     * so the backbeat lands on 3 and then on 1 and the ear cannot decide which
     * bar it is in. Weighted low — this is the pattern for one song in eight, not
     * the house style — but it is the only one here that makes the *machine*
     * sound uncertain rather than the harmony.
     */
    { name: 'drift-kit', weight: 2, cycle: 24, voices: {
      bd: [0, 12],
      sd: [8, 20],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22],
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
 *
 * **There is no `excludeLayers` here, and three of the other five styles
 * exclude `brass`.** That absence is the point. What the brass layer writes is
 * two gestures — a swell that arrives with a held melody note and leaves with
 * it, and a stab pushed off the barline into a hole in the tune — and the first
 * of them is this style: a synth-brass swell coming up under a long CS-80 line
 * is what the `polysynth` era's brass palette was written for, and it is the
 * half of the lifted final chorus that `keyChangeChance` cannot supply by
 * itself. The tone up is the modulation; the brass and the choir arriving on
 * top of it are the arrival.
 *
 * It lands here more often than it could anywhere else in the genre, and the
 * reason is mechanical rather than a matter of taste — which is why this is the
 * style to put it on. `generateBrass` swells under notes of two beats or more
 * that start near the barline, and `melodyCells` below is whole bars. Nothing
 * else in the catalogue hands it that many long notes to swell under.
 *
 * The three that exclude it argue it at each site, and none of them is refusing
 * the *timbre*: `synthBrass` sits in the era `melody` palettes, so a style with
 * no brass layer can still have a synth-brass lead. What they refuse is a
 * separate arranged part punctuating them.
 */
const cinematic: Style = {
  /**
   * An arrival exists in this music; a break does not, and a band shot needs a
   * band. What a sequencer sequence can do at a join is get there early.
   */
  transitions: [['fill', 4], ['elide', 1]],
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
  /**
   * A beat between answering notes. The gaps this lead leaves are bars long, and
   * an eighth-note reply to a four-second held note is a different piece of
   * music breaking in — the same reasoning as ambient's `wasteland`.
   */
  counterSpacing: 1,
  drumFills: false,
  /**
   * One player at one keyboard — the second shape that takes in this genre, and
   * not the same shape as `stalker`.
   *
   * That one is Carpenter: a left hand holding a *figure* while the right plays
   * the theme, which is why its modes lead with `ostinato`. This style has no
   * figure to hold and says so in its own description — one chord a bar, nothing
   * repeating underneath it — and a vamp here would turn the most identifiable
   * style in the catalogue into `berlin` with the tempo halved, which is the same
   * argument this style already makes about having no `cycle` anywhere in it. So
   * the hand sustains the harmony and now and then answers: `block` leading,
   * `answer` behind it, and neither of the other two offered at all.
   *
   * `density: 0.35`, lower than the trio's 0.92 and lower than `stalker`'s 0.55,
   * and it is the right hand that sets it. This lead holds one note for most of a
   * bar, so the left hand moving underneath *is* the event — the whole thing that
   * happens in that bar. A hand speaking at every opportunity would be busier
   * than the tune it is accompanying, which is not this music.
   *
   * This was tried once before and reverted, and the reason recorded for the
   * revert was wrong, so it is worth correcting here. It was not that the left
   * hand was being counted as the tune: measured both ways on the same songs, the
   * gap heuristic and `NoteEvent.hand` read this style's line identically, because
   * `HANDS.leadVoice` voices a quartal dyad five semitones wide under fourteen
   * semitones of daylight and `isChord` never lets it sound alone.
   *
   * What actually moves is the music. `twoHanded.instruments` overrides the era's
   * palette and `HandSpec.lead` puts the tune an octave up, so this style gets a
   * different lead playing a different tune — which is the change being asked
   * for, and not a measurement artefact. Two genre checks read the difference as a
   * regression, and both were sampling too little to tell: one asserted a zero
   * that held across the twenty songs it drew and failed on seventeen songs in
   * two hundred, and the other was resolving a four-tenths-of-a-point ordering
   * out of noise of the same size.
   */
  twoHanded: {
    /** As `stalker`: the CS-80 first, because it is the one that sounds played. */
    instruments: [['leadVoice', 5], ['leadSaw', 3], ['leadSquare', 2]],
    density: 0.35,
    modes: [['block', 5], ['answer', 3]],
  },
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
      { chords: ['i9', 'i9', 'i9', 'i9', 'VImaj7', 'VImaj7', 'VImaj7', 'VImaj7'], weight: 3, note: 'Two chords, four bars each. The slowest this style moves, and where it goes when the line above it is the whole event' },
      { chords: ['isus4', 'isus2', 'i9', 'i9', 'ivsus4', 'iv9', 'iv9', 'iv9'], weight: 3, note: 'The suspension resolving downward into the chord it was already standing on — a hand on a weighted keyboard letting a finger off, which is the one gesture a sequencer cannot make' },
      { chords: ['i9', 'i9', 'bIImaj7', 'bIImaj7', 'i9', 'i9', 'VII', 'VII'], weight: 2, note: 'The Neapolitan taken as a major seventh rather than as a triad, which turns Carpenter\'s semitone into something closer to grief than to menace' },
    ],
    chorus: [
      { chords: ['VImaj7', 'VImaj7', 'VII', 'VII', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['iv9', 'iv9', 'VII', 'VII', 'IIImaj7', 'IIImaj7', 'VImaj7', 'VImaj7'], weight: 4 },
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'III', 'III'], weight: 3 },
      { chords: ['iv9', 'VII', 'IIImaj7', 'VImaj7', 'iv9', 'VII', 'i9', 'i9'], weight: 3, note: 'The whole aeolian circle in eight bars at a chord a bar — the closest this harmony comes to a sequence going somewhere, and it still arrives plagally' },
      { chords: ['isus2', 'isus2', 'VII', 'VII', 'VImaj7', 'VImaj7', 'VII', 'VII'], weight: 3 },
    ],
    bridge: [
      { chords: ['IIImaj7', 'IIImaj7', 'VImaj7', 'VImaj7', 'iv9', 'iv9', 'i9', 'i9'], weight: 4 },
      { chords: ['iv9', 'iv9', 'bII', 'bII', 'VI', 'VI', 'VII', 'VII'], weight: 3 },
      { chords: ['VImaj7', 'VImaj7', 'IIImaj7', 'IIImaj7', 'VII', 'VII', 'iv9', 'iv9'], weight: 3 },
    ],
    solo: [
      { chords: ['i9', 'i9', 'VImaj7', 'VImaj7', 'iv9', 'iv9', 'VII', 'VII'], weight: 5 },
      { chords: ['i9', 'III', 'VII', 'iv9', 'VI', 'III', 'VII', 'i9'], weight: 3 },
      { chords: ['isus2', 'isus2', 'VImaj7', 'VImaj7', 'isus2', 'isus2', 'iv9', 'iv9'], weight: 3, note: 'The rocking two-chord solo bed. A soloist over a progression that develops has to keep up with it; over this one they are the only thing developing, which is what a lead break in this idiom is for' },
    ],
    outro: [
      { chords: ['iv9', 'VII', 'i9', 'i9'], weight: 4 },
      { chords: ['VImaj7', 'VII', 'i9', 'i9'], weight: 3 },
      { chords: ['isus4', 'isus2', 'i9', 'i9'], weight: 2 },
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
      { chords: ['Isus2', 'Isus2', 'Isus2', 'Isus2', 'bVIImaj7', 'bVIImaj7', 'bVIImaj7', 'bVIImaj7'], weight: 3, note: 'One chord for four bars and one borrowed chord for four more. Nothing in this style is slower, and it is where the very long lines go' },
      { chords: ['IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'bVImaj7', 'bVImaj7', 'bVIImaj7', 'bVIImaj7'], weight: 3 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'Isus2', 'Imaj7'], weight: 5, note: 'Plagal rocking, which is the *Chariots* cadence and is why that tune sounds like an anthem without ever cadencing' },
      { chords: ['bVImaj7', 'bVImaj7', 'bVIImaj7', 'bVIImaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['vi7', 'vi7', 'IVmaj7', 'IVmaj7', 'Isus2', 'Isus2', 'V', 'V'], weight: 3 },
      { chords: ['Imaj7', 'iii7', 'IVmaj7', 'V', 'vi7', 'iii7', 'IVmaj7', 'Imaj7'], weight: 3, note: 'A chord a bar all the way through, which at 66 BPM is still slow enough to feel like weather — this is the anthem shape, and it is the one place the style takes a dominant on the way past' },
      { chords: ['IVsus2', 'IVsus2', 'bVIImaj7', 'bVIImaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'], weight: 3 },
    ],
    bridge: [
      { chords: ['bVIImaj7', 'bVIImaj7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['ii7', 'ii7', 'IVmaj7', 'IVmaj7', 'vi7', 'vi7', 'Vsus4', 'V'], weight: 3 },
      { chords: ['vi7', 'vi7', 'bVImaj7', 'bVImaj7', 'IVmaj7', 'IVmaj7', 'Isus2', 'Isus2'], weight: 3 },
    ],
    solo: [
      { chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'bVIImaj7', 'bVIImaj7'], weight: 5 },
      { chords: ['vi7', 'iii7', 'IVmaj7', 'Imaj7', 'vi7', 'iii7', 'IVmaj7', 'IVmaj7'], weight: 3 },
      { chords: ['Isus2', 'Isus2', 'IVsus2', 'IVsus2', 'Isus2', 'Isus2', 'IVsus2', 'IVsus2'], weight: 3, note: 'Two suspended chords and nothing else for eight bars — the third is missing from both, so the soloist decides what mode the section is in' },
    ],
    outro: [
      { chords: ['IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['IVsus2', 'bVIImaj7', 'Imaj7', 'Imaj7'], weight: 2 },
      { chords: ['bVImaj7', 'bVIImaj7', 'Imaj7', 'Imaj7'], weight: 3 },
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
    /** The other way. Down from the root through the seventh to the fifth, so
     *  the floor sinks under a line that is holding still — the cheapest way this
     *  music has of making a held note feel like it is going somewhere. */
    { name: 'fall', weight: 3, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.9 },
      { at: 8, dur: 3, tone: 'seventh', vel: 0.76 },
      { at: 12, dur: 3, tone: 'fifth', vel: 0.74 },
    ] },
    /**
     * Three notes, and the last one arrives an eighth before the barline it
     * belongs to. The only anticipated bass in the genre, and it is here rather
     * than in one of the machine styles for the reason the whole style exists:
     * a person is playing this, and a person leans into the next bar.
     */
    { name: 'lean', weight: 3, hits: [
      { at: 0, dur: 6, tone: 'root', vel: 0.9 },
      { at: 8, dur: 4, tone: 'third', vel: 0.74 },
      { at: 14, dur: 4, tone: 'fifth', vel: 0.8 },
    ] },
    /** The octave, struck twice, wide apart. At this tempo two notes a bar is
     *  already a bass line with an opinion, and the leap is the opinion. */
    { name: 'octaves', weight: 2, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.92 },
      { at: 8, dur: 7, tone: 'octave', vel: 0.72 },
    ] },
  ],
  comp: [
    { name: 'held', weight: 6, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.42 }] },
    { name: 'half-bar-chords', weight: 4, voices: 4, hits: [
      { at: 0, dur: 8, vel: 0.44 },
      { at: 8, dur: 8, vel: 0.38 },
    ] },
    /**
     * The chord arrives on beat 3 and holds through the barline into the next.
     *
     * A hand deciding to place a chord *late* is the most audible thing an
     * accompanist does in this idiom and nothing else in the style's table does
     * it: `held` and `half-bar-chords` both land on the downbeat, which is where
     * the melody also is. This one leaves the top of the bar to the lead and
     * answers it halfway through, which is the accompaniment being a second
     * voice rather than a bed.
     */
    { name: 'late-chord', weight: 3, voices: 4, hits: [
      { at: 8, dur: 10, vel: 0.44 },
    ] },
    /** Quarters, evenly. The pulse under the *Antarctica* end of this
     *  repertoire — a hand keeping time because there is no drummer to do it,
     *  which is what half these cues have instead of a kit. */
    { name: 'quarter-chords', weight: 3, voices: 4, hits: [
      { at: 0, dur: 4, vel: 0.44 },
      { at: 4, dur: 4, vel: 0.34 },
      { at: 8, dur: 4, vel: 0.4 },
      { at: 12, dur: 4, vel: 0.34 },
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
    /** The tom procession — three drums walking down the bar with no kick and no
     *  snare under them. The *Antarctica* and *1492* gesture, and the one drum
     *  part in this genre that is closer to a timpani than to a kit. */
    { name: 'procession', weight: 3, voices: {
      lt: [0, 12],
      mt: [4],
      ht: [8],
    } },
    /** The big gated backbeat, at half speed. One snare in the middle of the bar
     *  and nothing else on top of it, which at this tempo is a beat every four
     *  seconds and is all the arrival a section here needs. */
    { name: 'gated-half', weight: 3, voices: {
      bd: [0],
      sd: [8],
      cr: [0],
    } },
    /** A pulse and a wash. No backbeat at all: the crash on the downbeat is the
     *  event and the shaker is the clock, which is what a cue does when the
     *  picture is not cutting. */
    { name: 'wash', weight: 2, voices: {
      cr: [0],
      sh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  melody: { leap: 0.24, ornament: 0.06, span: 19, sequence: 0.5, syncopation: 0.12 },
  /**
   * The lead this file describes is not the lead it plays.
   *
   * Three claims above, all about note length. The header: *the only
   * long-breathed melodic vocabulary in the genre — cells of a whole bar*. The
   * brass paragraph, which turns that into a mechanism: `generateBrass` *swells
   * under notes of two beats or more*, and *nothing else in the catalogue hands
   * it that many long notes to swell under*. And `twoHanded` above, setting the
   * left hand at 0.35 against `stalker`'s 0.55 on the stated ground that *this
   * lead holds one note for most of a bar, so the left hand moving underneath
   * is the event*.
   *
   * Measured over 200 songs a style, it is the busier of the two: 1.87 onsets a
   * bar against `stalker`'s 1.59, 23% of its notes lasting two beats or more
   * against `stalker`'s 37% and `berlin`'s 41%, and **not one note in the whole
   * sample lasting a full bar**, where both of those manage 4%. So the swell
   * sentence is false as written — two styles that exclude the brass layer
   * outright hand out more of exactly the notes it needs — and the hand this
   * style holds back is accompanying a tune that is moving faster than the one
   * it was held back for.
   *
   * Two fields, one per half of the gap, and nothing else here is touched.
   *
   *   density 1.2     what *one note for most of a bar* is as a number.
   *                   Derivation reads 1.79 by averaging the cell table, which
   *                   counts `[4,4,8]` at weight 3 the same way as `[16]` at 6;
   *                   15 of that table's 34 weight is a bar with one note in
   *                   it, and 7 of the 12 cadence weight is the whole-bar note.
   *   canvasBars 4    `adapt.ts` hands a four-bar canvas to anything under 1.70
   *                   onsets a bar, because *four bars of half notes is a
   *                   phrase, and two bars of them is a fragment*. This style
   *                   misses that threshold by nine hundredths and it is the
   *                   field that actually produces the long notes: density
   *                   alone moves whole-bar notes from 0% to 0%.
   *
   * Together: 1.48 onsets a bar, 43% of notes held two beats or more, 5% held a
   * full bar — sparser and longer than `stalker`, which is the order the two
   * paragraphs above already claim and did not have.
   */
  voice: { density: 1.2, canvasBars: 4 },
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
 *
 * ## The four records this table has to be able to be
 *
 * It shipped able to be one of them, and the tempo range is what gave that away.
 * 116–132 is *The Man-Machine* and *Computer World* exactly, and those two are a
 * third of the catalogue this style claims. The other two thirds live outside
 * that band at both ends, and a style whose bpm cannot reach a record cannot
 * generate it however many patterns are added underneath:
 *
 *  - **1974, the long major side.** A twenty-two-minute travelogue at around
 *    110: flowing eighths, a bass that walks rather than hooks, and harmony that
 *    is plagal and cheerful and would be a folk tune if a person were singing
 *    it. `travelling` and the four-bar major tables below.
 *  - **1975–77, the train.** Minor, static, metallic, a rolling two-bar figure
 *    with a clatter over it that is doing the job of a hi-hat and sounds like
 *    couplings. `train`, `train-clatter`, and the one-chord verse.
 *  - **1978–81, the single.** What this style already was, and it keeps the
 *    heaviest weights: `the-hook`, `eighth-stabs`, `motorik`.
 *  - **1983, the breathing one.** Sixteenths with holes cut in them, a hat
 *    pattern that inhales, and a bass that stops for a beat and a half at a
 *    time. `breath` and `breath-hats`.
 *
 * All four are composed by the bass line, which is why they are one style and
 * not four. What separates them is the *length and the gait* of that line, and
 * that is a table row.
 */
const machine: Style = {
  id: 'machine',
  label: 'Machine',
  description:
    'Man-machine pop: a two-bar bass line that is the hook, a tune of four notes repeated exactly, mechanical eighths and a drum machine that never fills.',
  beatsPerBar: 4,
  beatUnit: 4,
  /**
   * Widened at both ends, and neither end is a rounding. 104 is the long 1974
   * side and 134 is the 1983 one; the 116–132 this used to be is the middle
   * third of the catalogue mistaken for all of it.
   */
  bpm: [104, 134],
  swing: 0,
  modeWeights: { minor: 0.65, major: 0.35 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  requireLayers: ['bass'],
  /**
   * No brass, and this is the style where that needs saying, because a blunt
   * chord punch is very much its sound.
   *
   * It already has one. `eighth-stabs` is the comp — whole chords struck on
   * every eighth and released — so a brass layer stabbing into the gaps in the
   * tune would double an accent the arrangement is already making rather than
   * add a part to it. The synth-brass *sound* is not being refused either: it is
   * in the `polysynth` and `digital` melody palettes, and in this style the tune
   * is where it belongs.
   *
   * `hook: 'earworm'` is the second half. What comes back here comes back note
   * for note, and only the melody and the harmony are remembered across
   * sections — the brass is written fresh in every one of them, so it is the
   * single layer that could not come back.
   */
  excludeLayers: ['brass'],
  drumFills: false,
  filter: { depth: 0.3, shape: 'step' },
  /**
   * The carrier is a chord, and that is a fact about the instrument.
   *
   * `vocals.ts` opens by saying what this sound is made of: *someone speaks into
   * it while somebody else plays a chord, and the chord is what you hear.* A
   * vocoder is one modulator and as many carrier voices as there are keys down,
   * so being in two parts is a property of the machine rather than a gesture
   * inside one chorus — which is the line `HarmonyProfile` exists to draw
   * against `Device.harmony`. It is on this style and on no other in the genre
   * because that file already scopes itself the same way: *it belongs to the
   * `machine` style, which is the only one in the genre with a `vocal` layer
   * worth having.*
   *
   * **The device could not have produced this at any weight.** `NEEDS.harmony`
   * is `counter`, so a drawn harmony is played by the answering instrument and
   * the singer is unreachable from the pool. This is therefore not an argument
   * with the genre's `arrangement` table, which leaves `harmony` at the shared
   * default of 4 and says nothing about it. What it does cost is that a
   * declaration *replaces* the draw: a song generated without `--vocals` gives
   * up the drawn phrase of counter thirds and gets nothing back. That is the
   * price of one table saying one thing about this music instead of two.
   *
   * `amount: 0.85` — high, because the sentence above is not *sometimes a
   * chord* and because `hook: 'earworm'` wants a refrain that comes back the
   * same way; short of 1 because the same catalogue holds a single key, in the
   * counting and speaking pieces where the carrier is one oscillator, and 1
   * would put those out of reach. The residual is named rather than hidden: a
   * three-chorus song comes out with one of them bare two times in five. No
   * `kinds` — how many keys are down is not a fact about which section it is.
   *
   * Both intervals sit **above**. The vocoded line is already in the lead's own
   * octave — `range: [40, 84]` is set wide enough that the fold almost never
   * fires — and the register beneath it is spoken for, since `layerPlan.offsets`
   * drops the comp five semitones to clear exactly that space for the sequencer.
   *
   *   +2  a third, and the heavier of the two, because this style's harmony is
   *       triads. All 14 distinct chord symbols below are plain, where
   *       `cinematic` writes 19 extended ones out of 25 and `optical` 10 of 20.
   *       A third is what makes a carrier a chord rather than an interval, and
   *       this is the one style in the file that cadences.
   *   +4  a fifth, and the colder. `ruleOverrides` disables `parallel-perfects`
   *       for the whole genre and gives *the fifths lead, which bakes the
   *       interval into the patch* as half its reason; `leadFifths` carries 3 of
   *       the `modular` melody palette and 2 of `polysynth`, described there as
   *       *the cheapest way a monophonic synthesiser ever faked harmony*. A held
   *       root and fifth is that interval bought with a second key rather than
   *       with a second oscillator.
   *
   * No octave, and `arrangement.unison: 6` is why it looks like there should be
   * one. That device already plays the octave-doubled lead, on the counter, and
   * the vocoder is already doubling the melody; a seven-step stack here would be
   * the same fact stated a third time.
   */
  harmony: {
    amount: 0.85,
    intervals: [[2, 5], [4, 3]],
    on: 'vocal',
  },
  progressions: {
    intro: [
      { chords: ['i', 'i', 'VI', 'VI'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i'], weight: 3 },
      { chords: ['i', 'i', 'VII', 'VII'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'i', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 5, note: 'Four chords, two bars each, round and round: in this style the loop is the form and the bass line is the tune' },
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'III', 'III', 'VII', 'VII', 'VI', 'VI'], weight: 3 },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 4, note: 'One chord for eight bars. The train side of this catalogue has no harmony at all — the bass figure states the tonic, the percussion states the distance, and a chord change would be a station' },
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'VI', 'VI'], weight: 3, note: 'Two chords, four bars each: the same static verse with one thing happening in the middle of it' },
      { chords: ['i', 'i', 'v', 'v', 'VII', 'VII', 'i', 'i'], weight: 3, note: 'The *minor* v where a dance band would put a major one — this is the genre\'s refusal of the dominant stated positively rather than by omission' },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['VI', 'VI', 'III', 'III', 'iv', 'iv', 'VII', 'VII'], weight: 3 },
      { chords: ['III', 'III', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 3 },
      { chords: ['VII', 'VII', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'VII', 'VII', 'VI', 'VI', 'III', 'III'], weight: 4 },
      { chords: ['bII', 'bII', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 2 },
      { chords: ['VI', 'VI', 'iv', 'iv', 'i', 'i', 'VII', 'VII'], weight: 3 },
    ],
    outro: [
      { chords: ['VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i'], weight: 2 },
      { chords: ['VI', 'VII', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    intro: [
      { chords: ['I', 'I', 'V', 'V'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'IV'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'V', 'V', 'I', 'I'], weight: 5, note: 'A plain major cadence, and the only place in this genre one belongs — Kraftwerk cadences, and the ban on the dominant is a claim about *minor*' },
      { chords: ['I', 'I', 'vi', 'vi', 'IV', 'IV', 'V', 'V'], weight: 4 },
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 3 },
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'IV', 'IV'], weight: 4, note: 'Four bars of each, plagal, and cheerful about it. This is the long 1974 side: a tune that would be a folk song if a person were singing it, over a machine that has no intention of stopping' },
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 3 },
      { chords: ['I', 'I', 'iii', 'iii', 'IV', 'IV', 'V', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'V', 'V', 'I', 'I', 'I', 'I'], weight: 5 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'IV', 'V', 'V', 'IV', 'IV'], weight: 3, note: 'It leaves on the fourth rather than coming home. The plagal exit is what keeps a long side turning over instead of ending eight times' },
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['ii', 'ii', 'V', 'V', 'I', 'I', 'vi', 'vi'], weight: 3 },
      { chords: ['IV', 'IV', 'iv', 'iv', 'I', 'I', 'I', 'I'], weight: 3, note: 'The borrowed minor iv, which is the one wistful chord this style permits itself' },
      { chords: ['vi', 'vi', 'iii', 'iii', 'IV', 'IV', 'V', 'V'], weight: 2 },
    ],
    outro: [
      { chords: ['V', 'V', 'I', 'I'], weight: 4 },
      { chords: ['IV', 'IV', 'I', 'I'], weight: 3 },
    ],
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
    /**
     * The train. Two bars, in sixteenths, with the second and fourth beats of
     * each bar left empty — so the figure runs, stops, runs, stops, which is
     * what a bogie crossing a rail joint does and is the entire rhythmic content
     * of the 1977 side.
     *
     * The pitches barely move: root and octave, with one fifth in the second bar
     * so the two halves are not identical. That restraint is the point — this is
     * a *distance* figure rather than a hook, and a bass line with a tune in it
     * would arrive somewhere.
     */
    { name: 'train', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 1, tone: 'root', vel: 0.96 },
      { at: 1, dur: 1, tone: 'root', vel: 0.7 },
      { at: 2, dur: 1, tone: 'octave', vel: 0.84 },
      { at: 3, dur: 1, tone: 'root', vel: 0.7 },
      { at: 8, dur: 1, tone: 'root', vel: 0.92 },
      { at: 9, dur: 1, tone: 'root', vel: 0.7 },
      { at: 10, dur: 1, tone: 'octave', vel: 0.82 },
      { at: 11, dur: 1, tone: 'root', vel: 0.7 },
      { at: 16, dur: 1, tone: 'root', vel: 0.96 },
      { at: 17, dur: 1, tone: 'root', vel: 0.7 },
      { at: 18, dur: 1, tone: 'octave', vel: 0.84 },
      { at: 19, dur: 1, tone: 'root', vel: 0.7 },
      { at: 24, dur: 1, tone: 'fifth', vel: 0.92 },
      { at: 25, dur: 1, tone: 'fifth', vel: 0.7 },
      { at: 26, dur: 1, tone: 'root', vel: 0.82 },
      { at: 27, dur: 1, tone: 'fifth', vel: 0.7 },
    ] },
    /**
     * The 1974 bass: flowing rather than hooked, four bars long, and it goes
     * somewhere and comes back. Sixty-four sixteenths in eighths, walking up
     * through the chord and stepping down again — the only figure in this style
     * whose shape a person could sing, which is what a twenty-two-minute major
     * side needs under it and what a two-bar hook would exhaust in a minute.
     *
     * Four bars against harmony that changes every two means it plays the whole
     * shape over a chord pair and then over the next pair, so the same notes are
     * a root over one chord and a third over the other. That is the device the
     * long side is made of.
     */
    { name: 'travelling', weight: 4, cycle: 64, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.94 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.78 },
      { at: 8, dur: 3, tone: 'octave', vel: 0.86 },
      { at: 12, dur: 3, tone: 'fifth', vel: 0.78 },
      { at: 16, dur: 3, tone: 'third', vel: 0.9 },
      { at: 20, dur: 3, tone: 'fifth', vel: 0.76 },
      { at: 24, dur: 3, tone: 'octave', vel: 0.84 },
      { at: 28, dur: 3, tone: 'seventh', vel: 0.78 },
      { at: 32, dur: 3, tone: 'octave', vel: 0.92 },
      { at: 36, dur: 3, tone: 'fifth', vel: 0.76 },
      { at: 40, dur: 3, tone: 'third', vel: 0.86 },
      { at: 44, dur: 3, tone: 'fifth', vel: 0.76 },
      { at: 48, dur: 3, tone: 'root', vel: 0.9 },
      { at: 52, dur: 3, tone: 'third', vel: 0.76 },
      { at: 56, dur: 7, tone: 'fifth', vel: 0.84 },
    ] },
    /**
     * The one that breathes. Sixteenths in bursts with a beat and a half of
     * nothing after each, over two bars — 1983, and the first bass in this
     * catalogue whose silences are longer than its notes.
     *
     * It is the opposite instruction to `the-hook`, which fires on every eighth
     * and is therefore always present. What makes this one memorable is where it
     * *stops*: the ear fills the hole, and a figure the listener is completing is
     * stickier than one that leaves nothing to do.
     */
    { name: 'breath', weight: 4, cycle: 32, hits: [
      { at: 0, dur: 1, tone: 'root', vel: 0.98 },
      { at: 1, dur: 1, tone: 'root', vel: 0.74 },
      { at: 2, dur: 1, tone: 'root', vel: 0.84 },
      { at: 3, dur: 1, tone: 'octave', vel: 0.74 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.9 },
      { at: 12, dur: 1, tone: 'root', vel: 0.86 },
      { at: 14, dur: 1, tone: 'seventh', vel: 0.76 },
      { at: 16, dur: 1, tone: 'root', vel: 0.96 },
      { at: 17, dur: 1, tone: 'root', vel: 0.74 },
      { at: 18, dur: 1, tone: 'root', vel: 0.84 },
      { at: 19, dur: 1, tone: 'octave', vel: 0.74 },
      { at: 20, dur: 3, tone: 'third', vel: 0.88 },
      { at: 28, dur: 3, tone: 'fifth', vel: 0.84 },
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
    /**
     * The chord held for the whole bar and merged across bars where the harmony
     * has not moved — a vocoder pad, a string machine, a Vako Orchestron, all
     * three of which this group used for exactly this and none of which anybody
     * played rhythmically.
     *
     * It is here because three of this style's bass figures are now sixteenth
     * figures with holes in them, and against one of those a chord punched on
     * every eighth is a second rhythm part rather than an accompaniment. The
     * whole shape of the 1977 and 1983 records is a busy floor and a still
     * middle.
     */
    { name: 'held-chords', weight: 4, voices: 4, sustain: true, hits: [
      { at: 0, dur: 16, vel: 0.4 },
    ] },
    /** Blocks on the quarters. Between the eighth stabs and the held chord, and
     *  the one that leaves the most room for a lead in the same register. */
    { name: 'quarter-blocks', weight: 3, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.46 },
      { at: 4, dur: 3, vel: 0.36 },
      { at: 8, dur: 3, vel: 0.42 },
      { at: 12, dur: 3, vel: 0.36 },
    ] },
    /**
     * Two bars of stabs that are not the same bar twice: the first is on the
     * beat and the second is pushed onto the offbeats, so the pair reads as a
     * question and an answer.
     *
     * The comp's only `cycle`, and it exists because everything else here is
     * bar-shaped over bass figures that are two and four bars long. One element
     * agreeing with the *hook*'s length rather than with the bar is what makes a
     * two-bar bass line sound like a two-bar phrase instead of like the same bar
     * played twice.
     */
    { name: 'two-bar-stabs', weight: 3, voices: 3, cycle: 32, hits: [
      { at: 0, dur: 1, vel: 0.5 }, { at: 4, dur: 1, vel: 0.4 },
      { at: 8, dur: 1, vel: 0.46 }, { at: 12, dur: 1, vel: 0.4 },
      { at: 18, dur: 2, vel: 0.44 }, { at: 22, dur: 2, vel: 0.38 },
      { at: 26, dur: 2, vel: 0.44 }, { at: 30, dur: 2, vel: 0.38 },
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
    /**
     * The rail joints. Two bars, and the percussion is the only thing in it that
     * is not on a grid of four: a rim shot on every third sixteenth against a
     * cowbell on the beats, so the two agree at the top of each bar and nowhere
     * else inside it.
     *
     * Cycled to two bars rather than one because a clatter that repeats every
     * four beats is a groove and a clatter that repeats every eight is a
     * *journey*. Pairs with `train`, and no fill will ever interrupt it —
     * `drumFills: false` is on the style.
     */
    { name: 'train-clatter', weight: 4, cycle: 32, voices: {
      bd: [0, 8, 16, 24],
      rim: [3, 6, 9, 12, 19, 22, 25, 28],
      cb: [0, 4, 8, 12, 16, 20, 24, 28],
      sd: [24],
    } },
    /**
     * The hi-hat that inhales. Sixteenths on the first half of each beat and
     * nothing on the second, so the pattern is four short bursts rather than a
     * continuous stream, and the open hat lands in one of the gaps.
     *
     * This is 1983, and it is the one kit in the style that has a *gait* rather
     * than a pulse. The kick sits under the second and fourth bursts rather than
     * on all four beats, which is what stops it turning back into motorik.
     */
    { name: 'breath-hats', weight: 4, voices: {
      bd: [0, 6, 8, 14],
      cp: [8],
      hh: [0, 1, 4, 5, 8, 9, 12, 13],
      oh: [6, 14],
    } },
    /** Almost nothing: a kick, a clap and a shaker. The verse of a record whose
     *  bass line is the arrangement, and the pattern that makes the loud kits
     *  above sound like a decision. */
    { name: 'bare-box', weight: 3, voices: {
      bd: [0, 8],
      cp: [8],
      sh: [4, 12],
    } },
    /** The snare on 4 alone, with the kick doubling the eighths under it. The
     *  half-time march — 1974 again, where the kit is a metronome with one
     *  accent in it rather than a backbeat. */
    { name: 'march', weight: 3, voices: {
      bd: [0, 4, 8, 12],
      sd: [12],
      hh: [2, 6, 10, 14],
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
 *
 * **It does not name `brass`**, and that is the other half of the same thought.
 * Three styles in this file exclude that layer; this one and `cinematic` take
 * it, and they take opposite halves of it. `cinematic` gets the swell under a
 * held note; this style has no held notes to speak of, so what it gets is the
 * other gesture — a stab pushed off the barline into a gap in the tune, which
 * is the horn punch every record of this kind put behind the chorus, whether it
 * came from a section in the room or from a Prophet.
 */
const cosmic: Style = {
  /**
   * An arrival exists in this music; a break does not, and a band shot needs a
   * band. What a sequencer sequence can do at a join is get there early.
   */
  transitions: [['fill', 4], ['elide', 1]],
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
      { chords: ['I', 'I', 'I', 'I'], weight: 3, note: 'One chord while the kick and the sequence establish. On a record whose form is a build, the introduction has no harmony to state yet' },
    ],
    verse: [
      { chords: ['I', 'I', 'vi', 'vi', 'IV', 'IV', 'V', 'V'], weight: 5, note: 'The disco round: four chords, two bars each, and the arrival is the fourth one' },
      { chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7'], weight: 4 },
      { chords: ['vi7', 'vi7', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 4 },
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 3 },
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'IV', 'IV'], weight: 3, note: 'Four bars each. "I Feel Love" has two chords in it and neither is in a hurry — when the sequencer is the event, harmony that moved every two bars would be competing with it' },
      { chords: ['vi7', 'vi7', 'vi7', 'vi7', 'V', 'V', 'V', 'V'], weight: 3, note: 'Starting on the relative minor and leaving on the dominant, so the eight bars are entirely a run-up and the chorus is where the tonic finally arrives' },
      { chords: ['Imaj7', 'Imaj7', 'iii7', 'iii7', 'vi7', 'vi7', 'IV', 'IV'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'V', 'V', 'I', 'I', 'I', 'I'], weight: 5, note: 'The arrival. Everything before it in the form is a run-up, and it is the one cadence this genre takes at face value' },
      { chords: ['IV', 'IV', 'I', 'I', 'IV', 'IV', 'V', 'V'], weight: 4 },
      { chords: ['vi7', 'vi7', 'V', 'V', 'IV', 'IV', 'I', 'I'], weight: 3 },
      { chords: ['I', 'V', 'vi7', 'IV', 'I', 'V', 'IV', 'IV'], weight: 3, note: 'A chord a bar — twice the usual rate, which is how this style makes a chorus feel faster than the verse without the tempo moving' },
      { chords: ['IV', 'IV', 'V', 'V', 'vi7', 'vi7', 'IV', 'IV'], weight: 3, note: 'The deceptive one: everything points at the tonic and it never comes, which is what keeps a twelve-inch turning over' },
    ],
    bridge: [
      { chords: ['ii7', 'ii7', 'V', 'V', 'vi7', 'vi7', 'IV', 'IV'], weight: 4 },
      { chords: ['bVI', 'bVI', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 3 },
      { chords: ['IV', 'IV', 'iii7', 'iii7', 'vi7', 'vi7', 'V', 'V'], weight: 3 },
    ],
    outro: [
      { chords: ['IV', 'V', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'I', 'I'], weight: 2 },
      { chords: ['vi7', 'IV', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    intro: [
      { chords: ['i', 'i', 'VI', 'VI'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'i', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 5 },
      { chords: ['i9', 'i9', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'VII', 'VII', 'i', 'i'], weight: 3 },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'VII', 'VII'], weight: 3 },
      { chords: ['i9', 'i9', 'III', 'III', 'iv9', 'iv9', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5, note: 'Modal even here: the euphoria comes from the kick and the filter opening, not from a chord that wants to resolve' },
      { chords: ['III', 'III', 'VII', 'VII', 'VI', 'VI', 'i', 'i'], weight: 3 },
      { chords: ['iv', 'iv', 'VII', 'VII', 'III', 'III', 'VI', 'VI'], weight: 3 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VI'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'III', 'III'], weight: 4 },
      { chords: ['VI', 'VI', 'III', 'III', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'VII', 'i', 'i'], weight: 3 },
    ],
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
    /**
     * Written as intervals, and the only figure outside `fusion` in the
     * catalogue that needs to be.
     *
     * A sequencer plays a *shape*: the steps are set once and the pattern is
     * re-rooted as the harmony moves under it. Spelled as chord functions the
     * last step asked the chord what its seventh was, and this style's vamps
     * carry both `maj7` and `min7` — so the step came out a semitone apart
     * depending on which chord it landed on, which is not what a sequencer does
     * and not what anybody programmed.
     *
     * Every other synth style was checked and left alone, for two different
     * reasons. `machine`, `stalker` and `berlin` produce nothing but triads and
     * ninths, so their `seventh` already resolves through the `root + 10`
     * fallback and is a flat seventh every time; changing those would have been
     * churn dressed up as a fix. `optical` does carry both qualities and is still
     * spelled in chord functions on purpose — its bass is an *outline* rather
     * than a shape, and an outline is supposed to renegotiate with the chord it
     * is standing on. `walking-eighths`, two rows below this one, makes the same
     * distinction from the other side and in this style.
     *
     * `7` and `-2` are the intervals the old spelling already sounded — see
     * `BassTone`, and `seven-riff` in the jazz table, which had the same bug.
     */
    { name: 'driving-quarters', weight: 3, hits: [
      { at: 0, dur: 3, tone: 0, vel: 0.96 },
      { at: 4, dur: 3, tone: 0, vel: 0.84 },
      { at: 8, dur: 3, tone: 7, vel: 0.9 },
      { at: 12, dur: 3, tone: -2, vel: 0.82 },
    ] },
    /**
     * Sixteenths, two bars, and the octave arriving a sixteenth early every other
     * beat. The bass as the second sequencer — "I Feel Love" has no bass player
     * in it, it has a Moog running the same figure the top line is running, an
     * octave down and slightly out of step with itself.
     *
     * Two bars against a one-bar kick, which is this style's whole mechanism
     * stated a second time in a second layer: everything else agrees with the
     * barline and these two do not.
     */
    { name: 'sixteenth-octaves', weight: 4, cycle: 32, hits: [
      { at: 0, dur: 1, tone: 'root', vel: 0.96 },
      { at: 2, dur: 1, tone: 'octave', vel: 0.74 },
      { at: 3, dur: 1, tone: 'root', vel: 0.68 },
      { at: 4, dur: 1, tone: 'root', vel: 0.88 },
      { at: 6, dur: 1, tone: 'octave', vel: 0.74 },
      { at: 8, dur: 1, tone: 'root', vel: 0.92 },
      { at: 10, dur: 1, tone: 'octave', vel: 0.74 },
      { at: 11, dur: 1, tone: 'root', vel: 0.68 },
      { at: 12, dur: 1, tone: 'root', vel: 0.88 },
      { at: 14, dur: 1, tone: 'octave', vel: 0.74 },
      { at: 16, dur: 1, tone: 'root', vel: 0.96 },
      { at: 18, dur: 1, tone: 'octave', vel: 0.74 },
      { at: 19, dur: 1, tone: 'root', vel: 0.68 },
      { at: 20, dur: 1, tone: 'fifth', vel: 0.9 },
      { at: 22, dur: 1, tone: 'octave', vel: 0.74 },
      { at: 24, dur: 1, tone: 'seventh', vel: 0.9 },
      { at: 26, dur: 1, tone: 'octave', vel: 0.74 },
      { at: 27, dur: 1, tone: 'seventh', vel: 0.68 },
      { at: 28, dur: 1, tone: 'fifth', vel: 0.86 },
      { at: 30, dur: 1, tone: 'octave', vel: 0.74 },
    ] },
    /**
     * The one that plays a *line* rather than a pulse: root, seventh, fifth,
     * third down through the bar in eighths, which is the Philadelphia bass under
     * a European sequencer and is what the players brought when a producer hired
     * players.
     *
     * Written as chord functions rather than as intervals on purpose, and this is
     * the pattern that makes the argument in `driving-quarters` above legible by
     * contrast: an outline *should* renegotiate with each chord, because that is
     * what outlining is. A shape should not. The two sit next to each other here
     * doing opposite things correctly.
     */
    { name: 'walking-eighths', weight: 3, hits: [
      { at: 0, dur: 1, tone: 'root', vel: 0.94 },
      { at: 2, dur: 1, tone: 'root', vel: 0.74 },
      { at: 4, dur: 1, tone: 'seventh', vel: 0.86 },
      { at: 6, dur: 1, tone: 'root', vel: 0.72 },
      { at: 8, dur: 1, tone: 'fifth', vel: 0.9 },
      { at: 10, dur: 1, tone: 'fifth', vel: 0.72 },
      { at: 12, dur: 1, tone: 'third', vel: 0.84 },
      { at: 14, dur: 1, tone: 'fifth', vel: 0.72 },
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
    /**
     * Three bars of sixteenths, rising and falling. Forty-eight steps against a
     * one-bar kick is the widest disagreement in the style — the sequence comes
     * home every third bar and the kick every first, so a sixteen-bar section
     * gets five whole passes and a fragment.
     *
     * `updown` doubles a four-note voicing into six rungs, and six against
     * forty-eight divides exactly — which would normally be a fault. It is not
     * one here: the ladder resets per *chord* rather than per pass, and the
     * harmony under this style moves every two bars, so the figure meets a
     * different voicing on each of its three bars anyway.
     */
    { name: 'sequence-3-bar', weight: 4, voices: 4, arpeggio: true, arpDirection: 'updown', cycle: 48, hits: [
      { at: 0, dur: 1, vel: 0.52 }, { at: 1, dur: 1, vel: 0.36 }, { at: 2, dur: 1, vel: 0.44 }, { at: 3, dur: 1, vel: 0.36 },
      { at: 4, dur: 1, vel: 0.48 }, { at: 5, dur: 1, vel: 0.36 }, { at: 6, dur: 1, vel: 0.44 }, { at: 7, dur: 1, vel: 0.36 },
      { at: 8, dur: 1, vel: 0.48 }, { at: 9, dur: 1, vel: 0.36 }, { at: 10, dur: 1, vel: 0.44 }, { at: 11, dur: 1, vel: 0.36 },
      { at: 12, dur: 1, vel: 0.48 }, { at: 13, dur: 1, vel: 0.36 }, { at: 14, dur: 1, vel: 0.44 }, { at: 15, dur: 1, vel: 0.36 },
      { at: 16, dur: 1, vel: 0.5 }, { at: 17, dur: 1, vel: 0.36 }, { at: 18, dur: 1, vel: 0.44 }, { at: 19, dur: 1, vel: 0.36 },
      { at: 20, dur: 1, vel: 0.48 }, { at: 21, dur: 1, vel: 0.36 }, { at: 22, dur: 1, vel: 0.44 }, { at: 23, dur: 1, vel: 0.36 },
      { at: 24, dur: 1, vel: 0.48 }, { at: 25, dur: 1, vel: 0.36 }, { at: 26, dur: 1, vel: 0.44 }, { at: 27, dur: 1, vel: 0.36 },
      { at: 28, dur: 1, vel: 0.48 }, { at: 29, dur: 1, vel: 0.36 }, { at: 30, dur: 1, vel: 0.44 }, { at: 31, dur: 1, vel: 0.36 },
      { at: 32, dur: 1, vel: 0.5 }, { at: 33, dur: 1, vel: 0.36 }, { at: 34, dur: 1, vel: 0.44 }, { at: 35, dur: 1, vel: 0.36 },
      { at: 36, dur: 1, vel: 0.48 }, { at: 37, dur: 1, vel: 0.36 }, { at: 38, dur: 1, vel: 0.44 }, { at: 39, dur: 1, vel: 0.36 },
      { at: 40, dur: 1, vel: 0.48 }, { at: 41, dur: 1, vel: 0.36 }, { at: 42, dur: 1, vel: 0.44 }, { at: 43, dur: 1, vel: 0.36 },
      { at: 44, dur: 1, vel: 0.48 }, { at: 45, dur: 1, vel: 0.36 }, { at: 46, dur: 1, vel: 0.44 }, { at: 47, dur: 1, vel: 0.36 },
    ] },
    /** The chop cut to sixteenths — a chord on the last sixteenth of every beat,
     *  which is the guitar part of this music played by a keyboard that cannot
     *  scratch. Tighter and further forward than `string-chop`, and the one that
     *  makes a chorus sound like it is being pushed. */
    { name: 'sixteenth-chop', weight: 3, voices: 4, hits: [
      { at: 3, dur: 1, vel: 0.46 },
      { at: 7, dur: 1, vel: 0.42 },
      { at: 11, dur: 1, vel: 0.46 },
      { at: 15, dur: 1, vel: 0.42 },
    ] },
    /** Held, and merged where the harmony has not moved. For the verses that are
     *  four bars of one chord: the sequence is in the bass, the kick is the form,
     *  and the chordal layer is a pad in everything but name. */
    { name: 'held-strings', weight: 3, voices: 4, sustain: true, hits: [
      { at: 0, dur: 16, vel: 0.4 },
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
    /** The cowbell on the eighths over the floor — Munich, 1977, and the one
     *  percussion sound of this decade that no producer has ever been able to
     *  use quietly. */
    { name: 'cowbell-floor', weight: 4, voices: {
      bd: [0, 4, 8, 12],
      cp: [4, 12],
      cb: [0, 2, 4, 6, 8, 10, 12, 14],
      oh: [6, 14],
    } },
    /** Two claps a beat apart on the backbeat — the double handclap, which is a
     *  drum machine doing what a room full of people did and is why the sound
     *  survived into every record that came after. */
    { name: 'double-clap', weight: 3, voices: {
      bd: [0, 4, 8, 12],
      cp: [4, 6, 12, 14],
      hh: [2, 6, 10, 14],
    } },
    /** Toms under the floor instead of hats. The percussion break: nothing on
     *  top, everything underneath, and the section that follows it lands harder
     *  for having had its cymbals taken away first. */
    { name: 'tom-floor', weight: 3, voices: {
      bd: [0, 4, 8, 12],
      lt: [2, 10],
      mt: [6],
      ht: [14],
      cp: [12],
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
  /** No brass, for the reason the whole style exists: one man at one keyboard,
   *  and a section arriving to punctuate him is a band. `earworm` again as
   *  well — the horror is the repetition, and the brass is the one layer that
   *  is not remembered from section to section. */
  excludeLayers: ['brass'],
  /** Two beats between answering notes. What replies to an ostinato is a shape
   *  in the distance, not a second line. */
  counterSpacing: 2,
  /**
   * One person at one keyboard, which is what this music literally was.
   *
   * A Carpenter score is not a band — it is a man with a Prophet and a
   * sequencer, left hand holding a figure while the right plays the theme. The
   * `twoHanded` machinery already exists for exactly this shape; it was built
   * for a jazz trio's pianist and has been waiting for the genre that needs it
   * more.
   *
   * `density: 0.55` rather than the trio's 0.92, and the difference is the
   * idiom. A bebop pianist's left hand speaks at nearly every opportunity
   * because the texture is conversation. This one is holding a shape while
   * something else moves, and a left hand that spoke every bar would turn a
   * horror cue into a piano piece.
   *
   * `ostinato` leads the modes for the same reason the style exists: what the
   * left hand does here is *repeat*, and the repetition is the horror. `answer`
   * is second because a figure that occasionally replies to the theme is the
   * one departure that still sounds like this music. `block` is last and
   * `unison` is absent — two hands playing the same line an octave apart is a
   * prog gesture and belongs in a different style entirely.
   */
  twoHanded: {
    /**
     * Three leads, all polyphonic enough to hold the left hand's fifth.
     *
     * `leadVoice` is the CS-80 — Vangelis's instrument and the closest fixed
     * patch to a breathy analogue lead — and it is weighted highest because it
     * is the one that sounds like a person playing rather than a preset.
     */
    instruments: [['leadVoice', 5], ['leadSaw', 3], ['leadSquare', 2]],
    density: 0.55,
    modes: [['ostinato', 6], ['answer', 3], ['block', 1]],
    /**
     * Five sixteenths, against a four-four bar.
     *
     * The same trick the counter figure plays and the reason this style is in
     * 4/4 at all: a five-unit cycle in a sixteen-unit bar comes back round every
     * four bars, so the left hand is never in the same place twice within a
     * phrase. Written as a bass note and its fifth, held long — the hand is
     * keeping a shape, not articulating a rhythm.
     */
    ostinato: {
      cycle: 5,
      hits: [{ at: 0, dur: 3, vel: 0.72 }, { at: 3, dur: 2, vel: 0.55 }],
    },
  },
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
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 3, note: 'The minor fourth as the only visitor — Goblin rather than Carpenter, where the second chord is not frightening in itself and is only wrong because something has moved' },
      { chords: ['i', 'i', 'VI', 'VI', 'i', 'i', 'bII', 'bII'], weight: 3, note: 'Both of the tonic triad\'s neighbours in one progression: ♭VI puts a note a semitone above the fifth and ♭II puts one a semitone above the root, so every strong tone in the key has something leaning on it' },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 3 },
      { chords: ['i', 'i', 'bII', 'bII', 'i', 'i', '#IV', '#IV'], weight: 3, note: 'It ends on the tritone and stays there. Nothing in this style has to come home, and a section that does not is more frightening than one that does' },
      { chords: ['VII', 'VII', 'VI', 'VI', 'bII', 'bII', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'VI', 'VI', 'bII', 'bII', 'i', 'i'], weight: 4 },
      { chords: ['#IV', '#IV', 'bII', 'bII', 'i', 'i', 'i', 'i'], weight: 3 },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 3, note: 'The bridge that goes nowhere, for the songs whose verse already moved. In a style built on repetition the departure is sometimes the *absence* of one' },
    ],
    outro: [
      { chords: ['bII', 'bII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i'], weight: 3 },
      { chords: ['iv', 'iv', 'i', 'i'], weight: 2 },
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
    /**
     * Seven beats. Twenty-eight sixteenths against a four-beat bar takes seven
     * bars to come home, which is nearly twice as long as `twenty` and is the
     * slowest rotation in the catalogue.
     *
     * The pair is the point, and it is the same argument `four-bar-crawl` makes
     * from the other end. Five beats is a drift a listener can *feel* inside a
     * phrase; seven is one they cannot, and a section built on it sounds subtly
     * wrong for sixteen bars without ever offering a moment where the wrongness
     * is identifiable. Both are this music. They are not the same fear.
     */
    { name: 'twenty-eight', weight: 4, cycle: 28, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.98 },
      { at: 2, dur: 2, tone: 'root', vel: 0.78 },
      { at: 6, dur: 2, tone: 'octave', vel: 0.84 },
      { at: 10, dur: 2, tone: 'root', vel: 0.8 },
      { at: 14, dur: 2, tone: 'fifth', vel: 0.88 },
      { at: 18, dur: 2, tone: 'root', vel: 0.78 },
      { at: 22, dur: 6, tone: 'seventh', vel: 0.82 },
    ] },
    /**
     * Fifteen sixteenths: a bar less one, so the figure arrives a sixteenth
     * earlier every bar and takes sixteen bars to return.
     *
     * The most nearly-right cycle available, and that is what makes it work. At
     * five beats a listener hears an ostinato in another metre; at fifteen
     * sixteenths they hear the *same* bar, very slightly hurrying, for a section
     * at a time — which is the thing this style is trying to do to somebody and
     * cannot do with a cycle they can count.
     */
    { name: 'fifteen', weight: 3, cycle: 15, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.96 },
      { at: 3, dur: 2, tone: 'root', vel: 0.78 },
      { at: 6, dur: 2, tone: 'fifth', vel: 0.86 },
      { at: 9, dur: 2, tone: 'root', vel: 0.78 },
      { at: 12, dur: 3, tone: 'octave', vel: 0.84 },
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
    /** Two chords a beat apart, in the middle of the bar and nowhere else. The
     *  double knock: the one comping gesture that sounds like something arriving
     *  rather than something sustaining. */
    { name: 'double-knock', weight: 3, voices: 3, hits: [
      { at: 8, dur: 2, vel: 0.42 },
      { at: 12, dur: 2, vel: 0.34 },
    ] },
    /**
     * Five sixteenths, as a chord. The only cycled comp in the style, and it is
     * here so the harmony can drift *with* the bass rather than standing still
     * over it — five against five is two parts locked to each other and both
     * loose against the bar, which is a thicker and more disorienting version of
     * what `twenty` does alone.
     */
    { name: 'five-pulse', weight: 2, voices: 3, cycle: 5, hits: [
      { at: 0, dur: 3, vel: 0.38 },
    ] },
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
    /** Two kicks a beat and a half apart and nothing else — a heartbeat, which
     *  is the oldest sound in the genre and the only one that does not need a
     *  cymbal to be percussion. */
    { name: 'heartbeat', weight: 4, voices: {
      bd: [0, 3, 8, 11],
    } },
    /** A floor tom on the downbeat, alone. Goblin rather than Carpenter: a drum
     *  that is felt in the chest rather than counted, and no timekeeping voice
     *  anywhere above it. */
    { name: 'low-tom', weight: 3, voices: {
      lt: [0, 10],
      sh: [4, 12],
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

/**
 * OPTICAL — the sequencer after the filter went away.
 *
 * *Optical Race*, *Underwater Sunlight*, *Le Parc*; *Rendez-Vous* and *Revolutions*
 * at the other composer's end of it. The same group and the same job as `berlin`
 * — the sequencer is still what composes the music — and a different record in
 * every respect that this file can express.
 *
 * ## Why it is not a row in the Berlin table
 *
 * Because everything separating the two is a property of the *style* rather than
 * of a pattern, and a table row cannot state any of them:
 *
 *  - **`filter`.** `berlin` is `{ depth: 0.75, shape: 'ramp' }` and says at
 *    length that the sixteen bars in which a closed filter opens *are* the
 *    composition. A DX7 has no filter, because it has nothing to subtract from;
 *    an FM patch is bright or it is not. So this style is `step` at 0.15, which
 *    is barely a filter statement at all, and the thing that has to announce a
 *    section instead is the arrangement: the gated snare, the counter line
 *    arriving, the key lifting. That is one field and it is the whole reason the
 *    late records sound assembled where the early ones sound *opened*.
 *  - **`modeWeights`.** 0.8 minor against 0.55 major. This half of the
 *    repertoire is not dark, and no quantity of major progressions added to a
 *    style that draws minor four times in five will make it sound like 1988.
 *  - **`bpm`** and **`melody`.** A wider, more ornamented, more syncopated line
 *    than `berlin`'s stepwise one: by this point the lead is a *tune* played
 *    over the sequence rather than a colour laid across it, and `sequence: 0.4`
 *    against `berlin`'s 0.6 is that difference in one number.
 *
 * ## What it takes from each neighbour, and what it refuses
 *
 * From `berlin`, the arpeggiated comp on a cycle that is not the bar — this is
 * still sequencer music and `requireLayers: ['comp']` says so. From `cosmic`,
 * the idea that a chorus *arrives*. From `machine`, nothing: there is no hook
 * bass here, and the lowest part is a floor rather than a subject.
 *
 * `counterMode` stays at the default `answer`, and it is the sharpest small
 * difference from `berlin`. That style runs two sequencers at once because two
 * machines phasing is its texture; this one has a second *melodic* part — the
 * bell echoing the lead a bar later, which is what a digital delay and a spare
 * multitimbral channel got used for once both existed. An answer, not an
 * ostinato.
 *
 * It keeps the `brass` layer, which three of the five older styles refuse. A
 * `synthBrass2` stab is the most 1987 sound available and the `digital` era's
 * brass palette leads with it; this style is where that palette finally gets
 * read by something other than `cinematic` and `cosmic`.
 */
const optical: Style = {
  id: 'optical',
  label: 'Optical',
  description:
    'Late-digital sequencer music: a bright arpeggio on a cycle of its own, a real tune over it, a gated backbeat, and no filter sweep because the instrument has no filter.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [96, 126],
  swing: 0,
  /** Major-leaning, so `progressions` below is the *major* table and
   *  `minorProgressions` is the override — the same inversion `cosmic` makes,
   *  for the same reason and about a different decade. */
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  requireLayers: ['comp'],
  /** Shallow, and stepped rather than swept. See the header: there is no cutoff
   *  knob on the instrument this style is named after, and pretending otherwise
   *  would make it `berlin` with brighter patches. */
  filter: { depth: 0.15, shape: 'step' },
  progressions: {
    intro: [
      { chords: ['Isus2', 'Isus2', 'vi7', 'vi7'], weight: 4 },
      { chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7'], weight: 3 },
      { chords: ['I', 'I', 'I', 'I'], weight: 2 },
    ],
    verse: [
      { chords: ['I', 'I', 'V', 'V', 'vi7', 'vi7', 'IV', 'IV'], weight: 5, note: 'The plainest four chords in popular music, and this is the one corner of this genre where they belong — by 1988 these were records with verses in them' },
      { chords: ['Isus2', 'Isus2', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 4, note: 'The borrowed flat seventh keeps it from resolving too cleanly: bright without being a pop song' },
      { chords: ['vi7', 'vi7', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 4 },
      { chords: ['I', 'V', 'vi7', 'IV', 'I', 'V', 'IV', 'IV'], weight: 4, note: 'A chord a bar — twice this genre\'s usual rate, and the fastest harmonic motion anywhere in it' },
      { chords: ['Imaj7', 'Imaj7', 'iii7', 'iii7', 'IVmaj7', 'IVmaj7', 'V', 'V'], weight: 3 },
      { chords: ['I', 'I', 'iii7', 'iii7', 'vi7', 'vi7', 'IVmaj7', 'IVmaj7'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'V', 'V', 'vi7', 'vi7', 'IV', 'IV'], weight: 5, note: 'It lands on the relative minor instead of the tonic. The lift is real and the arrival is withheld, which is how these records keep going for six minutes' },
      { chords: ['IV', 'V', 'I', 'I', 'IV', 'V', 'vi7', 'vi7'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'IV', 'V', 'V', 'I', 'I'], weight: 4 },
      { chords: ['bVI', 'bVI', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 3, note: 'Both borrowed out of the parallel minor — the one gesture this style keeps from the dark end of the genre' },
      { chords: ['vi7', 'IV', 'I', 'V', 'vi7', 'IV', 'V', 'V'], weight: 3 },
    ],
    bridge: [
      { chords: ['vi7', 'vi7', 'iii7', 'iii7', 'IVmaj7', 'IVmaj7', 'V', 'V'], weight: 4 },
      { chords: ['ii7', 'ii7', 'V', 'V', 'Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7'], weight: 3 },
      { chords: ['IV', 'IV', 'bVI', 'bVI', 'bVII', 'bVII', 'I', 'I'], weight: 3 },
    ],
    solo: [
      { chords: ['I', 'I', 'V', 'V', 'vi7', 'vi7', 'IV', 'IV'], weight: 5 },
      { chords: ['Isus2', 'Isus2', 'IVsus2', 'IVsus2', 'Isus2', 'Isus2', 'bVII', 'bVII'], weight: 3 },
    ],
    outro: [
      { chords: ['IV', 'V', 'I', 'I'], weight: 4 },
      { chords: ['vi7', 'IV', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    intro: [
      { chords: ['i9', 'i9', 'VI', 'VI'], weight: 4 },
      { chords: ['isus2', 'isus2', 'isus2', 'isus2'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i9', 'i9', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VI'], weight: 4, note: 'The descending tetrachord at a chord a bar. Minor, and still moving faster than anything in `berlin`, which is what puts this style in the eighties rather than the seventies' },
      { chords: ['i', 'i', 'iv', 'iv', 'VI', 'VI', 'VII', 'VII'], weight: 3 },
      { chords: ['i9', 'i9', 'III', 'III', 'VII', 'VII', 'iv9', 'iv9'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['III', 'III', 'VII', 'VII', 'iv', 'iv', 'VI', 'VI'], weight: 4 },
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'III', 'III'], weight: 3 },
      { chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'III', 'III', 'VII', 'VII', 'VI', 'VI'], weight: 4 },
      { chords: ['VI', 'VI', 'iv', 'iv', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    solo: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i9', 'i9', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 3 },
    ],
    outro: [
      { chords: ['VI', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'VII', 'i', 'i'], weight: 3 },
    ],
  },
  /**
   * Busier than `berlin`'s and less blunt than `machine`'s. Sixteenth pairs and
   * pickups are the vocabulary here — this lead is a tune somebody wrote at a
   * keyboard rather than a colour drawn across a sequence, and the difference
   * shows up as cells that start before the downbeat and subdivide inside it.
   */
  melodyCells: [
    { cell: [4, 4, 8], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [-2, 2, 4, 8], weight: 3 },
    { cell: [4, 2, 2, 8], weight: 3 },
    { cell: [16], weight: 3 },
    { cell: [-8, 4, 4], weight: 3 },
    { cell: [12, 4], weight: 2 },
    { cell: [2, 2, 2, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    /** Octave jumps on the eighths — the FM bass of the decade, where the
     *  attack is the sound and the note underneath it barely matters. */
    { name: 'octave-eighths', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.96 },
      { at: 4, dur: 1, tone: 'octave', vel: 0.76 },
      { at: 6, dur: 1, tone: 'root', vel: 0.72 },
      { at: 8, dur: 3, tone: 'root', vel: 0.9 },
      { at: 12, dur: 1, tone: 'octave', vel: 0.76 },
      { at: 14, dur: 1, tone: 'fifth', vel: 0.74 },
    ] },
    /**
     * Two bars, syncopated, and the second half is the one that moves — the same
     * design as `machine`'s hook and pointedly not the same music, because here
     * the figure is a *floor* under an arpeggio and a tune rather than the
     * subject of the record. It answers itself quietly.
     */
    { name: 'two-bar-floor', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.94 },
      { at: 6, dur: 2, tone: 'root', vel: 0.76 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.86 },
      { at: 12, dur: 3, tone: 'root', vel: 0.76 },
      { at: 16, dur: 3, tone: 'root', vel: 0.92 },
      { at: 22, dur: 2, tone: 'seventh', vel: 0.76 },
      { at: 24, dur: 3, tone: 'octave', vel: 0.86 },
      { at: 28, dur: 3, tone: 'fifth', vel: 0.78 },
    ] },
    /** Sixteenths, on the root, with the last one of each beat pushed up an
     *  octave. The driving one, and the closest this style gets to `cosmic`. */
    { name: 'sixteenth-drive', weight: 4, hits: [
      { at: 0, dur: 1, tone: 'root', vel: 0.96 },
      { at: 1, dur: 1, tone: 'root', vel: 0.7 },
      { at: 2, dur: 1, tone: 'root', vel: 0.8 },
      { at: 3, dur: 1, tone: 'octave', vel: 0.7 },
      { at: 4, dur: 1, tone: 'root', vel: 0.88 },
      { at: 6, dur: 1, tone: 'root', vel: 0.76 },
      { at: 7, dur: 1, tone: 'octave', vel: 0.7 },
      { at: 8, dur: 1, tone: 'root', vel: 0.92 },
      { at: 9, dur: 1, tone: 'root', vel: 0.7 },
      { at: 10, dur: 1, tone: 'root', vel: 0.8 },
      { at: 11, dur: 1, tone: 'octave', vel: 0.7 },
      { at: 12, dur: 1, tone: 'fifth', vel: 0.88 },
      { at: 14, dur: 1, tone: 'fifth', vel: 0.76 },
      { at: 15, dur: 1, tone: 'octave', vel: 0.7 },
    ] },
    /** Quarters, plain, with the third in it. A bass line that outlines rather
     *  than pulses — for the choruses where the harmony is moving a chord a bar
     *  and something has to make that audible down there. */
    { name: 'outline', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.94 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.78 },
      { at: 8, dur: 3, tone: 'octave', vel: 0.86 },
      { at: 12, dur: 3, tone: 'third', vel: 0.78 },
    ] },
    { name: 'pedal', weight: 3, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.88 },
    ] },
  ],
  comp: [
    /**
     * The arpeggio this style is built on: two bars of sixteenths climbing and
     * falling through two octaves, against harmony that moves every two.
     *
     * Thirty-two steps and ten rungs — four voices doubled to eight, folded to
     * ten by `updown` — share only a factor of two, so the figure needs five
     * passes to come home and a sixteen-bar section never hears the same
     * alignment twice. That is the Berlin arithmetic applied to a brighter
     * instrument, and it is the one thing the two styles genuinely share.
     */
    { name: 'arp-two-bar', weight: 6, voices: 4, arpeggio: true, arpDirection: 'updown', arpOctaves: 2, cycle: 32, hits: [
      { at: 0, dur: 1, vel: 0.54 }, { at: 1, dur: 1, vel: 0.38 }, { at: 2, dur: 1, vel: 0.46 }, { at: 3, dur: 1, vel: 0.38 },
      { at: 4, dur: 1, vel: 0.5 }, { at: 5, dur: 1, vel: 0.38 }, { at: 6, dur: 1, vel: 0.46 }, { at: 7, dur: 1, vel: 0.38 },
      { at: 8, dur: 1, vel: 0.5 }, { at: 9, dur: 1, vel: 0.38 }, { at: 10, dur: 1, vel: 0.46 }, { at: 11, dur: 1, vel: 0.38 },
      { at: 12, dur: 1, vel: 0.5 }, { at: 13, dur: 1, vel: 0.38 }, { at: 14, dur: 1, vel: 0.46 }, { at: 15, dur: 1, vel: 0.38 },
      { at: 16, dur: 1, vel: 0.54 }, { at: 17, dur: 1, vel: 0.38 }, { at: 18, dur: 1, vel: 0.46 }, { at: 19, dur: 1, vel: 0.38 },
      { at: 20, dur: 1, vel: 0.5 }, { at: 21, dur: 1, vel: 0.38 }, { at: 22, dur: 1, vel: 0.46 },
      { at: 24, dur: 1, vel: 0.5 }, { at: 25, dur: 1, vel: 0.38 }, { at: 26, dur: 1, vel: 0.46 }, { at: 27, dur: 1, vel: 0.38 },
      { at: 28, dur: 1, vel: 0.5 }, { at: 29, dur: 1, vel: 0.38 }, { at: 30, dur: 1, vel: 0.46 },
    ] },
    /**
     * Three beats of eighths, so the figure lands on a different beat every bar
     * and comes home every third. The shortest cycle here and the one that reads
     * as a *shimmer* rather than as a part — which is what an arpeggiator set
     * running while somebody plays chords into it actually sounds like, and by
     * this era that is how most of these figures were made.
     */
    { name: 'arp-three-beat', weight: 4, voices: 3, arpeggio: true, arpOctaves: 2, cycle: 12, hits: [
      { at: 0, dur: 2, vel: 0.5 }, { at: 2, dur: 2, vel: 0.38 },
      { at: 4, dur: 2, vel: 0.46 }, { at: 6, dur: 2, vel: 0.38 },
      { at: 8, dur: 2, vel: 0.46 }, { at: 10, dur: 2, vel: 0.38 },
    ] },
    /** Bar-shaped eighths, falling. For the sections where the bass has taken the
     *  sixteenths and a second drifting figure would be one too many — the same
     *  reasoning `berlin`'s `gate-chords` makes, answered with an arpeggio
     *  instead of with chords because this style's comp is never furniture. */
    { name: 'arp-eighths-down', weight: 4, voices: 4, arpeggio: true, arpDirection: 'down', hits: [
      { at: 0, dur: 2, vel: 0.5 }, { at: 2, dur: 2, vel: 0.38 },
      { at: 4, dur: 2, vel: 0.46 }, { at: 6, dur: 2, vel: 0.38 },
      { at: 8, dur: 2, vel: 0.48 }, { at: 10, dur: 2, vel: 0.38 },
      { at: 12, dur: 2, vel: 0.46 }, { at: 14, dur: 2, vel: 0.38 },
    ] },
    /**
     * Five sixteenths, sparse, over two octaves — a bell rather than a sequence.
     * Twenty steps against a sixteen-step bar rotates by a beat a bar, and the
     * ten-rung ladder needs ten passes to repeat, which is forty bars: longer
     * than any section, so the figure is never once heard the same way twice.
     */
    { name: 'bell-figure', weight: 3, voices: 4, arpeggio: true, arpDirection: 'updown', arpOctaves: 2, cycle: 20, hits: [
      { at: 0, dur: 3, vel: 0.48 }, { at: 4, dur: 3, vel: 0.36 },
      { at: 8, dur: 3, vel: 0.44 }, { at: 12, dur: 3, vel: 0.36 },
      { at: 16, dur: 3, vel: 0.42 },
    ] },
    /** Whole chords on the offbeats — the DX brass stab, which by 1987 is doing
     *  the job a guitar would have done. The one comp here that is not a
     *  sequence at all. */
    { name: 'brass-stabs', weight: 3, voices: 4, hits: [
      { at: 2, dur: 2, vel: 0.48 },
      { at: 6, dur: 2, vel: 0.42 },
      { at: 10, dur: 2, vel: 0.48 },
      { at: 14, dur: 2, vel: 0.42 },
    ] },
  ],
  drums: [
    /** The gated snare on the backbeat with the kick pushed off it. The sound of
     *  the decade, and in this style it is what announces a section — the job
     *  `berlin` gives to the filter. */
    { name: 'gated-backbeat', weight: 6, voices: {
      bd: [0, 6, 10],
      sd: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      cr: [0],
    } },
    { name: 'sixteenth-hats', weight: 5, voices: {
      bd: [0, 6, 8],
      sd: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    } },
    /** Half-time: one snare in the middle of the bar and a kick that fills the
     *  space it leaves. At the bottom of this style's tempo range it is what
     *  turns a brisk arpeggio into a slow piece with a fast machine in it. */
    { name: 'half-time', weight: 4, voices: {
      bd: [0, 6, 11],
      sd: [8],
      oh: [4, 12],
      hh: [2, 6, 10, 14],
    } },
    { name: 'four-floor-light', weight: 4, voices: {
      bd: [0, 4, 8, 12],
      cp: [4, 12],
      hh: [2, 6, 10, 14],
      oh: [14],
    } },
    /** Rim and ride, no snare. The verse kit: something has to keep time while
     *  the arpeggio does the work, and a backbeat here would be arguing with the
     *  chorus that is coming. */
    { name: 'rim-groove', weight: 3, voices: {
      bd: [0, 8],
      rim: [4, 12],
      rd: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    /**
     * The kit that drifts: a bar and a half, so the backbeat lands on 3 and then
     * on 1. Weighted low, and it is the one row in the table that remembers this
     * style came out of the Berlin school — everything else here agrees with the
     * barline, which is exactly what the older style refuses to do.
     */
    { name: 'drift-backbeat', weight: 2, cycle: 24, voices: {
      bd: [0, 10, 12],
      sd: [8, 20],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22],
    } },
  ],
  /**
   * Wider and more decorated than `berlin`, and much less repetitive than
   * `machine`. `sequence: 0.4` is the low end of the genre: a tune that restated
   * its motif exactly would be the sequencer's job, and this is the style where
   * somebody stopped letting the machine have it.
   */
  melody: { leap: 0.28, ornament: 0.12, span: 15, sequence: 0.4, syncopation: 0.4 },
};

export const STYLES: Record<string, Style> = {
  berlin, cinematic, machine, cosmic, stalker, optical,
};
