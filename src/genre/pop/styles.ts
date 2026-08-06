/**
 * The pop catalogue — twenty-four styles, 1963 to now.
 *
 * Organised by **what the record was made on and made for**, because that is the
 * only axis that separates these from each other and from their neighbours. A
 * girl-group side and a dance-pop single are the same song written twice: verse,
 * chorus, bridge, chorus, and a tune anybody can hold onto after one hearing.
 * What is not the same is the room, the desk and the object the arrangement is
 * built out of — four musicians in a chamber, a studio band on twenty-four
 * tracks, a LinnDrum with the snare gated, a grid with the kick ducking
 * everything else. `index.ts` argues at length that this is the genre where the
 * production *is* the composition, and this file is where that claim has to pay.
 *
 * ## Two tables per style, always
 *
 * `npm run genres` generates every style in both modes, and `pickProgression`
 * reads roman numerals relative to the mode — so a major table read in minor is
 * not merely unidiomatic, it is a different set of chords. Iskelmä has four
 * styles that generate in a mode they have no table for and it is a known,
 * recorded gap. Nothing here repeats it: every style carries an override for its
 * secondary mode, and because `pickProgression` falls through
 * `override[kind] ?? override.verse`, an override with a verse and a chorus in it
 * covers all six kinds. That is two extra progressions per style rather than
 * twelve, which is why it was affordable to do everywhere.
 *
 * ## Where the leading tone lives
 *
 * The genre's `scaleForChord` follows the key and never raises the seventh —
 * `index.ts` states why, and it is the rule synth and reggae also hold. Seven
 * styles here override it with `functional`, below, and those seven are the ones
 * whose repertoire genuinely cadences: a 1963 Brill Building side, a
 * Broadway-descended ballad, a torch song, a baroque-pop record with a
 * harpsichord on it. This is the only genre in the project that needs the rule
 * both ways, and `Style.scaleForChord` is exactly the seam for saying so — the
 * blues is the only other style anywhere that reaches for it.
 *
 * The line between the two groups is drawn in data rather than by taste, and it
 * is checkable by reading the tables: **a style writes `V` in a minor
 * progression if and only if it names `functional`.** `parseRoman` flags a major
 * fifth degree as `dominantFunction` whatever a genre believes, so a modal style
 * writing one puts a ♯7 in the comp's voicing under a melody drawing ♮7 from the
 * chord scale — which is a clash rather than a modal reading, and it leaves both
 * tables looking innocent.
 */

import type { Chord } from '../../core/chord.js';
import type { Pc } from '../../core/pitch.js';
import { makeScale, type Mode, type Scale } from '../../core/scale.js';
import type { Style } from '../../style/types.js';

/**
 * The key-relative rule **with** the dominant substitution — iskelmä's rule,
 * exactly, borrowed rather than re-derived.
 *
 * Seven styles name this and the seven are a list rather than a tendency:
 * `brill`, `girlgroup`, `baroque`, `ballad`, `torch`, `chamber` — and
 * `newromantic`, which is the surprise and argues itself at its own site. What
 * the first six share is a lineage running through Tin Pan Alley and the
 * Broadway pit rather than through the folk revival or the Hammond organ — the
 * writers were trained, the changes are functional, and the fifth degree is a
 * dominant seventh that resolves. In
 * A minor these records play E7 and the melody sings G♯ over it, and a natural
 * seventh there would not be a modal reading of the song, it would be a wrong
 * note against the chord the piano is holding.
 *
 * The other seventeen do not get it, and after about 1966 that is the truth
 * about the repertoire: where the Brill Building wrote `V`, everything downstream of
 * the Byrds and the Beatles wrote `bVII`, and the whole ♭VII–IV–I family that
 * runs from sunshine pop to stadium pop to the last dance-pop single is
 * unavailable to a scale with a leading tone in it.
 */
const functional = (tonic: Pc, mode: Mode, chord: Chord): Scale =>
  makeScale(
    tonic,
    mode === 'minor' ? (chord.dominantFunction ? 'harmonicMinor' : 'minor') : 'major',
  );

// ---------------------------------------------------------------------------
// 1963–67 — the chamber, the two-track and the tambourine
// ---------------------------------------------------------------------------

/**
 * GIRL GROUP — the Crystals, the Ronettes, the Shangri-Las.
 *
 * The one style here whose *production* was famous before its songs were, which
 * is why it opens a genre that claims production as its subject. What Spector
 * built was not a mix, it was a room: four guitars, three pianos and two basses
 * playing the same part into one echo chamber, so the arrangement arrives as a
 * single object with no separable players in it. That is unreproducible here and
 * saying so is more useful than pretending: what this style can do is `effects`
 * with the reverb pushed past every era it can be drawn in, a comp that plays
 * *every eighth* so the chord is a continuous wall rather than a series of
 * strikes, and castanets on the sixteenths in the `perc` voice.
 *
 * Functional harmony and a real dominant — see `functional` above. These are
 * Brill Building songs sung by teenagers, and the writers had all been taught.
 *
 * **The 12/8 that is not here.** Half this repertoire is in compound time, and
 * `beatsPerBar` cannot say so without also saying that a bar is 12 sixteenths,
 * which is a 3/4 bar and a different dance. What is written instead is a
 * triplet-leaning `swing: 0.28` over a straight 4/4, which is the same lilt in
 * the one place the engine can put it, and is honest about being an
 * approximation.
 */
const girlgroup: Style = {
  id: 'girlgroup',
  label: 'Girl group (1963)',
  description:
    'Spector and the Brill Building: a wall of eighths, castanets, a real dominant, and a tune sung by somebody who is seventeen.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.28,
  bpm: [116, 138],
  /** No box. The whole sound is a room full of people playing the same bar. */
  boxDrums: false,
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0.45,
  scaleForChord: functional,
  /**
   * The treatment is the piece — the one claim `Style.effects` documents as the
   * rarest and the only one that outranks the era. A dry girl-group record is not
   * a girl-group record cut in a different decade, it is a demo of one. `lowpass`
   * is deliberately unnamed: how bright the record is stays the era's to say.
   */
  effects: {
    comp: { reverb: 0.72 },
    melody: { reverb: 0.6 },
    drums: { reverb: 0.55 },
    pad: { reverb: 0.8 },
    vocal: { reverb: 0.65 },
  },
  progressions: {
    intro: [
      { chords: ['I', 'vi', 'IV', 'V'], weight: 5 },
      { chords: ['I', 'I', 'V', 'V'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'IV', 'V'], weight: 6, note: 'The doo-wop changes, and the reason every one of these songs is singable on first hearing' },
      { chords: ['I', 'I', 'vi', 'vi', 'ii', 'ii', 'V7', 'V7'], weight: 4 },
      { chords: ['I', 'iii', 'IV', 'V7', 'I', 'vi', 'ii', 'V7'], weight: 3 },
      { chords: ['I', 'V7/IV', 'IV', 'iv', 'I', 'vi', 'V7', 'I'], weight: 2, note: 'Borrowed minor iv — the shade under the second half of a verse' },
    ],
    chorus: [
      { chords: ['IV', 'V7', 'I', 'vi', 'IV', 'V7', 'I', 'I'], weight: 6, note: 'The chorus arrives on IV, not on I: the tune is already moving when it starts' },
      { chords: ['I', 'IV', 'I', 'V7', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['vi', 'IV', 'I', 'V7', 'vi', 'IV', 'V7', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['IV', 'IV', 'I', 'I', 'ii', 'ii', 'V7', 'V7'], weight: 4 },
      { chords: ['vi', 'iii', 'IV', 'I', 'ii', 'V7', 'V7', 'V7'], weight: 3 },
    ],
    outro: [
      { chords: ['I', 'vi', 'IV', 'V7'], weight: 4 },
      { chords: ['IV', 'V7', 'I', 'I'], weight: 2 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'VI', 'iv', 'V7', 'i', 'VI', 'V7', 'i'], weight: 4, note: 'The Shangri-Las verse: minor, and a dominant that means it' },
    ],
    chorus: [
      { chords: ['III', 'III', 'VI', 'VI', 'iv', 'V7', 'i', 'i'], weight: 5, note: 'Up into the relative major and back down — the lift these songs are built on' },
      { chords: ['iv', 'V7', 'i', 'VI', 'iv', 'V7', 'i', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [6, 2, 8], weight: 4 },
    { cell: [-2, 2, 4, 4, 4], weight: 4 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [4, 12], weight: 2 },
  ],
  bass: [
    { name: 'quarters', weight: 5, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 },
      { at: 4, dur: 4, tone: 'root', vel: 0.78 },
      { at: 8, dur: 4, tone: 'fifth', vel: 0.88 },
      { at: 12, dur: 4, tone: 'root', vel: 0.78 },
    ] },
    { name: 'half-and-walk', weight: 4, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 1 },
      { at: 8, dur: 4, tone: 'fifth', vel: 0.82 },
      { at: 12, dur: 4, tone: 'approach', vel: 0.75 },
    ] },
    { name: 'triplet-lean', weight: 3, hits: [
      { at: 0, dur: 6, tone: 'root', vel: 1 },
      { at: 6, dur: 2, tone: 'root', vel: 0.6 },
      { at: 8, dur: 6, tone: 'fifth', vel: 0.85 },
      { at: 14, dur: 2, tone: 'approach', vel: 0.65 },
    ] },
  ],
  comp: [
    /**
     * Every eighth, all night, at low velocity. Not a rhythm — a *surface*.
     * The wall is made of a chord that never stops sounding, and a figure with
     * holes in it is the one thing this style cannot have.
     */
    { name: 'wall-eighths', weight: 6, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.62 }, { at: 2, dur: 2, vel: 0.5 },
      { at: 4, dur: 2, vel: 0.58 }, { at: 6, dur: 2, vel: 0.5 },
      { at: 8, dur: 2, vel: 0.6 }, { at: 10, dur: 2, vel: 0.5 },
      { at: 12, dur: 2, vel: 0.58 }, { at: 14, dur: 2, vel: 0.52 },
    ] },
    { name: 'triplet-piano', weight: 4, voices: 3, hits: [
      { at: 0, dur: 3, vel: 0.6 }, { at: 3, dur: 3, vel: 0.45 },
      { at: 6, dur: 2, vel: 0.5 }, { at: 8, dur: 3, vel: 0.58 },
      { at: 11, dur: 3, vel: 0.45 }, { at: 14, dur: 2, vel: 0.5 },
    ] },
    { name: 'held', weight: 2, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.5 }] },
  ],
  drums: [
    /**
     * The Hal Blaine figure: a kick on 1 and the *and* of 2, a snare that plays
     * the backbeat and the bar's whole second half, and castanets on top.
     * Written on `perc` because that is what the sample racks and every machine
     * bank call the wood-and-shell noise, and it is the one voice a girl-group
     * record has that nothing else here does.
     */
    { name: 'blaine', weight: 6, voices: {
      bd: [0, 6, 8],
      sd: [4, 12],
      tb: [0, 4, 8, 12],
      perc: [2, 6, 10, 14],
    }, ghosts: { sd: [7, 11, 15] } },
    { name: 'stomp', weight: 4, voices: {
      bd: [0, 4, 8, 12],
      sd: [4, 12],
      cp: [4, 12],
      tb: [2, 6, 10, 14],
    } },
    { name: 'floor-and-tambourine', weight: 3, voices: {
      bd: [0, 8],
      lt: [4, 12],
      sd: [12],
      tb: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  /** The tom roll into the chorus is the whole vocabulary. There is no cymbal. */
  fills: [['tom-roll', 6], ['snare-toms', 3], ['lead-in', 2]],
  melody: { leap: 0.24, ornament: 0.16, span: 12, sequence: 0.55, syncopation: 0.25 },
};

/**
 * MERSEYBEAT — four people, two guitars, and a song that finishes in 2:10.
 *
 * The first style in this genre where the band is the band that made the record,
 * which is the whole point of it and is the thing girl group is not. Everything
 * follows: the comp is a strummed guitar rather than a wall, the harmony is
 * three chords and a borrowed one, the tempo is fast because four people playing
 * live have nowhere to hide, and there is no pad at all in the styles' natural
 * texture — what sounds like one is a second guitar.
 *
 * **`bVII` appears here and it is the earliest it appears anywhere in this
 * file.** A flat seventh in a major key on a 1964 record is a borrowed chord
 * somebody heard on an American blues single and liked; by 1968 it is the
 * default and the leading tone is gone. This style is the hinge, which is why it
 * keeps the genre's modal `scaleForChord` rather than taking `functional` like
 * its neighbour above.
 */
const merseybeat: Style = {
  id: 'merseybeat',
  label: 'Merseybeat (1964)',
  description:
    'Two guitars, bass and drums, a strummed backbeat with a tambourine on it, three chords and a borrowed flat seventh.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.12,
  bpm: [132, 164],
  boxDrums: false,
  modeWeights: { minor: 0.22, major: 0.78 },
  relativeMajorChorus: 0.3,
  progressions: {
    intro: [
      { chords: ['I', 'bVII', 'IV', 'I'], weight: 4 },
      { chords: ['V', 'V', 'I', 'I'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'V', 'V', 'I', 'I'], weight: 6, note: 'Three chords, eight bars, and out' },
      { chords: ['I', 'vi', 'ii', 'V', 'I', 'vi', 'ii', 'V'], weight: 4 },
      { chords: ['I', 'IV', 'bVII', 'IV', 'I', 'IV', 'V', 'I'], weight: 4, note: 'The borrowed flat seventh, and the first sign of what the next forty years sound like' },
      { chords: ['I', 'I', 'iii', 'iii', 'IV', 'IV', 'V', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'I'], weight: 5 },
      { chords: ['bVII', 'IV', 'I', 'I', 'bVII', 'IV', 'V', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['vi', 'vi', 'ii', 'ii', 'IV', 'IV', 'V', 'V'], weight: 4 },
      { chords: ['IV', 'V', 'iii', 'vi', 'IV', 'V', 'I', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['I', 'bVII', 'IV', 'I'], weight: 3 },
      { chords: ['V', 'IV', 'I', 'I'], weight: 3 },
    ],
  },
  /**
   * Aeolian throughout, and **no `V` anywhere in it** — which is the hinge
   * argument stated in data.
   *
   * `girlgroup`, one style above and one year earlier, writes `V7` in minor and
   * takes `functional` for it. This one does not, and the difference is the
   * whole reason both are in the file: the same year, the same charts, and two
   * completely different ideas about what the fifth degree is for. A minor-key
   * beat single reaches for `VII` where a Brill Building side reaches for `V`,
   * and that one substitution is the seed of every modal progression in the
   * eighteen styles downstream of it.
   *
   * The rule this genre holds to, and the one `index.ts` argues: a style writes
   * `V` in a minor table **if and only if** it names `functional`. `parseRoman`
   * flags a major fifth degree as `dominantFunction` whatever the genre thinks,
   * so a modal style writing one would put a ♯7 in the comp's voicing under a
   * melody drawing ♮7 from the chord scale — which is not modal, it is a clash.
   */
  minorProgressions: {
    verse: [
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'VI', 'VII', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['III', 'VII', 'i', 'i', 'III', 'VII', 'VI', 'VII'], weight: 5 },
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'III', 'III'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 4, 4, 2], weight: 4 },
    { cell: [4, 2, 2, 8], weight: 4 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'root-quarters', weight: 5, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 },
      { at: 4, dur: 4, tone: 'root', vel: 0.78 },
      { at: 8, dur: 4, tone: 'root', vel: 0.9 },
      { at: 12, dur: 4, tone: 'root', vel: 0.78 },
    ] },
    { name: 'root-fifth-octave', weight: 5, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 },
      { at: 4, dur: 4, tone: 'fifth', vel: 0.8 },
      { at: 8, dur: 4, tone: 'octave', vel: 0.85 },
      { at: 12, dur: 4, tone: 'fifth', vel: 0.78 },
    ] },
    { name: 'eighth-push', weight: 3, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 },
      { at: 2, dur: 2, tone: 'root', vel: 0.62 },
      { at: 6, dur: 2, tone: 'fifth', vel: 0.72 },
      { at: 8, dur: 4, tone: 'root', vel: 0.9 },
      { at: 14, dur: 2, tone: 'approach', vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'downstroke-eighths', weight: 6, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.85 }, { at: 2, dur: 2, vel: 0.55 },
      { at: 4, dur: 2, vel: 0.75 }, { at: 6, dur: 2, vel: 0.55 },
      { at: 8, dur: 2, vel: 0.8 }, { at: 10, dur: 2, vel: 0.55 },
      { at: 12, dur: 2, vel: 0.75 }, { at: 14, dur: 2, vel: 0.6 },
    ] },
    { name: 'backbeat-chops', weight: 4, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.85 }, { at: 12, dur: 3, vel: 0.85 },
    ] },
    { name: 'ringing-halves', weight: 3, voices: 4, hits: [
      { at: 0, dur: 8, vel: 0.7 }, { at: 8, dur: 8, vel: 0.65 },
    ] },
  ],
  drums: [
    { name: 'backbeat-and-tambourine', weight: 6, voices: {
      bd: [0, 8], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], tb: [4, 12],
    } },
    { name: 'ride-eight', weight: 4, voices: {
      bd: [0, 6, 8], sd: [4, 12], rd: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sd: [7, 15] } },
    { name: 'four-on-snare', weight: 3, voices: {
      bd: [0, 8], sd: [0, 4, 8, 12], hh: [2, 6, 10, 14], tb: [0, 4, 8, 12],
    } },
  ],
  vary: { comp: 0.3 },
  melody: { leap: 0.28, ornament: 0.1, span: 11, sequence: 0.6, syncopation: 0.4 },
};

