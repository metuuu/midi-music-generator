/**
 * Mood calibration report.
 *
 *   npm run moods
 *
 * Moods are only useful if they actually shift the distribution. This prints
 * what each one does to key, tempo and dance choice across a large sample, so
 * the bias tables can be tuned against something other than intuition.
 */

import { generateSong } from './generate/song.js';
import { GENRE_IDS, getGenre } from './genre/index.js';

for (const genreId of GENRE_IDS) {
  const genre = getGenre(genreId);
  console.log(`\n=== ${genre.label} ===`);
  for (const mood of Object.keys(genre.moods)) {
  const styles: Record<string, number> = {};
  let minor = 0, bpmSum = 0;
  const N = 200;
  for (let i = 0; i < N; i++) {
    const s = generateSong({ seed: `${genreId}-${mood}-${i}`, genre: genreId, mood });
    styles[s.meta.style] = (styles[s.meta.style] ?? 0) + 1;
    if (s.meta.mode === 'minor') minor++;
    bpmSum += s.meta.bpm;
  }
  const top = Object.entries(styles).sort((a,b)=>b[1]-a[1]).slice(0,3)
    .map(([k,v]) => `${k} ${Math.round(v/N*100)}%`).join(', ');
  console.log(`  ${mood.padEnd(13)} minor ${String(Math.round(minor/N*100)).padStart(3)}%  avg ${Math.round(bpmSum/N)} BPM  | ${top}`);
  }
}
