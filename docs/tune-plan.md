# The Tune — plan

How a melody gets composed rather than sampled.

This document settles the contracts for one change, and it is the largest one in the
project so far: the melodic engine is thrown away and rebuilt from a different model.
Not refactored — replaced, in a new directory, with its own types, developed with no
access to the current one.

Like `concert-plan.md` and `backline-plan.md`, this says what is intended. When it is
built it becomes `docs/tune.md` and describes what exists.

---

## 1. The one claim

**A melody is a derivation, and the current engine has no way to express one.**

The engine as it stands has no level between the note and the section. Rhythm is sampled
one bar at a time from a bag of cells that must exactly fill a bar
([`fitCell`](../src/generate/rhythm.ts)); pitch is then a first-order weighted walk that
sees `prev`, `prevInterval`, one chord and one height target
([`choosePitch`](../src/generate/melody.ts)). Above that there is verbatim replay, and
nothing else.

A first-order chooser with a soft height pull can only avoid mistakes. It cannot mean
anything, because meaning in melody is hierarchy: notes serve a figure, figures serve a
phrase, phrases answer each other, phrases serve a section. Every complaint about the
output — *random after random*, *computer-like*, *annoyingly repeating* — is the same
complaint, and it is this.

`rhythm.ts` already made this argument once, for rhythm, and won it. The header says so:
choosing notes first and letting the rhythm fall out of a per-bar lottery *"gets the
priority exactly backwards, and it shows: melodies came out correct and
characterless."* That was right, and the fix was applied one level too low. Rhythm is now
composed per phrase and pitch is still a lottery per note, so the melodies are correct,
characterless, and now also rhythmically shapely.

### 1.1 The five things in the code that produce the symptom

Each is checkable, and each one dies in this plan.

1. **Every phrase has the same contour.** [`melody.ts`](../src/generate/melody.ts) —
   `arc()` rises to a peak at 0.55–0.72 of the phrase and falls away, in every phrase of
   every section of every song, jittered by `rng.float`. One bump shape. A real tune has
   *one* peak per section and its arrival is the hook.
2. **Every phrase is four bars and alternates open/closed.** `phraseBars = 4` unless the
   section is shorter; `cadenceDegrees = isConsequent ? [0,0,0,2] : [4,4,1,2]`. The
   large-scale rhythm of every tune in the catalogue is a metronome — question, answer,
   question, answer.
3. **Downbeats are forced chord tones.** `if (wantChordTone && !isChordTone && strength
   >= 3) continue` — a hard skip, not a weight. This single line is most of the computer
   sound. Human melody puts suspensions, 4–3s, appoggiaturas and anticipations on strong
   beats. The real law is *dissonance must resolve*, not *dissonance is forbidden*.
4. **Repetition is binary.** A section is either replayed verbatim (`replay()`) or
   invented fresh. There is no variation, and variation is the whole mechanism of
   melodic interest: the same figure with one thing changed.
   [`docs/hook.md`](hook.md) already lists this as a known limitation.
5. **The motto is one bar, used one way.** [`chooseMotto`](../src/generate/motto.ts)
   draws one cell and one contour from eight templates, and the only thing done with it
   is to install it at bar 0 of a phrase. No inversion, no fragmentation, no sequence, no
   augmentation, no expansion.

And one thing that turned up while reading, which is a small proof of the same point:
**`MelodyStyle.sequence` and `HookLevel.sequence` are read by nothing.** Both are
declared, both are authored in every style and every hook level, and no generator file
consumes either. [`docs/hook.md`](hook.md) describes mechanism 4 as scaling
`melody.sequence`; it does not. The knob for *how much a motif is developed* was
specified, tabulated, documented, and never wired, because there is no code that
develops a motif.

---

## 2. Decisions settled

