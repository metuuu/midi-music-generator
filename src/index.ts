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

export { STYLES, STYLE_IDS, getStyle } from './style/styles.js';
export { ERAS, ERA_IDS, getEra } from './style/eras.js';
export { MOODS, MOOD_IDS, getMood, type Mood } from './style/moods.js';
export {
  STRICTNESS_LEVELS, STRICTNESS_IDS, getStrictness, RULES,
  type StrictnessId, type StrictnessLevel, type Rule,
} from './generate/constraints.js';
export { INSTRUMENTS, type Instrument } from './style/instruments.js';

export { Rng } from './core/rng.js';
export { keyLabel, midiToNoteName } from './core/pitch.js';
