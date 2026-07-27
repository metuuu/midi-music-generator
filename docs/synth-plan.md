# Synth — plan

A fourth genre. Vangelis, Jarre, Kraftwerk and the Tangerine Dream that had a drum
machine: analogue synthesisers, step sequencers and rhythm boxes, 1972–1990.

This document settles the contracts first so the pieces can be built in parallel, says
what each owns, and designs the four mechanical gaps the genre exposes. When it is
built, this file becomes `docs/synth.md` and describes what exists rather than what is
intended.

---

## 1. The one architectural claim

**"Old electronic music" is four different genres of music sharing one instrument
catalogue, and only one of those four is already in the repo.**

Apply the test that made `Genre` an abstraction — *where does the melody get its
notes* — to the four names:

- **Tangerine Dream 1974–77** (*Phaedra*, *Rubycon*) — one chord for seventeen
  minutes with a sequencer over it. Drone-relative. **Already shipped**, as
  `ambient/kosmische`.
- **Tangerine Dream 1980s** (*Le Parc*, *Legend*) — chord changes every two bars, a
  kit, a tune. Not the same music.
- **Jarre** (*Oxygène*, *Équinoxe*) — real melodies, real key centres, sections that
  arrive with a bang.
- **Vangelis** (*Blade Runner*, *Chariots of Fire*) — a lyrical lead over slow
  modal-romantic harmony. The lead *is* the piece.
- **Kraftwerk** — verse/chorus pop with a vocoder and real cadences.

The last four share a palette and a decade, which in this codebase is `EraProfile`,
not `Genre`. What earns them a genre is that they contradict ambient on seven
fields, and every one of those fields is a statement ambient makes on purpose:

| | ambient, as written | this genre |
|---|---|---|
| `mix.melody` vs `mix.pad` | 0.55 vs 0.78 — inverted deliberately | melody on top; the tune is the point |
| `mix.comp` | 0.5 — accompaniment | 0.72 — the sequencer is a **co-lead**, not backing |
| `keyChangeChance` | 0 in all three eras | the epic lift is a signature move |
| `drumFills` | `false` on all six styles | arrivals are announced, loudly |
| `SoloProfile` | absent, and `npm run genres` asserts it | the lead break is the climax |
| `unresolved-leading-tone` | disabled | Kraftwerk cadences; Vangelis suspensions resolve |
| harmonic rhythm | 1–2 chords per 8 bars | one chord per 2–4 bars |

Seven contradictions is a genre. One genre, not three — see §2.

### What this genre does *not* claim

**It is not a fourth answer to the chord-scale question, and the plan should not
pretend otherwise.** Its `scaleForChord` is iskelmä's minus one line:

```ts
// iskelma
if (mode === 'minor' && chord.dominantFunction) return makeScale(tonic, 'harmonicMinor');
return makeScale(tonic, mode === 'minor' ? 'minor' : 'major');
```

Synth is the same rule with the harmonic-minor substitution removed, plus a
mode-inflection for borrowed chords (`bVII` → mixolydian, `bII` → phrygian) borrowed
straight from `ambient/index.ts`'s brightness search. It follows the **key**, like
pop; it does not re-orient per chord like jazz, and it does not refuse to modulate
like ambient. That is roughly twenty lines. The genre is justified by the table
above, not by a novel scale rule, and saying so here prevents someone later
discovering the resemblance and concluding the genre was a mistake.

---

## 2. Decisions settled

**Genre id `synth`, label "Synth".** Matches the one-word ids already in use
(`iskelma`, `jazz`, `ambient`). Description: *"Berlin-school sequencers, machine pop,
cinematic analogue and cosmic disco — 1972 to 1990."*

**One genre, five styles.** Kraftwerk and Vangelis feel far apart, but not further
apart than bebop and bossa nova, which live in one `jazz`. Everything separating them
— tempo, groove, progression tables, melody knobs, drum patterns — is what `Style`
exists to express, and the palette differences are what `EraProfile` exists to
express. Three genres would triplicate `scaleForChord`, forms, keys and titles for
nothing.

**Style id `berlin`, not `sequence`.** `Style.melody.sequence` already means the
probability a phrase repeats its motif. Two meanings of "sequence" one field apart is
a bug waiting to be written.

**Ambient is not reworked.** Two edits only, both in §8.

**The four gaps are in scope.** A genre that needs a filter sweep and gets a static
cutoff is a genre that renders as slow pop with a nice patch. §4–§7 design them.

### Assumption worth flagging

