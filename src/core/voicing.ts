/**
 * Chord voicing — deciding *which* notes of a chord sound, and *where*.
 *
 * This is the difference between a chord symbol and an arrangement, and it is
 * the place where music that is theoretically correct most reliably sounds
 * wrong. Two rules do nearly all the work, and both are about register rather
 * than about harmony:
 *
 *  1. **Low-interval limits.** A major third is a warm interval at C4 and mud
 *     at C2. The ear resolves two close partials in the bass as a beating
 *     rumble rather than as harmony, because the critical band is roughly
 *     constant in Hz and so covers ever more semitones the lower you go. Every
 *     orchestration text states this as a table, and the table is not advice:
 *     an E2/G2 third makes the whole arrangement sound cheap no matter what is
 *     written above it. Measured on this generator before the rule existed,
 *     10% of jazz and ambient voicings had a second or smaller below middle C.
 *
 *  2. **The third and the seventh are not optional.** They are what the chord
 *     *is* — the fifth is nearly redundant and the root is usually in the bass
 *     already. The previous priority order dropped the third first, so 16% of
 *     iskelmä voicings had no quality at all, and a `V7` routinely sounded as
 *     root-fifth-seventh with the leading tone missing. A dominant without its
 *     third does not pull anywhere, which makes every cadence in the song limp.
 *
 * The second rule has exactly one exemption, and it is granted to a *style*
 * rather than to a chord: `power` states the root and the fifth and refuses the
 * third at every number of voices, because in the repertoire that asks for it
 * the absent third is the harmony rather than a note that went missing. It is
 * argued at `powerTones`, which is deliberately not a branch of `chooseTones` —
 * the rule above is not being weakened, a different object is being built.
 *
 * The construction is bottom-up: place the lowest voice, then require each
 * voice above it to clear the minimum interval for the register it lands in.
 * That guarantees both rules by construction rather than checking for them
 * afterwards, and it makes unison doubling impossible — each voice is strictly
 * above the last.
 */

import type { Chord, ChordQuality } from './chord.js';
import { chordPcs } from './chord.js';
import type { Midi, Pc } from './pitch.js';
import { pc } from './pitch.js';
import type { Scale } from './scale.js';
import { snapToScale, stepInScale } from './scale.js';

export type VoicingStyle = 'tertian' | 'guide' | 'quartal' | 'spread' | 'power';

export interface VoicingOptions {
  voices: number;
  centre: Midi;
  lo?: Midi;
  hi?: Midi;
  /**
   * `tertian` stacks the chord from the root — right for dance-band comping.
   * `guide` drops the root and leads with the 3rd and 7th, which is how a jazz
   * pianist voices under a walking bass that already owns the root.
   * `quartal` stacks fourths from the scale — the modal-jazz sound.
   * `spread` opens the stack out, which is what a pad wants: a pad voiced in
   * close position is indistinguishable from the comp playing the same chord.
   * `power` is the rhythm guitar: root and fifth and no third, doubled outward
   * at the octave. A fixed shape rather than a choice of tones, which is why it
   * is argued at `powerTones` and not here.
   */
  style?: VoicingStyle;
  /** Required by `quartal`. */
  scale?: Scale;
  /** The previous voicing, for voice leading. */
  previous?: Midi[];
  /**
   * Hard ceiling — no voice may reach this note or above.
   *
   * This is how the arrangement keeps out of the tune's way. Supplied per bar
   * from the melody's planned register, so a comp that would otherwise voice
   * itself straight through the melody gets pushed underneath it instead.
   */
  ceiling?: Midi;
  /**
   * How strictly the low-interval limits apply, 0..1. Driven by smoothness:
   * at 0 the arrangement is allowed to be muddy on purpose, at 1 the spacing is
   * textbook.
   */
  clarity?: number;
}

/**
 * Minimum interval permitted between two adjacent voices whose *lower* note is
 * `bottom`, in semitones.
 *
 * The strict column is the conventional low-interval-limit table. The loose
 * column is what the ear will tolerate when the music wants to be dense on
 * purpose. `clarity` mixes between them.
 *
 * Above middle C the limit falls to a semitone, which matters: a jazz voicing
 * *wants* its seconds, and forbidding them everywhere would flatten the genre.
 * Seconds are not the problem — seconds in the bass are the problem.
 */
