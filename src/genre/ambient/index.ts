/**
 * Ambient.
 *
 * The third answer to the question that made `Genre` an abstraction: where
 * does the melody get its notes?
 *
 * Iskelmä answers "from the key" and jazz answers "from the chord". Ambient
 * answers "from the drone" — there is one tonal centre for the whole piece and
 * it never moves, and a chord is a colour that passes underneath it rather than
 * something the line re-orients around. `scaleForChord` below implements
 * exactly that: it always returns a scale rooted on the *tonic*, and only
 * chooses which mode of the tonic by asking which one happens to contain the
 * chord.
 *
 * The consequence worth stating is what the rule refuses to do. It can never
 * return harmonic minor, because harmonic minor exists to manufacture a leading
 * tone, and a leading tone is a promise that the music will resolve. Ambient
 * does not resolve; that is the genre. A ♭II under an A-minor drone bends the
 * line to A phrygian, a ♭VI under a C-major one bends it to C aeolian, and in
 * both cases the tonic is still A and still C. Nothing modulates, ever.
 */

import { chordPcs } from '../../core/chord.js';
import { makeScale, type ScaleName } from '../../core/scale.js';
import { RULE_DISABLED } from '../../generate/constraints.js';
import type { Genre, FormStep } from '../types.js';
import { STYLES } from './styles.js';
import { ERAS } from './eras.js';
import { MOODS } from './moods.js';
import { VOCALS } from './vocals.js';
import { generateTitle } from './titles.js';

/**
 * The seven-note modes of one tonic, ordered brightest to darkest — which is
 * to say ordered by the circle of fifths, each step flattening exactly one
 * degree of the one before it.
 *
 * Ordering them this way is what makes "nearest mode" a meaningful idea:
 * neighbours here differ by a single note, so bending the scale to admit a
 * chord changes as little as it possibly can. Locrian is deliberately absent —
 * its flat fifth makes the tonic itself unstable, and a drone whose own tonic
 * chord is diminished is not a drone.
 */
const BY_BRIGHTNESS: ScaleName[] = [
  'lydian', 'major', 'mixolydian', 'dorian', 'minor', 'phrygian',
];

