/**
 * The Latin-American dance catalogue, organised by the key the band is playing
 * against rather than by the country it is playing in.
 *
 * Twenty-six styles from Havana, San Juan, Santo Domingo, Barranquilla, Recife,
 * Caracas and Monterrey. Sorted by nation they would be a shelf; sorted by
 * *what the two bars are* they fall into four families, and the families are
 * what the tables below are actually about:
 *
 *  - **The clave repertoire.** Son, guaracha, guajira, bolero, danzón,
 *    cha-cha-chá, mambo, rumba, songo, salsa dura, timba. Everything anybody
 *    plays is written against a two-bar asymmetric figure that nobody is
 *    allowed to contradict.
 *  - **The other keys.** Merengue's tambora, samba's surdo-and-tamborim, the
 *    baião's zabumba, plena's three panderetas, bomba's buleador. Each is a
 *    fixed rhythmic key too, and none of them is the clave — writing them as
 *    clave music with the drums swapped is the commonest way this repertoire
 *    gets flattened.
 *  - **The accordion belt.** Vallenato, norteño, forró-descended baião,
 *    merengue típico. A European bellows instrument dropped into three
 *    countries at once in the 1880s and stayed.
 *  - **The march.** Frevo, banda, porro-descended brass. A wind band with a
 *    Caribbean rhythm section under it, which is a different animal from a
 *    dance band with horns on top of it.
 *
 * ## The clave is not a drum pattern, and `cycle` is how that gets said
 *
 * Every rhythm in the first family is **two bars long**. Not "a bar that varies"
 * — two bars, asymmetric, with a three-stroke half and a two-stroke half, and
 * the whole ensemble is either in 3-2 or in 2-3 for the duration of the number.
 * A band that flips halfway through is said to be *cruzado* and it is the one
 * mistake a Cuban rhythm section will stop a rehearsal over.
 *
 * `DrumPattern.cycle` is what lets that be written down. **`cycle: 32` on a 4/4
 * bar**, which is what `Cycle` in `style/types.ts` exists for: the generators
 * walk cycles rather than bars, so the figure and the barline genuinely
 * disagree and the second bar is not the first bar again. A clave written as a
 * one-bar pattern is not a clave — it is a bar of five strokes repeated, which
 * is the thing this music is organised around *not* being. The 6/8 clave of a
 * rumba columbia is the same statement in a different metre: twelve pulses,
 * which is two bars of 6/8, which is `cycle: 24` on a three-beat bar.
 *
 * The bass, the piano and the bell are written on the same 32 wherever the
 * figure really is two bars. Where it is genuinely one bar — the conga marcha,
 * the güiro, the maracas — it is written out twice inside the 32 rather than
 * given a cycle of its own, because a pattern carries one cycle and the clave's
 * is the one that decides.
 *
 * ## Where the line falls against jazz and iskelmä
 *
 * Three styles in this project were already Latin-American or Latin-derived
 * when this folder was written, and none of them is duplicated here.
 *
 * **Bossa nova stays in jazz**, and it is in the right place. The bossa in this
 * catalogue is a jazz quintet's bossa: `guide` voicings, `ii7 V7 Imaj7`, and a
 * melody that follows the *chord* because that is what the band around it does.
 * Nothing below is a bossa, and the Brazilian entries here are deliberately the
 * ones bossa nova is not — a samba de roda, a partido alto, a baião and a frevo,
 * which are a school-yard drum battery, a sung response over a pandeiro, a
 * leather-and-triangle two-step from Pernambuco and a carnival march. The one
 * Brazilian music with a jazz harmony in it is already housed with the jazz.
 *
 * **The tango stays in iskelmä, and no tango is written here.** That is the
 * decision most likely to look like an omission, so: the Río de la Plata is the
 * one major urban Latin-American dance with *no percussion section at all*. A
 * tango orchestra is bandoneóns, violins, piano and contrabass — a chamber
 * group — and every ensemble fact this genre is built on is missing from it.
 * Writing an Argentine tango here would mean the folder had two organising
 * principles with one style under the second, and the folder next door would
 * still contain a tango, which reads as a duplication whatever a header says.
 * If the Argentine article is ever wanted it wants a Río de la Plata genre with
 * a milonga, a vals criollo and a tango nuevo in it, not one style bolted onto a
 * catalogue whose every other entry has congas in it.
 *
 * **Iskelmä's "beguine / rumba" is the ballroom rhumba**, which is a preset
 * button on a Finnish rhythm box and a 3-3-2 bass, and it is correctly filed as
 * a thing a tanssilava band plays. `guaguanco` and `columbia` below are the
 * *Cuban* rumba — three tuned barrel drums, a clave, a lead singer and no
 * chordal instrument required — and they share a word with it and nothing else.
 * The collision is in the English language rather than in the music, which is
 * worth saying once here so that nobody reads the two tables as a copy.
 *
 * **Reggaetón is not here**, and the argument is the same shape. Its rhythmic
 * key is the dembow, which is a Jamaican pattern off a 1990 Shabba Ranks side by
 * way of Panama; its ancestor is three styles away in `genre/reggae/`, filed
 * beside `dancehall` and `ragga` where it belongs. Admitting it would make this
 * genre's boundary *Spanish-language*, and a language is the one boundary that
 * lets in everything.
 *
 * ## What is uniform, and why each is a decision
 *
 *  - **`relativeMajorChorus` is 0 on every clave style.** The lift from i into
 *    III is a dance-band arranger's gesture, and a montuno is a fixed two- or
 *    four-bar vamp that a coro sings over for as long as the sonero keeps
 *    going. A vamp that changed key in its second half would not be a vamp. The
 *    bolero, the bachata and the ranchera carry a real number, because those
 *    three are songs before they are grooves.
 *  - **`syncopation` runs 0.45 to 0.72 across the clave styles.** A tune written
 *    against a two-bar key is anticipating something in most bars, and a melody
 *    that stayed inside its own bar would be agreeing with a downbeat the bass
 *    is deliberately not playing.
 *  - **`swing: 0` everywhere.** Every one of these is straight, including the
 *    ones whose triplet feel is real: a 6/8 columbia and a mariachi
 *    sesquiáltera are *written* in three, not swung in two, and expressing them
 *    with a swing ratio would produce a shuffle rather than a metre.
 */

import type { BassPattern, CompPattern, DrumPattern, Style } from '../../style/types.js';
import type { DrumVoice } from '../../core/types.js';
import { makeScale } from '../../core/scale.js';

// ---------------------------------------------------------------------------
// The keys — five figures, and the whole first family is written against them
// ---------------------------------------------------------------------------

/**
 * Write a one-bar figure twice inside a two-bar cycle.
 *
 * The conga marcha, the maracas and the güiro genuinely repeat every bar while
 * the clave takes two, and a `DrumPattern` carries one `cycle` for all its
 * voices. Rather than give those parts a cycle they cannot have, they are
 * spelled out across both halves — which is also what a player reading a
 * two-bar chart does, and what makes the asymmetry visible at the point where
 * one voice stops matching its neighbour.
 */
const twice = (slots: number[]): number[] => [...slots, ...slots.map((s) => s + 16)];

/**
 * SON CLAVE, 3-2. Slots 0, 6, 12 and then 20, 24 of a thirty-two-slot cycle.
 *
 * Read it as two bars of a 4/4 that has been counted in sixteenths. The first
 * bar takes three strokes — the downbeat, the *and* of two, and beat four — and
 * the second takes two, on beats two and three. Nothing about that is
 * decorative: the three-side is where the band leans and the two-side is where
 * it answers, and every figure in the son family below is placed relative to
 * one or the other.
 *
 * The stroke at slot 6 is the one that matters most and is the one a
 * non-Caribbean band drops first. It is a full eighth *before* the middle of
 * the bar, and the whole forward lean of this music is that a bass, a piano and
 * a conga are all arriving there together while the drummer is not playing the
 * beat on either side of it.
 */
const SON_32 = [0, 6, 12, 20, 24];

/**
 * SON CLAVE, 2-3 — the same five strokes with the halves exchanged.
 *
 * Not a variant and not a rotation of taste. Which way round the clave runs is
 * decided by the *tune*, before anybody plays anything: a melody whose phrase
 * starts on the strong bar is in 3-2 and one that begins on the answering bar
 * is in 2-3, and the rhythm section is then obliged for the duration of the
 * number. Both directions are offered per style at real weights so that a
 * catalogue drawn over a whole set contains both, which is what a real
 * bandstand does across an evening and what a genre that only ever wrote 3-2
 * would quietly assert never happens.
 */
const SON_23 = [4, 8, 16, 22, 28];

/**
 * RUMBA CLAVE, 3-2 — son clave with the third stroke a sixteenth later.
 *
 * Slot 14 instead of slot 12, and that single sixteenth is the entire
 * difference between a dance orchestra and a drum circle in a solar. The son
 * stroke lands *on* beat four and closes the bar; the rumba stroke lands on the
 * last sixteenth before it and refuses to, so the three-side never resolves and
 * the two-side has to catch it. Guaguancó and columbia below are the only
 * styles that use it, and they are the only two here with no European
 * instrument in the room.
 */
const RUMBA_32 = [0, 6, 14, 20, 24];

/** RUMBA CLAVE, 2-3. */
const RUMBA_23 = [4, 8, 16, 22, 30];

/**
 * THE 6/8 CLAVE — twelve pulses, which is two bars of 6/8 and `cycle: 24`.
 *
 * The same five strokes counted in threes rather than in twos, and the older
 * of the two shapes by several centuries: it is the standard bell of most of
 * West Africa, it arrived in Cuba in the religious repertoire, and the son
 * clave is audibly it with the triplets squared off. Pulses 0, 3, 6, 8 and 10 of
 * twelve, which on a three-beat bar of twelve sixteenths is slots 0, 6, 12, 16
 * and 20 — the third stroke landing exactly on the second bar's downbeat, which
 * is the property the 4/4 version had to give up.
 */
const CLAVE_68 = [0, 6, 12, 16, 20];

/**
 * THE CÁSCARA — the timbalero's shell pattern, and the other two-bar key.
 *
 * Played with the sticks on the *side* of the drum rather than the head, which
 * is why it is written on a tom voice at a low velocity rather than on a snare:
 * it is a dry wooden clatter, not a drum being struck. It runs under the verse
 * and stops the moment the montuno arrives, at which point the same player
 * moves to the mounted bell — which is why `cb` and this pattern are never in
 * the same style's busiest figure.
 *
 * Nine strokes over two bars, interlocking with the clave rather than doubling
 * it: five of them fall where the clave does not.
 */
const CASCARA_32 = [0, 4, 8, 10, 14, 18, 22, 24, 28];

/** The 2-3 cáscara — the same nine strokes, halves exchanged. */
const CASCARA_23 = [16, 20, 24, 26, 30, 2, 6, 8, 12].sort((a, b) => a - b);

/**
 * THE CAMPANA — the hand bell, and the single loudest object in a mambo.
 *
 * The bongosero puts the drums down at the montuno and picks up a cencerro, and
 * from that bar to the end of the number the bell is what the whole band is
 * counting from. It is not an accent and it is not optional: a salsa montuno
 * with no bell in it is a salsa montuno somebody has mixed the bell out of.
 * Quarters on all four beats with the *and* of two and the *and* of four
 * filled, which is the pattern everybody plays and the reason it sits so
 * naturally on top of the clave without agreeing with it anywhere except the
 * downbeat.
 */
const CAMPANA = twice([0, 4, 6, 8, 12, 14]);

/** Maracas — straight eighths, and the part with no holes in it. */
const MARACAS = twice([0, 2, 4, 6, 8, 10, 12, 14]);

/**
 * The güiro, and the reason it is `perc` rather than `sh`.
 *
 * A gourd scraped with a stick is not a shaker: the long down-stroke and the
 * two short up-strokes are three distinguishable events with three lengths, and
 * in most of this repertoire the maracas are playing at the same time. Two
 * scrapers on one voice would be one scraper twice as loud, so the maracas keep
 * `sh` — which is what that voice is named for — and the scraped instruments
 * take `perc`, which is where the güiro, the guacharaca and the güira all go.
 */
const GUIRO = twice([0, 4, 6, 12, 14]);

/**
 * THE MARCHA — the conga part, on the three hand-drum voices.
 *
 * `lp`, `mp` and `hp` are the low, mid and high strokes of a hand drum and they
 * are role-named rather than instrument-named for exactly this case: here they
 * are a tumbadora's bass tone, its open tone and its slap, and forty lines
 * further down they are a bongó's hembra and macho, a pandeiro's three strokes,
 * a bomba barrel and a zabumba.
 *
 * The figure is the one every conguero learns first. Heel on one and three
 * (`lp` — a muffled palm in the middle of the head, felt rather than heard), a
 * slap on two (`hp` — the crack), and **two open tones on beat four and the and
 * of four** (`mp`), which are the notes the dance is actually on. Those last two
 * are why the conga is the instrument that tells a floor where the bar ended:
 * they arrive after everything else has stopped and hand the next bar over.
 *
 * One bar, written twice. The marcha does not know about the clave's halves —
 * it is the constant against which the clave's asymmetry is heard — and that is
 * a fact about the part rather than a shortcut.
 */
const MARCHA: Partial<Record<DrumVoice, number[]>> = {
  lp: twice([0, 8]),
  hp: twice([4]),
  mp: twice([12, 14]),
};

/**
 * THE MARTILLO — the bongó, and the busiest quiet part in the music.
 *
 * "Little hammer": continuous eighths on the macho with the thumb dropping onto
 * the hembra on one and three. It never stops and it is never loud, and its job
 * is to fill every hole the clave leaves so that the holes are audible as
 * choices. Written on the same three voices as the marcha, because a son
 * conjunto has a bongosero *or* a conguero on most of its recordings and not
 * both — and where a style really wants both, the engine has three hand-drum
 * voices in total and one of the two parts has to give. That is stated where it
 * happens rather than papered over.
 */
const MARTILLO: Partial<Record<DrumVoice, number[]>> = {
  lp: twice([0, 8]),
  hp: twice([2, 4, 6, 10, 12, 14]),
};

/**
 * THE TUMBAO — the bass, and it is famously not on beat one.
 *
 * Two notes a bar: the *bombo*, an eighth before the middle of the bar, and the
 * *ponche* on beat four. Beat one is empty in every bar of every clave style
 * below, and the note that covers it is the previous bar's ponche still
 * sounding — which is why the fourth-beat note is written six sixteenths long
 * and runs past the barline.
 *
 * **The tones are numbers, not chord functions.** `BassTone` says why: a number
 * is semitones from the chord root taken literally, and a tumbao is a shape
 * rather than an outline. `-5` is the fifth below the root under a minor chord,
 * a major one and a dominant alike, which is what a bass player's hand does;
 * asking for `'fifth'` would renegotiate with each quality and the shape would
 * move.
 *
 * **The two bars are not the same bar twice**, and that is what the cycle buys.
 * The fifth is below the root in the three-side bar and above it in the
 * two-side, which is not decoration — it is how a bassist keeps a figure that
 * repeats forty times from sounding like a sequencer, and it puts the register
 * change exactly where the clave changes halves.
 *
 * The one thing this cannot express is the anticipation's *harmony*. A real
 * ponche is the **next** bar's root arriving early, and `Cycle` is explicit that
 * chords change on the barline and a hit takes the chord it lands in. So the
 * note is rhythmically right and harmonically a bar behind, and the mitigation
 * is in the progression tables rather than here: the montuno vamps below hold
 * each chord for a whole bar and repeat in two- and four-bar cells, so the
 * anticipated note is inside its own chord far more often than not.
 */
const tumbao = (weight: number, name = 'tumbao'): BassPattern => ({
  name, weight, cycle: 32,
  hits: [
    { at: 6, dur: 2, tone: -5, vel: 0.88 },
    { at: 12, dur: 6, tone: 0, vel: 1 },
    { at: 22, dur: 2, tone: 7, vel: 0.85 },
    { at: 28, dur: 6, tone: 0, vel: 0.96 },
  ],
});

/**
 * The tumbao with the octave in it — the same two events, an octave apart.
 *
 * What a bassist plays when the arrangement thins and the figure has to carry
 * more of the bar on its own. The bombo drops to the octave below and the
 * ponche stays at the root, so the two events separate in register as well as
 * in weight.
 */
const tumbaoOctave = (weight: number): BassPattern => ({
  name: 'tumbao-octava', weight, cycle: 32,
  hits: [
    { at: 6, dur: 2, tone: -12, vel: 0.86 },
    { at: 12, dur: 6, tone: 0, vel: 1 },
    { at: 20, dur: 2, tone: 0, vel: 0.7 },
    { at: 22, dur: 2, tone: 7, vel: 0.84 },
    { at: 28, dur: 6, tone: 0, vel: 0.96 },
  ],
});

/**
 * THE MONTUNO — the piano's two-bar guajeo, and the interlocking part.
 *
 * Near-continuous eighths with **two holes in different places in the two
 * bars**, and that asymmetry is the whole figure. Bar one has its downbeat and
 * loses beat three; bar two has no downbeat at all, because the *and* of four in
 * bar one is held four sixteenths and rings straight through the barline. That
 * tie is the single most characteristic thing a Cuban pianist does and it is
 * exactly what a bar-shaped comp pattern cannot produce — the figure has to be
 * two bars long before the anticipation has anywhere to go.
 *
 * The velocities carry the clave. The accented eighths fall on slots 0, 6, 12,
 * 20 and 24, which is son clave 3-2 note for note, so the montuno agrees with
 * the key without doubling it: everything else in the figure is a quiet eighth
 * filling the space between the strokes. Played flat it is a sixteen-note
 * exercise; played this way the clave is audible in a part that never states it.
 *
 * `tertian` rather than `guide`. A montuno is a chord *spelled out* — root,
 * third, fifth, octave in the right hand doubled in the left — and dropping the
 * root to lead with guide tones is a jazz pianist's voicing under a walking
 * bass. There is no walking bass here; there is a tumbao with a hole on beat
 * one, and the piano is one of the two things covering it.
 */
const montuno = (weight: number, voices = 3): CompPattern => ({
  name: 'montuno', weight, voices, cycle: 32, voicing: 'tertian',
  hits: [
    { at: 0, dur: 2, vel: 0.88 }, { at: 2, dur: 2, vel: 0.6 },
    { at: 4, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.86 },
    { at: 10, dur: 2, vel: 0.66 }, { at: 12, dur: 2, vel: 0.9 },
    { at: 14, dur: 4, vel: 0.74 },
    { at: 18, dur: 2, vel: 0.6 }, { at: 20, dur: 2, vel: 0.86 },
    { at: 22, dur: 2, vel: 0.62 }, { at: 24, dur: 2, vel: 0.9 },
    { at: 26, dur: 2, vel: 0.64 }, { at: 28, dur: 2, vel: 0.7 },
    { at: 30, dur: 2, vel: 0.8 },
  ],
});

/**
 * The 2-3 montuno — the same figure with its halves exchanged, so the holes and
 * the tie land in the other bar.
 *
 * Written out rather than derived. A rotation by sixteen would put the tie at
 * the end of the cycle where it has nothing to ring into, and the point of the
 * figure is that the anticipation crosses a barline *inside* it.
 */
const montuno23 = (weight: number, voices = 3): CompPattern => ({
  name: 'montuno-2-3', weight, voices, cycle: 32, voicing: 'tertian',
  hits: [
    { at: 0, dur: 2, vel: 0.7 }, { at: 2, dur: 2, vel: 0.6 },
    { at: 4, dur: 2, vel: 0.86 }, { at: 6, dur: 2, vel: 0.62 },
    { at: 8, dur: 2, vel: 0.9 }, { at: 10, dur: 2, vel: 0.64 },
    { at: 12, dur: 2, vel: 0.7 }, { at: 14, dur: 4, vel: 0.8 },
    { at: 18, dur: 2, vel: 0.6 }, { at: 20, dur: 2, vel: 0.7 },
    { at: 22, dur: 2, vel: 0.86 }, { at: 26, dur: 2, vel: 0.66 },
    { at: 28, dur: 2, vel: 0.9 }, { at: 30, dur: 2, vel: 0.74 },
  ],
});

/**
 * The tres guajeo — the same job on four fewer strings and half the notes.
 *
 * A tres plays the interlocking figure in a son conjunto and the piano plays it
 * in an orquesta; where both are present they play *different* ones, which is
 * the texture the word conjunto means. This is the sparser of the two: the
 * offbeat eighths and the anticipation, with the downbeats left to the piano.
 */
const guajeo = (weight: number, voices = 3): CompPattern => ({
  name: 'guajeo', weight, voices, cycle: 32, voicing: 'tertian',
  hits: [
    { at: 2, dur: 2, vel: 0.72 }, { at: 6, dur: 2, vel: 0.9 },
    { at: 10, dur: 2, vel: 0.7 }, { at: 14, dur: 4, vel: 0.84 },
    { at: 20, dur: 2, vel: 0.88 }, { at: 22, dur: 2, vel: 0.64 },
    { at: 24, dur: 2, vel: 0.86 }, { at: 30, dur: 2, vel: 0.76 },
  ],
});

/**
 * What a band hits together at a seam, and none of it is on a beat the kit is
 * playing.
 *
 * `Style.shots` derives from `groups` and `metricStrength` where a style says
 * nothing, and the derivation gives the group heads — slots 0, 4, 8, 12 in 4/4.
 * Three of those four are exactly where a clave band does not land. A *bloque*
 * is a figure off the clave: the ponche on four, the bombo and the ponche
 * together, or the whole three-side caught by eight people at once.
 *
 * Shared rather than repeated, because it is a fact about the idiom. The
 * non-clave families below write their own.
 */
