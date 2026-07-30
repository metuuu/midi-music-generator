/**
 * Synth — vintage electronic music, 1972 to 1990.
 *
 * Vangelis, Jean-Michel Jarre, Kraftwerk, and the Tangerine Dream that had a
 * drum machine. Four bodies of work that share a decade and a shelf of
 * instruments, and that the repo could not previously hold.
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
 *   mix: pad 0.78 over melody 0.55           the tune is on top
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
  id: 'synth',
  label: 'Synth',
  description:
    'Berlin-school sequencers, machine pop, cinematic analogue and cosmic disco — 1972 to 1990.',
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
   * one answer here and the fade is the one that is right for four styles out of
   * five.
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
   * recalls each section; `machine` and `stalker` push it to `earworm`, which is
   * the honest setting for music whose entire proposition is the same four bars
   * again.
   */
  defaultHook: 'catchy',

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
     */
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
   */
  mix: {
    melody: 1.27,
    comp: 0.57,
    bass: 0.82,
    pad: 0.50,
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
};
