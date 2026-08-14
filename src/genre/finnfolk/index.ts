/**
 * Finnish folk music — kansanmusiikki.
 *
 * Twenty-four styles across four layers, from Kalevala-metre sung poetry over a
 * kantele drone to an amplified band in seven eight. And the first thing this
 * file has to do is justify existing at all, because there is already a Finnish
 * genre in this project.
 *
 * ## Why this is not more iskelmä styles
 *
 * `iskelma` is Finnish **popular song**: tango, humppa, valssi, jenkka, foksi. It
 * is composed music with an author, written in verse-and-chorus for a dance
 * pavilion, harmonised functionally, with a singer out front — and a great deal
 * of it descends directly from the pelimanni repertoire below. That descent is
 * real and this file does not dispute it. What it disputes is that the two are
 * one catalogue, and the case rests on four things the engine can actually see:
 *
 *  1. **`scaleForChord` is a different rule, and four styles refuse it
 *     outright.** Iskelmä's is one of the sharpest statements in the project:
 *     aeolian throughout, harmonic minor the moment a dominant arrives, so the
 *     leading tone leads. This genre never manufactures a leading tone — the
 *     ladder below is modal and stops at aeolian — and `runolaulu`, `itkuvirsi`,
 *     `soitto` and `karjanhuuto` override it entirely with a *drone* rule that
 *     does not consult the chord at all, because there is no harmony under them
 *     to consult. That is not a style setting. A genre in which four styles have
 *     no functional harmony is answering the question that made `Genre` an
 *     abstraction differently.
 *  2. **The form is not verse and chorus.** Iskelmä's forms are eight-bar verses
 *     and a chorus that is the same tune every time, and its `defaultHook` says
 *     so. A folk tune is two strains, AABB, and a runo tune is *one line*
 *     repeated four thousand times. The forms below have no chorus in the sense
 *     iskelmä means; `verse` and `chorus` are the A strain and the B strain, and
 *     the naming is a compromise the engine forces rather than a claim.
 *  3. **The metres do not exist over there.** `beatsPerBar: 5` grouped
 *     three-and-two for the Kalevala line, and `groups: [5, 3, 4]` for the
 *     polska's uneven three. Iskelmä is entirely in two, three and four with
 *     even beats, and it has to be: a tanssilava floor is a hundred people who
 *     learned the step at a different pavilion.
 *  4. **The ending and the count-in are contested here and settled there.** A
 *     tanssilava band lands on a button and the floor claps; that is the whole
 *     genre. Half of this one does that and half of it does not end at all — see
 *     `ending` below, where the cost is named rather than hidden.
 *
 * **The honest caveat, stated where somebody will read it.** For the eleven
 * pelimanni dance styles the case above is weaker than it is for the other
 * thirteen. A `polkka` and a `haavalssi` really are functionally harmonised
 * dance music in even metres with a button on the end, and if this genre were
 * only those eleven it would be a reasonable question whether they belonged next
 * to `humppa` and `valssi` instead. Two things keep them here. The first is that
 * they are the *ancestors* of those, played by one fiddler for a village rather
 * than by a seven-piece for a paying floor, and the palettes and staging say so.
 * The second is that they are a minority of the catalogue: what makes this a
 * genre rather than a wing of another one is the thirteen styles that have no
 * chorus, no dominant, or no metre iskelmä can count.
 *
 * ## The chord rule, and the one thing it will not do
 *
 * Key-relative and modal. Rooted on the tonic, searched **flatward first**, and
 * it stops at the point where a leading tone would have to be invented. What
 * falls out is the harmonic behaviour this repertoire actually has:
 *
 *     i    in a minor key       →  dorian     (the natural sixth, tried first)
 *     bVI  under a minor tonic  →  aeolian    (the chord that flattens it back)
 *     bII  under a minor tonic  →  phrygian   (the lament, and two bridges)
 *     I    in a major key       →  mixolydian (the subtonic, tried first)
 *     V    under a major tonic  →  major      (the imported dance, and only it)
 *
 * The last two lines are the interesting pair and they are the genre in one
 * sentence: **the leading tone here is a property of the chord underneath the
 * line, not of the key.** A style whose tables never write a `V` — `rekilaulu`,
 * `virsi`, `poljento`, everything in the archaic layer — is mixolydian or dorian
 * from the first bar to the last, because nothing ever asks for the raised
 * seventh. A style that writes one gets it, on that bar, and loses it again
 * afterwards. That reads as a defect if you expect a key signature and as a
 * description if you have heard a pelimanni tune: these tunes genuinely have a
 * flat seventh everywhere except where the accompanist has put a dominant under
 * them, and the accompanist learned that from Germany.
 *
 * ## Where it resembles its neighbours, said out loud
 *
 * The shape of the search is reggae's, and pretending otherwise would be worse
 * than admitting it. Both follow the key, both search a short ladder rooted on
 * the tonic, and both refuse harmonic minor. Two things differ and both are
 * audible. Reggae's minor ladder starts at aeolian and bends *to* dorian; this
 * one starts at dorian, because in Nordic fiddle music the natural sixth is the
 * default rather than the colour. And reggae's major ladder starts at major;
 * this one starts at mixolydian, which is the claim in the paragraph above and
 * is the single line that most separates the two rules.
 *
 * It is further from ambient than it looks, and the four drone styles are why.
 * Ambient's rule bends the mode of the tonic to *absorb* whatever chord has
 * arrived; this genre's drone styles do not bend, because their chord never
 * moves — see `drone` in `styles.ts`, which takes the tonic and the mode and
 * does not take the chord at all.
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
 * The modes the line may live in, flattest useful one first.
 *
 * Three long each, and the shortness is deliberate for reggae's reason — these
 * tunes have two or three chords and a ladder that could reach lydian would be
 * answering a question the tables never ask.
 *
 * **Harmonic minor is absent and that is the genre's central negative claim.**
 * Iskelmä's rule is this one plus a line:
 *
 *     if (mode === 'minor' && chord.dominantFunction)
 *       return makeScale(tonic, 'harmonicMinor');     // iskelmä does this
 *
 * Most tables in `styles.ts` write `VII` or `v` where a dance band would write
 * `V7`. **Fifteen of the twenty-four styles do write a `V` somewhere**, though —
 * this note said five, and five is a count of the imported dances rather than of
 * the tables. The nine that never write one are `runolaulu`, `itkuvirsi`,
 * `soitto`, `karjanhuuto`, `piirileikki`, `rekilaulu`, `poljento`,
 * `sahkopelimanni` and `karjalanlaulu` — the two added to that list against an
 * earlier count of seven are `piirileikki` (`i VII is III VI`) and
 * `sahkopelimanni` (`i VII IV VI III iv`), neither of which has a major `V` in
 * it. Counted by walking the parsed progressions rather than by grepping the
 * file, which is what makes the difference: `VII` contains a `V`.
 *
 * A `V` is a major triad with a real leading tone in it, and the two modes take
 * it differently. In a major key the ladder finds a home for it: `major` is the
 * second entry and contains the chord's third. In a minor key nothing on the
 * ladder does, so the search runs out and the fallback returns **dorian** — the
 * flattest mode, not "the chord's own scale", which this note also had wrong. The
 * raised seventh reaches the line through the chord tones or not at all, which is
 * the whole argument in the header made operational.
 */
