/**
 * Spielt ein Match mit Bots und zeichnet die Zeitreihen je Wave aus den Sim-Events auf.
 * Entscheidungstakt wie in `bots/types.ts`: jede Sekunde (20 Ticks) und zu Beginn jeder Wave.
 *
 * Zuordnung: Ausgaben/Einkommen/Verkäufe zur zuletzt gestarteten Wave (Zeit), Leaks und Kills zur Wave des Gegners.
 * Verlust-Wave = Wave des tödlichen Leaks. Bot-PRNG: eigener Zustand je Spieler, abgeleitet vom Match-Seed.
 */
import { compile } from '../data/compile.js';
import { loadGameData } from '../data/load.js';
import type { GameData } from '../data/schema.js';
import { seedRng } from '../prng.js';
import { createSim } from '../sim.js';
import type { SimEvent } from '../state.js';
import { wavePool } from '../systems/waves.js';
import type { Bot } from '../bots/types.js';
import { makeBot } from './resolve.js';
import type { MatchSpec, RunRecord, WaveRec } from './types.js';

let gameData: GameData | undefined;
const getData = (): GameData => (gameData ??= loadGameData());

function newRec(n: number): WaveRec {
  return {
    n,
    coinsStart: 0,
    coinsEnd: -1,
    incomeKill: 0,
    incomeWave: 0,
    incomeFarm: 0,
    spendPlace: 0,
    spendUpgrade: 0,
    sellRefund: 0,
    farmInvest: 0,
    farmYield: 0,
    kills: 0,
    leaks: {},
    leakDmg: {},
    leakCount: 0,
    baseLoss: 0,
    poolHp: 0,
    invested: 0,
    dps: 0,
    units: 0,
  };
}

export function botLabel(bots: string[], players: number): string {
  const used = Array.from({ length: players }, (_, i) => bots[i % bots.length]);
  return new Set(used).size === 1 ? used[0] : used.join('+');
}

export async function recordMatch(spec: MatchSpec): Promise<RunRecord> {
  const data = getData();
  const stageData = data.stages[spec.stage];
  if (!stageData) throw new Error(`Unbekannte Stage ${spec.stage}`);
  const sim = createSim({ stage: spec.stage, difficulty: spec.difficulty, players: spec.players, seed: spec.seed, data, maxWaves: spec.maxWaves });
  // Zweiter Kontext nur zum Berechnen der Wave-Pools (gleiche Parameter wie die Sim).
  const ctx = compile(data, stageData, spec.difficulty, spec.players, { seed: spec.seed });
  const bots: Bot[] = [];
  for (let p = 0; p < spec.players; p++) bots.push(await makeBot(spec.bots[p % spec.bots.length]));
  const rngs = bots.map((_, p) => seedRng(((spec.seed * 2654435761) ^ ((p + 1) * 40503) ^ 0x5bd1e995) >>> 0));
  const farmDefs = new Set(sim.catalog().filter((d) => d.farm).map((d) => d.id));
  const unitDef = new Map(sim.catalog().map((d) => [d.id, d]));
  const farmEntities = new Set<number>();

  const recs = new Map<number, WaveRec>([[0, newRec(0)]]);
  let cur = 0;
  let lossWave: number | null = null;
  const rec = (n: number): WaveRec => {
    let r = recs.get(n);
    if (!r) recs.set(n, (r = newRec(n)));
    return r;
  };
  const coinsNow = (): number => sim.state.players.reduce((a, p) => a + p.coins, 0);

  const handle = (e: SimEvent): void => {
    switch (e.type) {
      case 'waveStart':
        cur = e.wave;
        rec(cur);
        break;
      case 'waveEnd':
        rec(e.wave).coinsEnd = coinsNow();
        break;
      case 'income':
        if (e.source === 'bounty') rec(cur).incomeKill += e.amount;
        else if (e.source === 'waveBonus') rec(cur).incomeWave += e.amount;
        else if (e.source === 'farm') {
          rec(cur).incomeFarm += e.amount;
          rec(cur).farmYield += e.amount;
        }
        break;
      case 'kill':
        rec(e.wave).kills++;
        break;
      case 'leak': {
        const r = rec(e.wave);
        r.leaks[e.enemy] = (r.leaks[e.enemy] ?? 0) + 1;
        r.leakDmg[e.enemy] = (r.leakDmg[e.enemy] ?? 0) + e.damage;
        r.leakCount++;
        r.baseLoss += e.damage;
        lossWave = e.wave;
        break;
      }
      case 'place': {
        const r = rec(cur);
        r.spendPlace += e.cost;
        if (farmDefs.has(e.unit)) {
          r.farmInvest += e.cost;
          farmEntities.add(e.unitId);
        }
        break;
      }
      case 'upgrade': {
        const r = rec(cur);
        r.spendUpgrade += e.cost;
        if (farmEntities.has(e.unitId)) r.farmInvest += e.cost;
        break;
      }
      case 'sell':
        rec(cur).sellRefund += e.refund;
        break;
      default:
        break;
    }
  };

  const maxTicks = spec.maxTicks ?? 400_000;
  let lastWave = -1;
  while (!sim.isOver() && sim.state.tick < maxTicks) {
    const wave = sim.state.wave;
    const waveChanged = wave !== lastWave;
    if (waveChanged || sim.state.tick % 20 === 0) {
      for (let p = 0; p < bots.length; p++) bots[p].decide({ sim, playerId: p, rng: rngs[p] });
      for (const e of sim.drainEvents()) handle(e);
    }
    if (waveChanged && wave > 0) {
      // Schnappschuss nach den Bot-Entscheidungen zu Wave-Beginn.
      const r = rec(wave);
      r.coinsStart = coinsNow();
      let dps = 0;
      let invested = 0;
      for (const u of sim.state.units) {
        invested += u.invested;
        const d = unitDef.get(u.defId);
        const lv = d?.levels[u.level];
        if (d?.attack && lv) dps += (lv.damageCenti * 20) / lv.spaTicks / 100;
      }
      r.invested = invested;
      r.dps = dps;
      r.units = sim.state.units.length;
      r.poolHp = wavePool(ctx, wave) / 100;
    }
    lastWave = wave;
    sim.step(1);
    for (const e of sim.drainEvents()) handle(e);
  }
  for (const e of sim.drainEvents()) handle(e);
  const endWave = sim.state.wave;
  const last = recs.get(endWave);
  if (last && last.coinsEnd < 0) last.coinsEnd = coinsNow();
  const result = sim.result();
  const waves = [...recs.values()].sort((a, b) => a.n - b.n);
  for (const w of waves) if (w.coinsEnd < 0) w.coinsEnd = w.coinsStart;
  return {
    stage: spec.stage,
    botLabel: botLabel(spec.bots, spec.players),
    difficulty: spec.difficulty,
    players: spec.players,
    seed: spec.seed,
    result,
    endWave,
    lossWave: result === 'loss' ? (lossWave ?? endWave) : null,
    ticks: sim.state.tick,
    baseHpEnd: sim.state.baseHp,
    waves,
  };
}
