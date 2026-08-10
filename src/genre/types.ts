/**
 * The Genre abstraction.
 *
 * A genre owns everything that is *culturally* specific: which dances or
 * grooves exist, which instruments and production eras, what moods mean, what
 * songs are called, how they are structured, and — importantly — how a melody
 * relates to the harmony underneath it.
 *
 * That last point is the one that forced this abstraction to exist, and there
 * are now three genuinely different answers to it:
 *
 *  - **iskelmä** follows the *key* — natural minor throughout, harmonic minor
 *    at cadences;
 *  - **jazz** follows the *chord* — every chord quality implies its own scale,
 *    and the line re-orients bar by bar;
 *  - **ambient** follows the *drone* — one scale rooted on the tonic for the
 *    whole piece, bent to absorb whatever the chord underneath happens to be,
 *    so the tonal centre never moves at all.
 *
 * Those are not three settings of one system. Pretending otherwise would
 * produce jazz that sounds like iskelmä with extensions bolted on, and ambient
 * that sounds like a very slow ballad.
 */

import type { Device } from '../generate/chart.js';
import type { Chord } from '../core/chord.js';
import type { Pc } from '../core/pitch.js';
import type { Rng } from '../core/rng.js';
import type { Mode, Scale } from '../core/scale.js';
import type {
  BackingPolicy, DrumVoice, Effects, EndingStyle, LayerId, PlayedLayer, SectionKind, Space,
} from '../core/types.js';
import type { Technique, TechniqueProfile } from '../generate/technique.js';
import type { RuleOverrides, StrictnessId } from '../core/rules.js';
import type { HookId } from '../generate/hook.js';
import type { CompingProfile, EraProfile, Mood, Style } from '../style/types.js';
import type { FeelId } from '../style/feel.js';
import type { VocalProfile } from '../style/vocals.js';
import type { FillPalette } from '../generate/fills.js';
import type { TransitionPalette } from '../generate/transition.js';
import type { SoloProfile } from '../generate/solo.js';
/**
 * Five types the stage owns, borrowed rather than restated.
 *
 * The direction of these imports looks wrong for about a second — the genre is
 * the upstream thing and `concert/` is a renderer of what it produces — and it
 * is the right way round anyway, because each of them is a *vocabulary the
 * renderer has to be able to switch on exhaustively*. `HairStyle`, `Fabric`,
 * `Accessory` and `RoomStyle` are the shapes `web/concert/` has models for, and
 * `Venue` is the frozen contract the room is emitted as; a genre inventing a
 * tenth fabric would be inventing a material nothing can draw, and a genre
 * inventing a fifteenth kind of building would be inventing one nothing can put
 * up. So the unions stay where the renderer can see them, and a genre picks
 * from them.
 *
 * Type-only, so nothing here exists at runtime and there is no import cycle to
 * worry about, though `concert/venue.ts` does import the genre registry.
 */
import type { Accessory, Fabric, Garment, HairStyle, RoomStyle, Venue } from '../concert/types.js';
import type { PropName } from '../concert/venue.js';

export interface FormStep {
  kind: SectionKind;
  bars: number;
}

/**
 * How the last bar of a piece lands — `core/types.ts` owns the vocabulary now,
 * because `Style` names it too and cannot import from here. Re-exported rather
 * than moved out of sight: `Genre.ending` below is still the field most callers
 * mean, and `genre/index.ts` has published this name since it existed.
 */
export type { EndingStyle } from '../core/types.js';

