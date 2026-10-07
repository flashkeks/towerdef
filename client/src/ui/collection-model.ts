/**
 * Sichtlogik der Sammlung (Runde 8, P4) ohne DOM: Filter, Sortierung, Dichte (DPS), virtuelles Raster (561+ Units) und die Form-Vorschau eines Angriffs.
 * Alles kommt aus `CollectionUnitView` (Backend) und `UnitDef` (Sim-Daten); nichts ist je Unit hart codiert. Tests: `test/collection-model.test.ts`.
 */
import type { CollectionUnitView } from '../backend/meta';
import type { LevelStat, UnitDef } from '../sim';
import { PLACEMENT_CATS, rarityRank, roleCat, type RoleCat } from './meta-model';
import { ELEMENT_IDS } from './kit/icons';

export const TICKS_PER_SECOND = 20;

// ---- Werte -------------------------------------------------------------------------------------------------------

/** Schaden je Sekunde einer Stufe (Einzelziel): `damageCenti / 100 / (spaTicks / 20)`; 0 ohne Angriff (Farm). */
export function levelDps(lv: LevelStat | undefined): number {
  if (!lv || !lv.attack || lv.spaTicks <= 0) return 0;
  return lv.damageCenti / 100 / (lv.spaTicks / TICKS_PER_SECOND);
}

/** DPS der Unit auf der hoechsten Stufe (Vergleichswert fuer die Sortierung). */
export const unitDps = (def: UnitDef | undefined): number => (def ? levelDps(def.levels[def.levels.length - 1]) : 0);

/** Erstes Element der Unit (Daten: `UnitDef.elements`), sonst `none`. */
export const primaryElement = (def: UnitDef | undefined): string => def?.elements[0] ?? 'none';

// ---- Filter und Sortierung -------------------------------------------------------------------------------------------

export type SortKey = 'rarity' | 'element' | 'placement' | 'dps' | 'level' | 'name';
export const SORT_KEYS: readonly SortKey[] = ['rarity', 'element', 'placement', 'dps', 'level', 'name'];

export interface CollectionQuery {
  rarity: string | null;
  element: string | null;
  placement: string | null;
  role: RoleCat | null;
  ownedOnly: boolean;
  /** Teil des Namens, ohne Gross-/Kleinschreibung */
  search: string;
  sort: SortKey;
}

export const DEFAULT_QUERY: CollectionQuery = { rarity: null, element: null, placement: null, role: null, ownedOnly: false, search: '', sort: 'rarity' };

/** Nur die Filter (ohne Sortierung). Units ohne Sim-Definition fallen durch Element-, Rollen- und Platzierungsfilter. */
export function filterCollection(units: readonly CollectionUnitView[], defs: ReadonlyMap<string, UnitDef>, nameOf: (id: string) => string, q: CollectionQuery): CollectionUnitView[] {
  const needle = q.search.trim().toLowerCase();
  return units.filter((u) => {
    if (q.ownedOnly && !u.owned) return false;
    if (q.rarity && u.rarity !== q.rarity) return false;
    const d = defs.get(u.unitId);
    if (q.element && (d?.elements[0] ?? 'none') !== q.element && !(d?.elements ?? []).includes(q.element)) return false;
    if (q.role && (!d || roleCat(d) !== q.role)) return false;
    if (q.placement && (!d || d.placement !== q.placement)) return false;
    if (needle && !nameOf(u.unitId).toLowerCase().includes(needle)) return false;
    return true;
  });
}

const elementRank = (e: string): number => {
  const i = (ELEMENT_IDS as readonly string[]).indexOf(e);
  return i < 0 ? ELEMENT_IDS.length : i;
};
const placementRank = (p: string | undefined): number => {
  const i = (PLACEMENT_CATS as readonly string[]).indexOf(p ?? '');
  return i < 0 ? PLACEMENT_CATS.length : i;
};

/**
 * Sortieren. Besessene Units stehen immer zuerst; darin nach `q.sort`:
 * `rarity` (selten zuerst), `element` (feste Reihenfolge), `placement` (Boden, Huegel, beides), `dps` (hoechster zuerst), `level` (hoechster zuerst), `name` (A-Z).
 * Gleichstand: Seltenheit absteigend, dann Katalogreihenfolge (stabil).
 */
