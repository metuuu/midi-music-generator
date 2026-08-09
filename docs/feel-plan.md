# Feel — plan

*Plan, written 2026-07-31 and untouched since. It describes what was **intended**, not what is. **Built** — the result is `src/style/feel.ts`, which is the thing to read for current behaviour. Both halves of what it proposed exist: a style may disagree with its genre about where melody notes come from, and `FeelSpan` says how a passage is felt. Read this for the reasoning and the rejected alternatives, not as a reference.*

How the band plays what it is already playing, and why the blues currently doesn't
sound like one.

This document settles the contracts for two connected changes: letting a *style*
disagree with its genre about where melody notes come from, and adding a genre-neutral
modifier that says how a passage is felt rather than what is in it.

Like `backline-plan.md`, this says what is intended. When it is built it becomes
`docs/feel.md` and describes what exists.

---

## 1. The one claim

**The tables describe what the band plays and have no vocabulary for how it is
played.**

Every musical decision in this project is currently made at one of two altitudes.
`Genre` owns what is culturally specific; `Style` owns one dance or one idiom, in a
table of about forty fields. Both are drawn **once per song**, and the rhythm section's
figures are fixed with them:

```ts
// src/generate/song.ts:355
const bassPattern = rng.weightedBy(style.bass, (p) => p.weight);
const compPattern = rng.weightedBy(style.comp, (p) => p.weight);
const drumPattern = rng.weightedBy(style.drums, (p) => p.weight);
```

That comment above it — *"a band does not change its comping pattern every eight
bars"* — is correct and is not the same sentence as *"a band plays every eight bars the
same way"*.

Plenty already varies per section, and §3b sets out how much: the tune's density,
register, repetition and archetype weights; the section's level; its texture; the left
hand; the filter. The gap is specific rather than general. **Nothing that varies is
rhythmic.** Timing, accent, note length and subdivision are fixed for the whole song, in
every genre — and that is the entire list of things a groove is made of.

So "this chorus is funkier" and "bar 12 is a break" are not weakly supported. They are
*inexpressible*, in the same way a three-beat ostinato was inexpressible before `cycle`
existed, and for the same reason: the loop that reads the tables decides the shape, and
the tables have no field that reaches it.

The second half of the claim is smaller and sharper: **`scaleForChord` is on the wrong
object.** It is a `Genre` method, and one style in the catalogue needs to disagree with
its genre about it. That style is the blues, and the disagreement is the whole reason
it doesn't sound like one.

---

## 2. What is wrong with the blues, measured

`jazz.scaleForChord` implements chord-scale theory, correctly: every `dom7` gets
mixolydian rooted on the *chord* ([`jazz/index.ts:209`](../src/genre/jazz/index.ts)).
A blues in F therefore plays F mixolydian over I7, B♭ mixolydian over IV7, C mixolydian
over V7, re-orienting every bar.

The blues does the opposite. It holds **one tonic scale across all three chords**, and
the grind between a fixed ♭3 and the I7's own major third is the sound. Measured across
25 major-key blues songs, split by the chord sounding underneath:

```
I7    1330 notes   ♭3 =  1.5%   nat3 = 15.9%
IV7    543 notes   ♭3 = 16.9%   nat3 =  2.2%
```

Exactly inverted. Over I7 — where the blue third belongs — it is effectively absent.
Where it does appear is over IV7, and there it is not a blue note at all: it is the ♭7
of that chord, a plain consonant chord tone with no friction in it. The style's own
description promises *"blue notes over the top"* and the mapping guarantees they cannot
happen.

Two supporting facts:

- **`SCALE_STEPS.blues` and `bebopDominant` are dead entries.**
  ([`core/scale.ts:41`](../src/core/scale.ts)) Both are defined and neither is ever
  constructed, because only a `Genre` can name a scale and no genre names these.
- **The rules are not the obstacle.** `semitone-clash` and
  `non-chord-tone-on-strong-beat` are both `minLevel: 3`; jazz runs at `light`
  (level 1). The ♭3 against a comped major third would survive if it were ever
  generated. The 1.5% that does appear over I7 is the solo engine's `chromatic: 0.5`
  reaching for a neighbour, not the chord scale offering it.

