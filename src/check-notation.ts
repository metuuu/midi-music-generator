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
import { deep, depthSummary, seeds } from './depth.js';

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
 * `penv` is the pitch envelope, in semitones. `pitchSlide` in
 * `render/strudel.ts` writes one value per note from `NoteEvent.bend.semitones`,
 * which is a **destination and not a depth** — a drill 808 falling a fourth is
 * `-5.00`, and there is no other way to say it.
 *
 * `nudge` is seconds against the slot the note is written on, and it is signed
 * for a plainer reason than `penv`: `slotOf` **rounds**, so half of everything it
 * moves it moves forward, and the correction that undoes that is negative. A
 * swung eighth is the ordinary case — written on the third sixteenth, played 33 ms
 * before it — so a nudge grid with no minus signs in it would mean the swing had
 * gone missing again. See `timingNudge`.
 *
 * This is the fourth time this file has had a vocabulary narrower than the one the
 * renderer emits, and the fourth time the symptom was the worst one available: a
 * *correct* line reported as unparseable, in a check whose whole job is to be
 * believed. The drum voices were a literal that went stale twice — see
 * `DRUM_VOICE_TOKEN` — and `penv` was a `\d` where the grammar wanted a sign. The
 * lesson each time is the same, so it is worth stating once more: what belongs in
 * a line is a question for whatever writes the line, and every table here that
 * answers it independently is a table that will disagree eventually.
 */
const SIGNED_CONTROLS = new Set(['penv', 'nudge']);

/**
 * A bar's slots, with a nested group kept whole.
 *
 * Splitting on whitespace was enough for as long as every slot was one word, and
 * `DrumEvent.roll` kept it that way by accident: `[hh*3]` is a group with no space
 * in it. A melodic alternation cannot be written that way — `[e5 f#5]` is two
 * different pitches and mini-notation separates them with a space — so a naive
 * split tore each trill into `[e5` and `f#5]` and reported both halves as
 * unrecognised. Which is the failure this file has now had five times: **a
 * vocabulary narrower than the one the renderer emits, reporting correct output as
 * broken.** See `SIGNED_CONTROLS` for the other four.
 *
 * Depth-counted rather than regex-matched, so nesting deeper than one level costs
 * nothing to support and cannot be the sixth.
 */
function slotsOf(inner: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of inner) {
    if (ch === '[') depth++;
    else if (ch === ']') depth--;
    if (/\s/.test(ch) && depth === 0) {
      if (current) out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current) out.push(current);
  return out;
}

/**
 * One bar of a grid, in whichever of the three shapes `formatGrid` wrote it.
 *
 * It used to write one `[...]` per line and nothing else, so a bar was a line
 * that began with `[` and ended with `]`. It now folds identical neighbours into
 * `[...]!n` and drops the alternation entirely when every bar is the same, which
 * puts that bar inline in the control that owns it — `.gain(\`[0.122]\`)`. Both
 * new shapes fail the old test, and a reader that skips what it does not
 * recognise **reports nothing and passes**: this file's oldest failure mode, and
 * the reason `slotsOf` exists. See `formatGrid` in `render/strudel.ts`.
 *
 * `repeat` is what the `!n` says, so the count at the end is still bars of music
 * read rather than lines of text looked at.
 */
function barOf(line: string): { inner: string; repeat: number } | undefined {
  const own = line.match(/^\[(.*)\](?:!(\d+))?$/);
  if (own) return { inner: own[1]!.trim(), repeat: Number(own[2] ?? 1) };
  // Inline: the whole grid is one bar, inside the backticks of its control.
  const alone = line.match(/`\[(.*)\]`/);
  return alone ? { inner: alone[1]!.trim(), repeat: 1 } : undefined;
}

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
/**
 * Slots holding a **nested group** rather than a single stroke.
 *
 * `DrumEvent.roll` — `docs/engine-gaps.md` §3.15 — writes `[hh*3]` where a
 * sixteenth is struck three times inside itself, and the token rule below already
 * accepted it: `^\[[^\]]+\]$` has been in this file since chords needed it, so a
 * rolled slot has always been well-formed notation by this check's own grammar.
 *
 * Counted anyway, and the reason is the one this project keeps rediscovering: a
 * feature that emits nothing looks exactly like a feature that works. The
 * grammar being wide enough to accept a shape is not evidence the shape is being
 * produced, and the only cheap standing proof that the audition is actually
 * writing rolls is a number printed by a run somebody already does. If this line
 * ever reads zero, either the two styles that adopted it have stopped drawing a
 * programmed source or the emission has quietly broken, and both are worth
 * hearing about from a check rather than from a listener.
 */
