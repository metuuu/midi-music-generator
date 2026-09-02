# Variety — where the material runs out

*Measured 2026-08-14. Describes what **is**, not what was intended, and nothing here has been built. Every number came from the probes described in §7; re-measure before acting on any of them. The bass half was prompted by a listening report — *"many different genres and in the same genre styles the bass melody really resembles each other way too much"* — and the melody half by the follow-up asking whether the same was true of the tune.*

## 1. The one claim

**The bass and the melody are both short of material, in opposite ways, and the two need opposite fixes.**

The bass has strong style identity and very little variety: a style's table *is* its
identity, and that table holds two or three rows. The melody has abundant variety and
almost no style identity: the `tune/` engine composes plenty of surface, on top of a
rhythm-cell pool that is largely shared across the whole catalogue.

Measured over 388 styles at eight songs each (§7):

| per song | bass | melody |
|---|---|---|
| distinct bar rhythms | 7.2 | 16.3 |
| distinct bar lines | 13.1 | 31.6 |
| share of the song on **one** rhythm | **0.62** | 0.32 |
| cross-style ÷ same-style overlap | 0.54 | **0.82** |

The last row is the identity measure. It compares how much melodic material two songs of
*the same style* share against two songs of *different styles in the same genre*. At 0.54
the bass says which style this is; at 0.82 the melody barely does.

## 2. The bass — too little material

### 2.1 The tables

1082 bass figures across 393 styles, **2.75 per style**.

| figures in the table | styles |
|---|---|
| 1 | 3 |
| 2 | **129** |
| 3 | **241** |
| 4 | 6 |
| 5 | 10 |
| 6 | 4 |

Twenty styles in the project have more than three figures to draw from.

- **217 distinct onset shapes** among the 1082 figures.
- **591 distinct full figures** (onsets + durations + tones) — so **45% of every bass figure in the project is byte-for-byte identical to one in another style**.
- **165 of 393 styles** hold two or fewer distinct rhythms in their entire table.

Four rhythms account for 42% of the catalogue:

| onsets | figures | genres |
|---|---|---|
| `0, 8` — root on 1 and 3 | 146 | 16 |
| `0` — one note a bar | 136 | 18 |
| `0, 4, 8, 12` — quarters | 96 | 16 |
| `0,2,4,…,14` — straight eighths | 78 | 11 |

The most-duplicated whole figures: a bar of held root (57 styles), root-then-fifth in half
notes (34), the same in quarters (22), metal's `follow` (20), metal's `pound` (18), rock's
`root-octave` and `root-eights` (17 each).

### 2.2 The pitch vocabulary is narrower than the rhythm

Over all 4428 declared bass notes:

| tone | share |
|---|---|
| root (`root`, `0`) | **60.7%** |
| fifth (`fifth`, `7`, `-5`) | **16.9%** |
| octave (`octave`, `12`, `-12`) | **7.3%** |
| third (`third`, `3`) | 3.9% |
| seventh (`seventh`, `10`) | 3.4% |
| `approach` | 2.6% |
| everything else | 2.8% |

**85% of every bass note in the project is a root, a fifth or an octave.** The sixth
appears three times in 4428 notes; the ninth thirteen.

This is the mechanism behind the original report. Root-fifth-octave is the same melodic
gesture whatever rhythm carries it, so a tango bass and a rock bass reduce to the same
idea at different tempos. And because 60% of the notes are the root, a bassline is largely
a readout of the chord progression: it varies when the harmony varies and almost never on
its own account.

### 2.3 Per genre

`distinct` counts whole figures the genre owns; `/style` divides by the styles it must
cover. `excl` is the share used by no other genre. `r/5/8` is the root-fifth-octave share
of the genre's declared notes. `thin` counts styles holding ≤2 distinct rhythms.