This is the mirror image of a bug this repo has already documented. `synth/index.ts`
records that *"`scaleForChord` never producing the note turned out to be a claim about
the chord scale and not about the music"* — there, a leading tone leaked in past a
scale that excluded it. Here, a blue note is locked out by a scale that excludes it,
and nothing leaks.

### 2.1 What the blues needs beyond the scale

Two smaller gaps, both real, neither of them the cause:

- **No call and response.** A twelve-bar head is a-a′-b: a phrase in bars 1–2, restated
  in 5–6, answered in 9–10, with 3–4, 7–8 and 11–12 left open. 46.7% of blues bars
  already have no melody in them, so the space exists — it is simply not *placed*.
- **No bend, slide or ghost.** `NoteEvent` has no representation for any of them. Out
  of scope here; noted so it is not mistaken for an omission.

---

## 3. Decisions settled

1. **`scaleForChord` becomes overridable per style.** The `Genre` field stays and stays
   the default. `Style.scaleForChord` is optional and wins where present.
2. **Feel is genre-neutral and lives in `src/style/feel.ts`.** Not a per-genre table.
   A feel that only one genre could reach would be a style field, which is what we
   already have and what does not work.
3. **A Feel modifies events; it never authors them.** No pattern banks, no note
   choices, no harmony. If a proposal needs a new figure, it is a style, not a feel.
4. **A Feel is assigned to a span of bars, not to a section.** The user-facing
   requirement is "some sections, and in some cases single bars", and a section-shaped
   field cannot express the second one.
5. **Every new draw comes from its own namespaced stream.** A style with no feel table
   consumes no random numbers and produces bit-identical output to today.
6. **A preset rhythm box is exempt.** The existing `canVary(drumSource)` gate applies
   unchanged — a Mini Pops does not lay back behind the beat.
7. **Mood stays per-song, and is not made per-section.** See §3b — it is the wrong
   fix, and it would fight a per-section contrast system that already exists.
8. **No wider genre/mood refactor.** See §7.1.

---

## 3b. What already varies, and what mood actually does

Written after the first draft of this plan overstated how static the generator is. The
claim in §1 is about *rhythm* and survives; the claim "everything is per-song" does not,
and building on it would have produced a Feel that duplicates working machinery.

### 3b.1 Per-section contrast already exists, and it is substantial

[`tune/voice.ts:317`](../src/tune/voice.ts) holds a `SHAPES` table keyed by section
kind, and it is not a stub:

```ts
chorus: { density: 1.05, register: 2, repetition: 0.85,
          favour: { 'arch-hook': 1.8, chant: 1.5, 'riff-response': 1.5, 'long-note': 0.7 } },
bridge: { density: 0.95, register: 0,  repetition: 0.3,
          favour: { 'wide-interval': 2, 'descending-sequence': 1.6, chant: 0.4 } },
```

So a chorus already sits higher, repeats more and reaches for different archetypes than
the bridge that precedes it. Alongside it, per section: `sectionIntensity` (level,
placement, build), `layersFor` (texture), `chooseLeftHandMode`, the filter's `kind`
table, progression and mode and transposition, `patchBand` on a late chorus, the
one-bar tutti, and the fills.

**What is genuinely constant across a whole song is a short list**: style, tempo, era,
instruments, the three rhythm-section figures, `swing`, and mood's four character
scalars. Every item on that list except the last two is *supposed* to be constant. The
last two are the subject of this plan.

### 3b.2 Mood is two jobs bundled into one object

Mood is drawn once at [`song.ts:175`](../src/generate/song.ts) and reaches exactly seven
places. Split by what they do:

| job | what it touches | could it vary per section? |
| --- | --- | --- |
| **Casting** | `styleBias` → which style; `modeBias` → major/minor; `tempo` → BPM | **No.** The style *is* the pattern tables; tempo is one number in the IR. Changing either mid-song is a different feature, not a scope fix. |
| **Character** | `density` → `layersFor`; `restraint` → thinning; `leap`, `ornament` → the tune's `Voice` | In principle yes — but see below. |

