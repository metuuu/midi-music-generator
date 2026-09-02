/**
 * Country — the American south and west, 1927 to 1990, with bluegrass and
 * honky-tonk inside it.
 *
 * Twenty-four styles across four eras, held together by a claim about melody that
 * no other genre in this project makes and that sounds, written down, like an
 * admission of poverty.
 *
 * ## The tune does not chase the harmony
 *
 * Every other answer to the chord-scale question in this repo is about *tracking*.
 * Jazz re-orients bar by bar because each chord quality implies its own scale;
 * iskelmä swaps to harmonic minor the instant a dominant arrives; reggae and synth
 * bend one mode outward until it holds whatever chord turned up; ambient absorbs
 * the chord into the drone. All five are ways of saying that the line has noticed
 * the harmony move.
 *
 * A country melody has not noticed. It is the **major pentatonic of the key**, five
 * notes, and it is the same five notes over the I, over the IV and over the V. That
 * is not the generator being coarse. It is the single most checkable fact about the
 * repertoire, and the arithmetic is worth doing once because it makes the whole
 * thing legible:
 *
 *   In C, the melody has C D E G A.
 *   Over C  (C E G):  three chord tones present, and the tune is home.
 *   Over F  (F A C):  A and C present. **F is not in the scale at all.**
 *   Over G  (G B D):  G and D present. **B is not in the scale at all.**
 *
 * The two missing notes are the root of the subdominant and the leading tone, and
 * those are exactly the two notes a country singer does not sing over those chords.
 * A tune that landed on the F over the IV and the B over the V would be a hymn
 * arrangement or a show tune; what this repertoire does instead is hold the D and
 * the A and let the band move underneath, and the mild friction of a sixth against
 * a subdominant is a large part of why "Wildwood Flower" and "I Walk the Line"
 * sound like the same country and "Bringing in the Sheaves" does not.
 *
 * That is also the answer to why the harmony is so plain: it can afford to be.
 * The chords are not carrying information the tune needs, so three of them is
 * enough, and any band handed the key can play the song immediately — which is the
 * social fact this entire music is organised around.
 *
 * ## The blue third, and the one thing the engine could not do
 *
 * Against that plainness sits the other half of the idiom: the ♭3 bent against a
 * major chord. It is the same tension rock and blues have and it is everywhere in
 * the electric end of this repertoire — a Bakersfield Telecaster, a rockabilly
 * vocal, a Waylon Jennings guitar figure.
 *
 * The scale it needs is **major pentatonic plus a flat third**: six notes, C D E♭
 * E G A, with both thirds available and the ear choosing. That scale did not exist
 * in `core/scale.ts` when this was written, and adding one was judged not to be
 * this genre's to do — the catalogue is shared and a sixth-note hybrid invented for
 * one folder would be a scale nobody else could read.
 *
 * So the claim is split rather than fudged, which is the more honest of the two
 * available failures. The genre answers with the major pentatonic, and the four
 * styles whose lines genuinely live on the blue note override `Style.scaleForChord`
 * with the **minor** pentatonic of the same key — `rockabilly`, `bakersfield`,
 * `truckdriving` and `outlaw`. Five notes, a ♭3 and a ♭7, and crucially no ♭5,
 * which is what separates it from the `blues` scale and matters: a country record
 * does not use the flat fifth. What is lost is the *mixture* — a phrase with both
 * thirds in it, which is what a real Merle Haggard line does — and there is no way
 * to get that from a five-note table.
 *
 * ### The scale exists now, and this genre has not taken it
 *
 * `core/scale.ts` carries **`majorBlues: [0, 2, 3, 4, 7, 9]`** — C D E♭ E G A, the
 * six notes named three paragraphs up, note for note. The reasoning that declined
 * to invent it turned out to be the reason it got built: rock described the same
 * scale over eight styles without conferring, two independent reports made it a
 * gap rather than one folder's hybrid, and the row's own doc comment cites this
 * header by name for the description and for what the split costs.
 *
 * The paragraphs above are kept in place because the split they argue for is still
 * what ships. **`majorBlues` is named in 0 of this genre's 24 styles**; the four
 * electric ones still return `minorPentatonic` and the genre still answers
 * `majorPentatonic`, so what a country line can currently do is unchanged and the
 * mixture is still absent. What has changed is that its absence is now a decision
 * with a table sitting next to it rather than a ceiling. Two things a taker would
 * have to settle first, both already visible in the row's comment: the six notes
 * keep *both* three-semitone steps, ♮3–5̂ and 6̂–8̂, so `augmented-second` has to
 * stay off — which this genre has already done at every level, for this reason —
 * and adjacent semitone degrees mean the generator will *land on* the blue third
 * and hold it rather than pass through it, which is a different line from the one
 * a Telecaster plays.
 *
 * ## Two rule overrides are not taste, they are arithmetic
 *
 * `augmented-second` vetoes a move of one scale step and three semitones. In a
 * seven-note mode that is the ♭6–♮7 of harmonic minor and the rule is right about
 * it. **In the major pentatonic it is the third to the fifth**, and in the minor
 * pentatonic it is the tonic to the ♭3 — the first move either scale exists to
 * make. Left on, the generator silently refuses the interval that opens half the
 * tunes in this file and what comes back is a five-note scale being used as a badly
 * behaved seven-note one. It is off, at every level.
 *
 * `wide-leap` fires above a perfect fourth, which is calibrated for a scale whose
 * steps are ones and twos. Here a *single* step can be three semitones and two
 * steps is a perfect fifth by construction, so a pentatonic tune's ordinary motion
 * is being counted as a leap. It stays a penalty and stops being a veto until the
 * smoothest setting.
 *
 * The others are argued at the field.
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
 * The minor side, and it is a short ladder because this music barely goes there.
 *
 * Aeolian, bending to dorian when a major IV arrives over a minor tonic — the
 * modal ballad's brightest note and the one thing that makes "Shady Grove" sound
 * like a mountain tune rather than like a lament — and no further. Phrygian is on
 * the end because two of the older tunes genuinely have a flat second in them and
 * the search costs nothing when they do not.
 *
 * Harmonic minor is *not* on this ladder and is reached separately, which is the
 * one line that separates this rule from reggae's. See `scaleForChord`.
 */
const MINOR_LADDER: ScaleName[] = ['minor', 'dorian', 'phrygian'];

