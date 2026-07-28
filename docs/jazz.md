# Jazz — the ruleset

Organised by feel rather than by dance, because that is how the music is actually grouped: a rhythm section asks "medium swing or bossa?", not "which dance?".

Three things separate the jazz tables from the iskelmä ones, and they matter more than any individual progression.

**Melody follows the chord, not the key.** This is the single biggest difference and the reason `Genre` exists as an abstraction at all. Iskelmä melody draws on one scale for the whole song — aeolian, switching to harmonic minor at cadences. Jazz melody re-orients bar by bar: each chord quality implies its own scale. That is chord-scale theory, and without it a jazz line over jazz changes still sounds like iskelmä with sevenths bolted on.

**Swing is a number, not a style.** `0.33` is the triplet feel of straight-ahead jazz. Bossa nova is `0` and is *not* swung — that is asserted deliberately in the tables, because playing bossa with a swing feel is the most common way to get it wrong.

**Harmony is seventh chords by default.** Plain triads barely appear. `Imaj7 vi7 ii7 V7` is the resting state, not an embellishment.

## Styles (`src/genre/jazz/styles.ts`)

| Style | BPM | Swing | Mode | Defining traits |
|---|---|---|---|---|
| **Medium swing** | 120–184 | 0.33 | 70% major | Walking bass, ride cymbal, syncopated guide-tone comping, ii–V–I |
| **Bebop** | 196–280 | 0.33 | 60% major | Continuous eighth-note lines, ii–V chains, tritone substitution |
| **Ballad** | 56–80 | 0.22 | 58% major | maj9/min9 harmony, brushes, as much silence as sound |
| **Bossa nova** | 122–152 | **0** | 72% major | Straight eighths, two-beat root–fifth bass, syncopated comping |
| **Blues** | 92–176 | 0.33 | 76% major | Twelve bars, dominant sevenths throughout, blue notes |
| **Modal** | 112–168 | 0.33 | 82% minor | Static Dorian harmony for 8–16 bars, quartal voicings |
| **Gypsy jazz** | 176–248 | 0.26 | 72% minor | "La pompe" on all four beats, minor sixth and diminished harmony |
| **Piano trio** | 128–208 | 0.31 | 54% major | Two-handed piano, no other chord instrument, post-1960 harmony |
| **Odd metre** | 116–168 | 0.30 | 66% minor | 5/4 grouped 3+2, modal vamp, bass figure that spells the grouping |
| **Fusion** | 132–196 | **0** | 72% minor | 7/8 grouped 2+2+3, ostinato bass, two-handed octaves, quartal harmony |

## Chord-scale mapping

Each chord quality gets the scale jazz practice associates with it, rooted on the **chord**, not the key:

| Chord | Scale |
|---|---|
| `maj7` `maj9` `maj6` | major (ionian) on the root |
| `min7` `min9` `min6` | **dorian** on the root — not aeolian |
| `dom7` `dom9` `dom13` | mixolydian on the root |
| `min7♭5` | locrian on the root |
| `dim7` | whole-half diminished |
| `min(maj7)` | melodic minor |
| altered dominants (`7♭9` `7♯9` `7♯5` `7♭5`) | **melodic minor a semitone above the root** — the altered scale |

That last row is the standard shortcut for the altered scale: G7alt takes A♭ melodic minor.

## Form

Head–solos–head over a fixed chorus, not verse/chorus. `verse` is the A section and `bridge` is the B, so an AABA chorus is four sections:

```
intro(4) → A A B A → solo × 2–4 → A A B A → outro(4)
```

The **twelve-bar blues** declares `chorusBars: 12`, and the form builder rewrites every section to that length. It also folds any bridge back into the head, because a blues does not have one.

Solo choruses are capped at four and always appear consecutively — a form that alternates solo and head reads as indecision rather than as a band taking choruses.

## Walking bass

The fixed-degree bass patterns cannot produce a walking line, because a walking line is defined by *connection*, not by which chord tone lands on which beat. Styles that need one set `walking: true` and get a dedicated generator following the rules a bass player actually does:

- beat 1 is the chord root, so the harmony is unambiguous;
- the last beat approaches the next root by a semitone, or from a fifth above;
- the beats between move mostly by step toward that approach note, preferring chord tones but taking scale tones freely.

Measured output is **73% stepwise** — 46% semitones, 27% tones — which is what a walking line looks like.

## Metre

Three of the ten styles are not in four, and two of those are not in a metre that divides evenly. Two declarations carry all of it.

**`beatsPerBar` is quarter-note beats, and may be fractional.** The engine's beat is always a quarter — `beatUnit` is notation and only the MIDI header reads it — so 7/8 is `beatsPerBar: 3.5`, which is exactly true: seven eighths *is* three and a half quarters, and the bar is fourteen honest sixteenths. `timeSignature()` works the numerator back out, so the MIDI file, the CLI listing and the browser all say `7/8`.

**`groups` says how the bar divides**, in sixteenths — `[12, 8]` for the 3+2 of a 5/4, `[4, 4, 6]` for the 2+2+3 of a 7/8. This has to be declared because it cannot be derived. `metricStrength` computes accent by halving the bar and counting in fours, which is exactly right for 4/4 and confidently wrong for 7/8, where it finds a half-bar at slot 7 — the middle of the last group and the last place anyone accents. There is no formula that recovers 2+2+3 from the number 14; the grouping is a compositional choice, and 3+2+2 is a different piece of music.

