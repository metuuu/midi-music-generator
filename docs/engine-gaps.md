# What the engine cannot say

Ten new genres were written in parallel, one author each, against the `Genre` and `Style` contracts as they stood. Each author was asked to report what they wanted to express and could not. This is that list, merged and de-duplicated, with the evidence each one came with.

It is worth reading as a compliment to the abstraction as much as a critique of it. Nothing here is a genre that could not be built; the seam held, and `generate/` and `render/` needed no changes to absorb arabic, indian, classical and metal. What follows is the set of places where an author had to write a comment explaining a compromise instead of a table expressing an intention — and the useful property of that list is that **most entries were found independently by two or more genres**, which is the difference between a gap and a taste.

Ordering is by what it costs, not by how hard it is to fix.

**A caveat about how this list was made, which two entries have already earned.** These are authors' reports, and an author who could not find a mechanism reasonably concluded there was none. Twice that was wrong: ghost notes (§1.1) and per-section layer selection (§1.2) both exist in some form, on `Feel` and on `Chart` respectively, and the entries have been rewritten to say what is genuinely missing rather than what was missed. Everything below has since been checked against the source. Where a partial mechanism exists it is named, because the shape of the fix is usually *compose with the thing that is already there* rather than *add a second one beside it*.

---

## 1. Blocking the work that is still queued

### 1.1 A style cannot write ghost notes into its own figure

A **ghost note** is a stroke played deliberately below audibility — a snare at a quarter of the backbeat's level, filling the space between the loud hits. It is most of what separates a played groove from a grid with a snare on it, and in a breakbeat, an amen break or a hip-hop kit it is a large fraction of what is actually being heard.

**Ghosts are not absent from the engine, and the first version of this document was wrong to say so.** `Feel` has both halves already:

- `Feel.ghost` — chance an eligible rest gains a ghosted snare or bass note, 0..1
- `Feel.accent` — a per-sixteenth velocity array applied across the rhythm section

What is missing is narrower, and it is a boundary question rather than a missing capability. `Feel` is **deliberately scoped so that it cannot author**: a ghost may land only where its layer is already silent, a bass ghost must repeat the pitch of the note it leads into so it carries no new pitch class, and the whole library is genre-neutral on purpose — *"a feel only one genre could reach would be a style field, which is what we already have and what does not work."* It is drawn per section, probabilistically.

That is the right scope for what a feel is. It is the wrong tool for funk, because there the ghosts are part of the figure's **identity** rather than a groove laid over it — which is exactly the "how" versus "what" line `KitVariation` already draws. A style that says *this figure has ghosts on the e and the a* is making a claim about what the band plays; a feel that says *this section is ghosted* is making a claim about how they play it. Both are real and only the second is expressible.

The mechanical fact underneath: `DrumPattern.voices` is `Partial<Record<DrumVoice, number[]>>` — slot indices and nothing else — and velocity comes entirely from position, in `generateDrums`:

```ts
const strength = accentOf(inBar, slotsPerBar, style.groups);
velocity: opts.machine ? strength : Math.min(1, strength * opts.intensity * rng.float(0.92, 1.05))
```

`BassHit` and `CompHit` both carry an optional `vel`. `DrumPattern` is the only pattern type in `style/types.ts` that cannot say how hard a hit is.

**Evidence.** Funk approximated a breakbeat by writing only the loud strokes and leaving `metricStrength` to accent them, and recorded that in the `breakbeat` header rather than relying on a feel — because a feel that is drawn sometimes cannot be the style's identity.

**Cost of not fixing.** The five genres not yet written — pop, rnb, hiphop, dnb, house — are the five that need this most. Writing them first and retrofitting later means rewriting every drum table in all five.

**Shape of the fix.** An optional `ghosts?: Partial<Record<DrumVoice, number[]>>` on `DrumPattern`, read exactly like `voices` and emitted at a reduced velocity — additive and absent by default, so every existing style generates bit-for-bit identical music. A ghost is a category rather than a point on a continuum, so a second slot list stays readable where a nested per-slot velocity record would not. Needs handling in `varyPattern`, at the fill boundary, and through `cycleHits`.

