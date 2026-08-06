/**
 * The hiphop catalogue, 1979–2020.
 *
 * Organised by **what the loop is made of and who is holding the bottom**,
 * because those are the two questions on which this repertoire actually
 * separates. Sort it by tempo and a Miami bass record files beside a jungle
 * twelve; sort it by harmony and all twenty-four collapse, because most of them
 * have two chords and eleven have one. Sort it by *what is repeating* — a band
 * playing a break, four bars lifted off somebody's record, a pattern drawn a
 * step at a time into a machine, a sub-bass note held under nothing — and they
 * stay apart, because that choice decides the drums, the register, the mix and
 * whether there is a person on the stage at all.
 *
 * ## The four things every table below is made of
 *
 * **The loop is the composition.** Two bars, four at the outside, and the fact
 * that it does not develop is the form rather than a limitation of it. Twelve of
 * the twenty-four verse tables below are one chord for eight bars and six more
 * are two chords alternating; where a table has four it is because the source
 * record had four, and the whole of the harmonic event is that bar three is not
 * bar one. `Genre.comping` is set lower here than anywhere else in the project
 * for the same reason — see `hiphop/index.ts` — because a sample that varied
 * would not be a sample.
 *
 * **The bottom is a written figure and it is spelled in numbers.** Every bass
 * row here uses **semitones from the chord root, taken literally**, and never
 * `root`/`fifth`/`seventh`. The named functions re-outline whatever chord they
 * land on; an 808 line is a *shape* that was drawn once and triggered, and a
 * shape that renegotiates with the harmony has stopped being one. `BassTone`
 * argues the same thing from the other end and funk's table says it too.
 *
 * **No figure spans more than a twelfth**, and that is a ceiling rather than a
 * taste. `generateBass` places the root within a tritone of MIDI 40 and repairs
 * only by whole octaves, so a wider shape folds flat at some root positions and
 * comes out as two notes on one pitch. The obvious 808 gesture — the root, then
 * the same note an octave down — is exactly the figure that hits it. Every row
 * below stays inside twelve semitones, the octave leaps are written as `12` from
 * a low root rather than as `-12` from a high one, and `npm run genres` catches
 * the mistake as *"a riff is the same shape over every chord quality"*.
 *
 * Six of those rows — three under `drill` and three under `gfunk` — reach part of
 * their span by **gliding** to it rather than by striking it, and that changes
 * nothing about this ceiling. `generateBass` folds a destination into the same
 * reduce as an arrival, so a `glide: 12` spends an octave of headroom whether or
 * not an octave is ever struck; a table that adopted the field by widening its
 * figures would have walked straight back into the fold this paragraph is about.
 * Neither style widened anything. Both were already writing the destination as a
 * second struck note, so every span below is the number it was.
 *
 * **The hole is bigger here than in funk, and it is bigger on purpose.** A JB
 * bar has six onsets in sixteen slots; a trap bar has three, and one of them is
 * three beats long. The sparsest tables below — `trap`, `drill`, `cloud`,
 * `minimal` — are not thin versions of the busy ones, they are the point: what
 * the ear is being asked to hear is the *space around* the kick, and a generator
 * that filled it would produce something perfectly respectable that nobody has
 * ever released.
 *
 * ## Ghost notes, and the line they draw down the middle of this catalogue
 *
 * `DrumPattern.ghosts` is the field this genre would have been written wrong
 * without. A ghost is a stroke played deliberately under audibility — the snare
 * at roughly a quarter of the backbeat, filling the sixteenths nobody is
 * supposed to count — and in a sampled break it is most of what is actually
 * being heard. Funk's `breakbeat` header records the compromise this replaces:
 * *"ghost notes are not expressible per hit, so what is written here is where
 * the loud strokes are."*
 *
 * **Half of this catalogue writes them and half writes none, and the split is
 * the genre's central fact.** Thirteen styles below are built on a recording of
 * a drummer — `oldschool`, `breaks`, `boombap`, `jazzrap`, `soulloop`,
 * `hornloop`, `hardcore`, `conscious`, `party`, `gfunk`, `bounce`, `lofi`,
 * `abstract` — and every one of them ghosts the snare, because the thing being
 * sampled is a person's left hand and the ghosts are the whole of what makes it
 * one. Ninety-one written ghost strokes across those thirteen tables, and in a
 * `boombap` render they are 59.5% of the snare events by count and almost none
 * of it by level. The other eleven are drawn into a machine a step at a time,
 * and a step has one velocity: `electrorap`, `miami`, `clubrap`, `dirtysouth`,
 * `crunk`, `chopped`, `phonk`, `trap`, `drill`, `cloud` and `minimal` write no
 * ghost row at all, and their **silence in this field is a claim** rather than
 * an omission. An 808 pattern with ghost notes on it is a person pretending to
 * be a machine pretending to be a person.
 *
 * Where they are written they are written *around the backbeat*, on the odd
 * sixteenths either side of it, which is where a drawn `Feel.ghost` would have
 * put them — so writing one **spends** it, and a figure that ghosts both sides
 * absorbs the drawn ghosting entirely. Three styles here deliberately ghost only
 * one side, so a `pocket` or `funk` feel completes the pair; `DrumPattern.ghosts`
 * documents the arithmetic and the measurement.
 *
 * ## What is uniform across all twenty-four, and why
 *
 *  - **`relativeMajorChorus: 0` everywhere.** A lift into the relative major is
 *    an arranger's gesture and there is nobody here to make it. The chorus in
 *    this music arrives because the hook came back and the beat opened up, not
 *    because the harmony went somewhere.
 *  - **`swing` is zero on nineteen of them.** The five exceptions are the
 *    sampler styles, and there it is small — 0.14 to 0.2 — because what is being
 *    described is not a triplet feel but the **MPC's swing knob**, which nudges
 *    every second sixteenth late by a percentage and was set between 54% and 62%
 *    on most of the records this half of the catalogue is about. A jazz swing at
 *    0.5 would delete the sixteenth grid; 0.16 leans on it.
 *  - **`syncopation` is high and the reason is the opposite of funk's.** There
 *    the anticipated downbeat is how the phrase finds The One. Here the hook is
 *    a two-bar fragment that starts wherever the source record's bar happened to
 *    be cut, so a figure that respects the barline sounds *quantised* — which is
 *    the one thing a chopped sample never is.
 *  - **`hook` is `earworm` on seventeen of the twenty-four**, against the
 *    genre's own default of the same. The four that step down to `catchy` are
 *    the ones playing somebody else's changes, where there is a progression for
 *    a tune to be about.
 *
 * ## `cycle`, and the styles that need it
 *
 * A loop is nearly always two bars rather than one, and `cycle: 32` is how that
 * is said: a figure that answers its own first half, which a bar-shaped pattern
 * structurally cannot do. **Twenty-two of the twenty-four styles carry one**,
 * which is the number that makes the point — this is not a device a few styles
 * reach for, it is what a hip-hop loop *is*, and the two hold-outs are the
 * interesting ones rather than the twenty-two. It said "nine" for a long time,
 * and nine is not a count of anything: the bass layer alone carries 21, the
 * drums 7 and the comp 6.
 *
 * `cycle: 12` is three beats against four and comes home every three bars — the
 * dotted-eighth figure that is `drill`'s signature and is inexpressible any
 * other way. **It is a comp figure and not a hi-hat**, in all six styles that
 * write one, `drill`'s being `plucked-phrygian`; this paragraph called it a hat
 * for as long as it has existed, and the drum tables have never held a 12.
 * `cycle: 24` is a bar and a half, which is what a chopped percussion loop does
 * against a snare that has stayed where it was — one style, `bounce`.
 */

import { makeScale } from '../../core/scale.js';
import type { Style } from '../../style/types.js';

/**
 * OLD SCHOOL — 1979, and the only style here with a band on the stage.
 *
 * Two turntables and a disco record, or — on the sides that actually got
 * pressed — a house band playing the break of that disco record for six minutes
 * because a fifteen-minute rap would not fit on a loop of tape. That second
 * version is what this table describes, and it is the reason the style has a
 * `comp` figure that chanks and a bass that walks: the personnel are a funk
 * rhythm section, the tempo is disco's, and the only thing separating it from
 * `funk/disco` next door is that nobody is singing over it.
 *
 * The `chorus` table is the one moment of harmonic content in the style and it
 * is a **turnaround** rather than a modulation. Four bars of the ♭VII and back
 * is what the source records did at the end of every sixteen, and putting it in
 * the chorus is the same decision funk's `vamp` makes for the same reason: the
 * section boundary *is* the chord change.
 *
 * `boxDrums: false`. The whole proposition is a drummer holding a break steady
 * enough to be cut back and forth between two copies of it, and a preset box
 * cannot be cut because it never varies. This is the one place in the genre
 * where that field is a musical statement rather than a period one.
 */
const oldschool: Style = {
  id: 'oldschool',
  label: 'Old school',
  description:
    'The disco break played live for six minutes: a chanking guitar, a bass that walks, and a drummer holding it steady enough to cut.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [104, 118],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  boxDrums: false,
  hook: 'earworm',
  feels: [['funk', 5], ['straight', 4], ['pocket', 2]],
  transitions: [['fill', 4], ['break', 4], ['shot', 2]],
  shots: [[[0, 6], 4], [[0, 6, 10], 3], [[0, 3, 6], 2]],
  progressions: {
    intro: [{ chords: ['I7', 'I7', 'I7', 'I7'], weight: 5 }],
    verse: [
      { chords: ['I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7'], weight: 6, note: 'Eight bars of the break. The record has no more harmony than this and does not want any' },
      { chords: ['I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9', 'I9'], weight: 4 },
      { chords: ['I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'I7', 'I7'], weight: 3 },
    ],
    chorus: [
      { chords: ['bVII', 'bVII', 'I7', 'I7', 'bVII', 'bVII', 'I7', 'I7'], weight: 5, note: 'The turnaround the source record played every sixteen bars, promoted to a section' },
      { chords: ['IV7', 'IV7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7'], weight: 4 },
    ],
    solo: [{ chords: ['I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7'], weight: 5 }],
    outro: [{ chords: ['I7', 'I7', 'I7', 'I7'], weight: 5 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'iv9', 'iv9', 'i9', 'i9'], weight: 3 },
    ],
    chorus: [{ chords: ['VII', 'VII', 'i7', 'i7', 'VII', 'VII', 'i7', 'i7'], weight: 5 }],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [3, 3, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 3 },
    { cell: [-4, 2, 2, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    // The disco walk, four to the bar with the octave on the and. Written from
    // the root upward so the shape spans an octave exactly and never folds.
    { name: 'disco-octave', weight: 6, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 2, dur: 2, tone: 12, vel: 0.62 },
      { at: 4, dur: 2, tone: 0, vel: 0.8 },
      { at: 6, dur: 2, tone: 12, vel: 0.6 },
      { at: 8, dur: 2, tone: 0, vel: 0.84 },
      { at: 10, dur: 2, tone: 12, vel: 0.6 },
      { at: 12, dur: 2, tone: 0, vel: 0.78 },
      { at: 14, dur: 2, tone: 10, vel: 0.6 },
    ] },
    { name: 'break-riff', weight: 5, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.66 },
      { at: 10, dur: 2, tone: 3, vel: 0.74 },
      { at: 12, dur: 4, tone: 5, vel: 0.7 },
    ] },
    { name: 'two-bar-walk', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.62 },
      { at: 10, dur: 2, tone: 10, vel: 0.7 },
      { at: 12, dur: 4, tone: 12, vel: 0.68 },
      { at: 16, dur: 4, tone: 7, vel: 0.86 },
      { at: 22, dur: 2, tone: 5, vel: 0.64 },
      { at: 26, dur: 2, tone: 3, vel: 0.66 },
      { at: 28, dur: 4, tone: 0, vel: 0.72 },
    ] },
  ],
  comp: [
    { name: 'chank', weight: 6, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.14 }, { at: 1, dur: 1, vel: 0.1 },
      { at: 2, dur: 1, vel: 0.68 }, { at: 3, dur: 1, vel: 0.12 },
      { at: 6, dur: 1, vel: 0.7 }, { at: 7, dur: 1, vel: 0.12 },
      { at: 10, dur: 1, vel: 0.66 }, { at: 11, dur: 1, vel: 0.1 },
      { at: 14, dur: 1, vel: 0.72 }, { at: 15, dur: 1, vel: 0.12 },
    ] },
    { name: 'four-stabs', weight: 4, voices: 4, hits: [
      { at: 2, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.66 },
      { at: 10, dur: 2, vel: 0.72 }, { at: 14, dur: 2, vel: 0.64 },
    ] },
    { name: 'organ-bed', weight: 2, voices: 4, sustain: true, hits: [
      { at: 0, dur: 16, vel: 0.4 },
    ] },
  ],
  drums: [
    /**
     * The break itself, and the ghosts are the reason it is worth sampling.
     * Four ghosted sixteenths around the two backbeats is the whole left hand of
     * the drummer this record is remembered for, and it is exactly the set of
     * slots a drawn `Feel.ghost` would otherwise have gone to — so writing them
     * here spends the draw rather than doubling it.
     */
    { name: 'the-break', weight: 6,
      voices: {
        bd: [0, 10],
        sd: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
      },
      ghosts: { sd: [3, 5, 11, 13] } },
    { name: 'four-on-the-floor', weight: 4,
      voices: {
        bd: [0, 4, 8, 12],
        sd: [4, 12],
        oh: [2, 6, 10, 14],
        hh: [0, 4, 8, 12],
      },
      ghosts: { sd: [7, 15] } },
    { name: 'rolling-break', weight: 3, cycle: 32,
      voices: {
        bd: [0, 3, 10, 16, 22, 26],
        sd: [4, 12, 20, 28, 30],
        hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      },
      ghosts: { sd: [7, 15, 23] } },
  ],
  melody: { leap: 0.24, ornament: 0.2, span: 12, sequence: 0.7, syncopation: 0.68 },
};

/**
 * ELECTRO RAP — 1983, and the first record here with nobody in the room.
 *
 * An 808, a monophonic synth bass entered on a grid, and a vocoder. The drum
 * machine is the whole arrangement: what a band was doing four years earlier is
 * now four sounds and a step sequencer, and the *thinness* is the aesthetic
 * rather than a limitation somebody was working around.
 *
 * **No ghost row, and this is the style where that first becomes a statement.**
 * A step on an 808 has one velocity and one accent switch; there is no left hand
 * to play under the level of the right, and a ghosted 808 snare would be a
 * machine imitating the drummer it had just replaced. Everything from here to
 * `drill` inherits the silence.
 *
 * The kick pattern is the era's signature and it is the tresillo — 0, 6, 12 —
 * with the third stroke landing where a fourth beat would be if this were a
 * dance record. `cowbell` is in the second figure because the 808's cowbell is
 * the one voice on that machine nobody has ever used quietly.
 */
