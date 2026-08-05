/**
 * The Jamaican catalogue, 1958–1990.
 *
 * Organised by *where beat one is*, because in this repertoire that is the only
 * question, and every other difference between two styles here is downstream of
 * the answer. A ska bar puts the accent on two and four and shuffles between
 * them; a rocksteady bar takes the shuffle out and moves the drum to three; a one
 * drop empties the downbeat altogether and lets the bass decide when the bar
 * began; a steppers bar puts a kick on all four and dares you to notice. Sort
 * this music by tempo and you get one long slowdown followed by one long speed-up.
 * Sort it by which beat the band refuses to play on and the twenty-one below stay
 * twenty-one.
 *
 * ## Three figures are the genre, so they are declared once
 *
 * Every other style table in this project writes its patterns out per style,
 * and that is right where the patterns *are* the style — a humppa oom-pah and a
 * tango's dragged two are two different bands. Here three figures run through
 * the whole catalogue unchanged, and writing them out twenty-one times would say
 * the opposite of what is true: that the one drop is a thing `onedrop` happens to
 * do, rather than the thing the genre is.
 *
 *  - **The skank.** A chord on the offbeats and nothing on the downbeat. Slots
 *    2, 6, 10 and 14 of a sixteen-slot bar — the "and" of every beat — and slot 0
 *    is empty in every comp pattern in this file. That is not a stylistic
 *    tendency, it is a hard property of the table, and it is the one thing that
 *    would be most obviously broken by somebody tidying up.
 *  - **The one drop.** Kick and cross-stick together on beat *three*, slot 8,
 *    and no kick on slot 0. A one drop with a kick on the downbeat is not a
 *    quieter one drop, it is a rock beat, and it is the single easiest thing in
 *    this genre to get wrong by accident.
 *  - **The bass is the lead.** It plays a written figure with rests in it, it
 *    frequently does not start until after the downbeat, and its notes are
 *    spelled as **numbers** — semitones from the chord root, taken literally —
 *    wherever the figure is a shape rather than an outline. See `BassTone`: the
 *    named functions re-negotiate with each chord, which is what a walking line
 *    wants and the opposite of what a riff wants. "Real Rock" is the same four
 *    notes over every chord it meets, and that is why anybody recognises it.
 *
 * The factories below build those three, and a style that wants a different
 * weight for one asks for a different weight. A style that plays something *else*
 * writes it out, which is then legible as the claim it is.
 *
 * ## What is uniform across the file, and why each is a decision
 *
 *  - **`relativeMajorChorus: 0` everywhere.** The lift from i to III is a
 *    dance-band arranger's gesture and this music has no arranger in that sense:
 *    a riddim is a fixed two- or four-bar loop that thirty different songs are
 *    voiced over, and a riddim that changed key in the chorus could only ever
 *    carry one of them.
 *  - **No `vary`.** The rhythm section does not play its figure differently at
 *    the end of a phrase. Every other genre here has at least the option; this
 *    one refuses it outright, because the skank and the one drop are what the
 *    dancer is counting from and a guitarist who started decorating them would
 *    be taking the floor away. The drummer's fill at a section end is the whole
 *    of the permitted variation, and several styles below take even that away.
 *  - **`syncopation` is high, 0.5 to 0.75.** The tune is written against a bar
 *    whose strong beat is missing, so a melody that stayed inside its own bar
 *    would be agreeing with a downbeat nobody is playing.
 *  - **Nothing swings after 1966.** `swing: 0` on everything from `rocksteady`
 *    onward, and that is the actual historical event: rocksteady is ska with the
 *    shuffle taken out, and taking it out is what let the bass become the tune.
 *    The three styles that predate it — `mento`, `shuffle`, `ska` — carry real
 *    swing and set `boxDrums: false` for it, because a shuffle whose character is
 *    the gap between the two hands cannot be expressed as a low weight on a
 *    preset box.
 *  - **No `ghosts`, on any of the 59 kit patterns in this file**, and it is the
 *    absence that took the most arguing. `DrumPattern.ghosts` is the right field
 *    for a boom-bap kit and the wrong one for this genre, because the figure
 *    here is made of what is *not* struck — a ghost row on a one drop puts
 *    strokes into precisely the hole the beat is named after. And it could not
 *    be scoped away from that hole: `oneDrop` and `oneDropOpen` are shared
 *    factories that **10 of the 21 styles draw**, and they are 77% of
 *    `rocksteady`'s kit draw and 79% of `onedrop`'s, `roots`'s and `dub`'s, so
 *    ghosting the two records everybody actually means would ghost eight other
 *    styles with them. The two candidates that own their patterns outright fail
 *    on their own tables' arguments: `rubadub` calls itself "the sparsest
 *    live-band texture in the genre" and would be arguing with itself, and the
 *    three swung styles have their soft middle stroke as a *triplet*, which a
 *    sixteenth grid cannot write — the same reason those three set
 *    `boxDrums: false`. Two facts worth having beside that, both measured: the
 *    backbeat is `rim` on 32 of the 59 patterns and `sd` on 20, and the drawn
 *    ghosting pass in `applyFeel` only ever touches `sd`; and this genre names
 *    **no `feels` at all**, so `Feel.ghost` fires zero times in it — 0 feels
 *    over 420 songs. Nothing is being composed with here and nothing was lost.
 */

import type { BassPattern, CompPattern, DrumPattern, Style } from '../../style/types.js';
import { makeScale } from '../../core/scale.js';

// ---------------------------------------------------------------------------
// The three figures
// ---------------------------------------------------------------------------

/**
 * The skank: four chords on the four offbeats, and silence on the downbeat.
 *
 * Slots 2, 6, 10, 14. A sixteenth long, which is shorter than it looks written
 * down and is the whole articulation — the guitarist's fretting hand relaxes the
 * instant the pick crosses the strings, so what sounds is a chord and its own
 * damping, roughly 80 ms of it at a roots tempo. Held for an eighth instead it
 * stops being a chop and becomes an organ, which is why `bubble` and the
 * rocksteady half-chop below ask for their own lengths rather than borrowing
 * this one.
 *
 * The velocities are not decoration. A skank played dead flat reads as a machine
 * even when a person is playing it; the offbeats of one and three are marginally
 * heavier than the offbeats of two and four, which is what a hand does and what
 * makes a bar of this have a shape at all.
 */
const skank = (weight: number, voices = 3): CompPattern => ({
  name: 'skank', weight, voices,
  hits: [
    { at: 2, dur: 1, vel: 0.88 },
    { at: 6, dur: 1, vel: 0.8 },
    { at: 10, dur: 1, vel: 0.9 },
    { at: 14, dur: 1, vel: 0.8 },
  ],
});

/**
 * The double skank: two sixteenths on each offbeat instead of one.
 *
 * The rockers-era chop, and it is a different instrument's part rather than a
 * busier version of the same one — the first of each pair is the down-stroke and
 * the second is the up-stroke coming back, so it is played at half the effort and
 * twice the rate. Everything still lands after the beat and nothing lands on it.
 */
const doubleSkank = (weight: number, voices = 3): CompPattern => ({
  name: 'double-skank', weight, voices,
  hits: [
    { at: 2, dur: 1, vel: 0.9 }, { at: 3, dur: 1, vel: 0.62 },
    { at: 6, dur: 1, vel: 0.82 }, { at: 7, dur: 1, vel: 0.58 },
    { at: 10, dur: 1, vel: 0.92 }, { at: 11, dur: 1, vel: 0.62 },
    { at: 14, dur: 1, vel: 0.82 }, { at: 15, dur: 1, vel: 0.58 },
  ],
});

/**
 * The bubble: the same idea at sixteenth resolution, with a different pair of
 * hands making it.
 *
 * An organ bubble is not a busy skank. It is two hands alternating — the left
 * lands on the offbeat eighth and the right answers on the sixteenth after it —
 * so the accent falls on the *second* of each pair, which is the reverse of the
 * double skank above and is audible immediately. Written flat it sounds like a
 * sixteenth-note pad; written this way it wheezes, and the wheeze is the sound of
 * a Hammond in a Kingston studio in 1972.
 *
 * Still nothing on slot 0, and this is the one figure where that restraint costs
 * something: a keyboard player has both hands free and every instinct says to put
 * a chord on the one. The bubble is defined by not doing it.
 */
const bubble = (weight: number): CompPattern => ({
  name: 'bubble', weight, voices: 3,
  hits: [
    { at: 2, dur: 1, vel: 0.5 }, { at: 3, dur: 1, vel: 0.92 },
    { at: 6, dur: 1, vel: 0.46 }, { at: 7, dur: 1, vel: 0.84 },
    { at: 10, dur: 1, vel: 0.52 }, { at: 11, dur: 1, vel: 0.94 },
    { at: 14, dur: 1, vel: 0.46 }, { at: 15, dur: 1, vel: 0.84 },
  ],
});

/**
 * The half chop: the offbeats of two and four only, held for an eighth.
 *
 * Rocksteady and lovers rock. Half the events and twice the length, which is what
 * a band does when it slows down and refuses to fill the space it has just made —
 * the whole point of rocksteady is that the room the shuffle used to occupy is
 * given to the bass instead.
 */
const halfChop = (weight: number, voices = 3): CompPattern => ({
  name: 'half-chop', weight, voices,
  hits: [
    { at: 6, dur: 2, vel: 0.86 },
    { at: 14, dur: 2, vel: 0.82 },
  ],
});

/**
 * The one drop.
 *
 * Kick and cross-stick struck together on beat three — slot 8 — and slot 0 left
 * completely alone. The hat keeps eighths over the top, which is the only thing
 * in the bar telling you where you are.
 *
 * `rim` rather than `sd`, and it is not a shade of the same thing. A cross-stick
 * is the stick laid across the head and struck on its shaft: a short woody knock
 * with no snare rattle behind it, roughly 15 dB quieter than a rim shot, and it is
 * *the* backbeat sound of rocksteady and of everything descended from it. A genre
 * that only ever hits `sd` has recorded a different decade. Every bank the era
 * tables name carries a cross-stick of its own for exactly this reason, and the
 * one era that does not is the one where the sound genuinely stops — see
 * `eras.ts`.
 */
const oneDrop = (weight: number): DrumPattern => ({
  name: 'one-drop', weight,
  voices: {
    bd: [8],
    rim: [8],
    hh: [0, 2, 4, 6, 8, 10, 12, 14],
  },
});

/**
 * The same, with the hat on the offbeats only.
 *
 * A hat that plays with the skank rather than under it. The bar now has *nothing*
 * on beat one — no kick, no snare, no cymbal — which is as far as this music goes
 * and further than most of it goes, and the effect is that the downbeat is
 * located entirely by the bass. That is the correct texture for a slow number and
 * the wrong one for anything that has to keep a floor moving, which is why both
 * exist and the styles choose.
 */
const oneDropOpen = (weight: number): DrumPattern => ({
  name: 'one-drop-open', weight,
  voices: {
    bd: [8],
    rim: [8],
    hh: [2, 6, 10, 14],
  },
});

