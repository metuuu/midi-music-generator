# Music generator

A rule-based generator for **instrumental iskelmä, jazz, ambient and vintage synth**, written for radio-style and game background music. It writes complete arrangements — form, harmony, melody, bass, comping, drums — and renders them to **MIDI** for offline rendering, and to **Strudel** code for auditioning in a browser.

```bash
npm install
npm run dev                                    # audition page at localhost:5178
                                               # voice lab at  localhost:5178/voice.html
npm run gen -- -n 12 --genre jazz --mood smoky --out ./out
npm run gen -- -n 12 --genre iskelma --mood kaihoisa --strictness strict
npm run gen -- -n 12 --genre ambient --style wasteland --out ./out
npm run gen -- -n 12 --genre ambient --style choral --vocals
npm run gen -- -n 12 --genre synth --style berlin --mood motorway
```

Everything is deterministic: **a seed reproduces a song exactly**, so a whole station can be stored as a list of seeds rather than as audio.

## Genres

| Genre | Styles |
|---|---|
| **Iskelmä** | tango · humppa · valssi · jenkka · foksi · beguine · 1980s iskelmäpop |
| **Jazz** | medium swing · bebop · ballad · bossa nova · blues · modal · gypsy jazz · piano trio · odd metre · fusion |
| **Ambient** | hauntology · wasteland · drone · kosmische · choral · aquatic |
| **Synth** | berlin · cinematic · machine · cosmic · stalker |

Each genre owns its own styles, production eras, moods, song titles, song forms, preferred keys — and its own rule for how melody relates to harmony. There are three genuinely different answers to that last one:

- **iskelmä** melody follows the **key** — one scale for the whole song, harmonic minor at cadences;
- **jazz** melody follows the **chord** — every chord quality implies its own scale and the line re-orients bar by bar;
- **ambient** melody follows the **drone** — one scale rooted on the tonic for the whole piece, bent to absorb whatever chord passes underneath, so the tonal centre never moves at all.

**Synth** follows the key as iskelmä does, minus the harmonic minor — where another idiom writes `V` it writes `bVII`, and the seventh stays natural. It is the one genre here that is not a new answer to the question, and it earns its place elsewhere: it is the only one whose *filter* moves, and a sixteen-bar filter opening is the arrangement rather than a mix setting. See [docs/synth.md](docs/synth.md).

That difference is what keeps them from sounding like the same engine in different hats.

Four axes control the output, and all four are optional:

- **genre** — `iskelma`, `jazz`, `ambient` or `synth`
- **style** — the dance or feel
- **era** — the production: which drum machine, which instruments
- **mood** — biases style, key, tempo and density without dictating notes

Plus two level settings, both 0–4 and deliberately independent of each other:

- **smoothness** — how hard known voice-leading faults are policed. Genres share the rule table but not the thresholds — jazz disables the ones it does not hold — and the rules are instrument-aware, so a trombone is not asked to leap like a vibraphone. See [docs/smoothness.md](docs/smoothness.md).
- **hook** — how much the song repeats itself. At the top the chorus is a fixed tune that returns each time, phrases run on one rhythm, and the vocabulary narrows; at the bottom every section is new material. Solos are never recalled at any level, which is what keeps it from ruining jazz. See [docs/hook.md](docs/hook.md).

Smoothness asks whether a note is *wrong*; hook asks whether it is *familiar*. Both corners are useful: high hook with low smoothness is raw and catchy, and high hook with high smoothness is bland on purpose.

Neither is confined to the tune. Smoothness also sets how far apart the layers are kept in register and how strictly the low-interval limits apply to a voicing — it could not previously touch the loudest source of sourness in the output. Hook also narrows the *harmony*, because a song everybody can sing is usually built on three chords and is singable partly for that reason.

Pin a seed and both settings become A/B controls rather than rerolls — the form, key, tempo, instruments and drums hold still while only the tune moves.

## Ambient

Layered, slow and long — three to five and a half minutes a track, harmony that moves once every four to eight bars, and drums that are frequently absent: two of the six styles exclude the kit outright and three more draw a beatless pattern a good share of the time. Two of the six are named after specific bodies of work: **hauntology** is the Boards of Canada sound (warm, tape-degraded, plagal, mode-mixture), and **wasteland** is Mark Morgan's Fallout score (a motionless low pedal, ♭II leaning on it from a semitone above, sparse metallic fragments). The rest cover pure drone, Berlin-school sequencers, sacred minimalism in 3/4, and deep ambient techno.

