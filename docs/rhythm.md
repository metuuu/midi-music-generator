# Rhythm

**What the rhythm section plays, how it stopped being one bar repeated a hundred times, and what a figure learned to say that a list of slot indices could not.**

```bash
npm run gen -- -n 8 --genre iskelma --style tango
npm run gen -- -n 8 --genre hiphop --style trap      # a written roll
npm run gen -- -n 8 --genre arabic --style maqsum    # a kit that never arrives
npm run genres          # the assertions this page describes
```

The catalogue underneath all of it is **19 genres, 389 styles and 72 eras**, and the rhythm section's share is **951 drum patterns** — 103 carrying a `cycle`, 1 naming a `cycles` per voice instead, 184 writing `ghosts`, 10 writing `rolls`. Those are the numbers on this page most likely to have moved by the time you read it; the count script is four lines over `GENRES` and re-running it is cheaper than trusting them. It said 1,005 for a while, and **1,005 was correct when it was written** — the 54 placeholder drum tables were deleted one commit later, each a single row that existed only so the draw would not throw, and 1,005 − 54 is 951. The re-measurement that caught it guessed at a double count, which is the more natural suspicion and the wrong one. Worth separating, because *falsified by a later commit* and *always wrong* call for different things: the first means re-run the number, the second means distrust how it was taken. Everywhere else below, where a number would only record how many styles have opted into something, this page names the mechanism instead — because **absent means no draw** is the property that makes the count uninteresting, and it is the same property in nine separate features.

The melody made this move years ago: `melodyCells` used to be played literally and now feeds a compositional engine as *statistics*. The bass, comp and drum tables never did. They were the notes, drawn once per song at [`song.ts`](../src/generate/song.ts) and applied to every bar — so the bass rhythm of a hundred-bar song was one bar, a hundred times, with only the pitches moving underneath.

[`rhythm-plan.md`](rhythm-plan.md) is the plan that fixed that, and its §13 is the record of where the implementation disagreed with it. What follows is what exists. The plan's five waves all landed; five more mechanisms have arrived since, and all five are about the same thing from a different side — **what a figure is allowed to state about itself** rather than what the engine is allowed to do to it.

## 1. A bass may state a shape

`BassTone` was six *chord functions* — `root`, `fifth`, `third`, `seventh`, `octave`, `approach`. Each asks the chord what note to play, so `seventh` is +11 over a `maj9` and +10 over a `min11`. Right for a walking line, which is outlining the chord it stands on. Wrong for a riff, which is a shape.

**A number is semitones from the chord root, taken literally**, negative for below:

```ts
{ name: 'seven-riff', weight: 6, hits: [
  { at: 0,  dur: 3, tone: 0,  vel: 0.98 },   // root
  { at: 4,  dur: 3, tone: 0,  vel: 0.86 },
  { at: 8,  dur: 3, tone: 7,  vel: 0.9  },   // fifth, fixed
  { at: 12, dur: 2, tone: -2, vel: 0.8  },   // flat seventh, fixed
] },
```

Fusion's table claimed *"a shape, re-rooted every time the harmony moves"* in prose and could not say it in data; its vamps run through `bIImaj9` and `bVImaj9`, so the figure was a semitone out in a third of the bars it played. `-2` rather than `10` is the correction the implementation forced and it is worth keeping in view: what the old spelling actually sounded was `nearestPc(♭7, root + 2)`, which resolves *below*, so spelling the fix upward would have moved 14.9% of fusion's bass notes where the bug accounted for 4.2%. A faithful repair is not the same as an obviously-correct one.

**This page used to say two figures in the catalogue were written this way.** That sentence was true on the day it shipped, when fusion was the only mover and `cosmic/driving-quarters` the only volunteer. It is now **477 bass patterns across 178 styles in fifteen genres** — reggae's whole bass vocabulary, funk's, latin's, metal's, hiphop's — because every genre written since has taken the numeric form as the *default* spelling for a riff and reached for the six names only when it wanted a walk or an oom-pah. The six names were never wrong; they were being asked a question they are not the answer to, and fifteen authors independently agreed once they had the choice.

The root is *placed* rather than clamped: `clampToRange` applied to the top of a shape folds two notes onto one pitch, which keeps every pitch class and destroys the figure. `spanOf` measures the figure's reach and `placeRoot` finds it a home, through the same helper the authoring-time check uses — a second copy of that arithmetic is two spellings of one figure with two behaviours, which is the fault that cost 57 figures in nine genres.

## 2. One vocabulary of operators

`BassPattern.hits`, `CompPattern.hits`, `DrumPattern.voices` and `Style.shots` are four authoring surfaces answering one question — *what onsets does this style hit?* [`generate/rhythm.ts`](../src/generate/rhythm.ts) carries a vocabulary over those onsets:

| operator | what it does |
|---|---|
| `anticipate` | push one attack early and hold it through where it was |
| `thin` | drop the onsets the ear expects least, by `metricStrength` |
| `subdivide` | split one attack into two of half the length |

All three are **total and payload-preserving**: they take a figure and return a figure, return the input unchanged when what was asked for will not fit, and never invent an onset carrying something the caller did not already have. A caller never has to check first, and a chain of them degrades to identity rather than to nonsense.

**Not a library of figures**, and that line is load-bearing. `style/feel.ts` states the rule — *a proposal that needs its own bass figure is a style* — and a shared bank of named patterns is the style table again under a better name, ending with every genre reaching for the same twelve figures. An operator has no figures in it, so a tango's push is the tango's own pattern pushed.

A whole *attack* moves, not one note of it: ambient's `drone-octave` sounds a root and an octave on the same slot, and pushing one of them turns a dyad into two strikes an eighth apart. `subdivide` splits an attack or none of it, for the same reason.

`thin` is metric rather than positional, which is the whole improvement over the every-other-hit thinning `varyPattern` had been doing to the drummer's hand: "every other" only coincides with "the weak ones" when the figure is regular, and handed a `groups` this thins a 2+2+3 the way somebody counting it would. It also never leaves a hole — the strongest onset survives any threshold — which is a rule `varyPattern` learned the hard way, because halving a waltz's three-quarter ride is not a sparser hand.

A fourth operator, `displace`, was written and **deleted rather than shipped**. It never found a caller and the reason is that it already had one: `CompingProfile.displace` displaces a comp figure per bar, refuses the downbeat — *"a stab pushed onto beat one is not a displaced comp, it is a different figure"* — and checks the slot is free first. The operator was a strictly worse duplicate with no occupancy guard, kept alive only by the check exercising it.

## 3. Variation within a fixed identity

The band's identity stays fixed for the song — the patterns are still drawn once, and a band that changed its comping figure every eight bars would sound like a compilation. What varies is how that identity is *played*, which is what the drummer has had all along through `planKitVariation`.

```ts
// on Style
vary?: Partial<Record<'bass' | 'comp', number>>;
```

One gesture is drawn per section per layer — a `push` or a `fill` — and lands at a **phrase end, never the section's last bar**, which belongs to the drummer's fill and to the seam. Three gestures in one bar is not an arrangement.

How long a phrase is comes from `phraseBars`, off the section's own length, rather than from a constant four. That generalisation is worth more than it looks: every multiple of four returns four, so nothing that phrases in fours moves, and measured over 7,435 sections generated across the nineteen genres **every section that can currently reach the function is a multiple of four**. Forcing `vary` on for every style in every genre and generating the same 760 songs, `figureFor` fires 81,720 times and exactly one line of the tally moves — the 60 variations landing in six-bar sections go from bar four to bar three, off the middle of the section and onto its midpoint. So the change removed a fault that was *latent*, and the measurement is the only thing that can see it. That is the argument for doing it while nothing is standing on it.

Three refusals fall out of one clause each, rather than out of three guards:

- **A four-bar intro gets nothing**, because one phrase has no phrase end inside it. A two-bar section gets nothing for the same reason at a different length, and a section length no phrase divides gets nothing because its only candidate is again the last bar.
- **A cycled pattern is never varied.** Its slots are relative to the figure rather than the bar, and drifting against the bar is the point of it.
- **`fill` is refused on an arpeggio.** `generateComp` carries its ladder index across the barline on purpose, so one added onset would re-index every later bar — a different part from there on rather than a gesture. `push` preserves the onset count and is safe on anything.

The gesture also declines the downbeat and anything below `metricStrength` 2: pushing bar one's first note means writing into the bar before it, which is composition across a barline and not this function's business.

**Adoption has moved a long way and the mechanism is why that was safe.** Six styles of twenty-nine carried a `vary` when this shipped; it is now 37 styles across seven genres, most of them rock, where a rhythm section leaning into the fourth bar of a phrase is the idiom rather than a decoration on it. A style that declares no `vary` constructs no `Rng` and draws no number, so every one of those enablings was additive by construction and none of them can have moved anybody else's songs.

## 4. A seam shot comes from the band

`shotFigures` used to derive from the metre alone: the group heads, and the heads with the last anticipated. That is exactly right in an asymmetric bar and generic everywhere else — a tango, a foksi, a bossa and a swing are all 4/4 with no `groups`, so all four would hit the same two figures.

`ShotSource.band` carries the onsets the drawn bass and comp patterns are already playing, thinned until it is a shot rather than the part: a rhythm section's pattern is four to eight onsets and a shot is two to four, so `bandHeads` raises the `thin` threshold until the figure fits and returns nothing rather than a bad figure when the band has fewer than two onsets to offer. Precedence is `shots` table → band → metre, each a stronger statement about this style than the one after it.