/**
 * What the piece turned out to be, so that its title can avoid claiming
 * otherwise.
 *
 * Titles in all three of these repertoires are half imagery and half
 * announcement — "Sodium Corridor" only pictures something, but "Midnight
 * Swing", "Satumaan valssi" and "Blue Harlem Blues" also say what the band is
 * playing. An announcement that disagrees with the music is worse than no
 * announcement at all: a bossa called a swing reads as a mistake, not as a
 * poetic liberty. So the word pools are filtered against the piece before
 * anything is drawn from them.
 *
 * ## The key, added late and asked for by three genres independently
 *
 * `style`, `mood` and `bpm` were the whole of this for a long time, and three
 * genres wrote down the same missing field rather than guessing at it. Arabic
 * names an instrumental piece **form plus maqam** — *Longa Nahawand* — and the
 * maqam is a function of the tonic. Indian announces the **rāga**, and which of
 * a style's two rāgas a song is in is decided by the mode and by nothing else.
 * Classical names the key outright, which is what half the real titles in that
 * repertoire do. All three fell back to imagery or to the form alone, and all
 * three said so in a comment, which is the bar this project sets for a gap
 * being real rather than a taste.
 *
 * **The tonic and the mode, and not a label.** Classical's objection to the
 * field was that it *"would put a spelling decision (is it C♯ or D♭?) into a
 * type"*, and the answer is that the type declines to make one: two numbers go
 * in, and `keyLabel` in `core/pitch.ts` — which has been deciding exactly that
 * question for every song in the project since before the objection was written,
 * and which `generateSong` calls three lines below the call to this function —
 * decides it for anybody who wants a label. A genre that wants a maqam or a rāga
 * instead wants neither spelling.
 */
export interface TitleContext {
  style: Style;
  mood: Mood;
  /** The tempo actually chosen, not the style's band. */
  bpm: number;
  /** The key the song is in. See the header — a number, not a spelling. */
  tonic: Pc;
  mode: Mode;
}

export interface Genre {
  /**
   * Does a key change get announced by the dominant of the key it is going to?
   *
   * True by default, because a prepared modulation is what most of this repertoire
   * does. False where an applied dominant would be an anachronism in the other
   * direction: modal pop after 1970 has no leading tone in minor — where another
   * idiom writes `V` it writes `bVII` — so a `V7/II` in front of the last chorus
   * would sound like a dance band had walked in, and `npm run genres` asserts that
   * the raised seventh never appears. Those genres modulate directly instead, which
   * is also a real gesture. See `tune/keyplan.ts`.
   */
  preparedModulation?: boolean;
  id: string;
  label: string;
  /** One line, shown in the CLI and the audition page. */
  description: string;

  styles: Record<string, Style>;
  eras: Record<string, EraProfile>;
  moods: Record<string, Mood>;

  /**
   * How this genre sings, when asked to. Opt-in via `vocals: true` — the
   * station is instrumental by default.
   */
  vocals: VocalProfile;

  /** Song-title generator. */
  title(rng: Rng, ctx: TitleContext): string;

  /**
   * Song forms, weighted. Iskelmä is verse/chorus; jazz is head–solos–head
   * over a fixed chorus length, which is why this cannot be shared.
   */
  forms: (readonly [FormStep[], number])[];

  /** Keys the genre actually lives in, weighted. */
  keys: {
    minor: (readonly [Pc, number])[];
    major: (readonly [Pc, number])[];
  };

  /**
   * How a piece in this genre finishes, unless the style says otherwise. See
   * `EndingStyle`, and `Style.ending`, which overrides this.
   *
   * Required rather than optional, and it stays required now that the style may
   * override it: every genre in the catalogue has a house ending, and the two
   * that hold both kinds hold them in a known handful of styles rather than in
   * an even split. Making this optional would let a genre decline to say, which
   * is a claim none of the nineteen wants to make.
   */
  ending: EndingStyle;

  /**
   * Whether a live band counts this music in.
   *
   * A *staging* fact rather than a musical one, and the only one of those in
   * this table — which is why it is here rather than inferred on the stage: the
   * concert is a renderer of the IR and does not get to invent bars of music.
   * Applied by `withCountIn`, and only ever to a number a band is playing in
   * front of people. The radio never counts anything in; a record that counted
   * itself in would be a demo.
   *
   * False for music that has no pulse to count. An ambient piece does not
   * begin, it is found already happening, and four clicks in front of it would
   * be four clicks in front of the wrong music.
   *
   * The genre's answer, and `Style.countIn` overrides it — for the case a genre
   * holds a dance band and an unmetred lament in the same catalogue.
   */
  countIn: boolean;

  /** Constraint level that suits the idiom by default. */
  defaultStrictness: StrictnessId;

  /**
   * How this genre's sections may be felt, weighted — the fallback for styles
   * that name no table of their own. See `style/feel.ts`.
   *
   * The merge order is the established one, `genre ← style ← mood bias`, and a
   * style's table *replaces* this rather than extending it: a table is a
   * statement about what this band would do, and a style that has listed two
   * feels has not implicitly agreed to the genre's third.
   *
   * Empty on every genre so far, and that is a real answer rather than a stub.
   * A genre-wide default is how six feels end up under everything at once, so
   * the opt-in stays per style until there is evidence about how it sounds.
   */
  feels?: (readonly [FeelId, number])[];