| Question | Decision |
|---|---|
| Rewrite, or extend? | **Rewrite.** New directory `src/tune/`, new types, from scratch. |
| Rewrite what, exactly? | The melodic engine only: `generate/melody.ts`, `generate/rhythm.ts`, `generate/motto.ts` and the melodic half of `generate/hook.ts` — ~1,600 lines of a 142-file repo. Nothing else. |
| Build in place, or in isolation? | **In isolation**, behind an import rule that a grep enforces. See §3. |
| Dual path with a flag? | **No.** One hard swap at one call site, old files deleted in the same commit. See §12. |
| Backwards compatibility of seeds? | **None.** Every existing seed's melody changes. `SongMeta`-reproducibility is still required — the concert stage depends on it. See §11. |
| What is the output contract? | `NoteEvent[]`, unchanged. That is the only contract the rest of the pipeline has. |
| Does the solo engine get rewritten too? | **Not yet.** `generate/solo.ts` is a second melodic engine and it stays, consuming the new motif type where it currently consumes `Motto`. Revisited in Phase 9 on evidence, not on principle. |
| Does the rule engine survive? | **Yes**, and it moves. `generate/constraints.ts` → `core/rules.ts`. It is voice-leading law, not generation policy, and the new engine needs it without breaching the import rule. |

### 2.1 Why not a rewrite of the whole generator

Because almost none of the generator is the problem. The genre tables (four genres, eras,
moods, styles, instrument catalogue, vocal profiles), the Song IR, both renderers, the
arranger's register planning, the drum engine, the vocal syllabifier and the entire
concert stage are either good or unrelated. Throwing them away to fix the tune would cost
months and improve nothing.

### 2.2 Why not edit the current files

Three types have to die: `RhythmCell`'s bar-filling contract, `Motto`, and `HookLevel`'s
nine scalar knobs. All three are load-bearing in the files that would be edited. "Update
the current system" therefore means writing new code inside files whose existing type
signatures argue with it at every step — the full cost of the rewrite, plus the bias, plus
a long window where the engine is half of each thing. There is no version of this that is
cheaper than starting clean.

---

## 3. Isolation, and the rule that enforces it

The risk in building this next to the old engine is not disk space, it is **inherited
assumptions**. Import `RhythmCell` and rhythm is bar-shaped again. Import `WeightedCell`
and material is sampled rather than composed. Import `HookLevel` and repetition is nine
scalars rather than a derivation. Import `style.melodyCells` and the vocabulary is the
old vocabulary. Every one of those is a type that makes the wrong design the easy one.

So the rule, and it is mechanical rather than aspirational:

> **`src/tune/*` may import from `src/core/*` and from nothing else in this repo.**
> The one exception is `src/tune/adapt.ts`, which is the only file allowed to see
> `src/style/` and `src/genre/`, and which is written last.

`core/` is safe because it is arithmetic: pitch classes, scales, chord spellings, the
seeded RNG, the sixteenth grid. None of it encodes a view about how melody is made.
`core/rules.ts` joins it in Phase 0.

Enforcement is one grep added to `npm run check`, not a new script:

```
grep -rn "from '\.\./\(generate\|style\|genre\|render\|web\)/" src/tune | grep -v adapt.ts
```

Non-empty output fails the check. That is the whole mechanism, and it is enough — the
point is not to catch a saboteur, it is to make the accidental import loud.

### 3.1 Auditioning without the genre

The second reason to build outside `song.ts`: the new engine can be heard with **no genre
involved at all**. Phase 1 writes a melody over a fixed eight-bar I–vi–IV–V in C at 100
BPM and renders it through the existing `render/midi.ts`. No era, no style, no
instrument catalogue, no arranger, no drums. If a tune is boring under those conditions it
is the engine's fault and nothing else's, which is a feedback loop the current
architecture cannot offer: today a melody can only be heard as the ninth thing that
happened in a 2,000-line section loop.

This adds no harness. It is one CLI subcommand that builds a minimal `Song` and calls
`renderMidi`, and it is deleted in Phase 5 when the engine is wired in for real.

---

## 4. The model

Nine files, and the shape of the data is most of the design.