The size of what that buys is not a number worth re-quoting, because one side of it is fixed by arithmetic. An ungrouped 4/4 has strength 4 on slot 0 and 3 on slot 8 and nothing else at or above a group head, so `metreHeads` returns `[0, 8]` and the pushed variant `[0, 6]` — **two figures, and it can never be more**, for every style in that metre for as long as the metre is all it is asked. When the mechanism shipped the same bar offered 25 distinct figures from the band, and the interesting property is not the 25 but that it is bounded below by the number of distinct patterns the catalogue writes rather than by the number of distinct metres.

Fusion itself is unchanged by that, because its band figure thins to `[0, 4, 8]` — exactly its own group heads. The two agreeing is a good sign about the fallback and is why fusion was the right style to ship the mechanism on.

The kit is allowed to play it because the pattern draws are **hook-invariant by construction** — they happen before `hookRng` exists and before the section loop, and the running stream inside that loop is deliberately kept aligned across hook levels.

A shot is one of four things that can happen at a join, and the drummer's fill is still overwhelmingly the answer: measured over 6,710 seams in 760 songs spanning the nineteen genres, **88.6% are a fill, 5.5% a shot, 3.2% an elide and 2.7% a break.**

## 5. A figure may write its own ghosts

`DrumPattern.ghosts` is a parallel per-slot map beside `voices` — the strokes this figure plays *under* the level of the ones above, in the same sixteenths.

A ghost note is most of what separates a played groove from a grid with a snare on it, and in a breakbeat, an amen break or a boom-bap kit it is a large fraction of what is actually heard. The funk author hit the absence and wrote it into a `breakbeat` header rather than reaching for a feel: *"a break is made of ghost notes at a third of the level of the accents, and a `DrumPattern` carries slot indices with no velocity column"*.

**Why here, when `Feel.ghost` already exists.** They answer different questions. A feel saying *this section is ghosted* is a claim about **how** the band plays; a figure saying *this pattern has ghosts on the e and the a* is a claim about **what** it plays. `Feel` is scoped so that it cannot make the second claim — genre-neutral, drawn per section, probabilistic, and only where its layer is already silent — and something drawn sometimes cannot be the thing a style is recognised by.

**Why a second slot list and not a velocity column**, which is the more interesting half. A ghost is a *category* rather than a point on a continuum: drummers play strokes and they play ghosts. And a number in a table would add a fourth owner to a question that already has three — the metre through `accentOf` and `metricStrength`, the section through `intensity`, the performance through `Feel.accent` — and it would outrank all three in every song, which is a mix decision wearing a figure's clothes. So the field says one thing only: *these are the ghosts.* How loud stays the engine's business at `GHOST_LEVEL`, 0.28 of the stroke it stands beside, so a ghosted stroke still accents with the metre, thins with a quiet section and leans with the feel.

**It composes with the drawn pass by spending it, and no line of `applyFeel` was needed to arrange that.** A written ghost is an ordinary event on the kit by the time that pass runs, and the pass already has the guards: it never places a ghost where the snare is sounding, and it ghosts the *odd* sixteenths either side of a backbeat — which is where ghosts live and therefore where a table writes them. So the two are drawn from one set, and writing one spends it. A figure ghosting both sides of its backbeat absorbs the drawn ghosting entirely; one ghosting only the e leaves the a, which is a feel completing a pair rather than crowding one. The level rule stacks on top, because a drawn ghost is 0.22 of the *mean snare velocity in its own bar* and written ghosts are part of that mean.

Measured on jazz's `seven-straight` with `funk` forced on every section over 60 seeds and 7,543 bars, writing both sides drops the drawn ghosting around the backbeat by **94%**, and all 301 survivors are in bars where the figure is not the thing playing — 75 in a section's last bar where the fill has cleared the pattern's tail, 226 in a drum-solo chorus. Nothing was ever drawn onto an occupied slot, and nothing landed a sixteenth from a written ghost, in any run.

The residual is named rather than hidden: a ghost written on an *even* sixteenth, where the drawn pass would never have put one, does open its two odd neighbours. What lands there comes out at 0.105 against the written stroke's 0.183 — a shadow under it rather than a second one beside it.

Ghosts read exactly like `voices`: same cycle, same clearing where a fill lands, carried through `varyPattern` so a hand that thins or moves to the ride takes its ghosts with it. A slot both struck and ghosted on one voice is struck, because one hand cannot hit one drum twice at once. The preset rhythm box plays none of them, joining the list that already takes away its fill, its drum solo, its intensity response and its hand.

184 patterns write a ghost row and they are concentrated where the idiom is: house, dnb, hiphop, rnb and pop, and nowhere else.

## 6. …and may write inside one stroke

`DrumPattern.rolls` is the same shape a second time — slot index to how many even strokes fill it — so `{ hh: { 15: 3 } }` is the last sixteenth of the bar struck three times inside itself.

