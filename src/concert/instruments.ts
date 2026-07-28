/**
 * Sounds → objects.
 *
 * `style/instruments.ts` is a catalogue of 77 *sounds*, because that is what a
 * generator needs. A stage needs a catalogue of *things a person stands
 * behind*, and there are far fewer of those: a soprano and a baritone sax are
 * one model at two sizes, and the eight GM synth pads are one keyboard.
 *
 * Two properties are worth the file existing on its own:
 *
 * **The mapping is exhaustive by construction.** `ARCHETYPE_OF` is a
 * `Record<InstrumentId, Archetype>`, so adding a sound to the catalogue without
 * saying what it looks like fails `npm run typecheck`. The alternative — a
 * lookup with a default — degrades silently into a grey box on stage, which is
 * exactly the sort of thing nobody notices until it is in a screenshot.
 *
 * **It is addressable from the Song IR.** A `Track` carries `gmProgram` and a
 * human `instrument` name, not a catalogue key, so the runtime lookups below
 * are derived from the compile-checked table rather than maintained beside it.
 *
 * Everything here is geometry-free: how many hands, what it can play, how much
 * floor it needs. Where anything physically *is* belongs to the models in
 * `web/concert/instruments/`, and nothing in this directory may know.
 */

import type { Midi } from '../core/pitch.js';
import type { InstrumentId } from '../style/instruments.js';
import { INSTRUMENTS } from '../style/instruments.js';
import type { Archetype, ArchetypeSpec } from './types.js';

/**
 * Which object each catalogue entry is played on.
 *
 * A handful of these are judgement calls and are worth stating rather than
 * leaving to be re-derived by whoever next reads the table:
 *
 *  - **Choir and voice patches go to `synth`, not `singer`.** A `gm_choir_aahs`
 *    pad is a keyboard playing a choir patch — that is what it was on the
 *    records and it is what it is here. Staging actual singers would put mute
 *    faces on the stage: those tracks carry no vowels, so there would be
 *    nothing to animate a mouth from. Only the `vocal` layer gets a singer.
 *  - **`celesta` goes to `electric-piano`.** It sounds like tuned percussion
 *    and is played from a keyboard, and what the player *does* is the thing an
 *    audience watches.
 *  - **String ensembles go to `violin`.** One player stands in for the section.
 *    The alternative is three identical performers on one part, which reads as
 *    a rendering bug rather than as an orchestra.
 *  - **Synth basses go to `synth`.** A bass line is a bass line; a Minimoog is
 *    still a keyboard.
 */
