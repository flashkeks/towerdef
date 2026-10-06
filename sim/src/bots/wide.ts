import type { Bot } from './types.js';
import { policyBot } from './util.js';

/** Viele Units auf niedriger Stufe: erst platzieren (bis Caps/Slots), Upgrades nur bis Stufe 1. */
export const wide = (): Bot =>
  policyBot('wide', {
    // Runde 5 P3b: Support ohne eigenen Schaden (Banner) ist kein Füllmaterial. Vorher füllte `wide` bei verbotener Unit die
    // freien Slots mit 3-4 Bannern und kam nie zum Upgraden (Messartefakt im Leave-one-out).
    canPlace: (d) => !d.aura,
    weight: (_d, kind) => (kind === 'place' ? 3 : 1),
    canUpgrade: (u, _d, env) => {
      if (u.level < 1) return true;
      // volle Breite erreicht? (keine freie Kleinslot-Platzierung mehr möglich)
      const free = env.slots.some((s) => s.free && s.size === 1);
      const typesFull = new Set(env.own.map((x) => x.defId)).size >= 6;
      const capsFull = [...env.defs.values()]
        .filter((d) => d.attack)
        .every((d) => env.own.filter((x) => x.defId === d.id).length >= d.cap || (typesFull && !env.own.some((x) => x.defId === d.id)));
      return !free || capsFull;
    },
  });
