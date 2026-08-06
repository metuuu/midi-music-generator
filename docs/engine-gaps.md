# What the engine cannot say

Ten new genres were written in parallel, one author each, against the `Genre` and `Style` contracts as they stood. Each author was asked to report what they wanted to express and could not. This is that list, merged and de-duplicated, with the evidence each one came with — **and with what has since been done about it**.

It is worth reading as a compliment to the abstraction as much as a critique of it. Nothing here was a genre that could not be built; the seam held, and `generate/` and `render/` needed no changes to absorb arabic, indian, classical and metal. What follows is the set of places where an author had to write a comment explaining a compromise instead of a table expressing an intention — and the useful property of that list is that **most entries were found independently by two or more genres**, which is the difference between a gap and a taste.

## Where it stands

Eighteen of the original twenty-three entries are closed, and six new ones have arrived since — pop, rnb and hiphop each brought some, and two of those six are closed too. §6 records what was actually built, because in four cases the fix has a different shape from the one this document proposed and the difference is the interesting part.

| | |
|---|---|
| **Closed** | ghost notes · layer exits · sub-section drop-out · tempo ramps · `Style.effects` · hand-drum staging · floor posture · check coverage · sampled percussion · power chords · hand-drum solos · hand-drum fills, shots and hands · the hook-dependent break · five scale rows · **the vocal-group archetype** · **the bass glide** · **the house floor and the headphone band** · **the sub-sixteenth roll** · and four faults found while fixing those |
| **Open, and blocking** | nothing |
| **Open, structural** | a solo is named after a kit whatever plays it |
| **Open, per-genre** | everything left in §3 and §4 — the tail is §3.17, §3.19 and §3.20 |

**All nineteen genres now exist**, holding 389 styles across 72 eras. `dnb` and `house` were the last two, and they were written against a §1 with nothing left in it — the first genres in the project for which that was true.

`npm run typecheck`, `npm run genres`, `npm run check` and `npm run concert` are all green as of this writing. Four staging failures that stood here for a day — a polysynth in 1952, a hand asked for nineteen semitones, a cable through a player, a one-armed hand drummer — are all in §6.

**`npm run check` is in that list for a reason worth one line.** The bass glide is the project's first control grid whose values can be *negative*, and `check-notation.ts` validated grid tokens with `/^\d+(\.\d+)?$/` — so the day a style first wrote a downward glide, 644 perfectly good bars were reported as unparseable notation by the check whose whole job is to be believed. That is the third time that file has held a vocabulary narrower than the one the renderer emits, and its header now says so. The fix keeps the signal rather than allowing minus signs everywhere: a negative is music in `penv` and a fault in every other grid, because a gain or a filter frequency below zero is a bug that would otherwise render as silence.

**A second axis this list did not originally have.** Everything above is what a *genre author* could not say. There was a parallel set of things a **stage** could not say, and it was worse, because it had no authors to report it: the rooms and the clothes were written by people who could not see the result. That work is in §6, under *What a stage could not say*, and its lesson is one line — a bench is worth more than an assertion, because an assertion only catches what you thought to check.

**A caveat about how this list was made, which four entries have now earned.** These are authors' reports, and an author who could not find a mechanism reasonably concluded there was none. Twice that was wrong at the time of writing — ghost notes and per-section layer selection both existed in partial form, on `Feel` and on `Chart` — and twice more the *fix* revealed the framing was off: the hand drum did not want a `DrumSource` at all, and this document asserted a sightline check that did not exist. Where a partial mechanism exists it is now named, because the shape of a fix is usually *compose with the thing that is already there* rather than *add a second one beside it*.

---

## 1. Open, and blocking the work that is still queued

**This section is empty of blockers.** Three of the five unwritten genres have been written — pop, rnb and hiphop — and the two mechanisms `dnb` and `house` were waiting on are both built. What is left below is one real ceiling that everybody has learned to write around.

The three that landed brought six new entries with them, in §3. Two clear this document's own bar of having been found independently more than once.

### 1.1 Nothing ramps the tempo — **closed**, see §6

`bpm` was a range drawn once per song and used as a scalar everywhere after. `SongMeta.tempo` is a `TempoMap` now.

**Evidence, kept because it is what the shape was argued against.** Indian's qawwāli accelerates across its length — that is what the form *is*. Finnish folk has the same problem in the pelimanni repertoire. Both wrote it down as a compromise. A build in house or dnb is a tempo-and-density ramp and half of it was unavailable; a hip-hop record that drifts is a different thing from one that does not.

It was the largest item in this document by blast radius, and that was the whole difficulty: the tempo reaches the IR, both renderers and the concert clock, and the four consumers do not agree about what a tempo is.

### 1.2 Nothing drops out mid-section — **closed**, see §6

Both halves now. `Chart.exits` closed the section-shaped one; `Style.drops` and `generate/drop.ts` close this one. The entry is left here with its evidence intact because the evidence is what the shape was argued against.

`excludeLayers` is per-style and all-or-nothing, and `Chart`'s granularity is the section kind. There was no way to say *this layer stops for these four bars and comes back*.

**Evidence.** Reggae's dub is the canonical case: bass out for four bars, then everything back, is the single defining gesture of the idiom, and it was approximated with a `break` transition, a filter ramp and a mood's `restraint`. Funk's `minneapolis` wanted the same and settled for one-onset bass tables. A **drop** in house or dnb is this and the exit rule together — everything leaves, then everything returns.

**It is also the mechanism the layered-ambient goal needs.** The README already says the way to make music thin out under speech is to mute layers rather than lower a master bus, and the audition page's layer chips do exactly that at playback. What is missing is the *composition* being able to say so.

**Shape of the fix.** Genuinely a new axis; do not make `Chart`'s ordinal fractional. It is closer to `FeelSpan`, which already carries a `from`/`to` bar range. The agent that built `exits` left two things for it: everything downstream of `Section.activeLayers` has now been exercised against sections thinner than their neighbours and came through clean at a 24% rate, and **the melody guard is a ready-made safety rule** — a layer may only be removed where something else is guaranteed to sound. A drop will hit that wall much harder, because it removes layers for bars rather than for sections.

### 1.3 Bass riff span is capped at about twelve semitones

`generateBass` places the root within a tritone of MIDI 40 and repairs only by whole octaves, so a figure spanning more than about a twelfth is folded flat at some root positions.

**Evidence, from three genres independently.** Funk hit it on three figures and reworked them to use the ♭7 above rather than below. Reggae's `steppers-octave` declared a span of 17 and was narrowed to 12. Metal's `fifths` figure spanned a nineteenth and `clampToRange` folded 8 bars per style across 11 styles before it was narrowed to a twelfth.

At least it is loud rather than silent: `npm run genres` catches it as *"a riff is the same shape over every chord quality"*. But three of ten authors hit it, and an octave-displaced riff is not an exotic gesture.

---

## 2. Open, and structural

### 2.1 `applyShot` and the fill vocabulary were kit-only — **closed**, see §6

All four sites, in two waves. The entry is left here with its evidence intact because the evidence is what the shape was argued against, and because the second wave is the better lesson of the two.

`applyShot` wrote `bd` + `sd` + `cr`, hard-coded. `generate/fills.ts` and `KitVariation` were the same. So a genre with no kit got kit strokes in the one place it could not refuse them.

**Measured**, by the agent that generalised the solo: after its change, kit strokes written inside a hand-table drummer's own solo blocks fell from 2054 to **9** across 120 songs per genre — and all nine survivors were 3 stray `oh` in arabic and 6 stray `cr` in latin, arriving from fills and shots rather than from the solo generator. That agent also wrote the check, `a hand-drum genre never sends for a kit`, confirmed it failed on those nine, and left it out rather than commit a red check. It went in with the fill and shot wave and has been green since; it is the check `npm run genres` now runs over 241 songs on tables with no kit in them.

A **tihai** is exactly a `shot`, and `shotFigures`' metre fallback already resolves to the vibhāg heads for free — so indian gets one the moment the delivery stops naming three instruments that music does not have. **Both genres have now adopted it**, and the numbers are in §6.

The adoption re-measured the claim rather than trusting this document, which was the right instinct twice over. `applyShot` is called `playShot` now; on a hand table its `shot` is `['lp']`, and across 3,246 forced shot bars in all 28 indian styles there are **0 kit strokes**, with a shot bar containing exactly `{lp}` and landing on sam 100% of the time. But two things the *comments* asserted were never true rather than newly false: the five indian styles that already had palettes were described as the rooms that own a kick, a snare and a crash, and **none of the five has a kit either**; and `staging.ts` argued a riser on the grounds that those numbers stage a session drummer, where the measurement is **0 of 300 indian numbers putting anybody on the riser**. That second one is a real loss correctly taken — the second man was being staged by a seam gesture conscripting an instrument nobody had cast.

**The fourth site is why this stayed open after the ninth stray was gone.** `KitVariation` never wrote a wrong stroke — `HAND_VOICES` was `rd sh hh oh` and a table of `lp mp hp tb` has none of the four in it, so `handOf` returned nothing at all. The symptom was silence, in all 54 hand tables, in every section of every song. A check counting wrong voices cannot see a gesture that never happened.

