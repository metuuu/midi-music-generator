# Architecture and output

## The shape of it

```
src/core/       pitch, scales, chords, roman numerals, voice leading, Song IR
src/style/      shared vocabulary — Style, EraProfile, Mood, instrument catalogue
src/genre/      per-genre content: iskelma/, jazz/ and ambient/
src/generate/   form, harmony, motif melody engine, accompaniment, constraints, hook
src/render/     midi.ts (ships)  ·  strudel.ts (auditions)
src/web/        browser preview  ·  audio.ts is the only file importing Strudel
```

The generator produces a neutral **Song IR** — sections, tracks of note events, a drum track — and nothing below that line knows about Strudel, MIDI or Web Audio. Both renderers consume the same IR.

## Adding a genre

A genre owns everything culturally specific: styles, eras, moods, titles, forms, keys, a default constraint level, a default repetition level, an optional per-layer mix, and a chord-scale rule. Add a folder under `src/genre/` and register it in `src/genre/index.ts`. Nothing in `generate/` or `render/` needs to change.

The chord-scale rule is the interesting one. It answers "given this chord, where does the melody get its notes?" — key-relative for iskelmä, chord-relative for jazz, drone-relative for ambient. That one function is most of what makes three genres sound like different music rather than the same music with different chords.

Adding ambient did require three things of the shared engine, and all three are style-level knobs rather than genre special cases:

- `excludeLayers` / `requireLayers` — a hard veto and a hard guarantee on which layers sound, applied after the density rules have run. The first was already declared and unused; the second exists because the default rules treat a pad as decoration, which is backwards for music where the pad is the piece.
- `sustain` on a bass or comp pattern — merge same-pitch notes that meet end to end, so a pedal is a pedal rather than a note restruck every bar.
- `arpeggio` on a comp pattern — one note of the voicing per hit, cycling across barlines, which is what a sequencer does and a pianist does not.

Plus `drumFills: false` and `counterSpacing`, both of which are about pacing: the fill and the eighth-note answering figure are dance-band gestures that read as intrusions at ambient tempos.

## Mix and effects

`Track.effects`, `DrumTrack.effects` and `Song.space` are part of the IR, not of a renderer. Reverb and delay are modelled as **sends into one shared space** — the room has a size, each track has a distance — because that is how a mixing desk works and how MIDI works, where CC91 is a send to the synth's single global reverb.

Only what a delivery format can carry is expressed. `reverb` and `pan` are GM level 1; `lowpass` and `resonance` are GM2/GS and documented as such; `delay` and `highpass` have no GM controller and are marked audition-only rather than smuggled through an arbitrary CC.

Levels come from `Genre.mix` (per layer, `drums` included) and `Genre.drumMix` (per voice inside the kit, merged over `DEFAULT_DRUM_MIX`). The per-voice table used to live in the Strudel renderer, where MIDI could not see it; both renderers apply it now, so the audition and the shipping file agree about how loud the hats are. A kit shares one MIDI channel, so per-voice level goes into note velocity there.

Effects are resolved **era over genre**, per layer: the genre says what is true of the music whatever decade it claims to be from, and the era says how wet and how dark that decade's records were. Genres that define none render exactly as dry as before.

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
