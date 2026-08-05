/**
 * Arabic.
 *
 * Another answer to the question that made `Genre` an abstraction: where does
 * the melody get its notes?
 *
 * Iskelmä answers "from the key", jazz "from the chord", ambient "from the
 * drone", synth "from the key, and never raise the seventh". This one answers
 * **"from the maqam"** — one strongly characterised scale rooted on the tonic
 * for the whole piece, and the line stays in it whatever the accompaniment is
 * doing.
 *
 * Mechanically that is very close to ambient's drone rule and in effect it is
 * the opposite of it, which is worth being precise about because the two
 * functions look alike and are making contrary claims. Ambient's rule *bends*:
 * it searches outward for whichever mode of the tonic will admit the chord
 * passing underneath, so the harmony recolours the scale and the tonal centre
 * simply refuses to move. This one does not bend at all. A maqam is not a
 * neutral mode, it is a scale with a **sayr** — a habitual path through it, a
 * set of resting degrees, a place where phrases stop — and a maqam that took a
 * different sixth because a chord asked for one would have stopped being that
 * maqam.
 *
 * So the rule below reads two of its three arguments and pointedly not the
 * third. `chord` is absent from the parameter list, and its absence is the
 * statement: this genre's melody has *no relationship at all* with what is
 * sounding under it. That is not an approximation of the practice, it is the
 * practice — a takht is heterophonic, everyone is playing the line, and the
 * triads a 1960s firqa put underneath it were an import that arrived thirty
 * years after the repertoire.
 *
 * ## Why a maqam cannot be a key, and has to come through this hook
 *
 * `src/tune/tune.ts` derives the tune's base scale from `Mode`, and `Mode` is
 * `'major' | 'minor'` and nothing else. **A scale can reach the melody only
 * through `scaleForChord`.** Hijaz is therefore not something this genre can
 * declare; it is something the hook returns, exactly as ambient returns its
 * drone scale, and every design decision in this folder follows from that one
 * constraint.
 *
 * ### The consequence that surprises everyone, including its author
 *
 * **Maqam Hijaz is a major-mode maqam here.** Hijaz has a ♭2 over a ♮3 — the
 * augmented second between them is the sound everybody knows — and that ♮3 is
 * what decides it: `Mode` chooses how the roman numerals are read, so a Hijaz
 * piece written in minor would put a ♭3 in every tonic chord and spend the whole
 * song a semitone away from the maqam's own third. Hijaz, Hijazkar and Shawq
 * Afza are all major-mode; Nahawand, Kurd and Nawa Athar are all minor. It reads
 * backwards — the ones that *sound* dark are the major ones — and it is right.
 *
 * ## The maqamat this genre has, and the three kinds of absence
 *
 * Twelve-tone equal temperament, which is a scope decision rather than a view
 * about the music. Within it:
 *
 * | maqam | scale | seats |
 * |---|---|---|
 * | **Hijaz** | `phrygianDominant` | dukah (D), nawa (G), and E and A |
 * | **Hijazkar** | `doubleHarmonic` | rast (C), and F, B♭, E♭ |
 * | **Nahawand** | `harmonicMinor` | rast (C), and F, E♭ |
 * | **Farahfaza** | `minor` | nawa (G), and B♭ |
 * | **Kurd** | `phrygian` | dukah (D), and E and A |
 * | **Nawa Athar** | `hungarianMinor` | `taqsim` only — see below |
 * | **Shawq Afza** | `harmonicMajor` | `taqsim` only |
 * | **Ajam** | `major` | `taqsim` only |
 *
 * **Absent because the engine has no quarter tones.** Rast, Bayati, Saba,
 * Sikah, Huzam, Awj-Ara and everything else built on a half-flat second, third
 * or sixth. These are not approximated and it is deliberate: Rast with a natural
 * third is Ajam and Bayati with a natural second is Kurd, so "approximating"
 * them means silently substituting a different maqam under the same name. Saba
 * is the sharpest case — its 12-TET spelling would need a diminished fourth, so
 * there is not even a wrong answer available — and the honest position is that
 * the three most-used maqamat in the tradition are not in this genre.
 *
 * **Absent because the harmony cannot hold them.** Nawa Athar has a raised
 * fourth, so there is no minor triad on its fourth degree; Shawq Afza has a ♮2
 * and a ♭6, which between them rule out the ♭II and the IV. Every progression
 * table in `styles.ts` uses those chords. They are reachable in exactly one
 * style — `taqsim`, which plays over a drone and has no chords to contradict —
 * and Ajam joins them there for a different reason: plain major is what this
 * engine already returns by default, so a genre whose whole claim is the maqam
 * has nothing to say by choosing it, *except* in the one place where "the major
 * scale" is genuinely a named maqam being played on purpose.
 *
 * **Absent because the scale table has no row for them.** Nikriz proper
 * (dorian with a raised fourth) and Athar Kurd. `core/scale.ts` files
 * `hungarianMinor` under Nikriz, which is right about its lower jins and one
 * degree out at the top: Nikriz takes a ♮6 and ♭7 above the fifth where that
 * scale takes a ♭6 and ♮7, and the shape it actually spells is **Nawa Athar**.
 * That is what it is called here.
 *
 * ## The maqam is chosen by the tonic, which is how they are named
 *
 * The hook's only piece-invariant inputs are the tonic and the mode, so a maqam
 * that is constant for a whole piece has to be a function of those two and
 * nothing else. That looks like a limitation and is the tradition: maqamat are
 * *named for their tonic* — Nahawand on rast, Kurd on dukah, Hijaz on dukah and
 * on nawa, Ajam on ajam-ushayran, which is the degree the maqam is named after.
 * So **this genre's key table is its maqam table**, and weighting D above C is
 * the same act as preferring Hijaz to Hijazkar.
 *
 * Two fields follow from it and are set to zero everywhere.
 * `EraProfile.keyChangeChance` is 0 in all four eras and `relativeMajorChorus`
 * is 0 on all twenty-one styles, because a key change moves the tonic and
 * moving the tonic changes the maqam — silently, with the tables looking
 * innocent and the last chorus in a different mode from the first.
 */

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
 * The major-mode maqamat, by tonic — the ones whose tonic triad is major.
 *
 * Hijaz on the two degrees the tradition seats it on, dukah and nawa, plus the
 * two transpositions closest to them; Hijazkar on rast and its own three. The
 * split is not decoration: Hijaz has a ♭7 and Hijazkar has a ♮7 and a second
 * augmented second above the fifth, so which one a piece is in changes the
 * upper half of every phrase in it.
 *
 * **Shad Araban is not a row.** It is Hijazkar seated on nawa, which on this
 * tonic is the identical set of pitch classes with the identical degree 0 — the
 * inverse of the argument `core/scale.ts` makes about rotations, and a row that
 * differed only in what it was called would be a row that differed in nothing.
 */
