# Synth — the ruleset

*Reference, written 2026-07-28 and revised 2026-08-01. Its six styles, three eras and five moods were re-checked against `src/genre/synth/` on 2026-08-09 and match exactly. Trustworthy. One number stated elsewhere about this genre has drifted — synth now declares six `ruleOverrides`, not the five [smoothness.md](smoothness.md) reports.*

Vintage electronic music, 1972 to 1990: Vangelis, Jean-Michel Jarre, Kraftwerk, and the Tangerine Dream that had a drum machine.

Organised by *what the machine is doing* rather than by dance or by feel, because that is the only thing these six styles have in common and it is what separates them from each other. A sequencer running the harmony, a sequencer running the bass, a man holding chords, a four-on-the-floor kick under a 16th figure, one ostinato repeated until it becomes threatening, and an arpeggiator on an instrument with no filter — those are six different pieces of equipment being used six different ways, and everything else follows.

**One of these four artists is not in this genre.** `ambient/kosmische` is *Phaedra* and *Rubycon* — one chord for seventeen minutes with a sequencer over it — and it belongs there, because that music answers the question that made `Genre` an abstraction the way the rest of ambient does: the melody comes from the drone. The other four have tunes, keys, cadences and choruses that arrive. The distance between the two shows up as seven fields where this genre states the opposite of what ambient states, and ambient states every one of them on purpose:

| | ambient | synth |
|---|---|---|
| `mix.melody` vs `mix.pad` | 0.55 vs 0.78 — inverted deliberately | 0.9 vs 0.55; the tune is on top |
| `mix.comp` | 0.5 — accompaniment | 0.72 — the sequencer is a **co-lead** |
| `keyChangeChance` | 0 in every era | 0.1–0.3; the final lift is a signature move |
| `drumFills` | `false` in every style | on, except `stalker` |
| `SoloProfile` | absent, and asserted absent | the lead break is the climax |
| `unresolved-leading-tone` | disabled | left on — Kraftwerk cadences |
| harmonic rhythm | 1–2 chords per 8 bars | measured at 2.9 per 8 bars in `berlin` |

That last row is asserted rather than described. `npm run genres` measures both and fails if `berlin` stops moving at least 1.5× faster than `kosmische`, because two styles that describe the same instrument could quietly converge, and if they did, one of them should not exist.

## Styles (`src/genre/synth/styles.ts`)

| Style | BPM | Mode | Figure | Defining traits |
|---|---|---|---|---|
| **Berlin** | 108–140 | 80% minor | `cycle: 64` comp | The sequencer is the composer. Harmony every 2 bars, so the same 64 steps play over two chords. `filter: ramp` |
| **Cinematic** | 60–84 | 55% minor | none | Vangelis. maj7 and sus, plagal and mediant motion, a soaring lead. **No `cycle` anywhere, on purpose** |
| **Machine** | 104–134 | 65% minor | `cycle: 32` bass | Kraftwerk. The bass line is the tune; the melody is five notes repeated exactly. `hook: earworm` |
| **Cosmic** | 118–130 | 60% **major** | `cycle: 32` comp | Four-on-the-floor under a 16th sequence that drifts against it. Euphoric, instrumental |
| **Stalker** | 84–104 | 92% minor | `cycle: 20` bass | Carpenter and Goblin. Five beats against a four-beat bar. `bII`, `#IV`, no fills, `hook: earworm` |
| **Optical** | 96–126 | 55% **major** | `cycle: 32` comp | Late Tangerine Dream and *Rendez-Vous*. Bright arpeggio, a real tune, gated backbeat, **`filter: step` at 0.15** |

Two of these are named for a body of work and it is worth saying which. **Stalker** is *Halloween* and *Escape from New York* — the branch of this music that descends from horror scoring rather than from the cosmos, and the one where the ostinato is the entire composition. **Cinematic** is *Blade Runner*.

`cinematic` having no `cycle` at all is a statement, not an omission: Vangelis is a man holding chords, and an ostinato underneath him turns the style into `berlin` at half speed.

**`optical` is `berlin` with the filter taken away, and that is the whole argument for it being a separate style.** *Optical Race* and *Le Parc* are the same group doing the same job on an instrument that has no cutoff knob, because an FM patch is bright or it is not. Everything that follows from that is a style-level field a table row cannot reach: `filter` goes from `{ ramp, 0.75 }` — where the sixteen-bar opening *is* the composition — to `{ step, 0.15 }`, so the arrival has to be built out of the gated snare and the layers instead; `modeWeights` goes from 80% minor to 55% major, because this half of the repertoire is not dark and no quantity of major progressions rescues a style that draws minor four times in five; and `melody.sequence` drops from 0.6 to 0.4, because by 1988 the tune is a tune rather than a colour drawn over the sequence.

