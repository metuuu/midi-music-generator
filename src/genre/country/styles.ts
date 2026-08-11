/**
 * The country catalogue, 1927–1990, with bluegrass and honky-tonk inside it.
 *
 * Organised by **what the rhythm section is made of**, because that is the only
 * question this repertoire actually argues about. The harmony does not move: I,
 * IV, V and vi carry twenty of the twenty-four styles below and the four that
 * reach further are named and argued where they do it. The melody does not move
 * either — it is the major pentatonic of the key from 1927 to 1990. What changes,
 * and changes completely, is who is standing on the boards: four men round one
 * microphone with no drummer; a bar band with an amplified steel and a shuffle; a
 * Nashville session with a string section over it; and a rock rhythm section with
 * a Telecaster through a phase shifter.
 *
 * Sort this music by harmony and you get one chord chart twenty-four times. Sort
 * it by the rhythm section and the twenty-four stay twenty-four.
 *
 * ## The boom-chuck is two players, so it is declared once as two figures
 *
 * `LeftHandMode.stride` names it under four names — stride, oom-pah, the
 * stradella button side, boom-chuck — and every one of those is *one* player
 * doing both halves. On a country bandstand it is two: the bass plays the root on
 * one and the fifth on three, and the guitar chops the chord on two and four in
 * the holes that leaves. Neither half is the figure. The figure is the
 * interlock, and it is why `boomChuck` and `chuck` below are a matched pair that
 * appear together in twenty styles. `countrypop` is the single exception in
 * either direction: it keeps `chuck` and puts `pop-eights` underneath it — a
 * synth-pop bass on one note — so the guitar chop is there and the half it was
 * written to answer is not. That is the crossover record, and it is the one
 * place in the file where the interlock is broken on purpose.
 *
 * The one-player version is here too and is not a fallback: a cajun accordionist
 * has the bass buttons and the chord buttons under the same hand and plays them
 * alternately whether or not there is a bass player in the room, and a honky-tonk
 * piano does the same thing with an octave and a half between the hands. Those
 * styles declare `twoHanded` with `stride` weighted at the top, which is the
 * whole of what that field was built for.
 *
 * ## The banjo roll is an arpeggio, and it had to be
 *
 * A Scruggs roll is eight notes to the bar played with three fingers, thumb and
 * index and middle, in a repeating 3+3+2 that does not divide into the bar. It is
 * not a chord and it is not a melody: it is one note of the chord per eighth,
 * walking a ladder, carrying its position across the barline — which is
 * `CompPattern.arpeggio` word for word. `roll` below asks for a three-note
 * voicing against eight onsets, so the ladder and the bar are permanently out of
 * phase and the figure takes three bars to come back round, which is exactly what
 * the instrument sounds like.
 *
 * The reason it has to be played that way is in `style/instruments.ts` under
 * `banjo`: the head is mylar over a rim and the bridge stands on it, so the note
 * is gone in half a second and the right hand has to keep filling every eighth or
 * the instrument is silent. The roll is not a decoration on bluegrass banjo; it
 * is the only way to hold a note out on the object.
 *
 * ## Which half of the catalogue swings, and it is a clean cut
 *
 * `swing` is a real number on ten styles here and exactly zero on fourteen, and
 * the line between them is not a matter of taste — it is Bakersfield in about
 * 1963. Everything descended from the dance band swings: the honky-tonk shuffle
 * (0.33, the largest number in the project outside jazz), western swing, the
 * rockabilly boogie, the gospel quartet's triplet, the cajun lilt, the old-time
 * fiddler's long-short bow. Everything descended from the *record* does not: the
 * Bakersfield sound is Nashville with the shuffle deliberately taken out so that
 * a Telecaster and a Fender bass could play straight eighths against each other,
 * and every style after it in this file is straight — truck-driving, outlaw,
 * country rock, alt-country, country pop. Bluegrass is straight for a different
 * and older reason: it was never a dance band. Nobody has ever shuffled at 180.
 *
 * ## Three things are uniform, and each is a decision
 *
 *  - **`relativeMajorChorus: 0` everywhere.** The lift from i to III is a Finnish
 *    dance arranger's gesture. This repertoire's lift is the *key change up a
 *    semitone for the last chorus*, which is a different mechanism entirely and
 *    lives in `eras.ts` as `keyChangeChance`. A country chorus that changed mode
 *    would have changed subject.
 *  - **No `vary` on the guitar or the bass.** The boom-chuck is what the dance is
 *    counted from and a rhythm guitarist who started decorating it would be taking
 *    the floor away, which is the same sentence iskelmä writes about its own comp
 *    and is even more literally true here: in a bluegrass band the rhythm guitar
 *    *is* the drummer.
 *  - **`boxDrums: false` on every style but one.** A preset box has a Country
 *    button and it is the trap `valssi` already names: the shuffle's whole
 *    character is the distance between the drummer's two hands, the train beat's
 *    is a brush on a snare head, and a two-beat that does not lean is a
 *    metronome. `countrypop` is the exception and it is the only style here whose
 *    subject is a record made in 1985.
 */

import type {
  BassPattern, CompPattern, DrumPattern, Progression, Style,
} from '../../style/types.js';
import type { SectionKind } from '../../core/types.js';
import { makeScale } from '../../core/scale.js';

// ---------------------------------------------------------------------------
// The figures
// ---------------------------------------------------------------------------

/**
 * The boom: root on one, fifth on three.
 *
 * The bass half of the boom-chuck, and the alternation is the whole of it. A
 * country bass that played the root twice would be a pulse; root-and-fifth is a
 * *line* two notes long, and it is what lets the guitar's chord on two and four
 * be heard as an answer rather than as a repeat. The fifth is lighter than the
 * root by about 1.5 dB, which is what a thumb does.
 */
const boomChuck = (weight: number): BassPattern => ({
  name: 'boom-chuck', weight,
  hits: [
    { at: 0, dur: 4, tone: 'root', vel: 1 },
    { at: 8, dur: 4, tone: 'fifth', vel: 0.85 },
  ],
});

/**
 * The same, with the bass run into the next bar.
 *
 * Three eighths walking up off the last beat, which is the one thing a country
 * bass player is allowed to invent and the thing they are hired for. `approach`
 * asks the harmony where the next chord is and steps into it, which is exactly
 * what the run does and is unavailable to a numbered shape.
 */
const boomRun = (weight: number): BassPattern => ({
  name: 'boom-run', weight,
  hits: [
    { at: 0, dur: 4, tone: 'root', vel: 1 },
    { at: 8, dur: 2, tone: 'fifth', vel: 0.85 },
    { at: 12, dur: 2, tone: 'octave', vel: 0.76 },
    { at: 14, dur: 2, tone: 'approach', vel: 0.8 },
  ],
});

/**
 * The two-beat, which is the boom-chuck with the walk taken out.
 *
 * A Nashville session bass plays one and three and nothing else, held long, and
 * the reason is the record rather than the dance: a note that rings through the
 * beat leaves the drummer's backbeat completely alone, and the backbeat is what
 * the arrangement is being built on. Half the events of `boomChuck` and twice the
 * length, which is the same trade rocksteady makes for the same reason.
 */
const twoBeat = (weight: number): BassPattern => ({
  name: 'two-beat', weight,
  hits: [
    { at: 0, dur: 7, tone: 'root', vel: 1 },
    { at: 8, dur: 7, tone: 'fifth', vel: 0.84 },
  ],
});

/** The waltz bass: one note, on one, held for the bar. */
const waltzBoom = (weight: number): BassPattern => ({
  name: 'waltz-boom', weight,
  hits: [{ at: 0, dur: 4, tone: 'root', vel: 1 }],
});

/**
 * The chuck: the chord on two and four, short.
 *
 * The guitar half. Two sixteenths of chord and then the fretting hand relaxes —
 * a country rhythm guitarist damps with the heel of the picking hand on the way
 * back, so what sounds is the strum and its own stop. Held for an eighth instead
 * it becomes an organ, which is the same distinction reggae's skank makes about
 * itself and is arrived at from the opposite end of the bar: the skank is on the
 * offbeats and this is squarely on two and four, where a dance can find it.
 *
 * Four voices rather than three. An open-position G on a flat-top is six strings
 * and the low ones are ringing; a three-note voicing up the neck is a jazz
 * guitarist's chord and the wrong object.
 */
const chuck = (weight: number, voices = 4): CompPattern => ({
  name: 'chuck', weight, voices,
  hits: [
    { at: 4, dur: 2, vel: 0.92 },
    { at: 12, dur: 2, vel: 0.88 },
  ],
});

/**
 * The chop: the same two beats, half as long and twice as hard.
 *
 * **This is where the mandolin is.** There is no mandolin in the catalogue and
 * there is no General MIDI programme for one, so the instrument arrives here as a
 * *figure* rather than as a patch, played by `mutedGuitar` — whose whole
 * character is a 0.25-second decay because the string is damped by the hand that
 * struck it, which is precisely what a mandolin chop is. A mandolinist frets a
 * closed shape, strikes it on the backbeat and lifts, and what sounds is about
 * 90 ms of four strings and then nothing. Given a choice between an instrument
 * that has the right timbre and the wrong envelope and one that has the right
 * envelope and the wrong timbre, the envelope is the half a listener uses to
 * identify a bluegrass band from the next room.
 *
 * One sixteenth, and the velocity is *above* the guitar's chuck. In a bluegrass
 * band there is no snare drum and the chop is the backbeat; a chop mixed as
 * accompaniment has buried the only thing landing on two and four.
 */
const chop = (weight: number, voices = 3): CompPattern => ({
  name: 'chop', weight, voices,
  hits: [
    { at: 4, dur: 1, vel: 1 },
    { at: 12, dur: 1, vel: 0.96 },
  ],
});

/** The waltz chuck: chords on two and three, in the holes the single bass note leaves. */
const waltzChuck = (weight: number, voices = 4): CompPattern => ({
  name: 'waltz-chuck', weight, voices,
  hits: [
    { at: 4, dur: 3, vel: 0.9 },
    { at: 8, dur: 3, vel: 0.84 },
  ],
});

/**
 * The forward roll.
 *
 * Eight to the bar with three fingers, accented 3+3+2 — slots 0, 6 and 12 are
 * the thumb and everything between them is index and middle at about two thirds
 * of the weight. Written flat it is a sixteenth-note pad; written this way it
 * rolls, and the roll is the sound of the instrument.
 *
 * `arpeggio` and not a chord, for the reason argued at the top of this file: the
 * ladder is three rungs, the bar is eight onsets, and the two never agree. That
 * disagreement is deliberate and it is why two consecutive bars of a banjo part
 * are never the same bar twice even though the pattern is identical and the chord
 * has not moved.
 */
const roll = (weight: number): CompPattern => ({
  name: 'forward-roll', weight, voices: 3, arpeggio: true, arpDirection: 'up',
  hits: [
    { at: 0, dur: 2, vel: 0.96 }, { at: 2, dur: 2, vel: 0.68 }, { at: 4, dur: 2, vel: 0.7 },
    { at: 6, dur: 2, vel: 0.92 }, { at: 8, dur: 2, vel: 0.68 }, { at: 10, dur: 2, vel: 0.7 },
    { at: 12, dur: 2, vel: 0.9 }, { at: 14, dur: 2, vel: 0.68 },
  ],
});

/**
 * The forward-reverse roll, over two octaves.
 *
 * The other roll every banjo player has, and the difference is audible
 * immediately: the hand turns round in the middle of the bar, so the ladder is
 * six rungs instead of three and spans two octaves instead of one. Against eight
 * onsets that takes three times as long to come back round — which is the
 * argument `arpDirection` makes about itself and is the reason a bluegrass break
 * can sit on one chord for four bars without anybody noticing.
 */
const reverseRoll = (weight: number): CompPattern => ({
  name: 'reverse-roll', weight, voices: 3, arpeggio: true, arpDirection: 'updown', arpOctaves: 2,
  hits: [
    { at: 0, dur: 2, vel: 0.94 }, { at: 2, dur: 2, vel: 0.68 }, { at: 4, dur: 2, vel: 0.72 },
    { at: 6, dur: 2, vel: 0.88 }, { at: 8, dur: 2, vel: 0.68 }, { at: 10, dur: 2, vel: 0.7 },
    { at: 12, dur: 2, vel: 0.86 }, { at: 14, dur: 2, vel: 0.66 },
  ],
});

/**
 * The two-beat kit: kick on one and three, backbeat on two and four.
 *
 * The plainest drum pattern in the project and the correct one. A country
 * drummer's job description from 1955 to 1990 is to be inaudible and exactly on
 * time; every ornament this genre has belongs to somebody else.
 */
const twoBeatKit = (weight: number): DrumPattern => ({
  name: 'two-beat', weight,
  voices: {
    bd: [0, 8],
    sd: [4, 12],
    hh: [0, 2, 4, 6, 8, 10, 12, 14],
  },
});

