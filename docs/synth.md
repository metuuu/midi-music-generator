# Synth — the ruleset

*Reference, written 2026-07-28 and revised 2026-08-14. Its nine styles, four eras and five moods were re-checked against `src/genre/synth/` on 2026-08-14 and match exactly. Trustworthy, with one caveat stated where it bites: the audit figures at the foot of this file moved for reasons that are only partly this genre's, and the paragraph there says which. One number stated elsewhere about this genre has drifted — synth now declares six `ruleOverrides`, not the five [smoothness.md](smoothness.md) reports. Revised again on 2026-09-02: the revival plays superdough's own oscillators, its bass carries a filter pluck, the era mixes itself, the snare is gated, and the genre caps its solos at one. The audit figures at the foot predate that pass.*

Vintage electronic music, 1972 to 1990 — Vangelis, Jean-Michel Jarre, Kraftwerk, and the Tangerine Dream that had a drum machine — and, since 2026-08-14, the revival that quotes all four: Kavinsky, Carpenter Brut, Mitch Murder and the rest of what a listener would call synthwave.

Organised by *what the machine is doing* rather than by dance or by feel, because that is the only thing these nine styles have in common and it is what separates them from each other. A sequencer running the harmony, a sequencer running the bass, a man holding chords, a four-on-the-floor kick under a 16th figure, one ostinato repeated until it becomes threatening, and an arpeggiator on an instrument with no filter — those are six different pieces of equipment being used six different ways, and everything else follows. The three revival styles are sorted on the same axis thirty years later: a saturated bass line, a riff two instruments are playing at once, and a band.

**One of these four artists is not in this genre.** `ambient/kosmische` is *Phaedra* and *Rubycon* — one chord for seventeen minutes with a sequencer over it — and it belongs there, because that music answers the question that made `Genre` an abstraction the way the rest of ambient does: the melody comes from the drone. The other four have tunes, keys, cadences and choruses that arrive. The distance between the two shows up as seven fields where this genre states the opposite of what ambient states, and ambient states every one of them on purpose:

| | ambient | synth |
|---|---|---|
| `mix.melody` vs `mix.pad` | 0.43 vs 0.71 — inverted deliberately | 1.0 vs 0.63; the tune is on top |
| `mix.comp` | 0.44 — accompaniment | 0.57 — the sequencer is a **co-lead** |
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
| **Outrun** | 98–118 | 90% minor | eighth-note bass | The night drive. A supersaw over a plucked saw bass, a two-bar arpeggio leading the comp, gated snare, `duck: 10` on the pad, `hook: earworm`. Retrowave era only |
| **Darksynth** | 124–150 | 95% minor | `cycle: 32` bass | `stalker` at speed with a guitarist: ♭II and the tritone, a supersaw lead with the guitar under it, palm-muted counter, `break` on the bass. Retrowave era only |
| **Boulevard** | 108–126 | 65% **major** | 16th comp stabs | The television theme. maj7 and a real ii–V, slap bass, brass stabs, FM bells on the counter, backbeat. Retrowave era only |

Two of these are named for a body of work and it is worth saying which. **Stalker** is *Halloween* and *Escape from New York* — the branch of this music that descends from horror scoring rather than from the cosmos, and the one where the ostinato is the entire composition. **Cinematic** is *Blade Runner*.

`cinematic` having no `cycle` at all is a statement, not an omission: Vangelis is a man holding chords, and an ostinato underneath him turns the style into `berlin` at half speed.

**`optical` is `berlin` with the filter taken away, and that is the whole argument for it being a separate style.** *Optical Race* and *Le Parc* are the same group doing the same job on an instrument that has no cutoff knob, because an FM patch is bright or it is not. Everything that follows from that is a style-level field a table row cannot reach: `filter` goes from `{ ramp, 0.75 }` — where the sixteen-bar opening *is* the composition — to `{ step, 0.15 }`, so the arrival has to be built out of the gated snare and the layers instead; `modeWeights` goes from 80% minor to 55% major, because this half of the repertoire is not dark and no quantity of major progressions rescues a style that draws minor four times in five; and `melody.sequence` drops from 0.6 to 0.4, because by 1988 the tune is a tune rather than a colour drawn over the sequence.