/**
 * BRILL — the professional song, written in a cubicle with a piano in it.
 *
 * The style that is here to represent the *writers* rather than any band: Goffin
 * and King, Mann and Weil, Bacharach at his least ornate. What separates it from
 * `girlgroup`, which recorded the same authors' work, is that this is the song
 * before anybody produced it — a piano, a rhythm section, and changes that move
 * every bar because a professional writer had two hours and a deadline.
 *
 * `functional`, obviously and with no argument required. And the highest
 * harmonic rhythm in the genre: the tables below change chord on nearly every
 * bar where most of this file changes every two.
 *
 * **`hook: 'standard'` rather than the genre's `catchy`, and this is the one
 * place in the file the axis runs backwards.** A Brill Building song is *made*
 * of its bridge — the eight bars that go somewhere the chorus cannot — and at
 * `catchy` every section is recalled, which turns the departure into another
 * arrival. The craft here is that the second half of the song is not the first
 * half again.
 */
const brill: Style = {
  id: 'brill',
  label: 'Brill Building (1962)',
  description:
    'The professional song: piano, a moving bass, changes on every bar, and a bridge that actually goes somewhere.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.14,
  bpm: [104, 132],
  boxDrums: false,
  hook: 'standard',
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0.4,
  scaleForChord: functional,
  progressions: {
    intro: [
      { chords: ['I', 'vi', 'ii', 'V7'], weight: 5 },
      { chords: ['IV', 'iv', 'I', 'V7'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'vi', 'ii', 'V7', 'I', 'vi', 'ii', 'V7'], weight: 5, note: 'The turnaround as a whole verse — the writing-room default' },
      { chords: ['I', 'V7/ii', 'ii', 'V7', 'iii', 'vi', 'ii', 'V7'], weight: 4, note: 'Secondary dominant on bar two; the chord moves before the singer does' },
      { chords: ['I', 'IV', 'iii', 'vi', 'ii', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I7', 'IV', 'iv', 'I', 'vi', 'ii', 'V7'], weight: 3, note: 'I7 turns the tonic into the dominant of IV, and the borrowed iv takes it back' },
    ],
    chorus: [
      { chords: ['IV', 'V7', 'iii', 'vi', 'IV', 'V7', 'I', 'I'], weight: 5, note: 'The deceptive third bar: the chorus reaches vi where the ear expected I' },
      { chords: ['I', 'IV', 'I', 'V7', 'vi', 'ii', 'V7', 'I'], weight: 4 },
      { chords: ['ii', 'V7', 'I', 'vi', 'ii', 'V7', 'I', 'I'], weight: 4 },
    ],
    bridge: [
      { chords: ['IV', 'IV', 'V7/V', 'V7/V', 'V7', 'V7', 'V7', 'V7'], weight: 5, note: 'The middle eight that leaves: out through V of V and hangs on the dominant' },
      { chords: ['vi', 'V7/V', 'ii', 'V7', 'iii', 'V7/ii', 'ii', 'V7'], weight: 3 },
    ],
    outro: [
      { chords: ['ii', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['IV', 'iv', 'I', 'I'], weight: 3, note: 'The borrowed plagal ending — a professional writer\'s last four bars' },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'iio', 'V7', 'i', 'iv', 'VII', 'III', 'V7'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'V7', 'i', 'VI', 'iio', 'V7'], weight: 4 },
    ],
    chorus: [
      { chords: ['III', 'VI', 'iio', 'V7', 'III', 'VI', 'iv', 'V7'], weight: 5 },
      { chords: ['iv', 'V7', 'i', 'VI', 'iio', 'V7', 'i', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 4, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
    { cell: [-2, 2, 4, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  bass: [
    { name: 'walking-quarters', weight: 5, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 },
      { at: 4, dur: 4, tone: 'third', vel: 0.76 },
      { at: 8, dur: 4, tone: 'fifth', vel: 0.86 },
      { at: 12, dur: 4, tone: 'approach', vel: 0.76 },
    ] },
    { name: 'two-feel', weight: 4, hits: [
      { at: 0, dur: 7, tone: 'root', vel: 1 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.85 },
    ] },
    { name: 'pedal-and-move', weight: 3, hits: [
      { at: 0, dur: 6, tone: 'root', vel: 1 },
      { at: 6, dur: 2, tone: 'octave', vel: 0.6 },
      { at: 8, dur: 4, tone: 'root', vel: 0.85 },
      { at: 12, dur: 4, tone: 'approach', vel: 0.72 },
    ] },
  ],
  comp: [
    { name: 'piano-triplets', weight: 5, voices: 4, hits: [
      { at: 0, dur: 3, vel: 0.7 }, { at: 3, dur: 3, vel: 0.5 },
      { at: 6, dur: 2, vel: 0.55 }, { at: 8, dur: 3, vel: 0.66 },
      { at: 11, dur: 3, vel: 0.5 }, { at: 14, dur: 2, vel: 0.55 },
    ] },
    { name: 'offbeat-stabs', weight: 4, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.6 }, { at: 6, dur: 2, vel: 0.7 },
      { at: 10, dur: 2, vel: 0.6 }, { at: 14, dur: 2, vel: 0.7 },
    ] },
    { name: 'block-halves', weight: 3, voices: 4, hits: [
      { at: 0, dur: 8, vel: 0.62 }, { at: 8, dur: 8, vel: 0.58 },
    ] },
  ],
  drums: [
    { name: 'brush-backbeat', weight: 5, voices: {
      bd: [0, 8], sd: [4, 12], sh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sd: [3, 7, 11, 15] } },
    // The baião, which arrived in New York via Brazil in about 1959 and stayed
    // in the Brill Building for a decade. The kick on 1 and the *and* of 2 is
    // the whole of it, and it is under more of this repertoire than the writers
    // would probably have admitted.
    { name: 'baiao', weight: 4, voices: {
      bd: [0, 6, 10], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], tb: [4, 12],
    } },
    { name: 'straight-eight', weight: 3, voices: {
      bd: [0, 8], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], rim: [4, 12],
    } },
  ],
  /** Two hands, when the palette deals a piano — which in this style it usually does. */
  twoHanded: {
    density: 0.62,
    modes: [['block', 5], ['answer', 4], ['stride', 2]],
  },
  melody: { leap: 0.3, ornament: 0.2, span: 14, sequence: 0.5, syncopation: 0.4 },
};

/**
 * BUBBLEGUM — 1968, and the least embarrassed thing in the project.
 *
 * Written for people who had not yet learned to be embarrassed by liking a
 * chorus: the Archies, the Ohio Express, the whole Kasenetz-Katz production
 * line. Three chords, no bridge worth the name, handclaps on the backbeat and a
 * chorus that arrives before the first minute. It is the pure form of the thing
 * this genre exists to hold, and it is here partly as a *floor* — a style that
 * makes no other claim than repetition, against which everything else in the
 * file can be measured.
 *
 * `hook: 'earworm'`, and unlike almost every other place that setting is used in
 * the project, it is not a description of a loop. It is a description of a
 * *song* that has decided the chorus is the whole point and the verse is the
 * corridor you walk down to reach it.
 */
const bubblegum: Style = {
  id: 'bubblegum',
  label: 'Bubblegum (1968)',
  description:
    'Three chords, handclaps, and a chorus inside the first minute. Nothing here is trying to be anything else.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [126, 152],
  hook: 'earworm',
  modeWeights: { minor: 0.1, major: 0.9 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [
      { chords: ['I', 'I', 'IV', 'V'], weight: 5 },
      { chords: ['I', 'IV', 'V', 'I'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'V', 'V'], weight: 6, note: 'Four bars of tonic. The chorus is what happens next and everybody knows it' },
      { chords: ['I', 'IV', 'V', 'I', 'I', 'IV', 'V', 'I'], weight: 5 },
      { chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'IV', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['I', 'I', 'IV', 'IV', 'V', 'V', 'I', 'I'], weight: 6 },
      { chords: ['IV', 'I', 'IV', 'I', 'V', 'V', 'I', 'I'], weight: 4 },
      { chords: ['I', 'V', 'IV', 'V', 'I', 'V', 'IV', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['IV', 'IV', 'V', 'V', 'IV', 'IV', 'V', 'V'], weight: 4, note: 'Not a departure — a hold, and then the chorus again' },
    ],
    outro: [
      { chords: ['I', 'IV', 'V', 'I'], weight: 4 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'VI', 'VII', 'i', 'i', 'VI', 'VII', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['III', 'VII', 'i', 'i', 'III', 'VII', 'VI', 'VII'], weight: 5 },
    ],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  bass: [
    { name: 'root-eighths', weight: 6, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 }, { at: 2, dur: 2, tone: 'root', vel: 0.7 },
      { at: 4, dur: 2, tone: 'root', vel: 0.85 }, { at: 6, dur: 2, tone: 'root', vel: 0.7 },
      { at: 8, dur: 2, tone: 'root', vel: 0.9 }, { at: 10, dur: 2, tone: 'root', vel: 0.7 },
      { at: 12, dur: 2, tone: 'root', vel: 0.85 }, { at: 14, dur: 2, tone: 'fifth', vel: 0.72 },
    ] },
    { name: 'root-fifth', weight: 4, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 },
      { at: 4, dur: 4, tone: 'fifth', vel: 0.78 },
      { at: 8, dur: 4, tone: 'root', vel: 0.9 },
      { at: 12, dur: 4, tone: 'fifth', vel: 0.78 },
    ] },
  ],
  comp: [
    { name: 'eighth-chunk', weight: 6, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.8 }, { at: 2, dur: 2, vel: 0.6 },
      { at: 4, dur: 2, vel: 0.78 }, { at: 6, dur: 2, vel: 0.6 },
      { at: 8, dur: 2, vel: 0.8 }, { at: 10, dur: 2, vel: 0.6 },
      { at: 12, dur: 2, vel: 0.78 }, { at: 14, dur: 2, vel: 0.62 },
    ] },
    { name: 'offbeat-organ', weight: 3, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.7 },
      { at: 10, dur: 2, vel: 0.7 }, { at: 14, dur: 2, vel: 0.7 },
    ] },
  ],
  drums: [
    { name: 'clap-backbeat', weight: 6, voices: {
      bd: [0, 8], sd: [4, 12], cp: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'four-floor-clap', weight: 4, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], sd: [4, 12], tb: [2, 6, 10, 14],
    } },
  ],
  fills: [['tom-roll', 4], ['lead-in', 4], ['snare-roll', 3], ['drop', 2]],
  melody: { leap: 0.2, ornament: 0.06, span: 9, sequence: 0.72, syncopation: 0.3 },
};

/**
 * BAROQUE — a harpsichord, a string quartet, and a minor key.
 *
 * *Walk Away Renée*, the Left Banke, the Zombies at their most arranged, the
 * Beach Boys once they stopped surfing. What makes it a style rather than an
 * orchestration is the harmony: this is the one corner of 1966 pop that kept the
 * eighteenth-century apparatus — a real dominant, a suspension over it, a
 * descending bass line under a stationary chord — and used it on a three-minute
 * single.
 *
 * `functional`, and it is the least optional instance of it in the file. The
 * harpsichord is playing a V7 with a 4–3 suspension and there is no reading of
 * that where the melody sings a flat seventh.
 *
 * **`requireLayers: ['pad']` is not written here and the omission is
 * deliberate.** The strings are the point, and requiring them would also make
 * this the one style in the genre that `planExits` can never strip — see
 * `index.ts` on the last chorus. A baroque-pop record whose strings drop out for
 * the final statement is a real and rather good arrangement, and a required
 * layer is a layer that can never leave.
 */