/**
 * A bass figure that begins after the downbeat.
 *
 * Not a variant of a figure that begins on it. A reggae bass line is a *tune*
 * with rests written into it, and the commonest of those rests is the first one:
 * the drummer has left beat one empty, the guitarist has left beat one empty, and
 * the bass comes in on the second sixteenth of the bar and tells you retroactively
 * where the bar started. Nothing else in this project's bass tables does that —
 * every other genre puts a root on the downbeat because that is the job — so it is
 * written here once as the genre's default shape and varied per style.
 *
 * The tones are numbers because the figure is a shape. `-2` is the flat seventh
 * below the root under a minor chord and under a major one alike, which is what a
 * riff means; asking for `seventh` would give +10 under one quality and +11 under
 * another and the shape would move.
 */
const afterTheOne = (weight: number): BassPattern => ({
  name: 'after-the-one', weight,
  hits: [
    { at: 2, dur: 2, tone: 0, vel: 0.98 },
    { at: 6, dur: 2, tone: 7, vel: 0.84 },
    { at: 10, dur: 2, tone: 0, vel: 0.92 },
    { at: 14, dur: 2, tone: -2, vel: 0.8 },
  ],
});

/**
 * The offbeat tutti.
 *
 * `Style.shots` derives from `groups` and `metricStrength` when a style says
 * nothing, and the derivation is exactly right in an asymmetric metre and exactly
 * wrong here: it produces the group heads, which in 4/4 are slots 0, 4, 8, 12 —
 * the four beats this entire genre is organised around not playing. A band
 * catching a figure together at a section join catches it *off* the beat, and the
 * commonest one is a single hit on the last offbeat of the bar, the "and of four",
 * with the next section arriving in the hole behind it.
 *
 * Shared rather than repeated because it is a fact about the idiom, not about any
 * one style, and because a table this short would otherwise be copied twenty-one
 * times and drift in three of them.
 */
const OFFBEAT_SHOTS: (readonly [number[], number])[] = [
  [[14], 4],
  [[10, 14], 3],
  [[2, 6, 10, 14], 3],
  [[6, 10, 14], 2],
];

// ---------------------------------------------------------------------------
// Before the beat turned over: 1958–1966
// ---------------------------------------------------------------------------

/**
 * MENTO — the Jamaican country music, and the only style here older than the
 * offbeat.
 *
 * Banjo, hand drum, maracas and a rhumba box — a plywood cabinet with three tuned
 * metal tongues, sat on and plucked, which is the bass. It is not reggae and it is
 * not calypso, whatever the sleeves of the tourist records said, and it is in the
 * catalogue for one reason: the after-beat is already here. The banjo strums on
 * two and four thirty years before anybody moved it to the offbeat eighths, and
 * every subsequent style in this file is that displacement carried one step
 * further. Leaving it out would make the skank look like an invention rather than
 * an inheritance.
 *
 * The rhumba box plays a *slow* line — three tongues, plucked with the thumbs,
 * one note at a time — so the bass here is the sparsest in the genre and the only
 * one that stays near the root. `boxDrums: false`: this is a person with their
 * hands on a skin and a shaker in the other, and no preset button anywhere ever
 * produced it.
 */