```
src/tune/
  types.ts      the model below — no logic
  motif.ts      motif generation + the operator algebra
  grammar.ts    phrase trees: how phrases relate to each other
  skeleton.ts   structural target tones per phrase
  surface.ts    skeleton + motif -> NoteEvent[]; connective figuration
  judge.ts      scoring, for best-of-N selection
  voice.ts      per-style vocabulary: archetype weights, accent templates
  tune.ts       the entry point: plan, audition, realise
  adapt.ts      the only file that sees style/ and genre/. Written last.
```

### 4.1 Rhythm is a gesture, not a cell

```ts
/** Sixteenths. Four to the beat, as everywhere else in the project. */
type Slot = number;

interface Onset { at: Slot; dur: Slot; accent: number }

interface Gesture {
  onsets: Onset[];
  /** The canvas it was written on. Two bars by default — see §6. */
  span: Slot;
}
```

Note what is absent: any requirement that the durations sum to the span. A gesture may
leave silence, may start before slot 0, and may run past its own end. `fitCell`'s
contract — *normalise a cell so its durations exactly fill the bar* — is the reason
pushes, ties and pickups had to be patched on afterwards in `applyBarlineGestures`, and
it is gone.

### 4.2 A motif is a rhythm and a shape, with a role

```ts
interface Motif {
  gesture: Gesture;
  /** Scale steps from each onset to the next. First entry is always 0. */
  contour: number[];
  role: 'hook' | 'answer' | 'tag';
}
```

A song gets a **motif family** of two or three, and they are related to each other by the
same operators that relate phrases — the answer is usually the hook inverted or
fragmented, not an independent idea.

### 4.3 The operator algebra

This is the primitive the current engine is missing entirely, and it is where the
"interesting change between sections" comes from.

```ts
type Op =
  | { op: 'transpose'; steps: number; chromatic?: boolean }
  | { op: 'invert' }                       // contour negated
  | { op: 'augment'; factor: 2 | 1.5 }     // rhythm stretched
  | { op: 'diminish'; factor: 2 }          // rhythm compressed
  | { op: 'fragment'; keep: number }       // first k onsets only
  | { op: 'extend'; with: 'step' | 'leap' | 'repeat' }
  | { op: 'displace'; by: Slot }           // same figure, off the beat
  | { op: 'sequence'; times: number; steps: number }
  | { op: 'expand'; factor: number }       // same contour, wider intervals
  | { op: 'ornament'; amount: number }
  | { op: 'reharmonise' };                 // same shape, snapped to new changes
```

`sequence` is the single most reliable device for making a line sound intentional: the
same figure two or three times, each a step or a third higher. `expand` is how a chorus
lifts a verse figure — identical shape, bigger intervals, and the ear hears *the same
idea, more of it*. `diminish` and `displace` are where "complicated but fun" rhythm comes
from without any new material at all.

### 4.4 A phrase is a node with a derivation

```ts
interface PhraseNode {
  id: string;                          // 'A', "A'", 'B', "A''"
  bars: number;                        // 2, 4, 6 — not fixed at 4
  /** Absent means this phrase *is* the statement. */
  from?: { id: string; ops: Op[] };
  cadence: 'open' | 'closed' | 'half' | 'suspended';
}
```

Every phrase in a section is either a statement or a named transformation of an earlier
one. That is the property the current engine cannot express and it is what makes a
listener feel the tune is *about* something.

### 4.5 The skeleton is where direction comes from

```ts
interface Target { at: Slot; midi: Midi; role: 'anchor' | 'peak' | 'arrival' }
interface Skeleton { targets: Target[] }   // 2-4 per phrase, not 1 per note
```

Chosen **before any surface note**: two to four pitches per phrase forming its backbone,
with chord fit, a route between them, and a defined arrival. Surface notes then become
*ways of getting from one target to the next* rather than a walk that happens to be
scored. This is the largest single change in this document. It is the reason a good tune
feels like it is going somewhere.

### 4.6 The plan is data, and printing it is how you debug a melody

