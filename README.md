# Music generator

A rule-based generator for **instrumental Finnish iskelmä and jazz**, written for radio-style background music. It writes complete arrangements — form, harmony, melody, bass, comping, drums — and renders them to **MIDI** for offline rendering, and to **Strudel** code for auditioning in a browser.

```bash
npm install
npm run dev                                    # audition page at localhost:5178
npm run gen -- -n 12 --genre jazz --mood smoky --out ./out
npm run gen -- -n 12 --genre iskelma --mood kaihoisa --strictness strict
```

Everything is deterministic: **a seed reproduces a song exactly**, so a whole station can be stored as a list of seeds rather than as audio.

## Genres

| Genre | Styles |
|---|---|
| **Iskelmä** | tango · humppa · valssi · jenkka · foksi · beguine · 1980s iskelmäpop |
| **Jazz** | medium swing · bebop · ballad · bossa nova · blues · modal · gypsy jazz |

Each genre owns its own styles, production eras, moods, song titles, song forms, preferred keys — and its own rule for how melody relates to harmony. Iskelmä melody follows the *key*; jazz melody follows the *chord*. That difference is what keeps the two from sounding like the same engine in different hats.

Four axes control the output, and all four are optional:

- **genre** — `iskelma` or `jazz`
- **style** — the dance or feel
- **era** — the production: which drum machine, which instruments
- **mood** — biases style, key, tempo and density without dictating notes

Plus **smoothness**, which decides how hard known voice-leading faults are policed. Genres share the rule table but not the thresholds — jazz disables the ones it does not hold — and the rules are instrument-aware, so a trombone is not asked to leap like a vibraphone. See [docs/smoothness.md](docs/smoothness.md).

## Documentation

- [docs/iskelma.md](docs/iskelma.md) — the iskelmä ruleset: dances, harmony, form, eras, moods
- [docs/jazz.md](docs/jazz.md) — the jazz ruleset: styles, chord-scale mapping, walking bass, quartal voicings
- [docs/smoothness.md](docs/smoothness.md) — the constraint system and what each level costs
- [docs/rules.md](docs/rules.md) — every rule and its thresholds (generated from the code)
- [docs/architecture.md](docs/architecture.md) — layout, adding a genre, producing audio

## Verifying

```bash
npm run verify      # typecheck + genre checks + notation validity + musical audit
npm run genres      # asserts what defines each genre
npm run strictness  # rule violations and musical cost at each smoothness level
npm run moods       # what each mood does to key, tempo and style choice
npm run rules       # regenerate docs/rules.md from the rule table
```

`npm run genres` is the one worth knowing about. It asserts the things a refactor could silently break: that every style generates in both modes, that the blues is twelve bars, that swing swings and bossa does not, that the walking bass actually walks, and that jazz melody takes dorian over a minor seventh while iskelmä takes harmonic minor over a dominant.

## Strudel and licensing

**Strudel only runs in a browser.** It is a live-coding library built on Web Audio, so it cannot be the playback layer anywhere else. It is used here as a *composition and audition* tool. The shipping path is MIDI → rendered audio.

**Strudel is AGPL-3.0-or-later**, so it is quarantined. `src/web/audio.ts` is the only file that imports it — verify with `grep -rn "@strudel" src --include="*.ts" | grep import`. Everything else, including `render/strudel.ts` (which emits Strudel code as text but never imports it), is MIT and dependency-free. Delete `src/web/` and you lose the browser preview and nothing else.

### Licence

MIT, except `src/web/` which is AGPL-3.0-or-later because it links Strudel.

Two runtime assets the preview downloads are **not** covered by this repo: the [drum-machine samples](https://github.com/ritchse/tidal-drum-machines) publish no licence at all, and the soundfonts derive from GeneralUser GS / FluidR3. Neither ends up in MIDI output — drums map to GM channel 10 — so audio you render uses your own soundfont. Check terms before shipping either as audio.

## Known limitations

- **Per-note velocity is not carried into the Strudel render.** Mini-notation has no inline velocity. Dynamics survive at the layer level there, and fully in the MIDI, which is what ships.
- **Jazz drums in the preview are drum machines.** No acoustic kit samples are available to it. MIDI output is unaffected.
- **Soundfonts stream from a public CDN** in the browser preview. Use `setSoundfontUrl()` to self-host.
- The counter-melody answers in the lead's gaps rather than being independently voice-led against it.
- Instrumental only. Nothing models a vocal line beyond keeping the lead in a singable range.
