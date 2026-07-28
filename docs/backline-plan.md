# The Backline — plan

What gear is on the stage, who is standing behind it, and what plays itself.

This document settles the contracts for four connected changes: which synthesiser each
keyboard player is standing at, what is producing the percussion, how one player covers
more than one part, and how a machine that plays without hands stays worth looking at.

Like `concert-plan.md`, this says what is intended. When it is built it becomes
`docs/backline.md` and describes what exists.

---

## 1. The one claim

**What is on the stage is a casting decision, and casting lives in the IR.**

There is exactly one place in the pipeline where a *what is on stage* decision is made
downstream of the Performance IR, and it is
[`pickRig`](../src/web/concert/instruments/synth.ts):

```ts
if (year < POLYSYNTH_FROM) return buildModularRig;
```

A pure function of the year, evaluated independently per performer, in the renderer,
with no knowledge of the band. Every complaint this plan answers follows from that one
line:

- **Three modular walls in one concert.** Synth's `modular` era is 1974 and `cast.ts`
  records its own measurement that 90% of synth numbers carry three or more keyboards.
  Nobody counts, because nothing is in a position to count.
- **The dead upper manual.** `synth-rig-digital.ts` says it outright — *"Nothing
  resolves against them"*. The choreographer runs in `src/concert/`, which is
  browser-free and has never seen a rig, so it cannot know a second keybed exists.
- **Nothing ever touches a knob.** Same reason.

The fix is not to make `pickRig` cleverer. It is to move the decision up to where the
band is visible, record it in the IR, and let the renderer build what it is told —
which is what every other part of this project already does.

---

## 2. Two things found while investigating, which move the design

Both were assumptions worth checking, and both were wrong.

### 2.1 The drum bank is a sample library, not a statement about the stage

The obvious rule — *a rhythm-box bank means a rhythm box on stage* — does not survive
contact with the tables. Jazz's swing era (1935) draws from `AkaiMPC60`, `AlesisSR16`
and `RolandR8`. Those are sample sources standing in for a jazz kit, not machines
anybody in 1935 could have owned.

So `DrumTrack.bank` says what it *sounds* like and cannot be asked what is on the
boards. The stage needs its own field, authored per era, and it needs a year gate so no
weighting can produce an anachronism.

### 2.2 The percussion source has to be a generator decision, not a casting one

This is the correction that matters. A preset rhythm box cannot play the part
`generate/fills.ts` writes: it repeats one pattern exactly, it has no fills beyond
switching off, and it has no accents it was not built with. Choosing the box in
`cast.ts` — after the notes exist — would put a Mini Pops on stage playing a descending
tom roll into the last chorus.

So the source is decided where the part is written, it constrains how the part is
written, and casting *reads* it. Exactly the relationship `Track.voice` already has:
the generator declares it, the stage obeys it.

### 2.3 What that makes the current behaviour

The `modular` era's own description reads *"...and a preset rhythm box for a drummer"*,
its four banks are all preset boxes, and [`roster()`](../src/concert/cast.ts) stages a
human on a riser whenever `song.drums.events.length` is non-zero. **A synth-modular
concert today puts a man on a riser miming a Korg Mini Pops, playing fills it has no
buttons for.** That is a bug that exists now, independent of everything else here.

---

## 3. Decisions settled

| Question | Decision |
|---|---|
| Where is the rig chosen? | `src/concert/cast.ts`, recorded on `Performer`. The renderer builds what the IR names and chooses nothing. |
| How many modulars? | Cap of **2**, and the cap is a floor-space rule rather than a taste: see §6.2. |
| Where do they stand? | Two go back-left and back-right. One goes back-centre — and back-centre is the drum riser, so §6.2 couples this to §4. |
| Boards per modular station | 1–3 around the player, plus an optional 4th on a shelf above. Count is drawn per station, not fixed. |
| Simultaneous parts per player | **Two.** It is a hand count and no amount of geometry changes it. See §7. |
| Percussion source | A new `DrumTrack.source`, drawn in the generator from an era-weighted table behind a hard year gate. Four values, §4. |
| Machine-played parts | A new `Track.machine`. Casting stages no performer for one, but a station must own it. §8. |
| Audible patch change mid-track | **Not doing it.** §9. |
| A fourth rig file | **Not doing it.** The polysynth rig is geometrically a Minimoog. §9. |
| Determinism | Unchanged and non-negotiable. Every draw here is a namespaced `Rng` off the concert seed. |

---

## 4. Percussion — four sources, not two

The requirement is a spread that feels chosen rather than tabulated: sometimes a box,
sometimes a drummer on electronic pads, usually a drummer on a kit, and never the wrong
one for the decade.

### 4.1 The four

