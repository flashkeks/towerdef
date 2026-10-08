/**
 * Runde 10 / P3: Pakete oeffnen. Der Fehler aus Runde 9 ("Daily Pack zeigt nur den ersten Gewinn"): die alte Zieh-Animation lief als
 * eine Kette, ein Klick irgendwo beendete sie (`finish(true)`) und sprang zur Uebersicht, einzeln durchklicken ging nicht; das Starter-Paket
 * (12 Units und Crystals) kam gar nicht durch den Bildschirm, sondern stand nur als Zeile in der Lobby. Jetzt gilt: ein Aufdecken deckt
 * genau EINE Karte auf. Die DOM-Seite pruefen der Smoke (`smoke.mjs`, "Paket: ...") und `shots-r10-p3.mjs` mit echten Klicks.
 */
import { describe, expect, it } from 'vitest';
import {
  bestRarity,
  chargePlan,
  gridShape,
  isSpotlight,
  orderPrizes,
  PackState,
  prizeRarity,
  prizesFromCrystalOrder,
  prizesFromPulls,
  prizesFromReward,
  prizesFromStarter,
  type Prize,
} from '../src/ui/reveal-model';
import { newUnlocks } from '../src/ui/menu-fx';

const unit = (unitId: string, rarity: string, isNew = true, shiny = false): Prize => ({ kind: 'unit', unitId, rarity, isNew, ...(shiny ? { shiny: true } : {}) });
const ten = (): Prize[] => [unit('a', 'rare'), unit('b', 'rare', false), unit('c', 'epic'), unit('d', 'rare'), unit('e', 'legendary'), unit('f', 'rare'), unit('g', 'rare', false), unit('h', 'mythic'), unit('i', 'epic', false), unit('j', 'rare')];

describe('Paket: ein Klick = eine Karte (Fehler "nur der erste Gewinn")', () => {
  it('Aufdecken einer Karte laesst alle anderen verdeckt', () => {
    const s = new PackState(ten());
    expect(s.count).toBe(10);
    expect(s.reveal(3)).toBe(true);
    expect(s.revealedCount).toBe(1);
    expect(s.remaining).toBe(9);
    expect([0, 1, 2, 4, 5, 6, 7, 8, 9].some((i) => s.isRevealed(i))).toBe(false);
    expect(s.allRevealed).toBe(false);
  });

  it('Uebersicht erst, wenn nichts mehr verdeckt ist: neun von zehn reichen nicht', () => {
    const s = new PackState(ten());
    for (let i = 0; i < 9; i++) s.reveal(i);
    expect(s.canSummarize).toBe(false);
    s.reveal(9);
    expect(s.canSummarize).toBe(true);
  });

  it('jede Karte laesst sich einzeln aufdecken, zehn Klicks = zehn Gewinne gesehen', () => {
    const s = new PackState(ten());
    const seen: number[] = [];
    for (let i = 0; i < 10; i++) {
      expect(s.revealNext()).toBe(i);
      seen.push(i);
      expect(s.revealedCount).toBe(i + 1);
    }
    expect(seen).toHaveLength(10);
    expect(s.revealNext()).toBeNull();
  });

  it('Doppelklick auf dieselbe Karte zaehlt nicht doppelt; ungueltiger Index tut nichts', () => {
    const s = new PackState(ten());
    expect(s.reveal(2)).toBe(true);
    expect(s.reveal(2)).toBe(false);
    expect(s.reveal(-1)).toBe(false);
    expect(s.reveal(10)).toBe(false);
    expect(s.revealedCount).toBe(1);
  });

  it('"Alle aufdecken" deckt genau den Rest auf und meldet nur die neuen', () => {
    const s = new PackState(ten());
    s.reveal(0);
    s.reveal(5);
    const opened = s.revealAll();
    expect(opened).toHaveLength(8);
    expect(opened).not.toContain(0);
    expect(opened).not.toContain(5);
    expect(s.allRevealed).toBe(true);
    expect(s.revealAll()).toEqual([]);
  });
});

