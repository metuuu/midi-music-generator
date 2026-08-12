/**
 * The drum and bass catalogue, 1990–2018.
 *
 * Organised by **what the drums are made of**, because in this repertoire that
 * is the question everything else follows from. Sort it by tempo and twenty of
 * the twenty-four collapse onto one number; sort it by harmony and they collapse
 * further, because seventeen of the twenty-four lead with a single chord and
 * three more with two.
 * Sort it by *whether the kit is a recording of a person or a stack of one-shot
 * samples* — and, where it is a recording, by how finely it has been cut — and
 * the catalogue separates cleanly, because that one choice decides the ghost
 * notes, the swing, the cycle length, the mix and which decade the record is
 * from.
 *
 * ## The five things every table below is made of
 *
 * **The bar is a two-step and the tempo is a lie.** At 174 BPM a sixteenth is
 * 86 ms, and nothing in this music is played at 174. The kick is on beat one and
 * the snare is on beat three — slots 0 and 8 of a sixteen-slot bar — which is a
 * backbeat at 87, and *that* is the tempo the body hears. Everything above the
 * snare runs at the written speed and everything at or below it runs at half.
 * This is the only genre in the project where the drum table and the bass table
 * are counting in different units, and no field says so; the two tables simply
 * agree, style by style, and a reader who changes one has to change the other.
 *
 * **The bottom is one note and it is spelled in numbers.** Every bass row here
 * uses **semitones from the chord root, taken literally**, and never
 * `root`/`fifth`/`seventh`. A sub-bass is a sine with a pitch envelope on it,
 * triggered from a keyboard; it is a *shape* and not an outline of a chord, and
 * a shape that renegotiated with the harmony would have stopped being one.
 * `BassTone` argues the same thing from the other end; funk and hiphop both say
 * it too.
 *
 * **No figure spans more than a twelfth, and that is the music rather than a
 * ceiling.** It was written here as a ceiling — `docs/engine-gaps.md` §1.3, the
 * one six genres found by ear and narrowed their figures to fit — and the
 * number in that sentence was wrong. It has since been measured: `placeRoot`
 * scores every octave of the root against the whole span, the reach is
 * `SHAPE_CEILING - BASS_RANGE[0]` = 35 semitones, and **every span up to 24 —
 * two octaves exactly — stands at all twelve roots**. See `unplaceableRoots`
 * for the derivation and `npm run genres` for the assertion, which is total over
 * all 1,034 bass figures in the project.
 *
 * These rows were re-read against the real number and none of them wanted the
 * width. A sub-bass is one register: the obvious gesture in this music is the
 * octave under the drop, which is twelve semitones from whichever end it is
 * written, and a figure reaching a nineteenth would have stopped being a sub and
 * started being a bassline. **Which end it is written from is not free, and it
 * is why every row below still writes its octave upward from the root as `12`.**
 * Written up, `placeRoot` puts the root at MIDI 29–40 across the twelve roots
 * and the answer above it; written down as `-12`, the root has to climb to 40–51
 * to leave room underneath. The sub is the bottom note, so the bottom note is
 * the root. `npm run genres` still catches a genuinely folded figure as *"a riff
 * is the same shape over every chord quality"*, and now as *"every bass figure
 * has an octave it fits in"* as well.
 *
 * **The hole is enormous and it is the point.** A jungle bar has two kicks, one
 * snare and a bass note that lasts three and a half beats. The sparsest tables
 * here — `minimal`, `autonomic`, `neurofunk`, `deep` — are not thin versions of
 * the busy ones. What the ear is being asked to hear is the *decay* of the sub
 * and the space the hats are crossing, and a generator that filled it would
 * produce something perfectly competent that no label has ever pressed.
 *
 * **`cycle: 32` is the norm rather than the exception.** Ten styles in hiphop
 * carry a two-bar *drum* cycle; **every one of the twenty-four** carries one here, and
 * on the break-based ones it is not an ornament, it is the format. A chopped break is a two-bar
 * object by construction — the second bar is where the edit that makes it a
 * *chop* rather than a *loop* actually lands — and a bar-shaped drum table
 * cannot say that at all. `cycle: 12` appears three times — on `halftime`'s
 * dotted eighth-note hat and on two bell figures — and that hat is the one shape
 * this catalogue borrows wholesale from the genre next door.
 *
 * ## Ghost notes, and the line they draw across this genre's history
 *
 * `DrumPattern.ghosts` is the field without which this genre could not have been
 * written at all, and it matters more here than in the genre that asked for it.
 * A ghost is a stroke played deliberately under audibility — the snare at
 * roughly a quarter of the backbeat, filling the sixteenths nobody is counting —
 * and **a chopped break is very largely made of them.** The six-second drum
 * break this entire music is built out of has four loud strokes in it and about
 * eleven quiet ones, and if you write the four you have written a drum machine
 * playing a rock beat.
 *
 * **Sixteen styles below write ghosts and eight write none** — 216 written ghost strokes in all, and unlike
 * hiphop's split — which runs across the map, between the sampled corner and the
 * drawn one — **this one runs down the middle of the genre's history.** Every
 * style whose kit is a recording of a drummer ghosts: `hardcore`, `darkcore`,
 * `jungle`, `ragga`, `hardstep`, `jazzstep`, `atmospheric`, `intelligent`,
 * `drumfunk`, `liquid`, `rollers`, `sambass`, `breakcore`, `dubwise`, `deep`
 * and `revival`. Every style whose kit is a stack of individually sampled
 * one-shots, layered and gated, writes none: `bleep`, `techstep`, `neurofunk`,
 * `jumpup`, `dancefloor`, `autonomic`, `halftime` and `minimal`. The dividing
 * year is about 1997, and the silence in the second list **is a claim** — a
 * techstep snare is one sample triggered once at one velocity, and a ghosted
 * copy of it a sixteenth later is not a quiet stroke, it is a second snare.
 *
 * Where they are written they are written on the **odd** sixteenths, which is
 * where a drawn `Feel.ghost` would have put them, so writing one *spends* it —
 * `DrumPattern.ghosts` documents the arithmetic and the 94% measurement. Four
 * styles here ghost only one side of the backbeat on purpose, so a `pocket` or
 * `funk` feel completes the pair rather than crowding it.
 *
 * ## What is uniform across all twenty-four, and why
 *
 *  - **`relativeMajorChorus: 0` everywhere.** The lift into the relative major
 *    is an arranger's gesture and there is no arranger. What happens at the drop
 *    here is that the kick and the sub arrive at once; the harmony has not moved
 *    since bar one and is not going to.
 *  - **`beatsPerBar: 4` everywhere**, including `halftime`, whose whole identity
 *    is that it is *felt* in half. That is a fact about the drum table and not
 *    about the metre — the hats still run at 172 — and writing it as a 2/4 would
 *    have halved the hat resolution, which is the one thing that style cannot
 *    afford.
 *  - **`swing` is zero on the programmed eight and small on the sixteen that
 *    sample a break.** 0.06 to 0.12, and what is being described is not a feel
 *    but the source recording's own push: a funk drummer's sixteenths at 136,
 *    resampled to 174, arrive a few milliseconds late relative to a grid and
 *    that residue is audible. A jazz swing of 0.5 would delete the sixteenth
 *    grid this music is written on.
 *  - **Thirteen of the twenty-four write `excludeLayers: ['brass']`.** There is no
 *    horn section in most of this music, and the thing a listener would call a
 *    stab in `techstep`, `jungle`, `jumpup` or `drumfunk` is a **chord** — which
 *    in this engine is the comp layer and not the brass one. The eleven that
 *    keep brass are the ones where a horn section or a string section is
 *    genuinely on the record: the rave orchestra hit, the sampled jazz horns,
 *    and the string swell under a breakdown. `dnb/index.ts` records what writing
 *    the layer anyway measured, on a check the whole catalogue shares.
 *  - **`syncopation` is high, at 0.5 to 0.75.** A chopped break starts wherever
 *    the source bar happened to be cut, so a melodic figure that respects the
 *    barline sounds like it was typed in — which is exactly what a chopped
 *    sample never is.
 *
 * ## The two ceilings that shaped these tables, both of which have come down
 *
 * **Nothing subdivided below a sixteenth** — `docs/engine-gaps.md` §3.15, found
 * first by hiphop and hit far harder here. At 174 BPM a written sixteenth is
 * 86 ms and an amen's internal detail wants 43. What was written below was the
 * sixteenth-note ghost lattice, the two-bar cycle and the displaced snare, which
 * are the three members of that family the grid could address.
 *
 * `DrumPattern.rolls` addresses the rest and **three tables now spend it**:
 * `jungle`, `drumfunk` and `breakcore`, at 33,546, 45,405 and 38,457 rolled
 * strokes over 200 songs each, against 0 over the other twenty-one styles' 4,200
 * and 0 reaching a pair of hands anywhere. Those refusals are argued in
 * `dnb/index.ts`; what belongs here is the arithmetic, because the arithmetic is
 * what makes this genre's answer different from hiphop's rather than a copy of
 * it.
 *
 * **A sixteenth at these tempos is 86 ms at 174 and 75 at 200, where trap's is
 * 107 at 140.** So the same integers buy different music. `roll: 2` here is
 * 42.6–45.7 ms — the 43 the paragraph above measured off the records, arrived at
 * by dividing a slot in two rather than in three, where hiphop needed `roll: 3`
 * to reach 36. `roll: 3` here is 28.4–30.5 ms, which is 33 to 35 strokes a
 * second and faster than anything in `trap`. `roll: 4` is 21 ms in most of the
 * genre and **18.8 at `breakcore`'s 200, which is 53 Hz and therefore a pitch**
 * rather than a rhythm. That last number is why the count that reads as a stutter
 * here is 2, where next door it is 3: the tempo already did a third of the work.
 *
 * The shape differs too, and it is the reason this was a separate job rather
 * than a table edit. A trap roll subdivides the last sixteenth or two before a
 * barline, so it is spelled `{ 14: 2, 15: 3 }` and it is over. This genre's
 * gesture is a snare covering a **whole beat**, which `DrumEvent.roll` spells as
 * four rolled strokes in a row — `{ 16: 2, 17: 2, 18: 2, 19: 2 }`, eight strokes
 * filling 345 ms — because a roll is fenced to the slot it stands on and a beat
 * is four slots. Both figures that take the rush had to grow four written snare
 * hits to carry it, which is the honest sign that this is a change to the part
 * and not an ornament on it.
 *
 * **A bass note can slide, and this genre's three reports are what built the
 * field** — §3.16, now `BassHit.glide`. A Reese *is* a slide: two detuned saws
 * beating against each other while the pitch moves under a filter, and the
 * movement is the sound. A wobble is the same statement with an LFO instead of a
 * hand. Both were written below as struck notes a semitone or a fifth apart —
 * the right *contour* arrived at by the wrong mechanism — and `techstep`,
 * `neurofunk` and `jumpup` now write notes that travel instead. **Forty-three
 * written bass onsets across the three styles became thirty-eight, and sixteen
 * of the thirty-eight move.** None of them writes a `glideTime`: the default is
 * the whole note, which is the one thing every author here agrees a Reese wants.
 *
 * Two things about it are still out of reach and both are recorded where they
 * bite rather than here. A glide cannot *begin late*, so a note that holds and
 * then lifts costs two notes — see `techstep`'s `held-reese`. And a glide is one
 * leg, so a contour that turns costs one re-gate at the turning point, which is
 * the trade `techstep`'s `reese` takes and `neurofunk`'s `talking` refuses.
 */

import { makeScale } from '../../core/scale.js';
import type { Style } from '../../style/types.js';

/**
 * BLEEP — 1990, and the only style here that predates the drums.
 *
 * Sheffield, two years before anybody said "jungle": a sine bleep, a sub-bass
 * with more energy below 50 Hz than the rest of the record put together, and a
 * house kick with a breakbeat leaning on it. It is in this catalogue because it
 * is where the **bottom** comes from — the drums arrive from hip-hop and the
 * sub arrives from here, and every style below is the two of them meeting.
 *
 * The tempo is the giveaway and is the reason this style sits alone in its
 * range: 126 to 138 is a house record, and at that speed `buildForm` leaves the
 * sections at their written length rather than doubling them. So this style's
 * bars are twice the size of everybody else's and its sections are half as long,
 * which is exactly the historical relationship.
 *
 * **No ghosts, and it is the earliest style in the file to write none.** The kit
 * is a 909 with a sampled break underneath it at low level, and the 909 has one
 * velocity per step. The ghosting starts when the break comes to the front,
 * which is the next entry.
 *
 * `modeWeights` leans minor but not hard. The bleep itself is a bare sine
 * playing three or four notes, and half of what got pressed sat on a major
 * triad because a sine wave has no third to argue with.
 */
const bleep: Style = {
  id: 'bleep',
  label: 'Bleep',
  description:
    'Sheffield, 1990: a sine bleep, a sub with everything under fifty hertz, and a house kick with a break leaning on it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [126, 138],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['straight', 6], ['driving', 3]],
  transitions: [['fill', 4], ['break', 3], ['shot', 2]],
  shots: [[[0, 8], 4], [[0, 6, 12], 3], [[0, 4, 8, 12], 2]],
  excludeLayers: ['brass'],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6, note: 'One chord. The sub is the harmony and it has one note in it' },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['i', 'i', 'VI', 'VI', 'i', 'i', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I', 'I', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [4, 4, 8], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [16], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    // The whole style. One note, held nearly the length of the bar, re-struck
    // once. Everything audible about it happens below 60 Hz.
    { name: 'sine-hold', weight: 6, hits: [
      { at: 0, dur: 10, tone: 0, vel: 1 },
      { at: 12, dur: 4, tone: 0, vel: 0.72 },
    ] },
    { name: 'octave-drop', weight: 4, hits: [
      { at: 0, dur: 6, tone: 12, vel: 0.86 },
      { at: 8, dur: 8, tone: 0, vel: 1 },
    ] },
    { name: 'two-bar-sub', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 14, dur: 2, tone: 0, vel: 0.6 },
      { at: 16, dur: 8, tone: 7, vel: 0.8 },
      { at: 26, dur: 6, tone: 0, vel: 0.76 },
    ] },
  ],
  comp: [
    { name: 'stab', weight: 5, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.7 }, { at: 8, dur: 2, vel: 0.62 },
    ] },
    { name: 'offbeat', weight: 4, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.6 }, { at: 6, dur: 2, vel: 0.58 },
      { at: 10, dur: 2, vel: 0.6 }, { at: 14, dur: 2, vel: 0.56 },
    ] },
    { name: 'held', weight: 2, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.34 }] },
  ],
  drums: [
    { name: 'four-floor', weight: 6, voices: {
      bd: [0, 4, 8, 12],
      cp: [4, 12],
      hh: [2, 6, 10, 14],
      oh: [6, 14],
    } },
    { name: 'break-under', weight: 5, cycle: 32, voices: {
      bd: [0, 4, 8, 12, 16, 20, 24, 28],
      sd: [8, 24],
      hh: [2, 6, 10, 14, 18, 22, 26, 30],
      perc: [12, 22, 28],
    } },
    { name: 'stripped', weight: 3, voices: {
      bd: [0, 8],
      cp: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  melody: { leap: 0.42, ornament: 0.1, span: 16, sequence: 0.85, syncopation: 0.5 },
};

/**
 * HARDCORE — 1992, and the loudest thing this project contains.
 *
 * Breakbeat hardcore: a funk break pitched up until the drummer sounds like a
 * machine, a piano riff played with two fingers, a hoover, and a sample of
 * somebody shouting. It is the only major-leaning style in the catalogue and
 * that is the correct historical fact rather than a hedge — this music was still
 * *rave*, which came out of Italian piano house, and the turn to minor happens
 * eighteen months later in the entry below.
 *
 * **The ghosts start here**, and the reason is exactly the pitch shift. A break
 * sampled at 118 and played at 145 keeps all of its internal strokes and moves
 * them 23% closer together; what was a drummer's quiet left hand becomes a
 * chattering lattice, and that lattice is what everybody in the room recognised.
 * Four ghosted sixteenths around each backbeat, on the odd slots, which is where
 * a drawn feel would have put them.
 *
 * `swing: 0.09`. Not a shuffle — the residue of a funk record's own push,
 * surviving the resample. Every break-based style below carries a number in this
 * range and none of them carries a larger one.
 *
 * The piano is in `comp` and it is written as four stabs rather than as a
 * voicing, because what these records had was one chord struck on the offbeats
 * with the sustain pedal down, and the *rhythm* is the whole content.
 */
const hardcore: Style = {
  id: 'hardcore',
  label: 'Breakbeat hardcore',
  description:
    'A funk break pitched up until it chatters, a piano riff played with two fingers, and a hoover over the top of it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [138, 152],
  swing: 0.09,
  modeWeights: { minor: 0.42, major: 0.58 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['driving', 5], ['straight', 4], ['funk', 2]],
  transitions: [['fill', 4], ['break', 4], ['shot', 2]],
  shots: [[[0, 6, 10], 4], [[0, 8], 3], [[0, 3, 6, 12], 2]],
  progressions: {
    intro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 6 },
      { chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 4 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 3, note: 'The piano-house four, arriving in a genre that would drop it within two years' },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'IV', 'IV', 'V', 'V'], weight: 5 },
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 5 }],
    solo: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'VII', 'VII'], weight: 6 },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    chorus: [{ chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  melodyCells: [
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 4, 8], weight: 4 },
    { cell: [3, 3, 2, 8], weight: 3 },
    { cell: [8, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    // The rave octave, written upward so the root sits at the bottom of the
    // register rather than on top of the leap — see the header. Twelve
    // semitones exactly, which is half of what would place cleanly and all of
    // what this gesture is.
    { name: 'rave-octave', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 12, vel: 0.7 },
      { at: 8, dur: 3, tone: 0, vel: 0.9 },
      { at: 12, dur: 2, tone: 12, vel: 0.68 },
      { at: 14, dur: 2, tone: 7, vel: 0.64 },
    ] },
    { name: 'bouncing', weight: 5, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.7 },
      { at: 10, dur: 2, tone: 5, vel: 0.74 },
      { at: 12, dur: 4, tone: 7, vel: 0.78 },
    ] },
    { name: 'two-bar-rave', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 12, vel: 0.66 },
      { at: 10, dur: 4, tone: 0, vel: 0.82 },
      { at: 16, dur: 4, tone: 5, vel: 0.86 },
      { at: 22, dur: 2, tone: 7, vel: 0.7 },
      { at: 26, dur: 6, tone: 0, vel: 0.76 },
    ] },
  ],
  comp: [
    // Two fingers and the sustain pedal. The rhythm is the entire content.
    { name: 'piano-stabs', weight: 6, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.78 }, { at: 6, dur: 2, vel: 0.7 },
      { at: 10, dur: 2, vel: 0.76 }, { at: 14, dur: 2, vel: 0.68 },
    ] },
    { name: 'riff', weight: 4, voices: 3, cycle: 32, hits: [
      { at: 0, dur: 2, vel: 0.8 }, { at: 3, dur: 1, vel: 0.6 },
      { at: 6, dur: 2, vel: 0.72 }, { at: 12, dur: 4, vel: 0.66 },
      { at: 16, dur: 2, vel: 0.78 }, { at: 22, dur: 2, vel: 0.7 },
      { at: 26, dur: 6, vel: 0.62 },
    ] },
    { name: 'hoover', weight: 3, voices: 4, hits: [
      { at: 0, dur: 8, vel: 0.72 }, { at: 8, dur: 8, vel: 0.66 },
    ] },
  ],
  drums: [
    /**
     * The break, pitched up. The four ghosts either side of each backbeat are
     * the drummer's left hand arriving 23% early, and they are the reason this
     * figure sounds like a machine and a person at the same time.
     */
    { name: 'pitched-break', weight: 6, voices: {
      bd: [0, 10],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sd: [3, 5, 11, 13] } },
    { name: 'four-floor-break', weight: 4, voices: {
      bd: [0, 4, 8, 12],
      sd: [4, 12],
      oh: [2, 6, 10, 14],
      hh: [0, 4, 8, 12],
    }, ghosts: { sd: [7, 15] } },
    { name: 'two-bar-chop', weight: 4, cycle: 32, voices: {
      bd: [0, 10, 16, 22, 26],
      sd: [4, 12, 20, 28],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      cr: [0],
    }, ghosts: { sd: [3, 7, 15, 19, 23, 31] } },
  ],
  melody: { leap: 0.34, ornament: 0.14, span: 14, sequence: 0.8, syncopation: 0.62 },
};

