/**
 * Sounds → objects.
 *
 * `style/instruments.ts` is a catalogue of 126 *sounds*, because that is what a
 * generator needs. A stage needs a catalogue of *things a person stands
 * behind*, and there are far fewer of those — twenty, against those 126: a
 * soprano and a baritone sax are one model at two sizes, and the eight GM synth
 * pads are one keyboard.
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
import type { DrumVoice } from '../core/types.js';
import type { InstrumentId } from '../style/instruments.js';
import { INSTRUMENTS } from '../style/instruments.js';
import type { Archetype, ArchetypeSpec, SynthRigId } from './types.js';

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
 *
 * ## Borrowed objects
 *
 * Fifteen genres' worth of sounds arrived here against a fixed list of
 * archetypes, and `Archetype` is a closed union with a total `BUILDERS` record
 * behind it — a new member is a build error until a model exists. So the
 * newcomers below are mapped onto **the nearest plausible object already on the
 * stage**, and the mapping is a placeholder in a way the rest of this table is
 * not: a violist really is holding a violin, but a piper is not holding a
 * clarinet and a timpanist is not standing at a vibraphone.
 *
 * The ones that most want a model of their own, in the order the difference is
 * visible from the twelfth row:
 *
 *  - **bagpipes** — a bag, three drones over the shoulder, and a walking
 *    player. Staged on a clarinet, which gets only the chanter right.
 *  - **timpani** — four kettles and a foot on a pedal, staged on `mallets`.
 *  - **harpsichord** — two manuals, a rose, no pedals, staged on a grand.
 *  - **pipe organ** — a case of pipes and a pedalboard behind the console,
 *    where `organ` is a Hammond on a stand.
 *  - **tuba** and **french horn** — a tuba is played sitting with the bell over
 *    the shoulder and a horn's bell faces backwards; both are on brass models
 *    built for a bell facing the house.
 *  - **kantele**, **koto**, **dan tranh** — three zithers on a concert harp.
 *  - **banjo** and **strumstick** — a head and a rim, and a three-string stick,
 *    both currently dreadnoughts.
 *  - **steel drums**, **melodic tom**, **hammered dulcimer** — three more rows
 *    of `mallets` that are not rows of bars.
 *  - **viola**, **piccolo**, **bassoon**, **oboe**, **english horn**,
 *    **recorder**, **shehnai** — right family, wrong size. These want
 *    `SCALE_OF` in `web/concert/instruments/index.ts` far more than they want
 *    new geometry, and that is the cheaper half of the same fix.
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

  // Doubles
  //
  // Seven entries that share a General MIDI programme with a canonical one,
  // because they carry a *sampled* sound the GM soundfont cannot make — a
  // Steinway against `gm_piano`, a kantele against the orchestral harp, two
  // organ registrations against GM 19's one. See `Instrument.strudel`, and see
  // the catalogue entries, which argue each substitution.
  //
  // Written before their bases for exactly the reason the electric variants
  // are, one paragraph up: `ID_BY_GM` is a `Map` and the last writer wins. A
  // bare `gm 0` arriving with nothing else attached is the plain piano and not
  // a sampled concert grand; a bare `gm 46` is a harp and not a kantele.
  steinway: 'grand-piano',
  balafon: 'mallets',
  strumstick: 'acoustic-guitar',
  pipeOrgan: 'organ',
  pipeOrganQuiet: 'organ',
  kantele: 'harp',
  dantranh: 'harp',

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
  // A lidded wing on legs with a keyboard in it, sat at. The grand piano is the
  // silhouette, and the differences an audience could actually name — two
  // manuals, a rose in the soundboard, no pedals — are the model's business on
  // the day somebody builds one.
  harpsichord: 'grand-piano',
  drawbarOrgan: 'organ',
  rockOrgan: 'organ',
  percussiveOrgan: 'organ',
  churchOrgan: 'organ',
  reedOrgan: 'organ',

  // Tuned percussion
  //
  // `mallets` is doing more work here than anywhere else in the table, and it
  // earns it on the thing the audience is watching rather than on the shape of
  // the object: every one of these is two beaters over a row of pitches, struck
  // by a standing player. It is the same argument the celesta already makes one
  // section up. The four newcomers that are *not* a row of bars — the timpani,
  // the toms, the pans and the dulcimer — are the clearest candidates in this
  // whole file for a model of their own; see "Borrowed objects" above.
  vibraphone: 'mallets',
  glockenspiel: 'mallets',
  marimba: 'mallets',
  tubularBells: 'mallets',
  musicBox: 'mallets',
  kalimba: 'mallets',
  xylophone: 'mallets',
  timpani: 'mallets',
  dulcimer: 'mallets',
  steelDrums: 'mallets',
  agogo: 'mallets',
  woodblock: 'mallets',
  melodicTom: 'mallets',

  // Plucked
  nylonGuitar: 'acoustic-guitar',
  steelGuitar: 'acoustic-guitar',
  jazzGuitar: 'electric-guitar',
  cleanGuitar: 'electric-guitar',
  mutedGuitar: 'electric-guitar',
  overdriveGuitar: 'electric-guitar',
  distortionGuitar: 'electric-guitar',
  // Still an electric guitar, and it is not even a different technique from the
  // audience's side: the hand is on the same neck, touching the string instead
  // of pressing it. Nothing to model.
  guitarHarmonics: 'electric-guitar',
  banjo: 'acoustic-guitar',
  harp: 'harp',
  sitar: 'sitar',
  // **The zithers go to `harp`, not to `sitar`.** The temptation is the other
  // way — both are eastern, both are plucked, both are played sitting — and it
  // would be wrong for a mechanical reason as well as a visual one. A sitar is
  // resolved against four open strings and twenty frets, so a `PlayPoint` on it
  // is a string and a fret; a koto has one string per note and no stopping hand
  // at all, which is the harp's resolution model exactly. Staging one on a
  // fretboard would mean inventing a finger position for a note that is simply
  // a different string.
  koto: 'harp',
  // The exception that proves it: a shamisen *is* a lute, with a neck and a
  // stopping hand, played sitting with the body on the thigh. That is the sitar
  // in every respect an audience reads, minus the gourd.
  shamisen: 'sitar',

  // Bass
  acousticBass: 'upright-bass',
  contrabass: 'upright-bass',
  fingerBass: 'electric-bass',
  pickBass: 'electric-bass',
  slapBass: 'electric-bass',
  slapBass2: 'electric-bass',
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
  // One size up, and `SCALE_OF` in `web/concert/instruments/index.ts` is where
  // that gets said — the saxophones and the two double basses already use it
  // for the same reason. Until it does, a violist is holding a violin, which is
  // a smaller error than a cellist would be.
  viola: 'violin',
  cello: 'cello',

  // Brass
  trumpet: 'trumpet',
  mutedTrumpet: 'trumpet',
  brassSection: 'trumpet',
  // A valve instrument, so `trumpet` rather than `trombone` — which is the
  // choice between two wrong sizes made on the only fact that shows. The
  // trombone's extra footprint exists to leave room for a slide the horn does
  // not have, and a hand on a slide is a different gesture from a hand on
  // valves. The bell facing backwards is a model's problem.
  frenchHorn: 'trumpet',
  trombone: 'trombone',
  // And this one goes the other way for the same reason: the tuba's bulk and
  // its reach down to E1 both fit the trombone's spec far better than the
  // trumpet's, even though a tuba's valves are a trumpet's.
  tuba: 'trombone',
  synthBrass: 'synth',
  synthBrass2: 'synth',

  // Winds
  sopranoSax: 'saxophone',
  altoSax: 'saxophone',
  tenorSax: 'saxophone',
  baritoneSax: 'saxophone',
  // Not a clarinet, despite the reed. A bassoon is a long conical tube carried
  // diagonally across the body on a neck strap, which is a baritone saxophone's
  // posture and silhouette and nothing like a clarinet's straight stick — and
  // `saxophone` is already the archetype that knows how to be four sizes.
  bassoon: 'saxophone',
  clarinet: 'clarinet',
  // The straight-stick winds. A double reed is not a single one and nobody
  // watching will mistake a shehnai for a clarinet, but the thing being staged
  // — a tube held out and down from the mouth, both hands on holes, blown — is
  // the same object at every one of the points the choreographer resolves.
  oboe: 'clarinet',
  englishHorn: 'clarinet',
  shanai: 'clarinet',
  // The worst borrow in the table and the least bad one available. A piper's
  // hands are on a chanter, which really is a tube with finger holes, and the
  // `clarinet` spec gets the posture, the holes and the blowing right. What it
  // cannot show is the bag, the three drones over the shoulder, or the fact
  // that the player is walking. First in the queue for a model.
  bagpipes: 'clarinet',
  flute: 'flute',
  panFlute: 'flute',
  shakuhachi: 'flute',
  // A flute held across the face, and a piccolo is the same object at a third
  // the length — a scale factor rather than a shape. The recorder is not held
  // across at all, which is the one thing about it worth eventually drawing.
  piccolo: 'flute',
  recorder: 'flute',

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
  // Samplers, all six, and that is the honest answer rather than a shrug. An
  // orchestra hit is not an orchestra: it is one chord off a disc, fired from a
  // keyboard by a person who is standing at a keyboard, and the same is true of
  // a reverse cymbal at a section join and of a recording of the sea. Staging
  // any of them as the thing recorded would put an orchestra on the risers for
  // four notes, which is the sort of literalism that reads as a bug.
  //
  // `synthDrum` joins them because a tuned analogue tom is a circuit, played
  // from the same board — see the note above about synth basses, which is the
  // same call one instrument along.
  orchestraHit: 'synth',
  synthDrum: 'synth',
  reverseCymbal: 'synth',
  seashore: 'synth',
  birdTweet: 'synth',
  breathNoise: 'synth',
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

  /**
   * One drum, two bare hands, and a small stand of auxiliary pieces beside it.
   *
   * Not a smaller kit. The reason this is a separate archetype rather than more
   * entries in the kit's layout is that a percussionist is a different *person*:
   * no sticks, no pedals, both hands on one skin, and — the part that decides
   * it — a maqsum or a nyabinghi is the whole percussion part of its number,
   * with no kit anywhere on the stage. Staging those through `drumkit` put a
   * full acoustic kit behind a darbuka player and sent both their hands to a
   * point beside the floor tom where nothing stood.
   *
   * `straddle` for the same reason a cello is: the drum is between the knees.
   *
   * `points` has no `pedal`. That is the one line of this entry the
   * choreographer reads before it will place a foot, and a hand drum has
   * nothing for a foot to do.
   */
  handdrum: S({
    id: 'handdrum', label: 'hand drum', family: 'percussion',
    hands: 2, posture: 'straddle', points: ['drum', 'rest'],
    // As with the kit: strike points are addressed by voice, never by pitch.
    range: [35, 81],
    held: false, footprint: 0.9, workHeight: 0.72,
  }),

  'grand-piano': S({
    id: 'grand-piano', label: 'grand piano', family: 'keys',
    hands: 2, posture: 'sit', points: ['key', 'pedal', 'rest'],
    range: [21, 108], held: false, footprint: 1.5, workHeight: 0.72,
  }),
  /**
   * `control` because a Rhodes has a name rail and its player has a spare hand.
   *
   * The three archetypes that declare `control` are the three whose player
   * *stands at* an object with a face full of switches and can take a hand off
   * it between phrases, and that is exactly the test casting uses to decide who
   * may be handed a drum machine — see `canWorkAPanel` in `cast.ts`. It was
   * `synth` alone, and casting handed machines to these two anyway: 12 of the
   * 51 panel touches that no archetype had claimed were an electric piano's or
   * an organ's. Those two are not the bug the other 39 were — a player standing
   * at a keyboard with a box at their right hand really does reach over, and
   * `aimMachineControls` in `show.ts` really does route the touch to the box —
   * but the spec did not say so, and a spec that does not say so is a list the
   * choreographer was reading past.
   *
   * **The models owe a `control` branch, and until they have one this is a
   * promise on credit.** `web/concert/instruments/electric-piano.ts` and
   * `organ.ts` answer `undefined` for a `control` point today; the show never
   * sees that for a machine on a stand, because the wrapper answers first, but
   * the bare model is what the gallery probes and what `npm run concert` asks —
   * and it is what a `mount: 'bay'` machine or a `patchPart` press on the
   * player's *own* panel would fall through to. The drawbars are the organ's
   * answer and the preamp rail is the Rhodes's.
   */
  'electric-piano': S({
    id: 'electric-piano', label: 'electric piano', family: 'keys',
    hands: 2, posture: 'stand', points: ['key', 'control', 'rest'],
    range: [28, 103], held: false, footprint: 0.9, workHeight: 0.95,
  }),
  organ: S({
    id: 'organ', label: 'organ', family: 'keys',
    hands: 2, posture: 'sit', points: ['key', 'control', 'rest'],
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
    // `control` is the panel, and this is the archetype it was written for: a
    // synthesiser is the object here whose player operates the instrument as
    // well as playing it, and it is the only one whose model answers for one
    // today. The two keyboards above claim it too — see the note on
    // `electric-piano` — because the *player* is the same case, standing at a
    // board with a machine at their elbow. See `PlayPoint`'s `control` member.
    hands: 2, posture: 'stand', points: ['key', 'control', 'rest'],
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
    // 0.7 was the cross-legged player this instrument cannot have: `sit` is a
    // chair, so the model hangs its bridge off the hip and the strings run from
    // about 0.72 at the jawari to 1.15 at the nut. This is where the hands work.
    held: true, footprint: 0.9, workHeight: 0.95,
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
 *  - **A borrowed object is the wrong size.** Everything under "the orchestra"
 *    below is staged on the nearest plausible thing rather than on itself — a
 *    horn on a trumpet, a bassoon on a saxophone, timpani on a vibraphone — and
 *    an archetype range is a statement about the *object*, so it would be a
 *    statement about the wrong instrument. These are the reach of the sound.
 *
 * Anything absent here uses the archetype's own range, which is the common case
 * and stays common: a borrowed archetype only needs an entry when the sound
 * reaches past it, and most of them fit inside comfortably.
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

  // The orchestra, on borrowed objects. Each of these is the catalogue's own
  // number from `INSTRUMENT_RANGE`, restated here because the object it is
  // staged on is a different instrument and would otherwise answer for it.
  //
  // A horn goes eleven semitones below a trumpet's bottom F♯ and a tuba six
  // below a trombone's; a bassoon reaches under the baritone saxophone that is
  // standing in for it; and a piccolo's top octave is simply not on a flute.
  frenchHorn: [41, 77],
  tuba: [28, 65],
  bassoon: [34, 75],
  piccolo: [74, 105],
  // The C string, which is the whole reason to write a viola part and is a
  // fifth below anything a violin has.
  viola: [48, 88],
  // Both directions off the end of a vibraphone, and in opposite directions.
  // Timpani live an octave and a quarter *below* the bottom bar; a xylophone
  // sounds an octave above the written part and runs a fifth past the top one.
  timpani: [38, 57],
  xylophone: [65, 108],
  melodicTom: [36, 67],
  // A harmonic sounds above the string that makes it, so it is reachable at the
  // node rather than at the fret — the one place in this table where a range
  // exceeds an object's because of physics rather than because of size.
  guitarHarmonics: [64, 96],
  // The two open drones are a whole tone below a guitar's low E, and they are
  // most of what a strumstick is.
  strumstick: [38, 69],
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

/** The drum track is not a catalogue entry; the kit is one of the two objects it can be. */
export const DRUM_ARCHETYPE: Archetype = 'drumkit';

/** The other one. Both can be on a stage at once, and in a funk number they are. */
export const HAND_DRUM_ARCHETYPE: Archetype = 'handdrum';

/**
 * Which object each drum voice needs standing under it.
 *
 * The percussion part is one event stream, and it always was — `song.drums`
 * has no notion of who is playing what. That was fine while every voice in
 * `DrumVoice` belonged to one kit, and it stopped being fine when the table
 * grew `lp`/`mp`/`hp`: a hand drum is not a kit piece, and asking one drummer
 * to play a darbuka with their fifth limb is how those three voices came to
 * resolve to a point in the air beside the floor tom.
 *
 * So the split happens here, on the voice, rather than on `DrumTrack.source`.
 * A source field would have to answer for the whole part at once, and a third
 * of the patterns that write hand voices write kit voices in the same bar —
 * funk's `congas`, latin's `cumbia-kit`, reggae's `roots-rockers`. Those are
 * not a drummer choosing between two instruments; they are two people, which
 * is what a conga player standing beside a kit has always been.
 *
 * Three tiers, and the middle one is what makes it work:
 *
 *  - `kit` — sticks, pedals, cymbals and shells. Needs a drum kit.
 *  - `hand` — the three hand-drum strokes. Needs a hand drum.
 *  - `either` — tambourine, clap, shaker, woodblock, cowbell. Auxiliary pieces
 *    that exist at *both* stations, because they do in life: the kit carries a
 *    tambourine on the hi-hat rod and the percussionist has a riq on a stand.
 *
 * The `either` tier is the difference between staging arabic honestly and
 * staging it as a bug. Every `maqsum` pattern is hand strokes plus a riq on
 * `tb`; with two tiers, that `tb` would have conscripted a full acoustic kit,
 * and the picture would be a drummer sitting behind five drums and three
 * cymbals playing a tambourine on the quarter notes.
 */
export type DrumStation = 'kit' | 'hand' | 'either';

export const STATION_OF: Record<DrumVoice, DrumStation> = {
  bd: 'kit', sd: 'kit', rim: 'kit', hh: 'kit', oh: 'kit',
  lt: 'kit', mt: 'kit', ht: 'kit', cr: 'kit', rd: 'kit',
  lp: 'hand', mp: 'hand', hp: 'hand',
  cp: 'either', sh: 'either', tb: 'either', perc: 'either', cb: 'either',
};

/**
 * Who is on stage for this percussion part, and which voices each of them owns.
 *
 * One function, called by casting to decide who exists and by choreography to
 * decide what they play, so the two cannot disagree about whose hand a
 * tambourine is under — which is the only way `either` can be safe.
 *
 * A part with nothing but auxiliary voices in it gets a kit. That is not a
 * fallback so much as the truth: a jazz brush part is `sh` and nothing else,
 * and brushes are played on a snare drum.
 */
export function drumStations(
  voices: Iterable<DrumVoice>,
): { kit: boolean; hand: boolean; owns(voice: DrumVoice): DrumStation } {
  let kit = false;
  let hand = false;
  for (const v of voices) {
    const station = STATION_OF[v];
    if (station === 'kit') kit = true;
    else if (station === 'hand') hand = true;
  }
  if (!kit && !hand) kit = true;
  // Auxiliary pieces follow whoever is standing there, and the kit has first
  // claim: a drummer with a tambourine on the stand is the common case, and a
  // percussionist only inherits one when there is no kit to carry it.
  const auxTo: DrumStation = kit ? 'kit' : 'hand';
  return {
    kit, hand,
    owns: (voice) => (STATION_OF[voice] === 'either' ? auxTo : STATION_OF[voice]),
  };
}

/**
 * The share of a percussion part that belongs to one of its players.
 *
 * The single seam through which casting, choreography and `npm run concert`
 * all read the split, so they cannot disagree about whose tambourine it is.
 * The coverage assertion — one sounding gesture per note — is the reason that
 * matters concretely: two players over one event stream must partition it
 * exactly, and a voice counted for both or for neither fails loudly.
 */
export function drumEventsFor<T extends { voice: DrumVoice }>(
  events: readonly T[], archetype: Archetype,
): T[] {
  const stations = drumStations(events.map((e) => e.voice));
  const want: DrumStation = archetype === HAND_DRUM_ARCHETYPE ? 'hand' : 'kit';
  return events.filter((e) => stations.owns(e.voice) === want);
}

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

// ---------------------------------------------------------------------------
// Which synthesiser
// ---------------------------------------------------------------------------

export interface SynthRigSpec {
  id: SynthRigId;
  label: string;
  /**
   * The years this object could appear on a stage at all — **not** the years it
   * was current.
   *
   * The distinction is load-bearing and got itself wrong once already. `to` was
   * 1979 for the modular, meaning "when the Prophet-5 replaced it", while
   * `rigPoolFor` gave it a weight of 2 through 1983 to say "the bands who
   * already owned one kept hauling it about". Those two statements contradict
   * each other and the gate wins silently: the weight was unreachable and the
   * 1981 stage had no modular on it in 82 concerts, which is not what either
   * table said and is not true of 1981.
   *
   * So this is the outer bound and the weights are the only thing that says how
   * likely. A rig is *eligible* for as long as one could plausibly still be
   * wheeled on; whether it usually is, is `rigPoolFor`'s business and nothing
   * here may quietly override it.
   */
  from: number;
  to: number;
  /**
   * How many of these one band may own.
   *
   * The only field here that is a statement about a *stage* rather than about
   * an object, and the reason this table exists. A modular was the centrepiece
   * a band saved up for; two is a famously well-funded band and three is a
   * trade stand. Everything else is a keyboard and you may have as many as you
   * have players.
   */
  max: number;
  /**
   * Floor it occupies as a radius, overriding `ARCHETYPES.synth.footprint`.
   *
   * A wall of cabinets and a slab on an X-stand are not the same object and
   * have never been the same size, and the stager has been treating them as
   * one — which is why the sightline checks could not be trusted around a
   * modular. See `height`.
   *
   * Measured off the models rather than guessed, and the modular's is smaller
   * than it sounds: `synth-rig-modular.ts` stands its wings at `WING_X = 0.78`
   * and builds them `WING_W = 0.60` across, so the outermost cabinet face is
   * 1.08 m off the centre line. 1.25 covers that and the player. The first
   * draft said 1.7, which is what a wall of cabinets *feels* like, and it put
   * the outer edge of a flanking modular past the masking on the narrower
   * rooms — a number invented from the impression rather than from the object.
   */
  footprint: number;
  /**
   * How tall it stands off the boards, for sightlines.
   *
   * `SILHOUETTE_R` in `cast.ts` measures people against people because a grand
   * piano is knee-high and hides nobody. A modular is 1.7 m of cabinet and
   * hides everybody, so it is the first piece of gear on this stage that has to
   * be in that calculation.
   */
  height: number;
  /**
   * Whether it is furniture: placed like a grand piano rather than stood behind
   * on the gear arc.
   *
   * The arc exists to make several keyboards read as one instrument that people
   * are standing inside. That is right for boards on stands and wrong for a
   * wall — you do not curve a Moog System 55 around anybody, you put it at the
   * back and stand in front of it.
   */
  furniture: boolean;
  /**
   * The most keyboards a player stands at behind this rig.
   *
   * Not a limitation of the models — it is what the objects were. A modular is a
   * *frame*, and what a player put in it was as many boards as the music
   * wanted. A polysynth is a keyboard and stays one: a Prophet with its wooden
   * cheeks on an X-stand is the whole instrument, and a second one is a second
   * station rather than a second tier. A digital slab is a keyboard too — but
   * two of them on a double stand is what the decade looked like, so it stops at
   * two: a stack, not a frame.
   *
   * **A ceiling, not a count.** How many a player actually stands at is
   * `boardsWanted` in `cast.ts`, from the parts they are carrying; this is only
   * how many *this object* could hold. So the modular's 4 is unreachable while a
   * player is limited to two lines — see `MAX_PARTS` — and it stays 4 because the
   * frame is the thing that could hold four, which is what this field means.
   */
  maxBoards: number;
}

export const SYNTH_RIGS: Record<SynthRigId, SynthRigSpec> = {
  /**
   * 1972–77. A cabinet of patch cables the player stands inside, with a plain
   * controller keyboard in front of it.
   *
   * `to: 1985`, which is long after it stopped being what anybody bought, and
   * that is what this field means — see `from`/`to` above. A System 55 did not
   * evaporate when the Prophet-5 shipped; Tangerine Dream and Schulze were
   * still carting them around stages well into the eighties. How *rare* that
   * had become is the weight's job, and setting this to 1979 to say the same
   * thing twice made the weight unreachable instead.
   *
   * `from: 1973` for the same reason read the other way, and it was 1965 — the
   * year the object was *invented*, which is not what this field means. A Moog
   * modular before about 1973 was a studio instrument: Switched-On Bach is 1968
   * and was made in a room, not on a stage. Emerson and Tangerine Dream are
   * what put one in front of an audience. At 1965 the pool was staging walls of
   * cabinets behind a 1968 jazz quintet and a 1968 tanssilava band, which are
   * both anachronisms of the specific kind this field exists to prevent.
   */
  modular: {
    id: 'modular', label: 'modular system', from: 1973, to: 1985,
    max: 2, footprint: 1.25, height: 1.72, furniture: true, maxBoards: 4,
  },
  /**
   * 1978–83. The keyboard *is* the instrument: wooden end-cheeks, one row of
   * knobs, an X-stand.
   *
   * The window is far wider than that label, and on purpose: this is the
   * project's generic keyboard-on-a-stand, and 1978–83 is what it is *modelled
   * on* rather than the only thing it can stand in for. A case with wooden end
   * cheeks, one row of controls and an X-stand under it is a Minimoog in 1970,
   * and it is a Farfisa or a Mellotron before that — which is what a 1968
   * tanssilava band or a 1968 jazz quintet would actually have wheeled in when
   * the pad palette hands them one.
   *
   * That width is what makes the 1974 pool work without a fourth model too: the
   * players who do not get the modular are standing behind Minimoogs, correct
   * and free. It replaced a `from` of 1970, which was the Minimoog's own year
   * and left 1968 falling through to a fallback the verifier then flagged as an
   * anachronism — correctly, because it was one.
   */
  polysynth: {
    id: 'polysynth', label: 'polysynth', from: 1963, to: 1990,
    max: 99, footprint: 0.95, height: 1.05, furniture: false, maxBoards: 1,
  },
  /**
   * 1984–90. A thin plastic slab with membrane buttons and no knobs, usually
   * two of them stacked on a double stand.
   *
   * `maxBoards: 2` is that "usually" made real rather than drawn. The second
   * slab used to be scenery — a keybed of white and black boxes nothing could
   * ever resolve against — and the point of the stack was never the silhouette
   * alone: a player buys the upper board to have a second sound under the same
   * hands. So it is a board in the layout table like any other, `synth.ts` puts
   * real keys on it, and `synth-rig-digital.ts` builds the upper case around
   * them instead of inventing its own.
   */
  digital: {
    id: 'digital', label: 'digital synth', from: 1984, to: 2100,
    max: 99, footprint: 0.95, height: 1.35, furniture: false, maxBoards: 2,
  },
};

/**
 * What a keyboard player could be standing behind in a given year, weighted.
 *
 * Keyed on the year and not on the era, which is the same call
 * `InstrumentBuildOptions.year` already makes and for the same reason: era ids
 * are genre-local, and what a synthesiser looked like is a fact about a decade.
 * Ambient's `tape` era and synth's `polysynth` era are four years apart and
 * should stage the same object without either genre knowing the other exists.
 *
 * The weights are the period statement. In 1974 the modular is what the money
 * went on and everything else on the stage is a Minimoog; by 1981 the modular
 * is the thing in the corner that two bands in ten still cart around; after
 * 1984 it is gone and the slab has won. Availability is enforced separately
 * from weighting — an entry outside its own `from`/`to` is dropped before any
 * draw — so no weight written later can stage a DX7 in 1974.
 */
/**
 * Gear a genre does not own, whatever the year allows.
 *
 * The year table above answers "did this object exist on stages yet", which is
 * a fact about a decade and is why the pool is keyed on a year in the first
 * place. It cannot answer "would *this band* have one", which is a fact about
 * the band, and the two are not the same question: a modular system existed in
 * 1975 and a Finnish dance-pavilion orchestra still did not have one. They
 * hired a van, not a cabinet wall.
 *
 * A veto rather than a per-genre weight table, deliberately. The only statement
 * anybody has to make here is "never", and inventing a full set of weights for
 * every genre would be putting opinions in the file that nobody holds. A genre
 * with nothing to say says nothing and gets the decade's own answer.
 *
 * Jazz is deliberately absent even though it draws modulars in its `electric`
 * era: 1975 fusion with a wall of Moog behind it is Hancock, and a real
 * photograph. Its 1968 era no longer draws one because 1968 is now before
 * `modular.from`, which is where that correction belongs.
 */
const GENRE_RIG_VETO: Record<string, SynthRigId[]> = {
  iskelma: ['modular'],
};

// ---------------------------------------------------------------------------
// How many keyboards, and where they are
// ---------------------------------------------------------------------------

/**
 * One keyboard at a station, in the station's own frame.
 *
 * **This table is the single owner of the layout**, and that matters more than
 * where it happens to live. Two systems need it and they must not disagree: the
 * model in `web/concert/instruments/synth.ts` puts the keys there, and the
 * choreographer in `concert/choreograph.ts` decides whether a hand has time to
 * get from one to another. A second copy of these numbers would let the
 * geometry and the travel budget drift, and the failure would look like a hand
 * arriving early on a board it could not have reached — which is exactly the
 * class of bug this project's own IR seam exists to make impossible.
 *
 * It is geometry in a directory that is otherwise geometry-free, which is the
 * same exception `ArchetypeSpec.footprint` and `workHeight` already are, and for
 * the same reason: the stager and the choreographer cannot do their jobs
 * without a few real measurements.
 */
export interface BoardSpec {
  /** Metres from the station origin: `x` across, `y` up, `z` away from player. */
  at: readonly [number, number, number];
  /**
   * Radians about `+y`, toeing the board in toward the player.
   *
   * **The sign is the opposite of a performer's `facing`, and that is not a
   * mistake to be tidied up.** A body faces the house, so its forward is local
   * `+z` and a player out at `+x` turns toward the middle with a *negative*
   * facing — see `layoutGearArc`. A keyboard faces the other way: the hands come
   * at it from upstage, so the face of it is local `−z`, and turning that face
   * toward a player standing at the centre line means a *positive* yaw at `+x`.
   *
   * Written down because it was wrong here first, and wrong in the way that
   * looks right: the wings carried a body's sign, which splayed them away from
   * the player like a shop display, with their outer ends 1.55 m from the hands
   * that were supposed to reach them and their faces pointing off into the wing
   * masking. The convention note in `types.ts` avoids "stage-left" for exactly
   * this class of bug; this is the same sentence one object further in.
   */
  yaw: number;
  /**
   * Radians about the board's own `+x`, sloping its face toward the player.
   *
   * Right-handed about `+x` like every other rotation in the renderer, and
   * **that makes the useful value negative**: the keys run forward into `−z`
   * toward the player, so a positive angle would drop the far edge and lift the
   * near one, which is a board tipped away. The tier below is `−0.20` for the
   * same reason a lectern is not flat.
   *
   * The rotation is about the *key line* — the back edge of the playing surface
   * — and not about the station origin, which is on the floor. Turning a board
   * about a point a metre under it would swing it bodily toward the player
   * rather than tilt it. The two numbers that define that line, `keyTopY` and
   * `keyBackZ`, belong to the keyboard, so this table says the angle and
   * `placeBoard` in `web/concert/instruments/synth-rig.ts` composes the
   * transform — one piece of arithmetic shared by the keys and by whatever the
   * rig builds under them, for the same reason `yaw` is.
   */
  pitch: number;
  /** What this board can play. The main one is 88 keys; the extras are 61. */
  range: readonly [Midi, Midi];
}

/** The board every keyboard player has: 88 keys, square, under the hands. */
const MAIN_BOARD: BoardSpec = { at: [0, 0, 0], yaw: 0, pitch: 0, range: [21, 108] };

/**
 * The extras, in the order a player would actually add them.
 *
 * **Only the tier is reachable today, and the wings are parked.** A board exists
 * because a part needs it — see `boardsWanted` in `cast.ts` — and a player has
 * two hands, so two parts, so two keyboards. What would unlock a third is a
 * different idea rather than a bigger cap: parts that *alternate* by section,
 * where both hands are free for each in turn and a third board is where the one
 * that is waiting lives. The two entries below are the layout for that day, kept
 * rather than deleted because the geometry is argued and correct — including,
 * now, which way round they face.
 *
 * **A tier before a wing.** The second keyboard anybody buys goes *above* the
 * first, because it costs no floor and both hands can still reach it — which is
 * also why a two-tier stand is the silhouette of the era. Only the fourth and
 * fifth boards go out to the sides, where they cost width and reach.
 *
 * The tier sits 0.285 m up and 0.24 m further from the player: high enough to
 * clear a hand on the lower board with the same margin `synth-rig-digital.ts`
 * argues for at length, and set back because everything past that is stretch.
 *
 * **And it slopes.** A second keyboard held dead level is the one thing about a
 * stack that reads as scenery: nobody bolts the top board of a double stand
 * flat, because flat is where the player can neither see the panel nor get
 * their fingers under the black keys from below. Every such stand has a hinge
 * on the upper arms for exactly this, and 0.20 rad — a little under 12° — is
 * the middle of what one adjusts through. It is also what recovers the tilt
 * `synth-rig-digital.ts` used to fake on its scenery keybed and had to give up
 * when the board became real: the angle belongs here, where the keys read it
 * too, rather than on a case leaning off the keys it is supposed to hold.
 *
 * The wings stay flat. They are at hand height already and are reached across
 * rather than looked at, so a slope on one would only tip its far end out of
 * reach.
 *
 * The wings are toed in half a radian and held at ±0.95, which keeps their
 * inner ends clear of the main board's own 0.61 m half-width in `z` rather than
 * in `x` — they sit 0.21 m further from the player than the main keys end. Half
 * a radian rather than the full 0.6 that would square them to the player: the
 * toe-in brings the far end of a wing 0.12 m closer to the hands and turns its
 * face out of profile, and past that the near end starts walking into the main
 * board's own end cap.
 *
 * The sign of that half radian is `+` on the wing at `+x`. See `BoardSpec.yaw`,
 * where it is argued, because it is the opposite of what a body would carry and
 * it was wrong here for exactly that reason.
 */
const EXTRA_BOARDS: readonly BoardSpec[] = [
  { at: [0, 0.285, 0.24], yaw: 0, pitch: -0.20, range: [36, 96] },
  { at: [0.95, 0.06, 0.16], yaw: 0.5, pitch: 0, range: [36, 96] },
  { at: [-0.95, 0.06, 0.16], yaw: -0.5, pitch: 0, range: [36, 96] },
];

/**
 * The most boards this table can lay out. Beyond it a player is a trade stand.
 *
 * `SYNTH_RIGS.modular.maxBoards` says 4 as a literal rather than referring to
 * this, because that table is declared above and a const cannot be read before
 * it exists. Nothing asserts that the two agree — an earlier version of this
 * comment claimed `npm run concert` did, and it never has.
 *
 * What *is* asserted is the thing that matters more: `every keyboard a player
 * stands at is played`. A count these two disagreed about would have to produce
 * a board with no hand on it to do any harm, and that is the check that fires.
 */
export const MAX_BOARDS = 1 + EXTRA_BOARDS.length;

export function boardsFor(count: number): BoardSpec[] {
  const n = Math.max(1, Math.min(MAX_BOARDS, Math.floor(count)));
  return [MAIN_BOARD, ...EXTRA_BOARDS.slice(0, n - 1)];
}

/**
 * How far apart two boards are, in metres, for the travel budget.
 *
 * Centre to centre and including the height difference, because a hand going up
 * to a tier is travelling as surely as one going sideways — more so, since it
 * has to clear the board it is leaving.
 */
export function boardGap(boards: BoardSpec[], a: number, b: number): number {
  const p = boards[a]?.at;
  const q = boards[b]?.at;
  if (!p || !q) return 0;
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

export function rigPoolFor(
  year: number, genre?: string,
): (readonly [SynthRigId, number])[] {
  const weights: Record<SynthRigId, number> = year < 1978
    ? { modular: 6, polysynth: 5, digital: 0 }
    : year < 1984
      ? { modular: 2, polysynth: 8, digital: 0 }
      : { modular: 0, polysynth: 3, digital: 8 };

  const vetoed = genre ? GENRE_RIG_VETO[genre] ?? [] : [];
  const open = (Object.keys(weights) as SynthRigId[])
    .filter((id) => {
      const spec = SYNTH_RIGS[id];
      return weights[id] > 0 && year >= spec.from && year <= spec.to
        && !vetoed.includes(id);
    })
    .map((id) => [id, weights[id]] as const);

  /**
   * A year outside every window stages **nothing**, and the caller is meant to
   * notice.
   *
   * This used to return the polysynth, under a comment that called itself
   * unreachable and gave its purpose as staging "the plain keyboard rather than
   * nothing". Both halves were wrong at once. It became reachable the moment
   * finnfolk, country, indian, latin and arabic brought eras before 1963 — 1780
   * to 1962, none of them on the four-genre list `concert-check.ts` used to
   * run — and there is no plain keyboard here to stage: every entry in
   * `SYNTH_RIGS` is a dated object, so *whatever* this returns for a year
   * outside all three windows is an anachronism by construction. A table of
   * dated objects has no honest answer for 1780 and should not invent one.
   * Returning nothing is the only answer that cannot be wrong.
   *
   * It is not a silent nothing. `assignRigs` leaves the player unrigged and
   * `npm run concert` fails `every keyboard player is standing behind
   * something`, which is the division of labour the old comment argued for and
   * then undercut — a verifier catching an anachronism beats a pool absorbing
   * one. What it catches is also the real fault, which was never the rig: a
   * synthesiser is on the boards in 1952 because a genre asked for a
   * synthesiser in 1952. The pad palettes in the genres' own `eras.ts` are
   * where that got said and where it is now unsaid; see the note on `carnatic`.
   */
  return open;
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
