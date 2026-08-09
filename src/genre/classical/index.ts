/**
 * Classical — the written repertoire, 1700 to 1915.
 *
 * ## The load-bearing question, answered
 *
 * `Genre` exists because of one question — *where does the melody get its
 * notes?* — and there are four answers in the repo before this one. Iskelmä
 * follows the **key**; jazz follows the **chord**; ambient follows the
 * **drone**; synth follows the key with the seventh never raised.
 *
 * This follows the key, like iskelmä. It is worth saying that plainly before
 * saying anything else, because a genre that claimed a fifth answer and turned
 * out to be a variation on the first would be a genre nobody trusted the rest of.
 * The shape of the function below is iskelmä's shape: rooted on a tonic, chosen
 * by asking what the chord is doing, and never chord-rooted the way jazz's is.
 *
 * **And it is not iskelmä's rule, and the difference is the reason this genre is
 * worth adding.** Iskelmä's is two lines long and complete: aeolian throughout,
 * harmonic minor when a dominant-function chord arrives. One scale for a whole
 * song, one substitution at cadences, and the tonal centre never moves — which
 * is *correct*, because a tanssilava tango does not modulate. It stays in A
 * minor for three minutes and the key change at the end is a transposition of
 * the whole band.
 *
 * This repertoire modulates for real, and it does it three ways that iskelmä's
 * rule cannot express:
 *
 *   1. **A secondary dominant re-orients the line onto the key it is
 *      tonicising.** `V7/vi` is not a colour over the home key; it is the
 *      dominant of another key, and for as long as it lasts the melody is in
 *      that key, leading tone and all. Under iskelmä's rule it would return the
 *      home scale, and the note that makes the chord mean anything — its third,
 *      which is the *new* key's leading tone — would be an accidental the line
 *      had no reason to reach for.
 *   2. **A development section is defined by not being in the tonic.** There is
 *      no field for that: `FormStep` has a kind and a length and no key.
 *      It does not need one. A `bridge` progression written as a chain of
 *      applied dominants **is** in another key, bar by bar, because clause 1
 *      puts the line there. That is how the departure gets composed, and it is
 *      why the `bridge` tables in `sonata` and `gavotte` are the most chromatic
 *      in the file.
 *   3. **Mode mixture borrows from the parallel minor without leaving the key.**
 *      A borrowed `iv` in a major key is not a modulation and must not be
 *      treated as one — the tonic does not move, one note does. Iskelmä's rule
 *      would hand back plain major and leave the chord's flat sixth outside the
 *      scale; jazz's would re-root onto the chord and lose the key.
 *
 * So: the same *question* as iskelmä, and three answers it does not have. The
 * function is set out at the bottom of this file with the ladder it searches.
 *
 * ## What this genre does not have, stated so the absences read as decisions
 *
 * **No drum kit, anywhere.** Every one of the twenty-six styles carries
 * `excludeLayers: ['drums']`. The percussion of this music is the timpani, which
 * lives in the era palettes on the `brass` layer, because it is a pitched
 * instrument playing the tonic and the dominant under a tutti. `eras.ts` argues
 * it at length.
 *
 * **No solos and no `SoloProfile`.** Ambient makes the same negative claim and
 * `npm run genres` asserts it there; this one makes it for a different reason.
 * Ambient has no soloist because it refuses to have a foreground. This has
 * plenty of foreground and nobody improvising in it — the parts are written and
 * the players read them, and the one moment in the repertoire that is genuinely
 * invented on the night is a concerto cadenza, which is a soloist alone with the
 * band stopped. The solo engine's vocabulary is a bandstand's: a rotation round
 * the players, trading fours, and a rhythm section deciding how to comp behind
 * whoever stood up. None of those is a cadenza, and building one out of them
 * would be worse than not having one.
 *
 * **No `comping`.** The field is *"how far the chordal player departs from the
 * figure in front of them"*, and the answer here is nought. There is no figure
 * in front of them; there is a part. The one exception in the repertoire is the
 * baroque continuo, where the keyboard genuinely does improvise from a figured
 * bass — and what it improvises is a *voicing*, which `CompPattern.voicing` and
 * `HANDS.harpsichord` already handle, rather than a rhythm, which is what this
 * field moves.
 *
 * **No `feels`.** The library has six and every one of them is a rhythm-section
 * phenomenon defined by where a kit and a bass sit against the grid — a pocket,
 * a shuffle, a half-time. This genre has neither a kit nor a rhythm section, and
 * `Genre.feels` is empty on every genre so far for a reason its own docstring
 * gives: an opt-in is cheaper to add later than a wrong table is to take away.
 * The thing this repertoire actually wants from that field is *rubato* — a
 * phrase that stretches and then gives the time back — and `Feel.push` is a
 * fixed offset in milliseconds per layer, which is a groove and not a rubato.
 */

