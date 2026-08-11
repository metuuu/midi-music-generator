# Voices — plan

*Plan, written 2026-08-11 and annotated the same day. **Part A wave 1 is built** — `44e9940`, `28e7e0a`, `193adf5` — and §7 records what the plan got wrong. Part B is not started. Every number in §2 was measured before any of it; the commands are named beside them. Read it for reasoning, and check the numbers before acting on them.*

Two gaps, one cause. A style cannot say what its melodies are made of, and no style can
say that its music has a second voice in it. Both are the tables being silent, and the
engine playing the silence back.

---

## 1. The one claim

**The melodic engine now plays what it is told, and almost nothing is telling it
anything.**

That is a new situation. Until the rhythm work of 2026-08-11 the engine was the
binding constraint: a style declaring seven onsets to the bar got three, a third of
its bars were empty, and no table could have fixed either. Those are gone — bebop
declares 7.07 and realises 5.38, empty bars fell from 14.4% to 4.5%, and the density a
style asks for is roughly the density it gets. So the ceiling moved, and it is now on
the other side of `adapt.ts`.

Two things sit above that ceiling, and this document is about both because they are the
same failure wearing different clothes:

- **386 of 389 styles have no authored voice.** Their melodic character is *derived*
  from tables written for a different engine, and derivation cannot have an opinion —
  it can read how busy a style is and where it puts its accents, and it cannot know
  what *kind* of tune the style writes.
- **No style can declare that its music is two-voiced.** The mechanism for a harmony
  line exists and reaches 0.73% of melody bars. A style whose whole sound is two
  voices in thirds — an Everly Brothers duet, a girl-group stack, an iskelmä duetto, a
  string section's second violin — has no field to say so in, and the voice layer
  cannot sing a harmony at all.

Neither is a missing mechanism in the sense `engine-gaps.md` uses. Both are a
mechanism that exists, is reachable, and is almost never reached.

---

## 2. What was measured

### 2.1 The style voices

`npm run gen`, 152 songs across all nineteen genres, plus a walk of the style tables.

| | |
|---|---|
| styles in the catalogue | 389 |
| with an authored `Voice` | **3** — `tango`, `iskelmapop`, `berlin` |
| genres with none at all | **17 of 19** |
| declared `melodyCell` durations that are sixteenths | **2.1%** |
| …that are quarter notes | 44.1% |
| …that are eighths | 28.0% |
| median declared `melody.span` | 14 semitones |

The derived voice reads two things and infers the rest: the style's `melodyCells`, as a
histogram of onset positions (→ `accents`) and a weighted mean of onsets per bar (→
`density`), and the five scalars in `Style.melody`. `voiceForStyle` in
[`src/tune/adapt.ts`](../src/tune/adapt.ts) is the whole of it, and its own header
already says what it cannot do: *"What it cannot do is have an opinion, which is what
the authored three have and the other seventeen are owed."*

**The cells are the deeper problem and they are not fixable in place.** They were
written to fill a bar exactly, for an engine that sampled one per bar, and their
duration histogram is a statement about that contract rather than about the music: 2.1%
sixteenths across the whole catalogue, in a repertoire that contains bebop, drum and
bass, thrash and microhouse. Read as a histogram of *where notes land* they are still
good — that is what `cellAccents` uses them for and it works. Read as a claim about
*how fast a style moves* they are an artefact.

### 2.2 The second voice

570 songs, `vocals: true`, counting runs of three or more consecutive notes that share
the tune's own onset **and** duration at a third or a sixth.

| | |
|---|---|
| songs containing a harmony line at all | **16.1%** |
| melody bars that have one | **0.73%** — about one bar in 137 |
| sung songs with two vocal notes on a beat | **0 of 570** |
| songs with two right-hand notes on a melody beat | **0 of 380** |
| layers carrying more than one `Track` | **0 of 285 songs** |
| genres that never produce one | hiphop, house (0 of 30 each); ambient 1 |

The mechanism is [`harmonise`](../src/tune/band.ts) and it does the right thing: the
answering instrument stops answering and moves with the tune, same onsets, same
durations, a third or a sixth away, at 0.82 of its velocity. Every genre weights the
`harmony` device and most weight it highly — rnb and metal 8, country and pop 7,
classical, finnfolk and rock 6. Indian sets it to 0 deliberately, which is the table
working.

