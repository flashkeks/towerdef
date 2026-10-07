import { describe, expect, it } from 'vitest';
import { en } from '../src/i18n/en';
import { hasKey, t } from '../src/i18n/t';
import { HINTS_KEY, hintsOff, hintStep, setHintsOff, type KeyValueStore } from '../src/ui/hints-store';
import { Session } from '../src/game/session';
import { createSim, loadBrowserData, STAGE_ID, type Command } from '../src/sim';
import { failureToast, ghostLabelKey, ghostStatus, milliToPx, placingAfterClick, pointerToWorld, pxToMilli, unitAt, zoneFits } from '../src/view/placement';
import { reachMilli, statValues, upgradeEffect } from '../src/view/unit-info';

const data = loadBrowserData();
const defs = data.units.units;
const sim = createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 1, data });
const catalog = sim.catalog();

const PLACE = { ground: { x: 3000, y: 3000 }, hill: { x: 3000, y: 2000 }, path: { x: 3000, y: 1000 } } as const;
const by = Object.fromEntries(catalog.map((d) => [d.id, d]));
const rich = (): ReturnType<typeof createSim> => {
  const sim = createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 1, data });
  (sim.state.players[0] as { coins: number }).coins = 1_000_000;
  return sim;
};

describe('Bildschirm <-> Welt', () => {
  it('Kachelmitte (x,y) liegt bei (x+0,5) Kacheln; Hin- und Rueckweg stimmen', () => {
    for (const tile of [24, 48, 56, 72]) {
      expect(milliToPx(0, tile)).toBe(tile / 2);
      expect(pxToMilli(tile / 2, tile)).toBe(0);
      expect(pxToMilli(milliToPx(3000, tile), tile)).toBe(3000);
      expect(pxToMilli(milliToPx(13500, tile), tile)).toBe(13500);
    }
  });
  it('Ecken der Karte: Rand -500 .. 16500 x -500 .. 10500', () => {
    const T = 50;
    expect(pointerToWorld({ x: 0, y: 0 }, T)).toEqual({ x: -500, y: -500 });
    expect(pointerToWorld({ x: 17 * T, y: 11 * T }, T)).toEqual({ x: 16500, y: 10500 });
  });
  it('rundet auf ganze Milli-Tiles (die Sim lehnt Bruchteile ab)', () => {
    const p = pointerToWorld({ x: 123.456, y: 77.7 }, 53);
    expect(Number.isInteger(p.x) && Number.isInteger(p.y)).toBe(true);
  });
});

describe('Geist-Status gegen die Sim', () => {
  it('gruen auf Boden/Huegel passend zur Unit, rot mit dem Grund der Sim sonst', () => {
    const sim = rich();
    const g = (unit: string, p: { x: number; y: number }) => ghostStatus(sim.canPlace(0, unit, p.x, p.y));
    expect(g('striker', PLACE.ground)).toEqual({ ok: true, reason: null });
    expect(g('gunner', PLACE.hill)).toEqual({ ok: true, reason: null });
    expect(g('striker', PLACE.hill)).toEqual({ ok: false, reason: 'wrong-zone' });
    expect(g('gunner', PLACE.ground)).toEqual({ ok: false, reason: 'wrong-zone' });
    expect(g('banner', PLACE.hill).ok).toBe(true); // Hybrid: beides
    expect(g('banner', PLACE.ground).ok).toBe(true);
    expect(g('striker', PLACE.path)).toEqual({ ok: false, reason: 'on-path' });
    expect(g('striker', { x: -450, y: 3000 })).toEqual({ ok: false, reason: 'out-of-bounds' });
    expect(g('striker', { x: 7000, y: 0 }).reason).toBe('blocked');
  });
  it('Ueberlappung nach dem Setzen; Berechnung stimmt mit apply ueberein', () => {
    const sim = rich();
    expect(sim.apply(0, { type: 'place', unitId: 'striker', ...PLACE.ground }).ok).toBe(true);
    expect(ghostStatus(sim.canPlace(0, 'striker', 3300, 3000))).toEqual({ ok: false, reason: 'overlap' });
    expect(sim.apply(0, { type: 'place', unitId: 'striker', x: 3300, y: 3000 })).toEqual({ ok: false, reason: 'overlap' });
    expect(ghostStatus(sim.canPlace(0, 'striker', 3800, 3000)).ok).toBe(true);
  });
  it('zu wenig Muenzen ist rot mit eigenem Grund', () => {
    const sim = rich();
    (sim.state.players[0] as { coins: number }).coins = 0;
    expect(ghostStatus(sim.canPlace(0, 'striker', PLACE.ground.x, PLACE.ground.y)).reason).toBe('not-enough-coins');
  });
  it('jeder Grund hat Beschriftung und Toast-Schluessel', () => {
    for (const r of ['out-of-bounds', 'on-path', 'blocked', 'wrong-zone', 'overlap', 'not-enough-coins', 'team-limit', 'team-slots', 'invalid-position', 'whatever']) {
      expect(hasKey(ghostLabelKey(r)), r).toBe(true);
    }
  });
  it('Zonen-Hervorhebung passt zur Platzierungsart (zoneFits) und zur Sim', () => {
    expect(zoneFits('ground', 'ground')).toBe(true);
    expect(zoneFits('ground', 'hill')).toBe(false);
    expect(zoneFits('hill', 'hill')).toBe(true);
    expect(zoneFits('hybrid', 'ground') && zoneFits('hybrid', 'hill')).toBe(true);
    for (const z of ['path', 'blocked', null]) expect(zoneFits('hybrid', z)).toBe(false);
    // jede statisch gueltige Rasterstelle liegt in einer passenden Zone
    const sim = rich();
    for (const d of catalog) for (const p of sim.placementGrid(d.id)) expect(zoneFits(d.placement, sim.zoneAt(p.x, p.y)), `${d.id}@${p.x},${p.y}`).toBe(true);
  });
});

