import type { Bot, BotContext } from './types.js';
import { donateSurplus, makeEnv, newMemo, playTurn, type Policy } from './util.js';

const SINGLE = new Set(['striker', 'gunner', 'titan', 'lancer']);
const AOE = new Set(['blaster', 'lancer', 'frost']);
const MIX = new Set(['gunner', 'frost', 'titan', 'banner']);

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
        weight: (d) => (d.id === 'banner' || d.id === 'frost' ? 2 : d.id === 'gunner' ? 1 : 0.5),
      };
    else {
      const role = (playerId - 1) % 3;
      const set = role === 0 ? SINGLE : role === 1 ? AOE : MIX;
      p = { weight: (d) => (set.has(d.id) ? 2 : 0.7) };
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