const MAJOR_MAQAM: Record<number, ScaleName> = {
  2: 'phrygianDominant',  // dukah — Hijaz, the canonical seat
  7: 'phrygianDominant',  // nawa — Hijaz, the other one
  9: 'phrygianDominant',
  4: 'phrygianDominant',
  0: 'doubleHarmonic',    // rast — Hijazkar
  5: 'doubleHarmonic',
  10: 'doubleHarmonic',
  3: 'doubleHarmonic',
};

/**
 * The minor-mode maqamat, by tonic.
 *
 * Nahawand and Farahfaza are the same maqam family split by what sits above the
 * fifth, and that is a real distinction rather than a convenience: jins Hijaz
 * above the fifth gives the ♮7 and the augmented second, which is
 * `harmonicMinor`; jins Kurd above it gives the ♭6 and ♭7, which is plain
 * aeolian. Kurd is the third, and it is the one with the ♭2 — the maqam a
 * European ear hears as phrygian and a listener here hears as the sound of the
 * whole Levantine song repertoire after 1960.
 */
const MINOR_MAQAM: Record<number, ScaleName> = {
  2: 'phrygian',        // dukah — Kurd, the canonical seat
  4: 'phrygian',
  9: 'phrygian',
  0: 'harmonicMinor',   // rast — Nahawand, with jins Hijaz above the fifth
  5: 'harmonicMinor',
  3: 'harmonicMinor',
  7: 'minor',           // nawa — Farahfaza, with jins Kurd above the fifth
  10: 'minor',
};

