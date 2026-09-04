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

import type { Midi } from '../core/pitch.js';
import type { DrumVoice } from '../core/types.js';
import { rackFor, readBankName } from './drum-banks.js';

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
  /**
   * The oscillators, worked out from superdough's 0.3 amplitude rather than
   * metered: a saw lands about 6 dB over the catalogue median and a square
   * about 10 dB, with the supersaw's per-voice gain summing to the saw's.
   */
  supersaw: 0.50,
  sawtooth: 0.50,
  square: 0.32,
};

/**
 * Where a font's own level moves across the keyboard, as a correction to the
 * trim above.
 *
 * `SOUNDFONT_LEVEL` was measured at one pitch — each instrument's `centre` — and
 * the assumption underneath it was that a soundfont is one instrument at one
 * loudness with the pitch changed. It is not, for two separate reasons, and this
 * table corrects them together.
 *
 * **The zones are separate takes.** A webaudiofont program is a handful of
 * recorded notes in key ranges, and the ranges were never levelled against each
 * other. `gm_brass_section` steps 1.1 dB at key 63 between two zones that share
 * a root — the same resampling ratio either side, so nothing but the takes can
 * account for it.
 *
 * **Between the boundaries the sample is resampled.** `getFontBufferSource`
 * plays a zone at `2^((100·midi − baseDetune)/1200)`, so a note away from its
 * zone's root is that waveform with its whole spectrum moved, and loudness
 * follows the spectrum rather than the peak. The generator writes 1.94 semitones
 * below the sample roots on average, 22.5% of all notes six or more semitones
 * below and 7.3% a full octave or more — the library runs duller and quieter
 * than the fonts it is playing. Five fonts are one zone for the whole keyboard,
 * where this is the only effect there is and a per-zone average reports nothing.
 *
 * ## How the numbers were made
 *
 * Every semitone of every instrument's range, through the renderer's own zone
 * lookup, playback rate, loop and envelope, measured as maximum momentary
 * loudness exactly as `SOUNDFONT_LEVEL` was, then segmented wherever the curve
 * moves more than 0.5 dB. Segmented on the curve and not at the zone edges,
 * because the ramp inside a zone is as real as the step at its edge.
 *
 * Sounded for 2 s. That is not the length of a written note — the median is
 * nearer 0.3 s — but it is what reproduces the six rows this table used to hold,
 * which were made by hand through the browser's own renderer: **0.11 dB of mean
 * error across their 43 zones**, and two independent methods agreeing on the
 * violin to 0.06. Measuring at the length the generator actually writes moves
 * the answer by 0.34 dB in the note-weighted mean, and by 2.4 dB on the cello.
 * That is the open question left in this file.
 *
 * Each font's rows cover only the span the generator writes for it. A dead
 * octave nobody plays gets no correction, and `levelOfSound`'s bottom entry
 * covers everything underneath.
 *
 * ## What a fader cannot fix
 *
 * Some zones hold no usable recording. They are left at 1.00 rather than
 * corrected, because gain pointed at a broken sample makes it louder without
 * making it right:
 *
 * ```
 *   gm_vibraphone  73–84   −22 dB   14% of its notes   52 ms fragment, looped
 *   gm_vibraphone  86–90   silent    1%                empty payload
 *   gm_shanai      66–69   +27 dB    9%                52 ms fragment
 *   gm_bandoneon   81–82   +22 dB    8%                52 ms fragment
 *   gm_woodblock   67–68   −15 dB    1%                unlooped, runs out
 * ```
 *
 * The vibraphone is the one to act on: an eighth of every vibraphone note in the
 * catalogue is a fragment 22 dB down, which is a font to replace rather than a
 * level to trim.
 *
 * ## The largest faults that are levels
 *
 * ```
 *   gm_bandoneon        41–53   +11.3 dB   49% of its notes
 *   gm_bassoon          34–47    −4.3      83%
 *   gm_pan_flute        80–86    +9.6      27%
 *   gm_brass_section    36–63    −4.2      58%
 *   gm_orchestral_harp  48–67    +2.7      83%
 *   gm_tenor_sax        70–75    +5.0      40%
 *   gm_xylophone        65–73    −4.3      40%
 *   gm_synth_brass_1    62–69    −2.7      49%
 * ```
 *
 * Flattening moves a font's average level, and that is the fault being fixed
 * rather than a side effect of fixing it: the trim puts `centre` at the
 * catalogue median, so a font most of whose notes sat under `centre` has to get
 * louder on the way to being even.
 *
 * Measured over the same 600 songs, against the table as it stood with six rows
 * in it: **63% of every note moves by 0.1 dB or more, the median move is 0.9 dB
 * and the largest is 11.4 dB — and the net across the whole catalogue is
 * +0.10 dB.** Nothing here makes the music louder; it moves level from the
 * registers that had too much of it to the ones that had too little. The fonts
 * that move most are the bandoneon (−5.7 dB on average), the bassoon (+3.9), the
 * tenor sax (−3.2), the orchestral harp (−2.3, on 30k notes) and synth brass 1
 * (+2.2).
 *
 * Read as: from this MIDI note up to the next entry, multiply. 93 of the 103
 * fonts the generator can reach are here. The other ten measured flatter than
 * 1.2 dB across everything anyone plays on them, and get 1 — and unlike before,
 * that is now a measurement rather than an absence of one.
 */
