/**
 * Instrument palettes, keyed by era.
 *
 * Every entry carries both a General MIDI program number (for the MIDI
 * renderer, and therefore for anything you play back in Unity/Godot/FluidSynth)
 * and the matching Strudel soundfont name, so the two renderers stay in sync.
 *
 * The GM numbers are 0-based. `gm_bandoneon` is GM 24 "Tango Accordion", which
 * is exactly the right voice for Finnish tango.
 */

/**
 * How an instrument's music is *shaped*, as opposed to how far it can leap.
 *
 * `agility` says what an instrument can reach. It says nothing about what the
 * instrument actually plays, and that turns out to be the larger difference:
 * measured before this existed, a harp and a trombone handed the same chords
 * produced statistically identical lines — 68–72% steps, 2% arpeggiation, the
 * same fraction of rest — differing only in the widest interval either would
 * take. Every lead in the generator was a wordless singer wearing a different
 * patch.
 *
 * Real instrumental writing differs by *figuration*. A mallet or keyboard line
 * breaks chords; a flute line runs up the scale; a brass line states four notes
 * and stops. None of that is expressible as a leap width.
 */
export type Idiom =
  | 'vocal'     // stepwise, tessitura-bound, breathes
  | 'keyboard'  // broken chords and runs both, no breath limit
  | 'mallet'    // arpeggiated, wide, tolerant of repeated notes
  | 'plucked'   // arpeggiated but narrower; re-articulation is free
  | 'bowed'     // long slurred lines, few rests, moderate leaps
  | 'wind'      // scalar runs, and it has to breathe
  | 'brass'     // sparse and narrow, and it has to breathe harder
  | 'reed';     // free-reed: sustained and agile, bellows never run out

export interface IdiomProfile {
  /**
   * Preference for continuing a broken-chord figure — a third in the same
   * direction as the last third. This is what an arpeggio *is*, and it was
   * happening 2% of the time on every instrument in the catalogue.
   */
  arpeggio: number;
  /** Preference for continuing a scale run — a step in the same direction. */
  run: number;
  /** Tolerance for re-articulating the same note. Free on a mallet, ugly sung. */
  repeat: number;
  /**
   * How badly the line needs air. Drives rests at phrase joins: a flute line
   * with no gap in it reads as synthetic long before anyone works out why.
   */
  breath: number;
}

export const IDIOMS: Record<Idiom, IdiomProfile> = {
  vocal: { arpeggio: 0.0, run: 0.35, repeat: 0.5, breath: 0.8 },
  keyboard: { arpeggio: 0.7, run: 0.8, repeat: 0.7, breath: 0.05 },
  mallet: { arpeggio: 0.9, run: 0.5, repeat: 1.0, breath: 0.05 },
  plucked: { arpeggio: 0.8, run: 0.4, repeat: 1.0, breath: 0.1 },
  bowed: { arpeggio: 0.25, run: 0.6, repeat: 0.3, breath: 0.15 },
  wind: { arpeggio: 0.2, run: 1.0, repeat: 0.4, breath: 0.7 },
  brass: { arpeggio: 0.35, run: 0.3, repeat: 0.6, breath: 0.9 },
  reed: { arpeggio: 0.3, run: 0.7, repeat: 0.5, breath: 0.1 },
};

export interface Instrument {
  name: string;
  /** 0-based General MIDI program. */
  gm: number;
  /** Soundfont name in @strudel/soundfonts. */
  strudel: string;
  /** Suggested octave centre for this instrument's part. */
  centre: number;
  /** How its music is shaped. See `Idiom`. */
  idiom: Idiom;
  /**
   * How freely this instrument leaps, 0..1.
   *
   * A tenth is nothing on a vibraphone and a real problem on a trombone. The
   * constraint engine turns this into a maximum comfortable interval, and the
   * melody generator uses it to scale how often it reaches for a leap at all.
   *
   *   1.0  keyboards, mallets, harp — any interval, instantly
   *   0.8  plucked strings, accordion
   *   0.6  flute, clarinet, saxophone
   *   0.45 brass — every leap is an embouchure change
   *   0.5  bowed strings and pads, which read as vocal lines
   */
  agility: number;
}

const I = (
  name: string, gm: number, strudel: string, centre: number,
  agility = 0.7, idiom: Idiom = 'vocal',
): Instrument => ({ name, gm, strudel, centre, idiom, agility });

