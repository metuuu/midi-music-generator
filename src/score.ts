/**
 * Score dump — read a generated song the way a musician would.
 *
 *   npx tsx src/score.ts <seed> [genre] [style]
 *
 * Prints bar by bar: the chord, the melody as note names with scale degrees and
 * beat positions, the bass, and the comp voicing. The audit measures aggregates;
 * this is for looking at the actual notes.
 */

import { parseRoman, chordPcs } from './core/chord.js';
import { pc } from './core/pitch.js';
import { melodicLine } from './core/types.js';
import type { NoteEvent, Song } from './core/types.js';
import { generateSong } from './generate/song.js';

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const name = (m: number) => `${NAMES[pc(m)]}${Math.floor(m / 12) - 1}`;

function fmt(notes: NoteEvent[], barStart: number, bpb: number): string {
  return notes
    .filter((n) => n.beat >= barStart - 1e-6 && n.beat < barStart + bpb - 1e-6)
    .sort((a, b) => a.beat - b.beat)
    .map((n) => `${(n.beat - barStart + 1).toFixed(2)}:${name(n.midi)}/${n.duration.toFixed(2)}`)
    .join(' ');
}

function main(): void {
  const [seed, genre, style] = process.argv.slice(2);
  const song: Song = generateSong({
    seed: seed ?? '1',
    ...(genre ? { genre } : {}),
    ...(style ? { style } : {}),
  });
  const { beatsPerBar: bpb, tonic, mode } = song.meta;
  console.log(`\n${song.meta.title} — ${song.meta.genreLabel} / ${song.meta.styleLabel} / ${song.meta.eraLabel}`);
  console.log(`${song.meta.keyLabel}  ${song.meta.bpm} BPM  ${bpb}/${song.meta.beatUnit}  swing ${song.meta.swing}`);
  console.log(`smoothness ${song.meta.strictness}  hook ${song.meta.hook}  mood ${song.meta.mood}\n`);

  const melodyTrack = song.tracks.find((t) => t.layer === 'melody');
  // The line, not the track: a `twoHanded` piano interleaves its own comping.
  const melody = melodyTrack ? melodicLine(melodyTrack) : [];
  const counter = song.tracks.find((t) => t.layer === 'counter')?.notes ?? [];
  const bass = song.tracks.find((t) => t.layer === 'bass')?.notes ?? [];
  const comp = song.tracks.find((t) => t.layer === 'comp')?.notes ?? [];
  const pad = song.tracks.find((t) => t.layer === 'pad')?.notes ?? [];

  for (const sec of song.sections) {
    console.log(`── ${sec.kind} bars ${sec.startBar}-${sec.startBar + sec.lengthBars - 1}` +
      `${sec.transpose ? ` (+${sec.transpose})` : ''}  [${sec.activeLayers.join(' ')}]`);
    const localTonic = ((tonic + sec.transpose) % 12 + 12) % 12;
    for (let i = 0; i < sec.lengthBars; i++) {
      const bar = sec.startBar + i;
      const beat = bar * bpb;
      const label = sec.chordLabels[i] ?? '?';
      const chord = parseRoman(label, mode);
      const root = pc(chord.root + localTonic);
      const tones = chordPcs({ ...chord, root }).map((p) => NAMES[p]).join(' ');
      console.log(`  ${String(bar).padStart(3)} ${label.padEnd(7)} ${`(${tones})`.padEnd(20)}`);
      const line = (tag: string, ns: NoteEvent[]) => {
        const s = fmt(ns, beat, bpb);
        if (s) console.log(`        ${tag.padEnd(5)} ${s}`);
      };
      line('mel', melody);
      line('cnt', counter);
      line('bass', bass);
      line('comp', comp);
      line('pad', pad);
    }
  }
  console.log();
}

main();