**It is the gating that produces 0.73%, not the device.** Five conditions in series —
the chart must draw `harmony` from a pool of six with roughly two draws per song and
only where a `counter` layer exists, the section must be a `chorus`, its `ordinal` must
be ≥ 1 so never the first chorus, and it must be at least eight bars — and then the
window is `Math.min(4, lengthBars - half - 2)`, which for the common eight-bar chorus
is **two bars**. One harmony phrase, at most twice in a song.

---

## 3. Part A — giving 389 styles a voice

### 3.1 Why more derivation is not the answer

The obvious move is to derive harder: infer archetype weights from tempo, infer subsets
from the genre's chord vocabulary, infer ops from the form. It should be refused, and
the reason is in the shape of what is missing rather than in its size.

`Voice` has ten fields. Derivation already produces good answers for four of them —
`density`, `accents`, `leap`, `ornament`, `syncopation` and `compass` all read a number
the style has already written down. What it cannot produce is the other three, and they
are the three that decide what the tune *is*:

- **`archetypes`** — which of the six kinds of tune this music writes. `archetypesFor`
  currently guesses from density and `sequence`, which is four sentences the tables
  were already making, and none of them is *"a bebop head is a riff-response and a
  Berlin lead is a long note"*. That is knowledge about the records.
- **`subsets`** — which degrees the tune lives in. This is the single most audible
  one-line decision in the whole engine and every derived style takes the same six
  weighted defaults.
- **`ops`** — what this style does to a figure. Derived from `melody.sequence` and
  `melody.ornament`, which is two numbers spread across eleven operators.

A derivation that guessed at these would produce 386 styles that are all wrong in the
same direction, which is worse than 386 that are all generic in the same direction,
because the first kind is harder to notice.

### 3.2 Two tiers, and the second one is usually empty

Not 386 hand-written voices. **A `Genre.voice`, and a `Style.voice` delta only where the
style differs from its genre.**

```ts
// genre/types.ts
/** What this genre's melodies are made of, before a style has its say. */
voice?: Partial<Voice>;

// style/types.ts
/** …and where this style disagrees with its genre. */
voice?: Partial<Voice>;
```

Resolution order in `voiceForStyle`, replacing the current two-branch lookup:

1. an authored `Voice` registered by id — the three that exist, unchanged
2. `{ ...derived, ...genre.voice, ...style.voice }`, shallow, with `ops` and
   `archetypes` merged rather than replaced

That keeps every field derivation is already good at, lets a genre state the three it is
not, and costs a style that agrees with its genre exactly nothing. It is the same
Genre-defaults-Style-overrides shape the rest of the project uses, which is the argument
for it: nothing new has to be learned to read it.

**The measurement that says a second tier is needed** is that derived density already
spreads widely *inside* a genre — classical 2.1 to 9.3, metal 1.4 to 6.4, house 1.1 to
4.5. A genre voice that flattened those would be a regression. So the genre tier must
carry only what is genuinely genre-wide (archetypes, subsets, ops) and leave the
per-style numbers where they are.

### 3.3 What an author actually decides

Per genre, six decisions, and each is a sentence about the records rather than a number
to tune:

1. **Which kinds of tune.** Six archetypes, weighted. *Bebop is riff-response and
   descending-sequence; a Berlin lead is long-note and chant; a country chorus is
   arch-hook.*
2. **Which degrees.** One to four subsets, weighted. *Blues lives in `[0,2,3,4,6]`;
   bright folk in `[0,1,2,4,5]`.*
3. **What it does to a figure.** The `ops` appetites — which of sequence, diminish,
   displace, ornament, expand this music actually does.
4. **Whether the canvas is two bars or four.**
5. **Where the accents fall**, only where the derived table from the cells is wrong.
6. **Which paces** — once `Pace` is exposed to the voice, which is §5.2 below.

The three authored voices in [`src/tune/voice.ts`](../src/tune/voice.ts) are the model
and they are the right length: tango is 27 lines and its comment explains every weight
from two facts about the style. That is the standard, and it is what makes this
authoring rather than tuning.

### 3.4 Order of work

By leverage, and the ordering is a claim: a genre voice is worth more than a style
voice, because it fixes every style in the genre at once and because the three fields it
carries are the ones no derivation can reach.

| wave | what | why here |
|---|---|---|
| 1 | the nineteen `Genre.voice`s | 389 styles gain an opinion; nothing else in this plan is worth as much per line |
| 2 | style deltas where wave 1 is audibly wrong | measured, not assumed — see §3.5 |
| 3 | the `melodyCells` question | only after 1 and 2, because the cells may stop mattering once `Voice` is authored directly |

