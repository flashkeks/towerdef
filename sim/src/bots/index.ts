import { aoe } from './aoe.js';
import { coop } from './coop.js';
import { farm } from './farm.js';
import { greedy } from './greedy.js';
import { upgrade } from './upgrade.js';
import { wide } from './wide.js';
import type { BotFactory } from './types.js';

export type { Bot, BotContext, BotFactory } from './types.js';
export { runMatch, type MatchOptions, type MatchResult, type WaveStat } from './runner.js';

export const BOTS: Record<string, BotFactory> = { greedy, farm, aoe, upgrade, wide, coop };

export function getBot(name: string): BotFactory {
  const f = BOTS[name];
  if (!f) throw new Error(`Unbekannter Bot "${name}" (verfügbar: ${Object.keys(BOTS).join(', ')})`);
  return f;
}