export const REGISTER_LEVEL: Record<string, readonly (readonly [Midi, number])[]> = {
  gm_accordion: [
    [41, 1.25], [54, 1.39], [58, 1.25], [62, 1.57], [66, 0.99], [78, 0.92],
  ],
  gm_acoustic_bass: [
    [28, 0.73], [32, 0.65], [39, 0.61], [40, 0.98],
  ],
  gm_acoustic_guitar_nylon: [
    [40, 0.85], [42, 0.97], [47, 1.09], [58, 1.01], [64, 0.96], [70, 1.29],
    [77, 1.48],
  ],
  gm_acoustic_guitar_steel: [
    [41, 0.87], [44, 0.76], [45, 1.21], [47, 0.73], [49, 0.60], [50, 1.06],
    [52, 1.15], [54, 1.03], [56, 0.89], [57, 1.01], [61, 0.83], [64, 0.68],
    [66, 0.95], [68, 1.87], [69, 1.40], [71, 1.78], [73, 1.41], [74, 2.13],
    [76, 1.44], [78, 1.28],
  ],
  gm_agogo: [
    [72, 0.93], [78, 1.03], [84, 1.14], [89, 1.22],
  ],
  gm_alto_sax: [
    [58, 1.59], [62, 1.24], [66, 1.98], [70, 1.00], [74, 1.09],
  ],
  gm_bandoneon: [
    [41, 0.27], [54, 1.00], [72, 0.98], [81, 1.00],
  ],
  gm_banjo: [
    [50, 1.57], [54, 0.85], [60, 1.00], [64, 0.72], [71, 0.80], [75, 0.97],
  ],
  gm_baritone_sax: [
    [38, 1.60], [42, 0.85], [46, 1.00], [54, 0.88], [58, 1.11], [62, 0.92],
  ],
  gm_bassoon: [
    [34, 1.64], [48, 1.00], [52, 1.64], [56, 1.39], [60, 0.89], [64, 1.48],
    [69, 0.98],
  ],
  gm_brass_section: [
    [36, 1.62], [64, 1.43], [71, 0.98], [77, 1.02],
  ],
  gm_celesta: [
    [46, 1.23], [66, 1.12], [74, 1.00], [79, 0.88], [86, 0.82],
  ],
  gm_cello: [
    [36, 1.01], [37, 0.82], [50, 0.99], [60, 1.14], [70, 1.04], [79, 0.95],
  ],
  gm_choir_aahs: [
    [28, 1.09], [31, 0.97], [59, 1.02], [65, 0.81], [71, 0.66], [77, 0.61],
  ],
  gm_church_organ: [
    [36, 1.13], [53, 1.01], [62, 0.91], [70, 0.77], [78, 0.90],
  ],
  gm_clarinet: [
    [50, 1.15], [66, 1.04], [73, 0.94], [81, 0.86],
  ],
  gm_clavinet: [
    [35, 1.62], [36, 1.45], [40, 1.27], [42, 1.59], [45, 1.33], [49, 1.13],
    [51, 1.03], [61, 0.75], [66, 0.79], [72, 0.74], [73, 0.58], [79, 0.52],
  ],
  gm_contrabass: [
    [28, 1.23], [37, 0.98], [50, 1.20],
  ],
  gm_distortion_guitar: [
    [40, 1.39], [45, 1.20], [50, 1.37], [55, 1.22], [59, 1.00], [62, 0.84],
    [67, 1.01], [71, 0.84], [74, 0.71], [78, 0.94],
  ],
  gm_drawbar_organ: [
    [26, 1.11], [30, 0.97], [39, 0.88], [51, 1.02],
  ],
  gm_dulcimer: [
    [55, 0.84], [62, 0.96], [68, 0.63], [74, 0.69], [79, 1.11],
  ],
  gm_electric_guitar_jazz: [
    [40, 0.70], [42, 0.55], [44, 0.69], [53, 0.74], [60, 1.01], [62, 1.14],
    [66, 0.86], [70, 0.79], [75, 0.76],
  ],
  gm_electric_guitar_muted: [
    [40, 0.90], [55, 1.00], [67, 1.08],
  ],
  gm_english_horn: [
    [61, 1.11], [62, 0.92], [66, 0.98], [75, 0.88],
  ],
  gm_epiano1: [
    [29, 0.91], [44, 0.82], [51, 0.73], [55, 1.00], [64, 1.15], [67, 0.95],
    [71, 0.81], [75, 0.69], [79, 1.09], [83, 0.76],
  ],
  gm_epiano2: [
    [35, 1.02], [65, 1.11], [69, 1.28], [78, 1.40],
  ],
  gm_fiddle: [
    [57, 1.71], [60, 1.20], [68, 0.98], [72, 0.86], [76, 1.02], [84, 1.09],
  ],
  gm_flute: [
    [60, 1.57], [63, 1.44], [65, 1.26], [72, 1.18], [74, 1.00], [79, 1.10],
    [84, 0.93],
  ],
  gm_french_horn: [
    [50, 1.04], [63, 0.96], [73, 0.89],
  ],
  gm_fretless_bass: [
    [28, 1.03], [51, 0.81], [59, 0.87],
  ],
  gm_fx_atmosphere: [
    [33, 1.18], [39, 1.05], [47, 0.96], [73, 0.90],
  ],
  gm_fx_brightness: [
    [62, 1.04], [73, 0.95], [78, 0.88], [82, 0.76],
  ],
  gm_fx_crystal: [
    [53, 0.74], [68, 0.79], [71, 0.99], [92, 0.92],
  ],
  gm_fx_echoes: [
    [50, 0.82], [61, 1.00], [73, 0.86],
  ],
  gm_fx_sci_fi: [
    [45, 0.91], [46, 1.03], [55, 1.09], [56, 0.96], [62, 1.04], [71, 0.72],
    [73, 0.64], [78, 1.19],
  ],
  gm_glockenspiel: [
    [58, 0.76], [66, 0.85], [72, 0.96], [81, 1.06], [88, 0.38],
  ],
  gm_harmonica: [
    [60, 1.45], [62, 1.80], [67, 1.61], [71, 1.01], [74, 1.08], [78, 0.96],
    [82, 1.06],
  ],
  gm_harpsichord: [
    [45, 1.15], [46, 0.97], [48, 0.91], [51, 0.99], [67, 1.22], [71, 1.02],
    [76, 0.83], [79, 0.94], [82, 1.24],
  ],
  gm_kalimba: [
    [63, 0.90], [69, 0.99], [75, 1.11],
  ],
  gm_lead_1_square: [
    [36, 1.37], [46, 1.23], [57, 1.09], [68, 1.00], [79, 1.06],
  ],
  gm_lead_2_sawtooth: [
    [50, 1.25], [56, 0.86], [68, 0.99], [80, 1.15],
  ],
  gm_lead_3_calliope: [
    [64, 1.06], [72, 0.97], [78, 0.85],
  ],
  gm_lead_4_chiff: [
    [66, 1.02], [71, 0.65], [72, 1.00], [79, 0.65], [80, 0.89],
  ],
  gm_lead_5_charang: [
    [64, 0.33], [68, 1.00], [77, 0.90],
  ],
  gm_lead_6_voice: [
    [43, 0.89], [53, 0.99], [85, 0.90], [89, 0.82],
  ],
  gm_marimba: [
    [55, 1.34], [56, 0.82], [63, 0.91], [70, 1.01], [76, 1.13], [81, 1.25],
  ],
  gm_music_box: [
    [63, 1.27], [72, 1.34], [73, 1.00],
  ],
  gm_muted_trumpet: [
    [53, 1.02], [76, 1.27], [79, 1.06],
  ],
  gm_oboe: [
    [64, 1.33], [69, 1.25], [70, 1.06], [74, 0.99], [85, 0.89],
  ],
  gm_orchestra_hit: [
    [53, 1.16], [56, 1.05], [61, 0.93],
  ],
  gm_orchestral_harp: [
    [35, 1.01], [38, 0.92], [42, 0.82], [48, 0.73], [68, 0.99], [79, 0.90],
  ],
  gm_overdriven_guitar: [
    [40, 1.44], [50, 1.24], [55, 1.15], [59, 1.00], [62, 1.25], [66, 1.17],
    [67, 1.22], [70, 1.15], [71, 1.02], [74, 1.05], [78, 0.91],
  ],
  gm_pad_bowed: [
    [50, 1.14], [57, 1.02], [58, 1.08], [59, 0.98], [69, 0.92],
  ],
  gm_pad_halo: [
    [32, 1.12], [35, 1.02], [39, 0.91], [44, 0.85], [53, 0.93], [59, 1.02],
    [64, 1.07], [70, 0.99],
  ],
  gm_pad_metallic: [
    [44, 0.87], [50, 0.97], [62, 1.18], [67, 0.87], [75, 0.81],
  ],
  gm_pad_new_age: [
    [34, 1.62], [44, 1.02], [64, 1.15], [68, 1.27], [73, 1.18],
  ],
  gm_pad_poly: [
    [25, 1.42], [31, 1.30], [53, 1.19], [59, 1.01], [65, 1.34], [71, 1.08],
  ],
  gm_pad_sweep: [
    [34, 0.93], [43, 0.87], [50, 0.97], [62, 1.18], [67, 0.87],
  ],
  gm_pad_warm: [
    [26, 1.33], [36, 1.19], [43, 1.04], [73, 0.96],
  ],
  gm_pan_flute: [
    [59, 1.00], [80, 0.33], [87, 0.31],
  ],
  gm_percussive_organ: [
    [29, 1.07], [59, 0.96], [74, 0.91],
  ],
  gm_piano: [
    [33, 1.28], [34, 1.14], [45, 1.31], [49, 1.00], [52, 0.87], [57, 0.99],
    [61, 1.26], [65, 1.00], [68, 1.30], [73, 0.92], [78, 1.02], [83, 1.31],
    [86, 1.11],
  ],
  gm_pizzicato_strings: [
    [45, 0.98], [64, 1.08], [70, 1.43], [77, 1.64],
  ],
  gm_recorder: [
    [65, 1.03], [81, 0.78], [84, 0.87], [87, 0.79],
  ],
  gm_reed_organ: [
    [28, 1.83], [54, 1.71], [57, 1.05], [58, 1.02],
  ],
  gm_rock_organ: [
    [25, 0.41], [31, 0.37], [37, 0.34], [42, 1.12], [50, 0.99], [74, 0.93],
  ],
  gm_shakuhachi: [
    [60, 0.82], [67, 0.91], [72, 1.05],
  ],
  gm_shanai: [
    [60, 1.00], [62, 1.00], [63, 1.81], [66, 1.00], [70, 0.97], [83, 0.91],
  ],
  gm_sitar: [
    [50, 1.02], [71, 1.12], [77, 1.21],
  ],
  gm_slap_bass_1: [
    [29, 1.09], [37, 0.99], [49, 1.32],
  ],
  gm_slap_bass_2: [
    [28, 1.22], [39, 0.95],
  ],
  gm_soprano_sax: [
    [69, 0.83], [72, 0.72], [76, 0.98], [80, 0.68],
  ],
  gm_string_ensemble_1: [
    [36, 1.12], [45, 1.03], [50, 1.17], [57, 1.06], [62, 1.22], [67, 0.99],
  ],
  gm_string_ensemble_2: [
    [36, 1.12], [45, 1.03], [50, 1.17], [57, 1.06], [62, 1.22], [67, 0.99],
  ],
  gm_synth_bass_1: [
    [28, 1.26], [32, 1.12], [37, 0.98], [52, 0.92], [56, 1.20], [67, 0.94],
  ],
  gm_synth_bass_2: [
    [28, 1.30], [31, 1.18], [35, 1.06], [40, 0.97],
  ],
  gm_synth_brass_1: [
    [46, 1.48], [62, 1.36], [70, 0.99], [77, 0.90],
  ],
  gm_synth_brass_2: [
    [50, 1.46], [63, 1.35], [69, 0.99], [77, 0.91],
  ],
  gm_synth_choir: [
    [34, 0.97], [38, 0.84], [58, 0.94], [64, 1.00], [70, 0.96],
  ],
  gm_synth_strings_1: [
    [36, 1.16], [43, 1.03], [73, 0.94], [86, 0.87],
  ],
  gm_tenor_sax: [
    [48, 1.49], [53, 1.20], [56, 0.99], [61, 0.76], [66, 0.83], [70, 0.56],
    [76, 0.72],
  ],
  gm_timpani: [
    [38, 0.98], [48, 1.09], [54, 1.19],
  ],
  gm_tremolo_strings: [
    [37, 1.10], [47, 1.02], [50, 1.17], [57, 1.06], [62, 1.22], [67, 0.99],
  ],
  gm_trombone: [
    [41, 1.17], [49, 0.92], [59, 1.02], [74, 0.78],
  ],
  gm_trumpet: [
    [52, 1.53], [61, 1.37], [68, 1.03], [73, 1.07], [77, 0.91],
  ],
  gm_tuba: [
    [28, 1.28], [36, 0.99], [46, 0.68], [51, 0.72], [56, 0.59],
  ],
  gm_tubular_bells: [
    [64, 0.94], [72, 1.04], [78, 1.15],
  ],
  gm_vibraphone: [
    [53, 1.32], [61, 1.20], [66, 1.06], [72, 1.00], [73, 1.00], [85, 0.95],
    [86, 1.00],
  ],
  gm_viola: [
    [60, 1.01], [73, 1.12], [81, 0.77],
  ],
  gm_violin: [
    [62, 1.01], [63, 1.27], [69, 1.55], [73, 1.01], [78, 1.36], [83, 1.07],
  ],
  gm_voice_oohs: [
    [29, 1.75], [33, 1.55], [58, 1.31], [63, 1.00], [70, 1.11],
  ],
  gm_woodblock: [
    [67, 1.00], [68, 1.00], [69, 3.14], [70, 2.46], [71, 2.02], [72, 1.73],
    [73, 1.52], [74, 1.37], [75, 1.25], [76, 1.17], [77, 1.07], [79, 0.95],
    [83, 0.87],
  ],
  gm_xylophone: [
    [65, 1.63], [74, 1.01],
  ],
};

