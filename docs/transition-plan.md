# Transitions — plan

What happens at the seam between two sections, and what the band does about it.

This document settles the contracts for one change: giving the whole band a vocabulary
for arriving somewhere, where today only the drummer has one.

Like `feel-plan.md` and `backline-plan.md`, this says what is intended. When it is built
it becomes `docs/transitions.md` and describes what exists.

It depends on `feel-plan.md` for the span machinery (§5.3 there) and should land after
its wave 3. It is otherwise independent, and neither plan needs the other to be correct.

---

## 1. The one claim

**The drummer transitions. The band cuts.**

Everything that marks a section boundary today is either the kit or a step change. The
fill machinery in [`generate/fills.ts`](../src/generate/fills.ts) is good and is not the
problem — seven shapes including `drop`, a per-genre and per-style palette, and a size
scaled by the *arrival* rather than the departure, which is the correct musical claim
and is stated in the file. `landing()` puts a crash on the next downbeat.

Everything else switches instantaneously at the barline. Layers change, level changes,
the progression changes, sometimes the key. No other instrument is *doing* anything
about the join — bass, comp, pad and brass simply stop playing one thing and start
playing another, and a listener hears the arrangement change rather than arrive.

The gesture that would fix this is already in the file, and is deliberately kept away
from the seam. See §2.

---

## 2. `hitTogether` exists, and both things wrong with it are on purpose

[`song.ts:1210`](../src/generate/song.ts):

> *The whole band on one figure, for a bar.*
>
> *Nothing in this project could say **everybody hit this together** — the shout chorus,
> the tutti break, the bar where the rhythm section stops keeping time and plays the
> tune's rhythm instead. It is one of the loudest signals there is that a piece was
> arranged rather than assembled.*

That is the gesture. Its constraints, all of them live today:

- `chorus` or `outro` only, and only after the section has been stated once
- 45% chance, capped at one per section
- **bass and comp only** — no pad, no brass, no drums
- anchored at bar 0 or `bars − 2`, i.e. **inside** the section, never at the join
- the figure is the section's own hook

Two of those are what stop it being the gesture this plan wants, and only one of them is
a musical decision.

### 2.1 The drummer is excluded to protect a tooling guarantee

The comment says so outright:

> *The drummer does not join, and that is a deliberate cost. The figure comes from the
> tune, so a kit that caught it would change with the tune — and `--hook` is documented
> as an A/B control that leaves form, key, tempo, instruments and drums alone at every
> level. **Drums catching kicks is exactly what would make this gesture land hardest**,
> and it is not worth turning the repetition axis back into a reroll to get it.*

The guarantee is real and asserted, not aspirational. [`genre-check.ts:679`](../src/genre-check.ts):

```ts
&& JSON.stringify(a.drums.events) === JSON.stringify(b.drums.events)
```

Twenty seeds, `through` versus `earworm`, drum events compared **byte for byte**. So the
constraint is precise and it is not "drums may not join a band figure". It is:

> **A drum event may not be derived from anything that changes with `--hook`.**

The tune changes with hook. A figure that does not come from the tune is free to have
the kit on it. That is the whole of §5, and it is the crux of this plan.

### 2.2 The seam is sealed against composition, and that is a good reason with a narrow scope

Two places forbid writing across a section join:

- [`tune/tune.ts:169`](../src/tune/tune.ts) — *"A section's tune starts inside its
  section."* Pickup onsets before bar 0 are filtered out at the seam, and the reason is
  measured: the previous section's answering line was written without knowing the note
  would arrive, and three counter notes in 377 overlaps came out doubling the tune at
  the octave.
- [`song.ts:852`](../src/generate/song.ts) — *"Only the lead layer may write backwards
  across the section join."* `pickupBeats` is 1 for a solo lead and 0 for everyone else,
  because *"a comp or bass pickup… sounds on top of a chord that is still ringing and
  **nothing downstream would clear it**."*

Both are correct. Both are about **composition** — a generator writing notes into bars
that belong to a section it cannot see. Neither is about **editing**, and that
distinction is what makes this plan tractable. See §4.

---

## 3. Decisions settled

1. **A transition is a post-pass over the assembled song, not a compositional change.**
   No part generator learns about seams. See §4.
2. **`fill` becomes one entry in a transition palette**, so today's behaviour is the
   identity case and an un-opted-in style is bit-identical.
3. **Kinds are `fill`, `shot`, `break`, `elide`.** Four, and §7 says why there is no
   fifth yet.