Handed the grouping, the group heads become the beats: the melody phrases to them, the constraint engine defends them, the soloist lands on them, the kit accents them, and the drummer counts them in — a count-in in 7/8 gives the three pulses, long-short-short, rather than four quarters that state a metre nobody is about to play. `npm run genres` asserts that every grouping sums to its own bar and that the kit is louder on the group heads than off them.

## Cycles — the figure that is not the bar

Every bass, comp and drum pattern used to be read as "one bar, repeated", and the repeat was not in the table but in the loop that read it. So a figure three beats long over a four-beat bar — the commonest device in anything called progressive — was not missing from the tables, it was **inexpressible**.

`cycle` says how long the figure actually is, in sixteenths, and the generators walk cycles rather than bars. A `cycle` of 12 against a 4/4 bar arrives on a different beat every bar and comes back round every three; the fusion kit's `ride-drift` is four slots against a fourteen-slot bar and meets the barline every seven. Three things stay bar-shaped whatever the cycle: chords change on the barline, comp voicings are led per bar, and a drum fill belongs to the last bar rather than the last cycle.

## Two hands

`twoHanded` says the lead is one player using both. The right hand has the tune and the choruses; the left hand is written afterwards, against the finished line, and goes into the *same track* — so the Song IR carries one part with two things happening in it, which is what a piano is. `melodicLine()` takes the line back out again for anything measuring melody.

**What the left hand does** is drawn per section, from four modes, because a hand that only ever answered would be a player with a tic:

| Mode | What it plays |
|---|---|
| `answer` | Rootless chords in the holes the line leaves. Post-war comping; thins out as the right hand gets busy. |
| `unison` | The line itself, doubled an octave down. The Corea gesture, and the one that is not a chord at all. |
| `block` | A chord struck *with* the line, on its longer and stronger notes. |
| `ostinato` | A figure that ignores the line completely — the montuno, on its own `cycle`. |

**Anatomy comes from the instrument, not the style** (`HandSpec` in `style/instruments.ts`). A piano's left hand is a three-note rootless shell an octave below the tune; a vibraphone's is *two mallets* — two notes, a fifth of daylight, and a floor on the instrument rather than eight semitones under it; an accordion's is the button side, a full stradella triad with its own root, below F3 where the choreographer expects the split. An accordion cannot play `unison` at all, and says so with `melodic: false` rather than by drawing the mode and producing nothing.

One invariant holds the whole thing together and is asserted by `npm run genres`: **the left hand never sounds a note by itself.** `melodicLine` separates the hands by reading a note sounding alone as the right hand, so a lone accompaniment note is not thin — it is counted as melody. Every mode either sounds two notes or lands on a note of the line, and a hand with no room to voice a chord stays silent, which is what a player does.

## Quartal voicings

Modal jazz holds one chord for eight or sixteen bars. Tertian voicings turn to wallpaper at that timescale, so the modal comp stacks perfect fourths drawn from the scale instead; their harmonic ambiguity is what keeps a motionless chord interesting. `npm run genres` asserts the comp is 100% fourths.

## Eras (`src/genre/jazz/eras.ts`)

- **1930s–40s swing** — clarinet and muted brass over acoustic piano, upright bass, brushes. Gypsy jazz lives here too.
- **1950s–60s bop** — tenor and alto sax, trumpet, piano trio, walking bass, ride cymbal.
- **1960s–70s modern** — Rhodes and vibraphone, flute and soprano sax; bossa and modal material.
- **1970s electric** — the band plugs in. Rhodes and synth over electric bass and clean guitar; where fusion and the odd metres live. A fourth era rather than a shading of the third, because an `odd` or `fusion` chart played by the modern band comes out with a double bass walking under it.

A caveat on drums: every bank available to the browser preview is a drum *machine*, so a swing ride pattern will sound like a drum machine playing one. The banks chosen are the most acoustic-leaning ones that carry both a ride and a shaker. **This only affects the preview** — MIDI maps drums to GM channel 10, so a decent soundfont gives real ride cymbals and brushes.

## Moods (`src/genre/jazz/moods.ts`)

Where iskelmä sorts itself by degrees of melancholy, jazz sorts itself by heat and room temperature: `smoky`, `swinging`, `cool`, `hot`, `bluesy`, `dreamy`, `neutral` — plus `restless`, which is the one mood that is about metre rather than temperature. Heat is the right axis for a music whose bar is always four, and says nothing at all about a bar of five; `restless` is the axis those sort on, which is how hard the band is making you count. Run `npm run moods` to see what each does to key, tempo and style choice.

## Constraint defaults

Jazz defaults to **`light`** smoothness rather than `standard`: the rules exist to stop a line wandering, and jazz wanders on purpose. **Bebop overrides this to `free`** — chromatic approach notes, enclosures and unprepared dissonances are the *content* of a bebop line, not defects in it.

Jazz also overrides six individual rules, because the shared table was written from classical voice-leading practice and jazz does not hold all of it. `unresolved-leading-tone` and `chromatic-tone` are disabled outright; `unprepared-dissonance`, `flat-nine` and `parallel-perfects` are relaxed; `avoid-fourth` is *tightened*, because the natural 11 over a major seventh is a genuine avoid note here. See [smoothness.md](smoothness.md#do-genres-share-the-rules) for the reasoning and [rules.md](rules.md) for the full table.
