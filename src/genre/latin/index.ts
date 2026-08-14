/**
 * Latin — the Caribbean basin and its continental neighbours, 1930 to the
 * present, organised around a two-bar key that nobody in the band is allowed to
 * contradict.
 *
 * Twenty-six styles across four eras: the Cuban son and its whole family, the
 * charanga and the big band, the two rumbas, salsa and timba, merengue and
 * bachata, cumbia and vallenato, plena and bomba, four Brazilian rhythms, three
 * Mexican ones and a joropo.
 *
 * ## The clave is the genre and it is not a drum pattern
 *
 * `styles.ts` argues this at length and it is the one idea to bring here: the
 * organising figure of the first family is **two bars long, asymmetric, and
 * fixed for the whole number**. Everything is written against it — the bass, the
 * piano, the bell, the horn line and the tune — and a band that flips halfway
 * through is *cruzado*, which is the one error a Cuban rhythm section will stop
 * a rehearsal over. `DrumPattern.cycle` is how that is written down: `cycle: 32`
 * on a 4/4 bar, `cycle: 24` on the 6/8. A clave in one bar is not a clave.
 *
 * The three parts that make this genre what it is all live down there rather
 * than up here — the tumbao that never plays beat one, the montuno with its holes
 * in two different places, and the marcha on the three hand-drum voices. What is
 * in this file is everything they need to be *audible*: a mix where the bell and
 * the clave sit at the top of the kit, a rule table that lets the flamenco-side
 * colour through, and a chord-scale rule that is a genuinely new answer.
 *
 * ## Where the line falls against jazz and iskelmä
 *
 * Stated fully at the top of `styles.ts` and worth one sentence each here.
 * **Bossa nova stays in jazz**, because a bossa played by a jazz quintet follows
 * the chord and is a jazz record; nothing here is one. **No tango is written
 * here at all** — iskelmä's is Finnish and correctly so, and the Argentine
 * article belongs to a Río de la Plata genre that does not exist yet rather than
 * to a folder whose every entry has a percussion section in it, because a tango
 * orchestra has none. **Iskelmä's "beguine / rumba" is the ballroom rhumba**, a
 * preset button and a 3-3-2 bass; `guaguanco` and `columbia` here are the Cuban
 * rumba, which shares a word with it and nothing else. **Reggaetón is not here**,
 * because its key is the dembow and its ancestor is three styles away in
 * `genre/reggae/`.
 */

import { chordPcs, type Chord, type ChordQuality } from '../../core/chord.js';
import { makeScale, type Mode, type Scale, type ScaleName } from '../../core/scale.js';
import type { Pc } from '../../core/pitch.js';
import { RULE_DISABLED } from '../../core/rules.js';
import type { Genre, FormStep } from '../types.js';
import { STYLES } from './styles.js';
import { ERAS } from './eras.js';
import { MOODS } from './moods.js';
import { VOCALS } from './vocals.js';
import { generateTitle } from './titles.js';
import { STAGING } from './staging.js';

/**
 * Stage one of the chord-scale rule: modes of the *key*, searched outward.
 *
 * Minor bends darker before it bends brighter, which is the opposite of what
 * reggae's ladder does and is right for a different reason. In that repertoire
 * the characteristic colour is a natural sixth over a major IV, so dorian comes
 * first. Here the characteristic colour is the **raised seventh under the V of a
 * minor key**, which is everywhere in a son, a bolero and a salsa montuno — so
 * `harmonicMinor` sits second, immediately after aeolian, and dorian follows it.
 *
 * The major ladder ends on `harmonicMajor`, which is a new scale and earns its
 * place on one chord: the **borrowed minor fourth** in a major-key bolero or
 * ranchera. C major with an F minor in it is C D E F G A♭ B, which is exactly
 * harmonic major and is not reachable any other way without leaving the key.
 */
const MINOR_LADDER: ScaleName[] = ['minor', 'harmonicMinor', 'dorian', 'phrygian'];
const MAJOR_LADDER: ScaleName[] = ['major', 'mixolydian', 'harmonicMajor', 'lydian'];

/**
 * Stage two: the chord's own scale, rooted on the chord, for the chords no mode
 * of the key will hold.
 *
 * Close to jazz's table and different in three places, and each difference is a
 * claim about this repertoire rather than a simplification of that one:
 *
 *  - **A major triad takes ionian, never lydian.** A raised fourth over a tonic
 *    is a jazz arranger's colour; in this music it is the note that makes a
 *    salsa band sound like a fusion band, which is the one thing every player in
 *    the idiom is trying not to sound like.
 *  - **An altered dominant takes `phrygianDominant`, not the altered scale.**
 *    This is the substantive one. Jazz's shortcut — melodic minor a semitone up
 *    — flattens the fifth and the thirteenth as well as the ninth, which is a
 *    bebop sound. The V7♭9 of a minor-key son or bolero has a **natural** fifth
 *    and a natural third under a flat ninth, and the scale that describes it is
 *    the flamenco one that arrived with the Spanish guitar and never left. Its
 *    defining interval is the augmented second from the ♭2 to the 3, which is
 *    why the rule override below exists.
 *  - **`minmaj7` takes harmonic minor rather than melodic minor**, for the same
 *    reason the ladder above puts harmonic minor second: the raised seventh here
 *    is a leading tone in a cadence rather than a colour in a line.
 */