const mento: Style = {
  id: 'mento',
  label: 'Mento',
  description:
    'Banjo on the after-beat, hand drum and shaker, and a rhumba box plucked with the thumbs for a bass. The Jamaican country music the offbeat came out of.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [96, 124],
  swing: 0.14,
  modeWeights: { minor: 0.15, major: 0.85 },
  relativeMajorChorus: 0,
  boxDrums: false,
  excludeLayers: ['pad'],
  shots: OFFBEAT_SHOTS,
  progressions: {
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 5, note: 'Three chords and a banjo. Mento harmony is the harmony of a country dance anywhere in the world, and the Jamaican part of it is entirely in the rhythm' },
      { chords: ['I', 'IV', 'I', 'V', 'I', 'IV', 'V', 'I'], weight: 4 },
      { chords: ['I', 'I', 'V', 'V', 'I', 'I', 'IV', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'V', 'I', 'I', 'IV', 'V', 'I'], weight: 4 },
      { chords: ['V', 'V', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 2 },
    ],
    outro: [
      { chords: ['V', 'V', 'I', 'I'], weight: 4 },
      { chords: ['IV', 'V', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [-4, 4, 8], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [6, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [-4, 12], weight: 2 },
  ],
  /**
   * The rhumba box, which has three notes on it and no way to hurry.
   *
   * Named functions rather than numbers here, and it is the one place in the
   * genre where that is the right spelling: the player is outlining the chord
   * they can hear the banjo playing, on an instrument with a tongue tuned to the
   * root and one tuned to the fifth. There is no shape to preserve.
   */
  bass: [
    { name: 'thumb-box', weight: 6, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 0.95 },
      { at: 8, dur: 4, tone: 'fifth', vel: 0.82 },
    ] },
    { name: 'thumb-box-walk', weight: 3, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 0.95 },
      { at: 8, dur: 2, tone: 'fifth', vel: 0.8 },
      { at: 12, dur: 4, tone: 'octave', vel: 0.78 },
    ] },
  ],
  /**
   * On two and four, held. Thirty years and one displacement short of a skank —
   * and the reason this style is in the file.
   */
  comp: [
    { name: 'after-beat', weight: 6, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.9 },
      { at: 12, dur: 3, vel: 0.86 },
    ] },
    { name: 'after-beat-double', weight: 3, voices: 3, hits: [
      { at: 4, dur: 2, vel: 0.9 }, { at: 6, dur: 2, vel: 0.6 },
      { at: 12, dur: 2, vel: 0.86 }, { at: 14, dur: 2, vel: 0.6 },
    ] },
  ],
  /**
   * Hands and a shaker. `lp`/`mp`/`hp` rather than a kit, because there is no
   * kit — a mento band has one drum, and the three strokes on it are what the
   * hand-drum voices exist for.
   */
  drums: [
    { name: 'mento-hands', weight: 6, voices: {
      lp: [0, 8],
      hp: [4, 6, 12, 14],
      sh: [2, 6, 10, 14],
    } },
    { name: 'mento-hands-busy', weight: 3, voices: {
      lp: [0, 6, 8],
      mp: [4, 12],
      hp: [2, 10, 14],
      sh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  melody: { leap: 0.28, ornament: 0.3, span: 12, sequence: 0.4, syncopation: 0.4 },
};

/**
 * SHUFFLE — Jamaican boogie, 1958–62, and the thing ska was a mistake about.
 *
 * Kingston sound systems played American rhythm and blues, and when the supply of
 * new records dried up the local bands were hired to make more of it. What they
 * made is a New Orleans shuffle with the piano's triplet figure creeping later and
 * later in the bar until it fell off the back of the beat entirely, at which point
 * somebody noticed it sounded better there. That is the whole origin story of the
 * offbeat and it happened inside this style.
 *
 * So this one is written straight: a walking bass, a shuffled kit, a piano triplet
 * on the beat, and horns. The only thing marking it as Jamaican rather than as a
 * Fats Domino side is the comp, which has already slid to the offbeat and stayed
 * there. `boxDrums: false` — the swing is the subject.
 */
const shuffle: Style = {
  id: 'shuffle',
  label: 'Jamaican boogie',
  description:
    'A New Orleans shuffle made in Kingston: walking bass, swung kit, horns, and a piano figure that has already slipped onto the offbeat and stayed.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [128, 156],
  swing: 0.28,
  modeWeights: { minor: 0.25, major: 0.75 },
  relativeMajorChorus: 0,
  boxDrums: false,
  shots: OFFBEAT_SHOTS,
  progressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 5, note: 'The first eight of a twelve-bar, which is what half of these records are' },
      { chords: ['I', 'IV', 'I', 'I', 'IV', 'IV', 'I', 'V'], weight: 4 },
      { chords: ['I', 'I', 'vi', 'vi', 'IV', 'IV', 'V', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['V', 'V', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 5, note: 'The turnaround, and the one place this style admits a real dominant — 1960 in Kingston is still listening to New Orleans' },
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'IV', 'V', 'V', 'I', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['V', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'I', 'I'], weight: 2 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'v', 'v'], weight: 3, note: 'A minor five where the boogie would put a major one. The Jamaican half of the record, arriving in the harmony rather than in the rhythm' },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [-2, 6, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [-4, 12], weight: 3 },
  ],
  /**
   * It walks, and it is the last style in the file that does.
   *
   * The whole subsequent history of this music is the bass declining to do this —
   * quarter notes connecting one root to the next is a job, and by 1967 the bass
   * has stopped taking jobs and started writing tunes. Stating it here is what
   * makes that legible as an event.
   */
  bass: [
    { name: 'walking', weight: 6, walking: true, hits: [
      { at: 0, dur: 4, tone: 'root' },
      { at: 4, dur: 4, tone: 'third' },
      { at: 8, dur: 4, tone: 'fifth' },
      { at: 12, dur: 4, tone: 'approach' },
    ] },
    { name: 'boogie-eighths', weight: 3, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 0.95 },
      { at: 4, dur: 2, tone: 'fifth', vel: 0.82 },
      { at: 8, dur: 2, tone: 'octave', vel: 0.9 },
      { at: 12, dur: 2, tone: 'fifth', vel: 0.82 },
    ] },
  ],
  comp: [skank(6, 4), doubleSkank(3, 4)],
  drums: [
    { name: 'shuffle-kit', weight: 6, voices: {
      bd: [0, 8],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'shuffle-ride', weight: 3, voices: {
      bd: [0, 8, 14],
      sd: [4, 12],
      rd: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  melody: { leap: 0.32, ornament: 0.25, span: 14, sequence: 0.35, syncopation: 0.45 },
};

/**
 * SKA — 1962–66, and the loudest music in the file.
 *
 * Fast, shuffled, and fronted by a horn section that came out of the Alpha Boys
 * School with a jazz education and nothing to play it on. This is the one style
 * here where the horns are *soloists* rather than a section: Don Drummond's
 * trombone takes a whole chorus and nobody accompanies it politely. Everywhere
 * else in this genre a horn is three horns playing a written figure.
 *
 * The bass still walks, which by 1967 it will have stopped doing. The chop is on
 * all four offbeats and it is played by a piano and a guitar together, which is
 * why the comp asks for four voices rather than three — two instruments doubling
 * one figure is what makes the ska after-beat as loud as the horns.
 *
 * `boxDrums: false`, and this is the clearest case for the field in the project.
 * The character of a ska bar is the distance between the hi-hat's two hands at a
 * tempo where that distance is about 60 ms; a preset box quantises it away and
 * what comes back is not a plainer ska, it is a fast rock beat.
 */
const ska: Style = {
  id: 'ska',
  label: 'Ska',
  description:
    'Fast and shuffled, with the after-beat on all four offbeats played by piano and guitar together, a walking bass, and a horn section out front taking real solos.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [140, 172],
  swing: 0.2,
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0,
  boxDrums: false,
  shots: OFFBEAT_SHOTS,
  progressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'vi', 'vi', 'ii', 'ii', 'V', 'V'], weight: 4, note: 'The one corner of this genre with a real ii–V in it, and it is here because the men playing it had been taught to read' },
      { chords: ['I', 'IV', 'I', 'IV', 'I', 'IV', 'V', 'V'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'IV', 'IV', 'V', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 3 },
    ],
    bridge: [
      { chords: ['IV', 'IV', 'iv', 'iv', 'I', 'I', 'V', 'V'], weight: 3 },
      { chords: ['ii', 'ii', 'V', 'V', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['V', 'V', 'I', 'I'], weight: 4 },
      { chords: ['IV', 'V', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5, note: 'The minor ska instrumental — "Eastern Standard Time", every ska record with a title about somewhere far away' },
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    bridge: [
      { chords: ['III', 'III', 'VII', 'VII', 'iv', 'iv', 'i', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [-2, 2, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 3 },
    { cell: [-4, 12], weight: 2 },
  ],
  bass: [
    { name: 'walking', weight: 6, walking: true, hits: [
      { at: 0, dur: 4, tone: 'root' },
      { at: 4, dur: 4, tone: 'third' },
      { at: 8, dur: 4, tone: 'fifth' },
      { at: 12, dur: 4, tone: 'approach' },
    ] },
    /**
     * The other ska bass, and the one the genre keeps: two notes a bar, an
     * octave apart, with the second landing on three. It is already a *figure*
     * rather than a line, and everything after 1966 is this getting longer.
     */
    { name: 'octave-two', weight: 4, hits: [
      { at: 0, dur: 6, tone: 0, vel: 0.98 },
      { at: 8, dur: 6, tone: 12, vel: 0.86 },
    ] },
  ],
  comp: [skank(7, 4), doubleSkank(3, 4)],
  drums: [
    { name: 'ska-two-four', weight: 6, voices: {
      bd: [4, 12],
      sd: [12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'ska-backbeat', weight: 4, voices: {
      bd: [0, 4, 8, 12],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'ska-rim', weight: 2, voices: {
      bd: [4, 12],
      rim: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  melody: { leap: 0.4, ornament: 0.28, span: 16, sequence: 0.45, syncopation: 0.5 },
};

// ---------------------------------------------------------------------------
// The beat turns over: 1966–1970
// ---------------------------------------------------------------------------

/**
 * ROCKSTEADY — 1966–68, eighteen months, and the hinge the whole genre turns on.
 *
 * Two things happen at once and they are the same thing. The tempo drops by
 * thirty beats a minute and the shuffle goes; and in the space that opens up, the
 * bass stops keeping time and starts playing a tune. Everything in this file after
 * this point is downstream of that swap.
 *
 * The drum moves to three and becomes a cross-stick. The horn section, which was
 * the front line of a ska record, moves behind the singer and becomes an
 * arrangement. The organ arrives. There is no style in this catalogue with a
 * shorter working life or a longer shadow.
 *
 * Its bass figures are written out rather than borrowed, because this is where
 * they were invented and a style that inherited them would be getting the history
 * backwards.
 */
const rocksteady: Style = {
  id: 'rocksteady',
  label: 'Rocksteady',
  description:
    'Ska with the shuffle taken out and thirty beats knocked off it: cross-stick on three, a half-time chop, and a bass that has stopped keeping time and started playing the tune.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [72, 92],
  swing: 0,
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0,
  shots: OFFBEAT_SHOTS,
  progressions: {
    verse: [
      { chords: ['I', 'I', 'vi', 'vi', 'IV', 'IV', 'V', 'V'], weight: 5, note: 'The rocksteady changes, which are American soul changes played at half speed by a band that is not in a hurry' },
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 4 },
      { chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'IV', 'V'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'IV', 'IV', 'V', 'V'], weight: 5 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'V', 'I'], weight: 4 },
      { chords: ['I', 'I', 'iii', 'iii', 'IV', 'IV', 'V', 'V'], weight: 3 },
    ],
    bridge: [
      { chords: ['IV', 'IV', 'iv', 'iv', 'I', 'I', 'I', 'I'], weight: 3, note: 'The borrowed minor four. Rocksteady is the one era of this music sentimental enough to use it' },
      { chords: ['ii', 'ii', 'V', 'V', 'I', 'I', 'vi', 'vi'], weight: 3 },
    ],
    outro: [
      { chords: ['IV', 'V', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'I', 'I'], weight: 2 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'v', 'v'], weight: 5, note: 'A *minor* five, and this is the first place in the file it is load-bearing. A major V here would raise the seventh, and the seventh in this music does not raise' },
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'VII', 'VII', 'III', 'III', 'VI', 'VI'], weight: 3 },
    ],
    bridge: [
      { chords: ['III', 'III', 'VI', 'VI', 'iv', 'iv', 'i', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [-4, 4, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-2, 6, 8], weight: 4 },
    { cell: [16], weight: 3 },
    { cell: [-6, 2, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 4 },
    { cell: [-8, 8], weight: 3 },
  ],
  /**
   * Three tunes, and none of them is a bass part in the sense any other genre in
   * this repo means it.
   *
   * All three are numeric shapes. That is the whole content of rocksteady: the
   * figure is the same four intervals over whichever chord arrives, and the ear
   * hears the harmony move *underneath a line that did not*, which is a specific
   * pleasure and is unavailable to a bass spelled in chord functions.
   */
  bass: [
    { name: 'rocksteady-riff', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 3, vel: 0.82 },
      { at: 8, dur: 2, tone: 7, vel: 0.9 },
      { at: 12, dur: 3, tone: -2, vel: 0.84 },
    ] },
    { name: 'drop-and-climb', weight: 5, hits: [
      { at: 0, dur: 3, tone: 0, vel: 0.98 },
      { at: 4, dur: 2, tone: -5, vel: 0.8 },
      { at: 10, dur: 2, tone: 0, vel: 0.88 },
      { at: 12, dur: 3, tone: 3, vel: 0.84 },
    ] },
    afterTheOne(4),
  ],
  comp: [halfChop(6), skank(4), bubble(2)],
  drums: [oneDrop(6), oneDropOpen(4), {
    name: 'rocksteady-two-drop', weight: 3, voices: {
      bd: [4, 8],
      rim: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    },
  }],
  melody: { leap: 0.24, ornament: 0.35, span: 13, sequence: 0.5, syncopation: 0.6 },
};

/**
 * SKINHEAD — boss reggae, 1969–70, and the fastest thing anybody called reggae.
 *
 * The eighteen months between rocksteady and roots, when the tempo went back up,
 * the organ took the front, and Trojan Records shipped the results to English
 * dance floors by the crateload. "The Liquidator", "Return of Django", "Long Shot
 * Kick de Bucket": instrumentals, mostly, with a Hammond doing what a horn section
 * had done two years earlier.
 *
 * It is the one style in the file where the *comp* is the lead instrument and the
 * melody layer is a guest. That shows up as a bubble at full weight and an organ
 * palette in the era tables, and as the only place here where a slight shuffle
 * survives — boss reggae is not quite straight, and the eighth-note lilt is most
 * of why it sounds like 1969 rather than like 1975.
 */
const skinhead: Style = {
  id: 'skinhead',
  label: 'Skinhead reggae',
  description:
    'Boss reggae, 1969: the tempo back up, a Hammond where the horns used to be, and just enough lilt left in the eighths to date it exactly.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [112, 138],
  swing: 0.1,
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0,
  boxDrums: false,
  shots: OFFBEAT_SHOTS,
  progressions: {
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 5 },
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'IV', 'IV'], weight: 4, note: 'Two chords, four bars each, and the organ carries the whole thing. Half the Trojan instrumental catalogue is this' },
      { chords: ['I', 'IV', 'V', 'IV', 'I', 'IV', 'V', 'IV'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 4, note: 'The flat seventh arriving in a major key — the first sign in this file of where the harmony is going next' },
      { chords: ['vi', 'vi', 'V', 'V', 'IV', 'IV', 'I', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['IV', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['V', 'IV', 'I', 'I'], weight: 2 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'i', 'i', 'v', 'v', 'i', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [-4, 4, 8], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    { name: 'boss-riff', weight: 6, hits: [
      { at: 0, dur: 2, tone: 0, vel: 0.98 },
      { at: 4, dur: 2, tone: 0, vel: 0.8 },
      { at: 6, dur: 2, tone: 7, vel: 0.86 },
      { at: 10, dur: 2, tone: 5, vel: 0.84 },
      { at: 12, dur: 3, tone: 0, vel: 0.9 },
    ] },
    { name: 'octave-push', weight: 4, hits: [
      { at: 0, dur: 3, tone: 0, vel: 0.98 },
      { at: 6, dur: 2, tone: 12, vel: 0.82 },
      { at: 8, dur: 2, tone: 7, vel: 0.88 },
      { at: 14, dur: 2, tone: 0, vel: 0.8 },
    ] },
    afterTheOne(3),
  ],
  comp: [bubble(6), skank(5), doubleSkank(3)],
  drums: [
    { name: 'boss-kit', weight: 6, voices: {
      bd: [4, 12],
      sd: [12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      oh: [14],
    } },
    { name: 'boss-one-drop', weight: 4, voices: {
      bd: [8],
      sd: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    oneDrop(3),
  ],
  melody: { leap: 0.35, ornament: 0.3, span: 14, sequence: 0.45, syncopation: 0.55 },
};

// ---------------------------------------------------------------------------
// Roots: 1972–1980
// ---------------------------------------------------------------------------

/**
 * ONE DROP — the beat everybody means, stated on its own.
 *
 * A style rather than only a drum pattern, because there is a body of records
 * that is *nothing but* this: mid-tempo, one drop, skank, organ, a bass figure,
 * a singer. No militant kick, no flying cymbals, no horns arranged across the top.
 * It is what a Studio One rhythm sounds like when nobody has decided to make it
 * about anything.
 *
 * The thing to notice in the tables below is how little there is. Two chords in
 * most of the verses, and the ones with four are moving every two bars. This music
 * gets its interest from where the notes are, not from which notes they are, and a
 * style that tried to be interesting harmonically would be reaching for the wrong
 * dial.
 */
const onedrop: Style = {
  id: 'onedrop',
  label: 'One drop',
  description:
    'Kick and cross-stick together on three, nothing on the downbeat, a skank on the offbeats and a bass figure carrying the tune. The beat everybody means.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [68, 88],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  shots: OFFBEAT_SHOTS,
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'VII', 'VII'], weight: 5, note: 'Two chords, four bars each. The entire harmonic content of a great many of these records, and the reason the bass has to be a tune' },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'v', 'v', 'i', 'i', 'iv', 'iv'], weight: 3, note: 'Minor five. Where a soul record would raise the third and lean on it, this leaves it flat and leans on nothing' },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5, note: '♭VI–♭VII–i, and it is a cadence in the sense that it arrives, not in the sense that anything led to it' },
      { chords: ['iv', 'iv', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 4 },
      { chords: ['III', 'III', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'VII', 'VII', 'III', 'III', 'VI', 'VI'], weight: 3 },
      { chords: ['VI', 'VI', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'IV', 'IV'], weight: 5 },
      { chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'IV', 'IV'], weight: 4 },
      { chords: ['I', 'I', 'vi', 'vi', 'IV', 'IV', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['bVII', 'bVII', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    outro: [
      { chords: ['IV', 'IV', 'I', 'I'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [-4, 4, 8], weight: 5 },
    { cell: [8, 8], weight: 5 },
    { cell: [-2, 6, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [-6, 2, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [-8, 4, 4], weight: 3 },
    { cell: [-4, 2, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 4 },
    { cell: [-8, 8], weight: 3 },
  ],
  bass: [
    afterTheOne(6),
    { name: 'walk-up-to-three', weight: 5, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 6, dur: 1, tone: 3, vel: 0.78 },
      { at: 7, dur: 1, tone: 5, vel: 0.78 },
      { at: 8, dur: 4, tone: 7, vel: 0.92 },
      { at: 14, dur: 2, tone: 0, vel: 0.82 },
    ] },
    { name: 'root-and-hole', weight: 4, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 8, dur: 2, tone: -5, vel: 0.86 },
      { at: 12, dur: 3, tone: 0, vel: 0.88 },
    ] },
  ],
  comp: [skank(7), doubleSkank(4), bubble(3)],
  drums: [oneDrop(7), oneDropOpen(4), {
    name: 'one-drop-shaker', weight: 3, voices: {
      bd: [8],
      rim: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      sh: [2, 6, 10, 14],
    },
  }],
  melody: { leap: 0.22, ornament: 0.3, span: 12, sequence: 0.55, syncopation: 0.65 },
};

/**
 * ROCKERS — 1975, Channel One, and the kick that comes back to the downbeat.
 *
 * Sly Dunbar's answer to the one drop, and the answer is: put the kick back on
 * one, and then put another one just after three so nobody mistakes it for a rock
 * beat. What that buys is drive — a one drop floats and this walks — and what it
 * costs is the hole, which is why both survive and neither replaced the other.
 *
 * The guitar doubles up with it. A rockers chop is two sixteenths per offbeat
 * rather than one, so the eight events in a bar are all after the beat and there
 * are twice as many of them; the effect is of a band leaning forward. Bunny Lee's
 * `flyers` and this are the same year and the same argument settled two ways.
 */
const rockers: Style = {
  id: 'rockers',
  label: 'Rockers',
  description:
    'The Channel One answer to the one drop: the kick back on the downbeat and doubled after three, a double chop on every offbeat, and the whole band leaning forward.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [72, 92],
  swing: 0,
  modeWeights: { minor: 0.7, major: 0.3 },
  relativeMajorChorus: 0,
  shots: OFFBEAT_SHOTS,
  progressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'iv', 'iv'], weight: 4 },
      { chords: ['i', 'i', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['III', 'III', 'VII', 'VII', 'iv', 'iv', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'i', 'i', 'iv', 'iv', 'VII', 'VII'], weight: 3 },
    ],
    outro: [
      { chords: ['VII', 'VII', 'i', 'i'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'IV', 'IV'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 4 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [-4, 4, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-2, 6, 8], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 2, 2, 8], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [16], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'rockers-riff', weight: 6, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 3, dur: 1, tone: 0, vel: 0.74 },
      { at: 6, dur: 2, tone: 10, vel: 0.86 },
      { at: 8, dur: 2, tone: 7, vel: 0.92 },
      { at: 12, dur: 3, tone: 0, vel: 0.88 },
    ] },
    { name: 'militant-climb', weight: 5, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 3, vel: 0.82 },
      { at: 8, dur: 2, tone: 5, vel: 0.9 },
      { at: 12, dur: 2, tone: 7, vel: 0.86 },
      { at: 14, dur: 2, tone: 5, vel: 0.76 },
    ] },
    afterTheOne(4),
  ],
  comp: [doubleSkank(7), skank(4), bubble(3)],
  drums: [
    { name: 'rockers', weight: 7, voices: {
      bd: [0, 8, 10],
      sd: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'rockers-rim', weight: 4, voices: {
      bd: [0, 8, 10],
      rim: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'rockers-sixteenths', weight: 3, voices: {
      bd: [0, 6, 8, 10],
      sd: [8],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    } },
  ],
  melody: { leap: 0.26, ornament: 0.28, span: 12, sequence: 0.55, syncopation: 0.65 },
};

/**
 * STEPPERS — four to the floor, and the only unambiguous downbeat in the genre.
 *
 * A kick on every quarter, an open hat on every offbeat, and the drummer refusing
 * to let go. It is the militant end of roots — Burning Spear, Aswad, the whole
 * "Marcus Garvey" texture — and it is included partly because it is the exception
 * that shows what the rule was doing: a bar of this has a downbeat you can march
 * to, and the moment it does, the bass stops sounding like a lead instrument and
 * starts sounding like a bass again.
 *
 * So the bass figures here are the most root-anchored in the file, and that is not
 * a compromise. When the drummer is stating the beat, the bass has nothing left to
 * state and gets to be heavy instead.
 */
const steppers: Style = {
  id: 'steppers',
  label: 'Steppers',
  description:
    'A kick on every quarter and an open hat on every offbeat: the militant end of roots, and the one place in the genre with a downbeat you could march to.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [74, 96],
  swing: 0,
  modeWeights: { minor: 0.8, major: 0.2 },
  relativeMajorChorus: 0,
  shots: OFFBEAT_SHOTS,
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 4, note: 'One chord for eight bars. A steppers riddim is a state rather than a progression, and this is the honest table for it' },
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'iv', 'iv'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'VII', 'VII'], weight: 3 },
    ],
    bridge: [
      { chords: ['VI', 'VI', 'iv', 'iv', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['i', 'i', 'i', 'i'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'I', 'I', 'bVII', 'bVII'], weight: 5 },
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'IV', 'IV'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['bVI', 'bVI', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [16], weight: 5 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [-8, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [-2, 6, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 3 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    { name: 'steppers-heavy', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 3, tone: 0, vel: 0.86 },
      { at: 8, dur: 3, tone: 10, vel: 0.92 },
      { at: 12, dur: 3, tone: 7, vel: 0.88 },
    ] },
    /**
     * An octave and back, and it stops there.
     *
     * The obvious fourth note is a fifth *below* the root, which is where a
     * steppers bass often goes — and written that way the figure spans
     * seventeen semitones, which is more than the placement in `generateBass`
     * can hold at the top of the range. It folds two of the notes onto one
     * pitch, and a shape with two of its four notes on the same note is not the
     * shape any more. Twelve is what survives; `npm run genres` is what noticed.
     */
    { name: 'steppers-octave', weight: 4, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 12, vel: 0.8 },
      { at: 8, dur: 3, tone: 0, vel: 0.94 },
      { at: 14, dur: 2, tone: 7, vel: 0.82 },
    ] },
    { name: 'steppers-pedal', weight: 3, sustain: true, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 1 },
      { at: 8, dur: 8, tone: 'root', vel: 0.9 },
    ] },
  ],
  comp: [skank(6), doubleSkank(5), bubble(3)],
  drums: [
    { name: 'steppers', weight: 7, voices: {
      bd: [0, 4, 8, 12],
      sd: [8],
      hh: [0, 4, 8, 12],
      oh: [2, 6, 10, 14],
    } },
    { name: 'steppers-rim', weight: 4, voices: {
      bd: [0, 4, 8, 12],
      rim: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'steppers-crash', weight: 2, voices: {
      bd: [0, 4, 8, 12],
      sd: [4, 12],
      oh: [2, 6, 10, 14],
    } },
  ],
  melody: { leap: 0.2, ornament: 0.22, span: 11, sequence: 0.6, syncopation: 0.55 },
};

