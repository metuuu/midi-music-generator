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

import type { Midi } from '../core/pitch.js';
import type { Effects, Envelope } from '../core/types.js';
import type { VoicingStyle } from '../core/voicing.js';

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
  /**
   * Silence before the next attack, in beats — the gap between two notes that
   * are not slurred. See `tune/types.ts` for why this is a different axis from
   * `breath`, which is the once-a-phrase gap of a player running out of air.
   *
   * The numbers are what stops the note, and they are ordered by how the sound
   * is interrupted rather than by how it is made. A singer does not stop at
   * all between two vowels, which is why `vocal` is nearly zero and why the
   * vocal aesthetic this project already has survives untouched. A bow changes
   * direction, a key lifts a damper onto a string, a plectrum has to come back
   * to the string it just left, and a tongue stops a reed dead — that last one
   * is the largest gap on any wind instrument and it is why brass phrasing
   * reads as speech.
   */
  detache: number;
}

export const IDIOMS: Record<Idiom, IdiomProfile> = {
  vocal: { arpeggio: 0.0, run: 0.35, repeat: 0.5, breath: 0.8, detache: 0.03 },
  keyboard: { arpeggio: 0.7, run: 0.8, repeat: 0.7, breath: 0.05, detache: 0.10 },
  mallet: { arpeggio: 0.9, run: 0.5, repeat: 1.0, breath: 0.05, detache: 0.10 },
  plucked: { arpeggio: 0.8, run: 0.4, repeat: 1.0, breath: 0.1, detache: 0.13 },
  bowed: { arpeggio: 0.25, run: 0.6, repeat: 0.3, breath: 0.15, detache: 0.06 },
  wind: { arpeggio: 0.2, run: 1.0, repeat: 0.4, breath: 0.7, detache: 0.11 },
  brass: { arpeggio: 0.35, run: 0.3, repeat: 0.6, breath: 0.9, detache: 0.15 },
  reed: { arpeggio: 0.3, run: 0.7, repeat: 0.5, breath: 0.1, detache: 0.08 },
};

/**
 * How each family's notes rise and fall, as a default per idiom. See `Envelope`.
 *
 * Keyed on `Idiom` because that is the closest thing the catalogue already has
 * to a family, and for six of the eight it is exactly the right axis: everything
 * bowed sustains, everything struck decays, everything blown needs a moment to
 * speak. `keyboard` is the one that does not hold — a piano decays and an organ
 * does not, and both live there because they are *fingered the same way*, which
 * is what `Idiom` is actually about. Those pay for themselves with an override
 * below rather than by splitting a figuration axis to carry a sound fact.
 *
 * Numbers are a considered first pass, not measurements. `bench.html` is where
 * they get settled by ear, and it prints the line to paste back here.
 */
export const IDIOM_ENVELOPES: Record<Idiom, Envelope> = {
  // A voice does not start on the note; it arrives at it.
  vocal: { attack: 0.05, decay: 0.12, sustain: 0.9, release: 0.25 },
  // Piano-shaped: struck, but into a long tail rather than to nothing, because
  // a damper leaves a little of the note behind while the key is down.
  keyboard: { attack: 0.002, decay: 2.2, sustain: 0.15, release: 0.35 },
  // Struck metal or wood. `sustain: 0` is the whole fix — the bar rings for its
  // own length, not for the length it was written for.
  mallet: { attack: 0.002, decay: 1.6, sustain: 0, release: 0.35 },
  plucked: { attack: 0.003, decay: 1.1, sustain: 0, release: 0.25 },
  // A bow takes time to move a string, and that slowness is most of what tells
  // the ear this is bowed and not a keyboard patch holding a note.
  bowed: { attack: 0.08, decay: 0.15, sustain: 0.9, release: 0.4 },
  wind: { attack: 0.04, decay: 0.1, sustain: 0.92, release: 0.18 },
  // A brass note has a harder front than a flute's, and stops sooner.
  brass: { attack: 0.025, decay: 0.1, sustain: 0.9, release: 0.15 },
  // Free reed: the bellows do not run out and the note does not decay.
  reed: { attack: 0.02, decay: 0.08, sustain: 0.95, release: 0.12 },
};

/**
 * A pad is not a slow violin. It fades in over a third of a second and leaves a
 * tail behind it, which is the difference between a texture and a held chord.
 */
const PAD: Envelope = { attack: 0.35, decay: 0.3, sustain: 0.9, release: 0.8 };

/** Drawbars: on, then off. No decay at all, and nothing to ring out. */
const ORGAN: Partial<Envelope> = { attack: 0.01, decay: 0.05, sustain: 1, release: 0.08 };

/** An oscillator through a gate — which, for once, is the honest shape. */
const SYNTH_LEAD: Partial<Envelope> = { attack: 0.01, decay: 0.06, sustain: 1, release: 0.1 };