| Source | On stage | Can play fills? | Available from |
|---|---|---|---|
| `kit` | A drummer, acoustic kit, riser | Yes, all shapes | always |
| `electronic-kit` | A drummer, hexagonal pads, riser | Yes, all shapes | 1981 |
| `programmed` | A box on a stand. No drummer | Yes — it was programmed bar by bar | 1980 |
| `box` | A preset box on a stand. No drummer | **No.** `drop` only | 1965 |

`kit` and `electronic-kit` differ only in the model and the sound; the choreography is
identical, because a drummer playing pads is a drummer. That is what keeps
`electronic-kit` cheap — a variant of the existing kit model, not a new archetype.

`programmed` and `box` differ only in what the *part* may contain, and that difference
is the whole reason they are separate values. A TR-808 was programmed a step at a time
and can do anything a person can write; a Mini Pops has fourteen buttons on it marked
*Bossa Nova* and *Waltz*.

### 4.2 Three gates, applied in order

Weights alone would give a Rhythm Ace to a 1935 swing band one time in ten. So the draw
is gated, and the gates are what stop the table from being either rigid or silly:

1. **The year gate is hard.** A source whose `available from` is later than
   `EraProfile.year` is removed before any weighting is consulted. No era table can
   produce an anachronism, including one written later by someone who did not read this.
2. **The era weights choose among what is left.** Authored per era, and they are the
   period statement — 1974 synth is mostly `box`, 1981 synth is mostly `programmed` with
   a real drummer a third of the time, 1965 iskelmä is mostly `kit` with the occasional
   organ-and-rhythm-box duo, and every jazz era is `kit` at weight 1 and nothing else.
3. **The part gate is a veto.** `box` constrains what may then be written: one pattern
   repeated exactly, no fill shape but `drop`, no accent the preset did not have. If a
   style *requires* fills — a genre whose whole identity is the drummer's — `box` is
   struck from its pool at the style level rather than silently producing a lie.

The interesting property of gate 3 is that it runs the right way round. The machine
constrains the music; the music is never bent to match a machine that was already
chosen.

### 4.3 Two consequences that fall out

**The count-in.** `withCountIn` puts a drummer's four clicks at the front of every
number, and `concert/index.ts` already notes it is a no-op where there is no kit to
count on. A box does not count anybody in — somebody presses start. So `box` and
`programmed` suppress the count-in, and **the machine starting is the count-in**: a hand
goes to the front panel on beat zero, and the number begins because of it. That is a
better opening than four clicks and it is free.

**The riser.** No drummer means the riser is empty, which is what makes the Jarre
staging in §6.2 possible at all.

---

## 5. The backline in the IR

### 5.1 The field

`Performer` gains a rig id — `'modular' | 'polysynth' | 'digital'` to start, with room
for more. `pickRig` is deleted; `synth.ts` builds what it is handed and the year stops
being a decision at the bottom of the stack.

### 5.2 A pool with caps, not a single answer

An era publishes a weighted pool and a per-entry cap. Drawing is without replacement
until the pool is exhausted, then with replacement — so a band smaller than the pool
never shows the same rig twice, and a band larger than it degrades gracefully rather
than failing.

The modular's cap is 2. Everything else is uncapped. The 1974 pool is therefore *one or
two modulars, and polysynth rigs for everyone else* — and the polysynth rig is an honest
1974 instrument, because wooden cheeks, one row of knobs and an X-stand is a Minimoog
(1970) as much as it is a Prophet-5.

### 5.3 It has to happen before staging, not just before rendering

This is why the field cannot be a renderer lookup even in principle. A modular is 1.7 m
tall from the boards with 1.6 m of cabinets; a slab on an X-stand is 0.7 m and knee
high. `specFor('synth')` gives one footprint to both today, and the gear arc flattens it
further with `s.r = TABLE_R`. Once the rig is in the IR, footprint and silhouette height
come from the rig, and `fixSightlines` can finally see the difference between a
synthesiser you can look over and one you cannot.

---

## 6. The modular station

### 6.1 Several boards, one player

A modular station is a horseshoe: the cabinets behind, one to three keyboards around the
player, and optionally a fourth on a shelf above the first. This is the Emerson /
Wakeman / Jarre rig and it is what the era actually looked like.

What it buys is **sounds within reach** — a hand moves to a different board instead of
the sound changing under it. What it does not buy is more parts at once; see §7, which
is the constraint this section exists inside.

The cost is honest and should be stated here rather than discovered: `synth.ts` owns
exactly one keybed and `resolve` assumes it. Several boards means that model grows N
keybeds and every `key` point gains a board index. That is the largest single piece of
work in this plan.

### 6.2 Where they stand, and why the rule is not arbitrary

