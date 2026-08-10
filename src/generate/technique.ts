/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * What the right hand is doing.
 *
 * ## The axis that was missing
 *
 * The catalogue had two ways to say how a part is played and neither of them is
 * this one. `Idiom` (`style/instruments.ts`) says how a line is *shaped* —
 * arpeggios, runs, how badly it needs air — and it is a fact about the fretting
 * hand and the harmony. `Instrument` says what the thing *sounds like*. Between
 * them sat the whole of the right hand, and its absence showed in three places
 * at once:
 *
 *  - **One idiom for twenty-one instruments.** `plucked` covers a nylon guitar,
 *    an upright bass, a slap bass, a sitar and a distortion guitar with a single
 *    figuration profile and a single `detache` of 0.13. Those five differ far
 *    more in how they are struck than in what they are struck at.
 *  - **General MIDI had already conflated the two,** and the catalogue inherited
 *    it: `slapBass`, `pickBass`, `fingerBass` and `mutedGuitar` are four
 *    *techniques* sitting in a list of instruments, so the only way to say
 *    "played with a plectrum" was to change what the band owns.
 *  - **The stage had one gesture.** `choreograph.ts` gave every non-bowed right
 *    hand `kind: 'pluck'`, so a six-string strum and a single bass note were the
 *    same motion. The bowed players had direction state and a visible lift; the
 *    plucked players had nothing.
 *
 * ## What a technique is allowed to change
 *
 * **It modifies; it does not compose.** The same boundary `applyFeel` draws, and
 * for the same reason: the style's tables say what is played and this says how.
 * The catalogue's 705 bass figures and every comp pattern stay exactly as
 * written — a technique never moves an onset, never changes a pitch, and never
 * deletes a note. What it may do:
 *
 *  1. **Add dead strokes.** The hand keeps moving between the notes that sound,
 *     and the strokes that land on damped strings are the groove rather than a
 *     decoration. This is the one thing here that adds events, and it is the
 *     reason the field exists at all: slap without dead strokes is a bright
 *     patch, and a funk guitar without them is a chord on every eighth.
 *  2. **Articulate.** How much of its written length a note actually sounds. A
 *     palm mute is the same figure at a third of the length.
 *  3. **Colour.** An envelope and a small effects chain merged over the
 *     instrument's own, because a plectrum really does have a harder front than
 *     a thumb and both are the same bass.
 *  4. **Move the hand.** A `GestureKind` for the concert, which is where an
 *     audience actually reads technique — see `concert/choreograph.ts`.
 *
 * ## What it cannot do, and this is worth stating plainly
 *
 * **The figurational half of a technique is out of reach here.** Travis picking
 * is a thumb alternating a bass note under fingers on the offbeats; that is a
 * decision about *which notes*, and under the rule above this file may not make
 * it. So `fingerstyle` gets its articulation, its colour and its hand, and plays
 * whatever figure the style drew. That is an honest partial rather than a
 * pretence: the part is played the way a fingerstyle player plays, on a figure
 * a fingerstyle player did not choose. Closing the gap means figure tables per
 * technique, which is a different and much larger piece of work.
 *
 * ## It costs no random number from anybody else's stream
 *
 * The draw runs on `new Rng(`${seed}:technique`)` — the idiom `generateVocalTrack`
 * already uses — so adopting this moved no existing song except through its own
 * effect. Verified across all 389 genre/style pairs: with every instrument's
 * technique list removed, the emitted songs hash identically to the tree before
 * this file existed.
 */

import { SLOTS_PER_BEAT } from '../core/grid.js';
import type { Rng } from '../core/rng.js';
import type { Effects, Envelope, NoteEvent, PlayedLayer } from '../core/types.js';

/**
 * How the string is set in motion.
 *
 * Six, and the list is bounded by a rule rather than by taste: each entry is a
 * distinct thing the right hand *does*, with a different articulation, a
 * different front on the note and a different motion on stage. Two ways of
 * playing that differ only in which notes come out are one entry here and two
 * figures in a style table.
 *
 * That rule is what keeps `arpeggiate` off the list, and it was drafted on it.
 * A broken chord is already expressible — `Style.comp` patterns carry
 * `arpeggio`, and `IdiomProfile.arpeggio` biases the melody toward one — so an
 * entry here would have been a second spelling of a decision the catalogue
 * already makes, with the two free to disagree.
 */
