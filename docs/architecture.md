# Architecture and output

*Reference, rewritten 2026-08-09 against the source. Every number below was re-derived rather than carried over; where a count looked like it would age badly it has been replaced with the mechanism that makes it unnecessary. The previous revision described a four-genre project and was two months and fifteen genres out of date, which is the failure this header exists to make visible.*

## The shape of it

```
src/core/       pitch, scales, chords, roman numerals, voice leading, the rule
                table, the tempo grid, Song IR
src/style/      shared vocabulary — Style, EraProfile, Mood, feel, delivery,
                voice signatures, the instrument catalogue
src/genre/      per-genre content: nineteen folders, seven files each
src/tune/       the melody engine — motif, skeleton, surface, judge, key plan
src/generate/   form, harmony, accompaniment, drums, fills, dynamics, drops,
                transitions, filter sweeps, tempo, solos, vocals
src/render/     midi.ts (ships)  ·  strudel.ts (auditions)  ·  drum banks
src/concert/    Song IR → Performance IR — casting, staging, choreography,
                lighting, showbill
src/web/        the browser pages  ·  audio.ts owns the Strudel transport
src/web/concert/  the 3D renderer — rooms/, instruments/, performer, lights
```

The generator produces a neutral **Song IR** — sections, tracks of note events, a drum track — and nothing below that line knows about Strudel, MIDI or Web Audio. Every renderer consumes the same IR.

**The melody is composed in `src/tune/`, not in `src/generate/`.** That split is deliberate and enforced: the tune engine is a derivation — a motif, a skeleton, a surface, and a judge that scores candidates — developed with no access to the rest of the generator. `generate/song.ts` calls into it through `tune/adapt.ts` and patches the band around what comes back. See [`tune-plan.md`](tune-plan.md) for the model and for the four places the plan was wrong.

## Three renderers, one IR

| | | Reads |
|---|---|---|
| [`render/midi.ts`](../src/render/midi.ts) | **ships** | notes, velocity, GM programs, the effects GM can carry |
| [`render/strudel.ts`](../src/render/strudel.ts) | auditions | the same, plus the audition-only effects, as Strudel source text |
| [`concert/`](../src/concert/) → [`web/concert/`](../src/web/concert/) | watches | the same, as a band on a 3D stage |

The third one is the argument for the first two being separate from the IR at all: a `Song` is enough to *stage* the music — who is playing, which hand, on what, under which light — and none of that required the generator to know a stage exists. See [`concert.md`](concert.md).

## Adding a genre

A genre owns everything culturally specific: styles, eras, moods, titles, forms, keys, a vocal profile, a default constraint level, a default repetition level, an ending, whether a band counts the music in, optional per-layer mix and effects, any rules it disagrees with, a chord-scale rule, and — since the staging tables moved out of the renderer — its own room, wardrobe and programme copy. Add a folder under `src/genre/` and register it in [`src/genre/index.ts`](../src/genre/index.ts). Nothing in `generate/`, `tune/` or `render/` needs to change.

A folder is one file per kind of decision — `styles.ts`, `eras.ts`, `moods.ts`, `titles.ts`, `vocals.ts`, `staging.ts` — and an `index.ts` that assembles them into a `Genre`. **Seven files.** `staging.ts` is the newest of them and it arrived for a reason worth stating, because it is the clearest case in the project of a shape that was right and stopped being right: the room, the wardrobe, the programme copy and the groove weight lived in four genre-keyed tables inside `concert/`, and with four genres that was genuinely the better arrangement — three rooms read side by side are *comparable*, and comparison is the only way to tell whether two decades of the same room are actually different. At nineteen it inverts. A table every author has to edit is not a table, it is a registry, and a registry inside the renderer means adding a genre touches four files that belong to nobody. The proof it had already gone wrong was `synth`: the most recent genre at the time appeared in none of the four tables and staged in the generic house, in the plain dress whose own comment says it is dull on purpose, under a programme line reading *"a new one, and nobody has decided about it yet"*. Every fallback worked exactly as designed and the result was a genre nobody had finished.

The catalogue is **nineteen genres, 389 styles, 72 eras and 131 moods** — `npm run gen -- --help` prints the authoritative list and is where those four numbers came from.

### The chord-scale rule

`scaleForChord` answers "given this chord, where does the melody get its notes?" — key-relative for iskelmä, chord-relative for jazz, drone-relative for ambient. That one function is most of what makes those three sound like different music rather than the same music with different chords, and for a long time the doorway test for a new genre was whether it had a fourth answer.

