# Ambient — the ruleset

Organised by *what the music is made of* rather than by feel or by dance, because ambient has no shared repertoire to sort. There is no standard, no dance floor and no chorus. What distinguishes one kind from another is material: a tape loop, a drone, a sequencer, a choir, a dub chord.

Four things separate these tables from the iskelmä and jazz ones, and they matter far more than any individual progression.

**Melody follows the drone, not the key and not the chord.** This is the third answer to the question that made `Genre` an abstraction, and it is genuinely a third system rather than a setting of the other two. There is one tonal centre for the whole piece and it never moves; a chord is a colour passing underneath it. `scaleForChord` always returns a scale rooted on the **tonic**, and chooses only *which mode* of that tonic by asking which one happens to contain the chord.

**There is no dominant.** `V` is absent from every table, and where a chord on the fifth appears it is minor. A leading tone is a promise that the music will resolve, and the whole proposition of the idiom is that nothing does. `npm run genres` asserts it: not one chord in the genre parses with dominant function. It is the same kind of deliberate assertion as bossa nova's `swing: 0`.

**Harmony barely moves.** A progression here is usually two chords across eight bars and often one. The interest has to come from register, texture and layering — which is why the *arrangement* rules do more work in this genre than the harmony does, and why the mix is inverted (see below).

**Nothing announces itself.** Every style sets `drumFills: false`. A tom roll into a crash is how a dance band signposts the next section; ambient sections are supposed to arrive without being noticed.

## Styles (`src/genre/ambient/styles.ts`)

| Style | BPM | Meter | Mode | Defining traits |
|---|---|---|---|---|
| **Hauntology** | 68–96 | 4/4 | 55% minor | Plagal and mode-mixture harmony, childlike melody, a dusty half-time beat that lopes (`swing: 0.15`) |
| **Wasteland** | 50–72 | 4/4 | 94% minor | Motionless low pedal, ♭II leaning from a semitone above, sparse metallic fragments, `strictness: light` |
| **Drone** | 48–64 | 4/4 | 60% minor | One chord for the whole piece, no drums, quartal voicings, `hook: earworm`, `strictness: strict` |
| **Kosmische** | 96–132 | 4/4 | 78% minor | Running arpeggio that drifts against the bar, pad changing once every four bars |
| **Choral** | 54–76 | **3/4** | 80% minor | Sacred minimalism, modal and stepwise, no percussion, `strictness: strict` |
| **Aquatic** | 100–124 | 4/4 | 72% minor | Soft four-on-the-floor, a submerged chord on every offbeat, sub bass |

Two of them are named after specific bodies of work and it is worth saying which. **Hauntology** is the Boards of Canada sound — warm, tape-degraded, nostalgic for something that never happened. **Wasteland** is Mark Morgan's Fallout score, and the branch of ambient that descends from industrial rather than from minimalism.

Kosmische and aquatic run at tempos that look wrong for the genre until you notice the harmony still moves once every four bars. **Tempo and harmonic rhythm are separate things**, and confusing them is how ambient gets written as slow pop.

## The drone rule

The seven-note modes of one tonic, ordered brightest to darkest — which is to say ordered by the circle of fifths, each step flattening exactly one degree of the one before it:

```
lydian → major → mixolydian → dorian → aeolian → phrygian
```

Given a chord, the rule searches outward from the key's own mode for the nearest one that contains every note of it, brighter side first. Neighbours in that list differ by a single note, so bending the scale to admit a chord changes as little as it possibly can.

| Chord | Under a… | Melody takes |
|---|---|---|
| `♭VII` | major drone | **mixolydian** on the tonic |
| `♭VI` | major drone | **aeolian** on the tonic — the Boards of Canada mixture |
| `IV` | minor drone | **dorian** on the tonic |
| `♭II` | minor drone | **phrygian** on the tonic — the wasteland sound |
| `V` | minor drone | **ionian** on the tonic — a modal brightening, not a cadence |

In every case the tonal centre is untouched. Nothing modulates, ever.

The rule's most important property is what it *cannot* do: it can never return harmonic minor. Harmonic minor exists to manufacture a leading tone, and that is the one gesture this genre is defined by not making. Locrian is excluded from the list for a related reason — its flat fifth makes the tonic itself unstable, and a drone whose own tonic chord is diminished is not a drone.

