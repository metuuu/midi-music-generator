# The Backline — plan

*Plan, written 2026-07-29 and annotated through 2026-08-01. It describes what was **intended**, not what is. **Built, in annotated waves** — each wave records what it proved wrong on the way, which is the reason this file is kept. The result is on the stage; [concert.md](concert.md) is the page to trust for current behaviour. Read this for the reasoning, not as a reference.*

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

### 6.0 The clue is in the name

A modular is not one object with a fixed set of parts. It is a frame with **modules in
it**, chosen for what the band needs that year, and the whole reason it is worth staging
is that the choice is visible from the fourth row.

Today the rig fills its three rack rows from one weighted table of anonymous panels —
jacks, knobs, sliders, mixed. That is the right texture and the wrong level of meaning:
it says "a lot of hardware" and cannot say *which* hardware, so the rig cannot answer any
question the rest of the show asks it.

So the bays become named. A modular is assembled from what this number actually needs:

| Bay | Present when | What it shows |
|---|---|---|
| voice | always | oscillators, filters — the anonymous panels it has now |
| sequencer | a machine-played part (§8) | a step row, running in time |
| percussion | the drum source is a machine (§4) and this rig is the nearest | the drum machine, as a module |
| keyboard | one to three, plus one above | see §6.1 |

That is one mechanism answering three separate complaints. The drum machine gets a home
that explains it (§8.0). A sequencer gets somewhere to be that is not a second table. And
the several-keyboards idea in §6.1 stops being a special case bolted onto a synthesiser
and becomes what it always was — another kind of module in the same frame.

It also gives the rig a reason to differ between numbers, which nothing else on this
stage does: a band that sequences its bass has a sequencer bay and a band that does not,
does not, and you can see which from the audience.

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

## 7b. A genre gets a veto on gear

`rigPoolFor` keys on the year and nothing else, on the argument — borrowed from
`InstrumentBuildOptions.year`, where it is correct — that what a synthesiser *looked
like* is a fact about a decade rather than about a genre. That argument is sound and it
answers the wrong question. What an object looked like in 1968 is indeed a fact about
1968. **Whether this band owns one is a fact about the band.**

Measured: iskelmä's tanssilava era stages 14 modular systems across 30 concerts, because
`padWarm` sits in its pad palette, maps to the `synth` archetype, and 1968 offers a
modular at weight 6. A Moog System 55 at a Finnish dance pavilion, behind an accordion
player.

So the pool takes the shape the percussion source already has, which is the shape that
worked:

1. **The year gate stays hard and stays first.** No genre table can stage a DX7 in 1974.
2. **The genre or era authors the weights**, and may write zero. Iskelmä owns no modular
   in any era — a pavilion band hired a van, not a cabinet wall. Ambient and synth own
   them freely.
3. **Absent means the year's default**, so jazz and anything added later keep working
   without an entry.

The same correction applies one level down and is already half-built. `Style.boxDrums`
exists to let a style whose subject is the drummer refuse a rhythm box outright, and it
is currently set on **no style at all** — which is why a humppa comes out with a box
playing it. Humppa, jenkka, tango and valssi are dances a live band plays for people
dancing; the drummer is the point of them.

---

## 8. Machines that play themselves

This is the multiplier. A sequenced bassline, a latched drone, an arpeggiator — none of
them needs a hand at all, and that is what takes five keyboard players down to one or
two. `Track.machine` names the station that owns it and the cycle it repeats; casting
creates **no performer** for such a track, but a station must own it or it has nowhere
to stand.

### 8.0 A machine stands at somebody's right hand, on a stand built for it

**This is the third placement, and the first two were each half right.** They are worth
keeping side by side, because the second one was a correction that overshot.

**Wave 0 parked it.** A free-standing drum machine: a box on a folding table, placed
beside the nearest keyboard player, facing wherever that player faced.

- **It explained nothing.** A lone box on a table produces a full drum part. There was no
  visual account of why that table was making drum sounds, so the eye filed it as scenery
  and the percussion still arrived from nowhere — the failure the box was introduced to
  fix, relocated rather than solved.
- **It faced the wrong way.** It inherited the tender's yaw, so on a player turned 26° in
  toward the arc the panel — the only part with anything to see on it — pointed across the
  stage rather than at the room.

