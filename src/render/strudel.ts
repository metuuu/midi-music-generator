/**
 * Song IR -> Strudel source code.
 *
 * This renderer exists to *audition* what the generator wrote: paste the output
 * into strudel.cc, or run it in the demo page, and you hear the arrangement
 * immediately. It is deliberately the only file in the project that knows
 * Strudel exists, which is what keeps the AGPL boundary clean — see README.
 *
 * Notes are laid out on a sixteenth-note grid, one cycle per bar, using
 * mini-notation `_` to sustain and `~` to rest. That produces code a human can
 * read and edit, rather than an opaque blob.
 *
 * Known limitation: per-note velocity is not carried across. Strudel has no
 * inline velocity in mini-notation, and emitting a parallel gain pattern
 * doubles the output for an audition tool. Dynamics survive at the layer level
 * (and fully in the MIDI render, which is the shipping format).
 */

import { midiToNoteName, spellingFor } from '../core/pitch.js';
import type { DrumVoice, NoteEvent, Song } from '../core/types.js';

const SLOTS_PER_BEAT = 4;

export interface StrudelRenderOptions {
  /** Emit the `samples()` / soundfont preamble. Off when embedding in the demo page. */
  includePrebake?: boolean;
  /** Wrap in a `setcpm` + `stack(...)` block ready to paste into strudel.cc. */
  standalone?: boolean;
}

export function renderStrudel(song: Song, opts: StrudelRenderOptions = {}): string {
  const { meta } = song;
  const slotsPerBar = meta.beatsPerBar * SLOTS_PER_BEAT;
  const lines: string[] = [];

  lines.push(`// ${meta.title}`);
  lines.push(`// ${meta.styleLabel} · ${meta.eraLabel} · ${meta.keyLabel} · ${meta.bpm} BPM · mood: ${meta.mood}`);
  lines.push(`// seed: ${meta.seed}  —  regenerate this exact song with --seed ${meta.seed}`);
  lines.push(`// form: ${song.sections.map((s) => `${s.kind}${s.transpose ? `(+${s.transpose})` : ''}`).join(' → ')}`);
  lines.push('');

  if (opts.includePrebake) {
    lines.push(`await samples('${DRUM_SAMPLES_URL}');`);
    lines.push('');
  }

  // One cycle per bar: cycles-per-minute = beats-per-minute / beats-per-bar.
  lines.push(`setcpm(${(meta.bpm / meta.beatsPerBar).toFixed(4)});`);
  lines.push('');

  const parts: string[] = [];

  const spelling = spellingFor(meta.tonic, meta.mode);

  for (const track of song.tracks) {
    const grid = buildNoteGrid(track.notes, song.meta.totalBars, slotsPerBar, spelling);
    if (!grid.some((bar) => bar.some((slot) => slot !== '~'))) continue;
    parts.push(
      [
        `  // ${track.layer} — ${track.instrument}`,
        `  note(\`${formatGrid(grid)}\`)`,
        `    .sound('${track.strudelSound}')`,
        `    .gain(${track.gain.toFixed(2)})`,
      ].join('\n'),
    );
  }

  // Drums: one pattern per voice so the per-voice mix survives.
  const byVoice = new Map<DrumVoice, number[][]>();
  for (const e of song.drums.events) {
    const bar = Math.floor(e.beat / meta.beatsPerBar);
    const slot = Math.round((e.beat - bar * meta.beatsPerBar) * SLOTS_PER_BEAT);
    if (bar < 0 || bar >= meta.totalBars) continue;
    let grid = byVoice.get(e.voice);
    if (!grid) {
      grid = Array.from({ length: meta.totalBars }, () => [] as number[]);
      byVoice.set(e.voice, grid);
    }
    grid[bar]!.push(Math.min(slot, slotsPerBar - 1));
  }

  for (const [voice, grid] of byVoice) {
    const bars = grid.map((slots) => {
      const row: string[] = Array.from({ length: slotsPerBar }, () => '~');
      for (const s of slots) row[s] = voice;
      return row;
    });
    parts.push(
      [
        `  // drums — ${voice}`,
        `  s(\`${formatGrid(bars)}\`)`,
        `    .bank('${song.drums.bank}')`,
        `    .gain(${(song.drums.gain * DRUM_VOICE_GAIN[voice]).toFixed(2)})`,
      ].join('\n'),
    );
  }

  if (opts.standalone !== false) {
    lines.push('stack(');
    lines.push(parts.join(',\n\n'));
    lines.push(')');
  } else {
    lines.push(`stack(\n${parts.join(',\n\n')}\n)`);
  }

  return lines.join('\n') + '\n';
}