export type Technique =
  /**
   * Flesh on the string. The default anywhere a hand has no plectrum in it, and
   * deliberately the entry that changes nothing: it exists so that "played with
   * the fingers" is sayable rather than merely unstated.
   */
  | 'fingers'
  /** A plectrum: a harder, brighter front, and the note stops sooner. */
  | 'plectrum'
  /**
   * The heel of the hand resting on the strings at the bridge. Motown and dub
   * on a bass, surf and every downstroked riff since 1970 on a guitar — one
   * gesture, and the two genres that own it are two centuries of distance
   * apart in everything except what the hand is doing.
   */
  | 'muted'
  /**
   * Thumb on the low string, finger under the high one, and the sixteenths
   * between them played on damped strings. Larry Graham invented it to replace
   * a drummer, which is the whole argument for `dead` below: the technique is a
   * rhythm before it is a sound.
   */
  | 'slap'
  /**
   * The hand runs a continuous stroke grid across the strings and only some of
   * the strokes sound a chord. Chordal layers only — a strum is a statement
   * about several strings at once and there is nothing for it to do on a line.
   */
  | 'strum'
  /** Fingers on separate strings, nothing damped, everything ringing on. */
  | 'fingerstyle';

/**
 * The strokes that do not sound a note.
 *
 * A dead stroke is the hand arriving on a damped string: an attack with no
 * pitch to speak of, on the grid the hand is already keeping. The three numbers
 * are the whole of it, and each is on a different axis on purpose — how fast
 * the hand is moving, how often it actually touches, and how hard.
 */
export interface DeadStrokes {
  /**
   * The grid the hand is running, in sixteenths. 1 is sixteenths, 2 eighths.
   *
   * Not derived from the figure, and that is the point: the hand's grid is
   * *independent* of where the notes are, which is what separates a stroke
   * pattern from an ornament. A funk guitarist's hand is moving in sixteenths
   * whether the chord lands on one of them or not.
   */
  step: number;
  /**
   * Chance an empty slot on that grid is touched, 0..1.
   *
   * Below 1 because a hand that touched every empty slot would be a machine,
   * and because the slots it skips are where the figure breathes.
   */
  chance: number;
  /**
   * Level, as a fraction of the *local* mean velocity rather than an absolute.
   *
   * Relative for the reason `Feel.ghost` is relative: this pass runs after
   * dynamics and after the solo ride, so a fixed number would be a different
   * distance under the part in every section. A fraction stays put.
   */
  level: number;
  /** Sounding length, in sixteenths. A dead stroke is short by definition. */
  length: number;
}

/**
 * How far from a sounding note the hand is still keeping its grid, in units of
 * `DeadStrokes.step`.
 *
 * Two, and the number is doing real work rather than trimming an edge case. The
 * first draft placed a dead stroke on *every* empty slot of the grid, which
 * treats the hand as a metronome that never stops — and measured over the
 * catalogue it produced a tango guitar chugging eighth-note mutes through a
 * figure that plays two chords a bar. 171 dead strokes against 70 chord strikes,
 * on a part whose whole character is the space between the chords.
 *
 * The correction is a fact about arms: **a hand keeps its stroke pattern while
 * it is playing and stops when the figure stops.** So a dead stroke needs a
 * sounding onset within this reach on *both* sides — it fills the gaps inside a
 * pattern, never the silence around one. A slap figure with onsets three
 * sixteenths apart is filled throughout; a comp that plays on one and three is
 * left alone, without either of them having to say which they are.
 *
 * That also makes the technique self-limiting across a catalogue it has never
 * seen: a genre that adopts `strum` gets dead strokes in proportion to how busy
 * its own comp figures already are, which is the proportion a player would use.
 */
const HAND_REACH = 2;

