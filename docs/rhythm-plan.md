# Rhythm — plan

What the rhythm section plays, why every style's version of it sounds like every other
style's, and the one vocabulary that four separate tables have each been spelling out
by hand.

This document settles the contracts for three connected changes: letting a bass state a
*shape* rather than a list of chord functions, giving the rhythm section the
per-section variation the drummer already has, and letting transitions read the band's
own figures instead of the metre's.

Like `feel-plan.md`, `backline-plan.md` and `transition-plan.md`, this says what is
intended. When it is built it becomes `docs/rhythm.md` and describes what exists.

**It reorders `transition-plan.md`.** Its waves 3–5 should land after wave 1 and wave 4
here — see §7.3 and §11. Nothing in this plan needs transitions to be finished, and
neither plan needs the other to be correct.

---

## 1. The one claim

**The melody was given a compositional model and the backline was not.**

`melodyCells` used to be played literally. Today
[`adapt.ts:74`](../src/tune/adapt.ts) reads them only as *statistics* — density, accent
profile — which parameterise a real engine: phrase forms in `tune/grammar.ts`, motif
operations in `tune/motif.ts`, and an audition in `tune/judge.ts` that scores candidates
and keeps a winner. The table stopped being the notes and became a description of the
style's tendencies.

The bass, comp and drum tables never made that move. They are still the notes:

```ts
// src/generate/song.ts:519 — once, for the whole song
const bassPattern = rng.weightedBy(style.bass, (p) => p.weight);
const compPattern = rng.weightedBy(style.comp, (p) => p.weight);
const drumPattern = rng.weightedBy(style.drums, (p) => p.weight);
```

`generateBass` then plays that pattern's `hits[]` into every bar of every section. Only
the pitches move, because the chord moves. **The bass rhythm of a hundred-bar song is
one bar, repeated a hundred times**, and that is not a perception to be argued with — it
is what the loop does.

The second half of the claim is sharper and is what makes the first half unfixable by
authoring more tables: **`BassTone` cannot express a riff.** See §2.2.

---

## 2. What is wrong, measured

### 2.1 The pools are small and the draw is once

Counted across the catalogue:

| | bass | comp | drums |
| --- | --- | --- | --- |
| median per style | 2–3 | 3 | 2–3 |
| styles with exactly one | `bebop` | `trio`, `odd`, `fusion` | `jenkka`, `drone`, `choral` |

One draw from a pool of two or three, held for the whole song. Between two songs in the
same style the rhythm section has at most three faces; within one song it has one.

### 2.2 `BassTone` asks the harmony a question when a riff is an answer

```ts
// src/style/types.ts:39
export type BassTone = 'root' | 'fifth' | 'third' | 'seventh' | 'octave' | 'approach';
```

Six *chord functions*. Every one of them asks the chord underneath what note to play,
and the answer changes with the chord's quality. That is exactly right for a walk, an
oom-pah and a two-feel. It is wrong for the thing most non-swing bass lines are.

Fusion is where this is visible, because fusion's own docstring
([`jazz/styles.ts:1339`](../src/genre/jazz/styles.ts)) states the requirement outright:

> **The bass is an ostinato, not a walk.** Fusion bass is a *riff*: **a fixed shape
> re-rooted on each chord**, repeating until the section ends.

And then the table cannot write one ([`jazz/styles.ts:1542`](../src/genre/jazz/styles.ts)):

```ts
{ name: 'seven-riff', weight: 6, hits: [
  { at: 0,  dur: 3, tone: 'root',    vel: 0.98 },
  { at: 4,  dur: 3, tone: 'root',    vel: 0.86 },
  { at: 8,  dur: 3, tone: 'fifth',   vel: 0.9  },
  { at: 12, dur: 2, tone: 'seventh', vel: 0.8  },
] },
```

`tone: 'seventh'` resolves through `chordPcs(chord)[3]`, so the interval it plays is
**+11 over a maj7, +10 over a min7 or a dom7, +9 over a dim7**. The shape is not fixed.
The style says "a fixed shape re-rooted on each chord" and the type delivers a
chord-tone outline that changes with every quality the progression passes through.

