/**
 * Balance-Rauchtest: npm run bot -- "ranger 0-2-4 + bombardier 3-2-0 + hero" medium 1
 * Ohne Argumente: ein paar Standard-Strategien auf allen Schwierigkeiten.
 */
import { parseStrategy, runBot, type BotResult } from '../src/bot.js';
import type { Difficulty } from '../src/types.js';

const DEFAULTS = [
  'ranger 0-2-4 + bombardier 3-2-0 + hero',
  'bombardier 4-2-0 + frostcaller 2-0-4 + hero',
  'frostcaller 5-2-0 + ranger 4-0-2 + hero',
];

function fmt(r: BotResult, ms: number): string {
  const pops = Object.entries(r.pops).filter(([, v]) => v > 0).map(([k, v]) => `${k} ${v}`).join(', ');
  return `${r.result.toUpperCase().padEnd(7)} Runde ${String(r.round).padStart(2)} Leben ${String(r.lives).padStart(3)} Geld ${String(r.cash).padStart(5)} Held L${r.heroLevel} | Pops: ${pops} | ${r.difficulty} | ${ms} ms | ${r.strategy}`;
}

const [, , stratArg, diffArg, seedArg] = process.argv;
const strategies = stratArg ? [stratArg] : DEFAULTS;
const diffs: Difficulty[] = diffArg ? [diffArg as Difficulty] : ['easy', 'medium', 'hard'];
for (const s of strategies) {
  for (const d of diffs) {
    const t0 = Date.now();
    const r = runBot(parseStrategy(s), { difficulty: d, seed: Number(seedArg ?? 1) });
    console.log(fmt(r, Date.now() - t0));
  }
}