The report came with the arithmetic attached: **at 140 BPM a written sixteenth is 107 ms and the roll wants 36.** `trap`'s own table still records the compromise this replaces, a comment reading *"the slow roll"* over a row of eighths and four consecutive sixteenths, which is the nearest a sixteenth grid can come and is not the gesture.

**Why it had to be a statement rather than a float**, which is `DrumEvent.roll`'s argument and the most useful thing in either docstring. `beat` is a plain float and always has been, so three onsets 36 ms apart were *expressible* here before the field existed — and nothing could **read** them. Every consumer of a drum part collapses a slot on purpose: `render/strudel.ts` places strokes with `slotOf` and rounds to the nearest sixteenth, `drumDynamics` says outright that two strokes on one slot sound as one, and `concert/choreograph.ts` buckets on `quantise(beat)` and would deal three onsets to two sticks and a foot. None of that is a bug. **Two events a hair apart on one voice is a collision, and absorbing collisions is what those three passes are for** — so a roll, which is not a collision, has to be *stated* by the one object that knows which it is. That is `NoteBend`'s shape a layer down and for the same reason: a glide is a field on the note saying *this note travels*, because the second note is exactly what the field absorbs.

The unit is the grid's own, so `roll: 3` is a triplet inside a sixteenth and `roll: 2` a pair of 32nds. A duration in beats would let a roll outlive its slot and sound under the stroke after it — two events editing one moment, which is how the double-swing bug happened. A rate in hertz would make the gesture a property of the clock, so one table would come out as a different figure at the top and bottom of a style's tempo range.

**A number per slot here, where `ghosts` refused one, and the two are consistent.** The test `ghosts` applies is *does this outrank an existing owner*. Level has three owners; **subdivision has none** — `metricStrength` says how strong a slot is and not how divided, `intensity` scales a velocity, `Feel` leans and ghosts and drags, and `KitVariation` thins and re-aims a row without ever splitting one of its hits. A count written here usurps nobody. The half still refused is the one `ghosts` refused: every stroke of a roll is the velocity of the stroke it subdivides, no taper and no second number, which is also what the gesture *is* — a trap roll is one step retriggered, and hiphop's own table had already observed that eleven of its styles write no ghost row because they are *"drawn into a machine a step at a time, and a step has one velocity"*.

**Nobody's hand ever receives one**, and that is a rule rather than a gap. Rolls are read only where `DrumTrack.source` is `programmed`. A preset `box` is refused on the grounds that already cost it the fill, the solo and the ghosts; a `kit` or `electronic-kit` is refused because there are hands on it, and the number that settles it was written two subsystems away for something else entirely — `REPEAT_SECONDS.floor` in the choreographer is **50 ms**, the physical limit between two strokes of one hand, and it is that short only because the second half of a double is the stick's own rebound. A roll of three at 140 BPM asks for 36 ms of it, indefinitely, and `BURST_SECONDS` puts the sustainable rate at eight strokes a second against this twenty-eight. So the stage and the audition agree because a rolled stroke is structurally unable to reach a staged pair of hands, and `npm run genres` asserts it from the other end.

A style may therefore write rolls and hear them in some songs and not others, exactly as it draws a kit in some songs and a machine in others. That is the era table doing its job rather than the field failing. Ten patterns write one — hiphop's `trap` and `drill`, dnb's `jungle`, `drumfunk` and `breakcore` — over 24 slots and 57 strokes, and they are carried through `varyPattern` with the hand they belong to: a hand moving from the hat to the ride takes its rolls, and a hand thinning to eighths drops the rolls on the hits it dropped.

## 7. Whose hands are on it

The kit was hard-coded, in four places, and the fault it produced was mostly *silence* rather than noise — which is why it outlived the ones that were audible.

`STATION_OF` in [`concert/instruments.ts`](../src/concert/instruments.ts) answers *which object does this voice need*, in three tiers:

| tier | voices | needs |
|---|---|---|
| `kit` | `bd sd rim hh oh lt mt ht cr rd` | a drum kit |
| `hand` | `lp mp hp` | a hand drum |
| `either` | `cp sh tb perc cb` | whoever is standing there |

**The `either` tier is the load-bearing part.** Tambourine, clap, shaker, woodblock and cowbell exist at both stations because they do in life: the kit carries a tambourine on the hi-hat rod and the percussionist has a riq on a stand. With two tiers, every `maqsum` pattern — hand strokes plus a riq on `tb` — would have conscripted a full acoustic kit, and the picture would be a drummer sitting behind five drums and three cymbals playing a tambourine on the quarter notes. The tier is also the one a sampled rack is allowed to settle, because a rack naming `tb` has said which of the two tambourines this number means.

`drumStations` is the single seam casting, choreography, the solo generator, the seam vocabulary and `npm run genres` all read, so the sound and the picture cannot come apart over whose tambourine it is. The kit has first claim on an auxiliary piece — a third of the tables that write hand voices write kit voices in the same bar, and those are not one player choosing an instrument, they are two people. A part with nothing but auxiliary voices gets a kit, which is the truth rather than a fallback: a jazz brush part is `sh` and nothing else, and brushes are played on a snare drum. Exactly one style in the catalogue is in that position, latin's `joropo`.

