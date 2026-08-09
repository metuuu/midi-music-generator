# Smoothness

*Reference, written 2026-07-25 and last revised 2026-08-09. The constraint system and the rule count are current — 20 rules, re-derived 2026-08-09, and the three genre override tables below were re-counted the same day: jazz 7, ambient 7, synth 6. **What this file does not attempt is the other fifteen.** Eighteen of nineteen genres carry a `ruleOverrides` table — iskelmä is the sole exception, being the genre the shared table was calibrated against — and three of them are documented here because each is a distinct argument rather than a catalogue. Check any other genre's against `src/genre/<id>/index.ts`, which is the source and cannot go stale.*

`src/core/rules.ts` · full rule list in [rules.md](rules.md)

Writing rules for what *should* happen only gets you so far. Much of what makes generated melody sound wrong is a short list of specific, nameable faults — an augmented second, a tritone leap, a leading tone left hanging. **20 of them are encoded as rules**, and a smoothness level decides how hard each is policed. [rules.md](rules.md) is generated from the table by `npm run rules`, so it is the count to trust.

Each rule has two thresholds: a level where it becomes a scoring **preference**, and a level where it becomes a hard **veto**. Raising smoothness turns preferences into laws.

| Level | | Adds |
|---|---|---|
| 0 | `free` | Nothing. Most character, occasional roughness. |
| 1 | `light` | The unambiguously ugly leaps — augmented second, tritone, seventh, over an octave. |
| 2 | `standard` | Dissonance handling and tendency tones. |
| 3 | `strict` | Vertical checks against the band: clashes, parallel perfects. |
| 4 | `polished` | Maximum consonance and minimum motion. Safe, smooth, tame. |

## Using it

```bash
npm run gen -- --strictness strict      # CLI
npm run strictness                      # measure violations and cost per level
```

```ts
generateSong({ strictness: 'polished' })
```

The audition page has a **Smoothness** selector; pin a seed and change it to hear the same song filtered differently.

Precedence: **explicit option → `Style.strictness` → `Genre.defaultStrictness`**. So bebop and fusion land on `free` unless you say otherwise.

## Two things that make it workable

- **Vetoes degrade gracefully.** If every reachable note is forbidden, the chooser relaxes one level at a time rather than failing. The last resort still refuses a tritone leap — it takes whichever candidate breaks the fewest level-1 rules. In practice this fires on ~2% of notes at `polished` and never exhausts.
- **A repair pass catches what generation misses.** Motif replay and cadence targets bypass the note chooser, so the finished line is swept afterwards. Repairs are improvement-only and check the join to the *next* note as well as the previous one — otherwise fixing one interval manufactures a fault on the other side.

## The tension worth knowing about

Every *vertical* rule (chord tones on beats, no clashes) pushes the melody toward chord tones — and adjacent chord tones are a **third** apart. Left alone, that makes higher levels *less* smooth, not more; an early version produced 50% stepwise motion at `polished` against 72% at `standard`. The setting called smoothness was writing arpeggios.

So the table also contains rules defending the *horizontal* dimension at the same levels (`wide-leap`, `leap-beyond-third`, `static-repetition`), and the generator's preference for stepwise motion grows with the level rather than staying fixed. `npm run genres` asserts the resulting invariant: **wide leaps must fall as the level rises.**

Current behaviour, motion wider than a third:

| | free | standard | strict | polished |
|---|---|---|---|---|
| iskelmä | 12% | 7% | 9% | **3%** |
| jazz | 12% | 5% | 7% | **2%** |

`strict` still ticks up slightly against `standard`. That is the residual cost of level 3 turning on the vertical rules, and it is small enough to leave alone — the assertion only requires that the *trend* holds. Stepwise motion follows the same shape: it peaks at `standard` (~69%) and settles near 63% at the top two levels.

Run `npm run strictness [count] [genre]` for the full per-rule breakdown. One caveat when reading it: rows for *inactive* rules can rise at a level — `semitone-clash` goes up at `standard` because that level increases stepwise motion, and passing tones sit a step from things by definition. A melodic improvement showing as a worse number on a rule nobody is enforcing yet.

## Do genres share the rules?

They share the **table**, not the **thresholds**. The rules come from classical voice-leading and general arranging practice. Most transfers — a minor ninth against a held chord tone is sour in any idiom — but some encode conventions jazz does not hold, and enforcing those produces music that is correct and wrong.

A genre declares `ruleOverrides` for what it disagrees with. Jazz overrides seven:

| Rule | Jazz | Why |
|---|---|---|
| `unresolved-leading-tone` | **off** | Bebop routinely descends from the 7th; resolution lives in the comp's guide tones. |
| `chromatic-tone` | **off** | Approach notes, enclosures and blue notes are chromatic by definition. |
| `unprepared-dissonance` | relaxed | Leaping into a non-chord tone is how a bebop line gets anywhere. |
| `flat-nine` | relaxed | ♭9 over a dominant is the sound of the minor ii–V. |
| `augmented-second` | relaxed | Still awkward, but less taboo than in a singable idiom — the altered and diminished scales contain them by construction. |
| `parallel-perfects` | never vetoed | Quartal planing and block-chord writing move in parallel on purpose. |
| `avoid-fourth` | **tightened** | The natural 11 over a maj7 is a genuine avoid note here, more than in iskelmä. |

Ambient overrides seven, and the reasoning has a single shape: each of them encodes an assumption about *function* that this music rejects.

| Rule | Ambient | Why |
|---|---|---|
| `unresolved-leading-tone` | **off** | There is no dominant in the genre at all; a leading tone promises the resolution the idiom exists not to make. |
| `parallel-perfects` | **off** | Planing a voicing, organum in fifths, a pad moving in blocks — parallel by construction. |
| `avoid-fourth` | **off** | The 11 over a major chord is the default sound here: sus2, sus4 and quartal voicings are what open harmony is made of. |
| `static-repetition` | **off** | The rule catches a melody that has run out of options. Ambient is barely moving on purpose. |
| `unresolved-seventh` | relaxed | A seventh held in a pad for eight bars is a colour, not a dissonance under pressure. |
| `repeated-note-run` | relaxed | Same pitch four times over sixteen seconds is a pulse, not a stall. |
| `flat-nine` | relaxed | A ♭II leaning on a drone from a semitone above is the wasteland sound; the ♭9 against the pedal is the point. |

Synth overrides six, and the interesting one runs the other way — five loosen a rule and the sixth switches a disabled rule **on**:

| Rule | Synth | Why |
|---|---|---|
| `parallel-perfects` | **off** | Planed synth brass is the sound. So is the fifths lead, which bakes the interval into the patch and would route around the rule anyway. |
| `avoid-fourth` | **off** | sus2 and sus4 are the harmony here rather than a suspension inside it. |
| `unresolved-seventh` | relaxed | A maj7 pad held for four bars is a colour. Softened rather than disabled: a seventh in a *moving* line still owes something. |
| `static-repetition` | relaxed | A Kraftwerk melody repeats one note more than any rule expects. |
| `repeated-note-run` | relaxed | The same, one rule over. |
| `unresolved-leading-tone` | **left on** | In major these songs cadence and a hanging leading tone is a fault exactly as it is in iskelmä. |
| `chromatic-leading-tone-in-minor` | **on**, veto at level 1 | Off by default, because most idioms here raise the seventh in minor on purpose. Synth's identity is the opposite claim: where another idiom writes `V` this writes `♭VII`, and a leading tone in a minor-key song sounds like a dance band walked in. |

**This table used to say the rule was inert in minor, and that argument was measured false.** It read: *the scale rule never produces a raised seventh for it to catch — which is a better way to be modal than switching the rule off.* The first half is true and the second does not follow. **Nothing that decorates a line asks the chord scale for permission**: a soloist with any appetite for notes outside it is offered the semitone either side of wherever it is, and one of those is the leading tone. **Seventeen songs in two hundred had one, on four of synth's five styles.**

So the rule exists, is off everywhere else, and synth turns it on — scoped to notes *outside* the prevailing scale so it can never contradict `scaleForChord`. Where a genre's own chord scale contains the leading tone, that is the genre saying it wants it, and a rule is not the place to argue.

Defaults: iskelmä `standard` (singability is what the genre lives on), jazz `light` (the rules stop a line wandering; jazz wanders on purpose), bebop and fusion `free`, synth `standard`, ambient `standard` — a note that lasts four seconds is exposed in a way a passing eighth never is, so its drone and choral styles go further to `strict`, while `wasteland` drops to `light` because the sour intervals are what it is for.

## Does it know about instruments?

Yes, in one way: **leap tolerance**. A tenth is nothing on a vibraphone and a real problem on a trombone. `Instrument.agility` (0–1) feeds two mechanisms — it sets the `unidiomatic-leap` threshold via `comfortableLeap()` (7 semitones at 0.4, 9 at 0.6, 12 at 1.0), and it scales the generator's leap appetite so a stiff instrument also *wants* to leap less rather than being vetoed after the fact.

| Agility | Instruments |
|---|---|
| 1.0 | piano, electric piano, vibraphone, glockenspiel, harp |
| 0.8–0.9 | organ, guitars, accordion, bandoneon |
| 0.6–0.7 | flute, clarinet, saxophones, violin |
| 0.4–0.5 | trumpet, trombone, brass section, string pads |

Held constant against everything else, a trombone line leaps beyond a fifth half as often as a vibraphone line and never exceeds 9 semitones where the vibraphone reaches 12.

**Not modelled:** breath phrasing for winds, per-instrument key preferences, timbral masking between layers in the same register.
