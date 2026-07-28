/**
 * How vintage electronic music sings: it does not. It is vocoded.
 *
 * The other three profiles in this project are attempts at a person. This one
 * is an attempt at a *circuit*, and almost every number below is the opposite
 * of the corresponding number in `iskelma/vocals.ts` for that reason. A vocoder
 * is a bank of bandpass filters with an envelope follower on each: a voice goes
 * into the analysis side, a synthesiser waveform goes into the carrier side,
 * and what comes out is the carrier wearing the voice's spectrum. Nobody sings
 * it. Someone speaks into it while somebody else plays a chord, and the chord
 * is what you hear.
 *
 * It belongs to the `machine` style, which is the only one in the genre with a
 * `vocal` layer worth having.
 *
 * **`formantTrack: 0` is the whole file.** The field's own docstring in
 * `core/types.ts` makes the general argument — a human tract cannot hold a
 * formant below the note being sung, so the renderer lifts F1 to meet the
 * fundamental on high notes, exactly as a singer's jaw opens whether they mean
 * it to or not. Set to 0, that compensation is switched off. What that means
 * *here* is the thing this profile exists for: the filter bank is bolted to
 * fixed frequencies and has no idea what note the carrier is playing, so as the
 * line climbs it walks out from under its own resonances and thins into a buzz.
 * Every other profile would call that a defect and correct it. This one is the
 * defect, kept on purpose, because the hollowing-out at the top of the range is
 * the single most recognisable thing about the sound and there is no other way
 * to get it. One number, and it is the difference between a singer and a
 * machine that has been handed a sentence.
 */

import type { VocalProfile } from '../../style/vocals.js';