Wave 3 is deliberately last and deliberately open. Once a style declares `density`,
`accents` and `ops` for itself, `melodyCells` is read for nothing but the cases that did
not — so it may need no work at all, and rewriting 389 cell tables to add sixteenths
would be a large change made for a reason that had already gone away.

### 3.5 How wave 2 knows which styles need a delta

Not by listening to 389 styles. **By measuring the derived voice against the style's own
prose.** Every style in this project carries a comment saying what it is; a style whose
comment says *"straight eighths and unembarrassed about it"* and whose realised melody
is 40% sixteenths is a style that needs a delta, and that comparison is cheap to make in
bulk.

A concrete form: a report that prints, per style, its realised density, sixteenth share,
leap share, span and archetype histogram, sorted by how far each sits from its genre's
median. The outliers are the list. This is one report, not a harness — see the standing
rule about that in the project's own notes — and it can be a mode of `npm run moods` or
`npm run strictness` rather than a new file.

### 3.6 What is checked

- **Every genre has a voice.** A trivial assertion, and the point of it is that adding a
  genre without one becomes a failure rather than a silence.
- **A style's realised archetype histogram matches its declared weights**, within a
  tolerance, over ~200 songs. This catches a voice that is authored and then overridden
  by something downstream, which is the failure mode `melody.sequence` had for the life
  of the old engine.
- **Two styles in one genre produce measurably different melodies.** The existing
  freshness machinery in `judge.ts` measures this within a song; the claim here is
  across styles, and it is the one that says the authoring bought anything.
- **`npm run genres` does not move on the styles that took no delta.** The two-copy test
  in the project's notes is how, and it should be run per wave rather than at the end.

---

## 4. Part B — the second voice

### 4.1 The four absences

Stated separately because they need four different fixes and only the first is large.

1. **The voice layer cannot sing a harmony.** `oneNoteAtATime` in
   [`generate/vocals.ts`](../src/generate/vocals.ts) collapses the melody to its top
   note before syllabifying, deliberately and correctly — a person sings one note — but
   nothing then writes a second singer. 0 of 570 sung songs carry a stack.
2. **The harmony line only goes below.** `step(n.midi, -below, beat)`. No descant, no
   harmony above the tune.
3. **It is strictly parallel.** One constant scale-step distance for the whole span, so
   it cannot break to contrary motion at a cadence or step aside where the chord makes
   the parallel interval wrong.
4. **It is a colour, not a property.** Gated to one phrase of one repeat chorus. A style
   whose sound *is* two voices has nowhere to say so.

### 4.2 Where a harmony line lives — and it is not a new layer

**Decision: a second `Track` on an existing layer. No new `LayerId`.**

The three alternatives, and why they lose:

- **A new `'harmony'` layer.** The obvious answer and the expensive one. `'counter'`
  alone is named in 34 files; a layer is a palette entry, a casting decision, a stage
  position, a mix level, a dynamics response, a `LAYER_ORDER` slot and a branch in both
  renderers. The cost is real and it buys a distinction the IR can already make.
- **Extra notes on the melody track.** Cheapest, and wrong in the one way that matters:
  `melodicLine` and five reporting tools read that track as *the line*, and the project
  has already been bitten twice by a track that was not one — `hand: 'left'` and
  `doubling: 'lead'` both exist because of it. A harmony note is a second player, not a
  second note.
- **A `Track.doubles` reference.** Expressive and unserialisable in the way that matters:
  every renderer would have to resolve it, and two renderers resolving a reference is two
  chances to disagree, which is the failure `core/grid.ts` opens by describing.

A second track on the same layer is already legal — `trackForPart` in
`concert/choreograph.ts` handles it explicitly and says the IR does not forbid it — and
it is currently unused, measured at 0 of 285 songs. So the work is to *use* a capacity
that exists rather than to add one.

**Casting needs nothing, which was checked rather than assumed.** The obvious risk is
that a second player has no way onto the stage, and it is not a risk:

- `roster` in [`concert/cast.ts`](../src/concert/cast.ts) iterates
  `for (const layer of LAYER_ORDER) { for (const track of song.tracks) { … } }` and
  drafts **one player per track**, with no `break`. Two tracks on `melody` produce two
  drafts by construction.
- **It already stages two players on one layer in production.** `drumStations` puts a
  drummer and a hand-drum player both on `layer: 'drums'` — funk's `congas` gets two
  people — and `npm run concert` asserts their two shares cover the event stream
  exactly once. The `vocal-group` branch is the same fact the other way round: several
  people on one track.
