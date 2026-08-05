/**
 * Metal — Birmingham 1970 to Gothenburg 1996, and everything the amplifier did
 * in between.
 *
 * Twenty-four styles across four eras, held together by one idea that no other
 * genre in this project has any use for.
 *
 * ## The idea is that the chord has no quality
 *
 * Every other repertoire here is built on chords that *are* something. A
 * tanssilava band's guitar states minor or major on every beat so that the floor
 * knows which one it is dancing to; a jazz comper's whole vocabulary is the third
 * and the seventh; `chooseTones` in `core/voicing.ts` calls those two notes *what
 * the chord is* and drops everything else before it touches them.
 *
 * This music's principal harmonic object is a **power chord**: root, fifth,
 * octave, and no third at all. That is not a triad with a note missing. It is a
 * deliberately incomplete object, and the incompleteness is load-bearing in three
 * separate ways:
 *
 *  - **It is what makes distortion listenable.** A cranked amplifier is a
 *    non-linear device, so it generates a sum and difference tone for every pair
 *    of partials it is fed. A perfect fifth's partials line up at 3:2 and the
 *    intermodulation lands on notes already in the chord; a major third's do not,
 *    and what comes out is a thicket. Every guitarist knows this as *thirds sound
 *    muddy through a distorted amp*, and it is arithmetic rather than taste.
 *  - **It means the harmony asserts nothing about the mode.** `i` and `I` are the
 *    same two fingers in the same place. So a riff can move from aeolian to
 *    phrygian to phrygian dominant without anything underneath having to agree,
 *    which is exactly what `scaleForChord` below is written to exploit.
 *  - **It puts the whole tonal argument in the melody.** In a genre where the
 *    chords are silent on the question, the line is the only witness — which is
 *    why this genre disables more rules than any other in the project, and why
 *    each of those decisions is argued at `ruleOverrides` rather than listed.
 *
 * The full account of how the comp expresses this is at `POWER` in `styles.ts`.
 * The short version: `core/voicing.ts` has a `'power'` style that states the root
 * and the fifth and refuses the third at every voice count, and the two-voice
 * comp comes out a perfect fifth on 90% of its onsets. It used to be a quartal
 * stack — the fifth inverted, the nearest honest thing available before that
 * style existed — and the table at `POWER` records what those years cost, because
 * a quarter of it was a tritone nobody asked for.
 *
 * ## What this genre does not claim
 *
 * It is not a fifth answer to the chord-scale question. Like iskelmä, synth and
 * reggae, it follows the **key**; the ladder below is a close cousin of reggae's
 * and a first cousin of synth's, and the honest thing is to say so here rather
 * than let somebody find the resemblance and conclude the genre was a mistake.
 * Where it differs is the *length and the direction* of the ladder — six modes
 * rather than three, reaching material none of the others has a use for — and
 * where it differs most sharply is the fallback, which is argued at the function.
 */

import { chordPcs } from '../../core/chord.js';
import { makeScale, type ScaleName } from '../../core/scale.js';
import { RULE_DISABLED } from '../../core/rules.js';
import type { Genre, FormStep } from '../types.js';
import { STYLES } from './styles.js';
import { ERAS } from './eras.js';
import { MOODS } from './moods.js';
import { VOCALS } from './vocals.js';
import { generateTitle } from './titles.js';
import { STAGING } from './staging.js';

/**
 * The modes the melody may live in, minor first.
 *
 * Six long, where reggae's is three, and the length is a claim rather than an
 * accident. Reggae argues that a short ladder is right because its verses have
 * two chords in them and a search that could reach lydian would be answering a
 * question nobody asks. This genre asks. Its tables genuinely contain a ♭II, a
 * major V, a major I inside a minor key and an occasional ♭V, and each of those
 * is a *different mode* rather than a colour, so the ladder has to be able to
 * reach them or the tables are writing chords the melody cannot see.
 *
 * The order is the genre's identity, and it is the two ends that matter:
 *
 *  - **`minor` first.** Aeolian is the default sound, and a plain `i` should
 *    produce it rather than something more exotic. That is worth saying because
 *    the tempting order — phrygian first, since phrygian is the mode metal is
 *    famous for — would make *every* tonic bar phrygian and put a ♭2 in a genre
 *    that mostly has a ♮2. Phrygian is what this music reaches for; it is not
 *    where it lives.
 *  - **`harmonicMinor` and `phrygianDominant` last but genuinely reachable.**
 *    A major `V` in a minor key falls through aeolian, phrygian and dorian and
 *    lands on harmonic minor, which is the neoclassical cadence and is right. A
 *    major `I` in a minor key falls through all four and lands on **phrygian
 *    dominant**, which is the mode `shred` exists to play and is reached without
 *    that style needing to override anything.
 *
 * `phrygian` sits above `dorian` and the order is almost never consulted, which
 * is worth recording so nobody spends time on it: a chord that fits both must
 * avoid the second degree and the sixth, and any such chord fits aeolian too and
 * never gets this far. It is ordered dark-first because that is the direction
 * this genre bends when it has a choice, which is a statement about the genre
 * rather than a working part of the search.
 */
