/**
 * Rock — 1963 to 1997, and twenty-four styles built on two notes.
 *
 * The flat seventh and the flat third. Everything else here is arrangement.
 *
 * ## The load-bearing decision: `scaleForChord`
 *
 * Five answers to "where does the melody get its notes" existed before this.
 * Iskelmä follows the *key*; jazz follows the *chord*; ambient follows the
 * *drone*; synth follows the key without the leading tone; funk follows the
 * *tonic*, fixed for the whole song and ignoring the chord entirely.
 *
 * This one follows the **key**, and after about 1966 without the leading tone.
 * Mechanically that puts it in synth's and reggae's family and the honest thing
 * is to say so here rather than let somebody find the resemblance and conclude
 * the genre was a mistake: it is a ladder of modes rooted on the tonic, searched
 * outward until one holds the chord that has arrived. What falls out is the
 * harmonic behaviour this music has —
 *
 *     bVII under a major key      →  mixolydian   the genre's characteristic note
 *     bVI or bIII under a major   →  aeolian      the borrowed chords, all at once
 *     IV major under a minor key  →  dorian
 *     bII under a minor key       →  phrygian     stoner, psych, surf
 *     VII under a minor key       →  aeolian, unchanged — which is the point
 *
 * **Where a dance band writes `V`, this writes `bVII`.** That is the same
 * sentence synth and reggae both write, arrived at from a third direction, and
 * `preparedModulation: false` below closes the other door the raised seventh
 * could have come through. Not one minor-key progression in `styles.ts` contains
 * an uppercase `V`; where one is wanted there is a lowercase `v`, which is a
 * *minor* five and has a natural seventh in it.
 *
 * ### Where the major ladder differs from every relative it has
 *
 * It ends on **aeolian on the same tonic**, which reggae's does not and synth's
 * does not, and that one rung is what "rock major" means. A rock song in a major
 * key borrows `bIII`, `bVI` and `bVII` from the parallel minor — not from the
 * relative one, not as a modulation, but as chords that appear in the middle of
 * a major verse and go away again. `grunge`'s major verse table is `I bIII bVI
 * IV` and the tonic chord is still major throughout. No ladder that stops at
 * mixolydian holds those, and the honest scale under them is the parallel minor,
 * with the melody's own major third arriving from the chord rather than from the
 * scale.
 *
 * ### And then the blues, which contradicts all of it
 *
 * A ♭3 over a major tonic is wrong by every rule in `core/rules.ts` and is the
 * sound of the entire genre. That cannot be reconciled inside a key-relative
 * rule, because it is not a statement about the key at all — the blues scale is
 * a fixed object the key is played *through*, the same five notes over a major I
 * and a minor i, and a rule that bent with the mode would produce a country
 * record in one and a modal one in the other.
 *
 * So it is not reconciled. It is **located**, in the one field built for a claim
 * a style makes about itself: eight of the twenty-four styles override
 * `scaleForChord` with the tonic minor pentatonic, and `styles.ts` argues it at
 * `pentatonicLead` and names the eight. The split is not arbitrary and it is not
 * a dimmer switch — it is whether the style's tune is a **riff** or a **song**.
 * `bluesrock`, `boogie`, `hard`, `riff`, `southern`, `stoner`, `grunge` and
 * `garage` have riffs for tunes and take five notes; `beat`, `jangle`, `ballad`,
 * `newwave`, `prog` and the rest have sung melodies and follow the key.
 *
 * A third of the catalogue overriding is a lot for a field whose own doc says it
 * should be rare, and the defence is that rock is the genre where the exception
 * is *large* rather than the genre where the discipline slipped. Jazz overrides
 * on one style and funk on one, because in those repertoires the blues is one
 * corner; here it is the guitar solo, the riff and the whole British blues boom,
 * and a version that kept the count down to one would put a diatonic tune over
 * "Whole Lotta Love".
 *
 * The rest of the reconciliation is not in this file at all. `skeletonFor`
 * intersects each chord with the prevailing scale before choosing a phrase's
 * structural notes — so a C major triad under C minor pentatonic yields anchors
 * of C and G, and the ♭3 arrives as the note connecting them rather than as
 * something the tune lands on and holds. That is a blues line described exactly,
 * and it is the pass that made this expressible: `skeleton.ts` records the jazz
 * blues sitting on a ♮3 for 17.2% of its melody notes before it existed, 82% of
 * them on a beat, because the major third is a chord tone and no chord-scale
 * rule can take away a note the layer underneath never asks about.
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
 * The modes the melody may live in, minor first and major second.
 *
 * Three rungs each, and the last rung of the major ladder is the one that earns
 * the whole table — see the header. In minor the tune is aeolian and bends to
 * dorian when the band puts a major IV under it, and no further than phrygian,
 * which is where `stoner` and `surf` live. In major it is major, bends to
 * mixolydian the moment the ♭VII arrives, and falls all the way to the parallel
 * minor for the borrowed ♭III and ♭VI.
 *
 * **Harmonic minor is absent and the absence is the genre's central negative
 * claim.** iskelmä's rule is otherwise exactly this one plus a line:
 *
 *     if (mode === 'minor' && chord.dominantFunction)
 *       return makeScale(tonic, 'harmonicMinor');     // iskelmä does this
 *
 * Harmonic minor exists to manufacture a leading tone under a dominant, and
 * there is no dominant in minor here to manufacture one for.
 */
const MINOR_LADDER: ScaleName[] = ['minor', 'dorian', 'phrygian'];
const MAJOR_LADDER: ScaleName[] = ['major', 'mixolydian', 'minor'];