const electrorap: Style = {
  id: 'electrorap',
  label: 'Electro rap',
  description:
    'An 808 and a sequenced synth bass at 1983: a tresillo kick, a handclap where the snare was, and no hands anywhere.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [108, 124],
  swing: 0,
  modeWeights: { minor: 0.7, major: 0.3 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['straight', 7], ['driving', 2]],
  transitions: [['fill', 4], ['break', 3], ['shot', 2]],
  shots: [[[0, 6, 12], 5], [[0, 6], 3], [[0, 3, 6, 12], 2]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6, note: 'One chord. The sequencer has no way of changing its mind and nobody asked it to' },
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 4 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 4 },
    ],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['bVII', 'bVII', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [3, 3, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [-2, 2, 4, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 2, 2, 2, 2], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    // The sequenced octave, and the only shape on the machine. Twelve semitones
    // exactly, written upward from the root — see the header on the fold.
    { name: 'sequenced-octave', weight: 6, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 3, dur: 1, tone: 0, vel: 0.6 },
      { at: 6, dur: 2, tone: 12, vel: 0.72 },
      { at: 10, dur: 2, tone: 0, vel: 0.8 },
      { at: 12, dur: 2, tone: 12, vel: 0.6 },
      { at: 14, dur: 2, tone: 0, vel: 0.66 },
    ] },
    { name: 'tresillo', weight: 5, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 4, tone: 0, vel: 0.76 },
      { at: 12, dur: 4, tone: 7, vel: 0.72 },
    ] },
    { name: 'two-bar-sequence', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 0, vel: 0.66 },
      { at: 8, dur: 2, tone: 7, vel: 0.7 },
      { at: 12, dur: 2, tone: 10, vel: 0.68 },
      { at: 16, dur: 2, tone: 12, vel: 0.82 },
      { at: 20, dur: 2, tone: 10, vel: 0.64 },
      { at: 24, dur: 2, tone: 7, vel: 0.66 },
      { at: 28, dur: 4, tone: 0, vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'stab-pair', weight: 5, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.72 }, { at: 6, dur: 2, vel: 0.66 },
    ] },
    { name: 'sixteenth-sequence', weight: 4, voices: 3, arpeggio: true, arpDirection: 'updown',
      arpOctaves: 2, cycle: 12, hits: [
        { at: 0, dur: 1, vel: 0.6 }, { at: 2, dur: 1, vel: 0.5 },
        { at: 4, dur: 1, vel: 0.58 }, { at: 6, dur: 1, vel: 0.5 },
        { at: 8, dur: 1, vel: 0.56 }, { at: 10, dur: 1, vel: 0.48 },
      ] },
    { name: 'held', weight: 2, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.36 }] },
  ],
  drums: [
    { name: 'eight-oh-eight', weight: 6, voices: {
      bd: [0, 6, 12],
      cp: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      oh: [7, 15],
    } },
    { name: 'cowbell', weight: 4, voices: {
      bd: [0, 3, 6, 10],
      cp: [4, 12],
      cb: [0, 2, 4, 6, 8, 10, 12, 14],
      sh: [2, 6, 10, 14],
    } },
    { name: 'sparse-808', weight: 3, voices: {
      bd: [0, 10],
      cp: [8],
      hh: [0, 4, 8, 12],
      oh: [6, 14],
    } },
  ],
  melody: { leap: 0.3, ornament: 0.12, span: 12, sequence: 0.8, syncopation: 0.6 },
};

/**
 * MIAMI BASS — 1986, and the fastest thing hip-hop had yet made.
 *
 * **Not the fastest thing in the catalogue**, which is what this line said for
 * as long as hip-hop was one of the last genres written and nobody had counted.
 * Jazz's `bebop` runs 196–280, and **54 of the 389 styles have a floor above
 * this one's ceiling**. The claim the date makes is the one that survives: at
 * 124–142 this is eighteen clear of anything else the genre had in the eighties,
 * where `electrorap` tops out at 124 and `oldschool` at 118 — and the three
 * styles that now beat it, `trap` at 152, `drill` at 148 and `phonk` at 146,
 * all arrive two decades downstream of it.
 *
 * The 808 kick tuned down until it is a pitch rather than a thump, at 135, with
 * everything else stripped out to leave room for it. This is a *car* record and
 * an engineering decision before it is a musical one: the whole arrangement is
 * organised around one voice, and the reason the hi-hat is written in
 * sixteenths and nothing else is that sixteenths on a hat are the only thing
 * that will still be audible over a boot full of speaker.
 *
 * `modeWeights` leans major, which surprises people and is right. This is party
 * music descended from electro's dance end, and its melodic content is a two-bar
 * whistle over a bass note; the minor-key gravity that runs through the rest of
 * this genre arrives later and from a different city.
 *
 * The bass figure is the same object as the kick, and that is the fact the table
 * cannot quite say: on these records the 808's bass drum *is* the bass line,
 * tuned to the key and pitched by the pad. The engine has two layers where the
 * music has one, so `bd` and the bass figure are written to land together on
 * every stroke and the mix does the rest — see the drum balance in
 * `hiphop/index.ts`, where `bd` is at 1.0 and the bass at 0.9.
 */
const miami: Style = {
  id: 'miami',
  label: 'Miami bass',
  description:
    'The 808 kick tuned to a pitch and everything else cleared out of its way, at 135 with the hat in sixteenths.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [124, 142],
  swing: 0,
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['straight', 7], ['driving', 3]],
  transitions: [['fill', 4], ['break', 3], ['shot', 3]],
  shots: [[[0, 6, 12], 4], [[0, 4, 8, 12], 3], [[0, 6], 2]],
  progressions: {
    intro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 },
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['bVII', 'bVII', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 3 },
    ],
    solo: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  minorProgressions: {
    verse: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 }],
    chorus: [{ chords: ['VI', 'VI', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [3, 3, 2, 4, 4], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [2, 2, 4, -4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-8, 8], weight: 4 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    // Every stroke lands on a kick. The bass and the bass drum are one object on
    // these records and this is the closest two layers can get to saying so.
    { name: 'boom', weight: 6, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 4, tone: 0, vel: 0.82 },
      { at: 12, dur: 4, tone: 0, vel: 0.78 },
    ] },
    { name: 'boom-fifth', weight: 5, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 7, vel: 0.76 },
      { at: 10, dur: 2, tone: 0, vel: 0.8 },
      { at: 14, dur: 2, tone: 10, vel: 0.7 },
    ] },
    { name: 'two-bar-boom', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 4, tone: 0, vel: 0.8 },
      { at: 12, dur: 4, tone: 3, vel: 0.72 },
      { at: 16, dur: 4, tone: 0, vel: 0.9 },
      { at: 22, dur: 4, tone: 7, vel: 0.74 },
      { at: 28, dur: 4, tone: 5, vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'two-stabs', weight: 5, voices: 3, hits: [
      { at: 4, dur: 2, vel: 0.68 }, { at: 12, dur: 2, vel: 0.64 },
    ] },
    { name: 'offbeat-stab', weight: 4, voices: 3, hits: [
      { at: 2, dur: 1, vel: 0.6 }, { at: 6, dur: 1, vel: 0.62 },
      { at: 10, dur: 1, vel: 0.6 }, { at: 14, dur: 1, vel: 0.58 },
    ] },
    { name: 'thin-pad', weight: 2, voices: 3, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.3 }] },
  ],
  drums: [
    { name: 'bass-machine', weight: 6, voices: {
      bd: [0, 6, 12],
      cp: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    } },
    { name: 'double-kick', weight: 5, voices: {
      bd: [0, 3, 6, 10, 12],
      cp: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      oh: [14],
    } },
    { name: 'open', weight: 3, voices: {
      bd: [0, 6, 10],
      cp: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12],
      cb: [8],
    } },
  ],
  melody: { leap: 0.3, ornament: 0.12, span: 11, sequence: 0.82, syncopation: 0.62 },
};

/**
 * BREAKS — the four bars everybody borrowed, at the tempo they were borrowed at.
 *
 * The b-boy record: a drum break with almost nothing over it, running fast
 * enough to dance to and cut back and forth on two decks. Its whole content is
 * the kit, so this is the one style in the genre where the drum table is longer
 * than everything else put together and where the `drums` rows carry a `cycle`
 * of 32 rather than a bar — a break is *four bars* and its second half is where
 * the drummer stopped playing the pattern.
 *
 * `transitions` puts `break` above `fill`, which only funk's `breakbeat` does
 * elsewhere and for the same reason: the gesture this music is remembered for is
 * everything else stopping and the drums carrying on, and a seam is where the
 * engine can put one.
 *
 * `breakCarrier` stays at the default. When the band drops out here what is left
 * is the bass, which is exactly right — the break is the drums, and the drums
 * are never what a `break` silences.
 */
const breaks: Style = {
  id: 'breaks',
  label: 'Breaks',
  description:
    'Four bars of drums with nothing over them: the record that exists to be cut, at the tempo it was cut at.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [98, 116],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  boxDrums: false,
  hook: 'earworm',
  feels: [['funk', 5], ['pocket', 4], ['straight', 3]],
  transitions: [['break', 5], ['fill', 4], ['shot', 2]],
  fills: [['drop', 6], ['snare-roll', 4], ['snare-toms', 3], ['lead-in', 2]],
  shots: [[[0, 6], 4], [[0, 3, 6], 3]],
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv7', 'iv7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 5 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 3 },
    ],
    bridge: [{ chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 5, note: 'The bridge is the break, and the harmony knows better than to join in' }],
    solo: [{ chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6 }],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7'], weight: 6 }],
    chorus: [{ chords: ['IV9', 'IV9', 'I9', 'I9', 'IV9', 'IV9', 'I9', 'I9'], weight: 5 }],
    outro: [{ chords: ['I7', 'I7', 'I7', 'I7'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-4, 2, 2, 4, 4], weight: 5 },
    { cell: [3, 3, 2, 4, 4], weight: 4 },
    { cell: [-8, 4, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    { name: 'under-the-break', weight: 6, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.6 },
      { at: 10, dur: 2, tone: 10, vel: 0.72 },
      { at: 12, dur: 4, tone: 0, vel: 0.68 },
    ] },
    { name: 'two-notes', weight: 4, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 11, dur: 5, tone: 3, vel: 0.68 },
    ] },
    { name: 'octave-answer', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 7, dur: 2, tone: 0, vel: 0.6 },
      { at: 12, dur: 4, tone: 5, vel: 0.68 },
      { at: 16, dur: 4, tone: 12, vel: 0.84 },
      { at: 22, dur: 2, tone: 10, vel: 0.68 },
      { at: 28, dur: 4, tone: 0, vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'one-stab', weight: 5, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 2, vel: 0.7 },
    ] },
    { name: 'two-stabs', weight: 4, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 2, vel: 0.72 }, { at: 10, dur: 2, vel: 0.64 },
    ] },
    { name: 'organ-bed', weight: 2, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.34 }] },
  ],
  drums: [
    /**
     * The famous one, written across two bars because that is how long it is.
     * The ghosts are on the odd sixteenths around every backbeat and there are
     * six of them, which is more than any other figure in this file — a break of
     * this kind is roughly half ghost strokes by count and about a fifth of
     * them by energy.
     */
    { name: 'the-four-bars', weight: 6, cycle: 32,
      voices: {
        bd: [0, 10, 16, 22],
        sd: [4, 12, 20, 28, 30],
        hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      },
      ghosts: { sd: [3, 7, 11, 19, 23, 27] } },
    { name: 'straight-break', weight: 5,
      voices: {
        bd: [0, 10],
        sd: [4, 12, 14],
        hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      },
      ghosts: { sd: [3, 5, 11] } },
    { name: 'rolling', weight: 4,
      voices: {
        bd: [0, 3, 8, 11],
        sd: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
        rim: [7, 15],
      },
      ghosts: { sd: [5, 13] } },
  ],
  melody: { leap: 0.28, ornament: 0.2, span: 12, sequence: 0.68, syncopation: 0.72 },
};

/**
 * BOOM BAP — the centre of the catalogue, and the style everything else here is
 * measured against.
 *
 * A hard kick, a hard snare, a two-bar loop off a jazz or soul record and
 * nothing else. Ninety BPM, twelve bits, and the swing knob on the sampler set
 * somewhere in the high fifties.
 *
 * ## The swing, which is a number on a machine and not a triplet feel
 *
 * `swing: 0.18`. Jazz's is 0.5 and it means a triplet; this means the MPC's own
 * shuffle control, which delays every second sixteenth by a percentage of the
 * gap. At 50% the grid is straight; the records this style is about sit between
 * 54% and 62%, and 0.18 is where that lands once the engine has scaled it. It is
 * small on the page and it is the single most identifiable thing about the
 * style: take it to zero and the same tables produce a demo, take it to 0.4 and
 * they produce a shuffle.
 *
 * ## The ghosts, and why one figure writes only half of them
 *
 * `hard-two` writes ghosts on the `e` of each backbeat and leaves the `a` alone.
 * That is deliberate and it is the case `DrumPattern.ghosts` documents: the
 * drawn `Feel.ghost` pass ghosts the odd sixteenths adjacent to a snare, so a
 * figure that writes one side leaves the other **available** and the feel
 * completes the pair — a different bar every section, from a table that has not
 * moved. `dusty` writes both sides and absorbs the draw entirely, which is what
 * a sampled break does: it is the same four strokes every time round because it
 * is literally the same four strokes.
 */
const boombap: Style = {
  id: 'boombap',
  label: 'Boom bap',
  description:
    'A hard kick, a harder snare and two bars off somebody else\'s record, at ninety with the sampler\'s swing knob up.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [84, 96],
  swing: 0.18,
  modeWeights: { minor: 0.75, major: 0.25 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['pocket', 5], ['funk', 4], ['straight', 3]],
  transitions: [['fill', 4], ['break', 4], ['shot', 2]],
  shots: [[[0, 6], 4], [[0, 6, 10], 3], [[0, 10], 2]],
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
    verse: [
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 6, note: 'One chord for eight bars, because the two bars it came from had one chord in them' },
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9'], weight: 5, note: 'The two-chord loop: bar three is not bar one, and that is the whole harmonic event' },
      { chords: ['i7', 'i7', 'i7', 'i7', 'VI', 'VI', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9', 'i9', 'i9'], weight: 4 },
    ],
    bridge: [{ chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 5 }],
    solo: [{ chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 5 }],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 },
      { chords: ['Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9'], weight: 5 },
    ],
    chorus: [{ chords: ['IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [3, 3, 2, 4, 4], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [-8, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [-8, 8], weight: 2 },
  ],
  bass: [
    { name: 'root-and-seventh', weight: 6, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.62 },
      { at: 10, dur: 2, tone: 10, vel: 0.74 },
      { at: 12, dur: 4, tone: 0, vel: 0.68 },
    ] },
    { name: 'walk-up', weight: 5, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 2, tone: 3, vel: 0.68 },
      { at: 10, dur: 2, tone: 5, vel: 0.7 },
      { at: 12, dur: 4, tone: 7, vel: 0.72 },
    ] },
    { name: 'two-bar-loop', weight: 4, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.6 },
      { at: 11, dur: 3, tone: 10, vel: 0.72 },
      { at: 16, dur: 4, tone: 0, vel: 0.86 },
      { at: 22, dur: 2, tone: 5, vel: 0.66 },
      { at: 26, dur: 2, tone: 3, vel: 0.64 },
      { at: 28, dur: 4, tone: 0, vel: 0.7 },
    ] },
    { name: 'one-note', weight: 3, sustain: true, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 10, dur: 6, tone: 0, vel: 0.7 },
    ] },
  ],
  comp: [
    // A chopped chord: struck on the downbeat and on the `and` of two, which is
    // where the source bar's own accents were, and left alone in between.
    { name: 'chopped-chord', weight: 6, voices: 4, voicing: 'guide', hits: [
      { at: 0, dur: 3, vel: 0.7 }, { at: 6, dur: 2, vel: 0.6 }, { at: 10, dur: 3, vel: 0.64 },
    ] },
    { name: 'rhodes-loop', weight: 5, voices: 4, cycle: 32, hits: [
      { at: 0, dur: 4, vel: 0.66 }, { at: 6, dur: 2, vel: 0.54 },
      { at: 12, dur: 4, vel: 0.6 }, { at: 20, dur: 4, vel: 0.62 },
      { at: 26, dur: 2, vel: 0.52 },
    ] },
    { name: 'held-chord', weight: 3, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.44 }] },
  ],
  drums: [
    /**
     * The one in the type's own worked example, and it is there because it is
     * the figure: kick on one and the `and` of three, snare on two and four,
     * hats in eighths, and four ghosts filling the gaps around the backbeat.
     */
    { name: 'dusty', weight: 6,
      voices: {
        bd: [0, 10],
        sd: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
      },
      ghosts: { sd: [3, 5, 11, 13] } },
    /** Half the ghosts written, so the feel finishes the pair. See the header. */
    { name: 'hard-two', weight: 5,
      voices: {
        bd: [0, 6, 10],
        sd: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
        oh: [14],
      },
      ghosts: { sd: [3, 11] } },
    { name: 'two-bar-chop', weight: 4, cycle: 32,
      voices: {
        bd: [0, 10, 16, 22, 26],
        sd: [4, 12, 20, 28],
        hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
        rim: [30],
      },
      ghosts: { sd: [7, 13, 23, 27] } },
  ],
  melody: { leap: 0.22, ornament: 0.18, span: 12, sequence: 0.72, syncopation: 0.66 },
};