```ts
interface TunePlan {
  archetype: ArchetypeId;
  keys: KeyRoute;
  motifs: Motif[];
  phrases: PhraseNode[];
  skeletons: Map<string, Skeleton>;
}
```

Serialisable, printable, diffable. When a tune is bad you look at its plan and see which
pass was wrong, instead of guessing which of fourteen weights in `choosePitch` did it. A
generator whose intermediate decisions are invisible is a generator that can only be
tuned by superstition, and that is the state of the current one.

---

## 5. The passes

| pass | decides | reads |
|---|---|---|
| 0 · song plan | form, tension curve, key route, per-section contrast targets | genre, era, mood |
| 1 · material | the motif family, best-of-N auditioned | `voice.ts`, archetype |
| 2 · grammar | phrase tree with derivations | archetype, section length |
| 3 · skeleton | target tones per phrase | chords, register plan, arc type |
| 4 · surface | notes, via the motif's gesture + connective figuration | `core/rules.ts`, idiom |
| 5 · variation | what changes when a section comes back | recall plan |
| 6 · band patch | rewrite bass/comp/drums to agree with the finished tune | the tune |

An eight-bar chorus in C, as the passes hand it along:

```
archetype   arch-with-repeated-hook   density 0.55   register lead+2   subset 1 2 3 5 6
grammar     A(2)      A'(2)               B(2)                  A''(2)
derivation  —         A, closed cadence   A inverted, up a 3rd   A, ornamented, peak +8ve
skeleton    G -> E    G -> C              C -> A                 G -> C
surface     G A G E | . . .
```

Nothing in that table can be produced by the current engine, and everything in it is
cheap to produce.

### 5.1 The resolution rule replaces the chord-tone rule

Pass 4 keeps `core/rules.ts` as a filter on connective notes, and adds the rule the
current engine inverts: a strong-beat note may be dissonant **provided the next note
resolves it by step in the direction it was approached from**. Suspensions, appoggiaturas
and anticipations become reachable, and they are a large part of the difference between a
line that sounds sung and a line that sounds correct.

---

## 6. Rhythm: gestures on a two-bar canvas

Three changes, and the first two only make sense together.

**Two bars, not one.** Almost every hook anybody can hum is a two-bar figure. A one-bar
unit cannot express one, which is why the current engine has to reach for
`applyBarlineGestures` to get anything across a barline at all.

**An accent template per style, derived from the groove.** Which sixteenths of the two-bar
span are attractive, which are neutral, which are avoided. Complex rhythm reads as
*intentional* when it agrees with the band and as *random* when it does not, and that is
the entire difference between a fun rhythm and a computer one. The template is authored in
`voice.ts` alongside the style's own bass and drum patterns, so a tango's melodic accents
and its bass accents are the same statement made twice.

**Rhythmic development as a first-class op.** The same skeleton with the gesture
augmented, fragmented, or displaced by an eighth is a different-sounding bar made of no
new material. This is what `HookLevel.sequence` was supposed to control.

---

## 7. Variety: archetypes, subsets, and plan space

The current engine's variety comes from per-note noise, which produces a thousand tunes
that are all alike. Variety has to be **categorical** to be heard.

**Archetypes**, weighted per style:

| archetype | what it is |
|---|---|
| `arch-hook` | rise to one peak, hook figure repeated on the way |
| `descending-sequence` | a figure walked down the scale three times |
| `riff-response` | short riff, answered, over a pentatonic subset |
| `long-note` | few onsets, long values, cadence-driven — ballads and ambient |
| `chant` | one note repeated with a tail; the hook is the rhythm |
| `wide-interval` | singer's tune, leaps out and steps home |

**Pitch subsets.** Which five of the seven degrees this tune lives in. Most memorable
hooks live in a subset, and *which* subset changes the colour completely — 1 2 3 5 6 is
bright and folk, 1 3 4 5 7 is yearning, 1 2 4 5 7 is modal. A one-line decision with more
audible effect than any weight in `choosePitch`.

