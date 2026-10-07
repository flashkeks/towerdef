import { describe, expect, it } from 'vitest';
import { createSim, loadBrowserData, STAGE_ID } from '../src/sim';
import { hasKey } from '../src/i18n/t';
import { airCapable, airUnitCount, bossHelpers, coinNudge, flyerWarning, joinOr, unitTags, UNIT_TAGS } from '../src/view/readability';

const data = loadBrowserData();
const sim = createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 1, data });
const defs = sim.catalog();
const def = (id: string) => defs.find((d) => d.id === id)!;
const firstFlyerWave = Array.from({ length: 20 }, (_, i) => i + 1).find((n) => sim.previewWave(n)?.groups.some((g) => g.flying))!;

describe('Unit-Symbole aus den Daten', () => {
  it('Luft: genau die Units mit canHitAir (Hill/Hybrid, oder `hitsAir` in den Daten) und Angriff', () => {
    for (const d of defs) expect(unitTags(d).includes('air'), d.id).toBe(d.canHitAir && d.attack !== null);
    expect(unitTags(def('goku_ssj3'))).toContain('air'); // Hill
    expect(unitTags(def('stain'))).not.toContain('air'); // Boden
    expect(unitTags(def('ichigo'))).not.toContain('air');
  });
  it('Flaeche, Boss, Support, Geld', () => {
    expect(unitTags(def('stain'))).toContain('area');
    expect(unitTags(def('rikka_evo'))).toContain('area');
    expect(unitTags(def('ichigo'))).not.toContain('area');
    expect(unitTags(def('dio'))).toContain('boss'); // Freeze
    expect(unitTags(def('jotaro_p6_evolved'))).toContain('boss'); // Timestop
    expect(unitTags(def('ichigo'))).not.toContain('boss');
    expect(unitTags(def('brook_evolved'))).toContain('support'); // Motivate
    expect(unitTags(def('speedwagon'))).toEqual(['income']); // Farm: kein Angriff, kein Luft-Symbol
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
    expect(flyerWarning(p, [unit('ichigo')], defs)!.airUnits).toBe(0);
    expect(flyerWarning(p, [unit('ichigo'), unit('krillin'), unit('stain')], defs)!.airUnits).toBe(1);
    expect(airUnitCount([unit('rikka_evo')], defs)).toBe(1);
    expect(airUnitCount([unit('speedwagon')], defs)).toBe(0); // Farm zaehlt nicht als Luftabwehr
  });
  it('luftfaehige Team-Units aus den Daten', () => {
    expect(airCapable(defs).map((d) => d.id)).toEqual(defs.filter((d) => d.canHitAir && d.attack).map((d) => d.id));
    expect(airCapable(defs).map((d) => d.id)).not.toContain('speedwagon'); // Farm ohne Angriff
  });
});

describe('Boss-Hilfe, Muenz-Hinweis', () => {
  it('Boss-Helfer: Units mit Stun/Freeze/Timestop in den Daten; keine Faehigkeits-Knoepfe mehr', () => {
    const h = bossHelpers(defs);
    expect(h.stun.map((d) => d.id)).toEqual(expect.arrayContaining(['dio', 'jotaro_p6_evolved', 'josuke']));
    expect(h.stun.map((d) => d.id)).not.toContain('ichigo');
    expect(h.nuke).toEqual([]);
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
  it('joinOr', () => {
    expect(joinOr([], 'or')).toBe('');
    expect(joinOr(['A'], 'or')).toBe('A');
    expect(joinOr(['A', 'B'], 'or')).toBe('A or B');
    expect(joinOr(['A', 'B', 'C'], 'or')).toBe('A, B or C');
  });
});

describe('Platzierpreis mit Aufschlag', () => {
  it('sim.placeCost(player, id) steigt ab dem 6. Exemplar', () => {
    const base = def('ichigo').placeCost;
    expect(sim.placeCost(0, 'ichigo')).toBe(base);
    const s = createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 1, data });
    (s.state.players[0] as { coins: number }).coins = 100000;
    let placed = 0;
    for (let x = 1000; x < 16000 && placed < 6; x += 900) for (const y of [2000, 4000, 6000, 8000, 9500]) {
      if (placed >= 6) break;
      if (s.apply(0, { type: 'place', unitId: 'ichigo', x, y }).ok) placed++;
    }
    expect(placed).toBe(6);
    expect(s.placeCost(0, 'ichigo')).toBeGreaterThan(base);
  });
});
