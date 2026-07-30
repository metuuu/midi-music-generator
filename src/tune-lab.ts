/**
 * The tune engine, heard on its own.
 *
 * A melody over eight bars of I–vi–IV–V in C, rendered through the existing MIDI
 * renderer, with no era, no style, no arranger, no drums and no band. If a tune is
 * boring under these conditions it is the engine's fault and nothing else's — which
 * is a feedback loop the real pipeline cannot offer, because there a melody is the
 * ninth thing that happens inside a two-thousand-line section loop.
 *
 * Temporary by design: deleted when `src/tune/adapt.ts` wires the engine into
 * `generate/song.ts`. See `docs/tune-plan.md` §3.1.
 *
 *   npm run tune -- --seed a1 --bars 8
 *   npm run tune -- --seed a1 --archetype wide-interval --print
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { parseRoman, type Chord } from './core/chord.js';
import { keyLabel, noteNameToPc } from './core/pitch.js';
import { makeScale, type Mode } from './core/scale.js';
import { DEFAULT_SPACE, type Song, type Track } from './core/types.js';
import { renderMidi } from './render/midi.js';
import { auditionTune, describeTune } from './tune/tune.js';
import { describeVerdict } from './tune/judge.js';
import type { ArchetypeId } from './tune/types.js';
import { ARCHETYPES, getVoice } from './tune/voice.js';

const args = process.argv.slice(2);
const flag = (name: string, fallback?: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1]!.startsWith('--') ? args[i + 1] : fallback;
};
const has = (name: string) => args.includes(`--${name}`);

const seed = flag('seed', 'lab')!;
const bars = Number(flag('bars', '8'));
const bpm = Number(flag('bpm', '104'));
const beatsPerBar = Number(flag('beats', '4'));
const mode = (flag('mode', 'major') as Mode);
const tonic = noteNameToPc(flag('key', 'C')!);
const repetition = Number(flag('repetition', '0.5'));
const density = Number(flag('density', '1'));
const archetypeArg = flag('archetype');
const progression = (flag('chords', 'I vi IV V')!).split(/\s+/);
const outDir = flag('out', './out')!;

if (archetypeArg && !(archetypeArg in ARCHETYPES)) {
  console.error(`Unknown archetype "${archetypeArg}". Known: ${Object.keys(ARCHETYPES).join(', ')}`);
  process.exit(1);
}

const chords: Chord[] = Array.from(
  { length: bars },
  (_, i) => parseRoman(progression[i % progression.length]!, mode),
).map((c) => ({ ...c, root: (c.root + tonic) % 12 }));

const attempts = Number(flag('attempts', '80'));
const voice = getVoice();
const { best, worst } = auditionTune({
  tag: `${seed}:tune`,
  attempts,
  ctx: {
    chords,
    beatsPerBar,
    startBeat: 0,
    tonic,
    mode,
    range: [60, 60 + voice.compass + 4],
    // No genre here, so the fallback rule: natural minor, harmonic minor the
    // moment a dominant arrives.
    scaleForChord: (t, m, chord) => makeScale(
      t, m === 'minor' ? (chord.dominantFunction ? 'harmonicMinor' : 'minor') : 'major',
    ),
  },
  voice,
  repetition,
  density,
  ...(archetypeArg ? { archetype: archetypeArg as ArchetypeId } : {}),
});

const keep = has('worst') ? worst : best;
const { plan, notes } = keep;

const track: Track = {
  layer: 'melody',
  instrument: 'tune lab',
  gmProgram: 0,
  strudelSound: 'gm_acoustic_grand_piano',
  notes,
  gain: 0.9,
};

const song: Song = {
  meta: {
    seed,
    title: `tune-lab ${seed}`,
    style: 'lab', styleLabel: 'Lab',
    era: 'lab', eraLabel: 'Lab',
    mood: 'lab',
    genre: 'lab', genreLabel: 'Lab',
    strictness: 'standard', strictnessLabel: 'Standard',
    hook: 'standard', hookLabel: 'Standard',
    tonic, mode, keyLabel: keyLabel(tonic, mode),
    bpm, beatsPerBar, beatUnit: 4,
    totalBars: bars,
    swing: 0,
  },
  sections: [{
    kind: 'chorus',
    startBar: 0,
    lengthBars: bars,
    transpose: 0,
    mode,
    activeLayers: ['melody'],
    chordLabels: chords.map((c) => c.label),
  }],
  tracks: [track],
  drums: { bank: 'none', events: [], gain: 0, voiceGains: {} as never },
  space: DEFAULT_SPACE,
};

mkdirSync(outDir, { recursive: true });
const file = `${outDir}/tune-${seed}${has('worst') ? '-worst' : ''}.mid`;
writeFileSync(file, renderMidi(song));

console.log(`${bars} bars · ${progression.join(' ')} · ${keyLabel(tonic, mode)} · ${bpm} BPM`);
console.log(`${attempts} attempts · keeping the ${has('worst') ? 'worst' : 'best'}`);
console.log('');
for (const line of describeTune(plan, notes, Math.round(beatsPerBar * 4))) console.log(line);
console.log('');
console.log(`best   ${describeVerdict(best.verdict)}`);
console.log(`worst  ${describeVerdict(worst.verdict)}`);
console.log('');
if (has('print')) {
  for (const n of notes) {
    console.log(`  beat ${n.beat.toFixed(2).padStart(6)}  ${String(n.midi).padStart(3)}  ${n.duration.toFixed(2)}`);
  }
  console.log('');
}
console.log(`Wrote ${file}`);