const baroque: Style = {
  id: 'baroque',
  label: 'Baroque pop (1966)',
  description:
    'Harpsichord, a string quartet and a descending bass: eighteenth-century apparatus on a three-minute single.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [96, 122],
  boxDrums: false,
  hook: 'standard',
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0.55,
  scaleForChord: functional,
  progressions: {
    intro: [
      { chords: ['i', 'V7', 'i', 'V7'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'V7'], weight: 4 },
    ],
    verse: [
      { chords: ['i', 'VII', 'VI', 'V7', 'i', 'VII', 'VI', 'V7'], weight: 5, note: 'The descending tetrachord — this style shares it with the tango and uses it for the opposite feeling' },
      { chords: ['i', 'i', 'iv', 'iv', 'V7', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['i', 'V7/iv', 'iv', 'VII', 'III', 'VI', 'iio', 'V7'], weight: 4, note: 'Circle of fifths through the relative major — the writing here is trained' },
      { chords: ['i', 'III', 'iv', 'i', 'VI', 'iio', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'VI', 'iio', 'V7', 'III', 'VI', 'iv', 'V7'], weight: 5, note: 'The lift into the relative major, and a suspension over the dominant on the way back' },
      { chords: ['VI', 'III', 'iv', 'V7', 'VI', 'III', 'V7', 'i'], weight: 4 },
      { chords: ['iv', 'V7', 'III', 'VI', 'iio', 'V7', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'V7/V', 'V7/V', 'V7', 'V7', 'V7', 'V7'], weight: 4 },
      { chords: ['VI', 'iio', 'V7', 'III', 'VI', 'iio', 'V7', 'V7'], weight: 3 },
    ],
    outro: [
      { chords: ['iv', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'V7', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'V7/vi', 'vi', 'iii', 'IV', 'I', 'ii', 'V7'], weight: 5 },
      { chords: ['I', 'IV', 'iii', 'vi', 'ii', 'V7', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'V7', 'iii', 'vi', 'ii', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'vi', 'IV', 'iv', 'I', 'ii', 'V7', 'I'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [6, 2, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [12, 4], weight: 3 },
    { cell: [4, 2, 2, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [12, 4], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    { name: 'descending-halves', weight: 5, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 0.95 },
      { at: 8, dur: 8, tone: 'third', vel: 0.8 },
    ] },
    { name: 'quarters-and-approach', weight: 4, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 },
      { at: 4, dur: 4, tone: 'fifth', vel: 0.76 },
      { at: 8, dur: 4, tone: 'root', vel: 0.86 },
      { at: 12, dur: 4, tone: 'approach', vel: 0.76 },
    ] },
    { name: 'held-root', weight: 3, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.85 }], sustain: true },
  ],
  comp: [
    /** The harpsichord figure: a broken chord that never stops, because the
     * instrument cannot sustain and a held chord on one is silence. */
    { name: 'harpsichord-sixteenths', weight: 5, voices: 3, arpeggio: true,
      arpDirection: 'updown', hits: [
        { at: 0, dur: 1, vel: 0.7 }, { at: 1, dur: 1, vel: 0.5 },
        { at: 2, dur: 1, vel: 0.6 }, { at: 3, dur: 1, vel: 0.5 },
        { at: 4, dur: 1, vel: 0.68 }, { at: 5, dur: 1, vel: 0.5 },
        { at: 6, dur: 1, vel: 0.6 }, { at: 7, dur: 1, vel: 0.5 },
        { at: 8, dur: 1, vel: 0.7 }, { at: 9, dur: 1, vel: 0.5 },
        { at: 10, dur: 1, vel: 0.6 }, { at: 11, dur: 1, vel: 0.5 },
        { at: 12, dur: 1, vel: 0.68 }, { at: 13, dur: 1, vel: 0.5 },
        { at: 14, dur: 1, vel: 0.6 }, { at: 15, dur: 1, vel: 0.55 },
      ] },
    { name: 'broken-eighths', weight: 4, voices: 3, arpeggio: true, hits: [
      { at: 0, dur: 2, vel: 0.7 }, { at: 2, dur: 2, vel: 0.55 },
      { at: 4, dur: 2, vel: 0.65 }, { at: 6, dur: 2, vel: 0.55 },
      { at: 8, dur: 2, vel: 0.68 }, { at: 10, dur: 2, vel: 0.55 },
      { at: 12, dur: 2, vel: 0.65 }, { at: 14, dur: 2, vel: 0.58 },
    ] },
    { name: 'sustained-strings', weight: 3, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.5 }], sustain: true },
  ],
  drums: [
    { name: 'quiet-backbeat', weight: 5, voices: {
      bd: [0, 8], sd: [4, 12], sh: [0, 4, 8, 12],
    }, ghosts: { sd: [3, 11] } },
    { name: 'timpani-feel', weight: 3, voices: {
      bd: [0, 6, 8], lt: [12], sd: [4], hh: [0, 4, 8, 12],
    } },
    { name: 'rim-and-brush', weight: 3, voices: {
      bd: [0, 8], rim: [4, 12], sh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  fills: [['snare-toms', 4], ['tom-roll', 3], ['drop', 3], ['lead-in', 2]],
  melody: { leap: 0.3, ornament: 0.26, span: 15, sequence: 0.42, syncopation: 0.2 },
};

/**
 * SUNSHINE — major sevenths, close harmony, and nothing underneath it at all.
 *
 * The Association, Harpers Bizarre, the Mamas and the Papas, the Free Design.
 * The style is defined by a *chord vocabulary* rather than by a rhythm, which
 * makes it the odd one out in a file organised by production — but the vocabulary
 * is what the production was for. A maj7 with the ninth on top only works if the
 * voices are close and the reverb is short, and the whole point of these records
 * is a stack of four people singing a chord that a rock band could not have
 * played.
 *
 * The genre's modal `scaleForChord` rather than `functional`, and this is where
 * the line actually falls: `IVmaj7 → I` and `bVII → I` are both here, the ear
 * hears them as arrivals, and neither has a leading tone anywhere near it.
 */
const sunshine: Style = {
  id: 'sunshine',
  label: 'Sunshine pop (1967)',
  description:
    'Major sevenths, close four-part harmony, a plagal cadence and a tambourine. Nothing is in a hurry and nothing is dark.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.1,
  bpm: [104, 128],
  boxDrums: false,
  modeWeights: { minor: 0.12, major: 0.88 },
  relativeMajorChorus: 0,
  progressions: {
    intro: [
      { chords: ['IVmaj7', 'I', 'IVmaj7', 'I'], weight: 4 },
      { chords: ['Imaj7', 'vi7', 'ii7', 'V7'], weight: 4 },
    ],
    verse: [
      { chords: ['Imaj7', 'vi7', 'ii7', 'V7', 'Imaj7', 'vi7', 'ii7', 'V7'], weight: 5 },
      { chords: ['Imaj7', 'IVmaj7', 'iii7', 'vi7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 5 },
      { chords: ['I', 'bVII', 'IV', 'I', 'I', 'bVII', 'IV', 'V'], weight: 4, note: 'The flat seventh, used as a colour rather than as a cadence' },
      { chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'iii7', 'vi7', 'ii7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'V', 'Imaj7', 'vi7', 'IVmaj7', 'V', 'Imaj7', 'Imaj7'], weight: 5 },
      { chords: ['I', 'IV', 'I', 'IV', 'ii7', 'V7', 'I', 'I'], weight: 4, note: 'Plagal all the way: the chorus rocks between I and IV and never asks the dominant for anything' },
      { chords: ['vi7', 'IVmaj7', 'Imaj7', 'V', 'vi7', 'IVmaj7', 'ii7', 'V7'], weight: 3 },
    ],
    bridge: [
      { chords: ['ii7', 'V7', 'Imaj7', 'IVmaj7', 'iii7', 'vi7', 'ii7', 'V7'], weight: 4 },
      { chords: ['IVmaj7', 'iv', 'Imaj7', 'vi7', 'ii7', 'ii7', 'V7', 'V7'], weight: 3 },
    ],
    outro: [
      { chords: ['IVmaj7', 'I', 'IVmaj7', 'I'], weight: 4 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i7', 'VImaj7', 'VII', 'i7', 'i7', 'VImaj7', 'IVmaj7', 'VII'], weight: 5 },
      { chords: ['i7', 'iv7', 'VII', 'IIImaj7', 'VImaj7', 'iv7', 'VII', 'i7'], weight: 4 },
    ],
    chorus: [
      { chords: ['IIImaj7', 'VImaj7', 'iv7', 'VII', 'IIImaj7', 'VImaj7', 'VII', 'i7'], weight: 5 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 4, 4], weight: 3 },
    { cell: [12, 4], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    { name: 'melodic-halves', weight: 5, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 0.95 },
      { at: 8, dur: 4, tone: 'third', vel: 0.75 },
      { at: 12, dur: 4, tone: 'approach', vel: 0.7 },
    ] },
    { name: 'quarters', weight: 4, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 },
      { at: 4, dur: 4, tone: 'fifth', vel: 0.75 },
      { at: 8, dur: 4, tone: 'octave', vel: 0.82 },
      { at: 12, dur: 4, tone: 'fifth', vel: 0.72 },
    ] },
    { name: 'sliding-thirds', weight: 3, hits: [
      { at: 0, dur: 6, tone: 'root', vel: 0.95 },
      { at: 6, dur: 2, tone: 'third', vel: 0.65 },
      { at: 8, dur: 6, tone: 'fifth', vel: 0.8 },
      { at: 14, dur: 2, tone: 'approach', vel: 0.66 },
    ] },
  ],
  comp: [
    { name: 'nylon-strum', weight: 5, voices: 4, hits: [
      { at: 0, dur: 4, vel: 0.7 }, { at: 6, dur: 2, vel: 0.5 },
      { at: 8, dur: 4, vel: 0.65 }, { at: 14, dur: 2, vel: 0.52 },
    ] },
    { name: 'eighth-wash', weight: 4, voices: 4, hits: [
      { at: 0, dur: 2, vel: 0.6 }, { at: 2, dur: 2, vel: 0.45 },
      { at: 4, dur: 2, vel: 0.55 }, { at: 6, dur: 2, vel: 0.45 },
      { at: 8, dur: 2, vel: 0.58 }, { at: 10, dur: 2, vel: 0.45 },
      { at: 12, dur: 2, vel: 0.55 }, { at: 14, dur: 2, vel: 0.48 },
    ] },
    { name: 'held-maj7', weight: 3, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.5 }], sustain: true },
  ],
  drums: [
    { name: 'soft-backbeat', weight: 5, voices: {
      bd: [0, 8], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], tb: [4, 12],
    }, ghosts: { sd: [3, 7, 11, 15] } },
    { name: 'brushes-and-shaker', weight: 4, voices: {
      bd: [0, 8], sd: [4, 12], sh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'ride-and-rim', weight: 3, voices: {
      bd: [0, 6, 8], rim: [4, 12], rd: [0, 4, 8, 12], tb: [2, 6, 10, 14],
    } },
  ],
  melody: { leap: 0.26, ornament: 0.14, span: 13, sequence: 0.5, syncopation: 0.35 },
};

// ---------------------------------------------------------------------------
// 1971–79 — twenty-four tracks and a band that were hired
// ---------------------------------------------------------------------------

/**
 * SOFT ROCK — the studio band, and the decade when nobody was in a hurry.
 *
 * Carole King after she stopped writing for other people, Carly Simon, the
 * Doobie Brothers' quiet half, Fleetwood Mac. What the era bought was
 * *separation*: twenty-four tracks meant every instrument could be heard on its
 * own, and the arranging changed to suit — a Wurlitzer holding sevenths on its
 * own track, a bass playing a countermelody rather than roots, and a drummer
 * playing quietly enough that a hi-hat is a musical event.
 *
 * The harmony is where this style differs from everything above it: **sevenths
 * everywhere and a ii–V that does not resolve**. That is jazz vocabulary
 * arriving in pop through session players who had all played jazz, and it is why
 * the tables here contain more `maj7` and `m7` than the 1965 half of the file
 * contains chords.
 */
const softrock: Style = {
  id: 'softrock',
  label: 'Soft rock (1975)',
  description:
    'Wurlitzer sevenths, a bass playing a countermelody, and a drummer quiet enough that the hi-hat is a musical event.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.08,
  bpm: [88, 116],
  boxDrums: false,
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0.3,
  progressions: {
    intro: [
      { chords: ['Imaj7', 'IVmaj7', 'Imaj7', 'IVmaj7'], weight: 4 },
      { chords: ['vi7', 'V', 'IVmaj7', 'IVmaj7'], weight: 3 },
    ],
    verse: [
      { chords: ['Imaj7', 'iii7', 'vi7', 'IVmaj7', 'Imaj7', 'iii7', 'ii7', 'V7'], weight: 5 },
      { chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'iii7', 'vi7', 'ii7', 'V7'], weight: 4 },
      { chords: ['vi7', 'V', 'IVmaj7', 'Imaj7', 'vi7', 'V', 'IVmaj7', 'IVmaj7'], weight: 4, note: 'The falling three-chord loop; the tonic is where it passes through rather than where it rests' },
      { chords: ['Imaj7', 'V7/ii', 'ii7', 'V7', 'iii7', 'V7/ii', 'ii7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'V', 'iii7', 'vi7', 'IVmaj7', 'V', 'Imaj7', 'Imaj7'], weight: 5 },
      { chords: ['Imaj7', 'V', 'vi7', 'IVmaj7', 'Imaj7', 'V', 'IVmaj7', 'IVmaj7'], weight: 5, note: 'I–V–vi–IV, and the first place in this file it appears; it does not leave again' },
      { chords: ['ii7', 'V7', 'Imaj7', 'vi7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 3 },
    ],
    bridge: [
      { chords: ['vi7', 'vi7', 'ii7', 'ii7', 'IVmaj7', 'IVmaj7', 'V', 'V'], weight: 4 },
      { chords: ['IVmaj7', 'iv', 'Imaj7', 'vi7', 'ii7', 'V7', 'V7', 'V7'], weight: 3 },
    ],
    outro: [
      { chords: ['IVmaj7', 'V', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['vi7', 'V', 'IVmaj7', 'IVmaj7'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i7', 'i7', 'VII', 'IIImaj7', 'VImaj7', 'iv7', 'VII', 'i7'], weight: 5 },
      { chords: ['i7', 'VImaj7', 'IIImaj7', 'VII', 'i7', 'VImaj7', 'iv7', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['VImaj7', 'VII', 'IIImaj7', 'i7', 'VImaj7', 'VII', 'i7', 'i7'], weight: 5 },
      { chords: ['iv7', 'VII', 'IIImaj7', 'VImaj7', 'iv7', 'VII', 'i7', 'i7'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [6, 2, 8], weight: 4 },
    { cell: [-2, 2, 4, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
    { cell: [2, 2, 4, 4, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [4, 12], weight: 2 },
  ],
  bass: [
    /** A countermelody with the roots in it. The decade's signature bass part
     * and the reason `tone` here reaches for the third and the seventh. */
    { name: 'melodic-eighths', weight: 5, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.95 }, { at: 3, dur: 1, tone: 'fifth', vel: 0.6 },
      { at: 4, dur: 2, tone: 'octave', vel: 0.75 }, { at: 6, dur: 2, tone: 'seventh', vel: 0.62 },
      { at: 8, dur: 2, tone: 'root', vel: 0.88 }, { at: 11, dur: 1, tone: 'third', vel: 0.6 },
      { at: 12, dur: 2, tone: 'fifth', vel: 0.72 }, { at: 14, dur: 2, tone: 'approach', vel: 0.66 },
    ] },
    { name: 'root-and-octave', weight: 4, hits: [
      { at: 0, dur: 6, tone: 'root', vel: 1 },
      { at: 6, dur: 2, tone: 'octave', vel: 0.65 },
      { at: 8, dur: 6, tone: 'fifth', vel: 0.82 },
      { at: 14, dur: 2, tone: 'approach', vel: 0.68 },
    ] },
    { name: 'halves', weight: 3, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 0.95 },
      { at: 8, dur: 8, tone: 'fifth', vel: 0.8 },
    ] },
  ],
  comp: [
    { name: 'wurlitzer-offbeats', weight: 5, voices: 4, hits: [
      { at: 2, dur: 2, vel: 0.6 }, { at: 6, dur: 2, vel: 0.68 },
      { at: 10, dur: 2, vel: 0.6 }, { at: 14, dur: 2, vel: 0.7 },
    ] },
    { name: 'sixteenth-guitar', weight: 4, voices: 3, hits: [
      { at: 0, dur: 1, vel: 0.68 }, { at: 3, dur: 1, vel: 0.5 },
      { at: 4, dur: 1, vel: 0.6 }, { at: 7, dur: 1, vel: 0.5 },
      { at: 8, dur: 1, vel: 0.66 }, { at: 11, dur: 1, vel: 0.5 },
      { at: 12, dur: 1, vel: 0.6 }, { at: 15, dur: 1, vel: 0.55 },
    ] },
    { name: 'held-sevenths', weight: 4, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.52 }], sustain: true },
  ],
  drums: [
    { name: 'quiet-hats', weight: 5, voices: {
      bd: [0, 10], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sd: [3, 7, 11, 15] } },
    { name: 'sixteenth-hats', weight: 4, voices: {
      bd: [0, 6, 8], sd: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    }, ghosts: { sd: [7, 11] } },
    { name: 'cross-stick', weight: 4, voices: {
      bd: [0, 8, 10], rim: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], sh: [2, 6, 10, 14],
    } },
  ],
  vary: { bass: 0.4, comp: 0.25 },
  /**
   * **The only feel table in the genre**, and it is here rather than anywhere
   * else because this is the one style whose identity is a *way of playing*
   * rather than a set of figures.
   *
   * `Style.feels` documents the cost of declaring one — a style with no table
   * draws nothing and generates bit-for-bit the song it generated before feels
   * existed, and the `drumSource` note in `generate/song.ts` records what one
   * number taken out of a shared stream cost the last time. So the bar for
   * adding one is high, and twenty-three styles here do not clear it: a
   * bubblegum single and a hi-NRG twelve-inch are what they are because of what
   * is written, and a band that leant on them would be playing them wrong.
   *
   * This one clears it. What separates a 1975 studio band from the same eight
   * bars played by anybody else is that they are *behind the beat* — that is
   * the thing session players were hired for and the thing a click track was
   * bought to fight. `laidback` at 3 against `straight` at 6 means about a third
   * of sections get it, and `latenight` in `moods.ts` raises it to about a half,
   * which is the mood this style is most itself in.
   */
  feels: [['straight', 6], ['laidback', 3], ['pocket', 2]],
  melody: { leap: 0.24, ornament: 0.2, span: 13, sequence: 0.44, syncopation: 0.5 },
};

/**
 * BALLAD — the big one, and the reason `ending: 'button'` is right for this genre.
 *
 * The slow number, sung by one person, that arrives at a final chorus a tone
 * higher than the first with everything on it. It is the single most parodied
 * shape in this repertoire and it is also the one nobody has managed to replace,
 * and both facts are the same fact: the form works.
 *
 * `functional`. This descends from the Broadway pit through Tin Pan Alley and it
 * has a dominant in it that means what it says — the raised seventh in a
 * minor-key ballad is the note the whole cadence is built to deliver, and this
 * is one of the two styles in the file it would be actively wrong to take away
 * from.
 *
 * **`transitions` names `break`, and `breakCarrier` is `melody`.** The one
 * gesture this style has that nothing else here does is the band stopping dead
 * under the singer for two bars before the last chorus. `BreakCarrier` allows
 * `melody` precisely for a sung break, and the note beside it — *the singer
 * stays with the tune* — is the whole of what this style wants.
 */
const ballad: Style = {
  id: 'ballad',
  label: 'Ballad',
  description:
    'The slow one: a piano, strings that arrive in the second verse, a band that stops dead before the last chorus, and a key change.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.1,
  bpm: [62, 82],
  boxDrums: false,
  hook: 'standard',
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0.4,
  scaleForChord: functional,
  transitions: [['fill', 5], ['break', 3], ['elide', 2]],
  breakCarrier: 'melody',
  progressions: {
    intro: [
      { chords: ['I', 'V7/vi', 'vi', 'IV'], weight: 4 },
      { chords: ['IV', 'V7', 'I', 'I'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'V7/vi', 'vi', 'iii', 'IV', 'I', 'ii7', 'V7'], weight: 5, note: 'The descending sequence every ballad opens with, and the reason a first verse sounds like it is already falling' },
      { chords: ['I', 'iii', 'IV', 'V7', 'I', 'vi', 'ii7', 'V7'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'iv', 'I', 'vi', 'V7', 'V7'], weight: 4, note: 'The borrowed iv on bar four — the one moment of shade in a major-key ballad' },
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'ii7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'V7', 'iii', 'vi', 'IV', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'V7'], weight: 5 },
      { chords: ['IV', 'I', 'IV', 'I', 'ii7', 'V7', 'I', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['IV', 'IV', 'V7/V', 'V7/V', 'V7', 'V7', 'V7', 'V7'], weight: 5, note: 'Out, and then a whole bar of dominant to hang on before the lift' },
      { chords: ['vi', 'iii', 'IV', 'I', 'ii7', 'V7', 'V7', 'V7'], weight: 3 },
    ],
    outro: [
      { chords: ['IV', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['IV', 'iv', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'VII', 'VI', 'V7', 'i', 'iv', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'V7/iv', 'iv', 'VII', 'III', 'VI', 'iio', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'VI', 'iv', 'V7', 'III', 'VI', 'V7', 'i'], weight: 5 },
      { chords: ['iv', 'V7', 'i', 'VI', 'iv', 'V7', 'i', 'i'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [16], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [12, 4], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    { name: 'whole-notes', weight: 5, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.9 }], sustain: true },
    { name: 'root-fifth-halves', weight: 4, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 0.95 },
      { at: 8, dur: 8, tone: 'fifth', vel: 0.78 },
    ] },
    { name: 'arriving-quarters', weight: 3, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 },
      { at: 8, dur: 4, tone: 'fifth', vel: 0.78 },
      { at: 12, dur: 4, tone: 'approach', vel: 0.72 },
    ] },
  ],
  comp: [
    { name: 'piano-arpeggio', weight: 5, voices: 4, arpeggio: true, arpDirection: 'updown', hits: [
      { at: 0, dur: 2, vel: 0.62 }, { at: 2, dur: 2, vel: 0.48 },
      { at: 4, dur: 2, vel: 0.56 }, { at: 6, dur: 2, vel: 0.48 },
      { at: 8, dur: 2, vel: 0.6 }, { at: 10, dur: 2, vel: 0.48 },
      { at: 12, dur: 2, vel: 0.56 }, { at: 14, dur: 2, vel: 0.5 },
    ] },
    { name: 'struck-halves', weight: 4, voices: 4, hits: [
      { at: 0, dur: 8, vel: 0.66 }, { at: 8, dur: 8, vel: 0.6 },
    ] },
    { name: 'held', weight: 3, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.5 }], sustain: true },
  ],
  drums: [
    { name: 'brushed-halves', weight: 5, voices: {
      bd: [0, 8], sd: [4, 12], sh: [0, 4, 8, 12],
    }, ghosts: { sd: [7, 15] } },
    { name: 'eighth-note-build', weight: 4, voices: {
      bd: [0, 8, 10], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sd: [3, 11] } },
    { name: 'rim-and-ride', weight: 3, voices: {
      bd: [0, 8], rim: [4, 12], rd: [0, 4, 8, 12],
    } },
  ],
  fills: [['tom-roll', 5], ['snare-toms', 4], ['drop', 3], ['snare-roll', 2]],
  twoHanded: { density: 0.6, modes: [['block', 5], ['answer', 4]] },
  melody: { leap: 0.32, ornament: 0.24, span: 16, sequence: 0.4, syncopation: 0.25 },
};

/**
 * TORCH — one singer, one accompanist, a minor key, and nobody dancing.
 *
 * `ballad`'s sibling and its opposite in the one respect that matters: a ballad
 * is arranged *up*, toward a last chorus with the whole studio on it, and a
 * torch song is arranged *down*, toward one voice and one instrument. So the
 * mode weights are inverted, the tempo is slower, the drum patterns barely
 * exist, and — the only structural statement in the style — there is no `brass`
 * layer at all.
 *
 * `functional`, for the same reason as `ballad`: this repertoire descends from
 * the theatre song and the dominant is where the ache is.
 *
 * **`drumFills: false`.** A torch song does not signpost its sections. Two of
 * the twenty-four styles here turn the fill off and the other is `dreampop`,
 * which does it for the exactly opposite reason — that one has no edges, and
 * this one has edges it declines to announce.
 */
const torch: Style = {
  id: 'torch',
  label: 'Torch song',
  description:
    'One voice and one accompanist, minor and slow, arranged downward. No horns, no fills, and nothing announces anything.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.16,
  bpm: [54, 72],
  boxDrums: false,
  hook: 'standard',
  drumFills: false,
  excludeLayers: ['brass'],
  modeWeights: { minor: 0.82, major: 0.18 },
  relativeMajorChorus: 0.3,
  scaleForChord: functional,
  progressions: {
    intro: [
      { chords: ['i', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'V7', 'i', 'i'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'VII', 'VI', 'V7', 'i', 'VII', 'VI', 'V7'], weight: 4 },
      { chords: ['i', 'iio', 'V7', 'i', 'iv', 'VII', 'III', 'V7'], weight: 4 },
      { chords: ['i', 'V7/iv', 'iv', 'bII', 'V7', 'V7', 'i', 'i'], weight: 2, note: 'The Neapolitan, which in this style is the moment the song admits what it is about' },
    ],
    chorus: [
      { chords: ['iv', 'V7', 'i', 'VI', 'iio', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['III', 'VI', 'iio', 'V7', 'i', 'iv', 'V7', 'i'], weight: 4 },
      { chords: ['VI', 'III', 'iv', 'V7', 'VI', 'III', 'V7', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['VI', 'VI', 'iio', 'iio', 'V7', 'V7', 'V7', 'V7'], weight: 4 },
      { chords: ['iv', 'i', 'V7/V', 'V7', 'iv', 'i', 'V7', 'V7'], weight: 3 },
    ],
    outro: [
      { chords: ['iv', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['iio', 'V7', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'V7/vi', 'vi', 'iii', 'IV', 'iv', 'I', 'V7'], weight: 5 },
      { chords: ['I', 'vi', 'ii7', 'V7', 'iii', 'vi', 'ii7', 'V7'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'iv', 'I', 'vi', 'ii7', 'V7', 'I', 'I'], weight: 5 },
    ],
  },
  melodyCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [12, 4], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [-8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'held', weight: 6, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.85 }], sustain: true },
    { name: 'root-and-fifth', weight: 3, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 0.9 },
      { at: 8, dur: 8, tone: 'fifth', vel: 0.72 },
    ] },
    { name: 'walking-in', weight: 2, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 0.9 },
      { at: 8, dur: 4, tone: 'third', vel: 0.7 },
      { at: 12, dur: 4, tone: 'approach', vel: 0.66 },
    ] },
  ],
  comp: [
    { name: 'rubato-arpeggio', weight: 5, voices: 4, arpeggio: true, arpDirection: 'up', arpOctaves: 2, hits: [
      { at: 0, dur: 2, vel: 0.58 }, { at: 2, dur: 2, vel: 0.44 },
      { at: 4, dur: 2, vel: 0.52 }, { at: 6, dur: 2, vel: 0.44 },
      { at: 8, dur: 2, vel: 0.56 }, { at: 10, dur: 2, vel: 0.44 },
      { at: 12, dur: 2, vel: 0.5 }, { at: 14, dur: 2, vel: 0.46 },
    ] },
    { name: 'held', weight: 5, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.48 }], sustain: true },
    { name: 'struck-downbeat', weight: 3, voices: 4, hits: [{ at: 0, dur: 12, vel: 0.6 }] },
  ],
  drums: [
    { name: 'brushes', weight: 6, voices: {
      bd: [0], sd: [8], sh: [0, 4, 8, 12],
    }, ghosts: { sd: [4, 12] } },
    { name: 'rim-only', weight: 4, voices: {
      bd: [0, 8], rim: [12],
    } },
  ],
  melody: { leap: 0.3, ornament: 0.3, span: 15, sequence: 0.34, syncopation: 0.2 },
};

