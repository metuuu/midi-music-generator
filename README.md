# Music generator

A rule-based generator for **nineteen genres of instrumental music**, written for radio-style and game background music. It writes complete arrangements — form, harmony, melody, bass, comping, drums — and renders them to **MIDI** for offline rendering, and to **Strudel** code for auditioning in a browser.

```bash
npm install
npm run dev                                    # audition page at localhost:5173
                                               # concert   at  localhost:5173/concert
                                               # voice lab at  localhost:5173/voice
                                               # mix lab   at  localhost:5173/mix
                                               # benches   at  /bench /looks /models
npm run gen -- -n 12 --genre jazz --mood smoky --out ./out
npm run gen -- -n 12 --genre iskelma --mood kaihoisa --strictness strict
npm run gen -- -n 12 --genre ambient --style wasteland --out ./out
npm run gen -- -n 12 --genre ambient --style choral --vocals
npm run gen -- -n 12 --genre synth --style berlin --mood motorway
npm run gen -- -n 12 --genre iskelma --chaos band,figures  # a band from nineteen genres
npm run gen -- --help                          # every genre, style, era and mood
```

Everything is deterministic: **a seed reproduces a song exactly**, so a whole station can be stored as a list of seeds rather than as audio.

## Genres

**19 genres, 389 styles, 72 production eras.** A few names each; `npm run gen -- --help` prints the authoritative list, because a table this size is a transcription and transcriptions rot.

| Genre | Styles | Eras |
|---|---|---|
| **Iskelmä** | 7 — tango · humppa · valssi · jenkka · foksi · beguine · 1980s iskelmäpop | tanssilava · eighties |
| **Jazz** | 10 — medium swing · bebop · ballad · bossa nova · blues · modal · gypsy · piano trio · odd metre · fusion | swingera · bop · modern · electric |
| **Ambient** | 6 — hauntology · wasteland · drone · kosmische · choral · aquatic | tape · sampler · hybrid |
| **Synth** | 6 — berlin · cinematic · machine · cosmic · stalker · optical | modular · polysynth · digital |
| **Reggae** | 21 — mento · ska · rocksteady · one drop · dub · sleng teng · dancehall … | ska · rocksteady · roots · digital |
| **Indian** | 28 — ālāp · dhrupad · khyāl · gat · thumrī · qawwālī · kṛti · tillānā … | hindustani · carnatic · filmi · fusion |
| **Arabic** | 21 — maqsum · baladi · saidi · sama'i thaqil · dabke · longa · taqsim … | takht · firqa · shaabi · satellite |
| **Funk** | 22 — one-chord vamp · JB shuffle · go-go · P-Funk · clavinet · boogie … | jb · pfunk · boogie · electro |
| **Classical** | 26 — minuet · sarabande · fugue · toccata · sonata-allegro · nocturne … | baroque · classical · romantic · impressionist |
| **Metal** | 24 — heavy · doom · thrash · groove · djent · death · black · post-metal … | heavy · nwobhm · thrash · extreme |
| **Rock** | 24 — beat · surf · blues rock · psychedelia · motorik · punk · shoegaze … | beat · hard · arena · alt |
| **Finnish folk** | 24 — runolaulu · itkuvirsi · polska · polkka · purpuri · rekilaulu … | runo · pelimanni · revival · contemporary |
| **Country** | 24 — old-time breakdown · bluegrass · honky-tonk · western swing · cajun … | stringband · honkytonk · nashville · outlaw |
| **Latin** | 26 — son montuno · bolero · cha-cha-chá · mambo · salsa dura · samba … | conjunto · orquesta · salsa · moderno |
| **Pop** | 24 — girl group · Brill Building · baroque pop · synthpop · dream pop … | twotrack · multitrack · gated · sidechain |
| **Hiphop** | 24 — old school · boom bap · jazz rap · G-funk · trap · drill · lo-fi … | parkjam · golden · southern · modern |
| **R&B** | 24 — Motown · doo-wop · Philly soul · quiet storm · new jack · neo-soul … | soul · philly · newjack · neo |
| **Drum and bass** | 24 — jungle · darkcore · techstep · neurofunk · liquid · halftime … | rave · dubplate · studio · design |
| **House** | 24 — Chicago · acid · deep · garage · French touch · Detroit techno … | warehouse · rave · superclub · afterhours |

Each genre owns its own styles, production eras, moods, song titles, song forms, preferred keys — and its own rule for how melody relates to harmony. That last one is not a setting: `scaleForChord` is a method every genre has to implement, all nineteen declare their own, and sixty-six styles override their genre's answer on top of that. It takes *where in the form* the chord sits as well as the chord itself, which one genre needs and eighteen ignore: a maqam's **sayr** states the mode on the refrain, leaves for a neighbour and comes back, and that journey is not recoverable from the chord alone.

Four of those answers have a page of their own, and they have one because they differ in *kind* rather than in detail:

- **iskelmä** melody follows the **key** — one scale for the whole song, harmonic minor at cadences;
- **jazz** melody follows the **chord** — every chord quality implies its own scale and the line re-orients bar by bar;
- **ambient** melody follows the **drone** — one scale rooted on the tonic for the whole piece, bent to absorb whatever chord passes underneath, so the tonal centre never moves at all.

**Synth** follows the key as iskelmä does, minus the harmonic minor — where another idiom writes `V` it writes `bVII`, and the seventh stays natural. It is the one of the four that is not a new answer to the question, and it earned its place elsewhere: it was the first genre whose *filter* moves, and a sixteen-bar filter opening is the arrangement rather than a mix setting. Six genres declare a filter profile behind it now, and funk's is a different gesture again — `Effects.filterEnv` opens on the note rather than across the section, which is a wah pedal and not a fade-in. See [docs/synth.md](docs/synth.md).