/**
 * The refrain comes first, and it is the shape of the repertoire rather than a
 * variation on verse/chorus.
 *
 * An Arabic song opens on its **mazhab** — the refrain — states it, then goes
 * out into a **ghusn** and comes back. Iskelmä's forms all open on a verse and
 * arrive at a chorus; these arrive at nothing, because the audience was given
 * the tune in the first sixteen bars and everything after that is a departure
 * from something they already have. `chorus` is the mazhab, `verse` is the
 * ghusn, `solo` is a taqsim, and `intro` is a dulab or a taqsim depending on the
 * style.
 *
 * `bridge` appears once and rarely, and that is a statement about the harmony:
 * a bridge in this repertoire would be a change of maqam, which is a real device
 * — the **sayr** of a long piece goes out to a neighbouring maqam and comes home
 * — and it is precisely the thing this engine cannot express, since the hook has
 * one answer per piece. What the bridge does here instead is change the *chord*
 * for eight bars, which is a shadow of it.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'chorus', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 5],
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'chorus', bars: 8 }, { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'solo', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 5],
  // The long-song shape: a very long ghusn, the refrain as relief, and one
  // taqsim on the way out. This is the ughniya at radio length.
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'solo', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 4],
  // The instrumental one: khana, taslim, khana, taslim. A sama'i, a bashraf and
  // a longa are all this form and nothing else.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'bridge', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 4],
];

export const arabic: Genre = {
  id: 'arabic',
  label: 'Arabic',
  description: 'Maqam music by rhythmic cycle — maqsum, baladi, saidi, samai thaqil, dabke, zaffa, longa and the unmetred taqsim.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,

  /**
   * The key table *is* the maqam table. See the header.
   *
   * Weighted toward the two degrees the tradition actually names its maqamat
   * for — dukah (D) and rast (C) — with nawa (G) behind them. The four
   * remaining entries in each mode are transpositions rather than seats and are
   * weighted accordingly: they exist so that two songs in the same maqam are not
   * always in the same key, which would make the station sound like one very
   * long piece.
   *
   * Nothing outside these eight pitch classes is ever drawn, so the fallbacks in
   * the hook below are unreachable in practice. They are there because the hook
   * is also called from the audition page, where a key can be forced.
   */
  keys: {
    major: [[2, 6], [0, 5], [7, 5], [9, 3], [5, 3], [10, 2], [4, 2], [3, 1]],
    minor: [[2, 6], [0, 5], [7, 4], [9, 4], [5, 3], [10, 2], [4, 2], [3, 1]],
  },

  /**
   * The **qafla** — the closing formula, landed together.
   *
   * Every phrase in this music ends on one and the piece ends on the largest of
   * them: the ensemble descends to the tonic in unison and stops, and the room
   * shouts. That is a button by any definition this project has, and it is why
   * `ending` is not `fade` despite `taqsim` wanting one.
   *
   * **And nobody counts it in.** A takht is led in by a *dulab* — four bars of
   * instrumental strain that announce the maqam — or by a taqsim, which is
   * unmetred and has nothing to count. The announcement is this genre's version
   * of the four clicks and it is a whole style rather than a bar, so the clicks
   * themselves would be four beats of the wrong music in front of it.
   */
  ending: 'button',
  countIn: false,

  /**
   * `standard`, and the argument for `light` is worth recording because it was
   * wrong.
   *
   * The rule table was written on the assumption that the melody is being fitted
   * *against* a harmony, and here it is not — the chords are four numerals laid
   * under a line that was complete without them. That reasoning says drop the
   * level, and it is answered instead by the `ruleOverrides` below, which relax
   * exactly the rules that compare the line to the chord and leave alone the ones
   * that are about the line by itself.
   *
   * Dropping the level as well relaxes the second set too, and one of them
   * matters here more than in any other genre. `repeated-note-run` — three
   * identical notes in a row — starts at level 2, so at `light` it is off; and
   * this genre's overrides have *also* softened `static-repetition`, on the true
   * observation that a note struck twice with the second leaned on is the
   * commonest ornament in the idiom. Both off at once is not an ornament, it is a
   * line that has stopped moving: measured over 30 songs, repeated notes were
   * 23.3% of melodic intervals at `light`, against 16% for the next highest genre
   * in the project. `standard` keeps the ornament and takes back the stall.
   */
  defaultStrictness: 'standard',

  /**
   * `catchy`. The mazhab is supposed to be the same tune every time it comes
   * back — that is what a refrain is for and this repertoire returns to one more
   * often than any other here, three or four times in a five-minute piece. Two
   * styles pull away from it in opposite directions: `taqsim` to `through`,
   * because an improvisation that repeated itself would be a composition, and
   * `ayyub` and `longa` to `earworm`, because a trance rhythm and a rondo are
   * both built on the thing coming round again unchanged.
   */
  defaultHook: 'catchy',

  /**
   * No applied dominants, and it is not a stylistic preference.
   *
   * A `V7/iv` in front of the last refrain would introduce two pitch classes
   * that are outside the maqam and are not in the genre's chord vocabulary
   * either — and the melody, which is not consulting the chord at all, would
   * carry straight on through it. The result is not a prepared modulation, it is
   * eight beats of a different genre with this genre's tune over the top. There
   * is nowhere for the piece to modulate *to*, because there is one maqam and it
   * does not move.
   */
  preparedModulation: false,

  /**
   * The ensemble is one line, thickened.
   *
   * `unison` at 9 is the highest weight the field carries anywhere in the
   * catalogue — ambient and synth both sit at 6 — and it is the definition of
   * the genre's texture rather than a colour applied to it:
   * heterophony is several players stating the same melody and decorating it
   * differently, and two instruments in octaves is the nearest this engine
   * gets to it. `harmony` is nearly off for the same reason — a second line in
   * parallel thirds is the one thing a takht never does, and where a firqa does
   * it, it is a 1960s import.
   *
   * `riff` and `tutti` are the **lazma**: a short instrumental figure the whole
   * ensemble plays together between vocal phrases, which is exactly a riff by
   * one name and a tutti by the other. `trade` is the exchange between a soloist
   * and the drum, which is real and is not frequent.
   */
  arrangement: { unison: 9, harmony: 1, riff: 5, tutti: 4, trade: 3 },

  /**
   * What the band does at a join. Three kinds now, and the one that is still
   * missing is the interesting half.
   *
   * `shot` is the **qafla** arriving early — the whole ensemble landing one
   * figure together at the end of a phrase, which is what a taslim does every
   * time it comes round. `fill` is the commonest because a darbuka player
   * answers the end of a phrase whether or not anybody asked.
   *
   * `elide` runs one section into the next without a seam, and in a form whose
   * refrain is the point, a mazhab that arrived without being arrived at would
   * be a mazhab nobody noticed. That one is a taste, and it is the only kind
   * this genre still refuses.
   *
   * ## `break` is back, and how it came back is the sharpest thing here
   *
   * The drum stopping dead while the singer holds a note over nothing is the
   * single most reliable way this repertoire gets a room to shout, and it is the
   * gesture this palette most wants. It could not have it, and the reason was
   * measurable rather than aesthetic.
   *
   * `playBreak` used to choose who carries the bar by asking which layer
   * *covers* a third of it in sounding time, and to decline outright where
   * nobody did — a decision taken after the tune was written, from the tune.
   * That is fine for a band whose melody fills its bars and it was not fine
   * here: this genre's lines are the sparsest in the project outside ambient,
   * full of leading rests and single whole-bar notes on purpose, so the coverage
   * of a section's last bar sat *at* the threshold and crossed it whenever the
   * tune changed. `--hook` changes the tune, and `npm run genres` asserts that
   * hook leaves the drums alone.
   *
   * Measured then, 200 songs per style, comparing the kit at `through` against
   * the kit at `earworm` with a break in the palette:
   *
   *   jazz/swing 0 unstable of 200 · jazz/blues 0 · reggae/flyers 0
   *   arabic/dabke 9 · arabic/zaffa 7 · arabic/longa 8 · arabic/fallahi 17
   *
   * Four other genres declared `break` and none of them moved. This one moved on
   * every style tried, including the three densest, which is why it was dropped
   * at the genre level rather than pushed down onto whichever styles could carry
   * it — there were none.
   *
   * **The carrier is named now instead of found, so no note is read at all** and
   * the coverage threshold that this music kept falling through no longer
   * exists. That is not a wider threshold, it is a different question: *who is
   * the bass player* rather than *did the bass happen to fill this bar*. The
   * first is a fact about the band and cannot move with the tune; the second was
   * a fact about one bar of one take. Weight 2 against the qafla's 3 — the
   * gesture is rarer than the landing and is the one the ensemble saves.
   *
   * **And this genre names no carrier**, which is the finding worth writing
   * down. The default is the bass and the default is right here: the qanun and
   * the oud are `comp` — `dulcimer` and `nylonGuitar` in `eras.ts` — the ney and
   * the violin are `melody`, and what the bass palette names in every era is a
   * contrabass or a cello. A takht stopping dead on a bass holding the tonic is
   * what the last bar before a mawwāl actually sounds like. Measured over the
   * whole catalogue with every palette forced, 30 seeds a style: **0 break bars
   * in arabic came out with nothing sounding in them under the default.** There
   * is nothing to fix and therefore nothing to declare — and a field named for
   * symmetry with the genre next door would be a claim about this band that this
   * band did not make.
   *
   * The two names an author is tempted by are both worse, and by different
   * amounts:
   *
   *  - **`melody`, for a taqsim that ends on the qanun, is the worst option
   *    available.** 48 empty bars in arabic alone against the default's 0, and
   *    479 across the catalogue. A taqsim ends on the qanun *and then the qanun
   *    stops*; a seam is precisely the moment the tune has finished its phrase,
   *    so the layer that most sounds like the right answer is the one least
   *    likely to be sounding.
   *  - **`pad` costs half the breaks rather than emptying them.** It is the
   *    right answer next door in `indian`, where every style writes
   *    `requireLayers: ['pad']` and the śruti box never stops. Here five styles —
   *    `malfuf`, `jurjina`, `aqsaq`, `longa`, `dulab` — declare
   *    `excludeLayers: ['pad']` outright, and `breakable` refuses a seam whose
   *    section does not list the carrier: 443 drawn breaks fall to 226. A carrier
   *    a fifth of the catalogue does not have is a palette entry those styles
   *    silently lose.
   */
  transitions: [['fill', 7], ['shot', 3], ['break', 2]],

  /**
   * The ensemble drops away behind a soloist. See `solo` below.
   */
  soloBacking: 'sparse',

  /**
   * The **taqsim**, which is the oldest improvisation in this project by several
   * centuries and is not a chorus of blowing.
   *
   * A jazz solo runs the changes; an iskelmä break ornaments the tune. A taqsim
   * does a third thing: it *explores the maqam*, one jins at a time, going
   * further up the scale with each phrase and coming home through every resting
   * degree on the way down. Three of the numbers below carry that shape.
   *
   *  - **`chromatic` at 0.06, against jazz's 0.5.** A note outside the maqam is
   *    not a colour here, it is a modulation — the tradition has a word for it,
   *    and doing it by accident on a passing eighth is the one thing a taqsim
   *    must not do. This is the field that would otherwise walk straight through
   *    the whole design: `scaleForChord` cannot stop a soloist reaching for the
   *    semitone either side of where it is, which is exactly the hole
   *    `chromatic-leading-tone-in-minor` was written to plug for synth.
   *  - **`climb` at 3.5 and `develop` at 0.82**, against jazz's 3 and 0.72. The
   *    ascent is the form, and each phrase is *about* the one before it because
   *    a taqsim that changed subject would have stopped being one improvisation.
   *  - **`ornament` at 0.55, against iskelmä's 0.4 and jazz's 0.** See
   *    `melody.ornament` in `styles.ts` for the general version of the argument.
   *
   * The rotation puts the qanun and the oud — `comp` — nearly level with the
   * lead, because in this ensemble the accompanist *is* a soloist who happens to
   * be accompanying, and the darbuka is on it at a real weight because the drum
   * solo is a genuine feature of the repertoire rather than the indulgence it is
   * in a dance band.
   */
  solo: {
    rotation: [['melody', 5], ['comp', 4], ['counter', 3], ['drums', 2], ['bass', 0.5]],
    // The exchange with the drum, which happens and is not the point of the
    // evening. Lower than jazz's by half.
    tradeFours: 0.3,
    // The taqsim ends by touching the lazma so the ensemble knows to come back
    // in, which is a quote with a job.
    quoteMotto: 0.35,
    backing: {
      melody: 'sparse', comp: 'sparse', counter: 'sparse', bass: 'sparse',
      drums: 'trade',
    },
    vocabulary: {
      gait: 0.45,
      doubleTime: 0.26,
      // Nothing accents off the beat in this idiom. The weight goes on the
      // group heads, which the metre already supplies.
      offbeatAccent: 0.12,
      // A bebop enclosure is chromatic by construction and would break the
      // maqam twice per gesture.
      enclosure: 0.08,
      chromatic: 0.06,
      ornament: 0.55,
      develop: 0.82,
      displace: 0.25,
      // A quarter of the beats have nothing starting in them. The silence
      // between phrases is where the room answers.
      space: 0.3,
      climb: 3.5,
      // Low, and not zero. A taqsim is not a paraphrase of the song — but it is
      // played by somebody who has just heard it, and one phrase in six turning
      // out to be the tune is what makes it belong to this piece.
      paraphrase: 0.15,
      // The qafla into the returning refrain — a shade above iskelmä's 0.85,
      // where the same field buys the run into the last chorus. It is the
      // gesture the whole solo is aimed at, and here the refrain it hands back
      // to has already been heard three times.
      liftIntoReturn: 0.88,
    },
  },

  /**
   * Where this genre disagrees with the shared rule table.
   *
   * Two of these are load-bearing in the strict sense that without them the
   * generator quietly refuses to play the genre's characteristic interval, and
   * both fail *silently* — no error, no warning, just a melody that has had the
   * thing it exists for filtered out of it.
   */
  ruleOverrides: {
    /**
     * **The one that would have gutted this genre.**
     *
     * `augmented-second` vetoes any move of one scale step and three semitones
     * from strictness 1 upward, and its own description says why: *"Sounds
     * distinctly Middle Eastern; wrong for a singable idiom."* That is a correct
     * description and exactly the wrong conclusion here. The ♭2→♮3 of Hijaz and
     * the ♭6→♮7 of Nahawand are not accidents of reaching for a leading tone,
     * they are the intervals the maqamat are *identified by* — Hijazkar has two
     * of them, one either side of the fifth, and the symmetry is the whole
     * character of the scale.
     *
     * Disabled outright rather than softened. A penalty would leave the
     * generator preferring every other move, which on a seven-note scale means
     * routing around the augmented second every time it can — and it can nearly
     * always, because there is a note on both sides of it.
     */
    'augmented-second': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * **The second one, and it is not obvious until it fires.**
     *
     * `flat-nine` catches a melody note a semitone above the chord root, held,
     * on a beat. In Hijaz, Hijazkar and Kurd the ♭2 *is* a semitone above the
     * tonic, the tonic chord is under it for four bars at a time, and the ♭2 is
     * one of the two notes the maqam is recognised by. So the rule fires on the
     * genre's second-most characteristic degree every time the line rests on it,
     * which is the place a maqam phrase most wants to rest.
     *
     * Kept as a mild preference at the smoothest setting, which is where ambient
     * left it for the same interval arrived at from the other direction — its
     * ♭II leaning on a drone.
     */
    'flat-nine': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.6 },

    /**
     * The fourth degree is a resting tone, not an avoid note.
     *
     * `avoid-fourth` forbids a sustained perfect fourth over a major-quality
     * chord because it clashes with the major third. In jins terms the fourth
     * degree is the top of the lower tetrachord and the **ghammaz** — the note a
     * phrase stops on before it moves up into the next jins — so roughly half
     * the phrases in a Hijaz piece are supposed to come to rest exactly there,
     * over a tonic major triad, and hold.
     */
    'avoid-fourth': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * Parallel octaves are the texture. Heterophony means the nay and the violin
     * and the singer are all on the same line an octave apart; forbidding
     * parallel perfects between the melody and the bass forbids the arrangement.
     */
    'parallel-perfects': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * Softened rather than switched off, which is the interesting half.
     *
     * Nahawand and Hijazkar both have a ♮7 a semitone under the tonic and both
     * genuinely resolve it upward at the qafla — so the rule is *right* about
     * this repertoire more often than not, and disabling it would throw that
     * away. What it is wrong about is the descent: a Nahawand phrase coming down
     * through the ♮7 to the ♭6 and on to the fifth is the second half of nearly
     * every phrase in the maqam, and the augmented second it crosses on the way
     * is the one this genre just spent a paragraph enabling.
     */
    'unresolved-leading-tone': { minLevel: 3, vetoLevel: RULE_DISABLED, penalty: 0.55 },

    /**
     * A non-chord tone reached by leap is ordinary here, because the chord is
     * not what the line is being written against. Kept as a preference at the
     * top two levels, which is where jazz put it for a different reason.
     */
    'unprepared-dissonance': { minLevel: 3, vetoLevel: 4, penalty: 0.5 },

    /**
     * And the same argument at the beat level. `non-chord-tone-on-strong-beat`
     * pushes the line onto chord tones at the top of the bar; a maqam phrase
     * lands on the maqam's resting degrees, which are a property of the scale
     * and coincide with the four-chord vocabulary only by luck.
     */
    'non-chord-tone-on-strong-beat': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.5 },

    /**
     * A repeated note is an ornament here rather than a stall. The commonest
     * decoration in the idiom is a note struck twice with the second one leaned
     * on — it is what a plectrum does — and the rule exists to catch a melody
     * that has run out of ideas, which is a different thing.
     */
    'static-repetition': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.7 },
  },

  /**
   * The singer, then the drum, then everybody else a long way back.
   *
   * This is the least ambiguous mix in the project and the ordering is not a
   * taste. The melody carries the piece and the ensemble exists to leave a hole
   * for it; the percussion is next because the iqa' is what the styles are
   * *sorted by* and an inaudible iqa' makes the catalogue one style wide; and
   * the pad is last because in three of the four eras it is a string section
   * doubling the tune quietly, which is thickening rather than harmony.
   */
  mix: {
    melody: 0.94,
    bass: 0.72,
    drums: 0.66,
    counter: 0.5,
    comp: 0.5,
    pad: 0.42,
  },

  /**
   * The three hand strokes forward, and everything a Western kit would put in
   * front of them behind.
   *
   * `lp` above its own default because in this genre the doum is not an accent,
   * it *is* the pulse — the job a kick does elsewhere, played on a smaller drum
   * with no sub underneath it, and in three of the four eras there is no kick at
   * all to share the work. `hh` is nearly halved for the mirror-image reason:
   * the hi-hat's job here belongs to the riq, and a hat at its usual level next
   * to a tambourine is two instruments doing one thing at twice the volume.
   *
   * `bd` stays high and is not the darbuka. It appears in two styles — `zaffa`
   * and one saidi pattern — and in both of them it is the tabl baladi, a
   * metre-wide drum beaten with a stick out in the street, which is meant to be
   * the loudest thing in the number.
   */
  drumMix: {
    lp: 0.92, mp: 0.68, hp: 0.56, tb: 0.52,
    bd: 0.8, sd: 0.5, rim: 0.55, cp: 0.6, perc: 0.6,
    hh: 0.26, oh: 0.3, sh: 0.32, cr: 0.4, rd: 0.28,
    lt: 0.6, mt: 0.6, ht: 0.6, cb: 0.45,
  },

  /**
   * The comp sits well under the tune, and the reason is heterophony rather
   * than arrangement.
   *
   * `docs/synth.md` records the same number for a sequencer and arrives at it
   * from the opposite direction: a 16th figure voiced in the lead's own octave
   * fuses with the lead and the ear picks whichever is louder. Here the danger
   * is worse, because the comping instrument is a qanun or an oud and what it
   * would naturally be playing is *the same line* — this is the one genre where
   * the accompaniment and the melody are the same material by definition, so
   * they have to be separated by register or there is nothing to separate them
   * by at all.
   *
   * The pad drops further still. In the firqa era it is fifteen violins, and
   * fifteen violins in the singer's octave is not a bed, it is a competing lead.
   */
  layerPlan: {
    offsets: { comp: -4, pad: -6 },
    // A string section doubling a line does not get louder in the refrain, it
    // gets *more of itself* — which the arranger expresses by adding layers.
    response: { pad: 0.4 },
  },

  /**
   * The accompanist leaves holes and rarely anticipates.
   *
   * `rest` is the largest of the three because a qanun player accompanying a
   * singer spends most of the line not playing — the answer comes in the gap at
   * the end of the phrase, which is the whole of what accompaniment means here.
   * `anticipate` is low and deliberately below jazz's: the chord arriving ahead
   * of the barline is a swing-era gesture, and in a music where the barline is
   * the iqa's own downbeat it reads as the drummer being late.
   */
  comping: { rest: 0.22, anticipate: 0.14, displace: 0.18 },

  /**
   * The room, before the era refines it. Modest by the standards of everything
   * else here: a courtyard with an arcade is a small hard room, and the long
   * decays this music is sometimes given belong to the 2000s studio era alone.
   *
   * The delay is a dotted eighth for the reason every delay in this project is,
   * and it is turned almost all the way down at the genre level because a takht
   * had no delay at all — what echo there is arrives from the era tables, which
   * is where the equipment lives.
   */
  space: {
    reverbSize: 0.55,
    delayBeats: 0.75,
    delayFeedback: 0.25,
  },

  /**
   * Standing production notes, true whichever decade the era is pretending to
   * be from. Two of them do the work:
   *
   *  - **The percussion is dry.** A darbuka is a transient — the doum is a
   *    thump with a pitch in it and the ka is a 4 kHz crack — and reverb on
   *    either one turns the iqa' into a wash where the three strokes stop being
   *    distinguishable. That is the failure this whole genre is built to avoid,
   *    and it is a mix decision as much as a table one.
   *  - **The melody is bright and barely filtered.** The ornament in this music
   *    lives at the top of the spectrum — a grace note on a qanun is mostly
   *    attack — and a lowpass that would flatter a pad removes it.
   */
  effects: {
    melody: { reverb: 0.38, lowpass: 11000 },
    counter: { reverb: 0.44, lowpass: 10000 },
    comp: { reverb: 0.34, lowpass: 9500 },
    pad: { reverb: 0.55, lowpass: 8000 },
    bass: { reverb: 0.07, lowpass: 1500 },
    drums: { reverb: 0.18, lowpass: 9000 },
    vocal: { reverb: 0.42, lowpass: 9500 },
  },

  /**
   * What a darbuka player does at the end of a phrase, which is not a tom roll.
   *
   * `rim` leads because its own description — *"Latin: rim and percussion, a
   * clave-ish figure"* — is the only shape in the palette written on voices this
   * genre's kit actually has. `tom-roll` and `snare-toms` are absent rather than
   * merely weighted down: on a bank with toms they would find them and announce
   * a dance band, and on a bank without them they would substitute onto the
   * snare and announce a different one.
   *
   * `drop` is here at a real weight and is the genre's own: the drum stopping
   * dead for half a bar so the singer is alone is a gesture this repertoire uses
   * constantly and most of the others use once a record.
   */
  fills: [
    ['rim', 6], ['lead-in', 4], ['drop', 3], ['snare-roll', 1],
  ],

  // Two and a half to four and a half minutes, which is a compromise and worth
  // naming as one. The form this genre is famous for runs forty minutes and
  // consists of one line of text; what fits in a rotation is the radio edit the
  // same singers were also making, which is a real object rather than a
  // concession.
  duration: [150, 265],

  /**
   * The maqam rule.
   *
   * Two arguments read and one pointedly not taken. There is no search, no
   * nearest-mode fallback and no bending: the piece is in one maqam, the maqam
   * is rooted on the tonic, and the chord underneath has no vote. See the header
   * for why the tonic is what chooses it and for the three separate reasons a
   * maqam might be missing from the tables above.
   *
   * The fallbacks are Hijaz in major and Nahawand in minor — the two the
   * tradition would name first — and they are unreachable from a generated song,
   * because `keys` above only ever draws the eight pitch classes the tables
   * carry. A forced key from the audition page is the one path to them.
   */
  scaleForChord: (tonic, mode) => makeScale(
    tonic,
    mode === 'minor'
      ? MINOR_MAQAM[tonic] ?? 'harmonicMinor'
      : MAJOR_MAQAM[tonic] ?? 'phrygianDominant',
  ),

  /** The courtyard, the tarboosh and the shouting. See `staging.ts`. */
  staging: STAGING,
};