/**
 * DISCO POP — the pop record that has been to a discotheque.
 *
 * Not disco, which belongs to funk and is written there. This is the *pop* side
 * of 1978: a song with a verse and a chorus and a bridge, played over
 * four-on-the-floor with an open hat on every offbeat and a string section on
 * top. ABBA is the centre of it, and the reason it is here rather than in funk is
 * that the groove is a chassis under a song rather than the thing itself — take
 * the kick pattern away and there is still a tune, which is exactly not true of
 * a funk vamp.
 *
 * The octave bass is the one figure that is genuinely borrowed, and it is
 * written on `octave` rather than on a literal semitone offset because it is an
 * *outline* of the chord rather than a shape — see `BassTone`.
 */
const discopop: Style = {
  id: 'discopop',
  label: 'Disco pop (1978)',
  description:
    'Four on the floor, an open hat on every offbeat, an octave bass and a string section. A song, on a dance chassis.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [112, 126],
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0.55,
  progressions: {
    intro: [
      { chords: ['i', 'VII', 'VI', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'VI', 'VII'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 5, note: 'The aeolian loop that runs from here to the last track in this file' },
      { chords: ['i', 'i', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'iv', 'VII', 'III', 'VI', 'iv', 'VII', 'i'], weight: 4 },
      { chords: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'iv', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'III', 'VII', 'i', 'VI', 'III', 'VII', 'i'], weight: 6, note: 'Up into the relative major on the downbeat of the chorus — the whole emotional mechanism of the style' },
      { chords: ['III', 'VII', 'VI', 'VII', 'III', 'VII', 'VI', 'VII'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'III', 'iv', 'VII', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'VII', 'VII', 'III', 'III', 'VII', 'VII'], weight: 4 },
      { chords: ['VI', 'VII', 'i', 'III', 'VI', 'VII', 'VII', 'VII'], weight: 3 },
    ],
    outro: [
      { chords: ['VI', 'III', 'VII', 'i'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'V'], weight: 5 },
      { chords: ['I', 'iii', 'IV', 'V', 'I', 'vi', 'ii', 'V'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'iii', 'vi', 'IV', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'IV'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [-2, 2, 4, 4, 4], weight: 4 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    { name: 'octave-eighths', weight: 6, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 }, { at: 2, dur: 2, tone: 'octave', vel: 0.72 },
      { at: 4, dur: 2, tone: 'root', vel: 0.88 }, { at: 6, dur: 2, tone: 'octave', vel: 0.72 },
      { at: 8, dur: 2, tone: 'root', vel: 0.92 }, { at: 10, dur: 2, tone: 'octave', vel: 0.72 },
      { at: 12, dur: 2, tone: 'root', vel: 0.88 }, { at: 14, dur: 2, tone: 'octave', vel: 0.74 },
    ] },
    { name: 'sixteenth-run', weight: 4, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 }, { at: 3, dur: 1, tone: 'root', vel: 0.62 },
      { at: 4, dur: 2, tone: 'fifth', vel: 0.8 }, { at: 7, dur: 1, tone: 'octave', vel: 0.62 },
      { at: 8, dur: 2, tone: 'root', vel: 0.9 }, { at: 11, dur: 1, tone: 'seventh', vel: 0.6 },
      { at: 12, dur: 2, tone: 'fifth', vel: 0.78 }, { at: 14, dur: 2, tone: 'approach', vel: 0.68 },
    ] },
    { name: 'root-quarters', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 }, { at: 4, dur: 3, tone: 'root', vel: 0.8 },
      { at: 8, dur: 3, tone: 'root', vel: 0.9 }, { at: 12, dur: 3, tone: 'fifth', vel: 0.8 },
    ] },
  ],
  comp: [
    { name: 'offbeat-guitar', weight: 5, voices: 3, hits: [
      { at: 2, dur: 1, vel: 0.72 }, { at: 6, dur: 1, vel: 0.75 },
      { at: 10, dur: 1, vel: 0.72 }, { at: 14, dur: 1, vel: 0.78 },
    ] },
    { name: 'string-stabs', weight: 4, voices: 4, hits: [
      { at: 0, dur: 2, vel: 0.72 }, { at: 4, dur: 2, vel: 0.62 },
      { at: 8, dur: 2, vel: 0.7 }, { at: 12, dur: 2, vel: 0.66 },
    ] },
    { name: 'clav-sixteenths', weight: 3, voices: 3, hits: [
      { at: 0, dur: 1, vel: 0.7 }, { at: 2, dur: 1, vel: 0.5 }, { at: 3, dur: 1, vel: 0.58 },
      { at: 6, dur: 1, vel: 0.5 }, { at: 8, dur: 1, vel: 0.68 }, { at: 10, dur: 1, vel: 0.5 },
      { at: 11, dur: 1, vel: 0.58 }, { at: 14, dur: 1, vel: 0.55 },
    ] },
  ],
  drums: [
    { name: 'four-on-the-floor', weight: 6, voices: {
      bd: [0, 4, 8, 12], sd: [4, 12], hh: [0, 4, 8, 12], oh: [2, 6, 10, 14],
    } },
    { name: 'floor-with-claps', weight: 4, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], sd: [4, 12], oh: [2, 6, 10, 14], tb: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'sixteenth-hats', weight: 3, voices: {
      bd: [0, 4, 8, 12], sd: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    }, ghosts: { sd: [7, 15] } },
  ],
  shots: [[[0, 6, 10], 3], [[0, 4, 12], 2]],
  melody: { leap: 0.28, ornament: 0.12, span: 13, sequence: 0.58, syncopation: 0.45 },
};

/**
 * POWER POP — the 1965 single played by people who owned the 1965 single.
 *
 * Big Star, Cheap Trick, the Raspberries, the Records. It is deliberately placed
 * in the 1975 era and it deliberately sounds like 1965, and that gap is the
 * style: a power-pop record is a *revival*, made on twenty-four tracks with a
 * compressed drum sound that no beat group could have had, playing changes a
 * beat group would have recognised.
 *
 * What separates it from `merseybeat` in the tables rather than in the prose:
 * the suspended chords, the bass that plays a countermelody rather than roots,
 * and a chorus that goes to `bVI`. None of the three exist in 1964.
 */
const powerpop: Style = {
  id: 'powerpop',
  label: 'Power pop (1978)',
  description:
    'The beat single made again on twenty-four tracks: suspensions, a countermelody bass, compressed drums, and a chorus that reaches for bVI.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [138, 168],
  boxDrums: false,
  modeWeights: { minor: 0.22, major: 0.78 },
  relativeMajorChorus: 0.2,
  progressions: {
    intro: [
      { chords: ['I', 'IV', 'bVII', 'IV'], weight: 4 },
      { chords: ['I', 'V', 'IV', 'IV'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'IV', 'V', 'I', 'I', 'IV', 'V', 'V'], weight: 5 },
      { chords: ['I', 'iii', 'IV', 'V', 'I', 'vi', 'IV', 'V'], weight: 4 },
      { chords: ['I', 'bVII', 'IV', 'I', 'I', 'bVII', 'IV', 'V'], weight: 4 },
      { chords: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'I', 'vi', 'IV', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'bVI', 'bVII', 'I', 'I', 'bVI', 'bVII', 'V'], weight: 4, note: 'The bVI–bVII lift; a beat group had no route to this chord and everything after 1970 does' },
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'V', 'I'], weight: 4 },
    ],
    bridge: [
      { chords: ['vi', 'iii', 'IV', 'I', 'ii', 'IV', 'V', 'V'], weight: 4 },
      { chords: ['bVII', 'IV', 'I', 'V', 'bVII', 'IV', 'V', 'V'], weight: 3 },
    ],
    outro: [
      { chords: ['I', 'bVII', 'IV', 'I'], weight: 4 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 5 },
      { chords: ['i', 'iv', 'VI', 'VII', 'i', 'iv', 'VII', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'III', 'VII'], weight: 5 },
      { chords: ['III', 'VII', 'i', 'VI', 'III', 'VII', 'VI', 'VII'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 4, 4, 2], weight: 4 },
    { cell: [4, 2, 2, 8], weight: 4 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'countermelody-eighths', weight: 5, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 }, { at: 2, dur: 2, tone: 'fifth', vel: 0.68 },
      { at: 4, dur: 2, tone: 'octave', vel: 0.8 }, { at: 6, dur: 2, tone: 'fifth', vel: 0.68 },
      { at: 8, dur: 2, tone: 'root', vel: 0.9 }, { at: 10, dur: 2, tone: 'third', vel: 0.68 },
      { at: 12, dur: 2, tone: 'fifth', vel: 0.78 }, { at: 14, dur: 2, tone: 'approach', vel: 0.7 },
    ] },
    { name: 'driving-eighths', weight: 5, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 }, { at: 2, dur: 2, tone: 'root', vel: 0.7 },
      { at: 4, dur: 2, tone: 'root', vel: 0.86 }, { at: 6, dur: 2, tone: 'root', vel: 0.7 },
      { at: 8, dur: 2, tone: 'root', vel: 0.9 }, { at: 10, dur: 2, tone: 'root', vel: 0.7 },
      { at: 12, dur: 2, tone: 'root', vel: 0.86 }, { at: 14, dur: 2, tone: 'approach', vel: 0.74 },
    ] },
    { name: 'quarters', weight: 3, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 }, { at: 4, dur: 4, tone: 'fifth', vel: 0.78 },
      { at: 8, dur: 4, tone: 'root', vel: 0.88 }, { at: 12, dur: 4, tone: 'fifth', vel: 0.78 },
    ] },
  ],
  comp: [
    { name: 'ringing-eighths', weight: 6, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.88 }, { at: 2, dur: 2, vel: 0.58 },
      { at: 4, dur: 2, vel: 0.78 }, { at: 6, dur: 2, vel: 0.58 },
      { at: 8, dur: 2, vel: 0.84 }, { at: 10, dur: 2, vel: 0.58 },
      { at: 12, dur: 2, vel: 0.78 }, { at: 14, dur: 2, vel: 0.62 },
    ] },
    { name: 'sus-strums', weight: 4, voices: 4, hits: [
      { at: 0, dur: 6, vel: 0.85 }, { at: 6, dur: 2, vel: 0.6 },
      { at: 8, dur: 6, vel: 0.8 }, { at: 14, dur: 2, vel: 0.62 },
    ] },
    { name: 'backbeat-chops', weight: 3, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.88 }, { at: 12, dur: 3, vel: 0.88 },
    ] },
  ],
  drums: [
    { name: 'compressed-backbeat', weight: 6, voices: {
      bd: [0, 8], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sd: [3, 7, 11, 15] } },
    { name: 'eighth-kick', weight: 4, voices: {
      bd: [0, 6, 8, 14], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], cr: [0],
    } },
    { name: 'ride-out', weight: 3, voices: {
      bd: [0, 8, 10], sd: [4, 12], rd: [0, 2, 4, 6, 8, 10, 12, 14], tb: [4, 12],
    } },
  ],
  melody: { leap: 0.3, ornament: 0.08, span: 12, sequence: 0.62, syncopation: 0.45 },
};

/**
 * CHAMBER — the arrangement is the record, and there is an oboe on it.
 *
 * The line that runs from *Pet Sounds* through Nick Drake and Randy Newman to
 * Sufjan Stevens and Rufus Wainwright: pop songs orchestrated by somebody who
 * could write for winds, with counterpoint underneath the tune instead of chords.
 * It appears in three of the four eras below because it never went away and
 * never became common, which is a shape a style weight can express exactly.
 *
 * `functional`, and this is the last of the six pre-1970 styles to take it — the
 * seventh is `newromantic`, four decades later, which argues itself. The arranger
 * here is writing four-part harmony with passing notes in it; that is a practice
 * with a leading tone in it by definition, and giving this style a flat seventh
 * would be giving the oboe a wrong note against the cello.
 *
 * **`counterMode` stays `answer` and `counterSpacing` is left alone**, which is
 * worth saying because this is the one style in the genre where the counter layer
 * is the *point*. An `ostinato` counter is a machine running underneath; what
 * this wants is a second written line replying in the singer's gaps, which is
 * precisely what the default already is.
 */
