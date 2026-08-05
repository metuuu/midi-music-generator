/**
 * The R&B catalogue, 1960–2002.
 *
 * Organised by **what is holding the backbeat and what is sweetening it**, which
 * is the axis `eras.ts` runs on and is the only one that keeps twenty-four styles
 * apart. Sort this repertoire by tempo and it collapses into a fast half and a
 * slow half; sort it by key and it collapses into one, because almost all of it
 * is in a flat major. Sort it by *who is playing the two and the four, and who is
 * playing the thing on top* and the styles stay separate — a tambourine, a
 * delayed rimshot, eighteen violins, an SP-1200 and a loop somebody deliberately
 * failed to quantise are five different records about the same chord.
 *
 * ## The four things every table below is made of
 *
 * **The backbeat is an object, not a beat.** Every style here puts something on
 * slots 4 and 12 and the interesting question is always *what*. `sd` alone is a
 * bar band. `sd` doubled by `tb` is Detroit and it is the single most identifying
 * sound in this genre — a tambourine on two and four, played by a person standing
 * next to the drummer, on a startling proportion of the records everybody knows.
 * `cp` doubling it is 1989. `rim` instead of it is a ballad. That voice did not
 * exist when the earlier genres in this project were written; half of what
 * follows is written around the fact that it does now.
 *
 * **The bass is a function, not a shape**, and this is the sharpest disagreement
 * with the genre next door. Funk's file argues at length that every riff in it is
 * spelled in *semitones from the chord root, taken literally*, because a funk bass
 * line is a shape and a shape that renegotiated with each chord would stop being
 * one. That is correct there and it is exactly wrong here. A Motown bass part is a
 * countermelody: it outlines the chord it is standing on, it moves when the
 * harmony moves, and it arrives at the next chord by step or by approach note. So
 * the tables below spell `root`, `third`, `fifth`, `seventh` and `approach`, which
 * is `BassTone`'s named half — and the four styles that do use numbers
 * (`funksoul`, `newjack`, `hiphopsoul`, `offgrid`) are exactly the four with one
 * foot in the other genre. One field, two genres, opposite defaults, and the
 * argument for each is the same argument read from the other end.
 *
 * **The comp plays on the offbeat and the guitar plays on the backbeat.** The
 * piano and the Rhodes here are eighth-note instruments filling between the beats;
 * the guitar is a single chord on 4 and 12 with nothing else in the bar, which is
 * a part almost nobody notices and everybody would miss. Where a style has both,
 * the tables carry two comp patterns and let the draw decide which band this is.
 *
 * **The strings are a layer, not an ornament.** Six styles below would be
 * unrecognisable without the pad and none of them declares `requireLayers`, which
 * is deliberate and is the whole of how this genre uses `Chart.exits` — see the
 * section on it in `index.ts`. A required layer is one an arrangement may never
 * take away, and *taking the strings away for the last chorus* is the commonest
 * gesture in this repertoire.
 *
 * ## What is uniform across all twenty-four, and why
 *
 *  - **`relativeMajorChorus` is 0 or near it everywhere.** The melancholy-verse,
 *    hopeful-chorus lift is an iskelmä move and this music does not make it; what
 *    it does instead is take the *whole last chorus* up a semitone, which is
 *    `EraProfile.keyChangeChance` and is the highest in the project. Those are two
 *    different gestures and only one of them is here.
 *  - **`syncopation` is between 0.35 and 0.6** — well under funk's floor of 0.55
 *    and well over a dance band's. A soul phrase pushes into the barline about
 *    half the time, which is what makes it sung rather than played, and a phrase
 *    that pushed every time would be a funk phrase with a singer on it.
 *  - **`swing` is 0 in fifteen of the twenty-four**, 0.33 in the four built on
 *    triplets, and small elsewhere. The engine's swing delays the second *eighth*
 *    of each beat, which is exactly right for a 12/8 ballad and is a known
 *    approximation for `newjack`, where the shuffle is on the sixteenth. That
 *    compromise is written down where it is made rather than here.
 *  - **Two chords is not a lot.** This is the other end of the axis from funk,
 *    where a one-chord verse is the norm. Almost every table below moves at least
 *    once a bar, most of them have a genuine cadence, and four of them have more
 *    harmony in eight bars than that whole genre has in a side. It is why
 *    `scaleForChord` in `index.ts` has something to decide.
 *
 * ## `ghosts`, and the three styles it changes rather than decorates
 *
 * `DrumPattern.ghosts` arrived with this genre's brief and three tables below are
 * substantially made of it. A new jack kit is a hard machine snare on 4 and 12
 * with four ghosted strokes packed around each one — that is not a shading of the
 * figure, it *is* the figure, and written as loud strokes it comes out as a
 * sixteenth-note snare roll. A boom-bap kit is the same claim at half the tempo.
 * A neo-soul kit is the same claim again with the ghosts moved a sixteenth off
 * where a machine would put them.
 *
 * The three of them also demonstrate the composition rule the field documents:
 * `newjack` writes both neighbours of each backbeat and so absorbs a drawn
 * `Feel.ghost` entirely, while `neosoul` writes only the `a` and leaves the `e`
 * for a feel to complete. That is deliberate and it is the difference between a
 * machine that has been programmed thoroughly and a loop somebody is playing
 * along with.
 */

import { makeScale } from '../../core/scale.js';
import type { Chord } from '../../core/chord.js';
import type { Scale } from '../../core/scale.js';
import type { Style } from '../../style/types.js';

/**
 * The chord-following rule, for the four styles whose harmony is the content.
 *
 * `index.ts` argues the genre's own answer at length and the short version is
 * that it re-orients onto a chord *only when the chord has left the key* — which
 * is the honest description of a repertoire whose two halves differ in exactly
 * that input. Four styles override it, and they override it in the direction of
 * always re-orienting, because in quiet-storm and neo-soul harmony a diatonic
 * `IVmaj9` is not a passing chord on the way somewhere: it is a colour the player
 * has gone to and is sitting on, and a line that stayed in the key over it would
 * be describing the key rather than the chord.
 *
 * It is jazz's table with four deliberate differences, and each is a place this
 * music and that one genuinely part company:
 *
 *  - **`min7` and `min9` take dorian**, as they do in jazz, and `min11` takes it
 *    too rather than being treated as a suspension. A `min11` here is a vamp
 *    chord, the eleventh is in the voicing rather than resolving out of it, and
 *    dorian is the scale with the sixth that makes it sound like this music
 *    instead of like a modal jazz tune.
 *  - **`maj7` and `maj9` take lydian rather than major.** The raised fourth over
 *    a static major seventh is the one extension this end of the repertoire is
 *    actually reaching for — it is what a neo-soul Rhodes voicing has in it — and
 *    plain major over a chord held for two bars keeps landing on the natural
 *    fourth, which is the avoid note the chord was chosen to escape.
 *  - **A plain major triad takes mixolydian**, which looks like the strangest
 *    entry here and is the one that does the most work. In this repertoire a
 *    major triad that reaches this function at all is a *borrowed* one — the
 *    ♭VII off a Memphis side, the ♭VI at the top of a gospel turnaround, the IV
 *    over a minor tonic — and mixolydian is the parent scale of every one of
 *    them. The arithmetic is worth checking because it is the whole argument:
 *    mixolydian on the ♭VII of a major key **is** mixolydian on the tonic;
 *    mixolydian on the ♭VI of a minor key **is** aeolian on the tonic; and
 *    mixolydian on a major IV over a minor tonic **is** dorian on the tonic.
 *    Three borrowings, three correct answers, one line. Plain major would have
 *    given the last of those the parallel major's leading tone, which is a
 *    different genre entirely.
 *  - **A dominant takes mixolydian and not the altered scale**, whatever its
 *    alterations say. An altered dominant in this music is a passing colour under
 *    a singer rather than a place to improvise, and the bebop answer would put a
 *    line outside the key for a bar in a genre that never goes there.
 */
export function chordScale(chord: Chord): Scale {
  switch (chord.quality) {
    case 'maj7': case 'maj9':
      return makeScale(chord.root, 'lydian');
    case 'min7': case 'min9': case 'min11': case 'min6': case 'min': case 'minmaj7':
      return makeScale(chord.root, 'dorian');
    case 'halfdim7':
      return makeScale(chord.root, 'locrian');
    case 'dim7': case 'dim':
      return makeScale(chord.root, 'diminished');
    default:
      // Every major triad, every dominant and every suspension, altered or not.
      // See the third and fourth entries above — this default is doing far more
      // work than a default usually should, and on purpose.
      return makeScale(chord.root, 'mixolydian');
  }
}

// ---------------------------------------------------------------------------
// 1965 — Detroit and Memphis
// ---------------------------------------------------------------------------

/**
 * MOTOWN — the assembly line, and the centre of the genre.
 *
 * A four-piece rhythm section playing a pop song, with a tambourine on the two
 * and the four and a horn section answering the vocal. Everything about it is
 * *written*: the bass part, the string line, the answer figure, the running order
 * of the sections. That is the thing to get right, because it is the exact
 * opposite of what the genre next door is doing with the same instruments in the
 * same decade — a JB side is a band agreeing on a groove and a Detroit side is
 * eight people reading.
 *
 * **The tambourine is the style.** `tb` on 4 and 12, doubling the snare, in every
 * one of the three kit tables below and in the fill palette behind them. It is a
 * voice that did not exist in this project until recently and this is the style
 * that most obviously could not be written without it: on `sh` it came out as a
 * dry rush with no metal in it, which is a shaker, and a shaker on the backbeat
 * is a completely different record.
 *
 * **Four on the floor, felt rather than heard.** `bd` on all four beats is in two
 * of the three kits and it is not a disco kick — it is a soft pulse under a loud
 * backbeat, which is why the velocity table leaves slots 4 and 12 well above it.
 * A generator that mixed this the other way round would produce a 1977 record
 * fourteen years early.
 *
 * The bass is the reason this style is `root`/`third`/`fifth`/`approach` rather
 * than numbers. Every eighth is a chord tone of whatever is sounding, the bar
 * before a change ends on an approach note, and the whole part re-outlines itself
 * every time the harmony moves. See the file header.
 */
const motown: Style = {
  id: 'motown',
  label: 'Motown',
  description:
    'The assembly line: a written bass countermelody, a tambourine on two and four, four on the floor felt rather than heard, and horns answering the vocal.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [116, 134],
  swing: 0,
  modeWeights: { minor: 0.15, major: 0.85 },
  relativeMajorChorus: 0,
  /**
   * The chorus is meant to be the same tune every time, and this is the style
   * where that is most literally true — the arrangement was written down, the
   * band read it, and the second chorus is the first chorus. `earworm` is the
   * honest setting and it is the same one funk's one-chord vamp takes, arrived at
   * from the opposite direction: there because there is nothing underneath to
   * hold the record together, here because somebody already did.
   */
  hook: 'earworm',
  transitions: [['fill', 6], ['shot', 3], ['elide', 2]],
  shots: [[[0, 6], 5], [[0, 4, 12], 3], [[0, 6, 10], 2]],
  progressions: {
    intro: [
      { chords: ['I', 'I', 'IV', 'V'], weight: 5 },
      { chords: ['I', 'vi', 'IV', 'V'], weight: 4 },
    ],
    verse: [
      { chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'IV', 'V'], weight: 6, note: 'The four chords the whole label was built on, twice round' },
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'V', 'I', 'V'], weight: 4 },
      { chords: ['I', 'iii', 'IV', 'V', 'I', 'iii', 'IV', 'V'], weight: 4, note: 'The iii is the Detroit substitution — a vi with the roof raised' },
      { chords: ['I', 'IV', 'ii', 'V', 'I', 'IV', 'ii', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'I', 'vi', 'IV', 'V', 'I', 'I'], weight: 6, note: 'The chorus starts on IV, which is why it sounds like it has arrived from somewhere' },
      { chords: ['I', 'IV', 'I', 'IV', 'ii', 'V', 'I', 'I'], weight: 4 },
      { chords: ['IV', 'I', 'IV', 'I', 'IV', 'V', 'I', 'V'], weight: 3 },
    ],
    bridge: [
      { chords: ['vi', 'iii', 'IV', 'I', 'vi', 'ii', 'V', 'V'], weight: 5 },
      { chords: ['IV', 'iii', 'ii', 'V/V', 'V', 'V', 'V', 'V'], weight: 3, note: 'The one applied dominant in the style, and it is the door into the last chorus' },
    ],
    solo: [
      { chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'IV', 'V'], weight: 6 },
      { chords: ['IV', 'V', 'I', 'vi', 'IV', 'V', 'I', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['I', 'IV', 'I', 'IV'], weight: 5 },
      { chords: ['IV', 'V', 'I', 'I'], weight: 4 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'VI', 'iv', 'V', 'i', 'VI', 'iv', 'V'], weight: 5 },
      { chords: ['i', 'i', 'VII', 'VI', 'i', 'i', 'V', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv', 'V', 'i', 'VI', 'iv', 'V', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'V'], weight: 3 },
    ],
    bridge: [{ chords: ['VI', 'III', 'iv', 'i', 'VI', 'ii%7', 'V', 'V'], weight: 4 }],
    solo: [{ chords: ['i', 'VI', 'iv', 'V', 'i', 'VI', 'iv', 'V'], weight: 5 }],
    outro: [{ chords: ['iv', 'V', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [-4, 12], weight: 3 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  bass: [
    /**
     * The countermelody. Eight eighths, every one of them a chord tone, and the
     * bar ending on an approach note into whatever is next — which is the whole
     * of why this style spells functions rather than semitones. Nothing here is a
     * shape; it is a second tune that happens to be at the bottom.
     */
    {
      name: 'countermelody',
      weight: 6,
      hits: [
        { at: 0, dur: 2, tone: 'root', vel: 1 },
        { at: 2, dur: 2, tone: 'fifth', vel: 0.7 },
        { at: 4, dur: 2, tone: 'octave', vel: 0.82 },
        { at: 6, dur: 2, tone: 'fifth', vel: 0.68 },
        { at: 8, dur: 2, tone: 'root', vel: 0.86 },
        { at: 10, dur: 2, tone: 'third', vel: 0.7 },
        { at: 12, dur: 2, tone: 'fifth', vel: 0.78 },
        { at: 14, dur: 2, tone: 'approach', vel: 0.72 },
      ],
    },
    // The plainer half of the catalogue: quarters, with the bar still turned over
    // by an approach note. What a Detroit date sounded like on a slow number.
    {
      name: 'walking-quarters',
      weight: 4,
      hits: [
        { at: 0, dur: 4, tone: 'root', vel: 1 },
        { at: 4, dur: 4, tone: 'third', vel: 0.75 },
        { at: 8, dur: 4, tone: 'fifth', vel: 0.85 },
        { at: 12, dur: 2, tone: 'octave', vel: 0.72 },
        { at: 14, dur: 2, tone: 'approach', vel: 0.7 },
      ],
    },
    // The busiest of the three and the one with the hole in it: the rest on the
    // downbeat of the second half is what makes the part sound played rather
    // than typed.
    {
      name: 'skipping',
      weight: 4,
      hits: [
        { at: 0, dur: 2, tone: 'root', vel: 1 },
        { at: 3, dur: 1, tone: 'root', vel: 0.62 },
        { at: 4, dur: 2, tone: 'fifth', vel: 0.8 },
        { at: 6, dur: 2, tone: 'octave', vel: 0.7 },
        { at: 10, dur: 2, tone: 'fifth', vel: 0.8 },
        { at: 12, dur: 2, tone: 'third', vel: 0.75 },
        { at: 14, dur: 2, tone: 'approach', vel: 0.7 },
      ],
    },
  ],
  comp: [
    // The piano, filling between the beats. Two of them on the real dates, which
    // is what `voices: 4` is standing in for.
    {
      name: 'offbeat-piano',
      weight: 6,
      voices: 4,
      hits: [
        { at: 2, dur: 2, vel: 0.72 }, { at: 6, dur: 2, vel: 0.66 },
        { at: 10, dur: 2, vel: 0.72 }, { at: 14, dur: 2, vel: 0.66 },
      ],
    },
    // The guitar: one chord on the two and one on the four, and nothing else in
    // the bar. Almost nobody notices this part and everybody would miss it.
    {
      name: 'backbeat-chop',
      weight: 5,
      voices: 3,
      hits: [{ at: 4, dur: 2, vel: 0.8 }, { at: 12, dur: 2, vel: 0.8 }],
    },
    {
      name: 'eighths',
      weight: 3,
      voices: 3,
      hits: [
        { at: 0, dur: 2, vel: 0.6 }, { at: 2, dur: 2, vel: 0.7 },
        { at: 4, dur: 2, vel: 0.62 }, { at: 6, dur: 2, vel: 0.7 },
        { at: 8, dur: 2, vel: 0.6 }, { at: 10, dur: 2, vel: 0.7 },
        { at: 12, dur: 2, vel: 0.62 }, { at: 14, dur: 2, vel: 0.7 },
      ],
    },
  ],
  drums: [
    /**
     * The assembly line. Four on the floor under a backbeat that is a snare and
     * a tambourine hitting together, and the tambourine is the half a listener
     * actually identifies the label by.
     */
    {
      name: 'assembly-line',
      weight: 6,
      voices: {
        bd: [0, 4, 8, 12],
        sd: [4, 12],
        tb: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
      },
    },
    // The tambourine in eighths instead, which is the other half of the
    // catalogue and reads as faster without anything getting faster.
    {
      name: 'eighth-tambourine',
      weight: 5,
      voices: {
        bd: [0, 6, 8, 14],
        sd: [4, 12],
        tb: [0, 2, 4, 6, 8, 10, 12, 14],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
      },
    },
    // Hand claps beside the tambourine, which is the sound of a room with more
    // people in it than the band.
    {
      name: 'clap-and-tambourine',
      weight: 4,
      voices: {
        bd: [0, 4, 8, 12],
        sd: [4, 12],
        cp: [4, 12],
        tb: [2, 6, 10, 14],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
      },
    },
  ],
  melody: { leap: 0.24, ornament: 0.2, span: 12, sequence: 0.4, syncopation: 0.4 },
};

/**
 * STAX — Memphis, and the argument with Detroit.
 *
 * Four people and a horn section in a converted cinema, playing a part each and
 * leaving the rest of the bar alone. Everything Detroit adds, this takes away:
 * no strings, no tambourine, no second piano, no written bass part, and a
 * drummer whose entire contribution is that he does not do anything.
 *
 * **The backbeat is late and that is the style.** Al Jackson's snare sits behind
 * the beat by an amount nobody has ever agreed on and everybody can hear, which
 * is precisely what `Feel.pocket` is — `push: { bass: -12, sd: 18 }`, the bass
 * eight milliseconds early and the snare eighteen late. That feel was in the
 * library and had no genre asking for it by name; this is the style it describes.
 *
 * **`rim` at real weight**, which almost nothing else in this genre does. A
 * cross-stick on the backbeat under a verse and a full snare when the horns come
 * in is a two-state dynamic scheme played by one drummer with one hand, and it is
 * how these records get louder without anybody speeding up.
 *
 * The harmony is the other half of the argument. Detroit writes `I vi IV V` and
 * Memphis writes `I` and `IV` and occasionally `♭VII`, which is a modal answer
 * rather than a functional one and is the point at which this style leans across
 * the fence towards the genre next door.
 */
const stax: Style = {
  id: 'stax',
  label: 'Memphis soul',
  description:
    'Four people in a converted cinema: a late backbeat, a guitar playing one chord a bar, no strings and no tambourine, and horns that arrive like a door opening.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [96, 118],
  swing: 0.1,
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0,
  /**
   * The feel this style is named by. `pocket` puts the snare eighteen
   * milliseconds behind the grid and pulls the bass eight in front of it, which
   * is the whole of what a Memphis rhythm section sounds like and is otherwise
   * inexpressible — a slot index cannot be late.
   */
  feels: [['pocket', 6], ['straight', 3], ['laidback', 2]],
  transitions: [['fill', 5], ['shot', 4], ['break', 2]],
  shots: [[[0, 6, 12], 4], [[0, 6], 4], [[6, 12], 2]],
  progressions: {
    intro: [
      { chords: ['I', 'I', 'IV', 'IV'], weight: 5 },
      { chords: ['I', 'bVII', 'IV', 'I'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'IV', 'IV'], weight: 6, note: 'Two chords in eight bars, which for this genre is austerity' },
      { chords: ['I', 'IV', 'I', 'IV', 'I', 'IV', 'I', 'V'], weight: 5 },
      { chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'IV', 'IV'], weight: 4, note: 'The ♭VII is the modal answer, and it is where Memphis leans across into funk' },
      { chords: ['I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7'], weight: 3, note: 'Straight off the blues shelf, which is a mile from the studio' },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'IV', 'IV', 'I', 'V'], weight: 6 },
      { chords: ['bVII', 'IV', 'I', 'I', 'bVII', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['IV', 'V', 'I', 'vi', 'IV', 'V', 'I', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['IV', 'IV', 'IV', 'IV', 'V', 'V', 'V', 'V'], weight: 5 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'V', 'V', 'V', 'V'], weight: 3 },
    ],
    solo: [
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'IV', 'IV'], weight: 6 },
      { chords: ['I7', 'I7', 'IV7', 'IV7', 'I7', 'V7', 'I7', 'I7'], weight: 3 },
    ],
    outro: [{ chords: ['I', 'IV', 'I', 'IV'], weight: 5 }, { chords: ['bVII', 'IV', 'I', 'I'], weight: 3 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'iv', 'iv'], weight: 6 },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['VII', 'VI', 'i', 'i', 'VII', 'VI', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'iv', 'iv', 'V', 'V', 'V', 'V'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'iv', 'iv'], weight: 5 }],
    outro: [{ chords: ['VII', 'iv', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 8], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 4, 8], weight: 4 },
    { cell: [6, 2, 8], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [-4, 2, 2, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [-6, 2, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [-8, 8], weight: 2 },
  ],
  bass: [
    // Root and fifth with two thirds of the bar empty. This is a part written by
    // somebody who could hear the drummer and decided not to compete.
    {
      name: 'holes',
      weight: 6,
      hits: [
        { at: 0, dur: 4, tone: 'root', vel: 1 },
        { at: 6, dur: 2, tone: 'root', vel: 0.72 },
        { at: 8, dur: 4, tone: 'fifth', vel: 0.82 },
        { at: 14, dur: 2, tone: 'approach', vel: 0.7 },
      ],
    },
    {
      name: 'memphis-eighths',
      weight: 4,
      hits: [
        { at: 0, dur: 2, tone: 'root', vel: 1 },
        { at: 2, dur: 2, tone: 'root', vel: 0.66 },
        { at: 4, dur: 2, tone: 'fifth', vel: 0.8 },
        { at: 8, dur: 2, tone: 'root', vel: 0.85 },
        { at: 10, dur: 2, tone: 'seventh', vel: 0.68 },
        { at: 12, dur: 4, tone: 'fifth', vel: 0.78 },
      ],
    },
    // Two notes. The style at its most extreme, and there are famous records
    // where this is the entire bass part.
    {
      name: 'two-note',
      weight: 3,
      hits: [
        { at: 0, dur: 6, tone: 'root', vel: 1 },
        { at: 8, dur: 6, tone: 'fifth', vel: 0.8 },
      ],
    },
  ],
  comp: [
    // One chord on the backbeat and nothing else. Steve Cropper's whole part.
    {
      name: 'cropper-chop',
      weight: 6,
      voices: 3,
      hits: [{ at: 4, dur: 2, vel: 0.85 }, { at: 12, dur: 2, vel: 0.85 }],
    },
    {
      name: 'anticipated-chop',
      weight: 4,
      voices: 3,
      hits: [{ at: 3, dur: 3, vel: 0.85 }, { at: 11, dur: 3, vel: 0.82 }],
    },
    // The organ, holding. Booker T's other hand.
    {
      name: 'organ-hold',
      weight: 3,
      voices: 4,
      hits: [{ at: 0, dur: 8, vel: 0.55 }, { at: 8, dur: 8, vel: 0.5 }],
      sustain: true,
    },
  ],
  drums: [
    /**
     * The late backbeat, and a kick that plays twice a bar because the bass has
     * the rest of it. `ghosts` is deliberately absent from this table and from
     * the next one: a Memphis drummer's contribution is the strokes he *does not*
     * play, and a figure with ghosted sixteenths in it is a different city.
     */
    {
      name: 'jackson',
      weight: 6,
      voices: { bd: [0, 10], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14] },
    },
    // The cross-stick verse. One hand, two states, and the whole dynamic scheme
    // of the record.
    {
      name: 'cross-stick',
      weight: 4,
      voices: { bd: [0, 8], rim: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14] },
    },
    {
      name: 'pushed-kick',
      weight: 3,
      voices: { bd: [0, 6, 8], sd: [4, 12], hh: [0, 4, 8, 12], oh: [6, 14] },
    },
  ],
  melody: { leap: 0.26, ornament: 0.35, span: 12, sequence: 0.3, syncopation: 0.45 },
};