/**
 * JAZZ RAP — the loop with changes in it, and one of four styles here allowed a
 * tune.
 *
 * An upright bass, a Rhodes, brushes under a filtered kick, and a two- or
 * four-chord loop lifted off a record made by people who could read. It is the
 * corner of this genre where the harmony is genuinely doing something, and it is
 * therefore the corner where `hook: 'catchy'` is honest — a line over four
 * moving chords may develop, because there is something underneath it holding
 * the record together.
 *
 * **It does not override `scaleForChord`, and that is the interesting decision.**
 * The obvious move is the one funk makes for `jazzfunk`: the changes are the
 * content, so follow them. It is wrong here for a reason that is specific to
 * sampling. Those four chords are not a progression the band is travelling
 * through — they are **two bars of somebody else's record, repeating**, and a
 * line that re-orients onto each of them re-orients identically every two bars
 * for four minutes. That is not chord-relative writing, it is a fixed pattern
 * arrived at expensively. The pentatonic sitting across the whole loop is what
 * the person with the sampler actually played over it, and it is what the genre
 * rule already does. See `hiphop/index.ts`.
 */
const jazzrap: Style = {
  id: 'jazzrap',
  label: 'Jazz rap',
  description:
    'An upright bass, a Rhodes and four chords off a record made by people who could read — the one loop here with somewhere to go.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [86, 98],
  swing: 0.2,
  modeWeights: { minor: 0.7, major: 0.3 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  feels: [['pocket', 5], ['laidback', 4], ['straight', 3]],
  transitions: [['fill', 5], ['break', 3], ['elide', 2]],
  // The loop is what is still sounding when the drums stop, and on this style it
  // is a Rhodes chord with a two-second tail rather than an upright bass note.
  breakCarrier: 'comp',
  shots: [[[0, 6], 3], [[0, 10], 3]],
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'iv9', 'iv9'], weight: 5 }],
    verse: [
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9'], weight: 6, note: 'Two bars, twice. The four-bar version of the same loop is the chorus' },
      { chords: ['i11', 'i11', 'IVmaj9', 'IVmaj9', 'i11', 'i11', 'IVmaj9', 'IVmaj9'], weight: 5 },
      { chords: ['i9', 'i9', 'VImaj9', 'VImaj9', 'i9', 'i9', 'VImaj9', 'VImaj9'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv9', 'iv9', 'VII7', 'VII7', 'IIImaj9', 'IIImaj9', 'i9', 'i9'], weight: 5, note: 'Four chords and a real cadence — the one place in this genre a ii-V could survive' },
      { chords: ['VImaj9', 'VImaj9', 'VII7', 'VII7', 'i9', 'i9', 'i9', 'i9'], weight: 4 },
    ],
    bridge: [{ chords: ['iv9', 'iv9', 'iv9', 'iv9', 'i9', 'i9', 'i9', 'i9'], weight: 5 }],
    solo: [{ chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9'], weight: 5 }],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'vi9', 'vi9', 'Imaj9', 'Imaj9', 'vi9', 'vi9'], weight: 5 },
      { chords: ['Imaj9', 'Imaj9', 'ii9', 'ii9', 'Imaj9', 'Imaj9', 'ii9', 'ii9'], weight: 4 },
    ],
    chorus: [{ chords: ['ii9', 'ii9', 'V13', 'V13', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    { name: 'upright-two-feel', weight: 6, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 7, vel: 0.72 },
      { at: 14, dur: 2, tone: 10, vel: 0.6 },
    ] },
    /**
     * Four quarters spelled out rather than `walking: true`, and the difference
     * is the whole style. A walking line is *generated* — it connects one chord
     * root to the next by step and puts a chromatic approach on beat four, which
     * is a bass player reading a chart in real time. What is on these records is
     * four bars of a bass player who did that once, in 1964, looped. A loop that
     * re-derived itself every time round would be a session, not a sample.
     */
    { name: 'upright-four', weight: 5, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 4, dur: 4, tone: 3, vel: 0.7 },
      { at: 8, dur: 4, tone: 7, vel: 0.76 },
      { at: 12, dur: 4, tone: 10, vel: 0.68 },
    ] },
    { name: 'loop-figure', weight: 4, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.6 },
      { at: 10, dur: 4, tone: 7, vel: 0.7 },
      { at: 16, dur: 4, tone: 10, vel: 0.8 },
      { at: 22, dur: 2, tone: 7, vel: 0.62 },
      { at: 26, dur: 6, tone: 3, vel: 0.66 },
    ] },
  ],
  comp: [
    { name: 'rhodes-comp', weight: 6, voices: 4, voicing: 'guide', hits: [
      { at: 2, dur: 2, vel: 0.6 }, { at: 6, dur: 2, vel: 0.66 },
      { at: 11, dur: 3, vel: 0.58 },
    ] },
    { name: 'four-chord-loop', weight: 5, voices: 4, cycle: 32, voicing: 'guide', hits: [
      { at: 0, dur: 6, vel: 0.62 }, { at: 8, dur: 6, vel: 0.58 },
      { at: 16, dur: 6, vel: 0.62 }, { at: 24, dur: 6, vel: 0.56 },
    ] },
    { name: 'vibes-figure', weight: 3, voices: 3, arpeggio: true, arpDirection: 'updown', cycle: 12,
      hits: [
        { at: 0, dur: 2, vel: 0.5 }, { at: 3, dur: 1, vel: 0.42 },
        { at: 6, dur: 2, vel: 0.48 }, { at: 10, dur: 2, vel: 0.44 },
      ] },
  ],
  drums: [
    { name: 'brushed-loop', weight: 6,
      voices: {
        bd: [0, 10],
        sd: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
        rim: [7],
      },
      ghosts: { sd: [3, 5, 11, 13] } },
    { name: 'ride-loop', weight: 5,
      voices: {
        bd: [0, 6, 10],
        sd: [4, 12],
        rd: [0, 3, 4, 6, 8, 11, 12, 14],
      },
      ghosts: { sd: [7, 15] } },
    { name: 'two-bar-jazz', weight: 3, cycle: 32,
      voices: {
        bd: [0, 10, 16, 26],
        sd: [4, 12, 20, 28],
        hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      },
      ghosts: { sd: [3, 13, 19, 27] } },
  ],
  melody: { leap: 0.28, ornament: 0.28, span: 14, sequence: 0.55, syncopation: 0.62 },
};

/**
 * SOUL LOOP — four bars of a 1972 ballad, slowed a little, with drums under it.
 *
 * The commonest single construction in the golden era and the one that put
 * lawyers on the payroll: a strings-and-Rhodes phrase off a soul record, pitched
 * down a tone or two so the tempo lands where the drums want it, and a hard kit
 * underneath doing nothing the original did. What makes it a *style* rather than
 * a production trick is that the borrowed four bars bring their own harmony, so
 * this is one of the four tables here with a chord a bar in it.
 *
 * `requireLayers` is deliberately absent even though the pad is the sample. It
 * would be the obvious declaration and it would cost the style its best gesture:
 * `Chart.exits` can only take a layer away from a genre that has not required it,
 * and the last verse of one of these records with the strings pulled off it —
 * leaving the kit, the bass and a voice — is exactly what the third verse of
 * these records does.
 *
 * `sustain: true` on the pad-shaped comp row is doing real work. A sampled chord
 * is *one continuous recording*: it does not re-attack on the barline, and a
 * four-bar phrase struck again every bar is a keyboard player, which is the one
 * thing this style is not.
 */
const soulloop: Style = {
  id: 'soulloop',
  label: 'Soul loop',
  description:
    'Four bars of a 1972 ballad pitched down a tone, with a hard kit under it doing nothing the original did.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [86, 98],
  swing: 0.14,
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  feels: [['pocket', 5], ['straight', 4], ['laidback', 2]],
  transitions: [['fill', 5], ['break', 3], ['elide', 2]],
  breakCarrier: 'comp',
  shots: [[[0, 6], 3], [[0, 6, 10], 2]],
  progressions: {
    intro: [{ chords: ['Imaj9', 'Imaj9', 'vi9', 'vi9'], weight: 5 }],
    verse: [
      { chords: ['Imaj9', 'vi9', 'ii9', 'V13', 'Imaj9', 'vi9', 'ii9', 'V13'], weight: 5, note: 'A chord a bar, which nothing else in this genre has — because the four bars came with it' },
      { chords: ['Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9'], weight: 5 },
      { chords: ['Imaj9', 'iii9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'iii9', 'IVmaj9', 'IVmaj9'], weight: 4 },
    ],
    chorus: [
      { chords: ['IVmaj9', 'IVmaj9', 'iii9', 'iii9', 'ii9', 'ii9', 'Imaj9', 'Imaj9'], weight: 5 },
      { chords: ['vi9', 'vi9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'V13', 'V13'], weight: 4 },
    ],
    bridge: [{ chords: ['IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'V13', 'V13', 'V13', 'V13'], weight: 5 }],
    solo: [{ chords: ['Imaj9', 'vi9', 'ii9', 'V13', 'Imaj9', 'vi9', 'ii9', 'V13'], weight: 5 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i9', 'i9', 'VImaj9', 'VImaj9', 'i9', 'i9', 'VImaj9', 'VImaj9'], weight: 5 },
      { chords: ['i9', 'VII7', 'VImaj9', 'VII7', 'i9', 'VII7', 'VImaj9', 'VII7'], weight: 4 },
    ],
    chorus: [{ chords: ['VImaj9', 'VImaj9', 'VII7', 'VII7', 'i9', 'i9', 'i9', 'i9'], weight: 5 }],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-2, 2, 2, 4, 4, 2], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    { name: 'sample-bass', weight: 6, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 2, tone: 7, vel: 0.7 },
      { at: 12, dur: 4, tone: 5, vel: 0.68 },
    ] },
    { name: 'soul-line', weight: 5, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 4, vel: 0.66 },
      { at: 8, dur: 2, tone: 7, vel: 0.74 },
      { at: 12, dur: 2, tone: 9, vel: 0.64 },
      { at: 14, dur: 2, tone: 7, vel: 0.62 },
    ] },
    { name: 'held-root', weight: 3, sustain: true, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 12, dur: 4, tone: 7, vel: 0.68 },
    ] },
  ],
  comp: [
    // The sample itself: one continuous recording, held through the barline.
    { name: 'held-phrase', weight: 6, voices: 4, sustain: true, voicing: 'spread', hits: [
      { at: 0, dur: 16, vel: 0.6 },
    ] },
    { name: 'rhodes-figure', weight: 5, voices: 4, voicing: 'guide', hits: [
      { at: 0, dur: 4, vel: 0.62 }, { at: 6, dur: 2, vel: 0.52 }, { at: 10, dur: 4, vel: 0.58 },
    ] },
    { name: 'strings-swell', weight: 3, voices: 4, voicing: 'spread', cycle: 32, sustain: true, hits: [
      { at: 0, dur: 16, vel: 0.5 }, { at: 16, dur: 16, vel: 0.56 },
    ] },
  ],
  drums: [
    { name: 'hard-under-soft', weight: 6,
      voices: {
        bd: [0, 10],
        sd: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
      },
      ghosts: { sd: [3, 5, 11, 13] } },
    { name: 'kick-heavy', weight: 4,
      voices: {
        bd: [0, 3, 8, 10],
        sd: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
        tb: [4, 12],
      },
      ghosts: { sd: [7, 15] } },
    { name: 'open-loop', weight: 3,
      voices: {
        bd: [0, 10],
        sd: [4, 12],
        oh: [2, 6, 14],
        hh: [0, 4, 8, 12],
      },
      ghosts: { sd: [11] } },
  ],
  melody: { leap: 0.26, ornament: 0.24, span: 14, sequence: 0.6, syncopation: 0.55 },
};

/**
 * HORN LOOP — a two-beat horn stab, cut out of a 1970 side and triggered.
 *
 * The hardest-edged construction of the New York early nineties: not a chord
 * loop but a *stab* — one hit, half a second long, with the tail chopped off —
 * fired on the same two slots of every bar until it stops being a horn section
 * and becomes a percussion instrument. There is no harmonic movement because
 * there is no time for any; what is looped is shorter than a chord.
 *
 * That is why the `brass` layer matters more here than anywhere else in the
 * genre and why `arrangement` in `hiphop/index.ts` raises `riff`: the horns
 * answering with the *same* figure restated rather than with fresh material is
 * not an arranging choice here, it is what a sampler does by construction.
 *
 * `melody.span` is 9, the narrowest in the file. A stab is one interval wide.
 */
const hornloop: Style = {
  id: 'hornloop',
  label: 'Horn loop',
  description:
    'One two-beat horn stab cut out of a 1970 side and fired on the same two slots until it stops being a horn.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [90, 102],
  swing: 0.16,
  modeWeights: { minor: 0.75, major: 0.25 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['funk', 5], ['pocket', 4], ['straight', 3]],
  transitions: [['fill', 4], ['shot', 4], ['break', 3]],
  shots: [[[0, 6], 5], [[0, 3, 6], 3], [[0, 6, 10], 2]],
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6, note: 'The stab is shorter than a chord change. There is nowhere for one to happen' },
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'iv7', 'iv7'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv7', 'iv7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 5 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 3 },
    ],
    solo: [{ chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 5 }],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7'], weight: 6 }],
    chorus: [{ chords: ['IV7', 'IV7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7'], weight: 5 }],
    outro: [{ chords: ['I7', 'I7', 'I7', 'I7'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-4, 4, 4, 4], weight: 5 },
    { cell: [3, 3, 2, 4, 4], weight: 4 },
    { cell: [-8, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    { name: 'under-the-stab', weight: 6, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.62 },
      { at: 10, dur: 2, tone: 10, vel: 0.72 },
      { at: 12, dur: 4, tone: 0, vel: 0.68 },
    ] },
    { name: 'fifth-drop', weight: 5, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 2, tone: 7, vel: 0.7 },
      { at: 11, dur: 5, tone: 3, vel: 0.66 },
    ] },
    { name: 'two-bar-answer', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 7, dur: 3, tone: 0, vel: 0.62 },
      { at: 12, dur: 4, tone: 10, vel: 0.7 },
      { at: 16, dur: 4, tone: 0, vel: 0.84 },
      { at: 23, dur: 3, tone: 5, vel: 0.64 },
      { at: 28, dur: 4, tone: 3, vel: 0.66 },
    ] },
  ],
  comp: [
    // The stab, and nothing on either side of it. Two hits, both short.
    { name: 'the-stab', weight: 6, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 2, vel: 0.8 }, { at: 8, dur: 2, vel: 0.72 },
    ] },
    { name: 'stab-and-answer', weight: 5, voices: 3, voicing: 'guide', cycle: 32, hits: [
      { at: 0, dur: 2, vel: 0.8 }, { at: 8, dur: 2, vel: 0.7 },
      { at: 16, dur: 2, vel: 0.78 }, { at: 22, dur: 2, vel: 0.66 }, { at: 26, dur: 2, vel: 0.62 },
    ] },
    { name: 'organ-under', weight: 2, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.36 }] },
  ],
  drums: [
    { name: 'hard-kit', weight: 6,
      voices: {
        bd: [0, 6, 10],
        sd: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
      },
      ghosts: { sd: [3, 5, 11, 13] } },
    { name: 'skipping', weight: 5,
      voices: {
        bd: [0, 3, 10],
        sd: [4, 12],
        hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      },
      ghosts: { sd: [7, 15] } },
    { name: 'clap-layer', weight: 3,
      voices: {
        bd: [0, 10],
        sd: [4, 12],
        cp: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
      },
      ghosts: { sd: [11, 13] } },
  ],
  melody: { leap: 0.2, ornament: 0.14, span: 9, sequence: 0.85, syncopation: 0.6 },
};

/**
 * HARDCORE — the dark one, and the reason this genre's key weights lean where
 * they do.
 *
 * Mid-nineties New York: a minor loop with the top rolled off it, a kick with no
 * click, and a snare that has been compressed until it is mostly room. What
 * separates it from `boombap` is not the drums, which are close cousins, but the
 * *register* — everything is dark, and the melodic content is a two- or
 * three-note figure sitting in one octave rather than a phrase.
 *
 * `modeWeights` is 0.92 minor, the most lopsided in the file. Nothing about this
 * style survives in a major key: play the same drums under a major loop and the
 * result is `conscious` two entries down, which is a different record made by
 * different people about different things.
 *
 * `melody.sequence` at 0.88 is the highest here. The three-note figure is not
 * developed, it is **repeated at a different pitch**, which is what a sampler
 * does when the pad is played up the octave — and the figure that comes back
 * transposed is most of what this style has instead of a tune.
 */