/**
 * FLYERS — flying cymbals, 1974–75, and a disco hi-hat over a one drop.
 *
 * Bunny Lee heard the Philadelphia records, told Santa Davis to keep the hi-hat
 * opening on every offbeat, and produced about two hundred sides with it. It is
 * the narrowest style in the file — one hand, doing one thing — and it earns its
 * row because that one thing changes the whole texture: a bar with an open hat on
 * every "and" has a wash across it, and the one drop underneath stops being a hole
 * and becomes a swing.
 *
 * `boxDrums: false`. A flying cymbal is a foot easing the pedal open *while the
 * stick is coming down*, which is a continuous control on a mechanical object; a
 * preset box has one closed-hat sample and one open-hat sample and no way to be
 * between them. The result on a box is not a plainer flyers, it is a different
 * record with an open hat stapled to it.
 */
const flyers: Style = {
  id: 'flyers',
  label: 'Flying cymbals',
  description:
    'A one drop with the hi-hat opening on every offbeat — Bunny Lee hearing Philadelphia in 1974 and putting a disco wash over the hole in the bar.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [76, 94],
  swing: 0,
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0,
  boxDrums: false,
  shots: OFFBEAT_SHOTS,
  progressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'v', 'v'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'iv', 'iv'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    outro: [
      { chords: ['VII', 'VII', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'vi', 'vi', 'IV', 'IV', 'V', 'V'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'IV', 'IV'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'V', 'V', 'I', 'I', 'I', 'I'], weight: 4 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [-4, 4, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [-2, 6, 8], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [16], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    afterTheOne(5),
    { name: 'flyers-riff', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 0.98 },
      { at: 6, dur: 2, tone: 5, vel: 0.84 },
      { at: 8, dur: 2, tone: 7, vel: 0.9 },
      { at: 10, dur: 2, tone: 10, vel: 0.8 },
      { at: 14, dur: 2, tone: 12, vel: 0.84 },
    ] },
    { name: 'flyers-lope', weight: 4, hits: [
      { at: 2, dur: 2, tone: 0, vel: 0.94 },
      { at: 8, dur: 3, tone: -5, vel: 0.9 },
      { at: 13, dur: 3, tone: 0, vel: 0.86 },
    ] },
  ],
  comp: [skank(6), doubleSkank(4)],
  drums: [
    { name: 'flyers', weight: 7, voices: {
      bd: [8],
      rim: [8],
      hh: [0, 4, 8, 12],
      oh: [2, 6, 10, 14],
    } },
    { name: 'flyers-kick-one', weight: 3, voices: {
      bd: [0, 8],
      rim: [8],
      hh: [0, 4, 8, 12],
      oh: [2, 6, 10, 14],
    } },
  ],
  melody: { leap: 0.26, ornament: 0.3, span: 13, sequence: 0.5, syncopation: 0.6 },
};

/**
 * ROOTS — the full band, 1975, with everything on it.
 *
 * The style with the most layers in the genre and the one that sounds like the
 * word: organ bubbling underneath, a horn section arranged across the top, the
 * one drop, the skank, and a bass playing a figure everybody in Jamaica could
 * whistle. Where `onedrop` is the rhythm on its own, this is the record built on
 * top of it.
 *
 * Minor at four to one, and that is the strongest mode weighting in the file. The
 * subject matter of roots reggae is not, on the whole, cheerful, and the harmony
 * agrees: `i–VII–VI–VII`, the descending tetrachord that never gets to the bottom,
 * appears in more of these songs than any other four bars in the genre.
 */
