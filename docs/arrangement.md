# Arrangement, rhythm and the motto

What the band decides *before* a pitch is chosen, and what happens to the pitches afterwards. Every stage here exists because the generator's output was measurably correct and audibly wrong, and almost every one of the faults responsible was invisible to a check that looks at the melody as a line.

The order below runs from the largest unit down to the smallest and back out again: first what is decided once for the whole song — how many sections there are, how fast they go, and who plays in them — then the vertical, the rhythm and the tune, then the layers that answer the tune, and last what happens at the joins between sections and in the final bar. That is roughly, but not exactly, the order the code runs in; where a pass has to run somewhere surprising, the section says so and says why.

## The form

`buildForm` in [`generate/song.ts`](../src/generate/song.ts) draws a template from `genre.forms` and then argues with it until the piece is about as long as the genre said it should be. It is the only function in the engine that decides how many sections there are, and it does it with two loops that pull in opposite directions.

Before either runs, two rewrites. A style built on a fixed chorus length — `chorusBars: 12`, the blues — replaces the eight-bar units the templates are written in, and any bridge the template contributed folds back into a verse, because a twelve-bar blues has no bridge: every chorus is the same twelve bars. Intros and outros keep their own length through both, because a four-bar intro is a four-bar intro in any form. And where a style has *not* fixed its chorus length and a bar lasts under a second and a half — a fast waltz, a bebop head — every step that is not an intro or an outro **doubles**, rather than the form growing more sections: an eight-bar section at that speed is gone in eight seconds, a form padded out to fit is one no band would play, and a fast 3/4 phrases in sixteens anyway.

Then: grow while the piece is under 82% of its target, trim while it is over 125%. Growing prefers to add another *consecutive* solo where the form already blows, up to `MAX_SOLOS = 4`, because that is what taking a second chorus means and alternating solo and head reads as indecision; failing that it inserts a verse and a chorus as a pair. `MAX_SECTIONS = 14` caps it. Trimming takes from the middle only — never index 0, which is the intro, and never index 1, which is the opening statement of the head — because a song that begins on a bridge or a solo is not a shorter song, it is a broken one.

**The trim has a floor of five steps and it is a real limit rather than a formality.** [`engine-gaps.md`](engine-gaps.md) §4 records what it costs: the shortest piece finnfolk can generate runs a little over four minutes, which is too long for a lament. No genre is blocked outright — finnfolk ships, and writes around it.

### A function that never existed

That entry named `growForm` for months, and **there has never been a function of that name in this repo**. It is `buildForm`, and the floor is a literal `steps.length > 5` inside it; a second citation of the same ghost had been sitting in `generate/tempo.ts`. Nobody was misled into a bug, because a document cannot break a build — which is exactly the problem. The only failure mode available to a file like this one is *being false*, and a false name survives indefinitely because nothing ever calls it.

### How long a phrase is, and where that number comes from

`PHRASE_BARS = 4` in [`generate/parts.ts`](../src/generate/parts.ts) is a preference rather than a fact, and the measurement says so plainly. Over all **649 form steps in the nineteen genres**: 375 are eight bars, 135 sixteen, 100 four, 25 thirty-two, one twenty-four, and **thirteen are not a multiple of four** — nine six-bar steps and four two-bar ones, every one of them indian, whose unit is four to eight bars where every other genre's is eight to sixteen.

So `phraseBars` derives it instead: the longest phrase no longer than four that the section actually divides into. Four wherever four divides it, three in a six-bar section, two in a two-bar one. A phrase-end gesture is a boundary marker and its whole meaning is that the ear was already arriving somewhere; a gesture on bar four of a six-bar section marks nothing, because bar four is not a boundary of anything. Longest rather than shortest, because a phrase end is meant to be rare — six divides by two as well as by three, and in twos it would fire twice inside a six-bar section instead of once on the section's own midpoint.

Both awkward lengths are answered by a clause that was already there. `figureFor` declines the section's last bar, so a two-bar section gets nothing (its only phrase end *is* its last bar) and so does a section no phrase divides. That is the same sentence the file already wrote about a four-bar intro — one phrase, no phrase end inside it — arriving at a different length.

**The blast radius was measured rather than argued.** Every multiple of four returns four, so nothing that phrases in fours moves: 760 songs across the nineteen genres, MIDI and Strudel hashed either side of the change, all 760 byte-identical. Forcing `vary` on for every style to make the latent fault reachable, `figureFor` fires 81,720 times and exactly one line of the tally moves — the 60 variations landing in six-bar sections go from bar four to bar three. That is the argument for deriving it now rather than later: the fault is reachable only through a table edit, and it is cheaper to remove while nothing is standing on it.

## The tempo is a map

`bpm` was a range drawn once per song and used as a scalar everywhere after, and it was the largest open blocker in [`engine-gaps.md`](engine-gaps.md) by blast radius. `SongMeta.tempo` is a `TempoMap` now — a list of breakpoints, piecewise constant — and `meta.bpm` has taken the only honest reading left to it: **the tempo the band counts off**.

The alternative was the mean, and it was rejected on what a reader does with the number. A `.mid` header, a showbill line and the audition's `setcpm` all put that figure in front of somebody as *the tempo of this music*, and the mean of an accelerando is a speed the band plays for one bar in the middle and nobody would recognise. The count-off is the speed the piece is in for its whole first phrase. Anything that needs to be right about *when a beat happens* goes through `songTempo`, which fabricates the one-entry map where the field is absent.

Two shapes and an identity, in [`generate/tempo.ts`](../src/generate/tempo.ts). `accelerando` is linear and small — the dance-band shape, a polska getting faster because the room is, and nobody in the band deciding to do it. `gathering` is squared and large — the qawwāli shape, where the acceleration is structural and the structure is that *the opening is patient*: a linear climb is already a quarter faster a quarter of the way in, which is exactly what a qawwāli spends its first section not doing. Squared puts a sixteenth of the rise at the quarter mark and half of it in the last third.

Three details carry more weight than the curves:

- **The breakpoints are bar lines**, because that is where a band changes speed. Nobody accelerates through the third beat of a bar; a player leans on a downbeat and the next bar is quicker, and a section leader's whole vocabulary for this is *from the top of the next*.
- **The resolution is one whole bpm**, which is the smallest step MIDI can carry back unchanged — 113 does not reappear in a tempo lane as 113.40003. The musical consequence is the better one: a point is emitted only where the *rounded* tempo moves, so the map is as long as the ramp is **big** rather than as long as the piece. A gentle push across a hundred bars is a dozen breakpoints, each about one percent and each landing on a downbeat, which is under the threshold at which a step is heard as a step and over the threshold at which a hundred of them are heard as a ramp.
- **The ordering knot is cut rather than untied.** `buildForm` divides by the tempo to fit the genre's duration, and the ramp is defined over the form `buildForm` produces. So the shape is drawn first, `buildForm` is handed one number, and the map is realised afterwards. That number is `effectiveBpm`, the **harmonic** mean of the curve, because what adds up over a piece is seconds per bar and that is the reciprocal of tempo — a bar at 60 and a bar at 120 average 80, not 90. The arithmetic mean would leave a rising piece short by a smaller amount and would still be wrong.

**This is the project's first shipping-only feature, and that is the interesting part of it.** MIDI carries a tempo map natively and exactly. Strudel's tempo is one global number per pattern, so the audition plays a ramping piece flat and says so in a banner rather than pretending. Every other gesture in this document is audible in the tool used to judge it; this one is audible only in the file that ships, which is why the ritardando below was refused on the same grounds.

**Adoption is one style, and the refusals are worth more than the adoption.** House and dnb were the two genres the feature was expected to serve, and both declined it — independently, for the same stated reason: *a record whose tempo moves cannot be beatmatched*. House names no palette across its 24 styles; dnb names one, `breakcore`, at one draw in four. Measured over 760 songs sampled evenly across the nineteen genres, exactly one carries a `meta.tempo`. The other 388 styles never open the `${seed}:tempo` stream at all, which is the property the whole wave was judged on.

## The chart

Every device that makes this engine sound arranged existed before [`generate/chart.ts`](../src/generate/chart.ts) did — a phrase handed from the lead to the second horn, a line in thirds under the tune, the whole rhythm section catching the hook for a bar. Each was an independent coin flip taken fresh in every section, and that produced two faults at once, opposite in direction and identical in cause.

**Inside a song, nothing held.** Over 400 jazz numbers with more than one chorus, the answering line was present in some choruses and absent from others in 55% of them, and the brass in 48% — against 0% for the comp, the pad and the tune, which are all drawn once and stay drawn. The same eight bars came back with the same melody, the same changes and the same comping, and the horn section had wandered off. That is not sparseness; it is an arrangement forgetting itself between one chorus and the next.

**Across songs, everything was the same.** Six devices at roughly even odds apiece means every number gets about half of them, so no number is *about* any of them. A piece where two horns state the head together and never trade is a different piece from one built on trading, and rolling both at 50% produces neither — it produces the average of the two, once per song, forever.

So the chart is drawn before a note is written, and it says two things. **Which layers play, per section *kind*** — not per section, so a repeat is a repeat. And **which devices this arrangement is built from**, as a small subset; most songs get two, and the ones not drawn do not fire at reduced probability, they do not fire. A device once drawn is *placed* rather than re-rolled: `tradeAt` names the chorus the hand-over happens in, because a surprise that arrives on schedule four times is a texture.

One detail there is easy to miss and does a lot of work. A draw that lands on a device this band cannot play is **spent** rather than redirected. Drawing only from what is available quietly hands an absent device's odds to whatever is left, and the smaller the band the worse it gets — measured that way, `tutti` landed in 46% of jazz numbers against 20% for everything else, purely because it is the one device needing neither horns nor an answering line. A quartet with no second horn does not compensate by hitting more figures together; it plays a plainer arrangement, and the plainness is the point.

### `exits`, and why a window is not a threshold

`enters` says a layer holds back and arrives — the horns coming in on the second chorus, one of the oldest gestures there is and previously inexpressible. It was also the *wrong direction to have on its own*. `playing()` compared an ordinal against one threshold, and a threshold once passed is passed for the rest of the song, so an arrangement could escalate and could not strip. **A last verse that drops back to the tune and the rhythm section is the commonest arrangement gesture in popular music of any kind**, commoner by a distance than the one that could be said.

Nobody reported this. Fourteen genres were written against a chart that only builds, and fourteen authors wrote arrangements that only build — which is the useful part, because a missing direction does not present itself as a wall. It simply never comes up.

`Chart.exits` sits beside `enters` in the same units, and `playing()` is a window rather than a threshold. Four things make it safe:

- **The ordinal is placed, not drawn.** The chart is told the form's own section counts, and each layer leaves at the last section of whichever tune-bearing kind it appears in most. A blind draw from 1..3 would land past the end of a short form as often as not, and where it landed it would mean *the layer played the opening and vanished* as readily as *the layer sat out the last one* — two different pieces of music from one number. Because the count taken is the largest of those, no kind can lose more than its final occurrence, and an intro or an outro stated once has no last time to sit out.
- **It consumes no random draw**, and `planExits` is evaluated last in the object literal so every draw it might make comes after every draw the chart already made. A number whose arrangement does not strip is therefore the number it was before, to the note.
- **One draw for the whole gesture, not one per layer.** Arriving is a fact about a player; leaving is a fact about the ending, and a band that drops back drops back together. Three independent coins at this rate would strip something in three songs out of four, which is the tendency the file was written to stop being.
- **Four things are never taken**, each a band breaking rather than an arrangement thinning: anything outside `brass, counter, pad`; a layer the style requires; the pad where nothing else is comping, since seven styles put `comp` in `excludeLayers` and there the pad *is* the harmony; and a layer that holds back, because entering at the second chorus and leaving before the last is a player hired for the middle of the song. That last refusal also makes `enters < exits` true by construction rather than by assertion.

This is the fault at the top of this section run backwards, and the difference is **monotonicity**. Present, absent, present is an arrangement forgetting itself. A layer that goes and stays gone says the opposite thing with the same silence: the song is thinner at the end than it was at the start, in one direction, on purpose. Flicker is the fault; a slope is an arrangement.

A single draw at 0.3 governs whether an arrangement strips at all, and the refusals above take the realised figure under it — 683 of 2800 numbers across fourteen genres when it was measured, with a per-genre spread from 6.5% to 35% that is entirely earned rather than declared. Ambient is the floor because every one of its styles writes `requireLayers: ['pad']`: the drone *is* the piece, so the only thing the genre can drop is an answering line it does not often have. Iskelmä tops it, because a humppa has four choruses, a full pavilion band and something to spare in all of them. Nothing in `chart.ts` had to know either fact.

