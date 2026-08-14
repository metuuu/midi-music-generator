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
import { meterLabel, songDurationSeconds, tempoLabel, type Song } from './core/types.js';
import { GENRES, GENRE_IDS, getGenre } from './genre/index.js';
import { STRICTNESS_IDS, type StrictnessId } from './core/rules.js';
import { HOOK_IDS, type HookId } from './generate/hook.js';
import { CHAOS_LEVELS, getChaosLevels, getChaosMixing } from './genre/chaos.js';

interface Args {
  count: number;
  out: string;
  genre?: string;
  era?: string;
  style?: string;
  mood?: string;
  seed?: string;
  seconds?: number;
  strictness?: string;
  hook?: string;
  vocals: boolean;
  chaos?: string;
  chaosSpread?: number;
  chaosMixing?: string;
  chaosSeed?: string;
  chaosDonors?: string[];
  quiet: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { count: 5, out: './out', vocals: false, quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    const next = () => argv[++i];
    switch (a) {
      case '--count': case '-n': args.count = Number(next()); break;
      case '--out': case '-o': args.out = String(next()); break;
      case '--genre': args.genre = String(next()); break;
      case '--era': args.era = String(next()); break;
      case '--style': args.style = String(next()); break;
      case '--mood': args.mood = String(next()); break;
      case '--seed': args.seed = String(next()); break;
      case '--seconds': args.seconds = Number(next()); break;
      case '--strictness': args.strictness = String(next()); break;
      case '--hook': args.hook = String(next()); break;
      case '--vocals': args.vocals = true; break;
      case '--chaos': args.chaos = String(next()); break;
      case '--chaos-spread': args.chaosSpread = Number(next()); break;
      case '--chaos-mixing': args.chaosMixing = String(next()); break;
      case '--chaos-seed': args.chaosSeed = String(next()); break;
      case '--chaos-donors': args.chaosDonors = String(next()).split(','); break;
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
Music generator — ${Object.values(GENRES).map((g) => g.label).join(', ')}

  npm run gen -- [options]

  -n, --count <n>     how many songs to generate (default 5)
  -o, --out <dir>     output directory (default ./out)
      --genre <id>    ${GENRE_IDS.join(' | ')}   (random when omitted)
      --era <id>      per genre; see below
      --style <id>    per genre; see below
      --mood <id>     per genre; see below
      --seed <s>      base seed; song N uses "<seed>-N" (reproducible)
      --seconds <n>   target length per song
      --strictness    ${STRICTNESS_IDS.join(' | ')}
                      how hard to police the melody (default: standard)
      --hook          ${HOOK_IDS.join(' | ')}
                      how much the song repeats itself. Independent of
                      --strictness: one asks whether a note is wrong, the
                      other whether it is familiar. Default is per genre.
      --vocals        double the melody with a sung line. The seed
                      still fixes the instrumental parts exactly, so the same
                      seed with and without this is the same arrangement.
      --chaos <kinds> ${CHAOS_LEVELS.join(',')}  (or 'all', or any subset)
                      build the band out of more than one genre. The kinds are
                      independent and comma-separated, so --chaos band borrows
                      only who is playing, --chaos band,harmony leaves the
                      figures alone, and --chaos all lets everything move.
                      --genre/--era/--style still name the host — the genre the
                      piece is filed under, whose bar and whose room it keeps.
      --chaos-spread <0..1>
                      share of the eligible properties that actually move
                      (default 0.5). 0 is a plain song, 1 borrows everything
                      the selected kinds allow.
      --chaos-mixing <kind:rate,...>
                      that share again, per kind — band:1,harmony:0.2 borrows
                      every instrument and one chord table in five. A kind
                      left out keeps --chaos-spread. Turning a kind down does
                      not disturb what the others borrowed, so this is still a
                      comparison rather than a reroll.
      --chaos-seed <text>
                      draw the band from this seed instead of the song's. Pin
                      --seed and change this to hear the same piece played by
                      a different set of borrowings; pin this and let --seed
                      run to hear one band play a whole set.
      --chaos-donors <ids>
                      comma-separated genres allowed to donate (default: all)
      --quiet         no per-song output

${GENRE_IDS.map((g) => {
  const genre = getGenre(g);
  return `  ${genre.label} (--genre ${g})
      styles  ${Object.keys(genre.styles).join(' | ')}
      eras    ${Object.keys(genre.eras).join(' | ')}
      moods   ${Object.keys(genre.moods).join(' | ')}`;
}).join('\n\n')}
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
    if (args.genre) opts.genre = args.genre;
    if (args.era) opts.era = args.era;
    if (args.style) opts.style = args.style;
    if (args.mood) opts.mood = args.mood;
    if (args.seconds) opts.targetSeconds = args.seconds;
    if (args.strictness) opts.strictness = args.strictness as StrictnessId;
    if (args.hook) opts.hook = args.hook as HookId;
    if (args.vocals) opts.vocals = true;
    if (args.chaos) {
      const chaos: NonNullable<GenerateOptions['chaos']> = { levels: getChaosLevels(args.chaos) };
      if (args.chaosSpread !== undefined) chaos.spread = args.chaosSpread;
      if (args.chaosMixing) chaos.mixing = getChaosMixing(args.chaosMixing);
      if (args.chaosSeed) chaos.seed = args.chaosSeed;
      if (args.chaosDonors) chaos.donors = args.chaosDonors;
      opts.chaos = chaos;
    }

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
    genre: meta.genre,
    style: meta.style,
    era: meta.era,
    mood: meta.mood,
    strictness: meta.strictness,
    hook: meta.hook,
    key: meta.keyLabel,
    bpm: meta.bpm,
    meter: meterLabel(meta),
    bars: meta.totalBars,
    seconds: Math.round(songDurationSeconds(song)),
    instruments: song.tracks.map((t) => `${t.layer}:${t.instrument}`),
    drumBank: song.drums.bank,
    form: song.sections.map((s) => `${s.kind}${s.transpose ? `+${s.transpose}` : ''}`),
    // The recipe, verbatim, because `genre`/`style`/`era` above name the host
    // and are no longer enough to regenerate the piece without it.
    ...(meta.chaos ? { chaos: meta.chaos } : {}),
  };
}

function describe(song: Song): string {
  const { meta } = song;
  const mins = songDurationSeconds(song);
  const lift = song.sections.find((s) => s.transpose > 0);
  return [
    `♪ ${meta.title}  [${meta.genreLabel}]`,
    `   ${meta.styleLabel} · ${meta.keyLabel} · ${tempoLabel(meta)} BPM · ${meterLabel(meta)} · ${Math.floor(mins / 60)}:${String(Math.round(mins % 60)).padStart(2, '0')}`,
    `   ${meta.eraLabel} · drums: ${song.drums.bank}${lift ? ` · key change +${lift.transpose}` : ''}`,
    `   ${song.tracks.map((t) => t.instrument).join(', ')}`,
    // Only on a chimera, and it prints what moved rather than that something
    // did: "borrowed 14 properties" tells a listener nothing they can act on,
    // where "drums←iskelma:humppa" tells them what they are hearing.
    // A kind mixed at a rate of its own prints that rate beside it; the rest
    // are on the ×spread that follows the list.
    ...(meta.chaos ? [`   chaos/${meta.chaos.levels.map((l) => (
      meta.chaos!.mixing?.[l] !== undefined ? `${l}×${meta.chaos!.mixing[l]}` : l
    )).join('+') || 'none'} ×${meta.chaos.spread}${meta.chaos.seed ? ` @${meta.chaos.seed}` : ''} · ${
      Object.entries(meta.chaos.borrowed).map(([k, v]) => `${k}←${v}`).join(', ') || 'nothing borrowed'
    }`] : []),
  ].join('\n');
}

main();