**That test is retired, and how it died is the more useful thing to know.** It was written when a genre was an expensive object and there were four of them. Nineteen genres in, the question a new folder has to answer is not "is your chord-scale rule novel" — most of them reasonably borrow one — but the ordinary one of whether the *tables* say something the catalogue does not already say. The mechanism outlived the test in two directions, and both are the shape a genre should reach for before it considers the function:

- **`Style.scaleForChord` overrides the genre's.** A genre no longer has to hold one answer for its whole catalogue, which is what forced the original framing.
- **`scaleForChord` takes an optional `SectionKind`.** That argument is the seam a maqam's *sayr* needs: the piece states its maqam on the refrain, leaves for a neighbour and comes back. It is optional because a genre that ignores it — which is eighteen of the nineteen — answers exactly as it did before the argument existed, and because the one genre that wanted it measured where the mechanism *stops*: indian read it, measured it and declined, on the grounds that its gesture lives inside a phrase rather than at a section boundary. Arabic's own `taqsim` declined on the same argument, reached independently.

`ruleOverrides` is the other thing a genre is expected to have an opinion about. The rule table is shared, is twenty rules long, and comes from classical voice-leading practice, so a genre says which of it it does not hold — jazz turns the leading-tone and chromatic-tone rules off outright because a bebop line is chromatic by vocabulary rather than by defect. **Eighteen of the nineteen carry a table; iskelmä is the one that carries none**, and that is the fact worth remembering rather than any individual genre's entry count. The shared rules were derived from the practice iskelmä sits closest to, so an empty override table there is not an omission — it is the genre agreeing with the default, and it is the calibration point everybody else is measured against. See [`smoothness.md`](smoothness.md#do-genres-share-the-rules).

## What the IR carries

Most of the mechanisms below did not exist when this file was last accurate, and a reader who assumes the IR is notes-plus-velocity will write a compromise for each one. They are listed together because they share a property: every one of them is a *style-level* or *track-level* declaration rather than a genre special case, and every one arrived because an author wrote a comment explaining a workaround instead of a table expressing an intention. [`engine-gaps.md`](engine-gaps.md) is that list of comments and is the best single account of why each exists.

**Tempo is a map, not a number.** `SongMeta.tempo` is a `TempoMap`; `bpm` used to be a range drawn once per song and used as a scalar everywhere after. Qawwāli accelerates across its length because that is what the form *is*, and the pelimanni repertoire has the same problem. It was the largest change in the project by blast radius — the tempo reaches the IR, both renderers and the concert clock, and those four consumers did not agree about what a tempo is. `Style.tempoRamp` is how a style asks for one, and the most useful thing reported about it is a refusal: dnb and house both declined, because a record whose tempo moves cannot be beatmatched.

**Layers leave and come back.** Two mechanisms at two scales, and they are not the same axis. `Chart.exits` takes a layer away from an ordinal onward — the section-shaped version, where colour is subtracted as a form progresses. `Style.drops` with `dropBars`, driven by `generate/drop.ts`, is the bar-shaped one: bass out for four bars and then everything back is the single defining gesture of dub, and it was previously approximated with a break transition, a filter ramp and a mood's restraint. This is also the mechanism the layered-ambient goal needs — the README has always said the way to thin music out under speech is to mute layers rather than lower a master bus, and what was missing was the *composition* being able to say so.

**The kit got quieter and more detailed.** `DrumPattern.ghosts` places unaccented strokes; `rolls` subdivides below a sixteenth, read only where `DrumTrack.source` is `programmed`, because a roll of that speed is a machine gesture. `DrumTrack.voiceEffects` treats one voice at a time, and it is the project's cautionary tale about unused fields: it was read by the Strudel renderer and written by nothing across all nineteen genres, while four files in two genres cited it as the field that exists for the gated snare. It is now writable from `Genre`, `EraProfile` and `Style`, and the adoption is a closure rather than another dead field because it *deleted its own workaround* — rock's `arena` had spelled the gate as a whole-kit reverb with the ceiling pulled down, and that number is gone rather than sitting beside the real one. `SAMPLE_RACKS` is the other half of the percussion vocabulary, for banks that are sampled rather than synthesised.

**The bass slides.** `BassHit.glide` and `glideTime` — a destination folded into the figure's own span, so a glide costs a reach the same way a struck note does. It is also the project's first control grid whose values can be negative, which broke `check-notation.ts`: that file validated grid tokens with `/^\d+(\.\d+)?$/`, so the day a style first wrote a downward glide, 644 perfectly good bars were reported as unparseable by the check whose whole job is to be believed.