`stalker` (§3, the Carpenter end) is not one of the four artists named in the
request. It is included because it is the same decade, the same instruments and the
same three-layer texture, it fills the dark corner the way `wasteland` does in
ambient, and it is the style in this genre most directly usable as game music. If
that reads as scope creep, it is the one style to cut, and cutting it costs nothing
else in this plan.

---

## 3. The genre

### 3.1 Styles — `src/genre/synth/styles.ts`

| Style | BPM | Meter | Mode | Defining traits |
|---|---|---|---|---|
| **`berlin`** | 108–140 | 4/4 | 80% minor | The sequencer is the riff. Harmony moves every 2 bars, a real kit, `filter: ramp` — the filter opens across the section |
| **`cinematic`** | 60–84 | 4/4 | 55% minor | maj7/sus4, plagal and mediant motion, a soaring lead, `keyChangeChance` used hard, `SoloProfile` active |
| **`machine`** | 116–132 | 4/4 | 65% minor | `swing: 0`, `hook: earworm`, verse/chorus, vocoder vocals. The bass line is the tune; four-note melodies repeated exactly |
| **`cosmic`** | 118–130 | 4/4 | 40% minor | Four-on-the-floor under a running 16th sequencer. Euphoric, major-leaning, instrumental |
| **`stalker`** | 84–104 | 4/4 and 5/4 | 92% minor | The ostinato bass **is** the composition. `bII` and tritone, `drumFills: false`, `hook: earworm` |

Naming notes: `cinematic` over `widescreen` because it is what someone would grep
for. `stalker` over `carpenter` because the repo names styles after the sound, not
the person, and puts the person in the docstring — `hauntology` and `wasteland`
already set that precedent.

Two styles need a table shape the others do not:

- **`berlin` and `cosmic` declare `counterPatterns`** (§5) — the second sequencer.
- **`machine` declares `vocals: true` material** and is the only style here written
  to be sung.

**Motorik is a drum pattern, not a style.** *Autobahn* and Neu! are `machine` with a
constant-eighths kit; ambient's `kosmische` already has a pattern literally named
`motorik`. Promoting it to a style would produce something indistinguishable from
`machine` at half the density.

### 3.2 Eras — `src/genre/synth/eras.ts`

Technology changed this music more than in any other genre here, so the eras are the
hardware:

| Era | Years | What it is | Drum banks |
|---|---|---|---|
| **`modular`** | 1972–77 | Monophonic leads, step sequencers, filter sweeps, preset rhythm boxes. No polyphony, no MIDI | `RhythmAce`, `KorgMinipops`, `RolandCompurhythm78`, `KorgKR55` |
| **`polysynth`** | 1978–83 | Prophet-5, CS-80, Jupiter-8, string machines, vocoder. The golden middle | `RolandTR808`, `LinnDrum`, `OberheimDMX`, `RolandCompurhythm1000` |
| **`digital`** | 1984–90 | DX7, D-50, Fairlight, gated reverb, FM bells, MIDI | `RolandR8`, `AlesisSR16`, `YamahaRY30`, `RolandD70` |

Two findings from `render/drum-banks.ts` that constrain this, both checked against
the pack rather than assumed:

**There is no TR-909 in the tidal-drum-machines pack.** It is the obvious bank for
`cosmic` and it does not exist. `OberheimDMX` and `LinnDrum` cover the ground.
`RolandTR808` also has **no ride** (`rd`) — fine here, since nothing in this genre
rides.

**`modular` deliberately breaks the rule ambient set.** Ambient requires every bank
to carry all six voices its styles emit, and that requirement cost it the period-
correct boxes ([`ambient/eras.ts:41`](../src/genre/ambient/eras.ts)). This genre goes
the other way: a preset rhythm box with four sounds *is* the 1974 sound, and
`drum-banks.ts` exists precisely so a missing voice substitutes instead of throwing.
`modular`'s styles are therefore written on `bd`/`sd`/`hh`/`oh` only, so the
substitution table is a safety net rather than a load-bearing part of the
arrangement. `npm run genres` asserts that no `modular` pattern asks for a voice its
banks lack.

### 3.3 Moods — `src/genre/synth/moods.ts`

Iskelmä sorts by degrees of melancholy, jazz by heat, ambient by weather and light.
This repertoire has always sold itself on **destination** — where the record is
taking you — and that is the only axis its sleeve notes have ever used.

`cosmos` · `motorway` · `neon` · `dread`

### 3.4 The rest of the genre object

