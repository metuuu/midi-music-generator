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
import { MOOD_IDS } from './style/moods.js';

for (const mood of MOOD_IDS) {
  const styles: Record<string, number> = {};
  let minor = 0, bpmSum = 0;
  const N = 200;
  for (let i = 0; i < N; i++) {
    const s = generateSong({ seed: `${mood}-${i}`, mood });
    styles[s.meta.style] = (styles[s.meta.style] ?? 0) + 1;
    if (s.meta.mode === 'minor') minor++;
    bpmSum += s.meta.bpm;
  }
  const top = Object.entries(styles).sort((a,b)=>b[1]-a[1]).slice(0,3)
    .map(([k,v]) => `${k} ${Math.round(v/N*100)}%`).join(', ');
  console.log(`${mood.padEnd(13)} minor ${String(Math.round(minor/N*100)).padStart(3)}%  avg ${Math.round(bpmSum/N)} BPM  | ${top}`);
}