export const ARCHETYPE_OF: Record<InstrumentId, Archetype> = {
  // Electric variants
  //
  // Each of these is its acoustic base plus an `effects` delta — same GM
  // programme, same soundfont, same range and same idiom — so it stages on the
  // same object. A pickup does not change what the audience is looking at.
  //
  // Written *before* their bases, and the order is load-bearing. `ID_BY_GM`
  // below is a `Map`, so on a shared GM programme the entry written last wins;
  // the acoustic one should win, because a bare `gm 40` with no other
  // information is a violin. Every lookup derived from this table agrees either
  // way today — archetype, range and idiom are identical by construction — but
  // `SCALE_OF` and `RANGE_OF` are keyed by id, and the day one of those gains a
  // `violin` entry the wrong order would silently drop it.
  electricViolin: 'violin',
  electricCello: 'cello',
  electricVibes: 'mallets',
  crushedPad: 'synth',

  // Free reed
  accordion: 'accordion',
  bandoneon: 'accordion',
  harmonica: 'harmonica',

  // Keys
  piano: 'grand-piano',
  epiano1: 'electric-piano',
  epiano2: 'electric-piano',
  // Struck strings and a keyboard, on a stand, played standing: the same object
  // an audience sees behind a Rhodes.
  clavinet: 'electric-piano',
  celesta: 'electric-piano',
  drawbarOrgan: 'organ',
  rockOrgan: 'organ',
  percussiveOrgan: 'organ',
  churchOrgan: 'organ',
  reedOrgan: 'organ',

  // Tuned percussion
  vibraphone: 'mallets',
  glockenspiel: 'mallets',
  marimba: 'mallets',
  tubularBells: 'mallets',
  musicBox: 'mallets',
  kalimba: 'mallets',

  // Plucked
  nylonGuitar: 'acoustic-guitar',
  steelGuitar: 'acoustic-guitar',
  jazzGuitar: 'electric-guitar',
  cleanGuitar: 'electric-guitar',
  mutedGuitar: 'electric-guitar',
  overdriveGuitar: 'electric-guitar',
  distortionGuitar: 'electric-guitar',
  harp: 'harp',
  sitar: 'sitar',

  // Bass
  acousticBass: 'upright-bass',
  contrabass: 'upright-bass',
  fingerBass: 'electric-bass',
  pickBass: 'electric-bass',
  slapBass: 'electric-bass',
  fretlessBass: 'electric-bass',
  synthBass: 'synth',
  synthBass2: 'synth',

  // Bowed
  violin: 'violin',
  fiddle: 'violin',
  tremoloStrings: 'violin',
  pizzStrings: 'violin',
  strings1: 'violin',
  strings2: 'violin',
  cello: 'cello',

  // Brass
  trumpet: 'trumpet',
  mutedTrumpet: 'trumpet',
  brassSection: 'trumpet',
  trombone: 'trombone',
  synthBrass: 'synth',
  synthBrass2: 'synth',

  // Winds
  sopranoSax: 'saxophone',
  altoSax: 'saxophone',
  tenorSax: 'saxophone',
  baritoneSax: 'saxophone',
  clarinet: 'clarinet',
  flute: 'flute',
  panFlute: 'flute',
  shakuhachi: 'flute',

  // Electronic — the ambient shelf, plus every lead and pad
  synthStrings: 'synth',
  synthStrings2: 'synth',
  padWarm: 'synth',
  padNewAge: 'synth',
  padPoly: 'synth',
  padChoir: 'synth',
  padBowed: 'synth',
  padMetallic: 'synth',
  padHalo: 'synth',
  padSweep: 'synth',
  fxRain: 'synth',
  fxSoundtrack: 'synth',
  fxCrystal: 'synth',
  fxAtmosphere: 'synth',
  fxBrightness: 'synth',
  fxGoblins: 'synth',
  fxEchoes: 'synth',
  fxSciFi: 'synth',
  leadSquare: 'synth',
  leadSaw: 'synth',
  leadCalliope: 'synth',
  leadChiff: 'synth',
  leadVoice: 'synth',
  leadCharang: 'synth',
  leadFifths: 'synth',
  leadBassLead: 'synth',
  choirAahs: 'synth',
  voiceOohs: 'synth',
  synthChoir: 'synth',
};

const S = (spec: ArchetypeSpec): ArchetypeSpec => spec;

/**
 * What each object is, physically, without saying where any of it is.
 *
 * `range` is asserted against in `npm run concert`: a gesture that asks for a
 * note the instrument cannot reach is a casting bug, and the stage should fail
 * loudly rather than put a hand somewhere plausible.
 *
 * `strings` are open pitches low to high, which is the index space
 * `PlayPoint.string` uses. Absent `frets` means unfretted — the model places a
 * finger by continuous position rather than by snapping to a wire.
 */
