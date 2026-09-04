/**
 * The band, patched against the finished tune.
 *
 * Every other pass in this engine writes the melody *around* an accompaniment that
 * was decided first. This one runs the other way: the tune exists, and the rhythm
 * section is edited to agree with it. That is what an arranger does and what a
 * generator almost never does, because the accompaniment is usually written by a
 * pattern that cannot be told about anything.
 *
 * Two operations, and both are deliberately small. The failure mode here is not
 * subtlety, it is a band that follows the tune everywhere — which stops being an
 * arrangement and becomes a doubling, and takes the groove with it. So the patch is
 * capped at a couple of moments per section, and it never adds or removes a bass
 * onset: it moves one, by an eighth at most, keeping its pitch.
 *
 * **Accent agreement.** Where the tune leans hard on a note just before a beat — an
 * anticipated downbeat, the most characteristic gesture in this repertoire — the
 * bass moves onto that eighth with it. One player pushing is a player; the band
 * pushing together is an arrangement.
 *
 * **A hole at the peak.** The comp stops for the second half of the bar carrying the
 * section's highest note. Nothing else in the project can express "get out of the
 * way", and it is the cheapest way there is to make a high note sound like an event
 * rather than like a note that happens to be high.
 */

import type { NoteEvent } from '../core/types.js';
import type { Rng } from '../core/rng.js';

export interface PatchOptions {
  /** The finished tune for this section. */
  melody: readonly NoteEvent[];
  bass: NoteEvent[];
  comp: NoteEvent[];
  beatsPerBar: number;
  /** Absolute beat where the section starts. */
  startBeat: number;
  bars: number;
  /**
   * How far the arranger goes, 0..1. Zero leaves both parts untouched, which is what
   * every section that is not making a point should get.
   */
  amount: number;
}

export interface Patch {
  bass: NoteEvent[];
  comp: NoteEvent[];
  /** What was done, for a report or a printed plan. */
  moves: string[];
}

export function patchBand(opts: PatchOptions): Patch {
  const moves: string[] = [];
  if (opts.amount <= 0 || !opts.melody.length) {
    return { bass: opts.bass, comp: opts.comp, moves };
  }

  const bass = agree(opts, moves);
  const comp = hole(opts, moves);
  return { bass, comp, moves };
}

/**
 * Move the bass onto the tune's anticipations.
 *
 * An anticipation is a note that lands an eighth or a sixteenth before a beat and
 * carries more weight than the beat it displaces — which is exactly what the tune
 * engine's accent field records, so no guessing is needed. The bass note that would
 * have played *on* that beat moves back to meet it.
 *
 * At most two per section. The third one stops being an arrangement decision and
 * starts being a different bass pattern.
 */
function agree(opts: PatchOptions, moves: string[]): NoteEvent[] {
  const { melody, bass, beatsPerBar, startBeat, bars } = opts;
  if (!bass.length) return bass;

  const step = 1 / 2;                      // an eighth, in beats
  const budget = Math.max(1, Math.round(opts.amount * 2));
  const out = bass.map((n) => ({ ...n }));
  let used = 0;

  /**
   * Beats the tune anticipates: a strong note sitting an eighth or a sixteenth before
   * one.
   *
   * "Strong" measured against this section rather than against an absolute, because
   * by the time the patch runs `applyDynamics` has already scaled every velocity by
   * how hard the section is playing — an absolute threshold made the whole operation
   * dead code in twelve songs out of twelve.
   */
  const loud = melody.map((n) => n.velocity).sort((a, b) => b - a);
  const strong = loud[Math.floor(loud.length * 0.25)] ?? 1;

  const candidates = melody
    .map((n) => {
      const local = n.beat - startBeat;
      if (local < beatsPerBar || local > (bars - 1) * beatsPerBar) return undefined;  // not the seams
      if (n.velocity < strong) return undefined;
      for (const ahead of [step, step / 2]) {
        if (Math.abs(Math.round(n.beat + ahead) - (n.beat + ahead)) < 1e-6) {
          return { note: n, ahead };
        }
      }
      return undefined;
    })
    .filter((c): c is { note: NoteEvent; ahead: number } => c !== undefined)
    .sort((a, b) => b.note.velocity - a.note.velocity);

  for (const { note: n, ahead } of candidates) {
    if (used >= budget) break;
    const beat = n.beat + ahead;
    const onBeat = out.find((b) => Math.abs(b.beat - beat) < 1e-6);
    if (!onBeat) continue;
    // Only where there is room to move into: a bass note already sounding on the
    // eighth means the pattern is busy there and moving one onto another is a
    // collision rather than an agreement.
    if (out.some((b) => Math.abs(b.beat - n.beat) < 1e-6)) continue;
    onBeat.beat = n.beat;
    onBeat.duration += ahead;
    used++;
    moves.push(`bass pushes with the tune at ${n.beat.toFixed(2)}`);
  }
  return out;
}

