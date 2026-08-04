# What the engine cannot say

Ten new genres were written in parallel, one author each, against the `Genre` and `Style` contracts as they stood. Each author was asked to report what they wanted to express and could not. This is that list, merged and de-duplicated, with the evidence each one came with — **and with what has since been done about it**.

It is worth reading as a compliment to the abstraction as much as a critique of it. Nothing here was a genre that could not be built; the seam held, and `generate/` and `render/` needed no changes to absorb arabic, indian, classical and metal. What follows is the set of places where an author had to write a comment explaining a compromise instead of a table expressing an intention — and the useful property of that list is that **most entries were found independently by two or more genres**, which is the difference between a gap and a taste.

## Where it stands

Fourteen of the twenty-three entries are closed. §6 records them with what was actually built, because in four cases the fix has a different shape from the one this document proposed and the difference is the interesting part.

| | |
|---|---|
| **Closed** | ghost notes · layer exits · `Style.effects` · hand-drum staging · floor posture · check coverage · sampled percussion · power chords · hand-drum solos · the hook-dependent break · five scale rows · and four faults found while fixing those |
| **Open, and blocking** | tempo ramps · sub-section drop-out · bass riff span |
| **Open, structural** | `applyShot` and the fill vocabulary are still kit-only · no vocal-group archetype · a solo is named after a kit whatever plays it |
| **Open, per-genre** | everything in §3 and §4 |

**A caveat about how this list was made, which four entries have now earned.** These are authors' reports, and an author who could not find a mechanism reasonably concluded there was none. Twice that was wrong at the time of writing — ghost notes and per-section layer selection both existed in partial form, on `Feel` and on `Chart` — and twice more the *fix* revealed the framing was off: the hand drum did not want a `DrumSource` at all, and this document asserted a sightline check that did not exist. Where a partial mechanism exists it is now named, because the shape of a fix is usually *compose with the thing that is already there* rather than *add a second one beside it*.

---

## 1. Open, and blocking the work that is still queued

Five genres remain unwritten — pop, rnb, hiphop, dnb, house — and these are what they will hit.

### 1.1 Nothing ramps the tempo

`bpm` is a range drawn once per song, at `generate/song.ts:191`, and used as a scalar everywhere after.

**Evidence.** Indian's qawwāli accelerates across its length — that is what the form *is*. Finnish folk has the same problem in the pelimanni repertoire. Both wrote it down as a compromise. The unwritten genres make it worse: a build in house or dnb is a tempo-and-density ramp and half of that is unavailable, and a hip-hop record that drifts is a different thing from one that does not.

This is now the largest single blocker, and it is not small — the tempo reaches the IR, both renderers and the concert clock.

### 1.2 Nothing drops out mid-section

Half of this entry is closed — see §6 — and the harder half is not.

`excludeLayers` is per-style and all-or-nothing, and `Chart`'s granularity is the section kind. There is no way to say *this layer stops for these four bars and comes back*.

**Evidence.** Reggae's dub is the canonical case: bass out for four bars, then everything back, is the single defining gesture of the idiom, and it was approximated with a `break` transition, a filter ramp and a mood's `restraint`. Funk's `minneapolis` wanted the same and settled for one-onset bass tables. A **drop** in house or dnb is this and the exit rule together — everything leaves, then everything returns.

**It is also the mechanism the layered-ambient goal needs.** The README already says the way to make music thin out under speech is to mute layers rather than lower a master bus, and the audition page's layer chips do exactly that at playback. What is missing is the *composition* being able to say so.

**Shape of the fix.** Genuinely a new axis; do not make `Chart`'s ordinal fractional. It is closer to `FeelSpan`, which already carries a `from`/`to` bar range. The agent that built `exits` left two things for it: everything downstream of `Section.activeLayers` has now been exercised against sections thinner than their neighbours and came through clean at a 24% rate, and **the melody guard is a ready-made safety rule** — a layer may only be removed where something else is guaranteed to sound. A drop will hit that wall much harder, because it removes layers for bars rather than for sections.

### 1.3 Bass riff span is capped at about twelve semitones

`generateBass` places the root within a tritone of MIDI 40 and repairs only by whole octaves, so a figure spanning more than about a twelfth is folded flat at some root positions.

**Evidence, from three genres independently.** Funk hit it on three figures and reworked them to use the ♭7 above rather than below. Reggae's `steppers-octave` declared a span of 17 and was narrowed to 12. Metal's `fifths` figure spanned a nineteenth and `clampToRange` folded 8 bars per style across 11 styles before it was narrowed to a twelfth.

At least it is loud rather than silent: `npm run genres` catches it as *"a riff is the same shape over every chord quality"*. But three of ten authors hit it, and an octave-displaced riff is not an exotic gesture.

---

## 2. Open, and structural

### 2.1 `applyShot` and the fill vocabulary are still kit-only

Half of §2.6 is closed — `generateDrumSolo` now takes its orchestration from the style's own table — and this half is not.

