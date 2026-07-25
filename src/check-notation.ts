/**
 * Sanity check on the emitted mini-notation.
 *
 * Each bar is its own group, so a bar may never start with a sustain marker and
 * a rest may never be followed by one. Both are parse errors in Strudel, and
 * both are easy to reintroduce when touching the grid builder.
 */

import { generateSong } from './generate/song.js';
import { renderStrudel } from './render/strudel.js';

const problems: string[] = [];
let bars = 0;
let songs = 0;

for (let i = 0; i < 120; i++) {
  const song = generateSong({ seed: `notation-${i}` });
  songs++;
  const code = renderStrudel(song, { includePrebake: true });

  for (const raw of code.split('\n')) {
    const line = raw.trim();
    if (!line.startsWith('[') || !line.endsWith(']')) continue;
    bars++;
    const inner = line.slice(1, -1).trim();
    if (/^_/.test(inner)) problems.push(`bar starts with a sustain marker: ${line.slice(0, 70)}`);
    if (/(^|\s)~\s+_/.test(inner)) problems.push(`sustain marker after a rest: ${line.slice(0, 70)}`);
    if (/,\s*[\]]/.test(inner)) problems.push(`empty chord member: ${line.slice(0, 70)}`);
    // Every slot must be a note, a chord, a drum voice, a rest or a hold.
    const DRUM = /^(bd|sd|rim|hh|oh|cp|lt|mt|ht|cr|rd|perc|cb)$/;
    for (const tok of inner.split(/\s+/)) {
      const ok = tok === '~' || tok === '_'
        || DRUM.test(tok)
        || /^[a-g][#b]?-?\d+$/.test(tok)
        || /^\[[^\]]+\]$/.test(tok);
      if (!ok) problems.push(`unrecognised token "${tok}" in ${line.slice(0, 60)}`);
    }
  }
}

console.log(`Checked ${bars} bars across ${songs} songs.`);
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of [...new Set(problems)].slice(0, 15)) console.log('  ' + p);
  process.exit(1);
}
console.log('Mini-notation is well formed.');