/** The same with the stick laid across the head — quieter, and what a ballad gets. */
const brushKit = (weight: number): DrumPattern => ({
  name: 'brushes', weight,
  voices: {
    bd: [0, 8],
    rim: [4, 12],
    sh: [0, 2, 4, 6, 8, 10, 12, 14],
  },
});

/**
 * The shuffle kit.
 *
 * Written straight and swung by `Style.swing`, which is the right division of
 * labour: the shuffle is a *timing* fact about every eighth in the bar and not a
 * set of slots, and a pattern that tried to spell it would be spelling one tempo's
 * worth of it. What is written here is the shape — kick on one and three, snare
 * on two and four, and the hand keeping eighths over the top — and the 0.33 in
 * the style is what makes it a shuffle rather than a march.
 */
const shuffleKit = (weight: number): DrumPattern => ({
  name: 'shuffle', weight,
  voices: {
    bd: [0, 8],
    sd: [4, 12],
    hh: [0, 2, 4, 6, 8, 10, 12, 14],
  },
});

/**
 * The train beat, and it is the one drum pattern in this genre with an idea in it.
 *
 * Brushes running straight sixteenths on the snare head with the backbeat pressed
 * into them, and a kick on one and three underneath. That is a freight train, and
 * it is what Luther Perkins' muted bass strings and W.S. Holland's right hand are
 * doing on every Sun record and every train song after them. `sd` on all sixteen
 * slots is not a busy part — each stroke is a brush at conversational level and
 * the two that matter are 4 and 12, which is why the velocities are not in the
 * pattern but in the accent the kit generator puts on the backbeat.
 *
 * Straight, always, at every tempo. A swung train beat is a horse.
 */
const trainKit = (weight: number): DrumPattern => ({
  name: 'train', weight,
  voices: {
    bd: [0, 8],
    sd: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    hh: [4, 12],
  },
});

/**
 * The seven styles with no kit now write `drums: []`, and there used to be a
 * placeholder here so that they could not.
 *
 * `NO_KIT` stood at this point in the file — one row named `none` with an empty
 * `voices` map — and it was spread into breakdown, bluegrass, bluegrasswaltz,
 * gospel, cowboy, murderballad and newgrass. It was never *reached*: every one
 * of those seven also declares `excludeLayers: ['drums']`, so the layer is gone
 * long before a stroke is placed. It existed for exactly one line in
 * `generateSong`, which drew the song's drum figure before it knew which layers
 * were excluded and threw `total weight must be > 0` on an empty table. Ambient
 * hit the same wall and answered it the same way, with two inline copies rather
 * than a constant, and its two comments are where the argument was first made.
 *
 * That draw is guarded now — `style.drums.length > 0 ? … : undefined` — so an
 * empty table says what it means and the workaround is gone.
 *
 * **The cost is not zero, and it is the part worth writing down.** The guard
 * *skips* the draw rather than discarding its result, and `rng.weightedBy`
 * costs exactly one `next()` whatever it returns, so the draw that lands next
 * is the drum machine and the ones behind that are the section progressions —
 * which in this genre is a table of two to five options per section kind, so
 * the harmony re-rolls and the notes written over it follow. All 7 of these
 * styles generate different music from the same seed than they did before.
 * Measured over 8 seeds per style rather than assumed: **56 of 56 songs moved**
 * in MIDI and in Strudel, with the same sections, the same layer sets and the
 * same instruments — one seed of `newgrass` drew a counter line it had not
 * drawn before, which the style permits and which is exactly what a different
 * draw looks like. Nothing else in the catalogue moved with them: 0 of the 17
 * country styles that own a kit, and 0 of the 3,040 songs the sweep generated
 * outside these seven and ambient's two, across all nineteen genres.
 *
 * That is a re-roll and not a fault, and it is permitted because this project
 * does not preserve generated music across a change. It is also not universal:
 * indian's four and arabic's one lost the same placeholder and did not move a
 * byte, because an unmetred piece over a drone has one progression per section
 * and nothing for the shifted stream to choose differently. See the note on
 * `FREE` in `genre/indian/styles.ts` for that half of the measurement.
 *
 * What the deletion does *not* lose is the one thing the empty `voices` map was
 * good for: a reader who later lifts the exclusion still gets silence and goes
 * looking, rather than a plausible backbeat behind a 1928 string band that
 * nobody ever notices.
 */

/** Three to the bar, and a kick only on the one. */
const waltzKit = (weight: number): DrumPattern => ({
  name: 'waltz', weight,
  voices: {
    bd: [0],
    sd: [4, 8],
    hh: [0, 4, 8],
  },
});

/**
 * What the whole band catches at a seam, and it is squarely on the beat.
 *
 * The exact opposite of reggae's table and for the exact opposite reason. There,
 * the derived group heads were wrong because the genre is organised around not
 * playing on them; here they are nearly right and the only thing worth adding is
 * the *anticipated* one — the band arriving an eighth before the barline and
 * holding, which is how a country arrangement gets into a last chorus and is the
 * one gesture the metre fallback cannot produce.
 */
const COUNTRY_SHOTS: (readonly [number[], number])[] = [
  [[0, 8], 4],
  [[0, 6, 8], 3],
  [[0, 4, 8, 12], 3],
  [[0, 14], 2],
  [[0], 2],
];

/** Three to the bar. */
const WALTZ_SHOTS: (readonly [number[], number])[] = [
  [[0], 4],
  [[0, 4, 8], 3],
  [[0, 10], 2],
];

// ---------------------------------------------------------------------------
// The chords
// ---------------------------------------------------------------------------

/**
 * Six shared harmonic tables, and the sharing is the claim.
 *
 * Every other style file in this project writes its progressions out per style,
 * and here that would say something false. Eleven of the twenty-four styles below
 * have *the same harmony* — I, IV, V, eight bars — and writing eleven
 * slightly-different copies of it would be inventing distinctions the repertoire
 * does not contain and then presenting them as research. The plainness is not a
 * limitation of the tables, it is the subject: this is a music where a song is
 * expected to be playable by anybody who is handed the key, and every mechanism
 * it has for being interesting is somewhere other than the chord chart.
 *
 * So a style that shares `THREE_CHORD` is making the claim "this is a three-chord
 * song", which is true of a bluegrass number and a honky-tonk shuffle and a
 * hymn alike; and a style that writes its own table is making a claim *against*
 * that, which is then legible as the exception it is. Five styles do — western
 * swing, zydeco, Bakersfield, the murder ballad and alt-country — and each says
 * why at its own entry.
 */

type Table = Partial<Record<SectionKind, Progression[]>>;

/**
 * I, IV and V, and it carries most of the file.
 *
 * The verses are the two shapes a country song actually has: four bars of the
 * tonic before anything happens, or a move to IV in bar three. The V arrives in
 * bar seven and goes home, every time, because the eighth bar is where the singer
 * takes a breath and the whole form depends on the ear knowing that.
 */
const THREE_CHORD: Table & { verse: Progression[]; chorus: Progression[] } = {
  intro: [
    { chords: ['I', 'I', 'V', 'V'], weight: 4 },
    { chords: ['I', 'IV', 'V', 'I'], weight: 3 },
  ],
  verse: [
    { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'V', 'V'], weight: 5, note: 'Four bars of nothing happening. Half this repertoire opens exactly here, and the tune is what is moving' },
    { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 5 },
    { chords: ['I', 'IV', 'I', 'I', 'IV', 'IV', 'V', 'I'], weight: 4 },
    { chords: ['I', 'I', 'V', 'V', 'I', 'I', 'IV', 'V'], weight: 3 },
  ],
  chorus: [
    { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 5, note: 'The chorus starts on IV. It is the cheapest lift in music and this repertoire has never once got tired of it' },
    { chords: ['I', 'I', 'IV', 'IV', 'V', 'V', 'I', 'I'], weight: 5 },
    { chords: ['I', 'IV', 'V', 'I', 'I', 'IV', 'V', 'I'], weight: 3 },
  ],
  bridge: [
    { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'V', 'V'], weight: 4 },
    { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 3 },
  ],
  outro: [
    { chords: ['IV', 'V', 'I', 'I'], weight: 4 },
    { chords: ['V', 'V', 'I', 'I'], weight: 3 },
  ],
};

/**
 * The same three chords with a vi and a ii in them — the Nashville chart.
 *
 * What a session player is handed in 1968 instead of what a string band knows by
 * ear. The difference is exactly one relative minor and one supertonic, and that
 * is genuinely the whole harmonic distance between the Bristol sessions and Music
 * Row: a vi in bar five turns eight bars of three chords into something an
 * arranger can write strings over.
 */
const NASHVILLE_CHORDS: Table & { verse: Progression[]; chorus: Progression[] } = {
  intro: [
    { chords: ['I', 'vi', 'ii', 'V'], weight: 4 },
    { chords: ['IV', 'V', 'I', 'I'], weight: 3 },
  ],
  verse: [
    { chords: ['I', 'I', 'vi', 'vi', 'IV', 'IV', 'V', 'V'], weight: 5 },
    { chords: ['I', 'I', 'IV', 'IV', 'I', 'vi', 'ii', 'V'], weight: 4 },
    { chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'ii', 'V'], weight: 4 },
    { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'V', 'V'], weight: 3 },
  ],
  chorus: [
    { chords: ['IV', 'IV', 'I', 'I', 'ii', 'V', 'I', 'I'], weight: 5 },
    { chords: ['I', 'I', 'IV', 'IV', 'V', 'V', 'I', 'I'], weight: 4 },
    { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'V', 'I', 'I'], weight: 3 },
  ],
  bridge: [
    { chords: ['IV', 'IV', 'iii', 'vi', 'ii', 'ii', 'V', 'V'], weight: 4, note: 'The borrowed iii–vi is the one gesture the Nashville sound has that a string band does not, and it is what the strings are there to play over' },
    { chords: ['vi', 'vi', 'ii', 'ii', 'V', 'V', 'I', 'I'], weight: 3 },
  ],
  outro: [
    { chords: ['IV', 'V', 'I', 'I'], weight: 4 },
    { chords: ['ii', 'V', 'I', 'I'], weight: 2 },
  ],
};

/**
 * The flat seventh, which is where the modal end of this music lives.
 *
 * Two quite different repertoires share it and neither is doing what a dance band
 * does with a dominant. An old-time fiddle tune in D with a C chord in it has no
 * dominant at all — the tuning is open, the drone strings are ringing, and a V
 * would ask the fiddler to stop a note the instrument is currently sounding. A
 * 1975 outlaw record has a ♭VII for the opposite reason: it has been listening to
 * rock, where the same chord is standard, and the mixolydian seventh is what
 * makes a Telecaster part sound like 1975 rather than like 1955.
 *
 * They arrive at the same chord from two hundred miles and fifty years apart, and
 * both are honestly served by one table.
 */
