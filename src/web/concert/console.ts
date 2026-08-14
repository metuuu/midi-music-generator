/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The stage console — a transport under the show and a mixing desk beside it.
 *
 * `?debug` only. Everything here changes what is heard, which is the line the
 * label overlay in `debug-tags.ts` explicitly does not cross, and none of it is
 * reachable from the stage itself.
 *
 * ## Why the concert needs its own, when `/mix` exists
 *
 * The mix lab answers *how loud is this against that* with nothing on screen
 * but faders, and it is the right page for settling a genre's balance. It
 * cannot answer the question this one exists for, which always arrives in the
 * form somebody actually asks it: **why is the violin player so quiet?** That
 * question names a person on a stage, and answering it means holding four
 * numbers together —
 *
 *  - the fader the genre wrote (`Genre.mix`),
 *  - the velocity the layer is written at,
 *  - the measured trim on the font (`SOUNDFONT_LEVEL`),
 *  - and where the part actually sits, which is the one nobody looks at
 *
 * — against *the player you are looking at*. So each strip is labelled with the
 * performer, carries the arithmetic all the way to a decibel figure, and draws
 * that figure as a rail so the answer is visible before it is read.
 *
 * ## Two surfaces, two shapes
 *
 * A timeline is horizontal and belongs across the bottom, where the boards and
 * the front of the house are and where there is least to look at. A stack of
 * faders is vertical and eight to twenty-five rows deep, and as a bottom sheet
 * it would cover the band it is describing. So: transport along the bottom,
 * desk down the right, and the desk is off until it is asked for.
 *
 * ## What it does not do
 *
 * It writes nothing. The trims are a session, and the way one leaves is the
 * paste block at the foot of the desk — the same decision `web/mix-lab.ts`
 * makes and for the same reason: the mix is read by the MIDI renderer too, so a
 * balance that lived only in a browser would ship the old numbers in the `.mid`
 * and nobody would find out why.
 */

import {
  DEFAULT_DRUM_MIX, type DrumVoice, type LayerId, type Section, type Song, type Track,
} from '../../core/types.js';
import type { Performer } from '../../concert/types.js';
import { INSTRUMENTS } from '../../style/instruments.js';
import { resolveVoice } from '../../render/drum-banks.js';
import { levelOfDrum, levelOfSound, REGISTER_LEVEL, SOUNDFONT_LEVEL } from '../../render/source-levels.js';

import type { Show, ShowMix } from './show.js';

export interface StageConsole {
  /** One call per frame, after `show.frame`. Repaints only what moved. */
  frame(): void;
  /** Show or hide the mixing desk. The transport is always up. */
  toggleDesk(): void;
  /**
   * Pick one player out — from a click on their label on the stage, or on
   * their strip on the desk.
   *
   * Three things at once, and they are one gesture because they are one
   * question. The desk opens if it is shut and the strip is lit and scrolled
   * to, which answers *how loud is this*. And the lane under the scrub bar
   * fills in with the bars this layer actually sounds in, which answers *when
   * does it play* — the thing that is invisible on a stage where a player
   * standing still might be resting or might be inaudible.
   *
   * Passing the layer already selected clears the selection.
   */
  select(layer: LayerId | undefined): void;
  /** A key the page did not claim. Returns whether this took it. */
  key(event: KeyboardEvent): boolean;
  dispose(): void;
}

/** How far a jump goes on one arrow press, in bars. One phrase. */
const NUDGE_BARS = 4;

/**
 * Section colours, by what the section is rather than by where it falls.
 *
 * Read straight off the venue's own vocabulary would be prettier and wrong: the
 * scrub bar is a diagram of the form, and two choruses in different keys are
 * the same colour because they are the same thing. The chorus is the one that
 * has to be findable at a glance, so it gets the accent and everything else
 * gets a grey.
 */
const SECTION_INK: Record<Section['kind'], string> = {
  intro: '#4a3f38',
  verse: '#6b5a4c',
  chorus: '#e0a24a',
  bridge: '#79b0c4',
  solo: '#a8724a',
  outro: '#3d352f',
};