  /**
   * Repetition level that suits the idiom by default.
   *
   * This is one of the sharper distinctions between the two genres here.
   * Iskelmä is verse/chorus pop and its chorus is meant to be the same tune
   * every time. Jazz states a head and then leaves it, and a form that recalled
   * its solos would not be jazz at all.
   */
  defaultHook: HookId;

  /**
   * Adjustments to the shared rule table. The rules encode faults classical
   * and jazz practice largely agree on — but not entirely, and a rule applied
   * to a genre that does not hold it produces music that is correct and wrong.
   */
  ruleOverrides?: RuleOverrides;
  /** Default fill vocabulary for the genre's styles. See `generate/fills.ts`. */
  fills?: FillPalette;

  /**
   * What this idiom does at a section join, weighted — the fallback for styles
   * that name no palette of their own. See `generate/transition.ts`.
   *
   * The same merge order as `feels` and `fills` above, and a style's palette
   * *replaces* this rather than extending it, for the same reason: a palette is
   * a statement about what this band would do at a seam, and a style that has
   * listed two kinds has not implicitly agreed to the genre's third.
   *
   * Empty on every genre, and here that is a stronger claim than it is for
   * `feels`. Absent means `DEFAULT_TRANSITIONS`, which is `fill` alone, which is
   * what every genre has always done — and it means **no draw is made**, so
   * declaring one is the difference between a genre being additive and it
   * rewriting the whole catalogue. The genre this field is eventually *for* is
   * ambient, which wants an empty palette so that nothing announces anything;
   * see `drumFills`, which already says the same sentence about the kit.
   */
  transitions?: TransitionPalette;

  /**
   * Which arrangement devices this idiom uses, as weight overrides on the shared
   * pool. A zero rules one out; omitting the field takes the pool as it stands.
   *
   * A genre statement rather than a style one, because the devices are about what
   * *kind of ensemble* this is rather than about what it is playing. Handing a
   * phrase from one player to another and the whole band catching a figure are
   * both things a band does and neither is something a piece of ambient does — an
   * ambient record has no players in it in the sense the gesture needs, and a
   * tutti hit would be a door slamming. See `generate/chart.ts`.
   */
  arrangement?: Partial<Record<Device, number>>;

  /**
   * What the band plays underneath a solo section. Defaults to `full`.
   *
   * Whether the rhythm section carries on unchanged, thins out and answers, or
   * stops dead for four bars is a *genre* fact — a tanssilava band never stops,
   * and a jazz rhythm section that never reacts is not comping. This is the
   * fallback; `solo.backing` may name a different policy per soloist, because
   * what the band does behind a bass solo is not what it does behind a horn.
   */
  soloBacking?: BackingPolicy;

  /**
   * Who solos, over what, and in what language. Absent means the genre has no
   * solos and its forms contain no `solo` sections — which is a statement about
   * the music rather than an omission. See `generate/solo.ts`.
   *
   * This is the largest genre-owned table after the styles themselves, and it
   * has to be genre-owned for the same reason `scaleForChord` does: a jazz
   * chorus and an iskelmä instrumental break are not two settings of one
   * system. One is improvisation over the changes and the other is the tune
   * with more notes in it, and generating the second by turning the first down
   * would be wrong about the genre rather than merely tame.
   */
  solo?: SoloProfile;