`applyShot` writes `bd` + `sd` + `cr`, hard-coded. `generate/fills.ts` and `KitVariation` are the same. So a genre with no kit gets kit strokes in the one place it cannot refuse them.

**Measured**, by the agent that generalised the solo: after its change, kit strokes written inside a hand-table drummer's own solo blocks fell from 2054 to **9** across 120 songs per genre — and all nine survivors are 3 stray `oh` in arabic and 6 stray `cr` in latin, arriving from fills and shots rather than from the solo generator.

A **tihai** is exactly a `shot`, and `shotFigures`' metre fallback already resolves to the vibhāg heads for free — so indian would get one the moment the delivery stopped naming three instruments that music does not have. That agent also wrote a check for this, `a hand-drum genre never sends for a kit`, confirmed it fails on those nine, and left it out rather than commit a red check. It should go in with the fix.

### 2.2 There is no archetype for a vocal group

`ARCHETYPE_OF` stages every choir patch — `choirAahs`, `voiceOohs`, `synthChoir` — as a **synthesiser**, because there is nowhere else for them to go. That is right for 1985 and wrong for 1932.

**Evidence.** It cost country's string-band era its documented vocal-quartet pad when the pre-electronic rig anachronism was fixed: the era comment said *"the pad is people"*, and the only honest substitute available was a pump organ. It is also relevant to gospel, doo-wop, barbershop and the close-harmony styles country already writes.

Needs an `Archetype` member, an `ArchetypeSpec`, a model (probably several singers reusing the existing `singer` builder rather than a new object), and an `ARCHETYPE_OF` remap gated on era year — a 1932 quartet and a 1985 synth choir are genuinely different objects sharing a GM programme.

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

### 3.10 `WORD_STYLES` has no sargam

An Indian vocal line should be sung on *sa re ga ma pa dha ni* or on a tarānā's *dir ta na dere*. `airy` was used, which reaches *ma*, *na*, *ni* and *re* and holds its vowels, but cannot say a stopped consonant. The indian author called a `sargam` entry the highest-value single addition for that genre.

### 3.11 The Japanese pentatonics still have no rows

The general problem — `makeScale` fixes degree 0 at the tonic, so a rotation needs its own row — is closed for the five scales that were blocking genres (§6). One set was deliberately left:

`koto`, `shamisen` and `dantranh` all have ranges and concert archetypes, and **no genre in the catalogue plays any of them**. Two reasons not to guess: hirajoshi is a *tuning* before it is a scale and there is no tuning concept (§3.12), and hirajoshi/iwato and kumoi/in-sen are two rotation *pairs* — so a Japanese genre will want four rows chosen together rather than one guessed in advance.

### 3.12 No instrument-tuning concept

Metal expressed drop tunings as register — `layerPlan.offsets.comp: -7`, low key weights — and wrote the limitation down.

### 3.13 `Style` is not a container

A Finnish *purpuri* is a wedding suite made of other dances. The hook setting and the form buy the feeling of a suite and none of its architecture.

### 3.14 `Attachments` exposes only `head` and `torso`

So a wrist accessory — studded wristbands, a watch, tape — has nowhere to anchor. Metal and the costume pass both stopped at this rather than thread a new anchor through `performer.ts` and `performer-arms.ts`.

---

## 4. Small warts

- **`drumBanks` is required even for a genre with no percussion.** Classical names `AkaiMPC60` in all four eras purely to satisfy the type; it never plays.
- **A style with `excludeLayers: ['drums']` still needs a non-empty `drums` table**, because `generateSong` draws the figure before it knows about exclusions and an empty array throws in `rng.weightedBy`. Ambient solved it with a `NO_KIT` placeholder and country copied the trick.
- **`keyChangeChance` couples two gestures** — a bridge in the dominant with a prepared pivot, and a final section a semitone up. A genre wanting one gets the other at half the rate.
- **`growForm` only trims to five steps**, so the shortest piece finnfolk can generate is a little over four minutes — too long for a lament.
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

**§ A style could not declare `Effects`.** `Style.effects`, merged `instrument > style > era > genre`, per key. The style goes **over** the era: an era is an average over a decade, a style is a member of that average, and an average does not overrule a member of itself. The decisive test is that under the other order the field would do nothing at all for `dub`, which is the only reason it exists.

**§ The hand drum.** Solved with a different shape from the one proposed here, and a better one. A `DrumSource` would have had to answer for the whole part at once, and a third of the patterns writing hand voices write kit voices in the same bar — funk's `congas`, latin's `cumbia-kit`, reggae's `roots-rockers`. Those are not a drummer choosing between two instruments, they are two people. So the split happens **on the voice**, in three tiers: `kit`, `hand`, and `either` for the auxiliary pieces that genuinely exist at both stations. That middle tier is what makes it work — every arabic `maqsum` is hand strokes plus a riq on `tb`, and with two tiers that `tb` would have conscripted a full acoustic kit.

