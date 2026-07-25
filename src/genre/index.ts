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

export const GENRES: Record<string, Genre> = { iskelma, jazz };
export const GENRE_IDS = Object.keys(GENRES);

export function getGenre(id: string): Genre {
  const g = GENRES[id];
  if (!g) throw new Error(`Unknown genre "${id}". Known: ${GENRE_IDS.join(', ')}`);
  return g;
}

export type { Genre, FormStep } from './types.js';