const hardcore: Style = {
  id: 'hardcore',
  label: 'Hardcore',
  description:
    'A minor loop with the top rolled off, a kick with no click, and a three-note figure that never develops.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [88, 98],
  swing: 0.16,
  modeWeights: { minor: 0.92, major: 0.08 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['pocket', 5], ['halftime', 3], ['straight', 3]],
  transitions: [['fill', 4], ['break', 4], ['shot', 3]],
  shots: [[[0, 6], 4], [[0, 10], 3], [[0, 3, 6], 2]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 },
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 4, note: 'The flat second, once in eight bars. Everything this style has instead of a chorus' },
      { chords: ['i7', 'i7', 'i7', 'i7', 'VI', 'VI', 'VI', 'VI'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['bII', 'bII', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 5 }],
    chorus: [{ chords: ['bVII', 'bVII', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-4, 4, 4, 4], weight: 5 },
    { cell: [-8, 4, 4], weight: 5 },
    { cell: [4, 4, -4, 4], weight: 4 },
    { cell: [3, 3, 2, 4, 4], weight: 3 },
    { cell: [-2, 2, 4, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-8, 8], weight: 5 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    { name: 'low-and-short', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.68 },
      { at: 11, dur: 3, tone: 10, vel: 0.72 },
    ] },
    { name: 'semitone', weight: 4, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 2, tone: 1, vel: 0.66 },
      { at: 10, dur: 6, tone: 0, vel: 0.74 },
    ] },
    { name: 'two-bar-dark', weight: 4, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.6 },
      { at: 12, dur: 4, tone: 3, vel: 0.7 },
      { at: 16, dur: 4, tone: 0, vel: 0.86 },
      { at: 22, dur: 2, tone: 10, vel: 0.66 },
      { at: 26, dur: 6, tone: 7, vel: 0.68 },
    ] },
  ],
  comp: [
    { name: 'dark-chop', weight: 6, voices: 3, voicing: 'quartal', hits: [
      { at: 0, dur: 3, vel: 0.66 }, { at: 10, dur: 3, vel: 0.6 },
    ] },
    { name: 'one-note-figure', weight: 5, voices: 2, voicing: 'power', hits: [
      { at: 0, dur: 2, vel: 0.68 }, { at: 6, dur: 2, vel: 0.58 }, { at: 12, dur: 2, vel: 0.6 },
    ] },
    { name: 'held-drone', weight: 3, voices: 3, sustain: true, voicing: 'quartal', hits: [
      { at: 0, dur: 16, vel: 0.4 },
    ] },
  ],
  drums: [
    { name: 'no-click', weight: 6,
      voices: {
        bd: [0, 10],
        sd: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
      },
      ghosts: { sd: [3, 11] } },
    { name: 'halftime-snare', weight: 5,
      voices: {
        bd: [0, 6, 11],
        sd: [8],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
        rim: [4, 12],
      },
      ghosts: { sd: [7, 9] } },
    { name: 'two-bar-hard', weight: 3, cycle: 32,
      voices: {
        bd: [0, 10, 16, 19, 26],
        sd: [4, 12, 20, 28],
        hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      },
      ghosts: { sd: [3, 13, 27] } },
  ],
  melody: { leap: 0.2, ornament: 0.1, span: 10, sequence: 0.88, syncopation: 0.64 },
};

/**
 * CONSCIOUS — the same drums, warmer, with somebody playing on top of them.
 *
 * The mid-tempo, live-adjacent record: an actual bass player over a programmed
 * kit, a Rhodes or a guitar that was recorded rather than lifted, and a warmth
 * that the harder styles here spend real effort removing. The distinguishing
 * musical fact is that the arrangement *breathes* — this is the one style in the
 * catalogue whose `vary` field is non-zero, because there is a person on the
 * bass and a person at the end of eight bars plays it slightly differently.
 *
 * `vary` is 0.18 on the bass and 0.1 on the comp, against nothing anywhere else
 * in this genre. It is not a large number and it is not meant to be: the figure
 * stays the band's identity, and what changes is how it is played at the end of
 * a phrase. Read `Style.vary`, which is careful that this is not a re-draw.
 */
const conscious: Style = {
  id: 'conscious',
  label: 'Conscious',
  description:
    'A programmed kit with real players over it: a bass that breathes, a warm Rhodes, and nothing removed on purpose.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [88, 100],
  swing: 0.14,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  feels: [['pocket', 5], ['straight', 4], ['funk', 2]],
  transitions: [['fill', 5], ['break', 2], ['elide', 2]],
  vary: { bass: 0.18, comp: 0.1 },
  shots: [[[0, 6], 3], [[0, 6, 10], 3]],
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'IVmaj9', 'IVmaj9'], weight: 5 }],
    verse: [
      { chords: ['i9', 'i9', 'IVmaj9', 'IVmaj9', 'i9', 'i9', 'IVmaj9', 'IVmaj9'], weight: 6 },
      { chords: ['i9', 'i9', 'VII7', 'VII7', 'VImaj9', 'VImaj9', 'VII7', 'VII7'], weight: 4 },
      { chords: ['i11', 'i11', 'i11', 'i11', 'iv9', 'iv9', 'i11', 'i11'], weight: 3 },
    ],
    chorus: [
      { chords: ['VImaj9', 'VImaj9', 'VII7', 'VII7', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['iv9', 'iv9', 'VII7', 'VII7', 'IIImaj9', 'IIImaj9', 'i9', 'i9'], weight: 4 },
    ],
    bridge: [{ chords: ['iv9', 'iv9', 'iv9', 'iv9', 'VII7', 'VII7', 'VII7', 'VII7'], weight: 5 }],
    solo: [{ chords: ['i9', 'i9', 'IVmaj9', 'IVmaj9', 'i9', 'i9', 'IVmaj9', 'IVmaj9'], weight: 5 }],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'vi9', 'vi9', 'Imaj9', 'Imaj9', 'vi9', 'vi9'], weight: 5 },
      { chords: ['Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'ii9', 'ii9', 'V13', 'V13'], weight: 4 },
    ],
    chorus: [{ chords: ['IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'ii9', 'ii9', 'V13', 'V13'], weight: 5 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    { name: 'played-line', weight: 6, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 3, vel: 0.66 },
      { at: 8, dur: 2, tone: 5, vel: 0.7 },
      { at: 10, dur: 2, tone: 7, vel: 0.72 },
      { at: 14, dur: 2, tone: 10, vel: 0.62 },
    ] },
    { name: 'fingered-riff', weight: 5, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.62 },
      { at: 10, dur: 2, tone: 10, vel: 0.72 },
      { at: 12, dur: 4, tone: 7, vel: 0.68 },
    ] },
    { name: 'two-bar-played', weight: 4, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 7, vel: 0.64 },
      { at: 10, dur: 2, tone: 5, vel: 0.66 },
      { at: 12, dur: 4, tone: 3, vel: 0.68 },
      { at: 16, dur: 4, tone: 0, vel: 0.86 },
      { at: 22, dur: 2, tone: 10, vel: 0.66 },
      { at: 26, dur: 6, tone: 7, vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'warm-comp', weight: 6, voices: 4, voicing: 'guide', hits: [
      { at: 2, dur: 2, vel: 0.6 }, { at: 6, dur: 2, vel: 0.64 },
      { at: 10, dur: 2, vel: 0.58 }, { at: 14, dur: 2, vel: 0.56 },
    ] },
    { name: 'guitar-figure', weight: 5, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 2, vel: 0.62 }, { at: 3, dur: 1, vel: 0.44 },
      { at: 6, dur: 2, vel: 0.6 }, { at: 11, dur: 3, vel: 0.56 },
    ] },
    { name: 'held-chord', weight: 3, voices: 4, sustain: true, voicing: 'spread', hits: [
      { at: 0, dur: 16, vel: 0.46 },
    ] },
  ],
  drums: [
    { name: 'warm-kit', weight: 6,
      voices: {
        bd: [0, 10],
        sd: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
        tb: [4, 12],
      },
      ghosts: { sd: [3, 5, 11, 13] } },
    { name: 'sixteenth-hat', weight: 5,
      voices: {
        bd: [0, 6, 10],
        sd: [4, 12],
        hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      },
      ghosts: { sd: [7, 15] } },
    { name: 'with-percussion', weight: 3,
      voices: {
        bd: [0, 10],
        sd: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
        mp: [2, 6, 9, 14],
        lp: [0, 8],
      },
      ghosts: { sd: [11, 13] } },
  ],
  melody: { leap: 0.28, ornament: 0.26, span: 14, sequence: 0.58, syncopation: 0.6 },
};

/**
 * PARTY — call and response, and the only style here written around a crowd
 * answering back.
 *
 * Bright, fast for this genre, major more often than not, and built out of two
 * bars that leave a hole in them. The hole is the content: the record is
 * arranged so that a room can shout into it, which means the second half of
 * every phrase is deliberately empty and the `melodyCells` below are weighted
 * toward figures that stop early.
 *
 * The three cells with a leading rest — `[-4, 4, 4, 4]` and its relatives — are
 * not there for variety. A phrase that begins on the downbeat has answered its
 * own question; one that begins a beat late has left the beat for somebody else.
 *
 * `arrangement` cannot express the call and response directly and this is where
 * the genre header's complaint bites hardest: `trade` hands a phrase from one
 * *player* to another, which is a band device, and what this music does is hand
 * it to the room. The nearest available object is a high `counter` weight and a
 * table full of holes, which is what is written.
 */
const party: Style = {
  id: 'party',
  label: 'Party rap',
  description:
    'Bright, fast and full of holes: two bars arranged so a room can shout into the second half of them.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [100, 114],
  swing: 0.12,
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['straight', 5], ['funk', 4], ['driving', 2]],
  transitions: [['fill', 4], ['break', 4], ['shot', 3]],
  shots: [[[0, 6], 5], [[0, 4, 8, 12], 3], [[0, 6, 10], 2]],
  progressions: {
    intro: [{ chords: ['I7', 'I7', 'I7', 'I7'], weight: 5 }],
    verse: [
      { chords: ['I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7'], weight: 5 },
      { chords: ['I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'IV7', 'IV7'], weight: 5 },
      { chords: ['I9', 'I9', 'I9', 'I9', 'bVII', 'bVII', 'I9', 'I9'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV7', 'IV7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7'], weight: 5 },
      { chords: ['bVII', 'bVII', 'IV7', 'IV7', 'I7', 'I7', 'I7', 'I7'], weight: 4 },
    ],
    bridge: [{ chords: ['IV7', 'IV7', 'IV7', 'IV7', 'I7', 'I7', 'I7', 'I7'], weight: 5 }],
    solo: [{ chords: ['I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7'], weight: 5 }],
    outro: [{ chords: ['I7', 'I7', 'I7', 'I7'], weight: 5 }],
  },
  minorProgressions: {
    verse: [{ chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 5 }],
    chorus: [{ chords: ['VI', 'VI', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 5 }],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  melodyCells: [
    // Figures that stop early, so the room has somewhere to answer.
    { cell: [-4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, -8], weight: 5 },
    { cell: [4, 4, -8], weight: 4 },
    { cell: [3, 3, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [8, -8], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [-8, 8], weight: 3 },
  ],
  bass: [
    { name: 'bouncing', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 0, vel: 0.66 },
      { at: 8, dur: 2, tone: 7, vel: 0.74 },
      { at: 12, dur: 2, tone: 5, vel: 0.68 },
      { at: 14, dur: 2, tone: 0, vel: 0.64 },
    ] },
    { name: 'root-octave', weight: 5, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 12, vel: 0.68 },
      { at: 10, dur: 2, tone: 0, vel: 0.76 },
      { at: 14, dur: 2, tone: 12, vel: 0.6 },
    ] },
    { name: 'two-bar-party', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.62 },
      { at: 10, dur: 2, tone: 7, vel: 0.7 },
      { at: 12, dur: 4, tone: 5, vel: 0.66 },
      { at: 16, dur: 4, tone: 0, vel: 0.86 },
      { at: 24, dur: 4, tone: 10, vel: 0.68 },
      { at: 28, dur: 4, tone: 0, vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'stab-and-hole', weight: 6, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 2, vel: 0.74 }, { at: 4, dur: 2, vel: 0.64 },
    ] },
    { name: 'chank', weight: 5, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.14 }, { at: 2, dur: 1, vel: 0.66 },
      { at: 3, dur: 1, vel: 0.12 }, { at: 6, dur: 1, vel: 0.7 },
      { at: 10, dur: 1, vel: 0.64 }, { at: 14, dur: 1, vel: 0.7 },
    ] },
    { name: 'held', weight: 2, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.38 }] },
  ],
  drums: [
    { name: 'party-kit', weight: 6,
      voices: {
        bd: [0, 6, 10],
        sd: [4, 12],
        cp: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
      } },
    { name: 'four-floor', weight: 5,
      voices: {
        bd: [0, 4, 8, 12],
        cp: [4, 12],
        oh: [2, 6, 10, 14],
        tb: [2, 6, 10, 14],
      } },
    { name: 'break-under', weight: 4,
      voices: {
        bd: [0, 10],
        sd: [4, 12],
        hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      },
      ghosts: { sd: [7, 15] } },
  ],
  melody: { leap: 0.26, ornament: 0.16, span: 12, sequence: 0.78, syncopation: 0.62 },
};

/**
 * G-FUNK — 1993, and the only style in the catalogue where the melody is played
 * rather than found.
 *
 * A slow bounce at ninety-five, a rubbery synth bass with a portamento on it, and
 * a thin high square-wave lead whining across the whole record. It is the point
 * where this genre reaches back into `funk/` and takes the P-Funk end of it
 * whole — and the thing worth noticing is that the *loop stops being a sample*.
 * There is a keyboard player here, so the harmony is allowed to move, and the
 * lead is a line rather than a fragment.
 *
 * `melody.span` is 16, the widest in this file by two semitones, and
 * `melody.leap` is 0.34, the highest. This is the one style whose tune has to
 * *travel* — a whine that sits inside a fifth is a drone, and what makes the
 * gesture recognisable is a long descent from the top of the register.
 *
 * The bass figure is where this style's one complaint was, and the rows below
 * now say what the record says: these lines *slide* between two notes a fifth or
 * an octave apart. `BassHit.glide` was built on five reports and this was one of
 * them — the same sentence `drill` filed, from a different decade, which is what
 * made it a gap rather than a taste — and adopting it took a note out of each of
 * the three figures rather than adding anything to them. The second of the two
 * struck notes was never a second note; it was the name of where the first one
 * was going, and it is spelled as that now.
 *
 * `glideTime` is **0.4** here against `drill`'s 0.25, and the distance between
 * those two numbers is the distance between a sub and a keyboard player. At
 * 90–102 BPM a beat is about 620 ms, so 0.4 of the 1.5- and 2-beat notes below is
 * 375–500 ms of travel — which is where a Minimoog's glide knob actually sits for
 * this record, and long enough that a fifth or an octave is heard as a swoop
 * rather than as a click on the front of the note. A drill 808 bends and gets out
 * of the way; this one is rubber, and the rubber is the part that is supposed to
 * be audible. It stops short of the default of 1 all the same, because every one
 * of these destinations is a chord tone and the majority of the note should be
 * sitting on it — a line that never stops moving is a Reese, which is a different
 * genre's sound.
 */
