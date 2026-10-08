/**
 * Karte (Runde 10 / P4): das Kartenbild der Welt (`board-art.ts`: Boden, Huegel, Pfad, Deko, Licht aus `theme.board`) wird einmal gemalt,
 * als Textur gecacht und als ein einziges Sprite gezeigt; dazu wenige Schwebeteilchen (`board-ambient.ts`). Pro Frame kostet nur die Ambient-Schicht.
 * Neu gemalt wird bei Kartenwechsel und wenn die Aufloesung (Kachel x Pixeldichte) in die naechste Stufe springt.
 * Frueher setzte diese Ebene Atlas-Kacheln zusammen (`map-compose.ts`); die Kacheln `tiles/*` des Atlas werden dafuer nicht mehr gebraucht.
 */
import { Container, Sprite, Texture, Ticker } from 'pixi.js';
import { loadAtlas } from './atlas';
import { Ambient } from './board-ambient';
import { boardPx, paintBoard, resolveBoard } from './board-art';
import { type RenderContext } from './context';

const CACHE_MAX = 4;

export class MapLayer {
  readonly container = new Container();
  private readonly ambient = new Ambient();
  private sprite: Sprite | null = null;
  /** Gemalte Texturen nach Schluessel (Welt + Karte + Aufloesung), aelteste zuerst. */
  private readonly cache = new Map<string, Texture>();

  constructor(private readonly ctx: RenderContext) {
    // Der Atlas wird noch von den Figuren gebraucht; sobald er da ist, werden deren Ansichten neu gebaut.
    void loadAtlas().then(() => {
      ctx.version++;
    });
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) Ticker.shared.add((tk) => this.ambient.update(tk.deltaMS));
  }

  draw(): void {
    const ctx = this.ctx;
    const stage = ctx.stage;
    if (!stage || typeof document === 'undefined') return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = boardPx(ctx.tile, dpr);
    const key = `${stage.theme?.id ?? stage.id}|${stage.zones.rows.join('')}|${stage.path.join(';')}|${px}`;
    let tex = this.cache.get(key);
    if (!tex) {
      tex = Texture.from(paintBoard(stage, px).canvas);
      tex.source.scaleMode = 'linear';
      this.cache.set(key, tex);
    } else {
      // zuletzt benutzt nach hinten
      this.cache.delete(key);
      this.cache.set(key, tex);
    }
    if (!this.sprite) {
      this.sprite = new Sprite(tex);
      this.container.addChildAt(this.sprite, 0);
      this.container.addChild(this.ambient.container);
    } else if (this.sprite.texture !== tex) {
      this.sprite.texture = tex;
    }
    this.sprite.width = ctx.cols * ctx.tile;
    this.sprite.height = ctx.rows * ctx.tile;
    while (this.cache.size > CACHE_MAX) {
      const [oldKey, old] = this.cache.entries().next().value as [string, Texture];
      this.cache.delete(oldKey);
      if (old !== tex) old.destroy(true);
    }
    const light = resolveBoard(stage.theme).light;
    this.ambient.configure(light.ambient, light.glow ?? light.tint, ctx.cols, ctx.rows, ctx.tile);
  }
}
