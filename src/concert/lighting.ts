/**
 * The lighting score — the form, read as light.
 *
 * A lighting designer sitting in on a rehearsal writes down what the *music*
 * does and cues off that. They do not roll dice. So this file has almost no
 * randomness in it, and the little it has is stated up front (`showRng` below):
 * a light that changes for no reason is worse than a light that never changes,
 * because a change is a claim that something happened, and a claim nobody can
 * hear is noise on stage.
 *
 * Everything here is already in the Song IR and already knows what it means:
 *
 *  - `Section.kind` and `generate/dynamics.ts` between them say how big each
 *    section is, and they already know a chorus is bigger than a verse. That
 *    curve is not re-derived here — it is the *same function the band's own
 *    velocities came from*, which is why the wash and the arrangement swell
 *    together rather than merely near each other.
 *  - `Section.transpose` is the key change into a last chorus. A record lifts a
 *    semitone or two because the arranger wanted the ending to feel like more,
 *    and that is precisely a lighting cue.
 *  - The drum track already contains its fills, so an arrival that was
 *    signposted can be told from one that simply happened, and only the
 *    signposted ones get a bump.
 *  - `SoloSpot` names a soloist and a beat range, which is the follow spot.
 *
 * ## The follow spot is why this file exists
 *
 * Everything else here is a wash sitting at a level. The spot is the one
 * fixture that makes a *statement about a person*, and the plan is right that
 * it is the highest-value visual in the feature. Three rules carry it:
 *
 *  1. **Drop the wash when the spot comes up.** A spotlight added to a fully
 *     lit stage is a brighter patch on an already-visible player, which is not
 *     what an audience reads as "look at them". Isolation is the effect.
 *  2. **Point it at someone who is actually playing.** The spot lands on the
 *     soloist's *first sounding note* in the block, not on the section
 *     downbeat, because an operator waits to see who it is. This also happens
 *     to make "every spot cue names a performer playing at that moment"
 *     (§12) true by construction rather than by luck.
 *  3. **Trading fours is a switch, not a crossfade.** Four bars soloist, four
 *     bars drums, and the band stops dead for the drummer's four — so the wash
 *     drops with them and comes back on the downbeat when they do.
 *
 * ### Where the operator's lateness lives, and why it is not here
 *
 * The plan asks for a spot that arrives "a beat late, the way an operator
 * would". That belongs to the rig, not to this file, and the argument is not
 * taste:
 *
 *  - **Lateness is positional.** What reads as late is the *beam sliding onto*
 *    the player — a hot spot on the boards that catches up. `LightCue` has no
 *    position field at all, by design: the score says "follow this performer"
 *    and the rig owns where anybody is standing. A system that cannot express
 *    where the beam is cannot express when it gets there.
 *  - **A constant offset is still a servo.** Baking `beat + 0.7` into the score
 *    produces a spot that is late by exactly the same amount every time, which
 *    is a different mechanism, not a human one. Real lag overshoots, corrects,
 *    and varies with how far the beam had to travel — all of which the rig
 *    knows and this file cannot.
 *  - **A late cue is indistinguishable from a wrong one.** Every check over
 *    this data reasons in musical time: no cue after the last note, the spot
 *    names someone playing *at that beat*. Writing cues deliberately off the
 *    music would make those assertions meaningless.
 *
 * What the score *can* say, and does, is that the operator hesitates: a spot
 * pickup fades over three quarters of a beat rather than snapping. That is the
 * iris opening and the hand steadying, expressed in the one field available for
 * it.
 *
 * ## Cue semantics
 *
 * A cue is **taken at `beat` and takes `fadeBeats` to complete**, which is how
 * a lighting console works and the only reading under which `fadeBeats: 0`
 * means "snap". Fixtures start **black**: the first cue for each is its fade up
 * from nothing, so the score does not waste six cues at beat 0 declaring an
 * absence.
 *
 * Cues are emitted only where something actually changes. The board below folds
 * out any cue that restates the level and colour a fixture is already sitting
 * at, which is what keeps a ten-section song at a few dozen cues instead of one
 * per section per fixture whether or not it moved.
 *
 * ## Ambient is designed, not degraded
 *
 * Ambient has no soloist and refuses to have a foreground (§4.3), so it gets no
 * follow spot. It would be easy to hand it the jazz score with the spot deleted
 * and a slower fade, and the result would be a genre lit by the shape of a form
 * it does not have. Instead the whole logic inverts:
 *
 *  - **The light never changes when the music does.** Section cues are taken
 *    two bars *after* the downbeat and the warming fixture runs on its own
 *    eight-bar cycle, offset three bars so it can never coincide with a section
 *    join. "Nothing announces itself" is the first line of the genre's ruleset;
 *    lighting that lands on the boundary announces it.
 *  - **The contrast is squashed.** A chorus here is a texture stage, not a
 *    payoff, and lighting it like one is a category error.
 *  - **Instead of a follow spot, a fixture warms on whoever is moving.** Every
 *    eight bars the layer that is furthest above *its own* average activity
 *    gets a slow warm — twelve beats up, no wash drop, nothing isolated. It is
 *    attention without a foreground, which is the only kind this genre allows.
 *  - No fill bumps and no key-change push, because ambient has neither.
 */

import { quantise } from '../core/grid.js';
import { Rng } from '../core/rng.js';
import type { LayerId, Section, SectionKind, Song } from '../core/types.js';
import { sectionIntensity } from '../generate/dynamics.js';
import type {
  Cast, FixtureId, LightCue, LightingScore, Performer, SoloSpot,
} from './types.js';

// ---------------------------------------------------------------------------
// The rig's house style, per genre
// ---------------------------------------------------------------------------

/**
 * How a genre is lit, before a single section is looked at.
 *
 * Not decoration. `contrast` and `announces` between them are the difference
 * between a dance band and a drone: one wants you to know the chorus arrived,
 * the other would consider that a fault.
 */