| genre | styles | figs | distinct | /style | excl | r/5/8 | thin | most-shared |
|---|---|---|---|---|---|---|---|---|
| indian | 28 | 56 | 14 | 0.50 | 50% | 100% | 28 | `sa` ×14 |
| metal | 24 | 68 | 14 | **0.58** | 93% | **100%** | 4 | `follow` ×20 |
| rock | 24 | 70 | 14 | **0.58** | 93% | 88% | 5 | `root-octave` ×17 |
| country | 24 | 57 | 15 | **0.63** | 53% | 89% | **19** | `boom-chuck` ×21 |
| finnfolk | 24 | 52 | 29 | 1.21 | 55% | 92% | 21 | `drone` ×5 |
| jazz | 10 | 23 | 14 | 1.40 | 71% | 76% | 6 | `walking` ×7 |
| classical | 26 | 78 | 37 | 1.42 | 51% | 83% | 7 | `two-in-a-bar` ×10 |
| latin | 26 | 64 | 42 | 1.62 | 90% | 100% | 14 | `tumbao` ×8 |
| ambient | 6 | 15 | 10 | 1.67 | 40% | 100% | 3 | `pedal` ×5 |
| pop | 25 | 74 | 46 | 1.84 | 65% | 86% | 6 | `held-root` ×9 |
| iskelma | 7 | 18 | 13 | 1.86 | 38% | 86% | 5 | `oom-pah` ×3 |
| arabic | 21 | 61 | 43 | 2.05 | 67% | 97% | 9 | `pedal` ×6 |
| house | 24 | 72 | 50 | 2.08 | 94% | 90% | 8 | `offbeat-root` ×12 |
| reggae | 21 | 57 | 44 | 2.10 | 89% | 74% | 7 | `after-the-one` ×12 |
| rnb | 24 | 52 | 51 | 2.13 | 88% | 73% | 20 | `shuffle-eighths` ×2 |
| dnb | 24 | 77 | 65 | 2.71 | 92% | 77% | 2 | `held-sub` ×6 |
| hiphop | 24 | 73 | 68 | 2.83 | 94% | 72% | 1 | `under-the-break` ×3 |
| funk | 22 | 66 | 63 | 2.86 | 94% | **69%** | 0 | `the-one` ×2 |
| **synth** | 9 | 49 | 43 | **4.78** | 86% | 91% | 0 | `pedal` ×4 |

**Synth is the best-provisioned genre in the project and is the model for the rest.** 43
distinct figures over 9 styles, 40 of them belonging to exactly one style, only three
shared at all.

**Three that look starved but are not.** `indian`'s bass is a tanpura — `sa` and `sa-pa`
are correct, and those styles already say `sustain: true`. `ambient` is the same by design.
`jazz` reads as thin because `walking` is not played from the table at all: `generateBass`
hands it to `generateWalkingBass`, which composes it. That is why jazz measures 48.9
distinct bass lines a song against 12.2 rhythms — **the highest melodic yield of any
genre's bass, and the existence proof for §6.1**.

**The genuinely starved three are `country`, `rock` and `metal`.** Metal's 24 styles share
14 figures, with nine belonging to a single style; rock's 24 share 14, with six; country
puts `boom-chuck` in 21 of 24 and holds ≤2 rhythms in 19 of them.

### 2.4 In the output

| per style | count of 388 |
|---|---|
| ≥0.8 of the song on one bass rhythm | 37 |
| ≥0.6 of the song on one bass rhythm | **228** |
| ≤3 distinct bass rhythms all song | 48 |
| ≤5 distinct bass rhythms all song | 132 |

### 2.5 The section complaint is mostly already fixed

The listening report also said the figure *"just repeats through all different sections"*.
The arranging machinery works: **verse-vs-chorus bass rhythm overlap is 0.24** across 385
styles, only 6 have a chorus ≥0.9 identical to the verse, and 18 ≥0.7. `FigureCast`,
`DEFAULT_VARY` and `planSignature` are doing their job.

What remains is structural rather than statistical. [`sectionFigure`](../src/generate/parts.ts)
has three buckets — chorus→`lift`, bridge/solo→`drop`, **everything else→`home`** — so
intro, every verse, pre-chorus, break and outro play one identical bar figure, repeated
verbatim for the length of each section. In most forms that is the majority of the track.

## 3. The melody — plenty of material, no identity

### 3.1 The cells

2816 `melodyCells` across 393 styles, 7.17 per style, but only **305 distinct cells in the
whole project**. `distinct` and `/style` below are within the genre; `excl` is the share
appearing in no other genre.

