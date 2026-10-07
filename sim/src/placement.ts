/**
 * Freie Platzierung (Runde 6 / P1). Alles in Festkomma (Milli-Tiles), deterministisch, ohne Float.
 *
 * Eine Unit ist ein Kreis mit Radius `def.radiusMilli` (aus `footprint`, `economy.placement.unitRadiusMilli`). Prüfreihenfolge
 * und Fehlergründe von `checkPlacement`:
 *
 *  1. `out-of-bounds`  der Kreis ragt über den Kartenrand (Raster der Zonenmaske; Berühren des Rands ist erlaubt)
 *  2. `on-path`        Abstand der Mitte zur Pfad-Polylinie < halbe Pfadbreite + Radius + Rand (Berühren erlaubt)
 *  3. `blocked`        der Kreis überlappt eine blockierte Kachel (`#`: Bäume, Felsen, Deko)
 *  4. `wrong-zone`     die Kachel unter der Mitte passt nicht zur Unit (Boden-Unit: `.`, Hügel-Unit: `h`, Hybrid: beides)
 *  5. `overlap`        Abstand zu einer anderen Unit < Summe der Radien (Berühren erlaubt, Teamgrenze: alle Spieler)
 *
 * Die Zone entscheidet die Kachel unter der **Mitte** der Unit (Flächen, keine Punkte); Blockiertes zählt dagegen für den ganzen Kreis.
 */
import { dist2 } from './fixed.js';
import { pathClearance } from './path.js';
import type { Ctx, UnitDef } from './data/compile.js';
import type { StageData } from './data/schema.js';

export type PlaceError = 'out-of-bounds' | 'on-path' | 'blocked' | 'wrong-zone' | 'overlap';
export type ZoneKind = 'ground' | 'hill' | 'blocked' | 'path';

const KIND_OF: Record<string, ZoneKind> = { '.': 'ground', h: 'hill', '#': 'blocked', p: 'path' };

export interface Point {
  x: number;
  y: number;
}

export interface MapDef {
  /** Raster (Kacheln). Kachel (i, j) deckt [i*1000 - 500, i*1000 + 500) x [j*1000 - 500, j*1000 + 500). */
  cols: number;
  rows: number;
  /** Zonen je Kachel, Zeile für Zeile (`j * cols + i`). */
  cells: ZoneKind[];
  /** Kartenrand in Milli-Tiles (inklusive). */
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  /** Halbe Pfadbreite plus Zusatzrand (Milli-Tiles). */
  pathReach: number;
  /** Blockierte Kacheln als Rechtecke (Milli-Tiles). */
  blocked: { x0: number; y0: number; x1: number; y1: number }[];
  /** Cache der statisch gültigen Raster-Positionen je (Platzierungsart, Radius). */
  gridCache: Map<string, Point[]>;
}

/** Abstand der Raster-Kandidaten (halbe Kachel). */
export const GRID_STEP = 500;

export function buildMap(stage: StageData, pathMarginMilli: number): MapDef {
  const rows = stage.zones.rows.length;
  const cols = stage.zones.rows[0].length;
  const cells: ZoneKind[] = [];
  const blocked: MapDef['blocked'] = [];
  stage.zones.rows.forEach((row, j) => {
    for (let i = 0; i < cols; i++) {
      const k = KIND_OF[row[i]];
      cells.push(k);
      if (k === 'blocked') blocked.push({ x0: i * 1000 - 500, y0: j * 1000 - 500, x1: i * 1000 + 500, y1: j * 1000 + 500 });
    }
  });
  return {
    cols,
    rows,
    cells,
    minX: -500,
    minY: -500,
    maxX: cols * 1000 - 500,
    maxY: rows * 1000 - 500,
    pathReach: Math.round((stage.pathWidth * 1000) / 2) + pathMarginMilli,
    blocked,
    gridCache: new Map(),
  };
}

/** Zone der Kachel unter (x, y); `null` außerhalb des Rasters. */
export function zoneAt(map: MapDef, x: number, y: number): ZoneKind | null {
  const i = Math.floor((x - map.minX) / 1000);
  const j = Math.floor((y - map.minY) / 1000);
  if (i < 0 || j < 0 || i >= map.cols || j >= map.rows) return null;
  return map.cells[j * map.cols + i];
}

/** Alle Gründe außer `overlap`: nur Karte, Pfad und Zonen. */
export function checkStatic(ctx: Ctx, def: UnitDef, x: number, y: number): PlaceError | null {
  const map = ctx.map;
  const r = def.radiusMilli;
  if (x - r < map.minX || x + r > map.maxX || y - r < map.minY || y + r > map.maxY) return 'out-of-bounds';
  if (!pathClearance(ctx.path, x, y, map.pathReach + r)) return 'on-path';
  const r2 = r * r;
  for (const b of map.blocked) {
    const dx = x < b.x0 ? b.x0 - x : x > b.x1 ? x - b.x1 : 0;
    const dy = y < b.y0 ? b.y0 - y : y > b.y1 ? y - b.y1 : 0;
    if (dx * dx + dy * dy < r2) return 'blocked';
  }
  const z = zoneAt(map, x, y);
  if (z === null || z === 'path' || z === 'blocked') return 'blocked';
  if (def.placement !== 'hybrid' && def.placement !== z) return 'wrong-zone';
  return null;
}

/** Überlappt ein Kreis (x, y, r) eine der Units? `radiusOf` liefert den Radius je Unit-Typ. */
export function overlapsAny(ctx: Ctx, units: readonly { x: number; y: number; defId: string }[], r: number, x: number, y: number): boolean {
  for (const u of units) {
    const s = r + ctx.units[u.defId].radiusMilli;
    if (dist2(x, y, u.x, u.y) < s * s) return true;
  }
  return false;
}

export function checkPlacement(ctx: Ctx, units: readonly { x: number; y: number; defId: string }[], def: UnitDef, x: number, y: number): PlaceError | null {
  const s = checkStatic(ctx, def, x, y);
  if (s) return s;
  return overlapsAny(ctx, units, def.radiusMilli, x, y) ? 'overlap' : null;
}

/**
 * Statisch gültige Positionen auf dem Halbkachel-Raster für diese Unit (ohne Rücksicht auf andere Units), in Zeilenreihenfolge.
 * Kandidatenmenge der Bots; je (Platzierungsart, Radius) einmal berechnet.
 */
export function placementGrid(ctx: Ctx, def: UnitDef): readonly Point[] {
  const key = `${def.placement}:${def.radiusMilli}`;
  let g = ctx.map.gridCache.get(key);
  if (!g) {
    g = [];
    for (let y = ctx.map.minY; y <= ctx.map.maxY; y += GRID_STEP) {
      for (let x = ctx.map.minX; x <= ctx.map.maxX; x += GRID_STEP) {
        if (checkStatic(ctx, def, x, y) === null) g.push({ x, y });
      }
    }
    ctx.map.gridCache.set(key, g);
  }
  return g;
}