export const ARCHETYPES: Record<Archetype, ArchetypeSpec> = {
  drumkit: S({
    id: 'drumkit', label: 'drum kit', family: 'percussion',
    hands: 2, posture: 'kit', points: ['drum', 'pedal', 'rest'],
    // Nominal GM percussion span. Drum points are addressed by voice, not
    // pitch, so nothing resolves through this — it is here for completeness.
    range: [35, 81],
    held: false, footprint: 1.6, workHeight: 0.75,
  }),

  'grand-piano': S({
    id: 'grand-piano', label: 'grand piano', family: 'keys',
    hands: 2, posture: 'sit', points: ['key', 'pedal', 'rest'],
    range: [21, 108], held: false, footprint: 1.5, workHeight: 0.72,
  }),
  'electric-piano': S({
    id: 'electric-piano', label: 'electric piano', family: 'keys',
    hands: 2, posture: 'stand', points: ['key', 'rest'],
    range: [28, 103], held: false, footprint: 0.9, workHeight: 0.95,
  }),
  organ: S({
    id: 'organ', label: 'organ', family: 'keys',
    hands: 2, posture: 'sit', points: ['key', 'rest'],
    /**
     * Down to C1, because an organist has feet.
     *
     * The pedalboard is addressed as `key` rather than `pedal` — a pedalboard
     * is a keyboard played with the feet, and giving it its own point kind
     * would mean two ways to say the same thing. `pedal` stays reserved for
     * a switch: a hi-hat, a kick, a sustain. The model splits 24–35 to the
     * pedalboard and 36–96 to the manuals, and the choreographer sends the low
     * ones to a foot.
     */
    range: [24, 96], held: false, footprint: 1.0, workHeight: 0.78,
  }),
  synth: S({
    id: 'synth', label: 'synthesiser', family: 'electronic',
    hands: 2, posture: 'stand', points: ['key', 'rest'],
    range: [21, 108], held: false, footprint: 1.0, workHeight: 0.95,
  }),

  accordion: S({
    id: 'accordion', label: 'accordion', family: 'free-reed',
    hands: 2, posture: 'stand', points: ['key', 'bellows', 'rest'],
    // Both hands. The right-hand keyboard starts around F3; the left-hand bass
    // and chord buttons go a good deal lower, and a comp part uses them.
    range: [41, 93], held: true, footprint: 0.7, workHeight: 1.15,
  }),
  harmonica: S({
    id: 'harmonica', label: 'harmonica', family: 'free-reed',
    hands: 2, posture: 'stand', points: ['hole', 'rest'],
    range: [60, 96], blown: true, held: true, footprint: 0.5, workHeight: 1.5,
  }),

  // Standard guitar tuning, low to high: E2 A2 D3 G3 B3 E4.
  'acoustic-guitar': S({
    id: 'acoustic-guitar', label: 'acoustic guitar', family: 'plucked',
    hands: 2, posture: 'stand', points: ['string', 'rest'],
    range: [40, 83], strings: [40, 45, 50, 55, 59, 64], frets: 19,
    held: true, footprint: 0.7, workHeight: 1.0,
  }),
  'electric-guitar': S({
    id: 'electric-guitar', label: 'electric guitar', family: 'plucked',
    hands: 2, posture: 'stand', points: ['string', 'rest'],
    // 22 frets from a low E is MIDI 86, not 88. The old number claimed two
    // notes that are past the end of the neck.
    range: [40, 86], strings: [40, 45, 50, 55, 59, 64], frets: 22,
    held: true, footprint: 0.7, workHeight: 1.0,
  }),
  // E1 A1 D2 G2 — the same four for both basses; one has frets and one does not.
  'upright-bass': S({
    id: 'upright-bass', label: 'upright bass', family: 'plucked',
    hands: 2, posture: 'stand', points: ['string', 'rest'],
    range: [28, 67], strings: [28, 33, 38, 43],
    /**
     * Carried, despite standing on an endpin.
     *
     * It looks like furniture and it is not: a double bass is balanced against
     * the player with an arm round it, and it goes where they go. Left as
     * furniture, the player swayed and the instrument did not, so the hands and
     * the body came apart — which is exactly what was reported. The endpin now
     * slides a few centimetres with the sway, which is what an endpin does on a
     * wooden deck.
     */
    held: true, footprint: 0.9, workHeight: 1.15,
  }),
  'electric-bass': S({
    id: 'electric-bass', label: 'electric bass', family: 'plucked',
    hands: 2, posture: 'stand', points: ['string', 'rest'],
    // 20 frets from a low E is MIDI 63, which is also where a real four-string
    // P-bass stops. 67 was simply the upright's number copied across.
    range: [28, 63], strings: [28, 33, 38, 43], frets: 20,
    held: true, footprint: 0.7, workHeight: 1.0,
  }),
  harp: S({
    id: 'harp', label: 'harp', family: 'plucked',
    hands: 2, posture: 'sit', points: ['string', 'rest'],
    range: [24, 103], held: false, footprint: 1.1, workHeight: 1.2,
  }),
  sitar: S({
    id: 'sitar', label: 'sitar', family: 'plucked',
    hands: 2, posture: 'sit', points: ['string', 'rest'],
    // Bounded by its own strings: the lowest opens at 48 and 20 frets from the
    // top course reaches 80. The old [45, 84] was reachable at neither end.
    range: [48, 80], strings: [48, 53, 55, 60], frets: 20,
    held: true, footprint: 0.9, workHeight: 0.7,
  }),

  // G3 D4 A4 E5 and C2 G2 D3 A3.
  violin: S({
    id: 'violin', label: 'violin', family: 'bowed',
    hands: 2, posture: 'stand', points: ['string', 'rest'],
    range: [55, 96], strings: [55, 62, 69, 76],
    held: true, footprint: 0.7, workHeight: 1.45,
  }),
  cello: S({
    id: 'cello', label: 'cello', family: 'bowed',
    hands: 2, posture: 'straddle', points: ['string', 'rest'],
    range: [36, 81], strings: [36, 43, 50, 57],
    held: false, footprint: 0.9, workHeight: 0.9,
  }),

  mallets: S({
    id: 'mallets', label: 'vibraphone', family: 'percussion',
    hands: 2, posture: 'stand', points: ['key', 'rest'],
    range: [53, 96], held: false, footprint: 1.2, workHeight: 0.9,
  }),

  trumpet: S({
    id: 'trumpet', label: 'trumpet', family: 'brass',
    hands: 2, posture: 'stand', points: ['valve', 'rest'],
    // The top is a lead player's top, not a comfortable one. It is deliberately
    // generous: a screaming high F is a real note and a real thing to animate.
    range: [52, 86], blown: true, held: true, footprint: 0.6, workHeight: 1.5,
  }),
  trombone: S({
    id: 'trombone', label: 'trombone', family: 'brass',
    hands: 2, posture: 'stand', points: ['valve', 'rest'],
    // A slide needs room in front of the player that a bell does not.
    range: [34, 80], blown: true, held: true, footprint: 0.9, workHeight: 1.5,
  }),
  saxophone: S({
    id: 'saxophone', label: 'saxophone', family: 'wind',
    hands: 2, posture: 'stand', points: ['hole', 'rest'],
    /**
     * The union of the family, baritone bottom to soprano altissimo top — the
     * model scales to whichever member the catalogue entry names.
     *
     * This was [44, 87] and that was simply wrong: `RANGE_OF` gives the
     * baritone [37, 76] and the alto [49, 89], so the catalogue permitted notes
     * the archetype forbade and a legal part could not be resolved. An
     * archetype range must contain every `RANGE_OF` entry that maps to it.
     */
    range: [37, 89], blown: true, held: true, footprint: 0.7, workHeight: 1.2,
  }),
  clarinet: S({
    id: 'clarinet', label: 'clarinet', family: 'wind',
    hands: 2, posture: 'stand', points: ['hole', 'rest'],
    range: [50, 91], blown: true, held: true, footprint: 0.6, workHeight: 1.3,
  }),
  flute: S({
    id: 'flute', label: 'flute', family: 'wind',
    hands: 2, posture: 'stand', points: ['hole', 'rest'],
    range: [59, 96], blown: true, held: true, footprint: 0.7, workHeight: 1.5,
  }),

  singer: S({
    id: 'singer', label: 'singer', family: 'voice',
    // No hands: they are free, which is most of what a singer's body is doing.
    hands: 0, posture: 'stand', points: ['viseme', 'rest'],
    range: [40, 84], blown: true, held: false, footprint: 0.6, workHeight: 1.55,
  }),
};