/** The same gate with a plucky front on it, which is what a synth bass is. */
const SYNTH_BASS: Partial<Envelope> = { attack: 0.004, decay: 0.25, sustain: 0.7, release: 0.08 };

export interface Instrument {
  name: string;
  /** 0-based General MIDI program. */
  gm: number;
  /** Soundfont name in @strudel/soundfonts. */
  strudel: string;
  /**
   * Processing that is part of what this instrument *is*, merged last — over
   * the genre's effects and over the era's.
   *
   * General MIDI has no electric violin and no electric vibraphone, and there is
   * no patch to substitute for either. But an electric violin is not a different
   * instrument: it is a violin with a pickup and an amplifier, which is a
   * statement about processing rather than about timbre, and this is where
   * processing lives.
   *
   * Merged **last** on purpose. An era and a genre describe the room and the
   * decade; this describes the object, and a 1990s production should not be able
   * to un-drive an electric violin any more than it can un-electrify one. In
   * practice they rarely collide — eras speak in `reverb` and `lowpass`, this
   * speaks in `drive` and `phaser`.
   */
  effects?: Effects;
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
  /**
   * Where this instrument's envelope departs from its idiom's. See `envelopeFor`.
   *
   * Only for instruments whose *sound* contradicts the family they are fingered
   * like — an organ among the keyboards, a synth pad among the strings. Not for
   * shading one bell against another; that belongs in the idiom default until
   * the bench says otherwise.
   */
  envelope?: Partial<Envelope>;
}

const I = (
  name: string, gm: number, strudel: string, centre: number,
  agility = 0.7, idiom: Idiom = 'vocal',
): Instrument => ({ name, gm, strudel, centre, idiom, agility });

/** An instrument that does not ring the way its idiom rings. */
const E = (instrument: Instrument, envelope: Partial<Envelope>): Instrument =>
  ({ ...instrument, envelope });

/** The same instrument through a pickup and an amp. See `Instrument.effects`. */
const FX = (instrument: Instrument, name: string, effects: Effects): Instrument =>
  ({ ...instrument, name, effects });

/** The idiom's envelope with this instrument's own corrections applied. */
export function envelopeFor(instrument: Instrument): Envelope {
  return { ...IDIOM_ENVELOPES[instrument.idiom], ...instrument.envelope };
}

/**
 * Four acoustic entries named here and used twice below.
 *
 * The electric variants at the foot of the table are these objects *spread*,
 * not re-typed, so the two can never come to disagree about a range, a centre
 * or an idiom. Change the violin here and its amplified twin moves with it,
 * which is the correct behaviour and the whole argument of that section: it is
 * the same violin.
 */
const VIOLIN = I('violin', 40, 'gm_violin', 76, 0.6, 'bowed');
const CELLO = I('cello', 42, 'gm_cello', 52, 0.5, 'bowed');
const VIBRAPHONE = I('vibraphone', 11, 'gm_vibraphone', 72, 1.0, 'mallet');
const PAD_METALLIC = E(I('metallic pad', 93, 'gm_pad_metallic', 60, 0.5, 'bowed'), PAD);

