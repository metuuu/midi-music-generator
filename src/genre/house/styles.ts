/**
 * House and techno styles, 1986 to 2007. Twenty-four of them.
 *
 * Organised by **what the record is for**, which is the only axis that
 * distinguishes these from each other and from their neighbours. Synth's file
 * says it is organised by what the machine is doing, and that is right for a
 * repertoire of composed pieces played on equipment; it is useless here, because
 * from 1988 to 2006 the machine is doing the identical thing in all twenty-four
 * — a kick on every beat, a bass under it, a chord or a stab over it, and a hat
 * pattern. Ask instead what the record is *for* and the twenty-four fall apart
 * immediately: to make four hundred people in a disused factory jack, to be
 * played third in a warm-up set, to arrive at a breakdown at 1:40 in front of ten
 * thousand people, to sit under a conversation at six in the morning.
 *
 * ## Four things every table here does, and why
 *
 * **`relativeMajorChorus` is 0 in all twenty-four.** Nothing lifts. `eras.ts`
 * argues the same claim for `keyChangeChance` and this is its style-level half:
 * the record is going to be mixed into and out of by somebody who beat-matched
 * and pitch-matched it, and a key change is the one event that makes that
 * impossible. It is the only field in this file with the same value everywhere,
 * and that uniformity is the genre statement.
 *
 * **The verse progression is very often one numeral eight times.** Twenty of
 * funk's twenty-two styles do this and its header calls it the fact that made the
 * genre necessary; here it is nineteen of twenty-four, and the reasoning is not
 * quite funk's. A JB side is one chord because the band is playing a *groove* and
 * a chord change would interrupt it. A techno record is one chord because the
 * record is a *loop somebody else is going to play another loop over*, and a
 * harmonic move is a commitment the second record has to agree with.
 *
 * **Ghost notes are on the hi-hat, not the snare**, which is the opposite of
 * every other genre that uses them. `DrumPattern.ghosts` was built for a
 * breakbeat — the quiet snare strokes between the loud ones — and 20 of rnb's
 * patterns and 13 of hip-hop's styles write it that way. Here it is a fact about
 * a specific machine: a TR-909 has one **accent** switch per step, so a hat
 * pattern is literally a row of loud steps and quiet steps, and the sixteenths
 * between the eighths are the quiet ones. That is not a drummer's touch being
 * modelled, it is a toggle being read, and it is the single clearest thing that
 * separates a programmed hat pattern from a played one.
 *
 * **Nothing swings the eighth, and three styles want to swing the sixteenth.**
 * `Style.swing` is documented as the shuffle between the two halves of a *beat*,
 * and `docs/engine-gaps.md` §3.18 records rnb hitting this with new jack swing
 * and writing 0.16 as "the nearest honest object". `ukgarage` is the same
 * complaint at four times the magnitude — 2-step is a sixteenth shuffle and it is
 * most of what the style *is* — and `microhouse` and `garage` are two more
 * independent finders. Every swing figure in this file is that approximation and
 * none of them is the thing.
 *
 * ## Where the tables get their harmony from
 *
 * Almost all of it is aeolian or dorian on a minor tonic, with `i7`, `i9` and
 * `min11` doing the work that a plain triad does elsewhere. That is not
 * decoration: the seventh and the ninth are in the *chord voicing itself* in this
 * music, because the sound being copied is a Rhodes or a Juno pad held down with
 * five fingers, and a bare minor triad on either reads as an error rather than as
 * austerity. `index.ts` argues what that does and does not mean for the scale
 * rule, and the short version is that it does not read the chord: the tune is a
 * five-note riff dragged over the loop, and only `deep` departs.
 */

import type { Style } from '../../style/types.js';
import { makeScale } from '../../core/scale.js';

/**
 * CHICAGO HOUSE — 1986. A drum machine in a room.
 *
 * The first one, and the one everything else in this file descends from. A
 * TR-909 or a second-hand 808, a bass line played with one finger on a DX100, a
 * chord held down on a borrowed Juno, and a record pressed in a run of five
 * hundred because the shop on the corner would take fifty.
 *
 * **What makes this a style rather than the genre's default is what it does not
 * have.** There is no breakdown in it — that is a later decade's gesture and
 * `trance` is where it lives — no filter sweep worth the name, no sampled loop,
 * and nothing that could not be done by a person with three boxes and a mixer.
 * The energy is entirely in the *jack*: the offbeat open hat pulling against the
 * kick, and a clap that is very slightly late. So the tables are the sparsest in
 * the file after `minimal`'s, and the style earns its place by being what
 * everything else is a departure from.
 *
 * `hook: 'earworm'` and `melody.span: 8` — the narrowest here. The "tune" on a
 * Chicago record is four notes on an organ, played the same way for six minutes,
 * and a generator producing a melody with a shape would be producing a different
 * record.
 */
const chicago: Style = {
  id: 'chicago',
  label: 'Chicago house (1986)',
  description:
    'A 909, a one-finger bass line and a chord on a borrowed Juno. Four on the floor, an offbeat open hat, and nothing else in the room.',
  beatsPerBar: 4,
  beatUnit: 4,
  // Barely anything, and it is a machine's swing rather than a hand's — the
  // shuffle control on a 909 goes up in fixed steps and this is one of them.
  swing: 0.06,
  bpm: [118, 126],
  hook: 'earworm',
  /**
   * No brass layer. See `index.ts` — the "stab" in most of this music is a
   * *chord*, which is the comp layer; the brass layer is a horn section
   * punctuating around a tune, and twelve of these twenty-four styles have no
   * object shaped like one.
   */
  excludeLayers: ['brass'],
  modeWeights: { minor: 0.82, major: 0.18 },
  relativeMajorChorus: 0,
  transitions: [['fill', 4], ['break', 3]],
  drops: [['none', 3], ['dub', 1]],
  progressions: {
    intro: [
      { chords: ['i7', 'i7', 'i7', 'i7'], weight: 6 },
      { chords: ['i7', 'i7', 'VI', 'VI'], weight: 3 },
    ],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 7, note: 'One chord for the whole eight bars. The record is a loop and a chord change is a commitment the next record would have to agree with' },
      { chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'iv7', 'iv7'], weight: 5 },
      { chords: ['i9', 'i9', 'VII', 'VII', 'i9', 'i9', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'VII', 'VII'], weight: 6 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i7', 'i7', 'i7', 'i7'], weight: 5 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 4 },
    ],
    bridge: [
      { chords: ['iv7', 'iv7', 'iv7', 'iv7', 'VII', 'VII', 'VII', 'VII'], weight: 4 },
      { chords: ['VI', 'VI', 'VI', 'VI', 'VII', 'VII', 'VII', 'VII'], weight: 3 },
    ],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7'], weight: 6 },
      { chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7'], weight: 4 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'V7', 'V7'], weight: 5 },
      { chords: ['Imaj7', 'Imaj7', 'vi7', 'vi7', 'IVmaj7', 'IVmaj7', 'IVmaj7', 'IVmaj7'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [16], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-2, 2, 4, 8], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    /**
     * The offbeat root: nothing on the beat, everything between the kicks.
     *
     * The defining bass figure of the idiom and the one most worth getting right.
     * A kick occupies all four beats, so a bass note on the beat is inside the
     * kick's own envelope and is heard as part of it — the note has to be *in the
     * gaps* to be a bass line at all. Every other genre in this project writes a
     * bass that states the downbeat; this one structurally cannot.
     */
    { name: 'offbeat-root', weight: 7, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.9 }, { at: 6, dur: 2, tone: 'root', vel: 0.82 },
      { at: 10, dur: 2, tone: 'root', vel: 0.88 }, { at: 14, dur: 2, tone: 'root', vel: 0.8 },
    ] },
    { name: 'octave-offbeat', weight: 5, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.9 }, { at: 6, dur: 2, tone: 'octave', vel: 0.74 },
      { at: 10, dur: 2, tone: 'root', vel: 0.88 }, { at: 14, dur: 2, tone: 'fifth', vel: 0.76 },
    ] },
    { name: 'one-finger', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 }, { at: 6, dur: 2, tone: 'root', vel: 0.78 },
      { at: 8, dur: 3, tone: 'seventh', vel: 0.84 }, { at: 14, dur: 2, tone: 'root', vel: 0.76 },
    ] },
  ],
  comp: [
    /**
     * The offbeat chord — an organ or a Juno held for an eighth, four times a
     * bar, in the same gaps the bass is in.
     *
     * **This is where the sidechain lives, and it is a figure rather than a
     * process.** `Effects` has no envelope follower, so the pumping duck that
     * defines this music cannot be *stated*; what can be stated is the shape it
     * produces, which is a chord that is quiet just after a kick and loudest just
     * before the next one. The velocities below are that shape written down. See
     * `index.ts` for what it costs, which is that the pad — the layer where the
     * duck matters most — has no onsets to put it on.
     */
    { name: 'offbeat-stab', weight: 7, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.62 }, { at: 6, dur: 2, vel: 0.72 },
      { at: 10, dur: 2, vel: 0.66 }, { at: 14, dur: 2, vel: 0.8 },
    ] },
    { name: 'pumped-sixteenths', weight: 5, voices: 3, hits: [
      { at: 2, dur: 1, vel: 0.5 }, { at: 3, dur: 1, vel: 0.78 },
      { at: 6, dur: 1, vel: 0.5 }, { at: 7, dur: 1, vel: 0.8 },
      { at: 10, dur: 1, vel: 0.52 }, { at: 11, dur: 1, vel: 0.78 },
      { at: 14, dur: 1, vel: 0.54 }, { at: 15, dur: 1, vel: 0.86 },
    ] },
    { name: 'held-organ', weight: 3, voices: 4, hits: [
      { at: 2, dur: 6, vel: 0.7 }, { at: 10, dur: 6, vel: 0.66 },
    ] },
  ],
  drums: [
    /**
     * The 909, as programmed.
     *
     * `ghosts` on the hi-hat is the accent switch — see the file header. The loud
     * steps are the eighths and the quiet ones are the sixteenths between them,
     * which is a row of toggles rather than a hand.
     */
    { name: '909-four', weight: 7, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], oh: [2, 6, 10, 14],
      hh: [0, 4, 8, 12],
    }, ghosts: { hh: [1, 3, 5, 7, 9, 11, 13, 15] } },
    { name: 'clap-and-rim', weight: 5, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], rim: [7, 15], hh: [2, 6, 10, 14],
    }, ghosts: { hh: [0, 4, 8, 12] } },
    { name: 'sixteenth-hats', weight: 4, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], sd: [12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14], oh: [14],
    }, ghosts: { hh: [1, 3, 5, 7, 9, 11, 13, 15] } },
  ],
  melody: { leap: 0.24, ornament: 0.06, span: 8, sequence: 0.82, syncopation: 0.4 },
};

/**
 * JACKIN' HOUSE — 1988. The same record with the hats doubled.
 *
 * The variant that is worth a style rather than a pattern, and the reason is one
 * number: `swing`. A jack track is Chicago house with the sixteenth hats on and
 * the shuffle control turned up until the pattern limps — that limp is the whole
 * point, it is what "jack" names, and it is a *rhythmic* claim that no chord
 * table or instrument palette can make.
 *
 * The other half is the vocal, which is a shouted instruction rather than a sung
 * line — see `titles.ts`, where this style is one of the seven that make the
 * generator shout. `melody.span: 7` is the narrowest in the file and it is
 * deliberate: the "tune" here is four notes of somebody telling a room what to
 * do, and a melody with more range in it has stopped being that.
 */
const jackin: Style = {
  id: 'jackin',
  label: "Jackin' house (1988)",
  description:
    'Sixteenth hats, a shuffle turned up until the pattern limps, and somebody telling the room what to do over the top.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.14,
  bpm: [120, 128],
  hook: 'earworm',
  excludeLayers: ['brass'],
  modeWeights: { minor: 0.78, major: 0.22 },
  relativeMajorChorus: 0,
  transitions: [['fill', 5], ['break', 2]],
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 7 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'VII', 'VII', 'VII', 'VII'], weight: 4 },
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9'], weight: 4 },
    ],
    chorus: [
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'VII', 'VII', 'i7', 'i7'], weight: 6 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'iv7', 'iv7', 'i7', 'i7', 'i7', 'i7'], weight: 4 }],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7'], weight: 6 }],
    chorus: [{ chords: ['I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'V7'], weight: 5 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [-2, 2, 2, 2, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [16], weight: 4 },
  ],
  bass: [
    { name: 'offbeat-root', weight: 6, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.9 }, { at: 6, dur: 2, tone: 'root', vel: 0.82 },
      { at: 10, dur: 2, tone: 'root', vel: 0.88 }, { at: 14, dur: 2, tone: 'root', vel: 0.82 },
    ] },
    { name: 'walk-up-offbeat', weight: 5, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.9 }, { at: 6, dur: 2, tone: 'third', vel: 0.76 },
      { at: 10, dur: 2, tone: 'fifth', vel: 0.86 }, { at: 14, dur: 2, tone: 'seventh', vel: 0.78 },
    ] },
    { name: 'sixteenth-push', weight: 4, hits: [
      { at: 2, dur: 1, tone: 'root', vel: 0.88 }, { at: 3, dur: 1, tone: 'root', vel: 0.66 },
      { at: 6, dur: 2, tone: 'root', vel: 0.8 },
      { at: 10, dur: 1, tone: 'octave', vel: 0.86 }, { at: 11, dur: 1, tone: 'root', vel: 0.64 },
      { at: 14, dur: 2, tone: 'seventh', vel: 0.78 },
    ] },
  ],
  comp: [
    { name: 'chank-sixteenths', weight: 6, voices: 3, hits: [
      { at: 2, dur: 1, vel: 0.5 }, { at: 3, dur: 1, vel: 0.78 },
      { at: 6, dur: 1, vel: 0.52 }, { at: 7, dur: 1, vel: 0.8 },
      { at: 10, dur: 1, vel: 0.5 }, { at: 11, dur: 1, vel: 0.78 },
      { at: 14, dur: 1, vel: 0.56 }, { at: 15, dur: 1, vel: 0.88 },
    ] },
    { name: 'offbeat-stab', weight: 5, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.66 }, { at: 6, dur: 2, vel: 0.74 },
      { at: 10, dur: 2, vel: 0.68 }, { at: 14, dur: 2, vel: 0.84 },
    ] },
  ],
  drums: [
    { name: 'jack', weight: 7, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14], oh: [6, 14],
    }, ghosts: { hh: [1, 3, 5, 7, 9, 11, 13, 15] } },
    { name: 'jack-with-rim', weight: 5, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], rim: [3, 7, 11, 15],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { hh: [1, 5, 9, 13] } },
    { name: 'skipping-kick', weight: 4, voices: {
      bd: [0, 4, 8, 12, 15], cp: [4, 12], oh: [2, 6, 10, 14], hh: [0, 4, 8, 12],
    }, ghosts: { hh: [2, 6, 10, 14] } },
  ],
  melody: { leap: 0.2, ornament: 0.05, span: 7, sequence: 0.86, syncopation: 0.5 },
};

/**
 * ACID — 1987. One scale and a filter.
 *
 * A TB-303 was built in 1982 to be a bass accompanist for guitarists practising
 * at home, sold badly, and was in second-hand shops for forty dollars by 1985.
 * What it turns out to do — when the cutoff, the resonance and the envelope
 * amount are moved while a sixteen-step pattern runs — is the sound this style
 * is named after, and it is the purest example in this project of a genre
 * organised around a piece of equipment being used wrongly.
 *
 * **Everything here is one line.** The 303 is monophonic, so the bass table is
 * the record: sixteenth notes, octave jumps, and the same figure for four
 * minutes while a hand moves on the panel. `counterMode: 'ostinato'` and
 * `counterPatterns` are here for the same reason `berlin` uses them in synth —
 * a second line running continuously alongside the first, not answering it —
 * and the counter's cycle disagrees with the bar on purpose.
 *
 * **`filter: { depth: 0.75, shape: 'ramp' }` is the deepest in the genre**, and
 * this is the one style where that field is not a production choice but the
 * composition. There is nothing else happening. A section arrives because the
 * cutoff opened across it, exactly as `synth/berlin` claims for itself — the
 * difference being that berlin's sequencer is playing a harmony and this is
 * playing one note repeatedly.
 *
 * **§3.16 was reported from here, and the figures below now write it.** A 303
 * line *slides* — the slide switch is one of the five controls on the machine
 * and half of what makes the sound is a note bending into the next one — and
 * for as long as `BassHit` was `at`, `dur` and `tone`, every figure here spelled
 * that as two struck notes where the record has one that moves. `BassHit.glide`
 * is the field those five reports got built, two of them from this style and
 * `speedgarage`, and adopting it is a *deletion*: three pairs across these
 * tables are one note now, struck at the first pitch and arriving at the second
 * without a second attack. The attack is the half of it the old spelling got
 * most wrong. A slid step on a 303 holds its gate open so the following step
 * never retriggers the envelope, which is why two sixteenths and one slid
 * sixteenth are different sounds rather than the same sound at two spellings.
 *
 * **What is still not the machine is where the movement sits**, and it is worth
 * saying plainly rather than letting the adoption imply otherwise. The 303
 * slides at the *step boundary*: the source pitch holds for its whole step and
 * the travel happens on the way in to the next one. `NoteBend` argues that shape
 * at length and refuses it — superdough's pitch envelope has no delay stage, so
 * a bend at the far end of a note would audition in the wrong place instead of
 * merely auditioning flat — so the travel here starts at the onset and the
 * destination is reached early. What survives is the chirp and the single
 * articulation; what is spent is most of the source step. `glideTime` below is
 * where that trade is priced.
 */