4. **A shot's figure never comes from the tune.** It comes from a style table, or from
   the metre where the table is absent. This is what lets the kit join. See §5.
5. **One transition per seam.** The kinds are mutually exclusive at a given boundary; a
   fill and a shot in the same bar is two arrangements fighting.
6. **Mid-section anchoring is the same object with a different anchor**, and it
   subsumes `hitTogether` rather than sitting beside it. See §8.
7. **Ambient declares none, and the machinery must let it.** Same standing
   `drumFills: false` already has.

---

## 4. The design that makes this cheap: edit at assembly, do not compose at the seam

The section loop pushes each section's notes into `byLayer` in **absolute beats**, and
the assembly at [`song.ts:1287`](../src/generate/song.ts) sees the whole song per layer
in one coordinate space. Drums likewise accumulate into one `drumEvents` array before
[`song.ts:1615`](../src/generate/song.ts).

So by the time assembly runs, **both sides of every seam are in the same array**, and a
pass over them is ordinary array editing. It needs no knowledge of sections beyond their
start bars, which `Song.sections` already carries.

That is the whole trick, and it dissolves §2.2 rather than arguing with it:

| | composition across the seam | editing across the seam |
| --- | --- | --- |
| what it is | a generator writing notes into a neighbouring section's bars | moving, deleting or replacing notes that already exist |
| what clears the overlap | nothing — the documented objection | the note's own neighbour, via the trim that already runs |
| is it blocked | yes, correctly | no, and it never was |

All four kinds are expressible as edits:

- **`fill`** — already an edit, inside `generateDrums`. Unchanged.
- **`shot`** — replace what every layer holds in the last bar with a shared figure.
  `hitTogether` is already this function ([`song.ts:2046`](../src/generate/song.ts)); it
  takes pitches from what the part was already playing, so a chord stays a chord and a
  bass line stays one note. It needs a caller at the seam and a drum arm.
- **`break`** — delete events in a span from every layer but one.
- **`elide`** — move the first onset of each layer at the seam **backwards** by an
  eighth, and clip the note it lands on.

None of them writes a note that was not going to exist.

### 4.1 Where in the order it runs

Extending the order set out in `feel-plan.md` §5.6, transitions are step 6 — after
everything, including swing:

```
1. SHAPES + progression      what the section is
2. Voice multipliers          what tune gets composed
3. part generation            the notes
4. applyFeel                  rhythm-section timing and articulation
5. applyDynamics + swell      the section's level
--- section loop ends, byLayer holds the song ---
6. applySwing                 the grid
7. applyTransitions           the seams
```

**After swing, and this is not arbitrary.** An `elide` lands its anticipation on an
eighth, and in a swung style the eighth is not where the grid says it is. Computing the
target before swing puts the band's push a triplet away from where the drummer's is,
which sounds like a mistake rather than like a push. Running last, the pass reads the
actual sounding grid and moves onto it.

The one cost: velocities have already been scaled by `applyDynamics`, so a shot's accent
is applied on top of the section's level rather than underneath it. That is the right
way round — a shot is an accent, not a level — but it has to be capped, because
`intensity` is allowed above 1.0 on a final chorus and a boost on top of that clips.

---

## 5. The figure, and why it is the crux

A shot needs a rhythm everyone plays. Where it comes from decides whether the kit can
join, which decides whether the gesture works at all (§2.1).

### 5.1 Not the tune

Ruled out by the hook guarantee, and by taste. Even setting the assertion aside, the
tune-derived figure is why `hitTogether` reads as *the band catching the melody* — a
real and different gesture, worth keeping (see §8), and not what a fusion break is. A
fusion break is the rhythm section's own figure, and the horn plays over it or stops.

### 5.2 A style table, with the metre as the fallback

```ts
// on Style
/**
 * Figures the whole band hits together, in sixteenth slots from the top of the
 * bar, weighted. `[[0, 6, 10], 3]` is the anticipated-two shot every dance band
 * in this catalogue has played.
 *
 * Absent means derived from `groups` and `metricStrength` — the group heads,
 * with the last one anticipated by an eighth. Serviceable everywhere and exactly
 * right in an asymmetric metre, where a 2+2+3 shot on slots 0, 4, 8 is the whole
 * character of the bar and no generic table would find it.
 */
shots?: (readonly [number[], number])[];
```

The fallback is the same argument `Voice.accents` already makes about itself
([`tune/types.ts:350`](../src/tune/types.ts)) — *"Absent means derived from
`syncopation` and the metre — serviceable, and the reason the whole catalogue does not
have to be authored before anything can be heard."* Authoring eighteen styles' shot
tables before a single one can be heard is how this does not get built.