**§ `Posture` had no floor value.** `floor` is a **conjunction**: `ArchetypeSpec.lap` says whether an object can be played from a carpet, and `FLOOR_SEATED` in `cast.ts` says whether this band sits on one — because the object under a funk conga player and the one under a tabla player are the same object. Two entries only, sitar and hand drum, and the restraint is the finding: 15 of the 23 archetypes indian and arabic stage are *borrowed* objects, so putting a concert vibraphone on a carpet stages the wrong instrument and puts it where it cannot be played. Riser goes to zero and the player moves downstage, since height and depth trade off from a camera 11 m out. `sitar.ts` had carried an apology recording that its boards-measured constants were shrunk onto a chair only because there was no floor posture; they are back.

**§ `concert-check.ts` only exercised four genres.** `CHECKED_GENRES = GENRE_IDS`. It immediately surfaced three real staging faults, all now fixed — see below.

**§ The sampled percussion was loaded and unreachable.** `SAMPLE_RACKS`, a table parallel to `BANK_VOICES`. **A rack is not a bank**, and the decisive reason is addressing: `.bank()` is implemented by prefixing, VCSL's names are bare, and a folder there is an *instrument* rather than a voice — `darbuka` is twenty recordings (five strokes × two velocities × two round-robins) and a voice needs a name *and an index*, which a bank table has nowhere to put. Racks ride on a machine and claim the auxiliary voices; there is deliberately no rack-only form. Levelled by measurement, because VCSL runs from −17 to −39 LUFS and a conga at unity is inaudible; the meter was cross-checked against numbers already in `source-levels.ts` (kick spread 13.0 dB against the recorded 13.2).

**§ A power chord was unexpressible.** A `'power'` `VoicingStyle`, built beside `chooseTones` rather than inside it — `chooseTones` does *selection* and its "the third goes last" rule is right and untouched, while a power chord is a **shape** built on a chord rather than out of one. Across metal's catalogue: tritones **23.4% → 0.1%**, perfect fifths **2.0% → 89.8%**, and a metric the original table never measured — comp onsets carrying a register-limit complaint, **19.2% → 1.2%**, because `voiceQuartal` is the one routine in that file that never consults `minInterval`.

**§ `generateDrumSolo` was hard-coded to a trap kit.** Orchestration now resolves from the style's own table through the same `drumStations` split casting uses. Four gestures generalise — state-then-answer, the run down the drum, the weight under the phrase, the run-in to the ending — and two do not: the hi-hat is a **limb** and `ARCHETYPES.handdrum` has no pedal, and a cymbal rings where a skin does not. A darbuka lands the band on a doum instead. A table naming both tiers solos on the kit, because those are two players. Arabic `dabke`, 16-bar chorus: **8 voices of trap kit in a takht → 4**.

**§ The `break` transition was hook-dependent.** The carrier is named rather than searched. The finding that shaped it: **nothing pitched is hook-invariant** — `--hook` moves the harmony, so every pitched layer follows the chords and the bass differed at 39 of 40 seeds. So no note may be read at all. The musical argument stands on its own: *"whoever filled the bar"* was already wrong with no `--hook` in sight, giving the same style a bass break in one song and an answering line in the next, and once producing a break carried by a single 32nd note 0.03 beats before the downbeat. Unstable seeds **53/1484 → 0**.

`Style.breakCarrier` followed, and closes the five residuals: indian's tanpura writes six notes into eight bars and has stopped three bars before the seam, so 43 of 10517 drawn breaks came out silent. Under `pad` — the śruti box, which is what is still ringing — that is **0**. `melody`, the tempting choice for a taqsim, is 24× worse.

**§ Five scale rows.** `durga`, `malkauns`, `hansadhwani`, `nikriz` proper, and the six-note `majorBlues` that country and rock both wanted and neither could spell. Four more were argued for and **rejected**, which is the more useful half: the altered scale is already melodic minor a semitone up and *"that is how the players think of it"*; nothing in `ChordQuality` could ever select a lydian dominant, so the chord quality would have to come first; `prometheus` is one composer's chord and `wholeTone` already holds that job.

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

## 7. Adoption still owed to the genres

The fields exist; the genres that asked for them have not been edited to use them. Each is a one-line change and each undoes a compromise recorded in a comment.

| genre | change | what it recovers |
|---|---|---|
| indian | `breakCarrier: 'pad'`, restore `break` to the palette | 43 silent breaks → 0 |
| indian | re-enable `['drums', 2]` and `tradeFours` | the *tani āvartanam* and *sawāl-jawāb*, deleted outright |
| arabic | restore `break` to the palette | a gesture dropped to work around the hook bug |
| metal | `POWER` becomes `{ voices: 2, voicing: 'power' }` | 23.4% tritones and 19.2% register faults |
| metal | `breakCarrier: 'comp'` | a breakdown belongs to the guitars |
| reggae | `dub` states its own `effects` | a dub in the digital era currently comes out dry |
| rock | the header reading *"The power chord, which this file cannot spell"* | it is now false |

Genres wanting the **default** `breakCarrier: 'bass'` and needing no change: funk, reggae, latin, country, jazz (its `trio`, `odd` and `fusion` all exclude the comp layer), finnfolk, classical.