/**
 * DARKCORE — 1993, the year the piano was thrown out.
 *
 * The same break, slowed by a few BPM, dropped a fifth and put through a filter,
 * with the piano replaced by a string stab lifted off a horror soundtrack. This
 * is the eighteen-month hinge on which the whole genre turns, and everything
 * after it is in a minor key.
 *
 * ## The one style in this genre that overrides `scaleForChord`, and why
 *
 * `harmonicMinor`, on the tonic. The genre's rule hands every minor song the
 * natural minor — seven notes, no leading tone, argued at length in
 * `dnb/index.ts` — and that is right everywhere else here and wrong for exactly
 * this style, because **the raised seventh is what these records were made of.**
 * The string stab was sampled off a film score and film scores in that idiom are
 * written in the harmonic minor: what makes a darkcore stab sound like a threat
 * rather than like a chord is the augmented second between the ♭6 and the ♮7,
 * and a natural minor structurally cannot spell it.
 *
 * Note what the override is *not*: it does not read the chord. It is the same
 * shape of rule with a different scale in it, which is what the three other
 * `Style.scaleForChord` entries in the project all are — jazz follows the chord
 * and its blues style overrides to a tonic scale, funk and hiphop follow the
 * tonic and override to something else. See `techstep` for this genre's second
 * and last, which is about a different interval.
 *
 * The genre disables `augmented-second` outright, and this style is half of the
 * reason: on the pentatonic half of the catalogue the rule is arithmetically
 * wrong, and here it is aimed at the one interval the style exists for.
 */
const darkcore: Style = {
  id: 'darkcore',
  label: 'Darkcore',
  description:
    'The same break dropped a fifth, the piano thrown out, and a string stab lifted off a horror soundtrack in its place.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [150, 158],
  swing: 0.08,
  modeWeights: { minor: 0.93, major: 0.07 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['straight', 5], ['driving', 4], ['halftime', 2]],
  transitions: [['fill', 3], ['break', 5], ['shot', 2]],
  shots: [[[0, 8], 5], [[0, 6, 10], 3], [[0], 2]],
  // The horror score's own scale, and the augmented second is the point. See
  // the header.
  scaleForChord: (tonic) => makeScale(tonic, 'harmonicMinor'),
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6, note: 'One chord and a filter. The event in this section is a texture opening, not a harmony moving' },
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 4, note: 'The Neapolitan as a threat rather than as a cadence — a semitone above the tonic and back' },
      { chords: ['i', 'i', 'VI', 'VI', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'bII', 'bII', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'VI', 'VI', 'i', 'i', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I', 'I', 'bVI', 'bVI', 'I', 'I', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [-4, 4, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [16], weight: 3 },
    { cell: [-8, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 4 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'dropped-sub', weight: 6, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 14, dur: 2, tone: 0, vel: 0.6 },
    ] },
    { name: 'semitone-lean', weight: 4, cycle: 32, hits: [
      { at: 0, dur: 10, tone: 0, vel: 1 },
      { at: 12, dur: 4, tone: 1, vel: 0.72, },
      { at: 16, dur: 10, tone: 0, vel: 0.9 },
      { at: 28, dur: 4, tone: 10, vel: 0.7 },
    ] },
    { name: 'stab-under', weight: 3, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.72 },
      { at: 10, dur: 6, tone: 8, vel: 0.76 },
    ] },
  ],
  comp: [
    // The stab. One chord, struck on the downbeat, left to ring, and that is the
    // whole part — which is why the figure has two hits in it and not eight.
    { name: 'horror-stab', weight: 6, voices: 4, hits: [
      { at: 0, dur: 6, vel: 0.84 }, { at: 8, dur: 4, vel: 0.68 },
    ] },
    { name: 'answering-stab', weight: 4, voices: 4, cycle: 32, hits: [
      { at: 0, dur: 6, vel: 0.84 }, { at: 20, dur: 6, vel: 0.7 },
    ] },
    { name: 'bed', weight: 2, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.34 }] },
  ],
  drums: [
    { name: 'slowed-break', weight: 6, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sd: [5, 7, 11, 13] } },
    { name: 'two-step-dark', weight: 5, cycle: 32, voices: {
      bd: [0, 10, 16, 26],
      sd: [8, 24],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      oh: [14, 30],
    }, ghosts: { sd: [3, 7, 13, 19, 23, 29] } },
    { name: 'half-time-dark', weight: 3, cycle: 32, voices: {
      bd: [0, 20],
      sd: [16],
      hh: [0, 4, 8, 12, 16, 20, 24, 28],
      cr: [0],
    }, ghosts: { sd: [11, 21] } },
  ],
  melody: { leap: 0.3, ornament: 0.12, span: 15, sequence: 0.82, syncopation: 0.58 },
};

/**
 * JUNGLE — 1994, and the record this whole genre is a photograph of.
 *
 * One six-second drum break, cut into sixteen pieces and reassembled in an order
 * the drummer never played, over a sine wave holding one note for three and a
 * half beats. There is nothing else on it. The two objects are at opposite ends
 * of the spectrum and there is a hole in the middle where every other genre in
 * this project keeps its band.
 *
 * ## What the tables can say about the chop, and what they cannot
 *
 * `cycle: 32` is doing the heaviest lifting in the file here. A chop is a
 * *two-bar* object by definition — the first bar can be the break as recorded
 * and the second is where the edit lands, and a bar-shaped table can only say
 * "this loop, again". All three drum rows below are two bars long and all three
 * put their displaced snare in the second bar, because that is where a listener
 * is told the drums are being *operated* rather than played.
 *
 * The ghosts are among the densest in the project: twenty-three written ghost
 * strokes across three figures, second here only to `drumfunk`'s twenty-seven. That is not decoration, it is the break — see the file
 * header on the four loud strokes and the eleven quiet ones.
 *
 * **What could not be said** was the resolution, and this table now says it. The
 * famous chops subdivide inside the sixteenth: a stutter is the same 40 ms
 * fragment triggered four times, and at 168 BPM a written sixteenth is 89 ms —
 * which is `roll: 2` almost exactly. `docs/engine-gaps.md` §3.15 is closed,
 * `DrumPattern.rolls` is the field, and this is the style that spends it first,
 * because it is the style the whole gesture belongs to.
 *
 * Two of the three figures take it and they take different halves of it.
 * `chopped-amen` doubles one stroke — the displaced snare at the end of bar two,
 * 43 ms at 174, and nothing else in the bar moves. `edit-heavy` takes the
 * **rush**: four consecutive sixteenths on the snare, each a pair of 32nds, so
 * eight strokes fill a beat rather than ornament one of its sixteenths. That is
 * the shape of the thing and it is *not* trap's shape — a trap roll accelerates
 * a hi-hat into a barline inside one slot, and this is a snare covering a beat
 * flat out, which the field spells as four rolled strokes in a row.
 *
 * **`rolling-break` refuses**, and it is the more interesting of the two answers
 * here. Its open hat on 22 is the figure's one ornament, and a rush underneath a
 * hat that is already ringing is two ideas competing for one moment — which is
 * word for word why `hiphop/trap`'s `open-trap` refused, arrived at from a
 * different genre and a different voice. It is also the figure carrying the
 * `dub` drop below, where the bass leaves and the break rolls on alone for eight
 * bars: the one place in this style where the break is supposed to sound like a
 * loop nobody is touching.
 *
 * `drops: dub`. The bass drops for a phrase and the break rolls on alone, and
 * this is the gesture the style inherits directly from the sound systems its
 * producers grew up in front of — reggae's `dub` and this are the same edit,
 * thirty years and one continent apart. See `dnb/index.ts` for the placement
 * measurement and for why `dropBars` is 8 rather than the shape's own 4.
 */
const jungle: Style = {
  id: 'jungle',
  label: 'Jungle',
  description:
    'One six-second break cut into sixteen pieces and put back in the wrong order, over a sine holding one note.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [164, 174],
  swing: 0.1,
  modeWeights: { minor: 0.9, major: 0.1 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['funk', 5], ['straight', 4], ['pocket', 3]],
  transitions: [['fill', 3], ['break', 5], ['elide', 2]],
  shots: [[[0, 8], 4], [[0, 6, 10], 3], [[0], 3]],
  drops: [['none', 2], ['dub', 1]],
  dropBars: 8,
  excludeLayers: ['brass'],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 7, note: 'One chord for the whole section. The sub states it and nothing contradicts it' },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [16], weight: 5 },
    { cell: [-8, 8], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 3 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 4 },
    { cell: [-4, 12], weight: 2 },
  ],
  bass: [
    /**
     * The sub. One note, fourteen sixteenths long, and the only reason it is
     * re-struck at all is that a sine held across a barline for four minutes is
     * a drone rather than a bass line.
     */
    { name: 'held-sub', weight: 7, hits: [
      { at: 0, dur: 14, tone: 0, vel: 1 },
    ] },
    { name: 'two-bar-sub', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 14, tone: 0, vel: 1 },
      { at: 16, dur: 10, tone: 0, vel: 0.86 },
      { at: 28, dur: 4, tone: 10, vel: 0.74 },
    ] },
    { name: 'answering-sub', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 16, dur: 6, tone: 5, vel: 0.82 },
      { at: 24, dur: 8, tone: 3, vel: 0.78 },
    ] },
  ],
  comp: [
    // A stab off the source record, and there are two of them in eight bars.
    { name: 'sparse-stab', weight: 6, voices: 3, cycle: 32, hits: [
      { at: 0, dur: 4, vel: 0.72 }, { at: 20, dur: 4, vel: 0.6 },
    ] },
    { name: 'ragga-chord', weight: 4, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.68 }, { at: 12, dur: 3, vel: 0.62 },
    ] },
    { name: 'wash', weight: 3, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.3 }] },
  ],
  drums: [
    /**
     * The break as recorded in bar one and edited in bar two: the snare arrives
     * a sixteenth early on slot 22, the kick doubles under it, and the whole
     * point of the style is that a listener hears a *hand* on the sampler.
     *
     * Seven ghosts. Both sides of every backbeat, so a drawn feel adds nothing
     * here and the figure is heard exactly as written.
     */
    { name: 'chopped-amen', weight: 7, cycle: 32, voices: {
      bd: [0, 10, 16, 22],
      sd: [8, 24, 30],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    }, ghosts: { sd: [3, 5, 7, 9, 13, 19, 23, 27] },
    // The displaced snare, struck twice inside itself: 43 ms at 174, which is the
    // number the header measured off the records. One stroke of thirty-two, and
    // the rest of the figure is the break as recorded — the hand on the sampler
    // touches the edit and nothing else.
    rolls: { sd: { 30: 2 } } },
    { name: 'rolling-break', weight: 5, cycle: 32, voices: {
      bd: [0, 10, 16, 26],
      sd: [8, 24],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      oh: [6, 22],
    }, ghosts: { sd: [3, 7, 11, 15, 19, 27, 31] } },
    { name: 'edit-heavy', weight: 4, cycle: 32, voices: {
      bd: [0, 6, 10, 16, 20, 28],
      sd: [8, 14, 15, 16, 17, 18, 24],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      perc: [12, 26],
    }, ghosts: { sd: [5, 9, 13, 19, 21, 25, 29, 31] },
    // The rush: four sixteenths in a row, each of them a pair of 32nds, so eight
    // strokes 43 ms apart cover 345 ms and the beat is *filled* rather than
    // decorated. Written as four rolled strokes rather than one `roll: 4`,
    // because that is the count `DrumEvent.roll` defines — a roll is fenced to
    // the slot it stands on, and a gesture a beat long is four of them.
    //
    // It starts on 15 and lands across the barline, which is where the run has
    // to be and is not an alignment this table could have chosen freely: the
    // four free sixteenths in this figure are 15, 16, 17 and 18, because 19 is
    // already a ghost and the lattice underneath is not negotiable. That it
    // comes out crossing the bar is the style's own argument arriving from the
    // other side — `syncopation: 0.7` up there says a chopped break starts
    // wherever the source bar happened to be cut, and a rush that respected the
    // barline would be the one thing a sampler operator never does.
    rolls: { sd: { 15: 2, 16: 2, 17: 2, 18: 2 } } },
  ],
  melody: { leap: 0.26, ornament: 0.14, span: 12, sequence: 0.85, syncopation: 0.7 },
};

/**
 * RAGGA — 1994, the same break with a sound system behind it.
 *
 * Jungle's other half, and the half that filled the rooms: a dancehall bassline
 * where the sub was, a chopped vocal from a Kingston seven-inch, and an offbeat
 * chord answering the snare. Musically it differs from the entry above in one
 * respect that matters — **the bass has a rhythm.** A jungle sub states one note
 * and holds it; a ragga bassline is a *riff*, three or four notes long, and it
 * comes from a completely different tradition, which is why this is a separate
 * table rather than a weight.
 *
 * `comp` carries the skank on the offbeats, which is reggae's figure arriving in
 * a genre at twice its tempo — at 168 the offbeat chord lands every 172 ms and
 * reads as a sixteenth-note pulse rather than as a skank, which is exactly what
 * happened on the records.
 *
 * `drops: dub`, and here the debt is not even at one remove: the producers were
 * making dubplates in the same rooms and for the same reason.
 */