const CLAVE_SHOTS: (readonly [number[], number])[] = [
  [[12], 4],
  [[6, 12], 4],
  [[0, 6, 12], 3],
  [[14], 2],
  [[6, 12, 14], 2],
];

// ---------------------------------------------------------------------------
// Cuba: the son family
// ---------------------------------------------------------------------------

/**
 * SON MONTUNO — the conjunto, and the root of everything below it.
 *
 * Oriente province in the 1910s, Havana by the 1920s, and the septeto's
 * instrumentation is the shape the whole first family keeps: tres, trumpet,
 * guitar, contrabass, bongó, maracas and claves. Arsenio Rodríguez adds the
 * piano, the congas and a second and third trumpet in the 1940s and it becomes
 * the conjunto, which is the ensemble every salsa band on earth is still a
 * version of.
 *
 * The form is the fact to build the style around, and it is why the
 * progressions are shaped the way they are. A son is in two halves: a sung
 * *largo* over real changes, and then the **montuno**, which is a two- or
 * four-bar vamp that everybody stays on while the sonero improvises against a
 * fixed coro. That is not a chorus in the pop sense and it is not a solo
 * section in the jazz sense — it is the part of the number the dance is for,
 * and it can last as long as the floor holds up. The `chorus` and `solo` tables
 * below are therefore the shortest and most repetitive in the file, on purpose.
 *
 * The tres carries the guajeo and the bongó plays the martillo. Both of the
 * two-bar figures at the top of the file are here in their first and plainest
 * form.
 */
