/** Aggregation von RunRecords zu CellStats. Reine Funktionen, deterministisch (nearest-rank-Perzentile). */
import { loadGameData } from '../data/load.js';
import type { CellStats, Dist, RunRecord, WaveRec, WaveStats } from './types.js';

export function sortedNums(xs: readonly number[]): number[] {
  return [...xs].sort((a, b) => a - b);
}

/** Nearest-rank-Perzentil q in (0,1] auf aufsteigend sortierten Werten. */
export function pctSorted(s: readonly number[], q: number): number {
  if (s.length === 0) return 0;
  const k = Math.min(s.length, Math.max(1, Math.ceil(q * s.length)));
  return s[k - 1];
}

export function median(xs: readonly number[]): number {
  const s = sortedNums(xs);
  if (s.length === 0) return 0;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function dist(xs: readonly number[]): Dist {
  const s = sortedNums(xs);
  return { p10: pctSorted(s, 0.1), med: median(s), p90: pctSorted(s, 0.9) };
}

/** Leak-Schaden je Typ aus economy.json (der Runner schlüsselt den Schaden nicht nach Typ auf). */
let leakDmgCache: Record<string, number> | undefined;
const leakDmgTable = (): Record<string, number> => (leakDmgCache ??= loadGameData().economy.leakDamage as Record<string, number>);
const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);
const div = (a: number, b: number): number => (b > 0 ? a / b : 0);

export function cellKey(r: Pick<RunRecord, 'stage' | 'botLabel' | 'difficulty' | 'players'>): string {
  return `${r.stage}|${r.botLabel}|${r.difficulty}|${r.players}`;
}

function waveStats(n: number, runs: RunRecord[]): WaveStats {
  const recs: { r: RunRecord; w: WaveRec }[] = [];
  for (const r of runs) {
    const w = r.waves.find((x) => x.n === n);
    if (w) recs.push({ r, w });
  }
  const reached = recs.length;
  const lostHere = runs.filter((r) => r.result === 'loss' && r.lossWave === n).length;
  const incTotal = (w: WaveRec): number => w.incomeKill + w.incomeWave + w.incomeFarm;
  const leakTypes: Record<string, number> = {};
  for (const { w } of recs) for (const [t, c] of Object.entries(w.leaks)) leakTypes[t] = (leakTypes[t] ?? 0) + c;
  for (const t of Object.keys(leakTypes)) leakTypes[t] = div(leakTypes[t], reached);
  const withInv = recs.filter(({ w }) => w.invested > 0);
  return {
    n,
    reached,
    reachedFrac: div(reached, runs.length),
    lostHere,
    lossRate: div(lostHere, runs.length),
    hazard: div(lostHere, reached),
    leakRate: div(recs.filter(({ w }) => w.leakCount > 0).length, reached),
    coins: dist(recs.map(({ w }) => w.coinsEnd)),
    income: dist(recs.map(({ w }) => incTotal(w))),
    incKill: median(recs.map(({ w }) => w.incomeKill)),
    incWave: median(recs.map(({ w }) => w.incomeWave)),
    incFarm: median(recs.map(({ w }) => w.incomeFarm)),
    farmShare: div(sum(recs.map(({ w }) => w.incomeFarm)), sum(recs.map(({ w }) => incTotal(w)))),
    poolPerCoin: median(withInv.map(({ w }) => w.poolHp / w.invested)),
    baseLossMean: div(sum(recs.map(({ w }) => w.baseLoss)), reached),
    leaksByType: leakTypes,
  };
}

export function aggregateCell(runs: RunRecord[]): CellStats {
  if (runs.length === 0) throw new Error('aggregateCell: keine Runs');
  const first = runs[0];
  const allWaves = runs.flatMap((r) => r.waves);
  const incomeAll = sum(allWaves.map((w) => w.incomeKill + w.incomeWave + w.incomeFarm));
  const place = sum(allWaves.map((w) => w.spendPlace));
  const upg = sum(allWaves.map((w) => w.spendUpgrade));
  const maxWave = Math.max(...runs.map((r) => r.endWave), 0);
  const waves: WaveStats[] = [];
  for (let n = 1; n <= maxWave; n++) waves.push(waveStats(n, runs));

  const paybacks: number[] = [];
  for (const r of runs) {
    const invest = sum(r.waves.map((w) => w.farmInvest));
    const yields = r.waves.filter((w) => w.farmYield > 0);
    if (invest > 0 && yields.length > 0) paybacks.push(invest / (sum(yields.map((w) => w.farmYield)) / yields.length));
  }

  const leakCount: Record<string, number> = {};
  const leakDmg: Record<string, number> = {};
  for (const w of allWaves) {
    for (const [t, c] of Object.entries(w.leaks)) {
      leakCount[t] = (leakCount[t] ?? 0) + c;
      leakDmg[t] = (leakDmg[t] ?? 0) + c * (leakDmgTable()[t] ?? 1);
    }
  }
  const totalLeaks = sum(Object.values(leakCount));
  const leakSources = Object.keys(leakCount)
    .sort((a, b) => leakCount[b] - leakCount[a] || (a < b ? -1 : 1))
    .map((type) => ({ type, count: leakCount[type], share: div(leakCount[type], totalLeaks), damage: leakDmg[type] }));

  return {
    key: cellKey(first),
    stage: first.stage,
    bot: first.botLabel,
    difficulty: first.difficulty,
    players: first.players,
    runs: runs.length,
    wins: runs.filter((r) => r.result === 'win').length,
    losses: runs.filter((r) => r.result === 'loss').length,
    capped: runs.filter((r) => r.result === null).length,
    winRate: div(runs.filter((r) => r.result === 'win').length, runs.length),
    endWave: dist(runs.map((r) => r.endWave)),
    minutes: dist(runs.map((r) => r.ticks / 20 / 60)),
    farmShareIncome: div(sum(allWaves.map((w) => w.incomeFarm)), incomeAll),
    upgradeShare: div(upg, place + upg),
    farmPayback: { med: median(paybacks), n: paybacks.length },
    leakSources,
    waves,
  };
}

/** Gruppiert nach Zelle (stabile Reihenfolge: erstes Auftreten) und aggregiert. */
export function aggregate(records: RunRecord[]): CellStats[] {
  const groups = new Map<string, RunRecord[]>();
  for (const r of records) {
    const k = cellKey(r);
    let g = groups.get(k);
    if (!g) groups.set(k, (g = []));
    g.push(r);
  }
  return [...groups.values()].map(aggregateCell);
}