const roots: Style = {
  id: 'roots',
  label: 'Roots',
  description:
    'The full 1975 band: one drop, skank, organ bubble, arranged horns and a bass figure the whole island could whistle. Minor, and in no hurry.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [68, 88],
  swing: 0,
  modeWeights: { minor: 0.8, major: 0.2 },
  relativeMajorChorus: 0,
  shots: OFFBEAT_SHOTS,
  progressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 6, note: 'The descending tetrachord that stops short. It never reaches the fifth, because reaching it would need a dominant and there is not one anywhere in this genre' },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'III', 'III', 'VII', 'VII', 'iv', 'iv'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 6 },
      { chords: ['iv', 'iv', 'VII', 'VII', 'III', 'III', 'VI', 'VI'], weight: 4 },
      { chords: ['III', 'III', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 3 },
      { chords: ['iv', 'iv', 'i', 'i', 'v', 'v', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['VI', 'VI', 'III', 'III', 'VII', 'VII', 'iv', 'iv'], weight: 3 },
      { chords: ['iv', 'iv', 'i', 'i', 'iv', 'iv', 'VII', 'VII'], weight: 3 },
    ],
    outro: [
      { chords: ['VI', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 5, note: 'The double plagal — the major-key way of declining a dominant, and the same refusal the minor tables make with ♭VII' },
      { chords: ['I', 'I', 'IV', 'IV', 'vi', 'vi', 'IV', 'IV'], weight: 4 },
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'IV', 'IV'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 5 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'bVII', 'bVII'], weight: 3 },
    ],
    outro: [
      { chords: ['bVII', 'IV', 'I', 'I'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [-4, 4, 8], weight: 5 },
    { cell: [8, 8], weight: 5 },
    { cell: [-2, 6, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-6, 2, 8], weight: 3 },
    { cell: [-8, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 4 },
    { cell: [-8, 8], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'roots-riff', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 10, vel: 0.82 },
      { at: 8, dur: 2, tone: 7, vel: 0.92 },
      { at: 11, dur: 1, tone: 5, vel: 0.74 },
      { at: 12, dur: 3, tone: 3, vel: 0.86 },
    ] },
    afterTheOne(5),
    { name: 'roots-hole', weight: 4, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 10, dur: 2, tone: 7, vel: 0.86 },
      { at: 12, dur: 2, tone: 5, vel: 0.82 },
      { at: 14, dur: 2, tone: 3, vel: 0.8 },
    ] },
    { name: 'roots-octave-drop', weight: 3, hits: [
      { at: 0, dur: 2, tone: 12, vel: 0.94 },
      { at: 4, dur: 2, tone: 7, vel: 0.84 },
      { at: 8, dur: 4, tone: 0, vel: 1 },
      { at: 14, dur: 2, tone: 3, vel: 0.8 },
    ] },
  ],
  comp: [skank(6), bubble(5), doubleSkank(4), halfChop(2)],
  drums: [oneDrop(7), oneDropOpen(4), {
    name: 'roots-rockers', weight: 3, voices: {
      bd: [0, 8],
      rim: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    },
  }],
  melody: { leap: 0.24, ornament: 0.32, span: 13, sequence: 0.55, syncopation: 0.65 },
};

/**
 * DUB — a production, not a rhythm, and this table is honest about that.
 *
 * The drums and bass below are the roots riddim, because that is what a dub *is*:
 * the same multitrack, with the vocal pulled off and the rest of the band pushed
 * in and out of the mix on the faders while the echo runs. King Tubby did not
 * write a dub rhythm. He wrote nothing at all; he took the tape somebody else had
 * made and mixed it a second time.
 *
 * What makes this a style rather than a duplicate of `roots` is everything the
 * table can say about *how much of the band is there*. The comp is halved, the
 * brass layer is refused outright — a horn section arranged across the top is the
 * opposite of a mix that keeps taking things away — and the style declares a
 * `filter` sweep, which is the one gesture in the whole project that says "the
 * engineer's hand is on this". **And it declares its own sends**, which is the
 * half of the drenching that used to be borrowed; see `effects` below for what
 * that was costing and what is deliberately still the era's.
 *
 * **And the bass now actually leaves.** Everything in the paragraph above was
 * written while the one gesture this form is *defined* by — the fader going down
 * and coming back four bars later — was the thing the table could not say, and
 * three of those fields were standing in a row where it should have been. See
 * `drops` below, which is the field that says it and the argument for why none
 * of the three came out when it arrived.
 *
 * `drumFills: false`, and it is the sharpest thing in this style's table. A dub
 * does not announce a section with a tom roll. It announces one by dropping
 * everything except the kick for four bars and then throwing the snare into a
 * quarter-second of feedback, and a drummer signposting the change on top of that
 * would be doing the mix's job badly.
 *
 * Its melody is pentatonic — see `scaleForChord` below, which is one of only two
 * style-level overrides in the genre and is argued there.
 */
const dub: Style = {
  id: 'dub',
  label: 'Dub',
  description:
    'The same riddim with the singer taken off it: half the band at any moment, the filter moving under somebody\'s hand, and everything drenched.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [66, 86],
  swing: 0,
  modeWeights: { minor: 0.85, major: 0.15 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass'],
  drumFills: false,
  /**
   * The drench, stated here because it is the piece rather than the decade.
   *
   * This is the one style in the catalogue that `Style.effects` exists for, and
   * the reason is the sentence at the top of this block: a dub is a *production*.
   * Take the echo off a rocksteady record and you have a rocksteady record mixed
   * dry; take it off this and there is nothing left, because the riddim
   * underneath was somebody else's and the second pass over the tape is the whole
   * of what King Tubby contributed. An era is an average over a decade and this
   * is a member of that average; the member wins.
   *
   * **What it was costing, measured.** Before this block a dub took its sends
   * from whichever era it was drawn in, and the `digital` era is dry by
   * construction and correctly so — a Casiotone riddim has no room in it. So a
   * dub drawn in 1985 came out with the kit at `reverb 0.08` and **no `delay`
   * field at all**, against `0.42` and `0.28` for the same style drawn ten years
   * earlier. That is not a dub cut in 1985, which is a real and famous object
   * — Scientist and Jammy's were both still working — it is simply not a dub.
   * The four channels below now resolve **identically in all four eras**, and
   * the only thing left moving is the `lowpass`: 6500 on the kit in `ska`, 5500
   * in `rocksteady`, 3200 in `roots`, 9000 in `digital`. Drenched in every
   * decade, and a different decade's record in each.
   *
   * ## Which four, and why the other four are the era's
   *
   * The merge is per key, so everything unnamed here goes on tracking the year.
   * That is the design and it is also the discipline: a dub should state its
   * echo and let 1963 and 1985 go on deciding how bright the record is.
   *
   *  - **`lowpass` is named nowhere.** A 1968 dub and a 1985 dub are both dubs
   *    and they do not sound alike, and the difference is almost entirely the
   *    top end — the `ska` table says 6500 on the kit, `roots` 3200 and
   *    `digital` 9000, and all three are right about their own decade. Naming a
   *    cutoff here would freeze one of them across the twenty-two years those
   *    tables span and take an era's job away to no purpose, since brightness is
   *    not what anybody means by *dub*.
   *  - **`bass` is named nowhere either, and that silence is the loudest thing
   *    in the block.** The one channel a dub engineer never sends is the bass:
   *    reverb on a sustained low note arrives while the note is still sounding
   *    and the two beat against each other, which is why the floor stays solid
   *    while the room above it falls apart. All four eras already say `reverb`
   *    0.02 or 0, and this style agreeing by saying nothing is stronger than
   *    this style agreeing by saying 0.02 — the latter would also pin the
   *    `lowpass` argument's twin, the small drift from 900 Hz down to 800 and
   *    back up to 950 that is the actual history of the instrument.
   *  - **`pad` is left alone** for a reason of physics rather than taste: an
   *    echo repeats a transient and a pad has none, so a delay send on the wash
   *    buys a thicker wash and nothing recognisable. What a dub does to a pad is
   *    take it away, and taking a layer away is the filter sweep's job and the
   *    mix's, not a send level's.
   *  - **`vocal` is left alone** because the definition of the form is that
   *    there is no singer on it.
   *
   * What is left is the four channels the engineer's hands are actually on, and
   * they keep the ladder every era table already builds — kit driest, tune
   * wettest — lifted bodily above the wettest of them. The ordering is not a
   * preference: the kit still has to keep time in a dub, and a rhythm you cannot
   * locate is a different and much worse record. `counter` is on the list and
   * looks like the marginal one; it is not. Three of the four era tables say
   * nothing about that layer at all, so without this it falls all the way back to
   * the genre's 0.45/0.35 and comes out **wetter than the melody** in `digital`
   * — the answering fragment louder in the echo than the thing it is answering,
   * which is backwards.
   *
   * ## What this still cannot say
   *
   * The send levels are the style's now; the *character* of the echo is not.
   * How many times a repeat comes back lives in `Space.delayFeedback`, which has
   * a genre tier and an era tier and no style tier, so a dub in `digital` gets
   * 0.42 where the same dub in `roots` gets 0.62 — four or five repeats against
   * seven. The band is drenched in both and the tape machine is a different
   * machine, which is a smaller wrongness than the one this block fixes and is
   * the residual worth writing down rather than hiding.
   */
  effects: {
    drums: { reverb: 0.5, delay: 0.45 },
    comp: { reverb: 0.58, delay: 0.55 },
    counter: { reverb: 0.62, delay: 0.58 },
    melody: { reverb: 0.65, delay: 0.6 },
  },
  filter: { depth: 0.55, shape: 'ramp' },
  /**
   * The bass goes for four bars and the whole band comes back — and this is the
   * style the mechanism was built for.
   *
   * `docs/engine-gaps.md` §1.2 calls it the canonical case and §8 names it the
   * cheapest adoption there is. Until `generate/drop.ts` existed this table
   * approximated *bass out, then everything back* three different ways at once,
   * and the finding worth writing down is that **all three stay**. None of them
   * was ever this gesture. They are three neighbouring gestures that had lined up
   * in the gap where the missing one should have been, and taking one out now
   * would be removing a thing that works because something else finally does:
   *
   *  - the **`effects` block above** is a claim about *sends*, and §7 records
   *    what it recovered — a dub cut in 1985 that came out dry. An echo is not a
   *    mute. King Tubby did both, on the same pass over the same tape, and the
   *    engine can now say both.
   *  - the **`filter` ramp** is a hand on a knob *across* a section, and it is
   *    continuous. A drop is a channel at zero and then not. Deleting the sweep
   *    would take away the half of the mix that moves and leave only the half
   *    that switches.
   *  - the genre's **`break`**, which `index.ts` calls "the live-band ancestor of
   *    what a dub engineer does with a mute button". That sentence is exactly
   *    right and exactly why it is not a substitute: a break is one bar, at a
   *    seam, and the layer that survives it is the *bass*, which is the layer
   *    this gesture is about losing. The two also cannot collide — `planDrop`
   *    ends its span a whole phrase before the section does, so the seam pass and
   *    this one are structurally incapable of editing the same bar.
   *
   * So this is an addition and not a replacement, which is the honest thing a
   * fourth gesture can be.
   *
   * **Two to one, and the arithmetic is the whole claim.** A version does not
   * pull the bass out of every chorus; `generate/chart.ts` settled that argument
   * for the engine — *a surprise that arrives on schedule is a texture* — and a
   * dub whose bass left on a timetable would be an arrangement with holes in it,
   * which `Chart.layers` can already say and which is not what these sides do.
   * One song in three is the record having one.
   *
   * **Measured**, because a palette that never fires is precisely the failure
   * `Style.dropBars` was added for and this style is the one that has to be
   * beyond doubt. Forced to `dub`, it places one in **200 of 200** songs — its
   * verses are sixteen bars and a four-bar drop needs twelve — landing in the
   * verse 177 times and the outro 23. Under the weights below, over 400 songs:
   * **146**, which is the one in three the table says. The bass loses a median
   * of **16 onsets and never fewer than 8**, so there is no seed where the
   * gesture is written and inaudible. **0 empty sections**, and **0 songs**
   * differed anywhere outside the span — the same tune, the same skank, the same
   * one drop, with a hole in it. The 254 that drew `none` are byte-identical to
   * the tree before this field existed, all 254 of them.
   *
   * No `dropBars`. Four is what the shape says, what the records say, and what
   * this style's forms are long enough to mean.
   */
  drops: [['none', 2], ['dub', 1]],
  shots: OFFBEAT_SHOTS,
  /**
   * Minor pentatonic, and one of two places in this genre where a style takes
   * the chord-scale question away from the genre.
   *
   * What plays the tune on a dub is a melodica or a fragment of the horn line
   * that survived the mix, and both of them are playing five notes. Augustus
   * Pablo's lines have no second and no sixth in them at all — the second is
   * where a tune goes to be sweet and the sixth is where it goes to be plaintive,
   * and a dub is neither. Left on the genre's aeolian the line keeps finding
   * those two degrees and comes out as a sad melody over a dub, which is a
   * different and much worse record.
   *
   * The third-to-fifth and tonic-to-♭3 moves this makes are one scale step and
   * three semitones, which `augmented-second` vetoes from strictness 1 upward.
   * The genre disables that rule for exactly this reason; see `index.ts`.
   */
  scaleForChord: (tonic, mode) =>
    makeScale(tonic, mode === 'minor' ? 'minorPentatonic' : 'majorPentatonic'),
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'VII', 'VII'], weight: 6 },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'iv', 'iv'], weight: 4 },
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 4, note: 'One chord, eight bars. In a dub the section boundary is a fader move, and a chord change would be somebody else deciding where it was' },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['i', 'i', 'i', 'i'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'bVII', 'bVII'], weight: 5 },
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'IV', 'IV'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [-8, 8], weight: 5 },
    { cell: [16], weight: 5 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [-6, 2, 8], weight: 3 },
    { cell: [-12, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 4 },
    { cell: [-12, 4], weight: 2 },
  ],
  bass: [
    afterTheOne(6),
    { name: 'dub-riff', weight: 6, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 8, dur: 2, tone: 7, vel: 0.9 },
      { at: 12, dur: 2, tone: 10, vel: 0.84 },
      { at: 14, dur: 2, tone: 7, vel: 0.8 },
    ] },
    { name: 'dub-two-note', weight: 4, hits: [
      { at: 2, dur: 6, tone: 0, vel: 1 },
      { at: 10, dur: 5, tone: -5, vel: 0.92 },
    ] },
  ],
  comp: [skank(5), halfChop(4), bubble(3)],
  drums: [oneDropOpen(7), oneDrop(4), {
    name: 'dub-bare', weight: 3, voices: {
      bd: [8],
      rim: [8],
    },
  }],
  melody: { leap: 0.3, ornament: 0.2, span: 14, sequence: 0.4, syncopation: 0.7 },
};