const ragga: Style = {
  id: 'ragga',
  label: 'Ragga jungle',
  description:
    'A dancehall bassline where the sub was, a chopped Kingston vocal, and the skank answering the snare at twice the speed.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [164, 174],
  swing: 0.1,
  modeWeights: { minor: 0.82, major: 0.18 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['pocket', 5], ['funk', 4], ['straight', 3]],
  transitions: [['fill', 3], ['break', 5], ['shot', 2]],
  shots: [[[0, 6, 10], 4], [[0, 8], 3], [[0, 4, 10], 2]],
  drops: [['none', 2], ['dub', 1]],
  dropBars: 8,
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 },
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 5, note: 'The one-drop two-chord, which is the whole harmonic vocabulary of the tradition this borrows from' },
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-4, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-8, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [16], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-8, 8], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    /**
     * The riff, and this is the field where the style separates from `jungle`
     * next door. Four notes, all inside an octave, and the shape is the same
     * over every chord because a bassline played on a keyboard is a shape.
     */
    { name: 'dancehall-riff', weight: 6, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.74 },
      { at: 10, dur: 2, tone: 10, vel: 0.8 },
      { at: 12, dur: 4, tone: 7, vel: 0.76 },
    ] },
    { name: 'two-bar-riff', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 2, tone: 3, vel: 0.72 },
      { at: 12, dur: 4, tone: 5, vel: 0.78 },
      { at: 16, dur: 8, tone: 0, vel: 0.92 },
      { at: 26, dur: 6, tone: 10, vel: 0.74 },
    ] },
    { name: 'held-sub', weight: 3, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 14, dur: 2, tone: 0, vel: 0.6 },
    ] },
  ],
  comp: [
    // The skank, at twice the tempo it was written for.
    { name: 'skank', weight: 6, voices: 3, hits: [
      { at: 4, dur: 2, vel: 0.72 }, { at: 12, dur: 2, vel: 0.68 },
    ] },
    { name: 'double-skank', weight: 4, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.6 }, { at: 6, dur: 2, vel: 0.7 },
      { at: 10, dur: 2, vel: 0.6 }, { at: 14, dur: 2, vel: 0.68 },
    ] },
    { name: 'organ-bubble', weight: 3, voices: 3, cycle: 32, hits: [
      { at: 3, dur: 1, vel: 0.5 }, { at: 6, dur: 2, vel: 0.66 },
      { at: 11, dur: 1, vel: 0.5 }, { at: 14, dur: 2, vel: 0.64 },
      { at: 19, dur: 1, vel: 0.5 }, { at: 22, dur: 2, vel: 0.66 },
      { at: 30, dur: 2, vel: 0.6 },
    ] },
  ],
  drums: [
    { name: 'ragga-break', weight: 6, cycle: 32, voices: {
      bd: [0, 10, 16, 22],
      sd: [8, 24],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      tb: [4, 12, 20, 28],
    }, ghosts: { sd: [5, 7, 13, 21, 27, 31] } },
    { name: 'sound-system', weight: 5, cycle: 32, voices: {
      bd: [0, 6, 16, 26],
      sd: [8, 24],
      hh: [2, 6, 10, 14, 18, 22, 26, 30],
      perc: [12, 20, 28],
      cb: [0, 16],
    }, ghosts: { sd: [11, 15, 27] } },
    { name: 'amen-simple', weight: 4, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sd: [5, 7, 13] } },
  ],
  melody: { leap: 0.28, ornament: 0.18, span: 13, sequence: 0.8, syncopation: 0.68 },
};

/**
 * HARDSTEP — 1996, and the moment the break stops being a recording.
 *
 * The chop is thrown out and what is left is a *two-step*: one kick, one snare,
 * and a hi-hat pattern, all of them single samples layered until they hit like
 * furniture. This is the style that connects the chopped half of the catalogue
 * to the designed half, and the tables show the join — it still ghosts, but only
 * three or four strokes and only around one backbeat, because there is still a
 * sampled break underneath at low level doing the work a room used to do.
 *
 * The harmony leaves at the same time. `verse` is one chord in every entry and
 * the `comp` figure is two stabs in two bars, which is the least chordal content
 * in the file after `minimal`.
 *
 * `boxDrums: false`, and it is one of two places in this genre where that field
 * is a musical statement rather than a period one: the whole proposition is a
 * pattern assembled sample by sample, and a preset box is a pattern somebody
 * else assembled. (The other is `drumfunk`, for the opposite reason — there the
 * point is that the pattern never repeats.)
 */
const hardstep: Style = {
  id: 'hardstep',
  label: 'Hardstep',
  description:
    'The chop thrown out and a two-step left: one kick, one snare, layered until they land like furniture.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [166, 174],
  swing: 0.06,
  modeWeights: { minor: 0.9, major: 0.1 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  boxDrums: false,
  feels: [['straight', 6], ['driving', 3], ['pocket', 2]],
  transitions: [['fill', 3], ['break', 4], ['shot', 3]],
  shots: [[[0, 8], 5], [[0], 3], [[0, 6, 10], 2]],
  excludeLayers: ['brass'],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 7 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 4 },
    ],
    chorus: [
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [16], weight: 5 },
    { cell: [-8, 8], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [-4, 4, 8], weight: 3 },
    { cell: [-12, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 4 },
    { cell: [-4, 12], weight: 2 },
  ],
  bass: [
    { name: 'two-step-sub', weight: 6, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 8, dur: 6, tone: 0, vel: 0.8 },
    ] },
    { name: 'stepped', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 0, vel: 0.82 },
      { at: 16, dur: 6, tone: 3, vel: 0.86 },
      { at: 24, dur: 8, tone: 0, vel: 0.84 },
    ] },
    { name: 'punched', weight: 3, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 0, vel: 0.7 },
      { at: 8, dur: 3, tone: 12, vel: 0.8 },
      { at: 12, dur: 4, tone: 0, vel: 0.78 },
    ] },
  ],
  comp: [
    { name: 'two-stabs', weight: 6, voices: 3, cycle: 32, hits: [
      { at: 0, dur: 4, vel: 0.74 }, { at: 16, dur: 4, vel: 0.66 },
    ] },
    { name: 'offbeat-stab', weight: 4, voices: 3, hits: [
      { at: 6, dur: 2, vel: 0.68 }, { at: 14, dur: 2, vel: 0.62 },
    ] },
    { name: 'bed', weight: 2, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.3 }] },
  ],
  drums: [
    { name: 'two-step', weight: 7, cycle: 32, voices: {
      bd: [0, 10, 16, 22],
      sd: [8, 24],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    }, ghosts: { sd: [7, 23] } },
    { name: 'hard-two-step', weight: 5, cycle: 32, voices: {
      bd: [0, 12, 16, 20],
      sd: [8, 24],
      hh: [2, 6, 10, 14, 18, 22, 26, 30],
      oh: [4, 20],
    }, ghosts: { sd: [9, 25] } },
    { name: 'stripped-step', weight: 3, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [0, 4, 8, 12],
    } },
  ],
  melody: { leap: 0.3, ornament: 0.08, span: 13, sequence: 0.88, syncopation: 0.6 },
};

/**
 * JAZZSTEP — 1996, and the first style here with a chord in it.
 *
 * A rolling break, an upright bass sampled off a 1963 record, and a `min9` that
 * moves. This is the corner of the genre that argued it was music, and the
 * argument was made almost entirely with `comp`: everything else about the table
 * is jungle's, and the difference is four bars of harmony where there had been
 * one chord.
 *
 * **`hook: 'catchy'`**, and it is one of **six** styles here that step down from
 * the genre's `earworm` — this, `atmospheric`, `intelligent`, `liquid`,
 * `sambass` and `deep`, against eighteen that write `earworm` out. This note
 * said five in one sentence and four in the next, and neither was the count. The
 * rule is the one hiphop arrived at from the same direction: a style that
 * repeats its hook exactly is right where the harmony does not move, and wrong
 * where there is a progression for a tune to be about. Those six styles have
 * real changes.
 *
 * The bass is written with `sustain: true`. **This note said it is the only
 * style in this genre that asks for it, and six styles do** — the other five are
 * `atmospheric`, `drumfunk`, `deep`, `autonomic` and `minimal`, every one of
 * them a `cycle: 32` row holding a single sub across two bars. That is the same
 * field for the opposite reason, and the distinction the sentence was reaching
 * for survives it: everywhere else the bottom is a synthesiser whose note is
 * *long*, and here it is a *double bass*, walking, where a line re-struck on a
 * pitch it is already sounding is a bow change rather than a note. This is the
 * only style in the genre whose sustained bass is a played instrument.
 */
const jazzstep: Style = {
  id: 'jazzstep',
  label: 'Jazzstep',
  description:
    'A rolling break, an upright sampled off a 1963 record, and four bars of harmony where the genre had one chord.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [166, 174],
  swing: 0.12,
  modeWeights: { minor: 0.78, major: 0.22 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  feels: [['pocket', 5], ['funk', 4], ['laidback', 3], ['straight', 2]],
  transitions: [['fill', 4], ['break', 3], ['elide', 2]],
  shots: [[[0, 6], 4], [[0, 8], 3], [[0, 3, 6, 10], 2]],
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
    verse: [
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'VII', 'VII'], weight: 6, note: 'The two-chord modal vamp the source records were built on, given a bar each' },
      { chords: ['i9', 'i9', 'i9', 'i9', 'VImaj7', 'VImaj7', 'i9', 'i9'], weight: 5 },
      { chords: ['i11', 'i11', 'i11', 'i11', 'i11', 'i11', 'i11', 'i11'], weight: 3 },
    ],
    chorus: [
      { chords: ['VImaj7', 'VImaj7', 'VII', 'VII', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['iv9', 'iv9', 'VII', 'VII', 'IIImaj7', 'IIImaj7', 'i9', 'i9'], weight: 4 },
    ],
    bridge: [{ chords: ['VImaj7', 'VImaj7', 'iv9', 'iv9', 'i9', 'i9', 'i9', 'i9'], weight: 5 }],
    solo: [{ chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'VII', 'VII'], weight: 5 }],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'ii9', 'ii9'], weight: 6 }],
    chorus: [{ chords: ['IVmaj9', 'IVmaj9', 'iii9', 'iii9', 'ii9', 'ii9', 'Imaj9', 'Imaj9'], weight: 5 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-4, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 8], weight: 5 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [-2, 2, 4, 4, 4], weight: 3 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    // The upright. `sustain` because a walked note re-struck on the same pitch
    // is a bow change, and this is the only style here with a bow in it.
    { name: 'upright-walk', weight: 6, sustain: true, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 4, dur: 4, tone: 7, vel: 0.78 },
      { at: 8, dur: 4, tone: 10, vel: 0.82 },
      { at: 12, dur: 4, tone: 12, vel: 0.76 },
      { at: 16, dur: 4, tone: 7, vel: 0.9 },
      { at: 20, dur: 4, tone: 5, vel: 0.76 },
      { at: 24, dur: 4, tone: 3, vel: 0.8 },
      { at: 28, dur: 4, tone: 0, vel: 0.78 },
    ] },
    { name: 'half-walk', weight: 5, sustain: true, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 7, vel: 0.8 },
      { at: 12, dur: 4, tone: 10, vel: 0.74 },
    ] },
    { name: 'sub-under-jazz', weight: 3, hits: [
      { at: 0, dur: 10, tone: 0, vel: 1 },
      { at: 12, dur: 4, tone: 7, vel: 0.72 },
    ] },
  ],
  comp: [
    // A Rhodes, comping. The `guide` voicing is the third and the seventh and
    // nothing else, which is what a two-handed player leaves out when there is a
    // sub underneath them.
    { name: 'rhodes-comp', weight: 6, voices: 4, voicing: 'guide', hits: [
      { at: 0, dur: 4, vel: 0.6 }, { at: 6, dur: 2, vel: 0.52 },
      { at: 10, dur: 4, vel: 0.58 },
    ] },
    { name: 'held-ninth', weight: 5, voices: 4, sustain: true, hits: [
      { at: 0, dur: 16, vel: 0.42 },
    ] },
    { name: 'anticipated', weight: 3, voices: 4, voicing: 'guide', cycle: 32, hits: [
      { at: 0, dur: 6, vel: 0.62 }, { at: 14, dur: 4, vel: 0.56 },
      { at: 20, dur: 4, vel: 0.58 }, { at: 30, dur: 2, vel: 0.5 },
    ] },
  ],
  drums: [
    { name: 'jazz-roll', weight: 6, cycle: 32, voices: {
      bd: [0, 10, 16, 26],
      sd: [8, 24],
      rd: [0, 4, 6, 8, 12, 14, 16, 20, 22, 24, 28, 30],
      hh: [4, 12, 20, 28],
    }, ghosts: { sd: [3, 7, 11, 15, 19, 27, 31] } },
    { name: 'brushed-break', weight: 5, cycle: 32, voices: {
      bd: [0, 12, 16, 22],
      sd: [8, 24],
      sh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    }, ghosts: { sd: [5, 7, 13, 21, 25, 31] } },
    { name: 'straight-jazz', weight: 3, voices: {
      bd: [0, 10],
      sd: [8],
      rd: [0, 4, 6, 8, 12, 14],
    }, ghosts: { sd: [5, 11] } },
  ],
  melody: { leap: 0.3, ornament: 0.28, span: 16, sequence: 0.5, syncopation: 0.66 },
};

/**
 * ATMOSPHERIC — 1995, and the style that ends the night.
 *
 * A rolling break with the top rolled off, a pad that has been sounding since
 * before the record started, and a bass note. The tempo is identical to
 * jungle's; everything else is inverted. What is being listened to is the
 * *wash*, and the drums — which in every other style here are the subject — are
 * a texture crossing it.
 *
 * **`requireLayers: ['pad']`, and it is one of only two in this genre.** The
 * default arrangement rules treat the pad as decoration added when there is room
 * for it, which is right for a dance band and exactly backwards here; ambient's
 * table makes the same complaint in the same words. It costs this style
 * `Chart.exits` — the exit rule only takes a layer nobody has required — and
 * that is a trade made deliberately, because a version of this record with the
 * wash pulled off the last section is not a thinner arrangement, it is silence
 * with a break over it.
 *
 * **`drops: breakdown`.** This is the shape's first honest author in the
 * catalogue and it is the obvious one: the kit and the bass leave together, the
 * pad carries eight bars alone, and everything returns at once. That sentence is
 * the definition of the gesture in `generate/drop.ts` and it is also a
 * description of about a third of the records this style is written from.
 *
 * `drumFills: false` is deliberately *not* set. It is tempting — the idiom's
 * proposition is that nothing announces anything — and it is wrong, because the
 * announcement here is a *fill on a break*, which is a drum edit rather than a
 * dance-band tom roll. The fill palette does that work instead.
 */
const atmospheric: Style = {
  id: 'atmospheric',
  label: 'Atmospheric',
  description:
    'A rolling break with the top rolled off, a pad that started before the record did, and one bass note under it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [164, 172],
  swing: 0.1,
  modeWeights: { minor: 0.8, major: 0.2 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  requireLayers: ['pad'],
  feels: [['laidback', 5], ['pocket', 4], ['straight', 3]],
  transitions: [['fill', 3], ['break', 3], ['elide', 4]],
  breakCarrier: 'pad',
  drops: [['none', 2], ['breakdown', 1]],
  dropBars: 8,
  fills: [['snare-roll', 4], ['lead-in', 3], ['drop', 3]],
  shots: [[[0], 5], [[0, 8], 3]],
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
    verse: [
      { chords: ['i9', 'i9', 'i9', 'i9', 'VImaj7', 'VImaj7', 'VImaj7', 'VImaj7'], weight: 6, note: 'Two chords, four bars each. The event is the second one arriving, and there is no third' },
      { chords: ['i11', 'i11', 'i11', 'i11', 'i11', 'i11', 'i11', 'i11'], weight: 5 },
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'i9', 'i9'], weight: 3 },
    ],
    chorus: [
      { chords: ['VImaj7', 'VImaj7', 'VII', 'VII', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['iv9', 'iv9', 'i9', 'i9', 'VImaj7', 'VImaj7', 'i9', 'i9'], weight: 4 },
    ],
    bridge: [{ chords: ['VImaj7', 'VImaj7', 'VImaj7', 'VImaj7', 'i9', 'i9', 'i9', 'i9'], weight: 5 }],
    solo: [{ chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 5 }],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9'], weight: 6 }],
    chorus: [{ chords: ['IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'vi9', 'vi9', 'Imaj9', 'Imaj9'], weight: 5 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 3 },
    { cell: [-12, 4], weight: 2 },
  ],
  bass: [
    { name: 'one-note', weight: 7, hits: [
      { at: 0, dur: 14, tone: 0, vel: 1 },
    ] },
    { name: 'two-bar-wash', weight: 5, cycle: 32, sustain: true, hits: [
      { at: 0, dur: 16, tone: 0, vel: 1 },
      { at: 16, dur: 12, tone: 7, vel: 0.82 },
      { at: 28, dur: 4, tone: 5, vel: 0.7 },
    ] },
    { name: 'answering', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 16, dur: 10, tone: 3, vel: 0.84 },
      { at: 28, dur: 4, tone: 0, vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'wash', weight: 7, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.4 }] },
    { name: 'rhodes-figure', weight: 4, voices: 4, voicing: 'quartal', cycle: 32, hits: [
      { at: 0, dur: 8, vel: 0.48 }, { at: 16, dur: 8, vel: 0.44 },
    ] },
    { name: 'arp', weight: 3, voices: 4, arpeggio: true, arpDirection: 'updown', arpOctaves: 2,
      cycle: 12, hits: [
        { at: 0, dur: 2, vel: 0.4 }, { at: 3, dur: 2, vel: 0.34 },
        { at: 6, dur: 2, vel: 0.38 }, { at: 9, dur: 2, vel: 0.32 },
      ] },
  ],
  drums: [
    { name: 'soft-roll', weight: 6, cycle: 32, voices: {
      bd: [0, 10, 16, 26],
      sd: [8, 24],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    }, ghosts: { sd: [3, 7, 11, 15, 19, 23, 27, 31] } },
    { name: 'brushed-roll', weight: 5, cycle: 32, voices: {
      bd: [0, 12, 16, 22],
      sd: [8, 24],
      sh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      rd: [0, 16],
    }, ghosts: { sd: [5, 11, 21, 27] } },
    { name: 'thin', weight: 4, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [2, 6, 10, 14],
    }, ghosts: { sd: [7] } },
  ],
  melody: { leap: 0.2, ornament: 0.24, span: 14, sequence: 0.55, syncopation: 0.5 },
};

/**
 * INTELLIGENT — 1995, and the name everybody involved has since apologised for.
 *
 * A Rhodes, a seventh chord that moves twice a section, a rolling break and a
 * melody that is genuinely a melody rather than a fragment. It is the sibling of
 * `atmospheric` and the difference between the two tables is exactly one thing:
 * **this one has a tune in it and that one has a wash.** The pad is not required
 * here, the melody cells are twice as dense, and `hook: 'catchy'` means the
 * figure comes back changed.
 *
 * `melody.sequence` at 0.5 is the lowest number in this file by a distance, and
 * it is the whole distinction. The genre's norm is 0.8 and up — a hook is a
 * two-bar fragment repeated until the record ends — and this style is the one
 * corner where a phrase is expected to answer itself rather than restate itself.
 */