That difference is what keeps them from sounding like the same engine in different hats.

Four axes control the output, and all four are optional:

- **genre** — one of nineteen ids; `npm run gen -- --help` lists them
- **style** — the dance or feel
- **era** — the production: which drum machine, which instruments
- **mood** — biases style, key, tempo and density without dictating notes

Plus two level settings, both 0–4 and deliberately independent of each other:

- **smoothness** — how hard known voice-leading faults are policed. Twenty rules, five levels. Genres share the rule table but not the thresholds — every genre but iskelmä overrides at least one, and jazz disables outright the ones it does not hold — and the rules are instrument-aware, so a trombone is not asked to leap like a vibraphone. See [docs/smoothness.md](docs/smoothness.md).
- **hook** — how much the song repeats itself. At the top the chorus is a fixed tune that returns each time, phrases run on one rhythm, and the vocabulary narrows; at the bottom every section is new material. Solos are never recalled at any level, which is what keeps it from ruining jazz. See [docs/hook.md](docs/hook.md).

Smoothness asks whether a note is *wrong*; hook asks whether it is *familiar*. Both corners are useful: high hook with low smoothness is raw and catchy, and high hook with high smoothness is bland on purpose.

Neither is confined to the tune. Smoothness also sets how far apart the layers are kept in register and how strictly the low-interval limits apply to a voicing — it could not previously touch the loudest source of sourness in the output. Hook also narrows the *harmony*, because a song everybody can sing is usually built on three chords and is singable partly for that reason.

Pin a seed and both settings become A/B controls rather than rerolls — the form, key, tempo, instruments and drums hold still while only the tune moves.

## Ambient

Layered, slow and long — three to five and a half minutes a track, harmony that moves once every four to eight bars, and drums that are frequently absent: two of the six styles exclude the kit outright and three more draw a beatless pattern a good share of the time. Two of the six are named after specific bodies of work: **hauntology** is the Boards of Canada sound (warm, tape-degraded, plagal, mode-mixture), and **wasteland** is Mark Morgan's Fallout score (a motionless low pedal, ♭II leaning on it from a semitone above, sparse metallic fragments). The rest cover pure drone, Berlin-school sequencers, sacred minimalism in 3/4, and deep ambient techno.

Three things make it a different genre rather than everything else played slowly:

- **No dominant.** `V` is absent from every table and where a chord on the fifth appears it is minor. A leading tone promises resolution; the idiom is defined by not resolving. `npm run genres` asserts that not one chord in the genre has dominant function.
- **Sustain is the instrument.** Bass and comp patterns can declare `sustain`, which merges same-pitch notes that meet end to end — a drone bass holds for sixteen bars instead of re-striking every four seconds. The pad already worked this way; `requireLayers: ['pad']` is what guarantees it is there at all, because the default arrangement rules treat a pad as decoration and here it is the piece.
- **The mix is inverted, and the kit is barely there.** `Genre.mix` puts the pad above the melody — 0.71 against 0.54, the reverse of the dance-band balance every other genre uses — and the drums at 0.29, less than half. `Genre.drumMix` then takes the transients down further inside the kit (hats 0.45 → 0.18) and leaves the kick nearly alone, because a kit faded uniformly becomes a disembodied tick with no body under it.
- **Effects are part of the composition.** A Boards of Canada track is a filtered, reverberant object; the dry notes underneath are not the piece. Reverb sends, delay, lowpass, highpass, resonance and pan live in the IR, defined per layer, genre-over-era — and per *drum voice* where a layer is too coarse, because a kit is several instruments sharing one track and a hat and a kick do not want the same room. The bass stays dry everywhere (reverb on a sustained low tone is the fastest route to mud) and the kit is *filtered* rather than merely quiet — a lowpass at 1.4–2.4 kHz is what turns a drum machine into something heard through a wall.

Ambient is also the genre this project was building toward — the layer stems and the `excludeLayers`/`requireLayers` machinery are what a game needs to duck and crossfade music under speech. See [docs/ambient.md](docs/ambient.md).

## Arrangement

Three stages run before a single pitch is chosen, and they are where most of the audible quality lives.

**The layers are laid out in register first.** Every part used to take its register from its own instrument and know nothing about the others, so the comp and pad voiced themselves straight through the tune — the melody was doubled at unison by its own accompaniment on **21–34% of its notes**, and the comp's mean top note sat *above* the melody's mean bottom note. A tune doubled at unison by a sustaining chord stops being a tune. The lead's tessitura is now reserved, the accompaniment is given a ceiling under it, and a repair pass moves whatever is still colliding once the melody exists.

**An instrument carrying the tune plays where a soloist plays.** The catalogue's `centre` is a *section* register, and it was doing duty as a lead register too — thirteen entries sat at middle C, the number a catalogue gives an instrument it has no opinion about. The cost was not in the tune, which sounded fine an octave low; it was in the piano behind it. The accompaniment's ceiling lands about five semitones under the lead, a four-note voicing cannot exist below C4, and so a lead at middle C left a comper nowhere to play: a comp under a tenor sax averaged **2.74 voices against 3.73 under a clarinet**, a whole voice decided by nothing but casting. `Instrument.lead` moves the horn, the guitar and the piano up to where they actually take a head — the same argument `HandSpec.lead` had already made about two-handed keyboards — and the spread across fifteen lead instruments closed from 1.38 voices to 0.49. Unison doubling of the tune fell with it, because moving the tune up preserves the separation where raising the ceiling would have eaten it.

