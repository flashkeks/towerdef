import { auto } from './auto.js';
import type { BotFactory } from './types.js';

export type { Bot, BotContext, BotFactory } from './types.js';
export { runMatch, type MatchOptions, type MatchResult, type WaveStat } from './runner.js';
export { auto, bestSpot, dpsScore } from './auto.js';

/**
 * Bots (Runde 8: nur Rauchtest, kein Balancing). Namen:
 *  - `auto`            4 zufällige Angreifer aus dem Katalog (Bot-PRNG), platzieren und ausbauen
 *  - `auto-N`          dasselbe mit N Units
 *  - `mono-ID[,ID..]`  genau diese Unit(s)
 */
export function getBot(name: string): BotFactory {
  if (name === 'auto') return () => auto(null);
  const n = /^auto-(\d+)$/.exec(name);
  if (n) return () => auto(null, Number(n[1]));
  const m = /^mono-(.+)$/.exec(name);
  if (m) return () => auto(m[1].split(','));
  throw new Error(`Unbekannter Bot "${name}" (auto, auto-N, mono-ID[,ID])`);
}