const intelligent: Style = {
  id: 'intelligent',
  label: 'Intelligent',
  description:
    'A Rhodes, a chord that moves twice a section, a rolling break, and a melody that answers itself instead of repeating.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [165, 173],
  swing: 0.1,
  modeWeights: { minor: 0.72, major: 0.28 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  feels: [['pocket', 5], ['laidback', 4], ['straight', 3]],
  transitions: [['fill', 4], ['elide', 3], ['break', 2]],
  shots: [[[0, 6], 4], [[0, 8], 3]],
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
    verse: [
      { chords: ['i9', 'i9', 'VImaj7', 'VImaj7', 'iv9', 'iv9', 'VII', 'VII'], weight: 6 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'VImaj7', 'VImaj7', 'VII', 'VII'], weight: 5 },
      { chords: ['i11', 'i11', 'iv9', 'iv9', 'i11', 'i11', 'iv9', 'iv9'], weight: 3 },
    ],
    chorus: [
      { chords: ['VImaj7', 'VImaj7', 'IIImaj7', 'IIImaj7', 'iv9', 'iv9', 'i9', 'i9'], weight: 5 },
      { chords: ['iv9', 'iv9', 'VII', 'VII', 'VImaj7', 'VImaj7', 'i9', 'i9'], weight: 4 },
    ],
    bridge: [{ chords: ['VImaj7', 'VImaj7', 'iv9', 'iv9', 'VII', 'VII', 'i9', 'i9'], weight: 5 }],
    solo: [{ chords: ['i9', 'i9', 'VImaj7', 'VImaj7', 'iv9', 'iv9', 'VII', 'VII'], weight: 5 }],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['Imaj9', 'Imaj9', 'vi9', 'vi9', 'IVmaj9', 'IVmaj9', 'ii9', 'ii9'], weight: 6 }],
    chorus: [{ chords: ['IVmaj9', 'IVmaj9', 'iii9', 'iii9', 'vi9', 'vi9', 'Imaj9', 'Imaj9'], weight: 5 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 4, 8], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    { name: 'rolling-sub', weight: 6, cycle: 32, hits: [
      { at: 0, dur: 10, tone: 0, vel: 1 },
      { at: 12, dur: 4, tone: 7, vel: 0.76 },
      { at: 16, dur: 10, tone: 0, vel: 0.88 },
      { at: 28, dur: 4, tone: 10, vel: 0.72 },
    ] },
    { name: 'melodic-sub', weight: 5, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 3, vel: 0.8 },
      { at: 12, dur: 4, tone: 7, vel: 0.76 },
    ] },
    { name: 'held', weight: 3, hits: [{ at: 0, dur: 14, tone: 0, vel: 1 }] },
  ],
  comp: [
    { name: 'rhodes', weight: 6, voices: 4, voicing: 'guide', hits: [
      { at: 0, dur: 6, vel: 0.6 }, { at: 8, dur: 6, vel: 0.54 },
    ] },
    { name: 'rhodes-syncopated', weight: 5, voices: 4, voicing: 'guide', cycle: 32, hits: [
      { at: 0, dur: 4, vel: 0.62 }, { at: 6, dur: 2, vel: 0.5 },
      { at: 12, dur: 4, vel: 0.56 }, { at: 16, dur: 4, vel: 0.6 },
      { at: 26, dur: 6, vel: 0.52 },
    ] },
    { name: 'held', weight: 3, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.4 }] },
  ],
  drums: [
    { name: 'roller', weight: 6, cycle: 32, voices: {
      bd: [0, 10, 16, 26],
      sd: [8, 24],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      oh: [14, 30],
    }, ghosts: { sd: [3, 7, 11, 19, 23, 27] } },
    { name: 'skippy', weight: 5, cycle: 32, voices: {
      bd: [0, 6, 16, 22],
      sd: [8, 24, 30],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      perc: [12, 20],
    }, ghosts: { sd: [5, 11, 13, 21, 27] } },
    { name: 'plain', weight: 3, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sd: [7, 9] } },
  ],
  melody: { leap: 0.3, ornament: 0.3, span: 17, sequence: 0.5, syncopation: 0.62 },
  /**
   * The genre voice describes the eighteen styles this one is the exception to.
   *
   * `dnb/index.ts` leads with `chant` at 5 — glossed *one note repeated with a
   * tail, the hook is the rhythm* — and its argument for that is a genre in
   * which *a hook is a two-bar fragment repeated until the record ends*. The
   * header above answers that sentence directly: **this one has a tune in it and
   * that one has a wash**, and this is *the one corner where a phrase is
   * expected to answer itself rather than restate itself*. A chant is the
   * archetype that stalls on purpose — `ARCHETYPES.chant` marks down `interest`
   * to 0.5 and `motion` to 0.6 so the audition will let it — and it is the exact
   * thing the header says this style is not.
   *
   * `long-note` is the same disagreement with a citation. The genre puts it at
   * 2.5 on the ground that *fourteen styles' `melodyCells` lead with `[16]` or
   * `[-8, 8]`* — this table leads with `[4, 4, 4, 4]` and `[-2, 2, 4, 8]` and is
   * not one of the fourteen — and it names this style among those the lift is
   * spent on, *which derive 0.40 to 0.57*. So the genre raised it fivefold on
   * the one style whose header defines itself against the wash next door.
   *
   * **The numbers say it from the other side.** It declares 3.22 onsets a bar,
   * the second-densest table here, and realises **2.00** — 0.62 of what it asks
   * for, where the eight other styles declaring above 2.4 land at 0.74 to 0.88.
   * 88% of its notes are a quarter or longer and **9% of its bars are empty, the
   * highest rest share in the genre**, for the style the header calls *genuinely
   * a melody rather than a fragment*. Against `atmospheric`, whose cells it is
   * *twice as dense* as, it realises 1.27 times the onsets rather than two. The
   * two archetypes with an `Archetype.density` below 1 are `chant` at 0.9 and
   * `long-note` at 0.45, and the genre hands them 7.5 of its 14.9 weight.
   *
   * `arch-hook` takes the weight because its forms are the period and the
   * sentence — an antecedent and its consequent is what answering yourself is —
   * and because `hook: 'catchy'` above already means the figure comes back
   * changed. `riff-response` keeps the genre's 4 untouched: the answer half of a
   * riff-response is the same gesture, and the genre's case for it (the
   * `figure`/`economy` judging, `solo.quoteMotto`) is not weakened by anything
   * here. `wide-interval` and `descending-sequence` keep the genre's numbers
   * too — there is no singer on this record either, and a figure walked down the
   * scale is a restatement transposed, which is the thing being argued against.
   */
  voice: {
    archetypes: [
      ['arch-hook', 5],
      ['chant', 1],
      ['long-note', 1],
    ],
  },
};

/**
 * DRUMFUNK — 1997, and the style where the drums stop accompanying anything.
 *
 * The break is the composition. Not a loop with edits in it — a *part*, in which
 * no two bars are the same and the bassline has been reduced to a single note
 * placed once every two bars so that there is something for the drums to be
 * heard against. It is the most extreme thing in this catalogue and the tables
 * are correspondingly lopsided: three drum figures with twenty-seven written
 * ghosts between them — the most of any style in the project — and a bass table whose busiest row has four onsets in
 * thirty-two slots.
 *
 * `boxDrums: false` for the opposite reason to `hardstep`'s. There the point is
 * that the pattern is assembled sample by sample; here it is that the pattern
 * *never repeats*, and a preset box is the one drum source in the project that
 * structurally cannot vary.
 *
 * ## The retrigger, which this style needed more than `jungle` did
 *
 * `DrumPattern.rolls` — `docs/engine-gaps.md` §3.15. `jungle` above is where the
 * gesture comes from and this is where it goes furthest, because there the edit
 * is an event in a loop and here there is no loop for it to be an event in.
 *
 * `stuttered` was a figure named after something it could not do, and now does
 * it: four sixteenths of snare across beat one of bar two, each a pair of 32nds,
 * eight strokes 43 ms apart at 172. `edit` takes the other half and it is the
 * half no other genre can take — **two of its eleven ghosts are doubled**, so
 * the subdivision happens at a quarter of the backbeat's level, underneath the
 * part rather than on top of it. `hiphop` reported §3.15 first and could not
 * have reported that: `trap` and `drill` write no ghost row, and a style with
 * nothing quiet in it has nothing quiet to subdivide.
 *
 * **`sparse-edit` refuses.** It is the one figure here that thins — a ride
 * instead of the hat, four kicks instead of six, and seven ghosts where `edit`
 * has eleven. What it is for is the bar where the operator stops, and a stutter
 * written into it would leave this style with no such bar anywhere.
 *
 * ## The break this style wants and cannot have
 *
 * `drops: dub` gets the bass out of the way for eight bars, which is most of the
 * gesture. The other half is the **seam** break — the bar where everything stops
 * and the drums carry on alone — and `BreakCarrier` cannot say it: the type
 * excludes `drums` on the entirely correct ground that a break silences the kit
 * by definition. So the one break this style most wants is unwritable, and it
 * takes the default carrier instead. hiphop's `breaks` reported the same want
 * and `generate/drop.ts` declined to invent the shape; by this project's own
 * standard two independent reports make it a gap rather than a taste.
 */
const drumfunk: Style = {
  id: 'drumfunk',
  label: 'Drumfunk',
  description:
    'The break as the composition: no two bars alike, and a bassline reduced to one note every two bars to hear it against.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [168, 176],
  swing: 0.09,
  modeWeights: { minor: 0.88, major: 0.12 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  boxDrums: false,
  feels: [['funk', 6], ['pocket', 3], ['straight', 2]],
  transitions: [['fill', 5], ['break', 3], ['elide', 2]],
  shots: [[[0], 5], [[0, 6, 10], 2]],
  drops: [['none', 2], ['dub', 1]],
  dropBars: 8,
  fills: [['snare-toms', 4], ['snare-roll', 4], ['drop', 2]],
  excludeLayers: ['brass'],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 8, note: 'One chord for eight bars, and even that is more harmony than most of these records carry' },
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 },
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'VI', 'VI', 'i', 'i', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 5 },
    { cell: [-12, 4], weight: 4 },
    { cell: [8, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 3 },
  ],
  bass: [
    // One note, once every two bars. It exists so the drums have something to be
    // heard against, and the table says so by having nothing else in it.
    // Held for twenty-four of the thirty-two, because a sub that stops leaves
    // the second bar with nothing in it at all — see `minimal`, where the same
    // figure with a short decay produced a silent break bar.
    { name: 'one-note-per-two', weight: 7, cycle: 32, sustain: true, hits: [
      { at: 0, dur: 24, tone: 0, vel: 1 },
    ] },
    { name: 'two-notes', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 14, tone: 0, vel: 1 },
      { at: 20, dur: 10, tone: 10, vel: 0.76 },
    ] },
    { name: 'stab-pair', weight: 3, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 10, dur: 4, tone: 0, vel: 0.72 },
    ] },
  ],
  comp: [
    { name: 'almost-nothing', weight: 7, voices: 3, cycle: 32, hits: [
      { at: 0, dur: 4, vel: 0.5 },
    ] },
    { name: 'two-stabs', weight: 4, voices: 3, cycle: 32, hits: [
      { at: 0, dur: 3, vel: 0.56 }, { at: 22, dur: 3, vel: 0.46 },
    ] },
    { name: 'bed', weight: 2, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.26 }] },
  ],
  drums: [
    /**
     * Eleven ghost strokes in two bars, and they are the part. The loud strokes
     * below are the skeleton somebody edited *around*; what a listener follows
     * is the lattice underneath, which is why this figure has more ghosts than
     * anything else in the project.
     */
    { name: 'edit', weight: 7, cycle: 32, voices: {
      bd: [0, 6, 11, 16, 21, 27],
      sd: [8, 14, 24, 30],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    }, ghosts: { sd: [1, 5, 7, 9, 13, 17, 19, 23, 25, 29, 31] },
    // Two of the eleven ghosts doubled, and this is the one thing in the
    // project's whole use of this field that happens *below* audibility.
    //
    // `generateDrums` builds the ghost row and the struck row into one list and
    // looks the roll map up per voice and per written slot, so a ghosted slot
    // takes a roll exactly as a struck one does and every stroke of it keeps the
    // quarter-level the ghost already had. That is the genre header's sentence
    // with the arithmetic in it — an amen's internal detail wants 43 ms — and it
    // is the half of §3.15 `hiphop` structurally could not report, because
    // `trap` and `drill` write no ghost row at all and had nothing quiet to
    // subdivide.
    //
    // Slots 9 and 25 are the ghosts immediately after the two backbeats, which
    // is where the break's fastest detail sits and is the one place an operator
    // reaches for when the loop is already this dense. Measured at a mean
    // velocity of 0.16, against 0.58 to 0.94 for the struck rush in the figure
    // below — a quarter of the level, which is `GHOST_LEVEL` doing exactly what
    // it does to every other stroke on this row.
    rolls: { sd: { 9: 2, 25: 2 } } },
    { name: 'stuttered', weight: 5, cycle: 32, voices: {
      bd: [0, 3, 10, 16, 19, 26],
      sd: [8, 16, 17, 18, 19, 24, 28],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      perc: [12, 20],
    }, ghosts: { sd: [5, 7, 9, 11, 15, 21, 23, 25, 31] },
    // The figure is named for this and could not previously play it. Beat one of
    // bar two, all four sixteenths, each a pair of 32nds: eight strokes 43 ms
    // apart at 172, landing on the downbeat rather than leading to it.
    //
    // Aligned to the beat where `jungle`'s crosses the barline, and the
    // difference is the two styles' whole relationship. There the edit is a
    // hand catching the loop late; here the break *is* the composition and the
    // bar is where the composer starts a figure, so the rush begins where the
    // bar does and the kick underneath it at 16 and 19 begins with it.
    rolls: { sd: { 16: 2, 17: 2, 18: 2, 19: 2 } } },
    { name: 'sparse-edit', weight: 4, cycle: 32, voices: {
      bd: [0, 12, 16, 22],
      sd: [8, 20, 24],
      rd: [0, 4, 8, 12, 16, 20, 24, 28],
    }, ghosts: { sd: [3, 7, 11, 15, 19, 27, 31] } },
  ],
  melody: { leap: 0.22, ornament: 0.08, span: 11, sequence: 0.9, syncopation: 0.72 },
};

/**
 * TECHSTEP — 1997, and the second of this genre's two scale overrides.
 *
 * A Reese, a two-step assembled out of one-shots, and a filter closing over
 * eight bars. The break is gone: what is on these records is a kick sample, a
 * snare sample and nothing between them, and **this is the first style in the
 * file to write no ghost row.** That silence is a claim rather than an omission
 * — see the file header — and it is the claim the whole second half of the
 * catalogue inherits.
 *
 * ## `phrygian`, and why the ♭2 has to be spellable
 *
 * The genre's rule is the natural minor and it is right for twenty-two styles.
 * This one is recognised by **one interval**: the semitone above the tonic,
 * played on a bass that is already an unpleasant object, usually as the second
 * note of a two-note motif. `minor` is 0, 2, 3, 5, 7, 8, 10 and there is no ♭2
 * in it, so under the genre rule this style could not state the thing it is
 * named for. `darkcore` above makes the same complaint about a different
 * interval, and those two are the only overrides in this genre.
 *
 * The horror-scoring debt is direct and it is the reason both overrides point at
 * scales borrowed from outside the idiom. What a techstep producer was doing was
 * what a film composer does with a low string cluster, on equipment that could
 * only make one note at a time.
 *
 * ## What the Reese is, and what the table says about it now
 *
 * Two detuned sawtooths beating against each other while the pitch moves under a
 * filter. **The movement is the sound** — and the table says so, because this
 * style is one of the five reports that got `BassHit.glide` built and is now one
 * of the styles spending it. What stood below was the right *contour* arrived at
 * by the wrong mechanism: struck notes a semitone or a minor third apart, the
 * record's one travelling note sampled at the points where it changed direction.
 * The sampled points are gone. `neurofunk` and `jumpup` reported the same thing
 * about the same field and adopted in the same pass, which is the whole of this
 * genre's §3.16 evidence spent rather than restated.
 *
 * `drops: breakdown`. Everything leaves, a filtered pad holds eight bars, and
 * the whole record arrives at once — which is what the second drop of one of
 * these tracks is, and the reason `filter.shape` is `ramp` rather than `step`.
 */
