import type { Bot, BotContext } from './types.js';
import type { UnitDef } from '../data/compile.js';
import { donateSurplus, makeEnv, newMemo, playTurn, roleOf, type Policy } from './util.js';

// Rollen aus den Daten (Runde 7 / P6): Einzelziel = Single/Luft/Titan plus Lancer (Linie), AoE = Flächen-Units und Kontrolle, Mix = Luft, Kontrolle, Titan, Aura, Markierung.
const SINGLE = (d: UnitDef): boolean => ['single', 'air', 'titan'].includes(roleOf(d)) || d.attack?.kind === 'line';
const AOE = (d: UnitDef): boolean => ['aoe', 'control'].includes(roleOf(d));
const MIX = (d: UnitDef): boolean => ['air', 'control', 'titan', 'aura', 'marker'].includes(roleOf(d));

/**
 * Koop-Mix. Spieler 0 = Support/Farm (Farm, Banner, Frost, begrenzte eigene Verteidigung; Überschuss
 * wird an DPS-Spieler gespendet). Spieler 1.. = DPS mit wechselnden Schwerpunkten (Einzelziel, AoE, Luft/Hybrid).
 */
export const coop = (): Bot => {
  const memo = newMemo();
  const cache = new Map<string, Policy>();
  const policyFor = (playerId: number, n: number): Policy => {
    const k = `${playerId}/${n}`;
    let p = cache.get(k);
    if (p) return p;
    if (n === 1) p = { farm: { share: 0.45, sellLate: true } };
    else if (playerId === 0)
      p = {
        farm: { share: 1, sellLate: true },
        maxNonFarmInvest: 1800,
        weight: (d) => (['aura', 'control'].includes(roleOf(d)) ? 2 : roleOf(d) === 'air' ? 1 : 0.5),
      };
    else {
      const role = (playerId - 1) % 3;
      const set = role === 0 ? SINGLE : role === 1 ? AOE : MIX;
      p = { weight: (d) => (set(d) ? 2 : 0.7) };
    }
    cache.set(k, p);
    return p;
  };
  return {
    name: 'coop',
    decide(ctx: BotContext) {
      const n = ctx.sim.state.players.length;
      const pol = policyFor(ctx.playerId, n);
      playTurn(ctx, memo, pol);
      if (n > 1 && ctx.playerId === 0) {
        const env = makeEnv(ctx, memo);
        const farmDef = [...env.defs.values()].find((d) => d.farm);
        // Reserve für den nächsten Farm-Kauf im Fenster, Rest an DPS-Spieler.
        const wantFarm = farmDef && env.wave < 12 ? farmDef.upgradeCosts[0] : 0;
        const others = ctx.sim.state.players.map((p) => p.id).filter((id) => id !== 0);
        donateSurplus(ctx, others, wantFarm + 50);
      }
    },
  };
};