let rolledSlots = 0;
/**
 * Slots holding a melodic alternation, for the same standing-proof reason as
 * `rolledSlots` above and with the same failure mode if it reads zero: either
 * finnfolk has stopped decorating its strain or `buildNoteGrid` has stopped
 * emitting the group, and neither should first be noticed by a listener.
 */
let trilledSlots = 0;
/**
 * Parts riding a sidechain bus, and kicks reaching across to duck them.
 *
 * `Effects.duck` — `docs/engine-gaps.md` §3.17 — emits no notation at all: it is
 * an `.orbit()` on the ducked part and a `.duckorbit()` on the kick, both of
 * which this file's bar reader skips over as ordinary control lines. So the
 * grammar above can never say anything about it, which is exactly the condition
 * under which `rolledSlots` was added — **a feature that emits nothing looks
 * exactly like a feature that works**, and this one is invisible in the text by
 * construction rather than by accident.
 *
 * Counted as a **pair**, because either half alone is silent. A bus with nobody
 * ducking it is a part in its own reverb at full level; a kick ducking a bus
 * nothing is on logs an error inside superdough and plays normally. So the two
 * are asserted against each other rather than against a threshold, which is the
 * only claim this sweep can make honestly: **the number here is small and is
 * expected to be small.** Ten styles and one era duck, in synth, pop and house,
 * of 393 styles across 19 genres. The population claim lives in `npm run
 * genres`, which generates 240 songs of the adopting styles on purpose; what is
 * worth having here is the *pairing*, because that is a property of the emitter
 * rather than of the catalogue and one song is enough to see it.
 *
 * **Which is why the corpus decides whether this can be asked at all.** Measured
 * on these seeds: one rotation draws **no** ducking record, two draw one
 * (`house/trance`) and eight draw two. So `Sidechain: 0 parts on a duck bus`
 * was the commonest thing this line printed, and it read as a measurement of the
 * emitter when it was a fact about which styles came up — which is the
 * `deep`-tier condition in `depth.ts` exactly. Records that *asked* are counted
 * beside the buses now, so the remaining zero says which zero it is.
 */
let duckBuses = 0;
let duckers = 0;
/** Records whose style asked for a sidechain at all, so a zero above is legible. */
let duckSongs = 0;

// Cover every genre in turn. Each brings something the others never emit: jazz
// has extended chords and voicings past three notes, and ambient has notes that
// last sixteen bars — which is the case most likely to break the grid, since a
// bar-group cannot open with a sustain marker and a held note has to be
// re-articulated at every barline it crosses.
/**
 * The corpus is a search for a string the grammar cannot parse, and one bad
 * render settles it — so a shorter run is a shallower search rather than a
 * looser standard. See `depth.ts`.
 *
 * Counted in **rotations** rather than in songs, because the line above is not a
 * preference: a count that is not a whole rotation silently stops covering every
 * genre, and the quick tier used to draw ten songs against nineteen genres —
 * so `pop` and `house` were never rendered here at all, and neither was anything
 * else past `metal`. Nine genres unvisited by the cheapest check anybody runs.
 * The whole quick pass costs under a second, so one full rotation is the floor.
 */
