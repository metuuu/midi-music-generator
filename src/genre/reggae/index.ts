/**
 * Reggae — Jamaica, 1958 to 1990, and everything that came off the island with it.
 *
 * Mento, ska, rocksteady, roots, dub, lovers rock, two-tone, rub-a-dub and the
 * digital riddim: twenty-one styles across four eras, held together by one idea
 * that none of the other genres in this project has any use for.
 *
 * ## The idea is that beat one is empty
 *
 * Every other repertoire here is built on stating the downbeat. A tanssilava
 * guitarist chops the chord on the beat so that the floor knows where it is; a
 * jazz bass walks a root onto every bar; a sequencer clocks the whole texture from
 * the top of the bar outward. `CompingProfile` in `style/types.ts` puts it
 * exactly: *what those parts are for is a floor full of people knowing where beat
 * one is.*
 *
 * This music tells the floor where beat one is **by refusing to play there**. The
 * guitar chops the offbeats and nothing else; the drummer puts the kick and the
 * cross-stick together on beat three and leaves the downbeat completely alone; and
 * the bass, which everywhere else in this project is the instrument that states
 * the root on the barline, is here a lead instrument playing a written figure with
 * rests in it that frequently does not begin until after the bar has started. The
 * ear locates the downbeat by triangulating from three parts that are all
 * elsewhere, and the result is a groove that leans without ever falling over.
 *
 * That is not a variation on a dance band. It is the negative of one, and three
 * fields below say so in a way nothing else in the repo does — the mix, where the
 * bass is level with the tune; `transitions`, which admits `break`, the one
 * gesture iskelmä explicitly rules out; and the absence of `comping`, argued at
 * its own field.
 *
 * ## What this genre does not claim
 *
 * It is not a fifth answer to the chord-scale question. `scaleForChord` below is
 * a close relative of synth's and a first cousin of iskelmä's, and the honest
 * thing is to say so here rather than let somebody discover the resemblance and
 * conclude the genre was a mistake. All three follow the *key*. Where this one
 * differs from iskelmä is the single line iskelmä spends on harmonic minor, and
 * where it differs from synth is which way it bends when the key alone will not
 * hold the chord — both are argued at the function.
 *
 * Everything that makes this sound like reggae rather than like modal pop is in
 * the styles: three figures, and where they are in the bar.
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
 * The modes this genre's melody may live in, minor first and major second.
 *
 * Short lists, and the shortness is the claim. Synth searches six modes of the
 * tonic because its harmony genuinely wanders that far; this one has two chords in
 * most of its verses and does not need a ladder. In minor the tune is aeolian and
 * bends to dorian when the riddim puts a major IV underneath it — the "Real Rock"
 * sixth, the brightest note in the genre — and it bends no further than phrygian.
 * In major it is major and bends to mixolydian for the borrowed ♭VII, which is
 * where this music puts the chord another idiom would call a dominant.
 *
 * **Harmonic minor is absent, and that absence is the genre's central negative
 * claim** — the same one synth makes, arrived at from a different decade and a
 * different island. iskelmä's rule is otherwise exactly this one plus a line:
 *
 *     if (mode === 'minor' && chord.dominantFunction)
 *       return makeScale(tonic, 'harmonicMinor');     // iskelmä does this
 *
 * Harmonic minor exists to manufacture a leading tone under a dominant, and this
 * music has no dominant in minor to manufacture one for. Where a dance band writes
 * `V`, every minor table in `styles.ts` writes `VII` or `v` — a flat seventh a
 * whole tone below the tonic, or a *minor* five — and the seventh stays natural.
 * A raised seventh in a minor-key reggae song would sound like a foxtrot band had
 * walked into the yard.
 */
const MINOR_LADDER: ScaleName[] = ['minor', 'dorian', 'phrygian'];
const MAJOR_LADDER: ScaleName[] = ['major', 'mixolydian', 'dorian'];