  /**
   * How heavily the *tune itself* is decorated, 0..1. Absent means not at all,
   * which is the right answer for most of the catalogue.
   *
   * ## Why this is not `solo.vocabulary.ornament`
   *
   * It looks like a duplicate of that field and it is the opposite of one. That
   * one says how a **break** is decorated, and it is only reachable through
   * `generateSolo` — so a genre that set it got ornaments in the sections that
   * have a soloist and in no others. For jazz that is exactly right: the head is
   * played straight and the chorus is where the language lives.
   *
   * For a genre built on one player decorating a tune everybody knows, it is the
   * wrong shape entirely. Finnish folk has a `solo` section in one arrangement in
   * four and its own profile says the word is the engine's rather than the
   * music's — *there is no such thing as a blowing chorus in Finnish folk music* —
   * so under the old arrangement three strains in four came out bare, which is
   * not a pelimanni playing quietly, it is a different instrument. The gap was
   * found by asking whether the fiddle could trill and discovering that the
   * question had no answer outside a break.
   *
   * ## What the number means
   *
   * The chance that any given note long enough to hold one is given a figure —
   * a grace note, a mordent, or on a note of a beat or more a trill. It is applied
   * to the finished section melody, after the tune engine has been judged and
   * before the dynamics, so the ornaments ride the line the judge actually chose
   * rather than competing with it. See `ornament` in `generate/solo.ts`, which
   * both paths now share.
   *
   * Scaled by the mood's own `ornament` multiplier at the call site, so a
   * `haikea` reading of a tune is decorated less than an `iloinen` one without
   * either of them having to state it twice.
   */
  decorate?: number;

  /**
   * Which scale the melody should draw on for a given chord.
   * Key-relative for iskelmä, chord-relative for jazz, drone-relative for
   * ambient.
   *
   * `section` says where in the form the chord sits, and is the seam a maqam's
   * *sayr* needs: the piece states its maqam on the refrain, leaves for a
   * neighbour, and comes back. Optional, and a genre that ignores it — which is
   * eighteen of the nineteen — answers exactly as it did before the argument
   * existed. See `Style.scaleForChord` for the full argument, including why
   * `Section.mode` is not the same question.
   */
  scaleForChord(tonic: Pc, mode: Mode, chord: Chord, section?: SectionKind): Scale;

  /**
   * Per-layer mix overrides, 0..1, `drums` included. Omitted layers keep the
   * default dance-band balance — melody loudest, pad furthest back. Ambient
   * inverts that, which is a statement about the music rather than a taste in
   * mixing: there the pad is the piece and the kit, when there is one, is
   * barely present.
   */
  mix?: Partial<Record<LayerId, number>>;

  /**
   * Per-voice balance inside the kit, 0..1. Merged over `DEFAULT_DRUM_MIX`.
   * A genre that wants its hats further back than everyone else's says so
   * here rather than by writing quieter patterns.
   */
  drumMix?: Partial<Record<DrumVoice, number>>;

  /**
   * The room. Merged over `DEFAULT_SPACE`; an era may refine it further.
   */
  space?: Partial<Space>;

  /**
   * Filtering, reverb send and stereo position per layer. Merged under the
   * era's, because production is mostly an era decision — but a genre-wide
   * statement belongs here: ambient wants a dry bass and a drenched pad
   * whichever decade it is pretending to be from.
   */
  effects?: Partial<Record<LayerId, Effects>>;

  /**
   * The same, one drum voice at a time. Merged under the era's and the style's,
   * and merged *over* whatever `effects.drums` said.
   *
   * `DrumTrack.voiceEffects` has existed since the split that gave the kit
   * per-voice gains, and until now nothing in `generate/` populated it — the
   * renderer read a field no table could write. So a genre wanting gated reverb
   * on the snare and nothing else could only say `effects.drums`, which is the
   * whole kit, and `DrumTrack.voiceEffects`' own doc calls the result what it
   * is: a two-second tail on the hi-hats, a mess rather than a period. Rock's
   * `eras.ts` and its `arena` style both carry a paragraph saying exactly that,
   * and this is the door those paragraphs were waiting on.
   *
   * A genre-wide statement is the *rarest* of the three homes and is here for
   * completeness rather than because it is expected: which voice gets treated
   * how is nearly always a date. See `EraProfile.voiceEffects`, which argues
   * why the era owns this.
   */
  voiceEffects?: Partial<Record<DrumVoice, Effects>>;

