/**
 * Public API.
 *
 * Import from here rather than reaching into subfolders — this is the surface
 * that stays stable. Note that nothing exported here depends on Strudel; the
 * Strudel renderer is a separate optional import (`render/strudel.js`) so that
 * a consumer who cannot take the AGPL dependency never pulls it in.
 */

export { generateSong, type GenerateOptions } from './generate/song.js';
export { renderMidi } from './render/midi.js';

export type {
  Song, SongMeta, Section, SectionKind, Track, DrumTrack,
  NoteEvent, DrumEvent, DrumVoice, LayerId,
} from './core/types.js';
export { LAYER_ORDER, songDurationBeats, songDurationSeconds } from './core/types.js';
/**
 * The tempo, for a consumer that has to schedule the IR itself.
 *
 * A native engine reading a `Song` has always been able to divide by `meta.bpm`,
 * and that stopped being sufficient the moment a piece could change speed. These
 * are the conversion every clock in this project goes through — `songTempo`
 * fills in the one-entry map for the songs that hold a tempo, so a consumer
 * writes one code path rather than a branch it can get wrong on the rare song.
 * `songDurationSeconds` above is the worked example, in nine lines of
 * `core/types.ts`.
 */
export { songTempo, tempoLabel } from './core/types.js';
export {
  beatsAt, secondsAt, tempoAt, tempoRange, type TempoMap, type TempoPoint,
} from './core/grid.js';

export { GENRES, GENRE_IDS, getGenre, type Genre } from './genre/index.js';
export type { Style, EraProfile, Mood } from './style/types.js';
export {
  STRICTNESS_LEVELS, STRICTNESS_IDS, getStrictness, RULES,
  type StrictnessId, type StrictnessLevel, type Rule,
} from './core/rules.js';
export { INSTRUMENTS, type Instrument } from './style/instruments.js';

export { Rng } from './core/rng.js';
export { keyLabel, midiToNoteName } from './core/pitch.js';
