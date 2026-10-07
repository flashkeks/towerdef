/**
 * P3 Frage 4: Kippt ein Trait / Level-Multiplikator / Buff-Stack das Spiel?
 *  A) Globaler Multiplikator auf allen Units aller Spieler über die unitMods-Hooks (lvlBp, traitBp), greedy auf Nightmare.
 *  B) Ein einzelner Unit-Typ mit Trait +50 % (traitBp 5000), Rest x1: welcher Typ hebelt am meisten?
 *  C) Banner-Stacks: (1) mehrere Spieler, gleiche Buff-ID; (2) synthetisch banner2..4 (zusätzliche Buff-IDs) gegen den Cap +100 %.
 * Aufruf: npx tsx scripts/sanity/q4-multipliers.ts --part A|B|C [--n 100]
 */
import { createSim, type UnitMod } from '../../src/index.js';
import { argNum, argStr, f1, patched, play, rate, reg, table } from './lib.js';

const part = argStr('part', 'A');
const n = argNum('n', 100);
const UNITS = ['striker', 'gunner', 'blaster', 'banner', 'lancer', 'frost', 'titan', 'farm'];
const mods = (players: number, f: (u: string) => Partial<UnitMod>): UnitMod[] =>
  Array.from({ length: players }, (_, p) => UNITS.map((u) => ({ player: p, unit: u, ...f(u) }))).flat();