const acid: Style = {
  id: 'acid',
  label: 'Acid (1987)',
  description:
    'A monophonic bass machine with the resonance up, sixteen steps, and a hand on the cutoff for the whole record.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [120, 132],
  hook: 'earworm',
  strictness: 'free',
  boxDrums: false,
  // One machine, one line. A stab layer would be a second idea.
  excludeLayers: ['brass'],
  filter: { depth: 0.75, shape: 'ramp' },
  modeWeights: { minor: 0.94, major: 0.06 },
  relativeMajorChorus: 0,
  transitions: [['fill', 3], ['break', 3]],
  /**
   * The one style where `dub` removes the thing the record is made of, and that
   * is exactly why it is here. Four bars with the 303 gone and the 909 carrying
   * on alone is a real and much-copied edit — it is what the machine's own mute
   * button is for — and the return is the loudest event on the record precisely
   * because there was nothing else.
   */
  drops: [['none', 2], ['dub', 1]],
  counterMode: 'ostinato',
  counterPatterns: [
    { name: 'twelve-step', weight: 4, voices: 1, cycle: 12, arpeggio: true, arpDirection: 'updown', hits: [
      { at: 0, dur: 1 }, { at: 2, dur: 1 }, { at: 4, dur: 1 },
      { at: 6, dur: 1 }, { at: 8, dur: 1 }, { at: 10, dur: 1 },
    ] },
    { name: 'ten-step', weight: 3, voices: 1, cycle: 10, arpeggio: true, arpDirection: 'up', arpOctaves: 2, hits: [
      { at: 0, dur: 1 }, { at: 2, dur: 1 }, { at: 4, dur: 1 }, { at: 6, dur: 1 }, { at: 8, dur: 1 },
    ] },
  ],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 6 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 9, note: 'One chord, and the harmony is not where the interest is. A hand on a filter is' },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 7 },
      { chords: ['i', 'i', 'VI', 'VI', 'i', 'i', 'VII', 'VII'], weight: 4 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'VI', 'VI', 'i', 'i', 'i', 'i'], weight: 4 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'bVII', 'bVII'], weight: 5 }],
  },
  melodyCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 4 },
    { cell: [-8, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    /**
     * The 303 line. Sixteenths, the octave above thrown in, and the ♭7 — which
     * is the note the machine's own transpose row lands on more than any other,
     * and is why this music sounds minor whatever the chord is called.
     *
     * Written with numeric `BassTone` rather than chord functions, for
     * `BassTone`'s own stated reason: this is a **shape**, not an outline, and a
     * figure that renegotiated with each chord would be a different figure. The
     * span is a twelfth, which is the ceiling §1.3 records — a thirteenth folds
     * flat at some root positions and three genres have found it independently.
     *
     * **Two of the sixteen steps slide**, which is about the density the machine
     * is actually played at: the slide is a per-step switch, and a line with it
     * on everywhere has no attacks left in it and stops being sixteenth notes.
     * The octave chirping down to the ♭7 at step 10 and the ♭3 falling into the
     * root across the bar line at 14 are the two moves the record is made of,
     * and each is one note now where it was two.
     *
     * **`glideTime: 0.25` is measured rather than picked.** The 303's slide is a
     * fixed RC time of about **60 ms** and does not scale with the tempo — which
     * is exactly why a fast acid line sounds smeared and a slow one sounds
     * stepped — and at this style's 120–132 BPM a sixteenth is 114–125 ms, so a
     * slid pair is 227–250 ms and a quarter of it is 57–63 ms. That is the
     * machine's number to within the width of the tempo range. It is also the
     * one place in this file working *against* the reason `BassHit.glideTime` is
     * a fraction: the fraction exists so a gesture scales with the note, and a
     * 303 chases an absolute, so this number is right at the two-step length
     * these figures use and would want recomputing on a longer one.
     *
     * The span is still a twelfth. Both destinations are pitches this figure
     * already struck somewhere else, so the reduce in `generateBass` that folds
     * a glide into the shape finds nothing new to fold — which is the general
     * case rather than luck, because a destination arrived at by deleting a
     * struck note was, by construction, already in the span.
     */
    { name: '303-sixteenths', weight: 7, hits: [
      { at: 0, dur: 1, tone: 0, vel: 1 }, { at: 1, dur: 1, tone: 0, vel: 0.6 },
      { at: 2, dur: 1, tone: 12, vel: 0.86 }, { at: 3, dur: 1, tone: 0, vel: 0.62 },
      { at: 4, dur: 1, tone: 0, vel: 0.9 }, { at: 6, dur: 1, tone: 10, vel: 0.8 },
      { at: 7, dur: 1, tone: 0, vel: 0.6 }, { at: 8, dur: 1, tone: 0, vel: 0.94 },
      { at: 10, dur: 2, tone: 12, vel: 0.84, glide: 10, glideTime: 0.25 },
      { at: 12, dur: 1, tone: 0, vel: 0.88 },
      { at: 14, dur: 2, tone: 3, vel: 0.76, glide: 0, glideTime: 0.25 },
    ] },
    /**
     * **No slide in this one, and the refusal is the useful half of the pair.**
     * Its only two steps that touch are the root at 6 and the ♭7 at 8, and the
     * root is held for two of them: absorbed, the travel would start at the
     * onset and the note would spend a sixteenth of its length on the root and
     * the rest on the arrival, which deletes the held pitch rather than the
     * restrike. A slide on the machine is a *step-to-step* switch, so the source
     * of one is a step long by definition, and that is the shape the two figures
     * around this one adopt. This one is written in held steps and does not have
     * it. The gap between the two spellings is the whole of why the field is
     * per-hit and not per-pattern.
     */
    { name: '303-sparse', weight: 5, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 }, { at: 3, dur: 1, tone: 12, vel: 0.8 },
      { at: 6, dur: 2, tone: 0, vel: 0.84 }, { at: 8, dur: 1, tone: 10, vel: 0.86 },
      { at: 10, dur: 1, tone: 0, vel: 0.7 }, { at: 12, dur: 2, tone: 0, vel: 0.9 },
      { at: 15, dur: 1, tone: 12, vel: 0.72 },
    ] },
    /**
     * Fifteen steps against a sixteen-step bar. It arrives a sixteenth earlier
     * every bar and comes home after sixteen of them — see `Cycle`.
     *
     * One slide, at step 2, the root up into the ♭7. Its velocity is the
     * *arrival's* — 0.82 rather than the 0.66 the root was struck at — because
     * the pair's accent was on the second step and the second step no longer has
     * an attack to carry it. There is one envelope now and the accent goes on
     * it; a slid note quieter than the plain sixteenth before it would read as a
     * mistake rather than as a machine.
     */
    { name: 'fifteen-step', weight: 4, cycle: 15, hits: [
      { at: 0, dur: 1, tone: 0, vel: 1 },
      { at: 2, dur: 2, tone: 0, vel: 0.82, glide: 10, glideTime: 0.25 },
      { at: 5, dur: 1, tone: 0, vel: 0.7 },
      { at: 7, dur: 1, tone: 12, vel: 0.86 }, { at: 9, dur: 1, tone: 0, vel: 0.68 },
      { at: 11, dur: 1, tone: 3, vel: 0.8 }, { at: 13, dur: 1, tone: 0, vel: 0.72 },
    ] },
  ],
  comp: [
    { name: 'sparse-stab', weight: 5, voices: 3, hits: [
      { at: 6, dur: 2, vel: 0.6 }, { at: 14, dur: 2, vel: 0.78 },
    ] },
    { name: 'offbeat-stab', weight: 4, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.56 }, { at: 6, dur: 2, vel: 0.66 },
      { at: 10, dur: 2, vel: 0.6 }, { at: 14, dur: 2, vel: 0.78 },
    ] },
  ],
  drums: [
    { name: '909-plain', weight: 7, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], hh: [2, 6, 10, 14], oh: [14],
    }, ghosts: { hh: [0, 4, 8, 12] } },
    { name: '606-tight', weight: 5, voices: {
      bd: [0, 4, 8, 12], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { hh: [1, 3, 5, 7, 9, 11, 13, 15] } },
    { name: 'open-hat-drive', weight: 4, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], oh: [2, 6, 10, 14],
    } },
  ],
  melody: { leap: 0.32, ornament: 0.04, span: 9, sequence: 0.9, syncopation: 0.3 },
};

/**
 * DEEP HOUSE — 1988. Rhodes ninths and nobody shouting.
 *
 * Larry Heard, Marshall Jefferson's slow records, Chez Damier, and the whole
 * strand of this music that came out of somebody who could actually play.
 * The tempo is at the bottom of the genre, the kick is soft rather than hard,
 * and the chords are the content in a way they are nowhere else in this file.
 *
 * **This is the one style in the genre that overrides `scaleForChord`, and it is
 * the whole reason the field exists.** `index.ts` argues the genre's rule at
 * length: a fixed tonic pentatonic dragged across the loop, chord never read,
 * because the tune is a riff and the loop does not move. That is right for
 * twenty-three of these tables and it is wrong here, for the same reason funk's
 * `jazzfunk` is the one exception in that genre. A `min9` on the tonic and a
 * `dom7sus4` on the ♭VII are two colours the player is *aiming at* — they are
 * what the record is about — and a five-note scale dragged over both hears
 * neither. One field, and the mirror image of `jazz/blues`, which follows the
 * chord everywhere and overrides to a tonic scale in exactly one style.
 *
 * `hook: 'catchy'` rather than the genre's `earworm`, and `strictness:
 * 'standard'`, both for the same reason: this is the corner of the repertoire
 * where a line is composed rather than looped.
 */
const deep: Style = {
  id: 'deep',
  label: 'Deep house (1988)',
  description:
    'Rhodes ninths, a soft kick and a tempo at the bottom of the genre. The corner of this music made by somebody who could play.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.1,
  bpm: [116, 124],
  hook: 'catchy',
  strictness: 'standard',
  // No stab. This style's chords are held on a Rhodes and there is nothing in
  // the arrangement shaped like a horn section — which is what the layer is.
  excludeLayers: ['brass'],
  breakCarrier: 'comp',
  transitions: [['fill', 3], ['break', 2], ['elide', 1]],
  modeWeights: { minor: 0.76, major: 0.24 },
  relativeMajorChorus: 0,
  vary: { comp: 0.25 },
  /**
   * The departure, and the only one in the genre.
   *
   * Follow the chord, the way jazz does: each quality implies its own scale and
   * the line re-orients when the harmony moves. Deliberately a *small* vocabulary
   * — five qualities and a fallback — because this is a house record with good
   * chords on it rather than a jazz record, and a full bebop chord-scale table
   * would produce lines that resolve, which is the one thing a loop must not do.
   */
  scaleForChord: (tonic, mode, chord) => {
    const root = chord.root;
    switch (chord.quality) {
      // The Rhodes ninth. Dorian rather than aeolian: the natural sixth over a
      // min9 is the single most characteristic note in this style, and it is why
      // the chord is voiced with five fingers rather than three.
      case 'min7': case 'min9': case 'min11': case 'min':
        return makeScale(root, 'dorian');
      case 'maj7': case 'maj9':
        return makeScale(root, 'lydian');
      // The sus chord that never resolves. Mixolydian, with the fourth in it
      // rather than avoided — `avoid-fourth` is disabled genre-wide for this.
      case 'dom7sus4': case 'sus4': case 'sus2':
        return makeScale(root, 'mixolydian');
      case 'dom7': case 'dom9': case 'dom13':
        return makeScale(root, 'mixolydian');
      default:
        return makeScale(tonic, mode === 'minor' ? 'dorian' : 'major');
    }
  },
  progressions: {
    intro: [
      { chords: ['i9', 'i9', 'iv9', 'iv9'], weight: 5 },
      { chords: ['i9', 'i9', 'i9', 'i9'], weight: 3 },
    ],
    verse: [
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9'], weight: 7, note: 'Two chords, rocking. The natural sixth in the melody over the major-ish fourth is what makes this dorian rather than aeolian' },
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['i11', 'i11', 'VII7sus4', 'VII7sus4', 'i11', 'i11', 'VII7sus4', 'VII7sus4'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv9', 'iv9', 'VII7', 'VII7', 'IIImaj7', 'IIImaj7', 'VImaj7', 'VImaj7'], weight: 6, note: 'The one place in this genre a progression actually goes somewhere: round the circle and back, and it is why this style has its own scale rule' },
      { chords: ['i9', 'i9', 'VImaj7', 'VImaj7', 'iv9', 'iv9', 'VII7', 'VII7'], weight: 5 },
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'VII7', 'VII7'], weight: 4 },
    ],
    bridge: [
      { chords: ['VImaj7', 'VImaj7', 'IIImaj7', 'IIImaj7', 'iv9', 'iv9', 'VII7', 'VII7'], weight: 4 },
    ],
    outro: [{ chords: ['i9', 'i9', 'iv9', 'iv9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9'], weight: 6 },
      { chords: ['ii9', 'ii9', 'V7', 'V7', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 4 },
    ],
    chorus: [
      { chords: ['IVmaj9', 'IVmaj9', 'iii9', 'iii9', 'vi9', 'vi9', 'ii9', 'ii9'], weight: 5 },
      { chords: ['Imaj9', 'Imaj9', 'vi9', 'vi9', 'ii9', 'ii9', 'V7sus4', 'V7sus4'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [-2, 6, 4, 4], weight: 3 },
    { cell: [4, 2, 2, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'offbeat-warm', weight: 6, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.82 }, { at: 6, dur: 2, tone: 'root', vel: 0.74 },
      { at: 10, dur: 2, tone: 'fifth', vel: 0.8 }, { at: 14, dur: 2, tone: 'root', vel: 0.72 },
    ] },
    { name: 'walking-eighths', weight: 5, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.9 }, { at: 4, dur: 2, tone: 'seventh', vel: 0.7 },
      { at: 6, dur: 2, tone: 'fifth', vel: 0.76 }, { at: 10, dur: 2, tone: 'third', vel: 0.72 },
      { at: 12, dur: 2, tone: 'root', vel: 0.84 }, { at: 14, dur: 2, tone: 'octave', vel: 0.68 },
    ] },
    { name: 'sustained-root', weight: 3, sustain: true, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 0.82 }, { at: 8, dur: 8, tone: 'root', vel: 0.78 },
    ] },
  ],
  comp: [
    /**
     * A Rhodes held down with five fingers and pushed an eighth ahead of the
     * barline. `Genre.comping` supplies the anticipation and this figure supplies
     * the holes; between them they are as close to a person as this genre gets.
     */
    { name: 'rhodes-hold', weight: 6, voices: 4, hits: [
      { at: 2, dur: 6, vel: 0.66 }, { at: 10, dur: 5, vel: 0.62 },
    ] },
    { name: 'rhodes-offbeat', weight: 5, voices: 4, hits: [
      { at: 2, dur: 2, vel: 0.6 }, { at: 6, dur: 2, vel: 0.7 },
      { at: 10, dur: 2, vel: 0.62 }, { at: 14, dur: 2, vel: 0.76 },
    ] },
    { name: 'rhodes-pushed', weight: 4, voices: 4, hits: [
      { at: 3, dur: 3, vel: 0.7 }, { at: 8, dur: 2, vel: 0.6 }, { at: 14, dur: 2, vel: 0.74 },
    ] },
  ],
  drums: [
    { name: 'soft-four', weight: 6, voices: {
      bd: [0, 4, 8, 12], cp: [12], rim: [4], hh: [2, 6, 10, 14],
    }, ghosts: { hh: [0, 8] } },
    { name: 'shaker-four', weight: 5, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], sh: [0, 2, 4, 6, 8, 10, 12, 14], oh: [6, 14],
    }, ghosts: { sh: [1, 5, 9, 13] } },
    { name: 'brushed-hats', weight: 4, voices: {
      bd: [0, 4, 8, 12], rim: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { hh: [1, 3, 5, 7, 9, 11, 13, 15] } },
  ],
  melody: { leap: 0.3, ornament: 0.16, span: 13, sequence: 0.55, syncopation: 0.5 },
};

