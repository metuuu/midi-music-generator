# Music generator

A rule-based music generator for radio and game soundtracks. It writes the form, harmony, melody, bass, accompaniment, and drums, then exports MIDI and Strudel code.

It supports 19 genres:

`iskelma`, `jazz`, `ambient`, `synth`, `reggae`, `indian`, `arabic`, `funk`, `classical`, `metal`, `rock`, `finnish-folk`, `country`, `latin`, `pop`, `hiphop`, `rnb`, `dnb`, and `house`.

## Run it

Requires Node.js and npm.

```bash
npm install
npm run dev
```

Open [localhost:5173](http://localhost:5173) to make and play a song.

Other pages:

- [radio](http://localhost:5173/radio) plays generated stations
- [concert](http://localhost:5173/concert) puts the band on a 3D stage
- [voice](http://localhost:5173/voice) is a lab for the vocal synth
- [mix](http://localhost:5173/mix) is a mixing bench

## Generate files

```bash
npm run gen -- --genre jazz --style bebop --seed 42 --out ./out
```

Each song produces a `.mid` file, a `.strudel.js` file, and an entry in `manifest.json`.

The generator makes five songs by default. Use `-n` to change the count:

```bash
npm run gen -- -n 12 --genre ambient --style wasteland --out ./out
```

Run this for every genre, style, era, mood, and option:

```bash
npm run gen -- --help
```

Useful controls:

- `--genre`, `--style`, `--era`, and `--mood` choose the repertoire and production
- `--seconds` sets the target length
- `--seed` makes a run reproducible
- `--strictness` controls melody constraints
- `--hook` controls repetition
- `--vocals` adds an invented sung line
- `--chaos` borrows instruments or musical rules from other genres

## Examples

```bash
npm run gen -- --genre iskelma --mood kaihoisa --strictness strict
npm run gen -- --genre ambient --style choral --vocals
npm run gen -- --genre synth --style berlin --mood motorway
npm run gen -- --genre iskelma --chaos band,figures
```

## Code and docs

The generator returns a `Song` data structure. MIDI, Strudel, and the concert are separate renderers of that data.

Read [the architecture guide](docs/architecture.md) before changing the engine. The [documentation index](docs/README.md) links to genre rules, arrangement, rhythm, vocals, the concert, and design notes.

## Checks

For a quick project check:

```bash
npm run verify --quick
```

The scripts in `package.json` also check specific areas, such as genres, notation, the concert, and chaos mixing.

## License

Most of the project is MIT licensed. `src/web/` links to Strudel and is AGPL-3.0-or-later.

The browser preview streams third-party soundfonts and drum samples. Check their terms before shipping audio made with those assets. MIDI output does not include them.