### The melody guard, which measurement found and design did not

The closing edge is fitted **only to a section that states the tune**, and that rule came out of a fault rather than out of the plan. Dropping back is a gesture *about* the melody: the band thins, the tune carries on over the top of it, and the thinness is audible because there is still something to be thin behind. A bridge or an intro has no tune in it, so taking its colour away is not a drop-back at all — and in a finnfolk `soitto` kantele piece, where the bass plays eight notes in three minutes and the comp sixteen, it left a bridge with nothing sounding in it whatsoever.

One silent section in 2800 songs, which is one too many, because **a section is a claim that something happens**. That single clause is also the ancestor of the witness rule below, and it is the clearest example in this document of a safety rule that turned out to be a musical one.

## The drop

Everything above says *who is playing* at the granularity of a section or coarser. `excludeLayers` is a fact about a catalogue entry; `Chart.layers` is a fact about a kind of section; `enters` and `exits` move a layer in and out across a song by an ordinal that is deliberately an integer over sections. Between them they can build an arrangement and strip one, and none of them can say **stop, and come back**.

That sentence is a whole idiom's worth of music. A dub is bass out for four bars and everything back — the single defining gesture of the form, which reggae had been approximating with a `break` at a seam it did not want, a filter ramp and a mood's restraint; funk's `minneapolis` wanted the same thing and settled for one-onset bass tables, which is a thinner bass part rather than a bass part that stops. A drop in house or dnb is this and `exits` in one gesture: the floor leaves, the wash carries, everything returns at once.

**And it is the mechanism the layered-ambient goal is waiting on.** The way to make music thin out under speech is to mute layers rather than pull a master fader, and the audition page's layer chips already do that at *playback*. What was missing was the **composition** being able to say so. A `DropSpan` — half-open absolute bars, the layers actually lost, on `meta.drops` — is that statement, and it is the shape a mute automation lane can be built from.

`Style.drops` is a weighted palette with **no genre half and no mood bias**, which is the opposite seam from `fills` and `transitions` and the same one `breakCarrier` takes. A palette that falls back to a genre is a claim about *how a band in this idiom plays* and travels across every style in it; a drop is a claim about *what one piece is made of*. King Tubby did not mute the bass because that is what reggae does — and the same genre holds `nyabinghi`, which a dub would vandalise. Finnish folk makes the point structurally: one genre holding `hidasvalssi`, whose bass states every downbeat, and `piirileikki`, which has no bass to take away.

### A drop is an edit at assembly, and the return is not marked

Nothing in [`generate/drop.ts`](../src/generate/drop.ts) writes a note, moves a note to a beat it was not written for, or asks a part generator to leave a gap. Every layer is one array in one coordinate space by the time it runs, so taking a span out of one is `hush` — the same pass a `break` already uses, imported rather than copied, because two implementations of *take a part out for a span* would agree today and drift by the second bug fixed in one of them.

The consequence worth naming is that **no crash lands on the bar the band comes back in**. Writing one would be authoring an event that was not going to exist, which is the one thing an edit pass may not do. The return is heard because everything arrives at once, on a phrase boundary, which is how it is heard on the records.

### The witness

The melody guard generalises here, and the generalisation is the load-bearing part. A drop hits that wall much harder than an exit does, for two reasons at once: it removes layers for *bars* rather than for sections, so the surviving part has to be sounding in those particular bars; and it may remove several at once, so "the rest of the band" is not an answer. Four bars is a long time for a tune that plays eight notes in three minutes.

So the rule splits in two. **The tune rule** is kept verbatim from `playing()` and now does a musical job rather than a safety one — a drop is a gesture about the melody, so a bridge with no tune in it is not a section the band can be heard dropping out of. And **the witness** is a named layer, per shape, that must be in the section's active layers: `dub` is heard against the kit, `breakdown` against the wash. Named rather than searched, exactly as `Style.breakCarrier` is, and for the reason argued there — from inside a pass that may not read a note, a tanpura drone and a walking bass are both `bass` with some notes in it, and the table that wrote the style knows which one it is.

The witness type excludes `counter` and `brass`, and that exclusion is somebody else's measurement rather than a taste. Those two are the only layers whose membership of a section's active layers moves when `--hook` does — 286 and 3 of 7354 sections, against zero for every other layer, because one answers the melody's gaps and the other is placed around it. A `breakdown` **deletes drum events**, and `npm run genres` asserts drum events byte-identical between `through` and `earworm`, so a witness drawn from those two is not a stylistic worry: it is the difference between a green check and a red one.

**One shape was written, tried and deliberately left out**, because the refusal is the more useful record. *Stop-time* — everything out but the tune for two bars — is a real thing bands do, and it is the one entry whose witness could only be `melody`. That is measurably the worst witness there is: over 10,517 drawn breaks, `melody` produced 1,047 bars with nothing sounding at all against `pad`'s 0, because *a tune that has finished its phrase is precisely what is not there*. A break survives that by being one bar at a seam where the arrangement is about to change anyway. A four-bar hole in the middle of a section does not.

### Where it lands, and why `dropBars` had to exist

One draw picks the shape; everything after it is arithmetic. The span sits inside one section, both edges on the phrase grid, with **a whole phrase of band before it and a whole phrase after it**. The gesture is subtraction and subtraction needs a minuend — the band has to have been heard playing this section before it can be heard leaving it. The phrase after is the important one, and it is the answer to whether the return may coincide with a seam. It may not: mechanically, because every transition kind edits the last bar before a join and two passes editing one bar is how the double-swing bug happened; musically, because **a return that lands on a section boundary is inaudible as a return**, since the arrangement changes there in every song this engine generates. The band coming back is only heard as the band coming back if what comes back is what was already playing, into a section that is still running.

Together those put a floor of three phrases on a section, and where several starts are legal the **latest** is taken rather than drawn between. A drop in the second phrase of a thirty-two-bar chorus and a drop in the seventh are the same edit and two different pieces of music.

