/**
 * Ökonomie: Gegner-Tod (Bounty nach Schadensanteil, Splitter-Kinder), Wave-Auszahlung
 * (Wave-Bonus + Farm), Verkaufswert, Aggregations-Events.
 */
import type { UnitDef } from '../data/compile.js';
import { dist2, mulBp } from '../fixed.js';
import type { IncomeSource, UnitState, World } from '../state.js';
import { createEnemy } from './spawn.js';

export function addCoins(w: World, player: number, amount: number, source: IncomeSource): void {
  if (amount <= 0) return;
  w.state.players[player].coins += amount;
  w.events.push({ type: 'income', tick: w.state.tick, player, amount, source });
}

/**
 * Verteilt die Bounty nach Schadensanteil (floor je Spieler); der Rest geht an den Spieler mit
 * dem größten Anteil (Gleichstand: kleinste ID). DESIGN-OFFEN: Rundungsrest-Regel.
 */
export function splitBounty(total: number, shares: readonly number[]): number[] {
  const sum = shares.reduce((a, b) => a + b, 0);
  const out = shares.map(() => 0);
  if (total <= 0 || sum <= 0) return out;
  let given = 0;
  let top = 0;
  for (let i = 0; i < shares.length; i++) {
    out[i] = Math.floor((total * shares[i]) / sum);
    given += out[i];
    if (shares[i] > shares[top]) top = i;
  }
  out[top] += total - given;
  return out;
}

/** Kopfgeld-Aura (Runde 7 / P6): Aufschlag (Bp) auf die Bounty eines Gegners, der bei (x, y) stirbt. Je Typ zählt nur der höchste Wert im Radius, Typen addieren sich. */
export function bountyAuraBp(w: World, x: number, y: number): number {
  let best: Map<string, number> | null = null;
  for (const u of w.state.units) {
    const a = w.ctx.units[u.defId].bountyAura;
    if (!a || dist2(u.x, u.y, x, y) > a.radiusMilli * a.radiusMilli) continue;
    best ??= new Map();
    best.set(u.defId, Math.max(best.get(u.defId) ?? 0, a.bonusBpByLevel[u.level]));
  }
  let sum = 0;
  if (best) for (const v of best.values()) sum += v;
  return sum;
}

/** Leak-Schild (Runde 7 / P6): wie viele nicht-tödliche Leaks das Team in dieser Wave noch vollständig abfängt (je Typ der höchste Wert, Typen addieren sich). */
export function guardLeft(w: World): number {
  const best = new Map<string, number>();
  for (const u of w.state.units) {
    const g = w.ctx.units[u.defId].guard;
    if (g) best.set(u.defId, Math.max(best.get(u.defId) ?? 0, g.chargesByLevel[u.level]));
  }
  let sum = 0;
  for (const v of best.values()) sum += v;
  return Math.max(0, sum - w.state.guardUsed);
}

/** Entfernt tote Gegner (aufsteigende ID), zahlt Bounty, spawnt Splitter-Kinder. */
export function resolveDeaths(w: World): void {
  const { state, ctx } = w;
  if (!state.enemies.some((e) => e.hp <= 0)) return;
  const alive = [];
  const born = [];
  for (const e of state.enemies) {
    if (e.hp > 0) {
      alive.push(e);
      continue;
    }
    state.stats.kills++;
    const bounty = e.bounty + mulBp(e.bounty, bountyAuraBp(w, e.x, e.y));
    const parts = splitBounty(bounty, e.dmgShare);
    parts.forEach((amount, p) => {
      if (amount > 0) {
        state.stats.coinsBounty += amount;
        addCoins(w, p, amount, 'bounty');
      }
    });
    w.events.push({ type: 'kill', tick: state.tick, enemyId: e.id, enemy: e.type, wave: e.wave, bounty });
    const def = ctx.enemies[e.type];
    if (def.child) {
      for (let k = 0; k < def.child.count; k++) {
        // DESIGN-OFFEN: Splitter-Kinder erben das Element, aber keine Modifier; sie haben eigene Bounty (gamma * Kind-HP) und Leak 1.
        born.push(createEnemy(ctx, state.nextId++, def.child.type, e.wave, [], ctx.difficulty.elementsActive ? e.element : 0, e.progress, e.frac, e.card));
      }
    }
  }
  state.enemies = alive;
  for (const c of born) {
    state.enemies.push(c);
    w.events.push({ type: 'spawn', tick: state.tick, enemyId: c.id, enemy: c.type, wave: c.wave });
  }
}

export function farmYield(def: UnitDef, u: UnitState): number {
  return def.farm ? mulBp(def.farm.yieldByLevel[u.level], u.yieldBp) : 0;
}

export function sellValue(def: UnitDef, u: UnitState): number {
  return Math.floor((u.invested * def.sellBp) / 10000);
}

/** Meldet je Unit den seit der letzten Meldung angefallenen Schaden (aggregiertes `damage`-Event). */
export function flushDamage(w: World, u: UnitState): void {
  const d = u.damageDealt - u.damageReported;
  if (d > 0) {
    u.damageReported = u.damageDealt;
    w.events.push({ type: 'damage', tick: w.state.tick, unitId: u.id, owner: u.owner, amount: d });
  }
}

/** Auszahlung am Wave-Ende: Wave-Bonus an jeden Spieler, Farm-Ertrag an die Besitzer. */
export function payWaveEnd(w: World, wave: number): void {
  const { state, ctx } = w;
  const wb = ctx.data.economy.waveBonus;
  const bonus = wb.base + wb.perWave * wave;
  for (const p of state.players) {
    state.stats.coinsWaveBonus += bonus;
    addCoins(w, p.id, bonus, 'waveBonus');
  }
  for (const u of state.units) {
    const def = ctx.units[u.defId];
    if (!def.farm) continue;
    const y = farmYield(def, u);
    state.stats.coinsFarm += y;
    addCoins(w, u.owner, y, 'farm');
  }
  for (const u of state.units) flushDamage(w, u);
}