const gfunk: Style = {
  id: 'gfunk',
  label: 'G-funk',
  description:
    'A slow bounce, a rubbery synth bass and a thin high whine across the whole record — the one tune here that was played.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [90, 102],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['funk', 4], ['pocket', 4], ['straight', 3]],
  transitions: [['fill', 5], ['break', 3], ['shot', 2]],
  shots: [[[0, 6], 4], [[0, 6, 10], 3]],
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 6 },
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9'], weight: 5 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv9', 'iv9', 'i9', 'i9', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i9', 'i9', 'i9', 'i9'], weight: 4 },
    ],
    bridge: [{ chords: ['iv9', 'iv9', 'iv9', 'iv9', 'i9', 'i9', 'i9', 'i9'], weight: 5 }],
    solo: [{ chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7'], weight: 5 }],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I9', 'I9', 'I9', 'I9', 'IV9', 'IV9', 'I9', 'I9'], weight: 6 }],
    chorus: [{ chords: ['IV9', 'IV9', 'I9', 'I9', 'bVII', 'bVII', 'I9', 'I9'], weight: 5 }],
    outro: [{ chords: ['I9', 'I9', 'I9', 'I9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 5 },
    { cell: [-2, 2, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [12, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    /**
     * One slide per figure, and each one is a pair the table had already written
     * end to end — the merge fills no rest and reaches no further than the two
     * notes reached between them. See the header for why 0.4 and not the
     * default, and `BassHit.glide` for why a destination spelled as a `BassTone`
     * is answered by the harmony on exactly the terms an arrival is.
     */
    { name: 'rubber', weight: 6, hits: [
      { at: 0, dur: 5, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 7, vel: 0.7 },
      // Up a minor seventh into the last beat, where a two-sixteenth root and a
      // struck ♭7 used to sit on either side of slot 12. This is the gesture the
      // style is named for and it was the one thing the table could not write.
      { at: 10, dur: 6, tone: 0, vel: 0.78, glide: 10, glideTime: 0.4 },
    ] },
    { name: 'octave-slide', weight: 5, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      // The name was always a description of the record and never of the row:
      // the octave is struck and then falls a fourth to the fifth, one note,
      // half a second of travel. It used to be two.
      { at: 8, dur: 8, tone: 12, vel: 0.72, glide: 7, glideTime: 0.4 },
    ] },
    { name: 'two-bar-bounce', weight: 4, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 3, vel: 0.64 },
      /**
       * Fourth to fifth across beat 4, arriving in time to be sitting on the
       * fifth when the second bar's downbeat root is struck under it. The pair
       * on the other side of that downbeat — the fifth and the root at 16 — is
       * the wider slide and was deliberately left alone: absorbing it would have
       * taken the attack off the strongest note in a two-bar figure, and this
       * figure's own header is a bounce that has to keep landing.
       */
      { at: 10, dur: 6, tone: 5, vel: 0.68, glide: 7, glideTime: 0.4 },
      { at: 16, dur: 4, tone: 0, vel: 0.88 },
      { at: 22, dur: 2, tone: 10, vel: 0.66 },
      { at: 26, dur: 6, tone: 7, vel: 0.68 },
    ] },
  ],
  comp: [
    { name: 'clav-chank', weight: 5, voices: 3, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.14 }, { at: 2, dur: 1, vel: 0.64 },
      { at: 6, dur: 1, vel: 0.68 }, { at: 7, dur: 1, vel: 0.12 },
      { at: 10, dur: 1, vel: 0.6 }, { at: 14, dur: 1, vel: 0.66 },
    ] },
    { name: 'held-poly', weight: 5, voices: 4, sustain: true, voicing: 'spread', hits: [
      { at: 0, dur: 16, vel: 0.48 },
    ] },
    { name: 'stab-pair', weight: 3, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.62 }, { at: 10, dur: 2, vel: 0.58 },
    ] },
  ],
  drums: [
    { name: 'west-bounce', weight: 6,
      voices: {
        bd: [0, 6, 10],
        sd: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
        tb: [2, 6, 10, 14],
      },
      ghosts: { sd: [3, 11] } },
    { name: 'clap-and-hat', weight: 5,
      voices: {
        bd: [0, 10],
        cp: [4, 12],
        sd: [4, 12],
        hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      },
      ghosts: { sd: [7, 15] } },
    { name: 'with-congas', weight: 3,
      voices: {
        bd: [0, 6, 10],
        sd: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
        lp: [0, 8],
        mp: [3, 6, 11, 14],
      },
      ghosts: { sd: [13] } },
  ],
  melody: { leap: 0.34, ornament: 0.22, span: 16, sequence: 0.6, syncopation: 0.5 },
};

/**
 * CLUB RAP — 1998, the shiny one, and the style this genre is least comfortable
 * admitting to.
 *
 * A disco or early-eighties boogie loop taken *whole* rather than chopped, a
 * four-on-the-floor kick under it, strings, and a budget. The construction is
 * the opposite of `boombap`'s in one specific way: there the two bars are
 * *reduced* until only the drums and one figure survive, and here the two bars
 * are **kept**, sweetened and played over. It is the most arranged music in the
 * catalogue and it is the only style here that wants the `brass` layer swelling
 * rather than stabbing.
 *
 * `keyChangeChance` is the era's business, but the reason this style is where
 * the genre touches the radio is visible in the tables: it has a bridge, its
 * chorus resolves, and its chorus progression is a pop one. Play these chords to
 * anybody and they will not say hiphop; play them under this kick and this
 * tempo and nobody will say anything else.
 */
const clubrap: Style = {
  id: 'clubrap',
  label: 'Club rap',
  description:
    'A boogie loop taken whole rather than chopped, sweetened, over a four-on-the-floor kick and a budget.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [98, 110],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['straight', 6], ['funk', 3], ['driving', 2]],
  transitions: [['fill', 5], ['shot', 3], ['elide', 2]],
  shots: [[[0, 6], 4], [[0, 4, 8, 12], 3]],
  progressions: {
    intro: [{ chords: ['Imaj9', 'Imaj9', 'vi9', 'vi9'], weight: 5 }],
    verse: [
      { chords: ['vi9', 'vi9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'V13', 'V13'], weight: 5 },
      { chords: ['Imaj9', 'Imaj9', 'vi9', 'vi9', 'Imaj9', 'Imaj9', 'vi9', 'vi9'], weight: 5 },
      { chords: ['ii9', 'ii9', 'V13', 'V13', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 3 },
    ],
    chorus: [
      { chords: ['IVmaj9', 'IVmaj9', 'V13', 'V13', 'iii9', 'iii9', 'vi9', 'vi9'], weight: 5 },
      { chords: ['IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'ii9', 'ii9', 'V13', 'V13'], weight: 4 },
    ],
    bridge: [{ chords: ['vi9', 'vi9', 'iii9', 'iii9', 'IVmaj9', 'IVmaj9', 'V13', 'V13'], weight: 5 }],
    solo: [{ chords: ['vi9', 'vi9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'V13', 'V13'], weight: 5 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  minorProgressions: {
    verse: [{ chords: ['i9', 'i9', 'VImaj9', 'VImaj9', 'i9', 'i9', 'VII7', 'VII7'], weight: 5 }],
    chorus: [{ chords: ['VImaj9', 'VImaj9', 'VII7', 'VII7', 'i9', 'i9', 'i9', 'i9'], weight: 5 }],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [3, 3, 2, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    { name: 'disco-eighths', weight: 6, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 2, dur: 2, tone: 0, vel: 0.6 },
      { at: 4, dur: 2, tone: 7, vel: 0.74 },
      { at: 6, dur: 2, tone: 0, vel: 0.6 },
      { at: 8, dur: 2, tone: 10, vel: 0.76 },
      { at: 10, dur: 2, tone: 0, vel: 0.6 },
      { at: 12, dur: 2, tone: 7, vel: 0.7 },
      { at: 14, dur: 2, tone: 5, vel: 0.62 },
    ] },
    { name: 'octave-pump', weight: 5, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 3, dur: 1, tone: 12, vel: 0.6 },
      { at: 6, dur: 2, tone: 0, vel: 0.76 },
      { at: 10, dur: 2, tone: 12, vel: 0.64 },
      { at: 12, dur: 4, tone: 0, vel: 0.7 },
    ] },
    { name: 'sweet-line', weight: 3, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 2, tone: 4, vel: 0.66 },
      { at: 10, dur: 2, tone: 7, vel: 0.7 },
      { at: 12, dur: 4, tone: 9, vel: 0.64 },
    ] },
  ],
  comp: [
    { name: 'kept-loop', weight: 6, voices: 4, voicing: 'spread', sustain: true, hits: [
      { at: 0, dur: 16, vel: 0.58 },
    ] },
    { name: 'boogie-chank', weight: 5, voices: 3, voicing: 'guide', hits: [
      { at: 2, dur: 1, vel: 0.62 }, { at: 3, dur: 1, vel: 0.14 },
      { at: 6, dur: 1, vel: 0.66 }, { at: 10, dur: 1, vel: 0.6 },
      { at: 14, dur: 1, vel: 0.64 },
    ] },
    { name: 'string-stabs', weight: 3, voices: 4, hits: [
      { at: 0, dur: 2, vel: 0.66 }, { at: 8, dur: 2, vel: 0.6 },
    ] },
  ],
  drums: [
    { name: 'four-floor', weight: 6, voices: {
      bd: [0, 4, 8, 12],
      cp: [4, 12],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      oh: [2, 6, 10, 14],
    } },
    { name: 'bounce-kick', weight: 5, voices: {
      bd: [0, 6, 8, 14],
      cp: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      tb: [2, 6, 10, 14],
    } },
    { name: 'sweet-kit', weight: 3, voices: {
      bd: [0, 10],
      sd: [4, 12],
      cp: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      sh: [1, 3, 5, 7, 9, 11, 13, 15],
    } },
  ],
  melody: { leap: 0.28, ornament: 0.22, span: 13, sequence: 0.7, syncopation: 0.55 },
};

/**
 * BOUNCE — New Orleans, and the fastest call-and-response in the catalogue.
 *
 * One two-bar percussion figure, a shouted phrase over it, and both of them
 * repeated for four minutes without a single change. This is the least harmonic
 * music in the genre by some distance — `progressions` here is one chord in
 * every table including the chorus, and the section boundary is marked by the
 * *density* rather than by anything the harmony does.
 *
 * `cycle: 24` on the percussion row is the whole style in a number. A bar and a
 * half against a four-beat bar means the figure lands on a different sixteenth
 * every bar and comes home every three, which is what those records do and is
 * inexpressible as a bar-shaped pattern — the snare stays where it is and the
 * hand percussion walks around it.
 *
 * `melodyCells` are all short and all end in silence. The tune here is a *chant*
 * and a chant is call and response with the response left out of the notation.
 */
const bounce: Style = {
  id: 'bounce',
  label: 'Bounce',
  description:
    'One two-bar percussion figure, one shouted phrase, no chord change and no let-up.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [96, 108],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['straight', 6], ['driving', 3], ['funk', 2]],
  transitions: [['fill', 4], ['break', 4], ['shot', 3]],
  shots: [[[0, 6], 4], [[0, 3, 6, 10], 3]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6, note: 'One chord in every table this style has, chorus included. The section changes by getting busier' },
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 4 },
    ],
    chorus: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [2, 2, 4, -8], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 5 },
    { cell: [4, 4, -8], weight: 4 },
    { cell: [2, 2, 2, 2, -8], weight: 4 },
    { cell: [3, 3, 2, -8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [8, -8], weight: 5 },
    { cell: [-8, 8], weight: 4 },
    { cell: [16], weight: 3 },
  ],
  bass: [
    { name: 'one-note', weight: 6, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.72 },
      { at: 10, dur: 2, tone: 0, vel: 0.76 },
      { at: 14, dur: 2, tone: 0, vel: 0.66 },
    ] },
    { name: 'root-fifth', weight: 4, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 7, vel: 0.7 },
      { at: 10, dur: 6, tone: 0, vel: 0.74 },
    ] },
    { name: 'two-bar-shout', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.68 },
      { at: 12, dur: 4, tone: 0, vel: 0.7 },
      { at: 16, dur: 4, tone: 0, vel: 0.9 },
      { at: 22, dur: 2, tone: 5, vel: 0.66 },
      { at: 26, dur: 6, tone: 0, vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'one-stab', weight: 6, voices: 2, voicing: 'power', hits: [{ at: 0, dur: 2, vel: 0.72 }] },
    { name: 'two-stabs', weight: 4, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.72 }, { at: 6, dur: 2, vel: 0.6 },
    ] },
    { name: 'held-thin', weight: 2, voices: 3, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.28 }] },
  ],
  drums: [
    /**
     * The figure and the bar disagree, deliberately. `cycle: 24` is a bar and a
     * half of hand percussion walking around a snare that has not moved.
     */
    { name: 'walking-percussion', weight: 6, cycle: 24,
      voices: {
        bd: [0, 6, 10, 16, 20],
        perc: [0, 3, 6, 9, 12, 15, 18, 21],
        cb: [0, 8, 16],
      } },
    { name: 'shout-kit', weight: 5,
      voices: {
        bd: [0, 3, 6, 10],
        sd: [4, 12],
        cp: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
      },
      ghosts: { sd: [7, 15] } },
    { name: 'triggerman', weight: 4,
      voices: {
        bd: [0, 6, 10],
        sd: [4, 12, 14],
        tb: [0, 2, 4, 6, 8, 10, 12, 14],
        oh: [7],
      },
      ghosts: { sd: [3, 11] } },
  ],
  melody: { leap: 0.22, ornament: 0.12, span: 10, sequence: 0.86, syncopation: 0.7 },
};

/**
 * DIRTY SOUTH — 2000, where the 808 stops being a drum machine and becomes a
 * bass player.
 *
 * The hinge of the whole catalogue. Everything before it treats the kick as
 * percussion and puts a bass under it; from here on the **kick is the bass** —
 * one long tuned sine, pitched to the key, decaying across a beat and a half —
 * and the layer that used to hold the bottom has nothing left to do. The style
 * is also where the hi-hat starts subdividing past the sixteenth, which is the
 * gesture `trap` finishes.
 *
 * ## The triplet hat, which is written and is not a triplet
 *
 * A hi-hat playing three even strokes in the space of two sixteenths cannot be
 * spelled on a sixteenth grid, and this style is the first place in the project
 * where that matters rather than being an academic point. What is written
 * instead is the **dotted-eighth chain** — `cycle: 12`, three sixteenths per
 * stroke against a sixteen-slot bar — which comes home every three bars and is
 * the *other* thing those hat parts do. It is a real figure off real records and
 * it is not the one that is missing; see the genre header.
 *
 * The `bass` rows below are long and few: three onsets in a bar, one of them
 * eight sixteenths long. That is not sparseness, it is a sine wave being allowed
 * to finish.
 */