if (part === 'A') {
  const ms = [1.0, 1.05, 1.1, 1.15, 1.2, 1.3, 1.5, 1.75, 2.0, 2.5];
  for (const d of ['nightmare', 'hard'] as const) {
    const rows: (string | number)[][] = [];
    for (const m of ms) {
      const row: (string | number)[] = [m.toFixed(2)];
      for (const p of [1, 4]) {
        const um = mods(p, () => ({ lvlBp: Math.round(m * 10000) }));
        const r = rate(n, (seed) => play({ difficulty: d, players: p, seed, bots: reg('greedy'), unitMods: um }));
        row.push(r.pct, r.medWave);
      }
      rows.push(row);
    }
    console.log(`\n### A) Level-/Meta-Multiplikator (lvlBp) auf alle Units, greedy ${d} (n=${n})\n`);
    console.log(table(['Multiplikator', 'Sieg % 1P', 'Wave-Med 1P', 'Sieg % 4P', 'Wave-Med 4P'], rows));
  }
  const rows: (string | number)[][] = [];
  for (const t of [0.1, 0.2, 0.35, 0.5, 1.0]) {
    const row: (string | number)[] = [`+${t * 100} %`];
    for (const p of [1, 4]) {
      const um = mods(p, () => ({ traitBp: Math.round(t * 10000) }));
      const r = rate(n, (seed) => play({ difficulty: 'nightmare', players: p, seed, bots: reg('greedy'), unitMods: um }));
      row.push(r.pct, r.medWave);
    }
    rows.push(row);
  }
  console.log(`\n### A2) Trait (traitBp, additiv) auf alle Units, greedy nightmare (n=${n})\n`);
  console.log(table(['Trait-Bonus', 'Sieg % 1P', 'Wave-Med 1P', 'Sieg % 4P', 'Wave-Med 4P'], rows));
} else if (part === 'B') {
  for (const d of ['nightmare'] as const) {
    const rows: (string | number)[][] = [];
    const base: Record<number, number> = {};
    for (const only of [null, 'striker', 'gunner', 'blaster', 'lancer', 'frost', 'titan']) {
      const row: (string | number)[] = [only ? `${only} +50 %` : '(kein Trait)'];
      for (const p of [1, 4]) {
        const um = only ? mods(p, (u) => (u === only ? { traitBp: 5000 } : {})) : [];
        const r = rate(n, (seed) => play({ difficulty: d, players: p, seed, bots: reg('greedy'), unitMods: um }));
        if (!only) base[p] = r.pct;
        row.push(r.pct, only ? (r.pct - base[p] >= 0 ? '+' : '') + f1(r.pct - base[p]) : '-');
      }
      rows.push(row);
    }
    console.log(`\n### B) Trait +50 % nur auf einem Unit-Typ, greedy ${d} (n=${n})\n`);
    console.log(table(['Trait', 'Sieg % 1P', 'Δ', 'Sieg % 4P', 'Δ'], rows));
  }
} else {
  // C1: Titan + Banner anderer Spieler (gleiche ID) - wirken sie additiv? Messung: Schaden des Titans über 20 s ohne Kills.
  const measure = (setup: (sim: ReturnType<typeof createSim>, titanSlot: number) => void, players: number, data = patched((d) => {
    for (const k of ['normal', 'hard', 'nightmare'] as const) d.difficulties[k].hpBp = 10000 * 1000;
    d.economy.startCoins = 200_000;
  })): number => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players, seed: 1, data, godMode: true });
    const hills = sim.slotCenters().filter((s) => s.kind === 'hill' && s.size === 1).sort((a, b) => sim.coverage(b.x, b.y, 4500) - sim.coverage(a.x, a.y, 4500));
    const ts = hills[0];
    const tid = (sim.apply(0, { type: 'place', unitId: 'titan', x: ts.x, y: ts.y }) as { entityId: number }).entityId;
    setup(sim, ts.id);
    sim.step(1);
    for (let p = 0; p < players; p++) sim.apply(p, { type: 'skipWave' });
    sim.step(900);
    return sim.state.units.find((u) => u.id === tid)?.damageDealt ?? 0;
  };
  const near = (sim: ReturnType<typeof createSim>, slot: number): number[] => {
    const s = sim.slotCenters()[slot];
    return sim.slotCenters().filter((x) => x.size === 1 && x.id !== slot && sim.canPlace(0, 'banner', x.x, x.y) !== 'overlap' && Math.hypot(x.x - s.x, x.y - s.y) <= 3000).map((x) => x.id);
  };
  const base = measure(() => {}, 1);
  const rows: (string | number)[][] = [['kein Banner', 1, f1(1), '-']];
  const addBanners = (owner: (i: number) => number, id: (i: number) => string, k: number, lvl = 5) => (sim: ReturnType<typeof createSim>, slot: number): void => {
    const sl = near(sim, slot);
    for (let i = 0; i < k; i++) {
      const r = sim.apply(owner(i), { type: 'place', unitId: id(i), x: sim.slotCenters()[sl[i]].x, y: sim.slotCenters()[sl[i]].y });
      if (!r.ok) throw new Error(`${id(i)}: ${r.reason}`);
      for (let l = 0; l < lvl; l++) sim.apply(owner(i), { type: 'upgrade', entityId: (r as { entityId: number }).entityId });
    }
  };
  for (const k of [1, 2, 4]) {
    const v = measure(addBanners(() => 0, () => 'banner', k), 1);
    rows.push([`${k} Banner Stufe 5, 1 Spieler`, k, f1(v / base), '(+40 %, nur der höchste je Buff-ID)']);
  }
  for (const k of [2, 4]) {
    const v = measure(addBanners((i) => i % k, () => 'banner', k), k);
    rows.push([`${k} Banner Stufe 5, ${k} Spieler`, k, f1(v / measure(() => {}, k)), 'gleiche Buff-ID: spielerübergreifend nur der höchste']);
  }
  const syn = patched((d) => {
    for (const k of ['normal', 'hard', 'nightmare'] as const) d.difficulties[k].hpBp = 10000 * 1000;
    d.economy.startCoins = 200_000;
    const b = d.units.units.find((u) => u.id === 'banner');
    if (!b) throw new Error('banner');
    for (const i of [2, 3, 4]) d.units.units.push({ ...structuredClone(b), id: `banner${i}` });
  });
  const baseSyn = measure(() => {}, 1, syn);
  for (const k of [2, 3, 4]) {
    const v = measure(addBanners(() => 0, (i) => (i === 0 ? 'banner' : `banner${i + 1}`), k), 1, syn);
    rows.push([`synthetisch: ${k} verschiedene Buff-IDs je +40 % (Σ ${k * 40} %)`, k, f1(v / baseSyn), k * 40 > 100 ? 'Cap +100 % greift' : '']);
  }
  console.log('\n### C) Banner-Stacks: Titan-Schaden in 45 s relativ zum Lauf ohne Banner\n');
  console.log(table(['Aufbau', 'Banner', 'Schaden-Faktor', 'Anmerkung'], rows));
}