**Wave 1b mounted it**, on the principle that gear is mounted and not parked: the box went
on top of the keyboard rig of whoever worked it, at the back of the panel, a hand's depth
above the keys. That bought the explanation and lost the object. From six metres a
shoebox lying behind somebody's keys is *inside the keyboard's own silhouette* — the
audience sees one instrument, and the one thing they have to be able to see is a second
one being started. The mounting plate is an argument nobody in row six can read.

So: **a stand of its own, at the player's right hand.** Not the folding table again — a
purpose-built stand the size of the case, four tubes and a brace, standing where the near
end of their own keyboard is, at the height their hands already work at. Two things make
it theirs, and neither is the plate:

- **They turn and work it**, repeatedly, through the number. That is what an audience
  reads, and it is a stronger statement of ownership than any bracket.
- **It is inside their gear, not on the boards.** Two thirds of a metre from the player,
  turned in to face them. Nothing about it says "delivered here"; it says "this is the
  corner they stand in".

The exception stays. **Where there is a modular**, the machine is a percussion bay in the
cabinet alongside the oscillators. That is what a modular *is* — a set of modules chosen
for what the band needs — and a wall of modules with somebody standing at it already
reads as one instrument being operated. It covers a minority of numbers: 24 of 25 machine
numbers in iskelmä's tanssilava era have no modular on stage, 68 of 68 in its eighties
era, and 97 of 97 in ambient's sampler era. The general rule has to stand on its own legs
or it fixes almost nothing.

Two consequences follow, and both are improvements rather than costs. **`tendedBy` stops
being optional** — a machine always belongs to somebody, so there is always a hand that
can start it, which is the "cause" half of §8.1 becoming structural instead of
best-effort. And **the machine's facing is aimed at its tender**, not copied or scaled
from theirs: the player is beside the box rather than behind it, so a yaw taken from
theirs stood the case square to the house with its buttons pointing at the back wall.
Aimed at the body it comes out about a right angle to the front of the stage, tipped a
dozen degrees back toward the house by the stand sitting slightly downstage of them —
which is enough for the step lamps to read from the seats without the panel pretending
its audience is out there.

**One box per pair of hands.** Hosts are handed out in order and the list stops when they
run out; a player who already has one does not get a second. What a second bought was a
case nobody could ever be seen working — the choreographer sends one pair of hands to one
panel — standing 28 cm behind one they were, which makes the audience doubt the real one.
The same rule covers the stage with nobody on it, where every machine used to take the
same fallback point and draw two cases at one spot. The cost is a machine-played part
with no object of its own, and it falls in the right place: percussion is first in the
list and always gets a host, so what goes unstaged is a pitched sequencer figure on a
stage that has run out of people — 5 of 95 measured across the four genres.

One thing this placement forces that the mounted one let slide: **the hand has to go to
the machine.** While the box sat on the back of the same rig, a `control` point resolving
to the keyboard's own knob row landed a few centimetres from it and read as close enough.
A metre away it does not, and a hand pressing start on the wrong object is worse than no
hand at all — it is the stage asserting a cause that plainly is not one. So a `control`
point now names which machine it is on, and the show, which is the only thing that knows
where both objects ended up, tells the player's instrument where to send the hand.

### 8.0b Settled: the player stays, and the machine is theirs to work

Asked and answered, so it is not re-litigated when this wave is built.

**Nobody leaves the stage.** A machine-played part does not delete its performer. The
plan originally wanted the opposite — that was "the multiplier", five keyboard players
becoming one — and it is the wrong trade for this project. The whole proposition is that
you can watch the music being made, and buying a smaller band with more sound coming
from objects nobody is visibly working is buying the wrong thing.

**So a sequencer is a module in somebody's rig**, exactly as the drum machine now is
(§8.0), and the player standing at that rig *operates* it: starts it on the beat, stops
it, switches which loop is running, moves the filter while it runs. That is a person
playing a synthesiser — it is simply not a person playing a keyboard — and it is what
the instrument was actually for.

Two consequences for how this gets built. The `Track.machine` field still marks the part
as machine-played, because the choreographer must not write note-by-note gestures for a
line no hand is touching. But casting keeps the performer, and the choreographer gives
them **operating** gestures instead of playing ones — reaching to the panel at a section
boundary, a hand resting near the sequencer between moves.

