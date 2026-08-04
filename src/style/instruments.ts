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
  /**
   * Where it sits when it is carrying the *tune*, if that is somewhere else.
   *
   * `centre` is a **section** register — where an instrument sits playing a part
   * in an arrangement — and it was being read as a lead register too. For most
   * of the catalogue those are the same note and the field is absent. For
   * thirteen entries they were not, and every one of them was a horn, a guitar
   * or a keyboard parked at middle C: the value a catalogue gives an instrument
   * it has no strong opinion about.
   *
   * The cost was not in the tune, which sounded fine an octave low. It was in
   * **the piano behind it**. The arranger reserves the lead's tessitura and puts
   * the accompaniment underneath, so the comp's ceiling lands around
   * `leadCentre - 5`; and a four-note guide voicing cannot exist below about 66,
   * because under C4 the low-interval limits forbid the spacing. A lead at 60
   * therefore leaves a comper nowhere to play, and it showed: measured across
   * forty blues songs, a comp under a tenor sax averaged **2.74 voices** against
   * **3.73** under a clarinet — a whole voice, decided by nothing but which
   * instrument the palette happened to deal.
   *
   * The idea is not new here, only its scope. `HandSpec.lead` has always said
   * this about two-handed keyboards — a piano is a piano wherever it is playing,
   * and a piano *fronting a trio* is a piano an octave higher — and the two
   * agree on 72 rather than competing.
   *
   * Not a correction to `centre`, and the distinction matters: a tenor comping
   * behind a singer really does sit where it always did. This is only consulted
   * for the player holding the line. See `chooseInstruments`.
   */
  lead?: number;
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
  /**
   * How this instrument sits in a mix, over and above how loud it is. Absent
   * means 1, which is where every entry starts.
   *
   * ## Why this is not `Genre.mix`, and not `SOUNDFONT_LEVEL` either
   *
   * There are now three numbers between a part and its level, and keeping them
   * apart is the whole point of having three:
   *
   *  - `SOUNDFONT_LEVEL` — **measured.** What webaudiofont's conversion of this
   *    program actually outputs, off a K-weighted meter. Audition-only, because
   *    it is a fact about a sample pack rather than about music, and a `.mid`
   *    handed to another synth must not carry it.
   *  - `Genre.mix` — **the role.** How far forward the *tune* sits in this
   *    genre, whatever is carrying it. A statement about arrangement.
   *  - this — **the object.** How an accordion sits when an accordion is the
   *    thing playing, in any genre that deals it.
   *
   * The fault that makes the third one necessary is the one `source-levels.ts`
   * opens by describing, moved up a layer. `mix.melody` has to be simultaneously
   * right for a trumpet, a harp and a square-wave lead; pulling it down because
   * *this* song's accordion was hot quietly moves the vibraphone and the
   * clarinet too, and the next song in the same genre is wrong in the other
   * direction. A per-instrument trim is the only place that judgement can be
   * recorded without libelling the rest of the palette.
   *
   * ## Global on purpose
   *
   * No genre dimension, for the same reason `SOUNDFONT_LEVEL` has none: if an
   * accordion is hot, it is hot in humppa and in tango and in whatever else
   * reaches for one. A genre that genuinely wants its accordion further back
   * than everyone else's is making a statement about the arrangement, and
   * `Genre.mix` is where arrangement lives.
   *
   * ## What it is *not* for
   *
   * Three things sound like "this instrument is too loud" and only the third
   * belongs here.
   *
   * An **unmeasured font** — 29 of the catalogue's soundfonts have no entry in
   * `SOUNDFONT_LEVEL` and play at whatever the pack captured. A number typed
   * here for one of those is a guess standing in a measurement's place, and it
   * will be wrong by however much the measurement would have differed.
   *
   * An **unmeasured register** — `REGISTER_LEVEL` covers six fonts. An
   * instrument that is loud in one octave and not another needs a range table,
   * not a constant: the accordion's own entry says 44% of its notes sit 1.9 to
   * 3.9 dB under the pitch its trim was taken at, and a flat trim tuned in one
   * of those zones is wrong in the other.
   *
   * What is left after both of those is the real thing: two sources matched to
   * the same loudness do not sit the same way in a mix. Equal LUFS is not equal
   * *place* — masking and spectral crowding decide that, and no meter reports
   * them. That residual is per-instrument, it is global, and it is exactly what
   * this field is.
   *
   * Applied in the generator rather than in `render/strudel.ts`, and that is the
   * other half of the distinction: this is a musical judgement about balance, so
   * it belongs in the IR and travels to the MIDI and to any native engine. The
   * measured trim stays in the renderer, because the next engine will have its
   * own samples and will need its own measurements.
   */
  gain?: number;
}

const I = (
  name: string, gm: number, strudel: string, centre: number,
  agility = 0.7, idiom: Idiom = 'vocal',
): Instrument => ({ name, gm, strudel, centre, idiom, agility });

/** The same instrument, up where it plays a tune. See `Instrument.lead`. */
const L = (instrument: Instrument, lead: number): Instrument => ({ ...instrument, lead });

/** An instrument that does not ring the way its idiom rings. */
const E = (instrument: Instrument, envelope: Partial<Envelope>): Instrument =>
  ({ ...instrument, envelope });

/** The same instrument through a pickup and an amp. See `Instrument.effects`. */
const FX = (instrument: Instrument, name: string, effects: Effects): Instrument =>
  ({ ...instrument, name, effects });

/**
 * The same instrument, sitting where it belongs in a mix. See `Instrument.gain`.
 *
 * Unused as this is written, and that is the honest state to leave it in: the
 * field exists so a judgement made at the mix bench has somewhere to be
 * recorded, and nobody has made one yet. An entry appearing here later should
 * be a balance somebody heard, not a measurement somebody skipped.
 */
