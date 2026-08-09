/**
 * The Arabic catalogue, sorted by iqa'.
 *
 * Every other genre in this project sorts its styles by something the ensemble
 * *is* — a dance, a decade, a piece of equipment. This one sorts by the
 * **rhythmic cycle**, because that is the axis the repertoire itself uses and
 * because nothing else here separates the styles at all. A maqsum and a saidi
 * are played by the same six people on the same instruments in the same maqam
 * at nearly the same tempo; what makes one of them a saidi is that the two
 * doums have moved to the middle of the bar. `docs/synth.md` organises by what
 * the machine is doing for the same reason — it is the only distinction that
 * survives being written down.
 *
 * ## Three strokes, and why the drum tables look so different from everyone
 * else's
 *
 * `DrumVoice` gained `lp`, `mp` and `hp` — the low, mid and high strokes of a
 * hand drum — and this genre is what they were added for. They are the
 * darbuka's **doum**, **tek** and **ka**: a full low tone struck in the middle
 * of the head, a ringing tone struck at the edge, and a pinched crack with the
 * hand left lying on the skin. An iqa' is *written in those three letters* and
 * in nothing else; it is not a kick-and-snare pattern with an accent table over
 * it, and a table that used `bd` and `sd` would be a rock kit playing in 10/8.
 *
 * Two voices join them and both are objects rather than roles:
 *
 *  - **`tb` is the riq** — the tambourine at the centre of a takht, which keeps
 *    the subdivision the way a hi-hat does everywhere else in this project and
 *    is the reason `hh` barely appears below.
 *  - **`bd` is the tabl baladi**, and it appears in exactly two styles. A tabl
 *    is a metre-wide two-headed drum hung off one shoulder and beaten with a
 *    stick — a different object, played by a different person, walking. It is
 *    not a doum played harder, so it is not written on `lp`.
 *
 * ## The harmony is six chords wide, in each mode, and that is the design
 *
 * This music is not harmonised. A takht is heterophonic — everyone plays the
 * same line and decorates it differently — and the chords a 1960s firqa put
 * underneath were a European import applied thinly: a root, a fifth, a triad
 * held for four bars. So the numerals below are drawn from a deliberately tiny
 * vocabulary, and the vocabulary is **exactly the chords that survive every
 * maqam the genre's hook can return in that mode**:
 *
 *   minor   i   isus4   iv   iv7   VI   VImaj7
 *   major   I   Isus4   bII  bIImaj7  iv  ivmaj7
 *
 * See `index.ts` for the whole argument. The short version is that the maqam is
 * chosen by the key and the progression is chosen by the style, so the two
 * cannot negotiate — and a `v` under a Kurd melody, or a `IV` under a Hijaz one,
 * would put a chord tone a semitone away from a scale degree and hold it there
 * for four bars. What varies between the styles below is therefore not *which*
 * chords but **how often they move**, which is a real distinction in this
 * repertoire: a wahda changes chord twice in eight bars and a dabke changes
 * every two.
 *
 * ## What the melody tables assume
 *
 * `melody.ornament` runs between 0.22 and 0.62, against 0.24 at the top of
 * iskelmä's table and 0.12 at the top of synth's. The note is approached, leaned
 * on, shaken and left, and a maqam phrase stripped of that is a scale exercise.
 * `melody.leap` runs the other way, 0.09 to 0.18 — a maqam is walked, not
 * arpeggiated, and the one interval that is *supposed* to be leapt is the
 * augmented second, which is one scale step and therefore not a leap as far as
 * any of these numbers are concerned.
 */

import { makeScale } from '../../core/scale.js';
import type { Style } from '../../style/types.js';

/**
 * MAQSUM — the default iqa', and the one every other 4/4 cycle is a variation
 * on.
 *
 *   D  T  .  T  |  D  .  T  .
 *
 * Doum on one and on three, tek on the two offbeats between them. It carries
 * more of this repertoire than the rest of the catalogue put together: the
 * ughniya, the film song, the belly-dance set, most of Abdel Wahab. Because it
 * is the default it is also the style with the least to say for itself, which
 * is why the tempo band is wide and the mode weights are nearly even — this is
 * the one that has to be able to be anything.
 */
const maqsum: Style = {
  id: 'maqsum',
  label: 'Maqsum',
  description:
    'The default 4/4 iqa\': doum on one and three, tek on the offbeats between. The cycle most of this repertoire is written over.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [88, 116],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass'],
  progressions: {
    intro: [
      { chords: ['i', 'i', 'iv', 'i'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5, note: 'Four bars of tonic before anything happens at all — the line is the event and the harmony is furniture' },
      { chords: ['i', 'i', 'iv', 'iv', 'VI', 'VI', 'i', 'i'], weight: 4 },
      { chords: ['i', 'iv', 'i', 'iv', 'i', 'VI', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5, note: 'The lazma: the ensemble\'s own refrain, rocking between the tonic and its fourth' },
      { chords: ['VI', 'VI', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'VImaj7', 'VImaj7', 'iv', 'iv', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv7', 'iv7', 'iv7', 'iv7', 'VI', 'VI', 'i', 'i'], weight: 4 },
      { chords: ['VImaj7', 'VImaj7', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    solo: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'VI', 'VI', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['iv', 'iv', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    intro: [
      { chords: ['I', 'I', 'bII', 'I'], weight: 4 },
      { chords: ['I', 'I', 'I', 'I'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5, note: 'The ♭II leaning down onto the tonic from a semitone above: the Hijaz cadence, and the single most recognisable move in the whole idiom' },
      { chords: ['I', 'I', 'iv', 'iv', 'bII', 'bII', 'I', 'I'], weight: 4 },
      { chords: ['I', 'bII', 'I', 'bII', 'I', 'iv', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 },
      { chords: ['iv', 'iv', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'bIImaj7', 'bIImaj7', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'ivmaj7', 'ivmaj7', 'bII', 'bII', 'I', 'I'], weight: 4 },
      { chords: ['bIImaj7', 'bIImaj7', 'iv', 'iv', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    solo: [
      { chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'iv', 'iv', 'bII', 'bII', 'I', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['bII', 'bII', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'I', 'I'], weight: 3 },
    ],
  },
  // Sixteen slots, and the sixteenth is the unit. Nearly every cell has a run
  // of four in it somewhere, because the surface of this music is a stream of
  // small notes decorating a much slower skeleton — the skeleton is what the
  // cadence cells are for.
  melodyCells: [
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [4, 4, 2, 2, 4], weight: 5 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [8, 2, 2, 4], weight: 3 },
    { cell: [-4, 2, 2, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 2, 2, 4], weight: 2 },
    { cell: [12, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [-4, 12], weight: 2 },
  ],
  bass: [
    // The takht had no bass line, so what a bass plays here is the doum: the
    // root on the strokes the drum is already making. Where the two disagree
    // the ear hears a mistake.
    { name: 'doum-double', weight: 6, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.92 },
      { at: 8, dur: 7, tone: 'root', vel: 0.82 },
    ] },
    { name: 'root-fifth', weight: 4, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.92 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.8 },
    ] },
    { name: 'pedal', weight: 3, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.86 },
    ] },
  ],
  comp: [
    { name: 'offbeat-oud', weight: 5, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.5 },
      { at: 6, dur: 2, vel: 0.44 },
      { at: 10, dur: 2, vel: 0.5 },
      { at: 14, dur: 2, vel: 0.44 },
    ] },
    { name: 'half-bar', weight: 4, voices: 3, hits: [
      { at: 0, dur: 7, vel: 0.5 },
      { at: 8, dur: 7, vel: 0.44 },
    ] },
    // The qanun's tremolo, as near as a fixed grid gets to it: the same voicing
    // struck on every eighth, quietly, so it reads as one sustained sound.
    { name: 'qanun-tremolo', weight: 3, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.4 }, { at: 2, dur: 2, vel: 0.34 },
      { at: 4, dur: 2, vel: 0.38 }, { at: 6, dur: 2, vel: 0.34 },
      { at: 8, dur: 2, vel: 0.4 }, { at: 10, dur: 2, vel: 0.34 },
      { at: 12, dur: 2, vel: 0.38 }, { at: 14, dur: 2, vel: 0.34 },
    ] },
  ],
  drums: [
    { name: 'maqsum', weight: 6, voices: {
      lp: [0, 8],
      hp: [2, 6, 12],
      tb: [0, 4, 8, 12],
    } },
    { name: 'maqsum-riq', weight: 5, voices: {
      lp: [0, 8],
      hp: [2, 6, 12],
      mp: [4, 10],
      tb: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'maqsum-plain', weight: 3, voices: {
      lp: [0, 8],
      hp: [2, 6, 12],
    } },
  ],
  melody: { leap: 0.11, ornament: 0.42, span: 13, sequence: 0.55, syncopation: 0.3 },
};

/**
 * BALADI — maqsum with the second stroke turned into a doum.
 *
 *   D  D  .  T  |  D  .  T  .
 *
 * One note different from the style above and a completely different piece of
 * music, which is the clearest possible demonstration of why this catalogue is
 * sorted by iqa'. The doubled doum at the head of the bar drags: it puts weight
 * on the second eighth, where maqsum puts a tek, so the bar leans forward
 * before it has begun. *Baladi* means "of the country" and the connotation is
 * exactly the English one — this is the town rhythm, the accordion and the
 * cheap organ, and it is slower and heavier than the maqsum it came from.
 */
const baladi: Style = {
  id: 'baladi',
  label: 'Baladi',
  description:
    'Maqsum with the second stroke turned into a doum. The doubled low stroke at the head of the bar makes it drag; slower and heavier than maqsum.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [72, 96],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass'],
  progressions: {
    intro: [
      { chords: ['i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'i', 'i'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'iv', 'iv'], weight: 5, note: 'Six bars of tonic. A baladi taxim over the drum is nearly all of this style and the harmony is not allowed to interrupt it' },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'iv', 'iv'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 4 },
    ],
    bridge: [
      { chords: ['iv7', 'iv7', 'VI', 'VI', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    solo: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6, note: 'The floor of the style: one chord under a solo, which is what an accordion taxim over a baladi actually has beneath it' },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['iv', 'i', 'i', 'i'], weight: 4 },
    ],
  },
  majorProgressions: {
    intro: [
      { chords: ['I', 'I', 'I', 'I'], weight: 4 },
      { chords: ['bII', 'bII', 'I', 'I'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'I', 'I', 'bII', 'bII'], weight: 5 },
      { chords: ['I', 'I', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'I', 'I', 'iv', 'iv', 'bII', 'bII'], weight: 3 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 5 },
      { chords: ['iv', 'iv', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 4 },
    ],
    bridge: [
      { chords: ['ivmaj7', 'ivmaj7', 'bIImaj7', 'bIImaj7', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    solo: [
      { chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 },
      { chords: ['I', 'I', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['bII', 'I', 'I', 'I'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [4, 4, 2, 2, 2, 2], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [-2, 2, 4, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 2 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    { name: 'doubled-doum', weight: 6, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.94 },
      { at: 2, dur: 5, tone: 'root', vel: 0.82 },
      { at: 8, dur: 7, tone: 'root', vel: 0.88 },
    ] },
    { name: 'root-fifth-drag', weight: 4, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.94 },
      { at: 2, dur: 5, tone: 'fifth', vel: 0.78 },
      { at: 8, dur: 7, tone: 'root', vel: 0.86 },
    ] },
    { name: 'pedal', weight: 3, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.86 },
    ] },
  ],
  comp: [
    { name: 'accordion-chug', weight: 5, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.5 },
      { at: 12, dur: 3, vel: 0.46 },
    ] },
    { name: 'organ-held', weight: 4, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.42 }] },
    { name: 'offbeat-eighths', weight: 3, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.46 },
      { at: 6, dur: 2, vel: 0.42 },
      { at: 10, dur: 2, vel: 0.46 },
      { at: 14, dur: 2, vel: 0.42 },
    ] },
  ],
  drums: [
    { name: 'baladi', weight: 6, voices: {
      lp: [0, 2, 8],
      hp: [6, 12],
      tb: [0, 4, 8, 12],
    } },
    { name: 'baladi-riq', weight: 5, voices: {
      lp: [0, 2, 8],
      hp: [6, 12],
      mp: [10, 14],
      tb: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'baladi-heavy', weight: 3, voices: {
      lp: [0, 2, 8, 10],
      hp: [6, 12],
      tb: [4, 12],
    } },
  ],
  melody: { leap: 0.1, ornament: 0.45, span: 12, sequence: 0.6, syncopation: 0.28 },
};

/**
 * SAIDI — the two doums move to the middle.
 *
 *   D  .  T  .  |  D  D  T  .
 *
 * Upper Egypt, the mizmar, and the tahtib — the stick dance, which is what the
 * rhythm is actually for and which is why the pair of doums lands where a
 * European ear expects the backbeat. That displacement is the whole style:
 * beat three arrives twice as hard as beat one and the bar reads as an upbeat
 * to its own second half.
 *
 * The one style here that leans hard into major, and it is not a cheerfulness
 * claim. Saidi is mizmar music, the mizmar plays Hijaz, and Hijaz is a
 * major-mode maqam in this engine — see the note on `Mode` in `index.ts`, which
 * is the single most counter-intuitive sentence in the genre.
 */
const saidi: Style = {
  id: 'saidi',
  label: 'Saidi',
  description:
    'Upper Egypt, mizmar and stick dance. The two doums land in the middle of the bar instead of at its head, so beat three carries the weight.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [96, 124],
  swing: 0,
  modeWeights: { minor: 0.28, major: 0.72 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [{ chords: ['i', 'i', 'iv', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'i', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'iv7', 'iv7', 'i', 'i', 'i', 'i'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['iv', 'i', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'bII', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 },
      { chords: ['I', 'bII', 'I', 'bII', 'I', 'I', 'I', 'I'], weight: 4, note: 'Two bars of ♭II to two of I, over and over. The mizmar plays one phrase and answers it with the same phrase a step lower' },
      { chords: ['I', 'I', 'iv', 'iv', 'bII', 'bII', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 },
      { chords: ['iv', 'iv', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'ivmaj7', 'ivmaj7', 'bII', 'bII', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['bII', 'I', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [-4, 2, 2, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 2, 2, 4], weight: 3 },
    { cell: [8, 2, 2, 4], weight: 3 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [-2, 2, 2, 2, 2, 2, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  bass: [
    { name: 'saidi-figure', weight: 6, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.9 },
      { at: 8, dur: 2, tone: 'root', vel: 0.94 },
      { at: 10, dur: 5, tone: 'fifth', vel: 0.84 },
    ] },
    { name: 'root-only', weight: 4, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.9 },
      { at: 8, dur: 7, tone: 'root', vel: 0.9 },
    ] },
    { name: 'octave-drop', weight: 3, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.9 },
      { at: 8, dur: 3, tone: 'octave', vel: 0.8 },
      { at: 12, dur: 3, tone: 'root', vel: 0.86 },
    ] },
  ],
  comp: [
    { name: 'stabs-on-the-doums', weight: 5, voices: 3, hits: [
      { at: 8, dur: 2, vel: 0.56 },
      { at: 10, dur: 2, vel: 0.5 },
    ] },
    { name: 'offbeat-oud', weight: 4, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.5 },
      { at: 6, dur: 2, vel: 0.44 },
      { at: 10, dur: 2, vel: 0.5 },
      { at: 14, dur: 2, vel: 0.44 },
    ] },
    { name: 'held', weight: 3, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.4 }] },
  ],
  drums: [
    { name: 'saidi', weight: 6, voices: {
      lp: [0, 8, 10],
      hp: [4, 12],
      tb: [0, 4, 8, 12],
    } },
    { name: 'saidi-riq', weight: 5, voices: {
      lp: [0, 8, 10],
      hp: [4, 12, 14],
      mp: [2, 6],
      tb: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'saidi-tabl', weight: 4, voices: {
      // Two drums: the darbuka keeps the iqa' and the tabl baladi doubles the
      // pair of doums with a stick. This is a procession that has stopped
      // walking, and it is what a saidi sounds like outdoors.
      lp: [0, 8, 10],
      hp: [4, 12],
      bd: [8, 10],
      tb: [0, 4, 8, 12],
    } },
  ],
  melody: { leap: 0.13, ornament: 0.4, span: 14, sequence: 0.55, syncopation: 0.32 },
};

/**
 * FALLAHI — the maqsum with the bar cut in half.
 *
 *   D  T  D  T      (2/4, one doum on each beat)
 *
 * Fellahin music: the Delta villages, and the fastest thing in the repertoire
 * that is still a dance rather than a procession. Nothing about the strokes is
 * clever — a doum on each beat and a tek behind each — and that is the point.
 * At 150 BPM in 2/4 a bar lasts eight tenths of a second, so the *bar* stops
 * being the unit a listener counts and the phrase takes over; the form builder
 * notices this on its own and doubles the section lengths.
 */
const fallahi: Style = {
  id: 'fallahi',
  label: 'Fallahi',
  description:
    'The Delta 2/4, and the fastest dance here. A doum on each beat with a tek behind it, at a tempo where the bar stops being countable.',
  beatsPerBar: 2,
  beatUnit: 4,
  bpm: [132, 168],
  swing: 0,
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass'],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'VI', 'VI', 'iv', 'iv', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'VI', 'VI', 'iv', 'iv', 'i', 'i'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['iv', 'i', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'I', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'iv', 'iv', 'bII', 'bII', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 },
      { chords: ['iv', 'iv', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'iv', 'iv', 'bII', 'bII', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['bII', 'I', 'I', 'I'], weight: 4 }],
  },
  // Eight slots. Two beats go past too quickly for a long note to mean
  // anything, so the resting value here is the eighth rather than the half.
  melodyCells: [
    { cell: [2, 2, 2, 2], weight: 5 },
    { cell: [4, 2, 2], weight: 5 },
    { cell: [2, 2, 4], weight: 4 },
    { cell: [-2, 2, 4], weight: 4 },
    { cell: [8], weight: 3 },
    { cell: [4, 4], weight: 3 },
    { cell: [-4, 2, 2], weight: 3 },
    { cell: [6, 2], weight: 2 },
  ],
  cadenceCells: [
    { cell: [8], weight: 5 },
    { cell: [4, 4], weight: 3 },
    { cell: [-2, 6], weight: 2 },
  ],
  bass: [
    { name: 'on-the-beats', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.94 },
      { at: 4, dur: 3, tone: 'root', vel: 0.86 },
    ] },
    { name: 'root-fifth', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.94 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.84 },
    ] },
    // Two bars long against a two-beat bar, so the figure answers itself every
    // other bar — which at this tempo is the only phrase length the ear can
    // hold on to. See `Cycle` in `style/types.ts`.
    { name: 'two-bar-walk', weight: 3, cycle: 16, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.94 },
      { at: 4, dur: 3, tone: 'root', vel: 0.84 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.9 },
      { at: 12, dur: 3, tone: 'octave', vel: 0.82 },
    ] },
  ],
  comp: [
    { name: 'offbeats', weight: 5, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.52 },
      { at: 6, dur: 2, vel: 0.48 },
    ] },
    { name: 'downbeat-stab', weight: 4, voices: 3, hits: [{ at: 0, dur: 3, vel: 0.54 }] },
    { name: 'held', weight: 3, voices: 4, sustain: true, hits: [{ at: 0, dur: 8, vel: 0.42 }] },
  ],
  drums: [
    { name: 'fallahi', weight: 6, voices: {
      lp: [0, 4],
      hp: [2, 6],
      tb: [0, 2, 4, 6],
    } },
    { name: 'fallahi-riq', weight: 5, voices: {
      lp: [0, 4],
      hp: [2, 6],
      mp: [3, 7],
      tb: [0, 1, 2, 3, 4, 5, 6, 7],
    } },
    { name: 'fallahi-open', weight: 3, voices: {
      lp: [0, 4],
      hp: [6],
      tb: [0, 4],
    } },
  ],
  melody: { leap: 0.14, ornament: 0.3, span: 12, sequence: 0.65, syncopation: 0.35 },
};