const MODAL_CHORDS: Table & { verse: Progression[]; chorus: Progression[] } = {
  intro: [
    { chords: ['I', 'bVII', 'IV', 'I'], weight: 4 },
    { chords: ['I', 'I', 'bVII', 'I'], weight: 3 },
  ],
  verse: [
    { chords: ['I', 'I', 'bVII', 'bVII', 'I', 'I', 'IV', 'I'], weight: 5 },
    { chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'IV', 'IV'], weight: 4 },
    { chords: ['I', 'bVII', 'I', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 4 },
    { chords: ['I', 'I', 'IV', 'IV', 'I', 'bVII', 'I', 'I'], weight: 3 },
  ],
  chorus: [
    { chords: ['bVII', 'bVII', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 5 },
    { chords: ['IV', 'IV', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 4 },
    { chords: ['I', 'IV', 'bVII', 'IV', 'I', 'IV', 'V', 'I'], weight: 3 },
  ],
  bridge: [
    { chords: ['IV', 'IV', 'bVII', 'bVII', 'I', 'I', 'V', 'V'], weight: 3 },
  ],
  outro: [
    { chords: ['bVII', 'IV', 'I', 'I'], weight: 4 },
    { chords: ['I', 'I', 'I', 'I'], weight: 2 },
  ],
};

/**
 * Country in minor, once, for the whole genre.
 *
 * This is the largest shared table here and the one that most needs its argument
 * stated, because on its face it looks like seventeen styles being lazy. It is
 * the opposite claim: **country in minor is one thing**, and it is the old modal
 * ballad — the tune that came over with the Scots-Irish, sat in the mountains for
 * two hundred years and turned up on a Bristol wax cylinder in 1927 with a body
 * count in it. Aeolian, or dorian when the fiddle's drone puts a major IV under
 * it; a ♭VII where any other repertoire would write a V; and no leading tone
 * anywhere, because the tunes predate the convention that produced one.
 *
 * A honky-tonk shuffle in minor is that ballad played by a bar band, and an
 * alt-country song in minor is that ballad played by people who found it on a
 * reissue. Giving each of them a private minor table would assert that they had
 * each invented one, and none of them did. Seven styles do write their own minor
 * out: `murderballad` and `altcountry`, whose primary mode is minor and whose
 * `progressions` are therefore already the minor table, and `honkytonk`,
 * `westernswing`, `rockabilly`, `zydeco` and `outlaw`, which carry a private
 * `minorProgressions`. The difference is then legible.
 *
 * The leading tone is allowed back in on four of those — `honkytonk`,
 * `westernswing`, `rockabilly` and `zydeco` all write a V7 in minor — and it is
 * allowed back in because a bar band in 1955 in a minor key really did reach for
 * one; see those styles' own tables.
 */
const MINOR_CHORDS: Table = {
  intro: [
    { chords: ['i', 'VII', 'i', 'i'], weight: 4 },
    { chords: ['i', 'iv', 'i', 'i'], weight: 3 },
  ],
  verse: [
    { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
    { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'VII', 'VII'], weight: 5 },
    { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'i', 'i'], weight: 4 },
    { chords: ['i', 'i', 'III', 'III', 'VII', 'VII', 'i', 'i'], weight: 3 },
  ],
  chorus: [
    { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
    { chords: ['iv', 'iv', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 4 },
    { chords: ['III', 'III', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
  ],
  bridge: [
    { chords: ['iv', 'iv', 'III', 'III', 'VII', 'VII', 'i', 'i'], weight: 3 },
    { chords: ['VI', 'VI', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 3 },
  ],
  outro: [
    { chords: ['VII', 'VII', 'i', 'i'], weight: 4 },
    { chords: ['iv', 'VII', 'i', 'i'], weight: 2 },
  ],
};

/**
 * Melody cells, shared, because the *rhythm* of a country tune is one rhythm.
 *
 * It is the rhythm of a spoken line of verse, which is what these tunes are:
 * quarter notes with a dotted-eighth lean where the stress falls, a pickup into
 * the bar, and a long note at the end of every phrase for the words to land on.
 * Nothing in the file is syncopated in the sense the other genres here mean —
 * `melody.syncopation` runs 0.1 to 0.3 against reggae's 0.65 — because a country
 * melody's job is to make four lines of a stanza scan, and a line that crossed
 * the barline would take the rhyme with it.
 */
const PLAIN_CELLS = [
  { cell: [4, 4, 4, 4], weight: 5 },
  { cell: [4, 4, 8], weight: 5 },
  { cell: [6, 2, 4, 4], weight: 4 },
  { cell: [-4, 4, 4, 4], weight: 4 },
  { cell: [8, 4, 4], weight: 3 },
  { cell: [2, 2, 4, 8], weight: 3 },
  { cell: [-2, 2, 4, 8], weight: 3 },
  { cell: [12, 4], weight: 2 },
  { cell: [6, 2, 8], weight: 2 },
];

const PLAIN_CADENCES = [
  { cell: [16], weight: 5 },
  { cell: [8, 8], weight: 3 },
  { cell: [-4, 12], weight: 3 },
  { cell: [12, 4], weight: 2 },
];

/** The same idea in three, where the long note takes the whole bar. */
const WALTZ_CELLS = [
  { cell: [4, 4, 4], weight: 5 },
  { cell: [8, 4], weight: 4 },
  { cell: [-4, 4, 4], weight: 4 },
  { cell: [4, 8], weight: 3 },
  { cell: [2, 2, 4, 4], weight: 3 },
  { cell: [12], weight: 2 },
];

const WALTZ_CADENCES = [
  { cell: [12], weight: 5 },
  { cell: [8, 4], weight: 3 },
  { cell: [-4, 8], weight: 2 },
];

// ---------------------------------------------------------------------------
// The string band: no drummer, and no amplifier either
// ---------------------------------------------------------------------------

/**
 * BREAKDOWN — the old-time fiddle tune, and the oldest thing in the file.
 *
 * A fiddle and a banjo playing the same tune at the same time for as long as
 * anybody wants to dance, with a guitar chucking behind them. There is no singer,
 * no break, no arrangement and nothing that could be called a chorus — a
 * breakdown is one strain and then the other strain and then the first one again,
 * for six minutes.
 *
 * The two things that make it sound like 1928 rather than like fast bluegrass are
 * both here. **It is modal**: the tuning is open, the drone strings ring, and a
 * dominant chord would ask the fiddler to stop a string the instrument is
 * currently sounding — hence `MODAL_CHORDS` and a ♭VII where anything later would
 * put a V. And **it swings very slightly**, 0.12, which is not a shuffle: it is
 * the long-short of an old-time bow, where the down-bow takes marginally more of
 * the beat than the up-bow because it is the one carrying the accent. At 0.12 it
 * is barely a number and it is the whole difference between this and `bluegrass`
 * two entries down.
 *
 * No drums, no pad, no brass and no fills. `drumFills: false` is the field
 * ambient argues at length and the argument transfers exactly: a genre with no kit
 * that is nonetheless allowed a fill will produce one, and a tom roll at the end
 * of a fiddle tune is a stranger walking into the room.
 */
const breakdown: Style = {
  id: 'breakdown',
  label: 'Old-time breakdown',
  description:
    'Fiddle and banjo playing one tune together over a chucked guitar, modal, no drums and no singer. Two strains, and as many times round as the floor wants.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [116, 142],
  swing: 0.12,
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0,
  excludeLayers: ['drums', 'pad', 'brass'],
  drumFills: false,
  boxDrums: false,
  shots: COUNTRY_SHOTS,
  progressions: MODAL_CHORDS,
  minorProgressions: MINOR_CHORDS,
  melodyCells: [
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 2, 2, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [-2, 2, 4, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [8, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  bass: [boomChuck(6), boomRun(4)],
  comp: [chuck(6), roll(5), chop(3)],
  drums: [],
  melody: { leap: 0.3, ornament: 0.3, span: 12, sequence: 0.62, syncopation: 0.15 },
  /**
   * The second strain — which `Genre.voice` cut for a reason about singing, and
   * there is nobody singing here.
   *
   * That table puts `descending-sequence` at 1.5 against the 2.86 this style's
   * own `melody.sequence: 0.62` derives, and gives the reason: across this file
   * the number means restatement rather than a walk down the scale, because
   * *"`duet` says so at the field: a `sequence` of 0.68 because a duet's whole
   * shape is the same phrase four times with different words."* That is a claim
   * about **words**, and the header above is *"There is no singer, no break, no
   * arrangement and nothing that could be called a chorus"*. The same genre
   * comment names the exception it had no tier to say it in — *"A real descent
   * is the second strain of a fiddle tune"* — and this is the fiddle tune: one
   * strain and then the other strain and then the first one again.
   *
   * Restoring the derived reading is audible rather than notional. The
   * archetype's `peakAt` is [0.08, 0.25] — it opens at the top and spends the
   * section falling away from it — and over twenty songs against the same twenty
   * seeds, the share of sections whose high point lands in their first third goes
   * from 22% to 27%. The interval mix does not move with it (75/16/10 stepwise,
   * thirds, wider, both ways), which is right: a strain that descends is a shape
   * rather than a wider one.
   */
  voice: { archetypes: [['descending-sequence', 2.9]] },
};

/**
 * BLUEGRASS — 1946, and the only style here that was invented on a specific date
 * by a specific man.
 *
 * Bill Monroe's band with Earl Scruggs in it, and what makes it a different music
 * from the string band it came out of is speed and *turn-taking*. Nobody had
 * played this repertoire at 175 before, and nobody had passed the tune round the
 * band a break at a time — a breakdown is everybody playing the tune together and
 * bluegrass is one person playing it while four people accompany, which is a jazz
 * bandstand's arrangement executed by people who would have been offended by the
 * comparison. The genre's `SoloProfile` in `index.ts` is where that lives.
 *
 * Straight, at 0.
 *
 * Nobody has ever shuffled at 180 and it is worth saying why rather than treating
 * it as arithmetic: a shuffle's character is the *gap* between the two halves of
 * the beat, and at this tempo the beat is 340 ms, so the gap is under 60 ms and
 * has stopped being a lilt and become a flam. Bluegrass replaced it with something
 * else entirely — the chop on two and four, which puts a hard edge on the
 * backbeat where the shuffle used to put a soft one. There is no drummer, and
 * there does not need to be.
 */
const bluegrass: Style = {
  id: 'bluegrass',
  label: 'Bluegrass',
  description:
    'The 1946 band at speed: banjo rolls, a mandolin chop on two and four, a chucked guitar for a drummer, and the tune handed round a break at a time.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [150, 192],
  swing: 0,
  modeWeights: { minor: 0.22, major: 0.78 },
  relativeMajorChorus: 0,
  excludeLayers: ['drums', 'pad'],
  drumFills: false,
  boxDrums: false,
  shots: COUNTRY_SHOTS,
  progressions: THREE_CHORD,
  minorProgressions: MINOR_CHORDS,
  melodyCells: PLAIN_CELLS,
  cadenceCells: PLAIN_CADENCES,
  bass: [boomChuck(6), boomRun(5)],
  comp: [roll(7), chop(6), chuck(4), reverseRoll(3)],
  drums: [],
  melody: { leap: 0.32, ornament: 0.28, span: 14, sequence: 0.6, syncopation: 0.18 },
  /**
   * The chorus trio, and `kinds` is the whole of what makes it that.
   *
   * `arrangement.harmony: 7` in `index.ts` names "a bluegrass chorus" as one of
   * the four traditions the weight was written for, and here it is: a verse is one
   * person telling it and the tenor arrives on the first word of the chorus. That
   * is the one thing separating this from `duet` below, which never stops.
   *
   * Above three times in four, which is what *high lonesome* is a description of —
   * a tenor over a lead already singing at the top of his range, which is why a
   * band capos up to B and why `keys` in `index.ts` has a B in it at all. The
   * fourth is the baritone, and it is there because a trio has both parts and this
   * field holds one at a time: `harmoniseWith` draws once for the whole statement,
   * so the weights are a share of choruses rather than of notes.
   *
   * See `arrangement` for why `+2` is a fourth on four of the five pentatonic
   * degrees, and why that is the interval this repertoire actually has. 22% of
   * these songs are minor, where it is a genuine third.
   */
  harmony: { amount: 0.9, intervals: [[2, 6], [-2, 2]], on: 'vocal', kinds: ['chorus'] },
};

/**
 * BLUEGRASS WALTZ — the same band in three, and a genuinely different repertoire.
 *
 * "Kentucky Waltz", "Blue Moon of Kentucky" before Elvis got at it, half of what
 * a bluegrass band plays when it slows down. It is a separate style rather than a
 * metre setting on the one above because the *figures* change: the chop moves off
 * the backbeat, which in three does not exist, and lands on two and three, and
 * the banjo cannot roll — eight notes do not fit in a bar of twelve sixteenths in
 * any grouping the right hand has. What a banjo player does in a waltz is
 * arpeggiate slowly, which is `roll`'s ladder at a third of the events.
 */
const bluegrasswaltz: Style = {
  id: 'bluegrasswaltz',
  label: 'Bluegrass waltz',
  description:
    'The same band in three: the chop on two and three, the banjo arpeggiating rather than rolling, and a tune with a great deal of time in it.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [138, 174],
  swing: 0,
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0,
  excludeLayers: ['drums', 'pad'],
  drumFills: false,
  boxDrums: false,
  shots: WALTZ_SHOTS,
  progressions: THREE_CHORD,
  minorProgressions: MINOR_CHORDS,
  melodyCells: WALTZ_CELLS,
  cadenceCells: WALTZ_CADENCES,
  bass: [waltzBoom(6), {
    name: 'waltz-walk', weight: 3, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 },
      { at: 8, dur: 4, tone: 'approach', vel: 0.78 },
    ],
  }],
  comp: [waltzChuck(6), {
    name: 'waltz-roll', weight: 4, voices: 3, arpeggio: true, arpDirection: 'up',
    hits: [
      { at: 0, dur: 2, vel: 0.9 }, { at: 2, dur: 2, vel: 0.66 },
      { at: 4, dur: 2, vel: 0.8 }, { at: 6, dur: 2, vel: 0.64 },
      { at: 8, dur: 2, vel: 0.78 }, { at: 10, dur: 2, vel: 0.64 },
    ],
  }, {
    name: 'waltz-chop', weight: 3, voices: 3, hits: [
      { at: 4, dur: 1, vel: 0.98 },
      { at: 8, dur: 1, vel: 0.92 },
    ],
  }],
  drums: [],
  melody: { leap: 0.26, ornament: 0.25, span: 12, sequence: 0.58, syncopation: 0.12 },
  /**
   * The same five people, so the same trio. The header above lists what changes
   * from `bluegrass` and it is the *figures* — the chop moves, the banjo stops
   * rolling — which leaves the singing exactly where it was. 35% minor here
   * against bluegrass's 22%, so a third more of these choruses get the seven-note
   * ladder and a genuine third out of `+2`.
   */
  harmony: { amount: 0.9, intervals: [[2, 6], [-2, 2]], on: 'vocal', kinds: ['chorus'] },
};

/**
 * GOSPEL QUARTET — four voices round one microphone, and the pad is three of them.
 *
 * The shape-note tradition and the Chuvalo-to-Statesmen line of southern gospel
 * quartets: a lead, a tenor above him, a baritone under him and a bass under
 * everybody, singing the same words on the same syllables. `requireLayers: ['pad']`
 * is the only appearance of that field in this genre and it is not a texture
 * preference — the other three voices are not accompaniment that gets added when
 * there is room, they are what the style *is*, which is the same sentence ambient
 * writes about its pad from the opposite end of the catalogue.
 *
 * `swing: 0.18`. A quartet lives on a triplet subdivision that nobody writes
 * down: the pianist's left hand rocks, the words fall long-short, and the whole
 * thing is a shuffle at half the honky-tonk's depth. The piano is the only
 * instrument here that matters and it plays stride, because there is no bass
 * player — see `twoHanded`.
 */
const gospel: Style = {
  id: 'gospel',
  label: 'Gospel quartet',
  description:
    'Four voices and a piano: a lead with a tenor over him, a rocking left hand for a bass, and a triplet under every word.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [80, 108],
  swing: 0.18,
  modeWeights: { minor: 0.12, major: 0.88 },
  relativeMajorChorus: 0,
  excludeLayers: ['drums'],
  requireLayers: ['pad'],
  drumFills: false,
  boxDrums: false,
  shots: COUNTRY_SHOTS,
  progressions: THREE_CHORD,
  minorProgressions: MINOR_CHORDS,
  melodyCells: PLAIN_CELLS,
  cadenceCells: PLAIN_CADENCES,
  bass: [boomChuck(5), twoBeat(4), boomRun(3)],
  comp: [chuck(5), {
    name: 'gospel-rock', weight: 5, voices: 4, hits: [
      { at: 0, dur: 3, vel: 0.7 },
      { at: 4, dur: 3, vel: 0.9 },
      { at: 8, dur: 3, vel: 0.72 },
      { at: 12, dur: 3, vel: 0.88 },
    ],
  }],
  drums: [],
  /**
   * The piano is the band, so the piano gets both hands.
   *
   * `stride` at the top for the reason `LeftHandMode` gives: there is nobody else
   * to state the root, and a gospel pianist's left hand alternating a bass note
   * with a chord *is* the rhythm section. `block` is the other real thing that
   * hand does — the two hands locking together under the last line of a chorus,
   * which is the single loudest gesture the idiom has. No `unison` and no
   * `ostinato`: a quartet pianist is accompanying four singers, not playing a
   * concerto or a vamp.
   */
  twoHanded: {
    instruments: [['piano', 8], ['epiano1', 2]],
    density: 0.8,
    modes: [['stride', 6], ['block', 4], ['answer', 2]],
  },
  melody: { leap: 0.24, ornament: 0.3, span: 11, sequence: 0.62, syncopation: 0.2 },
  /**
   * The tenor over the lead, which is the one of the four voices that sings the
   * lead's words on the lead's syllables.
   *
   * `requireLayers: ['pad']` above already stands for the baritone and the bass:
   * they are a texture under the singer and the pad is the honest place for them.
   * What the pad cannot be is the tenor, because the tenor is *the same sentence
   * an interval up* — which is exactly and only what `generateVocalStack` writes.
   * No `kinds`: four men round one microphone do not stop for the verse.
   *
   * `+3` at a quarter of the draws is the one place in this file where the open
   * interval is not a compromise but the tradition. The shape-note book named in
   * the header is dispersed harmony — fourths and fifths where a hymnal would put
   * thirds — and over the major pentatonic `+3` is a fifth on four degrees of
   * five. 0.85 rather than 1 because a quartet lead does take a verse alone.
   */
  harmony: { amount: 0.85, intervals: [[2, 6], [3, 2]], on: 'vocal' },
};

/**
 * COWBOY SONG — the western half of "country and western", and the half nobody
 * means by the phrase any more.
 *
 * The Sons of the Pioneers, Gene Autry, "Cool Water", "Tumbling Tumbleweeds". It
 * is not a work song and it was never sung on a horse: it is close-harmony parlour
 * singing about a landscape, written in Hollywood, and its whole musical character
 * is *space* — a slow gait, a wide melody, long held notes and a chord that
 * changes about twice as often as the tune does.
 *
 * `swing: 0.16` is the lope, and it is the one place in the file where the swing
 * is depicting something. The gait of these records is a walking horse, which is a
 * four-beat that leans, and the number is small because a shuffle would be a trot.
 *
 * `melody.span: 16` is the widest in the genre by a distance. Everything else here
 * is a spoken line of verse set to notes; this one is a yodel with a song attached
 * to it, and the leap into the head voice is the point.
 */
const cowboy: Style = {
  id: 'cowboy',
  label: 'Cowboy song',
  description:
    'The western half: close harmony, a walking-horse gait, a very wide tune and a great deal of sky. Written in Hollywood and none the worse for it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [88, 116],
  swing: 0.16,
  modeWeights: { minor: 0.28, major: 0.72 },
  relativeMajorChorus: 0,
  excludeLayers: ['drums'],
  drumFills: false,
  boxDrums: false,
  shots: COUNTRY_SHOTS,
  progressions: THREE_CHORD,
  minorProgressions: MINOR_CHORDS,
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [6, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [twoBeat(6), boomChuck(4)],
  comp: [chuck(5), {
    name: 'open-strum', weight: 5, voices: 5, hits: [
      { at: 0, dur: 4, vel: 0.8 },
      { at: 4, dur: 2, vel: 0.62 },
      { at: 8, dur: 4, vel: 0.78 },
      { at: 12, dur: 2, vel: 0.6 },
    ],
  }],
  drums: [],
  melody: { leap: 0.42, ornament: 0.22, span: 16, sequence: 0.5, syncopation: 0.1 },
  /**
   * The one melody in this genre that is not a line of verse, said where
   * `Genre.voice` assumes it is.
   *
   * That table weights `chant` at 3.5 for all twenty-four styles and argues it
   * from a sung sentence — *"'I hear that lonesome whistle blow' is six syllables
   * on one pitch and then a fall"*. On this style that is 22% of the archetype
   * draws in place of the 0.57 its own density of 2.32 derives, which would be
   * 5%. And the header above is the denial of exactly that sentence:
   * **"Everything else here is a spoken line of verse set to notes; this one is a
   * yodel with a song attached to it."** The archetype's gloss is *one note
   * repeated with a tail — the hook is the rhythm*, and a yodel is neither half
   * of that.
   *
   * Back to what this style's own density asks for, and nothing else moves. Over
   * twenty songs against the same twenty seeds it shifts four points of adjacent
   * intervals out of steps and into thirds — 61%/23% to 57%/25% — and takes the
   * section's high point out of the last third in one section in twenty more.
   *
   * **`wide-interval` belongs here by the prose and is not written, because it
   * buys nothing.** The header calls the leap into the head voice the point,
   * `melody.leap: 0.42` is the highest in the file, and `Genre.voice` refused a
   * genre weight for this archetype expressly so as not to spend it — so 2.6 → 4
   * looked like the other half of this delta. Measured on the same paired seeds,
   * intervals wider than a third went 17% to 17%. The cap is the scale and not
   * the appetite: `scaleForChord` at the genre hands this style the major
   * pentatonic, where one scale step is already 2 or 3 semitones and two steps is
   * a fourth or a fifth, so how wide a leap comes out is a property of the five
   * notes. It is the arithmetic `index.ts` uses to hold `ops.expand` at 0.6,
   * reaching the archetype table this time.
   */
  voice: { archetypes: [['chant', 0.6]] },
  /**
   * Close harmony, and it goes **below**, which `melody.span: 16` decides rather
   * than taste.
   *
   * A western trio puts a tenor over the lead and a baritone under him and this
   * field holds one of the two. The span above is the widest in the genre by a
   * distance and the header says why — the leap into the head voice is the point —
   * so the lead is already at the ceiling of what a person can sing, and a second
   * voice a fourth over the top of that is nobody's part. `generateVocalStack`
   * would not even refuse it: the stack is written off the folded line and is
   * never folded again, and an out-of-range note is sung rather than dropped,
   * because both singers being on the same syllable outranks either being
   * comfortable. Below is where the room is.
   *
   * `-2` is a fourth under four degrees of five and a major third under the third;
   * `-3` is a fifth under, at a quarter, which is the parlour trio opening out on
   * a held note. 0.9 because these records are close harmony from the top.
   */
  harmony: { amount: 0.9, intervals: [[-2, 6], [-3, 2]], on: 'vocal' },
};

/**
 * MURDER BALLAD — one of the two styles here whose primary mode is minor
 * (`altcountry` is the other, and says so), and the reason `MINOR_CHORDS` exists
 * at all.
 *
 * "Pretty Polly", "Knoxville Girl", "Banks of the Ohio", "Little Sadie". These are
 * the tunes that came over from Scotland and Ireland, stopped in the mountains for
 * two centuries and were recorded in 1927 by people who had learned them from
 * someone who had learned them from someone. They are modal, they are slow, they
 * are strophic — the same eight bars for eleven verses, with the story doing all
 * the work — and there is nothing in them that a dance band would recognise as a
 * cadence.
 *
 * It writes its own minor table, which is the point of it. `MINOR_CHORDS` is what
 * happens when the seventeen styles that take it borrow this one's harmony; this
 * one has *less* than that, because a real modal ballad frequently has two chords in it
 * and sometimes has one. `hook: 'earworm'` is not a pop setting here — it is the
 * literal structure of a strophic ballad, where every verse is the same tune and
 * the whole form depends on you knowing that by verse three.
 */
const murderballad: Style = {
  id: 'murderballad',
  label: 'Murder ballad',
  description:
    'Two chords, eleven verses and a body in the river. Modal, strophic, unaccompanied except for a guitar, and the same tune every time on purpose.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [62, 84],
  swing: 0,
  modeWeights: { minor: 0.88, major: 0.12 },
  relativeMajorChorus: 0,
  excludeLayers: ['drums', 'brass', 'pad'],
  drumFills: false,
  boxDrums: false,
  hook: 'earworm',
  shots: COUNTRY_SHOTS,
  /**
   * Two chords, and the second one is not a dominant.
   *
   * The tables in `MINOR_CHORDS` are this repertoire generalised; these are it
   * unsoftened. Eight bars of i with one bar of ♭VII in them is a real and common
   * shape, and a table that could not produce it would have smoothed the subject
   * off.
   */
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 5, note: 'One chord for four bars and one borrowed one to lean on. The story is the harmony' },
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'VII', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VII', 'VII', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['VII', 'i', 'i', 'i'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 4 },
    ],
    outro: [{ chords: ['IV', 'I', 'I', 'I'], weight: 3 }],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [twoBeat(6), boomChuck(3)],
  comp: [chuck(4), {
    name: 'ballad-strum', weight: 6, voices: 5, hits: [
      { at: 0, dur: 6, vel: 0.76 },
      { at: 8, dur: 6, vel: 0.7 },
    ],
  }],
  drums: [],
  melody: { leap: 0.2, ornament: 0.3, span: 10, sequence: 0.7, syncopation: 0.08 },
};

/**
 * NEWGRASS — bluegrass that went to college, 1975 onward.
 *
 * Sam Bush, the New Grass Revival, Tony Rice: the same five instruments and the
 * same tempi, with the harmony of the previous forty years arriving all at once. A
 * newgrass tune has a ii and a vi in it and sometimes a major seventh, its breaks
 * are long, and it has borrowed the idea that a chorus can be a set of changes
 * rather than a chord chart.
 *
 * It is here rather than folded into `bluegrass` because of `NASHVILLE_CHORDS` —
 * the one thing that separates the two is exactly the two chords that table adds,
 * and if that were not worth a style then neither is the Nashville sound. Still no
 * kit: newgrass added everything except a drummer.
 */
const newgrass: Style = {
  id: 'newgrass',
  label: 'Newgrass',
  description:
    'The same five instruments and forty years of extra harmony: a ii, a vi, long breaks, and still nobody behind a drum kit.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [128, 168],
  swing: 0,
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0,
  excludeLayers: ['drums'],
  drumFills: false,
  boxDrums: false,
  hook: 'loose',
  shots: COUNTRY_SHOTS,
  progressions: NASHVILLE_CHORDS,
  minorProgressions: MINOR_CHORDS,
  melodyCells: PLAIN_CELLS,
  cadenceCells: PLAIN_CADENCES,
  bass: [boomRun(6), boomChuck(4), {
    name: 'newgrass-walk', weight: 3, walking: true, hits: [
      { at: 0, dur: 4, tone: 'root' },
      { at: 4, dur: 4, tone: 'third' },
      { at: 8, dur: 4, tone: 'fifth' },
      { at: 12, dur: 4, tone: 'approach' },
    ],
  }],
  comp: [roll(6), chop(6), reverseRoll(4), chuck(3)],
  drums: [],
  melody: { leap: 0.36, ornament: 0.25, span: 15, sequence: 0.45, syncopation: 0.3 },
};

// ---------------------------------------------------------------------------
// The honky-tonk: an amplifier, a bar, and a drummer at last
// ---------------------------------------------------------------------------

/**
 * HONKY-TONK SHUFFLE — Hank Williams, and the centre of gravity of the whole genre.
 *
 * A bar band in 1953: an amplified steel, a fiddle, a rhythm guitar, an upright
 * bass and a drummer playing brushes because the room is thirty feet across and
 * has a fight in it. The shuffle is the point and 0.33 is the largest swing number
 * in this project outside jazz — a full triplet, with the second eighth of every
 * beat sitting where the third of a triplet would.
 *
 * **This is the one minor table in the file with a leading tone in it.** Everything
 * else here writes `VII` where a dance band would write `V`, and states at
 * `MINOR_CHORDS` why. A honky-tonk band in a minor key is not playing a modal
 * ballad, it is playing a blues-adjacent bar-room number with a walking bass and a
 * fiddle in it, and those men had all played dance dates: the V7 is theirs by
 * right and the raised seventh comes with it. `preparedModulation` in `index.ts`
 * is the same claim at the genre level.
 */
const honkytonk: Style = {
  id: 'honkytonk',
  label: 'Honky-tonk shuffle',
  description:
    'A full triplet shuffle at bar-room tempo: amplified steel, a fiddle, brushes, a walking bass, and a real dominant even in minor.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [104, 138],
  swing: 0.33,
  modeWeights: { minor: 0.2, major: 0.8 },
  relativeMajorChorus: 0,
  boxDrums: false,
  shots: COUNTRY_SHOTS,
  progressions: THREE_CHORD,
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'V7', 'V7'], weight: 5, note: 'The V7 the rest of the file refuses. These men played dance dates and the leading tone is theirs by right' },
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'V7', 'V7'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'V7', 'i', 'iv', 'V7', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'V7', 'V7', 'i', 'i'], weight: 4 },
    ],
    bridge: [
      { chords: ['VI', 'VI', 'iv', 'iv', 'V7', 'V7', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['iv', 'V7', 'i', 'i'], weight: 4 },
    ],
  },
  melodyCells: PLAIN_CELLS,
  cadenceCells: PLAIN_CADENCES,
  bass: [boomChuck(6), boomRun(4), {
    name: 'shuffle-walk', weight: 4, walking: true, hits: [
      { at: 0, dur: 4, tone: 'root' },
      { at: 4, dur: 4, tone: 'third' },
      { at: 8, dur: 4, tone: 'fifth' },
      { at: 12, dur: 4, tone: 'approach' },
    ],
  }],
  comp: [chuck(7), {
    name: 'shuffle-comp', weight: 4, voices: 4, hits: [
      { at: 2, dur: 2, vel: 0.66 },
      { at: 4, dur: 2, vel: 0.94 },
      { at: 10, dur: 2, vel: 0.64 },
      { at: 12, dur: 2, vel: 0.9 },
    ],
  }],
  drums: [shuffleKit(6), brushKit(4), twoBeatKit(3)],
  /**
   * The bar-room piano, when there is one.
   *
   * No `instruments` list, and the omission is the statement `TwoHandedKeys`
   * documents: a honky-tonk band is not defined by having a piano the way a gospel
   * quartet is, and seizing the palette here would mean a genre of piano shuffles
   * and nothing else. What this says is the weaker and much truer thing — on the
   * nights the era hands this band a piano, that piano plays its own bass, because
   * that is what the instrument does in this room.
   */
  twoHanded: {
    density: 0.7,
    modes: [['stride', 5], ['answer', 4], ['block', 2]],
  },
  melody: { leap: 0.28, ornament: 0.32, span: 12, sequence: 0.6, syncopation: 0.22 },
};

/**
 * TWO-STEP — the Texas dance-hall floor, and the reason half this repertoire is at
 * this tempo.
 *
 * Quick-quick-slow-slow, counter-clockwise round a wooden floor the size of a
 * barn, and everything about the music is subordinate to that: straight eighths so
 * the feet have somewhere to be, a two-beat bass so the downbeat is unmistakable,
 * and a tempo band ten beats wide because a dance hall that changes speed loses the
 * floor. `swing: 0` and it is the earliest zero in the file — a two-step predates
 * Bakersfield by twenty years and never shuffled, because a shuffle and a
 * quick-quick-slow are two different counts and a floor cannot hold both.
 */
const twostep: Style = {
  id: 'twostep',
  label: 'Two-step',
  description:
    'Quick-quick-slow-slow round a wooden floor: straight eighths, a two-beat bass, and a tempo the hall can rely on.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [126, 152],
  swing: 0,
  modeWeights: { minor: 0.18, major: 0.82 },
  relativeMajorChorus: 0,
  boxDrums: false,
  shots: COUNTRY_SHOTS,
  progressions: THREE_CHORD,
  minorProgressions: MINOR_CHORDS,
  melodyCells: PLAIN_CELLS,
  cadenceCells: PLAIN_CADENCES,
  bass: [twoBeat(6), boomChuck(5), boomRun(3)],
  comp: [chuck(7), {
    name: 'dancehall-eighths', weight: 4, voices: 4, hits: [
      { at: 0, dur: 2, vel: 0.62 }, { at: 4, dur: 2, vel: 0.92 },
      { at: 8, dur: 2, vel: 0.66 }, { at: 12, dur: 2, vel: 0.9 },
    ],
  }],
  drums: [twoBeatKit(7), brushKit(3)],
  melody: { leap: 0.28, ornament: 0.2, span: 12, sequence: 0.62, syncopation: 0.15 },
};

/**
 * COUNTRY WALTZ — "Tennessee Waltz", and the best-selling record in the file.
 *
 * Three to the bar, slow enough to hold somebody, and harmonically the plainest
 * thing here: I, IV, V and a vi if the writer is feeling ambitious. Its whole
 * emotional apparatus is the metre — a waltz in this repertoire is *automatically*
 * about regret, in a way nothing else is, and neither the tempo nor the chords are
 * doing it.
 *
 * `swing: 0.1`. A country waltz is not straight and it is not a shuffle: the
 * second beat arrives fractionally late because the dancers are turning, and 0.1
 * is that and nothing more. `boxDrums: false` for the reason `valssi` states — the
 * box has a Waltz button and the button is a metronome in three.
 */
const waltz: Style = {
  id: 'waltz',
  label: 'Country waltz',
  description:
    'Three to the bar, slow enough to hold somebody, and three chords. The metre is doing all the emotional work and knows it.',
  beatsPerBar: 3,
  beatUnit: 4,
  bpm: [128, 168],
  swing: 0.1,
  modeWeights: { minor: 0.32, major: 0.68 },
  relativeMajorChorus: 0,
  boxDrums: false,
  shots: WALTZ_SHOTS,
  progressions: THREE_CHORD,
  minorProgressions: MINOR_CHORDS,
  melodyCells: WALTZ_CELLS,
  cadenceCells: WALTZ_CADENCES,
  bass: [waltzBoom(6), {
    name: 'waltz-one-five', weight: 3, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 },
      { at: 8, dur: 4, tone: 'fifth', vel: 0.72 },
    ],
  }],
  comp: [waltzChuck(7), {
    name: 'waltz-held', weight: 3, voices: 5, hits: [{ at: 0, dur: 12, vel: 0.6 }],
  }],
  drums: [waltzKit(6), {
    name: 'waltz-brush', weight: 3, voices: { bd: [0], rim: [4, 8], sh: [0, 2, 4, 6, 8, 10] },
  }],
  melody: { leap: 0.26, ornament: 0.3, span: 12, sequence: 0.55, syncopation: 0.1 },
};

