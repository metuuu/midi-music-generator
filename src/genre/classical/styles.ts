/**
 * The classical catalogue — the dances, the contrapuntal forms and the
 * character pieces, 1700 to 1915.
 *
 * Organised by *form*, because that is what this repertoire organises itself
 * by and it is the only sort that survives contact with it. Sort three hundred
 * years of written music by mood and you get "sad" and "fast"; sort it by
 * instrumentation and the same minuet appears four times because somebody
 * scored it for strings, for harpsichord, for wind octet and for orchestra.
 * Sort it by form and every entry below is a *set of rules a composer agreed
 * to before writing a note* — how many bars, where the weight falls, which key
 * the middle goes to, and how it gets home. That is what these pieces have
 * instead of a groove.
 *
 * ## The four facts that separate this file from every other styles.ts here
 *
 * **There is no drum kit, anywhere, in any style.** Every entry below carries
 * `excludeLayers: ['drums']` and `drums: []`, and the empty table is the
 * statement rather than an omission. This is not squeamishness about percussion
 * — the orchestra has percussion, and it is in the era palettes as `timpani`, on
 * the `brass` layer, where a pitched instrument that plays the tonic and the
 * dominant under a tutti belongs. What it does not have is a *kit*: a hi-hat on
 * every eighth, a backbeat on two and four, and a tom roll into a crash to
 * announce the next section. That object was invented around 1918 for a
 * different music, and one bar of it in a minuet is the single most out-of-place
 * sound this generator can make. Ambient reaches the same place from the other
 * direction and says so at length; the difference is that ambient has styles
 * with a kit in them and this genre has none at all.
 *
 * Those tables were not always empty. `generateSong` drew the drum figure before
 * it read `excludedLayers`, and `rng.weightedBy` throws on a table with nothing
 * in it, so all twenty-six carried a shared `NO_KIT` constant — one row named
 * `none` whose `voices` was `{}` — purely to be non-empty. `eras.ts` carried the
 * same trick for the same reason and its own note records that half. Both draws
 * are guarded now, so the workaround is gone and the field says what is true.
 *
 * **It was not free**, and the cost is worth writing down, because the guard
 * *skips* the draw rather than discarding its result: two `next()` fewer on the
 * song's stream re-rolls everything behind them. Measured across 220 classical
 * renders — 12 free draws, 26 styles x 4 seeds, and all 26 x 4 forced style/era
 * pairings — **215 came out different music and 5 were bit-identical**, the
 * latter being songs whose progression draws happened to land on the same rows
 * of tables that are one to four entries wide. The other eighteen genres did not
 * move at all: 1,668 renders, every MIDI and every Strudel body byte-identical.
 *
 * It is a re-roll and not a fault, and that was checked field by field rather
 * than inferred from the hashes. **Style, era, mood, key, tempo and form were
 * identical in all 220** — every one of those is drawn upstream of the two
 * guarded lines. What moved is what the harmony draws feed: the notes, in 211 of
 * the 220, by 39 notes on average. Eighteen songs also gained or lost the
 * `counter` layer, which is the arrangement coin landing the other way and not a
 * layer becoming unavailable. And the number these tables were ever really
 * claiming is unchanged: **0 drum events before, 0 after, in every one of the
 * 220.**
 *
 * **Nothing here is a groove, so nothing here varies.** `vary` is absent on all
 * twenty-six, and that absence is the strongest single claim in the file. Its
 * own docstring says it is *"the chance that the identity is played
 * differently"* — a rhythm section leaning into a phrase end. There is no
 * rhythm section. There are second violins reading a part, and a second violin
 * who pushed the figure at bar four because they felt like it would be given a
 * note about it in the interval. Every departure from the written text in this
 * repertoire is either an ornament (which is `melody.ornament`, and it is high
 * here) or a change of dynamic (which is the arranger's, not the player's).
 *
 * **The bass is a line, not a figure.** Every bass pattern below is written in
 * chord functions — `root`, `third`, `fifth`, `approach` — and never in
 * semitone offsets. That is not a stylistic preference: a numeric tone is *a
 * shape, re-rooted every time the harmony moves*, which is what a riff is, and
 * a continuo bass is the opposite thing. It is a melody in the bass clef with
 * figures over it, and every note of it is chosen against the chord it is
 * standing on. Nothing in this genre plays a riff.
 *
 * **Half of these are in three.** A minuet, a sarabande, a waltz, a mazurka, a
 * polonaise, a scherzo, a passacaglia and a chaconne are all 3/4, and they are
 * eight different pieces of music. The metre tells you nothing; where the
 * weight falls tells you everything, and it lands in `melodyCells`, in the bass
 * figure and in `shots`. The sarabande's whole identity is a long second beat.
 * The mazurka's is a short one that is nevertheless accented. The polonaise
 * puts a stress on the first beat and then splits it. The waltz puts a bass
 * note on one and two chords after it and never touches beat two at all. If the
 * only difference between two of these styles is the tempo band, one of them
 * has been written wrong.
 *
 * ## Progressions, and what "relative to the mode" costs here
 *
 * Roman numerals are read relative to the mode, so `VII` in A minor is G major.
 * That convention is right for the whole project and it is worth naming the one
 * place it bites in this repertoire: the raised leading tone in minor is *not*
 * `VII`, it is what `V7` and `#viio7` carry inside them. Both are written out
 * below wherever the cadence needs them, and `scaleForChord` in `index.ts` is
 * what turns them into a line with a leading tone in it.
 *
 * The other thing this file does that no other does: **secondary dominants are
 * everywhere, and they are load-bearing rather than decorative.** `V7/V`,
 * `V7/vi`, `V7/ii`, `V7/IV` and `#viio7/V` appear in almost every table, and
 * each one re-roots the melody onto the key it is tonicising for exactly as
 * long as it lasts. That is how a development section departs, how a second
 * subject arrives in the dominant, and how a sixteen-bar episode gets somewhere
 * and back. **`Genre.forms` has no way to say "this section is in another
 * key"**, and it does not need one: a bridge whose progression is a chain of
 * applied dominants *is* in another key, bar by bar, and the line goes with it.
 *
 * ## Where the tempo bands come from
 *
 * The `bpm` field is always in **quarter notes**, which is what the engine's
 * beat is, and in compound metre that is not the pulse anybody counts. A gigue
 * at `bpm: 152` is four dotted quarters at 101 to the minute, because a 6/8 bar
 * here is three quarters long and two dotted-quarter beats wide. Read the
 * compound entries that way or they look absurd.
 */

import type { Style } from '../../style/types.js';

// ---------------------------------------------------------------------------
// The baroque suite — dances that stopped being danced
// ---------------------------------------------------------------------------

/**
 * MINUET — the one dance in the suite that survived into the symphony.
 *
 * Everything else in a Bach suite is a stylised memory of a dance nobody was
 * still doing by 1720. The minuet was still being danced, and it went on being
 * danced for another seventy years, which is why it is the movement Haydn and
 * Mozart kept when they threw the rest of the suite away.
 *
 * Three things make it a minuet rather than any other three:
 *
 *  - **It is felt in one, not in three.** The bar is the unit and the phrase is
 *    four bars, so the melody cells are long — a dotted half, a half and a
 *    quarter, three quarters — and the bass touches the downbeat and leaves the
 *    rest alone. A figure that visits every beat of every bar is a waltz taken
 *    slowly.
 *  - **Four-bar phrases, and they answer each other.** `melody.sequence` at
 *    0.62 is the highest in the baroque half of the file: this is the form the
 *    antecedent–consequent pair was invented in, and a minuet whose second
 *    phrase is not obviously about the first is not a minuet.
 *  - **It cadences on the dominant halfway through.** The eight-bar tables below
 *    almost all stop on `V` at bar four, which is the half cadence that makes
 *    the second half necessary.
 *
 * Major by three to one. Minor minuets exist and Bach wrote several, which is
 * what the quarter is for.
 */
