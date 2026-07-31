/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * `?debug` — a label over each player's head saying what they are playing.
 *
 * A diagnostic, not part of the show: it exists because "is the cellist on the
 * cello soundfont" is a question about the *Song IR*, asked while watching the
 * stage, and the only honest way to answer it is to read the track the player
 * was cast from and print it where that player is standing.
 *
 * Two decisions here are worth the words:
 *
 * **The text is screen-sized, not world-sized.** `sizeAttenuation: false` makes
 * a sprite's scale a fraction of the viewport rather than metres, so a label
 * stays the same size whatever the camera is doing. A world-sized one is
 * unreadable the moment the director takes a wide shot, which is most of the
 * evening.
 *
 * **The canvas is only redrawn when the text changes.** `set` is called sixty
 * times a second and the text changes a handful of times a bar; re-rasterising
 * and re-uploading a texture per player per frame would make the debug flag the
 * most expensive thing on the stage.
 *
 * A label is also a button: clicking one copies what it says. The picking is
 * `show.ts`'s, because the click arrives there; `text()` and `flash()` are the
 * two halves of it that belong to the label itself.
 */

import { CanvasTexture, LinearFilter, Sprite, SpriteMaterial } from 'three';

/** Rasterisation. Bigger than it needs to be, so the label survives a zoom. */
const FONT_PX = 26;
const LINE_PX = 34;
const PAD_PX = 6;
/**
 * The height of one line, in the units an unattenuated sprite scales in.
 *
 * Those units are view-space metres at unit depth, so what lands on screen is
 * `scale * (1 / tan(fov / 2)) / 2` of the viewport's height — at the stage's
 * 42° that is about 1.3 × this number, so a line is about 1.3% of the picture:
 * around 12 px in a 900 px window. Deliberately at the small end of legible,
 * because there is one of these per player and six of them at a readable
 * *reading* size is a wall of text with a band somewhere behind it.
 */
const LINE_SCREEN = 0.010;

const FONT = `${FONT_PX}px ui-monospace, SFMono-Regular, Menlo, monospace`;

/** How long a copied label stays lit. Long enough to see, short enough to ignore. */
const COPIED_MS = 700;

export interface DebugTag {
  readonly root: Sprite;
  /**
   * Set the label's lines. Idempotent: text that has not changed does not
   * touch the canvas or the texture.
   */
  set(lines: readonly string[]): void;
  /**
   * What this label says, as text worth pasting somewhere.
   *
   * Without the marker in column one: `>` and `·` are a lamp saying whether the
   * part is sounding *this frame*, and a lamp is not something anybody wants in
   * their clipboard.
   */
  text(): string;
  /**
   * Acknowledge a copy — the label lights for a moment and goes back. Purely
   * so a click has an answer; nothing else reads it.
   */
  flash(): void;
  /**
   * Whether the label may be drawn at all. The caller owns this because only
   * the caller knows where the camera is — see the note in `show.ts` about a
   * screen-sized sprite behind the lens.
   */
  setVisible(visible: boolean): void;
  dispose(): void;
}

/**
 * A label, ready to be parented to a rig and given text.
 *
 * The sprite's own origin is the *bottom* of the label — `center.y = 0` — so
 * the caller positions it at the top of the head and the text grows upward from
 * there rather than through the face.
 */
export function buildDebugTag(): DebugTag {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const texture = new CanvasTexture(canvas);
  // The canvas is whatever width the text is, which is not a power of two.
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  const material = new SpriteMaterial({
    map: texture,
    transparent: true,
    // A tag that is behind the drum kit is a tag that cannot be read, and the
    // point of it is to be read.
    depthTest: false,
    depthWrite: false,
    sizeAttenuation: false,
  });
  const root = new Sprite(material);
  root.center.set(0.5, 0);
  root.renderOrder = 10_000;
  root.visible = false;

  let shown = '';
  let lines: readonly string[] = [];
  /** Text and camera decide visibility together; neither may overwrite the other. */
  let wanted = true;
  /** Lit for a moment after a click has copied this label. */
  let copied = false;
  let copiedTimer: ReturnType<typeof setTimeout> | undefined;
  const apply = (): void => { root.visible = wanted && shown !== ''; };

  function draw(): void {
    if (!ctx || !lines.length) { apply(); return; }

    ctx.font = FONT;
    const width = Math.max(...lines.map((l) => ctx.measureText(l).width));
    canvas.width = Math.ceil(width) + PAD_PX * 2;
    canvas.height = lines.length * LINE_PX + PAD_PX * 2;

    // Sizing the canvas clears it *and* resets the context, so the font has to
    // be set again here rather than once above.
    ctx.font = FONT;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = copied ? 'rgba(224, 162, 74, 0.85)' : 'rgba(11, 9, 8, 0.72)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    lines.forEach((line, i) => {
      // The marker in column one says whether this part is sounding; a line
      // that is sounding is the one worth reading, so it gets the light.
      ctx.fillStyle = copied ? '#0b0908' : line.startsWith('>') ? '#e0a24a' : '#a2938a';
      ctx.fillText(line, PAD_PX, PAD_PX + LINE_PX * i + LINE_PX / 2);
    });

    texture.needsUpdate = true;
    root.scale.y = LINE_SCREEN * (canvas.height / LINE_PX);
    root.scale.x = root.scale.y * (canvas.width / canvas.height);
    apply();
  }

  function set(next: readonly string[]): void {
    // No 2D context is no label. It stays empty, every call is a no-op, and
    // the stage is otherwise untouched — this is a diagnostic, not a feature
    // worth degrading the show over.
    const key = ctx ? next.join('\n') : '';
    if (key === shown) return;
    shown = key;
    lines = next;
    draw();
  }

  return {
    root,
    set,
    text: () => lines.map((l) => l.replace(/^[>·x] /, '')).join('\n'),

    flash() {
      copied = true;
      draw();
      clearTimeout(copiedTimer);
      copiedTimer = setTimeout(() => { copied = false; draw(); }, COPIED_MS);
    },

    setVisible(visible) { wanted = visible; apply(); },
    dispose() {
      clearTimeout(copiedTimer);
      texture.dispose();
      material.dispose();
      root.removeFromParent();
    },
  };
}