Which is exactly why `Style.dropBars` exists. Four bars is what a dub is on the records — half a statement about the idiom and half a statement about *the form this engine builds*, and only the first half belongs in a library. Three phrases of four means a twelve-bar floor. Measured by opting styles in one at a time over 200 songs each, a sixteen-bar form places one in essentially every song (reggae `dub` 200/200, jazz `bebop` 200/200, synth `berlin` 197/200), and **a style whose sections are all eight bars places none at all** — funk `minneapolis` 0/200, iskelmä `humppa` 0/200. `minneapolis` is one of the two styles that reported the gap in the first place, so a shape that cannot reach it is a mechanism that looks like it works and does nothing. It writes `dropBars: 2` and gets the gesture at the scale its own phrases are in.

**Adoption**: 29 styles across four genres — reggae and funk, which reported the gap, plus house and dnb, written later against a mechanism that already existed — and 11 of them override the phrase length. Measured over 760 songs sampled evenly across the nineteen genres, 24 carry a drop: 13 house, 10 dnb, 1 reggae, split 12 `dub` and 12 `breakdown`. The other 360 styles never open the `${seed}:drop` stream, which is what makes the whole feature additive.

## The vertical: why it sounded muddled

The parts were each individually right and were all writing in the same octave. Every layer took its register from its own instrument's centre and knew nothing about the others. Measured across 120 songs before any of this existed:

| | iskelmä | jazz | ambient |
|---|---|---|---|
| melody doubled at **unison** by comp or pad | 31.6% | 21.1% | 33.7% |
| melody at or below the comp's top voice | 26.8% | 28.4% | 33.6% |
| voicing containing a 2nd or smaller **below middle C** | 4.3% | 10.4% | 10.7% |
| voicing with two voices on the **identical pitch** | 9.1% | 0% | 3.7% |
| voicing omitting the chord's **third** | 16.3% | 2.8% | 1.3% |

A melody doubled at unison by a sustaining chord instrument stops being a melody: it fuses into the chord and the ear hears texture where it should hear a tune. One note in three. That is not a subtle defect and no amount of work on which notes get chosen can survive it.

### Low-interval limits

A major third is warm at C4 and mud at C2. The critical band is roughly constant in Hz, so it spans ever more semitones the lower you go, and two close partials down there beat rather than blend. `core/voicing.ts` builds every voicing **bottom-up**, requiring each voice to clear a minimum interval for the register it lands in:

| bottom note | minimum interval |
|---|---|
| below E2 | an octave |
| E2–B2 | a fifth |
| C3–F♯3 | a fourth |
| G3–B3 | a major third |
| C4–F♯4 | a whole tone |
| above G4 | anything |

Seconds are not the problem — seconds *in the bass* are the problem. Above middle C the limit falls away entirely, which is where a jazz voicing's colour lives.

Because the stack is built upward with a positive minimum, two voices on the same pitch became unrepresentable rather than merely discouraged.

### The third and seventh are not optional

The old tone priority dropped the third first. A `V7` came out as root–fifth–seventh with **no leading tone**, so every dominant in the song failed to pull anywhere. The drop order is now the standard arranging one: the fifth first (implied by the root, carries no information), then the root (the bass has it), then the extensions. The third and seventh survive to the last.

### Register planning

`generate/arrange.ts` reserves the lead's tessitura and gives every accompaniment layer a ceiling under it, *before* the accompaniment is generated. The melody's own floor is then raised to meet that ceiling, so the separation holds by construction — the tune cannot descend into the chord because there is nowhere to descend to.

A ceiling is still a forecast, so `resolveCollisions` runs afterwards with the finished melody in hand and moves whatever is still doubling it, an octave down where the voicing has room and by thinning the chord where it does not.

The pad sits a minor third lower than the comp and is voiced `spread` rather than close. Given the same window the two produced the *identical voicing*, and two layers playing the same notes are one layer at twice the volume.

## Rhythm comes first

Rhythm is what identity is made of. A tune hummed at the wrong pitches is still the tune; the same pitches on a different rhythm are a different tune. The generator chose pitches first and let rhythm fall out of a per-bar lottery, which is the priority exactly backwards.

Worse, the unit was the bar. `fitCell` forces every rhythm cell to fill exactly one bar, which makes three gestures unreachable:

- the **anacrusis**, a phrase beginning before its downbeat,
- the **tie**, a note held through a barline,
- the **push**, a downbeat anticipated by an eighth.

All three cross a barline. Measured before `generate/rhythm.ts` existed: **zero** notes tied across a barline in 120 songs, in any genre, and 86% of iskelmä sections beginning dead on beat 1.

The unit is now the phrase. Bars are laid out first, then the barline gestures are applied to the joins — chosen at musically sensible places rather than wherever a sampler left a gap. The join into the cadence bar is left alone: a cadence that arrives early or gets swallowed stops sounding like an arrival.

An anticipated downbeat keeps two things that a plain early note would not: it takes the **next** bar's chord, because that is what an anticipation is, and it keeps the **downbeat's metric weight**, because the ear still hears it as the downbeat.

`Style.melody.syncopation` sets the appetite per style — 0.12 for humppa, which is relentless and square on purpose, 0.65 for bossa, which anticipates almost everything. It belongs to the style rather than to smoothness: a syncopation is a choice being made, not a fault being tolerated.

## The motto

Repetition existed at exactly two scales: one bar (a motif restated inside its own phrase, then discarded at the phrase boundary) and one whole section (a tune replayed verbatim). Nothing in between, so a song could be locally shapely and globally arbitrary — every phrase well-formed, no two phrases related.

`generate/motto.ts` chooses one figure per song: a rhythm and a **contour**, held as scale steps between successive notes so it transposes wherever it lands. `hook.mottoAdherence` decides how often a phrase is built from it — zero at `through`, which is right for a bebop head, and near-certain at `earworm`.

The contours are a short list of shapes a listener can hold after one hearing: a scale fragment up or down, a turn, an arch, a repeated note answered by a step, a leap out and a walk home. A random walk is not among them, because a random walk is precisely what nobody remembers.

A quoted figure still has to bend to the changes. A strong-beat note that lands off the chord is pulled to the nearest chord tone within a step — which costs the shape almost nothing and is what a player does when sequencing a lick through changes. Without it, a motto arriving over new harmony sounds *nearly* right, which is worse than either familiar or wrong on its own.

## Instrumental idiom

`agility` says how far an instrument can *reach*. It says nothing about what the instrument actually plays, and that turns out to be the larger difference. Measured before `Idiom` existed, eight different lead instruments handed identical chords produced statistically identical lines:

```
instrument      step%  3rd%  run%  arp%   widest
vibraphone       68%   22%   19%   2%      12
flute            69%   22%   20%   2%       9
trombone         72%   20%   20%   2%       9
harp             68%   22%   19%   2%      12
```

A harp and a trombone wrote the same line. Every lead in the generator was a wordless singer wearing a different patch — which is a defensible default for music that ships with a vocal option and the wrong one for music that is instrumental by design.

Real instrumental writing differs by **figuration**, and none of it is expressible as a leap width:

| idiom | arpeggio | run | repeat | breath |
|---|---|---|---|---|
| `mallet` — vibraphone, harp, glockenspiel | 0.9 | 0.5 | 1.0 | 0.05 |
| `keyboard` — piano, organ, celesta | 0.7 | 0.8 | 0.7 | 0.05 |
| `plucked` — nylon guitar, pizzicato, sitar | 0.8 | 0.4 | 1.0 | 0.1 |
| `guitar` — steel-string and electric guitars | 0.4 | 0.9 | 1.0 | 0.1 |
| `bowed` — violin, string ensembles, cello | 0.25 | 0.6 | 0.3 | 0.15 |
| `wind` — flute, saxes, clarinet, shakuhachi | 0.2 | 1.0 | 0.4 | 0.7 |
| `brass` — trumpet, trombone, brass section | 0.35 | 0.3 | 0.6 | 0.9 |
| `reed` — accordion, bandoneon | 0.3 | 0.7 | 0.5 | 0.1 |
| `vocal` — choir patches, voice leads | 0.0 | 0.35 | 0.5 | 0.8 |

- **arpeggio** — a broken chord is a third followed by another third the same way. Two bonuses: one for *starting* a figure and one for *continuing* it. Only the second existed at first, and it was unreachable — a line that has not yet arpeggiated can never earn a bonus for continuing to.
- **run** — a scale run is a step followed by another step the same way.
- **repeat** — re-articulation is free on a mallet and awkward sung.
- **breath** — gaps at the phrase midpoint and end, made by shortening the note that arrives there rather than deleting anything, so the phrase keeps all its onsets. A flute line with no gap in it reads as synthetic long before anyone works out why.

After:

```
instrument      idiom      step%  3rd%  run%  arp%  gaps/bar  widest
vibraphone      mallet      56%   36%   17%   7%     0.15      12
harp            mallet      56%   36%   17%   7%     0.15      12
nylonGuitar     plucked     59%   33%   17%   6%     0.16       8
violin          bowed       62%   30%   22%   4%     0.17       9
flute           wind        64%   26%   21%   3%     0.23       9
trombone        brass       64%   26%   19%   3%     0.26       8
```

`npm run genres` asserts both halves: that a mallet breaks chords where a wind instrument runs, and that an instrument which has to breathe leaves more air than a keyboard.

## The counter-melody

The layer that answers the tune was the last one still working the way everything else used to. It found a hole in the melody, started on the chord root nearest its own instrument's centre, and walked root–third–fifth. Every bar, from the same starting note, with no memory across barlines and no relationship to the phrase it was supposedly answering:

```
                        old      new
stepwise motion         14%      58%
thirds                  53%      20%
minor sixths            24%       0%
figures of >1 note      26%      91%
doubling the tune at
  unison or octave      29%       0%
```

53% thirds and 24% minor sixths is not a melody, it is a chord being spelled out — the sixths are where `nearestPc` wrapped an octave on its way round the triad. Three changes:

- **Imitation.** The figure echoes the shape of the lead notes immediately before the gap, held as scale steps so it transposes onto the current chord, and inverted about half the time. An inverted answer is the oldest device in counterpoint and it has the useful side effect of guaranteeing contrary motion. 57% of testable figures now echo the phrase they follow.
- **Continuity.** The line carries across barlines instead of resetting to the instrument's centre, so it reads as one part rather than a series of unrelated fills.
- **Independence.** Where the answer does sound against a held melody note it may not double it at the unison or octave, may not move in parallel fifths with it, and stays under it. Two lines moving together are one line.

A lone note in a hole is now *held* across the gap rather than played short. A single short note dropped into a silence is a blip — the ear files it as a stray attack rather than as a reply; sustained, it is a countersubject.

## Dynamics

A song had none. Velocity came from metric weight plus a little jitter, and the accompaniment layers used flat constants, so every section came out at the same level:

```
verse   mean 0.626        pad    sd 0.000
chorus  mean 0.641        brass  sd 0.027
```

A chorus arriving 2% louder than the verse it follows does not arrive. The chords change and the layer count goes up and the ear still hears one unbroken plateau — which is most of what "it feels flat" means. The material was fine; nothing ever *happened* to it. And a pad whose every note is exactly 0.42 is not being played, it is being held down.

Three things combine, in decreasing order of how much they matter:

1. **What kind of section it is.** The gap that matters is chorus against bridge — a bridge that competes with the chorus destroys the chorus, which is the whole reason bridges drop back.
2. **Where it falls in the form.** Records build. The last chorus is bigger than the first, and each return of a kind is a little more than the last. The outro is the one place that goes the other way.
3. **How much the layer responds.** A drummer plays a chorus visibly harder (0.85); a pad barely changes (0.30), because a pad is the floor the arrangement stands on and a floor that surges is unsettling rather than dynamic.

```
intro   0.456      bass    sd 0.100
verse   0.585      comp    sd 0.125
chorus  0.653      pad     sd 0.028
bridge  0.460      brass   sd 0.086
outro   0.447
```

Sustained parts get a **swell** on top — one arch across the section, quietest at the edges — because a held chord at one fixed level is the sound of a patch rather than of a player.

### It reaches the preview now

Strudel's mini-notation has no inline velocity, which is why dynamics used to stop at the track level in the audition render and survive only in the MIDI. That was tolerable while the generator had no dynamics worth carrying; with a chorus measurably louder than the bridge before it, an audition tool that flattens the difference is auditioning the wrong thing.

The gain is emitted as a control grid on the same sixteenth slots as the notes, holding its value with `_` between onsets, and only for parts whose velocity actually varies by more than a couple of dB. A comp that plays every chord at one level gains nothing from a second grid saying so.

Adding it immediately failed `npm run check`, which is the useful part: the notation checker had never seen a numeric token, because the only other numeric grids belong to the sung layer and the sweep never passed `vocals: true`. A whole class of emitted notation was going unchecked. It does now.