describe('Treffer auf gesetzte Units und Shift-Klick', () => {
  const units = [
    { id: 1, defId: 'striker', x: 3000, y: 3000 },
    { id: 2, defId: 'striker', x: 3800, y: 3000 },
    { id: 3, defId: 'farm', x: 14000, y: 6000 },
  ];
  const radius = (id: string): number => by[id].radiusMilli;
  it('trifft die naechste Unit im Kreis, sonst nichts', () => {
    expect(unitAt(units, radius, 3050, 3000)).toBe(1);
    expect(unitAt(units, radius, 3600, 3000)).toBe(2); // naeher an 2
    expect(unitAt(units, radius, 3400, 3450)).toBeNull();
    expect(unitAt(units, radius, 14800, 6000)).toBe(3); // Farm: Radius 900
  });
  it('Shift: nur nach erfolgreichem Setzen bleibt die Wahl; ohne Shift ist sie verbraucht; Fehlversuch behaelt sie', () => {
    expect(placingAfterClick('striker', true, false)).toBeNull();
    expect(placingAfterClick('striker', true, true)).toBe('striker');
    expect(placingAfterClick('striker', false, false)).toBe('striker');
    expect(placingAfterClick('striker', false, true)).toBe('striker');
  });
  it('Session: Klick setzt, Shift+Klick setzt dieselbe Unit nochmal, Klick auf Unit waehlt sie', () => {
    const s = new Session('normal', 1);
    (s.sim.state.players[0] as { coins: number }).coins = 100000;
    s.choosePlacing('striker');
    s.clickBoard(3000, 3000, true);
    expect(s.placing).toBe('striker');
    s.clickBoard(5000, 3000, true);
    expect(s.sim.state.units).toHaveLength(2);
    expect(s.sim.state.units.map((u) => [u.x, u.y])).toEqual([[3000, 3000], [5000, 3000]]);
    s.clickBoard(7000, 3000, false);
    expect(s.sim.state.units).toHaveLength(3);
    expect(s.placing).toBeNull();
    s.clickBoard(5050, 2980);
    expect(s.selectedUnit).toBe(s.sim.state.units[1].id);
  });
  it('Session: Geist folgt dem Cursor; Klick an roter Stelle zeigt Toast mit Grund und setzt nichts', () => {
    const s = new Session('normal', 1);
    s.choosePlacing('striker');
    expect(s.ghost()).toBeNull(); // ohne Cursor
    s.cursor = PLACE.ground;
    expect(s.ghost()).toMatchObject({ ok: true, reason: null, unitId: 'striker' });
    s.cursor = PLACE.path;
    expect(s.ghost()).toMatchObject({ ok: false, reason: 'on-path' });
    s.pointer = { x: 10, y: 10 };
    s.clickBoard(PLACE.path.x, PLACE.path.y);
    expect(s.toast?.key).toBe('toast.place.on-path');
    expect(s.sim.state.units).toHaveLength(0);
    expect(s.placing).toBe('striker'); // Wahl bleibt zum Nachbessern
    s.clickBoard(PLACE.hill.x, PLACE.hill.y);
    expect(s.toast?.key).toBe('toast.place.wrong-zone.ground');
    s.choosePlacing('striker');
    expect(s.ghost()).toBeNull(); // abgewaehlt
  });
  it('Klicks ins Leere reagieren immer', () => {
    const s = new Session('normal', 1);
    s.clickBoard(3000, 3000);
    expect(s.toast?.key).toBe('toast.hint.empty');
  });
});

