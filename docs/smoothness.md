# Smoothness — preventing what sounds wrong

`src/generate/constraints.ts`

Writing rules for what *should* happen only gets you so far; a lot of what makes generated melody sound wrong is a short list of specific, nameable faults. Nineteen of them are encoded as rules, and a **strictness level** decides how hard each is policed.

Each rule has two thresholds: a level at which it starts applying as a scoring **penalty**, and a level at which it becomes a hard **veto**. Raising strictness turns preferences into laws.

| Level | Id | What it adds |
|---|---|---|
| 0 | `free` | Nothing. Most character, occasional roughness. |
| 1 | `light` | Blocks the unambiguously ugly leaps: augmented second, tritone, seventh, over an octave. |
| 2 | `standard` *(default)* | Adds dissonance handling and tendency tones — unprepared dissonance, unresolved leading tone and chord seventh, ♭9 clashes, repeated-note runs. |
| 3 | `strict` | Adds vertical checks against the band: semitone clashes with held notes, parallel fifths and octaves with the bass, avoid-note fourths. |
| 4 | `polished` | Maximum consonance — chord tones on beats, no chromatics. Safe, smooth, noticeably tamer. |

The **augmented second** is the one worth calling out. In harmonic minor, ♭6 to ♮7 is a single scale step but three semitones. It sounds distinctly Middle Eastern and completely wrong for iskelmä — and because the generator switches to harmonic minor over every dominant chord, it happens constantly if nothing stops it.

Two design details make this workable rather than a straitjacket:

- **Vetoes degrade gracefully.** If every reachable note is forbidden, the chooser relaxes one level at a time rather than failing. The last resort still refuses to emit a tritone leap — it picks whichever candidate breaks the fewest level-1 rules.
- **A repair pass catches what generation misses.** Motif replay and cadence targets bypass the note chooser entirely, so the finished line is swept afterwards. Repairs are strictly improvement-only and check the join to the *next* note as well as the previous one — otherwise fixing one interval quietly manufactures a tritone on the other side.

## What it costs, measured

The rules pull in two directions, and that turned out to matter more than expected. Every *vertical* rule — chord tones on beats, no clashes with the band — pushes the melody toward chord tones, and adjacent chord tones are a **third** apart. Left unchecked, raising strictness therefore made the line *less* smooth, not more: an early version measured 50% stepwise motion at `polished` against 72% at `standard`, with wide leaps doubling. The setting called "smoothness" was producing arpeggios.

The fix was to add rules that defend the *horizontal* dimension at the same levels — `wide-leap`, `leap-beyond-third`, `static-repetition` — and to make the generator's preference for stepwise motion grow with strictness rather than stay fixed. Two rules were also relaxed: `semitone-clash` and `flat-nine` now only fire on notes that are both on a beat **and** sustained, because a passing note that brushes a semitone is ordinary voice leading, and forbidding it deleted the neighbour tones that connect a line.

Measured over the same 30 seeds regenerated at each level (`npm run strictness`), violations per 1000 melody notes:

```
                                 free     light  standard    strict  polished
augmented-second                  2.6        ·!        ·!      0.1!        ·!
tritone-leap                      9.2      0.6!      0.6!      0.6!      0.4!
seventh-leap                      4.5        ·!      0.1!      0.1!      0.1!
unresolved-leading-tone          21.6      17.9     13.1~      3.8!      7.8!
unresolved-seventh               53.1      53.9     45.3~      3.6!      8.5!
unprepared-dissonance            50.3      44.9     34.4~      3.0!      4.1!
flat-nine                         3.0       2.1        ·!        ·!        ·!
semitone-clash                   62.4      69.9      83.0      8.5!     11.2!
parallel-perfects                13.6      13.5      12.1      9.5~      1.4!
non-chord-tone-on-strong-beat    40.1      39.4      58.5     42.2~     12.4!
wide-leap                        59.3      44.8     25.7~      7.5!      8.0!
leap-beyond-third               106.9      89.1      65.8      77.3     19.2!
ALL RULES                       584.2     511.4     430.7     263.3     171.9

stepwise motion %                55.5      60.9      69.1      63.2      63.4
chord tone on beat %             79.3      78.0      72.5      77.3      80.9
```