  /**
   * What the right hand does, weighted, per layer — for the whole genre.
   *
   * `Style.techniques` under `Style.instruments`, and this is that pair's genre
   * half, resolved the way `effects` is: **genre first, style over it**, with the
   * instrument's own list the floor under both.
   *
   * The genre is the right home for this and the style is usually not, which is
   * the opposite of where `instruments` sits, and the asymmetry is real. Which
   * *object* a band owns is a decade and an arrangement — a fact about one
   * number. How the object is *played* is nearly always a fact about the whole
   * idiom: every funk guitarist chanks, in every one of that genre's twenty-two
   * styles, and saying so twenty-two times would be twenty-two chances to
   * disagree about what funk guitar is. `funk`/`slap` remains the counter-example
   * in both directions — it names its bass instruments *and* its bass technique,
   * because that one style genuinely is the hand.
   *
   * Absent means the instrument's own weights stand, which is what nineteen
   * genres said when this landed and what most of them still say.
   */
  techniques?: Partial<Record<PlayedLayer, (readonly [Technique, number])[]>>;

  /**
   * Corrections to a technique's profile, genre-wide. See `Style.techniqueProfiles`.
   *
   * The field the shared `strum` entry was designed to need: one strumming hand
   * serves the whole catalogue, so its stroke grid is set at eighths, which is a
   * country back-beat and a folk waltz and is not a funk chank. A genre that runs
   * the faster hand says so once, here.
   */
  techniqueProfiles?: Partial<Record<Technique, Partial<TechniqueProfile>>>;

  /**
   * How this genre's filter moves, and which layers move most.
   *
   * Absent means it does not move at all — three of the four genres here are
   * built out of instruments that were played rather than swept, and a static
   * cutoff is the truth about them. The fourth is built out of the sweep.
   *
   * `kind` and `place` are the same two ideas `generate/dynamics.ts` already
   * uses for level: what kind of section this is, and where it falls in the
   * form. They are separate from the dynamics tables because loudness and
   * brightness are not the same gesture — an intro can be quiet and open, and a
   * closed filter on a loud chorus is a different thing entirely from a quiet
   * one.
   */
  filter?: {
    /** Base openness per section kind, 0..1. */
    kind: Partial<Record<SectionKind, number>>;
    /** How far each layer swings between its darkest and its brightest. */
    response: Partial<Record<LayerId, number>>;
    /** How much brighter the last statement is than the first, 0..1. */
    build?: number;
  };

  /**
   * How this genre's texture is stacked and how it breathes.
   *
   * Both halves used to be global constants describing a dance band — the
   * arranger stratified bass, comp, pad, melody upward and reserved the top for
   * the tune, and the dynamics table gave every genre the same per-layer
   * response. Correct for a band with a singer in front of it, and exactly
   * backwards for music where the pad is the piece: ambient could say the pad
   * was loudest, but not that it belonged *above* the comp in the register plan,
   * because the plan was not a genre's to state.
   */
  layerPlan?: {
    /**
     * Semitones each accompaniment layer sits above (+) or below (−) the shared
     * ceiling the arranger puts under the tune. Merged over the default, which
     * drops the pad a minor third and leaves everything else level.
     *
     * The pad's −3 was hardcoded, and the comment explaining it is the argument
     * for this field existing: given the same ceiling, the pad and the comp
     * produce the *identical voicing*, and two layers playing the same notes are
     * one layer at twice the volume. That is a real problem and −3 is a real
     * solution, but it is a dance band's solution. Ambient wants the pad *above*
     * the comp, because there the pad is the piece and the comp is the
     * decoration on it — a statement it could previously make about level and
     * not about register.
     */
    offsets?: Partial<Record<LayerId, number>>;
    /**
     * How far each layer swings between the quietest section and the loudest.
     * Merged over the default response; omitted layers keep it.
     */
    response?: Partial<Record<LayerId, number>>;
  };

  /**
   * How far the chordal player departs from the figure in front of them.
   *
   * A genre's statement rather than a style's, because it is a fact about the
   * *instrument's job* in this music and not about any one rhythm. Every jazz
   * style comps: a ballad comper is sparser than a bebop comper and both of them
   * leave holes, anticipate the barline and refuse to play the same bar twice.
   * Every iskelmä style does the opposite, and that is equally uniform — a
   * tanssilava band's chords are how the floor knows where beat one is, and a
   * guitarist who started varying them would be making the dance harder.
   *
   * Absent means the figure is played as written, which is what it was
   * everywhere before this existed. See `CompingProfile` for what the numbers
   * do and for what they measured before they were there.
   */
  comping?: CompingProfile;

  /** Length in seconds a track of this genre should aim for. */
  duration: [number, number];