export const G = (instrument: Instrument, gain: number): Instrument =>
  ({ ...instrument, gain });

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
/**
 * A cello comps and doubles the bass down here and sings a single line up the A
 * string, which is the same instrument in two places and exactly what `lead` is
 * for — the guitar's argument below, on four strings instead of six.
 *
 * The catalogue did not know it, and the omission was total rather than
 * marginal. Measured over 112 concerts: 28 castings, 24 of them on the bass
 * layer, and the part tops out at E3. Of 6,966 notes on those castings, 92% are
 * on the bottom two strings and none of them is on the A string at all. The
 * fingering chooser was never the fault — hand it a line written at 62–77, as
 * the classical and arabic counter parts already do, and it shifts into fourth
 * and seventh position under the same code. A cellist never shifted because a
 * cellist was never given the tune anywhere that required it.
 *
 * **67, and not the 64 the tessitura asks for.** 64 was the obvious answer and
 * it is the wrong one: it sits under the floor this field's own docstring states
 * and the bassoon two hundred lines below restates — beneath about 66 a
 * four-note guide voicing has nowhere to sit, so a lead put there leaves the
 * comper with no chord to play. That floor is measured rather than inherited.
 * Across 960 songs in the eight eras whose melody palette can deal a cello, 70
 * of which did, the comp under a cello lead voiced **1.64 notes against 2.08
 * under everything else**; at 64 it recovers to 1.75, at 66 to 1.87, at 67 to
 * 1.96, which is inside the noise. 64 would have fixed a quarter of the fault
 * the field exists to fix and looked like a fix. 66 and 67 write the *same
 * tune* — 65 to 74 at the tenth and ninetieth centiles either way — so the
 * higher one costs nothing and buys the rest of the voice.
 *
 * It is also where the other two tenors already are. The trombone and the horn
 * both carry `lead` 67 over a section centre of 60, for the reason a cello has
 * in a stronger form: the middle of the texture and the front of it are not the
 * same register, and the gap is about a fifth. G4 is the first finger in seventh
 * position, where the thumb comes over the shoulder — a cello's singing note,
 * not a stunt.
 *
 * Nothing is folded away at the top. The A string carries two octaves to A5 and
 * `INSTRUMENT_RANGE` says so; the tune reaches G5 with a whole tone spare, and 0
 * of 6,800 notes leave [36, 81] at any candidate tried. 69 saturates it, which
 * is where the argument stops.
 *
 * The electric twin at the foot of the table spreads this object and so shifts
 * with it. No palette gives that one a melody, so today it changes nothing —
 * which is the section docstring above being right rather than a reason to pin
 * the two apart.
 */
const CELLO = L(I('cello', 42, 'gm_cello', 52, 0.5, 'bowed'), 67);
const VIBRAPHONE = I('vibraphone', 11, 'gm_vibraphone', 72, 1.0, 'mallet');
const PAD_METALLIC = E(I('metallic pad', 93, 'gm_pad_metallic', 60, 0.5, 'bowed'), PAD);