/**
 * WESTERN SWING — Bob Wills, and the one style here that is a jazz band.
 *
 * A Texas dance orchestra with fiddles where the saxophones would be: a rhythm
 * section that swings properly, four-part fiddle writing, an amplified steel taking
 * choruses, and a repertoire that is half fiddle tunes and half Tin Pan Alley.
 * Wills' band had a horn section for most of the thirties and it is the only place
 * in this genre where the `brass` layer is actually brass.
 *
 * **It overrides `scaleForChord`, and it is the only style here that does so
 * upward.** The genre's answer is the major pentatonic of the key, held across the
 * changes — which is right for a music with three chords in it and flatly wrong for
 * a music whose verses run round the circle of fifths through `VI7` and `II7`. A
 * pentatonic line over a `VI7` is missing the chord's third *and* its seventh,
 * which in every other style here is the correct restraint and here is simply not
 * hearing the harmony. So this one follows the chord, jazz-fashion, and that
 * override is the whole content of `Style.scaleForChord`'s doc comment: a style
 * making a claim about itself rather than about its genre.
 */
const westernswing: Style = {
  id: 'westernswing',
  label: 'Western swing',
  description:
    'A Texas dance orchestra with fiddles where the saxophones go: proper swing, a circle-of-fifths verse, and a melody that follows the chord rather than the key.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [132, 172],
  swing: 0.3,
  modeWeights: { minor: 0.2, major: 0.8 },
  relativeMajorChorus: 0,
  boxDrums: false,
  hook: 'loose',
  shots: COUNTRY_SHOTS,
  /**
   * The ragtime circle, which is what a 1938 dance band means by a verse.
   *
   * `III7 → VI7 → II7 → V7` is four applied dominants in a row walking home by
   * fifths, and it is the single most-played eight bars in American popular music
   * between the wars. Nothing else in this genre has it and nothing else in this
   * genre wants it.
   */
  progressions: {
    intro: [
      { chords: ['I', 'VI7', 'II7', 'V7'], weight: 4 },
    ],
    verse: [
      { chords: ['I', 'I', 'III7', 'III7', 'VI7', 'VI7', 'II7', 'V7'], weight: 5, note: 'The circle. Four applied dominants walking home by fifths, and the fiddles read it off a chart' },
      { chords: ['I', 'I', 'VI7', 'VI7', 'II7', 'II7', 'V7', 'V7'], weight: 5 },
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'VI7', 'II7', 'V7'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'II7', 'II7', 'V7', 'V7'], weight: 5 },
      { chords: ['I', 'I7', 'IV', 'IV', 'I', 'V7', 'I', 'I'], weight: 4, note: 'The I7 in bar two, which is a blues turning into a dance band mid-phrase' },
      { chords: ['I', 'vi', 'ii', 'V7', 'I', 'vi', 'II7', 'V7'], weight: 3 },
    ],
    bridge: [
      { chords: ['III7', 'III7', 'VI7', 'VI7', 'II7', 'II7', 'V7', 'V7'], weight: 4 },
    ],
    outro: [
      { chords: ['II7', 'V7', 'I', 'I'], weight: 4 },
      { chords: ['IV', 'V7', 'I', 'I'], weight: 2 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'V7', 'V7'], weight: 5 },
      { chords: ['i', 'i', 'VI7', 'VI7', 'II7', 'II7', 'V7', 'V7'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'V7', 'V7', 'i', 'i'], weight: 5 },
      { chords: ['III', 'III', 'VI7', 'VI7', 'ii%7', 'ii%7', 'V7', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['ii%7', 'V7', 'i', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [2, 2, 4, 8], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 4, 4], weight: 4 },
    { cell: [-2, 2, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [{
    name: 'walking', weight: 7, walking: true, hits: [
      { at: 0, dur: 4, tone: 'root' },
      { at: 4, dur: 4, tone: 'third' },
      { at: 8, dur: 4, tone: 'fifth' },
      { at: 12, dur: 4, tone: 'approach' },
    ],
  }, boomChuck(4), twoBeat(2)],
  comp: [chuck(6), {
    name: 'four-to-the-bar', weight: 6, voices: 4, hits: [
      { at: 0, dur: 3, vel: 0.72 }, { at: 4, dur: 3, vel: 0.86 },
      { at: 8, dur: 3, vel: 0.74 }, { at: 12, dur: 3, vel: 0.84 },
    ],
  }],
  drums: [shuffleKit(6), {
    name: 'swing-ride', weight: 5, voices: {
      bd: [0, 8],
      sd: [4, 12],
      rd: [0, 2, 4, 6, 8, 10, 12, 14],
    },
  }, brushKit(3)],
  twoHanded: {
    density: 0.65,
    modes: [['stride', 4], ['answer', 4], ['block', 3]],
  },
  /** See the paragraph above: this band reads charts, so this band follows them. */
  scaleForChord: (tonic, mode, chord) => {
    switch (chord.quality) {
      case 'dom7': case 'dom9': case 'dom13':
        return makeScale(chord.root, 'mixolydian');
      case 'min7': case 'min9': case 'min6': case 'min':
        return makeScale(chord.root, 'dorian');
      case 'halfdim7':
        return makeScale(chord.root, 'locrian');
      default:
        return makeScale(tonic, mode === 'minor' ? 'minor' : 'major');
    }
  },
  melody: { leap: 0.4, ornament: 0.28, span: 15, sequence: 0.42, syncopation: 0.35 },
};

/**
 * TRAIN SONG — the boom-chicka-boom, and one of the two or three most recognisable
 * rhythms anybody has ever made out of nothing.
 *
 * Luther Perkins damping the bass strings of a Telecaster with the heel of his
 * hand and playing quarter notes, W.S. Holland running brushes on a snare head,
 * and a strip of paper woven through the strings of the rhythm guitar to make it
 * click. There is no bass player on the early records at all — the low string of
 * the guitar is the bass — and the whole texture is four instruments imitating one
 * machine.
 *
 * Straight, at exactly zero, and this is the style where that is least negotiable.
 * A swung train beat is a horse. The sixteenths in `trainKit` are the brushes and
 * they are all the same weight; what makes it move is that nothing in the bar
 * changes, which is the point of a train.
 */
const trainsong: Style = {
  id: 'trainsong',
  label: 'Train song',
  description:
    'Boom-chicka-boom: a damped Telecaster playing quarters, brushes running sixteenths, and paper woven through the rhythm guitar. Four men imitating one machine.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [112, 142],
  swing: 0,
  modeWeights: { minor: 0.25, major: 0.75 },
  relativeMajorChorus: 0,
  boxDrums: false,
  hook: 'earworm',
  shots: COUNTRY_SHOTS,
  progressions: THREE_CHORD,
  minorProgressions: MINOR_CHORDS,
  melodyCells: PLAIN_CELLS,
  cadenceCells: PLAIN_CADENCES,
  bass: [{
    name: 'damped-quarters', weight: 7, hits: [
      { at: 0, dur: 3, tone: 'root', vel: 1 },
      { at: 4, dur: 3, tone: 'root', vel: 0.8 },
      { at: 8, dur: 3, tone: 'fifth', vel: 0.9 },
      { at: 12, dur: 3, tone: 'fifth', vel: 0.78 },
    ],
  }, boomChuck(4)],
  comp: [{
    name: 'chicka', weight: 7, voices: 4, hits: [
      { at: 2, dur: 1, vel: 0.8 }, { at: 6, dur: 1, vel: 0.86 },
      { at: 10, dur: 1, vel: 0.8 }, { at: 14, dur: 1, vel: 0.86 },
    ],
  }, chuck(4)],
  drums: [trainKit(7), twoBeatKit(3)],
  melody: { leap: 0.24, ornament: 0.18, span: 11, sequence: 0.68, syncopation: 0.12 },
};

/**
 * ROCKABILLY — 1956, and the eighteen months this genre spent being the loudest
 * music in the world.
 *
 * A slapped upright bass, an echoed voice, a hollow-body guitar and no piano. It
 * belongs in a country catalogue rather than in a rock one because everybody who
 * made it had been playing honky-tonk the year before and went back to it the year
 * after — Sun Records was a country label, "Blue Moon of Kentucky" is a bluegrass
 * waltz played in four, and the harmony below is a twelve-bar blues, which is what
 * a honky-tonk band already had in the book.
 *
 * `swing: 0.24` — a boogie, not a shuffle. The difference is depth: at 0.33 the
 * second eighth is a triplet and the music walks, and at 0.24 it is somewhere
 * between a triplet and a straight eighth, which is what a slap bass at 170
 * produces because the hand cannot get back in time to be exact. `slapBass2` in
 * the era palette is the pop that goes with the thumb, and `chorusBars: 12` is
 * declared because the form genuinely is a blues.
 */
const rockabilly: Style = {
  id: 'rockabilly',
  label: 'Rockabilly',
  description:
    'A slapped upright, an echoed voice, a hollow-body and twelve bars. Eighteen months in which a country band was the loudest thing anybody had heard.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [152, 190],
  swing: 0.24,
  modeWeights: { minor: 0.15, major: 0.85 },
  relativeMajorChorus: 0,
  boxDrums: false,
  chorusBars: 12,
  shots: COUNTRY_SHOTS,
  progressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'V'], weight: 6, note: 'A twelve-bar, because a honky-tonk band in 1956 already had one in the book and nobody had to be taught it' },
      { chords: ['I', 'IV', 'I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'I'], weight: 6 },
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['V', 'IV', 'I', 'I'], weight: 4 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i', 'V7', 'iv', 'i', 'V7'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'V7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'V7', 'iv', 'i', 'i'], weight: 4 },
    ],
    outro: [{ chords: ['V7', 'iv', 'i', 'i'], weight: 3 }],
  },
  melodyCells: [
    { cell: [2, 2, 4, 8], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [-2, 2, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
    { cell: [8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [{
    name: 'slap', weight: 7, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 },
      { at: 4, dur: 2, tone: 'fifth', vel: 0.86 },
      { at: 8, dur: 2, tone: 'root', vel: 0.94 },
      { at: 12, dur: 2, tone: 'fifth', vel: 0.84 },
    ],
  }, boomChuck(4)],
  comp: [chuck(6), {
    name: 'boogie-comp', weight: 5, voices: 4, hits: [
      { at: 0, dur: 2, vel: 0.7 }, { at: 4, dur: 2, vel: 0.92 },
      { at: 8, dur: 2, vel: 0.72 }, { at: 12, dur: 2, vel: 0.9 },
    ],
  }],
  drums: [shuffleKit(6), {
    name: 'rockabilly-backbeat', weight: 5, voices: {
      bd: [0, 8],
      sd: [4, 12],
      rim: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    },
  }, brushKit(3)],
  /**
   * The blue third, over a major chord, for the first of four times in this file.
   *
   * The genre answers the chord-scale question with the *major* pentatonic of the
   * key — see `index.ts` — and that is right everywhere a country melody is a set
   * line of verse. It is wrong here. What a rockabilly singer does over a I chord
   * is bend the flat third against the guitar's major one, and the nearest thing
   * the scale catalogue has to that is the minor pentatonic of the key: five notes,
   * a ♭3, a ♭7, and no ♭5, which is the difference between this and the blues
   * scale and matters, because a country record does not use the flat fifth.
   *
   * `augmented-second` is disabled at the genre level and this is one of the two
   * scales that needs it: tonic to ♭3 is one scale step and three semitones, which
   * is the exact interval that rule vetoes, and it is the first move this scale
   * exists to make.
   */
  scaleForChord: (tonic) => makeScale(tonic, 'minorPentatonic'),
  melody: { leap: 0.34, ornament: 0.3, span: 14, sequence: 0.5, syncopation: 0.32 },
};

/**
 * CAJUN — south-west Louisiana, and the accordion is the band.
 *
 * A single-row diatonic accordion, a fiddle, a triangle and a guitar, singing in
 * French. It is in a country catalogue for the same reason mento is in a reggae
 * one: it is the neighbouring rural music that shares the repertoire's bones and
 * has kept an older version of them. A cajun two-step and a Texas two-step are the
 * same dance; what is different is that the accordion has ten buttons on it, which
 * is why `modeWeights` is 0.9 major — a one-row box in C plays in C and nowhere
 * else, and there is no minor to be had on it at all.
 *
 * `twoHanded` with `stride` at the top and `accordion` named outright, which is
 * one of only two places in this genre where the instrument list is seized.
 * `LeftHandMode.stride` says why: the bass buttons and the chord buttons are two
 * different rows, and playing them alternately is the instrument's entire
 * left-hand idiom whether or not there is anybody else in the room.
 */
const cajun: Style = {
  id: 'cajun',
  label: 'Cajun',
  description:
    'A ten-button accordion, a fiddle, a triangle and French. The same two-step as Texas, played on an instrument that only knows one key.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [116, 148],
  swing: 0.14,
  modeWeights: { minor: 0.1, major: 0.9 },
  relativeMajorChorus: 0,
  boxDrums: false,
  shots: COUNTRY_SHOTS,
  progressions: THREE_CHORD,
  minorProgressions: MINOR_CHORDS,
  melodyCells: PLAIN_CELLS,
  cadenceCells: PLAIN_CADENCES,
  bass: [boomChuck(6), twoBeat(4)],
  comp: [chuck(6), {
    name: 'accordion-push', weight: 5, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.7 }, { at: 4, dur: 3, vel: 0.94 },
      { at: 8, dur: 2, vel: 0.72 }, { at: 12, dur: 3, vel: 0.9 },
    ],
  }],
  /**
   * The triangle, and it is the whole percussion section.
   *
   * `tb` rather than `hh`. A cajun triangle is a steel rod struck against a steel
   * triangle on every offbeat for four minutes, and what it produces is a bright
   * metallic ring with no pitch and a long tail — which is a tambourine's
   * spectrum, not a hi-hat's. Written on a hat it comes out as a dry tick and the
   * one thing anybody would recognise the band by is gone.
   */
  drums: [{
    name: 'triangle', weight: 7, voices: {
      bd: [0, 8],
      tb: [2, 6, 10, 14],
    },
  }, {
    name: 'triangle-kit', weight: 4, voices: {
      bd: [0, 8],
      sd: [4, 12],
      tb: [0, 2, 4, 6, 8, 10, 12, 14],
    },
  }],
  twoHanded: {
    instruments: [['accordion', 8], ['bandoneon', 2]],
    density: 0.85,
    modes: [['stride', 7], ['answer', 3], ['block', 2]],
  },
  melody: { leap: 0.3, ornament: 0.35, span: 11, sequence: 0.6, syncopation: 0.2 },
};

