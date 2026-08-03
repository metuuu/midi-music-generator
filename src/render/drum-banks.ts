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
 *
 * ## Which of the pack's 71 machines are in here, and which are not
 *
 * The table held 20 for as long as four genres needed four decades of European
 * dance music. Fifteen more genres are being written against it, and a genre
 * author choosing a machine should be choosing from what the pack has rather
 * than from what somebody happened to measure — an unlisted bank is the failure
 * mode described above, and `npm run genres` refusing it is the only thing
 * standing between an era table and a silent console error.
 *
 * So the line is now a rule instead of an accident: **a bank is in this table if
 * it has a kick, a snare and both hi-hats.** Those four are what every pattern
 * in every style table is written on, and they are the four with no fallbacks —
 * see below. Under that rule 55 of the 71 banks are here and 16 are not:
 *
 *  - `RolandTR727` is the interesting one. It carries `perc` and `sh` and
 *    nothing else, because it is not a drum machine: it is the Latin percussion
 *    companion the 808 was sold beside, a box of congas, bongos, agogos and
 *    whistles meant to be *layered over* a kit rather than to be one. Naming it
 *    as an era's bank would resolve every kick, snare and hat to `undefined` and
 *    stage a song of woodblocks. It stays out until something in this project
 *    can play two banks at once, which is the feature it is actually waiting on.
 *  - `AJKPercusyn`, `EmuModular`, `SergeModular`, `KorgPoly800`, `RolandSH09`,
 *    `RolandMC202`, `RhodesPolaris`, `MoogConcertMateMG1`, `RolandDDR30` and
 *    `SimmonsSDS400` are fragments — one to four samples lifted off a synth or a
 *    drum brain, several with no snare and two with no kick at all.
 *  - Five are nearly complete kits missing exactly one hat, and are the ones
 *    worth revisiting if anybody ever wants them: `BossDR55`, `CasioRZ1` and
 *    `CasioVL1` have no open hat, `RolandS50` and `YamahaTG33` no closed one.
 *    Admitting them means giving `hh` and `oh` fallbacks onto each other, which
 *    is a real substitution a drummer makes and a real change to the paragraph
 *    below, so it is left for whoever actually wants a TG33.
 *
 * Two sample names in the pack are deliberately not `DrumVoice`s. `misc`
 * (20 banks) and `fx` (5) are junk drawers — a cuíca on one machine, a
 * hand-clap-with-reverb on the next, a laser on the third — so there is no role
 * to give them, no GM key to write them to and no honest fallback. A part
 * written on them would mean something different on every bank it landed on.
 */

import type { DrumVoice } from '../core/types.js';