- **The id-uniquing is already written.** `let id = d.layer; for (let n = 2;
  used.has(id); n++) id = `${d.layer}-${n}``, under a comment that calls it *"insurance
  against a future arrangement that doubles a layer, not a case that occurs today."*
  Somebody anticipated exactly this. A second lead is `melody-2` and every gesture,
  look and groove stream keys on that id.
- The five downstream `performers.find(p => p.layer === …)` calls take the *first*
  player on a layer, and the ordering convention that makes that correct is already
  established and commented for the drums case — the kit is drafted first so it keeps
  the plain `drums` id. A harmony track drafted after its lead inherits the same rule.

What genuinely needs teaching is therefore shorter than it looked: `melodicLine` (which
of two tracks on a layer is *the* line), the mix, and the stage's spacing pass.

### 4.3 A standing property, not a device draw

`Device.harmony` stays — a one-off harmony phrase in a repeat chorus is a real
arrangement gesture and it should keep working. What is added beside it is the case it
cannot express:

```ts
// style/types.ts, and Genre as the fallback
/**
 * How much of this style's melodic writing is two-voiced, and how.
 *
 * Absent means the device draw in `chart.ts` decides, which is what every style
 * does today. Present means the second voice is a property of the music rather
 * than an event in one chorus.
 */
harmony?: {
  /** Share of sections that carry a second voice, 0..1. */
  amount: number;
  /** Scale steps, signed. Positive is above the tune. Weighted. */
  intervals: readonly (readonly [number, number])[];
  /** Which layer carries it: a second lead, a second singer, or the answer. */
  on: 'melody' | 'vocal' | 'counter';
  /** Sections it belongs in. Absent means every section the lead sings in. */
  kinds?: readonly SectionKind[];
};
```

`intervals` is signed and weighted rather than the current single `harmonyBelow: 2 | 5`,
which is what lets a descant exist and lets a style prefer thirds while still reaching
for a sixth. `on` is what makes *stemmalaulu* sayable: `on: 'vocal'` is a second singer
and `on: 'melody'` is a second violin.

### 4.4 The pass — why strict parallel is wrong

`harmonise` as it stands takes a fixed step count and applies it to every note. That is
right for two bars and audibly wrong for sixteen, for two reasons that are both about
the harmony rather than about taste:

- **The parallel interval is not always available.** A third below every note of a
  diatonic line puts a diminished fifth against the chord wherever the line touches the
  fourth degree over a dominant. Real second parts step aside there — a third becomes a
  fourth for one note and comes back.
- **A cadence wants two parts to be two.** Parallel motion into an arrival is the one
  place the ear most needs to hear that there are two players, and the existing code
  already half-knows this: it excludes the last two bars of the span. Excluding is the
  cheap version of resolving.

The pass therefore becomes: *take the interval as the intent, and check each note
against the chord sounding under it.* Where the parallel note is not in the prevailing
scale, move to the nearest note that is, preferring the one that keeps the direction of
the tune. At an `arrival` target — the skeleton already marks them — resolve to a chord
tone rather than to the interval. That is four rules and it is the difference between a
harmony part and a transposition.

**Contrary motion is deliberately not in scope.** A second part that genuinely moves
against the tune is counterpoint, the project already has an answering line for that,
and mixing the two would produce something that is neither.

### 4.5 The vocal stack

The smallest of the four and the one with the most audible result. `generateVocalTrack`
gains a second call with a transposed line, and the line it transposes is the same one
`oneNoteAtATime` already extracts — so the syllables, the vowels and the word boundaries
are shared by construction, which is what makes it a stack rather than two singers
singing different words.

Two things it must not do. It must not re-run the lexicon, or the two singers sing
different syllables on the same beat. And it must not stack more than two above the lead
by default: three-part is a specific sound (a girl group, a gospel trio, close-harmony
country) and a style that wants it should say so.

### 4.6 What is checked

- **A style declaring `harmony` produces one**, in roughly `amount` of its sections,
  measured as runs of three or more notes sharing the lead's onsets and durations. This
  is the check that would have caught the present 0.73%.
- **The harmony line is never the tune.** No unison, no octave, no crossing — a second
  part that crosses the lead has stopped being a second part.
- **Every harmony note is in the prevailing scale**, which is the §4.4 rule stated as an
  assertion.
- **A stacked vocal sings the same syllables as the lead at every shared onset.**
- **No song has two tracks on one layer without a player for both** — the casting half,
  and it belongs in `npm run concert` beside the checks that already ask who is holding
  what.

---

## 5. Order of work

