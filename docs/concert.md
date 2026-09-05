# The Concert

**A band walks out on a 3D stage and plays the music the generator just wrote.** Hands hit the drums the drums are actually being hit on.

```bash
npm run dev        # /concert, and the two benches at /looks and /models
npm run concert    # the 53 correctness checks this page describes
```

See [`concert-plan.md`](concert-plan.md) for the reasoning, the alternatives that were rejected, and the contracts as they were settled before any of it existed.

## The one architectural claim

**The visuals are a third renderer of the Song IR, not a feature of the audio player.**

`render/midi.ts` ships and `render/strudel.ts` auditions, both sitting behind an IR that knows about neither. The stage is the third: [`src/concert/`](../src/concert/) turns a `Song` into a **Performance IR**, and a three.js runtime under [`src/web/concert/`](../src/web/concert/) plays *that*.

Nothing in `src/concert/` may import three.js, Strudel or the DOM. That is not tidiness — it buys three specific things:

- **The visuals cannot cheat.** A choreographer that can only see `NoteEvent[]` has no path by which a nice-looking animation quietly changes what is heard. "Generated from the MIDI, not the other way round" becomes structural rather than a promise.
- **It ports.** A native engine consuming the Song IR gets the staging for free. A concert is also the most demanding test there is of whether the IR carries enough to drive something other than audio: if a drummer's left hand cannot be placed from it, the IR is missing something, and this is where that gets found out.
- **It is testable without eyes.** Everything is data, so `npm run concert` asserts that no hand teleports, that every sounding note has a gesture, and that no two players are standing in the same place. Nobody is going to watch three hundred generated concerts; if the hands are only checked by looking at them, they are not checked.

The third claim has one honest exception and it is large: the *geometry* is not data, and everything the renderer draws sits outside it. That is what the two benches are for, and it is the section of this document to read first if you are about to change anything you can see.

## The pipeline

```
setlist → venue → per number: cast → solos → choreography, groove,
                              visemes, lighting → bill
```

That order is a dependency order, not a preference. Casting comes first within a number because everything after it needs performer ids; lighting comes last because a follow spot has to know both who is soloing and that they exist.

| | What it decides |
|---|---|
| [`setlist.ts`](../src/concert/setlist.ts) | which numbers get played and in what order — style, mood, key, length and smoothness per slot, programmed for contrast |
| [`venue.ts`](../src/concert/venue.ts) | the room: the genre names the building and dresses it, era shifts the palette and the fixtures |
| [`cast.ts`](../src/concert/cast.ts) | who is on stage, what they look like, where they stand |
| [`choreograph.ts`](../src/concert/choreograph.ts) | which limb plays which note, where, how hard, and when it has to start moving |
| [`groove.ts`](../src/concert/groove.ts) | what a body does while the music happens, playing or not |
| [`visemes.ts`](../src/concert/visemes.ts) | the singing face |
| [`lighting.ts`](../src/concert/lighting.ts) | the form, read as light |
| [`showbill.ts`](../src/concert/showbill.ts) | what the programme says |

`buildConcert(opts)` in [`index.ts`](../src/concert/index.ts) is the whole of it in one call: give it a seed and it returns a complete show as plain data. `opts.song` stages one exact piece of music instead of programming a set, which is how the audition page's **Watch on stage** button hands over the song you are already listening to.

## Conventions, fixed once

Stated here because half the bugs in any staging system are one of these sentences being re-derived differently in two places.

- **Space** — metres, origin at stage centre on the boards. `+x` is the *audience's* right, `+y` is up, `+z` is downstage. Stage-left and stage-right are avoided throughout, because they are relative to a performer who may be facing the other way.
- **Handedness follows from that.** With `+z` forward and `+y` up, `right = forward × up` puts a performer's right side at local `-x` — so a right-handed kit has its hi-hat at `+x` and its ride at `-x`. Two independently built systems derived this and agreed.
- **Time** — beats from the start of the number, fractional, matching `NoteEvent.beat`. Never seconds and never frames: a beat survives a tempo the renderer was not told about.
- **Levels** 0..1, like `velocity` and `gain`. **Colours** `#rrggbb`.

## The seam that made parallel work possible

`PlayPoint` says *where* on an instrument something happens, **musically**. The choreographer emits `{ kind: 'drum', voice: 'ht' }` — it knows the high tom is being hit and has no idea where a high tom is. The drum-kit model answers "there, at that angle" and has no idea what a bar is. Neither has to exist for the other to be written or tested.

