/**
 * Vintage electronic era profiles, 1972–1990, and the revival that quotes them.
 *
 * In every other genre here the era is a change of clothes: a tango is a tango
 * on a bandoneon in 1935 and on a synthesiser in 1985, and the era table says
 * which. In this one the era **is the instrument, and the instrument is the
 * idea**. There is no such thing as a Berlin-school sequence without a step
 * sequencer, no Kraftwerk without a vocoder, and no 1986 without an FM bell —
 * the composers of this repertoire wrote for what had just been invented, and
 * what had just been invented changed roughly every five years. So the first
 * three eras below are not three colourings of one music. They are three musics
 * that happen to share a lineage, and the tables are shaped accordingly: the
 * palettes barely overlap, the drum banks do not overlap at all, and the style
 * weights move by a factor of three across them.
 *
 * ## The fourth era breaks that sentence, and is here anyway
 *
 * `retrowave` invents no hardware. Its leads are the first three eras emulated
 * in software, its drum machines are literally the same four boxes sampled off
 * the same records, and a table organised around *what had just been invented*
 * has nothing whatever to say about a generation whose entire proposition is
 * that nothing had. Every argument this file makes about palettes that barely
 * overlap fails on it: the palette overlaps almost completely, on purpose,
 * because the overlap is the genre.
 *
 * What is new is **the desk**. These records duck everything under the kick,
 * saturate the bass until the saw is audibly clipping, and sit in a reverb
 * longer than any hall the originals were mixed for — three production
 * decisions, none of them available in 1984, and together they are as
 * recognisable from one bar as an FM bell is. So this is the one era in the
 * genre where the era is the production rather than the instrument. That is a
 * weaker claim than the other three make and it is stated here rather than
 * smuggled in as a fourth bullet, because the fields it is made of — `duck`,
 * `drive`, `voiceEffects`, `space.reverbSize` — are the only ones carrying it.
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
 * universal either, and the palettes below are read by four styles out of nine
 * rather than by all of them. That is worth being exact about, because the
 * claim used to be made without the count and the count was one.
 *
 * A synth-brass stab is a first-class sound of this music rather than an
 * orchestral hangover, and what the layer writes is two gestures: a swell that
 * arrives with a held melody note and leaves with it, and a stab pushed off the
 * barline into a gap in the tune. `cinematic` takes the first — the swell under
 * a long CS-80 line, which is the other half of the lifted final chorus that
 * `keyChangeChance` above is set up for — and `cosmic` takes the second, which
 * is the horn punch behind a disco chorus. `optical` takes both and is the
 * reason the `digital` era's brass palette is finally read by something that
 * peaks in that era: a `synthBrass2` stab is the most 1987 sound in the
 * catalogue and until that style existed nothing that lived in 1987 asked for
 * one. `boulevard` is the fourth, and it is the only one that leads with the
 * layer rather than accepting it — a stab punched into a gap in the tune is what
 * the television theme it is named for is made of.
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
      ['leadChiff', 2], ['leadCharang', 2], ['fxSciFi', 1],
    ],
    // The sequencer line. It is not an answering phrase — it runs continuously
    // underneath, which is what `counterMode: 'ostinato'` exists for — so the
    // instruments here are chosen for a hard front and a short tail. A pad in
    // this slot would blur the sixteenth grid the whole texture depends on.
    counter: [
      ['leadSquare', 4], ['synthBass', 3], ['clavinet', 3],
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
      ['synthBass', 5], ['synthBass2', 3], ['fingerBass', 2],
    ],
    brass: [['synthBrass', 4], ['brassSection', 2], ['trombone', 1]],
  },
  /**
   * `optical` at 1 rather than 0, and the number is doing real work at that
   * size. The style is named after a 1988 record and its argument for existing
   * is that the analogue filter has gone — neither of which was true in 1974, so
   * a weight that matched the others would be staging a DX7 in a room full of
   * patch cables. Not struck out altogether, because a bright arpeggio over a
   * major key is what the *other* half of 1976 sounds like — *Oxygène* is on this
   * side of the line and it is not a dark record.
   */
  styleWeights: {
    berlin: 7, cinematic: 4, machine: 3, cosmic: 2, stalker: 4, optical: 1,
    /**
     * The three revival styles are zero here and in both eras below, and zero
     * rather than small is the point.
     *
     * `optical` at 1 above is the shape a small weight is *for*: those records
     * exist in 1976 — *Oxygène* is a bright arpeggio in a major key — and are
     * merely unlikely, so the number says rare rather than absent. These three
     * are not rare in 1974. They are music made by people who had to grow up
     * with this decade first and then miss it, and the duck that half their
     * identity rests on needs a compressor keyed off a signal nobody was
     * routing that way yet. A weight here would not stage an unusual evening,
     * it would print a wrong date.
     */
    outrun: 0, darksynth: 0, boulevard: 0,
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
  /** `optical` at 3 — the transitional weight. A Prophet-5 running an
   *  arpeggiator under a tune is 1982 as readily as 1988, and the style loses
   *  only its argument about the missing filter here, not its music. */
  styleWeights: {
    berlin: 4, cinematic: 7, machine: 6, cosmic: 6, stalker: 5, optical: 3,
    // Zero, argued in `modular` above.
    outrun: 0, darksynth: 0, boulevard: 0,
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
    pad: { reverb: 0.75, lowpass: 6000, filterEnv: { octaves: 1.2, shape: 'swell' } },
    comp: { reverb: 0.55, lowpass: 6500 },
    /**
     * The CS-80 line, in the two numbers the instrument is actually remembered
     * for. `glide` is the ribbon controller under the keyboard — the slide onto
     * the note that is the single most identifiable gesture in this era's film
     * writing — and `filterEnv`'s `swell` shape is per-key aftertouch, which no
     * other synthesiser of the decade had and which is why leaning on a held
     * note here opens it up instead of merely sustaining it.
     *
     * Both land on the whole era rather than on `cinematic`, and **that is now
     * a choice rather than a wall.** This paragraph used to say styles have no
     * `effects` of their own and to file it beside `keyChangeChance` as a
     * limitation worked around by putting the number where the style is most
     * likely to be drawn. `Style.effects` has existed for some time and the
     * sentence went stale where it stood. The numbers stay here anyway, because
     * that field's own docstring draws the line in the right place: a style
     * reaches for it when *the treatment is the piece*, and a ribbon controller
     * and per-key aftertouch are neither a treatment nor a piece — they are two
     * things that are true of the keyboards on the stand between 1977 and 1983,
     * which is exactly what an era is for. The spill is not damaging either:
     * `berlin`'s lead is a polysynth in 1981 too, and a two-and-a-half semitone
     * slide at eighty milliseconds is a slur rather than a siren.
     */
    melody: {
      reverb: 0.6, delay: 0.3, lowpass: 8000, resonance: 0.22, glide: 2.5,
      filterEnv: { octaves: 2, shape: 'swell' },
    },
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
  /**
   * The heaviest weight in the table, and it belongs to the style this era was
   * missing.
   *
   * `berlin` sits at 2 here because the sweep it is built on is unavailable on a
   * DX7 — which correctly describes what the *old* Tangerine Dream could not do
   * in 1988 and says nothing about what the group actually did instead. What
   * they did was *Le Parc* and *Optical Race*: the same sequencer, brighter
   * patches, harmony that moves, and a gated snare where the filter used to be.
   * Until this style existed the era's answer to "what is this group in 1988"
   * was `stalker`, which is a different group entirely.
   */
  styleWeights: {
    berlin: 2, cinematic: 5, machine: 5, cosmic: 4, stalker: 6, optical: 8,
    // Zero, argued in `modular` above — and this is the era where the
    // temptation is real, because `outrun` and `boulevard` are both made almost
    // entirely of 1987's furniture. They are still not 1987 records: what they
    // add is a mix, and the mix is the next era down.
    outrun: 0, darksynth: 0, boulevard: 0,
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

/**
 * RETROWAVE — 2005 onward.
 *
 * The era that invented nothing. Everything below is a quotation: a LinnDrum
 * sampled off a record that sampled it first, a DX bell from a preset nobody
 * has edited since 1986, a saw lead that is three oscillators pretending to be
 * one Prophet. The three eras above are separated by what had just been built;
 * this one is separated from all of them by *when it is looking back from*, and
 * the file header says at length why that is a weaker kind of era boundary and
 * why it is still one.
 *
 * ## Three production facts, and they are the whole era
 *
 * **The duck.** A compressor keyed off the kick pulls the pad and the sequencer
 * down on every beat and lets them back up across it, so the pulse is carried
 * by things *breathing* rather than by anything struck. It is the single most
 * recognisable thing about these records and it is unavailable to the eras
 * above — not for want of a compressor, but because keying one off the kick
 * needs the kick on its own tape return and a producer who thinks of the mix as
 * a rhythmic instrument, which is a 1990s idea arriving in a 1980s costume.
 * Pop's fourth era is named after it. Here it sits on the era rather than on
 * the styles, which is the opposite of what `pop` and `house` do, and the
 * reason is that in those genres the duck is a property of the dance floor a
 * particular style is built for, while here it is a property of the decade
 * *doing the remembering*. The three revival styles deepen it from their own
 * tables; the six vintage styles keep the era's own modest 6 dB, which is the
 * duck you feel rather than the one you hear.
 *
 * **The drive.** A saw bass through a saturator until the top of the waveform
 * flattens. `Instrument.effects` already carries `drive` for the electric
 * strings, and this is the same field used for the thing it was named after —
 * an amplifier out of headroom, on the layer that most of this repertoire's
 * identity is stored in.
 *
 * **The room.** `reverbSize` 0.95, the largest in the project. The originals
 * were mixed on plates and springs into rooms that existed; this is a
 * convolution of a hall nobody has ever stood in, and it is on everything at
 * once, which is why the delay comes down to compensate — an echo inside a
 * reverb that large is mud rather than rhythm.
 *
 * ## The drum machines are the same four boxes, and that is the argument
 *
 * No new bank, no new sample, and none needed: this music is played on a
 * LinnDrum, an 808, a DMX and a 909, because those are the machines the records
 * it remembers were made on. `polysynth` and `digital` between them already own
 * all four. What changes is the treatment — the gated snare moves off the whole
 * kit and onto the snare and the clap, where it belongs — and that is the one
 * place this era uses a field the eras above do not.
 *
 * `perc`, `cb`, `sh` and `rd` are avoided in the three styles written for this
 * era, and the reason is `RolandTR909`: it is in the sample pack, it has none
 * of the first three, and it has no row in `BANK_VOICES`, so `resolveVoice`
 * passes a request for one through unchanged and the audition gets a console
 * error instead of a substitution. That is a known live gap rather than a
 * decision of this era's, recorded in `digital` above; the new tables simply
 * decline to walk into it.
 */
const retrowave: EraProfile = {
  id: 'retrowave',
  year: 2013,
  label: '2005– retrowave',
  description:
    'The three eras above, quoted from a laptop: LinnDrum and FM bells over a saturated saw bass, everything ducking under the kick, and a reverb nobody in 1984 could afford.',
  /**
   * All four are second-hand, which is the era in one table. The Linn leads
   * because the gated snare on it is the sound the whole revival is organised
   * around; the 808 is next because its long sine kick is what a duck is keyed
   * off; the 909 is here for the fast styles, whose hats are the one thing in
   * this music that came out of a dance record rather than a film.
   */
  drumBanks: [
    ['LinnDrum', 5],
    ['RolandTR808', 4],
    ['OberheimDMX', 3],
    ['RolandTR909', 3],
  ],
  /**
   * No preset box and almost no kit. By 2013 the argument the `polysynth` era
   * was still having is not merely over, it is being re-enacted: a producer
   * choosing a LinnDrum is choosing a *quotation*, and nobody quotes a
   * bossa-nova button. The acoustic kit survives at 1 in 12 because the live
   * end of this music exists — these acts tour, and a drummer behind pads and a
   * snare is what that looks like — and `electronic-kit` is the pads.
   */
  drumSources: [['programmed', 9], ['electronic-kit', 2], ['kit', 1]],
  /**
   * The highest in the genre, and for the first time not because a player has
   * no third hand. Everything here is drawn into a grid with a mouse; a bass
   * line that was *performed* is the exception, and the exception is a guitar.
   */
  sequenced: { bass: 0.68, counter: 0.6 },
  palette: {
    /**
     * The detuned saw first and by a distance. Three sawtooths a few cents
     * apart is the lead sound of this entire revival, and GM 81 is as close as
     * a fixed patch gets to it.
     *
     * **The two guitars are the real addition.** They sit at weight 1 in
     * `digital` above, as the residue of a decade that had stopped buying them;
     * here they are a first-class lead voice, because half of this music is a
     * synthesiser record with a metal guitarist on it and the other half is a
     * guitarist making a synthesiser record. `darksynth` names them in its own
     * table and this is what that table intersects with.
     */
    melody: [
      ['leadSaw', 6], ['leadSquare', 3], ['leadCharang', 3], ['distortionGuitar', 3],
      ['overdriveGuitar', 3], ['leadVoice', 2], ['synthBrass2', 2], ['fxCrystal', 2],
      ['leadFifths', 1],
    ],
    counter: [
      ['leadSquare', 3], ['fxCrystal', 3], ['leadSaw', 3], ['distortionGuitar', 2],
      ['electricVibes', 2], ['celesta', 2], ['glockenspiel', 2], ['epiano2', 2],
      ['synthBass', 2],
    ],
    comp: [
      ['padPoly', 4], ['epiano2', 4], ['synthStrings', 3], ['leadSaw', 2],
      ['percussiveOrgan', 2], ['clavinet', 2], ['padWarm', 2], ['epiano1', 2],
    ],
    /**
     * Warm before metallic, which is the one place this palette declines to
     * agree with `digital`. The FM pad is a 1986 object and this music prefers
     * the 1981 one — a wide detuned poly wash — because it is what a duck sounds
     * best on: a metallic pad has a transient to be pumped, and a warm one has
     * only level, which is the thing that is moving.
     */
    pad: [
      ['padWarm', 5], ['padPoly', 4], ['synthStrings2', 3], ['synthChoir', 3],
      ['padSweep', 3], ['padHalo', 2], ['crushedPad', 2], ['choirAahs', 2],
    ],
    bass: [
      ['synthBass', 6], ['synthBass2', 5], ['slapBass', 2],
      ['pickBass', 2], ['fingerBass', 1],
    ],
    /**
     * **No `brassSection`, and this is the one palette in the genre that
     * refuses it.** The three eras above all carry it at 2 or 3, which is right:
     * a 1981 record with a horn arrangement on it had horn players. This one
     * would put a live trumpeter on the boards — `brassSection` resolves to the
     * `trumpet` archetype in `concert/instruments.ts`, so the stage builds a
     * person holding a bell-forward horn — and a 2013 synthwave act does not
     * have a brass section, it has a preset called BRASS. Refusing the id is the
     * whole fix; `synthBrass2` is what those records actually play and it
     * already leads the table.
     */
    brass: [['synthBrass2', 6], ['synthBrass', 4], ['padHalo', 2]],
  },
  /**
   * The three revival styles carry the era and the six vintage ones stay
   * available, which is a claim about the repertoire rather than a courtesy.
   *
   * `stalker` at 4 is the highest of the six and it is the least surprising
   * number in this table: the man who made the records that style is named
   * after went back into a studio in 2015 and made three more, and they are
   * that style played on this era's equipment. `cinematic` is here for the same
   * reason one era down. `berlin` is lowest because a sixteen-bar filter
   * opening is the one gesture this decade genuinely did not revive — what it
   * revived instead was the four bars either side of it.
   *
   * **Twenty-four against sixteen, and the ratio was measured rather than
   * guessed.** The first draft ran 24 against 21 and produced an era whose
   * songs were half pastiche of the three above it — 37 of 72 across 300 seeds
   * — which is a defensible number for the repertoire and a bad one for a table
   * whose entire reason to exist is the three styles it introduced. At three to
   * two the revival takes about 60% of the era and the older styles keep a real
   * presence rather than a token one, which is the shape the sentence above
   * describes.
   */
  styleWeights: {
    berlin: 2, cinematic: 3, machine: 2, cosmic: 2, stalker: 4, optical: 3,
    outrun: 9, darksynth: 8, boulevard: 7,
  },
  tempoScale: 1,
  /**
   * The lowest in the genre, and a reversal of what the other three say.
   *
   * `polysynth` carries 0.3 because the lifted final statement is the gesture a
   * film cue is built toward. This music does not lift. It is loop music made
   * by people who learned it from twelve-inch singles and title sequences, and
   * a tone-up last chorus is the one eighties device it left behind — the
   * modern record gets its arrival by adding a layer and opening the duck, not
   * by moving the key. Not zero, because `cinematic` is drawable here and that
   * style's whole ending is the lift.
   */
  keyChangeChance: 0.08,
  density: 0.62,
  /**
   * The biggest room in the project, on the shortest delay this genre writes.
   *
   * Both halves are one decision. At `reverbSize` 0.95 the tail is still
   * sounding when the next bar starts, so a dotted-eighth echo at high feedback
   * stops being a second sequencer and becomes a smear across the one that is
   * already there. The other three eras buy their depth with the delay line;
   * this one buys it with the room, which is what a plug-in with a hall in it
   * did to a generation of mixes.
   */
  space: { reverbSize: 0.95, delayBeats: 0.75, delayFeedback: 0.38 },
  effects: {
    /**
     * The duck, at the depth the whole era gets before a style has its say.
     *
     * 6 dB on the pad and 4 on the sequencer: audible as *movement* rather than
     * as an effect, which is the right default for an era six vintage styles can
     * also be drawn in — `cinematic` under this era should sound as though it
     * were mixed in 2013, not as though it had joined a house record. The three
     * styles written for the era raise it from their own tables, where the kick
     * is four to the bar and can carry it.
     *
     * `duckBeats` is left at the engine's default everywhere here. The default
     * is three quarters of a beat, chosen against a four-on-the-floor kick, and
     * every style that deepens this below has one.
     */
    pad: { reverb: 0.85, lowpass: 9000, duck: 6 },
    comp: { reverb: 0.55, delay: 0.32, lowpass: 9500, duck: 4 },
    counter: { reverb: 0.65, delay: 0.38, lowpass: 9000, duck: 4 },
    /**
     * A little drive on the lead and a lot on the bass, which is the asymmetry
     * that keeps this from sounding like a distortion pedal across the mix. A
     * saturated saw *bass* is the era's signature; a saturated lead is a guitar,
     * and the two styles that want one ask for a guitar by name instead.
     */
    melody: { reverb: 0.55, delay: 0.3, lowpass: 11000, drive: 0.2 },
    bass: { reverb: 0.05, lowpass: 1500, drive: 0.35 },
    /**
     * The kit stays comparatively dry and the tail moves to `voiceEffects`
     * below, which is the same correction `rock`'s arena era made and for the
     * same reason: 0.7 across the whole kit — what `digital` does — is a gate
     * being approximated by a send, and it puts a two-second hall on the
     * sixteenth-note hats that this era's fast styles depend on hearing.
     */
    drums: { reverb: 0.4, lowpass: 9000 },
    brass: { reverb: 0.45, lowpass: 10000, duck: 4 },
    vocal: { reverb: 0.5, delay: 0.3, lowpass: 8000 },
  },
  /**
   * The gated snare, and the clap beside it.
   *
   * Two voices rather than rock's one, and the second is this genre's own: the
   * revival's backbeat is very often a LinnDrum snare and a handclap struck
   * together, and gating one without the other splits a single sound in half.
   * Nothing else on the kit gets it — a kick through a hall is a rumble, and
   * hats through one are the reason the kit's own send came down.
   *
   * What this writes is the plate and not the gate. `Effects` has no decay
   * field, so the chop that gives the sound its name still needs a field nobody
   * has built; this is the half that was available, and it is the half that
   * makes the snare enormous.
   */
  voiceEffects: {
    sd: { reverb: 0.9, lowpass: 7000 },
    cp: { reverb: 0.8, lowpass: 7500 },
  },
};

export const ERAS: Record<string, EraProfile> = {
  modular, polysynth, digital, retrowave,
};
