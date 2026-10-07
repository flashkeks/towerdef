import { describe, expect, it } from 'vitest';
import { createSim, loadBrowserData, STAGE_ID } from '../src/sim';
import { hasKey } from '../src/i18n/t';
import { airCapable, airUnitCount, bossHelpers, coinNudge, flyerWarning, joinOr, readyAbilityUnits, unitTags, UNIT_TAGS } from '../src/view/readability';

const data = loadBrowserData();
const sim = createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 1, data });
const defs = sim.catalog();
const def = (id: string) => defs.find((d) => d.id === id)!;
const firstFlyerWave = Array.from({ length: 20 }, (_, i) => i + 1).find((n) => sim.previewWave(n)?.groups.some((g) => g.flying))!;

describe('Unit-Symbole aus den Daten', () => {
  it('Luft: genau die Units mit canHitAir (Hill/Hybrid und airDamageBp)', () => {
    for (const d of defs) expect(unitTags(d).includes('air'), d.id).toBe(d.canHitAir && d.attack !== null);
    expect(unitTags(def('blaster'))).toContain('air'); // nur ueber airDamageBp
    expect(unitTags(def('striker'))).not.toContain('air');
  });
  it('Flaeche, Boss, Support, Geld', () => {
    expect(unitTags(def('blaster'))).toContain('area');
    expect(unitTags(def('lancer'))).toContain('area');
    expect(unitTags(def('striker'))).not.toContain('area');
    expect(unitTags(def('titan'))).toContain('boss');
    expect(unitTags(def('frost'))).toContain('boss');
    expect(unitTags(def('banner'))).toEqual(['support']); // Hybrid, aber ohne Angriff: kein Luft-Symbol
    expect(unitTags(def('farm'))).toEqual(['income']);
  });
  it('jedes Symbol hat Kurzform und Tooltip in en.ts', () => {
    for (const tag of UNIT_TAGS) {
      expect(hasKey(`tag.${tag}.sym`)).toBe(true);
      expect(hasKey(`tag.${tag}.tip`)).toBe(true);
    }
  });
});

describe('Flieger-Warnung', () => {
  it('Welle ohne Flieger: keine Warnung', () => {
    expect(flyerWarning(sim.previewWave(1), [], defs)).toBeNull();
    expect(flyerWarning(null, [], defs)).toBeNull();
  });
  it('Fliegerwelle ohne Luftabwehr: 0, mit Gunner: 1', () => {
    const p = sim.previewWave(firstFlyerWave);
    const w0 = flyerWarning(p, [], defs)!;
    expect(w0.flyers).toBeGreaterThan(0);
    expect(w0.airUnits).toBe(0);
    const unit = (defId: string) => ({ id: 1, defId }) as never;
    expect(flyerWarning(p, [unit('striker')], defs)!.airUnits).toBe(0);
    expect(flyerWarning(p, [unit('striker'), unit('gunner'), unit('blaster')], defs)!.airUnits).toBe(2);
    expect(airUnitCount([unit('lancer')], defs)).toBe(1);
    expect(airUnitCount([unit('banner')], defs)).toBe(0); // Banner zaehlt nicht als Luftabwehr
  });
  it('luftfaehige Team-Units aus den Daten', () => {
    expect(airCapable(defs).map((d) => d.id)).toEqual(defs.filter((d) => d.canHitAir && d.attack).map((d) => d.id));
    expect(airCapable(defs).map((d) => d.id)).not.toContain('banner'); // Support ohne Angriff
  });
});

describe('Boss-Hilfe, Muenz-Hinweis, Bereit-Marke', () => {
  it('Boss-Helfer: Frost = Stun, Titan = Nuke', () => {
    const h = bossHelpers(defs);
    expect(h.stun.map((d) => d.id)).toEqual(['frost']);
    expect(h.nuke.map((d) => d.id)).toEqual(['titan']);
    expect(sim.previewWave(10)?.boss).toBe(true);
    expect(sim.previewWave(20)?.boss).toBe(true);
  });
  it('Muenz-Hinweis nur bei Leak und mehr als 1,5 x guenstigste Unit', () => {
    expect(coinNudge(400, 200, 10)).toBe(true);
    expect(coinNudge(300, 200, 10)).toBe(false); // genau 1,5x reicht nicht
    expect(coinNudge(301, 200, 10)).toBe(true);
    expect(coinNudge(1000, 200, null)).toBe(false); // kein Leak
    expect(coinNudge(1000, 200, 5000)).toBe(false); // Leak zu lange her
    expect(coinNudge(1000, 0, 10)).toBe(false);
  });
  it('Bereit-Marke: nur mit Faehigkeit, abgelaufener Abklingzeit und Gegnern im Feld', () => {
    const u = (id: number, defId: string, abilityCd: number) => ({ id, defId, abilityCd }) as never;
    const units = [u(1, 'frost', 0), u(2, 'striker', 0), u(3, 'titan', 30)];
    expect(readyAbilityUnits(units, defs, 3).map((x) => x.id)).toEqual([1]);
    expect(readyAbilityUnits(units, defs, 0)).toEqual([]);
  });
  it('joinOr', () => {
    expect(joinOr([], 'or')).toBe('');
    expect(joinOr(['A'], 'or')).toBe('A');
    expect(joinOr(['A', 'B'], 'or')).toBe('A or B');
    expect(joinOr(['A', 'B', 'C'], 'or')).toBe('A, B or C');
  });
});

describe('Platzierpreis mit Aufschlag', () => {
  it('sim.placeCost(player, id) steigt ab dem 6. Exemplar', () => {
    const base = def('striker').placeCost;
    expect(sim.placeCost(0, 'striker')).toBe(base);
    const s = createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 1, data });
    (s.state.players[0] as { coins: number }).coins = 100000;
    let placed = 0;
    for (let x = 1000; x < 16000 && placed < 6; x += 900) for (const y of [2000, 4000, 6000, 8000, 9500]) {
      if (placed >= 6) break;
      if (s.apply(0, { type: 'place', unitId: 'striker', x, y }).ok) placed++;
    }
    expect(placed).toBe(6);
    expect(s.placeCost(0, 'striker')).toBeGreaterThan(base);
  });
});