/**
 * MALFUF — three strokes and a hole.
 *
 *   D  .  .  T  .  .  T  .      (2/4, in sixteenths)
 *
 * *Malfuf* means "wrapped", and the wrapping is the gap: the doum lands on the
 * beat and then nothing happens for three sixteenths, which is exactly long
 * enough for the ear to start counting and be wrong. It is the entrance
 * rhythm — the one played when the dancer or the bride comes through the door
 * — so it exists to be heard before anything else has started, and the tables
 * below are correspondingly thin. There is no chorus here that a maqsum could
 * not do better; what this style is for is the sixteen bars in front of one.
 */
const malfuf: Style = {
  id: 'malfuf',
  label: 'Malfuf',
  description:
    'The entrance rhythm. A doum, three sixteenths of nothing, then two teks — a 2/4 that is mostly the gap after its own downbeat.',
  beatsPerBar: 2,
  beatUnit: 4,
  bpm: [138, 176],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass', 'pad'],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'iv', 'iv'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'I', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'I', 'I', 'bII', 'bII'], weight: 5 },
      { chords: ['I', 'I', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'I', 'I', 'iv', 'iv', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [3, 3, 2], weight: 5, },
    { cell: [2, 2, 2, 2], weight: 4 },
    { cell: [-3, 3, 2], weight: 4 },
    { cell: [4, 2, 2], weight: 4 },
    { cell: [3, 1, 2, 2], weight: 3 },
    { cell: [8], weight: 3 },
    { cell: [-2, 3, 3], weight: 2 },
  ],
  cadenceCells: [
    { cell: [8], weight: 5 },
    { cell: [3, 5], weight: 3 },
    { cell: [4, 4], weight: 2 },
  ],
  bass: [
    // The bass plays the drum's own shape rather than the beat, which is the
    // only way the hole survives — a root on beat two fills it in and turns the
    // style back into a fallahi.
    { name: 'malfuf-shape', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.94 },
      { at: 3, dur: 3, tone: 'root', vel: 0.78 },
      { at: 6, dur: 2, tone: 'fifth', vel: 0.8 },
    ] },
    { name: 'downbeat-only', weight: 4, hits: [{ at: 0, dur: 7, tone: 'root', vel: 0.94 }] },
    { name: 'pedal', weight: 2, sustain: true, hits: [{ at: 0, dur: 8, tone: 'root', vel: 0.86 }] },
  ],
  comp: [
    { name: 'in-the-hole', weight: 5, voices: 3, hits: [
      { at: 3, dur: 3, vel: 0.5 },
      { at: 6, dur: 2, vel: 0.46 },
    ] },
    { name: 'downbeat', weight: 4, voices: 3, hits: [{ at: 0, dur: 3, vel: 0.54 }] },
    { name: 'held', weight: 2, voices: 3, sustain: true, hits: [{ at: 0, dur: 8, vel: 0.42 }] },
  ],
  drums: [
    { name: 'malfuf', weight: 6, voices: {
      lp: [0],
      hp: [3, 6],
      tb: [0, 2, 4, 6],
    } },
    { name: 'malfuf-riq', weight: 5, voices: {
      lp: [0],
      hp: [3, 6],
      mp: [4],
      tb: [0, 1, 2, 3, 4, 5, 6, 7],
    } },
    { name: 'malfuf-double', weight: 3, voices: {
      lp: [0, 4],
      hp: [3, 6],
      tb: [0, 2, 4, 6],
    } },
  ],
  melody: { leap: 0.15, ornament: 0.3, span: 12, sequence: 0.7, syncopation: 0.4 },
};

/**
 * AYYUB — two beats, four strokes, and no way out.
 *
 *   D  .  T  D  .  .  T  .      (2/4, in sixteenths)
 *
 * The zar rhythm. It is played for hours without changing at a tempo that
 * climbs slowly, and it is the one iqa' in this catalogue whose *purpose* is
 * not a dance or a song but a state — the ceremony it belongs to is a trance
 * ritual, and the tek jammed against the second doum at the third sixteenth is
 * what makes the cycle limp forward instead of turning over cleanly.
 *
 * `hook: 'earworm'` and one chord for most of the song, for exactly the reason
 * ambient's drone has them: repetition here is the form rather than a setting
 * applied to it.
 *
 * ## The tempo, and a sentence that stopped being true
 *
 * The verse table's note used to end *"and the generator cannot change it"*,
 * about the one thing this style's own header says does change. That was true
 * when it was written and `Style.tempoRamp` has since been built —
 * `generate/tempo.ts`, a weighted palette drawn once per song, style-level with
 * no genre half precisely so that one style in an idiom may accelerate while its
 * neighbours do not. The clause is gone from the note and the argument is here
 * instead, because it is longer than a note should be and because the decision
 * it records is not obvious.
 *
 * **The field is not taken, and the reason is that this style refuses events on
 * principle and a ramp is not one.** `transitions` below turns down `shot` and
 * `break` on the ground that a zar contains no changes; that argument does not
 * transfer, because an accelerando is not something that *happens* at a point —
 * it is a property of the whole, monotonic, and audible only by comparing the
 * first minute with the last, which is exactly how the ceremony works. Of the
 * two shapes `gathering` is the closer fit: `rise: 1.5` on a squared curve, half
 * the climb arriving in the last third, written for a devotional form whose
 * opening is patient. `accelerando` is a dance band getting faster because the
 * room is, and nobody in this room is dancing.
 *
 * It is left undeclared because the number is not measured. `bpm: [104, 138]` is
 * a band drawn once and it becomes the tempo of the *first bar*: `rampMap`
 * computes `bpm * (1 + (rise - 1) * curve(p))`, `planRamp` clamps only the rise
 * itself into 0.5–2, and the resulting tempo is never clamped back into
 * `Style.bpm`. A style opting in is leaving its own declared range on purpose,
 * which that field's doc allows and then requires it to own. A zar drawn at 138
 * and climbing by half again ends at **207**, and nothing in this folder knows
 * whether that is the ceremony or a mistake. That is a question for somebody
 * with a recording, not for a comment sweep.
 */
