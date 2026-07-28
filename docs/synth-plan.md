# Synth — plan

A fourth genre — Vangelis, Jarre, Kraftwerk and the Tangerine Dream that had a drum
machine — and the engine surgery it exposes.

The genre is the occasion. The surgery is the point: this plan changes three things
in the engine that currently make **every genre sound like the same music at a
different tempo**, and it changes them first, because a new genre built on top of
those constraints would inherit them.

When it is built, this file becomes `docs/synth.md`.

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
not `Genre`. What earns them a genre is that they contradict ambient on seven fields,
every one of which ambient states on purpose:

| | ambient, as written | this genre |
|---|---|---|
| `mix.melody` vs `mix.pad` | 0.55 vs 0.78 — inverted deliberately | melody on top; the tune is the point |
| `mix.comp` | 0.5 — accompaniment | 0.72 — the sequencer is a **co-lead** |
| `keyChangeChance` | 0 in all three eras | the epic lift is a signature move |
| `drumFills` | `false` on all six styles | arrivals are announced, loudly |
| `SoloProfile` | absent, and `npm run genres` asserts it | the lead break is the climax |
| `unresolved-leading-tone` | disabled | Kraftwerk cadences resolve |
| harmonic rhythm | 1–2 chords per 8 bars | one chord per 2–4 bars |

### What this genre does *not* claim

**It is not a fourth answer to the chord-scale question.** Its `scaleForChord` is
iskelmä's minus one line:

```ts
// iskelma
if (mode === 'minor' && chord.dominantFunction) return makeScale(tonic, 'harmonicMinor');
return makeScale(tonic, mode === 'minor' ? 'minor' : 'major');
```

Synth is that with the harmonic-minor substitution removed, plus the borrowed-chord
mode inflection (`bVII` → mixolydian, `bII` → phrygian) lifted from ambient's
brightness search. It follows the **key**, like pop; it does not re-orient per chord
like jazz, and it does not refuse to modulate like ambient. Twenty lines. The genre
is justified by the table above, not by a novel scale rule, and saying so now stops
someone later finding the resemblance and concluding the genre was a mistake.

---

## 2. What the engine currently forces every genre to sound like

This section exists because of a standing instruction: the system must not make it
hard for genres to be *hugely* different, and where it does, the fix takes priority
over compatibility. So before adding a fourth genre, here is what the third one had
to work around, ranked by how much it flattens the music.

### 2.1 The bar is the unit of everything — **fix now, §4**

`BassPattern.hits`, `CompPattern.hits`, `DrumPattern.voices` and `melodyCells` are
**all exactly one bar long and repeat**. `Progression.chords` is one roman numeral
**per bar**, no faster and no slower.

That single fact is the largest homogeniser in the project. Every rhythm section in
every genre states a one-bar figure and repeats it until the section ends. But:

- A Kraftwerk bass line is a **two-bar** figure — that is what makes it a riff rather
  than a pattern.
- A Berlin-school sequence is **two or four bars**, and its whole appeal is that you
  hear the loop's length.
- `stalker`'s identity is a **multi-bar ostinato**; written one bar at a time it is
  just a pulse.
- A bebop `ii–V` occupies **half a bar each**, and cannot be written at all today.
- A tango's phrase is two bars, and iskelmä has been writing it as one bar twice.

`CompPattern.arpeggio` carries its step index across barlines, which produces a
multi-bar *artifact* — but as phase drift, not as a written figure. It is the
exception that shows the rule: the one place the engine escapes the bar, it produced
the most distinctive texture in the project.

**Verdict: fix now.** This is the highest-leverage change available and it is not a
large diff — see §4.

### 2.2 The arranger imposes one texture shape — **partial fix now, §7**

`arrange.ts` stratifies the register bass < comp < pad < melody, and `dynamics.ts`
holds a single global `LAYER_RESPONSE` table. Both are correct for a dance band and
were written for one. A genre whose texture is *two sequencers and a drone* has no
way to say so; ambient could only express "the pad is the piece" as a mix number,
which changes the level but not the register plan or the dynamics.

**Verdict: partial fix now.** A genre declares its own register order and layer
response. The full version — layers as genre-declared roles instead of a fixed enum
of eight — is deferred, with reasons in §7.2.

### 2.3 One drum kit, one bank, one treatment — **partial fix now, §8.4**