## Drum fills

There was one fill: descending toms from the half-bar into a crash, in every genre, at every section boundary, at every tempo, regardless of what the section was turning into. A tom roll is a dance-band gesture — a drummer plays it into a chorus and would not dream of playing it into the head of a bebop tune, where the fill is a cymbal, a couple of kicks under it, and no toms anywhere.

It also had a quiet bug. It walked `ht, mt, lt` and then clamped to the end of the list, so a sixteenth-note fill played three toms and five repeats of the low one. That is not a roll, it is a stutter.

Seven shapes now, drawn from a per-genre vocabulary: `tom-roll`, `snare-roll`, `snare-toms`, `cymbal`, `rim`, `lead-in`, and `drop` — where the kit simply stops and the silence *is* the fill, because a bar of near-nothing makes the next downbeat land twice as hard.

```
toms per fill bar:   iskelmä 0.96   jazz 0.09
ride per fill bar:   jazz    0.73   iskelmä 0.02
```

**A fill's size belongs to what it lands on, not to what it leaves.** It is a delivery, so the length and the landing cymbal are chosen from the *next* section's intensity: the biggest fill in a song is the one into the last chorus, and that stays true even when the verse before it was quiet. A fill into something hushed gets an open hat rather than a crash, because a crash into a quiet verse announces the wrong thing.

The kick keeps playing through the fill — a drummer's right foot does not stop — and the rest of the pattern is silenced for exactly as much of the bar as the fill actually occupies, which used to be hardcoded to half a bar whatever was played there.

## The drummer's hand

One drum pattern is drawn for the whole song, and that is right: a band does not change its groove every eight bars. But it meant the kit played sixteen identical slots for a hundred and ten bars, and the only things separating a verse from a last chorus were a gain multiplier and a fill at the seam. Every song in the catalogue had exactly **one** kit texture in it.

What a band actually changes is the hand. The hat rides on quarters through a verse and eighths in the chorus, it moves to the ride when the record lifts, it opens on an offbeat. None of that is a different pattern, and none of it was expressible.

**Redrawing per section would have been the wrong fix.** `gated-backbeat` puts the snare on slot 8 and `sixteenth-hats` puts it on 4 and 12 — a song whose backbeat moves at the chorus is not a band varying a groove, it is two bands. So the song's pattern stays fixed and three bounded things happen to the timekeeping voice: it **thins** (every other hit — sixteenths become eighths, eighths become quarters, a swung ride of `[0, 6, 8, 14]` becomes `[0, 8]`), it moves to the **ride**, or it **opens** one or two offbeats onto the hat. Nothing else in the pattern may move, which `npm run genres` asserts by generating each pattern twice and diffing every voice the hand is not.

Which voice *is* the hand is derived rather than declared, and the guard is what makes that safe. `ride-swing` writes `hh: [4, 12]` — that is the hi-hat **foot**, on two and four, and it is the backbeat of the style. The rule is that the hand must be strictly busier than anything outside the timekeeping voices, so the ride outnumbers it four to two and wins; a pattern that does not say clearly is left alone.

The structural half is read off the section's intensity and the ornamental half is drawn, which is the same split `fills.ts` makes. *That* a quiet section plays a sparser kit is an arrangement rule and should hold in every song; *which* offbeat the hat opens on is a detail nobody would notice repeating and everybody would notice being identical in every song ever generated. The thresholds sit above what an intro and an outro are worth and below a verse, so the arrangement that falls out is the one nobody has to discuss: **the table's pattern is the verse**, the ends of the record are sparser, and the chorus is where the hand does something extra.

```
distinct kit textures per song, was 1.00 everywhere

iskelmä  4.78  over  9.4 sections   100% of songs vary
jazz     5.72  over 10.4 sections   100%
synth    2.89  over  6.4 sections    73%
ambient  1.52  over  5.6 sections    40%
```

Ambient staying near one is correct rather than a shortfall: two of its six styles have no kit at all and the rest are below the four-hit floor, which is the same sentence as "nothing in ambient announces itself".

**A preset box gets none of it**, which is the fourth thing on the list `machine` already takes away, beside the fill, the drum solo and the response to how hard the section is going. One pattern per button, and no hand on the kit to move.

This is the half of the groove that [`Feel`](feel-plan.md) cannot reach, and the two compose cleanly. A feel bends events that exist — pushes them off the grid, scales them per sixteenth, ghosts a snare into a rest — but a voice is not a scalar, and there is no number that turns a hat into a ride. A feel decides how the hand plays; this decides what it plays on.

## Brass

A three-note stab on the downbeat of alternate bars behind a coin flip, plus one pickup in the last bar. Measured across 68 songs that carried the layer:

```
1325 notes, and every single one exactly 0.50 beats long
72% on the downbeat, 25% on beat four, 3% anywhere else
79% sounding on top of the melody
```

A brass section that only ever plays eighth-note stabs, always in the same two places, always over the tune, is a sample library demonstrating itself.

What it does now depends on what the melody is doing at that moment:

- **Stabs** in the tune's gaps — short, usually off the beat, answering. A stab over a sustained vocal line is a collision, not an answer, so it has to be in a hole.
- **Swells** underneath a held note. Where the tune stops moving, the brass is what stops the arrangement stopping with it. The swell's length follows the note it supports, so it arrives and leaves with it.
- **Punctuation** into the next section — the one gesture the old code had, and it kept it.
- And most of the time, **nothing**. A brass section that plays in every bar has no punctuation left to give.

```
18 distinct note lengths (was 1)
39% held a beat or longer (was 0%)
60% land off the barline (was 28%)
9% of short stabs clash with a moving melody (was most of the layer)
```

The placement rule that does the most work: a hit is pushed off the barline wherever there is room, because a brass hit on the downbeat only thickens the accent the rhythm section already made, where one an eighth later is what makes a chart sound scored.

## The seam

**The drummer transitions; the band cuts.** Everything that marked a section boundary in this project was either the kit or a step change — the fill above, and every other layer simply stopping one thing and starting another at the barline. A listener heard the arrangement *change* rather than *arrive*.

[`generate/transition.ts`](../src/generate/transition.ts) gives a join four things it can be. `fill` is the drummer, unchanged and implemented by delegation, because the drummer's fill is what `fill` *means*. `shot` puts the whole band including the kit on one rhythmic figure in the last bar. `break` is stop-time: everyone stops and one voice carries the bar. `elide` moves the first onset of each layer at the seam back by an eighth and clips what it lands on, so the band arrives early into the join it was aiming at.