const ayyub: Style = {
  id: 'ayyub',
  label: 'Ayyub',
  description:
    'The zar cycle: two beats, a doum, a tek jammed against the second doum, and no variation for as long as it lasts.',
  beatsPerBar: 2,
  beatUnit: 4,
  bpm: [104, 138],
  swing: 0,
  modeWeights: { minor: 0.75, major: 0.25 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass'],
  hook: 'earworm',
  /**
   * The second refusal, and it is the same refusal `hook: 'earworm'` above
   * already makes with a different field.
   *
   * A zar is played for hours without changing. The header three lines up says
   * repetition here is the form rather than a setting applied to it, and the
   * verse table says eight bars of one chord and means it. A `shot` and a
   * `break` are both, definitionally, *something happening* — the one kind of
   * event this style exists to not contain — and the genre's palette was putting
   * them in at a rate the ceremony would not recognise: 181 shots and 81 breaks
   * over 200 songs, 166 and 97 of which edited the bar.
   *
   * The break is the one that gives the game away, because the cycle is what it
   * deletes. Measured against the same seeds with the palette off: the drums in
   * a break bar fall from 4.99 strokes to 1.67 and the comp from 2.39 to 0.24,
   * so the doum-tek-doum that the trance is made of stops dead for a bar and
   * comes back. Somebody dancing to it would have to start again. The shot is
   * milder and wrong in the same direction — 6.27 strokes down to 2.99, the
   * cycle swapped for a figure.
   *
   * This is the refusal `docs/engine-gaps.md` §7 records against hiphop's
   * `bounce`, arrived at independently: a style whose whole thesis is one figure
   * repeated without a single change cannot adopt a mechanism whose entire
   * content is a change. It is feasible, it was measured, and it is declined.
   */
  transitions: [['fill', 1]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6, note: 'Eight bars of one chord. The tempo is the only thing in this style that changes' },
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'VI', 'VI', 'i', 'i', 'i', 'i'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 },
      { chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'iv', 'iv', 'I', 'I', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [3, 1, 4], weight: 5 },
    { cell: [2, 2, 2, 2], weight: 4 },
    { cell: [4, 4], weight: 4 },
    { cell: [-3, 3, 2], weight: 4 },
    { cell: [8], weight: 4 },
    { cell: [3, 3, 2], weight: 3 },
    { cell: [-4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [8], weight: 6 },
    { cell: [-4, 4], weight: 3 },
  ],
  bass: [
    { name: 'ayyub-shape', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.94 },
      { at: 4, dur: 3, tone: 'root', vel: 0.86 },
    ] },
    { name: 'limping', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.94 },
      { at: 3, dur: 1, tone: 'fifth', vel: 0.68 },
      { at: 4, dur: 3, tone: 'root', vel: 0.86 },
    ] },
    { name: 'pedal', weight: 4, sustain: true, hits: [{ at: 0, dur: 8, tone: 'root', vel: 0.88 }] },
  ],
  comp: [
    { name: 'held', weight: 5, voices: 3, sustain: true, hits: [{ at: 0, dur: 8, vel: 0.42 }] },
    { name: 'offbeat', weight: 4, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.48 },
      { at: 6, dur: 2, vel: 0.44 },
    ] },
    { name: 'on-the-limp', weight: 3, voices: 3, hits: [{ at: 3, dur: 3, vel: 0.5 }] },
  ],
  drums: [
    { name: 'ayyub', weight: 6, voices: {
      lp: [0, 4],
      hp: [3, 6],
      tb: [0, 2, 4, 6],
    } },
    { name: 'ayyub-driven', weight: 5, voices: {
      lp: [0, 4],
      hp: [3, 6],
      mp: [2],
      tb: [0, 1, 2, 3, 4, 5, 6, 7],
    } },
    { name: 'ayyub-bare', weight: 4, voices: {
      lp: [0, 4],
      hp: [3, 6],
    } },
  ],
  melody: { leap: 0.09, ornament: 0.35, span: 10, sequence: 0.75, syncopation: 0.25 },
};

/**
 * JURJINA — the same 3+2+2+3 as the sama'i, at half the size.
 *
 *   D  .  .  T  .  D  .  T  .  .      (10/16)
 *
 * Ten *sixteenths* rather than ten eighths, which is the whole reason it is
 * here beside `samai` rather than folded into it. The grouping is identical and
 * the effect is the opposite: a sama'i thaqil at 60 BPM gives the ear four
 * seconds to work out where the long groups are, and a jurjina at 120 gives it
 * one and a quarter, so the asymmetry stops being a structure you can count and
 * becomes a limp. Iraqi and Turkish, and the fastest odd metre in the
 * catalogue.
 *
 * `beatUnit: 16` is the only place in the project it appears, and it changes
 * nothing but the time signature written into the MIDI file — the engine's beat
 * is always a quarter and two and a half of them is what ten sixteenths are.
 */
const jurjina: Style = {
  id: 'jurjina',
  label: 'Jurjina',
  description:
    'Ten sixteenths grouped three-two-two-three. The sama\'i\'s asymmetry at four times the speed, where it reads as a limp rather than as a structure.',
  beatsPerBar: 2.5,
  beatUnit: 16,
  /** 3+2+2+3, in sixteenths, which here *is* the notated unit. */
  groups: [3, 2, 2, 3],
  bpm: [104, 132],
  swing: 0,
  modeWeights: { minor: 0.7, major: 0.3 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass', 'pad'],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'VI', 'VI', 'iv', 'iv', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'VImaj7', 'VImaj7', 'i', 'i', 'i', 'i'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['iv', 'i', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'I', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'iv', 'iv', 'bII', 'bII', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'I', 'I', 'iv', 'iv', 'I', 'I'], weight: 5 },
      { chords: ['iv', 'iv', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['ivmaj7', 'ivmaj7', 'bIImaj7', 'bIImaj7', 'I', 'I', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['bII', 'I', 'I', 'I'], weight: 4 }],
  },
  // Ten slots, and every cell breaks somewhere the grouping does. Padding a
  // 4/4 cell out to length would put the extra sixteenth on the end of the last
  // note, which fills the bar and states nothing about it.
  melodyCells: [
    { cell: [3, 2, 2, 3], weight: 5 },
    { cell: [3, 2, 2, 2, 1], weight: 4 },
    { cell: [-3, 2, 2, 3], weight: 4 },
    { cell: [5, 2, 3], weight: 4 },
    { cell: [3, 4, 3], weight: 3 },
    { cell: [2, 1, 2, 2, 3], weight: 3 },
    { cell: [10], weight: 3 },
    { cell: [-2, 3, 2, 3], weight: 2 },
  ],
  cadenceCells: [
    { cell: [10], weight: 5 },
    { cell: [5, 5], weight: 3 },
    { cell: [7, 3], weight: 2 },
  ],
  bass: [
    { name: 'group-heads', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.94 },
      { at: 5, dur: 2, tone: 'fifth', vel: 0.84 },
      { at: 7, dur: 3, tone: 'root', vel: 0.86 },
    ] },
    { name: 'long-short', weight: 4, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 0.94 },
      { at: 5, dur: 5, tone: 'root', vel: 0.84 },
    ] },
    { name: 'pedal', weight: 3, sustain: true, hits: [{ at: 0, dur: 10, tone: 'root', vel: 0.86 }] },
  ],
  comp: [
    { name: 'on-the-groups', weight: 5, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.52 },
      { at: 3, dur: 2, vel: 0.44 },
      { at: 7, dur: 3, vel: 0.5 },
    ] },
    { name: 'short-groups-only', weight: 4, voices: 3, hits: [
      { at: 3, dur: 2, vel: 0.5 },
      { at: 5, dur: 2, vel: 0.46 },
    ] },
    { name: 'held', weight: 3, voices: 3, sustain: true, hits: [{ at: 0, dur: 10, vel: 0.42 }] },
  ],
  drums: [
    { name: 'jurjina', weight: 6, voices: {
      lp: [0, 5],
      hp: [3, 7],
      tb: [0, 3, 5, 7],
    } },
    { name: 'jurjina-filled', weight: 4, voices: {
      lp: [0, 5],
      hp: [3, 7],
      mp: [2, 9],
      tb: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    } },
    { name: 'jurjina-bare', weight: 3, voices: {
      lp: [0, 5],
      hp: [3, 7],
    } },
  ],
  melody: { leap: 0.12, ornament: 0.32, span: 12, sequence: 0.6, syncopation: 0.3 },
};

/**
 * WAHDA — one doum a bar, and everything else is the singer.
 *
 *   D  .  .  .  |  T  .  T  .
 *
 * *Wahda* means "one", and one is how many low strokes there are. This is the
 * iqa' of the long ughniya — the forty-minute Umm Kulthum number where a single
 * line of text is sung six times, each time further from where it started — and
 * it is here because the catalogue needs one cycle that gets out of the way
 * entirely. Nothing is on the offbeats and nothing subdivides; the bar is a
 * frame around a silence and the line does whatever it likes inside it.
 *
 * Among the slowest here — only the chiftetelli's cycle is broader — and the
 * only one where the harmony is allowed to hold a single chord for four bars in
 * the *chorus* as well as the verse.
 */
const wahda: Style = {
  id: 'wahda',
  label: 'Wahda',
  description:
    'One doum a bar and two teks behind it. The cycle of the long song — a frame around a silence for the singer to work in.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [58, 82],
  swing: 0,
  modeWeights: { minor: 0.62, major: 0.38 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass'],
  counterSpacing: 1,
  progressions: {
    intro: [
      { chords: ['i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'i', 'i'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'iv', 'iv'], weight: 5, note: 'Four bars a chord at 70 BPM is nearly fourteen seconds of one harmony, which is the correct amount for a line of text sung twice' },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'VI', 'VI', 'iv', 'iv', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['VImaj7', 'VImaj7', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    bridge: [
      { chords: ['iv7', 'iv7', 'iv7', 'iv7', 'VI', 'VI', 'i', 'i'], weight: 4 },
    ],
    solo: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
    ],
    outro: [{ chords: ['iv', 'iv', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [
      { chords: ['I', 'I', 'I', 'I'], weight: 4 },
      { chords: ['bII', 'bII', 'I', 'I'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'bII', 'bII'], weight: 5 },
      { chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'iv', 'iv', 'bII', 'bII', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 5 },
      { chords: ['ivmaj7', 'ivmaj7', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'iv', 'iv', 'bIImaj7', 'bIImaj7', 'I', 'I'], weight: 4 },
    ],
    solo: [{ chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['bII', 'bII', 'I', 'I'], weight: 4 }],
  },
  // Long notes with small ones crowded against them — the shape of a held
  // syllable that is decorated on the way out rather than on the way in.
  melodyCells: [
    { cell: [8, 2, 2, 4], weight: 5 },
    { cell: [12, 2, 2], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-4, 8, 4], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [8, 4, 2, 2], weight: 3 },
    { cell: [-8, 4, 2, 2], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'one-a-bar', weight: 6, hits: [{ at: 0, dur: 14, tone: 'root', vel: 0.9 }] },
    { name: 'root-fifth-slow', weight: 4, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.9 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.78 },
    ] },
    { name: 'pedal', weight: 4, sustain: true, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.86 }] },
  ],
  comp: [
    { name: 'held', weight: 5, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.4 }] },
    { name: 'qanun-answer', weight: 4, voices: 3, hits: [
      { at: 8, dur: 2, vel: 0.46 },
      { at: 12, dur: 3, vel: 0.42 },
    ] },
    { name: 'half-bar', weight: 3, voices: 3, hits: [
      { at: 0, dur: 7, vel: 0.46 },
      { at: 8, dur: 7, vel: 0.42 },
    ] },
  ],
  drums: [
    { name: 'wahda', weight: 6, voices: {
      lp: [0],
      hp: [8, 12],
      tb: [0, 4, 8, 12],
    } },
    { name: 'wahda-riq', weight: 5, voices: {
      lp: [0],
      hp: [8, 12],
      mp: [4],
      tb: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    // The takht at its quietest: the riq alone, keeping the beat with the
    // jingles and nothing struck on the head at all.
    { name: 'riq-only', weight: 4, voices: {
      tb: [0, 4, 8, 12],
    } },
  ],
  melody: { leap: 0.1, ornament: 0.5, span: 15, sequence: 0.4, syncopation: 0.2 },
};

/**
 * MASMOUDI KABIR — eight beats of iqa' inside a four-beat bar.
 *
 *   D  D  .  T  .  .  T  .  |  D  .  .  T  .  .  T  .
 *
 * The big masmoudi is a *sixteen-pulse* cycle, and this is the style that shows
 * why `cycle` exists. Writing it as an 8/4 bar would have been arithmetically
 * honest and musically wrong twice over: the melody does not phrase in eights
 * and the harmony does not move once every eight beats — both of them are in
 * four, and only the drum is in eight. So the bar stays 4/4 and the kit carries
 * `cycle: 32`, which puts the first half of the iqa' in the odd bars and the
 * second half in the even ones, exactly as a darbuka player counts it.
 *
 * The two halves are a question and an answer: the first is a baladi with its
 * doubled doum, the second is the same figure with the second doum taken away.
 * That is what makes the cycle sound like it is going somewhere across two bars
 * rather than turning over in one.
 */
const masmoudi: Style = {
  id: 'masmoudi',
  label: 'Masmoudi kabir',
  description:
    'The sixteen-pulse cycle: a doubled doum, then the same figure with the second doum removed. Two bars of 4/4 for one turn of the drum.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [80, 104],
  swing: 0,
  modeWeights: { minor: 0.62, major: 0.38 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass'],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5, note: 'Two bars a chord, because two bars is one turn of the drum and a harmony that moved inside it would cut the cycle in half' },
      { chords: ['i', 'i', 'VI', 'VI', 'iv', 'iv', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 5 },
      { chords: ['VImaj7', 'VImaj7', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'iv7', 'iv7', 'VI', 'VI', 'i', 'i'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['iv', 'iv', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'I', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'iv', 'iv', 'bII', 'bII', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'I', 'I', 'iv', 'iv', 'I', 'I'], weight: 5 },
      { chords: ['bIImaj7', 'bIImaj7', 'iv', 'iv', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['ivmaj7', 'ivmaj7', 'ivmaj7', 'ivmaj7', 'bII', 'bII', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['bII', 'bII', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [4, 2, 2, 8], weight: 3 },
    { cell: [16], weight: 3 },
    { cell: [-2, 2, 4, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    // Thirty-two sixteenths, like the drum, so the bass states the same
    // question-and-answer shape rather than repeating the question twice.
    { name: 'cycle-shape', weight: 6, cycle: 32, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.94 },
      { at: 2, dur: 5, tone: 'root', vel: 0.8 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.82 },
      { at: 16, dur: 7, tone: 'root', vel: 0.9 },
      { at: 24, dur: 7, tone: 'root', vel: 0.8 },
    ] },
    { name: 'half-bars', weight: 4, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.92 },
      { at: 8, dur: 7, tone: 'root', vel: 0.82 },
    ] },
    { name: 'pedal', weight: 3, sustain: true, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.86 }] },
  ],
  comp: [
    { name: 'offbeat-oud', weight: 5, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.5 },
      { at: 6, dur: 2, vel: 0.44 },
      { at: 10, dur: 2, vel: 0.5 },
      { at: 14, dur: 2, vel: 0.44 },
    ] },
    { name: 'answer-half', weight: 4, voices: 3, cycle: 32, hits: [
      { at: 6, dur: 2, vel: 0.5 },
      { at: 12, dur: 3, vel: 0.44 },
      { at: 22, dur: 2, vel: 0.5 },
      { at: 28, dur: 3, vel: 0.44 },
    ] },
    { name: 'held', weight: 3, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.4 }] },
  ],
  drums: [
    { name: 'masmoudi-kabir', weight: 6, cycle: 32, voices: {
      lp: [0, 2, 16],
      hp: [6, 12, 22, 28],
      tb: [0, 4, 8, 12, 16, 20, 24, 28],
    } },
    { name: 'masmoudi-riq', weight: 5, cycle: 32, voices: {
      lp: [0, 2, 16],
      hp: [6, 12, 22, 28],
      mp: [10, 26],
      tb: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    } },
    { name: 'masmoudi-bare', weight: 3, cycle: 32, voices: {
      lp: [0, 2, 16],
      hp: [6, 12, 22, 28],
    } },
  ],
  melody: { leap: 0.11, ornament: 0.42, span: 13, sequence: 0.5, syncopation: 0.28 },
};