### The revival, and why it is three styles of this genre

`outrun`, `darksynth` and `boulevard` are 2005 onward. They belong here rather than in a genre of their own because of the test `genre/types.ts` sets: a genre exists to answer *how does the melody relate to the harmony under it*, and these three answer exactly as the six above them do — follow the key, never raise the seventh, ♭VII where another idiom writes V. A separate genre would have been this file's scale rule copied out with different tempi attached.

Five artists went in and three styles came out, because a style has to differ in fields the tables can state:

| | Nearest older style | What a table can say about the difference |
|---|---|---|
| **`outrun`** — Kavinsky | `machine` — both `requireLayers: ['bass']` | Kraftwerk's bass is a *tune* that answers its own first half; this one is a texture. `duck: 10`, `filter: step`, `keyChangeChance` 0.08 |
| **`darksynth`** — Carpenter Brut, Perturbator | `stalker` — the same ♭II and `#IV` | 124–150 against 84–104, no `twoHanded`, a named `distortionGuitar`, and `drumFills`/`transitions` on where the older style turns them off |
| **`boulevard`** — Mitch Murder, Waveshaper, Baldocaster | `optical` — both bright, major-leaning, sequencer-adjacent | A played bass (`slapBass`), a backbeat kit rather than an arpeggio, sevenths and a resolving ii–V, and the duck |

**`boulevard` is the one to watch and its own header says so.** It sits nearest an existing style and can be drawn in the same era as it, so the four separations above are the argument for it existing at all. The measurable one is the bass, and it was measured over 60 songs of each in the `retrowave` era: **`boulevard` is dealt a slap patch 47% of the time against `optical`'s 8%**, and 58% once the oscillators joined the era's bass list. The first draft of its instrument table read 5–4–3 and produced 32%, losing to a picked bass at 35% — a signature that loses the draw two times in three — so the weight went to 7–4–2 after the count rather than before it.

Two other patch counts, both of them claims the style headers make in prose: `darksynth` has a guitar somewhere in **60%** of its songs (77% before the supersaw took the lead), and `outrun` in 8%, which is the era palette leaking rather than the style asking.

**`boulevard`'s harmony is Japanese and the table says so.** `IV–V–iii–vi` — the royal road, 王道進行 — is in its verse and chorus at weight 4, because the producers this style is named for grew up on Japanese television themes, arcade loops and city pop records, all of which run that sequence and the maj7 vocabulary around it. The same progression leads `pop/citypop`'s chorus table at 6, which is where it comes from. What this style deliberately does *not* get is that style's chord-following scale rule: a synthwave producer playing a city pop turnaround is playing the four chords they remember, not sight-reading the chart, and the ♯11 over the `IVmaj7` is the half that did not survive the trip.

**`darksynth` runs its counter as an `ostinato`, and that was found by reading the emitted parts rather than by design.** Left at the default `answer`, the distorted guitar came out playing a melodic reply in the lead's gaps — a good counter-line and not a rhythm guitar — which contradicted the palm mute the style declares on that same layer, since the whole point of a mute is that the part is continuous. It is `berlin`'s field borrowed for a different musical reason: there two sequencers phase against each other, here a guitarist and a bass player are playing the same figure and the point is that they agree.

Two things the revival did *not* need. The moods were already right — `motorway` and `neon` are outrun and the city, written for the older records and describing these exactly — and the drum machines are the same four boxes, because this music is played on a LinnDrum, an 808, a DMX and a 909 for the same reason it is played on a saw lead.

### Rows per style

Each style carries three to seven figures per layer, and the rows are records rather than variations. `machine`'s four bass figures are 1974, 1977, 1981 and 1983 — a flowing four-bar walk, a rolling two-bar train, the hook, and a sixteenth figure with holes cut in it — and the style header names which is which. Measured over 400 songs with `seed: spread-N`, the six styles field **320 distinct rhythm-section shapes** (bass onsets × comp onsets × kit voicing over the first four bars), against 183 for the five styles before this pass. `machine` moved furthest: 0.27 shapes per song to 0.82.