A fifth is missing on purpose. A `turnaround` — a ii–V sitting in the last bar to lean into the next section — is blocked because harmonic rhythm here is one chord per bar, so it could only ever be a *whole* bar, which is a progression edit rather than a transition.

**A transition is an edit at assembly, not a composition at the seam**, and that distinction is the whole of why it is cheap. Two rules in the tree forbid writing notes into bars a generator cannot see, and both are correct: a section's tune starts inside its section, and only the lead may write backwards across a join, because a comp or bass pickup sounds on top of a chord that is still ringing and nothing downstream would clear it. Neither is about *moving, deleting or replacing notes that already exist*. By the time this pass runs both sides of every seam are in one coordinate space, so the overlap that has no owner during composition has an obvious one here — the note's own neighbour. The sealed seam is not argued with, it is routed around.

### The rate limiter is what makes the vocabulary a vocabulary

`Style.transitions` is a weighted palette that falls back to a genre one, and `DEFAULT_TRANSITIONS` is `fill` at weight 1 — today's behaviour exactly, which is what made every kind after it additive. **141 styles name a palette outright and ten genres name one their styles inherit, so 351 of the 389 reach one and 38 do not.**

None of that decides how often a seam is anything but a fill, and it is worth being clear about why. A gesture needs `SEAMS_BETWEEN_GESTURES = 4` seams of clear air behind it, and the counter starts at the join that has not happened yet, so **seam 0 is never eligible and the first that can be is seam 4**. That caps the non-fill share at one seam in four at the very best, and well under it on a short form, however heavily a table weights `shot` — so it is the limiter rather than any palette that keeps a novelty gesture from becoming the texture of the catalogue.

Measured over 760 songs sampled evenly across the nineteen genres: 640 carry a seam plan, **5,712 joins are planned and 742 of them are not a fill — 13.0%**, split 354 `shot`, 218 `elide`, 170 `break`. Of the 354 shots, 89 are aimed *inside* the departing section rather than at the join, which is the 25% draw arriving where it should; an inside shot is the same edit two bars earlier, and the drummer keeps their fill because the join is no longer the thing being announced.

### `breakCarrier`, and the fault that made it a field

The first `playBreak` chose its carrier by asking which layer covered the last bar in sounding time. In practice that asked whether the *melody* did — and `--hook` is the one control that rewrites the melody. So the same seed broke at one hook level and not at another, and took the kit with it: measured at 14 seeds in 200 on arabic `fallahi`, 11 on `dabke`, 9 on `zaffa`, 7 on `longa`, and 0 on jazz `swing` and `blues`, which are dense enough that the tune cleared the bar every time. Two genre authors found it independently, and **both dropped `break` from their palettes rather than ship it** — which is how the sparsest music in the project came to have one seam gesture fewer than the densest.

The rule written for `shot` was *a drum event may not be derived from anything that changes with `--hook`*, and this kind walked straight through it, because a break derives nothing: it **deletes**. A bar of kit emptied at one hook level and kept at another is exactly as much a kit that moved with the tune as one whose figure came from it. The honest statement is wider:

> **No drum event may be written, deleted or moved on the strength of anything that changes with `--hook`** — and *whether a break happens* is such a strength, because it is the thing that empties the bar.

What survives that rule is the form and the arrangement, and the measurement is what licenses reading them: over 7,354 sections — eleven styles, sixty seeds, all five hook levels — a section's kind, length, transposition and solo assignment never moved once, and its active layers never moved either except for `counter` at 286 and `brass` at 3. So `Style.breakCarrier` is one optional layer id, **read and never drawn**, and the two layers that would put the guarantee back at risk are removed from its type, so the mistake is a compile error rather than a measurement somebody has to remember to make.

**Both genres took `break` back.** All seventeen indian palettes weight it, and all 28 of that genre's styles name `pad` as the carrier — the śruti box, the thing still ringing when everything else has stopped. Arabic took it back on `dabke` alone, because that style's own header says the bass is the loudest thing in the room. Indian's residual is the number that makes the field worth having rather than merely safe: a tanpura writes six notes into eight bars and has usually stopped three bars before the seam, so **43 of 10,517 drawn breaks came out silent** under the default carrier of `bass`, and 0 do under `pad`. 77 styles name a carrier today.

**And one guard has never once fired**, which is a finding rather than a disappointment. `MIN_BREAK_LAYERS = 3` refuses a break in a section too thin to hear one, and over 202 break candidates spanning every genre and style with the palette forced, the smallest active-layer count at a candidate seam *was* three — the distribution ran 3:14, 4:40, 5:101, 6:38, 7:9. `layersFor` does not write two-layer sections at the kind of seam that can draw one. It is kept because it is the only statement in the file of *why* thinness matters, and deleting it would mean re-deriving that argument the first time a genre ships a sparser chart.

### The delivery was naming instruments the music did not have

The figure was right while the band playing it was not. `playShot` wrote a kick and a snare on every hit and spared a crash, in literals, and the fill's landing cymbal was written in two more. Everything about *what* the band hits had been station-independent from the first line — a style table and a metre are facts about a bar, not about an object — and none of it was worth anything to a band with no kit.

Indian is the measurement and it names the prize. Five of its 28 styles declared a palette, and `filmi`'s own comment said why only five: the shot wrote its figure as a kick, a snare and a crash, and that was one of the few rooms in the genre with all three in it. A **tihai** — a figure struck three times, calculated backwards so the last lands on sam — is exactly a `shot`, and the 23 styles that could not have one were not short of a figure. They were short of a drum to play it on.

They have the drum now and they took the gesture: **seventeen of the 28 declare a palette today**, twelve adopted and eleven refused on stated musical grounds — four tālas with no cycle to land on, three arrivals belonging to somebody who is not the ensemble, two forms that exist in order not to display, and two on ektāl, whose sixes give six onsets where a shot is defined as two to four. The shot bar used to contain `{bd hp lp mp sd}` and now contains `{hp lp mp}`, which is three strokes of one drum, and it still lands on sam every time it did before. The figure never had anything wrong with it.

