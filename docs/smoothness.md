# Smoothness — preventing what sounds wrong

`src/generate/constraints.ts`

Writing rules for what *should* happen only gets you so far; a lot of what makes generated melody sound wrong is a short list of specific, nameable faults. Fifteen of them are encoded as rules, and a **strictness level** decides how hard each is policed.

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

Measured over the same 40 seeds regenerated at each level (`npm run strictness`), violations per 1000 melody notes:

```
                                 free     light  standard    strict  polished
augmented-second                  2.3        ·!        ·!        ·!        ·!
tritone-leap                      7.2      0.3!      0.3!      0.3!      0.4!
seventh-leap                      4.1      0.3!      0.2!      0.4!      0.1!
unresolved-leading-tone          21.4      19.5     15.4~      2.3!      4.5!
unresolved-seventh               53.1      51.7     42.8~      1.1!      6.3!
unprepared-dissonance            55.7      53.9     45.6~      1.1!      0.8!
flat-nine                         2.9       3.0        ·!        ·!        ·!
semitone-clash                   98.8      98.0     118.8      9.6!      6.0!
parallel-perfects                12.7      13.6      11.9      11.0~      0.9!
non-chord-tone-on-beat          161.5     161.6     213.0     168.3     12.4!
ALL RULES                       463.7     444.9     493.3     221.6      44.6

stepwise motion %                56.5      57.0      65.3      51.4      35.5
chord tone on beat %             79.5      79.5      73.0      78.7      98.4
```

`!` = forbidden at that level, `~` = penalised, blank = rule inactive.

**Read the inactive rows carefully.** `semitone-clash` and `non-chord-tone-on-beat` *rise* at `standard` — but neither rule is active there. The cause is that `standard` pushes stepwise motion from 56% to 65%, and stepwise motion means passing tones, which are non-chord tones by definition. That is a melodic improvement showing up as a worse number on a rule nobody asked to enforce yet.

**The cost is real.** At `polished`, stepwise motion falls to 35% and chord tones on beats hit 98% — the melody becomes an arpeggio that cannot offend anyone. `standard` is the default because it measurably improves singability; `strict` is the right choice if the radio is background music under dialogue and must never draw attention.


## Genre defaults

| Genre | Default | Why |
|---|---|---|
| Iskelmä | `standard` | Measurably improves singability, which the genre lives on. |
| Jazz | `light` | The rules exist to stop a line wandering; jazz wanders on purpose. |
| Jazz / bebop | `free` (style override) | Chromatic approach notes and unprepared dissonances are the content of a bebop line, not defects in it. |

A style may override its genre's default via `Style.strictness`, and an explicit `--strictness` beats both.