export interface TechniqueProfile {
  label: string;
  /**
   * Layers this technique can appear on.
   *
   * `strum` is chordal and `slap` is a bass technique; the rest go anywhere a
   * plucked instrument is cast. This is the second of the three intersections
   * `chooseTechnique` takes — see there for why all three are intersections.
   */
  layers: readonly PlayedLayer[];
  /**
   * How much of its written length a note sounds, as a multiplier.
   *
   * Applied to `duration` and nothing else. The onset never moves, so this
   * cannot change the rhythm — only how long the note holds after it.
   */
  length: number;
  /** Merged over the instrument's own envelope. See `envelopeFor`. */
  envelope?: Partial<Envelope>;
  /**
   * Merged over the instrument's own effects, and therefore over the style's,
   * the era's and the genre's.
   *
   * Last for the reason `Instrument.effects` gives for being late in that chain
   * and then one step further: a decade describes the room, an instrument
   * describes the object, and this describes what the player is doing to it
   * right now. A 1970s production cannot un-mute a palm-muted guitar.
   */
  effects?: Effects;
  /** Absent means the hand only ever touches a string to sound it. */
  dead?: DeadStrokes;
  /**
   * What the right hand does on stage, as a `GestureKind` name.
   *
   * A string rather than the imported union, because `concert/` imports from
   * `generate/` and not the other way round; `choreograph.ts` maps it. The
   * mapping is total and `npm run concert` asserts it.
   */
  gesture: 'pluck' | 'strum' | 'thumb' | 'fingers';
}

/**
 * The table.
 *
 * The numbers are a considered first pass in the sense `IDIOM_ENVELOPES` means
 * it — argued from what the hand physically does, not measured — and `bench.html`
 * is where they get settled by ear. Two of them are not adjustable taste and
 * should be defended before they are moved:
 *
 *  - **`muted.length` at 0.34.** A palm mute is not a quiet note, it is a short
 *    one; the level barely changes and the length is most of the effect. Setting
 *    this near 1 and compensating with the envelope produces a note that decays
 *    like a mute and is still holding the pitch, which is the thing a mute
 *    exists to stop.
 *  - **`slap.dead.step` at 1.** Sixteenths. The technique's whole claim is that
 *    the hand is a drummer, and a drummer keeping eighths is playing a different
 *    instrument.
 */
export const TECHNIQUES: Record<Technique, TechniqueProfile> = {
  fingers: {
    label: 'fingers',
    layers: ['bass', 'comp', 'pad', 'melody', 'counter', 'brass'],
    length: 1,
    gesture: 'fingers',
  },
  plectrum: {
    label: 'plectrum',
    layers: ['bass', 'comp', 'pad', 'melody', 'counter', 'brass'],
    length: 0.9,
    // A pick is a hard edge on a soft string: the front arrives sooner and the
    // note gives up sooner. Both halves are small — this is the same instrument.
    envelope: { attack: 0.0015, decay: 0.95 },
    gesture: 'pluck',
  },
  muted: {
    label: 'palm mute',
    layers: ['bass', 'comp', 'melody', 'counter'],
    length: 0.34,
    envelope: { attack: 0.002, decay: 0.3, sustain: 0, release: 0.07 },
    // The heel of the hand is a low-pass filter made of meat, and 1500 Hz is
    // roughly where it sits: the fundamental and the first two partials survive
    // and the string noise that says *ringing* does not.
    effects: { lowpass: 1500 },
    gesture: 'thumb',
  },
  slap: {
    label: 'slap and pop',
    layers: ['bass'],
    length: 0.7,
    envelope: { attack: 0.001, decay: 0.85, sustain: 0, release: 0.16 },
    dead: { step: 1, chance: 0.42, level: 0.17, length: 0.5 },
    gesture: 'thumb',
  },
  strum: {
    label: 'strumming',
    layers: ['comp', 'pad'],
    length: 0.85,
    envelope: { attack: 0.004, decay: 1.25 },
    /**
     * Eighths rather than the sixteenths a funk chank runs, and the reason is
     * that this entry is the whole catalogue's strummer.
     *
     * A sixteenth grid is right for funk and wrong for a country back-beat, a
     * reggae skank and a folk waltz, which are the other things drawing it. A
     * genre that wants the faster hand says so in its own table rather than
     * making every strummer in nineteen genres play sixteenths — see
     * `Style.techniques`, which can carry a profile override.
     */
    dead: { step: 2, chance: 0.34, level: 0.15, length: 1 },
    gesture: 'strum',
  },
  fingerstyle: {
    label: 'fingerstyle',
    layers: ['comp', 'pad', 'melody', 'counter'],
    // Over 1: a fingerpicked note is left to ring past its written length
    // because there is nothing damping it and the next finger is on a different
    // string. This is the only entry that lengthens, and it is why `length` is a
    // multiplier rather than a fraction.
    length: 1.2,
    envelope: { attack: 0.006, decay: 1.45, sustain: 0, release: 0.34 },
    gesture: 'fingers',
  },
};