/**
 * The rhythm of a band figure, in sixteenths from the start of a bar.
 *
 * Taken from the section's own hook rather than invented, because a tutti that plays
 * something nobody has heard is a fanfare and a tutti that plays *the hook* is an
 * arrangement. Fragmented to what a whole band can hit together: three or four
 * attacks, quantised to eighths, because five players landing on a sixteenth is not
 * an ensemble figure, it is a smear.
 */
export function figureSlots(
  onsets: readonly { at: number; dur: number }[], slotsPerBar: number,
): number[] {
  const inBar = onsets
    .filter((o) => o.at >= 0 && o.at < slotsPerBar)
    .map((o) => Math.round(o.at / 2) * 2);
  const unique = [...new Set(inBar)].sort((a, b) => a - b);
  // A figure has to start where the bar does, or the band is answering something.
  if (unique[0] !== 0) unique.unshift(0);
  return unique.slice(0, 4);
}

/**
 * A line in parallel thirds or sixths under the tune.
 *
 * The deliberate half of a question this project otherwise only answers negatively:
 * the arranger spends real effort keeping the accompaniment *off* the melody, and
 * `npm run genres` forbids the answering line from doubling it at the unison or the
 * octave outright. All of that is right about an accident and wrong about a decision.
 * Two horns in thirds is one of the most characteristic sounds in this repertoire,
 * and the only thing separating it from mud is that it is sustained and parallel
 * rather than momentary and incidental.
 *
 * Thirds and sixths rather than unisons and octaves — which is a statement about
 * *this* device rather than about doubling in general. A third is two lines and an
 * octave is one line played twice, so the two are different gestures and want
 * different rules; the octave one is `joinIn` below, and it has to declare itself.
 *
 * This is the fixed-interval entry and the one the `harmony` device draws: one
 * interval under every note, over a window that for the common eight-bar chorus is
 * two bars. At that size a parallel line is simply right — two bars is a chord or
 * two, and the caller already stops the span short of the cadence. `harmoniseWith`
 * below is the same pass told what is sounding underneath, which is what sixteen
 * bars needs and what a style declaring its music two-voiced has to have.
 */
export function harmonise(
  melody: readonly NoteEvent[],
  from: number,
  to: number,
  below: number,
  /**
   * The note's own beat is handed to the caller because the harmony has to be
   * measured against the chord sounding *there*: a span four bars wide is
   * several chords, and a third taken off the first of them is not a third
   * against the rest.
   */
  step: (midi: number, steps: number, beat: number) => number,
  [lo, hi]: readonly [number, number],
): NoteEvent[] {
  // Unsigned in, signed on: `below` is the shape of the fact that every harmony
  // line this project has ever written sits underneath the tune.
  return writeLine(melody, from, to, -below, 'fixed-interval', step, [lo, hi]);
}

/**
 * The same line, told what the chords are doing.
 *
 * Everything the fixed-interval entry above cannot know, and it does not need to
 * know it: its window is two bars in a chorus already heard, and the difference
 * between a harmony part and a transposition does not show up in two bars. A style
 * that says *this music is two voices* is asking for the whole statement of every
 * section it names, and over sixteen bars a fixed step is audibly a transposition —
 * a third under every note of a diatonic line puts a diminished fifth against the
 * chord wherever the line touches the fourth degree over a dominant, and it walks
 * into the cadence in lockstep, which is the one place the ear most needs to hear
 * that there are two players.
 *
 * `intervals` is signed and weighted because a style prefers thirds and still
 * reaches for a sixth, and because a descant is not a special case of a harmony
 * below — it is the other sign of one, and `Chart.harmonyBelow`, one unsigned
 * number, is why no line in this project has ever been above the tune.
 */
