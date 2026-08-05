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
 * The second half of the file is about the percussion that is *not* a machine —
 * a darbuka, a rack of congas, a mridangam — which turns out not to be a bank at
 * all and is a parallel concept rather than more rows here. See `SAMPLE_RACKS`.
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
 *    stage a song of woodblocks. Two objects can now play at once — see
 *    `SAMPLE_RACKS` below — so the feature it was waiting on has arrived, and it
 *    still stays out, for a smaller reason: a rack entry names a *bare* sample,
 *    and the 727's are prefixed like every other machine's. Admitting it means
 *    letting a rack carry a `.bank()` of its own, and the payoff for that work
 *    is two samples that would have to serve as three hand-drum strokes — which
 *    is the collapse the whole `lp`/`mp`/`hp` split exists to undo.
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
 * # The percussion that is not a drum machine
 *
 * Two sample libraries have been loaded on every page for some time and no
 * genre could name either: the Versilian library's auxiliary rack — darbuka,
 * frame drum, congas, bongos, cowbell, cabasa, tambourine — and thirteen
 * mridangam strokes played by a Carnatic drummer. See `VCSL_SAMPLES_URL` and
 * `MRIDANGAM_SAMPLES_URL` in `render/strudel.ts`. Every genre that wants a hand
 * drum has therefore been getting a drum machine's floor tom, its spare
 * percussion sample and its cross-stick standing in for a doum, a tek and a ka,
 * which is the substitution `FALLBACK` was written to make bearable and never
 * claimed was good.
 *
 * ## Is a bare-named sample set a bank?
 *
 * No, and the four reasons are worth stating because the cheap fix — another
 * row in `BANK_VOICES` — is wrong in all four.
 *
 * **A bank name is an address, and a rack has no such address.** `.bank('X')`
 * is implemented by prefixing: `s('bd').bank('LinnDrum')` looks up
 * `linndrum_bd`, so a machine's bank name and its voice names *are* its sample
 * names. Versilian's are bare — `darbuka`, `conga`, `tambourine` — and were
 * built that way deliberately, which is the one line of `VCSL_SAMPLES_URL`'s
 * comment that turns out to matter most.
 *
 * **A folder there is an instrument, not a voice.** `darbuka` is twenty
 * recordings: five strokes at two velocities with two round-robins each. `conga`
 * is thirty-four, across three drums. So the thing a voice maps to is a name
 * *and an index*, and `BANK_VOICES` — a bank to the list of voices it has — has
 * nowhere to put the index. That is a shape mismatch rather than a missing row.
 *
 * **It fails the membership rule, permanently.** A bank is in the table above if
 * it has a kick, a snare and both hi-hats, and those four are exactly the four
 * with no fallbacks. A rack of hand percussion has none of them and never will;
 * admitting one would mean inventing fallbacks for the four voices the table
 * explicitly refuses to invent fallbacks for, because inventing them is how a
 * pattern ends up silent.
 *
 * **And a bank is exclusive where a rack is additive.** Naming a bank stages one
 * object and the drummer plays it. A darbuka is not what the drummer switched
 * to, it is what the person sitting next to them is playing, and a darbuka over
 * a TR-808 is a real record rather than a compromise. The `RolandTR727` note
 * above is the same observation arriving from the other direction: a box that is
 * voice-for-voice a rack, kept out of a table of machines because the table had
 * no way to say *beside*.
 *
 * So a rack is a parallel concept, and it **rides on a machine rather than
 * replacing it**. `DrumTrack.bank` holds either a machine name or
 * `Machine+rack` — `RolandTR808+darbuka` — and everything the rack does not
 * carry is still the machine's. There is no rack-only form on purpose: a rack
 * with no kick under it is not an arrangement, and the day a genre wants one is
 * the day somebody registers Versilian's sampled acoustic kit (`bassdrum1`,
 * `snare_modern`, `hihat`, `tom_stick`), which has a kick, a snare and both hat
 * articulations and is therefore a bank in everything but its addressing.
 *
 * ## What the rack changes, and what it must not
 *
 * The sound, and the person making it. A rack claims the auxiliary voices — the
 * three hand-drum strokes, the spare percussion, the cowbell, the shaker, the
 * tambourine — and never `bd`, `sd`, `hh`, `oh`, the toms or the cymbals, which
 * stay the machine's. Levels are pulled to the same catalogue median so that
 * turning a rack on moves the timbre and leaves `DEFAULT_DRUM_MIX` in charge of
 * the balance; see `RACK_SAMPLE_LEVEL` in `render/source-levels.ts`, which also
 * says why a rack cannot be left unmeasured the way an unlisted machine can.
 *
 * **The person is the half that is not optional**, and it follows from the
 * paragraph above rather than being a second feature. The whole argument for a
 * rack being additive is that a darbuka is *what the person sitting next to the
 * drummer is playing*; a stage that heard the argument and staged one drummer
 * anyway would have them reaching past their own floor tom for a bongo, which is
 * where this started. So `rackVoices` hands the contents of a rack to
 * `drumStations` in `concert/instruments.ts`, and every piece on it is that
 * second player's: the riq is theirs rather than the tambourine on the hi-hat
 * rod, the cabasa is theirs rather than the drummer's shaker. Nothing here
 * decides *whether* there is a person, which stays `DrumSource`'s and is the
 * distinction that keeps a bank name from staging a band — a rack riding on a
 * `programmed` part is hand percussion loaded into a box, and stages nobody.
 *
 * MIDI is untouched by all of this. `render/midi.ts` writes GM channel 10,
 * where all eighteen voices exist by definition, so as a matter of *sound* this
 * is an audition-quality change and nothing else — the same standing
 * `BANK_VOICES` has.
 */