const chamber: Style = {
  id: 'chamber',
  label: 'Chamber pop',
  description:
    'A pop song orchestrated by somebody who can write for winds: counterpoint under the tune, an oboe, and no drum machine ever.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [78, 104],
  boxDrums: false,
  hook: 'standard',
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0.4,
  scaleForChord: functional,
  progressions: {
    intro: [
      { chords: ['I', 'V7/vi', 'vi', 'IV'], weight: 4 },
      { chords: ['Imaj7', 'IVmaj7', 'iii7', 'vi7'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'V7/vi', 'vi', 'V7/V', 'V', 'IV', 'ii7', 'V7'], weight: 5, note: 'Two applied dominants in eight bars, which is what separates this from everything else in the file' },
      { chords: ['Imaj7', 'iii7', 'IV', 'iv', 'I', 'vi7', 'ii7', 'V7'], weight: 4 },
      { chords: ['I', 'iii7', 'IV', 'V7/V', 'V', 'vi', 'ii7', 'V7'], weight: 3, note: 'The mediant on bar two, which is how an arranger keeps the bass moving while the tonic holds' },
      { chords: ['vi7', 'V7/V', 'V', 'IV', 'iii7', 'vi7', 'ii7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'V7', 'iii7', 'vi7', 'IV', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V', 'vi', 'V7/V', 'IV', 'I', 'ii7', 'V7'], weight: 4 },
      { chords: ['IVmaj7', 'iv', 'I', 'vi7', 'ii7', 'V7', 'I', 'I'], weight: 4 },
    ],
    bridge: [
      { chords: ['vi', 'V7/V', 'V', 'V', 'IV', 'iv', 'I', 'V7'], weight: 4 },
      { chords: ['IV', 'V7/iii', 'iii7', 'vi7', 'ii7', 'V7', 'V7', 'V7'], weight: 3 },
    ],
    outro: [
      { chords: ['IV', 'iv', 'I', 'I'], weight: 4 },
      { chords: ['ii7', 'V7', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'V7/iv', 'iv', 'VII', 'III', 'VI', 'iio', 'V7'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'V7', 'VI', 'iio', 'V7', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['III', 'VI', 'iio', 'V7', 'i', 'iv', 'V7', 'i'], weight: 5 },
      { chords: ['VI', 'III', 'iv', 'V7', 'VI', 'iio', 'V7', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [12, 4], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    { name: 'walking-line', weight: 5, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 0.92 },
      { at: 4, dur: 4, tone: 'third', vel: 0.72 },
      { at: 8, dur: 4, tone: 'fifth', vel: 0.8 },
      { at: 12, dur: 4, tone: 'approach', vel: 0.72 },
    ] },
    { name: 'pizzicato-halves', weight: 4, hits: [
      { at: 0, dur: 6, tone: 'root', vel: 0.9 },
      { at: 8, dur: 6, tone: 'fifth', vel: 0.76 },
    ] },
    { name: 'held', weight: 3, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.82 }], sustain: true },
  ],
  comp: [
    { name: 'arpeggiated-guitar', weight: 5, voices: 4, arpeggio: true, arpDirection: 'updown', hits: [
      { at: 0, dur: 2, vel: 0.6 }, { at: 2, dur: 2, vel: 0.46 },
      { at: 4, dur: 2, vel: 0.55 }, { at: 6, dur: 2, vel: 0.46 },
      { at: 8, dur: 2, vel: 0.58 }, { at: 10, dur: 2, vel: 0.46 },
      { at: 12, dur: 2, vel: 0.55 }, { at: 14, dur: 2, vel: 0.5 },
    ] },
    { name: 'piano-quarters', weight: 4, voices: 4, hits: [
      { at: 0, dur: 4, vel: 0.66 }, { at: 4, dur: 4, vel: 0.52 },
      { at: 8, dur: 4, vel: 0.62 }, { at: 12, dur: 4, vel: 0.54 },
    ] },
    { name: 'held-winds', weight: 3, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.48 }], sustain: true },
  ],
  drums: [
    { name: 'soft-kit', weight: 5, voices: {
      bd: [0, 8], sd: [4, 12], sh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sd: [3, 7, 11, 15] } },
    { name: 'rim-and-shaker', weight: 4, voices: {
      bd: [0, 10], rim: [4, 12], sh: [0, 4, 8, 12], tb: [4, 12],
    } },
    { name: 'timpani-and-brushes', weight: 3, voices: {
      bd: [0, 8], lt: [12], sd: [4], sh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  fills: [['snare-toms', 4], ['drop', 4], ['tom-roll', 2], ['lead-in', 2]],
  melody: { leap: 0.34, ornament: 0.28, span: 16, sequence: 0.4, syncopation: 0.3 },
};

// ---------------------------------------------------------------------------
// 1980–89 — the machine, the gate and the chorus that is the hook
// ---------------------------------------------------------------------------

/**
 * SYNTHPOP — a drum machine, a sequenced bass, and a song on top of them.
 *
 * The Human League, Yazoo, Depeche Mode's first two records, Pet Shop Boys.
 * **This is the style that has to justify itself against `synth/machine`**, and
 * the honest answer is that they are two records made on the same equipment for
 * two different purposes. Kraftwerk's bass line *is* the tune and the melody is
 * five notes repeated exactly; here the bass line is an accompaniment and the
 * melody is a chorus somebody sings in a supermarket. The tables say so: this
 * style's `melody.span` is 12 semitones against `machine`'s narrow line, its
 * `sequence` is 0.6, and its form is verse/chorus rather than a loop.
 *
 * The other half of the difference is `cycle`, and its absence here is the
 * statement. Every sequencer figure in `synth` runs on a cycle that disagrees
 * with the bar, because the drift is the composition. This one is bar-shaped, on
 * purpose: a pop song's bass figure has to come round on the downbeat every time
 * or the singer cannot land the chorus.
 */
const synthpop: Style = {
  id: 'synthpop',
  label: 'Synthpop (1982)',
  description:
    'A drum machine, a bar-shaped sequenced bass and a chorus over the top. The sequencer accompanies here; it does not compose.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [112, 136],
  modeWeights: { minor: 0.62, major: 0.38 },
  relativeMajorChorus: 0.5,
  progressions: {
    intro: [
      { chords: ['i', 'i', 'VI', 'VII'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'VII'], weight: 4 },
    ],
    verse: [
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 6 },
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'VII', 'VII'], weight: 4, note: 'Four bars of one chord under a sequencer, which is what half these records do with a verse' },
      { chords: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'III', 'VII'], weight: 4 },
      { chords: ['i', 'iv', 'VI', 'VII', 'i', 'iv', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 6, note: 'The two chords that walk up into the tonic — the loudest four bars of the decade' },
      { chords: ['VI', 'III', 'VII', 'i', 'VI', 'III', 'VII', 'i'], weight: 5 },
      { chords: ['III', 'VII', 'VI', 'VII', 'III', 'VII', 'VI', 'VII'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'VII', 'VII'], weight: 4 },
      { chords: ['VI', 'VII', 'III', 'III', 'VI', 'VII', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['i', 'VII', 'VI', 'VII'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'IV'], weight: 5 },
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'I', 'I', 'IV', 'V', 'vi', 'V'], weight: 5 },
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'V'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [-2, 2, 4, 4, 4], weight: 4 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [4, 2, 2, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    { name: 'sequenced-eighths', weight: 6, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 }, { at: 2, dur: 2, tone: 'root', vel: 0.7 },
      { at: 4, dur: 2, tone: 'octave', vel: 0.82 }, { at: 6, dur: 2, tone: 'root', vel: 0.7 },
      { at: 8, dur: 2, tone: 'root', vel: 0.9 }, { at: 10, dur: 2, tone: 'fifth', vel: 0.7 },
      { at: 12, dur: 2, tone: 'octave', vel: 0.8 }, { at: 14, dur: 2, tone: 'root', vel: 0.72 },
    ] },
    { name: 'sixteenth-pulse', weight: 4, hits: [
      { at: 0, dur: 1, tone: 'root', vel: 1 }, { at: 1, dur: 1, tone: 'root', vel: 0.6 },
      { at: 2, dur: 1, tone: 'root', vel: 0.7 }, { at: 3, dur: 1, tone: 'root', vel: 0.6 },
      { at: 8, dur: 1, tone: 'root', vel: 0.9 }, { at: 9, dur: 1, tone: 'root', vel: 0.6 },
      { at: 10, dur: 1, tone: 'octave', vel: 0.72 }, { at: 11, dur: 1, tone: 'root', vel: 0.6 },
      { at: 12, dur: 2, tone: 'fifth', vel: 0.75 }, { at: 14, dur: 2, tone: 'root', vel: 0.7 },
    ] },
    { name: 'held-synth', weight: 3, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 0.9 },
      { at: 8, dur: 8, tone: 'root', vel: 0.82 },
    ], sustain: true },
  ],
  comp: [
    { name: 'stab-offbeats', weight: 5, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.68 }, { at: 6, dur: 2, vel: 0.74 },
      { at: 10, dur: 2, vel: 0.68 }, { at: 14, dur: 2, vel: 0.76 },
    ] },
    { name: 'arpeggiator', weight: 5, voices: 3, arpeggio: true, arpDirection: 'updown', hits: [
      { at: 0, dur: 1, vel: 0.62 }, { at: 2, dur: 1, vel: 0.5 },
      { at: 4, dur: 1, vel: 0.6 }, { at: 6, dur: 1, vel: 0.5 },
      { at: 8, dur: 1, vel: 0.62 }, { at: 10, dur: 1, vel: 0.5 },
      { at: 12, dur: 1, vel: 0.6 }, { at: 14, dur: 1, vel: 0.52 },
    ] },
    { name: 'held-poly', weight: 3, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.5 }], sustain: true },
  ],
  drums: [
    { name: 'linn-backbeat', weight: 6, voices: {
      bd: [0, 8], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], cp: [12],
    } },
    { name: 'machine-sixteenths', weight: 4, voices: {
      bd: [0, 6, 8], sd: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      tb: [4, 12],
    } },
    { name: 'four-floor-machine', weight: 3, voices: {
      bd: [0, 4, 8, 12], sd: [4, 12], cp: [4, 12], oh: [2, 6, 10, 14],
    } },
  ],
  fills: [['drop', 4], ['lead-in', 4], ['tom-roll', 3], ['snare-roll', 2]],
  melody: { leap: 0.26, ornament: 0.08, span: 12, sequence: 0.6, syncopation: 0.4 },
};

/**
 * NEW ROMANTIC — the same equipment, and somebody has been to the theatre.
 *
 * Duran Duran, Ultravox, Visage, ABC. It sits beside `synthpop` and disagrees
 * with it about ambition rather than about hardware: the changes move, the
 * arrangement has a fretless bass and a saxophone on it, and the record is trying
 * to be about something. `bpm` overlaps `synthpop` almost exactly, which is
 * correct and is why the difference has to be in the harmony — this style has a
 * `bII` and a diminished chord in its tables, and `synthpop` has three chords.
 *
 * The one production statement: `effects` puts a long reverb on the drums and
 * nothing else, which is the 1981 chorus-plate sound and is separable from the
 * gate the next style is built on.
 *
 * **`functional`, and it is the seventh and most surprising style to take it.**
 * The other six are all pre-1970 and descend visibly from the theatre song; this
 * one is a synthesiser band in 1981 and looks like it belongs with the seventeen
 * modal styles it is surrounded by — this read *eighteen*, against the
 * twenty-four-minus-seven this file's own header does correctly twice.
 * It does not belong with them, and the tables above are why: a
 * `iio` and a major `V` in a minor key are a functional cadence whatever
 * instrument plays them, and this is the corner of the decade whose writers had
 * been to musical theatre and were not embarrassed about it.
 *
 * The measurement is what settled it. With the genre's modal rule this style
 * produced the third-highest count of raised sevenths in the catalogue anyway —
 * because `parseRoman` flags a major fifth degree as `dominantFunction` whatever
 * a genre believes, so the comp was voicing a ♯7 while the melody drew ♮7 from
 * the chord scale. That is not modal, it is a clash, and it left the tables
 * looking innocent. The invariant `index.ts` states — **a style writes `V` in
 * minor if and only if it names `functional`** — is the rule that catches it,
 * and three other styles had their minor `V` taken away rather than gaining the
 * substitution, because in `merseybeat`, `discopop` and `powerpop` the aeolian
 * reading is the correct one and the `V` was the mistake.
 */