The scope note found while checking: `counterMode: 'ostinato'` is the generator's
existing "this part is a sequencer" hook, and exactly one style uses it — synth's
`berlin`. Widening that is a separate generator decision of the same shape as
`DrumSource`, and should be treated as one rather than smuggled in.

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

### 8.3 The consequence half is built and still does not read

§8.1 has both halves shipped: the hand starts it, and the panel steps its own pattern.
Watched, it is still a box with stickers on it. So the rule was necessary and is not
sufficient, and the gap is worth naming precisely rather than answered with more lamps —
the obvious next move is a fourth lamp row, and it would buy nothing.

Three things are wrong, and only the third is interesting.

**The lamps are binary.** `voiceLit[i].visible = runner.lamp(i, now)` — full brightness,
then nothing, `FLASH` beats later. Both drawings of this machine do it: the bay in the
modular cabinet is the same runner with the same boolean. What makes that damning rather
than merely crude is what sits 20 cm away on that same cabinet. The rig's *free-running
LFO lamp* ramps — `0.12 + 2.3 * swell * swell`, squared with a comment explaining that a
filament spends most of its cycle dark and a linear ramp reads as a glow — so the file
already knows how to draw a lamp, and spends that knowledge on the one light in it that
is not reporting any music. The lamp with a musical job snaps.

Which means the fix belongs in `createMachineRunner` and not in either drawing: it hands
back a **level** rather than a boolean, and the two call sites stop being able to
disagree about what a lit lamp is.

**Velocity is passed in and dropped.** `DrumMachineOptions.events` carries it;
`createMachineRunner` maps `beat` and `voice` and throws the rest away. So a ghost note
and a downbeat kick light identically, and the panel is reporting *that* something
happened rather than *what* — which is the difference between a meter and a lamp, and
§8.1 asked for the meter.

**Nothing on this stage makes light except the lights.** This is the real one. There is
no bloom and no tone mapping in the renderer, and no instrument anywhere owns a light
source — every lamp in the show, on every rig, is an emissive material, which in this
pipeline is flat bright colour and nothing else. The machine's panel faces its tender by
construction (§8.0) and tips back about twelve degrees, so from the house the lit step is
a few pixels of brighter plastic seen at a slant.

That is the whole of "it feels like a separate system", and it is not about the panel:

> Every other object on the stage is lit by the room and therefore belongs to it. The
> machine is lit by the room and gives nothing back. An object that only receives light
> is scenery, whatever is printed on its front.

So the fix is **spill, not more lamps**: the machine puts its own light onto the case,
the stand top and the nearest hand of the person working it, brightening with the pattern
it is already running. A real light is the literal reading and may not be affordable —
`lights.ts` runs a quality tier and a punctual budget, and this would add one per machine
— so the cheap version comes first and is measured before anything is spent: an additive
card over the panel, driven by the same runner, so the lamp has a halo and the case
around it lifts. If that reads from the seats at concert distance, there is nothing to
buy.

One small thing of the same shape, in `?debug` rather than in the show: casting creates
no performer for a machine track (`if (track.machine) continue;`), so the drum part is
the only part in the evening floating over nobody's head. The label belongs on the
machine. It is minutes of work and it is the same complaint in miniature — the box
sitting outside the system that annotates everything else.

### 8.4 Nothing on this stage is plugged into anything

Wider than the machine, and the better idea. Today:

- **The singer's microphone is the only honest cable in the show** — a swinging loop off
  the clip and a static run to the boards, in `singer.ts`.
- **`cables` is a venue prop**, not a connection: three Catmull-Rom tubes between random
  floor points in a black box, joining nothing to nothing. It works because nobody looks
  at it.
- **Everything else plugs into air.** Electric guitar, electric bass, electric piano,
  organ, all three synth rigs and the rhythm box have no lead of any kind. `pa-stack` is
  a venue prop that exists in some rooms and receives nothing when it does.

A lead is the cheapest statement in the whole medium that an object is part of a system,
and the geometry is nearly free — a tube along a three-point curve, a pattern already
written twice in this codebase. Four decisions, and the first two are the ones that
decide whether this is worth doing at all.