const techstep: Style = {
  id: 'techstep',
  label: 'Techstep',
  description:
    'A Reese, a two-step built out of one-shots, and a filter closing over eight bars. The break is gone.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [168, 176],
  swing: 0,
  modeWeights: { minor: 0.95, major: 0.05 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['straight', 7], ['driving', 3]],
  transitions: [['fill', 3], ['break', 4], ['shot', 3]],
  shots: [[[0, 8], 5], [[0], 4], [[0, 6, 10], 2]],
  filter: { depth: 0.55, shape: 'ramp' },
  drops: [['none', 2], ['breakdown', 1]],
  dropBars: 8,
  // The ♭2, which is what this style is recognised by and which the genre's own
  // scale cannot spell. See the header.
  scaleForChord: (tonic) => makeScale(tonic, 'phrygian'),
  excludeLayers: ['brass'],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 7 },
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 5, note: 'The Neapolitan, which in this style is not a cadence at all — it is the bass moving up a semitone and back' },
    ],
    chorus: [
      { chords: ['i', 'i', 'bII', 'bII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['bII', 'bII', 'bII', 'bII', 'i', 'i', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I', 'I', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-8, 8], weight: 6 },
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 3 },
    { cell: [-12, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 4 },
  ],
  bass: [
    /**
     * The Reese, and the first row in this genre whose pitch moves without being
     * struck again.
     *
     * What stood here until `BassHit.glide` existed was the record's contour
     * *sampled*: six struck notes across two bars stating tonic, ♭2, tonic,
     * tonic, ♭3, ♭2 — the right sequence of pitches played by the wrong
     * instrument. A Reese is two detuned sawtooths whose pitch is a function of
     * time, and re-articulating is the one thing it never does.
     *
     * **Adopting the field deleted two of the six**, and the four that remain
     * are each a *leg*: struck at one pitch, arriving at the next, with the note
     * that used to state the arrival now written as a destination rather than a
     * hit. Read the four as pitch alone and the two bars are unbroken — 0 → ♭2
     * across beats one and two, ♭2 → 0 across three and four, 0 → ♭3 through the
     * first half of bar two and ♭3 → ♭2 through the second — because each row
     * starts on the pitch its predecessor reached. The only place the pitch
     * jumps is the loop back to the downbeat. Four amplitude re-gates on one
     * continuous contour is what a Reese under a gate is; six struck pitches was
     * a synthesiser playing a tune.
     *
     * That is the answer to the three-point contour this row used to apologise
     * for. `glide` holds one leg, a three-point arc is two legs, and spending
     * two notes on it costs exactly one re-gate at the turning point — which is
     * not a re-articulation *of the pitch*, because the second note begins where
     * the first one arrived. Collapsing to a single leg was the alternative and
     * it throws the return away.
     *
     * **No `glideTime` anywhere in this genre**, which is the default and is the
     * argument for having the field default that way. `BassHit.glideTime` quotes
     * this style — "the movement is the sound" — and a Reese that arrives early
     * and waits is a note with a smear on the front. hiphop's `drill` is the
     * other case and writes a number.
     */
    { name: 'reese', weight: 7, cycle: 32, hits: [
      { at: 0, dur: 8, tone: 0, glide: 1, vel: 1 },
      { at: 8, dur: 8, tone: 1, glide: 0, vel: 0.84 },
      { at: 16, dur: 8, tone: 0, glide: 3, vel: 0.94 },
      { at: 24, dur: 8, tone: 3, glide: 1, vel: 0.82 },
    ] },
    /**
     * The same object with a leap in it, which is why one note here stays
     * struck.
     *
     * The arc is two legs as above — out to the ♭2 and back across the first
     * three beats, the second leg arriving on the tonic exactly where the third
     * note begins. Then the figure jumps to the ♭7, ten semitones in one step,
     * and that note is *articulated somewhere else*: a leap does not become a
     * slide by being written with a `glide`, and ten semitones travelled across
     * a quarter of a bar is a dive-bomb, which is a different record. The table
     * can tell the two gestures apart now, so this row says which of them it is
     * playing and where it changes its mind.
     */
    { name: 'stepped-reese', weight: 5, hits: [
      { at: 0, dur: 6, tone: 0, glide: 1, vel: 1 },
      { at: 6, dur: 6, tone: 1, glide: 0, vel: 0.76 },
      { at: 12, dur: 4, tone: 10, vel: 0.78 },
    ] },
    /**
     * Hold, then move — the one shape in this style that a single note cannot
     * say, and the two notes are how it is said anyway.
     *
     * `NoteBend` forces the travel to begin at the onset, because superdough's
     * pitch envelope has no delay stage and a bend written late would audition
     * in the wrong place rather than merely audition flat. So no one note sits
     * on the tonic for three beats and lifts through the fourth. Two do: the
     * first is the pedal and carries no bend at all, the second is the leg. Both
     * onsets are where they were before this row changed and the second is still
     * struck on the tonic, so the rhythm is untouched; what changed is that the
     * ♭2 is no longer hit, it is arrived at, over the last four sixteenths.
     */
    { name: 'held-reese', weight: 4, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 12, dur: 4, tone: 0, glide: 1, vel: 0.72 },
    ] },
  ],
  comp: [
    { name: 'filtered-stab', weight: 6, voices: 3, cycle: 32, hits: [
      { at: 0, dur: 4, vel: 0.6 }, { at: 16, dur: 4, vel: 0.54 },
    ] },
    { name: 'pulse', weight: 4, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.5 }, { at: 4, dur: 2, vel: 0.44 },
      { at: 8, dur: 2, vel: 0.5 }, { at: 12, dur: 2, vel: 0.44 },
    ] },
    { name: 'bed', weight: 3, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.32 }] },
  ],
  drums: [
    // No ghosts anywhere below. One kick sample, one snare sample, and nothing
    // between them — see the header.
    { name: 'one-shot-step', weight: 7, cycle: 32, voices: {
      bd: [0, 10, 16, 22],
      sd: [8, 24],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    } },
    { name: 'hard-step', weight: 5, cycle: 32, voices: {
      bd: [0, 12, 16, 20, 26],
      sd: [8, 24],
      hh: [2, 6, 10, 14, 18, 22, 26, 30],
      rim: [4, 20],
    } },
    { name: 'gated', weight: 4, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [0, 4, 8, 12],
      oh: [6, 14],
    } },
  ],
  melody: { leap: 0.26, ornament: 0.06, span: 12, sequence: 0.9, syncopation: 0.55 },
};

/**
 * NEUROFUNK — 2000, and the record with nothing on it but the bass.
 *
 * Techstep's descendant with the last of the sample library removed. The bass is
 * not a note, it is a *patch* — resampled, re-filtered, re-pitched and layered
 * until it has a formant contour, which is to say until it talks — and the
 * arrangement is that object with a two-step underneath it and forty seconds of
 * air where the melody would be.
 *
 * `melody.span: 10` is the narrowest in the file, level with `minimal`'s, and the
 * melody cells are the emptiest. That is not restraint; there is genuinely nothing in the midrange of
 * one of these records except the bass's own upper harmonics, and the engine has
 * no way to make a bass layer occupy a melodic register — see `dnb/index.ts`,
 * where `mix.melody` sits below `mix.comp` for this reason and for no other.
 *
 * **It writes no `drops`, and the refusal is worth recording** because this is
 * the style a reader would expect to take `breakdown` first. A neurofunk
 * breakdown removes the kit and the bass; the bass *is* the wash on these
 * records, and `DROPS.breakdown` listens for `pad`. So the shape would either
 * never place — the style rarely carries a pad at all — or place and take away
 * the one thing the listener was following. The gesture is real and the
 * mechanism cannot express it, which is a cleaner statement than opting in and
 * hoping.
 */
const neurofunk: Style = {
  id: 'neurofunk',
  label: 'Neurofunk',
  description:
    'Techstep with the sample library removed: a bass patch resampled until it talks, and forty seconds of air around it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [170, 176],
  swing: 0,
  modeWeights: { minor: 0.95, major: 0.05 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['straight', 8], ['driving', 2]],
  transitions: [['fill', 3], ['break', 4], ['shot', 3]],
  shots: [[[0, 8], 5], [[0], 4]],
  filter: { depth: 0.4, shape: 'step' },
  excludeLayers: ['brass'],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 8, note: 'One chord, and the bass is not playing it either — it is playing a shape on the root' },
    ],
    chorus: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 },
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'VI', 'VI', 'i', 'i', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 5 },
    { cell: [-12, 4], weight: 4 },
  ],
  cadenceCells: [
    { cell: [16], weight: 8 },
    { cell: [-8, 8], weight: 2 },
  ],
  bass: [
    /**
     * The talking bass, and the row that shows adopting `BassHit.glide` is not
     * always a deletion.
     *
     * Seven onsets in two bars, all of them inside a minor third, because what
     * changes between them is the filter and the formant rather than the pitch.
     * That was written when the tables could hold only half of this object, and
     * the half they can hold now is the half this row wanted least. **The rests
     * here are a gate, not a sampling artefact.** `techstep`'s Reese collapses
     * six struck notes into four because its notes are contiguous and the
     * strikes were the compromise; every stroke here is fenced by a silence
     * somebody switched on, so merging two of them into one travelling note
     * would delete the thing the style is made of. The onset count and every
     * `at` below are exactly what they were.
     *
     * So the field is spent *inside* strokes instead, on three of the seven: the
     * ♭3 on beat three of bar one smears down to the root, the ♭2 on the
     * and-of-two of bar two does the same, and the six-sixteenth tail from the
     * and-of-three climbs a minor third into the loop, which is the rising
     * inflection that makes this patch read as speech. Each of the first two
     * leaves the next stroke re-gating on the pitch that arrived rather than
     * jumping to it, so the pitch is continuous across four of the six joins
     * where it used to be continuous across two.
     */
    { name: 'talking', weight: 7, cycle: 32, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 0, vel: 0.8 },
      { at: 8, dur: 3, tone: 3, glide: 0, vel: 0.9 },
      { at: 14, dur: 2, tone: 0, vel: 0.76 },
      { at: 16, dur: 4, tone: 0, vel: 0.96 },
      { at: 22, dur: 2, tone: 1, glide: 0, vel: 0.78 },
      { at: 26, dur: 6, tone: 0, glide: 3, vel: 0.84 },
    ] },
    /**
     * The same patch with the gate opening off the beat, and a hold and a leg on
     * beat one: the first stroke sits on the root for three sixteenths, the
     * second leaves on the last sixteenth of the beat and climbs a minor third,
     * and the stroke on the and-of-two re-gates at the top of that climb and
     * falls back. Five contiguous sixteenths, one rise and fall, two gate
     * openings — and the root on the and-of-three re-gates the pitch the fall
     * arrived at instead of jumping to it. The ♭7 at the end is a leap and stays
     * struck, for the reason `techstep`'s `stepped-reese` gives.
     */
    { name: 'syncopated-patch', weight: 5, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 3, dur: 3, tone: 0, glide: 3, vel: 0.72 },
      { at: 6, dur: 2, tone: 3, glide: 0, vel: 0.84 },
      { at: 10, dur: 2, tone: 0, vel: 0.78 },
      { at: 14, dur: 2, tone: 10, vel: 0.74 },
    ] },
    /**
     * Two long strokes and nothing else, which was two statements of the root
     * and is now one arc: up a minor third across the first half of the bar,
     * back down across the second, with the gate shut for the two sixteenths in
     * between and the descent starting on the pitch the ascent reached.
     *
     * Nothing is deleted here, because there was never a second struck pitch to
     * absorb. This is the row where the field is not tidying up a compromise but
     * saying something the tables could not say at all — a bass note whose pitch
     * is a function of time — and it is the shape neurofunk's own header is
     * about, a patch resampled and re-pitched until it stops being a note.
     */
    { name: 'long-patch', weight: 4, hits: [
      { at: 0, dur: 8, tone: 0, glide: 3, vel: 1 },
      { at: 10, dur: 6, tone: 3, glide: 0, vel: 0.82 },
    ] },
  ],
  comp: [
    { name: 'nothing-much', weight: 7, voices: 3, cycle: 32, hits: [
      { at: 0, dur: 3, vel: 0.48 },
    ] },
    { name: 'two-hits', weight: 4, voices: 3, cycle: 32, hits: [
      { at: 0, dur: 3, vel: 0.5 }, { at: 20, dur: 3, vel: 0.42 },
    ] },
    { name: 'thin-bed', weight: 3, voices: 3, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.24 }] },
  ],
  drums: [
    { name: 'clean-step', weight: 7, cycle: 32, voices: {
      bd: [0, 10, 16, 22],
      sd: [8, 24],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    } },
    { name: 'displaced', weight: 5, cycle: 32, voices: {
      bd: [0, 11, 16, 21],
      sd: [8, 26],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      rim: [14, 30],
    } },
    { name: 'minimal-step', weight: 4, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [2, 6, 10, 14],
    } },
  ],
  melody: { leap: 0.2, ornament: 0.04, span: 10, sequence: 0.92, syncopation: 0.5 },
};

/**
 * LIQUID — 2002, and the style the drop was shaped for.
 *
 * The rolling break comes back, the Rhodes comes back, and the sub sits under a
 * `maj9` instead of under one note. Structurally it is `intelligent` seven years
 * later with a much better mixing desk; what separates the two tables is that
 * this one is a **dance record** and that one was a listening one — the drums
 * are louder, the sections are longer, and there is a breakdown in the middle
 * that exists to be mixed out of.
 *
 * `drops: breakdown`, at a weight of one in three, and this is the style
 * `docs/engine-gaps.md` §7 was describing when it said the shape needed *"a
 * dance record with a wash, on a form long enough for three four-bar phrases"*.
 * The forms here are four times longer than that: at 174 BPM a chorus is
 * thirty-two bars, and `dropBars: 8` puts the gesture at the scale the records
 * actually use. Eight bars of no kit and no bass at 174 is eleven seconds, and
 * eleven seconds is a breakdown; four is a stumble.
 *
 * `swing: 0.12` is the highest in the file, level with `jazzstep`'s. The breaks
 * used here were sampled
 * from soul records rather than from funk ones and they push harder.
 */
const liquid: Style = {
  id: 'liquid',
  label: 'Liquid',
  description:
    'The rolling break and the Rhodes both back, a sub under a major ninth, and a breakdown in the middle to mix out of.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [170, 176],
  swing: 0.12,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  feels: [['pocket', 5], ['funk', 4], ['laidback', 3], ['straight', 2]],
  transitions: [['fill', 4], ['break', 3], ['elide', 3]],
  shots: [[[0, 6], 4], [[0, 8], 3], [[0, 3, 6, 10], 2]],
  drops: [['none', 2], ['breakdown', 1]],
  dropBars: 8,
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
    verse: [
      { chords: ['i9', 'i9', 'VImaj7', 'VImaj7', 'iv9', 'iv9', 'VII', 'VII'], weight: 6 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'VImaj7', 'VImaj7', 'VImaj7', 'VImaj7'], weight: 5 },
      { chords: ['i11', 'i11', 'IIImaj7', 'IIImaj7', 'iv9', 'iv9', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VImaj7', 'VImaj7', 'VII', 'VII', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['iv9', 'iv9', 'IIImaj7', 'IIImaj7', 'VImaj7', 'VImaj7', 'VII', 'VII'], weight: 4 },
    ],
    bridge: [{ chords: ['VImaj7', 'VImaj7', 'VImaj7', 'VImaj7', 'iv9', 'iv9', 'VII', 'VII'], weight: 5 }],
    solo: [{ chords: ['i9', 'i9', 'VImaj7', 'VImaj7', 'iv9', 'iv9', 'VII', 'VII'], weight: 5 }],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'vi9', 'vi9', 'IVmaj9', 'IVmaj9', 'ii9', 'ii9'], weight: 6 },
      { chords: ['Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9'], weight: 4 },
    ],
    chorus: [{ chords: ['IVmaj9', 'IVmaj9', 'iii9', 'iii9', 'vi9', 'vi9', 'ii9', 'ii9'], weight: 5 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [4, 4, 8], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [-2, 2, 4, 4, 4], weight: 3 },
    { cell: [16], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    { name: 'rolling-sub', weight: 6, cycle: 32, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 14, dur: 2, tone: 0, vel: 0.68 },
      { at: 16, dur: 10, tone: 0, vel: 0.9 },
      { at: 28, dur: 4, tone: 7, vel: 0.74 },
    ] },
    { name: 'moving-sub', weight: 5, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 7, vel: 0.8 },
      { at: 12, dur: 4, tone: 3, vel: 0.76 },
    ] },
    { name: 'stepped-sub', weight: 4, cycle: 32, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 0, vel: 0.78 },
      { at: 16, dur: 6, tone: 5, vel: 0.88 },
      { at: 24, dur: 8, tone: 3, vel: 0.8 },
    ] },
  ],
  comp: [
    { name: 'rhodes', weight: 6, voices: 4, voicing: 'guide', hits: [
      { at: 0, dur: 6, vel: 0.6 }, { at: 8, dur: 6, vel: 0.54 },
    ] },
    { name: 'rhodes-push', weight: 5, voices: 4, voicing: 'guide', cycle: 32, hits: [
      { at: 0, dur: 4, vel: 0.62 }, { at: 6, dur: 2, vel: 0.5 },
      { at: 10, dur: 4, vel: 0.56 }, { at: 14, dur: 2, vel: 0.5 },
      { at: 16, dur: 6, vel: 0.6 }, { at: 26, dur: 6, vel: 0.52 },
    ] },
    { name: 'wash', weight: 4, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.4 }] },
  ],
  drums: [
    { name: 'liquid-roll', weight: 7, cycle: 32, voices: {
      bd: [0, 10, 16, 26],
      sd: [8, 24],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      oh: [14, 30],
    }, ghosts: { sd: [3, 7, 11, 19, 23, 27] } },
    { name: 'shuffling', weight: 5, cycle: 32, voices: {
      bd: [0, 6, 16, 22],
      sd: [8, 24],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      sh: [4, 12, 20, 28],
    }, ghosts: { sd: [5, 9, 13, 21, 25, 29] } },
    { name: 'open', weight: 4, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      rd: [0, 8],
    }, ghosts: { sd: [7, 11] } },
  ],
  melody: { leap: 0.28, ornament: 0.26, span: 16, sequence: 0.6, syncopation: 0.64 },
};

/**
 * ROLLERS — 2004, and the most functional object in the catalogue.
 *
 * One figure, one bass note and one break, for six minutes. It is a DJ tool and
 * it does not pretend otherwise: the entire proposition is that nothing happens,
 * so that a mix can be held over it for two minutes at either end. `melody.
 * sequence` is 0.94, the highest in the file alongside `minimal`'s, and the
 * melodic content is a two-note motif restated ninety times.
 *
 * `drops: dub`, at one in three, and it is the only event in the style. The bass
 * leaves for eight bars, the roll carries, and the record comes back — and
 * because there is nothing else in the arrangement, that one edit is doing all
 * the work an entire liquid breakdown does next door.
 *
 * The ghosts are light — four strokes on one figure — and they are the last of
 * them chronologically. Everything after 2004 in this file is programmed.
 */