`DrumTrack` has one `bank` and one `effects`. Gated reverb on the snare **and nothing
else** is the single most recognisable production gesture of 1984, and it cannot be
expressed. `voiceGains` already exists per voice; `effects` does not.

**Verdict: add `voiceEffects`.** Layering two banks is deferred.

### 2.4 Instruments are General MIDI programs — **fix now, §8**

An `Instrument` is a GM program plus a soundfont name. GM has no electric violin, no
electric vibraphone, and no way to say "this instrument, but through an amp". §8
fixes this properly rather than by picking approximate patches.

### 2.5 One tempo, one meter, for the whole song — **defer**

`SongMeta.bpm`, `beatsPerBar` and `swing` are song-level. No accelerando, no meter
change. Vangelis and TD both do both. Deferred because nothing in the five styles
below needs it, and because tempo is the concert renderer's clock — the blast radius
is the entire visual runtime, which deserves its own plan rather than a corner of
this one.

### 2.6 Section kinds are pop-song kinds — **leave, and write it down**

`intro / verse / chorus / bridge / solo / outro`. Ambient already reinterprets these
as texture stages in a docstring, which is an abstraction being patched by comment.
Left alone: renaming them buys vocabulary, not behaviour, and the behaviour is
already fully controlled by `forms`, `progressions` and `layersFor`. Recorded here as
known debt so the next genre that strains against it has a starting point.

---

## 3. Decisions settled

**Genre id `synth`, label "Synth".** Matches the one-word ids in use.
Description: *"Berlin-school sequencers, machine pop, cinematic analogue and cosmic
disco — 1972 to 1990."*

**One genre, five styles.** Kraftwerk and Vangelis feel far apart, but not further
apart than bebop and bossa nova, which live in one `jazz`. What separates them is
what `Style` and `EraProfile` exist to express. Three genres would triplicate
`scaleForChord`, forms, keys and titles for nothing.

**Style id `berlin`, not `sequence`.** `Style.melody.sequence` already means the
probability a phrase repeats its motif.

**`stalker` is in**, not a cut candidate. It is also the style that most needs §4:
a Carpenter ostinato written one bar at a time is not an ostinato.

**Compatibility is not a goal.** Existing genre tables will be edited where the new
time model improves them, and the existing "renders identically" style of assertion
is replaced by a measured-character check — see §11.

---

## 4. The bar stops being the unit

**One idea, applied in four places: a table declares its own time span.**

### 4.1 Patterns get a length in bars

```ts
interface BassPattern  { name; weight; bars?: number; hits: BassHit[];  ... }
interface CompPattern  { name; weight; bars?: number; hits: CompHit[];  ... }
interface DrumPattern  { name; weight; bars?: number; voices: ...;      }
interface WeightedCell { cell: RhythmCell; weight: number; bars?: number }
```

`bars` defaults to 1, so every existing table keeps its meaning without edits. Slot
indices run `0 .. bars * slotsPerBar - 1`, so a two-bar 4/4 figure uses slots 0–31 and
its second bar starts at 16.

The generator change is three loops in `parts.ts` plus one in `rhythm.ts`, and it is
the same shape in each:

```ts
const span = pattern.bars ?? 1;
for (let bar = 0; bar < chords.length; bar++) {
  const phase = bar % span;                      // where we are inside the figure
  for (const hit of pattern.hits) {
    if (Math.floor(hit.at / slotsPerBar) !== phase) continue;
    const slot = hit.at % slotsPerBar;
    // tone resolves against chords[bar] — the *sounding* bar, not the figure's
  }
}
```

The one subtlety worth stating: `BassHit.tone` is `'root' | 'fifth' | …`, resolved
against the chord of the bar the hit lands in, **not** the bar the figure started in.
A two-bar figure crossing a chord change therefore re-roots halfway through, which is
what a bass player does and what a sequencer transposed by the chord does. It is also
why `bars` cannot simply be sugar for "write the pattern out twice".

### 4.2 Progressions get a duration per chord

```ts
// today
chords: ['i9', 'i9', 'VI', 'VI']

// after
chords: ['i9', 'i9', 'VI', 'VI']                    // still legal — one per bar
chords: [['ii7', 2], ['V7', 2], ['Imaj7', 4]]       // beats, so half-bar ii–V works
```

A `string` entry means one bar, as now. A `[symbol, beats]` entry means that many
beats. `expandProgression` already stretches a progression to fill a section; it
gains the beat-aware branch, and `Section.chordLabels` — currently one label per bar
— becomes one label per *change* with its bar and beat.