So the answer to *"does mood determine too much of the piece"* is: less than it looks.
Four of its seven levers are casting decisions that happen before a note exists, and the
other three are **multipliers over a per-section system that does the actual varying**.
Mood does not set the chorus's density; `SHAPES` and `sectionIntensity` do, and mood
scales the result.

### 3b.3 Why per-section mood is the wrong fix

Three reasons, in increasing order of how much they matter:

1. **Half of it cannot vary.** A per-section mood would redraw `styleBias`, `modeBias`
   and `tempo` for a section that cannot act on any of them. Those three fields would
   become dead weight that still had to be authored in every mood in four genres.
2. **The other half would duplicate `SHAPES`.** "The bridge is more restrained" is
   already expressible, in the table designed to say it, and saying it twice in two
   tables that can disagree is how a chorus ends up quieter than its verse.
3. **It is the wrong claim about music.** A song does not change from `smoky` to `hot`
   at bar 33. What changes is how hard the band plays and how the passage is felt —
   which is intensity, which exists, and feel, which does not.

The real gap mood exposes is narrower and worth naming: **`leap` and `ornament` reach
the tune as constants**, so a mood cannot say "and the bridge leaps more" the way
`SHAPES` can. That is a one-line fix if it ever matters — let `SectionShape` carry
`leap`/`ornament` multipliers alongside `density` and `register` — and it is
deliberately **not** in this plan's waves. It is small, it is orthogonal, and bundling
it here would make Feel look like it needs a mood refactor to work. It does not.

---

## 4. Change A — the chord scale belongs to the style too

Small, contained, independently shippable, and audible immediately.

### 4.1 The field

```ts
// src/style/types.ts, on Style
/**
 * Where this style's melody gets its notes, overriding the genre's answer.
 *
 * Absent on every style but one, and that is the point: the genre's mapping is
 * the idiom's mapping, and a style that overrides it is making a claim about
 * itself rather than about its genre.
 *
 * The blues is why this exists. Jazz follows the *chord* — each quality implies
 * its own scale and the line re-orients bar by bar — and that is correct for
 * every jazz style in the catalogue except the one whose entire sound is a
 * fixed tonic scale dragged across moving changes. A blues line that
 * re-orients onto each dominant is a bebop line over blues changes, which is a
 * real and different music.
 */
scaleForChord?(tonic: Pc, mode: Mode, chord: Chord): Scale;
```

### 4.2 The wiring

One resolution near the top of `generateSong`, then all seven call sites change from
`genre.scaleForChord` to the resolved local:

```ts
const scaleForChord = style.scaleForChord ?? genre.scaleForChord;
```

Sites: [`song.ts`](../src/generate/song.ts) lines 742, 836, 904, 1024, 1030, 1078,
1144. Both consumers already take it as an injected function
([`tune/types.ts:421`](../src/tune/types.ts),
[`solo.ts:621`](../src/generate/solo.ts)), so nothing downstream changes and nothing
learns a new concept.

### 4.3 The blues mapping

```ts
// Fixed on the *key*, not the chord. The tonic blues scale over everything,
// except that a ii–V turnaround is a real ii–V and gets treated as one — the
// jazz blues progressions in this table have one in bars nine and ten and a
// line that ignored it would be playing over the changes rather than through
// them.
scaleForChord: (tonic, mode, chord) => (
  chord.quality === 'min7' || chord.quality === 'halfdim7' || isAlteredDominant(chord.quality)
    ? jazz.scaleForChord(tonic, mode, chord)
    : makeScale(tonic, 'blues')
),
```

That is one style's disagreement, stated in one place, and it retires a dead scale.

The six-note blues scale is deliberately *not* enough on its own for a whole head — it
has no 2nd, no 6th and no major 3rd, so a tune built purely from it is pentatonic and
static. Wave 2 below adds the mixture: draw from the blues scale with probability
`blueness` and from mixolydian otherwise, so the ♭3 and ♮3 coexist the way they do on a
record. Ship the pure version first and measure it; the number to beat is in §9.