export interface HarmonyLine {
  /** The finished tune. Notes outside `[from, to)` are ignored. */
  melody: readonly NoteEvent[];
  from: number;
  to: number;
  /**
   * The interval from the tune to the second part, signed — positive is above —
   * and weighted. `HarmonyProfile.intervals`, handed through unchanged.
   *
   * **Written as scale steps and read as an interval class**, and the two are
   * only the same thing on a seven-note scale. See `intervalClass`: a table
   * saying `-2` is saying *in thirds*, and `stepInScale` indexes whatever scale
   * the genre gives the chord under the note — which for rock/southern is a
   * five-note scale on 32 chords out of 32, where two steps down is a fourth on
   * four degrees out of five and `-5` is a bare octave.
   */
  intervals: readonly (readonly [number, number])[];
  /**
   * The stream the interval is drawn on, once for the span. It has to be the
   * caller's own: a draw sharing the band's stream reshuffles every part written
   * after it, and this one fires per section.
   */
  rng: Rng;
  /** As `harmonise` above: the chord under *this* note, not under the span. */
  step: (midi: number, steps: number, beat: number) => number;
  /**
   * What is sounding under `beat`, as pitch classes: the prevailing scale — the
   * genre's answer for that chord, not the key's — and the chord itself. The two
   * are separate questions because the two rules that need them are separate: a
   * passing note has to be in the scale, and an arrival has to be in the chord.
   */
  under: (beat: number) => { scale: readonly number[]; chord: readonly number[] };
  range: readonly [number, number];
  /**
   * Beats the skeleton marks `Target.role === 'arrival'`, absolute. A note
   * sounding across one is an arrival; the last note of the span always is.
   *
   * Optional because the marks are frequently not there to be had: targets are
   * keyed by phrase and measured in sixteenths from the phrase's own start, and a
   * recalled tune has no written phrases at all — which is exactly the repeat
   * chorus this fires in. The last note of the span is then the honest
   * approximation, and it is the cadence in every case that matters.
   */
  arrivals?: readonly number[];
}

export function harmoniseWith(opts: HarmonyLine): NoteEvent[] {
  // One interval for the span, not one per note: the second part is a decision
  // about this passage, and a line that changes its interval note by note is not a
  // second part, it is a different tune.
  const steps = opts.rng.weighted(opts.intervals);
  return writeLine(
    opts.melody, opts.from, opts.to, steps, 'second-part', opts.step, opts.range,
    opts.under, opts.arrivals,
  );
}

/**
 * Which of the four rules below this line is written under, and it is a musical
 * distinction rather than a switch.
 *
 * `second-part` is a style saying *this music is two voices*: a declared interval
 * class, a whole statement of the section, and every rule in force.
 *
 * `fixed-interval` is `Device.harmony` — two bars of colour inside a chorus that
 * has already been heard, off a bare `Chart.harmonyBelow` (or the 2-or-5 the
 * `soloistHeads` fallback flips for). Rule 1 alone, and the other three are not
 * withheld from it, they are already answered elsewhere:
 *
 *  - **Rule 2** is satisfied by construction. Its `step` snaps into the chord's
 *    own scale before it steps, so the parallel note is in the prevailing scale
 *    already and asking for the pitch classes would be asking for evidence of a
 *    tautology. (The same is true of the `second-part` caller, which is why rule
 *    2 is dead code until rule 1 puts a note outside that scale on purpose.)
 *  - **Rule 3** has nothing to resolve: the caller stops the span two bars short
 *    of the cadence, which is the cheap version of resolving and the reason this
 *    device can only ever be a colour in the middle of a chorus.
 *  - **Rule 4 belongs downstream for this caller.** Every note of it lands on the
 *    counter layer and goes through `undoubleAgainst`, which refuses the unison
 *    and the octave and moves the offending note by a scale step to *either*
 *    side. Rule 4's own remedy — one step further from the tune, else drop the
 *    note — is right for a declared interval, where there is a class to widen
 *    within; on a bare step count it widens an interval nobody declared, and the
 *    "never crossing the tune" clause is a claim only a second part makes.
 *
 * That last one is the whole of why this parameter exists. Applying `crowds`
 * unconditionally was measured over 389 styles × 4 seeds × {vocals on, off}:
 * **72 songs on 31 styles that declare no harmony at all** came out different
 * from commit `03ed693` — 62 on 25 when the fault was first found, the same
 * fault counted a few commits apart. It reaches them through the `harmony`
 * device draw and through the `soloistHeads` fallback in `generate/song.ts`,
 * which is how indian, with `arrangement.harmony: 0`, was on the list. With the
 * split, all 3139 of those songs are byte-identical again.
 */
