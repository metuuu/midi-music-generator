# Architecture and output

## The shape of it

```
src/core/       pitch, scales, chords, roman numerals, voice leading, Song IR
src/style/      shared vocabulary — Style, EraProfile, Mood, instrument catalogue
src/genre/      per-genre content: iskelma/ and jazz/
src/generate/   form, harmony, motif melody engine, accompaniment, constraints
src/render/     midi.ts (ships)  ·  strudel.ts (auditions)
src/web/        browser preview  ·  audio.ts is the only file importing Strudel
```

The generator produces a neutral **Song IR** — sections, tracks of note events, a drum track — and nothing below that line knows about Strudel, MIDI or Web Audio. Both renderers consume the same IR.

## Adding a genre

A genre owns everything culturally specific: styles, eras, moods, titles, forms, keys, a default constraint level, and a chord-scale rule. Add a folder under `src/genre/` and register it in `src/genre/index.ts`. Nothing in `generate/` or `render/` needs to change.

The chord-scale rule is the interesting one. It answers "given this chord, where does the melody get its notes?" — key-relative for iskelmä, chord-relative for jazz. That one function is most of what makes two genres sound like different music rather than the same music with different chords.

## Layers

Every song is built from named layers: `drums, bass, comp, pad, melody, counter, brass`. Each becomes a separate MIDI track. To make music thin out under speech, mute layers rather than lowering a master bus — that is what the audition page's layer chips do.

Everything is deterministic: **a seed reproduces a song exactly**, so a whole station can be stored as a list of seeds rather than as audio.

## Producing audio

### 1. Batch-generate

```bash
npm run gen -- -n 40 --genre iskelma --era tanssilava --mood nostalginen --seed radio-a --out ./out
```

Writes `NN-title.mid`, `NN-title.strudel.js` and `manifest.json` (title, key, BPM, duration, form, instruments per song).

### 2. Render to audio offline

The MIDI is General MIDI with drums on channel 10, so any GM soundfont works:

```bash
fluidsynth -ni GeneralUser-GS.sf2 out/01-kesan-tie.mid -F out/01.wav -r 48000
```

Then batch-convert to OGG/Vorbis for whatever plays it back. A better soundfont is the single biggest quality win available — the GM accordion and string ensemble in a good bank sound dramatically more convincing than the webaudiofont defaults.

### 3. Or drive a runtime sampler

`manifest.json` plus the MIDI gives you per-layer tracks (`drums, bass, comp, pad, melody, counter, brass`) as separate MIDI tracks. If you want the music to thin out under speech, mute layers rather than lowering a master bus — that is the same mechanism the audition page's layer chips use, and it is the hook for layered-ambient playback.