/**
 * CHIFTETELLI — the taqsim with a pulse under it.
 *
 *   D  .  .  T  .  T  D  .  |  D  .  .  T  .  .  T  .
 *
 * Another sixteen-pulse cycle over a 4/4 bar, and the slowest thing in the
 * catalogue that still has a drum in it. The whole point of a chiftetelli is
 * that it is *nearly* free: the darbuka lays down a cycle so wide and so full
 * of holes that the soloist can play across it as though nothing were there,
 * which is what a floor-show taqsim needs — a rhythm you can stop listening to.
 *
 * `hook: 'loose'` and a high `melody.ornament`, both for the same reason. This
 * style is a solo with an accompaniment rather than a tune with a band, and a
 * chorus that came back the same way twice would be a different piece of music.
 */
const chiftetelli: Style = {
  id: 'chiftetelli',
  label: 'Chiftetelli',
  description:
    'A sixteen-pulse cycle so slow and so full of holes that the soloist can play across it. A taqsim with just enough pulse to dance to.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [58, 78],
  swing: 0,
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass'],
  hook: 'loose',
  counterSpacing: 1,
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'iv', 'iv'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['VImaj7', 'VImaj7', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'VI', 'VI', 'i', 'i', 'i', 'i'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 }],
    outro: [{ chords: ['iv', 'i', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'I', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'I', 'I', 'bII', 'bII'], weight: 5 },
      { chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 4 },
      { chords: ['bIImaj7', 'bIImaj7', 'iv', 'iv', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['ivmaj7', 'ivmaj7', 'iv', 'iv', 'I', 'I', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    outro: [{ chords: ['bII', 'I', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 2, 2, 4], weight: 5 },
    { cell: [-4, 4, 2, 2, 4], weight: 4 },
    { cell: [12, 2, 2], weight: 4 },
    { cell: [2, 2, 2, 2, 8], weight: 4 },
    { cell: [-8, 4, 2, 2], weight: 3 },
    { cell: [4, 2, 2, 2, 2, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [-2, 2, 2, 2, 2, 2, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'cycle-pedal', weight: 6, cycle: 32, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.88 },
      { at: 16, dur: 16, tone: 'root', vel: 0.82 },
    ] },
    { name: 'cycle-shape', weight: 4, cycle: 32, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 0.9 },
      { at: 12, dur: 3, tone: 'root', vel: 0.84 },
      { at: 16, dur: 5, tone: 'fifth', vel: 0.82 },
      { at: 28, dur: 3, tone: 'root', vel: 0.8 },
    ] },
    { name: 'half-bar', weight: 3, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.9 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.78 },
    ] },
  ],
  comp: [
    { name: 'held', weight: 6, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.38 }] },
    { name: 'qanun-tremolo', weight: 4, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.36 }, { at: 2, dur: 2, vel: 0.3 },
      { at: 4, dur: 2, vel: 0.34 }, { at: 6, dur: 2, vel: 0.3 },
      { at: 8, dur: 2, vel: 0.36 }, { at: 10, dur: 2, vel: 0.3 },
      { at: 12, dur: 2, vel: 0.34 }, { at: 14, dur: 2, vel: 0.3 },
    ] },
    { name: 'late-answer', weight: 3, voices: 3, hits: [{ at: 10, dur: 5, vel: 0.42 }] },
  ],
  drums: [
    { name: 'chiftetelli', weight: 6, cycle: 32, voices: {
      lp: [0, 12, 16],
      hp: [6, 10, 22, 28],
      tb: [0, 8, 16, 24],
    } },
    { name: 'chiftetelli-riq', weight: 5, cycle: 32, voices: {
      lp: [0, 12, 16],
      hp: [6, 10, 22, 28],
      mp: [4, 20],
      tb: [0, 4, 8, 12, 16, 20, 24, 28],
    } },
    { name: 'chiftetelli-bare', weight: 4, cycle: 32, voices: {
      lp: [0, 12, 16],
      hp: [6, 22],
    } },
  ],
  melody: { leap: 0.13, ornament: 0.55, span: 16, sequence: 0.3, syncopation: 0.35 },
};

/**
 * ZAFFA — the procession, and the loudest thing here by a distance.
 *
 *   D  .  D  .  |  T  T  D  .
 *
 * The wedding march: mizmar, tabl baladi, and a crowd, moving down a street or
 * across a hotel ballroom in front of the couple. It is the one style in this
 * catalogue that is not played sitting down, and everything about the tables
 * follows from that. The `bd` in the drum patterns is the **tabl** — a
 * shoulder-slung two-headed drum beaten with a stick — and it is deliberately
 * not written on `lp`, because a tabl is a different object played by a
 * different person while walking.
 *
 * The style here that leans hardest on the `brass` layer — this note said *the
 * only style that keeps it* and there are three, argued with the counts under
 * `transitions` below. A zaffa band is a brass band: the mizmar carries the tune
 * and whatever trumpets the family could afford double it a fourth away, and
 * that is what the layer is for.
 */