export const INSTRUMENTS = {
  accordion: I('accordion', 21, 'gm_accordion', 72, 0.8, 'reed'),
  bandoneon: I('bandoneon', 23, 'gm_bandoneon', 72, 0.8, 'reed'),
  harmonica: I('harmonica', 22, 'gm_harmonica', 72, 0.6, 'wind'),
  // 72 for the tune, and it is the number `HANDS` already uses: a pianist
  // fronting a group plays an octave above where they comp, whether or not the
  // style has told them to use both hands.
  piano: L(I('piano', 0, 'gm_piano', 60, 1.0, 'keyboard'), 72),
  epiano1: L(I('electric piano', 4, 'gm_epiano1', 60, 1.0, 'keyboard'), 72),
  epiano2: L(I('electric piano 2', 5, 'gm_epiano2', 60, 1.0, 'keyboard'), 72),
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
  // A guitar comps in first position and plays a single-line head up the neck,
  // which is the same instrument in two places and exactly what `lead` is for.
  nylonGuitar: L(I('nylon guitar', 24, 'gm_acoustic_guitar_nylon', 60, 0.8, 'plucked'), 71),
  steelGuitar: L(I('steel guitar', 25, 'gm_acoustic_guitar_steel', 60, 0.8, 'plucked'), 71),
  jazzGuitar: L(I('jazz guitar', 26, 'gm_electric_guitar_jazz', 60, 0.85, 'plucked'), 71),
  cleanGuitar: L(I('clean electric guitar', 27, 'gm_electric_guitar_clean', 60, 0.8, 'plucked'), 71),
  // Palm-muted: the string is damped by the hand that struck it.
  mutedGuitar: L(E(I('muted guitar', 28, 'gm_electric_guitar_muted', 60, 0.8, 'plucked'),
    { decay: 0.25 }), 71),
  // Overdrive is a clean note pushed into an amplifier that has run out of
  // headroom. The string still decays like a string, so this takes the plucked
  // envelope untouched.
  // Same neck as the clean one, so the same 71. An amplifier does not move where
  // a guitarist plays a lead.
  overdriveGuitar: L(I('overdriven guitar', 29, 'gm_overdriven_guitar', 60, 0.8, 'plucked'), 71),
  // Distortion is the same process taken far enough to compress, and compression
  // is what abolishes the decay: the note holds at level until the player damps
  // it. Two and a half seconds against the plucked default's one is the whole
  // difference between a chord and a power chord.
  distortionGuitar: L(E(I('distortion guitar', 30, 'gm_distortion_guitar', 60, 0.8, 'plucked'),
    { decay: 2.6 }), 71),
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
  // The most conservative lift in the table, and deliberately so. A trombone
  // section part sits at middle C and a trombone *solo* sits around B♭3–B♭4 —
  // which is a fifth up, not an octave. Pushing it further would buy the comp
  // another half-voice by writing for an instrument nobody plays.
  trombone: L(I('trombone', 57, 'gm_trombone', 60, 0.4, 'brass'), 67),
  mutedTrumpet: I('muted trumpet', 59, 'gm_muted_trumpet', 72, 0.45, 'brass'),
  brassSection: I('brass section', 61, 'gm_brass_section', 72, 0.4, 'brass'),
  synthBrass: I('synth brass', 62, 'gm_synth_brass_1', 72, 0.6, 'brass'),
  synthBrass2: I('synth brass 2', 63, 'gm_synth_brass_2', 72, 0.6, 'brass'),
  sopranoSax: I('soprano sax', 64, 'gm_soprano_sax', 76, 0.6, 'wind'),
  altoSax: I('alto sax', 65, 'gm_alto_sax', 72, 0.6, 'wind'),
  // The head sits around D4–D5. Middle C is the bottom of the horn's useful
  // voice, not the middle of it — the alto next to it was already at 72.
  tenorSax: G(L(I('tenor sax', 66, 'gm_tenor_sax', 60, 0.6, 'wind'), 72), 0.74),
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

  // --- The orchestra -------------------------------------------------------
  // What the catalogue had was a violin, a cello, a flute, a clarinet, a
  // trumpet and a trombone. That is a dance band with the rhythm section taken
  // out, and it is missing precisely the middle of an orchestra: the double
  // reeds that carry a slow movement, the horn that is the hinge between the
  // woodwind and the brass, the viola that fills the fifth of daylight between
  // the violin's G string and the cello's A, and the drums that are the only
  // thing in the room allowed to play two notes all evening.
  //
  // Every entry down to `steinway` is a General MIDI programme that Strudel has
  // always shipped and this project had simply never named. None of them needs
  // a sample library, and each one is a genre that could not previously be
  // written rather than a shade on one that could.

  // The instrument the orchestra tunes to, because a reed that narrow cannot be
  // lipped far enough to hide: an oboe's A is the same A every night. The same
  // narrowness sets the agility below a flute's — the fingering is full of
  // forked and half-holed notes, and a player does not take those at speed
  // across a leap. Sits high because that is where the tune is written for it;
  // an oboe in its bottom fourth is a goose, and every orchestrator knows it.
  oboe: I('oboe', 68, 'gm_oboe', 76, 0.55, 'wind'),
  // An oboe a fifth lower, and the register is the entire reason to write for
  // one: the Largo of the New World and the shepherd in Act III of Tristan are
  // both this instrument in the octave where the oboe's edge has gone and
  // something plainer is left behind. It transposes, and the numbers here are
  // what is *heard* — like every other number in this table, and worth saying
  // because a cor anglais part on paper looks a fifth higher than this.
  englishHorn: I('english horn', 69, 'gm_english_horn', 69, 0.55, 'wind'),
  // The bass of the woodwind that keeps being asked to be its tenor. `centre`
  // is the section job — doubling the cellos, under everything — and `lead` is
  // the other one, and the gap between them is why this entry needs both.
  //
  // 66 rather than the 60 the tessitura would suggest, and the repertoire
  // agrees with the arranger's floor for once: the opening of the Rite is a
  // bassoon parked at the very top of the instrument, around C4 to C5, whose
  // midpoint is 66 — which is also, per `Instrument.lead`, the lowest note a
  // four-note guide voicing can sit under. A lead written at 60 would leave the
  // comp nowhere to go, and would also not be where anybody writes a solo.
  bassoon: L(I('bassoon', 70, 'gm_bassoon', 50, 0.5, 'wind'), 66),
  // The hardest instrument in the orchestra to play accurately, and the agility
  // is the reason rather than a slur: a horn's harmonics are packed so close
  // together in its working register that the lip chooses between neighbours
  // that are a tone apart. That is what a cracked note *is*, and it is why horn
  // writing is stepwise even when nothing else in the score is.
  //
  // The same conservative lift the trombone gets, and for the same argument. A
  // horn section part sits at middle C; the famous solos — the Mozart concertos,
  // the Nocturne of the Midsummer Night's Dream — sit around a fifth above it,
  // not an octave, because the octave above that is where the cracking starts.
  frenchHorn: L(I('french horn', 60, 'gm_french_horn', 60, 0.45, 'brass'), 67),
  // The lowest agility in the catalogue, under even the trombone's. A tuba
  // mouthpiece is the size of a teacup and a leap is not an embouchure change so
  // much as a different aperture of the whole face; the instrument's literature
  // is bass lines and pedal notes for exactly that reason.
  tuba: I('tuba', 58, 'gm_tuba', 40, 0.35, 'brass'),
  // Sounds an octave above the written part, so 91 is a G6 and it really is
  // that high. This is the one entry in the table where the `centre` is doing
  // safety work as well as musical work: a piccolo is the loudest thing in an
  // orchestra by a wide margin, and a part that strays into its top fifth stops
  // being a line and becomes an alarm.
  piccolo: I('piccolo', 72, 'gm_piccolo', 91, 0.7, 'wind'),
  // Not a large violin, whatever the shape suggests. The C string is the point
  // of the instrument — it is the only note in the string section between the
  // violin's floor and the cello's, and a viola part that never goes below G3
  // is a second violin part that has been transposed. `centre` at 67 rather
  // than the violin's 76 is what makes it use that string.
  viola: I('viola', 41, 'gm_viola', 67, 0.55, 'bowed'),
  // Four drums and a foot, and the *range* is what says so — a nineteen
  // semitone window is not a restriction on this entry, it is the instrument.
  // The mallet idiom is right about everything except the arpeggios: what a
  // timpanist actually plays is tonic, dominant and a roll, and there is no
  // idiom for that. What the family does get right is `repeat: 1.0`, which is
  // most of a timpani part, and a struck-and-ringing envelope — lengthened here
  // because a pedal drum with the head undamped sings for a full bar, which is
  // three times what a vibraphone bar manages.
  timpani: E(I('timpani', 47, 'gm_timpani', 45, 0.9, 'mallet'),
    { decay: 3.2, release: 0.6 }),
  // Fingered like a piano and voiced like nothing else: a quill plucks the
  // string and a felt damper on the same jack stops it the moment the key comes
  // up. The consequences are the two facts every baroque arranger works around
  // — there are no dynamics, because the pluck is the same however hard the
  // finger falls, and there is no pedal, because there is nothing to lift. The
  // keyboard idiom's two-second tail would make this a soft-toned piano;
  // `sustain: 0` into a fast decay is the plucked string it actually has. The
  // same override the clavinet takes, from the opposite century.
  harpsichord: L(E(I('harpsichord', 6, 'gm_harpsichord', 60, 1.0, 'keyboard'),
    { decay: 0.9, sustain: 0 }), 72),
  // The alto in F, which is the recorder anybody means by "recorder" once the
  // music is not for schoolchildren: Telemann and Handel wrote for this one.
  // `gm_recorder` rather than VCSL's sampled baroque alto on purpose — see the
  // sampled entries below — because here the General MIDI programme genuinely
  // *is* the instrument, and a catalogue entry that is silent until another
  // system lands is a worse trade than a slightly plain sample.
  recorder: I('recorder', 74, 'gm_recorder', 76, 0.6, 'wind'),
  // Rosewood with no resonator worth the name: the shortest note in the mallet
  // family by a long way, and the reason a xylophone reads as articulation
  // where a marimba reads as harmony. 0.35 against the marimba's 0.9 is the
  // whole difference, and it is why the same written line sounds like a tune on
  // one and like a woodblock melody on the other.
  xylophone: E(I('xylophone', 13, 'gm_xylophone', 84, 1.0, 'mallet'),
    { decay: 0.35 }),
  // A whole orchestra playing one chord, sampled, and then played from a
  // keyboard — which is why it is filed under `brass` rather than `keyboard`.
  // The idiom is about figuration, and the figuration of an orchestra hit is
  // four notes and a silence: sparse, narrow, and needing more air than
  // anything else in the table. It is a stab, and a stab that arpeggiates is a
  // sample loop.
  //
  // The envelope is not the idiom's, because this is a recording of an event
  // rather than a note anybody is holding. It decays to nothing in half a
  // second whatever the score says, and pretending otherwise stretches one
  // orchestral attack across a bar.
  orchestraHit: E(I('orchestra hit', 55, 'gm_orchestra_hit', 60, 0.6, 'brass'),
    { attack: 0.004, decay: 0.55, sustain: 0, release: 0.2 }),

  // --- Sampled, rather than synthesised ------------------------------------
  // The four entries below carry a **VCSL sample-set name** in `strudel` and a
  // General MIDI programme in `gm`, and that split is the point of the two
  // fields existing separately. The MIDI file still renders through a soundfont
  // that every player on earth has; the browser audition gets a recording of the
  // actual instrument.
  //
  // Each one is here because the General MIDI programme is *not the object*.
  // GM has no kantele and no balafon at all, and its church organ is one
  // registration of an instrument whose whole art is choosing between them. The
  // Steinway is the softest case and still a real one: `gm_piano` is a piano,
  // and a concert grand recorded close in a hall is the piano a classical piece
  // is written for.
  //
  // They are silent in the browser until `web/audio.ts` loads the VCSL
  // manifest, which is another system's file. The MIDI renderer is unaffected.

  // The Finnish zither, and the instrument an entire genre is built on. VCSL
  // has no kantele; it has a bowed-and-plucked psaltery, which is the same idea
  // — a shallow soundbox with a string per note and no stopping hand at all —
  // and its plucked articulation is the right one. GM 46, the orchestral harp,
  // is the honest MIDI fallback for the same reason.
  //
  // Fifteen strings, G3 to G5, rather than the 38-string concert instrument:
  // the runo repertoire is the small one, and it is also very nearly what the
  // sample set covers. The long decay is the fact that matters most and the one
  // a harp envelope would hide — a kantele has no dampers whatever, so the
  // strings go on ringing into each other, and that wash is what the sound is.
  kantele: E(I('kantele', 46, 'psaltery_pluck', 67, 1.0, 'plucked'),
    { decay: 2.6, release: 0.6 }),
  // Full plenum: the sound of a building. Against GM 19, which is one sampled
  // registration standing in for an instrument whose entire art is choosing
  // between them — which is why there are two of these and only one of most
  // things. A toccata and a hymn are not the same organ, and until now the
  // catalogue could only play one of them.
  pipeOrgan: E(I('pipe organ', 19, 'pipeorgan_loud', 55, 0.7, 'keyboard'), ORGAN),
  // Eight-foot flutes and nothing else, which is the registration a gospel
  // organ sits under a singer on and the one a chorale is accompanied with. It
  // centres an octave above the plenum because a quiet stop is a voice in the
  // texture rather than the floor of it.
  pipeOrganQuiet: E(I('pipe organ, soft stops', 19, 'pipeorgan_quiet', 60, 0.7, 'keyboard'),
    ORGAN),
  // The concert grand, recorded close. Everything else about it is the piano's
  // — same reach, same idiom, same two hands, and the `HANDS` entry below is
  // the piano's numbers restated rather than new ones, because it is the same
  // anatomy. What differs is a hall and a lid, and those live in the sample.
  steinway: L(I('concert grand', 0, 'steinway', 60, 1.0, 'keyboard'), 72),

  // --- Outside the western orchestra ---------------------------------------
  // Four General MIDI programmes in the 104–111 "ethnic" block that the
  // catalogue has never drawn on, next to the sitar it already had. The block
  // is a crude gesture at four continents and these are the four entries in it
  // that are genuinely a *different instrument* rather than a filter on a
  // guitar, which is why the rest of it stays unused.

  // The shehnai: a conical double reed played at weddings and at dawn, and the
  // voice of a north Indian film score. Louder and more nasal than an oboe and
  // played with far more bend between the notes than this project can yet
  // write, so what it contributes for now is the timbre and the tessitura.
  shanai: I('shehnai', 111, 'gm_shanai', 72, 0.6, 'wind'),
  // Struck strings under two hammers, and the ancestor of the piano rather than
  // a relative of the guitar — which is why it is `mallet` and not `plucked`.
  // The instrument covers a great deal of ground under one name: the Persian
  // santur, the Greek santouri, the Hungarian cimbalom and the Appalachian
  // hammered dulcimer are one design at four sizes, so it is available to the
  // Arabic palette and to the country one at once.
  //
  // No dampers, again, and here it is even more consequential than on the
  // kantele because the strings are struck: every note of a fast passage is
  // still sounding when the next arrives, and the resulting haze is the whole
  // character. 2.4 seconds against the family's 1.6.
  dulcimer: E(I('hammered dulcimer', 15, 'gm_dulcimer', 67, 1.0, 'mallet'),
    { decay: 2.4, release: 0.5 }),
  // Thirteen silk strings over movable bridges, and no stopping hand: the left
  // hand presses *behind* a bridge to bend a note that is already sounding.
  // Structurally that makes it a harp rather than a lute, which is what the
  // idiom and the archetype both say.
  koto: I('koto', 107, 'gm_koto', 60, 0.8, 'plucked'),
  // A fretless three-string lute struck with a plectrum the size of a hand,
  // which lands on the skin belly as well as the string. That percussive slap
  // is the sound, and the short decay is it: a shamisen note is gone in half a
  // second and the next one is already on the way.
  shamisen: E(I('shamisen', 106, 'gm_shamisen', 60, 0.75, 'plucked'),
    { decay: 0.6 }),
  // The Vietnamese zither, sampled, against GM 108's koto as the MIDI fallback
  // — the two are cousins and the substitution is honest. It is here rather
  // than folded into the koto because sixteen steel strings ring far brighter
  // and far longer than thirteen silk ones, and because the two traditions
  // pentatonicise differently; one entry could only have been one of them.
  dantranh: E(I('dan tranh', 107, 'dantranh', 62, 0.8, 'plucked'),
    { decay: 1.8, release: 0.4 }),

  // --- The string band, and the pipes --------------------------------------

  // A drum with strings on it, which is not a figure of speech: the head is
  // mylar over a rim and the bridge stands on it. So the note is gone in half a
  // second, and that single fact is why bluegrass banjo is played in rolls —
  // the right hand has to keep filling every eighth or the instrument is
  // silent. 0.55 against the plucked family's 1.1, and it changes the writing
  // more than any other override in the table.
  banjo: L(E(I('banjo', 105, 'gm_banjo', 62, 0.85, 'plucked'), { decay: 0.55 }), 71),
  // Nine notes. The Great Highland chanter plays G4 to A5 and nothing else —
  // no octave, no accidentals beyond its own scale, no dynamics — and the range
  // below is that literal fact rather than a conservative estimate. It is the
  // narrowest entry in the catalogue by a factor of three, and everything that
  // sounds like piping follows from it.
  //
  // `reed` rather than `wind`, despite the chanter being a double reed and not
  // a free one, because the idiom is a statement about *behaviour*: the bag
  // never runs out, so there is no breath and no phrase gap, and the ornaments
  // are grace notes rather than tonguing. That is the reed profile exactly, and
  // the wind profile's 0.7 breath would put rests in a tune that physically
  // cannot have any.
  bagpipes: I('bagpipes', 109, 'gm_bagpipe', 74, 0.5, 'reed'),
  // Three strings, diatonic frets, and two of them droning: a strumstick is a
  // mountain dulcimer built as a stick, and the two low strings are tuned to
  // the tonic and the fifth and simply left open. Hence the agility — there is
  // no note between the frets to leap to, so a line that wants a semitone the
  // instrument does not have has to go somewhere else.
  //
  // Sampled, against GM 16 as the fallback: General MIDI files a strumstick and
  // a hammered dulcimer under the same programme, which is wrong about the
  // action and right about the family, and it is the closest thing on offer.
  strumstick: I('strumstick', 15, 'strumstick', 55, 0.6, 'plucked'),

  // --- Tuned percussion the band carries in a case -------------------------
  // Melodic-bank programmes, not drum voices. GM 114, 115 and 116 are pitched
  // programmes in the *instrument* bank and are played from a keyboard by
  // whoever is nearest; the drum kit's own agogo and woodblock live in the
  // percussion bank and belong to `DrumVoice`, which is a different table in a
  // different file. An entry here is a line somebody wrote, not a stroke in a
  // groove.

  // Tuned oil drum. The ring is long and the fundamental is weak, so a pan line
  // blurs into a wash if it is written like a marimba part — which is why the
  // agility is a little under a mallet's and the decay a little under the
  // family's. The lead pan starts at G3 and a soprano tops out around E6.
  steelDrums: E(I('steel drums', 114, 'gm_steel_drums', 67, 0.9, 'mallet'),
    { decay: 1.3 }),
  // Two cowbells welded to a spring, a minor third apart, and pitched high
  // because that is where the sample lives — pitch this programme down an
  // octave and it is a cowbell, up an octave and it is a tick. The narrow range
  // is that statement, and it is the only thing keeping a samba ostinato from
  // wandering into registers that stop sounding like the object.
  agogo: E(I('agogo bells', 113, 'gm_agogo', 79, 0.9, 'mallet'), { decay: 0.4 }),
  // A block of wood. Nothing resonates, so 0.12 seconds — the shortest envelope
  // in the catalogue, and shorter than the palm-muted guitar by half. What it
  // buys is a ska and reggae upbeat that reads as an attack rather than a note.
  woodblock: E(I('woodblock', 115, 'gm_woodblock', 79, 0.9, 'mallet'),
    { decay: 0.12 }),
  // Sampled, against GM 13 — General MIDI's marimba is the West African
  // instrument's own descendant and the name is even borrowed, so the fallback
  // is honest in a way most substitutions are not. What the sample has and the
  // soundfont cannot is the buzz: a balafon's gourd resonators are stopped with
  // spider-silk membranes that rattle on every note, and the bar dies fast
  // underneath it. 0.7 seconds, half the marimba's.
  balafon: E(I('balafon', 12, 'balafon', 67, 1.0, 'mallet'), { decay: 0.7 }),

  // --- The rhythm section's edges ------------------------------------------

  // GM 37 is the *pop*, where GM 36 is the thumb — the two halves of one
  // technique that General MIDI happens to have given two programmes. Same
  // fingerboard, same four strings and the same reach as every other electric
  // bass here, for the reason `slapBass` already states: a technique is not a
  // wider instrument. It earns its row because a funk line alternates the two,
  // and until now only one of them existed.
  slapBass2: I('slap bass 2', 37, 'gm_slap_bass_2', 40, 0.75, 'plucked'),
  // A harmonic is not a fretted note and it is not in the same place. The
  // string is touched rather than stopped, at a node, and what sounds is a
  // partial *above* the open string — so this is the one plucked entry whose
  // ceiling is set by physics rather than by the end of the neck, and the
  // `RANGE_OF` entry in `concert/instruments.ts` says so against the guitar's
  // own 22 frets. Long decay, because a node is where the string loses least.
  guitarHarmonics: E(I('guitar harmonics', 31, 'gm_guitar_harmonics', 79, 0.6, 'plucked'),
    { decay: 2.2 }),

  // --- Machines ------------------------------------------------------------
  // Pitched drum programmes, which is a real category and not a contradiction:
  // an analogue tom with its tuning knob turned during the decay is the sound
  // of a whole decade, and it is a *note* in a way an acoustic tom is not.

  // The tuned analogue tom — an 808 tom, a Simmons pad. Low, short, and it does
  // not sustain at all: the envelope is a gate with a click on the front, which
  // is what the circuit is. Drum and bass builds bass lines out of this.
  synthDrum: E(I('synth drum', 118, 'gm_synth_drum', 48, 0.9, 'mallet'),
    { attack: 0.001, decay: 0.65, sustain: 0, release: 0.12 }),
  // A rack of concert toms, sampled across pitches — the fill instrument, and
  // the one that makes a drum-and-bass or a disco break sound arranged rather
  // than programmed. Half a second, because a tom head is damped by the air
  // inside the shell however hard it is struck.
  melodicTom: E(I('melodic tom', 117, 'gm_melodic_tom', 50, 0.85, 'mallet'),
    { decay: 0.5 }),
  // A crash played backwards, and the envelope is the whole entry: it is the
  // only sound in the catalogue whose attack is longer than its release. Over a
  // second of swell, then nothing — because what a reverse cymbal is *for* is
  // arriving at a downbeat and stopping dead on it, and a tail after that
  // downbeat would smear the join it exists to sharpen.
  //
  // Filed under `mallet` for the figuration and stripped of the family's
  // envelope entirely, which is the same trade the ambient shelf makes.
  reverseCymbal: E(I('reverse cymbal', 119, 'gm_reverse_cymbal', 60, 0.4, 'mallet'),
    { attack: 1.1, decay: 0.05, sustain: 1, release: 0.05 }),

  // --- The sound-effects bank ----------------------------------------------
  // **A different bank from the ambient shelf above.** GM 96–103 are the eight
  // *synth* effects — `fxRain` and its neighbours — and they are synthesiser
  // patches with pitch and a keyboard under them. GM 120–127 are recordings of
  // things: surf, birds, a breath. The three here are the ones that are a
  // texture rather than a punchline, which is why `gm_gunshot`, `gm_telephone`,
  // `gm_helicopter` and `gm_applause` stay unused.
  //
  // Their ranges are narrow on purpose and this is the field doing real work.
  // Pitch on a recording of the sea is a playback rate, not a note: two octaves
  // up it is static and two octaves down it is a rumble, and neither is the
  // sound anybody chose. Two octaves total, centred where the sample was made,
  // keeps the transposition inside what still reads as the thing.
  seashore: E(I('seashore', 122, 'gm_seashore', 60, 0.4, 'bowed'), PAD),
  // Not `PAD`, unlike its two neighbours. A pad's third of a second of attack
  // would file the front off every chirp, and the front of a chirp is all a
  // chirp has; birds are transients over a silence, which is a mallet's shape
  // with a longer tail than a bar has.
  birdTweet: E(I('birdsong', 123, 'gm_bird_tweet', 72, 0.6, 'mallet'),
    { attack: 0.02, decay: 1.3, sustain: 0, release: 0.5 }),
  // Breath with no instrument after it. Useful under a wind part, where it is
  // the noise a flute sample has had polished off it, and useful alone as the
  // quietest texture the catalogue can produce.
  breathNoise: E(I('breath noise', 121, 'gm_breath_noise', 60, 0.4, 'wind'), PAD),

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

  // The orchestra. Sounding pitch throughout, which is worth saying twice for
  // the three transposers here: a cor anglais part is written a fifth above
  // this, a piccolo part an octave below it, and neither of those numbers is
  // what anyone hears.
  oboe: [58, 89],
  englishHorn: [52, 81],
  bassoon: [34, 75],
  frenchHorn: [41, 77],
  tuba: [28, 65],
  piccolo: [74, 105],
  viola: [48, 88],
  // Four pedal drums: a 32-inch down to D2, a 23-inch up to A3. Nineteen
  // semitones is the whole instrument, and the narrowest range here after the
  // bagpipes — which is exactly why it is worth writing down. A timpani part
  // that ranges further is a marimba part with the wrong patch on it.
  timpani: [38, 57],
  // A two-manual French double: FF to f''', which is a fifth short of a piano
  // at the bottom and an octave and a half short at the top. The instrument
  // stops where it stops, and Bach knew it — nothing in the repertoire asks.
  harpsichord: [29, 89],
  recorder: [65, 91],
  // Sounds an octave above the written part, so the top really is C8. Generous
  // at the top for the same reason the glockenspiel's is generous at the
  // bottom: the `centre` keeps parts out of there, and lowering the ceiling
  // would fold high notes *down* into the middle of the texture.
  xylophone: [65, 108],
  orchestraHit: [36, 84],
  // A fifteen-string folk kantele, G3 to G5, rather than the 38-string concert
  // instrument — the runo repertoire is played on the small one, and this is
  // also within a tone of what the sample set actually covers.
  kantele: [55, 79],
  pipeOrgan: [24, 96],
  pipeOrganQuiet: [24, 96],
  steinway: [21, 108],

  // Outside the western orchestra
  shanai: [57, 84],
  dulcimer: [55, 93],
  koto: [50, 84],
  // Bounded by the archetype it is staged on rather than by the instrument,
  // which is honest here: a fretless three-string neck has no hard ceiling, and
  // the tessitura of the repertoire is inside this anyway.
  shamisen: [48, 80],
  dantranh: [48, 84],

  // The string band
  banjo: [50, 83],
  // Nine notes, G4 to A5. See the entry above; this is the instrument, not a
  // cautious estimate of it.
  bagpipes: [67, 79],
  // Down to D2, which is below a guitar's low E and is the point: the two open
  // drone strings are the bottom of the instrument and are never fretted.
  strumstick: [38, 69],

  // Tuned percussion
  steelDrums: [55, 88],
  agogo: [72, 91],
  woodblock: [67, 91],
  balafon: [53, 84],

  // The rhythm section's edges
  slapBass2: [28, 63],
  // A harmonic sounds above the string that produces it, so the ceiling is a
  // full fifth past the end of the fingerboard. See the entry.
  guitarHarmonics: [64, 96],

  // Machines
  synthDrum: [28, 60],
  melodicTom: [36, 67],
  reverseCymbal: [48, 72],

  // The sound-effects bank. Two octaves each, and narrow on purpose: see the
  // entries. Transposing a recording of the sea is a playback rate.
  seashore: [48, 72],
  birdTweet: [60, 84],
  breathNoise: [48, 72],

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
 *
 * That split is a *wall*, and the thing worth writing down is what it means for
 * everything on the other side of it. A piano accordion is two instruments
 * bolted to the ends of a box of air: 41..52 is one chromatic octave of bass
 * buttons under a left hand strapped to the far side of the bellows, and 53..93
 * is a 41-note treble keyboard with narrower keys than a piano's under the right
 * hand. Nothing crosses. So a chord written above F3 is *one* hand's problem
 * with no second hand behind it, and any voicing wider than that hand is a
 * spread the instrument's geometry cannot reach even when the notes are
 * perfectly reasonable music — 146 of the 152 ungraspable grabs `npm run
 * concert` found across fourteen genres were exactly this, an accordion comp
 * asked for fourteen to nineteen semitones in one grab.
 *
 * It is not fixed by narrowing anything here, and deliberately: [53 60 67] is a
 * good voicing and a real accordionist plays it by rolling it. The numbers in
 * this table describe where a hand sits, and what a hand does when the chord in
 * front of it will not fit is the choreographer's to say. It says it in
 * `rolled`.
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
   * How strictly the low-interval limits apply to *this hand*, overriding the
   * style's own `clarity`. See `minInterval`.
   *
   * A number about the instrument rather than about the arrangement, and there
   * is exactly one instrument in the catalogue that needs it. The limits are a
   * pianist's: no close triad below C3, because a pianist choosing to voice one
   * there has chosen mud. An accordionist has chosen nothing — a stradella chord
   * button sounds a fixed close triad in a fixed low register, and the player's
   * only decision is whether to press it.
   *
   * Measured before this existed: of twenty-six chords voiced in the accordion's
   * button window, **four** came back with more than one note in them. The rest
   * were single pitches, which `isChord` correctly refuses to treat as a left
   * hand — so the instrument this whole two-handed apparatus was extended for
   * was silent in five bars out of six, and had been since it was added.
   */
  clarity?: number;
  /**
   * The bottom of this hand's *bass side*, if it has one. See `stride`.
   *
   * A second register rather than a second number for the same one, and the
   * distinction is physical. The rest of `HandSpec` describes where the hand
   * voices a chord; this is where it puts a bass note, which on the two
   * instruments that matter most is somewhere the chord never goes — the
   * accordion's bass button row sits below its chord buttons, and a stride
   * pianist's left hand jumps an octave and a half down to the root and back up
   * again on every beat. Deriving one from the other would have put the oom in
   * the middle of the pah.
   *
   * The root lives in the octave starting here, so a bass side is always twelve
   * semitones wide and the pitch class is never folded away. The fifth above it
   * — the other half of the "oom" — reaches seven higher, which is what sets
   * these numbers: 33 puts the dyad's top at 51 at the very highest, under the
   * accordion's button ceiling and well under a pianist's comping floor.
   *
   * Absent on a hand that has no bass side at all. Two mallets cannot leap an
   * octave and a half down and back inside a beat, so a vibraphonist does not
   * play stride; `chooseLeftHandMode` drops the mode rather than writing one.
   */
  bass?: Midi;
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
  // C5 for the tune, a minor seventh of daylight, the rootless shell beneath —
  // and a bass side an octave under the shell, which is the reach a stride left
  // hand actually makes and the reason `bass` is not derived from `floor`.
  piano: { lead: 72, floor: 45, ceiling: 72, window: 14, voices: 3, gap: 10, voicing: 'guide', bass: 33, melodic: true },
  epiano1: { lead: 72, floor: 45, ceiling: 72, window: 14, voices: 3, gap: 10, voicing: 'guide', bass: 33, melodic: true },
  epiano2: { lead: 72, floor: 45, ceiling: 72, window: 14, voices: 3, gap: 10, voicing: 'guide', bass: 33, melodic: true },
  // The same anatomy as the piano, restated rather than shared, because these
  // are two objects and a future correction to one need not move the other.
  steinway: { lead: 72, floor: 45, ceiling: 72, window: 14, voices: 3, gap: 10, voicing: 'guide', bass: 33, melodic: true },
  /**
   * The continuo player's left hand, and it is the **opposite** of the piano's.
   *
   * Every other keyboard here voices a rootless shell, because a bass player is
   * standing four feet away whose entire job is the root. A harpsichord in a
   * baroque ensemble has no such colleague — it *is* the bass, sharing the line
   * with a cello or a gamba, and the figures over that line are instructions for
   * realising the chord *above the root it is already playing*. A guide voicing
   * would produce the one thing figured bass cannot be: a realisation with no
   * bass under it.
   *
   * So `tertian` and a `bass` side, which together are the two halves of what
   * the left hand actually does — the written line low down, the realisation
   * stacked on top of it. The ceiling is a third under the piano's because a
   * harpsichord's tone thins out towards the top and the right hand needs that
   * register more than the left does.
   */
  harpsichord: { lead: 72, floor: 41, ceiling: 69, window: 14, voices: 3, gap: 10, voicing: 'tertian', bass: 33, melodic: true },
  // Two mallets, a fifth of daylight, and a floor on the instrument rather than
  // under it. The narrower gap is not a compromise: a vibraphonist's hands work
  // within arm's reach of each other on one row of bars, where a pianist's are
  // at opposite ends of eighty-eight keys.
  vibraphone: { lead: 79, floor: 55, ceiling: 72, window: 12, voices: 2, gap: 7, voicing: 'guide', melodic: true },
  marimba: { lead: 79, floor: 55, ceiling: 72, window: 12, voices: 2, gap: 7, voicing: 'guide', melodic: true },
  // Two beaters over one row of bars, so the marimba's numbers apply — with the
  // window and the floor pulled in to the balafon's three octaves, which is a
  // smaller instrument than either of the western ones above.
  balafon: { lead: 74, floor: 53, ceiling: 67, window: 10, voices: 2, gap: 7, voicing: 'guide', melodic: true },
  // The button side: a full triad with its own root, below the split, and an
  // octave of daylight because that is where the buttons are. `bass` is the
  // other button row — the one the oom-pah alternates with, and the row this
  // table had no way to name until there was a mode that used it.
  accordion: { lead: 74, floor: 41, ceiling: 52, window: 11, voices: 3, gap: 12, voicing: 'tertian', bass: 33, clarity: 0, melodic: false },
  bandoneon: { lead: 74, floor: 41, ceiling: 52, window: 11, voices: 3, gap: 12, voicing: 'tertian', bass: 33, clarity: 0, melodic: false },
  // A string per note and no fretting hand, so both hands pluck freely. Voiced
  // in fourths, which is the one thing a harp does that a piano has to work at.
  harp: { lead: 79, floor: 48, ceiling: 67, window: 16, voices: 3, gap: 10, voicing: 'quartal', bass: 36, melodic: true },
  /**
   * The harp's argument on an instrument two octaves shorter, and one field
   * differs for a reason worth stating: there is no `bass`.
   *
   * A kantele's lowest string is G3. There is no octave and a half beneath the
   * comping register to leap down to, because the whole instrument is the
   * comping register — so a stride left hand is not a style this object
   * declines, it is a gesture that has nowhere to land. `chooseLeftHandMode`
   * drops the mode rather than writing one, exactly as it does for the
   * vibraphone's two mallets.
   *
   * `quartal` is not a modernism here. The traditional accompaniment is a drone
   * on the open fifth with the melody hand picking above it, and stacking
   * fourths is the closest this table can come to saying so; a tertian voicing
   * would put a third in the drone, which is the one interval kantele
   * accompaniment does not use.
   */
  kantele: { lead: 74, floor: 55, ceiling: 67, window: 10, voices: 2, gap: 7, voicing: 'quartal', melodic: true },
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