export const INSTRUMENTS = {
  accordion: I('accordion', 21, 'gm_accordion', 72, 0.8, 'reed'),
  bandoneon: I('bandoneon', 23, 'gm_bandoneon', 72, 0.8, 'reed'),
  harmonica: I('harmonica', 22, 'gm_harmonica', 72, 0.6, 'wind'),
  piano: I('piano', 0, 'gm_piano', 60, 1.0, 'keyboard'),
  epiano1: I('electric piano', 4, 'gm_epiano1', 60, 1.0, 'keyboard'),
  epiano2: I('electric piano 2', 5, 'gm_epiano2', 60, 1.0, 'keyboard'),
  // Fingered like a piano and strung like nothing else: a rubber tangent strikes
  // the string and a yarn damper stops it the instant the key comes up. That is
  // why a clavinet riff is heard as rhythm and a Rhodes chord as harmony. The
  // keyboard idiom's two-second tail would make this a small electric piano;
  // just under half a second is the length the string actually has.
  clavinet: E(I('clavinet', 7, 'gm_clavinet', 60, 1.0, 'keyboard'), { decay: 0.45 }),
  vibraphone: VIBRAPHONE,
  // A colour instrument, and the centre has to say so. At 84 the register
  // planner put a line's top excursion — `leadCentre + span * 0.6` — at around
  // C7, which on this patch is where a note stops being a pitch and becomes a
  // ping, and the mallet idiom's tolerance for repeated notes kept it there.
  // G5 is the bottom of the real instrument: still above anything it decorates,
  // without spending the whole part in the octave that fatigues the ear. The
  // range below stays the vibraphone's, generous at the bottom and harmless —
  // nothing writes a glockenspiel down there once it is centred here, and
  // raising that floor would fold low notes *up*, which is the wrong direction.
  glockenspiel: I('glockenspiel', 9, 'gm_glockenspiel', 79, 1.0, 'mallet'),
  drawbarOrgan: E(I('drawbar organ', 16, 'gm_drawbar_organ', 60, 0.9, 'keyboard'), ORGAN),
  rockOrgan: E(I('rock organ', 18, 'gm_rock_organ', 60, 0.9, 'keyboard'), ORGAN),
  // `ORGAN` and not something with a decay in it, despite the name. The
  // percussion tab adds a decaying harmonic *over* the drawbars, and the
  // drawbars underneath go on sounding for as long as the key is held. That ping
  // is in the sample, where it belongs; the envelope describes what is left once
  // it has gone, and what is left is an organ.
  percussiveOrgan: E(I('percussive organ', 17, 'gm_percussive_organ', 60, 0.9, 'keyboard'), ORGAN),
  nylonGuitar: I('nylon guitar', 24, 'gm_acoustic_guitar_nylon', 60, 0.8, 'plucked'),
  steelGuitar: I('steel guitar', 25, 'gm_acoustic_guitar_steel', 60, 0.8, 'plucked'),
  jazzGuitar: I('jazz guitar', 26, 'gm_electric_guitar_jazz', 60, 0.85, 'plucked'),
  cleanGuitar: I('clean electric guitar', 27, 'gm_electric_guitar_clean', 60, 0.8, 'plucked'),
  // Palm-muted: the string is damped by the hand that struck it.
  mutedGuitar: E(I('muted guitar', 28, 'gm_electric_guitar_muted', 60, 0.8, 'plucked'),
    { decay: 0.25 }),
  // Overdrive is a clean note pushed into an amplifier that has run out of
  // headroom. The string still decays like a string, so this takes the plucked
  // envelope untouched.
  overdriveGuitar: I('overdriven guitar', 29, 'gm_overdriven_guitar', 60, 0.8, 'plucked'),
  // Distortion is the same process taken far enough to compress, and compression
  // is what abolishes the decay: the note holds at level until the player damps
  // it. Two and a half seconds against the plucked default's one is the whole
  // difference between a chord and a power chord.
  distortionGuitar: E(I('distortion guitar', 30, 'gm_distortion_guitar', 60, 0.8, 'plucked'),
    { decay: 2.6 }),
  acousticBass: I('upright bass', 32, 'gm_acoustic_bass', 40, 0.7, 'plucked'),
  fingerBass: I('electric bass', 33, 'gm_electric_bass_finger', 40, 0.75, 'plucked'),
  pickBass: I('picked bass', 34, 'gm_electric_bass_pick', 40, 0.75, 'plucked'),
  // The same fingerboard, the same four strings and the same reach as
  // `fingerBass`: thumb and popping finger are a technique, not a wider
  // instrument. What makes it 1983 is in the sample, not in these numbers.
  slapBass: I('slap bass', 36, 'gm_slap_bass_1', 40, 0.75, 'plucked'),
  synthBass: E(I('synth bass', 38, 'gm_synth_bass_1', 40, 0.85, 'keyboard'), SYNTH_BASS),
  violin: VIOLIN,
  fiddle: I('fiddle', 110, 'gm_fiddle', 76, 0.65, 'bowed'),
  tremoloStrings: I('tremolo strings', 44, 'gm_tremolo_strings', 72, 0.5, 'bowed'),
  // Plucked with a fingertip and stopped by the next bow stroke: very short.
  pizzStrings: E(I('pizzicato strings', 45, 'gm_pizzicato_strings', 60, 0.8, 'plucked'),
    { decay: 0.5 }),
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
  synthBrass2: I('synth brass 2', 63, 'gm_synth_brass_2', 72, 0.6, 'brass'),
  sopranoSax: I('soprano sax', 64, 'gm_soprano_sax', 76, 0.6, 'wind'),
  altoSax: I('alto sax', 65, 'gm_alto_sax', 72, 0.6, 'wind'),
  tenorSax: I('tenor sax', 66, 'gm_tenor_sax', 60, 0.6, 'wind'),
  baritoneSax: I('baritone sax', 67, 'gm_baritone_sax', 48, 0.5, 'wind'),
  clarinet: I('clarinet', 71, 'gm_clarinet', 72, 0.65, 'wind'),
  flute: I('flute', 73, 'gm_flute', 84, 0.7, 'wind'),
  padWarm: E(I('warm pad', 89, 'gm_pad_warm', 60, 0.5, 'bowed'), PAD),
  // Fingered like a keyboard, but it is a struck metal bar and rings like one.
  celesta: E(I('celesta', 8, 'gm_celesta', 84, 1.0, 'keyboard'), { decay: 1.2, sustain: 0 }),

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
  //
  // Every one of these carries `PAD`, including the three filed under `mallet`.
  // The idiom is right about the *writing* — `fxCrystal` is figured in broken
  // chords like a bell — and wrong about the sound, because these are synth
  // patches with a slow front and a long tail, not struck bars. Giving them a
  // mallet's `sustain: 0` would cut a texture off at the knees.
  padNewAge: E(I('new age pad', 88, 'gm_pad_new_age', 60, 0.5, 'bowed'), PAD),
  padPoly: E(I('polysynth pad', 90, 'gm_pad_poly', 60, 0.6, 'bowed'), PAD),
  padChoir: E(I('choir pad', 91, 'gm_pad_choir', 60, 0.45, 'vocal'), PAD),
  padBowed: E(I('bowed pad', 92, 'gm_pad_bowed', 60, 0.45, 'bowed'), PAD),
  padMetallic: PAD_METALLIC,
  padHalo: E(I('halo pad', 94, 'gm_pad_halo', 60, 0.45, 'bowed'), PAD),
  padSweep: E(I('sweep pad', 95, 'gm_pad_sweep', 60, 0.5, 'bowed'), PAD),
  fxRain: E(I('rain', 96, 'gm_fx_rain', 72, 0.6, 'mallet'), PAD),
  fxSoundtrack: E(I('soundtrack', 97, 'gm_fx_soundtrack', 60, 0.5, 'bowed'), PAD),
  fxCrystal: E(I('crystal', 98, 'gm_fx_crystal', 79, 0.9, 'mallet'), PAD),
  fxAtmosphere: E(I('atmosphere', 99, 'gm_fx_atmosphere', 67, 0.7, 'bowed'), PAD),
  fxBrightness: E(I('brightness', 100, 'gm_fx_brightness', 72, 0.7, 'bowed'), PAD),
  fxGoblins: E(I('goblins', 101, 'gm_fx_goblins', 55, 0.5, 'bowed'), PAD),
  fxEchoes: E(I('echoes', 102, 'gm_fx_echoes', 72, 0.7, 'mallet'), PAD),
  fxSciFi: E(I('sci-fi', 103, 'gm_fx_sci_fi', 67, 0.6, 'bowed'), PAD),
  choirAahs: I('choir', 52, 'gm_choir_aahs', 64, 0.4, 'vocal'),
  voiceOohs: I('voices', 53, 'gm_voice_oohs', 64, 0.4, 'vocal'),
  synthChoir: I('synth choir', 54, 'gm_synth_choir', 64, 0.45, 'vocal'),
  churchOrgan: E(I('church organ', 19, 'gm_church_organ', 60, 0.7, 'keyboard'), ORGAN),
  reedOrgan: E(I('reed organ', 20, 'gm_reed_organ', 60, 0.7, 'keyboard'), ORGAN),
  // The bells shade against each other by a lot, not a little: a struck tube
  // rings for the better part of a bar, a music-box comb for a moment.
  tubularBells: E(I('tubular bells', 14, 'gm_tubular_bells', 72, 1.0, 'mallet'),
    { decay: 4.5, release: 0.8 }),
  musicBox: E(I('music box', 10, 'gm_music_box', 84, 1.0, 'mallet'), { decay: 0.9 }),
  kalimba: E(I('kalimba', 108, 'gm_kalimba', 72, 1.0, 'mallet'), { decay: 0.8 }),
  // Wood, not metal — a marimba bar is dead long before a vibraphone's is.
  marimba: E(I('marimba', 12, 'gm_marimba', 72, 1.0, 'mallet'), { decay: 0.9 }),
  leadSquare: E(I('square lead', 80, 'gm_lead_1_square', 72, 0.9, 'keyboard'), SYNTH_LEAD),
  leadSaw: E(I('saw lead', 81, 'gm_lead_2_sawtooth', 72, 0.9, 'keyboard'), SYNTH_LEAD),
  leadCalliope: I('calliope lead', 82, 'gm_lead_3_calliope', 72, 0.8, 'wind'),
  leadChiff: I('chiff lead', 83, 'gm_lead_4_chiff', 72, 0.8, 'wind'),
  leadVoice: I('voice lead', 85, 'gm_lead_6_voice', 72, 0.7, 'vocal'),
  leadCharang: E(I('charang lead', 84, 'gm_lead_5_charang', 72, 0.9, 'keyboard'), SYNTH_LEAD),
  /**
   * **This patch sounds a note nobody wrote.**
   *
   * GM 86 has the harmony baked into the programme: the engine writes one line
   * and the soundfont sounds a perfect fifth above every note of it. Two
   * consequences follow, and the second is the one that costs something.
   *
   * The part moves in parallel fifths by construction, and `parallel-perfects`
   * never sees a single one of them — the constraint engine is looking at one
   * voice, and one voice cannot make a parallel anything. Jazz penalises that
   * interval deliberately (see its rule table) and is silently exempted from its
   * own rule the moment this patch is drawn.
   *
   * And everything that measures this project — the score dump, `npm run check`,
   * the interval histograms, the concert's range assertions — reads the written
   * line. On this patch the written line is not what will be heard, so the
   * measurement is of a part that does not exist. Choose it where parallel
   * fifths *are* the sound, which is a 1980s lead and very little else, and
   * never choose it as the instrument you audit anything on.
   */
  leadFifths: E(I('fifths lead', 86, 'gm_lead_7_fifths', 72, 0.9, 'keyboard'), SYNTH_LEAD),
  // Two layers in one programme, a lead over a bass an octave down, which is
  // what a one-keyboard band used when there was nobody to play the bass line.
  // Centred with the other leads because the layer underneath follows the note
  // it is given; it is a lead that brings its own bottom, not a bass.
  leadBassLead: E(I('bass lead', 87, 'gm_lead_8_bass_lead', 72, 0.9, 'keyboard'), SYNTH_LEAD),
  fretlessBass: I('fretless bass', 35, 'gm_fretless_bass', 40, 0.7, 'bowed'),
  synthBass2: E(I('synth bass 2', 39, 'gm_synth_bass_2', 40, 0.85, 'keyboard'), SYNTH_BASS),
  cello: CELLO,
  contrabass: I('contrabass', 43, 'gm_contrabass', 40, 0.45, 'bowed'),
  // Sympathetic strings and a drone string of its own — the one plucked
  // instrument that already behaves like a pad.
  sitar: I('sitar', 104, 'gm_sitar', 60, 0.7, 'plucked'),
  panFlute: I('pan flute', 75, 'gm_pan_flute', 79, 0.6, 'wind'),
  shakuhachi: I('shakuhachi', 77, 'gm_shakuhachi', 74, 0.55, 'wind'),

  // --- Electric variants ---------------------------------------------------
  // An electric violin is not a different instrument. It is a violin — the same
  // box, the same four strings, the same bow arm — with a pickup under the
  // bridge and an amplifier after it, and everything that changed happened
  // downstream of the note. General MIDI has no programme for one, and the
  // tempting fix is to substitute a brighter patch and call it electric. That is
  // wrong twice over: the substitute writes a *different line*, because `idiom`
  // and `agility` travel with the patch, and it still is not an electric violin,
  // because what makes one is a signal path. So these carry the base's own `gm`
  // and `strudel` and say the rest as processing. See `Instrument.effects`.
  //
  // Ranges and idioms are inherited rather than restated, and that is the claim
  // the section is making rather than an economy: an amplifier does not extend a
  // fingerboard, and a phaser does not teach a bow to arpeggiate.
  electricViolin: FX(VIOLIN, 'electric violin', {
    // Enough that the amplifier is audibly working, and not enough to turn a
    // sustained bow stroke into a square wave. The amplified violin anyone can
    // actually picture — Jean-Luc Ponty's — is a nearly clean signal with the
    // gain structure pushed, not a fuzz box on a fiddle.
    drive: 0.35,
    // A shallow sweep, sitting behind the note rather than on it. Deep enough to
    // hear on a held bow, shallow enough that a fast passage is unaffected,
    // since a phaser only reveals itself on something long.
    phaser: 0.3,
    // The one field here that collides with the era tables, and it is meant to.
    // A bridge pickup hears the *string*; it never hears the body, and the body
    // is what rolls a violin off, a wooden box being a poor radiator at the top
    // of its range. Take the box out of the path and the bow's own edge arrives
    // intact. 8000 is chosen to cut both ways: brighter than any era's melody
    // ceiling in this project (ambient's darkest is 4800) and darker than its
    // brightest (10000), because an amplifier has a top end and an open window
    // does not.
    lowpass: 8000,
  }),
  electricCello: FX(CELLO, 'electric cello', {
    // Less than the violin gets, because drive does more damage lower down: the
    // harmonics it manufactures sit closer together down there and beat against
    // one another instead of adding edge. It is the same reason a bass player
    // runs less gain than the guitarist standing next to them.
    drive: 0.3,
    // And the sweep pulled back with it. A phaser works by notching the
    // spectrum, and a spectrum with its energy in the bottom two octaves has
    // fewer places to be notched before the note starts disappearing.
    phaser: 0.25,
  }),
  // Still `mallet`, still [53, 96], still centred at 72: it IS a vibraphone,
  // played with the same four mallets over the same three and a half octaves,
  // and the only thing that changed is what happens after the bars.
  electricVibes: FX(VIBRAPHONE, 'electric vibraphone', {
    // The lightest drive of the three, because a struck bar is a transient and
    // then very nearly a sine, and distortion has almost nothing to take hold
    // of. What it does take hold of is the strike. 0.2 grits the attack and
    // leaves the ring alone, which is the right way round.
    drive: 0.2,
    // The deepest sweep of the three, and the one instrument in the catalogue
    // where a phaser is not an effect at all: a vibraphone already has a motor
    // turning discs in its resonators to sweep the tone, and a phaser sweeping
    // the spectrum is the electric statement of that same gesture. It belongs
    // here more than it belongs on either of the strings.
    phaser: 0.45,
  }),
  // The 12-bit sampler pad. Ambient's `sampler` era promises "audible aliasing"
  // in its own docstring and has never had anything to produce it with.
  crushedPad: FX(PAD_METALLIC, 'crushed pad', {
    // Eight bits rather than the twelve the era's hardware actually had. A
    // 12-bit reduction of an already-clean soundfont is inaudible on a pad — the
    // grit has to survive a third of a second of attack and the best part of a
    // second of tail — and `Effects.crush` documents 8 as where grit begins and
    // 6 as where it stops being usable.
    crush: 8,
  }),
} satisfies Record<string, Instrument>;