Every model implements exactly one method against it — `resolve(point)` — and the animation runtime is the only thing that calls it.

The kinds are `key`, `string`, `drum`, `valve`, `hole`, `pedal`, `bellows`, `control`, `viseme` and `rest`. Three of them carry a piece of state that only something able to see the phrase ahead could know, and each is on the point for the same reason:

- `key.bellows` — how far open the box is as this note is struck. A bellows is a tank of air; the direction turns when it runs out, which is a decision about the *phrase*.
- `key.board` — which keyboard, where a player is standing at more than one. A model picking a board from the pitch would send a phrase to a different keyboard every time it crossed a register line.
- `pedal.shut` — whether the foot is holding the hi-hat down, which is what decides whether the cymbals are shut or parted.

## Gestures are scheduled, not reactive

The most important field in the IR is `Gesture.prep`: beats of travel *before* the note. Animation driven by "a note just happened" is always late, because a limb that starts moving on the beat arrives after it. The runtime reads ahead into that window and the hand is at the target exactly on the beat.

It is computed, never constant — a crash needs a bigger windup than a ghost note, and a stick crossing from the floor tom to the ride needs longer than one bouncing on the snare. `release` is the follow-through, because a limb that stops dead reads as a puppet.

Gestures are quantised through `core/grid.ts` onto the same sixteenth grid as the audio. A gesture that is not lands up to a 32nd away from the sample it is supposedly causing — worst on swung offbeats, which is exactly where the ear is least forgiving.

## Groove is a separate track, on purpose

Playing an instrument and feeling a pulse are different behaviours with different sources: one comes from *this* player's notes, the other from what the *band* is doing. Merged, a player with eight bars' rest has nothing to do — which is the difference between a band and a rack of animatronics, and it is visible from the back of the room.

The pulse is **read off the drum pattern, not off the metre**. Where the kick lands is the pulse and where the snare lands is the backbeat; deriving it from `beatsPerBar` would give a humppa and a jazz ballad the same nod. Every player gets a small deterministic `phase` and `looseness`, because a band nodding in perfect unison is the single most robotic thing this system could produce.

## The face reads the same numbers the voice does

`NoteEvent.vowel`, `NoteEvent.consonant` and `VoiceSettings.syllableBeats`/`blipBeats` already say what is sung, how it is started and how often the mouth re-opens. The visemes are a *re-reading of those numbers*, not a second system kept in sync with them — the lips cannot drift out of agreement with the sound, because there is one set of numbers used twice.

Three continuous parameters (`open`, `round`, `spread`) rather than fifteen poses, mirroring how the voice itself is modelled: the vowels are already coordinates, and blending three numbers looks better than snapping between shapes.

## Light cues off the music, not off a dice roll

A lighting designer sitting in on a rehearsal writes down what the music does and cues off that. So `lighting.ts` has almost no randomness in it, and the little it has is declared up front: a light that changes for no reason is worse than one that never changes, because a change is a claim that something happened, and a claim nobody can hear is noise on stage.

Everything it needs is already in the Song IR — `Section.kind` and the dynamics say how big each section is, and `Section.solo` names the soloist a follow spot exists to follow. The spot follows *late and imperfectly*, because it is an operator rather than a servo.

Two things about the cue list are worth knowing when reading one: every fixture starts black and only changes are emitted, so the first cue naming a fixture is its fade up from nothing; and `preset` is how much of the opening look is already up when the tabs open, because a room does not reveal a band on an unlit stage several seconds after the transport has started.

## A room is a building, and the genre says which

`stage.ts` used to build one rectangular proscenium — boards, backdrop, wings, fly bar, curtain — with four boolean modifiers, and that was the whole architectural vocabulary. It was the right call while three genres shared it, and it stopped being right at about room five: a concert hall, a walled courtyard, a threshing barn, an arena and a dancehall all came out **the same box in different paint**. The genre authors were not at fault. A `StageRoom` could carry two dimensions, five colours, a fog number and a list of props, so data was the only thing the system could accept, and ten of them wrote data.

[`src/web/concert/rooms/`](../src/web/concert/rooms/) is now a `Record<RoomStyle, RoomBuilder>` over the union in `concert/types.ts` — the same total-record trick as `ARCHETYPE_OF`, so a style named upstream with no builder is a compile error naming the registry rather than a room that quietly comes up a proscenium and survives review because it looks deliberate. Twelve architectures, one file each, eleven thousand lines of them; `stage.ts` fell from 751 lines to 460 in the same change and keeps only the machinery the show drives.