/**
 * Forms.
 *
 * Four, and the second is the one that could not have been written for any other
 * genre here.
 *
 * A bluegrass number is verse, chorus, **break**, verse, chorus, **break**, chorus,
 * and the two breaks are taken by two different people. That is structurally a jazz
 * bandstand's hand-off and it is nothing like an iskelmä instrumental, which
 * belongs to the featured player and stays with them — so the second form carries
 * three consecutive-ish `solo` sections precisely so that `planSolos` has something
 * to rotate through. Its refusal to hand anybody two choruses in a row is the whole
 * mechanism, and here it is not a jazz nicety: a fiddler who took the mandolin
 * player's break would be starting an argument.
 *
 * The third is the strophic ballad — five verses and no break at all, because the
 * story is the form and stopping it for a solo would be stopping the story. It has
 * the fewest sections of anything in the project after ambient.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  // The single. One break, in the middle, and the last chorus twice.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'solo', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 5],
  // The bluegrass number: three breaks, three different players, and the tune
  // coming back between them.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'solo', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'solo', bars: 8 }, { kind: 'solo', bars: 8 },
    { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 4],
  // The strophic ballad. No break anywhere: the story is the form.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 4],
  // With a bridge — the Nashville shape, and the one the last-chorus key change
  // was invented for.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'bridge', bars: 8 }, { kind: 'solo', bars: 8 },
    { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 4],
];

export const country: Genre = {
  walkup: 0.35,
  /**
   * Prepared, and it is the one field where this genre disagrees with every other
   * genre written since iskelmä.
   *
   * The field's own doc says true is the default and names the case for false:
   * modal pop after 1970 has no leading tone in minor, so an applied dominant in
   * front of a lift would sound like a dance band walking in, and `npm run genres`
   * asserts the raised seventh never appears there. Reggae and synth both make
   * that claim. **This repertoire cannot**, and would not want to.
   *
   * Three separate things have to be true for a prepared modulation to belong, and
   * all three are:
   *
   *  - **The gesture is real here and it is characteristic.** The last chorus up a
   *    semitone with the strings arriving on the downbeat is what a Nashville
   *    arranger was paid for; `nashville`'s `keyChangeChance` is 0.28, the highest
   *    outside iskelmä, and every era in this genre carries a non-zero one.
   *  - **The leading tone is not banned.** `honkytonk`'s minor table is written on
   *    `V7` and says why at the style — these men had all played dance dates. The
   *    raised seventh is theirs, which is exactly what reggae's tables refuse.
   *  - **And the tune does not have to sing it.** This is the elegant half. The
   *    chord-scale rule below hands the melody the major pentatonic, which has no
   *    seventh in it at all — so the applied dominant that announces the key change
   *    is played by the band and *not* by the singer, which is precisely what
   *    happens on the records. The leading tone lives in the guitar and the steel;
   *    the voice goes up a tone and does not comment.
   *
   * See `tune/keyplan.ts`.
   */
  preparedModulation: true,
  id: 'country',
  label: 'Country',
  description:
    'Old-time, bluegrass, honky-tonk, western swing, the Nashville sound, Bakersfield and outlaw — three chords, five notes, and the words doing the work.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,

  /**
   * Open-string keys, and the fiddle and the banjo decide them.
   *
   * G, D and A carry more than half the weight between them and the reason is
   * physical rather than vocal. A fiddle's four strings are G D A E and a banjo in
   * open G is tuned to a G chord; both instruments have drone strings that ring
   * *only* in those keys, and a breakdown in E♭ is a breakdown with the drones
   * switched off, which is most of the sound gone. C and E follow because a guitar
   * lives there, and the flat keys are down at the bottom — F and B♭ are horn keys
   * and appear here only because western swing had a horn section, while B is
   * present at all because a bluegrass band capos up to it to get the singer into
   * the high lonesome.
   *
   * The minor table is the same instruments' relative minors: A, E and D minor are
   * where the fiddle's open strings still work.
   */
  keys: {
    major: [[7, 7], [2, 6], [9, 5], [0, 4], [4, 3], [5, 2], [10, 2], [11, 1]],
    minor: [[9, 6], [4, 5], [2, 5], [11, 3], [7, 3], [0, 2], [5, 1]],
  },

  /**
   * It lands together, and then the band plays the tag twice.
   *
   * `button`, and it is the same fact as `countIn` below from either end. A country
   * arrangement finishes with everybody hitting the tonic on a downbeat and holding
   * it while somebody counts to four, and a room full of people applaud. Nothing in
   * this genre fades — a fade is a producer's decision made after the band went
   * home, and three of these four eras did not have one.
   */
  ending: 'button',

  /**
   * Somebody counts it in, and in this genre it is frequently on the record.
   *
   * A bluegrass band has no drummer, so the count is the *only* thing that
   * establishes the tempo — the first sound anybody makes is a full-speed banjo
   * roll, and getting five people onto that together requires four beats out loud.
   * On the honky-tonk sessions it was the bandleader; on the Sun sides it survives
   * onto the finished master more often than anybody bothers to notice.
   */
  countIn: true,

  /**
   * `standard`, with the two overrides below doing the arithmetic.
   *
   * These tunes are exposed the way anything singable is — a chorus comes round
   * five times and a wrong note is heard five times — but the idiom is pentatonic,
   * and the strictest settings are calibrated for seven-note scales in ways that
   * are actively wrong here. `standard` plus the pentatonic corrections is the
   * setting that produces a line somebody could sing.
   */
  defaultStrictness: 'standard',

  /**
   * `catchy`, and it is the honest setting rather than a commercial one.
   *
   * The whole social proposition of this music is that a stranger can join in on
   * the second chorus. A country chorus is supposed to be the same tune every time
   * and the form depends on you knowing that by the third one — which is `catchy`
   * exactly: the harmony locked, each section recalled, the rhythm stable.
   * `murderballad` and `trainsong` push it to `earworm` and `newgrass` and
   * `altcountry` pull it back to `loose`, and those four are the only styles here
   * that disagree with the genre about repetition.
   */
  defaultHook: 'catchy',

  /**
   * The band does not get out of the way, and it is the plainest version of that
   * argument in the project.
   *
   * Iskelmä keeps the arrangement going because the floor is full; reggae because
   * the riddim is the record. Here it is simpler than either: in seven of these
   * styles there is **no drummer**, so the rhythm guitar's chuck on two and four is
   * the only thing in the room stating the beat, and a guitarist who thinned out
   * behind a banjo break would have taken the time away from the person soloing.
   * `full`, everywhere, and no trading — see `solo.tradeFours`.
   */
  soloBacking: 'full',

  /**
   * The break, and who takes it.
   *
   * This is a genuinely different profile from either of the two that existed
   * before it, and the difference is that it is *both* of them at once. A bluegrass
   * break is jazz's hand-off — the tune goes fiddle, banjo, mandolin, a chorus each,
   * and nobody takes two in a row — while the *language* of what they play is much
   * closer to iskelmä's ornamented statement of the tune than to improvisation over
   * the changes. A bluegrass fiddler's break is the melody with a great many more
   * notes in it and a couple of licks welded on; it is not a chorus of blowing, and
   * generating it as one would be wrong about the genre rather than merely busy.
   *
   * So: jazz's rotation and iskelmä's vocabulary.
   *
   * **Three layers and no bass and no drums, which is a hard exclusion rather than
   * a low weight.** A bass solo in this music does not exist — the bass player's
   * entire job is the root on one, and in half these styles they are playing an
   * upright with a felt-lined bridge that would not carry a melody past the third
   * row. And a country drum solo is not a thing that has ever happened on a record,
   * in any of these four decades, which is why `tradeFours` is 0: four bars of
   * drums alone in the middle of a honky-tonk shuffle would empty the floor faster
   * than any wrong note could, and in seven of the styles there is no kit for it to
   * be taken on.
   */
  solo: {
    /**
     * Even, on purpose.
     *
     * Three layers at nearly the same weight, where jazz leads with the front-line
     * horn at 6 and iskelmä has a rotation of one. A bluegrass band genuinely has
     * no hierarchy about this — the breaks go round the circle and everybody gets
     * one, which is a thing the music is actually about rather than a courtesy —
     * and `comp` is in the rotation at a real weight because the person taking the
     * break in a string band is very often the person who was chopping a moment
     * ago.
     */
    rotation: [['melody', 5], ['counter', 5], ['comp', 4]],
    /** No drum spots. See above. */
    tradeFours: 0,
    /**
     * High, and higher than jazz's. The break is *the song*, faster: an audience at
     * a bluegrass show is listening for the tune to come back round inside it, and
     * a break that never touched the melody would be asserting this was a different
     * piece.
     */
    quoteMotto: 0.55,
    backing: { melody: 'full', counter: 'full', comp: 'full' },
    vocabulary: {
      /**
       * An eighth-note gait, which is fast for this project and is the banjo's
       * fault. `banjo` decays in 0.55 seconds — a drum with strings on it — so the
       * right hand has to fill every eighth or the instrument is silent, and a
       * break taken at quarter notes on one is a break with holes punched in it.
       */
      gait: 0.4,
      doubleTime: 0.14,
      /**
       * Low. Every accent in this music belongs to the boom-chuck and to the chop
       * on two and four, which is where the dance is counted from. A soloist
       * accenting the offbeats would be arguing with the only two events in the bar
       * that everybody in the room is relying on.
       */
      offbeatAccent: 0.12,
      enclosure: 0.1,
      /**
       * Small, and non-zero for one specific note. The pentatonic scales this genre
       * hands the soloist have no half steps in them at all, so every chromatic
       * approach is a genuine outside note — and the one that is genuinely idiomatic
       * is the slide from the ♭3 to the ♮3 over a major chord, which is the blue
       * note arriving as a gesture rather than as a scale degree.
       */
      chromatic: 0.14,
      /**
       * The largest ornament number in the project after iskelmä's, and the two are
       * the same claim. A fiddler's decoration is a grace note crushed against the
       * beat and a slide into the note above; a banjo player's is a hammer-on. None
       * of that is chromatic approach, which is what a bebop player's decoration is,
       * and the two vocabularies are not interchangeable.
       */
      ornament: 0.4,
      /**
       * High. A break is sixteen bars over three chords and there is nothing to
       * develop against except the figure being played, so a soloist who kept
       * inventing would be producing a list rather than a line.
       */
      develop: 0.7,
      displace: 0.18,
      /**
       * The least space of any soloist here, and the reason is the tempo. A
       * bluegrass break at 180 that left a fifth of itself silent would have four
       * bars of nothing in it, and what a banjo player actually does with sixteen
       * bars is fill every one of them.
       */
      space: 0.15,
      climb: 2,
      /**
       * A third, arrived at from iskelmä's own measurement and for the same reason.
       * A break made *entirely* of the tune has no figure of its own to turn over,
       * and one made of none of it is a different song; a third means two phrases in
       * three develop the bar that was just quoted, which is what a fiddler taking a
       * break actually does and reads as more of the tune rather than less.
       */
      paraphrase: 0.35,
      /**
       * High, for iskelmä's reason exactly. The run up into the last chorus is the
       * gesture the break exists to deliver — in a bluegrass number it is the single
       * moment the whole band is waiting for, and it is why the arc's reserved bars
       * are not silence in this genre either.
       */
      liftIntoReturn: 0.7,
    },
  },

  /**
   * What this band arranges with, and two of the weights are unusual.
   *
   * `harmony` at the top of this table, and behind only metal's and R&B's 8
   * across the project, because the
   * close-harmony third **is** this music's arranging device. A brother duet, a
   * bluegrass chorus, a gospel quartet and a Nashville vocal group are four
   * decades' worth of the same idea, and it is a genre fact rather than a style one:
   * the second voice joins on the second half of the chorus in every single one of
   * them.
   *
   * `unison` at 5, which is the highest in the project and would be strange
   * anywhere else. An old-time breakdown is a fiddle and a banjo playing the same
   * tune at the same time, in octaves, for six minutes — not a lead and an
   * accompanist. That is exactly what `joinIn` produces, and it is the oldest
   * texture in the file.
   *
   * `trade` is real and `tutti` is low. The band stopping to hit a figure together
   * empties a dance floor, which is iskelmä's argument and is true in the same room.
   *
   * ## Six styles say it outright, and this weight stays for all twenty-four
   *
   * `arrangement.harmony` is *this band harmonises sometimes* — one phrase, in one
   * repeat chorus, on the answering instrument. `Style.harmony` is *this music is
   * two voices*, and six styles here are named after the texture rather than
   * decorated with it: `duet` and `gospel`, `bluegrass` and `bluegrasswaltz` for
   * the chorus trio, `cowboy` for the Sons of the Pioneers and `countryrock` for
   * the overdubbed stack. The other eighteen keep the draw, unchanged.
   *
   * `countrypolitan` is the one of the four traditions above that does **not**
   * declare, and the reason is what a stack is: `generateVocalStack` writes a
   * second singer on the lead's *own syllables*, and a Nashville vocal group is
   * mostly wordless — the Jordanaires sing ooh where the singer is singing a
   * sentence. That part is the pad `layerPlan` already drops seven semitones for.
   *
   * All six are `on: 'vocal'`, and the instrumental version of the same idea is
   * deliberately not written: `westernswing`'s four-part fiddle writing and
   * `bakersfield`'s Telecaster double-stops are a *second lead*, which is
   * `on: 'melody'` and is not built. Neither style declares, rather than being
   * handed an answering line it did not ask for — and here that would be the wrong
   * player twice over, because `mix.counter` is 0.74 for the fill *between* the
   * vocal lines, and a counter shadowing the tune for sixteen bars is that
   * conversation switched off.
   *
   * ## What a five-note scale can give a second voice, and it is not a third
   *
   * `intervals` counts scale steps and `scaleForChord` answers the major
   * pentatonic — steps of 2, 2, 3, 2, 3 semitones — so `+2` is a major third over
   * the tonic and a **perfect fourth over the other four degrees**: 4, 5, 5, 5, 5.
   * A brother duet's third wants B over G, which is precisely the leading tone the
   * arithmetic at the top of this file says a country singer does not sing. So
   * what is reachable is the open harmony of the shape-note book rather than the
   * Louvin thirds, and the six tables are written knowing it. Minor is exempt:
   * `MINOR_LADDER` hands over seven notes and `+2` is a genuine third there, which
   * is 12% of `gospel`'s songs and 35% of `bluegrasswaltz`'s.
   *
   * Declaring is nonetheless the better of the two arrangements, by this genre's
   * own arithmetic. `chart.ts` draws `harmonyBelow: 2 | 5` in the same steps
   * through the same scale: 2 is that same fourth inverted, and **5 is an exact
   * octave**, because a five-note scale has five steps in it. `writeLine`'s fourth
   * rule catches the octave and pushes it one step further out, so the device's
   * sixths — 35% of the songs that draw it — arrive a ninth or a tenth below the
   * tune, or fall off the bottom of the counter's range and are dropped.
   */
  arrangement: { harmony: 7, unison: 5, riff: 4, trade: 4, swell: 3, tutti: 2 },

  /**
   * Where this genre disagrees with the shared rule table.
   *
   * Four entries. The first two are the pentatonic arithmetic set out at the top of
   * this file; the other two are things a country tune does that a rule written for
   * a seven-note singable idiom counts as faults.
   */
  ruleOverrides: {
    /**
     * `augmented-second` off, at every level, and it is the one override this genre
     * could not do without.
     *
     * The rule vetoes a move of one scale step and three semitones from strictness 1
     * upward, and in harmonic minor it is right — there the interval is the accident
     * of reaching for a raised seventh. **In the two pentatonic scales this genre
     * lives in it is the interval the scales are made of.** The third to the fifth
     * of a major pentatonic (E to G in C) and the tonic to the ♭3 of a minor one
     * are both one step and three semitones, and between them they open half the
     * tunes in the file.
     *
     * What makes this expensive to get wrong is that it fails *silently*: nothing
     * reports a vetoed candidate, the scorer simply picks its next choice, and what
     * comes back is a five-note scale being used as a badly behaved seven-note one.
     * It is inert in every seven-note mode this genre also uses — major, aeolian,
     * dorian, mixolydian and phrygian all step by ones and twos — so switching it
     * off costs nothing anywhere it is not needed. Harmonic minor is the exception
     * and is reached only under a honky-tonk V7, where the melody is a bar-band
     * line and the interval is exactly as awkward as the rule says; that is a real
     * cost and it is smaller than the alternative.
     */
    'augmented-second': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * `wide-leap` stops being a veto until the smoothest setting.
     *
     * The rule fires above a perfect fourth and is calibrated against scales whose
     * adjacent steps are one or two semitones, where five semitones really is a
     * leap. In the major pentatonic a *single* step is three semitones twice over,
     * so two steps is a perfect fifth by construction and three is a minor seventh:
     * the ordinary walking motion of the scale is being counted as athletics. The
     * penalty stays and stays from the same level, because a line that leaps
     * repeatedly is still a line that leaps; the veto moves to 4, where
     * `leap-beyond-third` takes over anyway and the smoothest setting genuinely does
     * want a tune that walks.
     */
    'wide-leap': { minLevel: 2, vetoLevel: 4, penalty: 0.5 },

    /**
     * `non-chord-tone-on-strong-beat` demoted to the top setting, as a penalty only.
     *
     * This is the rule that would quietly undo the genre's central claim. Over a IV
     * chord the key's pentatonic offers A and C as chord tones and D, E and G as
     * non-chord tones; over a V it offers G and D against C, E and A. A rule that
     * insists on a chord tone at every downbeat is therefore a rule that pushes the
     * tune onto the two notes — the subdominant root and the leading tone — that
     * this repertoire's melodies specifically avoid, and it would do it precisely at
     * the moments the ear is listening hardest.
     *
     * Demoted rather than disabled, because at `polished` the request being made is
     * explicitly for the smoothest available line and a preference for chord tones is
     * a reasonable thing to hear then. It never vetoes.
     */
    'non-chord-tone-on-strong-beat': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.5 },

    /**
     * A country tune sits on one note while the words do the work.
     *
     * `repeated-note-run` vetoes three identical notes in a row from strictness 2,
     * which is the genre default, and in a music whose melodies are *lines of verse*
     * that is the wrong instinct: "I hear that lonesome whistle blow" is six
     * syllables on one pitch and then a fall, and the tune is deliberately staying
     * out of the way of the sentence. Softened rather than disabled — a line that
     * stalls is still a line that stalls, and the penalty is what says so.
     */
    'repeated-note-run': { minLevel: 3, vetoLevel: RULE_DISABLED, penalty: 0.6 },
  },

  /**
   * What kind of tune this is, which degrees it lives in, and what it does to a
   * figure. Three keys, and only three, because the other seven fields of `Voice`
   * are already right: `adapt.ts` reads density, leap, ornament, span and
   * syncopation off each style's own `melodyCells` and `melody` block, and those
   * disagree across this file for reasons written at the field — `cowboy`'s span of
   * 16 against `murderballad`'s 10, `truckdriving`'s syncopation of 0.35 against
   * `ballad`'s 0.1. One genre number over the top of those would be describing
   * twenty-four styles as one.
   *
   * The same test applies *inside* the three, which is why four archetypes are
   * named and not six: `mergeArchetypes` keeps the derived weight for any id a
   * genre leaves out, so naming one costs that id's per-style spread. Two were
   * named in a first pass and are gone. `wide-interval` is `0.5 + melody.leap * 5`,
   * 1.5 (`ballad`) to 2.6 (`cowboy`), mean 1.94 — a genre 2 *was* the mean, so it
   * bought nothing and spent `cowboy`'s leap into the head voice, which was the
   * thing being claimed. `long-note` is `0.4 + max(0, 3 − density) * 1.4` and
   * **seventeen** of the twenty-four styles sit on the 0.4 floor: a genre 1.5 is a
   * 3.75× lift on `breakdown` (density 4.95, no singer) and `bluegrass` (3.32) and
   * barely moves `ballad` (1.48) or `cowboy` (1.35), which are the styles it was
   * for. The long note here is *one note at the end of a phrase* — `PLAIN_CADENCES`
   * leads with `[16]` and four styles weight that cell at 6 — and the cells already
   * say it where it is true.
   *
   * ## Which kinds of tune
   *
   * `arch-hook` leads, on the `arrangement` table and not on `defaultHook`.
   * `defaultHook: 'catchy'` is already spent — `repetitionFor` multiplies every
   * section's repetition appetite by it, for every archetype equally, so quoting it
   * here counts one setting twice and says nothing about the arch. What is
   * country-specific is `harmony: 7`, *"the answering line stops answering and
   * joins the tune in thirds or sixths"*, and `unison: 5`, *"two players state the
   * tune together, in octaves"* (`generate/chart.ts:55-66`). Twelve of this genre's
   * twenty-five arranging weight has a second player moving *with* the tune, and a
   * tune two people hold at once has to be one shape both already know. Derivation
   * is a flat 3 for every style, so it makes no claim here and this is the whole of it.
   *
   * `chant` next, and it is `repeated-note-run`'s demotion thirty lines up said a
   * second time. That override exists because "I hear that lonesome whistle blow"
   * is six syllables on one pitch and then a fall; the archetype's gloss is *one
   * note repeated with a tail — the hook is the rhythm* and its heaviest shape is
   * `plateau`. `defaultStrictness: 'standard'` is level 2 and the override's
   * `minLevel: 3` puts the rule out of reach of it entirely, so that line is not
   * merely cheap here, it is free. Derived is `0.5 + max(0, density − 2.2) * 0.6` =
   * 0.52 to 2.15, so this is the largest lift in the table, taken on purpose.
   *
   * **It does not separate this genre from `finnfolk`, and it is not asked to.**
   * That table is `arch-hook 4, chant 3.5, riff-response 3, long-note 2.5,
   * descending-sequence 2, wide-interval 1` — the same 3.5 for a related reason,
   * and its `repeated-note-run` override is `minLevel: 4, penalty: 0.85` against
   * this file's `minLevel: 3, penalty: 0.6`. `penalty` is a score multiplier, so
   * finnfolk spends the more generous of the two and no claim about the note is
   * won on that ground. What separates them is `long-note` and `wide-interval`,
   * stated flat there and handed back to `melody.leap` and the cells here, and
   * `arch-hook`, where the two follow their arrangement tables — finnfolk at
   * `unison 7, trade 3`, this genre at `harmony 7, unison 5, trade 4`.
   *
   * `riff-response` at 2, and both halves of the evidence are in that one table.
   * `trade: 4` — *"the lead states a phrase and stops; the second instrument takes
   * it over"* — is the device that leaves the hole the archetype needs, and behind
   * only classical's 6 and indian's 5 across the project; `solo.rotation` puts
   * `counter` level with `melody` at 5, which is this genre calling the answering
   * instrument a soloist. But `harmony` and `unison` are three times its weight, so
   * 5 to 2 here is roughly the 12 to 4 the arrangement already states. Derived runs
   * 0.6 to 3.43, the widest spread of any archetype here, so a flat number is
   * expensive whatever it is: at 2 a `ballad` still writes three times as
   * riff-and-response as its own cells asked for, and at 3 it was five times.
   *
   * **`descending-sequence` is pushed down, and it is the one place derivation is
   * actively wrong about this music.** `archetypesFor` reads `melody.sequence` —
   * 0.42 (`westernswing`) to 0.7 across this file — as a walk down the scale. Here
   * that number means something else, and `duet` says so at the field: *"a
   * `sequence` of 0.68 because a duet's whole shape is the same phrase four times
   * with different words."* That is restatement at pitch. A real descent is the
   * second strain of a fiddle tune, which is why this is 1.5 against a derived
   * 2.26–3.10 and not 0.5.
   *
   * The same misreading does **not** reach `ops.sequence`, which is why that one is
   * left alone below. The `sequence` intent's doc is *"restate a step or two away —
   * which way is the archetype's call, not the form's"*, and `opsFor` takes the
   * direction from `archetype.sequenceDir` rather than from the op appetite. So
   * `ops.sequence` buys exactly what `melody.sequence` means here; the descent
   * lives in the archetype, which is the thing that was corrected.
   *
   * ## Which degrees — inert in major, load-bearing in minor
   *
   * Three different scales reach `snapToSubset` from this genre and the table has
   * to be read against all three, because the indices are into whatever arrived;
   * `snapToSubset` keeps `scale.pcs[d]` for `d < scale.pcs.length` and hands the
   * note straight back once the survivors are the whole scale.
   *
   *  - **Major, about 70% of songs** — the weighted mean of `modeWeights.major`
   *    across the 24 styles is 0.697. `scaleForChord` returns the major pentatonic
   *    and 7.5 of the 10.5 weight below is a no-op. That is the point rather than a
   *    defect: this is the one genre whose `scaleForChord` has already made the
   *    subset decision, and anything narrower subtracts from a scale that has five.
   *  - **Minor, about 30%** — `MINOR_LADDER` hands over seven and this table is the
   *    only thing acting. Where it works, and where it can do damage.
   *  - **`rockabilly`, `bakersfield`, `truckdriving`, `outlaw`** — their
   *    `scaleForChord` takes only `tonic`, so it returns the minor pentatonic in
   *    *both* modes and degrees 5 and 6 are gone before the table is read.
   *
   * `[0,1,2,3,4,5,6]` at 6 is therefore the entry doing the work, and it does it in
   * minor: the modal ballad using all seven notes, which `scaleForChord` below
   * states in as many words. In major and on those four it is the identity.
   *
   * `[0,2,3,4,6]` at 2, down from 4, because at 4 it contradicted both of the
   * claims it was meant to serve. Against a seven-note minor mode it is the minor
   * pentatonic — true, and `voice.ts`'s own gloss — but index 5 of any
   * `MINOR_LADDER` mode is the sixth, the note this file twice calls the reason a
   * mountain tune is not a lament, and at 4 the table deleted it from more than
   * half of all minor sections. Against the four electric styles' five-note scale
   * the survivors are pcs 0, 5, 7, 10 — 1̂ 4̂ 5̂ ♭7̂, so **it removes the ♭3**, from
   * the only four styles that have one, which is the note the first twenty lines of
   * this file exist to argue about. What it is worth keeping for is major, where it
   * comes out 1̂ 3̂ 5̂ 6̂: the sixth chord, where a pedal steel lives. At 2 that colour
   * costs one section in five rather than one in three.
   *
   * `[0,1,2,3,4,6]` at 1.5 drops the sixth too, and deliberately: aeolian bends to
   * dorian when a major IV arrives and a tune that stays off that note lets the
   * band decide. No-op in major and on the four. `[0,1,3,4,6]` at 1 is the only
   * entry that *keeps* the ♭3 on those four (pcs 0, 3, 7, 10) and the one with no
   * third at all everywhere else — `breakdown`'s colour, open tuning and ringing
   * drones. It is also the entry that bites `westernswing`, the one style returning
   * seven notes in major: over a `dom7`'s mixolydian it takes the third out, which
   * is the fault that style overrode `scaleForChord` to escape. One draw in ten,
   * and a colour rather than a discipline, which is what a genre table costs where
   * a style has already said something more specific.
   *
   * ## What it does to a figure
   *
   * `reharmonise` at 0.2 is `non-chord-tone-on-strong-beat`'s demotion in the
   * operator algebra instead of the rule table. The op sets `Motif.resnap`, which
   * forces strong-beat notes onto chord tones — over a IV that is the subdominant
   * root and over a V the leading tone, the two notes the arithmetic at the top of
   * this file says this repertoire does not sing. It appears once in the whole
   * grammar, in `close` at weight 1, so 0.2 takes it from 11% of cadential choices
   * to 2%. `westernswing` is the exception and has already declared itself by
   * overriding `scaleForChord` upward.
   *
   * `augment` at 1.6 is the phrase-end long note, a key derivation never sets — and
   * it reaches one of the three routes to it rather than all three, which has to be
   * said because the number reads like the whole gesture. `opsFor` multiplies by
   * the appetite of the **first** op in the chain, and two of `close`'s three
   * augment routes lead with `fragment`, which this genre leaves at 1. So 1.6 buys
   * `[{augment, 1.5}]` alone: 2 → 3.2, which with `reharmonise` at 0.2 alongside
   * takes the un-fragmented augment from 22% of `close` to 34%. That is the gesture
   * the `[16]` cadence cell is for. Lifting `fragment` with it would buy the two
   * shorter routes as well — a larger and different claim, about how much of the
   * phrase survives into the cadence, which this file is not making.
   *
   * `transpose` at 1.5 is the chorus coming back unchanged. Derived is
   * `0.7 + melody.sequence * 1.2` = 1.20 to 1.54, so this is the most restating
   * style's number handed to all of them rather than a flattening of a wide field:
   * the same tune every time is a fact about the genre, not about the style.
   * `invert` at 0.5 because nothing here answers a line of verse by turning it
   * upside down — the answer is the next line, or it is the steel — and it is the
   * one op weight with no per-style number underneath it to overwrite.
   *
   * `expand` at 0.6 *does* overwrite a leap-derived field, which the first
   * paragraph of this block says not to do. Derived is `0.6 + melody.leap * 2` =
   * 1.00 (`ballad`) to 1.44 (`cowboy`), and 0.6 is exactly what that formula
   * returns for a leap of zero. It wins anyway because `expand` multiplies the
   * contour in **scale steps**, so what one costs is a property of the scale and
   * not of the singer: two steps of a major pentatonic is a fourth or a fifth by
   * construction, so a figure widened from 1 to 2 moves five to seven semitones
   * here where in a seven-note mode it moves three or four. And this genre's lift
   * is not a wider interval at all — it is the key change up a semitone that
   * `eras.ts` carries as `keyChangeChance`.
   *
   * Left alone deliberately: `sequence` (above), `diminish`, `displace` and
   * `ornament`, all four built by derivation out of per-style numbers argued at the
   * style — `truckdriving`'s `syncopation: 0.35`, "a riff pushes the barline",
   * against `ballad`'s 0.1 is exactly the pair a genre `displace` would erase — and
   * `fragment`, left at the implicit 1 for the reason given under `augment`.
   */
  voice: {
    archetypes: [
      ['arch-hook', 5],
      ['chant', 3.5],
      ['riff-response', 2],
      ['descending-sequence', 1.5],
    ],
    subsets: [
      [[0, 1, 2, 3, 4, 5, 6], 6],
      [[0, 2, 3, 4, 6], 2],
      [[0, 1, 2, 3, 4, 6], 1.5],
      [[0, 1, 3, 4, 6], 1],
    ],
    ops: { augment: 1.6, transpose: 1.5, expand: 0.6, invert: 0.5, reharmonise: 0.2 },
  },

  /**
   * The voice is the record, and one number says so.
   *
   * `melody` at 0.97 is the loudest melody layer in the project, and it goes with
   * the 0.97 in `vocals.ts` rather than instead of it — in three quarters of these
   * arrangements the melody layer *is* the singer's line played by a fiddle or a
   * steel, and the two have to agree or the instrumental version of a song is mixed
   * differently from the sung one. Every production decision in this genre from
   * 1927 to 1990 was made in service of the words being audible, and a mix that
   * treated the tune as one strand among six would be describing a different music.
   *
   * `counter` goes *up*, from 0.56 to 0.74, and it is the second-largest move here.
   * The answering fill between the vocal lines — the steel, the fiddle, the
   * harmonica — is not decoration in this idiom, it is the other half of the
   * conversation, and on a honky-tonk record it is mixed within two or three
   * decibels of the voice. Nowhere else in this project is the counter layer that
   * far forward.
   *
   * The bass comes down slightly and the comp stays where it is, which together are
   * the boom-chuck's balance: the guitar's chord on two and four should be the more
   * audible half, because it is the one carrying the backbeat in the seven styles
   * that have no drummer.
   */
  mix: {
    // `melody` and `bass` carry the catalogue's 2 dB trim; see `gains` in generate/song.ts
    melody: 0.77,
    counter: 0.74,
    comp: 0.72,
    bass: 0.46,
    drums: 0.56,
    pad: 0.6,
    brass: 0.56,
  },

  /**
   * The kit, mixed as furniture, and that is the job description.
   *
   * A country drummer from 1955 to 1990 was hired to be inaudible and exactly on
   * time, and the numbers should say so: the kick is well under its default and the
   * cymbals are the quietest in the project. There is no crash on a honky-tonk
   * record, or almost none — 0.3 against the shared 0.55 — because a crash is a
   * gesture and this drummer is not making gestures.
   *
   * Three voices go the other way and each is carrying a real part. `rim` at 0.86
   * is above the snare: the stick laid across the head is the *backbeat* of every
   * ballad and every countrypolitan side, played with the left hand while the right
   * one runs brushes, and a mix that treated it as an accent would have buried the
   * two beat of the whole Nashville era. `sh` at 0.62 is not a shaker, it is the
   * brushes — the train beat's sixteen strokes a bar and the rubboard's, both of
   * which are continuous parts rather than decoration. And `tb` at 0.6 is the cajun
   * triangle, which is played on every offbeat for four minutes by somebody who was
   * hired to do only that.
   */
  drumMix: {
    bd: 0.86, sd: 0.8, rim: 0.86, hh: 0.36, oh: 0.4, cp: 0.55,
    lt: 0.62, mt: 0.6, ht: 0.58, cr: 0.3, rd: 0.3, perc: 0.55, cb: 0.45,
    sh: 0.62, tb: 0.6, lp: 0.7, mp: 0.55, hp: 0.45,
  },

  /**
   * The rhythm guitar sits below the tune and above the bass, and it barely moves.
   *
   * `offsets` is a register statement rather than a level one. A country rhythm
   * guitar is playing open-position chords in first position with all six strings
   * ringing — that is roughly E2 to E4, well under where a fiddle or a steel puts
   * the tune — and the default of level-with-the-ceiling would voice it in the
   * melody's own octave, where two things in one register fuse and the ear picks
   * whichever is louder. The pad drops further still, because a string section on a
   * Nashville record sits under everything except the bass.
   *
   * `response` is where the genre says its rhythm section does not swell. The
   * boom-chuck is played at one weight from the first bar to the last, and it has
   * to be: it is what the dance is counted from, and a guitarist who leaned into the
   * chorus would be moving the floor.
   */
  layerPlan: {
    offsets: { comp: -5, pad: -7 },
    response: { comp: 0.3, bass: 0.35, drums: 0.5 },
  },

  /**
   * There is no `comping` profile, and the absence is the same claim iskelmä makes
   * in slightly stronger terms.
   *
   * `CompingProfile` is three gestures a chordal player makes when accompanying:
   * leave a bar out, anticipate the barline, nudge an offbeat stab. All three are
   * right for a jazz pianist and all three are catastrophic here, and it is the
   * first one that shows why. In seven of these styles **the rhythm guitar is the
   * drummer** — there is no kit, and the chuck on two and four is the only event in
   * the bar marking the backbeat. A comper who left one bar in five out would be a
   * drummer who stopped playing one bar in five.
   */

  /**
   * A small room and a slapback.
   *
   * `delayBeats: 0.25` is the number that separates this genre's echo from
   * everybody else's. Ambient, synth and reggae all use three sixteenths against a
   * four-beat bar, on the convention that a delay which never lands where the beat
   * does stays out of the way. This one is a *sixteenth*, deliberately, because the
   * gesture is not a rhythmic echo at all — it is tape slapback, one repeat about
   * 120 ms behind the source, close enough that the ear hears it as a thickening of
   * the voice rather than as a second event. `delayFeedback: 0.2` is the other half:
   * a single repeat and no more, which is what one extra playback head produces and
   * what a Sun record sounds like. Open it past about 0.5 and it stops being an
   * effect and becomes a second drummer, which is a different island's idea.
   */
  space: {
    reverbSize: 0.46,
    delayBeats: 0.25,
    delayFeedback: 0.2,
  },

  /**
   * Standing production notes, refined by each era.
   *
   * **The bass is dark, and the number is the instrument rather than a taste.**
   * 1400 Hz on an upright with gut strings and a felt-lined bridge, played with the
   * side of the finger — there is essentially nothing above the fourth harmonic in
   * the source, and every era below takes it darker still. It is also nearly dry,
   * for ambient's reason: reverb on a sustained low note arrives while the note is
   * still sounding and the two beat against each other.
   *
   * The counter is the wettest thing here apart from the pad, and that is the steel
   * guitar. A pedal steel fill run dry is a correct figure nobody would recognise;
   * what makes it sound like the object is that it is bathed in whatever the room
   * had and rings on past the end of the phrase.
   *
   * The voice is the driest thing on the record after the bass, and stays that way
   * in all four eras. It has a slapback on it and almost no room, because the
   * words are the point and a reverberant voice is a less intelligible one.
   */
  /**
   * Three right hands, and this genre is the one place all three are ordinary.
   *
   * Flatpicking for the lead and the boom-chick, fingerstyle for everything
   * descended from Travis and Atkins, and the open strum behind a singer. The
   * weights are close together on purpose: unlike funk or metal, no one of these
   * is what country guitar *means*, and a genre that picked one would be naming
   * a sub-idiom.
   *
   * What this cannot reach is the figuration — a Travis pattern is a thumb
   * alternating a bass note under fingers on the offbeats, and that is a
   * decision about which notes, which `generate/technique.ts` may not make. So
   * `fingerstyle` here buys the articulation, the ring and the hand, on a figure
   * the style drew. The header of that file argues why, and this is the entry it
   * had in mind.
   */
  techniques: {
    comp: [['strum', 5], ['fingerstyle', 4], ['plectrum', 3]],
  },
  effects: {
    bass: { reverb: 0.05, lowpass: 1400 },
    drums: { reverb: 0.18, lowpass: 6800 },
    comp: { reverb: 0.2, lowpass: 7000 },
    counter: { reverb: 0.34, delay: 0.16, lowpass: 7200 },
    melody: { reverb: 0.26, delay: 0.14, lowpass: 7400 },
    brass: { reverb: 0.3, lowpass: 7000 },
    pad: { reverb: 0.42, lowpass: 5400 },
    vocal: { reverb: 0.22, delay: 0.2, lowpass: 7000 },
  },

  // Two to three and a half minutes. A country single is short — the Bristol
  // sessions were cut to a three-minute side and nobody in Nashville ever saw a
  // reason to change it — and the top of this band is an outlaw album track with a
  // second break on it.
  duration: [120, 205],

  /**
   * The kit announces the join, and occasionally the whole band does.
   *
   * `fill` leads, `shot` is real at 3 and `elide` at 2. The one entry deliberately
   * kept small is `break`: a country band stopping dead is a thing that happens —
   * the stop-time bar before the last chorus, the whole band dropping out under one
   * line of a bluegrass verse — but it is a *gesture on a record*, not the idiom's
   * default, and reggae's argument for weighting it at 3 does not transfer. A
   * pavilion band stopping empties the floor and a country dance hall is the same
   * room; the difference is that this genre uses it once a night and means it.
   */
  transitions: [['fill', 6], ['shot', 3], ['elide', 2], ['break', 1]],

  /**
   * The drummer's vocabulary, and it is the smallest in the project.
   *
   * `lead-in` at the top — two or three hits on the last beat and nothing else —
   * and `drop` second, because in this genre the most effective fill is very
   * frequently no fill at all. That ordering is the opposite of iskelmä's, whose
   * palette leads with the tom roll, and the two rooms are otherwise similar
   * enough that the contrast is the point: a tanssilava drummer signposts the
   * chorus and a country drummer gets out of the way of the singer arriving at it.
   *
   * `tom-roll` is present and near the bottom rather than absent, because it does
   * happen and it happens in one specific place — the countrypolitan era, where
   * there was an arranger and the arranger wrote one.
   */
  fills: [
    ['lead-in', 5], ['drop', 4], ['snare-toms', 3], ['snare-roll', 3],
    ['rim', 2], ['tom-roll', 2],
  ],

  /**
   * The scale rule: five notes in major, a short bend in minor, and the tune does
   * not chase the chord.
   *
   * ## In major
   *
   * The major pentatonic of the **key**, for any chord the key itself can hold —
   * which is I, ii, iii, IV, V, vi and V7, and therefore for the overwhelming
   * majority of bars in this file. The scale does not contain the root of the IV or
   * the leading tone under the V, and that is the claim rather than a side effect;
   * the arithmetic and its consequences are set out at the top of this file.
   *
   * Where the key cannot hold the chord, the bend is one mode wide:
   *
   *     bVII in a major key   →  mixolydian   (old-time modal, and outlaw rock alike)
   *     I7 / IV7 vamps        →  mixolydian where it fits, else the plain major
   *     anything further out  →  the plain major, and the chord tone is a colour
   *
   * The last line is the same answer reggae gives and for the same reason: a chord
   * tone outside the scale, under a line that did not move to meet it, is a colour,
   * and it is how this music uses the two or three chords it has that do not
   * belong. The style that genuinely cannot live with that — `westernswing`, whose
   * verses run round the circle of fifths — overrides this and follows the chord.
   *
   * ## In minor
   *
   * A three-mode ladder, aeolian first, bending brighter before darker: dorian
   * where a major IV arrives over a minor tonic, which is the modal ballad's
   * natural sixth and the single most characteristic note on that side of the
   * repertoire. Not pentatonic, because a minor country tune is a modal ballad and
   * those genuinely use all seven notes — the pentatonic claim is a claim about the
   * *major* half of this music.
   *
   * **And harmonic minor under a dominant, which is the one line reggae's rule
   * deliberately omits.** This is where the two genres separate. Reggae's central
   * negative claim is that there is no dominant in minor anywhere in the
   * repertoire; this genre's minor tables contain `V7` explicitly — see `honkytonk`
   * — because a bar band in 1953 had played dance dates and the leading tone was
   * theirs. It is checked before the ladder rather than after, because a dominant
   * that fell through to aeolian would be a dominant with no leading tone in it,
   * which is the thing the chord is for.
   */
  scaleForChord: (tonic, mode, chord) => {
    if (mode === 'minor') {
      // The one dance-band inheritance this genre kept. See above.
      if (chord.dominantFunction) return makeScale(tonic, 'harmonicMinor');
      const tones = chordPcs(chord);
      for (const name of MINOR_LADDER) {
        const scale = makeScale(tonic, name);
        if (tones.every((t) => scale.pcs.includes(t))) return scale;
      }
      return makeScale(tonic, 'minor');
    }

    const tones = chordPcs(chord);
    // The key's own chords — nearly all of them — get the five notes.
    const major = makeScale(tonic, 'major');
    if (tones.every((t) => major.pcs.includes(t))) return makeScale(tonic, 'majorPentatonic');
    // The borrowed flat seventh, which both ends of this genre reach for.
    const mixolydian = makeScale(tonic, 'mixolydian');
    if (tones.every((t) => mixolydian.pcs.includes(t))) return mixolydian;
    // Further out than that: stay in the key and let the chord tone be a colour.
    return major;
  },

  /** The dance hall, the good suit and the card on the door. See `staging.ts`. */
  staging: STAGING,
};
