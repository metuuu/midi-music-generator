/**
 * Genre registry.
 *
 * Adding a genre means adding a folder here — styles, eras, moods, titles,
 * forms, keys and a chord-scale rule — and nothing in `generate/` or `render/`
 * needs to change.
 */

import type { Genre } from './types.js';
import { iskelma } from './iskelma/index.js';
import { jazz } from './jazz/index.js';
import { ambient } from './ambient/index.js';
import { synth } from './synth/index.js';
import { reggae } from './reggae/index.js';
import { indian } from './indian/index.js';
import { arabic } from './arabic/index.js';
import { funk } from './funk/index.js';
import { classical } from './classical/index.js';
import { metal } from './metal/index.js';
import { rock } from './rock/index.js';
import { finnfolk } from './finnfolk/index.js';
import { country } from './country/index.js';
import { latin } from './latin/index.js';

export const GENRES: Record<string, Genre> = { iskelma, jazz, ambient, synth, reggae, indian, arabic, funk, classical, metal, rock, finnfolk, country, latin };
export const GENRE_IDS = Object.keys(GENRES);

export function getGenre(id: string): Genre {
  const g = GENRES[id];
  if (!g) throw new Error(`Unknown genre "${id}". Known: ${GENRE_IDS.join(', ')}`);
  return g;
}

export type { Genre, FormStep, EndingStyle } from './types.js';
