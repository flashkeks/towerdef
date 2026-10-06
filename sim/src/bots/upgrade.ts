import type { Bot } from './types.js';
import { policyBot } from './util.js';

/** Wenige Units, voll ausgebaut, bevor neu platziert wird (Hochwertige bevorzugt). */
export const upgrade = (): Bot =>
  policyBot('upgrade', {
    weight: (d, kind) => (kind === 'place' ? { rare: 0.8, epic: 1, legendary: 1.6, mythic: 0.7 }[d.rarity] : 1.5),
    canPlace: (_d, env) => {
      if (env.own.length < 2) return true;
      const attackers = env.own.filter((u) => (env.defs.get(u.defId)?.attack ?? null) !== null);
      const mostlyUp = env.own.every((u) => u.level >= Math.ceil((env.defs.get(u.defId)?.maxLevel ?? 0) * 0.5));
      return (mostlyUp || env.coins >= 600) && attackers.length < 6;
    },
  });
