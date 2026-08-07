/**
 * The Indian catalogue, sorted by **rāga character against tāla**.
 *
 * Every other genre here sorts by something the ear can hear in four bars —
 * iskelmä by which dance, jazz by which decade of the idiom, synth by which
 * machine is in charge, ambient by what the sound is made of. None of those
 * axes survives the crossing. This music has one instrument doing one thing —
 * a line, alone, over a drone — for as long as the piece lasts, and what makes
 * one piece different from the next is not its texture, its production or its
 * ensemble. It is **which pitch set the line is confined to, and how many
 * beats the cycle has.**
 *
 * That is not a claim invented to fit the engine; it is how the music names
 * itself. A performance is announced as *Rāg Yaman, vilambit ektāl* — a scale
 * and a cycle, in that order, and nothing else. Sorting by mood would collapse
 * a dawn rāga and a midnight rāga into one entry; sorting by tempo would put
 * a fast dhrupad next to a fast film song, which is two musics with nothing in
 * common but a metronome mark. Sorting by rāga and tāla keeps twenty-five
 * entries distinct, and each one is a thing a musician would agree is a thing.
 *
 * ## One mātrā is one eighth note, everywhere
 *
 * A tāla is counted in **mātrās** — teentāl has sixteen, jhaptāl ten, rupak
 * seven — grouped into **vibhāgs**, which is the same idea `Style.groups`
 * already carries. The engine counts in quarter notes, so a mapping has to be
 * chosen, and there are only two candidates: a mātrā is a quarter, or a mātrā
 * is an eighth.
 *
 * A mātrā is an eighth here, and the argument is arithmetic rather than taste.
 * At a quarter, teentāl's bar is sixteen quarters, which is sixty-four
 * sixteenths — every melodic cell in this file would have to be written to
 * sixty-four slots, and a single chord would have to cover eight seconds of
 * music. At an eighth, teentāl is `beatsPerBar: 8` and thirty-two sixteenths,
 * which is a bar the tables can actually state, and the mātrā rate comes out
 * at twice the printed BPM — so a drut teentāl at 120 BPM is 240 mātrās a
 * minute, which is what a drut teentāl is.
 *
 * The mapping pays a dividend nobody designed for: with `beatUnit: 8`, every
 * tāla prints as its own mātrā count. `timeSignature` turns `beatsPerBar: 8`
 * into 16/8, `5` into 10/8, `3.5` into 7/8, `2.5` into 5/8 — teentāl, jhaptāl,
 * rupak and khaṇḍa chāpu, each announcing how many beats it has. Nothing had
 * to be told; the arithmetic already agreed.
 *
 * ## The tāla is a shared object, and that is the point of the file
 *
 * Below the rāga tables sit nine `Tala` records, one per cycle. Each carries
 * the bar length, the vibhāg grouping, the melodic cells written to that bar,
 * the drone patterns, and — the part that matters most — **the theka**, the
 * fixed stroke pattern that *is* the tāla's identity. A tabla bol is not
 * decoration laid over a metre: teentāl and its theka are the same fact said
 * twice, and a player who put a rock backbeat in sixteen would not be playing
 * teentāl slowly, they would be playing something else.
 *
 * Styles spread a tāla in and add a rāga pair. Two styles sharing a tāla share
 * every rhythmic table by construction, which is correct — a bandish and a
 * tarānā in teentāl really are accompanied identically — and it means the axis
 * this file claims to sort by is the axis the code is actually built on.
 *
 * ## Five things that are true of every entry
 *
 *  - **The harmony does not move.** Nearly every style's whole progression is
 *    one chord, stated and held: `Isus4` is Sa–Ma–Pa and `Isus2` is Sa–Re–Pa,
 *    which are the two tunings a tanpura's drone strings actually take. Only
 *    the four filmi styles have chords in the sense the rest of this project
 *    means the word, because only filmi had an orchestra in it.
 *  - **The chorus never lifts to the relative major.** `relativeMajorChorus: 0`
 *    throughout. A rāga is the piece; leaving it is not a modulation, it is
 *    stopping.
 *  - **Nothing swings.** `swing: 0` on all twenty-five. The mātrās of a tāla
 *    are equal by definition. What sounds elastic in this music is where the
 *    ornaments fall, not where the grid is.
 *  - **The ornament numbers are the highest in the project.** `meend`, `kan`,
 *    `murki`, `gamak` — the slide between two swaras, the grace note lifted
 *    from the one above, the turn — are not applied to a phrase here, they are
 *    what the phrase is made of. Every style sets `ornament` between 0.3 and
 *    0.55, against jazz's 0.08 and iskelmä's 0.2, and `leap` sits low to match:
 *    a rāga phrase walks, and the ornament is what happens between the steps.
 *  - **`breakCarrier: 'pad'` — the śruti box is what is left holding a break.**
 *    The default is the bass, and the bass here is the tanpura: `tanpura()`
 *    below writes six notes into an eight-bar section, all of them in its first
 *    bar, because `sustain: true` means the drone is stated once and left to
 *    ring. Hand it a seam three bars later and the bar comes out with nothing
 *    in it at all — 9 of 622 drawn breaks across this catalogue, measured with
 *    every style's palette forced and 30 seeds each, and 9 of the 10 the whole
 *    project produced. What is actually still sounding there is the śruti box,
 *    a reed organ or a harmonium holding one note through the whole section,
 *    which is `pad` in this genre's palette and is the one thing in this room
 *    nobody ever switches off. Under `pad` the count is **0**, and `melody` —
 *    the tempting name for a break at the end of a taan — is 82, nine times
 *    worse, for the reason `playBreak` gives: a line that has finished its
 *    phrase is precisely what is not there at a seam.
 *
 *    Stated on all twenty-eight rather than on the ones that draw seam gestures,
 *    and the field is free either way — it is read, never drawn, so a style that
 *    names one takes no number out of any stream. **That bet has now paid**:
 *    when the shot stopped naming a kit the palette went from five styles to
 *    seventeen, and not one of the twelve that took one needed a line adding
 *    here, because the answer to *who is left holding the bar* never depended on
 *    which styles were asking. `requireLayers: ['pad']` is on every entry, so
 *    the box is always sounding and is always the answer — measured again over
 *    the whole catalogue with every palette forced, **0 empty break bars out of
 *    1 912**. A field that has to be remembered later is a field that will be
 *    forgotten.
 *  - **Seventeen of the twenty-eight draw a seam gesture, and eleven refuse.**
 *    The gesture is the *tihai*, and it is a `shot`: see the long note on
 *    `transitions` in `index.ts` for what the mechanism writes today, which is
 *    doum strokes on the vibhāg heads and nothing else, and for how the eleven
 *    were sorted out from the seventeen. Each refusal states its own reason at
 *    its own entry, because they are eleven different reasons and none of them
 *    is about the engine any more.
 */

import type { Pc } from '../../core/pitch.js';
import { makeScale, type Mode, type Scale, type ScaleName } from '../../core/scale.js';
import type {
  BassPattern, CompPattern, DrumPattern, Style, WeightedCell,
} from '../../style/types.js';

// ---------------------------------------------------------------------------
// Rāgas, and what a rāga is not
// ---------------------------------------------------------------------------

/**
 * The rāga, as a pitch set, which is a fraction of what a rāga is.
 *
 * This has to be said plainly and first, because everything below is built on
 * an admitted simplification and a reader who does not know that will think
 * the tables claim more than they do.
 *
 * **A rāga is not a scale.** It is an *ārohaṇa* and an *avarohaṇa* — an
 * ascending line and a descending one, frequently with different notes in
 * them and almost always with different orders; a *vādī* and a *samvādī*, the
 * swara the phrases lean on and the one that answers it; a set of characteristic
 * phrases, the *pakaḍ*, by which the rāga is recognised in three notes; a
 * *nyāsa* set, the swaras a phrase may come to rest on; and a time of day it
 * belongs to. Bhoopali and Deshkar have the same five notes and are different
 * rāgas, because one leans on Ga and the other on Dha. Nothing below can express
 * that. What is modelled here is the pitch set and the tonic, and the pitch set
 * is the smallest part of the answer.
 *
 * **And the pitches are equal-tempered.** A shruti is not a quarter tone and it
 * is not a rounding error — the komal gandhar of Darbari sits measurably lower
 * than the komal gandhar of Bhairavi, and the difference is one of the two or
 * three things that separate those rāgas by ear. Twelve-tone equal temperament
 * has one note there. This is a scope decision rather than an oversight: the
 * engine's pitch is MIDI-integer end to end, from `Pc` through `degreeToMidi` to
 * both renderers, so a genre cannot introduce microtones without changing what
 * a pitch *is* everywhere. So: no shrutis, and no oscillation around them. The
 * melodic gestures that carry the microtonality — the slow āndolan on the komal
 * dha of Darbari, the way Miyan ki Todi's komal re is approached from below —
 * are absent, and the rāgas that are *mostly* those gestures are absent with
 * them.
 *
 * **Three rāgas named in the brief could not be built at all when this was
 * written, and all three have rows of their own now.** The reason they could
 * not is the one `core/scale.ts` still states at the top of its non-Western
 * block, and it is unchanged: a scale is a `tonic` and a `name` together, and
 * `makeScale` fixes degree 0 at the tonic, so no rotation of an existing entry
 * is reachable. The answer was not a mechanism but three more rows —
 * `durga: [0, 2, 5, 7, 9]`, `malkauns: [0, 3, 5, 8, 10]` and
 * `hansadhwani: [0, 2, 4, 7, 11]`, which are exactly the three pitch-class sets
 * listed below. `core/scale.ts` points back at this paragraph by name where it
 * documents `hansadhwani`, and its `majorPentatonic` docstring records that the
 * Durga confusion was a mistake *in that comment* which this genre caught.
 *
 * **Nothing here has been moved onto them**, which is why the list below is
 * kept rather than deleted: it is still an accurate account of what this file
 * plays today. `BHOOPALI` and `DHANI` are named by exactly three styles —
 * `jhala`, `tarana` and `dhun`, each as `raga(BHOOPALI, DHANI)` — and
 * Hansadhwani is named by none, so the fourteen in the constant table below is
 * still fourteen. What has changed is the *kind* of statement this is: an
 * unadopted row rather than an impossibility. Adopting one changes which notes
 * three styles sound and wants its own listening pass, which is why it is not
 * done here.
 *
 *  - **Malkauns** is S g m d n — `[0, 3, 5, 8, 10]`. Its intervals are a
 *    rotation of `minorPentatonic`'s, so the pitch classes exist in the table
 *    and the *tonic* does not. Asking for `minorPentatonic` gives
 *    `[0, 3, 5, 7, 10]`, which is a real and different rāga — Dhani — with a
 *    Pa where Malkauns has none. A Malkauns with a perfect fifth in it is not a
 *    Malkauns held wrong, it is Dhani. So the style that wanted Malkauns is
 *    written on Dhani and is named Dhani.
 *  - **Durga** is S R m P D — `[0, 2, 5, 7, 9]`, a rotation of `majorPentatonic`
 *    and unreachable for the same reason. `core/scale.ts` names Durga in its
 *    `majorPentatonic` docstring; the pitch classes are indeed available a
 *    fourth away, and the tonic is not, which is precisely the trap that
 *    docstring's own opening paragraph warns about. Bhoopali is the one this
 *    entry actually is.
 *  - **Hansadhwani** is S R G P N — `[0, 2, 4, 7, 11]`. That is not in the
 *    table in any rotation, and there is no five-note entry it could be built
 *    from. Left out.
 *
 * What is left is fourteen, and they are the ones that map onto twelve notes
 * without argument.
 */