**Sidechain is in the IR and in both renderers.** `Effects.duck` and `duckBeats` — a periodic gain reduction keyed to the kick by name rather than by search, on the reasoning that a rule which *searches* for its trigger gives the same style a kick-keyed duck in one song and a clap-keyed one in the next.

Two smaller vocabulary additions carry more than their size: `VoicingStyle: 'power'`, because a fifth with no third is a chord the voicing engine could not previously spell, and `Posture: 'floor'` — cross-legged on a carpet with the instrument in the lap, which is how a sabhā seats a sitarist and a tabla player and which the stage had no way to express.

**`TitleContext` carries `tonic` and `mode`.** Three genres independently wrote down the same missing field rather than guessing: arabic names an instrumental piece form-plus-maqam and the maqam is a function of the tonic, indian announces the rāga and which of a style's two rāgas a piece is in is decided by the mode alone, and classical names the key outright. The type takes two numbers rather than a label, deliberately — classical's objection was that a key field *"would put a spelling decision (is it C♯ or D♭?) into a type"*, and the answer is that `keyLabel` had been deciding exactly that for every song in the project since before the objection was written, three lines below the call that refused it.

**Styles override what used to be genre-wide.** `effects`, `breakCarrier`, `scaleForChord`, `ending`, `countIn`, `tempoRamp`, `drops` and `dropBars`. The pattern is the same each time and is worth internalising before adding a genre-level field: a genre holding both a dance band and an unmetred lament cannot answer for both, so the answer moves down a level and the genre's own value becomes the fallback rather than the law.

## Mix and effects

`Track.effects`, `DrumTrack.effects` and `Song.space` are part of the IR, not of a renderer. Reverb and delay are modelled as **sends into one shared space** — the room has a size, each track has a distance — because that is how a mixing desk works and how MIDI works, where CC91 is a send to the synth's single global reverb.

Only what a delivery format can carry is expressed. `reverb` and `pan` are GM level 1; `lowpass` and `resonance` are GM2/GS and documented as such; `delay`, `highpass`, `drive`, `crush`, `phaser`, `glide` and `swell` have no GM controller and are marked audition-only rather than smuggled through an arbitrary CC.

Levels come from `Genre.mix` (per layer, `drums` included) and `Genre.drumMix` (per voice inside the kit, merged over `DEFAULT_DRUM_MIX`). The per-voice table used to live in the Strudel renderer, where MIDI could not see it; both renderers apply it now, so the audition and the shipping file agree about how loud the hats are. A kit shares one MIDI channel, so per-voice level goes into note velocity there.

Effects are resolved **era over genre, with the style over both**, per layer, and an instrument's own delta merged last — that is what an electric violin is, and a 1990s desk cannot un-electrify one. Genres that define none render exactly as dry as before.

## Layers

Every song is built from named layers: `drums, bass, comp, pad, brass, counter, melody, vocal`. Each becomes a separate MIDI track. To make music thin out under speech, mute layers rather than lowering a master bus — that is what the audition page's layer chips do, and `Chart.exits` and `Style.drops` are how a *composition* says the same thing.

`vocal` is the one that is only present on request (`--vocals`), and the one a renderer has to be told about: its notes carry vowels, consonants and ties, and `Track.voice` is what says the track is sung rather than played.

Everything is deterministic: **a seed reproduces a song exactly**, so a whole station can be stored as a list of seeds rather than as audio.

## The stage

`src/concert/` turns a `Song` into a `Performance` and `src/web/concert/` draws it. Two collapses hold that renderer together, and they are the same idea applied to different nouns — a *catalogue entry* is what something is, an *archetype* is what kind of object it is one of.

**Instruments.** `ARCHETYPE_OF` is a total record mapping **126 catalogue sounds onto 20 archetypes**, because a tenor and a baritone saxophone are one object at two sizes and eight synth pads are one keyboard. The builder registry holds 24, the extra four being `drumkit`, `handdrum`, `singer` and `vocal-group` — cast from the drum track and from `Track.voice` rather than from the pitched catalogue. Both records are total by type, so adding a sound without saying what it looks like is a compile error rather than a grey box on stage. `SCALE_OF` is the other half of the honesty: collapsing four saxophones onto one model is only defensible if the model can be four sizes.

`vocal-group` is the newest archetype and it exists because every choir patch was staged as a synthesiser — right for 1985 and wrong for 1932. It is not the singer, and the distinction is the reason it exists: `singer` is the act, cast off `Track.voice`, with words; a vocal group is an instrument the arranger scored, playing an ordinary pitched track, and it is several people because a chord is several people.