export function minInterval(bottom: Midi, clarity = 1): number {
  const strict = bottom < 40 ? 12    // below E2 — octaves and fifths only
    : bottom < 48 ? 7                // E2–B2 — a fifth
      : bottom < 55 ? 5              // C3–F#3 — a fourth
        : bottom < 60 ? 4            // G3–B3 — a major third
          : bottom < 67 ? 2          // C4–F#4 — a whole tone
            : 1;                     // above G4 — anything
  // Even the loose column keeps a minor third below middle C. Smoothness 0 is
  // meant to allow chaos, and chaos is a musical choice in the melodic line and
  // in upper-structure clusters — but a second in the bass is not a choice
  // anyone makes, it is a defect, and no style benefits from it. A style that
  // turns the rules off (bebop sets `strictness: 'free'`) is asking for
  // chromatic freedom in the *tune*; it is not asking for a muddy piano.
  const loose = bottom < 40 ? 10
    : bottom < 48 ? 5
      : bottom < 55 ? 4
        : bottom < 60 ? 3
          : 1;
  return Math.max(1, Math.round(loose + (strict - loose) * clamp01(clarity)));
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Which chord tones survive, in ascending order of their interval above the
 * root, when only `voices` of them can sound.
 *
 * The order things are dropped is the whole content of this function, and it is
 * the standard arranging answer: the fifth first (it is implied by the root and
 * adds no information), then the root (the bass has it), then the extensions.
 * The third and the seventh are kept to the last possible moment because they
 * are the only two notes that say what the chord is.
 */
export function chooseTones(chord: Chord, voices: number, opts: {
  /** Drop the root when the bass is already holding it. */
  rootInBass?: boolean;
} = {}): Pc[] {
  const pcs = chordPcs(chord);
  const root = pcs[0]!;
  const third = pcs[1];
  const fifth = pcs[2];
  const seventh = pcs[3];
  const extensions = pcs.slice(4);

  /**
   * Suspensions have no third; their whole identity is the 4th or 2nd standing
   * in for it, so that note is the one that must survive.
   *
   * The *suspended dominant* is deliberately not in this set even though it is
   * suspended, and the omission is doing work rather than being an oversight. A
   * `sus4` triad is three notes and losing any of them loses the chord, so it is
   * taken whole. A `dom7sus4` is four, and its suspended fourth already sits
   * where a third would in the stack — so `essential` picks up that fourth and
   * the seventh without being told, and the *root* stays droppable. Which is
   * exactly what a rootless left-hand voicing of one needs, and taking it whole
   * would put the root back under a bass player who already has it.
   */
  const isSus = chord.quality === 'sus4' || chord.quality === 'sus2';

  const essential: Pc[] = [];
  if (third !== undefined) essential.push(third);
  if (seventh !== undefined) essential.push(seventh);

  // Altered fifths are not the ordinary droppable fifth — a ♯5 or ♭5 *is* the
  // alteration, and dropping it leaves a plain dominant.
  const alteredFifth = chord.quality === 'aug'
    || chord.quality === 'dom7sharp5' || chord.quality === 'dom7flat5'
    || chord.quality === 'dim' || chord.quality === 'dim7' || chord.quality === 'halfdim7';

  const optional: Pc[] = [];
  if (alteredFifth && fifth !== undefined) optional.push(fifth);
  if (!opts.rootInBass) optional.push(root);
  optional.push(...extensions);
  if (!alteredFifth && fifth !== undefined) optional.push(fifth);
  if (opts.rootInBass) optional.push(root);

  const chosen: Pc[] = isSus ? [root, ...pcs.slice(1)] : [...essential];
  for (const p of optional) {
    if (chosen.length >= voices) break;
    if (!chosen.includes(p)) chosen.push(p);
  }
  // Fewer tones than voices: double from the bottom of the chord upward. The
  // doubling is by octave, never at unison — placement guarantees that.
  let i = 0;
  while (chosen.length < voices && pcs.length) {
    chosen.push(pcs[i % pcs.length]!);
    i++;
  }
  while (chosen.length > voices) chosen.pop();

  // Stack in ascending order of interval above the root, which is what makes a
  // tertian voicing read as the chord rather than as an inversion by accident.
  const order = (p: Pc) => ((p - root) % 12 + 12) % 12;
  return chosen.slice().sort((a, b) => order(a) - order(b));
}

/**
 * The power chord: root and fifth, doubled outward, with no third at any number
 * of voices.
 *
 * Beside `chooseTones` rather than inside it, and that placement is the whole
 * design decision. Everything that function does is *selection* — which of a
 * chord's own tones can be spared when there are not enough voices to sound all
 * of them — and its answer, that the third and the seventh go last, is right and
 * is not touched here. The measurement behind it is real: 16% of iskelmä
 * voicings with no quality in them at all, and a `V7` whose leading tone had
 * been dropped, which makes every cadence in the song limp.
 *
 * A power chord is not a triad with a note missing. It is a **shape** — two
 * strings barred at one fret, two pitch classes wide, stacked
 * root-fifth-root-fifth for as many voices as the part asks for — and it is
 * built *on* a chord rather than *out of* one. Rock and metal spend whole
 * records on it, and having no third is the harmony rather than an omission: the
 * `i` an organ states as a minor triad is a bare fifth on the guitar in the same
 * bar of the same song, and the riff over it is free to be in either mode. That
 * is exactly why this is a `VoicingStyle` and not a `ChordQuality`. The chord
 * has not changed; one instrument's way of playing it has, and the chart, the
 * bass and the tune all go on spelling the real chord underneath.
 *
 * ## What it replaces, in numbers
 *
 * The only route through this file that never asked for a third was
 * `voicing: 'quartal'` at `voices: 2`, and metal's table took it and published
 * what that produced across its catalogue — 68.2% fourths, 26.8% tritones, 3.0%
 * fifths. Measured again here with one probe run over both, twenty-four styles,
 * eight songs each, 292,000 comp onsets:
 *
 *                          quartal    power
 *     a perfect fifth         2.0%    89.8%   — the chord as a guitarist plays it
 *     a perfect fourth       68.2%     7.5%   — the same two notes, inverted
 *     a tritone              23.4%     0.1%
 *     a third or a sixth      6.3%     2.5%   — arriving after the voicer, plus
 *                                               the four styles that voice triads
 *
 * The tritones under `quartal` are arithmetic rather than taste. `voiceQuartal`
 * steps the *scale*, and three steps up from a mode's ♭2 or ♭6 is six semitones
 * rather than seven, while `bII` and `VI` are two of the four chords that genre
 * plays most. Building from the chord instead of from the scale is what removes
 * them, and it is also why nothing here needs a `scale` passed to it. The 0.1%
 * that survives is not a residue of the same fault: it is one progression in one
 * style that writes a `iio`, where a tritone is what the chord *is* — see below.
 *
 * The second number is the one worth keeping, because it is not about intervals.
 * `voiceQuartal` is the one routine in this file that never consults
 * `minInterval`; it steps the scale and then slides the finished stack into the
 * window. So it does not merely voice the wrong interval, it voices it anywhere:
 * **19.2% of metal's comp onsets came back with a `voicingFaults()` complaint
 * against them**, nearly all of them a fourth sitting below C3 where the limit
 * is a fifth. Through the ordinary placement machinery that falls to 1.2%, and
 * the remainder is not this function's: nothing that leaves here is faulty, and
 * what is left arrives afterwards from `resolveCollisions` displacing a voice.
 *
 * ## Above two voices
 *
 * Root, fifth, octave. Not "a triad with something missing" — it is the shape
 * every guitarist actually fingers, and it is the reason the third voice is a
 * doubling rather than a promotion: at three voices there is now room for a
 * seventh, and giving it one would be answering a question the part did not ask.
 * A fourth voice adds the octave fifth above that. So the seventh and the
 * extensions are not dropped in some priority order, they were never candidates,
 * and neither is a suspension — a `sus4` voiced this way comes out as a plain
 * fifth. That cost is real and it is the price of the style rather than a bug: a
 * part that has declared it states no quality cannot state a suspension either,
 * and a song that needs the 4th heard has to put it in a layer that can say it.
 *
 * ## The fifth is the chord's own fifth, whatever that is
 *
 * On a diminished or half-diminished chord that makes a tritone dyad rather than
 * a fifth, and it is voiced honestly. The ♭5 *is* the chord — `chooseTones` says
 * the same thing two functions up, where an altered fifth is the one fifth it
 * refuses to drop — and this repertoire writes the sound on purpose. The
 * alternative is putting a perfect fifth into the arrangement that the harmony
 * does not contain, underneath a bass and a tune that are both spelling the real
 * chord, and a wrong note is a worse fault than a wide interval. This is the
 * opposite case from the quartal tritones above rather than the same one: those
 * landed on plain major and minor chords, where the fifth is perfect and six
 * semitones is simply not the interval that was asked for.
 *
 * ## The low-interval limits are left exactly as they are
 *
 * Which is the reason this is `powerTones` and not `voicePower`: it hands its
 * pitch classes to the same `stack` every other style uses, so rule 1 at the top
 * of this file applies to it by construction. A two-note voicing is the case
 * that table was written about rather than an awkward fit for it — the fifth is
 * legal from E2 up and becomes a twelfth below, which is the ear's answer and
 * not a compromise.
 *
 * Whether the line belongs at E2 or a few semitones under it is a fair question,
 * since a drop-tuned guitar plays C2–G2 all night — but it is a question about
 * `minInterval`, and all fourteen genres are voiced through that table. Moving
 * it to suit one style would re-voice every one of them.
 *
 * The cost of leaving it is honest and small. A comp whose window is low, and
 * whose top is not clear of the nearest root by the interval the register
 * demands, has nowhere to put the shape and hands back the root on its own:
 * 3.8% of metal's comp onsets against 0.6% under `quartal`. Those 3.2 points are
 * the same onsets `quartal` was filling with a fault. One note is a rhythm
 * guitarist playing one string, and a fourth at A1 is not a thinner power chord,
 * it is a rumble.
 *
 * ## What the octave doubling does to the tune
 *
 * It collides with it more often, and the mechanism is not subtle: this voicing
 * sounds the root and the fifth, which are the two notes a tune in the key
 * spends most of its time on, and above two voices it sounds the root twice. Over
 * the same catalogue, comp onsets that begin while a melody note an octave away
 * is sounding went from 15.7% under `quartal` to 21.9% here.
 *
 * Nothing is done about it in this file, and that is a decision. `stack` places
 * every voice strictly above the last, so the doubling is at the octave and never
 * at the unison — which is precisely what lets the repair pass do its job well:
 * the octave root is a doubled pitch class, so `resolveCollisions` thins a
 * three-voice power chord in the tune's way to a two-voice one, which is still a
 * power chord, instead of dropping a note that was carrying the harmony. At two
 * voices there is nothing to thin and the octave displacement is the only repair,
 * which is the deal every other style gets. Note that the same pass only touches
 * octaves at `clarity >= 0.75`, so a style that wants them repaired has to be
 * smooth enough to be asking; the lever that always works is `ceiling`.
 */
function powerTones(chord: Chord, voices: number): Pc[] {
  const pcs = chordPcs(chord);
  const root = pcs[0]!;
  const fifth = pcs[2] ?? root;
  const out: Pc[] = [];
  for (let i = 0; i < Math.max(1, voices); i++) out.push(i % 2 ? fifth : root);
  return out;
}

/**
 * Place a set of pitch classes as a stack, bottom-up, honouring the minimum
 * interval for whatever register each voice lands in.
 *
 * Returns undefined if the stack cannot fit under `hi` — the caller retries
 * with a lower bottom note or fewer voices.
 */
function stack(pcs: Pc[], bottom: Midi, hi: Midi, clarity: number): Midi[] | undefined {
  const out: Midi[] = [bottom];
  for (let i = 1; i < pcs.length; i++) {
    const prev = out[out.length - 1]!;
    const floor = prev + minInterval(prev, clarity);
    // Lowest note of this pitch class at or above the floor.
    let note = Math.floor(floor / 12) * 12 + pcs[i]!;
    while (note < floor) note += 12;
    if (note > hi) return undefined;
    out.push(note);
  }
  return out;
}

/**
 * The same stack, with the upper voices free to arrive in any order.
 *
 * `stack` walks the tones in the order it is handed them, so a rotation fixes
 * not just the bass note but the whole ascent: from a G the next voice must be
 * the B♭ and then the E, whatever that costs. Under a low ceiling it costs
 * everything. G2–E3–B♭3 is an ordinary rootless voicing that no rotation of
 * `[3rd, 5th, 7th]` can express, so the search would find nothing, drop a voice,
 * find nothing again, and hand back the bare guide-tone pair.
 *
 * That was not a thin voicing, it was a *missing* one, and it was the whole
 * reason a comp under a low tune stopped playing chords: measured across forty
 * blues songs, 19% of the piano's comp onsets sounded a single note and the mean
 * was 2.6 voices where every pattern in the style asks for four. With a ceiling
 * at 58 the ordered search cannot place three voices at all; this places them at
 * the first attempt.
 *
 * Greedy, taking the tone whose lowest legal note is smallest at each step,
 * which is exactly the right rule when the binding constraint is a ceiling: it
 * spends as little of the remaining headroom as possible on every voice. It is
 * not a general improvement on `stack` and is not used as one — see
 * `voiceChord`, which reaches for this only once the ordered search has failed,
 * so every voicing that already worked comes back unchanged.
 */
function stackFree(pcs: Pc[], bottom: Midi, hi: Midi, clarity: number): Midi[] | undefined {
  const out: Midi[] = [bottom];
  const rest = pcs.slice(1);
  while (rest.length) {
    const prev = out[out.length - 1]!;
    const floor = prev + minInterval(prev, clarity);
    let pick = -1;
    let pickNote = Infinity;
    for (let i = 0; i < rest.length; i++) {
      let note = Math.floor(floor / 12) * 12 + rest[i]!;
      while (note < floor) note += 12;
      if (note < pickNote) { pick = i; pickNote = note; }
    }
    if (pick < 0 || pickNote > hi) return undefined;
    out.push(pickNote);
    rest.splice(pick, 1);
  }
  return out;
}

/** Total motion from one voicing to another, voice by voice from the top down. */
function motion(from: readonly Midi[], to: readonly Midi[]): number {
  if (!from.length) return 0;
  let total = 0;
  for (let i = 0; i < to.length; i++) {
    // Compare against the nearest voice of the previous chord; a voicing with a
    // different number of voices still leads sensibly this way.
    let best = Infinity;
    for (const f of from) best = Math.min(best, Math.abs(to[i]! - f));
    total += best;
  }
  return total / to.length;
}

/**
 * Voice a chord as `voices` notes inside a register window.
 *
 * Every inversion is tried — each chord tone gets a turn as the bottom voice,
 * at every octave that fits — and the candidates are scored on voice leading,
 * register fit and span. Trying inversions is what makes the voice leading real
 * rather than nominal: keeping common tones and moving the rest by step is
 * mostly a matter of choosing the right inversion, and a routine that always
 * stacks from the root cannot do it at all.
 */
export function voiceChord(chord: Chord, opts: VoicingOptions): Midi[] {
  const { voices, centre } = opts;
  const style = opts.style ?? 'tertian';
  const clarity = opts.clarity ?? 1;
  const lo = opts.lo ?? centre - 12;
  const hardHi = Math.min(opts.hi ?? centre + 12, (opts.ceiling ?? Infinity) - 1);

  if (style === 'quartal' && opts.scale) {
    return voiceQuartal(chord, opts.scale, { voices, centre, lo, hi: hardHi });
  }

  const power = style === 'power';
  const tones = power
    ? powerTones(chord, voices)
    : chooseTones(chord, voices, { rootInBass: style === 'guide' });
  const spread = style === 'spread';
  // A pad opens the stack out by asking for a wider floor between voices; the
  // effect is the classic open-position sound, and it also stops the pad from
  // occupying the identical register as the comp playing the same chord.
  const effectiveClarity = spread ? 1 : clarity;

  /**
   * The span the scoring pulls every candidate towards.
   *
   * An octave for a close voicing, a twelfth for a pad — and for a power chord
   * the height of the shape itself, which is 7 at two voices, 12 at three and 19
   * at four. Every other style can be given one number because its stack is one
   * chord however many voices it has; this one grows by alternating a fifth and
   * a fourth, so a fixed 12 would be asking a two-voice power chord to be five
   * semitones wider than it is.
   *
   * What that buys is the low bottom of the window. Where the bottom note is low
   * enough for the low-interval limit to refuse the fifth, `stack` puts it up an
   * octave and the shape comes back as root–twelfth instead; this is the term
   * that then prefers an octave higher up, where the shape survives whole. Over
   * a grid of 155,520 voicings — every quality, every root, two to four voices,
   * thirty window floors — asking for the shape halves the ones that come back an
   * octave or more too wide, 0.8% to 0.4%. The vivid case is a `viio` at two
   * voices in a window from E2 to E4: with the shape's number it is F3–B3, the
   * tritone dyad the chord actually is, and with a flat 12 it is F2–B3.
   */
  const wantSpan = spread ? 19
    : power ? 12 * Math.floor((voices - 1) / 2) + ((voices - 1) % 2) * 7
      : 12;

  /**
   * How many rotations the ordered search is allowed to try.
   *
   * Every one, for everything but a power chord. An inversion of a triad is a
   * voicing decision — which is why the loop below tries them all and settles it
   * on voice leading, with root position winning only ties.
   *
   * A power chord has no inversions in that sense. Rotating `root-fifth` gives
   * `fifth-root`, the same two pitch classes with the fifth underneath, and a
   * guitarist does not choose between those: there is one shape, the root is on
   * the lower string, and the only decision left is which fret to put it at —
   * which is the octave scan, and that stays. So the rotation is treated the way
   * `stackFree` below is treated, as a real voicing that is not a *better* one:
   * offered only once the shape itself has failed to fit anywhere, where it can
   * add a chord that would otherwise have been a single note and cannot displace
   * a chord that already worked. Measured over metal's catalogue, allowing it as
   * an ordinary candidate put the fifth in the bass on 48.1% of comp onsets —
   * the register and voice-leading terms have no reason to prefer either, so it
   * came out a coin toss. Reaching for it only after the shape has failed leaves
   * 7.5%, which are the bars where a ceiling has squeezed the comp under the tune
   * and the wider shape has nowhere to go.
   */
  const rotations = power ? 1 : tones.length;

  const previous = opts.previous ?? [];
  let best: Midi[] | undefined;
  let bestScore = Infinity;

  // Each rotation makes a different chord tone the bottom voice — i.e. tries
  // every inversion — and each octave slides the whole stack.
  for (let rot = 0; rot < rotations; rot++) {
    const rotated = [...tones.slice(rot), ...tones.slice(0, rot)];
    const bottomPc = rotated[0]!;
    for (let octave = Math.floor(lo / 12) * 12; octave <= hardHi; octave += 12) {
      const bottom = octave + bottomPc;
      if (bottom < lo || bottom > hardHi) continue;
      let placed = stack(rotated, bottom, hardHi, effectiveClarity);
      if (!placed && spread) placed = stack(rotated, bottom, hardHi, clarity);
      if (!placed) continue;

      const top = placed[placed.length - 1]!;
      const span = top - bottom;
      let score = motion(previous, placed) * 1.6;
      // Keep the body of the chord near where the instrument lives.
      score += Math.abs((bottom + top) / 2 - centre) * 0.5;
      // Very wide stacks stop reading as one chord; very narrow ones are muddy.
      score += Math.abs(span - wantSpan) * (spread ? 0.35 : 0.25);
      // Root position is the plainest and most stable, so break ties toward it.
      if (rot !== 0) score += 0.4;

      if (score < bestScore) { bestScore = score; best = placed; }
    }
  }

  if (best) return best;

  /**
   * Nothing fit in order. Before giving a voice up, try letting the upper voices
   * arrive in whatever order the ceiling allows — see `stackFree`.
   *
   * Here rather than in the loop above on purpose. A free-order voicing is a
   * real voicing but it is not a *better* one, and offering it as a candidate
   * everywhere would have it win on span or motion in windows where the ordered
   * stack was perfectly good, quietly re-voicing the whole catalogue. Reached
   * only once the ordered search has come back empty, it can add chords where
   * there were none and cannot change a chord that already existed.
   */
  for (let rot = 0; rot < tones.length; rot++) {
    const rotated = [...tones.slice(rot), ...tones.slice(0, rot)];
    for (let octave = Math.floor(lo / 12) * 12; octave <= hardHi; octave += 12) {
      const bottom = octave + rotated[0]!;
      if (bottom < lo || bottom > hardHi) continue;
      const placed = stackFree(rotated, bottom, hardHi, effectiveClarity);
      if (!placed) continue;
      const top = placed[placed.length - 1]!;
      let score = motion(previous, placed) * 1.6;
      score += Math.abs((bottom + top) / 2 - centre) * 0.5;
      score += Math.abs(top - bottom - wantSpan) * (spread ? 0.35 : 0.25);
      if (score < bestScore) { bestScore = score; best = placed; }
    }
  }
  if (best) return best;

  // Still nothing — the window is narrower than the chord needs. Drop a voice
  // and try again rather than emitting a cluster, and fall back to a bare stack
  // of whatever fits if even that fails.
  if (voices > 2) return voiceChord(chord, { ...opts, voices: voices - 1 });
  const pcs = chordPcs(chord);
  return [lo + ((pcs[0]! - lo) % 12 + 12) % 12];
}

/**
 * Quartal voicing — stacked fourths drawn from the scale rather than the chord.
 *
 * This is the defining sound of modal jazz. Because the harmony sits still for
 * eight or sixteen bars at a time, tertian voicings become monotonous fast;
 * fourths are ambiguous enough to keep a static chord interesting.
 *
 * The stack is built by stepping the same number of scale degrees each time,
 * which keeps it diatonic instead of parallel-chromatic. How many degrees that
 * is depends on the scale — see `stepsNearest`.
 */
function voiceQuartal(
  chord: Chord,
  scale: Scale,
  opts: { voices: number; centre: Midi; lo: Midi; hi: Midi },
): Midi[] {
  const { voices, centre, lo, hi } = opts;
  const tones = chordPcs(chord).filter((p) => scale.pcs.includes(p));
  const startPc = tones[0] ?? chord.root;
  let cursor = snapToScale(scale, nearest(startPc, centre - 4));

  const step = stepsNearest(scale, 5); // a perfect fourth
  const out: Midi[] = [];
  for (let i = 0; i < voices; i++) {
    out.push(cursor);
    cursor = stepInScale(scale, cursor, step);
  }

  // Slide the whole stack into the register window rather than clamping each
  // voice, which would collapse the fourths.
  const top = Math.max(...out);
  const bottom = Math.min(...out);
  let shift = 0;
  while (top + shift > hi) shift -= 12;
  while (bottom + shift < lo) shift += 12;
  return out.map((m) => m + shift).sort((a, b) => a - b);
}

/**
 * How many scale steps come nearest to `semitones` in this scale.
 *
 * "A fourth is three scale steps" is true of a seven-note scale and of nothing
 * else, and the quartal stack is the one place in the engine that counted on it.
 * Three steps of `blues` is a fifth, three of either pentatonic is a fifth, and
 * three of `wholeTone` is a tritone — the stack stayed perfectly even, so
 * nothing looked wrong, and it was not made of fourths.
 *
 * So derive the count from the interval instead of writing it down. A scale of
 * `len` notes averages `12 / len` semitones to the step, and the count whose
 * average lands nearest the target is the one to take. Ties go to the smaller
 * count, which puts the stack under the interval rather than over it: whole tone
 * contains no fourth at all, and a major third below is a smaller lie than a
 * tritone above.
 *
 * Seven notes give 3 and eight give 3, so every scale the engine voices
 * quartally today keeps exactly the stack it had.
 */
function stepsNearest(scale: Scale, semitones: number): number {
  const len = scale.pcs.length;
  let best = 1;
  let bestErr = Infinity;
  for (let steps = 1; steps < len; steps++) {
    const err = Math.abs((steps * 12) / len - semitones);
    if (err < bestErr) { bestErr = err; best = steps; }
  }
  return best;
}

function nearest(target: Pc, reference: Midi): Midi {
  const base = Math.floor(reference / 12) * 12 + target;
  let best = base;
  let bestDist = Math.abs(base - reference);
  for (const cand of [base - 12, base + 12]) {
    const d = Math.abs(cand - reference);
    if (d < bestDist) { best = cand; bestDist = d; }
  }
  return best;
}

/** Exposed for the ensemble audit. */
export function voicingFaults(voicing: readonly Midi[], clarity = 1): string[] {
  const faults: string[] = [];
  const v = voicing.slice().sort((a, b) => a - b);
  for (let i = 1; i < v.length; i++) {
    const d = v[i]! - v[i - 1]!;
    if (d === 0) faults.push('unison-double');
    else if (d < minInterval(v[i - 1]!, clarity)) faults.push('low-interval-limit');
  }
  return faults;
}

export type { ChordQuality };