function chordScale(chord: Chord): Scale {
  const root = chord.root;
  const q: ChordQuality = chord.quality;
  switch (q) {
    case 'maj': case 'maj6': case 'maj7': case 'maj9':
      return makeScale(root, 'major');
    case 'min': case 'min6': case 'min7': case 'min9': case 'min11':
      return makeScale(root, 'dorian');
    case 'minmaj7':
      return makeScale(root, 'harmonicMinor');
    case 'dom7': case 'dom9': case 'dom13':
    case 'sus4': case 'sus2': case 'dom7sus4': case 'dom7flat5':
      return makeScale(root, 'mixolydian');
    case 'dom7b9': case 'dom7sharp9':
      return makeScale(root, 'phrygianDominant');
    case 'halfdim7':
      return makeScale(root, 'locrian');
    case 'dim': case 'dim7':
      return makeScale(root, 'diminished');
    case 'aug': case 'dom7sharp5':
      return makeScale(root, 'wholeTone');
    default:
      return makeScale(root, 'mixolydian');
  }
}

/**
 * Forms.
 *
 * Four, and all four are the same argument about one section. A number in this
 * repertoire has two halves — a sung **largo** over real changes, and then the
 * **montuno**, a two- or four-bar vamp that the band stays on while a soloist and
 * a fixed chorus trade over it. The montuno is the part the dance is for and it
 * can last as long as the floor holds up, which is why every form below is
 * back-heavy and why three of the four end with more `solo` and `chorus` bars
 * than they opened with.
 *
 * The fourth is the **descarga** — the jam session, which is a Havana and a New
 * York institution and is a form rather than an accident: a head, and then
 * everybody in turn over a two-chord vamp until the timbalero decides. It has
 * two solo sections back to back, which no other form in the project does.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  // The son: the largo, then the montuno, and the montuno wins.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'solo', bars: 16 }, { kind: 'chorus', bars: 16 },
    { kind: 'outro', bars: 8 },
  ], 5],
  // The song — bolero, bachata, ranchera. A bridge where the montuno would be,
  // because these three are songs before they are grooves.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'bridge', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 8 },
  ], 4],
  // The instrumental. A mambo, a danzón or a cumbia with nobody singing: the
  // horn line states it, the soloists take it apart, the horn line states it
  // again.
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'solo', bars: 16 },
    { kind: 'chorus', bars: 16 }, { kind: 'solo', bars: 16 },
    { kind: 'chorus', bars: 16 },
    { kind: 'outro', bars: 8 },
  ], 4],
  // The descarga. Two solo sections in a row over the same vamp, which is what a
  // jam is and what no other form here allows.
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'solo', bars: 16 }, { kind: 'solo', bars: 16 },
    { kind: 'chorus', bars: 24 },
    { kind: 'outro', bars: 8 },
  ], 3],
];

export const latin: Genre = {
  /**
   * Prepared, and stated rather than left to the default because it is a real
   * decision that the neighbouring genre made the other way.
   *
   * Reggae sets this false and argues that a leading tone in a minor key would
   * sound like a foxtrot band walking into the yard. This repertoire is the
   * opposite case in the same sentence: the applied dominant is native
   * vocabulary here, `V7/V` and `V7/iv` are written into the progression tables
   * of half the styles, and a son montuno's turnaround round the circle of
   * fifths is a chain of them. A modulation announced by the dominant of where it
   * is going is what an arranger in this idiom does.
   */
  preparedModulation: true,
  id: 'latin',
  label: 'Latin',
  description:
    'Son, mambo, salsa and timba; rumba, bomba and plena; cumbia, vallenato, samba, baião, norteño and banda — organised around a two-bar clave and a bass that never plays beat one.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,

  /**
   * Horn keys, and the horns decide.
   *
   * Every other genre in this project chooses its keys for a singer or for a
   * fingerboard. Here the constraint is a section of transposing instruments
   * reading parts: trumpets and tenor saxophones are in B♭ and altos and baritones
   * in E♭, so the keys that put a horn section in *its* comfortable fingerings
   * are the flat ones — F, B♭, E♭, C — and the entire published repertoire of
   * arrangements is in them.
   *
   * The minor table leans the other way and it is the guitar that pulls it: D
   * minor, A minor and G minor put a tres, a cuatro and a bajo sexto on open
   * strings, and the son family was a string band for twenty years before it had
   * a horn section. Both tables carry both pressures, which is what a conjunto
   * with one trumpet in it actually negotiates.
   */
  keys: {
    minor: [[2, 6], [9, 5], [0, 4], [7, 4], [5, 3], [4, 2], [11, 2], [10, 2]],
    major: [[5, 6], [10, 5], [0, 5], [3, 4], [7, 4], [2, 3], [9, 2]],
  },

  /**
   * It lands, and everybody lands together.
   *
   * The one gesture the whole band has been rehearsing is the *cierre* — the
   * closing figure off the clave that stops a montuno dead, and the audience
   * claps at it. `fade` would be the reggae answer and it is exactly wrong here:
   * a version fades because the riddim carries on into somebody else's record,
   * and a descarga stops because the timbalero has decided it is over and told
   * everybody with a roll.
   */
  ending: 'button',

  /**
   * Somebody counts it in, and in this genre they do it with the sticks.
   *
   * A four-count on the claves before a son is not a formality — it is how the
   * band agrees which way round the two bars are going to be for the next six
   * minutes, and it is the only moment in the number when that is still open.
   */
  countIn: true,

  /**
   * `standard`, with the overrides below doing the work.
   *
   * This is a singable idiom and the melodic rules mostly hold: a sonero's line
   * is a line somebody has to be able to repeat, and the smoothness constraints
   * are describing something real. What has to be let through is the harmonic
   * colour of the minor cadence, which is the one override that matters.
   */
  defaultStrictness: 'standard',

  /**
   * `catchy`, and the montuno is why.
   *
   * A coro is a fixed two- or four-bar phrase that the same three people sing
   * back thirty times in a number, and the entire architecture of the second half
   * of a son depends on it being *the same*: it is the constant the sonero is
   * improvising against, and a chorus that reinvented itself would leave the
   * improvisation with nothing to be against. `earworm` would go further than the
   * verse can bear — the largo is a written lyric with a story in it — so
   * `catchy` is the honest level for a genre whose two halves want different
   * things.
   */
  defaultHook: 'catchy',

  /**
   * The tune is a coro, and the two archetypes that describe one were the two
   * the derivation had least of.
   *
   * Three keys and no numbers. `density`, `leap`, `ornament`, `compass` and
   * `syncopation` are derived per style from tables that spread properly here —
   * derived density runs 2.67 onsets a bar on the ranchera to 5.58 on the frevo
   * — and any genre-wide figure for them would flatten a distinction the
   * twenty-six styles have already drawn correctly.
   *
   * `accents` is left derived too, and that is right at this tier but is the one
   * omission to flag rather than defend. `cellAccents` returns **one bar** —
   * sixteen slots on twenty-three of these styles, twelve on the three in 3/4 —
   * while the field's own note says *"a 32-long array is a two-bar statement,
   * which is what a clave or a tango accent actually is"*, in the genre whose
   * header says the clave *is* the genre. No genre-wide table can supply it:
   * 3-2 and 2-3 are the same sixteen slots in the other order, and which one a
   * number is in is a style fact — `styles.ts` writes both directions of the
   * guaguanco clave as separate patterns. That is the strongest wave-2
   * style-delta case in this folder.
   *
   * ## Archetypes: what a montuno is, in the vocabulary that has a word for it
   *
   * `riff-response` is *"a short figure and the thing that answers it"* and
   * `chant` is *"one note repeated with a tail — the hook is the rhythm"*, and
   * between them they are the second half of every son. `defaultHook` above
   * spends a paragraph on why the coro has to be the same phrase every time, and
   * the `repeated-note-run` override below is `chant` already written out in
   * prose: the coro *"frequently sits on two or three pitches"* and the interest
   * is *"entirely in where against the clave the syllables land"*. This genre
   * softened a melodic rule to permit that tune and then had no field in which to
   * ask for one. They lead.
   *
   * **What pinning them costs, named rather than conceded.** Derived
   * `riff-response` spreads 0.68 on the ranchera to 4.18 on the frevo, and
   * derived `chant` 0.78 to 2.53 — 6:1 and 3:1, both read off density, both
   * honest about which of these styles is busy. Writing 5 and 3.5 over that is
   * deliberate genre-tier work, because a coro is a fact about the repertoire and
   * not about onsets a bar, but the ranchera moves sevenfold and has the least
   * claim to it: a mariachi waltz with no coro anywhere in its tables. Nor is it
   * alone. `FORMS[1]` below is 4 of 16 form weight, puts a bridge where the
   * montuno would be and says so itself — *"these three are songs before they are
   * grooves"* — so on the bolero, the bachata and the ranchera this pair is an
   * assumption those two numbers are being asked to carry rather than one their
   * own tables make. The fix for that is a `voice.archetypes` delta on the three,
   * not a lower genre weight, which would charge the twenty-three sones for it.
   *
   * **`descending-sequence` is the weight that comes down, and it is the twin
   * problem.** Measured over the catalogue these melodies are harder to tell from
   * **finnfolk**'s than from anything else — 0.108 against a mean pairwise
   * distance of 0.382 — and the cause is one derived number. The weight reads
   * `melody.sequence`, both genres write that high, and here it lands
   * between 2.20 and 2.80 in all twenty-six styles — a 1.27× spread, flatter in
   * ratio than any other derived archetype weight here, though `long-note` below
   * has the narrower absolute range at 0.40–0.87. But the
   * two repertoires mean different things by it. A polska strain really does walk
   * a figure down the scale; what gets restated here is a *guajeo* — *"one shape
   * carried up and down through the chords of a two-bar vamp"*, in the words of
   * the `parallel-perfects` override below — or a moña, and both come back at the
   * same height every two bars because the vamp does. The appetite is right and
   * the **direction** is wrong, and direction lives in `Archetype.sequenceDir`
   * (−1 for a descending sequence, +0.2 for a riff, 0 for a chant) rather than in
   * `ops`. So this field is the only one that can fix it, and `ops.sequence` is
   * deliberately left where each style's own 0.40–0.60 already puts it.
   *
   * **The nearer neighbour is reggae, and this table has to answer for it.**
   * `genre/reggae/index.ts` leads its voice with the same two archetypes
   * (`chant 4`, `riff-response 4`), leads `subsets` with the same `[0,2,3,4,6]`,
   * carries `[0,1,2,4,5]` and the whole mode under it, and declares the identical
   * `fragment: 1.6` over a low `reharmonise`. That is convergence rather than
   * carelessness in either file — a coro and a chorus over a two-bar vamp are the
   * same melodic object, and both genres arrived at the pentatonic through their
   * own `augmented-second` disable. The separation is at the other end of both
   * tables. Reggae's scale rule is *"never raise the seventh"*, so no subset of
   * its modes can be `[0,1,2,3,4,6]` and this one carries it; reggae writes
   * `descending-sequence 2` and `long-note 2.2` where this cuts both to 1.2,
   * because a one drop holds notes and a guajeo does not; `invert` is declared
   * here and left derived there. Reggae then corrects `displace` and `diminish`
   * and this file leaves both to the styles, which is the same disagreement seen
   * from the rhythm side.
   *
   * `long-note` goes the other way and off a floor: derivation reads density, the
   * cells here are busy, and it comes out at 0.40 in twenty-five of the
   * twenty-six (0.87 on the ranchera). Meanwhile `arrangement` below weights
   * `swell` at 7 — raised from 3 after this genre's horn layer measured 7%
   * sustained — for a device that fires *only on the tune's long notes*. The
   * colchón has to have something to lie under. 1.2 is a nudge and no more,
   * because `SHAPES` multiplies this archetype by 0.7 in a chorus and 0.5 in a
   * solo and these forms are chorus- and solo-heavy: the share lands near 4%
   * in those two sections and around 7% averaged over a form, against roughly 3%
   * derived. Enough that the horns have something to lie under, not enough to
   * slow a montuno down.
   *
   * `arch-hook` keeps the flat 3 derivation gives every style in the project,
   * which is right for a folder whose second form is the song form.
   * `wide-interval` is deliberately **unnamed**, for the reason reggae leaves it
   * unnamed too: `mergeArchetypes` gives a named id its declared weight and
   * leaves an unnamed one derived, so writing any number here would replace
   * `0.5 + leap × 5` — 1.50 on the guajira to 2.40 on the frevo — with a
   * constant. Leap is the one melody field that already spreads honestly here,
   * and this is the field that would throw that away.
   *
   * ## Subsets: the pentatonic, its major twin, and the accident
   *
   * `[0,2,3,4,6]` is the minor pentatonic in a minor key, and one style in this
   * folder already says its melody lives there and nowhere else — `guaguanco`
   * overrides `scaleForChord` to `minorPentatonic` on the tonic because *"a rumba
   * melody is a pregón, a street-vendor's call"*. `[0,1,2,4,5]` is the same
   * decision in the other mode: 1 2 3 5 6, and by `modeWeights` this genre is 58%
   * major. It is also, under the phrygian dominant `chordScale` hands a `V7♭9`,
   * the notes 1 ♭2 ♮3 5 ♭6 — the Spanish cadence with its augmented second
   * intact, which is the interval the rule override below exists for.
   *
   * The full diatonic keeps a real weight for the bolero end, whose eleven
   * distinct chord symbols are joint-most in `styles.ts` — the frevo also has
   * eleven — and which is the one that genuinely moves ii–V.
   *
   * **The artefact, and it works against the override below rather than with
   * it.** `song.ts` resolves `style.scaleForChord ?? genre.scaleForChord`, and
   * `guaguanco` overrides to `minorPentatonic` on *every* chord, so the scale
   * arriving at `snapToSubset` there is already the five pcs 1 ♭3 4 5 ♭7. That
   * function keeps only the subset indices below `scale.pcs.length`, and against
   * five notes the indices name different pitches. The whole mode and
   * `[0,1,2,3,4,6]` are genuine no-ops, because all five indices exist in both.
   * The two at the top are not. `[0,2,3,4,6]` survives as indices 0, 2, 3, 4 →
   * **1 4 5 ♭7**, so the degree it drops is the **♭3** — precisely the
   * tonic-to-♭3 that `augmented-second` is disabled below to permit, on the one
   * style that comment names as its reason. `[0,1,2,4,5]` survives as 1 ♭3 4 ♭7
   * and loses the fifth. Eight of thirteen by weight therefore narrow that style
   * to four notes.
   *
   * Stated rather than fixed, because degrees are indices into whatever scale
   * arrives: no entry can be five notes against seven and inert against five, and
   * putting the whole mode on top would charge the other twenty-five styles for
   * one style's problem — the pentatonic colour is what this table is for. The
   * fix is a style delta, `guaguanco: { voice: { subsets: [[[0,1,2,3,4,5,6], 1]] } }`,
   * since `voiceForStyle` takes `delta.subsets` whole and this table is
   * genre-level by construction.
   *
   * `[0,1,2,3,4,6]` is where the `augmented-second` override below pays back the
   * cost it names. That comment admits harmonic minor's ♭6-to-♮7 *accident* along
   * with the phrygian-dominant *subject* and cannot separate them, because it
   * measures an interval and a subset measures degrees. Degree 5 is that ♭6, and
   * the ladder returns harmonic minor on the tonic under every minor-key V, so a
   * line drawn from this set cannot step through the accident and still keeps the
   * leading tone. Lightest of the four, because it also takes the ♭6 out of the
   * phrygian dominant, where the same note is a colour.
   *
   * ## Ops: the four derivation never reaches
   *
   * `voiceForStyle` derives six of the eleven from `melody.sequence`, `.ornament`,
   * `.syncopation` and `.leap`, and all four spread here — derived `displace`
   * runs 0.60 on the norteño to 1.38 on the timba, and a genre-level value would
   * flatten the cha-cha-chá, whose cells start on the beat because *"a
   * cha-cha-chá melody that leaned would be the nuevo ritmo the dancers could not
   * manage"*. Untouched. The other four sit at 1 for every style in the project:
   *
   *  - **`fragment` up.** A sonero answers the coro by throwing a piece of it
   *    back — `solo.quoteMotto` and `paraphrase` are both 0.35 below — and this
   *    is the operator that makes a one-bar figure out of a two-bar one.
   *  - **`invert` down.** It is the largest single weight in the `answer` intent,
   *    and an inverted coro is a different coro.
   *  - **`reharmonise` down.** It refits a shape to new changes and a montuno has
   *    none: *"a four-bar cell, twice, and nobody leaves it"*. Halved rather than
   *    removed, because the bolero and the timba genuinely move.
   *
   * `augment` stood here at 1.5 and has been taken out, because neither half of
   * its argument held. The evidence was that all twenty-six `cadenceCells` open
   * with a whole-bar note at top weight — which is true of **360 of the project's
   * 389 styles**, so it is a house convention and not a sentence about this
   * genre. And `opsFor` reads its appetite off the **first** op of an entry, so
   * the weight reached only the bare `augment` in `close` (2 → 3); the two
   * entries that actually augment a cadence are `fragment` + `augment` pairs and
   * are already lifted by the bullet above.
   */
  voice: {
    archetypes: [
      ['riff-response', 5],
      ['chant', 3.5],
      ['arch-hook', 3],
      ['descending-sequence', 1.2],
      ['long-note', 1.2],
      // `wide-interval` stays unnamed: naming it replaces `0.5 + leap × 5`,
      // which is 1.50 to 2.40 across these styles. See the header.
    ],
    subsets: [
      [[0, 2, 3, 4, 6], 4],       // pentatonic in minor — the pregón; 1 4 5 ♭7 on guaguanco
      [[0, 1, 2, 4, 5], 4],       // 1 2 3 5 6 in major; 1 ♭2 ♮3 5 ♭6 under a V7♭9
      [[0, 1, 2, 3, 4, 5, 6], 3], // the bolero, which needs all seven
      [[0, 1, 2, 3, 4, 6], 2],    // no ♭6: harmonic minor without the accident
    ],
    ops: { fragment: 1.6, reharmonise: 0.5, invert: 0.4 },
  },

  /**
   * The horns play *moñas* — interlocking figures, restated — and that is most
   * of what a horn section does here.
   *
   * `riff` and `harmony` lead. A mambo section is two or three written figures
   * layered against each other, each one repeating, none of them the tune; the
   * interlocking is the composition, and a fresh stab thrown into each gap in the
   * melody is a rock arranger's gesture that would produce a part nobody could
   * layer anything against.
   *
   * `tutti` is up, and this is the one genre in the project where it should be.
   * The **bloque** — the whole band catching a figure off the clave and stopping
   * for two beats — is native vocabulary rather than a shock effect, and iskelmä's
   * argument against it (a band that stops dead empties the floor) simply is not
   * true of a room that has been counting the same two bars all night.
   *
   * `swell` is level with the riff, and the reason has a name in this music.
   * The **colchón** — the "mattress" — is a held note the saxophones or the
   * trombones sit on underneath whatever the lead is doing, and it is what a
   * bolero's brass does for four minutes and what holds a mambo together
   * underneath the screaming. Nothing about a genre of riffs implies the horns
   * never hold anything, and the field's own note is the practical half of the
   * argument: `swell` fires only on the tune's long notes, so its weight buys
   * frequency for a device that is quiet by construction. Written at 3 first,
   * this genre's horn layer came back 7% sustained where a section's vocabulary
   * should be nearer a quarter.
   *
   * `trade` is lowest. Handing a phrase between two players is a conversation,
   * and these horns are a *section*.
   *
   * **`harmony: 5` is the moña, and it is why there is no `Genre.harmony`.** The
   * device puts a harmonised phrase of the tune into one repeat chorus; what this
   * weight is paying for is the paragraph above — two or three figures layered
   * against each other, none of them the tune. A standing declaration *replaces*
   * that draw for the style it is written on, so it is written on one of the
   * twenty-six: `banda`, whose own description says "clarinets and trumpets in
   * thirds" and is the only "in thirds" in the folder.
   *
   * The coro is the entry that looks like a vocal stack and is not. Three files
   * say three or four people sing it — `defaultHook` above, `vocals.ts`'s choice
   * of patch 52, `eras.ts`'s coro in the conjunto pad at 36.1% of the songs that
   * write one — and the one place any of them says *how*, `eras.ts` says "an
   * answer shouted in unison" and that the call-and-response figure it wants
   * cannot be written yet. `HarmonyProfile` doubles the lead's own line and its
   * own syllables; it cannot write an answer, and a coro is an answer.
   */
  arrangement: { riff: 6, swell: 7, harmony: 5, tutti: 5, unison: 3, trade: 2 },

  /**
   * Where this genre disagrees with the shared rule table.
   */
  ruleOverrides: {
    /**
     * `augmented-second` off, and it is the override the chord-scale rule cannot
     * work without.
     *
     * The rule vetoes any one-step three-semitone move **from strictness 1
     * upward**, which is the default level and above — so at `standard` it is a
     * hard veto, and it is a silent one: the note is simply never chosen and
     * nothing reports that a scale has been made unusable.
     *
     * Two of this genre's scales are made of that interval. **Phrygian dominant**
     * is what the V7♭9 of a minor key takes here, and the step from its ♭2 to its
     * ♮3 *is* the scale — it is the reason the mode has a name and the reason it
     * sounds Spanish. **Minor pentatonic** is what `guaguanco` overrides to, and
     * the tonic-to-♭3 of a five-note scale is one step and three semitones by
     * construction. Left on, the generator refuses every characteristic move both
     * scales exist to make, and what comes back is a five-note scale being played
     * as a badly behaved seven-note one.
     *
     * The cost is real and is worth naming: **harmonic minor**, which this genre
     * uses constantly, contains the same interval as an *accident* — the gap
     * between the ♭6 and the raised 7th is what you get for reaching for a
     * leading tone, and a line that steps through it does sound wrong. The rule
     * cannot tell the two cases apart because it measures an interval and not a
     * scale, so switching it off admits the accident along with the subject.
     * Disabled rather than softened because a penalty heavy enough to suppress
     * the accident is heavy enough to suppress the pentatonic's only move, and
     * of the two failures the silent veto is the worse one.
     */
    'augmented-second': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * The montuno planes, and so does the horn section.
     *
     * A piano guajeo is one shape carried up and down through the chords of a
     * two-bar vamp, in octaves, in both hands — parallel motion by construction,
     * because it is a *figure* being transposed rather than four voices being led.
     * A three-trumpet moña voiced in fourths over the same vamp does exactly the
     * same thing. The rule is a choral prohibition about independent lines and
     * there are no independent lines in either part.
     *
     * Softened rather than disabled, which is the difference from the entry
     * above: the melody and the counter *are* two players who can hear each
     * other, and at the top level the fault is still a fault.
     */
    'parallel-perfects': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.6 },

    /**
     * A coro repeats one note more than any rule expects.
     *
     * The chorus phrase in a montuno is short, fixed and frequently sits on two
     * or three pitches — the interest is entirely in *where against the clave* the
     * syllables land, which is a rhythmic fact the melodic rules cannot see.
     * Softened rather than disabled: a line here can absolutely stall, it just
     * does it later than a line in a through-composed idiom.
     */
    'repeated-note-run': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.85 },
  },

  /**
   * The percussion section is a section, and the mix has to say so.
   *
   * `drums` goes from the shared 0.59 to 0.8, which is the highest in the project
   * and is not a preference. In every other genre here that layer is one person
   * behind a kit; in this one it is a bench of three or four playing interlocking
   * parts, and the interlock is the music. A mix that treated it as
   * accompaniment would have turned an ensemble into a click track.
   *
   * `comp` at 0.82 is the second unusual number. Everywhere else the chordal
   * layer is accompaniment; here it is the **montuno**, which is a written
   * two-bar part that the tumbao and the bell are locked to and that a listener
   * follows as closely as the tune. Behind the melody, level with the bass, and
   * well ahead of where a comper normally sits.
   *
   * The bass comes up to 0.8 and no further. It is more important than a dance
   * band's and less important than a reggae one's — a tumbao is half of the
   * anticipation and the piano is the other half, so putting it out in front
   * would break the pair.
   *
   * The pad goes down to 0.38. Strings on a salsa record are something a producer
   * added in a different city.
   */
  mix: {
    // `melody` and `bass` carry the catalogue's 2 dB trim; see `gains` in generate/song.ts
    drums: 0.8,
    bass: 0.63,
    comp: 0.82,
    melody: 0.73,
    brass: 0.86,
    counter: 0.62,
    pad: 0.38,
  },

  /**
   * Inside the section, and the two loudest voices are the two smallest objects.
   *
   * **`rim` at 0.95 is the clave**, and it is the highest value given to any
   * voice in any genre in this project. A pair of hardwood sticks is physically
   * quiet and is the thing everybody in the band is listening to; on a record it
   * is mixed to be unmissable, because a clave you cannot hear is a two-bar key
   * nobody can find. The shared default has `rim` *below* the snare, on the
   * reasoning that a cross-stick is a decoration a drummer reaches for in a quiet
   * passage. Here it is the subject.
   *
   * **`cb` at 0.92 is the campana**, and the argument is the same one `styles.ts`
   * makes at the pattern: a montuno with the bell mixed out is a montuno somebody
   * has damaged. It is a lump of unpitched steel struck with a stick and there is
   * no such thing as playing it discreetly.
   *
   * The hand drums sit high and *stratified* — 0.86, 0.82, 0.74 low to high —
   * rather than flat, because the three strokes of a conga are not three
   * instruments, they are one drum at three dynamics, and a flat mix collapses
   * the marcha into a machine. `bd` stays at 0.9 for the styles that have one, and
   * a great many styles here have none at all.
   *
   * The cymbals go down hard. `rd` at 0.22 is the lowest in the project: there is
   * no ride cymbal in this music, and where a bank substitutes one for something
   * it lacks the result should be barely present rather than a jazz drummer
   * appearing in the middle of a guaguancó.
   */
  drumMix: {
    bd: 0.9, sd: 0.72, rim: 0.95, hh: 0.36, oh: 0.46, cp: 0.6,
    lt: 0.72, mt: 0.7, ht: 0.66, cr: 0.44, rd: 0.22,
    perc: 0.66, cb: 0.92, sh: 0.62, tb: 0.62,
    lp: 0.86, mp: 0.82, hp: 0.74,
  },

  /**
   * The montuno lives in the middle and it does not swell.
   *
   * `offsets` leaves the comp level with the ceiling rather than dropping it,
   * which is a change from the dance-band default and is the montuno again: it is
   * a two-handed figure occupying the octave either side of middle C, which is
   * exactly the register the field's default was invented to keep the comp *out
   * of*. The pad drops further than usual to make the room, because a pad in this
   * music genuinely is decoration and the comp genuinely is not.
   *
   * `response` is where the genre says its rhythm section holds still. A dance
   * band leans into a chorus; a tumbao and a marcha do not, because they are what
   * the chorus is happening *over*. The bass at 0.3 is the strongest version of
   * that — the figure is played at one weight from the first bar to the last, and
   * everything that arrives, arrives by somebody joining.
   */
  layerPlan: {
    offsets: { comp: 0, pad: -8 },
    response: { bass: 0.3, comp: 0.4, drums: 0.6 },
  },

  /**
   * There is no `comping` profile, and the absence is a claim.
   *
   * `CompingProfile` offers three gestures — rest a bar, anticipate the barline,
   * displace an offbeat — and all three are wrong here for one reason: the
   * montuno **already contains** the thing they would add. Its second bar has no
   * downbeat because the *and* of four in the first bar is tied over it; that is
   * the anticipation, it is written into the figure, and it happens in the same
   * place every two bars because that is what makes the figure a key rather than
   * a texture. `anticipate` would put a second one somewhere else, `displace`
   * would move the holes, and `rest` would take out a bar the coro is counting
   * from.
   *
   * Iskelmä states the same absence because its chords are how the floor knows
   * where beat one is. This genre's version is stranger and stronger: the piano
   * is one of the two parts *covering* an empty beat one, and it can only do that
   * by being in the same place every time.
   */

  /**
   * A real room, a short plate, and almost no delay.
   *
   * `delayBeats: 0.75` is the project's convention — three sixteenths never lands
   * where the beat does — and the feedback is the lowest of any genre that has
   * any, because an echo in this music is a mistake. Four percussionists playing
   * interlocking parts on a sixteenth grid are already producing something the ear
   * has to untangle; a repeat at three sixteenths puts a phantom stroke exactly
   * where a real one might have been, and the clave stops being findable. The
   * reverb is a hall rather than a spring: these records were cut in rooms, and
   * the room is what a band of this size sounds like.
   */
  space: {
    reverbSize: 0.5,
    delayBeats: 0.75,
    delayFeedback: 0.12,
  },

  /**
   * Standing production notes, refined by each era.
   *
   * **The percussion is the one layer that must stay bright.** A clave's
   * fundamental is around 2.5 kHz and a campana's spectrum is a mess of
   * inharmonic partials from 1 kHz upward; both of them live in exactly the band
   * a "warm" low-pass takes away, and a kit rolled off at 6 kHz in this genre is
   * a kit with the two most important instruments removed from it. 12 kHz, which
   * is the least filtered drum layer in the project.
   *
   * The bass is dark but nothing like reggae's 900 Hz. An acoustic bass or a
   * flatwound electric played with the fingers has real content up to about
   * 2 kHz — the attack of the ponche is a *click* as much as a note, and it has
   * to be audible or the anticipation stops reading as an event.
   */
  effects: {
    drums: { reverb: 0.2, lowpass: 12000 },
    bass: { reverb: 0.05, lowpass: 2200 },
    comp: { reverb: 0.22, lowpass: 9500 },
    brass: { reverb: 0.28, lowpass: 10000 },
    melody: { reverb: 0.28, lowpass: 10000 },
    counter: { reverb: 0.3, lowpass: 9500 },
    pad: { reverb: 0.42, lowpass: 6000 },
    vocal: { reverb: 0.3, delay: 0.14, lowpass: 8000 },
  },

  /**
   * The band does not thin out, and the soloist is a guest of the groove.
   *
   * Jazz's rhythm section comps because comping is a conversation; iskelmä's
   * refuses to because the floor is full. This genre has the second reason and a
   * third one on top of it: the montuno is what the soloist is soloing *over*,
   * and a piano that dropped back would have removed the thing being played
   * against. `full` everywhere.
   */
  soloBacking: 'full',
  solo: {
    /**
     * Everybody, and the percussion is in the rotation on its own terms.
     *
     * The **descarga** is the reason this table is wider than jazz's. A jam in
     * this idiom goes round the band — the trumpet, the tres or the piano, the
     * bass, and then the congas and the timbales, who are soloists in this music
     * in a way a drummer in a dance band is not. `comp` carries real weight
     * because a pianist taking sixteen bars over their own montuno is one of the
     * most common records in the catalogue, and `bass` is here because Cachao
     * made the descarga a genre by doing exactly that.
     */
    rotation: [['melody', 5], ['comp', 5], ['counter', 4], ['drums', 3], ['bass', 2]],
    /**
     * A third of the time, and it is the percussionists trading rather than the
     * drummer being given a spot.
     *
     * In a descarga the conguero and the timbalero swap four-bar phrases at each
     * other while the vamp carries on underneath, and the band comes back in on
     * the cierre. That is `tradeFours` exactly, and it is a higher number than
     * jazz's because in that idiom it is a signature the audience should not see
     * coming, and in this one it is the reason half the audience came.
     */
    tradeFours: 0.35,
    /**
     * Moderate. A sonero opens by quoting the coro they are about to answer,
     * which argues for a high number; an instrumental soloist over a montuno is
     * inventing against a fixed background and has no reason to. The average of
     * the two is where this sits.
     */
    quoteMotto: 0.35,
    backing: { melody: 'full', counter: 'full', comp: 'full', bass: 'full', drums: 'full' },
    vocabulary: {
      // Between a horn line and a piano run. A moña is a figure in quarters and
      // eighths; a piano solo over a montuno is a stream of eighths.
      gait: 0.45,
      doubleTime: 0.14,
      /**
       * High, and it is the opposite of the reggae argument.
       *
       * There the whole rhythm section was already on the offbeat, so a soloist
       * accenting one added nothing. Here the band is on *both* — the bell is on
       * the beat, the clave is not, the marcha is in the gaps — so an accent
       * placed off the beat is genuinely placed *against something*, and the
       * single most characteristic thing a soloist in this idiom does is land on
       * the ponche a whole beat before anybody expects the phrase to end.
       */
      offbeatAccent: 0.55,
      enclosure: 0.18,
      // Real, and moderate. This music has functioning dominants and a soloist
      // approaches them chromatically; it is not bebop and does not want to be.
      chromatic: 0.24,
      ornament: 0.42,
      // High. A montuno is a fixed two-bar background, and a solo that kept
      // inventing over it would be noise on a pattern rather than a line through
      // one — the same sentence reggae writes about a riddim.
      develop: 0.7,
      displace: 0.3,
      // Low. A descarga soloist fills, and the space in this texture is already
      // being used by four percussionists.
      space: 0.16,
      climb: 3,
      paraphrase: 0.35,
      /**
       * High, and it is the *cierre* rather than a crescendo.
       *
       * The run into the last statement here is a written figure the whole band
       * lands together — the soloist climbs into it and the horns catch them.
       * That is a delivery in exactly the sense iskelmä's 0.85 means, arrived at
       * by a band rather than by a key change.
       */
      liftIntoReturn: 0.75,
    },
  },

  // Three and a half to six and a half minutes. A single in this repertoire runs
  // long — the montuno is the point and it does not begin until halfway — and the
  // top of the band is a descarga with two solo sections in it.
  duration: [210, 390],

  /**
   * The kit announces a join, and about as often the whole band does instead.
   *
   * `shot` at the same weight as `fill` is the highest in the project, and the
   * reason is the **bloque**: a figure off the clave that eight people hit
   * together while the percussion drops out. Every style's `shots` table is
   * written by hand and every one of them is off the beat, because the derived
   * default would have produced the group heads — slots 0, 4, 8, 12 — which are
   * the four beats the tumbao and the montuno are organised around leaning past.
   *
   * `break` is present at a real weight and `elide` behind it. A montuno that
   * stops dead for a bar with only the clave still sounding is a thing that
   * happens two or three times in an arrangement and is the loudest silence
   * available.
   */
  transitions: [['fill', 4], ['shot', 4], ['break', 2], ['elide', 2]],

  /**
   * The drummer's vocabulary, and `rim` leads it by a distance.
   *
   * `generate/fills.ts` describes that shape as *"Latin: rim and percussion, a
   * clave-ish figure"* — it was written for this genre before this genre existed,
   * and this is the table that finally names it first. An *abanico* is a rim shot
   * and a roll across the shells into the montuno, which is that shape exactly,
   * and it is what a timbalero plays at every section boundary in the repertoire.
   *
   * `lead-in` second: two or three strokes on the last beat and nothing else,
   * which is the other half of what a timbalero does and is the correct fill for
   * a bar whose downbeat nobody is going to play. `tom-roll` is present and low —
   * it is a dance-band gesture and it does happen here, mostly on the banda and
   * frevo end where the band is a wind band and the drummer is a marching one.
   */
  fills: [
    ['rim', 6], ['lead-in', 4], ['snare-toms', 3], ['drop', 2],
    ['tom-roll', 2], ['snare-roll', 1],
  ],

  /**
   * The scale rule: **follow the key until the chord leaves it, then follow the
   * chord.**
   *
   * A fourth answer, and it exists because this genre contains two repertoires
   * whose harmony is genuinely different sizes. A timba verse moves through
   * modal interchange and applied dominants and a line has to re-orient onto
   * every one of them, which is jazz's answer. A cumbia has two chords and its
   * melody is key-relative from the first bar to the last, which is iskelmä's.
   * Neither answer is right for the other half, and giving twelve styles a
   * `Style.scaleForChord` override would be admitting the genre had no rule.
   *
   * So the rule is two-stage. **Stage one searches modes of the key** — aeolian,
   * harmonic minor, dorian, phrygian in minor; ionian, mixolydian, harmonic
   * major, lydian in major — and returns the first that contains every note of
   * the chord, *rooted on the tonic*. **Stage two, reached only when no mode of
   * the key will hold the chord, re-roots onto the chord** and takes the scale
   * its quality implies.
   *
   * What falls out is exactly the behaviour the two halves want, and the reason
   * is arithmetic rather than taste: **over a diatonic chord the two answers are
   * the same pitch-class set.** A `V` in C major asks for G–B–D, C major holds
   * all three, and stage one returns C major — which is the identical collection
   * to the G mixolydian a chord-rooted rule would have produced. The rule only
   * *does* anything when the chord is not in the key, and a cumbia never writes
   * one. So:
   *
   *     V7 in a minor key            →  harmonic minor on the tonic
   *     borrowed iv in major         →  harmonic major on the tonic
   *     bVII in major (the baião)    →  mixolydian on the tonic
   *     bII in a minor bridge        →  phrygian on the tonic
   *     V7/V, V7/iv, bIII7           →  stage two: mixolydian on the chord
   *     the timba's altered dominant →  stage two: phrygian dominant on it
   *
   * Where it differs from **ambient**, which is its nearest relative in shape: an
   * ambient drone bends to absorb whatever arrives and *never* moves the tonal
   * centre — that is the whole proposition of the genre and its check asserts it.
   * This one moves the centre deliberately, on the chords that have left the key,
   * because a salsa soloist over a `V7/V` is playing in the key of that chord for
   * one bar and everybody in the band knows it.
   *
   * Where it differs from **jazz**: jazz re-roots on *every* chord, including the
   * diatonic ones, so a line over a ii–V–I re-orients three times in three bars.
   * That is correct for bebop and it is what makes a bossa a jazz record. Here
   * the tonic is where phrases end and the key is what the coro is singing in, so
   * a diatonic bar returns a tonic-rooted scale and the line stays home.
   */
  scaleForChord: (tonic: Pc, mode: Mode, chord: Chord): Scale => {
    const ladder = mode === 'minor' ? MINOR_LADDER : MAJOR_LADDER;
    const tones = chordPcs(chord);
    for (const name of ladder) {
      const scale = makeScale(tonic, name);
      if (tones.every((t) => scale.pcs.includes(t))) return scale;
    }
    return chordScale(chord);
  },

  /**
   * The hall, the arcade and the card on the table. See `staging.ts`.
   */
  staging: STAGING,
};