Both sources are **hook-invariant by construction**: a table is static, and `groups` and
`metricStrength` are properties of the metre. The kit may join.

### 5.3 Which layers play it

Every layer that is sounding, including drums, **except** the one carrying the tune when
the transition is a `break` — a break with nobody over it is a gap.

Drums play the figure on kick and snare, keep the crash for the landing, and drop the
ride and hats for its duration. That is what a drummer does and it falls out of
`hitTogether`'s existing "one onset's worth per hit" rule without a special case.

---

## 6. Who gets one, and how often

The established shape, matching `FillPalette` exactly:

```ts
export type TransitionKind = 'fill' | 'shot' | 'break' | 'elide';
export type TransitionPalette = (readonly [TransitionKind, number])[];

// Genre default, style override. The default is today's behaviour:
export const DEFAULT_TRANSITIONS: TransitionPalette = [['fill', 1]];
```

A style that says nothing draws `fill` at weight 1, which is what happens today, and
nothing moves.

### 6.1 What each genre wants

The answers are not uniform and the differences are the point:

| genre | palette | why |
| --- | --- | --- |
| **jazz** — `fusion`, `bebop`, `swing`, `blues` | `fill` 5, `shot` 3, `break` 2, `elide` 2 | Shots, breaks and stop-time are native vocabulary. Fusion is the case that prompted this. |
| **jazz** — `ballad`, `bossa`, `modal` | `fill` 8, `elide` 1 | A ballad does not break. A modal tune arriving with a tutti shot has stopped being modal. |
| **iskelmä** | `fill` 6, `shot` 2, `elide` 2 | Not a jazz import: the tango's drag into the downbeat and the humppa tutti stop are the same two gestures, and this is the genre most built on them. |
| **synth** — `berlin`, `machine` | `fill` 1 | A sequencer does not do band shots. The existing `boxDrums: false` and `canVary(drumSource)` gates are the precedent, and they apply unchanged. |
| **synth** — `cinematic`, `cosmic` | `fill` 4, `elide` 1 | An arrival exists in this music; a break does not. |
| **ambient** | none | `drumFills: false` already says it: *"the idiom's whole proposition is that sections arrive without being announced."* A shot in an ambient piece is the loudest possible wrong answer. |

### 6.2 Rate limiting

The failure mode is novelty music, and it arrives fast. Three rules:

- **At most one non-`fill` transition per four seams**, counted across the song.
- **Never at the first seam.** A break before the listener knows what is being broken is
  a stumble.
- **`break` and `elide` only into a section already stated once**, same reasoning
  `hitTogether` already uses: the gesture is a comment on something known.

Drawn from `new Rng(`${seed}:transition:${s}`)` — its own namespace, so a style with an
empty palette draws nothing and every existing song is unchanged. The lesson is recorded
at [`song.ts:390`](../src/generate/song.ts) and cost a `npm run genres` check the last
time it was learned.

---

## 7. What this deliberately does not do

- **No `turnaround`.** The harmonic transition — a ii–V or a bVII sitting in the last
  bar to lean into the next section — is the obvious fifth kind and it is **blocked**.
  Harmonic rhythm is one chord per bar (`feel-plan.md` §7.0), so a turnaround can only
  be a whole bar, which is a progression edit rather than a transition. Revisit if that
  plan is ever written.
- **No tempo gesture.** A ritardando into a section is real and this generator has one
  tempo for the whole song.
- **No new notes.** Every kind moves, deletes or re-times something that already
  existed. A transition that *added* material would need to know the harmony, the
  register plan and the voicing, which is a part generator.
- **No cross-seam composition.** §2.2 stands. This plan routes around it rather than
  relaxing it, and the two constraints there should stay exactly as they are.
- **Nothing in the concert renderer.** A shot is notes and drum events; the stage reads
  both. Worth *checking* that a whole-band stop reads as a whole-band stop — the
  choreographer derives gestures from onsets — but not worth building.

---

## 8. `hitTogether`, kept and generalised

The existing mid-section tutti is a **different gesture** from a transition shot, and
both are worth having:

|  | figure from | anchor | drums |
| --- | --- | --- | --- |
| `hitTogether` today | the section's hook | inside a late chorus | no, and cannot |
| `shot` | the style, or the metre | a seam | yes |

*The band catching the tune* and *the band playing its own figure* are two things a real
group does, and collapsing them loses one. So `hitTogether` the **function** is reused
by both — it already does exactly the right thing with pitches — while the two callers
stay separate, keep their own figure sources, and keep their own drum answer.

