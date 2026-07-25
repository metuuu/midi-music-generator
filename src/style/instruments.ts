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

export interface Instrument {
  name: string;
  /** 0-based General MIDI program. */
  gm: number;
  /** Soundfont name in @strudel/soundfonts. */
  strudel: string;
  /** Suggested octave centre for this instrument's part. */
  centre: number;
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
  name: string, gm: number, strudel: string, centre: number, agility = 0.7,
): Instrument => ({ name, gm, strudel, centre, agility });

export const INSTRUMENTS = {
  accordion: I('accordion', 21, 'gm_accordion', 72, 0.8),
  bandoneon: I('bandoneon', 23, 'gm_bandoneon', 72, 0.8),
  harmonica: I('harmonica', 22, 'gm_harmonica', 72, 0.6),
  piano: I('piano', 0, 'gm_piano', 60, 1.0),
  epiano1: I('electric piano', 4, 'gm_epiano1', 60, 1.0),
  epiano2: I('electric piano 2', 5, 'gm_epiano2', 60, 1.0),
  vibraphone: I('vibraphone', 11, 'gm_vibraphone', 72, 1.0),
  glockenspiel: I('glockenspiel', 9, 'gm_glockenspiel', 84, 1.0),
  drawbarOrgan: I('drawbar organ', 16, 'gm_drawbar_organ', 60, 0.9),
  rockOrgan: I('rock organ', 18, 'gm_rock_organ', 60, 0.9),
  nylonGuitar: I('nylon guitar', 24, 'gm_acoustic_guitar_nylon', 60, 0.8),
  steelGuitar: I('steel guitar', 25, 'gm_acoustic_guitar_steel', 60, 0.8),
  jazzGuitar: I('jazz guitar', 26, 'gm_electric_guitar_jazz', 60, 0.85),
  cleanGuitar: I('clean electric guitar', 27, 'gm_electric_guitar_clean', 60, 0.8),
  mutedGuitar: I('muted guitar', 28, 'gm_electric_guitar_muted', 60, 0.8),
  acousticBass: I('upright bass', 32, 'gm_acoustic_bass', 40, 0.7),
  fingerBass: I('electric bass', 33, 'gm_electric_bass_finger', 40, 0.75),
  pickBass: I('picked bass', 34, 'gm_electric_bass_pick', 40, 0.75),
  synthBass: I('synth bass', 38, 'gm_synth_bass_1', 40, 0.85),
  violin: I('violin', 40, 'gm_violin', 76, 0.6),
  fiddle: I('fiddle', 110, 'gm_fiddle', 76, 0.65),
  tremoloStrings: I('tremolo strings', 44, 'gm_tremolo_strings', 72, 0.5),
  pizzStrings: I('pizzicato strings', 45, 'gm_pizzicato_strings', 60, 0.8),
  harp: I('harp', 46, 'gm_orchestral_harp', 72, 1.0),
  strings1: I('string ensemble', 48, 'gm_string_ensemble_1', 72, 0.5),
  strings2: I('string ensemble 2', 49, 'gm_string_ensemble_2', 72, 0.5),
  synthStrings: I('synth strings', 50, 'gm_synth_strings_1', 72, 0.5),
  synthStrings2: I('synth strings 2', 51, 'gm_synth_strings_2', 72, 0.5),
  trumpet: I('trumpet', 56, 'gm_trumpet', 72, 0.45),
  trombone: I('trombone', 57, 'gm_trombone', 60, 0.4),
  mutedTrumpet: I('muted trumpet', 59, 'gm_muted_trumpet', 72, 0.45),
  brassSection: I('brass section', 61, 'gm_brass_section', 72, 0.4),
  synthBrass: I('synth brass', 62, 'gm_synth_brass_1', 72, 0.6),
  sopranoSax: I('soprano sax', 64, 'gm_soprano_sax', 76, 0.6),
  altoSax: I('alto sax', 65, 'gm_alto_sax', 72, 0.6),
  tenorSax: I('tenor sax', 66, 'gm_tenor_sax', 60, 0.6),
  baritoneSax: I('baritone sax', 67, 'gm_baritone_sax', 48, 0.5),
  clarinet: I('clarinet', 71, 'gm_clarinet', 72, 0.65),
  flute: I('flute', 73, 'gm_flute', 84, 0.7),
  padWarm: I('warm pad', 89, 'gm_pad_warm', 60, 0.5),
  celesta: I('celesta', 8, 'gm_celesta', 84, 1.0),
} satisfies Record<string, Instrument>;

export type InstrumentId = keyof typeof INSTRUMENTS;
