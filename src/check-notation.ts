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
import { resolveVoice, SAMPLE_RACKS } from './render/drum-banks.js';
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
 *
 * **And the voices are not the whole vocabulary, which is the same lesson a
 * second time.** A drum line does not carry voice names; it carries whatever
 * `resolveDrumSample` hands back, and that is the voice only for a machine,
 * whose samples are prefixed with `.bank()`. A sampled rack's are bare — the
 * line says `conga`, `cabasa`, `framedrum`, `thom` — so the moment latin's eras
 * named `+congas` this file called 32865 perfectly good bars unparseable, which
 * is precisely the failure the paragraph above was written about. The list was
 * derived from the wrong table rather than written out by hand, and being
 * derived did not save it.
 *
 * So both tables are read, and `SAMPLE_RACKS` is the exhaustive one for its
 * half: a rack whose sample is not a token here is impossible for the same
 * reason a voice without a level is.
 */
const RACK_SAMPLE_NAMES = [...new Set(
  Object.values(SAMPLE_RACKS).flatMap((shelf) => Object.values(shelf).map(([sample]) => sample)),
)];
const DRUM_VOICE_TOKEN = new RegExp(
  `^(${[...Object.keys(DEFAULT_DRUM_MIX), ...RACK_SAMPLE_NAMES].join('|')})$`,
);

/**
 * The controls whose grids may legitimately carry a negative number.
 *
 * Every other numeric grid in the audition is a magnitude — a gain, an attack in
 * seconds, a filter frequency in hertz, a decay — and a negative one of those is
 * a bug that renders as silence or as a thrown parse rather than as a wrong
 * sound. So the minus sign is not simply allowed through: it is allowed through
 * *where it means something*, and stays an error everywhere else.
 *
 * `penv` is the pitch envelope, in semitones, and it is the whole of the list.
 * `pitchSlide` in `render/strudel.ts` writes one value per note from
 * `NoteEvent.bend.semitones`, which is a **destination and not a depth** — a
 * drill 808 falling a fourth is `-5.00`, and there is no other way to say it.
 *
 * This is the third time this file has had a vocabulary narrower than the one the
 * renderer emits, and the third time the symptom was the worst one available: a
 * *correct* line reported as unparseable, in a check whose whole job is to be
 * believed. The drum voices were a literal that went stale twice — see
 * `DRUM_VOICE_TOKEN` — and this was a `\d` where the grammar wanted a sign. The
 * lesson each time is the same, so it is worth stating once more: what belongs in
 * a line is a question for whatever writes the line, and every table here that
 * answers it independently is a table that will disagree eventually.
 */
const SIGNED_CONTROLS = new Set(['penv']);

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

  /**
   * Which control the bars being read belong to.
   *
   * `formatGrid` writes a grid as `.name(\`<` on one line and then one `[...]`
   * per bar under it, so the enclosing control is simply the last one named
   * before the run started. That is the only context a line-at-a-time reader can
   * have, and it is exactly enough for the one question worth asking about a
   * number — whether a minus sign in front of it is music or a fault.
   */
  let control = '';
  for (const raw of code.split('\n')) {
    const line = raw.trim();
    if (!line.startsWith('[') || !line.endsWith(']')) {
      const named = line.match(/\.([a-z][a-zA-Z]*)\(/);
      if (named) control = named[1]!;
      continue;
    }
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
      const numeric = /^-?\d+(\.\d+)?$/.test(tok);
      // A control value far outside the plausible range is a bug that would
      // otherwise render as silence or as clipping rather than as an error. On
      // the magnitude, now that a value can be signed: a filter an octave *below*
      // audible is the same fault as one above it, and reading `-30000` as small
      // would be the check disarming itself.
      if (numeric && Math.abs(Number(tok)) > 20000) {
        problems.push(`implausible control value "${tok}" in ${line.slice(0, 60)}`);
      }
      // A minus sign only means something in a grid that can express direction.
      // See `SIGNED_CONTROLS`.
      if (numeric && tok.startsWith('-') && !SIGNED_CONTROLS.has(control)) {
        problems.push(`negative "${tok}" in a ${control || 'nameless'} grid: ${line.slice(0, 50)}`);
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