export const VOCALS: VocalProfile = {
  name: 'vocoder',
  // 85 — Lead 6 (voice). The choir patches the other genres fall back on are
  // exactly wrong here: 52 and 53 are ensembles of people, and the one thing a
  // vocoder is definitively not is people. GM 85 is a synth lead with a vocal
  // colour on it, which is a fair one-line description of the real thing.
  gm: 85,
  // A sawtooth — and for once this is not a compromise but the actual signal
  // path. `style/vocals.ts` records that a bare saw through three parallel
  // bandpasses comes out thin, buzzy and short of body, because the filters
  // keep three slices and discard the rest of the spectrum; it concludes that
  // this reads as a filter sweep rather than as a person, and switches to a
  // sampled voice.
  //
  // Every word of that is true and every word of it is a description of a
  // vocoder. A carrier oscillator pushed through a fixed filter bank *is* three
  // slices of a sawtooth and nothing in between. The failure mode the other
  // profiles had to engineer around is this profile's target, so the source
  // that was wrong everywhere else is right here without further argument.
  strudel: 'sawtooth',
  // Level with the loudest thing in the arrangement rather than above it. The
  // vocoder in this repertoire is a hook, not a lead — it states a line and
  // stops, and the sequence carries on underneath either way.
  gain: 0.85,
  // Front vowels at full weight, which no other profile here allows.
  //
  // Ambient and iskelmä both lean on open back vowels because a human cannot
  // sustain /i/ comfortably and will not try. A filter bank has no larynx and
  // no comfort: it holds /i/ for a whole bar at any pitch, at no cost. And /i/
  // and /e/ put their second formant up at 1.8–2.3 kHz, which is where a
  // vocoder's characteristic buzz lives — so the vowels a singer avoids are the
  // ones this thing is most itself on.
  vowels: [
    ['a', 4], ['e', 4], ['i', 3], ['o', 3], ['ae', 2], ['u', 2],
  ],
  // Stops and fricatives, where every other profile in the project prefers
  // nasals and liquids.
  //
  // This is a fact about the circuit rather than a stylistic preference. An
  // unvoiced consonant has no pitch for the carrier to take, so real vocoders
  // route sibilance around the bank entirely and mix the raw noise back in.
  // That path is why a vocoded /s/ is startlingly crisp against a body that is
  // otherwise pure synthesiser, and it is most of what makes vocoded speech
  // intelligible at all.
  consonants: [
    ['stop', 5], ['fricative', 4], ['none', 3], ['nasal', 1], ['liquid', 1],
  ],
  // 1 — a fresh vowel on every note, the shortest hold in the project and the
  // same value jazz uses for scat. A held vowel is a breath being spent; a
  // vocoder is tracking a talker, and a talker changes vowel constantly.
  hold: 1,
  // Middle C, and the field means less here than anywhere else. `centre` is
  // documented as the pitch the voice is *not* straining at, which presumes a
  // voice that can strain. With `formantTrack` at 0 nothing is measured from
  // this at all — it is set to the middle of the range so that the vowel
  // machinery has no direction to push in.
  centre: 60,
  // E2 to C6 — three and a half octaves, far wider than any of the singers in
  // this project and wider than any singer. `range` exists to fold a melody
  // into what a voice can physically produce, and a vocoder's limit is the
  // keyboard rather than a throat. Set this wide, the fold almost never fires
  // and the vocoded line doubles the lead at the octave the lead was written
  // in, which is what the records do.
  range: [40, 84],
  // Loose to the point of ignoring the heuristic. A small `spread` makes the
  // vowel choice track pitch and note length, modelling a singer picking
  // something they can actually hold. There is no such constraint to model, so
  // the raw weights above should win, and this is how the table says so.
  spread: 0.9,
  voice: {
    // Three times the body of any sung profile, and the reason is that the
    // body band is the one part of the signal that is identical for every
    // vowel — which is to say it is the carrier, leaking through unshaped.
    // Everywhere else that leak is the enemy: `VoiceSettings.bodyGain`
    // documents 0.15 as the value that lifted the measured distance between
    // /a/, /u/ and /i/ from 3.5 dB to 6.4 dB. Here the leak is the instrument.
    // A vocoder is audibly a synthesiser first and a vowel second, and buying
    // that at the price of some vowel contrast is the correct trade in this
    // one profile.
    bodyGain: 0.45,
    // And the fizz stays. A sung profile rolls the raw saw off at 4–5 kHz to
    // stop it sounding like an oscillator; sounding like an oscillator is the
    // point of this one, so the lowpass sits above the top analysis band and
    // takes nothing the ear was listening for.
    bodyLpf: 8000,
    // Full level, where ambient uses 0.35 and iskelmä 0.7. Not an exaggeration
    // for effect — it follows from the unvoiced path described above. The
    // consonant genuinely does bypass the voiced chain in the hardware and
    // arrive at the output unattenuated, which is why a vocoder's /t/ and /s/
    // cut through an arrangement that has swallowed its vowels.
    burstGain: 1.0,
    // Locked to the eighth note rather than to the phrase, and that is the
    // structural difference from every other profile here. Ambient's syllable
    // rate is chosen against a *breath* — one every two seconds, because that
    // is how long a choir can hold a vowel. Iskelmä's is chosen against a
    // *line* — one per beat, because that is how the tune is worded. Neither
    // question applies to a machine. What a vocoder is synchronised to is the
    // sequencer, so the syllable is a subdivision of the bar and nothing else:
    // two per beat, exactly on the grid, arriving whether there is anything to
    // say or not.
    syllableBeats: 0.5,
    // Half a syllable sounding, half silent. On the renderer's sixteenth grid
    // (`slotOf` rounds beats to quarter-beats) 0.5 beats is two slots, and 0.36
    // rounds to one of them — so the gap survives quantisation. Anything from
    // 0.375 up rounds to the full two slots and closes it, at which point the
    // line stops being syllabic and becomes a held pad, which is the exact
    // failure ambient's profile documents at the other end of the tempo range.
    blipBeats: 0.36,
    // Four milliseconds. A sung attack is a diaphragm accelerating a column of
    // air and cannot be much under fifteen; a vocoder's envelope follower has a
    // time constant measured in single milliseconds, and its carrier is already
    // sounding before the modulator arrives. The syllable does not begin, it is
    // simply switched on.
    attack: 0.004,
    // A gate rather than an envelope: a hint of a decay, then flat, then off.
    // The carrier is a key being held down, and a key held down does not fade.
    decay: 0.05,
    sustain: 1.0,
    release: 0.02,
    // No breath, at all. `noise` is documented as broadband noise mixed into
    // the source, and the source here is an oscillator with no lungs behind it.
    // The only noise in a vocoder is the sibilance path, and that is already
    // paid for at full level by `burstGain` above — adding a breath layer on
    // top would be modelling an organ that pants.
    noise: 0,
    // No vibrato, because vibrato is a diaphragm oscillating at five hertz and
    // there is no diaphragm. `vibRate` is inert at this depth and is left at a
    // plausible value rather than zero so that nothing downstream divides by it.
    vibRate: 5.0,
    vibDepth: 0,
    // The one number that carries the whole argument in the docstring above.
    formantTrack: 0,
    // No scoop. `VoiceSettings` calls this the strongest "this is a person" cue
    // available — a voice reaches a pitch, an organ is simply already on it —
    // and this is an organ. The carrier is at concert pitch the instant the key
    // closes, because an oscillator has no way of being approximately in tune
    // on its way somewhere. `scoopTime` is inert at zero depth.
    scoop: 0,
    scoopTime: 0.02,
  },
};
