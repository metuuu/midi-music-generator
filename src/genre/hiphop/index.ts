/**
 * Hiphop, 1979–2020.
 *
 * The block party and the house band, the twelve-bit sampler, the drawn 808 and
 * the trap record with eleven sounds on it. A repertoire this project could not
 * previously hold, and — unlike funk, which it is descended from twice over —
 * not because of the harmony. Because of the **voice**.
 *
 * ## The thing to say first, because everything else is downstream of it
 *
 * In a very large part of this music **there is no melodic instrument at all.**
 * The tune is a person saying words, the words are the composition, and this
 * engine's voice is wordless and vowel-led by construction: it sings an invented
 * language nobody ever sees and it doubles a line the melody engine already
 * wrote. There is no field on `VocalProfile` that would give it meaning and no
 * `Archetype` for a person holding a microphone and nothing else.
 *
 * **So what this genre generates is the record with the rapper taken off it.**
 * That is a real object — it is the B-side of every twelve-inch this music
 * pressed, `titles.ts` calls it `(Instrumental)`, and people buy it on purpose —
 * and it is not the genre. The cost is named rather than hidden, and three
 * things are done about it:
 *
 *  - **`delivery: 'talk-sing'`**, which flattens half the written pitch away and
 *    replaces it with a speech intonation contour while keeping the syllables on
 *    the grid. `docs/voice.md` warns that quantising speech to a grid *"is
 *    instantly audible as a rap"*, which is the one place in this project where
 *    a documented failure mode is a specification.
 *  - **`WORD_STYLES.machine`** rather than funk's `scat`: the widest consonant
 *    inventory in the file, the shortest words, and by a distance the most
 *    closed syllables. It was written for a vocoder tracking a talker and what
 *    it actually describes is the talker.
 *  - **A register of twenty-one semitones**, the narrowest in the project,
 *    because a rapped line does not reach for a tune.
 *
 * `hiphop/vocals.ts` argues all three at length and names the one thing that was
 * wanted and could not be had, which is a `WordStyle` of this idiom's own.
 *
 * ## The load-bearing decision: `scaleForChord`
 *
 * Five answers existed before this. Iskelmä follows the *key*; jazz follows the
 * *chord*; ambient follows the *drone*; synth follows the key without the
 * leading tone; funk names a fixed tonic scale and **does not read the chord at
 * all**. This genre's honest answer is funk's, and it is worth saying that
 * plainly rather than inventing a difference to justify a sixth row.
 *
 * The reason is one fact about the repertoire, and it is a different fact from
 * funk's:
 *
 * **the harmony is a loop, and the loop is somebody else's.**
 *
 * Funk's argument is that the harmony does not move — a JB side is one chord for
 * four minutes. Half of this catalogue is the same, and the other half is not:
 * `soulloop` has a chord a bar and `jazzrap` has a real cadence in its chorus.
 * What makes a chord-relative rule wrong even there is that those four chords
 * are **two bars of a record, repeating**. A line that re-orients onto each of
 * them re-orients identically every two bars for four minutes, which is not
 * chord-relative writing — it is a fixed pattern arrived at expensively. And the
 * person who made the record was not reading the changes: they were playing a
 * pentatonic over a loop, by ear, because that is what fits over a chord you did
 * not choose.
 *
 * So the rule is one line, the chord is not a parameter, and the scale is rooted
 * on the tonic and fixed for the song:
 *
 *     minor  →  minorPentatonic     five notes, no leading tone
 *     major  →  majorPentatonic     five notes, no fourth and no seventh
 *
 * ### Where it differs from funk's, and why the major half is the smaller scale
 *
 * Funk's major half is `mixolydian`, seven notes, and its table gives the reason:
 * that half of the repertoire is *horn-chart* music, and a written horn line
 * needs its fourth and its sixth. This genre's major half is not a horn chart. It
 * is a hook — a vibraphone figure, a whistled three notes, a plucked bell — sitting
 * on top of a chord somebody else voiced in 1972 and nobody has consulted since.
 * The two degrees `majorPentatonic` leaves out are **the fourth and the seventh**,
 * and those are precisely the two that can disagree with what is underneath: the
 * fourth is the avoid note over the maj7 the sample almost certainly is, and the
 * seventh is a semitone from the root of whichever chord the loop lands on next.
 *
 * The pentatonic is not a simplification here. It is the scale that **cannot be
 * wrong about a chord it has not been told about**, which is the whole problem
 * this genre's melodies have to solve.
 *
 * ### The one style that overrides it, and why exactly one
 *
 * `drill`, to `phrygian` on the tonic. Its identity is the **flattened second**,
 * and `minorPentatonic` is 0, 3, 5, 7, 10 — there is no ♭2 in it and no ♭6
 * either, so the genre's rule structurally cannot spell the interval that style
 * is recognised by. A pentatonic drill line is a boom-bap line at 142 BPM.
 *
 * Note what the override is *not*: it does not read the chord. It is the same
 * shape of rule with a different scale in it, which is the mirror image of the
 * only other two uses of `Style.scaleForChord` in the project — jazz follows the
 * chord and its blues style overrides to a tonic scale, funk follows the tonic
 * and its jazz-funk style overrides to the chord. Three fields, three genres,
 * one style each, and that is what stops a claim becoming a setting.
 *
 * ## Two ceilings, named because they shaped the tables
 *
 * **The bass fold.** `generateBass` places the root within a tritone of MIDI 40
 * and repairs only by whole octaves, so a figure spanning more than about a
 * twelfth comes out flattened at some root positions. The single most obvious
 * gesture in this genre — an 808 that drops an octave — is exactly that figure.
 * Every bass row in `styles.ts` stays inside twelve semitones and writes its
 * octave upward from the root rather than downward from the top. Three other
 * genres wrote around the same wall.
 *
 * **The sub-sixteenth grid, which this genre's report closed.** A trap hi-hat
 * subdivides *inside* a stroke — triplets, then thirty-seconds — and the grid
 * here is sixteenths. **At 140 BPM a written sixteenth is 107 ms and the roll
 * wants 36**: that sentence stood in this header as a compromise for two waves,
 * was the arithmetic `docs/engine-gaps.md` §3.15 was built on, and is now the
 * number `DrumPattern.rolls` hits.
 *
 * What the grid can address on its own is still here and still doing its job —
 * the dotted-eighth chain (`cycle: 12`, and `cycle: 48` where the kick has to
 * stay put) and four consecutive sixteenths across the last beat. What is added
 * is that the last two of those four **accelerate**, in `trap` and `drill` only:
 * 107, 107, 54, 36 ms into the barline. Two of the six drum figures in those two
 * styles refuse it and say why in their own tables, which is the shape this
 * document prefers to a genre that sprays a new field across everything it owns.
 *
 * The other twenty-two styles here write no roll and are byte-identical to what
 * they were, because the field is opt-in and costs no random draw. The gate is
 * the era table rather than the style: a roll is read only where the source is
 * `programmed`, so the three eras that can draw a drummer or a set of pads play
 * the figure underneath without it — which is right, because a person behind a
 * kit does not retrigger a hi-hat thirty times a second.
 */

