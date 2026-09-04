/**
 * Synth — vintage electronic music, 1972 to 1990, and the revival that quotes it.
 *
 * Vangelis, Jean-Michel Jarre, Kraftwerk, and the Tangerine Dream that had a
 * drum machine. Four bodies of work that share a decade and a shelf of
 * instruments, and that the repo could not previously hold.
 *
 * ## And a fourth era that shares none of the shelf
 *
 * `retrowave` is 2005 onward — the night-drive records, the horror synth with a
 * guitarist in it, the television theme nobody commissioned — and it is an era
 * of this genre rather than a genre of its own for the reason this file exists
 * to state. A genre here answers one question, *how does the melody relate to
 * the harmony under it*, and that music answers it exactly as the four above do:
 * follow the key, never raise the seventh, ♭VII where another idiom writes V.
 * Filing it separately would have meant copying `scaleForChord` below into a
 * second file and changing the tempi, which is the definition of a distinction
 * that is not one.
 *
 * What it does not share is the shelf, and `eras.ts` argues that at length: the
 * fourth era invents no instrument, and what makes it an era is the *desk* — the
 * duck, the drive and a room longer than any of these records were mixed in.
 *
 * ## Why this is not ambient with a sequencer
 *
 * One of those four already lives here. `ambient/kosmische` is *Phaedra* and
 * *Rubycon* — one chord for seventeen minutes with a sequencer running over it —
 * and it is correctly placed, because that music answers the question that made
 * `Genre` an abstraction the way the rest of ambient does: the melody comes from
 * the drone. The other four do not. They have tunes, keys, cadences, and choruses
 * that arrive.
 *
 * The distance shows up as seven fields where this genre states the opposite of
 * what ambient states, and ambient states each of them on purpose:
 *
 *   ambient                                  synth
 *   ────────────────────────────────────────────────────────────────────────
 *   mix: pad 0.71 over melody 0.43           the tune is on top
 *   mix: comp 0.5, accompaniment             comp 0.72 — the sequencer co-leads
 *   keyChangeChance 0 in every era           the final lift is a signature move
 *   drumFills false in every style           arrivals are announced
 *   no SoloProfile, asserted                 the lead break is the climax
 *   unresolved-leading-tone disabled         left on; Kraftwerk cadences
 *   one or two chords per eight bars         one chord per two to four
 *
 * ## What this genre does *not* claim
 *
 * It is not a fourth answer to the chord-scale question, and pretending it were
 * would be the kind of overstatement that gets found out later. `scaleForChord`
 * below is close kin to ambient's — near enough that the honest thing is to say
 * so in the file rather than let someone discover the resemblance and conclude
 * the genre was a mistake. The two differ in one real respect and it is written
 * where it happens. Everything that makes this music *sound* different from
 * ambient is in the table above, in the styles, and in the filter.
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
 * The seven-note modes of one tonic, ordered brightest to darkest — each step
 * flattening exactly one degree of the one before it.
 *
 * The same ladder ambient uses, and for the same reason: neighbours differ by a
 * single note, so bending the scale to admit a borrowed chord changes as little
 * as it can. Locrian is absent because a tonic whose own triad is diminished is
 * not a key centre.
 *
 * **Harmonic minor is absent too, and that is this genre's central negative
 * claim.** It is the one line that separates `scaleForChord` here from
 * iskelmä's, which is otherwise the rule this genre uses:
 *
 *     if (mode === 'minor' && chord.dominantFunction)
 *       return makeScale(tonic, 'harmonicMinor');     // iskelmä does this
 *
 * Harmonic minor exists to manufacture a leading tone under a dominant. This
 * music does not have one in minor — where another idiom writes `V`, it writes
 * `bVII`, and the seventh stays natural. That is not a stylistic preference, it
 * is what modal pop after 1970 *is*, and a raised seventh in a minor-key song
 * here would sound like a dance band had walked in. `npm run genres` asserts
 * that it never appears.
 */
const BY_BRIGHTNESS: ScaleName[] = [
  'lydian', 'major', 'mixolydian', 'dorian', 'minor', 'phrygian',
];