/**
 * Which technique this player uses on this layer, or nothing at all.
 *
 * **Three intersections, in one direction each**, and the shape is deliberately
 * the shape `Style.instruments` already established in `chooseInstruments`:
 *
 *  1. The **instrument** says what is possible. A grand piano has no entry and
 *     therefore no technique — the whole axis is about a hand on a string.
 *  2. The **technique** says which layers it belongs on. A slap is a bass
 *     technique and a strum is a chordal one, and neither claim is the
 *     instrument's to make.
 *  3. The **style** says which of the survivors this music wants, and only
 *     among the survivors — a style asking for a slap on a nylon guitar gets
 *     the nylon guitar's own list, exactly as an era out-ranks a style's
 *     instrument preference.
 *
 * Returning `undefined` rather than falling back to `fingers` is the important
 * case and not a shortcut: absent means *this part has no right-hand technique*,
 * which is true of a horn and an organ, and it is what keeps `Track.technique`
 * from becoming a field every track carries and nothing reads.
 */
export function chooseTechnique(args: {
  rng: Rng;
  layer: PlayedLayer;
  /** The instrument's own list. Absent on anything that is not plucked. */
  offered: readonly (readonly [Technique, number])[] | undefined;
  /** The style's preference for this layer, if it has one. */
  wanted: readonly (readonly [Technique, number])[] | undefined;
}): Technique | undefined {
  const { offered, wanted, layer, rng } = args;
  if (!offered?.length) return undefined;
  const here = offered.filter(([t]) => TECHNIQUES[t].layers.includes(layer));
  if (!here.length) return undefined;
  const owned = new Set(here.map(([t]) => t));
  const asked = wanted?.filter(([t]) => owned.has(t));
  return rng.weighted(asked?.length ? asked : here);
}

/**
 * Play an already-written part the way the hand plays it.
 *
 * In place, on the finished layer, after dynamics and after the solo ride, for
 * the reason `DeadStrokes.level` gives: the added strokes are measured against
 * the part's own level, so they have to be added once the part is at its level.
 * Before the swing, so a stroke on the offbeat swings with everything else.
 *
 * The dead strokes are placed **against the finished part**, which means against
 * any ghost `applyFeel` has already written. That ordering is the one that keeps
 * the feel library honest: a ghost lands where its layer is silent, so running
 * this pass first would have quietly suppressed funk's ghosted bass notes and
 * changed a number `npm run genres` asserts, without a line of the feel code
 * changing.
 */