---

## 5. Change B — Feel

### 5.1 What a Feel is

A named bag of scalars, applied to already-generated events over a span of bars. Same
shape and same size as two things that already exist and work: `Mood` (seven fields of
multipliers over a style) and `SoloVocabulary` (twelve knobs over the solo engine).
Neither of those authors anything either.

### 5.1a It applies in two different ways, and this is the load-bearing part

The first draft of this plan post-processed everything, and that is wrong for half the
band. This project has already learned the lesson and written it down, in
[`tune/adapt.ts:197`](../src/tune/adapt.ts), about mood:

> *Applied to the voice rather than to the notes, which is the only place they can do
> their job: a calmer mood should make the engine* want *to move by step, not write a
> leaping tune and then flatten it.*

That is exactly right and it applies here with more force, because the melody is not
merely generated — it is *auditioned*. `composeSectionTune` writes N candidates, scores
them against the rules and a freshness term, and keeps the best. Shoving those notes
around afterwards discards the judging: the gesture that won gets bent into one nobody
scored, and `tune/judge.ts` never sees the result.

So Feel splits by how the part was made:

| part | how it was made | how Feel reaches it |
| --- | --- | --- |
| **melody, counter** | composed and auditioned by the tune engine | **multipliers into `Voice`**, before the audition |
| **bass, comp, pad, drums** | a fixed pattern walked over the bars | **post-process on the events**, after generation |

The rhythm section post-process is legitimate precisely *because* those parts are
pattern playback: there is no candidate set and no judge to invalidate, and the existing
per-section pass already edits them in place. The seam is there and its comment is the
argument for using it:

```ts
// src/generate/song.ts:1270 — the existing per-section post-pass
const sectionBeats = section.lengthBars * style.beatsPerBar;
applyDynamics(sectionBass, 'bass', intensity, genre.layerPlan?.response);
...
swell(sectionPad, ctxBase.startBeat, sectionBeats, 0.35);
```

> *"Doing it here rather than inside each part generator is what keeps the parts
> ignorant of the form: a comp pattern should not have to know whether it is in a
> bridge."*

`applyFeel` goes beside it, and touches no layer the tune engine wrote.

### 5.1b Two Feel fields already exist, on `Voice`

Also found after the first draft, and it changes the field list. `Voice`
([`tune/types.ts:323`](../src/tune/types.ts)) already carries:

- `syncopation` — *"Appetite for landing off the beat, 0..1."*
- `accents?: readonly number[]` — *"Per-sixteenth attractiveness, tiled across the
  canvas. A 16-long array is a one-bar statement tiled twice; a 32-long array is a
  two-bar statement, which is what a clave or a tango accent actually is."*

The second one is the `accent` array this plan proposed to invent. It exists, it is
already the right shape, and the melody already reads it. Feel therefore **multiplies
these** rather than declaring its own, and the melodic half of a feel costs two
multipliers and no new concept.

### 5.2 The fields

