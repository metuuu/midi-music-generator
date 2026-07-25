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
}

const I = (name: string, gm: number, strudel: string, centre: number): Instrument => ({ name, gm, strudel, centre });

export const INSTRUMENTS = {
  accordion: I('accordion', 21, 'gm_accordion', 72),
  bandoneon: I('bandoneon', 23, 'gm_bandoneon', 72),
  harmonica: I('harmonica', 22, 'gm_harmonica', 72),
  piano: I('piano', 0, 'gm_piano', 60),
  epiano1: I('electric piano', 4, 'gm_epiano1', 60),
  epiano2: I('electric piano 2', 5, 'gm_epiano2', 60),
  vibraphone: I('vibraphone', 11, 'gm_vibraphone', 72),
  glockenspiel: I('glockenspiel', 9, 'gm_glockenspiel', 84),
  drawbarOrgan: I('drawbar organ', 16, 'gm_drawbar_organ', 60),
  rockOrgan: I('rock organ', 18, 'gm_rock_organ', 60),
  nylonGuitar: I('nylon guitar', 24, 'gm_acoustic_guitar_nylon', 60),
  steelGuitar: I('steel guitar', 25, 'gm_acoustic_guitar_steel', 60),
  jazzGuitar: I('jazz guitar', 26, 'gm_electric_guitar_jazz', 60),
  cleanGuitar: I('clean electric guitar', 27, 'gm_electric_guitar_clean', 60),
  mutedGuitar: I('muted guitar', 28, 'gm_electric_guitar_muted', 60),
  acousticBass: I('upright bass', 32, 'gm_acoustic_bass', 40),
  fingerBass: I('electric bass', 33, 'gm_electric_bass_finger', 40),
  pickBass: I('picked bass', 34, 'gm_electric_bass_pick', 40),
  synthBass: I('synth bass', 38, 'gm_synth_bass_1', 40),
  violin: I('violin', 40, 'gm_violin', 76),
  fiddle: I('fiddle', 110, 'gm_fiddle', 76),
  tremoloStrings: I('tremolo strings', 44, 'gm_tremolo_strings', 72),
  pizzStrings: I('pizzicato strings', 45, 'gm_pizzicato_strings', 60),
  harp: I('harp', 46, 'gm_orchestral_harp', 72),
  strings1: I('string ensemble', 48, 'gm_string_ensemble_1', 72),
  strings2: I('string ensemble 2', 49, 'gm_string_ensemble_2', 72),
  synthStrings: I('synth strings', 50, 'gm_synth_strings_1', 72),
  synthStrings2: I('synth strings 2', 51, 'gm_synth_strings_2', 72),
  trumpet: I('trumpet', 56, 'gm_trumpet', 72),
  trombone: I('trombone', 57, 'gm_trombone', 60),
  mutedTrumpet: I('muted trumpet', 59, 'gm_muted_trumpet', 72),
  brassSection: I('brass section', 61, 'gm_brass_section', 72),
  synthBrass: I('synth brass', 62, 'gm_synth_brass_1', 72),
  sopranoSax: I('soprano sax', 64, 'gm_soprano_sax', 76),
  altoSax: I('alto sax', 65, 'gm_alto_sax', 72),
  tenorSax: I('tenor sax', 66, 'gm_tenor_sax', 60),
  baritoneSax: I('baritone sax', 67, 'gm_baritone_sax', 48),
  clarinet: I('clarinet', 71, 'gm_clarinet', 72),
  flute: I('flute', 73, 'gm_flute', 84),
  padWarm: I('warm pad', 89, 'gm_pad_warm', 60),
  celesta: I('celesta', 8, 'gm_celesta', 84),
} satisfies Record<string, Instrument>;

export type InstrumentId = keyof typeof INSTRUMENTS;