const newromantic: Style = {
  id: 'newromantic',
  label: 'New romantic (1981)',
  description:
    'Synthpop with ambition: a fretless bass, a saxophone, chords that move, and a plate on the drums.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [110, 134],
  hook: 'standard',
  modeWeights: { minor: 0.72, major: 0.28 },
  relativeMajorChorus: 0.45,
  scaleForChord: functional,
  effects: { drums: { reverb: 0.5 } },
  progressions: {
    intro: [
      { chords: ['i', 'VI', 'iv', 'V'], weight: 4 },
      { chords: ['i', 'bII', 'i', 'VII'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'iv', 'V'], weight: 5 },
      { chords: ['i', 'i', 'bII', 'bII', 'VII', 'VII', 'i', 'i'], weight: 3, note: 'The Neapolitan used as a colour rather than as a pre-dominant, which is what the decade did with it' },
      { chords: ['i', 'iv', 'VII', 'III', 'VI', 'iio', 'V', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'iio', 'i', 'VII', 'VI', 'V'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'III', 'i', 'VI', 'VII', 'iv', 'V'], weight: 5 },
      { chords: ['III', 'VI', 'iv', 'VII', 'III', 'VI', 'V', 'i'], weight: 4 },
      { chords: ['iv', 'VI', 'VII', 'i', 'iv', 'VI', 'V', 'i'], weight: 4 },
    ],
    bridge: [
      { chords: ['VI', 'VI', 'bII', 'bII', 'V', 'V', 'V', 'V'], weight: 4 },
      { chords: ['iv', 'VII', 'III', 'VI', 'iio', 'V', 'V', 'V'], weight: 3 },
    ],
    outro: [
      { chords: ['VI', 'VII', 'i', 'i'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'vi', 'IV', 'V', 'I', 'iii', 'ii', 'V'], weight: 5 },
      { chords: ['I', 'bVI', 'bVII', 'I', 'I', 'bVI', 'IV', 'V'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'vi', 'iii', 'IV', 'V', 'I', 'I'], weight: 5 },
      { chords: ['vi', 'IV', 'V', 'I', 'vi', 'IV', 'ii', 'V'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [-2, 2, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 3 },
    { cell: [12, 4], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    { name: 'fretless-line', weight: 5, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 }, { at: 3, dur: 1, tone: 'fifth', vel: 0.6 },
      { at: 4, dur: 2, tone: 'octave', vel: 0.78 }, { at: 7, dur: 1, tone: 'seventh', vel: 0.6 },
      { at: 8, dur: 3, tone: 'root', vel: 0.9 }, { at: 12, dur: 2, tone: 'fifth', vel: 0.76 },
      { at: 14, dur: 2, tone: 'approach', vel: 0.68 },
    ] },
    { name: 'driving-eighths', weight: 5, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 }, { at: 2, dur: 2, tone: 'root', vel: 0.7 },
      { at: 4, dur: 2, tone: 'root', vel: 0.85 }, { at: 6, dur: 2, tone: 'octave', vel: 0.7 },
      { at: 8, dur: 2, tone: 'root', vel: 0.9 }, { at: 10, dur: 2, tone: 'root', vel: 0.7 },
      { at: 12, dur: 2, tone: 'fifth', vel: 0.82 }, { at: 14, dur: 2, tone: 'root', vel: 0.72 },
    ] },
    { name: 'halves', weight: 3, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 0.95 }, { at: 8, dur: 8, tone: 'fifth', vel: 0.78 },
    ] },
  ],
  comp: [
    { name: 'chorused-guitar', weight: 5, voices: 3, arpeggio: true, arpDirection: 'downup', hits: [
      { at: 0, dur: 1, vel: 0.66 }, { at: 2, dur: 1, vel: 0.5 },
      { at: 4, dur: 1, vel: 0.62 }, { at: 6, dur: 1, vel: 0.5 },
      { at: 8, dur: 1, vel: 0.66 }, { at: 10, dur: 1, vel: 0.5 },
      { at: 12, dur: 1, vel: 0.62 }, { at: 14, dur: 1, vel: 0.54 },
    ] },
    { name: 'poly-stabs', weight: 4, voices: 4, hits: [
      { at: 0, dur: 3, vel: 0.72 }, { at: 6, dur: 2, vel: 0.6 },
      { at: 8, dur: 3, vel: 0.68 }, { at: 14, dur: 2, vel: 0.62 },
    ] },
    { name: 'held-strings', weight: 3, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.5 }], sustain: true },
  ],
  drums: [
    { name: 'tom-heavy', weight: 5, voices: {
      bd: [0, 8], sd: [4, 12], lt: [6, 14], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'simmons-backbeat', weight: 4, voices: {
      bd: [0, 6, 8], sd: [4, 12], mt: [10], ht: [14], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'four-floor', weight: 3, voices: {
      bd: [0, 4, 8, 12], sd: [4, 12], oh: [2, 6, 10, 14], cp: [12],
    } },
  ],
  fills: [['tom-roll', 6], ['snare-toms', 3], ['lead-in', 2]],
  melody: { leap: 0.34, ornament: 0.14, span: 15, sequence: 0.46, syncopation: 0.4 },
};

/**
 * STADIUM — the gated snare, and the record that is about the back row.
 *
 * 1985 and the reason `Style.effects` exists in the shape it does. Everything
 * about this style is one production decision: a snare with a noise gate across
 * a huge ambient reverb, so the drum arrives with the room and then the room is
 * cut off. `DrumTrack.voiceEffects` already carries per-voice treatment, and this
 * is the style that has been waiting for it — a long reverb on the *whole* kit
 * puts a two-second tail on the hi-hats and the record turns to mud, which is
 * exactly the mistake the field was added to make unnecessary.
 *
 * The harmony is `sus4` and `sus2` almost throughout, because a suspended chord
 * has no third and a chord with no third is *loud* — it is the one voicing that
 * survives being played by two guitars, a synthesiser and a stadium at once.
 * `strictness: 'free'` follows from that: the rule table calls a hanging fourth a
 * fault and here it is the sound.
 */
const stadium: Style = {
  id: 'stadium',
  label: 'Stadium pop (1985)',
  description:
    'A gated snare, suspended chords with no third in them, and an arrangement designed to arrive at the back of a room.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [116, 140],
  strictness: 'free',
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0.35,
  /**
   * The treatment is the piece. `drums` gets the big plate and `lowpass` is not
   * named, so how bright the decade is stays the era's business — the gate
   * itself lives on the kit's own voice treatment rather than here.
   */
  effects: {
    drums: { reverb: 0.62 },
    melody: { reverb: 0.45, delay: 0.375 },
    comp: { reverb: 0.4, delay: 0.375 },
    pad: { reverb: 0.7 },
    vocal: { reverb: 0.5, delay: 0.375 },
  },
  progressions: {
    intro: [
      { chords: ['Isus2', 'Isus2', 'IVsus2', 'IVsus2'], weight: 4 },
      { chords: ['vi', 'IV', 'I', 'V'], weight: 4 },
    ],
    verse: [
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'IV'], weight: 5 },
      { chords: ['Isus2', 'Isus2', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'V'], weight: 5, note: 'The four chords, in the order that puts the minor first — a verse that is already the chorus in disguise' },
      { chords: ['I', 'IV', 'I', 'V', 'I', 'IV', 'V', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'I', 'vi', 'IV', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IVsus2', 'IV'], weight: 6 },
      { chords: ['bVI', 'bVII', 'I', 'I', 'bVI', 'bVII', 'IV', 'V'], weight: 3 },
    ],
    bridge: [
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 4 },
      { chords: ['IVsus2', 'IV', 'bVII', 'bVII', 'V', 'V', 'V', 'V'], weight: 3 },
    ],
    outro: [
      { chords: ['I', 'V', 'IV', 'IV'], weight: 4 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'III', 'VII'], weight: 5 },
      { chords: ['VI', 'III', 'VII', 'i', 'VI', 'III', 'VII', 'VII'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [8, 4, 4], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [16], weight: 3 },
    { cell: [12, 4], weight: 3 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [12, 4], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    { name: 'eighth-drive', weight: 5, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 }, { at: 2, dur: 2, tone: 'root', vel: 0.72 },
      { at: 4, dur: 2, tone: 'root', vel: 0.86 }, { at: 6, dur: 2, tone: 'root', vel: 0.72 },
      { at: 8, dur: 2, tone: 'root', vel: 0.92 }, { at: 10, dur: 2, tone: 'root', vel: 0.72 },
      { at: 12, dur: 2, tone: 'root', vel: 0.86 }, { at: 14, dur: 2, tone: 'approach', vel: 0.76 },
    ] },
    { name: 'held-roots', weight: 4, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.92 }], sustain: true },
    { name: 'root-fifth-halves', weight: 3, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 1 }, { at: 8, dur: 8, tone: 'fifth', vel: 0.8 },
    ] },
  ],
  comp: [
    { name: 'delay-arpeggio', weight: 5, voices: 3, arpeggio: true, arpDirection: 'up', hits: [
      { at: 0, dur: 1, vel: 0.75 }, { at: 3, dur: 1, vel: 0.55 },
      { at: 6, dur: 1, vel: 0.68 }, { at: 8, dur: 1, vel: 0.72 },
      { at: 11, dur: 1, vel: 0.55 }, { at: 14, dur: 1, vel: 0.66 },
    ] },
    { name: 'ringing-sus', weight: 5, voices: 4, hits: [
      { at: 0, dur: 8, vel: 0.78 }, { at: 8, dur: 8, vel: 0.72 },
    ] },
    { name: 'backbeat-stabs', weight: 3, voices: 4, hits: [
      { at: 4, dur: 3, vel: 0.8 }, { at: 12, dur: 3, vel: 0.8 },
    ] },
  ],
  drums: [
    /** The gate: a snare on 2 and 4 and *nothing else in the bar*, because a
     * gated snare with a busy hand over it is inaudible as a gate. */
    { name: 'gated-backbeat', weight: 6, voices: {
      bd: [0, 8], sd: [4, 12], hh: [0, 4, 8, 12],
    } },
    { name: 'gated-toms', weight: 4, voices: {
      bd: [0, 8], sd: [4, 12], lt: [14], mt: [15], hh: [0, 4, 8, 12], cr: [0],
    } },
    { name: 'half-time-gate', weight: 3, voices: {
      bd: [0, 10], sd: [8], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  fills: [['tom-roll', 6], ['snare-toms', 4], ['drop', 2]],
  shots: [[[0, 6, 10], 3], [[0, 8, 14], 2]],
  melody: { leap: 0.34, ornament: 0.1, span: 15, sequence: 0.55, syncopation: 0.35 },
};

/**
 * JANGLE — a twelve-string, a compressor, and no ambition to be on the radio.
 *
 * R.E.M. before they were famous, the Smiths, Aztec Camera, Orange Juice, the
 * Go-Betweens. Placed in the 1985 era against everything else in it, and that is
 * the point of including it: the same year that produced `stadium` produced a
 * parallel repertoire that was defined by refusing every one of stadium's
 * decisions. No gate, no reverb worth the name, a kit recorded close, and a
 * guitar figure that is arpeggiated rather than strummed.
 *
 * The harmony is the giveaway and is why it is not `powerpop`: this style lives
 * on `vi` and on modal interchange, and its choruses do not resolve. Where
 * `powerpop` writes `IV–V–I`, this writes `IV–V–vi` and stays there.
 */
const jangle: Style = {
  id: 'jangle',
  label: 'Jangle (1985)',
  description:
    'A twelve-string arpeggio, a close-miked kit, no reverb, and a chorus that arrives on the relative minor and stays there.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [124, 152],
  boxDrums: false,
  hook: 'standard',
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0.15,
  effects: { drums: { reverb: 0.1 }, comp: { reverb: 0.15 }, melody: { reverb: 0.18 } },
  progressions: {
    intro: [
      { chords: ['I', 'V', 'vi', 'IV'], weight: 4 },
      { chords: ['vi', 'IV', 'I', 'V'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'vi', 'IV'], weight: 5 },
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'V'], weight: 5 },
      { chords: ['I', 'iii', 'IV', 'I', 'I', 'iii', 'ii', 'V'], weight: 4 },
      { chords: ['I', 'bVII', 'IV', 'I', 'vi', 'bVII', 'IV', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'vi', 'vi', 'IV', 'V', 'vi', 'vi'], weight: 5, note: 'The deceptive chorus: everything points at I and it lands on vi, twice, and does not correct itself' },
      { chords: ['I', 'IV', 'vi', 'V', 'I', 'IV', 'ii', 'V'], weight: 4 },
      { chords: ['vi', 'V', 'IV', 'IV', 'vi', 'V', 'IV', 'V'], weight: 4 },
    ],
    bridge: [
      { chords: ['ii', 'ii', 'IV', 'IV', 'vi', 'vi', 'V', 'V'], weight: 4 },
      { chords: ['IV', 'I', 'V', 'vi', 'IV', 'I', 'V', 'V'], weight: 3 },
    ],
    outro: [
      { chords: ['I', 'V', 'vi', 'IV'], weight: 4 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'III', 'VII'], weight: 5 },
      { chords: ['i', 'III', 'VII', 'iv', 'i', 'III', 'VI', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['III', 'VII', 'i', 'VI', 'III', 'VII', 'iv', 'VII'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [-2, 2, 2, 4, 4, 2], weight: 4 },
    { cell: [4, 2, 2, 8], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  bass: [
    { name: 'melodic-eighths', weight: 5, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.95 }, { at: 2, dur: 2, tone: 'fifth', vel: 0.66 },
      { at: 4, dur: 2, tone: 'octave', vel: 0.78 }, { at: 6, dur: 2, tone: 'third', vel: 0.66 },
      { at: 8, dur: 2, tone: 'root', vel: 0.88 }, { at: 10, dur: 2, tone: 'fifth', vel: 0.66 },
      { at: 12, dur: 2, tone: 'octave', vel: 0.76 }, { at: 14, dur: 2, tone: 'approach', vel: 0.7 },
    ] },
    { name: 'root-quarters', weight: 4, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 }, { at: 4, dur: 4, tone: 'root', vel: 0.76 },
      { at: 8, dur: 4, tone: 'fifth', vel: 0.86 }, { at: 12, dur: 4, tone: 'root', vel: 0.76 },
    ] },
    { name: 'halves', weight: 3, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 0.95 }, { at: 8, dur: 8, tone: 'third', vel: 0.78 },
    ] },
  ],
  comp: [
    { name: 'twelve-string-arpeggio', weight: 6, voices: 4, arpeggio: true, arpDirection: 'updown', hits: [
      { at: 0, dur: 1, vel: 0.7 }, { at: 2, dur: 1, vel: 0.55 },
      { at: 4, dur: 1, vel: 0.65 }, { at: 6, dur: 1, vel: 0.55 },
      { at: 8, dur: 1, vel: 0.7 }, { at: 10, dur: 1, vel: 0.55 },
      { at: 12, dur: 1, vel: 0.65 }, { at: 14, dur: 1, vel: 0.58 },
    ] },
    { name: 'sixteenth-arpeggio', weight: 4, voices: 4, arpeggio: true, arpDirection: 'downup', hits: [
      { at: 0, dur: 1, vel: 0.66 }, { at: 1, dur: 1, vel: 0.5 }, { at: 2, dur: 1, vel: 0.58 },
      { at: 3, dur: 1, vel: 0.5 }, { at: 4, dur: 1, vel: 0.62 }, { at: 5, dur: 1, vel: 0.5 },
      { at: 8, dur: 1, vel: 0.66 }, { at: 9, dur: 1, vel: 0.5 }, { at: 10, dur: 1, vel: 0.58 },
      { at: 11, dur: 1, vel: 0.5 }, { at: 12, dur: 1, vel: 0.62 }, { at: 13, dur: 1, vel: 0.52 },
    ] },
    { name: 'strummed-eighths', weight: 3, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.78 }, { at: 2, dur: 2, vel: 0.55 },
      { at: 4, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.55 },
      { at: 8, dur: 2, vel: 0.74 }, { at: 10, dur: 2, vel: 0.55 },
      { at: 12, dur: 2, vel: 0.7 }, { at: 14, dur: 2, vel: 0.58 },
    ] },
  ],
  drums: [
    { name: 'close-backbeat', weight: 6, voices: {
      bd: [0, 8], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sd: [3, 7, 11, 15] } },
    { name: 'ride-and-tambourine', weight: 4, voices: {
      bd: [0, 6, 8], sd: [4, 12], rd: [0, 2, 4, 6, 8, 10, 12, 14], tb: [4, 12],
    }, ghosts: { sd: [11] } },
    { name: 'floor-tom-pulse', weight: 3, voices: {
      bd: [0, 8], lt: [0, 4, 8, 12], sd: [4, 12], hh: [2, 6, 10, 14],
    } },
  ],
  melody: { leap: 0.28, ornament: 0.12, span: 12, sequence: 0.5, syncopation: 0.5 },
};

/**
 * HI-NRG — 140 bpm, four on the floor, and an octave bass that never stops.
 *
 * Bobby O, Stock Aitken Waterman's first two years, Divine, Hazell Dean. The
 * fastest thing in this genre and the most mechanical, and it is here because it
 * is the missing link between `discopop` and everything on the dance floor
 * afterwards — the point where the octave bass stopped being a bass player's
 * figure and became a sequencer patch.
 *
 * `hook: 'earworm'`, and `melody.span` is the narrowest in the file at 9
 * semitones. This is a style where the tune is *shouted over* the track rather
 * than sung across it, and a wide melodic range would be describing a different
 * record. `boxDrums` is left on: this is the one place in the genre where a
 * preset rhythm box with no fills in it is not a degradation.
 */
const hinrg: Style = {
  id: 'hinrg',
  label: 'Hi-NRG (1984)',
  description:
    'A hundred and forty beats a minute, an octave bass that never stops, and a chorus shouted over the top of it.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [132, 152],
  hook: 'earworm',
  modeWeights: { minor: 0.66, major: 0.34 },
  relativeMajorChorus: 0.5,
  progressions: {
    intro: [
      { chords: ['i', 'i', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'VI', 'VII', 'i'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 6 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 6 },
      { chords: ['VI', 'III', 'VII', 'i', 'VI', 'III', 'VII', 'i'], weight: 4 },
      { chords: ['iv', 'VII', 'III', 'VI', 'iv', 'VII', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'VII', 'VII', 'iv', 'iv', 'VII', 'VII'], weight: 4 },
    ],
    outro: [
      { chords: ['i', 'VII', 'VI', 'VII'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'V', 'V', 'vi', 'vi', 'IV', 'IV'], weight: 5 },
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'V'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'I', 'I', 'IV', 'V', 'I', 'I'], weight: 5 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
    { cell: [8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  bass: [
    { name: 'octave-sixteenths', weight: 6, hits: [
      { at: 0, dur: 1, tone: 'root', vel: 1 }, { at: 2, dur: 1, tone: 'octave', vel: 0.7 },
      { at: 4, dur: 1, tone: 'root', vel: 0.86 }, { at: 6, dur: 1, tone: 'octave', vel: 0.7 },
      { at: 8, dur: 1, tone: 'root', vel: 0.92 }, { at: 10, dur: 1, tone: 'octave', vel: 0.7 },
      { at: 12, dur: 1, tone: 'root', vel: 0.86 }, { at: 14, dur: 1, tone: 'octave', vel: 0.72 },
    ] },
    { name: 'octave-eighths', weight: 5, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 }, { at: 2, dur: 2, tone: 'octave', vel: 0.72 },
      { at: 4, dur: 2, tone: 'root', vel: 0.86 }, { at: 6, dur: 2, tone: 'octave', vel: 0.72 },
      { at: 8, dur: 2, tone: 'root', vel: 0.92 }, { at: 10, dur: 2, tone: 'octave', vel: 0.72 },
      { at: 12, dur: 2, tone: 'root', vel: 0.86 }, { at: 14, dur: 2, tone: 'octave', vel: 0.74 },
    ] },
  ],
  comp: [
    { name: 'offbeat-stabs', weight: 6, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.72 }, { at: 6, dur: 2, vel: 0.78 },
      { at: 10, dur: 2, vel: 0.72 }, { at: 14, dur: 2, vel: 0.8 },
    ] },
    { name: 'sixteenth-arpeggio', weight: 4, voices: 3, arpeggio: true, arpDirection: 'up', arpOctaves: 2, hits: [
      { at: 0, dur: 1, vel: 0.66 }, { at: 1, dur: 1, vel: 0.5 }, { at: 2, dur: 1, vel: 0.6 },
      { at: 3, dur: 1, vel: 0.5 }, { at: 4, dur: 1, vel: 0.64 }, { at: 5, dur: 1, vel: 0.5 },
      { at: 6, dur: 1, vel: 0.6 }, { at: 7, dur: 1, vel: 0.5 }, { at: 8, dur: 1, vel: 0.66 },
      { at: 9, dur: 1, vel: 0.5 }, { at: 10, dur: 1, vel: 0.6 }, { at: 11, dur: 1, vel: 0.5 },
      { at: 12, dur: 1, vel: 0.64 }, { at: 13, dur: 1, vel: 0.5 }, { at: 14, dur: 1, vel: 0.6 },
      { at: 15, dur: 1, vel: 0.52 },
    ] },
  ],
  drums: [
    { name: 'hi-nrg-floor', weight: 6, voices: {
      bd: [0, 4, 8, 12], sd: [4, 12], cp: [4, 12], oh: [2, 6, 10, 14], hh: [0, 4, 8, 12],
    } },
    { name: 'floor-with-toms', weight: 4, voices: {
      bd: [0, 4, 8, 12], sd: [4, 12], lt: [14], mt: [15], oh: [2, 6, 10, 14],
    } },
  ],
  fills: [['tom-roll', 5], ['drop', 3], ['lead-in', 3]],
  melody: { leap: 0.2, ornament: 0.05, span: 9, sequence: 0.74, syncopation: 0.35 },
};

/**
 * DREAM POP — the tune is there and it has been put behind something.
 *
 * Cocteau Twins, Mazzy Star, Slowdive's melodic half, Beach House later. The
 * hardest style in this file to justify keeping out of `ambient`, and the answer
 * is the one `docs/synth.md` gives about `kosmische`: this music **has a chorus
 * that arrives**. The harmony moves, the sections are different from each other,
 * and there is a tune underneath the reverb that could be played on a piano and
 * would still be a song. Ambient's proposition is that the melody comes from the
 * drone; here the melody comes from the chords, exactly as it does in every other
 * style in this file, and the reverb is a coat put on afterwards.
 *
 * `drumFills: false` for the opposite reason to `torch`'s: this style has no
 * edges to announce, because the reverb tail from the previous section is still
 * sounding when the next one starts.
 */
