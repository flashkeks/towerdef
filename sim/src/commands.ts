/**
 * Befehle (werden zu Tick-Beginn angewendet: `Sim.apply` wirkt auf den Zustand zwischen zwei Ticks,
 * also vor der Verarbeitung des nächsten Ticks). Rückgabe: `{ok:true, entityId?}` oder `{ok:false, reason}`.
 */
import type { TargetMode, World } from './state.js';
import { nextWaveNumber, waveHasBoss } from './systems/cards.js';
import type { UnitDef } from './data/compile.js';
import { addCoins, flushDamage, sellValue } from './systems/economy.js';
import { checkPlacement } from './placement.js';

export type Command =
  /** Freie Platzierung (Runde 6 / P1): Mitte der Unit in Milli-Tiles (ganze Zahlen). */
  | { type: 'place'; unitId: string; x: number; y: number }
  | { type: 'upgrade'; entityId: number }
  | { type: 'sell'; entityId: number }
  | { type: 'setTargeting'; entityId: number; mode: TargetMode }
  | { type: 'skipWave' }
  /** Risikokarte (K1) für die nächste zu startende Wave wählen; `null` nimmt die Wahl zurück. Gilt für ein Team, die letzte Wahl zählt. */
  | { type: 'chooseCard'; cardId: string | null }
  /** Erweiterung (§16): Münzen an Mitspieler in 50er-Schritten. */
  | { type: 'donate'; to: number; amount: number };

export type CommandResult = { ok: true; entityId?: number } | { ok: false; reason: string };

const fail = (reason: string): CommandResult => ({ ok: false, reason });

/**
 * Alle Ablehnungsgründe einer Platzierung in fester Reihenfolge (`null` = erlaubt): `invalid-position`, Karte/Pfad/Zone/Überlappung
 * (`placement.ts`), `team-limit`, `team-slots`, `not-enough-coins`. Auch für `Sim.canPlace` (Geist im Client, Bots).
 */
/**
 * Platzierkosten für `playerId`: Basispreis x (1 + Zuwachs x Zahl der Exemplare über `economy.placeCostFreeCopies`), gezählt über die eigenen Units gleichen Typs, die gerade stehen (das neue Exemplar ist Nr. own+1).
 * Zuwachs = `placeGrowthBp` der Unit, sonst `economy.placeCostGrowthBp` (Bp je Exemplar, linear, abgerundet). Verkauf senkt den Preis wieder.
 */
export function placeCostFor(w: World, playerId: number, def: UnitDef): number {
  const bp = def.placeGrowthBp ?? w.ctx.data.economy.placeCostGrowthBp ?? 0;
  if (bp <= 0) return def.placeCost;
  const free = w.ctx.data.economy.placeCostFreeCopies ?? 0;
  const own = w.state.units.filter((u) => u.owner === playerId && u.defId === def.id).length;
  const n = Math.max(0, own + 1 - Math.max(1, free)); // das erste Exemplar kostet immer den Basispreis
  return Math.floor((def.placeCost * (10000 + bp * n)) / 10000);
}

export function placeError(w: World, playerId: number, def: UnitDef, x: number, y: number): string | null {
  const { state, ctx } = w;
  const eco = ctx.data.economy;
  if (!Number.isInteger(x) || !Number.isInteger(y)) return 'invalid-position';
  const bad = checkPlacement(ctx, state.units, def, x, y);
  if (bad) return bad;
  if (state.units.length >= eco.caps.teamUnits) return 'team-limit';
  // DESIGN-OFFEN: Team-Slots = höchstens 6 verschiedene Unit-Typen gleichzeitig je Spieler.
  const own = state.units.filter((u) => u.owner === playerId);
  if (!own.some((u) => u.defId === def.id) && new Set(own.map((u) => u.defId)).size >= eco.caps.teamSlots) return 'team-slots';
  if (state.players[playerId].coins < placeCostFor(w, playerId, def)) return 'not-enough-coins';
  return null;
}

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
      const bad = placeError(w, playerId, def, cmd.x, cmd.y);
      if (bad) return fail(bad);
      const cost = placeCostFor(w, playerId, def);
      player.coins -= cost;
      const mod = w.unitMods.find((m) => m.player === playerId && m.unit === def.id);
      const id = state.nextId++;
      state.units.push({
        id,
        defId: def.id,
        owner: playerId,
        x: cmd.x,
        y: cmd.y,
        level: 0,
        invested: cost,
        targeting: def.defaultTargeting,
        cd: 0,
        lvlBp: mod?.lvlBp ?? 10000,
        traitBp: mod?.traitBp ?? 0,
        yieldBp: mod?.yieldBp ?? 10000,
        lust: 0,
        snatch: 0,
        snatchTicks: 0,
        sun: 0,
        motDmgBp: 0,
        motDmgTicks: 0,
        motRangeBp: 0,
        motRangeTicks: 0,
        damageDealt: 0,
        damageReported: 0,
      });
      w.events.push({ type: 'place', tick: state.tick, player: playerId, unitId: id, unit: def.id, x: cmd.x, y: cmd.y, cost });
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
      if (ctx.units[u.defId].unsellable) return fail('unsellable');
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
      if (!ctx.units[u.defId].levels[u.level].attack) return fail('no-targeting');
      if (!['first', 'last', 'close', 'strongest'].includes(cmd.mode)) return fail('invalid-mode');
      u.targeting = cmd.mode;
      return { ok: true, entityId: u.id };
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
    case 'chooseCard': {
      const n = nextWaveNumber(state);
      if (state.phase === 'wave' && state.wave >= ctx.totalWaves) return fail('no-next-wave');
      if (cmd.cardId !== null && !ctx.cards[cmd.cardId]) return fail('unknown-card');
      if (cmd.cardId !== null && waveHasBoss(ctx, n)) return fail('boss-wave');
      state.nextCard = cmd.cardId;
      w.events.push({ type: 'cardChosen', tick: state.tick, player: playerId, card: cmd.cardId, wave: n });
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