import { chordPcs, type ChordQuality } from '../../core/chord.js';
import { pc } from '../../core/pitch.js';
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
 * Chord qualities that have no key to be in.
 *
 * An augmented triad divides the octave into three equal parts and an altered
 * dominant with a ♭5 or a ♯5 divides it into six; neither has a perfect fifth,
 * so neither implies a tonic, and the scale that fits both is whole tone. That
 * is a Debussy chord and `scaleForChord` answers it as one.
 *
 * **The restraint that makes this safe is in the style tables, not here.** All
 * three of these appear in exactly one style — the impressionist `prelude` — and
 * nowhere else in twenty-six. A `III+` in a baroque minor movement is a harmonic
 * minor chord rather than a whole-tone one, and if some future style writes one
 * it will get the wrong answer from this clause. The alternative was to put the
 * whole-tone rule on `Style.scaleForChord` as an override, which the blues does
 * in jazz; it was not taken because a style override is a claim that *this style
 * disagrees with its genre*, and this is not a disagreement — it is a chord that
 * only one style writes.
 */
const NO_KEY = new Set<ChordQuality>(['aug', 'dom7sharp5', 'dom7flat5']);

/** Applied chords built on the leading tone rather than the dominant. */
const LEADING_TONE = new Set<ChordQuality>(['dim', 'dim7', 'halfdim7']);

/**
 * How much a major key is willing to borrow, in order.
 *
 * Read top down; the first entry that contains every note of the chord wins.
 * Each step down borrows strictly more from the parallel minor than the one
 * above it:
 *
 *   major          nothing borrowed
 *   harmonicMajor  the ♭6 alone, and the leading tone kept — the borrowed `iv`,
 *                  the `iio`, the fully diminished `viio7`. This is *the* mode
 *                  mixture sound and it is one note away from the key
 *   lydian         the ♯4, which is a borrowing in the other direction: the
 *                  major `II` of a mazurka, and the one bright thing this ladder
 *                  can reach
 *   minor          the whole parallel minor — ♭3, ♭6 and ♭7 together, which is
 *                  what a `bVI` or a `bIII` in a major key asks for
 *   phrygian       and the ♭2 on top of that, for a Neapolitan in major
 *
 * `harmonicMajor` above `lydian` because mixture is by a long way the commoner
 * borrowing in this repertoire, and the two almost never both fit — the chords
 * that reach for a ♭6 and the chords that reach for a ♯4 are disjoint sets.
 */
const MIXTURE_MAJOR: ScaleName[] = ['major', 'harmonicMajor', 'lydian', 'minor', 'phrygian'];

/**
 * The same ladder downward from a minor key.
 *
 *   minor          aeolian, which is where a minor-key line lives when nothing
 *                  is pulling on it
 *   harmonicMinor  the ♮7, for a non-dominant chord that still wants it
 *   dorian         the ♮6, which is the borrowed major `IV`
 *   phrygian       the ♭2, which is the Neapolitan — and the reason `bII` gets a
 *                  line that can play the chord's own root
 *   major          the parallel major, which one chord in this repertoire needs:
 *                  the tierce de Picardie, the major tonic that ends a minor
 *                  movement. Nothing else falls this far
 *
 * Note what is *not* on either ladder: locrian, on both, because a tonic whose
 * own triad is diminished is not a key centre — the same sentence ambient and
 * synth both write about their own ladders; and melodic minor, because the
 * ascending form is a property of a *line's direction* and a chord scale cannot
 * see one.
 */
const MIXTURE_MINOR: ScaleName[] = ['minor', 'harmonicMinor', 'dorian', 'phrygian', 'major'];