Part A wave 1 first, and the reason is that it is the only item here that improves
something already shipping rather than adding a capability. Part B §4.5 second, because
it is the cheapest of the four absences and the most audible.

| | | depends on |
|---|---|---|
| A1 | nineteen `Genre.voice`s — **built**, `193adf5` | — |
| B1 | the vocal stack (§4.5) | — |
| B2 | `Style.harmony` / `Genre.harmony` as a standing property (§4.3) | — |
| B3 | the chord-aware harmony pass (§4.4) | B2 |
| B4 | a second `Track` on `melody` for a second lead (§4.2) | B2, B3, casting |
| A2 | style deltas | A1, and the report in §3.5 |
| A3 | the `melodyCells` question | A2, and it may close without work |

---

## 6. What this plan will probably have got wrong

Written before the work, in the house style, and the point of the section is that it is
checked afterwards.

- **That nineteen genre voices are enough for wave 1 to be worth shipping alone.** They
  might not be: a genre voice is an average, and a genre whose styles genuinely disagree
  — classical spans 2.1 to 9.3 onsets a bar — may be made worse by one, in which case
  the tier boundary is in the wrong place and wave 2 is not optional.
- **That the harmony pass can be four rules.** Voice-leading passes in this project have
  a history of needing a fifth rule to stop the fourth one making things worse:
  `fitSegment`, `resolveDissonances` and `applyRules` each acquired one, and each
  comment says so.
- **That the stage can *space* two leads, having established that it can cast them.**
  §4.2 settles casting by reading it — one player per track, two players already on one
  layer in production, the id-uniquing pre-written. Placement is the half that was not
  read: `placeMachines` and the sightline pass reason about who stands where, and two
  melody players are a pair the stage has never had to separate. If that turns out to
  need a layer to position against, the decision flips.
- **That `melodyCells` can be left alone.** §3.4 assumes an authored `Voice` makes them
  irrelevant. If `cellAccents` turns out to be doing more work than
  `cellDensity` — and it may, since it is the one derived field nobody has complained
  about — then the cells are load-bearing after all and wave 3 is not optional either.

---

## 7. What the plan got wrong — written after wave 1

Four things, and the largest was not in the document at all.

**The cache was handing one style's voice to another, and this plan never saw it.**
`voiceForStyle` memoised on `style.id`, and a style id is not unique: 365 distinct ids
over 389 styles, 19 shared across genres, `ballad` by six. So in any process touching
more than one genre — every batch, every report, every check — whichever style derived
first supplied the voice for every later style with its name. `house/bleep` declares the
widest span in the catalogue and was playing `dnb/bleep`'s. Fixed in `28e7e0a` with a
`WeakMap` on the object, which makes the collision unsayable rather than handled.
**§3.4's whole premise — that authoring per-style voices is the wave-2 win — was resting
on a mechanism that silently discarded per-style differences**, and neither §3 nor §6
suspected it. The lesson is §3.5's, arrived at from the other end: before authoring
against a derivation, check that the derivation is reaching the thing it derives from.

**§3.2's resolution order could not be implemented where it said.** `voiceForStyle` takes
a `Style` and there is no style→genre lookup anywhere; the genre's voice has to be
threaded from `generateSong` through `SectionTuneOptions`. The plan asserted a call
shape without checking that the caller had the argument.

**§3.1 miscounted its own list** — "good answers for four of them" followed by six — and
overstated the case besides. Derivation *does* produce `archetypes`, `subsets` and `ops`;
what it cannot do is produce them *well*. "Cannot reach" should have read "answers
generically for every style at once", which is the real complaint.

**§4.3's `Genre.harmony` is on thinner ice than it was given.** `drops`, `dropBars`,
`tempoRamp` and `breakCarrier` are all style-only, each with a paragraph arguing that a
claim about what one piece is made of does not travel to a genre, and an `amount` is
that kind of claim. It is built, as a fallback under `arrangement` where the genre
already speaks about the harmony device, and the counterargument is recorded beside it.
Part B should test it rather than assume it.

**What the plan got right and is worth keeping.** The two-tier split survived contact:
every numeric field varies 16–37% *inside* a genre, so a genre-level number would have
flattened a real distinction, and holding the genre tier to `archetypes`, `subsets` and
`ops` was the decision that made nineteen parallel authors safe. And §4.2's casting
argument, which §6 flagged as the weakest thing in the document, turned out to be
stronger than its own reasoning: casting drafts one player per *track*, already stages
two on one layer in production, and the id-uniquing for a doubled layer was written
years before anybody needed it.
