import type { Bot } from './types.js';
import { policyBot } from './util.js';

/** Viele Units auf niedriger Stufe: erst platzieren (bis Caps/Slots), Upgrades nur bis Stufe 1. */
export const wide = (): Bot =>
  policyBot('wide', {
    weight: (_d, kind) => (kind === 'place' ? 3 : 1),
    canUpgrade: (u, _d, env) => {
      if (u.level < 1) return true;
      // volle Breite erreicht? (keine freie Kleinslot-Platzierung mehr möglich)
      const free = env.slots.some((s) => s.free && s.size === 1);
      const typesFull = new Set(env.own.map((x) => x.defId)).size >= 6;
      const capsFull = [...env.defs.values()]
        .filter((d) => d.attack || d.aura)
        .every((d) => env.own.filter((x) => x.defId === d.id).length >= d.cap || (typesFull && !env.own.some((x) => x.defId === d.id)));
      return !free || capsFull;
    },
  });
