/**
 * Pixi-Renderer: nur Setup, Ebenen-Reihenfolge und Frame-Schleife. Kein Spielwissen, nur Darstellung.
 * Welt: 17 x 11 Tiles (Pfad und Karte liegen in Tile-Koordinaten, Units in Milli-Tiles, +0,5 Rand). Tile-Groesse folgt dem Platz (ganzzahlig).
 * Die Zeichnung selbst liegt in den Ebenen: `map-layer`, `entities-layer` (+ `sprites`), `overlay-layer`, `fx`.
 */
import { Application } from 'pixi.js';
import type { StageData, UnitDef } from '../sim';
import { RenderContext, WORLD_H, WORLD_W } from './context';
import { EntitiesLayer } from './entities-layer';
import type { GameBus } from './events';
import { Fx } from './fx';
import { MapLayer } from './map-layer';
import { C } from './palette';
import { OverlayLayer } from './overlay-layer';
import type { Session } from './session';

export { WORLD_H, WORLD_W };
const MIN_TILE = 24;
const MAX_TILE = 72;

export class Renderer {
  readonly app = new Application();
  readonly ctx = new RenderContext();
  readonly map: MapLayer;
  readonly entities: EntitiesLayer;
  readonly overlay: OverlayLayer;
  readonly fx: Fx;

  constructor(bus: GameBus) {
    this.map = new MapLayer(this.ctx);
    this.entities = new EntitiesLayer(this.ctx);
    this.overlay = new OverlayLayer(this.ctx, this.entities);
    this.fx = new Fx(this.ctx, this.entities, bus);
  }

  get tile(): number {
    return this.ctx.tile;
  }

  async init(host: HTMLElement): Promise<void> {
    await this.app.init({
      width: WORLD_W * this.ctx.tile,
      height: WORLD_H * this.ctx.tile,
      background: C.grass,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    this.app.canvas.classList.add('board');
    host.appendChild(this.app.canvas);
    // Reihenfolge von unten nach oben
    this.app.stage.addChild(this.map.container, this.overlay.below, this.entities.unitLayer, this.entities.enemyLayer, this.overlay.above, this.fx.container, this.fx.flash);
  }

  /** Neue Runde: Karte und Katalog setzen, alle Ansichten verwerfen. */
  setup(stage: StageData, catalog: UnitDef[]): void {
    this.ctx.stage = stage;
    this.ctx.defs = Object.fromEntries(catalog.map((d) => [d.id, d]));
    this.entities.reset();
    this.overlay.reset();
    this.fx.reset();
    this.map.draw();
  }

  /** Passt die Tile-Groesse an den verfuegbaren Platz an (ganzzahlig). Gibt die Tile-Groesse zurueck. */
  fit(availW: number, availH: number): number {
    const tile = Math.max(MIN_TILE, Math.min(MAX_TILE, Math.floor(Math.min(availW / WORLD_W, availH / WORLD_H))));
    if (tile !== this.ctx.tile) {
      this.ctx.tile = tile;
      this.ctx.version++;
      this.app.renderer.resize(WORLD_W * tile, WORLD_H * tile);
      this.map.draw();
    }
    return this.ctx.tile;
  }

  /** Mitte eines Weltpunkts (Tiles) in Canvas-Pixeln. */
  px(tx: number, ty: number): { x: number; y: number } {
    return this.ctx.px(tx, ty);
  }

  /** Ein Frame. Ereignisse kommen ueber den `GameBus` (siehe `fx.ts`), nicht als Parameter. */
  draw(session: Session, nowMs: number, dtMs: number): void {
    this.overlay.drawBelow(session);
    this.entities.sync(session, nowMs);
    this.overlay.drawAbove(session, nowMs);
    this.fx.update(dtMs);
  }
}
