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
import type { Genre, FormStep } from '../types.js';
import { STYLES } from './styles.js';
import { ERAS } from './eras.js';
import { MOODS } from './moods.js';
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
  defaultStrictness: 'light',
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
      case 'sus4': case 'sus2':
        return makeScale(root, 'mixolydian');
      default:
        // Altered dominants take the altered scale, which is melodic minor a
        // semitone above the chord root — the standard shortcut for it.
        if (isAlteredDominant(chord.quality)) return makeScale(pc(root + 1), 'melodicMinor');
        return makeScale(tonic, mode === 'minor' ? 'minor' : 'major');
    }
  },
};
