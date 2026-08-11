/**
 * House and techno, 1986 to 2007.
 *
 * Chicago, Detroit, the Belgian year, the warehouses, the rave, the superclub
 * and the small dark room at the end of it. The nineteenth and last genre, and
 * the two that were left were left for a reason: both of them needed a mechanism
 * that did not exist until this month.
 *
 * # Where the line falls, and it has to be said first
 *
 * Two genres in this project already contain four-on-the-floor electronic dance
 * music with a sequenced bass line under it. `synth/cosmic` is described in its
 * own file as "four-on-the-floor under a 16th sequence that drifts against it,
 * euphoric, instrumental"; `pop` holds `hinrg`, `dancepop` and `electropop`, and
 * `pop/eras.ts` names its last era `sidechain` after the production technique
 * that is most of what a house record sounds like. If this genre is a fourth
 * flavour of either, it should not exist, and saying so in the file is better
 * than letting somebody discover it later.
 *
 * ## Against synth: composed music against loop music
 *
 * **Synth is a music of pieces. This is a music of loops.** That is the whole
 * claim and it is testable rather than atmospheric, because both halves of it
 * show up in fields that already exist:
 *
 * | | synth | house |
 * |---|---|---|
 * | `keyChangeChance` | 0.1–0.3, "the final lift is a signature move" | **0 in all four eras** |
 * | `relativeMajorChorus` | 0.15–0.5 | **0 in all twenty-four styles** |
 * | `SoloProfile` | present; "the lead break is the climax" | **absent, and no `solo` section in any form** |
 * | `duration` | 150–300 s | **360–540 s** |
 * | forms | a chorus that arrives, a bridge that departs | a sequence of things entering and leaving |
 * | `Style.drops` | refused in so many words | **seventeen of twenty-four opt in** |
 *
 * The first three rows are one fact stated three ways: a synth record *goes
 * somewhere and arrives*, and a house record is a stable object somebody else is
 * going to play another stable object over. `synth/index.ts` says its genre is
 * "not a fourth answer to the chord-scale question" and earns its place on the
 * table above; this earns its place on the same kind of table pointed the other
 * way.
 *
 * The bottom row is the sharpest. `docs/engine-gaps.md` §7 records that all six
 * synth styles were *feasible* for `DROPS.breakdown` at 30 of 30 and that the
 * genre refused, in these words: **"four bars of drum machine alone is a
 * breakdown, which is a later decade's gesture."** That refusal names this genre
 * without knowing it. The gesture synth declined is the gesture eleven styles
 * here are built out of, and one of them — `trance` — has almost nothing else.
 *
 * **Where it comes out weaker than expected**: `detroit` and `synth/cosmic` are
 * genuinely close. Both are four-on-the-floor with a sixteenth figure and a
 * melancholy modal top line played on a polysynth, and if you removed the era
 * tables you would have trouble telling one render from the other in eight bars.
 * The distance is real but it is in the *form and the ending* rather than in the
 * bar — `cosmic` lifts a tone for the last statement and this fades under the
 * next record — which is a thinner separation than the one between, say, `acid`
 * and anything in synth. Named here rather than discovered later.
 *
 * ## Against pop: who the record is for
 *
 * Easier, and the fields are blunter about it. Pop's three dance styles all have
 * **a sung chorus that arrives**, and `pop/index.ts` builds its whole formal case
 * on that: every one of its four forms has three choruses, because three is the
 * minimum at which `planExits` can strip the last one. Twenty-one of the styles
 * here have no singer at all, and the three that do — `garage`, `ukgarage`,
 * `speedgarage` — treat the voice as a *sample*, which `vocals.ts` argues at
 * length. `hinrg` is a chorus shouted over a track; `garage` is a track built
 * under a four-bar phrase somebody else sang in a different studio in a different
 * key.
 *
 * The second half is the format. A pop single is a finished object aimed at a
 * radio programmer and it ends. Every record in this genre is aimed at a **DJ**,
 * is between six and nine minutes long, begins with thirty-two bars of drums that
 * exist so somebody can mix into them, and `ending: 'fade'` because somebody else
 * decides when it stops. That is not a production preference, it is what the
 * twelve-inch is *for*, and it is why `keyChangeChance` is 0: a record that lifts
 * a semitone cannot be mixed out of, because the record coming in was pitched to
 * match the one that was playing.
 *
 * **Where it comes out weaker than expected**: `pop/dancepop` is a house record.
 * Its own header says four on the floor, a held supersaw, a sub bass, a hook
 * played rather than sung, and `requireLayers: ['pad']`, which is exactly this
 * genre's `trance` with a singer added. The honest distinction is the singer and
 * the three-minute length, and that is a thinner line than the one against synth.
 * It is also the right way round historically — dance pop is house that got a
 * vocal and a radio edit — so the overlap is a fact about the music rather than a
 * fault in the tables.
 *
 * # The load-bearing decision: `scaleForChord`
 *
 * Five answers existed. Iskelmä follows the *key*; jazz follows the *chord*;
 * ambient follows the *drone*; synth follows the key without a leading tone; funk
 * and hip-hop use a **fixed tonic scale that never reads the chord**; rnb tests
 * whether the chord has left the key.
 *
 * This is funk's, and it arrives at funk's answer from a different fact.
 *
 *     minor  →  minorPentatonic     five notes, and no sixth to argue about
 *     major  →  mixolydian          the flat seventh and the fourth
 *
 * Funk's reason is that **the harmony does not move**: a JB side is one chord for
 * four minutes and there is nothing for a chord-relative rule to re-orient onto.
 * Nineteen of the twenty-four tables in `styles.ts` open with a verse progression
 * that is one numeral eight times, so that reason applies here too — but it is
 * not the load-bearing one, because five of these tables *do* move, and `deep`
 * and `garage` move quite a lot.
 *
 * The load-bearing reason is the **loop**. What plays the tune in this music is a
 * two-bar stab, a sampled phrase or a sixteen-step sequence, and the defining
 * property of all three is that they are *the same object every time round*. A
 * line that re-oriented onto each chord would be a line that changed when the
 * harmony changed, which is precisely what a loop cannot do — the whole trick of
 * a house record is that one figure fits `i` this time and `♭VI` the next. The
 * pentatonic is what makes that literally true rather than approximately:
 * **it omits the second and the sixth, which are exactly the two degrees the
 * aeolian and dorian readings of this repertoire disagree about**. A five-note
 * figure over `i7 – iv7` and over `i – ♭VI – ♭VII` is in the scale in every bar of
 * both, with no bent note and no compromise. That is not a simplification of a
 * seven-note answer; it is the reason the idiom sounds the way it does over
 * harmony that will not settle.
 *
 * The major half is mixolydian for funk's reason unchanged: the major-key corner
 * here is the disco-sampling corner — `disco`, `frenchtouch`, half of `piano` —
 * and a looped 1979 twelve-inch is `I7 – IV7` with the fourth and the sixth in
 * the line, which is a horn chart and needs seven notes.
 *
 * ## The one style that departs, and why exactly one
 *
 * `deep`. Its changes are the content — a `min9` on the tonic, a `dom7sus4` on
 * the ♭VII, a chorus that goes round the circle — and those are colours the player
 * is *aiming at* rather than a bed the riff is dragged over. `Style.scaleForChord`
 * is used twice in the project before this: jazz follows the chord and `blues`
 * overrides to a tonic scale; funk follows the tonic and `jazzfunk` overrides to
 * the chord. This is the third, and it is funk's direction exactly. One field,
 * three genres, one style each — which is what the field is for, and widening it
 * to the four or five styles here that could half-argue for it would turn a claim
 * into a setting.
 *
 * **`garage` was the closest call and it does not get one.** Its chords are as
 * rich as `deep`'s. But its melodic material is a *gospel* line, and a gospel
 * line over changing sevenths is pentatonic-with-passing-notes in the first place
 * — the melisma runs through the degrees rather than resting on them, which is
 * what `melody.ornament: 0.26` and the vocal profile's high `spread` are for. The
 * chord-following rule would have made it a jazz singer.
 *
 * # `drops` — this genre is `breakdown`'s intended author
 *
 * `docs/engine-gaps.md` §8 reserved the shape in as many words: *"`breakdown`
 * still has no honest author… its witness is `pad` and it removes `drums` and
 * `bass`, so it needs a dance record with a wash, on a form long enough for three
 * four-bar phrases. The catalogue's dance records are all built on eight-bar
 * sections: 0 of 30 at four bars across all 24 pop styles… So it waits for the
 * first house style, which is what it was shaped for."*
 *
 * **So the first thing checked here was the form length, before a style was
 * written.** All four forms below are on sixteen- and thirty-two-bar sections,
 * which is what this music actually is; `planDrop` needs `3 × bars`, so four-bar
 * drops clear the floor with room to spare and `dropBars` is not needed.
 *
 * Measured over 200 songs per style, twice: once with the style's real palette,
 * and once with `none` stripped out of it so that every song draws a shape and
 * the placement rule is what is being measured.
 *
 * ```
 *                shape        real palette      every song draws
 * trance         breakdown      147/200            200/200
 * progressive    breakdown      103/200            198/200
 * hardhouse      breakdown       91/200            197/200
 * piano          breakdown       88/200            193/200
 * disco          breakdown       81/200            190/200
 * frenchtouch    breakdown       81/200            189/200
 * ukgarage       breakdown       71/200            195/200
 * garage         breakdown       68/200            187/200
 * speedgarage    breakdown       68/200            193/200
 * ambienthouse   breakdown       60/200            200/200
 * detroit        breakdown       51/200            194/200
 * dubtechno      dub            132/200            200/200
 * acid           dub             82/200            200/200
 * hardgroove     dub             67/200            200/200
 * minimal        dub             58/200            200/200
 * techhouse      dub             56/200            200/200
 * chicago        dub             43/200            200/200
 * ```
 *
 * **`dub` places 200 of 200 in every style that names it and `breakdown` places
 * 187 to 200, and the gap between those two columns is the whole finding.** It is
 * not the form — the sections are long enough in every one of the 3400 songs. It
 * is the *witness*. `DROPS.dub` is heard against `drums`, which is in every
 * section of every song this engine builds; `DROPS.breakdown` is heard against
 * `pad`, and `layersFor` lets a restrained mood delete one colour layer from a
 * section kind, taking brass first, then counter, then the pad. On the six to
 * thirteen songs in two hundred where the chorus kind loses its pad, no chorus is
 * eligible and no drop is placed. The two styles that reach 200/200 on
 * `breakdown` are exactly the two that write `requireLayers: ['pad']`, which is
 * the mechanism working rather than a coincidence.
 *
 * Across the whole genre with nothing forced, **28.2% of 500 songs carry a drop**.
 * That is the highest rate in the catalogue and it should be, because this is the
 * one genre where the gesture is the architecture rather than a device — reggae's
 * `dub` measured 36.5% as a single style, and this is seventeen styles averaged
 * against seven that decline.
 *
 * Eleven styles name `breakdown` and six name `dub`. Two of the six are worth
 * saying out loud: `hardgroove` excludes the pad outright, so `breakdown` would
 * refuse to place and `dub` is the only honest opt-in — the shape's own refusal
 * choosing correctly rather than a table being tuned around it — and `acid` is
 * the case where `dub` removes the thing the record is *made of*, which is
 * exactly the edit the 303's mute button exists for.
 *
 * **Seven styles decline altogether, and the refusals are the more useful
 * record.** `ghetto` has no pad and no bass part worth removing — its 808 kick
 * *is* the bass — so both shapes would refuse and the table would look like it
 * worked, which is the failure mode this project keeps finding. `bleep` excludes
 * the pad for a frequency reason and its sub is the entire record. `deep` is the
 * interesting one: it is perfectly feasible and it refuses on tempo and
 * temperament — a deep house record at 118 BPM does not stop, it is the style
 * whose whole proposition is that nothing interrupts, and a breakdown in it would
 * be a louder record's gesture borrowed. `jackin`, `tribal`, `microhouse` and
 * `newbeat` refuse on the same ground at higher volume: each is a style whose
 * thesis is one figure repeated without interruption, and `hiphop/bounce` is
 * already in §7's refusal list for exactly that reason.
 *
 * # The build, which is not built — and what happens instead
 *
 * A **build** is a ramp arriving at a drop, and it is the single most
 * characteristic event in this repertoire after the drop itself. It is not
 * available, and the reason is concrete rather than a shortfall of effort:
 * `generate/tempo.ts` runs before the form exists, because `buildForm` divides by
 * the tempo to fit `Genre.duration`, while `planDrop` runs four hundred lines
 * later. A build has to arrive *at* the drop and the two passes cannot see each
 * other. `docs/engine-gaps.md` §6 says so.
 *
 * **This genre declines `tempoRamp` altogether, and would decline it even if the
 * build worked.** That is the part worth stating, because it is not a workaround.
 * A record in this idiom is beat-matched: somebody is going to run another record
 * against it at a fixed tempo for thirty-two bars, and a record whose tempo moves
 * cannot be mixed. Every other opt-in to that field is a *performance* — a
 * qawwāli party accelerating, a pelimanni band pushing — and there is no
 * performance here. So no style names the field, no draw is taken, and the genre
 * is bit-for-bit what it would be if the mechanism did not exist.
 *
 * What is used instead is the **filter**, and it is used the way `synth` uses it:
 * `Genre.filter` below has `chorus` at 1.0 and `bridge` at 0.28 — a bridge darker
 * than an intro, which no other genre in the project asks for — so the section
 * before a peak closes down and the peak opens. Twelve styles name
 * `filter: { shape: 'ramp' }` and the sweep across sixteen or thirty-two bars is
 * what the tempo would have been doing. It is not the same gesture and it is the
 * nearest honest one: a filter opening is a *build in brightness* where the record
 * has a build in speed, and the two are used interchangeably by producers anyway.
 *
 * A second-order loss worth naming: the audition cannot ramp at all, and a
 * ramping song says so in its own emitted source. Since nothing here ramps, that
 * banner never appears in this genre — which is one small mercy of the refusal.
 *
 * # Sidechain, which is sayable now
 *
 * `docs/engine-gaps.md` §3.17 used to read *"`Effects` has no envelope follower,
 * so sidechain compression is unsayable… Nothing in `Effects` relates two layers
 * at all; every field describes one in isolation."* Pop named an era after the
 * gap and **this is the genre the gap was actually about** — the pumping duck
 * under a four-on-the-floor kick is most of what this music sounds like from
 * about 1994 onward. `Effects.duck` is the field, in decibels of gain reduction
 * under the kick, and three styles here take it.
 *
 * **What was done instead is still there, and it is still right.** Sidechain
 * produces a chord that is quiet immediately after a kick and loudest
 * immediately before the next one, and every *struck* comp figure in the house
 * half of `styles.ts` writes that shape with `CompHit.vel` —
 * `pumped-sixteenths`, `chank-sixteenths`, `pumped-eighths`, `gated-chords` and
 * the offbeat stabs, all of which rise across each beat and reset on the kick.
 * Those are not ducked, because saying the same thing in two units is how the
 * double-swing bug happened.
 *
 * **The paragraph this replaces was wrong about its own tables in one place,
 * and that is worth keeping.** It said the workaround *"gets the comp and cannot
 * get the pad"*. It gets the comp where the comp is struck. Where it is held it
 * gets nothing at all, and the two heaviest comp figures in the two styles this
 * section names are exactly that: `held-supersaw` in `trance` at weight 6, two
 * onsets a bar at 0.66 and 0.64, and `long-chords` in `progressive` at weight 6,
 * 0.6 and 0.58. Flat. So on more than half the songs of those styles the
 * mitigation everybody believed was covering the comp had never applied to it —
 * found by reading the table rather than the note, which is §7's own lesson
 * about briefs.
 *
 * **Three adopt and twenty-one do not.** `trance` takes 10 dB on the pad, the
 * deepest number in the project, because a trance record's pulse *is* the wash
 * opening and closing; `progressive` takes 9; `frenchtouch` takes 8 on the pad
 * alone, because its filtered disco loop is already the pulse. All three are
 * four on the floor in every drum figure they own, so the recovery is the
 * default three quarters of a beat.
 *
 * The refusals come in three shapes. **The warehouse half is gated by the
 * calendar**: `DUCK_FROM` is 1993 and `chicago`, `jackin`, `acid`, `piano`,
 * `garage`, `ghetto` and `disco` are mostly drawn in an era whose year is 1988,
 * where the kick and the pad were on the same piece of tape. **Six have no
 * layer that holds** — `minimal`, `microhouse`, `techhouse`, `hardgroove`,
 * `bleep` and `newbeat` are built out of short events, and a duck on a part
 * with nothing sustaining is a compressor working on silence. And **`dubtechno`
 * refuses on the strongest grounds of the three**: the space between its chords
 * is already owned, by a delay with 0.62 feedback that its own `effects` table
 * calls the piece — *"one chord, and everything that happens to it happens in
 * the delay."* A duck would be a second thing shaping the same gap, and the
 * audition's duck runs on the orbit output, *after* that delay, so it would
 * chop the echoes the style exists for.
 *
 * # `Chart.exits`, which is half of what an arrangement here is
 *
 * `generate/chart.ts` records that fourteen genres were written against a chart
 * that only builds, and that nobody reported the absence because "a missing
 * direction does not present itself as a wall". In this genre it would have been
 * a wall. A progressive record's central event is that the thing you have been
 * listening to for four minutes *stops* and what is left underneath turns out to
 * have been the record; a Chicago record takes the organ off for the last
 * ninety seconds and lets the machine finish alone.
 *
 * The engine's `STRIPS` is 0.3 and is not a genre's to move, so what this genre
 * does is *avoid getting in its way*: only two styles name `requireLayers` —
 * `trance`, which needs the drop's witness guaranteed, and `ambienthouse`, whose
 * wash is the style — and both accept the trade `pop/dancepop` recorded, that a
 * required layer can never be taken away. Everything else leaves all three colour
 * layers exitable.
 *
 * **Measured over 500 songs across the genre, 24.6% come out with a layer present
 * in the first statement of a section kind and absent from the last.** That is
 * essentially the catalogue mean of 24.4%, and the honest reading is that this
 * genre did *not* move the number and could not have: `STRIPS` is an engine
 * constant, the placement is derived from the form rather than drawn, and the only
 * lever a genre has is whether it blocks the gesture. Two styles block it and
 * twenty-two do not, which is as close to the ceiling as a genre gets. What this
 * genre contributes is not a higher rate but a repertoire where the 24.6% is the
 * *point* rather than a colour going missing from the last chorus — and, taken
 * with the 28.2% drop rate, **45.6% of songs here lose something they had**,
 * either for four bars or for good. The two mechanisms are the two halves of what
 * a house arrangement is, and no other genre in the catalogue has both of them
 * switched on at once.
 *
 * # What the engine could not express
 *
 * Five things, four already on the list and one new — and the second of them is
 * now written rather than missing. It is kept here with an account of what
 * adopting it cost and what it did not reach, because a list that quietly
 * deletes its closed entries stops being a record of anything, and because §7 of
 * `docs/engine-gaps.md` is about the opposite failure: a field built for a genre
 * and never adopted by it, which leaves the compromise in the music while the
 * document says it is fixed.
 *
 *  1. **Sidechain** (§3.17), above. The pad cannot pump.
 *  2. **A bass note can slide, and both styles that asked for it now do**
 *     (§3.16 — closed here). `BassHit.glide` was built on five reports across
 *     three genres and two of them came from this file. `acid` takes three
 *     slides across two of its three 303 figures at `glideTime: 0.25`, which is
 *     the machine's own 60 ms measured against a sixteenth at 120–132 BPM;
 *     `speedgarage`'s `wobble` drops to the fifth below and lifts to the ♭3 on
 *     one note each at 0.5, which puts the arrival on the exact sixteenth the
 *     struck note it replaced stood on. **Adopting it was a deletion**: five
 *     struck notes are gone from the genre and their pitches are now where the
 *     notes that remain are travelling to. Measured over 200 songs per style on
 *     two independent seed sets, which agree to a tenth of a point: **12.4–12.6%
 *     of `acid`'s bass onsets carry a bend and 18.1–18.2% of `speedgarage`'s**,
 *     1.97% across the genre — which is what two adopting styles out of
 *     twenty-four looks like from the outside. Per song rather than per onset it
 *     is a pattern draw: 131 of 200 `acid` songs and 88 of 200 `speedgarage`
 *     songs carry at least one, and those are the weights of the figures that
 *     have a slide in them (11 of 16, and 7 of 16) rather than a rate that needs
 *     explaining.
 *
 *     Three things the adoption did *not* get, none of them this field's fault.
 *     The 303 slides at the **step boundary** and this travels from the onset,
 *     so the destination arrives early — argued and refused in `NoteBend`, and
 *     priced in `acid`'s own table. `303-sparse` and `sub-and-skank` hold their
 *     source pitch and drop at the far end, which is the same refusal from the
 *     other side, so both keep their second attack. And `speedgarage`'s wobble
 *     *proper* was never this gap at all: a filter moving under one held pitch
 *     is §3.5, a wah wanting to move faster than a section, and one sentence in
 *     that style's header used to carry both halves — which is how the fixable
 *     half stayed broken for as long as it did.
 *
 *     **§3.5 has since closed and this is the half it left open**, which is
 *     worth reading before anybody adopts it here. `Effects.filterEnv` moves the
 *     filter per *note*, keyed off the onset — a Mu-Tron, and funk's gesture. A
 *     wobble is keyed off nothing: it is a free-running LFO under one held pitch,
 *     which is the shape §6 measured and refused, because superdough's filter LFO
 *     sums onto the cutoff linearly in hertz with no anchor, so it brightens past
 *     the era and spends 70% of every cycle in the top half of its travel. The
 *     controls exist and are live; what is missing is a shape worth shipping.
 *     This style should ask again when somebody has a figure for one.
 *  3. **`swing` delays the eighth and three styles here shuffle the sixteenth**
 *     (§3.18). `ukgarage` is the worst case in the project: 2-step *is* a
 *     sixteenth shuffle, and 0.3 on the eighth produces a lollop where the record
 *     has a skip. `microhouse` and `garage` are the other two.
 *  4. **`DrumPattern.cycle` is one number for the whole kit** (§3.6). `minimal`
 *     wants a click on a seven — prime against sixteen, so it does not come home
 *     for seven bars — *with the kick still on the floor*, and a `cycle: 7`
 *     pattern drifts the bass drum with everything else. A techno record whose
 *     kick walks is a different genre. Metal found this from the other side (djent
 *     is hands on the bar and feet on a seven) and carried its seven on the guitar
 *     instead; this carries it on the bass, at 14, and the comment sits in the
 *     pattern that was deleted. Second independent finder.
 *  5. **A vocal cannot have its own cycle.** New, and this genre is where it
 *     shows. The `vocal` layer is defined as the melody doubled — `drop.ts` says
 *     it "has no onset the melody did not have" — and a house vocal is a two-bar
 *     sampled phrase looped against an eight-bar chord cycle, deliberately out of
 *     phase with the harmony under it. `CompPattern.cycle` is exactly the
 *     mechanism, and it exists on the comp, the bass, the counter and the kit and
 *     not on the voice. See `vocals.ts`.
 *
 * And one thing the *stage* could not express, which is in `staging.ts`: there is
 * nobody on it.
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
 * Four, and the first thing to say about all of them is that **the sections are
 * sixteen and thirty-two bars long**, which nothing else in this project does.
 * That is not length for its own sake and it is not merely period-accurate: it is
 * the precondition for the whole feature set this genre was waiting on.
 * `planDrop` needs three phrases inside one section — a phrase of band, the drop,
 * a phrase of band back — so a four-bar `breakdown` wants twelve bars minimum, and
 * `docs/engine-gaps.md` §8 records that **every dance record in the catalogue is
 * on eight-bar sections and places 0 of 30**. A thirty-two-bar chorus places one
 * with twenty bars to spare.
 *
 * The section *kinds* are the compromise, and it is worth being honest about it.
 * `SectionKind` is `intro | verse | chorus | bridge | solo | outro`, which is a
 * verse/chorus vocabulary, and this music does not have verses or choruses. What
 * it has is a groove, a peak, a breakdown and an outro that exists so the next
 * record can be mixed in. The mapping below is the closest available and it is
 * load-bearing rather than cosmetic: `bridge` is **the breakdown**, which is why
 * `Genre.filter` puts it at 0.28 — darker than the intro, and the only genre here
 * that asks for that — and why `layersFor`'s decision that a bridge carries no
 * melody happens to be exactly right.
 *
 * No `solo` section in any form, because there is no `SoloProfile` and there are
 * no solos. Nobody in this music takes a chorus.
 *
 * The long **intro and outro are the format**. Thirty-two bars of drums and bass
 * at each end is not an over-long introduction, it is the part of the record the
 * DJ actually uses — the mix-in and the mix-out — and a house twelve-inch that
 * started on the hook would be unusable.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  // The twelve-inch. Two peaks, a breakdown between them, and thirty-two bars at
  // each end for somebody else to work with.
  [[
    { kind: 'intro', bars: 32 },
    { kind: 'verse', bars: 32 }, { kind: 'chorus', bars: 32 },
    { kind: 'bridge', bars: 16 }, { kind: 'chorus', bars: 32 },
    { kind: 'verse', bars: 32 }, { kind: 'chorus', bars: 32 },
    { kind: 'outro', bars: 32 },
  ], 6],
  // The tool. Barely a form, which is the point: four statements of the groove
  // with one thing taken out in the middle. What `hardgroove`, `minimal` and
  // `tribal` actually are.
  [[
    { kind: 'intro', bars: 32 },
    { kind: 'verse', bars: 32 }, { kind: 'verse', bars: 32 },
    { kind: 'bridge', bars: 16 },
    { kind: 'verse', bars: 32 }, { kind: 'verse', bars: 32 },
    { kind: 'outro', bars: 32 },
  ], 5],
  // The vocal record. Shorter intro, because a garage twelve-inch has a singer
  // on it and the singer is what the record is sold on.
  [[
    { kind: 'intro', bars: 16 },
    { kind: 'verse', bars: 32 }, { kind: 'chorus', bars: 32 },
    { kind: 'verse', bars: 32 }, { kind: 'chorus', bars: 32 },
    { kind: 'bridge', bars: 16 }, { kind: 'chorus', bars: 32 },
    { kind: 'outro', bars: 16 },
  ], 4],
  // The breakdown record. A thirty-two-bar bridge, which is the longest single
  // section in the project and is the two minutes in the middle of a trance
  // record where the kick is not playing.
  [[
    { kind: 'intro', bars: 32 },
    { kind: 'verse', bars: 32 }, { kind: 'chorus', bars: 32 },
    { kind: 'bridge', bars: 32 }, { kind: 'chorus', bars: 32 },
    { kind: 'chorus', bars: 32 }, { kind: 'outro', bars: 32 },
  ], 4],
];

export const house: Genre = {
  /**
   * Moot rather than false, and worth saying which.
   *
   * `preparedModulation` decides whether a key change is announced by the
   * dominant of the key it is going to. `keyChangeChance` is 0 in all four eras
   * here, so there is no key change to prepare and this field is never consulted.
   * It is set to `false` anyway because the answer, if it were ever asked, would
   * be that an applied dominant in front of a lifted chorus is the single most
   * un-idiomatic bar this generator could write for this music.
   */
  preparedModulation: false,
  id: 'house',
  label: 'House',
  description:
    'Loop music for a room: Chicago, Detroit, acid, garage, trance and minimal — four on the floor, 1986 to 2007.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,

  /**
   * Where this music sits, and it is chosen for the bottom octave.
   *
   * Synth picks its keys for register too and says so, on the grounds that a
   * sequencer figure in D or A minor sits with its lowest note around 73–110 Hz.
   * This is the same argument pushed a fourth lower and made stricter, because
   * here the bottom octave is not a floor under the music, it is the music: a
   * house record is played on a system whose sub cabinets do their work between
   * 40 and 90 Hz, and the root of the key decides whether the record has any
   * bottom on it at all.
   *
   * A, F and G minor lead. F minor puts the sub's fundamental at 87 Hz and its
   * octave below at 44; A minor at 110 and 55. Below F the note is under most
   * rooms and above B the record has no weight. That band is four or five keys
   * wide, and it is most of why this repertoire sounds like it is in the same
   * key all night — it very nearly is.
   */
  keys: {
    minor: [[9, 6], [5, 6], [7, 5], [2, 4], [0, 4], [10, 3], [4, 2]],
    major: [[0, 5], [5, 4], [7, 4], [10, 3], [2, 3], [9, 2]],
  },

  /**
   * It fades, and here the field means something it does not mean anywhere else.
   *
   * Ambient fades because it does not finish, it stops being there. Synth fades
   * because the machine was running before the record started. **This fades
   * because the ending is not the producer's to write.** A twelve-inch ends in
   * thirty-two bars of drums and a filter closing, and what actually happens is
   * that somebody in a booth brings the next record up over the top of it — so
   * the last thing on the record is deliberately the least eventful thing on it.
   * A `button` here would be a band landing a chord together, which requires a
   * band, an ensemble decision and a room to land in, and there is none of that.
   */
  ending: 'fade',

  /**
   * Nobody counts it in, and there is nobody to count.
   *
   * Synth argues this as "a sequencer is already running when the lights go up".
   * Here it is blunter: the count-in is a staging fact about musicians starting
   * together, and this record was assembled one part at a time by one person over
   * three weeks. Four clicks in front of it would be four clicks in front of
   * nothing.
   */
  countIn: false,

  /**
   * `light`, matching funk and jazz, and for the reason the rule overrides below
   * spell out at length: the repetition and the flat-seventh vocabulary the rule
   * table exists to police are the material here rather than defects in it. The
   * three styles that want more constraint than this say so themselves — `deep`
   * takes `standard` — and the four that want less take `free`.
   */
  defaultStrictness: 'light',

  /**
   * **`earworm`, and this is the only genre in the project whose default is the
   * top of the scale.**
   *
   * `HookId` runs `through | loose | standard | catchy | earworm`, and everywhere
   * else `earworm` is a per-style escalation for the one or two entries whose
   * whole proposition is the same four bars again — synth's `machine` and
   * `stalker`, six of funk's twenty-two. Here it is the floor. A house record is
   * one loop for six minutes and the sections differ in *who is playing*, not in
   * what they are playing, which is precisely what this setting says. Seven
   * styles step back to `catchy` and every one of them is a style with a person
   * in it: `deep`, `garage`, `ukgarage`, `progressive`, `microhouse`, `detroit`
   * and `ambienthouse` are the seven places in this file where somebody either
   * sang, played the chords or arranged the record, and a music with a person in
   * it can afford a section that is not identical to the last one.
   */
  defaultHook: 'earworm',

  /**
   * No `solo`, and therefore no `soloBacking`.
   *
   * `Genre.solo`'s own docstring says that absence "is a statement about the music
   * rather than an omission", and this is the second genre after ambient to make
   * it. Nobody in this repertoire takes a chorus. There is no instrumentalist to
   * take one, the arrangement has no place to put one, and the thing that happens
   * instead — the record thins out and comes back — is `Chart.exits` and
   * `Style.drops`, both of which are the arrangement rather than a player.
   *
   * That also removes the `soloAt` blocker from `planDrop` entirely, which is a
   * small mechanical bonus: every section in this genre is eligible for a drop as
   * far as that rule is concerned.
   */

  /**
   * **No `comping` profile, and the absence is the statement.**
   *
   * `Genre.comping` is how far the chordal player departs from the figure in front
   * of them, and it is absent by default, meaning the figure is played as written.
   * Jazz sets 0.18/0.3/0.25 because a comper who plays the same bar twice is
   * audible as a machine; funk sets 0.04/0.14/0.05 and inverts the argument,
   * because the figure is the song.
   *
   * This genre takes the argument one step further and stops. **The figure is
   * played as written because a sequencer plays the figure as written** — not
   * approximately, not with a hand that occasionally does not connect, but
   * identically, to the millisecond, four hundred times. Funk's 0.04 `rest` is
   * defended as "the bar where the guitar is not there is how you know it was a
   * person", and that sentence is exactly what must not be true here.
   *
   * The three styles with somebody actually at a keyboard get their variation from
   * `Style.vary` instead, which is a different claim: `deep` at 0.25 and
   * `microhouse` at 0.35 say the figure is *played differently at phrase ends*,
   * which is a decision, rather than that it is unreliable.
   */

  /**
   * Which devices this arrangement is built from, and two of them are zeroed.
   *
   * **`trade` at 0.** Handing a phrase from one player to another is a
   * conversation between two people who can hear each other, and there is exactly
   * one person in this music and they are not playing anything in real time. Synth
   * keeps it at 1 on the grounds that the answer "comes back on schedule because
   * it was punched in"; that is a fair description of an overdub session and a
   * poor one of a man alone with a sampler, so this is the first genre to strike
   * it outright.
   *
   * `tutti` is high because the whole record catching one figure and stopping is
   * the loudest thing that happens in a house arrangement, and it is the gesture
   * the seam `shot` exists for.
   *
   * ## `swell` above `riff`, which was the opposite of the first draft
   *
   * The first version of this line read `riff: 8, swell: 0`, on the argument that
   * the *stab* is this genre's central arrangement object and that a horn pad
   * rising under a held melody note is a ballad device performed by lungs. Both
   * halves were wrong, and measurement found it rather than reasoning.
   *
   * **The stab is a chord, and a chord is the comp layer.** What the brass layer
   * models is a horn section punctuating *around a tune*, and most of this
   * repertoire has no object shaped like one — so twelve of the twenty-four styles
   * now write `excludeLayers: ['brass']`, which cut the genre's brass output from
   * 3169 notes over 50 seeds to 832. That is the honest population, and it is
   * disproportionately the *held* kind, because the styles that only ever stab are
   * exactly the ones that were excluded: what survives is `trance`'s supersaw held
   * for eight bars, `hardhouse`'s hoover, `frenchtouch`'s filtered brass and
   * `progressive`'s swell.
   *
   * **And `swell` in this engine is a held chord on the brass layer**, not a pair
   * of lungs — a supersaw held under a breakdown is precisely that object. At 0 it
   * produced 80 sustained notes in 3169, or **2.5%**, against a catalogue running
   * 22–29% in the sung genres and 50% in classical; at 7 with the exclusions it is
   * **135 in 832, 16.2%**, which reads as a genre that stabs five times for every
   * chord it holds. That is what this music is.
   *
   * The reason to chase it at all is that the shared check `brass sustains as well
   * as stabs` aggregates every genre into one ratio, and `docs/engine-gaps.md` §5
   * already names it as one of two checks "measuring the engine, not the genres",
   * green at 19–20% against a >20% bar "on the same afternoon in both directions".
   * A genre with a thousand short brass notes in it moves that number for
   * everybody, which is worth knowing about rather than shrugging at.
   *
   * ## Nothing here declares `Style.harmony`, and `harmony: 2` under `unison: 3`
   * is the short version
   *
   * The standing property beside the device says *this music is two voices* for a
   * whole statement rather than for one phrase of one repeat chorus. No style in
   * this folder declares one and neither does this genre. The row is the
   * second-lowest non-zero in the catalogue, level with ambient's and dnb's —
   * arabic writes 1, indian 0, synth omits it, rnb and metal are at 8 — and 2 of
   * 23 by weight is the size of the thing a house record actually does with a
   * second line.
   *
   * **Where this music sounds harmonised it is one object rather than two
   * players**, and the `parallel-perfects` override below already argues it for a
   * different purpose: a sampled orchestra hit, a hoover and a detuned supersaw
   * stab are *single objects that happen to contain several pitches, and they are
   * supposed to fuse*. A declaration is the opposite claim — its checks demand no
   * unison, no octave and no crossing, two parts that stay audibly two — and the
   * several pitches here belong to the comp, which is why `mix` puts that layer at
   * 0.6 under a melody at 0.86.
   *
   * **What these tables do thicken a line with is the octave, which the field
   * cannot name.** `piano`'s own description is *an octave piano vamp* and its
   * heaviest bass figure is `octave-piano-left`; `disco`'s is `disco-octaves`. An
   * octave inside a declared harmony line is not the gesture, it is the fault
   * `undoubleAgainst` repairs — so the one doubling interval in this file is the
   * one interval a `HarmonyProfile` is forbidden to say, and `unison: 3` above
   * `harmony: 2` is that preference already written down.
   *
   * **And the lead is too still for a parallel line to read as a second part.**
   * `voice.archetypes` below spends 58% of its draw on `chant` and `long-note`,
   * the twenty-four styles derive 1.00 to 3.63 onsets a bar, and `minimal` weights
   * `[16]` at 8 — one note, held, for the bar. A fixed interval hung on one
   * repeated note over a kick for a thirty-two-bar statement is a dyad rather than
   * a duet, and a dyad is a chord, which is the layer that already has one.
   *
   * The two available carriers then fail on their own ground:
   *
   *  - **`on: 'counter'`** lands on the layer this genre defines as *not* the
   *    tune's shadow. `acid` and `trance` both write `counterMode: 'ostinato'` for
   *    "a second line running continuously alongside the first, not answering it",
   *    `trade` is 0 above — the first strike in the project — and the `voice` block
   *    gives the reason: nobody is listening for a reply. A part in thirds on the
   *    lead's own onsets would replace the only second-line idea in the file with
   *    a transposed copy of the first.
   *  - **`on: 'vocal'`** has a real candidate in `garage`, whose header calls it
   *    the one style here where the vocal is the record, and it fails on *phase*
   *    rather than on interval. Item 5 of the header is this genre's own report
   *    about its second voice and what it asks for is a cycle, not a third: the
   *    sung phrase is two bars against an eight-bar chord cycle, deliberately out
   *    of phase, where a declared stack sings the lead's own onsets and is as in
   *    phase as two lines get. `vocals.ts` picks GM 53 over a choir patch and says
   *    why — *"53 is one voice, open, on a vowel, which is the honest
   *    description"* — and a 1990 a cappella that was stacked in the studio
   *    arrives on this record as one sample, which is the melody layer and the
   *    supersaw argument for the third time.
   *
   * What would change it is `garage` with the singer in the room instead of on
   * somebody else's tape: a hook stated by two overdubs, `kinds: ['chorus']`, and
   * the third *above* rather than below, since `vocals.ts` centres that contralto
   * at 69 with the top of her range real and the gospel high part sits over her.
   * It becomes writable when a vocal can carry its own cycle and not before.
   */
  arrangement: { riff: 5, tutti: 6, unison: 3, harmony: 2, trade: 0, swell: 7 },

  /**
   * Where this genre disagrees with the shared rule table.
   *
   * Six entries and the first is not optional — without it the generator silently
   * refuses the interval this genre's scale is built out of.
   */
  ruleOverrides: {
    /**
     * **The one that would have broken this genre in silence**, exactly as it
     * would have broken funk, and for the identical reason.
     *
     * `augmented-second` vetoes any move of one scale step and three semitones
     * from strictness 1 upward. In harmonic minor that is right. In the *minor
     * pentatonic* it fires on two of the scale's four steps — tonic to ♭3, and
     * fifth to ♭7 — which are not a hazard here, they are what every bass figure
     * in `styles.ts` is made of. `core/scale.ts` warns about this against the
     * pentatonic rows and funk's own file calls it "the one that would have broken
     * this genre in silence". Second finder, same wall.
     */
    'augmented-second': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * A five-note scale makes the leap thresholds wrong by a whole degree.
     *
     * `wide-leap` vetoes anything past a perfect fourth and was calibrated against
     * a seven-note scale where one step is a tone or a semitone. In the minor
     * pentatonic one step is up to a minor third, so two steps is a perfect fifth
     * — ordinary stepwise motion by the scale in force. Funk's argument verbatim,
     * and `bleep` needs more than that: its whole proposition is a line that jumps
     * octaves because the midrange is deliberately empty, so `leap-beyond-third`
     * comes down as well rather than being left to veto at `polished`.
     */
    'wide-leap': { minLevel: 3, vetoLevel: 4, penalty: 0.5 },
    'leap-beyond-third': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.5 },

    /**
     * **This is the most repetitive music in the project and the rules have to
     * know it.**
     *
     * `repeated-note-run` vetoes three identical notes in a row at strictness 2.
     * `minimal`'s melody table weights `[16]` at 8 — one note, held, for the bar —
     * and `hardgroove`'s at 7, and a section of either is that note twenty times.
     * Funk softens both to a preference at the top level because "a funk line
     * repeats one note more than any rule expects"; here they are disabled
     * outright above the top level and carry the lightest penalties in the
     * catalogue, because the rules exist to catch a line that has *stalled* and
     * this music does not have the concept.
     */
    'static-repetition': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.9 },
    'repeated-note-run': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.92 },

    /**
     * The eleventh is the chord.
     *
     * `min11` and `dom7sus4` appear in seven tables here and the sus chord that
     * never resolves is the default keyboard voicing of the whole deep and garage
     * corner. The rule is right for a sung idiom and jazz tightens it; here it
     * would file off the one extension this music reaches for most.
     */
    'avoid-fourth': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * A seventh over a one-chord loop resolves nowhere, because there is nowhere
     * for it to go.
     *
     * Softened rather than disabled, on funk's reasoning: a seventh in a *moving*
     * line still owes something, and `deep` and `garage` are two styles where the
     * chords genuinely move.
     */
    'unresolved-seventh': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.75 },

    /**
     * A stab is one instrument.
     *
     * The prohibition on parallel fifths and octaves is choral and is about two
     * independent voices fusing into one. A sampled orchestra hit, a hoover and a
     * detuned supersaw stab are all *single objects* that happen to contain
     * several pitches, and they are supposed to fuse — planing one up a step is
     * how the figure moves. Kept as a mild preference at the smoothest setting
     * rather than disabled, since the melody and the bass genuinely can fuse and
     * that is still a fault.
     */
    'parallel-perfects': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.6 },
  },

  /**
   * The bottom of the record is the record, and the top of it is the hi-hat.
   *
   * Stated against the shared defaults, which is what an omitted layer gets. The
   * bass goes from 0.63 to 0.92 and the drums from 0.59 to 0.82 — further than
   * funk pushes either, and funk is the genre whose own file says "every other
   * genre in this project mixes the other way round and is right to". This one is
   * further out still, because a funk record has a singer and a horn section on
   * top of its rhythm section and this has a stab.
   *
   * The melody at 0.86 is the number that says the most. It is *below* every
   * other genre's lead and deliberately so: what occupies the melody layer here is
   * a four-note organ figure or a sampled hook, and a lead mixed like a lead turns
   * a house record into a pop record with the vocal taken out. The exception is
   * the nights there is a singer, and `vocals.ts` puts that layer at 0.9 —
   * the only thing in this genre allowed in front of the kick.
   *
   * The pad at 0.5 is the lowest anywhere except funk's 0.34, and for the opposite
   * reason. Funk's pad is nearly a statement that the layer does not belong; here
   * the wash is essential and belongs *underneath*, because everything it does it
   * does by being felt rather than heard — which is also why it is the layer the
   * missing sidechain hurts most.
   */
  mix: {
    bass: 0.92,
    drums: 0.82,
    comp: 0.6,
    melody: 0.86,
    pad: 0.5,
    counter: 0.48,
    brass: 0.62,
  },

  /**
   * Machines, mixed as machines, with the top end left alone.
   *
   * The kick is at 1.0 because on a 909 it very nearly was: it is the loudest
   * thing on the record, it is the thing the room is built to reproduce, and every
   * other decision in this table is made around it. The clap is at 0.82 rather
   * than the snare, because from 1986 onward the clap *is* the backbeat and the
   * snare is the thing layered under it.
   *
   * **The hi-hat is at 0.55, higher than any other genre in the project**, and it
   * is the one number here that departs from the shared curve rather than
   * following it. Funk puts it at 0.42 and `DEFAULT_DRUM_MIX` lower still, both on
   * the correct reasoning that a hat playing sixteenths at any higher level is all
   * anyone hears. That is the intended outcome here: the 909 hat pattern is what a
   * listener takes their impression of the whole track from, it is what the accent
   * row in `DrumPattern.ghosts` is writing, and a house record with the hats under
   * the kit is a house record nobody has finished mixing.
   *
   * The cymbals go down hard. A crash on a machine record is a *sample* rather
   * than a drummer, it is the only voice in the kit that is not part of a loop,
   * and the ride is barely used at all — three patterns in twenty-four styles.
   */
  drumMix: {
    bd: 1.0, sd: 0.7, rim: 0.6, hh: 0.55, oh: 0.6, cp: 0.82,
    lt: 0.62, mt: 0.62, ht: 0.62, cr: 0.32, rd: 0.3,
    perc: 0.6, cb: 0.55, sh: 0.44, tb: 0.4,
    lp: 0.78, mp: 0.6, hp: 0.5,
  },

  /**
   * Register and response, and the second half is the genre's claim.
   *
   * The comp drops four semitones below the arranger's shared ceiling for the
   * reason synth gives about its sequencer at five: a repeating figure voiced in
   * the lead's own octave does not accompany the lead, it fuses with it, and the
   * ear picks whichever is louder. Four rather than five because half of this
   * genre's comp figures are *stabs* rather than continuous sixteenths, and a stab
   * voiced too low stops cutting.
   *
   * **`response` says almost nothing breathes, and this is the sharpest single
   * statement in the file after the mix.** Funk's own note is that "a funk rhythm
   * section does not play the chorus harder — it plays exactly the same, and the
   * chorus arrives because the horns came in", and sets bass 0.2 and comp 0.25.
   * Here it is 0.1 and 0.2, lower than anywhere in the project, and the argument
   * is not about a band's discipline: **there is nobody to play harder.** A
   * sequencer runs at one voltage. A section arrives because a layer entered, a
   * layer left, a drop returned or a filter opened, and every one of those is
   * something this engine can now say. The brass swings widest at 0.9, because
   * the stab entering *is* the arrival.
   */
  layerPlan: {
    offsets: { comp: -4, pad: -3 },
    response: { bass: 0.1, comp: 0.2, drums: 0.35, pad: 0.55, counter: 0.5, brass: 0.9 },
  },

  /**
   * The filter is the build.
   *
   * See the header: the tempo ramp exists, a build is a ramp arriving at a drop,
   * the two passes cannot see each other, and this genre would refuse the ramp
   * anyway because a record that changes speed cannot be beat-matched. So the
   * gesture is carried here, exactly as synth carries its arrivals here, and the
   * per-style `depth` and `shape` decide how much of it each style takes — eight
   * name `ramp` and two name `step`. The other fourteen take the genre's `kind`
   * table alone, which is a single value per section held, and that is right for
   * them: a Chicago record has no filter on it, and pretending otherwise would be
   * dressing 1986 in 1996's one available production idea.
   *
   * **`bridge` at 0.28 is darker than `intro` at 0.35, which no other genre in the
   * project asks for.** It is the whole of the mapping argued in `FORMS` above: a
   * bridge in this music is the *breakdown*, the moment the record is at its most
   * closed, and the peak that follows is at 1.0. Everywhere else a bridge is a
   * departure at ordinary brightness; here it is the bottom of the record.
   *
   * The bass barely moves (0.15) for the reason `docs/synth.md` measured and
   * stated: closing a lowpass on a part already below the cutoff removes it rather
   * than darkening it, and a filtered sub sounds absent rather than distant. In
   * this genre that would take the floor out of the one section that most needs a
   * floor.
   */
  filter: {
    kind: { intro: 0.35, verse: 0.6, chorus: 1, bridge: 0.28, outro: 0.3 },
    response: { comp: 0.95, counter: 0.85, pad: 0.7, melody: 0.5, bass: 0.15, drums: 0.25 },
    build: 0.4,
  },

  /**
   * A medium plate and the dotted-eighth echo.
   *
   * Three sixteenths against a four-beat bar never lands where the beat does,
   * which is why every echo in electronic dance music has used it since the first
   * tape units — the same convention ambient, synth and funk all state, and the
   * fourth genre to state it, which is by now evidence that it is a fact about
   * the delay rather than about any of them.
   *
   * The room is midway between funk's 0.24 and synth's 0.7, and the reason is the
   * hi-hat rather than taste: a long tail on a sixteenth hat pattern smears the
   * sixteenths together and the separation between them is what the accent row
   * exists to produce. But this music is aimed at a large room and a completely
   * dry record sounds like a demo. The eras move it either side — 0.4 in the
   * superclub, 0.72 in the afterhours — and this is the middle they move around.
   */
  space: {
    reverbSize: 0.5,
    delayBeats: 0.75,
    delayFeedback: 0.42,
  },

  /**
   * Standing production notes, refined by each era.
   *
   * The bass is the driest and darkest in the project — 0.03 send and 1100 Hz —
   * and both numbers are one decision. A sub is a sine wave and it has no top on
   * it to filter; reverb on it arrives while the note is still sounding and the
   * two beat against each other, which on a system with real sub cabinets is
   * audible as the bottom end going soft. Every record in this genre keeps the
   * bass dry, and it is one of very few things all twenty-four styles agree about.
   *
   * The drums are the brightest, at 13 kHz, for the mirror of the same reason: the
   * hi-hat is the top of the record and rolling it off takes away the thing the
   * genre's whole percussion argument rests on.
   */
  effects: {
    bass: { reverb: 0.03, lowpass: 1100 },
    drums: { reverb: 0.18, lowpass: 13000 },
    comp: { reverb: 0.38, delay: 0.32, lowpass: 8000 },
    pad: { reverb: 0.72, lowpass: 5000 },
    melody: { reverb: 0.42, delay: 0.32, lowpass: 9000 },
    counter: { reverb: 0.48, delay: 0.42, lowpass: 8000 },
    brass: { reverb: 0.32, lowpass: 8500 },
    vocal: { reverb: 0.46, delay: 0.3, lowpass: 8000 },
  },

  /**
   * Six to nine minutes, which is the longest in the project and is a fact about
   * the format rather than an ambition.
   *
   * A twelve-inch single at 45 rpm holds about twelve minutes a side at a groove
   * pitch that still sounds good loud, and a record aimed at a DJ spends the first
   * and last thirty-two bars being mixed. Take those away and a six-minute record
   * has four minutes of music in it, which is about a pop single. Synth's own
   * range is 150–300 s and its file calls that "long enough for a sequence to
   * establish and change, short enough to sit in a rotation"; this is not in a
   * rotation and does not need to be.
   *
   * `buildForm` fits the drawn form to a target inside this range, and measured
   * over 500 songs the result runs **337 to 563 seconds with a median of 434** —
   * a little wider than the band at both ends, which is the trimmer's ±25% and
   * ±18% tolerance doing its job rather than a miss. What matters is that the
   * sections stay the length the drop needs: the shortest section in any of those
   * 500 songs is 16 bars and the longest is 32, so nothing ever came out under
   * `planDrop`'s twelve-bar floor. That was checked before a style was written —
   * see the header.
   */
  duration: [360, 540],

  /**
   * What the drummer plays into a section, except that there is no drummer.
   *
   * **`drop` is at the top, and in this genre it is not a fill at all — it is the
   * bar of nothing before the peak.** `generate/fills.ts` describes the shape as
   * "the kit stops; the silence is the fill", and that is the single most
   * characteristic seam event in this repertoire: everything cuts for one bar and
   * the record comes back in with everything on. Pop already weights it at 4 and
   * says "from 1982 onward the commonest thing that happens in the bar before a
   * chorus is that everything stops"; that sentence is about this music, from the
   * outside.
   *
   * `lead-in` is second, because two or three hits on the last beat is what a
   * programmed fill actually is when somebody bothers. `snare-roll` is the
   * sixteenth build, which is real and is over-used. **`tom-roll` is at 1**, the
   * lowest in the catalogue, and only because `piano` and `hardhouse` genuinely do
   * roll — everything else here would sound like a covers band arriving. Three
   * styles turn fills off altogether: `dubtechno`, `minimal` and `ambienthouse`,
   * which are the three whose whole proposition is that nothing announces
   * anything, and that is the sentence ambient writes about its own kit.
   */
  fills: [
    ['drop', 6], ['lead-in', 4], ['snare-roll', 3], ['tom-roll', 1],
  ],

  /**
   * What the tune is made of — and only the three things derivation cannot reach.
   *
   * `voiceForStyle` reads density, leap, ornament, compass, syncopation and the
   * accent table off each style's own `melodyCells` and `melody` block, and those
   * are right: the twenty-four tables here spread **1.0 to 3.63 onsets a bar**,
   * and a genre number would flatten `minimal`'s one note a bar into
   * `microhouse`'s five. What no derivation can know is which *kind* of tune this
   * is, which degrees it lives in, and what it does to a figure.
   *
   * ## The twin is `dnb`, and the two scale rules are already the separation
   *
   * Fingerprinted on duration classes, interval classes, density and turn rate,
   * `dnb`/`house` is the **closest pair of the 171 in the catalogue** — 0.095
   * against a mean of 0.382. The cause is not mysterious, it is arithmetic:
   * `archetypesFor` hands the two genres the same six numbers, averaged over each
   * genre's styles — arch-hook 3.00/3.00, descending-sequence 3.27/3.38,
   * riff-response 1.27/1.07, long-note 1.51/1.98, chant 0.75/0.67, wide-interval
   * 1.95/1.84 — because both are read off a high `melody.sequence` and a low
   * `ornament`, which both genres write. And both are handed the identical
   * generic `SUBSETS`.
   *
   * **`subsets` is what separates them, because the two `scaleForChord`s already
   * do.** `dnb/index.ts` calls its own split "the mirror image of funk's and of
   * hiphop's": minor gets seven notes because *"a genre whose entire emotional
   * apparatus is the flattened sixth cannot be handed a scale that omits it"*,
   * major gets five. This genre is the other way round for the reason the header
   * argues — pentatonic minor, mixolydian major — and the mean of the twenty-four
   * `modeWeights` here is **0.79 minor**. So four songs in five, a subset in this
   * genre is a choice of degrees inside a *five-note* scale, and that is a
   * different decision from choosing inside seven.
   *
   * ## What the generic table does to five notes, which is why it is replaced
   *
   * `snapToSubset` drops degrees the scale does not have rather than wrapping
   * them — its own comment says what wrapping cost. So the six generic subsets,
   * written as indices into a seven-degree mode, land on the minor pentatonic
   * like this, by weight out of 14: **5 delete the fifth, 3 delete the ♭3**, 2
   * delete the fourth, and 4 do nothing at all. A house figure with no fifth or
   * no third is not a colour anyone chose; it is what a table written for seven
   * notes does when handed five.
   *
   * The three below are written for the five and checked against the seven:
   *
   *   `[0,1,2,3,4,5,6]` — minor: all five, no second narrowing, because the scale
   *     rule *is* this genre's answer to which degrees the tune lives in and it
   *     has already been given. Major: the whole mixolydian, which is the
   *     header's looped 1979 twelve-inch — "the fourth and the sixth in the line,
   *     which is a horn chart and needs seven notes".
   *   `[0,1,3,4,6]` — minor: 1 ♭3 5 ♭7, the fourth left out. The `i7` stab, and
   *     `styles.ts` on "`i7`, `i9` and `min11` doing the work that a plain triad
   *     does elsewhere".
   *   `[0,2,3,4,6]` — minor: 1 4 5 ♭7, no third. The sus voicing that
   *     `ruleOverrides['avoid-fourth']` above is disabled for, and which that
   *     entry calls the default keyboard voicing of the whole deep and garage
   *     corner.
   *
   * **The same index is a different note in the two halves, and that is a real
   * compromise rather than something to leave unsaid**: degree 2 is the fourth in
   * the pentatonic and the *third* in mixolydian, so the second entry reads as a
   * quartal, no-third colour in the major corner. That corner is a fifth of the
   * songs and the full-diatonic entry at weight 5 is where it actually lives.
   *
   * ## The twin the fingerprint missed is `funk`, and here that principle inverts
   *
   * `scaleForChord` below is funk's line character for character, and line 96 above
   * says so — "This is funk's, and it arrives at funk's answer from a different
   * fact". What was not followed through is what that costs *this* field. The three
   * rows above are funk's top three at near-identical weight (here 0.45/0.36/0.18;
   * `funk/index.ts:790` 0.36/0.29/0.21 plus a fourth at 0.14), and
   * `funk/index.ts:713-740` glosses them with the same readings already — "1 ♭3 5
   * ♭7", "1 4 5 ♭7, a riff with no third", the full seven as "no snap at all".
   * Measured against the eighteen other genres carrying a `Genre.voice`, **funk is
   * this table's nearest neighbour by a distance, at TVD 0.175** — the next is
   * `country` at 0.268, `dnb` is 0.714, and the mean across the eighteen is 0.48.
   * Same scale rule, the same three rows, the same pitches.
   *
   * So "`subsets` is what separates them" is true of `dnb` and false here, and the
   * separation has to be carried by the other two fields — which it is, and by how
   * much is measurable. **Archetypes**: funk draws `riff-response` 34.5% and
   * `long-note` 2.9%; this table draws `chant` 32.3% and `long-note` 25.8%, TVD
   * 0.275. **Density**: funk's own comment measures 2.67 to 5.79 onsets a bar
   * against 1.00 to 3.63 here, and both genres leave it derived. A funk melody is a
   * busy figure that answers itself; this is one note held over a kick. Nothing in
   * `subsets` is doing that work and it should not be asked to.
   *
   * The boundary this voice does *not* close is the header's other one, `synth`:
   * it declares all six archetypes as well, and the two now share their top two —
   * `chant` 24.4% and `long-note` 21.1% there against 32.3% and 25.8% here, TVD
   * 0.243. That one is still held by tempo, the kit and the mix, not by this field.
   *
   * ## Which kinds of tune
   *
   * **`chant` at 5, from lowest of six.** Its gloss is "one note repeated with a
   * tail — the hook is the rhythm", which is this genre stated as an archetype.
   * `defaultHook: 'earworm'` above is the only genre default at the top of that
   * scale and the argument given for it is the same sentence; `ruleOverrides`
   * disables `static-repetition` and `repeated-note-run` because "the rules exist
   * to catch a line that has *stalled* and this music does not have the concept".
   *
   * **`long-note` at 4.** The cells say it without being asked: `[16]` and
   * `[8,8]` are the two heaviest across the file, `minimal` weights `[16]` at 8
   * and `dubtechno` and `hardgroove` at 7, seven of the twenty-four styles derive
   * under 1.7 onsets a bar, and `tribal`'s note settles its own melody as "a
   * melody with almost nothing in it".
   *
   * **`riff-response` at 3.** The header's "two-bar stab, a sampled phrase or a
   * sixteen-step sequence", and `chicago`'s organ chord sitting "in the same gaps
   * the bass is in" — a figure and the hole after it. It stays *under* `chant`
   * because the response half is a tail rather than an answer: `arrangement.trade`
   * is 0 here, the first strike in the project, and nobody is listening for a
   * reply.
   *
   * **`arch-hook` 1.2.** An arch rises to one high point; `progressive` says there
   * is "no chorus that arrives, and no melody that develops", and the peak in this
   * music is a filter opening and a layer entering, which is why
   * `layerPlan.response` is 0.1 on the bass — there is nobody to play harder.
   *
   * **`wide-interval` 1.5, cut from a derived 1.95.** `archetypesFor` computes it
   * as `0.5 + melody.leap * 5`, and its own gloss says what it is reading for: "a
   * singer's tune — it leaps out and steps home". The `mix` block above is arguing
   * against exactly that when it puts the lead at 0.86 under a bass at 0.92 —
   * what occupies this layer is "a four-note organ figure or a sampled hook", and
   * a leaping tune over it is the pop record that block refuses to make. It stays
   * *above* `arch-hook` rather than at the floor because of `bleep`, two paragraphs
   * below, which is the one style whose tune really is built out of the jump.
   *
   * **`descending-sequence` 0.8, cut from the derived 3.27 that is the largest
   * entry in the derived table.** It is large there because `archetypesFor` reads
   * `melody.sequence` as an appetite for walking a figure down the scale, and in
   * these tables the field means the opposite: `frenchtouch` writes 0.9 and its
   * own comment explains it as "the tune repeats exactly, because it is not a
   * tune, it is a piece of the loop". Reachable rather than zero, because the
   * bridge is the breakdown and `SectionShape.bridge` lifts this entry 1.6 — a
   * breakdown melody walking down is the one place here a figure genuinely moves.
   *
   * **Where this comes out weakest is `bleep`**, and it is named rather than
   * discovered later. Its derived `wide-interval` is 3.5 off a `melody.leap` of
   * 0.6, and the header calls its span of 24 the one place a span number does
   * structural work — a tune that jumps octaves because the midrange is not
   * allowed. The genre weight replaces that.
   *
   * **`compass` stays per-style; the *effective* leap does not, and that is this
   * table's cost rather than a field someone else set.** `motif.ts:688` passes
   * `voice.leap * archetype.leap` into the contour, so any archetype table is also
   * a leap multiplier. Derived, that multiplier is per-style — 1.006 in `minimal`
   * to 1.135 in `bleep`; these six weights flatten all twenty-four to a constant
   * **0.831**, because `chant` and `long-note` carry 0.5 and 0.8 and are 58% of the
   * draw. Net leap: `bleep` 0.681 → 0.499, `microhouse` 0.486 → 0.374, `detroit`
   * 0.394 → 0.299. The octave jumps therefore survive as a ratio — `bleep` is still
   * a third leapier than `microhouse` behind it — and not at their own size.
   * The override at 706 above — this genre is the only one in the project that
   * touches `leap-beyond-third`, trading the rule's veto for twice its penalty — is
   * what keeps the jump reachable at all once this table has damped the appetite
   * for it. Together they say: rarer, and never blocked. If that is not enough the
   * fix is a `Style.voice` delta on `bleep` and not a number moved here.
   *
   * ## What it does to a figure
   *
   * Four claims, each one already made somewhere above — and a fifth operator left
   * unnamed on purpose, which is the last paragraph here because an omission in a
   * table this short is a decision.
   *
   * **The loop is the same object every time round.** `transpose: 1.8`, because
   * in `opsFor`'s `repeat` intent the verbatim branch is an *empty* op list and
   * `appetite(ops[0]?.op ?? 'transpose')` therefore charges it to `transpose` —
   * so this number buys exact restatement, which is what a loop is. `ornament:
   * 0.35` is the same sentence from the other side: a figure decorated differently
   * each time round has stopped being a loop. Genre-wide `ornament` runs 0.02 to
   * 0.26 with a mean of 0.10, so the styles were already saying it one at a time.
   *
   * `sequence: 0.6` is *not* that sentence and is worth not selling as it. All
   * three branches of the `sequence` intent move the figure by a scale step, and
   * the two heaviest are `transpose ±1` and `±2`, both charged to `transpose: 1.8`
   * — so the pair takes the transpose-headed share of that intent from 65% to 85%.
   * It decides *which* operator walks the figure, not whether it walks. What the
   * 0.6 removes is `{ op: 'sequence', times: 2 }`: the figure restated twice more,
   * each time a step higher. One transposition is still the loop, moved; three
   * rungs of it is a tune going somewhere, and that is the thing being refused.
   *
   * **The arrangement thins; it does not develop.** `fragment: 1.6` — keeping the
   * first notes and letting the rest be silence is `Chart.exits` and
   * `Style.drops` written onto one figure, and the header measures 45.6% of songs
   * losing something they had. `expand: 0.4` refuses the other direction: `expand`
   * is how a chorus lifts a verse figure and nothing lifts here
   * (`relativeMajorChorus` is 0 in all twenty-four).
   *
   * **`augment: 0.5` is not the refusal it looks like, and the arithmetic goes
   * beside it because `fragment` is what causes that.** Two of the four `close`
   * branches are `[fragment, augment]` and `pick` charges a chain to `ops[0]`
   * alone, so `fragment: 1.6` is *buying* augmented endings — across the intent
   * they go 88.9% derived to **98.7%** under this table. The 0.5 reaches exactly
   * one branch, the bare `[augment ×1.5]` that stretches the figure with nothing
   * cut from it, and takes that from 22.2% of endings to 9.3%. Which is the claim
   * it is entitled to make, and a real one: a phrase here ends as a *shortened*
   * figure held longer, never the whole figure held longer. `opsFor` says augmenting
   * is what makes a phrase "sound like an ending rather than like the tune
   * stopping"; `ending: 'fade'` means what fades is already down to two or three
   * notes.
   *
   * **The kick owns the beats.** `displace: 1.5`. The genre's defining placement
   * is stated twice in `styles.ts` and both times as structure rather than
   * flavour: a bass note "has to be *in the gaps* to be a bass line at all"
   * because the kick occupies all four beats, and the offbeat chord is in those
   * same gaps. Shifting a whole figure off the beat is that gesture, and this is
   * the operator that names it.
   *
   * **How far it reaches is small, and the number is set knowing that.** `displace`
   * heads one branch of `develop` (2 of 17.5) and one of `vary` (1.5 of 10), and
   * the archetype table above spends **70% of its form draw** on `period`,
   * `riff-response` and `aaba` — none of which has a `develop` slot at all. Derived
   * it is `0.3 + syncopation * 1.5`: 0.53 in `minimal`, 1.50 in `microhouse`, mean
   * 0.95. So 1.5 is every style displacing the way the most syncopated one already
   * does, on one branch of two intents. The placement itself lands somewhere with
   * far more reach — `accents`, derived per style off `melodyCells` and left there
   * deliberately, because *where* the offbeats sit is what these twenty-four cell
   * tables disagree about and a genre number would be the wrong shape for it.
   *
   * **Nothing answers, and nothing re-reads the chord.** `invert: 0.4` — `acid`
   * and `trance` both write `counterMode: 'ostinato'` for "a second line running
   * continuously alongside the first, not answering it", and a loop turned upside
   * down is a different loop. `reharmonise: 0.15` is the lowest number here
   * because it is the exact gesture `scaleForChord` below was chosen to refuse:
   * "a line that re-oriented onto each chord would be a line that changed when
   * the harmony changed, which is precisely what a loop cannot do".
   *
   * **`diminish` is the one operator in the vocabulary this table does not name,
   * and it is the one that halves note values — so the silence gets a reason.** It
   * is not a small omission: it heads 8 of `develop`'s 17.5 — more than any other
   * operator there — and 2 of `vary`'s 10, and halving note values is the direct
   * contradiction of `long-note: 4` and of the loop claim at the top of this
   * section. It is left derived anyway, because `0.3 + syncopation` is already
   * saying the right thing and saying it per style: 0.45 in `minimal`, 1.10 in
   * `microhouse`, mean **0.73** across the twenty-four — below neutral without
   * anyone declaring it, and spread over the one question about speed these styles
   * genuinely disagree on. `dnb` writes 1.5 and `hiphop` 1.4 because a fast passage
   * is what those genres are for. This one is not, and a flat number would buy the
   * damping it already has at the price of telling `minimal` and `microhouse` that
   * their figures move at the same rate.
   */
  voice: {
    archetypes: [
      ['chant', 5],
      ['long-note', 4],
      ['riff-response', 3],
      ['wide-interval', 1.5],
      ['arch-hook', 1.2],
      ['descending-sequence', 0.8],
    ],
    subsets: [
      [[0, 1, 2, 3, 4, 5, 6], 5],
      [[0, 1, 3, 4, 6], 4],
      [[0, 2, 3, 4, 6], 2],
    ],
    ops: {
      transpose: 1.8,
      fragment: 1.6,
      displace: 1.5,
      sequence: 0.6,
      augment: 0.5,
      invert: 0.4,
      expand: 0.4,
      ornament: 0.35,
      reharmonise: 0.15,
    },
  },

  /**
   * The scale rule, and the chord is not a parameter it reads.
   *
   * See the header for the whole argument. One line, no branch on the chord, and
   * `deep` is the single style that overrides it.
   */
  scaleForChord: (tonic, mode) =>
    makeScale(tonic, mode === 'minor' ? 'minorPentatonic' : 'mixolydian'),

  /** The shed, the sportswear, and a stage with nobody on it. See `staging.ts`. */
  staging: STAGING,
};