const dreampop: Style = {
  id: 'dreampop',
  label: 'Dream pop (1989)',
  description:
    'A song with a chorus, put behind a great deal of reverb. The tune is still a tune; it is simply not the loudest thing.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [82, 108],
  hook: 'standard',
  drumFills: false,
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0.3,
  /**
   * The one style here whose treatment genuinely *is* the piece, and the reason
   * `Style.effects` outranks the era: a dry dream-pop record cut in 2010 is not
   * a period variant, it is a different song. `lowpass` unnamed, as ever.
   */
  effects: {
    comp: { reverb: 0.85, delay: 0.5 },
    melody: { reverb: 0.8, delay: 0.375 },
    pad: { reverb: 0.9 },
    drums: { reverb: 0.5 },
    counter: { reverb: 0.8, delay: 0.5 },
    vocal: { reverb: 0.85, delay: 0.375 },
  },
  progressions: {
    intro: [
      { chords: ['i', 'i', 'VI', 'VI'], weight: 4 },
      { chords: ['IVmaj7', 'IVmaj7', 'i7', 'i7'], weight: 3 },
    ],
    verse: [
      { chords: ['i7', 'i7', 'VImaj7', 'VImaj7', 'IIImaj7', 'IIImaj7', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 4 },
      { chords: ['i7', 'iv7', 'VImaj7', 'VII', 'i7', 'iv7', 'VII', 'VII'], weight: 4 },
      { chords: ['i7', 'i7', 'i7', 'i7', 'VII', 'VII', 'VI', 'VI'], weight: 3, note: 'Four bars of one chord: the sections are long and the chords are slow, which is what makes room for the tail' },
    ],
    chorus: [
      { chords: ['VImaj7', 'VII', 'i7', 'i7', 'VImaj7', 'VII', 'IIImaj7', 'IIImaj7'], weight: 5 },
      { chords: ['IIImaj7', 'VII', 'VImaj7', 'VII', 'IIImaj7', 'VII', 'i7', 'i7'], weight: 4 },
      { chords: ['iv7', 'VImaj7', 'VII', 'i7', 'iv7', 'VImaj7', 'VII', 'VII'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv7', 'iv7', 'VII', 'VII', 'VImaj7', 'VImaj7', 'VII', 'VII'], weight: 4 },
    ],
    outro: [
      { chords: ['VImaj7', 'VII', 'i7', 'i7'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['Imaj7', 'Imaj7', 'IVmaj7', 'IVmaj7', 'vi7', 'vi7', 'V', 'V'], weight: 5 },
      { chords: ['Imaj7', 'iii7', 'IVmaj7', 'V', 'Imaj7', 'iii7', 'IVmaj7', 'IVmaj7'], weight: 4 },
    ],
    chorus: [
      { chords: ['IVmaj7', 'V', 'Imaj7', 'vi7', 'IVmaj7', 'V', 'Imaj7', 'Imaj7'], weight: 5 },
    ],
  },
  melodyCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 5 },
    { cell: [12, 4], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [-8, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'held', weight: 6, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.85 }], sustain: true },
    { name: 'halves', weight: 4, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 0.9 }, { at: 8, dur: 8, tone: 'fifth', vel: 0.74 },
    ] },
    { name: 'eighth-pulse', weight: 3, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.9 }, { at: 2, dur: 2, tone: 'root', vel: 0.62 },
      { at: 4, dur: 2, tone: 'root', vel: 0.76 }, { at: 6, dur: 2, tone: 'root', vel: 0.62 },
      { at: 8, dur: 2, tone: 'root', vel: 0.84 }, { at: 10, dur: 2, tone: 'root', vel: 0.62 },
      { at: 12, dur: 2, tone: 'fifth', vel: 0.74 }, { at: 14, dur: 2, tone: 'root', vel: 0.64 },
    ] },
  ],
  comp: [
    { name: 'washed-halves', weight: 6, voices: 4, hits: [
      { at: 0, dur: 8, vel: 0.6 }, { at: 8, dur: 8, vel: 0.55 },
    ] },
    { name: 'slow-arpeggio', weight: 4, voices: 4, arpeggio: true, arpDirection: 'updown', hits: [
      { at: 0, dur: 4, vel: 0.55 }, { at: 4, dur: 4, vel: 0.45 },
      { at: 8, dur: 4, vel: 0.52 }, { at: 12, dur: 4, vel: 0.46 },
    ] },
    { name: 'held', weight: 4, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.5 }], sustain: true },
  ],
  drums: [
    { name: 'slow-backbeat', weight: 5, voices: {
      bd: [0, 8], sd: [4, 12], hh: [0, 4, 8, 12],
    } },
    { name: 'half-time', weight: 4, voices: {
      bd: [0], sd: [8], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sd: [7, 11] } },
    { name: 'rim-and-shaker', weight: 3, voices: {
      bd: [0, 8], rim: [4, 12], sh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  counterSpacing: 1,
  melody: { leap: 0.22, ornament: 0.16, span: 11, sequence: 0.5, syncopation: 0.2 },
};

// ---------------------------------------------------------------------------
// 1993–now — the grid, the sidechain and the drop
// ---------------------------------------------------------------------------

/**
 * EUROPOP — the continental dance record with a chorus welded onto it.
 *
 * Ace of Base, 2 Unlimited, Cascada, the whole eurodance production line and the
 * Swedish writing rooms that grew out of it. It is `hinrg` ten years later with
 * the tempo pushed further and one structural change that matters: the chorus is
 * a *sung* eight bars over the same track the verse ran on, which is why the
 * style's harmony is one four-bar loop and its tables have almost no bridge.
 *
 * `hook: 'earworm'`. This is the only style in the file where that setting is not
 * an exaggeration in any direction — the whole design of a eurodance record is
 * that the four bars come round twenty-eight times.
 */
const europop: Style = {
  id: 'europop',
  label: 'Europop (1994)',
  description:
    'One four-bar loop, a sung chorus welded to it, and no interest whatsoever in going anywhere else.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [128, 144],
  hook: 'earworm',
  modeWeights: { minor: 0.75, major: 0.25 },
  relativeMajorChorus: 0.5,
  progressions: {
    intro: [
      { chords: ['i', 'VI', 'III', 'VII'], weight: 5 },
      { chords: ['i', 'VII', 'VI', 'VII'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'III', 'VII'], weight: 6, note: 'The four chords the whole record is made of — verse and chorus alike, which is the style' },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 5 },
      { chords: ['i', 'iv', 'VI', 'VII', 'i', 'iv', 'VI', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'III', 'VII'], weight: 6 },
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'III', 'VII'], weight: 4 },
      { chords: ['III', 'VII', 'i', 'VI', 'III', 'VII', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'VII', 'VII'], weight: 4 },
    ],
    outro: [
      { chords: ['i', 'VI', 'III', 'VII'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'vi', 'IV'], weight: 6 },
      { chords: ['I', 'IV', 'V', 'V', 'I', 'IV', 'V', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'IV'], weight: 6 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 8], weight: 4 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  bass: [
    { name: 'offbeat-sub', weight: 6, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.9 }, { at: 6, dur: 2, tone: 'root', vel: 0.85 },
      { at: 10, dur: 2, tone: 'root', vel: 0.9 }, { at: 14, dur: 2, tone: 'root', vel: 0.85 },
    ] },
    { name: 'octave-eighths', weight: 4, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 }, { at: 2, dur: 2, tone: 'octave', vel: 0.72 },
      { at: 4, dur: 2, tone: 'root', vel: 0.86 }, { at: 6, dur: 2, tone: 'octave', vel: 0.72 },
      { at: 8, dur: 2, tone: 'root', vel: 0.92 }, { at: 10, dur: 2, tone: 'octave', vel: 0.72 },
      { at: 12, dur: 2, tone: 'root', vel: 0.86 }, { at: 14, dur: 2, tone: 'octave', vel: 0.74 },
    ] },
  ],
  comp: [
    { name: 'stab-offbeats', weight: 6, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.78 }, { at: 6, dur: 2, vel: 0.82 },
      { at: 10, dur: 2, vel: 0.78 }, { at: 14, dur: 2, vel: 0.84 },
    ] },
    { name: 'held-supersaw', weight: 4, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.6 }], sustain: true },
    { name: 'piano-sixteenths', weight: 3, voices: 3, hits: [
      { at: 0, dur: 1, vel: 0.72 }, { at: 2, dur: 1, vel: 0.55 }, { at: 3, dur: 1, vel: 0.62 },
      { at: 6, dur: 1, vel: 0.55 }, { at: 8, dur: 1, vel: 0.72 }, { at: 10, dur: 1, vel: 0.55 },
      { at: 11, dur: 1, vel: 0.62 }, { at: 14, dur: 1, vel: 0.58 },
    ] },
  ],
  drums: [
    { name: 'euro-floor', weight: 6, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], sd: [4, 12], oh: [2, 6, 10, 14], hh: [0, 4, 8, 12],
    } },
    { name: 'floor-and-sixteenths', weight: 4, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      oh: [6, 14],
    } },
  ],
  fills: [['drop', 5], ['snare-roll', 4], ['lead-in', 3], ['tom-roll', 2]],
  melody: { leap: 0.22, ornament: 0.05, span: 10, sequence: 0.72, syncopation: 0.4 },
};

/**
 * TEEN POP — 1999, programmed, and engineered to within an inch of its life.
 *
 * Max Martin's first decade: the Backstreet Boys, Britney Spears, *NSYNC. What
 * is genuinely new here rather than borrowed from `hinrg` or `europop` is the
 * **rhythmic** vocabulary — the sixteenth-note kick pattern with a gap in it,
 * the half-time chorus under a double-time hi-hat, and a bass that is a synth
 * sub rather than an octave figure. The harmony is minor and unmoving; the whole
 * craft is in the placement.
 *
 * `melody.syncopation: 0.7` is the highest in the file and is the actual
 * signature: every phrase in this repertoire starts on the *and* of four and ties
 * over the barline, which is the single thing that separates a 1999 chorus from a
 * 1985 one built on the same three chords.
 */
const teen: Style = {
  id: 'teen',
  label: 'Teen pop (1999)',
  description:
    'Programmed sixteenths, a synth sub, three chords that do not move, and every phrase starting on the and of four.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [92, 112],
  hook: 'earworm',
  modeWeights: { minor: 0.7, major: 0.3 },
  relativeMajorChorus: 0.45,
  progressions: {
    intro: [
      { chords: ['i', 'i', 'VI', 'VII'], weight: 4 },
      { chords: ['i', 'VI', 'III', 'VII'], weight: 4 },
    ],
    verse: [
      { chords: ['i', 'i', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'III', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 6 },
      { chords: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['iv', 'VI', 'VII', 'i', 'iv', 'VI', 'VII', 'VII'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'III', 'III', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
      { chords: ['VI', 'VII', 'i', 'III', 'VI', 'VII', 'VII', 'VII'], weight: 3 },
    ],
    outro: [
      { chords: ['VI', 'VII', 'i', 'i'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'vi', 'IV'], weight: 5 },
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'V'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'I', 'vi', 'IV', 'V', 'I', 'I'], weight: 5 },
    ],
  },
  melodyCells: [
    { cell: [-2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 4, 4, 4], weight: 4 },
    { cell: [3, 1, 4, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 8], weight: 4 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  bass: [
    { name: 'sub-with-gaps', weight: 6, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 6, dur: 2, tone: 'root', vel: 0.78 },
      { at: 8, dur: 3, tone: 'root', vel: 0.92 },
      { at: 14, dur: 2, tone: 'root', vel: 0.78 },
    ] },
    { name: 'sixteenth-sub', weight: 4, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 }, { at: 3, dur: 1, tone: 'root', vel: 0.65 },
      { at: 6, dur: 2, tone: 'root', vel: 0.8 }, { at: 8, dur: 2, tone: 'root', vel: 0.92 },
      { at: 11, dur: 1, tone: 'octave', vel: 0.65 }, { at: 14, dur: 2, tone: 'root', vel: 0.78 },
    ] },
    { name: 'held-sub', weight: 3, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.9 }], sustain: true },
  ],
  comp: [
    { name: 'piano-offbeats', weight: 5, voices: 4, hits: [
      { at: 2, dur: 2, vel: 0.72 }, { at: 6, dur: 2, vel: 0.68 },
      { at: 11, dur: 1, vel: 0.7 }, { at: 14, dur: 2, vel: 0.74 },
    ] },
    { name: 'stab-sixteenths', weight: 4, voices: 3, hits: [
      { at: 0, dur: 1, vel: 0.78 }, { at: 3, dur: 1, vel: 0.58 },
      { at: 6, dur: 1, vel: 0.66 }, { at: 8, dur: 1, vel: 0.74 },
      { at: 11, dur: 1, vel: 0.58 }, { at: 14, dur: 1, vel: 0.66 },
    ] },
    { name: 'held-strings', weight: 3, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.55 }], sustain: true },
  ],
  drums: [
    { name: 'programmed-sixteenths', weight: 6, voices: {
      bd: [0, 6, 8, 14], sd: [4, 12], cp: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    }, ghosts: { sd: [7, 15] } },
    { name: 'half-time-chorus', weight: 4, voices: {
      bd: [0, 10], sd: [8], cp: [8], hh: [0, 2, 4, 6, 8, 10, 12, 14], tb: [4, 12],
    } },
    { name: 'kick-gap', weight: 4, voices: {
      bd: [0, 3, 6, 8, 11], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], sh: [2, 6, 10, 14],
    }, ghosts: { sd: [11, 15] } },
  ],
  fills: [['drop', 5], ['snare-roll', 4], ['lead-in', 3]],
  melody: { leap: 0.22, ornament: 0.06, span: 11, sequence: 0.68, syncopation: 0.7 },
};

/**
 * DANCE POP — four on the floor with everything ducking under the kick.
 *
 * 2010, and the style the era below is named after. Sidechain compression is a
 * mixing technique that became a compositional one: the whole track is pulled
 * down on every kick and released across the beat, so the *pulse* is carried by
 * the pad breathing rather than by anything struck. That is not something this
 * engine can render — `Effects` has no envelope follower — and saying so is
 * better than pretending, which is why the note is in `index.ts` under what the
 * engine cannot express.
 *
 * What this style *can* say is the rest of it: a chorus that is a hook played by
 * a synthesiser rather than sung, a bass that is a held sub, and a `pad`
 * required in every section because the sustained supersaw is the record.
 *
 * **`requireLayers: ['pad']` is the only one in the genre, and it costs
 * something.** A required layer cannot be taken away by `planExits`, so this is
 * the one style whose last chorus never strips. That is the correct trade here —
 * a dance-pop final chorus does not thin out, it adds — but it is a trade and it
 * should be visible.
 */
const dancepop: Style = {
  id: 'dancepop',
  label: 'Dance pop (2010)',
  description:
    'Four on the floor, a held supersaw pad, a sub bass and a chorus played rather than sung. Everything breathes with the kick.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [124, 132],
  hook: 'earworm',
  requireLayers: ['pad'],
  modeWeights: { minor: 0.68, major: 0.32 },
  relativeMajorChorus: 0.45,
  progressions: {
    intro: [
      { chords: ['i', 'VI', 'III', 'VII'], weight: 5 },
      { chords: ['VI', 'VII', 'i', 'i'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'III', 'VII'], weight: 6 },
      { chords: ['i', 'i', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 4 },
      { chords: ['iv', 'VI', 'i', 'VII', 'iv', 'VI', 'i', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 6 },
      { chords: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['VI', 'III', 'VII', 'i', 'VI', 'III', 'VII', 'i'], weight: 4 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'VII', 'VII'], weight: 4 },
      { chords: ['VI', 'VII', 'III', 'III', 'iv', 'iv', 'VII', 'VII'], weight: 3 },
    ],
    outro: [
      { chords: ['i', 'VI', 'III', 'VII'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'vi', 'IV'], weight: 6 },
      { chords: ['IV', 'I', 'V', 'vi', 'IV', 'I', 'V', 'V'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'vi', 'I', 'IV', 'V', 'vi', 'vi'], weight: 5 },
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'IV'], weight: 5 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 4, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 8], weight: 4 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    { name: 'held-sub', weight: 6, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.95 }], sustain: true },
    { name: 'offbeat-sub', weight: 4, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.9 }, { at: 6, dur: 2, tone: 'root', vel: 0.86 },
      { at: 10, dur: 2, tone: 'root', vel: 0.9 }, { at: 14, dur: 2, tone: 'root', vel: 0.86 },
    ] },
    { name: 'quarters', weight: 3, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 }, { at: 4, dur: 3, tone: 'root', vel: 0.82 },
      { at: 8, dur: 3, tone: 'root', vel: 0.92 }, { at: 12, dur: 3, tone: 'root', vel: 0.82 },
    ] },
  ],
  comp: [
    { name: 'supersaw-halves', weight: 6, voices: 4, hits: [
      { at: 0, dur: 8, vel: 0.72 }, { at: 8, dur: 8, vel: 0.68 },
    ] },
    { name: 'pluck-eighths', weight: 4, voices: 3, arpeggio: true, arpDirection: 'updown', hits: [
      { at: 0, dur: 2, vel: 0.7 }, { at: 2, dur: 2, vel: 0.55 },
      { at: 4, dur: 2, vel: 0.66 }, { at: 6, dur: 2, vel: 0.55 },
      { at: 8, dur: 2, vel: 0.7 }, { at: 10, dur: 2, vel: 0.55 },
      { at: 12, dur: 2, vel: 0.66 }, { at: 14, dur: 2, vel: 0.58 },
    ] },
    { name: 'piano-offbeats', weight: 3, voices: 4, hits: [
      { at: 2, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.74 },
      { at: 10, dur: 2, vel: 0.7 }, { at: 14, dur: 2, vel: 0.76 },
    ] },
  ],
  drums: [
    { name: 'four-floor-clap', weight: 6, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], sd: [4, 12], oh: [2, 6, 10, 14], hh: [0, 4, 8, 12],
    } },
    { name: 'floor-and-sixteenths', weight: 4, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      sh: [2, 6, 10, 14],
    } },
    { name: 'floor-with-toms', weight: 3, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], lt: [14], mt: [15], oh: [6, 14],
    } },
  ],
  fills: [['drop', 6], ['snare-roll', 4], ['lead-in', 2]],
  melody: { leap: 0.24, ornament: 0.05, span: 11, sequence: 0.7, syncopation: 0.45 },
};

/**
 * ELECTROPOP — a saw bass with a filter on it, and a singer with a vocoder near
 * them.
 *
 * 2008: Robyn, La Roux, Goldfrapp's dance half, Lady Gaga's first record. It sits
 * beside `dancepop` and differs on one axis, which is *dirt*. Where dance pop is
 * a clean supersaw over a sub, this is a distorted saw playing the bass line as a
 * riff — the bass is a hook rather than a floor, and the tables say so by giving
 * it the only figure in the genre written with literal semitone offsets.
 *
 * That last point is the interesting one. `BassTone` allows a number, taken
 * literally as semitones from the chord root, and its own docstring explains why:
 * *a riff is not an outline*. A `-2` under a minor chord is a flat seventh
 * whatever the chord quality turns out to be, and re-rooting it as `'seventh'`
 * would let the figure change shape when the harmony moves — which is precisely
 * what a riff must not do.
 */
