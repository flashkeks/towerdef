/**
 * Runde 4 / P6b: Zusammensetzung des Teams je Wave (Diagnose Striker/Titan).
 * Aufruf: BOT_PROFILE=normal npx tsx scripts/sanity/p6b-diag.ts --bot wide --difficulty hard [--players 1] [--n 20] [--ban striker] [--waves 4,8,12,16,19]
 * Ausgabe: je Stichwave Mittelwert über die Seeds: Anzahl Einheiten je Typ, investierte Münzen je Typ, freie Kleinslots, Münzen auf der Hand, Leben.
 */
import { BOTS } from '../../src/bots/index.js';
import type { BotFactory } from '../../src/bots/types.js';
import type { DifficultyId, Sim } from '../../src/index.js';
import { botTuning } from '../../src/bots/util.js';
import { argNum, argStr, f1, play, table } from './lib.js';

const bn = argStr('bot', 'wide');
const d = argStr('difficulty', 'hard') as DifficultyId;
const n = argNum('n', 20);
const players = argNum('players', 1);
const ban = argStr('ban', '');
const waves = argStr('waves', '4,8,12,16,19').split(',').map(Number);
const UNITS = ['striker', 'gunner', 'blaster', 'banner', 'lancer', 'frost', 'titan', 'farm'];

const banned = (f: BotFactory, id: string): BotFactory => () => {
  const b = f();
  return {
    name: b.name,
    decide: (ctx) => {
      const sim = new Proxy(ctx.sim, {
        get: (t, k) =>
          k === 'apply'
            ? (p: number, c: { type: string; unitId?: string }) => (c.type === 'place' && c.unitId === id ? { ok: false, reason: 'verboten' } : t.apply(p, c as never))
            : (t as unknown as Record<string | symbol, unknown>)[k],
      }) as Sim;
      b.decide({ ...ctx, sim });
    },
  };
};
if (ban) botTuning.banned = [ban];
void banned;
const fac = BOTS[bn];
type Snap = { cnt: Record<string, number>; inv: Record<string, number>; free: number; coins: number; lives: number; k: number };
const acc = new Map<number, Snap>();
let win = 0;
for (let seed = 1; seed <= n; seed++) {
  const seen = new Set<number>();
  const r = play({
    difficulty: d, players, seed, bots: fac,
    beforeTick: (sim) => {
      const w = sim.state.wave;
      if (waves.includes(w) && !seen.has(w) && sim.state.waveOpen) {
        seen.add(w);
        const s = acc.get(w) ?? { cnt: {}, inv: {}, free: 0, coins: 0, lives: 0, k: 0 };
        for (const u of sim.state.units) {
          s.cnt[u.defId] = (s.cnt[u.defId] ?? 0) + 1;
          s.inv[u.defId] = (s.inv[u.defId] ?? 0) + u.invested;
        }
        s.free += sim.slots().filter((x) => x.free && x.size === 1).length;
        s.coins += sim.state.players.reduce((a, p) => a + p.coins, 0);
        s.lives += sim.state.lives;
        s.k++;
        acc.set(w, s);
      }
    },
  });
  if (r.result === 'win') win++;
}
console.log(`\n### ${bn}${ban ? ' ohne ' + ban : ''} ${d} ${players}P n=${n}, Sieg ${f1((win / n) * 100)} %  (Zelle: Anzahl / investierte Münzen)\n`);
const rows = waves.filter((w) => acc.has(w)).map((w) => {
  const s = acc.get(w) as Snap;
  return [w, `n=${s.k}`, ...UNITS.map((u) => `${f1((s.cnt[u] ?? 0) / s.k)} / ${Math.round((s.inv[u] ?? 0) / s.k)}`), f1(s.free / s.k), Math.round(s.coins / s.k), f1(s.lives / s.k)];
});
console.log(table(['Wave', 'Läufe', ...UNITS, 'frei', 'Münzen', 'Leben'], rows));
