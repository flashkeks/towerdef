/** Sichtlogik der Sammlung und der Zieh-Animation (Runde 8, P4): ohne DOM. */
import { describe, expect, it } from 'vitest';
import type { CollectionUnitView } from '../src/backend/meta';
import type { LevelStat, UnitDef } from '../src/sim';
import {
  DEFAULT_QUERY,
  attackShape,
  countBy,
  filterCollection,
  gridLayout,
  itemPos,
  levelDps,
  pickHero,
  queryCollection,
  scrollToReveal,
  shapeGeometry,
  sortCollection,
  unitDps,
  visibleRange,
  type CollectionQuery,
} from '../src/ui/collection-model';
import { revealPlan, rarityIndex } from '../src/ui/reveal-model';

const view = (unitId: string, rarity: string, o: Partial<CollectionUnitView> = {}): CollectionUnitView => ({
  name: unitId, evolvedFrom: null, trait: null, rerollCost: null, evolution: null,
  unitId, rarity: rarity as CollectionUnitView['rarity'], owned: false, level: 0, maxLevel: 40, copies: 0, stars: 0, maxStars: 5, copiesForNextStar: null, copiesToNextStar: null, levelUpCost: null, canLevelUp: false, powerBp: 10000, powerBonusPct: 0, inTeam: false, ...o,
});
const lv = (damageCenti: number, spaTicks: number, attack: LevelStat['attack'] = { id: 'a', kind: 'single', radiusMilli: 0, widthMilli: 0, coneDeg: 0, cos2Bp: 0, hits: 1, dot: null, fx: [] }, rangeMilli = 6000): LevelStat => ({ damageCenti, spaTicks, rangeMilli, damageRawCenti: damageCenti, attack, farm: 0, rotation: null });
const def = (id: string, elements: string[], placement: string, levels: LevelStat[], extra: Partial<UnitDef> = {}): UnitDef => ({ id, name: id, rarity: 'Rare', placement, role: 'single', elements, levels, ...extra }) as unknown as UnitDef;

const units = [
  view('a', 'rare', { owned: true, level: 5 }),
  view('b', 'mythic', { owned: true, level: 2 }),
  view('c', 'mythic'),
  view('d', 'legendary', { owned: true, level: 9 }),
  view('e', 'secret'),
  view('f', 'epic'),
];
const defs = new Map<string, UnitDef>([
  ['a', def('a', ['fire'], 'ground', [lv(1000, 40), lv(2000, 40)])],
  ['b', def('b', ['water'], 'hill', [lv(5000, 20)])],
  ['c', def('c', ['fire'], 'hill', [lv(9000, 100)])],
  ['d', def('d', ['dark'], 'hybrid', [lv(3000, 20)])],
  ['e', def('e', ['ice'], 'ground', [lv(40000, 20)])],
  ['f', def('f', [], 'ground', [lv(100, 20, null)])],
]);
const name = (id: string): string => ({ a: 'Aria', b: 'Bolt', c: 'Cinder', d: 'Dusk', e: 'Eisa', f: 'Fenn' })[id] ?? id;
const q = (o: Partial<CollectionQuery>): CollectionQuery => ({ ...DEFAULT_QUERY, ...o });
const ids = (l: readonly CollectionUnitView[]): string => l.map((u) => u.unitId).join('');

describe('Werte', () => {
  it('DPS = Schaden / Sekunden pro Angriff, 0 ohne Angriff', () => {
    expect(levelDps(lv(2000, 40))).toBe(10);
    expect(levelDps(lv(100, 20, null))).toBe(0);
    expect(levelDps(undefined)).toBe(0);
    expect(unitDps(defs.get('a'))).toBe(10);
    expect(unitDps(undefined)).toBe(0);
  });
});

describe('Filter', () => {
  it('Seltenheit, Element, Platzierung, Besitz', () => {
    expect(ids(filterCollection(units, defs, name, q({ rarity: 'mythic' })))).toBe('bc');
    expect(ids(filterCollection(units, defs, name, q({ element: 'fire' })))).toBe('ac');
    expect(ids(filterCollection(units, defs, name, q({ placement: 'hill' })))).toBe('bc');
    expect(ids(filterCollection(units, defs, name, q({ ownedOnly: true })))).toBe('abd');
    expect(ids(filterCollection(units, defs, name, q({ rarity: 'mythic', element: 'fire', ownedOnly: true })))).toBe('');
  });
  it('Namenssuche ohne Gross-/Kleinschreibung, Leerzeichen am Rand egal', () => {
    expect(ids(filterCollection(units, defs, name, q({ search: '  CIN ' })))).toBe('c');
    expect(ids(filterCollection(units, defs, name, q({ search: 'zzz' })))).toBe('');
  });
  it('Units ohne Definition fallen durch Element-/Platzierungsfilter, nicht durch Seltenheit', () => {
    const extra = [...units, view('g', 'rare')];
    expect(ids(filterCollection(extra, defs, name, q({ rarity: 'rare' })))).toBe('ag');
    expect(ids(filterCollection(extra, defs, name, q({ placement: 'ground' })))).toBe('aef');
  });
  it('Zaehler je Seltenheit', () => {
    const c = countBy(units, (u) => u.rarity);
    expect(c.get('mythic')).toBe(2);
    expect(c.get('rare')).toBe(1);
  });
});