describe('Paket: Reihenfolge und Uebersicht', () => {
  it('hoechste Seltenheit zuletzt, Gleichstand bleibt in Ziehungsreihenfolge, Neues hinter Kopien', () => {
    const s = new PackState(ten());
    const order = s.items.map((p) => (p.kind === 'unit' ? p.unitId : '?'));
    expect(order.at(-1)).toBe('h'); // Mythic
    expect(order.at(-2)).toBe('e'); // Legendary
    expect(order.slice(0, 2)).toEqual(['b', 'g']); // Rare-Kopien zuerst, in Ziehungsreihenfolge
    expect(order.indexOf('a')).toBeGreaterThan(order.indexOf('g')); // neue Rare hinter Rare-Kopien
  });

  it('Waehrung und Material stehen vorn, Units danach', () => {
    const o = orderPrizes([unit('x', 'secret'), { kind: 'currency', currency: 'gold', amount: 100 }, { kind: 'material', id: 'm', name: 'Shard', amount: 3 }, unit('y', 'rare')]);
    expect(o.map((p) => p.kind)).toEqual(['currency', 'material', 'unit', 'unit']);
    expect(o.at(-1)).toMatchObject({ unitId: 'x' });
  });

  it('orderPrizes veraendert die Eingabe nicht', () => {
    const input = ten();
    const copy = [...input];
    orderPrizes(input);
    expect(input).toEqual(copy);
  });

  it('Zusammenfassung zaehlt neue Units und je Seltenheit', () => {
    const s = new PackState(ten()).summary();
    expect(s.total).toBe(10);
    expect(s.newUnits).toBe(7);
    expect(s.byRarity).toEqual({ rare: 6, epic: 2, legendary: 1, mythic: 1 });
    expect(s.best).toBe('mythic');
  });

  it('Rampenlicht ab Legendary, nicht fuer Waehrung', () => {
    expect(isSpotlight(unit('a', 'epic'))).toBe(false);
    expect(isSpotlight(unit('a', 'legendary'))).toBe(true);
    expect(isSpotlight(unit('a', 'secret'))).toBe(true);
    expect(isSpotlight({ kind: 'currency', currency: 'crystals', amount: 9999 })).toBe(false);
  });

  it('Farbe der Waehrung: Kristalle ab 500 Epic, sonst Rare; bestRarity ohne Units ist Rare', () => {
    expect(prizeRarity({ kind: 'currency', currency: 'crystals', amount: 500 })).toBe('epic');
    expect(prizeRarity({ kind: 'currency', currency: 'crystals', amount: 499 })).toBe('rare');
    expect(prizeRarity({ kind: 'currency', currency: 'gold', amount: 99999 })).toBe('rare');
    expect(bestRarity([{ kind: 'currency', currency: 'gold', amount: 5 }])).toBe('rare');
  });

  it('Shiny bleibt am Gewinn (Anzeige kennt es, Daten noch nicht)', () => {
    const p = prizesFromPulls([{ unitId: 'a', rarity: 'rare', isNew: true, shiny: true }, { unitId: 'b', rarity: 'epic', isNew: false }]);
    expect(p[0]).toMatchObject({ shiny: true });
    expect(p[1]).not.toHaveProperty('shiny');
  });

  it('leeres Paket ist sofort fertig', () => {
    const s = new PackState([]);
    expect(s.allRevealed).toBe(true);
    expect(s.revealNext()).toBeNull();
  });
});

