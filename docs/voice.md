# The voice lab

`npm run dev` → [localhost:5178/voice.html](http://localhost:5178/voice.html)

A bench for the vocal work. Type text, hear it sung or spoken, and see exactly
why it sounds the way it does. Nothing here touches the song generator — the
Strudel-based vocal layer on the Radio page is unchanged, so the sound that
already works stays available to compare against.

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

The `spelling` slider runs from pure hash (0) to letters-dominate (1). Syllable
count comes from the word's own vowel-letter runs, so longer words get more
syllables. Word-initial consonants come from the word's actual first letter
(`moon` hums, `tale` clicks) — and a word starting with a vowel letter gets a
bare onset, because inventing a consonant that is not there is audible as the
wrong word.

Consonants are deliberately thin: they are synthesised as *manner* rather than as
phonemes, so one on every syllable reads as clatter, and vowel-to-vowel motion is
what makes a line float. Two density knobs — high at word onsets, low inside.

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
than a fault in them: with four consonant manners and a nine-vowel palette a
two-syllable word has a few hundred possible sounds, so a page of text collides
occasionally exactly as the birthday problem says it must — and real languages
are full of homophones for the same reason.

Measured over 46 words: `bright` and `wide` collide once, `finnish` twice,
`open` and `dark` three times, `nasal` five. It is surfaced rather than fixed
because the remedy is a decision — widen the palette, allow more consonants, or
accept it — and because it is the one failure mode that looks like the mapping
is broken when it is working correctly.

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

The other difference is the filter topology, and it is the bigger win:

> A vocal tract is a **cascade**, not a parallel bank. Each resonance multiplies
> the whole spectrum, so the harmonics between formants are attenuated but
> present. Three parallel bandpasses instead keep three slices and discard the
> rest — which is why that version needed an unfiltered "body" channel mixed
> underneath to sound like anything, and why the body then had to be kept tiny,
> because it is identical for every vowel and drowns the differences the formants
> exist to create. Chained peaking filters have no such tension.

Measured on the cardinal vowels at E3, RMS spectral distance: /a/–/u/ 8.0 dB,
/u/–/o/ 8.3 dB, /a/–/i/ 7.2 dB, /e/–/o/ 4.0 dB (the closest pair — nearly
identical F1). The parallel-bandpass renderer measured 3.5 dB before tuning and
6.4 dB after, *with* the body-gain compromise.

Also here and not in the Strudel path:

- **Anticipatory coarticulation** — the formants start moving *before* the
  syllable does, because the mouth does. Most of why connected speech sounds
  connected rather than concatenated.
- **Consonants as places the tract passes through** rather than as events. A
  nasal is a murmur (F1 ≈ 260, little above it) that glides into the vowel; a
  liquid is a lowered F3; a stop is a real closure — 28 ms of silence — and then
  a release.
- **The articulation dip.** A syllable inside a word does not begin from silence.
  The level drops a few dB as the tract constricts and comes back as it opens,
  and that dip *is* the perceptual event.

## What this does not do yet

The song generator still uses the old path: `generateVocalTrack` in
[`src/generate/vocals.ts`](../src/generate/vocals.ts) doubles the melody with
wordless syllables, holds one vowel across a phrase, and renders through Strudel
with a gap after every syllable. Porting the lab's findings across means giving
`VocalProfile` a signature, a delivery and a word source, and teaching the
Strudel renderer to approximate ties — which it can only approximate, since it
has no portamento.
