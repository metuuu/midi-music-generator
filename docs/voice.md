# The voice lab

*Reference, and the most current page in this directory after [engine-gaps.md](engine-gaps.md) — last updated 2026-08-07, against work that landed the same week. Describes the lab and the vocal machinery as they are. Trustworthy.*

`npm run dev` → [localhost:5173/voice](http://localhost:5173/voice)

A bench for the vocal work. Type text, hear it sung or spoken, and see exactly
why it sounds the way it does. The lab has its own Web Audio synth and its own
palettes, and the song now uses both: the vocal layer has left the Strudel
pattern entirely and is sung by the lab's own synth. So this file describes one
voice in two places rather than two voices — see [the song sings
words](#the-song-sings-words-now) and [the bridge](#and-the-singer-is-the-labs-voice).

Three questions it exists to answer, none of which can be settled by reading a
table:

- **Does a word sound like itself?** Every word's syllables are a pure function
  of the word. Type it, see what it maps to, click it to hear it alone.
- **Do the vowels separate?** The vowel-space chart plots what the line actually
  used and measures how far it travels between syllables. A line that reads as
  "duu du du duu" is one whose points sit on top of each other.
- **Where is the line between talking and singing?** Two selects and about
  twenty sliders, all live.

## Four things that are independent, and are kept that way

| | Question | File |
|---|---|---|
| **Signature** | Who is singing | [`src/style/voices.ts`](../src/style/voices.ts) |
| **Delivery** | How they are performing | [`src/style/delivery.ts`](../src/style/delivery.ts) |
| **Phonetics** | What a word sounds like | [`src/generate/phonetics.ts`](../src/generate/phonetics.ts) |
| **Layout** | Where the syllables land in time | [`src/generate/utterance.ts`](../src/generate/utterance.ts) |

Seven signatures times seven deliveries is forty-nine voices to audition rather
than forty-nine tables to maintain, which is the entire reason for the split.

## Signature: one number does most of it

A vocal tract is a tube, and a shorter tube resonates higher. Male ≈ 17.5 cm,
female ≈ 14.5, child ≈ 12 — so every formant in the vowel table scales by that
ratio and nothing else has to change. `formantScale` is that ratio: 1.0 is the
table as written (an adult male tract), 1.17 is female, 0.90 is a low male.

This is worth being precise about, because the naive alternative — transpose the
pitch, leave the formants — is what a sampler does when you play it an octave up,
and it is why that sounds like a chipmunk rather than like a woman. **Pitch and
tract length are independent**, and the ear knows it: a bass singing high still
sounds like a bass. Keeping them separate is the single thing that makes the
signatures read as different people rather than as one synthesiser at different
speeds.

The rest is voice *quality*, which does not follow from length: `rolloff` (how
steeply the glottal source falls — pressed and bright against soft and dark),
`breath`, and `ring` (the singer's formant, the 2.8 kHz peak that lets an
unamplified voice carry over an orchestra).

## Delivery: what actually separates talking from singing

Not pitch. A monotone chant is unmistakably singing and an excited question
rises a fifth. Three fields carry nearly all of it:

- **`legato`** — *where the silence goes*. Speech has no silence between the
  syllables of a word; the mouth moves through them continuously and the
  consonants do the dividing. This is the field that fixes the blipped sound: put
  a gap between every syllable and the ear hears each one as its own word.
- **`melisma`** — whether a syllable may outlast its note. One vowel gliding
  across three pitches is the most purely musical thing a voice does, and no
  instrument doubling the same line can imitate it.
- **`flatten`** — how much of the written tune survives. At 0 the voice sings the
  notes; at 1 it ignores them and recites on its own centre with a speech
  intonation contour on top. Everything between is Sprechgesang.

Presets: `sung`, `ballad`, `syllabic`, `talk-sing`, `spoken`, `chant`, `whisper`.
**`syllabic` is the current song-engine sound** — a gap after every syllable,
no melisma — kept as a preset specifically so it can be A/B'd against the rest.

## Phonetics: the sound of a word

The requirement: the same word always sounds the same, different words sound
clearly different, and no pronunciation dictionary, because the text will be
Finnish, or English, or an invented place name.

A hash alone gets most of the way, but throws away information sitting right
there — the word already contains vowels. So it does both:

1. **The letters choose the region.** Each vowel letter maps to a point in the
   openness/frontness plane. `u` is closed and back, `i` closed and front, `a`
   open. That fixes roughly where in the mouth the syllable happens, which is why
   "kuutamo" comes out dark and "hiljaisuus" bright.
2. **The hash chooses within it.** Which palette vowel near that point is
   actually used, and everything the letters cannot say.
3. **Separation is enforced afterwards.** A candidate too close to the previous
   syllable's vowel is heavily penalised, so a word never comes out as one vowel
   repeated — whatever the letters and the hash between them wanted.

The `spelling` slider runs from pure hash (0) to letters-dominate (1).

### Consonants

Thirteen of them, by **manner and place**: three stops (`t` `p` `k`), four
fricatives (`s` `š` `f` `h`), two nasals (`n` `m`), two liquids (`l` `r`), a
glide, and bare onset. Manner alone was four sounds, two of which had no noise
in them at all and differed only in how fast the vowel arrived — so a page of
text came out with one audible consonant on it.

Place is as synthesisable as manner. A burst has a width and a level as well as
a centre (a sibilant is loud and focused; `f` and `h` are quiet noise with no
centre), a nasal murmur has an anti-resonance whose frequency is the whole of
`m` against `n`, and every consonant has a **locus** — where the tract sits
while it is being made, which the vowel then transitions out of. That last one
does most of the work: the ear reads `b` `d` `g` apart mostly from which way the
formants move, not from the click.

Every syllable takes its consonants from its own letters now, not just the first
— `moon` hums, `tale` clicks, `ranta` rolls, and a word starting with a vowel
letter gets a bare onset, because inventing a consonant that is not there is
audible as the wrong word. A palette that has no `š` falls back to a weighted
draw rather than to silence. Three density knobs: word onset, inside a word, and
the closing consonant.

### Length

A syllable is **light or heavy**, and heavy takes two slots. Heavy means a long
vowel, a diphthong, or a syllable a consonant closes — `kuu`, `jai`, `il`. Every
one of those used to flatten to a plain short CV, so `hiljaisuus` and `ja` came
out three notes and one when they should be six and one; measured across the
sample corpus, sung length now tracks letter count at r = 0.95.

The second slot is a tie, so the vowel is *held* rather than restruck — the same
mechanism melisma uses, which is what a long vowel is. Whether the closing
consonant actually sounds is a separate roll (`codaDensity`), so turning codas
down gives a floating held vowel rather than a shorter word.

### Reading the vowel-space chart

Distance in the openness/frontness plane is very nearly a measure of how
different two vowels *sound*. The chart plots the palette, sizes each dot by how
often the line used it, and draws the path the line walked. Below it:

- **under 0.30** — too close. This is the "duu du du" failure, whatever the
  palette nominally contains.
- **0.30–0.55** — gentle, floaty.
- **0.55–0.85** — clearly articulated.
- **above 0.85** — wide, almost declamatory.

An unlit dot is a vowel the palette allows and the text never reaches.

### Homophones

Two different words sometimes land on the same syllables, and the reading panel
outlines them in blue when they do. This is the price of the constraints rather
than a fault in them: a two-syllable word has a bounded number of possible
sounds, so a page of text collides occasionally exactly as the birthday problem
says it must — and real languages are full of homophones for the same reason.

Far rarer than it was, because widening the consonant table and giving syllables
a length and a coda multiplied the space a word can land in. It is surfaced
rather than fixed because the remedy is a decision — widen the palette, allow
more consonants, or accept it — and because it is the one failure mode that
looks like the mapping is broken when it is working correctly.

## The synth

[`src/web/voice-synth.ts`](../src/web/voice-synth.ts) — plain Web Audio, MIT, no
Strudel and no samples. It is the reference implementation of what
`VoiceSettings` and the formant tables have always only *described*.

It exists because the Strudel path cannot do the two things the lab is for.
Strudel schedules one independent sampler voice per note, so there is no way to
hold a vowel across a pitch change or to run two syllables together with no
silence and no re-attack. Here **one oscillator and one filter chain serve the
whole utterance** — legato, melisma and coarticulation are relationships
*between* neighbouring syllables, and only a voice that persists across them can
express them.

### A vowel is not where the spectrum peaks. It is where it falls.

That is the whole of the tract model, and getting it wrong produces one very
specific failure — vowels that read as an EQ wobble in the treble rather than as
a mouth changing shape. Two versions had it:

- **Parallel bandpasses** keep three slices of the spectrum and throw the rest
  away. Thin, quiet, and no makeup gain restores what is gone — hence the
  unfiltered "body" channel that had to be mixed underneath to make it sound
  like anything, which then had to be kept tiny because it is identical for
  every vowel and drowns the differences out.
- **Cascaded peaking filters** fix the thinness — they multiply the whole
  spectrum — but they can only ever *add* narrow bumps to a flat response.
  Measured: the entire tract response for /a/ spanned **3.8 dB**, and above
  1 kHz /a/ and /i/ differed by under **4 dB**. Since the source rolls off
  steeply, the only place those bumps were audible at all was up where the
  source was weak.

What a tube actually does is **resonate and then roll off**. Above each
resonance the response falls at 12 dB/octave until the next one lifts it, so a
real /i/ has a canyon roughly 30 dB deep between 300 Hz and 2 kHz — and that
canyon is most of what makes it /i/. No arrangement of boosts can dig one.

So the tract is what a tract is: an **all-pole cascade** — five resonant lowpass
biquads in series, one per formant, each unity below its resonance, peaked at
it, falling above it. Relative formant loudness is then not something to dial
in; it falls out of the frequencies and bandwidths, which is the point of
Klatt's cascade model and why it sounds like a person rather than a filter bank.

Two consequences worth knowing about:

- **The source had to change with it.** An all-pole tract must be driven by the
  glottal flow *derivative* including lip radiation: flow falls at
  -12 dB/octave, its derivative and the radiation are +6 each, so the excitation
  is about **-6 dB/octave — a sawtooth**. This is why every classic formant
  synthesiser drives its resonators with a sawtooth and nobody explains why. The
  previous -12 was glottal flow with the radiation term missing, which
  double-counted the darkness and pushed every audible difference into the
  treble. `rolloff` is that exponent; 1.0 is neutral.
- **Web Audio's lowpass `Q` is in decibels**, unlike its bandpass `Q`. Measured:
  `Q = 18` gives exactly 18 dB of peak gain. Passing a linear ratio gives a
  filter about eight times too sharp.

Two corrections sit on top of the five poles, both fitted rather than tasted:

- **Higher-pole correction** — a +10 dB shelf above 900 Hz standing in for the
  resonances above the five modelled. Without it F2 measures 4–8 dB weaker than
  published vowel spectra across the whole palette; with it every vowel's F2
  lands within 3 dB of reference. F2 is where vowel identity lives.
- **Per-vowel level** — a cascade passes /i/ about 10 dB under /a/, which is
  roughly twice what a real speaker produces, because a real speaker
  compensates. Equalising the *power* brings the RMS spread across all fifteen
  vowels from 10.2 dB to **3.3 dB**. It deliberately equalises power and not
  loudness: /i/ still sounding softer at the same RMS is a real cue, not an
  error.

Measured, cardinal vowels at E3:

| | peaking cascade | all-pole cascade |
|---|---|---|
| tract response span, /a/ | 3.8 dB | 80 dB |
| \|/a/ − /i/\| at 700 Hz | 9 dB | 37.8 dB |
| spectral distance between vowels | 4.0–8.3 dB | 10.9–18.3 dB |
| /a/–/i/ difference at 600–1500 Hz | under 4 dB | **27.5 dB** |
| /a/–/i/ difference at 1500–5000 Hz | all of it | 12.0 dB |

The last two rows are the point. The vowel now changes the **body** of the
sound rather than wobbling its treble.

### Why it does not sound like a robot

The robot is an **absence, not a presence** — there is no resonance to filter
out. What is missing is the variation no larynx can avoid and no oscillator
produces. Real vocal folds are two lumps of wet tissue being blown apart several
hundred times a second, and they never do it twice the same way:

| | reference | measured here |
|---|---|---|
| jitter (period variation) | 0.2–1.0% | **0.33%** |
| shimmer (amplitude variation) | 2–5% | **3.6%** |

Both come from band-limited noise rather than from an LFO, which matters: a slow
sine is a *periodic* wobble, so it swaps one machine for a slower one and the ear
finds the period. Two independent noise sources, so pitch and level do not wander
in lockstep — a voice that goes sharp exactly as it gets louder is a tremolo, not
a person. The vibrato itself wanders in rate and depth for the same reason.

The normalisation is the part worth knowing about. White noise lowpassed at 24 Hz
keeps 24 Hz of a 22 kHz band, so its RMS collapses to about a fortieth of the
source's, and a depth passed in raw arrives ~50× too small. The first version of
this produced **0.3 cents** of pitch deviation where it intended five — which is
to say it produced none. Measured `rms ≈ 0.74·√(cutoff/nyquist)`, flat to within
3% from 1 to 40 Hz, so dividing by it makes the depth mean what it says.

One thing genuinely *is* a filter fix: **anti-resonances**. A cascade of
resonators is all-pole and has only peaks, but a real tract has zeros — side
branches trap energy and cancel it. The piriform sinuses put a permanent notch
around 4–5 kHz in every vowel a human makes, and its absence is much of what
"plasticky" means. There is a second, far more audible one: during /m/ or /n/ the
mouth is a closed side branch off the nasal tract, and the band it cancels near
1 kHz *is* the sound of nasality. Moving the formants alone (which is what this
did before) produces a muffled vowel rather than a consonant, because the
defining feature of the murmur is the hole in it.

Also here and not in the Strudel path:

- **Anticipatory coarticulation** — the formants start moving *before* the
  syllable does, because the mouth does. Most of why connected speech sounds
  connected rather than concatenated.
- **Consonants as places the tract passes through** rather than as events. Every
  one with a place gets a locus the tract visits before the vowel: a nasal is a
  murmur (F1 ≈ 260) plus an anti-resonance at 850 Hz for `m` or 1700 for `n`;
  `l` is a low F2 with F3 held high and `r` is the same with F3 dropped to 1600;
  a stop is a real closure — 28 ms of silence — then a release, transitioning up
  out of 800 Hz for `p`, down out of 1800 for `t`, out of a pinched F2/F3 for
  `k`. A coda does the same thing at the end of the syllable, which is why a
  closed syllable reads as longer rather than merely busier.
- **The articulation dip.** A syllable inside a word does not begin from silence.
  The level drops a few dB as the tract constricts and comes back as it opens,
  and that dip *is* the perceptual event.

## The song sings words now

`generateVocalTrack` in [`src/generate/vocals.ts`](../src/generate/vocals.ts)
still doubles the melody, but the vowels and consonants no longer come from a
weighted draw per syllable. They come from **invented words that nobody ever
sees**. (Who sings them changed too, and afterwards — see [the
bridge](#and-the-singer-is-the-labs-voice) below.)

The distinction is not cosmetic. A weighted draw produces a sequence with no
memory — every syllable as likely as every other, so no figure ever comes back
and the line is heard as texture. No choice of weights fixes that, because the
problem is the independence rather than the distribution. Language is not
distributed that way: it is a small vocabulary, reused, and the reuse is what a
listener hears first.

So each song gets a lexicon of **20 invented words** and a line per section.
Every chorus is handed the same line, so the refrain comes back on the same
handful of words — verbatim where two choruses got the same number of syllables
out of the tune, on the same vocabulary at a different offset where they did
not. Choruses draw shorter lines than verses, because a hook has to come round
inside its own section to be recognised.

`WordStyle` in [`src/style/vocals.ts`](../src/style/vocals.ts) says how a word is
spelled, one per genre: `finnish`, `scat`, `airy`, `machine`, `sargam`. Two rules
do most of the work. **Vowel harmony** — Finnish never mixes `a o u` with `ä ö y`
inside a word, `e` and `i` go with either — is most of what separates a word that
sounds Finnish from a word that sounds like nothing; measured over 500 invented
words, zero mix the two sets. And **geminates fall out for free**: a closed
syllable followed by an onset writes two consonants in a row, and `kk tt ll nn`
are what Finnish is made of. Nothing had to be added for either.

The words are spelled as *letters* and handed back through `pronounceWord`
rather than built as syllables directly. That is what makes the same invented
word identical in every chorus without anything arranging for it — one set of
rules instead of two, and a word stable under its own hash like any other.

Nothing is displayed, serialised, or put on the `Song`: the track carries
syllables, exactly as it did. Sample output, iskelmä — `upuurus` `mäshör`
`hurarrase` `piilhömön` `raheerhir`; scat — `waa` `daan` `bup` `šaam` `nooti`.

### One of them is not invented

`sargam` is what the Indian repertoire sings on, and it marks the edge of the
wordless proposition rather than crossing it. A swara name is not a word — *sa re
ga ma pa dha ni* have no referent outside the scale, they are the same seven
syllables for every singer and every listener, and there is nothing in them to
localise. They are the one case in this project where the syllables genuinely are
fixed and finite.

What changes with it is which end of the pipe picks the syllable. **`sargam`
is bound to the pitch**: `WordStyle.degrees` names the swara of each semitone
above Sa, and `generate/vocals.ts` — the only place holding a note and a tonic at
once — reads the name off the note. Twelve entries and no scale, because komal
and shuddha re are both *re*: the name belongs to the degree, so the map is total
and the rāga never has to be consulted, and a chromatic passing note has a name
too. The invented words are not discarded; they keep the half of the job they
were always better at, which is how many names run together on one breath and
which of them are held. Measured over three songs, 276 of 276 named syllables
land on the swara their note asks for.

The pronunciation of the seven does not go through the hash, and that is the one
concession the fixed set needs: the ordinary path would land *sa* on /so/ about
once in nine, and a wrong name is heard immediately by anyone who knows the
syllabary. It is the same rule at its limit rather than a second rule — as
`spelling` sharpens, the weighted draw converges on the vowel nearest the point
the letters claim, and `pronounceDegrees` goes straight there.

**A `tarana` entry stood beside it and does not now**, and the reason is worth
keeping here because it is a limit of the engine rather than a tidy-up. A tarānā
is sung on the tabla's own bols — a rhythm played on a voice, where a bol says
which stroke and not which note — so the table was consonant-heavy where sargam
is vowel-led. Nothing ever pointed at it: a tarānā is a `Style` of the indian
genre and `Genre.vocals` is one profile per genre, so it was addressed to a
selector that does not exist. It was deleted rather than wired, on the musical
half of the argument: the consonant inventory has neither aspiration nor
retroflexion and puts `d` and `t` both on `stop`, which are precisely the three
distinctions a tabla's vocabulary is built on. Measured over the same 142,535
sung syllables, its nine written bols came out as **five** distinct sounded
onsets where vowel-led `sargam` came out as **seven** — less differentiated than
the entry it was written to contrast with. The argument in full, with what would
have to change to reverse it, is in
[`src/genre/indian/vocals.ts`](../src/genre/indian/vocals.ts).

Sample vocabulary, sargam — `nidaapaapi` `saamasaa` `radani` `dasa` `para`. And a
bound line, sung in C, with the held second slots in brackets — `pa (a) sa (a) pa
(a) ta (a) ma pa pa ta sa re pa`. The seven names land on seven distinct places
of articulation and the voice sounds all seven, which is four consonants more
than `airy` — nasals and liquids only — could reach at all. What is lost is
aspiration: *dha* is a breathy voiced stop and arrives as a plain one, so it is
*da* rather than *dhā*. Nothing collides because of it, since no other swara
opens on a dental stop, and that is the whole of the damage — much smaller than
the same gap was for the bols, which is why one of these two survived and the
other did not.

## And the singer is the lab's voice

The vocal layer no longer plays through Strudel at all. It is lifted out of the
pattern and sung by [`src/web/voice-synth.ts`](../src/web/voice-synth.ts), with
[`src/web/sung-voice.ts`](../src/web/sung-voice.ts) as the bridge.

Three things move the moment it does, and all three were impossible before:

- **Legato.** Strudel schedules one independent event per note, each with its own
  envelope, so two syllables of one word could not be run together. Inside a word
  a mouth does not stop — the level dips as the tract constricts and comes back —
  and replacing that dip with a gap is what makes a line read as a row of
  one-syllable words.
- **Ties.** A long vowel is now genuinely held across the pitch change instead of
  restruck.
- **Codas.** `NoteEvent.coda` had been written since the words landed and nothing
  had ever sounded one. Now `hil` closes on its `l`.

`NoteEvent` gains `coda`, `tie` and `legatoToNext`, all optional and one-sided
like `hand` and `doubling` — the ordinary case does not declare itself.
`duration` keeps its old meaning, the *written* length with the gap a
re-attacking renderer needs; `legatoToNext` says that gap is an artefact of the
renderer rather than a fact about the line. `VoiceSettings` gains a `signature`
and a `delivery` id so the `Song` stays self-describing: a renderer is handed a
song and nothing else, and a voice it would have to look up by genre is a voice
it cannot reconstruct. Iskelmä sings `low-male`/`ballad`, jazz `male`/`sung`,
ambient `high-female`/`chant`, synth `androgynous`/`syllabic`.

### The clock

Strudel schedules a hap at cycle `c` for audio time `t(c) = (c − C0)/cps + T0 +
latency`. [`concert/transport.ts`](../src/web/concert/transport.ts) inverts that
to answer "what beat is it"; the bridge runs it *forwards* to answer "when does
this beat happen" — the same equation, so exact by construction rather than
approximate. `speak()` lays out a whole utterance in one go, which is what makes
legato possible and what stops it being a per-event callback, so the line is cut
into phrases at the breaths and a pump hands each one over about 0.8 s early.

Measured live against a playing band: twelve phrases, each recovered beat
matching its written phrase start to **0.0000 beats**.

### One thing this fixed on the way

The voice was singing the melody track's *left hand*. Where the lead is a
two-handed player the track carries their accompaniment too, and every stacked
onset became its own syllable — three at beat 0, three more at beat 2, eating the
vocabulary three times faster than the tune moved. `melodicLine` strips the
marked left hand and the vocal generator keeps only the top note of whatever
remains, because that is how many notes a person can sing at once.

### Still open

The two voices are mixed by constants rather than by measurement — the Strudel
path scaled the voice as five stacked patterns and none of that arithmetic
applies to one signal through one cascade. And a coda does not yet close the
mouth on the 3D singer: visemes read the onset only, so a closed syllable looks
open.