/**
 * DOO-WOP — the vocal group, and the oldest thing here.
 *
 * Twelve-eight, four chords, and five people standing round one microphone. It is
 * the style this genre grows out of rather than one of the things it grew into,
 * which is why it is here at all with a 1960 date on it — leave it out and the
 * catalogue starts in the middle of its own story.
 *
 * `swing: 0.33` is a full triplet and it is not a shuffle. The engine swings by
 * delaying the second eighth of each beat, which turns a straight eighth pair
 * into a triplet quarter and a triplet eighth — and that *is* 12/8, exactly and
 * not approximately. Four styles in this file use it and this is the one where
 * the equivalence is cleanest, because a doo-wop ballad has nothing on the
 * sixteenths at all.
 *
 * **The kit is barely there.** Brushes, which in this pack is `sh`, a kick on one
 * and three, and the backbeat on the rim. What is holding time on these records is
 * the piano's triplet, and the drum tables below are written to stay out of its
 * way.
 */
const doowop: Style = {
  id: 'doowop',
  label: 'Doo-wop',
  description:
    'Twelve-eight, four chords and five people round one microphone: a triplet piano, brushes, and the backbeat on the rim.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [64, 84],
  // A full triplet. See the header — with the engine's swing this is 12/8 rather
  // than an approximation of it.
  swing: 0.33,
  modeWeights: { minor: 0.15, major: 0.85 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  transitions: [['fill', 5], ['elide', 2]],
  progressions: {
    intro: [
      { chords: ['I', 'vi', 'IV', 'V'], weight: 6 },
      { chords: ['I', 'vi', 'ii', 'V'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'IV', 'V'], weight: 7, note: 'The changes, and there is genuinely no second answer' },
      { chords: ['I', 'vi', 'ii', 'V', 'I', 'vi', 'ii', 'V'], weight: 5, note: 'The ii for the IV, which is the only substitution this style admits' },
      { chords: ['I', 'iii', 'vi', 'IV', 'I', 'IV', 'V', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'V', 'I'], weight: 6 },
      { chords: ['IV', 'V', 'I', 'vi', 'IV', 'V', 'I', 'I'], weight: 4 },
    ],
    bridge: [
      { chords: ['IV', 'IV', 'I', 'I', 'ii', 'ii', 'V', 'V'], weight: 5 },
      { chords: ['vi', 'vi', 'ii', 'ii', 'V', 'V', 'V', 'V'], weight: 3 },
    ],
    solo: [{ chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'IV', 'V'], weight: 6 }],
    outro: [
      { chords: ['I', 'vi', 'IV', 'V'], weight: 5 },
      { chords: ['IV', 'iv', 'I', 'I'], weight: 3, note: 'The minor plagal, which is how every one of these actually stops' },
    ],
  },
  minorProgressions: {
    verse: [{ chords: ['i', 'VI', 'iv', 'V', 'i', 'VI', 'iv', 'V'], weight: 6 }],
    chorus: [{ chords: ['iv', 'V', 'i', 'VI', 'iv', 'V', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'VI', 'iv', 'V', 'i', 'VI', 'iv', 'V'], weight: 5 }],
    outro: [{ chords: ['iv', 'V', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 5 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [-8, 4, 4], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 4 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    // Two notes a bar, and on the real records it is a voice rather than an
    // instrument. Whole-bar roots with the fifth underneath the second half.
    {
      name: 'bass-voice',
      weight: 6,
      hits: [
        { at: 0, dur: 8, tone: 'root', vel: 1 },
        { at: 8, dur: 8, tone: 'fifth', vel: 0.8 },
      ],
    },
    {
      name: 'triplet-walk',
      weight: 4,
      hits: [
        { at: 0, dur: 4, tone: 'root', vel: 1 },
        { at: 4, dur: 4, tone: 'third', vel: 0.75 },
        { at: 8, dur: 4, tone: 'fifth', vel: 0.82 },
        { at: 12, dur: 4, tone: 'approach', vel: 0.72 },
      ],
    },
  ],
  comp: [
    // The triplet piano, which is the timekeeper. Every beat, subdivided by the
    // swing into the long-short pair that is the whole style.
    {
      name: 'triplet-piano',
      weight: 7,
      voices: 4,
      hits: [
        { at: 0, dur: 2, vel: 0.7 }, { at: 2, dur: 2, vel: 0.55 },
        { at: 4, dur: 2, vel: 0.72 }, { at: 6, dur: 2, vel: 0.55 },
        { at: 8, dur: 2, vel: 0.7 }, { at: 10, dur: 2, vel: 0.55 },
        { at: 12, dur: 2, vel: 0.72 }, { at: 14, dur: 2, vel: 0.55 },
      ],
    },
    {
      name: 'held-chords',
      weight: 3,
      voices: 4,
      hits: [{ at: 0, dur: 8, vel: 0.6 }, { at: 8, dur: 8, vel: 0.55 }],
    },
  ],
  drums: [
    // Brushes and a rim. Nothing here is trying to be heard.
    {
      name: 'brushes',
      weight: 6,
      voices: { bd: [0, 8], rim: [4, 12], sh: [0, 2, 4, 6, 8, 10, 12, 14] },
    },
    {
      name: 'shuffle-kit',
      weight: 4,
      voices: { bd: [0, 8], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14] },
    },
  ],
  melody: { leap: 0.2, ornament: 0.28, span: 11, sequence: 0.45, syncopation: 0.25 },
};

/**
 * GIRL GROUP — 1963, and the biggest beat in the file.
 *
 * A vocal group in front of a room full of musicians, recorded so that none of
 * them is separable from any of the others. The rhythm is the *baion* — a
 * Brazilian figure that arrived in New York by way of a bolero and stopped being
 * either — and it is the one drum pattern in this genre that is not a backbeat
 * with things added to it: `bd` on 0, 3 and 6, which is a tresillo, under a snare
 * that still lands on 4 and 12.
 *
 * **Castanets, tambourine and hand claps at once.** `tb` and `cp` are both in the
 * main table and both play every eighth in one of them, which anywhere else in
 * this project would be a mixing fault and here is the record: the percussion is
 * a *wall*, it has no individual voices in it, and the reason the snare has to be
 * as loud as it is under `drumMix` is that it is competing with six other things
 * hitting at the same time.
 *
 * The harmony is doo-wop's with the tempo doubled, which is the honest
 * description, so the tables are short and the differences from the style above
 * are all rhythmic.
 */
const girlgroup: Style = {
  id: 'girlgroup',
  label: 'Girl group',
  description:
    'The baion under a wall of percussion: castanets, tambourine and hand claps together, a snare fighting all three, and four chords going round.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [118, 138],
  swing: 0,
  modeWeights: { minor: 0.2, major: 0.8 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  transitions: [['fill', 6], ['shot', 2]],
  shots: [[[0, 3, 6], 5], [[0, 6], 3]],
  progressions: {
    intro: [{ chords: ['I', 'vi', 'IV', 'V'], weight: 5 }, { chords: ['vi', 'IV', 'I', 'V'], weight: 3 }],
    verse: [
      { chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'IV', 'V'], weight: 6 },
      { chords: ['I', 'I', 'vi', 'vi', 'IV', 'IV', 'V', 'V'], weight: 5, note: 'Two bars a chord, which at this tempo is the same four chords slowed down' },
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 3, note: 'Starting on the relative minor: the verse is sad and the chorus is not' },
    ],
    chorus: [
      { chords: ['I', 'IV', 'I', 'IV', 'I', 'IV', 'V', 'V'], weight: 6 },
      { chords: ['IV', 'V', 'I', 'I', 'IV', 'V', 'I', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'V', 'V', 'IV', 'IV', 'V', 'V'], weight: 5 }],
    solo: [{ chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'IV', 'V'], weight: 5 }],
    outro: [{ chords: ['I', 'IV', 'I', 'V'], weight: 5 }],
  },
  minorProgressions: {
    verse: [{ chords: ['i', 'i', 'VI', 'VI', 'iv', 'iv', 'V', 'V'], weight: 5 }],
    chorus: [{ chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'V'], weight: 5 }],
    solo: [{ chords: ['i', 'VI', 'iv', 'V', 'i', 'VI', 'iv', 'V'], weight: 4 }],
    outro: [{ chords: ['iv', 'V', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 4, 4, 4], weight: 4 },
    { cell: [3, 3, 2, 4, 4], weight: 4 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 4, 4], weight: 3 },
    { cell: [-4, 4, 8], weight: 3 },
    { cell: [6, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [-4, 12], weight: 2 },
  ],
  bass: [
    // The baion in the bass: the tresillo, doubled by the kick, and then the
    // second half of the bar walking back to it.
    {
      name: 'baion',
      weight: 6,
      hits: [
        { at: 0, dur: 3, tone: 'root', vel: 1 },
        { at: 3, dur: 3, tone: 'root', vel: 0.78 },
        { at: 6, dur: 2, tone: 'fifth', vel: 0.8 },
        { at: 8, dur: 4, tone: 'root', vel: 0.85 },
        { at: 12, dur: 4, tone: 'approach', vel: 0.72 },
      ],
    },
    {
      name: 'pounding-quarters',
      weight: 4,
      hits: [
        { at: 0, dur: 4, tone: 'root', vel: 1 },
        { at: 4, dur: 4, tone: 'root', vel: 0.78 },
        { at: 8, dur: 4, tone: 'fifth', vel: 0.84 },
        { at: 12, dur: 4, tone: 'root', vel: 0.78 },
      ],
    },
  ],
  comp: [
    {
      name: 'wall-eighths',
      weight: 6,
      voices: 4,
      hits: [
        { at: 0, dur: 2, vel: 0.72 }, { at: 2, dur: 2, vel: 0.62 },
        { at: 4, dur: 2, vel: 0.74 }, { at: 6, dur: 2, vel: 0.62 },
        { at: 8, dur: 2, vel: 0.72 }, { at: 10, dur: 2, vel: 0.62 },
        { at: 12, dur: 2, vel: 0.74 }, { at: 14, dur: 2, vel: 0.62 },
      ],
    },
    {
      name: 'baion-chords',
      weight: 4,
      voices: 4,
      hits: [{ at: 0, dur: 3, vel: 0.78 }, { at: 3, dur: 3, vel: 0.7 }, { at: 6, dur: 2, vel: 0.74 }, { at: 8, dur: 8, vel: 0.68 }],
    },
  ],
  drums: [
    /**
     * The wall. Kick on the tresillo, snare on the backbeat, and both the
     * tambourine and the claps playing eighths on top of each other — which is
     * the record rather than a mixing fault. See the header.
     */
    {
      name: 'baion-wall',
      weight: 6,
      voices: {
        bd: [0, 3, 6, 8, 11, 14],
        sd: [4, 12],
        cp: [4, 12],
        tb: [0, 2, 4, 6, 8, 10, 12, 14],
        hh: [0, 4, 8, 12],
      },
    },
    {
      name: 'stomp',
      weight: 4,
      voices: {
        bd: [0, 4, 8, 12],
        sd: [4, 12],
        tb: [4, 12],
        cp: [2, 6, 10, 14],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
      },
    },
  ],
  melody: { leap: 0.22, ornament: 0.18, span: 11, sequence: 0.5, syncopation: 0.35 },
};

/**
 * SOUTHERN SOUL — Muscle Shoals, 1967.
 *
 * A country rhythm section playing gospel changes behind a singer from a church,
 * which is a sentence that describes both the geography and the sound. It sits
 * between `stax` and `deepsoul` and it is not a blend of them: the tempo is
 * Memphis's, the harmony is the church's, and what neither of those has is the
 * *guitar* — a clean instrument playing arpeggiated triads against the organ,
 * which is the one thing on these records that comes from Nashville.
 *
 * `swing: 0.16` is the compromise this style is made of. It is not 12/8 and it is
 * not straight; the drummer is playing eighths with a lean on them, and half of
 * the argument about where the line between country and soul actually runs is an
 * argument about exactly this number.
 *
 * The `minor plagal` in the outro tables — `IV iv I` — is worth naming because it
 * turns up in four styles here and nowhere else in the project. Borrowing the
 * minor fourth on the way to the tonic is the church's cadence, it is what a
 * gospel organist does with the last four bars, and a genre that ended on `V I`
 * would be ending every record like a dance band.
 */
const southern: Style = {
  id: 'southern',
  label: 'Southern soul',
  description:
    'A country rhythm section playing gospel changes: a leaning eighth, an arpeggiated guitar against the organ, and the minor fourth on the way home.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [76, 96],
  swing: 0.16,
  modeWeights: { minor: 0.25, major: 0.75 },
  relativeMajorChorus: 0,
  feels: [['straight', 5], ['pocket', 4], ['laidback', 2]],
  transitions: [['fill', 6], ['shot', 2], ['break', 2]],
  shots: [[[0, 6], 4], [[0, 4, 8], 2]],
  progressions: {
    intro: [{ chords: ['I', 'IV', 'I', 'V'], weight: 5 }, { chords: ['I', 'I', 'IV', 'iv'], weight: 3 }],
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV'], weight: 6 },
      { chords: ['I', 'iii', 'IV', 'iv', 'I', 'vi', 'ii', 'V'], weight: 5, note: 'The borrowed minor fourth in bar four, which is the church arriving' },
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['I', 'V/IV', 'IV', 'iv', 'I', 'V', 'I', 'I'], weight: 3, note: 'The applied dominant into the fourth, which is a gospel organist’s reflex' },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'IV', 'iv', 'I', 'V'], weight: 6 },
      { chords: ['IV', 'V', 'I', 'vi', 'IV', 'V', 'I', 'I'], weight: 4 },
      { chords: ['I', 'IV', 'I', 'IV', 'V', 'IV', 'I', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['vi', 'vi', 'IV', 'IV', 'ii', 'ii', 'V', 'V'], weight: 5 },
      { chords: ['IV', 'iv', 'I', 'vi', 'ii', 'V', 'V', 'V'], weight: 3 },
    ],
    solo: [
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV'], weight: 5 },
      { chords: ['IV', 'IV', 'I', 'I', 'IV', 'iv', 'I', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['IV', 'iv', 'I', 'I'], weight: 6, note: 'The minor plagal. See the header — this is how a gospel organist stops' },
      { chords: ['I', 'IV', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'VI', 'V', 'V'], weight: 5 },
      { chords: ['i', 'VII', 'VI', 'V', 'i', 'VII', 'VI', 'V'], weight: 4 },
    ],
    chorus: [{ chords: ['iv', 'iv', 'i', 'i', 'VI', 'VII', 'i', 'V'], weight: 5 }],
    bridge: [{ chords: ['VI', 'VI', 'iv', 'iv', 'V', 'V', 'V', 'V'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'iv', 'iv', 'i', 'VI', 'V', 'V'], weight: 4 }],
    outro: [{ chords: ['iv', 'i', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 8], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [-2, 2, 4, 8], weight: 4 },
    { cell: [4, 2, 2, 8], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [-8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [-8, 8], weight: 2 },
  ],
  bass: [
    {
      name: 'shoals',
      weight: 6,
      hits: [
        { at: 0, dur: 4, tone: 'root', vel: 1 },
        { at: 6, dur: 2, tone: 'fifth', vel: 0.72 },
        { at: 8, dur: 4, tone: 'root', vel: 0.84 },
        { at: 12, dur: 2, tone: 'third', vel: 0.74 },
        { at: 14, dur: 2, tone: 'approach', vel: 0.7 },
      ],
    },
    {
      name: 'church-roots',
      weight: 4,
      hits: [
        { at: 0, dur: 8, tone: 'root', vel: 1 },
        { at: 8, dur: 4, tone: 'fifth', vel: 0.8 },
        { at: 12, dur: 4, tone: 'octave', vel: 0.74 },
      ],
    },
  ],
  comp: [
    // The Nashville half. A triad broken across the bar rather than struck, which
    // is the one thing on these records that is not from a church or a bar.
    {
      name: 'arpeggiated-guitar',
      weight: 5,
      voices: 3,
      hits: [
        { at: 0, dur: 2, vel: 0.7 }, { at: 2, dur: 2, vel: 0.6 },
        { at: 4, dur: 2, vel: 0.68 }, { at: 6, dur: 2, vel: 0.6 },
        { at: 8, dur: 2, vel: 0.7 }, { at: 10, dur: 2, vel: 0.6 },
        { at: 12, dur: 2, vel: 0.68 }, { at: 14, dur: 2, vel: 0.6 },
      ],
      arpeggio: true,
      arpDirection: 'updown',
    },
    {
      name: 'organ-pads',
      weight: 5,
      voices: 4,
      hits: [{ at: 0, dur: 16, vel: 0.55 }],
      sustain: true,
    },
    {
      name: 'church-piano',
      weight: 4,
      voices: 4,
      hits: [
        { at: 0, dur: 2, vel: 0.7 }, { at: 4, dur: 2, vel: 0.68 },
        { at: 6, dur: 2, vel: 0.58 }, { at: 8, dur: 2, vel: 0.7 },
        { at: 12, dur: 2, vel: 0.68 }, { at: 14, dur: 2, vel: 0.58 },
      ],
    },
  ],
  drums: [
    {
      name: 'leaning-eighths',
      weight: 6,
      voices: { bd: [0, 8, 11], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14] },
      ghosts: { sd: [7, 15] },
    },
    {
      name: 'rim-verse',
      weight: 4,
      voices: { bd: [0, 8], rim: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], tb: [4, 12] },
    },
  ],
  melody: { leap: 0.26, ornament: 0.45, span: 12, sequence: 0.3, syncopation: 0.4 },
};