type LineRules = 'fixed-interval' | 'second-part';

/**
 * Four rules, and the interval is only the first of them.
 *
 * 1. **The interval is the intent, not the output.** It says which line this is —
 *    a third above, a sixth below — and the other three say what happens where the
 *    music will not take it. A pass that applied it unconditionally would be a
 *    transposition wearing a second player's name. It is stated as a *class* and
 *    the step count is only its first realisation — see `intervalClass`.
 * 2. **A parallel note outside the prevailing scale moves to the nearest note
 *    inside it**, preferring the direction the tune has just moved in. Preferring,
 *    rather than taking the nearer of the two blindly, because the harmony note has
 *    to leave its *own* previous note as well: if the tune has just risen, the
 *    parallel note rose with it, and nudging it up keeps the two lines rising
 *    together where nudging it down is a contrary wobble for one note.
 * 3. **At an arrival, resolve to a chord tone.** Parallel motion into an arrival is
 *    the one place two parts most need to be two. The existing device dodges this
 *    by ending the span two bars early, which is the cheap version of resolving and
 *    the reason the device can only ever be a colour in the middle of a chorus.
 * 4. **Never the unison, never the octave, never crossing the tune.** A part that
 *    crosses the lead has stopped being a second part, and a unison or an octave is
 *    one line with two players on it — which is a real gesture with its own name
 *    and its own rules, `joinIn` below, and which has to declare itself because
 *    everything downstream treats an unmarked doubling as the fault it usually is.
 *
 * Contrary motion is deliberately absent. A second part that genuinely moves
 * against the tune is counterpoint; the answering line already does that, in the
 * holes of the tune, and a pass that did both would produce neither.
 *
 * Which caller gets which rules, and why, is `LineRules` above.
 */
function writeLine(
  melody: readonly NoteEvent[],
  from: number,
  to: number,
  steps: number,
  rules: LineRules,
  step: (midi: number, steps: number, beat: number) => number,
  [lo, hi]: readonly [number, number],
  under?: (beat: number) => { scale: readonly number[]; chord: readonly number[] },
  arrivals?: readonly number[],
): NoteEvent[] {
  const taken = melody.filter((n) => n.beat >= from - 1e-6 && n.beat < to - 1e-6);
  // Which side of the tune this part is on. A declared 0 is a unison, which rule 4
  // refuses note by note; treating it as "below" only decides which way it is
  // refused from.
  const away = steps > 0 ? 1 : -1;
  const part = rules === 'second-part';

  const [near, far] = intervalClass(steps);
  // One `under` call per note, kept, because rule 1 needs every chord in the span
  // before it can write the first note and rules 2 and 3 need them one at a time.
  const chords = part && under ? taken.map((n) => under(n.beat)) : undefined;
  const key = chords ? keyOf(chords) : undefined;

  const out: NoteEvent[] = [];
  for (let i = 0; i < taken.length; i++) {
    const n = taken[i]!;
    // A bent lead is harmonised where it arrives, and the twin bends with it.
    const rise = n.bend?.semitones ?? 0;
    const lead = n.midi + rise;
    let midi = step(lead, steps, n.beat);
    const pcs = chords?.[i];

    /**
     * Rule 1, and this is where a step count stops being taken at its word.
     *
     * On a seven-note scale `step` lands inside the class on every degree, so
     * this is inert there and the line is exactly what it was: measured, it fires
     * on **2 of 2026 notes** across the four seven-note styles that reach this
     * pass, and 0 of them in metal, latin/banda and classical/march. Where the
     * genre answers the chord with fewer notes it fires on **262 of 329** —
     * rock/southern, a five-note scale on every one of them — because two steps
     * down a major pentatonic is a fourth on four of its five degrees and five
     * steps is a bare octave on all five, which rule 4 then refuses and widens to
     * a ninth.
     *
     * The class is what the table meant, so the class wins and the note leaves
     * the prevailing scale to get there. That is not a licence, it is the sound:
     * a close-harmony singer over a pentatonic tune sings the notes the tune
     * never touches, which is why the two parts are two. Realised thirds and
     * sixths on rock/southern go 25.4% → 94.7%, fourths and fifths 60.6% → 2.4%,
     * over 386 and 414 harmony notes.
     */
    let sprung = false;
    if (pcs && key) {
      const gap = Math.abs(midi - lead);
      if (gap < near || gap > far) {
        midi = lead + away * inClass([near, far], gap, key, pcs.chord, lead, away);
        sprung = true;
      }
    }

    if (pcs) {
      const cadence = i === taken.length - 1
        || (arrivals?.some((a) => a >= n.beat - 1e-6 && a < n.beat + n.duration - 1e-6) ?? false);
      if (cadence) {
        // Outward on a tie: the cadence is where the two parts most need to be two,
        // so a resolution that closes the gap is the one to give up first.
        midi = nearestIn(midi, pcs.chord, away);
      } else if (!sprung) {
        // …and not where rule 1 has just placed the note. Rule 2 asks whether the
        // note is inside the harmony, and rule 1 has already answered it against
        // the span's whole key rather than against one chord's five notes — which
        // is the set that could not supply a third. Re-asking it here would snap
        // the third straight back to the fourth it was rescued from.
        const prev = taken[i - 1];
        const next = taken[i + 1];
        const moving = prev ? n.midi - prev.midi : (next ? next.midi - n.midi : 0);
        midi = nearestIn(midi, pcs.scale, moving > 0 ? 1 : moving < 0 ? -1 : away);
      }
    }

    if (part) {
      // Rule 4. One step further out first, because the interval was the intent and
      // a sixth that has to become a seventh for one note is still this line; only
      // then the note is dropped, which is what a second player does when the note
      // they want is the note the lead is already on.
      if (crowds(midi, lead, away)) midi = step(midi, away, n.beat);
      if (crowds(midi, lead, away)) continue;
    }

    // A note outside the second player's window is dropped rather than folded by an
    // octave: a descant folded down is no longer above the tune, and the fold would
    // manufacture the octave rule 4 just refused.
    if (midi < lo || midi > hi) continue;
    out.push({
      beat: n.beat, duration: n.duration, midi: midi - rise, velocity: n.velocity * 0.82,
      ...(n.bend ? { bend: n.bend } : {}),
    });
  }
  return out;
}

