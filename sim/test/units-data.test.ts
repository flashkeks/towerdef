import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { unknownEffects } from '../src/data/compile.js';
import { loadGameData, loadUnits, mergeUnitFiles } from '../src/data/load.js';
import { ELEMENTS, UnitFileSchema, UNIT_RARITIES } from '../src/data/schema.js';
import { createSim } from '../src/index.js';
import { runMatch } from '../src/bots/index.js';
import { data, ctxFor, richData } from './helpers.js';

const aa = JSON.parse(readFileSync(new URL('../../docs/anime-adventures/data/units.json', import.meta.url), 'utf8')) as { units: Record<string, unknown>[]; attacks: Record<string, unknown> };

describe('Unit-Dateien (sim/data/units/*.json)', () => {
  it('der Lader führt alle Dateien zusammen; `sample.json` liegt dabei', () => {
    const u = loadUnits();
    expect(u.units.length).toBeGreaterThanOrEqual(15);
    expect(u.units.some((x) => x.id === 'rokuhira')).toBe(true);
  });
  it('jede Angriffs-ID der Units steht im Katalog, jede Stufe ist lückenlos, jede Unit hat Platzierkosten', () => {
    for (const u of data.units.units) {
      u.levels.forEach((l, k) => {
        expect(l.level, u.id).toBe(k);
        if (l.attack) expect(data.units.attacks[l.attack], `${u.id}: ${l.attack}`).toBeDefined();
      });
      expect(u.levels[0].cost, u.id).toBeGreaterThan(0);
      expect(UNIT_RARITIES).toContain(u.rarity);
      for (const e of u.elements) expect(ELEMENTS).toContain(e);
    }
  });
  it('kein unbekannter Effekt in den Beispiel-Units (alle Namen stehen im Katalog)', () => {
    expect(unknownEffects(data)).toEqual([]);
  });
  it('die Beispiele decken alle fünf Angriffsformen und mindestens 15 verschiedene Effekte ab', () => {
    const forms = new Set(Object.values(data.units.attacks).map((a) => a.aoe ?? 'single'));
    expect([...forms].sort()).toEqual(['circle', 'cone', 'full', 'line', 'single']);
    const used = new Set<string>();
    for (const a of Object.values(data.units.attacks)) {
      const sp = a.special ? (Array.isArray(a.special) ? a.special : [a.special]) : [];
      for (const s of sp) used.add(s.name);
      if (a.dot) used.add(`dot:${a.dot.type}`);
    }
    expect(used.size).toBeGreaterThanOrEqual(15);
  });
  it('die Beispiele enthalten alle Seltenheiten bis Mythic, Secret und Exclusive, alle Platzierungen, Crit, Farm, wechselnde Angriffe', () => {
    const rar = new Set(data.units.units.map((u) => u.rarity));
    for (const r of ['Rare', 'Epic', 'Legendary', 'Mythic', 'Secret', 'Exclusive']) expect(rar.has(r as 'Rare'), r).toBe(true);
    expect(new Set(data.units.units.map((u) => u.placement))).toEqual(new Set(['ground', 'hill', 'hybrid']));
    expect(data.units.units.some((u) => u.critChance)).toBe(true);
    expect(data.units.units.some((u) => u.levels.some((l) => l.farm))).toBe(true);
    const changing = data.units.units.some((u) => new Set(u.levels.map((l) => l.attack).filter(Boolean)).size > 1);
    expect(changing).toBe(true);
  });
  it('spawnCap wird gelesen, aber nicht durchgesetzt (Entscheidung Max 07.10.2026)', () => {
    expect(ctxFor().units['rokuhira'].spawnCap).toBe(3);
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, data: richData() });
    let placed = 0;
    for (const p of sim.placementGrid('rokuhira')) {
      if (placed >= 5) break;
      if (sim.apply(0, { type: 'place', unitId: 'rokuhira', ...p }).ok) placed++;
    }
    expect(placed).toBe(5); // mehr als spawnCap 3
  });
});

describe('AA-Rohdaten ohne Umbau (Importer P2 kann fast 1:1 kopieren)', () => {
  it('rohe AA-Units (nameRR, secondaryDamageTypes, true_damage, dps, extra ...) parsen; Zusatzfelder werden verworfen', () => {
    const picks = ['rokuhira', 'stain', 'shigaraki_evolved', 'bulma', 'fugo'].map((id) => aa.units.find((u) => u.id === id)!);
    const attacks: Record<string, unknown> = {};
    for (const u of picks) for (const l of u.levels as { attack?: string }[]) if (l.attack) attacks[l.attack] = aa.attacks[l.attack] ?? null;
    const f = UnitFileSchema.parse({ units: picks, attacks });
    expect(f.units.map((u) => u.name)).toEqual(['Vengeful Swordsman', expect.any(String), expect.any(String), expect.any(String), expect.any(String)]);
    expect(f.units[0].elements).toEqual(['water']);
    expect('dps' in (f.units[0].levels[0] as object)).toBe(false);
  });
  it('alle 561 AA-Units parsen im neuen Schema (ohne Importer), alle 1098 Angriffe ebenso', () => {
    const f = UnitFileSchema.safeParse({ units: aa.units.filter((u) => u.kind === 'unit'), attacks: aa.attacks });
    if (!f.success) throw new Error(f.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'));
    expect(f.data.units.length).toBe(550);
    expect(Object.keys(f.data.attacks).length).toBe(1098);
  });
  it('alle AA-Units kompilieren und laufen ein paar Ticks (Rauchtest über den ganzen Bestand)', () => {
    const f = UnitFileSchema.parse({ units: aa.units.filter((u) => u.kind === 'unit'), attacks: aa.attacks });
    const d = loadGameData();
    d.units = mergeUnitFiles([f]);
    d.economy.startCoins = 10_000_000;
    d.economy.caps.teamSlots = 6;
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, data: d });
    expect(sim.catalog().length).toBe(550);
    expect(unknownEffects(d)).toEqual([]);
    // jede Unit platzieren (eine je frischer Sim wäre langsam: je 20 Units in einer Sim, Zone passend)
    let placed = 0;
    for (const def of sim.catalog().slice(0, 60)) {
      const spot = sim.placementGrid(def.id).find((p) => sim.canPlace(0, def.id, p.x, p.y) === null);
      if (spot && sim.state.units.length < 60) {
        const r = sim.apply(0, { type: 'place', unitId: def.id, ...spot });
        if (r.ok) placed++;
      }
      if (new Set(sim.state.units.map((u) => u.defId)).size >= 6) break;
    }
    expect(placed).toBeGreaterThan(0);
    sim.step(400);
  });
  it('jede einzelne AA-Unit: ein Mono-Bot spielt 3 Waves ohne Absturz, Hash deterministisch', () => {
    const f = UnitFileSchema.parse({ units: aa.units.filter((u) => u.kind === 'unit'), attacks: aa.attacks });
    const d = loadGameData();
    d.units = mergeUnitFiles([f]);
    for (const u of d.units.units) {
      const r = runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 2, bots: [`mono-${u.id}`], maxTicks: 3 * 900, data: d });
      expect(r.ticks, u.id).toBeGreaterThan(0);
    }
  }, 240000);
});
