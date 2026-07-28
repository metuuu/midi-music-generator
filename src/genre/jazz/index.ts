/**
 * Jazz.
 *
 * The important difference from iskelmä is not the chords, it is where the
 * melody gets its notes. Iskelmä melody is *key*-relative — one scale for the
 * whole song. Jazz melody is *chord*-relative: each chord quality implies its
 * own scale and the line re-orients bar by bar. That is chord-scale theory, and
 * it is the reason a jazz line played over the same progression as an iskelmä
 * line sounds like a different music rather than the same music with sevenths.
 */

import { isAlteredDominant } from '../../core/chord.js';
import { pc } from '../../core/pitch.js';
import { makeScale } from '../../core/scale.js';
import { RULE_DISABLED } from '../../generate/constraints.js';
import type { Genre, FormStep } from '../types.js';
import { STYLES } from './styles.js';
import { ERAS } from './eras.js';
import { MOODS } from './moods.js';
import { VOCALS } from './vocals.js';
import { generateTitle } from './titles.js';

/**
 * Head–solos–head. `verse` is the A section and `bridge` is the B, so an AABA
 * chorus is four sections. Styles with a fixed chorus length (the blues, at
 * twelve bars) have these eight-bar units rewritten by the form builder.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  // Full AABA: head, a chorus of solos, head again.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 }, { kind: 'bridge', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'solo', bars: 8 }, { kind: 'solo', bars: 8 }, { kind: 'solo', bars: 8 }, { kind: 'solo', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 }, { kind: 'bridge', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 4],
  // Half-chorus of solos — shorter, better for a radio rotation.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 }, { kind: 'bridge', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'solo', bars: 8 }, { kind: 'solo', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'bridge', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 5],
  // Simple AB head with two solo choruses — the natural fit for the blues.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 },
    { kind: 'solo', bars: 8 }, { kind: 'solo', bars: 8 },
    { kind: 'verse', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 5],
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'solo', bars: 8 }, { kind: 'solo', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 3],
];

export const jazz: Genre = {
  id: 'jazz',
  label: 'Jazz',
  description: 'Swing, bebop, ballads, bossa nova, blues, modal and gypsy jazz.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,
  keys: {
    // Horn keys, not guitar keys — jazz lives in flats because the trumpet and
    // tenor are transposing instruments and Bb/Eb sit best under the fingers.
    major: [[10, 5], [5, 5], [3, 4], [0, 4], [8, 3], [7, 3], [1, 2]],
    minor: [[0, 4], [2, 4], [7, 4], [5, 4], [10, 3], [9, 3], [4, 2]],
  },
  // The rules exist to stop a line wandering; jazz wanders on purpose. Only the
  // genuinely unplayable intervals are worth blocking here, and bebop turns
  // even that off via its own style override.
  // The head goes out on a held chord, and the count-in is so much a part of
  // the idiom that it survives onto the records — a stick count is the first
  // thing on more jazz sides than anybody bothers to notice.
  ending: 'button',
  countIn: true,

  defaultStrictness: 'light',

  // The head should come back recognisably — that is what makes it a head — but
  // jazz keeps its repetition in the form rather than in the phrase, and the
  // solos are exempt from recall at every level. `loose` gives the harmony that
  // consistency without locking rhythms or narrowing the vocabulary.
  defaultHook: 'loose',

  // The rhythm section reacts to a soloist rather than running its pattern at
  // them. This is what "comping" means and it is not optional in the idiom —
  // a jazz band that plays the head arrangement under a blowing chorus is a
  // jazz band playing a backing track.
  soloBacking: 'comping',

  /**
   * Improvisation, and the reason the solo engine is worth building.
   *
   * The rotation is the bandstand's: the front-line horn first, then whoever
   * is comping, then the second horn, and — rarely, because they are rare —
   * the bass and the kit. `planSolos` refuses to give anyone two choruses in a
   * row and refuses to open the blowing on the drums, so this table only has
   * to say who is *available* and how often.
   *
   * The vocabulary numbers are where the idiom actually lives:
   *
   *  - `offbeatAccent` at 0.9. Swung eighths with the weight on the *and* is
   *    most of what separates a jazz line from the same pitches played
   *    correctly. Nothing else in this generator accents off the beat.
   *  - `enclosure` at 0.55. Approaching a guide tone from above and below is
   *    the single most characteristic bebop gesture, and it is chromatic by
   *    construction — which is why `chromatic-tone` is disabled in the rule
   *    overrides above rather than why the solo engine ignores the rules.
   *  - `develop` at 0.72. High, because the difference between a solo and a
   *    string of licks is whether the second phrase is *about* the first.
   *  - `space` at 0.22, which comes out as a quarter of the chorus's beats
   *    having nothing start in them once the phrase gaps and the two bars the
   *    arc hands back are counted. Lower and the line never stops; higher and
   *    it stops being a chorus and starts being a series of remarks.
   *  - `paraphrase` at 0. Jazz states the head and then leaves it. A solo that
   *    ornaments the tune is a different genre's break.
   */
  solo: {
    rotation: [['melody', 6], ['comp', 4], ['counter', 3], ['bass', 1.5], ['drums', 1]],
    // Better than half the time, and never every time. See `tradeFours`.
    tradeFours: 0.6,
    // Not every chorus, and never more than one quote in a chorus: the point of
    // hearing the tune's figure in the solo is that it is unexpected.
    quoteMotto: 0.4,
    backing: {
      melody: 'comping', counter: 'comping', comp: 'comping',
      // A bass solo thins the backing to almost nothing — comp out, drums to
      // brushes. That contrast *is* the bass solo, and a bass solo staged badly
      // is worse than not having one, because the audience cannot hear it.
      bass: 'sparse',
      drums: 'trade',
    },
    vocabulary: {
      gait: 0.5,
      doubleTime: 0.22,
      offbeatAccent: 0.9,
      enclosure: 0.55,
      chromatic: 0.5,
      // Zero, and not an oversight. A bebop player's decoration is the
      // chromatic approach note; a crushed grace before the beat is a
      // dance-band gesture and belongs to the genre that owns it.
      ornament: 0,
      develop: 0.72,
      displace: 0.5,
      space: 0.22,
      climb: 3,
      paraphrase: 0,
      // The head comes back with a tune of its own; a soloist still climbing
      // into it is playing over it.
      liftIntoReturn: 0.12,
    },
  },

  /**
   * Where jazz disagrees with the shared rule table.
   *
   * The table was written from classical voice-leading and general arranging
   * practice. Most of it transfers — a minor ninth against a held chord tone is
   * sour in any idiom — but several rules encode conventions jazz simply does
   * not hold, and enforcing those produces music that is correct and wrong.
   */
  ruleOverrides: {
    // A jazz line is under no obligation to resolve its leading tone upward.
    // Bebop routinely descends from the 7th, and the "resolution" of a ii–V is
    // carried by the guide tones in the comp, not by the melody.
    'unresolved-leading-tone': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    // Chromaticism is the vocabulary, not a defect: approach notes, enclosures
    // and blue notes are all chromatic by definition.
    'chromatic-tone': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    // Leaping into a non-chord tone is how a bebop line gets anywhere. Keep it
    // as a gentle preference at the top two levels only.
    'unprepared-dissonance': { minLevel: 3, vetoLevel: 4, penalty: 0.5 },

    // A ♭9 over a dominant is a colour jazz reaches for deliberately — it is
    // the sound of the minor ii–V. Only police it at the smoothest setting.
    'flat-nine': { minLevel: 4, vetoLevel: 4 },

    // Parallel fifths and octaves are a choral prohibition. Quartal planing and
    // block-chord writing move in parallel on purpose.
    'parallel-perfects': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.6 },

    // Still awkward, but less taboo than in a singable idiom — the altered and
    // diminished scales contain them by construction.
    'augmented-second': { vetoLevel: 2, penalty: 0.3 },

    // The natural 11 over a major seventh is a genuine avoid note in jazz, more
    // so than in iskelmä. Tighten rather than relax.
    'avoid-fourth': { minLevel: 2, vetoLevel: 3 },
  },

  duration: [125, 215],

  /**
   * Chord-scale mapping. Each chord quality gets the scale that jazz practice
   * associates with it, rooted on the *chord*, not the key.
   */
  scaleForChord: (tonic, mode, chord) => {
    const root = chord.root;
    switch (chord.quality) {
      case 'maj7': case 'maj9': case 'maj6': case 'maj':
        return makeScale(root, 'major');
      case 'min7': case 'min9': case 'min11': case 'min6': case 'min':
        return makeScale(root, 'dorian');
      case 'dom7': case 'dom9': case 'dom13':
        return makeScale(root, 'mixolydian');
      case 'halfdim7':
        return makeScale(root, 'locrian');
      case 'dim7': case 'dim':
        return makeScale(root, 'diminished');
      case 'minmaj7':
        return makeScale(root, 'melodicMinor');
      // Suspended, with or without the seventh: mixolydian, which contains the
      // fourth the chord is built on and the third it is avoiding.
      case 'sus4': case 'sus2': case 'dom7sus4':
        return makeScale(root, 'mixolydian');
      default:
        // Altered dominants take the altered scale, which is melodic minor a
        // semitone above the chord root — the standard shortcut for it.
        if (isAlteredDominant(chord.quality)) return makeScale(pc(root + 1), 'melodicMinor');
        return makeScale(tonic, mode === 'minor' ? 'minor' : 'major');
    }
  },
  /**
   * A jazz drummer does not play a tom roll into the head. The fill is the
   * cymbal, a couple of kicks under it, and a snare on the way in.
   */
  fills: [
    ['cymbal', 6], ['snare-roll', 3], ['lead-in', 3], ['drop', 2], ['snare-toms', 1],
  ],
};