```ts
export interface Feel {
  id: string;
  label: string;
  /** One line, for the README and the audition page. */
  description: string;

  /**
   * Milliseconds each layer sits ahead of (−) or behind (+) the grid.
   *
   * In milliseconds and not in beats, for the same reason `concert/groove.ts`
   * expresses its per-performer offsets in seconds: how far ahead a bass player
   * leans is a fact about the player, not about the tempo. A pocket that scaled
   * with BPM would vanish at 180 and become a mistake at 60.
   *
   * This is the single field nothing in the project can currently express.
   * `applySwing` shifts offbeats only, uniformly, for the whole song.
   */
  push?: Partial<Record<LayerId | 'drums', number>>;

  /**
   * Multiplier on note duration, per layer. Below 1 is staccato.
   *
   * The largest audible difference between a funk comp and a swing comp is not
   * where the stabs are, it is how long they last. A three-sixteenth stab and a
   * one-sixteenth stab are the same pattern and two different musics.
   */
  articulation?: Partial<Record<LayerId, number>>;

  /**
   * Velocity multiplier per sixteenth of the bar, cycled. `[1.3, .7, .8, .7, …]`
   * is weight on the one; the swing feel's is weight on the eighth-note upbeats.
   *
   * Multiplied *over* `metricStrength`, never replacing it — the metre is still
   * the metre, and a feel that overrode it would be a time signature.
   *
   * Rhythm section only. The melody's equivalent is `Voice.accents`, which
   * already exists and is already tiled; `voice` below scales it.
   */
  accent?: number[];

  /** Chance an eligible rest gains a ghosted snare or bass note, 0..1. */
  ghost?: number;

  /** Chance a sustained hit is broken into two shorter ones. Funk subdivides. */
  subdivide?: number;

  /** Chance a weak-beat hit is displaced by a sixteenth. */
  displace?: number;

  /**
   * Overrides `Style.swing` for the span. A half-time shuffle inside a straight
   * tune, or a straight bridge in a swung one.
   *
   * The one field that crosses the divide: swing is applied to every layer at
   * assembly, melody included, and it is a grid property rather than a gesture,
   * so bending it does not invalidate a judged tune.
   */
  swing?: number;

  /**
   * What the *composed* layers get instead: multipliers folded into `Voice`
   * before the audition runs, exactly as `mood` already is.
   *
   * Deliberately three numbers and not a second field list. Everything a feel
   * wants to say to a melody is already sayable in the voice's own vocabulary —
   * how much it lands off the beat, where it likes to land, and how busy it is —
   * and a feel that needed a fourth is a feel that is trying to compose.
   */
  voice?: {
    /** Multiplier on `Voice.syncopation`. */
    syncopation?: number;
    /** Multiplier on `Voice.accents`, per sixteenth. Absent leaves them alone. */
    accents?: number[];
    /** Multiplier on `Voice.density`. */
    density?: number;
  };
}
```

Seven event knobs, three voice knobs, one shared. Anything an eleventh proposal needs,
check against §7 first.

The starting library — genre-neutral, named for what they are rather than for a genre:

| id | what it says |
| --- | --- |
| `straight` | the identity feel; every field absent. What the project does today. |
| `pocket` | bass 12 ms ahead, snare 18 ms behind, hats level. The thing that makes a rhythm section sound like people. |
| `funk` | pocket, plus articulation 0.45 on comp and bass, accent on the one, `ghost` 0.35, `subdivide` 0.4. |
| `halftime` | swing 0, backbeat displaced to beat 3, articulation long. |
| `driving` | everything a hair ahead, articulation 0.8, no ghosts. The last chorus. |
| `laidback` | everything behind, articulation 1.15, accent flattened. |

`funk` and `pocket` are separable on purpose: pocket is what any competent rhythm
section does and belongs under an iskelmä foksi as readily as under a jazz blues. Funk
is pocket plus a specific articulation and accent, and it is the one that reads as a
genre if you overuse it.

### 5.3 Spans, not sections

```ts
export interface FeelSpan {
  /** Absolute bar indices, half-open. */
  from: number;
  to: number;
  feel: Feel;
  /** How far toward the feel this span goes, 0..1. Scales every field. */
  amount: number;
}
```

Carried on the `Song` as `meta.feels: FeelSpan[]`, so it is IR rather than a private
detail of the generator — the concert renderer and `score.ts` can both say what is
happening, and a span is inspectable the way `chordLabels` is.

One-bar spans are the interesting case and are not a special case: they are a span of
length 1. The precedent is already in the file — [`song.ts:1210`](../src/generate/song.ts)
puts the whole band on one figure for a single bar and calls it *"one of the loudest
signals there is that a piece was arranged rather than assembled"*. A one-bar break is
the rhythmic version of the same gesture.

### 5.4 Who chooses one

The established merge order, unchanged: **genre default ← style ← mood bias**, drawn
per section.

```ts
// Genre — the fallback for its styles.
feels?: (readonly [FeelId, number])[];

// Style — overrides it. Blues names `pocket` and `straight`; humppa names
// `straight` alone and means it.
feels?: (readonly [FeelId, number])[];

// Mood — multipliers on that draw, exactly as styleBias already works.
feelBias?: Record<FeelId, number>;
```

