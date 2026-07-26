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
| 1 | `loose` | sections of a kind share their harmony; motifs recur within a phrase |
| 2 | `standard` | the chorus is a fixed tune that returns each time |
| 3 | `catchy` | one rhythm per phrase, tighter vocabulary, every section recalled |
| 4 | `earworm` | maximum repetition — simple on purpose, and hard to shake |

## The five mechanisms

Ordered by how much each one is worth.

**1. Section recall.** A section replays the melody of the first section of its kind, transposed if the key has moved since. This is most of the effect: it is what gives a song a chorus rather than three unrelated tunes. Recall is keyed by section *kind and length*, so a twelve-bar blues chorus never inherits an eight-bar one.

**2. Harmony recall.** A section reuses an earlier section's chords without its tune. Cheaper and subtler — the ear notices that the chorus always turns the same corner even when the melody is new. Melody recall implies it: a tune replayed over different chords is not a recollection, it is a mistake.

**3. Rhythm lock.** One rhythm cell drives every non-cadential bar of a phrase, and only the pitches move. Rhythmic identity is what survives being hummed badly by someone who cannot hold a pitch, which is most people.

**4. Motif restatement.** Scales the style's existing `melody.sequence` probability, and re-weights *how* the motif returns. By default an unchanged repeat is the least likely outcome, which is right for art music and wrong for a hook — so hook is what buys verbatim restatement its weight. At level 2 and above a phrase may also restate at bar 2 rather than waiting for bar 3; answering immediately reads as a refrain, waiting reads as development.

**5. Vocabulary narrowing.** Pulls the line back toward pitch classes the phrase has already sounded, and relaxes the generator's standing distaste for repeating a note. Six notes heard four times each are more memorable than twenty-four heard once.

Mechanism 5 pushes directly against a term in the smoothness system, which suppresses note repetition harder as strictness rises. The two are arguing about different things and both are right: strictness treats a stalled line as a *symptom* of its own filtering, while a hook repeats a note because repeating it is the idea.

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
                              through   loose  standard  catchy  earworm

Repetition
  choruses recalled %             0.0     0.0     81.1    100.0    100.0
  bars restating an earlier bar  20.0    20.0     51.3     61.5     63.9
  repeated notes %                5.3     6.4      9.4     12.3     15.4

Cost — variety given up
  pitch classes / 4-bar phrase   6.16    5.96     5.78     5.51     5.33
  distinct bar shapes / song     40.0    40.0     24.4     19.3     18.0
  notes / song                    192     190      193      192      193
```

The trade is real and worth stating plainly. By `earworm` a song is built from less than half as many distinct bar shapes as at `through`. That is the point, and it is also the cost.

`notes / song` holding flat is deliberate: it guards the cheap way to score well on every other row. A line that repeats because it has stopped playing is not a hook, it is a rest.

## Known limitations

- **Recall is verbatim.** A real arrangement varies its final chorus — an extra ornament, a higher last note. Here it is the same tune, transposed. The variation-on-recall case is not modelled.
- **The intro never states the hook.** Stating the chorus melody in the intro is idiomatic in both genres, but intros are four bars against a chorus's eight, so the length-matched recall rule excludes them.
- **Nothing recalls across kinds.** A bridge cannot quote the chorus.