/**
 * Per-bank, per-voice trim, relative to the median of that voice across banks.
 *
 * Read the columns rather than the rows: `RolandTR808` is uniformly around ×2.3
 * because the pack captured that machine quietly, and `AkaiMPC60`'s snare is
 * 0.31 because it is an enormous sample sitting 10 dB above every other snare
 * here. Neither is a statement about how a kit should be balanced — that is
 * `DEFAULT_DRUM_MIX`, and it survives this untouched.
 *
 * ## What is measured, and what is therefore silently at unity
 *
 * Twenty banks, and fourteen voices in each of them. That was the whole of what
 * four genres could draw when the pass was run, and it is no longer the whole of
 * what the project can reach: `render/drum-banks.ts` now registers 55 of the
 * pack's 71 machines, and `DrumVoice` carries four voices — `tb`, `lp`, `mp`,
 * `hp` — that were not in the pack's vocabulary when these numbers were taken.
 *
 * Everything unlisted gets ×1 from `levelOfDrum`, which is exactly where the
 * renderer stood before this file existed, and it is worth being blunt about
 * what that means rather than leaving it to be discovered: **the 35 new banks
 * play at whatever level the pack captured them at.** The measured twenty span
 * 13.2 dB on the kick alone, so the unmeasured thirty-five can be assumed to
 * span something similar, and an era that draws two of them will be two
 * different arrangements at two different levels — the original complaint, in
 * the part of the pack nobody has been through yet.
 *
 * The tambourine is the one to measure first, since it is the only new voice
 * with real samples behind it: 23 of the registered banks carry a `tb`, and it
 * is a bright, long, loud sound in the exact octave `DEFAULT_DRUM_MIX` spends
 * its care on. `lp`/`mp`/`hp` have no samples anywhere in this pack and always
 * resolve to something that does, so `levelOfDrum` is keyed to the substitute
 * and is already right for them — see the note on `levelOfDrum` below. Where
 * they have a real instrument behind them it is not from this pack at all, and
 * is measured separately in `RACK_SAMPLE_LEVEL`.
 *
 * Fabricating entries here would be worse than leaving them out. Every number
 * in this file came off a K-weighted meter and the file is only useful while
 * that stays true.
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
 * The trim for one soundfont at one pitch, or 1 for anything unmeasured.
 *
 * Unity rather than an error: an unmeasured source is exactly where the renderer
 * stood before this file existed, and a new catalogue entry should sound wrong
 * in a way somebody notices, not fail to render.
 *
 * The pitch is not optional, because there is no such thing as the loudness of
 * a soundfont — see `REGISTER_LEVEL`, which now carries a curve for 93 of the
 * 103 fonts the generator can reach. The ten without one were measured too and
 * are flat; a font absent from both tables is a new catalogue entry nobody has
 * put a meter on yet.
 */