export type InstrumentId = keyof typeof INSTRUMENTS;

/**
 * The notes each instrument can actually play, as MIDI numbers.
 *
 * This lives here, next to `centre` and `agility`, because a playable range is
 * a *musical* fact — the same kind of fact as "a trombone cannot leap a tenth".
 * It was written for the concert stage, which needs it to put a hand somewhere,
 * and only then did it become obvious that the generator had been missing it
 * all along.
 *
 * What it caught: a clarinet handed the `pad` layer was being written down to
 * C2, an octave and a half below the instrument, on 31% of its notes; a
 * vibraphone comping went below its bottom F on 7%. Both are inaudible as
 * *wrong* — a soundfont plays whatever it is sent — but a clarinet patch at C2
 * does not sound like a clarinet, which is the whole reason for choosing one.
 * `centre` was never enough: it says where a part should sit, not where the
 * instrument stops.
 *
 * A note below the floor is folded up an octave rather than dropped, which is
 * what an arranger does with a voicing that runs off the bottom of the horn.
 */
export const INSTRUMENT_RANGE: Record<InstrumentId, readonly [Midi, Midi]> = {
  accordion: [41, 93],
  bandoneon: [41, 93],
  harmonica: [60, 96],
  piano: [21, 108],
  epiano1: [28, 103],
  epiano2: [28, 103],
  clavinet: [28, 103],
  vibraphone: [53, 96],
  glockenspiel: [53, 96],
  drawbarOrgan: [24, 96],
  rockOrgan: [24, 96],
  percussiveOrgan: [24, 96],
  nylonGuitar: [40, 83],
  steelGuitar: [40, 83],
  jazzGuitar: [40, 86],
  cleanGuitar: [40, 86],
  mutedGuitar: [40, 86],
  overdriveGuitar: [40, 86],
  distortionGuitar: [40, 86],
  acousticBass: [28, 67],
  fingerBass: [28, 63],
  pickBass: [28, 63],
  slapBass: [28, 63],
  synthBass: [21, 108],
  violin: [55, 96],
  fiddle: [55, 96],
  tremoloStrings: [36, 96],
  pizzStrings: [36, 96],
  harp: [24, 103],
  strings1: [36, 96],
  strings2: [36, 96],
  synthStrings: [36, 96],
  synthStrings2: [36, 96],
  trumpet: [52, 86],
  trombone: [34, 80],
  mutedTrumpet: [52, 86],
  brassSection: [36, 84],
  synthBrass: [36, 84],
  // A keyboard's reach rather than a brass section's, unlike `synthBrass` above.
  // GM 63 is the fatter, slower of the two synth-brass programmes and the one
  // that gets used as a pad; capping it at a trumpet section's top would forbid
  // exactly the register it is chosen for.
  synthBrass2: [21, 108],
  sopranoSax: [56, 88],
  altoSax: [49, 89],
  tenorSax: [44, 84],
  baritoneSax: [37, 76],
  clarinet: [50, 91],
  flute: [59, 96],
  padWarm: [21, 108],
  celesta: [28, 103],
  padNewAge: [21, 108],
  padPoly: [21, 108],
  padChoir: [21, 108],
  padBowed: [21, 108],
  padMetallic: [21, 108],
  padHalo: [21, 108],
  padSweep: [21, 108],
  fxRain: [21, 108],
  fxSoundtrack: [21, 108],
  fxCrystal: [21, 108],
  fxAtmosphere: [21, 108],
  fxBrightness: [21, 108],
  fxGoblins: [21, 108],
  fxEchoes: [21, 108],
  fxSciFi: [21, 108],
  choirAahs: [21, 108],
  voiceOohs: [21, 108],
  synthChoir: [21, 108],
  churchOrgan: [24, 96],
  reedOrgan: [24, 96],
  tubularBells: [53, 96],
  musicBox: [53, 96],
  kalimba: [53, 96],
  marimba: [53, 96],
  leadSquare: [21, 108],
  leadSaw: [21, 108],
  leadCalliope: [21, 108],
  leadChiff: [21, 108],
  leadVoice: [21, 108],
  leadCharang: [21, 108],
  leadFifths: [21, 108],
  leadBassLead: [21, 108],
  fretlessBass: [28, 63],
  synthBass2: [21, 108],
  cello: [36, 81],
  contrabass: [28, 67],
  sitar: [48, 80],
  panFlute: [59, 96],
  shakuhachi: [59, 96],
  // The electric variants take their acoustic base's range exactly. A pickup
  // does not add a string and an amplifier does not add a bar.
  electricViolin: [55, 96],
  electricCello: [36, 81],
  electricVibes: [53, 96],
  crushedPad: [21, 108],
};

