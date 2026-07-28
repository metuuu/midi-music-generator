/**
 * What each audition source actually outputs, and the trim that makes them
 * comparable.
 *
 * The twin of `render/drum-banks.ts`: measured facts about the sample packs
 * rather than decisions about the music. Both exist because the packs are what
 * they are and nobody in this project chose them.
 *
 * The problem this solves is that `Track.gain` was a linear multiplier on
 * sources of wildly different intrinsic loudness, so the mix tables did not mean
 * what they looked like they meant. `melody: 0.85` had to be simultaneously
 * right for a trumpet, a harp and a square-wave lead, and across the catalogue
 * those span **19.2 dB** — `gm_lead_1_square` at −10.9 LUFS against
 * `gm_electric_guitar_muted` at −30.1. No single fader is right for both, which
 * is why the lead sounded thin on some songs and not others: not the fader, the
 * font.
 *
 * The drum machines are worse, because there the swing is inside one voice.
 * Kicks span 13.2 dB from bank to bank and snares 17.3 — the `AkaiMPC60` snare
 * is 10 dB above the median and the whole `RolandTR808` set sits about 9 dB
 * below it, since the pack captured the 808 at half scale where every other
 * machine is at full. An era that rolls a 909 and an era that rolls an 808 were
 * not playing the same arrangement at the same level, they were playing it 13 dB
 * apart. That is the *sometimes* in "the drums are sometimes too loud".
 *
 * Peak normalisation is why this was invisible. Every soundfont note peaks
 * within 0.08…0.30 and every drum sample within 0.43…1.22, so by the meter the
 * renderer could have consulted they all look fine. Loudness and peak are
 * different questions and only one of them is what an ear answers.
 *
 * ## How the numbers were made
 *
 * Each source was rendered on its own through `superdough` into an
 * `OfflineAudioContext` at 48 kHz — the same call the audition takes, so
 * envelopes, zone selection and playback rate are all the real ones — and
 * measured as **maximum momentary loudness**: ITU-R BS.1770 K-weighting, 400 ms
 * sliding window, 100 ms hop. Momentary rather than integrated because the
 * things being compared last different lengths, and an average over a fixed
 * window calls a kick quiet when what the ear takes is its 400 ms peak.
 * K-weighted rather than RMS because the question is perceptual — it is the same
 * curve `DEFAULT_DRUM_MIX` approximates by hand when it says a hi-hat struck as
 * hard as a kick is twice as loud.
 *
 * Melodic sources were sounded at each instrument's own `centre`, which is where
 * its part actually sits, and with the envelope `envelopeFor` would give it,
 * because a bow's slow attack is part of how loud that instrument is in a mix.
 *
 * ## What the trims normalise to, and what they deliberately do not
 *
 * Soundfonts are pulled to the catalogue median, −18.8 LUFS. Centring on the
 * median rather than on a fixed target is what keeps the existing layer gains
 * meaning roughly what they meant before: the mix does not get louder or
 * quieter, the spread just collapses.
 *
 * Drum voices are pulled to the median **of that voice across all banks** — every
 * bank's kick to the median kick, every bank's hat to the median hat — and not
 * to each other. That distinction is the whole design. `DEFAULT_DRUM_MIX` is an
 * engineer's balance between the voices of a kit and was settled by ear; a trim
 * that equalised `bd` against `hh` would overwrite it. What gets removed here is
 * only the difference between machines, which nobody chose and nobody wants.
 *
 * Each trim is capped so the source cannot exceed full scale *after* its mix
 * gains, which binds on six entries (the 808's kick among them, which wants
 * ×2.8 and gets ×2.6). The cap is on the level a source reaches in the mix
 * rather than on the raw sample, because every machine in the pack is already
 * normalised to 0 dBFS and a cap on the sample alone would refuse every boost.
 *
 * ## Scope
 *
 * Audition-only, and keyed by soundfont and sample name rather than by
 * instrument, because that is what these numbers are about. They describe
 * webaudiofont's conversions of some 1990s soundcard banks and one drum-machine
 * pack — not the violin, and not the music. A native engine with its own samples
 * needs its own pass; MIDI, which hands the levels to whatever synth is
 * listening, must not carry them at all. Hence `render/` and not `style/`, and
 * hence the Strudel renderer applying them rather than the generator baking them
 * into `Track.gain`.
 *
 * The sung line is deliberately absent. It is built from raw oscillators rather
 * than a soundfont, and its level against the arrangement is `VOICE_MIX`, which
 * was settled by ear against that source. Trimming it here would be correcting
 * a measurement nobody took with a number somebody already tuned.
 */

import type { DrumVoice } from '../core/types.js';

/**
 * Per-soundfont trim, relative to the catalogue median.
 *
 * Below 1 the font was hot, above 1 it was quiet. The two ends are the point:
 * `gm_lead_1_square` at 0.40 and `gm_lead_6_voice` at 1.41 were 10.9 dB apart on
 * the same `melody` fader, and a genre that rolled the second one got a lead
 * that vanished into the band.
 */