export function createConsole(show: Show): StageConsole {
  const root = document.createElement('div');
  root.id = 'console';
  root.innerHTML = SHELL;
  document.body.append(root);

  const $ = <T extends HTMLElement>(sel: string): T => {
    const el = root.querySelector(sel);
    if (!el) throw new Error(`console: missing ${sel}`);
    return el as T;
  };

  const els = {
    bar: $<HTMLDivElement>('.cx-bar'),
    play: $<HTMLButtonElement>('[data-act=play]'),
    prev: $<HTMLButtonElement>('[data-act=prev]'),
    next: $<HTMLButtonElement>('[data-act=next]'),
    deskToggle: $<HTMLButtonElement>('[data-act=desk]'),
    numbers: $<HTMLDivElement>('.cx-numbers'),
    track: $<HTMLDivElement>('.cx-track'),
    form: $<HTMLDivElement>('.cx-form'),
    played: $<HTMLDivElement>('.cx-played'),
    head: $<HTMLDivElement>('.cx-head'),
    ghost: $<HTMLDivElement>('.cx-ghost'),
    tip: $<HTMLDivElement>('.cx-tip'),
    lane: $<HTMLDivElement>('.cx-lane'),
    pick: $<HTMLButtonElement>('.cx-pick'),
    readout: $<HTMLDivElement>('.cx-readout'),
    desk: $<HTMLDivElement>('.cx-desk'),
    title: $<HTMLDivElement>('.cx-desk-title'),
    strips: $<HTMLDivElement>('.cx-strips'),
    kit: $<HTMLDivElement>('.cx-kit'),
    paste: $<HTMLPreElement>('.cx-paste'),
    reset: $<HTMLButtonElement>('[data-act=reset]'),
    copy: $<HTMLButtonElement>('[data-act=copy]'),
    close: $<HTMLButtonElement>('[data-act=close]'),
  };

  // --- Mix state ---------------------------------------------------------
  //
  // Held here and pushed to the show, rather than read back out of it. The show
  // owns *applying* a mix and this owns the ergonomics of building one, which
  // is the same split `mix-lab.ts` has between its `state` and its `mixed()`.

  const mix = {
    layers: new Map<LayerId, number>(),
    voices: new Map<DrumVoice, number>(),
    muted: new Set<string>(),
    solo: new Set<string>(),
  };
  const push = (): void => {
    show.setMix(mix as ShowMix);
    paintPaste();
  };

  const trimOf = (key: string): number =>
    (key.startsWith('d:')
      ? mix.voices.get(key.slice(2) as DrumVoice)
      : mix.layers.get(key.slice(2) as LayerId)) ?? 1;

  const audibleAt = (key: string): boolean =>
    (mix.solo.size > 0 ? mix.solo.has(key) : !mix.muted.has(key));

  // --- The scrub bar -----------------------------------------------------

  /** Bars in the number the bar was last drawn for, so a change of form redraws. */
  let drawnFor: Song | undefined;
  /** Where a drag currently points, in bars, or undefined when not dragging. */
  let scrubbing: number | undefined;
  /** The player picked out, if any. See `select`. */
  let picked: LayerId | undefined;
  /** Each strip's row, so a selection can find and scroll to one. */
  const rows = new Map<string, HTMLElement>();

  function barAt(clientX: number): number {
    const box = els.track.getBoundingClientRect();
    const t = (clientX - box.left) / Math.max(box.width, 1);
    const bars = show.number().song.meta.totalBars;
    // Snapped, because the pattern is bar-indexed and a cut anywhere else would
    // put every following bar off the clock. See `sliceSong`.
    return Math.max(0, Math.min(Math.round(t * bars), bars - 1));
  }

  function sectionAt(bar: number): Section | undefined {
    return show.number().song.sections
      .find((s) => bar >= s.startBar && bar < s.startBar + s.lengthBars);
  }

  els.track.addEventListener('pointerdown', (e) => {
    els.track.setPointerCapture(e.pointerId);
    scrubbing = barAt(e.clientX);
    paintGhost();
  });
  els.track.addEventListener('pointermove', (e) => {
    if (scrubbing === undefined) return;
    scrubbing = barAt(e.clientX);
    paintGhost();
  });
  /**
   * The jump lands on release, not on every pixel of the drag.
   *
   * Each one costs a stop, a render and a start — a few tens of milliseconds of
   * silence — so a drag that jumped continuously would be a stutter rather than
   * a scrub. The ghost is what makes waiting for the release bearable: the
   * position and the section name follow the finger the whole way.
   */
  const release = (e: PointerEvent): void => {
    if (scrubbing === undefined) return;
    const to = scrubbing;
    scrubbing = undefined;
    paintGhost();
    els.track.releasePointerCapture?.(e.pointerId);
    show.jumpToBar(to);
  };
  els.track.addEventListener('pointerup', release);
  els.track.addEventListener('pointercancel', release);

  function paintForm(song: Song): void {
    els.form.replaceChildren();
    const bars = song.meta.totalBars;
    for (const section of song.sections) {
      const seg = document.createElement('span');
      seg.className = 'cx-seg';
      seg.style.left = `${(section.startBar / bars) * 100}%`;
      seg.style.width = `${(section.lengthBars / bars) * 100}%`;
      seg.style.background = SECTION_INK[section.kind];
      seg.title = `${section.kind} · bar ${section.startBar + 1}`;
      els.form.append(seg);
    }
  }

  /**
   * Which bars this layer sounds in.
   *
   * The one fact about a part that the stage cannot show and the desk cannot
   * either: a player standing still is resting, or is playing something
   * inaudible, and from the auditorium those look identical. It is also the
   * thing that makes the scrub bar worth aiming with — *go to where the pad
   * comes in* is the actual gesture, and without this it is a guess.
   *
   * A note counts in every bar it is *sounding* through and not only the one it
   * starts in, which is the whole difference on a pad: eight-beat chords at two
   * bars each would otherwise draw as a dotted line with the holds missing.
   */
  function activityOf(song: Song, layer: LayerId): boolean[] {
    const { beatsPerBar, totalBars } = song.meta;
    const on = new Array<boolean>(totalBars).fill(false);
    const mark = (beat: number, duration = 0): void => {
      const from = Math.floor(beat / beatsPerBar);
      // `- 1e-6` so a note ending exactly on a barline does not light the bar
      // after it, which on a part written in whole bars would be all of them.
      const to = Math.floor((beat + Math.max(duration - 1e-6, 0)) / beatsPerBar);
      for (let b = Math.max(0, from); b <= Math.min(totalBars - 1, to); b++) on[b] = true;
    };
    if (layer === 'drums') for (const e of song.drums.events) mark(e.beat);
    else for (const n of song.tracks.find((t) => t.layer === layer)?.notes ?? []) {
      mark(n.beat, n.duration);
    }
    return on;
  }

  /**
   * The lane, drawn as runs rather than as one mark per bar.
   *
   * A part that plays throughout is one element instead of a hundred and
   * twelve, and — more to the point — it reads as a continuous line, which is
   * what it is. Per-bar marks on a busy layer come out as a dashed rule whose
   * gaps are the gaps between the elements rather than the gaps in the music.
   */
  function paintLane(): void {
    els.lane.replaceChildren();
    if (!picked) return;
    const song = show.number().song;
    const on = activityOf(song, picked);
    for (let i = 0; i < on.length; i++) {
      if (!on[i]) continue;
      let end = i;
      while (end + 1 < on.length && on[end + 1]) end++;
      const run = document.createElement('span');
      run.className = 'cx-run';
      run.style.left = `${(i / on.length) * 100}%`;
      run.style.width = `${((end - i + 1) / on.length) * 100}%`;
      els.lane.append(run);
      i = end;
    }
  }

  function paintPick(): void {
    els.pick.style.display = picked ? '' : 'none';
    if (!picked) return;
    const who = playerOf(picked);
    const track = show.number().song.tracks.find((t) => t.layer === picked);
    els.pick.textContent = [picked, who?.archetype ?? track?.instrument].filter(Boolean).join(' · ');
  }

  function paintGhost(): void {
    if (scrubbing === undefined) {
      els.ghost.style.opacity = '0';
      els.tip.style.opacity = '0';
      return;
    }
    const bars = show.number().song.meta.totalBars;
    const at = (scrubbing / bars) * 100;
    els.ghost.style.opacity = '1';
    els.ghost.style.left = `${at}%`;
    els.tip.style.opacity = '1';
    els.tip.style.left = `${at}%`;
    const kind = sectionAt(scrubbing)?.kind;
    els.tip.textContent = `bar ${scrubbing + 1}${kind ? ` · ${kind}` : ''}`;
  }

  // --- Strips ------------------------------------------------------------

  /**
   * The catalogue entry behind a track, by the only handle the IR carries.
   *
   * `Track.instrument` is the human name — `"string ensemble"` — and what a
   * paste has to name is the key, `strings1`. All the entries have distinct
   * names, so the direction is unambiguous. The entry is also where `centre`
   * lives, which is the pitch its trim was measured at and therefore half of
   * the warning below.
   */
  const CATALOGUE = new Map(
    Object.entries(INSTRUMENTS).map(([key, entry]) => [entry.name, { key, entry }] as const),
  );

  const median = (xs: number[]): number =>
    (xs.length ? xs.slice().sort((a, b) => a - b)[xs.length >> 1]! : 0);

  const dbOf = (factor: number): string =>
    (factor <= 0 ? '−∞' : `${20 * Math.log10(factor) >= 0 ? '+' : '−'}${Math.abs(20 * Math.log10(factor)).toFixed(1)}`);

  /**
   * What a track will actually be heard at, as one number.
   *
   * The product of everything between a part and the ear that this project can
   * see: the fader the genre wrote, the level the layer is written at, and the
   * measured trim on the font at the pitch this part sits at. It is the figure
   * that has to be computed by hand — or by a throwaway script — every time
   * somebody asks why one player is inaudible, and it is the whole reason this
   * panel is not just the mix lab in a drawer.
   *
   * The **median** note rather than the loudest, for `LAYER_VELOCITY`'s reason
   * in `generate/song.ts`: matching peaks puts a part with a wide dynamic shape
   * 3 dB under a flat one that peaks identically, and it is the median a
   * listener hears as the level of a part.
   */
  function levelOf(track: Track): { level: number; midi: number; velocity: number } {
    const velocity = median(track.notes.map((n) => n.velocity));
    const midi = median(track.notes.map((n) => n.midi));
    return { level: track.gain * velocity * levelOfSound(track.strudelSound, midi), midi, velocity };
  }

  /**
   * What is known about this font's level, and — the new one — whether that
   * knowledge reaches the notes being played.
   *
   * `SOUNDFONT_LEVEL` is one number per font, measured at that instrument's own
   * `centre`, and `REGISTER_LEVEL` covers six fonts out of the catalogue. A part
   * written two octaves below where its trim was taken is a part whose trim is
   * an extrapolation, and nothing anywhere else says so: `gm_violin`, the
   * nearest analogue that *is* measured across its range, swings 4.8 dB over
   * one. That is the difference between a fader recording a judgement and a
   * fader standing in for a measurement nobody took.
   */
  function fontNote(track: Track, midi: number): { text: string; warn: boolean } {
    const base = SOUNDFONT_LEVEL[track.strudelSound];
    if (base === undefined) return { text: 'unmeasured font', warn: true };
    if (REGISTER_LEVEL[track.strudelSound]) return { text: `trim ×${base.toFixed(2)}`, warn: false };
    const centre = CATALOGUE.get(track.instrument)?.entry.centre;
    const off = centre === undefined ? 0 : midi - centre;
    // A fifth. Below that the extrapolation is within the noise of the
    // measurement itself; above it, a soundfont has changed sample zone at
    // least once and there is no longer any reason to think the number holds.
    if (Math.abs(off) < 7) return { text: `trim ×${base.toFixed(2)}`, warn: false };
    return {
      text: `trim ×${base.toFixed(2)} · measured ${Math.abs(off) >= 12
        ? `${(Math.abs(off) / 12).toFixed(1)} octaves`
        : `${Math.abs(off)} semitones`} ${off < 0 ? 'below' : 'above'} this part`,
      warn: true,
    };
  }

  /** Who is playing this layer, for a strip that has to name a person. */
  function playerOf(layer: LayerId): Performer | undefined {
    return show.number().cast.performers.find((p) => p.layer === layer);
  }

  /**
   * Where a melodic strip's change is meant to land, per layer.
   *
   * The fader sounds the same either way — it is a trim on the track, and the
   * track is what you hear — so this changes nothing but the paste and how far
   * the fader can travel. It exists because the two destinations are different
   * claims and the panel cannot tell which one you made: pulling the comp down
   * because *this song's organ* was hot is a statement about organs, and
   * writing it to `mix.comp` moves the piano and the guitar the next time the
   * genre deals one.
   *
   * Defaults to the instrument, and that default is the whole reason this
   * control came back after being left out. What gets said at this panel is
   * "the percussive organ is not loud enough", which names an object; a desk
   * that could only answer in `Genre.mix` was answering a question nobody had
   * asked, and — because `Genre.mix` is documented 0..1 and the comp already
   * sits at 0.9 — could not answer it at all past +0.9 dB.
   */
  const aim = new Map<LayerId, 'instrument' | 'layer'>();
  const aimOf = (layer: LayerId): 'instrument' | 'layer' => aim.get(layer) ?? 'instrument';

  /**
   * What the genre's own fader said, with the instrument's trim divided out.
   *
   * `Track.gain` is the product of the two, so a layer-aimed paste has to undo
   * `Instrument.gain` or it would fold one organ's correction into the level of
   * every comp the genre ever writes — the exact confusion the aim exists to
   * end. One entry in the catalogue carries a trim today (the tenor sax, at
   * 0.74) and this is right for the other 125 by returning the gain unchanged.
   */
  function layerGainOf(instrument: string, trackGain: number): number {
    return trackGain / (CATALOGUE.get(instrument)?.entry.gain ?? 1);
  }

  interface StripView { paint(): void }
  const strips: StripView[] = [];

  function strip(opts: {
    key: string;
    /** The level this strip's fader is a trim over. */
    base: number;
    layerName: string;
    instrument: string;
    who: string;
    detail: string;
    warn: boolean;
    /** Melodic strips only: the layer and instrument a paste can be aimed at. */
    aimable?: LayerId;
    /** Computed level in dB, and where it sits against the loudest part. */
    level?: { db: number; rail: number };
  }): HTMLElement {
    const row = document.createElement('div');
    row.className = 'cx-strip';

    const rail = document.createElement('i');
    rail.className = 'cx-rail';
    row.append(rail);

    const top = document.createElement('div');
    top.className = 'cx-line';
    const tag = document.createElement('b');
    tag.className = 'cx-tag';
    tag.textContent = opts.layerName;
    const name = document.createElement('span');
    name.className = 'cx-inst';
    name.textContent = opts.instrument;
    const heard = document.createElement('span');
    heard.className = 'cx-heard';
    heard.textContent = opts.level ? `${opts.level.db.toFixed(1)} dB` : '';
    top.append(tag, name, heard);

    const sub = document.createElement('div');
    sub.className = 'cx-sub';
    if (opts.who) {
      const who = document.createElement('span');
      who.className = 'cx-who';
      who.textContent = opts.who;
      sub.append(who);
    }
    const detail = document.createElement('span');
    detail.className = opts.warn ? 'cx-detail cx-warn' : 'cx-detail';
    detail.textContent = opts.detail;
    sub.append(detail);

    let chip: HTMLButtonElement | undefined;
    if (opts.aimable) {
      // A control rather than a caption: the destination is a claim about what
      // you just heard, and one click changes the paste without the sound.
      chip = document.createElement('button');
      chip.className = 'cx-aim';
      chip.onclick = (e) => {
        e.stopPropagation();
        aim.set(opts.aimable!, aimOf(opts.aimable!) === 'instrument' ? 'layer' : 'instrument');
        for (const s of strips) s.paint();
        paintPaste();
      };
      sub.append(chip);
    }

    const controls = document.createElement('div');
    controls.className = 'cx-controls';
    const mute = document.createElement('button');
    mute.className = 'cx-tog';
    mute.textContent = 'M';
    mute.title = 'mute';
    const solo = document.createElement('button');
    solo.className = 'cx-tog';
    solo.textContent = 'S';
    solo.title = 'solo';
    const fader = document.createElement('input');
    fader.type = 'range';
    fader.min = '0';
    /**
     * A drum voice stops where its table does; an instrument does not.
     *
     * `voiceGains` is documented 0..1 and has no per-instrument twin, so a kit
     * fader that could reach ×2 would let a balance be tuned by ear to a number
     * the table cannot hold. Floored rather than rounded, so the top of the
     * travel is under the ceiling rather than a thousandth over it.
     *
     * A melodic strip is the other case and used to be treated as this one,
     * which was the bug. `Genre.mix` is 0..1, so with the comp already sitting
     * at 0.9 the whole travel above unity was **+0.9 dB** — and "this organ is
     * not loud enough" is not a statement about `Genre.mix` at all. It is what
     * `Instrument.gain` is for, which is a multiplier over whatever the genre
     * says and carries no ceiling. So the travel goes to ×2, and it is the
     * *paste* that refuses to write a layer-aimed value the table cannot hold.
     */
    fader.max = opts.aimable ? '2' : String(Math.floor(100 / Math.max(opts.base, 0.01)) / 100);
    fader.step = '0.01';
    fader.value = String(trimOf(opts.key));
    const read = document.createElement('span');
    read.className = 'cx-read';
    controls.append(mute, solo, fader, read);

    row.append(top, sub, controls);
    rows.set(opts.key, row);
    // The name selects; the controls do not. Clicking a fader is not a request
    // to be shown where the part plays, and a strip that re-selected itself on
    // every nudge would scroll out from under the finger riding it.
    top.onclick = () => {
      if (opts.key.startsWith('l:')) select(opts.key.slice(2) as LayerId);
    };

    const paint = (): void => {
      const trim = trimOf(opts.key);
      mute.classList.toggle('on', mix.muted.has(opts.key));
      solo.classList.toggle('on', mix.solo.has(opts.key));
      row.classList.toggle('silent', !audibleAt(opts.key));
      row.classList.toggle('moved', Math.abs(trim - 1) > 0.005);
      row.classList.toggle('picked', opts.key === `l:${picked}`);
      read.textContent = `${dbOf(trim)}`;
      if (opts.aimable && chip) {
        const toObject = aimOf(opts.aimable) === 'instrument';
        chip.textContent = toObject ? `→ ${opts.instrument}` : `→ ${opts.aimable} · ${genreId()}`;
        chip.title = toObject
          ? 'this instrument, in every genre that deals it — click to aim at the layer'
          : 'this layer in this genre, whatever plays it — click to aim at the instrument';
        chip.classList.toggle('global', toObject);
        // Said while you are still listening rather than at the paste: a
        // layer-aimed value over unity is one `Genre.mix` cannot hold.
        chip.classList.toggle('over', !toObject && opts.base * trim > 1.0005);
      }
      if (opts.level) {
        rail.style.width = `${Math.round(opts.level.rail * 100)}%`;
        // Under 12 dB from the loudest part is a balance; past that a listener
        // stops hearing a quiet part and starts not hearing it at all.
        rail.classList.toggle('cx-rail-low', opts.level.db < -12);
      }
    };

    const change = (): void => { for (const s of strips) s.paint(); push(); };
    mute.onclick = () => { if (!mix.muted.delete(opts.key)) mix.muted.add(opts.key); change(); };
    solo.onclick = () => { if (!mix.solo.delete(opts.key)) mix.solo.add(opts.key); change(); };
    fader.oninput = () => {
      const v = Number(fader.value);
      if (opts.key.startsWith('d:')) mix.voices.set(opts.key.slice(2) as DrumVoice, v);
      else mix.layers.set(opts.key.slice(2) as LayerId, v);
      paint();
      push();
    };
    // The fastest way back to "as written", which is what every judgement here
    // is a judgement against.
    fader.ondblclick = () => { fader.value = '1'; fader.oninput!(new Event('input')); };

    strips.push({ paint });
    paint();
    return row;
  }

  function buildDesk(): void {
    const song = show.number().song;
    strips.length = 0;
    rows.clear();
    els.strips.replaceChildren();
    els.kit.replaceChildren();
    els.title.textContent = `${song.meta.title} · ${song.meta.genreLabel} · ${song.meta.styleLabel}`;

    const levels = song.tracks.map((t) => ({ track: t, ...levelOf(t) }));
    const loudest = Math.max(...levels.map((l) => l.level), 1e-6);

    for (const { track, level, midi } of levels) {
      const font = fontNote(track, midi);
      const who = playerOf(track.layer);
      els.strips.append(strip({
        key: `l:${track.layer}`,
        base: track.gain,
        layerName: track.layer,
        instrument: track.instrument,
        who: who ? `${who.archetype}` : '',
        detail: `gm${track.gmProgram} · ${font.text}`,
        warn: font.warn,
        aimable: track.layer,
        level: { db: 20 * Math.log10(level / loudest), rail: level / loudest },
      }));
    }

    // Only the voices this kit plays, loudest fader first, and named by what
    // will *sound* rather than by what was written — a bank with no ride
    // answers a ride with a crash, and a strip labelled `rd` while a crash comes
    // out is the exact confusion a desk exists to clear up.
    const present = [...new Set(song.drums.events.map((e) => e.voice))]
      .sort((a, b) => (DEFAULT_DRUM_MIX[b] ?? 0) - (DEFAULT_DRUM_MIX[a] ?? 0));
    for (const voice of present) {
      const sound = resolveVoice(song.drums.bank, voice);
      if (!sound) continue;
      const trim = levelOfDrum(song.drums.bank, sound);
      els.kit.append(strip({
        key: `d:${voice}`,
        base: song.drums.voiceGains[voice] ?? 1,
        layerName: voice,
        instrument: sound === voice ? song.drums.bank : `${sound} (for ${voice})`,
        who: '',
        detail: trim === 1 ? 'unmeasured bank' : `trim ×${trim.toFixed(2)}`,
        warn: trim === 1,
      }));
    }
    paintPaste();
  }

  const genreId = (): string => show.number().song.meta.genre;

  /**
   * The session's output: absolute values for the tables, only the rows moved.
   *
   * Two destinations, because they are two claims — see `aim`. The
   * instrument-aimed rows carry the **trim** and not the resulting level:
   * `Instrument.gain` multiplies whatever the genre's fader already said, so
   * writing the level there would fold this genre's balance into a global table
   * and make the organ quiet everywhere a genre happens to be loud.
   */
  function paintPaste(): void {
    const song = show.number().song;
    const lines: string[] = [];
    const moved = song.tracks.filter((t) => Math.abs(trimOf(`l:${t.layer}`) - 1) > 0.005);

    const global = moved.filter((t) => aimOf(t.layer) === 'instrument');
    if (global.length) {
      lines.push('// src/style/instruments.ts — global, every genre that deals this');
      for (const t of global) {
        const trim = trimOf(`l:${t.layer}`);
        const font = fontNote(t, median(t.notes.map((n) => n.midi)));
        if (font.warn) {
          // Said out loud rather than left in the number: a fader standing in
          // for a measurement nobody took will be wrong by whatever the
          // measurement would have said. See `Instrument.gain`.
          lines.push(`// ⚠ ${t.instrument}: ${font.text}.`);
          lines.push('//   That is a measurement this is standing in for. Take it if you can.');
        }
        // `…` rather than the entry's own text, because the panel does not have
        // it: `G` wraps whatever that key is already defined as — often an `E`
        // or an `L` wrap of its own — and printing the key would emit a
        // self-reference that is not legal inside the object literal it goes in.
        const key = CATALOGUE.get(t.instrument)?.key ?? t.instrument;
        lines.push(`${key}: G(…, ${trim.toFixed(2)}),  // ${t.instrument} — wrap its existing entry`);
      }
    }

    const layers = moved.filter((t) => aimOf(t.layer) === 'layer');
    if (layers.length) {
      if (lines.length) lines.push('');
      lines.push(`// src/genre/${genreId()}/index.ts — Genre.mix`);
      lines.push('mix: {');
      for (const t of layers) {
        const level = layerGainOf(t.instrument, t.gain) * trimOf(`l:${t.layer}`);
        if (level > 1.0005) {
          // `Genre.mix` is documented 0..1 and the renderer would take a bigger
          // number happily, which is what makes this worth saying: it would
          // work, and the table would no longer mean what it says it means.
          lines.push(`  // ⚠ ${level.toFixed(2)} is over the 0..1 this table holds.`);
          lines.push(`  //   Aim this one at ${t.instrument} instead.`);
        }
        lines.push(`  ${t.layer}: ${level.toFixed(2)},  // heard on ${t.instrument}`);
      }
      lines.push('},');
    }
    const voices = [...mix.voices].filter(([, v]) => Math.abs(v - 1) > 0.005);
    if (voices.length) {
      if (lines.length) lines.push('');
      lines.push('// Style.voiceGains — merged over DEFAULT_DRUM_MIX');
      lines.push('voiceGains: {');
      for (const [voice, trim] of voices) {
        lines.push(`  ${voice}: ${((song.drums.voiceGains[voice] ?? 1) * trim).toFixed(2)},`);
      }
      lines.push('},');
    }
    els.paste.textContent = lines.length
      ? lines.join('\n')
      : '// nothing moved yet — the mix is as the tables have it';
  }

  // --- Wiring ------------------------------------------------------------

  els.play.onclick = () => {
    const at = show.position();
    if (at) show.setPaused(!at.paused);
  };
  els.prev.onclick = () => show.goToNumber(show.index() - 1);
  els.next.onclick = () => show.goToNumber(show.index() + 1);
  els.deskToggle.onclick = () => toggleDesk();
  els.close.onclick = () => toggleDesk();
  els.pick.onclick = () => select(picked);
  els.reset.onclick = () => {
    mix.layers.clear(); mix.voices.clear(); mix.muted.clear(); mix.solo.clear();
    for (const s of strips) s.paint();
    push();
  };
  els.copy.onclick = () => {
    void navigator.clipboard.writeText(els.paste.textContent ?? '');
    els.copy.textContent = 'copied';
    window.setTimeout(() => { els.copy.textContent = 'Copy'; }, 1200);
  };

  let deskOpen = false;
  function toggleDesk(): void {
    deskOpen = !deskOpen;
    root.classList.toggle('cx-open', deskOpen);
    els.deskToggle.classList.toggle('on', deskOpen);
    if (deskOpen) buildDesk();
  }

  function select(layer: LayerId | undefined): void {
    // Clicking the same player again puts them down, which is the behaviour a
    // toggle has everywhere else and is the only way back out of a selection
    // made from the stage, where there is nothing else to click.
    picked = layer === picked ? undefined : layer;
    paintLane();
    paintPick();
    if (picked && !deskOpen) toggleDesk();
    for (const s of strips) s.paint();
    const row = picked && rows.get(`l:${picked}`);
    // `nearest` rather than `center`: the desk is usually short enough that
    // every strip is already on screen, and `center` would scroll a list that
    // did not need scrolling — which reads as the panel twitching at a click.
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // --- The frame ---------------------------------------------------------

  let lastLabel = '';
  let lastNumber: Song | undefined;

  function frame(): void {
    // The opening programme *is* the page until somebody dismisses it, and a
    // transport under a show that has not started is a control for nothing.
    const onBill = show.state() === 'bill';
    root.style.display = onBill ? 'none' : '';
    if (onBill) return;

    const at = show.position();
    const number = show.number();

    // A change of number redraws the form and, if it is up, the whole desk. The
    // identity of the song is the test rather than the index, because a tomato
    // replaces the song without the index moving.
    if (number.song !== lastNumber) {
      lastNumber = number.song;
      if (number.song !== drawnFor) {
        paintForm(number.song);
        drawnFor = number.song;
      }
      if (deskOpen) buildDesk();
      // The selection is by layer and survives, but where that layer plays is a
      // fact about *this* song and does not — a tomato alone rewrites it.
      paintLane();
      paintPick();
    }

    els.numbers.textContent = `${show.index() + 1} / ${show.concert.numbers.length}`;
    els.play.textContent = at?.paused ? '▶' : '❚❚';
    els.play.disabled = !at;

    if (!at) {
      els.played.style.width = '0%';
      els.head.style.opacity = '0';
      // The state, when there is no position — a curtain, an applause, a bow
      // are all "nothing is sounding" and they are not the same thing to look
      // at. Compared against the label already shown rather than against the
      // empty string, which is what a first frame holds and which therefore
      // never matched.
      if (lastLabel !== show.state()) {
        els.readout.textContent = show.state();
        lastLabel = show.state();
      }
      return;
    }
    els.head.style.opacity = '1';
    const t = Math.min(Math.max(at.bar / Math.max(at.bars, 1), 0), 1);
    els.played.style.width = `${t * 100}%`;
    els.head.style.left = `${t * 100}%`;

    // Text is only written when it changes: this runs at 60 Hz beside a 3D
    // stage, and a `textContent` write that says the same thing still costs a
    // layout. The bar number is the only part that moves often.
    const label = `bar ${Math.floor(at.bar) + 1} / ${at.bars}`
      + (at.fromBar ? ` · cut at ${at.fromBar + 1}` : '');
    if (label !== lastLabel) {
      els.readout.textContent = label;
      lastLabel = label;
    }
  }

  function key(e: KeyboardEvent): boolean {
    const at = show.position();
    switch (e.key) {
      case ' ': if (at) show.setPaused(!at.paused); return true;
      case 'm': case 'M': toggleDesk(); return true;
      case 'ArrowLeft':
        if (at) show.jumpToBar(Math.floor(at.bar) - NUDGE_BARS);
        return true;
      case 'ArrowRight':
        if (at) show.jumpToBar(Math.floor(at.bar) + NUDGE_BARS);
        return true;
      case '[': show.goToNumber(show.index() - 1); return true;
      case ']': show.goToNumber(show.index() + 1); return true;
      // Only when there is one to clear, so the programme keeps Escape the rest
      // of the time — it is the page's, and a console that swallowed it would
      // leave the programme with no way out but the ×.
      case 'Escape': if (!picked) return false; select(picked); return true;
      default: return false;
    }
  }

  paintForm(show.number().song);
  drawnFor = show.number().song;
  paintPick();

  return {
    frame,
    toggleDesk,
    select,
    key,
    dispose() { root.remove(); },
  };
}

/**
 * The markup, in one string.
 *
 * A template rather than fifty `createElement` calls, because the shell never
 * changes — only the strips and the segments do, and those are built properly
 * above. Splitting a fixed skeleton across a hundred lines of DOM calls makes
 * the layout unreadable in exchange for nothing.
 */
const SHELL = `
<div class="cx-bar">
  <div class="cx-group">
    <button class="cx-btn" data-act="prev" title="previous number — [">⏮</button>
    <button class="cx-btn cx-play" data-act="play" title="pause / play — space">❚❚</button>
    <button class="cx-btn" data-act="next" title="next number — ]">⏭</button>
    <div class="cx-numbers">1 / 1</div>
  </div>
  <div class="cx-scrub">
    <div class="cx-tip"></div>
    <div class="cx-track">
      <div class="cx-form"></div>
      <div class="cx-lane"></div>
      <div class="cx-played"></div>
      <div class="cx-ghost"></div>
      <div class="cx-head"></div>
    </div>
  </div>
  <div class="cx-group cx-right">
    <button class="cx-pick" title="clear the selection"></button>
    <div class="cx-readout">—</div>
    <button class="cx-btn cx-wide" data-act="desk" title="mixing desk — m">Mix</button>
  </div>
</div>
<aside class="cx-desk">
  <header class="cx-desk-head">
    <div>
      <h2>Mixing desk</h2>
      <div class="cx-desk-title"></div>
    </div>
    <button class="cx-btn" data-act="close" title="close — m">✕</button>
  </header>
  <p class="cx-note">
    Every fader is a <b>trim over what the genre already says</b>, so the middle is
    “as written”. The decibel figure on the right of each name is what that part is
    actually heard at against the loudest one in the band — fader × velocity ×
    the measured trim on its font. Double-click a fader to put it back.
    The chip under each name is <b>where the number will be written</b>: at the
    instrument, in every genre that deals it, or at this genre’s layer whatever
    happens to be playing it. Only the first can go over unity.
  </p>
  <div class="cx-strips"></div>
  <h3>Kit</h3>
  <div class="cx-kit"></div>
  <div class="cx-paste-wrap">
    <div class="cx-paste-head">
      <h3>Paste this back</h3>
      <div>
        <button class="cx-btn" data-act="reset">Reset</button>
        <button class="cx-btn" data-act="copy">Copy</button>
      </div>
    </div>
    <pre class="cx-paste"></pre>
  </div>
</aside>
`;