describe('Quellen der Mehrfach-Ergebnisse', () => {
  const rarityOf = (id: string): string => (id === 'goku' ? 'mythic' : 'rare');
  it('Starter-Paket: Crystals plus alle Units, alle neu (Daily-Pack-Fall)', () => {
    const p = prizesFromStarter({ crystals: 450, units: ['goku', 'genos', 'krillin'] }, rarityOf);
    expect(p).toHaveLength(4);
    expect(p[0]).toMatchObject({ kind: 'currency', currency: 'crystals', amount: 450 });
    expect(p.filter((x) => x.kind === 'unit').every((x) => x.kind === 'unit' && x.isNew)).toBe(true);
    const s = new PackState(p);
    expect(s.items.at(-1)).toMatchObject({ unitId: 'goku' }); // beste zuletzt
    expect(prizesFromStarter({ crystals: 0, units: ['goku'] }, rarityOf)).toHaveLength(1);
  });

  const labels = { material: (id: string) => `Mat ${id}`, rarityOf, firstClear: 'First clear', milestone: (n: number) => `Milestone ${n}` };
  it('Raid-Belohnung: Crystals, Gold, XP, Material, Marken, Meilensteine und garantierte Unit werden je eine Karte', () => {
    const p = prizesFromReward(
      { crystals: 80, gold: 500, xp: 50, firstClear: true, materials: { fire: 4, ice: 0 }, raidMarks: 12, milestones: [{ clears: 5, crystals: 100, raidMarks: 20 }, { clears: 10, crystals: 0, raidMarks: 50 }], unit: { id: 'goku', isNew: true } },
      labels,
    );
    expect(p.map((x) => (x.kind === 'currency' ? `${x.currency}:${x.amount}` : x.kind === 'material' ? `mat:${x.id}:${x.amount}` : `unit:${x.unitId}`))).toEqual([
      'crystals:80', 'gold:500', 'xp:50', 'mat:fire:4', 'marks:12', 'crystals:100', 'marks:20', 'marks:50', 'unit:goku',
    ]);
    expect(p[0]).toMatchObject({ note: 'First clear' });
    expect(p[5]).toMatchObject({ note: 'Milestone 5' });
    expect(new PackState(p).items.at(-1)).toMatchObject({ unitId: 'goku' });
  });

  it('Niederlage ohne Crystals: nur Gold und XP, keine leeren Karten', () => {
    const p = prizesFromReward({ crystals: 0, gold: 40, xp: 10 }, labels);
    expect(p).toHaveLength(2);
  });

  it('Crystal-Paket: Basis und Bonus als zwei Karten, ohne Bonus eine', () => {
    expect(prizesFromCrystalOrder({ crystals: 1200, bonusCrystals: 200 })).toMatchObject([{ amount: 1000 }, { amount: 200, note: 'Bonus' }]);
    expect(prizesFromCrystalOrder({ crystals: 500, bonusCrystals: 0 })).toHaveLength(1);
    expect(prizesFromCrystalOrder({ crystals: 0 })).toHaveLength(0);
  });
});

describe('Aufbau und Raster', () => {
  it('Farbstufen Blau -> Lila -> Gold -> Regenbogen, Dauer waechst', () => {
    const order = ['rare', 'epic', 'legendary', 'mythic', 'secret'] as const;
    const plans = order.map((r) => chargePlan(r));
    for (let i = 1; i < plans.length; i++) expect(plans[i]!.introMs).toBeGreaterThan(plans[i - 1]!.introMs);
    expect(chargePlan('rare').stages.map((s) => s.rarity)).toEqual(['rare']);
    expect(chargePlan('legendary').stages.map((s) => s.rarity)).toEqual(['rare', 'epic', 'legendary']);
    expect(chargePlan('secret').stages.at(-1)!.hue).toBe('rainbow');
    // Stufen beginnen aufsteigend und alle vor dem Durchbruch
    for (const p of plans) {
      expect(p.stages.every((s, i) => i === 0 || s.atMs > p.stages[i - 1]!.atMs)).toBe(true);
      expect(p.stages.at(-1)!.atMs).toBeLessThan(p.introMs);
      expect(p.shakeFromMs).toBeLessThan(p.introMs);
    }
  });

  it('Raster: 10 = 5 x 2, 12 Starter-Units + Crystals = 5 x 3, 1 = 1 x 1', () => {
    expect(gridShape(10)).toEqual({ cols: 5, rows: 2 });
    expect(gridShape(13)).toEqual({ cols: 5, rows: 3 });
    expect(gridShape(1)).toEqual({ cols: 1, rows: 1 });
    expect(gridShape(3)).toEqual({ cols: 3, rows: 1 });
    expect(gridShape(30).cols).toBeLessThanOrEqual(8);
  });

  it('Freischaltungen: erster Besuch meldet nichts, danach nur Neues', () => {
    const now = [{ id: 'w1', name: 'One' }, { id: 'w2', name: 'Two' }];
    expect(newUnlocks(null, now)).toEqual([]);
    expect(newUnlocks(['w1'], now)).toEqual(['Two']);
    expect(newUnlocks(['w1', 'w2'], now)).toEqual([]);
  });
});