Three tables then say what each station does with a gesture, and they are deliberately three rather than one:

- **`SeamOrchestration`** ([`fills.ts`](../src/generate/fills.ts)) — what plays a fill. **Six of the seven `FillShape`s are about a drum rather than about a kit** and come across intact: `ht`→`mt`→`lt` is three drums in a row and `hp`→`mp`→`lp` is three places on one head. `cymbal` is the one kit-only shape, and rather than mime it with a slap — the same onsets and none of the reason for them — the `ride` field is simply absent where nothing rings. Two fields are worth reading for the argument rather than the value: `weight` is the accent under a figure and is *not* read by the kick exemption, because that exemption is about a **foot** and a hand drummer has no such limb; and `survives` is a crash on a kit and **nothing at all on a skin**, because sparing a struck cymbal needs the marking to be a different object from the timekeeping, and on one head it is not.
- **`HandStation`** ([`parts.ts`](../src/generate/parts.ts)) — what a hand keeps time on. `keeps` is not a list of the busy voices. On a kit it is the cymbals and brushes and it excludes the kick, snare and toms, because thinning a backbeat is not a drummer varying a groove, it is a second band. At a hand station the same sentence picks out **the pieces on the stand and never the drum**: take alternate strokes out of a tīntāl theka and the result is not a sparser tīntāl, it is not tīntāl.
- **`KitVariation`** — what the varying actually is: thin the hand by half, move it to another surface, open one or two of its hits. `thin` is a flag rather than a density because halving is uniformly the right answer — sixteenths to eighths, eighths to quarters, and a swung ride of `[0, 6, 8, 14]` to `[0, 8]`, which is the sparse version of each and in every case the one a drummer actually drops to. `open` is one object rather than two fields so that "set both or neither" has nowhere left to break.

**The measurement is what decided `keeps`, not taste.** Over the 54 hand tables, a row of four or more auxiliary strokes is evenly spaced **40 times out of 50**; a row of four or more strokes on the skin is evenly spaced **39 times out of 129**, and averages 3.2 strokes against the auxiliary's 5.2. The piece on the stand is a subdivision layer and the drum is a figure, in four genres written by four authors who never discussed it.

So **22 of the 54 hand tables get a hand and 32 do not**, and the 32 are the finding rather than the shortfall: every indian theka, every finnfolk frame drum, reggae's nyabinghi — one drum with nothing beside it, and nothing whose removal leaves the rhythm's name intact. A kit table reaches the same dead end often enough to need no special pleading; `waltz-light` rides three quarters over a bar of twelve and the hand-finder has always declined to thin it.

**And no station but the kit has a loud gesture.** `lift` is optional because the kit is the only object in the catalogue with anything to lift *to*. What a riq player at full tilt actually does is play harder and add strokes, which is the one direction this mechanism cannot go — it removes and re-aims, it never adds. A hand station therefore thins in the quiet sections and does nothing in the loud ones, which is one honest gesture rather than three approximated.

The fault this closed was large and had two halves. The noisy half: across the catalogue at 40 songs a genre, 88 songs came out on a style table with no kit in it and **1,804 kit-tier strokes were written into 55 of them anyway** — arabic was 32 of its 34, every one wheeling a full acoustic kit onto the stage to play a crash. That is now zero. The silent half was worse and no check could see it: the old hand-finder needed its winner *present*, and a table of `lp mp hp tb` has none of `rd sh hh oh` in it, so **all 54 hand tables played one figure from the first bar to the last** while every kit style in the catalogue got a verse thinner than its chorus. A check that counts wrong strokes cannot see a gesture that never happened.

Every field of the kit tables holds the literal the old code named, in the order it named it, so no draw moved. Measured over 10,760 songs — every genre by every style by eight seeds across five seed families — **34 styles changed and all 34 are hand-table styles**. Not one style with a kit in its table moved a single drum event.

## 8. Layers leave, and come back

Two mechanisms, at two scales, and neither is a volume rule.

`Style.drops` is whether this band drops out **mid-section**, drawn once per song: `none`, `dub` or `breakdown`. It is the one thing the engine could not say at any granularity shorter than a section — *this layer stops for these four bars and comes back*. `excludeLayers` is all-or-nothing for the whole catalogue entry and `Chart`'s ordinal is an ordinal over sections and should stay one, so a dub had to be approximated with a seam `break`, a filter ramp and a mood's `restraint`, and a drop in a dance record was simply unavailable.

It is **style-level with no genre half**, which is not the seam `feels` and `transitions` take. A palette of fills or seams is a claim about how a band in this idiom plays and travels across every style in it; a drop is a claim about *what one piece is made of*, and reggae contains `nyabinghi`, which a dub would vandalise.