Three things make it a different genre rather than everything else played slowly:

- **No dominant.** `V` is absent from every table and where a chord on the fifth appears it is minor. A leading tone promises resolution; the idiom is defined by not resolving. `npm run genres` asserts that not one chord in the genre has dominant function.
- **Sustain is the instrument.** Bass and comp patterns can declare `sustain`, which merges same-pitch notes that meet end to end — a drone bass holds for sixteen bars instead of re-striking every four seconds. The pad already worked this way; `requireLayers: ['pad']` is what guarantees it is there at all, because the default arrangement rules treat a pad as decoration and here it is the piece.
- **The mix is inverted, and the kit is barely there.** `Genre.mix` puts the pad at 0.78 and the melody at 0.55 — the reverse of the dance-band balance every other genre uses — and the drums at 0.34, less than half. `Genre.drumMix` then takes the transients down further inside the kit (hats 0.45 → 0.18) and leaves the kick nearly alone, because a kit faded uniformly becomes a disembodied tick with no body under it.
- **Effects are part of the composition.** A Boards of Canada track is a filtered, reverberant object; the dry notes underneath are not the piece. Reverb sends, delay, lowpass, highpass, resonance and pan live in the IR, defined per layer, genre-over-era. The bass stays dry everywhere (reverb on a sustained low tone is the fastest route to mud) and the kit is *filtered* rather than merely quiet — a lowpass at 1.4–2.4 kHz is what turns a drum machine into something heard through a wall.

Ambient is also the genre this project was building toward — the layer stems and the `excludeLayers`/`requireLayers` machinery are what a game needs to duck and crossfade music under speech. See [docs/ambient.md](docs/ambient.md).

## Arrangement

Three stages run before a single pitch is chosen, and they are where most of the audible quality lives.

**The layers are laid out in register first.** Every part used to take its register from its own instrument and know nothing about the others, so the comp and pad voiced themselves straight through the tune — the melody was doubled at unison by its own accompaniment on **21–34% of its notes**, and the comp's mean top note sat *above* the melody's mean bottom note. A tune doubled at unison by a sustaining chord stops being a tune. The lead's tessitura is now reserved, the accompaniment is given a ceiling under it, and a repair pass moves whatever is still colliding once the melody exists.

**An instrument carrying the tune plays where a soloist plays.** The catalogue's `centre` is a *section* register, and it was doing duty as a lead register too — thirteen entries sat at middle C, the number a catalogue gives an instrument it has no opinion about. The cost was not in the tune, which sounded fine an octave low; it was in the piano behind it. The accompaniment's ceiling lands about five semitones under the lead, a four-note voicing cannot exist below C4, and so a lead at middle C left a comper nowhere to play: a comp under a tenor sax averaged **2.74 voices against 3.73 under a clarinet**, a whole voice decided by nothing but casting. `Instrument.lead` moves the horn, the guitar and the piano up to where they actually take a head — the same argument `HandSpec.lead` had already made about two-handed keyboards — and the spread across fifteen lead instruments closed from 1.38 voices to 0.49. Unison doubling of the tune fell with it, because moving the tune up preserves the separation where raising the ceiling would have eaten it.

**Chords are voiced bottom-up against low-interval limits.** A major third is warm at C4 and mud at C2. Every voicing requires each voice to clear a minimum interval for the register it lands in, which took seconds below middle C from 10% to zero and made two voices on the identical pitch unrepresentable. The drop order also changed: the third and the seventh are the last things to go, not the first, so a `V7` no longer arrives without its leading tone.

**Rhythm is composed at phrase length, before pitch.** A rhythm cell forced to fill exactly one bar cannot express an anacrusis, a tie over the barline, or an anticipated downbeat — and the generator produced **zero** of all three across 120 songs. Phrases are now planned whole, with those gestures applied at the joins. Each style declares its own appetite for them: 0.12 for humppa, which is square on purpose, 0.65 for bossa, which anticipates almost everything.