/**
 * PIANO HOUSE — 1989. An Italian record with a diva sample on it.
 *
 * Black Box, Starlight, FPI Project, and the year the piano became the loudest
 * instrument in dance music. The device is specific and worth naming because
 * nothing else in this file does it: a **piano vamp in octaves**, played as
 * eighth-note chords in the right hand with the left doubling underneath, loud
 * enough to be the melody, the harmony and the rhythm section at once.
 *
 * The other half is the sample. These records were built on four bars of a
 * gospel singer taken off somebody else's disco twelve-inch, and the litigation
 * that followed is a whole chapter of the format's history. `vocals.ts` argues
 * what that does to the voice profile and what the engine cannot say about it,
 * which is that the phrase loops on its own cycle against the harmony.
 *
 * `drops: [['none', 2], ['breakdown', 2]]` — an even split, and the highest
 * breakdown weight outside `trance`. A piano-house breakdown is the record's
 * whole architecture: everything stops, the piano plays the vamp alone with a
 * reverb on it, and the kick returns on a bar that everyone in the room can
 * count to.
 */
const piano: Style = {
  id: 'piano',
  label: 'Piano house (1989)',
  description:
    'An octave piano vamp loud enough to be the whole arrangement, an orchestra hit, and four bars of somebody else\'s singer.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.05,
  bpm: [120, 128],
  hook: 'earworm',
  breakCarrier: 'comp',
  transitions: [['fill', 4], ['break', 4]],
  drops: [['none', 2], ['breakdown', 2]],
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['i', 'VII', 'VI', 'VII'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 6 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 5 },
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'iv7', 'iv7'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 7 },
      { chords: ['iv', 'VII', 'III', 'VI', 'iv', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'III', 'VII', 'i', 'VI', 'III', 'VII', 'i'], weight: 4 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
    ],
    outro: [{ chords: ['i', 'VII', 'VI', 'VII'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'V', 'V', 'vi', 'vi', 'IV', 'IV'], weight: 5 },
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'V'], weight: 5 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'I', 'I', 'IV', 'V', 'vi', 'vi'], weight: 6 },
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'V'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [8, 8], weight: 5 },
    { cell: [-2, 2, 4, 4, 4], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [2, 2, 4, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    { name: 'octave-piano-left', weight: 6, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.94 }, { at: 4, dur: 2, tone: 'octave', vel: 0.74 },
      { at: 8, dur: 2, tone: 'root', vel: 0.9 }, { at: 12, dur: 2, tone: 'octave', vel: 0.76 },
    ] },
    { name: 'offbeat-root', weight: 5, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.9 }, { at: 6, dur: 2, tone: 'root', vel: 0.8 },
      { at: 10, dur: 2, tone: 'root', vel: 0.88 }, { at: 14, dur: 2, tone: 'fifth', vel: 0.78 },
    ] },
  ],
  comp: [
    /**
     * The vamp. Eighth-note chords, right through the bar, with the accent on the
     * offbeats — which is what makes a piano a rhythm instrument rather than a
     * harmonic one and is the reason this style is a style.
     */
    { name: 'octave-vamp', weight: 7, voices: 4, hits: [
      { at: 0, dur: 2, vel: 0.72 }, { at: 2, dur: 2, vel: 0.88 },
      { at: 4, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.9 },
      { at: 8, dur: 2, vel: 0.74 }, { at: 10, dur: 2, vel: 0.88 },
      { at: 12, dur: 2, vel: 0.7 }, { at: 14, dur: 2, vel: 0.94 },
    ] },
    { name: 'rolled-chords', weight: 5, voices: 4, hits: [
      { at: 2, dur: 2, vel: 0.8 }, { at: 6, dur: 2, vel: 0.86 },
      { at: 10, dur: 2, vel: 0.8 }, { at: 13, dur: 1, vel: 0.7 }, { at: 14, dur: 2, vel: 0.92 },
    ] },
  ],
  drums: [
    { name: 'big-clap', weight: 6, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], sd: [4, 12], oh: [2, 6, 10, 14],
    } },
    { name: 'tambourine-four', weight: 5, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], tb: [0, 2, 4, 6, 8, 10, 12, 14], hh: [0, 4, 8, 12],
    }, ghosts: { tb: [1, 3, 5, 7, 9, 11, 13, 15] } },
    { name: 'roll-into-four', weight: 4, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], cr: [0],
    }, ghosts: { hh: [1, 3, 5, 7, 9, 11, 13, 15] } },
  ],
  melody: { leap: 0.34, ornament: 0.2, span: 14, sequence: 0.6, syncopation: 0.55 },
};

/**
 * GARAGE — 1990. New York, a church singer, and an organ.
 *
 * Named after the Paradise Garage and not after anything in Britain — the UK
 * styles that borrowed the word are `speedgarage` and `ukgarage`, seven years
 * later, and they are different music. This is the New Jersey/New York strand:
 * gospel voices, live-sounding percussion, a Hammond or an M1 organ, and a
 * tempo a singer can actually phrase over.
 *
 * **It is the one style here where the vocal is the record.** `vocals.ts` sets
 * the vocal gain above the melody's own for exactly this style's sake, and the
 * `melody.span` of 15 is the widest in the file because a gospel line goes
 * somewhere. Everything else in this genre writes a hook; this writes a tune.
 *
 * `swing: 0.12` is the sixteenth-shuffle approximation this file's header
 * complains about, at the mild end. A garage record is not straight and it is not
 * a 2-step: it is the small lift a session drummer puts on a hat pattern, and
 * `Style.swing` describes the eighth.
 */
const garage: Style = {
  id: 'garage',
  label: 'Garage (1990)',
  description:
    'Paradise Garage: a gospel voice, an organ, hand percussion and a tempo somebody can actually sing over.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.12,
  bpm: [118, 126],
  hook: 'catchy',
  breakCarrier: 'comp',
  transitions: [['fill', 4], ['break', 3]],
  drops: [['none', 2], ['breakdown', 1]],
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  vary: { comp: 0.2 },
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'iv9', 'iv9'], weight: 5 }],
    verse: [
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9'], weight: 6 },
      { chords: ['i9', 'i9', 'VII7', 'VII7', 'VImaj7', 'VImaj7', 'VII7', 'VII7'], weight: 5 },
      { chords: ['iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9', 'VII7', 'VII7'], weight: 4 },
    ],
    chorus: [
      { chords: ['VImaj7', 'VII7', 'i9', 'i9', 'VImaj7', 'VII7', 'i9', 'i9'], weight: 6 },
      { chords: ['iv9', 'VII7', 'IIImaj7', 'VImaj7', 'iv9', 'VII7', 'i9', 'i9'], weight: 5 },
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'VII7', 'VII7', 'i9', 'i9'], weight: 4 },
    ],
    bridge: [{ chords: ['iv9', 'iv9', 'VII7', 'VII7', 'IIImaj7', 'IIImaj7', 'VII7', 'VII7'], weight: 4 }],
    outro: [{ chords: ['i9', 'i9', 'iv9', 'iv9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'ii9', 'ii9', 'IVmaj9', 'IVmaj9', 'V7sus4', 'V7sus4'], weight: 5 },
      { chords: ['Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9'], weight: 5 },
    ],
    chorus: [
      { chords: ['IVmaj9', 'V7', 'iii9', 'vi9', 'IVmaj9', 'V7', 'Imaj9', 'Imaj9'], weight: 6 },
      { chords: ['vi9', 'IVmaj9', 'Imaj9', 'V7sus4', 'vi9', 'IVmaj9', 'Imaj9', 'Imaj9'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 8], weight: 5 },
    { cell: [-2, 6, 8], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 8], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    { name: 'offbeat-round', weight: 6, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.86 }, { at: 6, dur: 2, tone: 'root', vel: 0.76 },
      { at: 10, dur: 2, tone: 'fifth', vel: 0.82 }, { at: 14, dur: 2, tone: 'root', vel: 0.74 },
    ] },
    { name: 'gospel-walk', weight: 5, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.9 }, { at: 3, dur: 1, tone: 'fifth', vel: 0.68 },
      { at: 4, dur: 2, tone: 'seventh', vel: 0.76 }, { at: 8, dur: 2, tone: 'root', vel: 0.86 },
      { at: 11, dur: 1, tone: 'third', vel: 0.68 }, { at: 12, dur: 2, tone: 'fifth', vel: 0.78 },
      { at: 14, dur: 2, tone: 'approach', vel: 0.72 },
    ] },
    { name: 'held-under', weight: 3, sustain: true, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 0.84 }, { at: 8, dur: 8, tone: 'root', vel: 0.8 },
    ] },
  ],
  comp: [
    { name: 'organ-offbeat', weight: 6, voices: 4, hits: [
      { at: 2, dur: 2, vel: 0.68 }, { at: 6, dur: 2, vel: 0.76 },
      { at: 10, dur: 2, vel: 0.7 }, { at: 14, dur: 2, vel: 0.84 },
    ] },
    { name: 'organ-hold', weight: 5, voices: 4, hits: [
      { at: 2, dur: 6, vel: 0.7 }, { at: 10, dur: 6, vel: 0.66 },
    ] },
    { name: 'gospel-push', weight: 4, voices: 4, hits: [
      { at: 3, dur: 3, vel: 0.74 }, { at: 7, dur: 1, vel: 0.62 },
      { at: 10, dur: 2, vel: 0.7 }, { at: 15, dur: 1, vel: 0.8 },
    ] },
  ],
  drums: [
    { name: 'live-four', weight: 6, voices: {
      bd: [0, 4, 8, 12], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
      tb: [2, 6, 10, 14],
    }, ghosts: { hh: [1, 3, 5, 7, 9, 11, 13, 15], sd: [7, 15] } },
    { name: 'conga-four', weight: 5, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], mp: [2, 3, 6, 10, 11, 14], lp: [0, 8],
      hh: [2, 6, 10, 14],
    } },
    { name: 'shaker-and-rim', weight: 4, voices: {
      bd: [0, 4, 8, 12], rim: [4, 12], sh: [0, 2, 4, 6, 8, 10, 12, 14], oh: [6, 14],
    }, ghosts: { sh: [1, 3, 5, 7, 9, 11, 13, 15] } },
  ],
  melody: { leap: 0.36, ornament: 0.26, span: 15, sequence: 0.45, syncopation: 0.6 },
};

/**
 * GHETTO HOUSE — 1993. An 808, a chant, and nothing else on the record.
 *
 * DJ Funk, DJ Deeon, Cajmere's harder side. The fastest thing on the house half
 * of this file and by a distance the most reduced: a booty-house track is a kick,
 * a clap, a hat, one sampled voice saying one thing, and — this is the part that
 * makes it a style — **an 808 kick that is also the bass line**, because the 808
 * bass drum is a tuned sine with a long decay and if you pitch it you have a
 * sub. There is frequently no bass part at all in the sense the rest of this
 * genre means.
 *
 * The tables say so by making the bass one note on the downbeat and putting
 * everything else in the kit. `excludeLayers: ['pad', 'brass']` is the other
 * half and it is not an economy: a pad on a ghetto house record would be
 * somebody who had misunderstood, and this is one of two styles here that
 * refuses the wash outright.
 *
 * **No `drops` palette**, and that is a refusal rather than an omission. A
 * `breakdown` removes the kit and the bass, and on this style that is the entire
 * record; a `dub` removes a bass part that is barely there. `drop.ts` is
 * explicit that a style naming a shape whose witness it lacks simply never places
 * one, so writing a table here would be a table that looks like it works.
 */
const ghetto: Style = {
  id: 'ghetto',
  label: 'Ghetto house (1993)',
  description:
    'An 808 tuned until the kick is the bass, one clap, one hat, and a sampled voice repeating four words.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.08,
  bpm: [138, 150],
  hook: 'earworm',
  strictness: 'free',
  excludeLayers: ['pad', 'brass'],
  transitions: [['fill', 4], ['break', 3]],
  modeWeights: { minor: 0.88, major: 0.12 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 6 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 9 },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 7 },
      { chords: ['i', 'i', 'VI', 'VI', 'i', 'i', 'VI', 'VI'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [16], weight: 4 },
  ],
  bass: [
    /** One note a bar, and the kick is doing the rest. */
    { name: 'sub-downbeat', weight: 7, sustain: true, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 1 }, { at: 8, dur: 8, tone: 'root', vel: 0.94 },
    ] },
    { name: 'sub-and-octave', weight: 5, hits: [
      { at: 0, dur: 6, tone: 'root', vel: 1 }, { at: 8, dur: 4, tone: 'root', vel: 0.9 },
      { at: 14, dur: 2, tone: 'octave', vel: 0.7 },
    ] },
    { name: 'offbeat-sub', weight: 4, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.92 }, { at: 6, dur: 2, tone: 'root', vel: 0.86 },
      { at: 10, dur: 2, tone: 'root', vel: 0.9 }, { at: 14, dur: 2, tone: 'root', vel: 0.86 },
    ] },
  ],
  comp: [
    { name: 'one-stab', weight: 5, voices: 3, hits: [{ at: 14, dur: 2, vel: 0.86 }] },
    { name: 'two-stab', weight: 4, voices: 3, hits: [
      { at: 6, dur: 2, vel: 0.7 }, { at: 14, dur: 2, vel: 0.86 },
    ] },
  ],
  drums: [
    { name: '808-booty', weight: 7, voices: {
      bd: [0, 3, 6, 8, 11, 14], cp: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { hh: [1, 3, 5, 7, 9, 11, 13, 15] } },
    { name: '808-four', weight: 5, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], cb: [2, 6, 10, 14], hh: [0, 4, 8, 12],
    } },
    { name: 'clap-track', weight: 4, voices: {
      bd: [0, 4, 8, 12], cp: [2, 4, 6, 12, 14], oh: [6, 14],
    } },
  ],
  melody: { leap: 0.18, ornament: 0.04, span: 7, sequence: 0.9, syncopation: 0.55 },
};

/**
 * TRIBAL HOUSE — 1995. The percussion is the arrangement.
 *
 * Danny Tenaglia, Junior Vasquez, the long New York records where nothing
 * harmonic happens for eleven minutes and the interest is entirely in what the
 * hand drums are doing. This is the one style in the genre that uses
 * `SAMPLE_RACKS` for its identity rather than for colour: `lp`, `mp` and `hp` are
 * doing what the hi-hat does elsewhere, and the kit voices are the accompaniment.
 *
 * **`excludeLayers: ['melody']` was considered and refused**, and the refusal is
 * worth recording because it looks obvious. There genuinely is no tune on a lot
 * of these records. But `Chart.exits` and `generate/drop.ts` both use the melody
 * as their safety witness — a layer may only be removed where something else is
 * guaranteed to sound — so a style with no melody layer is a style where the
 * arrangement can never thin, and thinning is what this music does instead of
 * having a tune. The right answer is a melody with almost nothing in it, which is
 * what `melodyCells` weighted toward `[16]` produces.
 */
const tribal: Style = {
  id: 'tribal',
  label: 'Tribal house (1995)',
  description:
    'Eleven minutes in which nothing harmonic happens and the hand drums do all of it. The percussion is the arrangement.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.04,
  bpm: [124, 132],
  hook: 'earworm',
  excludeLayers: ['brass'],
  transitions: [['fill', 4], ['break', 3]],
  modeWeights: { minor: 0.86, major: 0.14 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 6 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 9 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'iv7', 'iv7'], weight: 3 },
    ],
    chorus: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6 },
      { chords: ['i7', 'i7', 'VII', 'VII', 'i7', 'i7', 'VII', 'VII'], weight: 4 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'iv7', 'iv7', 'iv7', 'iv7', 'iv7', 'iv7'], weight: 4 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'IV7', 'IV7'], weight: 5 }],
  },
  melodyCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 4 },
    { cell: [-8, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'offbeat-root', weight: 6, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.88 }, { at: 6, dur: 2, tone: 'root', vel: 0.8 },
      { at: 10, dur: 2, tone: 'root', vel: 0.86 }, { at: 14, dur: 2, tone: 'root', vel: 0.8 },
    ] },
    { name: 'held-sub', weight: 5, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.86 },
    ] },
    /** Three beats against four. The figure comes home every three bars, which is
     *  the same trick the congas are already playing against the kick. */
    { name: 'twelve-cycle', weight: 4, cycle: 12, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.9 }, { at: 4, dur: 2, tone: 'seventh', vel: 0.72 },
      { at: 8, dur: 2, tone: 'fifth', vel: 0.8 },
    ] },
  ],
  comp: [
    { name: 'sparse-stab', weight: 5, voices: 3, hits: [
      { at: 6, dur: 2, vel: 0.6 }, { at: 14, dur: 2, vel: 0.74 },
    ] },
    { name: 'offbeat-stab', weight: 4, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.56 }, { at: 6, dur: 2, vel: 0.66 },
      { at: 10, dur: 2, vel: 0.6 }, { at: 14, dur: 2, vel: 0.78 },
    ] },
  ],
  drums: [
    { name: 'conga-lead', weight: 7, voices: {
      bd: [0, 4, 8, 12],
      lp: [0, 6, 8, 14], mp: [2, 3, 7, 10, 11, 15], hp: [4, 5, 12, 13],
      hh: [2, 6, 10, 14],
    } },
    { name: 'bongo-cross', weight: 5, voices: {
      bd: [0, 4, 8, 12], cp: [12],
      hp: [1, 3, 5, 7, 9, 11, 13, 15], mp: [0, 6, 10],
      sh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sh: [1, 3, 5, 7, 9, 11, 13, 15] } },
    /** A three-beat percussion cycle over a four-beat kick. See `Cycle` — the
     *  kick stays bar-shaped because the kick is the thing being disagreed with. */
    { name: 'twelve-perc', weight: 4, cycle: 12, voices: {
      bd: [0, 4, 8], mp: [1, 3, 5, 7, 9, 11], lp: [0, 6], cb: [2, 8],
    } },
  ],
  melody: { leap: 0.2, ornament: 0.08, span: 8, sequence: 0.88, syncopation: 0.45 },
};

