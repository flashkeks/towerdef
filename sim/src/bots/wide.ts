import type { Bot } from './types.js';
import type { UnitDef } from '../data/compile.js';
import { limitOf, policyBot, roleOf } from './util.js';

/**
 * Runde 7 / P6: höchstens so viele Flächen-Units (`roleOf` = aoe) insgesamt (weitere Exemplare; ein neuer Typ geht immer). Mit zwei Boden-Flächen-Units (Blaster, Mortar) und der Kette füllte `wide` das
 * Team mit 8-9 Flächen-Körpern und ließ Luft und Einzelziele aus (Normal 55 statt 72 %, kalibrierung.md Runde 7 - P6); mit 7: Normal 78, Hard 33.
 */
const WIDE_AOE_MAX = 7;

/** Viele Units auf niedriger Stufe: erst platzieren (bis zum Bot-Limit je Sorte), Upgrades nur bis Stufe 1. */
export const wide = (): Bot =>
  policyBot('wide', {
    // Runde 5 P3b: Support ohne eigenen Schaden (Banner) ist kein Füllmaterial. Vorher füllte `wide` bei verbotener Unit die
    // freien Slots mit 3-4 Bannern und kam nie zum Upgraden (Messartefakt im Leave-one-out).
    canPlace: (d, env) => !d.aura && !d.slowAura && (roleOf(d) !== 'aoe' || !env.own.some((u) => u.defId === d.id) || env.own.filter((u) => roleOf(env.defs.get(u.defId) as UnitDef) === 'aoe').length < WIDE_AOE_MAX),
    weight: (_d, kind) => (kind === 'place' ? 3 : 1),
    canUpgrade: (u, _d, env) => {
      if (u.level < 1) return true;
      // volle Breite erreicht? (jede Sorte auf dem Bot-Limit oder das Team ist voll; kein Regel-Limit, siehe `botTuning.typeLimit`)
      const typesFull = new Set(env.own.map((x) => x.defId)).size >= 6;
      const capsFull = [...env.defs.values()]
        .filter((d) => d.attack)
        .every((d) => env.own.filter((x) => x.defId === d.id).length >= limitOf(d) || (typesFull && !env.own.some((x) => x.defId === d.id)));
      return capsFull;
    },
  });