const dirtysouth: Style = {
  id: 'dirtysouth',
  label: 'Dirty south',
  description:
    'The 808 stops being a drum and becomes the bass: one long tuned sine a bar, and a hat that has started subdividing.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [72, 84],
  swing: 0,
  modeWeights: { minor: 0.82, major: 0.18 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['straight', 6], ['halftime', 3], ['pocket', 2]],
  transitions: [['fill', 4], ['break', 4], ['shot', 3]],
  shots: [[[0, 6], 4], [[0, 6, 12], 3], [[0, 3, 6], 2]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 },
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'iv9', 'iv9', 'i9', 'i9'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'i', 'i', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'VI', 'VI', 'VII', 'VII', 'VII', 'VII'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['IV', 'IV', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [3, 3, 3, 3, 4], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [-8, 4, 4], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-8, 8], weight: 4 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    // Three onsets. The first is eight sixteenths long because an 808 note that
    // is cut short is a kick drum again.
    { name: 'long-808', weight: 6, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 10, dur: 4, tone: 0, vel: 0.76 },
      { at: 14, dur: 2, tone: 10, vel: 0.66 },
    ] },
    { name: 'sub-and-answer', weight: 5, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 3, vel: 0.72 },
      { at: 12, dur: 4, tone: 0, vel: 0.74 },
    ] },
    { name: 'two-bar-sub', weight: 4, cycle: 32, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 10, dur: 6, tone: 0, vel: 0.74 },
      { at: 16, dur: 6, tone: 7, vel: 0.8 },
      { at: 24, dur: 4, tone: 5, vel: 0.7 },
      { at: 28, dur: 4, tone: 0, vel: 0.72 },
    ] },
  ],
  comp: [
    { name: 'plucked-figure', weight: 6, voices: 3, voicing: 'guide', cycle: 12, hits: [
      { at: 0, dur: 2, vel: 0.62 }, { at: 3, dur: 1, vel: 0.5 },
      { at: 6, dur: 2, vel: 0.58 }, { at: 9, dur: 1, vel: 0.48 },
    ] },
    { name: 'string-stab', weight: 5, voices: 4, hits: [
      { at: 0, dur: 2, vel: 0.66 }, { at: 8, dur: 2, vel: 0.6 },
    ] },
    { name: 'held-organ', weight: 3, voices: 4, sustain: true, voicing: 'spread', hits: [
      { at: 0, dur: 16, vel: 0.42 },
    ] },
  ],
  drums: [
    /**
     * The dotted-eighth hat, written across **three bars** rather than as a
     * `cycle: 12` figure — and the reason is the one limitation `DrumPattern`
     * has that this genre runs into hardest: **`cycle` is one number for the
     * whole kit.** A hat every three sixteenths against a kick and snare that
     * stay where they are is two different cycle lengths in one part, and there
     * is no way to say that. `cycle: 12` would have taken the kick with it.
     *
     * So the two are reconciled at their common multiple: 48 sixteenths is three
     * bars, the kick and the snare are stated three times inside it, and the hat
     * runs sixteen even strokes across the whole thing and lands back on the
     * downbeat. It is the same music and it costs three times the table.
     */
    { name: 'dotted-hat', weight: 5, cycle: 48,
      voices: {
        bd: [0, 10, 16, 26, 32, 42],
        sd: [8, 24, 40],
        cp: [8, 24, 40],
        hh: [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45],
      } },
    { name: 'south-kit', weight: 6,
      voices: {
        bd: [0, 10],
        sd: [8],
        cp: [8],
        hh: [0, 2, 4, 6, 8, 10, 12, 13, 14, 15],
      } },
    { name: 'rolling-hat', weight: 4,
      voices: {
        bd: [0, 6, 11],
        sd: [8],
        hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        oh: [14],
      } },
  ],
  melody: { leap: 0.24, ornament: 0.12, span: 11, sequence: 0.82, syncopation: 0.66 },
};

/**
 * CRUNK — the same 808, shouted at, with a synth brass line on top of it.
 *
 * Atlanta at seventy-two, half-time, and organised entirely around a room full
 * of people shouting one word. Musically it is `dirtysouth` with two things
 * added and one taken away: a blaring synth-brass or square-lead riff doubling
 * the hook, a snare roll that accelerates into every eighth bar, and no
 * subtlety whatsoever.
 *
 * `fills` puts `snare-roll` at the top and it is the only style in the genre
 * that does. Everywhere else here the loudest thing a beat can do at a seam is
 * stop; here it is a machine-gun snare crescendo, which is a rock gesture that
 * this corner of the music borrowed wholesale and never gave back.
 *
 * The `brass` layer earns real weight for the second time in the catalogue —
 * `hornloop` is the first — and the two are opposite uses of the same object. A
 * horn loop is one sampled stab; this is a synthesiser playing a written line in
 * octaves, and the reason it works at all is that it is the only thing on the
 * record between the sub and the hi-hat.
 */
const crunk: Style = {
  id: 'crunk',
  label: 'Crunk',
  description:
    'Half-time at seventy-two, a blaring synth-brass riff, a snare roll into every eighth bar, and a room shouting one word.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [68, 80],
  swing: 0,
  modeWeights: { minor: 0.85, major: 0.15 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['halftime', 5], ['straight', 4], ['driving', 2]],
  transitions: [['fill', 5], ['break', 3], ['shot', 3]],
  fills: [['snare-roll', 6], ['drop', 4], ['lead-in', 3], ['snare-toms', 2]],
  shots: [[[0, 6], 4], [[0, 4, 8], 3], [[0, 8], 3]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 },
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
    ],
    bridge: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['bVI', 'bVI', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-4, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [-8, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, -8], weight: 4 },
    { cell: [-8, 8], weight: 3 },
  ],
  bass: [
    { name: 'shout-sub', weight: 6, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 0, vel: 0.82 },
      { at: 12, dur: 4, tone: 0, vel: 0.78 },
    ] },
    { name: 'octave-answer', weight: 4, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 12, vel: 0.74 },
      { at: 12, dur: 4, tone: 0, vel: 0.8 },
    ] },
    { name: 'two-bar-crunk', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 10, dur: 6, tone: 0, vel: 0.78 },
      { at: 16, dur: 8, tone: 8, vel: 0.8 },
      { at: 26, dur: 6, tone: 10, vel: 0.72 },
    ] },
  ],
  comp: [
    { name: 'brass-riff', weight: 6, voices: 2, voicing: 'power', hits: [
      { at: 0, dur: 2, vel: 0.8 }, { at: 4, dur: 2, vel: 0.7 },
      { at: 6, dur: 2, vel: 0.72 }, { at: 12, dur: 4, vel: 0.74 },
    ] },
    { name: 'two-stabs', weight: 5, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.78 }, { at: 8, dur: 3, vel: 0.7 },
    ] },
    { name: 'held-loud', weight: 2, voices: 3, sustain: true, voicing: 'power', hits: [
      { at: 0, dur: 16, vel: 0.5 },
    ] },
  ],
  drums: [
    { name: 'crunk-kit', weight: 6, voices: {
      bd: [0, 6, 10],
      sd: [8],
      cp: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'roll-in', weight: 5, voices: {
      bd: [0, 10],
      sd: [8, 12, 13, 14, 15],
      cp: [8],
      hh: [0, 2, 4, 6, 8, 10],
    } },
    { name: 'wide-open', weight: 3, voices: {
      bd: [0, 8],
      sd: [8],
      cp: [8],
      hh: [0, 4, 12],
      oh: [6, 14],
    } },
  ],
  melody: { leap: 0.24, ornament: 0.08, span: 12, sequence: 0.85, syncopation: 0.5 },
};

/**
 * CHOPPED AND SCREWED — the tape slowed down, and the one style here that is a
 * production rather than a rhythm.
 *
 * Houston: somebody else's record played back at about seventy per cent, with
 * the beat doubled back on itself every few bars. Reggae's `dub` is the worked
 * example this follows and the standing is identical — King Tubby wrote no dub
 * rhythm and nobody wrote a screw tempo; what exists is a second pass over a
 * finished tape.
 *
 * **So it declares `effects`, and the era yields.** `Style.effects` merges over
 * the era's for exactly this case: a screwed record cut in 2015 is dark, slurred
 * and drenched in the same way one cut in 1996 was, because the darkness is not
 * a decade's taste in mixing — it is *what happened to the tape*. Only three keys
 * are named, and `lowpass` on the drums is deliberately left to the era so that
 * the decade can still be heard through it.
 *
 * The tempo band is the lowest in the project after ambient's, and the arithmetic
 * is honest rather than atmospheric: a southern record at 76 played at 70% is
 * 53, and at the friendlier end of the practice it is 62.
 */
const chopped: Style = {
  id: 'chopped',
  label: 'Chopped and screwed',
  description:
    'Somebody else\'s record at seventy per cent, dark and slurred, with the beat doubled back on itself.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [54, 66],
  swing: 0,
  modeWeights: { minor: 0.85, major: 0.15 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['halftime', 4], ['laidback', 4], ['straight', 3]],
  transitions: [['fill', 3], ['break', 4], ['elide', 2]],
  breakCarrier: 'comp',
  /**
   * The treatment *is* the piece. `lowpass` at 2600 is the tape running slow;
   * `reverb` and `delay` are the room it was played back into. `drums` names no
   * `lowpass`, so how bright the kit is stays the era's to say — a screwed 1996
   * record and a screwed 2015 one are both slurred and are not the same record.
   */
  effects: {
    comp: { reverb: 0.5, delay: 0.4, lowpass: 2600 },
    melody: { reverb: 0.55, delay: 0.45, lowpass: 3000 },
    pad: { reverb: 0.65, lowpass: 2200 },
    drums: { reverb: 0.35, delay: 0.2 },
    bass: { reverb: 0.12, lowpass: 700 },
  },
  shots: [[[0, 8], 4], [[0, 6], 3]],
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
    verse: [
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 6 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'VI', 'VI', 'VI', 'VI'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9', 'i9', 'i9'], weight: 3 },
    ],
    solo: [{ chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 5 }],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 6 }],
    chorus: [{ chords: ['IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-8, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 3 },
  ],
  bass: [
    { name: 'dragged', weight: 6, sustain: true, hits: [
      { at: 0, dur: 10, tone: 0, vel: 1 },
      { at: 12, dur: 4, tone: 0, vel: 0.7 },
    ] },
    { name: 'slow-sub', weight: 5, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 10, dur: 6, tone: 3, vel: 0.7 },
    ] },
    { name: 'two-bar-drag', weight: 3, cycle: 32, sustain: true, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 14, dur: 2, tone: 10, vel: 0.62 },
      { at: 16, dur: 12, tone: 0, vel: 0.8 },
      { at: 30, dur: 2, tone: 7, vel: 0.6 },
    ] },
  ],
  comp: [
    { name: 'slurred-chord', weight: 6, voices: 4, sustain: true, voicing: 'spread', hits: [
      { at: 0, dur: 16, vel: 0.56 },
    ] },
    { name: 'doubled-chop', weight: 4, voices: 4, voicing: 'guide', hits: [
      { at: 0, dur: 4, vel: 0.6 }, { at: 4, dur: 4, vel: 0.58 }, { at: 10, dur: 6, vel: 0.54 },
    ] },
    { name: 'one-hit', weight: 3, voices: 4, hits: [{ at: 0, dur: 8, vel: 0.62 }] },
  ],
  drums: [
    { name: 'screwed-kit', weight: 6, voices: {
      bd: [0, 10],
      sd: [8],
      cp: [8],
      hh: [0, 4, 8, 12],
    } },
    { name: 'doubled-back', weight: 4, voices: {
      bd: [0, 6, 8, 14],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'sparse-drag', weight: 3, voices: {
      bd: [0],
      sd: [8],
      oh: [6, 14],
    } },
  ],
  melody: { leap: 0.2, ornament: 0.3, span: 12, sequence: 0.7, syncopation: 0.4 },
};

/**
 * PHONK — Memphis, and the cowbell that ate a decade.
 *
 * A cassette-quality loop, an 808 cowbell in straight eighths across the entire
 * record, a half-time snare, and everything saturated to the point where the
 * distortion is a voice in the arrangement. It began as a local Memphis idiom in
 * about 1993 and came back as an internet one twenty-five years later, which is
 * why its era weights are the flattest in this file — it is the one style here
 * that is genuinely at home in two decades that share nothing else.
 *
 * `cb` is the identifying voice and it is written in every drum row, which
 * nothing else in the catalogue does with any voice but the kick. It sits at
 * 0.62 in the genre's `drumMix` — above the shared default, and the only voice
 * this genre raises — because a cowbell mixed politely is a triangle.
 *
 * The `effects` declaration is smaller than `chopped`'s and does a different
 * job: `drive` and a hard `lowpass` on the comp are the *cassette*, which is
 * this style's production identity in the same way echo is dub's. The rest is
 * left to the decade, because a 1993 phonk record and a 2019 one differ in
 * exactly the ways an era table already knows about.
 */
const phonk: Style = {
  id: 'phonk',
  label: 'Phonk',
  description:
    'A cassette-quality loop, a cowbell in straight eighths, a half-time snare, and saturation used as an instrument.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [124, 146],
  swing: 0,
  modeWeights: { minor: 0.94, major: 0.06 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['halftime', 5], ['straight', 4]],
  transitions: [['fill', 3], ['break', 4], ['shot', 3]],
  effects: {
    comp: { drive: 0.45, lowpass: 4200, reverb: 0.28 },
    melody: { drive: 0.3, lowpass: 4800 },
    drums: { drive: 0.35 },
  },
  shots: [[[0, 8], 4], [[0, 6], 3], [[0, 3, 6], 2]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 },
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 4 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'VI', 'VI', 'VI', 'VI'], weight: 3 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 5 }],
    chorus: [{ chords: ['bVI', 'bVI', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-8, 4, 4], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [3, 3, 3, 3, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-8, 8], weight: 4 },
  ],
  bass: [
    { name: 'memphis-sub', weight: 6, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 10, dur: 4, tone: 0, vel: 0.76 },
      { at: 14, dur: 2, tone: 1, vel: 0.62 },
    ] },
    { name: 'flat-two', weight: 5, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 2, tone: 1, vel: 0.66 },
      { at: 10, dur: 6, tone: 0, vel: 0.78 },
    ] },
    { name: 'two-bar-phonk', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 10, dur: 6, tone: 0, vel: 0.74 },
      { at: 16, dur: 6, tone: 8, vel: 0.78 },
      { at: 24, dur: 4, tone: 10, vel: 0.68 },
      { at: 28, dur: 4, tone: 0, vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'cassette-loop', weight: 6, voices: 3, voicing: 'quartal', sustain: true, hits: [
      { at: 0, dur: 16, vel: 0.52 },
    ] },
    { name: 'dark-chop', weight: 5, voices: 3, voicing: 'quartal', hits: [
      { at: 0, dur: 4, vel: 0.6 }, { at: 8, dur: 4, vel: 0.56 },
    ] },
    { name: 'one-note-riff', weight: 3, voices: 2, voicing: 'power', hits: [
      { at: 0, dur: 2, vel: 0.66 }, { at: 6, dur: 2, vel: 0.58 }, { at: 10, dur: 2, vel: 0.6 },
    ] },
  ],
  drums: [
    // The cowbell is in all three rows, which nothing else here does with
    // anything but a kick. It is the style.
    { name: 'cowbell-eighths', weight: 6, voices: {
      bd: [0, 6, 10],
      sd: [8],
      cb: [0, 2, 4, 6, 8, 10, 12, 14],
      hh: [0, 4, 8, 12],
    } },
    { name: 'cowbell-sparse', weight: 5, voices: {
      bd: [0, 10],
      sd: [8],
      cb: [0, 4, 8, 12],
      oh: [6, 14],
    } },
    { name: 'driving', weight: 4, voices: {
      bd: [0, 3, 6, 10],
      sd: [8],
      cb: [0, 2, 4, 6, 8, 10, 12, 14],
      hh: [1, 3, 5, 7, 9, 11, 13, 15],
    } },
  ],
  melody: { leap: 0.22, ornament: 0.1, span: 11, sequence: 0.88, syncopation: 0.58 },
};

/**
 * TRAP — 2015, and the emptiest arrangement in the project outside ambient.
 *
 * A sub-bass note, a snare on the third beat, a hi-hat, and nothing else at all.
 * Written at 140 with a half-time backbeat, which is the same music as 70 with a
 * backbeat on two and four and is the way the records are counted — the hats
 * are heard against the fast pulse and the snare against the slow one, and that
 * disagreement is the whole rhythmic idea.
 *
 * ## The roll, which used to be an apology here and is now a row
 *
 * The signature gesture is a hi-hat that subdivides *inside* one stroke —
 * triplets, then thirty-seconds, then back — and this header carried the
 * measurement that eventually got it built: **at 140 BPM a written sixteenth is
 * 107 ms and the roll wants 36**. What the table could say was eighths for most
 * of the bar and four consecutive sixteenths across the last beat, the slowest
 * member of that family, and the paragraph that stood here said plainly that the
 * faster ones were missing and no arrangement of these tables would produce them.
 *
 * `DrumPattern.rolls` produces them. The four sixteenths are still written and
 * are still the shape of the gesture; what has changed is that the last two of
 * them **accelerate** — slot 14 struck twice inside itself and slot 15 three
 * times, so the last beat runs 107, 107, 54, 36 ms and arrives at the report's
 * own number. That is a run-in rather than a burst, which is what a trap hat
 * actually does at a barline, and it is the one place in this style where
 * anything happens faster than an eighth.
 *
 * **`open-trap` refuses it**, and the refusal is the same sort as the ones
 * `docs/engine-gaps.md` §6 keeps: that figure's identity is the open hat on the
 * last eighth, `oneHatAtATime` deletes the closed stroke standing under it, and a
 * roll leading into a hat that is already ringing is two ideas competing for one
 * moment. A style that rolled all three of its figures would be the mannerism
 * this genre's own header warns about two sections up.
 *
 * `melodyCells` lean on `[3, 3, 3, 3, 4]` — a chain of dotted eighths, the one
 * figure that produces a three-against-four feeling on a sixteenth grid. It is
 * the same trick `dirtysouth`'s hat plays, moved into the tune.
 */