const RENDERS = seeds(8, 2, 1) * GENRE_IDS.length;
for (let i = 0; i < RENDERS; i++) {
  const genre = GENRE_IDS[i % GENRE_IDS.length]!;
  // Every third song sings. The sung layer is the only one that writes filter
  // and envelope grids, so leaving it out of the sweep meant a whole class of
  // emitted notation was never checked — which is exactly how the per-note gain
  // grid got through code review and failed on first contact.
  const song = generateSong({ seed: `notation-${i}`, genre, vocals: i % 3 === 0 });
  songs++;
  const code = renderStrudel(song, { includePrebake: true });
  duckBuses += (code.match(/\n\s*\.orbit\(\d+\)/g) ?? []).length;
  duckers += (code.match(/\n\s*\.duckorbit\(/g) ?? []).length;
  // The IR's own request, ahead of anything the renderer decided about it.
  if (song.tracks.some((t) => t.effects?.duck)) duckSongs++;

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
   *
   * Named before the bar is read rather than after, because a grid whose bars
   * are all the same is now written inline — `.gain(\`[0.122]\`)` is a control
   * and its only bar on one line, and reading the bar first would judge it
   * against whatever the last grid happened to be.
   */
  let control = '';
  for (const raw of code.split('\n')) {
    const line = raw.trim();
    const named = line.match(/\.([a-z][a-zA-Z]*)\(/);
    if (named) control = named[1]!;
    const bar = barOf(line);
    if (!bar) continue;
    bars += bar.repeat;
    const inner = bar.inner;
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
    for (const tok of slotsOf(inner)) {
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
      // A roll: one voice, struck n times inside the slot it stands on. Matched
      // before the general bracket rule only so it can be counted; both accept it.
      const roll = tok.match(/^\[([^\]\s*]+)\*(\d+)\]$/);
      if (roll) {
        rolledSlots++;
        if (!DRUM.test(roll[1]!)) {
          problems.push(`rolled slot on an unknown voice "${tok}" in ${line.slice(0, 50)}`);
        }
        if (Number(roll[2]) < 2) problems.push(`a roll of ${roll[2]} is not a roll: ${tok}`);
      }
      /**
       * A trill: the roll's melodic twin, and written out rather than multiplied
       * because the strokes are two different pitches. See `NoteTrill`.
       *
       * Checked for what the type promises and not merely for shape. Two distinct
       * pitches, because three is a turn and one is the roll notation above; a step
       * apart, because a trill against an interval is an arpeggio; and alternating,
       * because `a b b a` is not an alternation however many notes it has.
       */
      const trill = tok.match(/^\[([a-g][#b]?-?\d+(?:\s+[a-g][#b]?-?\d+)+)\]$/);
      if (trill) {
        trilledSlots++;
        const strokes = trill[1]!.split(/\s+/);
        const pitches = [...new Set(strokes)];
        if (pitches.length !== 2) {
          problems.push(`a trill alternates two notes, not ${pitches.length}: ${tok}`);
        } else if (strokes.some((s, i) => s !== strokes[i % 2]!)) {
          problems.push(`trill strokes do not alternate: ${tok}`);
        }
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
console.log(`Rolled slots: ${rolledSlots} struck more than once inside a sixteenth.`);
console.log(`Trilled slots: ${trilledSlots} alternating two pitches inside a sixteenth.`);
if (deep('the sidechain pairing', 'standard')) {
  if (!duckSongs) {
    // Not a measurement of the emitter. Said in words rather than as a zero,
    // which is what this line printed for as long as it was wrong.
    console.log(`Sidechain: no record in this corpus asked for one, of ${songs} songs.`);
  } else {
    console.log(
      `Sidechain: ${duckBuses} parts on a duck bus, ducked from ${duckers} kicks`
      + ` — ${duckSongs} of ${songs} records asked.`,
    );
    // A kick ducking nothing, or a bus nobody ducks. Both play, neither pumps.
    if ((duckBuses > 0) !== (duckers > 0)) {
      problems.push(`sidechain half-emitted: ${duckBuses} buses against ${duckers} duckers`);
    }
  }
}
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
console.log(`Mini-notation is well formed.${depthSummary()}`);