import { makeScale } from '../../core/scale.js';
import { RULE_DISABLED } from '../../core/rules.js';
import type { Genre, FormStep } from '../types.js';
import { STYLES } from './styles.js';
import { ERAS } from './eras.js';
import { MOODS } from './moods.js';
import { VOCALS } from './vocals.js';
import { generateTitle } from './titles.js';
import { STAGING } from './staging.js';

/**
 * Forms.
 *
 * **Sixteen-bar verses and eight-bar hooks**, which is the sharpest structural
 * difference from every other genre in this project. Everywhere else the unit is
 * eight bars because eight bars is a phrase; here the verse unit is sixteen
 * because sixteen bars is *how much somebody has to say*, and the hook is half
 * that because a hook is a thing you can remember after one hearing.
 *
 * That asymmetry is the form. A verse twice the length of its chorus reads as
 * unbalanced in any of the other thirteen genres here and is the normal shape of
 * every record in this one.
 *
 * The posse cut is the fourth entry and it is the only form in the project with
 * four consecutive verse blocks and one chorus between them. It is a real and
 * much-loved shape — four people take sixteen each and the hook turns up twice —
 * and it is included partly because it exercises `Chart.exits` harder than
 * anything else here: a layer's last statement is a long way from its first.
 *
 * **`Chart.exits` is why no style in this genre writes `requireLayers`.** The
 * exit rule only takes a layer a style has not required, and only from a section
 * that states the tune, and only where that kind occurs at least twice. Every
 * form below states the verse three or four times, so the gesture this genre
 * most wants — the last verse with the strings pulled off it, leaving the kit,
 * the sub and a voice — is available on all five. It would have been tempting to
 * write `requireLayers: ['pad']` on `soulloop` and `cloud`, where the pad is
 * genuinely the sample, and it would have cost both of them their best moment.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  // Three sixteens and three eights. The standard shape, and about half of
  // everything anybody has released in this idiom.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 6],
  // Two verses and a bridge, which is the shape the radio wanted and got.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'bridge', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 5],
  /**
   * The one with a cut in the middle of it. Eight bars where the beat carries on
   * and somebody works the record — this genre's only improvised section, and
   * the reason `solo` exists in the profile below at all.
   */
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'solo', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 8 },
  ], 4],
  // The posse cut: four verses, two hooks, and nobody gets a bridge.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 16 }, { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 3],
  // Two verses and out. What a three-minute single actually is.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 4],
];