**Plan space.** archetype × motif family × derivation sequence × skeleton route × subset ×
figuration appetite. Structured, combinatorial, and every point in it is a coherent tune —
as against the current space, which is large, unstructured, and mostly the same tune.

---

## 8. The judge, and best-of-N

Generating a plan is cheap, so generate 100–300 per section and keep one.

Terms, weighted **per archetype rather than globally**:

| term | why |
|---|---|
| peak singularity | one clear high point, not four |
| pitch-class economy | six notes heard four times beats twenty-four heard once |
| repeated rhythm figure present | rhythmic identity survives bad humming |
| step/leap balance | with a bonus for exactly one well-placed wide leap |
| cadential arrival strength | does the ending sound like an ending |
| contour match to archetype | did we build the thing we said we were building |
| distance from this song's other sections | so verse and chorus are not siblings |
| density match to the section plan | a chorus is not a busier verse |
| onset agreement with the accent template | intentional syncopation, not noise |

**The failure mode to design against.** A scalar judge Goodharts: maximise it globally and
every song converges on one tune. Two defences. The judge scores *fit to the declared
archetype*, and the archetype is drawn first — so it is a conditional score, never an
absolute one. And it must contain at least one term that penalises blandness rather than
rewarding correctness, or best-of-N will faithfully rediscover the output we are replacing.
The judge is not a smoothness meter. `core/rules.ts` already handles *wrong*; the judge
handles *dull*.

Because the terms are the same quantities `hook-report.ts` and `audit.ts` already measure,
the judge and the reports should share code — the judge is production code, and the
reports become a second reader of it rather than a parallel implementation.

---

## 9. Modulation

`liftAt` / `lift` in [`song.ts`](../src/generate/song.ts) is the whole of the current
support: one `era.keyChangeChance` roll, and every section from the last chorus onward is
transposed up one or two semitones. It is a truck-driver's gear change, hard-coded as the
only modulation the project can express.

Replace it with a **key route**: every section carries its own `{ tonic, mode }`, and
transitions are drawn from a relation graph — dominant, subdominant, relative major/minor,
mediant lift, chromatic step for a final chorus. Each transition names a **pivot**: the bar
of harmony that gets there (V7 of the new key, or a chord reinterpreted as common), and the
tune's job at the seam (hold a common tone, or step into the new tonic).

Melody recall already transposes by key difference in `replay()`, so recall keeps working
across a route rather than only across a lift.

---

## 10. Patching the band

Runs after the melody exists, over the already-generated layers.

| operation | what it does |
|---|---|
| accent agreement | bass and comp hit where the hook hits, at chosen points only |
| stop-time | band drops out for two bars under the hook's statement |
| hole-punching | band rests where the tune makes its big gesture |
| unison doubling | another instrument doubles the hook figure in the last chorus |
| push alignment | if the tune anticipates a downbeat, the bass anticipates with it |

Architecturally this is cheap, because the precedent is already in the section loop: the
melody is written last, `generateBrass` already answers it, and `resolveCollisions`
already rewrites other layers against it. This is the same relationship, with the
arranger's intent instead of the arranger's hygiene.

It is Phase 8 and it must not start earlier. Patching the band to agree with a bad tune
makes the badness structural.

---

## 11. Determinism

Unchanged as a requirement, and one part of it is a hard constraint rather than a
preference.

**Streams.** `${seed}:tune:plan` for song-level decisions (archetype, motif family, key
route), `${seed}:tune:${s}` for per-section realisation, `${seed}:tune:${s}:audition` for
best-of-N. The audition stream is separate so that changing N moves nothing else — the
same argument that gave `drumSource` its own namespace, where a single extra draw from the
shared stream silently rewrote every song in the catalogue.

**The A/B property survives.** A seed fixes form, key, tempo, instruments and drums at
every hook level; only the tune moves. `docs/hook.md` asserts this and `npm run genres`
checks it.