Plus two structural rules in the planner, which is where the taste lives:

- **Sections change feel at their boundary, not inside.** One draw per section from
  `new Rng(`${seed}:feel:${s}`)`.
- **A one-bar break is drawn separately**, at low probability, only in the last two
  bars of a section that has already been stated once, and only where the style's feel
  table has more than one entry. Same reasoning as the tutti figure it sits beside: the
  gesture is a comment on something the listener already knows.

A style that omits `feels` gets `straight` for every bar, draws nothing, and is
byte-for-byte what it is today.

### 5.5 The name, and the rename it needs

`feel` is already taken: `SoloAssignment.feel` ([`solo.ts:188`](../src/generate/solo.ts))
holds a `BackingPolicy`. That is the wrong name for it already — `solo.feel ===
'comping'` reads as a category error, and what the field actually says is *what the
band does behind this soloist*. Rename it to `backing` first, in the same commit that
introduces `Feel`. Eight sites: `solo.ts` 188, 268–269, 299 and `song.ts` 556, 557,
671, 768.

### 5.6 What composes with what, in order

Three systems now modify the same events, and an unstated order is how a funk chorus
ends up quieter than its verse. The order, and the reason each step is where it is:

1. **`SHAPES` and the progression** decide what the section *is*. Before any note
   exists.
2. **`Voice` multipliers** — style, then mood, then feel — decide what kind of tune gets
   composed. Before the audition, so the judge scores the tune the feel actually asked
   for.
3. **Part generation** writes the notes.
4. **`applyFeel`** on the rhythm section: timing, articulation, accent, ghosts. Before
   dynamics, because it multiplies velocities and wants the section's own level applied
   on top rather than baked in.
5. **`applyDynamics` and `swell`** scale the section to its intensity. Last, so
   intensity is always the outermost term and a feel can never out-shout the form.

Two rules fall out of that order and both matter:

- **A feel changes the shape of a section's loudness, never its rank.** If the chorus is
  louder than the verse before feels, it is louder after. `applyFeel` normalises its
  `accent` array to mean 1.0 for exactly this reason — it redistributes weight within a
  bar, it does not add any.
- **`swing` is resolved once per span and applied at assembly**, where `applySwing`
  already runs, rather than inside `applyFeel`. Two passes shifting the same offbeat is
  a double swing, which sounds like a mistake rather than like more swing.

---

## 6. Determinism

This is the constraint most likely to be violated by accident, and the file already
records what it costs. The `drumSource` comment at
[`song.ts:390`](../src/generate/song.ts) documents a change that moved *every song in
every genre* and dropped a `npm run genres` check from 66% to 59% — not because the new
field did anything, but because it took one number out of the shared stream in front of
everything else.

So:

- Every feel draw uses its own namespace: `${seed}:feel:${s}`, `${seed}:feel:${s}:break`.
- A style with no `feels` table performs **no draw at all** — not a draw it discards.
- `Style.scaleForChord` consumes nothing; it is a function swap.

The acceptance test for wave 1 is therefore not musical: it is that the full catalogue
hashes identically before and after, for every genre and style that has not opted in.
Worth knowing before it fires: two of the existing `npm run genres` checks flip on any
RNG reshuffle rather than on a real regression, so a diff in those two is a signal to
go and check the hash, not to go and change the tables.

---

## 7. What this deliberately does not do

- **No new patterns.** A feel that needed its own bass figure would be a style. This is
  the line that keeps the feel library from turning into a second style table.
- **No per-note humanisation.** `generateDrums` already jitters, and doing it twice
  produces mush rather than groove.
- **No genre-owned feel library.** The whole proposition is that `pocket` under a
  foksi and `pocket` under a blues are the same object.
- **No bends, slides or pitch gestures.** `NoteEvent` cannot carry them. Real gap for
  the blues, separate piece of work, larger than it looks because it reaches the MIDI
  render, Strudel and the concert.
- **Nothing in the concert renderer.** `concert/groove.ts` derives the body's pulse
  from where the kick and snare actually land, so a feel that moves them is followed
  automatically. That is the design working, and it should be checked rather than
  built.