/**
 * ZYDECO — the same parish, the other community, and about twenty years later.
 *
 * Creole rather than Cajun: a piano accordion instead of a one-row box, a
 * corrugated metal vest played with bottle-openers instead of a triangle, and
 * rhythm and blues instead of a two-step. Clifton Chenier had a saxophone in the
 * band and played twelve-bar numbers, which is why this is the one style in the
 * file besides western swing where the `brass` layer is genuinely a horn.
 *
 * It writes its own harmony because it genuinely has different harmony: a zydeco
 * number is frequently one chord for eight bars with a I7 flavour over it, which
 * is a blues texture and is unreachable from `THREE_CHORD` in either direction.
 * Straight, at 0, and it is straight *earlier* than the rest of the file for the
 * same reason a New Orleans record is: the eighth-note feel came from rhythm and
 * blues, not from Bakersfield.
 */
const zydeco: Style = {
  id: 'zydeco',
  label: 'Zydeco',
  description:
    'A piano accordion, a rubboard played with bottle-openers and a saxophone: the same parish as cajun, twenty years later, with rhythm and blues in it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [128, 166],
  swing: 0,
  modeWeights: { minor: 0.28, major: 0.72 },
  relativeMajorChorus: 0,
  boxDrums: false,
  shots: COUNTRY_SHOTS,
  progressions: {
    verse: [
      { chords: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7'], weight: 5, note: 'One chord with a seventh on it for four bars. This is not a country verse, it is a blues vamp, and the accordion is playing over the top of it' },
      { chords: ['I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'V7'], weight: 5 },
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'V', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'I7'], weight: 5 },
      { chords: ['I7', 'I7', 'IV7', 'IV7', 'V7', 'V7', 'I7', 'I7'], weight: 4 },
    ],
    outro: [
      { chords: ['V7', 'IV7', 'I7', 'I7'], weight: 4 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'V7', 'V7'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'V7', 'iv', 'i', 'i'], weight: 4 },
    ],
    outro: [{ chords: ['V7', 'iv', 'i', 'i'], weight: 3 }],
  },
  melodyCells: [
    { cell: [2, 2, 4, 8], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [-2, 2, 4, 8], weight: 4 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 2 },
  ],
  cadenceCells: PLAIN_CADENCES,
  bass: [{
    name: 'zydeco-eights', weight: 6, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 },
      { at: 6, dur: 2, tone: 'root', vel: 0.78 },
      { at: 8, dur: 2, tone: 'fifth', vel: 0.9 },
      { at: 12, dur: 2, tone: 10, vel: 0.8 },
    ],
  }, boomChuck(4)],
  comp: [{
    name: 'rubboard-comp', weight: 6, voices: 4, hits: [
      { at: 0, dur: 2, vel: 0.72 }, { at: 4, dur: 2, vel: 0.94 },
      { at: 8, dur: 2, vel: 0.74 }, { at: 12, dur: 2, vel: 0.92 },
    ],
  }, chuck(4)],
  /**
   * The rubboard is `sh` on every sixteenth, and it is a real instrument playing a
   * real part rather than a shaker standing in for one.
   *
   * A frottoir is a sheet of corrugated steel hung from the shoulders and scraped
   * with two bottle-openers, and what it makes is a continuous rasp with an accent
   * wherever the player changes direction. Sixteen strokes a bar with the kit's own
   * backbeat under them is that, and it is the loudest thing on a zydeco stage
   * after the accordion.
   */
  drums: [{
    name: 'rubboard', weight: 7, voices: {
      bd: [0, 6, 8, 14],
      sd: [4, 12],
      sh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    },
  }, {
    name: 'rubboard-open', weight: 4, voices: {
      bd: [0, 8],
      sd: [4, 12],
      sh: [0, 2, 4, 6, 8, 10, 12, 14],
      tb: [4, 12],
    },
  }],
  twoHanded: {
    instruments: [['accordion', 9], ['piano', 1]],
    density: 0.8,
    modes: [['stride', 5], ['answer', 4], ['block', 3]],
  },
  melody: { leap: 0.34, ornament: 0.3, span: 13, sequence: 0.5, syncopation: 0.4 },
};