/**
 * The two semitone sizes `steps` scale steps spans on a seven-note scale.
 *
 * A step count only names an interval on the scale it is counted in, and the
 * scale every table in the catalogue was written against is the seven-note one:
 * `[[-2, 6], [-5, 3]]` is *mostly thirds, sometimes sixths*, not *4-to-6
 * semitones, sometimes an octave*. `stepInScale` counts in whatever scale the
 * genre gives the chord under the note, and six tables declaring thirds and
 * sixths sit on genres whose answer for most chords is a pentatonic.
 *
 * Both members and not one, because a class *is* a pair: a third is 3 or 4
 * semitones and which of the two it is depends on the degree. `k · 12/7` is the
 * mean size of `k` steps on a seven-note scale and its floor and ceiling are
 * exactly the pair a major scale realises, degree by degree — 2 → {3,4},
 * 3 → {5,6}, 4 → {6,7}, 5 → {8,9} — which is why this is arithmetic rather than
 * a table to keep in step with `SCALE_STEPS`.
 *
 * **This file only reaches the eleven styles whose profile says `on: 'counter'`,
 * and rock/southern is the only pentatonic one of them.** The other five of the
 * six — country's `bluegrass`, `bluegrasswaltz`, `gospel`, `cowboy` and `duet` —
 * say `on: 'vocal'`, and that line is written by `generateVocalStack` off a step
 * drawn in `generate/song.ts` and applied through `VocalStack.step`; nothing in
 * it passes through `writeLine`. They realise thirds and sixths on 28–48% of
 * their harmony notes and this fix does not touch them. Whoever takes that path
 * next wants this function, not a second copy of the argument.
 */
function intervalClass(steps: number): [number, number] {
  const mean = Math.abs(steps) * 12 / 7;
  return [Math.floor(mean), Math.ceil(mean)];
}