The revival was checked on the same axis rather than assumed to sit on it. Over the same 400 seeds, counting a shape as the bass onset slots, the comp onset slots and the kit's voice-and-slot set across the first four bars, the nine styles field **365 distinct shapes** and the three new ones return 19 shapes in 20 songs, 18 in 19, and 18 in 18 — 0.95 to 1.00 apiece, at the top of the genre beside `optical` and `machine`. Read that as *these tables are not one song with the tempo moved* and not as a comparison with the 320 above it: the counting is defined differently here and the two numbers are not the same measurement.

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

The melody's patch there is GM 87, since removed from the catalogue for sounding bad; the numbers are the track's filter and are unaffected. The bass staying still is the design working. Closing a lowpass on a part already below the cutoff removes it rather than darkening it: a filtered bass sounds absent, not distant, and the intro loses its floor exactly where it is establishing one.

**The outro does not ramp**, and `npm run genres` exempts it explicitly. It sits at the bottom of the genre's `kind` table because these records end by shutting the filter, so the whole section quantises to one dark value. A filter opening across an outro would brighten the piece as it ended. A separate check asserts no section ever runs *backwards*, which would be a real bug.

Brightness is quantised to sixteenths so that consecutive equal values collapse to `_` in the Strudel grid. Genres with no filter profile emit **no `brightness` at all** rather than a brightness of 1 — the same sound, and a much worse artefact, since 1 means a full-length grid of the number one per track. Asserted at 0 of 13115 notes.

## The mix, and the register

