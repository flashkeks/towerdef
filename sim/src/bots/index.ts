import { aoe } from './aoe.js';
import { coop } from './coop.js';
import { farm } from './farm.js';
import { greedy } from './greedy.js';
import { upgrade } from './upgrade.js';
import { wide } from './wide.js';
import type { BotFactory } from './types.js';
import { botTuning, newMemo, takeCard } from './util.js';

export type { Bot, BotContext, BotFactory } from './types.js';
export { runMatch, type MatchOptions, type MatchResult, type WaveStat } from './runner.js';

export const BOTS: Record<string, BotFactory> = { greedy, farm, aoe, upgrade, wide, coop };

/**
 * Bot nach Name. Suffix `+cards` schaltet die Risikokarten-Strategie ein (P4, K1), z. B. `upgrade+cards`; die Registry-Bots
 * ohne Suffix nehmen keine Karten (vergleichbar mit den Messungen der Runden 1-4 P3).
 */
export function getBot(name: string): BotFactory {
  if (name.endsWith('+cards')) {
    const base = BOTS[name.slice(0, -6)];
    if (!base) throw new Error(`Unbekannter Bot "${name}" (verfügbar: ${Object.keys(BOTS).join(', ')}, jeweils auch mit +cards)`);
    return () => {
      const b = base();
      const memo = newMemo();
      return {
        name,
        decide: (ctx) => {
          if (!botTuning.cardsDisabled) takeCard(ctx, memo);
          b.decide(ctx);
        },
      };
    };
  }
  const f = BOTS[name];
  if (!f) throw new Error(`Unbekannter Bot "${name}" (verfügbar: ${Object.keys(BOTS).join(', ')})`);
  return f;
}