export type RackSample = readonly [sample: string, n: number];

/**
 * Which recording each rack plays for each voice.
 *
 * The index is not a detail. Playing a folder without one gets sample 0, which
 * across these libraries is reliably the quietest take of the first
 * articulation — a finger tap where the part wanted a slap. So every entry below
 * was chosen by measuring the candidates, and the numbers quoted are maximum
 * momentary loudness on the meter `render/source-levels.ts` describes, plus the
 * share of spectral energy under 250 Hz and the time to fall 20 dB from the
 * peak. Those last two are the ladder: `DrumVoice` says of `lp`/`mp`/`hp` that
 * *the ladder is brightness as much as pitch, and the two orderings agree*, and
 * a stroke is picked here when it agrees with its neighbours in both.
 */
export const SAMPLE_RACKS: Record<string, Partial<Record<DrumVoice, RackSample>>> = {
  /**
   * The takht's percussion: a goblet drum, a frame drum and a riq.
   *
   * Versilian records the darbuka as five strokes, and the three that matter
   * separate cleanly — low-band share 99.5%, 79%, 4%, ring 380 ms, 150 ms,
   * 80 ms. That is a doum, a tek and a ka in the order a player counts them:
   * a palm in the middle of the head, a ringing finger stroke at the edge, and
   * a pinched crack with no body left in it at all.
   *
   * The one non-monotone number is the spectral centroid, which puts the ka
   * (1.6 kHz) just under the tek (1.9 kHz) because the ka is a narrow ring on
   * one partial while the tek spreads across the mids. Low-band share is the
   * honest reading of *which stroke has the drum in it*, and it is the one that
   * runs the right way.
   *
   * `tb` is the riq — the tambourine at the centre of an Arabic takht, which
   * `DrumVoice` names as one of the parts that wanted this voice and could not
   * have it. `perc` is the bendir, the big frame drum, on its open stroke.
   */
  darbuka: {
    lp: ['darbuka', 2],
    mp: ['darbuka', 14],
    hp: ['darbuka', 6],
    perc: ['framedrum', 7],
    tb: ['tambourine', 1],
  },
  /**
   * The Latin rack, which is one player and several drums.
   *
   * Here the ladder really is pitch, and it is the player's own layout rather
   * than three strokes on one head: measured fundamentals of 138, 164 and
   * 214 Hz for the tumba, the conga and the quinto, all on the open tone, all
   * one articulation so the three sound like one pair of hands.
   *
   * Named residual: Versilian's conga set has no slap. It records an open tone
   * and a muted one, so `hp` is the small drum rather than the hard stroke —
   * which is a real thing a player does and not the thing `hp` most wants to
   * be. A slap sample would be better and there is not one in the library.
   *
   * The rest is what sits on the stand beside them and is the reason funk and
   * reggae want this rack as much as salsa does: `perc` the high bongo on its
   * martillo stroke, `cb` the cowbell struck normally rather than muted, `sh`
   * the cabasa's rub, `tb` the same tambourine the takht uses.
   */
  congas: {
    lp: ['conga', 32],
    mp: ['conga', 8],
    hp: ['conga', 18],
    perc: ['bongo', 4],
    cb: ['cowbell', 6],
    sh: ['cabasa', 4],
    tb: ['tambourine', 1],
  },
  /**
   * One drum, two heads, and the vocabulary `lp`/`mp`/`hp` is an abstraction of.
   *
   * The library is thirteen named Carnatic strokes rather than an instrument to
   * be indexed into, so the mapping is a reading of the tradition and the
   * measurement is a check on it rather than the source of it: `thom` is the
   * left-hand bass stroke (94 Hz, centroid 660), `na` the ringing open stroke on
   * the right head (202 Hz, centroid 1150, and the longest ring of the three at
   * 290 ms), `ta` the sharp rim stroke that stops dead (360 Hz, centroid 2700,
   * 30 ms). Monotone in pitch, in brightness, and inverted in ring, which is
   * what a hand drum sounds like — the open stroke sustains and the two ends of
   * the ladder do not.
   *
   * No `perc`, no `tb`, nothing else: a Carnatic ensemble's other percussion —
   * the ghatam, the kanjira, the morsing — is not in this library, and a rack
   * should hold what is actually on the stand.
   */
  mridangam: {
    lp: ['thom', 0],
    mp: ['na', 1],
    hp: ['ta', 1],
  },
};