/**
 * Forms.
 *
 * Four, and they are four genuinely different pieces of music rather than one
 * with the bars moved around — which is the failure mode a form table falls into
 * when every entry is verse/chorus at a different length.
 *
 * The long one is the reason `solo` appears at all. A Berlin-school side is a
 * sequencer established, a lead entering over it, and the lead taking the piece
 * somewhere — and the middle of those three is a solo section by every
 * definition the engine has, even though nobody in this repertoire would call it
 * one.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  // Machine pop. The shortest sections in the genre and the only real chorus.
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 16 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 16 },
    { kind: 'bridge', bars: 8 }, { kind: 'chorus', bars: 16 },
    { kind: 'outro', bars: 8 },
  ], 5],
  // The long sequencer side: state it, play over it, leave.
  [[
    { kind: 'intro', bars: 16 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 16 },
    { kind: 'solo', bars: 16 }, { kind: 'chorus', bars: 16 },
    { kind: 'outro', bars: 16 },
  ], 5],
  // Cinematic: statement, departure, and the statement again with everything on
  // it. The `bridge` is short on purpose — a departure that outstays its welcome
  // is a second piece, and this form exists to get back.
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 16 },
    { kind: 'bridge', bars: 8 }, { kind: 'chorus', bars: 16 },
    { kind: 'outro', bars: 8 },
  ], 4],
  // The loop. Barely a form, which is the point: an ostinato piece develops by
  // what is laid over it rather than by going anywhere.
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'verse', bars: 16 },
    { kind: 'bridge', bars: 8 }, { kind: 'verse', bars: 16 },
    { kind: 'outro', bars: 8 },
  ], 3],
];

export const synth: Genre = {
  /**
   * Direct, never prepared — the same negative claim as the missing harmonic minor.
   *
   * `keyChangeChance` is non-zero in every era here because the final lift is a
   * signature move, and an applied dominant in front of it would put a leading tone
   * in a minor-key song, which is the one thing this genre asserts never happens.
   * See `tune/keyplan.ts`.
   */
  preparedModulation: false,
  id: 'synth',
  label: 'Synth',
  description:
    'Berlin-school sequencers, machine pop, cinematic analogue, cosmic disco and late-digital arpeggios — 1972 to 1990, and the retrowave that quotes them.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,

  /**
   * Where these records actually live.
   *
   * Chosen the way ambient's are — for *register* rather than for fingering,
   * because nothing here is played by hand either. But the constraint is looser
   * and the reason is worth stating: ambient is picking a fundamental for a
   * drone that has to hold up a whole piece, and this music has a bass line
   * instead, which moves and therefore forgives a wider range. D and A minor
   * dominate because a sequencer figure in either sits with its lowest note
   * around 73–110 Hz, where a synth bass is felt on a small speaker without
   * disappearing on a smaller one.
   */
  keys: {
    minor: [[2, 6], [9, 5], [0, 4], [4, 4], [7, 3], [11, 2], [5, 2]],
    major: [[0, 5], [5, 4], [2, 4], [9, 3], [3, 3], [7, 2]],
  },

  /**
   * It fades.
   *
   * The long-form side of this repertoire ends by being turned down while the
   * sequence carries on, and that is not a production shortcut — it is a
   * statement that the machine was running before the record started and did not
   * stop when it ended. `machine` is the exception in the real world, since
   * Kraftwerk button their songs like the pop records they are, but a genre gets
   * one answer here and the fade is the one that is right for eight styles out
   * of nine — the revival made it the *default*, since a loop that stops is a
   * loop somebody had to write an ending for.
   */
  ending: 'fade',

  /**
   * Nobody counts it in.
   *
   * The count-in is a staging fact: a band in front of people needs to start
   * together. There is no band here. A sequencer is already running when the
   * lights go up, and four clicks in front of it would be a drummer announcing
   * a machine that does not need announcing — the same argument ambient makes,
   * arrived at from the opposite direction. Ambient has no pulse to count; this
   * has a pulse that was never not there.
   */
  countIn: false,

  // The lines are exposed — a sequencer repeats its figure a hundred times and
  // any wrong note in it is heard a hundred times — but the idiom is modal and
  // parallel and the strictest settings would file that off. `standard`, with
  // the overrides below doing the genre-specific work.
  defaultStrictness: 'standard',

  /**
   * Loop music, and it should sound like it. `catchy` locks the rhythm and
   * recalls each section; `machine`, `stalker` and `outrun` push it to
   * `earworm`, which is the honest setting for music whose entire proposition is
   * the same four bars again.
   */
  defaultHook: 'catchy',

  /**
   * The octave-doubled lead is this decade's signature, and trading is not.
   *
   * A synth lead stacked with itself an octave down is so nearly universal in this
   * music that a generator producing it a third of the time is producing something
   * else — hence `unison` at double weight, and it lands in about 28% of numbers,
   * which is as far as a weight can carry it while the device also needs a counter
   * layer to live on.
   *
   * `trade` is the odd one out. Handing a phrase over is a gesture between two
   * people who can hear each other, and this repertoire is overdubbed — the answer
   * comes back on schedule because it was punched in, not because anybody was
   * listening. It stays available, at a weight that keeps it rare.
   *
   * **`riff` is raised and fires rarely, and that is a fact about the styles rather
   * than about this table.** Five of the nine synth styles carry `excludeLayers:
   * ['brass']`, so the layer a riff needs is absent from most of the genre and the
   * weight bites only in the four that keep it — measured at 2% when there were
   * two of those, and the count is the only thing that has changed.
   *
   * That sat awkwardly beside `synth/eras.ts`, which says at length that the brass
   * layer is *not* vestigial here and that a synth-brass stab is a first-class
   * sound of this music. The tension is smaller now and it was resolved from the
   * side that was actually wrong: the missing style was the late-digital one,
   * whose whole palette is built on a `synthBrass2` stab, and adding it gave the
   * era's brass table a reader in the era it belongs to. Still not widened by
   * decree — the three styles that refuse the layer each argue it, and none of
   * those arguments has weakened.
   */
  arrangement: { unison: 6, riff: 5, trade: 1 },

  /**
   * Where this genre disagrees with the shared rule table.
   *
   * The interesting entry is the one that is *absent*.
   */
  ruleOverrides: {
    // Planing a synth-brass voicing up a step is the sound, not a fault. So is
    // the fifths lead, which bakes the interval into the patch and would route
    // around this rule anyway — see `leadFifths` in the catalogue.
    'parallel-perfects': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    // sus2 and sus4 are the harmony here rather than a suspension inside it.
    // The eleventh over a major chord is an avoid note in jazz and the default
    // colour in a Vangelis cue.
    'avoid-fourth': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    // A maj7 pad held for four bars is a colour, not a dissonance under
    // pressure. Softened rather than disabled: a seventh in a *moving* line
    // still owes something.
    'unresolved-seventh': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.7 },

    // A Kraftwerk melody repeats one note more than any rule expects. Softened,
    // not disabled — the rule exists to catch a line that has stalled, and this
    // music can still stall. It just does it later than everything else here.
    'static-repetition': { minLevel: 3, vetoLevel: RULE_DISABLED, penalty: 0.75 },
    'repeated-note-run': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.85 },

    /**
     * `unresolved-leading-tone` is deliberately **not** here.
     *
     * Ambient disables it, because a leading tone is a promise the music will
     * resolve and ambient's whole proposition is that nothing does. This genre
     * makes the opposite claim and it is the sharpest single line between them:
     * in major these songs cadence, and a leading tone left hanging is a fault
     * here exactly as it is in iskelmä. In minor the rule is simply inert,
     * because `scaleForChord` never produces a raised seventh for it to catch —
     * which is a much better way to be modal than switching the rule off.
     *
     * …and this is the entry that says the rest of that sentence out loud.
     *
     * `scaleForChord` never producing the note turned out to be a claim about
     * the *chord scale* and not about the music. Nothing that decorates a line
     * asks the chord scale for permission: the soloist's `chromatic` appetite
     * offers the semitone either side of wherever it is, and one of those is the
     * leading tone. Seventeen songs in two hundred had one — on `berlin`,
     * `machine`, `cosmic` and `stalker`, three of which have no left hand and
     * none of which had changed — while `npm run genres` sampled twenty songs and
     * asserted zero, which it had been passing on luck. Almost all of them are in
     * solo sections, which is the one place this genre improvises.
     *
     * Vetoed from the first level rather than penalised, because this is not a
     * matter of taste that gets stricter: the note is either in this music or it
     * is not, and the genre's whole position is that it is not. `chromatic`
     * stays at 0.08 — the trickle of colour is wanted, and it has eleven other
     * semitones to find it in.
     */
    'chromatic-leading-tone-in-minor': { minLevel: 1, vetoLevel: 1 },
  },

  /**
   * The tune is on top and the sequencer is next to it.
   *
   * The second number is the one that says something. Every other genre here
   * mixes its comp as accompaniment — the thing holding the harmony up behind
   * whatever is in front. In this music the sequencer figure is *material*: it
   * is what the listener came for, it is what they hum afterwards, and on half
   * this repertoire it is playing when nothing else is. 0.57 puts it a step
   * behind the lead rather than a floor beneath it — which is what 0.72 said
   * before the sequencer's own fonts turned out to be 1.27× quiet.
   *
   * Every number here is the one it always was, divided by the mean trim of the
   * pool that layer draws from, so `render/source-levels.ts` did not silently
   * re-mix the genre while making it consistent.
   *
   * The lead is the exception, and it is the one deliberate move: re-centring
   * gives 1.06 and this is 1.5 dB above that. This genre's melody pool is the
   * hottest in the project — `leadSaw`, `leadSquare` and `leadCharang` between
   * them measured 6 to 8 dB above the catalogue median — so calibration cost
   * the typical lead more here than anywhere else, and a synth record is one
   * where the lead is supposed to be uncomfortably in front. Above 1 is not a
   * mistake: a fader is not a ceiling, and the fonts underneath it peak around
   * 0.3.
   *
   * The pad moves with the default rather than away from it — it was never an
   * opinion of this genre's, only the shared bed re-centred on a pool of synth
   * strings, and when that bed came up 2 dB this one had to follow or the
   * calibration would have turned into a mix decision by neglect. It is the
   * furthest back of anywhere here even so, at 0.63 under a lead at 1.0, which
   * is the genre stating that its pad is a wash behind the tune and not a
   * string section.
   */
  mix: {
    // `melody` and `bass` carry the catalogue's 2 dB trim; see `gains` in generate/song.ts
    melody: 1.0,
    comp: 0.57,
    bass: 0.65,
    pad: 0.63,
    counter: 0.50,
    drums: 0.55,
  },

  /**
   * Machines, mixed as machines.
   *
   * The kick is the loudest thing in a drum machine's kit because on the
   * originals it very nearly was — an 808 kick is a long sine that owns the
   * bottom of the mix, and the handclap is the snare's replacement rather than a
   * garnish. The cymbals come down: sampled 8-bit metal is harsh in exactly the
   * band the ear defends, and every record of this decade rode them under.
   */
  drumMix: {
    bd: 1.0, sd: 0.8, rim: 0.6, hh: 0.4, oh: 0.42, cp: 0.72,
    cr: 0.4, rd: 0.35, sh: 0.35, perc: 0.55, cb: 0.6,
    lt: 0.68, mt: 0.68, ht: 0.68,
  },

  /**
   * The sequencer sits under the tune, not beside it.
   *
   * Five semitones lower than the arranger's default ceiling, and this is the
   * one place the genre needs a register statement rather than a level one. A
   * sixteenth-note figure voiced in the lead's own octave does not accompany the
   * lead, it competes with it — two continuous streams in one register fuse, and
   * the ear picks whichever is louder rather than hearing both. Dropping the
   * comp is what lets the mix number above be as high as it is.
   *
   * `response` says the sequencer barely breathes. A drummer plays a chorus
   * harder; a sequencer is a machine running at one voltage, and the arrival is
   * built by the filter opening and by layers coming in, not by the figure
   * getting louder.
   */
  layerPlan: {
    offsets: { comp: -5, pad: -3 },
    response: { comp: 0.25, bass: 0.3, drums: 0.7 },
  },

  /**
   * The filter is the arrangement.
   *
   * This is the field the genre was worth building for. Everywhere else in the
   * project a section arrives because more players start playing; here it
   * arrives because a filter opened over the previous sixteen bars, and no
   * amount of level or layer-count work reproduces that. See
   * `generate/filter.ts`; the per-style `depth` and `shape` decide how much of
   * this each style actually takes.
   *
   * `kind` states only where this genre disagrees with the defaults. The intro
   * is darker than the default because an analogue side opens almost shut and
   * the opening *is* the introduction — and the outro closes further still,
   * because these records end by shutting the filter rather than by stopping.
   */
  filter: {
    kind: { intro: 0.22, verse: 0.55, chorus: 1, bridge: 0.72, solo: 0.95, outro: 0.18 },
    response: { comp: 1, counter: 0.9, pad: 0.75, melody: 0.5, bass: 0.12, drums: 0.2 },
    build: 0.35,
  },

  /**
   * The band does not get out of the way.
   *
   * Jazz thins out under a soloist because comping is a conversation, and its
   * `SoloProfile` says so layer by layer. Here the sequencer running underneath
   * is *the reason the solo works*: the lead is soaring over something, and a
   * rhythm section that dropped back would take away the thing it is soaring
   * over. `full` everywhere, and no trading — four bars of drum machine alone is
   * a breakdown, which is a later decade's gesture.
   */
  soloBacking: 'full',
  /**
   * One lead break and no more. A short form here grows by another verse and
   * chorus; left to the default it grew by solo choruses, and a fifth of
   * `darksynth` came out as four of them in a row.
   */
  maxSolos: 1,
  solo: {
    rotation: [['melody', 6], ['counter', 3], ['comp', 2]],
    tradeFours: 0,
    // The tune comes back inside the solo more often than in jazz, because
    // these are themes rather than changes — the audience is following a melody
    // and a solo that never refers to it has changed the subject.
    quoteMotto: 0.5,
    backing: { melody: 'full', counter: 'full', comp: 'full' },
    vocabulary: {
      // A quarter-note gait, not an eighth. A synth lead is a singing
      // instrument in this repertoire — long notes, wide intervals, bends —
      // and a stream of eighths on it is a keyboard player warming up.
      gait: 0.75,
      doubleTime: 0.1,
      // The accent belongs to the sequencer, which is not going to move.
      offbeatAccent: 0.15,
      enclosure: 0.1,
      // Almost none. The line lives in the mode; a chromatic approach note here
      // sounds like a mistake rather than like sophistication, because there is
      // no dominant for it to be approaching.
      chromatic: 0.08,
      ornament: 0.15,
      // High. A lead over an unmoving sequence has nothing to develop against
      // except itself, and a solo that keeps inventing over a four-bar loop is
      // noise on top of a pattern rather than a line.
      develop: 0.8,
      displace: 0.25,
      space: 0.3,
      // Five semitones across the chorus — the widest in the project. The
      // gesture this music is built on is a line that keeps rising.
      climb: 5,
      paraphrase: 0.25,
      // It lifts. This is the Vangelis ending and the reason the form has a
      // final statement to return to.
      liftIntoReturn: 0.7,
    },
  },

  /**
   * A large plate and a dotted-eighth echo.
   *
   * The delay length is a genre convention rather than a preference, and it is
   * the same one ambient states: three sixteenths against a four-beat bar never
   * lands where the beat does, which is why every echo in this music has used it
   * since the first tape units. The feedback is higher here — an echo that
   * repeats twice is an effect, and one that repeats six times is a second
   * sequencer.
   */
  space: {
    reverbSize: 0.7,
    delayBeats: 0.75,
    delayFeedback: 0.52,
  },

  /**
   * Standing production notes, refined by each era.
   *
   * The bass stays dry for the reason it does everywhere: reverb on a sustained
   * low tone arrives while the note is still sounding and the two beat against
   * each other. The comp is the wet one — a sequencer *through the echo* is the
   * sound, and running it dry produces a correct figure that nobody would
   * recognise.
   */
  effects: {
    comp: { reverb: 0.5, delay: 0.42, lowpass: 6500 },
    counter: { reverb: 0.6, delay: 0.5, lowpass: 6000 },
    melody: { reverb: 0.55, delay: 0.3, lowpass: 8000 },
    pad: { reverb: 0.75, lowpass: 5200 },
    bass: { reverb: 0.06, lowpass: 1400 },
    drums: { reverb: 0.3, lowpass: 4500 },
    vocal: { reverb: 0.6, delay: 0.25, lowpass: 6000 },
  },

  // Two and a half to five minutes. Long enough for a sequence to establish and
  // change, short enough to sit in a rotation — the same compromise ambient
  // makes, one notch longer because this music has somewhere to get to.
  duration: [150, 300],

  /**
   * The kit announces things. Ambient's does not, and that is one of the seven
   * differences at the top of this file.
   *
   * A tom roll into a crash is a dance-band gesture and it belongs here in
   * moderation: this is machine music and a drum machine fill is a *programmed*
   * event, which is why `lead-in` and `drop` carry as much weight as the roll.
   * `stalker` turns them off entirely.
   */
  fills: [
    ['tom-roll', 4], ['lead-in', 3], ['drop', 3], ['snare-roll', 2],
  ],

  /**
   * What the tune is made of, before a style has its say.
   *
   * `berlin` is one of the three authored voices in `tune/voice.ts` and returns
   * before this field is ever consulted, so what follows governs the other
   * eight: `cinematic`, `machine`, `cosmic`, `stalker`, `optical`, and the three
   * revival styles `outrun`, `darksynth` and `boulevard`. Three keys only —
   * which kinds of tune, which degrees, what this music does to a figure — and
   * the counting stays with the styles, where it has to be. `melody.span` runs
   * from machine's seven semitones to cinematic's nineteen and `melody.ornament`
   * from 0.02 to boulevard's 0.14; a genre-wide number would average away the
   * distinction those tables were written to make.
   *
   * ## Which kinds
   *
   * **`chant` leads, and it is the one archetype derivation cannot see.**
   * `archetypesFor` computes it from cell density alone — 0.50 on `cinematic`
   * and `stalker` to 0.98 on `optical` — and density says nothing about whether
   * the same note comes back. Two rule overrides above exist for exactly that,
   * `static-repetition` and `repeated-note-run`, softened because *a Kraftwerk
   * melody repeats one note more than any rule expects*; `machine`'s own header
   * says the tune is *four or five notes stated exactly the same way every
   * time*, which is `chant`'s gloss — *one note repeated with a tail*.
   *
   * `arch-hook` is left where derivation puts it, at 3, and the reason is worth
   * stating rather than leaving as a non-decision: `climb: 5` is the widest
   * chorus rise in the project and `liftIntoReturn: 0.7` is the Vangelis ending,
   * so the rising gesture is certainly here — but it is a *held* rise, and
   * `long-note`'s own shape table leads with `climb-hold`. Raising both would
   * count the same fact twice.
   *
   * **`long-note` at 2.5 is a lift for five styles whose own cells say the
   * opposite, and that has to be said out loud.** Derivation reads it off
   * density and gives `cinematic` 2.09, `stalker` 2.41 and `outrun` 1.71 — all
   * three of their melody cell tables lead with `[16]` — against `machine` 0.63,
   * `cosmic` 0.53 and a floor of 0.40 on `optical`, `darksynth` and
   * `boulevard`, because those declare the densest melody cells in the genre at
   * 3.00, 3.25 and 3.50 onsets a bar. So 2.5 barely moves the first three and
   * roughly quadruples the rest. What argues for the lift genre-wide is where
   * the phrases *end*: `[16]`, a whole bar on one note, is the top-weighted
   * cadence cell in every style here — berlin 6, cinematic 7, machine 6, cosmic
   * 5, stalker 7, optical 5, outrun 6, darksynth 5, boulevard 5. A held note is
   * what these tunes arrive on even in the styles that move on the way there,
   * and the two busiest tables in the genre are both revival styles that still
   * land on one. It is not evidence that the lead is sparse, and a weight above
   * every derived value would have been claiming that against five tables that
   * deny it.
   *
   * `wide-interval` at 2 sits at the top of the derived range rather than over
   * it, which is `0.5 + leap * 5`: `machine` 1.00 to `darksynth`'s 2.00, the
   * widest appetite in the genre and the reason this line used to read *just
   * over*. `solo.vocabulary` above says *a
   * synth lead is a singing instrument in this repertoire — long notes, wide
   * intervals, bends*; that paragraph governs the improvised solo rather than
   * the composed tune, but the claim inside it is about the instrument, and
   * `eras.ts` puts `glide` on the *melody* patch in two eras, 1.5 and 2.5
   * semitones, which is that sentence's *bends* on the line this field governs.
   * `ARCHETYPES['wide-interval']` glosses itself *a singer's tune — it leaps out
   * and steps home*. The declared `leap` numbers are low, 0.1 to 0.30, and that
   * is why this is 2 rather than 3. `unison` at 6 is not evidence either way: an
   * octave-doubled lead is *two players stating the tune together*, a doubling
   * of the whole line, which says nothing about the intervals inside it.
   *
   * `riff-response` at 1.2 clears the genre's lowest derived value (`cinematic`
   * 1.16) and sits under the other seven, up to `darksynth`'s 1.94. The genre's
   * prose invites pushing it far lower — `stalker` spaces its counter two beats
   * because *what replies to an ostinato is a shape in the distance* — but
   * `optical` runs the other way and argues it at length: `counterMode` stays at
   * the default `answer`, *the bell echoing the lead a bar later… an answer, not
   * an ostinato*, which is this archetype's own gloss. Two of the eight want it
   * now, `darksynth` being a style whose lead *is* a riff, so the weight has to
   * leave room. `arrangement.trade: 1` is not evidence
   * here: `trade` is a device *between two players*, and `riff-response` is the
   * shape of one line.
   *
   * **`descending-sequence` is pushed down, and that is a correction rather than
   * a preference.** `archetypesFor` reads `melody.sequence` as an appetite for
   * walking a figure *down* the scale, computing `1 + sequence * 3` — 2.05 to
   * 3.70 here, the genre's second-heaviest derived archetype. In this genre that
   * number means the same figure *again*, which is why the weight it loses is
   * the weight `chant` above carries. The descending tetrachord is real — four
   * of the eight this governs walk `i–VII–VI` a chord to the bar, `outrun`
   * having joined them with a progression whose note says exactly that, and
   * `berlin` besides — so 2 rather than nothing, but it is a colour here.
   *
   * ## Which degrees
   *
   * `[0,1,3,4,6]` is 1̂ 2̂ 4̂ 5̂ 7̂: `isus2`, `isus4` and the ninth spelled as a
   * scale. `styles.ts` opens by saying sus2, sus4 and the ninth *are the
   * vocabulary, not the garnish*, and `avoid-fourth` is disabled above because
   * the eleventh is *the default colour in a Vangelis cue*. Degree 1 is also
   * where the Phrygian ♭II lands — the interval `scaleForChord` below leans
   * towards on purpose, and *Carpenter's entire harmonic vocabulary in one move*.
   *
   * **It does not lead alone, and the reason is the neighbour this file spends
   * its first forty lines separating from.** Ambient opens its `subsets` with
   * the same degrees at the same 5 of 12 and argues them from `SUBSETS`' own
   * *modal, no third to commit you*: a line without a third survives a harmony
   * that never settles. This one settles. The header above says these records
   * have *tunes, keys, cadences, and choruses that arrive*, `modeWeights` is
   * stated per style, and the chords are `i9`, `iv9`, `VImaj7`, `IIImaj7`,
   * `bIImaj7` — every one of which has the third in it. So `[0,2,3,4,6]`, the
   * minor pentatonic in minor and the subset that *does* carry the third, comes
   * up level with it at 4. Five of the eight this governs draw minor at 0.55 or
   * above — `cinematic` 0.55, `machine` 0.65, `outrun` 0.9, `stalker` 0.92,
   * `darksynth` 0.95 — and the two genres stop drawing from one distribution
   * two thirds of the time.
   *
   * `[0,1,2,4,5]` is for the three that lean major — `boulevard` at 0.65,
   * `cosmic` at 0.6, `optical` at
   * 0.55 — and for `machine`'s 1974 table, whose own note says it *would be a
   * folk song if a person were singing it*. The full diatonic stays on at 2 as
   * the only subset here holding both the fourth and the sixth, which is what
   * `cinematic`'s `iv9` → `VImaj7` needs under a line. Reaching the seventh is
   * not what it is for: three of these four already do.
   *
   * ## What it does to a figure
   *
   * `voiceForStyle` merges `ops` by key, so every entry below replaces a
   * per-style reading for all eight, and two ops are absent because that trade
   * is a bad one. `sequence` spans 0.35 on `boulevard` to 0.9 on `machine`,
   * which is the difference between a tune somebody wrote at a keyboard and one
   * that is the bass line's passenger. `displace` derives from
   * `melody.syncopation`, 0.05 on `machine` against 0.40 on `optical` and
   * `boulevard` — the widest per-style gap in the genre's melody table, and
   * `optical`'s header calls its line *more
   * syncopated* than `berlin`'s in as many words. Derivation is reading the
   * right field in both cases.
   *
   *   ornament 0.2    under derivation's floor rather than under its reading:
   *                   `0.4 + ornament * 3` on a genre declaring 0.02 to 0.12 is
   *                   0.46 to 0.76, nearly all constant. The decoration here is
   *                   a delay line — `delayBeats: 0.75`, `melody.delay` 0.3 —
   *                   and not a turn. Also `solo`'s `chromatic: 0.08`.
   *   diminish 0.3    derivation's constant with the syncopation term cancelled,
   *                   and the cancelling is the decision: where a note falls is
   *                   not an argument for halving its value. This is `opsFor`'s
   *                   only route to a fast passage, `doubleTime` is 0.1, and the
   *                   comp is already in sixteenths five semitones down so it
   *                   will not fuse with the lead — a lead that halves its
   *                   values climbs back into it.
   *   augment  1.4    the `[16]` cadence cell argued under *which kinds*, taken
   *                   as an appetite rather than as a kind of tune: the same
   *                   fact about phrase ends, spent on the other axis.
   *                   Derivation never sets this one at all.
   *   reharmonise 0.5 the header's own row, *one chord per two to four* bars. A
   *                   figure here plays over two chords and comes home on the
   *                   third, and one refitted to every change would be a
   *                   different kind of record.
   *   transpose 1.7   the same source field as `sequence` and not the same job,
   *                   which is why one is flat and the other absent. `opsFor`'s
   *                   `repeat` case falls through to *this* appetite for the
   *                   verbatim option — the empty op list, scored through
   *                   `ops[0]?.op ?? 'transpose'` — so this is what buys a
   *                   chorus that comes back note for note, which is
   *                   `defaultHook: 'catchy'` plus `earworm` on `machine` and
   *                   `stalker`. Inside the `sequence` intent the per-style
   *                   spread survives regardless, because it lives in the ratio
   *                   against `sequence`, which is still derived.
   */
  voice: {
    archetypes: [
      ['chant', 3.5],
      ['arch-hook', 3],
      ['long-note', 2.5],
      ['descending-sequence', 2],
      ['wide-interval', 2],
      ['riff-response', 1.2],
    ],
    subsets: [
      [[0, 1, 3, 4, 6], 4],
      [[0, 2, 3, 4, 6], 4],
      [[0, 1, 2, 4, 5], 2],
      [[0, 1, 2, 3, 4, 5, 6], 2],
    ],
    ops: {
      transpose: 1.7,
      augment: 1.4,
      reharmonise: 0.5,
      diminish: 0.3,
      ornament: 0.2,
    },
  },

  /**
   * The scale rule: follow the key, and never raise the seventh.
   *
   * Rooted on the tonic and bent to admit whatever the chord underneath is,
   * searching outward from the key's own mode so the smallest possible change is
   * made. What falls out is the harmonic behaviour this music has:
   *
   *     bVII under a major key  →  mixolydian    (the borrowed flat seventh)
   *     bVI  under a major key  →  aeolian       (mode mixture)
   *     IV   under a minor key  →  dorian        (the natural sixth)
   *     bII  under a minor key  →  phrygian      (the Carpenter semitone)
   *
   * ## Where this differs from ambient's, and where it does not
   *
   * Not in its shape: ambient searches the same ladder for the same reason, and
   * this file says so at the top rather than dressing up a shared idea as a new
   * one. It differs in **which way it breaks a tie**, and that turns out to
   * matter more than it sounds like it should.
   *
   * Ambient always leans brighter, because its business is open sound. This
   * genre leans the way its own mode already leans: a major key takes the
   * brighter of two candidates and a minor key takes the darker. So a chord
   * reachable in both directions from A minor lands on phrygian rather than
   * dorian — and the flattened second that produces is the single most
   * recognisable interval in the dark half of this repertoire, the one every
   * synthesiser horror score is built out of. Reaching for it is the difference
   * between a minor key and *this* minor key.
   *
   * The tonic does move, unlike ambient's: a lifted final chorus arrives here
   * with a transposed tonic and this rule follows it without complaint. That is
   * the other half of `keyChangeChance` being non-zero in every era.
   */
  scaleForChord: (tonic, mode, chord) => {
    const home = BY_BRIGHTNESS.indexOf(mode === 'minor' ? 'minor' : 'major');
    const tones = chordPcs(chord);
    // Minor reaches down the ladder first, major reaches up. See above.
    const lean = mode === 'minor' ? 1 : -1;

    for (let distance = 0; distance < BY_BRIGHTNESS.length; distance++) {
      const candidates = distance === 0
        ? [home]
        : [home + lean * distance, home - lean * distance];
      for (const index of candidates) {
        const name = BY_BRIGHTNESS[index];
        if (!name) continue;
        const scale = makeScale(tonic, name);
        if (tones.every((t) => scale.pcs.includes(t))) return scale;
      }
    }

    // No mode of the tonic holds this chord. Stay in the key rather than
    // modulate to chase it: an out-of-scale chord tone under a line that stayed
    // put is a colour, and it is how this music uses the few chords it has that
    // do not belong.
    return makeScale(tonic, mode === 'minor' ? 'minor' : 'major');
  },

  /**
   * The hall, the equipment and the programme — the one genre whose staging was
   * written rather than moved, because it had none. See `staging.ts`.
   */
  staging: STAGING,
};