This is the single largest cause of what this plan is for. Every style's bass is drawn
from the same six words, so every style's bass is a variation on *root, fifth, root*.
Two hundred more table entries written in that vocabulary would still all sound like
each other.

### 2.3 What already varies, and why it is not enough

This is not a project without variation machinery. It has a lot, and none of it reaches
the bass:

| mechanism | scope | who gets it |
| --- | --- | --- |
| `planKitVariation` / `varyPattern` ([parts.ts:1819](../src/generate/parts.ts)) | per section: thin the hand, move to ride, open a hat | **drums only** |
| `FillPalette` | section ends | **drums only** |
| `Feel` ([feel.ts](../src/style/feel.ts)) | per section: timing, accent, articulation | 6 styles of 28 |
| `arpDirection` / `arpOctaves` | per pattern | comp |
| velocity jitter | per hit, ±6% | bass, comp, drums |

The drummer already has exactly the mechanism this plan wants to generalise, and it has
been sitting there being drums-only since it was written.

### 2.4 The design principle this is *not* allowed to break

[`song.ts:619`](../src/generate/song.ts) states it:

> The band's *identity* is still fixed for the whole song: the bass, comp and drum
> patterns are chosen once, above. What is per-section here is only the variation
> within them.

That is a decision, not an oversight, and it is the right one — a band that changed its
comping pattern at every section boundary would sound like a compilation. **So this plan
does not re-draw the pattern per section.** It gives bass and comp the *variation within
a fixed identity* that the drummer has had all along. The distinction is the whole
shape of §6.

---

## 3. Decisions settled

| Question | Decision |
| --- | --- |
| Re-draw the pattern per section? | **No.** §2.4. Identity stays fixed; variation is applied to it. |
| Where does the shared vocabulary live? | `generate/rhythm.ts`, which is already the metric-utility home and today carries no vocabulary at all. |
| Operators or a figure bank? | **Operators.** §4.3, and the reason is `feel.ts`'s. |
| How does a riff get expressed? | `BassTone` gains a numeric interval form, chord-root-relative. §5. |
| Who draws the variation? | Its own namespaced stream per section per layer. Non-negotiable — §6.1. |
| Opt-in or on by default? | **Opt-in per style**, absent meaning today's behaviour bit for bit. |
| Does a transition read the band's figures? | **Yes**, and it is legal — §7.1 proves it. |
| Is `anticipate` defined twice? | **No.** `elide` and the bass operator are the same gesture and share one implementation. §7.3. |
| A named-figure library (clave, tresillo)? | **Not doing it.** §8. |

---

## 4. The design: one figure vocabulary, expressed as operators

### 4.1 Four tables are already spelling out the same thing

`BassPattern.hits`, `CompPattern.hits`, `DrumPattern.voices` and `Style.shots` are four
authoring surfaces answering one question: **what onsets does this style hit?** Each
carries its own payload on top — a tone, a voicing, a drum voice, nothing — but the
onsets are the same kind of object in all four, and nothing in the project says so.

| today | under a figure vocabulary |
| --- | --- |
| `BassPattern.hits` | onsets + a tone assignment |
| `CompPattern.hits` | onsets + a voicing |
| `DrumPattern.voices` | onsets per voice |
| `Style.shots` | onsets everybody plays |
| — | an operator at a phrase boundary (§6) |
| — | an operator at a seam (`shot`, `elide` — §7) |

### 4.2 The operators

Generic over the payload, in the idiom `cycleHits` already established
([parts.ts:56](../src/generate/parts.ts)) — `<T extends { at: number }>` — so bass hits
keep their `tone`, `dur` and `vel`, comp hits keep theirs, and drum slots work by being
wrapped:

```ts
/**
 * A rhythmic figure is a list of onsets in sixteenths and whatever the caller
 * hangs off them. Every operator below preserves the payload and moves, drops or
 * splits the onsets — which is what keeps this a vocabulary rather than a second
 * table.
 */
export type Onset = { at: number };

/** Move the hit nearest `slot` earlier by an eighth. The push. See §7.3. */
export function anticipate<T extends Onset>(hits: readonly T[], opts: {
  slot: number; slotsPerBar: number; groups?: readonly number[];
}): T[];

/** Drop hits below a metric-strength threshold. What `varyPattern`'s `thin` does crudely. */
export function thin<T extends Onset>(hits: readonly T[], opts: {
  slotsPerBar: number; groups?: readonly number[]; keepAbove: number;
}): T[];

/** Split one hit into two of half the length. The fill-in. */
export function subdivide<T extends Onset & { dur?: number }>(hits: readonly T[], opts: {
  slot: number;
}): T[];

/** Rotate the whole figure by `by` sixteenths, wrapping. Guarded — see §10. */
export function displace<T extends Onset>(hits: readonly T[], opts: {
  by: number; slotsPerBar: number;
}): T[];
```