const minuet: Style = {
  id: 'minuet',
  label: 'Minuet',
  description:
    'Courtly 3/4 felt one to a bar. Four-bar phrases answering each other, a half cadence in the middle and a full one at the end.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [120, 144],
  swing: 0,
  modeWeights: { minor: 0.25, major: 0.75 },
  /**
   * The trio, and the reason this number is not zero in a genre that has never
   * heard of a modulating chorus.
   *
   * `relativeMajorChorus` lifts a minor-key chorus into the relative major, and
   * in this form that gesture has a name and a place: the trio of a minor
   * minuet is very often in the relative major, and the whole point of a trio is
   * that it is somewhere else and lighter. Modest, because it is only one of the
   * things a trio does — the subdominant and the parallel major are just as
   * common — and the rest of that variety lives in the `bridge` tables.
   */
  relativeMajorChorus: 0.35,
  excludeLayers: ['drums'],
  progressions: {
    intro: [
      { chords: ['I', 'V', 'V', 'I'], weight: 4 },
      { chords: ['I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'V', 'I', 'V', 'I', 'IV', 'V7', 'I'], weight: 5, note: 'Half cadence at bar four, full cadence at bar eight — the shape the form is' },
      { chords: ['I', 'IV', 'I', 'V', 'vi', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'V7/V', 'V', 'V', 'I', 'IV', 'V7', 'I'], weight: 4, note: 'The applied dominant makes the half cadence a real arrival rather than a chord the tune happened to stop on' },
      { chords: ['I', 'vi', 'IV', 'V', 'I', 'ii', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['V', 'V', 'V7/V', 'V', 'I', 'ii', 'V7', 'I'], weight: 5, note: 'The second strain opens in the dominant and works its way home, which is what a rounded binary does' },
      { chords: ['V', 'I', 'ii', 'V7', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['vi', 'iii', 'IV', 'I', 'ii', 'V7', 'I', 'I'], weight: 3, note: 'Descending fifths through the middle of the key' },
    ],
    bridge: [
      { chords: ['IV', 'IV', 'I', 'I', 'ii', 'V7', 'I', 'I'], weight: 4, note: 'The trio, in the subdominant: plainer harmony and fewer players, which is what the word means' },
      { chords: ['I', 'V7/IV', 'IV', 'iv', 'I', 'V7', 'I', 'I'], weight: 3, note: 'The borrowed minor subdominant — the one shadow a minuet is allowed' },
      { chords: ['V', 'V', 'I', 'I', 'V7/V', 'V', 'V7', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['ii', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['IV', 'V7', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'V7', 'i', 'V7', 'i', 'iv', 'V7', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'V7', 'i', 'III', 'VI', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'V7/III', 'III', 'VII', 'i', 'iio', 'V7', 'i'], weight: 3, note: 'A minor minuet tonicises the relative major halfway and comes back for the cadence' },
    ],
    chorus: [
      { chords: ['III', 'VII', 'III', 'III', 'iv', 'i', 'V7', 'i'], weight: 4 },
      { chords: ['V7', 'i', 'iv', 'V7', 'i', 'iio', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'VI', 'iio', 'V7', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['III', 'III', 'VI', 'VI', 'iio', 'V7', 'i', 'i'], weight: 4, note: 'The trio of a minor minuet, in the relative major' },
      { chords: ['iv', 'iv', 'i', 'i', 'V7/V', 'V7', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['iv', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['iio', 'V7', 'i', 'I'], weight: 2, note: 'A tierce de Picardie — the major tonic that ends a minor movement, and the reason the scale rule has a clause for it' },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4], weight: 5 },
    { cell: [8, 4], weight: 4 },
    { cell: [12], weight: 3 },
    { cell: [4, 2, 2, 4], weight: 4 },
    { cell: [2, 2, 4, 4], weight: 3 },
    { cell: [-4, 4, 4], weight: 3 },
    { cell: [6, 2, 4], weight: 3 },
    { cell: [4, 4, 2, 2], weight: 2 },
    { cell: [2, 2, 2, 2, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 5 },
    { cell: [8, 4], weight: 3 },
    { cell: [4, 4, 4], weight: 2 },
  ],
  bass: [
    // One to a bar, which is how the dance is counted.
    { name: 'one-to-a-bar', weight: 5, hits: [{ at: 0, dur: 11, tone: 'root', vel: 0.9 }] },
    { name: 'root-and-fifth', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.92 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.7 },
    ] },
    { name: 'stepping-quarters', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.92 },
      { at: 4, dur: 3, tone: 'third', vel: 0.68 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.74 },
    ] },
  ],
  comp: [
    { name: 'chords-on-two-and-three', weight: 5, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.6 },
      { at: 8, dur: 3, vel: 0.55 },
    ] },
    { name: 'held', weight: 4, voices: 4, hits: [{ at: 0, dur: 12, vel: 0.48 }] },
    { name: 'quarters', weight: 2, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.6 },
      { at: 4, dur: 3, vel: 0.5 },
      { at: 8, dur: 3, vel: 0.52 },
    ] },
  ],
  drums: [],
  melody: { leap: 0.24, ornament: 0.3, span: 14, sequence: 0.62, syncopation: 0.08 },
};

/**
 * GAVOTTE — the dance that starts in the middle of the bar.
 *
 * Its one non-negotiable feature and the whole reason it is a separate entry
 * from the minuet: a gavotte begins on beat three of a four-beat bar, so every
 * phrase is a half-bar upbeat into a downbeat. Notated here in 2/2 with
 * `groups: [8, 8]`, which is how it is actually counted — two in a bar, not
 * four — and the half-bar upbeat is then literally a group.
 *
 * The upbeat lives in the melody cells rather than in a field, because the
 * engine has no way to say "this style is written with a two-beat anacrusis".
 * `{ cell: [-8, 4, 4] }` is a bar that rests through its first half and moves in
 * its second, which is the same music arriving one bar later, and the cells that
 * carry it take most of the weight. `melody.syncopation` at 0.35 is the other
 * half: it is the appetite for figures that cross the barline, and in this style
 * every figure does.
 *
 * Bright, square and almost always major. A minor gavotte is a curiosity.
 */
const gavotte: Style = {
  id: 'gavotte',
  label: 'Gavotte',
  description:
    'Cut-time dance beginning on the half-bar upbeat. Two in a bar, square four-bar phrases, and every figure crossing the barline.',
  beatsPerBar: 4,
  beatUnit: 2,
  groups: [8, 8],
  bpm: [104, 126],
  swing: 0,
  modeWeights: { minor: 0.15, major: 0.85 },
  relativeMajorChorus: 0.2,
  excludeLayers: ['drums'],
  /**
   * The band hits the half-bar, which is where the dance starts.
   *
   * Left to the metre this bar would derive a figure on slots 0 and 8 and an
   * anticipation of the second — correct for a bar of two and completely silent
   * about the thing that makes it a gavotte. Naming the figures puts the weight
   * on the upbeat group where the dancers put their feet.
   */
  shots: [[[8, 0], 1], [[0, 8], 3], [[8, 12, 0], 2]],
  progressions: {
    intro: [
      { chords: ['I', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'I', 'V', 'V', 'I', 'IV', 'V7', 'I'], weight: 5 },
      { chords: ['I', 'V7/V', 'V', 'V', 'ii', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'ii', 'V7', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'IV', 'viio', 'iii', 'vi', 'ii', 'V7', 'I'], weight: 3, note: 'Descending fifths through every diatonic degree — the baroque sequence, and what a gavotte does when it has eight bars to fill' },
    ],
    chorus: [
      { chords: ['V', 'V', 'V7/V', 'V', 'I', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'V7/vi', 'vi', 'iii', 'IV', 'V7', 'I', 'I'], weight: 4, note: 'Tonicising the submediant on the way out of the second strain' },
      { chords: ['IV', 'I', 'V7', 'I', 'IV', 'V7', 'I', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['V7/vi', 'vi', 'V7/ii', 'ii', 'V7/V', 'V', 'V7', 'I'], weight: 4, note: 'A chain of applied dominants: four keys in eight bars, each one lasting as long as its own dominant' },
      { chords: ['vi', 'iii', 'IV', 'I', 'ii', 'V7', 'I', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['ii', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['IV', 'I', 'V7', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'i', 'iv', 'V7', 'i'], weight: 5 },
      { chords: ['i', 'V7/III', 'III', 'III', 'iv', 'V7', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'VII', 'III', 'V7', 'i', 'iv', 'V7', 'i'], weight: 4 },
      { chords: ['iv', 'V7', 'i', 'VI', 'iio', 'V7', 'i', 'i'], weight: 3 },
    ],
    outro: [{ chords: ['iio', 'V7', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    // The upbeat cells, which is what this style is. Half the bar silent, and
    // then the figure that lands on the next downbeat.
    { cell: [-8, 4, 4], weight: 6 },
    { cell: [-8, 2, 2, 4], weight: 4 },
    { cell: [-8, 8], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [16], weight: 2 },
    { cell: [2, 2, 2, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [-8, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'two-in-a-bar', weight: 6, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.92 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.8 },
    ] },
    { name: 'walking-halves', weight: 4, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.92 },
      { at: 8, dur: 7, tone: 'approach', vel: 0.78 },
    ] },
    { name: 'quarters', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.9 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.68 },
      { at: 8, dur: 3, tone: 'root', vel: 0.8 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'on-the-halves', weight: 5, voices: 3, hits: [
      { at: 0, dur: 7, vel: 0.6 },
      { at: 8, dur: 7, vel: 0.56 },
    ] },
    { name: 'quarter-chords', weight: 4, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.6 },
      { at: 4, dur: 3, vel: 0.5 },
      { at: 8, dur: 3, vel: 0.56 },
      { at: 12, dur: 3, vel: 0.5 },
    ] },
    { name: 'held', weight: 2, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.45 }] },
  ],
  drums: [],
  melody: { leap: 0.26, ornament: 0.28, span: 14, sequence: 0.58, syncopation: 0.35 },
};

/**
 * SARABANDE — 3/4 with the weight on the second beat.
 *
 * The slowest thing in the suite and the one whose identity is a single
 * displaced accent. A sarabande and a minuet are both three quarters in a bar
 * and the sarabande leans on beat two — a note struck on one and *held through
 * two*, or struck on two and held longer than the one before it. Take that away
 * and what is left is an adagio in three.
 *
 * So the tables are built around one figure, `[4, 8]`: a quarter and then a half
 * that occupies the rest of the bar. It carries the most weight in the melody
 * cells, the bass hits one and two with the second note longer, and the comp
 * lands its chord on beat two rather than after it. Everything else here is
 * ordinary.
 *
 * Minor by two to one, and dark. This is the movement of a suite that a listener
 * remembers, and it is remembered for being the sad one.
 */
const sarabande: Style = {
  id: 'sarabande',
  label: 'Sarabande',
  description:
    'Grave 3/4 whose whole identity is the weight on the second beat. A quarter, then a half that fills the rest of the bar.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [50, 66],
  swing: 0,
  modeWeights: { minor: 0.68, major: 0.32 },
  relativeMajorChorus: 0.25,
  excludeLayers: ['drums'],
  shots: [[[0, 4], 4], [[4], 2]],
  progressions: {
    intro: [
      { chords: ['i', 'V7', 'i', 'i'], weight: 3 },
      { chords: ['i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'iv', 'V7', 'i', 'VI', 'iio', 'V7', 'i'], weight: 5 },
      { chords: ['i', 'V7/III', 'III', 'VII', 'VI', 'iio', 'V7', 'i'], weight: 4, note: 'Away to the relative major and back through a Phrygian pre-dominant' },
      { chords: ['i', 'VII', 'VI', 'V7', 'i', 'iv', 'V7', 'i'], weight: 4, note: 'The descending tetrachord, which in this repertoire is a lament rather than a tango' },
      { chords: ['i', 'i', 'iv', 'iv', 'V7', 'V7', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'VII', 'III', 'V7/V', 'V7', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'bII', 'V7', 'i', 'iv', 'V7', 'i', 'i'], weight: 4, note: 'The Neapolitan as the pre-dominant, which is the darkest chord this form owns' },
      { chords: ['i', 'VI', 'iio', 'V7', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['VI', 'VI', 'III', 'III', 'iv', 'V7/V', 'V7', 'V7'], weight: 4 },
      { chords: ['iv', 'V7/iv', 'iv', 'bII', 'V7', 'V7', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['iv', 'V7', 'i', 'I'], weight: 4, note: 'Tierce de Picardie: a minor sarabande almost always ends on a major chord, and the effect only works because everything before it was minor' },
      { chords: ['bII', 'V7', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'IV', 'V7', 'I', 'vi', 'ii', 'V7', 'I'], weight: 5 },
      { chords: ['I', 'V7/vi', 'vi', 'iii', 'IV', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'iv', 'I', 'V7', 'vi', 'IV', 'V7', 'I'], weight: 3, note: 'The borrowed minor subdominant in a major sarabande — mode mixture without leaving the key, and the reason `harmonicMajor` is in the scale ladder' },
    ],
    chorus: [
      { chords: ['V', 'V', 'V7/V', 'V', 'I', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['IV', 'iv', 'I', 'V7', 'I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    outro: [{ chords: ['IV', 'V7', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    // The sarabande figure, and it takes almost half the table.
    { cell: [4, 8], weight: 7 },
    { cell: [4, 6, 2], weight: 4 },
    { cell: [12], weight: 3 },
    { cell: [4, 4, 4], weight: 3 },
    { cell: [2, 2, 8], weight: 3 },
    { cell: [4, 2, 2, 4], weight: 2 },
    { cell: [8, 4], weight: 2 },
    { cell: [-4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [4, 8], weight: 5 },
    { cell: [12], weight: 4 },
    { cell: [4, 4, 4], weight: 2 },
  ],
  bass: [
    // One and two, and the second note is the long one. This is the accent.
    { name: 'weighted-second', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.8 },
      { at: 4, dur: 7, tone: 'fifth', vel: 0.95 },
    ] },
    { name: 'held-root', weight: 3, hits: [{ at: 0, dur: 11, tone: 'root', vel: 0.85 }] },
    { name: 'walking-three', weight: 2, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.82 },
      { at: 4, dur: 3, tone: 'third', vel: 0.9 },
      { at: 8, dur: 3, tone: 'approach', vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'chord-on-two', weight: 6, voices: 4, hits: [
      { at: 0, dur: 3, vel: 0.5 },
      { at: 4, dur: 7, vel: 0.68 },
    ] },
    { name: 'held', weight: 3, voices: 4, hits: [{ at: 0, dur: 12, vel: 0.5 }] },
  ],
  drums: [],
  melody: { leap: 0.18, ornament: 0.38, span: 13, sequence: 0.5, syncopation: 0.12 },
};

/**
 * GIGUE — compound, fast, and imitative.
 *
 * The last movement of the suite and the only one that runs. 6/8 here, which is
 * `beatsPerBar: 3` at `beatUnit: 8` with `groups: [6, 6]` — two dotted-quarter
 * beats, each a group of six sixteenths, and the grouping has to be declared
 * because no arithmetic recovers 3+3 eighths from the number 12.
 *
 * What separates it from a barcarolle, which is the same metre: the gigue is
 * *contrapuntal*. Its second half traditionally inverts the subject of its
 * first, the voices enter one after another, and the texture is two or three
 * independent lines rather than a tune over a rocking accompaniment. That shows
 * up here as `arrangement`'s `trade` doing most of the work at the genre level,
 * as a bass that walks in eighths rather than rocking, and as the highest
 * `sequence` in the file: 0.68, because a gigue is a subject stated and then
 * restated a step away, over and over, until the cadence.
 */
const gigue: Style = {
  id: 'gigue',
  label: 'Gigue',
  description:
    'Fast compound 6/8 in two dotted beats. Running eighths, imitative entries and a subject that keeps being restated a step away.',
  beatsPerBar: 3,
  beatUnit: 8,
  groups: [6, 6],
  bpm: [132, 168],
  swing: 0,
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0.3,
  excludeLayers: ['drums'],
  progressions: {
    verse: [
      { chords: ['I', 'V', 'I', 'V', 'I', 'IV', 'V7', 'I'], weight: 5 },
      { chords: ['I', 'V7/V', 'V', 'V', 'V7/V', 'V', 'V7', 'I'], weight: 4, note: 'The first strain of a gigue ends in the dominant and stays there — the applied dominant is what makes that an arrival rather than a stall' },
      { chords: ['I', 'IV', 'viio', 'iii', 'vi', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'IV', 'ii', 'V7', 'V7', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['V', 'I', 'V7/vi', 'vi', 'IV', 'ii', 'V7', 'I'], weight: 5 },
      { chords: ['V', 'V', 'V7/ii', 'ii', 'V7', 'I', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'V7/IV', 'IV', 'I', 'ii', 'V7', 'I', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['vi', 'V7/vi', 'vi', 'iii', 'V7/ii', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['V7/V', 'V', 'V7/vi', 'vi', 'IV', 'ii', 'V7', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['ii', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['IV', 'V7', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'V7', 'i', 'V7', 'i', 'iv', 'V7', 'i'], weight: 5 },
      { chords: ['i', 'V7/III', 'III', 'III', 'VII', 'III', 'V7', 'i'], weight: 4, note: 'A minor gigue ends its first strain in the relative major, which is where a minor-key first strain goes' },
      { chords: ['i', 'iv', 'VII', 'III', 'VI', 'iio', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'VII', 'i', 'V7/iv', 'iv', 'iio', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'V7/V', 'V7', 'V7', 'i', 'iv', 'V7', 'i'], weight: 4 },
    ],
    outro: [{ chords: ['iv', 'V7', 'i', 'I'], weight: 3 }, { chords: ['iio', 'V7', 'i', 'i'], weight: 3 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 2, 2], weight: 6 },
    { cell: [4, 2, 6], weight: 5 },
    { cell: [6, 2, 2, 2], weight: 4 },
    { cell: [2, 2, 2, 6], weight: 4 },
    { cell: [6, 6], weight: 3 },
    { cell: [4, 2, 4, 2], weight: 3 },
    { cell: [-2, 2, 2, 6], weight: 3 },
    { cell: [12], weight: 2 },
    { cell: [-4, 2, 6], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 4 },
    { cell: [6, 6], weight: 4 },
    { cell: [4, 2, 6], weight: 3 },
  ],
  bass: [
    { name: 'running-eighths', weight: 5, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.9 },
      { at: 2, dur: 2, tone: 'third', vel: 0.62 },
      { at: 4, dur: 2, tone: 'fifth', vel: 0.66 },
      { at: 6, dur: 2, tone: 'octave', vel: 0.78 },
      { at: 8, dur: 2, tone: 'fifth', vel: 0.6 },
      { at: 10, dur: 2, tone: 'approach', vel: 0.66 },
    ] },
    { name: 'dotted-beats', weight: 4, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 0.92 },
      { at: 6, dur: 5, tone: 'fifth', vel: 0.76 },
    ] },
    { name: 'six-eight-lift', weight: 3, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 0.92 },
      { at: 6, dur: 2, tone: 'fifth', vel: 0.68 },
      { at: 10, dur: 2, tone: 'approach', vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'on-the-dotted-beats', weight: 5, voices: 3, hits: [
      { at: 0, dur: 5, vel: 0.6 },
      { at: 6, dur: 5, vel: 0.55 },
    ] },
    { name: 'offbeat-eighths', weight: 3, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.5 },
      { at: 4, dur: 2, vel: 0.55 },
      { at: 8, dur: 2, vel: 0.5 },
      { at: 10, dur: 2, vel: 0.55 },
    ] },
    { name: 'held', weight: 2, voices: 4, hits: [{ at: 0, dur: 12, vel: 0.45 }] },
  ],
  drums: [],
  melody: { leap: 0.3, ornament: 0.22, span: 16, sequence: 0.68, syncopation: 0.2 },
};

/**
 * PASSACAGLIA — a bass line, repeated, with everything else built over it.
 *
 * The first of two ground-bass forms here and the one where the ground is
 * literally a *bass*: eight bars of tune in the lowest voice, played straight
 * through from the first bar to the last, while the texture above it thickens
 * variation by variation. Bach's C minor organ passacaglia does it twenty
 * times.
 *
 * It is expressed by writing the **same eight-bar progression into every
 * section**. That is not laziness dressed up — it is precisely what the form
 * is, and it is why `chorusBars` is absent here despite this being the most
 * obvious candidate for it in the file: the ground is already eight bars, which
 * is the default section length, so declaring it would change nothing and claim
 * something. What makes one section differ from the next is the arrangement
 * arriving on top, which is `EraProfile.density` and the arranger's business.
 *
 * Almost always minor, and slow enough that every note of the bass is heard as
 * a note rather than as a pulse.
 */
const passacaglia: Style = {
  id: 'passacaglia',
  label: 'Passacaglia',
  description:
    'An eight-bar ground bass, unchanged from the first bar to the last, with the texture above it thickening over it.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [56, 76],
  swing: 0,
  modeWeights: { minor: 0.88, major: 0.12 },
  relativeMajorChorus: 0.1,
  excludeLayers: ['drums'],
  /**
   * `earworm` on the harmony rather than on the tune, which is the one thing
   * this hook level is exactly right for and the reason it is here rather than
   * `catchy`. The ground *is* the piece; a section that drew a different
   * progression would not be a variation, it would be a different movement.
   * `harmonicSimplicity` at the top of the range makes the plainest table entry
   * win almost every draw, and the tables below are written so that the plainest
   * entry is the ground.
   */
  hook: 'earworm',
  progressions: {
    intro: [
      { chords: ['i', 'V7', 'VI', 'III', 'iv', 'i', 'V7', 'i'], weight: 5, note: 'The ground, stated bare' },
    ],
    verse: [
      { chords: ['i', 'V7', 'VI', 'III', 'iv', 'i', 'V7', 'i'], weight: 6, note: 'The ground' },
      { chords: ['i', 'VII', 'VI', 'V7', 'iv', 'V7', 'i', 'i'], weight: 3, note: 'The other ground the form uses — the descending tetrachord, four bars of fall and four of cadence' },
    ],
    chorus: [
      { chords: ['i', 'V7', 'VI', 'III', 'iv', 'i', 'V7', 'i'], weight: 6 },
      { chords: ['i', 'VII', 'VI', 'V7', 'iv', 'V7', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['i', 'V7', 'VI', 'III', 'iv', 'i', 'V7', 'i'], weight: 6 },
      { chords: ['i', 'V7', 'VI', 'III', 'iv', 'bII', 'V7', 'i'], weight: 3, note: 'The one bar the ground is allowed to change, and it changes to a Neapolitan' },
    ],
    outro: [
      { chords: ['iv', 'V7', 'i', 'I'], weight: 4 },
      { chords: ['bII', 'V7', 'i', 'i'], weight: 2 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'V7', 'vi', 'iii', 'IV', 'I', 'V7', 'I'], weight: 6 },
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    outro: [{ chords: ['IV', 'V7', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4], weight: 4 },
    { cell: [12], weight: 4 },
    { cell: [8, 4], weight: 4 },
    { cell: [4, 8], weight: 3 },
    { cell: [2, 2, 4, 4], weight: 3 },
    { cell: [6, 2, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 4], weight: 2 },
    { cell: [-4, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 6 },
    { cell: [8, 4], weight: 3 },
    { cell: [4, 8], weight: 2 },
  ],
  bass: [
    /**
     * The ground itself, and it is the one bass table in the file that is
     * deliberately narrow. Three figures, all of them stepping, none of them
     * leaving a hole: a ground bass that took a bar off would stop being a
     * ground.
     */
    { name: 'ground-quarters', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.95 },
      { at: 4, dur: 3, tone: 'third', vel: 0.82 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.85 },
    ] },
    { name: 'ground-held', weight: 4, hits: [{ at: 0, dur: 11, tone: 'root', vel: 0.95 }] },
    { name: 'ground-stepping', weight: 3, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.95 },
      { at: 8, dur: 3, tone: 'approach', vel: 0.8 },
    ] },
  ],
  comp: [
    { name: 'held', weight: 5, voices: 4, hits: [{ at: 0, dur: 12, vel: 0.5 }] },
    { name: 'quarter-chords', weight: 4, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.55 },
      { at: 4, dur: 3, vel: 0.5 },
      { at: 8, dur: 3, vel: 0.52 },
    ] },
    { name: 'two-and-three', weight: 3, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.58 },
      { at: 8, dur: 3, vel: 0.54 },
    ] },
  ],
  drums: [],
  melody: { leap: 0.2, ornament: 0.3, span: 15, sequence: 0.55, syncopation: 0.15 },
};

/**
 * CHACONNE — the same idea one level up: a repeating *harmonic* scheme.
 *
 * It looks like the passacaglia and it is not the same form, and the difference
 * is worth keeping two entries for. A passacaglia repeats a bass *line*, so the
 * bass is fixed and the harmony follows from it. A chaconne repeats a
 * *progression*, so the harmony is fixed and the bass is free to move inside it
 * — which is why a chaconne's variations can put the theme in the treble and
 * still be variations, and why the Bach D minor Chaconne has a middle section in
 * the major that no passacaglia could have.
 *
 * `chorusBars: 4` is how that gets said. The ground is four bars, so every
 * section of the form becomes four bars, and any bridge the form template
 * contributed is folded back into the head — which is right, because a chaconne
 * has no contrasting middle. It has fifty variations on one four-bar scheme.
 * The bass tables are correspondingly the widest in the file rather than the
 * narrowest: the whole point is that the bass is not the fixed thing.
 */
const chaconne: Style = {
  id: 'chaconne',
  label: 'Chaconne',
  description:
    'A four-bar harmonic scheme repeated without pause, with the bass free to move inside it. Sections are the ground, not phrases.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [60, 80],
  swing: 0,
  chorusBars: 4,
  modeWeights: { minor: 0.82, major: 0.18 },
  relativeMajorChorus: 0.15,
  excludeLayers: ['drums'],
  hook: 'earworm',
  progressions: {
    intro: [{ chords: ['i', 'VII', 'VI', 'V7'], weight: 5 }],
    verse: [
      { chords: ['i', 'VII', 'VI', 'V7'], weight: 6, note: 'The descending tetrachord — the ground of half the chaconnes ever written' },
      { chords: ['i', 'V7', 'VI', 'V7'], weight: 4 },
      { chords: ['i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'VII', 'VI', 'V7'], weight: 6 },
      { chords: ['i', 'iv', 'bII', 'V7'], weight: 3, note: 'The Neapolitan variation, and the darkest four bars available' },
      { chords: ['iv', 'i', 'V7', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['iv', 'V7', 'i', 'I'], weight: 4 },
      { chords: ['i', 'iv', 'V7', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'V', 'vi', 'V7'], weight: 5, note: 'The major half of a chaconne, which is a real section of the form rather than a different piece' },
      { chords: ['I', 'IV', 'V7', 'I'], weight: 4 },
    ],
    outro: [{ chords: ['IV', 'V7', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 8], weight: 5 },
    { cell: [4, 4, 4], weight: 4 },
    { cell: [12], weight: 3 },
    { cell: [2, 2, 4, 4], weight: 4 },
    { cell: [8, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 4], weight: 3 },
    { cell: [3, 1, 4, 4], weight: 3 },
    { cell: [6, 2, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 5 },
    { cell: [4, 8], weight: 3 },
    { cell: [8, 4], weight: 2 },
  ],
  /**
   * The widest bass table here, and the point of the style.
   *
   * The harmony is what repeats, so the bass is a variation like everything
   * else: a plain one to a bar, the same with a fifth under it, quarters that
   * walk, and a broken figure in eighths. In a passacaglia those four would be
   * four different grounds and therefore four different pieces.
   */
  bass: [
    { name: 'one-to-a-bar', weight: 5, hits: [{ at: 0, dur: 11, tone: 'root', vel: 0.92 }] },
    { name: 'root-fifth', weight: 4, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.92 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.75 },
    ] },
    { name: 'walking-quarters', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.92 },
      { at: 4, dur: 3, tone: 'third', vel: 0.72 },
      { at: 8, dur: 3, tone: 'approach', vel: 0.78 },
    ] },
    { name: 'broken-eighths', weight: 3, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.9 },
      { at: 2, dur: 2, tone: 'fifth', vel: 0.62 },
      { at: 4, dur: 2, tone: 'octave', vel: 0.7 },
      { at: 6, dur: 2, tone: 'fifth', vel: 0.6 },
      { at: 8, dur: 2, tone: 'third', vel: 0.68 },
      { at: 10, dur: 2, tone: 'approach', vel: 0.64 },
    ] },
  ],
  comp: [
    { name: 'held', weight: 5, voices: 4, hits: [{ at: 0, dur: 12, vel: 0.52 }] },
    { name: 'chords-on-two-and-three', weight: 4, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.6 },
      { at: 8, dur: 3, vel: 0.55 },
    ] },
    { name: 'quarters', weight: 3, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.58 },
      { at: 4, dur: 3, vel: 0.5 },
      { at: 8, dur: 3, vel: 0.54 },
    ] },
  ],
  drums: [],
  melody: { leap: 0.24, ornament: 0.32, span: 16, sequence: 0.52, syncopation: 0.18 },
};