**No amplifiers.** A combo per guitarist is the obvious version and it is a different
project: a new model, and then a new footprint in `cast.ts` — floor area, sightlines,
overlap assertions, the layout budget that §6 and §7 spent two waves getting right.
Instead **one stage box upstage**, low, with a row of jacks on it, and everything
electric runs a lead to it. A hub reads as a system. Leads vanishing into the wings read
as housekeeping, which is what the current prop already is.

**Routing is the cost, not the tube.** The existing prop gets away with spaghetti
*because* it connects nothing; the moment a lead starts at a real jack, every object it
passes through is a defect. A cable at `y = 0.03` currently has nothing stopping it
crossing the riser (0.4 m high, 2.8 × 2.0 m, upstage on the centre line), a table leg, or
a player's feet. So a route is deliberate and short — jack, drop to the deck, run upstage
in z, hub — with the riser and the playing area treated as obstacles, in the same frame
`playingArea` already describes. **A visibly wrong lead is worse than no lead**, because
the eye that was going to ignore the object now has a reason to look at it.

**Electric only.** A cello or an acoustic guitar with a lead to the back is wrong for
every era in the pool. This wants a property of the archetype, and there is already the
beginnings of one — `electronic` distinguishes the pad kit from the acoustic one.

**The machine's lead is short and goes to its owner's rig**, joining the rig's own run at
the same point on the deck rather than taking its own trip to the back. That is §8.0's
argument — *this is one person's corner* — finally said in something an audience can see,
and for the complaint that started this section it does more than any run to the wings
would. It is also the one lead here that is electrically a small lie, and worth taking:
the real box goes to the mixer.

**What this costs elsewhere.** Real leads and the random `cables` prop in one room is two
different stages at once. The prop retires, or shrinks to a taped run near the hub. Say
so before building, because it is the kind of thing that gets left in and then defended.

**Where the jack is has to come from the model**, which means widening the seam
`instruments/types.ts` deliberately keeps narrow. It passes the test `shift` passed and
`resolve` sets: it says nothing whatever about music, and it is geometry the runtime
cannot otherwise see. An optional `outlet?: Vector3` in the model's own frame, absent on
anything acoustic, and absent is the same answer as "no lead". Nothing in the interface
learns what a section is.

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
- **Amplifiers, and anything else that takes floor.** §8.4 buys the connection without
  buying a new object in the layout. The moment a guitarist has a combo behind them, the
  travel budget, the sightline assertions and the modular wall rules all have a new
  participant, and the lead — which is the whole point — is unaffected by which end it
  arrives at.
- **A mixer, a desk, or anybody at one.** The stage box is a termination, not a person.
  A visible engineer is a second stage.

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

**§8.3 and §8.4 are the first parts of this plan that the IR cannot answer.** Whether a
lamp reads at concert distance is not a property of the song, and no assertion is going
to tell anybody. That is a reason to look at it, not a reason to build something to look
at it for us. One cheap headless check earned its place anyway, and it is the only
assertion in `concert-check.ts` that reaches into the renderer:

- **No lead crosses anything solid.** ✅ Landed. `routeOnDeck` is pure geometry, so this
  costs nothing but the import. It walks the *segments* rather than the vertices, and
  that is the point: the router evicts points from obstacles in list order, so a point
  can come to rest a millimetre outside the thing it was bounced off and still have the
  straight line to its neighbour cut the corner. The runs it tests are a **superset** of
  the real ones — every player and every machine to the box, not only the electric gear
  that gets a lead — because which archetypes own an outlet is a fact about the models
  and this file has no business building twenty of them per number.

  Only crossings fail. A *dropped* run is the router obeying §8.4 where there is no gap
  to thread, and the count is printed rather than asserted so a change that quietly
  stopped drawing the cabling shows up here instead of nowhere.

