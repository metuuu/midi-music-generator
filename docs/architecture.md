# Architecture and output

## The shape of it

```
src/core/       pitch, scales, chords, roman numerals, voice leading, Song IR
src/style/      shared vocabulary — Style, EraProfile, Mood, feel, delivery,
                voice signatures, the instrument catalogue
src/genre/      per-genre content: iskelma/, jazz/, ambient/, synth/
src/tune/       the melody engine — motif, skeleton, surface, judge
src/generate/   form, harmony, accompaniment, drums, fills, dynamics,
                transitions, filter sweeps, vocals
src/render/     midi.ts (ships)  ·  strudel.ts (auditions)
src/concert/    Song IR → Performance IR — casting, staging, choreography, lighting
src/web/        the browser pages  ·  audio.ts owns the Strudel transport
```

The generator produces a neutral **Song IR** — sections, tracks of note events, a drum track — and nothing below that line knows about Strudel, MIDI or Web Audio. Every renderer consumes the same IR.

**The melody is composed in `src/tune/`, not in `src/generate/`.** That split is deliberate and enforced: the tune engine is a derivation — a motif, a skeleton, a surface, and a judge that scores candidates — developed with no access to the rest of the generator. `generate/song.ts` calls into it through `tune/adapt.ts` and patches the band around what comes back. See [`tune-plan.md`](tune-plan.md) for the model and for the four places the plan was wrong.

## Three renderers, one IR

| | | Reads |
|---|---|---|
| [`render/midi.ts`](../src/render/midi.ts) | **ships** | notes, velocity, GM programs, the effects GM can carry |
| [`render/strudel.ts`](../src/render/strudel.ts) | auditions | the same, plus the audition-only effects, as Strudel source text |
| [`concert/`](../src/concert/) → [`web/concert/`](../src/web/concert/) | watches | the same, as a band on a 3D stage |

The third one is the argument for the first two being separate from the IR at all: a `Song` is enough to *stage* the music — who is playing, which hand, on what, under which light — and none of that required the generator to know a stage exists. See [`concert.md`](concert.md).

## Adding a genre

A genre owns everything culturally specific: styles, eras, moods, titles, forms, keys, a vocal profile, a default constraint level, a default repetition level, optional per-layer mix and effects, any rules it disagrees with, and a chord-scale rule. Add a folder under `src/genre/` and register it in [`src/genre/index.ts`](../src/genre/index.ts). Nothing in `generate/`, `tune/` or `render/` needs to change.

A folder is one file per kind of decision — `styles.ts`, `eras.ts`, `moods.ts`, `titles.ts`, `vocals.ts` — and an `index.ts` that assembles them into a `Genre`.

The chord-scale rule is the interesting one. It answers "given this chord, where does the melody get its notes?" — key-relative for iskelmä, chord-relative for jazz, drone-relative for ambient. That one function is most of what makes three genres sound like different music rather than the same music with different chords. Synth answers it the way iskelmä does minus the harmonic minor, and earns its place elsewhere; a fifth genre that is not a new answer to this question should expect to be asked what it is for.

`ruleOverrides` is the other thing a genre is expected to have an opinion about. The rule table is shared and comes from classical voice-leading practice, so a genre says which of it it does not hold — jazz disables two rules and relaxes three, ambient overrides seven, synth four. See [`smoothness.md`](smoothness.md#do-genres-share-the-rules).

Adding ambient did require three things of the shared engine, and all three are style-level knobs rather than genre special cases:

- `excludeLayers` / `requireLayers` — a hard veto and a hard guarantee on which layers sound, applied after the density rules have run. The first was already declared and unused; the second exists because the default rules treat a pad as decoration, which is backwards for music where the pad is the piece.
- `sustain` on a bass or comp pattern — merge same-pitch notes that meet end to end, so a pedal is a pedal rather than a note restruck every bar.
- `arpeggio` on a comp pattern — one note of the voicing per hit, cycling across barlines, which is what a sequencer does and a pianist does not.

Plus `drumFills: false` and `counterSpacing`, both of which are about pacing: the fill and the eighth-note answering figure are dance-band gestures that read as intrusions at ambient tempos.

## Mix and effects

`Track.effects`, `DrumTrack.effects` and `Song.space` are part of the IR, not of a renderer. Reverb and delay are modelled as **sends into one shared space** — the room has a size, each track has a distance — because that is how a mixing desk works and how MIDI works, where CC91 is a send to the synth's single global reverb.

Only what a delivery format can carry is expressed. `reverb` and `pan` are GM level 1; `lowpass` and `resonance` are GM2/GS and documented as such; `delay`, `highpass`, `drive`, `crush`, `phaser`, `glide` and `swell` have no GM controller and are marked audition-only rather than smuggled through an arbitrary CC.

Levels come from `Genre.mix` (per layer, `drums` included) and `Genre.drumMix` (per voice inside the kit, merged over `DEFAULT_DRUM_MIX`). The per-voice table used to live in the Strudel renderer, where MIDI could not see it; both renderers apply it now, so the audition and the shipping file agree about how loud the hats are. A kit shares one MIDI channel, so per-voice level goes into note velocity there.

Effects are resolved **era over genre**, per layer, with an instrument's own delta merged last — that is what an electric violin is, and a 1990s desk cannot un-electrify one. Genres that define none render exactly as dry as before.

## Layers

Every song is built from named layers: `drums, bass, comp, pad, brass, counter, melody, vocal`. Each becomes a separate MIDI track. To make music thin out under speech, mute layers rather than lowering a master bus — that is what the audition page's layer chips do.

`vocal` is the one that is only present on request (`--vocals`), and the one a renderer has to be told about: its notes carry vowels, consonants and ties, and `Track.voice` is what says the track is sung rather than played.

Everything is deterministic: **a seed reproduces a song exactly**, so a whole station can be stored as a list of seeds rather than as audio.

## Producing audio

### 1. Batch-generate

```bash
npm run gen -- -n 40 --genre iskelma --era tanssilava --mood nostalginen --seed radio-a --out ./out
```

Writes `NN-title.mid`, `NN-title.strudel.js` and `manifest.json` (title, seed, genre, key, BPM, duration, form, instruments per song).

### 2. Render to audio offline

The MIDI is General MIDI with drums on channel 10, so any GM soundfont works:

```bash
fluidsynth -ni GeneralUser-GS.sf2 out/01-kesan-tie.mid -F out/01.wav -r 48000
```

Then batch-convert to OGG/Vorbis for whatever plays it back. A better soundfont is the single biggest quality win available — the GM accordion and string ensemble in a good bank sound dramatically more convincing than the webaudiofont defaults.

### 3. Or drive a runtime sampler

`manifest.json` plus the MIDI gives you per-layer tracks as separate MIDI tracks. If you want the music to thin out under speech, mute layers rather than lowering a master bus — that is the same mechanism the audition page's layer chips use, and it is the hook for layered-ambient playback.