const son: Style = {
  id: 'son',
  label: 'Son montuno',
  description:
    'The Cuban son conjunto. Tres guajeo, piano montuno, an anticipated tumbao that never plays beat one, and a two-bar clave everything is written against.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [160, 196],
  swing: 0,
  modeWeights: { minor: 0.42, major: 0.58 },
  relativeMajorChorus: 0,
  shots: CLAVE_SHOTS,
  progressions: {
    intro: [
      { chords: ['I', 'I', 'V7', 'V7'], weight: 4 },
      { chords: ['I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 5, note: 'The largo: two chords and a great deal of text' },
      { chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'VI7', 'II7', 'V7', 'I', 'VI7', 'II7', 'V7'], weight: 3, note: 'Applied dominants round the circle — the son took these from the danzón orchestra' },
      { chords: ['I', 'I', 'IV', 'iv', 'I', 'V7', 'I', 'I'], weight: 2, note: 'The borrowed minor fourth, which is where harmonicMajor gets used' },
    ],
    chorus: [
      { chords: ['I', 'IV', 'V7', 'V7', 'I', 'IV', 'V7', 'V7'], weight: 5, note: 'The montuno: a four-bar cell, twice, and nobody leaves it' },
      { chords: ['I', 'I', 'V7', 'V7', 'I', 'I', 'V7', 'V7'], weight: 4 },
      { chords: ['IV', 'IV', 'I', 'I', 'IV', 'IV', 'V7', 'V7'], weight: 3 },
    ],
    bridge: [
      { chords: ['IV', 'IV', 'I', 'I', 'II7', 'II7', 'V7', 'V7'], weight: 3 },
    ],
    solo: [
      { chords: ['I', 'IV', 'V7', 'V7', 'I', 'IV', 'V7', 'V7'], weight: 5 },
    ],
    outro: [{ chords: ['IV', 'V7', 'I', 'I'], weight: 4 }],
  },
  minorProgressions: {
    intro: [{ chords: ['i', 'i', 'V7', 'V7'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'VI', 'ii%7', 'V7', 'i', 'VI', 'ii%7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'iv', 'V7', 'V7', 'i', 'iv', 'V7', 'V7'], weight: 5 },
      { chords: ['i', 'i', 'V7', 'V7', 'i', 'i', 'V7', 'V7'], weight: 4 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'i', 'i', 'V7/V', 'V7/V', 'V7', 'V7'], weight: 3 }],
    solo: [{ chords: ['i', 'iv', 'V7', 'V7', 'i', 'iv', 'V7', 'V7'], weight: 5 }],
    outro: [{ chords: ['iv', 'V7', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [-2, 2, 4, 4, 4], weight: 5 },
    { cell: [6, 2, 4, 4], weight: 5 },
    { cell: [-2, 4, 4, 6], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [6, 6, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 3 },
    { cell: [-4, 6, 2, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [-2, 14], weight: 3 },
    { cell: [6, 6, 4], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [tumbao(7), tumbaoOctave(3)],
  comp: [montuno(6), guajeo(4), montuno23(3)],
  drums: [
    { name: 'son-3-2', weight: 6, cycle: 32, voices: {
      rim: SON_32, ...MARTILLO, sh: MARACAS, perc: GUIRO,
    } },
    { name: 'son-2-3', weight: 4, cycle: 32, voices: {
      rim: SON_23, ...MARTILLO, sh: MARACAS,
    } },
    { name: 'son-conga-3-2', weight: 4, cycle: 32, voices: {
      rim: SON_32, ...MARCHA, sh: MARACAS, cb: CAMPANA,
    } },
  ],
  /**
   * On the nights the palette deals a piano, that piano vamps.
   *
   * No `instruments` list, which is the weaker and truer claim — a son's lead is
   * a tres, a trumpet or a voice far more often than it is a keyboard, and
   * seizing the palette would have produced a genre of piano sones. What is true
   * every time is that a Cuban pianist's left hand does not answer phrases; it
   * plays the montuno, in octaves, from the first bar to the last. Hence
   * `ostinato` at nearly all the weight, with `block` behind it for the sung
   * largo where the piano really does sit under the line.
   */
  twoHanded: {
    density: 0.72,
    modes: [['ostinato', 8], ['block', 2]],
    ostinato: {
      cycle: 32,
      hits: [
        { at: 0, dur: 2, vel: 0.8 }, { at: 4, dur: 2, vel: 0.66 },
        { at: 6, dur: 2, vel: 0.82 }, { at: 10, dur: 2, vel: 0.64 },
        { at: 12, dur: 2, vel: 0.86 }, { at: 14, dur: 4, vel: 0.7 },
        { at: 20, dur: 2, vel: 0.82 }, { at: 24, dur: 2, vel: 0.86 },
        { at: 26, dur: 2, vel: 0.62 }, { at: 30, dur: 2, vel: 0.76 },
      ],
    },
  },
  melody: { leap: 0.26, ornament: 0.22, span: 14, sequence: 0.45, syncopation: 0.62 },
};

/**
 * GUARACHA — the son at speed, with a joke in it.
 *
 * Older than the son as a genre and absorbed by it as a tempo: a guaracha is
 * what a Havana band calls a fast, major, wordy number with a comic or satirical
 * text, and by the 1950s it is the thing most people outside Cuba were actually
 * hearing when they said mambo. It is in the catalogue as a separate style
 * rather than as a fast son for two reasons that are both in the tables — the
 * tempo band starts where the son's ends, and the harmony is simpler and closer
 * to three chords, because a text delivered at this rate has no room for a
 * circle of fifths under it.
 *
 * The clave is 2-3 more often than 3-2 here, which is a real tendency rather
 * than a coin toss: a guaracha's phrases start on the answering bar because the
 * punchline lands on the strong one.
 */
const guaracha: Style = {
  id: 'guaracha',
  label: 'Guaracha',
  description:
    'The fast, major, wordy end of the son. Three chords, a 2-3 clave more often than not, and a coro that answers before the singer has finished.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [196, 232],
  swing: 0,
  modeWeights: { minor: 0.2, major: 0.8 },
  relativeMajorChorus: 0,
  shots: CLAVE_SHOTS,
  progressions: {
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'IV', 'V7', 'V7', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['I', 'V7', 'I', 'V7', 'I', 'V7', 'I', 'V7'], weight: 5, note: 'A two-bar montuno cell, four times. The coro is what changes, not the chords' },
      { chords: ['IV', 'V7', 'I', 'I', 'IV', 'V7', 'I', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'II7', 'II7', 'V7', 'V7', 'V7', 'V7'], weight: 3 }],
    solo: [{ chords: ['I', 'V7', 'I', 'V7', 'I', 'V7', 'I', 'V7'], weight: 5 }],
    outro: [{ chords: ['V7', 'V7', 'I', 'I'], weight: 4 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'V7', 'i', 'V7', 'i', 'V7', 'i', 'V7'], weight: 5 },
      { chords: ['iv', 'V7', 'i', 'i', 'iv', 'V7', 'i', 'i'], weight: 3 },
    ],
    solo: [{ chords: ['i', 'V7', 'i', 'V7', 'i', 'V7', 'i', 'V7'], weight: 5 }],
    outro: [{ chords: ['V7', 'V7', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [-2, 4, 4, 6], weight: 3 },
    { cell: [4, 2, 2, 4, 4], weight: 3 },
    { cell: [6, 6, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 3 },
    { cell: [-2, 6, 8], weight: 3 },
    { cell: [6, 6, 4], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [tumbao(7), tumbaoOctave(4)],
  comp: [montuno23(6), montuno(4), guajeo(3)],
  drums: [
    { name: 'guaracha-2-3', weight: 6, cycle: 32, voices: {
      rim: SON_23, ...MARCHA, cb: CAMPANA, sh: MARACAS,
    } },
    { name: 'guaracha-3-2', weight: 4, cycle: 32, voices: {
      rim: SON_32, ...MARCHA, cb: CAMPANA, sh: MARACAS,
    } },
    { name: 'guaracha-cascara', weight: 3, cycle: 32, voices: {
      rim: SON_23, mt: CASCARA_23, ...MARTILLO, sh: MARACAS,
    } },
  ],
  twoHanded: {
    density: 0.75,
    modes: [['ostinato', 9], ['block', 1]],
    ostinato: {
      cycle: 32,
      hits: [
        { at: 4, dur: 2, vel: 0.84 }, { at: 8, dur: 2, vel: 0.88 },
        { at: 10, dur: 2, vel: 0.62 }, { at: 14, dur: 4, vel: 0.76 },
        { at: 18, dur: 2, vel: 0.62 }, { at: 22, dur: 2, vel: 0.86 },
        { at: 26, dur: 2, vel: 0.66 }, { at: 28, dur: 2, vel: 0.88 },
        { at: 30, dur: 2, vel: 0.7 },
      ],
    },
  },
  melody: { leap: 0.28, ornament: 0.2, span: 13, sequence: 0.5, syncopation: 0.68 },
};

/**
 * GUAJIRA — the son slowed down and pointed at the countryside.
 *
 * The *punto guajiro* of the tobacco provinces meeting the urban son: slow,
 * almost always major, and built on a lyric about a place rather than about a
 * person. Its harmonic signature is the one thing that separates it at a
 * glance — a guajira alternates minor and major over the *same* tonic across
 * its two halves, so the verse sits in i and the montuno lifts into I with no
 * modulation and no preparation at all.
 *
 * That is genuinely unusual and it is expressed here as `relativeMajorChorus:
 * 0` plus a major chorus table reached from a minor verse — the lift is written
 * into the chords rather than performed by the arranger, because it is a
 * property of the song form and not a decision somebody makes on the night.
 *
 * The rhythm section is at its lightest: no congas, a bongó at half volume,
 * maracas, and a tres playing arpeggios rather than a guajeo. This is the one
 * style in the family where the guitar is more likely than the piano.
 */
const guajira: Style = {
  id: 'guajira',
  label: 'Guajira',
  description:
    'The countryside son: slow, lyrical, and alternating a minor verse with a major montuno over the same tonic. Tres arpeggios, maracas, and the lightest rhythm section in the family.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [128, 156],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  shots: CLAVE_SHOTS,
  progressions: {
    intro: [{ chords: ['I', 'IV', 'V7', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'vi', 'ii7', 'V7', 'I', 'vi', 'ii7', 'V7'], weight: 4 },
      { chords: ['I', 'V7/IV', 'IV', 'iv', 'I', 'V7', 'I', 'I'], weight: 3, note: 'The tonic turned into its own dominant, then the borrowed minor fourth' },
    ],
    chorus: [
      { chords: ['I', 'IV', 'V7', 'V7', 'I', 'IV', 'V7', 'V7'], weight: 5 },
      { chords: ['I', 'I', 'V7', 'V7', 'I', 'I', 'V7', 'V7'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'I', 'I', 'II7', 'II7', 'V7', 'V7'], weight: 3 }],
    solo: [{ chords: ['I', 'IV', 'V7', 'V7', 'I', 'IV', 'V7', 'V7'], weight: 4 }],
    outro: [{ chords: ['IV', 'V7', 'I', 'I'], weight: 3 }],
  },
  minorProgressions: {
    intro: [{ chords: ['i', 'iv', 'V7', 'i'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'V7', 'V7', 'i', 'i'], weight: 5, note: 'The guajira half of the guajira: minor, slow, and going nowhere in particular' },
      { chords: ['i', 'VI', 'ii%7', 'V7', 'i', 'VI', 'ii%7', 'V7'], weight: 4 },
      { chords: ['i', 'V7', 'i', 'V7', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['I', 'IV', 'V7', 'V7', 'I', 'IV', 'V7', 'V7'], weight: 5, note: 'And the montuno half, in the parallel major, with nothing preparing it' },
      { chords: ['I', 'I', 'V7', 'V7', 'I', 'I', 'V7', 'V7'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'i', 'i', 'V7/V', 'V7/V', 'V7', 'V7'], weight: 3 }],
    solo: [{ chords: ['I', 'IV', 'V7', 'V7', 'I', 'IV', 'V7', 'V7'], weight: 4 }],
    outro: [{ chords: ['iv', 'V7', 'i', 'i'], weight: 3 }],
  },
  melodyCells: [
    { cell: [6, 2, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-2, 2, 4, 8], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [4, 2, 2, 8], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 3 },
    { cell: [-2, 14], weight: 2 },
  ],
  bass: [tumbao(6), { name: 'guajira-two-beat', weight: 4, hits: [
    { at: 0, dur: 6, tone: 0, vel: 0.94 },
    { at: 8, dur: 6, tone: 'fifth', vel: 0.8 },
  ] }],
  comp: [
    { name: 'tres-arpeggio', weight: 6, voices: 4, cycle: 32, voicing: 'tertian',
      arpeggio: true, arpDirection: 'updown', hits: [
        { at: 0, dur: 2, vel: 0.6 }, { at: 4, dur: 2, vel: 0.56 },
        { at: 6, dur: 2, vel: 0.68 }, { at: 10, dur: 2, vel: 0.54 },
        { at: 12, dur: 2, vel: 0.7 }, { at: 14, dur: 2, vel: 0.6 },
        { at: 18, dur: 2, vel: 0.56 }, { at: 20, dur: 2, vel: 0.68 },
        { at: 24, dur: 2, vel: 0.7 }, { at: 28, dur: 2, vel: 0.58 },
        { at: 30, dur: 2, vel: 0.64 },
      ] },
    guajeo(4),
    montuno(3),
  ],
  drums: [
    { name: 'guajira-light', weight: 6, cycle: 32, voices: {
      rim: SON_32, sh: MARACAS, hp: twice([2, 6, 10, 14]), lp: twice([0, 8]),
    } },
    { name: 'guajira-bongo', weight: 4, cycle: 32, voices: {
      rim: SON_23, ...MARTILLO, sh: MARACAS, perc: GUIRO,
    } },
  ],
  twoHanded: {
    density: 0.62,
    modes: [['ostinato', 5], ['block', 3], ['answer', 2]],
    ostinato: {
      cycle: 32,
      hits: [
        { at: 0, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.78 },
        { at: 12, dur: 2, vel: 0.8 }, { at: 14, dur: 4, vel: 0.64 },
        { at: 20, dur: 2, vel: 0.78 }, { at: 24, dur: 2, vel: 0.8 },
        { at: 30, dur: 2, vel: 0.68 },
      ],
    },
  },
  melody: { leap: 0.2, ornament: 0.3, span: 15, sequence: 0.4, syncopation: 0.45 },
};

/**
 * BOLERO — the slow one, and the one that travelled furthest.
 *
 * Santiago de Cuba in the 1880s, and by 1950 it is the common ballad language of
 * every Spanish-speaking country on two continents — which is why the bachata,
 * the ranchera and half of Mexican film music below are legible as relatives of
 * it rather than as neighbours. It is a *song* before it is a groove, and the
 * tables say so: the largest harmonic vocabulary in the file, real ii–V motion,
 * secondary dominants, borrowed minor fourths, and `relativeMajorChorus` at a
 * genuine number where every other clave style has zero.
 *
 * The rhythm underneath is the **cinquillo** — five strokes in the space of four
 * — and it is written on the bongó rather than on a kit, at a tempo where
 * everything has time to ring. `feels` carries `laidback` at a real weight
 * because this is the one style here where the band deliberately sits behind
 * the beat; everything else in the family is either on it or ahead of it.
 *
 * No cowbell anywhere. A bolero has no montuno to put one on, and a campana at
 * this tempo is a completely different number.
 */
const bolero: Style = {
  id: 'bolero',
  label: 'Bolero',
  description:
    'The Cuban slow song. Cinquillo on the bongó, a requinto answering the line, real ii–V harmony, and a band that sits behind the beat on purpose.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [76, 104],
  swing: 0,
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0.35,
  /**
   * A bolero's pulse is a rubato the band shares, and a preset button holds a
   * tempo exactly — which is the one thing this must not do. The same argument
   * iskelmä makes about its tango, arrived at from the other side of the
   * Atlantic and for a rhythm that has nothing else in common with it.
   */
  boxDrums: false,
  feels: [['straight', 5], ['laidback', 4]],
  shots: [[[12], 3], [[6, 12], 3], [[0, 12], 2], [[8], 2]],
  progressions: {
    intro: [
      { chords: ['i', 'VI', 'ii%7', 'V7'], weight: 4 },
      { chords: ['iv', 'V7', 'i', 'i'], weight: 3 },
    ],
    verse: [
      { chords: ['i', 'i', 'ii%7', 'V7', 'i', 'i', 'ii%7', 'V7'], weight: 5 },
      { chords: ['i', 'V7/iv', 'iv', 'VII7', 'III', 'VI', 'ii%7', 'V7'], weight: 4, note: 'The circle through the relative major — the bolero at its most florid' },
      { chords: ['i', 'VI', 'iv', 'V7', 'i', 'VI', 'ii%7', 'V7'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'V7', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VI', 'VI', 'ii%7', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'i', 'i', 'ii%7', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['VI', 'VII7', 'III', 'III', 'iv', 'V7', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'bII', 'bII', 'V7', 'V7', 'i', 'i'], weight: 3, note: 'The Neapolitan, which the bolero borrowed from the salon and never gave back' },
      { chords: ['VI', 'VI', 'V7/V', 'V7/V', 'V7', 'V7', 'i', 'i'], weight: 3 },
    ],
    solo: [{ chords: ['i', 'i', 'ii%7', 'V7', 'i', 'i', 'ii%7', 'V7'], weight: 4 }],
    outro: [{ chords: ['iv', 'V7', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    intro: [{ chords: ['I', 'vi', 'ii7', 'V7'], weight: 4 }],
    verse: [
      { chords: ['I', 'vi', 'ii7', 'V7', 'I', 'vi', 'ii7', 'V7'], weight: 5 },
      { chords: ['I', 'V7/IV', 'IV', 'iv', 'I', 'VI7', 'ii7', 'V7'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'iv', 'I', 'V7', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'ii7', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'VI7', 'II7', 'V7', 'I', 'IV', 'V7', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['IV', 'iv', 'I', 'VI7', 'II7', 'V7', 'I', 'I'], weight: 3 }],
    solo: [{ chords: ['I', 'vi', 'ii7', 'V7', 'I', 'vi', 'ii7', 'V7'], weight: 4 }],
    outro: [{ chords: ['IV', 'V7', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 8], weight: 5 },
    { cell: [6, 2, 8], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 8], weight: 3 },
    { cell: [-2, 2, 4, 8], weight: 3 },
    { cell: [3, 1, 4, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 2 },
    { cell: [4, 12], weight: 2 },
  ],
  /**
   * The bolero bass, and the reason it is not a tumbao.
   *
   * Two notes, both on strong beats, and beat one *present* — which is the one
   * place in the clave family where that is true. A bolero is slow enough that
   * an empty downbeat stops reading as a lean and starts reading as a mistake,
   * and the anticipation moves to the singer instead. The third pattern is the
   * cinquillo proper, with the bass playing the five-stroke figure the bongó is
   * playing above it, which is what a trio does when there is no percussionist.
   */
  bass: [
    { name: 'bolero-two', weight: 6, hits: [
      { at: 0, dur: 6, tone: 0, vel: 0.96 },
      { at: 8, dur: 6, tone: 'fifth', vel: 0.82 },
    ] },
    { name: 'bolero-anticipated', weight: 4, hits: [
      { at: 0, dur: 6, tone: 0, vel: 0.96 },
      { at: 8, dur: 4, tone: 'fifth', vel: 0.8 },
      { at: 14, dur: 2, tone: 0, vel: 0.74 },
    ] },
    { name: 'cinquillo-bass', weight: 3, hits: [
      { at: 0, dur: 2, tone: 0, vel: 0.94 },
      { at: 3, dur: 1, tone: 0, vel: 0.62 },
      { at: 4, dur: 2, tone: 7, vel: 0.8 },
      { at: 8, dur: 2, tone: 0, vel: 0.86 },
      { at: 12, dur: 4, tone: 7, vel: 0.76 },
    ] },
  ],
  comp: [
    { name: 'bolero-guitar', weight: 6, voices: 4, voicing: 'tertian', hits: [
      { at: 0, dur: 2, vel: 0.62 }, { at: 3, dur: 1, vel: 0.46 },
      { at: 4, dur: 2, vel: 0.58 }, { at: 8, dur: 2, vel: 0.6 },
      { at: 11, dur: 1, vel: 0.44 }, { at: 12, dur: 4, vel: 0.56 },
    ] },
    { name: 'bolero-arpeggio', weight: 4, voices: 4, voicing: 'tertian',
      arpeggio: true, arpDirection: 'updown', hits: [
        { at: 0, dur: 2, vel: 0.54 }, { at: 2, dur: 2, vel: 0.48 },
        { at: 4, dur: 2, vel: 0.52 }, { at: 6, dur: 2, vel: 0.46 },
        { at: 8, dur: 2, vel: 0.54 }, { at: 10, dur: 2, vel: 0.48 },
        { at: 12, dur: 2, vel: 0.52 }, { at: 14, dur: 2, vel: 0.46 },
      ] },
    { name: 'bolero-sustained', weight: 2, voices: 4, voicing: 'tertian',
      hits: [{ at: 0, dur: 16, vel: 0.44 }] },
  ],
  /**
   * The cinquillo, on the hand drum. Five strokes — 1, the *and* of 1, 2, 3 and
   * 4, or in sixteenths 0, 3, 4, 8, 12 — which is a Haitian figure that came
   * east with the coffee planters after 1791 and became the rhythmic basis of
   * the danzón, the bolero and most of what Puerto Rico plays.
   */
  drums: [
    { name: 'cinquillo', weight: 6, voices: {
      mp: [0, 3, 4, 8, 12], lp: [0, 8], sh: [0, 4, 8, 12],
    } },
    { name: 'cinquillo-clave', weight: 4, cycle: 32, voices: {
      rim: SON_32, mp: twice([0, 3, 4, 8, 12]), lp: twice([0, 8]),
    } },
    { name: 'bolero-brushes', weight: 3, voices: {
      sh: [0, 2, 4, 6, 8, 10, 12, 14], lp: [0, 8], hp: [3, 11],
    } },
  ],
  twoHanded: {
    density: 0.6,
    modes: [['block', 5], ['answer', 4], ['ostinato', 2]],
    ostinato: {
      cycle: 16,
      hits: [
        { at: 0, dur: 2, vel: 0.6 }, { at: 3, dur: 1, vel: 0.46 },
        { at: 4, dur: 2, vel: 0.56 }, { at: 8, dur: 2, vel: 0.58 },
        { at: 12, dur: 4, vel: 0.54 },
      ],
    },
  },
  melody: { leap: 0.22, ornament: 0.34, span: 16, sequence: 0.4, syncopation: 0.34 },
  /**
   * A song, and the genre voice has it singing a coro.
   *
   * The comment above opens *"It is a **song** before it is a groove, and the
   * tables say so"*, and the file header says it of this style by name — *"the
   * bolero, the bachata and the ranchera carry a real number, because those three
   * are songs before they are grooves"*. What it plays agrees: **2.70 onsets a
   * sounding bar, second-sparsest of the twenty-six, and 54% of its notes a
   * quarter or longer** at a tempo where, in its own words, *"everything has time
   * to ring"*.
   *
   * The genre voice disagrees with both. It pins `riff-response` 5 and `chant`
   * 3.5 for the montuno — 32% and 23% of the draw here, against 1.25 and 1.06
   * derived — on the one style whose comment says *"A bolero has no montuno to
   * put one on"*. `genre/latin/index.ts` names this style as one of the three
   * that pair is an assumption about and points at this field.
   *
   * So the pair falls back to roughly what this style's own tables give it and
   * the two song archetypes take the weight. `arch-hook` because *"the largest
   * harmonic vocabulary in the file, real ii–V motion"* is a tune that goes
   * somewhere and comes back rather than a two-bar cell; `long-note` because the
   * quarter-note share above is already measuring the held phrase-ends.
   * `descending-sequence` and `wide-interval` stay derived.
   */
  voice: {
    archetypes: [
      ['arch-hook', 5],
      ['long-note', 2.5],
      ['riff-response', 1.5],
      ['chant', 1.2],
    ],
  },
};

// ---------------------------------------------------------------------------
// Cuba: the orquesta — the charanga and the big band
// ---------------------------------------------------------------------------

/**
 * DANZÓN — the national dance, and the oldest thing in this folder.
 *
 * Matanzas, 1879, and the ensemble is a *charanga francesa*: a wooden
 * five-key flute playing in its shrill third octave, two violins, a piano, a
 * contrabass, a güiro and a pair of timbales. There is no brass, no guitar and
 * no conga, and the absence of all three is what the era palettes have to get
 * right — a danzón with a trumpet in it is a mambo forty years early.
 *
 * The rhythm is the **baqueteo**, which is the cinquillo played with sticks on
 * the timbal shells rather than with hands on a skin. Written on `lt` and `mt`
 * with `rim` under it, because a timbal is a metal-shelled drum struck on its
 * rim as often as its head and the woody knock of the shell stroke is what the
 * pattern is mostly made of.
 *
 * The form is sectional in a way nothing else here is — a paseo, a flute
 * section, a violin section, and by the 1930s a final montuno bolted on that
 * eventually ate the whole genre and became the mambo. The progressions carry
 * that: a genuinely developed verse table and a chorus that has become a vamp.
 */
const danzon: Style = {
  id: 'danzon',
  label: 'Danzón',
  description:
    'The charanga: flute in its top octave, two violins, güiro and the timbal baqueteo. Sectional, courtly, and the ancestor of everything else in the folder.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [100, 126],
  swing: 0,
  modeWeights: { minor: 0.32, major: 0.68 },
  relativeMajorChorus: 0.2,
  boxDrums: false,
  excludeLayers: ['brass'],
  shots: [[[0, 3, 4], 4], [[12], 3], [[0, 8], 2]],
  progressions: {
    intro: [{ chords: ['I', 'V7', 'V7', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 4, note: 'The paseo — sixteen bars of politeness before anybody dances' },
      { chords: ['I', 'IV', 'I', 'V7', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'V7/V', 'V7', 'V7', 'I', 'IV', 'V7', 'I'], weight: 3 },
      { chords: ['I', 'vi', 'ii7', 'V7', 'iii', 'VI7', 'ii7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['IV', 'IV', 'I', 'I', 'V7', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'V7', 'I', 'V7', 'I', 'V7', 'I', 'I'], weight: 3, note: 'The montuno the danzón grew at the end of its life' },
    ],
    bridge: [{ chords: ['IV', 'IV', 'iv', 'iv', 'I', 'VI7', 'II7', 'V7'], weight: 3 }],
    solo: [{ chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'I', 'I'], weight: 4 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'V7', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['i', 'iv', 'i', 'V7', 'i', 'iv', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'VI', 'ii%7', 'V7', 'III', 'VI', 'ii%7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VI', 'VI', 'iv', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'i', 'i', 'V7/V', 'V7/V', 'V7', 'V7'], weight: 3 }],
    solo: [{ chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [3, 1, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [3, 1, 4, 8], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    { name: 'danzon-cinquillo', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 0.96 },
      { at: 3, dur: 1, tone: 0, vel: 0.6 },
      { at: 4, dur: 4, tone: 7, vel: 0.8 },
      { at: 8, dur: 4, tone: 0, vel: 0.88 },
      { at: 12, dur: 4, tone: 7, vel: 0.78 },
    ] },
    { name: 'danzon-two', weight: 4, hits: [
      { at: 0, dur: 7, tone: 0, vel: 0.96 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.8 },
    ] },
  ],
  comp: [
    { name: 'charanga-piano', weight: 6, voices: 4, voicing: 'tertian', hits: [
      { at: 0, dur: 2, vel: 0.6 }, { at: 3, dur: 1, vel: 0.46 },
      { at: 4, dur: 2, vel: 0.58 }, { at: 8, dur: 2, vel: 0.6 },
      { at: 12, dur: 2, vel: 0.58 }, { at: 14, dur: 2, vel: 0.5 },
    ] },
    montuno(3, 4),
    { name: 'charanga-offbeat', weight: 3, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.55 }, { at: 6, dur: 2, vel: 0.62 },
      { at: 10, dur: 2, vel: 0.55 }, { at: 14, dur: 2, vel: 0.62 },
    ] },
  ],
  drums: [
    { name: 'baqueteo', weight: 6, voices: {
      lt: [0, 8], mt: [4, 12], rim: [0, 3, 4, 8, 11, 12], perc: [0, 4, 6, 12, 14],
    } },
    { name: 'baqueteo-clave', weight: 3, cycle: 32, voices: {
      rim: SON_32, lt: twice([0, 8]), mt: twice([3, 4, 11, 12]), perc: GUIRO,
    } },
  ],
  twoHanded: {
    density: 0.68,
    modes: [['block', 4], ['answer', 3], ['ostinato', 3]],
    ostinato: {
      cycle: 16,
      hits: [
        { at: 0, dur: 2, vel: 0.6 }, { at: 3, dur: 1, vel: 0.46 },
        { at: 4, dur: 2, vel: 0.56 }, { at: 8, dur: 2, vel: 0.6 },
        { at: 12, dur: 2, vel: 0.56 }, { at: 14, dur: 2, vel: 0.5 },
      ],
    },
  },
  melody: { leap: 0.24, ornament: 0.36, span: 17, sequence: 0.48, syncopation: 0.4 },
};

/**
 * CHA-CHA-CHÁ — a danzón slowed down until people could hear their own feet.
 *
 * Enrique Jorrín, 1953, and the origin story is unusually well documented and
 * unusually literal: the dancers at the Silver Star could not manage the
 * syncopated *nuevo ritmo* the charangas were playing, so he wrote the melody
 * on the beat instead, and the shuffle their shoes made on the floor on beats
 * four and one gave the dance its name. It is the only style in the folder whose
 * defining rhythm is a *sound the audience made*.
 *
 * So this is the one clave style where the tune sits square on the beat —
 * `syncopation: 0.22`, the lowest in the family by a distance, and it is the
 * whole point rather than a tame setting. Everything else stays syncopated
 * around it. The cowbell plays four flat quarters, which is a hilariously
 * simple part that is also completely non-negotiable, and the congas play the
 * three-stroke figure on beats 4, the *and* of 4 and 1 that the shoes were
 * making.
 *
 * The clave is present and quiet. A cha-cha-chá is written in clave and almost
 * never has an audible one — the pattern is offered at real weight without it.
 */
const chachacha: Style = {
  id: 'chachacha',
  label: 'Cha-cha-chá',
  description:
    'The charanga at walking pace, with the tune square on the beat. Four flat quarters on the bell, a güiro, and the three-step figure the dancers’ shoes gave it its name for.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [116, 138],
  swing: 0,
  modeWeights: { minor: 0.28, major: 0.72 },
  relativeMajorChorus: 0,
  shots: [[[12, 14], 4], [[12], 3], [[0, 12, 14], 3], [[6, 12], 2]],
  progressions: {
    intro: [{ chords: ['I', 'I', 'V7', 'V7'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'vi', 'ii7', 'V7', 'I', 'vi', 'ii7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['I', 'IV', 'V7', 'V7', 'I', 'IV', 'V7', 'V7'], weight: 5 },
      { chords: ['IV', 'IV', 'I', 'I', 'V7', 'V7', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'II7', 'II7', 'V7', 'V7', 'V7', 'V7'], weight: 3 }],
    solo: [{ chords: ['I', 'IV', 'V7', 'V7', 'I', 'IV', 'V7', 'V7'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'I', 'I'], weight: 4 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'iv', 'V7', 'V7', 'i', 'iv', 'V7', 'V7'], weight: 5 },
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 3 },
    ],
    solo: [{ chords: ['i', 'iv', 'V7', 'V7', 'i', 'iv', 'V7', 'V7'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'i', 'i'], weight: 4 }],
  },
  /**
   * On the beat, and every cell starts there.
   *
   * No pickups and no anticipated cells at any weight, which is the only place
   * in this file that is true. Jorrín wrote the tune square so the floor could
   * find it; a cha-cha-chá melody that leaned would be the *nuevo ritmo* the
   * dancers could not manage, which is the music this one exists instead of.
   */
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 6 },
    { cell: [4, 4, 8], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [8, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 3 },
    { cell: [4, 4, 2, 2, 4], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'chacha-bass', weight: 6, hits: [
      { at: 0, dur: 6, tone: 0, vel: 0.96 },
      { at: 8, dur: 4, tone: 'fifth', vel: 0.82 },
      { at: 12, dur: 4, tone: 0, vel: 0.86 },
    ] },
    tumbao(4),
    { name: 'chacha-two', weight: 3, hits: [
      { at: 0, dur: 7, tone: 0, vel: 0.96 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.82 },
    ] },
  ],
  comp: [
    { name: 'chacha-comp', weight: 6, voices: 3, voicing: 'tertian', hits: [
      { at: 4, dur: 2, vel: 0.72 }, { at: 8, dur: 2, vel: 0.66 },
      { at: 12, dur: 2, vel: 0.74 }, { at: 14, dur: 2, vel: 0.6 },
    ] },
    montuno(4, 4),
    guajeo(3),
  ],
  /**
   * The cowbell plays four flat quarters and the congas play the name of the
   * dance: slots 12, 14 and 0 — beat four, the *and* of four, and the downbeat
   * they hand it to.
   */
  drums: [
    { name: 'chachacha', weight: 6, voices: {
      cb: [0, 4, 8, 12], mp: [12, 14, 0], lp: [8], hp: [4],
      perc: [0, 4, 6, 12, 14], lt: [4, 12],
    } },
    { name: 'chachacha-clave', weight: 4, cycle: 32, voices: {
      rim: SON_23, cb: twice([0, 4, 8, 12]), mp: twice([0, 12, 14]),
      lp: twice([8]), perc: GUIRO,
    } },
    { name: 'chachacha-guiro', weight: 3, voices: {
      cb: [0, 4, 8, 12], perc: [0, 2, 4, 6, 8, 10, 12, 14], mp: [12, 14, 0],
    } },
  ],
  twoHanded: {
    density: 0.7,
    modes: [['ostinato', 6], ['block', 3], ['answer', 1]],
    ostinato: {
      cycle: 32,
      hits: [
        { at: 4, dur: 2, vel: 0.72 }, { at: 8, dur: 2, vel: 0.7 },
        { at: 12, dur: 2, vel: 0.78 }, { at: 14, dur: 4, vel: 0.62 },
        { at: 20, dur: 2, vel: 0.74 }, { at: 24, dur: 2, vel: 0.78 },
        { at: 28, dur: 2, vel: 0.7 }, { at: 30, dur: 2, vel: 0.62 },
      ],
    },
  },
  melody: { leap: 0.22, ornament: 0.2, span: 13, sequence: 0.55, syncopation: 0.22 },
};

/**
 * MAMBO — the big band, and the loudest thing in the catalogue.
 *
 * Two cities and one argument. Havana's version is Pérez Prado's: saxophones
 * riffing under screaming trumpets and a grunt on the downbeat. New York's is
 * Machito's and Tito Puente's at the Palladium, which is a *jazz* big band —
 * four trumpets, four trombones, five saxes, arrangers who had written for Basie
 * — with a Cuban rhythm section underneath that nobody was allowed to simplify.
 * The second is what this table is, because it is the one that produced the
 * instrumentation everything after 1960 inherited.
 *
 * The mechanism a mambo runs on is the **layered riff**. The saxes state a
 * two-bar figure, the trombones state a different one against it, the trumpets
 * state a third on top, and none of them is the tune — the interlocking *is*
 * the tune. That is `riff` and `harmony` weighted hard in the genre's
 * arrangement table and it is why the brass layer matters more here than
 * anywhere else in the folder.
 *
 * The bell is mandatory and the tempo is high enough that the tumbao's empty
 * downbeat stops being subtle and becomes the entire propulsion.
 */
const mambo: Style = {
  id: 'mambo',
  label: 'Mambo',
  description:
    'The Palladium big band: layered saxophone and brass riffs over a Cuban rhythm section, the mambo bell on top, and a tumbao that never touches beat one.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [180, 220],
  swing: 0,
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0,
  shots: CLAVE_SHOTS,
  progressions: {
    intro: [{ chords: ['I', 'I', 'V7', 'V7'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'VI7', 'II7', 'V7', 'I', 'VI7', 'II7', 'V7'], weight: 4 },
      { chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 3 },
      { chords: ['I', 'bIII7', 'II7', 'V7', 'I', 'bIII7', 'II7', 'V7'], weight: 2, note: 'The flat-three dominant, which is a swing arranger’s chord in a Cuban band' },
    ],
    chorus: [
      { chords: ['I', 'IV', 'V7', 'V7', 'I', 'IV', 'V7', 'V7'], weight: 5 },
      { chords: ['I', 'V7', 'I', 'V7', 'I', 'V7', 'I', 'V7'], weight: 4 },
      { chords: ['IV', 'IV', 'V7', 'V7', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'I', 'I', 'II7', 'II7', 'V7', 'V7'], weight: 3 }],
    solo: [{ chords: ['I', 'IV', 'V7', 'V7', 'I', 'IV', 'V7', 'V7'], weight: 5 }],
    outro: [{ chords: ['V7', 'V7', 'I', 'I'], weight: 4 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'VI', 'ii%7', 'V7', 'i', 'VI', 'ii%7', 'V7'], weight: 4 },
      { chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'iv', 'V7', 'V7', 'i', 'iv', 'V7', 'V7'], weight: 5 },
      { chords: ['i', 'V7', 'i', 'V7', 'i', 'V7', 'i', 'V7'], weight: 4 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'i', 'i', 'V7/V', 'V7/V', 'V7', 'V7'], weight: 3 }],
    solo: [{ chords: ['i', 'iv', 'V7', 'V7', 'i', 'iv', 'V7', 'V7'], weight: 5 }],
    outro: [{ chords: ['V7', 'V7', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [-2, 2, 4, 4, 4], weight: 5 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [-2, 4, 4, 6], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [6, 6, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [-2, 14], weight: 3 },
    { cell: [6, 6, 4], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [tumbao(7), tumbaoOctave(5)],
  comp: [montuno(6, 4), montuno23(5, 4), guajeo(2)],
  drums: [
    { name: 'mambo-bell-3-2', weight: 6, cycle: 32, voices: {
      rim: SON_32, cb: CAMPANA, ...MARCHA, sh: MARACAS, lt: twice([12, 14]),
    } },
    { name: 'mambo-bell-2-3', weight: 5, cycle: 32, voices: {
      rim: SON_23, cb: CAMPANA, ...MARCHA, sh: MARACAS, lt: twice([12, 14]),
    } },
    { name: 'mambo-cascara', weight: 4, cycle: 32, voices: {
      rim: SON_32, mt: CASCARA_32, ...MARCHA, sh: MARACAS,
    } },
  ],
  twoHanded: {
    density: 0.78,
    modes: [['ostinato', 9], ['block', 1]],
    ostinato: {
      cycle: 32,
      hits: [
        { at: 0, dur: 2, vel: 0.84 }, { at: 6, dur: 2, vel: 0.86 },
        { at: 10, dur: 2, vel: 0.64 }, { at: 12, dur: 2, vel: 0.88 },
        { at: 14, dur: 4, vel: 0.72 }, { at: 20, dur: 2, vel: 0.86 },
        { at: 24, dur: 2, vel: 0.88 }, { at: 28, dur: 2, vel: 0.68 },
        { at: 30, dur: 2, vel: 0.78 },
      ],
    },
  },
  melody: { leap: 0.32, ornament: 0.18, span: 16, sequence: 0.5, syncopation: 0.66 },
};

// ---------------------------------------------------------------------------
// Cuba: the rumba — a yard, three drums and a singer
// ---------------------------------------------------------------------------

/**
 * RUMBA GUAGUANCÓ — three drums, a clave and no chords.
 *
 * The secular Afro-Cuban rumba, from the docks and solares of Havana and
 * Matanzas: a lead singer, a chorus, a pair of sticks on a wooden surface, and
 * three tuned barrel drums — **tumba, conga and quinto**, low, middle and high,
 * which is precisely what `lp`, `mp` and `hp` are and the clearest case in the
 * project for those voices being named by position. The quinto improvises
 * against the dancers and the other two hold the figure.
 *
 * This is the style with the least harmony in the folder and the tables should
 * be embarrassing about it rather than dressed up: two chords, held for bars at
 * a time, and a chorus that is the same two chords again. A guaguancó has no
 * chordal instrument in its traditional form at all — the `comp` patterns below
 * are the tres a modern group adds, and `excludeLayers` takes the pad and the
 * brass away entirely because a horn section in a solar is a different event.
 *
 * **Rumba clave, not son clave**, and the third stroke is a sixteenth late. See
 * `RUMBA_32`: that one sixteenth is the difference between a dance orchestra
 * and this.
 */
const guaguanco: Style = {
  id: 'guaguanco',
  label: 'Rumba guaguancó',
  description:
    'Three barrel drums, a pair of sticks and a singer. Rumba clave, two chords, a quinto answering the dancers, and no horn section anywhere near it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [168, 200],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  boxDrums: false,
  excludeLayers: ['pad', 'brass'],
  drumFills: false,
  shots: [[[0, 6, 14], 4], [[14], 3], [[6, 14], 3]],
  /**
   * The singer's line comes from a five-note scale and stays there.
   *
   * The one `Style.scaleForChord` in the folder, and the same argument jazz's
   * blues makes at the same field: the genre's rule follows the key until the
   * chord leaves it, which is correct for every style here that has changes —
   * and this one does not have changes, it has a vamp. A rumba melody is a
   * *pregón*, a street-vendor's call, and it draws on a fixed minor pentatonic
   * on the tonic regardless of whether the tres has moved to the fourth
   * underneath it. Re-orienting onto the chord would produce a line that is
   * correct about a harmony nobody in the yard is thinking about.
   *
   * The three-semitone step from the tonic to the flat third is exactly what
   * `augmented-second` vetoes at strictness 1, which is why the genre disables
   * it. Without that override this scale is unusable and the veto is silent.
   */
  scaleForChord: (tonic) => makeScale(tonic, 'minorPentatonic'),
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'V7', 'V7', 'i', 'i', 'V7', 'V7'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 3, note: 'One chord. The clave and the quinto are the composition' },
    ],
    chorus: [
      { chords: ['i', 'i', 'V7', 'V7', 'i', 'i', 'V7', 'V7'], weight: 5 },
      { chords: ['i', 'iv', 'i', 'V7', 'i', 'iv', 'i', 'V7'], weight: 4 },
    ],
    solo: [{ chords: ['i', 'i', 'V7', 'V7', 'i', 'i', 'V7', 'V7'], weight: 5 }],
    outro: [{ chords: ['V7', 'V7', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'V7', 'V7', 'I', 'I', 'V7', 'V7'], weight: 4 },
    ],
    chorus: [
      { chords: ['I', 'I', 'V7', 'V7', 'I', 'I', 'V7', 'V7'], weight: 5 },
      { chords: ['I', 'IV', 'I', 'V7', 'I', 'IV', 'I', 'V7'], weight: 3 },
    ],
    solo: [{ chords: ['I', 'I', 'V7', 'V7', 'I', 'I', 'V7', 'V7'], weight: 5 }],
    outro: [{ chords: ['V7', 'V7', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [-2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [-2, 4, 4, 6], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [
    { name: 'rumba-bass', weight: 6, cycle: 32, hits: [
      { at: 6, dur: 2, tone: -5, vel: 0.88 },
      { at: 14, dur: 4, tone: 0, vel: 1 },
      { at: 22, dur: 2, tone: 'fifth', vel: 0.84 },
      { at: 28, dur: 4, tone: 0, vel: 0.94 },
    ] },
    { name: 'rumba-bass-sparse', weight: 3, cycle: 32, hits: [
      { at: 14, dur: 6, tone: 0, vel: 1 },
      { at: 28, dur: 6, tone: 0, vel: 0.92 },
    ] },
  ],
  comp: [
    { name: 'rumba-tres', weight: 5, voices: 3, cycle: 32, voicing: 'tertian', hits: [
      { at: 6, dur: 2, vel: 0.7 }, { at: 14, dur: 2, vel: 0.8 },
      { at: 20, dur: 2, vel: 0.72 }, { at: 24, dur: 2, vel: 0.7 },
      { at: 30, dur: 2, vel: 0.66 },
    ] },
    { name: 'rumba-vamp', weight: 3, voices: 3, voicing: 'tertian', hits: [
      { at: 2, dur: 2, vel: 0.62 }, { at: 10, dur: 2, vel: 0.66 },
    ] },
  ],
  /**
   * The three drums and the *palitos* — sticks on the side of a box or a length
   * of bamboo, which is the part holding the whole thing together and is written
   * on `perc` because it is neither a drum nor a shaker.
   *
   * The quinto (`hp`) is deliberately the busiest and least regular voice: it is
   * the drum that is improvising, and a quinto part written as a tidy repeating
   * figure is a quinto part with the improviser taken out.
   */
  drums: [
    { name: 'guaguanco-3-2', weight: 6, cycle: 32, voices: {
      rim: RUMBA_32,
      lp: [0, 6, 16, 22],
      mp: [10, 12, 24, 26, 30],
      hp: [4, 8, 14, 18, 20, 28],
      perc: twice([0, 2, 4, 6, 8, 10, 12, 14]),
    } },
    { name: 'guaguanco-2-3', weight: 4, cycle: 32, voices: {
      rim: RUMBA_23,
      lp: [8, 14, 16, 22],
      mp: [0, 4, 26, 28],
      hp: [2, 10, 12, 18, 24, 30],
      perc: twice([0, 2, 4, 6, 8, 10, 12, 14]),
    } },
  ],
  melody: { leap: 0.3, ornament: 0.26, span: 12, sequence: 0.5, syncopation: 0.7 },
  /**
   * The subset table takes a note out of the pentatonic the `scaleForChord`
   * above exists to protect, and it is the ♭3.
   *
   * That comment says the line *"draws on a fixed minor pentatonic on the
   * tonic"* — five notes — and then spends a paragraph on one of them: *"The
   * three-semitone step from the tonic to the flat third is exactly what
   * `augmented-second` vetoes at strictness 1, which is why the genre disables
   * it."* A whole genre rule was switched off for that interval.
   *
   * What it plays is a four-note scale. **62% of adjacent intervals are steps,
   * the lowest share of the twenty-six, and 27% are thirds, the highest** —
   * which is what happens when the gaps between neighbouring degrees widen from
   * 3-2-2-3 semitones to 5-2-3.
   *
   * `snapToSubset` is why: it keeps the subset entries whose *index* is below
   * `scale.pcs.length`, and the scale arriving here is the five pcs this style
   * hands back for every chord. So the genre's top two — 8 of its 13 weight —
   * resolve against five notes rather than seven. `[0,2,3,4,6]` becomes 1 4 5 ♭7
   * and deletes the ♭3; `[0,1,2,4,5]` becomes 1 ♭3 4 ♭7 and deletes the fifth.
   *
   * One entry, and it is inert by construction: all seven indices exist in a
   * five-note scale, `allowed.size >= scale.pcs.length`, and the note comes back
   * untouched. The pentatonic colour the genre table is for is already in this
   * style's own scale, so the table has nothing left to add here and only a note
   * to take away.
   */
  voice: { subsets: [[[0, 1, 2, 3, 4, 5, 6], 1]] },
};

/**
 * RUMBA COLUMBIA — the same yard in six-eight, and the fastest thing here.
 *
 * Danced by one man at a time, competitively, against the quinto. Where the
 * guaguancó is a couple dance in duple time, the columbia is a solo in
 * **twelve pulses**, and the bell it runs on is the older shape — the West
 * African standard pattern that the son clave is audibly a squared-off version
 * of.
 *
 * The metre is 6/8, which in this engine is `beatsPerBar: 3, beatUnit: 8`: six
 * eighths is three quarters, and the twelve sixteenth slots of the bar divide
 * `[6, 6]` into two dotted quarters. `groups` has to be declared because it
 * cannot be derived — `metricStrength` counts in fours and would put the
 * half-bar accent on a sixteenth in the middle of the first group.
 *
 * The clave takes twelve pulses, which is two bars, which is **`cycle: 24`**.
 * Same statement as everywhere else in the file, in the metre that came first.
 */
const columbia: Style = {
  id: 'columbia',
  label: 'Rumba columbia',
  description:
    'The 6/8 rumba: twelve pulses, the West African bell the son clave came from, one dancer at a time and a quinto arguing with him.',
  beatsPerBar: 3,
  beatUnit: 8,
  groups: [6, 6],
  bpm: [128, 154],
  swing: 0,
  modeWeights: { minor: 0.72, major: 0.28 },
  relativeMajorChorus: 0,
  boxDrums: false,
  excludeLayers: ['pad', 'brass'],
  drumFills: false,
  shots: [[[0, 6], 4], [[6, 10], 3], [[0, 6, 10], 2]],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'iv', 'i', 'V7', 'i', 'iv', 'i', 'V7'], weight: 3 },
    ],
    solo: [{ chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 5 }],
    outro: [{ chords: ['VII', 'VII', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'V7', 'V7', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['I', 'I', 'V7', 'V7', 'I', 'I', 'V7', 'V7'], weight: 5 },
    ],
    solo: [{ chords: ['I', 'I', 'V7', 'V7', 'I', 'I', 'V7', 'V7'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 4], weight: 5 },
    { cell: [4, 2, 6], weight: 4 },
    { cell: [6, 6], weight: 4 },
    { cell: [-2, 4, 6], weight: 4 },
    { cell: [2, 4, 6], weight: 3 },
    { cell: [4, 4, 4], weight: 3 },
    { cell: [-4, 2, 6], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 5 },
    { cell: [6, 6], weight: 3 },
    { cell: [-2, 10], weight: 2 },
  ],
  bass: [
    { name: 'columbia-bass', weight: 6, cycle: 24, hits: [
      { at: 6, dur: 4, tone: 0, vel: 0.94 },
      { at: 12, dur: 2, tone: -5, vel: 0.8 },
      { at: 16, dur: 4, tone: 0, vel: 0.96 },
      { at: 22, dur: 2, tone: 'fifth', vel: 0.78 },
    ] },
    { name: 'columbia-open', weight: 3, cycle: 24, hits: [
      { at: 0, dur: 6, tone: 0, vel: 0.96 },
      { at: 16, dur: 6, tone: 0, vel: 0.9 },
    ] },
  ],
  comp: [
    { name: 'columbia-tres', weight: 5, voices: 3, cycle: 24, voicing: 'tertian', hits: [
      { at: 2, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.8 },
      { at: 10, dur: 2, vel: 0.66 }, { at: 16, dur: 2, vel: 0.78 },
      { at: 20, dur: 2, vel: 0.72 },
    ] },
    { name: 'columbia-sparse', weight: 3, voices: 3, voicing: 'tertian', hits: [
      { at: 6, dur: 4, vel: 0.7 },
    ] },
  ],
  drums: [
    { name: 'columbia-bell', weight: 6, cycle: 24, voices: {
      cb: CLAVE_68,
      lp: [0, 12],
      mp: [4, 8, 16, 20],
      hp: [2, 6, 10, 14, 18, 22],
    } },
    { name: 'columbia-clave', weight: 4, cycle: 24, voices: {
      rim: CLAVE_68,
      lp: [0, 8, 16],
      mp: [6, 12, 20],
      hp: [2, 4, 10, 14, 18, 22],
      perc: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22],
    } },
  ],
  melody: { leap: 0.3, ornament: 0.24, span: 12, sequence: 0.48, syncopation: 0.6 },
};

// ---------------------------------------------------------------------------
// New York, and Havana answering it
// ---------------------------------------------------------------------------

/**
 * SALSA DURA — the Fania sound, and the hardest-edged thing in the folder.
 *
 * New York, roughly 1967 to 1978. Musically it is the Cuban conjunto with three
 * changes, and all three are in the tables: the trumpets are largely replaced by
 * **trombones**, played loud and low and slightly out of tune on purpose; the
 * tempo comes down from the mambo's and the weight goes up; and the arrangements
 * are shorter, tighter and full of *bloques* — whole-band figures off the clave
 * that stop the groove for two beats and hand it back.
 *
 * "Salsa" was a marketing word and the musicians who played it mostly said so,
 * which is why this style is called what the players called it. What it is not
 * is a fifth kind of Cuban music: it is a son montuno recorded in a cold city by
 * people who had never been to Havana, and the difference is the trombones and
 * the anger.
 *
 * `transitions` admits `break` and `shot` at real weight — a bloque is exactly
 * the whole band catching a figure together, and the styles' `shots` tables are
 * all off the beat so the derived default would have put them on the four beats
 * this music is organised around leaning past.
 */
const salsadura: Style = {
  id: 'salsadura',
  label: 'Salsa dura',
  description:
    'The Fania conjunto: two trombones instead of trumpets, a heavier tumbao, whole-band bloques off the clave, and a montuno that runs until somebody stops it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [172, 204],
  swing: 0,
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0,
  shots: CLAVE_SHOTS,
  transitions: [['fill', 5], ['shot', 4], ['break', 3], ['elide', 1]],
  progressions: {
    intro: [{ chords: ['i', 'i', 'V7', 'V7'], weight: 4 }],
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'VI', 'ii%7', 'V7', 'i', 'VI', 'ii%7', 'V7'], weight: 4 },
      { chords: ['i', 'iv', 'VII7', 'III', 'VI', 'ii%7', 'V7', 'i'], weight: 4, note: 'The circle a salsa arranger writes when the singer needs somewhere to go' },
      { chords: ['i', 'i', 'iv', 'iv', 'V7', 'V7', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'iv', 'V7', 'V7', 'i', 'iv', 'V7', 'V7'], weight: 5, note: 'The montuno, and the coro will be over it for the next four minutes' },
      { chords: ['i', 'V7', 'i', 'V7', 'i', 'V7', 'i', 'V7'], weight: 5 },
      { chords: ['iv', 'V7', 'i', 'i', 'iv', 'V7', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['VI', 'VI', 'iv', 'iv', 'V7/V', 'V7/V', 'V7', 'V7'], weight: 3 },
      { chords: ['iv', 'iv', 'bII', 'bII', 'V7', 'V7', 'i', 'i'], weight: 2 },
    ],
    solo: [{ chords: ['i', 'iv', 'V7', 'V7', 'i', 'iv', 'V7', 'V7'], weight: 5 }],
    outro: [{ chords: ['iv', 'V7', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'VI7', 'II7', 'V7', 'I', 'VI7', 'II7', 'V7'], weight: 4 },
      { chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['I', 'IV', 'V7', 'V7', 'I', 'IV', 'V7', 'V7'], weight: 5 },
      { chords: ['I', 'V7', 'I', 'V7', 'I', 'V7', 'I', 'V7'], weight: 4 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'iv', 'iv', 'I', 'VI7', 'II7', 'V7'], weight: 3 }],
    solo: [{ chords: ['I', 'IV', 'V7', 'V7', 'I', 'IV', 'V7', 'V7'], weight: 5 }],
    outro: [{ chords: ['IV', 'V7', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [-2, 2, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [-2, 4, 4, 6], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 3 },
    { cell: [6, 6, 4], weight: 3 },
    { cell: [-4, 6, 2, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [-2, 14], weight: 4 },
    { cell: [6, 6, 4], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [tumbao(7), tumbaoOctave(5), { name: 'tumbao-doubled', weight: 3, cycle: 32, hits: [
    { at: 6, dur: 2, tone: -5, vel: 0.9 },
    { at: 8, dur: 2, tone: -5, vel: 0.62 },
    { at: 12, dur: 6, tone: 0, vel: 1 },
    { at: 22, dur: 2, tone: 7, vel: 0.86 },
    { at: 26, dur: 2, tone: 7, vel: 0.6 },
    { at: 28, dur: 6, tone: 0, vel: 0.96 },
  ] }],
  comp: [montuno(7, 4), montuno23(5, 4), guajeo(3)],
  drums: [
    { name: 'salsa-bell-3-2', weight: 6, cycle: 32, voices: {
      rim: SON_32, cb: CAMPANA, ...MARCHA, sh: MARACAS,
      lt: twice([12]), mt: twice([14]),
    } },
    { name: 'salsa-bell-2-3', weight: 5, cycle: 32, voices: {
      rim: SON_23, cb: CAMPANA, ...MARCHA, sh: MARACAS,
      lt: twice([12]), mt: twice([14]),
    } },
    { name: 'salsa-cascara', weight: 4, cycle: 32, voices: {
      rim: SON_32, mt: CASCARA_32, ...MARCHA, sh: MARACAS,
    } },
  ],
  twoHanded: {
    density: 0.8,
    modes: [['ostinato', 9], ['block', 1]],
    ostinato: {
      cycle: 32,
      hits: [
        { at: 0, dur: 2, vel: 0.86 }, { at: 4, dur: 2, vel: 0.66 },
        { at: 6, dur: 2, vel: 0.88 }, { at: 10, dur: 2, vel: 0.64 },
        { at: 12, dur: 2, vel: 0.9 }, { at: 14, dur: 4, vel: 0.74 },
        { at: 20, dur: 2, vel: 0.88 }, { at: 24, dur: 2, vel: 0.9 },
        { at: 28, dur: 2, vel: 0.68 }, { at: 30, dur: 2, vel: 0.8 },
      ],
    },
  },
  melody: { leap: 0.3, ornament: 0.2, span: 15, sequence: 0.48, syncopation: 0.68 },
};

/**
 * SONGO — the one Cuban rhythm nobody inherited, because somebody invented it.
 *
 * Los Van Van, Havana, about 1970, and it is attributable to two people: Juan
 * Formell wrote the band and Changuito worked out what the drummer does. The
 * idea is that a **drum kit and the hand percussion play at the same time**,
 * which every style above this line deliberately does not do — a son conjunto
 * has no kick drum in it, and the whole reason `lp`/`mp`/`hp` exist is that
 * hands are not a kit.
 *
 * So this table is the one place in the clave family where `bd`, `sd` and `hh`
 * appear beside the congas rather than instead of them, and the songo pattern is
 * exactly that hybrid: a funk backbeat's worth of kick and snare, folded into a
 * marcha, with the clave still running underneath and still deciding everything.
 * `feels` names `pocket`, which nothing else in this folder does — Changuito's
 * whole contribution is that the kit sits *in* a groove rather than on top of a
 * pattern.
 */
const songo: Style = {
  id: 'songo',
  label: 'Songo',
  description:
    'Los Van Van’s hybrid: a drum kit and a conga section playing at once, a funk backbeat folded into the marcha, and the clave still in charge underneath.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [156, 188],
  swing: 0,
  modeWeights: { minor: 0.58, major: 0.42 },
  relativeMajorChorus: 0,
  shots: CLAVE_SHOTS,
  feels: [['straight', 5], ['pocket', 4]],
  transitions: [['fill', 5], ['break', 3], ['shot', 3]],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'i', 'i', 'V7', 'V7'], weight: 5 },
      { chords: ['i', 'VII', 'VI', 'V7', 'i', 'VII', 'VI', 'V7'], weight: 4 },
      { chords: ['i', 'iv', 'VII7', 'III', 'VI', 'ii%7', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'V7', 'i', 'V7', 'i', 'V7', 'i', 'V7'], weight: 5 },
      { chords: ['i', 'iv', 'V7', 'V7', 'i', 'iv', 'V7', 'V7'], weight: 4 },
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'iv', 'iv', 'V7', 'V7', 'i', 'i'], weight: 3 }],
    solo: [{ chords: ['i', 'V7', 'i', 'V7', 'i', 'V7', 'i', 'V7'], weight: 5 }],
    outro: [{ chords: ['iv', 'V7', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'I', 'I', 'V7', 'V7'], weight: 5 },
      { chords: ['I', 'VI7', 'II7', 'V7', 'I', 'VI7', 'II7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['I', 'IV', 'V7', 'V7', 'I', 'IV', 'V7', 'V7'], weight: 5 },
      { chords: ['I', 'V7', 'I', 'V7', 'I', 'V7', 'I', 'V7'], weight: 4 },
    ],
    solo: [{ chords: ['I', 'IV', 'V7', 'V7', 'I', 'IV', 'V7', 'V7'], weight: 4 }],
    outro: [{ chords: ['IV', 'V7', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [-2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [-2, 4, 4, 6], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 3 },
    { cell: [3, 1, 4, 4, 4], weight: 3 },
    { cell: [6, 6, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [-2, 14], weight: 3 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [tumbaoOctave(6), tumbao(5), { name: 'songo-sixteenths', weight: 4, cycle: 32, hits: [
    { at: 6, dur: 1, tone: -5, vel: 0.86 },
    { at: 7, dur: 1, tone: -5, vel: 0.6 },
    { at: 12, dur: 6, tone: 0, vel: 1 },
    { at: 22, dur: 1, tone: 7, vel: 0.84 },
    { at: 23, dur: 1, tone: 7, vel: 0.58 },
    { at: 26, dur: 2, tone: -12, vel: 0.7 },
    { at: 28, dur: 6, tone: 0, vel: 0.96 },
  ] }],
  comp: [montuno(6, 4), montuno23(4, 4), guajeo(4)],
  /**
   * The kit and the hands together. `bd` and `sd` under `lp`/`mp`/`hp`, which is
   * a combination that appears nowhere else in the first family and is the whole
   * reason this style is in the catalogue rather than being a fast son.
   */
  drums: [
    { name: 'songo-3-2', weight: 6, cycle: 32, voices: {
      rim: SON_32,
      bd: twice([0, 10]), sd: twice([4, 12]), hh: twice([0, 2, 4, 6, 8, 10, 12, 14]),
      lp: twice([0]), mp: twice([12, 14]), hp: twice([6]),
    } },
    { name: 'songo-2-3', weight: 5, cycle: 32, voices: {
      rim: SON_23,
      bd: twice([0, 10]), sd: twice([4, 12]), hh: twice([2, 6, 10, 14]),
      lp: twice([8]), mp: twice([12, 14]), hp: twice([4]),
      cb: CAMPANA,
    } },
    { name: 'songo-open', weight: 3, cycle: 32, voices: {
      rim: SON_32,
      bd: twice([0, 6, 10]), sd: twice([12]), cb: CAMPANA,
      mp: twice([12, 14]), lp: twice([0, 8]),
    } },
  ],
  twoHanded: {
    density: 0.76,
    modes: [['ostinato', 8], ['block', 2]],
    ostinato: {
      cycle: 32,
      hits: [
        { at: 0, dur: 2, vel: 0.84 }, { at: 6, dur: 2, vel: 0.86 },
        { at: 10, dur: 2, vel: 0.62 }, { at: 12, dur: 2, vel: 0.88 },
        { at: 14, dur: 4, vel: 0.72 }, { at: 20, dur: 2, vel: 0.86 },
        { at: 24, dur: 2, vel: 0.88 }, { at: 30, dur: 2, vel: 0.76 },
      ],
    },
  },
  melody: { leap: 0.3, ornament: 0.22, span: 15, sequence: 0.45, syncopation: 0.7 },
};

/**
 * TIMBA — Havana in the 1990s, and the most harmonically restless music here.
 *
 * NG La Banda, Charanga Habanera, Issac Delgado: songo taken apart by musicians
 * who had been through the conservatory system, put back together with a funk
 * bass and a five-piece brass section, and played at a density that makes a
 * salsa dura arrangement sound spacious. Two things distinguish it in the tables
 * and both are real rather than cosmetic:
 *
 *  - **The bass stops being a tumbao.** A timba bass line is a written funk
 *    figure with sixteenths in it, and it takes the *gear* section — the
 *    passage where the whole band shifts to a new riff — as seriously as the
 *    montuno. The empty downbeat survives; almost nothing else does.
 *  - **The harmony moves.** Minor-key ii–V motion, tritone substitutions,
 *    modal interchange, and progressions that do not repeat every two bars.
 *    This is the style the genre's chord-scale rule was written for: it is the
 *    one whose chords leave the key often enough that the melody has to
 *    re-orient onto them.
 */
const timba: Style = {
  id: 'timba',
  label: 'Timba',
  description:
    'Havana, 1990s: songo taken apart by conservatory graduates. A written funk bass, five horns, gear changes, and harmony that leaves the key on purpose.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [168, 200],
  swing: 0,
  modeWeights: { minor: 0.68, major: 0.32 },
  relativeMajorChorus: 0,
  shots: [[[12], 4], [[6, 12], 4], [[0, 6, 12], 3], [[10, 14], 3], [[6, 12, 14], 2]],
  feels: [['straight', 5], ['pocket', 3], ['funk', 2]],
  transitions: [['fill', 4], ['break', 4], ['shot', 4], ['elide', 1]],
  progressions: {
    intro: [{ chords: ['i9', 'i9', 'ii%7', 'V7b9'], weight: 4 }],
    verse: [
      { chords: ['i9', 'i9', 'ii%7', 'V7b9', 'i9', 'i9', 'ii%7', 'V7b9'], weight: 5 },
      { chords: ['i9', 'iv9', 'VII7', 'IIImaj7', 'VImaj7', 'ii%7', 'V7b9', 'i9'], weight: 4 },
      { chords: ['i9', 'bII', 'i9', 'bII', 'iv9', 'V7b9', 'i9', 'i9'], weight: 3, note: 'The flat two used as a colour rather than as a cadence — timba borrowed this from film music and kept it' },
      { chords: ['VImaj7', 'VII7', 'i9', 'i9', 'VImaj7', 'VII7', 'i9', 'i9'], weight: 3 },
    ],
    chorus: [
      { chords: ['i9', 'iv9', 'V7b9', 'V7b9', 'i9', 'iv9', 'V7b9', 'V7b9'], weight: 5 },
      { chords: ['i9', 'V7b9', 'i9', 'V7b9', 'i9', 'V7b9', 'i9', 'V7b9'], weight: 4 },
      { chords: ['VImaj7', 'VII7', 'i9', 'i9', 'VImaj7', 'VII7', 'i9', 'i9'], weight: 4 },
    ],
    bridge: [
      { chords: ['iv9', 'iv9', 'bII', 'bII', 'V7b9', 'V7b9', 'i9', 'i9'], weight: 3 },
      { chords: ['VImaj7', 'VImaj7', 'V7/V', 'V7/V', 'V7b9', 'V7b9', 'i9', 'i9'], weight: 2 },
    ],
    solo: [{ chords: ['i9', 'iv9', 'V7b9', 'V7b9', 'i9', 'iv9', 'V7b9', 'V7b9'], weight: 5 }],
    outro: [{ chords: ['iv9', 'V7b9', 'i9', 'i9'], weight: 4 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['Imaj9', 'Imaj9', 'ii7', 'V7', 'Imaj9', 'Imaj9', 'ii7', 'V7'], weight: 5 },
      { chords: ['Imaj9', 'VI7', 'ii7', 'V7', 'iii7', 'VI7', 'ii7', 'V7'], weight: 4 },
      { chords: ['Imaj9', 'bIII7', 'II7', 'V7', 'Imaj9', 'bIII7', 'II7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['Imaj9', 'IVmaj7', 'V7', 'V7', 'Imaj9', 'IVmaj7', 'V7', 'V7'], weight: 5 },
      { chords: ['Imaj9', 'V7', 'Imaj9', 'V7', 'Imaj9', 'V7', 'Imaj9', 'V7'], weight: 4 },
    ],
    bridge: [{ chords: ['IVmaj7', 'iv7', 'Imaj9', 'VI7', 'II7', 'V7', 'Imaj9', 'Imaj9'], weight: 3 }],
    solo: [{ chords: ['Imaj9', 'IVmaj7', 'V7', 'V7', 'Imaj9', 'IVmaj7', 'V7', 'V7'], weight: 5 }],
    outro: [{ chords: ['IVmaj7', 'V7', 'Imaj9', 'Imaj9'], weight: 4 }],
  },
  melodyCells: [
    { cell: [-2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 2, 2, 2, 2, 4], weight: 4 },
    { cell: [-1, 1, 2, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [3, 1, 4, 4, 4], weight: 3 },
    { cell: [-2, 4, 4, 6], weight: 3 },
    { cell: [4, 2, 2, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [-2, 14], weight: 4 },
    { cell: [6, 6, 4], weight: 2 },
    { cell: [12, 4], weight: 2 },
  ],
  /**
   * The written bass, and the reason it is not a tumbao.
   *
   * Sixteenth-note motion, the octave used as a rhythmic device rather than as a
   * register, and beat one still empty. A timba bassist is playing a *line* —
   * often the same line the horns are playing — and the shape has to survive
   * every chord it meets, which is what a table of integers guarantees and what a
   * table of chord functions would quietly undo.
   */
  bass: [
    { name: 'timba-line', weight: 6, cycle: 32, hits: [
      { at: 3, dur: 1, tone: 0, vel: 0.7 },
      { at: 6, dur: 2, tone: -5, vel: 0.9 },
      { at: 10, dur: 1, tone: -12, vel: 0.66 },
      { at: 12, dur: 6, tone: 0, vel: 1 },
      { at: 19, dur: 1, tone: 0, vel: 0.68 },
      { at: 22, dur: 2, tone: 7, vel: 0.88 },
      { at: 26, dur: 1, tone: 10, vel: 0.62 },
      { at: 28, dur: 6, tone: 0, vel: 0.96 },
    ] },
    tumbaoOctave(4),
    tumbao(3),
  ],
  comp: [montuno(6, 4), montuno23(5, 4), { name: 'timba-block', weight: 3, voices: 4, cycle: 32,
    voicing: 'tertian', hits: [
      { at: 6, dur: 2, vel: 0.86 }, { at: 12, dur: 2, vel: 0.9 },
      { at: 14, dur: 4, vel: 0.72 }, { at: 20, dur: 2, vel: 0.86 },
      { at: 24, dur: 2, vel: 0.88 }, { at: 30, dur: 2, vel: 0.76 },
    ] }],
  drums: [
    { name: 'timba-3-2', weight: 6, cycle: 32, voices: {
      rim: SON_32, cb: CAMPANA,
      bd: twice([0, 10, 14]), sd: twice([4, 12]), hh: twice([2, 6, 10, 14]),
      lp: twice([0]), mp: twice([12, 14]),
    } },
    { name: 'timba-2-3', weight: 5, cycle: 32, voices: {
      rim: SON_23, cb: CAMPANA,
      bd: twice([0, 6, 10]), sd: twice([12]), hh: twice([0, 2, 4, 6, 8, 10, 12, 14]),
      mp: twice([12, 14]), hp: twice([4]),
    } },
    { name: 'timba-cascara', weight: 3, cycle: 32, voices: {
      rim: SON_32, mt: CASCARA_32, ...MARCHA, bd: twice([0, 10]), sh: MARACAS,
    } },
  ],
  twoHanded: {
    density: 0.82,
    modes: [['ostinato', 8], ['block', 2]],
    ostinato: {
      cycle: 32,
      hits: [
        { at: 0, dur: 2, vel: 0.86 }, { at: 3, dur: 1, vel: 0.6 },
        { at: 6, dur: 2, vel: 0.88 }, { at: 10, dur: 2, vel: 0.64 },
        { at: 12, dur: 2, vel: 0.9 }, { at: 14, dur: 4, vel: 0.74 },
        { at: 20, dur: 2, vel: 0.88 }, { at: 24, dur: 2, vel: 0.9 },
        { at: 27, dur: 1, vel: 0.6 }, { at: 30, dur: 2, vel: 0.8 },
      ],
    },
  },
  melody: { leap: 0.34, ornament: 0.24, span: 17, sequence: 0.4, syncopation: 0.72 },
};

// ---------------------------------------------------------------------------
// Hispaniola: the other keys begin here
// ---------------------------------------------------------------------------

/**
 * MERENGUE — the Dominican national dance, and the first style here with no
 * clave in it at all.
 *
 * The key is the **tambora**: a small two-headed drum played across the lap
 * with a stick in one hand and the bare palm of the other, and its figure is
 * the *maco* — an even, driving pattern with a distinctive dotted pickup that
 * the whole band lands on. The other two instruments of the *perico ripiao*
 * trio are a diatonic button accordion and a **güira**, a metal scraper, which
 * is why `perc` runs continuous sixteenths through every pattern below: the
 * güira does not stop, ever, and its unbroken hiss is what makes a merengue
 * sound like a merengue rather than like a fast anything else.
 *
 * Written in 4/4 here because that is how a merengue band charts it, though it
 * is a 2/4 dance and everybody counts it in two — the bar below is two bars of
 * the dance, which is why the tambora figure appears twice in it.
 *
 * The bass is the other giveaway: it plays **on** the beat, hard, mostly root
 * and fifth, and its whole job is to be relentless. Every anticipation this
 * folder is otherwise built on is absent here on purpose.
 */
const merengue: Style = {
  id: 'merengue',
  label: 'Merengue',
  description:
    'The Dominican two-step: tambora, a metal güira scraping unbroken sixteenths, a button accordion or a wall of saxes, and a bass that lands on every beat.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [124, 160],
  swing: 0,
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0,
  shots: [[[0, 4, 8, 12], 4], [[12, 14], 3], [[8, 12], 3], [[14], 2]],
  progressions: {
    intro: [{ chords: ['I', 'V7', 'V7', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'IV', 'V7', 'V7', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['I', 'V7', 'I', 'V7', 'I', 'V7', 'I', 'V7'], weight: 5, note: 'The jaleo: two chords, and the horns go up a step every eight bars until somebody stops them' },
      { chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'V7', 'V7', 'I', 'I', 'V7', 'V7'], weight: 3 }],
    solo: [{ chords: ['I', 'V7', 'I', 'V7', 'I', 'V7', 'I', 'V7'], weight: 5 }],
    outro: [{ chords: ['V7', 'V7', 'I', 'I'], weight: 4 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'V7', 'i', 'V7', 'i', 'V7', 'i', 'V7'], weight: 5 },
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 3 },
    ],
    solo: [{ chords: ['i', 'V7', 'i', 'V7', 'i', 'V7', 'i', 'V7'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [3, 1, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  bass: [
    { name: 'merengue-bass', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 3, tone: 0, vel: 0.8 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.9 },
      { at: 12, dur: 3, tone: 0, vel: 0.84 },
    ] },
    { name: 'merengue-two', weight: 4, hits: [
      { at: 0, dur: 7, tone: 0, vel: 1 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.86 },
    ] },
    { name: 'merengue-driving', weight: 3, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 2, dur: 2, tone: 0, vel: 0.6 },
      { at: 4, dur: 3, tone: 7, vel: 0.82 },
      { at: 8, dur: 2, tone: 0, vel: 0.92 },
      { at: 10, dur: 2, tone: 0, vel: 0.6 },
      { at: 12, dur: 3, tone: 7, vel: 0.82 },
    ] },
  ],
  comp: [
    { name: 'merengue-jaleo', weight: 6, voices: 3, voicing: 'tertian',
      arpeggio: true, arpDirection: 'updown', hits: [
        { at: 0, dur: 1, vel: 0.66 }, { at: 1, dur: 1, vel: 0.5 },
        { at: 2, dur: 1, vel: 0.58 }, { at: 3, dur: 1, vel: 0.5 },
        { at: 4, dur: 1, vel: 0.7 }, { at: 5, dur: 1, vel: 0.5 },
        { at: 6, dur: 1, vel: 0.58 }, { at: 7, dur: 1, vel: 0.5 },
        { at: 8, dur: 1, vel: 0.68 }, { at: 9, dur: 1, vel: 0.5 },
        { at: 10, dur: 1, vel: 0.58 }, { at: 11, dur: 1, vel: 0.5 },
        { at: 12, dur: 1, vel: 0.7 }, { at: 13, dur: 1, vel: 0.5 },
        { at: 14, dur: 1, vel: 0.6 }, { at: 15, dur: 1, vel: 0.52 },
      ] },
    { name: 'merengue-offbeat', weight: 4, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.66 }, { at: 6, dur: 2, vel: 0.7 },
      { at: 10, dur: 2, vel: 0.66 }, { at: 14, dur: 2, vel: 0.72 },
    ] },
  ],
  /**
   * The tambora on `lt` and `rim` — one drum, two hands, two sounds. The open
   * stroke on the head is the tom voice and the stick on the wooden rim is
   * `rim`, which is exactly what the instrument does and is the reason the
   * cross-stick appears in a style with no clave in it.
   *
   * The güira takes `perc` and never stops. Sixteen strokes a bar, every bar.
   */
  drums: [
    { name: 'maco', weight: 6, voices: {
      lt: [0, 8], rim: [4, 6, 12, 14], mt: [7, 15],
      perc: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    } },
    { name: 'maco-bongo', weight: 4, voices: {
      lt: [0, 8], rim: [4, 12], mp: [6, 7, 14, 15], lp: [0, 8],
      perc: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    } },
    { name: 'merengue-apambichao', weight: 3, voices: {
      lt: [0, 8], rim: [3, 4, 11, 12], hp: [6, 14],
      perc: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  twoHanded: {
    density: 0.72,
    modes: [['ostinato', 5], ['stride', 3], ['block', 2]],
    ostinato: {
      cycle: 16,
      hits: [
        { at: 0, dur: 1, vel: 0.7 }, { at: 2, dur: 1, vel: 0.56 },
        { at: 4, dur: 1, vel: 0.72 }, { at: 6, dur: 1, vel: 0.56 },
        { at: 8, dur: 1, vel: 0.7 }, { at: 10, dur: 1, vel: 0.56 },
        { at: 12, dur: 1, vel: 0.74 }, { at: 14, dur: 1, vel: 0.58 },
      ],
    },
  },
  melody: { leap: 0.3, ornament: 0.22, span: 14, sequence: 0.52, syncopation: 0.3 },
};

/**
 * BACHATA — the bolero of the Dominican countryside, amplified.
 *
 * Guitar music from the *barrios* and the campo, disreputable until about 1990
 * and the biggest Latin export of the 2000s. Structurally it is a bolero at
 * double the tempo with the piano taken out and three guitars put in: a lead
 * *requinto* arpeggiating high up the neck, a rhythm guitar, and an electric
 * bass — plus a bongó and a **güira**, which is where the Dominican half of it
 * lives.
 *
 * The one thing every bachata does and nothing else here does is the **derecho
 * pickup**: the bongó plays a straight martillo for three beats and then a
 * five-stroke roll into beat one that the dancers step the *tap* on. Written
 * below as the sixteenths on slots 12 through 15, and it is the most
 * recognisable four notes in the style.
 *
 * `relativeMajorChorus` carries a real number, like the bolero's and unlike
 * anything in the clave family: this is a song with a chorus, not a vamp with a
 * coro.
 */
const bachata: Style = {
  id: 'bachata',
  label: 'Bachata',
  description:
    'Three guitars, a bongó and a güira. A bolero at double speed with a requinto arpeggiating over the top and a five-stroke pickup into every downbeat.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [120, 148],
  swing: 0,
  modeWeights: { minor: 0.52, major: 0.48 },
  relativeMajorChorus: 0.3,
  shots: [[[12, 13, 14, 15], 4], [[12], 3], [[14], 2]],
  progressions: {
    intro: [{ chords: ['i', 'VI', 'ii%7', 'V7'], weight: 4 }],
    verse: [
      { chords: ['i', 'VI', 'ii%7', 'V7', 'i', 'VI', 'ii%7', 'V7'], weight: 5 },
      { chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'V7', 'i', 'VII', 'VI', 'V7'], weight: 4 },
    ],
    chorus: [
      { chords: ['i', 'VI', 'III', 'V7', 'i', 'VI', 'III', 'V7'], weight: 5 },
      { chords: ['iv', 'V7', 'i', 'i', 'iv', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['III', 'VI', 'iv', 'V7', 'III', 'VI', 'V7', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'VI', 'VI', 'V7/V', 'V7/V', 'V7', 'V7'], weight: 3 }],
    solo: [{ chords: ['i', 'VI', 'ii%7', 'V7', 'i', 'VI', 'ii%7', 'V7'], weight: 4 }],
    outro: [{ chords: ['iv', 'V7', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'vi', 'ii7', 'V7', 'I', 'vi', 'ii7', 'V7'], weight: 5 },
      { chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'V7', 'I', 'I', 'IV', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V7', 'vi', 'IV', 'I', 'V7', 'IV', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'ii7', 'ii7', 'V7', 'V7', 'I', 'I'], weight: 3 }],
    solo: [{ chords: ['I', 'vi', 'ii7', 'V7', 'I', 'vi', 'ii7', 'V7'], weight: 4 }],
    outro: [{ chords: ['IV', 'V7', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 8], weight: 5 },
    { cell: [6, 2, 8], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [-2, 2, 4, 4, 4], weight: 4 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [-4, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    { name: 'bachata-bass', weight: 6, hits: [
      { at: 0, dur: 4, tone: 0, vel: 0.96 },
      { at: 6, dur: 2, tone: 7, vel: 0.78 },
      { at: 8, dur: 4, tone: 0, vel: 0.88 },
      { at: 14, dur: 2, tone: -5, vel: 0.76 },
    ] },
    { name: 'bachata-simple', weight: 4, hits: [
      { at: 0, dur: 7, tone: 0, vel: 0.96 },
      { at: 8, dur: 7, tone: 'fifth', vel: 0.82 },
    ] },
  ],
  comp: [
    { name: 'requinto-arpeggio', weight: 6, voices: 4, voicing: 'tertian',
      arpeggio: true, arpDirection: 'updown', arpOctaves: 2, hits: [
        { at: 0, dur: 2, vel: 0.62 }, { at: 2, dur: 2, vel: 0.5 },
        { at: 4, dur: 2, vel: 0.58 }, { at: 6, dur: 2, vel: 0.5 },
        { at: 8, dur: 2, vel: 0.62 }, { at: 10, dur: 2, vel: 0.5 },
        { at: 12, dur: 1, vel: 0.6 }, { at: 13, dur: 1, vel: 0.5 },
        { at: 14, dur: 1, vel: 0.56 }, { at: 15, dur: 1, vel: 0.52 },
      ] },
    { name: 'bachata-rhythm', weight: 4, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.62 }, { at: 6, dur: 2, vel: 0.68 },
      { at: 10, dur: 2, vel: 0.62 }, { at: 14, dur: 2, vel: 0.7 },
    ] },
  ],
  drums: [
    { name: 'derecho', weight: 6, voices: {
      lp: [0, 8], hp: [2, 4, 6, 10],
      mp: [12, 13, 14, 15],
      perc: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15],
    } },
    { name: 'derecho-open', weight: 4, voices: {
      lp: [0, 8], hp: [4, 12], mp: [13, 14, 15],
      perc: [0, 4, 6, 8, 12, 14],
    } },
    { name: 'bachata-majao', weight: 3, voices: {
      lp: [0, 4, 8, 12], hp: [2, 6, 10, 14], mp: [13, 15],
      perc: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  twoHanded: {
    density: 0.55,
    modes: [['block', 4], ['answer', 4], ['ostinato', 2]],
    ostinato: {
      cycle: 16,
      hits: [
        { at: 0, dur: 2, vel: 0.6 }, { at: 4, dur: 2, vel: 0.56 },
        { at: 8, dur: 2, vel: 0.6 }, { at: 12, dur: 1, vel: 0.58 },
        { at: 14, dur: 2, vel: 0.54 },
      ],
    },
  },
  melody: { leap: 0.22, ornament: 0.3, span: 15, sequence: 0.48, syncopation: 0.4 },
  /**
   * *"This is a song with a chorus, not a vamp with a coro."*
   *
   * The comment above says exactly that, in that order, and the genre voice then
   * hands it the coro anyway: `riff-response` 5 and `chant` 3.5, 32% and 23% of
   * the draw, against 1.70 and 1.29 derived from this style's own tables.
   * `genre/latin/index.ts` names the bachata as one of the three styles those two
   * numbers are an assumption about.
   *
   * `arch-hook` takes it, and only `arch-hook` — *"structurally it is a bolero at
   * double the tempo"* is the sung form at speed, and the numbers keep the speed:
   * **3.35 onsets a sounding bar against the bolero's 2.70, and 27% quarters or
   * longer against its 54%**. So the bolero's `long-note` lift would be wrong
   * here and is not copied over; this is a chorus, not a held phrase-end.
   */
  voice: {
    archetypes: [
      ['arch-hook', 5],
      ['riff-response', 2],
      ['chant', 1.5],
    ],
  },
};

// ---------------------------------------------------------------------------
// The Caribbean coast: Colombia, Venezuela, Puerto Rico
// ---------------------------------------------------------------------------

/**
 * CUMBIA — the Colombian coast, and the one rhythm on this list that conquered
 * a continent by being easy.
 *
 * It began as a courtship dance on the Atlantic coast with two gaita flutes, a
 * *tambora*, a *llamador* and a *guacharaca*, and it has since become the
 * default popular music of Mexico, Peru, Argentina and half of Chile — usually
 * played on instruments that nobody in Barranquilla would recognise. What
 * survived every one of those translations is a single figure: a heavy stroke on
 * the beat and a lighter one on the *and*, forever, with the accent on beats two
 * and four, and a bass that plays two notes a bar and refuses to be interesting.
 *
 * Harmonically it is the simplest thing in the folder after the rumba, and
 * deliberately so — most cumbias are two chords, a great many are i–V, and the
 * ones with four have borrowed them. That is why the genre's chord-scale rule
 * costs this style nothing: over I, IV and V the rule never leaves the key, so
 * a cumbia melody is key-relative in practice without any style having to say so.
 *
 * The `llamador` — the "caller", a small hand drum that plays *only* the
 * offbeat — is written on `hp` and is the part that makes the whole thing walk.
 */
const cumbia: Style = {
  id: 'cumbia',
  label: 'Cumbia',
  description:
    'The Colombian coast: a hand drum on the offbeat and nothing else, a scraped guacharaca, two chords, and a bass that has no intention of surprising anybody.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [92, 120],
  swing: 0,
  modeWeights: { minor: 0.58, major: 0.42 },
  relativeMajorChorus: 0,
  shots: [[[4, 12], 4], [[12], 3], [[8, 12], 2], [[14], 2]],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'i', 'i', 'V7', 'V7'], weight: 5, note: 'Two chords. A great many cumbias have never needed a third' },
      { chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'V7', 'i', 'VII', 'VI', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'V7', 'i', 'V7', 'i', 'V7', 'i', 'V7'], weight: 5 },
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'V7', 'i', 'i', 'iv', 'V7', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'iv', 'iv', 'V7', 'V7', 'i', 'i'], weight: 3 }],
    solo: [{ chords: ['i', 'V7', 'i', 'V7', 'i', 'V7', 'i', 'V7'], weight: 5 }],
    outro: [{ chords: ['V7', 'V7', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'I', 'I', 'V7', 'V7'], weight: 5 },
      { chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['I', 'V7', 'I', 'V7', 'I', 'V7', 'I', 'V7'], weight: 5 },
      { chords: ['IV', 'V7', 'I', 'I', 'IV', 'V7', 'I', 'I'], weight: 3 },
    ],
    solo: [{ chords: ['I', 'V7', 'I', 'V7', 'I', 'V7', 'I', 'V7'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [6, 2, 4, 4], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [-2, 2, 4, 8], weight: 3 },
    { cell: [6, 6, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    { name: 'cumbia-bass', weight: 6, hits: [
      { at: 0, dur: 4, tone: 0, vel: 0.96 },
      { at: 8, dur: 4, tone: 'fifth', vel: 0.84 },
    ] },
    { name: 'cumbia-bass-three', weight: 4, hits: [
      { at: 0, dur: 4, tone: 0, vel: 0.96 },
      { at: 8, dur: 2, tone: 'fifth', vel: 0.84 },
      { at: 12, dur: 4, tone: 0, vel: 0.8 },
    ] },
    { name: 'cumbia-pickup', weight: 3, hits: [
      { at: 0, dur: 4, tone: 0, vel: 0.96 },
      { at: 8, dur: 4, tone: 'fifth', vel: 0.84 },
      { at: 14, dur: 2, tone: -5, vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'cumbia-offbeat', weight: 6, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.76 },
      { at: 10, dur: 2, vel: 0.7 }, { at: 14, dur: 2, vel: 0.78 },
    ] },
    { name: 'cumbia-chuck', weight: 4, voices: 3, hits: [
      { at: 4, dur: 2, vel: 0.78 }, { at: 12, dur: 2, vel: 0.8 },
    ] },
    { name: 'cumbia-arpeggio', weight: 2, voices: 4, voicing: 'tertian',
      arpeggio: true, arpDirection: 'updown', hits: [
        { at: 2, dur: 2, vel: 0.6 }, { at: 6, dur: 2, vel: 0.64 },
        { at: 10, dur: 2, vel: 0.6 }, { at: 14, dur: 2, vel: 0.66 },
      ] },
  ],
  /**
   * The llamador on the offbeat and nothing on the downbeat, the tambora on
   * `lt`, and the guacharaca scraping `perc`. Not a kit, and no kick: a coastal
   * cumbia group has no bass drum in it, and the low end of the bar is the
   * tambora's open stroke and the bass guitar between them.
   */
  drums: [
    { name: 'cumbia-llamador', weight: 6, voices: {
      hp: [2, 6, 10, 14], lt: [4, 12], mp: [0, 8],
      perc: [0, 4, 6, 8, 12, 14],
    } },
    { name: 'cumbia-tambora', weight: 4, voices: {
      hp: [2, 6, 10, 14], lt: [0, 8], rim: [4, 12], mt: [7, 15],
      perc: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'cumbia-kit', weight: 3, voices: {
      bd: [0, 8], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
      hp: [2, 6, 10, 14], perc: [0, 4, 6, 12, 14],
    } },
  ],
  twoHanded: {
    density: 0.5,
    modes: [['answer', 4], ['block', 3], ['stride', 3]],
  },
  melody: { leap: 0.22, ornament: 0.24, span: 13, sequence: 0.55, syncopation: 0.32 },
};

/**
 * VALLENATO — the accordion belt, and the argument for `accordion` being
 * exactly right.
 *
 * Inland from the cumbia coast, in Valledupar: a three-piece of diatonic button
 * accordion, **caja** (a small conical hand drum) and **guacharaca**, playing
 * songs that are literally news — a vallenato's text is the report of something
 * that happened to somebody the audience knows. Four rhythms exist under the
 * one name and this table is the *paseo*, which is the commonest and the one
 * outsiders mean.
 *
 * The catalogue has an `accordion` with a `HandSpec` on it, a left-hand bass
 * register and a `stride` mode — which is not an approximation here, it is the
 * instrument. A vallenato accordionist plays the tune with the right hand and
 * the bass buttons with the left, and there is frequently nobody else to state a
 * root at all. `twoHanded` therefore weights `stride` above everything, which is
 * the reverse of every clave style above.
 */
const vallenato: Style = {
  id: 'vallenato',
  label: 'Vallenato',
  description:
    'Accordion, caja and guacharaca from Valledupar. The paseo: a three-piece playing the news, with the accordion’s left hand doing the work of a bass section.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [104, 132],
  swing: 0,
  modeWeights: { minor: 0.42, major: 0.58 },
  relativeMajorChorus: 0.15,
  boxDrums: false,
  excludeLayers: ['pad'],
  shots: [[[0, 8], 3], [[12], 3], [[4, 12], 3]],
  progressions: {
    intro: [{ chords: ['I', 'V7', 'V7', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'V7', 'I', 'I', 'IV', 'V7', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V7', 'I', 'V7', 'I', 'IV', 'V7', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'V7', 'V7', 'I', 'I', 'V7', 'V7'], weight: 3 }],
    solo: [{ chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'I', 'I'], weight: 4 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VII', 'VII', 'iv', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['i', 'V7', 'i', 'V7', 'i', 'iv', 'V7', 'i'], weight: 4 },
    ],
    solo: [{ chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [4, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [3, 1, 4, 4, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'vallenato-bass', weight: 6, hits: [
      { at: 0, dur: 4, tone: 0, vel: 0.96 },
      { at: 8, dur: 4, tone: 'fifth', vel: 0.84 },
    ] },
    { name: 'vallenato-walk', weight: 3, hits: [
      { at: 0, dur: 4, tone: 0, vel: 0.96 },
      { at: 4, dur: 4, tone: 'fifth', vel: 0.74 },
      { at: 8, dur: 4, tone: 0, vel: 0.86 },
      { at: 12, dur: 4, tone: 'fifth', vel: 0.74 },
    ] },
  ],
  comp: [
    { name: 'vallenato-offbeat', weight: 6, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.66 }, { at: 6, dur: 2, vel: 0.72 },
      { at: 10, dur: 2, vel: 0.66 }, { at: 14, dur: 2, vel: 0.74 },
    ] },
    { name: 'vallenato-chuck', weight: 4, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.74 }, { at: 12, dur: 3, vel: 0.76 },
    ] },
  ],
  /**
   * The caja on the three hand-drum voices and the guacharaca on `perc`. No
   * kit, no bell, no clave — a vallenato trio has three people in it and one of
   * them is holding a scraper.
   */
  drums: [
    { name: 'paseo', weight: 6, voices: {
      lp: [0, 8], mp: [4, 12], hp: [6, 10, 14],
      perc: [0, 4, 6, 8, 12, 14],
    } },
    { name: 'paseo-busy', weight: 4, voices: {
      lp: [0, 8], mp: [4, 12], hp: [2, 6, 10, 14],
      perc: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'merengue-vallenato', weight: 3, voices: {
      lp: [0, 6, 8, 14], mp: [4, 12], hp: [2, 10],
      perc: [0, 4, 6, 8, 12, 14],
    } },
  ],
  /**
   * The one style in the folder where `stride` leads, and it is the accordion
   * that decides. The button side is a bass row and a chord row and playing them
   * alternately is the whole left-hand idiom of the instrument — a vallenato
   * accordionist who comped in the holes would be a jazz pianist holding the
   * wrong box.
   */
  twoHanded: {
    density: 0.82,
    modes: [['stride', 7], ['answer', 3]],
  },
  melody: { leap: 0.26, ornament: 0.32, span: 15, sequence: 0.5, syncopation: 0.35 },
};

/**
 * JOROPO — the Venezuelan and Colombian plains, in three and in six at once.
 *
 * A harp or a *bandola*, a **cuatro** and a pair of *maracas*, played at a speed
 * that is genuinely difficult, and the whole character of it is the
 * *sesquiáltera*: the bar is written in 3/4 and the accompaniment keeps
 * flipping into 6/8 underneath the tune, so two metres are running at once and
 * the dancers are stepping the one the melody is not in.
 *
 * Expressed here as a 3/4 bar whose `shots` and whose second bass pattern
 * accent slots 0 and 6 — two dotted beats across twelve sixteenths, which *is*
 * the 6/8 reading — against a comp that strums all three quarters. The two
 * disagree by construction, which is the effect, and it is one of the few
 * places in this project where a metric ambiguity is the subject rather than a
 * mistake.
 *
 * The maracas are the loudest instrument in the group and are played with a
 * technique that has no equivalent anywhere else on this list, so `sh` runs
 * continuous sixteenths and is mixed forward by the genre.
 */
const joropo: Style = {
  id: 'joropo',
  label: 'Joropo',
  description:
    'Harp, cuatro and maracas from the llanos. A 3/4 bar with a 6/8 accompaniment running against it, at a tempo that is not a joke.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [168, 200],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  boxDrums: false,
  excludeLayers: ['pad'],
  shots: [[[0, 6], 4], [[0, 4, 8], 3], [[6], 2]],
  progressions: {
    intro: [{ chords: ['I', 'V7', 'V7', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'V7/V', 'V7', 'V7', 'I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'V7', 'I', 'I', 'IV', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V7', 'I', 'V7', 'I', 'V7', 'I', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'V7/V', 'V7/V', 'V7', 'V7', 'I', 'I'], weight: 3 }],
    solo: [{ chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'I', 'I'], weight: 4 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'V7', 'i', 'VII', 'VI', 'V7'], weight: 3, note: 'The Andalusian descent, which arrived in the llanos with the guitar and never left' },
    ],
    chorus: [
      { chords: ['iv', 'V7', 'i', 'i', 'iv', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'V7', 'i', 'V7', 'i', 'V7', 'i', 'i'], weight: 3 },
    ],
    solo: [{ chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 4], weight: 5 },
    { cell: [4, 4, 4], weight: 4 },
    { cell: [6, 6], weight: 4 },
    { cell: [2, 2, 4, 4], weight: 4 },
    { cell: [4, 2, 6], weight: 3 },
    { cell: [-2, 4, 6], weight: 3 },
    { cell: [8, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 5 },
    { cell: [8, 4], weight: 3 },
    { cell: [6, 6], weight: 3 },
  ],
  /**
   * Two basses, and they are in two different metres.
   *
   * The first is the 3/4 reading — a note on each quarter. The second is the
   * 6/8: two dotted beats, slots 0 and 6, which is the same bar counted the
   * other way. Both are correct at once and a joropo group plays them against
   * each other, which is the entire dance.
   */
  bass: [
    { name: 'joropo-three', weight: 5, hits: [
      { at: 0, dur: 3, tone: 0, vel: 0.96 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.76 },
      { at: 8, dur: 3, tone: 0, vel: 0.82 },
    ] },
    { name: 'joropo-six', weight: 5, hits: [
      { at: 0, dur: 5, tone: 0, vel: 0.96 },
      { at: 6, dur: 5, tone: 'fifth', vel: 0.86 },
    ] },
    { name: 'joropo-one', weight: 2, hits: [
      { at: 0, dur: 10, tone: 0, vel: 0.96 },
    ] },
  ],
  comp: [
    { name: 'cuatro-strum', weight: 6, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.78 }, { at: 2, dur: 2, vel: 0.58 },
      { at: 4, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.76 },
      { at: 8, dur: 2, vel: 0.68 }, { at: 10, dur: 2, vel: 0.58 },
    ] },
    { name: 'cuatro-golpe', weight: 4, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.8 }, { at: 3, dur: 1, vel: 0.56 },
      { at: 4, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.78 },
      { at: 9, dur: 1, vel: 0.56 }, { at: 10, dur: 2, vel: 0.64 },
    ] },
  ],
  drums: [
    { name: 'joropo-maracas', weight: 6, voices: {
      sh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    } },
    { name: 'joropo-maracas-accented', weight: 4, voices: {
      sh: [0, 2, 3, 4, 6, 8, 9, 10], perc: [0, 6],
    } },
  ],
  melody: { leap: 0.34, ornament: 0.3, span: 16, sequence: 0.45, syncopation: 0.5 },
};

/**
 * PLENA — Puerto Rico's sung newspaper, on three tambourines.
 *
 * Ponce, around 1900, and the instruments are *panderetas*: three frame drums
 * of three sizes with no jingles, called the *seguidor*, the *segundo* and the
 * *requinto*, plus a **güiro** and whatever melody instrument is in the room. It
 * is the second style here whose subject is the news — a plena reports on a
 * hurricane, a strike, a death, a scandal — and like the vallenato it is a
 * verse-and-refrain form rather than a vamp.
 *
 * The distribution problem this style makes visible: three frame drums of
 * different pitches are exactly three hand-drum strokes, so `lp`/`mp`/`hp` are
 * the seguidor, segundo and requinto, and `tb` — the tambourine voice — is
 * *not* used, because a pandereta has no jingles in it. The one instrument in
 * this folder with jingles is the Brazilian pandeiro, forty lines further down,
 * and giving the plena a jingle would have been the obvious mistake.
 *
 * The Puerto Rican **cuatro** carries the answering line: five doubled steel
 * courses plucked as a lead, which is `steelGuitar` in this catalogue rather
 * than `nylonGuitar` — the Venezuelan cuatro two styles up is the nylon one, and
 * the two instruments share a name and nothing else.
 */
const plena: Style = {
  id: 'plena',
  label: 'Plena',
  description:
    'Three panderetas, a güiro and a cuatro. Puerto Rico’s sung newspaper: a verse, a refrain everybody already knows, and no jingles anywhere.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [116, 144],
  swing: 0,
  modeWeights: { minor: 0.25, major: 0.75 },
  relativeMajorChorus: 0,
  boxDrums: false,
  excludeLayers: ['pad'],
  shots: [[[4, 12], 4], [[12], 3], [[6, 12], 2]],
  progressions: {
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'IV', 'V7', 'V7', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['I', 'V7', 'I', 'V7', 'I', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['IV', 'V7', 'I', 'I', 'IV', 'V7', 'I', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'I', 'I', 'V7', 'V7', 'I', 'I'], weight: 3 }],
    solo: [{ chords: ['I', 'V7', 'I', 'V7', 'I', 'V7', 'I', 'I'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'I', 'I'], weight: 4 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['i', 'V7', 'i', 'V7', 'i', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 3 },
    ],
    solo: [{ chords: ['i', 'V7', 'i', 'V7', 'i', 'V7', 'i', 'i'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  bass: [
    { name: 'plena-bass', weight: 6, hits: [
      { at: 0, dur: 4, tone: 0, vel: 0.96 },
      { at: 8, dur: 4, tone: 'fifth', vel: 0.84 },
    ] },
    { name: 'plena-anticipated', weight: 4, hits: [
      { at: 0, dur: 4, tone: 0, vel: 0.96 },
      { at: 8, dur: 2, tone: 'fifth', vel: 0.82 },
      { at: 14, dur: 2, tone: 0, vel: 0.76 },
    ] },
  ],
  comp: [
    { name: 'plena-cuatro', weight: 6, voices: 3, hits: [
      { at: 2, dur: 2, vel: 0.72 }, { at: 4, dur: 2, vel: 0.6 },
      { at: 6, dur: 2, vel: 0.76 }, { at: 10, dur: 2, vel: 0.7 },
      { at: 12, dur: 2, vel: 0.62 }, { at: 14, dur: 2, vel: 0.78 },
    ] },
    { name: 'plena-chuck', weight: 4, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.76 }, { at: 12, dur: 3, vel: 0.78 },
    ] },
  ],
  /**
   * Three frame drums, low to high. The seguidor holds the pulse, the segundo
   * answers on the offbeats and the requinto improvises across the top, which is
   * the same division of labour as the rumba's three congas arriving at it from
   * an island four hundred miles away.
   */
  drums: [
    { name: 'plena', weight: 6, voices: {
      lp: [0, 8], mp: [4, 6, 12, 14], hp: [2, 7, 10, 15],
      perc: [0, 4, 6, 8, 12, 14],
    } },
    { name: 'plena-busy', weight: 4, voices: {
      lp: [0, 6, 8, 14], mp: [4, 12], hp: [2, 3, 10, 11, 15],
      perc: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  melody: { leap: 0.24, ornament: 0.24, span: 13, sequence: 0.55, syncopation: 0.42 },
};

/**
 * BOMBA — the oldest thing on the island, and the only style here where the
 * drummer follows the dancer.
 *
 * Barrel drums cut from rum casks with goatskin heads, played with bare hands:
 * a pair of *buleadores* holding a fixed figure and a *primo* or *subidor*
 * which does not hold anything — it watches the dancer and answers whatever
 * they do, which reverses the relationship every other style in this project
 * assumes. The *cuá*, two sticks on the side of a barrel, is the timekeeper.
 *
 * There is no clave and there is essentially no harmony. One chord, or two,
 * and a call-and-response between a lead singer and a chorus; the melodic
 * material is short, repeated and built from a handful of notes. The tables
 * below are the sparsest in the file and that is what the music is.
 *
 * `excludeLayers` takes the pad and the brass. `drumFills: false`, because a
 * tom roll into a crash is a dance-band signpost and there is no dance band
 * here — the primo's answer *is* the fill, and it happens continuously rather
 * than at section ends.
 */
const bomba: Style = {
  id: 'bomba',
  label: 'Bomba',
  description:
    'Barrel drums and bare hands. Two buleadores holding a figure, a primo answering the dancer, sticks on the side of a barrel, and one chord.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [104, 136],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  boxDrums: false,
  drumFills: false,
  excludeLayers: ['pad', 'brass'],
  shots: [[[0], 3], [[6, 12], 3], [[12], 2]],
  transitions: [['fill', 3], ['break', 4], ['elide', 2]],
  progressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 3, note: 'One chord, and the drummer is not listening to it anyway' },
    ],
    chorus: [
      { chords: ['I', 'I', 'V7', 'V7', 'I', 'I', 'V7', 'V7'], weight: 5 },
      { chords: ['I', 'IV', 'I', 'V7', 'I', 'IV', 'I', 'V7'], weight: 3 },
    ],
    solo: [{ chords: ['I', 'I', 'V7', 'V7', 'I', 'I', 'V7', 'V7'], weight: 5 }],
    outro: [{ chords: ['V7', 'V7', 'I', 'I'], weight: 4 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['i', 'i', 'V7', 'V7', 'i', 'i', 'V7', 'V7'], weight: 5 },
      { chords: ['i', 'VII', 'i', 'VII', 'i', 'VII', 'i', 'i'], weight: 3 },
    ],
    solo: [{ chords: ['i', 'i', 'V7', 'V7', 'i', 'i', 'V7', 'V7'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 4, 4, 4], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [8, 8], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [-4, 12], weight: 2 },
  ],
  bass: [
    { name: 'bomba-bass', weight: 6, hits: [
      { at: 0, dur: 6, tone: 0, vel: 0.96 },
      { at: 8, dur: 6, tone: 0, vel: 0.86 },
    ] },
    { name: 'bomba-bass-five', weight: 3, hits: [
      { at: 0, dur: 6, tone: 0, vel: 0.96 },
      { at: 6, dur: 2, tone: 7, vel: 0.76 },
      { at: 8, dur: 6, tone: 0, vel: 0.86 },
    ] },
  ],
  comp: [
    { name: 'bomba-vamp', weight: 5, voices: 3, voicing: 'tertian', hits: [
      { at: 0, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.66 },
      { at: 8, dur: 2, vel: 0.68 }, { at: 14, dur: 2, vel: 0.64 },
    ] },
    { name: 'bomba-sparse', weight: 3, voices: 3, voicing: 'tertian', hits: [
      { at: 0, dur: 8, vel: 0.6 },
    ] },
  ],
  /**
   * The *sicá*, which is the commonest of the sixteen or so bomba rhythms: the
   * buleador on `lp` and `mp` holding a two-and-a-half-beat figure, the primo on
   * `hp` filling everything else, and the cuá — two sticks on wood — on `rim`,
   * which is what a cross-stick voice is for.
   */
  drums: [
    { name: 'sica', weight: 6, voices: {
      lp: [0, 8], mp: [3, 6, 11, 14], hp: [4, 7, 12, 15],
      rim: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    { name: 'yuba', weight: 4, voices: {
      lp: [0, 6, 8], mp: [3, 10, 14], hp: [4, 12, 15],
      rim: [0, 3, 4, 8, 11, 12],
    } },
  ],
  melody: { leap: 0.26, ornament: 0.2, span: 11, sequence: 0.6, syncopation: 0.5 },
};

// ---------------------------------------------------------------------------
// Brazil: a different key, and a different drum for every part of it
// ---------------------------------------------------------------------------

/**
 * SAMBA — Rio, and the one rhythm here that is played by a hundred people.
 *
 * The key is not a clave. It is the **surdo**, a bass drum the size of a
 * dustbin, and it answers the question this genre keeps asking — where is beat
 * one — with the flattest possible refusal: the surdo's accented stroke is on
 * beat **two**, and the first beat gets the muffled one. A samba bar leans
 * forward onto its second half, which is why a samba played with the emphasis on
 * one sounds like a march and why every foreign band gets it wrong in the same
 * direction.
 *
 * Over it, the **tamborim** — a six-inch drum struck with a plastic whisk,
 * written on `rim` because it is a dry crack with no body at all — plays the
 * *teleco-teco*, a two-bar figure that is a genuine cousin of the clave without
 * being one. Written on `cycle: 32` for that reason: it is two bars and it is
 * asymmetric, and putting it in one bar would make it a different figure.
 *
 * The pandeiro is `tb`. It is the one instrument in this folder with jingles on
 * it — the argument the plena's comment makes from the other side — and its
 * three strokes (thumb, heel, fingertips) would want the hand-drum voices if the
 * jingles were not the more identifying half.
 *
 * The cavaquinho carries the comp: a tiny four-string steel-strung instrument,
 * so `steelGuitar` and `banjo` in the palette rather than `nylonGuitar`.
 */
const samba: Style = {
  id: 'samba',
  label: 'Samba',
  description:
    'Rio: a surdo accenting beat two, a tamborim playing a two-bar figure across the barline, a pandeiro, and a cavaquinho chopping between them.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [176, 208],
  swing: 0,
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0,
  shots: [[[8], 4], [[6, 8], 3], [[8, 14], 3], [[14], 2]],
  progressions: {
    intro: [{ chords: ['Imaj7', 'Imaj7', 'ii7', 'V7'], weight: 4 }],
    verse: [
      { chords: ['Imaj7', 'VI7', 'ii7', 'V7', 'Imaj7', 'VI7', 'ii7', 'V7'], weight: 5 },
      { chords: ['Imaj7', 'Imaj7', 'II7', 'II7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['Imaj7', 'IVmaj7', 'iii7', 'VI7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 },
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 3, note: 'The samba de roda frame, before anybody put a seventh on anything' },
    ],
    chorus: [
      { chords: ['IVmaj7', 'IVmaj7', 'Imaj7', 'Imaj7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 5 },
      { chords: ['ii7', 'V7', 'Imaj7', 'VI7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 },
    ],
    bridge: [{ chords: ['IVmaj7', 'iv7', 'Imaj7', 'VI7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 3 }],
    solo: [{ chords: ['Imaj7', 'VI7', 'ii7', 'V7', 'Imaj7', 'VI7', 'ii7', 'V7'], weight: 4 }],
    outro: [{ chords: ['ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i7', 'i7', 'ii%7', 'V7b9', 'i7', 'i7', 'ii%7', 'V7b9'], weight: 5 },
      { chords: ['i7', 'VII7', 'VImaj7', 'V7b9', 'i7', 'VII7', 'VImaj7', 'V7b9'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv7', 'iv7', 'i7', 'i7', 'ii%7', 'V7b9', 'i7', 'i7'], weight: 5 },
      { chords: ['VImaj7', 'VII7', 'IIImaj7', 'IIImaj7', 'ii%7', 'V7b9', 'i7', 'i7'], weight: 3 },
    ],
    solo: [{ chords: ['i7', 'i7', 'ii%7', 'V7b9', 'i7', 'i7', 'ii%7', 'V7b9'], weight: 4 }],
    outro: [{ chords: ['ii%7', 'V7b9', 'i7', 'i7'], weight: 4 }],
  },
  melodyCells: [
    { cell: [-2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [3, 1, 4, 4, 4], weight: 4 },
    { cell: [-2, 4, 4, 6], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 3 },
    { cell: [6, 6, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [-2, 14], weight: 3 },
    { cell: [8, 8], weight: 3 },
    { cell: [6, 6, 4], weight: 2 },
  ],
  /**
   * Two notes and the second one is louder, which is the surdo's answer written
   * into the bass. Beat one is present but weak; beat three — the second surdo
   * stroke of a two-beat bar — carries the weight.
   */
  bass: [
    { name: 'samba-two', weight: 6, hits: [
      { at: 0, dur: 4, tone: 0, vel: 0.72 },
      { at: 8, dur: 6, tone: 0, vel: 1 },
    ] },
    { name: 'samba-walking-two', weight: 4, hits: [
      { at: 0, dur: 4, tone: 0, vel: 0.72 },
      { at: 6, dur: 2, tone: -5, vel: 0.66 },
      { at: 8, dur: 4, tone: 0, vel: 1 },
      { at: 14, dur: 2, tone: 7, vel: 0.7 },
    ] },
    { name: 'samba-syncopated', weight: 3, cycle: 32, hits: [
      { at: 0, dur: 3, tone: 0, vel: 0.74 },
      { at: 8, dur: 6, tone: 0, vel: 1 },
      { at: 16, dur: 3, tone: 0, vel: 0.72 },
      { at: 22, dur: 2, tone: 7, vel: 0.68 },
      { at: 24, dur: 6, tone: 0, vel: 0.98 },
    ] },
  ],
  comp: [
    { name: 'cavaquinho', weight: 6, voices: 4, voicing: 'tertian', hits: [
      { at: 0, dur: 2, vel: 0.7 }, { at: 3, dur: 1, vel: 0.56 },
      { at: 4, dur: 2, vel: 0.62 }, { at: 7, dur: 1, vel: 0.58 },
      { at: 8, dur: 2, vel: 0.76 }, { at: 11, dur: 1, vel: 0.56 },
      { at: 12, dur: 2, vel: 0.62 }, { at: 15, dur: 1, vel: 0.6 },
    ] },
    { name: 'cavaquinho-offbeat', weight: 4, voices: 4, voicing: 'tertian', hits: [
      { at: 2, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.64 },
      { at: 10, dur: 2, vel: 0.76 }, { at: 14, dur: 2, vel: 0.66 },
    ] },
    { name: 'violao-samba', weight: 3, voices: 4, voicing: 'guide', hits: [
      { at: 0, dur: 3, vel: 0.6 }, { at: 6, dur: 2, vel: 0.56 },
      { at: 8, dur: 3, vel: 0.66 }, { at: 14, dur: 2, vel: 0.58 },
    ] },
  ],
  /**
   * The surdo on `bd` — accent on beat three of this four-beat bar, which is
   * beat two of the two-beat bar a sambista is actually counting. The tamborim
   * on `rim` at `cycle: 32`, the pandeiro on `tb`, and the agogô on `cb`.
   */
  drums: [
    { name: 'samba-bateria', weight: 6, cycle: 32, voices: {
      bd: twice([0, 8]),
      rim: [2, 4, 7, 10, 14, 16, 19, 22, 24, 28, 30],
      tb: twice([0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15]),
      sh: twice([0, 2, 4, 6, 8, 10, 12, 14]),
    } },
    { name: 'samba-partido', weight: 4, cycle: 32, voices: {
      bd: twice([0, 8]),
      rim: [3, 6, 10, 12, 15, 19, 22, 26, 28, 31],
      tb: twice([0, 3, 4, 7, 8, 11, 12, 15]),
      cb: twice([0, 6, 8, 14]),
    } },
    { name: 'samba-kit', weight: 3, voices: {
      bd: [0, 8], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14],
      rim: [3, 6, 10, 15], tb: [2, 6, 10, 14],
    } },
  ],
  twoHanded: {
    density: 0.6,
    modes: [['block', 4], ['answer', 3], ['ostinato', 3]],
    ostinato: {
      cycle: 32,
      hits: [
        { at: 0, dur: 2, vel: 0.68 }, { at: 3, dur: 1, vel: 0.54 },
        { at: 8, dur: 2, vel: 0.74 }, { at: 11, dur: 1, vel: 0.54 },
        { at: 15, dur: 3, vel: 0.6 }, { at: 19, dur: 1, vel: 0.54 },
        { at: 24, dur: 2, vel: 0.74 }, { at: 30, dur: 2, vel: 0.62 },
      ],
    },
  },
  melody: { leap: 0.28, ornament: 0.24, span: 15, sequence: 0.44, syncopation: 0.62 },
};

/**
 * PARTIDO ALTO — samba stripped back to a circle of people and a pandeiro.
 *
 * The *roda* rather than the parade: a handful of players round a table, one
 * pandeiro, a cavaquinho, a surdo if somebody brought one, and a form that is
 * entirely call and response — a sung refrain everybody knows and improvised
 * verses between statements of it. That form is the reason this is a style and
 * not a quiet samba: the harmony is a short repeating cell held for the whole
 * number, because the interest is in the words and the response, and a
 * developing progression would take the space the improviser needs.
 *
 * The pandeiro's own figure is the subject here, so `tb` carries the busiest
 * part in the pattern and the surdo is optional. Slower and heavier than the
 * samba above; `hook` is `catchy`, because a refrain everybody in the room
 * already knows is a refrain that has to arrive the same way every time.
 */
const partidoalto: Style = {
  id: 'partidoalto',
  label: 'Partido alto',
  description:
    'Samba round a table: one pandeiro, a cavaquinho, a refrain everybody already knows, and improvised verses between statements of it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [150, 176],
  swing: 0,
  modeWeights: { minor: 0.38, major: 0.62 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  excludeLayers: ['pad'],
  shots: [[[8], 3], [[3, 8], 3], [[6, 8], 3], [[15], 2]],
  progressions: {
    verse: [
      { chords: ['Imaj7', 'VI7', 'ii7', 'V7', 'Imaj7', 'VI7', 'ii7', 'V7'], weight: 5 },
      { chords: ['I', 'I', 'V7', 'V7', 'I', 'I', 'V7', 'V7'], weight: 4 },
      { chords: ['Imaj7', 'IVmaj7', 'Imaj7', 'V7', 'Imaj7', 'IVmaj7', 'Imaj7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['ii7', 'V7', 'Imaj7', 'Imaj7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 5, note: 'A two-bar cell for the refrain. It is the same every single time, which is the form' },
      { chords: ['IVmaj7', 'V7', 'Imaj7', 'Imaj7', 'IVmaj7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 },
    ],
    solo: [{ chords: ['ii7', 'V7', 'Imaj7', 'Imaj7', 'ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 }],
    outro: [{ chords: ['ii7', 'V7', 'Imaj7', 'Imaj7'], weight: 4 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i7', 'i7', 'ii%7', 'V7b9', 'i7', 'i7', 'ii%7', 'V7b9'], weight: 5 },
      { chords: ['i7', 'VII7', 'VImaj7', 'V7b9', 'i7', 'VII7', 'VImaj7', 'V7b9'], weight: 3 },
    ],
    chorus: [
      { chords: ['ii%7', 'V7b9', 'i7', 'i7', 'ii%7', 'V7b9', 'i7', 'i7'], weight: 5 },
      { chords: ['iv7', 'V7b9', 'i7', 'i7', 'iv7', 'V7b9', 'i7', 'i7'], weight: 3 },
    ],
    solo: [{ chords: ['ii%7', 'V7b9', 'i7', 'i7', 'ii%7', 'V7b9', 'i7', 'i7'], weight: 4 }],
    outro: [{ chords: ['ii%7', 'V7b9', 'i7', 'i7'], weight: 4 }],
  },
  melodyCells: [
    { cell: [3, 1, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [-3, 3, 2, 4, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [-2, 14], weight: 3 },
  ],
  bass: [
    { name: 'partido-two', weight: 6, hits: [
      { at: 0, dur: 4, tone: 0, vel: 0.74 },
      { at: 8, dur: 6, tone: 0, vel: 1 },
    ] },
    { name: 'partido-answer', weight: 4, cycle: 32, hits: [
      { at: 0, dur: 3, tone: 0, vel: 0.74 },
      { at: 8, dur: 6, tone: 0, vel: 1 },
      { at: 16, dur: 3, tone: 0, vel: 0.72 },
      { at: 19, dur: 1, tone: 7, vel: 0.6 },
      { at: 24, dur: 6, tone: 0, vel: 0.98 },
    ] },
  ],
  comp: [
    { name: 'partido-cavaquinho', weight: 6, voices: 4, cycle: 32, voicing: 'tertian', hits: [
      { at: 3, dur: 1, vel: 0.62 }, { at: 6, dur: 2, vel: 0.74 },
      { at: 10, dur: 2, vel: 0.6 }, { at: 12, dur: 2, vel: 0.68 },
      { at: 15, dur: 3, vel: 0.72 },
      { at: 19, dur: 1, vel: 0.6 }, { at: 22, dur: 2, vel: 0.74 },
      { at: 26, dur: 2, vel: 0.6 }, { at: 28, dur: 2, vel: 0.68 },
      { at: 31, dur: 1, vel: 0.7 },
    ] },
    { name: 'partido-offbeat', weight: 3, voices: 4, voicing: 'tertian', hits: [
      { at: 2, dur: 2, vel: 0.7 }, { at: 6, dur: 2, vel: 0.64 },
      { at: 10, dur: 2, vel: 0.74 }, { at: 14, dur: 2, vel: 0.64 },
    ] },
  ],
  /**
   * The partido alto pandeiro figure, on `tb`, and it is the whole style: a
   * two-bar shape whose accents fall on the sixteenth *before* beats two and
   * four, which is why the surdo underneath sounds late even though it is not.
   */
  drums: [
    { name: 'partido-pandeiro', weight: 6, cycle: 32, voices: {
      tb: [0, 3, 4, 6, 8, 11, 12, 14, 16, 19, 20, 23, 24, 26, 28, 31],
      bd: twice([8]),
      rim: [3, 10, 15, 19, 26, 31],
    } },
    { name: 'partido-hands', weight: 4, cycle: 32, voices: {
      tb: twice([0, 3, 4, 7, 8, 11, 12, 15]),
      lp: twice([8]), mp: twice([3, 11]), hp: twice([6, 14]),
    } },
  ],
  twoHanded: {
    density: 0.55,
    modes: [['block', 4], ['answer', 4], ['ostinato', 2]],
    ostinato: {
      cycle: 32,
      hits: [
        { at: 3, dur: 1, vel: 0.6 }, { at: 6, dur: 2, vel: 0.7 },
        { at: 12, dur: 2, vel: 0.64 }, { at: 15, dur: 3, vel: 0.68 },
        { at: 22, dur: 2, vel: 0.7 }, { at: 28, dur: 2, vel: 0.64 },
        { at: 31, dur: 1, vel: 0.66 },
      ],
    },
  },
  melody: { leap: 0.26, ornament: 0.24, span: 14, sequence: 0.5, syncopation: 0.6 },
};

/**
 * BAIÃO — the Brazilian northeast, and the accordion belt's other end.
 *
 * Luiz Gonzaga, Pernambuco, and a trio of *sanfona* (accordion), **zabumba**
 * and **triângulo** — three instruments, no more, and the record sells a
 * million copies. The zabumba is a shallow double-headed drum carried on a
 * strap: a padded mallet strikes the top head and a thin stick — the *bacalhau*
 * — strikes the underside, so one player produces a low boom and a dry crack
 * *at the same time*. That is `bd` and `rim` together, which looks like a kit
 * and is one person.
 *
 * The rhythm is a *tresillo*: slots 0, 3 and 6 of the bar — long, long, short —
 * which is the same three-note cell that underlies the habanera, the tango and
 * half of New Orleans, arriving in Brazil by a different route. The triangle
 * plays continuous sixteenths on `perc` with the open stroke on the beat.
 *
 * The mode is the giveaway: baião melodies live in **mixolydian**, with the
 * flat seventh over a major tonic, which in the genre's chord-scale rule comes
 * out for free as soon as a table writes `bVII`. The progressions do exactly
 * that and nothing else has to be said.
 */
const baiao: Style = {
  id: 'baiao',
  label: 'Baião',
  description:
    'The sertão trio: accordion, zabumba and triangle. A long-long-short bass cell, a flat seventh over a major tonic, and one player making two drum sounds at once.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [116, 148],
  swing: 0,
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0,
  boxDrums: false,
  shots: [[[0, 3, 6], 5], [[6], 3], [[3, 6], 2]],
  progressions: {
    intro: [{ chords: ['I', 'bVII', 'I', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'I', 'I', 'bVII', 'bVII'], weight: 5, note: 'The flat seven and nothing else. A baião does not have a dominant and does not want one' },
      { chords: ['I', 'bVII', 'IV', 'I', 'I', 'bVII', 'IV', 'I'], weight: 4 },
      { chords: ['I', 'I', 'V7', 'V7', 'I', 'I', 'V7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['I', 'bVII', 'I', 'bVII', 'I', 'bVII', 'I', 'I'], weight: 5 },
      { chords: ['IV', 'IV', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 3 }],
    solo: [{ chords: ['I', 'bVII', 'I', 'bVII', 'I', 'bVII', 'I', 'I'], weight: 4 }],
    outro: [{ chords: ['bVII', 'bVII', 'I', 'I'], weight: 4 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['i', 'VII', 'i', 'VII', 'i', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    solo: [{ chords: ['i', 'VII', 'i', 'VII', 'i', 'VII', 'i', 'i'], weight: 4 }],
    outro: [{ chords: ['VII', 'VII', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [3, 3, 2, 4, 4], weight: 5, },
    { cell: [3, 3, 2, 8], weight: 5 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [-2, 2, 4, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [3, 3, 2, 8], weight: 3 },
    { cell: [8, 8], weight: 3 },
  ],
  /**
   * The tresillo — 3, 3, 2 in sixteenths — and the same cell iskelmä's beguine
   * has in dotted quarters. That is not a coincidence and it is worth marking:
   * the figure travelled from West Africa to the Caribbean to Brazil and,
   * separately, to a Finnish rhythm box in 1968. What makes it a baião rather
   * than a beguine is everything on top of it.
   */
  bass: [
    { name: 'baiao-tresillo', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 3, dur: 3, tone: 0, vel: 0.76 },
      { at: 6, dur: 2, tone: 7, vel: 0.86 },
      { at: 8, dur: 3, tone: 0, vel: 0.92 },
      { at: 11, dur: 3, tone: 0, vel: 0.72 },
      { at: 14, dur: 2, tone: 7, vel: 0.84 },
    ] },
    { name: 'baiao-half', weight: 4, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 3, dur: 3, tone: 0, vel: 0.76 },
      { at: 6, dur: 2, tone: 7, vel: 0.86 },
      { at: 8, dur: 8, tone: 0, vel: 0.9 },
    ] },
  ],
  comp: [
    { name: 'sanfona-hold', weight: 6, voices: 4, voicing: 'tertian', hits: [
      { at: 0, dur: 6, vel: 0.62 }, { at: 6, dur: 2, vel: 0.58 },
      { at: 8, dur: 6, vel: 0.6 }, { at: 14, dur: 2, vel: 0.56 },
    ] },
    { name: 'sanfona-tresillo', weight: 4, voices: 3, voicing: 'tertian', hits: [
      { at: 0, dur: 3, vel: 0.68 }, { at: 3, dur: 3, vel: 0.56 },
      { at: 6, dur: 2, vel: 0.64 }, { at: 8, dur: 3, vel: 0.66 },
      { at: 11, dur: 3, vel: 0.56 }, { at: 14, dur: 2, vel: 0.64 },
    ] },
  ],
  drums: [
    { name: 'zabumba', weight: 6, voices: {
      bd: [0, 6, 8, 14], rim: [3, 11],
      perc: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    } },
    { name: 'zabumba-xote', weight: 4, voices: {
      bd: [0, 8], rim: [4, 12], mp: [6, 14],
      perc: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  /**
   * The sanfona's left hand, and it is a `stride` for the same reason the
   * vallenato's is: the button side is a bass row and a chord row, and a
   * northeastern accordionist alternates them because that is what the
   * instrument is for. `ostinato` sits beside it holding the tresillo, which is
   * the other thing that hand does.
   */
  twoHanded: {
    density: 0.78,
    modes: [['stride', 5], ['ostinato', 4], ['answer', 1]],
    ostinato: {
      cycle: 16,
      hits: [
        { at: 0, dur: 3, vel: 0.7 }, { at: 3, dur: 3, vel: 0.56 },
        { at: 6, dur: 2, vel: 0.66 }, { at: 8, dur: 3, vel: 0.68 },
        { at: 11, dur: 3, vel: 0.56 }, { at: 14, dur: 2, vel: 0.64 },
      ],
    },
  },
  melody: { leap: 0.28, ornament: 0.26, span: 14, sequence: 0.52, syncopation: 0.45 },
};

/**
 * FREVO — Recife carnival, and the fastest brass writing in the project.
 *
 * A street march played by a wind band at a tempo nobody can sustain, which is
 * the point: the dancers carry small umbrellas and the steps are borrowed from
 * capoeira, and the music is written to be exhausting. It descends from the
 * European military march by way of the *maxixe*, so it has a snare drum, a
 * bass drum and no hand percussion at all — which makes it the only Brazilian
 * style here with no skin struck by a palm.
 *
 * The brass is the melody, the counter *and* the comp. Everything is a line;
 * there are no chords sustained anywhere, and the comp patterns below are stabs
 * on the offbeat because that is what a second trumpet part is. The harmony
 * moves fast, uses diminished passing chords the way a march does, and modulates
 * more readily than anything else here — `relativeMajorChorus` carries a real
 * number for that reason.
 */
const frevo: Style = {
  id: 'frevo',
  label: 'Frevo',
  description:
    'Recife carnival: a wind band at a sprint, diminished passing chords, offbeat brass stabs, and a snare drum instead of anything with a palm on it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [200, 236],
  swing: 0,
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0.3,
  shots: [[[0, 6, 12], 4], [[6, 14], 3], [[12, 14], 3], [[2, 6, 10, 14], 2]],
  progressions: {
    intro: [{ chords: ['I', 'V7', 'V7', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', '#io7', 'ii7', 'V7', 'I', '#io7', 'ii7', 'V7'], weight: 4, note: 'The sharpened-tonic diminished, which the frevo took straight out of a military march' },
      { chords: ['I', 'VI7', 'II7', 'V7', 'I', 'VI7', 'II7', 'V7'], weight: 4 },
      { chords: ['I', 'IV', 'V7/V', 'V7', 'I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V7', 'I', 'V7', 'IV', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I7', 'IV', '#ivo7', 'I', 'V7', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'iv', 'iv', 'I', 'V7/V', 'V7', 'V7'], weight: 3 }],
    solo: [{ chords: ['I', 'VI7', 'II7', 'V7', 'I', 'VI7', 'II7', 'V7'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'I', 'I'], weight: 4 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'VI', 'ii%7', 'V7', 'i', 'VI', 'ii%7', 'V7'], weight: 4 },
      { chords: ['i', 'iv', 'V7/V', 'V7', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VI', 'VI', 'iv', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'V7', 'i', 'i', 'iv', 'V7', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'VI', 'VI', 'V7/V', 'V7/V', 'V7', 'V7'], weight: 3 }],
    solo: [{ chords: ['i', 'VI', 'ii%7', 'V7', 'i', 'VI', 'ii%7', 'V7'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 2, 2, 2, 2, 2, 2], weight: 5 },
    { cell: [-2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [
    { name: 'frevo-two', weight: 6, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 'fifth', vel: 0.86 },
    ] },
    { name: 'frevo-four', weight: 4, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.78 },
      { at: 8, dur: 3, tone: 0, vel: 0.9 },
      { at: 12, dur: 3, tone: 'fifth', vel: 0.78 },
    ] },
    { name: 'frevo-pickup', weight: 3, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 8, dur: 3, tone: 7, vel: 0.86 },
      { at: 12, dur: 2, tone: 0, vel: 0.76 },
      { at: 14, dur: 2, tone: -5, vel: 0.7 },
    ] },
  ],
  comp: [
    { name: 'frevo-stabs', weight: 6, voices: 4, voicing: 'tertian', hits: [
      { at: 2, dur: 2, vel: 0.82 }, { at: 6, dur: 2, vel: 0.86 },
      { at: 10, dur: 2, vel: 0.82 }, { at: 14, dur: 2, vel: 0.88 },
    ] },
    { name: 'frevo-march', weight: 4, voices: 4, voicing: 'tertian', hits: [
      { at: 4, dur: 3, vel: 0.84 }, { at: 12, dur: 3, vel: 0.86 },
    ] },
  ],
  drums: [
    { name: 'frevo-march', weight: 6, voices: {
      bd: [0, 8], sd: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15],
      hh: [4, 12], cr: [0],
    } },
    { name: 'frevo-caixa', weight: 4, voices: {
      bd: [0, 6, 8, 14], sd: [2, 4, 7, 10, 12, 15],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
  ],
  melody: { leap: 0.38, ornament: 0.2, span: 18, sequence: 0.42, syncopation: 0.5 },
};

// ---------------------------------------------------------------------------
// Mexico: the polka that crossed a river, and the two bands it met
// ---------------------------------------------------------------------------

/**
 * NORTEÑO — a Bohemian polka played on the Rio Grande for a hundred and forty
 * years.
 *
 * German and Czech settlers brought the accordion and the polka to Texas and
 * Nuevo León in the 1860s; the Mexican half added the **bajo sexto**, a
 * twelve-string guitar with the bottom courses tuned an octave apart, and the
 * combination has not changed since. Two instruments, a bass and a snare, and a
 * repertoire of murder ballads and smuggling songs.
 *
 * The rhythm is a plain oom-pah and there is no point dressing it up: the bass
 * plays one and three, the bajo sexto chops two and four, and everything
 * interesting is in the accordion's right hand and the words. What makes it
 * *norteño* rather than a polka is the bajo sexto's octave-doubled bass strings
 * — which is `steelGuitar` in this catalogue and not `nylonGuitar`, because the
 * sound is steel struck with a pick and has no nylon warmth in it at all.
 *
 * Almost always major, and the tempo band is narrow because a polka has one
 * tempo. `stride` dominates the left hand for the same reason as the
 * vallenato's, and the two styles are cousins by way of the same German
 * export catalogue.
 */
const norteno: Style = {
  id: 'norteno',
  label: 'Norteño',
  description:
    'A Bohemian polka on the Rio Grande: button accordion, bajo sexto chopping two and four, an oom-pah bass, and a song about somebody who did not make it across.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [124, 152],
  swing: 0,
  modeWeights: { minor: 0.18, major: 0.82 },
  relativeMajorChorus: 0,
  excludeLayers: ['pad'],
  shots: [[[0, 8], 4], [[4, 12], 3], [[12], 2]],
  progressions: {
    intro: [{ chords: ['I', 'V7', 'V7', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'IV', 'V7', 'V7', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V7', 'I', 'IV', 'I', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['V7', 'V7', 'I', 'I', 'IV', 'V7', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'V7/V', 'V7/V', 'V7', 'V7', 'I', 'I'], weight: 3 }],
    solo: [{ chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'I', 'I'], weight: 4 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VII', 'VII', 'iv', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'V7', 'i', 'i', 'iv', 'V7', 'i', 'i'], weight: 4 },
    ],
    solo: [{ chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [4, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [3, 1, 4, 4, 4], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [
    { name: 'norteno-oompah', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.86 },
    ] },
    { name: 'norteno-walk', weight: 4, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 8, dur: 2, tone: 'fifth', vel: 0.84 },
      { at: 12, dur: 3, tone: 0, vel: 0.78 },
    ] },
  ],
  comp: [
    { name: 'bajo-sexto', weight: 6, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.82 }, { at: 12, dur: 3, vel: 0.84 },
    ] },
    { name: 'bajo-sexto-double', weight: 4, voices: 3, hits: [
      { at: 4, dur: 2, vel: 0.82 }, { at: 6, dur: 2, vel: 0.6 },
      { at: 12, dur: 2, vel: 0.84 }, { at: 14, dur: 2, vel: 0.62 },
    ] },
  ],
  drums: [
    { name: 'norteno-polka', weight: 6, voices: {
      bd: [0, 8], sd: [4, 12], hh: [0, 4, 8, 12],
    } },
    { name: 'norteno-redova', weight: 3, voices: {
      bd: [0, 8], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], perc: [6, 14],
    } },
  ],
  twoHanded: {
    density: 0.85,
    modes: [['stride', 8], ['answer', 2]],
  },
  melody: { leap: 0.3, ornament: 0.3, span: 15, sequence: 0.55, syncopation: 0.2 },
};

/**
 * RANCHERA — the mariachi waltz, and the one style here that is a voice with a
 * band behind it.
 *
 * Written in 3/4, which is the *ranchera valseada* — the commonest of the three
 * ranchera metres and the one everybody hears in their head. A mariachi is
 * violins, two trumpets, a **vihuela** (a small round-backed five-string guitar
 * with a very short sustain), a **guitarrón** (a fretless acoustic bass guitar
 * the player holds against their chest) and a guitar, and the accompaniment is a
 * plain *mánico*: guitarrón on one, vihuela and guitar on two and three.
 *
 * What earns it a place beside twenty-five dance rhythms is that it is barely a
 * dance rhythm at all. The tempo is elastic, the trumpets answer the singer
 * rather than riffing, and the whole architecture is built around a held note at
 * the end of a phrase that the band waits through. `cadenceCells` therefore
 * weights the twelve-slot whole bar higher than any other style here, and
 * `boxDrums` is false because a preset button holds a tempo exactly and this
 * music is a singer deciding when the next bar starts.
 */
const ranchera: Style = {
  id: 'ranchera',
  label: 'Ranchera',
  description:
    'The mariachi waltz: guitarrón on one, vihuela on two and three, trumpets answering the singer, and a held note at the end of every phrase that the band waits through.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [132, 168],
  swing: 0,
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0.35,
  boxDrums: false,
  shots: [[[0], 4], [[0, 8], 3], [[8], 2]],
  progressions: {
    intro: [{ chords: ['I', 'V7', 'V7', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'V7/V', 'V7', 'V7', 'I', 'IV', 'V7', 'I'], weight: 3 },
      { chords: ['I', 'vi', 'ii7', 'V7', 'I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I7', 'IV', 'iv', 'I', 'V7', 'I', 'I'], weight: 4, note: 'The tonic turned into a dominant of the fourth, then the fourth borrowed minor — the ranchera’s one reliable piece of harmonic drama' },
      { chords: ['V7', 'V7', 'I', 'I', 'IV', 'V7', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'V7/V', 'V7/V', 'V7', 'V7', 'I', 'I'], weight: 3 }],
    solo: [{ chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 }],
    outro: [{ chords: ['IV', 'V7', 'I', 'I'], weight: 4 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'V7', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VI', 'VI', 'iv', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'V7', 'i', 'i', 'iv', 'V7', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['VI', 'VI', 'V7/V', 'V7/V', 'V7', 'V7', 'i', 'i'], weight: 3 }],
    solo: [{ chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 4 }],
    outro: [{ chords: ['iv', 'V7', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4], weight: 5 },
    { cell: [8, 4], weight: 4 },
    { cell: [6, 2, 4], weight: 4 },
    { cell: [4, 2, 2, 4], weight: 3 },
    { cell: [-4, 4, 4], weight: 3 },
    { cell: [12], weight: 3 },
    { cell: [2, 2, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [12], weight: 7 },
    { cell: [8, 4], weight: 3 },
    { cell: [4, 8], weight: 2 },
  ],
  bass: [
    { name: 'guitarron-one', weight: 6, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
    ] },
    { name: 'guitarron-octave', weight: 4, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 4, dur: 4, tone: 'octave', vel: 0.66 },
    ] },
    { name: 'guitarron-walk', weight: 3, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 },
      { at: 8, dur: 4, tone: 'fifth', vel: 0.74 },
    ] },
  ],
  comp: [
    { name: 'manico', weight: 6, voices: 3, hits: [
      { at: 4, dur: 3, vel: 0.78 }, { at: 8, dur: 3, vel: 0.74 },
    ] },
    { name: 'manico-double', weight: 4, voices: 3, hits: [
      { at: 4, dur: 2, vel: 0.78 }, { at: 6, dur: 2, vel: 0.58 },
      { at: 8, dur: 2, vel: 0.74 }, { at: 10, dur: 2, vel: 0.58 },
    ] },
    { name: 'ranchera-sustained', weight: 2, voices: 4, voicing: 'tertian',
      hits: [{ at: 0, dur: 12, vel: 0.5 }] },
  ],
  /**
   * A mariachi has no percussionist. What is written below is the vihuela's
   * body being struck and the guitarrón's low note, both of which read as drums
   * to an ear and neither of which is one — so the patterns are deliberately
   * almost empty, and most renders of this style will have nothing on the kit
   * worth noticing. That is correct.
   */
  drums: [
    { name: 'mariachi-none', weight: 6, voices: {
      lp: [0], rim: [4, 8],
    } },
    { name: 'mariachi-light', weight: 3, voices: {
      lp: [0], rim: [4, 8], sh: [0, 4, 8],
    } },
  ],
  twoHanded: {
    density: 0.7,
    modes: [['stride', 5], ['answer', 4], ['block', 1]],
  },
  melody: { leap: 0.28, ornament: 0.36, span: 17, sequence: 0.42, syncopation: 0.22 },
  /**
   * The held note the band waits through is not in the notes, and a mariachi
   * waltz is being given a coro.
   *
   * Two sentences from the comment above and each is contradicted by a different
   * column. *"The whole architecture is built around a held note at the end of a
   * phrase that the band waits through — `cadenceCells` therefore weights the
   * twelve-slot whole bar higher than any other style here."* What it plays is
   * **21% of notes a quarter or longer, third-lowest of the twenty-six, and 52%
   * eighths**. It is the sparsest style in the folder at 2.24 onsets a sounding
   * bar and it spends that sparseness on rests rather than on length, which is
   * the opposite statement.
   *
   * And *"it is barely a dance rhythm at all… a voice with a band behind it"*,
   * under a genre voice pinning `riff-response` at 5 where derivation gives 0.68
   * — a sevenfold lift, the largest in the folder, which `genre/latin/index.ts`
   * flags by name: *"a mariachi waltz with no coro anywhere in its tables."*
   *
   * `long-note` is the field for both, because it is the one archetype that is a
   * claim about duration rather than about contour — it carries `density` 0.45
   * and a `judge.density` of 0.3, so a section that draws it is scored as a slow
   * one instead of against a dance band. The coro pair goes to where this style's
   * own tables put it.
   */
  voice: {
    archetypes: [
      ['long-note', 4],
      ['riff-response', 1],
      ['chant', 1],
    ],
  },
};

/**
 * BANDA SINALOENSE — a brass band with a tuba for a bass and no strings at all.
 *
 * Sinaloa, and the same German import as the norteño arriving on a different
 * road: a village wind band — clarinets, trumpets, trombones, alto horns, a
 * **tuba** and a **tambora** — playing the same polkas, waltzes and rancheras
 * that the accordion players were playing three hundred miles east. The tuba is
 * the entire low end and it plays a walking two-feel; there is no guitar, no
 * piano and no electric anything, which is why this style excludes the comp
 * layer's usual suspects by way of the era palettes rather than by a field here.
 *
 * The tambora is a large double-headed drum played with a mallet on one head
 * and a stick on the rim, so it takes `bd` and `rim` together in the same way
 * the zabumba does — and the **tarola**, a snare, plays a march figure over the
 * top. Loud, unsubtle and completely relentless, which is the compliment.
 */
const banda: Style = {
  id: 'banda',
  label: 'Banda sinaloense',
  description:
    'A Sinaloan wind band: a tuba walking the bass, clarinets and trumpets in thirds, a tambora with a mallet and a stick, and nothing with strings on it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [128, 158],
  swing: 0,
  modeWeights: { minor: 0.22, major: 0.78 },
  relativeMajorChorus: 0.2,
  excludeLayers: ['pad'],
  shots: [[[0, 8], 4], [[4, 12], 3], [[12, 14], 3]],
  progressions: {
    intro: [{ chords: ['I', 'V7', 'V7', 'I'], weight: 4 }],
    verse: [
      { chords: ['I', 'I', 'V7', 'V7', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 },
      { chords: ['I', 'VI7', 'II7', 'V7', 'I', 'IV', 'V7', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V7', 'V7', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I7', 'IV', 'IV', 'I', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['V7', 'V7', 'I', 'I', 'V7', 'V7', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['IV', 'IV', 'V7/V', 'V7/V', 'V7', 'V7', 'I', 'I'], weight: 3 }],
    solo: [{ chords: ['I', 'IV', 'V7', 'I', 'I', 'IV', 'V7', 'I'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'I', 'I'], weight: 4 }],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'V7', 'V7', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['III', 'III', 'VI', 'VI', 'iv', 'V7', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'V7', 'i', 'i', 'iv', 'V7', 'i', 'i'], weight: 4 },
    ],
    solo: [{ chords: ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'], weight: 4 }],
    outro: [{ chords: ['V7', 'V7', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 4, 4], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 4 },
    { cell: [3, 1, 4, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
  ],
  /**
   * The tuba, and it is why this style's bass table has three walking entries
   * where the norteño's has none. A tuba player cannot sustain, so they fill —
   * an oom-pah on a tuba turns into a two-feel with passing notes within about
   * eight bars, and the second and third patterns are that.
   */
  bass: [
    { name: 'tuba-two', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.88 },
    ] },
    { name: 'tuba-walk', weight: 5, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 4, dur: 3, tone: 'fifth', vel: 0.78 },
      { at: 8, dur: 3, tone: 'octave', vel: 0.86 },
      { at: 12, dur: 3, tone: 'fifth', vel: 0.78 },
    ] },
    { name: 'tuba-fill', weight: 4, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 7, vel: 0.7 },
      { at: 8, dur: 3, tone: 0, vel: 0.88 },
      { at: 12, dur: 2, tone: 7, vel: 0.76 },
      { at: 14, dur: 2, tone: 12, vel: 0.68 },
    ] },
  ],
  comp: [
    { name: 'banda-offbeat', weight: 6, voices: 4, voicing: 'tertian', hits: [
      { at: 4, dur: 3, vel: 0.82 }, { at: 12, dur: 3, vel: 0.84 },
    ] },
    { name: 'banda-stabs', weight: 4, voices: 4, voicing: 'tertian', hits: [
      { at: 2, dur: 2, vel: 0.76 }, { at: 6, dur: 2, vel: 0.82 },
      { at: 10, dur: 2, vel: 0.76 }, { at: 14, dur: 2, vel: 0.84 },
    ] },
  ],
  drums: [
    { name: 'tambora-tarola', weight: 6, voices: {
      bd: [0, 8], rim: [3, 11], sd: [4, 6, 12, 14], hh: [0, 4, 8, 12],
    } },
    { name: 'tambora-march', weight: 4, voices: {
      bd: [0, 6, 8, 14], rim: [4, 12],
      sd: [0, 2, 3, 4, 8, 10, 11, 12], cr: [0],
    } },
  ],
  melody: { leap: 0.32, ornament: 0.26, span: 16, sequence: 0.5, syncopation: 0.3 },
  /**
   * The thirds, and this style's own description names them as one of the four
   * things it is made of.
   *
   * *A tuba walking the bass, clarinets and trumpets in thirds, a tambora with a
   * mallet and a stick, and nothing with strings on it* — and three of those four
   * are already unconditional facts of the tables above. The tuba fills: two of
   * its three patterns walk, 9 of 15 weight. The tambora takes `bd` and `rim`
   * together in both drum figures. The strings are gone by `excludeLayers` and by
   * the era palettes. The fourth clause had nowhere to be written until this
   * field, and `arrangement.harmony` could not carry it — the genre weights that
   * device at 5 for the *moña*, which the mambo header defines as figures where
   * "none of them is the tune". This is the tune, doubled, all night, and it is
   * the only "in thirds" anywhere in the folder.
   *
   * `on: 'melody'`, and the sentence that used to say `counter` is the argument
   * for it: *a wind band's segunda does not answer the primera, it moves with
   * it*. This is the one style here whose header does not describe its second
   * wind part as answering something — the ranchera's trumpets "answer the
   * singer", the bolero's requinto answers the line, and the frevo spent its
   * second trumpet on the offbeat comp stabs — so it is the one that wants a
   * second *player on the tune* rather than the answering desk borrowed for a
   * strain. That is also why this sits on one style rather than on the genre.
   *
   * **What the move buys is that the counter keeps its own job.** Under
   * `on: 'counter'` the segunda was written over the answering line, so a banda
   * playing its thirds was a banda with nothing answering; now the second clarinet
   * doubles the primera and the counter goes on writing the figure behind them,
   * which is a wind band with fifteen people in it rather than four.
   *
   * 0.8 rather than 1, and the residual is the strain stated by one wind alone,
   * which a banda also does. `kinds` is absent deliberately — a march doubles its
   * intro and its outro as readily as its chorus — and the solo sections take
   * themselves out, since the pass sits in the arm of the section branch a solo
   * does not take.
   *
   * Below the tune, because the segunda is below the primera. 3:1 against the
   * sixth where `planChart`'s own coin flip is 65:35: a scored second part sits
   * on the third and reaches for the sixth where the third below would drop it
   * into the trombones, which is rarer than an arranger picking by ear.
   */
  harmony: {
    amount: 0.8,
    intervals: [[-2, 6], [-5, 2]],
    on: 'melody',
  },
};

// ---------------------------------------------------------------------------

export const STYLES: Record<string, Style> = {
  son, guaracha, guajira, bolero,
  danzon, chachacha, mambo,
  guaguanco, columbia,
  salsadura, songo, timba,
  merengue, bachata,
  cumbia, vallenato, joropo, plena, bomba,
  samba, partidoalto, baiao, frevo,
  norteno, ranchera, banda,
};