/**
 * DISCO HOUSE — 1996. Somebody else's record, looped and filtered.
 *
 * The style that is a *technique* rather than a set of parts: take four bars off
 * a 1979 twelve-inch, loop them, put a kick under them, and move a filter. It is
 * the most literal statement in this genre of the thing `index.ts` claims
 * separates it from pop and synth — the material is somebody else's finished
 * record, and the composition is what you do to it.
 *
 * `filter: { depth: 0.65, shape: 'ramp' }` is therefore not production, it is
 * the piece. The comp table is a rhythm guitar and a string stab because that is
 * what is on the loop; the `bass` table is a real bass playing a disco line for
 * the same reason. Nothing here is a synthesiser, which makes it the odd one out
 * in a genre of synthesisers and is precisely the point.
 */
const disco: Style = {
  id: 'disco',
  label: 'Disco house (1996)',
  description:
    'Four bars off a 1979 twelve-inch, looped, with a kick under it and a filter opening across the top.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.06,
  bpm: [122, 128],
  hook: 'earworm',
  filter: { depth: 0.65, shape: 'ramp' },
  breakCarrier: 'comp',
  transitions: [['fill', 4], ['break', 3]],
  drops: [['none', 3], ['breakdown', 2]],
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'iv7', 'iv7'], weight: 5 }],
    verse: [
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'iv7', 'iv7'], weight: 6 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 5 },
      { chords: ['i9', 'i9', 'VII7', 'VII7', 'VImaj7', 'VImaj7', 'VII7', 'VII7'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv9', 'VII7', 'i9', 'i9', 'iv9', 'VII7', 'i9', 'i9'], weight: 6 },
      { chords: ['VImaj7', 'VII7', 'i9', 'i9', 'VImaj7', 'VII7', 'i9', 'i9'], weight: 5 },
    ],
    bridge: [{ chords: ['iv9', 'iv9', 'VII7', 'VII7', 'iv9', 'iv9', 'VII7', 'VII7'], weight: 4 }],
    outro: [{ chords: ['i7', 'i7', 'iv7', 'iv7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7'], weight: 6 },
      { chords: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'IV7', 'IV7'], weight: 4 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'V7', 'iii7', 'vi7', 'IVmaj7', 'V7', 'Imaj7', 'Imaj7'], weight: 6 },
      { chords: ['ii7', 'V7', 'Imaj7', 'Imaj7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 8], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-2, 2, 4, 8], weight: 4 },
    { cell: [2, 2, 4, 4, 4], weight: 3 },
    { cell: [16], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
  ],
  bass: [
    /** A disco bass line, which is an octave figure with the sixteenth push in
     *  it — the one thing a synthesiser bass in this genre never does. */
    { name: 'disco-octaves', weight: 7, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.94 }, { at: 3, dur: 1, tone: 'root', vel: 0.66 },
      { at: 4, dur: 2, tone: 'octave', vel: 0.78 }, { at: 7, dur: 1, tone: 'seventh', vel: 0.68 },
      { at: 8, dur: 2, tone: 'root', vel: 0.9 }, { at: 11, dur: 1, tone: 'root', vel: 0.66 },
      { at: 12, dur: 2, tone: 'octave', vel: 0.78 }, { at: 15, dur: 1, tone: 'fifth', vel: 0.7 },
    ] },
    { name: 'offbeat-round', weight: 5, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.86 }, { at: 6, dur: 2, tone: 'root', vel: 0.78 },
      { at: 10, dur: 2, tone: 'fifth', vel: 0.84 }, { at: 14, dur: 2, tone: 'root', vel: 0.76 },
    ] },
  ],
  comp: [
    { name: 'chank-guitar', weight: 6, voices: 3, hits: [
      { at: 2, dur: 1, vel: 0.6 }, { at: 3, dur: 1, vel: 0.8 },
      { at: 6, dur: 1, vel: 0.6 }, { at: 7, dur: 1, vel: 0.82 },
      { at: 10, dur: 1, vel: 0.62 }, { at: 11, dur: 1, vel: 0.8 },
      { at: 14, dur: 1, vel: 0.62 }, { at: 15, dur: 1, vel: 0.88 },
    ] },
    { name: 'string-stab', weight: 5, voices: 4, hits: [
      { at: 0, dur: 2, vel: 0.82 }, { at: 6, dur: 2, vel: 0.7 },
      { at: 8, dur: 2, vel: 0.78 }, { at: 14, dur: 2, vel: 0.72 },
    ] },
    { name: 'offbeat-stab', weight: 4, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.64 }, { at: 6, dur: 2, vel: 0.74 },
      { at: 10, dur: 2, vel: 0.68 }, { at: 14, dur: 2, vel: 0.84 },
    ] },
  ],
  drums: [
    { name: 'four-and-tambourine', weight: 6, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], oh: [2, 6, 10, 14], tb: [4, 12],
    } },
    { name: 'loop-kit', weight: 5, voices: {
      bd: [0, 4, 8, 12], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { hh: [1, 3, 5, 7, 9, 11, 13, 15], sd: [7, 15] } },
    { name: 'four-and-shaker', weight: 4, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], sh: [0, 2, 4, 6, 8, 10, 12, 14], oh: [14],
    }, ghosts: { sh: [1, 5, 9, 13] } },
  ],
  melody: { leap: 0.32, ornament: 0.18, span: 13, sequence: 0.6, syncopation: 0.55 },
};

/**
 * FRENCH TOUCH — 1998. The same loop, through a phaser, at half the brightness.
 *
 * Daft Punk's first record, Cassius, Étienne de Crécy, Alan Braxe. It is
 * `disco` one country and two years over, and the argument for it being separate
 * is one production decision: **the filter is the melody**. A French touch record
 * frequently has *no* melodic material at all beyond the loop — what develops is
 * the cutoff and the phasing, over four minutes, and everything else stays put.
 *
 * So `filter.depth` is 0.7 against `disco`'s 0.65, the `melodyCells` are the
 * flattest in the file after `minimal`'s, and `melody.sequence` is 0.9 — the tune
 * repeats exactly, because it is not a tune, it is a piece of the loop.
 * `Style.effects` names `phaser` on the comp and the pad, which is the one place
 * in this genre where the treatment is the piece in `Style.effects`' own sense:
 * a French touch record without the phaser is not a dry version of it, it is a
 * disco house record.
 */
const frenchtouch: Style = {
  id: 'frenchtouch',
  label: 'French touch (1998)',
  description:
    'A filtered disco loop through a phaser, with the cutoff doing the job a melody does everywhere else.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.05,
  bpm: [120, 128],
  hook: 'earworm',
  filter: { depth: 0.7, shape: 'ramp' },
  breakCarrier: 'comp',
  transitions: [['fill', 3], ['break', 4]],
  drops: [['none', 3], ['breakdown', 2]],
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  /**
   * The treatment is the piece. `Style.effects` merges over the era's, which is
   * exactly the ordering its own docstring argues for: an era is an average over
   * a decade and this is a claim about one kind of record inside it. The
   * `lowpass` is deliberately not named — how bright the decade is stays the
   * era's to say, and `filter` above is doing the moving.
   */
  effects: {
    comp: { phaser: 0.55, reverb: 0.34, drive: 0.28 },
    pad: { phaser: 0.4, reverb: 0.6 },
    melody: { phaser: 0.3, reverb: 0.4, drive: 0.2 },
  },
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 7 },
      { chords: ['i9', 'i9', 'VImaj7', 'VImaj7', 'i9', 'i9', 'VImaj7', 'VImaj7'], weight: 5 },
      { chords: ['i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'iv7', 'iv7'], weight: 4 },
    ],
    chorus: [
      { chords: ['VImaj7', 'VImaj7', 'VII7', 'VII7', 'i9', 'i9', 'i9', 'i9'], weight: 6 },
      { chords: ['i9', 'i9', 'VImaj7', 'VImaj7', 'IIImaj7', 'IIImaj7', 'VII7', 'VII7'], weight: 5 },
    ],
    bridge: [{ chords: ['iv9', 'iv9', 'iv9', 'iv9', 'VII7', 'VII7', 'VII7', 'VII7'], weight: 4 }],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['Imaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'], weight: 6 },
      { chords: ['Imaj7', 'Imaj7', 'vi7', 'vi7', 'IVmaj7', 'IVmaj7', 'IVmaj7', 'IVmaj7'], weight: 4 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'ii7', 'ii7', 'V7', 'V7'], weight: 5 },
    ],
  },
  melodyCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 5 },
    { cell: [-4, 4, 8], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    { name: 'filtered-octaves', weight: 6, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.92 }, { at: 4, dur: 2, tone: 'octave', vel: 0.74 },
      { at: 6, dur: 2, tone: 'root', vel: 0.78 }, { at: 8, dur: 2, tone: 'root', vel: 0.9 },
      { at: 12, dur: 2, tone: 'octave', vel: 0.76 }, { at: 14, dur: 2, tone: 'seventh', vel: 0.74 },
    ] },
    { name: 'offbeat-root', weight: 5, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.88 }, { at: 6, dur: 2, tone: 'root', vel: 0.8 },
      { at: 10, dur: 2, tone: 'root', vel: 0.86 }, { at: 14, dur: 2, tone: 'root', vel: 0.8 },
    ] },
  ],
  comp: [
    { name: 'loop-chords', weight: 6, voices: 4, hits: [
      { at: 0, dur: 4, vel: 0.74 }, { at: 6, dur: 2, vel: 0.66 }, { at: 10, dur: 4, vel: 0.7 },
    ] },
    { name: 'chank-loop', weight: 5, voices: 3, hits: [
      { at: 2, dur: 1, vel: 0.58 }, { at: 3, dur: 1, vel: 0.78 },
      { at: 6, dur: 1, vel: 0.6 }, { at: 7, dur: 1, vel: 0.8 },
      { at: 10, dur: 1, vel: 0.6 }, { at: 11, dur: 1, vel: 0.78 },
      { at: 14, dur: 1, vel: 0.62 }, { at: 15, dur: 1, vel: 0.86 },
    ] },
  ],
  drums: [
    { name: 'compressed-four', weight: 6, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], oh: [14],
    }, ghosts: { hh: [1, 3, 5, 7, 9, 11, 13, 15] } },
    { name: 'loop-kit', weight: 5, voices: {
      bd: [0, 4, 8, 12], sd: [4, 12], hh: [2, 6, 10, 14], tb: [4, 12],
    }, ghosts: { sd: [7, 15] } },
  ],
  melody: { leap: 0.24, ornament: 0.08, span: 10, sequence: 0.9, syncopation: 0.4 },
};

/**
 * SPEED GARAGE — 1997. A house record with a reggae bass line in it.
 *
 * The British answer to New York garage and not a version of it. Two things
 * arrive at once and both are imported: the **wobbling sub bass** off a jungle
 * record, and the **timestretched vocal** — a sped-up garage a cappella that
 * sounds like nobody in particular. The tempo goes up to the mid 130s and the
 * kick keeps four on the floor, so it is a house record structurally with a
 * sound system's bottom end bolted underneath it.
 *
 * The bass tables are where the whole style is and they are written with numeric
 * `BassTone`, because the figure is a shape rather than an outline: a slide from
 * the root down to the fifth below is the gesture, and re-rooting it per chord
 * would produce a different figure every bar.
 *
 * **That slide is written now.** This style is one of the five reports behind
 * `BassHit.glide` — with `acid` two doors up — and `wobble` below takes it: the
 * drop to the fifth below and the lift to the ♭3 are one note each, struck once
 * and arriving without a second attack, where the table used to strike both ends
 * of the movement and hope.
 *
 * **What that leaves is a different gap wearing the same complaint's clothes.**
 * The wobble *proper* is a filter moving under one held pitch, and a pitch that
 * travels is not a cutoff that does: it is §3.5 — `Genre.filter` moves per
 * section and this wants it per note — not §3.16, which is closed here. One
 * sentence in this header used to carry both, which is how a fixed gap can go on
 * sounding broken: the half that closed had been filed under the half that did
 * not.
 */
const speedgarage: Style = {
  id: 'speedgarage',
  label: 'Speed garage (1997)',
  description:
    'Four on the floor with a jungle sub underneath it and a sped-up vocal on top. A house record with a sound system in the basement.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.14,
  bpm: [130, 140],
  hook: 'earworm',
  transitions: [['fill', 4], ['break', 4]],
  drops: [['none', 2], ['breakdown', 1]],
  modeWeights: { minor: 0.84, major: 0.16 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 6 },
      { chords: ['i9', 'i9', 'VII7', 'VII7', 'i9', 'i9', 'VII7', 'VII7'], weight: 5 },
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i9', 'i9', 'VI', 'VII', 'i9', 'i9'], weight: 6 },
      { chords: ['iv9', 'iv9', 'VII7', 'VII7', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'VII', 'VII', 'iv9', 'iv9', 'VII', 'VII'], weight: 4 }],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I7', 'I7', 'I7', 'I7', 'bVII', 'bVII', 'bVII', 'bVII'], weight: 5 }],
    chorus: [{ chords: ['IV', 'V', 'I', 'I', 'IV', 'V', 'vi', 'vi'], weight: 5 }],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [16], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
  ],
  bass: [
    /**
     * The wobble. Numeric tones, because it is a shape.
     *
     * **Two of its four movements are one note each now.** The root at 4 used to
     * be answered by a −5 struck at 6, and the root at 12 by a ♭3 struck at 14;
     * both are a single note that travels. `glideTime: 0.5` is the arithmetic of
     * that sentence rather than a taste — half of a four-sixteenth note is two
     * sixteenths, so the destination arrives on exactly the slot the deleted
     * onset stood on and holds for the rest of the note. **The contour the table
     * drew is unchanged to the sixteenth; the only thing gone is the second
     * attack**, which is what a sub in this idiom does and what the two-struck-
     * note spelling could not say. It is a slower number than `acid`'s 0.25 for
     * a reason that is about the two records rather than about the field: a 303
     * slide is an articulation and is over before it is heard as movement, and
     * this is movement — the whole point of the sub is the ear following it down.
     *
     * **The two dips at 3 and 11 stay struck, and that is a refusal worth
     * recording.** Their shape is a root held for three sixteenths that *then*
     * drops, so the movement is at the far end of the note — the one placement
     * `NoteBend` argues about and rejects, because superdough's pitch envelope
     * has no delay stage. Adopted anyway, the bar would lose its root outright: a
     * glide starts at the onset, so a note travelling down from slot 0 never sits
     * on the root, and the root of the bar is what a sub is *for*. Same answer in
     * `sub-and-skank`, whose one touching pair would put the arrival on beat 3
     * under the kick, where this bass is anchoring rather than travelling.
     *
     * **One thing the glide made visible rather than caused**, worth recording
     * where the next reader of this table will be standing: `swing: 0.14` pushes
     * the dips at 3 and 11 late enough to overrun the note behind them, and
     * `render/midi.ts` marks any file where a bending note overlaps another,
     * because a pitch bend addresses the channel and would drag the overrun with
     * it. Measured over 60 songs, this style's bass carried **75 overlapping
     * pairs before the glide and 79 after** — the collision is the feel pass and
     * is as old as the table; what changed is that one of the two notes now
     * travels, so the .mid says so out loud instead of the overlap passing
     * unremarked. The audition is unaffected: a pitch envelope is per event.
     */
    { name: 'wobble', weight: 7, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 }, { at: 3, dur: 1, tone: -5, vel: 0.7 },
      { at: 4, dur: 4, tone: 0, vel: 0.84, glide: -5, glideTime: 0.5 },
      { at: 8, dur: 3, tone: 0, vel: 0.96 }, { at: 11, dur: 1, tone: -5, vel: 0.7 },
      { at: 12, dur: 4, tone: 0, vel: 0.86, glide: 3, glideTime: 0.5 },
    ] },
    { name: 'sub-and-skank', weight: 5, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 }, { at: 6, dur: 2, tone: 0, vel: 0.76 },
      { at: 8, dur: 4, tone: -2, vel: 0.9 }, { at: 14, dur: 2, tone: 0, vel: 0.78 },
    ] },
    { name: 'offbeat-sub', weight: 4, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.92 }, { at: 6, dur: 2, tone: 'root', vel: 0.84 },
      { at: 10, dur: 2, tone: 'octave', vel: 0.86 }, { at: 14, dur: 2, tone: 'root', vel: 0.84 },
    ] },
  ],
  comp: [
    { name: 'organ-stab', weight: 6, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.68 }, { at: 6, dur: 2, vel: 0.78 },
      { at: 10, dur: 2, vel: 0.7 }, { at: 14, dur: 2, vel: 0.86 },
    ] },
    { name: 'chopped-chords', weight: 5, voices: 3, hits: [
      { at: 3, dur: 1, vel: 0.8 }, { at: 6, dur: 1, vel: 0.66 },
      { at: 7, dur: 1, vel: 0.84 }, { at: 11, dur: 1, vel: 0.72 }, { at: 15, dur: 1, vel: 0.88 },
    ] },
  ],
  drums: [
    { name: 'four-with-skip', weight: 6, voices: {
      bd: [0, 4, 8, 12], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], oh: [6, 14],
    }, ghosts: { hh: [1, 3, 5, 7, 9, 11, 13, 15], sd: [11, 15] } },
    { name: 'four-and-rim', weight: 5, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], rim: [7, 11, 15], hh: [2, 6, 10, 14],
    }, ghosts: { hh: [0, 4, 8, 12] } },
  ],
  melody: { leap: 0.28, ornament: 0.12, span: 11, sequence: 0.7, syncopation: 0.6 },
};