**It must compose with `Feel.ghost` rather than duplicate it**, and that is the part to think about before writing any of it: a written ghost is the figure, a drawn one is the performance, and a section that gets both should not end up with two ghosts a sixteenth apart.

### 1.2 A layer can enter but never leave, and nothing drops out mid-section

Two things already work here, and the first version of this document missed both.

`Chart` decides **which layers play per section kind** — `chart.layers[kind]`, drawn once for the whole song, deliberately not per section, because the file's own measurements found the answering line present in some choruses and absent from others in 55% of jazz numbers, which is *"an arrangement forgetting itself between one chorus and the next"*. And `chart.enters[layer]` lets an optional layer hold back and arrive at the Nth chorus, which is an arrangement escalating rather than a coin landing differently.

So *horns absent from the verse, present in the chorus, entering at the second one* is expressible today.

Two things are not:

**A layer cannot exit.** `playing()` is `ordinal >= (chart.enters[layer] ?? 0)` — monotonic by construction. A layer that enters is in for the rest of the song. A last verse that strips back to voice and bass after a full chorus is the commonest arrangement gesture in popular music of any kind, and it is unreachable; only the escalating direction exists.

**Nothing drops out *within* a section.** `excludeLayers` is per-style and all-or-nothing, and the chart's granularity is the section kind. There is no way to say *this layer stops for these four bars and comes back*.

**Evidence.** Reggae's dub is the canonical case for the second — bass out for four bars, then everything back, is the single defining gesture of the idiom — and it was approximated with a `break` transition, a filter ramp and a mood's `restraint`. Funk's `minneapolis` wanted the same and settled for one-onset bass tables.

**Why both are worth more than those two genres.** This is the mechanism the layered-ambient goal needs: the README already says the way to make music thin out under speech is to mute layers rather than lower a master bus, and the audition page's layer chips do exactly that at playback time. What is missing is the *composition* being able to say so. A drop in house or dnb is both halves at once — everything exits, then everything returns — and those genres are still to be written.

**Shape of the fix.** The exit half is much the smaller of the two and probably worth doing alone: an `exits` map alongside `enters`, with the same ordinal semantics, keeps the chart's "drawn once, placed rather than re-rolled" discipline intact. Sub-section drop-out is a genuinely new axis and should be designed rather than bolted on — it is closer to `FeelSpan`, which already carries a `from`/`to` bar range, than it is to anything in `Chart`.

### 1.3 Bass riff span is capped at about twelve semitones

`generateBass` places the root within a tritone of MIDI 40 and repairs only by whole octaves, so a figure spanning more than about a twelfth is folded flat at some root positions.

**Evidence, from three genres independently.** Funk hit it on three figures and reworked them to use the ♭7 above rather than below. Reggae's `steppers-octave` declared a span of 17 and was narrowed to 12. Metal's `fifths` figure spanned a nineteenth and `clampToRange` folded 8 bars per style across 11 styles before it was narrowed to a twelfth.

At least it is loud rather than silent: `npm run genres` catches it as *"a riff is the same shape over every chord quality"*. But three of ten authors hit it, and the octave-displaced riff is not an exotic gesture.

### 1.4 A style cannot declare `Effects`

Only `Genre` and `EraProfile` can. Production is mostly an era decision and that is the right default — but not always.

**Evidence.** Reggae's dub is a *production* style, not a rhythm: the same riddim, drenched. It had to borrow the `roots` era's treatment, so a dub drawn in the `digital` era comes out dry. Metal wanted a mid-scoop that `Effects` cannot express at all (see §3.4).

### 1.5 Nothing ramps the tempo

`bpm` is a range drawn once per song.

**Evidence.** Indian's qawwāli accelerates across its length — that is what the form *is*. Finnish folk has the same problem in the pelimanni repertoire. Both wrote it down as a compromise. The genres still queued make this worse: a build in house or dnb is a tempo-and-density ramp, and half of that is unavailable.

---

## 2. Structural, and worth deciding on before the 3D wave

### 2.1 There is no `DrumSource` for a pair of hands on a hand drum