const trap: Style = {
  id: 'trap',
  label: 'Trap',
  description:
    'A sub, a snare on three and a hat, at 140 counted half-time — the emptiest arrangement in the catalogue.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [134, 152],
  swing: 0,
  modeWeights: { minor: 0.88, major: 0.12 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['halftime', 6], ['straight', 4]],
  transitions: [['break', 5], ['fill', 3], ['shot', 3]],
  fills: [['drop', 6], ['snare-roll', 4], ['lead-in', 2]],
  shots: [[[0, 8], 4], [[0, 6], 3], [[0, 6, 12], 2]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6, note: 'One chord, and the plucked figure over it is doing the entire job of the harmony' },
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'VI', 'VI'], weight: 4 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'VI', 'VI', 'i', 'i', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [3, 3, 3, 3, 4], weight: 5 },
    { cell: [-8, 4, 4], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-8, 8], weight: 5 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    // Two onsets in the bar and one of them is half of it. See `dirtysouth` —
    // this is the same instrument two steps further along.
    { name: 'sub', weight: 6, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 10, dur: 6, tone: 0, vel: 0.76 },
    ] },
    { name: 'sub-and-fifth', weight: 5, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 7, vel: 0.72 },
      { at: 13, dur: 3, tone: 0, vel: 0.7 },
    ] },
    { name: 'two-bar-sub', weight: 4, cycle: 32, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 11, dur: 5, tone: 0, vel: 0.74 },
      { at: 16, dur: 8, tone: 8, vel: 0.82 },
      { at: 27, dur: 5, tone: 10, vel: 0.7 },
    ] },
  ],
  comp: [
    // A plucked bell or plucked synth figure, three sixteenths apart. It is the
    // whole of the harmony and it is one note at a time.
    { name: 'plucked-dotted', weight: 6, voices: 3, arpeggio: true, arpDirection: 'up', cycle: 12,
      hits: [
        { at: 0, dur: 2, vel: 0.6 }, { at: 3, dur: 2, vel: 0.5 },
        { at: 6, dur: 2, vel: 0.56 }, { at: 9, dur: 2, vel: 0.48 },
      ] },
    { name: 'bell-figure', weight: 5, voices: 3, arpeggio: true, arpDirection: 'updown',
      arpOctaves: 2, cycle: 32, hits: [
        { at: 0, dur: 2, vel: 0.58 }, { at: 4, dur: 2, vel: 0.48 },
        { at: 8, dur: 2, vel: 0.54 }, { at: 14, dur: 2, vel: 0.46 },
        { at: 16, dur: 2, vel: 0.56 }, { at: 22, dur: 2, vel: 0.46 },
        { at: 26, dur: 2, vel: 0.5 },
      ] },
    { name: 'held-string', weight: 3, voices: 3, sustain: true, voicing: 'spread', hits: [
      { at: 0, dur: 16, vel: 0.38 },
    ] },
  ],
  drums: [
    /** Eighths, then four sixteenths across the last beat, accelerating out of it. */
    { name: 'trap-kit', weight: 6, voices: {
      bd: [0, 7, 10],
      sd: [8],
      cp: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 13, 14, 15],
    },
    // 107, 107, 54, 36 ms at 140. The last two sixteenths of the bar are the
    // run-in, and they are the whole reason this field exists.
    rolls: { hh: { 14: 2, 15: 3 } } },
    { name: 'open-trap', weight: 5, voices: {
      bd: [0, 10],
      sd: [8],
      cp: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      oh: [14],
    } },
    { name: 'busy-hat', weight: 4, cycle: 32, voices: {
      bd: [0, 7, 10, 16, 22, 26],
      sd: [8, 24],
      cp: [8, 24],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 21, 22, 23, 24, 26, 28, 29, 30, 31],
    },
    // Two runs of four sixteenths in the two-bar cycle, and the second answers
    // the first: the mid-phrase run doubles its last stroke, the phrase-end run
    // takes the full accelerando. A loop where bar two is bigger than bar one,
    // which is what a `cycle: 32` figure is for.
    rolls: { hh: { 23: 2, 30: 2, 31: 3 } } },
  ],
  melody: { leap: 0.24, ornament: 0.1, span: 12, sequence: 0.86, syncopation: 0.6 },
};

/**
 * DRILL — the one style in this genre that overrides `scaleForChord`, and the
 * only one that needed to.
 *
 * A sliding sub, a hat pattern in dotted eighths, a snare that arrives late, and
 * a melodic figure built on the **flattened second**. That last is the whole
 * reason for the override: the genre's rule hands every style a tonic minor
 * pentatonic, which is right for every other minor style here and cannot spell
 * this one's defining interval at all. `minorPentatonic` is 0, 3, 5, 7, 10 —
 * there is no ♭2 in it, there is no ♭6 either, and those two notes are what a
 * drill melody is made of. A pentatonic drill line is a boom-bap line at 142.
 *
 * So `phrygian` on the tonic, fixed for the song, chord unread — the same
 * *shape* of rule the genre states, with a different scale in it. It is not a
 * chord-relative override and it should not be: the harmony here is one chord,
 * exactly as it is next door, and what changed is which five or seven notes are
 * available over it. `synth/stalker` calls the same interval "the Carpenter
 * semitone" and reaches it the same way.
 *
 * The **slide** is the other half of the identity and the table below now says
 * it. This style is one of the five reports that got `BassHit.glide` built, and
 * the sentence it filed — *a drill 808 does not restrike, it bends from one
 * pitch to the next across half a beat* — is a description of a deletion rather
 * than of a new gesture. Each of the three figures had a second struck note
 * standing in for where the first one was going; that note is gone and its pitch
 * is now the first one's destination, so the count of onsets in this table fell
 * by three and the count of notes the ear can follow did not fall at all.
 *
 * `glideTime` is **0.25** on every one of them, which is this style's number and
 * not a default. At 136–148 BPM a beat is about 420 ms, so a quarter of the
 * two-beat note under `slide-seventh` is 210 ms of travel and 630 ms sitting on the
 * arrival — *bends, and then holds*, which is what the report asked for and what
 * separates a sub from a smear. The other two figures are 1.75 and 2 beats long
 * and land at 185 and 210 ms for the same fraction, which is the argument for a
 * fraction: the gesture scales with the note where a count of sixteenths would
 * have made the short one twice as fast as the long one. The far end of the same
 * field is a Reese, which is *entirely* movement and takes the default of 1;
 * this is a sub that arrives somewhere and stays there, and half a beat is the
 * whole of the difference.
 *
 * ## Two of the three hat figures roll, and the third refuses on its own terms
 *
 * `DrumPattern.rolls` — `docs/engine-gaps.md` §3.15, reported from next door in
 * `trap` with the arithmetic attached. `drill-kit` takes one stutter on the last
 * eighth and `late-snare` takes `trap`'s run-in across the four sixteenths it
 * already writes, both at 136–148 BPM where a tripled sixteenth is 34–37 ms.
 *
 * **`dotted-drill` refuses**, and it is the more interesting of the two answers.
 * That figure is sixteen hats three slots apart across a 48-slot cycle: a dotted
 * eighth chain, three against four, coming home every three bars, and it is the
 * one thing in this style that could not be written any other way. A retrigger
 * inside one of its steps is a second cross-rhythm asking to be counted at the
 * same time as the first, and the ear resolves that by hearing neither. The
 * stutter is a gesture *against* a plain pulse; this figure has no plain pulse to
 * be against, which is its whole point.
 */
const drill: Style = {
  id: 'drill',
  label: 'Drill',
  description:
    'A sliding sub, dotted-eighth hats and a melody built on the flat second — the one style here with its own scale.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [136, 148],
  swing: 0,
  modeWeights: { minor: 0.96, major: 0.04 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['halftime', 6], ['straight', 3]],
  transitions: [['break', 5], ['fill', 3], ['shot', 2]],
  fills: [['drop', 6], ['snare-roll', 3], ['lead-in', 2]],
  shots: [[[0, 8], 4], [[0, 3, 6], 3]],
  /**
   * Phrygian on the tonic, fixed, and the chord is not read — see the header.
   * The one style override in the genre, and the mirror of the one funk makes:
   * there a style leaves the tonic scale for the chord, here a style keeps the
   * tonic and changes which notes are on it.
   */
  scaleForChord: (tonic) => makeScale(tonic, 'phrygian'),
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 },
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 5, note: 'The flat second as a chord as well as a note. It is the same interval doing both jobs' },
      { chords: ['i', 'i', 'bII', 'bII', 'i', 'i', 'bII', 'bII'], weight: 3 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'bII', 'bII', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 5 }],
    chorus: [{ chords: ['bII', 'bII', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [3, 3, 3, 3, 4], weight: 5 },
    { cell: [-8, 4, 4], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [8, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-8, 8], weight: 5 },
  ],
  bass: [
    /**
     * One 808 that moves, in each of the three. The pairs that were merged were
     * already written end to end — no rest was filled and no note was lengthened
     * past where the pair already reached — so what changed is the articulation
     * and only the articulation, which is exactly the thing that was wrong.
     */
    { name: 'slide-seventh', weight: 6, hits: [
      // Struck once on the downbeat at full weight and travelling a minor
      // seventh. The two-sixteenth ♭7 that used to be struck at slot 6 is where
      // this arrives, 210 ms in, and it holds there for the rest of the note.
      { at: 0, dur: 8, tone: 0, vel: 1, glide: 10, glideTime: 0.25 },
      { at: 10, dur: 6, tone: 0, vel: 0.74 },
    ] },
    { name: 'slide-up', weight: 5, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      /**
       * The ♭3 was a one-sixteenth grace before the fourth, which is how a
       * table with no glide spells a note that leaves. It is one note now, and
       * it takes the arrival's velocity rather than the grace's 0.6: a single
       * attack carries the whole gesture, and the loud end of the gesture was
       * always the note it was going to.
       */
      { at: 9, dur: 7, tone: 3, vel: 0.72, glide: 5, glideTime: 0.25 },
    ] },
    { name: 'two-bar-slide', weight: 4, cycle: 32, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 11, dur: 5, tone: 0, vel: 0.72 },
      /**
       * The ♭2 on the second downbeat, sliding a semitone back to the tonic.
       * This is the figure the header's whole scale override exists for, and it
       * used to end in a one-sixteenth root at 0.56 — a note nobody plays as a
       * statement, written only to name where the ♭2 went. It is the
       * destination now.
       */
      { at: 16, dur: 8, tone: 1, vel: 0.8, glide: 0, glideTime: 0.25 },
      { at: 26, dur: 6, tone: 8, vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'plucked-phrygian', weight: 6, voices: 3, arpeggio: true, arpDirection: 'down',
      cycle: 12, hits: [
        { at: 0, dur: 2, vel: 0.6 }, { at: 3, dur: 2, vel: 0.5 },
        { at: 6, dur: 2, vel: 0.56 }, { at: 9, dur: 2, vel: 0.46 },
      ] },
    { name: 'dark-pad', weight: 4, voices: 3, sustain: true, voicing: 'quartal', hits: [
      { at: 0, dur: 16, vel: 0.4 },
    ] },
    { name: 'two-stabs', weight: 3, voices: 3, voicing: 'quartal', hits: [
      { at: 0, dur: 3, vel: 0.6 }, { at: 8, dur: 3, vel: 0.54 },
    ] },
  ],
  drums: [
    { name: 'drill-kit', weight: 6, voices: {
      bd: [0, 3, 6, 11],
      sd: [8],
      cp: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    },
    // One stutter on the last eighth and nothing else — eight strokes a bar and
    // one of them is three. The bar is otherwise plain because the dotted kick
    // above is already saying something against it.
    rolls: { hh: { 14: 3 } } },
    { name: 'late-snare', weight: 5, voices: {
      bd: [0, 6, 10],
      sd: [9],
      rim: [4],
      hh: [0, 2, 4, 6, 8, 10, 12, 13, 14, 15],
    },
    // The same run-in `trap-kit` takes, on the same four sixteenths, at 136–148
    // instead of 134–152. The snare has already arrived late; the hat catches up.
    rolls: { hh: { 14: 2, 15: 3 } } },
    { name: 'dotted-drill', weight: 4, cycle: 48, voices: {
      bd: [0, 3, 6, 11, 16, 19, 22, 27, 32, 35, 38, 43],
      sd: [8, 24, 40],
      cp: [8, 24, 40],
      hh: [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45],
    } },
  ],
  melody: { leap: 0.22, ornament: 0.12, span: 11, sequence: 0.88, syncopation: 0.62 },
};

/**
 * CLOUD — slow, washed and almost harmonic, and the softest thing in the genre.
 *
 * A pad or a pitched-down vocal sample held across four bars, a hi-hat a long
 * way back, and a kick that arrives about twice a bar. It is what happens when
 * the loop stops being a rhythmic object and becomes a *field* — the only style
 * here whose pad matters more than its comp, and the only one that would survive
 * having the drums taken off entirely.
 *
 * `counterSpacing` is 1 rather than the default half-beat. The counter layer
 * answers in the lead's gaps, and here those gaps are two bars long; a burst of
 * eighth notes into one of them reads as a different record breaking in, which
 * is the sentence ambient's table already makes about the same field.
 *
 * `breakCarrier: 'pad'` is the only one in the catalogue. When the beat drops
 * out of one of these the thing still sounding is the wash — the bass here
 * writes two long notes a bar and has often stopped by the seam, which is
 * exactly the failure `Style.breakCarrier`'s own worked example measured on a
 * tanpura.
 */
const cloud: Style = {
  id: 'cloud',
  label: 'Cloud',
  description:
    'A pad held across four bars, a hat a long way back, and a kick that turns up about twice a bar.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [68, 84],
  swing: 0,
  modeWeights: { minor: 0.7, major: 0.3 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  feels: [['laidback', 5], ['halftime', 3], ['straight', 3]],
  transitions: [['fill', 2], ['break', 4], ['elide', 3]],
  breakCarrier: 'pad',
  counterSpacing: 1,
  effects: {
    pad: { reverb: 0.72, lowpass: 3600 },
    comp: { reverb: 0.55, delay: 0.35 },
    melody: { reverb: 0.6, delay: 0.4 },
  },
  shots: [[[0, 8], 3]],
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
    verse: [
      { chords: ['i9', 'i9', 'i9', 'i9', 'VImaj9', 'VImaj9', 'VImaj9', 'VImaj9'], weight: 6 },
      { chords: ['i11', 'i11', 'i11', 'i11', 'i11', 'i11', 'i11', 'i11'], weight: 4 },
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9'], weight: 3 },
    ],
    chorus: [
      { chords: ['VImaj9', 'VImaj9', 'VII7', 'VII7', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['iv9', 'iv9', 'iv9', 'iv9', 'i9', 'i9', 'i9', 'i9'], weight: 3 },
    ],
    solo: [{ chords: ['i9', 'i9', 'i9', 'i9', 'VImaj9', 'VImaj9', 'VImaj9', 'VImaj9'], weight: 5 }],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9'], weight: 6 }],
    chorus: [{ chords: ['IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 5 },
    { cell: [-8, 8], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 3 },
  ],
  bass: [
    { name: 'two-long', weight: 6, sustain: true, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 8, dur: 8, tone: 0, vel: 0.68 },
    ] },
    { name: 'held-with-answer', weight: 4, sustain: true, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 12, dur: 4, tone: 7, vel: 0.64 },
    ] },
    { name: 'two-bar-drift', weight: 3, cycle: 32, sustain: true, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 14, dur: 2, tone: 10, vel: 0.6 },
      { at: 16, dur: 12, tone: 3, vel: 0.7 },
      { at: 30, dur: 2, tone: 0, vel: 0.58 },
    ] },
  ],
  comp: [
    { name: 'wash', weight: 6, voices: 4, sustain: true, voicing: 'spread', hits: [
      { at: 0, dur: 16, vel: 0.52 },
    ] },
    { name: 'slow-arp', weight: 4, voices: 4, arpeggio: true, arpDirection: 'updown', cycle: 20,
      hits: [
        { at: 0, dur: 4, vel: 0.44 }, { at: 6, dur: 4, vel: 0.38 },
        { at: 12, dur: 4, vel: 0.42 }, { at: 16, dur: 4, vel: 0.36 },
      ] },
    { name: 'one-chord', weight: 3, voices: 4, voicing: 'spread', hits: [
      { at: 0, dur: 10, vel: 0.5 },
    ] },
  ],
  drums: [
    { name: 'distant', weight: 6, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [0, 4, 8, 12],
    } },
    { name: 'brushed-cloud', weight: 4, voices: {
      bd: [0, 11],
      rim: [8],
      sh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'half-open', weight: 3, voices: {
      bd: [0],
      sd: [8],
      oh: [6, 14],
      hh: [2, 4, 10, 12],
    } },
  ],
  melody: { leap: 0.2, ornament: 0.3, span: 13, sequence: 0.6, syncopation: 0.35 },
};