**The line between the two is not the obvious one.** "The stage is the wooden bit and the room is the walls" does not predict which file a change belongs in. This does:

> The stage is the part of the picture some other file already has an opinion about. The room is the part nothing else has an opinion about.

`cast.ts` clamps players to the boards' width, `cables.ts` routes leads inside their bounds, `show.ts` raises the drum riser, `camera.ts` frames the crowd, `tomatoes.ts` bounces fruit off all three surfaces — every one of them solving against numbers it takes on faith, several restating the stage's own constants by hand because the dependency may not point the other way. So the boards, the apron, the riser, the props, the audience and the air stay in `stage.ts`. What is left is the residue nobody asks a question about: nobody asks whether the walls are brick, only where they are; nobody asks whether there is a ceiling, only how high the lowest thing overhead hangs. That residue is handed over whole.

A room answers two methods and the split is forced rather than tidy. `shape()` answers eight numbers and builds nothing; `build()` builds and answers no numbers. It is the same split `InstrumentModel.resolve` makes for the same reason — the choreography has to be computable without ever constructing a guitar — but here the ordering compels it: `StageMetrics.crowd` is solved from the house floor, the house floor is a stage height below the boards, and how high the boards stand is a *room* decision. The metrics cannot be finished until the room has spoken and the room cannot be built until the metrics are finished. One method would have to be handed a half-built `StageMetrics` with a note saying which fields are not filled in yet.

Every one of those eight numbers is somewhere a room that had not thought about the question would put something through a wall, and all eight are **required** — no partial form, no merge with a default — because the failure the seam exists to prevent is a room *silently inheriting a proscenium's dimensions*, which is what every room was doing on the day it was written. A room that genuinely is a proscenium says so in one line by calling `prosceniumShape`.

**The key is the architecture and not the room id**, and the prediction that argued for it has been paid off. `ARCHETYPE_OF` exists because 126 catalogue sounds collapse onto 20 objects — a tenor and a baritone saxophone are one model at two sizes — and the rooms collapsed the same way: a ballroom, a dancehall and a salon are one big room with a floor in it, and a riihi and a shed are one long roof. Keying on `Venue.id` would mean writing that room three times or importing one room into another, and the second is how a directory of parallel authors turns back into a file they all have to edit.

Absent still means the proscenium, and that half is load-bearing: it is what let every genre added in a hurry keep working without anyone naming anything. **Three still take it — ambient, iskelmä and jazz** — along with `venue.ts`'s `HOUSE`, which no genre reaches. Naming them rather than counting them is deliberate; the count has been wrong in this directory twice, because it moves every time an author names a room and the fallback's argument does not move with it.

### The genre owns it

Four genre-keyed tables used to live in `concert/`, each a `Record<string, …>` with a silent fallback. With four genres that was the better shape and it is worth saying so: tables read side by side are *comparable*, and comparison is the only way to tell whether two decades of the same room are actually different. With nineteen it inverts — a table every author has to edit is not a table, it is a registry, and a registry inside the renderer means adding a genre touches four files that belong to nobody.

The proof it had already gone wrong is `synth`, which appeared in **none** of the four. It staged in the generic house, in the plain concert dress whose own comment says it is dull on purpose, under a programme line reading *"a new one, and nobody has decided about it yet"*. Every fallback worked exactly as designed and the result was a genre nobody had finished.

`Genre.staging` is where a genre now says what it looks like: its room, its wardrobe keyed by its own era ids, its programme blurbs, and `body` — how much a body moves, as a multiplier on the groove score. All 19 genres declare one. Every field is individually optional and that stays load-bearing, because an unknown genre is *supposed* to stage badly and obviously: a fallback that looked good would be a reason never to write the real thing.

## The band is not one lathe

`Look.outfit` was four colours and a fabric, and every performer in every genre was the same silhouette in different paint. It also carried a `cut?: { lapel, shoulder, flare }` whose own comment claimed *"this is where a decade actually lives"* — **written by nothing and read by nothing**, three floats that had been in the IR long enough for two renderers to be built past them.