const MINOR_LADDER: ScaleName[] = [
  'minor', 'phrygian', 'dorian', 'harmonicMinor', 'phrygianDominant', 'hungarianMinor',
];

/**
 * And in major, which is `glam`, `power` and half of `nwobhm`.
 *
 * Three modes, and it is short for reggae's reason rather than long for this
 * genre's: metal in a major key is pop music with distortion on it, and pop
 * music's harmony does not wander. `mixolydian` is the entry that earns its
 * place — the borrowed ♭VII is in nearly every major table in `styles.ts`,
 * because I–♭VII–IV is the one progression this genre plays in major more than
 * any other and its ♭7 is not available from the major scale.
 */
const MAJOR_LADDER: ScaleName[] = ['major', 'mixolydian', 'lydian'];

/**
 * Forms.
 *
 * Five, and the third is the one that could not have been written for any other
 * genre here.
 *
 * A thrash song is **through-composed**. It is not a verse and a chorus with a
 * middle eight; it is six or seven riffs stated in sequence, most of them heard
 * once, with the return — where there is one — arriving as a surprise rather than
 * as a structure. That is closer to a rondo than to a pop song, and expressing it
 * needs a form with two bridges and no repeated chorus in the first half, which
 * is what the third entry is. `hook: 'through'` on the styles that draw it is the
 * other half of the same statement.
 *
 * The fourth is the doom and post-metal shape: sixteen-bar sections, half as many
 * of them, and an outro long enough to be a movement. The fifth is the
 * instrumental — `shred` and half of `progressive` — where the solo sections are
 * not a break in the song, they are the song.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  // The single. Riff, verse, chorus, twice, a solo, and out.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'solo', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 5],
  // With the breakdown in it — the metalcore and groove shape, where the bridge
  // is not a contrasting section but the same riff at half the speed.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'bridge', bars: 8 }, { kind: 'solo', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'outro', bars: 4 },
  ], 4],
  // Through-composed. Riffs in sequence; the chorus arrives once, late, and the
  // second bridge is a different piece of music from the first.
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'bridge', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'bridge', bars: 8 }, { kind: 'solo', bars: 16 },
    { kind: 'chorus', bars: 8 }, { kind: 'outro', bars: 8 },
  ], 4],
  // The long one. Doom, sludge and post-metal: fewer sections, each of them twice
  // the length, and an outro that is a movement rather than a sign-off.
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'solo', bars: 16 },
    { kind: 'chorus', bars: 16 }, { kind: 'outro', bars: 8 },
  ], 3],
  // The instrumental. The solo sections are not a break in the song.
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'solo', bars: 16 },
    { kind: 'bridge', bars: 8 }, { kind: 'solo', bars: 16 },
    { kind: 'verse', bars: 8 }, { kind: 'outro', bars: 8 },
  ], 2],
];

export const metal: Genre = {
  /**
   * Direct, never prepared — and this genre's version of that claim is **not**
   * reggae's or synth's, which is worth being precise about because the field
   * name makes them look identical.
   *
   * Those two set it false because they have no leading tone at all: where
   * another idiom writes `V` they write `bVII`, and `npm run genres` asserts for
   * synth that a raised seventh never sounds in a minor-key song. This genre
   * makes no such claim and could not — `shred` is built on the major dominant,
   * `power` and `symphonic` cadence on one, and `scaleForChord` below answers a
   * major `V` in minor with harmonic minor on purpose. The leading tone is
   * emphatically available *inside* a key here.
   *
   * What is unavailable is the leading tone of a key the band is not yet in. A
   * riff is a shape on a fretboard built around an open string, and an applied
   * dominant in front of a key change is a *functional* gesture that would arrive
   * as a dance band walking in — the same objection reggae raises, reached from
   * the opposite direction. The key changes this genre does make are the last
   * chorus shifted up a tone with no warning whatever, which is a gear change
   * rather than a modulation, and `keyChangeChance` is small in every era for it.
   * See `tune/keyplan.ts`.
   */
  preparedModulation: false,
  id: 'metal',
  label: 'Metal',
  description:
    'Twenty-four styles from Birmingham 1970 to Gothenburg 1996 — power chords with no third in them, the gallop, the downpick and the blast beat, and a melody that carries the whole tonal argument by itself.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,

  /**
   * Guitar keys, and the open strings decide.
   *
   * Every other key table in this project is chosen for singers or for
   * fingering. Here the constraint is that **the lowest note of the riff has to
   * be an open string**, because a riff is built on a pedal note that the picking
   * hand returns to twenty times a bar and a fretted pedal costs a finger the
   * riff needs. A guitar in standard tuning has E, A, D, G and B available, and
   * that is the whole of the reason E minor carries nearly twice the weight of
   * anything else: it is the lowest of them, so it is the loudest, and about half
   * of this genre's most famous riffs are in it.
   *
   * The keys that are *not* here are as informative. C♯ and F minor are at the
   * bottom because they need a capo or a detuning; every other genre would rank
   * them by nothing in particular.
   *
   * ## What tuning costs, said once
   *
   * From about 1990 this music is played on guitars tuned *down* — a semitone, a
   * tone, and by the late nineties a fourth or more — so the real pedal note of a
   * death metal record is often B or A a whole octave below anything here. The
   * engine has no concept of an instrument's tuning: `rangeOfInstrument` gives
   * `distortionGuitar` an E2 floor and there is no field that would move it. The
   * honest expression is therefore **register rather than pitch class** — the
   * bass is written low, the comp's `layerPlan` offset puts the rhythm guitar a
   * fifth under the tune, and the key table above leans on the low end of what is
   * available. What cannot be expressed is the thing detuning is actually for,
   * which is that the strings go slack and the attack changes. That is a timbral
   * fact and this catalogue has one distorted guitar in it.
   */
  keys: {
    minor: [[4, 10], [9, 6], [2, 6], [11, 4], [7, 4], [6, 3], [0, 3], [5, 2], [1, 2]],
    major: [[2, 6], [4, 5], [9, 5], [7, 5], [0, 4], [5, 3], [11, 2]],
  },

  /**
   * It ends on a hit.
   *
   * A metal ending is the whole band arriving on the same downbeat and a cymbal
   * over it — the dead stop, which is the gesture the entire arrangement has been
   * setting up, and which is `button` exactly. The alternative these records
   * actually use, the last chord held while the amplifier feeds back, is not
   * `fade` in this engine's vocabulary: `fade` means nothing is struck, and the
   * feedback ending is a struck chord that outlasts itself. Both are the band
   * playing the last note together, so both are `button`, and a genre gets one
   * answer.
   *
   * Doom and post-metal would rather fade, and they are outvoted. Twenty-two
   * styles out of twenty-four stop dead.
   */
  ending: 'button',

  /**
   * Somebody counts it in, and here it is the only thing holding the band
   * together.
   *
   * The tempo band runs to 260 and the first event of a great many of these
   * numbers is five people playing a unison figure at that speed. There is no
   * groove to find it from — the whole texture starts at once — so the four
   * sticks are not a formality, they are the mechanism. It is also the one place
   * the drummer is unambiguously in charge, which is worth having in a genre
   * where the guitar decides everything else.
   */
  countIn: true,

  /**
   * `light` — level 1, and the lowest genre default in the project.
   *
   * At this level the only rules in force are the four melodic-interval vetoes
   * plus the instrument-aware leap check, and two of those four are switched off
   * below. That is close to the floor and it is deliberate: the rules encode
   * faults that classical and jazz practice agree on, and this idiom agrees with
   * neither about the two intervals it is built from.
   *
   * It is a *floor* rather than a setting, and six styles raise it. `power`,
   * `glam`, `symphonic`, `gothic` and `melodeath` sit at `standard`, because
   * those five are writing singable tunes and the rules describe singable tunes
   * correctly. `death`, `black` and `techdeath` drop to `free`, which is bebop's
   * setting for bebop's reason. The spread from `free` to `standard` inside one
   * genre is the widest here, and it is honest — this catalogue contains both a
   * football-terrace chorus and sixteen bars of chromatic tremolo picking.
   */
  defaultStrictness: 'light',

  /**
   * `standard`, with eight styles overriding it in both directions.
   *
   * The riff is the most repeated object in popular music — four bars, forty
   * times, unchanged — which argues for `earworm` everywhere. What stops it is
   * that the *songs* are not all built that way: `thrash`, `techdeath`,
   * `progressive` and `postmetal` are through-composed and state most of their
   * material once. So the genre sits in the middle and the styles say which kind
   * of band they are, which is the distinction that would be lost if this were
   * set at either end.
   */
  defaultHook: 'standard',

  /**
   * The twin guitars, and everything else a long way behind.
   *
   * `harmony` at 8 is the highest weight any genre gives any device in this
   * project, and the reason is that in this repertoire it is not an arranger's
   * touch — it is the *line-up*. Two guitarists playing a third apart is what a
   * second guitarist is for, and the whole of 1980 onward is bands who worked out
   * that you could do live what the first generation could only overdub.
   *
   * `unison` is second and it is the same fact one interval down: the guitars and
   * the bass playing the identical figure in octaves is how a riff gets its
   * weight, and it is what every band in this catalogue does at the top of a song.
   *
   * `tutti` is high where reggae's and iskelmä's are low, and the disagreement is
   * exact. A pavilion band stopping to hit a figure together empties the floor; in
   * this music the whole band stopping to hit a figure together *is the floor* —
   * it is the single most reliable gesture in the idiom and the reason `shots`
   * tables are written out per style rather than derived.
   *
   * `swell` is high, and the first draft had it at 1, which was the wrong answer
   * to the right observation. The observation is that there is no horn section
   * in this music and never has been. The mistake was reading the layer's *name*
   * rather than its palette: `brass` in this genre carries strings, a choir and a
   * church organ — see `eras.ts`, where the field says so at length — and what a
   * string section does behind a metal band is **hold**. It is there to be a bed
   * under the guitars, not to punctuate them, and a section that answered with
   * stabs would be a horn arrangement performed by violins.
   *
   * Measured, because the difference is not small: at `swell: 1` only 5% of this
   * genre's brass notes lasted a beat or longer, the lowest figure in the
   * project and well under the 20% the catalogue-wide check asks for; at 5 it is
   * 30%, which is where the arabic and classical tables already sit and is what a
   * sustaining section looks like from outside.
   */
  arrangement: { harmony: 8, unison: 6, tutti: 5, swell: 5, riff: 4, trade: 3 },

  /**
   * Where this genre disagrees with the shared rule table.
   *
   * **Seven entries, which is more than any other genre here**, and the count is
   * not a licence — it is a consequence of the argument at the top of this file.
   * The rules were derived from repertoire whose chords state their own quality,
   * so the melody is a voice among several; here the chords state nothing and the
   * melody is carrying the tonal argument alone, in a register and at a tempo the
   * rules were not written about. Each entry below names the specific thing the
   * rule would remove.
   */
  ruleOverrides: {
    /**
     * **`tritone-leap` off entirely, and it is the genre's founding decision.**
     *
     * The rule's own description is *"classically forbidden — the line loses its
     * footing"*, and it vetoes from strictness 1, which is this genre's default.
     * That description is accurate about what the interval does and completely
     * wrong about whether it is wanted. The first four bars of the first record
     * anybody calls metal — Black Sabbath, February 1970 — are the root, the
     * octave and the ♭5 above it, struck three times and left to ring; the band
     * named the effect and built a genre on it. `heavy`, `thrash`, `sludge`,
     * `death` and `techdeath` all carry a `bV` chord in their tables and the
     * melody has to be able to get to it and away from it.
     *
     * Disabled rather than softened, because a penalty is a statement that the
     * move is a fault the idiom tolerates. This one is not tolerated, it is the
     * subject.
     */
    'tritone-leap': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * **`augmented-second` off entirely**, for the reason `core/scale.ts` gives
     * in advance at the top of its own non-Western block: a genre whose scales
     * contain a three-semitone step has to relax this or the generator refuses
     * every characteristic move those scales exist to make.
     *
     * Three of the six modes in `MINOR_LADDER` contain one. `harmonicMinor` has
     * the ♭6→♮7, which is where the rule was aimed and where it is correct for
     * iskelmä; `phrygianDominant` has the ♭2→♮3, which is the single most
     * recognisable interval in neoclassical metal and is the *reason* `shred`
     * exists; `hungarianMinor` has two. Reggae disables this rule and notes it is
     * inert on nineteen of its twenty-one styles. It is not inert here — it fires
     * on every bar of every phrygian-dominant passage, which is what half the
     * `shred` and `symphonic` tables produce.
     */
    'augmented-second': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * **`flat-nine` softened to a preference at the top level only.**
     *
     * The rule vetoes a melody note a semitone above the chord root, held on a
     * beat, and calls it *"the harshest interval available short of a cluster"*.
     * In phrygian that note is the ♭2 over the tonic, which is not a harsh
     * accident — it is the mode's defining degree, the thing that makes a phrygian
     * riff phrygian rather than aeolian, and the note `black` and `thrash` build
     * whole verses on by alternating `i` and `bII`.
     *
     * The rule's exemption for `dom7b9` shows it already understands the
     * principle: *there it is the point*. Here it is the point over a chord that
     * has no seventh and no third to be a ♭9 of. Softened rather than disabled,
     * because on the four triadic styles — `glam`, `power`, `gothic`,
     * `symphonic` — a held ♭2 over a real major chord is exactly the fault the
     * rule describes, and at `polished` it should still be caught.
     */
    'flat-nine': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.5 },

    /**
     * **`repeated-note-run` softened**, because the pedal note is the riff.
     *
     * The rule vetoes three identical notes in a row from strictness 2. A metal
     * riff is frequently one pitch — the open string, struck sixteen times a bar —
     * with the *figure* happening in the rhythm and in whatever lands on top of
     * it. `thrash`'s first verse progression is a pedal with a ♭II falling onto
     * it; `djent`'s cycle is six strokes of which four are the same note. If the
     * melody may not do what the riff is doing, the tune and the guitar are
     * arguing.
     *
     * Softened rather than disabled: the rule catches a line that has stalled,
     * and a metal line can absolutely stall. It just does it later than a line in
     * any other genre here, because a repeated note against a moving bar is a
     * rhythmic event rather than a stationary one.
     */
    'repeated-note-run': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.9 },

    /**
     * **`unprepared-dissonance` pushed up two levels**, exactly as jazz does and
     * for a related reason from a different direction.
     *
     * The rule says a non-chord tone must be approached by step, which is what
     * makes a passing note sound intentional. It assumes the chord under the line
     * is a full one — and under a power chord, *most of the scale is a non-chord
     * tone*: the third, the sixth and the seventh are all outside a root-and-fifth
     * dyad, so a line that only ever leapt to chord tones would be leaping between
     * two notes. The rule is measuring the wrong denominator here rather than
     * being wrong in itself.
     */
    'unprepared-dissonance': { minLevel: 3, vetoLevel: 4, penalty: 0.5 },

    /**
     * **`parallel-perfects` demoted to a top-level preference**, and this is the
     * one override that protects a *device* rather than a note.
     *
     * The rule is a choral prohibition about two independent lines fusing into
     * one. In this genre they are supposed to fuse: `arrangement.unison` above is
     * weighted at 6 precisely so the bass and the guitar play the same figure in
     * octaves, which is parallel octaves for the length of the song and is how a
     * riff gets its weight. The twin-guitar harmony is the same argument at a
     * different interval — thirds mostly, but a fifth wherever the mode puts one,
     * and a NWOBHM harmony line that broke off to avoid a parallel fifth would be
     * a NWOBHM harmony line with a hole in it.
     *
     * Inert at this genre's own default of level 1, so this is written for the
     * case that would otherwise break silently: somebody running the catalogue at
     * `--strictness strict` and getting a genre whose central arrangement device
     * has been quietly vetoed.
     */
    'parallel-perfects': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.6 },

    /**
     * **`wide-leap`'s penalty halved**, and its levels left alone.
     *
     * The smallest of the seven. The rule penalises anything beyond a perfect
     * fourth from strictness 2 and exists as a counterweight — without it, the
     * vertical rules push a line onto chord tones and chord tones are thirds
     * apart, so raising strictness makes a melody *less* smooth. That reasoning
     * holds here and the rule stays on. What does not hold is the size of the
     * thumb on the scale: a metal lead leaps by design, the styles ask for spans
     * of 19 to 24 semitones, and `shred`'s whole proposition is a line that
     * covers the neck. 0.3 to 0.6 is the difference between discouraged and
     * effectively forbidden once several of them compound.
     *
     * `oversized-leap` — anything beyond an octave — is deliberately left
     * untouched at its veto. Even here that is a mistake rather than a gesture.
     */
    'wide-leap': { penalty: 0.6 },
  },

  /**
   * The rhythm guitar is the record, and the two numbers that say so are the comp
   * and the bass.
   *
   * The shared defaults put the comp at 0.72, well behind the melody, which is
   * correct everywhere else: a chordal part is accompaniment. Here it is the
   * *subject*. Somebody who has heard one of these records remembers the riff,
   * and the riff is on this layer; 0.9 puts it within a decibel of the lead,
   * which is where these mixes actually sit and is unfashionably loud by every
   * other genre's standards.
   *
   * The bass goes the other way, from 0.63 down to 0.55, and this is the number
   * that will look like a mistake. It is not. A metal bass is *felt rather than
   * heard*: it doubles the guitar an octave down, so it adds weight to a part
   * that already exists rather than stating anything of its own, and a mix that
   * brought it forward would produce two audible copies of the same line. The
   * most famous album in the genre has no bass on it at all, by accident, and
   * took twenty years for most listeners to notice.
   *
   * Drums at 0.8, up from 0.59, because the kit is this genre's clock — see the
   * factories in `styles.ts`. The pad is furthest back of anything here except
   * ambient's own inversion: a string pad in metal is something a producer added,
   * not something the arrangement was written over. `brass` is that same
   * orchestral layer and sits with it.
   */
  mix: {
    comp: 0.9,
    melody: 0.94,
    drums: 0.8,
    counter: 0.76,
    bass: 0.55,
    pad: 0.4,
    brass: 0.5,
  },

  /**
   * The kit, mixed as the thing keeping time rather than as the thing decorating
   * it.
   *
   * `bd` at 1.0 and `sd` at 0.98 are the two numbers that matter and they are
   * both near the ceiling, which is unusual — most genres here put the snare a
   * clear step under the kick. In a blast beat they are one instrument
   * alternating at the sixteenth, and a snare mixed under the kick turns that
   * alternation into a limp. Under a double kick the snare is the only thing
   * still stating a beat.
   *
   * The toms are high, at 0.82, because in this genre a tom fill is a *structural
   * event* — it is what announces a riff change, and `fills` below weights
   * `tom-roll` above everything for that reason. The hats are the lowest of any
   * genre here: at 200 BPM a hi-hat on the eighths is 27 events a second, and at
   * any level at all it becomes a continuous hiss sitting exactly where the
   * cymbals and the guitar fizz already are.
   *
   * `lp`, `mp` and `hp` are up at 0.6 for `folkmetal` alone, which is the only
   * style with a hand drum in it; `tb` is there for the same style's tambourine.
   * `cp` is near zero — a handclap in metal is a joke, and the one place it would
   * be reached is a bank substituting it for something else.
   */
  drumMix: {
    bd: 1.0, sd: 0.98, rim: 0.5, hh: 0.34, oh: 0.48, cp: 0.2,
    lt: 0.82, mt: 0.82, ht: 0.8, cr: 0.72, rd: 0.55, perc: 0.4, cb: 0.35,
    sh: 0.28, tb: 0.42, lp: 0.6, mp: 0.55, hp: 0.5,
  },

  /**
   * The guitar sits a fifth under the tune and it barely moves.
   *
   * `offsets` is a register statement rather than a level one, and the comp's is
   * the one this genre needs. A riff is played on the bottom two strings between
   * the open position and the fifth fret, which is roughly E2 to A3; the lead is
   * an octave and more above it. The default of 0 would voice the rhythm guitar
   * in the melody's own octave, where two distorted parts in one register fuse
   * into a single louder object and the tune stops being findable. −7 is a fifth,
   * which is about where a low riff sits under a chorus melody.
   *
   * **`response: { comp: 0.25 }` is a physical fact rather than a taste, and it
   * is the most interesting number in this file.** A guitar into a cranked
   * amplifier is a compressor: the clipping stage has 30 to 40 dB of gain
   * reduction in it, so playing harder changes the *timbre* — more harmonics,
   * longer sustain — and changes the level hardly at all. A distorted rhythm
   * guitar that swelled into the chorus like a string section would be describing
   * an instrument nobody has ever played. What actually gets louder in a metal
   * chorus is the drummer and the singer, which is why theirs are the two
   * responses left near the default.
   */
  layerPlan: {
    offsets: { comp: -7, pad: -10 },
    response: { comp: 0.25, bass: 0.35, drums: 0.7, melody: 0.8 },
  },

  /**
   * There is no `comping` profile, and the absence is the sharpest version of a
   * claim two other genres here also make.
   *
   * `CompingProfile` is three gestures a chordal player makes when accompanying:
   * leave a bar out, anticipate the barline, nudge an offbeat. Iskelmä refuses
   * all three because its chords are how the floor finds beat one; reggae refuses
   * them because its chops are how the floor finds where beat one *is not*. This
   * genre refuses them because **the figure is the composition**. Sixteen
   * identical bars of downpicked sixteenths is not a limitation a thrash band is
   * working around, it is the thing being demonstrated, and a guitarist who left
   * bar seven out would be admitting they could not do bar sixteen. The middle
   * gesture is the worst of the three here: anticipating the barline puts a chord
   * change an eighth early, and in a riff whose whole shape is where the chord
   * lands, that is a different riff.
   */

  /**
   * A large room, a short delay, and no feedback to speak of.
   *
   * `delayBeats: 0.5` is the one number here that disagrees with three other
   * genres at once. Ambient, synth and reggae all set 0.75 — three sixteenths, a
   * dotted eighth, chosen precisely because it never lands where the beat does.
   * A metal delay is the opposite instrument: it is a *doubling*, set to the
   * eighth so the repeat lands exactly on the next event and thickens it rather
   * than answering it. That is why the feedback is 0.2 and not 0.55 — one repeat,
   * maybe two, and gone. A dub echo is a second drummer; this is a second
   * guitarist playing the same note very slightly later, which is a chorus pedal
   * with delusions.
   *
   * The eras narrow it hard in both directions: `thrash` runs at 0.44 and
   * essentially dry, and `extreme` opens to 0.76.
   */
  space: {
    reverbSize: 0.6,
    delayBeats: 0.5,
    delayFeedback: 0.2,
  },

  /**
   * Standing production notes, refined by each era.
   *
   * **The comp's low-pass is the loudspeaker.** 6 kHz is not a mix taste — a
   * 4×12 guitar cabinet is a mechanical filter made of four heavy paper cones,
   * down about 20 dB by 5 kHz and gone above 6, and that filter is the only
   * reason a distorted guitar is listenable at all: clipping generates harmonics
   * indefinitely and the speaker throws away everything above the fifth. Remove
   * it and what you have is not a brighter guitar, it is a fuzz box played
   * through a tweeter. Every era below moves the number and none of them removes
   * it.
   *
   * The bass is dark and dry, and both halves are the instrument rather than the
   * desk: a pick on flatwounds through an 8×10 with the tweeter off has almost
   * nothing above 3 kHz, and reverb on a sustained low note arrives while the
   * note is still sounding and beats against it — the same sentence ambient and
   * reggae both write about their own basses, arrived at three times
   * independently because it is a fact about low frequencies.
   *
   * The kit is the wet one, which is the inverse of the guitars and is what makes
   * the two legible against each other. A close-miked guitar with no space around
   * it in front of a kit with a large one is the standing production of this
   * entire genre.
   */
  effects: {
    comp: { reverb: 0.14, lowpass: 6000 },
    melody: { reverb: 0.28, delay: 0.16, lowpass: 6600 },
    counter: { reverb: 0.28, delay: 0.14, lowpass: 6400 },
    bass: { reverb: 0.04, lowpass: 3000 },
    drums: { reverb: 0.34, lowpass: 11000 },
    pad: { reverb: 0.5, lowpass: 5000 },
    brass: { reverb: 0.46, lowpass: 6000 },
    vocal: { reverb: 0.32, delay: 0.14, lowpass: 7000 },
  },

  /**
   * The filter moves for two styles and stands still for twenty-two.
   *
   * `applyFilter` is a no-op unless both the genre and the style have declared
   * something, so this profile costs nothing on the styles that name no sweep and
   * their notes come back with no `brightness` field at all. Declaring it buys
   * the two that need it: `postmetal`, where a sixteen-bar opening genuinely is
   * the composition rather than a mix move, and `industrial`, where the filter
   * steps between sections because that is what a machine's front panel does.
   *
   * The `response` table is where this differs from synth's and reggae's. There
   * the sweep belongs to the sequencer and to the dub engineer's hands; here it
   * belongs to the **comp**, at 0.9, because there is only one thing on a metal
   * stage with a tone control that anybody touches mid-song and it is a guitar
   * amplifier. The drums are near zero: a filtered kit is a production decision
   * made once at the desk — the extreme era makes exactly that decision — and not
   * something that moves across a chorus.
   *
   * `kind` states only the disagreements. The intro is dark because these songs
   * open on a riff before the band arrives, and the outro stays wide open,
   * because a metal song does not diminish — it stops.
   */
  filter: {
    kind: { intro: 0.4, verse: 0.62, chorus: 1, bridge: 0.55, solo: 0.9, outro: 0.85 },
    response: { comp: 0.9, melody: 0.5, counter: 0.6, pad: 0.7, bass: 0.15, drums: 0.1 },
    build: 0.3,
  },

  /**
   * The band does not get out of the way, and the argument is the genre's central
   * one restated.
   *
   * Jazz thins out under a soloist because comping is a conversation. Iskelmä
   * refuses to because the floor is full. Here the rhythm section carries on
   * because **the riff is the song and the solo is a guest on it**: a metal solo
   * is played over the verse riff, unchanged, at the same volume, and a band that
   * dropped back for it would have removed the thing the soloist is soloing over.
   * `full` everywhere.
   */
  soloBacking: 'full',
  solo: {
    /**
     * The lead guitarist, then the other one, and the bass player once in a
     * hundred songs.
     *
     * `melody` and `counter` are the same instrument in this genre — see the era
     * palettes, where both layers draw `distortionGuitar` at the top — so this
     * rotation is literally the two guitarists in the band, which is the correct
     * and only answer. `bass` is at 1 rather than 0 because a bass solo in metal
     * is rare, famous where it happens, and genuinely part of the repertoire.
     * `comp` is absent: the rhythm guitarist taking a solo would leave nothing
     * holding the riff, which is precisely the situation `soloBacking: 'full'`
     * exists to prevent.
     */
    rotation: [['melody', 7], ['counter', 5], ['bass', 1]],
    /**
     * Zero, and it is a pointed zero rather than an omission.
     *
     * `tradeFours` means trading with the **drummer**, four bars each, which is a
     * jazz gesture and does not happen here. What does happen — constantly, and
     * as the genre's most recognisable spot — is two *guitarists* trading, and
     * that is not this field. It is `arrangement.trade` above, weighted at 3, and
     * putting it here as well would stage a drum solo every time somebody wanted
     * Judas Priest.
     */
    tradeFours: 0,
    /**
     * Low. A metal solo is a set piece with its own material — frequently written
     * out, frequently the only part of the song anybody learns — and one that
     * kept referring to the vocal line would be a paraphrase rather than a solo.
     * Reggae puts this at 0.6 because a version is the same song with the singer
     * removed; this is a different song inside the first one.
     */
    quoteMotto: 0.12,
    backing: { melody: 'full', counter: 'full', bass: 'sparse' },
    vocabulary: {
      /**
       * The fastest soloist in the project, by a distance, and every number in
       * the first half of this table says the same thing from a different side.
       *
       * `gait` at 0.2 against reggae's 0.65: a quarter-note solo over a
       * downpicked riff would sound like somebody had not noticed the band.
       * `doubleTime` at 0.5 is the highest here — sixteenths and beyond are the
       * default rather than the climax. `space` at 0.1 is the lowest, and it is
       * the genre's most-criticised property honestly stated: a metal solo fills
       * every bar it is given, because the eight bars are all it gets and the
       * band is not going to leave a hole for it.
       */
      gait: 0.2,
      doubleTime: 0.5,
      offbeatAccent: 0.22,
      enclosure: 0.15,
      /**
       * Real but modest. The chromatic run down the neck is a genuine device —
       * it is most of what a thrash solo is made of — but this genre's
       * chromaticism is a *gesture in one direction* rather than jazz's
       * note-by-note approach vocabulary, and a high number here produces the
       * second thing.
       */
      chromatic: 0.24,
      /**
       * High, and this is where the bends and the vibrato live. Nothing else in
       * this project gets its expression so completely from what happens *after*
       * the note is struck: a metal lead line played without them is a scale.
       */
      ornament: 0.55,
      develop: 0.4,
      displace: 0.2,
      space: 0.1,
      /**
       * The steepest climb in the project. A metal solo starts low, goes up, and
       * stays up — the whole shape is an ascent to a held note at the top of the
       * neck, and the eight bars are organised around getting there.
       */
      climb: 6,
      paraphrase: 0.15,
      /**
       * 0.9, the highest anywhere, and it is the only gesture in this genre that
       * every single one of its twenty-four styles performs.
       *
       * The solo ends on a bent note held at the top of the range while the band
       * builds under it, and then the whole thing lands on the downbeat of the
       * last chorus together. Reggae puts this at 0.2 and argues that a version
       * does not deliver anything; this delivers, every time, and the delivery is
       * the point of having had a solo.
       */
      liftIntoReturn: 0.9,
    },
  },

  // Three minutes to six. A metal song is long by pop standards and short by its
  // own reputation; the top of this band is the doom and post-metal end, where
  // the fourth form's sixteen-bar sections genuinely need the room.
  duration: [185, 355],

  /**
   * The drummer announces the join, and then sometimes the whole band does.
   *
   * `fill` leads, as it does everywhere. What is unusual is `shot` at 4 and
   * `break` at 3, both high: this is a genre where the band arriving together on
   * a figure and the band stopping dead are two of its most-used gestures, and
   * they are used at *seams* specifically — the bar before the chorus, the bar
   * before the riff comes back. `metalcore` overrides this to put `break` first,
   * because a breakdown is announced by silence or it is not announced at all.
   *
   * `elide` is last and small. Running one section into the next without marking
   * it is a thing this music does only in its post-metal corner, where the whole
   * proposition is that nothing is announced.
   */
  transitions: [['fill', 6], ['shot', 4], ['break', 3], ['elide', 1]],

  /**
   * The drummer's vocabulary, led by the one fill everybody can hum.
   *
   * `tom-roll` at 6 is the highest single weight any genre gives any fill shape
   * here, and iskelmä's own tables call the descending tom roll a *dance-band
   * signature*. It is, and this genre took it and made it structural: a fill
   * down the toms into a crash is how a riff change is announced, it happens
   * several times a song, and a listener uses it to navigate. `snare-toms` and
   * `snare-roll` behind it are the faster styles' version of the same gesture at
   * a tempo where a four-tom descent will not fit.
   *
   * `drop` is present at 2 and is the same argument reggae makes for weighting it
   * heavily: the most effective fill is sometimes no fill. `cymbal` — jazz's
   * cymbal-and-kick with no toms anywhere — is at 1 and is nearly out of place,
   * kept because at 240 BPM it is the only shape that physically fits. `rim` is
   * absent: a cross-stick figure is a decoration for a room with less going on in
   * it than this one.
   */
  fills: [
    ['tom-roll', 6], ['snare-toms', 4], ['snare-roll', 3],
    ['lead-in', 2], ['drop', 2], ['cymbal', 1],
  ],

  /**
   * The scale rule: follow the key, bend as far as the chord requires, and fall
   * back on the five notes nothing is arguing about.
   *
   * Rooted on the tonic and searched outward from the key's own mode, so the
   * smallest possible change is made to admit whatever chord has arrived. What
   * falls out is the harmonic behaviour this music actually has:
   *
   *     i, iv, VI, VII under a minor key  →  aeolian, unchanged
   *     bII under a minor key             →  phrygian      (the riff mode)
   *     IV major under a minor key        →  dorian        (the folk-metal sixth)
   *     V major under a minor key         →  harmonic minor (the neoclassical cadence)
   *     I major under a minor key         →  phrygian dominant (the shred mode)
   *     bVII under a major key            →  mixolydian    (the borrowed seventh)
   *
   * The third and fifth lines are the interesting ones and neither needed a style
   * override to reach. `folkmetal` writes `i–IV` and gets dorian; `shred` writes
   * a major tonic inside a minor key and gets phrygian dominant, which is exactly
   * the mode that style exists to play. A genre whose chords have no thirds in
   * them can put a major triad in a minor key without contradiction, and the
   * ladder turns that into the right scale by itself.
   *
   * ## The fallback is a pentatonic, and it is this genre's own answer
   *
   * When no mode on the ladder holds the chord, reggae stays in the key and lets
   * the chord tone be a colour. That is right for a genre with two chords in most
   * of its verses. It is not right here, because the chords that get this far are
   * a specific and important set — the `bV`, which is in five styles' tables and
   * belongs to no mode of anything — and staying in aeolian over one produces a
   * line that is confidently in the wrong key rather than one that is being
   * ambiguous on purpose.
   *
   * So the fallback is **the minor pentatonic on the tonic**, and it is what a
   * lead player actually does when the harmony stops making sense: it drops the
   * second and the sixth, which are precisely the two degrees the ladder above
   * spends all its time arguing about — ♮2 against ♭2, ♭6 against ♮6 — and keeps
   * the five that every mode in the list agrees on except at the seventh. It is a
   * *subset of the key* rather than a departure from it, so nothing is
   * contradicted; it simply declines to answer the question the chord is asking.
   * That is a real gesture with a name and half this genre's solos are made of
   * it. In major the same rule gives the major pentatonic, which drops the fourth
   * and the seventh — again the two degrees a borrowed chord is most likely to
   * contradict.
   */
  scaleForChord: (tonic, mode, chord) => {
    const ladder = mode === 'minor' ? MINOR_LADDER : MAJOR_LADDER;
    const tones = chordPcs(chord);
    for (const name of ladder) {
      const scale = makeScale(tonic, name);
      if (tones.every((t) => scale.pcs.includes(t))) return scale;
    }
    return makeScale(tonic, mode === 'minor' ? 'minorPentatonic' : 'majorPentatonic');
  },

  /**
   * The shed, the backline and the flyer. See `staging.ts`.
   */
  staging: STAGING,
};
