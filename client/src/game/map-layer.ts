/** Karte: Wiese, Pfad, Start/Ziel, Slots. Wird bei Rundenstart und Tile-Wechsel neu gezeichnet. Besitzer: P4 (Grafik). */
import { Graphics } from 'pixi.js';
import { C } from './palette';
import { WORLD_H, WORLD_W, type RenderContext } from './context';

export class MapLayer {
  readonly container = new Graphics();

  constructor(private readonly ctx: RenderContext) {}

  draw(): void {
    const g = this.container;
    const ctx = this.ctx;
    g.clear();
    const T = ctx.tile;
    if (!ctx.stage) return;
    // Rasterflecken, damit die Wiese nicht flach wirkt
    for (let x = 0; x < WORLD_W; x++) for (let y = 0; y < WORLD_H; y++) if ((x + y) % 2 === 0) g.rect(x * T, y * T, T, T).fill({ color: C.grassLight, alpha: 0.1 });
    const pts = ctx.stage.path.map(([x, y]) => ctx.px(x, y));
    // Pfad: dunkler Rand, helle Mitte
    for (const [w, col] of [[T * 0.98, C.pathEdge], [T * 0.8, C.path]] as const) {
      g.moveTo(pts[0].x, pts[0].y);
      for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
      g.stroke({ width: w, color: col, cap: 'round', join: 'round' });
    }
    // Start und Ziel
    const a = pts[0];
    const b = pts[pts.length - 1];
    g.circle(a.x, a.y, T * 0.3).fill(C.rim);
    g.circle(b.x, b.y, T * 0.4).fill({ color: C.gold, alpha: 0.9 }).stroke({ width: 3, color: C.ink });
    // Slots
    for (const s of ctx.stage.slots) {
      const c = ctx.px(s.x, s.y);
      const size = s.size * T * 0.92;
      const hill = s.kind === 'hill';
      g.roundRect(c.x - size / 2, c.y - size / 2, size, size, 6).fill(hill ? C.hill : C.ground).stroke({ width: 2, color: hill ? C.hillEdge : C.groundEdge });
      if (hill) g.poly([c.x, c.y - size * 0.3, c.x + size * 0.3, c.y + size * 0.2, c.x - size * 0.3, c.y + size * 0.2]).fill({ color: C.hillEdge, alpha: 0.45 });
    }
  }
}