### Rows per style

Each style carries three to seven figures per layer, and the rows are records rather than variations. `machine`'s four bass figures are 1974, 1977, 1981 and 1983 — a flowing four-bar walk, a rolling two-bar train, the hook, and a sixteenth figure with holes cut in it — and the style header names which is which. Measured over 400 songs with `seed: spread-N`, the six styles field **320 distinct rhythm-section shapes** (bass onsets × comp onsets × kit voicing over the first four bars), against 183 for the five styles before this pass. `machine` moved furthest: 0.27 shapes per song to 0.82.

## The figure that is not the bar

Everything above depends on `cycle` (see `style/types.ts`), which is the length of a repeating figure in sixteenths where it is not the bar. This genre is the reason to care:

- `cycle: 20` against a 4/4 bar is five beats. It arrives on a different beat every bar and comes home every fourth, and that slow disagreement is `stalker`'s whole idea.
- `cycle: 32` is two bars, which is what a riff is. A Kraftwerk bass line answers its own first half, and a bar-shaped pattern structurally cannot.
- `cycle: 12`, `20`, `6`, `10`, `14` and `18` are `berlin`'s counter-ostinatos, one drawn per song against whichever comp figure the same song drew. Two of the six are prime against 16 and none shares a useful factor with the four-bar sequence, so the pair never settles inside a section.

**5/4 was considered for `stalker` and rejected.** In 5/4 a cycle of 20 is exactly one bar — the single value at which the figure stops drifting and the effect disappears. 4/4 is what makes 20 interesting.

## The scale rule

Follow the key, and never raise the seventh.

```
bVII under a major key  →  mixolydian     (the borrowed flat seventh)
bVI  under a major key  →  aeolian        (mode mixture)
IV   under a minor key  →  dorian         (the natural sixth)
bII  under a minor key  →  phrygian       (the Carpenter semitone)
```

It is iskelmä's rule with one line removed — the harmonic-minor substitution under a dominant — plus ambient's nearest-mode search to admit borrowed chords. **This genre is not a fourth answer to the chord-scale question and the code says so.** What makes it sound unlike ambient is the table at the top of this file, not the scale rule.

The one real difference from ambient's version is which way it breaks a tie. Ambient always leans brighter. This leans the way its own mode already leans: major takes the brighter candidate, minor takes the darker. A chord reachable in both directions from A minor lands on phrygian rather than dorian, and the flattened second that produces is the most recognisable interval in the dark half of this repertoire.

**The genre's central negative claim:** the raised seventh never sounds in a minor-key song. Where another idiom writes `V`, this writes `bVII`. `npm run genres` checks the sounding notes rather than the tables — 0 in 2240 notes across 83 minor sections — because a guard clause returning harmonic minor, or a melody reaching for a leading tone as a chromatic approach, would both leave the tables innocent and the music wrong.

## The filter

The field this genre was worth building for. Everywhere else in the project a section arrives because more players start playing; here it arrives because a filter opened across the previous sixteen bars.

`NoteEvent.brightness` is 0..1 and multiplies the track's cutoff, in exactly the relationship velocity has to gain:

```
velocity : Track.gain  ::  brightness : Track.effects.lowpass
```

The track says where this instrument sits in this decade; the note says where in that range this moment sits. Closing is logarithmic and bottoms out four octaves down — `sweptCutoff` in `core/types.ts`, which lives there because both renderers need it and neither may import the other. Material is generated in `generate/filter.ts`, a deliberate sibling of `dynamics.ts`, differing in the one thing that file cannot do: a curve *across* a section rather than one value per section.

One `berlin` render, per track:

```
comp    percussive organ    475 → 3800 Hz     first quarter 1093, last 1988
melody  bass lead          2500 → 5000 Hz     first quarter 2749, last 4254
pad     warm pad           1345 → 3200 Hz
bass    electric bass       673 →  800 Hz     barely moves
drums                      static — no brightness at all
```

The bass staying still is the design working. Closing a lowpass on a part already below the cutoff removes it rather than darkening it: a filtered bass sounds absent, not distant, and the intro loses its floor exactly where it is establishing one.

**The outro does not ramp**, and `npm run genres` exempts it explicitly. It sits at the bottom of the genre's `kind` table because these records end by shutting the filter, so the whole section quantises to one dark value. A filter opening across an outro would brighten the piece as it ended. A separate check asserts no section ever runs *backwards*, which would be a real bug.

Brightness is quantised to sixteenths so that consecutive equal values collapse to `_` in the Strudel grid. Genres with no filter profile emit **no `brightness` at all** rather than a brightness of 1 — the same sound, and a much worse artefact, since 1 means a full-length grid of the number one per track. Asserted at 0 of 13115 notes.