export function applyTechnique(args: {
  notes: NoteEvent[];
  technique: Technique;
  layer: PlayedLayer;
  rng: Rng;
  /** The style's bar length, for walking the hand's grid across the part. */
  beatsPerBar: number;
  /** The downbeat of the final bar. Nothing at or after it is touched. */
  endsAt: number;
  /** Profile override, where a style has one. See `Style.techniques`. */
  profile?: TechniqueProfile;
}): void {
  const profile = args.profile ?? TECHNIQUES[args.technique];
  const { notes, rng } = args;
  if (!notes.length) return;

  /**
   * How much of its written length this note actually sounds — with two notes
   * that the multiplier is not allowed to touch.
   *
   * **A note already held across a barline keeps its length.** That is a sustain
   * the arrangement asked for rather than an articulation this pass gets to
   * reconsider: `generate/transition.ts` plans a *break* by leaving one part
   * ringing through a bar the rest of the band has vacated, and it picks that
   * part before anybody's right hand is known. Palm-muting the one note holding
   * a break emptied it — `a break leaves someone playing` went from 383 bars
   * carried to one bar with nothing sounding in it at all. It costs the
   * technique nothing worth having: a muted riff is eighths and sixteenths, and
   * none of them were ever crossing a barline.
   *
   * **On the tune and the answer, the multiplier may only shorten.** Those two
   * are auditioned against each other and then trimmed by `trimOverlaps`, which
   * knows about both parts; this pass sees one. Letting `fingerstyle` ring on
   * here put 4 counter notes on top of a melody note an octave above them and
   * tripped `the answer never doubles the tune at the unison or octave by
   * accident`, which is a check about two parts and cannot be satisfied from
   * inside one. Shortening is safe in a way lengthening is not, and the
   * asymmetry is the whole rule.
   */
  const bar = args.beatsPerBar;
  const held = (note: NoteEvent) =>
    Math.floor(note.beat / bar + 1e-9) !== Math.floor((note.beat + note.duration - 1e-9) / bar);
  const lengthens = args.layer === 'melody' || args.layer === 'counter'
    ? Math.min(1, profile.length)
    : profile.length;

  if (lengthens !== 1) {
    for (const note of notes) if (!held(note)) note.duration *= lengthens;
    /**
     * …but a string cannot still be ringing when it is struck again.
     *
     * Only `fingerstyle` lengthens, and lengthening is the direction that can
     * break something: a note held past the next strike of *its own pitch* is
     * two overlapping notes on one string, which is impossible on the instrument
     * and worse than impossible in MIDI — a note-off is addressed by channel and
     * pitch, so the first release silences both and the part loses the note it
     * was supposed to be sustaining.
     *
     * Measured across all 389 genre/style pairs, the uncapped multiplier added
     * **12,409** same-pitch overlaps to the 26,097 the catalogue already carries
     * for its own reasons. Capping removes every one of them and takes a further
     * few thousand off the existing total, because `muted` and `strum` shorten.
     *
     * Per pitch and not per part: two strings ringing at once is a guitar, and
     * the notes only collide where they are the same string.
     */
    const byPitch = new Map<number, NoteEvent[]>();
    for (const note of notes) {
      const at = byPitch.get(note.midi);
      if (at) at.push(note);
      else byPitch.set(note.midi, [note]);
    }
    for (const string of byPitch.values()) {
      string.sort((a, b) => a.beat - b.beat);
      for (let i = 0; i + 1 < string.length; i++) {
        /**
         * Floored, because two notes can share a beat *and* a pitch — a comp
         * whose voicing doubles a tone at the unison — and `room` is then zero.
         * A zero-length note is not a shorter note, it is a note that several
         * later passes and both renderers are entitled to drop, which would make
         * this the one thing a technique may not do: delete something.
         */
        const room = Math.max(1 / SLOTS_PER_BEAT, string[i + 1]!.beat - string[i]!.beat);
        if (string[i]!.duration > room) string[i]!.duration = room;
      }
    }
  }

  const dead = profile.dead;
  if (!dead || !profile.layers.includes(args.layer)) return;

  /**
   * The part's own level, which is what the added strokes are a fraction of.
   *
   * The median rather than the mean, because a figure with one accent on the
   * downbeat and seven notes under it has a mean the accent drags upward, and a
   * dead stroke sized off that is audible as a note. The median is the level the
   * part actually sits at.
   */
  const levels = notes.map((n) => n.velocity).sort((a, b) => a - b);
  const median = levels[Math.floor(levels.length / 2)]!;

  /** Slots already spoken for, so the hand never touches a ringing string. */
  const taken = new Set<number>();
  for (const note of notes) taken.add(Math.round(note.beat * SLOTS_PER_BEAT));
  const onsets = [...taken].sort((a, b) => a - b);

  const step = Math.max(1, Math.round(dead.step));
  const reach = step * HAND_REACH;
  const first = onsets[0]!;
  const last = Math.round(args.endsAt * SLOTS_PER_BEAT);
  const added: NoteEvent[] = [];

  /**
   * Is the hand still moving here? See `HAND_REACH`.
   *
   * Both sides, and the walk is a two-pointer over the sorted onsets rather than
   * a scan per slot, because the parts this runs on reach five figures of notes
   * and this is the inner loop of the pass.
   */
  let ahead = 0;
  const playing = (slot: number, behind: number): boolean => {
    while (ahead < onsets.length && onsets[ahead]! <= slot) ahead++;
    const next = onsets[ahead];
    return behind >= 0 && slot - behind <= reach
      && next !== undefined && next - slot <= reach;
  };

  /**
   * The hand landing is what *stops* the string.
   *
   * A dead stroke is not laid beside the note before it, it lands on top of it:
   * the palm arrives, whatever was ringing stops, and the click is the sound of
   * it stopping. So every note still sounding across the stroke's slot is cut to
   * end there, and the stroke takes the lowest of their pitches — the string the
   * hand is nearest, and on a bass the one it just played.
   *
   * This is the half of the design that took two attempts, and the first attempt
   * was wrong in two ways at once. Placing the stroke at the previous *onset's*
   * pitch and leaving that note alone produced two same-pitch notes overlapping,
   * which is a real fault rather than an aesthetic one: MIDI addresses a note-off
   * by channel and pitch, so the dead stroke's note-off silenced the chord it was
   * supposed to be decorating. And it was backwards musically — the whole
   * character of a chank is that the chord *ends* on the muted stroke.
   *
   * Shortening a note is within what a technique may do: `TechniqueProfile.length`
   * already articulates every note in the part, and this is the same edit made
   * locally by a hand that has a reason. No onset moves, no pitch changes and
   * nothing is deleted, which is where the boundary actually sits.
   *
   * `damp` starts one behind `cursor` and never rewinds past a note that has
   * already finished, so the whole pass stays linear in the part's length.
   */
  let damp = 0;
  let behind = -1;
  let cursor = 0;
  let over = notes[0]!.midi;
  const dying: NoteEvent[] = [];
  for (let slot = first; slot < last; slot += step) {
    while (cursor < notes.length && Math.round(notes[cursor]!.beat * SLOTS_PER_BEAT) <= slot) {
      behind = Math.round(notes[cursor]!.beat * SLOTS_PER_BEAT);
      over = notes[cursor]!.midi;
      cursor++;
    }
    if (taken.has(slot)) continue;
    if (!playing(slot, behind)) continue;
    // Drawn for every eligible slot whether or not it lands, so the stream this
    // walks is a function of the grid rather than of how many strokes came out.
    if (!rng.chance(dead.chance)) continue;

    const beat = slot / SLOTS_PER_BEAT;
    while (damp < notes.length && notes[damp]!.beat + notes[damp]!.duration <= beat) damp++;
    dying.length = 0;
    for (let i = damp; i < notes.length && notes[i]!.beat < beat; i++) {
      if (notes[i]!.beat + notes[i]!.duration > beat) dying.push(notes[i]!);
    }
    /**
     * Nothing ringing is not a reason to skip the stroke.
     *
     * Drafted as a guard and removed, because it is wrong about the technique
     * that most needs this: a slap thumb lands on a string the fretting hand has
     * *already* damped, and the click exists whether or not anything was still
     * sounding. Enforcing it cost slap 60% of its strokes — the figures are short
     * enough that the previous note has almost always stopped by the next
     * sixteenth — and left the technique sounding like the patch again.
     *
     * So the damping is a consequence of the stroke rather than a condition for
     * it. Where something rings, the hand stops it; where nothing does, the hand
     * lands on the string it last played, which is what `over` has been tracking.
     */
    for (const note of dying) note.duration = beat - note.beat;
    added.push({
      beat,
      duration: dead.length / SLOTS_PER_BEAT,
      midi: dying.length ? Math.min(...dying.map((n) => n.midi)) : over,
      /**
       * Proportional, with a floor that cannot reach the cap.
       *
       * The floor was 0.05 and that was a bug of exactly the kind this project's
       * checks exist to find: on a quiet part — a comp riding low under a solo —
       * `median * 0.17` falls under 0.05, the floor took over, and the stroke
       * came out *louder* relative to its surroundings than the technique asked
       * for. `a dead stroke stays under the music it sits in` caught it at 5,861
       * strokes. 0.01 is under 0.35 of any median this pass can see, since the
       * layer normalisation two screens up in `song.ts` floors a real note at
       * 0.08 and 0.08 × 0.35 = 0.028.
       */
      velocity: Math.max(0.01, median * dead.level),
      dead: true,
    });
  }

  if (!added.length) return;
  notes.push(...added);
  notes.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
}