interface HouseStyle {
  /** Overall level. A jazz club is a dark room and a pavilion is not. */
  dim: number;
  /** The darkest the wash goes — the level an intro sits at. */
  floor: number;
  /** How far the wash swings between the quietest section and the biggest. */
  contrast: number;
  /** Beats a section change takes. */
  fade: number;
  /**
   * Bars between a section downbeat and its cue. Zero everywhere except
   * ambient, where landing on the boundary would be announcing it.
   */
  lagBars: number;
  /** A pavilion has footlights. A brick cellar and a black box do not. */
  footlights: boolean;
  /**
   * Whether the lighting is allowed to signpost anything: fill bumps,
   * key-change pushes, follow spots.
   */
  announces: boolean;
  /** Haze density before the era shades it. */
  haze: number;
}

const HOUSE: Record<string, HouseStyle> = {
  // A low brick room with candles on the tables. Dark, smoky, and the beams do
  // most of the work — which is exactly the condition a follow spot needs.
  jazz: {
    dim: 0.86, floor: 0.20, contrast: 0.58, fade: 2, lagBars: 0,
    footlights: false, announces: true, haze: 0.70,
  },
  // A lakeside dance pavilion: warm, bright enough to dance in, footlights
  // along the boards and moths in the beams. You do not black out a full floor.
  iskelma: {
    dim: 1.0, floor: 0.28, contrast: 0.52, fade: 2, lagBars: 0,
    footlights: true, announces: true, haze: 0.28,
  },
  // A black box and a projection. Almost all fog, almost no swing, and every
  // cue deliberately out of step with the form.
  ambient: {
    dim: 0.72, floor: 0.26, contrast: 0.22, fade: 12, lagBars: 2,
    footlights: false, announces: false, haze: 0.90,
  },
};

const DEFAULT_HOUSE: HouseStyle = {
  dim: 0.9, floor: 0.24, contrast: 0.5, fade: 2, lagBars: 0,
  footlights: false, announces: true, haze: 0.45,
};

/**
 * The gels.
 *
 * Era shades the palette because era is already the axis this project varies
 * production along — it picks the drum machine and the patches, and a room lit
 * in 1968 tungsten is a different photograph from the same room lit by an
 * eighties television rig. The era tables in `genre/*\/eras.ts` are the source:
 * `tanssilava` is preset rhythm boxes and accordions, `eighties` is LinnDrum
 * and synth brass, `bop` is a small group in a cellar, `sampler` is Mark
 * Morgan's score, and each of those has a colour whether or not anybody wrote
 * it down.
 */
interface Palette {
  /** The wash's home colour: a chorus, a verse, anything with the band in it. */
  warm: string;
  /** Where the wash goes for an intro, a bridge or an outro. */
  cool: string;
  /** The one saturated colour. Choruses, back light, the key-change push. */
  accent: string;
  /** The backdrop at rest, and lifted. */
  cycDeep: string;
  cycLift: string;
  /** The follow spot's gel. Near-white everywhere; a coloured spot hides a face. */
  spot: string;
}

const PALETTES: Record<string, Palette> = {
  // 1960s–70s tanssilava: tungsten, bunting, a red curtain.
  'iskelma/tanssilava': {
    warm: '#ffb865', cool: '#5a78b4', accent: '#ff8a4a',
    cycDeep: '#14203c', cycLift: '#2c4f7a', spot: '#fff2d6',
  },
  // 1980s iskelmäpop: a television studio. Whiter key, saturated magenta, and
  // the first smoke machine anybody in this repertoire owned.
  'iskelma/eighties': {
    warm: '#ffd2a8', cool: '#6f7cd8', accent: '#ff4fa8',
    cycDeep: '#1a1040', cycLift: '#4a2ea8', spot: '#ffffff',
  },
  // 1930s–40s swing: a ballroom lit by tungsten and nothing else.
  'jazz/swingera': {
    warm: '#ffab5c', cool: '#4a6a9c', accent: '#ffc46b',
    cycDeep: '#101828', cycLift: '#243b5c', spot: '#fff0d2',
  },
  // 1950s–60s bop: the cellar. Amber, deep red, and a great deal of shadow.
  'jazz/bop': {
    warm: '#ff9a45', cool: '#3c5a82', accent: '#e8632c',
    cycDeep: '#0c1020', cycLift: '#1e2c4a', spot: '#ffe8c0',
  },
  // 1960s–70s modern: cooler and more open, the way the music is. Teal and
  // violet, and a backdrop you can see.
  'jazz/modern': {
    warm: '#ffc178', cool: '#4fb0b4', accent: '#a06cd8',
    cycDeep: '#0e1c26', cycLift: '#1d4a52', spot: '#fff6e6',
  },
  // 1970s–80s tape: sodium light through dust. Warm, but not a warm anybody
  // chose.
  'ambient/tape': {
    warm: '#e8b070', cool: '#5c7d8a', accent: '#c8a86a',
    cycDeep: '#141c1a', cycLift: '#33463c', spot: '#ffe6c0',
  },
  // 1990s sampler: the Fallout end of the genre. Green-grey and cold cyan.
  'ambient/sampler': {
    warm: '#9fae86', cool: '#4f7d86', accent: '#79c0b0',
    cycDeep: '#0f1614', cycLift: '#20383a', spot: '#dff0e6',
  },
  // 2000s hybrid: where ambient stopped being a synthesiser genre. Cold
  // blue-white, real strings, a violet projection.
  'ambient/hybrid': {
    warm: '#b8c6d8', cool: '#6a86c0', accent: '#8f7ad0',
    cycDeep: '#0c1020', cycLift: '#22305a', spot: '#eef2ff',
  },
};

const DEFAULT_PALETTE: Palette = {
  warm: '#ffc98a', cool: '#5c7ab0', accent: '#ff9a5c',
  cycDeep: '#121a2c', cycLift: '#2a3f66', spot: '#fff4e0',
};