The second check this section planned — "every model with an `outlet` gets exactly one
lead" — was **not built**, and the reason is worth keeping rather than quietly dropping.
It needs a dressed band, which means a rig, a stage and twenty instrument models built
per number, in a file whose every other assertion reads a data structure. That is a test
harness rather than a check, and this project does not want one. The failure it would
have caught — an electric instrument with no run — is one look at the stage.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| The stage goes still once machines play the parts. | §8.1, enforced as a release condition rather than a guideline. The verifier asserts the cause half. |
| Multi-board stations balloon `synth.ts`. | Board count is drawn 1–3 (+1 above); the keybed geometry is one function called N times, not N copies. If it does not stay small, ship §5 and §4 and stop. |
| The travel budget rejects so many crossings that extra boards go unused. | That is the correct failure and it is visible in the verifier's own numbers. If crossings are rare at real tempi, the honest conclusion is fewer boards, not a smaller budget. |
| Era weight tables drift into "everything is possible everywhere". | The year gate is hard and independent of the weights, so the worst drift produces a dull era rather than a wrong one. |
| Scope. This is four subsystems. | §12 orders them so that each stage is independently worth shipping. |
| Cabling makes the stage look *worse* — a lead through a riser leg is a defect the current spaghetti is not. | Route deliberately and check it headlessly (§10). If a route cannot be found for an instrument, it gets no lead: absent is a valid answer and an audience does not audit. |
| A light per machine costs the frame budget it was supposed to buy. | The faked glow ships first and is looked at. A real `PointLight` is only spent if the cheap one does not read, and `lights.ts` already tiers on quality. |
| "Everything is plugged in" becomes an invitation to model the whole PA. | §9 refuses amps, a desk, and an engineer by name, before anybody asks. |

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

**Wave 1 — the backline in the IR. ✅ Landed.**
`Performer.rig`, year-keyed pools with caps, `pickRig` deleted, the modular given its own
footprint and height and laid out as furniture, the L/R-or-centre staging rule, wings
re-aimed. Fixes three modulars and makes the sightline assertions honest.

Three corrections it forced, all of them to things this plan asserted confidently:

- **The wings were in front of the player, not behind.** §6.3 of this document said the
  cabinets already stood 0.87 m behind them and only the yaw was wrong. The distance was
  right and the direction was backwards — the player is at `keyBackZ − whiteLength −
  0.28`, the wings stood at `keyBackZ + 0.44`, and `+z` is downstage. The house had been
  looking at the backs of two 1.7 m cabinets. Moving them upstage also invalidated the
  patch-cable clamp, which would have dragged every lead forward onto the keyboard.
- **An availability window and a weight table can contradict each other silently.**
  `modular.to` was set to 1979 meaning "superseded", while the pool gave it weight 2
  through 1983 meaning "still in the corner". The gate wins and says nothing: 82
  concerts of the 1981 era contained no modular at all.
- **The modular's footprint was invented from the impression.** 1.7 m is what a wall of
  cabinets feels like; the object is 1.08 m from centre line to outer cabinet face, so
  1.25 is the honest radius. At 1.7 a flanking modular hung past the masking.

The `BULKY` route this plan proposed was not taken. `BULKY` is the front-line rule that
`PIANO_SIDE` owns, and a modular never reaches the front line — it is claimed by
`layoutModulars` before either the arc or the front line runs, which is a smaller change
than teaching the piano rules about a second kind of furniture.

**Wave 1b — the corrections, before anything new is built on them. ✅ Landed.**
The genre veto on rigs (§7b) so iskelmä stops staging Moog systems; `boxDrums: false` on
humppa, jenkka, tango and valssi; the free-standing drum machine replaced by a mounted
bay (§8.0). Small, and it removes three things that are visibly wrong now rather than
adding a fourth on top of them.

Two things it turned up:

- **`modular.from` was 1965 — the year the object was invented, not the year it reached
  a stage**, which is what the field means. That alone was staging a cabinet wall behind
  a 1968 jazz quintet, unreported, alongside the tanssilava case that was reported. Jazz
  keeps its 1975 modulars; fusion with a wall of Moog behind it is Hancock.
- **Fixing it emptied the 1968 pool and fired the last-resort fallback, which staged a
  polysynth two years before its own `from`** — and the verifier caught that rather than
  a person. The check was right and the window was wrong: that rig is the project's
  generic wooden-cheeked keyboard on a stand, a Minimoog in 1970 and a Farfisa before it,
  so 1963 is the honest figure. The fallback is unreachable again, which is where a last
  resort belongs.

The percussion **bay inside the modular** (§6.0) is *not* in this wave. The general
mounting rule had to land first because the bay could never have been the whole answer —
24 of 25 machine numbers in tanssilava have no modular on stage, 68 of 68 in iskelmä
eighties, 97 of 97 in ambient sampler.