const rollers: Style = {
  id: 'rollers',
  label: 'Rollers',
  description:
    'One figure, one bass note and one break for six minutes, so a mix can be held over either end of it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [172, 176],
  swing: 0.08,
  modeWeights: { minor: 0.85, major: 0.15 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['straight', 6], ['pocket', 3], ['driving', 2]],
  transitions: [['fill', 4], ['break', 3], ['elide', 2]],
  shots: [[[0, 8], 4], [[0], 4]],
  drops: [['none', 2], ['dub', 1]],
  dropBars: 8,
  excludeLayers: ['brass'],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 8, note: 'Nothing happens, on purpose, for the length of a mix' },
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 4 },
    ],
    chorus: [
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-8, 8], weight: 6 },
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 3 },
  ],
  bass: [
    { name: 'roller-sub', weight: 7, cycle: 32, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 16, dur: 12, tone: 0, vel: 0.9 },
    ] },
    { name: 'pumping', weight: 5, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 6, tone: 0, vel: 0.86 },
    ] },
    { name: 'answered', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 16, dur: 8, tone: 10, vel: 0.84 },
      { at: 26, dur: 6, tone: 0, vel: 0.8 },
    ] },
  ],
  comp: [
    { name: 'one-stab', weight: 7, voices: 3, cycle: 32, hits: [{ at: 0, dur: 4, vel: 0.56 }] },
    { name: 'pulse', weight: 4, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.5 }, { at: 8, dur: 2, vel: 0.46 },
    ] },
    { name: 'bed', weight: 3, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.3 }] },
  ],
  drums: [
    { name: 'the-roll', weight: 8, cycle: 32, voices: {
      bd: [0, 10, 16, 26],
      sd: [8, 24],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    }, ghosts: { sd: [7, 11, 23, 27] } },
    { name: 'the-roll-open', weight: 5, cycle: 32, voices: {
      bd: [0, 10, 16, 26],
      sd: [8, 24],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      oh: [6, 22],
    }, ghosts: { sd: [11, 27] } },
    { name: 'plain-step', weight: 3, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  melody: { leap: 0.22, ornament: 0.06, span: 11, sequence: 0.94, syncopation: 0.52 },
};

/**
 * JUMP-UP — 2004, and the one everybody in the room can do an impression of.
 *
 * A bassline that bounces, in the octave above the sub rather than in it, with a
 * cartoon sample on top and a beat that has been simplified until a person who
 * has never heard the genre can find beat one. It is the commercially largest
 * style here and the least respectable, which is a combination this project has
 * met before in `humppa` and `crunk`.
 *
 * **The wobble was the third report on §3.16 and now spends the field it asked
 * for.** What the bass does is move continuously between two pitches under an
 * LFO; what was written was a pair of struck notes a fifth apart, alternating,
 * which is the *shape* without the thing that makes it recognisable. The pair is
 * one note now — struck on the fifth and arriving at the root without being hit
 * again — so the sweep is in the file rather than in this paragraph. `techstep`
 * and `neurofunk` above made the same complaint about the Reese and adopted in
 * the same pass. Three styles independently in one genre is what
 * `docs/engine-gaps.md` calls the difference between a gap and a taste, and all
 * three of them are spent.
 *
 * No ghosts. The kit is four samples with a limiter across them.
 */
const jumpup: Style = {
  id: 'jumpup',
  label: 'Jump-up',
  description:
    'A bassline that bounces in the octave above the sub, a cartoon sample on top, and a beat anyone can find beat one in.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [172, 178],
  swing: 0,
  modeWeights: { minor: 0.82, major: 0.18 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['straight', 6], ['driving', 4]],
  transitions: [['fill', 4], ['shot', 4], ['break', 3]],
  shots: [[[0, 6, 10], 5], [[0, 8], 4], [[0, 4, 8, 12], 2]],
  excludeLayers: ['brass'],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 7 },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['i', 'i', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [4, 4, 8], weight: 5 },
    { cell: [2, 2, 4, 8], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 12], weight: 2 },
  ],
  bass: [
    /**
     * The wobble as one note that moves, which is what a wobble is.
     *
     * Five struck notes became three. The two that stated the root after each
     * fifth are gone and each fifth *arrives* there instead: a four-sixteenth
     * sweep across beat two, and a six-sixteenth one from the and-of-three into
     * the bar line — where the next bar strikes the root the sweep has just
     * reached, so the loop point is a re-gate rather than a jump. Two sweeps to
     * the bar at 175 BPM is about 1.5 Hz, which is where an LFO is set when the
     * point of it is that a listener can hear it move. The stroke on beat one
     * carries no bend, because in this style beat one is the thing the whole
     * record exists to make findable.
     *
     * The vertical span is still seven semitones and every destination sits
     * inside it, which is deliberate: `generateBass` folds glide destinations
     * into the same reduce as the struck tones, so a figure travelling outside
     * its own span moves the octave the whole shape is placed in. That is worth
     * knowing rather than worth fearing — the wall is 24 semitones and seven is
     * nowhere near it, see `unplaceableRoots` — so keeping the destinations
     * inside the span is a decision about where the sweep sits in the register,
     * not a way round §1.3. Nothing here reaches further than it did before.
     */
    { name: 'wobble', weight: 7, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 4, tone: 7, glide: 0, vel: 0.82 },
      { at: 10, dur: 6, tone: 7, glide: 0, vel: 0.8 },
    ] },
    /**
     * The bounce, and it stays struck on purpose. What this row does is *leap* —
     * up an octave, up a ♭7, up a fifth, back to the root each time, across
     * rests — and a leap written as a glide is a dive-bomb rather than a bounce.
     * The other half of jump-up is the sweep above; now that the table can say
     * both, it is worth one row saying which of the two it is, especially this
     * one, whose twelve-semitone span is the widest bass shape in the genre —
     * with a dozen semitones of room still under the wall, now that the wall has
     * been measured at 24 rather than guessed at 12.
     */
    { name: 'bouncing', weight: 6, cycle: 32, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 12, vel: 0.78 },
      { at: 8, dur: 3, tone: 0, vel: 0.9 },
      { at: 12, dur: 2, tone: 10, vel: 0.76 },
      { at: 16, dur: 3, tone: 0, vel: 0.98 },
      { at: 22, dur: 2, tone: 7, vel: 0.8 },
      { at: 26, dur: 6, tone: 0, vel: 0.84 },
    ] },
    { name: 'stab-bass', weight: 4, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 3, dur: 2, tone: 0, vel: 0.78 },
      { at: 8, dur: 2, tone: 5, vel: 0.86 },
      { at: 11, dur: 2, tone: 3, vel: 0.76 },
      { at: 14, dur: 2, tone: 0, vel: 0.8 },
    ] },
  ],
  comp: [
    { name: 'stab-pair', weight: 6, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.72 }, { at: 8, dur: 2, vel: 0.66 },
    ] },
    { name: 'cartoon', weight: 5, voices: 3, cycle: 32, hits: [
      { at: 0, dur: 2, vel: 0.76 }, { at: 4, dur: 2, vel: 0.6 },
      { at: 16, dur: 2, vel: 0.72 }, { at: 22, dur: 2, vel: 0.62 },
    ] },
    { name: 'bed', weight: 2, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.28 }] },
  ],
  drums: [
    { name: 'simple-step', weight: 7, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      oh: [6, 14],
    } },
    { name: 'punchy', weight: 5, cycle: 32, voices: {
      bd: [0, 10, 16, 20, 26],
      sd: [8, 24],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      cp: [8, 24],
    } },
    { name: 'four-and-step', weight: 4, voices: {
      bd: [0, 4, 8, 12],
      sd: [8],
      hh: [2, 6, 10, 14],
      oh: [14],
    } },
  ],
  melody: { leap: 0.36, ornament: 0.08, span: 14, sequence: 0.88, syncopation: 0.6 },
};

/**
 * DANCEFLOOR — 2006, and the record with the biggest hole in it.
 *
 * The clean commercial drop: a hook everybody knows by the second listen, a
 * sixteen-bar wind-down where the drums leave entirely, and the whole
 * arrangement arriving at once on a downbeat. It is the style that most wants
 * `DROPS.breakdown` and the one this table opts in hardest — one in two rather
 * than one in three, which is the highest weight any style in the project gives
 * a drop shape.
 *
 * That weight is a claim and it is worth defending: on a liquid or an
 * atmospheric record the breakdown is a section that happens to be quiet, and
 * here it is **the reason the record exists**. Half of these tracks are two
 * minutes of setup and forty seconds of payoff, twice.
 *
 * ## What is missing, and it is the loudest missing thing in this genre
 *
 * **The build.** On the records, the eight bars before the drop are a snare roll
 * accelerating into a riser, and the tempo of the roll climbs. `Style.tempoRamp`
 * exists and explicitly cannot do it: `generate/tempo.ts` records that
 * everything in that file runs before the form exists, while `planDrop` runs
 * four hundred lines later, so a ramp cannot *arrive at* anything. And the drop
 * itself is deliberately unmarked — `generate/drop.ts` says in as many words
 * that no crash lands on the bar the band returns, because writing one would be
 * authoring an event the composition did not contain.
 *
 * So what this table does instead is put the announcement at the **seam**, where
 * the engine is allowed to make one: `fills` leads with `drop` at 6, the
 * transition palette weights `break` and `shot` above `fill`, and the shot
 * figures are the whole-band stabs a build lands on. That is the same gesture
 * moved half a phrase, and it is the honest thing available.
 */
const dancefloor: Style = {
  id: 'dancefloor',
  label: 'Dancefloor',
  description:
    'The clean commercial drop: a hook by the second listen, sixteen bars of wind-down, and everything arriving at once.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [172, 176],
  swing: 0,
  modeWeights: { minor: 0.7, major: 0.3 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['straight', 6], ['driving', 4]],
  transitions: [['break', 4], ['shot', 4], ['fill', 3]],
  shots: [[[0, 8], 5], [[0, 6, 10], 4], [[0, 4, 8, 12], 2]],
  fills: [['drop', 6], ['snare-roll', 4], ['lead-in', 2]],
  filter: { depth: 0.45, shape: 'ramp' },
  drops: [['none', 1], ['breakdown', 1]],
  dropBars: 8,
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 6 },
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 6 },
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'VI', 'VI', 'VII', 'VII', 'VII', 'VII'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'VII', 'VII'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'V', 'V', 'vi', 'vi', 'IV', 'IV'], weight: 6 }],
    chorus: [{ chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 6 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [4, 4, 8], weight: 6 },
    { cell: [8, 8], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [16], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 4 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'clean-sub', weight: 7, cycle: 32, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 16, dur: 12, tone: 0, vel: 0.92 },
    ] },
    { name: 'driving-sub', weight: 5, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 0, vel: 0.86 },
      { at: 12, dur: 4, tone: 7, vel: 0.78 },
    ] },
    { name: 'octave-hook', weight: 4, cycle: 32, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 12, vel: 0.8 },
      { at: 16, dur: 6, tone: 0, vel: 0.94 },
      { at: 24, dur: 8, tone: 7, vel: 0.82 },
    ] },
  ],
  comp: [
    { name: 'big-chord', weight: 6, voices: 4, hits: [
      { at: 0, dur: 8, vel: 0.7 }, { at: 8, dur: 8, vel: 0.64 },
    ] },
    { name: 'pumping', weight: 5, voices: 4, hits: [
      { at: 0, dur: 3, vel: 0.7 }, { at: 4, dur: 3, vel: 0.6 },
      { at: 8, dur: 3, vel: 0.68 }, { at: 12, dur: 3, vel: 0.6 },
    ] },
    { name: 'wash', weight: 4, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.42 }] },
  ],
  drums: [
    { name: 'clean-step', weight: 7, cycle: 32, voices: {
      bd: [0, 10, 16, 26],
      sd: [8, 24],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      cp: [8, 24],
    } },
    { name: 'big-room', weight: 5, cycle: 32, voices: {
      bd: [0, 10, 16, 20, 26],
      sd: [8, 24],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      oh: [6, 14, 22, 30],
      cr: [0],
    } },
    { name: 'simple', weight: 4, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  melody: { leap: 0.3, ornament: 0.12, span: 15, sequence: 0.86, syncopation: 0.55 },
};

/**
 * SAMBASS — 1999, and the only style here with somebody playing an instrument.
 *
 * A batucada — surdo, agogô, tamborim, a shaker and a cabasa — laid over a
 * two-step, with a nylon guitar and a major key. It is a genuine and much-loved
 * corner of the genre and it exists in this catalogue for one structural reason
 * as well as a musical one: **it is the style whose drum tables reach furthest
 * into the auxiliary voices**, and therefore the one a `SAMPLE_RACKS` conga rack
 * has most to attach to.
 *
 * **This note said *the only style whose drum tables reach the auxiliary voices
 * at all*, and it is not.** Counted over every written slot in the genre's drum
 * tables, **12 of the 24 styles here reach at least one of `lp mp hp perc cb sh
 * tb`** — but ten of the twelve reach exactly *one* voice, and five of those
 * ten spend two strokes on it. This style reaches four voices and writes 54
 * strokes across them, 42% of the genre's 128; `ragga` is the only other
 * multi-voice table at three voices and 9 strokes. So the structural claim
 * survives as a matter of degree rather than of kind, and the degree is large
 * enough that the conclusion is unchanged: a conga rack landing on `perc` alone
 * in `jungle` is one sample under a break, and a conga rack landing here is a
 * batucada.
 *
 * `modeWeights` is the most major-leaning in the file after `hardcore`, and it
 * is not a hedge — the source material is Brazilian and the source material is
 * in a major key with a flattened seventh.
 *
 * The ghosts here are on the *percussion* rather than on the snare, which no
 * other style in the project does. A tamborim pattern is loud strokes and quiet
 * ones in the same hand at the same subdivision, and `DrumPattern.ghosts` is
 * per voice, so it can say so.
 */
const sambass: Style = {
  id: 'sambass',
  label: 'Sambass',
  description:
    'A batucada laid over a two-step: surdo, agogô and shaker, a nylon guitar, and a major key with a flat seventh.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [168, 176],
  swing: 0.08,
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  feels: [['pocket', 5], ['funk', 4], ['straight', 3]],
  transitions: [['fill', 5], ['elide', 3], ['break', 2]],
  fills: [['rim', 4], ['snare-toms', 3], ['snare-roll', 2], ['lead-in', 2]],
  shots: [[[0, 6, 10], 4], [[0, 3, 6, 10], 3], [[0, 8], 2]],
  progressions: {
    intro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'ii9', 'ii9', 'Imaj9', 'Imaj9', 'ii9', 'ii9'], weight: 6 },
      { chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'bVII', 'bVII', 'Imaj9', 'Imaj9'], weight: 5 },
    ],
    chorus: [
      { chords: ['IVmaj9', 'IVmaj9', 'iii9', 'iii9', 'ii9', 'ii9', 'Imaj9', 'Imaj9'], weight: 5 },
      { chords: ['vi9', 'vi9', 'ii9', 'ii9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9'], weight: 4 },
    ],
    bridge: [{ chords: ['vi9', 'vi9', 'vi9', 'vi9', 'ii9', 'ii9', 'Imaj9', 'Imaj9'], weight: 5 }],
    solo: [{ chords: ['Imaj9', 'Imaj9', 'ii9', 'ii9', 'Imaj9', 'Imaj9', 'ii9', 'ii9'], weight: 5 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  minorProgressions: {
    verse: [{ chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'VII', 'VII'], weight: 6 }],
    chorus: [{ chords: ['VImaj7', 'VImaj7', 'VII', 'VII', 'i9', 'i9', 'i9', 'i9'], weight: 5 }],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-2, 2, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 8], weight: 5 },
    { cell: [3, 3, 2, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    { name: 'surdo-sub', weight: 6, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 6, tone: 0, vel: 0.86 },
    ] },
    { name: 'walking-samba', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 7, vel: 0.8 },
      { at: 14, dur: 2, tone: 10, vel: 0.7 },
      { at: 16, dur: 6, tone: 12, vel: 0.84 },
      { at: 24, dur: 4, tone: 7, vel: 0.78 },
      { at: 30, dur: 2, tone: 2, vel: 0.68 },
    ] },
    { name: 'syncopated', weight: 4, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 7, vel: 0.78 },
      { at: 10, dur: 2, tone: 0, vel: 0.82 },
      { at: 12, dur: 4, tone: 5, vel: 0.74 },
    ] },
  ],
  comp: [
    // A nylon guitar. Sixteen quiet strokes in a bar, and the two loud ones are
    // where the tamborim is.
    { name: 'nylon-chank', weight: 6, voices: 4, voicing: 'guide', hits: [
      { at: 0, dur: 1, vel: 0.16 }, { at: 2, dur: 1, vel: 0.6 },
      { at: 3, dur: 1, vel: 0.14 }, { at: 6, dur: 1, vel: 0.62 },
      { at: 8, dur: 1, vel: 0.16 }, { at: 10, dur: 1, vel: 0.58 },
      { at: 11, dur: 1, vel: 0.14 }, { at: 14, dur: 1, vel: 0.64 },
    ] },
    { name: 'bossa-figure', weight: 4, voices: 4, voicing: 'guide', cycle: 32, hits: [
      { at: 0, dur: 3, vel: 0.6 }, { at: 6, dur: 2, vel: 0.52 },
      { at: 11, dur: 3, vel: 0.56 }, { at: 16, dur: 3, vel: 0.58 },
      { at: 22, dur: 2, vel: 0.5 }, { at: 27, dur: 3, vel: 0.54 },
    ] },
    { name: 'held', weight: 3, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.36 }] },
  ],
  drums: [
    /**
     * The batucada over the two-step. The ghosts are on the tamborim rather than
     * on the snare, which nothing else in the project does — a tamborim pattern
     * is loud and quiet strokes from one hand at one subdivision, and this field
     * is per voice.
     */
    { name: 'batucada', weight: 6, cycle: 32, voices: {
      bd: [0, 10, 16, 26],
      sd: [8, 24],
      tb: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      cb: [0, 6, 12, 16, 22, 28],
      sh: [2, 6, 10, 14, 18, 22, 26, 30],
    }, ghosts: { tb: [1, 3, 5, 7, 9, 11, 13, 15], sd: [7, 23] } },
    { name: 'agogo-step', weight: 5, cycle: 32, voices: {
      bd: [0, 10, 16, 22],
      sd: [8, 24],
      cb: [0, 3, 6, 10, 16, 19, 22, 26],
      perc: [4, 12, 20, 28],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    }, ghosts: { sd: [5, 11, 21, 27] } },
    { name: 'light-samba', weight: 4, voices: {
      bd: [0, 10],
      sd: [8],
      sh: [0, 2, 4, 6, 8, 10, 12, 14],
      perc: [3, 6, 11, 14],
    }, ghosts: { sd: [7, 13] } },
  ],
  melody: { leap: 0.32, ornament: 0.3, span: 17, sequence: 0.55, syncopation: 0.66 },
};

