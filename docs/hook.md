# Hook

**How much the song repeats itself.**

Hook is the axis that decides whether a listener could hum the thing afterwards. It is a level setting from 0 to 4, like [smoothness](smoothness.md), and it is deliberately independent of it.

```bash
npm run gen -- -n 8 --genre iskelma --hook earworm
npm run hook            # what each level actually does to the output
```

## What it is not

Smoothness asks *is this note wrong*. Hook asks *have I heard this before*. Sharing one control between them would be a mistake, because the interesting settings are the corners:

| | low smoothness | high smoothness |
|---|---|---|
| **low hook** | rough and rambling | polite wallpaper — correct, forgettable |
| **high hook** | raw and catchy — most pop ever written | bland on purpose |

That last cell is the one musicians mean when they say pop is stupid because it is so simple. It is reachable here, it is honestly labelled, and it is not the default.

## The gap it closes

Before this existed the generator wrote a fresh melody for every section. The three choruses of a song were three different tunes that merely shared a style — which is a defensible way to write jazz solos and a hopeless way to write a chorus, because a chorus *is* the repetition. Motif reuse existed, but only inside a four-bar phrase.

So level 0 is not a disabled feature. It describes what the generator used to do, always.

## The levels

| level | id | what it does |
|---|---|---|
| 0 | `through` | every section is new material; no tune ever comes back |
| 1 | `loose` | sections of a kind share their harmony; a figure recurs inside a phrase |
| 2 | `standard` | the chorus is a fixed tune that returns each time |
| 3 | `catchy` | one figure carries a section, and every section is recalled |
| 4 | `earworm` | maximum repetition — simple on purpose, and hard to shake |

## The mechanisms

Ordered by how much each one is worth.

**1. Section recall.** A section replays the melody of the first section of its kind, transposed if the key has moved since. This is most of the effect: it is what gives a song a chorus rather than three unrelated tunes. Recall is keyed by section *kind and length*, so a twelve-bar blues chorus never inherits an eight-bar one.

**2. Harmony recall.** A section reuses an earlier section's chords without its tune. Cheaper and subtler — the ear notices that the chorus always turns the same corner even when the melody is new. Melody recall implies it: a tune replayed over different chords is not a recollection, it is a mistake.

**3. Harmonic simplicity.** Narrows the chord vocabulary and favours progressions that return to the tonic. The songs everybody can sing are built on three or four chords, and they are singable partly *because* the harmony stops asking for attention — the ear has spare capacity for the tune.

**4. Repetition, inside the tune engine.** The level reaches `src/tune/` as one number per section, multiplied by the section's own appetite: a chorus at `through` still repeats more than a bridge at `through`, because a chorus is a chorus. There it decides whether a phrase marked `repeat` comes back verbatim or ornamented, and whether the second half of a sixteen-bar section restates its material or varies it. See `tune-plan.md`.

Mechanisms 3 and 4 used to be six. `rhythmLock`, `vocabulary`, `exactRepeat`, `earlyRestate`, `mottoAdherence` and `sequence` were probabilities applied to a note-by-note melody walk, and they are gone with it — every one of them is now a consequence of the derivation the tune engine writes rather than a chance applied to a lottery. `sequence` is the one worth naming: it was authored in every level here and in every style in the project, and read by no code at all, because nothing developed a motif.

Figure-level repetition is therefore no longer a hook setting. A phrase is built from the section's own material at every level, so 34% of bars restate an earlier bar even at `through` — which is what "through-composed" has always actually meant. What the axis controls is whether a *section* comes back.

## Solos are exempt

`solo` sections are never recalled, at any level. This is a principle, not a tuning: a solo that replays an earlier solo is not a solo.

It is also what keeps a high hook setting from ruining jazz. The head becomes properly recognisable, the blowing stays free, and head–solos–head starts to mean what it says. Intros and outros are exempt too — they are the wrong length to match anything, and an intro exists to introduce.

