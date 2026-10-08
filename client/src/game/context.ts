/** Gemeinsamer Zustand aller Renderer-Ebenen (nur Darstellung, nie Spielwissen). Gehoert dem Renderer, die Ebenen lesen ihn. */
import type { StageData, UnitDef } from '../sim';

/** Vorgabe-Raster (Welten 1-3); jede Welt-Datei darf ein anderes Raster haben, dann gilt `RenderContext.cols/rows` (aus `stage.zones`). */
export const WORLD_W = 17;
export const WORLD_H = 11;

export class RenderContext {
  /** Tile-Groesse in Pixeln, folgt dem Fenster. */
  tile = 48;
  /** Zaehlt hoch, wenn sich die Tile-Groesse aendert: Ansichten mit altem Stand werden neu gebaut. */
  version = 0;
  /** Quellraster der Pixel-Grafik (Kachel = 32 px). */
  static readonly ART = 32;
  stage: StageData | null = null;
  defs: Record<string, UnitDef> = {};

  /** Kartenbreite in Kacheln (aus der Zonenmaske der Stage). */
  get cols(): number {
    return this.stage?.zones.rows[0]?.length ?? WORLD_W;
  }

  /** Karten-Hoehe in Kacheln. */
  get rows(): number {
    return this.stage?.zones.rows.length ?? WORLD_H;
  }

  /** Ganzzahliger Skalierfaktor fuer Figuren (nearest, nie Bruchteile): 1 bis ~2 Kacheln, nie kleiner als 1. */
  get art(): number {
    return Math.max(1, Math.floor(this.tile / RenderContext.ART));
  }

  /** Mitte eines Weltpunkts (Tiles) in Canvas-Pixeln. */
  px(tx: number, ty: number): { x: number; y: number } {
    return { x: (tx + 0.5) * this.tile, y: (ty + 0.5) * this.tile };
  }
}