`npm run genres` checks that every chord in every table is reachable this way. If a progression ever contains a sonority no mode of the tonic can hold, the rule falls through to its guard and the melody starts drawing on a scale that omits the notes underneath it — "the drone absorbs the chord" degrading quietly into "the drone ignores the chord".

## Form

Sections are long and there are few of them. The section kinds keep their names for the sake of every other part of the engine, but they mean **texture stages** here rather than song parts:

```
intro   the bare drone
verse   the line arrives
chorus  the fullest the piece gets
bridge  the one harmonic departure
outro   thins back out
```

Sixteen-bar blocks are the norm and one template is 8-bar. There are **no `solo` sections** anywhere — a blowing chorus is a jazz idea and nothing in ambient corresponds to it. Every era sets `keyChangeChance: 0`: lifting a final chorus by a tone is an iskelmä cliché and the single most anti-ambient device available.

Tracks run three to five and a half minutes. That is long by the standards of everything else in this project and short by the standards of the genre, which is a deliberate compromise — this has to work in a rotation.

## Sustain

The engine gained three things for this genre, all of them about the difference between a *pedal* and a *pulse*:

- **`sustain` on a bass or comp pattern** merges notes that are the same pitch and meet end to end. At 60 BPM a re-articulated whole note is an attack every four seconds, which the ear reads as a part being played; held through, the same pitches are one sustained tone the rest of the arrangement moves over. Merging is grouped by pitch before it runs, because the parts that most want it are chordal — a four-note voicing repeated bar after bar is four independent held tones.
- **`arpeggio` on a comp pattern** plays one note of the voicing per hit instead of the whole chord, cycling upward and carrying the cycle *across* barlines. A sixteen-step figure against a four-beat bar lands on a different chord tone every downbeat, and that drift is the entire appeal of a Berlin-school sequence.
- **`requireLayers`**, the mirror of the existing `excludeLayers`. The default arrangement rules treat `pad` as decoration added when there is room for it — true for a dance band, exactly backwards for music where the pad *is* the piece.

`excludeLayers` was already declared in `Style` and never read; it is wired up now, and `drone` and `choral` use it to have genuinely no kit rather than a silent one.

## The mix

Every other genre here mixes a dance band: the tune on top, the pad a long way behind it holding the harmony up. Ambient sets `Genre.mix` and inverts that.

| Layer | Default | Ambient |
|---|---|---|
| melody | 0.85 | **0.55** |
| pad | 0.45 | **0.78** |
| bass | 0.90 | 0.72 |
| comp | 0.62 | 0.50 |
| counter | 0.55 | 0.40 |
| drums | 0.80 | **0.34** |

This is a statement about the music rather than a taste in mixing. A melody louder than the texture it sits in is simply a different genre played slowly.

### Inside the kit

Turning the whole kit down is not the same as making it sit back, because the voices do not misbehave equally. A closed hi-hat is a burst of energy at 8 kHz — exactly where hearing is sharpest — so it stays audible long after the kick has vanished, and a kit faded uniformly becomes a disembodied tick with no body under it.

`Genre.drumMix` sets the balance inside the kit, merged over `DEFAULT_DRUM_MIX`. Ambient takes the transients off hardest and leaves the low end nearly alone:

| Voice | Default | Ambient |
|---|---|---|
| bd | 1.00 | 0.85 |
| sd | 0.85 | 0.40 |
| hh | 0.45 | **0.18** |
| rim | 0.70 | 0.35 |
| perc | 0.60 | 0.45 |

A soft kick and almost no hat is most of what makes a beat read as weather rather than as timekeeping.

This table used to live in the Strudel renderer, where MIDI could not see it — so the audition and the shipping file disagreed about the drum balance. It is in the IR now and **both renderers apply it**. The kit shares one MIDI channel, so per-voice level has nowhere to go but the note velocity, which is where `render/midi.ts` now puts it.

## Effects

Effects are a mix decision in every other genre here and a compositional one in this one. A Boards of Canada track is a filtered, saturated, reverberant object; the dry notes underneath are not the piece. That is the same argument as "the pad is the piece", and it is why `Effects` sits in the **IR** rather than in a renderer — a native engine reads the same numbers.

