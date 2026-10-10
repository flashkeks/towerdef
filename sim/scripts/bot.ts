/**
 * Balance-Rauchtest: npm run bot -- "ranger 0-2-4 + bombardier 3-2-0 + hero" medium 1
 * Ohne Argumente: ein paar Standard-Strategien auf allen Schwierigkeiten.
 */
import { parseStrategy, runBot, type BotResult } from '../src/bot.js';
import type { Difficulty } from '../src/types.js';

const DEFAULTS = [
  'ranger 0-0-0 + ranger 0-2-4 + bombardier 0-0-0 + bombardier 4-2-0 + hero',
  'ranger 0-0-0 + ranger 0-0-0 + bombardier 4-0-2 + hero',
  'ranger 0-0-0 + ranger 0-4-2 + frostcaller 0-0-0 + frostcaller 2-4-0 + hero',
  'frostcaller 0-0-0 + frostcaller 0-0-0 + frostcaller 2-0-4 + hero',
];

function fmt(r: BotResult, ms: number): string {
  const pops = Object.entries(r.pops).filter(([, v]) => v > 0).map(([k, v]) => `${k} ${v}`).join(', ');
  return `${r.result.toUpperCase().padEnd(7)} Runde ${String(r.round).padStart(2)} Leben ${String(r.lives).padStart(3)} Geld ${String(r.cash).padStart(5)} Held L${r.heroLevel} | Pops: ${pops} | XP ${r.towerXpGained.ranger}/${r.towerXpGained.bombardier}/${r.towerXpGained.frostcaller}/${r.towerXpGained.longshot}/${r.towerXpGained.market}/${r.towerXpGained.thornweaver}/${r.towerXpGained.alchemist} | ${r.difficulty} | ${ms} ms | ${r.strategy}`;
}

const [, , stratArg, diffArg, seedArg] = process.argv;
// Runde 15: BOT_MAP=frostfen|quarry, BOT_MODE=primary-only|...
const MAP = process.env.BOT_MAP ?? 'meadow';
const MODE = (process.env.BOT_MODE ?? 'standard') as import('../src/types.js').ModeId;
const strategies = stratArg ? [stratArg] : DEFAULTS;
const diffs: Difficulty[] = diffArg ? [diffArg as Difficulty] : ['easy', 'medium', 'hard'];
for (const s of strategies) {
  for (const d of diffs) {
    const t0 = Date.now();
    const r = runBot(parseStrategy(s), { difficulty: d, seed: Number(seedArg ?? 1), map: MAP, mode: MODE, towerXp: { ranger: 0, bombardier: 0, frostcaller: 0, longshot: 0, market: 0, thornweaver: 0, alchemist: 0 } });
    console.log(fmt(r, Date.now() - t0));
  }
}