describe('Sortierung', () => {
  it('Standard: Besessene zuerst, dann Seltenheit absteigend, Gleichstand nach Katalog', () => {
    expect(ids(sortCollection(units, defs, name, 'rarity'))).toBe('bdaecf');
  });
  it('DPS: hoechster zuerst, Besessene davor', () => {
    // besessen: b(50) d(30) a(10); nicht besessen: e(400) c(18) f(0)
    expect(ids(sortCollection(units, defs, name, 'dps'))).toBe('bdaecf');
  });
  it('Element nach fester Reihenfolge, Platzierung: Boden, Huegel, beides', () => {
    expect(ids(sortCollection(units, defs, name, 'element'))).toBe('abdcef');
    expect(ids(sortCollection(units.filter((u) => u.owned), defs, name, 'placement'))).toBe('abd');
  });
  it('Level absteigend und Name A-Z', () => {
    expect(ids(sortCollection(units, defs, name, 'level'))).toBe('dabecf');
    expect(ids(sortCollection(units, defs, name, 'name'))).toBe('abdcef');
  });
  it('queryCollection = Filter dann Sortierung; stabil und ohne Veraenderung der Eingabe', () => {
    const copy = [...units];
    expect(ids(queryCollection(units, defs, name, q({ rarity: 'mythic', sort: 'name' })))).toBe('bc');
    expect(units).toEqual(copy);
  });
});

describe('Virtuelles Raster', () => {
  const o = { minW: 140, gap: 10, aspect: 4 / 3 };
  it('Spalten aus Breite, Karten fuellen die Breite', () => {
    const g = gridLayout(1000, 561, o);
    expect(g.cols).toBe(6); // (1000+10)/(150) = 6.7
    expect(g.cardW * g.cols + g.gap * (g.cols - 1)).toBeCloseTo(1000, 5);
    expect(g.rows).toBe(Math.ceil(561 / 6));
    expect(g.totalH).toBeCloseTo(g.rows * g.cardH + (g.rows - 1) * g.gap, 5);
  });
  it('mindestens eine Spalte, leer = Hoehe 0', () => {
    expect(gridLayout(0, 10, o).cols).toBe(1);
    expect(gridLayout(500, 0, o).totalH).toBe(0);
    expect(gridLayout(100, 5, o).cols).toBe(1);
  });
  it('Position der Karten', () => {
    const g = gridLayout(1000, 561, o);
    expect(itemPos(g, 0)).toEqual({ x: 0, y: 0 });
    expect(itemPos(g, 7)).toEqual({ x: g.cardW + g.gap, y: g.cardH + g.gap });
  });
  it('561 Units: nur ein kleiner Ausschnitt wird gezeichnet', () => {
    const g = gridLayout(1000, 561, o);
    const top = visibleRange(g, 561, 0, 600);
    expect(top.first).toBe(0);
    expect(top.end - top.first).toBeLessThan(60);
    const mid = visibleRange(g, 561, 3000, 600);
    expect(mid.first).toBeGreaterThan(0);
    expect(mid.end - mid.first).toBeLessThan(60);
    expect(mid.first % g.cols).toBe(0);
    const bottom = visibleRange(g, 561, g.totalH, 600);
    expect(bottom.end).toBe(561);
  });
  it('leere Liste: nichts', () => {
    expect(visibleRange(gridLayout(1000, 0, o), 0, 0, 600)).toEqual({ first: 0, end: 0 });
  });
  it('Hinscrollen: nur bei Bedarf', () => {
    const g = gridLayout(1000, 561, o);
    expect(scrollToReveal(g, 0, 0, 600)).toBe(0);
    const far = scrollToReveal(g, 300, 0, 600);
    expect(far).toBeGreaterThan(0);
    expect(itemPos(g, 300).y + g.cardH).toBeCloseTo(far + 600, 5);
    expect(scrollToReveal(g, 300, far, 600)).toBe(far);
    expect(scrollToReveal(g, 0, far, 600)).toBe(0);
  });
});