`dropBars` is the sibling `drops` needs for the same reason `transitions` needs `breakCarrier`: a palette names the vocabulary and there is one thing about the gesture it cannot say, which here is how long a phrase is in this music. It is **read, never drawn** — no weight, no table, no stream — because the shipped four-bar shapes need three phrases inside one section and therefore a section of twelve bars or more. Opting styles in one at a time over 200 songs each: reggae's `dub` places one in 200 of 200 and jazz's `bebop` in 200 of 200, both on sixteen-bar forms, and **funk's `minneapolis` places none in 200**, because every section it builds is eight bars long. A style writing `drops` and getting silence would be the exact failure this project keeps finding — a table that looks like it is working — so an eight-bar style writes `dropBars: 2` and gets the gesture at the scale its own phrases are in. 29 styles across reggae, funk, house and dnb have asked.

`Chart.exits` is the other scale: the ordinal at which a colour layer **stops sounding**, in the same units as `enters`. The two together make `playing` a window rather than a threshold, and the single comparison it replaced — `ordinal >= enters`, true forever once true at all — is why the engine could build an arrangement and could not strip one. Taking the colour away for the song's last statement is the commoner gesture of the two.

Two of its rules are worth reading, because both were found by measurement rather than foreseen. **The closing edge is only fitted to a section that states the tune**: dropping back is a gesture *about* the melody, and thinness is audible because there is still something to be thin behind. A bridge has no tune in it, and in one kantele piece — where the bass plays eight notes in three minutes — the un-gated version left a bridge with nothing sounding in it at all. One silent section in 2,800 songs, which is one too many, because a section is a claim that something happens. And **a layer that holds back is never taken**: entering at the second chorus and leaving before the last is a player hired for the middle of the song, and forbidding the pair also makes `enters[l] < exits[l]` true by construction rather than by assertion.

## 9. The bar, and the clock

Four fields describe the metre and they interact, which is the part worth stating in one place.

`beatsPerBar` is quarter-note beats, fractional where the metre is written in eighths. `beatUnit` says which note value gets the beat. `groups` says how the bar divides in sixteenths where it does not divide evenly, and 55 styles declare one. `metricStrength` reads all three and is the function almost everything else asks: it decides where a melody puts its long notes, where a cadence may land, which notes the constraint engine defends, how hard a kit voice hits, what `thin` drops and what a metre-derived shot is made of.

**Compound time works, and the document that said it did not was wrong.** `beatsPerBar: 6` with `beatUnit: 8` and `groups: [6, 6, 6, 6]` is a literal 12/8 — twenty-four sixteenths in four dotted-quarter groups — and `timeSignature` recovers the numerator by asking how many `beatUnit`s fit, so a `.mid` header says `12/8`. Nothing was built and nothing needed to be: `metricStrength` already reads `groups`, already declines to look for quarter-note beats inside a group that is not a whole number of quarters, and already puts strength 3 on each of the four dotted quarters. Classical's `nocturne` and `lacrimosa` have been shipping in exactly this metre since **2026-08-03**, two days before the files whose authors wrote *cannot* were created. Rnb's `doowop` and `deepsoul` are converted and shipping in it too; nine further styles are in its half-length form, `3/8` grouped `[6, 6]`, across indian, arabic, classical, metal, latin and rnb.

The reason `swing` looked equivalent, and the one number that says it is not: `applySwing` delays the second eighth of each beat and touches nothing else, so at `0.33` it lands that eighth **1.4 ms** from a true compound third in `doowop`. For a table playing *two* notes to the beat the equivalence is real. The gap is the **middle** triplet, which no value of `swing` reaches at all because `swing` is not applied to the sixteenths: it wants 270.3 ms and the nearest a sixteenth grid offers is 202.7 — **67.6 ms early**. A doo-wop piano plays all three.

**`metricStrength` returns 4 for slot 0 before it consults `groups`**, and a group head only ever earns 3. That is still true at every metre, with or without a grouping, and it is now recorded as a taste rather than a gap. A masurkka's weight is on beat two and finnish folk did it in velocities instead — then withdrew the complaint in its own prose, on the grounds that a mazurka is recognised by what the band plays and not by where the barline is drawn. The obvious second reporter turns out not to be one: reggae's one drop is the same musical shape, accent on three with slot 0 deliberately empty, and it solves the whole thing in its tables without mentioning `metricStrength` once. By this project's own bar — *found independently by two or more genres* — that makes it a taste. The honest framing for anyone reviving it is not *slot 0 is hard-coded* but *a style cannot say which slot is its strongest*.