Within the kinds that do recall, a chorus recalls hardest, then a bridge, then a verse.

## Defaults

Set per genre, overridable per style, overridable per call.

| | default |
|---|---|
| iskelmä | `standard` |
| jazz | `loose` |
| ambient | `catchy` |
| humppa, iskelmäpop | `catchy` |
| blues | `standard` |
| bebop, modal | `through` |
| ambient's `wasteland` | `loose` |
| ambient's `drone` | `earworm` |

Bebop is off for the same reason its constraints are: a bebop line is an argument that never repeats itself. Modal jazz declines to mark time at all, and with the harmony holding still a recalled tune would be the only thing marking it.

Ambient sits at the other extreme and for a reason that sounds like the modal one but is not. Modal jazz holds its harmony still so that *nothing* marks time; ambient holds its harmony still and then loops it, so the returning eight bars are the only structure there is. `drone` goes all the way to `earworm`, which is the one place in this project where maximum repetition is a description of the genre rather than a setting applied to it. `wasteland` pulls back to `loose`, because its fragments are supposed to sound overheard rather than composed.

## It is an A/B control, not a reroll

Pin a seed and the form, key, tempo, instruments and drums stay fixed at every hook level — only the tune and the harmony under it move. `npm run genres` asserts this.

Getting that property required giving each section its own RNG streams for melody, counter and band, rather than running one stream through the whole song. On a shared stream any decision that consumed one extra random number — a melody with one more note, a recalled chorus whose chords sent the comp down a different path — shifted every later section's drum fills, and both level controls stopped being comparisons of anything.

## What it costs

From `npm run hook`, 40 mixed-genre seeds regenerated at each level:

```
                                  through      loose   standard     catchy    earworm

Repetition
  choruses recalled %                 0.0        0.0       84.9       96.2       96.2
  all sections recalled %             0.8        0.8       63.1       76.2       76.2
  bars restating an earlier bar %    34.4       35.6       53.2       58.3       59.4

Cost — variety given up
  pitch classes / 4-bar phrase       4.49       4.47       4.46       4.49       4.43
  distinct bar shapes / song         38.5       37.8       27.9       25.7       24.3
  notes / song                        144        142        147        149        143
```

The trade is real and worth stating plainly. By `earworm` a song is built from about
sixty per cent as many distinct bar shapes as at `through`. That is the point, and it
is also the cost.

`notes / song` holding flat is deliberate: it guards the cheap way to score well on
every other row. A line that repeats because it has stopped playing is not a hook, it
is a rest.

Two rows read differently than they used to. **Pitch classes per phrase** sits at 4.4
at every level, against 5.3–6.2 before, and barely moves across the axis — the tune
engine picks a five-degree subset per section as a matter of course, so economy is no
longer something repetition has to buy. **Bars restating an earlier bar** starts at
34% rather than 20%, for the reason given above: a phrase is derived from the
section's material at every level.

## Known limitations

- ~~**Recall is verbatim.**~~ Fixed. A recalled section comes back varied — an ornament added, the high note taken up, the arrival held, sometimes a pickup in front of it — and how far varied depends on *which* time this is rather than on the hook level: an arrangement leaves the second chorus nearly alone and takes the top note up on the last one. A high hook setting varies *less*, because at `earworm` the point is that it is the same thing again.

  Both `npm run hook` and `npm run genres` therefore count a *similar* section as recalled rather than an identical one — five in six of its onset-and-interval tokens shared. Byte identity would score every variation as a failure to recall and report the axis as half as strong as it is. Two freshly written choruses do not reach the threshold, which is what the `through` column demonstrates.
- **The intro never states the hook.** Stating the chorus melody in the intro is idiomatic in both genres, but intros are four bars against a chorus's eight, so the length-matched recall rule excludes them.
- **Nothing recalls across kinds.** A bridge cannot quote the chorus.