export const BANK_VOICES: Record<string, DrumVoice[]> = {
  /**
   * The Linn family, which is four entries and one instrument.
   *
   * `LinnLM1` (1979) is the first drum machine with real drums in it and the
   * one that ends the era of the preset box; `LinnLM2` (1982) is the LinnDrum
   * proper; `Linn9000` (1984) adds the sequencer; `AkaiLinn` is Roger Linn's
   * work after Akai bought the wreckage, and is the MPC's ancestor. Between
   * them they are the sound of most of what was on the radio between 1982 and
   * 1986 — which is to say they are what a pop or an RnB era wants before it
   * wants anything else. All four carry a tambourine; the LM1 has no crash,
   * because in 1979 a cymbal was too many kilobytes.
   */
  AkaiLinn: ['bd', 'sd', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'cb', 'sh', 'tb'],
  AkaiMPC60: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc'],
  AkaiXR10: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb', 'sh', 'tb'],
  AlesisHR16: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'ht', 'perc', 'sh'],
  AlesisSR16: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'cr', 'rd', 'perc', 'cb', 'sh', 'tb'],
  BossDR110: ['bd', 'sd', 'hh', 'oh', 'cp', 'cr', 'rd'],
  BossDR220: ['bd', 'sd', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc'],
  BossDR550: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb', 'sh', 'tb'],
  CasioSK1: ['bd', 'sd', 'hh', 'oh', 'mt', 'ht'],
  DoepferMS404: ['bd', 'sd', 'hh', 'oh', 'lt'],
  EmuDrumulator: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'perc', 'cb'],
  EmuSP12: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb'],
  KorgDDM110: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'ht', 'cr'],
  KorgKPR77: ['bd', 'sd', 'hh', 'oh', 'cp'],
  KorgKR55: ['bd', 'sd', 'rim', 'hh', 'oh', 'ht', 'cr', 'perc', 'cb'],
  KorgKRZ: ['bd', 'sd', 'hh', 'oh', 'lt', 'ht', 'cr', 'rd'],
  KorgM1: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb', 'sh', 'tb'],
  KorgMinipops: ['bd', 'sd', 'hh', 'oh'],
  KorgT3: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'perc', 'sh'],
  Linn9000: ['bd', 'sd', 'rim', 'hh', 'oh', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb', 'tb'],
  LinnDrum: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb', 'sh', 'tb'],
  LinnLM1: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'ht', 'perc', 'cb', 'sh', 'tb'],
  LinnLM2: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'cb', 'sh', 'tb'],
  MFB512: ['bd', 'sd', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr'],
  /**
   * Seven samples and no cymbals at all, which is not a poor kit — it is a
   * sampler. The MPC is where hiphop and jungle were made, and what it played
   * was whatever had been chopped into it that afternoon; a fill on this bank
   * lands on the shaker and the spare percussion, which is closer to the
   * genre than a tom roll would have been.
   */
  MPC1000: ['bd', 'sd', 'hh', 'oh', 'cp', 'perc', 'sh'],
  OberheimDMX: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'sh', 'tb'],
  RhythmAce: ['bd', 'sd', 'hh', 'oh', 'lt', 'ht', 'perc'],
  RolandCompurhythm1000: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb'],
  RolandCompurhythm78: ['bd', 'sd', 'hh', 'oh', 'perc', 'cb', 'tb'],
  RolandCompurhythm8000: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'perc', 'cb'],
  RolandD110: ['bd', 'sd', 'rim', 'hh', 'oh', 'lt', 'cr', 'rd', 'perc', 'cb', 'sh', 'tb'],
  RolandD70: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'cr', 'rd', 'perc', 'cb', 'sh'],
  RolandJD990: ['bd', 'sd', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb', 'tb'],
  /** The 90s dance box: every 808 and 909 sound in one machine, plus a tambourine. */
  RolandMC303: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'rd', 'perc', 'cb', 'sh', 'tb'],
  RolandMT32: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb', 'sh', 'tb'],
  RolandR8: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb', 'sh', 'tb'],
  RolandSystem100: ['bd', 'sd', 'hh', 'oh', 'perc'],
  RolandTR505: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb'],
  RolandTR606: ['bd', 'sd', 'hh', 'oh', 'lt', 'ht', 'cr'],
  RolandTR626: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb', 'sh', 'tb'],
  RolandTR707: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'cb', 'tb'],
  RolandTR808: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'perc', 'cb', 'sh'],
  // Read from the pack. The 909 is the first machine here with a ride of its
  // own — it is the one Roland put a real cymbal sample in — and the last with
  // no cowbell, no shaker and no spare percussion, because by 1983 those had
  // stopped being what a rhythm box was for.
  RolandTR909: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd'],
  SakataDPM48: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'sh'],
  SequentialCircuitsDrumtracks: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'ht', 'cr', 'rd', 'cb', 'sh', 'tb'],
  SequentialCircuitsTom: ['bd', 'sd', 'hh', 'oh', 'cp', 'ht', 'cr'],
  /**
   * Hexagonal pads, no cymbals, and the one bank on this list that is a *kit*
   * rather than a box — a drummer hit these. It is the sound of 1982 to 1986
   * rock and synthpop, and it is the obvious partner for `electronic-kit`:
   * three toms, a gated snare and nothing overhead, because the cymbals on an
   * SDS-V stage were still made of bronze.
   */
  SimmonsSDS5: ['bd', 'sd', 'rim', 'hh', 'oh', 'lt', 'mt', 'ht'],
  SoundmastersR88: ['bd', 'sd', 'hh', 'oh', 'cr'],
  UnivoxMicroRhythmer12: ['bd', 'sd', 'hh', 'oh'],
  ViscoSpaceDrum: ['bd', 'sd', 'rim', 'hh', 'oh', 'lt', 'mt', 'ht', 'perc', 'cb'],
  XdrumLM8953: ['bd', 'sd', 'rim', 'hh', 'oh', 'lt', 'mt', 'ht', 'cr', 'rd', 'tb'],
  YamahaRM50: ['bd', 'sd', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb', 'sh', 'tb'],
  YamahaRX21: ['bd', 'sd', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr'],
  YamahaRX5: ['bd', 'sd', 'rim', 'hh', 'oh', 'lt', 'cb', 'sh', 'tb'],
  YamahaRY30: ['bd', 'sd', 'rim', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'cr', 'rd', 'perc', 'cb', 'sh', 'tb'],
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
 * table has all four, which is now the rule for getting into it — see above.
 *
 * ## The hand drum
 *
 * `lp`, `mp` and `hp` are the one place where the chains had to be chosen
 * against each other rather than one at a time, and the trap is obvious once
 * seen: send all three to `perc` and a bank that has a `perc` plays a doum, a
 * tek and a ka as the same sample three times. That is not a substitution, it
 * is the collapse these voices exist to undo, arriving one layer lower down.
 *
 * So they are aimed at three *different* surfaces, and the aim is what a
 * drummer with no hand drum would actually do with the part:
 *
 *  - the low stroke is the pulse of the bar, and the pulse played with a stick
 *    is the floor tom — big, open, undamped, and the closest thing a kit has to
 *    a drum struck in the middle with a palm;
 *  - the mid stroke is the ringing edge tone, which is what a bank's spare
 *    percussion sample nearly always is (a conga or a timbale), and then a rack
 *    tom;
 *  - the high stroke is a dry crack, which is a cross-stick — `rim` — long
 *    before it is anything with a skin in it.
 *
 * Three strokes, three surfaces, on any bank with toms and a rim — which is most
 * of the table but not all of it. On a seven-sample sampler like `MPC1000` the
 * low and mid strokes both land on `perc` and the pattern does flatten, and
 * there is no chain that could have avoided it: a substitution is chosen one
 * voice at a time and cannot know what the others took. A bank that thin is a
 * thing for an era table to weigh against the style it is drawing for.
 *
 * Each chain still ends somewhere every bank can reach: the kick for the pulse,
 * the snare for the other two.
 *
 * `tb` goes to the shaker first and the hats after it. A tambourine keeping
 * sixteenths and a shaker keeping sixteenths are the same part; a tambourine on
 * the backbeat becomes a hi-hat on the backbeat, which is where the drummer's
 * hand already is.
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
  tb: ['sh', 'hh', 'oh'],
  lp: ['lt', 'perc', 'mt', 'bd'],
  mp: ['perc', 'mt', 'ht', 'sd'],
  hp: ['rim', 'ht', 'perc', 'sd'],
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
