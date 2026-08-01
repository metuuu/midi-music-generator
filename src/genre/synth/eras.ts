/**
 * Vintage electronic era profiles, 1972–1990.
 *
 * In every other genre here the era is a change of clothes: a tango is a tango
 * on a bandoneon in 1935 and on a synthesiser in 1985, and the era table says
 * which. In this one the era **is the instrument, and the instrument is the
 * idea**. There is no such thing as a Berlin-school sequence without a step
 * sequencer, no Kraftwerk without a vocoder, and no 1986 without an FM bell —
 * the composers of this repertoire wrote for what had just been invented, and
 * what had just been invented changed roughly every five years. So the three
 * eras below are not three colourings of one music. They are three musics that
 * happen to share a lineage, and the tables are shaped accordingly: the
 * palettes barely overlap, the drum banks do not overlap at all, and the style
 * weights move by a factor of three across them.
 *
 * **`keyChangeChance` is non-zero, which sets this genre against ambient.**
 * Ambient sets it to 0 and argues that a moving tonal centre is the single most
 * anti-ambient device available. This repertoire wants exactly that device: the
 * final statement of the theme lifted a tone, strings and choir on top, is the
 * gesture the film cue and the side-two closer are both built toward. It is
 * strongest where `cinematic` is — but note that the field lives on the era and
 * not on the style, so it cannot be aimed at one style directly. The nearest
 * available lever is to put the biggest number in the era where `cinematic` is
 * most likely to be drawn, which is `polysynth`, and that is what happens below.
 *
 * **The `brass` layer is not vestigial here**, unlike in ambient — but it is not
 * universal either, and the palettes below are read by two styles out of five
 * rather than by all of them. That is worth being exact about, because the
 * claim used to be made without the count and the count was one.
 *
 * A synth-brass stab is a first-class sound of this music rather than an
 * orchestral hangover, and what the layer writes is two gestures: a swell that
 * arrives with a held melody note and leaves with it, and a stab pushed off the
 * barline into a gap in the tune. `cinematic` takes the first — the swell under
 * a long CS-80 line, which is the other half of the lifted final chorus that
 * `keyChangeChance` above is set up for — and `cosmic` takes the second, which
 * is the horn punch behind a disco chorus. Those are the two styles the
 * palettes here are written for.
 *
 * The other three exclude the layer and `src/genre/synth/styles.ts` argues it at
 * each site, but none of them is refusing the *timbre*: `synthBrass` and
 * `synthBrass2` sit in the `melody` palettes below, so `berlin` and `machine`
 * reach a synth-brass lead without a brass layer existing. What they refuse is a
 * separate arranged part punctuating them — `berlin` because its lead's gaps are
 * already full of two sequencers, `machine` and `stalker` because both are
 * `earworm` styles whose sections come back identical and the brass is the one
 * layer written fresh every time.
 */

import type { EraProfile } from '../../style/types.js';

/**
 * MODULAR — 1972–77.
 *
 * One note at a time. The lead is monophonic because every lead was: a Minimoog
 * or an ARP plays the top note and nothing else, so a melody is a single line
 * and a chord is either a string machine or an arpeggio. The other half of the
 * texture is a step sequencer — sixteen knobs, a clock, and a filter opened by
 * hand across ten minutes — which is why this era's music has ostinati where
 * later eras have riffs. Nothing is in tune with itself for very long, nothing
 * is stored in a memory because there are no memories, and every timbral event
 * in the piece is somebody's hand on a cutoff knob.
 *
 * **On the drum banks, which is a deliberate reversal.** Ambient's `tape` era
 * refused the period-correct preset boxes — Minipops, CompuRhythm 78 — on the
 * grounds that they lack voices its styles emit, and at the time that refusal
 * was correct, because a missing voice threw and the pattern stopped. It is the
 * wrong trade here. A four-sound preset box is not an approximation of the 1974
 * sound, it *is* the 1974 sound: a bossa-nova button on an organ console, a
 * kick, a snare and two hats, running under a sequencer for twenty minutes.
 * Excluding it in favour of a complete kit would buy a rim shot at the cost of
 * the era. So this era takes the primitive boxes and leans on `resolveVoice` in
 * `render/drum-banks.ts` to cover what they lack — a rim becomes a snare, a tom
 * becomes a snare, a crash becomes an open hat.
 *
 * The honest half: **that substitution degrades silently.** `KorgMinipops` has
 * four sounds, so a fill written on three toms and a crash arrives as four
 * snare hits and an open hat and nothing anywhere reports that it happened.
 * That is an acceptable price for a bank that is right about the period, but it
 * is a price, and it is stated here rather than discovered later by someone
 * wondering why the toms are missing.
 */
