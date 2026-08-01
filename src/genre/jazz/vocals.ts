/**
 * How jazz sings.
 *
 * Scat: a new syllable on every note, and words to match. `WORD_STYLES.scat` is
 * most of the difference between this and the iskelmä profile — one-syllable
 * words with hard onsets against three-syllable words with long vowels, run
 * through the same synthesis at twice the rate.
 *
 * The vowel set is the scat alphabet — doo, dah, bah, bee, dn — and the words
 * now supply the consonants that go with it, `š` included, because
 * "shoo-bee-doo" is real vocabulary rather than an accident. `u` dominates
 * because "doo" is the default syllable of the idiom.
 */

import { WORD_STYLES, type VocalProfile } from '../../style/vocals.js';

export const VOCALS: VocalProfile = {
  name: 'voice',
  // 52 — Choir Aahs for the MIDI render. The preview uses a sawtooth for the
  // reasons given in the iskelmä profile: a choir patch is a pad, and a pad
  // cannot be scatted.
  gm: 52,
  strudel: 'square',
  // Level with the melody. A jazz singer is a member of the band, and this
  // was mixed as though they were being amplified over one.
  gain: 0.9,
  vowels: [
    ['u', 5], ['a', 4], ['o', 3], ['e', 2.5], ['uh', 2],
    ['aa', 1.5], ['i', 1],
  ],
  // Scat is consonant music: doo, bah, dat, dn, shoo. Stops carry it, and the
  // fricative weight is higher than iskelmä's because "shoo-bee-doo" is a real
  // part of the vocabulary rather than an accident.
  consonants: [
    ['stop', 6], ['stop-p', 4], ['none', 3], ['fricative-sh', 2.5], ['nasal', 2],
    ['nasal-m', 2], ['liquid', 2], ['fricative', 2], ['glide', 2],
    ['stop-k', 1.5], ['liquid-r', 1], ['fricative-f', 0.8],
  ],
  words: WORD_STYLES.scat!,
  centre: 58,
  // C3 to A4. A little higher and wider than the iskelmä voice — scat sits up
  // where the syllables cut through the rhythm section.
  range: [48, 69],
  // Looser than iskelmä: scat gets its character from variety, so the openness
  // target is a lean rather than a rule.
  spread: 0.35,
  voice: {
    bodyGain: 0.18,
    bodyLpf: 6000,
    // Louder than iskelmä. Scat *is* the consonants — "dat", "shoo", "bee" —
    // so the transient carries the line rather than decorating it.
    burstGain: 0.85,
    // Crisper than iskelmä and half the spacing: scat is consonant-driven, and
    // the silence between syllables is where the consonants would be. One
    // sixteenth sounding, one silent, on the renderer's grid.
    syllableBeats: 0.5,
    blipBeats: 0.3,
    // A scat line is articulated by the attack, so it is fast and it decays.
    attack: 0.008,
    decay: 0.06,
    sustain: 0.8,
    release: 0.04,
    noise: 0.04,
    // Effectively off. A scat syllable is over before a vibrato could start.
    vibRate: 5.8,
    vibDepth: 0.05,
    // Present but restrained — jazz phrasing bends into notes rather than
    // sliding up to them from a tone below.
    scoop: 0.7,
    scoopTime: 0.045,
  },
};
