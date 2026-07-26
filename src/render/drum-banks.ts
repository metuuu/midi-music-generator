/**
 * Which drum voices each sample bank actually contains, and what to play
 * instead when it does not.
 *
 * The tidal-drum-machines pack is a set of *machines*, not a set of complete
 * kits, and the old ones are missing most of a modern kit because the hardware
 * was. `RolandCompurhythm78` is a 1978 preset box with six sounds; `KorgMinipops`
 * has four. Emitting a pattern that asks either of them for a tom produces a
 * console error and silence.
 *
 * That was costing more than a warning. Fifteen of the style tables' drum
 * patterns use `rim`, and *every* section-ending fill is written on toms and a
 * crash — so on the two oldest iskelmä banks the fills were not quiet, they were
 * absent. A dance band signposting the next section is one of the genre's
 * loudest gestures and on those banks it simply did not happen.
 *
 * The table below is ground truth, read from the pack itself rather than
 * guessed. An unlisted bank is assumed complete, so adding one to an era table
 * cannot break the render — it just does not get substitutions until someone
 * measures it.
 *
 * Only the Strudel render needs this. MIDI writes to GM channel 10, where every
 * voice in the general MIDI drum map exists by definition.
 */

import type { DrumVoice } from '../core/types.js';

export const BANK_VOICES: Record<string, DrumVoice[]> = {
  AkaiMPC60: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc'],
  AlesisSR16: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'cr', 'rd', 'perc', 'cb', 'sh'],
  EmuSP12: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb'],
  KorgKR55: ['bd', 'sd', 'rim', 'hh', 'oh', 'ht', 'cr', 'perc', 'cb'],
  KorgM1: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb', 'sh'],
  KorgMinipops: ['bd', 'sd', 'hh', 'oh'],
  KorgT3: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'perc', 'sh'],
  LinnDrum: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb', 'sh'],
  OberheimDMX: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'sh'],
  RhythmAce: ['bd', 'sd', 'hh', 'oh', 'lt', 'ht', 'perc'],
  RolandCompurhythm1000: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb'],
  RolandCompurhythm78: ['bd', 'sd', 'hh', 'oh', 'perc', 'cb'],
  RolandD70: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'cr', 'rd', 'perc', 'cb', 'sh'],
  RolandMT32: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb', 'sh'],
  RolandR8: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb', 'sh'],
  RolandTR707: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'cb'],
  RolandTR808: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'perc', 'cb', 'sh'],
  ViscoSpaceDrum: ['bd', 'sd', 'rim', 'hh', 'oh', 'lt', 'mt', 'ht', 'perc', 'cb'],
  YamahaRY30: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb', 'sh'],
};

/**
 * What each voice becomes when the bank has no such sound, in order of
 * preference.
 *
 * Chosen by *role* rather than by timbre, which is how a drummer would do it on
 * a kit missing a piece. A ride and a crash are both the cymbal that is not the
 * hi-hat, so they cover for each other before either falls back to an open hat.
 * The toms cover for each other in pitch order and then land on the snare,
 * because a fill played on a snare is still a fill and a fill played on nothing
 * is a bar of silence where the section change should be.
 *
 * `bd`, `sd`, `hh` and `oh` have no fallbacks and need none: every bank in the
 * pack has all four, and a bank that lacked a kick would not be a drum machine.
 */
const FALLBACK: Partial<Record<DrumVoice, DrumVoice[]>> = {
  rim: ['sd', 'hh'],
  cp: ['sd', 'rim'],
  lt: ['mt', 'ht', 'sd'],
  mt: ['lt', 'ht', 'sd'],
  ht: ['mt', 'lt', 'sd'],
  cr: ['rd', 'oh'],
  rd: ['cr', 'oh', 'hh'],
  perc: ['rim', 'cb', 'hh'],
  cb: ['rim', 'perc', 'hh'],
  sh: ['hh', 'oh'],
};

/**
 * The voice this bank should actually play for a requested one.
 *
 * Returns the voice unchanged when the bank has it, the best substitute when it
 * does not, and `undefined` only when nothing in the chain exists either — in
 * which case the caller should drop the part rather than emit a sound that is
 * not there.
 */
export function resolveVoice(bank: string, voice: DrumVoice): DrumVoice | undefined {
  const available = BANK_VOICES[bank];
  // An unknown bank is assumed complete: better to emit what was asked for and
  // let it fail loudly than to silently rewrite a pattern for a bank nobody has
  // measured.
  if (!available) return voice;
  if (available.includes(voice)) return voice;
  for (const alt of FALLBACK[voice] ?? []) {
    if (available.includes(alt)) return alt;
  }
  return undefined;
}