**`SongMeta.tempo` is a `TempoMap`**: a list of `(beat, bpm)` breakpoints where the tempo is the bpm of the last breakpoint at or before the beat, and it does **not** interpolate. That was the one real decision in the feature. Linear interpolation is what a DAW's tempo lane draws and it makes beats-to-seconds a logarithm — exact on paper, and written out twice in TypeScript it is two functions that agree to fourteen digits and disagree at the fifteenth. Worse, **MIDI cannot express it**: a set-tempo event is a step, so a ramp in a `.mid` is already a staircase and every DAW that draws a smooth line exports one. Piecewise constant is the only shape both renderers, the clock and the reports can implement identically without arithmetic they can disagree about, and the staircase is not a compromise once the steps are placed where `generate/tempo.ts` places them: at bar lines, one bpm a step. A band accelerating into a chorus changes speed at the bar line too.

`meta.bpm` is unchanged and keeps its old meaning — **the tempo the band counts off**, not the mean, because a `.mid` header, a showbill line and the audition's `setcpm` all put that figure in front of somebody as *the tempo of this music* and the mean of an accelerando is a speed nobody would recognise. Anything that needs to be right about *when a beat happens* goes through `songTempo` and `secondsAt`. The map is always present in the reader and usually absent in the data, which is the same asymmetry `feels`, `transitions` and `drops` make.

One style names a `tempoRamp`: dnb's `breakcore`, which draws a real map on 44 of 200 songs. The other 388 take the early return and serialise byte-for-byte to what they were.

**A kit may hold two clocks.** `DrumPattern.cycle` used to be one number for the whole pattern, so a drummer with hands on the bar and feet on a seven — djent, and the whole point of djent — needed the kick on a cycle of 7 while the snare stayed on 16, *and that is two patterns*. `DrumPattern.cycles` is a length per voice and overrides `cycle` for the rows it names, which is `ghosts` and `rolls` a third time: a `Partial<Record<DrumVoice, …>>` beside `voices`, read off the same slot indices, carried through `varyPattern` with the hand. The implementation is one expression in the row loop `generateDrums` already walks — `figure.cycles?.[voice] ?? figure.cycle ?? slotsPerBar` — because the loop was already per voice and only the number it was handed was not.

The three things `cycle` leaves bar-shaped stay bar-shaped, and one of them is load-bearing here: `accentOf` reads `slot % slotsPerBar`, so a drifting kick takes the weight of wherever in the bar it lands instead of carrying its own downbeat around. Metal's `djent` is the one adopter — `bd: [0, 3]` on `cycles: { bd: 7 }` under a 4/4 backbeat — and the row it replaced, `bd: [0, 3, 7, 10, 14]`, was that same seven written out for one bar and restarted at the barline. So bar one is unchanged and bar two onward drifts, coming home at bar seven where the guitar does. **37 of 37 kick onsets land on a guitar onset, against 35 of 40 before**; the five that used to miss were the barline reset.