```
melody 1.0   comp 0.57   bass 0.65   pad 0.63   counter 0.50   drums 0.55
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

The technology changed this music more than in any other genre here, so the first three eras are the hardware — and the fourth is not, which the file admits at length rather than pretending otherwise.

- **`modular`** (1972–77) — monophonic leads only; polyphony bought from a divide-down string machine or a combo organ, never from a synth. `phaser` 0.65 on the pad, resonance on lead and bass. Preset rhythm boxes.
- **`polysynth`** (1978–83) — Prophet, CS-80, Jupiter. The vocoder. No phaser and no crush, sitting deliberately between its neighbours' defining effects. `keyChangeChance` 0.3, the highest, because `cinematic` peaks here.
- **`digital`** (1984–90) — DX7 and Fairlight, `crush: 12` on the sampled layers only, gated snare. `berlin` weighted lowest, argued from hardware: FM has no cutoff knob, so the sixteen-bar filter opening stops being available. `optical` carries the era's heaviest weight for the other half of that sentence — the group did not stop working in 1984, and what they made instead is what that style is.

- **`retrowave`** (2005–) — the era that invented nothing, and the one that plays real oscillators. `supersawLead`, `supersawPoly`, `supersawPad` and `analogBass` lead its palette: superdough's own `supersaw`, `square` and `sawtooth` rather than a GM sample of one, which is what the three vintage eras still deal. Its drum machines are the same four boxes, and the rest of it is **the desk**: `Effects.duck` at 6 dB across the pad and the sequencer, `drive` 0.35 and a two-octave `wah` filter envelope with resonance on the bass, `reverbSize` 0.95 — the largest in the project — a `mix` of its own with the kick and the bass in front of the tune, and `voiceEffects` gating `sd` and `cp` at 180 ms, which is the correction [rock's arena era](rules.md) made first. `keyChangeChance` 0.08, the lowest here: this music does not lift, it adds a layer.

The fourth era is the one place in this genre where the era is the production rather than the instrument, and that is a weaker claim than the other three make. It is stated in the file instead of being smuggled in, because the fields carrying it are countable: a palette, a mix, the duck, the drive, the pluck and one per-voice table, and if they were removed the era would be `digital` with a different label.

**Style weights are 24 against 16.** The three revival styles take about 60% of the era and the six older ones keep the rest, measured at 42 of 72 retrowave songs across 300 seeds. The first draft ran 24 against 21 and produced an era that was half pastiche — defensible for the repertoire, wrong for a table whose reason to exist is the three styles it introduced. `stalker` is the highest of the six at 4, because the composer those records are named for went back into a studio in 2015 and made three more.

**`modular` inverts the rule ambient set.** Ambient restricted itself to banks carrying every voice its styles emit, and that cost it the period-correct boxes — Minipops and CompuRhythm 78 were excluded for having no side stick. But a four-sound preset box *is* the 1974 sound, so this era takes them and leans on `resolveVoice`. Stated rather than assumed, because substitution degrades silently: a fill written on three toms and a crash arrives as four snare hits and an open hat, and nothing reports it.

Two facts read from the sample pack rather than from `BANK_VOICES`, whose own docstring warns that an unlisted bank is merely unmeasured: **`RolandTR909` is in the pack** but has no `perc`, `cb` or `sh`; **`RolandTR808` has no ride**.

## Moods (`src/genre/synth/moods.ts`)

Iskelmä sorts by degrees of melancholy, jazz by heat, ambient by weather and light. This repertoire sorts by **destination** — where the record is taking you, which is the only axis its sleeve notes have ever used. Ordered outward from the room the record is playing in: `dread` (the street), `motorway` (the country), `neon` (the city), `cosmos` (off the planet), then `neutral`.

Two genre-specific behaviours: **`leap` runs opposite to tempo**, because fast moods are sequencer moods and sequencers move by step; and **`ornament` is low everywhere**, because there is no player.

`neutral` is last and has to be. An unspecified mood does not draw at random — the final entry of the table is the fallback for every song. This genre shipped briefly without one, so `cosmos` became the default and biased `cinematic` 3.0 and `stalker` 0.4; over 200 songs it produced 98 cinematic and 6 stalker, and every symptom pointed at the style weights, which were flat and innocent. `npm run genres` now asserts that every genre's last mood is neutral, because nothing about a final array element looks load-bearing.

## Constraint and repetition defaults

`standard` strictness and a `catchy` hook, with `machine`, `stalker` and `outrun` at `earworm`. Five overrides: `parallel-perfects` and `avoid-fourth` off — planed synth brass and sus chords are the sound; `unresolved-seventh`, `static-repetition` and `repeated-note-run` softened, because a Kraftwerk melody repeats one note more than any rule expects.

`unresolved-leading-tone` is deliberately **not** overridden. In major these songs cadence and a hanging leading tone is a fault exactly as it is in iskelmä. In minor the rule is simply inert, because the scale rule never produces a raised seventh for it to catch — which is a much better way to be modal than switching the rule off.

## Vocals

A vocoder, for `machine` — and now for `outrun`, which is the only revival style that keeps the `vocal` layer. That is the correct half of the repertoire: the talkbox and the vocoder are what the night-drive records sing through, where `darksynth` and `boulevard` exclude the layer outright because a vocoder over a distorted guitar or a slap bass is a machine-pop record that has taken a wrong turn. The genre owns exactly one voice, and refusing it is more honest than misapplying it. `formantTrack: 0` is the whole file: the renderer's `effectiveF1` lifts the first formant to meet the fundamental on high notes, because that is what singers do — the jaw opens and a closed vowel migrates toward /a/ whether the singer wants it or not. A vocoder is a *fixed* bank of filters a carrier is pushed through, and the bank does not care what pitch arrives. With the compensation off it walks out from under its own resonances as the line climbs and thins into a buzz, and that is the sound rather than a defect.

Also `vibDepth: 0` (no diaphragm), `scoop: 0` (an oscillator has no way of being approximately in tune on its way somewhere), `bodyGain` at three times any sung profile because the carrier leaking through unshaped *is* the instrument, and `syllableBeats` locked to the eighth — to the sequencer, not to a breath.

## What the audit says

*Measured before the 2026-09-02 pass; the revival's leads, mix and forms have moved since.*

60 songs, `npx tsx src/audit.ts 60 synth`:

```
chord tone on the beat        81.0%   (want > 70%)
stepwise (<= 2 semitones)     37.4%   (want 55-70%)
leaps                         41.2%
repeated notes                21.3%
average melodic range         15.5 semitones
sections closing on the tonic 68.8%
songs with a final key change 18.3%
overlapping melody notes      1
style spread                  berlin 14, stalker 10, machine 9, cinematic 6, cosmic 6,
                              boulevard 5, darksynth 5, outrun 4, optical 1