type Raga = ScaleName;

/** Rāgas with a śuddh Ga — a major third. These sit on the major side. */
const YAMAN: Raga = 'lydian';               // Kalyani. Tīvra Ma; no śuddh Ma at all.
const BILAWAL: Raga = 'major';              // Shankarabharanam. The plain major.
const KHAMAJ: Raga = 'mixolydian';          // Harikambhoji. Komal Ni descending.
const BHAIRAV: Raga = 'doubleHarmonic';     // Mayamalavagowla. Komal Re and komal Dha.
const CHARUKESI: Raga = 'harmonicMajor';    // Major with komal Dha — the ache in a major key.
const BASANT_MUKHARI: Raga = 'phrygianDominant'; // Vakulabharanam. Bhairav with a komal Ni.
const BHOOPALI: Raga = 'majorPentatonic';   // S R G P D. No Ma, no Ni.

/** Rāgas with a komal Ga — a minor third. These sit on the minor side. */
const KAFI: Raga = 'dorian';                // Kharaharapriya. Komal Ga and komal Ni.
const ASAVARI: Raga = 'minor';              // Natabhairavi. The plain aeolian set.
const BHAIRAVI: Raga = 'phrygian';          // Hanumatodi. All four komal swaras.
const KIRWANI: Raga = 'harmonicMinor';      // Keeravani. Śuddh Ni over a komal Ga.
const GAURIMANOHARI: Raga = 'melodicMinor'; // Śuddh Dha and Ni over a komal Ga.
const SIMHENDRA: Raga = 'hungarianMinor';   // Simhendramadhyamam. Tīvra Ma and śuddh Ni.
const DHANI: Raga = 'minorPentatonic';      // S g m P n. What Malkauns is not.

/**
 * A style's rāga pair, resolved by mode.
 *
 * **`mode` is the only thing the hook is given that varies from song to song**,
 * and this is what it is spent on. `scaleForChord(tonic, mode, chord)` is
 * called per chord with no access to the song's seed, its era or anything else,
 * so a style that wanted two rāgas has exactly one lever — and the lever turns
 * out to be the right one anyway, because it is not free.
 *
 * The roman numerals are read relative to the mode: a song in minor gets `i`,
 * a minor triad, and a song in major gets `I`. So a rāga with a śuddh Ga has to
 * be on the major side and one with a komal Ga on the minor side, or the drone
 * chord under the line contains a third the rāga does not have. Every pair
 * below is one of each, and `modeWeights` on the style is the statement about
 * which of the two that style is more often in.
 *
 * The chord itself is ignored, completely and on purpose. See `index.ts`.
 */
const raga = (major: Raga, minor: Raga) =>
  (tonic: Pc, mode: Mode): Scale => makeScale(tonic, mode === 'minor' ? minor : major);

// ---------------------------------------------------------------------------
// The drone
// ---------------------------------------------------------------------------

/**
 * One chord, held, for the length of the piece — and which one is a real
 * question with a real answer.
 *
 * A tanpura has four strings. Three are tuned to Sa, in two octaves. The fourth
 * is tuned to **Pa** for most rāgas, to **Ma** for the rāgas that have no Pa,
 * and to **komal Ni** for a handful including Bhairav — so the drone is not
 * generic, it is chosen for the rāga, and choosing it is the first thing that
 * happens at a concert. `Isus4` is Sa–Ma–Pa and `Isus2` is Sa–Re–Pa: three
 * notes each, no third in either, which is the whole requirement. A tanpura
 * states the tonic and the fifth and refuses to state anything that would make
 * them a chord.
 *
 * Which of the two a style gets is decided by its rāga pair rather than by
 * taste. `Isus4` needs a śuddh Ma in both rāgas; `Isus2` needs a śuddh Re in
 * both. Yaman and Simhendramadhyamam have tīvra Ma and therefore take `Isus2`;
 * Bhairav and Bhairavi have komal Re and therefore take `Isus4`. A style whose
 * pair shares neither gets the plain triad and needs a table per mode, which is
 * the one place in this file the two modes are written out separately.
 */
const held = (chord: string) => ({
  intro: [{ chords: [chord, chord, chord, chord], weight: 1 }],
  verse: [{ chords: [chord, chord, chord, chord, chord, chord, chord, chord], weight: 1 }],
  chorus: [{ chords: [chord, chord, chord, chord, chord, chord, chord, chord], weight: 1 }],
  solo: [{ chords: [chord, chord, chord, chord, chord, chord, chord, chord], weight: 1 }],
  bridge: [{ chords: [chord, chord, chord, chord, chord, chord, chord, chord], weight: 1 }],
  outro: [{ chords: [chord, chord, chord, chord], weight: 1 }],
});

/**
 * The tanpura, as a bass part.
 *
 * `sustain: true` on both, and it is the single most load-bearing flag in the
 * genre. Without it the drone is re-struck on every downbeat, which turns the
 * floor of the music into a part — a bass playing semibreves. `BassPattern.sustain`
 * says this in its own docstring and ambient rests on it for the same reason;
 * here it is worse, because a tanpura is not merely sustained, it is *never
 * articulated by the music at all*. The player sits behind the ensemble and
 * cycles the four strings for forty minutes without reference to anything.
 */
const tanpura = (bar: number): BassPattern[] => [
  { name: 'sa', weight: 8, sustain: true, hits: [{ at: 0, dur: bar, tone: 'root', vel: 0.8 }] },
  {
    name: 'sa-pa', weight: 5, sustain: true, hits: [
      { at: 0, dur: bar, tone: 'root', vel: 0.8 },
      { at: 0, dur: bar, tone: 'fifth', vel: 0.5 },
    ],
  },
];

/**
 * The harmonium, the śruti box and the swarmandal — everything in the room
 * that sounds more than one note at once and is not the tanpura.
 *
 * All three are drones with different attacks on them, which is why they are
 * one table. A harmonium held under a khyal is a bellows opened and left open;
 * a swarmandal is the singer's own small zither, strummed across all its
 * strings between phrases and never in time with anything. The arpeggio pattern
 * is that strum: four hits, `updown`, so the sweep turns over rather than
 * restarting, and nothing lands on the second half of the bar.
 *
 * No `voicing: 'quartal'` anywhere in this file. Seven of the fourteen rāgas
 * above have gaps a quartal stack cannot survive and two of them have only five
 * notes; a quartal voicing over a pentatonic is a stack of degree subsets that
 * do not exist. `tertian` over a sus chord is three notes, which is the whole
 * chord, which is what was wanted.
 */
const harmonium = (bar: number): CompPattern[] => [
  { name: 'bellows', weight: 7, voices: 3, sustain: true, hits: [{ at: 0, dur: bar, vel: 0.32 }] },
  {
    name: 'half-cycle', weight: 3, voices: 3, hits: [
      { at: 0, dur: bar / 2 - 1, vel: 0.32 },
      { at: bar / 2, dur: bar / 2 - 1, vel: 0.28 },
    ],
  },
  {
    name: 'swarmandal', weight: 3, voices: 4, arpeggio: true, arpDirection: 'updown', hits: [
      { at: 0, dur: 2, vel: 0.34 },
      { at: 2, dur: 2, vel: 0.28 },
      { at: 4, dur: 2, vel: 0.3 },
      { at: 6, dur: 2, vel: 0.26 },
    ],
  },
];

const NO_DRUMS: DrumPattern[] = [{ name: 'none', weight: 1, voices: {} }];

// ---------------------------------------------------------------------------
// The tālas
// ---------------------------------------------------------------------------

/**
 * Everything a cycle decides, which is everything except the notes.
 *
 * A `Tala` is spread into a style. What the style then adds is a rāga pair, a
 * tempo band, a name and an argument — which is a fair description of what
 * distinguishes two pieces in the same tāla, and an unfair one only in that the
 * real distinction is also the pakaḍ, which is not modelled.
 */
interface Tala {
  beatsPerBar: number;
  beatUnit: number;
  groups?: number[];
  melodyCells: WeightedCell[];
  cadenceCells: WeightedCell[];
  bass: BassPattern[];
  comp: CompPattern[];
  drums: DrumPattern[];
}

/**
 * ## How a theka is written on three strokes
 *
 * `DrumVoice` gained `lp`, `mp` and `hp` — the low, mid and high strokes of a
 * hand drum — and its own docstring makes the argument for naming them by
 * position rather than by instrument. This file is the first consumer, so the
 * mapping from a tabla player's vocabulary onto them is set out here once and
 * used unchanged in all nine tables below:
 *
 *   ge / ghe   the open bāyāṅ, the left hand's ringing bass       →  `lp`
 *   nā / tā    the dāyāṅ struck at the rim, open and pitched      →  `mp`
 *   tin / te   the dāyāṅ damped — dry, high, no ring              →  `hp`
 *   dhā        ge and nā struck **together**                      →  `lp` + `mp`
 *   dhin       ge and tin struck **together**                     →  `lp` + `hp`
 *   kat        the bāyāṅ slapped flat, damped                     →  `hp`
 *
 * The compound bols are the reason this is worth writing down. **Dhā is not a
 * stroke, it is two hands landing at once** — and the whole audible difference
 * between dhā and tā, which is the difference between the filled half of a tāla
 * and its khālī half, is whether the left hand is there. Written on one voice
 * that distinction is inexpressible; written on two it is a slot appearing in
 * `lp` and nothing else changing. Every theka below is built by writing out the
 * bols and then reading the three voices off them.
 *
 * The mridangam's *thom*, *nam* and *ki* take the same three, which is what
 * makes the four Carnatic tables below the same kind of object as the five
 * Hindustani ones despite the drum being a different drum played a different
 * way.
 */

/**
 * TEENTĀL — sixteen mātrās in four vibhāgs of four, and the tāla that anything
 * not otherwise specified is in.
 *
 * `dhā dhin dhin dhā | dhā dhin dhin dhā | dhā tin tin tā | tā dhin dhin dhā`
 *
 * Read the `lp` row and the structure is immediately visible: the left hand
 * plays through the first two vibhāgs and the last, and vanishes for the third
 * and the head of the fourth. That absence is the **khālī** — the empty vibhāg
 * — and it is how anybody in the room knows where in a sixteen-beat cycle they
 * are without counting. The `hp` row is its negative: tin appears exactly where
 * nā does not.
 */