  /**
   * What this genre looks like when somebody plays it in front of people.
   *
   * The room, the clothes, the programme copy and how much a body moves — see
   * `Staging` below for the whole argument, including why it is optional and
   * why it must stay optional. Nothing in `generate/` or `render/` reads it: a
   * genre with no `staging` sounds exactly the same and only *stages* worse.
   */
  staging?: Staging;
}

// ---------------------------------------------------------------------------
// What a genre stages
// ---------------------------------------------------------------------------

/**
 * The staging contract: a genre's own room, wardrobe, programme and body.
 *
 * `src/concert/` remains a *renderer* of the IR and nothing below changes that.
 * There is no geometry here, nothing that decides where a player stands or what
 * a light does at bar 33 — only the dressing, which is the half of the picture
 * that was already genre-shaped. `venue.ts` states the rule this expresses and
 * it is unchanged: **genre dresses the room, era shifts the palette and the
 * fixtures.**
 *
 * ## Why the tables moved this way round, having been right where they were
 *
 * They lived in `concert/`, four of them, each a `Record<string, …>` keyed by
 * genre id with a silent fallback. With four genres that was the better shape
 * and it is worth saying so rather than pretending otherwise: three rooms and
 * eight wardrobes read side by side are *comparable*, and comparison is the only
 * way to tell whether two decades of the same room are actually different. Every
 * per-entry comment in the migrated tables was written under that reading and
 * most of them argue against a neighbour that is now in another folder. That is
 * the real cost of this change and it is not recovered by anything; the only
 * mitigation is the instruction at the top of `iskelma/staging.ts` to go and
 * read the other genres' before writing a new one.
 *
 * With sixteen genres it inverts. A table that every author has to edit is not a
 * table, it is a registry — and a registry inside the renderer means adding a
 * genre touches four files that belong to nobody, which is four merge conflicts
 * per genre and no way to write one in a folder of its own.
 *
 * The proof that this had already gone wrong is `synth`, the most recent genre:
 * it appeared in *none* of the four tables. It staged in the generic house, in
 * the plain concert dress whose own comment says it is dull on purpose, under a
 * programme line reading "a new one, and nobody has decided about it yet". Every
 * one of those fallbacks worked exactly as designed, and the result was a genre
 * nobody had finished.
 *
 * ## Every field is optional, and that is load-bearing
 *
 * A genre that declares nothing stages in `HOUSE`, wears `PLAIN` and gets
 * `HOUSE_BLURB`, exactly as before. That is not a leftover: an unknown genre is
 * *supposed* to stage badly and obviously, because a fallback that looked good
 * would be a reason never to write the real thing. The fallbacks stay in
 * `concert/` — they are the renderer's floor, not any genre's opinion — and the
 * fields below are individually optional too, so a genre may declare a room and
 * leave its wardrobe to the house.
 */
export interface Staging {
  /**
   * The room this music happens in, dressed per era.
   *
   * Absent means the plain proscenium house. Fourteen rooms exist today and the
   * sentence that used to be here — that a new room is new *dressing* and not a
   * new model, because `web/concert/stage.ts` builds the architecture from the
   * props rather than from `id` — was true, was the reason the tables moved
   * here, and stopped being enough at about room five. Dressing cannot say
   * whether there is a roof. See `StageRoom.architecture`, which is where a room
   * that is a genuinely different building says so.
   */
  room?: StageRoom;

  /**
   * What the band wears, keyed by *era id* — this genre's own eras, not
   * `genre:era` pairs. The registry that used to hold these was keyed the second
   * way for the obvious reason, and the key is half the reason it was a registry.
   */
  wardrobe?: Record<string, Wardrobe>;

  /**
   * The era to dress in when handed one this genre has no wardrobe for.
   *
   * Better than dropping straight to the house's plain dress: a band in an
   * unknown era should still be *this genre's* band. Name the era the genre is
   * most itself in.
   */
  defaultEra?: string;

  /** Programme copy, one table per genre. See `Blurb`. */
  blurbs?: Blurb[];

  /**
   * How much body this music has, as a multiplier on the groove score, 0..1.
   *
   * Staging rather than mixing, and the same axis the wardrobe dresses: a
   * tanssilava band is playing for a full dance floor (1.0), a jazz quintet for
   * people at tables (0.85), and half an ambient act is behind a table not
   * making eye contact (0.4). Applied as a multiplier so the *shape* of the
   * energy curve survives — a quiet genre's chorus is still bigger than its
   * intro. Absent takes the house default, which is a shade under a dance band.
   */
  body?: number;
}