Every one reads `metricStrength`, which already knows about `groups` and is therefore
already right in an asymmetric metre. That is the reason this belongs in `rhythm.ts` and
nowhere else.

### 4.3 Operators, and specifically not a bank

[`feel.ts:33`](../src/style/feel.ts) wrote the rule this has to obey:

> **It modifies, it never authors.** No pattern banks, no note choices, no harmony, no
> layers added or dropped. A proposal that needs its own bass figure is a style, and
> that line is the only thing keeping the feel library from growing into a second copy
> of the style table.

A figure *bank* — a shared library of named patterns every style may draw from — fails
that test immediately: it is a second copy of the style table with a nicer name, and the
end state is every genre reaching for the same twelve figures, which is the complaint
this plan opened with, arriving from the other direction.

An *operator* cannot fail it. It has no figures in it. It composes with whatever the
style already authored, so a tango's push is the tango's own pattern pushed and a
bossa's is the bossa's, and the two do not converge no matter how many styles opt in.

---

## 5. Change A — the bass may state a shape

### 5.1 The field

```ts
/**
 * Where a bass note is, relative to the chord.
 *
 * The six names are *chord functions*: each asks the harmony what to play and
 * gets a different answer as the quality changes. Right for a walk, right for an
 * oom-pah, and wrong for the thing most bass lines outside swing actually are.
 *
 * A number is semitones above the chord root, taken literally. `10` is a flat
 * seventh over a major triad as readily as over a dominant, because a riff is a
 * shape and does not renegotiate with each chord — which is what
 * `jazz/styles.ts` claims about fusion's bass in prose and what the six names
 * above could not deliver.
 *
 * Chord-root-relative rather than key-relative, matching the same sentence:
 * *re-rooted on each chord*. A figure that ignores the harmony entirely is a
 * pedal, and `sustain` already says that.
 */
export type BassTone =
  | 'root' | 'fifth' | 'third' | 'seventh' | 'octave' | 'approach'
  | number;
```

### 5.2 The wiring

One branch at the top of the switch in `generateBass`
([parts.ts:87](../src/generate/parts.ts)):

```ts
if (typeof hit.tone === 'number') midi = rootMidi + hit.tone;
```

Everything downstream — `clampToRange`, `mergeHeld`, the cycle walk — is unchanged, and
`trimOverlaps` was never involved. This is a four-line change to the generator; all the
weight is in the type and in what styles can now say.

### 5.3 The first table it fixes

`seven-riff` becomes the shape its own docstring already claims:

```ts
{ name: 'seven-riff', weight: 6, hits: [
  { at: 0,  dur: 3, tone: 0,  vel: 0.98 },   // root
  { at: 4,  dur: 3, tone: 0,  vel: 0.86 },   // root
  { at: 8,  dur: 3, tone: 7,  vel: 0.9  },   // fifth, fixed
  { at: 12, dur: 2, tone: 10, vel: 0.8  },   // flat seventh, fixed
] },
```

Now the interval from the bar's chord root is 0, 0, 7, 10 over every chord in the
progression, which is what a fusion bassist plays and what §2.2 showed the old spelling
could not hold.

Only fusion moves in this wave, and it moves *audibly and on purpose*.

---

## 6. Change B — variation within a fixed identity

### 6.1 The stream, which is the part that can go badly wrong

Every per-section draw added here **must come from its own namespaced stream**. This is
not tidiness and the cost of getting it wrong is recorded in the repo already
([`song.ts:541`](../src/generate/song.ts), on `drumSource`):