### 2.2 There is no archetype for a vocal group — **closed**, see §6

Built and now adopted. The entry keeps its evidence because the evidence is what the shape was argued against.

`ARCHETYPE_OF` staged every choir patch — `choirAahs`, `voiceOohs`, `synthChoir` — as a **synthesiser**, because there was nowhere else for them to go. That is right for 1985 and wrong for 1932.

**Evidence.** It cost country's string-band era its documented vocal-quartet pad when the pre-electronic rig anachronism was fixed: the era comment said *"the pad is people"*, and the only honest substitute available was a pump organ. It is also relevant to gospel, doo-wop, barbershop and the close-harmony styles country already writes.

It got an `Archetype` member, an `ArchetypeSpec`, its own model, and the year-gated remap — which is `EARLY_ARCHETYPE_OF`, reached only from `archetypeForTrack`, and the gate is **`CHOIRS_GET_A_KEYBOARD = 1970`**. That number is worth writing down because it has already been got wrong once inside the codebase: `vocal-group.ts` said 1963, which is `SYNTH_RIGS.polysynth.from`, and the two are exactly the conflation `EARLY_ARCHETYPE_OF`'s own doc argues against. A synthesiser existing is a different fact from a choir patch being the ordinary way to get the sound, and the gap between them holds country's nashville era — 1968, staging the Jordanaires on 43% of its pads under a comment saying it could not.

### 2.3 A drum solo is named after a kit whatever plays it

`Section.solo.instrument` hard-codes `'drum kit'`, so a darbuka chorus is announced as a kit on the showbill. Nothing breaks — `playerFor` still finds the right performer — but the programme lies, and it lies about the one number in the set where the object is the point.

Small, and it wants the same `drumStations` question the solo generator and the check now both ask.

---

## 3. Expressiveness, wanted by one or two genres each

### 3.1 `ending` and `countIn` are genre-level

Classical wants `button` for 24 styles and `fade` for the nocturne and the impressionist prelude; it gets a chord struck where the sound should stop. Finnish folk is worse — roughly a quarter of its catalogue is archaic material with no downbeat to strike, and it took `button` because two thirds of the styles want it.

### 3.2 `TitleContext` carries no key or mode

It has `style`, `mood` and `bpm`.

Three genres independently wanted the missing field. Arabic's repertoire names its pieces *form plus maqam* — *Longa Nahawand* — and the maqam is a function of the key. Indian's are named for the rāga and the tāla. A large share of real classical titles name a key. All three fell back to imagery or to the form alone, because a randomly drawn maqam name is a wrong label rather than a poetic liberty.

### 3.3 No per-section scale change

A maqam's *sayr* is its habitual path, and a long piece modulates to a neighbouring maqam and comes back. A rāga performance does something comparable. `scaleForChord` is asked per chord and has no section to key on.

### 3.4 `Effects` has no bell filter

Only low-pass and high-pass. Metal's 800 Hz mid-scoop — arguably *the* production signature of 1988 — is unrepresentable, and it was written into `eras.ts` rather than faked. Now that `Style.effects` exists this is the remaining half of the same want.

### 3.5 `Genre.filter` moves per section; a wah moves per note

Funk declared no `filter` profile at all rather than fake an envelope filter as a section sweep.

### 3.6 `DrumPattern.cycle` is one number for the whole kit

Djent is hands on the bar and feet on a seven. Metal carried the seven on the guitar and bass (`cycle: 7`) and had the kit state the grouping instead.

### 3.7 `metricStrength` always calls slot 0 the strongest

A masurkka's weight is on beat two. Finnish folk did it in velocities instead. Distinct from `groups`, which the same genre used successfully for the polska's uneven three — `[5, 3, 4]`, a 40:25:35 division matching the Nordic fiddle recordings to the nearest sixteenth.

### 3.8 No rubato

`Feel`'s `push` is a fixed millisecond offset per layer — a groove, not a phrase that stretches and gives the time back. Classical left `feels` absent rather than approximate it.

### 3.9 No "the same tune, decorated"

`hook.recall` either replays a phrase or re-composes it. A da capo aria's ornamented repeat is neither.

### 3.10 `WORD_STYLES` has no sargam — **closed**

Both halves of it, and the entry stood here stale for long enough to be worth recording as its own small lesson: `style/vocals.ts` has carried a `sargam` entry *and* a `tarana` one for some time, and this document went on listing the want. Found by the sweep rather than by anybody working on vocals — which is the argument for the sweep.

An Indian vocal line should be sung on *sa re ga ma pa dha ni* or on a tarānā's *dir ta na dere*. `airy` was used, which reaches *ma*, *na*, *ni* and *re* and holds its vowels, but cannot say a stopped consonant. The indian author called a `sargam` entry the highest-value single addition for that genre, and was right.

### 3.11 The Japanese pentatonics still have no rows

The general problem — `makeScale` fixes degree 0 at the tonic, so a rotation needs its own row — is closed for the five scales that were blocking genres (§6). One set was deliberately left:

`koto`, `shamisen` and `dantranh` all have ranges and concert archetypes, and **no genre in the catalogue plays any of them**. Two reasons not to guess: hirajoshi is a *tuning* before it is a scale and there is no tuning concept (§3.12), and hirajoshi/iwato and kumoi/in-sen are two rotation *pairs* — so a Japanese genre will want four rows chosen together rather than one guessed in advance.

### 3.12 No instrument-tuning concept

Metal expressed drop tunings as register — `layerPlan.offsets.comp: -7`, low key weights — and wrote the limitation down.

### 3.13 `Style` is not a container

A Finnish *purpuri* is a wedding suite made of other dances. The hook setting and the form buy the feeling of a suite and none of its architecture.

### 3.14 `Attachments` exposes only `head` and `torso`

So a wrist accessory — studded wristbands, a watch, tape — has nowhere to anchor. Metal and the costume pass both stopped at this rather than thread a new anchor through `performer.ts` and `performer-arms.ts`.

### 3.15 Nothing subdivides below a sixteenth — **closed**, see §6

Built as `DrumEvent.roll` and `DrumPattern.rolls`, and adopted by `trap` and `drill`, the two styles the report named.

The grid is sixteenths everywhere, and for eighteen genres that was never a limit worth writing down. A trap or drill hi-hat subdivides *inside* a stroke — triplets, 32nds, the roll that is the whole point of the part. **At 140 BPM a written sixteenth is 107 ms and the roll wants 36.**

Hiphop wrote what it could: the dotted-eighth chain and four consecutive sixteenths on the last beat. The faster rolls are simply absent, and there is no approximation that gets closer. Dnb filed the same entry from the other side and in the sharper words — *no stutter, no retrigger, no 32nd roll* — which makes this the only entry in the tail with more than one reporter and the only one either of them called a **technique** rather than an ornament.

Dnb is deliberately left unadopted; a second genre is a separate job now that the shape is proven.

### 3.16 A bass note cannot slide — **closed**, see §6

Built as `BassHit.glide`/`glideTime`, and now adopted by the genres that reported it.

`BassHit` was `at`, `dur`, `tone`. A drill 808 and a g-funk bass both *glide* between pitches, and both were written as two struck notes where the record has one that moves.

**Two styles hit this independently in one genre**, which by this document's own standard makes it a gap rather than a taste. It is also the nearest thing in the project to the pedal steel that country could not have (§3.12's neighbour) — the same missing idea, which is a pitch that is a function of time rather than a constant per note.

### 3.17 `Effects` has no envelope follower

So **sidechain compression is unsayable**, and pop's fourth era is named after it — `sidechain`, the recording situation where one layer's gain is a function of another layer's onsets. Nothing in `Effects` relates two layers at all; every field describes one in isolation.

Related and smaller, from rnb: `Style.effects` cannot say *gate*. `synthsoul`'s gated snare is spelled as reverb plus a hard lowpass, which is the right sound arrived at by the wrong mechanism, and `DrumTrack.voiceEffects` already exists to put it on the snare alone.

### 3.18 `swing` delays the eighth, and some idioms swing the sixteenth

`Style.swing` is documented as the shuffle between the two halves of a beat. New jack swing shuffles the **sixteenth**, which is a different subdivision and is the genre's name. Rnb wrote `0.16` as "the nearest honest object" and recorded that it is not the thing.

Adjacent, from the same author: **no per-stroke timing offset.** `Feel.laidback` pushes a whole layer by one amount, but `offgrid`'s actual gesture is the second backbeat dragging *further* than the first. Approximated with slot displacement, which is audibly a different thing.

### 3.19 Compound time cannot be stated

Half the girl-group repertoire is 12/8, and `beatsPerBar` cannot say so without also claiming the bar is a 3/4. Pop approximated it as `swing: 0.28` over 4/4 and admitted the approximation; rnb's `doowop` did the same at `0.33`. Rnb's `gospelsoul` got 6/8 honestly via `beatsPerBar: 3` with `groups: [6, 6]`, which is the shape that works — so this may be a documentation gap as much as a mechanism one.