/**
 * What an era does to a room.
 *
 * One of these per era the genre has, plus a fallback. Everything an era touches
 * is in one object so that two decades of the same room can be read side by
 * side, which is the only way to tell whether they are actually different.
 */
export interface StageDressing {
  palette: Venue['palette'];
  /** Always present. */
  props: PropName[];
  /** Present with the given probability. Where the room stops being a diagram. */
  maybe?: (readonly [PropName, number])[];
  fog: number;
  /** Added to the room's base size, in metres. Later eras built bigger stages. */
  grow?: readonly [number, number];
}

export interface StageRoom {
  /**
   * The room, not the room-and-era. The stage builder gets one model per
   * building and everything a decade changes arrives through the dressing.
   * `web/concert/` also uses it as an RNG tag, so it must be stable.
   */
  id: string;
  /**
   * What kind of building this room is. **Absent means a proscenium theatre.**
   *
   * The field that stopped fourteen rooms being one room in fourteen paint jobs.
   * Until it existed, everything a room could say was two dimensions, five
   * colours, a fog number and a list of props — so a concert hall, a walled
   * courtyard, a threshing barn, an arena and a dancehall came out
   * architecturally identical, and correctly so, because architecture was not
   * something the type could express. Ten authors wrote data because data was
   * all there was.
   *
   * ## What you get for free, and what naming one costs
   *
   * Leave it out and the room is a proscenium house: an arch, house tabs, a fly
   * tower, three walls, a boarded house floor. Four of the props change how that
   * is built rather than what stands in it — `black-box` blacks every surface
   * and drops the ornament, `brick` bonds the walls and the backdrop, `open-air`
   * takes the walls away and puts a sky behind, `low-ceiling` fits two lids and
   * lowers the boards to a kerb. Between them those cover a very great deal, and
   * a room that is honestly a theatre with different paint should keep taking
   * them: the fallback is not a booby prize, it is thirteen of the fourteen rooms
   * and it is why a genre added in a hurry still stages.
   *
   * Name one when the *building* is different — when there is no arch, or no
   * roof, or the roof is the whole point, or the house is not a rectangle of
   * seats facing a hole in a wall. Then:
   *
   *  1. add the name to `RoomStyle` in `concert/types.ts`;
   *  2. write `web/concert/rooms/<name>.ts` — read `rooms/types.ts` in full
   *     first, in particular the shadow policy and the RNG tag namespace, and
   *     read `rooms/courtyard.ts`, which is a worked example of a room that
   *     shares almost nothing with a proscenium;
   *  3. register it in `web/concert/rooms/index.ts`, which is one line;
   *  4. name it here.
   *
   * The compiler enforces 1 against 3 — the registry is a total record, so a
   * style with no builder fails `npm run typecheck` — and 4 against 1, because
   * this field is the union rather than a string. Nobody else's file is touched
   * by any of it, which is the entire point of the seam: fourteen rooms are
   * fourteen files and one line each.
   *
   * ## It is not the room id, and the difference will matter
   *
   * `id` is which room this is; this is which *kind* of building it is one of.
   * Two rooms may name the same architecture and should — a `ballroom`, a
   * `dancehall` and a `salon` are one big room with a floor in it, dressed three
   * ways, and the alternative is one of them importing another's builder. It is
   * `Archetype` against `InstrumentId`, exactly: twenty-two models for sixty
   * catalogue instruments, because a tenor and a baritone saxophone are one
   * object at two sizes.
   */
  architecture?: RoomStyle;
  /** Names the room can have. The label is where the era shows in words. */
  names: string[];
  width: number;
  depth: number;
  audience: Venue['audience'];
  /**
   * Set dressing that belongs to the *genre* rather than to any era of it, and
   * is therefore not worth repeating in every dressing below. Emitted after the
   * era's own props and before its optional ones.
   */
  props?: PropName[];
  eras: Record<string, StageDressing>;
  fallback: StageDressing;
}