// ---------------------------------------------------------------------------
// Nashville: an arranger, a string section and a control room
// ---------------------------------------------------------------------------

/**
 * COUNTRYPOLITAN — the Nashville sound, 1958–70, and the most argued-about thing
 * in this genre's history.
 *
 * Chet Atkins and Owen Bradley took the fiddle and the steel guitar off the record
 * — the two instruments that said *country* to a radio programmer — and put a
 * string section and a vocal group in their place, and the result outsold
 * everything. Whether that was a betrayal or a rescue is not this file's business;
 * what is this file's business is that it produced a genuinely different rhythm
 * section, and it is the one in `twoBeat` and `brushKit`: a bass playing one and
 * three and holding, a drummer on brushes with the stick laid across the head, and
 * nothing above 5 kHz anywhere.
 *
 * `NASHVILLE_CHORDS` rather than `THREE_CHORD`, and the vi in bar five is the
 * entire harmonic difference. `swing: 0.1` is what is left of the shuffle after
 * the strings arrive: a session drummer's brushes are not straight and not swung,
 * they are somewhere in between and they stay there for twelve years.
 */
const countrypolitan: Style = {
  id: 'countrypolitan',
  label: 'Countrypolitan',
  description:
    'The Nashville sound: the fiddle and the steel taken off, a string section and a vocal group put on, and a bass playing one and three and holding.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [76, 102],
  swing: 0.1,
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0,
  boxDrums: false,
  shots: COUNTRY_SHOTS,
  progressions: NASHVILLE_CHORDS,
  minorProgressions: MINOR_CHORDS,
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [16], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [twoBeat(7), boomChuck(3)],
  comp: [{
    name: 'session-eighths', weight: 6, voices: 4, hits: [
      { at: 0, dur: 4, vel: 0.62 },
      { at: 8, dur: 4, vel: 0.6 },
    ],
  }, chuck(4)],
  drums: [brushKit(7), twoBeatKit(3)],
  twoHanded: {
    density: 0.6,
    modes: [['answer', 5], ['block', 3], ['stride', 2]],
  },
  melody: { leap: 0.24, ornament: 0.25, span: 12, sequence: 0.55, syncopation: 0.12 },
};