const zaffa: Style = {
  id: 'zaffa',
  label: 'Zaffa',
  description:
    'The wedding procession. Mizmar and tabl baladi over a heavy four, played standing up and moving — the loudest brass in the genre.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [100, 128],
  swing: 0,
  modeWeights: { minor: 0.22, major: 0.78 },
  relativeMajorChorus: 0,
  /**
   * The shot stays and the break goes, and the reason is the one thing this
   * style has that no other style here has: it is moving.
   *
   * A zaffa is played walking, in front of a couple, down a street or across a
   * ballroom, and the header above says so as the first fact about it. Stop-time
   * is the band stopping dead for a bar. A procession that stops dead for a bar
   * is a procession that has stopped, and the forty people behind it walk into
   * each other — the gesture does not fail musically so much as fail to be
   * available. Measured over 200 seeds with the genre palette: 87 break bars,
   * all of them edited, the tabl and the riq going from 12.75 strokes to 2.39
   * and the comp from 6.33 to 0.03. That is the street going quiet, and the one
   * number here that cannot afford it.
   *
   * **The shot is the opposite case and is weighted up rather than merely kept.**
   * This style has `brass` in it — the mizmar carries the tune and whatever
   * trumpets the family could afford double it — and a band figure landed
   * together is exactly what that ensemble does at a corner or a doorway.
   *
   * **This note said *the only style in the genre*, and there are three.**
   * Eighteen of the twenty-one styles here write `excludeLayers: ['brass']`; the
   * three that do not are this one, `saidi` and `dabke`, which is the same three
   * that are outdoor or wedding music and for the same reason — a mizmar and a
   * tabl are what an ensemble sounds like when it has to be heard across a
   * street. Measured at forty seeds each: **zaffa 1111 brass notes in 27 of 40
   * songs, saidi 700 in 23, dabke 665 in 24**, and 0 in the other eighteen
   * styles. So this is the loudest of the three rather than the sole one, which
   * leaves the argument below intact — the claim it needs is that a shot puts
   * *these* horns on the same sixteenth as everybody else, not that no other
   * style owns any. The brass is what proves it: over the same 160 shot bars the
   * brass goes from 0.41 onsets to 1.34, more than trebling, because a shot is
   * the one edit in this file that puts the horns on the same sixteenth as
   * everybody else. The drums drop from 13.94 to 7.36 in the same bar, which is
   * a tabl playing a figure instead of a groove and not a tabl going away.
   */
  transitions: [['fill', 7], ['shot', 4]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'i', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['iv', 'i', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'bII', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 },
      { chords: ['I', 'bII', 'I', 'bII', 'I', 'I', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'iv', 'iv', 'bII', 'bII', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5, note: 'Two bars up, two bars home, at parade volume. This is the figure a mizmar plays over and over for as long as the walk lasts' },
      { chords: ['iv', 'iv', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['bII', 'I', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 8], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  bass: [
    { name: 'march', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.96 },
      { at: 4, dur: 3, tone: 'root', vel: 0.86 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.9 },
      { at: 12, dur: 3, tone: 'root', vel: 0.86 },
    ] },
    { name: 'half-bar', weight: 4, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.96 },
      { at: 8, dur: 7, tone: 'root', vel: 0.88 },
    ] },
    { name: 'octave-march', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.96 },
      { at: 4, dur: 3, tone: 'octave', vel: 0.82 },
      { at: 8, dur: 3, tone: 'root', vel: 0.92 },
      { at: 12, dur: 3, tone: 'fifth', vel: 0.84 },
    ] },
  ],
  comp: [
    { name: 'on-the-beats', weight: 5, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.58 },
      { at: 4, dur: 3, vel: 0.5 },
      { at: 8, dur: 3, vel: 0.56 },
      { at: 12, dur: 3, vel: 0.5 },
    ] },
    { name: 'offbeat-shove', weight: 4, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.56 },
      { at: 6, dur: 2, vel: 0.5 },
      { at: 10, dur: 2, vel: 0.56 },
      { at: 14, dur: 2, vel: 0.5 },
    ] },
    { name: 'half-bar', weight: 3, voices: 4, hits: [
      { at: 0, dur: 7, vel: 0.54 },
      { at: 8, dur: 7, vel: 0.48 },
    ] },
  ],
  drums: [
    { name: 'zaffa', weight: 6, voices: {
      bd: [0, 4, 12],
      lp: [0, 4, 12],
      hp: [8, 10],
      tb: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'zaffa-street', weight: 5, voices: {
      bd: [0, 8],
      lp: [0, 4, 12],
      hp: [8, 10, 14],
      mp: [2, 6],
      tb: [0, 4, 8, 12],
    } },
    { name: 'zaffa-clapping', weight: 4, voices: {
      bd: [0, 4, 12],
      lp: [0, 4, 12],
      cp: [8],
      tb: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  melody: { leap: 0.16, ornament: 0.3, span: 14, sequence: 0.6, syncopation: 0.3 },
};

/**
 * DABKE — the line dance, and the stamp.
 *
 *   D  .  T  D  |  .  T  D  .
 *
 * Levantine rather than Egyptian: Lebanon, Syria, Palestine and Jordan, danced
 * in a line holding shoulders with the leader at one end. What the iqa' has to
 * do is tell forty people when to stamp, so the doums are laid on the ground at
 * uneven distances and the tek in between is what makes the foot come up. It is
 * the one dance rhythm here where the *bass* is the loudest instrument in the
 * room, because from 1975 onward the dabke that people actually danced to came
 * out of a keyboard with a very large left hand.
 */
const dabke: Style = {
  id: 'dabke',
  label: 'Dabke',
  description:
    'The Levantine line dance. Doums laid at uneven distances so the line knows when to stamp, over the biggest bass in the catalogue.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [114, 146],
  swing: 0,
  modeWeights: { minor: 0.58, major: 0.42 },
  relativeMajorChorus: 0,
  excludeLayers: ['pad'],
  /**
   * The one style here that wants **more** stop-time than the genre gives it,
   * and it wants it for a reason already written four lines above this.
   *
   * The header says the bass is the loudest instrument in the room, because from
   * 1975 onward the dabke people actually danced to came out of a keyboard with
   * a very large left hand. `BREAK_CARRIER` is the bass. So a break in a dabke
   * is not a hole the arrangement has to survive, it is the two seconds where
   * the loudest thing in the room is the only thing in the room — and a line of
   * dancers holding shoulders, waiting to stamp, is the most attentive audience
   * a stop-time bar can have.
   *
   * The edit does what the sentence says. Over 200 seeds, 98 break bars, all
   * edited: the drums fall from 10.51 strokes to 2.03 and the comp from 4.79 to
   * 0.09, while **the bass does not move at all — 3.94 onsets either way**. That
   * last number is the whole argument. Everywhere else in this genre a break is
   * a subtraction; here it is a subtraction that leaves the part the style is
   * named for standing alone at its normal weight.
   *
   * `break` at 4 against the genre's 2, and `shot` kept at 3 rather than raised,
   * because the leader signalling a change and forty people landing on it
   * together is real and is the *less* characteristic of the two — a dabke line
   * knows the tune, so the gesture that tells them something is the one that
   * takes the ground away rather than the one that hits it.
   */
  transitions: [['fill', 6], ['break', 4], ['shot', 3]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'iv', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'iv', 'iv'], weight: 5, note: 'A chord every two bars, which is twice the harmonic rate of anything else here. A dabke is the one style whose accompaniment is allowed to be a part rather than a floor' },
      { chords: ['i', 'iv', 'i', 'iv', 'VI', 'VI', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'VI', 'VI', 'iv', 'iv', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'VI', 'VI', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VImaj7', 'VImaj7', 'iv7', 'iv7', 'i', 'i', 'i', 'i'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['iv', 'i', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'bII', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'bII', 'bII', 'I', 'I', 'bII', 'bII'], weight: 5 },
      { chords: ['I', 'bII', 'I', 'bII', 'iv', 'iv', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'iv', 'iv', 'bII', 'bII', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'iv', 'iv', 'bII', 'bII', 'I', 'I'], weight: 5 },
      { chords: ['iv', 'iv', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['bIImaj7', 'bIImaj7', 'ivmaj7', 'ivmaj7', 'I', 'I', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['bII', 'I', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [-2, 2, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 2, 2, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [8, 2, 2, 4], weight: 3 },
    { cell: [-4, 4, 2, 2, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  bass: [
    // The stamps, doubled. Nothing here is on the offbeat: a dancer with their
    // arm round somebody else's shoulder needs the floor, not the lift.
    { name: 'stamp', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.96 },
      { at: 6, dur: 2, tone: 'root', vel: 0.86 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.9 },
      { at: 12, dur: 3, tone: 'root', vel: 0.88 },
    ] },
    // Two bars, so the second answers the first — the keyboard bass line that
    // every dabke record after 1980 is built on.
    { name: 'two-bar-hook', weight: 5, cycle: 32, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.96 },
      { at: 6, dur: 2, tone: 'root', vel: 0.84 },
      { at: 8, dur: 3, tone: 'root', vel: 0.9 },
      { at: 12, dur: 3, tone: 3, vel: 0.86 },
      { at: 16, dur: 3, tone: 5, vel: 0.94 },
      { at: 22, dur: 2, tone: 3, vel: 0.84 },
      { at: 24, dur: 3, tone: 'root', vel: 0.9 },
      { at: 28, dur: 3, tone: -2, vel: 0.84 },
    ] },
    { name: 'four-square', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.96 },
      { at: 4, dur: 3, tone: 'root', vel: 0.84 },
      { at: 8, dur: 3, tone: 'root', vel: 0.9 },
      { at: 12, dur: 3, tone: 'fifth', vel: 0.84 },
    ] },
  ],
  comp: [
    { name: 'offbeat-organ', weight: 5, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.54 },
      { at: 6, dur: 2, vel: 0.48 },
      { at: 10, dur: 2, vel: 0.54 },
      { at: 14, dur: 2, vel: 0.48 },
    ] },
    { name: 'on-the-stamps', weight: 4, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.56 },
      { at: 6, dur: 2, vel: 0.48 },
      { at: 12, dur: 3, vel: 0.52 },
    ] },
    { name: 'held', weight: 3, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.42 }] },
  ],
  drums: [
    { name: 'dabke', weight: 6, voices: {
      lp: [0, 6, 12],
      hp: [4, 10],
      tb: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'dabke-hard', weight: 5, voices: {
      lp: [0, 6, 12],
      hp: [4, 10, 14],
      mp: [8],
      cp: [8],
      tb: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'dabke-open', weight: 3, voices: {
      lp: [0, 6, 12],
      hp: [4, 10],
    } },
  ],
  melody: { leap: 0.15, ornament: 0.28, span: 13, sequence: 0.65, syncopation: 0.35 },
};

/**
 * KHALEEJI — six eighths, and the two hands disagreeing about where they are.
 *
 *   D  .  T  .  D  T      (6/8)
 *
 * The Gulf: Saudi, Kuwait, Bahrain, and the *saut* and *khaliji* rhythms behind
 * them. This is the only genuinely compound metre in the catalogue and the
 * argument for spelling it in six rather than in a swung two is the hemiola:
 * the drum lands on the two dotted beats and the clapping lands on the three
 * plain ones, both at once and all the way through. In a 2/4 with the swing
 * knob turned up the second of those is inexpressible, because there is no slot
 * for it — `groups: [6, 6]` gives the bar the two heads the drum needs and
 * leaves the sixteenth grid intact underneath for everybody else.
 *
 * The oud is the lead here rather than an accompanist, which is a fact about
 * the region rather than about the rhythm: Gulf music is oud music in a way
 * Egyptian music stopped being in about 1930.
 */
const khaleeji: Style = {
  id: 'khaleeji',
  label: 'Khaleeji',
  description:
    'The Gulf 6/8. The drum in two dotted beats and the clapping in three plain ones, both at once — a hemiola no 2/4 can spell.',
  beatsPerBar: 3,
  beatUnit: 8,
  /** Two dotted beats, in sixteenths. The clapping is the other reading. */
  groups: [6, 6],
  bpm: [96, 126],
  swing: 0,
  modeWeights: { minor: 0.42, major: 0.58 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass'],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'VI', 'VI', 'iv', 'iv', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'VImaj7', 'VImaj7', 'i', 'i', 'i', 'i'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['iv', 'i', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'I', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'iv', 'iv', 'bII', 'bII', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'I', 'I', 'iv', 'iv', 'I', 'I'], weight: 5 },
      { chords: ['iv', 'iv', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['ivmaj7', 'ivmaj7', 'bIImaj7', 'bIImaj7', 'I', 'I', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['bII', 'I', 'I', 'I'], weight: 4 }],
  },
  // Twelve slots. The cells that break at 6 are the drum's reading and the ones
  // that break at 4 and 8 are the clapping's; both are in the table because
  // both are in the room.
  melodyCells: [
    { cell: [6, 6], weight: 5 },
    { cell: [4, 4, 4], weight: 5 },
    { cell: [2, 2, 2, 6], weight: 4 },
    { cell: [-2, 4, 2, 4], weight: 4 },
    { cell: [6, 2, 2, 2], weight: 4 },
    { cell: [2, 2, 2, 2, 2, 2], weight: 3 },
    { cell: [-4, 4, 4], weight: 3 },
    { cell: [12], weight: 3 },
    { cell: [4, 2, 6], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 5 },
    { cell: [6, 6], weight: 3 },
    { cell: [-4, 8], weight: 3 },
  ],
  bass: [
    { name: 'dotted-beats', weight: 6, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 0.94 },
      { at: 6, dur: 5, tone: 'fifth', vel: 0.84 },
    ] },
    { name: 'three-plain', weight: 4, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.94 },
      { at: 4, dur: 3, tone: 'root', vel: 0.8 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.86 },
    ] },
    { name: 'pedal', weight: 3, sustain: true, hits: [{ at: 0, dur: 12, tone: 'root', vel: 0.86 }] },
  ],
  comp: [
    { name: 'oud-strum', weight: 5, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.54 },
      { at: 4, dur: 2, vel: 0.46 },
      { at: 6, dur: 2, vel: 0.52 },
      { at: 10, dur: 2, vel: 0.46 },
    ] },
    { name: 'on-the-threes', weight: 4, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.52 },
      { at: 4, dur: 3, vel: 0.46 },
      { at: 8, dur: 3, vel: 0.5 },
    ] },
    { name: 'held', weight: 3, voices: 4, sustain: true, hits: [{ at: 0, dur: 12, vel: 0.42 }] },
  ],
  drums: [
    { name: 'khaleeji', weight: 6, voices: {
      lp: [0, 6],
      hp: [4, 8, 10],
      tb: [0, 2, 4, 6, 8, 10],
    } },
    { name: 'khaleeji-clap', weight: 5, voices: {
      lp: [0, 6],
      hp: [4, 10],
      // The clapping, on the three plain beats, against a drum in two.
      cp: [0, 4, 8],
      tb: [0, 2, 4, 6, 8, 10],
    } },
    { name: 'khaleeji-bare', weight: 3, voices: {
      lp: [0, 6],
      hp: [4, 10],
    } },
  ],
  melody: { leap: 0.13, ornament: 0.35, span: 13, sequence: 0.6, syncopation: 0.3 },
};

/**
 * SAMA'I THAQIL — ten eighths, three-two-two-three.
 *
 *   D  .  .  T  .  D  .  T  .  .      (10/8)
 *
 * The classical instrumental form of the Ottoman-Arabic tradition, and the one
 * metre in this catalogue that a listener is *supposed* to have to work at. It
 * is `groups` doing precisely what `style/types.ts` says it exists for: there
 * is no formula that recovers 3+2+2+3 from the number 20, the grouping is a
 * compositional choice, and 2+3+3+2 is a different piece of music. Without it
 * `metricStrength` divides by four and puts a half-bar accent on the ninth
 * sixteenth, which is in the middle of the third group.
 *
 * A sama'i is four *khanat* separated by a returning *taslim*, which is a
 * chorus by another name and the reason the form tables at the genre level fit
 * it without modification. The fourth khana traditionally changes metre
 * altogether; that is out of reach — `beatsPerBar` is song-level — and it is
 * named in `index.ts` among the things the engine cannot say.
 */