/**
 * A genre-and-era's clothes.
 *
 * The hard part is the rule: recognisable at a glance, and not a costume party.
 * Two devices do most of that work.
 *
 * **A band dresses alike.** `uniform` is the chance a given player wears the
 * band's jacket and trousers rather than their own. High for a dance band and a
 * swing group, because they genuinely wore matching suits; near zero for
 * ambient, where the absence of a uniform *is* the uniform.
 *
 * **One person is allowed to be loud.** `spotlight` is the chance the lead gets
 * the sequinned jacket. Everybody in sequins is a pantomime; one person in
 * sequins in front of five in cream is a Finnish dance band.
 */
export interface Wardrobe {
  jackets: string[];
  shirts: string[];
  trousers: string[];
  /** The one loud colour: a tie, a scarf, a lining, sequins. */
  accents: string[];
  /** Worn by the lead when they get the spotlight jacket. */
  loud: string[];
  hair: string[];
  hairStyles: (readonly [HairStyle, number])[];
  /** Probability each accessory appears, before the era's density scales it. */
  accessories: (readonly [Accessory, number])[];
  /**
   * What the band's clothes are made of, weighted.
   *
   * `sequin` never appears here and that is the point: it is reachable only
   * through `loudFabric`, and only by the one person fronting the number. A
   * band in sequins is a pantomime; one person in sequins in front of five in
   * wool is a Finnish dance band.
   */
  fabrics: (readonly [Fabric, number])[];
  /**
   * What shape the clothes are cut into, weighted. Optional — see below.
   *
   * The other three weighted tables here say what is on a player's head and what
   * their cloth does to light. This one says what the cloth *is*: a thobe, a
   * tailcoat, a sherwani, a folk waistcoat, a stage dress. `Garment` in
   * `concert/types.ts` argues the eight at length, and the short version is the
   * complaint that produced them — for fourteen genres and fifty-two eras every
   * player on every stage was one silhouette in a different colour, and a genre
   * whose clothes are a robe cannot be dressed by choosing a nicer dye.
   *
   * **Absent means `suit`, and absent costs nothing.** `makeLook` skips the draw
   * entirely when this is missing, so a genre that has not been dressed yet is
   * not merely *similar* to what it was, it is bit-for-bit what it was: the same
   * random stream, the same colours, the same geometry. That is deliberate and it
   * is what makes this safe to roll out one genre at a time. Adding a table here
   * is the only thing that changes a picture, and it changes exactly one genre's.
   *
   * Weights, not probabilities, exactly as `hairStyles` and `fabrics` are, and
   * they are read the same way: a band is a *draw* from this table and not a
   * uniform, so a table of `[['tails', 9], ['suit', 1]]` is an orchestra in
   * evening dress with one player who did not get the memo, and
   * `[['suit', 5], ['robe', 4]]` is a takht where about half the row is in a
   * dark suit and the rest are not. There is deliberately no way to say "the
   * lead wears the good coat" — `loudFabric` and `spotlight` already carry the
   * one-person-is-allowed-to-be-loud device, and giving the garment its own
   * version of it would be a second mechanism doing the first one's job. If a
   * genre needs the front person in a different *shape*, it weights the shape
   * and accepts that two people get it.
   */
  garments?: (readonly [Garment, number])[];
  /** What the lead's loud jacket is made of, when they get one. */
  loudFabric: Fabric;
  /** …and how often that loud jacket is actually the sequinned one. */
  sequinChance: number;
  /** Chance trousers match the jacket rather than being drawn separately. */
  matched: number;
  uniform: number;
  spotlight: number;
}

/** Where in the set a line belongs. Absent means anywhere. */
export type BlurbSlot = 'open' | 'close';

/**
 * One line of programme copy.
 *
 * A bill that dumps `SongMeta` has told the audience nothing they wanted to
 * know; what a programme prints is a promise. So these are written rather than
 * computed, every line is short and lowercase, and no line explains the music —
 * it either sets an expectation or makes a small joke at the band's expense.
 * See `concert/showbill.ts`, which draws from them and states the whole
 * argument, and read the neighbouring genres before writing a table: the
 * register is affectionate and dry rather than a critic's, and it is a house
 * voice rather than each genre's own.
 */
export interface Blurb {
  text: string;
  /** Style ids this line is about. */
  styles?: string[];
  /** Mood ids this line is about. */
  moods?: string[];
  slot?: BlurbSlot;
}