/**
 * Sections are long and there are few of them. The kinds keep their names for
 * the sake of every other part of the engine, but they mean texture stages
 * here rather than song parts: `intro` is the bare drone, `verse` adds the
 * line, `chorus` is the fullest the piece gets, `bridge` is the one harmonic
 * departure, `outro` thins back out.
 *
 * No `solo` sections anywhere. A blowing chorus is a jazz idea and there is
 * nothing in ambient it corresponds to.
 *
 * The genre also carries no `SoloProfile`, and the two facts have to agree:
 * a form with a solo section and no profile would put the lead layer on the
 * counter instrument and call it a solo, which is the behaviour the solo
 * engine exists to replace. `npm run genres` asserts both halves — no solo
 * section is ever generated, and no `Section.solo` is ever set — because this
 * is a negative claim and negative claims are the ones an innocent edit
 * quietly undoes. A genre that refuses to have a foreground is a genre whose
 * staging has to mean something else; see `docs/concert-plan.md` §4.3.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'verse', bars: 16 },
    { kind: 'chorus', bars: 16 }, { kind: 'verse', bars: 16 },
    { kind: 'outro', bars: 8 },
  ], 5],
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 16 },
    { kind: 'bridge', bars: 16 }, { kind: 'chorus', bars: 16 },
    { kind: 'outro', bars: 8 },
  ], 4],
  // The one that barely has a form at all: five equal blocks that drift into
  // one another, with a single departure two thirds of the way through.
  [[
    { kind: 'intro', bars: 16 },
    { kind: 'verse', bars: 16 }, { kind: 'verse', bars: 16 },
    { kind: 'bridge', bars: 16 }, { kind: 'verse', bars: 16 },
    { kind: 'outro', bars: 16 },
  ], 4],
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'bridge', bars: 8 }, { kind: 'chorus', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'outro', bars: 8 },
  ], 3],
];

export const ambient: Genre = {
  id: 'ambient',
  label: 'Ambient',
  description: 'Hauntology, wasteland drone, pure drone, Berlin-school sequencers, sacred minimalism and deep ambient techno.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,
  keys: {
    // Chosen for *register*, not for fingering — nothing here is played by
    // hand. A drone lives or dies on where its fundamental sits: too low and
    // it is mud on any speaker smaller than a room, too high and it stops
    // reading as a floor for the music to stand on. C through F, and their
    // relatives, put the bass root between roughly 65 and 90 Hz, which is
    // where a sustained tone is felt without swallowing everything above it.
    minor: [[2, 5], [9, 5], [4, 4], [0, 4], [7, 3], [11, 3], [5, 2], [10, 2]],
    major: [[0, 5], [5, 5], [2, 4], [7, 4], [10, 3], [3, 3], [9, 2]],
  },

  // The rules exist to stop a line sounding wrong, and this line has a lot of
  // time to be heard in — a note that lasts four seconds is exposed in a way a
  // passing eighth never is. `standard` rather than `light`, and the two styles
  // where everything sustains at once (`drone`, `choral`) raise it further.
  defaultStrictness: 'standard',

  // Ambient is loop music. The same eight bars come round again with something
  // different on top, and a section that arrived with a fresh tune every time
  // would be a suite rather than a piece. `catchy` locks the rhythm and recalls
  // every section; `drone` pushes it to the top and `wasteland` pulls it back,
  // which between them is most of the distance across the genre.
  defaultHook: 'catchy',

  /**
   * Where ambient disagrees with the shared rule table.
   *
   * The table was written from classical voice-leading and general arranging
   * practice, and most of it survives the move — a leap of a seventh is
   * unplayable in any idiom. But a handful of rules encode assumptions this
   * music explicitly rejects, and enforcing them produces something that
   * sounds like a slow ballad rather than like ambient.
   */
  ruleOverrides: {
    // The load-bearing one. Ambient has no dominant function; where a chord on
    // the fifth appears at all it is minor, and asking a line to resolve its
    // leading tone is asking for the one gesture the genre is defined by not
    // making.
    'unresolved-leading-tone': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    // A seventh here is a colour in a held chord, not a dissonance under
    // pressure. `i9` sustained for eight bars does not owe anyone a resolution.
    'unresolved-seventh': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.7 },

    // Parallel motion is the texture. Planing a voicing up a step, organum in
    // fifths, a pad moving in blocks — all parallel by construction, and all
    // idiomatic rather than faulty.
    'parallel-perfects': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    // The eleventh over a major chord is an *avoid* note in jazz and the
    // default sound here: sus2, sus4 and quartal voicings are what open
    // harmony is made of.
    'avoid-fourth': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    // Repetition is not monotony in this idiom, it is the form. A line that
    // sounds the same pitch four times over sixteen seconds is a pulse, and the
    // rule exists to catch a melody that has stalled — which is a different
    // thing that ambient has no way of doing, because it is barely moving on
    // purpose.
    'static-repetition': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },
    'repeated-note-run': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.85 },

    // The dark end of this genre is built out of the semitone: a ♭II leaning
    // on a drone from above is the wasteland sound, and the ♭9 it creates
    // against the pedal is the point rather than an accident. Kept as a mild
    // preference at the smoothest setting only.
    'flat-nine': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.6 },
  },

  /**
   * The pad is the piece.
   *
   * Every other genre here mixes a dance band: the tune on top, the pad a long
   * way behind it holding the harmony up. Ambient is the same three layers in
   * the opposite order, and the numbers below are a statement about the music
   * rather than a taste in mixing — a melody louder than the texture it sits
   * in is simply a different genre played slowly.
   */
  mix: {
    pad: 0.78,
    comp: 0.5,
    bass: 0.72,
    melody: 0.55,
    counter: 0.4,
    // The kit, where there is one, is a texture at the back of the room rather
    // than the thing keeping everyone together. Less than half the level every
    // other genre gives it.
    drums: 0.34,
  },

  /**
   * And quieter still where it would poke out.
   *
   * Turning the whole kit down is not the same as making it sit back, because
   * the voices do not all misbehave equally. A hat is a burst of energy at 8
   * kHz, exactly where hearing is sharpest, so it stays audible long after the
   * kick has vanished — an ambient kit turned down uniformly becomes a
   * disembodied tick. The transients come off hardest and the low end is left
   * nearly alone, since a soft kick is most of what makes a beat feel like
   * weather rather than timekeeping.
   */
  drumMix: {
    bd: 0.85, sd: 0.4, rim: 0.35, hh: 0.18, oh: 0.2, cp: 0.3,
    cr: 0.25, rd: 0.22, sh: 0.2, perc: 0.45, cb: 0.25,
    lt: 0.5, mt: 0.5, ht: 0.5,
  },

  // A large, slow room and a dotted-eighth echo. The delay length is the one
  // number here that is a genre convention rather than a preference: three
  // sixteenths against a four-beat bar never lands where the beat does, which
  // is why every echo in this music has used it since the first tape units.
  space: {
    reverbSize: 0.78,
    delayBeats: 0.75,
    delayFeedback: 0.42,
  },

  /**
   * The genre's standing production notes, true whichever decade an era is
   * pretending to be from. Eras refine these; nothing here is absolute.
   *
   * Two of them carry most of the weight:
   *
   *  - **The bass stays dry.** Reverb on a sustained low tone is the fastest
   *    way to turn a floor into mud — the tail arrives while the note is still
   *    sounding and the two beat against each other. Everything above it can be
   *    as wet as it likes precisely because the bottom is not.
   *  - **The kit is filtered, not just quiet.** A lowpass at 2 kHz is what
   *    turns a drum machine into something heard through a wall, and it does
   *    the job that pulling the fader down cannot: a quiet hat is still a hat,
   *    a filtered one is air.
   */
  effects: {
    pad: { reverb: 0.85, lowpass: 5000 },
    comp: { reverb: 0.7, lowpass: 6000 },
    melody: { reverb: 0.72, delay: 0.28, lowpass: 7000 },
    counter: { reverb: 0.85, delay: 0.35, lowpass: 6000 },
    bass: { reverb: 0.1, lowpass: 1200 },
    drums: { reverb: 0.45, lowpass: 2000 },
    vocal: { reverb: 0.9, lowpass: 5000 },
  },

  // Three to five and a half minutes. Long by the standards of everything else
  // here and short by the standards of the genre, which is a deliberate
  // compromise: this has to work in a rotation.
  duration: [190, 340],

  /**
   * The drone rule.
   *
   * Always rooted on the tonic. The mode is whichever of the seven-note modes
   * of that tonic sits closest to home while still containing every note of
   * the chord — searched outward from the key's own mode, brighter side first,
   * so a chord that could be admitted in two directions takes the lighter one.
   *
   * What falls out of it is exactly the harmonic behaviour this music has:
   *
   *   ♭VII under a major drone  →  mixolydian on the tonic
   *   ♭VI  under a major drone  →  aeolian    on the tonic  (the Boards of
   *                                                          Canada mixture)
   *   IV   under a minor drone  →  dorian     on the tonic
   *   ♭II  under a minor drone  →  phrygian   on the tonic  (the wasteland)
   *
   * In every case the tonal centre is untouched. The chord recolours the scale
   * and the drone underneath never notices.
   */
  scaleForChord: (tonic, mode, chord) => {
    const home = BY_BRIGHTNESS.indexOf(mode === 'minor' ? 'minor' : 'major');
    const tones = chordPcs(chord);

    for (let distance = 0; distance < BY_BRIGHTNESS.length; distance++) {
      // Brighter first: given a choice, this music leans toward the open sound.
      const candidates = distance === 0 ? [home] : [home - distance, home + distance];
      for (const index of candidates) {
        const name = BY_BRIGHTNESS[index];
        if (!name) continue;
        const scale = makeScale(tonic, name);
        if (tones.every((t) => scale.pcs.includes(t))) return scale;
      }
    }

    // No mode of the tonic holds this chord — a genuinely chromatic sonority,
    // which these tables do not contain. Stay home rather than modulate: an
    // out-of-scale chord tone under an unmoved drone is a colour, and chasing
    // it would be the one thing this rule exists to prevent.
    return makeScale(tonic, mode === 'minor' ? 'minor' : 'major');
  },
  /**
   * Ambient mostly has no kit at all, and the styles that do should not
   * announce anything — the idiom's whole proposition is that sections arrive
   * without being signposted. Where a fill happens it is a shape, not a roll.
   */
  fills: [
    ['drop', 6], ['lead-in', 3], ['rim', 2],
  ],
};