/**
 * How cool the wash goes, by what kind of section it is.
 *
 * The intro is the important one and it is not a preference: a cold, dim stage
 * is what makes the first warm chorus read as an arrival. A bridge cools for
 * the same reason it drops in volume (`dynamics.ts`) — a bridge that competes
 * with the chorus destroys the chorus.
 */
const COOLNESS: Record<SectionKind, number> = {
  intro: 0.78, verse: 0.22, chorus: 0.05, bridge: 0.52, solo: 0.28, outro: 0.72,
};

// ---------------------------------------------------------------------------
// Cue assembly
// ---------------------------------------------------------------------------

/** A cue before the board has decided whether it changes anything. */
interface Intent {
  beat: number;
  fadeBeats: number;
  fixture: FixtureId;
  intensity: number;
  colour?: string;
  follow?: string;
}

/**
 * Reading order for cues landing on the same beat.
 *
 * Purely cosmetic — the rig takes them all at once — but a score is read by
 * people, and "the wash drops, then the spot finds them" is the sentence the
 * cue actually is.
 */
const FIXTURE_ORDER: Record<FixtureId, number> = {
  wash: 0, key: 1, back: 2, cyc: 3, footlights: 4, warm: 5, spot: 6,
};

export function scoreLighting(
  song: Song,
  cast: Cast,
  solos: SoloSpot[],
  seed: string,
): LightingScore {
  const { genre, era, beatsPerBar } = song.meta;
  const house = HOUSE[genre] ?? DEFAULT_HOUSE;
  const palette = PALETTES[`${genre}/${era}`] ?? DEFAULT_PALETTE;

  /**
   * The only randomness in this file, and it is deliberately confined to
   * decisions a designer makes *once*, before the show, rather than to
   * anything that happens during it: how much haze is in the room tonight, and
   * which of two equally busy players the operator happens to warm. Nothing
   * downstream of this line draws from it, so no light ever changes because a
   * number came up.
   */
  const showRng = new Rng(`${seed}:lighting:${song.meta.seed}`);

  const lastNote = lastSoundingBeat(song);
  const intents: Intent[] = [];
  const add = (i: Intent) => {
    const beat = quantise(Math.max(0, i.beat));
    // A cue after the last note is a cue nobody is on stage for.
    if (beat > lastNote) return;
    intents.push({ ...i, beat, intensity: clamp01(i.intensity) });
  };

  const performers = new Map<string, Performer>();
  for (const p of cast.performers) performers.set(p.id, p);

  /**
   * Solos this stage can actually light, decided once.
   *
   * A spotlight on a player who is not doing anything is worse than no
   * spotlight — the plan's own words — and the failure is not only that the
   * beam is wrong. Dropping the wash is half of what a solo cue *is*, so a
   * solo whose nominal soloist is absent from the cast or never sounds would
   * take the stage down and light nobody, which is worse than either mistake on
   * its own. Filtering here rather than at the spot means the wash and the beam
   * cannot disagree about whether a solo is happening.
   */
  const staged = solos.filter((s) => {
    const p = performers.get(s.performerId);
    return !!p && firstOnset(song, p.layer, s.fromBeat, s.toBeat) !== undefined;
  });

  // Index by section; the section look has to know it is a solo before it can
  // decide how far to drop the wash.
  const soloAt = new Map<number, SoloSpot>();
  for (const s of staged) if (!soloAt.has(s.sectionIndex)) soloAt.set(s.sectionIndex, s);

  // -- The sections ---------------------------------------------------------

  const seen = new Map<SectionKind, number>();
  const density = drumDensity(song);
  /** What the band is sitting at in each section. The trade cues need it. */
  const looks = new Map<number, Look>();

  song.sections.forEach((section, index) => {
    const ordinal = seen.get(section.kind) ?? 0;
    seen.set(section.kind, ordinal + 1);

    const intensity = sectionIntensity({
      kind: section.kind, index, total: song.sections.length, ordinal,
    });
    const look = lookFor({
      section, intensity, house, palette,
      solo: soloAt.get(index),
      lifted: isKeyChange(song.sections, index) && house.announces,
    });
    looks.set(index, look);

    const start = section.startBar * beatsPerBar;
    /**
     * The lag exists so that a change never coincides with an arrival, and the
     * first section is the one arrival there is nothing to hide: the piece is
     * starting, which the audience can already tell. So the opening cue is on
     * the nose everywhere, and only the sections after it drift.
     */
    const at = index === 0 ? start : start + house.lagBars * beatsPerBar;

    /**
     * The first section fades up from black rather than appearing. A curtain
     * opens on a stage that is already lit; a stage that snaps on reads as a
     * bug in the renderer. Twice the house fade, which in ambient is twenty-four
     * beats — at 60 BPM, a fade-up nobody can watch happening.
     */
    const fade = index === 0
      ? Math.min(house.fade * 2, section.lengthBars * beatsPerBar * 0.5)
      : house.fade;

    /**
     * A key change is a push, and a push lands *with* the key. Half a beat is
     * short enough to read as an event and long enough not to be a snap.
     */
    const arrivalFade = look.lifted ? 0.5 : fade;

    /**
     * The bump on a signposted arrival.
     *
     * A fill exists to deliver the next section, so the light delivers it too —
     * but only where the drummer actually played one. `drumFills: false` genres
     * and the arrivals that got a `drop` fill (silence, which is a fill) get
     * nothing, which is right: the point of a bar of near-silence is that
     * nothing happens until the downbeat.
     *
     * It settles back over two beats afterwards, because a bump that stays up
     * is not a bump, it is a new level.
     *
     * Only the biggest arrivals snap. A crash *is* a snap and fading up to meet
     * one over half a bar arrives after the sound it was for — but iskelmä puts
     * a fill at the end of nearly every section, and a score where a quarter of
     * the cues are snaps has stopped meaning anything by them. So the snap is
     * reserved for the arrivals that got both signals, crash and rush, and
     * everything else bumps over a sixteenth: instant to the eye, and still a
     * fade on the cue sheet.
     */
    const { punch, snap } = house.announces
      ? fillPunch(song, start, density)
      : { punch: 0, snap: false };
    const bumpFade = punch > 0 ? (snap ? 0 : 0.25) : arrivalFade;

    add({ beat: at, fadeBeats: arrivalFade, fixture: 'wash', intensity: look.wash, colour: look.washColour });
    add({ beat: at, fadeBeats: bumpFade, fixture: 'key', intensity: look.key + punch });
    add({ beat: at, fadeBeats: bumpFade, fixture: 'back', intensity: look.back + punch, colour: look.backColour });
    add({ beat: at, fadeBeats: arrivalFade, fixture: 'cyc', intensity: look.cyc, colour: look.cycColour });
    if (house.footlights) {
      add({ beat: at, fadeBeats: arrivalFade, fixture: 'footlights', intensity: look.foot });
    }
    if (punch > 0) {
      add({ beat: at + 1.5, fadeBeats: 2, fixture: 'key', intensity: look.key });
      add({ beat: at + 1.5, fadeBeats: 2, fixture: 'back', intensity: look.back, colour: look.backColour });
    }
  });

  // -- The spot -------------------------------------------------------------

  if (house.announces) {
    scoreSpot({ song, cast, solos: staged, performers, palette, looks, add });
  } else {
    scoreWarming({ song, cast, palette, showRng, add });
  }

  // -- The ending -----------------------------------------------------------

  /**
   * Fade at the end only where the music does.
   *
   * A song that finishes on a full chorus ends on a button, and taking the
   * lights out under it would be lighting the wrong ending. An outro is
   * explicitly the section that goes the other way (`dynamics.ts` gives it the
   * lowest level in the table), and ambient thins back out by construction.
   *
   * It fades to an ember rather than to black. The band still has to bow, the
   * house still has to come up, and both of those belong to the show runner —
   * a score that blacks out on the last note has taken a decision that is not
   * its own.
   */
  const last = song.sections[song.sections.length - 1];
  if (last && (last.kind === 'outro' || genre === 'ambient')) {
    const over = Math.min(2 * beatsPerBar, last.lengthBars * beatsPerBar);
    const from = Math.max(0, lastNote - over);
    add({ beat: from, fadeBeats: over, fixture: 'wash', intensity: 0.10, colour: palette.cool });
    add({ beat: from, fadeBeats: over, fixture: 'key', intensity: 0.06 });
    add({ beat: from, fadeBeats: over, fixture: 'cyc', intensity: 0.22, colour: palette.cycDeep });
    if (house.footlights) add({ beat: from, fadeBeats: over, fixture: 'footlights', intensity: 0 });
    // The rim stays up. Silhouettes against a dim backdrop are the last thing
    // an audience should see, and a stage with nothing on it is a stage the
    // band has already left.
    add({ beat: from, fadeBeats: over, fixture: 'back', intensity: 0.18, colour: palette.cool });
  }

  return { cues: consolidate(intents), haze: hazeFor(genre, era, house, showRng) };
}

