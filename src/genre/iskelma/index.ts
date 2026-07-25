/**
 * Finnish iskelmä.
 *
 * Melody is key-relative: aeolian throughout, switching to harmonic minor the
 * moment a dominant-function chord arrives so the leading tone actually leads.
 * That single rule does more for the idiom than anything else here.
 */

import { makeScale } from '../../core/scale.js';
import type { Genre, FormStep } from '../types.js';
import { STYLES } from './styles.js';
import { ERAS } from './eras.js';
import { MOODS } from './moods.js';
import { VOCALS } from './vocals.js';
import { generateTitle } from './titles.js';

/** Verse/chorus song forms. The final chorus is where the key change lands. */
const FORMS: (readonly [FormStep[], number])[] = [
  [[
    { kind: 'intro', bars: 4 }, { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'solo', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'outro', bars: 4 },
  ], 5],
  [[
    { kind: 'intro', bars: 4 }, { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 }, { kind: 'bridge', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'outro', bars: 4 },
  ], 5],
  [[
    { kind: 'intro', bars: 4 }, { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'outro', bars: 4 },
  ], 3],
  [[
    { kind: 'intro', bars: 4 }, { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'solo', bars: 8 }, { kind: 'chorus', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 4],
];

export const iskelma: Genre = {
  id: 'iskelma',
  label: 'Iskelmä',
  description: 'Finnish dance-pavilion pop — tango, humppa, valssi, jenkka, foksi, beguine, 80s radio iskelmä.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,
  keys: {
    // Singable, and friendly to accordion and guitar.
    minor: [[9, 5], [4, 4], [2, 4], [7, 3], [11, 3], [0, 2], [5, 2], [6, 1]],
    major: [[0, 5], [7, 4], [5, 4], [2, 3], [10, 3], [9, 2], [3, 2]],
  },
  defaultStrictness: 'standard',
  scaleForChord: (tonic, mode, chord) => {
    if (mode === 'minor' && chord.dominantFunction) return makeScale(tonic, 'harmonicMinor');
    return makeScale(tonic, mode === 'minor' ? 'minor' : 'major');
  },
  duration: [105, 185],
};