export const hiphop: Genre = {
  id: 'hiphop',
  label: 'Hiphop',
  description:
    'Loops, breaks and sub-bass — the park jam, the twelve-bit sampler, the drawn 808 and the trap record, 1979 to 2020.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,

  /**
   * Never prepared, and here it is barely even a claim — there is almost nothing
   * to prepare *with*.
   *
   * Across twenty-four style tables the dominant appears in three, all of them in
   * the sampled corner of the genre where the borrowed four bars brought a `V13`
   * with them. Everywhere else the harmony is `i`, `VI` and `VII`, and an applied
   * dominant in front of a lifted chorus would be the one leading tone on the
   * record. `keyChangeChance` is 0.02 or below in every era anyway — see
   * `eras.ts` — so this is mostly answering a question nobody asks; it is set
   * because the wrong answer would be audible in exactly the three styles that
   * could produce one.
   */
  preparedModulation: false,

  /**
   * The keys are set by two completely different things and the table is the
   * sum of them, which is why it is flatter than any other genre's here.
   *
   * The **sampled half** is in whichever key the source record was in, and the
   * source records are soul and jazz sides written for horns: E♭, B♭, A♭ and F.
   * The **drawn half** is in whichever key the sub sounds best in, which is a
   * fact about loudspeakers rather than about music — F, F♯ and G put the tonic
   * between 43 and 49 Hz, which is where a ported cabinet is loudest and where
   * the note is still a pitch rather than a thud.
   *
   * F is the head of both lists because it is the one key both arguments arrive
   * at, which is a coincidence and is also why so much of this music is in it.
   */
  keys: {
    minor: [[5, 6], [7, 5], [9, 5], [2, 4], [0, 4], [6, 3], [3, 3], [10, 3], [8, 2]],
    major: [[5, 5], [10, 4], [3, 4], [0, 4], [7, 3], [8, 3], [2, 2]],
  },

  /**
   * It fades, and that is a real disagreement with the genre next door.
   *
   * Funk buttons, and its table argues the case well: the band lands The One
   * together and the drummer crashes over it, because a genre organised around
   * the downbeat cannot dissolve in the last eight seconds. Every clause of that
   * is false here. **There is no band to land together** — on two of the four
   * eras there is nobody in the room at all — and there is nothing for a final
   * chord to be the arrival of, because the harmony has been the same two bars
   * since the first second.
   *
   * What ends one of these records is somebody muting the channels, which is
   * `fade`: the thing that is already sounding is let go, with nothing struck on
   * top of it. A crash on the end of a loop is a rock gesture, and the two
   * genres that own it already have it.
   */
  ending: 'fade',

  /**
   * Never counted in, which is the opposite of funk's answer and for a reason
   * that follows directly from it.
   *
   * There, the shouted count is *vocabulary* — it is on the released side of the
   * records and it is the same gesture as the band hitting The One. Here there
   * is no band and there is no beat one to arrive at: the loop was already
   * playing before the record started and the first thing a listener hears is
   * eight bars of it. Four clicks in front of that would be four clicks in front
   * of a machine that does not need them, and would announce a band that is not
   * there. See `withCountIn`.
   */
  countIn: false,

  /**
   * `light`, matching jazz and funk, and for the same underlying reason: the
   * intervals the rule table exists to suppress are this idiom's vocabulary
   * rather than defects in it. The overrides below do the genre-specific work,
   * and the first of them would otherwise have refused the defining interval of
   * most of this catalogue in silence.
   */
  defaultStrictness: 'light',

  /**
   * `earworm`, and this was the first genre in the project whose *default* is
   * the top of the scale.
   *
   * Elsewhere `earworm` is what a style opts into when its whole proposition is
   * the same bar again — nine styles in funk, two in synth. Here it is the
   * floor: the loop does not develop, and a generator that let the hook wander
   * would be writing a different piece of music over the same two bars.
   *
   * **Two numbers here were wrong and are corrected rather than dropped.**
   * *Only* became *first*: dnb and house were written after this genre and both
   * default to `earworm` too, which is three genres of nineteen and is the least
   * surprising outcome available — they are the two other catalogue entries
   * built on a loop that does not develop. And funk carries **nine** styles at
   * `earworm`, not six, which it already did on the day this file was added;
   * synth's two are right. The claim worth keeping is the one about the *floor*,
   * and it survives both corrections: three genres of nineteen set it as a
   * default, and the other sixteen make a style ask.
   * Four styles step *down* to `catchy`, and all four are the ones playing
   * somebody else's changes, where there is a progression underneath for a tune
   * to be about.
   */
  defaultHook: 'earworm',

  /**
   * The loop does not get out of the way, because the loop is what the cut is
   * over.
   *
   * The same answer funk gives and arrived at even more directly: a rhythm
   * section that dropped back under a solo here would be taking away the record.
   * The two exceptions are below and both are the same gesture — everything
   * stops and one thing is left, which is what a break is.
   */
  soloBacking: 'full',

  /**
   * Who solos, and the honest answer is *the drums and the record*.
   *
   * **`drums` leads the rotation at 5**, which no other genre in the project
   * does. Four bars of kit alone is not a novelty here, it is the thing this
   * entire music was built out of — `breaks` in `styles.ts` is a style that
   * exists because of it — and the b-boy record is a drum solo that happens to
   * have a bass note under it.
   *
   * **`comp` at 4 is the DJ**, and it is the nearest this project can get to
   * naming one. What happens in the eight bars of the third form above is that
   * somebody works the loop — cuts it, doubles it back, brings it in late — and
   * the layer that holds the loop is the comp. It is not a keyboard solo and the
   * engine will render it as one; that is the compromise, and it is a smaller
   * one than it sounds, because a chopped comp figure over a running beat is
   * structurally what the gesture is.
   *
   * `quoteMotto` at 0.65 is the highest in the project by a distance. Everywhere
   * else quoting the tune at the top of a chorus is a soloist playing to the
   * room; here it is the *whole technique* — cutting the hook back in over
   * itself is what a turntable is for, and a solo section that did not restate
   * the figure would be somebody improvising, which nobody in this music does.
   *
   * `tradeFours` at 0.08 is nearly off. Trading is a conversation between two
   * players and there is one player.
   */
  solo: {
    rotation: [['drums', 5], ['comp', 4], ['melody', 3], ['counter', 1.5], ['bass', 1.5]],
    tradeFours: 0.08,
    quoteMotto: 0.65,
    backing: {
      melody: 'full', counter: 'full', comp: 'full',
      // The two exceptions, and both are a break: everything stops and one thing
      // carries on.
      bass: 'sparse',
      drums: 'trade',
    },
    vocabulary: {
      gait: 0.4,
      // The highest here. A double-time run over a half-time beat is the one
      // rhythmic escalation this music has, and it is what a hook does in its
      // last four bars.
      doubleTime: 0.25,
      offbeatAccent: 0.7,
      // Nearly off. An enclosure is a bebop device for arriving at a guide tone,
      // and over one chord for four minutes there is no guide tone to arrive at.
      enclosure: 0.08,
      chromatic: 0.3,
      ornament: 0.18,
      develop: 0.5,
      displace: 0.5,
      // High. The gaps are the part of this music people can describe.
      space: 0.4,
      // Two semitones. This line works one register; a climb is for a line with
      // somewhere to get to, and the destination here is the top of the next bar.
      climb: 2,
      // 0.35, against funk's 0.15. See `quoteMotto` above — paraphrasing the
      // figure is the technique rather than a change of subject.
      paraphrase: 0.35,
      // Nearly off. The hook comes back over a beat that never stopped, so there
      // is nothing to deliver it into.
      liftIntoReturn: 0.1,
    },
  },

  /**
   * **The lowest comping numbers in the project, and the argument is one word:
   * a sample does not vary.**
   *
   * `CompingProfile` was written for a jazz pianist and its 0.18 / 0.3 / 0.25 are
   * there because a comper who plays the same bar twice is more audible as a
   * machine than any wrong note. Funk inverts that and lands at 0.04 / 0.14 /
   * 0.05, on the grounds that the figure is the song and a guitarist who started
   * varying it would make the record harder to dance to. This goes further, and
   * it is not a matter of degree: **the comp layer here is frequently a
   * recording**. It plays the identical bar because it is the identical bar.
   *
   * `rest` is 0.02 rather than zero for one reason, and it is the mirror of
   * funk's: there the bar the guitar misses is how you know it was a person, and
   * here the bar the loop is *muted* is how you know somebody is working the
   * desk. Same number, opposite explanation. `anticipate` at 0.05 belongs to the
   * four styles that still have a keyboard player in them; `displace` at 0.02 is
   * nearly off, because a sampled figure nudged a sixteenth is a sampled figure
   * with the timing wrong.
   */
  comping: { rest: 0.02, anticipate: 0.05, displace: 0.02 },

  /**
   * Where this genre disagrees with the shared rule table.
   *
   * The first entry is the one that matters and it is not a preference: without
   * it the generator silently refuses the most characteristic interval in the
   * repertoire, with no error and nothing in the output to say what happened.
   */
  ruleOverrides: {
    /**
     * **The one that would have broken this genre in silence.**
     *
     * `augmented-second` vetoes any move of one scale step and three semitones,
     * from strictness level 1 upward. In harmonic minor that is correct — it is
     * the accident of reaching for the raised seventh over a dominant. In the
     * **minor pentatonic**, which is what `scaleForChord` hands every minor song
     * in this genre, it fires on two of the scale's four steps: tonic to ♭3 is
     * one step and three semitones, and fifth to ♭7 is one step and three
     * semitones. The first of those is the interval this entire repertoire opens
     * on. The rule would have refused it at every strictness level this genre
     * ships at, and produced hooks that were correct, legal, and had nothing in
     * them.
     *
     * Disabled outright rather than softened, because there is no level at which
     * it is right here. `core/scale.ts` warns about exactly this against the
     * pentatonic rows.
     */
    'augmented-second': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * The blue notes are outside the scale by construction and have to be.
     *
     * Five notes leaves no room for the ♭5 a line slides through between the
     * fourth and the fifth, or for the ♭3 sitting over a major-key loop. Both are
     * *correctly* outside — `core/scale.ts` argues at length why `blues` and
     * `minorPentatonic` are two rows rather than one — and it means the rule that
     * polices notes outside the prevailing scale is policing this genre's
     * vocabulary.
     */
    'chromatic-tone': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * **A loop repeats more than any rule was built to expect, and this genre is
     * the extreme case.**
     *
     * `repeated-note-run` vetoes three identical notes in a row at strictness 2.
     * `hardcore`, `phonk` and `trap` between them are built on figures that are
     * *two or three pitches, rhythmicised*, stated identically for sixteen bars —
     * and `melody.sequence` runs to 0.9 in this file against a catalogue norm
     * nearer 0.5. Both rules are softened to a preference at the top level rather
     * than disabled, because a line here can still stall; it simply does so about
     * four times later than anywhere else.
     */
    'static-repetition': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.85 },
    'repeated-note-run': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.9 },

    /**
     * A seventh over a two-bar loop resolves nowhere, because the loop is about
     * to start again.
     *
     * The rule assumes a seventh is a dissonance under pressure, which is true
     * where the chord is going somewhere. On an `i9` that comes round every two
     * bars for four minutes the ♭7 is a *colour of the tonic*: it is degree four
     * of the minor pentatonic, it is in most of the bass figures in `styles.ts`,
     * and it is where half of them come to rest. Softened rather than disabled —
     * `jazzrap`, `soulloop` and `clubrap` have genuine cadences and a seventh in
     * one of those still owes something.
     */
    'unresolved-seventh': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.8 },

    /**
     * The eleventh is the chord rather than an avoid note.
     *
     * `min11` appears in five style tables here and a sus voicing is the default
     * shape of a plucked figure over a sub. The rule is right for a singable
     * idiom and right for jazz, which tightens it; here it would file off the one
     * extension this music reaches for most.
     */
    'avoid-fourth': { minLevel: 4, vetoLevel: RULE_DISABLED },

    /**
     * **A transposed sample moves in parallel by definition, and that is a
     * stronger argument than funk's.**
     *
     * The prohibition is choral and it is about two independent voices fusing
     * into one. Funk's defence is that a horn section is one instrument playing a
     * written figure. This genre's is arithmetic: a chopped chord played up a
     * fourth is *every voice in it moved up a fourth*, because it is one
     * recording with the playback rate changed. Fifths, fourths and octaves
     * between consecutive chops are not a voice-leading decision that could have
     * gone another way — they are what a sampler is.
     *
     * Kept as a mild preference at the smoothest setting rather than disabled,
     * since the melody and the bass genuinely can fuse and that is still a fault.
     */
    'parallel-perfects': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.5 },

    /**
     * A five-note scale makes the threshold wrong by a whole degree.
     *
     * `wide-leap` vetoes anything past a perfect fourth and was calibrated
     * against a seven-note scale where one step is a tone or a semitone. In both
     * pentatonics one step is up to a minor third, so **two steps is a perfect
     * fifth** — ordinary stepwise motion by the scale in force. Left as a penalty
     * at the top two levels so a genuine jump is still caught, and the
     * counterweight is untouched: `leap-beyond-third` still vetoes at `polished`.
     */
    'wide-leap': { minLevel: 3, vetoLevel: 4, penalty: 0.5 },

    /**
     * The hook and the chord were written by different people in different
     * decades.
     *
     * `non-chord-tone-on-strong-beat` assumes the person writing the line knows
     * what is underneath it, which is the normal case and is false here by
     * construction: `scaleForChord` deliberately hands out a scale that does not
     * read the chord, precisely so that the line cannot disagree with a loop it
     * was not consulted about. The sixth landing on the downbeat of a `min11` is
     * not a lapse, it is the whole reason the pentatonic was chosen — see the
     * header. Softened at the top level rather than disabled, because the four
     * styles with real changes should still be held to something.
     */
    'non-chord-tone-on-strong-beat': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.8 },
  },

  /**
   * Which devices this band uses, and `riff` is raised further than any genre
   * has raised it.
   *
   * The pool's description of `riff` is *the horns answer with one figure,
   * restated, instead of fresh stabs* — and in this genre that is not an
   * arranging option, it is the mechanism the music is made on. A sampler
   * restating a figure is what a sampler does; there is no version of these
   * records where the answer is fresh material, because fresh material would have
   * had to be played by somebody.
   *
   * `swell` and `trade` come down. A horn pad under a held melody note is a
   * ballad device and this catalogue has no ballad; handing a phrase from one
   * player to another is a conversation, and the two objects on this stage are a
   * machine and a person who is not in the layer plan.
   */
  arrangement: { riff: 8, tutti: 5, unison: 3, harmony: 3, trade: 2, swell: 2 },

  /**
   * **The bass is louder than the tune, and that is the whole mix statement.**
   *
   * Every number is stated against the shared defaults rather than against
   * another genre, since those are what an omitted layer gets. `bass` goes from
   * 0.63 to 0.92 and `melody` comes *down* from its usual 0.9 to 0.78, and the
   * crossing of those two lines is the whole mix statement. Funk gets close —
   * 0.86 against 0.92 — and stops short, correctly, because a funk record has a
   * tune on it.
   *
   * **This used to claim it was the only genre where the lines cross, and four
   * others cross them.** Ranked by the margin: dnb +0.28 (0.94 over 0.66),
   * ambient +0.19 (0.73 over 0.54), **this genre +0.14**, reggae +0.10, house
   * +0.06. So it is third of five rather than one of one. Four of the five are
   * genres whose subject really is the bottom of the record, so the company is
   * the right company and the sentence was wrong about the catalogue rather
   * than about the music. The ranking is the more useful form anyway: dnb ahead
   * of this on an axis this genre thought it owned is the fact a reader wants,
   * and ambient sitting second on it is the one they would never guess. Here the melody layer is a fragment: three notes off a record, or
   * a plucked figure whose job is to imply a chord. The subject of the record is
   * a person who is not in this table at all, and underneath them the loudest
   * thing is the bottom.
   *
   * `comp` at 0.66 is the loop and it is deliberately below the drums. A sampled
   * four bars contains its own drums, its own bass and its own everything, and
   * mixed at the level it wants it competes with the kick that was put on top of
   * it — which is the exact problem the genre-level `highpass` in `effects` below
   * exists to solve from the other direction.
   *
   * `pad` at 0.38 is nearly a statement that the layer does not belong, and it is
   * the same number funk arrives at. Where this genre has a sustained bed it is
   * either the tail of a plucked note or a string sample two people recognise,
   * and both should be felt rather than heard.
   */
  mix: {
    bass: 0.92,
    drums: 0.82,
    melody: 0.78,
    comp: 0.66,
    brass: 0.6,
    counter: 0.5,
    pad: 0.38,
  },

  /**
   * The kit, balanced for a music that is mostly kit and sub.
   *
   * Three departures from the shared table. The **clap** goes to 0.8, well above
   * the default's 0.7 and above the snare on some figures — from 1982 onward it
   * is not a garnish on the backbeat, it *is* the backbeat, and eleven of the
   * twenty-four styles here write it as a voice in its own right. The **cowbell**
   * goes to 0.62 from 0.5, and it is the only voice this genre raises for the
   * sake of a single style: `phonk` writes it in all three of its drum rows, and
   * a cowbell mixed politely is a triangle.
   *
   * The **ride comes down to 0.24**, the lowest in the project. Two drum patterns
   * in twenty-four reach for it and both are in the jazz corner; everywhere else
   * a ride cymbal is an object this music does not own, and on `MPC1000` — the
   * era table's own machine — it does not exist at all and resolves to an open
   * hat, which is the right answer.
   *
   * The three hand-drum strokes take the shared curve unchanged. Those numbers
   * were set against the physics of the instrument rather than against any genre,
   * and a conga rack beside a sampler is the same object it is anywhere.
   */
  drumMix: {
    bd: 1.0, sd: 0.9, rim: 0.68, hh: 0.5, oh: 0.5, cp: 0.8,
    lt: 0.6, mt: 0.6, ht: 0.6, cr: 0.4, rd: 0.24, perc: 0.6, cb: 0.62,
    sh: 0.42, tb: 0.4, lp: 0.8, mp: 0.6, hp: 0.5,
  },

  /**
   * Register and response, and the second half is where this genre says something
   * no other one does.
   *
   * The pad drops four semitones and the comp three. The comp figure is a chopped
   * chord living in the same octave as the hook, and it *should* — a loop voiced
   * down out of the way stops being recognisable and becomes mud — but three
   * semitones is enough for the two not to collide.
   *
   * `response` is the flat part. **`bass: 0.12` is the lowest number in this
   * field anywhere in the project**, and it is not restraint, it is a description
   * of the object: an 808 note is one sample triggered at one velocity, and it
   * does not know which section it is in. The comp is barely above it at 0.2 for
   * the same reason — a recording does not play the chorus harder. What actually
   * arrives at a chorus here is the brass at 0.9 and layers entering, which is
   * the same answer synth gives about its sequencer and reached from a completely
   * different direction.
   */
  layerPlan: {
    offsets: { pad: -4, comp: -3 },
    response: { bass: 0.12, comp: 0.2, drums: 0.4, brass: 0.9, pad: 0.5 },
  },

  /**
   * A small room and one repeat.
   *
   * `reverbSize` at 0.2 is the driest in the project, just under funk's 0.24, and
   * the reason is the same one stated twice over: a long tail on a sixteenth-note
   * hi-hat smears the sixteenths together, and the separation between them is
   * most of what a listener is hearing. The second reason is this genre's own —
   * **reverb and sub-bass are the two things that cannot share a record.** A
   * hundred milliseconds of tail under a note at 45 Hz is a note at 45 Hz that
   * has not finished when the next one starts.
   *
   * `delayBeats` at 0.75 — three sixteenths against a four-beat bar — is the
   * convention three other genres here already state. The feedback is 0.2,
   * slightly above funk's single tape slap: this music does use a repeat as an
   * effect rather than only as a room, and the eighth-note echo on a vocal drop
   * is a gesture rather than an accident.
   */
  space: {
    reverbSize: 0.2,
    delayBeats: 0.75,
    delayFeedback: 0.2,
  },

  /**
   * Standing production notes, refined by each era, and one of them is the single
   * most characteristic move in the genre.
   *
   * **`highpass: 180` on the comp.** No other genre in this project high-passes
   * an accompaniment layer, and this one has to. The loop already contains a bass
   * — it is four bars of a finished record — and a sub-bass line is about to be
   * put underneath it. Two bass parts in the same octave is not a balance problem
   * that a fader solves, it is two notes disagreeing about what the root is. So
   * the bottom of the loop is removed, the 808 takes the space, and what is left
   * of the sample is its middle: exactly the operation an engineer performs on
   * every one of these records, and the reason the genre sounds the way it does
   * from the waist down.
   *
   * The bass is at 900 Hz, near the darkest in the project — an 808 is a sine
   * wave with a pitch envelope and everything above the second harmonic is the
   * click of the trigger. It is bone dry for the reason above.
   *
   * The drums are bright and nearly dry, which is the same treatment funk gives
   * them and for the same reason: at 90 BPM the sixteenths are 167 ms apart, and
   * anything with a tail on it fills the gap the pattern is made of.
   */
  effects: {
    comp: { reverb: 0.2, highpass: 180, lowpass: 7000 },
    bass: { reverb: 0.0, lowpass: 900 },
    drums: { reverb: 0.1, lowpass: 11000 },
    brass: { reverb: 0.22, lowpass: 7500 },
    melody: { reverb: 0.26, delay: 0.16, lowpass: 8500 },
    counter: { reverb: 0.3, delay: 0.2, lowpass: 8000 },
    pad: { reverb: 0.5, lowpass: 4400 },
    vocal: { reverb: 0.2, delay: 0.14, lowpass: 8500 },
  },

  /**
   * The filter moves, and this genre is the second one in the project to say so.
   *
   * Funk declined the field outright and gave the right reason for itself: its
   * filter gesture is a *wah*, which moves per note, and faking one as a section
   * sweep would be a different effect wearing its name. This genre's filter
   * gesture is genuinely per section and it is one of the two or three things
   * everybody can identify by ear — **the verse comes in with the loop filtered
   * down to a murmur and the whole record opens on the first bar of the hook.**
   * That is a hand on a low-pass, held for sixteen bars, and it is exactly what
   * this field describes.
   *
   * `kind` puts the intro at 0.4 and the chorus at 1.0, which is the gesture. The
   * outro is at 0.45 rather than at the bottom because these records do not close
   * the filter to end, they fade with it open — `ending: 'fade'` above says the
   * same thing about the same eight seconds.
   *
   * `response` is where the field earns its place rather than merely being on:
   * **the comp swings furthest and the bass barely moves at all.** Closing a
   * low-pass on a part already below the cutoff removes it rather than darkening
   * it, and a filtered 808 does not sound distant, it sounds absent — which would
   * take the floor out from under exactly the section that is establishing one.
   * `synth/berlin` measured that and wrote it down; this table is the same lesson
   * applied to a much lower bass.
   *
   * `build` at 0.22 is modest. The last hook being brighter than the first is
   * real and small; anything larger reads as an automation ramp rather than as a
   * record.
   */
  filter: {
    kind: {
      intro: 0.4, verse: 0.8, chorus: 1.0, bridge: 0.6, solo: 0.9, outro: 0.45,
    },
    response: {
      comp: 0.65, pad: 0.55, melody: 0.3, counter: 0.35, brass: 0.3,
      drums: 0.15, bass: 0.05,
    },
    build: 0.22,
  },

  /**
   * Two and a half to four and a half minutes, which is what a twelve-inch A-side
   * with three sixteen-bar verses on it comes to.
   *
   * The bottom of the band is set by the form rather than by taste: the shortest
   * shape above is fifty-six bars, and at the slow end of this catalogue — 62 BPM
   * for a screwed record — that is already over three minutes. The top is where a
   * posse cut lands with four verses on it.
   */
  duration: [150, 265],

  /**
   * What the drummer plays into a section, and the loudest thing available is
   * silence.
   *
   * **`tom-roll` is absent entirely**, which no other genre in this project does.
   * A descending run round the toms is a dance-band gesture that announces the
   * next section by getting louder across four beats, and it is wrong here twice:
   * nothing in this music has toms — `MPC1000`, the era table's own sampler, has
   * seven samples and none of them is one — and the announcement itself belongs
   * to a band rather than to a machine.
   *
   * `drop` leads at 6 and it is the genre's own answer. The bar where everything
   * stops is what makes the hook that follows it land, and it is the single most
   * reliably identifiable event in a hiphop record. `snare-roll` is second
   * because it is the one borrowed gesture that stuck — see `crunk` in
   * `styles.ts`, which promotes it to the top of its own palette.
   */
  fills: [
    ['drop', 6], ['snare-roll', 4], ['lead-in', 3], ['snare-toms', 2],
  ],

  /**
   * The scale rule, and the chord is not a parameter it reads.
   *
   * See the header for the whole argument, including why the major half is the
   * *smaller* scale where funk's is the larger one. One line, no branch on the
   * chord, and the tonic follows a key change if there is one — which, at a
   * `keyChangeChance` of 0.02, there almost never is.
   */
  scaleForChord: (tonic, mode) =>
    makeScale(tonic, mode === 'minor' ? 'minorPentatonic' : 'majorPentatonic'),

  /** The club, the hooded top and the club bill. See `staging.ts`. */
  staging: STAGING,
};