// ---------------------------------------------------------------------------
// The look of one section
// ---------------------------------------------------------------------------

interface Look {
  wash: number;
  washColour: string;
  key: number;
  back: number;
  backColour: string;
  cyc: number;
  cycColour: string;
  foot: number;
  lifted: boolean;
}

function lookFor(args: {
  section: Section;
  intensity: number;
  house: HouseStyle;
  palette: Palette;
  solo?: SoloSpot;
  lifted: boolean;
}): Look {
  const { section, intensity, house, palette, solo, lifted } = args;

  /**
   * `sectionIntensity` runs roughly 0.6 to 1.06 and is deliberately allowed
   * above 1 so a last chorus outgrows the first. Normalising against that band
   * rather than against 0..1 is what stops every section landing in the top
   * third of the dimmer, which is the flat-plateau problem `dynamics.ts` was
   * written to fix, in light instead of velocity.
   */
  const t = clamp01((intensity - 0.62) / 0.42);

  let cool = COOLNESS[section.kind];
  // A minor section is a cooler section. Small — the mode is a shading, not a
  // structural fact, and lighting it as one would fight the form.
  if (section.mode === 'minor') cool = clamp01(cool + 0.12);

  let wash = house.dim * (house.floor + house.contrast * t);
  let key = house.dim * (house.floor * 1.1 + house.contrast * 0.95 * t);
  let back = house.dim * (0.30 + 0.30 * t);
  // A dark stage under a lit backdrop is the classic dim-and-cool opening, so
  // the cyc does not simply follow the band down.
  let cyc = Math.max(0.26 + 0.30 * t, cool > 0.6 ? 0.42 : 0);
  const foot = house.footlights ? house.dim * (0.16 + 0.30 * t) : 0;

  let washColour = mix(palette.warm, palette.cool, cool);
  let backColour = mix(palette.accent, palette.cool, cool);
  let cycColour = mix(palette.cycDeep, palette.cycLift, t);

  /**
   * The key change into a last chorus.
   *
   * The single most iskelmä device there is, and the arranger already decided
   * it was the biggest moment in the song. The lighting agrees rather than
   * re-deciding: a push on every fixture and the accent gel on the back light,
   * which is what makes a silhouette suddenly have an edge to it.
   */
  if (lifted) {
    wash += 0.12;
    key += 0.14;
    back += 0.16;
    cyc += 0.12;
    backColour = palette.accent;
    washColour = mix(washColour, palette.accent, 0.35);
    cycColour = mix(cycColour, palette.accent, 0.30);
  }

  /**
   * A solo isolates. How far depends on what the band was told to do
   * underneath, which `BackingPolicy` already says exactly:
   *
   *   full     iskelmä's instrumental break. The floor is still full and the
   *            band has not changed a thing; dropping the wash here would light
   *            an event that is not happening. Barely moves.
   *   comping  jazz. The band answers the soloist, so the band goes back.
   *   sparse   a bass solo — comp out, drums on brushes. The contrast *is* the
   *            solo, and lighting it any other way wastes it.
   *   trade    the wash sits between the two, because it is about to be doing
   *            most of the work (see `scoreSpot`).
   *
   * And a drum solo drops the wash to almost nothing, lights the kit alone, and
   * pulls the backdrop down with it — a drummer against a bright cyc is a
   * silhouette, and the whole point is to watch their hands.
   */
  if (solo) {
    const drums = solo.layer === 'drums';
    const drop = drums ? 0.16
      : solo.backing === 'sparse' ? 0.30
        : solo.backing === 'comping' ? 0.42
          : solo.backing === 'trade' ? 0.50
            : 0.78;
    wash *= drop;
    key *= drop;
    if (drums) {
      cyc *= 0.45;
      back *= 0.7;
    }
  }

  return {
    wash: clamp01(wash), washColour,
    key: clamp01(key),
    back: clamp01(back), backColour,
    cyc: clamp01(cyc), cycColour,
    foot: clamp01(foot),
    lifted,
  };
}