/**
 * BREAKCORE — 1999, and the only style in this genre that changes speed.
 *
 * The amen taken past the point of usefulness: faster than anything a floor can
 * move to, cut finer than the ear can follow, with the kick doubled and tripled
 * until it is a tone. It is not a DJ tool and does not pretend to be, and that
 * one fact is the reason it is the only entry here that opts into
 * `Style.tempoRamp`.
 *
 * ## Why this style ramps and the other twenty-three do not
 *
 * **Every other record in this genre exists to be beatmatched.** A DJ holds two
 * of them against each other for ninety seconds, and a record whose tempo moves
 * cannot be held against anything — the whole functional apparatus of the music,
 * from the eight-bar intro to the sixteen-bar outro, exists so that the two
 * decks agree. That is not a stylistic preference, it is the format, and it
 * makes a genre-wide tempo ramp the wrong gesture in twenty-three tables out of
 * twenty-four.
 *
 * This one was made by people who had stopped caring about that. `accelerando`
 * at one draw in four, with `tempoRise: 1.12` — twelve per cent across the
 * length, which at 186 is a piece that ends near 208. Modest on purpose: this is
 * a curve rather than a stunt, and `planRamp` clamps anything past 2 anyway.
 *
 * ## The tempo is also why this is the one style that rolls the *kick*
 *
 * `DrumPattern.rolls` — `docs/engine-gaps.md` §3.15. Everywhere else in this
 * genre the retrigger is a snare gesture, and here it is a snare gesture too:
 * `mangled` triples its last stroke, 25 ms at 200, because that figure has a
 * snare on sixteen of its thirty-two slots and no room left to run along.
 *
 * `doubled` is the departure. Its four kick pairs were written as the nearest a
 * sixteenth grid could come to the header's own claim — *the kick doubled and
 * tripled until it is a tone* — and a `roll: 4` at 180 to 200 BPM is a
 * repetition rate of 48 to 53 Hz, which is not near a tone, it **is** one. That
 * sentence turns out to have been a measurement nobody had taken, and the reason
 * it lands in this table and no other is the twenty BPM at the top of the range
 * that only this style is allowed to have.
 *
 * **The audition plays it flat.** `generate/tempo.ts` established by reading the
 * installed package that Strudel cannot ramp at all, so a ramping song renders
 * correctly to `.mid` and comes out of the browser at a constant tempo, with a
 * banner in its own emitted source saying so. That is a real limitation of the
 * only listening surface this project has, and it is the reason exactly one
 * style here takes the field rather than five.
 */
const breakcore: Style = {
  id: 'breakcore',
  label: 'Breakcore',
  description:
    'The amen past the point of usefulness: cut finer than the ear follows, the kick doubled until it is a tone.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [180, 200],
  swing: 0.06,
  modeWeights: { minor: 0.9, major: 0.1 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  boxDrums: false,
  feels: [['funk', 5], ['driving', 4], ['straight', 3]],
  transitions: [['fill', 5], ['break', 3], ['shot', 2]],
  shots: [[[0], 5], [[0, 6, 10], 3], [[0, 3, 6, 12], 2]],
  fills: [['snare-roll', 5], ['snare-toms', 4], ['drop', 2]],
  // The one style in the genre that is not a DJ tool, and therefore the one that
  // may change speed. See the header.
  tempoRamp: [['none', 3], ['accelerando', 1]],
  tempoRise: 1.12,
  excludeLayers: ['brass'],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 7 },
      { chords: ['i', 'i', 'bII', 'bII', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'VI', 'VI', 'i', 'i', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I', 'I', 'I', 'I', 'bVI', 'bVI', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [16], weight: 5 },
    { cell: [-8, 8], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [-12, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 4 },
  ],
  bass: [
    { name: 'blunt', weight: 6, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 8, dur: 6, tone: 0, vel: 0.88 },
    ] },
    { name: 'stab-run', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.8 },
      { at: 12, dur: 4, tone: 3, vel: 0.84 },
      { at: 16, dur: 4, tone: 0, vel: 0.96 },
      { at: 24, dur: 8, tone: 10, vel: 0.8 },
    ] },
    { name: 'one-note', weight: 3, hits: [{ at: 0, dur: 14, tone: 0, vel: 1 }] },
  ],
  comp: [
    { name: 'stab', weight: 6, voices: 3, cycle: 32, hits: [
      { at: 0, dur: 3, vel: 0.6 }, { at: 16, dur: 3, vel: 0.54 },
    ] },
    { name: 'noise', weight: 4, voices: 4, hits: [
      { at: 0, dur: 4, vel: 0.66 }, { at: 8, dur: 4, vel: 0.58 },
    ] },
    { name: 'bed', weight: 2, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.28 }] },
  ],
  drums: [
    /**
     * The break with the kick doubled under every stroke. Ten ghosts, and this
     * and `drumfunk`'s `edit` are the two densest figures in the project.
     */
    { name: 'mangled', weight: 7, cycle: 32, voices: {
      bd: [0, 2, 6, 10, 12, 16, 18, 22, 26, 28],
      sd: [4, 8, 14, 20, 24, 30],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    }, ghosts: { sd: [1, 5, 7, 11, 13, 17, 19, 23, 27, 31] },
    // There is no room for a run in this figure — sixteen of the thirty-two
    // slots already carry a snare, struck or ghosted — so the subdivision goes
    // *down* instead of along. The last struck snare in the cycle, tripled, is
    // 25.0 ms at 200 and 27.8 at 180: forty strokes a second, where `trap`'s own
    // accelerando bottoms out at thirty-six ms, and this style is the only place
    // in the catalogue that number would not be an exaggeration.
    rolls: { sd: { 30: 3 } } },
    { name: 'doubled', weight: 5, cycle: 32, voices: {
      bd: [0, 1, 8, 9, 16, 17, 24, 25],
      sd: [4, 12, 20, 28],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      cr: [0, 16],
    }, ghosts: { sd: [3, 7, 11, 15, 19, 23, 27, 31] },
    // The header's sentence, made arithmetic: *the kick doubled and tripled
    // until it is a tone.* The four kick pairs were the nearest the sixteenth
    // grid could come to it and are now the frame for the real thing — the
    // second of each pair subdivides, twice in bar one and four times in bar
    // two.
    //
    // Four at this tempo is 18.8 ms at 200 and 20.8 at 180, which is a
    // **repetition rate of 48 to 53 Hz**, and that is the point rather than a
    // side effect: 53 Hz is a pitch — G♯1, an octave below the bottom line of
    // the bass clef — so bar two of this figure stops being a rhythm and becomes
    // a low buzz on the kick drum. Nowhere else in the project does a drum row
    // cross that line, and no other style here reaches 200 BPM to cross it with.
    rolls: { bd: { 1: 2, 9: 2, 17: 4, 25: 4 } } },
    { name: 'plain-amen', weight: 3, voices: {
      bd: [0, 10],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sd: [3, 5, 11, 13] } },
  ],
  melody: { leap: 0.28, ornament: 0.06, span: 12, sequence: 0.9, syncopation: 0.75 },
};

/**
 * DUBWISE — 2006, and the style that says out loud where all of this came from.
 *
 * A two-step with a spring reverb across the snare, a delay on everything else,
 * and a bassline that drops out for eight bars at a time because that is what
 * the desk is for. It is the most explicit acknowledgement in the catalogue that
 * this genre is a Jamaican sound system with a different sample library.
 *
 * **`effects` is declared at style level, and this is the one style here that
 * earns it.** `Style.effects` documents the seam: a style may overrule an era
 * only where *the treatment is the piece*, and the motivating case is reggae's
 * `dub`, which came out dry when drawn in a digital era. The same is true here —
 * a dubwise track cut in 2012 with the era's dry-and-bright numbers is not a
 * modern dubwise track, it is simply a two-step. `lowpass` is deliberately not
 * named on any key: how bright the record is stays the era's business.
 *
 * `drops: dub` at one in two, the joint-highest weight in the file. Everything
 * about the style is that edit.
 */
const dubwise: Style = {
  id: 'dubwise',
  label: 'Dubwise',
  description:
    'A two-step with a spring reverb on the snare, delay on the rest, and a bass that leaves whenever the desk says so.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [164, 172],
  swing: 0.09,
  modeWeights: { minor: 0.85, major: 0.15 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['pocket', 5], ['laidback', 4], ['straight', 3]],
  transitions: [['break', 5], ['fill', 3], ['elide', 2]],
  shots: [[[0, 8], 4], [[0], 4], [[0, 6, 10], 2]],
  drops: [['none', 1], ['dub', 1]],
  dropBars: 8,
  /**
   * The treatment is the piece. See the header, and `Style.effects` for the
   * argument about why a style outranks the era it is drawn in — this table and
   * reggae's `dub` are the only two places in the project where that order
   * matters at all.
   */
  effects: {
    drums: { reverb: 0.34, delay: 0.28 },
    comp: { reverb: 0.5, delay: 0.55 },
    melody: { reverb: 0.5, delay: 0.5 },
  },
  excludeLayers: ['brass'],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 },
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 5 },
    ],
    chorus: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['iv', 'iv', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'VI', 'VI', 'i', 'i', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['IV', 'IV', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-8, 8], weight: 6 },
    { cell: [16], weight: 5 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 4 },
  ],
  bass: [
    { name: 'dub-riff', weight: 6, cycle: 32, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 0, vel: 0.8 },
      { at: 16, dur: 6, tone: 10, vel: 0.88 },
      { at: 24, dur: 6, tone: 7, vel: 0.8 },
    ] },
    { name: 'held-dub', weight: 5, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 14, dur: 2, tone: 0, vel: 0.62 },
    ] },
    { name: 'stepping', weight: 3, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 3, vel: 0.76 },
      { at: 10, dur: 6, tone: 0, vel: 0.82 },
    ] },
  ],
  comp: [
    { name: 'skank-echo', weight: 6, voices: 3, hits: [
      { at: 4, dur: 2, vel: 0.68 }, { at: 12, dur: 2, vel: 0.6 },
    ] },
    { name: 'one-chord', weight: 4, voices: 4, cycle: 32, hits: [
      { at: 0, dur: 6, vel: 0.62 },
    ] },
    { name: 'wash', weight: 3, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.36 }] },
  ],
  drums: [
    { name: 'dub-step', weight: 6, cycle: 32, voices: {
      bd: [0, 10, 16, 26],
      sd: [8, 24],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      rim: [12, 28],
    }, ghosts: { sd: [7, 11, 23, 27] } },
    { name: 'rockers', weight: 5, cycle: 32, voices: {
      bd: [0, 8, 16, 24],
      sd: [8, 24],
      hh: [2, 6, 10, 14, 18, 22, 26, 30],
      perc: [4, 20],
    }, ghosts: { sd: [11, 27] } },
    { name: 'one-drop', weight: 3, voices: {
      bd: [8],
      sd: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      rim: [4, 12],
    }, ghosts: { sd: [7, 11] } },
  ],
  melody: { leap: 0.24, ornament: 0.18, span: 13, sequence: 0.82, syncopation: 0.66 },
};

/**
 * DEEP — 2008, and the quietest thing here.
 *
 * A sub, a pad, a two-step at half the usual volume and about nine notes in
 * total. It is what the genre does when it stops trying to be an event, and it
 * is the closest this catalogue gets to the ambient end of the project — the pad
 * is required, the melody is one note a bar, and `drops: breakdown` takes away
 * an arrangement that was barely there in the first place.
 *
 * That last point is worth stating rather than treating as a contradiction. A
 * breakdown in a style this thin is not less audible, it is *more*: when the
 * only two things carrying weight are the kit and the sub, removing both leaves
 * a pad in an empty room, and there is nothing else in the mix to cover the
 * hole. `dancefloor` gets the same edit and it lands differently, because there
 * the hole is filled by everything else queuing up.
 */
const deep: Style = {
  id: 'deep',
  label: 'Deep',
  description:
    'A sub, a pad, a two-step at half volume and about nine notes: the genre when it stops trying to be an event.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [166, 174],
  swing: 0.07,
  modeWeights: { minor: 0.85, major: 0.15 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  requireLayers: ['pad'],
  feels: [['laidback', 6], ['pocket', 3], ['straight', 2]],
  transitions: [['elide', 5], ['fill', 3], ['break', 2]],
  breakCarrier: 'pad',
  fills: [['lead-in', 4], ['snare-roll', 2], ['drop', 2]],
  shots: [[[0], 6], [[0, 8], 2]],
  drops: [['none', 2], ['breakdown', 1]],
  dropBars: 8,
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
    verse: [
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 6 },
      { chords: ['i11', 'i11', 'i11', 'i11', 'VImaj7', 'VImaj7', 'VImaj7', 'VImaj7'], weight: 5 },
    ],
    chorus: [
      { chords: ['VImaj7', 'VImaj7', 'VImaj7', 'VImaj7', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9', 'i9', 'i9'], weight: 4 },
    ],
    bridge: [{ chords: ['VImaj7', 'VImaj7', 'VImaj7', 'VImaj7', 'i9', 'i9', 'i9', 'i9'], weight: 5 }],
    solo: [{ chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 5 }],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9'], weight: 6 }],
    chorus: [{ chords: ['IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'vi9', 'vi9', 'Imaj9', 'Imaj9'], weight: 5 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 5 },
    { cell: [-12, 4], weight: 4 },
    { cell: [8, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 8 },
    { cell: [-8, 8], weight: 2 },
  ],
  bass: [
    { name: 'one-note', weight: 7, hits: [{ at: 0, dur: 14, tone: 0, vel: 1 }] },
    { name: 'two-bar', weight: 5, cycle: 32, sustain: true, hits: [
      { at: 0, dur: 16, tone: 0, vel: 1 },
      { at: 16, dur: 12, tone: 7, vel: 0.82 },
    ] },
    { name: 'moved', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 16, dur: 10, tone: 3, vel: 0.8 },
    ] },
  ],
  comp: [
    { name: 'wash', weight: 7, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.38 }] },
    { name: 'quartal', weight: 4, voices: 4, voicing: 'quartal', cycle: 32, hits: [
      { at: 0, dur: 8, vel: 0.44 }, { at: 16, dur: 8, vel: 0.4 },
    ] },
    { name: 'one-stab', weight: 3, voices: 3, cycle: 32, hits: [{ at: 0, dur: 4, vel: 0.46 }] },
  ],
  drums: [
    { name: 'quiet-step', weight: 7, cycle: 32, voices: {
      bd: [0, 10, 16, 26],
      sd: [8, 24],
      hh: [2, 6, 10, 14, 18, 22, 26, 30],
    }, ghosts: { sd: [7, 23] } },
    { name: 'brushed', weight: 5, cycle: 32, voices: {
      bd: [0, 12, 16, 22],
      sd: [8, 24],
      sh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    }, ghosts: { sd: [5, 11, 21, 27] } },
    { name: 'bare', weight: 4, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [0, 4, 8, 12],
    } },
  ],
  melody: { leap: 0.18, ornament: 0.2, span: 12, sequence: 0.7, syncopation: 0.45 },
};

/**
 * AUTONOMIC — 2010, and the first style here that is not danced to.
 *
 * A halftime skeleton at 162, a dub-techno chord with a delay on it, and a sub
 * that arrives about once every two bars. It is where the genre met the German
 * end of the twelve-inch, and the tables show that meeting in one number:
 * `melody.leap` is 0.16, the lowest here, because the melodic content is a
 * filtered chord being nudged rather than a line.
 *
 * The drums are programmed and there are no ghosts, but the reason differs from
 * techstep's and is worth separating. There the kit is one-shots because the
 * producers wanted them to hit harder; here it is because the kit is *quiet* —
 * a chain of two or three samples with the transient shaved off, so that
 * whatever is in the reverb is the loudest thing in the bar.
 */