/**
 * NYABINGHI — three hand drums and voices, and no kit anywhere.
 *
 * A groundation is not a band. It is the bass drum, the funde and the repeater —
 * three drums, played with hands, tuned low to high — and as many voices as turned
 * up. The bass drum strikes the one and answers itself off the second beat, which
 * is the heartbeat everybody hears in it; the funde holds two even strokes and
 * never varies, because its whole function is to be the thing that never varies;
 * and the repeater plays across both of them and is the only improvised part in
 * this entire genre.
 *
 * That is written on `lp`, `mp` and `hp` — the low, mid and high strokes of a hand
 * drum — and it is the reason those voices exist. On `bd`, `sd` and toms the same
 * three parts come out as a drum kit playing a strange rock beat, because a tom is
 * one stick on one drum and this is two hands on three.
 *
 * `boxDrums: false` and `drumFills: false` follow immediately: there is no preset
 * box with a repeater in it, and a hand drummer does not play a descending tom
 * roll into the next verse. `excludeLayers` takes the horn section and the
 * answering line away — a chant is one melody and everybody sings it — and the
 * guitar and bass stay, because the recordings that made this music famous outside
 * Jamaica had both.
 *
 * Pentatonic, for the same reason `dub` is and a different one: a chant is a
 * handful of notes repeated until it means something, and the two degrees a
 * pentatonic drops are exactly the two that make a melody sound composed.
 */
const nyabinghi: Style = {
  id: 'nyabinghi',
  label: 'Nyabinghi',
  description:
    'Bass drum, funde and repeater — three hand drums and a chant, with the heartbeat on the low drum and the only improvised part in the genre on the high one.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [58, 76],
  swing: 0,
  modeWeights: { minor: 0.75, major: 0.25 },
  relativeMajorChorus: 0,
  boxDrums: false,
  drumFills: false,
  excludeLayers: ['brass', 'counter'],
  requireLayers: ['drums'],
  scaleForChord: (tonic, mode) =>
    makeScale(tonic, mode === 'minor' ? 'minorPentatonic' : 'majorPentatonic'),
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5, note: 'One chord. The drums are not accompanying a harmony and the harmony is a courtesy the recording extends to the guitar player' },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['i', 'i', 'i', 'i'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 5 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [-8, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 3 },
  ],
  /**
   * Slow and near the root. The bass on a groundation recording is doubling the
   * low drum, not writing a tune against it — there is no space for a tune,
   * because the low drum has taken it.
   */
  bass: [
    { name: 'heartbeat-bass', weight: 6, hits: [
      { at: 0, dur: 5, tone: 'root', vel: 1 },
      { at: 6, dur: 5, tone: 'root', vel: 0.84 },
    ] },
    { name: 'chant-pedal', weight: 3, sustain: true, hits: [
      { at: 0, dur: 16, tone: 'root', vel: 0.9 },
    ] },
  ],
  /**
   * A guitar, barely. Still on the offbeat, still off the downbeat, and at half
   * the density of anything else in the file — this is a person strumming
   * quietly at the edge of a circle of drummers.
   */
  comp: [halfChop(6, 3), skank(3)],
  drums: [
    /**
     * The trio. `lp` is the bass drum — the one and an answer off the second
     * beat, which is the heartbeat; `mp` is the funde's two even strokes; `hp` is
     * the repeater, filling everything the other two left.
     */
    { name: 'nyabinghi', weight: 6, voices: {
      lp: [0, 6],
      mp: [4, 12],
      hp: [2, 8, 10, 14],
    } },
    { name: 'nyabinghi-repeater', weight: 4, voices: {
      lp: [0, 6],
      mp: [4, 12],
      hp: [2, 3, 8, 9, 10, 14, 15],
    } },
    { name: 'nyabinghi-slow', weight: 3, voices: {
      lp: [0, 6],
      mp: [4, 12],
      hp: [10, 14],
    } },
  ],
  melody: { leap: 0.18, ornament: 0.25, span: 10, sequence: 0.65, syncopation: 0.45 },
};

/**
 * LOVERS ROCK — south London, 1976, and the sweetest thing in the file.
 *
 * Slow, major, sung by a teenager, with a one drop under it and strings on top.
 * Made in England rather than in Jamaica, which is the interesting fact about it:
 * it is roots-era rhythm with soul-era harmony, and the harmony is the half that
 * came from the record shops of Brixton rather than from Kingston.
 *
 * So this is the one style here that keeps its dominants. `V` appears in the major
 * tables and it means what it means everywhere else — the genre's `scaleForChord`
 * will hand a leading tone to a major-key tune without complaint, and lovers rock
 * is where that permission is actually spent. In minor it stays modal like the
 * rest of the file, because a lovers rock in minor is a roots record with a
 * different singer on it.
 */
const lovers: Style = {
  id: 'lovers',
  label: 'Lovers rock',
  description:
    'Slow, major and sung: a one drop under soul changes, with the half-chop on two and four and strings across the top. Roots rhythm, Brixton harmony.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [66, 84],
  swing: 0,
  modeWeights: { minor: 0.2, major: 0.8 },
  relativeMajorChorus: 0,
  shots: OFFBEAT_SHOTS,
  progressions: {
    verse: [
      { chords: ['I', 'I', 'vi', 'vi', 'ii', 'ii', 'V', 'V'], weight: 5, note: 'A ii–V, which happens twice in this genre and both times in a style made a long way from Jamaica' },
      { chords: ['I', 'I', 'IV', 'IV', 'iii', 'iii', 'vi', 'vi'], weight: 4 },
      { chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'IV', 'V'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'V', 'V', 'I', 'I', 'vi', 'vi'], weight: 5 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 4 },
      { chords: ['IV', 'IV', 'iii', 'iii', 'ii', 'ii', 'V', 'V'], weight: 3 },
    ],
    bridge: [
      { chords: ['IV', 'IV', 'iv', 'iv', 'I', 'I', 'V', 'V'], weight: 3 },
      { chords: ['ii', 'ii', 'V', 'V', 'iii', 'iii', 'vi', 'vi'], weight: 3 },
    ],
    outro: [
      { chords: ['IV', 'V', 'I', 'I'], weight: 4 },
      { chords: ['ii', 'V', 'I', 'I'], weight: 2 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'VII', 'VII', 'III', 'III'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'VII', 'VII', 'III', 'III', 'VI', 'VI'], weight: 4 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [-4, 4, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-2, 6, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [16], weight: 3 },
    { cell: [-4, 2, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    { name: 'lovers-riff', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 0.96 },
      { at: 6, dur: 2, tone: 4, vel: 0.8 },
      { at: 8, dur: 3, tone: 7, vel: 0.88 },
      { at: 13, dur: 3, tone: 9, vel: 0.8 },
    ] },
    afterTheOne(4),
    { name: 'lovers-sway', weight: 4, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 0.96 },
      { at: 6, dur: 2, tone: 'fifth', vel: 0.8 },
      { at: 8, dur: 4, tone: 'octave', vel: 0.86 },
      { at: 14, dur: 2, tone: 'fifth', vel: 0.78 },
    ] },
  ],
  comp: [halfChop(6), skank(5), bubble(3)],
  drums: [
    { name: 'lovers-one-drop', weight: 7, voices: {
      bd: [8],
      rim: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      sh: [2, 6, 10, 14],
    } },
    oneDrop(4),
    oneDropOpen(3),
  ],
  melody: { leap: 0.24, ornament: 0.4, span: 14, sequence: 0.55, syncopation: 0.5 },
};