const samai: Style = {
  id: 'samai',
  label: "Sama'i thaqil",
  description:
    'Ten eighths grouped three-two-two-three. The classical instrumental form: khanat separated by a returning taslim, at a tempo that lets you count them.',
  beatsPerBar: 5,
  beatUnit: 8,
  /** 3+2+2+3, in sixteenths. The long groups are the outside ones. */
  groups: [6, 4, 4, 6],
  bpm: [50, 72],
  swing: 0,
  modeWeights: { minor: 0.68, major: 0.32 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass'],
  counterSpacing: 1,
  /**
   * A khana boundary is not a section join, it is a **qafla**, and the shot is
   * the only kind in the vocabulary that is one.
   *
   * The header above says a sama'i is four khanat separated by a returning
   * taslim, and that the form tables fit it without modification because a
   * taslim is a chorus by another name. What the form tables cannot say is how
   * the taslim is *arrived at*: the ensemble plays a cadential figure together,
   * lands it, and the refrain starts. That is `shot`'s definition — replace what
   * every layer holds in the last bar with a shared figure — and it is a rare
   * case of a transition kind matching a named object in the repertoire rather
   * than approximating one.
   *
   * It works, measured, and the number that shows it is the comp. Over 200 seeds
   * and 69 shot bars, the comp drops from 12.07 onsets to 7.84 while the melody
   * rises from 1.39 to 1.62, the pad from 0.30 to 1.07 and the bass from 2.10 to
   * 2.81: the qanun stops tremoloing and everybody else arrives, which is four
   * layers converging on one rhythm and is what a qafla sounds like from the
   * inside. `shot` leads the table rather than merely appearing in it — this is
   * the only style in the genre that weights it above `fill` — and it needs to,
   * because a sama'i has the fewest seams of anything here at 5.6 per song
   * against a longa's 12.6, so a gesture at the genre's 3-in-12 reaches roughly
   * one khana in four.
   *
   * **The break comes out, and that is the refusal rather than the adoption.**
   * `index.ts` argues for stop-time on the grounds that it is the most reliable
   * way this repertoire gets a room to shout — the drum stopping dead while the
   * singer holds a note over nothing. That is a tarab device and it belongs to a
   * singer and an answering audience. A sama'i is the classical instrumental
   * form on the bill, at 50–72 BPM, and its own blurb in `staging.ts` is *ten of
   * them, count if you like, nobody else is*: it is the number the room listens
   * to rather than shouts at. The 22 break bars in 200 seeds bear the mismatch
   * out — the comp falls from 11.18 onsets to nothing and the drums from 10.32
   * to 0.18, leaving the bass alone at 2.05 in a form whose whole interest is
   * the line, since the note on its verse table says it has no words to carry
   * any.
   */
  transitions: [['shot', 5], ['fill', 4]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'iv', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'VI', 'VI', 'i', 'i'], weight: 5, note: 'The khana: out to the fourth, up to the sixth, home. A sama\'i moves more than anything else here because it has no words to carry the interest' },
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'VImaj7', 'VImaj7', 'iv', 'iv', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5, note: 'The taslim, which comes back after every khana and is the only thing in the piece anybody is expected to recognise' },
      { chords: ['VI', 'VI', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    bridge: [
      { chords: ['VImaj7', 'VImaj7', 'iv7', 'iv7', 'iv', 'iv', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'iv', 'iv', 'VI', 'VI', 'i', 'i'], weight: 3 },
    ],
    solo: [{ chords: ['i', 'i', 'iv', 'iv', 'VI', 'VI', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['iv', 'iv', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'bII', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'bII', 'bII', 'iv', 'iv', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 4 },
      { chords: ['iv', 'iv', 'bIImaj7', 'bIImaj7', 'iv', 'iv', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 },
      { chords: ['iv', 'iv', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    bridge: [
      { chords: ['ivmaj7', 'ivmaj7', 'bIImaj7', 'bIImaj7', 'iv', 'iv', 'I', 'I'], weight: 4 },
    ],
    solo: [{ chords: ['I', 'I', 'bII', 'bII', 'iv', 'iv', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['bII', 'bII', 'I', 'I'], weight: 4 }],
  },
  // Twenty sixteenths. The cells that break at 6, 10 and 14 spell the grouping
  // out; the ones that run through those points are the syncopation, which only
  // means anything because the others exist.
  melodyCells: [
    { cell: [6, 4, 4, 6], weight: 5 },
    { cell: [6, 4, 4, 4, 2], weight: 4 },
    { cell: [-2, 4, 4, 4, 6], weight: 4 },
    { cell: [4, 2, 4, 4, 6], weight: 4 },
    { cell: [2, 2, 2, 4, 4, 6], weight: 4 },
    { cell: [10, 4, 6], weight: 3 },
    { cell: [6, 2, 2, 4, 6], weight: 3 },
    { cell: [-6, 4, 4, 6], weight: 3 },
    { cell: [4, 4, 4, 4, 4], weight: 2 },
    { cell: [20], weight: 2 },
  ],
  cadenceCells: [
    { cell: [20], weight: 5 },
    { cell: [14, 6], weight: 4 },
    { cell: [-4, 16], weight: 3 },
    { cell: [10, 10], weight: 2 },
  ],
  bass: [
    { name: 'group-heads', weight: 6, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 0.9 },
      { at: 10, dur: 3, tone: 'fifth', vel: 0.8 },
      { at: 14, dur: 5, tone: 'root', vel: 0.84 },
    ] },
    { name: 'long-groups-only', weight: 4, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 0.9 },
      { at: 14, dur: 5, tone: 'root', vel: 0.82 },
    ] },
    { name: 'pedal', weight: 3, sustain: true, hits: [{ at: 0, dur: 20, tone: 'root', vel: 0.86 }] },
  ],
  comp: [
    { name: 'on-the-groups', weight: 5, voices: 3, hits: [
      { at: 0, dur: 5, vel: 0.5 },
      { at: 6, dur: 3, vel: 0.42 },
      { at: 10, dur: 3, vel: 0.46 },
      { at: 14, dur: 5, vel: 0.44 },
    ] },
    { name: 'qanun-tremolo', weight: 4, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.4 }, { at: 2, dur: 2, vel: 0.34 },
      { at: 4, dur: 2, vel: 0.36 }, { at: 6, dur: 2, vel: 0.34 },
      { at: 8, dur: 2, vel: 0.38 }, { at: 10, dur: 2, vel: 0.34 },
      { at: 12, dur: 2, vel: 0.36 }, { at: 14, dur: 2, vel: 0.38 },
      { at: 16, dur: 2, vel: 0.34 }, { at: 18, dur: 2, vel: 0.34 },
    ] },
    { name: 'held', weight: 3, voices: 4, sustain: true, hits: [{ at: 0, dur: 20, vel: 0.4 }] },
  ],
  drums: [
    { name: 'samai-thaqil', weight: 6, voices: {
      lp: [0, 10],
      hp: [6, 14],
      tb: [0, 6, 10, 14],
    } },
    { name: 'samai-riq', weight: 5, voices: {
      lp: [0, 10],
      hp: [6, 14],
      mp: [4, 18],
      tb: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18],
    } },
    // The frame drum alone, which is what a sama'i on a 1930s side has under
    // it — one riq, and the ensemble's own accents doing the rest.
    { name: 'riq-only', weight: 4, voices: {
      tb: [0, 6, 10, 14],
    } },
  ],
  melody: { leap: 0.14, ornament: 0.4, span: 16, sequence: 0.5, syncopation: 0.32 },
};

/**
 * AQSAQ — nine eighths, two-two-two-three.
 *
 *   D  .  T  .  D  .  T  .  T      (9/8)
 *
 * *Aqsaq* is Turkish for "limping", and the limp is the last group: three
 * regular pairs and then one that is a beat and a half long. It is the metre of
 * the karsilama and of a great deal of Anatolian and Syrian dance music, and it
 * is the fastest asymmetric cycle here that people actually dance to rather
 * than sit and listen to.
 *
 * The difference between this and `samai` is worth stating because both are
 * "odd" and they are not the same kind of odd. A sama'i's long groups are on
 * the outside and the bar is symmetrical about its middle; an aqsaq's one long
 * group is at the end, so the bar never balances and every turn of it arrives
 * early.
 */
const aqsaq: Style = {
  id: 'aqsaq',
  label: 'Aqsaq',
  description:
    'Nine eighths, three regular pairs and one long group at the end. The bar never balances, so every turn of it arrives early.',
  beatsPerBar: 4.5,
  beatUnit: 8,
  /** 2+2+2+3, in sixteenths. The limp is the last one. */
  groups: [4, 4, 4, 6],
  bpm: [108, 138],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass', 'pad'],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'VI', 'VI', 'iv', 'iv', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'iv7', 'iv7', 'VI', 'VI', 'i', 'i'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['iv', 'i', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'I', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'iv', 'iv', 'bII', 'bII', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'I', 'I', 'iv', 'iv', 'I', 'I'], weight: 5 },
      { chords: ['iv', 'iv', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['ivmaj7', 'ivmaj7', 'ivmaj7', 'ivmaj7', 'bII', 'bII', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['bII', 'I', 'I', 'I'], weight: 4 }],
  },
  // Eighteen slots, and the last six are the event. Every cell that ends in a
  // 6 or a 4-and-2 is saying so.
  melodyCells: [
    { cell: [4, 4, 4, 6], weight: 5 },
    { cell: [2, 2, 4, 4, 6], weight: 5 },
    { cell: [4, 4, 4, 4, 2], weight: 4 },
    { cell: [-2, 2, 4, 4, 6], weight: 4 },
    { cell: [8, 4, 6], weight: 3 },
    { cell: [4, 2, 2, 4, 6], weight: 3 },
    { cell: [2, 2, 2, 2, 4, 6], weight: 3 },
    { cell: [-4, 4, 4, 6], weight: 3 },
    { cell: [18], weight: 2 },
  ],
  cadenceCells: [
    { cell: [18], weight: 5 },
    { cell: [12, 6], weight: 4 },
    { cell: [-4, 14], weight: 2 },
  ],
  bass: [
    { name: 'group-heads', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.94 },
      { at: 4, dur: 3, tone: 'root', vel: 0.82 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.88 },
      { at: 12, dur: 5, tone: 'root', vel: 0.86 },
    ] },
    { name: 'limp', weight: 4, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.94 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.84 },
      { at: 12, dur: 5, tone: 'root', vel: 0.86 },
    ] },
    { name: 'pedal', weight: 3, sustain: true, hits: [{ at: 0, dur: 18, tone: 'root', vel: 0.86 }] },
  ],
  comp: [
    { name: 'on-the-groups', weight: 5, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.52 },
      { at: 4, dur: 3, vel: 0.44 },
      { at: 8, dur: 3, vel: 0.5 },
      { at: 12, dur: 5, vel: 0.44 },
    ] },
    { name: 'off-the-groups', weight: 4, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.5 },
      { at: 6, dur: 2, vel: 0.44 },
      { at: 10, dur: 2, vel: 0.5 },
      { at: 15, dur: 3, vel: 0.44 },
    ] },
    { name: 'held', weight: 3, voices: 3, sustain: true, hits: [{ at: 0, dur: 18, vel: 0.42 }] },
  ],
  drums: [
    { name: 'aqsaq', weight: 6, voices: {
      lp: [0, 8],
      hp: [4, 12, 16],
      tb: [0, 4, 8, 12],
    } },
    { name: 'aqsaq-riq', weight: 5, voices: {
      lp: [0, 8],
      hp: [4, 12, 16],
      mp: [2, 10],
      tb: [0, 2, 4, 6, 8, 10, 12, 14, 16],
    } },
    { name: 'aqsaq-bare', weight: 3, voices: {
      lp: [0, 8],
      hp: [4, 12, 16],
    } },
  ],
  melody: { leap: 0.14, ornament: 0.3, span: 13, sequence: 0.6, syncopation: 0.32 },
};

/**
 * DAWR HINDI — seven eighths, three-two-two.
 *
 *   D  .  .  T  .  D  T      (7/8)
 *
 * The long group first, which is what makes it push rather than limp: the bar
 * opens with a beat and a half of doum and then two short groups fall out of it
 * downhill. It is the cycle of a great deal of Egyptian instrumental writing
 * and of the *dawr* the name comes from — a sung form built on a refrain the
 * audience answers, which is the closest thing this repertoire has to a
 * call-and-response chorus.
 *
 * Three asymmetric metres in one catalogue looks like an indulgence and is not:
 * 10/8, 9/8 and 7/8 put their long group in three different places — outside,
 * last and first — and those are three different kinds of bar rather than three
 * lengths of the same one.
 */