/**
 * LO-FI — the bedroom loop, and the second style here whose identity is the
 * damage rather than the notes.
 *
 * Eight bars of a jazz record, sampled off a worn copy at a low rate, with the
 * bottom filtered away, the top rolled off, a hiss under it and a soft kit. It
 * is `boombap` with the aggression removed and the *degradation kept* — and the
 * distinction matters because the degradation was an accident in 1993 and is a
 * decision now.
 *
 * `effects` names four keys and the four are the whole style: a `highpass` at
 * 200 Hz taking the weight out of the loop, a `lowpass` at 3600 taking the air
 * off it, `crush` at 8 bits, and enough reverb that the room is audible. It is
 * the clearest case in this genre of `Style.effects` doing what it exists for —
 * a lo-fi record made in any era of this genre is this treatment, because the
 * treatment *is* the record, and the era's own filtering would produce a clean
 * one in 2015 and call it the same style.
 *
 * `bass` is deliberately quiet in the arrangement rather than absent: the
 * highpass is on the comp, not on everything, so what is left underneath is a
 * soft round bass and a kick — which is what those records do, and is the reason
 * they are listenable at low volume for six hours.
 */
const lofi: Style = {
  id: 'lofi',
  label: 'Lo-fi',
  description:
    'Eight bars of a jazz record off a worn copy: bottom filtered away, top rolled off, hiss underneath and a soft kit.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [72, 88],
  swing: 0.2,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['laidback', 5], ['pocket', 5], ['straight', 2]],
  transitions: [['fill', 4], ['elide', 3], ['break', 2]],
  breakCarrier: 'comp',
  effects: {
    comp: { highpass: 200, lowpass: 3600, crush: 8, reverb: 0.34 },
    melody: { lowpass: 4200, crush: 8, reverb: 0.3 },
    drums: { lowpass: 5200, crush: 10 },
  },
  shots: [[[0, 6], 3]],
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'iv9', 'iv9'], weight: 5 }],
    verse: [
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9'], weight: 6 },
      { chords: ['i11', 'i11', 'VImaj9', 'VImaj9', 'i11', 'i11', 'VImaj9', 'VImaj9'], weight: 5 },
      { chords: ['i9', 'i9', 'VII7', 'VII7', 'IIImaj9', 'IIImaj9', 'VImaj9', 'VImaj9'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv9', 'iv9', 'VII7', 'VII7', 'IIImaj9', 'IIImaj9', 'i9', 'i9'], weight: 5 },
      { chords: ['VImaj9', 'VImaj9', 'i9', 'i9', 'VImaj9', 'VImaj9', 'i9', 'i9'], weight: 4 },
    ],
    solo: [{ chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9'], weight: 5 }],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'vi9', 'vi9', 'ii9', 'ii9', 'V13', 'V13'], weight: 5 },
      { chords: ['Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9'], weight: 4 },
    ],
    chorus: [{ chords: ['ii9', 'ii9', 'V13', 'V13', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-2, 2, 2, 4, 4, 2], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [6, 2, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [-8, 8], weight: 3 },
  ],
  bass: [
    { name: 'round-and-soft', weight: 6, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 7, vel: 0.68 },
      { at: 12, dur: 4, tone: 10, vel: 0.62 },
    ] },
    { name: 'upright-two', weight: 5, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 8, dur: 8, tone: 7, vel: 0.7 },
    ] },
    { name: 'two-bar-soft', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 3, vel: 0.66 },
      { at: 12, dur: 4, tone: 5, vel: 0.64 },
      { at: 16, dur: 6, tone: 7, vel: 0.8 },
      { at: 24, dur: 8, tone: 0, vel: 0.68 },
    ] },
  ],
  comp: [
    { name: 'worn-loop', weight: 6, voices: 4, voicing: 'guide', cycle: 32, hits: [
      { at: 0, dur: 6, vel: 0.6 }, { at: 8, dur: 4, vel: 0.5 },
      { at: 16, dur: 6, vel: 0.58 }, { at: 26, dur: 4, vel: 0.48 },
    ] },
    { name: 'rhodes-chop', weight: 5, voices: 4, voicing: 'guide', hits: [
      { at: 0, dur: 4, vel: 0.6 }, { at: 6, dur: 2, vel: 0.48 }, { at: 10, dur: 4, vel: 0.54 },
    ] },
    { name: 'held-warm', weight: 3, voices: 4, sustain: true, voicing: 'spread', hits: [
      { at: 0, dur: 16, vel: 0.46 },
    ] },
  ],
  drums: [
    { name: 'soft-kit', weight: 6,
      voices: {
        bd: [0, 10],
        sd: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
      },
      ghosts: { sd: [3, 5, 11, 13] } },
    { name: 'brushes', weight: 5,
      voices: {
        bd: [0, 10],
        rim: [4, 12],
        sh: [0, 2, 4, 6, 8, 10, 12, 14],
      },
      ghosts: { sd: [7, 15] } },
    { name: 'lazy', weight: 4,
      voices: {
        bd: [0, 11],
        sd: [4, 12],
        hh: [0, 4, 8, 12],
        tb: [4, 12],
      },
      ghosts: { sd: [13] } },
  ],
  melody: { leap: 0.24, ornament: 0.32, span: 13, sequence: 0.58, syncopation: 0.5 },
};

/**
 * ABSTRACT — the loop that does not fit the bar, and the one place in this genre
 * where `cycle` is the composition rather than a convenience.
 *
 * The corner of the music made by people who cut their four bars out of the
 * wrong place on purpose: a comp figure five beats long against a four-beat bar,
 * a counter-ostinato at a different length again, and a kit that stays put while
 * both of them walk around it. It is the same device `synth/stalker` is built on
 * and it arrives here from the opposite direction — there it is a composer
 * choosing 5/4 against 4/4, here it is somebody who did not trim the sample.
 *
 * `counterMode: 'ostinato'` is the field that makes it work and this is the only
 * style in the genre that names it. An answering counter-melody is *supposed* to
 * be moved out of the tune's way note by note; an ostinato moved note by note
 * has stopped being one, and two figures of different lengths phasing against
 * each other is the entire texture.
 *
 * `cycle: 20` against a sixteen-slot bar comes home every four bars; the counter
 * runs at 12 and comes home every three. Neither shares a useful factor with the
 * other, so the pair does not settle inside an eight-bar section — which is
 * exactly what `synth/berlin`'s counter table is chosen for, and the same
 * arithmetic.
 */
const abstract: Style = {
  id: 'abstract',
  label: 'Abstract',
  description:
    'A figure five beats long over a four-beat bar and a second one at three, phasing against a kit that stays put.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [82, 96],
  swing: 0.14,
  modeWeights: { minor: 0.72, major: 0.28 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  feels: [['pocket', 4], ['laidback', 4], ['straight', 3]],
  transitions: [['fill', 4], ['elide', 3], ['break', 3]],
  counterMode: 'ostinato',
  counterPatterns: [
    { name: 'three-beat', weight: 5, voices: 1, cycle: 12, hits: [
      { at: 0, dur: 2, vel: 0.5 }, { at: 4, dur: 2, vel: 0.42 }, { at: 7, dur: 2, vel: 0.46 },
    ] },
    { name: 'seven-slot', weight: 4, voices: 1, cycle: 14, hits: [
      { at: 0, dur: 2, vel: 0.48 }, { at: 5, dur: 2, vel: 0.42 }, { at: 10, dur: 2, vel: 0.44 },
    ] },
    { name: 'ten-slot', weight: 3, voices: 1, cycle: 10, hits: [
      { at: 0, dur: 2, vel: 0.5 }, { at: 6, dur: 2, vel: 0.42 },
    ] },
  ],
  shots: [[[0, 6], 3], [[0, 5, 10], 2]],
  progressions: {
    intro: [{ chords: ['i11', 'i11', 'i11', 'i11'], weight: 5 }],
    verse: [
      { chords: ['i11', 'i11', 'i11', 'i11', 'i11', 'i11', 'i11', 'i11'], weight: 6, note: 'One chord, so the only thing that can move is the phase — and it does' },
      { chords: ['i11', 'i11', 'iv9', 'iv9', 'i11', 'i11', 'iv9', 'iv9'], weight: 4 },
    ],
    chorus: [
      { chords: ['VImaj9', 'VImaj9', 'i11', 'i11', 'VImaj9', 'VImaj9', 'i11', 'i11'], weight: 5 },
      { chords: ['iv9', 'iv9', 'VII7', 'VII7', 'i11', 'i11', 'i11', 'i11'], weight: 3 },
    ],
    bridge: [{ chords: ['i11', 'i11', 'i11', 'i11', 'i11', 'i11', 'i11', 'i11'], weight: 5 }],
    solo: [{ chords: ['i11', 'i11', 'i11', 'i11', 'i11', 'i11', 'i11', 'i11'], weight: 5 }],
    outro: [{ chords: ['i11', 'i11', 'i11', 'i11'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 6 }],
    chorus: [{ chords: ['IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [3, 3, 2, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [5, 5, 6], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    { name: 'five-beat', weight: 6, cycle: 20, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.62 },
      { at: 11, dur: 3, tone: 10, vel: 0.7 },
      { at: 16, dur: 4, tone: 7, vel: 0.66 },
    ] },
    { name: 'square-loop', weight: 4, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 3, vel: 0.64 },
      { at: 10, dur: 6, tone: 5, vel: 0.68 },
    ] },
    { name: 'seven-slot', weight: 3, cycle: 28, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 7, dur: 3, tone: 7, vel: 0.68 },
      { at: 14, dur: 4, tone: 0, vel: 0.78 },
      { at: 21, dur: 3, tone: 10, vel: 0.64 },
    ] },
  ],
  comp: [
    { name: 'five-beat-figure', weight: 6, voices: 4, voicing: 'guide', cycle: 20, hits: [
      { at: 0, dur: 3, vel: 0.62 }, { at: 6, dur: 2, vel: 0.5 },
      { at: 10, dur: 3, vel: 0.56 }, { at: 16, dur: 4, vel: 0.52 },
    ] },
    { name: 'three-beat-figure', weight: 5, voices: 3, voicing: 'quartal', cycle: 12, hits: [
      { at: 0, dur: 3, vel: 0.6 }, { at: 5, dur: 2, vel: 0.48 }, { at: 9, dur: 3, vel: 0.52 },
    ] },
    { name: 'held', weight: 2, voices: 4, sustain: true, voicing: 'spread', hits: [
      { at: 0, dur: 16, vel: 0.4 },
    ] },
  ],
  drums: [
    // The kit stays put. It is the only thing in the arrangement that does.
    { name: 'stays-put', weight: 6,
      voices: {
        bd: [0, 10],
        sd: [4, 12],
        hh: [0, 2, 4, 6, 8, 10, 12, 14],
      },
      ghosts: { sd: [3, 11] } },
    { name: 'off-kit', weight: 5,
      voices: {
        bd: [0, 7],
        rim: [4, 12],
        sh: [2, 5, 9, 13],
        hh: [0, 3, 6, 9, 12, 15],
      } },
    { name: 'sparse-chop', weight: 3,
      voices: {
        bd: [0, 6, 11],
        sd: [4, 12],
        hh: [0, 4, 8, 12],
      },
      ghosts: { sd: [7] } },
  ],
  melody: { leap: 0.3, ornament: 0.26, span: 14, sequence: 0.5, syncopation: 0.75 },
};

/**
 * MINIMAL — two elements and a voice, and the last entry because it is what is
 * left when everything else in this file is taken away.
 *
 * A kick, a snap, and one held note. There is no comp figure worth the name, the
 * bass plays twice a bar, and the whole record is a frame for something the
 * engine cannot put in it — see the genre header, and `hiphop/vocals.ts`. This
 * is the honest limit case of the idea the rest of the catalogue is built on: if
 * the loop is the composition, then a loop with two things in it is still a
 * composition, and it is the one people quote.
 *
 * `excludeLayers` names the pad and the brass. Not a density decision — the
 * arrangement rules would add them where there is room, and here there is
 * nothing *but* room, so a pad would be drawn into every section and would be
 * the loudest thing on a record whose subject is emptiness. `drums` still has
 * three rows because `generateSong` draws the figure before it knows about
 * exclusions and an empty table throws, which is the wart `docs/engine-gaps.md`
 * §4 records; here nothing is excluded that would trip it, and the rows are real.
 *
 * `melody.span` is 8 and `sequence` is 0.9, both the extreme values in the file.
 * Whatever the hook is, it is three notes and it comes back exactly.
 */
const minimal: Style = {
  id: 'minimal',
  label: 'Minimal',
  description:
    'A kick, a snap and one held note: what is left when everything else in this catalogue is taken away.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [78, 92],
  swing: 0,
  modeWeights: { minor: 0.8, major: 0.2 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['straight', 5], ['halftime', 4], ['laidback', 2]],
  transitions: [['break', 5], ['fill', 2], ['elide', 3]],
  excludeLayers: ['pad', 'brass'],
  fills: [['drop', 7], ['lead-in', 2]],
  shots: [[[0, 8], 3], [[0], 2]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 7 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'VI', 'VI'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 7 }],
    chorus: [{ chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'bVII', 'bVII'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-8, 4, 4], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [4, 4, -8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 4 },
  ],
  bass: [
    { name: 'twice-a-bar', weight: 6, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 10, dur: 6, tone: 0, vel: 0.72 },
    ] },
    { name: 'once', weight: 5, sustain: true, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
    ] },
    { name: 'two-bar-pair', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 10, dur: 6, tone: 0, vel: 0.7 },
      { at: 16, dur: 8, tone: 7, vel: 0.78 },
      { at: 27, dur: 5, tone: 0, vel: 0.68 },
    ] },
  ],
  comp: [
    { name: 'one-note', weight: 6, voices: 2, voicing: 'power', hits: [
      { at: 0, dur: 4, vel: 0.56 },
    ] },
    { name: 'two-notes', weight: 4, voices: 2, voicing: 'power', hits: [
      { at: 0, dur: 3, vel: 0.58 }, { at: 10, dur: 3, vel: 0.5 },
    ] },
    { name: 'held-thin', weight: 3, voices: 3, sustain: true, voicing: 'quartal', hits: [
      { at: 0, dur: 16, vel: 0.34 },
    ] },
  ],
  drums: [
    { name: 'kick-and-snap', weight: 6, voices: {
      bd: [0, 10],
      cp: [8],
    } },
    { name: 'with-hat', weight: 5, voices: {
      bd: [0, 6, 10],
      cp: [8],
      hh: [0, 4, 8, 12],
    } },
    { name: 'two-bar-empty', weight: 4, cycle: 32, voices: {
      bd: [0, 10, 16, 26],
      cp: [8, 24],
      hh: [4, 12, 20, 28],
    } },
  ],
  melody: { leap: 0.18, ornament: 0.08, span: 8, sequence: 0.9, syncopation: 0.55 },
};

export const STYLES: Record<string, Style> = {
  oldschool,
  electrorap,
  miami,
  breaks,
  boombap,
  jazzrap,
  soulloop,
  hornloop,
  hardcore,
  conscious,
  party,
  gfunk,
  clubrap,
  bounce,
  dirtysouth,
  crunk,
  chopped,
  phonk,
  trap,
  drill,
  cloud,
  lofi,
  abstract,
  minimal,
};