/**
 * Did the key lift here?
 *
 * `transpose` is absolute against the base key, so the *change* is what matters
 * — a run of three sections all sitting a tone up is one modulation, not three,
 * and pushing the lights on each of them would turn a gesture into a habit.
 */
function isKeyChange(sections: Section[], index: number): boolean {
  const here = sections[index];
  if (!here || here.transpose <= 0) return false;
  const prev = sections[index - 1];
  return !prev || here.transpose > prev.transpose;
}

// ---------------------------------------------------------------------------
// The follow spot
// ---------------------------------------------------------------------------

function scoreSpot(args: {
  song: Song;
  cast: Cast;
  solos: SoloSpot[];
  performers: Map<string, Performer>;
  palette: Palette;
  looks: Map<number, Look>;
  add: (i: Intent) => void;
}): void {
  const { song, cast, solos, performers, palette, looks, add } = args;
  const { beatsPerBar } = song.meta;
  const drummer = cast.performers.find((p) => p.layer === 'drums');

  const ordered = [...solos].sort((a, b) => a.fromBeat - b.fromBeat);

  // Already filtered to solos with a cast member who actually plays; see
  // `staged` in `scoreLighting`.
  ordered.forEach((solo, i) => {
    const player = performers.get(solo.performerId)!;
    const entry = firstOnset(song, player.layer, solo.fromBeat, solo.toBeat)!;
    const level = player.layer === 'drums' ? 0.85 : 0.92;

    /**
     * `trade` means two different things and the difference is the soloist.
     *
     * `generate/solo.ts` writes a whole *drum chorus* as `layer: 'drums'` with
     * `backing: 'trade'`, because the policy table has no "everyone stops"
     * entry and does not need one — a drum chorus is trading with one block
     * instead of two. Only a trade whose soloist is somebody else is an
     * alternation, and the `drummer.id !== player.id` test is what separates
     * them. Getting this wrong would light a drum chorus by alternating a spot
     * between the drummer and the drummer.
     */
    const look = looks.get(solo.sectionIndex);
    if (solo.backing === 'trade' && drummer && drummer.id !== player.id && look) {
      scoreTrade({ song, solo, player, drummer, palette, look, add, beatsPerBar });
    } else {
      /**
       * The pickup lands on the soloist's first note, not on the downbeat. An
       * operator waits to see who stood up, and the audience's eye follows the
       * sound rather than leading it.
       */
      add({
        beat: entry, fadeBeats: 0.75, fixture: 'spot',
        intensity: level, colour: palette.spot, follow: player.id,
      });
    }

    /**
     * Let go only when the spot has nowhere to be next.
     *
     * Jazz spends four consecutive choruses in `solo`, and a spot that drops
     * and re-finds the same player at every section join is an operator who has
     * lost them. Dropping between two *different* soloists is right, though —
     * the beam leaving one player and finding another is the hand-off, and it
     * is worth seeing.
     */
    const next = ordered[i + 1];
    const handsOver = !!next
      && Math.abs(next.fromBeat - solo.toBeat) < beatsPerBar
      && performers.has(next.performerId);
    if (handsOver && next!.performerId === player.id) return;

    /**
     * Letting go names nobody. A beam at zero is not following anything, and a
     * release cue that still carries a performer id would make "every spot cue
     * names someone who is playing" false for a cue that is out — the one case
     * where it obviously should not apply.
     */
    add({
      beat: solo.toBeat, fadeBeats: handsOver ? 0.5 : 1.5,
      fixture: 'spot', intensity: 0,
    });
  });

  /**
   * A number with no solo in it still has a front person.
   *
   * Most of this repertoire has no blowing chorus at all, and leaving the
   * highest-value fixture in the rig dark for a whole number because the form
   * did not contain the word "solo" is a waste of it. So the last chorus — the
   * biggest thing in the song, and the one the key change was for — gets the
   * spot favouring whoever has the tune.
   *
   * Deliberately *not* an isolation: the wash does not move, nothing else
   * changes, and the spot sits lower than it would over a solo. The distinction
   * matters. A spot that isolates says "listen to this person"; a spot that
   * merely favours says "this is the person singing it", which is true of the
   * whole number and is exactly what a front light is for.
   */
  if (ordered.length === 0 && cast.leadPerformerId) {
    const lead = performers.get(cast.leadPerformerId);
    /**
     * The last chorus, or failing that the last verse — which in a jazz form
     * with no chorus in it is the head out, and is the same moment.
     */
    let index = lastIndexOfKind(song.sections, 'chorus');
    if (index < 0) index = lastIndexOfKind(song.sections, 'verse');
    const last = index >= 0 ? song.sections[index] : undefined;
    if (lead && last) {
      const from = last.startBar * beatsPerBar;
      const to = from + last.lengthBars * beatsPerBar;
      const entry = firstOnset(song, lead.layer, from, to);
      if (entry !== undefined) {
        add({
          beat: entry, fadeBeats: 2, fixture: 'spot',
          intensity: 0.6, colour: palette.spot, follow: lead.id,
        });
        /**
         * Let go into an outro, and not otherwise. A number that ends on this
         * chorus should end with the beam still on the person who sang it —
         * they are about to take a bow. A number that has somewhere to go
         * afterwards should not drag a spotlight into it.
         */
        if (index < song.sections.length - 1) {
          add({ beat: to, fadeBeats: 3, fixture: 'spot', intensity: 0 });
        }
      }
    }
  }
}

