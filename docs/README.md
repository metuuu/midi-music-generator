# Documentation

Start with the [README](../README.md) for what the project is. This directory is the detail, and it comes in two kinds.

**What exists** — these describe the code as it is, and are checked against it.

| | |
|---|---|
| [architecture.md](architecture.md) | The layout, the Song IR, the three renderers, how to add a genre, how to get audio out. **Read this first.** |
| [iskelma.md](iskelma.md) | The iskelmä ruleset: dances, harmony, form, eras, moods |
| [jazz.md](jazz.md) | The jazz ruleset: styles, chord-scale mapping, walking bass, metre, two hands, quartal voicings |
| [ambient.md](ambient.md) | The ambient ruleset: the drone rule, sustain, arpeggios, the inverted mix, effects |
| [synth.md](synth.md) | The synth ruleset: cycles that are not the bar, the filter as arrangement, electric instruments |
| [arrangement.md](arrangement.md) | The vertical (register, voicings), phrase rhythm, the motto, dynamics, fills, brass |
| [rhythm.md](rhythm.md) | What the rhythm section plays, and how it stopped being one bar repeated a hundred times |
| [smoothness.md](smoothness.md) | The constraint system: what each level costs, and which rules each genre disagrees with |
| [hook.md](hook.md) | The repetition system: section recall, harmonic simplicity, and what it trades away |
| [voice.md](voice.md) | The voice: signatures, delivery, word→syllable hashing, the formant synth, the lab |
| [concert.md](concert.md) | The stage: the Performance IR, gestures, groove, visemes, lighting, the backline |
| [rules.md](rules.md) | Every rule and its thresholds. **Generated** — run `npm run rules`, do not edit |

**Why it is like that** — build plans, written before the work and kept afterwards for the reasoning: the alternatives that were rejected, the measurements that motivated the change, and (in most of them) a closing section on what the plan got wrong.

| | Describes | Built |
|---|---|---|
| [tune-plan.md](tune-plan.md) | the melody engine in `src/tune/` | phases 0–8; phase 9 still open |
| [concert-plan.md](concert-plan.md) | the concert → [concert.md](concert.md) | yes |
| [backline-plan.md](backline-plan.md) | what is on the stage and who is behind it | yes, waves annotated |
| [rhythm-plan.md](rhythm-plan.md) | the rhythm section → [rhythm.md](rhythm.md) | yes, §13 records the differences |
| [feel-plan.md](feel-plan.md) | `style/feel.ts` — how a passage is *felt* | yes |
| [transition-plan.md](transition-plan.md) | `generate/transition.ts` — what the band does at a seam | yes |

A plan and its "what exists" page can disagree, because a plan is a record of intent and is not rewritten when the code moves. Where they do, the page in the first table is the one to trust.

## Conventions

- **Claims carry numbers.** Nearly every assertion in these files was measured, and the command that measures it is usually named next to it. If a number here disagrees with what the tool prints today, the tool is right and the file is stale.
- **Tables of ids match the code.** Style, era and mood tables are transcriptions of `src/genre/*/`. `npm run gen -- --help` prints the authoritative list.
- **`rules.md` is generated.** Everything else is written by hand.