| genre | styles | cells | distinct | /style | excl |
|---|---|---|---|---|---|
| dnb | 24 | 111 | 16 | **0.67** | **0%** |
| reggae | 21 | 132 | 18 | 0.86 | **0%** |
| house | 24 | 111 | 22 | 0.92 | 14% |
| country | 24 | 179 | 25 | 1.04 | **0%** |
| pop | 25 | 184 | 29 | 1.16 | 3% |
| hiphop | 24 | 120 | 29 | 1.21 | 24% |
| rock | 24 | 148 | 30 | 1.25 | 10% |
| funk | 22 | 180 | 35 | 1.59 | 6% |
| latin | 26 | 176 | 42 | 1.62 | 7% |
| rnb | 24 | 175 | 45 | 1.88 | 4% |
| metal | 24 | 167 | 47 | 1.96 | 11% |
| **synth** | 9 | 87 | 23 | 2.56 | **0%** |
| indian | 28 | 276 | 79 | 2.82 | 43% |
| classical | 26 | 222 | 93 | 3.58 | 23% |
| ambient | 6 | 44 | 23 | 3.83 | 0% |
| finnfolk | 24 | 184 | 97 | 4.04 | 36% |
| iskelma | 7 | 59 | 35 | 5.00 | 0% |
| jazz | 10 | 82 | 52 | 5.20 | 21% |
| arabic | 21 | 179 | 115 | 5.48 | 39% |

**Synth's melody data is the mirror image of its bass.** `[8,8]`, `[4,4,8]` and `[16]`
appear in **all nine synth styles**, `[4,4,4,4]` in seven, `[-4,4,4,4]` in six; five cells
belong to exactly one style; and **not one of its 23 distinct cells is exclusive to synth**.
Its melodic knobs are the flattest in the project too — `leap` 0.21, `ornament` 0.07,
`syncopation` 0.25 — and it declares `Style.voice` in **1 of 9 styles**, the fewest
`voice`/`harmony` declarations of any genre. Against that, its harmony is the richest in
the catalogue: 35.1 progressions per style, next-highest is country at 22.3.

The same pattern is worse in `dnb`, `reggae`, `country` and `pop`, whose melodic rhythm
pools are 0–3% their own.

Across the catalogue, **61 of 393 styles declare `Style.voice`**; all 19 genres declare one
at genre level.

### 3.2 The identity measure

The decisive question is not whether melodies repeat but whether a style has one. `same`
is the mean overlap between two songs of one style; `cross` between two songs of different
styles in the same genre. **A ratio near 1.0 means the styles are interchangeable.**

| genre | same | cross | ratio |
|---|---|---|---|
| rock | 0.031 | 0.029 | **0.91** |
| reggae | 0.051 | 0.046 | **0.91** |
| **synth** | 0.067 | 0.060 | **0.90** |
| country | 0.037 | 0.034 | 0.90 |
| dnb | 0.060 | 0.053 | 0.89 |
| funk | 0.021 | 0.019 | 0.89 |
| pop | 0.030 | 0.026 | 0.87 |
| ambient | 0.107 | 0.093 | 0.87 |
| rnb | 0.036 | 0.031 | 0.86 |
| iskelma | 0.028 | 0.024 | 0.86 |
| house | 0.075 | 0.064 | 0.86 |
| metal | 0.028 | 0.023 | 0.83 |
| hiphop | 0.035 | 0.028 | 0.81 |
| latin | 0.021 | 0.017 | 0.81 |
| arabic | 0.031 | 0.023 | 0.76 |
| indian | 0.053 | 0.037 | 0.69 |
| jazz | 0.022 | 0.015 | 0.69 |
| finnfolk | 0.032 | 0.022 | 0.67 |
| classical | 0.046 | 0.031 | 0.67 |

Nothing reaches 0.5. The best-differentiated genres in the project still produce styles
whose melodies share two thirds as much material with a sibling style as with themselves.
The absolute overlaps are small, so individual ratios are noisy — but the ordering is
corroborated independently by the `excl` column in §3.1, and the catalogue mean held at
0.82–0.85 across three runs with different seeds and sample sizes.

**So a synth melody is probably not heard as repetitive — it is heard as generic.**
Different notes every time, no synth-ness, and no berlin-versus-outrun-ness. With nothing
recurring to identify the style by, that reads as sameness.