`Garment` stands in that slot: eight silhouettes, dispatched from `performer-garments.ts`, which is the only place any of it is interpreted. The claim the dead field made was right and its shape was wrong — lapel width and trouser flare are modifiers of *one* silhouette and mean nothing on six of the eight, so implementing them would have needed a rule about which garments they apply to before drawing a pixel. A decade lives in the garment table instead: 1720 drawing `coat` and 1870 drawing `tails` is a century of orchestral dress said with a shape, by the genre that owns the clothes.

Three files put cloth on a player — the torso, the sleeves and the legs — and a robe has to be a robe in all three or it is a floor-length column with trouser-coloured shins under it. So `legsOf()` is a contract rather than a convention: the legs ask whether there are trousers at all.

**Hair and hats could not see each other.** `buildHair` and `buildAccessories` were independent `void` functions adding geometry to the same head, so a hat sat at a fixed multiple of head radius whether there was a crop or a 42 cm afro underneath, and every hat in the union disappeared inside an afro. `buildHair` returns a `HairProfile` now — crown height and half-width, **measured off the built group rather than tabulated**, because a table saying "a beehive is 2.83 R" is true until somebody improves the beehive. Head furniture reads it and either presses the hair down or rides on it, bounded so a bandana over an afro does not solve the fit by swallowing the halo.

Two more things the stage could not previously say, both of them a *conjunction* rather than a new value:

- **`Posture: 'floor'`** — cross-legged on a carpet with the instrument in the lap. It fires where `ArchetypeSpec.lap` meets `FLOOR_SEATED`, which is arabic and indian, because it is a fact about the object *and* about the tradition and neither half answers alone. It could not be `sit` with the seat lowered: the legs are in front of the body rather than under it, the feet cross the centre line, and there is no seat to be at a height. The cost of not having it was arithmetic — `sit` puts a 1.75 m player's head at 1.33 m against a cross-legged 0.84 m, and since a hand percussionist is on the `drums` layer and the `drums` layer gets the riser, the tabla player was staged half a metre too high *on top of* a 2.8 m rock platform.
- **The `vocal-group` archetype.** Four of the 24 archetypes are unreachable from a catalogue sound — `drumkit`, `handdrum`, `singer` and `vocal-group` — because none of them comes from a GM program. This one is reached through `archetypeForTrack`, **the only place in the system where a year touches the mapping**: before 1970 no keyboard could make that sound, and a written choir is people. `ARCHETYPE_OF` stays a flat total record and the year lives in a three-entry table beside it, because the fact is true of three sounds out of 126 and threading a year through the main table would trade its totality for it.

## The backline

What is on the stage is a casting decision and lives in the IR, not in the renderer. `DrumSource` says what is producing the percussion — a kit, an electronic kit, a programmed machine, a preset box — and is chosen *before* the notes exist, because a preset rhythm box has fourteen buttons on it and none of them is marked *descending tom roll into the last chorus*. Choosing the box afterwards would stage a machine miming music it has no mechanism for.

A machine that plays without hands still has to be somewhere the audience can see it, so `StageMachine` puts it on a stand beside the player whose reach it is inside — or, on a modular, in a bay of the frame they are already standing at. `Performer.rig` says which synthesiser a keyboard player is behind and `boards` how many keyboards, both derived from the music: a second keyboard exists because there is a second part to put on it.

**`Section.solo.instrument` names what is actually playing**, and it takes two steps because a stage answers it in two steps. *Is anybody playing?* Where the source is a box or a programmed machine nobody is, and the field carries the machine's whole bank string — `'RolandTR909'`, `'RolandTR808+mridangam'` — which is the label the staged machine already wears, rack included. *Then: which object would the hands need?* `'drum kit'`, or the drum the chorus was actually written for where that is not a kit — `'darbuka'`, `'congas'`, `'mridangam'`. Both halves were learned the same way. A *tani āvartanam* is ten minutes of mridangam alone on a stage with no kit anywhere on it and this field said `'drum kit'` throughout; then it said `'mridangam'` through a chorus whose mridangam was a sample inside an 808, **in 22% of drum solos**, because knowing which object a pair of hands would need is not the same as knowing there are hands.

See [`backline-plan.md`](backline-plan.md), whose waves are annotated with what actually landed.

## Two benches, because an assertion only catches what you thought to assert

This is the most important section in this document, and the argument is the one `gallery.ts` opens with verbatim: instrument models were **verified against geometric assertions, and shipped, and the only way to look at any of them was to start a concert and hope the camera cut to it.** A trumpet whose bell pointed at the ceiling survived that for as long as no show happened to feature a trumpet in a close shot. Everything above this line is data and can be checked without eyes. The geometry is not, and pretending otherwise is how this directory acquired the worst record in the repo for shipping faults that were believed correct and were invisible.