```
forms          four: machine verse/chorus; berlin long-form with a solo section;
               cinematic statement–departure–lifted return; stalker loop
keys           minor D A C E G, major C F D A Eb — where these records actually live
duration       [150, 300]
defaultStrictness  'standard'
defaultHook    'catchy'  (machine and stalker push to 'earworm')
soloBacking    'full'    — see below
solo           rotation melody 5, counter 3, comp 2
space          reverbSize 0.7, delayBeats 0.75, delayFeedback 0.5
fills          tom-roll 4, lead-in 3, drop 3, snare-roll 2
```

`soloBacking: 'full'` is a genre claim worth its own comment in the code. Jazz thins
out under a soloist because comping is a conversation. Here the sequencer running
underneath is *the reason the solo works* — a rhythm section that dropped back would
remove the thing the lead is soaring over.

`ruleOverrides`, and specifically what is **not** overridden:

```
parallel-perfects      disabled   — planed synth-brass and a fifths lead are the sound
avoid-fourth           disabled   — sus2/sus4 is the Vangelis chord
unresolved-seventh     softened   — a held maj7 pad owes nobody a resolution
static-repetition      softened   — a Kraftwerk melody repeats one note a lot
unresolved-leading-tone  LEFT ON  — this is the line between this genre and ambient
```

---

## 4. Gap 1 — filter movement

**The largest gap, and the only one that changes the IR.** `Effects.lowpass` is one
number per track per song. A filter opening across sixteen bars is a substantial
fraction of what these records *are*; with a static cutoff, `berlin` is a slow pop
song with a nice patch on it.

### 4.1 The design

**`NoteEvent.brightness?: number`, 0..1 — a multiplier on the track's declared
cutoff, exactly as `velocity` is a multiplier on the track's `gain`.**

```
velocity : Track.gain  ::  brightness : Track.effects.lowpass
```

That symmetry is the whole design, and it settles four questions at once:

- **Where the absolute number lives.** In `Effects`, set by era and genre, as now.
  The era still decides how bright this decade is; the note decides only where in
  that range this moment sits.
- **What "no filter movement" means.** `brightness` absent. Three existing genres
  emit nothing and render byte-for-byte identically. This is asserted, not assumed —
  see §11.
- **How it renders.** Per-note, and both renderers already have the machinery.
- **Why not section-level `Effects`.** A per-section override steps at the boundary.
  The gesture this genre needs *sweeps across* the section, and a step is the one
  thing it must not be.

Cutoff is perceptually logarithmic, so the mapping closes by octaves rather than
linearly:

```ts
const SWEEP_OCTAVES = 4;
hz = lowpass * 2 ** (-SWEEP_OCTAVES * (1 - brightness));
// brightness 1.0 → 5000 Hz   (the era's declared cutoff)
// brightness 0.5 → 1250 Hz
// brightness 0.0 →  312 Hz   (shut)
```

### 4.2 Where brightness comes from — `src/generate/filter.ts`

A new module, deliberately parallel to `generate/dynamics.ts`, which already solves
the same shape of problem for level. It combines four things:

1. **Section kind.** An intro is dark, a chorus is open. Same table shape as
   `KIND_LEVEL`.
2. **Placement in the form.** Records build. The last chorus is the brightest thing
   in the song, and the outro closes back down.
3. **Layer response.** A sequencer comp swings the whole range; a bass barely moves,
   because a filtered bass does not sound distant, it sounds absent. Same shape as
   `LAYER_RESPONSE`.
4. **The within-section ramp — the new part.** `dynamics.ts` has no equivalent: it
   assigns one level per section per layer. This assigns a curve across the section's
   bars, and that curve is the Berlin-school gesture.

Declared in two places, both optional so absence means today's behaviour:

```ts
// Genre
filter?: FilterProfile;              // layer response + kind table for the genre

// Style
filter?: {
  depth: number;                     // 0 = flat, 1 = the full four octaves
  shape: 'ramp' | 'step';
};
```

`ramp` sweeps across the section. `step` sets one value per section and holds it —
what a genre wants if it wants brightness contrast but not a gesture. **A `gate`
shape is deliberately not in v1**: the gated sound in this repertoire is amplitude,
not filter, and `CompPattern.hits` already carries per-hit velocity. Adding a third
shape to chase a sound the engine can already make is how a knob becomes a museum.

### 4.3 Renderers