/**
 * What an instrument's *other hand* can do.
 *
 * These numbers used to live on the style, as five fields of `TwoHandedKeys`,
 * and they were wrong there in a way that only became visible when a second
 * instrument wanted them. How low a left hand goes, how many notes it can hold
 * and how it stacks them are facts about the instrument: a vibraphonist's left
 * hand holds two mallets in a ballad and in a bebop head alike, and no style
 * decision changes that. Leaving them on the style meant every new style
 * restated the piano's anatomy, and meant a style could not offer a choice of
 * lead at all — the numbers only described one of them.
 *
 * The three instruments here differ in every field, which is the argument for
 * the table existing:
 *
 *  - A **piano** left hand plays a rootless shell — third, seventh and a colour,
 *    no root, because there is a bass player four feet away whose entire job is
 *    the root. It is the single most recognisable sound in post-war jazz piano.
 *  - A **vibraphone** left hand is *two mallets*. Not a hand with fingers: two
 *    notes, maximum, and both of them inside a three-and-a-half octave
 *    instrument whose bottom bar is F3 — so a piano's octave of daylight and its
 *    A2 floor are both off the end of the instrument.
 *  - An **accordion** left hand is on the button side, and stradella buttons
 *    play a root-position triad with the bass note under it. It is the exact
 *    opposite of rootless, and voicing it `guide` would produce a sound the
 *    instrument physically cannot make.
 *
 * `ceiling` is where the accordion earns its entry twice over. The button side
 * ends at F3 and the choreographer splits the two hands there — see
 * `ACCORDION_BUTTON_TOP` in `concert/choreograph.ts` — so a left hand placed by
 * daylight alone would be voiced up on the right-hand keyboard, and staged
 * there too, with one player's two hands overlapping on the same manual.
 */
