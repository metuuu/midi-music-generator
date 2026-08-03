/**
 * Sanity check on the emitted mini-notation, plus the tune engine's import wall.
 *
 * Each bar is its own group, so a bar may never start with a sustain marker and
 * a rest may never be followed by one. Both are parse errors in Strudel, and
 * both are easy to reintroduce when touching the grid builder.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { generateSong } from './generate/song.js';
import { DEFAULT_DRUM_MIX } from './core/types.js';
import { resolveVoice } from './render/drum-banks.js';
import { renderStrudel } from './render/strudel.js';
import { GENRE_IDS } from './genre/index.js';

/**
 * Every drum voice, as a token this file will accept in a drum line.
 *
 * Derived rather than written out, and the difference is not tidiness. This was
 * a literal alternation for as long as the kit had fourteen voices, which is
 * exactly as long as the kit had fourteen voices: the moment `tb` and the three
 * hand-drum strokes landed in `DrumVoice`, the list here was silently a
 * different vocabulary from the one the renderer emits, and the failure mode is
 * the worst one this file has — a *correct* drum line reported as unparseable
 * notation, in a check whose whole job is to be believed.
 *
 * `DEFAULT_DRUM_MIX` is the source of truth because it is an exhaustive
 * `Record<DrumVoice, number>`, so the compiler guarantees its keys are the
 * complete set. A voice added without a level is a build error; a voice added
 * without a token here is now impossible.
 */
const DRUM_VOICE_TOKEN = new RegExp(`^(${Object.keys(DEFAULT_DRUM_MIX).join('|')})$`);

const problems: string[] = [];
/**
 * Drum voices asked for that the chosen bank does not have.
 *
 * Tracked separately because the failure is invisible in the emitted text — the
 * line looks like every other drum line, and the sound simply never arrives.
 * `substituted` is fine and expected; `dropped` means a part was written and
 * then thrown away, which is worth knowing about even when it is unavoidable.
 */
let substituted = 0;
let dropped = 0;
let drumParts = 0;
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

  for (const voice of new Set(song.drums.events.map((e) => e.voice))) {
    drumParts++;
    const resolved = resolveVoice(song.drums.bank, voice);
    if (resolved === undefined) dropped++;
    else if (resolved !== voice) substituted++;
  }

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
    const DRUM = DRUM_VOICE_TOKEN;
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
console.log(
  `Drum voices: ${drumParts} asked for, ${substituted} substituted, ${dropped} dropped.`,
);
// A dropped voice is a part that was written and then silently thrown away. It
// is tolerable for an ornament and not for the kit's backbone: no bank in the
// pack lacks a kick, a snare or a hat, so a drop there means the table is wrong.
if (dropped > 0) problems.push(`${dropped} drum parts had no playable substitute`);

/**
 * The tune engine's import wall.
 *
 * `src/tune/` is a from-scratch melodic engine and its whole value is that it
 * inherited none of the previous one's assumptions. Those assumptions live in
 * *types*: import `RhythmCell` and rhythm is bar-shaped again, import
 * `HookLevel` and repetition is nine scalars rather than a derivation. So the
 * rule is mechanical rather than aspirational — `core/` and nothing else, with
 * `adapt.ts` the single door onto the style and genre tables.
 *
 * Checked here rather than in a script of its own because it is one grep, and a
 * boundary nobody runs is not a boundary. See `docs/tune-plan.md` §3.
 */
const TUNE_DIR = new URL('./tune/', import.meta.url);
if (existsSync(TUNE_DIR)) {
  const allowed = /^(\.\/|\.\.\/core\/|node:)/;
  let checked = 0;
  for (const name of readdirSync(TUNE_DIR)) {
    if (!name.endsWith('.ts') || name === 'adapt.ts') continue;
    checked++;
    const src = readFileSync(new URL(name, TUNE_DIR), 'utf8');
    for (const m of src.matchAll(/from '([^']+)'/g)) {
      const spec = m[1]!;
      if (!allowed.test(spec)) {
        problems.push(`tune/${name} imports "${spec}" — only core/ is allowed`);
      }
    }
  }
  console.log(`Tune engine: ${checked} files inside the import wall.`);
}
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of [...new Set(problems)].slice(0, 15)) console.log('  ' + p);
  process.exit(1);
}
console.log('Mini-notation is well formed.');