## The mix, and the register

```
melody 0.9   comp 0.72   bass 0.86   pad 0.55   counter 0.6   drums 0.68
```

The second number is the one that says something. Every other genre mixes its comp as accompaniment. Here the sequencer figure is *material* — it is what the listener came for, and on half this repertoire it is playing when nothing else is.

That number is only affordable because of a register statement. `layerPlan.offsets` puts the comp five semitones below the arranger's shared ceiling: a 16th-note figure voiced in the lead's own octave does not accompany the lead, it fuses with it, and the ear picks whichever is louder rather than hearing both. Measured over 60 songs, melody-at-or-below-comp's-top is **0.0%** and unison doubling is **0.0%**, against budgets of 25% and 8%.

`layerPlan.response` also says the sequencer barely breathes (0.25 against a default 0.7). A drummer plays a chorus harder; a sequencer is a machine running at one voltage, and the arrival is built by the filter and by layers entering.

## Electric instruments

General MIDI has no electric violin and no electric vibraphone. Substituting a brighter patch is wrong twice: it writes a *different line*, because `idiom` and `agility` travel with the patch, and it still is not an electric violin.

An electric violin is a violin with a pickup and an amplifier — a statement about processing — so `Instrument.effects` carries a delta merged **last**, over the era and the genre. A 1990s desk cannot un-electrify one. In practice they compose on disjoint fields: eras speak in `reverb` and `lowpass`, this speaks in `drive` and `phaser`.

| | base | delta |
|---|---|---|
| `electricViolin` | violin | `drive 0.35`, `phaser 0.3`, `lowpass 8000` |
| `electricCello` | cello | `drive 0.3`, `phaser 0.25` |
| `electricVibes` | vibraphone | `drive 0.2`, `phaser 0.45` |
| `crushedPad` | metallic pad | `crush 8` |

`Effects` gained `drive`, `crush` and `phaser` for this, all three audition-only — GM has no controller for any of them, the same bargain `delay` and `highpass` already take. `phaser` earns its place on period grounds rather than taste: a string machine through a phaser is more characteristic of 1976 than any choice of patch, and it is the cheapest single thing that stops `modular` sounding like `digital`.

**Electric drums needed nothing.** They are the drum machines, and `EraProfile.drumBanks` has had them all along. What was missing is per-voice treatment — `DrumTrack.voiceEffects`, because gated reverb on the snare *and nothing else* is the 1984 sound, and applying it to the whole kit puts a two-second tail on the hi-hats.

`leadFifths` (GM 86) carries a warning in the catalogue: the patch sounds a fifth above every note, so the part moves in parallel fifths that `parallel-perfects` structurally cannot see, and every measuring tool in the project reads a written line that is not what will be heard.

## Eras (`src/genre/synth/eras.ts`)

The technology changed this music more than in any other genre here, so the eras are the hardware.

- **`modular`** (1972–77) — monophonic leads only; polyphony bought from a divide-down string machine or a combo organ, never from a synth. `phaser` 0.65 on the pad, resonance on lead and bass. Preset rhythm boxes.
- **`polysynth`** (1978–83) — Prophet, CS-80, Jupiter. The vocoder. No phaser and no crush, sitting deliberately between its neighbours' defining effects. `keyChangeChance` 0.3, the highest, because `cinematic` peaks here.
- **`digital`** (1984–90) — DX7 and Fairlight, `crush: 12` on the sampled layers only, gated snare. `berlin` weighted lowest, argued from hardware: FM has no cutoff knob, so the sixteen-bar filter opening stops being available. `optical` carries the era's heaviest weight for the other half of that sentence — the group did not stop working in 1984, and what they made instead is what that style is.

**`modular` inverts the rule ambient set.** Ambient restricted itself to banks carrying every voice its styles emit, and that cost it the period-correct boxes — Minipops and CompuRhythm 78 were excluded for having no side stick. But a four-sound preset box *is* the 1974 sound, so this era takes them and leans on `resolveVoice`. Stated rather than assumed, because substitution degrades silently: a fill written on three toms and a crash arrives as four snare hits and an open hat, and nothing reports it.

Two facts read from the sample pack rather than from `BANK_VOICES`, whose own docstring warns that an unlisted bank is merely unmeasured: **`RolandTR909` is in the pack** but has no `perc`, `cb` or `sh`; **`RolandTR808` has no ride**.

## Moods (`src/genre/synth/moods.ts`)

Iskelmä sorts by degrees of melancholy, jazz by heat, ambient by weather and light. This repertoire sorts by **destination** — where the record is taking you, which is the only axis its sleeve notes have ever used. Ordered outward from the room the record is playing in: `dread` (the street), `motorway` (the country), `neon` (the city), `cosmos` (off the planet), then `neutral`.