/**
 * FUGUE — a subject, an answer, and no chorus.
 *
 * The hardest form in the file to represent honestly, because everything that
 * makes a fugue a fugue is *vertical* — three or four independent lines, each
 * one a complete melody, entering in turn and never afterwards agreeing to be
 * an accompaniment — and this generator is built out of a tune with a band
 * behind it. What can be said is said, and what cannot is worth naming:
 *
 *  - **The entries** are `arrangement`'s `trade`, weighted heavily at the genre
 *    level: one voice states a phrase and stops, and the next takes it over.
 *    That is an exposition, near enough, and it is the one device in the shared
 *    pool that means what this form means.
 *  - **The subject comes back and back**, which is `hook: 'loose'` — the
 *    harmony is recalled, the rhythm is not locked, and no two statements are
 *    identical. `catchy` would give a fugue a chorus, which is the one thing it
 *    must not have.
 *  - **The countersubject** is the `counter` layer answering in the gaps, which
 *    is what that layer already does and is closer to right here than anywhere
 *    else in the project.
 *  - **What is missing**: stretto, inversion, augmentation, and the fact that
 *    the accompaniment is made of the same material as the tune. This engine
 *    has a melody generator and a comp generator and no way for the second to
 *    be the first, one bar later.
 *
 * `strictness: 'strict'` because the rule table was written out of exactly this
 * repertoire's voice-leading, and this is the movement it was written about.
 */
const fugue: Style = {
  id: 'fugue',
  label: 'Fugue',
  description:
    'A subject stated, answered in the dominant and taken up in turn. Continuous, imitative and without a refrain.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [88, 116],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0.2,
  excludeLayers: ['drums'],
  strictness: 'strict',
  // A fugue restates its subject and never restates a bar. `loose` keeps the
  // harmony consistent and leaves the phrase free, which is the closest thing
  // in the axis to "the same material, differently disposed".
  hook: 'loose',
  progressions: {
    verse: [
      { chords: ['i', 'V7', 'i', 'iv', 'V7', 'i', 'V7', 'i'], weight: 5, note: 'Subject in the tonic, answer in the dominant — the exposition, as harmony' },
      { chords: ['i', 'V7', 'iv', 'VII', 'III', 'VI', 'iio', 'V7'], weight: 4, note: 'The circle of fifths, which is what an episode is made of' },
      { chords: ['i', 'iv', 'V7', 'i', 'V7/III', 'III', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'i', 'V7', 'V7', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'VII', 'III', 'V7/iv', 'iv', 'VII', 'V7', 'i'], weight: 5, note: 'The middle entries, in the relative major and the subdominant' },
      { chords: ['V7/iv', 'iv', 'VII', 'III', 'VI', 'iio', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'V7/V', 'V7', 'V7', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'VII', 'III', 'VI', 'iio', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['V7/iv', 'iv', 'bII', 'V7', 'i', '#viio7', 'V7', 'i'], weight: 3, note: 'The leading-tone diminished seventh, which is the sharpest cadential chord this repertoire owns and needs the sharp because the mode reads its seventh flat' },
    ],
    outro: [
      { chords: ['iv', 'V7', 'i', 'I'], weight: 4, note: 'The final major chord, held: nearly every minor fugue of this period ends on one' },
      { chords: ['#viio7', 'V7', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'V7', 'I', 'IV', 'V7', 'I', 'V7', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'viio', 'iii', 'vi', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'V7/V', 'V', 'V', 'I', 'ii', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['V', 'V7/vi', 'vi', 'iii', 'IV', 'ii', 'V7', 'I'], weight: 5 },
      { chords: ['V7/IV', 'IV', 'viio', 'iii', 'vi', 'ii', 'V7', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['vi', 'ii', 'V7', 'I', 'IV', 'viio7', 'V7', 'I'], weight: 3 },
    ],
    outro: [{ chords: ['IV', 'V7', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 2, 2, 2, 2], weight: 5 },
    { cell: [4, 2, 2, 4, 4], weight: 5 },
    { cell: [4, 4, 2, 2, 4], weight: 4 },
    { cell: [-4, 2, 2, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [8, 2, 2, 4], weight: 3 },
    { cell: [3, 1, 4, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 2 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  bass: [
    /**
     * The bass is a voice, so it plays a line. `walking: true` on none of these
     * — a walking bass is a jazz device and the chromatic approach on beat four
     * that defines it is the one thing a fugal bass never does. These are chord
     * outlines with a step into the next bar, which is what a written bass line
     * of this period is.
     */
    { name: 'quarter-line', weight: 5, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.9 },
      { at: 4, dur: 3, tone: 'third', vel: 0.7 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.76 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.72 },
    ] },
    { name: 'eighth-line', weight: 4, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.9 },
      { at: 2, dur: 2, tone: 'third', vel: 0.6 },
      { at: 4, dur: 2, tone: 'fifth', vel: 0.68 },
      { at: 6, dur: 2, tone: 'octave', vel: 0.62 },
      { at: 8, dur: 2, tone: 'fifth', vel: 0.7 },
      { at: 10, dur: 2, tone: 'third', vel: 0.6 },
      { at: 12, dur: 2, tone: 'root', vel: 0.72 },
      { at: 14, dur: 2, tone: 'approach', vel: 0.64 },
    ] },
    { name: 'halves', weight: 3, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.9 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.76 },
    ] },
  ],
  comp: [
    { name: 'held', weight: 4, voices: 3, hits: [{ at: 0, dur: 16, vel: 0.45 }] },
    { name: 'halves', weight: 4, voices: 3, hits: [
      { at: 0, dur: 7, vel: 0.52 },
      { at: 8, dur: 7, vel: 0.48 },
    ] },
    { name: 'quarters', weight: 3, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.55 },
      { at: 4, dur: 3, vel: 0.46 },
      { at: 8, dur: 3, vel: 0.5 },
      { at: 12, dur: 3, vel: 0.46 },
    ] },
  ],
  drums: [],
  melody: { leap: 0.26, ornament: 0.24, span: 17, sequence: 0.66, syncopation: 0.25 },
};

/**
 * CHORALE PRELUDE — a hymn tune in long notes, with everything else moving.
 *
 * A congregation's melody, one note per bar or thereabouts, played on a
 * separate stop while three faster voices weave underneath it. It is the one
 * style in the file whose melody is *slower* than its accompaniment, and it is
 * expressed exactly that way: the melody cells are whole and half notes, the
 * comp is in quarters and eighths, and `melody.ornament` is the lowest in the
 * baroque half of the file at 0.12 — a chorale tune is a hymn everybody in the
 * building knows, and decorating it would make it unrecognisable, which is the
 * one thing it must not become.
 *
 * The harmony is four-part and the cadences are where the style lives. A
 * Phrygian half cadence — `iv` to `V` with the bass falling a semitone — is the
 * sound of a Lutheran chorale ending a phrase in minor, and it is written into
 * every minor table below.
 *
 * `strictness: 'strict'` for the same reason as the fugue's, and with a better
 * claim: the rules about parallel fifths, unresolved sevenths and unprepared
 * dissonance were codified out of exactly this body of four-part writing.
 */
const chorale: Style = {
  id: 'chorale',
  label: 'Chorale prelude',
  description:
    'A hymn tune in long notes over three faster voices. Four-part harmony, Phrygian half cadences and an undecorated melody.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [48, 66],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0.2,
  excludeLayers: ['drums'],
  strictness: 'strict',
  progressions: {
    intro: [
      { chords: ['I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'V', 'vi', 'V7'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'V7', 'I'], weight: 5, note: 'Every chord a step or a fifth from the last, which is what makes four independent voices possible' },
      { chords: ['I', 'IV', 'I', 'V', 'vi', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'V7/V', 'V', 'V', 'IV', 'I', 'V7', 'I'], weight: 3 },
      { chords: ['I', 'vi', 'IV', 'V7', 'I', 'iv', 'I', 'I'], weight: 3, note: 'A plagal close through the borrowed minor subdominant, which is the amen of the whole tradition' },
    ],
    chorus: [
      { chords: ['IV', 'I', 'V7', 'vi', 'ii', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['V', 'V7/vi', 'vi', 'IV', 'I', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'iii', 'IV', 'ii', 'V7', 'I', 'IV', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['vi', 'iii', 'IV', 'I', 'ii', 'V7', 'I', 'I'], weight: 3 },
      { chords: ['V7/IV', 'IV', 'iv', 'I', 'V7/V', 'V7', 'I', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['IV', 'I', 'V7', 'I'], weight: 4 },
      { chords: ['ii', 'V7', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'V7', 'i', 'VII', 'III', 'iv', 'V7', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'i', 'V7', 'VI', 'iio', 'V7', 'i'], weight: 4, note: 'The Phrygian half cadence at bar six — iio to V with the bass falling a semitone, which is the sound of a chorale phrase ending in minor' },
      { chords: ['i', 'V7/III', 'III', 'VII', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'VII', 'i', 'iv', 'VI', 'iio', 'V7', 'i'], weight: 4 },
      { chords: ['iv', 'i', 'V7', 'i', 'iio', 'V7', 'i', 'I'], weight: 4 },
    ],
    bridge: [
      { chords: ['VI', 'III', 'iv', 'i', 'iio', 'V7', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['iv', 'i', 'V7', 'I'], weight: 4 },
      { chords: ['iio', 'V7', 'i', 'I'], weight: 3 },
    ],
  },
  melodyCells: [
    // A hymn tune. Whole notes and halves, and nothing shorter than a quarter.
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 5 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [4, 12], weight: 2 },
    { cell: [4, 4, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'quarter-line', weight: 5, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.88 },
      { at: 4, dur: 3, tone: 'third', vel: 0.7 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.74 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.7 },
    ] },
    { name: 'halves', weight: 4, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.88 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.74 },
    ] },
    { name: 'pedal', weight: 3, sustain: true, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.85 }] },
  ],
  comp: [
    { name: 'moving-quarters', weight: 5, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.55 },
      { at: 4, dur: 3, vel: 0.5 },
      { at: 8, dur: 3, vel: 0.52 },
      { at: 12, dur: 3, vel: 0.5 },
    ] },
    { name: 'moving-eighths', weight: 4, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.52 },
      { at: 2, dur: 2, vel: 0.44 },
      { at: 4, dur: 2, vel: 0.48 },
      { at: 6, dur: 2, vel: 0.44 },
      { at: 8, dur: 2, vel: 0.5 },
      { at: 10, dur: 2, vel: 0.44 },
      { at: 12, dur: 2, vel: 0.48 },
      { at: 14, dur: 2, vel: 0.44 },
    ] },
    { name: 'held', weight: 3, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.48 }] },
  ],
  drums: [],
  melody: { leap: 0.14, ornament: 0.12, span: 12, sequence: 0.45, syncopation: 0.05 },
};

/**
 * TOCCATA — the piece that exists to show that the player can play.
 *
 * A keyboard style before it is anything else, which is why it is one of the
 * five entries here that names its own instruments through `twoHanded`. A
 * toccata on an oboe is a study; a toccata is a person at a manual with both
 * hands going.
 *
 * `ostinato` leads the left-hand table and it is the whole texture: a running
 * figure that does not stop for anything the right hand does, with chords struck
 * *with* the line where the piece arrives somewhere. `answer` is deliberately
 * last — a left hand that waits for a gap has nothing to do in a style whose
 * proposition is that there are no gaps, and `chooseLeftHandMode` would leave
 * the texture thin exactly where it should be thickest.
 *
 * Harmonically it is the plainest thing in the baroque half: long stretches of
 * one chord, a pedal point, and a cadence that takes four bars to arrive. The
 * display is in the figuration and not in the harmony, and a toccata with a
 * clever progression under it is a fantasia.
 */
const toccata: Style = {
  id: 'toccata',
  label: 'Toccata',
  description:
    'Continuous keyboard figuration over a slow harmony. Pedal points, long dominants and both hands moving.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [126, 156],
  swing: 0,
  modeWeights: { minor: 0.72, major: 0.28 },
  relativeMajorChorus: 0.15,
  excludeLayers: ['drums'],
  progressions: {
    intro: [
      { chords: ['i', 'i', 'V7', 'i'], weight: 4, note: 'A pedal and a flourish over it, which is how every one of these opens' },
      { chords: ['i', 'i', 'i', 'i'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'V7', 'V7', 'i', 'i'], weight: 5, note: 'Four bars of tonic and four of dominant. The harmony is not the subject' },
      { chords: ['i', 'iv', 'V7', 'i', 'VII', 'III', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'V7/iv', 'iv', 'VII', 'III', 'VI', 'V7', 'i'], weight: 3 },
      { chords: ['i', 'i', 'iv', 'iv', 'V7', 'V7', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['V7', 'V7', 'V7', 'V7', 'i', 'i', 'i', 'i'], weight: 5, note: 'A dominant pedal held for four bars and then released, which is the moment a toccata is written for' },
      { chords: ['III', 'VII', 'iv', 'i', 'iio', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'VII', 'III', 'VI', 'iio', 'V7', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['V7/iv', 'iv', 'VII', 'III', 'VI', 'iio', 'V7', 'V7'], weight: 4 },
      { chords: ['bII', 'bII', 'V7', 'V7', 'i', '#viio7', 'V7', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['iv', 'V7', 'i', 'I'], weight: 4 },
      { chords: ['V7', 'V7', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'V7', 'I', 'vi', 'ii', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['V7', 'V7', 'V7', 'V7', 'I', 'I', 'I', 'I'], weight: 5 },
      { chords: ['IV', 'viio', 'iii', 'vi', 'ii', 'V7', 'I', 'I'], weight: 3 },
    ],
    outro: [{ chords: ['IV', 'V7', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 4], weight: 5 },
    { cell: [2, 2, 2, 2, 2, 2, 2, 2], weight: 6 },
    { cell: [1, 1, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 2, 2, 4], weight: 4 },
    { cell: [2, 2, 4, 4, 4], weight: 3 },
    { cell: [16], weight: 3, },
    { cell: [8, 2, 2, 2, 2], weight: 3 },
    { cell: [-4, 2, 2, 2, 2, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'pedal', weight: 5, sustain: true, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.9 }] },
    { name: 'octave-strokes', weight: 4, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.95 },
      { at: 8, dur: 7, tone: 'octave', vel: 0.8 },
    ] },
    { name: 'quarter-line', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.92 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.72 },
      { at: 8, dur: 3, tone: 'root', vel: 0.8 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.74 },
    ] },
  ],
  comp: [
    { name: 'held', weight: 5, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.5 }] },
    { name: 'struck-halves', weight: 3, voices: 4, hits: [
      { at: 0, dur: 7, vel: 0.6 },
      { at: 8, dur: 7, vel: 0.54 },
    ] },
    { name: 'broken-sixteenths', weight: 4, voices: 4, arpeggio: true, arpDirection: 'updown', hits: [
      { at: 0, dur: 1, vel: 0.5 }, { at: 1, dur: 1, vel: 0.42 },
      { at: 2, dur: 1, vel: 0.46 }, { at: 3, dur: 1, vel: 0.42 },
      { at: 4, dur: 1, vel: 0.5 }, { at: 5, dur: 1, vel: 0.42 },
      { at: 6, dur: 1, vel: 0.46 }, { at: 7, dur: 1, vel: 0.42 },
      { at: 8, dur: 1, vel: 0.5 }, { at: 9, dur: 1, vel: 0.42 },
      { at: 10, dur: 1, vel: 0.46 }, { at: 11, dur: 1, vel: 0.42 },
      { at: 12, dur: 1, vel: 0.5 }, { at: 13, dur: 1, vel: 0.42 },
      { at: 14, dur: 1, vel: 0.46 }, { at: 15, dur: 1, vel: 0.42 },
    ] },
  ],
  drums: [],
  /**
   * The instrument this style *is*.
   *
   * Named rather than left to the palette, which is the stronger of the two
   * claims `TwoHandedKeys.instruments` can make and is right exactly here: a
   * toccata is a keyboard piece the way a humppa is an accordion piece, and a
   * toccata fronted by an oboe is a study with the wrong title. The harpsichord
   * leads in the baroque half of the genre and the concert grand takes over in
   * the romantic; both are in `HANDS`, which `npm run genres` requires.
   */
  twoHanded: {
    instruments: [['harpsichord', 6], ['steinway', 3], ['piano', 2]],
    density: 0.85,
    modes: [['ostinato', 6], ['block', 4], ['unison', 2], ['answer', 1]],
    // A broken-chord figure three beats long against a four-beat bar, so the
    // left hand and the barline come back together every third bar. A toccata
    // figure that lined up with the bar would be a comping pattern.
    ostinato: { cycle: 12, hits: [
      { at: 0, dur: 2, vel: 0.6 }, { at: 2, dur: 2, vel: 0.48 },
      { at: 4, dur: 2, vel: 0.52 }, { at: 6, dur: 2, vel: 0.48 },
      { at: 8, dur: 2, vel: 0.52 }, { at: 10, dur: 2, vel: 0.48 },
    ] },
  },
  melody: { leap: 0.34, ornament: 0.2, span: 20, sequence: 0.6, syncopation: 0.2 },
};