The user-facing request *"this could happen just in the middle also"* is therefore
already half-satisfied and gets the rest of the way by letting a `shot` anchor mid-section
too: `anchor: 'seam' | 'inside'` on the drawn transition, `inside` placed at the same
bar-0-or-`bars − 2` positions `hitTogether` already uses. One field, no new machinery.

---

## 9. Verification — extending `npm run genres`

The first two are gates rather than measurements, and both already exist in some form:

1. **The hook guarantee still holds.** The existing assertion at
   [`genre-check.ts:679`](../src/genre-check.ts) must keep passing unchanged — drum
   events byte-identical between `through` and `earworm`, twenty seeds. If a shot's
   figure ever leaks from the tune, this is what catches it, and it will catch it
   immediately.
2. **Determinism.** Every genre × style with an empty transition palette hashes
   identically to the pre-change catalogue.
3. **Shots are hook-invariant directly.** Stronger and more diagnostic than 1: for a
   style with `shot` in its palette, the set of shot bars and their slot figures is
   identical at every hook level. Fails loudly at the source rather than three layers
   downstream in a JSON compare.
4. **Ambient announces nothing.** No ambient song contains a shot, break or elide, and
   its crash count stays zero.
5. **A box does not break.** A song whose `drumSource` is `box` gets `fill` only.
6. **Elide moves nothing far.** Every note moved by an elide moves by exactly one
   sounding eighth, never past the onset before it, and never across a seam where
   `section.transpose` differs — see §10.
7. **A break leaves someone playing.** Every `break` span has at least one sounding
   layer.
8. **Rate.** Across 100 songs per genre, non-`fill` transitions occur at under 25% of
   seams, and never at the first one.

---

## 10. Risks

- **Elide across a key change.** The moved note belongs to the *new* section's harmony
  and now sounds over the *old* section's last chord. That is precisely what an
  anticipation is and it is correct within a key — but over the final chorus's
  semitone lift it is a semitone clash arriving unprepared, on the loudest bar of the
  song. **Rule: no elide into a section whose `transpose` differs from its
  predecessor's.** Cheap, and the alternative is the worst-sounding bar in the
  catalogue.
- **Double-shifting against swing.** Covered by running last (§4.1), and worth a check
  because the failure is a band pushing a triplet away from its own drummer, which
  reads as sloppiness rather than as a bug.
- **Velocity clipping.** `intensity` may exceed 1.0 on a final chorus and a shot adds on
  top. Cap at 1.0 and accept the compression; the alternative is scaling the whole
  section down to make room, which loses the build.
- **Novelty music.** §6.2 is the mitigation and it is a guess. Ship with `shot` enabled
  on `fusion` alone, listen to twenty songs, then widen.
- **`break` versus `layersFor`.** A break silences layers for a bar; `layersFor` already
  decides which layers exist. If a break lands in a section that is already thin, it is
  a silence rather than a gesture. Require at least three sounding layers before drawing
  one.

---

## 11. Work breakdown

**Wave 1 — structure, no behaviour change.** `TransitionKind`, `TransitionPalette`,
`DEFAULT_TRANSITIONS`, the per-seam draw from its own stream, and `applyTransitions` at
assembly implementing `fill` only by delegating to what already happens. Checks 1 and 2
are the gate. Nothing may move.

**Wave 2 — `shot`.** The `Style.shots` table plus the metre-derived fallback, the drum
arm of `hitTogether`, seam anchoring. Enabled on `fusion` only. Checks 3 and 5.

**Wave 3 — `break`.** Stop-time, the three-layer floor, the lead exemption. Checks 7
and 8.

**Wave 4 — `elide`.** The seam-crosser: post-swing onset move with the key-change guard.
Check 6. Last of the four because it is the only one that touches notes on both sides of
a join, and the easiest to get subtly wrong.

**Wave 5 — widen and generalise.** The genre palettes from §6.1, and `anchor: 'inside'`
so a shot can land mid-section alongside the existing tutti.

Waves 1–2 are the ones worth doing first; 3–5 are refinements and can be reordered by
what sounds worst after listening to wave 2.

---

## 12. What "done" looks like

A fusion tune where the band stops keeping time for a bar, hits a figure in 2+2+3
together with the drummer, and the next section comes out of it. A tango that leans into
its chorus instead of starting it. An ambient piece where none of this can happen and
nothing in the code had to be asked twice. And a catalogue where every song that did not
opt in is byte-for-byte what it was, with the hook A/B control still holding at every
level.