const dawrhindi: Style = {
  id: 'dawrhindi',
  label: 'Dawr Hindi',
  description:
    'Seven eighths with the long group first, so the bar pushes downhill out of its own doum. The cycle of the sung dawr.',
  beatsPerBar: 3.5,
  beatUnit: 8,
  /** 3+2+2, in sixteenths. The long group leads. */
  groups: [6, 4, 4],
  bpm: [94, 124],
  swing: 0,
  modeWeights: { minor: 0.62, major: 0.38 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass'],
  progressions: {
    intro: [{ chords: ['i', 'i', 'iv', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'VI', 'VI', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['VImaj7', 'VImaj7', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['iv7', 'iv7', 'VI', 'VI', 'i', 'i', 'i', 'i'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['iv', 'i', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'bII', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'bII', 'bII', 'iv', 'iv', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 },
      { chords: ['bIImaj7', 'bIImaj7', 'iv', 'iv', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['ivmaj7', 'ivmaj7', 'iv', 'iv', 'I', 'I', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['bII', 'I', 'I', 'I'], weight: 4 }],
  },
  // Fourteen slots, opening long.
  melodyCells: [
    { cell: [6, 4, 4], weight: 5 },
    { cell: [4, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 2, 4, 4], weight: 4 },
    { cell: [-2, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 2, 4], weight: 4 },
    { cell: [10, 4], weight: 3 },
    { cell: [-6, 4, 4], weight: 3 },
    { cell: [6, 4, 2, 2], weight: 3 },
    { cell: [14], weight: 2 },
  ],
  cadenceCells: [
    { cell: [14], weight: 5 },
    { cell: [6, 8], weight: 3 },
    { cell: [-4, 10], weight: 3 },
  ],
  bass: [
    { name: 'group-heads', weight: 6, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 0.94 },
      { at: 6, dur: 3, tone: 'fifth', vel: 0.82 },
      { at: 10, dur: 3, tone: 'root', vel: 0.86 },
    ] },
    { name: 'long-and-home', weight: 4, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 0.94 },
      { at: 10, dur: 3, tone: 'root', vel: 0.84 },
    ] },
    { name: 'pedal', weight: 3, sustain: true, hits: [{ at: 0, dur: 14, tone: 'root', vel: 0.86 }] },
  ],
  comp: [
    { name: 'on-the-groups', weight: 5, voices: 3, hits: [
      { at: 0, dur: 5, vel: 0.52 },
      { at: 6, dur: 3, vel: 0.44 },
      { at: 10, dur: 3, vel: 0.48 },
    ] },
    { name: 'short-groups-only', weight: 4, voices: 3, hits: [
      { at: 6, dur: 3, vel: 0.5 },
      { at: 10, dur: 3, vel: 0.46 },
    ] },
    { name: 'held', weight: 3, voices: 4, sustain: true, hits: [{ at: 0, dur: 14, vel: 0.42 }] },
  ],
  drums: [
    { name: 'dawr-hindi', weight: 6, voices: {
      lp: [0, 10],
      hp: [6, 12],
      tb: [0, 6, 10],
    } },
    { name: 'dawr-hindi-riq', weight: 5, voices: {
      lp: [0, 10],
      hp: [6, 12],
      mp: [2, 8],
      tb: [0, 2, 4, 6, 8, 10, 12],
    } },
    { name: 'dawr-hindi-bare', weight: 3, voices: {
      lp: [0, 10],
      hp: [6, 12],
    } },
  ],
  melody: { leap: 0.13, ornament: 0.38, span: 14, sequence: 0.55, syncopation: 0.3 },
};

/**
 * BASHRAF — a bar of sixteen sixteenths that is not a 4/4.
 *
 *   D  .  .  T  .  D  .  T      (8/8, grouped 3+2+3)
 *
 * The Ottoman *peşrev*, borrowed wholesale into the Arabic repertoire as the
 * piece that opens a concert. Its cycle here is a düyek read as three-two-three
 * rather than as four-four, and that is the reason it is worth a style of its
 * own: it fills exactly the same sixteen sixteenths a maqsum does and divides
 * them differently, so the *only* thing distinguishing it from every 4/4 above
 * is `groups`. If ever there were a demonstration that a bar length is not a
 * metre, this is it — take the grouping away and `metricStrength` produces a
 * maqsum's accents over a bashraf's notes and nothing throws.
 *
 * Slow, stately and entirely instrumental. A bashraf has four khanat and a
 * taslim like a sama'i, and it is the older and grander of the two.
 */
const bashraf: Style = {
  id: 'bashraf',
  label: 'Bashraf',
  description:
    'The concert opener. Sixteen sixteenths grouped three-two-three, so it fills a 4/4 bar and divides it wrongly on purpose.',
  beatsPerBar: 4,
  beatUnit: 8,
  /** 3+2+3, in sixteenths. The same bar length as a maqsum and not the same bar. */
  groups: [6, 4, 6],
  bpm: [80, 104],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass'],
  counterSpacing: 1,
  progressions: {
    intro: [{ chords: ['i', 'i', 'iv', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'VI', 'VI', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'VImaj7', 'VImaj7', 'iv', 'iv', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VImaj7', 'VImaj7', 'iv7', 'iv7', 'i', 'i', 'i', 'i'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['iv', 'iv', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'bII', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'bII', 'bII', 'iv', 'iv', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 },
      { chords: ['iv', 'iv', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['bIImaj7', 'bIImaj7', 'ivmaj7', 'ivmaj7', 'I', 'I', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['bII', 'bII', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [6, 4, 6], weight: 5 },
    { cell: [4, 2, 4, 6], weight: 4 },
    { cell: [2, 2, 2, 4, 6], weight: 4 },
    { cell: [6, 4, 4, 2], weight: 4 },
    { cell: [-2, 4, 4, 6], weight: 3 },
    { cell: [6, 2, 2, 6], weight: 3 },
    { cell: [10, 6], weight: 3 },
    { cell: [-6, 4, 6], weight: 2 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [10, 6], weight: 4 },
    { cell: [-4, 12], weight: 2 },
  ],
  bass: [
    { name: 'group-heads', weight: 6, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 0.9 },
      { at: 6, dur: 3, tone: 'fifth', vel: 0.8 },
      { at: 10, dur: 5, tone: 'root', vel: 0.84 },
    ] },
    { name: 'outer-groups', weight: 4, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 0.9 },
      { at: 10, dur: 5, tone: 'root', vel: 0.82 },
    ] },
    { name: 'pedal', weight: 3, sustain: true, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.86 }] },
  ],
  comp: [
    { name: 'on-the-groups', weight: 5, voices: 4, hits: [
      { at: 0, dur: 5, vel: 0.5 },
      { at: 6, dur: 3, vel: 0.42 },
      { at: 10, dur: 5, vel: 0.46 },
    ] },
    { name: 'qanun-tremolo', weight: 4, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.4 }, { at: 2, dur: 2, vel: 0.32 },
      { at: 4, dur: 2, vel: 0.34 }, { at: 6, dur: 2, vel: 0.38 },
      { at: 8, dur: 2, vel: 0.32 }, { at: 10, dur: 2, vel: 0.4 },
      { at: 12, dur: 2, vel: 0.32 }, { at: 14, dur: 2, vel: 0.34 },
    ] },
    { name: 'held', weight: 3, voices: 4, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.4 }] },
  ],
  drums: [
    { name: 'duyek', weight: 6, voices: {
      lp: [0, 10],
      hp: [6, 14],
      tb: [0, 6, 10, 14],
    } },
    { name: 'duyek-riq', weight: 5, voices: {
      lp: [0, 10],
      hp: [6, 14],
      mp: [4, 12],
      tb: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'riq-only', weight: 4, voices: {
      tb: [0, 6, 10, 14],
    } },
  ],
  melody: { leap: 0.13, ornament: 0.36, span: 15, sequence: 0.55, syncopation: 0.28 },
};

/**
 * LONGA — the fast one, and the only piece on the programme anybody claps to.
 *
 *   D  T  .  T      (2/4)
 *
 * The instrumental rondo that closes a concert, borrowed out of Romanian and
 * Greek dance music through Istanbul and thoroughly naturalised — Riyad
 * al-Sunbati's and Cemil Bey's longas are what a qanun player is auditioning
 * with. It is the virtuoso piece, so the melody tables are the busiest in the
 * catalogue: nothing here is longer than a quarter and most of it is
 * sixteenths.
 *
 * `hook: 'earworm'` because a longa is a rondo — the same strain comes back
 * between the episodes, unchanged, and a longa whose refrain developed would
 * have stopped being one.
 */
const longa: Style = {
  id: 'longa',
  label: 'Longa',
  description:
    'The closing rondo. A fast 2/4 for the qanun and the violin to show off over, with a refrain that comes back unchanged every time.',
  beatsPerBar: 2,
  beatUnit: 4,
  bpm: [150, 190],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass', 'pad'],
  hook: 'earworm',
  progressions: {
    intro: [{ chords: ['i', 'i', 'iv', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'VI', 'VI', 'i', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'i', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VImaj7', 'VImaj7', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['iv', 'i', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'bII', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'bII', 'bII', 'iv', 'iv', 'I', 'I'], weight: 5 },
      { chords: ['I', 'bII', 'I', 'bII', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 },
      { chords: ['iv', 'iv', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['bIImaj7', 'bIImaj7', 'iv', 'iv', 'I', 'I', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['bII', 'I', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [1, 1, 2, 2, 2], weight: 5 },
    { cell: [2, 2, 2, 2], weight: 5 },
    { cell: [1, 1, 1, 1, 4], weight: 4 },
    { cell: [2, 1, 1, 4], weight: 4 },
    { cell: [4, 2, 2], weight: 3 },
    { cell: [-2, 2, 2, 2], weight: 3 },
    { cell: [1, 1, 2, 4], weight: 3 },
    { cell: [8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [8], weight: 4 },
    { cell: [4, 4], weight: 4 },
    { cell: [6, 2], weight: 2 },
  ],
  bass: [
    { name: 'on-the-beats', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.94 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.84 },
    ] },
    { name: 'driving', weight: 4, hits: [
      { at: 0, dur: 1, tone: 'root', vel: 0.94 },
      { at: 2, dur: 1, tone: 'root', vel: 0.76 },
      { at: 4, dur: 1, tone: 'fifth', vel: 0.86 },
      { at: 6, dur: 1, tone: 'root', vel: 0.76 },
    ] },
    { name: 'two-bar-run', weight: 3, cycle: 16, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 0.94 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.84 },
      { at: 8, dur: 3, tone: 'octave', vel: 0.9 },
      { at: 12, dur: 3, tone: 'approach', vel: 0.82 },
    ] },
  ],
  comp: [
    { name: 'offbeats', weight: 5, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.54 },
      { at: 6, dur: 2, vel: 0.48 },
    ] },
    { name: 'downbeat', weight: 4, voices: 3, hits: [{ at: 0, dur: 3, vel: 0.54 }] },
    { name: 'every-eighth', weight: 3, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.5 }, { at: 2, dur: 2, vel: 0.42 },
      { at: 4, dur: 2, vel: 0.48 }, { at: 6, dur: 2, vel: 0.42 },
    ] },
  ],
  drums: [
    { name: 'longa', weight: 6, voices: {
      lp: [0],
      hp: [2, 6],
      mp: [4],
      tb: [0, 2, 4, 6],
    } },
    { name: 'longa-riq', weight: 5, voices: {
      lp: [0],
      hp: [2, 6],
      mp: [4],
      tb: [0, 1, 2, 3, 4, 5, 6, 7],
    } },
    { name: 'longa-hard', weight: 3, voices: {
      lp: [0, 4],
      hp: [2, 6],
      tb: [0, 2, 4, 6],
    } },
  ],
  melody: { leap: 0.18, ornament: 0.22, span: 17, sequence: 0.7, syncopation: 0.3 },
};

/**
 * MUWASHSHAH — the Andalusian song, in three.
 *
 *   D  .  T  .  T  .      (3/4, the sama'i darij)
 *
 * The oldest form in this catalogue by six hundred years: a strophic vocal
 * setting out of Muslim Spain, kept alive in Aleppo and Cairo and sung in
 * unison by a small chorus with the ensemble doubling them. That unison is the
 * whole texture and it is why `arrangement.unison` is weighted so hard at the
 * genre level — a muwashshah where the second instrument answered rather than
 * doubled would be a different piece of music.
 *
 * A three-beat bar and no backbeat anywhere, which puts it next to ambient's
 * `choral` in the only respect the two have in common: three beats imply no
 * groove even when something is playing on all of them.
 */
const muwashshah: Style = {
  id: 'muwashshah',
  label: 'Muwashshah',
  description:
    'The Andalusian strophic song in three, sung in unison by a small chorus with the ensemble doubling it. The oldest form here.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [88, 118],
  swing: 0,
  modeWeights: { minor: 0.68, major: 0.32 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass'],
  counterSpacing: 1,
  progressions: {
    intro: [{ chords: ['i', 'i', 'iv', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'VI', 'VI', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['VImaj7', 'VImaj7', 'iv7', 'iv7', 'i', 'i', 'i', 'i'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['iv', 'iv', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'bII', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'bII', 'bII', 'iv', 'iv', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 5 },
      { chords: ['bII', 'bII', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['ivmaj7', 'ivmaj7', 'bIImaj7', 'bIImaj7', 'I', 'I', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['bII', 'bII', 'I', 'I'], weight: 4 }],
  },
  // Twelve slots. Sung, so the resting value is a whole beat and the ornament
  // lives inside it rather than between the notes.
  melodyCells: [
    { cell: [4, 4, 4], weight: 5 },
    { cell: [8, 4], weight: 5 },
    { cell: [4, 2, 2, 4], weight: 4 },
    { cell: [-4, 4, 4], weight: 4 },
    { cell: [12], weight: 4 },
    { cell: [2, 2, 4, 4], weight: 3 },
    { cell: [6, 2, 4], weight: 3 },
    { cell: [-2, 2, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 6 },
    { cell: [8, 4], weight: 3 },
    { cell: [-4, 8], weight: 2 },
  ],
  bass: [
    { name: 'one-a-bar', weight: 6, hits: [{ at: 0, dur: 11, tone: 'root', vel: 0.88 }] },
    { name: 'root-fifth', weight: 4, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 0.9 },
      { at: 6, dur: 5, tone: 'fifth', vel: 0.78 },
    ] },
    { name: 'pedal', weight: 3, sustain: true, hits: [{ at: 0, dur: 12, tone: 'root', vel: 0.84 }] },
  ],
  comp: [
    { name: 'held', weight: 5, voices: 4, sustain: true, hits: [{ at: 0, dur: 12, vel: 0.4 }] },
    { name: 'on-the-beats', weight: 4, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.5 },
      { at: 4, dur: 3, vel: 0.42 },
      { at: 8, dur: 3, vel: 0.44 },
    ] },
    { name: 'oud-arpeggio', weight: 3, voices: 4, arpeggio: true, arpDirection: 'updown', hits: [
      { at: 0, dur: 2, vel: 0.46 }, { at: 2, dur: 2, vel: 0.38 },
      { at: 4, dur: 2, vel: 0.42 }, { at: 6, dur: 2, vel: 0.38 },
      { at: 8, dur: 2, vel: 0.42 }, { at: 10, dur: 2, vel: 0.38 },
    ] },
  ],
  drums: [
    { name: 'samai-darij', weight: 6, voices: {
      lp: [0],
      hp: [4, 8],
      tb: [0, 4, 8],
    } },
    { name: 'samai-darij-riq', weight: 5, voices: {
      lp: [0],
      hp: [4, 8],
      mp: [6, 10],
      tb: [0, 2, 4, 6, 8, 10],
    } },
    { name: 'riq-only', weight: 4, voices: {
      tb: [0, 4, 8],
    } },
  ],
  melody: { leap: 0.09, ornament: 0.34, span: 12, sequence: 0.62, syncopation: 0.18 },
};

/**
 * DULAB — four bars that say which maqam this is going to be.
 *
 * A dulab is not a piece, it is an announcement: a short instrumental strain
 * played before a singer comes in and again between verses, whose whole job is
 * to establish the maqam so that everybody in the room — including the singer —
 * knows where home is. It runs over a maqsum or a wahda and it is over in eight
 * bars.
 *
 * As a *style* that makes it the shortest and plainest thing in the catalogue,
 * and it earns its row for the same reason a `dulab` earns its place on a
 * programme: this genre has no way to count itself in — see `countIn` in
 * `index.ts` — and the announcement is what a takht does instead. It is also
 * the one style with no strong mode preference, because the point of the form
 * is that it can announce any maqam at all.
 */
const dulab: Style = {
  id: 'dulab',
  label: 'Dulab',
  description:
    'The announcement: a short instrumental strain over a plain maqsum whose only job is to establish which maqam everything after it is in.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [84, 110],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass', 'pad'],
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5, note: 'The tonic, then the fourth, then the tonic. A dulab is a scale with a rhythm under it and it is not pretending otherwise' },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'VI', 'VI', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['iv', 'i', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'iv', 'iv', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'bII', 'bII', 'I', 'I', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['bII', 'I', 'I', 'I'], weight: 4 }],
  },
  // Scalar and even. A dulab that syncopated would be announcing the drummer.
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 6 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 2, 2, 2, 2, 2, 2], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  bass: [
    { name: 'doum-double', weight: 6, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.9 },
      { at: 8, dur: 7, tone: 'root', vel: 0.82 },
    ] },
    { name: 'root-fifth', weight: 4, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 0.9 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.8 },
    ] },
  ],
  comp: [
    { name: 'offbeat-oud', weight: 5, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.5 },
      { at: 6, dur: 2, vel: 0.44 },
      { at: 10, dur: 2, vel: 0.5 },
      { at: 14, dur: 2, vel: 0.44 },
    ] },
    { name: 'half-bar', weight: 4, voices: 3, hits: [
      { at: 0, dur: 7, vel: 0.48 },
      { at: 8, dur: 7, vel: 0.44 },
    ] },
  ],
  drums: [
    { name: 'maqsum-plain', weight: 6, voices: {
      lp: [0, 8],
      hp: [2, 6, 12],
      tb: [0, 4, 8, 12],
    } },
    { name: 'wahda-plain', weight: 4, voices: {
      lp: [0],
      hp: [8, 12],
      tb: [0, 4, 8, 12],
    } },
    { name: 'riq-only', weight: 3, voices: {
      tb: [0, 4, 8, 12],
    } },
  ],
  melody: { leap: 0.1, ornament: 0.3, span: 14, sequence: 0.5, syncopation: 0.1 },
};

