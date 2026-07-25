# Music generator

A rule-based generator for **instrumental Finnish iskelmä and jazz**, written for radio-style background music. It writes complete arrangements — form, harmony, melody, bass, comping, drums — and renders them to **MIDI** for offline rendering, and to **Strudel** code for auditioning in a browser.

```bash
npm install
npm run dev                                    # audition page at localhost:5178
npm run gen -- -n 12 --genre jazz --mood smoky --out ./out
npm run gen -- -n 12 --genre iskelma --mood kaihoisa --strictness strict
npm run gen -- -n 12 --genre iskelma --hook earworm
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

Plus two level settings, both 0–4 and deliberately independent of each other:

- **smoothness** — how hard known voice-leading faults are policed. Genres share the rule table but not the thresholds — jazz disables the ones it does not hold — and the rules are instrument-aware, so a trombone is not asked to leap like a vibraphone. See [docs/smoothness.md](docs/smoothness.md).
- **hook** — how much the song repeats itself. At the top the chorus is a fixed tune that returns each time, phrases run on one rhythm, and the vocabulary narrows; at the bottom every section is new material. Solos are never recalled at any level, which is what keeps it from ruining jazz. See [docs/hook.md](docs/hook.md).

Smoothness asks whether a note is *wrong*; hook asks whether it is *familiar*. Both corners are useful: high hook with low smoothness is raw and catchy, and high hook with high smoothness is bland on purpose.

Pin a seed and both settings become A/B controls rather than rerolls — the form, key, tempo, instruments and drums hold still while only the tune moves.

## Vocals

`--vocals` adds a **wordless sung line** doubling the melody — no lyrics, no language, no localisation. The melody is folded by whole octaves into the voice's range and each note is sung on a vowel chosen from the pitch, the note length and the genre. Held notes and high notes open toward `a`; short ones close toward `u` and `i`.

How often the vowel changes is most of the difference between the two genres. Iskelmä holds one across roughly five notes — legato, one line per breath. Jazz changes on every note, which is scat.

```bash
npm run gen -- --genre jazz --seed 42 --vocals
```

Vocals draw from their own RNG stream, so **a seed produces the identical instrumental arrangement either way** — the flag is an A/B on the voice, not a reroll. The audition page has a checkbox for it, and the layer toggles let you solo the voice against the instrument it doubles.

**Singing is articulated tone, not sustained tone.** That is the whole trick, and everything else here is detail. A melody note is not one sound — it is one *or more* syllables, spaced on the beat grid, each short enough to leave a gap before the next. A four-beat held note becomes four syllables in iskelmä and eight in jazz. The gap is the mouth closing, and without it the ear hears an instrument. It is also why Undertale and Animal Crossing work: the voice reads as a voice because it is *chopped*, not because the timbre is convincing.

**Each syllable gets a consonant**, chosen by manner rather than by letter — stop, fricative, nasal, liquid, or none. A manner is synthesisable where a letter is not: a stop is a 20 ms noise click and then the vowel arrives in 3 ms, a nasal has no burst at all and the voice leans in over 70. Two numbers per syllable — how fast the vowel comes in, and what noise precedes it — are enough to turn "duu duu duu" into something closer to `le-she-ne-lo-to-no-fo-ny-dy-my-re-de-me`. Nobody will mistake it for language, and it should not try to be.

The rest is a small formant synth: a sawtooth for the glottal source, an unfiltered **body** band carrying the harmonic series, a **resonant lowpass at F1** for chest, and **bandpasses at F2 and F3** for the vowel. Vibrato is nearly off. MIDI ships the same line as GM 52/53 (choir aahs / voice oohs) — static next to the preview, but recognisably a voice.

Five things went wrong on the way here, all of which produce a voice you cannot hear or cannot believe:

- **Strudel's `.vowel()` is unusable on pitched material.** It assigns each formant's *bandwidth in Hz* straight into the filter's Q — but Q is a ratio, not a width, so an 80 Hz bandwidth at 660 Hz becomes a slit about 8 Hz wide. On the sustained noisy source its documentation demonstrates it on, that survives. On a pitched one it does not: whether a note sounds depends on whether one of its harmonics lands inside the slit. Across eight adjacent notes the output swung **27 dB**. Passing the proper Q (centre ÷ bandwidth) brings that to **9 dB**.
- **Formants cannot be the whole signal.** Three parallel bandpasses keep three slices of the spectrum and discard the rest, so the result is thin and far too quiet — no makeup gain restores spectrum that is gone. A vocal tract is *resonant*: peaks on a full spectrum, troughs attenuated but present. Hence the resonant lowpass at F1 rather than a fourth bandpass.
- **A choir patch cannot be made to sing.** Swapping the source to a sampled `gm_voice_oohs` fixed the level and sounded like a voice, but GM choir patches are *pads* — sustained, ensemble-detuned, built to sit behind an arrangement. With vibrato on top it was a wobbling ghost. The fix was not a better sample; it was syllables.
- **Loudness is spectral, not RMS.** The clearest lesson here. A voice can measure *the same RMS as the melody* and be inaudible next to it: measured at one point, the vocal had **0.1% of its energy above 1.5 kHz against the melody's 17%**, because every formant of a dark vowel sits below 1.5 kHz and hearing is most sensitive well above it. Turning the gain up does nothing — it makes a dark sound louder and still buried. What fixed it was spectrum: a full-spectrum body band, a wider F3 acting as a singer's formant, consonant bursts at 3–6 kHz, and dropping F1 *below* unity because a resonant lowpass passes everything under it and drowns the rest. If the voice ever sounds quiet again, look at `FORMANT_GAINS` and `burstGain` before touching `gain`.
- **The renderer's sixteenth grid can quantise the gap away.** A 0.38-beat syllable at 0.5-beat spacing rounds to a full eighth note and the silence disappears, leaving a line that is re-articulated on paper and seamless to the ear. `blipBeats` is chosen per genre to survive the grid. The MIDI render keeps exact durations and does not have this problem.

## Documentation

- [docs/iskelma.md](docs/iskelma.md) — the iskelmä ruleset: dances, harmony, form, eras, moods
- [docs/jazz.md](docs/jazz.md) — the jazz ruleset: styles, chord-scale mapping, walking bass, quartal voicings
- [docs/smoothness.md](docs/smoothness.md) — the constraint system and what each level costs
- [docs/hook.md](docs/hook.md) — the repetition system: section recall, rhythm lock, vocabulary
- [docs/rules.md](docs/rules.md) — every rule and its thresholds (generated from the code)
- [docs/architecture.md](docs/architecture.md) — layout, adding a genre, producing audio

## Verifying

```bash
npm run verify      # typecheck + genre checks + notation validity + musical audit
npm run genres      # asserts what defines each genre
npm run strictness  # rule violations and musical cost at each smoothness level
npm run hook        # how much the music repeats itself at each hook level
npm run moods       # what each mood does to key, tempo and style choice
npm run rules       # regenerate docs/rules.md from the rule table
```

`npm run genres` is the one worth knowing about. It asserts the things a refactor could silently break: that every style generates in both modes, that the blues is twelve bars, that swing swings and bossa does not, that the walking bass actually walks, that jazz melody takes dorian over a minor seventh while iskelmä takes harmonic minor over a dominant, that a chorus comes back as hook rises while a solo never does, and that changing hook leaves the form, key, tempo, instruments and drums untouched.

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
- **The voice sings the melody's notes, not a singer's.** It gets one vowel per note and no consonants, so it reads as a vocal *timbre* rather than as phrasing — no syllable structure, no melisma, no breath. Adding those is what would make it sound sung rather than merely voiced.
- **A jazz melody is not always singable.** The line is written for an instrument, and a violin part can span two octaves where a voice has an octave and a half. Octave-folding places the line as well as it can and the median song strays outside the comfortable range on ~1% of its notes, but the worst seeds reach several semitones over on a fifth of them. Iskelmä barely shows the problem (0.5% of notes, never more than a tone over) because its melodies are already written to be sung.