### 3.20 There is no object for a person holding a microphone

`Genre.vocals` casts the singer as a **doubling of an instrumental line**, so a rapper or a front singer stands in the row with the keyboard players rather than downstage of them. Distinct from §2.2, which wants a vocal *group* as an instrument; this wants the act.

---

## 4. Small warts

- **`drumBanks` is required even for a genre with no percussion.** Classical names `AkaiMPC60` in all four eras purely to satisfy the type; it never plays.
- **A style with `excludeLayers: ['drums']` still needs a non-empty `drums` table**, because `generateSong` draws the figure before it knows about exclusions and an empty array throws in `rng.weightedBy`. Ambient solved it with a `NO_KIT` placeholder and country copied the trick.
- **`keyChangeChance` couples two gestures** — a bridge in the dominant with a prepared pivot, and a final section a semitone up. A genre wanting one gets the other at half the rate.
- **The form only trims to five steps**, so the shortest piece finnfolk can generate is a little over four minutes — too long for a lament. This entry said `growForm` for months and **there has never been a function of that name**; it is `buildForm`, and the floor is a literal `steps.length > 5` inside it. Caught by the sweep, along with a second citation of the same ghost in `generate/tempo.ts`.
- **A rāga cannot be left mid-phrase**, which is what a thumrī does.
- **A sama'i changes metre in its fourth khana**; `beatsPerBar` is song-level.

---

## 5. Two checks that were measuring the engine, not the genres

**`the answer never doubles the tune at the unison or octave by accident`** was an engine-level residual present in every established genre at similar rates — measured over 200 seeds per genre: iskelmä 4/2335 (0.17%), metal 3/3570 (0.084%), rock 6/2930, country 5/2039, jazz 1/1757. It passed or failed at its own 40-seed sample substantially by luck, and four separate agents had to prove it was not theirs.

It is currently **green**, and it went green without being touched — which is the clearest possible statement that it was measuring a coin toss. If it returns, the fix is a threshold derived from measured output across the widened catalogue, not a loosened one.

**`brass sustains as well as stabs`** was measured at 19–20% against a >20% bar on the same afternoon in both directions. Genres that exclude the brass layer entirely — finnfolk emits zero brass notes — contribute nothing and cannot move it. Also currently green.

---

## 6. Closed

### From the list above

**§ Ghost notes.** `DrumPattern.ghosts`, a sibling of `voices`. Deliberately not a per-slot velocity map: level already has three owners — the metre, the section and the feel — and a number in a style table would outrank all three in every song. It says which strokes are ghosts and leaves how loud to the engine.

The interaction with `Feel.ghost` needed no coordination code, which is the good part. A written ghost is an ordinary event by the time the drawn pass runs, and that pass already refuses occupied slots, only ghosts odd sixteenths adjacent to a snare, and scales against the bar's mean snare velocity — which written ghosts are part of. So writing one *spends* it. Drawn ghosting around a written backbeat fell 94%, and a figure ghosting only the e leaves the a to be drawn. `GHOST_LEVEL = 0.28` was solved for rather than chosen: it makes a written ghost and a drawn one agree within 2%.

**§ A layer could enter and never leave.** `Chart.exits` alongside `enters`, so `playing()` is a window rather than a threshold. **The ordinal is placed, not drawn** — taken from the form's own section counts — so it consumes no random draw and no stream moved: across 2800 songs, no song came out with the same layers and different notes. It only fires in a section that states the tune, a rule that came out of measurement rather than design: without it a finnfolk kantele piece lost its pad from a melody-less bridge and the section went completely silent. Fires on 24.4% of songs, from 6.5% in ambient (every style writes `requireLayers: ['pad']`) to 35% in iskelmä.

**§ Nothing dropped out mid-section.** `Style.drops`, a weighted palette drawn **once per song**, and `generate/drop.ts`. A `DropSpan` is `FeelSpan`'s shape — half-open absolute bars — and it is IR, on `meta.drops`, because the layered-ambient goal needs the *composition* to be able to say which layers are muted for a stretch, and nothing in the IR could say it.

**Style-level with no genre half**, which is `breakCarrier`'s seam rather than `feels`': a fill palette is a claim about how a band in an idiom plays and travels; a drop is a claim about what one piece is made of, and the same genre holds `dub` and `nyabinghi`.

**The melody guard split in two**, and that is the interesting part. `Chart.exits` reads `here.includes('melody')` — a layer may only be taken away where something else is guaranteed to sound, and the tune was the only guaranteed something available. A drop removes layers for *bars* and may remove several at once, so one rule was doing two jobs. It is now a **named witness** per shape — `dub` is heard against the kit, `breakdown` against the wash — checked against `activeLayers` and named rather than searched for `breakCarrier`'s reason: from a pass that may not read a note, a tanpura drone and a walking bass are both `bass` with notes in it. The tune rule stays beside it doing the *musical* half. 0 empty sections across every style probed.

**Where it may land is placed, not drawn**, so the only random number in the feature is the one that picks the shape. Inside one section; both edges on the phrase grid; a whole phrase of band before it and a whole phrase after. That last rule is the answer to *may the return coincide with a seam* — **no**, because every transition kind edits the last bar before a join and two passes on one bar is the double-swing bug, and because a return landing on a section boundary is inaudible *as a return* when the arrangement changes there anyway.

**Nothing moved.** 807 songs — every style in all fourteen genres at three seeds — byte-identical in MIDI and Strudel against a copy of the live tree with only these hunks reverted. No style opts in, and `planDrop` returns before its first draw when there is no palette.

**One shortfall found by measuring rather than by reasoning, and fixed.** A four-bar drop needs a twelve-bar section, so a style whose sections are all eight bars places none at all — funk `minneapolis` 0/200 and iskelmä `humppa` 0/200, against 200/200 for reggae `dub` and jazz `bebop` on sixteen-bar forms. `minneapolis` is one of the two styles this document names as having asked for the feature, so the shape would have looked like it worked and done nothing. `Style.dropBars` is the fix, standing to `drops` exactly as `breakCarrier` stands to `transitions` — read, never drawn — and at `dropBars: 2` both reach 200/200.

**§ A style could not declare `Effects`.** `Style.effects`, merged `instrument > style > era > genre`, per key. The style goes **over** the era: an era is an average over a decade, a style is a member of that average, and an average does not overrule a member of itself. The decisive test is that under the other order the field would do nothing at all for `dub`, which is the only reason it exists.

**§ The hand drum.** Solved with a different shape from the one proposed here, and a better one. A `DrumSource` would have had to answer for the whole part at once, and a third of the patterns writing hand voices write kit voices in the same bar — funk's `congas`, latin's `cumbia-kit`, reggae's `roots-rockers`. Those are not a drummer choosing between two instruments, they are two people. So the split happens **on the voice**, in three tiers: `kit`, `hand`, and `either` for the auxiliary pieces that genuinely exist at both stations. That middle tier is what makes it work — every arabic `maqsum` is hand strokes plus a riq on `tb`, and with two tiers that `tb` would have conscripted a full acoustic kit.

**§ `Posture` had no floor value.** `floor` is a **conjunction**: `ArchetypeSpec.lap` says whether an object can be played from a carpet, and `FLOOR_SEATED` in `cast.ts` says whether this band sits on one — because the object under a funk conga player and the one under a tabla player are the same object. Two entries only, sitar and hand drum, and the restraint is the finding: 15 of the 23 archetypes indian and arabic stage are *borrowed* objects, so putting a concert vibraphone on a carpet stages the wrong instrument and puts it where it cannot be played. Riser goes to zero and the player moves downstage, since height and depth trade off from a camera 11 m out. `sitar.ts` had carried an apology recording that its boards-measured constants were shrunk onto a chair only because there was no floor posture; they are back.

**§ `concert-check.ts` only exercised four genres.** `CHECKED_GENRES = GENRE_IDS`. It immediately surfaced three real staging faults, all now fixed — see below.

**§ The sampled percussion was loaded and unreachable.** `SAMPLE_RACKS`, a table parallel to `BANK_VOICES`. **A rack is not a bank**, and the decisive reason is addressing: `.bank()` is implemented by prefixing, VCSL's names are bare, and a folder there is an *instrument* rather than a voice — `darbuka` is twenty recordings (five strokes × two velocities × two round-robins) and a voice needs a name *and an index*, which a bank table has nowhere to put. Racks ride on a machine and claim the auxiliary voices; there is deliberately no rack-only form. Levelled by measurement, because VCSL runs from −17 to −39 LUFS and a conga at unity is inaudible; the meter was cross-checked against numbers already in `source-levels.ts` (kick spread 13.0 dB against the recorded 13.2).

