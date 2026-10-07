/**
 * Brücke zwischen `bots/runner.ts` (eine Quelle der Wahrheit für Takt, Bot-RNG und Zeitreihen) und der Aggregation.
 * `fromMatch` wandelt ein `MatchResult` in einen `RunRecord` um (Teamsummen über alle Spieler).
 *
 * Zuordnung wie im Runner: Ökonomie zur Wave, in der sie anfällt (Zeile 0 = Prep); Leaks/Pool/Kills zur Spawn-Wave.
 * Münzen am Wave-Ende n = Münzen beim Start von Wave n+1 (gleicher Tick, vor den Bot-Entscheidungen), letzte Wave: finalCoins.
 * Verlust-Wave: höchste Wave mit Base-Schaden (Näherung der Wave des tödlichen Leaks; Waves überlappen).
 */
import { loadGameData, loadProgression } from '../data/load.js';
import { metaProfileMods } from '../progression.js';
import { runMatch, type MatchResult } from '../bots/index.js';
import type { MatchSpec, RunRecord, WaveRec } from './types.js';

const sum = (a: readonly number[]): number => a.reduce((x, y) => x + y, 0);

export function botLabel(bots: string[], players: number): string {
  const used = Array.from({ length: players }, (_, i) => bots[i % bots.length]);
  return new Set(used).size === 1 ? used[0] : used.join('+');
}

export function fromMatch(m: MatchResult, meta?: string): RunRecord {
  let net = 0; // netto eingesetzte Münzen (Platzierung + Upgrade - Verkaufserlös), kumulativ
  const waves: WaveRec[] = m.waves.map((w, i) => {
    net += sum(w.spentPlace) + sum(w.spentUpgrade) - sum(w.sold);
    const next = m.waves[i + 1];
    const leakCount = sum(Object.values(w.leaks));
    return {
      n: w.wave,
      coinsStart: sum(w.coins),
      coinsEnd: next ? sum(next.coins) : sum(m.finalCoins),
      incomeKill: sum(w.income.kill),
      incomeWave: sum(w.income.wave),
      incomeFarm: sum(w.income.farm),
      spendPlace: sum(w.spentPlace),
      spendUpgrade: sum(w.spentUpgrade),
      sellRefund: sum(w.sold),
      farmInvest: sum(w.farmInvest),
      farmYield: sum(w.farmYield),
      kills: w.kills,
      leaks: w.leaks,
      leakDmg: {}, // der Runner schlüsselt den Schaden nicht nach Typ auf (stats rechnet über Leak-Werte)
      leakCount,
      baseLoss: w.baseHpLost,
      poolHp: w.poolHp,
      invested: net,
    };
  });
  let lossWave: number | null = null;
  if (m.result === 'loss') {
    for (const w of waves) if (w.baseLoss > 0) lossWave = w.n;
    lossWave ??= m.endWave;
  }
  return {
    stage: m.stage,
    botLabel: botLabel(m.bots, m.players) + (meta ? `[${meta}]` : ''),
    difficulty: m.difficulty,
    players: m.players,
    seed: m.seed,
    result: m.result === 'timeout' ? null : m.result,
    endWave: m.endWave,
    lossWave,
    ticks: m.ticks,
    baseHpEnd: m.baseHp,
    waves,
  };
}

let metaCache: { ids: string[]; prog: ReturnType<typeof loadProgression> } | null = null;
function modsFor(spec: MatchSpec) {
  if (!spec.meta) return undefined;
  metaCache ??= { ids: loadGameData().units.units.map((u) => u.id), prog: loadProgression() };
  return metaProfileMods(metaCache.prog, spec.meta, metaCache.ids, spec.players);
}

export function recordMatch(spec: MatchSpec): RunRecord {
  const bots = Array.from({ length: spec.players }, (_, i) => spec.bots[i % spec.bots.length]);
  return fromMatch(
    runMatch({
      stage: spec.stage,
      difficulty: spec.difficulty,
      players: spec.players,
      seed: spec.seed,
      bots,
      maxWaves: spec.maxWaves,
      unitMods: modsFor(spec),
      maxTicks: spec.maxTicks ?? (spec.maxWaves ? spec.maxWaves * 1000 + 2000 : undefined),
    }),
    spec.meta,
  );
}