`synth` does not need sub-bar harmony; its harmony is slow. It is in scope anyway
because it is the same idea as §4.1 arriving at the same time, because jazz has
wanted it since it was written, and because doing it later means touching
`expandProgression`, `Section` and every consumer of `chordLabels` twice.

### 4.3 What this unlocks, per style

| Style | Figure length | Why it matters |
|---|---|---|
| `machine` | 2-bar bass, 2-bar melody cell | The riff *is* the song |
| `berlin` | 4-bar comp sequence | You are meant to hear the loop's length |
| `stalker` | 4-bar ostinato bass | The composition |
| `cosmic` | 2-bar 16th sequence | Drift against a 1-bar kick |
| `cinematic` | 1-bar (unchanged) | Vangelis genuinely does not riff |

And outside this genre: jazz gets its `ii–V`, iskelmä's tango gets its two-bar phrase.
Whether those tables are rewritten to use it is a separate tuning pass, deliberately
not bundled here.

### 4.4 Cost

`style/types.ts` (four fields), `generate/parts.ts` (three loops), `generate/rhythm.ts`
(one), `generate/song.ts` (`expandProgression`, `chordLabels`), `core/types.ts`
(`Section.chordLabels` shape). Roughly 200 lines changed, most of it mechanical.

**Risk: the hook engine.** `generate/hook.ts` recalls sections by matching material,
and a multi-bar figure changes what "the same material" means. Check it early — an
`earworm` setting that no longer recognises its own riff would be a silent
regression, and `machine` and `stalker` both run at `earworm`.

---

## 5. Filter movement

`Effects.lowpass` is one number per track per song. A filter opening across sixteen
bars is a substantial fraction of what these records *are*; with a static cutoff,
`berlin` is a slow pop song with a nice patch on it.

### 5.1 The design

**`NoteEvent.brightness?: number`, 0..1 — a multiplier on the track's declared
cutoff, exactly as `velocity` multiplies the track's `gain`.**

```
velocity : Track.gain  ::  brightness : Track.effects.lowpass
```

That symmetry settles three questions at once: the absolute Hz stays in `Effects`
where the era owns it; the note decides only where in that range this moment sits;
and a per-section override is rejected because it *steps* at the boundary, which is
the one thing this gesture must not do.

Cutoff is perceptually logarithmic, so the mapping closes by octaves:

```ts
const SWEEP_OCTAVES = 4;
hz = lowpass * 2 ** (-SWEEP_OCTAVES * (1 - brightness));
// 1.0 → 5000 Hz (the era's cutoff)   0.5 → 1250 Hz   0.0 → 312 Hz (shut)
```

### 5.2 Where brightness comes from — `src/generate/filter.ts`

A new module, deliberately parallel to `generate/dynamics.ts`, which already solves
the same shape of problem for level. Four inputs:

1. **Section kind** — an intro is dark, a chorus is open. Same table shape as
   `KIND_LEVEL`.
2. **Placement in the form** — records build; the last chorus is brightest.
3. **Layer response** — a sequencer comp swings the whole range; a bass barely moves,
   because a filtered bass does not sound distant, it sounds absent.
4. **The within-section ramp — the new part.** `dynamics.ts` assigns one level per
   section per layer. This assigns a curve across the section's bars, and that curve
   is the Berlin-school gesture.

```ts
Genre.filter?: FilterProfile;                       // kind table + layer response
Style.filter?: { depth: number; shape: 'ramp' | 'step' };
```

**No `gate` shape in v1.** The gated sound in this repertoire is amplitude, not
filter, and `CompPattern.hits` already carries per-hit velocity.

### 5.3 Renderers

**Strudel — nearly free.** `strudel.ts` already has `buildValueGrid`, documented as
*"shared machinery for any per-note value pattern that shadows the notes"*, already
serving `dynamicGrid` and the three formant grids. `filterGrid` is one more caller,
replacing the static `.lpf(n)` when brightness varies.

**MIDI — real but contained.** `controllersFor` emits CC74 once per track at setup;
it gains a time-ordered CC74 stream at note onsets. The existing docstring records
why this is safe: CC74 is defined *relative to the patch's own filter*, so the
renderer only ever uses it to **darken**. `brightness ≤ 1` preserves that by
construction.