**Strudel — nearly free.** `render/strudel.ts` already has `buildValueGrid`,
documented as *"shared machinery for any per-note value pattern that shadows the
notes"*, and already uses it for `dynamicGrid` and the three formant grids. A
`filterGrid` is one more caller, emitted in place of the static `.lpf(n)` when the
track's brightness actually varies:

```js
  .lpf(`3200 _ _ _ 3600 _ _ _ ...`)     // varying
  .lpf(5000)                            // flat — unchanged from today
```

**MIDI — real but contained.** `controllersFor` currently emits CC74 once per track
at setup; it gains a time-ordered CC74 stream at note onsets. The existing docstring
already records the constraint that makes this safe: CC74 is GM2/GS and is defined
*relative to the patch's own filter*, so the renderer only ever uses it to **darken,
never to brighten**. Since `brightness ≤ 1` by construction, that invariant is
preserved for free — the sweep is always a partial close of the era's cutoff.

The caveat is the one already documented: a bare GM1 device ignores CC74 and plays
the unfiltered patch. The sweep is absent there rather than wrong, which is the same
bargain the repo already accepted.

### 4.4 Cost and risk

~250 lines: one new file, one optional field on `NoteEvent`, one on `Genre`, one on
`Style`, plus the two renderer call sites and the routing in `song.ts`.

**Risk: output size.** A 200-bar song gains a second full-length grid per track.
Mitigation: quantise brightness to ~16 steps before emitting, so consecutive equal
slots collapse to `_` — the same compression `dynamicGrid` already relies on — and
emit nothing at all when the track is flat.

---

## 5. Gap 2 — the second sequencer

The classic Berlin texture is **two sequences at different rates**, phasing against
each other. Today the `counter` layer answers in the melody's gaps, which is a
different musical idea.

### 5.1 The design

Two optional fields on `Style`, and no new generator:

```ts
counterMode?: 'answer' | 'ostinato';   // default 'answer' — today's behaviour
counterPatterns?: CompPattern[];       // read only when counterMode is 'ostinato'
```

When `ostinato`, `song.ts` writes the counter layer with `generateComp` and a pattern
from `counterPatterns`, at the counter instrument's centre, instead of calling
`generateCounter`. Downstream nothing changes: it is still a `counter` track with
notes in it, and the concert, audit and MIDI paths never learn this happened.

**The phase drift needs no new machinery at all.** `CompPattern.arpeggio` already
carries its step index across barlines — `generateComp` keeps `step` outside the bar
loop precisely for this. So a 5-hit counter pattern against a 16-hit comp pattern
produces genuine drift today, and that is exactly the texture. This gap is a routing
problem, not a synthesis one.

### 5.2 The two things that need care

**Register.** Two sequences in one octave is mud. The counter instrument's catalogue
centre is 72 and the comp's is 60, so they start an octave apart, and `arrange.ts`
already plans registers and repairs collisions. Expected to be sufficient; §11
measures it rather than assuming it.

**Clash repair must be skipped.** `avoidClash` moves counter notes off the melody.
An ostinato is a fixed figure and rewriting individual notes of it destroys the
thing — the figure is the point, not the pitches. Under `counterMode: 'ostinato'`
the counter is exempt from repair and relies on the register plan alone. This is a
deliberate weakening and the assertion in §11 is what stops it becoming a mud
generator.

---

## 6. Gap 3 — the vocoder

`machine` needs one, and `VocalProfile` nearly gets there already. What it cannot
express is the one thing that makes a vocoder recognisable.

### 6.1 The design

**One new field: `VoiceSettings.formantTrack: number`, 0..1.**

A human tract is a fixed size, so its formants sit where the tongue puts them — but
they cannot sit *below* the fundamental, and the renderer already knows this.
`effectiveF1` in `strudel.ts` nudges F1 up to meet F0 when the line sings high, with
a docstring explaining that this is what singers actually do: the jaw opens and the
vowel migrates toward /a/ whether the singer wants it or not.

**A vocoder does not do that.** It is a fixed bank of filters that a carrier is
pushed through, and the bank does not care what pitch arrives. `formantTrack` is how
much of that human compensation applies:

```
1.0  a person   — effectiveF1 applies in full (today's behaviour, and the default)
0.0  a vocoder  — the filter bank is fixed; high notes lose their body and that
                  hollow, buzzing thinness at the top of the range is the sound
```

That is a correct model of the difference rather than a knob that approximates it,
which is the standard `style/vocals.ts` sets for itself.

The rest is a preset in `genre/synth/vocals.ts`, needing no type changes:

```
vibDepth   0      a machine does not have a diaphragm
scoop      0      it arrives on the pitch; it does not reach for it
noise      0      no breath
bodyGain   raised a vocoder is buzzy — the carrier is audible through the bands
burstGain  raised consonants come through a vocoder hard
attack     fast
syllableBeats  locked to a subdivision rather than to the phrase
```

**Read `voiceParts` before implementing.** The exact interaction between
`formantTrack` and the existing F1 compensation is a fifteen-line function and this
plan should not over-specify it from the outside.

### 6.2 Explicitly deferred

**Polyphonic vocoding — a vocoder singing chords — is out of scope.** The `vocal`
layer doubles the melody, one line, and making it chordal touches the vocal path in
`song.ts`, the three formant grids in `strudel.ts`, and the singer's mouth in the
concert renderer. Kraftwerk's monophonic vocoder lines are the larger part of the
catalogue and cost one field; the chordal ones cost a project. If it is wanted later
it is its own plan.

---

## 7. Gap 4 — the catalogue

Four GM programs this genre needs and `style/instruments.ts` does not have:

| Id | GM | Why |
|---|---|---|
| `leadCharang` | 84 | The bright buzzy lead — the `cosmic` top line |
| `leadFifths` | 86 | Parallel-fifths lead. Very Jarre and very TD |
| `leadBassLead` | 87 | Bass and lead in one patch — the `machine` riff instrument |
| `synthBrass2` | 63 | The second brass patch, for `cinematic` stabs and swells |

Each needs an `INSTRUMENTS` entry, an `INSTRUMENT_RANGE` entry (`[21, 108]` for the
leads, `[36, 84]` for the brass) and nothing else. `cast.ts` resolves an unmapped
program through `archetypeForTrack(track) ?? 'synth'`, and `synth` is the correct
stage archetype for all four — but the fallback should be made explicit rather than
left to luck, since "correct by accident" is exactly what stops being correct.

**`leadFifths` needs a comment, and probably a decision.** GM 86 bakes a harmony
interval into the patch: the constraint engine writes one line and the soundfont
adds a fifth above every note of it. That silently routes around `parallel-perfects`
— which this genre disables anyway, and for the same reason it wants the patch. The
hazard is that it also means the *audit* is measuring a line that is not what will be
heard. Worth stating in the catalogue entry so nobody debugs it twice.

---

## 8. What ambient does about this

**Not a rework.** Two edits, both small, both about telling the truth:

1. **Narrow `kosmische`'s docstring.** It currently says "Tangerine Dream and Klaus
   Schulze" ([`ambient/styles.ts:396`](../src/genre/ambient/styles.ts)). After this
   it should say *which* Tangerine Dream — the drone-and-sequencer one where harmony
   changes once a minute, as opposed to `synth/berlin`, which is the same instrument
   doing a different job. Both files get the cross-reference; the overlap is the one
   real collision between these genres and it should be written down in both places
   rather than discovered.

2. **Nothing else.** Ambient's inverted mix, zero key change and absent soloist are
   correct for what it covers. The new genre disagreeing with all three is the
   argument for it existing, not an argument for changing ambient.

---

## 9. File layout

```
NEW
src/genre/synth/index.ts      the genre object, forms, keys, scaleForChord
src/genre/synth/styles.ts     five styles
src/genre/synth/eras.ts       modular, polysynth, digital
src/genre/synth/moods.ts      cosmos, motorway, neon, dread
src/genre/synth/vocals.ts     the vocoder profile
src/genre/synth/titles.ts     title generator
src/generate/filter.ts        brightness envelopes — parallel to dynamics.ts
docs/synth.md                 the ruleset, once it exists

TOUCHED
src/core/types.ts             NoteEvent.brightness, VoiceSettings.formantTrack
src/style/types.ts            Style.filter, counterMode, counterPatterns
src/genre/types.ts            Genre.filter
src/style/instruments.ts      four entries + ranges
src/generate/song.ts          apply brightness; route the ostinato counter
src/render/strudel.ts         filterGrid via buildValueGrid
src/render/midi.ts            CC74 as a stream rather than a setup value
src/genre/index.ts            register the genre
src/genre-check.ts            the assertions in §11
src/genre/ambient/styles.ts   one docstring (§8)
```

---

## 10. Work breakdown

### Wave 0 — contracts *(sequential, single owner)*

The type additions in `core/types.ts`, `style/types.ts`, `genre/types.ts`. Every
field optional; `npm run typecheck` and the full `npm run verify` pass unchanged
before anything else starts. Nothing in Wave 1 can begin until these land, and
nothing in Wave 1 may change them.