`DrumSource` is `kit | electronic-kit | box | programmed`. `isPlayedByHand` returning **true** drafts a drummer with `DRUM_ARCHETYPE` and a `${bank} kit`; returning **false** files the part as a drum machine. A fifth value gets one of those two wrong answers whichever way it is written.

**Evidence.** Four genres now write `lp`/`mp`/`hp` correctly and stage as a drummer behind a trap kit: arabic's darbuka, indian's tabla and mridangam, latin's congas and bongos, reggae's nyabinghi, finnish folk's frame drum. `core/types.ts` documents the gap where the union is declared.

**What it needs**, per the percussion prep pass: a union value with `DRUM_SOURCE_FROM: 0`, an `Archetype`, a `PlayPoint` resolution, and a model. The `drumkit` model has rows for `lp`/`mp`/`hp` in its `LAYOUT` today and they are honest placeholders — a stroke written now reaches into empty air.

### 2.2 `Posture` has no floor value

`Posture` is `stand | sit | straddle | stool | kit | perch`. `sit` is a chair.

**Evidence, measured by the indian author.** Everything in that genre is performed cross-legged on a carpet with the instrument in the lap. `headAbove` gives `sit` 0.76 × height ≈ 1.33 m where cross-legged is ≈ 0.48 × height ≈ 0.85 m, so the whole ensemble stages half a metre too high, on furniture that is not there — and the tabla player gets a drum throne on a 0.4 m riser. Arabic's takht ensemble has the same problem.

The riser question inverts too: a floor-seated group wants one low continuous platform under all four players, not a 2.8 × 2.0 m drum riser.

### 2.3 `concert-check.ts` only exercises four genres

`CHECKED_GENRES` at `concert-check.ts:167` is the literal `['iskelma', 'jazz', 'ambient', 'synth']`, and it drives **nine** loops — every sounding note producing a gesture, every follow spot naming someone on stage, machine placement and tending, cable routing, keyboard reach, and the drummer's arms.

Ten new genres are invisible to all of it. They are covered only by the staging-coverage sweep, which iterates `GENRE_IDS` and checks that tracks resolve to objects and notes fall inside instrument ranges.

Deriving it from `GENRE_IDS` will roughly quintuple the check's runtime and should be expected to surface real staging failures. That is the point of doing it.

### 2.4 The sampled percussion is loaded and unreachable

`render/strudel.ts` registers `mridangam.json` and `vcsl.json` and describes the first as "the thing `lp`/`mp`/`hp` are an abstraction of". No genre can name either.

Two blockers: `DrumTrack.bank` is composed into `${bank}_${voice}` when emitting Strudel, but both manifests use **bare** sample names — `ta`, `ki`, `dhin`, `na`, `thom` for the mridangam; `darbuka`, `framedrum`, `conga`, `bongo`, `cajon`, `tambourine`, `agogo`, `cabasa`, `clave`, `guiro` for VCSL. And `npm run genres` requires a named bank to appear in `BANK_VOICES`, which is a table of drum machines keyed by that same prefixed convention.

The VCSL half is the higher-value one: it is what would give arabic, indian, latin, reggae and funk real percussion in the audition instead of GM congas.

### 2.5 A power chord is unexpressible

`chooseTones` treats the third as the one tone that never drops. That is correct and well argued for every genre that existed when it was written, and exactly wrong for the one where root-and-fifth *is* the harmony and the modal ambiguity is the point.

A 2-voice tertian voicing of `i` returns root + minor third — the one dyad the repertoire never plays. The only route that never asks for a third is `voicing: 'quartal'` at `voices: 2`, and the metal author measured what that actually produces across its catalogue:

| interval | share |
|---|---|
| perfect fourth (a power chord, inverted) | 68.2% |
| **tritone** | **26.8%** |
| perfect fifth | 3.0% |
| third or sixth, arriving after the voicer | 1.9% |

The third is gone, and a quarter of the genre's chords became tritones. Three scale steps up from a mode's ♭2 or ♭6 is six semitones, and `bII`/`VI` are two of metal's four most-used chords.