const modular: EraProfile = {
  id: 'modular',
  year: 1974,
  label: '1972–77 modular',
  description:
    'Monophonic leads and step sequencers. Filter sweeps by hand, string machines, phaser, and a preset rhythm box for a drummer.',
  drumBanks: [
    ['KorgMinipops', 4],
    ['RolandCompurhythm78', 3],
    ['RhythmAce', 3],
    ['KorgKR55', 3],
  ],
  /**
   * Mostly a box, and this era's own description has said so all along — *"a
   * preset rhythm box for a drummer"*. All four banks above are preset boxes,
   * and until this field existed the stage put a man on a riser miming one.
   *
   * The kit is here at a real weight rather than as a token. 1974 is not only
   * Tangerine Dream: it is also every prog band who owned a Minimoog and a
   * drummer, and a stage that never once had both would be as narrow as the one
   * that never had the box. `programmed` and `electronic-kit` are absent by
   * year rather than by choice — the gate would strike them anyway, and listing
   * them at zero would only look like an opinion.
   */
  drumSources: [['box', 6], ['kit', 4]],
  /**
   * The sequencer era, and the highest rates in the project.
   *
   * A 1974 synth stage *is* a sequencer running: the whole Berlin-school
   * texture is a bass figure with a second figure phasing against it, and both
   * of them are machines. Better than half the time for the bass, because a
   * player with two hands and one lead to play had no third hand for it.
   */
  sequenced: { bass: 0.55, counter: 0.5 },
  palette: {
    // Every entry is a single-line voice, because every lead in 1974 was. The
    // square and the saw are the two oscillator shapes a Minimoog offers; the
    // fifths lead is the same instrument with a second oscillator tuned a fifth
    // up, which is the cheapest way a monophonic synthesiser ever faked
    // harmony and a signature of the period for exactly that reason.
    melody: [
      ['leadSaw', 5], ['leadSquare', 4], ['leadFifths', 3], ['leadCalliope', 3],
      ['leadBassLead', 2], ['leadChiff', 2], ['leadCharang', 2], ['fxSciFi', 1],
    ],
    // The sequencer line. It is not an answering phrase — it runs continuously
    // underneath, which is what `counterMode: 'ostinato'` exists for — so the
    // instruments here are chosen for a hard front and a short tail. A pad in
    // this slot would blur the sixteenth grid the whole texture depends on.
    counter: [
      ['leadSquare', 4], ['synthBass', 3], ['clavinet', 3], ['leadBassLead', 3],
      ['leadSaw', 2], ['celesta', 2], ['pizzStrings', 2],
    ],
    // Polyphony had to be bought, and there were three ways to buy it: a
    // divide-down string machine, a combo organ, or an electric piano. Nothing
    // in this list is a synthesiser playing a chord, because in 1974 almost
    // nothing was.
    comp: [
      ['synthStrings', 4], ['drawbarOrgan', 3], ['percussiveOrgan', 3],
      ['clavinet', 3], ['epiano1', 2], ['leadSquare', 2], ['reedOrgan', 2],
    ],
    pad: [
      ['synthStrings', 5], ['strings1', 3], ['padWarm', 3], ['padChoir', 2],
      ['synthChoir', 2], ['tremoloStrings', 2], ['fxSoundtrack', 2],
    ],
    bass: [
      ['synthBass', 5], ['synthBass2', 3], ['leadBassLead', 3], ['fingerBass', 2],
    ],
    brass: [['synthBrass', 4], ['brassSection', 2], ['trombone', 1]],
  },
  styleWeights: {
    berlin: 7, cinematic: 4, machine: 3, cosmic: 2, stalker: 4,
  },
  tempoScale: 1,
  // Low but not zero. The lift belongs to the composed side of this repertoire
  // rather than the sequenced side, and this era is mostly the sequenced side.
  keyChangeChance: 0.1,
  density: 0.5,
  // The dotted-eighth delay with the feedback set high enough to hear four or
  // five repeats. On a sequenced sixteenth line that is not an effect, it is a
  // second sequencer — the echoes land between the notes and double the
  // apparent rate of the part, which is how a sixteen-step pattern turns into
  // the shimmering thing this music is remembered for.
  space: { reverbSize: 0.7, delayBeats: 0.75, delayFeedback: 0.62 },
  effects: {
    // A string machine through a phaser. This is the one number that stops the
    // era sounding like the two after it, and it is period fact rather than
    // taste — the phaser pedal and the divide-down string machine arrived
    // within a couple of years of each other and were almost never separated.
    pad: { reverb: 0.6, lowpass: 3200, phaser: 0.65 },
    comp: { reverb: 0.45, lowpass: 3800, phaser: 0.45 },
    // Resonance, everywhere, because a ladder filter near self-oscillation is
    // what a hand on a cutoff knob is *for*. The later eras drop it: a DX7 has
    // no resonant filter at all, having no filter at all.
    //
    // `glide` is the other knob on the same panel. A Minimoog is monophonic and
    // has a portamento control next to the pitch wheel, and the reason it is
    // set modestly here rather than at the polysynth's depth is that this era's
    // lead is competing with a sixteenth-note sequence: a long slide smears
    // against a hard grid, which is precisely why the next era could afford
    // more of it and this one could not.
    melody: { reverb: 0.5, delay: 0.35, lowpass: 5000, resonance: 0.35, phaser: 0.2, glide: 1.5 },
    counter: { reverb: 0.55, delay: 0.45, lowpass: 4200, resonance: 0.3, phaser: 0.3 },
    bass: { reverb: 0.06, lowpass: 800, resonance: 0.25 },
    // The rhythm box is a piece of furniture in the room, not a kit in a
    // booth. Dark and modest, sitting under the sequence.
    drums: { reverb: 0.3, lowpass: 2600 },
    brass: { reverb: 0.4, lowpass: 4000, phaser: 0.25 },
  },
};