/**
 * The key, as this span has actually sounded it — every prevailing scale and
 * every chord in it, as pitch classes.
 *
 * The span rather than the note, and that is the whole trick. A genre that hands
 * back a pentatonic per chord cannot supply a third under every degree, and no
 * amount of looking harder at *one* chord's five notes will produce the note that
 * is missing from them. The union across the span does: measured on rock/southern
 * the prevailing scale is five notes on 329 notes out of 329, and the span's union
 * is **eight or nine pitch classes** — the chords' own scales rooted differently
 * plus their triads — so the second player gets the notes the tune never touches
 * and sings the thirds the table asked for out of the key the band is playing in.
 *
 * Wider than a key, then, and deliberately: it is a set to *choose a note from*,
 * not a set to snap into. Rule 1 only ever offers it two candidates a semitone
 * apart, so a union carrying a borrowed chord's third can pick that third and can
 * do nothing else with it.
 */
function keyOf(
  chords: readonly { scale: readonly number[]; chord: readonly number[] }[],
): number[] {
  const set = new Set<number>();
  for (const c of chords) {
    for (const p of c.scale) set.add(p);
    for (const p of c.chord) set.add(p);
  }
  return [...set];
}

/**
 * Which member of the interval class, once rule 1 has decided the step count is
 * not one of them.
 *
 * Three questions in order, and each is a weaker kind of evidence than the last.
 * In the key the span has sounded — which settles it outright on a pentatonic
 * genre in a major key, where exactly one of the two lands in the scale. Then in
 * the chord under this note, which is the next best witness and the one that puts
 * the B under a D over a dominant. Then the side the step count was already on,
 * so the fallback is at least the smaller correction to the line as written.
 */
function inClass(
  [near, far]: [number, number],
  gap: number,
  key: readonly number[],
  chord: readonly number[],
  tune: number,
  away: number,
): number {
  const has = (set: readonly number[], size: number): boolean =>
    set.includes((((tune + away * size) % 12) + 12) % 12);
  const inKey = [near, far].filter((s) => has(key, s));
  if (inKey.length === 1) return inKey[0]!;
  const inChord = (inKey.length ? inKey : [near, far]).filter((s) => has(chord, s));
  if (inChord.length === 1) return inChord[0]!;
  return gap < near ? near : far;
}

/** On the tune, an octave off it, or on the wrong side of it. */
function crowds(midi: number, tune: number, away: number): boolean {
  const gap = midi - tune;
  return gap * away <= 0 || gap % 12 === 0;
}

/**
 * The nearest pitch whose class is in `pcs`, searching `prefer` first at each
 * distance so a tie goes the way the caller asked for. Six semitones always
 * suffices: any non-empty set of pitch classes has a member within a tritone.
 */
function nearestIn(midi: number, pcs: readonly number[], prefer: number): number {
  const has = (m: number): boolean => pcs.includes(((m % 12) + 12) % 12);
  for (let d = 0; d <= 6; d++) {
    if (has(midi + d * prefer)) return midi + d * prefer;
    if (has(midi - d * prefer)) return midi - d * prefer;
  }
  return midi;
}

/**
 * Two players on the same line.
 *
 * `harmonise` above is the arranger's other answer to "what do the two horns do
 * together", and for a long time it was the only one this project would allow: a
 * doubling at the octave is one line played twice, the checks call that a fault,
 * and so the head was never once stated the way this repertoire actually states
 * heads — trumpet and tenor on the tune, in octaves, nobody harmonising anybody.
 *
 * The objection was aimed at the wrong thing. What makes an octave doubling mud is
 * that it is *incidental*: one note of an answering line landing on the tune,
 * fusing two parts into one for a beat and then separating again, which the ear
 * reads as a mistake because it is one. A whole phrase in octaves is not that. It
 * has a beginning, it has both players arriving on it together, and the ear reads
 * it as weight rather than as blur.
 *
 * Hence the two conditions this function enforces and `undoubleAgainst` trusts:
 * it takes a *span* rather than notes, and every note it returns carries
 * `doubling: 'lead'`. An unmarked note on the tune is still a fault everywhere it
 * was before. A marked one is the arrangement.
 *
 * The octave is chosen away from the line's own register rather than fixed, so a
 * counter instrument sitting under the lead doubles below it and one sitting above
 * doubles above, instead of both being dragged to the same octave as the tune —
 * which would be the one case where this really is one line played twice.
 */