**§ A power chord was unexpressible.** A `'power'` `VoicingStyle`, built beside `chooseTones` rather than inside it — `chooseTones` does *selection* and its "the third goes last" rule is right and untouched, while a power chord is a **shape** built on a chord rather than out of one. Across metal's catalogue: tritones **23.4% → 0.1%**, perfect fifths **2.0% → 89.8%**, and a metric the original table never measured — comp onsets carrying a register-limit complaint, **19.2% → 1.2%**, because `voiceQuartal` is the one routine in that file that never consults `minInterval`.

**§ `generateDrumSolo` was hard-coded to a trap kit.** Orchestration now resolves from the style's own table through the same `drumStations` split casting uses. Four gestures generalise — state-then-answer, the run down the drum, the weight under the phrase, the run-in to the ending — and two do not: the hi-hat is a **limb** and `ARCHETYPES.handdrum` has no pedal, and a cymbal rings where a skin does not. A darbuka lands the band on a doum instead. A table naming both tiers solos on the kit, because those are two players. Arabic `dabke`, 16-bar chorus: **8 voices of trap kit in a takht → 4**.

**§ `applyShot` and the fill vocabulary were kit-only.** One literal in four places, found four times by the genre it was wrong for, and closed in two waves because each wave's sweep found the next site. `SeamOrchestration` in `generate/fills.ts` is the deliberate twin of the solo's — same `drumStations` read, same *the kit has first claim*, same *a gesture is a job, not an object* — and **six of the seven fill shapes generalise**. The one that does not is `cymbal`, the only shape in the vocabulary named after an object rather than a job, because there the object *is* the gesture: a bebop set-up is the ride ringing across the barline and a skin does not ring, so it is **re-aimed onto `lead-in`** rather than mimed. `snare-roll` needed re-*reading* rather than re-voicing — a kit roll is one surface struck repeatedly, and on a hand drum a roll is a tirakita, where the alternation produces the sustain a stick produces by repetition. Kit strokes in hand-table songs **1804 → 98 → 0**, the middle number being one gesture in a third file (`landEnding`) and the last one a fourth (`playShot`'s level read, which chose *how hard* from `bd` and `sd` and now chooses it from the station's own pulse and stating strokes).

**The fourth site outlived the ninth stray, because its symptom was an absence.** `KitVariation` is the *how it is played* axis against the pattern's *what is played*, and `HAND_VOICES` was `rd sh hh oh`. `handOf` needs its winner **present** and busiest, and a table of `lp mp hp tb` has none of the four in it — so this never wrote a wrong stroke and never could. It returned `undefined` in all 54 hand tables, in every section of every song, while every kit style in the catalogue got a verse thinner than its chorus. A check that counts wrong voices cannot see a gesture that never happened, which is the general lesson: *a hand-drum genre never sends for a kit* was green over this file for a day.

**What a hand is, decided by measurement rather than by taste.** `HandStation.keeps` is the cymbals and the brushes on a kit and never the kick, the snare or the toms, because thinning a backbeat is not a drummer varying a groove — it is a second band. At a hand station the same sentence picks out **the pieces on the stand and never the drum**. The catalogue says so in numbers: over the 54 hand tables, a row of four or more auxiliary strokes is evenly spaced **40 times out of 50**; a row of four or more strokes on the skin, **39 times out of 129**, averaging 3.2 strokes against the auxiliary's 5.2. The piece on the stand is a subdivision layer and the drum is a figure, in four genres written by four authors who never compared notes.

So **22 of the 54 hand tables get a hand and 32 do not**, and the 32 are the finding rather than the shortfall — every indian theka, every finnfolk frame drum, reggae's nyabinghi. Take alternate strokes out of a tīntāl theka and the result is not a sparser tīntāl, it is not tīntāl. The guard that enforces it was written for a hi-hat five genres away and needed no change at all: the hand must outnumber every voice outside `keeps`, and `jhala` writes `lp: 12` against `hp: 8`. **No station but the kit has a loud gesture**, so `lift` is optional: moving to the ride is a second cymbal and opening the hat is a surface that rings on demand, and what a riq player does at full tilt is *add* strokes — the one direction a mechanism that only removes and re-aims cannot go.

**Measured.** Arabic's auxiliary strokes per bar in an intro or outro **4.62 → 2.66**, against 5.25 in every other section, unchanged. 380 songs across all nineteen genres, MIDI and Strudel hashed against a copy of the live tree with only these hunks reverted: **25 differ and every one is a hand-table song** in arabic, indian, latin and finnfolk. Not one of the other fifteen genres moved a bit, which is the acceptance test — their tables never changed, so their music must not. **A genre with no percussion at all gets silence and always did**: `playShot` returns before writing a stroke when the bar has no drums in it, so classical's seam figure is the orchestra landing together and nothing on the `AkaiMPC60` that four eras name and none of them play.

**§ The `break` transition was hook-dependent.** The carrier is named rather than searched. The finding that shaped it: **nothing pitched is hook-invariant** — `--hook` moves the harmony, so every pitched layer follows the chords and the bass differed at 39 of 40 seeds. So no note may be read at all. The musical argument stands on its own: *"whoever filled the bar"* was already wrong with no `--hook` in sight, giving the same style a bass break in one song and an answering line in the next, and once producing a break carried by a single 32nd note 0.03 beats before the downbeat. Unstable seeds **53/1484 → 0**.

`Style.breakCarrier` followed, and closes the five residuals: indian's tanpura writes six notes into eight bars and has stopped three bars before the seam, so 43 of 10517 drawn breaks came out silent. Under `pad` — the śruti box, which is what is still ringing — that is **0**. `melody`, the tempting choice for a taqsim, is 24× worse.

**§ Nothing ramped the tempo.** `SongMeta.tempo` is a `TempoMap` — a list of `(beat, bpm)` breakpoints, **piecewise constant**, with `meta.bpm` kept and now meaning *the tempo the band counts off*. Three alternatives were argued and rejected in `grid.ts`: a function is unserialisable and makes each renderer pick its own sampling rate; linear interpolation turns beats→seconds into a logarithm that two implementations agree on to fourteen digits **and that MIDI cannot express anyway**, since a set-tempo event is a step; and a scalar-plus-ramp-description puts the curve in the reader, so every consumer has to implement the same easing. Piecewise constant is the only shape all four consumers implement identically, and it is what MIDI natively *is*.

The interesting half is the consumers. **MIDI is native and exact** — one set-tempo per breakpoint, 60 IR points → 60 events matching exactly. **Strudel cannot ramp at all**, established by reading the installed package rather than guessing: `setcpm` sets a scheduler global, the `.cpm()` pattern method is deprecated and is a constant time-stretch, and a per-bar `fast` bunches a bar's notes up and leaves a gap. The decisive reason not to attempt a trick is that `web/concert/transport.ts` recovers the sounding beat by inverting Strudel's scheduling equation, which is exact only because `cps` is constant — so a ramping audition would put every hand on the concert stage in the wrong place. A ramping song therefore emits a banner in its own source naming the curve and telling the reader to render the `.mid`. **This is the first shipping-only feature**, the exact mirror of the audition-only effects `midi.ts` has always had.

**The choreographer was deliberately left alone**, and that is the subtlest decision in the change. The stage animates against the audition, and the audition is flat; sizing windups from the tempo map would size them for a performance nobody in the room is hearing. Worse, handing `Board` the map without also ramping the transport would make *both sides* of the travel-speed comparison derive from the same wrong number — self-consistently wrong, which is the one failure a check cannot catch. So `concert-check`'s travel-speed assertion needed nothing and still means what it always meant: no hand exceeds human travel speed *at the tempo this show plays*.

Two shapes plus the identity: `accelerando` (linear) and `gathering` (squared, so half the speed arrives in the last third, because a linear climb has already lost the patient opening a qawwāli is built on). A **build** is left expressible and the reason it could not be built here is concrete — everything in `tempo.ts` runs before the form exists, because `buildForm` divides by the tempo to fit `Genre.duration`, while `planDrop` runs four hundred lines later; a build must arrive *at* the drop, so it wants a second planner appending to the same map, which is what a list-shaped IR was chosen for. **Drift** is fifteen lines and was not built because hiphop named no magnitude and a drift's entire content is its magnitude. A **final ritardando** was written and rejected: the ending already has an owner in `landEnding`, and two passes editing the same bar is how the double-swing bug happened.

Two latent bugs surfaced on the way, both fixed and both bit-identical today: `web/concert/show.ts` computed a number's length as `songDurationSeconds(song) * bpm / 60` — beats to seconds and back to beats — so a ramping number would have ended an eighth early; and `web/main.ts`'s radio auto-advance used the written length rather than the audition's, so it would have clipped every ramping record's ending.

**§ A bass note can slide, and three genres now say so.** `BassHit.glide` is a `BassTone` rather than a count of semitones, because the destination is *the note the author already wrote* and the field's whole job is to absorb it — so the headline claim was that **adopting is a deletion**. Mostly it is. hiphop's `drill` and `gfunk` fall from 11 written onsets to 8, dnb's three styles from 43 to 38, and in every case the second of two struck notes becomes the first one's destination.