/** Drum-machine sample set used by the audition render (verified reachable). */
export const DRUM_SAMPLES_URL =
  'https://raw.githubusercontent.com/felixroos/dough-samples/main/tidal-drum-machines.json';

/** Rough per-voice balance so hats don't swamp the kick. */
const DRUM_VOICE_GAIN: Record<DrumVoice, number> = {
  bd: 1.0, sd: 0.85, rim: 0.7, hh: 0.45, oh: 0.5, cp: 0.7,
  lt: 0.7, mt: 0.7, ht: 0.7, cr: 0.55, rd: 0.5, perc: 0.6, cb: 0.5, sh: 0.4,
};

/**
 * Lay notes onto a per-bar sixteenth grid.
 * Simultaneous notes become a mini-notation chord `[c3,e3,g3]`; sustained notes
 * fill later slots with `_`.
 */
function buildNoteGrid(
  notes: NoteEvent[],
  totalBars: number,
  slotsPerBar: number,
  spelling: 'sharp' | 'flat',
): string[][] {
  const grid: string[][] = Array.from({ length: totalBars }, () =>
    Array.from({ length: slotsPerBar }, () => '~'),
  );
  const totalSlots = totalBars * slotsPerBar;
  const slotOf = (beat: number) => Math.round(beat * SLOTS_PER_BEAT);

  const onsets = new Map<number, string[]>();
  /**
   * Each bar is its own mini-notation group, so `_` cannot carry a note across
   * a barline — a group starting with `_` is a parse error. Notes that span a
   * barline are therefore re-articulated at the downbeat.
   */
  const reonsets = new Map<number, string[]>();
  const holds = new Set<number>();

  const addTo = (map: Map<number, string[]>, slot: number, name: string) => {
    const arr = map.get(slot) ?? [];
    arr.push(name);
    map.set(slot, arr);
  };

  for (const n of notes) {
    const start = slotOf(n.beat);
    if (start < 0 || start >= totalSlots) continue;
    const name = midiToNoteName(n.midi, spelling);
    addTo(onsets, start, name);

    const end = Math.min(totalSlots, Math.max(start + 1, slotOf(n.beat + n.duration)));
    for (let s = start + 1; s < end; s++) {
      if (s % slotsPerBar === 0) addTo(reonsets, s, name);
      else holds.add(s);
    }
  }

  const write = (slot: number, names: string[]) => {
    const bar = Math.floor(slot / slotsPerBar);
    const col = slot % slotsPerBar;
    const unique = [...new Set(names)];
    grid[bar]![col] = unique.length === 1 ? unique[0]! : `[${unique.join(',')}]`;
  };

  for (const [slot, names] of reonsets) write(slot, names);
  // Real onsets win over re-articulations at the same slot.
  for (const [slot, names] of onsets) write(slot, names);

  for (const slot of holds) {
    const bar = Math.floor(slot / slotsPerBar);
    const col = slot % slotsPerBar;
    if (grid[bar]![col] === '~') grid[bar]![col] = '_';
  }

  return grid;
}

/** `<[bar] [bar] ...>` — angle brackets step one bar per cycle. */
function formatGrid(bars: string[][]): string {
  const rows = bars.map((slots) => `  [${slots.join(' ')}]`);
  return `<\n${rows.join('\n')}\n>`;
}