/**
 * DEEP SOUL — the slow one at the bottom, and the first override.
 *
 * Fifty-eight beats a minute, twelve-eight, one singer and a band that has been
 * told to wait. This is the extreme of the whole repertoire in every direction
 * that matters: the slowest, the most decorated, the least harmonic movement per
 * bar, and the one style where the singer is audibly not following the chart.
 *
 * ## Why it overrides `scaleForChord`, and which direction
 *
 * The genre's rule re-orients onto a chord that has left the key and stays in the
 * key otherwise — which is the honest description of most of this catalogue and
 * is wrong here in one specific place. A deep-soul progression *does* leave the
 * key: the borrowed minor fourth, the ♭VII, the flat six under a held note. And
 * the singer does not follow any of them. What they are doing over those bars is
 * the same six notes they were doing over the tonic, which is the definition of a
 * blues singer working in front of a gospel band, and a line that dutifully
 * re-oriented onto each borrowing would be a line that had read the chart.
 *
 * So this fixes the scale to the tonic and never looks at the chord — the same
 * shape jazz's blues style takes and the same shape funk takes as its *default*,
 * reached here for a third reason. `majorBlues` in major, which is the scale this
 * genre's brief exists to spend, and `blues` proper in minor, where the ♭5 is
 * already a degree rather than a passing tone.
 *
 * **The one thing to watch, and the reason `augmented-second` is off.** In
 * `majorBlues` the step from the natural third to the fifth is three semitones and
 * so is the step from the sixth to the octave, and both would be vetoed at every
 * strictness level this genre ships at. `index.ts` disables the rule for the whole
 * genre; this is the style that would have been silently destroyed by it.
 */