describe('Angriffsform', () => {
  const att = (kind: string, extra: object = {}): LevelStat['attack'] => ({ id: 'a', kind, radiusMilli: 0, widthMilli: 0, coneDeg: 0, cos2Bp: 0, hits: 1, dot: null, fx: [], ...extra }) as LevelStat['attack'];
  it('Form je Angriffsart in Kacheln', () => {
    expect(attackShape(lv(1, 20, att('circle', { radiusMilli: 1800 }), 7000))).toEqual({ kind: 'circle', range: 7, radius: 1.8 });
    expect(attackShape(lv(1, 20, att('cone', { coneDeg: 60 }), 5000))).toEqual({ kind: 'cone', range: 5, deg: 60 });
    expect(attackShape(lv(1, 20, att('line', { widthMilli: 800 }), 5000))).toEqual({ kind: 'line', range: 5, width: 0.8 });
    expect(attackShape(lv(1, 20, att('full'), 9000))).toEqual({ kind: 'full', range: 9 });
    expect(attackShape(lv(1, 20, att('single'), 3000))).toEqual({ kind: 'single', range: 3 });
    expect(attackShape(lv(1, 20, null))).toBeNull();
    expect(attackShape(undefined)).toBeNull();
  });
  it('Geometrie bleibt im Bild', () => {
    for (const m of [
      { kind: 'circle', range: 7, radius: 30 },
      { kind: 'line', range: 2, width: 40 },
      { kind: 'single', range: 0 },
      { kind: 'full', range: 20 },
    ] as const) {
      const g = shapeGeometry(m, 120);
      expect(g.cx - 0).toBeGreaterThan(0);
      if (m.kind === 'circle') expect(g.tx + g.sizePx).toBeLessThanOrEqual(120);
      if (m.kind === 'line') expect(g.cy + g.sizePx / 2).toBeLessThanOrEqual(120);
      expect(g.cx + g.rangePx).toBeLessThan(120);
      expect(g.sizePx).toBeLessThanOrEqual(120 * 0.4 + 1e-9);
    }
  });
});

describe('Zieh-Animation (Plan)', () => {
  it('Vorspann waechst mit der besten Seltenheit', () => {
    const rare = revealPlan(Array(10).fill('rare'));
    const myth = revealPlan([...Array(9).fill('rare'), 'mythic']);
    const secret = revealPlan(['rare', 'secret']);
    expect(myth.introMs).toBeGreaterThan(rare.introMs);
    expect(secret.introMs).toBeGreaterThan(myth.introMs);
    expect(myth.best).toBe('mythic');
  });
  it('Rampenlicht nur ab Legendary, Einzelzug immer', () => {
    const p = revealPlan(['rare', 'epic', 'legendary', 'mythic']);
    expect(p.steps.map((s) => s.spotlight)).toEqual([false, false, true, true]);
    expect(revealPlan(['rare']).steps[0]!.spotlight).toBe(true);
    expect(p.steps[3]!.ms).toBeGreaterThan(p.steps[2]!.ms);
  });
  it('Gesamtdauer = Vorspann + Schritte + Abschluss; unbekannte Seltenheit zaehlt wie Rare', () => {
    const p = revealPlan(['rare', 'zzz']);
    expect(p.totalMs).toBe(p.introMs + p.steps.reduce((s, x) => s + x.ms, 0) + 450);
    expect(rarityIndex('zzz')).toBe(0);
    expect(rarityIndex('Secret')).toBe(4);
  });
});

describe('Lobby-Held', () => {
  it('Team: die seltenste Unit fuehrt, Gleichstand = erste im Team', () => {
    expect(pickHero(['a', 'd', 'b'], units)).toEqual({ lead: 'b', side: ['d', 'a'] });
    expect(pickHero(['a', 'b'], [...units.slice(0, 1), view('x', 'mythic', { owned: true }), ...units.slice(1)]).lead).toBe('b'); // x ist nicht im Team
  });
  it('ohne Team: die seltenste besessene; ohne Besitz: niemand', () => {
    expect(pickHero([], units).lead).toBe('b');
    expect(pickHero([], [view('c', 'mythic')])).toEqual({ lead: null, side: [] });
  });
  it('Team-Eintraege, die nicht (mehr) besessen sind, zaehlen nicht; Faecher fuellt aus der Sammlung auf', () => {
    const r = pickHero(['c', 'a'], units);
    expect(r.lead).toBe('a');
    expect(r.side).toEqual(['b', 'd']);
  });
});