const MINOR_LADDER: ScaleName[] = ['dorian', 'minor', 'phrygian'];
const MAJOR_LADDER: ScaleName[] = ['mixolydian', 'major', 'lydian'];

/**
 * Forms — strains rather than verses.
 *
 * `verse` and `chorus` mean the A strain and the B strain of a two-strain tune,
 * which is what almost every dance tune in this repertoire is: eight bars,
 * repeated, then eight more bars, repeated, then round again. That is the first
 * form and it takes the largest weight because it is not one option among
 * several, it is the shape of the literature.
 *
 * The second is the three-strain tune, which polskas and marches both go in for
 * and which needs `bridge` as its C strain. The third is strophic — one strain,
 * over and over, which is the runo singer, the hymn and the rhymed couplet song,
 * and it is the only form in this project with no second idea in it at all. The
 * fourth is the one with a `solo` section, and `solo` here does not mean what it
 * means in jazz: see the profile below.
 *
 * No form is longer than about a hundred bars, and the honest note is that a
 * real purpuri runs half an hour and a real runo performance runs until the poem
 * ends. Neither is generatable and neither is approximated by making the form
 * longer — what would come out is the same eight bars ninety times, which is
 * what the tradition does and is not what a listener wants from a station.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  // AABB, and round again. The two-strain dance tune.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 6],
  // The three-strain tune: A, B and a C strain that usually goes somewhere else
  // harmonically and then comes straight back.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'bridge', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 4],
  // Strophic. One strain and nothing else — the runo singer, the hymn, the
  // rhymed couplet song, and the only form here with no second idea in it.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 4],
  // With the strain given to one player. See `solo` below for what that is.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'solo', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 3],
  // The suite: four different strains and no return. What `purpuri` and
  // `katrilli` are, at the length this engine can hold.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'bridge', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'bridge', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 3],
];

export const finnfolk: Genre = {
  /**
   * Never announced, and here that is nearly a tautology.
   *
   * A prepared modulation is a `V7` of the key you are going to, standing in
   * front of it — which requires a leading tone in the new key, which is the one
   * thing the chord rule above refuses to manufacture. It also requires somebody
   * to have *arranged* it: iskelmä lifts the last chorus a tone because a writer
   * decided the record needed one more push, and there is no writer here for
   * eleven of these styles and no last chorus for six of them.
   *
   * What key change does happen is direct and rare — `keyChangeChance` runs from
   * 0.12 down to a literal zero in the runo era, argued at that table. See
   * `tune/keyplan.ts`.
   */
  preparedModulation: false,
  id: 'finnfolk',
  label: 'Finnish folk',
  description:
    'Kansanmusiikki: Kalevala-metre runo song and kantele drone, the pelimanni fiddle dances, the Kaustinen revival, and the amplified folk department.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,

  /**
   * The fiddle's open strings, and the kantele's tuning.
   *
   * Every key table in this project is chosen for something: iskelmä's for
   * singers, ambient's for where a fundamental sits, reggae's for where the
   * riff's lowest note falls. This one is chosen for **sympathetic resonance**,
   * which is a narrower and more physical constraint than any of them. A violin
   * is tuned G–D–A–E and a tune in D, G or A can leave a lower string ringing
   * open under the melody without stopping to finger it; a tune in E flat
   * cannot, and the difference is not subtlety, it is the whole texture of
   * unaccompanied fiddle playing. The same fact from the other end is that a
   * five-string kantele is tuned to a single pentachord and there is no
   * mechanism for changing it.
   *
   * So D, G and A carry the weight in both modes, C and F are here because a
   * clarinet in the band pulls the key flatward, and B minor exists because the
   * fiddle's open E is the fourth of it.
   */
  keys: {
    minor: [[2, 6], [9, 5], [4, 4], [7, 3], [11, 2], [0, 2]],
    major: [[2, 6], [7, 5], [9, 4], [0, 3], [5, 2], [4, 1]],
  },

  /**
   * A button, and the archaic half no longer pays for it.
   *
   * A pelimanni dance tune ends the way a dance ends: the band lands the last
   * chord together on the downbeat and the floor stops. That is `button`, it is
   * true of all eleven dance styles and of the four revival ones, and a tune
   * that faded out under a room full of people mid-step would be wrong on every
   * single bar of every single seed.
   *
   * The other half does not end at all. An itkuvirsi *stops* — the crying
   * finishes and there is a silence nobody fills — a runo performance ends when
   * the poem does, and a kantele piece is over when the last string has stopped
   * ringing, which is two and a half seconds after the player let go. `fade` is
   * the right ending for all four and **they have it**: `Style.ending` overrides
   * this field, `runolaulu`, `itkuvirsi`, `karjanhuuto` and `konserttikantele`
   * each write it, and the other twenty inherit the dance answer by saying
   * nothing.
   *
   * **The share is worth stating exactly, because two files disagreed about it
   * and one of them was this one.** Four of twenty-four styles is a sixth of the
   * catalogue; the draw is weighted and lands higher, at **71 of 300 songs,
   * 23.7%** — `runolaulu` 31, `itkuvirsi` 18, `konserttikantele` 12,
   * `karjanhuuto` 10. `docs/engine-gaps.md` said "roughly a quarter" and this
   * comment said "about a sixth"; both were describing something true and
   * neither said which, and the difference between a catalogue share and a draw
   * rate is the whole of it.
   *
   * What it recovers, each style generated twice at the same seed with only the
   * ending flipped, 40 seeds each: **2.0 notes per song** re-struck on
   * `konserttikantele`'s final downbeat with the velocity lifted, 1.8 on
   * `runolaulu`, 1.6 on `itkuvirsi`, 0.9 on `karjanhuuto` — on four styles that
   * all exclude the kit and so were never getting the cymbal the gesture is
   * named for. The recall branch, which invents an attack where a layer had
   * none, fired on 5 songs out of 160.
   */
  ending: 'button',

  /**
   * Somebody stamps.
   *
   * The same asymmetry as `ending` and now settled the same way. A pelimanni
   * counts in with a boot on the floor — four stamps, which is exactly what a
   * count-in is — and it is how a band with no conductor and no drummer starts
   * together. A runo singer does not count anything in; they start, and the
   * seconder joins on the second line.
   *
   * True here, therefore, and `false` on the same four styles that take `fade`.
   * **Nothing audible moves**, and the reason is worth keeping: `withCountIn`
   * leaves any number with no kit in it alone, and all four exclude the drums,
   * so no clicks were ever going to sound. What the override reaches is the
   * stage — `counted()` in `show.ts` — where the leader was beating four in
   * front of a lament. The boot is real and it is on eleven dance floors, not in
   * front of a poem.
   */
  countIn: true,

  /**
   * `standard`, with the overrides below doing the specific work.
   *
   * This is singable music and mostly stepwise, which argues for a tight
   * setting; but it is also modal, parallel, occasionally pentatonic and in four
   * styles built on a note repeated until the line is over, and the strict
   * levels would file every one of those off. The two extremes are set per
   * style: `itkuvirsi` and `karjanhuuto` drop to `light`, because a lament's
   * catch and a herding call's leaps are the fault the table exists to suppress.
   */
  defaultStrictness: 'standard',

  /**
   * `catchy`, and it is the honest setting for a music with no composer in it.
   *
   * A folk tune is the same eight bars, played the same way, until the dance
   * ends — the whole transmission mechanism of the repertoire is that a fiddler
   * can hear a tune twice and have it. `catchy` locks the rhythm and recalls each
   * section, which is that. `runolaulu` and `karjalanlaulu` push it to `earworm`
   * from opposite ends of two hundred years, and `katrilli` and `purpuri` pull it
   * to `through` because a suite that repeated a figure would have the dancers
   * walking into each other.
   */
  defaultHook: 'catchy',

  /**
   * Two players on one tune, which is nearly the whole vocabulary.
   *
   * This said `unison` and `harmony` were weighted higher here than in any other
   * genre and neither is: `unison: 7` is third behind arabic's 9 and indian's 8,
   * level with rock, and `harmony: 6` is joint fifth behind rnb and metal at 8 and
   * country and pop at 7. What is true is the shape rather than the rank — the two
   * of them are **13 of the 18 weight here**, with nothing but `trade` and `tutti`
   * to spend the rest on, where arabic and indian put their unison next to a
   * `harmony` of 1 and 0. They are not decoration.
   * A second fiddle plays the tune a third below it or in octaves with it, all
   * night, and the word for the resulting texture is not "arrangement", it is "the
   * band". `soittokunta` and `hidasvalssi` go further and require the counter layer
   * outright.
   *
   * **`harmony: 6` is the answer for twenty-two of the twenty-four, and those same
   * two are the exceptions.** A device is one coin per song landing in one phrase
   * of one repeat chorus, which is a colour; a revival ensemble whose definition is
   * first and second fiddles in thirds needs the statement, so both declare
   * `Style.harmony` and the branch that would have placed the device is skipped for
   * them. The chart still draws it and the weight costs the same number either way.
   *
   * The weight stays exactly where it is because the other twenty-two genuinely
   * want the coin. For the eleven village dances the second fiddle is occasional —
   * `soittokunta`'s own header is that the revival is when that stopped being true
   * — and for the archaic six the two-voiced texture, where there is one at all, is
   * **unison**: the *puoltaja* repeating the line under the start of the next, four
   * women in unison eight hundred years later in `karjalanlaulu`, and a whole ring
   * of people on one plain tune in `piirileikki`. `VOCALS` picks a choir patch for
   * that rather than a solo one. It is the `unison` device and a vocal stack in
   * thirds would be a different repertoire's singers.
   *
   * **`riff` and `swell` are zero, and that is a statement about an instrument
   * that is not here.** Both need the `brass` layer. There *was* brass in Finnish
   * village music — the torviseitsikko, a seven-piece brass band, was in every
   * parish from about 1880 and is a genuine part of the tradition — and it is a
   * different ensemble with a different repertoire and a different reading job,
   * and it is not in this file. **Every one of the twenty-four styles excludes
   * the layer**, so the two devices are unreachable whatever this table said;
   * writing them out as zero is the difference between a genre that never draws
   * them and a genre that has said why.
   *
   * `tutti` stays small for iskelmä's reason inverted: the band stopping to hit a
   * figure together is a thing an *arranged* ensemble does, and there are four of
   * those here out of twenty-four. `trade` is real and modest — two fiddlers
   * handing a strain to each other is exactly what happens when one of them
   * needs to drink something.
   */
  arrangement: { unison: 7, harmony: 6, trade: 3, tutti: 2, riff: 0, swell: 0 },

  /**
   * Where this genre disagrees with the shared rule table.
   *
   * Five entries. The first is required by two styles and inert everywhere else;
   * the middle three are all the same argument about drones; the last is the one
   * that would otherwise veto the oldest music in the project.
   */
  ruleOverrides: {
    /**
     * `augmented-second` off, and it costs nothing where it is not needed.
     *
     * The rule vetoes a one-step three-semitone move from strictness 1 upward,
     * which is correct in harmonic minor where the interval is the accident of
     * reaching for a raised seventh. **It is inert in every seven-note mode this
     * genre uses** — dorian, aeolian, phrygian, mixolydian, major and lydian all
     * step by ones and twos and none of them has such a gap — so switching it off
     * changes nothing at all for twenty-three of the twenty-four styles.
     *
     * What it buys is `karjanhuuto`, which is pentatonic. A major pentatonic's
     * third-to-fifth and a minor pentatonic's tonic-to-♭3 are each one scale step
     * and three semitones, which is precisely the interval being vetoed — so with
     * the rule on, the generator refuses every characteristic move the scale
     * exists to make and what comes back is a five-note scale being used as a
     * badly behaved seven-note one. `SCALE_STEPS` says this in its own header and
     * it is right.
     */
    'augmented-second': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * Parallel motion is the texture, and here it is the *instrument*.
     *
     * Every genre that relaxes this one relaxes it for a chordal player planing a
     * shape. This one has a stronger case and a physical one: a kantele
     * accompaniment is an **open fifth**, on two strings, with no dampers, and it
     * moves in parallel because it cannot do anything else — there is no
     * mechanism on the object for altering the interval. `HANDS.kantele` voices
     * quartally for exactly this reason. Add two fiddles playing a tune in
     * octaves and thirds all evening, and the rule is describing a fault that
     * does not exist in this repertoire.
     *
     * Softened rather than disabled: at the top setting the melody and the
     * counter are two players who can hear each other, and there the fault is
     * still a fault.
     */
    'parallel-perfects': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.5 },

    /**
     * The fourth over the tonic is the sonority, not an avoid note.
     *
     * `isus2` and `isus4` are most of the harmony in the archaic layer and both
     * are a chord with no third in it. A rule that penalised the eleventh would
     * be penalising the drone.
     */
    'avoid-fourth': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * A runo line repeats one note for most of a line, and that is the form.
     *
     * Softened rather than disabled, and the distinction matters: the rule exists
     * to catch a melody that has stalled, and a folk line can absolutely stall.
     * It just does it later than a line in any other genre here, because this
     * music is *transmission* — the tune has to be gettable on a second hearing,
     * which means the same note in the same place, four lines running.
     */
    'static-repetition': { minLevel: 3, vetoLevel: RULE_DISABLED, penalty: 0.7 },
    'repeated-note-run': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.85 },
  },

  /**
   * What the tune is, which degrees it lives in, and what a player does to a
   * figure. Three fields, and they are the three `voiceForStyle` cannot reach.
   *
   * Everything else in `Voice` is already derived from the tables in
   * `styles.ts`, and derived well: `span` runs from `runolaulu`'s 7 to
   * `karjanhuuto`'s 19, and `ornament` from `piirileikki`'s 0.12 to
   * `itkuvirsi`'s 0.55 — the narrowest and widest, plainest and most decorated,
   * **in this genre**. An earlier draft called all three project records and all
   * three were wrong: across the 389 styles `house/minimal` spans 6,
   * `rnb/contemporary` ornaments at 0.75, `house/bleep` leaps at 0.6. The claims
   * were inherited verbatim from `styles.ts:300`, `:432` and `:708`, which want
   * the same correction. A genre-level `density` or `leap` would flatten a spread
   * those twenty-four tables state correctly and argue for one at a time. So no
   * numbers here.
   *
   * **What a weight below actually does, because two of the six were argued as if
   * it did something else.** `mergeArchetypes` *replaces* the derived weight
   * rather than adding to it, so each number here lands on all twenty-four styles
   * at once, over whatever their own cells had earned. Derivation reads one
   * thing — onsets per bar — which makes it confident about `chant` and
   * `riff-response` and nearly blind elsewhere. A weight here earns its place by
   * supplying a fact density cannot see. `chant` and `long-note` were instead
   * overwriting the very styles that had the fact already; both are corrected
   * below, with the cost of the correction stated.
   *
   * ## Which kinds of tune
   *
   * **`arch-hook` carries it because a strain is what this music has instead of
   * a song.** The forms above say `verse` and `chorus` and immediately admit
   * that they mean the A strain and the B strain of a two-strain tune: eight
   * bars with one high point in them and a figure that comes back, played four
   * times round and then the fiddler stops. 4 against derivation's 3, and that 3
   * is flat for all 389 styles in the project because nothing in a `MelodyStyle`
   * distinguishes a tune with an arch from one without. Small lift, and it is the
   * genre declining to let a constant stand in for the shape of its literature.
   *
   * **`chant` is 2.5 rather than the 3.5 this table first carried, because the
   * evidence for it is two styles and the weight reaches twenty-four.**
   * `static-repetition` and `repeated-note-run` are softened above *because a runo
   * line repeats one note for most of a line, and that is the form*; `runolaulu`
   * and `karjalanlaulu` are eight hundred years apart, carry the same
   * `groups: [12, 8]`, and are the only two styles in the project whose tune is one
   * line of trochaic tetrameter said again unchanged. But their Kalevala-metre
   * cells are the densest in the genre — 6.73 and 6.87 onsets per bar — so
   * derivation *already* hands them `chant` at 3.22 and 3.30. The 3.5 was adding
   * 0.28 and 0.20 to the two styles it was argued from, while lifting
   * `karjanhuuto` from 0.50 and the eleven pelimanni dances from about 1.1–1.5 to
   * 3.5 outright. `sectionShape('chorus')` then multiplies it by 1.5, and a chorus
   * here is the B strain of a fiddle tune: that made a repeated-note B strain 24%
   * of every second strain in the genre, on eleven tables that ask for no such
   * thing.
   *
   * The honest cost of 2.5 is that it now sits *below* the two runo styles'
   * derived figures and takes 0.72 and 0.80 off them. That is the wrong direction
   * for those two and the right one for the other twenty-two, and it is what a
   * single genre constant can do. The two-tier version — genre 2.5 plus a
   * `Style.voice` delta of `chant: 5` on `runolaulu` and `karjalanlaulu` — is the
   * shape `docs/voices-plan.md` §3.2 describes and it belongs in `styles.ts`.
   *
   * **`riff-response` third, on the polkka's own description**: *a polkka strain
   * is a two-beat figure said four times with the last one changed*. Four styles
   * are in 2/4 — `polkka`, `purpuri`, `piirileikki`, `tanhu` — and their cells are
   * one gesture long. This said six and nothing is shorter than a 2/4 bar;
   * `poljento`'s `beatsPerBar: 3.5` at `beatUnit: 8` is fourteen sixteenths, which
   * is a longer bar rather than a shorter one.
   *
   * **`long-note` is 2, and it is two styles rather than the four this once
   * named.** `karjanhuuto` at 2.10 onsets per bar and `itkuvirsi` at 2.63 are the
   * genre's sparsest tables and derivation gives them only 1.66 and 0.91, because
   * its formula floors at 0.4 the moment density passes 3. A phrase held until the
   * breath goes is this archetype and nothing else, and for those two the genre
   * knows something density does not.
   *
   * `runolaulu` and `konserttikantele` were the other two witnesses and neither
   * survives: 6.73 and 3.33 onsets per bar, both floored at 0.40 by derivation,
   * and `runolaulu` is the genre's *second densest* table. The old sentence
   * reached for their `cadenceCells` instead — but that field is read by nothing
   * outside `genre/` (declared `src/style/types.ts:911`), so it was evidence from
   * a table with no consumer, and `runolaulu` was being counted twice, as the
   * witness for `chant` and for the archetype that pulls against it. The cost of a
   * genre-wide 2 is that it also lifts twenty-two dance tables off a 0.40 floor,
   * and that cost is why it is 2 and not 2.5.
   *
   * **`descending-sequence` is a ceiling, and saying it is "the lament" overstated
   * what a genre constant can do.** `itkuvirsi` opens on the wail — the highest
   * note of the phrase, struck and held — and falls away from it, which is this
   * archetype's `peakAt: [0.08, 0.25]` exactly. But derivation reads
   * `melody.sequence` here rather than density, and it puts twenty-two of the
   * twenty-four *above* 2, so what a flat 2 does is hold the archetype down
   * everywhere and lift the lament by 0.10. That is still the right direction: the
   * descending tetrachord is not this genre. Iskelmä's tango walks i–VII–VI–V and
   * the tables here write `i VII VI VII` and turn round. Distinguishing the lament
   * from its neighbours is a `Style.voice` job, not this field's.
   *
   * **`wide-interval` is pushed down and one style pays for it.** The
   * `defaultStrictness` note above says this is singable music and mostly
   * stepwise, and the numbers agree: `leap` is 0.07 on `runolaulu`, 0.09 on
   * `itkuvirsi`, 0.11 on `virsi`. `karjanhuuto` is 0.55 — the largest in this
   * genre, not in the project, where `house/bleep` is 0.6 and `metal/techdeath`
   * ties at 0.55 — and derivation gives it `wide-interval` 3.25. Cutting that to 1
   * is the largest single overwrite this table makes, 69%, and the mitigation
   * offered here used to be that it keeps its derived `leap` and `expand`, which
   * are note-level scalars and not the leaping *shape* being cut. Two things
   * genuinely soften it: `sectionShape` lifts `wide-interval` ×2 in a bridge and
   * ×1.5 in a solo, so its effective floor is 2 and 1.5 rather than 1. This is the
   * clearest `Style.voice` delta the genre still owes.
   *
   * ## Which degrees, and this is where the flat seventh stops being a chord rule
   *
   * The header argues that the leading tone here is a property of the chord under
   * the line rather than of the key. `scaleForChord` makes that true of the
   * *harmony*; the subsets make it true of the *tune*, because degrees are
   * 0-based indices into the mode's own scale and this genre's ladder makes a
   * major key mixolydian. So degree 6 is the flat seventh, and three of the four
   * entries below keep it.
   *
   *  - `[0,2,3,4,6]` leads. In a major key that is 1̂ 3̂ 4̂ 5̂ ♭7̂, which is
   *    `rekilaulu` in five notes — a major tune with a flat seventh and no
   *    dominant anywhere. In a minor key the shared table's own comment calls it
   *    the pentatonic, which is `karjanhuuto`'s literal scale.
   *  - The full diatonic next, for the eleven pelimanni dances. A fiddle tune in
   *    D uses every note the hand is already on; the genre's `keys` table is
   *    chosen for exactly that hand.
   *  - `[0,1,3,4,6]` — 1̂ 2̂ 4̂ 5̂ ♭7̂, **no third at all**, which is the archaic
   *    layer written as a scale. `isus2` and `isus4` are most of the harmony
   *    there and neither has a third in it; `avoid-fourth` is disabled above
   *    because the fourth over the tonic *is* the sonority rather than an avoid
   *    note. A tune drawn from this subset is the two open strings of a kantele
   *    with a line picked over them.
   *  - `[0,1,2,4,5]` last and small — 1̂ 2̂ 3̂ 5̂ 6̂, the one subset with no seventh
   *    in it, so the question the genre is built on never arises: the tune simply
   *    declines to say which seventh it meant. This used to be argued as *the five
   *    imported dances, where a real leading tone is available through the chord*,
   *    and that is a bad reason twice. Seventeen styles write a `V`, not five, so
   *    the situation is genre-wide rather than a corner. And "a leading tone is
   *    reachable here" is an argument for the tune stating a seventh, not for
   *    ducking one.
   *
   *    It stays last on a different and measurable ground: this is **pop's leading
   *    subset**, at 5 of its 14, and separation from pop is the one thing this
   *    field buys — 33.3% on the subsets against 16.5% on the archetypes. Raising
   *    it to 3 as the recount first suggested spends 6.4 of those points (33.3% →
   *    26.9%) to make finnfolk's tunes decline its own defining degree more often.
   *    2 is small because the draw should be small, not because the situation is
   *    rare.
   *
   * Against `karjanhuuto`'s five-note scale these are four-of-five colours rather
   * than five-of-seven: `snapToSubset` drops a degree the scale does not have
   * instead of wrapping it, which is the behaviour its own header argues for.
   *
   * ## What it does to a figure
   *
   * Four entries, and three of them are where derivation writes nothing at all.
   * `voiceForStyle` fills `sequence`, `transpose`, `ornament`, `diminish`,
   * `displace` and `expand` from the two numbers a style already declares, and
   * leaves `invert`, `fragment` and `reharmonise` at a flat 1 for all
   * twenty-four. Ornament is deliberately not among them: this genre's appetite
   * for decoration is stated at `decorate` above, genre-wide, and derivation
   * already spreads `ops.ornament` from 0.76 to 2.05 across the twenty-four, so
   * saying it twice would be counting it twice. That note used to add "and at the
   * highest figure in the project", which is a comparison against an empty set —
   * finnfolk is the only genre in the repo that sets `decorate` at all, as the
   * field's own comment says at the top of it.
   *
   *  - `fragment` at 0.6, up from 0.3, because the 0.3 was argued from the wrong
   *    mechanism. `solo.vocabulary.space` is the rest ratio in a *solo* line
   *    (`generate/solo.ts`); `{ op: 'fragment' }` slices a motif to its first N
   *    onsets and leaves no hole at all — in all five combos that use it, the very
   *    next operator is `sequence`, `extend` or `augment`, which fills the figure
   *    straight back out. What a low appetite actually reaches is the **`close`
   *    intent**, where `pick` scales only the *first* operator of each pair: at
   *    0.3 the two `fragment`+`augment` cadences fell from 6 of 9 of the draw to
   *    1.8 of 4.05, and the likeliest cadence in the genre became a bare
   *    `augment 1.5` — the whole eight-bar strain slowed rather than a short tail
   *    stretched, which is the opposite of how a fiddle tune lands. 0.6 puts those
   *    two back in front at 62% while staying under 1, which is what keeps
   *    `develop` from taking the strain apart.
   *  - `invert` down, on `defaultHook` and the `static-repetition` note. The
   *    transmission mechanism of this repertoire is that a fiddler hears a tune
   *    twice and has it; a figure turned upside down is the most complete way to
   *    make the second hearing not the first.
   *  - `reharmonise` down hardest. Four styles have one chord for the whole
   *    piece, and where the harmony does move, `scaleForChord`'s fallback stays
   *    in the flattest mode rather than chasing the chord — *a fiddler whose left
   *    hand is in first position does not re-orient because the accompanist has
   *    played something unexpected.* Refitting a figure to new changes is a job
   *    nobody here has.
   *  - `displace` down, and this one overrides the derivation rather than filling
   *    a hole. It reads `melody.syncopation` and turns it into an appetite for
   *    shoving a figure off the beat, which gets this genre backwards twice over:
   *    `poljento`'s 0.4 and `polska`'s 0.26 are statements about where the
   *    *beats* are — 7/8, and 5:3:4 in a twelve-sixteenth bar — not about a wish
   *    to leave them. The solo profile says the sentence outright: *the accent
   *    belongs to the dance; everything the fiddler does off the beat is an
   *    ornament rather than a displacement*, at `displace: 0.12`.
   *
   * ## The twins
   *
   * Measured on a fingerprint of duration classes, interval classes, density and
   * turn rate, finnfolk is 0.108 from latin and 0.116 from pop against a
   * catalogue mean of 0.382 — two of the six closest pairs there are, and both of
   * them mine.
   *
   * **The nearest authored neighbour was neither of them.** `country` is the genre
   * a listener would actually confuse this with — fiddle, strophic, singable,
   * diatonic — and while this table carried `chant: 3.5` and `riff-response: 3` it
   * was declaring country's own two cells verbatim, which put the two archetype
   * tables 11.2% apart against latin's 19.2% and pop's 21.4%. Nothing in the
   * archetypes was separating the pair; `subsets` was doing all of it, on
   * `[0,1,3,4,6]` at 3 here against country's 1. `chant` at 2.5 is the first thing
   * this field says that country does not.
   *
   * **Percentages against a neighbour are quoted sparingly below, and the reason is
   * that they date.** These tables are all being revised at once: as this is
   * written `country` has just dropped `long-note` and `wide-interval` and moved
   * `riff-response` to 2, and `latin` has dropped `wide-interval`. A distance
   * between two *declared* tables is not even well defined once one of them leaves
   * an entry to derivation. What survives that is a cell quoted against a cell.
   *
   * **`archetypes` answers latin, and `chant` is not how.** Latin is a figure and
   * the thing that answers it over a clave — a high turn rate held for a whole
   * section — and the cells that disagree are `riff-response`, 3 here against
   * `latin/index.ts`'s 5, and `long-note`, 2 against its 1.2. `chant` was named as
   * the answer for three paragraphs while latin declared **the identical 3.5**,
   * where it was worth 0.07 percentage points of a 19.2% separation. Two archetypes
   * that genuinely differ are worth more than one that is copied.
   *
   * **`subsets` answers pop**, and this is the pairing that holds up: 33.3% apart
   * on the subsets against 16.5% on the archetypes, both measured against pop's
   * live table, and pop's own note at `pop/index.ts:743-744` makes the same claim
   * from its side. Its precise form matters — pop's degrees *do* contain a 6, in
   * three of its four subsets, so "a flat seventh pop's degrees do not contain" was
   * the wrong sentence. What is true is that finnfolk's ladder makes degree 6 a
   * choice among *sevens* and pop's case is a *five*.
   *
   * Getting `chant` and `long-note` right moved the archetypes ~5 points *toward*
   * pop, and that is the correct trade rather than a cost to mitigate: these six
   * weights answer to the twenty-four tables in `styles.ts` and to nothing else,
   * and the subsets carry this pair.
   *
   * Three styles in the catalogue own an authored `Voice` and return before this
   * field is read. None of them is here, so this governs all twenty-four.
   */
  voice: {
    archetypes: [
      ['arch-hook', 4],
      ['chant', 2.5],
      ['riff-response', 3],
      ['long-note', 2],
      ['descending-sequence', 2],
      ['wide-interval', 1],
    ],
    subsets: [
      [[0, 2, 3, 4, 6], 4],          // 1 3 4 5 ♭7 — rekilaulu, and the pentatonic in minor
      [[0, 1, 2, 3, 4, 5, 6], 3],    // the eleven dances, on the strings the hand is on
      [[0, 1, 3, 4, 6], 3],          // 1 2 4 5 ♭7 — no third, which is the drone
      [[0, 1, 2, 4, 5], 2],          // 1 2 3 5 6 — no seventh, so no question
    ],
    ops: { displace: 0.35, fragment: 0.6, invert: 0.4, reharmonise: 0.25 },
  },

  /**
   * The second fiddle is not an accompaniment, and one number says so.
   *
   * The shared defaults put the counter well behind the melody, which is right
   * everywhere else: a counter-melody is a second player answering in the lead's
   * gaps and it is supposed to be underneath. In a pelimanni band the counter is
   * the *other fiddle playing the same tune a third down*, and two players on one
   * line at unequal levels is one player with a halo. 0.65 against a melody at
   * 0.73 is two people, with the first fiddle just in front, which is where a
   * pair of them actually sits in a room.
   *
   * Which is why it is the one counter that moved when the catalogue took 2 dB
   * off every melody: this number was never a level, it was a *distance* from
   * the first fiddle. Left at 0.82 it would have made the second fiddle the
   * louder of the two.
   *
   * The pad goes furthest back of anything except ambient's kit, and for a
   * related reason: there is no pad in this music. What the layer draws is a
   * string ensemble standing in for nine fiddles playing one line, and at any
   * audible level that becomes an orchestra sitting behind a folk band. At 0.36
   * it is the room.
   *
   * Drums down to 0.42 from 0.59, which is the loudest thing this table says.
   * **Fourteen** of the twenty-four styles have no percussion at all, and what
   * the other **ten** have is mostly one frame drum played with two hands — a
   * drum mixed as a kit would be a drummer nobody hired. This said sixteen and
   * eight; `styles.ts` has the count and the note on where the wrong pair had
   * spread to.
   */
  mix: {
    // `melody` and `bass` carry the catalogue's 2 dB trim; see `gains` in generate/song.ts
    melody: 0.73,
    counter: 0.65,
    comp: 0.66,
    bass: 0.47,
    pad: 0.36,
    drums: 0.42,
  },

  /**
   * The hand drum is the kit, where there is one.
   *
   * `lp`, `mp` and `hp` are up and everything with a cymbal on it is down, which
   * is the same inversion reggae makes for a different instrument. In `polkka`,
   * `katrilli`, `piirileikki` and `tanhu` there is no kick, no snare and no
   * hi-hat: the low stroke of a frame drum *is* the pulse of the bar, played by
   * the same hands as everything else in it, and it has to carry a floor on its
   * own. `cp` is up too, because in `piirileikki` it is a whole room clapping
   * rather than a drummer accenting.
   *
   * The cymbals come down hard. `cr` at 0.3 is a quarter under the default and
   * it is a mitigation rather than a taste: `ending: 'button'` puts a cymbal
   * under the last chord of every piece in the genre, including the four that
   * should not have ended at all, and a quiet crash is the cheapest thing that
   * can be done about a decision argued at `ending` above.
   */
  drumMix: {
    bd: 0.92, sd: 0.7, rim: 0.7, hh: 0.34, oh: 0.38, cp: 0.8,
    lt: 0.68, mt: 0.66, ht: 0.64, cr: 0.3, rd: 0.26, perc: 0.62, cb: 0.4,
    sh: 0.4, tb: 0.55, lp: 0.95, mp: 0.78, hp: 0.62,
  },

  /**
   * A wooden room, and no delay anywhere.
   *
   * `delayBeats: 0` is the field's only zero in the project and it is a claim
   * about the whole genre rather than about a taste in production: every echo in
   * this repository is a machine — a tape unit, a spring, a plugin — and there
   * was no machine in any of these rooms until 1990. The eras may put a little
   * back; only `contemporary` does.
   *
   * A moderate room rather than a large one. A riihi is logs with hay in it,
   * which is close to the most absorbent building anybody has ever danced in.
   */
  space: {
    reverbSize: 0.5,
    delayBeats: 0,
    delayFeedback: 0,
  },

  /**
   * Standing production notes, refined by every era.
   *
   * Nothing here is filtered much and that is the statement. Reggae's bass is
   * dark because the instrument is dark; ambient's kit is filtered because the
   * genre is heard through a wall. These instruments are wood and gut in a room
   * with somebody standing next to them, and a lowpass at 9 kHz is roughly what
   * a wooden box does to its own top end and no more.
   *
   * The comp is the wettest thing here, which looks wrong until you know what it
   * is. In three of the four eras the comp layer is a **kantele or a harmonium** —
   * an undamped box of strings, or a reed organ, and both of them are objects
   * whose entire character is that the sound goes on after the hands have
   * stopped. Half of that is the envelope in `INSTRUMENTS`; the rest is the room
   * they were always in.
   */
  effects: {
    melody: { reverb: 0.34, lowpass: 9500 },
    counter: { reverb: 0.38, lowpass: 9000 },
    comp: { reverb: 0.42, lowpass: 8500 },
    pad: { reverb: 0.55, lowpass: 5200 },
    bass: { reverb: 0.12, lowpass: 2400 },
    drums: { reverb: 0.24, lowpass: 7000 },
    vocal: { reverb: 0.36, lowpass: 7500 },
  },

  /**
   * The band does not swell, and the counter is not an accompaniment.
   *
   * `response` is where a genre says how far each layer moves between its
   * quietest section and its loudest, and two numbers here are unusual. The
   * counter is at 0.9 — nearly the melody's — because it is a second fiddler
   * playing the same line, and a part that got quiet while the tune it is
   * doubling got loud would come apart. The bass and the comp barely move at
   * all: a village accompanist plays the same figure at the same weight from the
   * first bar to the last, and everything that arrives, arrives by somebody else
   * joining in.
   *
   * `offsets` puts the pad further down than the default's minor third, because
   * the string bed here is standing in for fiddles and there is already a fiddle
   * in that octave.
   */
  layerPlan: {
    offsets: { pad: -7 },
    response: { counter: 0.9, bass: 0.35, comp: 0.4, drums: 0.6 },
  },

  /**
   * There is no `comping` profile, and the absence is the same claim iskelmä
   * makes next door in slightly stronger terms.
   *
   * `CompingProfile` is three gestures an accompanist makes when their job is to
   * accompany a soloist: leave a bar out, anticipate the barline, nudge an
   * offbeat stab. The person playing chords in this music is not accompanying a
   * soloist, they are **holding the dance together for four hours**, frequently
   * on a harmonium with both hands and no way to be subtle about it. A guitarist
   * in a pelimanni band who started varying the figure would be making the dance
   * harder, which is exactly what iskelmä says about a tanssilava guitarist; the
   * only difference is that here nobody is being paid enough to be tasteful.
   */

  /**
   * The band carries on, except when one fiddler is left holding the tune.
   *
   * `full` genre-wide, because a dance does not stop for anybody — and then
   * `melody` overridden to `sparse` in the profile below, which is the one
   * gesture this repertoire actually has: the band drops away and the first
   * fiddle plays a strain alone, and then everybody comes back in. That is a
   * real and common thing at a wedding and it is not a solo.
   */
  soloBacking: 'full',

  /**
   * **The strain is ornamented too, and this is the only genre that says so.**
   *
   * Everything below about `solo` was true and was reaching one strain in four.
   * The profile said in as many words that a pelimanni's whole test is whether
   * their version of a tune everybody knows is worth hearing, set the highest
   * solo `ornament` figure in the project to say it, and then — because ornaments
   * lived inside `generateSolo` and nowhere else — handed a bare tune to the three
   * arrangements that have no `solo` section at all. A fiddler who decorates only
   * when the band stops is not a fiddler.
   *
   * `0.45` rather than the break's `0.6`, and the gap is the one real difference
   * between the two situations: a strain played *with* the band has a second
   * fiddle and a clarinet in it, and a first fiddle decorating every long note
   * over the top of them is a thicker texture than a wedding wants. Alone, they
   * open up. The break keeps its higher figure and this sits under it.
   *
   * At this rate a strain of eight bars carries three or four figures, which is
   * about what the Kaustinen recordings do: a grace note into the phrase, a
   * mordent on the long note in the middle, and the third beat filled in — the
   * three gestures the `solo` note below already names.
   */
  decorate: 0.45,

  /**
   * The strain, played by one person, with more notes in it.
   *
   * **This is not improvisation and calling it a solo is the engine's word rather
   * than the music's.** There is no such thing as a blowing chorus in Finnish
   * folk music: what happens when a section is handed to one player is that they
   * play *the tune*, ornamented — a mordent on every long note, a run into the
   * phrase, the third beat filled in — and the whole test of a pelimanni is
   * whether their version of a tune everybody knows is worth hearing. Iskelmä's
   * profile makes the same argument about a dance-band break and lands on
   * `paraphrase: 0.33`; this one goes to **0.78**, the highest in the project,
   * because there the break is the song with more notes and here the strain *is*
   * the strain.
   *
   * `chromatic: 0.02` and `enclosure: 0.04` are near-zero for a reason that is
   * not taste. A chromatic approach is a semitone the mode does not contain, and
   * in a genre whose entire proposition is that the seventh stays flat unless a
   * chord says otherwise, the commonest chromatic approach available is the
   * leading tone — arriving through the back door that `scaleForChord` was
   * written to close. Reggae learned this the expensive way and vetoes the note
   * outright; here the appetite is simply not there to begin with, and the tables
   * that could produce it are the five imported dances where the note is real.
   *
   * `ornament: 0.6` is the highest solo ornament figure in the project and it is
   * the entire content. A fiddler's decoration is a grace note crushed against
   * the beat, not a chromatic approach; that is the whole difference between this
   * and every jazz vocabulary in the repo.
   *
   * **Never the drums, and there is nothing to argue about.** Fourteen styles
   * have no percussion at all and only three write a kit voice; a drum solo in a
   * barn would be a person hitting a frame drum while a wedding waits. This said
   * sixteen — see `styles.ts` for where that number had spread to.
   */
  solo: {
    rotation: [['melody', 5], ['counter', 4], ['comp', 2]],
    tradeFours: 0,
    // The highest in the project. A strain played by one player that did not
    // quote the tune would not be recognisable as the same piece, which is the
    // one thing this gesture exists to be.
    quoteMotto: 0.75,
    backing: { melody: 'sparse', counter: 'full', comp: 'full' },
    vocabulary: {
      // Eighths. A fiddle tune runs in them and this is the tune.
      gait: 0.5,
      doubleTime: 0.05,
      // The accent belongs to the dance. Everything the fiddler does off the
      // beat is an ornament rather than a displacement.
      offbeatAccent: 0.12,
      enclosure: 0.04,
      chromatic: 0.02,
      // The subject. See the header.
      ornament: 0.6,
      develop: 0.62,
      displace: 0.12,
      // Almost none. A strain has eight bars and a shape, and a fiddler leaving
      // holes in it has lost their place rather than made a statement.
      space: 0.12,
      climb: 2,
      paraphrase: 0.78,
      // Modest. A pelimanni does not build into anything — the strain ends and
      // the band comes back in, which is an event that needs no announcing.
      liftIntoReturn: 0.35,
    },
  },

  /**
   * The band goes straight in, and mostly nobody announces anything.
   *
   * `elide` leads, which no other genre in the project does. A two-strain tune
   * has no seam to fill: the A strain ends on the downbeat of the bar the B
   * strain starts on, the fiddler is already playing the first note of it, and a
   * gesture in between would be somebody stopping to think. `fill` is second
   * rather than absent because ten of these styles have a drum — this said eight
   * — and a frame drum genuinely does mark the join.
   *
   * `shot` is small and real — a whole band landing together on the group heads
   * is what a pelimanni ensemble does at the top of the last time round.
   * `break` is absent for iskelmä's reason: a floor full of people and a band
   * that stops dead is an empty floor.
   */
  transitions: [['elide', 5], ['fill', 3], ['shot', 2]],

  /**
   * The drummer's vocabulary, in a genre that mostly has no drummer.
   *
   * `drop` leads it, and in this repertoire that is not a fill at all — it is the
   * frame drum stopping for a bar so the tune turns over in the clear, which is
   * the commonest thing that happens at a strain boundary here. `lead-in` is
   * next: two or three hits on the last beat, which is a hand on a skin and
   * nothing else. `rim` is the dry crack a hand drum's high stroke resolves to on
   * every bank in `BANK_VOICES`, so it belongs in the palette rather than as an
   * exception.
   *
   * `tom-roll` is last and is not zero. A descending roll into a crash is a
   * dance-band gesture and it does happen — in `tanhu` and `sahkopelimanni`,
   * where the band has a kit and an audience and knows what it is doing.
   */
  fills: [
    ['drop', 5], ['lead-in', 4], ['rim', 3], ['snare-toms', 2], ['tom-roll', 1],
  ],

  /**
   * A minute and a half to a bit under four. Short at the bottom because a folk
   * tune is short — two strains, round three or four times, and then the fiddler
   * stops because the dance figure has ended.
   *
   * The top is set by the five-beat styles rather than by any wish for length,
   * and it is worth naming because the number would otherwise look generous. A
   * bar of `itkuvirsi` at 54 bpm is five and a half seconds, the strophic form is
   * seven steps, and the form builder will only trim a form down to five — so the
   * shortest lament this genre can produce is a little over four minutes and a
   * ceiling below that would be a target nothing could hit.
   *
   * **That builder is `buildForm` in `generate/song.ts`, not `growForm`**, which
   * this note called it and which exists nowhere in the project — the floor is
   * the literal `steps.length > 5` in its trim loop, and it is worth being
   * findable because it is the only thing standing between this genre and a
   * two-minute lament. `docs/engine-gaps.md` §4 carries the same wrong name.
   */
  duration: [100, 235],

  /**
   * The chord rule. Rooted on the tonic, searched flatward first, and it stops
   * before it would have to invent a leading tone.
   *
   * The full argument is in the header. What the code does is search a short
   * ladder for the flattest mode of the tonic that contains every note of the
   * chord, which produces the five behaviours listed there — and, in the case
   * that matters most, returns `major` for a `V` in a major key because that is
   * the only entry on the ladder containing the chord's third.
   *
   * The fallback is the interesting line. When no mode on the ladder holds the
   * chord — a `bII`, a borrowed thing in the wrong direction, a secondary
   * dominant in a style that has one — it stays in the *flattest* mode rather
   * than chasing the chord, and the out-of-scale tone under an unmoved line is a
   * colour. That is the same answer reggae and ambient both give and it is right
   * here for a third reason: a fiddler whose left hand is in first position does
   * not re-orient because the accompanist has played something unexpected.
   */
  scaleForChord: (tonic, mode, chord) => {
    const ladder = mode === 'minor' ? MINOR_LADDER : MAJOR_LADDER;
    const tones = chordPcs(chord);
    for (const name of ladder) {
      const scale = makeScale(tonic, name);
      if (tones.every((t) => scale.pcs.includes(t))) return scale;
    }
    return makeScale(tonic, ladder[0]!);
  },

  /** The barn, the kansallispuku and a bill for a wedding. See `staging.ts`. */
  staging: STAGING,
};