/**
 * FRENCH OVERTURE — the dotted grave that opens the evening.
 *
 * Two movements in life, a slow dotted one and a fast fugal one, and this entry
 * is the first of them. That is the right half to keep: the dotted opening is
 * the part anybody would recognise, the fast half is a fugue, and there is
 * already a fugue.
 *
 * **The reason given used to be *this generator has one tempo per song*, and it
 * no longer has.** `SongMeta.tempo` is a `TempoMap`, `generate/tempo.ts` plans
 * the ramp, and `Style.tempoRamp` is the field a style opts in with. So the
 * ceiling this style was written under is gone — and the style stays as it is,
 * because what is built is a *ramp* and a French overture is a **switch**. The
 * two shapes on offer are `accelerando`, an even push first bar to last, and
 * `gathering`, patient and then squared; both are monotonic and both describe a
 * band drifting or a form arriving. A grave that stops and a fugue that starts
 * at double the speed on the next downbeat is neither, and `tempo.ts` says in as
 * many words that the *build* — a ramp that arrives at something — is the shape
 * it declined to plan. Nothing in `FormStep` can say that a section is in a
 * different tempo either, which is where the switch would have to live. The
 * sentence above was true, has stopped being true, and the conclusion it
 * supported is unchanged for a different and better-argued reason.
 *
 * The dotted figure is the style. Every strong beat is a long note followed by a
 * short one snapped into the next beat — `[6, 2, 6, 2]` and `[3, 1, 4, ...]` in
 * the cells, the same shape in the `shots`, and `melody.syncopation` low because
 * the figure is emphatically *inside* the bar rather than across it. It is
 * ceremonial music, it is loud, and it is nearly always major.
 */
const overture: Style = {
  id: 'overture',
  label: 'French overture',
  description:
    'Ceremonial dotted grave. Every beat a long note snapped into the next, tutti chords and a march-like tread.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [56, 72],
  swing: 0,
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0.2,
  excludeLayers: ['drums'],
  /**
   * The dotted figure, hit by the whole band. This is one of the two places in
   * the file where a derived shot would be actively wrong: the metre's answer
   * for a bar of four is the four beats, and what this style hits is the *dot* —
   * the sixteenth before each beat, snapped into it.
   */
  shots: [[[0, 3, 4, 11, 12], 4], [[0, 7, 8, 15], 3], [[0, 4, 8, 12], 2]],
  progressions: {
    intro: [
      { chords: ['I', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'V', 'I', 'V7/V', 'V', 'V', 'V7', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'V7', 'I', 'vi', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'V7/vi', 'vi', 'ii', 'V7', 'I', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['V', 'V7/V', 'V', 'V', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['IV', 'I', 'ii', 'V7', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'iv', 'I', 'V7', 'vi', 'ii', 'V7', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['vi', 'V7/ii', 'ii', 'V7/V', 'V', 'V', 'V7', 'I'], weight: 4 },
    ],
    outro: [
      { chords: ['IV', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['ii', 'V7', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'V7', 'i', 'V7/III', 'III', 'III', 'V7', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'V7', 'i', 'VI', 'iio', 'V7', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['III', 'VII', 'i', 'iv', 'iio', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'bII', 'V7', 'i', 'iv', 'V7', 'i', 'I'], weight: 3 },
    ],
    outro: [{ chords: ['iv', 'V7', 'i', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [6, 2, 6, 2], weight: 6 },
    { cell: [3, 1, 4, 3, 1, 4], weight: 5 },
    { cell: [6, 2, 8], weight: 4 },
    { cell: [3, 1, 4, 4, 4], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [6, 2, 8], weight: 3 },
  ],
  bass: [
    { name: 'dotted-tread', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.95 },
      { at: 4, dur: 3, tone: 'root', vel: 0.82 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.88 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.8 },
    ] },
    { name: 'halves', weight: 3, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.95 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.82 },
    ] },
    { name: 'snapped', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.95 },
      { at: 3, dur: 1, tone: 'octave', vel: 0.7 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.86 },
      { at: 11, dur: 1, tone: 'approach', vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'dotted-chords', weight: 5, voices: 4, hits: [
      { at: 0, dur: 3, vel: 0.7 },
      { at: 3, dur: 1, vel: 0.5 },
      { at: 4, dur: 3, vel: 0.62 },
      { at: 8, dur: 3, vel: 0.66 },
      { at: 11, dur: 1, vel: 0.5 },
      { at: 12, dur: 3, vel: 0.6 },
    ] },
    { name: 'quarter-chords', weight: 4, voices: 4, hits: [
      { at: 0, dur: 3, vel: 0.68 },
      { at: 4, dur: 3, vel: 0.58 },
      { at: 8, dur: 3, vel: 0.62 },
      { at: 12, dur: 3, vel: 0.58 },
    ] },
    { name: 'held', weight: 2, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.55 }] },
  ],
  drums: [],
  melody: { leap: 0.28, ornament: 0.2, span: 15, sequence: 0.5, syncopation: 0.1 },
};

/**
 * ARIA — a singing line with the band underneath it, and the one style here
 * whose whole point is a voice.
 *
 * The `vocals` opt-in exists for this. Everything about the profile in
 * `vocals.ts` — the long vowels, the near-absence of consonants, the
 * `syllableBeats` of one — was written against this style and the two romantic
 * ones that share its shape.
 *
 * Formally a da capo aria is ABA with the A repeated *ornamented*, which is the
 * one place in this repertoire where a performer is expected to invent. That is
 * `melody.ornament` at 0.42, the highest in the file: a plain restatement of the
 * A section is the mistake the form is defined against.
 *
 * **This said the engine could not ornament the repeat specifically — that
 * `hook.recall` replays a section or writes a fresh one and there is no third
 * option. The third option had shipped four days earlier.** `varyRecall` in
 * `tune/tune.ts` is that option and its own docstring is this paragraph's title:
 * *the same tune, with one thing changed.* It landed in `215c6f4`, *Let a
 * recalled chorus come back varied*, on 2026-07-30; this file was written on
 * 2026-08-03. Every recalled tune goes through it — there is no path that
 * pastes a recall verbatim — so this style has been doing the thing its own
 * header called impossible since the day it was written. **Measured over 200
 * seeds: 300 of 363 recalled sections come back decorated, 83%.**
 *
 * What is *actually* short of a da capo is the depth, and it is arithmetic
 * rather than taste. `varyRecall` moves `max(1, round(amount × 2.4))` notes
 * against an `amount` capped at 0.9, so it is one note or two and never three —
 * **2.8% of the line at a typical draw, 5.0% at the cap**, where a baroque
 * division redecorates every long note in the phrase. And the depth is not
 * authorable: `amount` is a hard-coded expression in `generate/song.ts` that no
 * `Style` field reaches, so `melody.ornament: 0.42` above — written expressly
 * for this — does not touch it. That is the honest entry, and it is a much
 * smaller one than the sentence it replaces.
 */
const aria: Style = {
  id: 'aria',
  label: 'Aria',
  description:
    'A cantabile line over a walking continuo. Long phrases, wide intervals and heavy ornamentation on the return.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [56, 78],
  swing: 0,
  modeWeights: { minor: 0.42, major: 0.58 },
  relativeMajorChorus: 0.3,
  excludeLayers: ['drums'],
  progressions: {
    intro: [
      { chords: ['I', 'V7', 'I', 'I'], weight: 4, note: 'The ritornello, which states the material before the singer arrives' },
      { chords: ['I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'V', 'vi', 'iii', 'IV', 'ii', 'V7', 'I'], weight: 5 },
      { chords: ['I', 'V7/V', 'V', 'V', 'ii', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'IV', 'V7', 'I', 'V7/IV', 'IV', 'V7'], weight: 3 },
      { chords: ['I', 'IV', 'I', 'V7', 'vi', 'ii', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['V', 'V7/vi', 'vi', 'iii', 'IV', 'ii', 'V7', 'I'], weight: 5, note: 'The B section, which starts in another key and works its way back for the da capo' },
      { chords: ['vi', 'iii', 'IV', 'I', 'ii', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['IV', 'iv', 'I', 'V7', 'I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['V7/vi', 'vi', 'V7/ii', 'ii', 'V7/V', 'V', 'V7', 'I'], weight: 4 },
      { chords: ['vi', 'V7/IV', 'IV', 'iv', 'I', 'ii', 'V7', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['ii', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['IV', 'I', 'V7', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'V7', 'i', 'iv', 'VI', 'iio', 'V7', 'i'], weight: 5 },
      { chords: ['i', 'V7/III', 'III', 'VII', 'iv', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['i', 'iv', 'V7', 'i', 'V7/VI', 'VI', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'VII', 'III', 'VI', 'iv', 'iio', 'V7', 'i'], weight: 4 },
      { chords: ['iv', 'bII', 'V7', 'i', 'VI', 'iio', 'V7', 'i'], weight: 3 },
    ],
    outro: [{ chords: ['iv', 'V7', 'i', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [4, 2, 2, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [6, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    { name: 'walking-continuo', weight: 5, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.88 },
      { at: 4, dur: 3, tone: 'third', vel: 0.7 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.74 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.7 },
    ] },
    { name: 'halves', weight: 4, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.88 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.72 },
    ] },
    { name: 'held', weight: 3, sustain: true, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.82 }] },
  ],
  comp: [
    { name: 'held', weight: 5, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.46 }] },
    { name: 'quarter-realisation', weight: 4, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.52 },
      { at: 4, dur: 3, vel: 0.44 },
      { at: 8, dur: 3, vel: 0.48 },
      { at: 12, dur: 3, vel: 0.44 },
    ] },
    { name: 'offbeat-realisation', weight: 3, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.44 },
      { at: 6, dur: 2, vel: 0.48 },
      { at: 10, dur: 2, vel: 0.44 },
      { at: 14, dur: 2, vel: 0.48 },
    ] },
  ],
  drums: [],
  melody: { leap: 0.22, ornament: 0.42, span: 16, sequence: 0.5, syncopation: 0.2 },
};

/**
 * PAVANE — a slow processional in four, and the only style in this file that
 * belongs to two eras two hundred years apart.
 *
 * That is not a filing accident. The pavane is a sixteenth-century court dance
 * that had stopped being danced by 1650, and it came back in 1887 because Fauré
 * and Ravel wanted a form that was *archaic on purpose* — a modal, unhurried
 * tread that would carry parallel harmony without anyone hearing it as a
 * mistake. So it carries weight in the baroque era, where it is the oldest thing
 * in the room, and heavier weight in the impressionist one, where it is the
 * newest.
 *
 * Both readings share the same tread: two long steps and two short ones, the
 * bass on the strong beats only, and nothing hurrying. What differs is the
 * harmony, and the tables say so — the minor table cadences and the major one
 * moves in thirds without ever quite committing.
 */
const pavane: Style = {
  id: 'pavane',
  label: 'Pavane',
  description:
    'Slow processional four. Two long steps and two short, a bass on the strong beats, and nothing hurrying.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [56, 72],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0.25,
  excludeLayers: ['drums'],
  progressions: {
    intro: [
      { chords: ['i', 'i', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'V7'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'VII', 'VI', 'V7', 'i', 'iv', 'V7', 'i'], weight: 5 },
      { chords: ['i', 'v', 'VI', 'III', 'iv', 'i', 'V7', 'i'], weight: 4, note: 'The minor dominant rather than the major one — a pavane is old enough to predate the obligatory leading tone, and `v` keeps the seventh flat' },
      { chords: ['i', 'III', 'VII', 'iv', 'VI', 'iio', 'V7', 'i'], weight: 3 },
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'V7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'VII', 'i', 'v', 'VI', 'iv', 'V7', 'i'], weight: 4 },
      { chords: ['VI', 'III', 'VII', 'iv', 'i', 'iio', 'V7', 'i'], weight: 4 },
      { chords: ['iv', 'VII', 'III', 'VI', 'iio', 'V7', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['VI', 'VI', 'III', 'III', 'iv', 'iv', 'V7', 'V7'], weight: 4 },
      { chords: ['bII', 'bII', 'i', 'i', 'iv', 'V7', 'i', 'i'], weight: 2 },
    ],
    outro: [
      { chords: ['iv', 'V7', 'i', 'I'], weight: 4 },
      { chords: ['VII', 'VI', 'V7', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'iii', 'IV', 'I', 'ii', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'bVII', 'IV', 'I', 'vi', 'ii', 'V7', 'I'], weight: 4, note: 'The flat seventh in a major key, which in this style is an archaism rather than a borrowing' },
      { chords: ['I', 'vi', 'iii', 'IV', 'ii', 'V7', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'I', 'ii', 'vi', 'IV', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['vi', 'IV', 'I', 'iii', 'IV', 'ii', 'V7', 'I'], weight: 3 },
    ],
    outro: [{ chords: ['IV', 'I', 'V7', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [8, 4, 4], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 2, 2, 4], weight: 2 },
    { cell: [-4, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'strong-beats', weight: 6, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.88 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.76 },
    ] },
    { name: 'tread', weight: 4, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.9 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.74 },
      { at: 12, dur: 3, tone: 'octave', vel: 0.7 },
    ] },
    { name: 'held', weight: 3, sustain: true, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.84 }] },
  ],
  comp: [
    { name: 'held', weight: 5, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.5 }] },
    { name: 'processional', weight: 4, voices: 4, hits: [
      { at: 0, dur: 7, vel: 0.58 },
      { at: 8, dur: 3, vel: 0.5 },
      { at: 12, dur: 3, vel: 0.48 },
    ] },
    { name: 'quarters', weight: 3, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.55 },
      { at: 4, dur: 3, vel: 0.46 },
      { at: 8, dur: 3, vel: 0.5 },
      { at: 12, dur: 3, vel: 0.46 },
    ] },
  ],
  drums: [],
  melody: { leap: 0.16, ornament: 0.18, span: 13, sequence: 0.5, syncopation: 0.1 },
};

// ---------------------------------------------------------------------------
// The classical period — forms built out of key relationships
// ---------------------------------------------------------------------------

/**
 * SONATA-ALLEGRO — two subjects, a departure, and both subjects at home.
 *
 * The form the whole period is organised around, and the one that most needs
 * `scaleForChord` to work. Nothing about a sonata is a rhythm: it is a *key
 * plan*. A first subject in the tonic, a second subject **in another key**, a
 * development that is defined by not being in the tonic at all, and a
 * recapitulation whose entire event is that the second subject now comes back at
 * home. Take the modulation away and what is left is a fast piece in two moods.
 *
 * So this is the style where the departure is written into the harmony rather
 * than into the form. The `chorus` tables — the second subject — sit in the
 * dominant and are announced by `V7/V` before they get there; the `bridge`
 * tables — the development — are chains of applied dominants that tonicise the
 * relative minor, the submediant and the supertonic in turn and never once
 * settle. `Genre.forms` has no vocabulary for "this section is in another key",
 * and it does not need one: a bar of `V7/vi` followed by a bar of `vi` **is** a
 * bar in the key of vi, and the melody goes there, because the applied dominant
 * re-roots the scale onto the key it is pointing at.
 *
 * 2/2 rather than 4/4, and it matters. An allegro of this period is counted two
 * to a bar — the harmony changes on the half note, the phrases are four bars of
 * two, and a bar counted in four produces a heavy third beat this music does not
 * have.
 */
const sonata: Style = {
  id: 'sonata',
  label: 'Sonata-allegro',
  description:
    'Two subjects a key apart, a development that refuses to settle, and a recapitulation that brings the second subject home.',
  beatsPerBar: 4,
  beatUnit: 2,
  groups: [8, 8],
  bpm: [120, 152],
  swing: 0,
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0.5,
  excludeLayers: ['drums'],
  progressions: {
    intro: [
      { chords: ['I', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'I', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 5, note: 'The first subject: emphatically in the tonic, because everything after it depends on the listener knowing where home is' },
      { chords: ['I', 'V', 'I', 'V', 'I', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'IV', 'V7', 'I', 'V7/V', 'V', 'V'], weight: 4, note: 'The transition, which ends on the new dominant rather than the old tonic' },
      { chords: ['I', 'IV', 'I', 'V7', 'vi', 'ii', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['V7/V', 'V', 'V', 'V', 'V7/V', 'V', 'V7', 'I'], weight: 5, note: 'The second subject, in the dominant. Its own dominant announces it, its own cadence confirms it, and only the last bar admits the piece is still in the old key' },
      { chords: ['V', 'V7/V', 'V', 'ii', 'V7', 'I', 'V7', 'I'], weight: 4 },
      { chords: ['V', 'V', 'V7/vi', 'vi', 'IV', 'ii', 'V7', 'I'], weight: 3 },
      { chords: ['I', 'ii', 'V7', 'I', 'IV', 'ii', 'V7', 'I'], weight: 3, note: 'The recapitulation of the same material, now at home — the same eight bars a fifth lower, which is the event the whole form is built to deliver' },
    ],
    bridge: [
      { chords: ['V7/vi', 'vi', 'V7/ii', 'ii', 'V7/V', 'V', 'V7/vi', 'vi'], weight: 5, note: 'The development: four keys, none of them the tonic, each one lasting exactly as long as its own dominant' },
      { chords: ['vi', 'V7/IV', 'IV', 'iv', 'V7/ii', 'ii', 'V7', 'V7'], weight: 4, note: 'Through the subdominant and its borrowed minor — mode mixture inside a development, which is where a minor colour costs nothing' },
      { chords: ['V7/iii', 'iii', 'V7/vi', 'vi', 'ii', 'V7/V', 'V7', 'V7'], weight: 4, note: 'Descending fifths with a dominant in front of every station, ending on the home dominant so the recapitulation has something to arrive from' },
      { chords: ['vi', 'iii', 'V7/ii', 'ii', 'V7/V', 'V', 'V7', 'V7'], weight: 3 },
    ],
    outro: [
      { chords: ['ii', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['IV', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['V7', 'I', 'V7', 'I'], weight: 3, note: 'The coda that will not stop cadencing, which is this period at its most characteristic and most parodied' },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 5 },
      { chords: ['i', 'V7', 'i', 'iv', 'V7', 'i', 'V7/III', 'III'], weight: 4, note: 'A minor-key transition goes to the relative major, not the minor dominant — that is the one place the form is different in minor' },
      { chords: ['i', 'iv', 'i', 'V7', 'VI', 'iio', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['V7/III', 'III', 'III', 'V7/III', 'III', 'VI', 'V7', 'i'], weight: 5, note: 'The second subject in the relative major' },
      { chords: ['III', 'VII', 'III', 'V7', 'i', 'iv', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'iv', 'V7', 'i', 'VI', 'iio', 'V7', 'i'], weight: 3, note: 'The same material recapitulated in the tonic minor' },
    ],
    bridge: [
      { chords: ['V7/iv', 'iv', 'V7/VI', 'VI', 'V7/V', 'V7', 'V7', 'V7'], weight: 5 },
      { chords: ['VI', 'V7/iv', 'iv', 'bII', 'V7', '#viio7', 'V7', 'V7'], weight: 4 },
      { chords: ['III', 'V7/VI', 'VI', 'iio', 'V7/V', 'V7', 'V7', 'V7'], weight: 3 },
    ],
    outro: [
      { chords: ['iv', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['iio', 'V7', 'i', 'I'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [12, 4], weight: 3 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  bass: [
    { name: 'two-in-a-bar', weight: 5, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.92 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.8 },
    ] },
    /**
     * The Alberti bass's cousin in the actual bass: a repeated eighth-note
     * pulse on one note. It is the most-used accompaniment figure of the period
     * and the easiest one to make sound like a sewing machine, which is why the
     * velocities fall away from the strong beats rather than sitting level.
     */
    { name: 'repeated-eighths', weight: 4, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.9 },
      { at: 2, dur: 2, tone: 'root', vel: 0.62 },
      { at: 4, dur: 2, tone: 'root', vel: 0.68 },
      { at: 6, dur: 2, tone: 'root', vel: 0.6 },
      { at: 8, dur: 2, tone: 'root', vel: 0.78 },
      { at: 10, dur: 2, tone: 'root', vel: 0.6 },
      { at: 12, dur: 2, tone: 'root', vel: 0.66 },
      { at: 14, dur: 2, tone: 'approach', vel: 0.62 },
    ] },
    { name: 'quarter-line', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.92 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.7 },
      { at: 8, dur: 3, tone: 'octave', vel: 0.78 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.72 },
    ] },
  ],
  comp: [
    /**
     * The Alberti figure — low, high, middle, high, in eighths, for the whole
     * movement. It is written as an arpeggio rather than as a chord pattern
     * because that is what it is: one note of the voicing per hit, walking a
     * ladder, and `arpDirection: 'updown'` produces exactly the up-and-back
     * shape rather than the rising scale a plain `up` would give.
     */
    { name: 'alberti', weight: 5, voices: 3, arpeggio: true, arpDirection: 'updown', hits: [
      { at: 0, dur: 2, vel: 0.58 }, { at: 2, dur: 2, vel: 0.44 },
      { at: 4, dur: 2, vel: 0.5 }, { at: 6, dur: 2, vel: 0.44 },
      { at: 8, dur: 2, vel: 0.54 }, { at: 10, dur: 2, vel: 0.44 },
      { at: 12, dur: 2, vel: 0.5 }, { at: 14, dur: 2, vel: 0.44 },
    ] },
    { name: 'offbeat-chords', weight: 4, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.5 },
      { at: 6, dur: 2, vel: 0.56 },
      { at: 10, dur: 2, vel: 0.5 },
      { at: 14, dur: 2, vel: 0.56 },
    ] },
    { name: 'on-the-halves', weight: 4, voices: 4, hits: [
      { at: 0, dur: 7, vel: 0.6 },
      { at: 8, dur: 7, vel: 0.54 },
    ] },
    { name: 'held', weight: 2, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.48 }] },
  ],
  drums: [],
  melody: { leap: 0.3, ornament: 0.24, span: 17, sequence: 0.6, syncopation: 0.18 },
};