**Risk: output size.** A 200-bar song gains a full-length grid per track. Quantise
brightness to ~16 steps so equal slots collapse to `_`, and emit nothing when flat.

---

## 6. The second sequencer

The classic Berlin texture is **two sequences at different rates**, phasing against
each other. Today the `counter` layer answers in the melody's gaps, which is a
different musical idea.

```ts
Style.counterMode?: 'answer' | 'ostinato';   // default 'answer'
Style.counterPatterns?: CompPattern[];       // read when 'ostinato'
```

Under `ostinato`, `song.ts` writes the counter layer with `generateComp` and a pattern
from `counterPatterns` instead of calling `generateCounter`. Downstream nothing
changes — it is still a `counter` track with notes in it, and the concert, audit and
MIDI paths never learn this happened.

**The phase drift needs no new machinery.** `arpeggio` already carries its step index
across barlines, and after §4 a 4-bar counter figure against a 1-bar comp is
expressible directly. This is a routing problem, not a synthesis one.

**Clash repair must be skipped for an ostinato.** `avoidClash` moves counter notes off
the melody; rewriting individual notes of a fixed figure destroys the figure. Under
`ostinato` the counter is exempt and relies on the register plan alone — a deliberate
weakening that assertion 5 in §11 exists to police.

---

## 7. The arranger stops assuming a dance band

### 7.1 What changes now

Two tables move from global constants to genre-declared, both defaulting to today's
values:

```ts
Genre.layerPlan?: {
  /** Register stratification, lowest first. Default: bass, comp, pad, melody. */
  order: LayerId[];
  /** How far each layer swings between quietest and loudest section. */
  response: Partial<Record<LayerId, number>>;
};
```

`arrange.ts` reads `order` instead of its hardcoded stratification; `dynamics.ts`
merges `response` over `LAYER_RESPONSE`. Small change, and it makes ambient's "the pad
is the piece" a structural statement rather than a mix number — the pad gets to sit
*above* the comp in the register plan, which is what that music actually does.

`synth` uses it for `berlin` and `cosmic`: the comp sequence sits low and the counter
sequence high, with the lead above both.

### 7.2 What is deferred, and why

**Layers as genre-declared roles**, replacing the fixed enum of eight, is the real
fix. `brass` is vestigial in ambient by its own docstring; a genre wanting three
sequencers has to abuse names.

Deferred because `LayerId` appears in the Song IR, `arrange.ts`, `dynamics.ts`,
`solo.ts`, `cast.ts`, both renderers, every genre table and every reporting tool —
and because the *staging* consumes it: `cast.ts` maps a layer to a performer on a
stage, and a variable-length role list means a variable-length band. That is a real
piece of design, not a refactor, and bundling it here would stall the genre behind
it. §7.1 buys most of the musical benefit at a fraction of the blast radius.

Recorded as the next architectural piece after this plan lands.

---

## 8. Instruments — electric variants, and the catalogue

An `Instrument` is a GM program plus a soundfont name. GM has no electric violin and
no electric vibraphone, and no way to say "this instrument, through an amp". Picking
an approximate patch is the wrong fix, because an electric violin is not a different
instrument — **it is a violin with a pickup and an amp**, which is a statement about
processing, and the IR already has somewhere to put processing.

### 8.1 `Effects` gains three fields

All three verified present in superdough. All three audition-only, with no GM
controller — the same bargain `delay` and `highpass` already take.

```ts
drive?:  number;  // 0..1 overdrive / waveshaping        → .distort()
crush?:  number;  // bit depth, 16 = clean, 8 = grit     → .crush()
phaser?: number;  // 0..1 sweep depth                    → .phaser()
```

`phaser` earns its place independently: **a string machine through a phaser is more
characteristic of 1976 than any choice of patch**, and it is the single cheapest way
to make the `modular` era not sound like the `polysynth` one. `crush` is here for
`digital` and retroactively for ambient's `sampler` era, whose docstring already
describes audible aliasing it has no way to produce.

### 8.2 `Instrument` gains an effects delta

```ts
Instrument.effects?: Effects;   // what this instrument *is*, not where it is
```

Merge order becomes **era over genre, then instrument last** — because "electric" is a
property of the object, not of the decade, and a 1990s era should not be able to
un-drive an electric violin. In practice they compose on disjoint fields: eras speak
in `reverb` and `lowpass`, instruments in `drive` and `phaser`.

The variants this buys:

| Id | Base | Delta |
|---|---|---|
| `electricViolin` | `gm_violin` (40) | `drive 0.35`, `phaser 0.3`, brighter lowpass |
| `electricCello` | `gm_cello` (42) | `drive 0.3`, `phaser 0.25` |
| `electricVibes` | `gm_vibraphone` (11) | `drive 0.2`, `phaser 0.45` |
| `crushedPad` | `gm_pad_metallic` (93) | `crush 8` — the 12-bit pad |

### 8.3 Missing GM programs — all nine soundfonts verified present

Checked against `@strudel/soundfonts` rather than assumed:

| Id | GM | Font | Why |
|---|---|---|---|
| `leadCharang` | 84 | `gm_lead_5_charang` | The bright buzzy lead — `cosmic`'s top line |
| `leadFifths` | 86 | `gm_lead_7_fifths` | Parallel-fifths lead. Very Jarre, very TD |
| `leadBassLead` | 87 | `gm_lead_8_bass_lead` | Bass and lead in one patch — the `machine` riff |
| `synthBrass2` | 63 | `gm_synth_brass_2` | `cinematic` stabs and swells |
| `clavinet` | 7 | `gm_clavinet` | The 70s electric keyboard |
| `percussiveOrgan` | 17 | `gm_percussive_organ` | Period-correct, and missing |
| `slapBass` | 36 | `gm_slap_bass_1` | Very 1983 |
| `overdriveGuitar` | 29 | `gm_overdriven_guitar` | The hard edge of `machine` |
| `distortionGuitar` | 30 | `gm_distortion_guitar` | `stalker`'s one non-synth colour |

Each needs an `INSTRUMENTS` entry and an `INSTRUMENT_RANGE` entry. `cast.ts` resolves
an unmapped program through `archetypeForTrack(track) ?? 'synth'`, which is correct
for the four leads by luck — make it explicit, since "correct by accident" is exactly
what stops being correct.

**`leadFifths` needs a warning comment.** GM 86 bakes a harmony interval into the
patch: the engine writes one line and the soundfont adds a fifth above every note.
That routes around `parallel-perfects` — which this genre disables anyway — but it
also means the *audit* measures a line that is not what will be heard.

### 8.4 Electric drums

**Already solved, from an unexpected direction.** Electric drums in this repertoire
*are* the drum machines, and `EraProfile.drumBanks` has had them all along: TR-808,
TR-909, LinnDrum, OberheimDMX. Nothing to add.

What is missing is per-voice treatment:

```ts
DrumTrack.voiceEffects?: Partial<Record<DrumVoice, Effects>>;
```

**Gated reverb on the snare and nothing else is the 1984 sound**, and today `effects`
applies to the whole kit. `voiceGains` already establishes the per-voice shape, so
this is a sibling field and the Strudel renderer already emits one pattern per voice —
it is nearly free on that side.

Layering two banks in one song (an acoustic snare over an electronic one) is deferred:
`DrumTrack` is singular throughout the IR, the renderers and the concert stage, and
one drummer plays one kit.

---

## 9. The genre

### 9.1 Styles — `src/genre/synth/styles.ts`

| Style | BPM | Meter | Mode | Figure | Defining traits |
|---|---|---|---|---|---|
| **`berlin`** | 108–140 | 4/4 | 80% minor | 4-bar comp | The sequencer is the riff. Harmony every 2 bars, `filter: ramp` |
| **`cinematic`** | 60–84 | 4/4 | 55% minor | 1-bar | maj7/sus4, plagal and mediant motion, soaring lead, key lift, solos |
| **`machine`** | 116–132 | 4/4 | 65% minor | 2-bar bass | `swing: 0`, `hook: earworm`, verse/chorus, vocoder. The bass is the tune |
| **`cosmic`** | 118–130 | 4/4 | 40% minor | 2-bar seq | Four-on-the-floor under a running 16th sequence. Euphoric, instrumental |
| **`stalker`** | 84–104 | 4/4 and 5/4 | 92% minor | 4-bar ostinato | The ostinato bass **is** the composition. `bII` and tritone, no fills |

Naming: `cinematic` over `widescreen` because it is what someone would grep for.
`stalker` over `carpenter` because the repo names styles after the sound and puts the
person in the docstring — `hauntology` and `wasteland` set that precedent.

**Motorik is a drum pattern, not a style.** *Autobahn* and Neu! are `machine` with a
constant-eighths kit; ambient's `kosmische` already has a pattern named `motorik`.