### 2.6 `generateDrumSolo` and `applyShot` are hard-coded to a trap kit

`generateDrumSolo` names snare, three toms, kick, hi-hat and crash as literals. `applyShot` writes `bd` + `sd` + `cr`.

**Evidence.** Indian took `drums` out of the solo rotation and set `tradeFours: 0`, which deletes the *tani āvartanam* and *sawāl-jawāb* outright — the two most important structural events in a Carnatic performance. A tihai is exactly a `shot`, and `shotFigures`' metre fallback would resolve to the vibhāg heads for free, but the delivery is three instruments the music does not have.

Fix direction for both: take the orchestration voices from the style's own drum table rather than from a literal.

### 2.7 The `break` transition is hook-dependent

`applyBreak` picks its carrier by asking which layer covers the last bar in sounding time — effectively whether the melody covers a third of it. **The melody is the one part `--hook` rewrites.** So a break fires at one hook level and not at another on the same seed, violating the A/B guarantee that `npm run genres` asserts as *"hook leaves form, key, tempo, instruments and drums alone"*.

It only shows on sparse genres, where melodic coverage sits near the threshold and crosses it when the tune is rewritten.

| style | unstable seeds |
|---|---|
| arabic `fallahi` | 17 / 200 |
| arabic `dabke` | 9 / 200 |
| arabic `longa` | 8 / 200 |
| arabic `zaffa` | 7 / 200 |
| indian (across styles) | 3 / 60 |
| jazz `swing`, jazz `blues`, reggae `flyers` | 0 |

Both arabic and indian dropped `break` from their palettes as the only workaround available to a genre author. Fixing it gives a real gesture back to the sparsest genres.

The fix direction is the one `shots` already takes: decide the carrier from something hook-invariant — the style's own tables or the metre — rather than from the finished tune. `style/types.ts` already explains, under `shots`, why a static table is hook-invariant by construction and a figure taken from the tune is not.

---

## 3. Expressiveness, wanted by one or two genres each

### 3.1 `ending` and `countIn` are genre-level

Both are single values on `Genre`.

Classical wants `button` for 24 styles and `fade` for the nocturne and the impressionist prelude; it gets a chord struck where the sound should stop. Finnish folk is worse — roughly a quarter of its catalogue is archaic material with no downbeat to strike, and it took `button` because two thirds of the styles want it.

### 3.2 `TitleContext` carries no key or mode

It has `style`, `mood` and `bpm`.

Three genres independently wanted the missing field. Arabic's repertoire names its pieces *form plus maqam* — *Longa Nahawand* — and the maqam is a function of the key. Indian's are named for the rāga and the tāla. A large share of real classical titles name a key. All three fell back to imagery or to the form alone, because a randomly drawn maqam name is a wrong label rather than a poetic liberty.

### 3.3 No per-section scale change

A maqam's *sayr* is its habitual path, and a long piece modulates to a neighbouring maqam and comes back. A rāga performance does something comparable. `scaleForChord` is asked per chord and has no section to key on.

### 3.4 `Effects` has no bell filter

Only low-pass and high-pass. Metal's 800 Hz mid-scoop — arguably *the* production signature of 1988 — is unrepresentable, and it was written down in `eras.ts` rather than faked.

### 3.5 `Genre.filter` moves per section; a wah moves per note

Funk declared no `filter` profile at all rather than fake an envelope filter as a section sweep.

### 3.6 `DrumPattern.cycle` is one number for the whole kit

Djent is hands on the bar and feet on a seven. Metal carried the seven on the guitar and bass (`cycle: 7`) and had the kit state the grouping instead.

### 3.7 `metricStrength` always calls slot 0 the strongest

A masurkka's weight is on beat two. Finnish folk did it in velocities instead. Related but distinct from `groups`, which the same genre used successfully for the polska's uneven three — `[5, 3, 4]`, a 40:25:35 division that matches the Nordic fiddle recordings to the nearest sixteenth.

### 3.8 No rubato

`Feel`'s `push` is a fixed millisecond offset per layer — a groove, not a phrase that stretches and gives the time back. Classical left `feels` absent rather than approximate it.