**Chords are voiced bottom-up against low-interval limits.** A major third is warm at C4 and mud at C2. Every voicing requires each voice to clear a minimum interval for the register it lands in, which took seconds below middle C from 10% to zero and made two voices on the identical pitch unrepresentable. The drop order also changed: the third and the seventh are the last things to go, not the first, so a `V7` no longer arrives without its leading tone. Not every chordal part is a stack of thirds, either — `tertian`, `guide`, `quartal`, `spread` and `power`, the last of which is a rhythm guitar's root and fifth doubled outward with no third in it at all, and is a fixed shape rather than a choice of tones.

**Rhythm is composed at phrase length, before pitch.** A rhythm cell forced to fill exactly one bar cannot express an anacrusis, a tie over the barline, or an anticipated downbeat — and the generator produced **zero** of all three across 120 songs. Phrases are now planned whole, with those gestures applied at the joins. Each style declares its own appetite for them, and across 389 styles the declaration runs from 0.04 to 0.85: 0.12 for humppa, which is square on purpose, 0.65 for bossa, which anticipates most of what it can, and the top of the range is a funk vamp.

**The lead is written for its instrument.** `agility` says how far an instrument can reach; it says nothing about what it plays. Handed identical chords, eight different leads used to produce statistically identical lines — a harp and a trombone wrote the same 68%-steps, 2%-arpeggiation part, differing only in the widest interval either would take. Every lead was a wordless singer wearing a different patch. Each instrument now declares an **idiom**: a mallet breaks chords (36% thirds, 7% arpeggiation), a flute runs up scales and stops to breathe (0.23 gaps per bar against a keyboard's 0.15), a trombone states a few notes and rests.

**The counter-melody answers the tune instead of decorating it.** It used to restart on the chord root nearest its instrument's centre in every bar and walk root–third–fifth — 53% thirds and 24% minor sixths, which is a chord being spelled out rather than a line. It now echoes the shape of the phrase it follows (inverted about half the time), quotes the section's own hook where there is one, and carries across barlines: **51% stepwise against 25% thirds**, and 72% of its figures are more than one note long.

Doubling the tune at the unison or octave is the one thing it may never do *by accident* — enforced as the line is written and again against the finished part, because a note held across a section seam happens outside the writer's view. **0 of 6384 unmarked overlapping notes.** What is allowed is the same doubling on purpose: a phrase harmonised in thirds under a chorus already heard, or two players stating the head in octaves. Those carry `doubling: 'lead'`, and checking the mark alone would be circular, so what `npm run genres` checks is the property the mark claims — that this is a phrase and not a collision. Deliberate doublings come in runs and a fault is one note wide.

Two different parts land on this layer and the checks count them apart. `counterMode: 'ostinato'` puts a running sequencer figure here instead of an answering line, and every property above inverts between them by design: 93% of ostinato notes sound *under* the tune against 52% of answers, because an answer waits for a gap and a second sequencer does not.

**The song has a dynamic shape.** Velocity used to be metric weight plus jitter, identical in every section, with the accompaniment on flat constants — a chorus arrived 2% louder than the verse before it, and the pad's velocity had a standard deviation of exactly zero. Section level now follows what kind of section it is, where it falls in the form, and how much each layer responds: a drummer plays a chorus visibly harder, a pad barely changes. The two tables are short enough to quote — chorus 1.00, verse 0.80, bridge 0.72, outro 0.56, against a layer response running from the drums' 0.85 down to the pad's 0.35. Measured across the catalogue that lands a chorus **9% above the verse before it**. Sustained parts swell across a section instead of sitting at one value.

**The drums signpost the section they are arriving at.** There was one fill — descending toms into a crash, every genre, every boundary, whatever came next — and it stuttered on the low tom after three notes. Seven shapes now, drawn from a per-genre vocabulary, and a fill's size comes from the *next* section's intensity rather than the current one, because a fill is a delivery. Jazz gets the cymbal (ride 0.67 per fill bar against iskelmä's 0.19); iskelmä gets the toms (0.94 against jazz's 0.13). `drop` — the kit stopping dead for a bar — is in the vocabulary too, because silence makes the downbeat land twice as hard, and ambient's palette is led by it. A style can also drop the *band* rather than the kit: `drops` and `dropBars` say how often and at what scale, so a form whose phrases are two bars long gets the gesture at two bars rather than at somebody else's four.

**Brass punctuates rather than fires on a coin flip.** It played a stab on the downbeat of alternate bars: 1325 notes, every one exactly half a beat long, 72% on the downbeat, 79% landing on top of the tune. It now answers in the melody's gaps, swells underneath its held notes, and stays quiet the rest of the time — **142 distinct note lengths instead of 1**, a quarter of them held a beat or longer, 90% off the barline, and 5% of stabs clashing with a moving melody instead of most of the layer.

**The bar is not always four, and the figure is not always the bar.** Every rhythm-section pattern used to be "one bar, repeated" — not as a property of the table but of the loop reading it — so a three-beat ostinato over a four-beat bar was inexpressible rather than merely absent. Patterns now carry a `cycle` in sixteenths and drift against the barline when it differs; styles carry a `groups` declaration for a bar that does not divide evenly, and the group heads become the beats everywhere it matters — where the melody phrases, where the soloist lands, where the kit accents, what the drummer counts in. Jazz's `fusion` is 7/8 grouped 2+2+3 and `odd metre` is 5/4 grouped 3+2. One kit voice may disagree with the rest of the kit about the answer, which is what a hat running in three against a four-beat bar is. See [docs/jazz.md](docs/jazz.md#metre).

And the tempo is not always one number either. `SongMeta.tempo` is a **map** rather than a `bpm`, so a style naming a `tempoRamp` gets a clock that moves under the notes instead of a metronome mark the renderers have to lie about. Exactly one style names one — dnb's `breakcore` — and that is the right adoption rate for a mechanism whose job is to stop the one style that needs it from having to fake it. Everything else arrives as a flat map of one point, which costs nothing and means no renderer has two cases to handle.

**A two-handed player does five things, not one.** `twoHanded` says a lead is one player using both hands, and the left one used to have a single behaviour — rootless chords in the holes the line left, which is one of the things a pianist does rather than the definition of playing two-handed. It now draws per section between answering, doubling the line in octaves, locking blocks to it, vamping an ostinato under it, and striding a bass note against the chord. That last one is the oom-pah, the boom-chuck and the accordion's stradella button rows, and it is the only mode that plays a bass line rather than voicing a chord somewhere — which made it the missing half of the two instruments most associated with it. A style may also declare two hands without naming the lead, which says the weaker and much commoner thing: whoever the palette deals, if they have two hands they use them. The soloist counts as a player here too — iskelmä hands the break to the counter instrument, and an accordion taking a chorus with one hand is half a break. Anatomy comes from the instrument rather than the style, so a vibraphone's other hand is two mallets with no bass side and an accordion's is a stradella triad with a bass row beneath it.

Plus a **motto** — one rhythm and one contour chosen per song and quoted throughout in proportion to `hook`. Repetition previously existed at exactly two scales, one bar and one whole section, with nothing between them, so a song could be locally shapely and globally arbitrary. See [docs/arrangement.md](docs/arrangement.md).

## Vocals

`--vocals` adds a **sung line** doubling the melody. It sings **invented words** — no real language, no lyrics, nothing to localise. The melody is folded by whole octaves into the voice's range and cut into syllables; the words those syllables come from are never displayed, never serialised and never reach the `Song`.

**A weighted draw per syllable has no memory**, which is why there are words at all. Every syllable as likely as every other means no figure ever comes back and the line is heard as texture — and no choice of weights fixes that, because the problem is the independence rather than the distribution. Language is a small vocabulary, reused, and the reuse is what a listener hears first. So each song gets a lexicon of **twenty invented words** and a line per section, and every chorus is handed the same line: the refrain comes back on the same handful of words.

How those words are spelled, and how fast they arrive, is most of the difference between the genres. `WordStyle` gives each one its own spelling. Five live in the shared table — `finnish`, `scat`, `airy`, `machine` and `sargam` — and a genre whose language is not in it carries its own beside the repertoire instead of adding a sixth row nineteen authors would have to read: arabic does exactly that, on the grounds that three of the consonants it needs are missing from the Finnish inventory and the other four entries are not languages. Vowel harmony does most of the work in the first: Finnish never mixes `a o u` with `ä ö y` inside a word, and observing that is most of what separates an invented word that sounds Finnish from one that sounds like nothing. Geminates (`kk tt ll nn`) fall out for free, because a closed syllable followed by an onset writes two consonants in a row.

The syllable rate carries the rest, and it spans a factor of eight. Iskelmä takes one a beat — legato, one line per breath. Jazz takes two, which is scat, and hiphop takes four. Ambient takes one every two beats, which at these tempos is one syllable every two seconds — slower than any language, and about the rate a choir sings a held Latin vowel. The `choral` style is the one written for it.

```bash
npm run gen -- --genre jazz --seed 42 --vocals
npm run gen -- --genre ambient --style choral --seed 42 --vocals
```

Vocals draw from their own RNG stream, so **a seed produces the identical instrumental arrangement either way** — the flag is an A/B on the voice, not a reroll. The audition page has a checkbox for it, and the layer toggles let you solo the voice against the instrument it doubles.

**Singing is articulated tone, not sustained tone.** That is the whole trick, and everything else here is detail. A melody note is not one sound — it is one *or more* syllables, spaced on the beat grid, each short enough to leave a gap before the next. A four-beat held note becomes four syllables in iskelmä and eight in jazz. The gap is the mouth closing, and without it the ear hears an instrument. It is also why Undertale and Animal Crossing work: the voice reads as a voice because it is *chopped*, not because the timbre is convincing.

**Each syllable takes its consonants from its own letters**, and they are described by **manner and place** rather than by letter — thirteen of them: three stops (`t` `p` `k`), four fricatives (`s` `š` `f` `h`), two nasals, two liquids, a glide, and a bare onset. That is what is synthesisable where a letter is not: a stop is a real closure and then a release, a nasal has no burst at all but an anti-resonance whose frequency is the whole of `m` against `n`, and every consonant with a place has a **locus** — where the tract sits while it is made, which the vowel then transitions out of. `moon` hums, `tale` clicks, `ranta` rolls. Nobody will mistake it for language, and it should not try to be.

A syllable is also **light or heavy**, and heavy takes two slots — a long vowel, a diphthong, or a syllable a consonant closes. The second slot is a tie, so the vowel is *held* rather than restruck, which is what a long vowel actually is.

**Three renderings, one line.** In the browser the voice is sung by the project's own Web Audio formant synth — `web/voice-synth.ts`, the all-pole cascade described under [the voice lab](#the-voice-lab) — with `web/sung-voice.ts` bridging it onto Strudel's clock. That is what makes legato, held vowels and closing consonants possible at all: Strudel schedules one independent event per note, so two syllables of one word could never be run together. An exported `.strudel.js` still sings through the formant bank in `render/strudel.ts`, which is the older sound and the one the lessons below were learned on. MIDI ships the same line as whichever GM patch the genre's `VocalProfile` names — choir aahs or voice oohs where the voice is an ensemble, and the solo-voice lead where the repertoire has one singer standing in front of a band, because re-attacking a detuned choir pad at syllable rate produces a wobbling ghost. Static next to either renderer, but recognisably a voice.

Five things went wrong on the way to that formant bank, all of which produce a voice you cannot hear or cannot believe:

- **Strudel's `.vowel()` is unusable on pitched material.** It assigns each formant's *bandwidth in Hz* straight into the filter's Q — but Q is a ratio, not a width, so an 80 Hz bandwidth at 660 Hz becomes a slit about 8 Hz wide. On the sustained noisy source its documentation demonstrates it on, that survives. On a pitched one it does not: whether a note sounds depends on whether one of its harmonics lands inside the slit. Across eight adjacent notes the output swung **27 dB**. Passing the proper Q (centre ÷ bandwidth) brings that to **9 dB**.
- **Formants cannot be the whole signal.** Three parallel bandpasses keep three slices of the spectrum and discard the rest, so the result is thin and far too quiet — no makeup gain restores spectrum that is gone. A vocal tract is *resonant*: peaks on a full spectrum, troughs attenuated but present. Hence the resonant lowpass at F1 rather than a fourth bandpass.
- **A choir patch cannot be made to sing.** Swapping the source to a sampled `gm_voice_oohs` fixed the level and sounded like a voice, but GM choir patches are *pads* — sustained, ensemble-detuned, built to sit behind an arrangement. With vibrato on top it was a wobbling ghost. The fix was not a better sample; it was syllables.
- **Loudness is spectral, not RMS.** The clearest lesson here. A voice can measure *the same RMS as the melody* and be inaudible next to it: measured at one point, the vocal had **0.1% of its energy above 1.5 kHz against the melody's 17%**, because every formant of a dark vowel sits below 1.5 kHz and hearing is most sensitive well above it. Turning the gain up does nothing — it makes a dark sound louder and still buried. What fixed it was spectrum: a full-spectrum body band, a wider F3 acting as a singer's formant, consonant bursts at 3–6 kHz, and dropping F1 *below* unity because a resonant lowpass passes everything under it and drowns the rest. If the voice ever sounds quiet again, look at `FORMANT_GAINS` and `burstGain` before touching `gain`.
- **A sixteenth grid can quantise the gap away.** A 0.38-beat syllable at 0.5-beat spacing rounds to a full eighth note and the silence disappears, leaving a line that is re-articulated on paper and seamless to the ear. `blipBeats` is chosen per genre to survive the grid. Only the Strudel path has this problem: MIDI keeps exact durations, and the browser voice lays out a whole utterance in seconds rather than slots. **This is about note *lengths*, and it is now the only half of the problem left.** Onsets used to round the same way and no longer do — the audition writes a `.nudge()` grid in seconds beside the notes, so where a note *starts* survives the grid exactly even though how long it lasts still does not. See §3.18a in [docs/engine-gaps.md](docs/engine-gaps.md), which is where that was found and how much of the catalogue it was quietly moving.

### The voice lab

A bench at [localhost:5173/voice](http://localhost:5173/voice) for the vocal work: type text, hear it sung or spoken, and see why it sounds the way it does. It is where **words**, **talk-singing** and **voice signatures** were built, and the song path now uses two of the three — the words above, and the lab's own synth as the singer. So it is one voice in two places rather than two voices, and every preset stays available to compare against.

```bash
npm run dev   # then open /voice
```

Four things it separates, and keeps separate:

- **Signature** — *who is singing*: `low-male` … `child`, seven of them. One number does most of the work — a vocal tract is a tube and a shorter tube resonates higher, so every formant scales by (reference length ÷ this tract's length): 1.17 for a female tract, 0.90 for a low male. Pitch and tract length stay independent, which is exactly what transposing a sample fails to do and why that sounds like a chipmunk instead of a woman.
- **Delivery** — *how they perform*: `sung`, `ballad`, `syllabic`, `talk-sing`, `spoken`, `chant`, `whisper`. What separates talking from singing is not pitch — a monotone chant is unmistakably singing. It is **where the silence goes** (between words, not between syllables), **whether a syllable may outlast its note** (melisma), and **how much of the written tune survives**. `syllabic` is the current song-engine sound, kept as a preset so it can be A/B'd.
- **Phonetics** — *what a word sounds like*, as a pure function of the word. The word's own vowel letters choose a region of the openness/frontness plane, a hash picks the vowel within that region, and a minimum-distance rule then guarantees neighbouring syllables never land on nearly the same mouth shape. So `kuutamo` is dark, `hiljaisuus` is bright, the same word is always identical, and no dictionary is needed for text that might be Finnish, English or invented. How consonantal a voice is comes from three density knobs — word onset, word interior, and the closing consonant — set per word style: `finnish` articulates nearly every syllable (0.92 / 0.8 / 0.45), `airy` stays sparse (0.7 / 0.5 / 0.2), because vowel-to-vowel motion is what floats.
- **The synth** — an all-pole cascade formant model in plain Web Audio, MIT, no Strudel. One oscillator and one filter chain for a whole utterance rather than one per note, which is what makes legato and melisma expressible at all. **A vowel is not where the spectrum peaks, it is where it falls**: five resonant lowpasses in series, each unity below its resonance and falling at 12 dB/octave above it, so the response between two formants *descends* — a real /i/ has a canyon 30 dB deep between 300 Hz and 2 kHz, and neither parallel bandpasses nor a bank of boosts can dig one. Driven by a sawtooth, because what excites the tract is the glottal flow's derivative with lip radiation folded in (-6 dB/octave, not the -12 of the flow itself).

The page shows the syllables each word hashes to, the timeline the layout produced, and a vowel-space chart with the path the line actually walked — so "why does everything sound the same" has a number next to it rather than an opinion. See [docs/voice.md](docs/voice.md).

Measured at E3, peaking cascade → all-pole cascade: tract response span for /a/ 3.8 → 80 dB, spectral distance between cardinal vowels 4.0–8.3 → 10.9–18.3 dB, and — the one that matters — the /a/–/i/ difference in the 600–1500 Hz band, where the body of the voice is, under 4 dB → **27.5 dB**.

## The concert

A band walks out on a 3D stage and plays the set — visibly. Hands hit the drums the drums are actually being hit on, the follow spot finds whoever is soloing, and the programme tells you what you are about to hear.

```bash
npm run dev        # then open /concert
npm run concert    # assert the hands, the staging and the light cues
```

**It is a third renderer of the Song IR, not a feature of the audio player.** `src/concert/` turns a `Song` into a **Performance IR** — who is on stage, what every limb does at which beat, what the lights do, what the programme says — as plain data, with no access to three.js, Strudel or the DOM. The three.js runtime under `src/web/concert/` plays that.

Three things follow, and all three are the point. The visuals **cannot cheat**: a choreographer that can only see `NoteEvent[]` has no path by which a nice-looking animation quietly changes what is heard. It **ports**, because a native engine consuming the same IR gets the staging for free — and a concert is the most demanding test there is of whether the IR carries enough to drive something that is not audio. And it is **testable without eyes**: `npm run concert` asserts that no hand teleports, that every sounding note has exactly one gesture on the audio grid, that no two players are standing in the same place, and that ambient never uses a follow spot.

The audition page's **Watch on stage** button hands the stage the song you are already listening to, rather than programming a new set.

Two benches exist for the parts of it that are too small to see from the stalls: **[/models](http://localhost:5173/models)** puts every instrument on a turntable, part by part, and **[/looks](http://localhost:5173/looks)** does the same for the wardrobe — every hair style, hat, fabric and garment the cast can be dealt. Both are the same argument as the voice lab: a thing you can only see in situ is a thing whose faults you find by accident. See [docs/concert.md](docs/concert.md).

## Chaos — a concert without borders

One band assembled out of nineteen: a humppa played by a metal drummer, a bebop head over a dub bass, a rāg whose keyboard player learned the part off a Roland.

```bash
npm run gen -- --genre iskelma --chaos band,figures
npm run gen -- --genre jazz --chaos all --chaos-spread 1
npm run gen -- --genre ambient --chaos band --chaos-donors metal,dnb,arabic
npm run chaos      # assert what a chimera refuses to mix
```

`--genre` still names the **host** — the genre the piece is filed under, whose bar it counts in, whose room it is staged in and whose clothes the band wears. Chaos says how much of everything *else* comes from somewhere else, along two knobs rather than one, because "the whole band is foreign but the music is ours" and "one thing about this piece is from elsewhere" are different requests.

`--chaos` takes any **subset** of five kinds, comma-separated, or `all`. They are independent rather than a ladder — `--chaos band,harmony` is the host's own patterns played on foreign instruments over somebody else's chord system, and `--chaos figures` alone is the host's band playing somebody else's patterns:

| kind | traits | what becomes borrowable |
| --- | --- | --- |
| `band` | 8 | who is playing — instrument palettes per layer, the drum bank, the decade of the machines |
| `performance` | 18 | how they play it — feels, fills, seams, drops, techniques, effects, the mix |
| `figures` | 11 | what they play — bass, comp and drum patterns, melodic cells, the counter-line |
| `harmony` | 3 | what it is played over — progressions, mode tables and the chord–scale rule |
| `form` | 4 | what shape it is — forms, length, ending, count-in, the title |
| `staging` | 7 | what it *looks* like — the clothes, their colours, how much a body moves, the programme copy |

`--chaos all` is the full-chaos setting — every kind at 100%, which the audition page has as a **full chaos** tickbox that simply ticks the six boxes and pushes the slider, so what it asked for stays visible and can be nudged afterwards.

`--chaos-spread` is the share of eligible properties that actually move, drawn per property: at `0.2` a piece gets two or three foreign things and stays recognisable, at `1` everything the selected kinds allow belongs to somebody else. At `0` it is the plain song, byte for byte.

**The kinds do not interfere.** Every trait spends its coin and its donor draw whether or not its kind is selected, so what `band` borrows on its own is exactly what it borrows alongside the other four, donor for donor — which is what makes ticking a box a comparison rather than a reroll. `npm run chaos` asserts it over 40 seeds.

**Three things are never mixed, at any level**, and each of them is a way of producing garbage rather than chaos. The **bar** — every pattern in the project is slot indices in sixteenths, and a sixteen-slot figure hosted in a twelve-slot bar wraps and collides with itself, so figures move only between styles that agree about the metre and share a tempo. That costs less than it sounds: 305 of the 389 styles are plain 4/4 with no grouping. The **mode's table** — roman numerals are read relative to the mode, so progressions, mode weights and the chord–scale rule travel together from one donor or not at all. And **layer requirements**, because a donor that excludes the kit unioned with one that requires a pad is a band nobody assembled.

A chimera is a *transform* rather than a twentieth genre: the generator draws a genre, era, style and mood exactly as it always has, and then rebuilds the band on a separate RNG stream. So a chaos song and a plain song from the same seed make the same decisions in the same order — with `band` alone selected the key, the tempo and the whole form come out identical, over 200 seeds in `npm run chaos`. The recipe rides on `SongMeta.chaos`, which is what keeps a song's own metadata sufficient to regenerate it.

On the audition page it is five checkboxes and a **Mixing** slider; both regenerate on the same seed rather than drawing a new song, so you can hear one piece several ways. The now-playing panel prints the whole recipe — `drums ← metal:gothic`, `harmony ← latin:columbia` — so what you are hearing is always readable.

**On stage the band follows.** The cast is derived from the tracks, so a borrowed instrument brings its archetype with it — its object, its posture, its gestures, and sometimes its headcount: borrowing ambient's pad palette puts a four-person choir where iskelmä had one violinist, and nothing had to be told. The clothes follow too, per player: **whoever lent the instrument dresses the person holding it**, read straight off the published recipe.

The `staging` kind takes the rest of the visuals. It dresses the players whose instruments were *not* borrowed, puts each colour palette on a genre of its own — a metal cut with a country jacket colour and a disco accent — and borrows how much a body moves and what the programme says about the piece. The **room** goes with it, and it is the one staging decision that cannot be per number, because a band does not move between songs: it is drawn once per evening from the concert's seed, so a jazz cellar can host an iskelmä band.

**The decade is deliberately not mixed.** It is a gate rather than a palette — `eligibleDrumSources`, `SEQUENCER_FROM` and `rigPoolFor` all refuse what the year is too early for — so randomising it would subtract options rather than add strangeness, and would read on stage as gear going missing. Every gate still applies to whatever era each song resolved to: instrument *palettes* cross freely because they were never year-gated, while machines and synth rigs stay period-correct. `npm run chaos` stages 62 synths under full chaos and asserts every one is of its own decade.

The concert takes the same options and applies them per number: one band, one room, one decade, and a different border crossing every song — `concert?chaos=band,harmony&spread=0.9`, or **Watch on stage ▸** from the radio, which carries the recipe across.

**The stage follows on its own, and then some.** A `Performer` is derived from the track it plays, so a borrowed instrument brings its archetype with it — the physical object, the station, the posture, the gestures, and sometimes the headcount: borrowing ambient's pad palette into an iskelmä number puts a four-person choir where there had been one violinist. Nothing under `src/concert/` needed telling.

The clothes are the one part that had to be wired, and they follow per player: **each performer is dressed by the genre that lent them their instrument**, read straight off `meta.chaos.borrowed`. A drummer behind a borrowed jazz kit is dressed by jazz; the person holding the sitar looks like a sitar player. The band's uniform still comes from the host — matching jackets are a fact about a band rather than a player — and how likely a guest is to put it on comes from their own genre's table. The room, the programme copy and the era stay the host's throughout: one band, one night, one building.

## Documentation

Start at [docs/README.md](docs/README.md), which indexes the lot, carries a status header per file, and says which of them describe what exists and which are the reasoning behind it. Four genres have a page and nineteen exist — the four are the ones with a distinct answer to the chord-scale question, and the other fifteen are documented by the per-table comments in their own folders, which are dense and are the thing to read.

Two are worth naming here rather than leaving to the index:

- [docs/engine-gaps.md](docs/engine-gaps.md) — what a genre author wanted to express and could not, and what has since been built about it. The most actively maintained file in the project and the best single account of *why* half these mechanisms exist.
- [docs/architecture.md](docs/architecture.md) — layout, the Song IR, the three renderers, adding a genre, producing audio. **Read this one first.**

**What exists**

- [docs/iskelma.md](docs/iskelma.md) — the iskelmä ruleset: dances, harmony, form, eras, moods
- [docs/jazz.md](docs/jazz.md) — the jazz ruleset: styles, chord-scale mapping, walking bass, metre, two hands, quartal voicings
- [docs/ambient.md](docs/ambient.md) — the ambient ruleset: the drone rule, sustain, arpeggios, the inverted mix, effects
- [docs/synth.md](docs/synth.md) — the synth ruleset: cycles that are not the bar, the filter as arrangement, electric instruments
- [docs/arrangement.md](docs/arrangement.md) — the form, the tempo map, the chart of who plays where, drops, seams and endings — and the vertical
- [docs/rhythm.md](docs/rhythm.md) — what the rhythm section plays, and how it stopped being one bar repeated
- [docs/smoothness.md](docs/smoothness.md) — the constraint system and what each level costs
- [docs/hook.md](docs/hook.md) — the repetition system: section recall, harmonic simplicity, what it costs
- [docs/voice.md](docs/voice.md) — the voice: signatures, delivery, word→syllable hashing, the formant synth
- [docs/concert.md](docs/concert.md) — the stage: the Performance IR, gestures, groove, lighting
- [docs/rules.md](docs/rules.md) — every rule and its thresholds (generated from the code)

**Why it is like that** — build plans, kept for the reasoning and annotated with what landed

- [docs/tune-plan.md](docs/tune-plan.md) · [docs/concert-plan.md](docs/concert-plan.md) · [docs/backline-plan.md](docs/backline-plan.md) · [docs/rhythm-plan.md](docs/rhythm-plan.md) · [docs/feel-plan.md](docs/feel-plan.md) · [docs/transition-plan.md](docs/transition-plan.md)

## Verifying

```bash
npm run verify      # everything below that asserts: typecheck, rules, genres,
                    # notation validity, the concert, chaos, the audit and the ensemble
npm run ensemble    # how the layers sound together: voicings and register separation
npm run score -- 7 iskelma tango   # read one song bar by bar, every layer
npm run genres      # asserts what defines each genre
npm run concert     # asserts the hands, the staging and the light cues
npm run chaos       # asserts what a chimera refuses to mix, and what it leaves alone
npm run tune        # the tune engine alone: one melody over I–vi–IV–V, no band
npm run strictness  # rule violations and musical cost at each smoothness level
npm run hook        # how much the music repeats itself at each hook level
npm run moods       # what each mood does to key, tempo and style choice
npm run rules       # regenerate docs/rules.md from the rule table
```

`npm run genres` is the one worth knowing about. It asserts the things a refactor could silently break: that every style generates in both modes, that the blues is twelve bars, that swing swings and bossa does not, that the walking bass actually walks, that jazz melody takes dorian over a minor seventh while iskelmä takes harmonic minor over a dominant, that a chorus comes back as hook rises while a solo never does, and that changing hook leaves the form, key, tempo, instruments and drums untouched.

For ambient it also asserts the negative claims, which are the ones that quietly rot: that no chord in the genre has dominant function, that every chord is reachable without the drone moving off the tonic, that the drumless styles genuinely have no kit, that nothing anywhere ends a section with a crash, that the drone bass holds for at least a bar, and that the sequencer plays one note at a time.

**A green check is not evidence that the audio is right, and this project has the receipt.** The audition rounded every onset to a sixteenth for a long time: `applySwing` writes the swung eighth at 0.665 and the grid rounded it to 0.750, so triplet swing came out as a dotted shuffle — 19% of all onsets across nineteen genres, most of them feel and microtiming rather than swing. `npm run genres` was green throughout, because it asserted `meta.swing > 0.3`, which was always true. Nothing read the output. A check that reads the input it was handed is a check on intent; the ones that earn their place parse the notes that came out.

## Strudel and licensing

**Strudel only runs in a browser.** It is a live-coding library built on Web Audio, so it cannot be the playback layer anywhere else. It is used here as a *composition and audition* tool. The shipping path is MIDI → rendered audio.

**Strudel is AGPL-3.0-or-later**, so it is quarantined inside `src/web/`. Verify with `grep -rn "@strudel" src --include="*.ts" | grep -v "^src/web/" | grep import`, which should print one line: a type-only import in `src/types/strudel.d.ts`, a declaration file with no runtime link. Three files import it: `web/audio.ts` owns the transport, `web/sung-voice.ts` borrows the audio context and the clock to sing over it, and `web/concert/transport.ts` inverts that clock to ask what beat it is. Everything else, including `render/strudel.ts` (which emits Strudel code as text but never imports it), is MIT and dependency-free. Delete `src/web/` and you lose the browser preview and nothing else.

**The old drum machines are not complete kits.** `RolandCompurhythm78` is a 1978 preset box with six sounds and `KorgMinipops` has four, so a pattern asking either for a tom got a console error and silence. That was costing real music: every section-ending fill is written on toms and a crash, so on those banks the fills were not quiet, they were *absent*. `src/render/drum-banks.ts` holds what each bank actually contains — read from the pack, not guessed — and substitutes by role: a ride covers for a crash, the toms cover for each other and then land on the snare. 19% of drum parts were being dropped; none are now. MIDI is unaffected, since GM channel 10 has every voice by definition.

Two runtime assets the preview downloads are **not** covered by this repo: the [drum-machine samples](https://github.com/ritchse/tidal-drum-machines) publish no licence at all, and the soundfonts derive from GeneralUser GS / FluidR3. Neither ends up in MIDI output — drums map to GM channel 10 — so audio you render uses your own soundfont. Check terms before shipping either as audio.

### Licence

MIT, except `src/web/` which is AGPL-3.0-or-later because it links Strudel.

## Known limitations

- **Some effects do not survive to MIDI, and every field says so on itself.** Reverb send and pan are GM level 1 (CC91, CC10) and ship everywhere; lowpass and resonance are GM2/GS (CC74, CC71) and need a synth that honours them, such as FluidSynth. Seven fields are marked **audition only** — `delay`, `highpass`, `drive`, `crush`, `phaser`, `glide` and `filterEnv` — because inventing a CC for them would produce a `.mid` that plays back correctly on exactly the synth it was tested against, and the undefined controllers are not free real estate either. The marker on the field is the thing that has to be right: a total in a header is a second copy of it that nothing updates, and the count in `Effects` said *two* for a long while after it had stopped being two. A native engine reads all of them from the IR.
- **Two contours do survive, as automation rather than as settings.** A filter *sweep* goes out as a CC74 stream, because CC74 is defined relative to the patch's own filter and brightness only ever closes it. A *sidechain* goes out as CC11 expression — also GM level 1, and defined as a percentage of channel volume, so the duck rides underneath the mix fader instead of overwriting it. Both renderers draw the same line by different mechanisms, which is the standard: between a shape both renderers play identically and a shape one of them lies about, take the first.
- **Jazz drums in the preview are drum machines.** No acoustic kit samples are available to it. MIDI output is unaffected.
- **Soundfonts stream from a public CDN** in the browser preview. Use `setSoundfontUrl()` to self-host.
- **The voice sings the melody's notes, not a singer's.** It has syllables, words, consonants and held vowels now, but the *line* is still the lead instrument's — folded into range and cut up, never written for a voice. A singer would phrase it differently, breathe elsewhere, and not attempt some of it at all.
- **The two voices are mixed by constants rather than by measurement.** The Strudel path scaled the voice as five stacked patterns, and none of that arithmetic applies to one signal through one cascade.
- **A jazz melody is not always singable.** The line is written for an instrument, and a violin part can span two octaves where a voice has an octave and a half. Octave-folding places the line as well as it can and the median song strays outside the comfortable range on ~1% of its notes, but the worst seeds reach several semitones over on a fifth of them. Iskelmä barely shows the problem (0.5% of notes, never more than a tone over) because its melodies are already written to be sung.