### 9.2 Eras — `src/genre/synth/eras.ts`

| Era | Years | What it is | Drum banks |
|---|---|---|---|
| **`modular`** | 1972–77 | Mono leads, step sequencers, filter sweeps, preset rhythm boxes. Heavy `phaser` | `RhythmAce`, `KorgMinipops`, `RolandCompurhythm78`, `KorgKR55` |
| **`polysynth`** | 1978–83 | Prophet-5, CS-80, Jupiter-8, string machines, vocoder | `RolandTR808`, `LinnDrum`, `OberheimDMX`, `RolandCompurhythm1000` |
| **`digital`** | 1984–90 | DX7, D-50, Fairlight, gated snare, FM bells. Some `crush` | `RolandTR909`, `RolandR8`, `AlesisSR16`, `YamahaRY30` |

Read from the sample pack itself, not from `BANK_VOICES` — which documents its own
limit: *"an unlisted bank is assumed complete"*, so absence there means unmeasured,
not unavailable.

**`RolandTR909` is in the pack** and is the right bank for `cosmic` and `digital`. It
carries `bd sd rim hh oh cp cr rd` and three toms; it has **no `perc`, `cb` or `sh`**,
so it needs a `BANK_VOICES` row or those resolve to nothing.

**`RolandTR808` has no ride.** Confirmed. Harmless — nothing here rides — but worth
the row.

**`modular` inverts the rule ambient set.** Ambient restricted itself to banks
carrying all six voices its styles emit, and that cost it the period-correct boxes:
Minipops and CompuRhythm 78 were excluded for having no side stick. But a four-sound
preset box *is* the 1974 sound, so this era restricts the **patterns** instead of the
**banks**. The four banks intersect at exactly `bd`/`sd`/`hh`/`oh`:

```
KorgMinipops          bd sd hh oh
RolandCompurhythm78   bd sd hh oh   perc cb tb
RhythmAce             bd sd hh oh   perc lt ht
KorgKR55              bd sd hh oh   perc cb cr rim ht
```

so `modular`'s styles are written on those four and nothing else, and
`drum-banks.ts`'s substitution table never fires for this era. That matters because
substitution degrades **silently** — the repo has already been bitten: on the two
oldest iskelmä banks the section-ending fills "were not quiet, they were absent".

### 9.3 Moods — `src/genre/synth/moods.ts`

Iskelmä sorts by degrees of melancholy, jazz by heat, ambient by weather and light.
This repertoire has always sold itself on **destination** — where the record is
taking you.

`cosmos` · `motorway` · `neon` · `dread`

### 9.4 The rest of the genre object

```
forms          machine verse/chorus; berlin long-form with a solo section;
               cinematic statement–departure–lifted return; stalker loop
keys           minor D A C E G, major C F D A Eb
duration       [150, 300]
defaultStrictness  'standard'
defaultHook    'catchy'   (machine and stalker push to 'earworm')
soloBacking    'full'
solo           rotation melody 5, counter 3, comp 2
layerPlan      berlin/cosmic: comp low, counter high, lead above both
space          reverbSize 0.7, delayBeats 0.75, delayFeedback 0.5
fills          tom-roll 4, lead-in 3, drop 3, snare-roll 2
```

`soloBacking: 'full'` deserves its own comment in the code. Jazz thins out under a
soloist because comping is a conversation. Here the sequencer running underneath is
*the reason the solo works* — a rhythm section that dropped back would remove the
thing the lead is soaring over.

`ruleOverrides`, and specifically what is **not** overridden:

```
parallel-perfects        disabled  — planed synth brass and a fifths lead are the sound
avoid-fourth             disabled  — sus2/sus4 is the Vangelis chord
unresolved-seventh       softened  — a held maj7 pad owes nobody a resolution
static-repetition        softened  — a Kraftwerk melody repeats one note a lot
unresolved-leading-tone  LEFT ON   — the line between this genre and ambient
```

---

## 10. The vocoder

`machine` needs one, and `VocalProfile` nearly gets there. What it cannot express is
the one thing that makes a vocoder recognisable.

**One new field: `VoiceSettings.formantTrack: number`, 0..1.**

`effectiveF1` in `strudel.ts` nudges F1 up to meet the fundamental when the line sings
high, with a docstring explaining that this is what singers actually do — the jaw
opens and the vowel migrates toward /a/ whether the singer wants it or not. **A
vocoder does not do that.** It is a fixed bank of filters a carrier is pushed through,
and the bank does not care what pitch arrives.