const TEENTAL: Tala = {
  beatsPerBar: 8,
  beatUnit: 8,
  groups: [8, 8, 8, 8],
  melodyCells: [
    { cell: [8, 8, 8, 8], weight: 5 },
    { cell: [16, 16], weight: 5 },
    { cell: [-8, 8, 8, 8], weight: 4 },
    { cell: [4, 4, 8, 8, 8], weight: 4 },
    { cell: [8, 8, 16], weight: 4 },
    { cell: [-16, 16], weight: 3 },
    { cell: [4, 4, 4, 4, 8, 8], weight: 3 },
    { cell: [6, 2, 8, 16], weight: 3 },
    { cell: [32], weight: 3 },
    { cell: [8, 4, 4, 8, 8], weight: 2 },
    { cell: [2, 2, 4, 8, 8, 8], weight: 2 },
    { cell: [-4, 4, 8, 8, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [32], weight: 6 },
    { cell: [-8, 24], weight: 3 },
    { cell: [16, 16], weight: 3 },
    { cell: [-4, 28], weight: 2 },
  ],
  bass: tanpura(32),
  comp: harmonium(32),
  drums: [
    {
      name: 'theka', weight: 6, voices: {
        lp: [0, 2, 4, 6, 8, 10, 12, 14, 16, 26, 28, 30],
        mp: [0, 6, 8, 14, 16, 22, 24, 30],
        hp: [2, 4, 10, 12, 18, 20, 26, 28],
      },
    },
    // The same theka with the interior bols left out — what a tabla player
    // actually does under a slow piece, where the gaps are filled by the
    // soloist rather than by the drum.
    {
      name: 'theka-open', weight: 4, voices: {
        lp: [0, 6, 8, 14, 16, 28],
        mp: [0, 8, 16, 24, 30],
        hp: [4, 12, 20, 26],
      },
    },
    // Laggi: the light, fast figure a player drops into at a climax. The low
    // hand marks the vibhāgs and the two right-hand strokes alternate under it.
    {
      name: 'laggi', weight: 3, voices: {
        lp: [0, 8, 16, 24],
        mp: [2, 6, 10, 14, 18, 22, 26, 30],
        hp: [3, 7, 11, 15, 19, 23, 27, 31],
      },
    },
  ],
};

/**
 * EKTĀL and CHAUTĀL — twelve mātrās in six vibhāgs of two.
 *
 * `dhin dhin | dhāge tirakiṭa | tu nā | kat tā | dhāge tirakiṭa | dhī nā`
 *
 * Two of those bols are compound and occupy one mātrā each, which is why the
 * rows below have strokes on odd sixteenths where nothing else in this file
 * does: *dhāge* is two strokes inside one beat and *tirakiṭa* is four, thinned
 * to two because a sixteenth is the grid's floor and four would need
 * thirty-seconds.
 *
 * The tāla of the slow khyal and, as chautāl on the pakhāwaj, of dhrupad —
 * which is the reason it is here twice under two names.
 */
const EKTAL: Tala = {
  beatsPerBar: 6,
  beatUnit: 8,
  groups: [4, 4, 4, 4, 4, 4],
  melodyCells: [
    { cell: [8, 8, 8], weight: 5 },
    { cell: [12, 12], weight: 4 },
    { cell: [-8, 8, 8], weight: 4 },
    { cell: [4, 4, 8, 8], weight: 4 },
    { cell: [24], weight: 3 },
    { cell: [8, 16], weight: 3 },
    { cell: [6, 2, 8, 8], weight: 3 },
    { cell: [4, 4, 4, 4, 8], weight: 3 },
    { cell: [-4, 4, 8, 8], weight: 2 },
    { cell: [2, 2, 4, 8, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [24], weight: 6 },
    { cell: [-8, 16], weight: 3 },
    { cell: [12, 12], weight: 3 },
    { cell: [-4, 20], weight: 2 },
  ],
  bass: tanpura(24),
  comp: harmonium(24),
  drums: [
    {
      name: 'theka', weight: 6, voices: {
        lp: [0, 2, 4, 5, 8, 16, 17, 20],
        mp: [4, 10, 14, 16, 22],
        hp: [0, 2, 6, 7, 12, 18, 19, 20],
      },
    },
    {
      name: 'theka-open', weight: 4, voices: {
        lp: [0, 4, 8, 16, 20],
        mp: [10, 14, 22],
        hp: [0, 6, 12, 18],
      },
    },
  ],
};

/**
 * JHAPTĀL — ten mātrās, and the grouping is the whole character: 2+3+2+3.
 *
 * `dhī nā | dhī dhī nā | tī nā | dhī dhī nā`
 *
 * The two long vibhāgs are the third and the last, so the cycle leans forward
 * twice and lands. Note what happens at mātrā 6: *tī*, the damped stroke, where
 * the parallel place in the first half had *dhī*. That is the khālī again — one
 * vibhāg with the left hand taken out — and it is why jhaptāl cannot be heard
 * as five plus five.
 */
const JHAPTAL: Tala = {
  beatsPerBar: 5,
  beatUnit: 8,
  groups: [4, 6, 4, 6],
  melodyCells: [
    { cell: [4, 6, 4, 6], weight: 5 },
    { cell: [20], weight: 4 },
    { cell: [10, 10], weight: 4 },
    { cell: [-4, 6, 4, 6], weight: 3 },
    { cell: [8, 4, 8], weight: 3 },
    { cell: [4, 4, 4, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 8], weight: 3 },
    { cell: [-6, 6, 4, 4], weight: 2 },
    { cell: [2, 2, 4, 4, 8], weight: 2 },
    { cell: [12, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [20], weight: 6 },
    { cell: [-4, 16], weight: 3 },
    { cell: [10, 10], weight: 3 },
    { cell: [4, 6, 10], weight: 2 },
  ],
  bass: tanpura(20),
  comp: harmonium(20),
  drums: [
    {
      name: 'theka', weight: 6, voices: {
        lp: [0, 4, 6, 14, 16],
        mp: [2, 8, 12, 18],
        hp: [0, 4, 6, 10, 14, 16],
      },
    },
    {
      name: 'theka-open', weight: 4, voices: {
        lp: [0, 6, 16],
        mp: [2, 8, 12, 18],
        hp: [4, 10, 14],
      },
    },
  ],
};

/**
 * RUPAK — seven mātrās, 3+2+2, and **the sam is khālī.**
 *
 * `tin tin nā | dhin nā | dhin nā`
 *
 * Every other tāla in this file puts its heaviest stroke on the first beat.
 * This one puts a damped one there and does not bring the left hand in until
 * mātrā 4, so the cycle begins with the drum at its quietest and fills as it
 * goes. There is no other metre in this project like it and the `lp` row is the
 * shortest here for exactly that reason — two strokes in seven beats.
 *
 * It also means `metricStrength` and the theka disagree about where the weight
 * is, and they are both right: the *count* starts at mātrā 1, the *sound* does
 * not. That disagreement is what makes rupak feel like it is falling forward.
 */
const RUPAK: Tala = {
  beatsPerBar: 3.5,
  beatUnit: 8,
  groups: [6, 4, 4],
  melodyCells: [
    { cell: [6, 4, 4], weight: 5 },
    { cell: [14], weight: 4 },
    { cell: [-6, 4, 4], weight: 3 },
    { cell: [6, 8], weight: 3 },
    { cell: [2, 4, 4, 4], weight: 3 },
    { cell: [10, 4], weight: 3 },
    { cell: [4, 2, 4, 4], weight: 2 },
    { cell: [6, 4, 2, 2], weight: 2 },
    { cell: [-2, 4, 4, 4], weight: 2 },
    { cell: [2, 2, 2, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [14], weight: 6 },
    { cell: [-4, 10], weight: 3 },
    { cell: [6, 8], weight: 3 },
    { cell: [-6, 8], weight: 2 },
  ],
  bass: tanpura(14),
  comp: harmonium(14),
  drums: [
    {
      name: 'theka', weight: 6, voices: {
        lp: [6, 10],
        mp: [4, 8, 12],
        hp: [0, 2, 6, 10],
      },
    },
    {
      name: 'theka-filled', weight: 4, voices: {
        lp: [6, 10, 12],
        mp: [4, 8, 12],
        hp: [0, 2, 3, 6, 10, 11],
      },
    },
  ],
};

/**
 * DĀDRĀ — six mātrās, 3+3. The tāla of thumri, ghazal and half the light music
 * there is.
 *
 * `dhā dhin nā | dhā tin nā`
 *
 * The two halves are the same three bols with the left hand removed from the
 * middle one, which is the smallest possible statement of the filled/khālī
 * idea and, at six beats, the one a listener picks up fastest.
 */
const DADRA: Tala = {
  beatsPerBar: 3,
  beatUnit: 8,
  groups: [6, 6],
  melodyCells: [
    { cell: [6, 6], weight: 5 },
    { cell: [12], weight: 4 },
    { cell: [4, 4, 4], weight: 4 },
    { cell: [-6, 6], weight: 3 },
    { cell: [2, 4, 6], weight: 3 },
    { cell: [8, 4], weight: 3 },
    { cell: [6, 4, 2], weight: 2 },
    { cell: [3, 3, 6], weight: 2 },
    { cell: [-2, 4, 6], weight: 2 },
    { cell: [2, 2, 2, 6], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 6 },
    { cell: [-4, 8], weight: 3 },
    { cell: [6, 6], weight: 3 },
    { cell: [-6, 6], weight: 2 },
  ],
  bass: tanpura(12),
  comp: harmonium(12),
  drums: [
    {
      name: 'theka', weight: 6, voices: {
        lp: [0, 2, 6],
        mp: [0, 4, 6, 10],
        hp: [2, 8],
      },
    },
    {
      name: 'laggi', weight: 4, voices: {
        lp: [0, 6],
        mp: [2, 4, 8, 10],
        hp: [3, 9],
      },
    },
  ],
};

/**
 * KEHERWĀ — eight mātrās, 4+4, played on the dholak more often than on the
 * tabla and underneath more music than every other tāla here put together.
 *
 * `dhā ge nā tī | nā ka dhī nā`
 *
 * Bhajan, qawwāli, bhangra, and every film song that is not in something else.
 * The `dholak` variant is the same cycle played on a two-headed barrel drum
 * with a hand at each end — busier, and with the low stroke on the offbeat,
 * which is what gives a keherwā its roll rather than its pulse.
 *
 * `cp` on the qawwāli variant is not a drum. It is the row of men at the back
 * clapping on mātrās 3 and 7, which in a qawwāli party is a section of the
 * ensemble with its own place on the stage.
 */
const KEHERWA: Tala = {
  beatsPerBar: 4,
  beatUnit: 8,
  groups: [8, 8],
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [-8, 8], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [-4, 4, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
    { cell: [2, 2, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 3 },
    { cell: [-8, 8], weight: 2 },
  ],
  bass: tanpura(16),
  comp: harmonium(16),
  drums: [
    {
      name: 'theka', weight: 5, voices: {
        lp: [0, 2, 12],
        mp: [0, 4, 8, 14],
        hp: [6, 10, 12],
      },
    },
    {
      name: 'dholak', weight: 5, voices: {
        lp: [0, 6, 8, 14],
        mp: [2, 4, 10, 12],
        hp: [3, 7, 11, 15],
      },
    },
    {
      name: 'qawwali-clap', weight: 4, voices: {
        lp: [0, 6, 8, 14],
        mp: [2, 10],
        hp: [3, 7, 11, 15],
        cp: [4, 12],
      },
    },
  ],
};

/**
 * ĀDI TĀLA — eight aksharas, 4+2+2, and the tāla most Carnatic music is in.
 *
 * The mridangam has no fixed theka the way the tabla does — a mridangam player
 * is composing sollus over the cycle rather than repeating a signature — so
 * what is written below is a plain ādi pattern rather than *the* pattern, and
 * that difference is worth stating because it is the largest single way the two
 * traditions are not the same music with different names.
 *
 * `thom` is the left hand, `nam` the ringing right, `ki` the damped right, and
 * the same three voices carry them.
 */
const ADI: Tala = {
  beatsPerBar: 4,
  beatUnit: 8,
  groups: [8, 4, 4],
  melodyCells: [
    { cell: [8, 4, 4], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [-8, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [12, 4], weight: 2 },
    { cell: [2, 2, 4, 8], weight: 2 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [-8, 8], weight: 2 },
  ],
  bass: tanpura(16),
  comp: harmonium(16),
  drums: [
    {
      name: 'sollu', weight: 6, voices: {
        lp: [0, 4, 12],
        mp: [0, 8],
        hp: [2, 6, 10, 14],
      },
    },
    {
      name: 'sollu-double', weight: 4, voices: {
        lp: [0, 4, 8, 12],
        mp: [0, 6, 14],
        hp: [2, 3, 10, 11],
      },
    },
  ],
};

/**
 * MISRA CHĀPU — seven aksharas, counted 3+2+2, the commonest odd tāla in
 * Carnatic music and the same length as rupak with a different weight in it.
 *
 * Where rupak empties its first vibhāg, chāpu accents it: the two are a fair
 * demonstration that a metre is not its beat count. The grouping numbers are
 * identical and the music is not.
 */
const MISRA_CHAPU: Tala = {
  beatsPerBar: 3.5,
  beatUnit: 8,
  groups: [6, 4, 4],
  melodyCells: [
    { cell: [6, 4, 4], weight: 5 },
    { cell: [14], weight: 4 },
    { cell: [2, 4, 4, 4], weight: 4 },
    { cell: [6, 8], weight: 3 },
    { cell: [-6, 4, 4], weight: 3 },
    { cell: [4, 2, 4, 4], weight: 3 },
    { cell: [10, 4], weight: 2 },
    { cell: [2, 2, 2, 4, 4], weight: 2 },
    { cell: [-2, 4, 4, 4], weight: 2 },
    { cell: [6, 2, 2, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [14], weight: 6 },
    { cell: [-4, 10], weight: 3 },
    { cell: [6, 8], weight: 3 },
    { cell: [-6, 8], weight: 2 },
  ],
  bass: tanpura(14),
  comp: harmonium(14),
  drums: [
    {
      name: 'sollu', weight: 6, voices: {
        lp: [0, 6, 10],
        mp: [0, 4],
        hp: [2, 8, 12],
      },
    },
    {
      name: 'sollu-double', weight: 4, voices: {
        lp: [0, 6, 10],
        mp: [0, 4, 8],
        hp: [2, 3, 12, 13],
      },
    },
  ],
};

/**
 * KHAṆḌA CHĀPU — five aksharas, 2+3. The shortest cycle here, and the one that
 * comes round before a listener has finished counting it.
 */
const KHANDA_CHAPU: Tala = {
  beatsPerBar: 2.5,
  beatUnit: 8,
  groups: [4, 6],
  melodyCells: [
    { cell: [4, 6], weight: 5 },
    { cell: [10], weight: 4 },
    { cell: [4, 2, 4], weight: 3 },
    { cell: [-4, 6], weight: 3 },
    { cell: [2, 2, 6], weight: 3 },
    { cell: [6, 4], weight: 3 },
    { cell: [4, 4, 2], weight: 2 },
    { cell: [2, 4, 4], weight: 2 },
    { cell: [-2, 2, 6], weight: 2 },
  ],
  cadenceCells: [
    { cell: [10], weight: 5 },
    { cell: [-4, 6], weight: 3 },
    { cell: [4, 6], weight: 3 },
    { cell: [-6, 4], weight: 2 },
  ],
  bass: tanpura(10),
  comp: harmonium(10),
  drums: [
    {
      name: 'sollu', weight: 6, voices: {
        lp: [0, 4],
        mp: [0, 6],
        hp: [2, 8],
      },
    },
    {
      name: 'sollu-double', weight: 4, voices: {
        lp: [0, 4],
        mp: [2, 6],
        hp: [3, 8, 9],
      },
    },
  ],
};

/**
 * NO TĀLA — the ālāp, the ālāpana, the jor and the tānam.
 *
 * A quarter of this repertoire has no metre at all, and the honest way to say
 * so in an engine that counts bars is to keep the bar as a *container* and take
 * the drum out. `beatsPerBar: 4` with no grouping and no percussion is not a
 * 4/4 piece; it is a piece with nowhere the beat is, and the tables below are
 * written so nothing implies one — whole-bar notes, leading rests, and a
 * cadence table that is almost entirely a single held note.
 *
 * The one thing the engine still imposes is a tempo, and there is no way around
 * it: a `Song` has a BPM and every renderer schedules against it. So an ālāp
 * here is a very slow piece rather than an unmeasured one, which is a real loss
 * and is stated rather than hidden. What survives is what actually identifies
 * the section by ear — no drum, one line, a drone under it, and phrases with
 * several seconds of air between them.
 */
const FREE: Tala = {
  beatsPerBar: 4,
  beatUnit: 4,
  melodyCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [-16], weight: 2 },
    { cell: [-12, 4], weight: 2 },
    { cell: [4, 12], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 8 },
    { cell: [-8, 8], weight: 3 },
    { cell: [-4, 12], weight: 2 },
  ],
  bass: tanpura(16),
  comp: harmonium(16),
  drums: NO_DRUMS,
};

// ---------------------------------------------------------------------------
// Hindustani — the North Indian tradition
// ---------------------------------------------------------------------------

/**
 * ĀLĀP — the rāga, alone, before anything has begun.
 *
 * Ten to forty minutes with no pulse, no drum and no composition: the soloist
 * introduces the rāga one swara at a time, dwelling on each until it has been
 * established, and only then admitting the next. That process has a name —
 * *baḍhat*, the unfolding — and it is the single most characteristic thing this
 * music does. Nothing else in this project is remotely like it.
 *
 * The pairing is Yaman against Simhendramadhyamam, which is not arbitrary: both
 * have **tīvra Ma**, the sharpened fourth, and both are therefore drones
 * without a Ma in them — `Isus2`, Sa–Re–Pa, the tanpura tuned to the second.
 * They are the two rāgas in this file that could not take `Isus4` if asked.
 *
 * `strictness: 'strict'` here and on `alapana` below, and nowhere else in the
 * genre. A note that lasts eight seconds is exposed the way nothing in a fast
 * piece is, and the smoothness rules are what stop a slow line wandering. The
 * rules that would fight the rāga are already turned off at the genre level, so
 * what `strict` adds here is the leap ceiling and the vertical checks, which is
 * exactly the right addition for a line that moves by step and lives on a drone.
 */
const alap: Style = {
  id: 'alap',
  label: 'Ālāp',
  description:
    'The rāga alone, unmetred, with no percussion. One line over a tanpura, a few notes at a time, with seconds of air between the phrases.',
  ...FREE,
  bpm: [40, 54],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  strictness: 'strict',
  hook: 'through',
  drumFills: false,
  excludeLayers: ['drums', 'brass', 'comp'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  // No transition palette, and the reason is the first line of the entry above:
  // there is no tāla. A tihai is an arithmetic gesture against a cycle, and this
  // form has no cycle, no drum and no sam to land on. Nor is the refusal a
  // formality — the band half of `playShot` hits the pitched layers whether or
  // not a drum answers it, and forcing a palette on here moved the tracks in 14
  // of 40 songs. Something would happen, and it would be wrong.
  // Two beats between answering notes. The counter here is the sārangī shadowing
  // the soloist a moment behind, and at the default eighth it would be a duet.
  counterSpacing: 2,
  scaleForChord: raga(YAMAN, SIMHENDRA),
  progressions: held('Isus2'),
  melody: { leap: 0.08, ornament: 0.5, span: 14, sequence: 0.6, syncopation: 0.15 },
};

/**
 * JOR — the ālāp acquires a pulse, and still no drum.
 *
 * On a plucked instrument the right hand starts marking an even beat between
 * the melody notes; on a voice the phrases start arriving regularly. There is
 * still no tāla and still no tabla — the pulse is the soloist's own and nobody
 * else is counting it — which is why this excludes the drums exactly as the
 * ālāp does and differs only in tempo and in how much the line moves.
 *
 * Bhairav against Bhairavi: the two komal-Re rāgas, both of which lean on a
 * semitone above the drone. That interval against a held Sa is the sound of the
 * morning in this repertoire and is precisely what `flat-nine` exists to
 * suppress — see the rule overrides in `index.ts`.
 */
const jor: Style = {
  id: 'jor',
  label: 'Jor',
  description:
    'The unfolding acquires a pulse of its own. Still no tāla and no tabla — a plucked beat between the melody notes, and the line beginning to move.',
  ...FREE,
  bpm: [58, 78],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  hook: 'loose',
  drumFills: false,
  excludeLayers: ['drums', 'brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  // No palette. There is a beat here and still nothing to land *on*: the pulse
  // is the soloist's own and nobody else is counting it, where an ensemble
  // arrival needs a cycle everybody shares. Forced on, it moved 28 of 40 songs.
  counterSpacing: 1,
  scaleForChord: raga(BHAIRAV, BHAIRAVI),
  progressions: held('Isus4'),
  melody: { leap: 0.12, ornament: 0.42, span: 16, sequence: 0.55, syncopation: 0.2 },
};

/**
 * JHĀLĀ — the climax, where the drone strings are struck between every melody
 * note and the piece stops being about the rāga and starts being about speed.
 *
 * Written on Bhoopali and Dhani, the two five-note rāgas, and that is the
 * pairing rather than a shortage of alternatives: at this rate a seven-note
 * rāga is a blur, and a jhālā is played on rāgas whose notes are far enough
 * apart to still be heard as notes. It is also the one style here that needs
 * both mode tables written out, because Bhoopali has a Re and no Ma while Dhani
 * has a Ma and no Re — no sus chord fits both, so the plain triad does.
 */
const jhala: Style = {
  id: 'jhala',
  label: 'Jhālā',
  description:
    'The fast close: drone strings struck between every melody note, five swaras, and a tabla playing laggi underneath.',
  ...TEENTAL,
  bpm: [138, 178],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  strictness: 'light',
  hook: 'loose',
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  /**
   * The jhālā is the one Hindustani form whose whole shape is an approach to a
   * finish, so a gesture at the seam is not an ornament on the structure, it is
   * the structure arriving. Teentāl's four vibhāgs come out of `shotFigures` as
   * `[0,8,16,24]` — a stroke at the head of each, into sam.
   *
   * Plain, and right at this speed. At 138–178 a denser figure is a blur, which
   * is the same argument the five-note rāga pairing above is making about the
   * melody: what this style needs is fewer things, further apart.
   */
  transitions: [['shot', 5], ['fill', 3], ['break', 2]],
  scaleForChord: raga(BHOOPALI, DHANI),
  progressions: held('I'),
  minorProgressions: held('i'),
  melody: { leap: 0.2, ornament: 0.3, span: 19, sequence: 0.5, syncopation: 0.35 },
};

/**
 * DHRUPAD — the oldest surviving form, and the austere one.
 *
 * Sung by two brothers at a time in unison, accompanied by a pakhāwaj rather
 * than a tabla, on chautāl's twelve beats, with no ornament that could be
 * called decorative — the gamak here is a heavy oscillation between two swaras
 * rather than a turn around one. No harmonium: dhrupad admits a tanpura and a
 * drum and nothing else, which is why `comp` is excluded.
 *
 * `hook: 'catchy'` rather than `loose`, alone among the classical styles. A
 * dhrupad's composition is fixed and returns in full every cycle; the
 * improvisation happens in the ālāp before it, not inside it.
 */
const dhrupad: Style = {
  id: 'dhrupad',
  label: 'Dhrupad',
  description:
    'The austere old form on chautāl, twelve beats, with a pakhāwaj and no harmonium. Heavy oscillating gamak and a composition that returns whole.',
  ...EKTAL,
  bpm: [58, 82],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  drumFills: false,
  excludeLayers: ['brass', 'comp'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  // No palette, and the only refusal left in this genre that is about the engine
  // rather than about the music. Ektāl's twelve mātrās group in sixes, so
  // `shotFigures` returns six evenly spaced slots — `[0,4,8,12,16,20]` — and
  // `bandHeads` in the same file defines a shot as two to four onsets, on the
  // grounds that more than that is the band playing rather than the band hitting
  // something. Six across a chautāl is the pakhāwaj marking the vibhāgs it was
  // already marking. A `shots` table would fix it; see `transitions` in
  // `index.ts` for why an invented one would be worse than none.
  counterSpacing: 1,
  scaleForChord: raga(BHAIRAV, BHAIRAVI),
  progressions: held('Isus4'),
  melody: { leap: 0.1, ornament: 0.4, span: 13, sequence: 0.6, syncopation: 0.2 },
};

/**
 * VILAMBIT KHYĀL — the slow one, and the slowest thing in this project.
 *
 * Ektāl at forty to fifty-six quarter notes a minute puts a cycle at seven to
 * nine seconds and a four-bar section at half a minute, which is why the forms
 * in `index.ts` are built out of small numbers. A real vilambit khyāl is slower
 * still — ten mātrās a minute is not unusual — and that is not reachable here:
 * below about forty the section machinery produces one bar of music per
 * structural unit and the phrase generator has nothing left to phrase.
 *
 * Bilawal and Kafi, the two plainest sets in the file, on purpose. In a slow
 * khyāl the interest is entirely in what happens *between* two adjacent swaras,
 * and a rāga with a striking interval in it does half of that work for free.
 */
const vilambit: Style = {
  id: 'vilambit',
  label: 'Vilambit khyāl',
  description:
    'Slow khyāl in ektāl. Seven seconds to a cycle, a phrase every second or third one, and everything happening between two adjacent swaras.',
  ...EKTAL,
  bpm: [40, 56],
  swing: 0,
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0,
  hook: 'loose',
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  // No palette, for dhrupad's ektāl reason and for one this style owns outright:
  // at 40–56 a bar is seven to nine seconds long, so a one-bar figure is not a
  // gesture at a seam, it is a passage. The whole interest of a vilambit khyāl
  // is what happens between two adjacent swaras, and nothing at a join should be
  // large enough to compete with that.
  counterSpacing: 1,
  scaleForChord: raga(BILAWAL, KAFI),
  progressions: held('Isus4'),
  melody: { leap: 0.08, ornament: 0.55, span: 12, sequence: 0.6, syncopation: 0.25 },
};

/**
 * BANDISH — the drut khyāl: the fixed composition, in teentāl, at speed.
 *
 * A bandish is forty seconds of tune that the whole rest of the performance
 * departs from and returns to. Its first phrase is the *mukhḍā*, and the entire
 * shape of a khyāl is that every improvised passage aims at landing the mukhḍā
 * on sam — which is what `quoteMotto` at 0.7 and `liftIntoReturn` at 0.55 are
 * doing in the solo profile, and the closest this engine gets to the real
 * gesture.
 *
 * Khamaj against Asavari: an evening pair, both with a komal Ni, and the ones
 * a light khyāl is most often in.
 */
const bandish: Style = {
  id: 'bandish',
  label: 'Bandish',
  description:
    'The drut khyāl — a fixed forty-second composition in teentāl that every improvisation departs from and lands back on.',
  ...TEENTAL,
  bpm: [96, 132],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  hook: 'loose',
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  /**
   * The mukhḍā is aimed at sam and so is this. `quoteMotto` at 0.7 and
   * `liftIntoReturn` at 0.55 in the solo profile are the melodic half of that
   * gesture; the shot is the percussive half, and teentāl's `[0,8,16,24]` puts a
   * stroke on the head of each vibhāg of the cycle the phrase is landing out of.
   *
   * **`break` is level with `fill` here**, one below the shot, where the film
   * styles put it two below. A khyāl singer leaving the cycle for a taan while
   * the tabla waits is not a production effect, it is what the form is for.
   */
  transitions: [['shot', 4], ['fill', 3], ['break', 3]],
  scaleForChord: raga(KHAMAJ, ASAVARI),
  melody: { leap: 0.15, ornament: 0.42, span: 16, sequence: 0.55, syncopation: 0.35 },
  progressions: held('Isus4'),
};

/**
 * GAT — the instrumental composition, here in rupak's seven.
 *
 * A gat is what a sitārist or a sarodiyā plays where a singer would sing a
 * bandish, and the difference that matters is the right hand: a gat is built
 * around a fixed stroke pattern, so its phrases begin and end where the plectrum
 * does. Rupak's khālī sam is the reason this pairing is here — a composition
 * whose first beat has no drum under it has to state itself, and that is a
 * different kind of tune from one that can lean on a dhā.
 *
 * Charukesi and Kirwani, one note apart: Charukesi is a major third over a
 * komal Dha and Kirwani is a komal third over the same, and hearing them
 * side by side is the clearest demonstration in this file that the third is
 * doing all the work.
 */
const gat: Style = {
  id: 'gat',
  label: 'Gat',
  description:
    'An instrumental composition in rupak — seven beats whose first one is empty, so the tune has to state itself with no drum under it.',
  ...RUPAK,
  bpm: [88, 124],
  swing: 0,
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0,
  hook: 'loose',
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  /**
   * The strongest case in the genre, and the figure is the argument.
   *
   * Rupak's seven groups 3+2+2, so `shotFigures` returns `[0,6,10]` — **three**
   * onsets, which is a tihai spelled rather than approximated, and the last of
   * them lands on the sam this tāla leaves empty. A chakradār tihai is what a
   * sitārist plays to finish a gat, and this is the one entry in the file where
   * the mechanism's free figure and the idiom's own cadence are the same three
   * strokes. Nothing was authored to make that true; it falls out of the
   * grouping, which is what the fallback in `shotFigures` is for.
   */
  transitions: [['shot', 5], ['fill', 3], ['break', 2]],
  scaleForChord: raga(CHARUKESI, KIRWANI),
  progressions: held('Isus4'),
  melody: { leap: 0.16, ornament: 0.4, span: 17, sequence: 0.55, syncopation: 0.4 },
};

/**
 * TARĀNĀ — the fast one sung on drum syllables.
 *
 * A tarānā has no words. It is sung on *dir, ta, na, dere* — the tabla's own
 * vocabulary and the sitar's stroke names — so the voice and the drum are
 * saying the same thing at the same time, which is the whole appeal and is the
 * one place in this repertoire where the singer is explicitly playing
 * percussion. Jhaptāl's ten beats, because a tarānā wants a cycle short enough
 * to feel like a wheel.
 *
 * What the singer actually sings here is **sargam**, and that is a knowing
 * substitution rather than an oversight. `Genre.vocals` is one profile for the
 * whole genre, so no `Style` can choose its own syllabary — and the bols would
 * not survive the choice if one could. The consonant list in `vocals.ts` holds
 * every letter a bol needs and puts *d* and *t* on the same sound, so a
 * syllabary of nine comes out as five where sargam's seven come out as seven:
 * the drum keeps its two hands and the voice does not. `vocals.ts` has the
 * measurement and the two changes that would reverse it.
 */
const tarana: Style = {
  id: 'tarana',
  label: 'Tarānā',
  description:
    'Fast, wordless, sung on drum syllables in jhaptāl — the voice and the tabla playing the same figure at the same time.',
  ...JHAPTAL,
  bpm: [120, 162],
  swing: 0,
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0,
  strictness: 'light',
  hook: 'catchy',
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  /**
   * A tarānā is already the voice playing percussion, so the whole ensemble
   * landing a figure together is not an intrusion on the singer — it *is* the
   * singer, saying the same syllables as the drum at the same instant, which is
   * the entry's whole thesis.
   *
   * Jhaptāl's ten mātrās group 2+3+2+3 and `shotFigures` returns `[0,4,10,14]`:
   * asymmetric in exactly the way the cycle is, and a figure no generic table
   * could have found, because there is no formula that recovers 2+3+2+3 from the
   * number twenty.
   */
  transitions: [['shot', 5], ['fill', 3], ['break', 2]],
  scaleForChord: raga(BHOOPALI, DHANI),
  progressions: held('I'),
  minorProgressions: held('i'),
  melody: { leap: 0.18, ornament: 0.3, span: 17, sequence: 0.6, syncopation: 0.4 },
};

/**
 * THUMRĪ — light classical, and the form where the rāga is allowed to be
 * broken.
 *
 * Everything above treats the rāga as a law. A thumrī treats it as a starting
 * point: the singer bends toward a neighbouring rāga for a phrase and comes
 * back, because the text is about longing and the music is expected to follow
 * the words rather than the grammar. This engine cannot leave a rāga mid-phrase
 * — `scaleForChord` returns one scale and the melody generator asks it every
 * time — so what is modelled here is the rest of the thumrī: dādrā's six beats,
 * a slow tempo, and the highest ornament figure in the file.
 *
 * Khamaj and Kafi are two of the three or four rāgas a thumrī is actually sung
 * in, so the pairing is a matter of record rather than of construction.
 */
const thumri: Style = {
  id: 'thumri',
  label: 'Thumrī',
  description:
    'Light classical in dādrā. Slow, heavily ornamented, and following the words rather than the rāga — as far as one scale allows.',
  ...DADRA,
  bpm: [56, 80],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  hook: 'loose',
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  // No palette. A thumrī's proposition is that the structure is soft — the
  // singer leans out of the rāga mid-phrase and comes back — and the arrivals
  // that matter are inside the line rather than at the joins between sections.
  // The ensemble landing a figure at a seam would announce a boundary this form
  // spends all its energy blurring, which is a worse fault than an unmarked one.
  counterSpacing: 1,
  scaleForChord: raga(KHAMAJ, KAFI),
  progressions: held('Isus4'),
  melody: { leap: 0.1, ornament: 0.55, span: 14, sequence: 0.5, syncopation: 0.35 },
};

/**
 * GHAZAL — a poem, set, with the music entirely at the poem's service.
 *
 * The couplet is the unit and the *radīf*, the phrase that ends every couplet,
 * is what the setting is built to deliver. So a ghazal is the one thing in this
 * genre that behaves like a song: a repeated line, a fixed tune, and a singer
 * whose job is to arrive at the same words again in a way the audience did not
 * expect. `hook: 'catchy'` follows from that and separates it from everything
 * classical above it.
 *
 * Yaman and Kirwani, which are the two most-set rāgas in the ghazal repertoire
 * and, conveniently, both have a śuddh Re — so the drone is Sa–Re–Pa.
 */
const ghazal: Style = {
  id: 'ghazal',
  label: 'Ghazal',
  description:
    'A set poem in dādrā. The couplet is the unit and the closing phrase is what the whole tune exists to deliver.',
  ...DADRA,
  bpm: [58, 84],
  swing: 0,
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  // No palette. The arrival in a ghazal is the radīf coming round again, and it
  // belongs to the singer alone — the couplet is the unit and its ending is a
  // *word*. A tabla and a harmonium landing a figure underneath it would be the
  // accompaniment claiming the one moment the audience came for. This is the
  // style where `hook: 'catchy'` and a refusal sit together without conflict:
  // the thing being delivered again is a line of text, not a lick.
  counterSpacing: 1,
  scaleForChord: raga(YAMAN, KIRWANI),
  progressions: held('Isus2'),
  melody: { leap: 0.12, ornament: 0.45, span: 14, sequence: 0.6, syncopation: 0.3 },
};

/**
 * BHAJAN — devotional song, keherwā, and the plainest music here.
 *
 * A bhajan is meant to be sung back by a room full of people who did not
 * rehearse, so its tune sits in a fifth, repeats immediately, and stays in a
 * rāga nobody has to think about. That is a design constraint rather than a
 * limitation and the numbers say so: the smallest `span` in the file, the
 * highest `sequence`, and `hook: 'earworm'` — the only style here that gets it.
 */
const bhajan: Style = {
  id: 'bhajan',
  label: 'Bhajan',
  description:
    'Devotional song in keherwā, pitched to be sung back by a room that has not rehearsed: a small span, immediate repetition, a plain rāga.',
  ...KEHERWA,
  bpm: [76, 108],
  swing: 0,
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  // No palette, and this is the clearest musical refusal in the file. A tihai is
  // arithmetic performed at an audience; a bhajan is built so that a room which
  // has not rehearsed can sing it back. The style's own numbers make the same
  // argument from the melodic side — the smallest span in the genre, the highest
  // sequence, and the only `earworm` here — and a calculated cadence landed by
  // the ensemble would be the one thing in the piece nobody in the room could
  // join in with.
  scaleForChord: raga(BILAWAL, BHAIRAVI),
  progressions: held('Isus4'),
  melody: { leap: 0.1, ornament: 0.3, span: 11, sequence: 0.7, syncopation: 0.25 },
};

/**
 * QAWWĀLĪ — the Sufi devotional form, and the loudest thing in the genre.
 *
 * A qawwāli party is eight or ten men: one or two lead singers, a harmonium
 * each, a dholak, and a back row whose entire job is to clap and answer. The
 * clap is not a hand percussion part, it is a section of the ensemble, which is
 * why the `qawwali-clap` theka in `KEHERWA` puts `cp` on mātrās 3 and 7 and
 * nowhere else.
 *
 * The form accelerates. A qawwāli that ended at the tempo it began at would
 * have failed at its job, and this comment used to end by calling that the one
 * structural thing here the engine could not do — *`SongMeta.bpm` is a single
 * number and nothing in the pipeline ramps it* — leaving a fast starting tempo
 * and the density to stand in for it.
 *
 * **Half of that is still true and the half that mattered is not.** `bpm` is
 * still a single number, drawn once; what arrived beside it is
 * `SongMeta.tempo`, a `TempoMap`, and `generate/tempo.ts` behind it. This
 * paragraph is one of the two reports that argument was built on —
 * `docs/engine-gaps.md` §1.1 names the qawwāli and the pelimanni repertoire as
 * the pair that made it a gap rather than a taste — and the shape it produced
 * is `gathering`, whose own description in `generate/tempo.ts` reads *"Patient,
 * then it goes: half the speed arrives in the last third. What a qawwāli is
 * built on."* `Style.tempoRamp`'s worked example is this style, in so many
 * words: `[['none', 2], ['gathering', 1]]` with `tempoRise: 1.5`.
 *
 * **It is not adopted here, and that is a decision this table has not made
 * rather than one it has made against.** Opting in means claiming that `bpm`
 * above describes where the music *starts* rather than where it sits, and 104
 * to 148 was drawn as a whole-piece band; a ramp of half again out of the top
 * of it ends at 222. Somebody adopting this should re-draw the range downward
 * in the same edit, which is a change to the music and was not this sweep's to
 * make. What is left meanwhile is still a fast starting tempo and the density —
 * now as an unadopted mechanism rather than an absent one.
 */
const qawwali: Style = {
  id: 'qawwali',
  label: 'Qawwālī',
  description:
    'Sufi devotional song in keherwā: two harmoniums, a dholak, and a back row of men clapping on three and seven.',
  ...KEHERWA,
  bpm: [104, 148],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  strictness: 'light',
  hook: 'catchy',
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  /**
   * The back row is a section of this ensemble and its entire job is to arrive
   * together — see `qawwali-clap` in `KEHERWA` above, which puts `cp` on mātrās
   * 3 and 7 and nowhere else. A gesture that means *everybody hits this at once*
   * is the one seam gesture this form was always going to want.
   *
   * Keherwā gives `[0,8]`: two onsets, the floor a figure can be. That is enough
   * here for a reason peculiar to the style — the weight is carried by ten men
   * landing on it rather than by how much is stacked in front of it.
   *
   * `break` up level with `fill`, for the same reason it is in the khyāl: the
   * party dropping to one voice while a lead singer takes a line alone is a set
   * piece, not a thinning.
   */
  transitions: [['shot', 4], ['fill', 3], ['break', 3]],
  scaleForChord: raga(BHAIRAV, BHAIRAVI),
  progressions: held('Isus4'),
  melody: { leap: 0.16, ornament: 0.35, span: 16, sequence: 0.6, syncopation: 0.35 },
};

/**
 * DHUN — a light instrumental piece, folk-derived, that a classical musician
 * plays after the serious item is over.
 *
 * The rāga rules are relaxed, the tune came from somewhere in particular
 * — Pahāṛī, Bhairavi, a boat song — and everybody in the hall relaxes with it.
 * In this file it is the slow, spacious, santoor-and-drone end of the genre and
 * the entry that sits closest to what a listener outside the tradition expects
 * the whole thing to sound like. Written on the two pentatonics for that
 * reason: five notes over a drone is the sound in question, and it is a small
 * part of this music rather than the whole of it.
 */
const dhun: Style = {
  id: 'dhun',
  label: 'Dhun',
  description:
    'A light folk-derived piece played after the serious item: five swaras, a slow keherwā, and a great deal of space.',
  ...KEHERWA,
  bpm: [52, 74],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  // No palette. The dhun is the item played *after* the display: the rāga rules
  // relax, the tune came in from a boat song, and everybody in the hall lets go.
  // Landing a calculated figure on sam is precisely the thing this piece is a
  // rest from — and it would be the only calculated thing in it.
  counterSpacing: 1,
  scaleForChord: raga(BHOOPALI, DHANI),
  progressions: held('I'),
  minorProgressions: held('i'),
  melody: { leap: 0.14, ornament: 0.38, span: 15, sequence: 0.6, syncopation: 0.25 },
};

// ---------------------------------------------------------------------------
// Carnatic — the South Indian tradition
// ---------------------------------------------------------------------------

/**
 * ĀLĀPANA — the Carnatic ālāp, and not a regional accent on the Hindustani one.
 *
 * The two traditions are related the way Latin and Greek are. An ālāpana is
 * shorter than an ālāp, more phrase-driven and less swara-by-swara, and it is
 * played *with* the accompanist rather than alone — the violin answers each
 * phrase, which is a thing that never happens in the North. So the counter
 * layer is not excluded here and its spacing is one beat rather than two: this
 * is a conversation, and the ālāp is a monologue.
 *
 * Charukesi and Simhendramadhyamam, two melakartas that Carnatic music treats
 * as major items and Hindustani music largely borrowed later.
 */
const alapana: Style = {
  id: 'alapana',
  label: 'Ālāpana',
  description:
    'The Carnatic exposition, unmetred and without percussion — but with the violin answering every phrase, which the Hindustani ālāp never has.',
  ...FREE,
  bpm: [44, 60],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  strictness: 'strict',
  hook: 'through',
  drumFills: false,
  excludeLayers: ['drums', 'brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  // No palette, for the ālāp's reason and one of its own. Unmetred, so there is
  // nothing to land on; and this form is a *conversation* — the violin answers
  // each phrase — where a moment everybody hits at once is the wrong shape
  // entirely. The two traditions refuse this for the same reason and it is worth
  // both entries saying so, because they arrive at it separately.
  counterSpacing: 1,
  scaleForChord: raga(CHARUKESI, SIMHENDRA),
  progressions: held('Isus2'),
  melody: { leap: 0.1, ornament: 0.5, span: 15, sequence: 0.6, syncopation: 0.2 },
};

/**
 * TĀNAM — the pulsed section between the ālāpana and the composition, and the
 * Carnatic answer to jor.
 *
 * A rhythm appears without a tāla appearing: the player sounds the syllables
 * *ā-nan-ta* over and over at whatever speed suits, so there is a beat but
 * nobody is counting cycles and the drum has not come in. Still no percussion,
 * therefore, and a faster tempo than the ālāpana it follows.
 */
const tanam: Style = {
  id: 'tanam',
  label: 'Tānam',
  description:
    'A pulse without a cycle: the rāga stated in short repeated bursts, faster than the ālāpana and still with no drum.',
  ...FREE,
  bpm: [62, 88],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  hook: 'loose',
  drumFills: false,
  excludeLayers: ['drums', 'brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  // No palette. A pulse without a cycle — see `jor`, which refuses on the same
  // grounds from the other tradition, and note that both of them have a beat.
  // A shared beat is not a shared cycle, and only the second one has a sam in it.
  counterSpacing: 1,
  scaleForChord: raga(BILAWAL, GAURIMANOHARI),
  progressions: held('Isus4'),
  melody: { leap: 0.14, ornament: 0.4, span: 16, sequence: 0.6, syncopation: 0.3 },
};

/**
 * VARṆAM — the piece a concert opens with, and the one every student learns
 * first.
 *
 * A varṇam is a technical exercise that is also a real composition: it states
 * the rāga's phrases in order, at two speeds, and is deliberately the densest
 * writing in the repertoire. Ādi tāla, eight aksharas grouped 4+2+2, which is
 * the metre most of Carnatic music is in.
 */
const varnam: Style = {
  id: 'varnam',
  label: 'Varṇam',
  description:
    'The opening item in ādi tāla: the rāga stated in order at two speeds, dense on purpose, and the first thing any student learns.',
  ...ADI,
  bpm: [92, 126],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  /**
   * Ādi tāla's eight aksharas group 4+2+2 — laghu, drutam, drutam — so
   * `shotFigures` returns `[0,8,12]`: three onsets on the aṅga heads, which is a
   * **muktāyi**, the three-fold cadence a Carnatic item closes a section with.
   * The varṇam is where a student learns to place one.
   *
   * And this is the densest writing in the repertoire by design, so a seam that
   * passed unmarked would be the only quiet thing in the piece.
   */
  transitions: [['shot', 5], ['fill', 3], ['break', 2]],
  scaleForChord: raga(BILAWAL, KAFI),
  progressions: held('Isus4'),
  melody: { leap: 0.16, ornament: 0.35, span: 17, sequence: 0.65, syncopation: 0.3 },
};

/**
 * KṚTI — the centre of a Carnatic concert: a devotional composition in three
 * sections, with improvisation hung off each of them.
 *
 * The three sections are *pallavi*, *anupallavi* and *caraṇam*, and they map
 * onto this engine's kinds better than anything else in the genre does —
 * pallavi is the refrain the piece keeps coming back to, anupallavi is the
 * second strain that climbs into the upper octave, caraṇam is the long verse.
 * `verse` and `chorus` in the forms are doing that work.
 *
 * Kalyani and Keeravani, two of the most-set melakartas, and both with a śuddh
 * Re — Sa–Re–Pa on the drone.
 */
const kriti: Style = {
  id: 'kriti',
  label: 'Kṛti',
  description:
    'The centre of a Carnatic concert. Three strains in ādi tāla — refrain, upper-octave answer, long verse — with improvisation hung off each.',
  ...ADI,
  bpm: [72, 104],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  hook: 'loose',
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  /**
   * Three strains with improvisation hung off each of them, which means every
   * one of those joins is a place a mridangam plays a korvai. Ādi's `[0,8,12]`
   * is that figure's three statements — see `varnam`, which gets the identical
   * figure and wants it for the opposite reason.
   *
   * `break` level with `fill`, as in the khyāl: the accompanist waiting out a
   * phrase that has left the cycle is the form working rather than the
   * arrangement thinning.
   */
  transitions: [['shot', 4], ['fill', 3], ['break', 3]],
  scaleForChord: raga(YAMAN, KIRWANI),
  progressions: held('Isus2'),
  melody: { leap: 0.13, ornament: 0.45, span: 16, sequence: 0.6, syncopation: 0.32 },
};

/**
 * TILLĀNĀ — the fast closing item, and the Southern cousin of the tarānā.
 *
 * Same idea and a different execution: the syllables are the dancer's rather
 * than the drummer's, because a tillānā is what a Bharatanāṭyam recital ends
 * with and the feet are playing the rhythm too. Misra chāpu's seven, which
 * counts 3+2+2 and puts its weight where rupak takes it away — the two tālas
 * have identical `groups` and sound nothing alike, which is the best argument
 * in this file for why a grouping is not a metre.
 */
const tillana: Style = {
  id: 'tillana',
  label: 'Tillānā',
  description:
    'The fast closing item in misra chāpu — seven beats counted three-two-two, with the dancer playing the rhythm as well.',
  ...MISRA_CHAPU,
  bpm: [118, 158],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  strictness: 'light',
  hook: 'catchy',
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  /**
   * The closing item of a recital, with the dancer playing the rhythm as well,
   * so an arrival here is made by feet, drum and voice at once — which is the
   * definition of the one kind in this project that means *everybody hits this*.
   *
   * Misra chāpu counts 3+2+2 and `shotFigures` returns `[0,6,10]`: a korvai as
   * written. The entry above says a grouping is not a metre and rupak proves it;
   * this is the other half of the same demonstration. The two tālas have
   * identical `groups`, so they get the identical figure, and it is a different
   * gesture in each — because what the last stroke lands on is different.
   */
  transitions: [['shot', 5], ['fill', 3], ['break', 2]],
  scaleForChord: raga(BHAIRAV, BHAIRAVI),
  progressions: held('Isus4'),
  melody: { leap: 0.18, ornament: 0.32, span: 18, sequence: 0.6, syncopation: 0.4 },
};

/**
 * PADAM — the slow one, sung for a dancer, in khaṇḍa chāpu's five.
 *
 * A padam is the item in a dance recital where nothing much happens and
 * everything is expressed: one line of text stretched over several minutes so
 * the dancer can turn it over. Five beats is the shortest cycle here and at
 * this tempo it comes round about every four seconds, which is why the cells
 * for it are the shortest in the file — there is no room for a phrase that
 * crosses the cycle and no reason to want one.
 */
const padam: Style = {
  id: 'padam',
  label: 'Padam',
  description:
    'Slow, for a dancer, in khaṇḍa chāpu — five beats, one line of text, and several minutes to turn it over in.',
  ...KHANDA_CHAPU,
  bpm: [66, 92],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  hook: 'loose',
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  // No palette. In a padam the drummer's job is to stay out of the dancer's way:
  // one line of text over several minutes, and every arrival that matters is an
  // expression rather than a stroke. Khaṇḍa chāpu would hand over `[0,4]` and the
  // arithmetic is perfectly available — it is the form declining it, not the
  // metre, which is the distinction this whole sort was made to draw.
  counterSpacing: 1,
  scaleForChord: raga(KHAMAJ, BHAIRAVI),
  progressions: held('Isus4'),
  melody: { leap: 0.1, ornament: 0.5, span: 13, sequence: 0.55, syncopation: 0.28 },
};

/**
 * SVARA KALPANA — improvising in solfège, out loud, and landing on the beat you
 * said you would.
 *
 * The performer sings the note names — sa ri ga ma pa dha ni — building phrases
 * that must arrive at a nominated akshara of the cycle, and the drummer is
 * listening for exactly that. It is the most explicitly *arithmetic* thing in
 * this music and khaṇḍa chāpu's five is where it is hardest, because five does
 * not divide anything.
 *
 * `hook: 'through'` — the only Carnatic style that gets it. The whole
 * proposition is that nothing is repeated.
 */
const svara: Style = {
  id: 'svara',
  label: 'Svara kalpana',
  description:
    'Improvisation in solfège over khaṇḍa chāpu: phrases built to land on a nominated beat of a five-beat cycle, and never repeated.',
  ...KHANDA_CHAPU,
  bpm: [104, 140],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  strictness: 'light',
  hook: 'through',
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  /**
   * The form is an agreement to land on a nominated akshara and the drummer is
   * listening for exactly that, which makes this the one style in the genre
   * where the shot is not an ornament on the seam — it is the thing being
   * demonstrated.
   *
   * Khaṇḍa chāpu's five gives `[0,4]`, the barest figure anywhere in this file:
   * two strokes. That is right rather than a shortfall. Five does not divide, so
   * the whole interest of the gesture is in *where* the arrival is, and stacking
   * onsets in front of it would be answering a question nobody asked.
   */
  transitions: [['shot', 5], ['fill', 3], ['break', 2]],
  scaleForChord: raga(KHAMAJ, ASAVARI),
  progressions: held('Isus4'),
  melody: { leap: 0.2, ornament: 0.3, span: 19, sequence: 0.45, syncopation: 0.42 },
};

// ---------------------------------------------------------------------------
// Filmi — where an orchestra and a rāga meet
// ---------------------------------------------------------------------------

/**
 * FILMĪ SONG — the playback number, and the only place in this genre where
 * harmony exists.
 *
 * A Bombay film song of 1955 has a rāga in the tune and a string section
 * underneath it playing chords, because the arranger had been trained on
 * Hollywood and the composer had been trained on khyāl, and the record is both
 * of those at once. Everything else in this file states one chord for the
 * length of the piece; these four styles do not, and that is the difference
 * being modelled rather than an inconsistency.
 *
 * **The chords are drawn from the rāga**, which is what makes it work. Kirwani
 * is harmonic minor, so `i`, `iv`, `V` and `VI` are all inside it and the
 * arranger never has to leave; Bilawal is plain major and offers `I`, `IV`,
 * `vi` and `ii`. The chords therefore never contradict the line, which is
 * exactly the compromise the real records reached.
 */
const filmi: Style = {
  id: 'filmi',
  label: 'Filmī song',
  description:
    'The playback number: a rāga in the tune, a string section under it playing chords built out of that same rāga, and a dholak keeping keherwā.',
  ...KEHERWA,
  bpm: [92, 128],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  /**
   * A beat between answering notes, where every other film style takes the
   * default eighth. The obbligato on these records — the violin or the flute
   * figure that comes in between the sung lines — answers in *phrases*, in the
   * gaps at the ends of couplets, and a line that chattered under the singer in
   * eighths would be competing with the one thing the record is selling.
   */
  counterSpacing: 1,
  /**
   * The first style in the genre to declare a palette, and this note used to
   * give a reason that was wrong in both halves: that `applyShot` wrote a kick,
   * a snare and a crash, and that this was one of the few rooms with all three
   * in it. The delivery is fixed — see `transitions` in `index.ts` — and the
   * second half was never true anyway. This table is `lp mp hp cp`. There has
   * never been a kick, a snare or a crash in it, which is precisely why the old
   * delivery was writing three instruments nobody in the room was holding.
   *
   * **The claim that survives is the musical one.** A film session had a dholak
   * player and a session drummer sitting next to each other and the whole
   * orchestra landing a figure together is what these records do at a seam. What
   * has changed is who delivers it: the dholak, in doum strokes, because that is
   * what the table says is present.
   *
   * **`break` sits below the shot** because a film arranger's commonest seam
   * gesture is the tutti figure and the drum stopping dead for a cycle is the
   * one they save. The classical entries above invert that reasoning and raise
   * it — a khyāl singer leaving the cycle is not a saved effect — which is the
   * clearest single difference between the two halves of this file.
   */
  transitions: [['shot', 4], ['fill', 3], ['break', 2]],
  scaleForChord: raga(BILAWAL, KIRWANI),
  progressions: {
    intro: [{ chords: ['i', 'i', 'VI', 'V'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'V', 'V'], weight: 5, note: 'Every chord inside harmonic minor, which is Kirwani — the arranger never has to leave the rāga to have chords' },
      { chords: ['i', 'VI', 'iv', 'V', 'i', 'VI', 'iv', 'V'], weight: 4 },
      { chords: ['i', 'i', 'VI', 'VI', 'iv', 'iv', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'iv', 'iv', 'i', 'i', 'V', 'V'], weight: 5 },
      { chords: ['iv', 'V', 'i', 'i', 'iv', 'V', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'VI', 'VI', 'i', 'i', 'V', 'V'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'V', 'V'], weight: 5 }],
    outro: [{ chords: ['iv', 'V', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'vi', 'IV'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 5 },
      { chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'IV', 'V'], weight: 4 },
      { chords: ['I', 'I', 'ii', 'ii', 'IV', 'IV', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 5 },
      { chords: ['IV', 'V', 'I', 'I', 'IV', 'V', 'I', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'vi', 'vi', 'ii', 'ii', 'V', 'V'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 5 }],
    outro: [{ chords: ['IV', 'V', 'I', 'I'], weight: 4 }],
  },
  melody: { leap: 0.16, ornament: 0.35, span: 15, sequence: 0.65, syncopation: 0.35 },
};

/**
 * CABARET — the club number, and the point at which a film score stops being
 * Indian music at all for four minutes.
 *
 * Brass, a full kit, a tempo nothing else here reaches, and a rāga chosen for
 * how well it takes a horn line rather than for what time of day it is. This is
 * the one style in the genre that does not exclude the brass layer, and the
 * exception is the argument: everything else here is a soloist and a drone, and
 * a horn section stabbing into the gaps of a khyāl would be a joke. Behind a
 * cabaret number it is the arrangement.
 *
 * Khamaj and Asavari — mixolydian and aeolian, the two sets a brass writer can
 * do most with while staying inside a rāga.
 */
const cabaret: Style = {
  id: 'cabaret',
  label: 'Cabaret',
  description:
    'The film club number: brass, a full kit, a tempo nothing else here reaches, and a rāga picked for how it takes a horn line.',
  ...KEHERWA,
  bpm: [128, 172],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  strictness: 'light',
  hook: 'catchy',
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  transitions: [['shot', 5], ['fill', 3], ['break', 2]],
  scaleForChord: raga(KHAMAJ, ASAVARI),
  progressions: {
    intro: [{ chords: ['i', 'i', 'VII', 'VII'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5, note: 'The aeolian cadence, VI–VII–i, which needs no leading tone and is therefore the one modal progression a rāga can hold unchanged' },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['III', 'III', 'VII', 'VII', 'iv', 'iv', 'i', 'i'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 }],
    outro: [{ chords: ['VI', 'VII', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'bVII', 'bVII'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['I', 'bVII', 'IV', 'I', 'I', 'bVII', 'IV', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 4 },
      { chords: ['v', 'v', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['ii', 'ii', 'IV', 'IV', 'bVII', 'bVII', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['IV', 'bVII', 'I', 'I'], weight: 4 }],
  },
  melody: { leap: 0.22, ornament: 0.22, span: 18, sequence: 0.6, syncopation: 0.42 },
};

/**
 * MUJRĀ — the classical dance number a film puts in a courtesan's room.
 *
 * Teentāl, tabla, sārangī, and a full string section behind all of it: the
 * scene requires the audience to believe they are watching a real recital while
 * the record has to work as a single. So the tāla and the ornament come from
 * the classical side and the arrangement comes from the studio, which is a
 * tension the real records never resolved either and are better for.
 *
 * Yaman against Kirwani. Yaman is the evening rāga this scene is always set in.
 */
const mujra: Style = {
  id: 'mujra',
  label: 'Mujrā',
  description:
    'The film dance number in teentāl: tabla and sārangī doing the classical half, a string section doing the studio half, neither giving way.',
  ...TEENTAL,
  bpm: [88, 122],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  // No fills, alone among the film styles, and that half of the old refusal
  // stands on a better footing than it did. It used to say a fill was a tom roll
  // on an instrument the scene does not contain; a fill on a hand table is hand
  // strokes now. It stays because of the music: the percussion in this scene is
  // a tabla, and a tabla player does not thin the theka approaching a join. See
  // `drumFills` in `index.ts`.
  drumFills: false,
  /**
   * A palette, where this entry used to refuse one because the seam gestures
   * were "a tom roll, a crash, a kick-and-snare shot — on an instrument the
   * scene does not contain". Two of those three are gone and the third was never
   * the whole sentence: a shot on this table is doum strokes and a break is
   * silence, and neither reaches for anything that is not in the room.
   *
   * **And it is the film style that wants one most**, because it is the one with
   * its classical half intact. Teentāl, a tabla, and a dancer whose feet land on
   * sam — `[0,8,16,24]` is what all three of them are counting, and the string
   * section arriving on it with them is the tension this entry is named for
   * rather than a resolution of it.
   */
  transitions: [['shot', 4], ['fill', 3], ['break', 3]],
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  scaleForChord: raga(YAMAN, KIRWANI),
  progressions: {
    intro: [{ chords: ['i', 'i', 'V', 'V'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'V', 'V'], weight: 5 },
      { chords: ['i', 'i', 'VI', 'VI', 'iv', 'iv', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'V', 'V', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'iv', 'iv', 'V', 'V', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'iv', 'iv', 'V', 'V', 'V', 'V'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'V', 'V'], weight: 5 }],
    outro: [{ chords: ['iv', 'V', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    // Lydian: the chord on the second degree is *major*, which is the one
    // harmonic fact that makes Yaman worth arranging rather than merely playing.
    intro: [{ chords: ['I', 'I', 'II', 'II'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'II', 'II', 'I', 'I', 'V', 'V'], weight: 5, note: 'A major II is Yaman’s tīvra Ma harmonised, and it is the sound that tells a listener which rāga this is before the tune has' },
      { chords: ['I', 'I', 'vi', 'vi', 'II', 'II', 'V', 'V'], weight: 4 },
    ],
    chorus: [
      { chords: ['II', 'II', 'V', 'V', 'I', 'I', 'I', 'I'], weight: 5 },
      { chords: ['vi', 'vi', 'II', 'II', 'V', 'V', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['iii', 'iii', 'vi', 'vi', 'II', 'II', 'V', 'V'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'II', 'II', 'I', 'I', 'V', 'V'], weight: 5 }],
    outro: [{ chords: ['II', 'V', 'I', 'I'], weight: 4 }],
  },
  melody: { leap: 0.14, ornament: 0.45, span: 16, sequence: 0.6, syncopation: 0.35 },
};

/**
 * BHANGRA — Punjabi harvest music, played on a dhol with a stick in each hand.
 *
 * Not a film style and it is filed with them anyway, because the version most
 * people have heard is the one a film put a string section on. The drum is the
 * reason it earns an entry: a dhol is a barrel with a bass head and a treble
 * head and it is the loudest thing in any field it is in, so the `dholak`
 * pattern in `KEHERWA` — low stroke on the offbeat, high stroke on every
 * sixteenth — is doing more work here than anywhere else in the file.
 *
 * `hook: 'earworm'`, tied with the bhajan for the highest here. A bhangra tune
 * is four bars long and is meant to be.
 */
const bhangra: Style = {
  id: 'bhangra',
  label: 'Bhangra',
  description:
    'Punjabi harvest music on the dhol: a four-bar tune, a bass head and a treble head, and the loudest drum in the file.',
  ...KEHERWA,
  bpm: [116, 152],
  swing: 0,
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0,
  strictness: 'light',
  hook: 'earworm',
  transitions: [['shot', 4], ['fill', 4], ['break', 2]],
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  scaleForChord: raga(BILAWAL, KAFI),
  progressions: {
    intro: [{ chords: ['i', 'i', 'i', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'IV', 'IV', 'i', 'i'], weight: 5, note: 'The major IV over a minor tonic is Kafi’s śuddh Dha, and it is the whole colour of the mode' },
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'i', 'i', 'IV', 'IV', 'i', 'i'], weight: 5 },
      { chords: ['VII', 'VII', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'IV', 'IV', 'i', 'i', 'i', 'i'], weight: 4 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'IV', 'IV', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['IV', 'i', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'I', 'I', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'V', 'V', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'IV', 'IV', 'V', 'V', 'V', 'V'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['IV', 'V', 'I', 'I'], weight: 4 }],
  },
  melody: { leap: 0.2, ornament: 0.25, span: 14, sequence: 0.72, syncopation: 0.4 },
};

// ---------------------------------------------------------------------------
// Fusion — 1970s onward
// ---------------------------------------------------------------------------

/**
 * RĀGA ROCK — a sitar, a drum kit, and 4/4.
 *
 * The one style here in a metre that is not a tāla, and the metre is the point:
 * what happened in 1966 was not that Western pop learned a tāla, it was that a
 * sitar was put on top of a bar of four and the drone did the rest. Filed
 * honestly as the shallow end of the fusion era rather than as classical music
 * with a beat, and given `KEHERWA`'s tables because eight mātrās and a bar of
 * four are, for once, genuinely the same object.
 */
const ragarock: Style = {
  id: 'ragarock',
  label: 'Rāga rock',
  description:
    'A sitar over a bar of four with a kit under it — the shallow end of fusion, and the version most of the world heard first.',
  ...KEHERWA,
  bpm: [104, 136],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  strictness: 'light',
  hook: 'catchy',
  transitions: [['shot', 4], ['fill', 4], ['break', 2]],
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  scaleForChord: raga(KHAMAJ, KAFI),
  progressions: held('Isus4'),
  melody: { leap: 0.2, ornament: 0.3, span: 17, sequence: 0.6, syncopation: 0.4 },
};

/**
 * JUGALBANDĪ — two soloists, alternating, at the top of their range.
 *
 * A jugalbandī is a duet between two players who are usually rivals and always
 * from different schools, and the form is question and answer: one plays four
 * cycles, the other answers with something derived from it, and the exchange
 * shortens until they are trading a cycle each. That is `trade` in
 * `generate/chart.ts` doing exactly what it was written for, and it is why this
 * genre weights that device far above the pool default — see `index.ts`.
 *
 * Jhaptāl, because ten beats is where the arithmetic of the exchange is hardest
 * and a jugalbandī is partly a display of arithmetic.
 */
const jugalbandi: Style = {
  id: 'jugalbandi',
  label: 'Jugalbandī',
  description:
    'Two soloists trading phrases in jhaptāl, the exchanges getting shorter until they are swapping a cycle each.',
  ...JHAPTAL,
  bpm: [126, 168],
  swing: 0,
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0,
  strictness: 'light',
  hook: 'through',
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad', 'counter'],
  breakCarrier: 'pad',
  /**
   * Two players from rival schools ending an exchange by landing the same tihai
   * together is the single most characteristic thing this form does, and `shot`
   * is the only kind in the project that means *everybody hits this at once*.
   * `trade` in `generate/chart.ts` is building the exchange; this is what the
   * exchange is built towards, and without it the shortening runs out rather
   * than arrives.
   *
   * Jhaptāl's `[0,4,10,14]`, the same asymmetric figure the tarānā gets — which
   * is the point of the pairing: ten mātrās is where the arithmetic of an
   * exchange is hardest, and the figure the metre hands over is itself uneven.
   */
  transitions: [['shot', 5], ['fill', 3], ['break', 2]],
  scaleForChord: raga(CHARUKESI, SIMHENDRA),
  progressions: held('Isus2'),
  melody: { leap: 0.22, ornament: 0.32, span: 20, sequence: 0.5, syncopation: 0.45 },
};

/**
 * SANTOOR — the slow, spacious, hammered-dulcimer end of the fusion era.
 *
 * A hundred-string zither struck with two light mallets: every note decays
 * immediately and none of them can bend, which makes the santoor the one
 * instrument in this music that *cannot* play a meend. Its repertoire adapted
 * around that — the phrases are built from many short notes where a sitar would
 * use one long one — and this style's cells are the shortest of any slow entry
 * here for that reason.
 *
 * Ādi tāla rather than a Hindustani cycle, which is a deliberate cross: the
 * fusion era is where the two traditions started sitting on the same stage, and
 * this is the entry that admits it.
 */
const santoor: Style = {
  id: 'santoor',
  label: 'Santoor',
  description:
    'Hammered zither in ādi tāla: many short struck notes where a sitar would bend one long one, and a great deal of room around them.',
  ...ADI,
  bpm: [58, 84],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  hook: 'loose',
  drumFills: false,
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  /**
   * Ādi's `[0,8,12]` again, at the lower shot weight rather than the varṇam's,
   * because this entry's thesis is the room around the notes and a style that
   * marked every seam it was allowed to would be arguing with itself.
   *
   * It earns the gesture on the instrument's own terms. A santoor cannot bend a
   * note and cannot hold one — that is the constraint the whole entry is built
   * around — but it can strike several at an agreed instant, so the ensemble
   * arrival is the one gesture the limitation makes *easier* rather than harder.
   *
   * `break` level with `fill` for the same reason: a hundred strings decaying
   * into an empty cycle is the most characteristic sound this instrument makes,
   * and it is the only place in the file where a break is chosen for its decay.
   */
  transitions: [['shot', 4], ['fill', 3], ['break', 3]],
  counterSpacing: 1,
  scaleForChord: raga(BILAWAL, GAURIMANOHARI),
  progressions: held('Isus4'),
  melody: { leap: 0.18, ornament: 0.3, span: 18, sequence: 0.55, syncopation: 0.3 },
};

/**
 * FUSION GAT — the electric one: an odd cycle, a bass guitar, and a kit that
 * is playing the tāla rather than a groove.
 *
 * The seventies records this is named for did one thing consistently that a
 * classical group does not: they gave the cycle to a rhythm section, so a
 * seven-beat gat acquired a bass line that stated the vibhāgs. Rupak's khālī
 * sam is the sharpest test of that — a bass player with nothing to land on at
 * the top of the cycle has to build the whole figure from the third beat back.
 */
const fusiongat: Style = {
  id: 'fusiongat',
  label: 'Fusion gat',
  description:
    'The electric gat: rupak given to a rhythm section, so a seven-beat cycle whose first beat is empty acquires a bass line that states it.',
  ...RUPAK,
  bpm: [130, 172],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  strictness: 'light',
  hook: 'through',
  transitions: [['shot', 5], ['fill', 3], ['break', 2]],
  excludeLayers: ['brass'],
  requireLayers: ['pad'],
  breakCarrier: 'pad',
  scaleForChord: raga(CHARUKESI, KIRWANI),
  progressions: held('Isus4'),
  melody: { leap: 0.24, ornament: 0.28, span: 20, sequence: 0.5, syncopation: 0.45 },
};

export const STYLES: Record<string, Style> = {
  alap, jor, jhala, dhrupad, vilambit, bandish, gat, tarana,
  thumri, ghazal, bhajan, qawwali, dhun,
  alapana, tanam, varnam, kriti, tillana, padam, svara,
  filmi, cabaret, mujra, bhangra,
  ragarock, jugalbandi, santoor, fusiongat,
};