export interface HandSpec {
  /**
   * Where the *right hand* sits, as a MIDI note, overriding `Instrument.centre`.
   *
   * It has to override: the catalogue's piano sits at middle C because that is
   * where a *comping* piano sits, in the middle of the keyboard with both hands
   * round it. A pianist fronting a trio plays the tune an octave above that, and
   * the octave they vacate is what the left hand comps in. Take the catalogue
   * number and there is nowhere for the left hand to go except into the bass
   * player's register.
   */
  lead: Midi;
  /** The bottom of the left hand's world. */
  floor: Midi;
  /** The top of it, before the daylight rule is even consulted. */
  ceiling: Midi;
  /**
   * How much room the left hand gets to voice and move in, in semitones. Wide
   * enough that the voicing leads by step rather than leaping an octave every
   * time the harmony does.
   */
  window: number;
  /** Notes in a left-hand voicing. Three is the rootless shell; two is a pair of mallets. */
  voices: number;
  /**
   * Semitones of daylight kept between the top of the left hand and the right
   * hand above it.
   *
   * Both a musical and a physical number, and it is the physical one that binds.
   * A pianist's left hand really does sit an octave or so below the line, and a
   * gap smaller than one hand's stretch would let the choreographer read the two
   * as a single chord for one hand — which is true of a real keyboard as well,
   * and is exactly why a real pianist does not voice there.
   *
   * It is also the number that gets the line back out of the finished track. See
   * `melodicLine` in `core/types.ts`: everything that measures melody depends on
   * the two hands being separable by this distance, so a mode that voices closer
   * than this does not merely sound wrong, it makes the part unmeasurable.
   */
  gap: number;
  /** How the left hand stacks a chord. */
  voicing: VoicingStyle;
  /**
   * Can this hand play a *line*, or only chords?
   *
   * True of every hand with fingers or mallets on it and false of exactly one
   * thing in the catalogue, which is why it is worth a field: an accordion's
   * left hand is a grid of buttons that each sound a fixed chord, so it can no
   * more play a unison line than a foot pedal can. Asking it to would not sound
   * bad — it would sound like an instrument that does not exist.
   *
   * `chooseLeftHandMode` reads this to drop `unison` from the draw rather than
   * letting it be chosen and then quietly produce nothing.
   */
  melodic: boolean;
}

