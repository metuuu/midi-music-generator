/**
 * Sanity check on the emitted mini-notation.
 *
 * Each bar is its own group, so a bar may never start with a sustain marker and
 * a rest may never be followed by one. Both are parse errors in Strudel, and
 * both are easy to reintroduce when touching the grid builder.
 */

import { generateSong } from './generate/song.js';
import { renderStrudel } from './render/strudel.js';
import { GENRE_IDS } from './genre/index.js';

const problems: string[] = [];
let bars = 0;
let songs = 0;

// Cover every genre in turn. Each brings something the others never emit: jazz
// has extended chords and voicings past three notes, and ambient has notes that
// last sixteen bars — which is the case most likely to break the grid, since a
// bar-group cannot open with a sustain marker and a held note has to be
// re-articulated at every barline it crosses.
for (let i = 0; i < 150; i++) {
  const genre = GENRE_IDS[i % GENRE_IDS.length]!;
  // Every third song sings. The sung layer is the only one that writes filter
  // and envelope grids, so leaving it out of the sweep meant a whole class of
  // emitted notation was never checked — which is exactly how the per-note gain
  // grid got through code review and failed on first contact.
  const song = generateSong({ seed: `notation-${i}`, genre, vocals: i % 3 === 0 });
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
    // Every slot must be a note, a chord, a drum voice, a rest, a hold, or a
    // number. Numbers are how control patterns are written — gain carries the
    // per-note dynamics, and the sung layer writes attack, filter frequency and
    // decay the same way — and they are as much a part of the notation as the
    // note names are.
    const DRUM = /^(bd|sd|rim|hh|oh|cp|lt|mt|ht|cr|rd|perc|cb|sh)$/;
    // Noise sources. The sung layer triggers one for each consonant burst.
    const NOISE = /^(white|pink|brown)$/;
    for (const tok of inner.split(/\s+/)) {
      const numeric = /^\d+(\.\d+)?$/.test(tok);
      // A control value far outside the plausible range is a bug that would
      // otherwise render as silence or as clipping rather than as an error.
      if (numeric && Number(tok) > 20000) {
        problems.push(`implausible control value "${tok}" in ${line.slice(0, 60)}`);
      }
      const ok = tok === '~' || tok === '_'
        || numeric
        || DRUM.test(tok) || NOISE.test(tok)
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
