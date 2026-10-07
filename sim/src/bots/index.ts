import { aoe } from './aoe.js';
import { coop } from './coop.js';
import { farm } from './farm.js';
import { mono } from './mono.js';
import { greedy } from './greedy.js';
import { upgrade } from './upgrade.js';
import { wide } from './wide.js';
import type { BotFactory } from './types.js';
import { botTuning, newMemo, takeCard, withProfile } from './util.js';

export type { Bot, BotContext, BotFactory } from './types.js';
export { runMatch, type MatchOptions, type MatchResult, type WaveStat } from './runner.js';

export const BOTS: Record<string, BotFactory> = { greedy, farm, aoe, upgrade, wide, coop };

/**
 * Bot nach Name. Suffix `+cards` schaltet die Risikokarten-Strategie ein (P4, K1), z. B. `upgrade+cards`; die Registry-Bots
 * ohne Suffix nehmen keine Karten (vergleichbar mit den Messungen der Runden 1-4 P3).
 */
export function getBot(name: string): BotFactory {
  // Profil (P6, Fehlermodell): `aoe@normal`, `upgrade+cards@casual`, `@none` = fehlerfrei. Ohne `@`: `botTuning.profile` (Standard: fehlerfrei).
  const at = name.indexOf('@');
  if (at >= 0) {
    const inner = getBot(name.slice(0, at));
    const profile = name.slice(at + 1);
    return () => {
      const b = withProfile(profile, inner);
      return { name, decide: (ctx) => b.decide(ctx) };
    };
  }
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
  // `mono-X` / `mono-X+up` (Runde 6 / P2): nur die Unit X, so viele wie bezahlbar (`+up`: danach auch Upgrades).
  const m = /^mono-([a-z]+)(\+up)?$/.exec(name);
  if (m) return () => mono(m[1], !!m[2]);
  const f = BOTS[name];
  if (!f) throw new Error(`Unbekannter Bot "${name}" (verfügbar: ${Object.keys(BOTS).join(', ')})`);
  return f;
}