export function sortCollection(units: readonly CollectionUnitView[], defs: ReadonlyMap<string, UnitDef>, nameOf: (id: string) => string, sort: SortKey): CollectionUnitView[] {
  const dps = new Map<string, number>();
  const key = (u: CollectionUnitView): number => {
    const d = defs.get(u.unitId);
    switch (sort) {
      case 'rarity':
        return -rarityRank(u.rarity);
      case 'element':
        return elementRank(primaryElement(d));
      case 'placement':
        return placementRank(d?.placement);
      case 'dps': {
        let v = dps.get(u.unitId);
        if (v === undefined) dps.set(u.unitId, (v = unitDps(d)));
        return -v;
      }
      case 'level':
        return -u.level;
      default:
        return 0;
    }
  };
  return units
    .map((u, i) => ({ u, i, k: key(u) }))
    .sort((a, b) => Number(b.u.owned) - Number(a.u.owned) || (sort === 'name' ? nameOf(a.u.unitId).localeCompare(nameOf(b.u.unitId)) : a.k - b.k) || rarityRank(b.u.rarity) - rarityRank(a.u.rarity) || a.i - b.i)
    .map((x) => x.u);
}

export const queryCollection = (units: readonly CollectionUnitView[], defs: ReadonlyMap<string, UnitDef>, nameOf: (id: string) => string, q: CollectionQuery): CollectionUnitView[] =>
  sortCollection(filterCollection(units, defs, nameOf, q), defs, nameOf, q.sort);

/** Anzahl je Seltenheit (fuer Zaehler an den Filter-Chips); unbekannte Seltenheit zaehlt unter ihrem Namen. */
export function countBy(units: readonly CollectionUnitView[], pick: (u: CollectionUnitView) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const u of units) m.set(pick(u), (m.get(pick(u)) ?? 0) + 1);
  return m;
}

// ---- Virtuelles Raster -----------------------------------------------------------------------------------------------

export interface GridLayout {
  cols: number;
  cardW: number;
  cardH: number;
  gap: number;
  rows: number;
  /** Gesamthoehe des Rasters in px (Platzhalter fuer die Scrollleiste) */
  totalH: number;
}

/**
 * Raster berechnen: so viele Spalten, wie mit Mindestbreite `minW` und Abstand `gap` in `width` passen; Karten fuellen die Breite, Hoehe nach `aspect` (Hoehe/Breite).
 * Mindestens eine Spalte, auch bei 0 Breite (Layout noch nicht gemessen).
 */
export function gridLayout(width: number, count: number, o: { minW: number; gap: number; aspect: number }): GridLayout {
  const cols = Math.max(1, Math.floor((Math.max(width, 0) + o.gap) / (o.minW + o.gap)));
  const cardW = Math.max(o.minW > 0 ? 1 : 0, (width - o.gap * (cols - 1)) / cols);
  const cardH = cardW * o.aspect;
  const rows = Math.ceil(count / cols);
  return { cols, cardW, cardH, gap: o.gap, rows, totalH: rows === 0 ? 0 : rows * cardH + (rows - 1) * o.gap };
}

/** Position (links, oben) der Karte `index` im Raster. */
export const itemPos = (g: GridLayout, index: number): { x: number; y: number } => ({
  x: (index % g.cols) * (g.cardW + g.gap),
  y: Math.floor(index / g.cols) * (g.cardH + g.gap),
});

/** Welche Karten zu zeichnen sind (`first` bis ausschliesslich `end`), mit `overscan` Zeilen Puffer oben und unten. */
export function visibleRange(g: GridLayout, count: number, scrollTop: number, viewH: number, overscan = 2): { first: number; end: number } {
  if (count === 0 || g.rows === 0) return { first: 0, end: 0 };
  const rowH = g.cardH + g.gap;
  const r0 = Math.max(0, Math.floor(scrollTop / rowH) - overscan);
  const r1 = Math.min(g.rows, Math.ceil((scrollTop + viewH) / rowH) + overscan);
  return { first: r0 * g.cols, end: Math.min(count, r1 * g.cols) };
}

/** Scroll-Position, bei der Karte `index` komplett sichtbar ist (oder `current`, wenn sie es schon ist). */
export function scrollToReveal(g: GridLayout, index: number, current: number, viewH: number): number {
  const { y } = itemPos(g, index);
  if (y < current) return y;
  if (y + g.cardH > current + viewH) return y + g.cardH - viewH;
  return current;
}