**The lead is written for its instrument.** `agility` says how far an instrument can reach; it says nothing about what it plays. Handed identical chords, eight different leads used to produce statistically identical lines — a harp and a trombone wrote the same 68%-steps, 2%-arpeggiation part, differing only in the widest interval either would take. Every lead was a wordless singer wearing a different patch. Each instrument now declares an **idiom**: a mallet breaks chords (36% thirds, 7% arpeggiation), a flute runs up scales and stops to breathe (0.23 gaps per bar against a keyboard's 0.15), a trombone states a few notes and rests.

**The counter-melody answers the tune instead of decorating it.** It used to restart on the chord root nearest its instrument's centre in every bar and walk root–third–fifth — 53% thirds and 24% minor sixths, which is a chord being spelled out rather than a line. It now echoes the shape of the phrase it follows (inverted about half the time), carries across barlines, and never doubles the tune at the unison or octave: 58% stepwise, 0% doubling.

**The song has a dynamic shape.** Velocity used to be metric weight plus jitter, identical in every section, with the accompaniment on flat constants — a chorus arrived 2% louder than the verse before it, and the pad's velocity had a standard deviation of exactly zero. Section level now follows what kind of section it is, where it falls in the form, and how much each layer responds: a drummer plays a chorus visibly harder, a pad barely changes. Chorus 0.65, verse 0.59, bridge 0.46. Sustained parts swell across a section instead of sitting at one value.

**The drums signpost the section they are arriving at.** There was one fill — descending toms into a crash, every genre, every boundary, whatever came next — and it stuttered on the low tom after three notes. Seven shapes now, drawn from a per-genre vocabulary, and a fill's size comes from the *next* section's intensity rather than the current one, because a fill is a delivery. Jazz gets the cymbal (ride 0.73 per fill bar against iskelmä's 0.02); iskelmä gets the toms (0.96 against jazz's 0.09). `drop` — the kit stopping dead for a bar — is in the vocabulary too, because silence makes the downbeat land twice as hard.

**Brass punctuates rather than fires on a coin flip.** It played a stab on the downbeat of alternate bars: 1325 notes, every one exactly half a beat long, 72% on the downbeat, 79% landing on top of the tune. It now answers in the melody's gaps, swells underneath its held notes, and stays quiet the rest of the time — 18 note lengths instead of 1, 39% held a beat or longer, 60% off the barline, and 9% clashing instead of most of the layer.

**The bar is not always four, and the figure is not always the bar.** Every rhythm-section pattern used to be "one bar, repeated" — not as a property of the table but of the loop reading it — so a three-beat ostinato over a four-beat bar was inexpressible rather than merely absent. Patterns now carry a `cycle` in sixteenths and drift against the barline when it differs; styles carry a `groups` declaration for a bar that does not divide evenly, and the group heads become the beats everywhere it matters — where the melody phrases, where the soloist lands, where the kit accents, what the drummer counts in. Jazz's `fusion` is 7/8 grouped 2+2+3 and `odd metre` is 5/4 grouped 3+2. See [docs/jazz.md](docs/jazz.md#metre).

**A two-handed player does five things, not one.** `twoHanded` says a lead is one player using both hands, and the left one used to have a single behaviour — rootless chords in the holes the line left, which is one of the things a pianist does rather than the definition of playing two-handed. It now draws per section between answering, doubling the line in octaves, locking blocks to it, vamping an ostinato under it, and striding a bass note against the chord. That last one is the oom-pah, the boom-chuck and the accordion's stradella button rows, and it is the only mode that plays a bass line rather than voicing a chord somewhere — which made it the missing half of the two instruments most associated with it. A style may also declare two hands without naming the lead, which says the weaker and much commoner thing: whoever the palette deals, if they have two hands they use them. The soloist counts as a player here too — iskelmä hands the break to the counter instrument, and an accordion taking a chorus with one hand is half a break. Anatomy comes from the instrument rather than the style, so a vibraphone's other hand is two mallets with no bass side and an accordion's is a stradella triad with a bass row beneath it.

Plus a **motto** — one rhythm and one contour chosen per song and quoted throughout in proportion to `hook`. Repetition previously existed at exactly two scales, one bar and one whole section, with nothing between them, so a song could be locally shapely and globally arbitrary. See [docs/arrangement.md](docs/arrangement.md).

## Vocals

`--vocals` adds a **wordless sung line** doubling the melody — no lyrics, no language, no localisation. The melody is folded by whole octaves into the voice's range and each note is sung on a vowel chosen from the pitch, the note length and the genre. Held notes and high notes open toward `a`; short ones close toward `u` and `i`.

How often the vowel changes is most of the difference between the genres. Iskelmä holds one across roughly five notes — legato, one line per breath. Jazz changes on every note, which is scat. Ambient holds one across ten and re-attacks once every two beats, which at these tempos is one syllable every two seconds — slower than any language, and about the rate a choir sings a held Latin vowel. The `choral` style is the one written for it.

```bash
npm run gen -- --genre jazz --seed 42 --vocals
npm run gen -- --genre ambient --style choral --seed 42 --vocals
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

### The voice lab

Everything above describes the **wordless** line the song generator ships today. A separate bench at [localhost:5178/voice.html](http://localhost:5178/voice.html) explores what comes after it: **words**, **talk-singing**, and **voice signatures**. It does not touch the song path, so the sound that already works stays available to compare against.

```bash
npm run dev   # then open /voice.html
```

Four things it separates, and keeps separate:

- **Signature** — *who is singing*: `low-male` … `child`, seven of them. One number does most of the work — a vocal tract is a tube and a shorter tube resonates higher, so every formant scales by (reference length ÷ this tract's length): 1.17 for a female tract, 0.90 for a low male. Pitch and tract length stay independent, which is exactly what transposing a sample fails to do and why that sounds like a chipmunk instead of a woman.
- **Delivery** — *how they perform*: `sung`, `ballad`, `syllabic`, `talk-sing`, `spoken`, `chant`, `whisper`. What separates talking from singing is not pitch — a monotone chant is unmistakably singing. It is **where the silence goes** (between words, not between syllables), **whether a syllable may outlast its note** (melisma), and **how much of the written tune survives**. `syllabic` is the current song-engine sound, kept as a preset so it can be A/B'd.
- **Phonetics** — *what a word sounds like*, as a pure function of the word. The word's own vowel letters choose a region of the openness/frontness plane, a hash picks the vowel within that region, and a minimum-distance rule then guarantees neighbouring syllables never land on nearly the same mouth shape. So `kuutamo` is dark, `hiljaisuus` is bright, the same word is always identical, and no dictionary is needed for text that might be Finnish, English or invented. Consonants stay thin on purpose: word-initial usually, word-interior rarely, because vowel-to-vowel motion is what floats.
- **The synth** — an all-pole cascade formant model in plain Web Audio, MIT, no Strudel. One oscillator and one filter chain for a whole utterance rather than one per note, which is what makes legato and melisma expressible at all. **A vowel is not where the spectrum peaks, it is where it falls**: five resonant lowpasses in series, each unity below its resonance and falling at 12 dB/octave above it, so the response between two formants *descends* — a real /i/ has a canyon 30 dB deep between 300 Hz and 2 kHz, and neither parallel bandpasses nor a bank of boosts can dig one. Driven by a sawtooth, because what excites the tract is the glottal flow's derivative with lip radiation folded in (-6 dB/octave, not the -12 of the flow itself).

The page shows the syllables each word hashes to, the timeline the layout produced, and a vowel-space chart with the path the line actually walked — so "why does everything sound the same" has a number next to it rather than an opinion. See [docs/voice.md](docs/voice.md).

Measured at E3, peaking cascade → all-pole cascade: tract response span for /a/ 3.8 → 80 dB, spectral distance between cardinal vowels 4.0–8.3 → 10.9–18.3 dB, and — the one that matters — the /a/–/i/ difference in the 600–1500 Hz band, where the body of the voice is, under 4 dB → **27.5 dB**.

## Documentation

- [docs/voice.md](docs/voice.md) — the voice lab: signatures, delivery, word→syllable hashing, the formant synth
- [docs/iskelma.md](docs/iskelma.md) — the iskelmä ruleset: dances, harmony, form, eras, moods
- [docs/jazz.md](docs/jazz.md) — the jazz ruleset: styles, chord-scale mapping, walking bass, quartal voicings
- [docs/ambient.md](docs/ambient.md) — the ambient ruleset: the drone rule, sustain, arpeggios, the inverted mix, effects
- [docs/synth.md](docs/synth.md) — the synth ruleset: cycles that are not the bar, the filter as arrangement, electric instruments
- [docs/smoothness.md](docs/smoothness.md) — the constraint system and what each level costs
- [docs/hook.md](docs/hook.md) — the repetition system: section recall, rhythm lock, vocabulary
- [docs/arrangement.md](docs/arrangement.md) — the vertical, phrase rhythm, and the motto
- [docs/rules.md](docs/rules.md) — every rule and its thresholds (generated from the code)
- [docs/architecture.md](docs/architecture.md) — layout, adding a genre, producing audio

## Verifying

```bash
npm run verify      # typecheck + genre checks + notation validity + musical audit
npm run ensemble    # how the layers sound together: voicings and register separation
npm run score -- 7 iskelma tango   # read one song bar by bar, every layer
npm run genres      # asserts what defines each genre
npm run strictness  # rule violations and musical cost at each smoothness level
npm run hook        # how much the music repeats itself at each hook level
npm run moods       # what each mood does to key, tempo and style choice
npm run rules       # regenerate docs/rules.md from the rule table
```

`npm run genres` is the one worth knowing about. It asserts the things a refactor could silently break: that every style generates in both modes, that the blues is twelve bars, that swing swings and bossa does not, that the walking bass actually walks, that jazz melody takes dorian over a minor seventh while iskelmä takes harmonic minor over a dominant, that a chorus comes back as hook rises while a solo never does, and that changing hook leaves the form, key, tempo, instruments and drums untouched.

For ambient it also asserts the negative claims, which are the ones that quietly rot: that no chord in the genre has dominant function, that every chord is reachable without the drone moving off the tonic, that the drumless styles genuinely have no kit, that nothing anywhere ends a section with a crash, that the drone bass holds for at least a bar, and that the sequencer plays one note at a time.

## Strudel and licensing

**Strudel only runs in a browser.** It is a live-coding library built on Web Audio, so it cannot be the playback layer anywhere else. It is used here as a *composition and audition* tool. The shipping path is MIDI → rendered audio.

**Strudel is AGPL-3.0-or-later**, so it is quarantined. `src/web/audio.ts` is the only file that imports it — verify with `grep -rn "@strudel" src --include="*.ts" | grep import`. Everything else, including `render/strudel.ts` (which emits Strudel code as text but never imports it), is MIT and dependency-free. Delete `src/web/` and you lose the browser preview and nothing else.

### Licence

MIT, except `src/web/` which is AGPL-3.0-or-later because it links Strudel.

**The old drum machines are not complete kits.** `RolandCompurhythm78` is a 1978 preset box with six sounds and `KorgMinipops` has four, so a pattern asking either for a tom got a console error and silence. That was costing real music: every section-ending fill is written on toms and a crash, so on those banks the fills were not quiet, they were *absent*. `src/render/drum-banks.ts` holds what each bank actually contains — read from the pack, not guessed — and substitutes by role: a ride covers for a crash, the toms cover for each other and then land on the snare. 19% of drum parts were being dropped; none are now. MIDI is unaffected, since GM channel 10 has every voice by definition.

Two runtime assets the preview downloads are **not** covered by this repo: the [drum-machine samples](https://github.com/ritchse/tidal-drum-machines) publish no licence at all, and the soundfonts derive from GeneralUser GS / FluidR3. Neither ends up in MIDI output — drums map to GM channel 10 — so audio you render uses your own soundfont. Check terms before shipping either as audio.

## Known limitations

- **Two effects do not survive to MIDI.** Reverb send and pan are GM level 1 (CC91, CC10) and ship everywhere; lowpass and resonance are GM2/GS (CC74, CC71) and need a synth that honours them, such as FluidSynth. **Delay, highpass, drive, crush and phaser have no GM controller at all** and exist only in the audition render — inventing a CC for them would produce a `.mid` that plays back correctly on exactly the synth it was tested against. A native engine reads all of them from the IR. A filter *sweep* does survive, as a CC74 stream, because CC74 is defined relative to the patch's own filter and brightness only ever closes it.
- **Jazz drums in the preview are drum machines.** No acoustic kit samples are available to it. MIDI output is unaffected.
- **Soundfonts stream from a public CDN** in the browser preview. Use `setSoundfontUrl()` to self-host.
- **The voice sings the melody's notes, not a singer's.** It gets one vowel per note and no consonants, so it reads as a vocal *timbre* rather than as phrasing — no syllable structure, no melisma, no breath. Adding those is what would make it sound sung rather than merely voiced.
- **A jazz melody is not always singable.** The line is written for an instrument, and a violin part can span two octaves where a voice has an octave and a half. Octave-folding places the line as well as it can and the median song strays outside the comfortable range on ~1% of its notes, but the worst seeds reach several semitones over on a fifth of them. Iskelmä barely shows the problem (0.5% of notes, never more than a tone over) because its melodies are already written to be sung.