/**
 * Trading fours.
 *
 * Four bars soloist, four bars drums, alternating — the most recognisable
 * gesture in the idiom and, per the plan, the most fun cue in the show. Two
 * things have to be right or it is merely a light going on and off:
 *
 *  - **The wash moves with the band.** `BackingPolicy: 'trade'` says the band
 *    stops dead for the drummer's four and comes back in on the downbeat. So
 *    the wash goes with them: down to almost nothing when they stop, back up
 *    when they return. The drummer's four is the only moment in a jazz number
 *    where the stage is genuinely one person.
 *  - **The switch is a switch.** Four tenths of a beat: fast enough to read as
 *    the beam moving rather than as two fixtures crossfading, slow enough that
 *    it is not a strobe. A follow spot does not teleport, and `fadeBeats: 0`
 *    here would look like an edit.
 *
 * Each block's spot cue lands on the incoming player's first hit inside it,
 * which keeps the "playing at that beat" property true through the alternation
 * and, more usefully, means the beam and the entry are the same event.
 */
function scoreTrade(args: {
  song: Song;
  solo: SoloSpot;
  player: Performer;
  drummer: Performer;
  palette: Palette;
  look: Look;
  add: (i: Intent) => void;
  beatsPerBar: number;
}): void {
  const { song, solo, player, drummer, palette, look, add, beatsPerBar } = args;
  const block = 4 * beatsPerBar;

  /**
   * The level the band returns to is the section's own, taken from the look
   * rather than picked here. One place decides how bright a trade chorus is,
   * and it is the same place that decides it for every other section — two
   * files agreeing on a number by coincidence is a number that will disagree
   * the first time either is touched.
   */
  let blockIndex = 0;
  for (let from = solo.fromBeat; from < solo.toBeat - 0.5; from += block) {
    const to = Math.min(from + block, solo.toBeat);
    const drums = blockIndex % 2 === 1;
    const who = drums ? drummer : player;
    const entry = firstOnset(song, who.layer, from, to);
    blockIndex++;
    // Nobody played in this block. Leave the beam where it is rather than
    // pointing it at a rest — the alternation is the gesture, but a beam on
    // silence undoes it.
    if (entry === undefined) continue;

    add({
      beat: entry, fadeBeats: 0.4, fixture: 'spot',
      intensity: drums ? 0.85 : 0.92, colour: palette.spot, follow: who.id,
    });
    // The band's own four: they are playing, so they are lit. The drummer's:
    // they have stopped dead, so the stage goes with them.
    add({
      beat: from, fadeBeats: 0.4, fixture: 'wash',
      intensity: drums ? look.wash * 0.28 : look.wash, colour: look.washColour,
    });
    add({
      beat: from, fadeBeats: 0.4, fixture: 'key',
      intensity: drums ? look.key * 0.22 : look.key,
    });
  }
}

// ---------------------------------------------------------------------------
// Ambient — attention without a foreground
// ---------------------------------------------------------------------------

/** How often the warming fixture reconsiders, in bars. */
const WARM_WINDOW_BARS = 8;

/**
 * How far into each window the search for a cue beat starts.
 *
 * Ambient forms are sixteen- and eight-bar blocks, so an eight-bar cycle left
 * to itself would coincide with a section join every other time. Starting three
 * bars in puts the cue somewhere in the middle of a texture, which is the only
 * place it is allowed to be.
 */
const WARM_OFFSET_BARS = 3;

/**
 * The ambient equivalent of a follow spot, which is deliberately not one.
 *
 * The genre has no soloist and refuses to have a foreground, so there is
 * nothing to follow. What it does have is *gear that is currently moving* — a
 * sequence that has started running, a pad that has just entered, a bass that
 * has begun to articulate — and a fixture warming slowly on whoever that is
 * gives an audience somewhere to look without telling them anything.
 *
 * Everything that makes a follow spot a follow spot is removed:
 *
 *  - It never rises above a third, where a spot sits above nine tenths.
 *  - Nothing else dips for it. There is no isolation, so nothing is foreground.
 *  - Twelve beats to arrive — at 60 BPM that is twelve seconds, slower than
 *    anybody can watch happening.
 *  - It runs on its own cycle, out of step with the form on purpose.
 *
 * Activity is measured against each layer's *own* average rather than against
 * the other layers'. Otherwise the drums would win every window in the styles
 * that have them and the pad would never win one, and "what changed" is the
 * question worth asking here — a drone that has been holding for eight bars is
 * not moving however loud it is.
 */