```

**Two of these moved for reasons that are not this genre's, and one moved for a reason that is.** The same run against a pristine checkout reads stepwise 39.2%, range 15.6 and key changes 26.7%: the melodic figures had already widened under work elsewhere in the engine — the printed 11.6-semitone range in an earlier revision of this file was stale before the revival was written — so the first two numbers here are a re-measurement rather than a consequence. **The final-chorus lift is the real change**, 26.7% down to 18.3%, and it is `retrowave`'s `keyChangeChance` of 0.08 diluting a genre average across four eras instead of three. That is the intended behaviour stated as a genre-wide figure: this music does not modulate.

Over 300 seeds the era spread is near-uniform (modular 83, digital 78, retrowave 72, polysynth 67) and each revival style lands 12–16 songs, against 34–52 for the six that are drawable in every era.

Ensemble, 60 songs, 16833 voicings: mud below middle C 0.0%, melody at or below the comp's top 0.3%, unison doubling 0.4%, mean comp top 62.1 against mean melody low 67.5. The two non-zero figures are 0.2% on a pristine checkout, so the revival added roughly one voicing in five hundred to each; both budgets are 25% and 8%.

**Stepwise motion is under the printed target and that is not a fault here.** The band is 55–70%, written for a sung idiom; this music's leads are keyboards and a large share of its melodic interval budget goes on the octave-and-a-bit leaps that mean *distance*. `cosmos` and `dread` both raise `leap` deliberately. It is a printed target, not an assertion, and the assertions that do exist — no raised seventh in minor, a ramp that opens, `berlin` outpacing `kosmische` — all pass.

**The overlap count is noise at this sample size, not a defect.** Sixty songs is small enough that one two-handed song swings it: measured over 400 songs the melodic line carries **8 overlaps in 58,206 notes**, which is the same rate the genre had before the tables were widened (8 in 56,611).

## Known limitations

- **Sub-bar harmony does not exist.** `Progression.chords` is one numeral per bar, so a chord cannot change on beat 3. This genre never wanted it — its harmony moves every two to four bars — but jazz does, and the change belongs in the pass that rewrites the jazz tables to use it.
- **No tempo or metre change within a song.** `bpm` and `beatsPerBar` are song-level. Vangelis and Tangerine Dream both do both; the blast radius is the concert renderer's clock.
- **`drive`, `crush` and `phaser` are audition-only.** A shipped `.mid` of an electric violin is a violin. Consistent with `delay` and `highpass`, but the gap widens as more of the character moves into effects — which is the argument for a native engine rather than MIDI being the real delivery target.
- **Polyphonic vocoding is out of scope.** The `vocal` layer doubles the melody, one line. Kraftwerk's monophonic vocoder lines are the larger part of the catalogue and cost one field; the chordal ones cost a project.
- **Layers are still a fixed enum of eight** with dance-band names. `berlin` wants two sequencers and gets them by routing the counter layer through the comp generator, which works and is not the same as being able to say so.
- **A guitar lead is written like a keyboard lead, and this was measured rather than feared.** `darksynth` deals a distorted or overdriven guitar to the melody in 77% of its songs, and over 120 songs the line those patches get is indistinguishable in shape from the one the saw lead gets: leaps 38.5% against 38.3%, intervals wider than a fifth 3.8% against 4.3%, mean span 16.4 against 16.3. What the patch *does* change is the register — `centre` 60 against the saw's 72, so the guitar plays an octave lower — and the timbre. `idiom: 'plucked'` and `agility: 0.8` against `0.9` are not enough on their own to write a riff differently from a melody, and the field that would be is not `Instrument`'s: a guitar riff is a *figure* and this genre asks the melody generator for a tune. The style compensates with its cells and its `leap`, which is a style-level answer to an instrument-level gap.
- **`darksynth`'s `break` and `shot` are the first in this genre.** Both are borrowed wholesale from the dance and funk side of the project, and neither has been listened to in this context. `breakCarrier: 'bass'` is the right layer by argument — it is the one part here that states time unaccompanied — and whether a bar of a sixteenth-note riff alone reads as a break or as a dropout is exactly the sort of thing the last entry below covers.
- **The tables have not been settled by ear.** Every number here is a considered first pass that passes measurement. Tempo bands, progression weights and filter depth are the ones a listening pass will move — and the three revival styles have had one pass fewer than the six above them.