**But "adoption is a deletion" turned out to be a half-truth, and the counter-example is the best thing this wave found.** dnb's `neurofunk/talking` merges nothing at all: every stroke in it is fenced by a gate rest somebody switched on, so collapsing pairs would delete the style rather than express it. The field is spent *inside* strokes there instead, taking pitch continuity across joins from 2-of-6 to 4-of-6, with the onset count and every `at` unchanged. `jumpup`'s `bouncing` and `stab-bass` stay struck on the same reasoning and now say why — **a leap written as a glide is a dive-bomb**.

**The three-point contour, which was the open design question**, is spent as two notes rather than collapsed to one leg, and the argument is sharper than the compromise it replaces: the second note begins on the pitch the first arrived at, so the re-strike is an amplitude re-gate and not a pitch re-articulation — and never re-articulating the *pitch* is what a Reese actually forbids. `techstep/reese` is four notes covering two bars as one unbroken contour, 0→♭2→0→♭3→♭2, where it was six struck notes. Verified in generated output rather than argued: each glide's arrival midi equals the next note's start midi.

A related limit found and worked around rather than papered over: the field cannot begin a glide *late*, since travel starts at the onset and `NoteBend` explains why that is forced. So "hold, then lift" is unsayable in one note — and sayable in two, which is what `techstep/held-reese` does, the pedal carrying no bend and the next note carrying the leg.

**`glideTime` splits the genres exactly as its doc predicted**, which is the useful confirmation that the number deserved to exist — and every author solved for it against a real device or a real tempo rather than picking a feel. dnb writes none at all and takes the default of the whole note, because "the movement is the sound". hiphop writes `0.25` on drill — at 136–148 BPM that is 210 ms of travel and 630 ms holding, the report's own *bends across half a beat and then holds* — and `0.4` on g-funk, where at 90–102 BPM it lands on the 375–500 ms a Minimoog's glide knob sits at. **House's is the sharpest**: `acid` takes `0.25` because a 303's slide is a fixed RC time of about 60 ms, and at 120–132 BPM a slid pair of sixteenths runs 227–250 ms, so a quarter of it is 57–63 ms — the machine's own number, holding across the tempo range. `speedgarage` takes `0.5` because half of a four-sixteenth note is two sixteenths, so **the destination arrives on exactly the slot the deleted onset stood on**: the contour is unchanged to the sixteenth and only the second attack is gone.

**Measured**: hiphop 43.6% and 34.7% of bass onsets travel in the two styles and 0% in the other 22; dnb 73.9%, 47.8% and 24.3%, 0% in the other 21; house 12.5% and 18.2%, 1.97% genre-wide, with the per-song rates coming out at exactly the figure weights. **The §1.3 span trap was avoided by construction in all three genres** — every destination is a pitch the figure already struck, so no shape widened and `a riff is the same shape over every chord quality` stays exact at 45,120 notes over 371 figures.

**Three refusals inside the adopting styles**, which is the finer grain this wave found. house's `303-sparse` holds its source pitch for two steps, and a 303 slide is a step-to-step switch whose source is one step long by definition — so absorbing the pair would delete the held pitch rather than the restrike. `speedgarage`'s dips at slots 3 and 11 are movement at the *far* end of a note, which `NoteBend` refuses on renderer-agreement grounds, and adopting anyway would mean the bar never sits on its root. And `sub-and-skank`'s one adjacency would put the arrival on beat 3 under the kick.

**One pre-existing fault the glide made audible rather than caused.** `swing: 0.14` pushes `speedgarage`'s dips late enough to overrun the note behind them, and `render/midi.ts` marks any file where a bending note overlaps another, because a channel bend drags the overrun. Measured over 60 songs: **75 overlapping bass pairs before the change and 79 after** — the collision is the feel pass and is as old as the table. The glide only makes the `.mid` say so, and the audition is unaffected because a pitch envelope is per event. Documented in the style rather than fixed in the feel pass, which is the right call: two passes editing one bar is how the double-swing bug happened.

**§ Nothing subdivided below a sixteenth.** `DrumEvent.roll` — *this stroke, sounded as n even strokes filling the sixteenth it stands on* — with `DrumPattern.rolls` as the authoring end, a `Record<slot, count>` per voice beside `ghosts`' `number[]`.

**The IR could already hold the beats, and that is exactly why nobody noticed.** `DrumEvent.beat` is a plain float, so three onsets 36 ms apart were expressible before this existed; what could not exist was anything that would **read** them. Every consumer collapses a slot deliberately and each one is right to: `slotOf` rounds to the nearest sixteenth, `drumDynamics` says out loud that *two strokes on one slot sound as one stroke*, and the choreographer buckets on `quantise`. Two events a hair apart on one voice is a **collision**, and absorbing collisions is a service those passes exist to provide. No arrangement of floats distinguishes a collision from a roll, so the difference had to be *stated* — which is `NoteBend`'s shape one layer down and for its reason: a glide is not a second note carrying a flag, it is a field on the note saying the second note is what it absorbs.

**Both renderers play it, and both were checked rather than assumed.** The audition writes a **nested group**, `[hh*3]` where `hh` stood; `@strudel/mini` queried directly returns 0.7500 / 0.8333 / 0.9167 for the fourth slot of a bar, so the count is a divisor and the arithmetic is rational rather than sampled. The `.mid` is the *more* faithful of the two by construction: PPQ is 480, a sixteenth is 120 ticks, and 2, 3, 4, 5, 6, 8, 10 and 12 all divide it exactly — a trap triplet is 40 ticks with nothing to round. **The velocity grid needed no change at all**, which was the one thing expected to be awkward: a control pattern is applied appLeft, so all three strokes read the single number standing on their slot. Nesting it would have been the trap, because a `_` after a nested group stretches the *group* rather than holding its value and the two grids slide apart by a 32nd.

**One thing was genuinely broken and was found by parsing the output rather than by reading the code.** The MIDI note-off gate is a flat `PPQ/8` = 60 ticks, harmless for a decade because on channel 10 a key is a one-shot — and fatal the moment one key is struck twice inside that window. A roll of three puts the second stroke 40 ticks in and the first stroke's off at 60, so a reader that honours note-offs receives on/on/off/off/on and kills the **middle stroke of the roll**: not a wrong sound, a missing one, in the file this feature exists to make correct, and invisible to anything counting note-ons. The gate is now the spacing where the spacing is shorter. Verified by parsing the emitted `.mid`: 1454 IR events → 1609 note-ons, the roll at beat 23.75 landing on ticks 11400 / 11440 / 11480, and **0 overlapping note-ons on any key** in the file.

**A number per slot in a style table, where `ghosts` spent four paragraphs refusing exactly that** — and the two are consistent, which is the design question this entry turned on. `ghosts` refuses a velocity column because level already has three owners: the metre, the section and the feel, and a table number would outrank all three in every song. **Subdivision has none.** `metricStrength` says how strong a slot is and not how divided, `intensity` scales a velocity, `Feel` leans and ghosts and drags, and `KitVariation` thins a row and moves it without ever splitting a hit. The test `ghosts` applies is *does this outrank an incumbent*, and here there is no incumbent — a generator deciding the count would be inventing an opinion rather than expressing one. The half still refused is the one `ghosts` refused: **every stroke of a roll is the velocity of the stroke it subdivides**, no taper and no second number. That is also what the gesture *is*, and this genre's own table had already said so about its machine-programmed half — *"drawn into a machine a step at a time, and a step has one velocity"*.

**Nobody's hand is ever asked to retrigger, and that is the decision the whole feature rests on.** `rolls` is read only where `DrumTrack.source` is `programmed` — *a machine programmed a step at a time; no drummer, and it can play anything*, which is `DrumSource`'s own words and is a description of a retrigger. A preset `box` is refused on the grounds that already cost it the fill, the solo and the ghosts; a `kit` and an `electronic-kit` are refused because there are hands on them. **The number that settles it was written years away and for something else entirely**: `REPEAT_SECONDS.floor` in the choreographer is 50 ms between two strokes of one hand, and it is that short only because the second half of a double is the stick's own rebound. A roll of three at 134–152 BPM asks for 33–37 ms, indefinitely, from one stick on one surface; `BURST_SECONDS` puts the sustainable rate at eight strokes a second and this wants twenty-eight.

**So the choreographer needed no change — and unlike the tempo ramp, that is a proof rather than a policy.** The ramp left the stage alone because animating against a map the audition was not playing would have been *self-consistently wrong*, the one failure a check cannot catch. Here the audition and the stage agree because a rolled stroke is structurally unable to reach a staged pair of hands, and the claim was measured both ways: `npm run genres` now asserts **10,866 rolled strokes over 120 trap and drill songs and 0 on the 3 drawn with a person behind the kit**, and across 48 shows in four genres the choreography — every hand, foot, viseme and light cue, with the song itself removed — is **byte-identical**. The one show whose IR moved moved only in the music it embeds. Note that `concert-check`'s partition check could not have caught the mistake: one event is still one gesture, so it would balance while the sound had three strokes in it and the picture one. That is why the guard is asserted at the source.