What resolves the kit is the *events and the bank* rather than a style table — the same question casting asks to decide who is standing on the stage at all. A shot is the band hitting a figure, so what it needs to know is who is in the band. On its own that change moves 29 songs in 10,760, in exactly two styles whose percussion has no kit voice in it while the drummer has never written a fill; in every other hand-drum song the fill had already put a crash in the bar, so this read found the kit the fill had conscripted and agreed with it. The two halves have to land together or neither does.

### The last bar has an owner

An ending is a seam with nothing after it, and `landEnding` owns it: `Genre.ending` is the house answer and **`Style.ending` overrides it**, with `Genre.countIn` and `Style.countIn` doing the same for whether a live band counts this music in.

Both were genre-level fields that two genres could not answer once. Classical buttons — a concert piece arrives at a cadence and the room claps — except that a nocturne is let go of rather than landed on, and an impressionist prelude does not cadence at all, its own tables ending on a chord with a ninth in it precisely so that nothing resolves. Finnish folk is the same shape and sharper: eleven pelimanni dance styles land the last chord together because that is what stops a floor, and four archaic ones have no downbeat to land on — an itkuvirsi *stops*, a runo performance ends when the poem does, a kantele piece is over when the last string has stopped ringing. **Six styles override the ending today and all six choose `fade`**; four finnfolk styles also decline the count-in, because a lament begins because the singer began.

**What the wrong ending cost is not the cymbal, and the first measurement of it measured the wrong thing.** All six styles carry `excludeLayers: ['drums', …]`, so the crash-and-kick branch never fired for any of them and never did. The whole cost is the pitched half: every onset inside the landing window is re-articulated on the downbeat with its velocity lifted 15% and a further 0.06, a few are *moved* there, and where a layer had nothing on the landing at all a recall branch re-strikes the last voicing it held — which **manufactures an attack** on a bar the music meant to leave ringing. Generating each style twice at one seed with only that field flipped, 40 seeds each, classical's `nocturne` lifts 6.2 notes a song and manufactures 0.45 on 7 songs in 40, and `prelude` 4.9 and 0.78 on 12. The classical pair is the loud one because a piano piece has both hands and a singing line in the last bar and the button collects all three.

The methodological finding is worth more than the numbers. The obvious probe — count notes on the final downbeat — gives figures of the right order of magnitude and **attributes them to the wrong mechanism**, because most of those notes were already there: the button's work is the velocity and the re-articulation, not the position. A number that looks plausible against a prediction is the hardest kind to check, and the only defence is to measure the *difference* rather than the state.

A **ritardando** was argued for here and refused, and the refusal is the more useful record. A whole-piece deceleration already works — the tempo shapes are curves rather than directions, so a rise below 1 is a ceremonial piece broadening across its length. What is rejected is the *final* slow-down over the last few bars, on two grounds pointing the same way. The ending already has an owner, and both the transition pass and the drop pass refuse to touch a bar another pass is editing, citing the same precedent. And a ritardando changes nothing in beat space — the button still lands on the last downbeat, the fade still covers the same bars — so its entire content is that the final seconds get longer, which makes it the one gesture whose whole substance lives in the renderer that plays it. **The audition plays it flat.** A shape whose only audible form is in the shipped file is a shape to add when the tool used to judge it can hear it.

## What the two axes govern now

**Smoothness** used to police the melody and nothing else, which left it unable to touch the loudest source of sourness in the output. It now also sets:

- how strictly the low-interval limits apply (`clarity`),
- how far apart the layers are kept in register,
- how far a line can reach, consistently across **every** path that places a note.

That last one mattered more than it sounds. Motif transposition, cadence placement and the repair pass all bypass the rule table, so a restated figure could leap however far it liked no matter how high smoothness was set — `strict` measured no smoother than `free`. `melodicReach` puts the rule table's ceilings and the instrument's physical reach into one number that every path honours.

At `free` the line is now genuinely free: leaps are suppressed by taste rather than by law, and how hard depends on the setting. A `free` that declines to veto while still weighting leaps into extinction is not free of anything.

**Hook** gained two things beyond melodic recall:

- `mottoAdherence`, above.
- `harmonicSimplicity`. A hook is not only a melodic property. Songs everybody can sing are built on three or four chords, and they are singable partly *because* the harmony stops asking for attention — the ear has spare capacity for the tune. At `earworm` the plainest available progression wins nearly every draw; at `through` the weighting is untouched.

## Measuring it

```bash
npm run ensemble        # the vertical: voicing quality and register separation
npm run genres          # the per-genre assertions, including the --hook A/B guarantee
npm run score -- 7 iskelma tango   # read one song bar by bar, all layers
```

`npm run audit` measures the melody as a line and always did. `npm run ensemble` measures how the layers sound together, which is where the faults above were hiding — every one of them was invisible to the line-level audit, and several of them were the *only* thing wrong. `npm run genres` is where the newer half of this document is held: it asserts that a mallet breaks chords where a wind instrument runs, that the hand moves and nothing else in the kit does, and that drum events are byte-identical between `through` and `earworm` — which is the assertion three separate mechanisms above are written to keep true.

The seam plan, the drop span and the tempo map are all on the IR rather than kept inside the passes that make them, so `npm run score` can say what the band does at bar 32 the way it already says what chord is there.

## Where the reasoning lives

Two of the mechanisms here were planned in full before they were built, and both plans landed:

| | |
|---|---|
| [`transition-plan.md`](transition-plan.md) | all five waves — the vocabulary, `shot`, `break`, `elide`, and the genre palettes with `anchor: 'inside'` |
| [`feel-plan.md`](feel-plan.md) | all waves, including the melodic half. A feel bends events that exist; the drummer's hand above decides what they are played on, and the two compose cleanly |

A plan is a record of intent and is not rewritten when the code moves, so where one disagrees with this page, this page is the one to trust — and where **both** disagree with the source, the source is right and both are stale.

[`engine-gaps.md`](engine-gaps.md) is the cross-reference for everything on this page that arrived because a genre author could not say something. It is current and maintained, and it is worth reading for its own methodological finding rather than only for its entries: **five of them turned out to describe code that had already changed**, and one named a function that has never existed in this repo. A limitation that gets fixed leaves its apology behind in the comments, and every one of those is a future author writing a compromise nobody needs. The catalogue this page describes is nineteen genres, 389 styles and 72 eras; any count here that disagrees with what the tools print today should be read as evidence that the file rotted, not that the code did.