/**
 * RONDO — the tune that keeps coming back, with something different in between.
 *
 * ABACABA, and the only form in this file where the engine's own vocabulary is
 * an exact fit: `verse` is the refrain, `chorus` and `bridge` are the episodes,
 * and `hook: 'catchy'` says the refrain is the same tune every time, which is
 * the entire proposition of a rondo and the reason it is the finale of half the
 * concertos ever written.
 *
 * 2/4 and fast: a rondo finale is a two-beat bar with a light second beat, and
 * the melody is built from short symmetrical figures a listener can hum after
 * one hearing. Almost always major, and the minor ones are jokes.
 */
const rondo: Style = {
  id: 'rondo',
  label: 'Rondo',
  description:
    'A refrain that comes back unchanged with contrasting episodes between. Fast two, short symmetrical figures.',
  beatsPerBar: 2,
  beatUnit: 4,
  bpm: [112, 138],
  swing: 0,
  modeWeights: { minor: 0.15, major: 0.85 },
  relativeMajorChorus: 0.2,
  excludeLayers: ['drums'],
  // The refrain is the point, so it is the same tune each time. This is the
  // one hook level in the axis that means "you already know this one", and a
  // rondo whose returns were re-composed would be a set of variations.
  hook: 'catchy',
  progressions: {
    intro: [
      { chords: ['I', 'V7', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'V7', 'I', 'V7', 'I', 'IV', 'V7', 'I'], weight: 5, note: 'The refrain — plain, tonic-heavy and instantly recognisable, which is what it is for' },
      { chords: ['I', 'I', 'V7', 'V7', 'I', 'I', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'ii', 'V7', 'I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['V7/V', 'V', 'V', 'V', 'ii', 'V7', 'I', 'I'], weight: 5, note: 'The first episode, in the dominant' },
      { chords: ['V', 'V7/V', 'V', 'I', 'IV', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['IV', 'I', 'ii', 'V7', 'I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['V7/vi', 'vi', 'vi', 'V7/ii', 'ii', 'V7', 'I', 'I'], weight: 5, note: 'The C episode, in the relative minor — the one place a rondo is allowed to be serious' },
      { chords: ['vi', 'iii', 'IV', 'ii', 'V7/V', 'V', 'V7', 'I'], weight: 4 },
      { chords: ['IV', 'iv', 'I', 'V7/vi', 'vi', 'ii', 'V7', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['V7', 'I', 'V7', 'I'], weight: 4 },
      { chords: ['ii', 'V7', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'V7', 'i', 'V7', 'i', 'iv', 'V7', 'i'], weight: 5 },
      { chords: ['i', 'i', 'V7', 'V7', 'i', 'i', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['V7/III', 'III', 'III', 'VII', 'iv', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['III', 'VI', 'iio', 'V7', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    outro: [{ chords: ['V7', 'i', 'V7', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 4], weight: 5 },
    { cell: [4, 4], weight: 5 },
    { cell: [2, 2, 2, 2], weight: 4 },
    { cell: [-2, 2, 4], weight: 4 },
    { cell: [8], weight: 3 },
    { cell: [6, 2], weight: 3 },
    { cell: [4, 2, 2], weight: 3 },
    { cell: [3, 1, 4], weight: 3 },
    { cell: [1, 1, 2, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [8], weight: 5 },
    { cell: [4, 4], weight: 3 },
    { cell: [6, 2], weight: 2 },
  ],
  bass: [
    { name: 'one-and-two', weight: 5, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.92 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.74 },
    ] },
    { name: 'one-to-a-bar', weight: 4, hits: [{ at: 0, dur: 7, tone: 'root', vel: 0.92 }] },
    { name: 'repeated-eighths', weight: 3, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.9 },
      { at: 2, dur: 2, tone: 'root', vel: 0.62 },
      { at: 4, dur: 2, tone: 'root', vel: 0.72 },
      { at: 6, dur: 2, tone: 'approach', vel: 0.62 },
    ] },
  ],
  comp: [
    { name: 'offbeat', weight: 5, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.55 },
      { at: 6, dur: 2, vel: 0.58 },
    ] },
    { name: 'alberti', weight: 4, voices: 3, arpeggio: true, arpDirection: 'updown', hits: [
      { at: 0, dur: 2, vel: 0.55 }, { at: 2, dur: 2, vel: 0.44 },
      { at: 4, dur: 2, vel: 0.5 }, { at: 6, dur: 2, vel: 0.44 },
    ] },
    { name: 'on-the-beats', weight: 3, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.6 },
      { at: 4, dur: 3, vel: 0.52 },
    ] },
  ],
  drums: [],
  melody: { leap: 0.3, ornament: 0.26, span: 14, sequence: 0.62, syncopation: 0.2 },
};

/**
 * ADAGIO — the slow movement, where the tune is the whole content.
 *
 * The one style in the file with no rhythmic identity at all, and that is what
 * it is: everything a slow movement has, it has in the melody and in the
 * harmony. So the tables are deliberately plain — a bass on the strong beats, a
 * comp that either holds or plays repeated chords underneath, and cells that are
 * mostly halves and whole notes with the occasional written-out turn.
 *
 * What it does have is the widest ornament budget outside the aria and the
 * highest appetite for mode mixture. A slow movement in a major key that touches
 * the borrowed minor subdominant once is doing the thing this whole period does
 * with its slow movements, and `scaleForChord` answers `iv` in major with
 * `harmonicMajor` — the flat sixth borrowed and the leading tone kept, which is
 * exactly the ache and not a change of key.
 */
const adagio: Style = {
  id: 'adagio',
  label: 'Adagio',
  description:
    'The slow movement. Long melodic phrases over a plain accompaniment, with mode mixture doing the colouring.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [46, 64],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0.3,
  excludeLayers: ['drums'],
  progressions: {
    intro: [
      { chords: ['I', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'IV', 'I', 'V7'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'V', 'vi', 'iii', 'IV', 'ii', 'V7', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'iv', 'I', 'ii', 'V7', 'I', 'I'], weight: 5, note: 'The borrowed minor subdominant in bar three — one bar of shadow in an otherwise sunlit phrase, which is what mode mixture is for' },
      { chords: ['I', 'V7/vi', 'vi', 'V7/IV', 'IV', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'ii', 'V7', 'I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'iv', 'I', 'V7/vi', 'vi', 'ii', 'V7', 'I'], weight: 5 },
      { chords: ['V', 'V7/V', 'V', 'I', 'IV', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['bVI', 'IV', 'I', 'V7', 'I', 'iv', 'I', 'I'], weight: 3, note: 'The flat submediant in a major key, which borrows the whole parallel minor rather than one note of it' },
    ],
    bridge: [
      { chords: ['vi', 'V7/ii', 'ii', 'V7/V', 'V', 'V', 'V7', 'I'], weight: 4 },
      { chords: ['iv', 'bVI', 'V7', 'I', 'ii', 'V7', 'I', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['IV', 'iv', 'I', 'I'], weight: 4, note: 'The plagal close through the borrowed subdominant, which is the softest ending this repertoire has' },
      { chords: ['ii', 'V7', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'V7', 'i', 'iv', 'VI', 'iio', 'V7', 'i'], weight: 5 },
      { chords: ['i', 'V7/III', 'III', 'VII', 'VI', 'iv', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'iv', 'bII', 'V7', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'VI', 'iv', 'i', 'iio', 'V7', 'i', 'I'], weight: 4 },
      { chords: ['VI', 'III', 'iv', 'V7', 'i', 'iv', 'V7', 'i'], weight: 4 },
    ],
    bridge: [
      { chords: ['V7/VI', 'VI', 'V7/iv', 'iv', 'iio', 'V7', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['iv', 'i', 'V7', 'I'], weight: 4 },
      { chords: ['bII', 'V7', 'i', 'I'], weight: 2 },
    ],
  },
  melodyCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [-4, 4, 8], weight: 3 },
    { cell: [4, 2, 2, 8], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [6, 2, 8], weight: 2 },
    { cell: [1, 1, 2, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'strong-beats', weight: 5, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.85 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.72 },
    ] },
    { name: 'held', weight: 4, sustain: true, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.8 }] },
    { name: 'quarter-line', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.85 },
      { at: 4, dur: 3, tone: 'third', vel: 0.66 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.72 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.68 },
    ] },
  ],
  comp: [
    { name: 'held', weight: 5, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.46 }] },
    { name: 'repeated-eighths', weight: 4, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.46 }, { at: 2, dur: 2, vel: 0.38 },
      { at: 4, dur: 2, vel: 0.42 }, { at: 6, dur: 2, vel: 0.38 },
      { at: 8, dur: 2, vel: 0.44 }, { at: 10, dur: 2, vel: 0.38 },
      { at: 12, dur: 2, vel: 0.42 }, { at: 14, dur: 2, vel: 0.38 },
    ] },
    { name: 'broken', weight: 3, voices: 4, arpeggio: true, arpDirection: 'up', hits: [
      { at: 0, dur: 4, vel: 0.48 }, { at: 4, dur: 4, vel: 0.4 },
      { at: 8, dur: 4, vel: 0.44 }, { at: 12, dur: 4, vel: 0.4 },
    ] },
  ],
  drums: [],
  melody: { leap: 0.2, ornament: 0.36, span: 16, sequence: 0.48, syncopation: 0.22 },
};

/**
 * SCHERZO — the minuet taken at a speed nobody could dance to.
 *
 * Literally what it is: Beethoven kept the minuet's position in the symphony and
 * its 3/4 and its trio, and doubled the tempo until the bar became the beat.
 * That is the whole joke and the whole style, and it is why the two entries are
 * not one style with a wide tempo band — the metre stops being audible as three
 * and starts being audible as one, which changes where the accents can go, what
 * the melody cells are made of and what the bass is allowed to play.
 *
 * At 150–186 to the quarter a bar lasts about a second, so `buildForm` doubles
 * every section: sixteen-bar phrases, which is what this music actually
 * phrases in. The hemiola — three bars of two against two bars of three — is the
 * gesture the form is famous for and it is the one thing the tables cannot say,
 * because `groups` is a property of the bar and a hemiola is a property of three
 * bars. The `shots` reach for it sideways by hitting the bar's first and third
 * quarters, which is the same accent in the small.
 */