**Adopted where it was reported, and refused twice inside the same two styles.** `trap`'s `trap-kit` accelerates out of the bar — the four consecutive sixteenths it already wrote, with the last two struck twice and three times, so the last beat runs **107, 107, 54, 36 ms** and arrives at the report's own number. `busy-hat` answers its own first bar across a `cycle: 32`. `drill-kit` takes one stutter on the last eighth and `late-snare` takes trap's run-in. **`open-trap` refuses** because `oneHatAtATime` deletes the closed stroke under its open hat and a roll leading into a hat already ringing is two ideas in one moment; **`dotted-drill` refuses** for the better reason — sixteen hats three slots apart is a dotted-eighth chain, three against four, and a retrigger inside one of its steps is a second cross-rhythm asking to be counted at the same time as the first. A stutter is a gesture *against* a plain pulse, and that figure has no plain pulse to be against.

**Placement is exact rather than probabilistic.** Of 33 trap songs drawing a sixteenth-hat figure, 31 roll and the two that do not are `electronic-kit` — the hand gate, visible in the measurement. Drill rolls in 45 of 60 songs, trap in 31 of 60, the shortfall in each being precisely the weight of the figure that refuses. A thinned section drops the roll on the hits the hand dropped and keeps the ones it kept, which is `varyPattern` carrying rolls the way it already carries ghosts; an **opened** hit loses its roll, the one place the two differ, because an open hat is a surface left ringing and a retrigger is that surface re-struck three times inside 107 ms.

**Nothing moved.** 2334 songs — every one of the 389 styles in all nineteen genres at six seeds — hashed in MIDI and Strudel against a copy of the live tree with only these hunks reverted: **7 differ and every one is `trap` or `drill`**. The other 387 styles and all eighteen other genres are byte-identical in both renderers. `roll` is placed and never drawn, so no random stream moved. `npm run check` carries a standing count — **235 rolled slots** in its 150-song sweep — because a grammar wide enough to accept a shape is not evidence the shape is being produced, and that file's whole history is of vocabularies drifting from the renderer's.

**§ The two hand-drum genres took the transition palette that was built for them.** The mechanism had been generalised for two waves and nothing used it, which is §7's whole thesis about why that is worse than not building it. **Indian adopted 12 of its 28 styles and refused 11**; **arabic adopted 5 of 21 and left 16**. Both authors sorted rather than sprayed, and the sorting is the deliverable.

**The decisive measurement in indian was the figure each tāla resolves to.** Ādi at `[0, 8, 12]` and rupak and misra chāpu at `[0, 6, 10]` give **three onsets — a muktāyi spelled out, free, from the metre fallback**, which is what makes a `shot` and a tihai the same object rather than two things that rhyme. As shipped: 4,539 shots and 1,630 breaks over 5,600 songs, **16.0% of seams**, every adopting style placing a gesture in 139–200 songs of 200, and **0 kit strokes** throughout.