export const HANDS: Partial<Record<InstrumentId, HandSpec>> = {
  // C5 for the tune, a minor seventh of daylight, the rootless shell beneath.
  piano: { lead: 72, floor: 45, ceiling: 72, window: 14, voices: 3, gap: 10, voicing: 'guide', melodic: true },
  epiano1: { lead: 72, floor: 45, ceiling: 72, window: 14, voices: 3, gap: 10, voicing: 'guide', melodic: true },
  epiano2: { lead: 72, floor: 45, ceiling: 72, window: 14, voices: 3, gap: 10, voicing: 'guide', melodic: true },
  // Two mallets, a fifth of daylight, and a floor on the instrument rather than
  // under it. The narrower gap is not a compromise: a vibraphonist's hands work
  // within arm's reach of each other on one row of bars, where a pianist's are
  // at opposite ends of eighty-eight keys.
  vibraphone: { lead: 79, floor: 55, ceiling: 72, window: 12, voices: 2, gap: 7, voicing: 'guide', melodic: true },
  marimba: { lead: 79, floor: 55, ceiling: 72, window: 12, voices: 2, gap: 7, voicing: 'guide', melodic: true },
  // The button side: a full triad with its own root, below the split, and an
  // octave of daylight because that is where the buttons are.
  accordion: { lead: 74, floor: 41, ceiling: 52, window: 11, voices: 3, gap: 12, voicing: 'tertian', melodic: false },
  bandoneon: { lead: 74, floor: 41, ceiling: 52, window: 11, voices: 3, gap: 12, voicing: 'tertian', melodic: false },
  // A string per note and no fretting hand, so both hands pluck freely. Voiced
  // in fourths, which is the one thing a harp does that a piano has to work at.
  harp: { lead: 79, floor: 48, ceiling: 67, window: 16, voices: 3, gap: 10, voicing: 'quartal', melodic: true },
  /**
   * The synthesiser's left hand, and it is a *line* rather than a shell.
   *
   * Every other entry here comps: a pianist's left hand voices a chord under
   * the tune. A synthesiser's does not, and the reason is the instrument. Half
   * the leads this genre reaches for were monophonic — a Minimoog plays one
   * note at a time whatever your fingers do — so a three-note rootless voicing
   * under the melody is an arrangement the object cannot produce. What one
   * player at one synthesiser actually did is the thing this genre is famous
   * for: a bass figure in the left hand and the theme in the right. Carpenter,
   * Vangelis, half of Tangerine Dream.
   *
   * So `voices: 2` and `melodic: true`, which is a line with the odd fifth
   * under it rather than a chord. The floor is 33 because a synthesiser reaches
   * where a piano's left hand does not care to go, and the gap is wide for the
   * same reason it is wide on a piano — `melodicLine` has to be able to pull the
   * two apart again, and these two are further apart than any acoustic pair.
   */
  leadVoice: { lead: 79, floor: 33, ceiling: 55, window: 12, voices: 2, gap: 14, voicing: 'quartal', melodic: true },
  leadSaw: { lead: 79, floor: 33, ceiling: 55, window: 12, voices: 2, gap: 14, voicing: 'quartal', melodic: true },
  leadSquare: { lead: 76, floor: 33, ceiling: 55, window: 12, voices: 2, gap: 14, voicing: 'quartal', melodic: true },
};