export const INSTRUMENTS = {
  accordion: I('accordion', 21, 'gm_accordion', 72, 0.8, 'reed'),
  bandoneon: I('bandoneon', 23, 'gm_bandoneon', 72, 0.8, 'reed'),
  harmonica: I('harmonica', 22, 'gm_harmonica', 72, 0.6, 'wind'),
  piano: I('piano', 0, 'gm_piano', 60, 1.0, 'keyboard'),
  epiano1: I('electric piano', 4, 'gm_epiano1', 60, 1.0, 'keyboard'),
  epiano2: I('electric piano 2', 5, 'gm_epiano2', 60, 1.0, 'keyboard'),
  vibraphone: I('vibraphone', 11, 'gm_vibraphone', 72, 1.0, 'mallet'),
  glockenspiel: I('glockenspiel', 9, 'gm_glockenspiel', 84, 1.0, 'mallet'),
  drawbarOrgan: I('drawbar organ', 16, 'gm_drawbar_organ', 60, 0.9, 'keyboard'),
  rockOrgan: I('rock organ', 18, 'gm_rock_organ', 60, 0.9, 'keyboard'),
  nylonGuitar: I('nylon guitar', 24, 'gm_acoustic_guitar_nylon', 60, 0.8, 'plucked'),
  steelGuitar: I('steel guitar', 25, 'gm_acoustic_guitar_steel', 60, 0.8, 'plucked'),
  jazzGuitar: I('jazz guitar', 26, 'gm_electric_guitar_jazz', 60, 0.85, 'plucked'),
  cleanGuitar: I('clean electric guitar', 27, 'gm_electric_guitar_clean', 60, 0.8, 'plucked'),
  mutedGuitar: I('muted guitar', 28, 'gm_electric_guitar_muted', 60, 0.8, 'plucked'),
  acousticBass: I('upright bass', 32, 'gm_acoustic_bass', 40, 0.7, 'plucked'),
  fingerBass: I('electric bass', 33, 'gm_electric_bass_finger', 40, 0.75, 'plucked'),
  pickBass: I('picked bass', 34, 'gm_electric_bass_pick', 40, 0.75, 'plucked'),
  synthBass: I('synth bass', 38, 'gm_synth_bass_1', 40, 0.85, 'keyboard'),
  violin: I('violin', 40, 'gm_violin', 76, 0.6, 'bowed'),
  fiddle: I('fiddle', 110, 'gm_fiddle', 76, 0.65, 'bowed'),
  tremoloStrings: I('tremolo strings', 44, 'gm_tremolo_strings', 72, 0.5, 'bowed'),
  pizzStrings: I('pizzicato strings', 45, 'gm_pizzicato_strings', 60, 0.8, 'plucked'),
  harp: I('harp', 46, 'gm_orchestral_harp', 72, 1.0, 'mallet'),
  strings1: I('string ensemble', 48, 'gm_string_ensemble_1', 72, 0.5, 'bowed'),
  strings2: I('string ensemble 2', 49, 'gm_string_ensemble_2', 72, 0.5, 'bowed'),
  synthStrings: I('synth strings', 50, 'gm_synth_strings_1', 72, 0.5, 'bowed'),
  synthStrings2: I('synth strings 2', 51, 'gm_synth_strings_2', 72, 0.5, 'bowed'),
  trumpet: I('trumpet', 56, 'gm_trumpet', 72, 0.45, 'brass'),
  trombone: I('trombone', 57, 'gm_trombone', 60, 0.4, 'brass'),
  mutedTrumpet: I('muted trumpet', 59, 'gm_muted_trumpet', 72, 0.45, 'brass'),
  brassSection: I('brass section', 61, 'gm_brass_section', 72, 0.4, 'brass'),
  synthBrass: I('synth brass', 62, 'gm_synth_brass_1', 72, 0.6, 'brass'),
  sopranoSax: I('soprano sax', 64, 'gm_soprano_sax', 76, 0.6, 'wind'),
  altoSax: I('alto sax', 65, 'gm_alto_sax', 72, 0.6, 'wind'),
  tenorSax: I('tenor sax', 66, 'gm_tenor_sax', 60, 0.6, 'wind'),
  baritoneSax: I('baritone sax', 67, 'gm_baritone_sax', 48, 0.5, 'wind'),
  clarinet: I('clarinet', 71, 'gm_clarinet', 72, 0.65, 'wind'),
  flute: I('flute', 73, 'gm_flute', 84, 0.7, 'wind'),
  padWarm: I('warm pad', 89, 'gm_pad_warm', 60, 0.5, 'bowed'),
  celesta: I('celesta', 8, 'gm_celesta', 84, 1.0, 'keyboard'),

  // --- The ambient shelf ---------------------------------------------------
  // GM programs 88–103 are the eight synth pads and the eight "effects", and
  // they exist almost entirely for this music. Every general-purpose genre
  // above ignores them; ambient is built out of them.
  //
  // Centres sit lower than the melodic instruments above. A pad is a texture
  // rather than a tune, and a texture wants the register where the ear stops
  // tracking individual notes — roughly C3 to C4 for anything sustained. The
  // bell voices are the exception and sit high, because a bell that is not
  // above the pad is simply part of the pad.
  padNewAge: I('new age pad', 88, 'gm_pad_new_age', 60, 0.5, 'bowed'),
  padPoly: I('polysynth pad', 90, 'gm_pad_poly', 60, 0.6, 'bowed'),
  padChoir: I('choir pad', 91, 'gm_pad_choir', 60, 0.45, 'vocal'),
  padBowed: I('bowed pad', 92, 'gm_pad_bowed', 60, 0.45, 'bowed'),
  padMetallic: I('metallic pad', 93, 'gm_pad_metallic', 60, 0.5, 'bowed'),
  padHalo: I('halo pad', 94, 'gm_pad_halo', 60, 0.45, 'bowed'),
  padSweep: I('sweep pad', 95, 'gm_pad_sweep', 60, 0.5, 'bowed'),
  fxRain: I('rain', 96, 'gm_fx_rain', 72, 0.6, 'mallet'),
  fxSoundtrack: I('soundtrack', 97, 'gm_fx_soundtrack', 60, 0.5, 'bowed'),
  fxCrystal: I('crystal', 98, 'gm_fx_crystal', 79, 0.9, 'mallet'),
  fxAtmosphere: I('atmosphere', 99, 'gm_fx_atmosphere', 67, 0.7, 'bowed'),
  fxBrightness: I('brightness', 100, 'gm_fx_brightness', 72, 0.7, 'bowed'),
  fxGoblins: I('goblins', 101, 'gm_fx_goblins', 55, 0.5, 'bowed'),
  fxEchoes: I('echoes', 102, 'gm_fx_echoes', 72, 0.7, 'mallet'),
  fxSciFi: I('sci-fi', 103, 'gm_fx_sci_fi', 67, 0.6, 'bowed'),
  choirAahs: I('choir', 52, 'gm_choir_aahs', 64, 0.4, 'vocal'),
  voiceOohs: I('voices', 53, 'gm_voice_oohs', 64, 0.4, 'vocal'),
  synthChoir: I('synth choir', 54, 'gm_synth_choir', 64, 0.45, 'vocal'),
  churchOrgan: I('church organ', 19, 'gm_church_organ', 60, 0.7, 'keyboard'),
  reedOrgan: I('reed organ', 20, 'gm_reed_organ', 60, 0.7, 'keyboard'),
  tubularBells: I('tubular bells', 14, 'gm_tubular_bells', 72, 1.0, 'mallet'),
  musicBox: I('music box', 10, 'gm_music_box', 84, 1.0, 'mallet'),
  kalimba: I('kalimba', 108, 'gm_kalimba', 72, 1.0, 'mallet'),
  marimba: I('marimba', 12, 'gm_marimba', 72, 1.0, 'mallet'),
  leadSquare: I('square lead', 80, 'gm_lead_1_square', 72, 0.9, 'keyboard'),
  leadSaw: I('saw lead', 81, 'gm_lead_2_sawtooth', 72, 0.9, 'keyboard'),
  leadCalliope: I('calliope lead', 82, 'gm_lead_3_calliope', 72, 0.8, 'wind'),
  leadChiff: I('chiff lead', 83, 'gm_lead_4_chiff', 72, 0.8, 'wind'),
  leadVoice: I('voice lead', 85, 'gm_lead_6_voice', 72, 0.7, 'vocal'),
  fretlessBass: I('fretless bass', 35, 'gm_fretless_bass', 40, 0.7, 'bowed'),
  synthBass2: I('synth bass 2', 39, 'gm_synth_bass_2', 40, 0.85, 'keyboard'),
  cello: I('cello', 42, 'gm_cello', 52, 0.5, 'bowed'),
  contrabass: I('contrabass', 43, 'gm_contrabass', 40, 0.45, 'bowed'),
  // Sympathetic strings and a drone string of its own — the one plucked
  // instrument that already behaves like a pad.
  sitar: I('sitar', 104, 'gm_sitar', 60, 0.7, 'plucked'),
  panFlute: I('pan flute', 75, 'gm_pan_flute', 79, 0.6, 'wind'),
  shakuhachi: I('shakuhachi', 77, 'gm_shakuhachi', 74, 0.55, 'wind'),
} satisfies Record<string, Instrument>;

export type InstrumentId = keyof typeof INSTRUMENTS;
