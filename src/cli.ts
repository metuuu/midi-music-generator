/**
 * Batch generator.
 *
 *   npm run gen -- --count 12 --era eighties --mood haikea --out ./out
 *
 * Writes a .mid (the shipping format) and a .strudel.js (auditionable in a
 * browser) per song, plus a manifest describing the station.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { generateSong, type GenerateOptions } from './generate/song.js';
import { renderMidi } from './render/midi.js';
import { renderStrudel } from './render/strudel.js';
import { songDurationSeconds, type Song } from './core/types.js';
import { ERA_IDS } from './style/eras.js';
import { MOOD_IDS } from './style/moods.js';
import { STYLE_IDS } from './style/styles.js';

interface Args {
  count: number;
  out: string;
  era?: string;
  style?: string;
  mood?: string;
  seed?: string;
  seconds?: number;
  quiet: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { count: 5, out: './out', quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    const next = () => argv[++i];
    switch (a) {
      case '--count': case '-n': args.count = Number(next()); break;
      case '--out': case '-o': args.out = String(next()); break;
      case '--era': args.era = String(next()); break;
      case '--style': args.style = String(next()); break;
      case '--mood': args.mood = String(next()); break;
      case '--seed': args.seed = String(next()); break;
      case '--seconds': args.seconds = Number(next()); break;
      case '--quiet': args.quiet = true; break;
      case '--help': case '-h': usage(); process.exit(0);
      default:
        if (a.startsWith('-')) { console.error(`Unknown flag: ${a}`); usage(); process.exit(1); }
    }
  }
  return args;
}

function usage(): void {
  console.log(`
Finnish iskelmä generator

  npm run gen -- [options]

  -n, --count <n>     how many songs to generate (default 5)
  -o, --out <dir>     output directory (default ./out)
      --era <id>      ${ERA_IDS.join(' | ')}
      --style <id>    ${STYLE_IDS.join(' | ')}
      --mood <id>     ${MOOD_IDS.join(' | ')}
      --seed <s>      base seed; song N uses "<seed>-N" (reproducible)
      --seconds <n>   target length per song
      --quiet         no per-song output
`);
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const outDir = resolve(args.out);
  mkdirSync(outDir, { recursive: true });

  const manifest: Record<string, unknown>[] = [];

  for (let i = 0; i < args.count; i++) {
    const opts: GenerateOptions = {
      seed: args.seed ? `${args.seed}-${i}` : `${Date.now()}-${i}-${Math.random()}`,
    };
    if (args.era) opts.era = args.era;
    if (args.style) opts.style = args.style;
    if (args.mood) opts.mood = args.mood;
    if (args.seconds) opts.targetSeconds = args.seconds;

    const song = generateSong(opts);
    const name = `${String(i + 1).padStart(2, '0')}-${slug(song.meta.title)}`;

    writeFileSync(join(outDir, `${name}.mid`), renderMidi(song));
    writeFileSync(join(outDir, `${name}.strudel.js`), renderStrudel(song, { includePrebake: true }));

    manifest.push(summarise(song, name));
    if (!args.quiet) console.log(describe(song));
  }

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\n${args.count} song(s) → ${outDir}`);
}

function summarise(song: Song, file: string) {
  const { meta } = song;
  return {
    file,
    title: meta.title,
    seed: meta.seed,
    style: meta.style,
    era: meta.era,
    mood: meta.mood,
    key: meta.keyLabel,
    bpm: meta.bpm,
    meter: `${meta.beatsPerBar}/${meta.beatUnit}`,
    bars: meta.totalBars,
    seconds: Math.round(songDurationSeconds(song)),
    instruments: song.tracks.map((t) => `${t.layer}:${t.instrument}`),
    drumBank: song.drums.bank,
    form: song.sections.map((s) => `${s.kind}${s.transpose ? `+${s.transpose}` : ''}`),
  };
}

function describe(song: Song): string {
  const { meta } = song;
  const mins = songDurationSeconds(song);
  const lift = song.sections.find((s) => s.transpose > 0);
  return [
    `♪ ${meta.title}`,
    `   ${meta.styleLabel} · ${meta.keyLabel} · ${meta.bpm} BPM · ${meta.beatsPerBar}/${meta.beatUnit} · ${Math.floor(mins / 60)}:${String(Math.round(mins % 60)).padStart(2, '0')}`,
    `   ${meta.eraLabel} · drums: ${song.drums.bank}${lift ? ` · key change +${lift.transpose}` : ''}`,
    `   ${song.tracks.map((t) => t.instrument).join(', ')}`,
  ].join('\n');
}

main();