/**
 * TAQSIM — no iqa' at all, which is the one thing this catalogue is sorted by.
 *
 * A taqsim is an unmetred solo improvisation through a maqam: the player states
 * the lowest jins, rests on its top note, moves to the jins above it, goes as
 * far out as they intend to, and then comes back down through every resting
 * degree to the tonic. There is no drum, no pulse and no fixed length, and the
 * only fixed thing is the *sayr* — the habitual path — which is a property of
 * the maqam rather than of the piece.
 *
 * `excludeLayers: ['drums']` is therefore not a taste, it is the definition, and
 * everything else here follows from the same fact. The bass is a drone and
 * nothing else; the comp is one held chord; `strictness: 'free'` because the
 * constraint table exists to keep a line singable against a band and there is no
 * band; and `hook: 'through'` because a taqsim that repeated itself would be a
 * composed piece pretending to be an improvisation.
 *
 * ## The one style that overrides `scaleForChord`, and why it may
 *
 * The genre's hook returns one of six maqamat, and the six are exactly those
 * the genre's chord vocabulary can hold — see `index.ts`. **A taqsim has no
 * chords**, so the constraint that produced that list does not apply to it, and
 * this is the one place the two maqamat the ensemble cannot accompany are
 * reachable:
 *
 *   **Nawa Athar** (`hungarianMinor`) has a raised fourth, so there is no triad
 *   on the fourth degree — and `iv` is in every minor table in this file.
 *   **Shawq Afza** (`harmonicMajor`) is jins Ajam under jins Hijaz, so it has
 *   the ♮2 that rules out `bII` and the ♭6 that rules out `IV`, which between
 *   them are the whole major vocabulary.
 *
 * `Style.scaleForChord` says a style that overrides it is making a claim about
 * itself rather than about its genre. The claim here is that this style is the
 * one with nothing underneath it.
 *
 * ## And it does not take the sayr, which is the awkward one
 *
 * The genre adopted the fourth argument to `scaleForChord` so that a piece can
 * leave for a neighbouring maqam on the ghusn and come back on the mazhab — see
 * `SAYR` in `index.ts`. A taqsim is the form that wants that most: an
 * improvisation through a maqam *is* its sayr, out to the next jins and home,
 * and it is what the word describes.
 *
 * It refuses anyway, and the reason is granularity rather than taste. **A taqsim
 * has no bar lines.** `bpm` here is nominal and the comment beside it says
 * nothing is counting; the sections this engine hands it are a rendering grid
 * and not musical joins, because there is no ensemble arriving on them and no
 * cycle turning over. The genre's other twenty styles have a real seam at the
 * mazhab — the whole takht lands the qafla and the refrain begins — so a
 * departure placed there is placed where the music already has a boundary. Here
 * the same code would move the maqam at bar 8 of a form with no bar 8, and the
 * modulation a taqsim actually makes happens inside a phrase: the player rests
 * on a tone, edges onto the neighbouring jins, and is somewhere else before the
 * phrase has ended.
 *
 * That is the same refusal indian records for the thumrī, arrived at from a
 * different genre, and it is worth two of them agreeing: **a section argument
 * moves the scale at a section boundary, and a gesture that lives inside the
 * line is not served by it.** The honest position is that this style still wants
 * something the engine does not do, and it is a smaller want than it was.
 */
const taqsim: Style = {
  id: 'taqsim',
  label: 'Taqsim',
  description:
    'Unmetred solo improvisation through a maqam, over a drone and nothing else. No drum, no pulse, and the maqamat the ensemble cannot accompany.',
  beatsPerBar: 4,
  beatUnit: 4,
  // Nominal. Nothing is counting, and the tempo only decides how long a held
  // note lasts — which for this style is the only thing tempo is for.
  bpm: [44, 64],
  swing: 0,
  modeWeights: { minor: 0.62, major: 0.38 },
  relativeMajorChorus: 0,
  excludeLayers: ['drums', 'brass'],
  requireLayers: ['melody'],
  drumFills: false,
  strictness: 'free',
  hook: 'through',
  counterSpacing: 2,
  /**
   * No seam gesture of any kind, which is the one style here where that is a
   * statement about the *form* rather than a taste about the band.
   *
   * `[['fill', 1]]` is `DEFAULT_TRANSITIONS` written out — see `Style.transitions`,
   * whose note argues at length that the two ways of saying it are the same
   * music and different claims. This one is the claim, and there is a second
   * joke in it: `excludeLayers: ['drums']` and `drumFills: false` mean a `fill`
   * is already nothing here, so what this table actually says is *nothing
   * happens at a join in a taqsim*, and it says it in the only vocabulary the
   * field has.
   *
   * **What it is taking away is real, and it was the genre's default doing it.**
   * Under `index.ts`'s palette, measured over 200 seeds: 74 shot seams and 22
   * breaks, 43 and 18 of which actually edited the bar they landed on. A shot
   * replaces what every layer holds in the last bar with a shared figure on the
   * sixteenth grid, and the effect on a taqsim's seam bar is exactly what that
   * sentence predicts — the comp goes from 1.05 onsets to 1.76 and the melody
   * from 1.26 down to 0.95, the improviser's free phrase traded for the band
   * landing together. This style's own header says there is no drum, no pulse
   * and no fixed length; a struck ensemble figure is all three arriving at once.
   *
   * The break is worse and quieter. It deletes every layer but the carrier, the
   * carrier here is `BREAK_CARRIER`'s bass, and this style's bass is a drone
   * that sustains rather than restrikes — so a break bar comes out with the
   * melody gone from 1.63 onsets to nothing, the comp gone from 0.75 to nothing,
   * and *no attack at all* in the bar. `a break leaves someone playing` passes
   * it, correctly, because the drone is sounding through. But the thing that
   * stopped is the improvisation, and stopping the improvisation at a section
   * boundary is a decision the improviser makes and the form is named after.
   */
  transitions: [['fill', 1]],
  /**
   * The wider table. Minor is Nawa Athar throughout — it is the display maqam,
   * the one a qanun player reaches for when asked to prove something — and major
   * splits between Shawq Afza on the rast-family tonics, where the tradition
   * puts it, and Ajam, which is plain major and is here precisely because a
   * taqsim is the only context in which "the major scale" is a *maqam* rather
   * than the engine's default answer.
   */
  scaleForChord: (tonic, mode) => {
    if (mode === 'minor') return makeScale(tonic, 'hungarianMinor');
    return makeScale(tonic, [0, 3, 5, 10].includes(tonic) ? 'harmonicMajor' : 'major');
  },
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
    verse: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 }],
    chorus: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 }],
    bridge: [{ chords: ['isus4', 'isus4', 'isus4', 'isus4', 'i', 'i', 'i', 'i'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 5 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
    verse: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    chorus: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    bridge: [{ chords: ['Isus4', 'Isus4', 'Isus4', 'Isus4', 'I', 'I', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6 }],
    outro: [{ chords: ['I', 'I', 'I', 'I'], weight: 5 }],
  },
  /**
   * A run, then a rest on the note the run arrived at. That is the shape of
   * every phrase in an unmetred improvisation and the only shape a grid can
   * approximate it with — the leading rests are what make it sound overheard
   * rather than played, and the long tails are the resting degrees.
   */
  melodyCells: [
    { cell: [2, 2, 2, 2, 8], weight: 5 },
    { cell: [-4, 2, 2, 2, 2, 4], weight: 5 },
    { cell: [1, 1, 1, 1, 4, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [-8, 2, 2, 4], weight: 4 },
    { cell: [2, 2, 12], weight: 4 },
    { cell: [-2, 1, 1, 2, 2, 8], weight: 3 },
    { cell: [4, 2, 2, 8], weight: 3 },
    { cell: [-12, 4], weight: 3 },
    { cell: [1, 1, 1, 1, 1, 1, 2, 8], weight: 2 },
    { cell: [-16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 8 },
    { cell: [-4, 12], weight: 3 },
    { cell: [4, 12], weight: 2 },
  ],
  bass: [
    { name: 'drone', weight: 8, sustain: true, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.8 }] },
    { name: 'drone-fifth', weight: 3, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.8 },
      { at: 0, dur: 16, tone: 'fifth', vel: 0.5 },
    ] },
  ],
  comp: [
    { name: 'held', weight: 7, voices: 3, sustain: true, hits: [{ at: 0, dur: 16, vel: 0.3 }] },
    { name: 'quartal-held', weight: 3, voices: 3, voicing: 'quartal', sustain: true, hits: [{ at: 0, dur: 16, vel: 0.28 }] },
  ],
  /**
   * The one style in this genre with no percussion, and it can now say so.
   *
   * This read `[{ name: 'none', weight: 1, voices: {} }]` under a comment
   * explaining that it was never reached and that the type wanted a table
   * anyway. Both halves were true; the second stopped being a reason. The row
   * existed because `generateSong` drew the drum figure before it read
   * `excludeLayers`, and `rng.weightedBy` throws on an empty table — so a
   * taqsim, which is by definition an unmetred solo improvisation with nobody
   * else in the room, had to name a percussion figure to be generated at all.
   *
   * **One of twenty-one, and that ratio is the caution worth leaving here.**
   * Every other style in this file plays an iqa' on `lp`/`mp`/`hp` — the doum
   * and the tak of a darbuka, riqq and tabl baladi — and a hand table has no
   * `bd` in it by design. The test for a placeholder was an empty `voices` map
   * and nothing else; anybody sweeping this genre for tables to delete on the
   * strength of a missing kick would take twenty real iqa'at with them.
   *
   * **The deletion was expected to re-roll this style and does not**, which
   * was measured rather than waved through in either direction. An absent
   * table skips the draw instead of discarding its result, so the stream does
   * shift — but the next line of `generateSong` draws the drum machine, and
   * that is the whole of what changes here. Over 8 seeds: 0 songs differ by a
   * byte of MIDI or of Strudel, and 6 of the 8 came out with a different
   * `drums.bank`. A bank with no events on it is never emitted by either
   * renderer or staged by `concert/cast.ts`, all three of which read it only
   * inside a `song.drums.events.length` guard.
   *
   * The notes are safe because parts are drawn from streams namespaced off the
   * seed, so the only route from a shifted stream to a different note is a
   * section table — and a taqsim has **one progression per section kind**,
   * `I I I I` over a drone, with nothing to choose. Country's seven and
   * ambient's two moved, all 72 songs of them, on tables that offer two to
   * five progressions a section. The other twenty styles in this file are
   * byte-identical, as is every one of the other eighteen genres.
   */
  drums: [],
  melody: { leap: 0.16, ornament: 0.62, span: 20, sequence: 0.15, syncopation: 0.45 },
};

export const STYLES: Record<string, Style> = {
  // The 4/4 family, in the order a player would learn them: the default, its
  // heavy variant, and the one that moves the doums.
  maqsum, baladi, saidi,
  // The 2/4s, fastest last.
  fallahi, malfuf, ayyub,
  // Asymmetric, by where the long group falls: nowhere near the bar, outside,
  // last, first, middle.
  jurjina, samai, aqsaq, dawrhindi, bashraf,
  // The long cycles and the slow ones.
  wahda, masmoudi, chiftetelli,
  // Occasions rather than dances.
  zaffa, dabke, khaleeji,
  // The forms: the closing rondo, the oldest song, the announcement, and the
  // one with no cycle at all.
  longa, muwashshah, dulab, taqsim,
};