/**
 * UK GARAGE — 1999. Two-step, and the kick is missing on purpose.
 *
 * The one style in this file whose kit pattern is not four on the floor, and
 * that is the whole of it: 2-step takes the kick off beats two and three, keeps
 * the snare on the backbeat, and shuffles the sixteenths hard. What is left is a
 * groove with a hole in it that the bass and the chopped vocal fall into, and the
 * hole is what everybody means by the name.
 *
 * **`swing: 0.3` is the largest approximation in this file and it is the wrong
 * unit.** `Style.swing` delays the second half of a *beat*; 2-step shuffles the
 * second and fourth *sixteenth*, which is a different subdivision and is the
 * genre's actual signature. `docs/engine-gaps.md` §3.18 records rnb reaching the
 * same wall on new jack swing and writing 0.16 as "the nearest honest object".
 * This is the same object at twice the size and it is still not the thing: the
 * figure comes out with the eighths lolloping where the sixteenths should be
 * skipping. Two genres, three styles, one missing field.
 */
const ukgarage: Style = {
  id: 'ukgarage',
  label: 'UK garage (1999)',
  description:
    'Two-step: the kick gone from the middle of the bar, the sixteenths shuffled hard, and a chopped vocal in the hole.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.3,
  bpm: [130, 138],
  hook: 'catchy',
  excludeLayers: ['brass'],
  transitions: [['fill', 4], ['break', 3], ['elide', 1]],
  drops: [['none', 2], ['breakdown', 1]],
  modeWeights: { minor: 0.7, major: 0.3 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'iv9', 'iv9'], weight: 5 }],
    verse: [
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9'], weight: 6 },
      { chords: ['i9', 'i9', 'VII7', 'VII7', 'VImaj7', 'VImaj7', 'VII7', 'VII7'], weight: 5 },
      { chords: ['i11', 'i11', 'i11', 'i11', 'iv9', 'iv9', 'iv9', 'iv9'], weight: 4 },
    ],
    chorus: [
      { chords: ['VImaj7', 'VII7', 'i9', 'i9', 'VImaj7', 'VII7', 'i9', 'i9'], weight: 6 },
      { chords: ['iv9', 'iv9', 'VImaj7', 'VImaj7', 'VII7', 'VII7', 'i9', 'i9'], weight: 5 },
    ],
    bridge: [{ chords: ['VImaj7', 'VImaj7', 'IIImaj7', 'IIImaj7', 'iv9', 'iv9', 'VII7', 'VII7'], weight: 4 }],
    outro: [{ chords: ['i9', 'i9', 'iv9', 'iv9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['Imaj9', 'Imaj9', 'ii9', 'ii9', 'IVmaj9', 'IVmaj9', 'V7sus4', 'V7sus4'], weight: 5 }],
    chorus: [{ chords: ['IVmaj9', 'V7', 'iii9', 'vi9', 'IVmaj9', 'V7', 'Imaj9', 'Imaj9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [2, 2, 4, 8], weight: 5 },
    { cell: [-2, 2, 4, 4, 4], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [3, 1, 4, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    /** The hole is on beats two and three, and the bass fills it. */
    { name: 'two-step-sub', weight: 7, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.96 }, { at: 5, dur: 2, tone: 'root', vel: 0.78 },
      { at: 8, dur: 2, tone: 'octave', vel: 0.84 }, { at: 11, dur: 1, tone: 'root', vel: 0.7 },
      { at: 13, dur: 3, tone: 'seventh', vel: 0.8 },
    ] },
    { name: 'skipping-sub', weight: 5, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.94 }, { at: 3, dur: 2, tone: 'root', vel: 0.72 },
      { at: 6, dur: 2, tone: 'fifth', vel: 0.8 }, { at: 10, dur: 2, tone: 'root', vel: 0.86 },
      { at: 14, dur: 2, tone: 'octave', vel: 0.74 },
    ] },
  ],
  comp: [
    { name: 'chopped-stab', weight: 6, voices: 4, hits: [
      { at: 3, dur: 1, vel: 0.78 }, { at: 6, dur: 2, vel: 0.66 },
      { at: 11, dur: 1, vel: 0.8 }, { at: 14, dur: 2, vel: 0.72 },
    ] },
    { name: 'rhodes-offbeat', weight: 5, voices: 4, hits: [
      { at: 2, dur: 2, vel: 0.64 }, { at: 6, dur: 2, vel: 0.72 },
      { at: 10, dur: 2, vel: 0.66 }, { at: 14, dur: 2, vel: 0.8 },
    ] },
  ],
  drums: [
    /**
     * Two-step proper. The kick states one and the "and" of three and nothing
     * else, the snare keeps the backbeat, and the hats carry the shuffle. Ghosts
     * on both — the machine's accent row, and this is the pattern where it does
     * the most work, because the skip is entirely a matter of which sixteenths
     * are loud.
     */
    { name: 'two-step', weight: 7, voices: {
      bd: [0, 10], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], oh: [6],
    }, ghosts: { hh: [1, 3, 5, 7, 9, 11, 13, 15], sd: [7, 15] } },
    { name: 'two-step-shuffle', weight: 5, voices: {
      bd: [0, 6, 11], sd: [4, 12], rim: [7, 15], hh: [2, 6, 10, 14],
    }, ghosts: { hh: [0, 4, 8, 12], sd: [3, 11] } },
    { name: 'four-to-floor-garage', weight: 3, voices: {
      bd: [0, 4, 8, 12], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { hh: [1, 3, 5, 7, 9, 11, 13, 15] } },
  ],
  melody: { leap: 0.34, ornament: 0.2, span: 13, sequence: 0.5, syncopation: 0.75 },
};

/**
 * HARD HOUSE — 1996. The bass is on the offbeat and it is louder than the kick.
 *
 * The British and Dutch strand — Tony De Vit, Tidy Trax, the harder end of what
 * got called handbag. Two devices define it and both are exaggerations of things
 * the rest of this file does gently: the **offbeat bass stab**, played by a
 * detuned saw at nearly the kick's level so that the record has eight events a
 * bar rather than four, and the **hoover**, which is a Roland Alpha Juno preset
 * that everybody used and which is the loudest single sound in this genre.
 *
 * The tempo is at the top of the house half. `brass` is doing real work here —
 * the hoover stab lives on that layer, and this is one of the few styles in the
 * genre where the layer is not vestigial.
 */
const hardhouse: Style = {
  id: 'hardhouse',
  label: 'Hard house (1996)',
  description:
    'An offbeat saw bass as loud as the kick, a hoover stab, and eight events a bar where everything else has four.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [138, 148],
  hook: 'earworm',
  transitions: [['fill', 5], ['break', 4]],
  drops: [['none', 2], ['breakdown', 2]],
  modeWeights: { minor: 0.86, major: 0.14 },
  relativeMajorChorus: 0,
  shots: [[[0, 6, 10], 3], [[0, 4, 8, 12], 2], [[0, 6, 12], 2]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 6 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 },
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'iv', 'iv'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 7 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 5 },
      { chords: ['iv', 'VII', 'i', 'i', 'iv', 'VII', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'iv', 'iv', 'VII', 'VII', 'VII', 'VII'], weight: 4 }],
    outro: [{ chords: ['i', 'VII', 'VI', 'VII'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'IV', 'IV'], weight: 5 }],
    chorus: [{ chords: ['IV', 'V', 'I', 'I', 'IV', 'V', 'vi', 'vi'], weight: 5 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [16], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
  ],
  bass: [
    /** The offbeat stab, at nearly the kick's level. Eight events a bar. */
    { name: 'offbeat-stab-bass', weight: 7, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 1 }, { at: 6, dur: 2, tone: 'root', vel: 0.96 },
      { at: 10, dur: 2, tone: 'root', vel: 1 }, { at: 14, dur: 2, tone: 'root', vel: 0.96 },
    ] },
    { name: 'offbeat-with-octave', weight: 5, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 1 }, { at: 6, dur: 2, tone: 'octave', vel: 0.86 },
      { at: 10, dur: 2, tone: 'root', vel: 0.98 }, { at: 14, dur: 2, tone: 'seventh', vel: 0.88 },
    ] },
    { name: 'rolling-eighths', weight: 4, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.94 }, { at: 2, dur: 2, tone: 'root', vel: 0.9 },
      { at: 4, dur: 2, tone: 'root', vel: 0.88 }, { at: 6, dur: 2, tone: 'root', vel: 0.9 },
      { at: 8, dur: 2, tone: 'root', vel: 0.94 }, { at: 10, dur: 2, tone: 'root', vel: 0.9 },
      { at: 12, dur: 2, tone: 'octave', vel: 0.88 }, { at: 14, dur: 2, tone: 'root', vel: 0.92 },
    ] },
  ],
  comp: [
    { name: 'hoover-stab', weight: 6, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.92 }, { at: 6, dur: 2, vel: 0.78 }, { at: 12, dur: 3, vel: 0.88 },
    ] },
    { name: 'offbeat-stab', weight: 5, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.8 },
      { at: 10, dur: 2, vel: 0.72 }, { at: 14, dur: 2, vel: 0.9 },
    ] },
  ],
  drums: [
    { name: 'hard-four', weight: 7, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], oh: [2, 6, 10, 14], hh: [0, 4, 8, 12],
    } },
    { name: 'four-with-roll', weight: 5, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14], cr: [0],
    }, ghosts: { hh: [1, 3, 5, 7, 9, 11, 13, 15] } },
    { name: 'donk', weight: 4, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], cb: [2, 6, 10, 14], oh: [14],
    } },
  ],
  melody: { leap: 0.3, ornament: 0.08, span: 11, sequence: 0.8, syncopation: 0.4 },
};

/**
 * PROGRESSIVE HOUSE — 1994. Twelve minutes, and the composition is the
 * arrangement.
 *
 * Leftfield, Sasha's early records, the Guerrilla and Cowboy catalogues. This is
 * the style that is *most* what `index.ts` claims the genre is: there is no
 * form in any sense pop would recognise, no chorus that arrives, and no melody
 * that develops. What happens instead is that over twelve minutes eleven things
 * enter and seven of them leave, and the shape of that is the piece.
 *
 * **It is therefore the style that most needs `Chart.exits`**, and the one where
 * the field's absence would have been most visible. A progressive record whose
 * layers only ever accumulate is a record that has misunderstood itself: the
 * whole gesture is that the thing you have been listening to for four minutes
 * stops, and what is left underneath turns out to have been the record all along.
 *
 * `drops: [['none', 2], ['breakdown', 3]]` puts a breakdown in three numbers out
 * of five, and `filter: { depth: 0.6, shape: 'ramp' }` supplies what the tempo
 * ramp cannot — see `index.ts` on the missing build.
 */
const progressive: Style = {
  id: 'progressive',
  label: 'Progressive house (1994)',
  description:
    'Twelve minutes in which eleven things enter and seven leave. No chorus, no tune, and the arrangement is the composition.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [124, 132],
  hook: 'catchy',
  filter: { depth: 0.6, shape: 'ramp' },
  breakCarrier: 'pad',
  transitions: [['fill', 3], ['break', 4], ['elide', 2]],
  drops: [['none', 2], ['breakdown', 3]],
  modeWeights: { minor: 0.82, major: 0.18 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 6 }],
    verse: [
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 6 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'VII', 'VII', 'VII', 'VII'], weight: 5 },
      { chords: ['i9', 'i9', 'VImaj7', 'VImaj7', 'i9', 'i9', 'VImaj7', 'VImaj7'], weight: 4 },
    ],
    chorus: [
      { chords: ['VImaj7', 'VImaj7', 'VII', 'VII', 'i9', 'i9', 'i9', 'i9'], weight: 6 },
      { chords: ['iv9', 'iv9', 'VII', 'VII', 'IIImaj7', 'IIImaj7', 'VII', 'VII'], weight: 5 },
      { chords: ['i9', 'i9', 'VII', 'VII', 'VImaj7', 'VImaj7', 'VII', 'VII'], weight: 4 },
    ],
    bridge: [
      { chords: ['VImaj7', 'VImaj7', 'VImaj7', 'VImaj7', 'iv9', 'iv9', 'iv9', 'iv9'], weight: 4 },
    ],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 6 }],
    chorus: [{ chords: ['IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'vi9', 'vi9', 'IVmaj9', 'IVmaj9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 5 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [-8, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    { name: 'rolling-offbeat', weight: 6, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.86 }, { at: 6, dur: 2, tone: 'root', vel: 0.78 },
      { at: 10, dur: 2, tone: 'root', vel: 0.84 }, { at: 14, dur: 2, tone: 'root', vel: 0.78 },
    ] },
    { name: 'sixteenth-roll', weight: 5, hits: [
      { at: 2, dur: 1, tone: 'root', vel: 0.8 }, { at: 3, dur: 1, tone: 'root', vel: 0.62 },
      { at: 6, dur: 1, tone: 'root', vel: 0.82 }, { at: 7, dur: 1, tone: 'root', vel: 0.62 },
      { at: 10, dur: 1, tone: 'octave', vel: 0.8 }, { at: 11, dur: 1, tone: 'root', vel: 0.62 },
      { at: 14, dur: 1, tone: 'root', vel: 0.84 }, { at: 15, dur: 1, tone: 'root', vel: 0.66 },
    ] },
    { name: 'sustained-sub', weight: 4, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.84 },
    ] },
  ],
  comp: [
    { name: 'long-chords', weight: 6, voices: 4, sustain: true, hits: [
      { at: 0, dur: 8, vel: 0.6 }, { at: 8, dur: 8, vel: 0.58 },
    ] },
    { name: 'pumped-eighths', weight: 5, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.56 }, { at: 6, dur: 2, vel: 0.68 },
      { at: 10, dur: 2, vel: 0.6 }, { at: 14, dur: 2, vel: 0.78 },
    ] },
    /** A ten-sixteenth figure over a sixteen-sixteenth bar. It comes home every
     *  five bars, which over a twelve-minute record is exactly the kind of very
     *  slow disagreement this style is built out of. See `Cycle`. */
    { name: 'ten-cycle-arp', weight: 4, voices: 1, cycle: 10, arpeggio: true, arpDirection: 'updown', arpOctaves: 2, hits: [
      { at: 0, dur: 1 }, { at: 2, dur: 1 }, { at: 4, dur: 1 }, { at: 6, dur: 1 }, { at: 8, dur: 1 },
    ] },
  ],
  drums: [
    { name: 'four-and-shaker', weight: 6, voices: {
      bd: [0, 4, 8, 12], cp: [12], sh: [0, 2, 4, 6, 8, 10, 12, 14], hh: [2, 6, 10, 14],
    }, ghosts: { sh: [1, 3, 5, 7, 9, 11, 13, 15] } },
    { name: 'four-and-perc', weight: 5, voices: {
      bd: [0, 4, 8, 12], rim: [4, 12], perc: [3, 7, 11, 15], hh: [2, 6, 10, 14],
    }, ghosts: { hh: [0, 8] } },
    { name: 'tight-four', weight: 4, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], oh: [14],
    }, ghosts: { hh: [1, 3, 5, 7, 9, 11, 13, 15] } },
  ],
  melody: { leap: 0.26, ornament: 0.1, span: 11, sequence: 0.72, syncopation: 0.35 },
};

