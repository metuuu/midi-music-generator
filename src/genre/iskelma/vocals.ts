/**
 * How iskelmä sings.
 *
 * Legato and dark. The vowel is held across a whole phrase rather than
 * re-chosen every syllable, and the syllables themselves are a beat apart and
 * long — one line per breath, scooped into. The consonant still changes
 * underneath, which is what keeps a held vowel from becoming a drone. Jazz runs
 * the same machinery at twice the rate with the opposite settings, which is the
 * point of having a profile at all.
 *
 * The vowel set leans on `o`, `oe` and `aa` — ö and å. Finnish is a
 * front-rounded language and its popular singing sits in that colour; a voice
 * built only from the five cardinal vowels sounds Italian.
 */

import type { VocalProfile } from '../../style/vocals.js';

export const VOCALS: VocalProfile = {
  name: 'voice',
  // 53 — Voice Oohs, for the MIDI render, where there is nothing better.
  gm: 53,
  // A square, and the reason is headroom rather than timbre.
  //
  // Not the matching soundfont: `gm_voice_oohs` is a *pad*, a sustained "ooh"
  // with ensemble detuning baked in, built to sit behind an arrangement.
  // Re-attacking it at syllable rate fights what the sample is, and vibrato on
  // top of it produces a wobbling ghost rather than a singer.
  //
  // Not a sawtooth either, which is what this was for several rounds. A saw and
  // a square have the same spectral slope, but a saw's crest factor is far
  // higher — it spends most of its cycle away from full amplitude. Against a
  // fixed peak ceiling (and this line has to fit under 1.0 alongside drums that
  // already reach it) a square delivers about 5 dB more *average* level for the
  // same peak. Measured: swapping saw for square took the vocal from level with
  // the melody to 7 dB above it, changing nothing else.
  strudel: 'square',
  // Clearly above the melody it doubles (0.85) — a lead vocal is the loudest
  // thing in a pop mix — with enough left under 1.0 that the peaks do not clip
  // against the drums, which reach it on their own.
  // A lead vocal sits just above the tune it doubles, not above the scale.
  // This was 1.5, on a field documented as 0..1 where the loudest instrument
  // is 0.9 — the singer was mixed roughly twice as loud as the band.
  gain: 0.95,
  vowels: [
    ['o', 5], ['a', 4], ['aa', 3], ['oe', 3], ['u', 3],
    ['e', 2], ['uh', 1.5], ['y', 1.5],
  ],
  // Sung, legato, Finnish: liquids and nasals dominate — la, na, lo, mi — with
  // stops for the odd consonant that actually bites. Fricatives are rare
  // because a hiss every other syllable reads as noise rather than a singer.
  consonants: [
    ['liquid', 5], ['nasal', 4], ['none', 3], ['stop', 3], ['fricative', 1],
  ],
  // Roughly a phrase: long enough that the vowel reads as held, short enough
  // that an eight-bar line is not sung entirely on one syllable. The consonant
  // still changes every syllable underneath it.
  hold: 5,
  // A baritone. Iskelmä is a low-voiced music, and the melody instrument the
  // voice doubles is frequently an octave or more above anything singable.
  centre: 57,
  // A♯2 to G4 — a working baritone, not a soloist's advertised range.
  range: [46, 67],
  spread: 0.28,
  voice: {
    bodyGain: 0.15,
    bodyLpf: 5000,
    // Softer than jazz: a sung line leans on liquids and nasals, which have no
    // burst at all, so the ones that do fire should not dominate.
    burstGain: 0.7,
    // A syllable per beat, sounding for three sixteenths of it. Most melody
    // notes are a beat or shorter and so get one syllable each, which is what
    // singing a tune actually is; only held notes are subdivided, and those are
    // exactly the ones that used to drone.
    //
    // The 0.72 is chosen to survive the Strudel renderer's sixteenth grid: it
    // rounds to three slots sounding and leaves the fourth silent. Anything
    // between 0.76 and 1.0 would round up to a full beat and quantise the gap
    // away, which is how this sounded on the first attempt — re-attacked on
    // paper, seamless to the ear.
    syllableBeats: 1,
    blipBeats: 0.72,
    // Percussive, not pad. A sung syllable reaches full volume in about 15 ms;
    // the 60 ms this used to have was most of why it sounded like a choir
    // patch swelling rather than a person starting a word.
    attack: 0.015,
    decay: 0.09,
    sustain: 0.9,
    release: 0.06,
    // Breath. Strudel mixes this into the oscillator; a native engine should do
    // the same, since a voice with no noise in it reads as an organ.
    noise: 0.06,
    // Barely there. Wide vibrato on a syllable this short has no room to be a
    // vibrato — it just detunes the note, and across a sustained line it was
    // the thing that made the voice sound like a ghost rather than a singer.
    vibRate: 5.2,
    vibDepth: 0.12,
    // A full scoop — this idiom slides into notes hard enough that removing it
    // is audible as wrongness.
    scoop: 1.2,
    scoopTime: 0.07,
  },
};