export const SOUNDFONT_LEVEL: Record<string, number> = {
  gm_accordion: 0.62,
  gm_bandoneon: 0.62,
  gm_harmonica: 0.73,
  gm_piano: 0.92,
  gm_epiano1: 1.05,
  gm_epiano2: 1.55,
  gm_clavinet: 1.42,
  gm_vibraphone: 0.66,
  gm_glockenspiel: 3.53,
  gm_drawbar_organ: 1.27,
  gm_rock_organ: 2.55,
  gm_percussive_organ: 1.47,
  gm_acoustic_guitar_nylon: 1.16,
  gm_acoustic_guitar_steel: 1.47,
  gm_electric_guitar_jazz: 1.47,
  gm_electric_guitar_clean: 0.88,
  gm_electric_guitar_muted: 3.66,
  gm_overdriven_guitar: 0.71,
  gm_distortion_guitar: 0.72,
  gm_acoustic_bass: 1.44,
  gm_electric_bass_finger: 1.56,
  gm_electric_bass_pick: 1.54,
  gm_slap_bass_1: 1.56,
  gm_synth_bass_1: 0.95,
  gm_synth_bass_2: 0.85,
  gm_fretless_bass: 0.87,
  gm_contrabass: 0.84,
  gm_violin: 0.73,
  gm_fiddle: 0.85,
  gm_cello: 1.05,
  gm_tremolo_strings: 0.91,
  gm_pizzicato_strings: 1.42,
  gm_orchestral_harp: 0.90,
  gm_string_ensemble_1: 0.91,
  gm_string_ensemble_2: 0.91,
  gm_synth_strings_1: 1.10,
  gm_synth_strings_2: 0.79,
  gm_trumpet: 1.02,
  gm_trombone: 1.18,
  gm_muted_trumpet: 0.97,
  gm_brass_section: 0.92,
  gm_synth_brass_1: 0.83,
  gm_synth_brass_2: 0.83,
  gm_soprano_sax: 0.84,
  gm_alto_sax: 0.72,
  gm_tenor_sax: 1.04,
  gm_baritone_sax: 1.00,
  gm_clarinet: 0.72,
  gm_flute: 0.62,
  gm_pan_flute: 1.35,
  gm_shakuhachi: 0.95,
  gm_celesta: 0.68,
  gm_music_box: 0.84,
  gm_tubular_bells: 1.13,
  gm_kalimba: 2.49,
  gm_marimba: 2.32,
  gm_sitar: 1.13,
  gm_church_organ: 0.80,
  gm_reed_organ: 0.85,
  gm_choir_aahs: 1.29,
  gm_voice_oohs: 0.64,
  gm_synth_choir: 0.86,
  gm_pad_warm: 1.08,
  gm_pad_new_age: 0.81,
  gm_pad_poly: 1.48,
  gm_pad_choir: 1.81,
  gm_pad_bowed: 1.02,
  gm_pad_metallic: 1.07,
  gm_pad_halo: 0.79,
  gm_pad_sweep: 1.07,
  gm_fx_rain: 1.57,
  gm_fx_soundtrack: 1.14,
  gm_fx_crystal: 2.26,
  gm_fx_atmosphere: 1.18,
  gm_fx_brightness: 0.99,
  gm_fx_goblins: 2.73,
  gm_fx_echoes: 1.03,
  gm_fx_sci_fi: 1.67,
  gm_lead_1_square: 0.40,
  gm_lead_2_sawtooth: 0.52,
  gm_lead_3_calliope: 0.64,
  gm_lead_4_chiff: 1.38,
  gm_lead_5_charang: 0.48,
  gm_lead_6_voice: 1.41,
  gm_lead_7_fifths: 1.00,
  gm_lead_8_bass_lead: 0.68,
};

/**
 * Per-bank, per-voice trim, relative to the median of that voice across banks.
 *
 * Read the columns rather than the rows: `RolandTR808` is uniformly around ×2.3
 * because the pack captured that machine quietly, and `AkaiMPC60`'s snare is
 * 0.31 because it is an enormous sample sitting 10 dB above every other snare
 * here. Neither is a statement about how a kit should be balanced — that is
 * `DEFAULT_DRUM_MIX`, and it survives this untouched.
 */