/**
 * POLYSYNTH — 1978–83.
 *
 * The five years in which the instrument stopped being a laboratory and became
 * a keyboard. A Prophet-5 holds five notes and remembers what they sounded
 * like; a CS-80 has weighted keys and per-key aftertouch, so it is the first
 * synthesiser anybody could play *expressively* rather than merely operate; a
 * Jupiter-8 does both loudly. The consequence for the music is direct and it is
 * the reason this era carries the most weight in the table: for the first time
 * the composer can write a chord, a swelling line and a countermelody at once,
 * and the results are the film scores, the four-on-the-floor sequencer records
 * and the man-machine pop of this repertoire's best-known decade.
 *
 * The vocoder belongs to this era too, which is why `machine` peaks here and
 * why the `vocal` layer first gets effects of its own.
 *
 * The drum machines are the first that program rather than preset: an 808 and a
 * LinnDrum are both boxes you write a bar into, which is a different creative
 * act from pressing "bossa nova". Two coverage notes, measured rather than
 * assumed: **`RolandTR808` has no ride** — it substitutes a crash, then an open
 * hat — and `RolandCompurhythm1000` is the most complete box of the four.
 */
const polysynth: EraProfile = {
  id: 'polysynth',
  year: 1981,
  label: '1978–83 polysynth',
  description:
    'Prophet, CS-80 and Jupiter. Real polyphony, memories, brass swells, vocoders, and drum machines you program yourself.',
  drumBanks: [
    ['RolandTR808', 4],
    ['LinnDrum', 4],
    ['OberheimDMX', 3],
    ['RolandCompurhythm1000', 2],
  ],
  /**
   * The decade the machine won, and the one year in this genre where all four
   * sources are legal at once — the Simmons kit arrives in 1981 and the LinnDrum
   * in 1982, so this era gets the argument the other two are spared.
   *
   * `programmed` leads because these four banks are programmable machines and
   * this is the music that made them famous. The electronic kit is next, because
   * a drummer behind hexagonal pads is the single most 1981 object available and
   * it keeps a person on the riser. The acoustic kit survives at the bottom: it
   * is what a band who could not afford a Linn still had.
   */
  drumSources: [['programmed', 6], ['electronic-kit', 3], ['kit', 2], ['box', 1]],
  /**
   * Still mostly sequenced, and slightly less so than 1974 — the polysynth is
   * the decade a keyboard player got something worth playing by hand, and some
   * of what used to be patched became a part somebody performed.
   */
  sequenced: { bass: 0.5, counter: 0.4 },
  palette: {
    // `leadVoice` is here at a high weight and it is not a compromise. GM 85 is
    // the closest fixed patch to the breathy, brass-and-choir CS-80 lead that
    // carried most of the era's melodies, and that instrument really was
    // somewhere between a voice and a horn.
    melody: [
      ['leadSaw', 4], ['leadVoice', 4], ['synthBrass', 3], ['leadCharang', 3],
      ['leadSquare', 3], ['leadCalliope', 2], ['electricViolin', 2],
      ['leadFifths', 2], ['overdriveGuitar', 1],
    ],
    counter: [
      ['leadSquare', 3], ['leadSaw', 3], ['electricVibes', 3], ['synthBass', 2],
      ['epiano2', 2], ['leadCharang', 2], ['celesta', 2], ['glockenspiel', 2],
    ],
    comp: [
      ['padPoly', 4], ['epiano1', 3], ['synthStrings', 3], ['clavinet', 2],
      ['percussiveOrgan', 2], ['drawbarOrgan', 2], ['epiano2', 2], ['harp', 2],
    ],
    pad: [
      ['synthStrings', 4], ['padPoly', 4], ['padWarm', 4], ['synthStrings2', 3],
      ['padChoir', 3], ['synthChoir', 3], ['strings1', 2], ['padHalo', 2],
    ],
    bass: [
      ['synthBass', 5], ['synthBass2', 4], ['fingerBass', 2], ['slapBass', 2],
      ['fretlessBass', 2], ['electricCello', 1],
    ],
    // The synth-brass swell, which in this era is a compositional device and
    // not a horn substitute. It is what the last eight bars are made of.
    brass: [['synthBrass', 5], ['synthBrass2', 4], ['brassSection', 2], ['padHalo', 1]],
  },
  styleWeights: {
    berlin: 4, cinematic: 7, machine: 6, cosmic: 6, stalker: 5,
  },
  tempoScale: 1,
  // The highest of the three, and the reason is `cinematic`: this is the era
  // where the style is most likely to be drawn, and the tone-up final statement
  // is that style's defining structural gesture.
  keyChangeChance: 0.3,
  density: 0.58,
  space: { reverbSize: 0.8, delayBeats: 0.75, delayFeedback: 0.5 },
  effects: {
    // No phaser and no crush. This era sits between the two effects that define
    // its neighbours, which is not an absence of character — a Jupiter chorus
    // is wide and clean, and the wideness is in the instrument rather than in a
    // pedal in front of it.
    // The swell on the pad is smaller than the lead's and is there for the
    // held-chord half of this repertoire: a string patch that arrives at its
    // brightness rather than starting there is the difference between a pad
    // entering and a pad being switched on.
    pad: { reverb: 0.75, lowpass: 6000, swell: 1.2 },
    comp: { reverb: 0.55, lowpass: 6500 },
    /**
     * The CS-80 line, in the two numbers the instrument is actually remembered
     * for. `glide` is the ribbon controller under the keyboard — the slide onto
     * the note that is the single most identifiable gesture in this era's film
     * writing — and `swell` is per-key aftertouch, which no other synthesiser
     * of the decade had and which is why leaning on a held note here opens it
     * up instead of merely sustaining it.
     *
     * Both land on the whole era rather than on `cinematic`, because effects
     * live on eras and styles have no `effects` of their own. That is the same
     * limitation `keyChangeChance` runs into above and it is handled the same
     * way — put the number where the style is most likely to be drawn. The
     * spill is not damaging: `berlin`'s lead is a polysynth in 1981 too, and a
     * two-and-a-half semitone slide at eighty milliseconds is a slur rather
     * than a siren.
     */
    melody: { reverb: 0.6, delay: 0.3, lowpass: 8000, resonance: 0.22, glide: 2.5, swell: 2 },
    counter: { reverb: 0.65, delay: 0.4, lowpass: 7000, resonance: 0.2 },
    bass: { reverb: 0.08, lowpass: 1000, resonance: 0.18 },
    drums: { reverb: 0.35, lowpass: 3600 },
    brass: { reverb: 0.5, lowpass: 6500 },
    // The vocoder is a mid-range object. Rolling the top off it is not a mix
    // choice — a vocoder bank has a highest band and there is nothing above it.
    vocal: { reverb: 0.45, lowpass: 6000 },
  },
};