Reverb and delay are **sends**. The size of the room and the length of the echo belong to `Song.space`, not to the instrument standing in it, and every track carries only how far into that one room it is pushed. That is how a mixing desk works and, not coincidentally, how MIDI works: CC91 is a send level to the synth's single global reverb, and there is no per-channel reverb to give a size to.

| Field | MIDI | Notes |
|---|---|---|
| `reverb` | **CC91** | GM level 1 — every soundfont player honours it. The one effect that genuinely ships. |
| `pan` | **CC10** | GM level 1. |
| `lowpass` | CC74 | GM2/GS, not GM1. FluidSynth honours it; a strict GM1 device ignores it. |
| `resonance` | CC71 | Same caveat. |
| `delay` | — | **Audition only.** GM has no delay controller. |
| `highpass` | — | **Audition only.** GM has no highpass. |

CC74 and CC71 are defined *relative* to the patch's own filter, with 64 meaning "as the patch has it". The MIDI render therefore only ever uses CC74 to **darken** and never to brighten — 8 kHz maps to 64 and every octave below takes 16 off. Claiming to open a filter we did not close would change every patch differently.

Definition is genre-over-era, per layer. The genre states what is true whatever decade it is pretending to be from; the era says how wet and how dark that decade's records actually were — which is the same sentence the era already speaks in when it picks a drum machine and a set of patches.

```
                        tape          sampler       hybrid
reverb size             0.62          0.85          0.90
pad      reverb/lpf     0.70 / 3.6k   0.90 / 5.6k   0.92 / 8k
melody   reverb/delay   0.60 / 0.32   0.80 / 0.35   0.75 / 0.20
bass     reverb/lpf     0.08 / 900    0.12 / 1.1k   0.15 / 1.6k
drums    reverb/lpf     0.35 / 1.8k   0.60 / 1.4k   0.50 / 2.4k
```

Three things in there are doing most of the work:

- **The bass stays dry everywhere.** Reverb on a sustained low tone is the fastest route to mud — the tail arrives while the note is still sounding and the two beat against each other. Everything above it can be as wet as it likes precisely because the bottom is not.
- **The kit is filtered, not merely quiet.** A lowpass at 1.4–2.4 kHz is what turns a drum machine into something heard through a wall, and it does the job a fader cannot: a quiet hat is still a hat, a filtered one is air. The sampler era pushes it furthest — that is the Fallout end of the genre, where percussion is a sound three corridors away rather than a beat.
- **The delay is a dotted eighth** (`delayBeats: 0.75`). Three sixteenths against a four-beat bar never lands where the beat does, which is why every echo in this music has used it since the first tape units.

Other genres set no effects at all and render exactly as dry as before — the mechanism is available to them, unused.

`delaysync` rather than `delaytime` in the Strudel render: superdough's `delaytime` is in seconds, and an echo specified in seconds stops being a musical interval the moment the tempo changes. `delaysync` is in cycles, and one cycle is one bar here, so a delay written in beats converts exactly.

## Eras (`src/genre/ambient/eras.ts`)

The era decides what the sound is *made* of, and in this genre that is very nearly the whole composition. A drone on a Mellotron and the same drone on a granular string patch are different pieces of music in a way that a tango on an accordion and the same tango on a bandoneon are not.

- **1970s–80s tape** — string machines, choir patches, warm analogue pads, Rhodes, and a slightly detuned everything.
- **1990s sampler** — the era Mark Morgan's score comes out of, and it sounds the way it does partly because of what the hardware could not do: short looped samples, metallic FM bells, and pads assembled out of the effects bank because there was no room for anything richer.
- **2000s hybrid** — where ambient stopped being a synthesiser genre. Real strings, cello and voices treated until they hold like pads.

The palettes lean on GM programs **88–103**, the eight synth pads and the eight "effects". Those sixteen programs exist almost entirely for this music and every other genre here ignores them.

## Moods (`src/genre/ambient/moods.ts`)

Iskelmä sorts itself by degrees of melancholy and jazz by heat; ambient sorts itself by **weather and light**, which is the only axis its listeners and its sleeve notes have ever used: `warm`, `bleak`, `weightless`, `pulse`, `sacred`, `submerged`, `neutral`.