### Wave 1 — parallel, no dependencies beyond the contract

- **A. Filter.** `generate/filter.ts`, plus both renderers. The largest piece.
- **B. Catalogue.** The four instruments, ranges, and the explicit `cast.ts` mapping.
- **C. Genre tables.** `styles.ts`, `eras.ts`, `moods.ts`, `titles.ts`. Needs no new
  machinery — this is the biggest piece by line count and the least risky.
- **D. Vocoder.** `formantTrack` and the `machine` voice profile.

### Wave 2 — integration, needs Wave 1

`genre/synth/index.ts`; routing in `song.ts` for brightness and the ostinato counter;
registration in `genre/index.ts`. First end-to-end render.

### Wave 3 — the pass that decides whether it is good

Assertions (§11), then the tuning pass: generate forty of each style and listen. The
tables in Wave 1C are a first guess and the numbers that matter — tempo bands,
progression weights, filter depth — are the ones only listening settles. Then
`docs/synth.md`.

---

## 11. Verification — additions to `npm run genres`

Adding a genre is not free: `genre-check.ts` loops over `GENRE_IDS` for roughly ten
cross-genre invariants (fills at section boundaries, brass ranges, strictness
monotonicity, comp/melody clash rates, solo integrity), and the new genre is subject
to all of them from the moment it is registered. `npm run audit` and `npm run
ensemble` likewise.

Six new assertions, each a claim the genre *is* rather than a setting it has:

1. **The raised seventh never appears in a minor-key synth song.** The genre's
   central negative claim, and the line between it and iskelmä. Parallel to ambient's
   "no chord has dominant function", and the same kind of claim: negative, load-
   bearing, and exactly what an innocent edit undoes quietly.
2. **No regression from `brightness`.** Songs in `iskelma`, `jazz` and `ambient`
   carry no `brightness` on any note, and their rendered Strudel is unchanged. This
   is the assertion that makes the IR change safe.
3. **A ramp actually ramps.** In a `berlin` song, mean brightness over a section's
   last quarter exceeds its first quarter, on every section of every seed.
4. **The sequencer drifts.** `berlin`'s comp does not repeat its pitch sequence
   bar-for-bar. Directly parallel to the existing `kosmische` check at
   [`genre-check.ts:245`](../src/genre-check.ts).
5. **The ostinato counter survives.** Its figure repeats exactly where the pattern
   says it should — i.e. the clash-repair exemption in §5.2 is in force — *and* its
   unison-with-melody rate stays under the threshold the cross-genre clash check
   already applies. Both halves matter: the first proves the exemption works, the
   second proves it did not cost anything.
6. **`modular` asks its banks for nothing they lack.** No pattern in a `modular`-
   weighted style emits a voice outside `bd`/`sd`/`hh`/`oh`.

And one that is worth having precisely because it is embarrassing to fail:

7. **`berlin` and `ambient/kosmische` are distinguishable.** Chords per eight bars is
   the honest discriminator: `kosmische` sits at 1–2, `berlin` at 4. If these two
   converge, one of them should not exist.

---

## 12. Risks

**The tables are five styles' worth of guesswork.** Mitigated by ordering — Wave 1C
needs no new machinery, so it can be written and heard early, before the filter work
lands.

**`berlin` collapses into `kosmische`.** Assertion 7 catches it mechanically; the
tuning pass catches it by ear.

**Strudel output size.** Mitigated in §4.4. Watch it during Wave 2 — if a 200-bar
`berlin` render becomes unreadable, that is a real cost to the audition tool and the
answer is coarser brightness quantisation, not abandoning the grid.

**CC74 is GM2.** The sweep is absent on a bare GM1 device. Already the documented
bargain for `lowpass`; this does not make it worse, but it does make it more
audible when missing, since the sweep is now musical content rather than mix.

**`leadFifths` bakes harmony into the patch** (§7). Contained, but write it down.

---

## 13. What "done" looks like

- `npm run gen --genre synth` produces all five styles across all three eras.
- `npm run verify` passes, including the seven new assertions and every cross-genre
  invariant the new genre inherited.
- A `berlin` render has an audible filter opening across its sections; a `machine`
  render has a vocoder on it; a `cinematic` render lifts its last chorus.
- The three existing genres render byte-for-byte identically to before this work.
- `docs/synth.md` exists and `docs/synth-plan.md` is deleted.