/**
 * Forms.
 *
 * Four, and the last two are the ones that could not have been written for any
 * other genre here.
 *
 * A Jamaican single has a **version** on the B side: the same tape, mixed again
 * with the singer taken off, running for as long as the engineer felt like. On the
 * A side that shows up as a long instrumental stretch after the second chorus,
 * which is a `solo` section by every definition the engine has even though nobody
 * in this repertoire would call it one — the melodica, the organ or the horn line
 * is not improvising over the changes, it is occupying the space the voice left.
 *
 * The last form is the dub proper: two statements and then four sections of the
 * same thing with different things missing from it. It has no chorus in it at all,
 * which is why it is a real fourth entry rather than the third with the bars moved
 * around.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  // The single. Verse, chorus, verse, chorus, the version, and out.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'solo', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 8 },
  ], 5],
  // With a bridge instead of the version — the lovers rock and rocksteady shape,
  // which is a soul record's form played at reggae's tempo.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 8 },
    { kind: 'bridge', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 8 },
  ], 4],
  // The instrumental. A riddim stated, worked over twice, and left running — no
  // singer ever turned up for this one, which is what half the Studio One
  // catalogue is.
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'solo', bars: 16 },
    { kind: 'verse', bars: 16 }, { kind: 'solo', bars: 16 },
    { kind: 'outro', bars: 8 },
  ], 4],
  // The version. The same sixteen bars four times with different things taken out
  // of them; the arrangement is the composition and there is nothing to return to.
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'verse', bars: 16 },
    { kind: 'solo', bars: 16 }, { kind: 'verse', bars: 16 },
    { kind: 'outro', bars: 16 },
  ], 3],
];

export const reggae: Genre = {
  walkup: 0.15,
  /**
   * Direct, never prepared — the same negative claim as the missing harmonic minor.
   *
   * `keyChangeChance` is small in every era here and zero in none of them, and the
   * few lifts that do happen arrive without being announced. An applied dominant
   * in front of one would put a leading tone in a minor-key song, which is the one
   * thing this genre asserts never happens; and it would announce a modulation in
   * music whose whole proposition is that the riddim is the same riddim. See
   * `tune/keyplan.ts`.
   */
  preparedModulation: false,
  id: 'reggae',
  label: 'Reggae',
  description:
    'Mento, ska, rocksteady, the one drop, dub, lovers rock and the digital riddim — Jamaica, 1958 to 1990, with the downbeat left empty on purpose.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,

  /**
   * Guitar and bass keys, and the bass is the one that decides.
   *
   * Everywhere else in this project the key table is chosen for singers or for
   * fingering. Here the constraint is that the *lowest note of the riff* has to
   * be felt: a reggae bass line is a written figure that spends most of its time
   * between the open E and the fifth fret of the A string, which is roughly 82 to
   * 165 Hz, and a figure sitting an octave above that stops being the floor. A
   * minor, D minor and G minor put a riff exactly there, which is why they carry
   * the weight; F and B♭ minor are here because the horn eras genuinely lived in
   * flat keys and a ska number in B♭ is a ska number played by people reading
   * parts.
   */
  keys: {
    minor: [[9, 6], [2, 5], [7, 4], [4, 4], [0, 3], [11, 2], [5, 2], [10, 2]],
    major: [[7, 5], [0, 5], [2, 4], [9, 4], [5, 3], [10, 3], [4, 2]],
  },

  /**
   * It fades, and the reason is on the other side of the record.
   *
   * A Jamaican single does not end. It is turned down while the rhythm carries on,
   * because the rhythm does carry on — into the version on the B side, into the
   * next cut of the same riddim, into somebody else's record next month. A button
   * would be the band agreeing that this particular song was the point, and the
   * whole economy of this music is built on the opposite claim.
   *
   * That sits slightly awkwardly beside `countIn` below, and the awkwardness is
   * real: a band on a stage counts in and then fades out, which is what a band on
   * a stage playing this music actually does when the selector takes the record
   * off.
   */
  ending: 'fade',

  /**
   * Somebody counts it in.
   *
   * Three of the four eras here are a room with a drummer in it, and a drummer
   * starting a one drop has a specific problem that no other genre in this project
   * has: the first thing the band plays is *nothing*, on the beat everybody else
   * would use to come in together. Four clicks is not a formality there, it is the
   * only way the downbeat gets established before it stops being played.
   *
   * The digital era is the exception and it is outvoted. A genre gets one answer,
   * and the answer that is right for the drummer is right for three eras out of
   * four.
   */
  countIn: true,

  /**
   * `standard`, with the overrides below doing the work.
   *
   * The lines here are exposed in the way loop music always is — a riddim comes
   * round forty times and a wrong note in the hook is heard forty times — but the
   * idiom is modal, parallel and pentatonic in places, and the strictest settings
   * would file all three of those off.
   */
  defaultStrictness: 'standard',

  /**
   * Riddim music, and it should sound like it.
   *
   * `catchy` locks the rhythm and recalls each section, which is the honest
   * setting for a genre whose commercial logic is that the same two bars can carry
   * thirty different songs. `ragga` pushes it to `earworm` and is the only style
   * that does.
   */
  defaultHook: 'catchy',

  /**
   * The horn section plays a figure, restated, and it is the whole of what a horn
   * section does here.
   *
   * `riff` and `swell` up, `tutti` and `trade` down, and every one of those four is
   * the same argument from a different side. A Jamaican horn arrangement is three
   * players reading one line that comes round every second bar until it is part of
   * the riddim — at which point somebody can version it, which is the point of
   * everything in this genre. A fresh stab thrown into each gap in the tune is a
   * rock arranger's gesture and it makes a part nobody could reuse.
   *
   * `tutti` is down for the reason iskelmä's is: the band stopping to hit a figure
   * together empties a floor. `trade` is down for a different one — handing a
   * phrase between two players is a conversation, and these horns are a *section*,
   * which is the distinction `horns` in `styles.ts` exists to make against `ska`.
   * Neither is zero, because ska is exactly where both do happen.
   */
  arrangement: { riff: 6, swell: 5, harmony: 4, tutti: 2, trade: 1 },

  /**
   * Where this genre disagrees with the shared rule table.
   *
   * Four entries, and the last one is the one that enforces the genre's central
   * claim against the only part of the pipeline that could break it.
   */
  ruleOverrides: {
    /**
     * `augmented-second` off, and it costs nothing anywhere it is not needed.
     *
     * The rule vetoes a one-step three-semitone move from strictness 1 upward,
     * which is correct in harmonic minor, where the interval is the accident of
     * reaching for a raised seventh. **It is inert in every seven-note mode this
     * genre uses** — aeolian, dorian, phrygian, major and mixolydian all step by
     * ones and twos and none of them contains such a gap — so switching it off
     * changes nothing at all for nineteen of the twenty-one styles.
     *
     * What it buys is the other two. `dub` and `nyabinghi` are pentatonic, and the
     * tonic-to-♭3 of a minor pentatonic and the third-to-fifth of a major one are
     * exactly the interval being vetoed. Left on, the generator refuses every
     * characteristic move those scales exist to make, and what comes back is a
     * five-note scale being used as a badly behaved seven-note one.
     */
    'augmented-second': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * The skank planes, and so does the horn line.
     *
     * A guitarist chopping triads through `i–VII–VI` is moving three voices in
     * parallel by construction — that is what a chop *is*, one shape carried up
     * and down the neck — and a three-horn arrangement voiced in fourths and
     * fifths over a two-chord riddim does the same. The rule is a choral
     * prohibition about independent lines and there are no independent lines here.
     * Softened rather than disabled: the melody and the counter are two players
     * who can hear each other, and at the top level the fault is still a fault.
     */
    'parallel-perfects': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.6 },

    /**
     * A hook in this music repeats one note more than any rule expects.
     *
     * Softened, not disabled, and the distinction matters: the rule exists to
     * catch a line that has stalled, and a reggae line can absolutely stall. It
     * just does it later than a line in any other genre here, because a melody
     * written against a bar with a hole in it gets a great deal of its interest
     * from *where* the repeated note lands rather than from the note changing.
     */
    'repeated-note-run': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.85 },

    /**
     * And this is the one that actually enforces the claim at the top of the file.
     *
     * `scaleForChord` never producing a raised seventh is a fact about the *chord
     * scale* and not about the music, and synth learned that the expensive way:
     * nothing that decorates a line asks the chord scale for permission. The
     * soloist's `chromatic` appetite offers the semitone either side of wherever
     * it is, and one of those is the leading tone — so seventeen songs in two
     * hundred came out with one in a minor key while the tables stayed innocent
     * and the assertion passed on luck.
     *
     * This genre has a `solo` profile and a version section for it to live in, so
     * the same hole is open here. Vetoed from the first level rather than
     * penalised, because this is not a matter of taste that gets stricter with the
     * setting: the note is either in this music or it is not, and it is not.
     * `chromatic` stays low but non-zero — a horn player bending into a note is
     * real, and there are eleven other semitones to do it with.
     */
    'chromatic-leading-tone-in-minor': { minLevel: 1, vetoLevel: 1 },
  },

  /**
   * The bass is level with the tune, and that single number is the genre.
   *
   * The shared defaults put the bass at 0.50 and the melody at 0.75, which is
   * correct for every other repertoire here — a bass is the floor and the tune is
   * the thing the floor is under. In this music the bass *is* the lead: it plays
   * the figure people whistle, it is the part the record is remembered by, and on
   * a sound system it is being reproduced by a stack of speakers built for nothing
   * else. 0.74 against a melody at 0.66 puts them within a decibel of each other,
   * with the melody very slightly behind, which is where these mixes actually sit.
   *
   * The comp goes the other way, from 0.72 down to 0.55, and that is not the skank
   * being unimportant. It is the skank being *short*: a chop is 80 ms of chord and
   * damping, so its perceived level runs well ahead of its peak, and a chop mixed
   * at conversational level with the bass turns into the loudest thing in the bar.
   * The pad is furthest back of anything in the project, because an organ pad in
   * this music is a wash somebody added at the desk rather than a bed the
   * arrangement was written over.
   *
   * Drums up, from 0.59 to 0.72. The other half of "drum and bass" is not a
   * metaphor here: these are the two parts that survive into the version, and a
   * mix where they are accompaniment is a mix of some other record.
   */
  mix: {
    // `melody` and `bass` carry the catalogue's 2 dB trim; see `gains` in generate/song.ts
    bass: 0.74,
    drums: 0.72,
    melody: 0.66,
    comp: 0.55,
    pad: 0.38,
    counter: 0.5,
    brass: 0.62,
  },

  /**
   * The kit, mixed as the drum half of drum-and-bass.
   *
   * `rim` at 0.82 is the number that matters and it is a large move: the shared
   * default is 0.7, below the snare's 0.85, because in every other genre here a
   * cross-stick is a decoration a drummer reaches for in a quiet passage. Here it
   * is the backbeat — it is what lands on beat three of a one drop, it is the only
   * thing besides the kick that lands there at all, and a mix that treats it as an
   * accent has buried the one event the bar is organised around.
   *
   * The kick stays at 1.0 and the cymbals come down. A one drop kick is a large
   * felt-damped drum with the front head on, tuned low and gated short; the ear
   * needs all of it. The hats and ride are keeping time in the band a human ear is
   * most sensitive to, and in a room this size they take care of themselves.
   *
   * The hand drums are up rather than at the default, and `lp` at 0.92 is nearly
   * the kick's own number. In `nyabinghi` and `mento` there is no kick at all, so
   * the low stroke of the hand drum is not an accent on a kit — it is the pulse of
   * the bar, played by the same hands as everything else in it, and it has to
   * carry the floor on its own.
   */
  drumMix: {
    bd: 1.0, sd: 0.82, rim: 0.82, hh: 0.4, oh: 0.52, cp: 0.68,
    lt: 0.7, mt: 0.68, ht: 0.66, cr: 0.42, rd: 0.32, perc: 0.6, cb: 0.5,
    sh: 0.42, tb: 0.45, lp: 0.92, mp: 0.66, hp: 0.55,
  },

  /**
   * The chop sits above the bass and well below the tune, and it barely moves.
   *
   * `offsets` is a register statement rather than a level one, and the comp's is
   * the one this genre needs. A guitar chop in this music is played on the top
   * three strings around the fifth fret with the bass rolled off it entirely — it
   * is a thin bright object deliberately parked in a band nothing else occupies,
   * because the bass has taken everything under 200 Hz and the tune has taken the
   * top. The default −0 would voice it in the melody's own octave, where two
   * things in one register fuse and the ear picks whichever is louder.
   *
   * `response` is where the genre says its rhythm section does not swell. A dance
   * band leans into a chorus; a riddim does not, because the riddim is a fixed
   * object that a chorus happens over. The bass at 0.2 is the strongest statement
   * of that — the figure is played at one weight from the first bar to the last,
   * and everything that arrives, arrives by something else joining.
   */
  layerPlan: {
    offsets: { comp: -2, pad: -8 },
    response: { bass: 0.2, comp: 0.3, drums: 0.55 },
  },

  /**
   * There is no `comping` profile, and the absence is a claim.
   *
   * `CompingProfile` is three gestures a chordal player makes when their job is to
   * accompany: leave a bar out, anticipate the barline, nudge an offbeat stab. All
   * three are right for jazz and all three are catastrophic here, and it is the
   * middle one that shows why. Anticipating the barline means arriving an eighth
   * *early* — which in this idiom is exactly where the previous bar's fourth
   * offbeat already is, so the gesture does not add a syncopation, it fills in the
   * one place the figure was leaving empty. Do it often enough and the skank
   * becomes a chord on every eighth, which is a completely different instrument.
   *
   * Iskelmä states the same absence for a related reason — the chords are how the
   * floor knows where beat one is — and this genre's version is the sharper one:
   * the chops are how the floor knows where beat one *is not*, and they can only
   * do that by never moving.
   */

  /**
   * A big spring, and a dotted-eighth echo.
   *
   * The delay length is a convention rather than a preference and it is the same
   * one ambient and synth both state: three sixteenths against a four-beat bar
   * never lands where the beat does. What is different here is the *feedback*.
   * 0.55 means a single snare hit comes back six or seven times, which is well
   * past the point where an effect stops being an effect — and that is the correct
   * setting, because in this music it is not one. A dub echo is a second drummer,
   * and the engineer riding the feedback control is the only member of the band
   * playing anything different in the second chorus.
   *
   * The eras narrow it: `ska` cuts the size to a third of this and `digital` runs
   * dry and short. Only `roots` opens it past what is written here.
   *
   * **And there is no style tier here, which is the one thing `Style.effects`
   * did not close.** A style can now say how much of itself it sends to the
   * echo — `dub` does, and that is what stopped a dub drawn in 1985 arriving dry
   * — but `Space` has a genre row and an era row and nothing under them, so how
   * many times a repeat comes *back* is still the decade's to decide. A dub in
   * `roots` gets 0.62 and one in `digital` gets 0.42: drenched in both, off two
   * different tape machines. That is the right size of residual to live with,
   * and it is a smaller error than the one it replaced, but it is an error and
   * this is where it lives.
   */
  space: {
    reverbSize: 0.68,
    delayBeats: 0.75,
    delayFeedback: 0.55,
  },

  /**
   * Standing production notes, refined by each era.
   *
   * **The bass is dark and dry, and both halves are non-negotiable.** 900 Hz is not
   * a mix taste, it is the instrument: flatwound strings, foam under them at the
   * bridge, the tone control shut, and a small amp with no tweeter — the whole
   * signal is fundamental and second harmonic, and everything above the fifth is
   * absent from the source rather than filtered off it. Dry for the reason ambient
   * gives about its own: reverb on a sustained low note arrives while the note is
   * still sounding and the two beat against each other. In a dub mix that is not a
   * theory, it is the reason the bass is the one channel with no send on it while
   * everything above it dissolves.
   *
   * The comp is the wet one. A skank through a plate is the sound; run dry it is a
   * correct figure that nobody would recognise.
   */
  /**
   * The skank: a chop on the offbeat that is over before the beat arrives.
   *
   * `muted` ahead of `strum` because the defining thing about a skank is how
   * *short* it is — the chord is released the instant it sounds, which is
   * exactly what `TECHNIQUES.muted` does with its 0.34 length and nothing else
   * in the table does at all. The strum under it is the bubble and the rare
   * ringing chorus chord.
   */
  techniques: {
    comp: [['muted', 6], ['strum', 4]],
  },
  effects: {
    bass: { reverb: 0.02, lowpass: 900 },
    drums: { reverb: 0.28, lowpass: 5200 },
    comp: { reverb: 0.4, delay: 0.28, lowpass: 6500 },
    brass: { reverb: 0.4, delay: 0.2, lowpass: 7000 },
    melody: { reverb: 0.42, delay: 0.3, lowpass: 7500 },
    counter: { reverb: 0.45, delay: 0.35, lowpass: 7000 },
    pad: { reverb: 0.5, lowpass: 4600 },
    vocal: { reverb: 0.38, delay: 0.28, lowpass: 6500 },
  },

  /**
   * The filter moves, and it moves under somebody's hand rather than across a
   * section.
   *
   * Present for one style. `applyFilter` is a no-op unless both the genre and the
   * style have declared something, so this profile costs nothing on the twenty
   * styles that name no sweep and the notes come back with no `brightness` field
   * at all — which is the right artefact, and the reason the check next door
   * asserts that genres without a profile emit nothing rather than emitting a grid
   * of ones.
   *
   * `dub` is the style that declares one, and there the filter genuinely is the
   * arrangement: a dub mix is a high-pass opened across sixteen bars until the
   * drums come back, and no amount of level work reproduces it. The `response`
   * table is where this differs from synth's: there the sweep belongs to the
   * sequencer, here it belongs to the *drums and the comp*, because those are the
   * two channels a dub engineer's hands are actually on. The bass is at 0.05 and
   * effectively pinned — the one channel that never gets filtered, for the reason
   * given two fields up.
   *
   * `kind` states only the disagreements. The verse sits lower than the default
   * because a version arrives dark and opens; the outro closes hard, because these
   * records end by being taken away rather than by stopping.
   */
  filter: {
    kind: { intro: 0.3, verse: 0.5, chorus: 1, bridge: 0.72, solo: 0.85, outro: 0.2 },
    response: { drums: 0.9, comp: 0.85, melody: 0.5, counter: 0.7, pad: 0.6, bass: 0.05 },
    build: 0.25,
  },

  /**
   * The band does not get out of the way, and it is a different argument from
   * everyone else's.
   *
   * Jazz thins out under a soloist because comping is a conversation. Iskelmä
   * refuses to because the floor is full. Here the riddim carries on for the
   * reason that it is the record: the horn line or the melodica in the version
   * section is not being accompanied, it is being *allowed on*, and a rhythm
   * section that dropped back would have removed the thing the soloist is a guest
   * of. `full` everywhere, and no trading — four bars of drums alone in a reggae
   * arrangement is a mix move, not a spot, and the drummer would not thank you.
   */
  soloBacking: 'full',
  solo: {
    /**
     * Mostly the answering instrument, because that is who is actually free.
     *
     * In three of the four eras the melody layer is a singer's line played by an
     * instrument, and what takes the version section is whoever was answering it
     * — the melodica, the trombone, the organ. `comp` is in the rotation at a real
     * weight and it is not a fallback: an organ player taking sixteen bars over
     * their own bubble is a specific and common record.
     */
    rotation: [['counter', 5], ['melody', 4], ['comp', 3]],
    tradeFours: 0,
    /**
     * High, and higher than jazz's or synth's. The version is the same song with
     * the singer removed, and a soloist who never touched the tune would be
     * asserting that it was a different piece — which is precisely what a version
     * is not.
     */
    quoteMotto: 0.6,
    backing: { counter: 'full', melody: 'full', comp: 'full' },
    vocabulary: {
      // A quarter-note gait. Every horn line in this genre is written as a
      // *figure* rather than as a stream, and a run of eighths over a one drop
      // reads as somebody who has not noticed where the bar is.
      gait: 0.65,
      doubleTime: 0.06,
      /**
       * The lowest offbeat-accent number in the project, and it looks like the
       * wrong way round until you count what is already there.
       *
       * The whole rhythm section is on the offbeat: four chops, four hats, and a
       * bass figure that starts after the downbeat. A soloist adding offbeat
       * accents on top of that is not syncopating against anything — everything
       * is already there — and the only remaining way to be interesting is to
       * land somewhere the band has left empty, which is the beat.
       */
      offbeatAccent: 0.1,
      enclosure: 0.08,
      // Almost none, and the rule table vetoes the one semitone that would
      // matter. There is no dominant here for a chromatic approach to approach.
      chromatic: 0.06,
      ornament: 0.3,
      // High. A line over a two-chord riddim has nothing to develop against
      // except itself, and a solo that keeps inventing over a fixed loop is noise
      // on top of a pattern rather than a line through it.
      develop: 0.8,
      displace: 0.2,
      // The most space of any soloist here. What a melodica does over sixteen
      // bars of dub is play four notes and let the echo have the rest, and a
      // soloist who filled that would be competing with the delay.
      space: 0.42,
      climb: 2,
      paraphrase: 0.4,
      /**
       * Low, and it is the one place this genre disagrees with every other solo
       * profile in the project.
       *
       * `liftIntoReturn` is the run up into the last chorus — the gesture iskelmä
       * gives 0.85 and synth 0.7, because in both of those the final statement is
       * an arrival being delivered. A version does not deliver anything. It stops
       * being the version and the singer comes back, and the way that happens on
       * these records is that everything drops out for a bar. Building into it
       * would be an announcement, and the drop is the announcement.
       */
      liftIntoReturn: 0.2,
    },
  },

  // Two and a half to five minutes. A Jamaican single is short — under three
  // minutes, most of them — and the top of this band is the extended cut with the
  // version left running on the end, which is what the fourth form is.
  duration: [150, 300],

  /**
   * The kit announces the join, and then sometimes the whole band refuses to.
   *
   * `break` is the entry that matters, and it is the one iskelmä explicitly rules
   * out: a pavilion band stopping dead empties the floor. In this music it fills
   * it. The drop — everything out for a bar, and the whole room waiting for the
   * one that is not going to be played — is the single most reliable gesture in a
   * reggae arrangement and it is the live-band ancestor of what a dub engineer
   * does with a mute button.
   *
   * `shot` is here at a real weight because the styles have written their own
   * `shots` tables and those tables are all offbeat; the derived default would have
   * put the band together on the group heads, which are the four beats this genre
   * is organised around not playing.
   *
   * **No style here names a `breakCarrier`, and that is checked rather than
   * assumed.** The default is `bass`, and in this idiom the default is not a
   * fallback — the bass carrying the bar alone *is* the thing every one of these
   * styles is built on, and a drop is where the arrangement finally says out loud
   * what the empty downbeat has been implying all along. Measured across the
   * whole catalogue, 21 styles × 4 eras × 40 seeds: **504 drawn breaks, 0 with
   * nothing sounding.** Over the section-last bars the break draws from, the bass
   * covers a median 63% of the bar and leaves it empty in 0.1% of 12149, against
   * `comp` at 25% and 8.2%, and `melody` at 46% and 31.4%. Only `pad` covers more
   * — 99%, because it is a held wash — and a wash cannot carry a break: the
   * gesture is the band stopping and one player still stating time, and a
   * sustained chord states none.
   */
  transitions: [['fill', 5], ['break', 3], ['shot', 3], ['elide', 1]],

  /**
   * The drummer's vocabulary, and it is short on toms.
   *
   * `snare-toms` and `drop` lead it. A reggae fill is a snare figure with the
   * toms answering off it — a flurry across the last two beats and a landing on
   * three of the next bar, not a descending roll to a crash — and the reason is
   * that there is nothing on the downbeat for a crash to land on. `drop` is
   * weighted as heavily as any roll for the same reason `break` is in the
   * transitions above: the most effective fill in this idiom is frequently no fill
   * at all.
   *
   * `rim` is in the palette, which only two genres in the project can honestly
   * say. `tom-roll` is present and last: it is a dance-band gesture and it does
   * happen here, mostly on the ska and two-tone end where the band is playing to a
   * different room.
   */
  fills: [
    ['snare-toms', 5], ['drop', 4], ['lead-in', 3], ['rim', 3],
    ['snare-roll', 2], ['tom-roll', 2],
  ],

  /**
   * What the tune is made of — and it is the same negative claim as everything
   * above: the bar has a hole in it and the melody is written against the hole.
   *
   * Three keys and no more. The six scalars `Voice` also carries are derived per
   * style and derived *correctly*: `melody.leap` runs 0.18 on `nyabinghi` to 0.4
   * on `ska` and `twotone`, and `syncopation` 0.4 on `mento` to 0.7 on `dub`,
   * `dubpoetry` and `rubadub`, which `styles.ts` argues style by style. A genre
   * number would flatten twenty-one tables that disagree on purpose.
   *
   * **And nothing computed *from* `leap` is named either**, which is the same
   * refusal one level down and is the correction this table most needed.
   * `archetypesFor` reads `wide-interval` as `0.5 + leap × 5` and `derivedVoice`
   * reads the `expand` op as `0.6 + leap × 2`; `mergeArchetypes` and the ops
   * spread both overwrite by key, so a genre entry for either is precisely the
   * thing that erases the 2.2× spread the paragraph above is defending. Left
   * alone they run 1.40 (`nyabinghi`) to 2.50 (`ska`, `twotone`) and 0.96 to
   * 1.40, and the horn styles come out leaping while the chant styles do not —
   * which is the entire reason `leap` is written per style. An earlier draft put
   * them at 1.5 and 0.5, near the bottom of both ranges, and argued the first
   * from `mix.bass` 0.74 against `mix.melody` 0.66 — a level, which says nothing
   * about how far a line jumps.
   *
   * ## Which kinds of tune
   *
   * **`chant` and `riff-response` carry it at 4 each**, against derived medians
   * of 0.60 and 0.60 — much the largest lift in the table — and this file has
   * already argued both without using the words. `repeated-note-run` is softened
   * in `ruleOverrides` because *a melody written against a bar with a hole in it
   * gets a great deal of its interest from where the repeated note lands rather
   * than from the note changing* — which is `chant`'s own gloss, one note
   * repeated with a tail and the hook being the rhythm. `riff-response` rests on
   * `defaultHook: 'catchy'`, on `ragga` pushing that to `earworm` for a hook of
   * five notes played three hundred times, and on verse tables that are one or
   * two chords for eight bars: a tune with nothing to move through answers
   * itself or it does not answer at all. `arrangement` also puts `riff` at 6,
   * the heaviest weight in that table, and that is a supporting aside rather
   * than the argument — `chart.ts` gates `riff` on the `brass` layer, so it is
   * the horns coming round every second bar, and the solo note above says the
   * horns are what *answers* the melody layer rather than what it is.
   * iskelmäpop reaches for these same two and means something else: there the
   * hook is a fixed tune with a fixed rhythm, here it is a fixed *bar*, and the
   * tune is what fits round it.
   *
   * **`long-note` at 2.2**, where a dance band would have it at 1, and it is the
   * cells that say so rather than the tempo. `[16]` and `[-8,8]` are joint-top of
   * `melodyCells` on `dub` and `dubpoetry` and `[16]` ties `[8,8]` on
   * `nyabinghi`, which puts those three at 2.59, 2.83 and 2.15 derived off
   * `0.4 + max(0, 3 − density) × 1.4` with no help from here; `rocksteady`,
   * `onedrop` and `roots` are 1.61 to 1.75, on tables topped by `[8,8]` and
   * `[-4,4,8]` rather than by `[16]` — `[-8,8]` is not in their melody tables at
   * all, it is in their `cadenceCells` at 3. `[16]` does lead `cadenceCells` in
   * all six, at 6, 6, 6, 7, 7, 7. 2.2 is `rubadub`'s own derived number and
   * lifts that half of the genre rather than inventing it. **It overshoots the
   * other half and that is not free**: `ska` at 3.52 onsets a bar, `twotone`
   * 3.61 and `ragga` 3.59 derive the floor of 0.40, with `dancehall`, `mento`,
   * `shuffle` and `skinhead` beside them — a third of the styles get a held-note
   * archetype their cells argue against. The 3 this table used to carry was
   * above every value the genre derives, top included.
   * `solo.vocabulary.space` above is 0.42, which only `dnb` goes over, for the
   * reason given there: a melodica over sixteen bars of dub plays four notes and
   * lets the echo have the rest.
   *
   * **`descending-sequence` at 2**, against the 2.5 `archetypesFor` reads off a
   * median `melody.sequence` of 0.50. The descending tetrachord is real and
   * `roots` calls it the most common four bars in the genre — and the same note
   * says what is wrong with it as a *tune* shape: it never gets to the bottom,
   * because reaching the fifth would need a dominant and there is not one
   * anywhere here. An archetype that spends a whole section falling away from a
   * peak at the top would arrive where the harmony has refused to go.
   *
   * **`arch-hook` to 2**, against the flat 3 `archetypesFor` gives every style
   * alike — it is the one archetype the derivation does not vary — and it is a
   * refusal this file already states three times elsewhere. `layerPlan.response`
   * puts the bass at 0.2 because *the figure is played at one weight from the
   * first bar to the last*; `liftIntoReturn` is 0.2 because *a version does not
   * deliver anything*; `ending` is `fade` because the record does not stop. An
   * arch is a shape that peaks and resolves.
   *
   * ## Which degrees — and this is the key that separates the genre from indian
   *
   * Fingerprinted over the catalogue on duration classes, interval classes,
   * density and turn rate, **reggae and indian are the third-closest of the six
   * near pairs, 0.106 against a mean of 0.382 over all 171**. The mechanism is
   * legible rather than mysterious: `archetypesFor` separates two genres mainly
   * by `melody.sequence`, these twenty-one styles sit at a median 0.50 and
   * indian's twenty-eight at 0.60, and `subsets` is the same generic six for both
   * because it is the same generic six for all 386 underived styles. Two
   * repertoires, one voice.
   *
   * So **1 ♭3 4 5 ♭7 leads at 5 of 11**. It is not a colour in this music:
   * `augmented-second` is disabled in `ruleOverrides` genre-wide expressly so
   * that `dub` and `nyabinghi` — the two styles whose own `scaleForChord` returns
   * a pentatonic — can make the tonic-to-♭3 move the scale exists for, and that
   * override is already the genre conceding that a five-note melody is native
   * here. It is also the set that survives every bend `MINOR_LADDER` allows:
   * aeolian, dorian and phrygian differ only at the second and the sixth, and
   * those five degrees are what all three agree on. Against indian, where the
   * rāga *is* the restriction and the line steps through seven notes, one line
   * puts thirds into the interval histogram where there were seconds.
   *
   * The **whole mode** keeps a real weight under it, because three-fifths of
   * `scaleForChord` below would otherwise be unreachable — the Real Rock sixth,
   * the borrowed ♭VII and the phrygian second are this genre's entire harmonic
   * vocabulary and a tune living in five notes never states one.
   *
   * ## The major half, which is 43% of the genre and was the half this table ducked
   *
   * `modeWeights.major` averages 0.433 across these styles — 0.85 on `mento`,
   * 0.8 on `lovers`, 0.75 on `shuffle`, against 0.15 on `dub`. That matters more
   * than it looks, because `MAJOR_LADDER[0]` is plain major *and* is the fallback
   * below, so most major bars are read against it and only a ♭VII pulls the scale
   * to mixolydian. On plain major the first entry is **1 3 4 5 ♮7**: leading tone
   * in, second and sixth out. That is the one major set this genre does not own.
   * The set it does own is the borrowed ♭VII, and that is the mixolydian reading
   * of the same entry — real, and the rarer of the two.
   *
   * So **1 2 3 5 6 goes to 3**, level with the whole mode rather than under it.
   * It is what `nyabinghi`'s own major branch returns, it is what `mento` and
   * `lovers` sing, and at 3 it is drawn 27% of the time instead of 20% — enough
   * that the ♮7 reading is not the default sound of the eight styles at or over
   * `modeWeights.major` 0.5. The first entry keeps the lead at 45% because its
   * minor reading is the genre's spine.
   *
   * ## One artefact, and it is worse than the first draft of this paragraph said
   *
   * `song.ts` resolves `style.scaleForChord ?? genre.scaleForChord`, and `dub`
   * and `nyabinghi` override it with `minorPentatonic` / `majorPentatonic`, so on
   * those two the scale arriving at `snapToSubset` is *already* five notes. That
   * function keeps only subset indices below `scale.pcs.length`, and the indices
   * mean different pitches in a five-note scale. Against `minorPentatonic`
   * `[0, 3, 5, 7, 10]` the first entry survives as indices 0, 2, 3, 4 →
   * **1 4 5 ♭7**, so it is the **♭3** that is dropped, not the ♭7 — which is
   * exactly the tonic-to-♭3 move `augmented-second` is disabled genre-wide to
   * permit, on the two styles it was disabled for. The third entry survives as
   * **1 ♭3 4 ♭7** and loses the fifth; in major it is 1 2 3 6, again without the
   * fifth. Only the whole mode is inert, because all five of its indices exist.
   * Eight of eleven by weight therefore land on a four-note set on those two
   * styles, and on the ♭3 half of it this table is working against
   * `ruleOverrides` rather than with it.
   *
   * It cannot be fixed from here, and that is the reason it is stated rather
   * than quietly left. Degrees are indices into whatever scale arrives, so no
   * single entry can be 1 ♭3 4 5 ♭7 on seven notes and a no-op on five: the
   * inert one is `[0, 1, 2, 3, 4]`, which reads 1 2 ♭3 4 5 everywhere else and
   * is a different genre. The fix is a `subsets` delta on those two styles —
   * `voiceForStyle` takes `delta.subsets` whole — and this table is genre-level
   * by construction.
   *
   * ## What it does to a figure
   *
   * `sequence` and `transpose` are deliberately absent: `melody.sequence` spreads
   * 0.35 to 0.7 across these styles, derivation reads it correctly, and a `mento`
   * is not a `ragga` in this respect.
   *
   * **`displace` to 0.35, and it is the correction that matters most.** It is
   * derived from `syncopation` as `0.3 + syncopation × 1.5`, which is high here
   * for a reason `styles.ts` argues at length, so it arrives at 1.2 at the median
   * — 0.90 on `mento` up to 1.35 on `dub`, `dubpoetry` and `rubadub`, with only
   * `mento`, `shuffle` and `nyabinghi` under 1 — and pointing exactly backwards.
   * `solo.vocabulary.offbeatAccent` above is 0.1, which only `indian` at 0.05
   * goes under, and its argument is this one: four chops, four hats and a bass
   * that starts after the downbeat mean everything is already off the beat, so
   * shoving a whole figure off the grid is not a syncopation, it is the figure
   * disappearing into the skank.
   *
   * **`diminish` to 0.4**, against a derived 0.70 to 1.00, for the reason `gait`
   * is 0.65 and `doubleTime` 0.06: every line in this genre is a figure rather
   * than a stream, and a run of eighths over a one drop reads as somebody who has
   * not noticed where the bar is.
   *
   * **`fragment` to 1.6**, which is that sentence from the other side, and it is
   * an addition rather than a correction — `derivedVoice` names six ops and this
   * is not one, so the alternative is the 1.0 fallback. `fragment` keeps the
   * first `keep` notes and lets the tail be silence, which is the one operator
   * that answers a figure with the same figure minus its end. Taking something
   * away is the compositional act here: a dub *is* the multitrack with parts
   * pulled out of it, and `dubpoetry`'s bass has more rest in it than note. The
   * cells that open with a rest, which an earlier draft cited here, are about
   * where a figure starts and say nothing about its tail.
   *
   * **`reharmonise` to 0.3**, also an addition, and the genre's central claim as
   * an operator. `rocksteady`'s bass note puts it plainly: the figure is the same
   * four intervals over whichever chord arrives, and the ear hears the harmony
   * move *underneath a line that did not*. A figure rewritten to fit the changes
   * is the one thing "Real Rock" is not.
   *
   * `sequence`, `transpose` and `expand` are all absent for one reason: each is
   * derived from a per-style number — `melody.sequence` spreads 0.35 to 0.7 here,
   * `leap` 0.18 to 0.4 — and a `mento` is not a `ragga` in either respect.
   *
   * ## The neighbour to check is hiphop, not indian
   *
   * `hiphop` is the closest *authored* voice: it also leads on `riff-response`
   * and `chant`, and `fragment: 1.6` is the same number. What separates them is
   * that hiphop treats the grid as movable and this genre does not — `displace`
   * 1.5 against 0.35, `diminish` 1.4 against 0.4 — and that the two subset tables
   * are disjoint, hiphop's four entries all living inside the first five degrees
   * while these three reach the sixth and the seventh. A reader who questions a
   * boundary here will question reggae against dancehall and ragga, and those are
   * styles inside this table rather than genres beside it.
   */
  voice: {
    archetypes: [
      ['chant', 4],
      ['riff-response', 4],
      ['long-note', 2.2],
      ['descending-sequence', 2],
      ['arch-hook', 2],
      // `wide-interval` is deliberately unnamed: it is `0.5 + leap × 5` and leap
      // is the field this genre most wants left per style. See the header.
    ],
    subsets: [
      [[0, 2, 3, 4, 6], 5],          // 1 ♭3 4 5 ♭7 minor; 1 3 4 5 ♮7 major, ♭7 on mixolydian
      [[0, 1, 2, 3, 4, 5, 6], 3],    // the whole mode, so the bends are audible
      [[0, 1, 2, 4, 5], 3],          // 1 2 3 5 6 — mento, lovers, nyabinghi major
    ],
    ops: { displace: 0.35, diminish: 0.4, fragment: 1.6, reharmonise: 0.3 },
  },

  /**
   * The scale rule: follow the key, bend one step, and never raise the seventh.
   *
   * Rooted on the tonic and searched outward from the key's own mode so that the
   * smallest possible change is made to admit whatever chord has arrived. What
   * falls out is the harmonic behaviour this music has:
   *
   *     IV major under a minor key  →  dorian       (the "Real Rock" natural sixth)
   *     bII under a minor key       →  phrygian     (rare, and only in a bridge)
   *     bVII under a major key      →  mixolydian   (the borrowed flat seventh)
   *     v minor under a minor key   →  aeolian, unchanged — which is the point
   *
   * ## Where this differs from its two relatives
   *
   * From **iskelmä**: one line, and it is the missing one. iskelmä substitutes
   * harmonic minor the moment a dominant-function chord arrives, and there is no
   * such chord in a minor table anywhere in this genre to substitute under. The
   * seventh stays natural, and `preparedModulation: false` above closes the other
   * door the raised seventh could have come through.
   *
   * From **synth**: the ladder is three modes long rather than six, and the
   * direction of the search is fixed rather than leaning with the mode. Synth's
   * harmony wanders far enough to need a ladder and a tie-break rule; this one has
   * two chords in most of its verses, and a search that could reach lydian would
   * be answering a question the tables never ask. What it *does* need, and what
   * synth's minor lean would get wrong, is that this genre's minor bends
   * **brighter** first: dorian before phrygian, because the natural sixth over a
   * major IV is the most characteristic single note in the repertoire and the flat
   * second is a colour two bridges use.
   *
   * **In major the ban lifts**, and that is a precise claim rather than an
   * inconsistency. Rocksteady and lovers rock came out of American soul and use a
   * real dominant with a real leading tone; `lovers` is where the permission is
   * actually spent, and `styles.ts` says so at that style. The claim this genre
   * makes is "no dominant in minor", not "no dominant" — which is exactly the line
   * synth draws, for a different repertoire, in the same words.
   */
  scaleForChord: (tonic, mode, chord) => {
    const ladder = mode === 'minor' ? MINOR_LADDER : MAJOR_LADDER;
    const tones = chordPcs(chord);
    for (const name of ladder) {
      const scale = makeScale(tonic, name);
      if (tones.every((t) => scale.pcs.includes(t))) return scale;
    }
    // No mode on the list holds this chord. Stay in the key rather than modulate
    // to chase it: a chord tone outside the scale, under a line that did not move
    // to meet it, is a colour — and it is exactly how this music uses the two or
    // three chords it has that do not belong.
    return makeScale(tonic, ladder[0]!);
  },

  /**
   * The yard, the speaker stack and the handbill. See `staging.ts`.
   */
  staging: STAGING,
};