- **Two modulars** — back-left and back-right, outboard of the riser.
- **One modular** — back-centre.

Back-centre is the drum riser: 2.8 m wide, centred, and the drummer's box is `locked` so
the solver will never move it. So the centre position is available **exactly when there
is no drummer**, which is exactly when §4 chose `box` or `programmed`.

That is one decision seen twice rather than two rules that have to be kept in step. A
number with a rhythm box gets the wall of cabinets dead centre with one person in front
of it; a number with a drummer gets two stations flanking the riser. Both are period
photographs, and neither needed a special case.

A modular also joins `BULKY` alongside the grand piano and the harp: it is furniture,
played from behind, and far too tall to stand in a front line.

### 6.3 The wings are aimed at the wrong person

The cabinets already sit behind the player — `wingZ` is `keyBackZ + 0.44` and the player
stands at `keyBackZ − whiteLength − 0.28`, so there is about 0.87 m between them. The
complaint that they are not "at the back" is really about their *yaw*:
[synth-rig-modular.ts](../src/web/concert/instruments/synth-rig-modular.ts) aims each
wing's panel normal at the player's chest, which is correct for the player and wrong for
the room. From the house you get panel edges.

Split the aim between the player and the house camera. The patch bay — the one thing on
the rig worth looking at — turns toward the audience, and the player still has the panel
angled toward them. The file's hard rule is untouched: nothing crosses the key line, and
the arithmetic that guarantees it is re-checked at the new yaw.

---

## 7. Hands are the budget

**Two.** A station with four keyboards and one player has two hands, and no amount of
geometry changes that. Any design that assumes otherwise produces a player whose hands
teleport, which is a worse failure than the dead upper tier this plan started from.

### 7.1 Board assignment runs on a travel budget

`Gesture.prep` is beats of travel *before* the note — the whole reason the IR is
scheduled rather than reactive. A hand crossing from the lower board to one 0.3 m up and
0.2 m back needs a much larger prep than a hand sliding along one keybed. So:

- Each board pair has a **crossing cost** in beats, computed from the geometry once per
  station rather than guessed per gesture.
- A phrase may move to another board only if the gap before its first note is at least
  that cost.
- **If it does not fit, the phrase stays where it is.** The music is never rewritten to
  justify a board, and a board that cannot be reached in time is simply not used in that
  bar.

This is what makes "quickly" a measured claim instead of an aspiration, and it is the
one part of this plan that can be verified numerically — see §10.

### 7.2 Two jobs on one player already has a home

`Style.twoHanded` exists and jazz's `trio` style is built on it: it names the
instrument, says how densely the left hand speaks, and offers `LeftHandMode` including
`ostinato` with a cycle. That last one is, almost exactly, Berlin-school sequencer bass
under a right-hand lead.

So synth styles get `twoHanded` entries and the generator writes the two-job part. The
concert side then puts the two hands on two boards. Nothing new is invented; an existing
mechanism is pointed at a genre that wants it more than jazz does.

---

## 8. Machines that play themselves

This is the multiplier. A sequenced bassline, a latched drone, an arpeggiator — none of
them needs a hand at all, and that is what takes five keyboard players down to one or
two. `Track.machine` names the station that owns it and the cycle it repeats; casting
creates **no performer** for such a track, but a station must own it or it has nowhere
to stand.

### 8.1 The rule that makes it survivable

A stage where the bass and the pad are sequenced and one person noodles over the top is
historically exact and dramatically dead. The entire value of this project is that you
can watch the music being made, and a machine-played part gives that away by definition.
So:

> **Every machine-played part must have a visible cause and a visible consequence.**
> The cause: a performer starts it, on the beat, with a hand you can see. The
> consequence: the machine shows what it is playing — a sequencer row stepping in time
> with its own notes, a level lamp moving on the beat it is producing.

Take away the cause and the music starts by itself. Take away the consequence and the
part is coming from a prop. **Neither half ships without the other**, and that is a
release condition rather than a preference — a partially built version of this section
is worse than not starting it.

### 8.2 The wiring is already there

Rigs get `react(force, now)` and `update(now)` on the song clock in beats, which is what
the digital rig's LCD flicker already uses. A stepping sequencer row is the same
subscription with a different lamp. What is missing is not the animation path; it is the
IR saying which notes the machine owns.

---

## 9. What this deliberately does not do

- **An audible patch change mid-track.** `Track.instrument` and `strudelSound` are one
  value per track, and making them per-section is a generator *and* Strudel-renderer
  change. It is a different project. The honest substitute costs nothing:
  `NoteEvent.brightness` is a real, generated, section-long filter sweep that **nothing
  on stage is currently causing**. Put a hand on the filter knob tracking that ramp and
  the sound genuinely opens up while the hand is on it.
