/**
 * Befehle (werden zu Tick-Beginn angewendet: `Sim.apply` wirkt auf den Zustand zwischen zwei Ticks,
 * also vor der Verarbeitung des nächsten Ticks). Rückgabe: `{ok:true, entityId?}` oder `{ok:false, reason}`.
 */
import type { TargetMode, World } from './state.js';
import { triggerAbility } from './systems/abilities.js';
import { addCoins, flushDamage, sellValue } from './systems/economy.js';

export type Command =
  | { type: 'place'; unitId: string; slot: number }
  | { type: 'upgrade'; entityId: number }
  | { type: 'sell'; entityId: number }
  | { type: 'setTargeting'; entityId: number; mode: TargetMode }
  | { type: 'useAbility'; entityId: number }
  | { type: 'skipWave' }
  /** Erweiterung (§16): Münzen an Mitspieler in 50er-Schritten. */
  | { type: 'donate'; to: number; amount: number };

export type CommandResult = { ok: true; entityId?: number } | { ok: false; reason: string };

const fail = (reason: string): CommandResult => ({ ok: false, reason });

export function applyCommand(w: World, playerId: number, cmd: Command): CommandResult {
  const { state, ctx } = w;
  const player = state.players[playerId];
  if (!player) return fail('unknown-player');
  if (state.phase === 'over') return fail('game-over');
  const eco = ctx.data.economy;

  switch (cmd.type) {
    case 'place': {
      const def = ctx.units[cmd.unitId];
      if (!def) return fail('unknown-unit');
      const slot = ctx.slots[cmd.slot];
      if (!slot || !Number.isInteger(cmd.slot)) return fail('invalid-slot');
      if (state.units.some((u) => u.slot === cmd.slot)) return fail('slot-occupied');
      if (def.placement !== 'hybrid' && def.placement !== slot.kind) return fail('slot-kind');
      if (def.footprint > slot.size) return fail('slot-size');
      const own = state.units.filter((u) => u.owner === playerId);
      if (own.filter((u) => u.defId === def.id).length >= def.cap) return fail('cap-reached');
      if (state.units.length >= eco.caps.teamUnits) return fail('team-limit');
      // DESIGN-OFFEN: Team-Slots = höchstens 6 verschiedene Unit-Typen gleichzeitig je Spieler.
      if (!own.some((u) => u.defId === def.id) && new Set(own.map((u) => u.defId)).size >= eco.caps.teamSlots) {
        return fail('team-slots');
      }
      if (player.coins < def.placeCost) return fail('not-enough-coins');
      player.coins -= def.placeCost;
      const mod = w.unitMods.find((m) => m.player === playerId && m.unit === def.id);
      const id = state.nextId++;
      state.units.push({
        id,
        defId: def.id,
        owner: playerId,
        slot: cmd.slot,
        level: 0,
        invested: def.placeCost,
        targeting: def.defaultTargeting,
        cd: 0,
        // DESIGN-OFFEN: Fähigkeiten sind ab Platzierung bereit (Abklingzeit 0); es gibt keinen Auto-Ability-Schalter im Kern.
        abilityCd: 0,
        lvlBp: mod?.lvlBp ?? 10000,
        traitBp: mod?.traitBp ?? 0,
        yieldBp: mod?.yieldBp ?? 10000,
        damageDealt: 0,
        damageReported: 0,
      });
      w.events.push({ type: 'place', tick: state.tick, player: playerId, unitId: id, unit: def.id, slot: cmd.slot, cost: def.placeCost });
      return { ok: true, entityId: id };
    }
    case 'upgrade': {
      const u = state.units.find((x) => x.id === cmd.entityId);
      if (!u) return fail('unknown-entity');
      if (u.owner !== playerId) return fail('not-owner');
      const def = ctx.units[u.defId];
      if (u.level >= def.maxLevel) return fail('max-level');
      const cost = def.upgradeCosts[u.level];
      if (player.coins < cost) return fail('not-enough-coins');
      player.coins -= cost;
      u.invested += cost;
      u.level++;
      w.events.push({ type: 'upgrade', tick: state.tick, player: playerId, unitId: u.id, level: u.level, cost });
      return { ok: true, entityId: u.id };
    }
    case 'sell': {
      const u = state.units.find((x) => x.id === cmd.entityId);
      if (!u) return fail('unknown-entity');
      if (u.owner !== playerId) return fail('not-owner');
      const refund = sellValue(ctx.units[u.defId], u);
      flushDamage(w, u);
      state.units = state.units.filter((x) => x.id !== u.id);
      state.stats.coinsSold += refund;
      addCoins(w, playerId, refund, 'sell');
      w.events.push({ type: 'sell', tick: state.tick, player: playerId, unitId: u.id, refund });
      return { ok: true, entityId: u.id };
    }
    case 'setTargeting': {
      const u = state.units.find((x) => x.id === cmd.entityId);
      if (!u) return fail('unknown-entity');
      if (u.owner !== playerId) return fail('not-owner');
      if (!ctx.units[u.defId].attack) return fail('no-targeting');
      if (!['first', 'last', 'close', 'strongest'].includes(cmd.mode)) return fail('invalid-mode');
      u.targeting = cmd.mode;
      return { ok: true, entityId: u.id };
    }
    case 'useAbility': {
      const u = state.units.find((x) => x.id === cmd.entityId);
      if (!u) return fail('unknown-entity');
      if (u.owner !== playerId) return fail('not-owner');
      if (!ctx.units[u.defId].ability) return fail('no-ability');
      if (u.abilityCd > 0) return fail('ability-cooldown');
      return triggerAbility(w, u) ? { ok: true, entityId: u.id } : fail('no-target');
    }
    case 'skipWave': {
      if (state.phase === 'wave' && state.wave >= ctx.totalWaves) return fail('no-next-wave');
      // DESIGN-OFFEN: Skip = mehr als die Hälfte der Spieler; im Wave-Betrieb beendet er die laufende Wave sofort (Bonus wird gezahlt) und startet die nächste.
      player.skipVote = true;
      const votes = state.players.filter((p) => p.skipVote).length;
      // Mehrheit der Spieler (§16): mehr als die Hälfte.
      if (votes * 2 > state.players.length) state.skipPending = true;
      return { ok: true };
    }
    case 'donate': {
      const to = state.players[cmd.to];
      if (!to || cmd.to === playerId) return fail('invalid-target');
      if (!Number.isInteger(cmd.amount) || cmd.amount <= 0 || cmd.amount % eco.coop.donationStep !== 0) return fail('invalid-amount');
      if (player.coins < cmd.amount) return fail('not-enough-coins');
      player.coins -= cmd.amount;
      addCoins(w, cmd.to, cmd.amount, 'donate');
      return { ok: true };
    }
  }
}