/**
 * BALLAD — the country ballad proper, and the slowest thing here.
 *
 * George Jones, Patsy Cline, "He Stopped Loving Her Today". Four beats to the bar
 * written down and three subdivisions inside each of them felt, which is why the
 * melody cells below lean on `[6, 2, 8]` and `[12, 4]` rather than on anything
 * even: a dotted figure on a sixteenth grid is the closest this engine can come to
 * a 12/8 shuffle, and the honest version of that is to write the lean into the tune
 * rather than to put a swing number on the whole band.
 *
 * `swing: 0` is therefore deliberate and slightly counter-intuitive. The triplet in
 * a country ballad is in the *notation*, not in the timing: the drummer is playing
 * dotted quarters on purpose and exactly on the grid, and swinging the whole
 * arrangement on top of that would produce a shuffle inside a shuffle.
 */
const ballad: Style = {
  id: 'ballad',
  label: 'Country ballad',
  description:
    'The slow one: four beats written, three felt inside each, and a singer with one line and a great deal of room to say it in.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [60, 84],
  swing: 0,
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0,
  boxDrums: false,
  shots: COUNTRY_SHOTS,
  progressions: NASHVILLE_CHORDS,
  minorProgressions: MINOR_CHORDS,
  melodyCells: [
    { cell: [6, 2, 8], weight: 5 },
    { cell: [12, 4], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [-4, 12], weight: 3 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [twoBeat(7), {
    name: 'ballad-root', weight: 4, hits: [{ at: 0, dur: 14, tone: 'root', vel: 0.92 }],
  }],
  comp: [{
    name: 'ballad-dotted', weight: 6, voices: 4, hits: [
      { at: 0, dur: 6, vel: 0.6 },
      { at: 6, dur: 2, vel: 0.5 },
      { at: 8, dur: 6, vel: 0.58 },
      { at: 14, dur: 2, vel: 0.48 },
    ],
  }, {
    name: 'ballad-held', weight: 4, voices: 5, hits: [{ at: 0, dur: 16, vel: 0.55 }],
  }],
  drums: [brushKit(7), {
    name: 'ballad-triplet', weight: 4, voices: {
      bd: [0, 8],
      rim: [4, 12],
      hh: [0, 6, 8, 14],
    },
  }],
  twoHanded: {
    density: 0.55,
    modes: [['answer', 5], ['block', 4], ['stride', 1]],
  },
  melody: { leap: 0.2, ornament: 0.3, span: 12, sequence: 0.5, syncopation: 0.1 },
};

/**
 * CLOSE-HARMONY DUET — two voices a third apart, and the oldest arrangement in
 * American vernacular music.
 *
 * The Delmore Brothers, the Blue Sky Boys, the Louvin Brothers, the Everlys,
 * Porter and Dolly. The tenor sits a third above the lead the whole way through
 * and does not deviate, which is what makes brother duets sound like one very
 * strange instrument rather than like two people: the second voice has no
 * independent line to be heard as, so the ear fuses them and hears a timbre.
 *
 * `arrangement` at the genre level weights `harmony` heavily and this is the style
 * it was weighted for. What the style itself contributes is restraint everywhere
 * else — the smallest `melody.span` in the file after the murder ballad, because
 * the interval has to stay singable by the person on top, and a `sequence` of 0.68
 * because a duet's whole shape is the same phrase four times with different words.
 */
const duet: Style = {
  id: 'duet',
  label: 'Close-harmony duet',
  description:
    'Two voices a third apart from the first note to the last, over a guitar and a mandolin. Fused hard enough that the ear hears one instrument.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [94, 122],
  swing: 0.12,
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0,
  boxDrums: false,
  shots: COUNTRY_SHOTS,
  progressions: THREE_CHORD,
  minorProgressions: MINOR_CHORDS,
  melodyCells: PLAIN_CELLS,
  cadenceCells: PLAIN_CADENCES,
  bass: [boomChuck(6), twoBeat(4)],
  comp: [chuck(7), chop(4)],
  drums: [brushKit(5), twoBeatKit(4)],
  melody: { leap: 0.22, ornament: 0.24, span: 11, sequence: 0.68, syncopation: 0.12 },
  /**
   * The style the genre's `harmony: 7` was weighted for, saying it in the field
   * that was built for it rather than in a device pool.
   *
   * `amount: 1` and no `kinds`, because the header above is not describing a
   * gesture: *the tenor sits a third above the lead the whole way through and does
   * not deviate*. One interval and one weight for the same reason — a table that
   * offered a second would be offering the deviation the header says does not
   * happen, and `harmoniseWith` draws once per section, so two entries would read
   * as *the tenor moves between choruses*.
   *
   * Above, and this is the case `HarmonyProfile.intervals` was made signed for:
   * `Chart.harmonyBelow` is unsigned, so before this field every harmony line in
   * the project sat underneath the tune and a brother duet's tenor was unsayable.
   *
   * What it actually sounds like is the fourth, not the third — see `arrangement`
   * in `index.ts`: the major pentatonic gives `+2` as 4, 5, 5, 5, 5 semitones, so
   * the sweet third lands only where the tune is on the tonic. 30% of these songs
   * are minor and get the real interval throughout. The gap is this style's alone
   * to feel, and it is smaller than the alternative: the device this replaces
   * draws the same fourth 65% of the time and an octave the other 35%.
   */
  harmony: { amount: 1, intervals: [[2, 1]], on: 'vocal' },
};

/**
 * BAKERSFIELD — California, 1963, and the exact place the shuffle stops.
 *
 * Buck Owens and Merle Haggard made records two thousand miles from Music Row with
 * two Telecasters, a Fender bass and a drummer who plays straight eighths and
 * nothing else, and the whole design brief was *the opposite of Nashville*: no
 * strings, no vocal group, no brushes, no reverb, and no shuffle. `swing: 0` is
 * therefore the loudest single number in this file, because every neighbouring
 * style has one and this one deliberately does not.
 *
 * The blue third over a major chord, for the second of four times — see
 * `rockabilly` for the argument. It is more consequential here than anywhere,
 * because a Bakersfield lead line is a Telecaster playing double-stops out of the
 * minor pentatonic against a band playing plain major triads, and that grind *is*
 * the sound.
 */
const bakersfield: Style = {
  id: 'bakersfield',
  label: 'Bakersfield',
  description:
    'Two Telecasters, a Fender bass and straight eighths, made two thousand miles from Nashville with every single thing Nashville had added taken back off.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [130, 164],
  swing: 0,
  modeWeights: { minor: 0.22, major: 0.78 },
  relativeMajorChorus: 0,
  boxDrums: false,
  shots: COUNTRY_SHOTS,
  progressions: THREE_CHORD,
  minorProgressions: MINOR_CHORDS,
  melodyCells: [
    { cell: [2, 2, 4, 8], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-2, 2, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [6, 2, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 2 },
  ],
  cadenceCells: PLAIN_CADENCES,
  bass: [{
    name: 'fender-eights', weight: 7, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 },
      { at: 4, dur: 2, tone: 'root', vel: 0.8 },
      { at: 8, dur: 2, tone: 'fifth', vel: 0.9 },
      { at: 12, dur: 2, tone: 'octave', vel: 0.8 },
    ],
  }, boomChuck(4), boomRun(3)],
  comp: [chuck(7), {
    name: 'tele-eighths', weight: 5, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.7 }, { at: 4, dur: 2, vel: 0.94 },
      { at: 8, dur: 2, vel: 0.72 }, { at: 12, dur: 2, vel: 0.92 },
    ],
  }],
  drums: [twoBeatKit(7), {
    name: 'freight', weight: 4, voices: {
      bd: [0, 8],
      sd: [4, 12],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    },
  }],
  /** See `rockabilly`: the minor pentatonic of the key, ground against a major band. */
  scaleForChord: (tonic) => makeScale(tonic, 'minorPentatonic'),
  melody: { leap: 0.32, ornament: 0.22, span: 13, sequence: 0.58, syncopation: 0.28 },
};

/**
 * TRUCK-DRIVING SONG — 1963–75, the one genuinely industrial subject this music
 * has, and a rhythm designed to be listened to at seventy miles an hour.
 *
 * "Six Days on the Road", "Girl on the Billboard", "Convoy". It is Bakersfield
 * with a job: the same straight eighths and the same Telecaster, faster, with a
 * ♭VII in it and a lyric about a schedule. `MODAL_CHORDS` rather than
 * `THREE_CHORD`, and the flat seventh is doing exactly what it does on a rock
 * record — there is nothing folkloric about it here, it arrived in 1964 from the
 * radio.
 *
 * The blue third again, for the third of four times, and here it is a Telecaster
 * rather than a voice. `melody.syncopation: 0.35` is the highest in the file after
 * western swing, because a truck song's hook is a *riff* and a riff pushes the
 * barline.
 */
const truckdriving: Style = {
  id: 'truckdriving',
  label: 'Truck-driving song',
  description:
    'Bakersfield with a schedule: straight eighths at speed, a flat seventh borrowed off the radio, and a hook that is a riff rather than a line.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [138, 172],
  swing: 0,
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0,
  boxDrums: false,
  shots: COUNTRY_SHOTS,
  progressions: MODAL_CHORDS,
  minorProgressions: MINOR_CHORDS,
  melodyCells: [
    { cell: [2, 2, 4, 8], weight: 5 },
    { cell: [-2, 2, 4, 8], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [-4, 2, 2, 8], weight: 3 },
  ],
  cadenceCells: PLAIN_CADENCES,
  bass: [{
    name: 'driving-eights', weight: 7, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 },
      { at: 4, dur: 2, tone: 'root', vel: 0.82 },
      { at: 8, dur: 2, tone: 'root', vel: 0.92 },
      { at: 12, dur: 2, tone: 'fifth', vel: 0.84 },
    ],
  }, boomChuck(3)],
  comp: [{
    name: 'tele-riff', weight: 6, voices: 3, hits: [
      { at: 0, dur: 2, vel: 0.9 }, { at: 3, dur: 1, vel: 0.66 },
      { at: 6, dur: 2, vel: 0.78 }, { at: 8, dur: 2, vel: 0.88 },
      { at: 11, dur: 1, vel: 0.66 }, { at: 14, dur: 2, vel: 0.76 },
    ],
  }, chuck(5)],
  drums: [twoBeatKit(6), {
    name: 'driving', weight: 5, voices: {
      bd: [0, 6, 8, 14],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    },
  }],
  /** See `rockabilly`. Here it is a guitar rather than a voice, and just as blue. */
  scaleForChord: (tonic) => makeScale(tonic, 'minorPentatonic'),
  melody: { leap: 0.32, ornament: 0.2, span: 13, sequence: 0.6, syncopation: 0.35 },
};

// ---------------------------------------------------------------------------
// Outlaw and after: a rock rhythm section, and Texas again
// ---------------------------------------------------------------------------