const deepsoul: Style = {
  id: 'deepsoul',
  label: 'Deep soul',
  description:
    'Fifty-eight a minute in twelve-eight: one singer, a band told to wait, and a fixed blues scale dragged across every borrowed chord underneath.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [52, 70],
  swing: 0.33,
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0,
  /**
   * The line does not follow the chart. See the header for the whole argument;
   * the short version is that this singer is doing the same six notes over the
   * borrowed minor fourth as over the tonic, and that is the style rather than a
   * failure to re-orient.
   */
  scaleForChord: (tonic, mode) => makeScale(tonic, mode === 'minor' ? 'blues' : 'majorBlues'),
  // Loose, and it is the only slow style here that goes this far. A deep-soul
  // vocal is a different shape every time round, because the words have run out
  // and what is left is the singer.
  hook: 'loose',
  transitions: [['fill', 4], ['break', 4], ['shot', 2]],
  shots: [[[0], 5], [[0, 8], 3], [[0, 6], 2]],
  progressions: {
    intro: [{ chords: ['I', 'I', 'IV', 'iv'], weight: 5 }, { chords: ['I', 'I', 'I', 'I'], weight: 3 }],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 6, note: 'Four bars of one chord at 58 BPM is nearly a minute of nothing moving' },
      { chords: ['I', 'I', 'IV', 'iv', 'I', 'vi', 'ii', 'V'], weight: 5 },
      { chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'IV', 'IV'], weight: 4 },
      { chords: ['I', 'IV', 'I', 'I', 'IV', 'IV', 'I', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'IV', 'iv', 'I', 'I'], weight: 6 },
      { chords: ['IV', 'IV', 'iv', 'iv', 'I', 'I', 'V', 'I'], weight: 4 },
      { chords: ['bVI', 'bVII', 'I', 'I', 'bVI', 'bVII', 'I', 'I'], weight: 3, note: 'Both borrowed, and the line above stays exactly where it was' },
    ],
    bridge: [{ chords: ['IV', 'IV', 'IV', 'IV', 'V', 'V', 'V', 'V'], weight: 5 }],
    solo: [{ chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 5 }],
    outro: [
      { chords: ['IV', 'iv', 'I', 'I'], weight: 6 },
      { chords: ['I', 'I', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 6 },
      { chords: ['i', 'i', 'VI', 'VI', 'iv', 'iv', 'V', 'V'], weight: 4 },
    ],
    chorus: [{ chords: ['iv', 'iv', 'i', 'i', 'VI', 'V', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['iv', 'i', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-8, 8], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [-4, 4, 8], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    // One note a bar and a long one. What this player is contributing is the
    // decision not to fill any of it.
    {
      name: 'held-root',
      weight: 6,
      hits: [{ at: 0, dur: 12, tone: 'root', vel: 1 }, { at: 14, dur: 2, tone: 'approach', vel: 0.68 }],
      sustain: true,
    },
    {
      name: 'twelve-eight-walk',
      weight: 4,
      hits: [
        { at: 0, dur: 4, tone: 'root', vel: 1 },
        { at: 6, dur: 2, tone: 'fifth', vel: 0.7 },
        { at: 8, dur: 4, tone: 'octave', vel: 0.8 },
        { at: 12, dur: 4, tone: 'fifth', vel: 0.72 },
      ],
    },
  ],
  comp: [
    {
      name: 'triplet-church-piano',
      weight: 6,
      voices: 4,
      hits: [
        { at: 0, dur: 2, vel: 0.68 }, { at: 2, dur: 2, vel: 0.5 },
        { at: 4, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.5 },
        { at: 8, dur: 2, vel: 0.68 }, { at: 10, dur: 2, vel: 0.5 },
        { at: 12, dur: 2, vel: 0.7 }, { at: 14, dur: 2, vel: 0.5 },
      ],
    },
    {
      name: 'organ-wash',
      weight: 5,
      voices: 4,
      hits: [{ at: 0, dur: 16, vel: 0.5 }],
      sustain: true,
      voicing: 'spread',
    },
  ],
  drums: [
    // Nothing but the backbeat and a soft kick. At this tempo the kit's job is to
    // say where the bar is and then get out.
    {
      name: 'twelve-eight',
      weight: 6,
      voices: { bd: [0, 8], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14] },
      ghosts: { sd: [7, 15] },
    },
    {
      name: 'toms-under',
      weight: 3,
      voices: { bd: [0, 8], sd: [4, 12], lt: [6, 14], sh: [0, 2, 4, 6, 8, 10, 12, 14] },
    },
  ],
  melody: { leap: 0.3, ornament: 0.7, span: 14, sequence: 0.15, syncopation: 0.35 },
};

/**
 * GOSPEL SOUL — six-eight, and the only asymmetric bar in the genre.
 *
 * `beatsPerBar: 3` with `beatUnit: 8` and `groups: [6, 6]`, which is twelve
 * sixteenths in two dotted-quarter groups: the church 6/8, the thing a
 * congregation claps on, and the metre every other style here is a
 * straightening-out of. It has to be declared rather than swung, and the reason is
 * the one `Style.groups` states — `metricStrength` computes accent from slot
 * arithmetic and would put a half-bar accent in the wrong place, so the grouping
 * is a compositional fact and not a derivable one.
 *
 * **The claps are on the groups and the tambourine is on the offbeats.** That
 * inversion is the whole rhythmic character: a congregation claps on 0 and 6, and
 * the person with the tambourine plays *between* them, which is why these records
 * feel like they are being pushed from behind rather than counted.
 *
 * Harmonically it is the most functional thing in the file — real cadences, real
 * secondary dominants, and the plagal `IV I` at the end of every section, because
 * that is what a hymn does. The one thing it does not have is a minor table
 * worth much: this music is in major, it is in major on purpose, and
 * `modeWeights` says so more strongly than anything else here.
 */
const gospelsoul: Style = {
  id: 'gospelsoul',
  label: 'Gospel soul',
  description:
    'Church six-eight: claps on the two dotted beats, a tambourine between them, an organ holding, and a plagal cadence at the end of everything.',
  beatsPerBar: 3,
  beatUnit: 8,
  // Two dotted quarters, twelve sixteenths. See the header — this cannot be
  // derived from the number 3 and a generator that tried would accent the middle
  // of the second group.
  groups: [6, 6],
  bpm: [70, 96],
  swing: 0,
  modeWeights: { minor: 0.08, major: 0.92 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  transitions: [['fill', 5], ['shot', 3], ['break', 2]],
  shots: [[[0, 6], 5], [[0, 4, 6], 3], [[0, 6, 9], 2]],
  progressions: {
    intro: [{ chords: ['I', 'IV', 'I', 'V'], weight: 5 }, { chords: ['I', 'V/IV', 'IV', 'I'], weight: 3 }],
    verse: [
      { chords: ['I', 'IV', 'I', 'V', 'I', 'IV', 'V', 'I'], weight: 6, note: 'A hymn, and it is not pretending to be anything else' },
      { chords: ['I', 'vi', 'ii', 'V', 'I', 'IV', 'V', 'I'], weight: 5 },
      { chords: ['I', 'V/IV', 'IV', 'iv', 'I', 'V', 'I', 'I'], weight: 4, note: 'The applied dominant and the borrowed fourth in four bars, which is an organist showing off' },
      { chords: ['I', 'I', 'IV', 'IV', 'V', 'V', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'I', 'IV', 'I', 'IV', 'V', 'I', 'I'], weight: 6, note: 'Plagal, four times, which is the shout' },
      { chords: ['I', 'IV', 'V', 'vi', 'IV', 'V', 'I', 'I'], weight: 4 },
      { chords: ['V/V', 'V', 'I', 'IV', 'V/V', 'V', 'I', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['vi', 'iii', 'IV', 'I', 'ii', 'V', 'I', 'I'], weight: 5 },
      { chords: ['IV', 'IV', 'V', 'V', 'V', 'V', 'V', 'V'], weight: 3 },
    ],
    solo: [{ chords: ['I', 'IV', 'I', 'V', 'I', 'IV', 'V', 'I'], weight: 5 }],
    outro: [
      { chords: ['IV', 'I', 'IV', 'I'], weight: 6 },
      { chords: ['IV', 'iv', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [{ chords: ['i', 'iv', 'i', 'V', 'i', 'iv', 'V', 'i'], weight: 5 }],
    chorus: [{ chords: ['iv', 'i', 'iv', 'i', 'iv', 'V', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'iv', 'i', 'V', 'i', 'iv', 'V', 'i'], weight: 4 }],
    outro: [{ chords: ['iv', 'i', 'iv', 'i'], weight: 4 }],
  },
  // Twelve sixteenths a bar. Every cell here sums to 12 rather than 16 and the
  // long ones are dotted quarters, which is what a hymn tune is made of.
  melodyCells: [
    { cell: [6, 6], weight: 5 },
    { cell: [4, 2, 6], weight: 5 },
    { cell: [2, 2, 2, 6], weight: 4 },
    { cell: [-2, 4, 6], weight: 4 },
    { cell: [6, 3, 3], weight: 3 },
    { cell: [3, 3, 6], weight: 3 },
    { cell: [-4, 2, 6], weight: 3 },
    { cell: [2, 2, 2, 2, 2, 2], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 6 },
    { cell: [-4, 8], weight: 4 },
    { cell: [6, 6], weight: 3 },
    { cell: [-6, 6], weight: 2 },
  ],
  bass: [
    {
      name: 'dotted-roots',
      weight: 6,
      hits: [
        { at: 0, dur: 6, tone: 'root', vel: 1 },
        { at: 6, dur: 4, tone: 'fifth', vel: 0.8 },
        { at: 10, dur: 2, tone: 'approach', vel: 0.72 },
      ],
    },
    {
      name: 'walking-six',
      weight: 4,
      hits: [
        { at: 0, dur: 2, tone: 'root', vel: 1 },
        { at: 2, dur: 2, tone: 'third', vel: 0.68 },
        { at: 4, dur: 2, tone: 'fifth', vel: 0.74 },
        { at: 6, dur: 2, tone: 'octave', vel: 0.82 },
        { at: 8, dur: 2, tone: 'fifth', vel: 0.7 },
        { at: 10, dur: 2, tone: 'approach', vel: 0.72 },
      ],
    },
  ],
  comp: [
    {
      name: 'organ-hymn',
      weight: 6,
      voices: 4,
      hits: [{ at: 0, dur: 6, vel: 0.66 }, { at: 6, dur: 6, vel: 0.62 }],
      sustain: true,
    },
    {
      name: 'gospel-piano',
      weight: 5,
      voices: 4,
      hits: [
        { at: 0, dur: 2, vel: 0.75 }, { at: 4, dur: 2, vel: 0.6 },
        { at: 6, dur: 2, vel: 0.72 }, { at: 8, dur: 2, vel: 0.58 },
        { at: 10, dur: 2, vel: 0.62 },
      ],
    },
  ],
  drums: [
    /**
     * The congregation on 0 and 6, the tambourine between them. See the header —
     * the inversion is the character, and a table that put both on the groups
     * would produce a march.
     */
    {
      name: 'congregation',
      weight: 6,
      voices: {
        bd: [0, 6],
        sd: [6],
        cp: [0, 6],
        tb: [3, 9],
        hh: [0, 2, 4, 6, 8, 10],
      },
    },
    {
      name: 'shout-band',
      weight: 4,
      voices: {
        bd: [0, 4, 6, 10],
        sd: [3, 9],
        cp: [3, 9],
        tb: [0, 2, 4, 6, 8, 10],
        hh: [0, 2, 4, 6, 8, 10],
      },
    },
  ],
  melody: { leap: 0.28, ornament: 0.55, span: 13, sequence: 0.35, syncopation: 0.3 },
};

/**
 * BLUE-EYED SOUL — the revue band, 1966.
 *
 * A show band playing this repertoire in a ballroom, with the shuffle turned up
 * and the horn section doing rather more than it needs to. It is the style that
 * exists because half the working bands playing soul in 1966 had learned it off
 * records and were performing it to people who had also learned it off records,
 * and what comes out of that is not a copy — it is louder, more arranged, and
 * about four BPM too fast.
 *
 * The one musical fact worth naming is `swing: 0.14` against `stax`'s 0.1 and
 * `motown`'s 0. A show band shuffles because a show band came out of a dance band,
 * and the horns' figures below are written on the eighths for the same reason.
 *
 * `brass` at the top of everything. This style's `shots` table is the largest in
 * the file and every entry is a section figure rather than a whole-band hit,
 * because the thing this band brought to the material was arranging it.
 */
const blueeyed: Style = {
  id: 'blueeyed',
  label: 'Blue-eyed soul',
  description:
    'A show band with the shuffle turned up: brass figures on every seam, a walking bass, and the whole thing about four BPM too fast.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [108, 132],
  swing: 0.14,
  modeWeights: { minor: 0.2, major: 0.8 },
  relativeMajorChorus: 0,
  transitions: [['fill', 5], ['shot', 5], ['elide', 2]],
  shots: [
    [[0, 6, 10], 5], [[0, 4, 6, 12], 4], [[0, 6], 4],
    [[0, 3, 6, 10], 3], [[6, 10, 12], 2],
  ],
  progressions: {
    intro: [{ chords: ['I', 'IV', 'V', 'V'], weight: 5 }, { chords: ['I', 'vi', 'ii', 'V'], weight: 3 }],
    verse: [
      { chords: ['I', 'vi', 'ii', 'V', 'I', 'vi', 'ii', 'V'], weight: 6 },
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'iii', 'IV', 'V', 'vi', 'IV', 'V', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'I', 'I', 'IV', 'V', 'I', 'V'], weight: 6 },
      { chords: ['I', 'IV', 'V', 'IV', 'I', 'IV', 'V', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['vi', 'ii', 'V', 'I', 'vi', 'ii', 'V', 'V'], weight: 5 }],
    solo: [{ chords: ['I', 'vi', 'ii', 'V', 'I', 'vi', 'ii', 'V'], weight: 5 }],
    outro: [{ chords: ['IV', 'V', 'I', 'I'], weight: 5 }],
  },
  minorProgressions: {
    verse: [{ chords: ['i', 'iv', 'V', 'i', 'i', 'iv', 'V', 'V'], weight: 5 }],
    chorus: [{ chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'V'], weight: 5 }],
    solo: [{ chords: ['i', 'iv', 'V', 'i', 'i', 'iv', 'V', 'V'], weight: 4 }],
    outro: [{ chords: ['iv', 'V', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  bass: [
    {
      name: 'showband-walk',
      weight: 6,
      hits: [
        { at: 0, dur: 4, tone: 'root', vel: 1 },
        { at: 4, dur: 4, tone: 'third', vel: 0.78 },
        { at: 8, dur: 4, tone: 'fifth', vel: 0.84 },
        { at: 12, dur: 4, tone: 'approach', vel: 0.76 },
      ],
    },
    {
      name: 'shuffle-eighths',
      weight: 4,
      hits: [
        { at: 0, dur: 2, tone: 'root', vel: 1 },
        { at: 2, dur: 2, tone: 'root', vel: 0.62 },
        { at: 4, dur: 2, tone: 'fifth', vel: 0.8 },
        { at: 6, dur: 2, tone: 'fifth', vel: 0.6 },
        { at: 8, dur: 2, tone: 'octave', vel: 0.82 },
        { at: 10, dur: 2, tone: 'fifth', vel: 0.62 },
        { at: 12, dur: 2, tone: 'third', vel: 0.76 },
        { at: 14, dur: 2, tone: 'approach', vel: 0.7 },
      ],
    },
  ],
  comp: [
    {
      name: 'showband-offbeats',
      weight: 6,
      voices: 4,
      hits: [
        { at: 2, dur: 2, vel: 0.78 }, { at: 6, dur: 2, vel: 0.7 },
        { at: 10, dur: 2, vel: 0.78 }, { at: 14, dur: 2, vel: 0.7 },
      ],
    },
    {
      name: 'guitar-shuffle',
      weight: 4,
      voices: 3,
      hits: [
        { at: 0, dur: 2, vel: 0.62 }, { at: 4, dur: 2, vel: 0.8 },
        { at: 8, dur: 2, vel: 0.62 }, { at: 12, dur: 2, vel: 0.8 },
      ],
    },
  ],
  drums: [
    {
      name: 'shuffle-backbeat',
      weight: 6,
      voices: { bd: [0, 8], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], tb: [4, 12] },
      ghosts: { sd: [3, 11] },
    },
    {
      name: 'ride-shuffle',
      weight: 3,
      voices: { bd: [0, 6, 8], sd: [4, 12], rd: [0, 2, 4, 6, 8, 10, 12, 14] },
    },
  ],
  melody: { leap: 0.3, ornament: 0.35, span: 13, sequence: 0.35, syncopation: 0.45 },
};

/**
 * STOMPER — the uptempo one, and the fastest thing here.
 *
 * A hundred and forty beats a minute, four on the floor, and a snare hit as hard
 * as the drummer can hit it. It is the corner of this repertoire that got played
 * for people who wanted to dance rather than for people who wanted to listen —
 * and, unusually for a style in this project, it was defined *after the fact* by
 * an audience on a different continent choosing which records went in the box.
 *
 * That is the reason it is a style rather than an era or a mood, and the reason
 * it is written the way it is: the harmony is `motown`'s, the horn writing is
 * `blueeyed`'s, and the only thing that is genuinely its own is what the drummer
 * and the bass player are doing, which is *not stopping*. The kick is on every
 * beat, the bass is on every eighth, the tambourine is on every eighth, and there
 * is not a hole anywhere in any of the tables below. `earworm` and a `sequence` of
 * 0.55 finish the argument: this is a record that repeats itself on purpose,
 * because it is being played to a floor and a floor needs to know what is coming.
 */
const stomper: Style = {
  id: 'stomper',
  label: 'Stomper',
  description:
    'A hundred and forty a minute with no holes in it: four on the floor, eighths in the bass, a tambourine throughout and a snare hit as hard as possible.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [128, 150],
  swing: 0,
  modeWeights: { minor: 0.25, major: 0.75 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['driving', 6], ['straight', 4]],
  transitions: [['fill', 7], ['shot', 3]],
  shots: [[[0, 4, 8, 12], 5], [[0, 6], 3], [[0, 6, 12], 2]],
  progressions: {
    intro: [{ chords: ['I', 'I', 'IV', 'V'], weight: 5 }],
    verse: [
      { chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'IV', 'V'], weight: 6 },
      { chords: ['I', 'I', 'IV', 'V', 'I', 'I', 'IV', 'V'], weight: 5 },
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'I', 'I', 'IV', 'V', 'I', 'I'], weight: 6 },
      { chords: ['I', 'IV', 'V', 'IV', 'I', 'IV', 'V', 'V'], weight: 4 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'V', 'V', 'IV', 'IV', 'V', 'V'], weight: 5 }],
    solo: [{ chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'IV', 'V'], weight: 5 }],
    outro: [{ chords: ['IV', 'V', 'I', 'I'], weight: 5 }],
  },
  minorProgressions: {
    verse: [{ chords: ['i', 'VI', 'VII', 'i', 'i', 'VI', 'VII', 'V'], weight: 5 }],
    chorus: [{ chords: ['iv', 'V', 'i', 'i', 'iv', 'V', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'VI', 'VII', 'i', 'i', 'VI', 'VII', 'V'], weight: 4 }],
    outro: [{ chords: ['iv', 'V', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 4, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [12, 4], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 2 },
  ],
  bass: [
    // Eighths, all sixteen halves of the bar, and no rest anywhere. The part is
    // relentless because the record is.
    {
      name: 'driving-eighths',
      weight: 7,
      hits: [
        { at: 0, dur: 2, tone: 'root', vel: 1 },
        { at: 2, dur: 2, tone: 'root', vel: 0.76 },
        { at: 4, dur: 2, tone: 'fifth', vel: 0.84 },
        { at: 6, dur: 2, tone: 'fifth', vel: 0.74 },
        { at: 8, dur: 2, tone: 'octave', vel: 0.88 },
        { at: 10, dur: 2, tone: 'fifth', vel: 0.74 },
        { at: 12, dur: 2, tone: 'third', vel: 0.8 },
        { at: 14, dur: 2, tone: 'approach', vel: 0.76 },
      ],
    },
    {
      name: 'octave-pump',
      weight: 4,
      hits: [
        { at: 0, dur: 2, tone: 'root', vel: 1 },
        { at: 2, dur: 2, tone: 'octave', vel: 0.76 },
        { at: 4, dur: 2, tone: 'root', vel: 0.84 },
        { at: 6, dur: 2, tone: 'octave', vel: 0.74 },
        { at: 8, dur: 2, tone: 'root', vel: 0.86 },
        { at: 10, dur: 2, tone: 'octave', vel: 0.74 },
        { at: 12, dur: 2, tone: 'root', vel: 0.82 },
        { at: 14, dur: 2, tone: 'approach', vel: 0.76 },
      ],
    },
  ],
  comp: [
    {
      name: 'hammered-eighths',
      weight: 6,
      voices: 4,
      hits: [
        { at: 0, dur: 2, vel: 0.7 }, { at: 2, dur: 2, vel: 0.76 },
        { at: 4, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.76 },
        { at: 8, dur: 2, vel: 0.7 }, { at: 10, dur: 2, vel: 0.76 },
        { at: 12, dur: 2, vel: 0.7 }, { at: 14, dur: 2, vel: 0.76 },
      ],
    },
    {
      name: 'offbeat-stabs',
      weight: 4,
      voices: 4,
      hits: [
        { at: 2, dur: 2, vel: 0.82 }, { at: 6, dur: 2, vel: 0.78 },
        { at: 10, dur: 2, vel: 0.82 }, { at: 14, dur: 2, vel: 0.78 },
      ],
    },
  ],
  drums: [
    {
      name: 'four-on-floor-stomp',
      weight: 7,
      voices: {
        bd: [0, 4, 8, 12],
        sd: [4, 12],
        tb: [0, 2, 4, 6, 8, 10, 12, 14],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
      },
    },
    {
      name: 'clap-stomp',
      weight: 4,
      voices: {
        bd: [0, 4, 8, 12],
        sd: [4, 12],
        cp: [4, 12],
        tb: [0, 2, 4, 6, 8, 10, 12, 14],
        oh: [2, 6, 10, 14],
      },
    },
  ],
  melody: { leap: 0.28, ornament: 0.18, span: 12, sequence: 0.55, syncopation: 0.4 },
};

/**
 * FUNK SOUL — 1970, and the one place this genre and the next one touch.
 *
 * A sixteenth-note bass figure under soul changes. That is the whole style and it
 * is a real and specific thing rather than a blend: by 1970 the bass players on
 * these records had heard what was happening two studios over and started playing
 * it, and the arrangers had not stopped writing `ii V I`. What comes out is a
 * record with a funk bottom and a soul top, which is most of what was on black
 * radio between 1970 and 1973.
 *
 * **The one style here that spells its bass in semitones.** See the file header:
 * every other table uses `BassTone`'s named functions because a soul bass part
 * renegotiates with each chord, and this one does not, because the figure is a
 * *shape* the player learned in one position and moves bodily. The `-2` is the
 * flat seventh below the root, taken literally, which over a `maj7` is a flat
 * seventh and not a leading tone — that is the point of the numeric spelling and
 * it is why the chorus tables below keep the harmony simple underneath it.
 *
 * `feels: funk` at real weight is the other half. The gesture the feel library
 * named after the genre next door belongs here too, and this is the style where
 * the two catalogues are describing the same afternoon.
 */
const funksoul: Style = {
  id: 'funksoul',
  label: 'Funk soul',
  description:
    'A sixteenth-note bass shape spelled in semitones under written soul changes: the funk bottom and the soul top, which is most of 1971.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [96, 116],
  swing: 0,
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0,
  feels: [['funk', 5], ['pocket', 4], ['straight', 3]],
  transitions: [['fill', 4], ['break', 4], ['shot', 3]],
  shots: [[[0, 6], 5], [[0, 3, 6], 3], [[0, 6, 7], 2]],
  progressions: {
    intro: [{ chords: ['I7', 'I7', 'IV7', 'IV7'], weight: 5 }, { chords: ['i7', 'i7', 'i7', 'i7'], weight: 3 }],
    verse: [
      { chords: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7'], weight: 6 },
      { chords: ['I7', 'I7', 'ii7', 'V7', 'I7', 'I7', 'ii7', 'V7'], weight: 5, note: 'The vamp and the cadence in one eight-bar unit, which is the style in a sentence' },
      { chords: ['I9', 'I9', 'IV9', 'IV9', 'I9', 'I9', 'V9', 'IV9'], weight: 4 },
      { chords: ['I7', 'bIII7', 'IV7', 'I7', 'I7', 'bIII7', 'IV7', 'I7'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV7', 'IV7', 'I7', 'I7', 'ii7', 'V7', 'I7', 'I7'], weight: 6 },
      { chords: ['bVII', 'IV', 'I7', 'I7', 'bVII', 'IV', 'I7', 'V7'], weight: 4 },
    ],
    bridge: [{ chords: ['IV7', 'IV7', 'IV7', 'IV7', 'V7', 'V7', 'V7', 'V7'], weight: 5 }],
    solo: [{ chords: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7'], weight: 5 }],
    outro: [{ chords: ['I7', 'IV7', 'I7', 'I7'], weight: 5 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 6 },
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'VI', 'VII', 'i7', 'i7'], weight: 4 },
    ],
    chorus: [{ chords: ['iv7', 'iv7', 'i7', 'i7', 'VI', 'VII', 'i7', 'i7'], weight: 5 }],
    bridge: [{ chords: ['iv7', 'iv7', 'iv7', 'iv7', 'V7', 'V7', 'V7', 'V7'], weight: 4 }],
    solo: [{ chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 5 }],
    outro: [{ chords: ['iv7', 'i7', 'i7', 'i7'], weight: 4 }],
  },
  melodyCells: [
    { cell: [3, 3, 2, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [-4, 2, 2, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    /**
     * Numbers, not functions, and the only place in this file where that is the
     * default. `-2` is the flat seventh *below* the root, taken literally, and
     * `3` is the minor third above it — a shape under one hand in one position,
     * moved bodily when the chord moves. See the file header for the argument and
     * `BassTone` for the same argument made from the other end.
     */
    {
      name: 'sixteenth-shape',
      weight: 6,
      hits: [
        { at: 0, dur: 2, tone: 0, vel: 1 },
        { at: 3, dur: 1, tone: 0, vel: 0.6 },
        { at: 6, dur: 2, tone: -2, vel: 0.78 },
        { at: 8, dur: 2, tone: 0, vel: 0.84 },
        { at: 11, dur: 1, tone: 3, vel: 0.66 },
        { at: 12, dur: 2, tone: 5, vel: 0.76 },
        { at: 14, dur: 2, tone: -2, vel: 0.7 },
      ],
    },
    {
      name: 'octave-and-seventh',
      weight: 4,
      hits: [
        { at: 0, dur: 3, tone: 0, vel: 1 },
        { at: 4, dur: 2, tone: 12, vel: 0.8 },
        { at: 7, dur: 1, tone: 10, vel: 0.62 },
        { at: 8, dur: 3, tone: 0, vel: 0.86 },
        { at: 12, dur: 2, tone: 7, vel: 0.76 },
        { at: 14, dur: 2, tone: 0, vel: 0.72 },
      ],
    },
    // The one function-spelled table here, for the bars where the changes
    // actually move. A draw between the two is a draw between two bands.
    {
      name: 'moving-changes',
      weight: 3,
      hits: [
        { at: 0, dur: 4, tone: 'root', vel: 1 },
        { at: 6, dur: 2, tone: 'seventh', vel: 0.72 },
        { at: 8, dur: 4, tone: 'fifth', vel: 0.82 },
        { at: 14, dur: 2, tone: 'approach', vel: 0.72 },
      ],
    },
  ],
  comp: [
    // The chank, borrowed. Sixteen slots with most of them damped, which is the
    // one figure this genre takes from the other wholesale.
    {
      name: 'chank',
      weight: 5,
      voices: 3,
      hits: [
        { at: 0, dur: 1, vel: 0.14 }, { at: 1, dur: 1, vel: 0.12 },
        { at: 2, dur: 1, vel: 0.7 }, { at: 3, dur: 1, vel: 0.14 },
        { at: 4, dur: 1, vel: 0.12 }, { at: 5, dur: 1, vel: 0.14 },
        { at: 6, dur: 1, vel: 0.75 }, { at: 7, dur: 1, vel: 0.12 },
        { at: 8, dur: 1, vel: 0.14 }, { at: 9, dur: 1, vel: 0.12 },
        { at: 10, dur: 1, vel: 0.7 }, { at: 11, dur: 1, vel: 0.14 },
        { at: 12, dur: 1, vel: 0.12 }, { at: 13, dur: 1, vel: 0.14 },
        { at: 14, dur: 1, vel: 0.75 }, { at: 15, dur: 1, vel: 0.12 },
      ],
    },
    {
      name: 'clav-figure',
      weight: 4,
      voices: 3,
      hits: [
        { at: 0, dur: 1, vel: 0.8 }, { at: 3, dur: 1, vel: 0.66 },
        { at: 6, dur: 1, vel: 0.74 }, { at: 8, dur: 1, vel: 0.7 },
        { at: 11, dur: 1, vel: 0.66 }, { at: 14, dur: 1, vel: 0.72 },
      ],
      cycle: 24,
    },
    {
      name: 'rhodes-offbeats',
      weight: 3,
      voices: 4,
      hits: [{ at: 2, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.66 }, { at: 11, dur: 2, vel: 0.7 }, { at: 14, dur: 2, vel: 0.66 }],
    },
  ],
  drums: [
    {
      name: 'sixteenth-kit',
      weight: 6,
      voices: {
        bd: [0, 6, 10],
        sd: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
        tb: [2, 6, 10, 14],
      },
      ghosts: { sd: [7, 11, 15] },
    },
    {
      name: 'open-hat-push',
      weight: 4,
      voices: {
        bd: [0, 3, 8, 11],
        sd: [4, 12],
        hh: [0, 2, 4, 8, 10, 12],
        oh: [6, 14],
      },
      ghosts: { sd: [2, 10] },
    },
  ],
  melody: { leap: 0.3, ornament: 0.3, span: 12, sequence: 0.35, syncopation: 0.55 },
};

// ---------------------------------------------------------------------------
// 1974 — Philadelphia, Chicago, and the disco hinge
// ---------------------------------------------------------------------------

/**
 * PHILLY — Sigma Sound, and the biggest arrangement in the project.
 *
 * A hi-hat playing sixteenths under a rhythm section that has been asked to be
 * quiet, and above it a string section, a horn section, a harp, a vibraphone and a
 * flute. It is the most people this generator ever puts on one record and the
 * reason it works is that they are not all playing at once — the whole art of the
 * style is *scoring*, which in this engine's terms is the layer plan and the
 * chart rather than anything in this table.
 *
 * **The hi-hat is the identifying object.** Sixteenths on a closed hat with the
 * pedal opening on the offbeat eighths, which is Earl Young's invention and which
 * turns into disco eighteen months later without anybody changing anything else.
 * Both kit tables below have it and the second one is already most of the way to
 * `discosoul`.
 *
 * **No `requireLayers`.** The strings are the identity of this style and they are
 * deliberately left strippable, which is the whole of how this genre uses
 * `Chart.exits`: a Philadelphia record whose last chorus drops the strings and
 * leaves the voice on the rhythm section is not a broken arrangement, it is the
 * single most reliable gesture in the repertoire. See `index.ts`.
 *
 * The harmony is the first place in this file where sevenths are the default
 * rather than a colour. `Imaj7`, `iii7`, `vi7`, `ii7` — every chord has four
 * notes in it, and the genre rule in `index.ts` still keeps the line in the key
 * over all of them, because they are all *in* the key. That is the rule doing
 * exactly what it should: extensions are not the same thing as leaving home.
 */
const philly: Style = {
  id: 'philly',
  label: 'Philly soul',
  description:
    'Sixteenths on a closed hat under a rhythm section told to be quiet, and a string section, a harp and a flute over the top of it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [108, 124],
  swing: 0,
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0,
  transitions: [['fill', 5], ['shot', 3], ['elide', 3]],
  shots: [[[0, 6], 4], [[0, 6, 10], 3], [[0, 4, 8, 12], 2]],
  progressions: {
    intro: [{ chords: ['Imaj7', 'Imaj7', 'ii7', 'V7'], weight: 5 }, { chords: ['vi7', 'ii7', 'V7', 'Imaj7'], weight: 3 }],
    verse: [
      { chords: ['Imaj7', 'iii7', 'IV', 'V7', 'Imaj7', 'iii7', 'IV', 'V7'], weight: 6 },
      { chords: ['Imaj7', 'vi7', 'ii7', 'V7', 'Imaj7', 'vi7', 'ii7', 'V7'], weight: 5 },
      { chords: ['IVmaj7', 'iii7', 'ii7', 'Imaj7', 'IVmaj7', 'iii7', 'ii7', 'V7'], weight: 4, note: 'The descending line, which is the arranger’s signature and the reason the strings have something to do' },
      { chords: ['vi7', 'V7', 'IVmaj7', 'iii7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 3 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'V7', 'iii7', 'vi7', 'IVmaj7', 'V7', 'Imaj7', 'Imaj7'], weight: 6 },
      { chords: ['Imaj7', 'IVmaj7', 'Imaj7', 'IVmaj7', 'ii7', 'V7', 'Imaj7', 'V7'], weight: 4 },
      { chords: ['ii7', 'V7', 'Imaj7', 'vi7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 3 },
    ],
    bridge: [
      { chords: ['vi7', 'ii7', 'V7', 'Imaj7', 'vi7', 'ii7', 'V7', 'V7'], weight: 5 },
      { chords: ['IVmaj7', 'iv', 'Imaj7', 'vi7', 'ii7', 'V7', 'V7', 'V7'], weight: 3 },
    ],
    solo: [{ chords: ['Imaj7', 'vi7', 'ii7', 'V7', 'Imaj7', 'vi7', 'ii7', 'V7'], weight: 5 }],
    outro: [{ chords: ['IVmaj7', 'V7', 'Imaj7', 'Imaj7'], weight: 5 }, { chords: ['ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 3 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'VImaj7', 'VImaj7', 'V7', 'V7'], weight: 5 },
      { chords: ['i7', 'VII', 'VImaj7', 'V7', 'i7', 'VII', 'VImaj7', 'V7'], weight: 4 },
    ],
    chorus: [{ chords: ['iv7', 'VII', 'IIImaj7', 'VImaj7', 'ii%7', 'V7', 'i7', 'i7'], weight: 5 }],
    bridge: [{ chords: ['VImaj7', 'VImaj7', 'ii%7', 'ii%7', 'V7', 'V7', 'V7', 'V7'], weight: 4 }],
    solo: [{ chords: ['i7', 'i7', 'iv7', 'iv7', 'VImaj7', 'VImaj7', 'V7', 'V7'], weight: 4 }],
    outro: [{ chords: ['iv7', 'V7', 'i7', 'i7'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 4, 8], weight: 5 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [4, 2, 2, 8], weight: 3 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    {
      name: 'philly-eighths',
      weight: 6,
      hits: [
        { at: 0, dur: 2, tone: 'root', vel: 1 },
        { at: 3, dur: 1, tone: 'root', vel: 0.6 },
        { at: 4, dur: 2, tone: 'fifth', vel: 0.8 },
        { at: 6, dur: 2, tone: 'octave', vel: 0.72 },
        { at: 8, dur: 2, tone: 'root', vel: 0.86 },
        { at: 11, dur: 1, tone: 'seventh', vel: 0.62 },
        { at: 12, dur: 2, tone: 'fifth', vel: 0.78 },
        { at: 14, dur: 2, tone: 'approach', vel: 0.72 },
      ],
    },
    {
      name: 'melodic-fills',
      weight: 4,
      hits: [
        { at: 0, dur: 4, tone: 'root', vel: 1 },
        { at: 6, dur: 2, tone: 'third', vel: 0.72 },
        { at: 8, dur: 2, tone: 'fifth', vel: 0.82 },
        { at: 10, dur: 2, tone: 'seventh', vel: 0.7 },
        { at: 12, dur: 2, tone: 'octave', vel: 0.78 },
        { at: 14, dur: 2, tone: 'approach', vel: 0.72 },
      ],
    },
  ],
  comp: [
    // The Rhodes, on the offbeats and barely there. The whole rhythm section on
    // these records is playing at about half the level a Memphis one is.
    {
      name: 'rhodes-offbeats',
      weight: 6,
      voices: 4,
      hits: [
        { at: 2, dur: 2, vel: 0.62 }, { at: 6, dur: 2, vel: 0.58 },
        { at: 10, dur: 2, vel: 0.62 }, { at: 14, dur: 2, vel: 0.58 },
      ],
    },
    // The guitar, sixteenths with a phaser on it. Written as a full bar of quiet
    // hits because that is what the part is — a texture rather than a rhythm.
    {
      name: 'phased-sixteenths',
      weight: 5,
      voices: 3,
      hits: [
        { at: 0, dur: 1, vel: 0.4 }, { at: 2, dur: 1, vel: 0.52 },
        { at: 4, dur: 1, vel: 0.44 }, { at: 6, dur: 1, vel: 0.54 },
        { at: 8, dur: 1, vel: 0.4 }, { at: 10, dur: 1, vel: 0.52 },
        { at: 12, dur: 1, vel: 0.44 }, { at: 14, dur: 1, vel: 0.54 },
      ],
    },
    {
      name: 'piano-triads',
      weight: 3,
      voices: 4,
      hits: [{ at: 0, dur: 4, vel: 0.6 }, { at: 6, dur: 2, vel: 0.55 }, { at: 8, dur: 4, vel: 0.58 }, { at: 14, dur: 2, vel: 0.55 }],
    },
  ],
  drums: [
    /**
     * Earl Young's hat. Sixteenths closed, with the pedal opening on the offbeat
     * eighths — the figure that becomes disco in eighteen months without anything
     * else on the record changing.
     */
    {
      name: 'sixteenth-hat',
      weight: 6,
      voices: {
        bd: [0, 8],
        sd: [4, 12],
        hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        oh: [2, 6, 10, 14],
      },
      ghosts: { sd: [7, 15] },
    },
    {
      name: 'four-on-floor-hat',
      weight: 4,
      voices: {
        bd: [0, 4, 8, 12],
        sd: [4, 12],
        hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        oh: [2, 6, 10, 14],
        tb: [2, 6, 10, 14],
      },
    },
  ],
  melody: { leap: 0.26, ornament: 0.35, span: 13, sequence: 0.35, syncopation: 0.4 },
};

/**
 * CHICAGO — Curtis Mayfield's band, 1972.
 *
 * The lightest thing in the file. A congas player, a guitar with a tremolo on it,
 * a flute, a bass playing high, and a singer in falsetto — and no horn section
 * doing anything loud, no drummer hitting anything hard, and a whole record that
 * sits at about half the level everything around it does.
 *
 * **This is where the sample rack earns its keep.** The kit tables below write
 * `lp`, `mp` and `hp` — the three conga strokes — beside a very restrained trap
 * kit, and `SAMPLE_RACKS.congas` maps those onto real recordings of a tumba, a
 * conga and a quinto at measured fundamentals of 138, 164 and 214 Hz. `eras.ts`
 * attaches the rack to almost every bank in the genre for the tambourine's sake;
 * this is the style that wanted the rest of it.
 *
 * The `cycle: 24` on the conga pattern is a bar and a half against a four-beat
 * bar, so the hand part arrives on a different beat every bar and comes back
 * round every three. That is what a percussionist playing under a band actually
 * does, and it is the difference between a conga part and a conga loop.
 */
const chicago: Style = {
  id: 'chicago',
  label: 'Chicago soul',
  description:
    'The lightest thing here: congas on a cycle that will not fit the bar, a tremolo guitar, a flute, and nobody hitting anything hard.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [92, 112],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  feels: [['straight', 5], ['laidback', 4], ['pocket', 2]],
  transitions: [['fill', 4], ['elide', 3], ['break', 2]],
  shots: [[[0, 6], 3], [[0, 3, 6], 2]],
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'IV', 'IV'], weight: 4 }, { chords: ['Imaj7', 'Imaj7', 'ii7', 'ii7'], weight: 4 }],
    verse: [
      { chords: ['Imaj7', 'Imaj7', 'ii7', 'ii7', 'Imaj7', 'Imaj7', 'ii7', 'V7'], weight: 6, note: 'Two chords rocking, which is the modal end of this style' },
      { chords: ['Imaj7', 'iii7', 'vi7', 'IVmaj7', 'Imaj7', 'iii7', 'ii7', 'V7'], weight: 5 },
      { chords: ['IVmaj7', 'Imaj7', 'IVmaj7', 'Imaj7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'V7', 'iii7', 'vi7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 5 },
      { chords: ['Imaj7', 'IVmaj7', 'Imaj7', 'IVmaj7', 'Imaj7', 'IVmaj7', 'V7', 'V7'], weight: 4 },
    ],
    bridge: [{ chords: ['vi7', 'vi7', 'ii7', 'ii7', 'IVmaj7', 'IVmaj7', 'V7', 'V7'], weight: 4 }],
    solo: [{ chords: ['Imaj7', 'Imaj7', 'ii7', 'ii7', 'Imaj7', 'Imaj7', 'ii7', 'V7'], weight: 5 }],
    outro: [{ chords: ['ii7', 'Imaj7', 'ii7', 'Imaj7'], weight: 5 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i7', 'i7', 'IV', 'IV', 'i7', 'i7', 'IV', 'IV'], weight: 6, note: 'A dorian rock, and the raised sixth in the IV is the whole colour of it' },
      { chords: ['i7', 'VII', 'VImaj7', 'VII', 'i7', 'VII', 'VImaj7', 'VII'], weight: 4 },
    ],
    chorus: [{ chords: ['iv7', 'VII', 'IIImaj7', 'VImaj7', 'iv7', 'V7', 'i7', 'i7'], weight: 5 }],
    bridge: [{ chords: ['VImaj7', 'VImaj7', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 4 }],
    solo: [{ chords: ['i7', 'i7', 'IV', 'IV', 'i7', 'i7', 'IV', 'IV'], weight: 5 }],
    outro: [{ chords: ['IV', 'i7', 'IV', 'i7'], weight: 4 }],
  },
  melodyCells: [
    { cell: [-2, 2, 4, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    {
      name: 'high-and-melodic',
      weight: 6,
      hits: [
        { at: 0, dur: 3, tone: 'root', vel: 1 },
        { at: 4, dur: 2, tone: 'fifth', vel: 0.76 },
        { at: 7, dur: 1, tone: 'seventh', vel: 0.62 },
        { at: 8, dur: 3, tone: 'octave', vel: 0.82 },
        { at: 12, dur: 2, tone: 'fifth', vel: 0.74 },
        { at: 14, dur: 2, tone: 'third', vel: 0.7 },
      ],
    },
    {
      name: 'two-bar-rock',
      weight: 4,
      hits: [
        { at: 0, dur: 6, tone: 'root', vel: 1 },
        { at: 6, dur: 2, tone: 'fifth', vel: 0.74 },
        { at: 8, dur: 6, tone: 'root', vel: 0.84 },
        { at: 14, dur: 2, tone: 'approach', vel: 0.68 },
      ],
    },
  ],
  comp: [
    // The tremolo guitar. One chord a bar with the amplitude already moving, so
    // the part is a held triad rather than a rhythm.
    {
      name: 'tremolo-guitar',
      weight: 6,
      voices: 3,
      hits: [{ at: 0, dur: 8, vel: 0.52 }, { at: 8, dur: 8, vel: 0.5 }],
      sustain: true,
    },
    {
      name: 'light-offbeats',
      weight: 4,
      voices: 4,
      hits: [{ at: 2, dur: 2, vel: 0.55 }, { at: 6, dur: 2, vel: 0.5 }, { at: 10, dur: 2, vel: 0.55 }, { at: 14, dur: 2, vel: 0.5 }],
    },
    /**
     * The drift, moved here from the kit. Twelve sixteenths is three beats
     * against a four-beat bar, so this figure arrives on a different beat every
     * bar and comes home every three — which is the thing the conga table above
     * wanted and could not have.
     */
    {
      name: 'three-beat-guitar',
      weight: 3,
      voices: 3,
      hits: [{ at: 0, dur: 2, vel: 0.58 }, { at: 4, dur: 2, vel: 0.5 }, { at: 7, dur: 2, vel: 0.55 }],
      cycle: 12,
    },
  ],
  drums: [
    /**
     * The congas, beside a kit that is barely playing.
     *
     * **This is the one table in the file that had to be written smaller than it
     * was meant to be, and the reason is `DrumPattern.cycle`.** What a
     * percussionist under this band actually plays is a figure a bar and a half
     * long against a backbeat that stays exactly where it is — the hands arrive on
     * a different beat every bar and come home every three, and that drift is the
     * part. `cycle` is one number for the whole kit (`docs/engine-gaps.md` §3.6),
     * so declaring 24 here would take the kick and the cross-stick round with it
     * and the backbeat would move, which is a different and much worse record. The
     * drift lives on the comp layer instead, where it can be per-part; the hands
     * below are on the bar.
     */
    {
      name: 'congas-and-kit',
      weight: 6,
      voices: {
        bd: [0, 8],
        rim: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
        lp: [0, 10],
        mp: [4, 8, 14],
        hp: [3, 6, 12],
      },
    },
    {
      name: 'brushed-and-shaker',
      weight: 4,
      voices: {
        bd: [0, 8],
        sd: [4, 12],
        sh: [0, 2, 4, 6, 8, 10, 12, 14],
        mp: [2, 6, 10, 14],
      },
      ghosts: { sd: [7, 15] },
    },
  ],
  melody: { leap: 0.24, ornament: 0.45, span: 12, sequence: 0.3, syncopation: 0.4 },
};

/**
 * DISCO SOUL — the hinge, 1977.
 *
 * The same rhythm section as `philly`, eighteen months later, with the kick moved
 * to all four beats and the hat opening on every offbeat eighth. That is the
 * entire change and it is why this is a style here rather than a genre elsewhere:
 * the people are the same people, the strings are the same strings, and what
 * happened is that a drummer started playing the bass drum on the beats his hi-hat
 * pedal was already opening between.
 *
 * The bass is the other half and it is the part that is genuinely new. An octave
 * pumped on the eighths — root, octave, root, octave — is a figure with no
 * harmonic content whatever, and it works because everything above it has all the
 * harmony a record can carry. It is spelled with `octave` rather than as a number,
 * because it does re-outline: the octave of a `min7` and the octave of a `maj7`
 * are two different notes and the part follows both.
 *
 * `elide` at real weight in the transitions, which almost nothing else here does.
 * A disco arrangement does not stop at a seam; the next section arrives an eighth
 * early and the join is a thing you notice afterwards.
 */
const discosoul: Style = {
  id: 'discosoul',
  label: 'Disco soul',
  description:
    'The Philly rhythm section with the kick moved to all four: an octave pumped in the bass, the hat open on every offbeat, and the strings still there.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [112, 126],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  transitions: [['fill', 4], ['elide', 4], ['shot', 3]],
  shots: [[[0, 4, 8, 12], 4], [[0, 6], 3], [[0, 6, 10], 2]],
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'iv7', 'iv7'], weight: 4 }, { chords: ['Imaj7', 'ii7', 'iii7', 'IVmaj7'], weight: 3 }],
    verse: [
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'V7', 'V7'], weight: 5 },
      { chords: ['Imaj7', 'ii7', 'iii7', 'IVmaj7', 'Imaj7', 'ii7', 'iii7', 'V7'], weight: 5, note: 'A scale in the bass, one chord a step, which at 120 BPM is a staircase' },
      { chords: ['ii7', 'V7', 'Imaj7', 'vi7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'V7', 'iii7', 'vi7', 'IVmaj7', 'V7', 'Imaj7', 'Imaj7'], weight: 6 },
      { chords: ['Imaj7', 'IVmaj7', 'Imaj7', 'IVmaj7', 'ii7', 'V7', 'Imaj7', 'V7'], weight: 4 },
    ],
    bridge: [{ chords: ['vi7', 'ii7', 'V7', 'Imaj7', 'vi7', 'ii7', 'V7', 'V7'], weight: 4 }],
    solo: [{ chords: ['Imaj7', 'vi7', 'ii7', 'V7', 'Imaj7', 'vi7', 'ii7', 'V7'], weight: 5 }],
    outro: [{ chords: ['ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 5 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'V7', 'V7'], weight: 6 },
      { chords: ['i7', 'VII', 'VImaj7', 'V7', 'i7', 'VII', 'VImaj7', 'V7'], weight: 4 },
    ],
    chorus: [{ chords: ['iv7', 'V7', 'i7', 'i7', 'VImaj7', 'VII', 'i7', 'i7'], weight: 5 }],
    bridge: [{ chords: ['VImaj7', 'VImaj7', 'ii%7', 'V7', 'i7', 'i7', 'V7', 'V7'], weight: 4 }],
    solo: [{ chords: ['i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'V7', 'V7'], weight: 4 }],
    outro: [{ chords: ['iv7', 'V7', 'i7', 'i7'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [-4, 4, 8], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    // The octave pump. No harmonic content at all, which is why it can be this
    // relentless — everything above it is carrying the chord.
    {
      name: 'octave-pump',
      weight: 7,
      hits: [
        { at: 0, dur: 2, tone: 'root', vel: 1 },
        { at: 2, dur: 2, tone: 'octave', vel: 0.78 },
        { at: 4, dur: 2, tone: 'root', vel: 0.86 },
        { at: 6, dur: 2, tone: 'octave', vel: 0.76 },
        { at: 8, dur: 2, tone: 'root', vel: 0.9 },
        { at: 10, dur: 2, tone: 'octave', vel: 0.76 },
        { at: 12, dur: 2, tone: 'root', vel: 0.84 },
        { at: 14, dur: 2, tone: 'octave', vel: 0.76 },
      ],
    },
    {
      name: 'walking-disco',
      weight: 4,
      hits: [
        { at: 0, dur: 2, tone: 'root', vel: 1 },
        { at: 2, dur: 2, tone: 'octave', vel: 0.74 },
        { at: 4, dur: 2, tone: 'fifth', vel: 0.82 },
        { at: 6, dur: 2, tone: 'octave', vel: 0.72 },
        { at: 8, dur: 2, tone: 'root', vel: 0.86 },
        { at: 10, dur: 2, tone: 'seventh', vel: 0.72 },
        { at: 12, dur: 2, tone: 'fifth', vel: 0.8 },
        { at: 14, dur: 2, tone: 'approach', vel: 0.74 },
      ],
    },
  ],
  comp: [
    {
      name: 'sixteenth-guitar',
      weight: 6,
      voices: 3,
      hits: [
        { at: 0, dur: 1, vel: 0.5 }, { at: 2, dur: 1, vel: 0.62 },
        { at: 4, dur: 1, vel: 0.52 }, { at: 6, dur: 1, vel: 0.64 },
        { at: 8, dur: 1, vel: 0.5 }, { at: 10, dur: 1, vel: 0.62 },
        { at: 12, dur: 1, vel: 0.52 }, { at: 14, dur: 1, vel: 0.64 },
      ],
    },
    {
      name: 'rhodes-stabs',
      weight: 4,
      voices: 4,
      hits: [{ at: 2, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.66 }, { at: 10, dur: 2, vel: 0.7 }, { at: 14, dur: 2, vel: 0.66 }],
    },
  ],
  drums: [
    {
      name: 'four-on-the-floor',
      weight: 7,
      voices: {
        bd: [0, 4, 8, 12],
        sd: [4, 12],
        hh: [0, 4, 8, 12],
        oh: [2, 6, 10, 14],
        tb: [0, 2, 4, 6, 8, 10, 12, 14],
      },
    },
    {
      name: 'clap-and-open-hat',
      weight: 4,
      voices: {
        bd: [0, 4, 8, 12],
        sd: [4, 12],
        cp: [4, 12],
        hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        oh: [6, 14],
      },
    },
  ],
  melody: { leap: 0.28, ornament: 0.3, span: 13, sequence: 0.45, syncopation: 0.4 },
};

/**
 * CROSSOVER — 1976, and the most successful record nobody remembers making.
 *
 * Mid-tempo, major, seventh chords, a Rhodes, a light kit and a string line that
 * comes in on the second chorus. This is the sound of R&B as it was actually
 * *sold* in the middle of the decade — the thing between the sweet arrangement and
 * the slow one, aimed squarely at a radio format that had just been invented.
 *
 * It is the one style here written deliberately close to its neighbours, and that
 * is a claim rather than laziness: what makes a crossover record recognisable is
 * that it is not extreme in any direction, and a table that gave it a signature
 * rhythm would be giving it the one thing the format existed to remove. The
 * distinguishing numbers are all restraint — the narrowest `melody.span` in the
 * file at 10, the lowest `leap`, and a `syncopation` of 0.35 that is the floor for
 * the whole genre.
 *
 * `vary` on the comp, which four styles here carry. It is the chance the *same*
 * figure is played differently at a phrase end rather than a different figure
 * being drawn, and it is what a session Rhodes player does out of boredom on take
 * eleven.
 */
const crossover: Style = {
  id: 'crossover',
  label: 'Crossover',
  description:
    'Mid-tempo, major, sevenths and a Rhodes: not extreme in any direction, because that is what the format was invented to remove.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [94, 112],
  swing: 0,
  modeWeights: { minor: 0.25, major: 0.75 },
  relativeMajorChorus: 0,
  vary: { comp: 0.25, bass: 0.15 },
  transitions: [['fill', 6], ['elide', 2], ['shot', 2]],
  shots: [[[0, 6], 4], [[0, 6, 12], 2]],
  progressions: {
    intro: [{ chords: ['Imaj7', 'Imaj7', 'ii7', 'V7'], weight: 5 }],
    verse: [
      { chords: ['Imaj7', 'vi7', 'ii7', 'V7', 'Imaj7', 'vi7', 'ii7', 'V7'], weight: 6 },
      { chords: ['Imaj7', 'IVmaj7', 'iii7', 'vi7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 5 },
      { chords: ['IVmaj7', 'Imaj7', 'IVmaj7', 'Imaj7', 'ii7', 'V7', 'Imaj7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'V7', 'Imaj7', 'vi7', 'IVmaj7', 'V7', 'Imaj7', 'Imaj7'], weight: 6 },
      { chords: ['ii7', 'V7', 'Imaj7', 'IVmaj7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 },
    ],
    bridge: [{ chords: ['vi7', 'iii7', 'IVmaj7', 'Imaj7', 'ii7', 'V7', 'V7', 'V7'], weight: 5 }],
    solo: [{ chords: ['Imaj7', 'vi7', 'ii7', 'V7', 'Imaj7', 'vi7', 'ii7', 'V7'], weight: 5 }],
    outro: [{ chords: ['IVmaj7', 'V7', 'Imaj7', 'Imaj7'], weight: 5 }],
  },
  minorProgressions: {
    verse: [{ chords: ['i7', 'iv7', 'VII', 'IIImaj7', 'VImaj7', 'ii%7', 'V7', 'i7'], weight: 5 }],
    chorus: [{ chords: ['iv7', 'V7', 'i7', 'VImaj7', 'iv7', 'V7', 'i7', 'i7'], weight: 5 }],
    solo: [{ chords: ['i7', 'iv7', 'VII', 'IIImaj7', 'VImaj7', 'ii%7', 'V7', 'i7'], weight: 4 }],
    outro: [{ chords: ['iv7', 'V7', 'i7', 'i7'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 8], weight: 5 },
    { cell: [-2, 2, 4, 8], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    {
      name: 'session-eighths',
      weight: 6,
      hits: [
        { at: 0, dur: 2, tone: 'root', vel: 1 },
        { at: 3, dur: 1, tone: 'root', vel: 0.6 },
        { at: 4, dur: 2, tone: 'fifth', vel: 0.8 },
        { at: 8, dur: 2, tone: 'root', vel: 0.86 },
        { at: 10, dur: 2, tone: 'third', vel: 0.7 },
        { at: 12, dur: 2, tone: 'fifth', vel: 0.78 },
        { at: 14, dur: 2, tone: 'approach', vel: 0.72 },
      ],
    },
    {
      name: 'quarters-and-a-lift',
      weight: 4,
      hits: [
        { at: 0, dur: 4, tone: 'root', vel: 1 },
        { at: 4, dur: 4, tone: 'fifth', vel: 0.78 },
        { at: 8, dur: 4, tone: 'root', vel: 0.84 },
        { at: 12, dur: 2, tone: 'seventh', vel: 0.7 },
        { at: 14, dur: 2, tone: 'approach', vel: 0.72 },
      ],
    },
  ],
  comp: [
    {
      name: 'rhodes-comping',
      weight: 6,
      voices: 4,
      hits: [{ at: 0, dur: 2, vel: 0.6 }, { at: 3, dur: 3, vel: 0.68 }, { at: 8, dur: 2, vel: 0.6 }, { at: 11, dur: 3, vel: 0.66 }],
    },
    {
      name: 'guitar-backbeat',
      weight: 4,
      voices: 3,
      hits: [{ at: 4, dur: 2, vel: 0.7 }, { at: 12, dur: 2, vel: 0.7 }],
    },
  ],
  drums: [
    {
      name: 'session-kit',
      weight: 6,
      voices: { bd: [0, 6, 8], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14] },
      ghosts: { sd: [7, 15] },
    },
    {
      name: 'hat-sixteenths',
      weight: 4,
      voices: {
        bd: [0, 8, 11],
        sd: [4, 12],
        hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      },
      ghosts: { sd: [3, 11] },
    },
  ],
  melody: { leap: 0.18, ornament: 0.35, span: 10, sequence: 0.4, syncopation: 0.35 },
};

/**
 * BALLAD — the string ballad, and the one everybody has heard.
 *
 * Slow four, a piano or a Rhodes, brushes or a rimshot, and strings that arrive
 * on the second chorus and are gone from the last one. That last clause is not a
 * description of a fault: it is `Chart.exits` firing on a style that has been
 * deliberately left unprotected, and it is the reason this style names no
 * `requireLayers` despite the strings being on the label.
 *
 * The distinguishing rhythm fact is that there almost isn't one. `bd` on 0 and 8,
 * a backbeat, and a hat playing eighths is the whole kit, and what carries the
 * bar is the *bass*, which is why both tables below are the longest slow-tempo
 * bass parts in the file. A ballad at 68 BPM with a bass playing two notes a bar
 * is a record with nothing holding it up.
 *
 * `melody.span` at 15 is the widest here, and it is the point of the style: a
 * ballad exists so that somebody can go from the bottom of their range to the top
 * of it in one phrase, and a span that kept them comfortable would be a span that
 * removed the reason for the arrangement.
 */
const ballad: Style = {
  id: 'ballad',
  label: 'Soul ballad',
  description:
    'Slow four with strings that arrive late and leave early: a rimshot, a piano, and a bass doing most of the work of holding the bar up.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [60, 78],
  swing: 0,
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0,
  feels: [['straight', 5], ['laidback', 3]],
  transitions: [['fill', 5], ['elide', 2], ['break', 2]],
  shots: [[[0], 4], [[0, 6], 3], [[0, 8], 2]],
  progressions: {
    intro: [{ chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'V7'], weight: 5 }],
    verse: [
      { chords: ['Imaj7', 'iii7', 'IVmaj7', 'V7', 'Imaj7', 'vi7', 'ii7', 'V7'], weight: 6 },
      { chords: ['Imaj7', 'IVmaj7', 'iii7', 'vi7', 'IVmaj7', 'iv', 'Imaj7', 'V7'], weight: 5, note: 'The borrowed minor fourth in bar six, which is the one moment the record hurts' },
      { chords: ['Imaj7', 'V/vi', 'vi7', 'iii7', 'IVmaj7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'V7', 'iii7', 'vi7', 'IVmaj7', 'V7', 'Imaj7', 'Imaj7'], weight: 6 },
      { chords: ['IVmaj7', 'iv', 'Imaj7', 'vi7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['ii7', 'V7', 'iii7', 'vi7', 'IVmaj7', 'V7', 'Imaj7', 'V7'], weight: 3 },
    ],
    bridge: [
      { chords: ['vi7', 'iii7', 'IVmaj7', 'Imaj7', 'ii7', 'V7', 'V7', 'V7'], weight: 5 },
      { chords: ['IVmaj7', 'V/V', 'V7', 'V7', 'IVmaj7', 'iv', 'V7', 'V7'], weight: 3 },
    ],
    solo: [{ chords: ['Imaj7', 'iii7', 'IVmaj7', 'V7', 'Imaj7', 'vi7', 'ii7', 'V7'], weight: 5 }],
    outro: [
      { chords: ['IVmaj7', 'iv', 'Imaj7', 'Imaj7'], weight: 6 },
      { chords: ['ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i7', 'VII', 'VImaj7', 'V7', 'i7', 'iv7', 'V7', 'V7'], weight: 5 },
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'VImaj7', 'ii%7', 'V7', 'i7'], weight: 4 },
    ],
    chorus: [{ chords: ['VImaj7', 'VII', 'i7', 'i7', 'iv7', 'V7', 'i7', 'i7'], weight: 5 }],
    bridge: [{ chords: ['VImaj7', 'IIImaj7', 'iv7', 'i7', 'ii%7', 'V7', 'V7', 'V7'], weight: 4 }],
    solo: [{ chords: ['i7', 'VII', 'VImaj7', 'V7', 'i7', 'iv7', 'V7', 'V7'], weight: 4 }],
    outro: [{ chords: ['iv7', 'V7', 'i7', 'i7'], weight: 4 }],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [-4, 4, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [-2, 2, 4, 8], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [-8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    // The longest slow bass part in the file, because at this tempo the kit is
    // not holding the bar up and something has to.
    {
      name: 'ballad-line',
      weight: 6,
      hits: [
        { at: 0, dur: 4, tone: 'root', vel: 1 },
        { at: 4, dur: 2, tone: 'fifth', vel: 0.74 },
        { at: 6, dur: 2, tone: 'octave', vel: 0.7 },
        { at: 8, dur: 4, tone: 'third', vel: 0.8 },
        { at: 12, dur: 2, tone: 'fifth', vel: 0.74 },
        { at: 14, dur: 2, tone: 'approach', vel: 0.7 },
      ],
    },
    {
      name: 'held-and-turned',
      weight: 4,
      hits: [
        { at: 0, dur: 8, tone: 'root', vel: 1 },
        { at: 8, dur: 4, tone: 'fifth', vel: 0.78 },
        { at: 12, dur: 2, tone: 'seventh', vel: 0.7 },
        { at: 14, dur: 2, tone: 'approach', vel: 0.7 },
      ],
    },
  ],
  comp: [
    {
      name: 'piano-arpeggio',
      weight: 6,
      voices: 4,
      hits: [
        { at: 0, dur: 2, vel: 0.62 }, { at: 2, dur: 2, vel: 0.5 },
        { at: 4, dur: 2, vel: 0.58 }, { at: 6, dur: 2, vel: 0.5 },
        { at: 8, dur: 2, vel: 0.62 }, { at: 10, dur: 2, vel: 0.5 },
        { at: 12, dur: 2, vel: 0.58 }, { at: 14, dur: 2, vel: 0.5 },
      ],
      arpeggio: true,
      arpDirection: 'updown',
    },
    {
      name: 'held-rhodes',
      weight: 5,
      voices: 4,
      hits: [{ at: 0, dur: 16, vel: 0.55 }],
      sustain: true,
      voicing: 'spread',
    },
    {
      name: 'ballad-chords',
      weight: 3,
      voices: 4,
      hits: [{ at: 0, dur: 6, vel: 0.6 }, { at: 6, dur: 2, vel: 0.5 }, { at: 8, dur: 8, vel: 0.56 }],
    },
  ],
  drums: [
    {
      name: 'rimshot-ballad',
      weight: 6,
      voices: { bd: [0, 8], rim: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14] },
    },
    {
      name: 'brushed-ballad',
      weight: 4,
      voices: { bd: [0, 8], sd: [4, 12], sh: [0, 2, 4, 6, 8, 10, 12, 14] },
      ghosts: { sd: [7, 15] },
    },
  ],
  // The widest span in the file. See the header: this style exists so that
  // somebody can cross their whole range inside one phrase.
  melody: { leap: 0.3, ornament: 0.55, span: 15, sequence: 0.3, syncopation: 0.3 },
};

/**
 * QUIET STORM — 1979, and the second override.
 *
 * A radio format that turned into a style. Slow, in seven-note chords, with a
 * Rhodes and a fretless bass and a soprano saxophone, played for people who are
 * awake at two in the morning. What separates it from `ballad` is not tempo — they
 * overlap — it is that a ballad's chords are *functional* and this one's are
 * *places*: a `maj9` here is not on the way to a dominant, it is somewhere the
 * record has arrived and intends to stay for two bars.
 *
 * ## Why it overrides `scaleForChord`, and in the opposite direction to `deepsoul`
 *
 * The genre's rule keeps the line in the key over a diatonic chord and re-orients
 * only over a borrowed one, and that is exactly wrong here. `IVmaj9` in this music
 * is diatonic and is still a colour rather than a step: a line that stayed in the
 * key over it would keep landing on the natural fourth and the leading tone, which
 * are the two notes the chord was voiced to avoid. So this style always follows
 * the chord, using the table at the top of this file — the maj7 taking lydian is
 * the entry that matters most, because the raised fourth is what a quiet-storm
 * Rhodes voicing has in it and plain major cannot produce.
 *
 * `deepsoul` above overrides in the other direction, to a fixed tonic scale. Two
 * styles, one genre, opposite overrides, which is the shape jazz and funk already
 * have between them and is the shape this genre has *inside* itself. That is the
 * argument for the split being genre-internal rather than two genres, and it is
 * made at length in `index.ts`.
 */
const quietstorm: Style = {
  id: 'quietstorm',
  label: 'Quiet storm',
  description:
    'Two in the morning, in seven-note chords: a Rhodes, a fretless, a soprano saxophone, and harmony that has arrived rather than gone anywhere.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [62, 80],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  // Always the chord, never the key. See the header — and see `deepsoul`, which
  // overrides the same field in the opposite direction.
  scaleForChord: (_tonic, _mode, chord) => chordScale(chord),
  feels: [['laidback', 6], ['straight', 3], ['pocket', 2]],
  transitions: [['fill', 4], ['elide', 3], ['break', 2]],
  breakCarrier: 'comp',
  shots: [[[0], 4], [[0, 6], 2]],
  progressions: {
    intro: [{ chords: ['Imaj9', 'Imaj9', 'ii7', 'ii7'], weight: 5 }, { chords: ['i9', 'i9', 'IVmaj9', 'IVmaj9'], weight: 3 }],
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'ii7', 'ii7', 'iii7', 'iii7', 'IVmaj9', 'V7'], weight: 6, note: 'Two bars a chord, so that each one has time to be a place rather than a step' },
      { chords: ['Imaj9', 'IVmaj9', 'iii7', 'vi7', 'ii7', 'V7', 'Imaj9', 'Imaj9'], weight: 5 },
      { chords: ['IVmaj9', 'IVmaj9', 'iii7', 'vi7', 'ii7', 'ii7', 'V7', 'V7'], weight: 4 },
      { chords: ['Imaj9', 'bIIImaj7', 'IVmaj9', 'bVImaj7', 'Imaj9', 'bIIImaj7', 'IVmaj9', 'V7'], weight: 3, note: 'Two borrowings out of four, and the line follows every one of them' },
    ],
    chorus: [
      { chords: ['IVmaj9', 'V7', 'iii7', 'vi7', 'ii7', 'V7', 'Imaj9', 'Imaj9'], weight: 6 },
      { chords: ['vi7', 'ii7', 'V7', 'Imaj9', 'IVmaj9', 'V7', 'Imaj9', 'Imaj9'], weight: 4 },
    ],
    bridge: [{ chords: ['vi7', 'bVImaj7', 'V7', 'V7', 'ii7', 'ii7', 'V7', 'V7'], weight: 4 }],
    solo: [{ chords: ['Imaj9', 'Imaj9', 'ii7', 'ii7', 'iii7', 'iii7', 'IVmaj9', 'V7'], weight: 5 }],
    outro: [{ chords: ['IVmaj9', 'V7', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i9', 'i9', 'IVmaj9', 'IVmaj9', 'i9', 'i9', 'VImaj7', 'V7'], weight: 6, note: 'A dorian rock: the raised sixth in the IV is what the chord is for' },
      { chords: ['i11', 'i11', 'VII', 'VII', 'VImaj7', 'VImaj7', 'V7', 'V7'], weight: 5 },
      { chords: ['i9', 'iv9', 'VII', 'IIImaj7', 'VImaj7', 'ii%7', 'V7', 'i9'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv9', 'VII', 'IIImaj7', 'VImaj7', 'ii%7', 'V7', 'i9', 'i9'], weight: 5 },
      { chords: ['VImaj7', 'VII', 'i9', 'i9', 'VImaj7', 'VII', 'i9', 'i9'], weight: 4 },
    ],
    bridge: [{ chords: ['VImaj7', 'VImaj7', 'IVmaj9', 'IVmaj9', 'V7', 'V7', 'V7', 'V7'], weight: 4 }],
    solo: [{ chords: ['i9', 'i9', 'IVmaj9', 'IVmaj9', 'i9', 'i9', 'VImaj7', 'V7'], weight: 5 }],
    outro: [{ chords: ['iv9', 'V7', 'i9', 'i9'], weight: 4 }],
  },
  melodyCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-2, 2, 4, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
    { cell: [-8, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    // The fretless. Long notes, a slide into the second half of the bar, and the
    // seventh of the chord more often than the fifth.
    {
      name: 'fretless',
      weight: 6,
      hits: [
        { at: 0, dur: 6, tone: 'root', vel: 1 },
        { at: 7, dur: 1, tone: 'seventh', vel: 0.6 },
        { at: 8, dur: 4, tone: 'fifth', vel: 0.78 },
        { at: 13, dur: 3, tone: 'octave', vel: 0.7 },
      ],
    },
    {
      name: 'slow-and-held',
      weight: 5,
      hits: [{ at: 0, dur: 10, tone: 'root', vel: 1 }, { at: 10, dur: 6, tone: 'fifth', vel: 0.76 }],
      sustain: true,
    },
  ],
  comp: [
    {
      name: 'rhodes-spread',
      weight: 6,
      voices: 5,
      hits: [{ at: 0, dur: 8, vel: 0.58 }, { at: 8, dur: 8, vel: 0.54 }],
      sustain: true,
      voicing: 'spread',
    },
    {
      name: 'anticipated-rhodes',
      weight: 5,
      voices: 5,
      hits: [{ at: 0, dur: 6, vel: 0.6 }, { at: 7, dur: 5, vel: 0.56 }, { at: 14, dur: 2, vel: 0.52 }],
    },
    {
      name: 'guide-tones',
      weight: 3,
      voices: 3,
      hits: [{ at: 2, dur: 2, vel: 0.5 }, { at: 8, dur: 4, vel: 0.52 }, { at: 14, dur: 2, vel: 0.48 }],
      voicing: 'guide',
    },
  ],
  drums: [
    {
      name: 'quiet-kit',
      weight: 6,
      voices: { bd: [0, 8], rim: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14] },
      ghosts: { sd: [7, 15] },
    },
    {
      name: 'brushes-and-hat',
      weight: 4,
      voices: { bd: [0, 6, 8], sd: [4, 12], sh: [0, 2, 4, 6, 8, 10, 12, 14], tb: [12] },
      ghosts: { sd: [3, 11] },
    },
  ],
  melody: { leap: 0.3, ornament: 0.55, span: 14, sequence: 0.25, syncopation: 0.35 },
};

// ---------------------------------------------------------------------------
// 1989 — the machine
// ---------------------------------------------------------------------------

/**
 * SYNTH SOUL — 1985, and the awkward one.
 *
 * A LinnDrum, a DX7 where the Rhodes was, a synth bass, and a snare with a gate
 * on it. This is the era of this music that has aged worst and it is here for
 * exactly that reason: it is a real and enormously successful sound, it is what
 * every one of these singers was actually making in 1985, and leaving it out
 * would be curating the repertoire rather than describing it.
 *
 * **`boxDrums: false`**, which looks backwards for the most machine-driven style
 * in the file and is not. `Style.boxDrums` asks whether a *preset* rhythm box may
 * play this style — a machine with patterns already in it, no fills and no
 * variation — and the whole point of a LinnDrum record is that a person entered
 * every stroke of it a step at a time. The era's `programmed` source is what this
 * style wants; the preset box is the one thing it must not draw, because a preset
 * pattern under this material is a home organ demo.
 *
 * The gated snare is written as a snare and a clap on the same slot, which is what
 * it physically was on most of these records — the gate is a production decision
 * and lives in `Style.effects` rather than in the figure.
 */
const synthsoul: Style = {
  id: 'synthsoul',
  label: 'Synth soul',
  description:
    'A LinnDrum, a DX7 where the Rhodes was, and a snare with a gate on it: the era of this music that aged worst and sold most.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [94, 112],
  swing: 0,
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0,
  // See the header. The era programmes this style; a preset box must not.
  boxDrums: false,
  /**
   * The gate is the record. `Style.effects` goes over the era's, which is right
   * here for the reason the field documents: this is not a claim that 1985 was
   * reverberant, it is a claim that *this* snare is made of its reverb, and a
   * version without it is a different piece rather than a period variant.
   */
  effects: {
    drums: { reverb: 0.42, lowpass: 12000 },
    comp: { reverb: 0.3, delay: 0.18 },
  },
  transitions: [['fill', 5], ['shot', 3], ['elide', 2]],
  shots: [[[0, 6], 4], [[0, 4, 6, 12], 3], [[0, 6, 10], 2]],
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'VImaj7', 'VII'], weight: 4 }, { chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'V7'], weight: 4 }],
    verse: [
      { chords: ['i7', 'VII', 'VImaj7', 'VII', 'i7', 'VII', 'VImaj7', 'V7'], weight: 6 },
      { chords: ['Imaj7', 'iii7', 'IVmaj7', 'V7', 'Imaj7', 'iii7', 'IVmaj7', 'V7'], weight: 5 },
      { chords: ['vi7', 'IVmaj7', 'Imaj7', 'V7', 'vi7', 'IVmaj7', 'Imaj7', 'V7'], weight: 4 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'V7', 'Imaj7', 'vi7', 'IVmaj7', 'V7', 'Imaj7', 'Imaj7'], weight: 6 },
      { chords: ['vi7', 'IVmaj7', 'Imaj7', 'V7', 'vi7', 'IVmaj7', 'V7', 'V7'], weight: 4 },
    ],
    bridge: [{ chords: ['IVmaj7', 'IVmaj7', 'V7', 'V7', 'vi7', 'vi7', 'V7', 'V7'], weight: 4 }],
    solo: [{ chords: ['Imaj7', 'iii7', 'IVmaj7', 'V7', 'Imaj7', 'iii7', 'IVmaj7', 'V7'], weight: 5 }],
    outro: [{ chords: ['IVmaj7', 'V7', 'Imaj7', 'Imaj7'], weight: 5 }],
  },
  minorProgressions: {
    verse: [{ chords: ['i7', 'VII', 'VImaj7', 'VII', 'i7', 'VII', 'VImaj7', 'V7'], weight: 6 }],
    chorus: [{ chords: ['VImaj7', 'VII', 'i7', 'i7', 'VImaj7', 'VII', 'V7', 'V7'], weight: 5 }],
    bridge: [{ chords: ['iv7', 'iv7', 'VImaj7', 'VII', 'V7', 'V7', 'V7', 'V7'], weight: 4 }],
    solo: [{ chords: ['i7', 'VII', 'VImaj7', 'VII', 'i7', 'VII', 'VImaj7', 'V7'], weight: 4 }],
    outro: [{ chords: ['VImaj7', 'VII', 'i7', 'i7'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 8], weight: 5 },
    { cell: [-2, 2, 4, 8], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [-4, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    {
      name: 'synth-eighths',
      weight: 6,
      hits: [
        { at: 0, dur: 2, tone: 'root', vel: 1 },
        { at: 2, dur: 2, tone: 'root', vel: 0.7 },
        { at: 4, dur: 2, tone: 'root', vel: 0.82 },
        { at: 7, dur: 1, tone: 'octave', vel: 0.66 },
        { at: 8, dur: 2, tone: 'root', vel: 0.86 },
        { at: 10, dur: 2, tone: 'fifth', vel: 0.72 },
        { at: 12, dur: 2, tone: 'root', vel: 0.8 },
        { at: 14, dur: 2, tone: 'approach', vel: 0.72 },
      ],
    },
    {
      name: 'slap-and-hold',
      weight: 4,
      hits: [
        { at: 0, dur: 3, tone: 'root', vel: 1 },
        { at: 4, dur: 1, tone: 'octave', vel: 0.8 },
        { at: 6, dur: 2, tone: 'seventh', vel: 0.72 },
        { at: 8, dur: 4, tone: 'root', vel: 0.86 },
        { at: 12, dur: 2, tone: 'fifth', vel: 0.76 },
        { at: 15, dur: 1, tone: 'octave', vel: 0.7 },
      ],
    },
  ],
  comp: [
    {
      name: 'dx-stabs',
      weight: 6,
      voices: 4,
      hits: [{ at: 0, dur: 2, vel: 0.72 }, { at: 3, dur: 3, vel: 0.66 }, { at: 8, dur: 2, vel: 0.72 }, { at: 11, dur: 3, vel: 0.64 }],
    },
    {
      name: 'dx-pads',
      weight: 4,
      voices: 5,
      hits: [{ at: 0, dur: 16, vel: 0.5 }],
      sustain: true,
      voicing: 'spread',
    },
  ],
  drums: [
    /**
     * The gated snare, written as a snare and a clap landing together. That is
     * what it physically was — the gate itself is production and lives in
     * `effects` above rather than in the figure.
     */
    {
      name: 'gated-linn',
      weight: 6,
      voices: {
        bd: [0, 6, 8],
        sd: [4, 12],
        cp: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
      },
    },
    {
      name: 'linn-sixteenths',
      weight: 4,
      voices: {
        bd: [0, 8, 11],
        sd: [4, 12],
        cp: [4, 12],
        hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        tb: [2, 6, 10, 14],
      },
    },
  ],
  melody: { leap: 0.26, ornament: 0.3, span: 12, sequence: 0.45, syncopation: 0.4 },
};

/**
 * NEW JACK — 1989, and the style `DrumPattern.ghosts` was needed for.
 *
 * A hard machine snare on the two and the four with four ghosted strokes packed
 * around each one. That is not a shading of the figure, it *is* the figure: write
 * those eight strokes as ordinary hits and the part comes out as a sixteenth-note
 * snare roll, which is a completely different and much worse record. This style
 * and `hiphopsoul` below are the two that could not have been written before the
 * field existed, and it is worth saying which way round the dependency runs — the
 * kit is not decorated with ghosts, the kit *is* mostly ghosts with four loud
 * strokes standing out of it.
 *
 * **It writes both neighbours of every backbeat**, and that is deliberate in a way
 * the field's own documentation predicts. A drawn `Feel.ghost` only lands on odd
 * sixteenths adjacent to a snare that is not already sounding, so writing 3, 5, 11
 * and 13 spends the whole allowance and the feel adds nothing. That is exactly
 * right for a machine somebody programmed thoroughly. `neosoul` below writes only
 * one side and leaves the other to be drawn, which is a person playing along with
 * a loop, and the difference between those two records is precisely this
 * difference.
 *
 * **The swing is a known approximation and this is where it is written down.** The
 * shuffle on these records is on the *sixteenth* — the second and fourth
 * sixteenths of each beat pushed late — and the engine's `swing` delays the second
 * *eighth*. There is no way to spell the real thing in this table. `0.16` is half
 * a triplet on the eighths, which lands somewhere honest between straight and
 * shuffled and is the nearest available object; the alternative was 0, which would
 * have made this style a hard 1985 record with a busier snare.
 */
const newjack: Style = {
  id: 'newjack',
  label: 'New jack swing',
  description:
    'A hard machine snare with four ghosts packed round each backbeat, a swung sixteenth the engine can only approximate, and a synth bass on the front of the beat.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [106, 122],
  // See the header. The records swing the sixteenth and the engine swings the
  // eighth; this is the nearest honest value and the compromise is named.
  swing: 0.16,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  boxDrums: false,
  feels: [['funk', 5], ['driving', 3], ['straight', 3]],
  transitions: [['fill', 4], ['shot', 4], ['break', 3]],
  shots: [[[0, 6], 5], [[0, 3, 6, 10], 4], [[0, 6, 7], 3], [[0, 4, 6, 12], 2]],
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }, { chords: ['i7', 'iv7', 'VII', 'i7'], weight: 3 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 6, note: 'Nearly static, because the record is being carried by the drum programme' },
      { chords: ['i7', 'VII', 'VImaj7', 'V7', 'i7', 'VII', 'VImaj7', 'V7'], weight: 5 },
      { chords: ['i7', 'i7', 'VImaj7', 'VImaj7', 'iv7', 'iv7', 'V7', 'V7'], weight: 4 },
    ],
    chorus: [
      { chords: ['VImaj7', 'VII', 'i7', 'i7', 'VImaj7', 'VII', 'i7', 'i7'], weight: 6 },
      { chords: ['iv7', 'V7', 'i7', 'i7', 'iv7', 'V7', 'i7', 'V7'], weight: 4 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'iv7', 'iv7', 'V7', 'V7', 'V7', 'V7'], weight: 4 }],
    solo: [{ chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 5 }],
    outro: [{ chords: ['VImaj7', 'VII', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'V7', 'V7'], weight: 5 },
      { chords: ['Imaj7', 'vi7', 'IVmaj7', 'V7', 'Imaj7', 'vi7', 'IVmaj7', 'V7'], weight: 4 },
    ],
    chorus: [{ chords: ['IVmaj7', 'V7', 'Imaj7', 'vi7', 'IVmaj7', 'V7', 'Imaj7', 'Imaj7'], weight: 5 }],
    solo: [{ chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'V7', 'V7'], weight: 4 }],
    outro: [{ chords: ['IVmaj7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 }],
  },
  melodyCells: [
    { cell: [3, 3, 2, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [-4, 2, 2, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    // Numbers, like `funksoul`: this is a shape a left hand plays and moves
    // bodily, and the `-2` is a flat seventh under whatever is above it.
    {
      name: 'synth-shape',
      weight: 6,
      hits: [
        { at: 0, dur: 3, tone: 0, vel: 1 },
        { at: 3, dur: 1, tone: 0, vel: 0.62 },
        { at: 6, dur: 2, tone: -2, vel: 0.78 },
        { at: 8, dur: 3, tone: 0, vel: 0.88 },
        { at: 12, dur: 2, tone: 7, vel: 0.76 },
        { at: 14, dur: 2, tone: 0, vel: 0.72 },
      ],
    },
    {
      name: 'octave-stab',
      weight: 4,
      hits: [
        { at: 0, dur: 2, tone: 0, vel: 1 },
        { at: 4, dur: 1, tone: 12, vel: 0.78 },
        { at: 6, dur: 2, tone: 0, vel: 0.8 },
        { at: 10, dur: 2, tone: 10, vel: 0.72 },
        { at: 12, dur: 3, tone: 0, vel: 0.84 },
      ],
    },
  ],
  comp: [
    {
      name: 'dx-hits',
      weight: 6,
      voices: 4,
      hits: [{ at: 0, dur: 2, vel: 0.78 }, { at: 3, dur: 1, vel: 0.62 }, { at: 6, dur: 2, vel: 0.72 }, { at: 8, dur: 2, vel: 0.76 }, { at: 14, dur: 2, vel: 0.68 }],
    },
    {
      name: 'stacked-pads',
      weight: 4,
      voices: 5,
      hits: [{ at: 0, dur: 16, vel: 0.48 }],
      sustain: true,
      voicing: 'spread',
    },
  ],
  drums: [
    /**
     * The figure. Four loud strokes and eight quiet ones, and the quiet ones are
     * where the style lives — see the header for why writing both neighbours of
     * each backbeat is a statement about the programmer rather than an oversight.
     */
    {
      name: 'swingbeat',
      weight: 7,
      voices: {
        bd: [0, 6, 8, 14],
        sd: [4, 12],
        cp: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
      },
      ghosts: { sd: [3, 5, 11, 13] },
    },
    {
      name: 'hard-kick',
      weight: 5,
      voices: {
        bd: [0, 3, 8, 10],
        sd: [4, 12],
        cp: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
        oh: [7, 15],
      },
      ghosts: { sd: [5, 7, 13, 15] },
    },
    {
      name: 'rolling-machine',
      weight: 3,
      voices: {
        bd: [0, 6, 8, 11, 14],
        sd: [4, 12],
        hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        tb: [2, 6, 10, 14],
      },
      ghosts: { sd: [3, 5, 9, 11, 13, 15] },
    },
  ],
  melody: { leap: 0.32, ornament: 0.35, span: 12, sequence: 0.4, syncopation: 0.6 },
};

/**
 * SLOW JAM — 1990, and the loudest snare in the file.
 *
 * Half time at sixty-six beats a minute, which means a backbeat every two seconds
 * and a very large amount of room between them. That room is the style: it is what
 * the reverb is for, it is where the vocal run goes, and it is why the kit tables
 * below have so little in them.
 *
 * `feels: halftime` at the top. The feel's own numbers are `push: { bass: 8,
 * comp: 8, pad: 6, sd: 14 }` — everything a shade behind the grid and the snare
 * furthest behind of all — which is exactly the drag this music has and is not
 * something a slot index can express.
 *
 * **`breakCarrier: 'melody'`.** The default is the bass and the default would be
 * wrong here in a way that matters: a break in a slow jam is the band stopping and
 * *the singer carrying on*, which is the most reliable eight bars in the whole
 * repertoire. `Style.breakCarrier`'s own doc names `melody` as the spelling for a
 * sung break, and this is the style it was describing.
 */
const slowjam: Style = {
  id: 'slowjam',
  label: 'Slow jam',
  description:
    'Half time at sixty-six, with two seconds between backbeats and all of it left for the singer: a machine kit, a stacked pad, and a break the voice carries.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [56, 74],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  feels: [['halftime', 6], ['laidback', 4], ['straight', 2]],
  transitions: [['fill', 4], ['break', 4], ['elide', 2]],
  // The band stops and the singer does not. See the header.
  breakCarrier: 'melody',
  shots: [[[0], 5], [[0, 8], 3]],
  progressions: {
    intro: [{ chords: ['Imaj9', 'Imaj9', 'vi7', 'vi7'], weight: 5 }],
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'vi7', 'vi7', 'IVmaj9', 'IVmaj9', 'V7', 'V7'], weight: 6 },
      { chords: ['Imaj9', 'iii7', 'vi7', 'IVmaj9', 'Imaj9', 'iii7', 'ii7', 'V7'], weight: 5 },
      { chords: ['vi7', 'V7', 'IVmaj9', 'iii7', 'ii7', 'V7', 'Imaj9', 'Imaj9'], weight: 4 },
    ],
    chorus: [
      { chords: ['IVmaj9', 'V7', 'iii7', 'vi7', 'IVmaj9', 'V7', 'Imaj9', 'Imaj9'], weight: 6 },
      { chords: ['IVmaj9', 'iv', 'Imaj9', 'vi7', 'ii7', 'V7', 'Imaj9', 'Imaj9'], weight: 4 },
    ],
    bridge: [{ chords: ['vi7', 'iii7', 'IVmaj9', 'Imaj9', 'ii7', 'V7', 'V7', 'V7'], weight: 4 }],
    solo: [{ chords: ['Imaj9', 'Imaj9', 'vi7', 'vi7', 'IVmaj9', 'IVmaj9', 'V7', 'V7'], weight: 5 }],
    outro: [{ chords: ['IVmaj9', 'V7', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  minorProgressions: {
    verse: [{ chords: ['i9', 'i9', 'VImaj7', 'VImaj7', 'iv9', 'iv9', 'V7', 'V7'], weight: 5 }],
    chorus: [{ chords: ['VImaj7', 'VII', 'i9', 'i9', 'iv9', 'V7', 'i9', 'i9'], weight: 5 }],
    bridge: [{ chords: ['iv9', 'iv9', 'VImaj7', 'VII', 'V7', 'V7', 'V7', 'V7'], weight: 4 }],
    solo: [{ chords: ['i9', 'i9', 'VImaj7', 'VImaj7', 'iv9', 'iv9', 'V7', 'V7'], weight: 4 }],
    outro: [{ chords: ['iv9', 'V7', 'i9', 'i9'], weight: 4 }],
  },
  melodyCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-2, 2, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [-8, 8], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    {
      name: 'synth-held',
      weight: 6,
      hits: [
        { at: 0, dur: 7, tone: 'root', vel: 1 },
        { at: 8, dur: 4, tone: 'fifth', vel: 0.78 },
        { at: 13, dur: 3, tone: 'octave', vel: 0.72 },
      ],
    },
    {
      name: 'sub-and-slide',
      weight: 4,
      hits: [
        { at: 0, dur: 6, tone: 'root', vel: 1 },
        { at: 6, dur: 2, tone: 'seventh', vel: 0.66 },
        { at: 8, dur: 6, tone: 'root', vel: 0.84 },
        { at: 14, dur: 2, tone: 'approach', vel: 0.68 },
      ],
    },
  ],
  comp: [
    {
      name: 'stacked-rhodes',
      weight: 6,
      voices: 5,
      hits: [{ at: 0, dur: 16, vel: 0.52 }],
      sustain: true,
      voicing: 'spread',
    },
    {
      name: 'half-time-stabs',
      weight: 4,
      voices: 5,
      hits: [{ at: 0, dur: 6, vel: 0.62 }, { at: 8, dur: 6, vel: 0.58 }],
    },
  ],
  drums: [
    // Two seconds between backbeats and nothing filling them. The room is the
    // part.
    {
      name: 'half-time-machine',
      weight: 6,
      voices: { bd: [0, 10], sd: [8], cp: [8], hh: [0, 2, 4, 6, 8, 10, 12, 14] },
      ghosts: { sd: [4, 12] },
    },
    {
      name: 'linn-slow',
      weight: 4,
      voices: { bd: [0, 6, 10], sd: [8], rim: [4, 12], hh: [0, 4, 8, 12], tb: [8] },
    },
  ],
  melody: { leap: 0.32, ornament: 0.6, span: 14, sequence: 0.25, syncopation: 0.35 },
};

/**
 * HIP-HOP SOUL — 1993, and the first record here made out of somebody else's.
 *
 * A boom-bap kit under a sung line. The change from `newjack` is small on paper
 * and enormous in the room: the tempo drops ten BPM, the swing comes off, the
 * snare goes from a gated crack to a thick sampled one, and the harmony stops
 * moving almost entirely — because what is underneath is a two-bar loop and a loop
 * does not have a bridge.
 *
 * **The ghosts move from the machine's positions to a drummer's.** `newjack`
 * writes 3, 5, 11, 13 — both odd neighbours of each backbeat, packed tight, which
 * is somebody entering steps. This writes 2, 6, 10, 14 — the *eighths* between the
 * strokes, which is where a hand falls when it is playing rather than
 * programming. `DrumPattern.ghosts` documents the consequence and it is wanted
 * here: a ghost on an even sixteenth opens its odd neighbours to the drawn pass, so
 * a `Feel.ghost` can still put something between them, and what comes out is a
 * shadow under the written stroke rather than a second one beside it.
 *
 * `breakCarrier` is left at the default, which for this style is right and is
 * worth saying: what is left when a hip-hop soul record drops out is the bass, and
 * that is the one gesture this style shares with the whole rest of the catalogue.
 */
const hiphopsoul: Style = {
  id: 'hiphopsoul',
  label: 'Hip-hop soul',
  description:
    'A boom-bap kit under a sung line: a two-bar loop that will not develop, ghosts on the eighths where a hand falls, and the harmony almost stopped.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [84, 98],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  // The loop does not develop. `earworm` for a reason this genre has nowhere
  // else: the record is built out of two bars that were already finished.
  hook: 'earworm',
  feels: [['laidback', 5], ['pocket', 4], ['halftime', 2]],
  transitions: [['fill', 4], ['break', 4], ['elide', 2]],
  shots: [[[0], 4], [[0, 6], 3], [[0, 10], 2]],
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6, note: 'One chord for eight bars, which is a loop rather than a vamp — the difference is that nobody is playing it' },
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'iv7', 'iv7'], weight: 5 },
      { chords: ['i9', 'i9', 'VImaj7', 'VImaj7', 'i9', 'i9', 'VImaj7', 'VImaj7'], weight: 4 },
    ],
    chorus: [
      { chords: ['VImaj7', 'VII', 'i7', 'i7', 'VImaj7', 'VII', 'i7', 'i7'], weight: 6 },
      { chords: ['iv7', 'iv7', 'i7', 'i7', 'VImaj7', 'V7', 'i7', 'i7'], weight: 4 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'VImaj7', 'VImaj7', 'V7', 'V7', 'V7', 'V7'], weight: 4 }],
    solo: [{ chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 5 }],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['Imaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7'], weight: 5 },
      { chords: ['Imaj7', 'vi7', 'Imaj7', 'vi7', 'IVmaj7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 },
    ],
    chorus: [{ chords: ['IVmaj7', 'V7', 'Imaj7', 'vi7', 'IVmaj7', 'V7', 'Imaj7', 'Imaj7'], weight: 5 }],
    solo: [{ chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7'], weight: 4 }],
    outro: [{ chords: ['Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'], weight: 4 }],
  },
  melodyCells: [
    { cell: [-2, 2, 4, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 5 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [3, 3, 2, 4, 4], weight: 3 },
    { cell: [16], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 4 },
    { cell: [-4, 12], weight: 4 },
  ],
  bass: [
    // Numbers again, and here the shape is a sampled one: whatever the loop had
    // in it, transposed bodily. That is what makes it a number and not a function.
    {
      name: 'loop-shape',
      weight: 6,
      hits: [
        { at: 0, dur: 4, tone: 0, vel: 1 },
        { at: 6, dur: 2, tone: -2, vel: 0.72 },
        { at: 8, dur: 3, tone: 0, vel: 0.86 },
        { at: 12, dur: 2, tone: 3, vel: 0.72 },
        { at: 14, dur: 2, tone: -2, vel: 0.68 },
      ],
    },
    {
      name: 'sub-roots',
      weight: 5,
      hits: [
        { at: 0, dur: 8, tone: 0, vel: 1 },
        { at: 10, dur: 2, tone: 7, vel: 0.7 },
        { at: 12, dur: 4, tone: 0, vel: 0.8 },
      ],
      sustain: true,
    },
  ],
  comp: [
    {
      name: 'looped-rhodes',
      weight: 6,
      voices: 4,
      hits: [{ at: 0, dur: 3, vel: 0.62 }, { at: 6, dur: 2, vel: 0.56 }, { at: 8, dur: 3, vel: 0.6 }, { at: 14, dur: 2, vel: 0.54 }],
    },
    {
      name: 'sampled-stab',
      weight: 4,
      voices: 4,
      hits: [{ at: 0, dur: 2, vel: 0.7 }, { at: 10, dur: 2, vel: 0.62 }],
    },
  ],
  drums: [
    /**
     * Boom bap. The ghosts are on the *even* sixteenths — the eighths between
     * the strokes, which is where a hand falls — rather than on the odd ones a
     * programmer would enter. See the header: that choice leaves the odd
     * neighbours open, so a drawn `Feel.ghost` still has somewhere to go.
     */
    {
      name: 'boom-bap',
      weight: 6,
      voices: { bd: [0, 10], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14] },
      ghosts: { sd: [2, 6, 10, 14] },
    },
    {
      name: 'chopped-break',
      weight: 5,
      voices: {
        bd: [0, 3, 10],
        sd: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
        oh: [7],
      },
      ghosts: { sd: [6, 8, 14] },
    },
    {
      name: 'sparse-loop',
      weight: 3,
      voices: { bd: [0, 8, 11], sd: [4, 12], rd: [0, 4, 8, 12], tb: [2, 6, 10, 14] },
      ghosts: { sd: [2, 14] },
    },
  ],
  melody: { leap: 0.3, ornament: 0.5, span: 13, sequence: 0.35, syncopation: 0.5 },
};

// ---------------------------------------------------------------------------
// 1998 — the quantise comes off
// ---------------------------------------------------------------------------

/**
 * NEO-SOUL — 1998, and the third override.
 *
 * Extended chords over a programmed kit that has been made to breathe. It is the
 * end of the line this genre has been walking since 1965 and the point at which
 * it arrives back where it started: a Rhodes, a fingered bass, a drummer's feel,
 * and harmony that is a great deal more complicated than anything the first era
 * ever attempted.
 *
 * ## The override, and why it is the same one `quietstorm` takes
 *
 * The genre's rule stays in the key over a diatonic chord. Here the chords are
 * `min11`, `maj9` and `dom7sus4`, they sit for two bars each, and a line that
 * treated an `iv11` as a passing chord in the key would be doing the one thing
 * this music never does — moving through it. So the chord wins outright, using the
 * table at the top of this file.
 *
 * There is a second reason and it is the more interesting one. Half the
 * progressions below are *modal interchange*: a `bVII`, a `bIIImaj7`, a `IVmaj9`
 * borrowed from the parallel major over a minor tonic. The genre rule would
 * re-orient onto those and *not* onto the diatonic ones, which would produce a
 * line that changed its mind about which system it was in every other bar. Turning
 * it off entirely is more consistent than turning it on halfway.
 *
 * ## The kit, and the one-sided ghost
 *
 * The ghosts here write the `a` and leave the `e` alone — 7 and 15 rather than 3,
 * 5, 11, 13 — and that is the whole difference between this and `newjack`. The
 * field's own documentation says a figure that ghosts only one side leaves the
 * other to be drawn, which is *a feel completing a pair*. A person playing along
 * with a loop leaves one side; a person programming it fills both. Both records
 * exist and this is the one where somebody is playing.
 */
const neosoul: Style = {
  id: 'neosoul',
  label: 'Neo-soul',
  description:
    'Extended chords over a kit made to breathe: a Rhodes on min11 and maj9, a fingered bass behind the beat, and ghosts on one side of the backbeat only.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [76, 94],
  swing: 0,
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0,
  // Always the chord. See the header — and note that this is the same override
  // `quietstorm` takes and the opposite of `deepsoul`'s.
  scaleForChord: (_tonic, _mode, chord) => chordScale(chord),
  feels: [['laidback', 6], ['pocket', 4], ['straight', 2]],
  transitions: [['fill', 4], ['break', 3], ['elide', 3]],
  breakCarrier: 'comp',
  shots: [[[0], 4], [[0, 6], 3], [[0, 3, 6], 2]],
  vary: { comp: 0.3, bass: 0.2 },
  progressions: {
    intro: [{ chords: ['i11', 'i11', 'i11', 'i11'], weight: 5 }, { chords: ['i9', 'IVmaj9', 'i9', 'IVmaj9'], weight: 3 }],
    verse: [
      { chords: ['i11', 'i11', 'IVmaj9', 'IVmaj9', 'i11', 'i11', 'IVmaj9', 'IVmaj9'], weight: 6, note: 'Two chords, two bars each, and the eleventh sits in the voicing rather than resolving out of it' },
      { chords: ['i9', 'i9', 'VII7sus4', 'VII7sus4', 'VImaj7', 'VImaj7', 'V7', 'V7'], weight: 5 },
      { chords: ['i11', 'iv11', 'VImaj7', 'VII', 'i11', 'iv11', 'VImaj7', 'VII'], weight: 4 },
      { chords: ['i9', 'IIImaj7', 'VImaj7', 'ii%7', 'V7', 'V7', 'i9', 'i9'], weight: 3 },
    ],
    chorus: [
      { chords: ['IVmaj9', 'IVmaj9', 'IIImaj7', 'IIImaj7', 'VImaj7', 'VII', 'i11', 'i11'], weight: 6 },
      { chords: ['VImaj7', 'VII7sus4', 'i11', 'i11', 'VImaj7', 'VII7sus4', 'i11', 'i11'], weight: 4 },
      { chords: ['iv11', 'VII', 'IIImaj7', 'VImaj7', 'ii%7', 'V7', 'i9', 'i9'], weight: 3 },
    ],
    bridge: [{ chords: ['VImaj7', 'VImaj7', 'IVmaj9', 'IVmaj9', 'ii%7', 'V7', 'i11', 'i11'], weight: 4 }],
    solo: [{ chords: ['i11', 'i11', 'IVmaj9', 'IVmaj9', 'i11', 'i11', 'IVmaj9', 'IVmaj9'], weight: 5 }],
    outro: [{ chords: ['IVmaj9', 'i11', 'IVmaj9', 'i11'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'ii7', 'ii7', 'Imaj9', 'Imaj9', 'ii7', 'ii7'], weight: 6 },
      { chords: ['Imaj9', 'bIIImaj7', 'IVmaj9', 'bVImaj7', 'Imaj9', 'bIIImaj7', 'IVmaj9', 'V7'], weight: 4, note: 'Modal interchange, two bars in four, and the line follows every one — which is what the override is for' },
    ],
    chorus: [
      { chords: ['IVmaj9', 'iii7', 'ii7', 'V7', 'IVmaj9', 'iii7', 'Imaj9', 'Imaj9'], weight: 5 },
      { chords: ['ii7', 'V7sus4', 'Imaj9', 'Imaj9', 'ii7', 'V7sus4', 'Imaj9', 'Imaj9'], weight: 4 },
    ],
    bridge: [{ chords: ['vi7', 'ii7', 'IVmaj9', 'Imaj9', 'ii7', 'V7', 'Imaj9', 'Imaj9'], weight: 4 }],
    solo: [{ chords: ['Imaj9', 'Imaj9', 'ii7', 'ii7', 'Imaj9', 'Imaj9', 'ii7', 'ii7'], weight: 4 }],
    outro: [{ chords: ['IVmaj9', 'Imaj9', 'IVmaj9', 'Imaj9'], weight: 4 }],
  },
  melodyCells: [
    { cell: [-2, 2, 4, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [3, 3, 2, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [16], weight: 3 },
    { cell: [-4, 2, 2, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 4 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    // Fingered, behind the beat, and the seventh more often than the fifth. The
    // functions are back, because these changes genuinely move and the part
    // genuinely follows them.
    {
      name: 'behind-the-beat',
      weight: 6,
      hits: [
        { at: 0, dur: 3, tone: 'root', vel: 1 },
        { at: 6, dur: 2, tone: 'seventh', vel: 0.7 },
        { at: 8, dur: 3, tone: 'root', vel: 0.84 },
        { at: 11, dur: 1, tone: 'octave', vel: 0.6 },
        { at: 13, dur: 3, tone: 'fifth', vel: 0.74 },
      ],
    },
    {
      name: 'melodic-neo',
      weight: 5,
      hits: [
        { at: 0, dur: 4, tone: 'root', vel: 1 },
        { at: 5, dur: 1, tone: 'third', vel: 0.62 },
        { at: 6, dur: 2, tone: 'fifth', vel: 0.74 },
        { at: 8, dur: 2, tone: 'seventh', vel: 0.78 },
        { at: 11, dur: 1, tone: 'octave', vel: 0.64 },
        { at: 12, dur: 4, tone: 'fifth', vel: 0.76 },
      ],
    },
    {
      name: 'sub-and-hold',
      weight: 3,
      hits: [{ at: 0, dur: 10, tone: 'root', vel: 1 }, { at: 11, dur: 5, tone: 'seventh', vel: 0.72 }],
      sustain: true,
    },
  ],
  comp: [
    {
      name: 'rhodes-eleven',
      weight: 6,
      voices: 5,
      hits: [{ at: 0, dur: 6, vel: 0.6 }, { at: 7, dur: 3, vel: 0.54 }, { at: 11, dur: 5, vel: 0.56 }],
      voicing: 'spread',
    },
    {
      name: 'clav-and-rhodes',
      weight: 4,
      voices: 4,
      hits: [{ at: 0, dur: 2, vel: 0.62 }, { at: 3, dur: 1, vel: 0.5 }, { at: 6, dur: 2, vel: 0.58 }, { at: 10, dur: 2, vel: 0.56 }, { at: 14, dur: 2, vel: 0.52 }],
    },
    /**
     * A three-beat figure against a four-beat bar. `cycle: 12` comes home every
     * three bars, and this is what a Rhodes player does over two static chords
     * when nothing else is going to move for eight bars.
     */
    {
      name: 'three-beat-rhodes',
      weight: 3,
      voices: 5,
      hits: [{ at: 0, dur: 3, vel: 0.6 }, { at: 5, dur: 2, vel: 0.5 }, { at: 8, dur: 4, vel: 0.55 }],
      cycle: 12,
      voicing: 'spread',
    },
  ],
  drums: [
    /**
     * One side only. The `a` of each backbeat is written and the `e` is left for
     * a drawn `Feel.ghost` to complete — see the header, and see `newjack`, which
     * writes both and therefore absorbs the draw entirely.
     */
    {
      name: 'breathing-loop',
      weight: 6,
      voices: { bd: [0, 6, 10], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14] },
      ghosts: { sd: [7, 15] },
    },
    {
      name: 'stuttered-kick',
      weight: 5,
      voices: {
        bd: [0, 3, 8, 10, 11],
        sd: [4, 12],
        hh: [0, 2, 3, 4, 6, 8, 10, 11, 12, 14],
        tb: [2, 6, 10, 14],
      },
      ghosts: { sd: [7, 15] },
    },
    {
      name: 'rim-and-hands',
      weight: 4,
      voices: {
        bd: [0, 10],
        rim: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
        mp: [2, 6, 11, 14],
        hp: [7],
      },
      ghosts: { sd: [15] },
    },
  ],
  melody: { leap: 0.3, ornament: 0.55, span: 13, sequence: 0.3, syncopation: 0.5 },
};

/**
 * OFF-GRID — the drunk loop, 1999, and the fourth override.
 *
 * A record whose entire proposition is that the drums are wrong. Nothing is
 * quantised, the snare arrives late and the hi-hat arrives early, and the two
 * disagree by enough that a listener counts the bar twice to check. It is the one
 * style in this genre that is a *technique* rather than a repertoire, which is
 * usually a reason not to give something a table — and here it is not, because the
 * technique produced a body of records that sound like nothing before them.
 *
 * **What this style is really made of is `Feel.laidback`, and that is where the
 * limit is.** The feel pushes bass, comp, pad, brass and the snare late in
 * milliseconds, which is most of the gesture. What it cannot do is push them
 * *different amounts on different strokes* — the actual thing on these records is
 * that the second backbeat drags further than the first — and there is no field
 * for that. It is the same shape as `docs/engine-gaps.md` §1.1: a per-event timing
 * offset would be a new axis rather than a new number. The kit tables below get as
 * close as slots allow by writing the second half of the bar a sixteenth off where
 * the first half puts it, which is a displacement rather than a drag and is
 * audibly a different thing.
 *
 * The harmony is `neosoul`'s and takes the same override, for the same reason.
 */
const offgrid: Style = {
  id: 'offgrid',
  label: 'Off-grid',
  description:
    'The drunk loop: nothing quantised, the second backbeat further behind than the first, and a hi-hat that disagrees with the snare about where the bar is.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [80, 94],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  scaleForChord: (_tonic, _mode, chord) => chordScale(chord),
  // The style, as far as the engine can state it. See the header for what is
  // missing.
  feels: [['laidback', 7], ['pocket', 3]],
  transitions: [['fill', 3], ['break', 4], ['elide', 3]],
  breakCarrier: 'comp',
  shots: [[[0], 4], [[0, 10], 2]],
  progressions: {
    intro: [{ chords: ['i11', 'i11', 'i11', 'i11'], weight: 5 }],
    verse: [
      { chords: ['i11', 'i11', 'i11', 'i11', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9'], weight: 6, note: 'Four bars a chord, because the record is two bars long and everything else is repetition' },
      { chords: ['i9', 'i9', 'VImaj7', 'VImaj7', 'i9', 'i9', 'VImaj7', 'VImaj7'], weight: 5 },
      { chords: ['i11', 'VII7sus4', 'i11', 'VII7sus4', 'i11', 'VII7sus4', 'VImaj7', 'VImaj7'], weight: 4 },
    ],
    chorus: [
      { chords: ['VImaj7', 'VII', 'i11', 'i11', 'VImaj7', 'VII', 'i11', 'i11'], weight: 6 },
      { chords: ['IVmaj9', 'IVmaj9', 'IIImaj7', 'IIImaj7', 'VImaj7', 'VImaj7', 'i11', 'i11'], weight: 4 },
    ],
    bridge: [{ chords: ['iv11', 'iv11', 'VImaj7', 'VImaj7', 'V7', 'V7', 'i11', 'i11'], weight: 4 }],
    solo: [{ chords: ['i11', 'i11', 'i11', 'i11', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9'], weight: 5 }],
    outro: [{ chords: ['i11', 'i11', 'i11', 'i11'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'ii7', 'ii7', 'ii7', 'ii7'], weight: 5 }],
    chorus: [{ chords: ['IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'ii7', 'V7sus4', 'Imaj9', 'Imaj9'], weight: 5 }],
    solo: [{ chords: ['Imaj9', 'Imaj9', 'ii7', 'ii7', 'Imaj9', 'Imaj9', 'ii7', 'ii7'], weight: 4 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 4 }],
  },
  melodyCells: [
    { cell: [-2, 2, 4, 8], weight: 5 },
    { cell: [-4, 4, 8], weight: 5 },
    { cell: [3, 3, 2, 8], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [-6, 2, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [16], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 5 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    {
      name: 'dragging',
      weight: 6,
      hits: [
        { at: 0, dur: 3, tone: 0, vel: 1 },
        { at: 7, dur: 2, tone: -2, vel: 0.7 },
        { at: 9, dur: 3, tone: 0, vel: 0.82 },
        { at: 13, dur: 3, tone: 7, vel: 0.7 },
      ],
    },
    {
      name: 'sub-drone',
      weight: 4,
      hits: [{ at: 0, dur: 11, tone: 0, vel: 1 }, { at: 11, dur: 5, tone: -2, vel: 0.7 }],
      sustain: true,
    },
  ],
  comp: [
    {
      name: 'loose-rhodes',
      weight: 6,
      voices: 5,
      hits: [{ at: 0, dur: 5, vel: 0.58 }, { at: 7, dur: 3, vel: 0.5 }, { at: 11, dur: 5, vel: 0.54 }],
      voicing: 'spread',
    },
    // A five-beat figure against a four-beat bar. It takes four bars to come home
    // and it never lands where the last one did, which is the point.
    {
      name: 'five-beat-figure',
      weight: 4,
      voices: 4,
      hits: [{ at: 0, dur: 3, vel: 0.58 }, { at: 6, dur: 2, vel: 0.5 }, { at: 12, dur: 4, vel: 0.52 }],
      cycle: 20,
    },
  ],
  drums: [
    /**
     * The second half of the bar written a sixteenth off where the first half
     * puts it. It is a displacement rather than a drag — see the header for why
     * the real gesture is not available — and it is the closest a slot grid gets.
     */
    {
      name: 'lopsided',
      weight: 6,
      voices: { bd: [0, 11], sd: [4, 13], hh: [0, 2, 4, 6, 8, 10, 12, 14] },
      ghosts: { sd: [7, 15] },
    },
    {
      name: 'stumbling',
      weight: 5,
      voices: {
        bd: [0, 3, 9],
        sd: [4, 12],
        hh: [1, 2, 4, 6, 9, 10, 12, 14],
      },
      ghosts: { sd: [6, 15] },
    },
    {
      name: 'hands-and-rim',
      weight: 3,
      voices: {
        bd: [0, 11],
        rim: [4, 13],
        sh: [0, 2, 4, 6, 8, 10, 12, 14],
        mp: [3, 7, 10, 15],
      },
      ghosts: { sd: [6] },
    },
  ],
  melody: { leap: 0.28, ornament: 0.5, span: 12, sequence: 0.25, syncopation: 0.55 },
};

/**
 * BEDROOM — 2001, and the smallest record here.
 *
 * One person, a sampler, a keyboard and a microphone. It is the only style in this
 * genre with no band on it at all, which is why it is the only one that declares
 * `excludeLayers` — no horn section, because there is nobody to be one, and no
 * counter-melody, because the same person sang both parts and only one of them
 * survives to the mixdown.
 *
 * **The production is the style, and it is spelled in `Style.effects`.** A lowpass
 * at 6 kHz across every layer is what a record made on consumer equipment and
 * bounced through a cassette actually sounds like, and the field's own doc argues
 * this exact case: a style reaches it only when a version of the piece without the
 * treatment would be a *different piece* rather than a period variant. Take the
 * filter off this and it is a slightly thin neo-soul demo; leave it on and it is
 * what it is. The style goes over the era, so this is a lo-fi record whichever
 * decade it is drawn in, and `lowpass` is named on every layer here for the same
 * reason `dub` names its reverb.
 *
 * `requireLayers: ['comp']` is the one appearance of that field in this genre, and
 * it is not about texture. Everything else has been excluded or is optional, and
 * without it the arrangement is entitled to produce a section with no chord
 * instrument in it — which for a record that is one person and a keyboard is not a
 * sparse arrangement, it is nothing.
 */
const bedroom: Style = {
  id: 'bedroom',
  label: 'Bedroom soul',
  description:
    'One person, a sampler and a microphone, bounced through a cassette: no horns, no answering line, and a lowpass at six kilohertz that is the record.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [70, 88],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  // There is nobody else in the room. See the header.
  excludeLayers: ['brass', 'counter'],
  requireLayers: ['comp'],
  /**
   * The treatment is the piece. `Style.effects` goes over the era's, which is the
   * whole reason it exists — an era says how bright a decade's records were on
   * average and this is a member of that average that is deliberately much darker
   * than it.
   */
  effects: {
    melody: { lowpass: 6000, reverb: 0.3 },
    comp: { lowpass: 5500, reverb: 0.24 },
    bass: { lowpass: 2200, reverb: 0.05 },
    drums: { lowpass: 6500, reverb: 0.2 },
    pad: { lowpass: 4000, reverb: 0.4 },
    vocal: { lowpass: 6500, reverb: 0.32 },
  },
  feels: [['laidback', 6], ['halftime', 3], ['straight', 2]],
  transitions: [['fill', 3], ['break', 3], ['elide', 3]],
  breakCarrier: 'comp',
  shots: [[[0], 4]],
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
    verse: [
      { chords: ['i9', 'i9', 'IVmaj9', 'IVmaj9', 'i9', 'i9', 'IVmaj9', 'IVmaj9'], weight: 6 },
      { chords: ['i11', 'i11', 'VImaj7', 'VImaj7', 'i11', 'i11', 'VII', 'VII'], weight: 5 },
      { chords: ['i9', 'VII7sus4', 'VImaj7', 'V7', 'i9', 'VII7sus4', 'VImaj7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['VImaj7', 'VII', 'i9', 'i9', 'VImaj7', 'VII', 'i9', 'i9'], weight: 6 },
      { chords: ['iv9', 'VII', 'IIImaj7', 'VImaj7', 'iv9', 'V7', 'i9', 'i9'], weight: 3 },
    ],
    bridge: [{ chords: ['IVmaj9', 'IVmaj9', 'VImaj7', 'VImaj7', 'i9', 'i9', 'i9', 'i9'], weight: 4 }],
    solo: [{ chords: ['i9', 'i9', 'IVmaj9', 'IVmaj9', 'i9', 'i9', 'IVmaj9', 'IVmaj9'], weight: 4 }],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['Imaj9', 'Imaj9', 'ii7', 'ii7', 'Imaj9', 'Imaj9', 'ii7', 'ii7'], weight: 5 }],
    chorus: [{ chords: ['IVmaj9', 'V7sus4', 'Imaj9', 'Imaj9', 'IVmaj9', 'V7sus4', 'Imaj9', 'Imaj9'], weight: 5 }],
    solo: [{ chords: ['Imaj9', 'Imaj9', 'ii7', 'ii7', 'Imaj9', 'Imaj9', 'ii7', 'ii7'], weight: 4 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 4 }],
  },
  melodyCells: [
    { cell: [-4, 4, 8], weight: 5 },
    { cell: [8, 8], weight: 5 },
    { cell: [-2, 2, 4, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [-8, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    {
      name: 'soft-sub',
      weight: 6,
      hits: [{ at: 0, dur: 8, tone: 0, vel: 1 }, { at: 9, dur: 3, tone: 7, vel: 0.7 }, { at: 13, dur: 3, tone: 0, vel: 0.76 }],
      sustain: true,
    },
    {
      name: 'two-finger',
      weight: 4,
      hits: [
        { at: 0, dur: 4, tone: 'root', vel: 1 },
        { at: 6, dur: 2, tone: 'seventh', vel: 0.68 },
        { at: 8, dur: 4, tone: 'root', vel: 0.8 },
        { at: 13, dur: 3, tone: 'fifth', vel: 0.7 },
      ],
    },
  ],
  comp: [
    {
      name: 'one-keyboard',
      weight: 7,
      voices: 5,
      hits: [{ at: 0, dur: 8, vel: 0.6 }, { at: 8, dur: 8, vel: 0.55 }],
      sustain: true,
      voicing: 'spread',
    },
    {
      name: 'thumbed-chords',
      weight: 4,
      voices: 4,
      hits: [{ at: 0, dur: 3, vel: 0.6 }, { at: 6, dur: 2, vel: 0.5 }, { at: 10, dur: 2, vel: 0.54 }, { at: 14, dur: 2, vel: 0.48 }],
    },
  ],
  drums: [
    {
      name: 'cassette-loop',
      weight: 6,
      voices: { bd: [0, 10], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14] },
      ghosts: { sd: [7, 15] },
    },
    {
      name: 'brushed-tape',
      weight: 4,
      voices: { bd: [0, 8], rim: [4, 12], sh: [0, 2, 4, 6, 8, 10, 12, 14] },
      ghosts: { sd: [6, 14] },
    },
  ],
  melody: { leap: 0.26, ornament: 0.45, span: 12, sequence: 0.3, syncopation: 0.45 },
};

/**
 * CONTEMPORARY — 1999, and the most expensive record in the file.
 *
 * The big-budget R&B ballad: a programmed kit with a real string section over it,
 * a stack of eight backing vocals, and a lead line whose whole purpose is to be
 * difficult. It is the commercial end of everything above and it is written as
 * such — the harmony is `ballad`'s with an extra note per chord, the kit is
 * `slowjam`'s with more money spent on it, and what is genuinely its own is the
 * melodic writing.
 *
 * `melody.ornament` at 0.75 is the highest number in the file and it is not a
 * taste. This is the style where the run *is* the hook — where a listener is being
 * sold a performance rather than a song, and where a plainly sung line would be a
 * demo of the arrangement rather than the record. `ache` and `smoulder` in
 * `moods.ts` multiply it further, which is intended: at those settings this style
 * decorates almost every note it sings, and it should.
 *
 * `chorusBars` is deliberately absent. A record like this genuinely does have a
 * chorus longer than eight bars, and the field exists for a fixed-length form
 * rather than for a long section; `index.ts` has a sixteen-bar-chorus form in the
 * pool instead, which is the right mechanism and gets the length without claiming
 * the whole song is built on it.
 */
const contemporary: Style = {
  id: 'contemporary',
  label: 'Contemporary R&B',
  description:
    'The expensive one: a programmed kit under a real string section, eight backing vocals, and a lead line written so that the run is the hook.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [64, 84],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  feels: [['straight', 5], ['halftime', 4], ['laidback', 3]],
  transitions: [['fill', 5], ['break', 3], ['elide', 2]],
  breakCarrier: 'melody',
  shots: [[[0], 4], [[0, 6], 3], [[0, 8], 2]],
  progressions: {
    intro: [{ chords: ['Imaj9', 'Imaj9', 'vi7', 'V7'], weight: 5 }],
    verse: [
      { chords: ['Imaj9', 'iii7', 'vi7', 'IVmaj9', 'Imaj9', 'iii7', 'ii7', 'V7'], weight: 6 },
      { chords: ['vi7', 'V7', 'IVmaj9', 'iii7', 'ii7', 'V7', 'Imaj9', 'Imaj9'], weight: 5, note: 'The descending bass, which is the arranger’s one gesture and it is used every time' },
      { chords: ['Imaj9', 'Imaj9', 'IVmaj9', 'iv', 'Imaj9', 'vi7', 'ii7', 'V7'], weight: 4 },
    ],
    chorus: [
      { chords: ['IVmaj9', 'V7', 'iii7', 'vi7', 'IVmaj9', 'V7', 'Imaj9', 'Imaj9'], weight: 6 },
      { chords: ['IVmaj9', 'V7sus4', 'Imaj9', 'vi7', 'IVmaj9', 'V7', 'Imaj9', 'V7'], weight: 5 },
      { chords: ['vi7', 'IVmaj9', 'Imaj9', 'V7', 'vi7', 'IVmaj9', 'ii7', 'V7'], weight: 3 },
    ],
    bridge: [
      { chords: ['IVmaj9', 'iv', 'iii7', 'vi7', 'ii7', 'V7', 'V7', 'V7'], weight: 5 },
      { chords: ['vi7', 'V/V', 'V7', 'V7', 'IVmaj9', 'V7', 'V7', 'V7'], weight: 3 },
    ],
    solo: [{ chords: ['Imaj9', 'iii7', 'vi7', 'IVmaj9', 'Imaj9', 'iii7', 'ii7', 'V7'], weight: 5 }],
    outro: [{ chords: ['IVmaj9', 'V7', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i9', 'VII', 'VImaj7', 'V7', 'i9', 'iv9', 'V7', 'V7'], weight: 5 },
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'VImaj7', 'ii%7', 'V7', 'i9'], weight: 4 },
    ],
    chorus: [{ chords: ['VImaj7', 'VII', 'i9', 'i9', 'iv9', 'V7', 'i9', 'i9'], weight: 5 }],
    bridge: [{ chords: ['VImaj7', 'IIImaj7', 'iv9', 'i9', 'ii%7', 'V7', 'V7', 'V7'], weight: 4 }],
    solo: [{ chords: ['i9', 'VII', 'VImaj7', 'V7', 'i9', 'iv9', 'V7', 'V7'], weight: 4 }],
    outro: [{ chords: ['iv9', 'V7', 'i9', 'i9'], weight: 4 }],
  },
  melodyCells: [
    { cell: [-2, 2, 4, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [16], weight: 3 },
    { cell: [3, 3, 2, 4, 4], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-4, 12], weight: 4 },
    { cell: [-8, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    {
      name: 'programmed-sub',
      weight: 6,
      hits: [
        { at: 0, dur: 6, tone: 'root', vel: 1 },
        { at: 7, dur: 1, tone: 'octave', vel: 0.62 },
        { at: 8, dur: 4, tone: 'fifth', vel: 0.8 },
        { at: 13, dur: 3, tone: 'approach', vel: 0.72 },
      ],
    },
    {
      name: 'descending-line',
      weight: 5,
      hits: [
        { at: 0, dur: 4, tone: 'root', vel: 1 },
        { at: 4, dur: 4, tone: 'seventh', vel: 0.76 },
        { at: 8, dur: 4, tone: 'fifth', vel: 0.82 },
        { at: 12, dur: 4, tone: 'third', vel: 0.74 },
      ],
    },
  ],
  comp: [
    {
      name: 'wide-piano',
      weight: 6,
      voices: 5,
      hits: [{ at: 0, dur: 8, vel: 0.6 }, { at: 8, dur: 8, vel: 0.56 }],
      voicing: 'spread',
    },
    {
      name: 'arpeggiated-keys',
      weight: 5,
      voices: 5,
      hits: [
        { at: 0, dur: 2, vel: 0.58 }, { at: 2, dur: 2, vel: 0.5 },
        { at: 4, dur: 2, vel: 0.56 }, { at: 6, dur: 2, vel: 0.5 },
        { at: 8, dur: 2, vel: 0.58 }, { at: 10, dur: 2, vel: 0.5 },
        { at: 12, dur: 2, vel: 0.56 }, { at: 14, dur: 2, vel: 0.5 },
      ],
      arpeggio: true,
      arpDirection: 'updown',
      arpOctaves: 2,
    },
  ],
  drums: [
    {
      name: 'programmed-ballad',
      weight: 6,
      voices: { bd: [0, 6, 8], sd: [4, 12], cp: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14] },
      ghosts: { sd: [3, 11] },
    },
    {
      name: 'sixteenth-programme',
      weight: 5,
      voices: {
        bd: [0, 8, 11],
        sd: [4, 12],
        hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        tb: [2, 6, 10, 14],
      },
      ghosts: { sd: [7, 15] },
    },
    {
      name: 'half-time-big',
      weight: 3,
      voices: { bd: [0, 10], sd: [8], cp: [8], hh: [0, 2, 4, 6, 8, 10, 12, 14] },
      ghosts: { sd: [4, 12] },
    },
  ],
  // The highest ornament figure in the file. See the header — here the run is the
  // hook rather than a decoration on one.
  melody: { leap: 0.34, ornament: 0.75, span: 15, sequence: 0.25, syncopation: 0.4 },
};

export const STYLES: Record<string, Style> = {
  motown, stax, doowop, girlgroup, southern, deepsoul,
  gospelsoul, blueeyed, stomper, funksoul,
  philly, chicago, discosoul, crossover, ballad, quietstorm,
  synthsoul, newjack, slowjam, hiphopsoul,
  neosoul, offgrid, bedroom, contemporary,
};