/**
 * The range of an instrument you have the object for rather than the key.
 *
 * `chooseInstruments` hands the generator `Instrument` values, not catalogue
 * ids, and threading ids through every call site to reach a two-number table
 * would be a lot of churn for no clarity. Names are unique across the
 * catalogue — asserted below, because the day that stops being true this would
 * fail silently and quietly re-range an instrument.
 */
const BY_NAME = new Map<string, readonly [Midi, Midi]>();
for (const [id, entry] of Object.entries(INSTRUMENTS) as [InstrumentId, Instrument][]) {
  if (BY_NAME.has(entry.name)) throw new Error(`duplicate instrument name "${entry.name}"`);
  BY_NAME.set(entry.name, INSTRUMENT_RANGE[id]);
}

export function rangeOfInstrument(instrument: Instrument): readonly [Midi, Midi] {
  return BY_NAME.get(instrument.name) ?? [0, 127];
}

/**
 * Fold a note up by octaves until the instrument can reach it.
 *
 * Octaves rather than clamping: an octave transposition of a chord tone is
 * still that chord tone, so the harmony survives untouched. Clamping to the
 * bottom note would turn a voicing into a cluster on the instrument's lowest
 * pitch, which is a worse sound than the one being fixed.
 */
export function foldIntoRange(midi: Midi, range: readonly [Midi, Midi]): Midi {
  const [lo, hi] = range;
  let n = midi;
  while (n < lo && n + 12 <= hi) n += 12;
  while (n > hi && n - 12 >= lo) n -= 12;
  return n;
}