```
1.0  a person   — effectiveF1 applies in full (default, today's behaviour)
0.0  a vocoder  — the bank is fixed; high notes lose their body, and that hollow
                  buzzing thinness at the top of the range is the sound
```

The rest is a preset in `genre/synth/vocals.ts` needing no type change: `vibDepth 0`
(no diaphragm), `scoop 0` (it arrives on the pitch, it does not reach for it),
`noise 0`, raised `bodyGain` and `burstGain`, fast attack, `syllableBeats` locked to a
subdivision rather than to the phrase.

**Read `voiceParts` before implementing** — the interaction with the existing F1
compensation is a fifteen-line function and should not be over-specified from outside.

**Polyphonic vocoding is out of scope.** The `vocal` layer doubles the melody, one
line; making it chordal touches the vocal path in `song.ts`, three formant grids in
`strudel.ts`, and the singer's mouth in the concert renderer. Kraftwerk's monophonic
lines are the larger part of the catalogue and cost one field. The chordal ones cost a
project.

---

## 11. Ambient

Not a rework. Two edits, both about telling the truth, plus two opportunities the new
machinery opens.

1. **Narrow `kosmische`'s docstring.** It says "Tangerine Dream and Klaus Schulze";
   it should say *which* Tangerine Dream — the drone-and-sequencer one where harmony
   changes once a minute, as opposed to `synth/berlin`, the same instrument doing a
   different job. Both files get the cross-reference.
2. **Nothing else is required.** Ambient's inverted mix, zero key change and absent
   soloist are correct for what it covers.

Opened up, and worth a follow-up pass rather than this plan:

- `crush` on the `sampler` era, whose docstring already describes aliasing it cannot
  produce.
- `layerPlan` to put the pad *above* the comp in the register plan, making "the pad is
  the piece" structural rather than a mix number.

---

## 12. File layout

```
NEW
src/genre/synth/index.ts      genre object, forms, keys, scaleForChord
src/genre/synth/styles.ts     five styles
src/genre/synth/eras.ts       modular, polysynth, digital
src/genre/synth/moods.ts      cosmos, motorway, neon, dread
src/genre/synth/vocals.ts     the vocoder profile
src/genre/synth/titles.ts     title generator
src/generate/filter.ts        brightness envelopes — parallel to dynamics.ts
docs/synth.md                 the ruleset, once it exists

TOUCHED — engine
src/style/types.ts            bars on four table types; filter; counterMode
src/core/types.ts             NoteEvent.brightness; Effects drive/crush/phaser;
                              DrumTrack.voiceEffects; VoiceSettings.formantTrack;
                              Section.chordLabels shape
src/genre/types.ts            Genre.filter, Genre.layerPlan
src/generate/parts.ts         multi-bar figures — three loops
src/generate/rhythm.ts        multi-bar melody cells
src/generate/song.ts          expandProgression; brightness; ostinato routing
src/generate/arrange.ts       read layerPlan.order
src/generate/dynamics.ts      merge layerPlan.response
src/style/instruments.ts      nine GM entries, four electric variants, ranges
src/render/strudel.ts         filterGrid; drive/crush/phaser; per-voice drum effects
src/render/midi.ts            CC74 as a stream
src/concert/cast.ts           explicit archetype mapping for the new programs
src/genre/index.ts            register
src/genre-check.ts            §13
src/genre/ambient/styles.ts   one docstring
```

---

## 13. Work breakdown

### Wave 0 — the time model *(sequential, single owner, blocks everything)*

§4 in full: `bars` on the four table types, `[symbol, beats]` progressions,
`expandProgression`, `chordLabels`. Then `npm run verify` — and specifically check
`hook.ts` (§4.4). Existing genres are not expected to change output here, but if they
do, the check is that they still pass audit and ensemble, not that the bytes match.

### Wave 1 — parallel, no dependencies beyond Wave 0

- **A. Filter.** `generate/filter.ts` plus both renderers. Largest single piece.
- **B. Instruments.** Nine GM entries, the `Effects` fields, the variant mechanism,
  `voiceEffects`, the `cast.ts` mapping.
- **C. Genre tables.** `styles.ts`, `eras.ts`, `moods.ts`, `titles.ts`. Biggest by
  line count, least risky, and now able to use multi-bar figures from day one.
