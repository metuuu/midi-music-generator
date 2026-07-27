/**
 * How ambient sings.
 *
 * This profile sits at the far end of an axis the other two genres share. Jazz
 * changes syllable on every note, iskelmä holds a vowel across a phrase, and
 * ambient holds one for longer still and articulates it about as softly as the
 * machinery permits — a slow choral line, no text, arriving on the note rather
 * than being struck onto it.
 *
 * It is worth being explicit about the tension, because it is real. The whole
 * syllable mechanism exists to stop a synthesised voice becoming a pad; ambient
 * is the one genre where a pad is very nearly what you want. The resolution is
 * not to switch the mechanism off — a genuinely unarticulated voice reads as a
 * choir *patch*, which is a texture nobody believes is a person. It is to slow
 * it right down: a syllable every two beats, which at 60 BPM is one every two
 * seconds. That is slower than any language and exactly the rate at which a
 * choir sings a held Latin vowel.
 *
 * Consonants are almost entirely absent for the same reason. A stop is a click
 * of noise at 3 kHz, and a click is the single most attention-grabbing thing
 * this synthesis can produce. Nasals and liquids have no burst at all — the
 * voice simply leans in — which is why they carry nearly the whole weight here.
 */

import type { VocalProfile } from '../../style/vocals.js';

export const VOCALS: VocalProfile = {
  name: 'voice',
  // 52 — Choir Aahs. The one genre where the GM choir patch is not a
  // compromise: a sustained ensemble "aah" is a fair description of the target.
  gm: 52,
  // A sawtooth, where the other two profiles use a square.
  //
  // That choice was made on crest factor: a square delivers more average level
  // for the same peak, and a pop vocal has to fight drums that already reach
  // the ceiling. Ambient has no such fight — there are frequently no drums at
  // all, and nothing in the mix is loud. Spending the headroom on the
  // spectrally richer source is the better trade here, because the formant
  // bands have more harmonics to find and the vowel comes out clearer.
  strudel: 'sawtooth',
  // Above the melody it doubles (0.55 in this genre's mix) but nowhere near
  // the 1.5 the pop genres use. A voice in ambient is a layer of the texture,
  // not the thing the texture exists to support.
  // Under the pad, because here the voice is a texture rather than a lead.
  gain: 0.7,
  // Open and dark. You hold an /a/ or an /o/; you do not hold an /i/, and this
  // profile holds everything.
  vowels: [
    ['a', 5], ['o', 4], ['u', 3], ['aa', 3], ['oe', 2], ['e', 1.5],
  ],
  // Almost no attack of any kind. Nasals and liquids have no noise burst, and
  // a bare vowel onset has none either — between them that is 90% of the
  // weight. The occasional fricative is breath rather than a consonant.
  consonants: [
    ['nasal', 5], ['none', 5], ['liquid', 3], ['fricative', 1],
  ],
  // Twice the iskelmä hold. A whole phrase on one vowel is what choral writing
  // does with a single syllable of text.
  hold: 10,
  // Higher than the other two profiles. Choral ambient sits where a treble line
  // sits, not where a crooner does.
  centre: 62,
  // D3 to C5 — a mixed-voice ensemble rather than one singer, which is what
  // this is meant to sound like.
  range: [50, 72],
  spread: 0.3,
  voice: {
    bodyGain: 0.16,
    bodyLpf: 4200,
    // The quietest bursts in the project. A consonant that cuts through is the
    // opposite of what this line is for.
    burstGain: 0.35,
    // A syllable every two beats — at these tempos, one every two seconds.
    // Slower than speech by a wide margin and about right for a choir on a
    // held vowel.
    //
    // 1.6 leaves the gap the ear needs: on the renderer's sixteenth grid it
    // rounds to six slots sounding out of eight, so two slots of silence
    // survive quantisation. Anything above 1.85 would round up to the full two
    // beats and close the gap, which is how a sung line turns back into a pad.
    syllableBeats: 2,
    blipBeats: 1.6,
    // A choir swells into a note. This is six times the iskelmä attack and it
    // is the single most genre-defining number in the profile.
    attack: 0.09,
    decay: 0.2,
    sustain: 0.95,
    release: 0.35,
    noise: 0.05,
    // Slow and shallow — an ensemble's vibrato averages out across singers, so
    // a choir wobbles far less than any one member of it.
    vibRate: 4.4,
    vibDepth: 0.08,
    // Barely a scoop. A trained choral voice arrives on the pitch; the slide
    // that makes iskelmä sound sung would make this sound like a synthesiser
    // portamento.
    scoop: 0.35,
    scoopTime: 0.12,
  },
};
