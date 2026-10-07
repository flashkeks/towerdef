/**
 * Karte: Atlas-Kacheln (Gras, Pfad, Deko, Spawn, Basis) plus Huegel-Flaechen einmal auf eine Zeichenflaeche setzen und als ein Sprite zeigen.
 * Wird bei Rundenstart, Tile-Wechsel und nach dem Laden des Atlas neu gezeichnet. Besitzer: P4 (Grafik).
 * Das Spiel skaliert die Karte mit der Fenster-Kachel (nearest); Figuren skalieren ganzzahlig (`RenderContext.art`).
 */
import { Container, Sprite, Texture } from 'pixi.js';
import { getAtlas, loadAtlas } from './atlas';
import { WORLD_H, WORLD_W, type RenderContext } from './context';
import { ART, buildMapOps, hillRects } from './map-compose';

export class MapLayer {
  readonly container = new Container();
  private sprite: Sprite | null = null;
  private tex: Texture | null = null;
  private texStage: unknown = null;

  constructor(private readonly ctx: RenderContext) {
    // Atlas kommt asynchron: danach Karte setzen und alle Figuren-Ansichten neu bauen lassen (Version hochzaehlen).
    void loadAtlas().then(() => {
      ctx.version++;
      this.draw();
    });
  }

  draw(): void {
    const ctx = this.ctx;
    const atlas = getAtlas();
    if (!ctx.stage || !atlas) return;
    if (!this.tex || this.texStage !== ctx.stage) {
      const canvas = document.createElement('canvas');
      canvas.width = WORLD_W * ART;
      canvas.height = WORLD_H * ART;
      const c2 = canvas.getContext('2d');
      if (!c2) return;
      c2.imageSmoothingEnabled = false;
      const ops = buildMapOps(ctx.stage);
      // Reihenfolge: Gras und Pfad, Huegel-Flaechen, dann Deko/Spawn/Basis obenauf
      const base = ops.filter((o) => /tiles\/(grass|path)_/.test(o.frame));
      const rest = ops.filter((o) => !/tiles\/(grass|path)_/.test(o.frame));
      const put = (list: typeof ops): void => {
        for (const op of list) {
          const r = atlas.rect(op.frame);
          c2.drawImage(atlas.image, r.x, r.y, r.w, r.h, op.x, op.y, r.w, r.h);
        }
      };
      put(base);
      for (const r of hillRects(ctx.stage)) {
        c2.fillStyle = r.color;
        c2.fillRect(r.x, r.y, r.w, r.h);
      }
      put(rest);
      this.tex?.destroy(true);
      this.tex = Texture.from(canvas);
      this.tex.source.scaleMode = 'nearest';
      this.texStage = ctx.stage;
      this.sprite?.destroy();
      this.sprite = new Sprite(this.tex);
      this.container.addChild(this.sprite);
    }
    if (this.sprite) {
      this.sprite.width = WORLD_W * ctx.tile;
      this.sprite.height = WORLD_H * ctx.tile;
    }
  }
}