**`SongMeta` must still be sufficient to regenerate the song.** This is the hard one, and
it is not aesthetic: the concert stage regenerates a song from its own metadata with one
layer rerolled when a player is hit by a tomato. That means `opts.variation.melody` must
salt the new engine's streams exactly as it salts the old one's — including the audition
stream, or a rerolled singer comes back with the same tune.

---

## 12. Phases

Each phase says what becomes audible and what it means if the phase is wrong. No phase
depends on a later one.

**Phase 0 — clear the ground.** Move `generate/constraints.ts` → `core/rules.ts` and
rewrite the import path in its sixteen importers. Add the import-boundary grep to
`npm run check`. No audible change; `npm run verify` must be bit-identical.

The move pays for itself independently of this plan: two of those sixteen are
`style/types.ts` and `genre/types.ts`, so the vocabulary layer currently imports from the
generation layer. That is backwards, and `core/rules.ts` is where a rule table belonged
in the first place.

**Phase 1 — material and grammar.** `types.ts`, `motif.ts`, `grammar.ts`, plus a throwaway
CLI subcommand that renders a melody-only MIDI over a fixed I–vi–IV–V in C. *Audible:*
phrases that are recognisably versions of each other. The pitches will be dull — that is
Phase 2's job. *Wrong if:* the printed derivations look right and the result does not sound
related, which would mean the operators are too subtle to hear.

**Phase 2 — skeleton and surface.** `skeleton.ts`, `surface.ts`, the resolution rule.
*Audible:* the line goes somewhere; you can point at the peak; strong beats carry
dissonances that resolve. This is the phase that either proves or kills the whole plan.

**Phase 3 — the judge.** `judge.ts` and best-of-N. *Audible:* worst-of-100 against
best-of-100 should be an obvious difference to anyone in the room. If it is not, the judge
is measuring correctness and needs the blandness term it was supposed to have.

**Phase 4 — voices and variety.** `voice.ts` hand-authored for three styles — tango,
iskelmäpop, one synth style — plus archetypes and pitch subsets. *Audible:* two songs in
the same style are different *kinds* of tune, not two samples of one.

**Phase 5 — the swap.** `adapt.ts`, wire into the one call site in `song.ts`, delete
`melody.ts`, `rhythm.ts`, `motto.ts` and the melodic half of `hook.ts` in the same commit.
Delete the Phase 1 CLI subcommand. Remaining styles get a serviceable default derived from
their existing `MelodyStyle` fields, and are hand-authored later, one at a time, on
hearing. *Expect to re-baseline* the melodic assertions in `npm run genres` consciously,
recording what moved and why.

**Phase 6 — variation on recall.** The third chorus stops being a copy-paste. Closes the
first known limitation in `docs/hook.md`.

**Phase 7 — the key route.** Replaces `liftAt`.

**Phase 8 — band patching.**

**Phase 9 — the solo engine.** On evidence: does `solo.ts` become a consumer of `Motif`,
or does it become a `voice.ts` archetype? Decided after Phase 5, not now.

---

## 13. What this costs, honestly

- **Every existing seed's melody changes.** Intended. Nothing in the project depends on
  a specific tune, and the reproducibility that *is* depended on is §11's.
- **`voice.ts` is real authoring work.** Four genres, roughly twenty styles. Phase 5's
  adapter keeps the unauthored ones serviceable, but "serviceable" means they will sound
  generic until somebody sits with them. Ambient is the easy case — `long-note` with a
  density near zero is what its melodies already want to be.
- **The vocal layer is downstream of note count.** `generateVocalTrack` syllabifies the
  melody line: one note is one syllable. A busier tune is a wordier vocal, and the vocal
  aesthetic that currently works — floaty, vowel-led, few consonants — is a property of
  long notes. The density targets in pass 0 are therefore a vocal decision as much as a
  melodic one, and Phase 4 has to listen for it.
- **A judge can be wrong in a way weights cannot.** A bad weight makes a worse tune; a bad
  judge makes a thousand identical ones. §8 is the mitigation, and Phase 3's acceptance
  test exists to catch it early.