- **No layer-dropping.** `layersFor` already thins arrangements per section from mood
  and density. A feel that also removed layers would be arguing with it.
- **No per-section leap/ornament.** The real gap §3b.3 names, deliberately left out.
  It belongs to `SectionShape`, not to Feel.
- **Nothing at the section seam.** A feel says how a passage is *felt*; what happens at
  the boundary between two of them — the fill, the tutti shot, the break, the
  anticipated downbeat — is a separate gesture with a separate figure source and its own
  hook-invariance problem. See [`transition-plan.md`](transition-plan.md), which depends
  on this plan's `FeelSpan` machinery (§5.3) and should land after wave 3.

### 7.0 One chord per bar, which is a real limit and not this plan's

Found while checking whether Feel had anywhere to hide. It does not, but this does:

```ts
// src/generate/song.ts:2445
function expandProgression(prog: Progression, bars: number, mode: Mode): Chord[] {
  for (let i = 0; i < bars; i++) out.push(parseRoman(prog.chords[i % prog.chords.length]!, mode));
}
```

**Harmonic rhythm is hardcoded at exactly one chord per bar, everywhere, in every
genre.** A `Progression` is a list of bars and there is no syntax for anything else. So
a ii–V inside one bar — ordinary in bebop, and in the turnaround of half the standards
this genre claims — is inexpressible, as is a chord landing on beat 3, as is a two-beat
approach into a cadence. `Chord[]` indexed by bar is assumed by the tune engine, the
comp, the bass, the voicing planner and the roman-numeral display.

This does **not** block anything here. A funk vamp holds one chord, the blues changes on
barlines, and every progression in the catalogue was authored under the constraint and
therefore reads correctly. But it is a bigger limit on "sounds like real music" than
groove is, it is invisible until you look for it, and it should be a plan of its own
rather than a surprise discovered in wave 4. Named here so it is a decision rather than
an oversight.

### 7.1 The genre and mood refactor that is not worth doing

Worth stating, because the question that produced this plan was whether the whole
genre/style/mood split is too hardcoded. Mostly it is not, and here is the audit:

- **`Style` is already genre-neutral.** Nothing in the interface points at a genre.
  Exactly three things pin a style to one: `scaleForChord` living on the genre, moods
  keying `styleBias` by style id ([`jazz/moods.ts:17`](../src/genre/jazz/moods.ts)),
  and era `styleWeights`. The first is a genuine defect and §4 fixes it. The other two
  are lookup tables that would need re-keying and buy nothing — no style in the
  catalogue wants to move genre.
- **`Genre` over-claims, but only in one place that matters.** It also owns `solo`,
  `fills` and `ruleOverrides`, all of which a style can already override or shadow.
  Blues is the one case where the override was missing.
- **`Mood` is the right idea at the wrong scope**, and fixing the scope is where Feel
  comes from. Splitting the universal half of `Mood` (tempo, density, ornament, leap,
  restraint — identical shapes across all four genres) from the genre-local half
  (`styleBias`) is a real deduplication and a small one. Not worth doing on its own;
  reconsider if a fifth genre lands.

The tell that the pressure is real is `Style` itself: forty-odd optional fields and
five hundred lines of interface, because for a long time there was nowhere else to put
a new musical idea. Feel is the second place. It should stay small enough that it does
not become the same problem.

---

## 8. Verification — extending `npm run genres`

The `Feel` section already exists — it currently holds the two swing checks. These
extend it, except where noted:

1. **Determinism.** Every genre × style with no `feels` table hashes identically to the
   pre-change catalogue. Run once against a stored baseline; this is the check that
   matters most and the one that will actually fire.
2. **The pocket exists.** Under `pocket`, mean bass onset offset is negative and mean
   snare offset positive, both between 5 and 30 ms. Zero today by construction.
3. **Funk is short.** Mean comp note duration under `funk` is below 60% of the same
   style's duration under `straight`.
4. **A box does not groove.** A song whose `drumSource` is `box` has zero drum offset
   under every feel.
