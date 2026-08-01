import { generateSong } from './src/generate/song.js';
const song = generateSong({ seed: 'fp-11', genre: 'iskelma' });
const bpb = song.meta.beatsPerBar;
console.log(`style=${song.meta.style} era=${song.meta.era} bars=${song.meta.totalBars} bpm=${song.meta.bpm} target sections=${song.sections.length}`);
for (const s of song.sections) {
  const from = s.startBar * bpb, to = from + s.lengthBars * bpb;
  const counts = song.tracks.map((t) => `${t.layer}=${t.notes.filter((n) => n.beat >= from && n.beat < to).length}`).join(' ');
  console.log(`${s.kind.padEnd(7)} ${String(s.startBar).padStart(3)}+${s.lengthBars}  [${s.activeLayers.join(' ')}]  ${counts}${s.solo ? ` SOLO=${s.solo.layer}` : ''}`);
}