/**
 * TRANCE — 1997. The record is the breakdown.
 *
 * **This is `DROPS.breakdown`'s intended author** and the reason the shape was
 * reserved. `docs/engine-gaps.md` §8 sets out the requirement precisely — "a
 * dance record with a wash, on a form long enough for three four-bar phrases" —
 * and states that no such style existed, because every dance record in the
 * catalogue was built on eight-bar sections and placed 0 of 30. This genre's
 * forms are on sixteens and thirty-twos and this style is the one that is
 * *architecturally* the gesture: everything stops, a pad and an arpeggio are
 * left, and eight bars later the whole thing arrives at once.
 *
 * So `drops: [['none', 1], ['breakdown', 3]]` is the heaviest opt-in anywhere in
 * the catalogue — three numbers in four — and it is not enthusiasm. A trance
 * record without one is a trance record that failed.
 *
 * `requireLayers: ['pad']` follows from it and the trade is the one `pop/dancepop`
 * recorded: a required layer cannot be taken away by `planExits`, so this is the
 * one style in the genre whose last statement never strips. That is correct here
 * — a trance record's ending adds rather than thins — and it is also what
 * guarantees the drop's witness is present, since `DROPS.breakdown` is heard
 * against the wash and refuses to place without one.
 *
 * The other half of the style is the arpeggio, and `counterMode: 'ostinato'` says
 * so: a sixteenth arpeggio running continuously against the chords rather than
 * answering anything. It is `synth/berlin`'s device at a different tempo and with
 * a kick under it, which is worth admitting rather than hiding — see `index.ts`
 * on where the line with synth actually falls.
 */
const trance: Style = {
  id: 'trance',
  label: 'Trance (1997)',
  description:
    'Everything stops, a pad and an arpeggio are left, and eight bars later the whole record arrives at once.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [134, 142],
  hook: 'earworm',
  requireLayers: ['pad'],
  filter: { depth: 0.55, shape: 'ramp' },
  breakCarrier: 'pad',
  transitions: [['fill', 4], ['break', 5]],
  drops: [['none', 1], ['breakdown', 3]],
  modeWeights: { minor: 0.7, major: 0.3 },
  relativeMajorChorus: 0,
  counterMode: 'ostinato',
  counterPatterns: [
    { name: 'sixteenth-arp', weight: 5, voices: 1, cycle: 16, arpeggio: true, arpDirection: 'updown', arpOctaves: 2, hits: [
      { at: 0, dur: 1 }, { at: 1, dur: 1 }, { at: 2, dur: 1 }, { at: 3, dur: 1 },
      { at: 4, dur: 1 }, { at: 5, dur: 1 }, { at: 6, dur: 1 }, { at: 7, dur: 1 },
      { at: 8, dur: 1 }, { at: 9, dur: 1 }, { at: 10, dur: 1 }, { at: 11, dur: 1 },
      { at: 12, dur: 1 }, { at: 13, dur: 1 }, { at: 14, dur: 1 }, { at: 15, dur: 1 },
    ] },
    /** Twelve steps against sixteen. The arpeggio and the bar come back together
     *  every three bars, which is the shimmer everybody remembers and nobody can
     *  count. */
    { name: 'twelve-arp', weight: 4, voices: 1, cycle: 12, arpeggio: true, arpDirection: 'up', arpOctaves: 2, hits: [
      { at: 0, dur: 1 }, { at: 1, dur: 1 }, { at: 2, dur: 1 }, { at: 3, dur: 1 },
      { at: 4, dur: 1 }, { at: 5, dur: 1 }, { at: 6, dur: 1 }, { at: 7, dur: 1 },
      { at: 8, dur: 1 }, { at: 9, dur: 1 }, { at: 10, dur: 1 }, { at: 11, dur: 1 },
    ] },
  ],
  progressions: {
    intro: [{ chords: ['i', 'i', 'VI', 'VI'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 6 },
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'VI', 'VI'], weight: 5 },
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'III', 'III'], weight: 7 },
      { chords: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'III', 'VII'], weight: 6 },
      { chords: ['iv', 'VI', 'VII', 'i', 'iv', 'VI', 'VII', 'i'], weight: 4 },
    ],
    bridge: [
      { chords: ['VI', 'VI', 'VI', 'VI', 'iv', 'iv', 'VII', 'VII'], weight: 5, note: 'The breakdown, harmonically: a long time on the ♭VI with nothing under it' },
    ],
    outro: [{ chords: ['i', 'VI', 'III', 'VII'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'V', 'V', 'vi', 'vi', 'IV', 'IV'], weight: 5 }],
    chorus: [{ chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'V'], weight: 6 }],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [16], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 4 },
  ],
  bass: [
    { name: 'rolling-offbeat', weight: 7, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.9 }, { at: 6, dur: 2, tone: 'root', vel: 0.84 },
      { at: 10, dur: 2, tone: 'root', vel: 0.88 }, { at: 14, dur: 2, tone: 'root', vel: 0.84 },
    ] },
    { name: 'sixteenth-roll', weight: 5, hits: [
      { at: 2, dur: 1, tone: 'root', vel: 0.84 }, { at: 3, dur: 1, tone: 'root', vel: 0.66 },
      { at: 6, dur: 1, tone: 'root', vel: 0.84 }, { at: 7, dur: 1, tone: 'root', vel: 0.66 },
      { at: 10, dur: 1, tone: 'root', vel: 0.84 }, { at: 11, dur: 1, tone: 'root', vel: 0.66 },
      { at: 14, dur: 1, tone: 'root', vel: 0.88 }, { at: 15, dur: 1, tone: 'root', vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'held-supersaw', weight: 6, voices: 4, sustain: true, hits: [
      { at: 0, dur: 8, vel: 0.66 }, { at: 8, dur: 8, vel: 0.64 },
    ] },
    { name: 'gated-chords', weight: 5, voices: 4, hits: [
      { at: 0, dur: 1, vel: 0.6 }, { at: 2, dur: 1, vel: 0.72 }, { at: 4, dur: 1, vel: 0.62 },
      { at: 6, dur: 1, vel: 0.78 }, { at: 8, dur: 1, vel: 0.62 }, { at: 10, dur: 1, vel: 0.74 },
      { at: 12, dur: 1, vel: 0.64 }, { at: 14, dur: 1, vel: 0.84 },
    ] },
  ],
  drums: [
    { name: 'trance-four', weight: 7, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], oh: [2, 6, 10, 14], hh: [0, 4, 8, 12],
    }, ghosts: { hh: [1, 3, 5, 7, 9, 11, 13, 15] } },
    { name: 'four-and-ride', weight: 5, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], rd: [0, 2, 4, 6, 8, 10, 12, 14], cr: [0],
    }, ghosts: { rd: [1, 3, 5, 7, 9, 11, 13, 15] } },
    { name: 'rolling-four', weight: 4, voices: {
      bd: [0, 4, 8, 12], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], oh: [6, 14],
    }, ghosts: { hh: [1, 3, 5, 7, 9, 11, 13, 15] } },
  ],
  melody: { leap: 0.34, ornament: 0.12, span: 14, sequence: 0.75, syncopation: 0.3 },
};

/**
 * TECH HOUSE — 2003. The tempo of house and the parts of techno.
 *
 * The one style whose whole content is a *compromise between two others*, which
 * would normally be an argument against it existing. It survives because the
 * compromise was made by a scene rather than by a table: from about 2000 the
 * records that filled the middle of a set were house-tempo and house-swung with
 * a techno record's part count, and the resulting sound is stable enough to have
 * had its own labels for twenty years.
 *
 * The tables express it as an actual midpoint rather than as a description: the
 * tempo band is `deep`'s, the drum patterns are `minimal`'s with a clap added,
 * the bass is `chicago`'s offbeat root, and there is no melodic material to speak
 * of. What it does have that neither parent does is a *rolling* percussion layer
 * that never stops, which is why `drumFills` is left on where `minimal` turns it
 * off: a tech house record does announce its sections, just barely.
 */
const techhouse: Style = {
  id: 'techhouse',
  label: 'Tech house (2003)',
  description:
    'House tempo, techno parts, and a rolling percussion layer that never stops. The middle of somebody\'s set.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.08,
  bpm: [122, 128],
  hook: 'earworm',
  excludeLayers: ['brass'],
  filter: { depth: 0.45, shape: 'step' },
  transitions: [['fill', 3], ['break', 3], ['elide', 1]],
  drops: [['none', 3], ['dub', 1]],
  modeWeights: { minor: 0.9, major: 0.1 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 6 }],
    verse: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 8 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'VII', 'VII', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 6 },
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9'], weight: 5 },
    ],
    bridge: [{ chords: ['iv9', 'iv9', 'iv9', 'iv9', 'i9', 'i9', 'i9', 'i9'], weight: 4 }],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7', 'I7'], weight: 6 }],
    chorus: [{ chords: ['I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'IV7', 'IV7'], weight: 5 }],
  },
  melodyCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 4 },
    { cell: [-8, 8], weight: 3 },
    { cell: [-4, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'offbeat-root', weight: 7, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.88 }, { at: 6, dur: 2, tone: 'root', vel: 0.8 },
      { at: 10, dur: 2, tone: 'root', vel: 0.86 }, { at: 14, dur: 2, tone: 'root', vel: 0.8 },
    ] },
    { name: 'clipped-sixteenths', weight: 5, hits: [
      { at: 2, dur: 1, tone: 'root', vel: 0.86 }, { at: 3, dur: 1, tone: 'root', vel: 0.6 },
      { at: 6, dur: 2, tone: 'root', vel: 0.8 },
      { at: 10, dur: 1, tone: 'root', vel: 0.86 }, { at: 11, dur: 1, tone: 'octave', vel: 0.62 },
      { at: 14, dur: 2, tone: 'root', vel: 0.82 },
    ] },
  ],
  comp: [
    { name: 'clipped-stab', weight: 6, voices: 3, hits: [
      { at: 6, dur: 1, vel: 0.66 }, { at: 14, dur: 1, vel: 0.8 },
    ] },
    { name: 'offbeat-stab', weight: 5, voices: 3, hits: [
      { at: 2, dur: 1, vel: 0.56 }, { at: 6, dur: 1, vel: 0.68 },
      { at: 10, dur: 1, vel: 0.6 }, { at: 14, dur: 1, vel: 0.8 },
    ] },
  ],
  drums: [
    { name: 'rolling-perc', weight: 7, voices: {
      bd: [0, 4, 8, 12], cp: [12], rim: [4],
      hh: [0, 2, 4, 6, 8, 10, 12, 14], perc: [3, 7, 11, 15],
    }, ghosts: { hh: [1, 5, 9, 13] } },
    { name: 'shaker-roll', weight: 5, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], sh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sh: [1, 3, 5, 7, 9, 11, 13, 15] } },
    { name: 'tight-four', weight: 4, voices: {
      bd: [0, 4, 8, 12], rim: [4, 12], hh: [2, 6, 10, 14], oh: [14],
    } },
  ],
  melody: { leap: 0.2, ornament: 0.06, span: 8, sequence: 0.88, syncopation: 0.4 },
};

/**
 * DETROIT TECHNO — 1990. Minor, modal, and a string line with nobody behind it.
 *
 * Derrick May, Carl Craig, Underground Resistance, the second wave. The style
 * that supplies the word *techno* to everything after it, and the one where the
 * distance from `chicago` is largest despite the two being ninety minutes apart
 * by road: Chicago is a party record and this is a *composed* one, with a string
 * line over it that would not be out of place in a film cue, played on a
 * borrowed Ensoniq by somebody who could not afford a real string section and
 * did not want one.
 *
 * **This is where the genre comes closest to synth, and the difference is worth
 * stating rather than hiding.** A Detroit record and a `synth/cosmic` record are
 * both four-on-the-floor with a sixteenth figure and a melancholy modal top line.
 * What separates them is what the record is *for*: `cosmic` is a piece that
 * develops toward a final statement lifted a tone with everything on it, and this
 * is eight bars that a DJ is going to lay another eight bars over. The fields say
 * so — `keyChangeChance` is 0 in every era here and non-zero in every era there;
 * this genre has no `SoloProfile` and that one's lead break is its climax; the
 * form here has no chorus that arrives.
 *
 * `melodyCells` runs long, `melody.span` is 14 — the second widest here after
 * `garage`'s — and `ornament` is the highest on the techno half of the file.
 * There is a tune. It just does not go anywhere, on purpose.
 */
const detroit: Style = {
  id: 'detroit',
  label: 'Detroit techno (1990)',
  description:
    'Minor, modal, and a string line over the top played by somebody who could not afford strings and did not want them.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.05,
  bpm: [126, 136],
  hook: 'catchy',
  boxDrums: false,
  filter: { depth: 0.5, shape: 'step' },
  breakCarrier: 'pad',
  transitions: [['fill', 3], ['break', 3], ['elide', 1]],
  drops: [['none', 3], ['breakdown', 1]],
  modeWeights: { minor: 0.92, major: 0.08 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }, { chords: ['i', 'i', 'VI', 'VI'], weight: 3 }],
    verse: [
      { chords: ['i9', 'i9', 'i9', 'i9', 'VI', 'VI', 'VI', 'VI'], weight: 6, note: 'The tonic and the ♭VI, four bars each. The single most recognisable harmonic move in this style and the reason it reads as sad rather than as dark' },
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['i9', 'i9', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['i9', 'i9', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 6 },
      { chords: ['iv9', 'iv9', 'VI', 'VI', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i9', 'i9', 'i9', 'i9'], weight: 4 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'VI', 'VI', 'iv9', 'iv9', 'iv9', 'iv9'], weight: 4 }],
    outro: [{ chords: ['i9', 'i9', 'VI', 'VI'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'vi9', 'vi9', 'vi9', 'vi9'], weight: 5 }],
    chorus: [{ chords: ['IVmaj9', 'IVmaj9', 'iii9', 'iii9', 'vi9', 'vi9', 'ii9', 'ii9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [-2, 6, 8], weight: 3 },
    { cell: [4, 2, 2, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 4 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'offbeat-root', weight: 6, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.88 }, { at: 6, dur: 2, tone: 'root', vel: 0.8 },
      { at: 10, dur: 2, tone: 'root', vel: 0.86 }, { at: 14, dur: 2, tone: 'seventh', vel: 0.8 },
    ] },
    /** A two-bar riff, which is what a bass line is when it answers its own first
     *  half. `cycle: 32` — see `Cycle`, and `synth/machine`, which makes the same
     *  argument about Kraftwerk. */
    { name: 'two-bar-riff', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 2, tone: 0, vel: 0.94 }, { at: 4, dur: 2, tone: 0, vel: 0.76 },
      { at: 7, dur: 1, tone: 10, vel: 0.72 }, { at: 10, dur: 2, tone: 12, vel: 0.82 },
      { at: 14, dur: 2, tone: 0, vel: 0.78 },
      { at: 16, dur: 2, tone: 0, vel: 0.92 }, { at: 20, dur: 2, tone: 3, vel: 0.76 },
      { at: 23, dur: 1, tone: 5, vel: 0.72 }, { at: 26, dur: 2, tone: 7, vel: 0.82 },
      { at: 30, dur: 2, tone: 0, vel: 0.78 },
    ] },
    { name: 'sustained-sub', weight: 4, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.84 },
    ] },
  ],
  comp: [
    { name: 'string-stab', weight: 6, voices: 4, hits: [
      { at: 0, dur: 3, vel: 0.72 }, { at: 6, dur: 2, vel: 0.62 },
      { at: 8, dur: 3, vel: 0.7 }, { at: 14, dur: 2, vel: 0.66 },
    ] },
    { name: 'held-strings', weight: 5, voices: 4, sustain: true, hits: [
      { at: 0, dur: 8, vel: 0.62 }, { at: 8, dur: 8, vel: 0.6 },
    ] },
    { name: 'offbeat-stab', weight: 4, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.58 }, { at: 6, dur: 2, vel: 0.68 },
      { at: 10, dur: 2, vel: 0.62 }, { at: 14, dur: 2, vel: 0.78 },
    ] },
  ],
  drums: [
    { name: '909-detroit', weight: 6, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], rim: [6, 14], hh: [2, 6, 10, 14],
    }, ghosts: { hh: [0, 4, 8, 12] } },
    { name: 'ride-and-clap', weight: 5, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], rd: [0, 2, 4, 6, 8, 10, 12, 14], perc: [7, 15],
    }, ghosts: { rd: [1, 3, 5, 7, 9, 11, 13, 15] } },
    { name: 'sixteenth-hats', weight: 4, voices: {
      bd: [0, 4, 8, 12], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], oh: [14],
    }, ghosts: { hh: [1, 3, 5, 7, 9, 11, 13, 15] } },
  ],
  melody: { leap: 0.36, ornament: 0.16, span: 14, sequence: 0.62, syncopation: 0.4 },
};