Of the 103 patterns carrying a `cycle`, only **9 land in more than one place in the bar** — the other 94 are `cycle: 32`, a two-bar figure. **Seven of the nine are named after a single voice**, and what each did about it is the argument for the field: `dotted-hat` and `hat-against-four` write `hh` and no other row, so a section drawing one plays hats with no kick and no snare (`dotted-hat` is 6 of 18 in dnb's `halftime`); `ride-drift` and `hat-against-five` are a ride and a hat with no drum in the pattern; `walking-percussion`, `twelve-perc` and `twentyfour-perc` each drag a `bd` onto the percussion's clock. Only `drift-kit` and `drift-backbeat` say *kit* and mean it. Deleting the rest of the kit to drift one row of it is what a whole-kit `cycle` cost. All nine are left alone.

## 10. Feel, and the swing it cannot reach

A `Feel` is drawn per section and **modifies, it never authors** — no pattern banks, no note choices, no harmony, no layers added or dropped. Six of them exist: `straight`, `pocket`, `funk`, `halftime`, `driving`, `laidback`. `straight` is a real entry with every field absent rather than `undefined`, because a style's table has to be able to *say* straight: a humppa naming `straight` alone is making a statement about humppa and should read differently from a style that has not been asked.

`Style.swing` is the shuffle between the two halves of a beat, resolved once per span and handed to both passes that need it — assembly finds its offbeats by testing the fraction against exactly 0.5, so a note `applyFeel` has pushed off the grid is no longer found, and both passes therefore have to agree about what the swing *is*.

**And it is the eighth that swings.** New jack swing shuffles the **sixteenth**, which is a different subdivision and is the genre's name; rnb wrote `0.16` as "the nearest honest object" and recorded in the same breath that it is not the thing. From the same author and adjacent to it: there is **no per-stroke timing offset**. The `laidback` feel pushes a whole layer by one amount, and `offgrid`'s actual gesture is the second backbeat dragging *further* than the first, approximated with slot displacement, which is audibly a different thing. Both are open — [`engine-gaps.md`](engine-gaps.md) §3.18 — and both are the shape of a real gap rather than a taste, because the style is named after the thing that cannot be said.

87 of the 389 styles carry a `feels` table, in ten of the nineteen genres, and the widest names four entries. Six feels applied liberally across the catalogue would make everything sound like the same band, so the library grew and the *enabling* did not: every table is a decision about one style, made once, with the reason written beside it.

## The one rule

**Every per-section draw comes from its own namespaced stream.** `${seed}:vary:bass:${s}`, never the running `rng`.

This is not tidiness. Taken from the shared stream a single number moves every song in every genre — the `drumSource` note in `song.ts` records a `npm run genres` check dropping from 66% to 59% that way, and the probe that settled it showed the songs moving because a draw had been *consumed*, not because it mattered. Re-weighting the table from 8:2 to 400:1 produced bit-identical numbers; nothing the box did mattered.

Worse, the running stream inside the section loop is hook-aligned on purpose — `pickProgression` is drawn and thrown away rather than skipped — so a draw taken from it would make drum events depend on the tune and break the `--hook` A/B guarantee. `applyFeel` learned the same lesson more sharply: a per-section stream shared with the band walks the bass first, the bass follows the tune, and the tune is exactly what `--hook` moves.

A style that declares no `vary` constructs no `Rng` and draws no number, and the same sentence is true of `feels`, `drops`, `transitions`, `tempoRamp` and `drums:source`. **`[['none', 1]]` is a different statement from absence** — a band that has been asked and declined — and it generates the same music while taking a number out of a stream a style with no table never opens at all. That distinction is what has let nine features ship additively into a catalogue of 389 styles.

## What it costs

- **A literal interval can clash.** `tone: -2` over a chord whose seventh is major is a semitone apart. That is what a riff is, and it is opt-in per pattern.
- **A gesture is invisible from outside.** `hitTogether`'s tutti and `landEnding`'s button also rewrite a bass bar, so *where* a variation landed cannot be asserted from a finished song — from outside, three mechanisms produce one indistinguishable symptom. The placement assertion runs against `generateBass` and `generateComp` directly, on a synthetic section, where only one thing can have moved anything.
- **Transitions edit last.** Any check comparing two songs that differ in one axis must hold the seams out, or it will blame the axis for the transition's edit. `withoutSeams` in `genre-check.ts` is that hold-out, arrived at after four checks failed exactly that way — and filtering the edited bars instead is not merely harder, it is impossible: an elide before one chorus and not another moves that chorus's first note *out of its own span*, so no per-section filter can be symmetric between the two songs being compared.
- **A written roll is heard in some songs and not others**, because `DrumTrack.source` is drawn from the era table. That is the era table working, not the field failing.
- **A hand station has no loud gesture.** It thins in the quiet sections and does nothing in the loud ones.

## Known limitations

- **`swing` cannot swing the sixteenth**, and a style named after doing so has to approximate. `engine-gaps.md` §3.18.
- **No per-stroke timing offset.** A feel pushes a whole layer by one number; a backbeat that drags further than the one before it is not expressible.
- **A `Style` holds one `beatsPerBar`.** A style whose repertoire is genuinely two metres — pop's `girlgroup`, half straight-four Blaine figure and half compound — has to pick. This is the same shape as the sama'i, and it is worth more than a compound-time mechanism would have been, because compound time already works.
- **A cycled pattern is never varied**, and a `walking` bass ignores variation entirely — `generateBass` returns before it reads one.
- **The numeric tone is chord-root-relative.** A figure that ignores the harmony is a pedal, and `sustain` already says that.
- **No rubato.** A feel's `push` is a fixed offset per layer, not a phrase that stretches and gives the time back; classical left `feels` absent rather than approximate it.

## What the plan asked for, and what landed

All five waves of [`rhythm-plan.md`](rhythm-plan.md) shipped, and its §13 is the honest record of the three corrections the implementation forced — `Style.vary` rather than `variation`, the interval spelled `-2` rather than `10`, and `fill` refused on an arpeggio. Two further things came out of building it that the plan had not seen: the double-push guard §7.3 asked for is **structurally unnecessary**, because an elide moves the arriving downbeat into the departing section's last bar and `figureFor` already refuses to vary that bar for an unrelated reason; and `anchor: 'inside'` was not the one-field change it predicted, because the fill veto had to learn to read the anchor or a seam aimed two bars early would arrive on silence — a failure invisible to any check that counts shots.

The plan's own closing list said what was left, and it has been overtaken twice over. `vary` reaches 37 styles rather than two, the `shot` palettes are on across iskelmä, six jazz styles and two synth styles, and `elide` calls `anticipate` as §7.3 required. What the plan never anticipated is the direction the last five sections of this page describe: it argued about what the *engine* should be allowed to do to a figure, and everything since has been about what a *figure* should be allowed to say about itself — its ghosts, its rolls, the instrument it needs, when it leaves and how the bar underneath it is counted. Those are the same argument, and the plan's rule for settling it holds in both directions: **a proposal that needs its own figure is a style.**