**Wave 2 — machines that play themselves. ✅ Landed**, after Wave 3 and on the terms
in §8.0b: the player stays and works the machine.
`Track.machine`, no performer for a machine track, the start gesture, the stepping
lights. Cause and consequence land together or not at all. Rides on the mounting rule
from Wave 1b — a sequencer is a bay, for the same reason a drum machine is.

Four things it turned up:

- **`board.canReach` is the wrong question after a part is written.** It compares a
  candidate beat against a limb's *most recent* placement, so running it over a finished
  schedule makes every beat look like the past — it could only place a gesture after the
  final note, and cost three quarters of them.
- **A fixed brightness threshold could never fire.** A sequenced bass line's filter
  spans 0.06 across a whole number. The bar has to be relative to the range the part
  actually has.
- **`held: false` is not "has a hand free".** A drummer, harpist, cellist and mallet
  player all stand at their instruments and none could reach a sequencer.
- **100% visible causation is not reachable, and faking it would be worse.** 33 of 35
  unworked machines have a figure beginning on beat 0 — no earlier beat exists and the
  tender is playing from that downbeat. The honest reading is that the sequencer was
  already running when the lights came up. The assertion is the reachable one: every
  machine entering after bar one is visibly started.

**Wave 3 — the multi-board station and the hands. ✅ Landed.**
N keybeds on the synth model, board index on the `key` point, crossing costs, the travel
budget, synth `twoHanded` styles. The largest wave and the one most likely to be cut. By
this point the keyboards are a bay in the frame (§6.0) rather than a new kind of object.

What it turned up:

- **The boards needed a *reason*, or they were the dead upper manual again with more of
  it.** The first one was already in the file: a voicing too wide for one hand is split
  at its widest interval, and that is exactly when a player with two keyboards uses the
  second. The second reason is `twoHanded`, which is what actually drives them — usage
  went from 14-in-48 multi-board players to 23-in-62 once `stalker` had a two-handed
  part.
- **A synthesiser's left hand is a line, not a shell.** Every existing `HandSpec` comps a
  chord under the tune; half the leads this genre reaches for are monophonic and cannot.
  `voices: 2`, `melodic: true` — a bass figure, which is what those players did.
- **A wider rig moved the drum machine out of arm's reach**, caught by the Wave 1b check
  the moment wings landed. Reach is a fact about a person and does not grow with their
  equipment.
- **`canReach` and `place` clamp travel to 1**, so a board crossing cannot be charged
  more than a full-keyboard sweep. `BOARD_REACH` keeps the window where that
  under-charges narrow, but it is not zero and is worth knowing about.

**Wave 4 — the machine gets its own stand, and its player gets more to do. ✅ Landed.**
§8.0 rewritten for the third time: off the top of the keyboard, onto a purpose-built stand
at the player's right hand. Plus the two things that placement forces — a `control` point
that names *which* machine, so the hand goes to the box rather than to the panel it used
to sit on, and a panel that is dark until somebody starts it.

What it turned up:

- **"Mounted, not parked" solved the wrong half.** Wave 1b read the Wave 0 failure as
  "this object has no owner" and it was also "this object cannot be seen". Bolting the
  box behind somebody's keys answers the first and makes the second worse, because a
  keyboard's silhouette swallows it. Ownership an audience can read is a person turning
  and working the thing, not a bracket.
- **A drum machine's tender had one gesture in four minutes.** The operating gestures
  were driven off `NoteEvent.brightness`, and a drum event has none — so the whole of
  "somebody is working that box" was a single press at bar one. Section boundaries are
  already in the IR and are exactly what the front row of a rhythm box is for. Median
  panel touches per machine number went from 1 to 6.
- **The lamps were running before anybody touched the panel.** Two years of §8.1 said the
  start gesture is the cause, and the machine had been stepping from frame one regardless
  — which makes the hand arriving on the downbeat a hand pressing a button that
  demonstrably does nothing. The renderer now takes the start beat out of the
  choreography, because that is the only place it exists: `operatePart` walks a start
  backwards to wherever the player has a hand free, and the first note is not that beat.
- **The old placement flipped sides mid-band.** It went *outboard* — away from stage
  centre — which is the player's right for half the band and their left for the other
  half. Which side of somebody their own gear is on should not depend on where they
  happen to be standing.