function scoreWarming(args: {
  song: Song;
  cast: Cast;
  palette: Palette;
  showRng: Rng;
  add: (i: Intent) => void;
}): void {
  const { song, cast, palette, showRng, add } = args;
  const { beatsPerBar, totalBars } = song.meta;
  const window = WARM_WINDOW_BARS * beatsPerBar;

  const candidates = cast.performers.filter((p) => hasNotes(song, p.layer));
  if (!candidates.length) return;

  // A fixed, tiny per-performer bias so two players moving identically do not
  // resolve by array order every window of every show. This is the operator's
  // eye, not a dice roll: it is drawn once and never changes within a number.
  const bias = new Map<string, number>();
  for (const p of candidates) bias.set(p.id, showRng.float(0.97, 1.03));

  const baseline = new Map<string, number>();
  const total = totalBars * beatsPerBar;
  for (const p of candidates) {
    baseline.set(p.id, Math.max(1e-6, activity(song, p.layer, 0, total) / total));
  }

  // Section downbeats, so a warming can be kept off every one of them.
  const downbeats = new Set(song.sections.map((s) => s.startBar * beatsPerBar));

  let current: string | undefined;
  for (let bar = 0; bar + WARM_WINDOW_BARS <= totalBars; bar += WARM_WINDOW_BARS) {
    const from = bar * beatsPerBar;
    const to = from + window;

    let best: Performer | undefined;
    let bestScore = 0;
    let holdingScore = 0;
    for (const p of candidates) {
      const rate = activity(song, p.layer, from, to) / window;
      const score = (rate / baseline.get(p.id)!) * bias.get(p.id)!;
      if (p.id === current) holdingScore = score;
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }

    // Nobody is doing anything above their own resting rate — which in this
    // genre is a real state, not an edge case. Leave the fixture where it is.
    if (!best || bestScore < 1.08 || best.id === current) continue;

    /**
     * Hysteresis, and it is doing real work.
     *
     * Without it the fixture changes hands every time two layers swap places by
     * a hair, which over four minutes is a light wandering the stage — the
     * opposite of what a slow warm is for. A handover has to be won rather than
     * tied: a tenth again as much movement as whoever holds it.
     *
     * Measured against the incumbent's activity *in this window*, not against
     * whatever it scored when it won the fixture. The second reading looks like
     * hysteresis and is really a ratchet — a layer that opens the piece loudly
     * and then subsides keeps the light for the rest of the number, and the
     * fixture stops meaning "who is moving" the moment that happens.
     */
    if (current && bestScore < holdingScore * 1.1) continue;

    /**
     * Land it on a note the player actually sounds.
     *
     * The window says who is moving; this says when they move. Cueing at a bar
     * line inside the window would point the fixture at somebody who may have
     * stopped three bars ago, and would make "the spot names a performer who is
     * playing at that beat" true only on average. Searched from three bars in
     * so the cue cannot sit on the window's own edge, and skipped past any
     * onset that happens to fall on a section join, because a fixture that
     * warms exactly as a section changes has announced the section change
     * however slowly it does it.
     */
    const search = from + WARM_OFFSET_BARS * beatsPerBar;
    const beat = onsetsOf(song, best.layer)
      .map((n) => quantise(n.beat))
      .filter((b) => b >= search && b < to && !downbeats.has(b))
      .sort((a, b) => a - b)[0];
    if (beat === undefined) continue;
    current = best.id;

    /**
     * `warm`, not `spot`.
     *
     * This fixture favours a player without isolating them, which is the only
     * honest way to light a genre that refuses to have a foreground. It was
     * written as a dimmed, slow-faded `spot` before the contract had a member
     * for it — behaviourally identical, but it made "ambient never uses a
     * follow spot" unassertable, and a rule the checker cannot state is a rule
     * that quietly stops being true.
     */
    add({
      beat,
      fadeBeats: 12,
      fixture: 'warm',
      intensity: 0.32,
      colour: palette.spot,
      follow: best.id,
    });
  }
}

// ---------------------------------------------------------------------------
// Reading the music
// ---------------------------------------------------------------------------

/** Every note event in a layer, drums included. */
function onsetsOf(song: Song, layer: LayerId): { beat: number; velocity: number }[] {
  if (layer === 'drums') return song.drums.events;
  const out: { beat: number; velocity: number }[] = [];
  for (const track of song.tracks) {
    if (track.layer === layer) out.push(...track.notes);
  }
  return out;
}

function hasNotes(song: Song, layer: LayerId): boolean {
  return onsetsOf(song, layer).length > 0;
}

/** Summed velocity of everything this layer starts inside the window. */
function activity(song: Song, layer: LayerId, from: number, to: number): number {
  let sum = 0;
  for (const n of onsetsOf(song, layer)) {
    if (n.beat >= from && n.beat < to) sum += n.velocity;
  }
  return sum;
}

/**
 * When this layer first sounds inside the window, on the grid.
 *
 * Quantised because it is about to become a cue beat and cue beats have to
 * agree with the audio for the same reason gestures do (`core/grid.ts`): at
 * `swing: 0.15` an offbeat eighth is a third of a slot away from where it is
 * actually played, and a spot that finds a player a 32nd before their first
 * swung note has found them early in a way that reads as a mistake.
 */
function firstOnset(
  song: Song, layer: LayerId, from: number, to: number,
): number | undefined {
  let best: number | undefined;
  for (const n of onsetsOf(song, layer)) {
    if (n.beat < from || n.beat >= to) continue;
    if (best === undefined || n.beat < best) best = n.beat;
  }
  return best === undefined ? undefined : quantise(best);
}

/** Mean drum energy per beat across the whole number. The fill detector's zero. */
function drumDensity(song: Song): number {
  const beats = song.meta.totalBars * song.meta.beatsPerBar;
  if (beats <= 0 || !song.drums.events.length) return 0;
  let sum = 0;
  for (const e of song.drums.events) sum += e.velocity;
  return sum / beats;
}

/**
 * How hard this downbeat was signposted, 0..~0.24.
 *
 * The score is not handed the fill decisions, and it should not be: a fill is a
 * property of the drum track, and the drum track is right there. Two signals,
 * both of which `generate/fills.ts` actually produces:
 *
 *  - **A crash on the downbeat.** `landing()` puts one there whenever the
 *    arrival is worth it and an open hat when it is not, so a `cr` on a section
 *    join is the drummer saying this is the moment — which is the same claim a
 *    bump makes.
 *  - **A rush in the two beats before it.** A fill crescendos into its landing;
 *    measured against the number's own mean drum energy, that shows up as a
 *    window running well above baseline. This is what catches a `snare-roll`
 *    into a verse, where the landing is only an open hat.
 *
 * A `drop` fill — the bar that empties so the downbeat lands twice as hard —
 * scores near zero on both, and correctly gets no bump: the whole gesture is
 * that nothing happens until the downbeat.
 *
 * `snap` is set only when both signals fire, which is the arrival the drummer
 * ran at *and* landed. That is the one worth taking without a fade.
 */