const electropop: Style = {
  id: 'electropop',
  label: 'Electropop (2008)',
  description:
    'A distorted saw bass playing a riff rather than a floor, a filter that opens across the chorus, and a very clean vocal on top.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0,
  bpm: [118, 134],
  modeWeights: { minor: 0.74, major: 0.26 },
  relativeMajorChorus: 0.4,
  filter: { depth: 0.5, shape: 'step' },
  progressions: {
    intro: [
      { chords: ['i', 'i', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'VI', 'VII', 'VII'], weight: 4 },
    ],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'VI', 'VI'], weight: 5, note: 'Four bars of tonic under a bass riff. The riff is the verse and the chords are what it is played against' },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 5 },
      { chords: ['i', 'VI', 'iv', 'VII', 'i', 'VI', 'iv', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 6 },
      { chords: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'VII', 'VII'], weight: 4 },
      { chords: ['iv', 'VI', 'VII', 'i', 'iv', 'VI', 'VII', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['VI', 'VI', 'iv', 'iv', 'VII', 'VII', 'VII', 'VII'], weight: 4 },
    ],
    outro: [
      { chords: ['i', 'VII', 'VI', 'VII'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'V', 'V'], weight: 5 },
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'IV'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'vi', 'I', 'IV', 'V', 'I', 'I'], weight: 5 },
    ],
  },
  melodyCells: [
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 8], weight: 4 },
    { cell: [3, 1, 4, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    /**
     * The riff, written in semitones because it is a *shape*. `-2` is the flat
     * seventh below the root and `3` is the minor third above it, whatever the
     * chord underneath happens to be spelled as — see `BassTone`, whose own note
     * records what happened to a fusion vamp that spelled the same figure with
     * chord functions and watched it change on every bar.
     */
    { name: 'saw-riff', weight: 6, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 }, { at: 2, dur: 1, tone: 0, vel: 0.7 },
      { at: 3, dur: 1, tone: -2, vel: 0.72 }, { at: 4, dur: 2, tone: 3, vel: 0.85 },
      { at: 8, dur: 2, tone: 0, vel: 0.92 }, { at: 10, dur: 1, tone: 0, vel: 0.7 },
      { at: 11, dur: 1, tone: 5, vel: 0.74 }, { at: 12, dur: 2, tone: 3, vel: 0.82 },
      { at: 14, dur: 2, tone: -2, vel: 0.72 },
    ] },
    { name: 'octave-eighths', weight: 4, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 }, { at: 2, dur: 2, tone: 'octave', vel: 0.72 },
      { at: 4, dur: 2, tone: 'root', vel: 0.86 }, { at: 6, dur: 2, tone: 'octave', vel: 0.72 },
      { at: 8, dur: 2, tone: 'root', vel: 0.92 }, { at: 10, dur: 2, tone: 'octave', vel: 0.72 },
      { at: 12, dur: 2, tone: 'root', vel: 0.86 }, { at: 14, dur: 2, tone: 'octave', vel: 0.74 },
    ] },
    { name: 'sixteenth-drive', weight: 3, hits: [
      { at: 0, dur: 1, tone: 'root', vel: 1 }, { at: 1, dur: 1, tone: 'root', vel: 0.62 },
      { at: 2, dur: 1, tone: 'root', vel: 0.72 }, { at: 3, dur: 1, tone: 'root', vel: 0.62 },
      { at: 4, dur: 1, tone: 'root', vel: 0.84 }, { at: 5, dur: 1, tone: 'root', vel: 0.62 },
      { at: 8, dur: 1, tone: 'root', vel: 0.92 }, { at: 9, dur: 1, tone: 'root', vel: 0.62 },
      { at: 10, dur: 1, tone: 'octave', vel: 0.74 }, { at: 12, dur: 2, tone: 'fifth', vel: 0.8 },
      { at: 14, dur: 2, tone: 'root', vel: 0.68 },
    ] },
  ],
  comp: [
    { name: 'saw-stabs', weight: 5, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.8 }, { at: 4, dur: 1, vel: 0.6 },
      { at: 6, dur: 2, vel: 0.72 }, { at: 8, dur: 2, vel: 0.78 },
      { at: 12, dur: 1, vel: 0.6 }, { at: 14, dur: 2, vel: 0.74 },
    ] },
    { name: 'held-poly', weight: 4, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.6 }], sustain: true },
    { name: 'arp-sixteenths', weight: 4, voices: 3, arpeggio: true, arpDirection: 'up', arpOctaves: 2, hits: [
      { at: 0, dur: 1, vel: 0.66 }, { at: 1, dur: 1, vel: 0.5 }, { at: 2, dur: 1, vel: 0.6 },
      { at: 3, dur: 1, vel: 0.5 }, { at: 4, dur: 1, vel: 0.64 }, { at: 5, dur: 1, vel: 0.5 },
      { at: 6, dur: 1, vel: 0.6 }, { at: 7, dur: 1, vel: 0.5 }, { at: 8, dur: 1, vel: 0.66 },
      { at: 9, dur: 1, vel: 0.5 }, { at: 10, dur: 1, vel: 0.6 }, { at: 11, dur: 1, vel: 0.5 },
      { at: 12, dur: 1, vel: 0.64 }, { at: 13, dur: 1, vel: 0.5 }, { at: 14, dur: 1, vel: 0.6 },
      { at: 15, dur: 1, vel: 0.52 },
    ] },
  ],
  drums: [
    { name: 'electro-backbeat', weight: 5, voices: {
      bd: [0, 6, 8], sd: [4, 12], cp: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'four-floor-dirty', weight: 5, voices: {
      bd: [0, 4, 8, 12], sd: [4, 12], cp: [4, 12], oh: [2, 6, 10, 14],
    } },
    { name: 'sixteenth-hats', weight: 3, voices: {
      bd: [0, 6, 8, 14], sd: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    }, ghosts: { sd: [7, 15] } },
  ],
  fills: [['drop', 5], ['snare-roll', 4], ['lead-in', 3], ['tom-roll', 2]],
  melody: { leap: 0.26, ornament: 0.06, span: 11, sequence: 0.66, syncopation: 0.55 },
};

/**
 * INDIE POP — a real band, on purpose, in a decade that had stopped needing one.
 *
 * Belle and Sebastian, Camera Obscura, Vampire Weekend, Alvvays. The style is
 * defined by a *refusal*, which is unusual and worth stating plainly: everything
 * around it in this era is programmed, and this one is four people in a room
 * because that choice had become a statement. `boxDrums: false` is therefore not
 * a period fact — the boxes were everywhere — it is the style's whole content.
 *
 * Musically it is `jangle` twenty years on with the harmony opened up: the tables
 * carry sevenths and a `ii` that goes to `V` where jangle would stay on `IV`,
 * because the writers here had listened to `sunshine` and `chamber` as well as to
 * the guitar records.
 */
const indiepop: Style = {
  id: 'indiepop',
  label: 'Indie pop (2006)',
  description:
    'Four people in a room in a decade that had stopped requiring one: clean guitars, a real kit, and sevenths in the chorus.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.06,
  bpm: [116, 148],
  boxDrums: false,
  hook: 'standard',
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0.2,
  progressions: {
    intro: [
      { chords: ['I', 'V', 'vi', 'IV'], weight: 4 },
      { chords: ['Imaj7', 'IVmaj7', 'ii7', 'V'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'ii7', 'V'], weight: 5 },
      { chords: ['Imaj7', 'iii7', 'IV', 'V', 'Imaj7', 'vi7', 'ii7', 'V'], weight: 4 },
      { chords: ['I', 'IV', 'vi', 'V', 'I', 'IV', 'ii7', 'V'], weight: 4 },
      { chords: ['vi7', 'IV', 'Imaj7', 'V', 'vi7', 'IV', 'ii7', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'iii7', 'vi', 'IV', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'V', 'vi', 'I', 'IV', 'ii7', 'V'], weight: 4 },
      { chords: ['IVmaj7', 'V', 'vi7', 'vi7', 'IVmaj7', 'V', 'I', 'I'], weight: 4 },
    ],
    bridge: [
      { chords: ['vi7', 'ii7', 'V', 'Imaj7', 'IV', 'iv', 'V', 'V'], weight: 4 },
      { chords: ['ii7', 'ii7', 'IV', 'IV', 'V', 'V', 'V', 'V'], weight: 3 },
    ],
    outro: [
      { chords: ['IVmaj7', 'V', 'I', 'I'], weight: 4 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'III', 'VII'], weight: 5 },
      { chords: ['i7', 'III', 'VII', 'iv7', 'i7', 'III', 'VI', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'III', 'VII'], weight: 5 },
      { chords: ['III', 'VII', 'i', 'VI', 'III', 'VII', 'iv', 'VII'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [-2, 2, 2, 4, 4, 2], weight: 4 },
    { cell: [4, 2, 2, 8], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  bass: [
    { name: 'melodic-eighths', weight: 5, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.95 }, { at: 2, dur: 2, tone: 'fifth', vel: 0.66 },
      { at: 4, dur: 2, tone: 'octave', vel: 0.78 }, { at: 6, dur: 2, tone: 'third', vel: 0.66 },
      { at: 8, dur: 2, tone: 'root', vel: 0.88 }, { at: 10, dur: 2, tone: 'fifth', vel: 0.66 },
      { at: 12, dur: 2, tone: 'octave', vel: 0.76 }, { at: 14, dur: 2, tone: 'approach', vel: 0.7 },
    ] },
    { name: 'root-quarters', weight: 4, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 }, { at: 4, dur: 4, tone: 'root', vel: 0.76 },
      { at: 8, dur: 4, tone: 'fifth', vel: 0.86 }, { at: 12, dur: 4, tone: 'root', vel: 0.76 },
    ] },
    { name: 'eighth-drive', weight: 3, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 }, { at: 2, dur: 2, tone: 'root', vel: 0.68 },
      { at: 4, dur: 2, tone: 'root', vel: 0.84 }, { at: 6, dur: 2, tone: 'root', vel: 0.68 },
      { at: 8, dur: 2, tone: 'root', vel: 0.9 }, { at: 10, dur: 2, tone: 'root', vel: 0.68 },
      { at: 12, dur: 2, tone: 'fifth', vel: 0.8 }, { at: 14, dur: 2, tone: 'approach', vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'clean-arpeggio', weight: 5, voices: 4, arpeggio: true, arpDirection: 'updown', hits: [
      { at: 0, dur: 1, vel: 0.7 }, { at: 2, dur: 1, vel: 0.55 },
      { at: 4, dur: 1, vel: 0.65 }, { at: 6, dur: 1, vel: 0.55 },
      { at: 8, dur: 1, vel: 0.7 }, { at: 10, dur: 1, vel: 0.55 },
      { at: 12, dur: 1, vel: 0.65 }, { at: 14, dur: 1, vel: 0.58 },
    ] },
    { name: 'offbeat-organ', weight: 4, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.66 }, { at: 6, dur: 2, vel: 0.72 },
      { at: 10, dur: 2, vel: 0.66 }, { at: 14, dur: 2, vel: 0.74 },
    ] },
    { name: 'strummed-eighths', weight: 4, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.8 }, { at: 2, dur: 2, vel: 0.55 },
      { at: 4, dur: 2, vel: 0.72 }, { at: 6, dur: 2, vel: 0.55 },
      { at: 8, dur: 2, vel: 0.76 }, { at: 10, dur: 2, vel: 0.55 },
      { at: 12, dur: 2, vel: 0.72 }, { at: 14, dur: 2, vel: 0.58 },
    ] },
  ],
  drums: [
    { name: 'close-backbeat', weight: 5, voices: {
      bd: [0, 8], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sd: [3, 7, 11, 15] } },
    { name: 'floor-tom-and-tambourine', weight: 4, voices: {
      bd: [0, 8], lt: [0, 4, 8, 12], sd: [4, 12], tb: [2, 6, 10, 14],
    } },
    { name: 'ride-and-rim', weight: 3, voices: {
      bd: [0, 6, 8], rim: [4, 12], rd: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sd: [7, 15] } },
  ],
  melody: { leap: 0.28, ornament: 0.14, span: 12, sequence: 0.52, syncopation: 0.5 },
};

/**
 * TROPICAL — the drop is a pluck, and nobody sings over it.
 *
 * 2016, and the newest thing here: Kygo, Robin Schulz, the Bieber records of that
 * year, half of Diplo's catalogue. It is the point at which the chorus stopped
 * being sung and became a *marimba figure*, which is a genuinely strange
 * structural fact and the reason this style is in the file at all — every other
 * style here has a tune with words on it, and this one has a hook nobody can
 * sing because it was never meant to be sung.
 *
 * Structurally that means the melody layer carries the drop rather than the
 * verse, and the tables express it the only way they can: `melody.span` is wide,
 * `melody.sequence` is very high, and the cadence cells are short — a plucked
 * figure has no held notes in it because the instrument cannot hold one.
 *
 * `swing: 0.18` is the other half. The whole rhythmic identity of this style is a
 * dotted, half-swung sixteenth grid borrowed from dancehall, and a straight
 * version of it is a house record.
 */
const tropical: Style = {
  id: 'tropical',
  label: 'Tropical (2016)',
  description:
    'A half-swung sixteenth grid, an offbeat pluck, and a chorus that is a marimba figure rather than a sung line.',
  beatsPerBar: 4,
  beatUnit: 4,
  swing: 0.18,
  bpm: [98, 116],
  hook: 'earworm',
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0.35,
  progressions: {
    intro: [
      { chords: ['I', 'V', 'vi', 'IV'], weight: 4 },
      { chords: ['vi', 'IV', 'I', 'V'], weight: 4 },
    ],
    verse: [
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'V'], weight: 6 },
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'vi', 'IV'], weight: 5 },
      { chords: ['IV', 'I', 'V', 'vi', 'IV', 'I', 'V', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'V'], weight: 6, note: 'The drop is the same four chords the verse ran on; what changes is that the pluck arrives' },
      { chords: ['IV', 'V', 'vi', 'I', 'IV', 'V', 'vi', 'vi'], weight: 4 },
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'IV'], weight: 4 },
    ],
    bridge: [
      { chords: ['IV', 'IV', 'vi', 'vi', 'V', 'V', 'V', 'V'], weight: 4 },
    ],
    outro: [
      { chords: ['vi', 'IV', 'I', 'V'], weight: 4 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'III', 'VII'], weight: 6 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'VII', 'VII'], weight: 6 },
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'III', 'VII'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [3, 1, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 2, 2, 4], weight: 4 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 2, 2, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [4, 4, 8], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [16], weight: 2 },
  ],
  bass: [
    { name: 'offbeat-sub', weight: 6, hits: [
      { at: 2, dur: 2, tone: 'root', vel: 0.92 }, { at: 6, dur: 2, tone: 'root', vel: 0.86 },
      { at: 10, dur: 2, tone: 'root', vel: 0.92 }, { at: 14, dur: 2, tone: 'root', vel: 0.86 },
    ] },
    { name: 'dancehall-sub', weight: 5, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 6, dur: 2, tone: 'root', vel: 0.8 },
      { at: 10, dur: 2, tone: 'fifth', vel: 0.8 },
      { at: 14, dur: 2, tone: 'root', vel: 0.82 },
    ] },
    { name: 'held-sub', weight: 3, hits: [{ at: 0, dur: 16, tone: 'root', vel: 0.9 }], sustain: true },
  ],
  comp: [
    { name: 'pluck-offbeats', weight: 6, voices: 3, arpeggio: true, arpDirection: 'updown', hits: [
      { at: 2, dur: 1, vel: 0.75 }, { at: 3, dur: 1, vel: 0.55 },
      { at: 6, dur: 1, vel: 0.78 }, { at: 7, dur: 1, vel: 0.55 },
      { at: 10, dur: 1, vel: 0.75 }, { at: 11, dur: 1, vel: 0.55 },
      { at: 14, dur: 1, vel: 0.78 }, { at: 15, dur: 1, vel: 0.58 },
    ] },
    { name: 'marimba-sixteenths', weight: 5, voices: 3, arpeggio: true, arpDirection: 'up', arpOctaves: 2, hits: [
      { at: 0, dur: 1, vel: 0.7 }, { at: 2, dur: 1, vel: 0.55 }, { at: 3, dur: 1, vel: 0.62 },
      { at: 6, dur: 1, vel: 0.55 }, { at: 8, dur: 1, vel: 0.7 }, { at: 10, dur: 1, vel: 0.55 },
      { at: 11, dur: 1, vel: 0.62 }, { at: 14, dur: 1, vel: 0.58 },
    ] },
    { name: 'held-pad', weight: 3, voices: 4, hits: [{ at: 0, dur: 16, vel: 0.5 }], sustain: true },
  ],
  drums: [
    { name: 'tropical-kick', weight: 6, voices: {
      bd: [0, 6, 8, 14], sd: [8], cp: [8], sh: [0, 2, 4, 6, 8, 10, 12, 14], tb: [4, 12],
    } },
    { name: 'four-floor-shaker', weight: 4, voices: {
      bd: [0, 4, 8, 12], cp: [4, 12], sh: [2, 6, 10, 14], oh: [6, 14],
    } },
    { name: 'dancehall', weight: 4, voices: {
      bd: [0, 6, 10], sd: [4, 12], rim: [4, 12], sh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, ghosts: { sd: [7, 15] } },
  ],
  fills: [['drop', 6], ['lead-in', 3], ['snare-roll', 2]],
  melody: { leap: 0.3, ornament: 0.05, span: 14, sequence: 0.76, syncopation: 0.6 },
};

/**
 * The catalogue, in the order the eras run.
 *
 * Twenty-four, six per era, and the count is not a coincidence: the era tables in
 * `eras.ts` weight all twenty-four in every decade, so a style is *never* absent,
 * only unlikely. That is a deliberate difference from `synth`, where the palettes
 * barely overlap and the styles genuinely could not have existed outside their
 * decade. A ballad can be recorded in any of these four years and always was.
 */
export const STYLES: Record<string, Style> = Object.fromEntries(
  [
    girlgroup, merseybeat, brill, bubblegum, baroque, sunshine,
    softrock, ballad, torch, discopop, powerpop, chamber,
    synthpop, newromantic, stadium, jangle, hinrg, dreampop,
    europop, teen, dancepop, electropop, indiepop, tropical,
  ].map((s) => [s.id, s]),
);