### 3.3 What this does not contradict

[voices-plan.md](voices-plan.md) §8 measured **genre**-level distinctness and moved it
0.2790 → 0.3158. This measures **style**-level distinctness *within* a genre, which that
work did not report, and finds it close to absent. The two are consistent: giving all 19
genres archetypes separated the genres without separating the styles inside them. Note
also that voices-plan lists `synth/dnb` at 0.099 as one of the five closest genre pairs.

## 4. Where the two problems differ

| | bass | melody |
|---|---|---|
| material | too little | plenty |
| style identity | strong (0.54) | near-absent (0.82) |
| what the tables give | the whole output | density and accent position only |
| fix direction | **more** — wider tables, wider note choice | **sharper** — style-specific cells and voices |
| risk of the naive fix | per-bar randomisation destroys the riff | more variety makes it *more* generic |

The bass tables are the output; the melody tables are one input among several to a
generative engine. Adding randomness to the melody would move it in the wrong direction —
the lever there is characterful constraint, not variety.

## 5. What the engine already says about this

[`parts.ts`](../src/generate/parts.ts) has had three rounds at the bass — `FigureCast`,
`DEFAULT_VARY`, `planSignature` — and states the conclusion itself:

> nothing in the engine has ever composed a bass figure — it draws one, verbatim, out of a
> table of two.

All three arrange *around* a drawn row and none can add material the table does not hold.
A fourth arranging mechanism meets the same ceiling.

## 6. What follows, in order of value against risk

Three of the four pieces of §6.1 landed on 2026-09-02, in `generateBass` rather than in the
tables, so every uncycled figure gets them without being rewritten:

- **The fifth bounces below a high root.** A `fifth` whose neighbours in the figure are both
  the root now sits a fourth under any root at or above E2, the way a hand on a bass does.
  A fifth inside a line, or struck together with the root, stays above.
- **Roots are voice-led.** `placeRoot` takes the previous bar's root, so a B♭ to B is a
  semitone rather than an eleventh, with the pull toward E2 weighted double so a progression
  cannot walk the line out of the register.
- **Walk-ups and turnarounds.** `Style.walkup` over `Genre.walkup`, the chance per bar that
  the last beats before a root change give way to scale steps arriving on the next root,
  and that a phrase end on an unchanged chord climbs to the root from below. Ten genres
  declare it; a chromatic chord, a cycled figure and a drone all decline.

`reach` no longer replaces a figure's own fifth with the octave, which was turning every
other two-beat into a disco bounce and dropping the whole line an octave to fit it. Rock's
`root-octave` is now root, root, octave, fifth. Measured over 8 songs a genre, the share
of bars whose contour repeats the bar before went from 62% to 52% overall, and in the
genres this was reported against from 70% to 30% (iskelmä), 70% to 45% (country), 77% to
56% (rock) and 70% to 28% (classical). The see-saw share, an interval undone at once by its
inverse, fell in rock from 29% to 14% and moved little elsewhere, because a root-fifth
two-beat still bounces by definition.

Three smaller pieces followed the same day. Metal's `follow` is six roots and then the
fifth and the flat seventh as one lift, which took metal's see-saw share from 18% to 8%.
The walking bass places its approach target with the same pull toward E2, so the share of
walking notes at or above C3 fell from 23% to 6% with the stepwise share unchanged at 70%.
And §6.3 is built: a repeat of a section kind draws one more `planSignature` edit from a
stream keyed to the kind and the instance, at 0.6 of the song's signature chance, so
repeated sections playing the bass note for note went from 21% to 17%. The 17% left is
mostly drones and loops, which should repeat.

§6.2 landed the same day, by composition: five figures for country (`one-three-five-six`,
`tic-tac`, `gospel-walk`, `boom-chuck-pickup`, `waltz-one-three-five`), four for rock
(`eighths-pickup`, `climb`, `fourths`, `crawl`) and five for metal (`semitone-riff`,
`tritone-stomp`, `drop-run`, `sixth-fall`, `slow-riff`), added as an extra row to 64 styles.
The §2.3 numbers for the three:

| genre | distinct | /style | r/5/8 | thin |
|---|---|---|---|---|
| country | 13 → 18 | 0.54 → 0.75 | 89% → 82% | 19 → 8 |
| rock | 14 → 18 | 0.58 → 0.75 | 88% → 84% | 5 → 5 |
| metal | 14 → 19 | 0.58 → 0.79 | 97% → 91% | 4 → 4 |

In the output, country's distinct pitches a bar went from 2.3 to 2.8 and its see-saw share
from 20% to 10%; rock's from 2.1 to 2.8 and 14% to 11%.

And the bass can double the guitar. `BassPattern.doubles` hands the comp figure's rhythm
to `generateBass` on the root wherever the comp is sounding, is not an arpeggio and has
two or more onsets, with the comp's phrase-end gesture so the two stay locked; the row's
own hits play under a held chord. Metal's `follow` doubles, which is what its header
always said it was, and rock has a `double-guitar` row in nine riff styles. The riff's
pitch motion is still the chord progression, because the comp has no other: what this
locks is the rhythm. The numbers-spelled half of §6.1 is still open: a figure written as
`7` is a shape and is left alone.

### 6.1 Chord-aware note choice on the bass

The figure declares an anchor on the downbeat and *function* on the rest — passing,
neighbour, approach-to-the-next-root — resolved against the current and next chord with a
per-style bias. This touches the ~40% of notes that are not the root, leaves every
genre-defining rhythm untouched, and is the smallest change that makes a bassline a line
rather than a chord readout. `approach` already does exactly this for 2.6% of notes, and
`generateWalkingBass` already proves the shape at §2.3's yield.

### 6.2 Widen the bass tables for country, rock and metal

Roughly 72 styles, by composition, one at a time. Target by measurement rather than
alphabetically, and **skip the §2.3 false positives** — the indian and ambient drones are
correct as they stand.

### 6.3 Per-instance bass variation

Verse 1 and verse 3 being note-identical is what §2.5 leaves on the table. A second
`planSignature` edit keyed to the section's instance index reuses machinery that exists.

### 6.4 Melodic identity, which is mostly authoring

Style-specific `melodyCells` instead of the shared pool, and `Style.voice` on more than 61
of 393 styles. This is the [voices-plan](voices-plan.md) job carried down one tier, from
genre to style. It is slower and more delicate than the bass work and should not be
attempted by widening anything.

## 7. The probes

Throwaway scripts, not added to the repo. Enough detail to rebuild them:

**Table walks.** Import `GENRES`, iterate `genre.styles[*].bass` and `.melodyCells`. A
figure's *rhythm* is `cycle` plus its onset list; its *full* identity adds each hit's
duration, tone and glide. Tone shares count `'root'`/`0` together, `'fifth'`/`7`/`-5`,
`'octave'`/`12`/`-12`.

**Output probe.** `generateSong` at `seconds: 120`, 8 songs per style over all 393 styles,
seeds `final-<genre>-<style>-<i>`. Group each track's notes into bars by
`meta.beatsPerBar`; a bar's *rhythm* is its onset list in sixteenths, its *line* is that
plus each note's interval from the bar's first note — which makes it chord-independent, so
a figure transposed by the harmony counts as the same line. Overlap is Jaccard over a
song's set of lines. `same` averages pairs within a style, `cross` pairs across styles of
one genre.

**Two corrections that mattered, both flagged in [voices-plan.md](voices-plan.md) §8 before
this work repeated them.**

- The melody must be read through **`melodicLine`**, not `Track.notes`. 5.3% of melody
  tracks are `twoHanded` overall but **synth 22%, jazz 30%, iskelma 36%, classical 19%** —
  the genres this document makes claims about. Reading raw notes counts a pianist's left
  hand as melody. Uncorrected, jazz's identity ratio read 0.51 and looked like the best in
  the project; corrected it is 0.69 and mid-pack.
- **Durations are dynamics-scaled**, so including them in a bar's identity inflates the
  distinct count. Every figure above keys on onsets and intervals only.

Duration-free rhythm keys also mean a **dead stroke counts as an onset in the ear but is
dropped here** — 1.2% of bass notes overall, 9.1% in funk. The §2 rhythm counts are
therefore slight underestimates for funk, rnb and hiphop.