/**
 * Forms.
 *
 * Five, and none of them is verse/chorus with the bars moved around — which is
 * the failure a form table falls into and the one this repertoire would be
 * worst served by. The engine's six section kinds are read as follows and the
 * reading is consistent across all five:
 *
 *   intro    the opening statement, the ritornello, the bars before the tune
 *   verse    the first subject, the A section, the refrain, the exposition
 *   chorus   the second subject, the B section, the episode — **the section
 *            that is somewhere else**, which is what its progressions say
 *   bridge   the development, the trio, the middle section
 *   outro    the coda
 *
 * No `solo` anywhere, which is the other half of the genre carrying no
 * `SoloProfile` — see the header. A form containing one and a genre containing
 * no profile would put the lead on the counter instrument and call the result a
 * solo, which is precisely the behaviour the solo engine exists to replace.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  /**
   * Binary with both halves repeated — ‖: A :‖ ‖: B :‖ — which is the form of
   * every movement of a baroque suite and about half of everything else written
   * before 1750. The repeats are literal and are written out as consecutive
   * sections of the same kind, which is what makes the hook axis recall them
   * rather than compose them twice.
   */
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 5],
  /**
   * Rounded binary, and then the whole thing again after a trio: the minuet and
   * trio, the scherzo and trio, and the shape of the third movement of nearly
   * every symphony written between 1760 and 1830. The trio is two sections of
   * `bridge` rather than one because a trio has its own binary form inside it,
   * and coming back to the minuet after four bars would be a joke rather than a
   * middle section.
   */
  [[
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'bridge', bars: 8 }, { kind: 'bridge', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 5],
  /**
   * Sonata form: exposition, development, recapitulation, coda — and the
   * development is deliberately the longest single section in any form here.
   * That is the proportion the real thing has, and it is the section whose
   * progressions do the modulating, so giving it sixteen bars is giving the
   * applied dominants room to get somewhere and back.
   */
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'bridge', bars: 16 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 8 },
  ], 5],
  /**
   * Rondo: ABACABA, with the refrain intact every time. The only form here
   * where an eight-bar section returning identically is the *point* rather than
   * an economy, which is why `rondo` and `march` both push `hook` to `catchy`.
   */
  [[
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'bridge', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 4],
  /**
   * Ternary song form with long sections — the character piece, the aria, the
   * nocturne, the slow movement. A statement, a departure that is genuinely a
   * departure, and the statement again with everything on it. The one form here
   * whose middle section is a `chorus` rather than a `bridge`, because in this
   * shape the middle *is* the second subject rather than a development of the
   * first.
   */
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 16 },
    { kind: 'bridge', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 16 },
    { kind: 'outro', bars: 8 },
  ], 4],
];

