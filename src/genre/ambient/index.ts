/**
 * Ambient.
 *
 * The third answer to the question that made `Genre` an abstraction: where
 * does the melody get its notes?
 *
 * Iskelmä answers "from the key" and jazz answers "from the chord". Ambient
 * answers "from the drone" — there is one tonal centre for the whole piece and
 * it never moves, and a chord is a colour that passes underneath it rather than
 * something the line re-orients around. `scaleForChord` below implements
 * exactly that: it always returns a scale rooted on the *tonic*, and only
 * chooses which mode of the tonic by asking which one happens to contain the
 * chord.
 *
 * The consequence worth stating is what the rule refuses to do. It can never
 * return harmonic minor, because harmonic minor exists to manufacture a leading
 * tone, and a leading tone is a promise that the music will resolve. Ambient
 * does not resolve; that is the genre. A ♭II under an A-minor drone bends the
 * line to A phrygian, a ♭VI under a C-major one bends it to C aeolian, and in
 * both cases the tonic is still A and still C. Nothing modulates, ever.
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
 * The seven-note modes of one tonic, ordered brightest to darkest — which is
 * to say ordered by the circle of fifths, each step flattening exactly one
 * degree of the one before it.
 *
 * Ordering them this way is what makes "nearest mode" a meaningful idea:
 * neighbours here differ by a single note, so bending the scale to admit a
 * chord changes as little as it possibly can. Locrian is deliberately absent —
 * its flat fifth makes the tonic itself unstable, and a drone whose own tonic
 * chord is diminished is not a drone.
 */
const BY_BRIGHTNESS: ScaleName[] = [
  'lydian', 'major', 'mixolydian', 'dorian', 'minor', 'phrygian',
];