/**
 * BUBBLE — the organ is the record.
 *
 * There is a corner of this music where the bubbling organ is not the texture
 * under the song, it is the song: Jackie Mittoo's Studio One instrumentals, "Real
 * Rock", "Full Up", every side that ended up being versioned four hundred times
 * afterwards. What makes them work is that the organ part is a *rhythm* rather
 * than a harmony, so it survives having a completely different tune sung over it
 * a decade later, which is exactly what happened to all of them.
 *
 * `requireLayers: ['comp']` is the whole claim. Everywhere else in this genre the
 * comp can thin out with the arrangement; here it is the arrangement, and a
 * version of this style with the organ dropped for a sparse section would be a
 * version of some other style.
 */
const bubbleStyle: Style = {
  id: 'bubble',
  label: 'Organ bubble',
  description:
    'The Studio One instrumental: a two-handed organ bubbling sixteenths off every beat, and everything else arranged around keeping out of its way.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [70, 92],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  requireLayers: ['comp'],
  shots: OFFBEAT_SHOTS,
  progressions: {
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'iv', 'iv'], weight: 5, note: 'Two chords rocking every two bars — "Real Rock", and about forty riddims built on it since' },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    outro: [
      { chords: ['iv', 'iv', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'IV', 'IV'], weight: 5 },
      { chords: ['I', 'I', 'V', 'V', 'IV', 'IV', 'I', 'I'], weight: 3 },
      { chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'bVII', 'bVII'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 4 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 8], weight: 5 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [16], weight: 3 },
    { cell: [-2, 6, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [
    { name: 'bubble-riff', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 0.98 },
      { at: 4, dur: 2, tone: 3, vel: 0.8 },
      { at: 8, dur: 3, tone: 0, vel: 0.92 },
      { at: 12, dur: 2, tone: -2, vel: 0.82 },
      { at: 14, dur: 2, tone: -5, vel: 0.78 },
    ] },
    afterTheOne(5),
    { name: 'bubble-two', weight: 3, hits: [
      { at: 0, dur: 6, tone: 0, vel: 0.98 },
      { at: 8, dur: 6, tone: 7, vel: 0.88 },
    ] },
  ],
  comp: [bubble(8), skank(3), doubleSkank(2)],
  drums: [oneDrop(6), {
    name: 'bubble-kit', weight: 4, voices: {
      bd: [0, 8],
      rim: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    },
  }, oneDropOpen(3)],
  melody: { leap: 0.3, ornament: 0.35, span: 14, sequence: 0.5, syncopation: 0.6 },
};

/**
 * HORNS — the section, arranged, and never a soloist.
 *
 * Tommy McCook and the Supersonics, the Zap Pow horns, every roots record with
 * three men standing in a row behind the singer. The distinction this style exists
 * to make is against `ska`, which is the only place in the genre where a horn is a
 * *player*: here it is three horns reading one line, entering on the offbeat,
 * holding a note under the tune, and getting out again.
 *
 * `arrangement` at the genre level raises `riff` and `swell` for this reason, and
 * the reason is worth writing down where the styles are: a stab thrown into a gap
 * in the tune is a rock arranger's gesture, and a Jamaican horn section instead
 * plays the *same* figure every second bar until it is part of the riddim. Once it
 * is part of the riddim somebody else can version it, which is the point of
 * everything in this genre.
 */
const horns: Style = {
  id: 'horns',
  label: 'Horns',
  description:
    'Three horns reading one line: the same figure every second bar until it becomes part of the riddim, and a long note held under the tune when it does not.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [72, 96],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  requireLayers: ['brass'],
  shots: OFFBEAT_SHOTS,
  progressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'III', 'III', 'iv', 'iv', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['III', 'III', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'VII', 'VII', 'III', 'III', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['VI', 'VII', 'i', 'i'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 4 },
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 4 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'bVII', 'bVII', 'I', 'I'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 8], weight: 5 },
    { cell: [-4, 4, 8], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-2, 6, 8], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [16], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'horns-riff', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 7, vel: 0.84 },
      { at: 8, dur: 2, tone: 10, vel: 0.88 },
      { at: 12, dur: 3, tone: 7, vel: 0.86 },
    ] },
    afterTheOne(5),
    { name: 'horns-under', weight: 3, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 },
      { at: 8, dur: 2, tone: 'fifth', vel: 0.86 },
      { at: 12, dur: 4, tone: 'root', vel: 0.88 },
    ] },
  ],
  comp: [skank(6), doubleSkank(4), bubble(3)],
  drums: [oneDrop(6), {
    name: 'horns-rockers', weight: 4, voices: {
      bd: [0, 8, 10],
      rim: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    },
  }, oneDropOpen(3)],
  melody: { leap: 0.35, ornament: 0.3, span: 16, sequence: 0.5, syncopation: 0.55 },
};

/**
 * TWO-TONE — Coventry, 1979, and ska played by people who had bought punk records.
 *
 * The Specials, the Selecter, the Beat: the ska of 1964 sped up slightly, played
 * on a rock kit with a rock snare, with the shuffle removed. Removing the shuffle
 * is the change that matters — it is what makes two-tone sound like 1979 rather
 * than like a revival, and it is why this style sits with a `swing` of 0.05 where
 * `ska` sits at 0.2.
 *
 * The other difference is the kit. Two-tone puts the snare back on two and four,
 * hard, because everybody in the band grew up on the wrong side of the Atlantic
 * for a cross-stick, and the offbeat guitar has to fight it rather than sit in the
 * space it leaves. That fight is most of the sound.
 */
