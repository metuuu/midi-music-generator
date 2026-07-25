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

## Quartal voicings

Modal jazz holds one chord for eight or sixteen bars. Tertian voicings turn to wallpaper at that timescale, so the modal comp stacks perfect fourths drawn from the scale instead; their harmonic ambiguity is what keeps a motionless chord interesting. `npm run genres` asserts the comp is 100% fourths.

## Eras (`src/genre/jazz/eras.ts`)

- **1930s–40s swing** — clarinet and muted brass over acoustic piano, upright bass, brushes. Gypsy jazz lives here too.
- **1950s–60s bop** — tenor and alto sax, trumpet, piano trio, walking bass, ride cymbal.
- **1960s–70s modern** — Rhodes and vibraphone, flute and soprano sax; bossa and modal material.

A caveat on drums: every bank available to the browser preview is a drum *machine*, so a swing ride pattern will sound like a drum machine playing one. The banks chosen are the most acoustic-leaning ones that carry both a ride and a shaker. **This only affects the preview** — MIDI maps drums to GM channel 10, so a decent soundfont gives real ride cymbals and brushes.

## Moods (`src/genre/jazz/moods.ts`)

Where iskelmä sorts itself by degrees of melancholy, jazz sorts itself by heat and room temperature: `smoky`, `swinging`, `cool`, `hot`, `bluesy`, `dreamy`, `neutral`. Run `npm run moods` to see what each does to key, tempo and style choice.

## Constraint defaults

Jazz defaults to **`light`** smoothness rather than `standard`: the rules exist to stop a line wandering, and jazz wanders on purpose. **Bebop overrides this to `free`** — chromatic approach notes, enclosures and unprepared dissonances are the *content* of a bebop line, not defects in it.

Jazz also overrides six individual rules, because the shared table was written from classical voice-leading practice and jazz does not hold all of it. `unresolved-leading-tone` and `chromatic-tone` are disabled outright; `unprepared-dissonance`, `flat-nine` and `parallel-perfects` are relaxed; `avoid-fourth` is *tightened*, because the natural 11 over a major seventh is a genuine avoid note here. See [smoothness.md](smoothness.md#do-genres-share-the-rules) for the reasoning.