function fillPunch(
  song: Song, boundary: number, density: number,
): { punch: number; snap: boolean } {
  if (boundary <= 0 || density <= 0) return { punch: 0, snap: false };

  let lead = 0;
  let crash = false;
  for (const e of song.drums.events) {
    if (e.beat >= boundary - 2 && e.beat < boundary) lead += e.velocity;
    if (e.voice === 'cr' && e.beat >= boundary - 0.25 && e.beat <= boundary + 0.5) crash = true;
  }

  const rush = clamp01((lead / (2 * density) - 1.15) * 0.6);
  return {
    punch: Math.min(0.24, rush * 0.14 + (crash ? 0.14 : 0)),
    snap: crash && rush > 0.35,
  };
}

/**
 * The last beat anything sounds. Nothing may be cued after it.
 *
 * Floored onto the grid rather than rounded: `quantise` would round the last
 * note *up* half the time, and a cue permitted one slot past the final note is
 * a cue after the music, which is exactly what this bound exists to forbid.
 */
function lastSoundingBeat(song: Song): number {
  let last = 0;
  for (const t of song.tracks) {
    for (const n of t.notes) if (n.beat > last) last = n.beat;
  }
  for (const e of song.drums.events) if (e.beat > last) last = e.beat;
  return Math.floor(last * 4) / 4;
}

function lastIndexOfKind(sections: Section[], kind: SectionKind): number {
  for (let i = sections.length - 1; i >= 0; i--) {
    if (sections[i]!.kind === kind) return i;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// The board
// ---------------------------------------------------------------------------

/**
 * Fold the intents into a cue list, dropping everything that changes nothing.
 *
 * This is where "nothing here is random" becomes "nothing here is redundant".
 * The section pass writes a full look for every section — which is how the
 * logic stays readable, one place deciding one thing — and most of those values
 * are identical to the ones already on the board. A cue restating a level the
 * fixture is already at is a cue the rig will happily execute and the audience
 * will correctly perceive as nothing happening, so it should not exist.
 *
 * Two beats of care:
 *
 *  - **Order matters, so sort first.** The board is a fold over time and the
 *    comparison is against whatever the fixture was last told, so the intents
 *    have to be in the order the show will take them.
 *  - **Last write wins on a tie.** A section look and a solo cue can land on
 *    the same beat and the same fixture; the later intent is the more specific
 *    one and replaces rather than follows.
 */
function consolidate(intents: Intent[]): LightCue[] {
  intents.sort((a, b) => a.beat - b.beat
    || FIXTURE_ORDER[a.fixture] - FIXTURE_ORDER[b.fixture]);

  const state = new Map<FixtureId, { intensity: number; colour?: string; follow?: string }>();
  const cues: LightCue[] = [];

  for (const it of intents) {
    const intensity = round3(it.intensity);
    const now = state.get(it.fixture);
    const unchanged = now
      && Math.abs(now.intensity - intensity) < 0.02
      && now.colour === it.colour
      && now.follow === it.follow;
    if (unchanged) continue;

    const cue: LightCue = {
      beat: it.beat, fadeBeats: it.fadeBeats, fixture: it.fixture, intensity,
    };
    if (it.colour) cue.colour = it.colour;
    if (it.follow) cue.followPerformerId = it.follow;

    // Replace a cue already written for this fixture on this beat.
    let replaced = false;
    for (let i = cues.length - 1; i >= 0 && cues[i]!.beat === it.beat; i--) {
      if (cues[i]!.fixture === it.fixture) {
        cues[i] = cue;
        replaced = true;
        break;
      }
    }
    if (!replaced) cues.push(cue);

    state.set(it.fixture, { intensity, colour: it.colour, follow: it.follow });
  }

  return cues;
}

// ---------------------------------------------------------------------------
// Haze and gels
// ---------------------------------------------------------------------------

/**
 * How much is in the air.
 *
 * The beams are the effect. A follow spot with nothing in front of it is a
 * bright patch on the floor, and every argument in this file about isolation
 * assumes you can see the cone. So haze is not atmosphere, it is the fixture
 * budget's other half.
 *
 * The era shading is small and physical rather than stylistic: a 1950s cellar
 * had cigarettes in it, a 1980s television rig had a smoke machine, and a
 * lakeside pavilion in July has moths and damp air and nothing else.
 */
function hazeFor(genre: string, era: string, house: HouseStyle, rng: Rng): number {
  const shade: Record<string, number> = {
    'jazz/swingera': 0.06,
    'jazz/bop': 0.04,
    'jazz/modern': -0.06,
    'iskelma/tanssilava': 0.0,
    'iskelma/eighties': 0.07,
    'ambient/tape': -0.04,
    'ambient/sampler': 0.02,
    'ambient/hybrid': 0.05,
  };
  const spread = genre === 'ambient' ? 0.03 : 0.05;
  return round3(clamp01(
    house.haze + (shade[`${genre}/${era}`] ?? 0) + rng.float(-spread, spread),
  ));
}

/**
 * Blend two gels.
 *
 * A straight sRGB lerp, which is wrong for adding two beams together and right
 * for what this is doing: naming the colour of one fixture somewhere between
 * two reference gels. The rig converts and may well work in linear light; the
 * IR stays a printable `#rrggbb`, as the contract says.
 *
 * **Snapped to eighths, because a rig has gels rather than a colour space.** A
 * continuous blend would give every section a very slightly different hue, and
 * since a cue exists wherever anything changed, that means a cue on every
 * fixture at every section whether or not anybody could see the difference. A
 * short ladder of positions is both what a real colour scroller offers and what
 * stops the score describing changes nobody can perceive.
 */
const GEL_STEPS = 8;

function mix(a: string, b: string, t: number): string {
  const k = Math.round(clamp01(t) * GEL_STEPS) / GEL_STEPS;
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * k);
  return hex(c(ar, br), c(ag, bg), c(ab, bb));
}

function rgb(s: string): [number, number, number] {
  const n = parseInt(s.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hex(r: number, g: number, b: number): string {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}