const twotone: Style = {
  id: 'twotone',
  label: 'Two-tone',
  description:
    'Coventry, 1979: 1964 ska with the shuffle taken out and a rock backbeat put in, so the offbeat guitar has to fight the snare rather than sit behind it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [148, 178],
  swing: 0.05,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  shots: OFFBEAT_SHOTS,
  progressions: {
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 5 },
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'v', 'v'], weight: 4, note: 'The minor two-tone verse. Nothing here resolves upward, which is the punk half of the record arriving in the harmony' },
      { chords: ['I', 'I', 'vi', 'vi', 'IV', 'IV', 'V', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'V', 'V', 'I', 'I', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['vi', 'vi', 'V', 'V', 'IV', 'IV', 'I', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['bVI', 'bVI', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['IV', 'V', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'VII', 'VII', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'v', 'v', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [2, 2, 4, 8], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [12, 4], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    { name: 'twotone-eighths', weight: 6, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 4, dur: 2, tone: 0, vel: 0.84 },
      { at: 8, dur: 2, tone: 7, vel: 0.92 },
      { at: 12, dur: 2, tone: 5, vel: 0.86 },
      { at: 14, dur: 2, tone: 3, vel: 0.8 },
    ] },
    { name: 'walking', weight: 4, walking: true, hits: [
      { at: 0, dur: 4, tone: 'root' },
      { at: 4, dur: 4, tone: 'third' },
      { at: 8, dur: 4, tone: 'fifth' },
      { at: 12, dur: 4, tone: 'approach' },
    ] },
    { name: 'twotone-octave', weight: 3, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 12, vel: 0.82 },
      { at: 8, dur: 3, tone: 0, vel: 0.92 },
      { at: 14, dur: 2, tone: 12, vel: 0.8 },
    ] },
  ],
  comp: [skank(7), doubleSkank(4)],
  drums: [
    { name: 'twotone-kit', weight: 7, voices: {
      bd: [0, 8],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'twotone-drive', weight: 4, voices: {
      bd: [0, 6, 8, 14],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'twotone-ska', weight: 2, voices: {
      bd: [4, 12],
      sd: [12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  melody: { leap: 0.4, ornament: 0.22, span: 15, sequence: 0.5, syncopation: 0.55 },
};

/**
 * DUB POETRY — the backing, which is all this style is.
 *
 * Linton Kwesi Johnson, Mutabaruka, Oku Onuora: a poem, spoken in time, over a
 * band that has been told to leave room. It is in this catalogue as an
 * *arrangement problem* rather than as a rhythm, because the rhythm is a one drop
 * and the problem is that the most important part of the record is a voice that
 * this generator cannot write.
 *
 * So what the table does is subtract. Half the hi-hat, no horn section, the
 * sparsest comp in the file, a bass figure with more rest in it than note, and
 * `drumFills: false` because a fill would be an interruption. What is left is a
 * texture with a hole in the middle exactly where the words go — which is the
 * honest thing to build when the words are the part you do not have.
 */
const dubpoetry: Style = {
  id: 'dubpoetry',
  label: 'Dub poetry',
  description:
    'A band told to leave room: half a hi-hat, no horns, and a bass figure with more rest in it than note, arranged around a voice that is doing the talking.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [64, 82],
  swing: 0,
  modeWeights: { minor: 0.8, major: 0.2 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass'],
  drumFills: false,
  shots: OFFBEAT_SHOTS,
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 4 },
    ],
    outro: [
      { chords: ['i', 'i', 'i', 'i'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'bVII', 'bVII'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [-8, 8], weight: 5 },
    { cell: [16], weight: 5 },
    { cell: [-12, 4], weight: 4 },
    { cell: [-4, 4, 8], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 4 },
  ],
  bass: [
    { name: 'poetry-space', weight: 6, hits: [
      { at: 0, dur: 5, tone: 0, vel: 1 },
      { at: 10, dur: 4, tone: -5, vel: 0.9 },
    ] },
    { name: 'poetry-riff', weight: 4, hits: [
      { at: 2, dur: 3, tone: 0, vel: 0.98 },
      { at: 8, dur: 2, tone: 3, vel: 0.86 },
      { at: 12, dur: 3, tone: 0, vel: 0.9 },
    ] },
  ],
  comp: [halfChop(6), skank(3)],
  drums: [
    { name: 'poetry-kit', weight: 6, voices: {
      bd: [8],
      rim: [8],
      hh: [4, 12],
    } },
    oneDropOpen(4),
  ],
  melody: { leap: 0.2, ornament: 0.2, span: 11, sequence: 0.5, syncopation: 0.7 },
};

// ---------------------------------------------------------------------------
// The eighties: 1980–1990
// ---------------------------------------------------------------------------

/**
 * RUB-A-DUB — 1980–84, the Roots Radics, and everything slowed down again.
 *
 * The second great deceleration in this music, and unlike the first one it was
 * done on purpose: Junjo Lawes and the Roots Radics took the roots riddim, dropped
 * fifteen beats a minute off it, stripped the horns and the organ out, and left a
 * bass and a drum with a DJ over the top. It is the sparsest live-band texture in
 * the genre and the direct ancestor of everything that came after the machines
 * arrived.
 *
 * The kick moves. A rub-a-dub kick lands on three and again on the last offbeat of
 * the bar, so the bar ends with a shove into the next one — which is a completely
 * different relationship to the barline from the one drop's, where the bar ends
 * with nothing at all.
 */
const rubadub: Style = {
  id: 'rubadub',
  label: 'Rub-a-dub',
  description:
    'The Roots Radics, 1982: fifteen beats slower than roots, horns and organ stripped out, and a kick that shoves the end of every bar into the next one.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [62, 78],
  swing: 0,
  modeWeights: { minor: 0.75, major: 0.25 },
  relativeMajorChorus: 0,
  excludeLayers: ['brass'],
  shots: OFFBEAT_SHOTS,
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'iv', 'iv'], weight: 4 },
      { chords: ['i', 'i', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 4 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['VII', 'VII', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'bVII', 'bVII'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'IV', 'IV'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [-4, 4, 8], weight: 5 },
    { cell: [-8, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [-6, 2, 8], weight: 3 },
    { cell: [-4, 2, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    { name: 'radics-riff', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 3, vel: 0.84 },
      { at: 10, dur: 2, tone: 5, vel: 0.86 },
      { at: 14, dur: 2, tone: 7, vel: 0.88 },
    ] },
    { name: 'radics-drop', weight: 5, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 2, tone: -2, vel: 0.9 },
      { at: 12, dur: 4, tone: -5, vel: 0.86 },
    ] },
    afterTheOne(4),
  ],
  comp: [skank(5), halfChop(4), doubleSkank(3)],
  drums: [
    { name: 'rub-a-dub', weight: 7, voices: {
      bd: [8, 14],
      rim: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'rub-a-dub-open', weight: 4, voices: {
      bd: [8, 14],
      rim: [8],
      hh: [2, 6, 10, 14],
    } },
    oneDrop(3),
  ],
  melody: { leap: 0.24, ornament: 0.25, span: 12, sequence: 0.55, syncopation: 0.7 },
};

/**
 * SLENG TENG — February 1985, a Casiotone MT-40, and the end of the live band.
 *
 * Wayne Smith and Noel Davey found a preset on a small Casio keyboard, slowed it
 * down, and Jammy's cut it. Within two years the entire Jamaican record industry
 * was built on preset boxes, and the session musicians who had made everything
 * above this line were out of work. It is the most consequential single record in
 * the genre and it was made by two people who could not afford a band.
 *
 * The tables say so. The bass is the machine's own preset line — a shape,
 * repeated, with no player in it — and the drums are six sounds because the
 * MT-40's rhythm section had six sounds. `drumFills: false` because a preset box
 * has no fill; that is also enforced structurally by `canVary` once the era draws
 * a box, and it is stated here as well because a `programmed` machine *could* fill
 * and this riddim does not.
 *
 * The cross-stick is gone. Every other style above this one leans on `rim`, and
 * this one has no such sound available anywhere in the era's banks — see
 * `eras.ts`, which relaxes the genre's own rule about that for exactly this style.
 * The absence is the sound.
 */
const slengteng: Style = {
  id: 'slengteng',
  label: 'Sleng Teng',
  description:
    'The 1985 Casiotone preset that ended the live band: a machine bass line, six drum sounds, no cross-stick and no fills.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [70, 88],
  swing: 0,
  modeWeights: { minor: 0.7, major: 0.3 },
  relativeMajorChorus: 0,
  drumFills: false,
  excludeLayers: ['brass'],
  shots: OFFBEAT_SHOTS,
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6, note: 'One chord for eight bars, and this is not a simplification — the riddim is a preset and a preset does not change chord' },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['VII', 'VII', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 4 },
    ],
    outro: [
      { chords: ['i', 'i', 'i', 'i'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'bVII', 'bVII'], weight: 3 },
    ],
    chorus: [
      { chords: ['bVII', 'bVII', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [-4, 4, 8], weight: 5 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-2, 2, 4, 8], weight: 3 },
    { cell: [8, 8], weight: 3 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [8, 8], weight: 2 },
  ],
  /**
   * The preset. Six notes a bar, every bar, in a fixed shape — the one bass line
   * in this file that genuinely has nobody playing it, and the era's `sequenced`
   * table says so out loud.
   */
  bass: [
    { name: 'sleng-teng', weight: 7, hits: [
      { at: 0, dur: 2, tone: 0, vel: 0.98 },
      { at: 4, dur: 2, tone: 0, vel: 0.84 },
      { at: 6, dur: 2, tone: 3, vel: 0.86 },
      { at: 8, dur: 2, tone: 0, vel: 0.94 },
      { at: 12, dur: 2, tone: -2, vel: 0.86 },
      { at: 14, dur: 2, tone: 0, vel: 0.82 },
    ] },
    { name: 'preset-two', weight: 4, hits: [
      { at: 0, dur: 3, tone: 0, vel: 0.98 },
      { at: 6, dur: 2, tone: 7, vel: 0.86 },
      { at: 8, dur: 3, tone: 0, vel: 0.92 },
      { at: 14, dur: 2, tone: 10, vel: 0.82 },
    ] },
  ],
  comp: [skank(6), bubble(4), doubleSkank(3)],
  drums: [
    { name: 'sleng-teng-kit', weight: 7, voices: {
      bd: [0, 6],
      sd: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'sleng-teng-clap', weight: 4, voices: {
      bd: [0, 6],
      sd: [8],
      cp: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'preset-rock', weight: 3, voices: {
      bd: [0, 8],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  melody: { leap: 0.28, ornament: 0.18, span: 12, sequence: 0.65, syncopation: 0.6 },
};

/**
 * DANCEHALL — 1985–89, the digital riddim as a form rather than as an accident.
 *
 * What Sleng Teng started, this is what it became once producers stopped copying
 * one preset and started programming their own: a kick pattern with four events in
 * it instead of two, a clap where the cross-stick was, a synth bass, and a stab
 * on the offbeat that is doing the job the guitar used to do.
 *
 * The kick figure is the identity — slots 0, 6, 8 and 14 — and it is worth reading
 * against the one drop above. The one drop empties beat one. This fills it, and
 * then fills the two offbeats either side of the middle of the bar, so the bar has
 * four kicks in it and none of them on beat two or beat four. It is a completely
 * different bar that arrives at the same lopsidedness by the opposite route.
 */
const dancehall: Style = {
  id: 'dancehall',
  label: 'Dancehall',
  description:
    'The programmed riddim: four kicks a bar and none of them on two or four, a clap where the cross-stick was, and a synth stab on the offbeat.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [88, 108],
  swing: 0,
  modeWeights: { minor: 0.7, major: 0.3 },
  relativeMajorChorus: 0,
  shots: OFFBEAT_SHOTS,
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    bridge: [
      { chords: ['VI', 'VI', 'iv', 'iv', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['VII', 'VII', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'I', 'I', 'bVII', 'bVII'], weight: 4 },
      { chords: ['I', 'I', 'vi', 'vi', 'IV', 'IV', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 4 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [2, 2, 4, 8], weight: 5 },
    { cell: [-2, 2, 4, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'dancehall-riff', weight: 6, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.86 },
      { at: 8, dur: 2, tone: 10, vel: 0.9 },
      { at: 14, dur: 2, tone: 7, vel: 0.84 },
    ] },
    { name: 'dancehall-drive', weight: 5, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 3, dur: 1, tone: 0, vel: 0.76 },
      { at: 6, dur: 2, tone: 3, vel: 0.84 },
      { at: 8, dur: 2, tone: 0, vel: 0.92 },
      { at: 12, dur: 2, tone: 7, vel: 0.86 },
    ] },
    afterTheOne(4),
  ],
  comp: [skank(6), doubleSkank(4), bubble(3)],
  drums: [
    { name: 'dancehall', weight: 7, voices: {
      bd: [0, 6, 8, 14],
      sd: [4, 12],
      cp: [12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'dancehall-sparse', weight: 4, voices: {
      bd: [0, 6, 8, 14],
      cp: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'dancehall-one-drop', weight: 3, voices: {
      bd: [8, 14],
      cp: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  melody: { leap: 0.32, ornament: 0.2, span: 13, sequence: 0.6, syncopation: 0.65 },
};

/**
 * RAGGA — 1988–92, and the fastest music here since ska.
 *
 * Raggamuffin: dancehall with the tempo up, the kick in sixteenths, the melody
 * reduced to a hook of four or five notes, and a DJ doing everything else. The
 * loop is short and it is meant to be — `hook: 'earworm'` is the honest setting
 * for a style whose entire proposition is the same two bars three hundred times.
 *
 * It is also where the genre's harmony finally stops moving. Most of these tables
 * are one chord, and the ones that are not are two chords a bar apart, which is
 * fast for this genre and still slower than anything else in the project.
 */
const ragga: Style = {
  id: 'ragga',
  label: 'Ragga',
  description:
    'Raggamuffin, 1990: the kick in sixteenths, one chord, a hook of five notes, and the same two bars three hundred times.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [96, 124],
  swing: 0,
  modeWeights: { minor: 0.75, major: 0.25 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  shots: OFFBEAT_SHOTS,
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 },
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'VII', 'i', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 3, note: 'A chord a bar, which in this genre counts as harmonic motion and in any other would be a vamp' },
    ],
    chorus: [
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 4 },
    ],
    outro: [
      { chords: ['i', 'i', 'i', 'i'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'bVII', 'bVII', 'I', 'I', 'bVII', 'bVII'], weight: 3 },
    ],
    chorus: [
      { chords: ['bVI', 'bVII', 'I', 'I', 'bVI', 'bVII', 'I', 'I'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [2, 2, 4, 8], weight: 5 },
    { cell: [2, 2, 2, 2, 8], weight: 5 },
    { cell: [-2, 2, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [-4, 2, 2, 8], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    { name: 'ragga-riff', weight: 7, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 3, dur: 1, tone: 0, vel: 0.78 },
      { at: 6, dur: 2, tone: -2, vel: 0.86 },
      { at: 8, dur: 2, tone: 0, vel: 0.94 },
      { at: 11, dur: 1, tone: 3, vel: 0.78 },
      { at: 14, dur: 2, tone: 0, vel: 0.84 },
    ] },
    { name: 'ragga-sub', weight: 4, hits: [
      { at: 0, dur: 6, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 0, vel: 0.9 },
      { at: 14, dur: 2, tone: 10, vel: 0.82 },
    ] },
  ],
  comp: [skank(6), doubleSkank(5)],
  drums: [
    { name: 'ragga', weight: 7, voices: {
      bd: [0, 3, 8, 11],
      sd: [4, 12],
      cp: [12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'ragga-sixteenths', weight: 4, voices: {
      bd: [0, 3, 8, 11],
      sd: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    } },
    { name: 'ragga-half', weight: 3, voices: {
      bd: [0, 6, 8],
      sd: [8],
      cp: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  melody: { leap: 0.3, ornament: 0.15, span: 11, sequence: 0.7, syncopation: 0.6 },
};

export const STYLES: Record<string, Style> = Object.fromEntries(
  [
    mento, shuffle, ska,
    rocksteady, skinhead,
    onedrop, rockers, steppers, flyers, roots, dub, nyabinghi, lovers,
    bubbleStyle, horns, twotone, dubpoetry,
    rubadub, slengteng, dancehall, ragga,
  ].map((s) => [s.id, s]),
);