const scherzo: Style = {
  id: 'scherzo',
  label: 'Scherzo',
  description:
    'A minuet at three times the speed, felt one to a bar. Sixteen-bar phrases, sudden dynamics and a trio in the middle.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [150, 186],
  swing: 0,
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0.4,
  excludeLayers: ['drums'],
  shots: [[[0, 8], 4], [[0], 2], [[0, 4, 8], 2]],
  progressions: {
    intro: [
      { chords: ['i', 'i', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'V7', 'i', 'i'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'i', 'iv', 'V7', 'i'], weight: 5 },
      { chords: ['i', 'V7/III', 'III', 'III', 'iv', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['i', 'VI', 'iio', 'V7', 'i', 'iv', 'V7', 'i'], weight: 3 },
      { chords: ['i', 'i', 'i', 'i', 'V7', 'V7', 'V7', 'V7'], weight: 3, note: 'Four bars of one chord and four of the next: at this speed a bar is a beat, and the harmony has to move at a bar-group rate or it sounds frantic' },
    ],
    chorus: [
      { chords: ['III', 'III', 'VII', 'VII', 'iv', 'iv', 'V7', 'i'], weight: 4 },
      { chords: ['V7', 'V7', 'i', 'i', 'iv', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['VI', 'III', 'iio', 'V7', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['III', 'III', 'VI', 'VI', 'iio', 'iio', 'V7', 'V7'], weight: 4, note: 'The trio, in the relative major and with half the players' },
      { chords: ['iv', 'iv', 'VII', 'VII', 'III', 'VI', 'V7', 'i'], weight: 3 },
      { chords: ['V7/iv', 'iv', 'V7/VI', 'VI', 'iio', 'V7', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['iv', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['V7', 'i', 'V7', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'I', 'IV', 'V7', 'I'], weight: 5 },
      { chords: ['I', 'V7/V', 'V', 'V', 'ii', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'ii', 'V7', 'I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['V', 'V', 'I', 'I', 'IV', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['bVI', 'bVI', 'IV', 'IV', 'V7', 'V7', 'I', 'I'], weight: 3, note: 'The flat submediant taken as a wall of sound rather than as a shadow, which is what the romantic half of this style does with mixture' },
    ],
    bridge: [
      { chords: ['IV', 'IV', 'I', 'I', 'ii', 'V7', 'I', 'I'], weight: 4 },
    ],
    outro: [{ chords: ['IV', 'V7', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [12], weight: 5 },
    { cell: [4, 4, 4], weight: 5 },
    { cell: [8, 4], weight: 4 },
    { cell: [-4, 4, 4], weight: 4 },
    { cell: [4, 8], weight: 3 },
    { cell: [-8, 4], weight: 3 },
    { cell: [2, 2, 4, 4], weight: 3 },
    { cell: [4, 2, 2, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 5 },
    { cell: [4, 8], weight: 3 },
    { cell: [8, 4], weight: 3 },
  ],
  bass: [
    { name: 'one-to-a-bar', weight: 6, hits: [{ at: 0, dur: 3, tone: 'root', vel: 0.95 }] },
    { name: 'one-to-a-bar-held', weight: 4, hits: [{ at: 0, dur: 11, tone: 'root', vel: 0.9 }] },
    { name: 'one-and-three', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.95 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.72 },
    ] },
  ],
  comp: [
    { name: 'downbeat-chord', weight: 5, voices: 4, hits: [{ at: 0, dur: 3, vel: 0.7 }] },
    { name: 'oom-pah-pah', weight: 4, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.55 },
      { at: 8, dur: 3, vel: 0.5 },
    ] },
    { name: 'held', weight: 3, voices: 4, hits: [{ at: 0, dur: 12, vel: 0.52 }] },
  ],
  drums: [],
  melody: { leap: 0.34, ornament: 0.16, span: 18, sequence: 0.6, syncopation: 0.28 },
};

/**
 * MARCH — the square one, and the one that had to give something up.
 *
 * A march is a bass drum and a side drum with a wind band over them, and this
 * genre has no percussion at all. That is a real loss and it is stated here
 * rather than smoothed over: `DrumSource` offers a kit, a preset box, a
 * programmed machine and a set of electronic pads, and *two players, a side drum
 * and a bass drum* is none of those. Handing this style the trap kit would put a
 * hi-hat on every eighth of a Radetzky March, which is worse than silence.
 *
 * What is left is what a march has besides its drums, and it is more than it
 * sounds: an oom-pah bass on the strong beats, a full-band chord on every
 * offbeat, four-square eight-bar strains, a trio in the subdominant, and a
 * harmony that stays inside the tonic, the dominant and their applied dominants
 * so a band can read it outdoors. The `shots` are the whole band hitting the
 * beats together, which is the one gesture a march makes constantly.
 */
const march: Style = {
  id: 'march',
  label: 'March',
  description:
    'Four-square wind-band march. Oom-pah bass, offbeat chords, eight-bar strains and a trio in the subdominant.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [104, 120],
  swing: 0,
  modeWeights: { minor: 0.18, major: 0.82 },
  relativeMajorChorus: 0.15,
  excludeLayers: ['drums'],
  hook: 'catchy',
  shots: [[[0, 4, 8, 12], 4], [[0, 8], 3], [[0, 6, 8], 2]],
  progressions: {
    intro: [
      { chords: ['I', 'V7', 'V7', 'I'], weight: 4 },
      { chords: ['V7', 'V7', 'I', 'I'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'I', 'IV', 'V7', 'I'], weight: 5 },
      { chords: ['I', 'V7/V', 'V', 'V', 'I', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'IV', 'I', 'V7', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'V7/vi', 'vi', 'V7', 'I', 'ii', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V7', 'V7', 'I', 'I'], weight: 5, note: 'The trio, in the subdominant — a march changes key downward for its big tune, which is the opposite of what a pop record does and works for the same reason' },
      { chords: ['IV', 'V7/V', 'V7', 'I', 'IV', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'IV', 'V7', 'V7', 'I', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['V7/vi', 'vi', 'V7/ii', 'ii', 'V7/V', 'V', 'V7', 'I'], weight: 4, note: 'The dogfight — the loud contrapuntal strain before the trio comes back, and the only place a march goes anywhere' },
      { chords: ['vi', 'vi', 'V7/V', 'V7/V', 'V7', 'V7', 'I', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['V7', 'I', 'V7', 'I'], weight: 4 },
      { chords: ['IV', 'V7', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'i', 'iv', 'V7', 'i'], weight: 5 },
      { chords: ['i', 'V7/V', 'V7', 'V7', 'i', 'i', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'V7', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['III', 'VII', 'i', 'V7', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    outro: [{ chords: ['V7', 'i', 'V7', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 5 },
    { cell: [3, 1, 4, 3, 1, 4], weight: 4 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [2, 2, 4, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [12, 4], weight: 2 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [12, 4], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  bass: [
    { name: 'oom-pah', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.98 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.86 },
    ] },
    { name: 'oom-pah-quarters', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.98 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.8 },
      { at: 8, dur: 3, tone: 'root', vel: 0.9 },
      { at: 12, dur: 3, tone: 'fifth', vel: 0.8 },
    ] },
    { name: 'octave-tread', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.98 },
      { at: 4, dur: 3, tone: 'octave', vel: 0.78 },
      { at: 8, dur: 3, tone: 'root', vel: 0.9 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.8 },
    ] },
  ],
  comp: [
    { name: 'offbeat-afterbeats', weight: 6, voices: 4, hits: [
      { at: 4, dur: 3, vel: 0.72 },
      { at: 12, dur: 3, vel: 0.72 },
    ] },
    { name: 'offbeat-eighths', weight: 4, voices: 4, hits: [
      { at: 2, dur: 2, vel: 0.6 },
      { at: 6, dur: 2, vel: 0.66 },
      { at: 10, dur: 2, vel: 0.6 },
      { at: 14, dur: 2, vel: 0.66 },
    ] },
    { name: 'quarter-chords', weight: 3, voices: 4, hits: [
      { at: 0, dur: 3, vel: 0.7 },
      { at: 4, dur: 3, vel: 0.62 },
      { at: 8, dur: 3, vel: 0.66 },
      { at: 12, dur: 3, vel: 0.62 },
    ] },
  ],
  drums: [],
  melody: { leap: 0.28, ornament: 0.14, span: 15, sequence: 0.58, syncopation: 0.12 },
};

// ---------------------------------------------------------------------------
// The nineteenth century — character pieces and national dances
// ---------------------------------------------------------------------------

/**
 * NOCTURNE — a singing right hand over a left hand that spans a tenth.
 *
 * The most specific texture in the file and the one that most needs
 * `twoHanded`. A nocturne is not a tune with chords under it; it is *one player*
 * whose left hand plays a bass note and then a chord spread far above it, over
 * and over, while the right hand sings above both. `stride` is exactly that
 * gesture — `HandSpec.bass` is the low note and the window above it is the
 * chord — and it takes most of the mode table here for the same reason it takes
 * most of a humppa's, which is that the left hand *is* the accompaniment and
 * nobody else is playing one.
 *
 * 12/8, which is `beatsPerBar: 6` at `beatUnit: 8` with four groups of six. The
 * compound metre is what makes the left hand roll rather than march, and it is
 * the difference between this and an adagio with a piano on it.
 *
 * **It fades, and it is the loudest of the six styles in the project that
 * wanted to.** `Style.ending` exists now; the note in `index.ts` picks `button`
 * for the twenty-four pieces that end on a chord everyone plays together, and
 * this is one of the two that do not. What the button was doing here was never
 * the crash — `excludeLayers: ['drums']` meant no cymbal was ever struck — it
 * was **6.2 notes per song re-articulated on the final downbeat with their
 * velocity lifted**, measured over 40 seeds against the same seeds fading, the
 * largest figure of the six because a nocturne has both hands and a singing
 * line in the last bar and the button collects all three. On 7 of those 40 it
 * also invented one: a hand that had come off the keys was re-struck by the
 * recall branch, which is the opposite of the gesture. A nocturne is let go of,
 * not landed on.
 */
const nocturne: Style = {
  id: 'nocturne',
  label: 'Nocturne',
  description:
    'A singing line over a rolling left hand that spans a tenth. Compound twelve-eight, rubato phrasing, chromatic inner voices.',
  beatsPerBar: 6,
  beatUnit: 8,
  groups: [6, 6, 6, 6],
  bpm: [92, 118],
  swing: 0,
  modeWeights: { minor: 0.48, major: 0.52 },
  relativeMajorChorus: 0.35,
  excludeLayers: ['drums'],
  // See the header. The left hand is still rolling when the piece stops being
  // there, which is the whole gesture and is not a chord struck on the beat.
  ending: 'fade',
  progressions: {
    intro: [
      { chords: ['I', 'I', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'ii', 'V7'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'V7/vi', 'vi', 'iii', 'IV', 'ii', 'V7', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'iv', 'I', 'ii', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'V7/IV', 'IV', 'V7/V', 'V', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'V7/V', 'V', 'IV', 'ii', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'iv', 'I', 'V7/vi', 'vi', 'ii', 'V7', 'I'], weight: 5, note: 'The middle section, which in a nocturne is louder rather than merely different' },
      { chords: ['bVI', 'bVI', 'IV', 'iv', 'I', 'V7', 'I', 'I'], weight: 4, note: 'The flat submediant held for two bars — the moment a nocturne opens out, and the whole parallel minor borrowed to do it' },
      { chords: ['V', 'V7/V', 'V', 'vi', 'IV', 'ii', 'V7', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['V7/vi', 'vi', 'V7/ii', 'ii', 'V7/V', 'V', 'V7', 'I'], weight: 4 },
      { chords: ['iv', 'bVI', 'bII', 'V7', 'I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['IV', 'iv', 'I', 'I'], weight: 4 },
      { chords: ['ii', 'V7', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'V7', 'i', 'iv', 'VI', 'iio', 'V7', 'i'], weight: 5 },
      { chords: ['i', 'V7/III', 'III', 'VII', 'VI', 'iv', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'iv', 'bII', 'V7', 'i', 'V7/VI', 'VI', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'VI', 'iv', 'i', 'iio', 'V7', 'i', 'I'], weight: 4 },
      { chords: ['VI', 'VI', 'iv', 'iv', 'iio', 'V7', 'i', 'i'], weight: 4 },
    ],
    bridge: [
      { chords: ['V7/iv', 'iv', 'V7/VI', 'VI', 'bII', 'V7', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['iv', 'i', 'V7', 'I'], weight: 4 },
      { chords: ['bII', 'V7', 'i', 'I'], weight: 2 },
    ],
  },
  melodyCells: [
    { cell: [12, 12], weight: 5 },
    { cell: [6, 6, 12], weight: 5 },
    { cell: [24], weight: 4 },
    { cell: [12, 6, 6], weight: 4 },
    { cell: [6, 6, 6, 6], weight: 3 },
    { cell: [4, 2, 6, 12], weight: 3 },
    { cell: [-6, 6, 12], weight: 3 },
    { cell: [2, 2, 2, 6, 12], weight: 3 },
    { cell: [6, 6, 4, 2, 6], weight: 2 },
    { cell: [-12, 6, 6], weight: 2 },
  ],
  cadenceCells: [
    { cell: [24], weight: 6 },
    { cell: [12, 12], weight: 3 },
    { cell: [18, 6], weight: 2 },
  ],
  bass: [
    // A bass note per dotted beat, and nothing above it — the chord is the
    // other hand's job, which is what `twoHanded` below says.
    { name: 'dotted-beats', weight: 5, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 0.88 },
      { at: 6, dur: 5, tone: 'fifth', vel: 0.7 },
      { at: 12, dur: 5, tone: 'root', vel: 0.78 },
      { at: 18, dur: 5, tone: 'fifth', vel: 0.7 },
    ] },
    { name: 'halves', weight: 4, hits: [
      { at: 0, dur: 11, tone: 'root', vel: 0.88 },
      { at: 12, dur: 11, tone: 'fifth', vel: 0.74 },
    ] },
    { name: 'held', weight: 3, sustain: true, hits: [{ at: 0, dur: 24, tone: 'root', vel: 0.82 }] },
  ],
  comp: [
    { name: 'rolling-eighths', weight: 5, voices: 4, arpeggio: true, arpDirection: 'updown', arpOctaves: 2, hits: [
      { at: 0, dur: 2, vel: 0.5 }, { at: 2, dur: 2, vel: 0.4 }, { at: 4, dur: 2, vel: 0.42 },
      { at: 6, dur: 2, vel: 0.46 }, { at: 8, dur: 2, vel: 0.4 }, { at: 10, dur: 2, vel: 0.42 },
      { at: 12, dur: 2, vel: 0.48 }, { at: 14, dur: 2, vel: 0.4 }, { at: 16, dur: 2, vel: 0.42 },
      { at: 18, dur: 2, vel: 0.46 }, { at: 20, dur: 2, vel: 0.4 }, { at: 22, dur: 2, vel: 0.42 },
    ] },
    { name: 'chords-on-the-dotted-beats', weight: 4, voices: 4, hits: [
      { at: 0, dur: 5, vel: 0.5 },
      { at: 6, dur: 5, vel: 0.44 },
      { at: 12, dur: 5, vel: 0.48 },
      { at: 18, dur: 5, vel: 0.44 },
    ] },
    { name: 'held', weight: 3, voices: 4, hits: [{ at: 0, dur: 24, vel: 0.44 }] },
  ],
  drums: [],
  /**
   * One player, two hands, and the left one is the accompaniment.
   *
   * `stride` by a distance: a nocturne's left hand is a bass note and then a
   * chord spread wide above it, which is `HandSpec.bass` and the window over it,
   * and it is the same physical gesture a stride pianist makes with a different
   * tempo and a pedal down. `block` and `answer` are what the same hand does in
   * the middle section and under a held note; no `unison`, because two hands an
   * octave apart is a different piece of music and it is the étude.
   */
  twoHanded: {
    instruments: [['steinway', 8], ['piano', 2]],
    density: 0.8,
    modes: [['stride', 7], ['block', 2], ['answer', 2]],
  },
  melody: { leap: 0.26, ornament: 0.4, span: 19, sequence: 0.42, syncopation: 0.34 },
};

/**
 * WALTZ — three, with nothing on the second beat.
 *
 * The one dance in this file that people were still dancing when the composers
 * were alive, and the reason it is not the same style as the minuet is a
 * hundred and twenty beats per minute and a completely different left hand. A
 * minuet's bass touches the downbeat and lets the bar breathe; a waltz's bass
 * lands on one and then two chords land on two and three, and that
 * *oom-pah-pah* is the most recognisable accompaniment figure in western music.
 *
 * The other difference is phrase length. A waltz phrases in sixteens and
 * thirty-twos and a minuet phrases in fours, and at this tempo `buildForm`
 * doubles the sections automatically, so the sixteen-bar phrase arrives without
 * being asked for.
 */
const waltz: Style = {
  id: 'waltz',
  label: 'Waltz',
  description:
    'Concert waltz. Bass on one, chords on two and three, long sixteen-bar phrases and a tune that lingers.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [150, 186],
  swing: 0,
  modeWeights: { minor: 0.38, major: 0.62 },
  relativeMajorChorus: 0.4,
  excludeLayers: ['drums'],
  progressions: {
    intro: [
      { chords: ['I', 'V7', 'V7', 'I'], weight: 4 },
      { chords: ['V7', 'V7', 'I', 'I'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V7/V', 'V', 'V', 'V7', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'ii', 'V7', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'V7/vi', 'vi', 'V7/ii', 'ii', 'V7', 'I', 'I'], weight: 3, note: 'The chain of applied dominants a Viennese waltz falls into whenever it has eight bars and nothing to say' },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'IV', 'iv', 'I', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['V', 'V', 'V7/V', 'V', 'I', 'ii', 'V7', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['vi', 'vi', 'V7/V', 'V7/V', 'V7', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['bVI', 'bVI', 'V7', 'V7', 'I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['V7', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['IV', 'V7', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'VI', 'iio', 'V7', 'i', 'iv', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'V7/III', 'III', 'III', 'iv', 'V7', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VI', 'VI', 'iio', 'V7', 'i', 'i'], weight: 5, note: 'The lift into the relative major, which in a minor waltz is the whole second strain' },
      { chords: ['iv', 'iv', 'i', 'i', 'V7', 'V7', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['VI', 'VI', 'V7/V', 'V7/V', 'V7', 'V7', 'i', 'i'], weight: 3 },
    ],
    outro: [{ chords: ['V7', 'V7', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [12], weight: 5 },
    { cell: [8, 4], weight: 5 },
    { cell: [4, 4, 4], weight: 4 },
    { cell: [-4, 4, 4], weight: 4 },
    { cell: [4, 8], weight: 3 },
    { cell: [6, 2, 4], weight: 3 },
    { cell: [-8, 4], weight: 3 },
    { cell: [2, 2, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 6 },
    { cell: [8, 4], weight: 3 },
    { cell: [4, 8], weight: 2 },
  ],
  bass: [
    { name: 'on-the-one', weight: 6, hits: [{ at: 0, dur: 3, tone: 'root', vel: 0.95 }] },
    { name: 'one-and-two', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.95 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.68 },
    ] },
    { name: 'held-root', weight: 2, hits: [{ at: 0, dur: 11, tone: 'root', vel: 0.9 }] },
  ],
  comp: [
    { name: 'two-and-three', weight: 7, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.68 },
      { at: 8, dur: 3, vel: 0.62 },
    ] },
    { name: 'two-and-three-short', weight: 3, voices: 4, hits: [
      { at: 4, dur: 2, vel: 0.7 },
      { at: 8, dur: 2, vel: 0.62 },
    ] },
    { name: 'held', weight: 2, voices: 4, hits: [{ at: 0, dur: 12, vel: 0.48 }] },
  ],
  drums: [],
  /**
   * Oom-pah-pah is a left hand, whoever is playing it. No `instruments` list —
   * a concert waltz is as likely to be an orchestra as a piano, and this is the
   * weaker and truer claim: on the nights the palette deals a keyboard, that
   * keyboard plays its own bass and chords, because that is what the instrument
   * does with this figure.
   */
  twoHanded: {
    density: 0.8,
    modes: [['stride', 7], ['answer', 3]],
  },
  melody: { leap: 0.24, ornament: 0.26, span: 17, sequence: 0.5, syncopation: 0.2 },
};

/**
 * MAZURKA — three with the weight on the wrong beat.
 *
 * A waltz accents beat one. A mazurka accents beat two or beat three, and it
 * does so with a dotted figure — long-short, long, long — which is why the two
 * are separate styles rather than one style with a tempo range. Take the accent
 * off two and it is a slow waltz.
 *
 * The tables put the accent where the dance puts it: the `shots` name slot four
 * and slot eight, the comp strikes on beat two harder than on the downbeat, and
 * the melody cells are led by `[3, 1, 4, 4]` and `[4, 3, 1, 4]` — the snapped
 * dotted-eighth pair that is the figure everybody recognises.
 *
 * Modally it is the one place in the file where the raised fourth appears
 * naturally. Polish folk music uses it, Chopin wrote it down, and `lydian` is in
 * the major half of the scale ladder in `index.ts` largely so that a `II` major
 * triad in a mazurka gets a line that can play its own third.
 */
const mazurka: Style = {
  id: 'mazurka',
  label: 'Mazurka',
  description:
    'Three with the accent on the second or third beat and a snapped dotted figure. Modal inflections and a raised fourth.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [126, 156],
  swing: 0,
  modeWeights: { minor: 0.58, major: 0.42 },
  relativeMajorChorus: 0.35,
  excludeLayers: ['drums'],
  shots: [[[4, 8], 4], [[0, 4], 3], [[8], 2]],
  progressions: {
    intro: [
      { chords: ['i', 'i', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'V7', 'i', 'i'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'V7', 'i', 'V7', 'i', 'iv', 'V7', 'i'], weight: 5 },
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'V7', 'V7'], weight: 4, note: 'A drone-and-fall shape rather than a cadence — a mazurka is a village dance before it is a concert piece' },
      { chords: ['i', 'iv', 'VII', 'III', 'VI', 'iio', 'V7', 'i'], weight: 3 },
      { chords: ['i', 'V7/III', 'III', 'VII', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VII', 'VII', 'iv', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'III', 'iio', 'V7', 'i', 'iv', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'V7', 'i', 'V7', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'i', 'i', 'V7/V', 'V7/V', 'V7', 'V7'], weight: 4 },
      { chords: ['III', 'VI', 'V7/iv', 'iv', 'iio', 'V7', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['iv', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['VII', 'VI', 'V7', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'V7', 'I', 'V7', 'I', 'IV', 'V7', 'I'], weight: 5 },
      { chords: ['I', 'II', 'V7', 'I', 'I', 'II', 'V7', 'I'], weight: 4, note: 'The major supertonic with its raised fourth — the lydian inflection Polish dance music actually has, and the reason `lydian` is in the mixture ladder' },
      { chords: ['I', 'vi', 'ii', 'V7', 'I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V7', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['vi', 'iii', 'IV', 'ii', 'V7', 'V7', 'I', 'I'], weight: 3 },
    ],
    outro: [{ chords: ['IV', 'V7', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [3, 1, 4, 4], weight: 6 },
    { cell: [4, 3, 1, 4], weight: 5 },
    { cell: [4, 4, 4], weight: 4 },
    { cell: [3, 1, 8], weight: 3 },
    { cell: [8, 4], weight: 3 },
    { cell: [2, 2, 4, 4], weight: 3 },
    { cell: [12], weight: 2 },
    { cell: [-4, 3, 1, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [12], weight: 4 },
    { cell: [4, 8], weight: 4 },
    { cell: [3, 1, 8], weight: 3 },
  ],
  bass: [
    // On one, and then the accent is somewhere else. A bass that also hit the
    // accented beat would take the displacement away by agreeing with it.
    { name: 'on-the-one', weight: 5, hits: [{ at: 0, dur: 3, tone: 'root', vel: 0.9 }] },
    { name: 'one-and-three', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.9 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.82 },
    ] },
    { name: 'drone-fifth', weight: 3, sustain: true, hits: [{ at: 0, dur: 12, tone: 'root', vel: 0.85 }] },
  ],
  comp: [
    { name: 'accented-two', weight: 6, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.78 },
      { at: 8, dur: 3, vel: 0.58 },
    ] },
    { name: 'accented-three', weight: 4, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.56 },
      { at: 8, dur: 3, vel: 0.78 },
    ] },
    { name: 'held', weight: 2, voices: 4, hits: [{ at: 0, dur: 12, vel: 0.5 }] },
  ],
  drums: [],
  melody: { leap: 0.26, ornament: 0.3, span: 15, sequence: 0.55, syncopation: 0.32 },
};

/**
 * POLONAISE — three, at a walking pace, with the first beat split.
 *
 * Its identity is one bar of rhythm: an eighth, two sixteenths, and then four
 * eighths. Nothing else about a polonaise is distinctive — the harmony is
 * ordinary, the tempo is between a march and a waltz, and the phrases are
 * square — and that one bar is enough, which is why the figure appears in the
 * `shots`, in the comp and at the head of the melody cells.
 *
 * The other rule is the cadence: a polonaise phrase does not end on the
 * downbeat, it ends on beat three, so the last note of every strain is
 * off-centre. That lands in `cadenceCells`, where the plain twelve carries far
 * less weight than in the waltz and the figure that ends on the third beat
 * carries more.
 */
const polonaise: Style = {
  id: 'polonaise',
  label: 'Polonaise',
  description:
    'Stately three at a walking pace. An eighth and two sixteenths on the downbeat, and phrases that end on beat three.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [104, 126],
  swing: 0,
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0.3,
  excludeLayers: ['drums'],
  shots: [[[0, 2, 3, 4], 4], [[0, 4, 8], 3], [[0, 2, 3], 2]],
  progressions: {
    intro: [
      { chords: ['I', 'V7', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'V7', 'I', 'V7/V', 'V', 'V', 'V7', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'V7', 'I', 'vi', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'V7/vi', 'vi', 'iii', 'IV', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'iv', 'I', 'V7', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['V', 'V7/V', 'V', 'V', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['IV', 'I', 'ii', 'V7', 'I', 'V7/IV', 'IV', 'I'], weight: 4 },
      { chords: ['bVI', 'IV', 'I', 'V7', 'I', 'ii', 'V7', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['V7/vi', 'vi', 'V7/ii', 'ii', 'V7/V', 'V', 'V7', 'I'], weight: 4 },
      { chords: ['vi', 'V7/IV', 'IV', 'iv', 'ii', 'V7', 'I', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['IV', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['ii', 'V7', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'V7', 'i', 'iv', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'V7/III', 'III', 'VII', 'VI', 'iio', 'V7', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['III', 'VII', 'i', 'iv', 'iio', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['VI', 'iv', 'i', 'V7', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    outro: [{ chords: ['iv', 'V7', 'i', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 1, 1, 2, 2, 2, 2], weight: 6 },
    { cell: [2, 1, 1, 4, 4], weight: 5 },
    { cell: [4, 4, 4], weight: 4 },
    { cell: [2, 1, 1, 8], weight: 3 },
    { cell: [4, 2, 2, 4], weight: 3 },
    { cell: [8, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 4], weight: 3 },
    { cell: [12], weight: 2 },
  ],
  cadenceCells: [
    // A polonaise ends on the third beat, so the cell that leaves the downbeat
    // and settles late carries more weight than the plain whole bar.
    { cell: [4, 4, 4], weight: 5 },
    { cell: [8, 4], weight: 4 },
    { cell: [4, 2, 2, 4], weight: 3 },
    { cell: [12], weight: 2 },
  ],
  bass: [
    { name: 'split-downbeat', weight: 6, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.95 },
      { at: 2, dur: 1, tone: 'fifth', vel: 0.66 },
      { at: 3, dur: 1, tone: 'root', vel: 0.7 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.78 },
      { at: 8, dur: 3, tone: 'root', vel: 0.82 },
    ] },
    { name: 'three-quarters', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.95 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.76 },
      { at: 8, dur: 3, tone: 'octave', vel: 0.8 },
    ] },
    { name: 'on-the-one', weight: 2, hits: [{ at: 0, dur: 7, tone: 'root', vel: 0.92 }] },
  ],
  comp: [
    { name: 'polonaise-figure', weight: 6, voices: 4, hits: [
      { at: 0, dur: 2, vel: 0.72 },
      { at: 2, dur: 1, vel: 0.5 },
      { at: 3, dur: 1, vel: 0.52 },
      { at: 4, dur: 2, vel: 0.6 },
      { at: 6, dur: 2, vel: 0.52 },
      { at: 8, dur: 2, vel: 0.58 },
      { at: 10, dur: 2, vel: 0.52 },
    ] },
    { name: 'quarters', weight: 4, voices: 4, hits: [
      { at: 0, dur: 3, vel: 0.7 },
      { at: 4, dur: 3, vel: 0.58 },
      { at: 8, dur: 3, vel: 0.6 },
    ] },
    { name: 'two-and-three', weight: 3, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.62 },
      { at: 8, dur: 3, vel: 0.58 },
    ] },
  ],
  drums: [],
  twoHanded: {
    density: 0.75,
    modes: [['stride', 5], ['block', 4], ['answer', 2]],
  },
  melody: { leap: 0.26, ornament: 0.28, span: 16, sequence: 0.55, syncopation: 0.24 },
};

/**
 * BARCAROLLE — a boat, in six-eight, and the accompaniment is the water.
 *
 * The same metre as the gigue and the opposite music, which is the pair this
 * file most needs to keep apart. A gigue is contrapuntal and runs; a barcarolle
 * has a *tune over a rocking figure*, and the figure never changes and never
 * stops. So where the gigue's bass runs in eighths and its `sequence` is the
 * highest in the file, this one's bass is a bass note and a rocking answer, its
 * comp arpeggiates, and its melody is long.
 *
 * Major more often than not, and the minor ones are Venetian rather than sad.
 */
const barcarolle: Style = {
  id: 'barcarolle',
  label: 'Barcarolle',
  description:
    'A rocking six-eight over an unchanging accompaniment figure. Long melodic phrases, chromatic inner motion, nothing hurried.',
  beatsPerBar: 3,
  beatUnit: 8,
  groups: [6, 6],
  bpm: [92, 116],
  swing: 0,
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0.3,
  excludeLayers: ['drums'],
  progressions: {
    intro: [
      { chords: ['I', 'I', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'ii', 'V7'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'V7/vi', 'vi', 'iii', 'IV', 'ii', 'V7', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'iv', 'I', 'V7/V', 'V', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'I', 'V7', 'V7', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'V7/V', 'V', 'ii', 'V7', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'iv', 'I', 'V7/vi', 'vi', 'ii', 'V7', 'I'], weight: 5 },
      { chords: ['bVI', 'IV', 'I', 'V7', 'I', 'ii', 'V7', 'I'], weight: 3 },
      { chords: ['V', 'V7/V', 'V', 'I', 'IV', 'ii', 'V7', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['V7/vi', 'vi', 'V7/IV', 'IV', 'iv', 'V7', 'I', 'I'], weight: 4 },
    ],
    outro: [
      { chords: ['IV', 'iv', 'I', 'I'], weight: 4 },
      { chords: ['ii', 'V7', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'V7', 'i', 'iv', 'VI', 'iio', 'V7', 'i'], weight: 5 },
      { chords: ['i', 'V7/III', 'III', 'VII', 'iv', 'V7', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'VI', 'iv', 'i', 'iio', 'V7', 'i', 'I'], weight: 4 },
      { chords: ['VI', 'iv', 'bII', 'V7', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    outro: [{ chords: ['iv', 'i', 'V7', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [6, 6], weight: 5 },
    { cell: [12], weight: 5 },
    { cell: [4, 2, 6], weight: 4 },
    { cell: [6, 4, 2], weight: 3 },
    { cell: [-6, 6], weight: 3 },
    { cell: [2, 2, 2, 6], weight: 3 },
    { cell: [-2, 4, 6], weight: 3 },
    { cell: [6, 2, 2, 2], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 6 },
    { cell: [6, 6], weight: 3 },
    { cell: [-6, 6], weight: 2 },
  ],
  bass: [
    // The rock: a bass note on each dotted beat, the second one lighter. The
    // figure that makes the boat move.
    { name: 'rocking', weight: 6, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 0.9 },
      { at: 6, dur: 5, tone: 'fifth', vel: 0.66 },
    ] },
    { name: 'rocking-with-lift', weight: 4, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.9 },
      { at: 4, dur: 2, tone: 'fifth', vel: 0.6 },
      { at: 6, dur: 2, tone: 'octave', vel: 0.7 },
      { at: 10, dur: 2, tone: 'fifth', vel: 0.6 },
    ] },
    { name: 'held', weight: 2, sustain: true, hits: [{ at: 0, dur: 12, tone: 'root', vel: 0.84 }] },
  ],
  comp: [
    { name: 'broken-six', weight: 5, voices: 4, arpeggio: true, arpDirection: 'up', hits: [
      { at: 2, dur: 2, vel: 0.46 }, { at: 4, dur: 2, vel: 0.42 },
      { at: 8, dur: 2, vel: 0.46 }, { at: 10, dur: 2, vel: 0.42 },
    ] },
    { name: 'afterbeats', weight: 4, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.5 },
      { at: 4, dur: 2, vel: 0.46 },
      { at: 8, dur: 2, vel: 0.5 },
      { at: 10, dur: 2, vel: 0.46 },
    ] },
    { name: 'held', weight: 3, voices: 4, hits: [{ at: 0, dur: 12, vel: 0.46 }] },
  ],
  drums: [],
  twoHanded: {
    density: 0.78,
    modes: [['stride', 6], ['block', 3], ['answer', 2]],
  },
  melody: { leap: 0.22, ornament: 0.32, span: 17, sequence: 0.48, syncopation: 0.26 },
};

/**
 * BERCEUSE — one figure, unchanged, for the whole piece.
 *
 * A lullaby, and formally the strictest thing in the file after the passacaglia:
 * the left hand plays a rocking two-bar pattern over a tonic-and-dominant
 * alternation and *does not stop or vary for the entire piece*, while the right
 * hand decorates increasingly elaborately above it. Chopin's is fifty-four bars
 * of the same two chords.
 *
 * So the harmony tables are almost empty on purpose — tonic, dominant, and the
 * occasional subdominant — and the interest is entirely in `melody.ornament`,
 * which at 0.44 is the highest in the file. This is the one style where the tune
 * getting more elaborate *is* the form.
 *
 * `ostinato` is the whole left-hand table, with a cycle of 24 against a bar of
 * 12: two bars long, so the figure and the barline agree every other bar, which
 * is exactly what a berceuse's rocking figure does.
 */
const berceuse: Style = {
  id: 'berceuse',
  label: 'Berceuse',
  description:
    'A lullaby over an unchanging two-bar rocking figure. Tonic and dominant, and a tune that decorates itself more each time round.',
  beatsPerBar: 3,
  beatUnit: 8,
  groups: [6, 6],
  bpm: [80, 100],
  swing: 0,
  modeWeights: { minor: 0.22, major: 0.78 },
  relativeMajorChorus: 0.15,
  excludeLayers: ['drums'],
  // The harmony is two chords. `earworm` keeps it that way rather than letting
  // the draw wander into the elaborate entries, which is the correct reading of
  // this form: everything that develops, develops above the accompaniment.
  hook: 'earworm',
  progressions: {
    intro: [
      { chords: ['I', 'V7', 'I', 'V7'], weight: 5 },
    ],
    verse: [
      { chords: ['I', 'V7', 'I', 'V7', 'I', 'V7', 'I', 'I'], weight: 6, note: 'Two chords for the length of the piece, which is what a berceuse is' },
      { chords: ['I', 'V7', 'I', 'IV', 'I', 'V7', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['I', 'V7', 'I', 'V7', 'I', 'V7', 'I', 'I'], weight: 6 },
      { chords: ['IV', 'I', 'V7', 'I', 'IV', 'V7', 'I', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['I', 'V7', 'I', 'V7', 'IV', 'iv', 'I', 'V7'], weight: 4, note: 'The one bar of shadow a lullaby is allowed, and it is a borrowed subdominant' },
    ],
    outro: [
      { chords: ['I', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['IV', 'I', 'V7', 'I'], weight: 2 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'V7', 'i', 'V7', 'i', 'V7', 'i', 'i'], weight: 6 },
      { chords: ['i', 'V7', 'i', 'iv', 'i', 'V7', 'i', 'i'], weight: 3 },
    ],
    outro: [{ chords: ['iv', 'V7', 'i', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [12], weight: 5 },
    { cell: [6, 6], weight: 5 },
    { cell: [4, 2, 6], weight: 4 },
    { cell: [2, 2, 2, 6], weight: 4 },
    { cell: [1, 1, 2, 2, 6], weight: 3 },
    { cell: [-6, 6], weight: 3 },
    { cell: [2, 2, 2, 2, 2, 2], weight: 3 },
    { cell: [6, 2, 2, 2], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 6 },
    { cell: [6, 6], weight: 2 },
  ],
  bass: [
    { name: 'rocking', weight: 6, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 0.85 },
      { at: 6, dur: 5, tone: 'fifth', vel: 0.62 },
    ] },
    { name: 'held', weight: 3, sustain: true, hits: [{ at: 0, dur: 12, tone: 'root', vel: 0.8 }] },
  ],
  comp: [
    { name: 'cradle', weight: 6, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.44 },
      { at: 4, dur: 2, vel: 0.4 },
      { at: 8, dur: 2, vel: 0.44 },
      { at: 10, dur: 2, vel: 0.4 },
    ] },
    { name: 'held', weight: 3, voices: 4, hits: [{ at: 0, dur: 12, vel: 0.42 }] },
  ],
  drums: [],
  twoHanded: {
    instruments: [['steinway', 7], ['piano', 2], ['harp', 2]],
    density: 0.85,
    modes: [['ostinato', 8], ['block', 2]],
    /**
     * Two bars long against a bar of twelve, so the figure returns to its own
     * beginning every other bar and never lands the same way twice running.
     * This is the one ostinato in the file whose cycle *agrees* with the metre
     * rather than drifting against it, and that is the point: a lullaby that
     * drifted would wake the child.
     */
    ostinato: { cycle: 24, hits: [
      { at: 0, dur: 2, vel: 0.5 }, { at: 2, dur: 2, vel: 0.4 }, { at: 4, dur: 2, vel: 0.42 },
      { at: 6, dur: 2, vel: 0.46 }, { at: 8, dur: 2, vel: 0.4 }, { at: 10, dur: 2, vel: 0.42 },
      { at: 12, dur: 2, vel: 0.48 }, { at: 14, dur: 2, vel: 0.4 }, { at: 16, dur: 2, vel: 0.42 },
      { at: 18, dur: 2, vel: 0.46 }, { at: 20, dur: 2, vel: 0.4 }, { at: 22, dur: 2, vel: 0.42 },
    ] },
  },
  melody: { leap: 0.18, ornament: 0.44, span: 15, sequence: 0.4, syncopation: 0.2 },
};

/**
 * ÉTUDE — one technical problem, repeated until it is a piece of music.
 *
 * A study is defined by a figure that does not stop: sixteenths for four
 * minutes, in one hand or the other, with the harmony changing underneath and
 * the figure never changing shape. That is the whole form, and it is why this
 * style's melody cells are almost entirely made of sixteenths and its `ostinato`
 * cycle is prime against the bar.
 *
 * The harmony has to carry the piece because nothing else can, so the tables are
 * the most chromatic in the file outside the impressionist prelude: applied
 * dominants on every degree, the diminished seventh as a pivot, and long
 * descending-fifth chains. An étude with static harmony is a warm-up.
 *
 * `unison` is in the left-hand table and it is here rather than anywhere else
 * for a reason: two hands an octave apart running the same sixteenths is the
 * étude gesture — the octave study, the double-note study — and it is a
 * virtuoso's device that would be a mistake in a nocturne.
 */
const etude: Style = {
  id: 'etude',
  label: 'Étude',
  description:
    'One figure in continuous sixteenths for the whole piece, over the most chromatic harmony in the catalogue.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [126, 162],
  swing: 0,
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0.25,
  excludeLayers: ['drums'],
  progressions: {
    verse: [
      { chords: ['i', 'V7/iv', 'iv', 'VII', 'III', 'VI', 'iio', 'V7'], weight: 5, note: 'Descending fifths with a dominant on every station — the engine of a study, because a figure that never changes needs harmony that always does' },
      { chords: ['i', 'V7', 'i', '#viio7', 'i', 'iv', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'V7/VI', 'VI', 'V7/iv', 'iv', 'iio', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'i', 'V7', 'V7', 'VI', 'VI', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['V7/III', 'III', 'V7/VI', 'VI', 'V7/iv', 'iv', 'V7', 'i'], weight: 5 },
      { chords: ['iv', '#viio7', 'i', 'V7/V', 'V7', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['III', 'VII', 'VI', 'iio', 'V7', 'i', 'V7', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['bII', 'V7', 'i', '#viio7', 'V7/iv', 'iv', 'V7', 'V7'], weight: 4 },
      { chords: ['V7/VI', 'VI', 'V7/V', 'V7', 'i', '#viio7', 'V7', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['iv', 'V7', 'i', 'I'], weight: 4 },
      { chords: ['#viio7', 'V7', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'V7/IV', 'IV', 'viio', 'iii', 'vi', 'ii', 'V7'], weight: 5 },
      { chords: ['I', 'V7/vi', 'vi', 'V7/ii', 'ii', 'V7/V', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'viio7', 'I', 'IV', 'iv', 'I', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['V7/ii', 'ii', 'V7/V', 'V', 'IV', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['bVI', 'IV', 'viio7', 'I', 'ii', 'V7', 'I', 'I'], weight: 3 },
    ],
    outro: [{ chords: ['IV', 'V7', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], weight: 6 },
    { cell: [1, 1, 1, 1, 1, 1, 1, 1, 4, 4], weight: 5 },
    { cell: [2, 2, 2, 2, 2, 2, 2, 2], weight: 4 },
    { cell: [1, 1, 1, 1, 2, 2, 4, 4], weight: 4 },
    { cell: [4, 1, 1, 1, 1, 4, 4], weight: 3 },
    { cell: [8, 1, 1, 1, 1, 4], weight: 3 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'strong-beats', weight: 5, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.92 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.78 },
    ] },
    { name: 'octave-strokes', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.95 },
      { at: 4, dur: 3, tone: 'octave', vel: 0.72 },
      { at: 8, dur: 3, tone: 'root', vel: 0.82 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.74 },
    ] },
    { name: 'held', weight: 3, sustain: true, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.86 }] },
  ],
  comp: [
    { name: 'running-sixteenths', weight: 6, voices: 4, arpeggio: true, arpDirection: 'updown', arpOctaves: 2, hits: [
      { at: 0, dur: 1, vel: 0.5 }, { at: 1, dur: 1, vel: 0.4 }, { at: 2, dur: 1, vel: 0.44 }, { at: 3, dur: 1, vel: 0.4 },
      { at: 4, dur: 1, vel: 0.48 }, { at: 5, dur: 1, vel: 0.4 }, { at: 6, dur: 1, vel: 0.44 }, { at: 7, dur: 1, vel: 0.4 },
      { at: 8, dur: 1, vel: 0.5 }, { at: 9, dur: 1, vel: 0.4 }, { at: 10, dur: 1, vel: 0.44 }, { at: 11, dur: 1, vel: 0.4 },
      { at: 12, dur: 1, vel: 0.48 }, { at: 13, dur: 1, vel: 0.4 }, { at: 14, dur: 1, vel: 0.44 }, { at: 15, dur: 1, vel: 0.4 },
    ] },
    { name: 'broken-eighths', weight: 4, voices: 4, arpeggio: true, arpDirection: 'downup', hits: [
      { at: 0, dur: 2, vel: 0.5 }, { at: 2, dur: 2, vel: 0.42 },
      { at: 4, dur: 2, vel: 0.46 }, { at: 6, dur: 2, vel: 0.42 },
      { at: 8, dur: 2, vel: 0.48 }, { at: 10, dur: 2, vel: 0.42 },
      { at: 12, dur: 2, vel: 0.46 }, { at: 14, dur: 2, vel: 0.42 },
    ] },
    { name: 'held', weight: 2, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.44 }] },
  ],
  drums: [],
  twoHanded: {
    instruments: [['steinway', 8], ['piano', 2]],
    density: 0.85,
    modes: [['ostinato', 5], ['unison', 3], ['block', 3]],
    /**
     * Twenty sixteenths against a bar of sixteen: five beats to the bar's four,
     * so the figure arrives on a different beat every bar and comes home every
     * fourth. That drift is what makes four minutes of one figure listenable,
     * and it is the same arithmetic `stalker` uses over in `synth` for the
     * opposite emotional purpose.
     */
    ostinato: { cycle: 20, hits: [
      { at: 0, dur: 1, vel: 0.5 }, { at: 1, dur: 1, vel: 0.4 }, { at: 2, dur: 1, vel: 0.44 }, { at: 3, dur: 1, vel: 0.4 },
      { at: 4, dur: 1, vel: 0.48 }, { at: 5, dur: 1, vel: 0.4 }, { at: 6, dur: 1, vel: 0.44 }, { at: 7, dur: 1, vel: 0.4 },
      { at: 8, dur: 1, vel: 0.48 }, { at: 9, dur: 1, vel: 0.4 }, { at: 10, dur: 1, vel: 0.44 }, { at: 11, dur: 1, vel: 0.4 },
      { at: 12, dur: 1, vel: 0.48 }, { at: 13, dur: 1, vel: 0.4 }, { at: 14, dur: 1, vel: 0.44 }, { at: 15, dur: 1, vel: 0.4 },
      { at: 16, dur: 1, vel: 0.48 }, { at: 17, dur: 1, vel: 0.4 }, { at: 18, dur: 1, vel: 0.44 }, { at: 19, dur: 1, vel: 0.4 },
    ] },
  },
  melody: { leap: 0.32, ornament: 0.18, span: 21, sequence: 0.62, syncopation: 0.2 },
};

/**
 * LACRIMOSA — the requiem movement, in twelve-eight, and the darkest thing here.
 *
 * Named for the movement rather than for a form because there is no form: what
 * this style is is a *texture*, and it is one that recurs across two hundred
 * years of sacred music. A slow compound metre; a two-note sighing figure
 * repeated in the strings; a chorus over it in long notes; a harmony that keeps
 * reaching for the Neapolitan and the diminished seventh and refusing to
 * resolve until the last bar.
 *
 * 95% minor, which is the most lopsided `modeWeights` in the file and is simply
 * true — there is no major requiem. The 5% is the *Lux aeterna* at the end, and
 * the major table is two entries long because that is all it needs to be.
 *
 * `vocals` finds its second home here. The genre sings on `aria` and on this,
 * and the two want opposite things from the same profile — one is a soloist
 * showing off and the other is forty people in a gallery — which the engine has
 * no way to distinguish, and which is recorded in `vocals.ts` as the compromise
 * it is.
 */
const lacrimosa: Style = {
  id: 'lacrimosa',
  label: 'Lacrimosa',
  description:
    'Slow twelve-eight sacred lament. A sighing two-note figure, long vocal lines and a harmony that will not resolve.',
  beatsPerBar: 6,
  beatUnit: 8,
  groups: [6, 6, 6, 6],
  bpm: [88, 112],
  swing: 0,
  modeWeights: { minor: 0.95, major: 0.05 },
  relativeMajorChorus: 0.2,
  excludeLayers: ['drums'],
  progressions: {
    intro: [
      { chords: ['i', 'i', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'V7', 'i', 'iv', 'bII', 'V7', 'i', 'i'], weight: 5, note: 'The Neapolitan as the pre-dominant — the chord this movement is written around' },
      { chords: ['i', '#viio7', 'i', 'iv', 'VI', 'iio', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'iv', 'VII', 'III', 'VI', 'iio', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'V7', 'V7', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'iio', 'V7', 'i', 'iv', 'bII', 'V7', 'i'], weight: 5 },
      { chords: ['iv', 'V7/VI', 'VI', '#viio7', 'V7', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['III', 'VII', 'VI', 'iv', 'iio', 'V7', 'i', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['V7/iv', 'iv', 'bII', 'bII', 'V7', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['#viio7', 'i', 'V7/VI', 'VI', 'iio', 'V7', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['iv', 'V7', 'i', 'I'], weight: 5, note: 'The final major chord: the one moment of light in the movement, and it lasts a bar' },
      { chords: ['bII', 'V7', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'IV', 'iv', 'I', 'ii', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V7/vi', 'vi', 'IV', 'ii', 'V7', 'I', 'I'], weight: 3 },
    ],
    outro: [{ chords: ['IV', 'I', 'V7', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [24], weight: 5 },
    { cell: [12, 12], weight: 5 },
    { cell: [6, 6, 12], weight: 4 },
    { cell: [-6, 6, 12], weight: 4 },
    { cell: [18, 6], weight: 3 },
    { cell: [6, 6, 6, 6], weight: 3 },
    { cell: [-12, 12], weight: 3 },
    { cell: [4, 2, 6, 12], weight: 2 },
  ],
  cadenceCells: [
    { cell: [24], weight: 6 },
    { cell: [18, 6], weight: 3 },
    { cell: [12, 12], weight: 2 },
  ],
  bass: [
    { name: 'dotted-tread', weight: 5, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 0.88 },
      { at: 6, dur: 5, tone: 'root', vel: 0.7 },
      { at: 12, dur: 5, tone: 'fifth', vel: 0.78 },
      { at: 18, dur: 5, tone: 'approach', vel: 0.7 },
    ] },
    { name: 'halves', weight: 4, hits: [
      { at: 0, dur: 11, tone: 'root', vel: 0.88 },
      { at: 12, dur: 11, tone: 'fifth', vel: 0.74 },
    ] },
    { name: 'held', weight: 3, sustain: true, hits: [{ at: 0, dur: 24, tone: 'root', vel: 0.82 }] },
  ],
  comp: [
    /**
     * The sighing figure: two notes, the second lighter and lower, once per
     * dotted beat. It is the only comp pattern in the file that is a *motif*
     * rather than an accompaniment texture, and it is why this style exists.
     */
    { name: 'sighing-pairs', weight: 6, voices: 3, hits: [
      { at: 0, dur: 4, vel: 0.6 }, { at: 4, dur: 2, vel: 0.42 },
      { at: 6, dur: 4, vel: 0.55 }, { at: 10, dur: 2, vel: 0.4 },
      { at: 12, dur: 4, vel: 0.58 }, { at: 16, dur: 2, vel: 0.42 },
      { at: 18, dur: 4, vel: 0.55 }, { at: 22, dur: 2, vel: 0.4 },
    ] },
    { name: 'held', weight: 4, voices: 4, hits: [{ at: 0, dur: 24, vel: 0.5 }] },
    { name: 'dotted-beats', weight: 3, voices: 4, hits: [
      { at: 0, dur: 5, vel: 0.55 },
      { at: 6, dur: 5, vel: 0.48 },
      { at: 12, dur: 5, vel: 0.52 },
      { at: 18, dur: 5, vel: 0.48 },
    ] },
  ],
  drums: [],
  melody: { leap: 0.18, ornament: 0.22, span: 15, sequence: 0.5, syncopation: 0.15 },
};

// ---------------------------------------------------------------------------
// The impressionists — harmony that has stopped going anywhere
// ---------------------------------------------------------------------------

/**
 * PRELUDE — the impressionist one, and the only style here that refuses to
 * cadence.
 *
 * Everything else in this file is organised by where the harmony is going.
 * This one is organised by *colour*: chords chosen for how they sound rather
 * than for what they resolve to, planed in parallel because parallel motion
 * makes a chord read as a single sonority rather than as four voices, and
 * cadences that arrive by stopping rather than by resolving.
 *
 * Three specific things are written into the tables and nowhere else in the
 * genre:
 *
 *  - **The augmented triad and the altered dominant.** `I+`, `V7#5` and `V7b5`
 *    appear here and in no other style, and that restraint is load-bearing:
 *    `scaleForChord` answers any of them with the whole-tone scale, which has no
 *    perfect fifth and therefore no tonic triad and no leading tone. It is the
 *    right answer for a Debussy chord and it would be a catastrophe under a
 *    baroque `III+`, so the only defence is that no other style writes one. Said
 *    out loud here so that a future style thinking about an augmented chord
 *    knows what it is asking for.
 *  - **Planing.** `bIII`, `II`, `bVI` and `bVII` as plain major triads a step or
 *    a third apart, with no functional relation between them at all. This is why
 *    `parallel-perfects` is relaxed for the genre — a planed chord *is* parallel
 *    motion, by construction.
 *  - **Ninths and sevenths on everything, and no resolution.** `Imaj9` and
 *    `IVmaj7` sit where a triad would, and the piece ends on one.
 *
 * **`ending: 'fade'`, which this style has wanted since it was written.** The
 * last bullet above is the argument in one line: the piece ends on `Imaj9` on
 * purpose, and a button re-strikes that chord on the downbeat with its velocity
 * lifted, turning a harmony that declines to resolve into one that arrives.
 * 4.9 notes per song over 40 seeds, and **the highest manufacturing rate of the
 * six styles that took `fade` — 12 songs in 40 gained an attack that the
 * arrangement had not written at all**, because a texture built out of planed
 * chords and stopped cadences is exactly the texture whose layers have nothing
 * left on the last downbeat for the recall branch to find.
 */
const prelude: Style = {
  id: 'prelude',
  label: 'Prelude',
  description:
    'Impressionist prelude. Planed chords, added ninths, whole-tone dominants and a harmony that stops rather than resolving.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [56, 88],
  swing: 0,
  modeWeights: { minor: 0.42, major: 0.58 },
  relativeMajorChorus: 0.1,
  excludeLayers: ['drums'],
  // See the header. A harmony that stops rather than resolving cannot be landed
  // on, and the last chord in the tables below has a ninth in it for that reason.
  ending: 'fade',
  // No cadence to repeat and no refrain to recall. `through` is the one style in
  // the file that takes it: a prelude of this kind states an image and leaves,
  // and a section that came back would be a different aesthetic entirely.
  hook: 'through',
  progressions: {
    intro: [
      { chords: ['Imaj9', 'Imaj9', 'IVmaj7', 'IVmaj7'], weight: 4 },
      { chords: ['I', 'II', 'I', 'II'], weight: 3 },
    ],
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'bIII', 'bIII', 'bVI', 'bVI', 'bVII', 'bVII'], weight: 5, note: 'Four major triads a third and a step apart with no functional relation between any two of them. Planing, and the reason `parallel-perfects` is off' },
      { chords: ['I', 'II', 'bIII', 'II', 'I', 'bVII', 'IV', 'I'], weight: 4, note: 'The major supertonic with its raised fourth — lydian, which is the brightest thing the mixture ladder can reach' },
      { chords: ['Imaj9', 'IVmaj7', 'Imaj9', 'IVmaj7', 'bVI', 'bVII', 'Imaj9', 'Imaj9'], weight: 4 },
      { chords: ['I+', 'I+', 'IV', 'IV', 'V7#5', 'V7#5', 'I', 'I'], weight: 3, note: 'The whole-tone bars: an augmented tonic and an augmented dominant, both of which take a scale with no fifth in it and therefore no way home' },
    ],
    chorus: [
      { chords: ['bVI', 'bVI', 'bVII', 'bVII', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 },
      { chords: ['IVmaj7', 'IVmaj7', 'bIII', 'bIII', 'II', 'II', 'Imaj9', 'Imaj9'], weight: 4 },
      { chords: ['V7b5', 'V7b5', 'Imaj9', 'Imaj9', 'IVmaj7', 'IVmaj7', 'I', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['I+', 'I+', 'V7#5', 'V7#5', 'bIII', 'bIII', 'bVI', 'bVI'], weight: 4 },
      { chords: ['iv', 'iv', 'bVI', 'bVI', 'bII', 'bII', 'I', 'I'], weight: 3, note: 'The whole parallel minor borrowed at once, which the mixture ladder answers with aeolian and then phrygian on the same tonic' },
    ],
    outro: [
      { chords: ['IVmaj7', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5, note: 'It does not cadence. It arrives on a chord with a ninth on it and is let go' },
      { chords: ['bVII', 'IV', 'Imaj9', 'Imaj9'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'bII', 'bII', 'i', 'i'], weight: 5, note: 'The Phrygian second used as a colour rather than as a pre-dominant — it goes back to the tonic instead of on to the dominant' },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'iv', 'VII', 'i'], weight: 4 },
      { chords: ['i', 'i', 'III', 'III', 'VI', 'VI', 'iv', 'iv'], weight: 4 },
      { chords: ['i', 'V7#5', 'i', 'V7#5', 'VI', 'VI', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'III', 'III', 'VII', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'bII', 'bII', 'VI', 'VI', 'i', 'i'], weight: 4 },
      { chords: ['III', 'VI', 'VII', 'iv', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['bII', 'bII', 'VI', 'VI', 'V7b5', 'V7b5', 'i', 'i'], weight: 4 },
    ],
    outro: [
      { chords: ['iv', 'i', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VII', 'i', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-8, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [-8, 4, 4], weight: 3 },
    // A written-out flourish, which in this repertoire replaces the ornament:
    // Debussy notated the decoration rather than trusting anyone to add it.
    { cell: [1, 1, 1, 1, 4, 8], weight: 3 },
    { cell: [6, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'held', weight: 6, sustain: true, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.8 }] },
    { name: 'strong-beats', weight: 4, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.82 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.66 },
    ] },
    { name: 'low-fifths', weight: 3, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.82 },
      { at: 8, dur: 7, tone: 'octave', vel: 0.62 },
    ] },
  ],
  comp: [
    { name: 'planed-chords', weight: 5, voices: 4, hits: [
      { at: 0, dur: 8, vel: 0.52 },
      { at: 8, dur: 8, vel: 0.46 },
    ] },
    { name: 'held', weight: 5, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.5 }] },
    { name: 'spread', weight: 4, voices: 4, arpeggio: true, arpDirection: 'up', arpOctaves: 2, hits: [
      { at: 0, dur: 2, vel: 0.46 }, { at: 2, dur: 2, vel: 0.4 },
      { at: 4, dur: 2, vel: 0.42 }, { at: 6, dur: 2, vel: 0.4 },
      { at: 8, dur: 2, vel: 0.44 }, { at: 10, dur: 2, vel: 0.4 },
      { at: 12, dur: 2, vel: 0.42 }, { at: 14, dur: 2, vel: 0.4 },
    ] },
  ],
  drums: [],
  twoHanded: {
    instruments: [['steinway', 7], ['harp', 3], ['piano', 2]],
    density: 0.7,
    modes: [['block', 5], ['answer', 4], ['unison', 2]],
  },
  melody: { leap: 0.24, ornament: 0.2, span: 18, sequence: 0.3, syncopation: 0.4 },
};

export const STYLES: Record<string, Style> = {
  minuet,
  gavotte,
  sarabande,
  gigue,
  passacaglia,
  chaconne,
  fugue,
  chorale,
  toccata,
  overture,
  aria,
  pavane,
  sonata,
  rondo,
  adagio,
  scherzo,
  march,
  nocturne,
  waltz,
  mazurka,
  polonaise,
  barcarolle,
  berceuse,
  etude,
  lacrimosa,
  prelude,
};

export const STYLE_IDS = Object.keys(STYLES);

export function getStyle(id: string): Style {
  const s = STYLES[id];
  if (!s) throw new Error(`Unknown style "${id}". Known: ${STYLE_IDS.join(', ')}`);
  return s;
}