> Drawn from `rng` it consumed one number and moved every draw after it, so every song
> in every genre came out different. Measured: `npm run genres` went from 66% to 59% on
> iskelmä's solo-arc check and failed it. […] re-weighting the table from 8:2 to 400:1
> […] produced *bit-identical* numbers. Nothing the box did mattered. The songs moved
> because one number had been taken out of the stream in front of them.

There is a second, sharper reason here that `drumSource` did not have. The running `rng`
inside the section loop is kept **hook-aligned by construction** — `pickProgression` is
drawn and thrown away rather than skipped, precisely so a recalled chorus does not
reshuffle the band ([`song.ts:711`](../src/generate/song.ts)). A variation draw taken
from that stream would be fine for bass and comp and **fatal for drums**: it would make
drum events hook-dependent and break the byte-identity assertion in
[`genre-check.ts`](../src/genre-check.ts) — the `JSON.stringify(a.drums.events) ===
JSON.stringify(b.drums.events)` compare, cited as line 679 by `transition-plan.md` and
since drifted, which is its own small argument for naming the assertion rather than the
line.

So: `new Rng(`${seed}:vary:bass:${s}`)`, `…:vary:comp:${s}`. Same shape as `feel`,
`motto`, `hook`, `transition` and `drums:source`. A style that declares no variation
constructs no `Rng` and draws nothing, and its songs are byte-identical.

### 6.2 The field

```ts
// on Style
/**
 * How much the rhythm section varies its own figure from section to section,
 * 0..1 per layer. Absent means none, which is what every style does today and
 * what the whole catalogue must keep doing until a style opts in.
 *
 * Deliberately *not* a probability of re-drawing the pattern. The pattern is the
 * band's identity and is fixed for the song — see `song.ts` on why. This is the
 * chance that the identity is played differently, which is what a rhythm section
 * does and what the drummer has been doing alone since `planKitVariation`.
 */
variation?: Partial<Record<'bass' | 'comp', number>>;
```

### 6.3 Where it applies

One operator drawn per section per layer, applied at **phrase boundaries** — the last
bar of each four-bar group — and not per bar. Two reasons, and the second is the load-
bearing one:

- A bass that varies every bar is not a bass player, it is a shuffle. Real variation
  arrives where the phrase does.
- The harmony is bar-shaped and chords change on the barline (`Cycle`, in
  `style/types.ts`). An operator that fires on the last bar of a phrase is landing on
  the bar the ear is already expecting something from.

Structural where it can be, drawn where it cannot — the same division `planKitVariation`
and `fills.ts` already make: *that* a phrase-end bar varies is an arrangement rule and
should hold in every song; *which* operator it gets is a detail nobody would notice
repeating and everybody would notice being identical in every song ever generated.

---

## 7. Change C — transitions read the band's figures

### 7.1 The pattern tables are hook-invariant, and this is the whole permission

Wave 2 of `transition-plan.md` rests on one rule, and it is a rule about *derivation*,
not about drums:

> **A drum event may not be derived from anything that changes with `--hook`.**

The three pattern draws pass that test, by construction:

- they happen at [`song.ts:519`](../src/generate/song.ts), **before** `hookRng` exists
  ([`song.ts:633`](../src/generate/song.ts)) and before the section loop;
- `hookRng` is a separate stream, created so that "adding it did not shift every later
  decision";
- and the running `rng` is deliberately kept aligned across hook levels afterwards
  ([`song.ts:711`](../src/generate/song.ts)).

So `bassPattern`, `compPattern` and `drumPattern` **cannot move when `--hook` moves.**
They have exactly the same standing as `Style.shots` and the metre fallback, and the kit
may play a figure derived from any of them. `genre-check.ts:679` keeps passing.

### 7.2 Why it is also the better figure

`shotFigures` ([transition.ts:178](../src/generate/transition.ts)) derives from the
metre: the group heads, and the group heads with the last anticipated. Fusion gets a good
shot from it because 2+2+3 is distinctive — that is why wave 2 shipped there and the
choice was correct.

But `transition-plan.md` §6.1 widens `shot` to iskelmä and most of jazz, and a metre is
shared. A tango, a foksi, a bossa and a swing are all 4/4 with no `groups`, so all four
would draw from **the same two figures — slots [0, 4, 8, 12] and [0, 4, 8, 14]**. Wave 5
as planned would ship a brand-new axis of sameness into eighteen styles, which is the
complaint this document opens with arriving inside a new feature.

