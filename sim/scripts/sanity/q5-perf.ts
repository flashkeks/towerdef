/**
 * P3 Frage 5: Performance Infinite. Ticks/s (Median aus mehreren Läufen) und Zeit je Tick im schlechtesten Fall.
 *  S1 realistisch: Infinite, Koop 4 Spieler, greedy-Bots, echte Map (nur 26 Slots -> max. 26 Units), bis Wave 40, godMode.
 *  S2 Stress: synthetische Map mit 70 Slots (Pfad wie Standard), 4 Spieler x 15 = 60 Units voll ausgebaut,
 *     Gegner langsam (Speed x0,25) und zäh (HP x30), Infinite-Pool x4, Gegner-Limit 80 -> bis zu 80 Gegner gleichzeitig.
 * Gemessen wird nur `sim.step(1)` (Bot-Entscheidungen und Platzierung zählen nicht).
 * Aufruf: npx tsx scripts/sanity/q5-perf.ts [--runs 5]
 */
import os from 'node:os';
import { createSim, type Sim, type StageData } from '../../src/index.js';
import { reg, patched, argNum, median, f1, table } from './lib.js';
import { seedRng } from '../../src/prng.js';

const runs = argNum('runs', 5);

interface Stat {
  ticks: number;
  sec: number;
  tps: number;
  maxMs: number;
  p99Ms: number;
  meanMs: number;
  maxEnemies: number;
  meanEnemies: number;
  units: number;
  heavyMeanMs: number;
  heavyTicks: number;
  heavyMaxMs: number;
}

function measure(sim: Sim, maxTick: number, onSecond?: () => void): Stat {
  const times: number[] = [];
  let sumE = 0;
  let maxE = 0;
  const heavy: number[] = [];
  const st = sim.state;
  while (!sim.isOver() && st.tick < maxTick) {
    if (st.tick % 20 === 0) onSecond?.();
    const t0 = performance.now();
    sim.step(1);
    const dt = performance.now() - t0;
    times.push(dt);
    sumE += st.enemies.length;
    maxE = Math.max(maxE, st.enemies.length);
    if (st.enemies.length >= 70) heavy.push(dt);
  }
  const sum = times.reduce((a, b) => a + b, 0);
  const s = [...times].sort((a, b) => a - b);
  const hs = [...heavy].sort((a, b) => a - b);
  return {
    ticks: times.length,
    sec: sum / 1000,
    tps: times.length / (sum / 1000),
    maxMs: s[s.length - 1],
    p99Ms: s[Math.floor(s.length * 0.99)],
    meanMs: sum / times.length,
    maxEnemies: maxE,
    meanEnemies: sumE / times.length,
    units: st.units.length,
    heavyMeanMs: heavy.length ? heavy.reduce((a, b) => a + b, 0) / heavy.length : 0,
    heavyTicks: heavy.length,
    heavyMaxMs: hs.length ? hs[hs.length - 1] : 0,
  };
}

// ---- S1 -------------------------------------------------------------------
function s1(seed: number): Stat {
  const sim = createSim({ stage: 'infinite', difficulty: 'normal', players: 4, seed, godMode: true, maxWaves: 40 });
  const bots = [0, 1, 2, 3].map(() => reg('greedy')());
  const rngs = [0, 1, 2, 3].map((i) => seedRng(seed * 7 + i + 1));
  const decide = (): void => {
    for (let p = 0; p < 4; p++) bots[p].decide({ sim, playerId: p, rng: rngs[p] });
    sim.drainEvents();
  };
  decide();
  return measure(sim, 100000, decide);
}

// ---- S2 -------------------------------------------------------------------
function s2(seed: number): Stat {
  const data = patched((d) => {
    d.economy.startCoins = 5_000_000;
    d.economy.caps.enemies = 80;
    if (d.economy.infinite) {
      d.economy.infinite.enemyCap = 80;
      d.economy.infinite.poolMilli *= 4;
    }
    for (const k of ['normal', 'hard', 'nightmare'] as const) {
      d.difficulties[k].hpBp = d.difficulties[k].hpBp * 30;
      d.difficulties[k].speedBp = 2500;
    }
  });
  const base = data.stages['infinite'] as StageData;
  const slots = [...base.slots];
  for (let i = 0; slots.length < 96; i++) {
    const k = slots.length;
    slots.push({ id: k, x: 1 + (i % 13), y: 2.5 + Math.floor(i / 13) * 3 + (i % 2 ? 0.5 : 0), kind: i % 2 ? 'hill' : 'ground', size: 1 } as StageData['slots'][number]);
  }
  const stage: StageData = { ...base, slots };
  const sim = createSim({ stage, difficulty: 'normal', players: 4, seed, data, godMode: true, maxWaves: 25 });
  const plan: [string, number][] = [['striker', 5], ['gunner', 5], ['blaster', 4], ['frost', 1]];
  const free = (kind: string): number[] => sim.slots().filter((s) => s.free && s.size === 1 && s.kind === kind).map((s) => s.id);
  let placed = 0;
  for (let p = 0; p < 4 && placed < 60; p++) {
    for (const [u, c] of plan) {
      for (let i = 0; i < c; i++) {
        const kind = u === 'gunner' ? 'hill' : 'ground';
        const r = sim.apply(p, { type: 'place', unitId: u, slot: free(kind)[0] });
        if (!r.ok) throw new Error(`${u}: ${r.reason}`);
        while (sim.apply(p, { type: 'upgrade', entityId: (r as { entityId: number }).entityId }).ok);
        placed++;
      }
    }
  }
  const use = (): void => {
    for (const u of sim.state.units) if (u.defId === 'frost' && u.abilityCd <= 0) sim.apply(u.owner, { type: 'useAbility', entityId: u.id });
  };
  return measure(sim, 100000, use);
}

const out: (string | number)[][] = [];
for (const [name, fn] of [['S1 realistisch: Infinite, 4P greedy, <= 26 Units, bis Wave 40', s1], ['S2 Stress: 60 Units voll ausgebaut, bis 80 Gegner, 4P', s2]] as const) {
  fn(1); // Warm-up (JIT)
  const all: Stat[] = [];
  for (let r = 0; r < runs; r++) all.push(fn(r + 1));
  const med = (f: (s: Stat) => number): number => median(all.map(f));
  out.push([
    name,
    all[0].units,
    Math.round(med((s) => s.ticks)),
    f1(med((s) => s.meanEnemies)),
    Math.max(...all.map((s) => s.maxEnemies)),
    Math.round(med((s) => s.tps)),
    Math.round(med((s) => s.meanMs * 1000)),
    f1(med((s) => s.p99Ms)),
    f1(Math.max(...all.map((s) => s.maxMs))),
    all[0].heavyTicks ? `${Math.round(med((s) => 1000 / s.heavyMeanMs))} (${all[0].heavyTicks} Ticks, max ${f1(Math.max(...all.map((s) => s.heavyMaxMs)))} ms)` : '-',
  ]);
}
console.log(`Node ${process.version}, ${os.cpus()[0].model} (${os.cpus().length} Kerne), ${os.platform()} ${os.release()}, Median aus ${runs} Läufen`);
console.log(table(['Szenario', 'Units', 'Ticks/Lauf', 'Ø Gegner', 'max Gegner', 'Ticks/s (Median)', 'Ø µs/Tick', 'P99 ms/Tick', 'max ms/Tick', 'Ticks/s bei >= 70 Gegnern'], out));