### 3.9 No "the same tune, decorated"

`hook.recall` either replays a phrase or re-composes it. A da capo aria's ornamented repeat is neither.

### 3.10 `WORD_STYLES` has no sargam

An Indian vocal line should be sung on *sa re ga ma pa dha ni* or on a tarānā's *dir ta na dere*. `airy` was used, which reaches *ma*, *na*, *ni* and *re* and holds its vowels, but cannot say a stopped consonant. The indian author called a `sargam` entry the highest-value single addition for that genre.

### 3.11 `makeScale` fixes degree 0 at the tonic, so rotations are unreachable

By design, and the design is right — the right pitch classes with the wrong degree 0 is a different scale. The consequence is that a scale wanted as a *rotation* of an existing row needs its own row.

Currently missing for that reason: **Malkauns** `[0,3,5,8,10]`, **Durga** `[0,2,5,7,9]`, **Hansadhwani** `[0,2,4,7,11]`, **Nikriz proper** `[0,2,3,6,7,9,10]`.

Also missing and wanted by two genres: the **six-note major blues scale**, `[0,2,3,4,7,9]` — major pentatonic with the ♭3 added, both thirds available in one phrase. Country split its claim across four styles that override to the *minor* pentatonic instead, and recorded that what is lost is the mixture itself. Rock has the same tension.

### 3.12 `Style` is not a container

A Finnish *purpuri* is a wedding suite made of other dances. The hook setting and the form buy the feeling of a suite and none of its architecture.

### 3.13 No instrument-tuning concept

Metal expressed drop tunings as register — `layerPlan.offsets.comp: -7`, low key weights — and wrote the limitation down.

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

## 5. Two checks that are measuring the engine, not the genres

Worth separating from the list above, because the correct response is re-baselining rather than a feature.

**`the answer never doubles the tune at the unison or octave by accident`** is an engine-level residual present in every established genre at similar rates — measured over 200 seeds per genre: iskelmä 4/2335 (0.17%), metal 3/3570 (0.084%), rock 6/2930, country 5/2039, jazz 1/1757. It currently reports 1 of 5139 across fourteen genres. It passes or fails at its own 40-seed sample substantially by luck.

**`brass sustains as well as stabs`** was measured at 19–20% against a >20% bar on the same afternoon in both directions. Genres that exclude the brass layer entirely — finnfolk emits zero brass notes — contribute nothing and cannot move it.

Both need a threshold derived from measured output across the widened catalogue, not a loosened one.

---

## 6. Already closed during this pass

Recorded so the list above is read as what remains.

- **`Fabric` was inert.** `clothSurface` derived sheen from colour *saturation* and never read `Look.outfit.fabric`, which is precisely the failure that field's doc comment says it exists to prevent. Now wired at all six call sites with `fabric` required, and the saturation path deleted.
- **Quartal voicings and degree subsets assumed seven notes.** Three scale steps is a fourth only in a heptatonic scale; over the six-note `blues` it was already stacking fifths. Fixed in `voicing.ts` and `surface.ts`.
- **`check-notation.ts` duplicated the drum vocabulary as a string literal** and would have rejected `tb`, `lp`, `mp` and `hp` the first time a style emitted one. Now derived from `DEFAULT_DRUM_MIX`, whose keys the compiler guarantees complete.
- **`performer-look.ts` claimed a missing hair or accessory case was a compile error.** A `switch` in a `void` function is not checked for exhaustiveness, so a new value would have produced exactly the silent silhouette the header said was impossible. Both switches now end in a `never` assignment.
- **Two scale rows were mislabelled** — `hungarianMinor` as Maqam Nikriz (it is Nawa Athar; they share the lower jins and part company above the fifth) and `majorPentatonic` as rāg Durga (it is Bhoopali; Durga is a rotation). Both caught by the genres that use those scales daily.
- **Four genre-keyed tables in `concert/`** — room, wardrobe, blurbs, groove body — became `Genre.staging`, so a genre owns its own staging and `synth`, which had been staging in the fallback house in plain concert dress under "a new one, and nobody has decided about it yet", finally has a room.
