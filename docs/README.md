# Documentation

Start with the [README](../README.md) for what the project is. This directory is the detail, and it comes in three kinds.

**Every file below now opens with a one-line status header** saying when it was written, whether it describes what *is* or what was *intended*, and whether to trust it. That was added because the two-kind split below is necessary and not sufficient: a reference page can be as stale as a plan, and until each file said so the only way to find out was to read it against the source. If a header and this table disagree, the header is the more specific claim.

**What exists** — these describe the code as it is, and are checked against it.

| | |
|---|---|
| [architecture.md](architecture.md) | The layout, the Song IR, the three renderers, what the IR carries, how to add a genre, the stage, the checks, how to get audio out. **Read this first.** |
| [engine-gaps.md](engine-gaps.md) | What a genre author wanted to express and could not — and what has since been built about it. The most actively maintained file here, and the best account of *why* half the mechanisms exist. |
| [iskelma.md](iskelma.md) | The iskelmä ruleset: dances, harmony, form, eras, moods |
| [jazz.md](jazz.md) | The jazz ruleset: styles, chord-scale mapping, walking bass, metre, two hands, quartal voicings |
| [ambient.md](ambient.md) | The ambient ruleset: the drone rule, sustain, arpeggios, the inverted mix, effects |
| [synth.md](synth.md) | The synth ruleset: cycles that are not the bar, the filter as arrangement, electric instruments |
| [arrangement.md](arrangement.md) | How a song is laid out in time and in register: the form, the tempo map, the chart of who plays where, drops, seams and endings — and the vertical (voicings, dynamics, brass) |
| [rhythm.md](rhythm.md) | What the rhythm section plays, and how it stopped being one bar repeated a hundred times |
| [smoothness.md](smoothness.md) | The constraint system: what each level costs, and which rules each genre disagrees with |
| [hook.md](hook.md) | The repetition system: section recall, harmonic simplicity, and what it trades away |
| [voice.md](voice.md) | The voice: signatures, delivery, word→syllable hashing, the formant synth, the lab |
| [concert.md](concert.md) | The stage: the Performance IR, gestures, groove, visemes, lighting, the backline |
| [rules.md](rules.md) | Every rule and its thresholds. **Generated** — run `npm run rules`, do not edit |

**Four genres have a page; nineteen exist.** That is not an oversight to be fixed by writing fifteen more — the four above were written when a genre was a rare and expensive object, and they are kept because each documents a *distinct answer to the chord-scale question* rather than a catalogue. The other fifteen genres are documented by their own folders, whose per-table comments are dense and are the thing to read; `npm run gen -- --help` prints the full list of styles, eras and moods.

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
- **Prefer the mechanism to the count.** A number that says *how many things currently take a default* ages every time anybody adds anything — `architecture.md` carried "thirteen of the fourteen rooms" through two changes that made it wrong before anyone noticed. Where the list is short, name the members instead: three genres take the proscenium fallback, and that sentence only changes when one of them changes.
- **Tables of ids match the code.** Style, era and mood tables are transcriptions of `src/genre/*/`. `npm run gen -- --help` prints the authoritative list.
- **Read the code, not this directory.** Written into [engine-gaps.md](engine-gaps.md) after a wave of eight authors was dispatched from that file and three of the eight found their instructions were wrong. Five separate entries there turned out to describe code that had already changed. These files are a map; the source is the territory.
- **`rules.md` is generated.** Everything else is written by hand.