/**
 * DIGITAL — 1984–90.
 *
 * The analogue filter disappears and takes the genre's oldest gesture with it.
 * A DX7 makes its brightness by frequency modulation rather than by subtracting
 * from a saw, so there is no cutoff knob to open across sixteen bars and the
 * Berlin-school sweep simply stops being available — which is most of why
 * `berlin` is weighted lowest here and `machine` and `stalker` highest. What
 * arrives instead is the metallic bell, the glassy electric piano, the sampled
 * orchestra hit, and a snare that is mostly reverb with the tail cut off.
 *
 * The Fairlight and its cheaper descendants are why `crush` appears in this
 * era's effects. An eight-bit sample of a choir is not a choir with a defect:
 * the aliasing is the recognisable sound, and it is the one thing about the
 * period that cannot be reached by choosing a patch.
 *
 * **A coverage note that is a live gap rather than a design choice.**
 * `RolandTR909` is in the sample pack and carries `bd sd rim hh oh cp cr rd`
 * and three toms, but it has no `perc`, `cb` or `sh`, and at the time of
 * writing it has **no row in `BANK_VOICES`**. `resolveVoice` treats an unlisted
 * bank as complete and passes the request through unchanged, so a pattern
 * asking a 909 for a shaker gets a console error and silence rather than a
 * substitution. The other three banks here are all listed and all complete
 * enough that nothing they are asked for goes missing.
 */