5. **Breaks are rare and placed.** One-bar spans occur in under 15% of songs, never in
   an intro, never in the first statement of a section.
6. **Intensity still outranks feel.** For every song with more than one feel, mean
   chorus velocity exceeds mean verse velocity. This is the check that catches §5.6
   being implemented in the wrong order, and it is the one most likely to fail.
7. **The tune was composed, not bent.** Under any feel, every melody note's onset lies
   on the swung grid — no melody note is moved by `applyFeel`. Asserts the §5.1a
   divide directly, since violating it is silent and sounds merely sloppy.

And for the blues, in the existing `Form` section:

8. **Blue notes land where the blues puts them.** Over `I7` in a major-key blues, ♭3
   exceeds 10% of melody notes and outnumbers ♮3. The current numbers are 1.5% and
   15.9%; that inversion is the whole test.
9. **The tonic scale holds.** The set of pitch classes used over `IV7` is a subset of
   those used over `I7`, within a chromatic tolerance for the solo engine's approach
   notes.

---

## 9. Risks

- **Feel becomes a genre by accident.** Six feels applied liberally across four genres
  will make everything sound like the same band. Mitigation: `straight` is the default
  everywhere, and every style opts in explicitly rather than inheriting a genre
  default. Ship with only `pocket` and `funk` enabled on two styles and listen.
- **Micro-timing at the render boundary.** Milliseconds have to become beats before
  they reach `NoteEvent.beat`, which means the conversion needs the tempo, which the
  section loop has. Straightforward, but a sign error here is silent and sounds like
  sloppiness rather than like a bug.
- **The pure blues scale is thin.** Six notes with no 2nd, 6th or major 3rd will read
  as pentatonic noodling if the head is built entirely from it. §4.3 ships it anyway,
  measures it, and adds the mixolydian mixture in wave 2 rather than guessing the
  blend up front.
- **Overlapping spans.** A section feel and a one-bar break both covering bar 12. Rule:
  the shorter span wins outright for its bars. No blending; two feels averaged is a
  third feel nobody chose.

---

## 10. Work breakdown

**Wave 1 — the blues, on its own.** `Style.scaleForChord`, the resolution in
`generateSong`, the blues mapping, checks 6 and 7. Nothing else in the repo changes;
no RNG stream moves. Independently shippable and immediately audible.

**Wave 2 — the blues head.** Blues-scale / mixolydian mixture with a `blueness` knob;
a-a′-b phrase placement for a twelve-bar head. Tune-engine work, no new abstractions.

**Wave 3 — Feel, structurally.** `src/style/feel.ts` with the type, `straight` and
`pocket`. `SoloAssignment.feel` → `backing`. `applyFeel` beside `applyDynamics`,
`meta.feels` on the IR, per-section draw, `push` and `articulation` only — rhythm
section only, no `voice` block yet. Checks 1, 6 and 7 are the gate: nothing may move
that has not opted in, intensity must still outrank feel, and no melody note may be
touched.

**Wave 4 — Feel, musically.** `accent`, `ghost`, `subdivide`, `displace`, `swing`
override. The `funk`, `halftime`, `driving`, `laidback` entries. Checks 2–4.

**Wave 4b — the melodic half.** The `voice` block: `syncopation`, `accents` and
`density` multipliers folded into `voiceForStyle`'s result beside mood's, in
`composeSectionTune`. Separate from wave 4 because it is the only part of Feel that can
change which tune wins an audition, so it wants its own before/after listen rather than
landing inside a batch of rhythm changes.

**Wave 5 — breaks.** One-bar spans, the placement rule, check 5. Last because it is the
most likely to sound like a mistake and the easiest to back out.

Waves 1–2 and 3–5 are independent and can land in either order.

---

## 11. What "done" looks like

A blues where the ♭3 sits over the I7 and grinds against it, and where the head states
a phrase and answers it. A `--feel funk` flag that makes an iskelmä foksi and a jazz
blues both funkier without either of them becoming the other. One bar in a late chorus
where the whole rhythm section drops into half time and comes back out. And a
catalogue where every song that did not ask for any of this is byte-for-byte what it
was.