/**
 * Sections are long and there are few of them. The kinds keep their names for
 * the sake of every other part of the engine, but they mean texture stages
 * here rather than song parts: `intro` is the bare drone, `verse` adds the
 * line, `chorus` is the fullest the piece gets, `bridge` is the one harmonic
 * departure, `outro` thins back out.
 *
 * No `solo` sections anywhere. A blowing chorus is a jazz idea and there is
 * nothing in ambient it corresponds to.
 *
 * The genre also carries no `SoloProfile`, and the two facts have to agree:
 * a form with a solo section and no profile would put the lead layer on the
 * counter instrument and call it a solo, which is the behaviour the solo
 * engine exists to replace. `npm run genres` asserts both halves — no solo
 * section is ever generated, and no `Section.solo` is ever set — because this
 * is a negative claim and negative claims are the ones an innocent edit
 * quietly undoes. A genre that refuses to have a foreground is a genre whose
 * staging has to mean something else; see `docs/concert-plan.md` §4.3.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'verse', bars: 16 },
    { kind: 'chorus', bars: 16 }, { kind: 'verse', bars: 16 },
    { kind: 'outro', bars: 8 },
  ], 5],
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 16 },
    { kind: 'bridge', bars: 16 }, { kind: 'chorus', bars: 16 },
    { kind: 'outro', bars: 8 },
  ], 4],
  // The one that barely has a form at all: five equal blocks that drift into
  // one another, with a single departure two thirds of the way through.
  [[
    { kind: 'intro', bars: 16 },
    { kind: 'verse', bars: 16 }, { kind: 'verse', bars: 16 },
    { kind: 'bridge', bars: 16 }, { kind: 'verse', bars: 16 },
    { kind: 'outro', bars: 16 },
  ], 4],
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'bridge', bars: 8 }, { kind: 'chorus', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'outro', bars: 8 },
  ], 3],
];

export const ambient: Genre = {
  id: 'ambient',
  label: 'Ambient',
  description: 'Hauntology, wasteland drone, pure drone, Berlin-school sequencers, sacred minimalism and deep ambient techno.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,
  keys: {
    // Chosen for *register*, not for fingering — nothing here is played by
    // hand. A drone lives or dies on where its fundamental sits: too low and
    // it is mud on any speaker smaller than a room, too high and it stops
    // reading as a floor for the music to stand on. C through F, and their
    // relatives, put the bass root between roughly 65 and 90 Hz, which is
    // where a sustained tone is felt without swallowing everything above it.
    minor: [[2, 5], [9, 5], [4, 4], [0, 4], [7, 3], [11, 3], [5, 2], [10, 2]],
    major: [[0, 5], [5, 5], [2, 4], [7, 4], [10, 3], [3, 3], [9, 2]],
  },

  // The rules exist to stop a line sounding wrong, and this line has a lot of
  // time to be heard in — a note that lasts four seconds is exposed in a way a
  // passing eighth never is. `standard` rather than `light`, and the two styles
  // where everything sustains at once (`drone`, `choral`) raise it further.
  // Neither end of an ambient piece is an event. It is already going when you
  // arrive and it is still going when you leave; the last chord is simply let
  // go of, and there is nobody to count in music that never starts.
  ending: 'fade',
  countIn: false,

  defaultStrictness: 'standard',

  // Ambient is loop music. The same eight bars come round again with something
  // different on top, and a section that arrived with a fresh tune every time
  // would be a suite rather than a piece. `catchy` locks the rhythm and recalls
  // every section; `drone` pushes it to the top and `wasteland` pulls it back,
  // which between them is most of the distance across the genre.
  defaultHook: 'catchy',

  /**
   * Ambient has no band in it, so most of the arrangement devices have nothing to
   * happen between.
   *
   * `trade` and `tutti` are both gestures *players* make at each other — one stops
   * so another can speak, or five of them agree to hit the same thing. This music
   * has no players in that sense: it has layers that were already sounding when
   * the piece started. A tutti hit in the middle of a drone is a door slamming.
   * `riff` goes for the same reason a rhythm is not the point here.
   *
   * What is left is the two that are about *sound* rather than about conversation.
   * Two pads an octave apart is a real ambient texture and one of only two things
   * in that list this music does at all — `trade`, `tutti` and `riff` are zeroed
   * outright — so `unison` is
   * weighted up rather than merely left in. Six is not the largest `unison` in
   * the project; arabic writes 9 and indian 8, and both of those are a band
   * playing one line rather than two pads an octave apart.
   *
   * `swell` is not listed, and not because it would be wrong — a chord growing
   * under a held note is the most ambient gesture in the whole table. It needs the
   * `brass` layer, every one of the six styles below excludes that layer, and the
   * note at the top of `ambient/eras.ts` says the brass palette here is vestigial
   * on purpose. A weight would read as an intention the styles have already
   * refused; the honest version is to leave it at the pool default, where it is
   * simply never available.
   *
   * The practical consequence is that about two thirds of ambient pieces draw no
   * device at all. That is the correct answer for this music rather than a gap.
   *
   * `harmony` stays a draw and is deliberately not lifted to `Genre.harmony`.
   * The 2 is the pool's 4 halved — this genre does not sing in thirds — and five
   * of the six styles have no second line in them at all: `drone` and `aquatic`
   * exclude the `counter` layer outright, `wasteland`'s instruction to itself is
   * that nothing comes back sounding meant, and `hauntology` and `kosmische` are
   * one lead over a texture. `choral` is the exception and declares its own; a
   * genre-level property would be that one style's claim written into the tier
   * that governs six.
   */
  arrangement: { trade: 0, tutti: 0, riff: 0, unison: 6, harmony: 2 },

  /**
   * What the tune is made of.
   *
   * The header above asks where the melody gets its notes; this is the other
   * half, which is what it does with them. Three fields and no more: the six
   * `voiceForStyle` derives are left where the styles put them, because they
   * genuinely disagree — 1.14 onsets a bar in `drone` against 2.45 in
   * `hauntology`, a span of 12 in `aquatic` against 20 in `wasteland` — and a
   * genre-wide number would flatten a distinction those tables already state.
   *
   * None of the six styles is one of the three voices registered by id, so this
   * governs all of them. `kosmische` is worth naming anyway: it is the same
   * records `berlin` in `tune/voice.ts` was authored from, and the weights here
   * are that voice pushed one step further — berlin is a synth style with a lead
   * over a sequencer, and this is the genre that refuses to have a foreground.
   *
   * **The archetypes.** `long-note` carries it, and the evidence is in every
   * style's `cadenceCells`: a whole-bar note is the top row of all six, at weight
   * 6 to 9, and `drone`'s melody cells are `[16]` at 8 of 22 with a bar of
   * silence beside it. `chant` is second on the hooks: `defaultHook` above is
   * `catchy` for the genre and `drone` sets `earworm` under its own note that
   * this is the one place in the project where maximum repetition is *a
   * description of the genre rather than a setting applied to it*, and a chant is
   * one note repeated with a tail. `ruleOverrides` below points the same way —
   * this is the only genre that lifts `static-repetition` outright, where eight
   * others soften it to 3 or 4 — but that is corroboration rather than a second
   * argument, and the difference is one both neighbours insist on. Arabic
   * declines to weight `chant` at all because its own softening already pays for
   * the observation, *the ornament is kept in the rule table and not bought a
   * second time here*; synth refuses to raise two entries off one fact. What
   * makes this not that: the override lifts a veto on a line the judge would
   * otherwise refuse, and this weight decides how often that line is drawn.
   *
   * `arch-hook` is the derivation's worst guess here. `archetypesFor` hands it a
   * flat 3 to all six styles, which is the top of the table in five of them —
   * `drone` is the exception, where 1.136 onsets a bar give `long-note`
   * 0.4 + (3 − 1.136) × 1.4 = 3.01. The separator is `density` and not `peakAt`:
   * `ARCHETYPES['arch-hook']` multiplies onsets a bar by 1 where `long-note`
   * multiplies by 0.45, against the 1.14 to 2.45 the styles declare, and its
   * `peakAt` of [0.55, 0.72] would demote nothing — `long-note`'s own window is
   * [0.5, 0.78] and contains it. The form comment above says these section kinds
   * mean texture stages and `chorus` means only *the fullest the piece gets*,
   * which is an argument about how many notes there are and not about where the
   * high one falls.
   *
   * `riff-response` is last because the genre has said so twice: `arrangement`
   * zeroes `riff`, `trade` and `tutti`, and `drone` and `aquatic` exclude the
   * `counter` layer outright, so there is nothing here to answer. `chant` brings
   * the *form* of that name back at 3 of its own 8, and that is not the claim
   * undone: `grammar.ts`'s `riff-response` is a phrase template — a figure and
   * the answer to it, inside one line on one instrument — where
   * `arrangement.riff` is a second player.
   *
   * **The twin, and which key separates it.** On the fingerprint `dnb/index.ts`
   * defines — duration classes, interval classes, density and turn rate —
   * ambient's melodies sit closer to dnb's than to any other genre's, 0.116
   * against a mean pairwise 0.382. The cause is in the cells: dnb's `minimal`
   * declares `[16]` at 8 and `[-8,8]` at 4, which is the top of `drone`'s table
   * at the same two weights, the four rows below them being drone's own and
   * carrying 10 of its 22 — so derivation reads two nearly empty tables as one
   * music. dnb answers this from its side and names the axis: `archetypes`
   * separates them, `chant` at the top over `long-note` *held* at 2.5. This
   * table is that ordering inverted, 6 over 3, and the inversion is the whole
   * disagreement — both genres write few long notes, and only one of them has a
   * figure to restate.
   *
   * `descending-sequence` at 1.5 is no part of that separation and must not be
   * read as one: dnb's own voice sets it to 0.8, which is below this. It is a
   * correction to the derivation, which reads `melody.sequence` as an appetite
   * for walking a figure down the scale and returns 1.75 to 2.65 from the six
   * styles' 0.25 to 0.55. What that number means in these tables is how much a
   * figure is restated at all, and the restatement here is in place rather than
   * a step lower — `defaultHook: 'catchy'` recalls every section. `choral` is
   * the one style that loses by it, since the descending aeolian tetrachord its
   * own progression note names is a walked figure; 1.5 rather than 0.5 leaves it
   * about one section in nine of this table rather than one in twenty-four, and
   * a style that wants the archetype outright has `Style.voice` for it.
   *
   * **The subsets.** The neighbour to state these against is synth, whose file
   * opens by tabulating seven fields where the two genres say opposite things.
   * Its voice already declares `[0,1,3,4,6]` at 5 — modal, no third to commit a
   * line to a mode the harmony left open, sus2 and sus4 as the vocabulary,
   * `avoid-fourth` disabled — which is word for word the argument this file
   * would have made for it, and `docs/voices-plan.md` calls `subsets` the single
   * most audible one-line decision in the engine. Buying that decision twice is
   * not available, so it stays here as a colour at 1.5 and the weight goes to
   * the one thing this genre has that synth does not: a tonic that never moves.
   * `keyChangeChance` is 0 in all three eras and `scaleForChord` below re-roots
   * every scale on the tonic, so what a passing chord changes is *which mode*,
   * for the length of the piece.
   *
   * `[0,3,4]` — 1̂ 4̂ 5̂ — is that written as degrees. Only 0 and 4 hold their
   * interval across all six of `BY_BRIGHTNESS`, and 3 moves in lydian alone,
   * which needs a ♯4 in the chord to be reached; everything else is moved by the
   * bends the header names, major → aeolian under a ♭VI shifting degrees 2, 5
   * and 6 and minor → phrygian under a ♭II shifting degree 1. So this is the set
   * no chord in these tables can contradict — which is also the correction the
   * ♭II makes to the old reading here, since it bends the *second* and leaves
   * the third alone. It is the quartal sound itself rather than an abstraction:
   * 1–4 and 5–1 are the two fourths of `drone`'s `quartal-held` comp at weight 7
   * and of the `isus4` and `Isus2` in the progressions. Three degrees is the
   * fewest `snapToSubset` will act on at all, every pitch class is inside the two
   * semitones it searches so nothing falls through to the scale, and where the
   * snap would collapse a step `unstall` puts a scale note back — the line passes
   * through the mode rather than being caged in three notes.
   *
   * The full diatonic leads, and here it is not the non-decision it is
   * elsewhere: `scaleForChord` has already picked one of six modes of a fixed
   * tonic, so all seven degrees mean the line follows the bend instead of
   * sitting out of it, and phrygian's seven notes are not lydian's. It is what
   * `choral` needs besides — a stepwise modal line cannot be written in a scale
   * with holes in it — and synth keeps it at 2, so the ordering is a
   * disagreement rather than a copy. `[0,2,3,4,6]` is the pentatonic
   * `hauntology`'s childlike small-span melody is made of, and it is minor in a
   * genre that is 55 to 94 per cent minor. The bright `[0,1,2,4,5]` is gone
   * rather than demoted: it drops the fourth and the seventh, which are the two
   * degrees this music is built on, and the styles that go major roughly half
   * the time are served by `[0,3,4]`, which is the same three pitches in either
   * mode.
   *
   * **The ops.** `augment` and `fragment` are the two this music actually does
   * and derivation reaches neither — both sit at the fallback 1 today. They land
   * in the same place, because `opsFor` charges only a row's *first* op: `close`,
   * the intent every form's last slot carries, is `[fragment, augment]` at 3,
   * `[fragment, augment]` at 3, `[augment]` at 2 and `[reharmonise]` at 1, so
   * 1.5 and 1.8 hand the two of them 12.6 of that intent's 12.9. A figure that
   * comes back shorter and slower is how every phrase group here ends, and
   * `augment` losing whatever falls off the end of the canvas is the thinning
   * that ends every piece. `wasteland`'s "fragments, not themes — nothing here
   * should come back sounding like it was meant to" is one style saying it
   * loudest, not the reason. The same `fragment` also raises `develop`'s two
   * `[fragment, sequence]` rows from 3 to 4.5 and their second op is a walked
   * figure — but `develop` is fragment-led here at any weight, since `diminish`
   * below takes the 8 its two rows carry of that intent's 17.5 down to 2.
   *
   * `transpose` up, and not because a figure should move. `opsFor` falls back to
   * this appetite for a row with no ops in it at all, so it also charges the
   * *verbatim* repeat at 2 + repetition × 8 — which is `defaultHook: 'catchy'`
   * and `drone`'s `earworm` asking for the thing they describe, and the same
   * lever synth pulls to 1.7. Where it does move pitch it moves it once: in the
   * `sequence` intent it lifts the two `transpose` rows over the staircase row,
   * which is the sentence `descending-sequence` makes above. `sequence` at 0.7
   * against a derived 1.0 to 1.6 is the other half of that, and it reaches only
   * that one row, weighted 2 + stride.
   *
   * `expand` down to 0.5, because it and `wide-interval` at 1 are one statement:
   * `types.ts` glosses it *identical shape, wider intervals*, and the leap of
   * 0.12 to 0.28 that put `wide-interval` below all six derived values is the
   * same number. Left at its derived 0.84 to 1.16 it would be the top row of
   * `vary` once `ornament` and `diminish` come down, and `vary` is what every
   * tile past the first draws when the repetition roll fails, in a genre whose
   * sections are 8 and 16 bars. `diminish` down, which is the heaviest option in
   * `opsFor`'s `develop` because it is the engine's only route to a fast passage,
   * and this is the one genre with no use for one; `reharmonise` down, because it
   * snaps strong beats onto the passing chord and the whole of `scaleForChord` is
   * that the drone never notices the chord. `ornament` at 0.3 overrides a floor
   * rather than a reading — the derivation is `0.4 + ornament * 3`, and with this
   * genre declaring 0.02 to 0.10 the constant is nearly all of it. `displace` is
   * deliberately not here: a figure that enters late is the wasteland sound, and
   * the cells already say so as leading rests that `cellAccents` reads straight
   * into the table.
   */
  voice: {
    archetypes: [
      ['long-note', 6],
      ['chant', 3],
      ['descending-sequence', 1.5],
      ['arch-hook', 1],
      ['wide-interval', 1],
      ['riff-response', 0.3],
    ],
    subsets: [
      [[0, 1, 2, 3, 4, 5, 6], 4],
      [[0, 3, 4], 3.5],
      [[0, 2, 3, 4, 6], 3],
      [[0, 1, 3, 4, 6], 1.5],
    ],
    ops: {
      augment: 1.8, transpose: 1.6, fragment: 1.5,
      sequence: 0.7, expand: 0.5, ornament: 0.3, reharmonise: 0.3, diminish: 0.25,
    },
  },

  /**
   * Where ambient disagrees with the shared rule table.
   *
   * The table was written from classical voice-leading and general arranging
   * practice, and most of it survives the move — a leap of a seventh is
   * unplayable in any idiom. But a handful of rules encode assumptions this
   * music explicitly rejects, and enforcing them produces something that
   * sounds like a slow ballad rather than like ambient.
   */
  ruleOverrides: {
    // The load-bearing one. Ambient has no dominant function; where a chord on
    // the fifth appears at all it is minor, and asking a line to resolve its
    // leading tone is asking for the one gesture the genre is defined by not
    // making.
    'unresolved-leading-tone': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    // A seventh here is a colour in a held chord, not a dissonance under
    // pressure. `i9` sustained for eight bars does not owe anyone a resolution.
    'unresolved-seventh': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.7 },

    // Parallel motion is the texture. Planing a voicing up a step, organum in
    // fifths, a pad moving in blocks — all parallel by construction, and all
    // idiomatic rather than faulty.
    'parallel-perfects': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    // The eleventh over a major chord is an *avoid* note in jazz and the
    // default sound here: sus2, sus4 and quartal voicings are what open
    // harmony is made of.
    'avoid-fourth': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    // Repetition is not monotony in this idiom, it is the form. A line that
    // sounds the same pitch four times over sixteen seconds is a pulse, and the
    // rule exists to catch a melody that has stalled — which is a different
    // thing that ambient has no way of doing, because it is barely moving on
    // purpose.
    'static-repetition': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },
    'repeated-note-run': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.85 },

    // The dark end of this genre is built out of the semitone: a ♭II leaning
    // on a drone from above is the wasteland sound, and the ♭9 it creates
    // against the pedal is the point rather than an accident. Kept as a mild
    // preference at the smoothest setting only.
    'flat-nine': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.6 },
  },

  /**
   * The pad is the piece.
   *
   * Every other genre here mixes a dance band: the tune on top, the pad a long
   * way behind it holding the harmony up. Ambient is the same three layers in
   * the opposite order, and the numbers below are a statement about the music
   * rather than a taste in mixing — a melody louder than the texture it sits
   * in is simply a different genre played slowly.
   *
   * Each one is divided by the mean trim of the pool it draws from, so the
   * statement survives `render/source-levels.ts` unchanged. The counter moved
   * furthest by a long way — those are the quietest fonts in the catalogue, and
   * calibrating them had lifted an answering line 4.4 dB into a genre whose
   * entire argument is that nothing answers loudly.
   */
  mix: {
    // `melody` and `bass` carry the catalogue's 2 dB trim; see `gains` in generate/song.ts
    pad: 0.71,
    comp: 0.44,
    bass: 0.58,
    melody: 0.43,
    counter: 0.24,
    // The kit, where there is one, is a texture at the back of the room rather
    // than the thing keeping everyone together. Less than half the level every
    // other genre gives it.
    drums: 0.29,
  },

  /**
   * And quieter still where it would poke out.
   *
   * Turning the whole kit down is not the same as making it sit back, because
   * the voices do not all misbehave equally. A hat is a burst of energy at 8
   * kHz, exactly where hearing is sharpest, so it stays audible long after the
   * kick has vanished — an ambient kit turned down uniformly becomes a
   * disembodied tick. The transients come off hardest and the low end is left
   * nearly alone, since a soft kick is most of what makes a beat feel like
   * weather rather than timekeeping.
   */
  drumMix: {
    bd: 0.85, sd: 0.4, rim: 0.35, hh: 0.18, oh: 0.2, cp: 0.3,
    cr: 0.25, rd: 0.22, sh: 0.2, perc: 0.45, cb: 0.25,
    lt: 0.5, mt: 0.5, ht: 0.5,
  },

  // A large, slow room and a dotted-eighth echo. The delay length is the one
  // number here that is a genre convention rather than a preference: three
  // sixteenths against a four-beat bar never lands where the beat does, which
  // is why every echo in this music has used it since the first tape units.
  space: {
    reverbSize: 0.78,
    delayBeats: 0.75,
    delayFeedback: 0.42,
  },

  /**
   * The genre's standing production notes, true whichever decade an era is
   * pretending to be from. Eras refine these; nothing here is absolute.
   *
   * Two of them carry most of the weight:
   *
   *  - **The bass stays dry.** Reverb on a sustained low tone is the fastest
   *    way to turn a floor into mud — the tail arrives while the note is still
   *    sounding and the two beat against each other. Everything above it can be
   *    as wet as it likes precisely because the bottom is not.
   *  - **The kit is filtered, not just quiet.** A lowpass at 2 kHz is what
   *    turns a drum machine into something heard through a wall, and it does
   *    the job that pulling the fader down cannot: a quiet hat is still a hat,
   *    a filtered one is air.
   */
  effects: {
    pad: { reverb: 0.85, lowpass: 5000 },
    comp: { reverb: 0.7, lowpass: 6000 },
    melody: { reverb: 0.72, delay: 0.28, lowpass: 7000 },
    counter: { reverb: 0.85, delay: 0.35, lowpass: 6000 },
    bass: { reverb: 0.1, lowpass: 1200 },
    drums: { reverb: 0.45, lowpass: 2000 },
    vocal: { reverb: 0.9, lowpass: 5000 },
  },

  // Three to five and a half minutes. Long by the standards of everything else
  // here and short by the standards of the genre, which is a deliberate
  // compromise: this has to work in a rotation.
  duration: [190, 340],

  /**
   * The drone rule.
   *
   * Always rooted on the tonic. The mode is whichever of the seven-note modes
   * of that tonic sits closest to home while still containing every note of
   * the chord — searched outward from the key's own mode, brighter side first,
   * so a chord that could be admitted in two directions takes the lighter one.
   *
   * What falls out of it is exactly the harmonic behaviour this music has:
   *
   *   ♭VII under a major drone  →  mixolydian on the tonic
   *   ♭VI  under a major drone  →  aeolian    on the tonic  (the Boards of
   *                                                          Canada mixture)
   *   IV   under a minor drone  →  dorian     on the tonic
   *   ♭II  under a minor drone  →  phrygian   on the tonic  (the wasteland)
   *
   * In every case the tonal centre is untouched. The chord recolours the scale
   * and the drone underneath never notices.
   */
  scaleForChord: (tonic, mode, chord) => {
    const home = BY_BRIGHTNESS.indexOf(mode === 'minor' ? 'minor' : 'major');
    const tones = chordPcs(chord);

    for (let distance = 0; distance < BY_BRIGHTNESS.length; distance++) {
      // Brighter first: given a choice, this music leans toward the open sound.
      const candidates = distance === 0 ? [home] : [home - distance, home + distance];
      for (const index of candidates) {
        const name = BY_BRIGHTNESS[index];
        if (!name) continue;
        const scale = makeScale(tonic, name);
        if (tones.every((t) => scale.pcs.includes(t))) return scale;
      }
    }

    // No mode of the tonic holds this chord — a genuinely chromatic sonority,
    // which these tables do not contain. Stay home rather than modulate: an
    // out-of-scale chord tone under an unmoved drone is a colour, and chasing
    // it would be the one thing this rule exists to prevent.
    return makeScale(tonic, mode === 'minor' ? 'minor' : 'major');
  },
  /**
   * Ambient mostly has no kit at all, and the styles that do should not
   * announce anything — the idiom's whole proposition is that sections arrive
   * without being signposted. Where a fill happens it is a shape, not a roll.
   */
  fills: [
    ['drop', 6], ['lead-in', 3], ['rim', 2],
  ],

  /** The black box, the anoraks and the gallery handout. See `staging.ts`. */
  staging: STAGING,
};