- **D. Vocoder.** `formantTrack` and the `machine` voice profile.
- **E. Layer plan.** §7.1 — `arrange.ts` and `dynamics.ts` read the genre.

### Wave 2 — integration

`genre/synth/index.ts`; brightness and ostinato routing in `song.ts`; registration.
First end-to-end render.

### Wave 3 — the pass that decides whether it is good

Assertions (§13 below), then tuning: generate forty of each style and listen. The
tables in 1C are a first guess; tempo bands, progression weights and filter depth are
settled by ear, not by design. Then `docs/synth.md`.

### Wave 4 — the follow-ups this unlocks *(separate, not bundled)*

Jazz adopts sub-bar `ii–V`. Iskelmä's tango adopts two-bar figures. Ambient gets
`crush` and a `layerPlan`. Layers-as-roles (§7.2) gets its own plan.

---

## 14. Verification

Adding a genre is not free: `genre-check.ts` loops over `GENRE_IDS` for roughly ten
cross-genre invariants, and the new genre is subject to all of them from registration.
`npm run audit` and `npm run ensemble` likewise.

1. **The raised seventh never appears in a minor-key synth song.** The genre's central
   negative claim and the line between it and iskelmä. Parallel to ambient's "no chord
   has dominant function", and the same kind of claim: negative, load-bearing, and
   exactly what an innocent edit undoes quietly.
2. **Multi-bar figures actually repeat at their declared length.** A 4-bar bass
   pattern produces a period-4 pitch sequence, not period-1. Cheap, and it catches the
   most likely §4 implementation bug — a modulo in the wrong place, which degrades to
   *today's* behaviour and is therefore invisible.
3. **Existing genres keep their measured character.** Not byte-identical — leap rate,
   melody/comp clash rate, fill presence at boundaries and mean section dynamics stay
   within tolerance for `iskelma`, `jazz` and `ambient` across 40 seeds each.
4. **A ramp ramps.** In a `berlin` song, mean brightness over a section's last quarter
   exceeds its first, on every section of every seed.
5. **The ostinato counter survives.** Its figure repeats where the pattern says
   *and* its unison-with-melody rate stays under the existing cross-genre clash
   threshold. Both halves matter: the first proves the exemption works, the second
   proves it cost nothing.
6. **`modular` asks its banks for nothing they lack** — no voice outside
   `bd`/`sd`/`hh`/`oh`.
7. **`berlin` and `ambient/kosmische` are distinguishable.** Chords per eight bars is
   the honest discriminator: `kosmische` sits at 1–2, `berlin` at 4. If these converge,
   one of them should not exist.

---

## 15. Risks

**§4 is the risky one, and it is risky in the worst way.** A multi-bar figure bug
degrades to one-bar behaviour — which is *exactly what the code does today*, so it
produces no error, no crash and no obviously wrong output. Assertion 2 exists solely
for this and should be written before the implementation, not after.

**The hook engine may not recognise multi-bar material** (§4.4). Two of the five
styles run at `earworm`.

**Five styles is a lot of table to guess at.** Mitigated by ordering — Wave 1C needs
no new machinery and can be heard early.

**`berlin` collapses into `kosmische`.** Assertion 7 catches it mechanically; the
tuning pass catches it by ear.

**Strudel output size** (§5.3). Watch during Wave 2; the answer is coarser
quantisation, not abandoning the grid.

**`drive`, `crush` and `phaser` are audition-only.** A shipped `.mid` of an electric
violin is a violin. Consistent with `delay` and `highpass` today, but the gap widens
as more of the character moves into effects — worth naming as the reason a native
engine, not MIDI, is the real delivery target.

**`leadFifths` bakes harmony into the patch** (§8.3).

---

## 16. What "done" looks like

- `npm run gen --genre synth` produces all five styles across all three eras.
- `npm run verify` passes, including the seven assertions and every cross-genre
  invariant the new genre inherited.
- A `berlin` render has an audible filter opening across its sections; `machine` has a
  vocoder on it and a two-bar riff you can hum; `stalker` has a four-bar ostinato that
  is recognisably the composition; `cinematic` lifts its last chorus.
- `stalker` and `ambient/wasteland` are obviously different pieces of music, and so
  are `berlin` and `ambient/kosmische`.
- `docs/synth.md` exists and `docs/synth-plan.md` is deleted.