**[`/models`](../src/web/concert/gallery.ts) — the instruments.** 35 exhibits, and the gap between that and 24 archetypes is the whole point: **an archetype is not an object.** A synthesiser is a modular wall, a polysynth or a digital slab depending on `Performer.rig`; a kit is drums or pads depending on `DrumSource`; a digital slab with a second board over it has an upper case, a stand and an arm that exist only when `Performer.boards` is 2. Enumerating archetypes showed one of each and hid the rest, and five objects reached the stage that the page could not be made to draw. The machines were missing for a blunter reason — they have no performer, so `buildInstrumentFor` was never the way in. The unit is therefore an *exhibit*, one buildable object, and the page deliberately shows what the models can be asked for rather than what a stage will ask: a wing nobody has ever looked at is worse than a wing nobody stages.

**[`/looks`](../src/web/looks.ts) — the costumes.** `HairStyle` went from eight values to sixteen, `Accessory` from eleven to twenty and `Fabric` from nine to fifteen, in one pass, all verified against "no NaN transform, no empty branch", and not one of them ever looked at. A cowboy hat whose turned brim is two rotated boxes stuck on the sides of a disc passes every check that exists. **The bench found eighteen faults on its first run** — the hood and the wrap with their face-holes over the right ear, so a hooded performer was a featureless egg with two eyebrows through it, live in four genres; the fabric that exists to look expensive rendering as the darkest thing on stage, because nothing set `scene.environment` and `lame` at metalness 0.90 has no diffuse response; forty players in evening dress with no lapels, because `shade(jacket, -0.07)` clamps at zero and classical's near-black is already there.

Costume faults are **comparative** in a way instrument faults are not. A bell pointing at the ceiling is wrong on its own; a beehive is only wrong next to a bob, a hat only wrong over the hair it is supposed to sit on, a fabric only wrong beside the fabric it is meant to look nothing like. So the unit is a *row*, the camera is orthographic and the rows stack in `y`, because a perspective grid puts the back row further away and lights it from a different angle — which answers both of the page's questions with the layout instead of with the model. The figures turn rather than the camera, since half the head furniture in the union is only wrong from one angle: a ball cap is peaked backwards by decision and a mullet is short from the front by definition, and neither can be judged from the stalls.

Six views, and `hats × hair` is the one the bugs were in. **It is eight head-worn accessories against ten heads**, and the eighty cells are eighty chances for a new hat, a restyled mane or a changed profile to put cloth back through hair. `short` and `bald` are the controls — a hat wrong over those is wrong full stop. `garments` is the newest and closed the last union with nowhere to be looked at: `Garment`'s eight silhouettes were only ever visible in whichever of them the genre on screen happened to weight, so four of the eight needed the tables read before you knew where to go and see one. It draws all eight four times — as cut; as an outline, in one flat colour with the matte end of the fabric table so that two garments that come out as the same figure are one garment with two names, which is the ten-metre test the union claims about itself; in `brocade`, the only fabric that reaches the renderer as geometry and therefore the only one that can land wrongly on a shape; and sitting down, where `dressGarment` builds no skirt at all and hands `performer-legs.ts` a `LapCloth` instead. The `wardrobe` view goes further and is why the page opens on it: its figures are not `Look`s written on the page, but a real `generateSong` → `chooseVenue` → `castSong` per `genre:era`, so "why does arabic look like country" gets an answer about the tables rather than about a mock-up. Both benches go through the show's own entry points — `buildPerformer` and `buildInstrumentFor`, not the builders behind them — and `lightTheRoom` backs both at the same intensity, so what is checked on the bench is what walks on at the concert.

## Verification — `npm run concert`

53 assertions, and the interesting ones are the physical ones. Among what it checks:

- the sound-to-object mapping is **total** — `ARCHETYPE_OF` is a `Record<InstrumentId, Archetype>`, so adding a sound to the catalogue without saying what it looks like fails `npm run typecheck` rather than putting a mystery box on stage;
- every sounding note produces exactly one gesture, and every gesture lands on the audio grid;
- no effector is scheduled over its own release, and simultaneous gestures on one effector are graspable;
- no gesture falls outside its archetype's declared range;
- no two performers share a spot, and every performer is on the stage;
- every follow spot names someone who is actually on stage, and no cue fires after the last note;
- **ambient never uses a follow spot** — it has no soloist and refuses to have a foreground, which is why `warm` exists as a performer-addressable fixture that is explicitly not a spot;
- visemes exist exactly when there is a voice;
- a machine is never mimed by a drummer, and is always somewhere the audience can see it;
- **no player is stacked behind the one in front**, from the house, at 0.000% of 7,814 occluding pairs;
- **no hand reaches a second keyboard faster than it could** — 1,053 crossings, tightest with 0.063 beats to spare;
- every hand and foot lands on its instrument, and no floor-seated player is ever on a platform;
- **the drummer plays figures with both hands** — no hand is left to roll on its own, at 0.33% of 129,356 strokes beginning a one-armed figure — and the arms are never left knotted.

The sightline check is worth its own note, because it is the fourth constraint casting solves for and for a long time nothing verified it. `DEFAULT_CAMERA` had been exported since it was written, under a comment saying it existed *so the verifier could assert against the same camera the stager staged for*, and nothing ever did. The fix was not a second implementation: the predicate is `stacked`/`seenAs`, exported from `cast.ts` so the check **asks rather than re-derives**. That rule is applied throughout — the two knot assertions read `armsKnotted` and `handsKnotted` for the same reason, rather than restating the choreographer's geometry in the file that checks it.

The two-hands assertion exists because the knot check is gameable. A planner can drive knots to exactly zero by never moving the left arm at all, and a drummer playing a fill one-handed with the other stick hanging is no better than a drummer in a knot. Together they are the one part of the show whose failure mode is a *posture* rather than a missing gesture: every other physical rule passes on a drummer whose left stick is out on the ride while the right is back on the hi-hat, because nothing is in two places and every note has a hand. It is simply a person who could not exist.

## Known limitations

- **The stage plays a ramping song flat.** `SongMeta.tempo` is a `TempoMap` now, so the IR can say that a qawwāli accelerates across its length — but `choreograph.ts` sizes windups from `meta.bpm` and **not** `songTempo(meta)`, deliberately. The question a windup answers is not *what tempo is the piece* but **what tempo is the audience hearing**: the stage animates against the audition, `transport.ts` derives the sounding beat by inverting Strudel's scheduler equation, and Strudel's tempo is one global number per pattern. So a ramping song is played on this stage at `meta.bpm` throughout, and windups sized for the tempo map would be sized for a performance nobody in the room is listening to — a hand taking 0.11 beats to travel during audio running at 80 bpm arrives 40 ms early, on every note, for the second half of the piece. Handing the map to `Board` without also ramping the transport would have made both sides of the travel-speed assertion derive from the same wrong number, which is self-consistently wrong and the one failure a check cannot catch. **One line changes when the stage can hear a ramp** — either when it plays from the .mid rather than from the audition, or when Strudel grows tempo automation — and every call site below it already has the beat to hand.
- **No metre change within a song.** `beatsPerBar` is still one number per song, and the concert clock would be the blast radius of making it more.
- **A coda does not close the mouth.** Visemes read the syllable's onset only — `note.consonant ?? 'none'` — so a closed syllable looks open. The mouth does close *between* syllables, because `blipBeats` says it does; what it cannot do is close on the way out of one.

### One that closed, in a shape this document got wrong

This section used to say there was **no hand drum on stage** — that `DrumVoice` carried `lp`/`mp`/`hp` so a darbuka could be written, while what produced it was declared a `kit` — and it prescribed the fix: a fifth `DrumSource` value, `hand-drum`, with an archetype to go with it.

There is a hand drum on stage now, and **the prescription was the wrong shape**, which is worth more than the entry it replaces. A `DrumSource` value answers for the *whole part at once*, because that is what the field is for: it is chosen before the notes exist and constrains what may then be written. That is exactly right for a drum machine, which cannot play what a drummer plays. It is wrong for a hand drum, because a third of the patterns that write hand voices write kit voices in the same bar — funk's `congas`, latin's `cumbia-kit`, reggae's `roots-rockers`. Those are not one player choosing between two instruments; they are two players, and a source field cannot say so at any value.

So the split went on the *voice* rather than on the source, in `STATION_OF` and `drumStations`, and casting drafts one player, two, or a kit and a percussionist, from the voices actually present. `DrumSource` keeps its four values and its original job: whether a person or a machine is making the sound.