/**
 * OUTLAW — Austin, 1975, and the argument that made the fourth era necessary.
 *
 * Waylon Jennings and Willie Nelson took production control off the label and made
 * records with their road bands, which produced a rhythm section nothing else in
 * this file has: a phase-shifted Telecaster playing continuous sixteenths, a bass
 * that plays the root and stays there, and a drummer with a hard backbeat and no
 * brushes anywhere. The "Waylon beat" is the comp figure below and it is the one
 * place in this genre where the guitar is playing *time* rather than chords.
 *
 * It is the only style here whose modes are near even. Outlaw records are
 * genuinely half minor — "Ain't Living Long Like This", "Red Headed Stranger" —
 * which nothing before 1970 in this catalogue is, and it writes its own minor
 * table because that minor is not the modal ballad's: it has a real ♭VI–♭VII lift
 * in it, which is a rock cadence rather than a mountain one.
 *
 * The blue third for the fourth and last time. A Telecaster through a phaser
 * playing the minor pentatonic against a major band is precisely what these records
 * sound like.
 */
const outlaw: Style = {
  id: 'outlaw',
  label: 'Outlaw',
  description:
    'The Waylon beat: a phase-shifted Telecaster playing continuous sixteenths, a bass that will not move, a hard backbeat, and half the songs in minor.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [112, 146],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  boxDrums: false,
  shots: COUNTRY_SHOTS,
  progressions: MODAL_CHORDS,
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'VI', 'VII'], weight: 5, note: 'The ♭VI–♭VII lift, which is a rock cadence and not a mountain one. It is what dates these records to 1975 rather than to 1927' },
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    bridge: [
      { chords: ['VI', 'VI', 'III', 'III', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['VI', 'VII', 'i', 'i'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [-2, 2, 4, 8], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  cadenceCells: PLAIN_CADENCES,
  bass: [{
    name: 'root-and-stay', weight: 7, hits: [
      { at: 0, dur: 4, tone: 'root', vel: 1 },
      { at: 4, dur: 4, tone: 'root', vel: 0.82 },
      { at: 8, dur: 4, tone: 'root', vel: 0.9 },
      { at: 12, dur: 4, tone: 'root', vel: 0.82 },
    ],
  }, boomChuck(3), {
    name: 'root-and-octave', weight: 4, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 },
      { at: 6, dur: 2, tone: 0, vel: 0.76 },
      { at: 8, dur: 3, tone: 12, vel: 0.88 },
      { at: 14, dur: 2, tone: 0, vel: 0.78 },
    ],
  }],
  /**
   * The Waylon beat, and it is a *time* part rather than a chord part.
   *
   * Sixteen even strokes through a phase shifter with the accent on every fourth
   * one. A guitarist doing this is not playing the harmony — the bass is doing
   * that, on one note — and the reason it works is that the phaser turns a
   * continuous strum into something that moves on its own, so the bar has an
   * internal event without anybody playing one.
   */
  comp: [{
    name: 'waylon', weight: 7, voices: 3, hits: [
      { at: 0, dur: 1, vel: 0.9 }, { at: 1, dur: 1, vel: 0.6 },
      { at: 2, dur: 1, vel: 0.68 }, { at: 3, dur: 1, vel: 0.6 },
      { at: 4, dur: 1, vel: 0.86 }, { at: 5, dur: 1, vel: 0.6 },
      { at: 6, dur: 1, vel: 0.68 }, { at: 7, dur: 1, vel: 0.6 },
      { at: 8, dur: 1, vel: 0.88 }, { at: 9, dur: 1, vel: 0.6 },
      { at: 10, dur: 1, vel: 0.68 }, { at: 11, dur: 1, vel: 0.6 },
      { at: 12, dur: 1, vel: 0.86 }, { at: 13, dur: 1, vel: 0.6 },
      { at: 14, dur: 1, vel: 0.68 }, { at: 15, dur: 1, vel: 0.6 },
    ],
  }, chuck(4)],
  drums: [{
    name: 'outlaw-backbeat', weight: 7, voices: {
      bd: [0, 6, 8],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    },
  }, twoBeatKit(4)],
  /** See `rockabilly`. Through a phase shifter, at volume. */
  scaleForChord: (tonic) => makeScale(tonic, 'minorPentatonic'),
  melody: { leap: 0.3, ornament: 0.2, span: 13, sequence: 0.55, syncopation: 0.28 },
};

/**
 * COUNTRY ROCK — Los Angeles, 1969–75, and the traffic in the other direction.
 *
 * The Byrds went to Nashville, Gram Parsons stayed, and the Eagles turned the
 * result into the biggest-selling records of the decade. What arrives musically is
 * a rock rhythm section with a pedal steel on top of it: a straight kit playing
 * quarters on the kick, a bass playing eighths, an acoustic guitar strumming
 * through the whole bar rather than chucking on two and four, and close harmony
 * over all of it.
 *
 * The strum is the tell. Every other style in this file leaves holes in the bar
 * where the other players go; this one fills it, because a country rock record is
 * *layered* rather than interlocked — it was made on eight tracks with everybody
 * overdubbed, and nobody had to leave room for anybody.
 */
const countryrock: Style = {
  id: 'countryrock',
  label: 'Country rock',
  description:
    'A rock rhythm section with a pedal steel on top: a strum that fills the bar rather than chucking on two and four, and close harmony over all of it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [118, 152],
  swing: 0,
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0,
  boxDrums: false,
  shots: COUNTRY_SHOTS,
  progressions: MODAL_CHORDS,
  minorProgressions: MINOR_CHORDS,
  melodyCells: PLAIN_CELLS,
  cadenceCells: PLAIN_CADENCES,
  bass: [{
    name: 'rock-eights', weight: 6, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 },
      { at: 4, dur: 2, tone: 'root', vel: 0.8 },
      { at: 8, dur: 2, tone: 'fifth', vel: 0.9 },
      { at: 12, dur: 2, tone: 'octave', vel: 0.8 },
    ],
  }, boomChuck(4), boomRun(3)],
  comp: [{
    name: 'full-strum', weight: 7, voices: 5, hits: [
      { at: 0, dur: 2, vel: 0.84 }, { at: 2, dur: 2, vel: 0.58 },
      { at: 4, dur: 2, vel: 0.9 }, { at: 6, dur: 2, vel: 0.58 },
      { at: 8, dur: 2, vel: 0.8 }, { at: 10, dur: 2, vel: 0.58 },
      { at: 12, dur: 2, vel: 0.88 }, { at: 14, dur: 2, vel: 0.6 },
    ],
  }, chuck(4)],
  drums: [twoBeatKit(6), {
    name: 'rock-kit', weight: 5, voices: {
      bd: [0, 8, 10],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    },
  }],
  melody: { leap: 0.28, ornament: 0.2, span: 13, sequence: 0.58, syncopation: 0.25 },
  /**
   * "Close harmony over all of it", which is in the description above because it
   * is half of what these records are.
   *
   * One interval and no weight beside it, and the reason is the same one the
   * header gives for the strum filling the bar: this was made on eight tracks with
   * everybody overdubbed. A stack punched in against a finished vocal is one
   * singer a fixed distance from himself, and the tape does not renegotiate at bar
   * nine — where a duet is two people in a room and a quartet is four, both of
   * which can move.
   *
   * `kinds: ['chorus']`, unlike `duet`: the verse is one person telling it and the
   * band arrives with the hook, which is the arrangement a 1972 single is built
   * on. 0.8 rather than 0.9 because a fifth of these are the one voice all the way
   * through, and that is a Gram Parsons record rather than an Eagles one.
   */
  harmony: { amount: 0.8, intervals: [[2, 1]], on: 'vocal', kinds: ['chorus'] },
};

/**
 * ALT-COUNTRY — 1990, and the first style here whose subject is the rest of this
 * file.
 *
 * Uncle Tupelo, Lucinda Williams, Gillian Welch: people who found this music on
 * reissues rather than in a family and who kept its instruments and its subject
 * matter while getting the volume and the tempo from somewhere else entirely. It
 * sits at the bottom of the tempo band, it is the only style besides the murder
 * ballad whose primary mode is minor, and it writes its own minor table because
 * the one it wants is the *modal ballad's with a suspension in it* — a i–♭VII–IV
 * loop that never cadences, which neither `MINOR_CHORDS` nor `MODAL_CHORDS` has.
 *
 * `hook: 'loose'`. It is the one country style here that does not want its chorus
 * to be the same twice, which is exactly the inheritance it did not take.
 */
const altcountry: Style = {
  id: 'altcountry',
  label: 'Alt-country',
  description:
    'The old instruments and the old subject matter at a volume they never had: a loop that never cadences, mostly minor, and a chorus that refuses to repeat itself.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [76, 106],
  swing: 0,
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0,
  boxDrums: false,
  hook: 'loose',
  shots: COUNTRY_SHOTS,
  progressions: {
    verse: [
      { chords: ['i', 'VII', 'IV', 'IV', 'i', 'VII', 'IV', 'IV'], weight: 5, note: 'A major IV under a minor tonic, looping, and no cadence anywhere. Dorian, and it is what the genre answers with when the key alone will not hold the chord' },
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'III', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['IV', 'IV', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 4 },
    ],
    bridge: [
      { chords: ['III', 'III', 'VII', 'VII', 'iv', 'iv', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['VII', 'IV', 'i', 'i'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'I', 'IV', 'I', 'IV', 'bVII', 'bVII'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 5 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 3 },
    ],
    outro: [{ chords: ['bVII', 'IV', 'I', 'I'], weight: 3 }],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [16], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [-4, 2, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [twoBeat(6), {
    name: 'held-root', weight: 5, sustain: true, hits: [
      { at: 0, dur: 8, tone: 'root', vel: 0.92 },
      { at: 8, dur: 8, tone: 'root', vel: 0.86 },
    ],
  }, boomChuck(3)],
  comp: [{
    name: 'loose-strum', weight: 6, voices: 5, hits: [
      { at: 0, dur: 4, vel: 0.78 },
      { at: 6, dur: 2, vel: 0.56 },
      { at: 8, dur: 4, vel: 0.74 },
      { at: 14, dur: 2, vel: 0.56 },
    ],
  }, chuck(4)],
  drums: [{
    name: 'alt-kit', weight: 6, voices: {
      bd: [0, 10],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    },
  }, brushKit(4)],
  melody: { leap: 0.24, ornament: 0.22, span: 12, sequence: 0.45, syncopation: 0.2 },
};

/**
 * COUNTRY POP — 1980, and the only style here that a machine is allowed to play.
 *
 * *Urban Cowboy*, the crossover era, and everything a country record picked up
 * from adult contemporary radio: a gated snare, a synth pad where the strings
 * were, a bass playing eighths on one note and a key change into the last chorus
 * that everybody in the room can hear coming. It is the one style with
 * `boxDrums` left true, and the reason is exactly the one `Style.boxDrums`
 * documents: a low weight would not have been the same statement. Every other
 * style in this file has a person behind the kit as a matter of identity, and this
 * one has a LinnDrum as a matter of history.
 *
 * `hook: 'earworm'`, which is not a criticism. The commercial proposition of a
 * 1982 country single is that you can sing the chorus back after one play, and a
 * style table that hedged on that would be describing a different record.
 */
const countrypop: Style = {
  id: 'countrypop',
  label: 'Country pop',
  description:
    'The crossover: a gated snare, a synth pad where the strings were, and a key change into the last chorus that everybody can hear coming.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [104, 134],
  swing: 0,
  modeWeights: { minor: 0.22, major: 0.78 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  shots: COUNTRY_SHOTS,
  progressions: NASHVILLE_CHORDS,
  minorProgressions: MINOR_CHORDS,
  melodyCells: PLAIN_CELLS,
  cadenceCells: PLAIN_CADENCES,
  bass: [{
    name: 'pop-eights', weight: 7, hits: [
      { at: 0, dur: 2, tone: 'root', vel: 1 },
      { at: 4, dur: 2, tone: 'root', vel: 0.82 },
      { at: 8, dur: 2, tone: 'root', vel: 0.92 },
      { at: 12, dur: 2, tone: 'fifth', vel: 0.84 },
    ],
  }, twoBeat(4)],
  comp: [chuck(6), {
    name: 'pop-pad-comp', weight: 5, voices: 4, hits: [
      { at: 0, dur: 8, vel: 0.6 },
      { at: 8, dur: 8, vel: 0.58 },
    ],
  }],
  drums: [{
    name: 'gated', weight: 7, voices: {
      bd: [0, 8],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
      cp: [4, 12],
    },
  }, twoBeatKit(4)],
  melody: { leap: 0.26, ornament: 0.22, span: 12, sequence: 0.65, syncopation: 0.2 },
};

export const STYLES: Record<string, Style> = {
  breakdown, bluegrass, bluegrasswaltz, gospel, cowboy, murderballad, newgrass,
  honkytonk, twostep, waltz, westernswing, trainsong, rockabilly, cajun, zydeco,
  countrypolitan, ballad, duet, bakersfield, truckdriving,
  outlaw, countryrock, altcountry, countrypop,
};