/** What separates a machine from a rack in a `DrumTrack.bank`. Reads as "and". */
const RACK_MARK = '+';

/**
 * The machine, and the rack riding on it, in a drum track's bank name.
 *
 * A plain name is a machine with nothing beside it, which is what every song in
 * the catalogue is and what every song written before racks existed will stay.
 */
export function readBankName(bank: string): { machine: string; rack?: string } {
  const at = bank.indexOf(RACK_MARK);
  if (at < 0) return { machine: bank };
  return { machine: bank.slice(0, at), rack: bank.slice(at + 1) };
}

/**
 * What is on the rack's stand — the same table read as a list of objects rather
 * than as a list of sounds.
 *
 * This exists because `SAMPLE_RACKS` turned out to answer two questions, and
 * they must not be allowed to become two tables. `resolveDrumSample` reads it as
 * *which recording sounds*; casting and choreography read it as *which pieces
 * are within one pair of hands' reach*, and the moment those disagree the stage
 * is asserting something the ear can hear is false — a cowbell that sounds from
 * the Latin rack and is struck on the drummer's kit, a riq that sounds from the
 * takht and is played on a tambourine bolted to a hi-hat rod. The whole argument
 * for a rack being additive rather than a replacement is that somebody is
 * sitting there playing it, so the list of what they are playing has to be this
 * one.
 *
 * It is here rather than in `concert/instruments.ts` for that reason and for one
 * more: a rack entry is only ever written next to the measurements that justify
 * it, and a second list of its contents kept a directory away would be correct
 * on the day it was copied and wrong on the day somebody adds a piece.
 *
 * `undefined` rather than an empty set for a plain machine name, and likewise
 * for a rack this file has never heard of. Both mean *there is no second player
 * here*, which is a different statement from a player with an empty stand —
 * `npm run genres` refuses an unknown rack name outright, so the second case is
 * a caller holding a string no era table produced.
 */
export function rackVoices(bank: string): ReadonlySet<DrumVoice> | undefined {
  const { rack } = readBankName(bank);
  const shelf = rack ? SAMPLE_RACKS[rack] : undefined;
  return shelf ? new Set(Object.keys(shelf) as DrumVoice[]) : undefined;
}

/**
 * The voice this kit should actually play for a requested one.
 *
 * Returns the voice unchanged when the kit has it, the best substitute when it
 * does not, and `undefined` only when nothing in the chain exists either — in
 * which case the caller should drop the part rather than emit a sound that is
 * not there.
 *
 * A rack counts as having a voice for both questions: it satisfies the request
 * outright, and it also satisfies a fallback, so a machine with no `perc` will
 * send a cowbell to the rack's conga rather than onward to the hi-hat. Which is
 * why this stays the answer to *what role sounds* and says nothing about which
 * object makes it — that is `resolveDrumSample`, and keeping the two apart is
 * what lets the notation sweep and the mix bench go on asking the old question.
 */
export function resolveVoice(bank: string, voice: DrumVoice): DrumVoice | undefined {
  const { machine, rack } = readBankName(bank);
  const shelf = rack ? SAMPLE_RACKS[rack] : undefined;
  if (shelf?.[voice]) return voice;
  const available = BANK_VOICES[machine];
  // An unknown bank is assumed complete: better to emit what was asked for and
  // let it fail loudly than to silently rewrite a pattern for a bank nobody has
  // measured.
  if (!available) return voice;
  if (available.includes(voice)) return voice;
  for (const alt of FALLBACK[voice] ?? []) {
    if (available.includes(alt) || shelf?.[alt]) return alt;
  }
  return undefined;
}

/** One sounding drum voice, as the renderer has to spell it. */
export interface DrumSample {
  /** The name that goes inside `s()`. */
  sample: string;
  /** `.bank()` — a machine's samples are prefixed. Absent on a rack, whose are bare. */
  bank?: string;
  /** `.n()` — which recording in the folder. Absent on a machine, which has one per voice. */
  n?: number;
  /**
   * The voice that actually sounds, which is not always the one asked for.
   * Keyed on by the level tables; see `levelOfDrum`.
   */
  voice: DrumVoice;
}

/**
 * What to emit for a requested voice: the sample, and how to address it.
 *
 * Built on `resolveVoice` rather than beside it, so there is exactly one place
 * that decides which role sounds and this one only decides who plays it.
 */
export function resolveDrumSample(bank: string, voice: DrumVoice): DrumSample | undefined {
  const sounding = resolveVoice(bank, voice);
  if (!sounding) return undefined;
  const { machine, rack } = readBankName(bank);
  const held = rack ? SAMPLE_RACKS[rack]?.[sounding] : undefined;
  if (held) return { sample: held[0], n: held[1], voice: sounding };
  return { sample: sounding, bank: machine, voice: sounding };
}