export function levelOfSound(sound: string, midi: Midi): number {
  const base = SOUNDFONT_LEVEL[sound] ?? 1;
  const steps = REGISTER_LEVEL[sound];
  if (!steps) return base;
  // The bottom entry also covers anything below it: a part folded under the
  // instrument's floor is a fault the range table catches, not a silent one.
  let register = steps[0]![1];
  for (const [from, trim] of steps) {
    if (midi < from) break;
    register = trim;
  }
  return base * register;
}

/**
 * Per-rack, per-voice trim, relative to the catalogue median.
 *
 * The twin of `DRUM_SAMPLE_LEVEL` for the sampled racks — see `SAMPLE_RACKS` in
 * `render/drum-banks.ts` — and it differs from its twin in two ways, both
 * forced by what a rack is.
 *
 * ## Why a rack cannot be left unmeasured
 *
 * An unlisted machine gets ×1 and sounds roughly right, because
 * `tidal-drum-machines` normalises every sample to full scale: the 13 dB the
 * measured banks span is the difference between a short kick and a long one at
 * the same peak, which is a real spread and a survivable one. **A bare sample
 * library is not normalised at all.** The Versilian percussion measured here
 * runs from −17.0 LUFS on the darbuka's doum to −39.0 on the tumba's open tone,
 * with 19 dB of that inside the darbuka alone — one instrument, one session, one
 * afternoon — and the bottom of the range sits 20 dB under the drum pack. A rack
 * at unity is not a rack that is slightly wrong, it is one whose conga is
 * inaudible under its own frame drum. Which is why `npm run genres`
 * refuses a rack voice with no entry here, where it merely notes an unmeasured
 * machine: the failure is a different size.
 *
 * ## Why one target rather than one per voice
 *
 * `DRUM_SAMPLE_LEVEL` pulls each machine's voice to the median of *that voice
 * across banks*, so that `DEFAULT_DRUM_MIX` — an engineer's balance, settled by
 * ear — is not overwritten by a measurement. A rack has no other rack to be
 * compared against, and the tempting substitute is the median of the machine
 * voice it stands in for. That is wrong, and quietly: those medians say a
 * machine tom is 6.3 dB over a machine's spare percussion, which is a fact about
 * how Roland recorded toms in 1983 and not about a hand drum. Inheriting it
 * would import a rhythm box's mastering into an instrument that has nothing to
 * do with one, and would do it *under* `DEFAULT_DRUM_MIX`'s own 4 dB between
 * `lp` and `hp`, doubling a gap somebody chose.
 *
 * So every rack voice is pulled to the same place — **−18.8 LUFS, the catalogue
 * median `SOUNDFONT_LEVEL` already centres on** — and the balance between them
 * is left entirely to `DEFAULT_DRUM_MIX`, which is the table that claims it.
 * That target is not a third convention arriving: measured on the same meter,
 * the drum pack's own per-voice medians land at −17.3 (`bd`), −17.8 (`sd`),
 * −18.5 (`cb`), −17.8 (`sh`), −16.7 (`tb`), so a rack normalised to −18.8
 * arrives beside the kit rather than in front of it.
 *
 * ## How the numbers were made
 *
 * The same way as everything else here — ITU-R BS.1770 K-weighting, 400 ms
 * window, 100 ms hop, maximum momentary — with one difference worth recording:
 * this pass was run on the decoded samples directly rather than through
 * superdough, since the drum path emits no envelope and plays each sample at
 * rate 1, so there is nothing between the file and the meter. It was checked
 * against the numbers already in this file before being trusted. Reading the
 * twenty measured banks the same way reproduces them: kick spread 13.0 dB
 * against the 13.2 recorded above, snare 17.2 against 17.3, the `RolandTR808`
 * kick 9.0 dB under the median kick — the ×2.8 that the note above says wanted
 * capping — and the `AkaiMPC60` snare 10.1 dB over, the ×0.31 in the table.
 *
 * Every trim below was then checked against the same full-scale cap the machines
 * get, on the level the sample reaches after `DEFAULT_DRUM_MIX` and the drum
 * bus. None of them binds; the closest is the darbuka's tek at less than half.
 */