export const DRUM_SAMPLE_LEVEL: Record<string, Partial<Record<DrumVoice, number>>> = {
  AkaiMPC60: { bd: 1.25, sd: 0.31, rim: 1.00, hh: 1.24, oh: 0.79, cp: 0.62, lt: 1.43, mt: 0.92, ht: 0.98, cr: 0.90, rd: 0.80, perc: 0.57 },
  AlesisSR16: { bd: 1.21, sd: 0.87, rim: 1.00, hh: 1.57, oh: 0.97, cp: 1.66, cr: 1.25, rd: 1.48, perc: 1.08, cb: 0.73, sh: 0.98 },
  EmuSP12: { bd: 0.82, sd: 0.96, rim: 0.57, hh: 1.32, oh: 1.04, cp: 1.71, lt: 1.35, mt: 1.39, ht: 1.67, cr: 0.72, rd: 0.65, perc: 0.57, cb: 0.97 },
  KorgKR55: { bd: 0.99, sd: 1.11, rim: 1.49, hh: 1.03, oh: 0.72, ht: 0.80, cr: 2.45, perc: 0.96, cb: 1.02 },
  KorgM1: { bd: 0.85, sd: 0.58, rim: 1.42, hh: 0.86, oh: 1.03, cp: 0.63, mt: 1.02, ht: 1.36, cr: 0.88, rd: 1.79, perc: 0.49, cb: 1.04, sh: 1.02 },
  KorgMinipops: { bd: 1.01, sd: 1.50, hh: 0.98, oh: 1.12 },
  KorgT3: { bd: 0.79, sd: 0.94, rim: 1.11, hh: 0.83, oh: 1.66, cp: 0.90, perc: 0.74, sh: 1.58 },
  LinnDrum: { bd: 1.07, sd: 0.83, rim: 0.73, hh: 0.73, oh: 0.71, cp: 0.86, lt: 0.92, mt: 0.96, ht: 0.99, cr: 0.84, rd: 0.78, perc: 1.18, cb: 0.79, sh: 0.95 },
  OberheimDMX: { bd: 1.10, sd: 1.14, rim: 1.12, hh: 0.80, oh: 0.67, cp: 0.78, lt: 0.86, mt: 0.85, ht: 0.87, cr: 0.98, rd: 0.94, sh: 0.80 },
  RhythmAce: { bd: 0.96, sd: 1.13, hh: 1.09, oh: 1.40, lt: 1.62, ht: 1.56, perc: 2.46 },
  RolandCompurhythm1000: { bd: 1.04, sd: 0.93, rim: 1.01, hh: 1.13, oh: 0.79, cp: 1.17, lt: 1.08, mt: 1.02, ht: 0.92, cr: 0.82, rd: 2.63, perc: 1.04, cb: 0.91 },
  RolandCompurhythm78: { bd: 1.24, sd: 1.46, hh: 0.65, oh: 1.18, perc: 1.04, cb: 0.79 },
  RolandD70: { bd: 1.21, sd: 0.88, rim: 0.60, hh: 0.99, oh: 1.53, cp: 1.64, lt: 0.96, mt: 1.65, cr: 1.08, rd: 0.61, perc: 0.88, cb: 1.37, sh: 1.02 },
  RolandMT32: { bd: 0.94, sd: 0.74, rim: 0.79, hh: 0.87, oh: 0.80, cp: 0.79, lt: 0.89, mt: 1.01, ht: 1.06, cr: 1.34, rd: 2.78, perc: 1.29, cb: 0.98, sh: 0.91 },
  RolandR8: { bd: 1.14, sd: 1.27, rim: 1.92, hh: 1.01, oh: 0.74, cp: 1.00, lt: 1.17, mt: 0.76, ht: 1.44, cr: 1.13, rd: 1.01, perc: 1.18, cb: 1.38, sh: 1.20 },
  RolandTR707: { bd: 0.91, sd: 0.90, rim: 0.82, hh: 0.75, oh: 0.78, cp: 0.88, lt: 0.98, mt: 0.89, ht: 1.00, cr: 0.88, cb: 0.95 },
  RolandTR808: { bd: 2.59, sd: 2.30, rim: 1.92, hh: 2.60, oh: 1.84, cp: 1.40, lt: 2.27, mt: 2.22, ht: 2.12, cr: 2.90, perc: 1.52, cb: 1.87, sh: 3.01 },
  RolandTR909: { bd: 0.62, sd: 1.32, rim: 0.76, hh: 1.27, oh: 1.15, cp: 1.69, lt: 1.01, mt: 0.99, ht: 1.16, cr: 1.10, rd: 0.99 },
  ViscoSpaceDrum: { bd: 0.67, sd: 1.17, rim: 1.15, hh: 1.10, oh: 0.90, lt: 0.89, mt: 0.80, ht: 0.66, perc: 0.71, cb: 1.88 },
  YamahaRY30: { bd: 0.64, sd: 1.04, rim: 0.78, hh: 0.86, oh: 1.26, cp: 1.01, lt: 0.99, mt: 1.25, ht: 0.85, cr: 1.00, rd: 1.64, perc: 0.78, cb: 1.03, sh: 0.86 },
};

/**
 * The trim for one soundfont, or 1 for anything unmeasured.
 *
 * Unity rather than an error: an unmeasured source is exactly where the renderer
 * stood before this file existed, and a new catalogue entry should sound wrong
 * in a way somebody notices, not fail to render.
 */
export function levelOfSound(sound: string): number {
  return SOUNDFONT_LEVEL[sound] ?? 1;
}

/**
 * The trim for one drum sample.
 *
 * Keyed by the voice the bank actually plays, which is what `resolveVoice`
 * returns and not always what the pattern asked for — the trim belongs to the
 * sample that sounds. The mix fader stays keyed to the requested voice, because
 * a tom substituted for another tom is still mixed as the tom it was written as.
 */
export function levelOfDrum(bank: string, voice: DrumVoice): number {
  return DRUM_SAMPLE_LEVEL[bank]?.[voice] ?? 1;
}