/**
 * Forms.
 *
 * Five, and they are the same shape at four lengths, which is a fact about the
 * repertoire rather than a shortage of ideas: rock has exactly one form —
 * verse, chorus, verse, chorus, something in the middle, chorus — and what
 * varies is how long each of those is and whether the something is a guitar
 * solo or a bridge. Jazz has head–solos–head and reggae has the version; this
 * genre spent thirty years not inventing a second form and it would be dishonest
 * to give it one.
 *
 * The **solo is a section rather than a device**, and that is the one thing
 * these tables have to get right. A rock guitar solo is not eight bars of
 * decoration in the middle of a verse, it is its own part of the record with the
 * band playing underneath at full weight, and three of the five forms below have
 * one because roughly three fifths of this repertoire does.
 *
 * The two-minute form has no solo in it at all and is the beat and punk shape.
 * `buildForm` doubles its sections when the bar is under a second and a half,
 * which at 190 BPM it is — so a punk song gets sixteen-bar verses without being
 * told, which is what those records actually have.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  // The single, with a solo. The commonest thing in the catalogue by a distance.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'solo', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 6],
  // The single, with a bridge where the solo would be. The pop end of the genre.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'bridge', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 5],
  // The album track. Sixteen-bar verses, a long solo, and a slow fade that is
  // written as an eight-bar outro because this genre buttons its endings.
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'solo', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 8 },
  ], 4],
  // Two minutes and no solo. The beat single and the punk single, which are the
  // same form twelve years apart.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 4],
  // The long one: two solos with a bridge between them. Prog, hard rock, and the
  // side of the album nobody skipped.
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'solo', bars: 16 }, { kind: 'bridge', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'solo', bars: 16 },
    { kind: 'chorus', bars: 8 }, { kind: 'outro', bars: 8 },
  ], 3],
];

export const rock: Genre = {
  walkup: 0.25,
  /**
   * Direct, never prepared — and the same negative claim as the missing harmonic
   * minor.
   *
   * `keyChangeChance` is small in three eras here and largest in the beat one,
   * where a last-chorus lift is a normal thing for a pop writer to have written.
   * Even there it arrives unannounced, which is what those records do: the
   * straight-cut semitone lift, with the band simply arriving a fret higher and
   * nothing in front of it. An applied dominant would put a leading tone in a
   * minor-key song, which is the one thing this genre asserts never happens, and
   * in a major-key one it would sound like a dance band had walked in. See
   * `tune/keyplan.ts`.
   */
  preparedModulation: false,
  id: 'rock',
  label: 'Rock',
  description:
    'Beat, garage, blues rock, the riff, glam, prog, arena, punk and grunge — 1963 to 1997, on a backbeat and a flat seventh.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,

  /**
   * Guitar keys, and the guitar decides.
   *
   * The open strings in standard tuning are E, A, D, G, B and E, and a rock key
   * is chosen so that the tonic is one of them — because an open string rings
   * where a fretted note is damped by the hand holding it, and a riff in E has a
   * bottom note the player is not touching. That single fact is why E, A, D and
   * G carry almost all the weight below, in both modes, and why this table looks
   * nothing like jazz's.
   *
   * The keys that are nearly absent are as informative. E♭, A♭ and B♭ are horn
   * keys — flat keys exist because a B♭ trumpet is written a tone up — and rock
   * has no horns. They appear here at weight 1 and 2 and no higher, which is
   * roughly the proportion of this repertoire that had a Memphis section on it.
   *
   * C♯ minor and F♯ minor are the drop-tuned end: down a semitone or a whole
   * tone from D and E, which is what the heavy end of the catalogue actually
   * did to get lower without retuning its heads.
   */
  keys: {
    minor: [[4, 8], [9, 7], [2, 6], [11, 4], [7, 3], [6, 2], [1, 2], [0, 2], [5, 1]],
    major: [[4, 7], [9, 7], [2, 6], [7, 5], [0, 4], [11, 2], [5, 2], [10, 1]],
  },

  /**
   * It buttons, and the difference from reggae is worth stating because it is
   * the same question answered oppositely.
   *
   * A Jamaican single fades because the riddim carries on into the version on the
   * B side and somebody else's record next month; the fade is a claim that this
   * particular song was not the point. A rock band lands the last chord together
   * with a cymbal under it, because the band *is* the point and the ending is
   * where they demonstrate it. Every rock record ever made in front of an
   * audience ends this way, and the fade-outs on the studio versions are an
   * editing decision taken by somebody who was not there.
   *
   * The one place this reads slightly wrong is the album track, whose eight-bar
   * outro would have faded on the record. It buttons here, which is what the band
   * did before the engineer got hold of it.
   */
  ending: 'button',

  /**
   * Somebody counts it in, usually with sticks.
   *
   * Four on the hi-hat or four sticks clicked together, and it is on an
   * enormous number of these records rather than only on the stage. `withCountIn`
   * applies it only in front of an audience, which is the right restriction and
   * costs this genre one of its own conventions — a beat single that counted
   * itself in was not a demo, it was a decision.
   */
  countIn: true,

  /**
   * `standard`, with the overrides below doing real work rather than opening
   * everything.
   *
   * `light` was the tempting answer, because at level 1 only the melodic-interval
   * rules apply at all and every vertical rule that describes a blues stays
   * switched off for free. It is the wrong answer for the same reason: it would
   * make the genre's whole position on those rules unfalsifiable and undocumented,
   * and a later reader raising the setting would find the tables had never been
   * asked the question. At `standard` the disagreements are live, stated, and
   * every one of them names what it is protecting.
   */
  defaultStrictness: 'standard',

  /**
   * `catchy` — the rhythm locked, and each section recalled.
   *
   * A rock chorus is meant to be the same chorus every time and a rock verse is
   * meant to be the same tune with different words; this is a genre of singles
   * whose commercial logic is that somebody remembers eight bars of it. Three
   * styles push past it to `earworm` — `boogie`, `glam`, `punk` and `motorik` —
   * and each of those is a style whose proposition is that nothing changes at
   * all. `bluesrock` and `riff` pull *back* to `standard`, which looks like the
   * wrong direction until you notice that in both of them the figure is already
   * doing the repeating and doubling it would produce a loop rather than a song.
   */
  defaultHook: 'catchy',

  /**
   * Two players on one line, in octaves or in thirds, and that is most of what
   * this genre's arranger does.
   *
   * `unison` and `harmony` lead the table and both are up sharply from the
   * shared default. They are the two devices that describe a *second guitarist*,
   * which is the instrument this genre has and none of the others do: two guitars
   * an octave apart on the riff is what makes a riff sound like a wall, and two
   * guitars a third apart on the tune is the entire identity of `southern` and
   * half of `hard`. Neither gesture is available to a band with one chordal
   * player, which is why the shared odds treat them as one of six.
   *
   * **`southern` has since stopped drawing the one it is named for**, and the 6
   * is what covers the other twenty-three. A device is an event — one phrase of
   * one repeat chorus — and `Style.harmony` on that style says the two guitars
   * are the music instead; a declaration *replaces* this draw for whoever writes
   * one, so nothing here is spent twice. `half of hard` is the sentence this
   * weight is now entirely for, and it is the right half: a hard rock second
   * guitarist doubles the riff (`unison`, at 7) and harmonises the tune when the
   * arrangement reaches for it.
   *
   * `tutti` stays high. The whole band stopping to hit the hook's rhythm is the
   * stop-time before the last chorus, and it is a rock gesture in a way it is not
   * a reggae one — iskelmä rules it down because a band stopping dead empties a
   * dance floor, and here it fills one.
   *
   * `riff` and `swell` are the horn-section devices and both stay near their
   * defaults, which is not where they started. Cutting them looked right — this
   * genre's `brass` layer is present in maybe one arrangement in five, so why
   * weight what is usually absent — and it was wrong twice over. It is
   * `layersFor` that decides whether there are horns at all; this table only
   * decides what they play once there are. And `swell`'s default of 8 against
   * everything else's 3 or 4 is not an opinion about how often a section should
   * sustain, it is a correction for a device that is *quiet by construction*:
   * `swell` fires only on the tune's long notes, so most of the bars in an
   * arrangement that drew it are spent elsewhere. Halved, rock's brass came out
   * **7% sustained against a catalogue mean of 22%** — a horn section that only
   * ever stabs, which is a Memphis section with the pad taken out and is exactly
   * the arrangement nobody has written. At 6 it sits at 29%.
   *
   * `trade` goes lowest. Handing a phrase between two players is a conversation,
   * and two guitarists in a rock band are not having one — they are playing the
   * same thing.
   */
  arrangement: { unison: 7, harmony: 6, tutti: 5, riff: 3, swell: 6, trade: 1 },

  /**
   * Where this genre disagrees with the shared rule table.
   *
   * Nine relaxations and one addition, and the addition is the important half:
   * a table this long reads as a genre with the rules switched off unless the
   * counterweight is visible. `chromatic-leading-tone-in-minor` is turned *on*
   * here, vetoing from the first level, and it is what makes the claim at the top
   * of the file true against the one part of the pipeline that could break it.
   *
   * Only one rule is disabled outright. Every other entry keeps the fault as a
   * *preference* — the penalty stays, the veto goes — because in every case the
   * rule is describing something real that this music does on purpose and could
   * still overdo.
   */
  ruleOverrides: {
    /**
     * **The one that would have broken this genre in silence.**
     *
     * `augmented-second` vetoes any move of one scale step and three semitones,
     * from strictness 1 upward. In harmonic minor that is correct — it is the
     * accident of reaching for the raised seventh over a dominant. In the *minor
     * pentatonic*, which is what eight styles here use, it fires on two of the
     * scale's five steps: tonic to ♭3, and fifth to ♭7. Those are not a hazard
     * in this music, they are the first two notes of nearly every riff in
     * `styles.ts`, and the rule would have refused both at every level this
     * genre ships at — producing lines that were legal, correct, and had the
     * rock taken out of them, with nothing reported anywhere.
     *
     * Disabled rather than softened, because there is no level at which it is
     * right here. `core/scale.ts` warns about exactly this against the pentatonic
     * rows, and this is the entry that warning is for.
     */
    'augmented-second': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * ## The three rules that between them describe a blues
     *
     * A ♭3 held on a downbeat over a major tonic, arrived at by a leap of a
     * minor third, against a guitar sounding the ♮3. Each of the next three
     * rules is about one clause of that sentence and each is correct about the
     * music it was written for:
     *
     *  - `unprepared-dissonance` — how the line got there. Dissonance should be
     *    approached by step, which is what makes a passing note sound
     *    intentional. A pentatonic line *cannot* approach the ♭3 by step, since
     *    the note below it in the scale is the tonic three semitones away, so
     *    the rule fires on the scale's own construction rather than on anything
     *    the generator chose.
     *  - `non-chord-tone-on-strong-beat` — where it landed. Over a major triad
     *    the ♭3, the 4 and the ♭7 are all non-chord tones, which is three of the
     *    scale's five notes, and putting one of them on beat one is the gesture
     *    rather than the fault.
     *  - `semitone-clash` — what it landed against. The grind between a sung ♭3
     *    and a strummed ♮3 is the sound of the idiom. It is the single most
     *    productive dissonance in twentieth-century popular music and the rule
     *    correctly identifies it as the most common source of accidental
     *    sourness, which it also is.
     *
     * All three keep their penalties and lose their vetoes. The distinction
     * matters: a line can still be talked out of a blue note when something
     * better is available, and what it can no longer be is *forbidden* one.
     */
    'unprepared-dissonance': { minLevel: 3, vetoLevel: RULE_DISABLED, penalty: 0.55 },
    'non-chord-tone-on-strong-beat': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.6 },
    'semitone-clash': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.6 },

    /**
     * The guitar part is parallel fifths. That is not a slip, it is the object.
     *
     * `parallel-perfects` is a choral prohibition about two *independent* lines
     * fusing into one, and it is right about that — but a rock arrangement has
     * two guitars deliberately playing one line in octaves, a bass doubling the
     * riff, and a chord shape carried up and down the neck without changing its
     * fingering. Fusing the lines is the entire point; the thickness that
     * classical practice calls hollow is what this genre calls loud.
     *
     * Softened rather than disabled, and the softening is meaningful. The rule
     * measures melody against *bass*, and a melody that shadowed the bass line in
     * fifths for a whole verse would be a real fault even here — one guitar
     * doubling the riff is an arrangement, and the singer doing it too is a song
     * with nothing in it.
     */
    'parallel-perfects': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.55 },

    /**
     * A rock hook hammers one note more than any rule expects.
     *
     * `repeated-note-run` vetoes three identical notes in a row from strictness 2
     * — which is where this genre ships — and three identical notes in a row is
     * how a very large number of these choruses begin. The interest is in the
     * *rhythm* and in what the harmony underneath is doing while the note stays
     * put, which is a device the rule cannot see.
     *
     * Softened rather than disabled, because a rock line can absolutely stall. It
     * simply does it later than a line in any other genre here.
     */
    'repeated-note-run': { minLevel: 3, vetoLevel: RULE_DISABLED, penalty: 0.8 },

    /**
     * Nothing resolves, and the two tendency-tone rules are about resolutions.
     *
     * `unresolved-leading-tone` requires the seventh under a dominant to rise to
     * the tonic. In a major-key rock song the commonest thing to follow a V is a
     * **IV** — the twelve-bar turnaround, and then every three-chord song
     * descended from one — and there the leading tone falls a whole tone instead,
     * which the rule reads as leaving it hanging and which everybody who has
     * heard a rock record reads as the cadence.
     *
     * `unresolved-seventh` wants the seventh of a seventh chord to fall by step.
     * Over the `I7` that half this genre's major tables open on, the ♭7 is not a
     * dissonance under pressure at all: it is a *colour of the tonic*, it is
     * degree four of the pentatonic, and it is where the riff comes to rest.
     */
    'unresolved-leading-tone': { minLevel: 3, vetoLevel: RULE_DISABLED, penalty: 0.7 },
    'unresolved-seventh': { minLevel: 3, vetoLevel: RULE_DISABLED, penalty: 0.75 },

    /**
     * Blue notes are chromatic by construction when the scale has five notes in
     * it.
     *
     * On the eight pentatonic styles the second and the sixth degrees are outside
     * the prevailing scale by definition, and so is the ♭5 that a line slides
     * through between the fourth and the fifth — all of which are ordinary
     * passing motion rather than chromaticism in any sense the rule means.
     *
     * **Softened rather than disabled, which is where this genre parts company
     * with funk.** Funk turns `chromatic-tone` off outright and is entitled to:
     * its scale is fixed for the whole song and every note outside it is
     * deliberate. Here two thirds of the styles follow the key with seven notes
     * available, and there a note outside the scale is the ordinary thing the
     * rule was written about. One override has to cover both, so it keeps a
     * penalty at the top level and loses the veto.
     */
    'chromatic-tone': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.5 },

    /**
     * And this is the addition, which enforces the claim at the top of the file
     * against the one thing that could break it.
     *
     * `scaleForChord` never producing a raised seventh is a fact about the *chord
     * scale*, not about the music, and synth learned the difference expensively:
     * nothing that decorates a line asks the chord scale for permission. A
     * soloist's `chromatic` appetite is offered the semitone either side of
     * wherever it is, and one of those is the leading tone — so seventeen songs
     * in two hundred came out with one in a minor key while the tables stayed
     * innocent.
     *
     * This genre has a `solo` profile, a solo section in three of its five forms,
     * and a guitarist with more appetite for a chromatic note than any other
     * soloist here. The same hole is wide open. Vetoed from the first level
     * rather than penalised, because it is not a matter of taste that gets
     * stricter with the setting: the note is either in this music after 1966 or
     * it is not, and it is not.
     *
     * The rule is scoped to notes *outside the prevailing scale*, so it can never
     * contradict `scaleForChord` — which matters here more than it did for
     * synth, because a future beat-era style that wanted a real `V` in minor
     * could say so with its own `scaleForChord` and this would stand aside. None
     * does today.
     *
     * ## What it does not catch, measured
     *
     * Across all twenty-four styles, three seeds each, counting every melody and
     * counter note inside a minor section:
     *
     *     free       45 in 9,675      the rule does not apply at level 0
     *     light       0 in 9,640
     *     standard    1 in 9,747      ← where this genre ships
     *     strict      4 in 9,651
     *     polished    9 in 10,155
     *
     * The shape of that column is the interesting part and it is not a bug in
     * this override. `light` is the rule working exactly as written. What puts
     * the note back at the top of the range is the **graceful degradation** the
     * rule table is built on: when every candidate for a note is vetoed, the
     * caller relaxes one level at a time rather than emitting nothing, and at
     * level 0 no rule applies at all — including this one. The stricter the
     * setting, the more often every candidate is forbidden, so the more often the
     * relaxation reaches the floor.
     *
     * That is the correct trade and it is not worth breaking to buy an absolute:
     * music that obeys no rule beats music that stops. The claim this genre makes
     * is therefore exact rather than absolute — the leading tone is refused
     * wherever there is any other note to play — and one melody note in ten
     * thousand at the shipping setting is what that costs.
     */
    'chromatic-leading-tone-in-minor': { minLevel: 1, vetoLevel: 1 },
  },

  /**
   * The comp is the record, and that single number is the genre.
   *
   * The shared default puts the comp at 0.72, over the bass at 0.50 only in the
   * sense that a chordal instrument is accompaniment. In this music it is not:
   * the guitar is the loudest thing in the room, on stage and on the record, and
   * an arrangement where it sits politely behind the tune is a mix of some other
   * genre. 0.86 used to put it within a decibel of the melody — which, half the
   * time, *is a guitar too* — and since the catalogue took 2 dB off every tune it
   * puts the comp a decibel and a half *in front*. That is the right side of the
   * line to have landed on: nothing else in the table moved, so what the trim
   * did here was finish the sentence this paragraph was already making.
   *
   * Drums up from 0.59 to 0.72. A rock kit is being hit hard and recorded with
   * room microphones; it is the second-loudest object in the arrangement and in
   * the alternative era it is arguably the first.
   *
   * The pad goes down to 0.44, which is the largest cut here. This genre's pad is
   * a Hammond wash or a Mellotron or a string synth, and in every case it is
   * something *added underneath* rather than a bed the arrangement was written
   * over. Ambient inverts this and says so; here the inversion would be a
   * keyboard player mixed over two guitarists, which has never once happened.
   */
  mix: {
    // `melody` and `bass` carry the catalogue's 2 dB trim; see `gains` in generate/song.ts
    comp: 0.86,
    drums: 0.72,
    bass: 0.55,
    melody: 0.71,
    counter: 0.62,
    pad: 0.44,
    brass: 0.5,
  },

  /**
   * The kit, mixed as the thing the backbeat comes out of.
   *
   * `sd` at 0.95 is the number that matters and it is a large move up from the
   * shared 0.85. In every other genre here the snare is one voice among several;
   * here it is the *event the bar is organised around*, it is what the audience
   * claps on, and a mix that treats it as an accent has buried the genre's one
   * universal property. It sits just under the kick rather than level with it,
   * which is where a rock mix actually puts it.
   *
   * The toms come up to around 0.8 from 0.7, and the crash from 0.55 to 0.7,
   * because in this genre the fill is not decoration — `fills` below leads with
   * `tom-roll`, and a tom roll into a crash is how every section of a rock record
   * is announced. The ride goes the other way, down to 0.42: a rock drummer's
   * ride is a texture for one verse, where a jazz drummer's is the pulse.
   *
   * `tb` at 0.55 is up from 0.45 and is entirely for the beat era, where a
   * tambourine doubling the snare is on every other track and is most of why
   * those records sound bright on a small speaker.
   */
  drumMix: {
    bd: 1.0, sd: 0.95, rim: 0.55, hh: 0.5, oh: 0.6, cp: 0.72,
    lt: 0.82, mt: 0.8, ht: 0.78, cr: 0.7, rd: 0.42, perc: 0.45, cb: 0.45,
    sh: 0.35, tb: 0.55, lp: 0.6, mp: 0.45, hp: 0.4,
  },

  /**
   * The guitar sits well below the tune, and the band swells into the chorus.
   *
   * `offsets` is a register statement rather than a level one. The comp's −5 is
   * the largest downward offset in the project after ambient's and it is about
   * the *instrument*: a barre chord on a guitar is a low object — the root is
   * frequently below middle C and the whole voicing spans an octave from there —
   * and the default −0 would voice it in the melody's own octave, where a
   * distorted guitar and a sung line fuse into one loud thing and the ear picks
   * whichever is louder. The pad drops a whole further octave, for the reason
   * given in the mix above.
   *
   * `response` is where this genre disagrees flatly with reggae's, and the two
   * fields make the disagreement legible side by side. A riddim is a fixed object
   * that a chorus happens over, so reggae pins its bass response at 0.2. Rock is
   * the opposite claim: the chorus is *louder*, that is the whole of what makes
   * it a chorus, and every player leans into it. The drums at 0.85 are the
   * strongest statement of it — the difference between a verse and a chorus in
   * this music is very often nothing but how hard the drummer is hitting.
   */
  layerPlan: {
    offsets: { comp: -5, pad: -10 },
    response: { drums: 0.85, comp: 0.8, bass: 0.6 },
  },

  /**
   * There is no `comping` profile, and the absence is a claim.
   *
   * `CompingProfile` is three gestures a chordal player makes when their job is
   * to accompany: leave a bar out, anticipate the barline, nudge an offbeat stab.
   * All three are right for jazz and all three are wrong here, and it is the
   * first one that shows why. A rock rhythm guitarist who left bars out would be
   * removing the only continuous thing in the arrangement — the wall — and what
   * is behind the wall is nothing, because there is no piano and no horn section
   * and frequently no pad. The hole is not a space, it is a dropout.
   *
   * Iskelmä states the same absence because its chords are how the floor knows
   * where beat one is. This genre's version is nearer the opposite and lands in
   * the same place: the guitar is not telling anybody where the beat is, the
   * drummer is doing that — the guitar is telling them how loud the song is, and
   * a part that varied its density would be varying the volume of the record.
   */

  /**
   * A medium room and a dotted-eighth delay.
   *
   * The delay length is a convention rather than a preference, and it is the
   * same three-sixteenths that ambient, synth and reggae all state: it never
   * lands where the beat does. What is different here is that it is *rarely
   * audible*. Feedback at 0.22 is the lowest in the project — well under
   * reggae's 0.55, where the echo is a second drummer — because in this genre a
   * delay is a slapback on a vocal or one repeat on a lead line, and anything
   * more is a different decade's record. The `arena` era opens it and nothing
   * else does.
   */
  space: {
    reverbSize: 0.55,
    delayBeats: 0.75,
    delayFeedback: 0.22,
  },

  /**
   * Standing production notes, refined by each era.
   *
   * **The bass is dark and dry, and it is a *different* dark from reggae's.**
   * That genre puts its low-pass at 900 Hz because the instrument is flatwounds
   * with foam under them and the tone control shut — the whole signal is
   * fundamental and second harmonic. A rock bass is a plectrum on roundwounds
   * through a valve amplifier with the treble up, and the *attack* is half of
   * what makes it audible against two guitars. 1800 Hz keeps the growl and still
   * puts a ceiling on it, which is where the instrument actually sits.
   *
   * Dry for the reason ambient and reggae both give about theirs: a reverb on a
   * sustained low note arrives while the note is still sounding and the two beat
   * against each other. That is not a genre-specific fact, it is physics, and
   * every genre here that has thought about it has landed on the same number.
   *
   * The comp is where the low-pass does real work. 6800 Hz on a chordal layer is
   * dark for this project, and it is the amplifier: a guitar speaker is a
   * twelve-inch cone in a sealed box with no tweeter, and it produces essentially
   * nothing above 6 kHz. A distorted guitar rendered full-range does not sound
   * brighter, it sounds like a distorted *sample*, which is the single most
   * common way a synthesised rock arrangement gives itself away.
   */
  /**
   * The riff hand and the open hand, and rock is where they are evenly matched.
   *
   * A palm mute drives a verse and an open strum lifts a chorus, and both are
   * ordinary here in a way they are not in metal — which is the same two
   * techniques weighted 8 to 2 rather than 5 to 4, and the difference between
   * those two ratios is most of the difference between the genres.
   */
  techniques: {
    comp: [['muted', 5], ['strum', 4], ['plectrum', 3]],
  },
  effects: {
    bass: { reverb: 0.04, lowpass: 1800 },
    drums: { reverb: 0.32, lowpass: 8000 },
    comp: { reverb: 0.2, lowpass: 6800 },
    melody: { reverb: 0.28, delay: 0.16, lowpass: 7200 },
    counter: { reverb: 0.3, delay: 0.18, lowpass: 7000 },
    brass: { reverb: 0.28, lowpass: 7000 },
    pad: { reverb: 0.48, lowpass: 5000 },
    vocal: { reverb: 0.28, delay: 0.14, lowpass: 7500 },
  },

  /**
   * The filter moves, on two styles, and it moves under somebody's foot.
   *
   * `applyFilter` is a no-op unless both the genre and the style have declared
   * something, so this profile costs nothing on the twenty-two styles that name
   * no sweep and their notes come back with no `brightness` field at all — which
   * is the right artefact, and the reason the check next door asserts that
   * genres without a profile emit nothing rather than emitting a grid of ones.
   *
   * `psych` declares a ramp and `shoegaze` a step. In both the object is a pedal
   * rather than a mix move: a wah rocked slowly across eight bars, or a phaser
   * left on for the chorus and off for the verse. The `response` table says so —
   * the comp and the melody move most, because those are the two layers with a
   * guitar in them and a pedal is on a guitar lead. The bass barely moves at
   * 0.15: bass pedals existed and were rare, and the drums are at zero because a
   * drum kit has no filter on it and never had.
   *
   * `kind` states only the disagreements with the default. The chorus is
   * brightest, which is not a filter statement so much as a statement about what
   * a chorus is here; the solo is nearly as bright, because the pedal is down.
   */
  filter: {
    kind: { intro: 0.55, verse: 0.6, chorus: 1, bridge: 0.7, solo: 0.92, outro: 0.5 },
    response: { comp: 0.8, melody: 0.7, counter: 0.6, pad: 0.5, bass: 0.15, drums: 0 },
    build: 0.3,
  },

  /**
   * The band does not get out of the way, and the argument is not reggae's.
   *
   * A riddim carries on because the riddim is the record and the soloist is a
   * guest on it. Here the band carries on because a guitar solo is a *contest* —
   * it is the loudest passage of the song, the drummer opens up underneath it,
   * and a rhythm section that thinned out would have removed the thing the
   * soloist is playing over the top of. `full` everywhere except the bass, which
   * gets `sparse` for the reason every genre gives: a bass solo that nobody made
   * room for is not audible.
   *
   * `tradeFours: 0`. Four bars of guitar and four bars of drums, alternating, is
   * a jazz gesture and it has essentially never happened on a rock record. The
   * drum solo that does happen here is a whole section rather than a shared one,
   * which `trade` covers as its degenerate case — read `blocks`, never the name.
   */
  soloBacking: 'full',
  solo: {
    /**
     * The guitarist, and then the guitarist.
     *
     * `melody` and `counter` between them are eleven of the fifteen weight, and
     * in this genre both of those layers are usually a guitar — so the rotation
     * is less a choice of soloist than a choice of *which* guitar. `comp` at 2 is
     * the keyboard player getting a chorus, which happens on the prog and hard
     * end and nowhere else. `drums` at 1 is Moby Dick, and it is weighted exactly
     * as often as it deserves.
     */
    rotation: [['melody', 6], ['counter', 5], ['comp', 2], ['bass', 1], ['drums', 1]],
    tradeFours: 0,
    /**
     * Low, and lower than iskelmä's or reggae's.
     *
     * `quoteMotto` is the chance the solo opens by quoting the song's own tune.
     * An iskelmä break *is* the tune ornamented, so it sits at 0.85; a reggae
     * version is the same song with the singer taken off, so 0.6. A rock guitar
     * solo is a separate composition that happens to be in the same key — the
     * whole convention is that the guitarist gets sixteen bars to say something
     * the song was not saying — and a solo that opened with the vocal melody
     * every time would read as a keyboard player being careful.
     */
    quoteMotto: 0.2,
    backing: { melody: 'full', counter: 'full', comp: 'full', bass: 'sparse', drums: 'trade' },
    vocabulary: {
      // Eighth notes at rest, which is quicker than anything here except bebop.
      // A rock solo is a stream; the spaces in it are dramatic rather than
      // structural, which is what `space` below is for.
      gait: 0.45,
      // Sixteenth-note runs, and they are a real part of the vocabulary from
      // 1968 onward rather than a jazz import.
      doubleTime: 0.28,
      offbeatAccent: 0.3,
      // Almost none. An enclosure is a bebop device — approaching a target from
      // above and below — and a rock guitarist approaches from *below only*,
      // by bending into the note, which is what `ornament` becomes on a guitar.
      enclosure: 0.04,
      /**
       * Modest, and deliberately not zero.
       *
       * The blue notes on eight of these styles are chromatic by construction —
       * the ♭5 between the fourth and the fifth is the obvious one — so a solo
       * with no appetite for a note outside the scale would be a pentatonic
       * exercise. 0.14 is enough for the ♭5 to appear and not enough for the
       * line to wander, and the rule table above vetoes the one semitone that
       * would otherwise slip through it in a minor key.
       */
      chromatic: 0.14,
      /**
       * The highest in the project, and it is the bend.
       *
       * `ornament` is grace notes and mordents, which is the nearest thing this
       * generator has to a whole-tone bend held at the top — and the bend is not
       * a decoration on a rock solo, it is roughly half of what one is made of.
       * A guitarist who played the same notes without bending into them would be
       * playing a keyboard part.
       */
      ornament: 0.65,
      // High. A rock solo over eight or sixteen bars of two chords has nothing to
      // develop against except itself, and one that kept inventing would be a
      // sequence of unrelated licks over a loop.
      develop: 0.7,
      displace: 0.25,
      // Little. The passage is the loudest part of the record and silence in it
      // reads as a mistake rather than as a choice — the opposite of reggae's
      // 0.42, where the echo is entitled to the rest of the bar.
      space: 0.16,
      /**
       * Five semitones across the chorus, which is the largest climb here.
       *
       * A rock solo ends higher than it started. That is not a tendency, it is
       * the form: the shape everybody knows is a line that begins around the
       * twelfth fret and finishes bent double a fourth above it, and it exists
       * because the passage has to hand back to a chorus that is bigger than the
       * one before it.
       */
      climb: 5,
      paraphrase: 0.2,
      /**
       * The highest in the project at 0.85, level with iskelmä's, and for the
       * same reason arrived at from the other end of the volume knob.
       *
       * `liftIntoReturn` is the run up into whatever comes back. An iskelmä break
       * exists to deliver the final chorus and the run is what the hall is
       * waiting for; a rock solo exists to deliver it too, and the run is the
       * loudest four bars of the record. Reggae sits at 0.2 because a version
       * does not deliver anything and the drop is the announcement — three
       * genres, one field, and the number is the argument.
       */
      liftIntoReturn: 0.85,
    },
  },

  // Two minutes twenty to five and a half. The bottom of the band is the beat
  // single and the punk single; the top is the album track with two solos in it.
  duration: [140, 330],

  /**
   * The kit announces the join, and then sometimes the whole band does.
   *
   * `fill` leads, as everywhere. `shot` is at a real weight because this genre
   * declares no `shots` tables of its own and does not need to: the derived
   * figure is the group heads and the band's own onsets, which in 4/4 is beat
   * one with everybody on it — and the whole band hitting the downbeat into a
   * chorus is the single commonest gesture in rock arranging. Reggae had to
   * override that derivation because those four beats are exactly the ones its
   * band refuses to play. One derivation, two genres, opposite verdicts.
   *
   * `break` is the stop: everything out for a bar, the singer alone, and the band
   * back in on the downbeat. Iskelmä rules it out because a pavilion band
   * stopping dead empties the floor; here it is the four seconds everybody
   * remembers. `elide` is last and is the quietest of the four — the band a beat
   * ahead of its own barline.
   */
  transitions: [['fill', 6], ['shot', 3], ['break', 3], ['elide', 1]],

  /**
   * The drummer's vocabulary, and it is nearly all toms.
   *
   * `tom-roll` leads by a distance and it is the one place this genre agrees with
   * the shared default. A descending roll across four toms into a crash on the
   * downbeat is *the* rock fill — it is what a five-piece kit with two rack toms
   * and a floor tom exists to play, and the reason those kits have that many
   * drums on them at all.
   *
   * `drop` is at a real weight and is the one that reads as a surprise: the kit
   * stopping for a beat and a half before the chorus, which is the same gesture
   * as `break` in the transitions above played by one person instead of five.
   * `cymbal` is absent — a fill of cymbal and kick with no toms anywhere is a
   * bebop drummer's, and it would sound like the wrong player sat down.
   */
  fills: [
    ['tom-roll', 7], ['snare-toms', 5], ['snare-roll', 3], ['drop', 2], ['lead-in', 2],
  ],

  /**
   * What the tune is made of — the three tables `voiceForStyle` cannot derive,
   * and only the weights inside them a genre can say something true about.
   *
   * The omissions are the argument. Density, leap, ornament, compass and
   * syncopation are already spread across the twenty-four styles by their own
   * `melody` blocks and each spread is authored: `ornament` runs from `punk`'s
   * 0.1 to `psych`'s 0.5, `span` from `shoegaze`'s 8 to `surf`'s 19, and both of
   * those styles argue their number in their own doc. A genre figure for any of
   * them would overwrite twenty-four sentences with one.
   *
   * **Two archetypes are left out for exactly that reason**, and both were in the
   * first draft of this table. `wide-interval` derives as `0.5 + melody.leap × 5`
   * — 1.40 on `shoegaze` to 2.50 on `prog`, mean 2.02 — so a genre figure of 2 is
   * the derived mean typed out, and all it buys is the deletion of the range,
   * starting with `postpunk`'s leap of 0.22, which that style's own doc argues:
   * the singer is not reaching for anything and half those vocals sit inside a
   * fifth. `long-note` derives as `0.4 + max(0, 3 − density) × 1.4`, which is
   * `density` under another name: `shoegaze` 1.93 and `stoner` 1.80 — the only
   * two styles whose `melodyCells` genuinely lead with `[16]` and `[8,8]` — then
   * `riff` 1.33, `grunge` 1.16, `postpunk` 0.87, and 0.40 for the other nineteen.
   * Any single figure high enough to serve the held-note styles *cuts* the two it
   * is for and hands the same weight to `punk`, which has nothing sustained
   * anywhere in the arrangement. The derivation already makes both claims, per
   * style, about the right styles.
   *
   * ## Archetypes — the riff first, where the derivation has it third
   *
   * `riff-response` derives 0.60 to 2.45 with a mean of 1.33, so 5 is a 3.8× lift
   * and the largest opinion in the table. It is *a short figure and the thing that
   * answers it*, which is `styles.ts`'s second standing fact in the tune engine's
   * vocabulary: the riff is the composition. `hard` says the guitar figure *is*
   * the harmony and the singer arrives in the gaps; `grunge` says the tune is a
   * riff sung and that a great many of these vocal lines are the guitar figure
   * with words on it; eight styles take `pentatonicLead` on the stated grounds
   * that their tune is a riff rather than a song.
   *
   * `arch-hook` is the cheapest entry here and that is why it can be stated: the
   * derivation returns a flat 3.0 for every style in the catalogue, so 4 adds an
   * opinion without deleting one. It sits just under the riff because the other
   * sixteen styles are songs, and `defaultHook: 'catchy'` above has already said
   * why — a genre of singles whose commercial logic is that somebody remembers
   * eight bars of it.
   *
   * **`chant` derives 0.50 to 1.67, mean 1.06, and `repeated-note-run` argued the
   * lift first.** That override is in the table above because *three identical
   * notes in a row is how a very large number of these choruses begin*, and the
   * archetype glossed *one note repeated with a tail — the hook is the rhythm* is
   * the same sentence in the other file. `glam`'s chorus is four words over a
   * stomp and a handclap, `boogie` takes `earworm` on the grounds that nothing
   * changes at all, and `motorik` gets somewhere by staying somewhere.
   *
   * **`descending-sequence` is the push down, and it has to answer tango.** The
   * derivation reads `melody.sequence` — 0.45 to 0.75 here, deriving 2.35 to 3.25
   * — as an appetite for walking a figure *down the scale*, and in this repertoire
   * the restatement is at the same pitch: the riff is the same intervals over
   * every chord it meets, which is the file's second standing fact and which
   * `transpose: 1.8` below says again. `math` carries the highest sequence at 0.75
   * and its own doc says what for — a figure stated and then stated *again on the
   * next group*, not a step lower.
   *
   * That is worth a figure below the derived floor and not the 1.5 this table
   * first carried, because tango weights the same archetype at 4 — joint-highest
   * — for the descent this genre is supposed to share, and the difference is
   * narrower than the first draft assumed. Two things separate them and both are
   * in the tables. Tango's i–VII–VI–**V** tetrachord *cadences*; there is no
   * uppercase V in a minor-key progression anywhere in `styles.ts` — 0 slots in
   * 236 — so the figure here turns around instead: ♭VI–♭VII–i **rising** into the
   * tonic carries 33.5% of the minor progression weight against 24.2% for
   * i–♭VII–♭VI falling, and the single commonest minor row in the file is the
   * rising one. And tango's own note puts the walk in the *tune*; here it is the
   * guitar's loop, over which the vocal is far more often the repeated note the
   * line above weights at 3.
   *
   * ## Subsets — what the ladder delivers, and what these can and cannot say
   *
   * **The ♭7 is the ladder's, not this table's.** These are indices into whatever
   * mode `scaleForChord` returned, so degree 6 is the ♭7 only once the ladder has
   * moved off its first rung. Running every chord of every style through the rule:
   * the plain `major` rung — where degree 6 is the *leading tone* — takes 79% of
   * major-key chord slots and about 41% of all slots in the genre. That is not a
   * breach of the header's rule, which lifts the ban in major deliberately and
   * says so at `scaleForChord` below, but it does mean no subset can carry the
   * genre's characteristic note on its own. The one row that could — `[0,1,2,3,4,5]`,
   * the key without its seventh, which is synth's sentence — would in minor delete
   * the ♭7 as well, and is therefore wrong here in the half of the catalogue that
   * matters most.
   *
   * **Two rows lead at 5 because this genre has two melodic dialects**, and the
   * split is the same one `pentatonicLead` draws eight styles down: a riff or a
   * song. `[0,2,3,4,6]` is the riff's — the minor pentatonic on every rung of
   * `MINOR_LADDER`, the boogie scale 1 3 4 5 ♭7 on mixolydian, and 1 3 4 5 ♮7, the
   * yearning major set `voice.ts` names, on the plain major rung. The full
   * diatonic is the song's, and sixteen styles sing one — `beat` with `vi` and
   * `iii` at real weight, the ballad, the jangle, the new wave, the prog.
   *
   * **The no-third row is at 2 and the first draft had it at 4 on the wrong
   * evidence.** `POWER` voicings are four styles, not the genre — `styles.ts`
   * measures the distorted guitar at 30% of rock's comp weight against metal's
   * 77% — and that paragraph exists to draw one distinction: `pentatonicLead` is a
   * claim about the *tune*, the power chord is a claim about the *chord*. Using
   * the second to weight a melodic subset was the error. What survives is `alt`'s
   * dead heat between the modes and `riff`'s and `stoner`'s harmony refusing to
   * commit, which is worth a colour rather than a policy. At 4 the top three rows
   * of this table were byte-identical to `metal/index.ts` in set and weight; the
   * archetypes already separate the two genres 2× either way, and this is the row
   * that makes the subsets do it too.
   *
   * `[0,1,2,3,4,6]` is the key without its sixth, and the narrow true claim is
   * about one rung move rather than all four: `minor → dorian` under a major IV
   * flips exactly that degree, so a minor tune living inside this set is one the
   * bend leaves alone. The other moves flip other degrees — `major → mixolydian`
   * flips the seventh, `minor → phrygian` the second — and it says nothing about
   * those.
   *
   * **On the eight `pentatonicLead` styles the top row truncates, and that is a
   * known defect rather than a feature.** `snapToSubset` drops a degree a
   * five-note scale has not got, so the full diatonic and `[0,1,2,3,4,6]` are
   * no-ops there — 7 of 14 weight, up from 5 of 14 before the reweight above —
   * while `[0,2,3,4,6]` becomes 1 4 5 ♭7 and `[0,1,3,4,6]` becomes 1 ♭3 5 ♭7. The
   * leading row losing the ♭3 is the one worth naming: it is the note the
   * `augmented-second` override, the header's first line and the whole blues
   * overlay exist for, gone from 36% of sections on the styles built on it. The
   * fix is one line of `Style.voice` on each of those eight — `subsets` replaces
   * rather than merges, and a lone full-diatonic row snaps nothing — and it
   * belongs in `styles.ts`, which is the only place that can tell the eight from
   * the sixteen. Until it lands this table is wrong on a third of the riff styles'
   * sections and the number above is the size of it.
   *
   * ## Ops — a riff that renegotiates with each chord has stopped being a riff
   *
   * That sentence is at the top of `styles.ts`, and it is `reharmonise` at 0.2
   * against `transpose` at 1.8. `pentatonicLead` writes it as code: it reads
   * neither the mode nor the chord, so a figure meeting a ♭VII arrives *moved*
   * rather than refitted. `invert` goes down with it, because a riff's notes are
   * spelled as numbers taken literally and a shape turned upside down is a
   * different figure rather than a development of one.
   *
   * **The larger half of what `transpose` does here is buy exact repeats.**
   * `opsFor` keys the appetite on `ops[0]?.op ?? 'transpose'`, and the `repeat`
   * intent's verbatim branch carries no ops at all — so 1.8 multiplies it too, and
   * at the chorus's repetition it goes to roughly 15.8 against about 1.6 and 1.8
   * for the two branches that do something. That is the genre this file describes
   * — `defaultHook: 'catchy'`, the same chorus every time — but it is a second
   * effect of the number and not the one the paragraph above argues.
   *
   * `expand` up: this genre's chorus is louder rather than brighter —
   * `relativeMajorChorus: 0` on all twenty-four styles, `layerPlan.response` with
   * the drums at 0.85 — and same contour with wider intervals is what *more of it*
   * sounds like in a tune. `displace` down: the backbeat is a hard property of the
   * drum tables rather than a tendency, `sd` on slots 4 and 12 in every pattern in
   * the file, and `punk`'s every stroke is a downstroke.
   *
   * `sequence`, `ornament` and `diminish` are left where the styles put them. All
   * three derive from numbers authored twenty-four times here, and those numbers
   * disagree with each other for reasons each style has written down.
   *
   * `augment` and `fragment` are in neither table, so they sit at `opsFor`'s
   * fallback of 1 — which means rock's cadence is the shared default apart from
   * `reharmonise: 0.2` taking the fourth `close` branch nearly out of the draw,
   * leaving fragment-and-augment at 3:3 against augment alone at 2. Country
   * declares 1.6 there and metal 1.4; this genre has no evidence in its tables for
   * either direction yet, and the position is neutral on purpose rather than by
   * oversight.
   */
  voice: {
    archetypes: [
      ['riff-response', 5],
      ['arch-hook', 4],
      ['chant', 3],
      ['descending-sequence', 2],
    ],
    subsets: [
      // 1 ♭3 4 5 ♭7 on the minor ladder, 1 3 4 5 ♭7 on mixolydian, 1 3 4 5 ♮7 on plain major
      [[0, 2, 3, 4, 6], 5],
      [[0, 1, 2, 3, 4, 5, 6], 5],    // the whole key, for the sixteen that sing one
      [[0, 1, 3, 4, 6], 2],          // no third — 1 2 4 5 ♭7, or 1 ♭3 5 ♭7 truncated onto a pentatonic
      [[0, 1, 2, 3, 4, 6], 2],       // the key without the degree a major IV bends
    ],
    ops: { transpose: 1.8, expand: 1.6, displace: 0.5, invert: 0.3, reharmonise: 0.2 },
  },

  /**
   * The scale rule: follow the key, bend as far as the parallel minor, and never
   * raise the seventh.
   *
   * Rooted on the tonic and searched outward from the key's own mode, so that the
   * smallest possible change is made to admit whatever chord has arrived. The
   * header argues the whole of it; three things are worth restating at the code.
   *
   * **The search direction is fixed rather than leaning with the mode.** In minor
   * it bends brighter first — dorian before phrygian — because a major IV under a
   * minor tonic is common across the whole catalogue and a ♭II is three styles'
   * property. In major it bends darker, because everything a rock song borrows is
   * borrowed *flat*.
   *
   * **The fallback stays in the key rather than chasing the chord.** A chord tone
   * outside the scale, under a line that did not move to meet it, is a colour —
   * and it is exactly how this music uses the two or three chords it has that do
   * not belong. Reggae's rule says the same sentence and it is right in both.
   *
   * **In major the ban lifts and that is precise rather than inconsistent.** A
   * `V7` in a major-key rock song has a real leading tone in it, on record after
   * record from 1963 to 1997, and the tables use one. The claim this genre makes
   * is "no dominant in minor", not "no dominant" — which is the line synth draws
   * for a different repertoire in the same words.
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

  /**
   * The circuit, the backline and the bill on the wall. See `staging.ts`.
   */
  staging: STAGING,
};