The plan's own §5.1 already asks for the fix and the implementation has not caught up:

> A fusion break is the rhythm section's own figure, and the horn plays over it or stops.

So:

```ts
export interface ShotSource {
  beatsPerBar: number;
  groups?: readonly number[];
  shots?: readonly (readonly [number[], number])[];
  /**
   * The onsets the rhythm section is already playing, from the drawn bass and
   * comp patterns. Preferred over the metre fallback and outranked by an
   * authored `shots` table.
   *
   * Hook-invariant for the same reason the table is — see the note on the draw
   * order in `song.ts`. This is what stops eighteen styles in 4/4 from sharing
   * two figures.
   */
  band?: readonly number[];
}
```

Precedence: `shots` table → band figure → metre. Each is a stronger statement about this
style than the one after it.

### 7.3 `elide` and `anticipate` are one gesture

`elide` moves a seam's first onset back by an eighth. The bass operator `anticipate`
moves a hit back by an eighth. They are the same gesture at two scales, and they meet in
exactly one bar: elide pulls the incoming section's downbeat back into the outgoing
section's last bar — which is a phrase-end bar, and therefore precisely where §6.3 says
an operator may have just put an anticipation. Two pushed notes an eighth apart across a
barline is not two gestures, it is mush.

Two consequences, and both are cheap if they are decided before wave 4 of the transition
plan is written and expensive after:

1. **One implementation.** `elide` calls `anticipate` from `rhythm.ts`. There is no
   second definition of what a push is.
2. **One guard.** No elide into a seam whose outgoing bar was already anticipated. It
   sits beside the key-change guard that plan already specifies and reads the same way.

---

## 8. What this deliberately does not do

- **No named-figure library.** No `tresillo`, no `clave`, no `backbeat` constants. §4.3
  is the argument and it is `feel.ts`'s argument. If a style wants a 3-3-2 it writes one
  in its own table, where it can be about that style. Revisit only with evidence that
  two styles want the *identical* figure and are both wrong to.
- **No per-section pattern re-draw.** §2.4. The band's identity is fixed for the song
  and this plan does not relitigate that.
- **No new notes from an operator.** `subdivide` repeats the pitch it split from and
  `anticipate` moves an onset that existed. Nothing here proposes a pitch class that was
  not already sounding — the same boundary `feel.ts` draws for `ghost` and `subdivide`,
  and it should be asserted in those terms rather than as a note count.
- **No key-relative riffs.** The numeric tone is chord-root-relative. A figure that
  ignores the harmony is a pedal and `sustain` already says it.
- **No comp voicing changes.** An operator moves comp onsets; which notes are in the
  chord stays `core/voicing.ts`'s business and is not touched.
- **Nothing in the concert renderer.** Operators produce ordinary notes and drum events
  at ordinary times; the stage reads both. Worth *checking* that a bass riff still reads
  as one player, not worth building.

---

## 9. Verification — extending `npm run genres`

Gates first, measurements after — the shape checks 1–2 of the transition plan already
established.

1. **Determinism.** Every genre × style declaring no `variation` and no numeric
   `BassTone` hashes identically to the pre-change catalogue. This is the gate on waves
   1 and 3 and nothing may move past it.
2. **The hook guarantee still holds.** The existing drum-event compare in
   [`genre-check.ts`](../src/genre-check.ts) passes unchanged — byte-identical between
   `through` and `earworm`, twenty seeds. If a variation draw ever leaks onto the running
   `rng`, this catches it.
3. **A riff is a shape.** For every style with a numeric-toned bass pattern, the
   semitone distance from each bar's chord root to each riff note is *identical in every
   bar*, across every chord quality the progression produces. This is the check that
   would have failed on `seven-riff` before §5 and is the direct statement of what the
   change is for.
4. **Variation is bounded.** No operator leaves a bar with zero bass onsets, moves a
   note off the downbeat of a bar where the chord changes, or produces two onsets on the
   same slot.
5. **Variation is audible.** Across 100 songs per opted-in style, the count of *distinct*
   bass onset-sets within a song is > 1 — the direct measurement of the thing being
   complained about, and the one that says whether any of this worked.