**The eleven indian refusals come in four shapes**, and one of them is a warning worth keeping: for the four styles with no cycle to land on — alap, jor, alapana, tanam — a palette is **not a harmless no-op**, because the band half of `playShot` moves the pitched tracks in 14 to 32 songs of 40 even where the drums have nothing to say. The others are the arrival belonging to someone who is not the ensemble (ghazal's radīf, padam's dancer, thumrī's bend inside the phrase), the form existing in order not to display (bhajan, dhun), and **one honest mechanical refusal left standing**: dhrupad and vilambit are on ektāl, whose sixes give six onsets where `bandHeads` defines a shot as two to four. A `shots` table would fix it, and the author declined to invent a chautāl tihai they had not measured.

**Arabic's five are each argued from a different gesture.** `samai` takes a `shot` above `fill` — the only style in the genre to weight it that way — because a taslim is arrived at by a **qafla**, and its comp falls 12.07 → 7.84 onsets while melody, pad and bass all rise: four layers converging, which is what a qafla is. `dabke` takes `break` at 4 because its own header says the bass is the loudest thing in the room and the break carrier is the bass — break bars drop drums 10.51 → 2.03 and comp 4.79 → 0.09 while **the bass holds at 3.94 either way**. `zaffa` refuses `break` because it is played walking and a procession cannot stop dead. And two styles **refuse everything**: `ayyub`, whose zar thesis is that nothing changes — the same refusal §7 records for hiphop's `bounce`, reached independently by another author — and `taqsim`, where a shot drags the improviser onto the sixteenth grid and a break deletes them outright, leaving a bar with no attack in it.

**§ There was no archetype for a vocal group.** Built, and then — the half that matters — **adopted, refused and measured by three genre authors working separately**, which is the pattern §7 argues a mechanism is worth nothing without.

The gate is a year and the year is 1970, not the year the first polysynth shipped. **Country restored both eras it had lost**: `stringband` puts the quartet back at the head of its pad table but at 6+4 against the pump organ's 5, not its old 9-in-13 — the organ was installed as a substitute and kept its place on its own merits, and what gave weight back instead was `strings1`/`tremoloStrings`, a sixteen-piece bowed section being a longer reach from four people and a fiddle than a parlour organ is. `honkytonk` went back to *exactly* its pre-removal table, because the 1955 music never changed and only the staging did. **Latin restored `conjunto`** — the coro at 5, ahead of the violins at 4, because the violins belong to the charanga next door and the era is named after the band that has none.

**Measured through the real `castSong` path, not the mapping**: stringband 110 of 211 pads draw a choir and **399 singers reach the boards as `vocal-group`, none as `synth`**; honkytonk 88 of 340 and 323 singers; conjunto 88 of 244 pads, 318 singers, 88 of 88 numbers. `npm run concert` now names `country#0 vocal-group/vocal-group` as its closest placement at 1.04 m, which is four people at one microphone.

**Two of the five sites refused, and the refusals are the better half.** Latin's `orquesta` is the first era in that genre with a section that can hold a note — a septet has nothing that sustains, which is *why* its coro is the only harmony in the room, and five saxes plus four trombones are the held chord under a mambo. Its cost is named rather than glossed: `chachacha` is joint-heaviest there and its refrain is sung, but that is an answer shouted between the band's own entries, not a chord held under the number, so `pad` is the wrong slot for it.

**Jazz refused after proving it would work**, which is the more useful shape of refusal. The brief said `swingera` had lost a choir entry; four revisions of that file exist and *"choir" appears in none of them* — there was nothing to restore, and the one hit in the folder's history is the scat singer's GM 52 in `vocals.ts`, a different layer. The real question stood anyway, and was answered with numbers: patched in, `choirAahs` draws 53 times in 300 songs and casts as a vocal group 53 times out of 53. It is refused because a big band's sustain **is** its sections — the pad measures a median 3.95 beats and 1.23 notes per bar, and `brassSection`, `strings1`, `clarinet` and `trombone` are all people already on the risers holding a note. What the Boswells and the Modernaires actually did was carry the *tune* for a 32-bar chorus, and no layer in the engine can say "for one chorus". Decisively: at one sung number in three, **only 15 of those 53 songs have a singer on stage at all**, so the other 38 would put four people at one microphone holding an open /a/ behind a clarinet solo with nobody out front.

**§ Five scale rows.** `durga`, `malkauns`, `hansadhwani`, `nikriz` proper, and the six-note `majorBlues` that country and rock both wanted and neither could spell. Four more were argued for and **rejected**, which is the more useful half: the altered scale is already melodic minor a semitone up and *"that is how the players think of it"*; nothing in `ChordQuality` could ever select a lydian dominant, so the chord quality would have to come first; `prometheus` is one composer's chord and `wholeTone` already holds that job.

### What a stage could not say

The list above came from genre authors reporting what they could not express. Nothing produced a comparable list for the **staging**, and the reason is the finding: there was nowhere to look at it. So the faults below were not compromises anybody recorded — they were shipped, believed correct, and invisible.

**A costume bench.** `web/looks.ts`, served at `/looks.html`: every hair style, every accessory, **every accessory crossed with every hair**, every fabric, and every genre's wardrobe drawn through the real `castSong` path. It exists because `gallery.ts` — the *instrument* bench — opens with the argument verbatim: models were "verified against geometric assertions, and shipped, and the only way to look at any of them was to start a concert and hope the camera cut to it. Assertions catch what you thought to assert. A bench catches the rest." Sixteen hair styles, twenty accessories and fifteen fabrics had just been written under exactly those conditions. The bench found eighteen faults on its first run. Everything else in this section is one of them.

**Rooms had no builder.** `stage.ts` built one rectangular proscenium — boards, backdrop, wings, fly bar, curtain — with four boolean modifiers, and that was the whole vocabulary for fourteen genres. A concert hall, a courtyard, a barn, an arena and a dancehall were **architecturally the same box in different paint**, and the genre authors were not at fault: a `StageRoom` could carry colours, props and a fog number, so data was all the system could accept.

`web/concert/rooms/` now follows the pattern `instruments/index.ts` already set — a `Record<RoomStyle, RoomBuilder>` where each room is a file and a missing entry is a compile error. Eleven rooms, 11,390 lines; `stage.ts` fell from 751 to 460 and keeps the machinery the show drives, which is the line that had to be drawn correctly: **the stage is the part of the picture some other file already has an opinion about, and the room is the part nothing else does.**

Each author proved every *other* room byte-identical against a copy of the tree with only its own hunks reverted, walking world transforms, geometry attribute hashes, material descriptors and every `StageMetrics` field. The salon added negative controls — a 0.1 mm change to another room's dais, and a pure-geometry change with no metric change at all — to show the harness could see what it claimed to check. The seam's own bug surfaced immediately: `houseLid()` derived the house ceiling as `houseY + LOW_CEILING` for any room with a finite headroom, which was true of the cellar and nothing else, so a roofed courtyard would have hung its chandelier a metre below its own plaster.

**Every performer in every genre was the same lathe.** `Look.outfit` was four colours and a fabric. There was a `cut?: { lapel, shoulder, flare }` whose own comment said *"this is where a decade actually lives"* — **written by nothing and read by nothing**, and three numbers could not have made a thobe out of a lounge suit anyway. `Garment` is eight silhouettes now, dispatched from `performer-garments.ts`, with a `legsOf()` contract so the legs know whether there are trousers at all. All fourteen genres carry a table. Finnish folk is drapes over floor-length linen in 1780 and V-panelled waistcoats in 1860; arabic is robes and gowns where country is shirtsleeves and braces.

**Hair and hats could not see each other.** `buildHair` and `buildAccessories` were independent `void` functions adding geometry to the same head, so a hat sat at a fixed multiple of head radius whether there was a crop or a 42 cm afro underneath. Every hat in the union disappeared inside an afro. `buildHair` returns a `HairProfile` now — **measured off the built group rather than tabulated**, because a table saying "a beehive is 2.83 R" is true until somebody improves the beehive, which is this document's own recurring bug one level down. Head furniture reads it and either presses the hair or rides on it, bounded so that a bandana over an afro does not solve the fit by swallowing the halo entirely.

Four faults that were shipped and invisible:

- **The hood and the wrap had their face-hole over the right ear.** `SphereGeometry(…, phiStart: π*0.30, …)` — phi = 0 is −x. Front-on, a hooded performer was a featureless egg with two eyebrows through it. Live in four genres.
- **The fabric that exists to look expensive was the darkest thing on stage.** Nothing set `scene.environment`, so `lame` at metalness 0.90 had no diffuse response at all. Every `loudFabric: 'sequin' | 'lame'` lead — iskelmä, funk, latin, arabic — was the dimmest figure in the room. Nine of the remaining fabrics were also mutually indistinguishable at ten metres and needed a second axis, not a finer one.
- **Forty players in evening dress had no lapels.** They were `shade(jacket, -0.07)`, and `shade` clamps at zero, so on classical's near-black `#141418` every negative shift landed on black. The fix picks its direction from the colour.
- **Dressing one genre re-rolled every player's face.** `cast.ts`'s garment draw promised in a comment that it was *"last of every draw in this function — the same faces, the same colours, the same hats, in different clothes."* It was false by two calls: `skin` and `hair` were drawn inside the returned object literal, after it. Only findable by diffing the whole catalogue.

**The two that were still open here are closed.**

**§ The house floor was sized off the house.** `houseDepth + 8` centred on `lipZ + houseDepth/2` is a house-shaped number for a plane that has to reach past the house at both ends, and it pinned the upstage edge at `lipZ − 4` whatever the building was. Since `lipZ` and `backZ` are `±depth/2`, the ground ran out `depth − 4` metres short of the back wall in **every venue deeper than four metres, which is all thirteen dressings the two rooms are ever asked for** — 1.40 m in jazz, 2.30–2.60 m in iskelmä and ambient, 3.60 m in arabic's widest court. Both now measure from the building: 2 m past `backZ`, and the reach they already had at the house end, which was never the part that was wrong.

The courtyard is where it mattered and the proscenium is why it survived. A proscenium's tormentors exist to stop "a wide shot seeing past the arch into nothing" and the wedge they cover is exactly this one — but they are front-on geometry and orbit yaw is not clamped anywhere in this renderer. A courtyard has no masking at all, and its own walls run the full plan from `backZ − 0.1` to `houseBackZ`, so the paving stopped three and a half metres inside a court closed on four sides. **Proved by reverting only this in the live tree**: the same arabic frame comes back with its entire lower half black.

**§ `headphones` was one rigid object.** Every hat here rides tall hair by being picked up whole, which is what a hat does. Headphones are the exception in the wardrobe and in the world — the band goes over what is on the head, the cups go on the ears, and the two are joined by a slider whose whole purpose is to take up the difference. Lifting the group whole took the cups with it, and over the union's tallest heads that is **1.0 R of travel, about eleven centimetres**: not a fit slightly off, but the cups above the crown of the skull. The bench shows it plainly at `hat:headphones:beehive`, which is what settled it.

So the band rides, the cups stay, and **the ring stretches between them** — the slider drawn rather than implied. `seat()` is solved before the object is built rather than after, and the one sprung object in the union is the only case that reads the answer; the other nineteen ignore it and are right to. The arithmetic is what makes the stretch the right shape rather than merely a taller ring: the band crosses the cup line at `1.175 R` with no lift and at `1.065 R` at a full one, against cups at `1.06 R`. It meets them *closer* the further it has stretched, which is the direction a real slider goes, and at `lift = 0` both numbers reduce to exactly what was there before — so the unhatted picture is untouched by construction rather than by luck.

### Found while fixing the above

- **`Fabric` was inert.** `clothSurface` derived sheen from colour *saturation* and never read `Look.outfit.fabric` — precisely the failure that field's doc says it exists to prevent. Wired at all six call sites with `fabric` required and the saturation path deleted.
- **Quartal voicings and degree subsets assumed seven notes.** Three scale steps is a fourth only in a heptatonic scale; over the six-note `blues` it was already stacking fifths.
- **`check-notation.ts` duplicated the drum vocabulary as a string literal** and would have rejected `tb`, `lp`, `mp` and `hp` the first time a style emitted one. Now derived from `DEFAULT_DRUM_MIX`, whose keys the compiler guarantees complete.
- **`performer-look.ts` claimed a missing case was a compile error.** A `switch` in a `void` function is not checked for exhaustiveness, so a new hair style would have produced exactly the silent silhouette the header said was impossible. Both switches now end in a `never` assignment.
- **Two scale rows were mislabelled** — `hungarianMinor` as Maqam Nikriz (it is Nawa Athar) and `majorPentatonic` as rāg Durga (it is Bhoopali). Both caught by the genres that use those scales daily.
- **Four genre-keyed tables in `concert/`** became `Genre.staging`, so a genre owns its own room, wardrobe, programme notes and groove weight — and `synth`, which had been staging in the fallback house in plain concert dress under *"a new one, and nobody has decided about it yet"*, finally has a room.
- **A polysynth was staged in 1952.** Every pre-electronic synth performer came from the pad layer and nowhere else; 1952 is a Carnatic recital whose pad is the tanpura. `rigPoolFor` now returns an empty pool rather than its nearest rig, which is the only answer that cannot be wrong, and eight eras across six genres lost electronic pads they should never have named — finnfolk had a *warm synth pad in 1780*.
- **A cable ran through a player.** The sampling comment reasoned "a sample every 8 cm against a 12 cm clearance", true of the line handed to `settle` and false of everything it gave back — eviction moves points radially and the last rounds do not smooth, leaving a mean segment of 13.5 cm and a longest of 77. No clearance was widened; over-long segments are subdivided and re-settled.
- **A hand was asked for nineteen semitones.** Three causes, one symptom: synth was mis-cutting (fixed by choosing the cut by fewest grabs rather than widest gap), electric-piano had chords spanning 38 semitones that *no* cut can split, and the accordion — 146 of the 152 — never reached the cut branch at all, because `ACCORDION_BUTTON_TOP` is a physical wall with no second hand behind it. The chord **rolls** now, a sixteenth early, because a player is ready before the beat and never after: 0.11% of key notes, nothing dropped. The `HandSpec` was not narrowed, on the grounds that a tenth on an accordion is good music.
- **A seam `elide` could empty the section it arrived at.** On a style sparse enough that the arriving section's only attack was its downbeat, moving it an eighth early moved every onset into the section before. `activeLayers: []` — the IR saying the band left.
- **The fourth constraint casting solves for was never checked.** `DEFAULT_CAMERA` had been exported since it was written, under a comment saying it existed *so the verifier could assert against the same camera the stager staged for*, and nothing ever did. The predicate is `stacked`/`seenAs` now and the check is green at 0.000% of 5948 occluding pairs — floor-seating improved it, from 20 of 13328 to 8 of 13446, because a player who is neither tall nor at the back is not an obstacle.

---

## 7. Adoption — done

This section used to list seven one-line changes owed to the genres that had asked for a field and then not been edited to use it. **All seven landed, and then a second wave of eight did** — the vocal group, the bass glide and the hand-drum transition palette, each built in an earlier pass and each sitting unused. They are recorded here rather than deleted because the pattern is worth keeping in view: a field added and not adopted is worse than no field, since the compromise stays in the music while the document says it is fixed.

**The second wave's own lesson is about briefs rather than fields.** It was dispatched from this document, one author per genre, and **three of the eight found their instructions were wrong** — jazz had no choir entry to restore and four revisions of the file prove it; arabic's staging comment was justifying a riser rather than refusing a palette; indian's comments claimed five styles owned a kit that none of them has. Every one of those was caught by an author reading the source instead of the brief, which is the same failure mode §2.1's caveat already names one level up. **Read the code, not this file.**

| wave | genre | change | what it recovered |
|---|---|---|---|
| 2 | country | `stringband` and `honkytonk` take their choir entries back | 399 and 323 singers staged as people, 0 as synths |
| 2 | latin | `conjunto` restores the coro at 5, over the charanga's violins | 88 of 244 pads, 318 singers, 0 miscast |
| 2 | jazz | **refused**, after measuring that it would have worked 53/53 | a big band's sustain is its sections |
| 2 | hiphop | `drill` and `gfunk` glide; 11 bass onsets become 8 | 43.6% and 34.7% of onsets travel |
| 2 | dnb | `techstep`, `neurofunk` and `jumpup`; 43 onsets become 38 | 73.9%, 47.8% and 24.3% of onsets travel |
| 2 | house | `acid` and `speedgarage`; `303-sparse` refuses | 12.5% and 18.2% of onsets travel |
| 2 | indian | 12 styles take `transitions`, 11 refuse | 4,539 shots, 16.0% of seams, 0 kit strokes |
| 2 | arabic | 5 styles take `transitions`, 16 left | a qafla, a walking procession, two refusals |

| 3 | hiphop | `trap` and `drill` roll; `open-trap` and `dotted-drill` refuse | 10,866 rolled strokes, 0 reaching a drummer |

| genre | change | what it recovered |
|---|---|---|
| indian | `breakCarrier: 'pad'`, `break` restored to the palette | 43 silent breaks → 0 |
| indian | `['drums', 2]` and `tradeFours` re-enabled | the *tani āvartanam* and *sawāl-jawāb* |
| arabic | `break` restored to the palette | a gesture dropped to work around the hook bug |
| metal | `POWER` is `{ voices: 2, voicing: 'power' }` | 23.4% tritones, 19.2% register faults |
| metal | `breakCarrier: 'comp'` | a breakdown belongs to the guitars |
| reggae | `dub` states its own `effects` | a dub in the digital era no longer comes out dry |
| rock | the header claiming the power chord could not be spelled | it was false and is gone |
| reggae | `dub` writes `drops: [['none', 2], ['dub', 1]]` | the idiom's defining gesture, 36.5% of songs, median 16 bass onsets gone |
| funk | `minneapolis` writes the same palette plus `dropBars: 2` | 0/200 placement at the default four bars → 200/200 at two |

**Six styles were considered for the drop and refused**, and that list earns its place beside the adoptions. metal `metalcore` is a name collision — its breakdown is announced by silence *at the seam*, and `DROPS.breakdown` removes the two layers a metalcore breakdown is made of. hiphop `breaks` wants everything-but-the-kit, which is a shape `drop.ts` deliberately declined to invent. hiphop `bounce` was feasible at 22/30 and refused musically, because its own header's thesis is one figure repeated for four minutes without a single change. rnb `slowjam` wants the stop-time shape that was rejected on 1047 empty bars, and already spells it with `breakCarrier: 'melody'`. All six synth styles were feasible at 30/30 and `synth/index.ts` refuses in so many words: *"four bars of drum machine alone is a breakdown, which is a later decade's gesture."* And reggae's own `dubpoetry` and `rubadub` record **permanent thinness** rather than subtraction — spraying `dub` across the dub-adjacent styles is exactly the mannerism this section warns about.

Genres taking the **default** `breakCarrier: 'bass'` and needing no change: funk, reggae, latin, country, jazz (its `trio`, `odd` and `fusion` all exclude the comp layer), finnfolk, classical.

---

## 8. What is actually next

**The genre set is complete.** Nineteen genres, 389 styles, 72 eras. The last two — `dnb` and `house` — were written against a §1 with nothing left in it, and they used what had been built for them immediately: house is `breakdown`'s author at 187–200 of 200 placement across eleven styles, and dnb took it on five more.

Both **declined the tempo ramp for the same reason**, which is the most useful thing either of them reported: *a record whose tempo moves cannot be beatmatched*. dnb names it on exactly one style, `breakcore`, at one draw in four. That is a better answer than the feature, and it means the build — a ramp arriving at a drop, the one shape §6 left expressible rather than built — is wanted by neither of the two genres it was expected to serve. It should be built when something actually asks for it.

**The drop has twelve authors**: reggae `dub` and funk `minneapolis`, which reported the gap; ten more across house and dnb. The refusals are in §7 and are the more useful list — nine styles were measured, found feasible, and turned down on musical grounds.

### What is left

Nothing blocks a genre now. What remains, in the order it would repay attention:

**The top four entries on this list and both staging leftovers are gone** — §2.2, §3.16 and the two rooms were the adoption wave in §7, §1.1 closed before it, and §3.15 closed after. **What is left is a tail and nothing else**: no entry below was reported by more than one genre, and none of them removes a technique. That is a different state from the one this section has described at every previous writing, where the head of the list was always something a genre could not play.

1. **§3.17** — no envelope follower, so sidechain is unsayable, and pop's fourth era is *named* after it. Nothing in `Effects` relates two layers at all. Rnb's smaller half of the same entry, a `gate` on `Style.effects`, has a ready-made home in `DrumTrack.voiceEffects`.
2. **§3.19** — compound time, which may be a documentation gap rather than a mechanism one: rnb's `gospelsoul` got 6/8 honestly with `beatsPerBar: 3` and `groups: [6, 6]`, while pop and `doowop` both approximated 12/8 as swing over 4/4 and said so. Somebody should try the working shape on the approximating styles before anything is built.
3. **§3.20** — no object for a person holding a microphone, distinct from §2.2 now that the vocal *group* exists: this one wants the act rather than the instrument.
4. **§1.3** — bass riff span, the one ceiling everybody has learned to write around. Notably the glide adoption did *not* make it worse, because `generateBass` folds a destination into the same span reduce and all three authors kept their destinations inside tones the figure already struck.

**§3.15 closed and left dnb unadopted on purpose**, which is the one live thread out of this pass. That genre reported the gap in the sharpest words — *no stutter, no retrigger, no 32nd roll* — and its idiom wants the mechanism somewhere hiphop's does not: a dnb stutter is a gesture on the *snare* and often across a whole beat rather than inside one sixteenth, which is four rolled strokes in a row here and should be written by somebody who has listened to the records rather than inferred them from trap's. The field is proven and the adoption is a table edit; what it needs is an author, not a mechanism.

**Two mechanical gaps named by the adoption wave**, both small and both with a measurement attached rather than a guess. Indian's dhrupad and vilambit are on ektāl, whose sixes give six onsets where `bandHeads` defines a shot as two to four — a `shots` table per style would fix it, and that author declined to invent a chautāl tihai they had not measured. And `BassHit.glide` cannot begin its travel *late*, which `NoteBend` argues is forced by superdough's envelope having no delay stage; dnb showed the gesture is sayable in two notes, so this wants a second field only if somebody asks with a number attached.

**`breakdown` still has no honest author**, and the measurement explaining why is worth keeping. Its witness is `pad` and it removes `drums` and `bass`, so it needs a dance record with a wash, on a form long enough for three four-bar phrases. The catalogue's dance records are all built on eight-bar sections: **0 of 30 at four bars across all 24 pop styles**. `dancepop` reaches 200/200 at `dropBars: 2`, but two bars of kit-and-bass-gone at 124–132 BPM is under four seconds, and that gap is *already* authored — pop weights the `drop` fill at 4 and its index says "from 1982 onward the commonest thing that happens in the bar before a chorus is that everything stops." Adopting it there would say the same thing twice in two units. The styles that *do* place a four-bar `breakdown` cleanly are latin, classical, synth, indian, arabic and iskelmä, and none of them is a dance record. So it waits for the first house style, which is what it was shaped for.

**Nothing is a blocker any more, and that is a change of state rather than a milestone.** This section used to end by naming tempo ramps as the largest remaining item by blast radius; §1.1 closed, and §8's own top three closed after it. The work that repays attention now is not *unblocking* a genre — it is the sort of thing §7's second wave turned out to be, where the value came less from the fields than from three authors reading source and finding their brief was wrong. **The next useful pass is probably a sweep for stale comments rather than a mechanism**, because this document's own record is that a fixed limitation leaves its apology behind in the code, and every one of those is a future author writing a compromise nobody needs.
