/**
 * Runde 4 / P6b: Bedarfsprüfung des Boss-Plans. Läufe OHNE Titan (Verbot per Proxy), je Lauf das Verhältnis
 * Team-Schaden-auf-Boss / Boss-HP (`bossCapacityRatio`) zu Beginn von Wave 7 (Boss W10) bzw. 17 (Boss W20), dazu der Ausgang
 * (Boss-Leak). Zeigt, ab welchem Verhältnis der Boss auch ohne Titan fällt.
 * Aufruf: BOT_PROFILE=normal npx tsx scripts/sanity/p6b-boss.ts --difficulty hard --players 1 --n 40 [--bots wide,aoe]
 */
import { BOTS } from '../../src/bots/index.js';
import type { BotFactory } from '../../src/bots/types.js';
import { botTuning, bossCapacityRatio, makeEnv, newMemo } from '../../src/bots/util.js';
import { seedRng } from '../../src/prng.js';
import type { DifficultyId, Sim } from '../../src/index.js';
import { argNum, argStr, f1, play, table } from './lib.js';

const d = argStr('difficulty', 'hard') as DifficultyId;
const n = argNum('n', 40);
const players = argNum('players', 1);
const botNames = argStr('bots', Object.keys(BOTS).join(',')).split(',');
const withTitan = argStr('titan', 'no') === 'yes';
const ban = (f: BotFactory): BotFactory => () => {
  const b = f();
  return {
    name: b.name,
    decide: (ctx) => {
      const sim = new Proxy(ctx.sim, {
        get: (t, k) =>
          k === 'apply'
            ? (p: number, c: { type: string; unitId?: string }) => (c.type === 'place' && c.unitId === 'titan' ? { ok: false, reason: 'verboten' } : t.apply(p, c as never))
            : (t as unknown as Record<string | symbol, unknown>)[k],
      }) as Sim;
      b.decide({ ...ctx, sim });
    },
  };
};
void ban;
if (!withTitan) botTuning.banned = ['titan'];
const rows: (string | number)[][] = [];
const all: { bot: string; w: number; r: number; leak: boolean }[] = [];
for (const bn of botNames) {
  let win = 0;
  const per: Record<number, { r: number; leak: boolean }[]> = { 10: [], 20: [] };
  for (let seed = 1; seed <= n; seed++) {
    const seen = new Set<number>();
    const ratios: Record<number, number> = {};
    const ratios1: Record<number, number> = {};
    const seen1 = new Set<number>();
    const r = play({
      difficulty: d, players, seed, bots: BOTS[bn],
      beforeTick: (sim) => {
        for (const bw of [10, 20]) {
          if (sim.state.wave === bw - 3 && !seen.has(bw) && sim.state.waveOpen) {
            seen.add(bw);
            const env = makeEnv({ sim, playerId: 0, rng: seedRng(1) }, newMemo());
            const q = bossCapacityRatio(env, bw);
            if (q !== null) ratios[bw] = q;
          }
          if (sim.state.wave === bw - Number(argStr('early', '1')) && !seen1.has(bw) && sim.state.waveOpen) {
            seen1.add(bw);
            const env = makeEnv({ sim, playerId: 0, rng: seedRng(1) }, newMemo());
            const q = bossCapacityRatio(env, bw);
            if (q !== null) ratios1[bw] = q;
          }
        }
      },
    });
    if (r.result === 'win') win++;
    for (const bw of [10, 20]) if (ratios[bw] !== undefined) {
      const leak = (r.leaks[`boss@${bw}`] ?? 0) > 0;
      per[bw].push({ r: ratios[bw], leak });
      all.push({ bot: bn, w: bw, r: ratios[bw], leak });
      if (process.argv.includes('--csv')) console.log(`CSV,${bn},${d},${players},${bw},${ratios[bw].toFixed(3)},${(ratios1[bw] ?? NaN).toFixed(3)},${leak ? 1 : 0}`);
    }
  }
  const mean = (a: number[]): string => (a.length ? f1(a.reduce((x, y) => x + y, 0) / a.length * 100) : '-');
  rows.push([bn, f1((win / n) * 100), ...[10, 20].flatMap((bw) => [per[bw].length, mean(per[bw].filter((x) => !x.leak).map((x) => x.r)), mean(per[bw].filter((x) => x.leak).map((x) => x.r)), per[bw].filter((x) => x.leak).length])]);
}
console.log(`\n### Boss-Bedarf ${d} ${players}P n=${n}, ${withTitan ? 'mit' : 'OHNE'} Titan. Verhältnis in % (Kapazität/Boss-HP) bei Wave 7 bzw. 17\n`);
console.log(table(['Bot', 'Sieg %', 'W10 Läufe', 'W10 R% ohne Leak', 'W10 R% mit Leak', 'W10 Leaks', 'W20 Läufe', 'W20 R% ohne Leak', 'W20 R% mit Leak', 'W20 Leaks'], rows));
// Trennschärfe: für jede Schwelle Anteil richtig (Leak <=> R < Schwelle)
for (const bw of [10, 20]) {
  const a = all.filter((x) => x.w === bw);
  const line: string[] = [];
  for (let t = 20; t <= 300; t += 20) line.push(`${t}%: ${f1((a.filter((x) => x.leak === x.r * 100 < t).length / Math.max(1, a.length)) * 100)}`);
  console.log(`\nW${bw} (n=${a.length}, Leaks ${a.filter((x) => x.leak).length}) Trefferquote je Schwelle: ${line.join(' | ')}`);
}