export const classical: Genre = {
  /**
   * True, and it is the single most characteristic gesture in this repertoire.
   *
   * A modulation announced by the dominant of the key it is going to is the
   * difference between a key change and a splice, and this is the body of music
   * the distinction was invented in. `tune/keyplan.ts` writes the pivot as a real
   * applied dominant — `V7/V` for a move to the dominant — and `scaleForChord`
   * below picks it up as one, so the line is *already in the new key* for the bar
   * before the new key starts. That is what "prepared" means and it is the whole
   * mechanism.
   *
   * Synth sets this false and its reason is the mirror image: a leading tone in
   * a minor-key song would be an anachronism there. Here it is the point.
   */
  preparedModulation: true,
  id: 'classical',
  label: 'Classical',
  description:
    'The written repertoire — baroque dances and fugues, classical sonatas and rondos, romantic character pieces, impressionist preludes.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,

  /**
   * The keys this music is actually written in, and the reason is neither
   * fingering nor register: it is **open strings**.
   *
   * A violin's are G, D, A and E, a viola's and a cello's are C, G, D and A, and
   * a piece in one of those keys gets a sympathetically ringing instrument for
   * free — every stopped note has an open string vibrating in unison or at the
   * fifth. That is why the string repertoire lives in D, G, A, C and their
   * relatives, and it is why E♭ and A♭ belong to the wind and the piano rather
   * than to the strings.
   *
   * The flat keys are here and weighted lower rather than absent, because the
   * wind band and the keyboard half of this genre live in them: a trumpet and a
   * horn of 1785 are crooked in E♭ and F and can play almost nothing else, and
   * the Chopin end of the romantic era is in flats almost exclusively.
   */
  keys: {
    major: [[2, 6], [7, 5], [0, 5], [5, 4], [9, 3], [10, 3], [3, 2], [8, 1]],
    minor: [[9, 6], [2, 5], [4, 4], [7, 4], [0, 4], [11, 3], [5, 2], [1, 1]],
  },

  /**
   * It buttons.
   *
   * A concert piece finishes on a chord everybody plays together and holds, and
   * the audience claps — which is the description `EndingStyle` gives of
   * `button`, arrived at from a dance band and true of this repertoire for a
   * different reason. It is not the applause: it is that the last chord is a
   * *cadence*, the arrival the whole piece has been organised around, and a
   * cadence that faded out would be the one gesture this music cannot make.
   *
   * **Two styles want `fade` and now have it.** A nocturne ends by being let go
   * of rather than landed on, and an impressionist prelude does not cadence at
   * all — its own tables end on a chord with a ninth in it precisely so that
   * nothing resolves. `Style.ending` overrides this field, both of them write
   * `fade`, and the other twenty-four inherit the house answer by saying
   * nothing.
   *
   * **The split is 24 against 2 and the songs are 90.3% against 9.7%** — 29 of
   * 300 draws, `prelude` 16 and `nocturne` 13. That gap is the argument for the
   * field being an override rather than a per-style requirement: the exception
   * is real and it is small, and a table that made all twenty-six styles restate
   * the obvious would be twenty-four opportunities to get it wrong.
   *
   * Neither of the two ever got the cymbal this field is named for — both
   * exclude the drums — so what the wrong answer cost them was 6.2 and 4.9 notes
   * per song re-struck on the final downbeat, and an invented attack on 7 and 12
   * songs in 40. See the headers in `styles.ts`.
   */
  ending: 'button',

  /**
   * Nobody counts it in.
   *
   * A conductor gives an upbeat — one silent gesture, in tempo, that the band
   * comes in on — and four audible clicks in front of a sarabande would be a
   * different profession walking on stage. `withCountIn` only ever applies this
   * to a number being played in front of people, which is exactly the case where
   * it would be most wrong here.
   *
   * The same field, three genres, three unrelated reasons: ambient has no pulse
   * to count, synth has a machine that was already running, and this has a person
   * whose whole job is to start the band without making a sound.
   */
  countIn: false,

  /**
   * `strict`, and this is the one genre entitled to it.
   *
   * The rule table in `core/rules.ts` was not written from taste — it was
   * codified out of exactly this repertoire's voice-leading, and `Genre`'s own
   * docstring says as much: *"the rules encode faults classical and jazz practice
   * largely agree on"*. Jazz sets `light` because it disagrees with a third of
   * them; ambient and synth set `standard` because they disagree with a handful.
   * This genre agrees with all of them, so it takes the level at which they
   * mostly apply.
   *
   * Not `polished`, which is the maximum-smoothing setting and turns on the last
   * four rules in the table — no chromatic tone at all, no non-chord tone on a
   * strong beat, no leap beyond a third. Those are a description of a hymn, not
   * of this repertoire: an appoggiatura *is* a non-chord tone on a strong beat,
   * and it is the most characteristic melodic figure the period has.
   */
  defaultStrictness: 'strict',

  /**
   * `standard`, with three styles overriding in each direction.
   *
   * This music is built on material coming back — that is what a recapitulation
   * is, and a rondo refrain, and a da capo — but it comes back *developed* rather
   * than replayed, which is the distinction the hook axis measures. `catchy`
   * locks the rhythm and recalls every section, which is right for `rondo`,
   * `march` and the two ground-bass forms and wrong for everything else;
   * `through` never recalls anything, which is right for the impressionist
   * `prelude` and nothing else. `standard` in the middle is a genre that restates
   * its themes and does not repeat its bars.
   */
  defaultHook: 'standard',

  /**
   * What an orchestra does that a band does not.
   *
   * Four of the six devices are raised and the two that are not are the two that
   * belong to a rhythm section.
   *
   *  - **`trade` at 6**, the highest weight it has anywhere in the project. One
   *    player states a phrase and stops and another takes it over — that is a
   *    fugal entry, an antiphonal exchange between the wind and the strings, and
   *    the question-and-answer that every classical eight-bar period is built
   *    out of. It is the one device in the shared pool that means what this
   *    genre means by *counterpoint*.
   *  - **`harmony` at 6.** Thirds and sixths under the tune is the second oboe's
   *    entire job, and the second violin's, and the second horn's. In a dance
   *    band it is an arrangement decision; here it is the default state of a
   *    section.
   *  - **`swell` at 6**, which is the horns sustaining under the tune's long
   *    notes. This is the most-used orchestral device there is and the layer it
   *    needs — `brass` — is present in every style here, unlike in ambient where
   *    every style excludes it and the weight would be an intention nothing could
   *    honour.
   *  - **`unison` at 4.** The tutti octave statement, which is real and is
   *    reserved for arrivals.
   *  - **`tutti` at 3.** The whole band stopping the texture to hit the tune's
   *    rhythm for a bar is the orchestral hammer-stroke, and it belongs — but a
   *    dance band does it to lift a floor and this does it about twice a
   *    movement, so it stays below the conversational devices.
   *  - **`riff` at 1.** A repeated horn figure answering the singer is a
   *    twentieth-century arrangement, and where this repertoire repeats a figure
   *    it is an ostinato in the accompaniment rather than a stab in the gaps.
   */
  arrangement: { trade: 6, harmony: 6, swell: 6, unison: 4, tutti: 3, riff: 1 },

  /**
   * What a band does at a section join — and this genre has more to say about it
   * than any other, because it is the one with no drummer to say it for them.
   *
   * `DEFAULT_TRANSITIONS` is `fill` alone, which in a genre with no kit means
   * *nothing happens at any seam ever*. That is not the classical answer. A
   * classical section boundary is one of the most heavily marked events in
   * music: it is a cadence, and it is usually a cadence with the whole band on
   * it.
   *
   *  - **`shot` at 5**, and it is the tutti chord: the band leaving the texture
   *    and hitting a figure together. **Seven of the twenty-six styles** name
   *    their own `shots` table so that figure is the style's own rhythm rather
   *    than the metre's default — `gavotte`, `sarabande`, `overture`, `scherzo`,
   *    `march`, `mazurka`, `polonaise`. This note said *half*, which is thirteen
   *    and was never the count; the seven are the styles whose cadential figure
   *    is a fixed rhythm somebody could clap — the overture's dotted snap, the
   *    mazurka's second beat, the march's four square quarters — and the other
   *    nineteen take the metre's default because a sarabande's snap is a
   *    property of the dance and an adagio's cadence is not.
   *  - **`elide` at 4.** The elided cadence — the new phrase beginning on the
   *    bar the old one was resolving to — is a device this repertoire has a name
   *    for and uses constantly, and it is the one transition that makes a form
   *    feel continuous rather than assembled.
   *  - **`fill` at 2**, which is the drummer, who is not here. It stays on the
   *    table at a low weight rather than being struck off, because the fill
   *    generator degrades to nothing when the kit is absent and a genre-level
   *    palette that named only the gestures it *can* make would be over-marking
   *    every fourth seam. Two in eleven seams doing nothing at all is the right
   *    amount of nothing.
   *  - **No `break`.** Stop-time is a rhythm-section gesture: the band drops out
   *    for a bar and leaves one voice exposed. An orchestra dropping to one line
   *    for a bar is not a break, it is scoring, and it is what `layersFor`
   *    already does.
   */
  transitions: [['shot', 5], ['elide', 4], ['fill', 2]],

  /**
   * Where this genre disagrees with the shared rule table.
   *
   * Three entries, which is the second shortest override list in the project,
   * and the shortness is the claim rather than an economy: the table was
   * codified out of this repertoire, so a long list here would be evidence that
   * either the table or the genre was wrong about something.
   *
   * **This said *the shortest*, and pop's two beat it** — `augmented-second` and
   * `avoid-fourth`, nothing else. Counting override keys across all nineteen
   * genres: iskelmä declares no `ruleOverrides` block at all, pop 2, this and
   * latin 3, and the tail runs out at rock and indian on 10. Iskelmä having none
   * is the sharper version of this paragraph's own point and is where the
   * argument should have been looking — a genre that overrides nothing is the
   * strongest available statement that the shared table fits it.
   */
  ruleOverrides: {
    /**
     * The one that matters, and the one the prep wave flagged.
     *
     * `augmented-second` vetoes any one-scale-step move of three semitones from
     * strictness 1 upward, and its own description says why: it is *"wrong for a
     * singable idiom, and common because the generator reaches for harmonic
     * minor over every dominant"*. That is correct about most of this repertoire
     * — the melodic minor scale exists precisely because ♭6 to ♮7 is a fault in a
     * classical line, and this genre runs at `strict`, where the rule is fully
     * armed.
     *
     * It is wrong about two things this genre does on purpose. `harmonicMajor`
     * has the same gap between its ♭6 and its ♮7 and it is what `scaleForChord`
     * returns for every mode-mixture chord in a major key — a borrowed `iv`, a
     * `iio`, a fully diminished `viio7` — where the interval is the *sound of the
     * borrowing* rather than an accident on the way to a leading tone. And the
     * mazurka's raised fourth reaches the same shape from the other side.
     *
     * So: softened rather than disabled, which is the difference between this
     * and jazz's override of the same rule two folders over. Jazz drops the veto
     * to level 2 and the penalty to 0.3 because its altered and diminished scales
     * contain the interval by construction and it is genuinely idiomatic there.
     * Here it is idiomatic in *some bars and not others*, and a rule cannot tell
     * which — so it stays a strong preference at every level, and stops being an
     * outright veto until `polished`. A minor-key line still avoids it, because
     * a penalty of 0.35 is enough to lose almost every audition where an
     * alternative exists; a mixture chord that has no alternative gets its note.
     */
    'augmented-second': { minLevel: 1, vetoLevel: 4, penalty: 0.35 },

    /**
     * Parallel fifths and octaves are the one prohibition in the table that is
     * *literally* this repertoire's, and it is relaxed anyway — for one style.
     *
     * Planing, which is what the impressionist prelude is made of, is parallel
     * motion by construction: a chord moved up a step with all four voices
     * intact is four parallel intervals, and the whole reason it works is that
     * the ear stops hearing four voices and starts hearing one sonority. Debussy
     * knew exactly which rule he was breaking.
     *
     * Kept as a veto at the top level rather than switched off, because for the
     * other twenty-five styles it is right and a genre-wide field cannot tell
     * them apart. `minLevel: 3` means it is inert at `standard` and armed at
     * `strict`, which is this genre's default — so the twenty-five styles that
     * want it have it, and the penalty rather than a veto is what lets a planed
     * chord through when nothing else will do.
     */
    'parallel-perfects': { minLevel: 3, vetoLevel: 4, penalty: 0.6 },

    /**
     * The appoggiatura, and the reason `polished` is not this genre's default.
     *
     * `non-chord-tone-on-strong-beat` is a maximum-smoothing rule and is off
     * below level 4, so this override does nothing at `strict` — it exists to
     * say that if somebody runs this genre at `polished`, the rule is still
     * wrong. A leaning note on the downbeat that resolves down by step is the
     * most characteristic melodic figure the classical period has; it is in the
     * first bar of half the slow movements ever written, and a setting that
     * removed it would produce music that was correct and unrecognisable.
     */
    'non-chord-tone-on-strong-beat': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },
  },

  /**
   * An orchestral balance, which is not a dance band's.
   *
   * The band mixes melody loudest and pad furthest back, which is right when the
   * pad is a string machine holding chords behind a singer. Here the pad *is* the
   * string section, and a string section is not background — it is the body of
   * the sound and the thing every other instrument is balanced against.
   *
   * So the pad comes up and the melody comes down until they are nearly level,
   * which is what a hall does on its own: a solo oboe over a section is audible
   * because of its timbre rather than because it is louder, and a mix that puts
   * it 6 dB above the strings is a close-miked recording of a concerto rather
   * than a room. The bass is high because the double basses and the cellos are
   * the floor of an orchestral sound in a way an electric bass never is, and the
   * comp is low because in this genre it is most often a continuo keyboard or a
   * harp — an inner voice, and one that has spent three hundred years being
   * politely underneath everything.
   */
  mix: {
    melody: 0.88,
    pad: 0.82,
    bass: 0.8,
    comp: 0.6,
    counter: 0.62,
    brass: 0.7,
  },

  /**
   * The pad sits *above* the comp, which is the same statement ambient makes and
   * for a related reason.
   *
   * The default drops the pad a minor third below the arranger's shared ceiling,
   * and its own docstring explains why: given the same ceiling, the pad and the
   * comp produce the identical voicing, and two layers playing the same notes are
   * one layer at twice the volume. That is a real problem and −3 is a dance
   * band's solution to it. Here the pad is the string section and the comp is a
   * harpsichord or a harp, and the string section belongs where a string section
   * sits — above an inner keyboard part, not underneath it. Separating them
   * upward rather than downward keeps the same daylight and puts the right layer
   * on top.
   *
   * `response` says the strings breathe more than anything else. A section
   * crescendo is the largest dynamic gesture this music has, and it is a physical
   * fact about sixteen people rather than a fader move — where a harpsichord
   * cannot get louder at all, which is what 0.35 on the comp is describing.
   */
  layerPlan: {
    offsets: { pad: 2, comp: -6 },
    response: { pad: 0.9, comp: 0.35, bass: 0.6, brass: 0.85 },
  },

  /**
   * A hall, and a long one.
   *
   * The largest reverb in the project, and unlike the one behind it it is not an
   * effect — it is the room this music was written to be played in, and every
   * balance decision in the repertoire assumes it.
   *
   * **This said *the largest after ambient's*, and it is the other way round**:
   * 0.82 here against ambient's 0.78, with synth third at 0.7 and nothing else
   * above 0.68. The ranking is worth having the right way up because it is the
   * only place in the project where the biggest space belongs to a genre that
   * did not choose it — ambient's is a decision about a record and this is a
   * measurement of a hall. No delay at all: an echo
   * is a machine, and the only thing repeating in a hall is the reverb tail.
   */
  space: {
    reverbSize: 0.82,
  },

  /**
   * Standing production notes, refined by nothing — the eras here carry no
   * `effects` of their own, which is itself the statement. Ambient's and synth's
   * eras differ enormously in reverb and filtering because those genres are
   * *recordings* and the decade decides how they were made. These four eras are
   * differences in *instrumentation*: a 1720 room and a 1910 room are both a room
   * with people playing in it, and the reason they sound different is that one
   * has a harpsichord in it and the other has a celesta.
   *
   * The bass stays comparatively dry for the reason it does everywhere — reverb
   * on a sustained low tone arrives while the note is still sounding and the two
   * beat against each other — and everything above it is wet, which is what
   * sitting in the twelfth row is.
   */
  effects: {
    pad: { reverb: 0.72, lowpass: 8000 },
    melody: { reverb: 0.6, lowpass: 9000 },
    counter: { reverb: 0.65, lowpass: 8500 },
    comp: { reverb: 0.6, lowpass: 8000 },
    brass: { reverb: 0.6, lowpass: 7500 },
    bass: { reverb: 0.28, lowpass: 2200 },
    vocal: { reverb: 0.78, lowpass: 6500 },
  },

  /**
   * Two and a half to five minutes.
   *
   * Short by the standards of the repertoire and long by the standards of a
   * rotation, which is the same compromise ambient and synth both make. A minuet
   * really is two minutes and a sonata movement really is eight; one number per
   * genre cannot say both, and the window is chosen so that the fast dances come
   * out at the top of their real length and the slow movements at the bottom of
   * theirs.
   */
  duration: [150, 300],

  /**
   * The scale rule. **Where is the line? In whatever key the chord in front of
   * it is making.**
   *
   * Three clauses, in order, and the order is the argument:
   *
   * **1. A dominant makes a key, so go there.** Every chord with dominant
   * function is the dominant *of* something, and for as long as it lasts the line
   * belongs to that key rather than to the home one. For the key's own `V7` or
   * `#viio7` that target is the tonic and the answer is iskelmä's — harmonic
   * minor in minor, so the leading tone actually leads. For an applied dominant
   * it is somewhere else entirely, and this is the clause that makes the genre
   * worth adding: `V7/vi` in C major puts the line in A minor for a bar, leading
   * tone included, which is what tonicisation *is*.
   *
   * The target's own mode is read **off the numeral**, which is the most
   * satisfying part of the whole function: the notation has been saying it for
   * three hundred years. `V7/vi` goes to a minor key and `V7/IV` goes to a major
   * one, and the difference is the case of four letters. No degree table, no
   * inference, no assumption about which degrees of which mode are minor — the
   * label carries the composer's own statement and this reads it.
   *
   * The target's *root* is arithmetic. An applied dominant sits a fifth above
   * what it resolves to, so the target is five semitones up from the chord root;
   * an applied leading-tone chord sits a semitone below, so it is one up. Those
   * are the only two shapes the tables write.
   *
   * **2. A borrowed chord does not make a key, it colours one, so stay.** Mode
   * mixture is the other half of this repertoire's chromaticism and it is the
   * opposite gesture: the tonic does not move and one or two notes change. So a
   * chord with no dominant function is answered by the *smallest* borrowing from
   * the parallel mode that admits it — see `MIXTURE_MAJOR` and `MIXTURE_MINOR`
   * above, which are searched top-down and stop at the first fit. A borrowed `iv`
   * in C major takes `harmonicMajor`: the A♭ arrives and the B stays, which is
   * precisely the ache and precisely not a modulation.
   *
   * **3. Otherwise the key**, plain, which is where most bars land.
   *
   * ## The resemblance to ambient's and synth's rules, said out loud
   *
   * Clause 2 is an ordered ladder of modes of one tonic, searched for the first
   * that contains the chord, and that is structurally what those two genres do.
   * The honest thing is to say so rather than let somebody find it. What differs
   * is not the mechanism but what it is for and what is on it. Their ladders are
   * ordered by *brightness* and exist to bend a scale around a chord that is
   * merely passing; this one is ordered by *how much is borrowed from the
   * parallel mode* and contains `harmonicMinor` and `harmonicMajor`, which both
   * of theirs deliberately exclude — ambient because a leading tone is a promise
   * to resolve and it never does, synth because modal pop after 1970 has no
   * raised seventh at all. And theirs is the *whole* rule where this is the
   * fallback: clause 1 runs first and moves the tonic, which is the one thing
   * neither of them ever does.
   *
   * ## The one clause that is not about keys
   *
   * An augmented triad or an altered dominant with a ♭5 or ♯5 has no perfect
   * fifth and therefore implies no tonic, so it takes the whole-tone scale on its
   * own root — the only chord-rooted answer in the function, and the only place
   * this genre borrows jazz's shape. `NO_KEY` above says why that is safe and
   * what the one restriction on it is.
   */
  scaleForChord: (tonic, mode, chord) => {
    if (NO_KEY.has(chord.quality)) return makeScale(chord.root, 'wholeTone');

    if (chord.dominantFunction) {
      const slash = chord.label.indexOf('/');
      // The key's own dominant or leading-tone chord: the target is the tonic.
      // In major, a dominant carrying the flat sixth — `V7b9`, `viio7` — is a
      // mixture chord as well as a dominant, and `harmonicMajor` is the one
      // scale that is both.
      if (slash < 0) {
        if (mode === 'minor') return makeScale(tonic, 'harmonicMinor');
        return makeScale(tonic, chordPcs(chord).includes(pc(tonic + 8)) ? 'harmonicMajor' : 'major');
      }
      const target = pc(chord.root + (LEADING_TONE.has(chord.quality) ? 1 : 5));
      // Lower case says minor. `V7/vi` and `V7/VI` are different modulations and
      // the numeral is where the composer said which.
      const minorTarget = /^[b#]?[a-z]/.test(chord.label.slice(slash + 1));
      return makeScale(target, minorTarget ? 'harmonicMinor' : 'major');
    }

    const ladder = mode === 'minor' ? MIXTURE_MINOR : MIXTURE_MAJOR;
    const tones = chordPcs(chord);
    for (const name of ladder) {
      const scale = makeScale(tonic, name);
      if (tones.every((t) => scale.pcs.includes(t))) return scale;
    }

    // Nothing on the ladder holds it — a sonority these tables do not contain.
    // Stay in the key rather than chase it: an out-of-scale chord tone under a
    // line that stayed put is a colour, which is what a chromatic chord in this
    // repertoire is when it is not a dominant.
    return makeScale(tonic, mode === 'minor' ? 'minor' : 'major');
  },

  /**
   * The hall, the tails and the concert programme. See `staging.ts`, and
   * `Staging` in `../types.ts` for why a genre carries its own.
   */
  staging: STAGING,
};