export function joinIn(
  melody: readonly NoteEvent[],
  from: number,
  to: number,
  atOctave: boolean,
  [lo, hi]: [number, number],
): NoteEvent[] {
  const taken = melody.filter((n) => n.beat >= from - 1e-6 && n.beat < to - 1e-6);
  if (taken.length < 3) return [];

  /**
   * Which octave, decided by what fits rather than by arithmetic on the mean.
   *
   * The first version computed one transposition from the average pitch and
   * dropped the whole span if any single note fell outside the second player's
   * range — which discarded most of them, because a tune's mean sits comfortably
   * inside a window that its highest note does not. Searching instead costs three
   * comparisons and is also the more honest model: a player asked to take the head
   * with somebody picks the octave they can actually play it in.
   *
   * Order of preference is the device's own. At pitch is the tightest version and
   * the one that most sounds like one instrument, so `atOctave` false tries it
   * first; either way the fallbacks are ±1 before ±2, because a tune two octaves
   * off is no longer the same line in a second voice, it is a piccolo part.
   */
  const wanted = atOctave ? [-1, 1, 0, -2, 2] : [0, -1, 1, -2, 2];
  const low = Math.min(...taken.map((n) => n.midi));
  const high = Math.max(...taken.map((n) => n.midi));
  const octaves = wanted.find((o) => low + o * 12 >= lo && high + o * 12 <= hi);
  if (octaves === undefined) return [];

  return taken.map((n) => ({
    ...n,
    midi: n.midi + octaves * 12,
    // Under the lead rather than beside it: the tune is still the tune, and the
    // second player is agreeing with it rather than competing to state it.
    velocity: n.velocity * 0.88,
    doubling: 'lead' as const,
  }));
}

/**
 * Hand a phrase to somebody else.
 *
 * The answering line otherwise lives in the holes of the tune — it finds the largest
 * silence in each bar and speaks into it, which is a fill however well it is shaped.
 * Trading is the other thing two melodic players do, and it is the one the ear reads
 * as a conversation: the lead states a phrase and then *stops*, and the second
 * instrument has the floor for two bars. Only the drummer could do that here, and
 * only inside a solo.
 *
 * What gets handed over is the phrase just heard, moved into the other player's
 * register by whole octaves. Octaves rather than a transposition, because the point
 * is that it is recognisably the same phrase coming back in a different voice — the
 * answer *is* the quotation, and a version at some other interval would be a new idea
 * arriving at the moment the listener is waiting for a reply.
 */
export function handOff(
  model: readonly NoteEvent[],
  fromBeat: number,
  toBeat: number,
  atBeat: number,
  [lo, hi]: [number, number],
): NoteEvent[] {
  const taken = model.filter((n) => n.beat >= fromBeat - 1e-6 && n.beat < toBeat - 1e-6);
  if (taken.length < 2) return [];

  const shift = atBeat - taken[0]!.beat;
  const mean = taken.reduce((sum, n) => sum + n.midi, 0) / taken.length;
  const centre = (lo + hi) / 2;
  const octaves = Math.round((centre - mean) / 12);

  return taken
    .map((n) => ({
      ...n,
      beat: n.beat + shift,
      midi: n.midi + octaves * 12,
      velocity: Math.min(1, n.velocity * 0.95),
    }))
    .filter((n) => n.midi >= lo && n.midi <= hi && n.beat < atBeat + (toBeat - fromBeat) - 1e-6);
}

/**
 * Take the comp out for half a bar under the section's high note.
 *
 * The second half of the bar rather than the whole of it: the chord still arrives,
 * and then the room opens underneath the note the section was climbing towards. A
 * bar of silence would be a stop-time break, which is a different and much larger
 * gesture than this is trying to make.
 */
function hole(opts: PatchOptions, moves: string[]): NoteEvent[] {
  const { melody, comp, beatsPerBar, startBeat, bars } = opts;
  if (!comp.length || opts.amount < 0.55 || bars < 4) return comp;

  const peak = melody.reduce((a, b) => (b.midi > a.midi ? b : a));
  const bar = Math.floor((peak.beat - startBeat) / beatsPerBar);
  if (bar < 1 || bar >= bars - 1) return comp;   // not the first bar, not the cadence

  const from = startBeat + bar * beatsPerBar + beatsPerBar / 2;
  const to = startBeat + (bar + 1) * beatsPerBar;
  const kept = comp.filter((n) => n.beat < from - 1e-6 || n.beat >= to - 1e-6);
  if (kept.length === comp.length) return comp;

  moves.push(`comp clears bar ${bar + 1} under the peak`);
  return kept;
}