const digital: EraProfile = {
  id: 'digital',
  year: 1987,
  label: '1984–90 digital',
  description:
    'DX7, D-50 and Fairlight. FM bells, glassy electric pianos, sampled choirs, gated snares and eight-bit grit.',
  drumBanks: [
    ['RolandTR909', 4],
    ['RolandR8', 3],
    ['AlesisSR16', 3],
    ['YamahaRY30', 2],
  ],
  /**
   * By 1987 the argument is over. The sequencer runs the number and the drums
   * come out of the same box as everything else, so `programmed` is most of the
   * table and the preset box is gone entirely — an instrument you program
   * through a menu has no *Bossa Nova* button.
   *
   * The electronic kit holds on because the pads did, well past the point the
   * sound had stopped being new; the acoustic kit is the residue, and at 1 in 12
   * it is the surprise it should be rather than a thing that keeps happening.
   */
  drumSources: [['programmed', 8], ['electronic-kit', 3], ['kit', 1]],
  /** By 1987 the sequencer is a menu on the same box as everything else. */
  sequenced: { bass: 0.45, counter: 0.35 },
  palette: {
    // Bells and buzz, which is what FM is good at and what it was therefore
    // used for. The saw survives at a low weight because analogue instruments
    // did not stop existing in 1984, they only stopped being bought.
    melody: [
      ['leadCharang', 4], ['fxCrystal', 3], ['leadChiff', 3], ['synthBrass2', 3],
      ['electricVibes', 3], ['tubularBells', 2], ['leadVoice', 2], ['leadSaw', 2],
      ['distortionGuitar', 1],
    ],
    counter: [
      ['fxCrystal', 4], ['electricVibes', 3], ['tubularBells', 3], ['celesta', 2],
      ['glockenspiel', 2], ['marimba', 2], ['kalimba', 2], ['harp', 2],
    ],
    // `epiano2` first, by a clear margin. The FM electric piano is the single
    // most identifiable keyboard sound of the second half of the eighties and
    // it turns up under everything from a film cue to a chart ballad.
    comp: [
      ['epiano2', 4], ['padMetallic', 3], ['fxCrystal', 2], ['epiano1', 2],
      ['harp', 2], ['clavinet', 2], ['percussiveOrgan', 2], ['padPoly', 2],
    ],
    pad: [
      ['padMetallic', 4], ['padHalo', 3], ['synthChoir', 3], ['padSweep', 3],
      ['fxAtmosphere', 3], ['crushedPad', 3], ['choirAahs', 2], ['padBowed', 2],
    ],
    bass: [
      ['synthBass2', 5], ['synthBass', 4], ['slapBass', 3], ['fretlessBass', 2],
      ['pickBass', 2], ['electricCello', 1],
    ],
    brass: [['synthBrass2', 5], ['synthBrass', 3], ['brassSection', 3], ['padHalo', 1]],
  },
  styleWeights: {
    berlin: 2, cinematic: 5, machine: 5, cosmic: 4, stalker: 6,
  },
  tempoScale: 1,
  keyChangeChance: 0.2,
  density: 0.62,
  // The big bright room of the decade, on a shorter delay than the two eras
  // before it. Once the reverb unit is long enough to fill the gaps, nobody
  // needs the echo to do it.
  space: { reverbSize: 0.92, delayBeats: 0.5, delayFeedback: 0.4 },
  effects: {
    // Twelve bits, not eight. A Fairlight page-R sample and a D-50 partial are
    // grainy rather than destroyed, and the number that reads as "sampler" on a
    // sustained pad reads as "broken" on a lead — so the crush stays on the
    // layers that are actually made of samples.
    pad: { reverb: 0.9, lowpass: 11000, crush: 12 },
    counter: { reverb: 0.75, delay: 0.33, lowpass: 11000, crush: 12 },
    comp: { reverb: 0.6, lowpass: 11000 },
    // Brighter than anything in the other two eras and deliberately unfiltered.
    // The whole selling point of FM in 1984 was a top end that subtractive
    // synthesis could not reach, and darkening it here would be undoing the era.
    melody: { reverb: 0.65, delay: 0.28, lowpass: 12000 },
    bass: { reverb: 0.06, lowpass: 1400 },
    // The gated snare, expressed as the only two numbers available: a very big
    // send and a hard lowpass on top of it. The gate itself lives in the
    // envelope rather than here, but this is the half that makes it enormous.
    drums: { reverb: 0.7, lowpass: 6000 },
    brass: { reverb: 0.55, lowpass: 10000 },
    vocal: { reverb: 0.5, lowpass: 8000 },
  },
};

export const ERAS: Record<string, EraProfile> = { modular, polysynth, digital };