describe('Fehler-Toasts', () => {
  const ctx = { name: 'Gunner', def: by.gunner, cost: 300, coins: 120, teamUnits: 60, teamSlots: 6 };
  const place: Command = { type: 'place', unitId: 'gunner', x: 3000, y: 3000 };
  it('jeder Platzier-Grund hat einen vorhandenen Schluessel und nennt Zahlen/Namen', () => {
    for (const reason of ['not-enough-coins', 'wrong-zone', 'on-path', 'out-of-bounds', 'blocked', 'overlap', 'invalid-position', 'team-limit', 'team-slots']) {
      const spec = failureToast(place, reason, ctx);
      expect(hasKey(spec.key), `${reason} -> ${spec.key}`).toBe(true);
    }
    expect(t(failureToast(place, 'not-enough-coins', ctx).key, failureToast(place, 'not-enough-coins', ctx).params)).toBe('Not enough coins: Gunner costs 300, you have 120.');
    expect(failureToast(place, 'wrong-zone', ctx).key).toBe('toast.place.wrong-zone.hill');
    expect(failureToast(place, 'wrong-zone', { ...ctx, def: by.striker }).key).toBe('toast.place.wrong-zone.ground');
    expect(t('toast.place.on-path', { name: 'Gunner' })).toContain('path');
  });
  it('Upgrade ohne Muenzen nennt Kosten', () => {
    const spec = failureToast({ type: 'upgrade', entityId: 1 }, 'not-enough-coins', { ...ctx, cost: 450 });
    expect(t(spec.key, spec.params)).toBe('Not enough coins: upgrade costs 450, you have 120.');
  });
  it('unbekannter Grund -> Schluessel error.X (Session faellt dann auf generic)', () => {
    expect(failureToast({ type: 'skipWave' }, 'no-next-wave', ctx).key).toBe('error.no-next-wave');
  });
  it('Session: Toast mit Grund und Zeigerposition', () => {
    const s = new Session('normal', 1);
    s.pointer = { x: 100, y: 80 };
    (s.sim.state.players[0] as { coins: number }).coins = 10;
    s.choosePlacing('striker');
    s.clickBoard(PLACE.ground.x, PLACE.ground.y);
    expect(s.toast?.key).toBe('toast.poor');
    expect(s.toast?.at).toEqual({ x: 100, y: 80 });
  });
  it('keine Texte oder Gruende zu Limit je Unit-Typ mehr (cap)', () => {
    for (const k of Object.keys(en)) expect(/\bcap\b|cap-reached|slot-kind|slot-size|slot-occupied/.test(k), k).toBe(false);
    expect('toast.cap' in en).toBe(false);
    for (const k of ['toast.place.on-path', 'toast.place.wrong-zone.hill', 'toast.poor', 'hint.1', 'hint.2', 'hint.3', 'help.title']) expect(k in en, k).toBe(true);
  });
});

describe('Ersthinweise', () => {
  const mem = (): KeyValueStore & { map: Map<string, string> } => {
    const map = new Map<string, string>();
    return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
  };
  it('Standard: an; nach Abschalten aus; wieder an', () => {
    const st = mem();
    expect(hintsOff(st)).toBe(false);
    setHintsOff(true, st);
    expect(st.map.get(HINTS_KEY)).toBe('1');
    expect(hintsOff(st)).toBe(true);
    setHintsOff(false, st);
    expect(hintsOff(st)).toBe(false);
  });
  it('kaputter oder fehlender Speicher wirft nie', () => {
    const bad: KeyValueStore = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(hintsOff(bad)).toBe(false);
    expect(() => setHintsOff(true, bad)).not.toThrow();
    expect(hintsOff(null)).toBe(false);
    expect(() => setHintsOff(true, null)).not.toThrow();
  });
  it('Schritte: Unit waehlen, Feld klicken, Welle starten, fertig', () => {
    expect(hintStep({ phase: 'prep', placing: false, units: 0 })).toBe(1);
    expect(hintStep({ phase: 'prep', placing: true, units: 0 })).toBe(2);
    expect(hintStep({ phase: 'prep', placing: false, units: 1 })).toBe(3);
    expect(hintStep({ phase: 'prep', placing: true, units: 1 })).toBe(3);
    expect(hintStep({ phase: 'wave', placing: false, units: 0 })).toBe('done');
  });
});

describe('Unit-Anzeige', () => {
  it('Upgrade-Wirkung alt -> neu, leer auf Max', () => {
    const striker = catalog.find((d) => d.id === 'striker')!;
    const rows = upgradeEffect(striker, 0);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(r.from).not.toBe(r.to);
    expect(rows.map((r) => r.key)).toContain('stat.damage');
    expect(upgradeEffect(striker, striker.maxLevel)).toEqual([]);
  });
  it('Reichweite: Angreifer Level-Wert, Banner Aura, Farm keine', () => {
    const by = Object.fromEntries(catalog.map((d) => [d.id, d]));
    expect(reachMilli(by.striker, 0)).toBe(by.striker.levels[0].rangeMilli);
    expect(reachMilli(by.banner, 0)).toBe(by.banner.aura!.radiusMilli);
    expect(reachMilli(by.farm, 0)).toBe(0);
    expect(statValues(by.farm, 0)[0].key).toBe('stat.yield');
  });
  it('alle Units haben anzeigbare Werte auf jeder Stufe', () => {
    for (const d of defs) {
      const def = catalog.find((c) => c.id === d.id)!;
      for (let l = 0; l <= def.maxLevel; l++) expect(statValues(def, l).length, `${d.id}@${l}`).toBeGreaterThan(0);
    }
  });
});
