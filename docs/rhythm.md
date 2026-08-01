# Rhythm

**What the rhythm section plays, and how it stopped being one bar repeated a hundred times.**

```bash
npm run gen -- -n 8 --genre iskelma --style tango
npm run genres          # the assertions this page describes
```

The melody made this move years ago: `melodyCells` used to be played literally and now feeds a compositional engine as *statistics*. The bass, comp and drum tables never did. They were the notes, drawn once per song at [`song.ts`](../src/generate/song.ts) and applied to every bar — so the bass rhythm of a hundred-bar song was one bar, a hundred times, with only the pitches moving underneath.

Three things changed that. See [`rhythm-plan.md`](rhythm-plan.md) for the reasoning and for what the plan got wrong.

## 1. A bass may state a shape

`BassTone` was six *chord functions* — `root`, `fifth`, `third`, `seventh`, `octave`, `approach`. Each asks the chord what note to play, so `seventh` is +11 over a `maj9` and +10 over a `min11`. Right for a walking line, which is outlining the chord it stands on. Wrong for a riff, which is a shape.

**A number is semitones from the chord root, taken literally**, negative for below:

```ts
{ name: 'seven-riff', weight: 6, hits: [
  { at: 0,  dur: 3, tone: 0,  vel: 0.98 },   // root
  { at: 4,  dur: 3, tone: 0,  vel: 0.86 },
  { at: 8,  dur: 3, tone: 7,  vel: 0.9  },   // fifth, fixed
  { at: 12, dur: 2, tone: -2, vel: 0.8  },   // flat seventh, fixed
] },
```

Fusion's table claimed *"a shape, re-rooted every time the harmony moves"* in prose and could not say it in data; its vamps run through `bIImaj9` and `bVImaj9`, so the figure was a semitone out in a third of the bars it played. Two figures in the catalogue are written this way — that one and `cosmic/driving-quarters`. The rest genuinely want chord functions, and `machine` and `stalker` produce only triads, so their `seventh` already resolves to a flat seventh through the fallback.

The root is *placed* rather than clamped: `clampToRange` applied to the top of a shape folds two notes onto one pitch, which keeps every pitch class and destroys the figure.

## 2. One vocabulary of operators

`BassPattern.hits`, `CompPattern.hits`, `DrumPattern.voices` and `Style.shots` are four authoring surfaces answering one question — *what onsets does this style hit?* [`generate/rhythm.ts`](../src/generate/rhythm.ts) now carries a vocabulary over those onsets:

| operator | what it does |
|---|---|
| `anticipate` | push one attack early and hold it through where it was |
| `thin` | drop the onsets the ear expects least, by `metricStrength` |
| `subdivide` | split one attack into two of half the length |

All three are **total and payload-preserving**: they take a figure and return a figure, return the input unchanged when what was asked for will not fit, and never invent an onset carrying something the caller did not already have. A caller never has to check first.

**Not a library of figures**, and that line is load-bearing. `style/feel.ts` states the rule — *a proposal that needs its own bass figure is a style* — and a shared bank of named patterns is the style table again under a better name, ending with every genre reaching for the same twelve figures. An operator has no figures in it, so a tango's push is the tango's own pattern pushed.

A whole *attack* moves, not one note of it: ambient's `drone-octave` sounds a root and an octave on the same slot, and pushing one of them turns a dyad into two strikes an eighth apart.

## 3. Variation within a fixed identity

The band's identity stays fixed for the song — the patterns are still drawn once, and a band that changed its comping figure every eight bars would sound like a compilation. What varies is how that identity is *played*, which is what the drummer has had all along through `planKitVariation`.

```ts
// on Style
vary?: Partial<Record<'bass' | 'comp', number>>;
```

One gesture is drawn per section per layer — a `push` or a `fill` — and lands on **bar 3 of each four-bar group, never the section's last bar**, which belongs to the drummer's fill and to the seam. An eight-bar section gets at most one; a four-bar intro gets none, because one phrase has no phrase end inside it.

`fill` is refused on an arpeggio: `generateComp` carries its ladder index across the barline on purpose, so one added onset would re-index every later bar — a different part from there on rather than a gesture.

Six styles carry one today, out of twenty-nine: `tango` (the only one whose comp joins), `iskelmapop`, `foksi`, `bossa`, `trio`, `gypsy`. `humppa`, `jenkka` and `beguine` are eligible and deliberately absent — the first two are relentless on purpose, and the third's bass *is* the 3-3-2, where a push blurs the figure the style is named after.

## 4. A seam shot comes from the band

`shotFigures` used to derive from the metre alone: the group heads, and the heads with the last anticipated. That is exactly right in an asymmetric bar and generic everywhere else — a tango, a foksi, a bossa and a swing are all 4/4 with no `groups`, so all four would hit the same two figures.

`ShotSource.band` carries the onsets the drawn bass and comp patterns are already playing, thinned until it is a shot rather than the part. Precedence is `shots` table → band → metre. Measured across the catalogue, the busiest metre offers **25 distinct figures from the band against 2 from the bar alone**.

The kit is allowed to play it because the pattern draws are **hook-invariant by construction** — they happen before `hookRng` exists and before the section loop, and the running stream inside that loop is deliberately kept aligned across hook levels.

## The one rule

**Every per-section draw comes from its own namespaced stream.** `${seed}:vary:bass:${s}`, never the running `rng`.

This is not tidiness. Taken from the shared stream a single number moves every song in every genre — the `drumSource` note in `song.ts` records a `npm run genres` check dropping from 66% to 59% that way, and the probe that settled it showed the songs moving because a draw had been *consumed*, not because it mattered. Worse, the running stream inside the section loop is hook-aligned on purpose, so a draw taken from it would make drum events depend on the tune and break the `--hook` A/B guarantee.

A style that declares no `vary` constructs no `Rng` and draws no number, which is what makes every one of these changes additive: waves 1, 3 and 4 left the catalogue byte-identical.

## What it costs

- **A literal interval can clash.** `tone: -2` over a chord whose seventh is major is a semitone apart. That is what a riff is, and it is opt-in per pattern.
- **A gesture is invisible from outside.** `hitTogether`'s tutti and `landEnding`'s button also rewrite a bass bar, so *where* a variation landed cannot be asserted from a finished song — it is asserted against the generator directly.
- **Transitions edit last.** Any check comparing two songs that differ in one axis must hold the seams out, or it will blame the axis for the transition's edit. `withoutSeams` in `genre-check.ts` is that hold-out, arrived at after four checks failed exactly that way.

## Known limitations

- `vary` reaches six styles of twenty-nine. The mechanism is measured; the weights are a listening decision.
- A cycled pattern is never varied. Its slots are relative to the figure rather than the bar, and drifting against the bar is the point of it.
- A `walking` bass ignores variation entirely — `generateBass` returns before it reads one.
- The numeric tone is chord-root-relative. A figure that ignores the harmony is a pedal, and `sustain` already says that.
