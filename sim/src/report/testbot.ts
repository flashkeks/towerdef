/**
 * Minimaler Test-Bot (nur für Report-Tests und CLI-Smoke-Tests, unabhängig von sim/src/bots/):
 * baut zuerst Striker/Gunner, dann Farm, Banner und Blaster, und upgradet reihum die billigste Unit.
 * `testfarm` kauft früh eine Farm. Entscheidet nur über sim.apply().
 */
import type { Bot, BotContext } from '../bots/types.js';

function freeSlot(ctx: BotContext, kind: 'ground' | 'hill', size: 1 | 2 = 1): number | undefined {
  return ctx.sim.slots().find((s) => s.free && s.kind === kind && s.size === size)?.id;
}

function make(name: string, farmFirst: boolean): Bot {
  const wishes = farmFirst
    ? ['farm', 'striker', 'gunner', 'banner', 'blaster', 'striker']
    : ['striker', 'gunner', 'blaster', 'banner', 'farm', 'striker', 'gunner'];
  return {
    name,
    decide(ctx) {
      const { sim, playerId } = ctx;
      const mine = sim.state.units.filter((u) => u.owner === playerId);
      const have = new Map<string, number>();
      for (const u of mine) have.set(u.defId, (have.get(u.defId) ?? 0) + 1);
      for (const id of wishes) {
        const want = wishes.filter((x) => x === id).length;
        if ((have.get(id) ?? 0) >= want) continue;
        const def = sim.catalog().find((d) => d.id === id);
        if (!def) continue;
        const hill = def.placement === 'hill' || def.placement === 'hybrid';
        const slot = def.footprint === 2 ? freeSlot(ctx, 'ground', 2) : (hill ? freeSlot(ctx, 'hill') : undefined) ?? freeSlot(ctx, 'ground');
        if (slot === undefined) continue;
        if (sim.apply(playerId, { type: 'place', unitId: id, slot }).ok) have.set(id, (have.get(id) ?? 0) + 1);
      }
      let best: { id: number; cost: number } | undefined;
      for (const u of mine) {
        const cost = sim.upgradeCost(u.id);
        if (cost !== null && (!best || cost < best.cost)) best = { id: u.id, cost };
      }
      if (best) sim.apply(playerId, { type: 'upgrade', entityId: best.id });
    },
  };
}

export const TEST_BOTS: Record<string, () => Bot> = {
  testbot: () => make('testbot', false),
  testfarm: () => make('testfarm', true),
};