export const RACK_SAMPLE_LEVEL: Record<string, Partial<Record<DrumVoice, number>>> = {
  // The doum is the only sample in any of these racks that was already loud
  // enough to need trimming down, which is the whole story of a goblet drum:
  // −17.0 LUFS on the palm stroke against −36.3 on the finger stroke a beat
  // later. 19 dB of it is the player, and none of it survives to the fader.
  darbuka: { lp: 0.81, mp: 7.53, hp: 3.57, perc: 2.98, tb: 4.41 },
  congas: { lp: 10.27, mp: 4.53, hp: 4.32, perc: 2.95, cb: 1.85, sh: 7.43, tb: 4.41 },
  // The one library here recorded with a mastering engineer in the room: every
  // stroke peak-normalised to 0.989, and 3.7 dB between the loudest and the
  // quietest of the three rather than 22.
  mridangam: { lp: 1.06, mp: 1.56, hp: 1.63 },
};

/**
 * The trim for one drum sample.
 *
 * Keyed by the voice the bank actually plays, which is what `resolveVoice`
 * returns and not always what the pattern asked for — the trim belongs to the
 * sample that sounds. The mix fader stays keyed to the requested voice, because
 * a tom substituted for another tom is still mixed as the tom it was written as.
 *
 * A rack answers first, for exactly the voices it carries, which is the same
 * order `resolveDrumSample` picks the sample in — so the trim and the sample it
 * belongs to cannot come from different objects. `rackFor` rather than
 * `readBankName` for exactly that reason: a hand stroke on a bank that names no
 * rack is played from `DEFAULT_HAND_RACK`, and the darbuka's tek needs ×7.53 to
 * reach the catalogue median, so a trim read off the bank name alone would put
 * the drum this player is visibly striking 17 dB under the kit.
 */
export function levelOfDrum(bank: string, voice: DrumVoice): number {
  const { machine } = readBankName(bank);
  const rack = rackFor(bank, voice);
  const held = rack ? RACK_SAMPLE_LEVEL[rack]?.[voice] : undefined;
  return held ?? DRUM_SAMPLE_LEVEL[machine]?.[voice] ?? 1;
}