/**
 * BLEEP — 1989. A sine wave and a sub, and nothing in the middle.
 *
 * Sheffield and Leeds: LFO, Unique 3, Nightmares on Wax's first records, the
 * first two years of Warp. The style is a *frequency* claim rather than a
 * rhythmic one, and that is what makes it a style: the record is a very low sine
 * bass and a set of very high sine tones, with the entire midrange deliberately
 * empty. Played on a sound system built for reggae, which is where the idea came
 * from, the effect is that the room shakes and nothing is audible in the register
 * where music usually lives.
 *
 * The tables say it by giving the melody a `span` of 24 — by far the widest in
 * the file, and it is not a tune with range, it is a tune that jumps octaves
 * because the *middle is not allowed*. `excludeLayers: ['pad', 'brass']` empties
 * the midrange from the other side. This is the one style here where the melodic
 * span number is doing structural work rather than describing a character.
 */
const bleep: Style = {
  id: 'bleep',
  label: 'Bleep (1989)',
  description:
    'A very low sine and a set of very high ones, with the whole midrange left out. Built for a reggae sound system.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.06,
  bpm: [120, 130],
  hook: 'earworm',
  excludeLayers: ['pad', 'brass'],
  transitions: [['fill', 3], ['break', 4]],
  modeWeights: { minor: 0.9, major: 0.1 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 6 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 9 },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 7 },
      { chords: ['i', 'i', 'VI', 'VI', 'i', 'i', 'VI', 'VI'], weight: 3 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'VI', 'VI', 'i', 'i', 'i', 'i'], weight: 4 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'bVII', 'bVII'], weight: 5 }],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [-8, 4, 4], weight: 3 },
    { cell: [16], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    /**
     * The sub. Long, low, and nearly the only thing under 200 Hz on the record —
     * which on a reggae rig is the entire experience. `sustain: true` because a
     * re-articulated sub is a pulse and this is a *tone*.
     */
    { name: 'long-sub', weight: 7, sustain: true, hits: [
      { at: 0, dur: 12, tone: 'root', vel: 1 }, { at: 12, dur: 4, tone: 'seventh', vel: 0.84 },
    ] },
    { name: 'sub-and-fifth', weight: 5, sustain: true, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 1 }, { at: 8, dur: 6, tone: 'fifth', vel: 0.86 },
      { at: 14, dur: 2, tone: 'root', vel: 0.8 },
    ] },
    { name: 'dub-sub', weight: 4, hits: [
      { at: 0, dur: 6, tone: 'root', vel: 1 }, { at: 10, dur: 4, tone: 'root', vel: 0.9 },
    ] },
  ],
  comp: [
    { name: 'bleep-tones', weight: 6, voices: 1, cycle: 12, arpeggio: true, arpDirection: 'up', arpOctaves: 2, hits: [
      { at: 0, dur: 2, vel: 0.8 }, { at: 4, dur: 2, vel: 0.66 }, { at: 8, dur: 2, vel: 0.74 },
    ] },
    { name: 'sparse-bleeps', weight: 5, voices: 1, arpeggio: true, arpDirection: 'updown', arpOctaves: 2, hits: [
      { at: 2, dur: 1, vel: 0.8 }, { at: 6, dur: 1, vel: 0.7 },
      { at: 11, dur: 1, vel: 0.76 }, { at: 14, dur: 1, vel: 0.68 },
    ] },
  ],
  drums: [
    { name: 'sparse-four', weight: 6, voices: {
      bd: [0, 4, 8, 12], cp: [12], hh: [2, 6, 10, 14],
    }, ghosts: { hh: [0, 4, 8, 12] } },
    { name: 'four-and-rim', weight: 5, voices: {
      bd: [0, 4, 8, 12], rim: [4, 12], oh: [6, 14], hh: [0, 2, 8, 10],
    } },
    { name: 'breakbeat-four', weight: 4, voices: {
      bd: [0, 4, 8, 10, 12], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sd: [7, 15], hh: [1, 3, 5, 7, 9, 11, 13, 15] } },
  ],
  melody: { leap: 0.6, ornament: 0.04, span: 24, sequence: 0.88, syncopation: 0.35 },
};

/**
 * DUB TECHNO — 1994. One chord, into a delay, and it does not come back.
 *
 * Basic Channel, Chain Reaction, Maurizio. The style whose identity is entirely
 * `Style.effects`, and one of very few in the whole catalogue for which the field
 * was built: reggae's `dub` is the docstring's motivating case, and this is that
 * argument transplanted thirty years and one continent. **A dub techno record
 * without the delay is not a dry version of it, it is a chord.** One chord, held
 * for eleven minutes, going into a long feedback echo and coming back degraded.
 *
 * `drops: [['none', 1], ['dub', 2]]` is the heaviest `dub` weight in the
 * catalogue — two numbers in three — and it is named after the same thing for the
 * same reason. What is left when the bass goes is a hat, a kick, and the tail of
 * the last chord, which is the most recognisable four bars in the style.
 *
 * `drumFills: false`. The whole proposition is that nothing announces anything;
 * a tom roll into the next section would be a completely different record's
 * gesture, and it is exactly the sentence ambient writes about its own kit.
 */
const dubtechno: Style = {
  id: 'dubtechno',
  label: 'Dub techno (1994)',
  description:
    'One chord into a long feedback delay, coming back degraded, for eleven minutes. Nothing announces anything.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.04,
  bpm: [120, 128],
  hook: 'earworm',
  drumFills: false,
  boxDrums: false,
  excludeLayers: ['brass'],
  /**
   * The one style where the filter and `Style.effects` are the same claim from
   * two sides. The chord goes into the delay and the *returns* are darker than
   * the source, because the feedback loop on a spring-and-tape send is
   * band-limited — so a `ramp` across the section, opening, is what a hand on the
   * send's tone control does across eleven minutes.
   */
  filter: { depth: 0.5, shape: 'ramp' },
  breakCarrier: 'pad',
  transitions: [['fill', 1], ['break', 3], ['elide', 2]],
  drops: [['none', 1], ['dub', 2]],
  modeWeights: { minor: 0.94, major: 0.06 },
  relativeMajorChorus: 0,
  /**
   * The production *is* the piece — `Style.effects`' rarest claim, and the one
   * its docstring says the field exists for. `delay` and `reverb` are named and
   * `lowpass` deliberately is not: how bright the decade is stays the era's to
   * say, so this is a 1994 dub techno record or a 2006 one and drowned either
   * way.
   */
  effects: {
    comp: { reverb: 0.72, delay: 0.62 },
    pad: { reverb: 0.85, delay: 0.5 },
    melody: { reverb: 0.6, delay: 0.55 },
    drums: { reverb: 0.4, delay: 0.22 },
  },
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 6 }],
    verse: [
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 9, note: 'One chord. Everything that happens to it happens in the delay' },
      { chords: ['i9', 'i9', 'i9', 'i9', 'iv9', 'iv9', 'iv9', 'iv9'], weight: 3 },
    ],
    chorus: [
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 7 },
      { chords: ['i11', 'i11', 'i11', 'i11', 'VII7sus4', 'VII7sus4', 'VII7sus4', 'VII7sus4'], weight: 4 },
    ],
    bridge: [{ chords: ['iv9', 'iv9', 'iv9', 'iv9', 'iv9', 'iv9', 'iv9', 'iv9'], weight: 4 }],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'Imaj9'], weight: 7 }],
    chorus: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 8 },
    { cell: [-8, 8], weight: 2 },
  ],
  bass: [
    { name: 'sustained-sub', weight: 7, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.9 },
    ] },
    { name: 'offbeat-soft', weight: 5, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.82 }, { at: 6, dur: 2, tone: 'root', vel: 0.74 },
      { at: 10, dur: 2, tone: 'root', vel: 0.8 }, { at: 14, dur: 2, tone: 'root', vel: 0.74 },
    ] },
    { name: 'two-note-sub', weight: 4, sustain: true, hits: [
      { at: 0, dur: 10, tone: 'root', vel: 0.9 }, { at: 10, dur: 6, tone: 'seventh', vel: 0.8 },
    ] },
  ],
  comp: [
    /**
     * The chord, struck on the offbeat and then left to the echo. Two hits a bar,
     * which is as sparse as a comp gets in this genre — everything else the
     * listener hears on this layer is a repeat of one of these two.
     */
    { name: 'echo-chord', weight: 7, voices: 4, hits: [
      { at: 6, dur: 2, vel: 0.7 }, { at: 14, dur: 2, vel: 0.62 },
    ] },
    { name: 'one-chord', weight: 5, voices: 4, hits: [{ at: 6, dur: 2, vel: 0.74 }] },
    { name: 'offbeat-chord', weight: 3, voices: 4, hits: [
      { at: 2, dur: 2, vel: 0.6 }, { at: 6, dur: 2, vel: 0.68 },
      { at: 10, dur: 2, vel: 0.6 }, { at: 14, dur: 2, vel: 0.7 },
    ] },
  ],
  drums: [
    { name: 'muffled-four', weight: 7, voices: {
      bd: [0, 4, 8, 12], hh: [2, 6, 10, 14],
    }, ghosts: { hh: [0, 4, 8, 12] } },
    { name: 'four-and-rim', weight: 5, voices: {
      bd: [0, 4, 8, 12], rim: [12], hh: [2, 6, 10, 14], sh: [0, 4, 8, 12],
    }, ghosts: { sh: [2, 6, 10, 14] } },
    { name: 'four-and-shaker', weight: 4, voices: {
      bd: [0, 4, 8, 12], sh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sh: [1, 3, 5, 7, 9, 11, 13, 15] } },
  ],
  melody: { leap: 0.2, ornament: 0.04, span: 9, sequence: 0.92, syncopation: 0.2 },
};

/**
 * HARDGROOVE — 1997. Three records at once, and none of them has a tune.
 *
 * Jeff Mills, Ben Sims, the loop techno of the late nineties. It is here because
 * of what it does to the *format*: a hardgroove record is deliberately incomplete
 * — a loop and a percussion figure and nothing else — because it was made to be
 * played on the third turntable while two other records were already running.
 * That is the most literal possible version of this genre's central claim, and it
 * is why the style is fast, dry and completely empty of harmony.
 *
 * `excludeLayers: ['pad']` follows and costs it the `breakdown`, which is the
 * correct trade rather than a loss: this style has no wash to be heard against,
 * `DROPS.breakdown` refuses to place without one, and the honest opt-in is `dub`.
 * The percussion tables carry the identity — congas and toms in sixteenths, and
 * a `cycle: 24` figure that comes home every bar and a half.
 */
const hardgroove: Style = {
  id: 'hardgroove',
  label: 'Hardgroove (1997)',
  description:
    'A loop and a percussion figure and nothing else, made to be played on the third turntable while two others run.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [138, 148],
  hook: 'earworm',
  excludeLayers: ['pad', 'brass'],
  boxDrums: false,
  transitions: [['fill', 4], ['break', 3]],
  drops: [['none', 2], ['dub', 1]],
  modeWeights: { minor: 0.94, major: 0.06 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 6 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 9 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 4 },
    ],
    chorus: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 8 },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'VII', 'VII'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 7 }],
    chorus: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
  },
  melodyCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 8 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'offbeat-hard', weight: 7, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.94 }, { at: 6, dur: 2, tone: 'root', vel: 0.88 },
      { at: 10, dur: 2, tone: 'root', vel: 0.92 }, { at: 14, dur: 2, tone: 'root', vel: 0.88 },
    ] },
    { name: 'driving-sixteenths', weight: 5, hits: [
      { at: 2, dur: 1, tone: 'root', vel: 0.9 }, { at: 3, dur: 1, tone: 'root', vel: 0.68 },
      { at: 6, dur: 1, tone: 'root', vel: 0.9 }, { at: 7, dur: 1, tone: 'root', vel: 0.68 },
      { at: 10, dur: 1, tone: 'root', vel: 0.9 }, { at: 11, dur: 1, tone: 'octave', vel: 0.68 },
      { at: 14, dur: 1, tone: 'root', vel: 0.94 }, { at: 15, dur: 1, tone: 'root', vel: 0.72 },
    ] },
  ],
  comp: [
    { name: 'one-stab', weight: 6, voices: 3, hits: [{ at: 14, dur: 1, vel: 0.86 }] },
    { name: 'loop-stab', weight: 5, voices: 3, hits: [
      { at: 3, dur: 1, vel: 0.72 }, { at: 11, dur: 1, vel: 0.7 }, { at: 15, dur: 1, vel: 0.86 },
    ] },
  ],
  drums: [
    { name: 'loop-perc', weight: 7, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12],
      mp: [2, 3, 6, 7, 10, 11, 14, 15], lp: [0, 8], hh: [0, 4, 8, 12],
    } },
    /** Twenty-four sixteenths: a bar and a half. It arrives on the second beat of
     *  every other bar and comes home every three. See `Cycle`. */
    { name: 'twentyfour-perc', weight: 5, cycle: 24, voices: {
      bd: [0, 4, 8, 12, 16, 20], perc: [2, 5, 7, 10, 13, 15, 18, 21], cb: [3, 14],
    } },
    { name: 'tom-drive', weight: 4, voices: {
      bd: [0, 4, 8, 12], cp: [12], lt: [2, 6, 10, 14], ht: [3, 7, 11, 15],
    }, ghosts: { ht: [1, 5, 9, 13] } },
  ],
  melody: { leap: 0.18, ornament: 0.03, span: 7, sequence: 0.94, syncopation: 0.3 },
};

/**
 * MINIMAL TECHNO — 2005. The arrangement is the composition, stated as an axiom.
 *
 * Richie Hawtin's second decade, Perlon, Villalobos's shorter records, most of
 * what came out of Berlin between 2003 and 2008. Nine minutes, four sounds, and
 * a change roughly every thirty-two bars — and the discipline is the style. Every
 * other entry in this file has something you could hum; this has a hi-hat that
 * moves one sixteenth at bar 96 and expects you to notice.
 *
 * **It is the sparsest set of tables in the project.** The comp writes one note a
 * bar, the melody cells are `[16]` at weight 8, and `DoepferMS404` is in the
 * era's bank list precisely because it only has five voices. `drumFills: false`
 * and `transitions: [['fill', 1], ['break', 2], ['elide', 3]]` — the highest
 * `elide` weight in the catalogue, because in this style a section does not
 * arrive, it has already started by the time you notice the previous one ended.
 *
 * `strictness: 'free'` is not a licence, it is the only setting that survives.
 * The rule table's whole business is a line with intervals and shape in it, and
 * `static-repetition` at any level would veto the actual material — which is one
 * note, held, for nine minutes, with the filter moving.
 */
const minimal: Style = {
  id: 'minimal',
  label: 'Minimal techno (2005)',
  description:
    'Nine minutes, four sounds, and a hi-hat that moves one sixteenth at bar 96. The arrangement is the whole composition.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.05,
  bpm: [124, 130],
  hook: 'earworm',
  strictness: 'free',
  drumFills: false,
  boxDrums: false,
  excludeLayers: ['brass'],
  filter: { depth: 0.55, shape: 'ramp' },
  transitions: [['fill', 1], ['break', 2], ['elide', 3]],
  drops: [['none', 2], ['dub', 1]],
  modeWeights: { minor: 0.94, major: 0.06 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 7 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 10, note: 'One chord for nine minutes, and this is the style where that is a position rather than an economy' },
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 4 },
    ],
    chorus: [
      { chords: ['i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7', 'i7'], weight: 8 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 4 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'iv7', 'iv7', 'iv7', 'iv7', 'iv7', 'iv7'], weight: 4 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 8 }],
    chorus: [{ chords: ['Imaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7', 'Imaj7'], weight: 6 }],
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
    { name: 'clipped-offbeat', weight: 7, hits: [
      { at: 2, dur: 1, tone: 'root', vel: 0.88 }, { at: 6, dur: 1, tone: 'root', vel: 0.8 },
      { at: 10, dur: 1, tone: 'root', vel: 0.86 }, { at: 14, dur: 1, tone: 'root', vel: 0.8 },
    ] },
    { name: 'sustained-sub', weight: 5, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.86 },
    ] },
    /** Fourteen sixteenths against sixteen. Two short of the bar, so it walks
     *  backwards through it and comes home after eight — which at this tempo is
     *  about twenty-five seconds and is the entire event. */
    { name: 'fourteen-cycle', weight: 4, cycle: 14, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.88 }, { at: 6, dur: 1, tone: 'root', vel: 0.7 },
      { at: 10, dur: 2, tone: 'seventh', vel: 0.78 },
    ] },
  ],
  comp: [
    { name: 'one-note', weight: 7, voices: 2, hits: [{ at: 14, dur: 1, vel: 0.68 }] },
    { name: 'two-notes', weight: 5, voices: 2, hits: [
      { at: 6, dur: 1, vel: 0.58 }, { at: 14, dur: 1, vel: 0.7 },
    ] },
    { name: 'held-nothing', weight: 3, voices: 3, sustain: true, hits: [
      { at: 0, dur: 16, vel: 0.5 },
    ] },
  ],
  drums: [
    { name: 'four-and-one-hat', weight: 7, voices: {
      bd: [0, 4, 8, 12], hh: [2, 6, 10, 14],
    }, ghosts: { hh: [0, 8] } },
    { name: 'four-and-rim', weight: 5, voices: {
      bd: [0, 4, 8, 12], rim: [7], hh: [2, 6, 10, 14],
    } },
    /**
     * A seven-sixteenth percussion figure was written here and taken out again,
     * and the reason is `docs/engine-gaps.md` §3.6: **`DrumPattern.cycle` is one
     * number for the whole kit.**
     *
     * What this style wants is a click on a seven — prime against sixteen, so it
     * does not come home for seven bars, which is the entire arrangement of a
     * great many of these records — *with the kick still on the floor*. That is
     * not sayable. A `cycle: 7` pattern drifts the bass drum with everything
     * else, and a techno record whose kick walks is not a quieter techno record,
     * it is a different genre.
     *
     * Metal found the same wall from the other side — djent is hands on the bar
     * and feet on a seven — and carried its seven on the guitar and bass instead,
     * leaving the kit to state the grouping. This style does the same thing: the
     * odd cycle is on the *bass* above, at 14, and the kit stays bar-shaped.
     * Second independent finder, one missing field.
     */
    { name: 'off-tick', weight: 4, voices: {
      bd: [0, 4, 8, 12], perc: [3, 9], hh: [2, 6, 10, 14],
    }, ghosts: { hh: [0, 8] } },
  ],
  melody: { leap: 0.14, ornament: 0.02, span: 6, sequence: 0.95, syncopation: 0.15 },
};