// ---------------------------------------------------------------------------
// Lookups from the Song IR
// ---------------------------------------------------------------------------

/**
 * Where a specific sound reaches further than its object's default.
 *
 * An archetype's range is the range of the *typical* instrument, and a handful
 * of catalogue entries are not typical. Two kinds:
 *
 *  - **Sections are not soloists at one size.** A "string ensemble" is violins
 *    *and* violas *and* cellos, and a pad written for it voices down to C2 —
 *    a fifth below anything a violinist can play. One violinist still stands in
 *    for the section on stage, which is the right visual, but claiming a
 *    violin's reach for the part is simply false. The concert check found this
 *    on its first run, which is the argument for having written it.
 *  - **A sax family spans two octaves between its ends.** Unioning all four into
 *    one archetype range would let a baritone part be written in the soprano
 *    register with nothing objecting.
 *
 * Anything absent here uses the archetype's own range.
 */
export const RANGE_OF: Partial<Record<InstrumentId, [Midi, Midi]>> = {
  strings1: [36, 96],
  strings2: [36, 96],
  tremoloStrings: [36, 96],
  pizzStrings: [36, 96],
  synthStrings: [36, 96],
  synthStrings2: [36, 96],
  brassSection: [36, 84],
  synthBrass: [36, 84],
  // Including the altissimo register, which is not an embellishment on these
  // instruments — it is where a jazz alto player spends the top of a solo, and
  // the generator writes there. Excluding it flagged a hundred perfectly good
  // notes as unplayable.
  sopranoSax: [56, 88],
  altoSax: [49, 89],
  tenorSax: [44, 84],
  baritoneSax: [37, 76],
};