`!` = forbidden at that level, `~` = penalised, blank = rule inactive.

**Read the inactive rows carefully.** `semitone-clash` *rises* at `standard`, but the rule is not active there. The cause is that `standard` pushes stepwise motion up, and stepwise motion means passing tones — which by definition sit a step from something. A melodic improvement showing up as a worse number on a rule nobody asked to enforce yet.

**The cost is still real**, just no longer perverse. Stepwise motion peaks at `standard` (69%) and settles around 63% at the top two levels, where the vertical constraints legitimately cost something. What `polished` now buys is the near-elimination of wide leaps — measured across both genres, motion beyond a third falls from 12% at `free` to 2–3%. It is smooth and it is tame, which is what it says on the tin.

## Do genres share the rules?

They share the **table** but not the **thresholds**. The rules were written from classical voice-leading and general arranging practice; most of that transfers — a minor ninth against a held chord tone is sour in any idiom — but several rules encode conventions jazz does not hold, and enforcing them produces music that is correct and wrong.

Rather than fork the table, a genre declares `ruleOverrides` that nudge the thresholds it disagrees with. Jazz overrides six:

| Rule | Jazz treatment | Why |
|---|---|---|
| `unresolved-leading-tone` | **disabled** | A jazz line is under no obligation to resolve upward; bebop routinely descends from the 7th, and the resolution is carried by the comp's guide tones. |
| `chromatic-tone` | **disabled** | Approach notes, enclosures and blue notes are chromatic by definition. It is the vocabulary, not a defect. |
| `unprepared-dissonance` | relaxed to levels 3–4 | Leaping into a non-chord tone is how a bebop line gets anywhere. |
| `flat-nine` | relaxed to level 4 | A ♭9 over a dominant is a colour jazz reaches for — it is the sound of the minor ii–V. |
| `parallel-perfects` | never vetoed | Quartal planing and block-chord writing move in parallel on purpose. |
| `avoid-fourth` | **tightened** | The natural 11 over a major seventh is a genuine avoid note in jazz, more so than in iskelmä. |

### Default levels

| Genre | Default | Why |
|---|---|---|
| Iskelmä | `standard` | Measurably improves singability, which the genre lives on. |
| Jazz | `light` | The rules exist to stop a line wandering; jazz wanders on purpose. |
| Jazz / bebop | `free` (style override) | Chromatic approach notes and unprepared dissonances are the content of a bebop line. |

A style may override its genre's default via `Style.strictness`, and an explicit `--strictness` beats both.

## Does it know about instruments?

Yes, in one specific way that is worth the complexity: **leap tolerance**. A tenth is nothing on a vibraphone and a real problem on a trombone, so `Instrument.agility` (0..1) feeds two mechanisms:

- `unidiomatic-leap` sets its threshold from it — `comfortableLeap()` gives 7 semitones at agility 0.4, 9 at 0.6, 12 at 1.0;
- the generator's leap appetite scales with it, so a stiff instrument also *wants* to leap less rather than merely being vetoed after the fact.

| Agility | Instruments |
|---|---|
| 1.0 | piano, electric piano, vibraphone, glockenspiel, harp, celesta |
| 0.8–0.9 | organ, guitars, accordion, bandoneon, pizzicato strings |
| 0.6–0.7 | flute, clarinet, saxophones, harmonica, violin |
| 0.4–0.5 | trumpet, trombone, brass section, bowed string pads |

Held constant against everything else, a trombone line leaps beyond a fifth half as often as a vibraphone line (0.6% vs 1.2%) and never exceeds 9 semitones where the vibraphone reaches 12. `npm run genres` asserts both.

What it does **not** model: breath phrasing for winds, idiomatic key preferences per instrument, or timbral masking between layers in the same register.