Two genre-specific behaviours: **`leap` runs opposite to tempo**, because fast moods are sequencer moods and sequencers move by step; and **`ornament` is low everywhere**, because there is no player.

`neutral` is last and has to be. An unspecified mood does not draw at random — the final entry of the table is the fallback for every song. This genre shipped briefly without one, so `cosmos` became the default and biased `cinematic` 3.0 and `stalker` 0.4; over 200 songs it produced 98 cinematic and 6 stalker, and every symptom pointed at the style weights, which were flat and innocent. `npm run genres` now asserts that every genre's last mood is neutral, because nothing about a final array element looks load-bearing.

## Constraint and repetition defaults

`standard` strictness and a `catchy` hook, with `machine` and `stalker` at `earworm`. Five overrides: `parallel-perfects` and `avoid-fourth` off — planed synth brass and sus chords are the sound; `unresolved-seventh`, `static-repetition` and `repeated-note-run` softened, because a Kraftwerk melody repeats one note more than any rule expects.

`unresolved-leading-tone` is deliberately **not** overridden. In major these songs cadence and a hanging leading tone is a fault exactly as it is in iskelmä. In minor the rule is simply inert, because the scale rule never produces a raised seventh for it to catch — which is a much better way to be modal than switching the rule off.

## Vocals

A vocoder, for `machine`. `formantTrack: 0` is the whole file: the renderer's `effectiveF1` lifts the first formant to meet the fundamental on high notes, because that is what singers do — the jaw opens and a closed vowel migrates toward /a/ whether the singer wants it or not. A vocoder is a *fixed* bank of filters a carrier is pushed through, and the bank does not care what pitch arrives. With the compensation off it walks out from under its own resonances as the line climbs and thins into a buzz, and that is the sound rather than a defect.

Also `vibDepth: 0` (no diaphragm), `scoop: 0` (an oscillator has no way of being approximately in tune on its way somewhere), `bodyGain` at three times any sung profile because the carrier leaking through unshaped *is* the instrument, and `syllableBeats` locked to the eighth — to the sequencer, not to a breath.

## What the audit says

60 songs, `npx tsx src/audit.ts 60 synth`:

```
chord tone on the beat        81.0%   (want > 70%)
stepwise (<= 2 semitones)     40.6%   (want 55-70%)
leaps                         43.1%
repeated notes                16.3%
average melodic range         11.6 semitones
sections closing on the tonic 74.8%
songs with a final key change 26.7%
overlapping melody notes      5
style spread                  stalker 17, berlin 16, machine 10, cinematic 7, optical 5, cosmic 5
```

Ensemble, 60 songs, 9016 voicings: mud below middle C 0.0%, melody at or below the comp's top 0.0%, unison doubling 0.0%, mean comp top 62.3 against mean melody low 69.5.

**Stepwise motion is under the printed target and that is not a fault here.** The band is 55–70%, written for a sung idiom; this music's leads are keyboards and a large share of its melodic interval budget goes on the octave-and-a-bit leaps that mean *distance*. `cosmos` and `dread` both raise `leap` deliberately. It is a printed target, not an assertion, and the assertions that do exist — no raised seventh in minor, a ramp that opens, `berlin` outpacing `kosmische` — all pass.

**The overlap count is noise at this sample size, not a defect.** Sixty songs is small enough that one two-handed song swings it: measured over 400 songs the melodic line carries **8 overlaps in 58,206 notes**, which is the same rate the genre had before the tables were widened (8 in 56,611).

## Known limitations

- **Sub-bar harmony does not exist.** `Progression.chords` is one numeral per bar, so a chord cannot change on beat 3. This genre never wanted it — its harmony moves every two to four bars — but jazz does, and the change belongs in the pass that rewrites the jazz tables to use it.
- **No tempo or metre change within a song.** `bpm` and `beatsPerBar` are song-level. Vangelis and Tangerine Dream both do both; the blast radius is the concert renderer's clock.
- **`drive`, `crush` and `phaser` are audition-only.** A shipped `.mid` of an electric violin is a violin. Consistent with `delay` and `highpass`, but the gap widens as more of the character moves into effects — which is the argument for a native engine rather than MIDI being the real delivery target.
- **Polyphonic vocoding is out of scope.** The `vocal` layer doubles the melody, one line. Kraftwerk's monophonic vocoder lines are the larger part of the catalogue and cost one field; the chordal ones cost a project.
- **Layers are still a fixed enum of eight** with dance-band names. `berlin` wants two sequencers and gets them by routing the counter layer through the comp generator, which works and is not the same as being able to say so.
- **The tables have not been settled by ear.** Every number here is a considered first pass that passes measurement. Tempo bands, progression weights and filter depth are the ones a listening pass will move.
