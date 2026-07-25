# Iskelmägeneraattori

A rule-based generator for **instrumental Finnish iskelmä**, written for radio-style background music. It writes complete arrangements (form, harmony, melody, bass, comping, drums), and renders them to **MIDI** for offline rendering and to **Strudel** code for auditioning in a browser.

```bash
npm install
npm run dev          # audition page at http://localhost:5178
npm run gen -- -n 12 --mood kaihoisa --strictness strict --out ./out
```

---

## Why it is built this way

Two constraints shaped the architecture.

**Strudel only runs in a browser.** It is a live-coding library built on Web Audio, so it cannot be the playback layer anywhere else. It is used here as a *composition and audition* tool, not a runtime. The shipping path is MIDI → rendered audio.

**Strudel is AGPL-3.0-or-later**, so it is quarantined. `src/web/audio.ts` is the only file that imports it — verify with `grep -rn "@strudel" src --include="*.ts" | grep import`. Everything else, including `render/strudel.ts` (which emits Strudel code as text but never imports it), is MIT and dependency-free.

Delete `src/web/` and you lose the browser preview and nothing else.

## Licence

MIT, except `src/web/` which is AGPL-3.0-or-later because it links Strudel.

Two runtime assets the preview downloads are **not** covered by this repo: the [drum-machine samples](https://github.com/ritchse/tidal-drum-machines) publish no licence at all, and the soundfonts derive from GeneralUser GS / FluidR3. Neither ends up in MIDI output — drums map to GM channel 10 — so audio you render uses your own soundfont. Check terms before shipping either as audio.

---

## The musical ruleset

This is the part that matters, so it is worth being explicit about what is actually encoded.

Iskelmä is unusually *codifiable*. It is not one groove — it is the repertoire of the Finnish dance pavilion, organised by **dance**. A band rotates tango, humppa, valssi, jenkka, foksi and a latin number, each with its own tempo band, comping figure and harmonic habits. Modelling those as separate styles is what makes the output recognisable rather than generically "sad European pop".

### Dances (`src/style/styles.ts`)

| Style | Meter | BPM | Mode | Defining traits |
|---|---|---|---|---|
| **Tango** | 4/4 | 96–126 | 94% minor | Descending `i–VII–VI–V`, harmonic-minor dominants, long held phrase endings |
| **Humppa** | 4/4 | 132–164 | 88% major | Oom-pah on the quarter, circle-of-fifths turnaround `I–VI7–II7–V7` |
| **Valssi** | 3/4 | 150–190 | 58% minor | Bass on 1, chords on 2 and 3 |
| **Jenkka** | 4/4 | 140–170 | 86% major | Dotted-eighth/sixteenth schottische snap |
| **Foksi** | 4/4 | 100–128 | 70% major | Light swing, `ii7–V7`, secondary dominants, sixth chords |
| **Beguine** | 4/4 | 108–132 | 55% minor | 3–3–2 dotted bass, offbeat comping |
| **Iskelmäpop** | 4/4 | 100–126 | 68% minor | Aeolian loop `i–VII–VI–VII`, chorus `VI–III–VII–i` |

**Finnish tango is not Argentine tango**, and the generator enforces the differences: it is near-obligatorily minor (Argentine moves freely between major and minor), slower, and squarer — a marching bass rather than a syncopated one.

### Harmony

- Roman numerals are read **relative to the mode**, the way a dance-band arranger reads them. In A minor, `VII` is G major. No flats needed.
- **Harmonic minor at cadences.** Melody sits in natural minor, but the moment a dominant-function chord arrives the 7th is raised so the leading tone actually leads. This one rule does more for authenticity than anything else.
- **The relative-major lift.** A melancholy verse in `i` opening its chorus on `III` or `VI` is the genre's core emotional device; chorus progressions that do this are weighted up.
- Neapolitan `bII`, borrowed `iv` in major, and circle-of-fifths bridges are all in the tables as colour.

### Melody (`src/generate/melody.ts`)

Built from **motifs and their transformations**, not note-by-note random walks. A phrase states a two-bar idea, restates it as a diatonic sequence a step or third lower, and answers it with a cadence. A random walk that merely obeys the harmony sounds like an exercise; reusing a shape sounds like a song.

Also enforced: chord tones on strong beats; stepwise motion dominant; a leap answered by a step the other way; a phrase arc peaking around two-thirds through; antecedents ending open on 5̂ or 2̂, consequents closing on 1̂, usually held long — the *kaipuu* note.

### Smoothness — preventing what sounds wrong (`src/generate/constraints.ts`)

Writing rules for what *should* happen only gets you so far; a lot of what makes generated melody sound wrong is a short list of specific, nameable faults. Fifteen of them are encoded as rules, and a **strictness level** decides how hard each is policed.

Each rule has two thresholds: a level at which it starts applying as a scoring **penalty**, and a level at which it becomes a hard **veto**. Raising strictness turns preferences into laws.

| Level | Id | What it adds |
|---|---|---|
| 0 | `free` | Nothing. Most character, occasional roughness. |
| 1 | `light` | Blocks the unambiguously ugly leaps: augmented second, tritone, seventh, over an octave. |
| 2 | `standard` *(default)* | Adds dissonance handling and tendency tones — unprepared dissonance, unresolved leading tone and chord seventh, ♭9 clashes, repeated-note runs. |
| 3 | `strict` | Adds vertical checks against the band: semitone clashes with held notes, parallel fifths and octaves with the bass, avoid-note fourths. |
| 4 | `polished` | Maximum consonance — chord tones on beats, no chromatics. Safe, smooth, noticeably tamer. |

The **augmented second** is the one worth calling out. In harmonic minor, ♭6 to ♮7 is a single scale step but three semitones. It sounds distinctly Middle Eastern and completely wrong for iskelmä — and because the generator switches to harmonic minor over every dominant chord, it happens constantly if nothing stops it.

Two design details make this workable rather than a straitjacket:

- **Vetoes degrade gracefully.** If every reachable note is forbidden, the chooser relaxes one level at a time rather than failing. The last resort still refuses to emit a tritone leap — it picks whichever candidate breaks the fewest level-1 rules.
- **A repair pass catches what generation misses.** Motif replay and cadence targets bypass the note chooser entirely, so the finished line is swept afterwards. Repairs are strictly improvement-only and check the join to the *next* note as well as the previous one — otherwise fixing one interval quietly manufactures a tritone on the other side.

Measured over the same 40 seeds regenerated at each level (`npm run strictness`), violations per 1000 melody notes:

```
                                 free     light  standard    strict  polished
augmented-second                  2.3        ·!        ·!        ·!        ·!
tritone-leap                      7.2      0.3!      0.3!      0.3!      0.4!
seventh-leap                      4.1      0.3!      0.2!      0.4!      0.1!
unresolved-leading-tone          21.4      19.5     15.4~      2.3!      4.5!
unresolved-seventh               53.1      51.7     42.8~      1.1!      6.3!
unprepared-dissonance            55.7      53.9     45.6~      1.1!      0.8!
flat-nine                         2.9       3.0        ·!        ·!        ·!
semitone-clash                   98.8      98.0     118.8      9.6!      6.0!
parallel-perfects                12.7      13.6      11.9      11.0~      0.9!
non-chord-tone-on-beat          161.5     161.6     213.0     168.3     12.4!
ALL RULES                       463.7     444.9     493.3     221.6      44.6

stepwise motion %                56.5      57.0      65.3      51.4      35.5
chord tone on beat %             79.5      79.5      73.0      78.7      98.4
```

`!` = forbidden at that level, `~` = penalised, blank = rule inactive.

**Read the inactive rows carefully.** `semitone-clash` and `non-chord-tone-on-beat` *rise* at `standard` — but neither rule is active there. The cause is that `standard` pushes stepwise motion from 56% to 65%, and stepwise motion means passing tones, which are non-chord tones by definition. That is a melodic improvement showing up as a worse number on a rule nobody asked to enforce yet.

**The cost is real.** At `polished`, stepwise motion falls to 35% and chord tones on beats hit 98% — the melody becomes an arpeggio that cannot offend anyone. `standard` is the default because it measurably improves singability; `strict` is the right choice if the radio is background music under dialogue and must never draw attention.

### Form

`intro → verse → chorus → … → solo → chorus → chorus(+1 or +2) → outro`

Two structural clichés are deliberate:
- **The solo chorus** — the "voice" rests and the accordion or sax takes the tune (implemented by moving the lead to the counter instrument).
- **The final-chorus key change** up a semitone or tone. 45% likely in the 60s–70s profile, 70% in the 80s.

### Eras (`src/style/eras.ts`)

The era decides *production*, not notes. The same tango sounds like 1968 or 1985 almost entirely through these choices.

- **1960s–70s tanssilava** — Korg Minipops, Rhythm Ace, Roland CR-78 rhythm boxes; accordion, bandoneon (GM 24 "Tango Accordion"), tremolo guitar, string ensemble, muted brass.
- **1980s iskelmäpop** — LinnDrum, Oberheim DMX, TR-707; synth strings, electric piano, electric bass, synth brass.

### Moods (`src/style/moods.ts`)

A mood does not pick notes; it biases choices the generator was making anyway. Measured over 200 songs each (`npm run moods`):

```
kaihoisa      minor  98%  avg 114 BPM  | tango 53%, valssi 24%
haikea        minor  88%  avg 116 BPM  | tango 48%, valssi 19%
dramaattinen  minor  88%  avg 126 BPM  | tango 42%, iskelmapop 25%
nostalginen   minor  64%  avg 131 BPM  | valssi 25%, tango 21%
rento         minor  54%  avg 121 BPM  | beguine 23%, valssi 20%
romanttinen   minor  52%  avg 128 BPM  | valssi 26%, tango 20%
tanssittava   minor  41%  avg 138 BPM  | foksi 19%, beguine 16%
iloinen       minor  15%  avg 147 BPM  | humppa 26%, iskelmapop 15%
```

---

## Producing audio

Everything is deterministic: **a seed reproduces a song exactly**, so a whole station can be stored as a list of seeds rather than as audio.

### 1. Batch-generate

```bash
npm run gen -- -n 40 --era tanssilava --mood nostalginen --seed radio-a --out ./out
```

Writes `NN-title.mid`, `NN-title.strudel.js` and `manifest.json` (title, key, BPM, duration, form, instruments per song).

### 2. Render to audio offline

The MIDI is General MIDI with drums on channel 10, so any GM soundfont works:

```bash
fluidsynth -ni GeneralUser-GS.sf2 out/01-satumaan-ruusu.mid -F out/01.wav -r 48000
```

Then batch-convert to OGG/Vorbis for whatever plays it back. A better soundfont is the single biggest quality win available — the GM accordion and string ensemble in a good bank sound dramatically more convincing than the webaudiofont defaults.

### 3. Or drive a runtime sampler

`manifest.json` plus the MIDI gives you per-layer tracks (`drums, bass, comp, pad, melody, counter, brass`) as separate MIDI tracks. If you want the music to thin out under speech, mute layers rather than lowering a master bus — that is the same mechanism the audition page's layer chips use, and it is the hook for layered-ambient playback.

---

## Verifying

```bash
npm run verify      # typecheck + notation validity + musical audit
npm run strictness  # violations and musical cost at each smoothness level
npm run moods       # what each mood does to key, tempo and dance choice
```

The audit measures whether the output obeys the rules the style tables claim. Current numbers over 60 songs:

```
chord tone on the beat        78.4%      (want > 70%)
stepwise (<= 2 semitones)     55.9%      (want 55-70%)
  unison 10.9% · 2nd 55.9% · 3rd 21.9% · 4th 4.8% · 5th 3.9% · 6th-7th 2.1%
average melodic range         15.2 semitones
sections closing on the tonic 74.1%
overlapping melody notes      0
```

`npm run check` validates 100k+ bars of emitted mini-notation — worth running after touching the Strudel grid builder, since a bar may never begin with a sustain marker.

---

## Known limitations

- **Per-note velocity is not carried into the Strudel render.** Mini-notation has no inline velocity, and emitting a parallel gain pattern would double the output for an audition tool. Dynamics survive at the layer level there, and **fully in the MIDI**, which is what ships.
- **Soundfonts stream from a public CDN** (`felixroos.github.io/webaudiofontdata`) in the browser preview. Fine for development; use `setSoundfontUrl()` to self-host if you ever want the preview offline.
- **No counterpoint between melody and counter-line** beyond gap-filling. The counter-melody answers in the melody's holes rather than being independently voice-led against it.
- The generator writes **instrumental** music only, as requested. Nothing models a vocal line's phrasing constraints beyond keeping the lead in a singable range.

## Layout

```
src/core/       pitch, scales, chords, roman numerals, voice leading, Song IR
src/style/      dance definitions, era profiles, moods, instrument palettes
src/generate/   form, harmony, motif melody engine, accompaniment parts, titles
src/render/     midi.ts (ships)  ·  strudel.ts (auditions)
src/web/        browser preview  ·  audio.ts is the Strudel playback layer
src/cli.ts      batch generator
```