- **More than two hands.** Stated again here because every future request in this area
  will be a request to break it.
- **A fourth rig model.** The 1974 pool is served by the polysynth rig with a mono
  flavour, per §5.2.
- **Rewriting the drum generator.** §4's part gate constrains what `box` may be given;
  it does not touch how `kit` parts are written today.

---

## 10. Verification — extending `npm run concert`

Every assertion here is on the IR, so none of it needs eyes:

- No concert contains more than 2 modular rigs.
- No performer stands at a rig whose era gate excludes it; no `DrumTrack.source` is
  earlier than its `available from`.
- A `box` source contains no fill shape other than `drop`, and every bar of its pattern
  is identical to every other bar of the same section.
- A `box` or `programmed` number has no drummer in the cast, and no count-in bars.
- Every machine-played track has a station that owns it, and a start gesture on the beat
  it first sounds. *(The cause half of §8.1, asserted.)*
- Every board-crossing gesture has `prep` at least the crossing cost of the pair it
  crosses. **This is the teleport test and it is the most important one here.**
- The existing sightline and overlap assertions still pass with a 1.7 m modular in the
  cast — which they currently cannot be trusted on, because a modular has never had its
  own height.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| The stage goes still once machines play the parts. | §8.1, enforced as a release condition rather than a guideline. The verifier asserts the cause half. |
| Multi-board stations balloon `synth.ts`. | Board count is drawn 1–3 (+1 above); the keybed geometry is one function called N times, not N copies. If it does not stay small, ship §5 and §4 and stop. |
| The travel budget rejects so many crossings that extra boards go unused. | That is the correct failure and it is visible in the verifier's own numbers. If crossings are rare at real tempi, the honest conclusion is fewer boards, not a smaller budget. |
| Era weight tables drift into "everything is possible everywhere". | The year gate is hard and independent of the weights, so the worst drift produces a dull era rather than a wrong one. |
| Scope. This is four subsystems. | §12 orders them so that each stage is independently worth shipping. |

---

## 12. Work breakdown

Ordered so that every stage stands on its own and can be the last one.

**Wave 0 — the bug, on its own. ✅ Landed.**
`DrumTrack.source`, the four values, the year gate, era weights, the `box` part gate,
count-in suppression, the box prop, the electronic-kit variant. Removes a man miming a
Mini Pops. Touches the generator and casting; touches no rig.

Four things it turned up that this plan had not predicted, recorded because each was
found by measuring rather than by reading:

- **The source needs its own `Rng` stream.** Drawn from the shared one it moved every
  seed in the project and failed iskelmä's solo-arc check. Re-weighting the table to
  400:1 — which very nearly removes the box — gave *bit-identical* numbers, so nothing
  the box did mattered; the songs had moved because one number had been taken out of
  the stream in front of them.
- **The part gate is wider than "no fills".** A box also had to stop dropping to
  brushes behind a soloist and stop landing a crash on a button ending. Both were found
  by counting distinct velocities in a generated box part: three were expected, from the
  metric accent a preset pattern genuinely has, and five turned up.
- **A flat pad needs a different response from a domed head.** Dishing is `scale.y` on a
  dome; a pad's surface is a disc, and scaling zero moves nothing. The pad kit would
  have shipped with no response in it at all.
- **A machine number never names the drums as its soloist** — checked across 619 of
  them. The genres that own machines do not hand breaks to drummers, so the guard in the
  generator is belt and braces rather than load-bearing.

**Wave 1 — the backline in the IR.**
`Performer.rig`, era pools with caps, `pickRig` deleted, modular in `BULKY` with its own
footprint and height, the L/R-or-centre staging rule, wings re-aimed. Fixes three
modulars and makes the sightline assertions honest.

**Wave 2 — machines that play themselves.**
`Track.machine`, no performer for a machine track, the start gesture, the stepping
lights. Cause and consequence land together or not at all.

**Wave 3 — the multi-board station and the hands.**
N keybeds on the synth model, board index on the `key` point, crossing costs, the travel
budget, synth `twoHanded` styles. The largest wave and the one most likely to be cut.

---

## 13. What "done" looks like

A 1974 synth concert opens with one person walking to a wall of cabinets dead centre,
starting a rhythm box with one hand, and the number beginning because of that. A
sequencer row steps in time with a bassline nobody is touching. Their left hand holds a
drone on the lower board while their right reaches to a second keyboard for the lead,
and it only does so where the music left enough room for the hand to get there.

A 1981 number has two modulars flanking a riser with a drummer on electronic pads behind
it, and the verifier can prove no hand teleported to make any of it happen.