**Wave 5 — the machine joins the room, and the room gets wired. ✅ Landed.**
§8.3 and §8.4. The first wave in this plan whose subject is the *look* rather than the
IR, which is why it is last and why it is ordered smallest-first: every step is worth
stopping after, and each one is visible on its own.

1. **The panel stops being binary.** Voice lamps decay instead of switching, and take
   `velocity`, which is already in the events and already thrown away. One file, no
   interface changes, nothing else can break. If this alone fixes it, stop here.
2. **The machine spills.** A faked additive glow over the panel on the same runner, so
   the case, the stand and the near hand lift with the pattern. Looked at before anything
   is decided about a real light. Also the `?debug` label the machine has never had.
3. **The machine's lead into its owner's rig.** One short run, no hub yet, no other
   instrument involved. This is the smallest complete answer to "it is just a box", and
   it is what says the stand and the rig are one station.
4. **`outlet` on the models, the stage box, and the rest of the leads.** The wave's real
   cost: the seam widens by one optional vector, routing gets written and checked, and
   the `cables` prop is retired or cut back. Nothing here is required by steps 1–3, and
   steps 1–3 are what the drum machine was complaining about.

The order is deliberate: 1 and 3 are hours, 2 is the one that decides whether an object
on this stage can ever look like it is on, and 4 is a stage-wide change that should not
be paid for until the first three have been seen.

What it turned up:

- **The decay belonged in the runner, not in either drawing.** Both objects that draw
  this machine held their own boolean, and putting a `level` behind the seam meant the
  box on its stand and the bay in a modular cabinet stopped being able to disagree about
  what a lit lamp is. The velocity was already being passed in and thrown away one line
  further on.
- **Routing was the whole cost of §8.4, exactly as predicted, and for an unpredicted
  reason.** Pushing a point off an obstacle is easy; the hard part is that eviction is a
  *local* move and which side to pass a group on is a *global* choice. The first version
  refused a quarter of all runs, because two players standing half a metre apart have no
  gap between them and a relaxation cannot decide to go round the pair. Seeding the same
  relaxation with a bow — straight, then one way, then the other, wider each time —
  took refusals from 89 in 335 to 3.
- **A settled route and a route that is merely outside things are different claims.** The
  guard that shipped first asked "is every point outside every obstacle", passed, and
  still produced 26 crossings: a point can come to rest a millimetre clear of the thing
  it bounced off, and the straight line to its neighbour then cuts the corner. Asking
  instead whether the last pass *moved anything* is what guarantees the full margin, and
  the margin is what leaves room for the line between the points.
- **The riser's size was written down twice the moment leads had to avoid it.** Two
  copies of `min(2.8, width * 0.32)` would have drifted the first time a riser was
  resized, silently, in the direction of a cable through a platform. `riserFootprint` now
  lives with the prop that draws it.

### Not in any wave, and worth saying so

**The hex-pad kit is already built** — Wave 0 shipped it. Hexagonal shells, flat rubber
pads, no chrome hoops, matte black, and all fourteen contacts identical to the acoustic
kit so the drummer plays exactly the same kit. It is live in iskelmä's eighties era and
both later synth eras. What it has *not* had is a pair of eyes: every check on it so far
has been headless — bounds, floor contact, contact identity, and that the surface moves
when struck. The same is true of the rhythm box and of every staging change in Wave 1.

Nothing here is blocked on looking at it. It is the cheapest remaining way to find out
that something is wrong.

---

## 13. What "done" looks like

A 1974 synth concert opens with one person walking to a wall of cabinets dead centre,
starting a rhythm box with one hand, and the number beginning because of that. A
sequencer row steps in time with a bassline nobody is touching. Their left hand holds a
drone on the lower board while their right reaches to a second keyboard for the lead,
and it only does so where the music left enough room for the hand to get there.

A 1981 number has two modulars flanking a riser with a drummer on electronic pads behind
it, and the verifier can prove no hand teleported to make any of it happen.

And the rhythm box in both of them throws a little orange onto the hand that started it,
with a lead off the back of the stand running to the same place everything else electric
on that stage is running to. Nobody in the audience notices either. They notice that the
room has one system in it instead of a band and a box.
