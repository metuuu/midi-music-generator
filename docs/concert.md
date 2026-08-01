# The Concert

**A band walks out on a 3D stage and plays the music the generator just wrote.** Hands hit the drums the drums are actually being hit on.

```bash
npm run dev        # then open /concert.html
npm run concert    # the correctness checks this page describes
```

See [`concert-plan.md`](concert-plan.md) for the reasoning, the alternatives that were rejected, and the contracts as they were settled before any of it existed.

## The one architectural claim

**The visuals are a third renderer of the Song IR, not a feature of the audio player.**

`render/midi.ts` ships and `render/strudel.ts` auditions, both sitting behind an IR that knows about neither. The stage is the third: [`src/concert/`](../src/concert/) turns a `Song` into a **Performance IR**, and a three.js runtime under [`src/web/concert/`](../src/web/concert/) plays *that*.

Nothing in `src/concert/` may import three.js, Strudel or the DOM. That is not tidiness — it buys three specific things:

- **The visuals cannot cheat.** A choreographer that can only see `NoteEvent[]` has no path by which a nice-looking animation quietly changes what is heard. "Generated from the MIDI, not the other way round" becomes structural rather than a promise.
- **It ports.** A native engine consuming the Song IR gets the staging for free. A concert is also the most demanding test there is of whether the IR carries enough to drive something other than audio: if a drummer's left hand cannot be placed from it, the IR is missing something, and this is where that gets found out.
- **It is testable without eyes.** Everything is data, so `npm run concert` asserts that no hand teleports, that every sounding note has a gesture, and that no two players are standing in the same place. Nobody is going to watch three hundred generated concerts; if the hands are only checked by looking at them, they are not checked.

## The pipeline

```
setlist → venue → per number: cast → solos → choreography, groove,
                              visemes, lighting → bill
```

That order is a dependency order, not a preference. Casting comes first within a number because everything after it needs performer ids; lighting comes last because a follow spot has to know both who is soloing and that they exist.

| | What it decides |
|---|---|
| [`setlist.ts`](../src/concert/setlist.ts) | which numbers get played and in what order — style, mood, key, length and smoothness per slot, programmed for contrast |
| [`venue.ts`](../src/concert/venue.ts) | the room: genre dresses it, era shifts the palette and the fixtures |
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

## The backline

What is on the stage is a casting decision and lives in the IR, not in the renderer. `DrumSource` says what is producing the percussion — a kit, an electronic kit, a programmed machine, a preset box — and is chosen *before* the notes exist, because a preset rhythm box has fourteen buttons on it and none of them is marked *descending tom roll into the last chorus*. Choosing the box afterwards would stage a machine miming music it has no mechanism for.

A machine that plays without hands still has to be somewhere the audience can see it, so `StageMachine` puts it on a stand beside the player whose reach it is inside — or, on a modular, in a bay of the frame they are already standing at. `Performer.rig` says which synthesiser a keyboard player is behind and `boards` how many keyboards, both derived from the music: a second keyboard exists because there is a second part to put on it.

See [`backline-plan.md`](backline-plan.md), whose waves are annotated with what actually landed.

## Verification — `npm run concert`

The interesting assertions are the physical ones. Among what it checks:

- the sound-to-object mapping is **total** — `ARCHETYPE_OF` is a `Record<InstrumentId, Archetype>`, so adding a sound to the catalogue without saying what it looks like fails `npm run typecheck` rather than putting a mystery box on stage;
- every sounding note produces exactly one gesture, and every gesture lands on the audio grid;
- no effector is scheduled over its own release, and simultaneous gestures on one effector are graspable;
- no gesture falls outside its archetype's declared range;
- no two performers share a spot, and every performer is on the stage;
- every follow spot names someone who is actually on stage, and no cue fires after the last note;
- **ambient never uses a follow spot** — it has no soloist and refuses to have a foreground, which is why `warm` exists as a performer-addressable fixture that is explicitly not a spot;
- visemes exist exactly when there is a voice;
- a machine is never mimed by a drummer, and is always somewhere the audience can see it.

## Known limitations

- **No hand drum on stage.** `DrumVoice` carries `lp`/`mp`/`hp`, so a darbuka or a set of congas can be *written*, but what produces them is still declared a `kit` — which is wrong about the object in the room. `core/types.ts` sets out what unlocks it: a value, an archetype to go with it, and something for the hands to stand behind. Adding the value alone stages either a drum kit for a darbuka player or a drum machine for a person.
- **A coda does not close the mouth.** Visemes read the syllable's onset only, so a closed syllable looks open.
- **No tempo or metre change within a song**, which the concert clock would be the blast radius of.