/**
 * MICROHOUSE — 2004. The same discipline with a sense of humour.
 *
 * Akufen, Herbert, Luomo, the Perlon end of the same years as `minimal`. It sits
 * beside that style and differs on two axes, both of which the tables can state.
 *
 * The first is **swing**. Microhouse is shuffled and minimal is not; that alone
 * would not be a style, but it is the audible difference in the first four bars.
 * `swing: 0.2` is the third of this file's three sixteenth-shuffle
 * approximations — see the header, and §3.18 — and it is the mildest.
 *
 * The second is **the material**. Where minimal's four sounds are synthesised,
 * these are a hundred quarter-second fragments of radio, cut at the sixteenth and
 * reassembled. That is not something a `Style` can say — there is no sample
 * vocabulary, and `SAMPLE_RACKS` is percussion — so it is written as the thing it
 * produces: a comp figure with more onsets than any other in the genre and no two
 * of them the same length, and a `melody.span` of 18, because consecutive
 * fragments came off different records and do not agree about register.
 */
const microhouse: Style = {
  id: 'microhouse',
  label: 'Microhouse (2004)',
  description:
    'A hundred quarter-second fragments of radio, cut at the sixteenth and reassembled over a shuffled four to the floor.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.2,
  bpm: [122, 128],
  hook: 'catchy',
  strictness: 'free',
  boxDrums: false,
  excludeLayers: ['brass'],
  transitions: [['fill', 2], ['break', 2], ['elide', 3]],
  modeWeights: { minor: 0.82, major: 0.18 },
  relativeMajorChorus: 0,
  vary: { comp: 0.35, bass: 0.2 },
  progressions: {
    intro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 6 }],
    verse: [
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 7 },
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'iv9', 'iv9'], weight: 5 },
    ],
    chorus: [
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'i9', 'i9', 'VII7', 'VII7'], weight: 6 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
    ],
    bridge: [{ chords: ['iv9', 'iv9', 'iv9', 'iv9', 'VII7', 'VII7', 'VII7', 'VII7'], weight: 4 }],
    outro: [{ chords: ['i7', 'i7', 'i7', 'i7'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9'], weight: 6 }],
    chorus: [{ chords: ['IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'ii9', 'ii9', 'V7sus4', 'V7sus4'], weight: 5 }],
  },
  melodyCells: [
    { cell: [1, 1, 2, 4, 8], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [2, 1, 1, 4, 8], weight: 4 },
    { cell: [-2, 1, 1, 4, 8], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'clipped-offbeat', weight: 6, hits: [
      { at: 2, dur: 1, tone: 'root', vel: 0.86 }, { at: 6, dur: 1, tone: 'root', vel: 0.78 },
      { at: 10, dur: 1, tone: 'root', vel: 0.84 }, { at: 14, dur: 1, tone: 'fifth', vel: 0.78 },
    ] },
    { name: 'chopped-sub', weight: 5, hits: [
      { at: 0, dur: 1, tone: 'root', vel: 0.9 }, { at: 3, dur: 1, tone: 'root', vel: 0.68 },
      { at: 6, dur: 2, tone: 'seventh', vel: 0.78 }, { at: 10, dur: 1, tone: 'root', vel: 0.84 },
      { at: 11, dur: 1, tone: 'octave', vel: 0.62 }, { at: 14, dur: 2, tone: 'fifth', vel: 0.76 },
    ] },
  ],
  comp: [
    /**
     * The cut-up. Eleven onsets a bar, none of them the same length, and no two
     * bars alike once `vary` and `Genre.comping` have been through it — which is
     * as close as a figure table gets to a hundred fragments of somebody else's
     * radio.
     */
    { name: 'cut-up', weight: 7, voices: 3, hits: [
      { at: 0, dur: 1, vel: 0.62 }, { at: 2, dur: 1, vel: 0.5 }, { at: 3, dur: 2, vel: 0.76 },
      { at: 6, dur: 1, vel: 0.58 }, { at: 7, dur: 1, vel: 0.8 }, { at: 9, dur: 1, vel: 0.54 },
      { at: 10, dur: 2, vel: 0.7 }, { at: 13, dur: 1, vel: 0.6 }, { at: 14, dur: 1, vel: 0.5 },
      { at: 15, dur: 1, vel: 0.84 },
    ] },
    { name: 'sparse-cuts', weight: 5, voices: 3, hits: [
      { at: 3, dur: 1, vel: 0.74 }, { at: 6, dur: 1, vel: 0.56 },
      { at: 11, dur: 1, vel: 0.72 }, { at: 15, dur: 1, vel: 0.82 },
    ] },
  ],
  drums: [
    { name: 'shuffled-four', weight: 7, voices: {
      bd: [0, 4, 8, 12], rim: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { hh: [1, 3, 5, 7, 9, 11, 13, 15] } },
    { name: 'click-and-four', weight: 5, voices: {
      bd: [0, 4, 8, 12], perc: [1, 3, 6, 7, 11, 13, 15], hh: [2, 10],
    }, ghosts: { perc: [5, 9] } },
    { name: 'clap-shuffle', weight: 4, voices: {
      bd: [0, 4, 8, 12], cp: [12], sh: [0, 2, 3, 6, 8, 10, 11, 14], rim: [4],
    }, ghosts: { sh: [1, 5, 9, 13] } },
  ],
  melody: { leap: 0.45, ornament: 0.14, span: 18, sequence: 0.5, syncopation: 0.8 },
};

/**
 * AMBIENT HOUSE — 1990. The other room.
 *
 * The Orb, the KLF's second record, Sueño Latino, the whole idea that a venue
 * with two thousand people in it should have a second space where the beat is
 * slow and there are cushions. It is the one style in this file with a plausible
 * claim to belonging somewhere else, so the line has to be drawn explicitly.
 *
 * **It is not ambient, and the difference is that it has a pulse.** `ambient`'s
 * whole proposition — argued in its own file and asserted by `npm run genres` —
 * is that the melody comes from the drone, sections arrive without being
 * announced, nothing cadences and there is no kit. This has a four-on-the-floor
 * at 112 BPM, a bass line, a dub delay and a form; what it borrows from ambient
 * is the *pad*, and a wash over a kick is a house record with the top taken off
 * rather than an ambient piece with a drum machine bolted on. The test is the one
 * `synth/index.ts` used: this style states the opposite of ambient's answer on
 * `drumFills`, on `countIn`, and on whether the arrangement has a floor in it.
 *
 * `requireLayers: ['pad']` is the second in this genre after `trance`'s and it is
 * here for a different reason — not to guarantee a drop's witness but because the
 * wash is the style. It costs the last statement's strip, which is the trade
 * `pop/dancepop` recorded, and here it is unambiguously right.
 */
const ambienthouse: Style = {
  id: 'ambienthouse',
  label: 'Ambient house (1990)',
  description:
    'The second room, with cushions in it. A slow four to the floor under a wash, a dub delay and no hurry at all.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.04,
  bpm: [108, 120],
  hook: 'catchy',
  requireLayers: ['pad'],
  excludeLayers: ['brass'],
  drumFills: false,
  breakCarrier: 'pad',
  filter: { depth: 0.5, shape: 'ramp' },
  transitions: [['fill', 1], ['break', 3], ['elide', 3]],
  drops: [['none', 2], ['breakdown', 1]],
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  counterSpacing: 1.5,
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 6 }],
    verse: [
      { chords: ['i9', 'i9', 'i9', 'i9', 'iv9', 'iv9', 'iv9', 'iv9'], weight: 6 },
      { chords: ['i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9', 'i9'], weight: 5 },
      { chords: ['i9', 'i9', 'VImaj7', 'VImaj7', 'i9', 'i9', 'VImaj7', 'VImaj7'], weight: 4 },
    ],
    chorus: [
      { chords: ['VImaj7', 'VImaj7', 'IIImaj7', 'IIImaj7', 'iv9', 'iv9', 'i9', 'i9'], weight: 5 },
      { chords: ['i9', 'i9', 'iv9', 'iv9', 'VII7', 'VII7', 'i9', 'i9'], weight: 5 },
    ],
    bridge: [{ chords: ['iv9', 'iv9', 'iv9', 'iv9', 'VImaj7', 'VImaj7', 'VImaj7', 'VImaj7'], weight: 4 }],
    outro: [{ chords: ['i9', 'i9', 'i9', 'i9'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['Imaj9', 'Imaj9', 'Imaj9', 'Imaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9', 'IVmaj9'], weight: 6 }],
    chorus: [{ chords: ['IVmaj9', 'IVmaj9', 'Imaj9', 'Imaj9', 'vi9', 'vi9', 'IVmaj9', 'IVmaj9'], weight: 5 }],
  },
  melodyCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 3 },
  ],
  bass: [
    { name: 'sustained-sub', weight: 6, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.82 },
    ] },
    { name: 'dub-offbeat', weight: 5, hits: [
      { at: 2, dur: 3, tone: 'root', vel: 0.84 }, { at: 10, dur: 3, tone: 'fifth', vel: 0.76 },
    ] },
    { name: 'slow-walk', weight: 4, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 0.86 }, { at: 6, dur: 2, tone: 'seventh', vel: 0.7 },
      { at: 8, dur: 4, tone: 'fifth', vel: 0.78 }, { at: 14, dur: 2, tone: 'root', vel: 0.72 },
    ] },
  ],
  comp: [
    { name: 'long-wash', weight: 6, voices: 4, sustain: true, hits: [
      { at: 0, dur: 16, vel: 0.58 },
    ] },
    { name: 'echo-chord', weight: 5, voices: 4, hits: [
      { at: 6, dur: 3, vel: 0.66 }, { at: 14, dur: 2, vel: 0.6 },
    ] },
    { name: 'slow-arp', weight: 4, voices: 1, cycle: 12, arpeggio: true, arpDirection: 'updown', hits: [
      { at: 0, dur: 2, vel: 0.6 }, { at: 4, dur: 2, vel: 0.54 }, { at: 8, dur: 2, vel: 0.58 },
    ] },
  ],
  drums: [
    { name: 'slow-four', weight: 6, voices: {
      bd: [0, 4, 8, 12], hh: [2, 6, 10, 14], rim: [12],
    }, ghosts: { hh: [0, 8] } },
    { name: 'four-and-shaker', weight: 5, voices: {
      bd: [0, 4, 8, 12], sh: [0, 2, 4, 6, 8, 10, 12, 14], cp: [12],
    }, ghosts: { sh: [1, 3, 5, 7, 9, 11, 13, 15] } },
    { name: 'dub-kit', weight: 4, voices: {
      bd: [0, 4, 8, 12], rim: [4, 12], oh: [6, 14], perc: [3, 11],
    } },
  ],
  melody: { leap: 0.34, ornament: 0.12, span: 12, sequence: 0.7, syncopation: 0.25 },
};

/**
 * NEW BEAT — 1988. A record played at the wrong speed, on purpose.
 *
 * Belgian, and the strangest thing in this file. The story is well attested and
 * is the whole style: a DJ in Ghent played an EBM twelve-inch at 33 rpm instead
 * of 45 with the pitch fader up, the room liked it, and for about eighteen months
 * an entire national scene was built on records made to sound like other records
 * slowed down.
 *
 * It earns its place on the tempo axis. At 108–118 BPM it is fifteen beats a
 * minute below anything else here and thirty below the techno half, and that is
 * not a gentle version of house — it is a *heavy* one, because everything
 * written for a faster tempo lands with more weight on it when it arrives late.
 * The bass figures are correspondingly long and the kit is deliberately thick:
 * `lt` and `ht` on the offbeats where every other style in this file puts a hat.
 *
 * It is also the ancestor of `hardhouse`, which is why the two share the hoover
 * and nothing else, and why this style's era weight collapses after 1993 to 0.3
 * — the lowest floor in the table. Eighteen months is eighteen months.
 */
const newbeat: Style = {
  id: 'newbeat',
  label: 'New beat (1988)',
  description:
    'A Belgian record made to sound like a faster record played at the wrong speed. Heavy, slow, and over by 1990.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [108, 118],
  hook: 'earworm',
  transitions: [['fill', 4], ['break', 3]],
  modeWeights: { minor: 0.9, major: 0.1 },
  relativeMajorChorus: 0,
  shots: [[[0, 6, 10], 3], [[0, 8], 2]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 6 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 7 },
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'bII', 'bII'], weight: 4, note: 'The flattened second, which arrives here off the EBM records this style was made out of and nowhere else in the genre' },
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['i', 'i', 'VI', 'VI', 'i', 'i', 'VII', 'VII'], weight: 6 },
      { chords: ['iv', 'iv', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['bII', 'bII', 'bII', 'bII', 'i', 'i', 'i', 'i'], weight: 4 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'bVII', 'bVII'], weight: 5 }],
    chorus: [{ chords: ['I', 'I', 'bVI', 'bVI', 'bVII', 'bVII', 'I', 'I'], weight: 5 }],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    { name: 'heavy-offbeat', weight: 6, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.96 }, { at: 6, dur: 2, tone: 'root', vel: 0.9 },
      { at: 10, dur: 2, tone: 'root', vel: 0.94 }, { at: 14, dur: 2, tone: 'root', vel: 0.9 },
    ] },
    { name: 'ebm-eighths', weight: 5, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 }, { at: 2, dur: 2, tone: 0, vel: 0.78 },
      { at: 4, dur: 2, tone: 0, vel: 0.86 }, { at: 6, dur: 2, tone: 12, vel: 0.8 },
      { at: 8, dur: 2, tone: 0, vel: 0.96 }, { at: 10, dur: 2, tone: 0, vel: 0.78 },
      { at: 12, dur: 2, tone: 1, vel: 0.86 }, { at: 14, dur: 2, tone: 0, vel: 0.82 },
    ] },
    { name: 'long-sub', weight: 4, sustain: true, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 0.94 }, { at: 8, dur: 8, tone: 'root', vel: 0.9 },
    ] },
  ],
  comp: [
    { name: 'heavy-stab', weight: 6, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.9 }, { at: 8, dur: 3, vel: 0.84 },
    ] },
    { name: 'offbeat-stab', weight: 5, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.78 },
      { at: 10, dur: 2, vel: 0.72 }, { at: 14, dur: 2, vel: 0.88 },
    ] },
  ],
  drums: [
    { name: 'heavy-four', weight: 7, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], lt: [2, 10], ht: [6, 14], hh: [0, 4, 8, 12],
    } },
    { name: 'four-and-cowbell', weight: 5, voices: {
      bd: [0, 4, 8, 12], sd: [4, 12], cb: [2, 6, 10, 14], oh: [14],
    } },
    { name: 'thick-four', weight: 4, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], mt: [3, 7, 11, 15], hh: [2, 6, 10, 14],
    }, ghosts: { hh: [0, 4, 8, 12] } },
  ],
  melody: { leap: 0.26, ornament: 0.06, span: 10, sequence: 0.82, syncopation: 0.3 },
};

export const STYLES: Record<string, Style> = {
  chicago, jackin, acid, deep, piano, garage,
  ghetto, tribal, disco, frenchtouch, speedgarage, ukgarage,
  hardhouse, progressive, trance, techhouse,
  detroit, bleep, dubtechno, hardgroove,
  minimal, microhouse, ambienthouse, newbeat,
};