// ---- Angriffsform ----------------------------------------------------------------------------------------------------

export type ShapeModel =
  | { kind: 'single'; range: number }
  | { kind: 'circle'; range: number; radius: number }
  | { kind: 'cone'; range: number; deg: number }
  | { kind: 'line'; range: number; width: number }
  | { kind: 'full'; range: number };

/** Form des Angriffs einer Stufe in Kacheln (`null` ohne Angriff). Grundlage der kleinen SVG-Vorschau. */
export function attackShape(lv: LevelStat | undefined): ShapeModel | null {
  const a = lv?.attack;
  if (!lv || !a) return null;
  const range = lv.rangeMilli / 1000;
  switch (a.kind) {
    case 'circle':
      return { kind: 'circle', range, radius: a.radiusMilli / 1000 };
    case 'cone':
      return { kind: 'cone', range, deg: a.coneDeg };
    case 'line':
      return { kind: 'line', range, width: a.widthMilli / 1000 };
    case 'full':
      return { kind: 'full', range };
    default:
      return { kind: 'single', range };
  }
}

export interface ShapeGeometry {
  /** Pixel je Kachel */
  scale: number;
  /** Reichweite in px */
  rangePx: number;
  /** Mittelpunkt der Einheit (px) */
  cx: number;
  cy: number;
  /** Mittelpunkt des Ziels (px), mit der Form dort; bei `full`/`cone`/`line` irrelevant */
  tx: number;
  ty: number;
  /** Kreisradius (circle) in px, Linienbreite (line) in px */
  sizePx: number;
}

/**
 * Zeichenwerte fuer eine Vorschau der Groesse `size` (px, quadratisch): Reichweite fuellt etwa 40 % der Kantenlaenge, die Einheit sitzt links der Mitte, das Ziel
 * bei 75 % der Reichweite; Kreis und Linie werden so skaliert, dass sie nicht aus dem Bild laufen.
 */
export function shapeGeometry(m: ShapeModel, size: number): ShapeGeometry {
  const rangeTiles = Math.max(m.range, 0.5);
  const scale = (size * 0.4) / rangeTiles;
  const rangePx = rangeTiles * scale;
  const cx = size / 2 - rangePx * 0.25;
  const cy = size / 2;
  const tx = cx + rangePx * 0.75;
  const ty = cy;
  const sizePx = m.kind === 'circle' ? Math.min(m.radius * scale, size * 0.28) : m.kind === 'line' ? Math.min(m.width * scale, size * 0.4) : 0;
  return { scale, rangePx, cx, cy, tx, ty, sizePx };
}

// ---- Lobby-Held ------------------------------------------------------------------------------------------------------

/**
 * Wer in der Lobby im Vordergrund steht: aus dem Team die seltenste Unit (bei Gleichstand die erste im Team), ohne Team die seltenste besessene.
 * `side` sind bis zu zwei weitere Karten fuer den Faecher dahinter (gleiche Regel, danach). Ohne Besitz: `lead = null`.
 */
export function pickHero(team: readonly string[], units: readonly CollectionUnitView[]): { lead: string | null; side: string[] } {
  const owned = units.filter((u) => u.owned);
  const inTeam = team.map((id) => owned.find((u) => u.unitId === id)).filter((u): u is CollectionUnitView => !!u);
  const pool = inTeam.length > 0 ? inTeam : owned;
  const ranked = pool.map((u, i) => ({ u, i })).sort((a, b) => rarityRank(b.u.rarity) - rarityRank(a.u.rarity) || a.i - b.i).map((x) => x.u);
  const lead = ranked[0]?.unitId ?? null;
  const rest = ranked.slice(1).map((u) => u.unitId);
  // Fehlen im Team Mitspieler, fuellt der Faecher aus dem Rest der Sammlung auf
  if (rest.length < 2) {
    const more = owned.filter((u) => u.unitId !== lead && !rest.includes(u.unitId)).sort((a, b) => rarityRank(b.rarity) - rarityRank(a.rarity));
    rest.push(...more.map((u) => u.unitId));
  }
  return { lead, side: rest.slice(0, 2) };
}