One knob behaves differently here. In a dance band `density` adds players; in ambient it adds layers to a texture, and the texture is already the whole piece — so the interesting direction is down, and most of these moods subtract.

## Constraint and repetition defaults

**Smoothness defaults to `standard`.** The line has a lot of time to be heard in — a note lasting four seconds is exposed in a way a passing eighth never is. `drone` and `choral`, where everything sustains at once, raise it to `strict`; `wasteland` drops it to `light`, because the sour intervals the table exists to suppress are what that style is *for*.

**Hook defaults to `catchy`.** Ambient is loop music: the same eight bars come round with something different on top. `drone` pushes it to `earworm` and `wasteland` pulls it back to `loose`, which between them is most of the distance across the genre.

Seven rules are overridden. `unresolved-leading-tone`, `parallel-perfects`, `avoid-fourth` and `static-repetition` are disabled outright; `unresolved-seventh`, `repeated-note-run` and `flat-nine` are relaxed to the top level. The reasoning in each case is the same shape: the rule encodes an assumption about *function* that this music rejects. Parallel motion is the texture, not a fault. The eleventh over a major chord is the default sound, not an avoid note. A held seventh in a pad owes nobody a resolution. See [smoothness.md](smoothness.md#do-genres-share-the-rules) and [rules.md](rules.md).

## Vocals

`--vocals` works, and **`choral` is the style written for it**. The profile sits at the far end of an axis the other two genres share: jazz changes syllable on every note, iskelmä holds a vowel across a phrase, ambient holds one for ten notes and articulates it about as softly as the machinery permits.

The tension is real and worth naming. The whole syllable mechanism exists to stop a synthesised voice becoming a pad, and ambient is the one genre where a pad is very nearly what you want. The resolution is not to switch it off — an unarticulated voice reads as a choir *patch*, which nobody believes is a person. It is to slow it right down: a syllable every two beats, which at 60 BPM is one every two seconds. That is slower than any language and about the rate at which a choir sings a held Latin vowel.

Consonants are nearly absent for the same reason. A stop is a click of noise at 3 kHz and a click is the most attention-grabbing thing this synthesis can produce; nasals and liquids have no burst at all, and carry almost the whole weight here.

## What the audit says

`npm run audit 40 ambient` reads differently from the other genres and should:

```
leading tone used over V        n/a        <- there is no V
songs with a final key change   0.0%       <- by construction
stepwise (<= 2 semitones)       ~44%       <- the audit's 55-70% band is an iskelmä target
repeated notes                  ~27%
```

Stepwise motion looks low until you add the unisons: **step-or-repeat is around 71%**, and wide leaps sit near 4%. A line that dwells on one pitch is idiomatic here rather than stalled, which is exactly why `static-repetition` is disabled — that rule exists to catch a melody that has run out of options, and ambient is barely moving on purpose.

## Known limitations

- **The melody cannot hold a note longer than a bar.** Rhythm cells are one bar wide by construction, so the longest melodic event available is a whole bar — four seconds at 60 BPM, which is usually enough, but a drone whose line moves once every eight bars has to get there by repeating a pitch rather than by holding it. The bass, comp and pad have no such limit and routinely hold for sixteen bars.
- **The Strudel preview re-articulates held notes at every barline.** Mini-notation groups a bar at a time and a group cannot open with a sustain marker, so a sixteen-bar drone is emitted as sixteen tied whole notes. This is an audition artefact only — the MIDI carries the exact durations, and MIDI is what ships.
- **Drum banks are drum machines.** Same caveat as jazz. It matters less here: `drone` and `choral` exclude the kit outright, and `hauntology`, `wasteland` and `kosmische` all weight a beatless pattern heavily enough that a good share of their renders have no drums either.
- **A style's own smoothness and hook overrides do not reach the audition page.** The dropdowns always send an explicit value, so `wasteland`'s `light` and `drone`'s `earworm` are overridden by whatever the page currently shows. This is pre-existing behaviour and affects jazz the same way — bebop never plays at `free` in the browser. The CLI and `generateSong()` honour the overrides normally.