**Rooms.** Each architecture is a file exporting a `RoomBuilder` — a `shape()` and a `build()` — registered in a `Record<RoomStyle, RoomBuilder>`. Before that, `stage.ts` built one rectangular proscenium with four boolean modifiers, and a concert hall, a courtyard, a barn, an arena and a dancehall were **architecturally the same box in different paint**. The genre authors were not at fault: a room could carry colours, props and a fog number, so data was all the system could accept.

The collapse is real and is the reason `architecture` is a separate field from the room `id`: **nineteen genre rooms stand up on twelve architectures**, because a ballroom, a dancehall and a salon are one big room with a floor in it, and a riihi and a shed are one long roof. Keying the builder on the room id instead would mean writing that room three times or importing one room into another, and the second is how a directory of parallel authors turns back into a file they all have to edit.

Naming no architecture gets the proscenium, and the previous revision of this file quoted that fallback as *"thirteen of the fourteen rooms"* — a number that has since been wrong twice. **Three genres still take it: ambient, iskelmä and jazz.** Those three are the oldest rooms in the project, the ones predating `RoomStyle`, and every room written since has named its building; the number fell because sixteen authors named a room, not because the fallback stopped being needed. Naming the three rather than counting them is deliberate, and the general rule this file now tries to follow: a bare count of *how many things take the default* ages every time anybody adds anything, where the list of holdouts changes only when one of them is actually changed.

**Clothes.** `Look.outfit` was four colours and a fabric, and every performer in every genre was the same lathe with a different dye. `Garment` is eight silhouettes now — suit, tails, coat, robe, gown, drape, waistcoat, shirtsleeves — dispatched from `performer-garments.ts` with a `legsOf()` contract so the legs know whether there are trousers at all. `HairProfile` is the related fix and the more instructive one: hair and head furniture used to be independent functions adding geometry to the same head, so every hat in the union disappeared inside an afro. `buildHair` returns a profile **measured off the built group rather than tabulated**, because a table saying "a beehive is 2.83 R" is true right up until somebody improves the beehive.

## Checking it

```bash
npm run verify     # all of the below, in order
```

| | |
|---|---|
| `npm run typecheck` | `tsc --noEmit`. The totality of the archetype, room and prop registries means this catches a missing model. |
| `npm run genres` | the big one — per-genre assertions over generated catalogues |
| `npm run check` | notation: every grid token the renderers emit is parseable |
| `npm run concert` | staging: sightlines, reaches, cables, postures |
| `npm run rules:check` | asserts [`rules.md`](rules.md) is what `npm run rules` would write |
| `npm run audit` | the melody as a *line* — does a batch actually obey the rules its style tables claim to encode |
| `npm run ensemble` | the same batch *vertically* — are the voicings playable chords or clusters, do comp and pad stay out of the tune's register |

**And two benches, which are worth more than they look.** `/looks.html` draws every hair style, every accessory, every accessory crossed with every hair, every fabric and every genre's wardrobe through the real casting path; `/models.html` is the same for instruments. They exist because sixteen hair styles, twenty accessories and fifteen fabrics had been written, verified against geometric assertions, shipped, and never actually looked at — the only way to see one was to start a concert and hope the camera cut to it. The costume bench **found eighteen faults on its first run**, including a hood whose face-hole was over the right ear and a fabric that exists to look expensive being the darkest thing on stage. The lesson is one line and it generalises past this repo: an assertion catches what you thought to assert, and a bench catches the rest.

## Producing audio

### 1. Batch-generate

```bash
npm run gen -- -n 40 --genre iskelma --era tanssilava --mood nostalginen --seed radio-a --out ./out
```

Writes `NN-title.mid`, `NN-title.strudel.js` and `manifest.json` (title, seed, genre, key, BPM, duration, form, instruments per song).

### 2. Render to audio offline

The MIDI is General MIDI with drums on channel 10, so any GM soundfont works:

```bash
fluidsynth -ni GeneralUser-GS.sf2 out/01-kesan-tie.mid -F out/01.wav -r 48000
```

Then batch-convert to OGG/Vorbis for whatever plays it back. A better soundfont is the single biggest quality win available — the GM accordion and string ensemble in a good bank sound dramatically more convincing than the webaudiofont defaults.

### 3. Or drive a runtime sampler

`manifest.json` plus the MIDI gives you per-layer tracks as separate MIDI tracks. If you want the music to thin out under speech, mute layers rather than lowering a master bus — that is the same mechanism the audition page's layer chips use, and it is the hook for layered-ambient playback.