6. **Shots are hook-invariant directly.** Extends the transition plan's check 3 to the
   band-derived figure: the set of shot bars and their slot figures is identical at every
   hook level.
7. **Shots are not all the same.** Across the styles with `shot` enabled, the set of
   distinct shot figures is larger than the set of distinct metres. Fails loudly if §7.2
   ever regresses to the fallback.
8. **No double push.** No bar contains both an operator-anticipated onset and an elide
   target. Only meaningful once transition wave 4 exists; written here because that is
   where the invariant is decided.

---

## 10. Risks

- **The RNG reshuffle, and the checks that flap on it.** Several `npm run genres` checks
  are statistical and flip on any stream change. Namespaced streams (§6.1) are the
  mitigation and should make waves 1 and 3 byte-identical, but wave 2 moves fusion on
  purpose. Any check movement must be proven against a pristine copy of HEAD rather than
  reasoned about, because the last time this was reasoned about the answer was wrong in
  a way that took a probe to find.
- **A literal interval over a diatonic progression clashes.** `tone: 10` over a chord
  whose seventh is major is a flat seventh against a natural one, sounding a semitone
  apart. That is *what a riff is* and half the repertoire is built on it — but it is a
  real dissonance and the vertical rules will see it. Mitigation: it is opt-in per
  pattern, and the styles that want it (`fusion`, and later the synth genre) already run
  at loose strictness. If it fights the rules engine anywhere, the answer is a strictness
  exemption for numeric tones, not a softer riff.
- **Variation as noise.** A rhythm section that varies at every phrase boundary is a
  rhythm section that will not sit still. §6.3's phrase-boundary rule and the per-style
  opt-in are the mitigation, and like the transition plan's rate limit it is a guess
  meant to be listened to. Ship at low weights on two styles, listen, then widen.
- **Operators on a `cycle`d pattern.** A figure whose `cycle` is not the bar has slots
  relative to itself, not to the bar. `anticipate` takes a bar slot. Operators must
  either work in figure space or refuse a cycled pattern; refusing is the honest first
  answer and `varyPattern` sets the precedent by working on the pattern rather than on
  the events.
- **`displace` breaking harmonic clarity.** Rotating a bass figure moves the root off
  the downbeat, which is the one thing the bass is for. It is the least safe of the four
  operators and should be comp-only until something demonstrates otherwise.

---

## 11. Work breakdown

**Wave 1 — the operator layer.** `Onset`, `anticipate`, `thin`, `subdivide`, `displace`
in `generate/rhythm.ts`. **No callers.** Pure functions over the existing metric
utilities. Check 1 is the gate and it is trivially met, because nothing calls them.

**Wave 2 — the bass states a shape.** `BassTone` gains the numeric form, `generateBass`
gains one branch, and `seven-riff` is rewritten to the figure its docstring already
claims. Check 3. Only fusion moves, and the movement is the deliverable.

**Wave 3 — variation within a fixed identity.** `Style.variation`, the namespaced
streams, the phrase-boundary application, wired for bass and comp. Enabled on two styles
only. Checks 1, 4 and 5.

**Wave 4 — transitions read the band.** `ShotSource.band` and the precedence in
`shotFigures`. Checks 6 and 7.

**Wave 5 — widen.** Numeric-toned bass figures across the synth genre where they belong
most, and `variation` enabled per style after listening. This is also where
`transition-plan.md` waves 3–5 land: `break` needs nothing from here, and `elide` must
call `anticipate` and carry the §7.3 guard. Check 8.

Waves 1–3 are the ones that answer the complaint. Wave 4 is what stops the transition
plan's own wave 5 from making the problem worse, and is why the two plans interleave
rather than queue.

---

## 12. What "done" looks like

A fusion bass that plays the same shape over every chord instead of an outline that
re-negotiates with each quality. A tango whose second chorus pushes into the barline
where the first one did not, played by the same band on the same figure. A seam shot
that sounds like the tune's own rhythm section rather than like the time signature. Four
tables that have stopped each inventing their own way to say *hit here*. And every style
that has not opted in byte-for-byte what it was, with the `--hook` A/B control still
holding at every level.
