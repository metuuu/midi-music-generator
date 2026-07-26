# Arrangement, rhythm and the motto

Three stages that run *before* a pitch is chosen. They exist because the generator's output was measurably correct and audibly wrong, and every one of the faults responsible was invisible to a check that looks at the melody as a line.

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
| `plucked` — guitars, pizzicato, sitar | 0.8 | 0.4 | 1.0 | 0.1 |
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
npm run score -- 7 iskelma tango   # read one song bar by bar, all layers
```

`npm run audit` measures the melody as a line and always did. `npm run ensemble` measures how the layers sound together, which is where the faults above were hiding — every one of them was invisible to the line-level audit, and several of them were the *only* thing wrong.