const autonomic: Style = {
  id: 'autonomic',
  label: 'Autonomic',
  description:
    'A halftime skeleton at 162, a dub-techno chord with a delay on it, and a sub that arrives every second bar.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [162, 170],
  swing: 0,
  modeWeights: { minor: 0.88, major: 0.12 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['halftime', 5], ['laidback', 4], ['straight', 3]],
  transitions: [['elide', 5], ['fill', 2], ['break', 3]],
  breakCarrier: 'pad',
  fills: [['lead-in', 4], ['drop', 3]],
  shots: [[[0], 6]],
  excludeLayers: ['brass'],
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
    verse: [
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 7 },
      { chords: ['i11', 'i11', 'i11', 'i11', 'i11', 'i11', 'i11', 'i11'], weight: 4 },
    ],
    chorus: [
      { chords: ['i9', 'i9', 'i9', 'i9', 'VImaj7', 'VImaj7', 'VImaj7', 'VImaj7'], weight: 5 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 4 },
    ],
    bridge: [{ chords: ['VImaj7', 'VImaj7', 'VImaj7', 'VImaj7', 'i9', 'i9', 'i9', 'i9'], weight: 5 }],
    solo: [{ chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 5 }],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 6 }],
    chorus: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9'], weight: 5 }],
    outro: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 5 },
    { cell: [-12, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 8 },
    { cell: [-8, 8], weight: 2 },
  ],
  bass: [
    { name: 'every-other-bar', weight: 7, cycle: 32, sustain: true, hits: [
      { at: 0, dur: 26, tone: 0, vel: 1 },
    ] },
    { name: 'pulsed', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 8, tone: 0, vel: 1 },
      { at: 16, dur: 8, tone: 0, vel: 0.84 },
    ] },
    { name: 'moved', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 14, tone: 0, vel: 1 },
      { at: 20, dur: 12, tone: 10, vel: 0.78 },
    ] },
    /**
     * The sub that walks down. Root, flat seventh, fifth across two bars — a
     * line rather than a pedal, and the thing this table had no row for: its
     * top-weighted figure is one note at the head of the cycle, which no
     * signature can reach into, and ten songs off it came out identical.
     */
    { name: 'stepping-sub', weight: 4, cycle: 32, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 14, dur: 8, tone: 10, vel: 0.82 },
      { at: 24, dur: 8, tone: 7, vel: 0.86 },
    ] },
    /**
     * One note that falls a fourth halfway through, the way an autonomic sub
     * does when the second bar is supposed to feel like a different room.
     */
    { name: 'reese-drop', weight: 3, cycle: 32, sustain: true, hits: [
      { at: 0, dur: 26, tone: 0, glide: -5, glideTime: 0.5, vel: 1 },
    ] },
  ],
  comp: [
    // The dub-techno chord: struck on the offbeat, left to the delay, and never
    // struck twice in the same bar.
    { name: 'delayed-chord', weight: 7, voices: 4, cycle: 32, hits: [
      { at: 6, dur: 3, vel: 0.52 }, { at: 22, dur: 3, vel: 0.46 },
    ] },
    { name: 'held-pad', weight: 4, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.36 }] },
    { name: 'quartal-stab', weight: 3, voices: 4, voicing: 'quartal', cycle: 32, hits: [
      { at: 0, dur: 4, vel: 0.44 },
    ] },
  ],
  drums: [
    { name: 'halftime-skeleton', weight: 7, cycle: 32, voices: {
      bd: [0, 20],
      sd: [16],
      hh: [0, 4, 8, 12, 16, 20, 24, 28],
      rim: [8, 24],
    } },
    { name: 'shuffled-skeleton', weight: 5, cycle: 32, voices: {
      bd: [0, 22],
      sd: [16],
      hh: [2, 6, 10, 14, 18, 22, 26, 30],
      perc: [12, 28],
    } },
    { name: 'two-step-quiet', weight: 3, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [2, 6, 10, 14],
    } },
  ],
  melody: { leap: 0.16, ornament: 0.14, span: 11, sequence: 0.85, syncopation: 0.4 },
};

/**
 * HALFTIME — 2014, and the style that borrows a hi-hat from the genre next door.
 *
 * The bar is still 172 and the hats still run at 172; the kick and the snare
 * move to half that, so the record is a trap beat with a drum and bass hat
 * pattern over it. **`beatsPerBar` stays 4**, deliberately, and the file header
 * says why: writing it as a slower metre would halve the hat resolution, and the
 * hat is the only thing in the arrangement keeping the original tempo.
 *
 * `cycle: 12` on the hi-hat is the one figure this catalogue takes wholesale
 * from hiphop — a dotted-eighth chain against a four-beat bar, arriving on a
 * different sixteenth every bar and coming home every three. `hiphop/drill` says
 * the same thing about the same number, and it is inexpressible any other way.
 *
 * **And it is the reason this style writes no `DrumPattern.rolls`**, which is
 * the refusal a reader arrives here expecting not to find. `hiphop/drill`'s
 * `dotted-drill` is the same `cycle: 12` chain and refused a roll on the ground
 * that a retrigger inside a dotted-eighth figure is a second cross-rhythm asking
 * to be counted alongside the first, and the ear resolves that by hearing
 * neither. That argument is not weakened by being made in another genre. The
 * plain sixteenth hat in `halftime-trap` beside it could take one, and taking it
 * would be importing `trap-kit` under a different style name — which is the one
 * thing three styles of this genre spent a pass proving it did not have to do.
 * See `dnb/index.ts` for the three that adopted and the reasons the other
 * twenty-one did not.
 *
 * **No `drops`, and the refusal is the interesting one.** A halftime record
 * genuinely does drop the kit and the sub for a phrase — but its section is
 * already half-speed, so eight bars is twenty-two seconds of held pad, which is
 * an interlude rather than a breakdown. Four bars would be right and this style
 * shares the genre's eight-bar phrase everywhere else, so writing `dropBars: 4`
 * here would say *this style's phrases are shorter*, which is false. It is the
 * only style in the file where the gesture is available, wanted, and the wrong
 * length in both settings on offer.
 */
const halftime: Style = {
  id: 'halftime',
  label: 'Halftime',
  description:
    'The hats stay at 172 and the kick and snare move to half of it: a trap beat with a drum and bass hi-hat over it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [168, 176],
  swing: 0,
  modeWeights: { minor: 0.92, major: 0.08 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['halftime', 6], ['straight', 3], ['laidback', 2]],
  transitions: [['break', 4], ['fill', 3], ['shot', 3]],
  shots: [[[0, 8], 5], [[0], 4]],
  fills: [['drop', 5], ['snare-roll', 3], ['lead-in', 2]],
  excludeLayers: ['brass'],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 7 },
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'VI', 'VI', 'i', 'i', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I', 'I', 'I', 'I', 'bVI', 'bVI', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [-12, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 3 },
  ],
  bass: [
    { name: 'half-sub', weight: 7, cycle: 32, hits: [
      { at: 0, dur: 14, tone: 0, vel: 1 },
      { at: 16, dur: 10, tone: 0, vel: 0.86 },
    ] },
    { name: 'sliding', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 16, dur: 6, tone: 3, vel: 0.84 },
      { at: 24, dur: 8, tone: 0, vel: 0.8 },
    ] },
    { name: 'punched', weight: 3, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 6, tone: 0, vel: 0.84 },
    ] },
  ],
  comp: [
    { name: 'one-stab', weight: 6, voices: 3, cycle: 32, hits: [{ at: 0, dur: 4, vel: 0.54 }] },
    { name: 'bell-figure', weight: 5, voices: 3, arpeggio: true, arpDirection: 'downup',
      arpOctaves: 2, cycle: 12, hits: [
        { at: 0, dur: 2, vel: 0.5 }, { at: 3, dur: 2, vel: 0.42 },
        { at: 6, dur: 2, vel: 0.46 }, { at: 9, dur: 2, vel: 0.4 },
      ] },
    { name: 'bed', weight: 3, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.3 }] },
  ],
  drums: [
    /**
     * The kick and snare at half speed and the hat at full. `cycle: 12` on the
     * hat is the dotted-eighth chain, which is the one figure this catalogue
     * borrows outright from hiphop and the only shape in the two-genre family
     * that the sixteenth grid can address.
     */
    { name: 'halftime-trap', weight: 7, cycle: 32, voices: {
      bd: [0, 22],
      sd: [16],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    } },
    { name: 'dotted-hat', weight: 6, cycle: 12, voices: {
      hh: [0, 3, 6, 9],
    } },
    { name: 'halftime-open', weight: 5, cycle: 32, voices: {
      bd: [0, 20, 26],
      sd: [16],
      hh: [0, 4, 8, 12, 16, 20, 24, 28],
      oh: [14, 30],
      cp: [16],
    } },
  ],
  melody: { leap: 0.24, ornament: 0.06, span: 12, sequence: 0.9, syncopation: 0.55 },
};

/**
 * MINIMAL — 2012, and the emptiest table in the project outside ambient.
 *
 * Two sounds. A kick-and-snare skeleton with the hats removed, and one bass note
 * every two bars. `excludeLayers` takes the pad and the brass out entirely,
 * which no other style here does, and the comp table's busiest row has one hit
 * in it.
 *
 * The reason this is a style rather than a mood is that the emptiness is
 * *structural*: what a listener is following is the room the kick is in and the
 * length of the sub's decay, and both are properties of two events rather than
 * of an arrangement. Adding anything at all makes it a different style, which is
 * why the tables refuse to.
 *
 * No `drops`. There is nothing to take away — `breakdown` removes the kit and
 * the bass, and in this style those are the entire record; the shape would leave
 * eight bars of nothing, which is not a gesture, it is a fault.
 */
const minimal: Style = {
  id: 'minimal',
  label: 'Minimal',
  description:
    'Two sounds: a kick-and-snare skeleton with the hats taken off, and one bass note every second bar.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [168, 176],
  swing: 0,
  modeWeights: { minor: 0.9, major: 0.1 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  excludeLayers: ['pad', 'brass'],
  feels: [['straight', 8], ['halftime', 2]],
  transitions: [['elide', 5], ['break', 3], ['fill', 2]],
  fills: [['lead-in', 4], ['drop', 3]],
  shots: [[[0], 6]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 8, note: 'One chord, and the style would happily have had none' }],
    chorus: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 8 }],
    bridge: [{ chords: ['VI', 'VI', 'VI', 'VI', 'i', 'i', 'i', 'i'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [16], weight: 8 },
    { cell: [-8, 8], weight: 4 },
    { cell: [-12, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 9 },
    { cell: [-8, 8], weight: 2 },
  ],
  bass: [
    /**
     * One note every two bars, and it rings for twenty-six sixteenths of the
     * thirty-two. The length is not decoration: a sub with a short decay in a
     * style with nothing else in it leaves the second bar completely empty, and
     * `npm run genres` catches that as *"a break leaves someone playing"* the
     * moment a seam lands there.
     */
    { name: 'one-every-two', weight: 8, cycle: 32, sustain: true, hits: [
      { at: 0, dur: 26, tone: 0, vel: 1 },
    ] },
    { name: 'two-notes', weight: 4, cycle: 32, hits: [
      { at: 0, dur: 14, tone: 0, vel: 1 },
      { at: 20, dur: 12, tone: 0, vel: 0.8 },
    ] },
    /**
     * The Reese: one note that leaves.
     *
     * Both rows above sit on the root and neither moves, and with a cycled
     * figure whose only onset is the head of the cycle there is nothing for a
     * signature to reach for either — measured, **every pair of ten songs off
     * this table played the identical bass line**, the worst score in the
     * catalogue. This is the row that gives the style a second idea, and it is
     * the right one: what a minimal track has instead of a bassline is a sub
     * that bends, and `glide` was added for exactly this.
     *
     * A fifth down over the first two thirds of the note, so it arrives and
     * settles rather than sliding for the whole two bars.
     */
    { name: 'reese-fall', weight: 4, cycle: 32, sustain: true, hits: [
      { at: 0, dur: 26, tone: 0, glide: -7, glideTime: 0.66, vel: 1 },
    ] },
    /**
     * Three notes in two bars, the last one arriving early enough to pull the
     * cycle round. The one row here with a rhythm in it.
     */
    { name: 'late-answer', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 16, dur: 6, tone: 10, vel: 0.82 },
      { at: 26, dur: 6, tone: 0, vel: 0.86 },
    ] },
  ],
  comp: [
    { name: 'one-hit', weight: 8, voices: 3, cycle: 32, hits: [{ at: 0, dur: 3, vel: 0.44 }] },
    { name: 'nothing-at-all', weight: 4, voices: 3, cycle: 32, hits: [{ at: 16, dur: 2, vel: 0.36 }] },
  ],
  drums: [
    { name: 'skeleton', weight: 8, cycle: 32, voices: {
      bd: [0, 10, 16, 26],
      sd: [8, 24],
    } },
    { name: 'skeleton-plus', weight: 5, cycle: 32, voices: {
      bd: [0, 10, 16, 22],
      sd: [8, 24],
      rim: [14, 30],
    } },
    { name: 'skeleton-hat', weight: 3, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [4, 12],
    } },
  ],
  melody: { leap: 0.2, ornament: 0.04, span: 10, sequence: 0.94, syncopation: 0.45 },
};

/**
 * REVIVAL — 2018, and the amen coming back with twenty-five years of mixing
 * behind it.
 *
 * Structurally it is `jungle`; the difference is that everything has been
 * recorded properly. The break is the same break, chopped by somebody who grew
 * up on the records rather than by somebody inventing the technique, and the sub
 * underneath it is a modern one — clean, loud, and sitting an octave lower than
 * a 1994 sampler could reach.
 *
 * It ghosts, and it is the last style in the file to do so; between it and
 * `rollers` there are fourteen years in which nothing in this genre sampled a
 * drummer. That gap is the whole reason this style exists as a separate table
 * rather than as a weight on `jungle` — a revival is a *quotation*, and a
 * quotation is not the same object as the thing it quotes.
 *
 * No `drops`. `jungle` has the dub and this is its restatement; putting the same
 * edit on both would be the mannerism `docs/engine-gaps.md` §7 warns about when
 * it says spraying a shape across the adjacent styles is exactly what not to do.
 */
const revival: Style = {
  id: 'revival',
  label: 'Revival',
  description:
    'The same break chopped by somebody who grew up on the records, over a sub an octave below what a 1994 sampler reached.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [168, 176],
  swing: 0.09,
  modeWeights: { minor: 0.86, major: 0.14 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  feels: [['funk', 5], ['pocket', 4], ['straight', 3]],
  transitions: [['fill', 4], ['break', 4], ['elide', 2]],
  shots: [[[0, 8], 4], [[0], 4], [[0, 6, 10], 2]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'VImaj7', 'VImaj7', 'VImaj7', 'VImaj7'], weight: 4 },
    ],
    chorus: [
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VImaj7', 'VImaj7', 'VImaj7', 'VImaj7', 'i9', 'i9', 'i9', 'i9'], weight: 5 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [-8, 8], weight: 5 },
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 3 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 4 },
  ],
  bass: [
    { name: 'modern-sub', weight: 7, cycle: 32, hits: [
      { at: 0, dur: 14, tone: 0, vel: 1 },
      { at: 16, dur: 12, tone: 0, vel: 0.9 },
    ] },
    { name: 'answered-sub', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 16, dur: 8, tone: 5, vel: 0.86 },
      { at: 26, dur: 6, tone: 0, vel: 0.8 },
    ] },
    { name: 'held', weight: 3, hits: [{ at: 0, dur: 14, tone: 0, vel: 1 }] },
    /**
     * Three notes, and the middle one is the flat seventh a bar in — the two-bar
     * sub that goes somewhere, which is what separates a revival track from the
     * loop it is reviving.
     */
    { name: 'walking-sub', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 12, tone: 0, vel: 1 },
      { at: 16, dur: 8, tone: 10, vel: 0.86 },
      { at: 26, dur: 6, tone: 7, vel: 0.82 },
    ] },
    /**
     * The Reese, falling a fifth across the pair of bars. One note, and the
     * whole of its interest is that it does not stay where it started.
     */
    { name: 'reese', weight: 4, cycle: 32, sustain: true, hits: [
      { at: 0, dur: 28, tone: 0, glide: -7, glideTime: 0.7, vel: 1 },
    ] },
  ],
  comp: [
    { name: 'stab', weight: 6, voices: 3, cycle: 32, hits: [
      { at: 0, dur: 4, vel: 0.62 }, { at: 20, dur: 4, vel: 0.52 },
    ] },
    { name: 'chord-pair', weight: 4, voices: 4, voicing: 'guide', hits: [
      { at: 0, dur: 6, vel: 0.56 }, { at: 8, dur: 4, vel: 0.5 },
    ] },
    { name: 'wash', weight: 3, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.34 }] },
  ],
  drums: [
    { name: 'clean-chop', weight: 7, cycle: 32, voices: {
      bd: [0, 10, 16, 22],
      sd: [8, 24, 30],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    }, ghosts: { sd: [3, 7, 9, 13, 19, 23, 27] } },
    { name: 'roll-out', weight: 5, cycle: 32, voices: {
      bd: [0, 12, 16, 26],
      sd: [8, 24],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      oh: [6, 22],
    }, ghosts: { sd: [5, 11, 21, 27] } },
    { name: 'plain', weight: 3, voices: {
      bd: [0, 10],
      sd: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sd: [7, 9] } },
  ],
  melody: { leap: 0.26, ornament: 0.16, span: 13, sequence: 0.84, syncopation: 0.68 },
};

export const STYLES: Record<string, Style> = {
  bleep, hardcore, darkcore, jungle, ragga, hardstep,
  jazzstep, atmospheric, intelligent, drumfunk,
  techstep, neurofunk, liquid, rollers,
  jumpup, dancefloor, sambass,
  breakcore, dubwise, deep, autonomic, halftime, minimal, revival,
};