/**
 * A `Track` carries `gmProgram` and a display name, never a catalogue key —
 * the Song IR is deliberately portable and a TypeScript union is not. Both
 * indexes are derived from the table above rather than written beside it, so
 * they cannot drift out of agreement with it.
 */
const ID_BY_GM = new Map<number, InstrumentId>();
const ID_BY_NAME = new Map<string, InstrumentId>();
for (const id of Object.keys(ARCHETYPE_OF) as InstrumentId[]) {
  const entry = INSTRUMENTS[id];
  ID_BY_GM.set(entry.gm, id);
  ID_BY_NAME.set(entry.name, id);
}

/** The catalogue entry a track was written for, if it is one we know. */
export function instrumentIdForTrack(
  track: { gmProgram: number; instrument: string },
): InstrumentId | undefined {
  return ID_BY_GM.get(track.gmProgram) ?? ID_BY_NAME.get(track.instrument);
}

/** The drum track is not a catalogue entry; it is always the kit. */
export const DRUM_ARCHETYPE: Archetype = 'drumkit';

/** The voice takes its sound from the genre rather than the era palette. */
export const VOCAL_ARCHETYPE: Archetype = 'singer';

/**
 * Which object plays this track.
 *
 * Resolved by GM program first — it is the field that exists precisely to
 * identify an instrument across formats — and by display name as a fallback,
 * which covers a renderer that has filled in one and not the other.
 *
 * Returns `undefined` rather than guessing. A caller that wants a box on stage
 * can ask for one; a caller that would rather know it has a gap gets to find
 * out. `npm run concert` asserts this never returns `undefined` for any track
 * of any song in any genre.
 */
export function archetypeForTrack(
  track: { gmProgram: number; instrument: string },
): Archetype | undefined {
  const id = instrumentIdForTrack(track);
  return id ? ARCHETYPE_OF[id] : undefined;
}

export function specFor(archetype: Archetype): ArchetypeSpec {
  return ARCHETYPES[archetype];
}

/**
 * How far this particular track's instrument reaches: the catalogue entry's own
 * range where it has one, and its object's otherwise.
 */
export function rangeForTrack(
  track: { gmProgram: number; instrument: string },
): [Midi, Midi] | undefined {
  const id = instrumentIdForTrack(track);
  if (!id) return undefined;
  return RANGE_OF[id] ?? ARCHETYPES[ARCHETYPE_OF[id]].range;
}

/**
 * Whether this note is within reach.
 *
 * Used by staging to sanity-check a casting decision and by the verifier to
 * catch the case where a part was written for a register its instrument does
 * not have — which the stage is unusually good at surfacing, since a hand has
 * to physically go *somewhere*.
 *
 * A handful of notes will always fall outside: the generator writes for a
 * register, not for a player, and once every few hundred songs it puts a B1 on
 * a cello whose bottom string is a C. That is not a bug to be fixed by widening
 * the cello — it is what octave-folding in the choreographer is for, which is
 * also what a real player does. `npm run concert` therefore asserts a *rate*,
 * not zero, and the rate is small enough that a regression would show.
 */
export function inRange(archetype: Archetype, midi: number): boolean {
  const [lo, hi] = ARCHETYPES[archetype].range;
  return midi >= lo && midi <= hi;
}

/** As `inRange`, but honouring a catalogue entry's own reach. See `RANGE_OF`. */
export function trackCanReach(
  track: { gmProgram: number; instrument: string }, midi: number,
): boolean {
  const range = rangeForTrack(track);
  if (!range) return false;
  return midi >= range[0] && midi <= range[1];
}
