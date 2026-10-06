/**
 * Gemeinsame Bot-Hilfen: Bewertung (erwarteter DPS-Gewinn je Münze), Optionen, Kaufschleife,
 * Farm-Fenster (§12), Fähigkeiten, Targeting, Spenden. Nur lesende Abfragen + `sim.apply`.
 */
import type { UnitDef } from '../data/compile.js';
import { nextInt, type RngState } from '../prng.js';
import type { Sim, SlotInfo } from '../sim.js';
import type { EnemyState, UnitState } from '../state.js';
import type { BotContext } from './types.js';

/** Länge der Standard-Stage (der Kern legt die Wave-Zahl nicht im Zustand offen). */
export const TOTAL_WAVES = 20;
/** Ab dieser Wave rechnen Bots mit Flyern (Standard-Stage: erster Flyer in Wave 8). */
export const AIR_FROM_WAVE = 6;
const ABILITY_BONUS = 1.5;

export interface Memo {
  armor: number;
  airSeen: boolean;
}
export const newMemo = (): Memo => ({ armor: 0, airSeen: false });

export interface Policy {
  /** Präferenz-Multiplikator je Unit (Standard 1). */
  weight?: (def: UnitDef, kind: 'place' | 'upgrade') => number;
  canPlace?: (def: UnitDef, env: Env) => boolean;
  canUpgrade?: (u: UnitState, def: UnitDef, env: Env) => boolean;
  /** Farm-Strategie: `share` = max. Anteil der Farm-Investition an den eigenen Gesamtinvestitionen. */
  farm?: { share: number; sellLate?: boolean } | null;
  /** Obergrenze der eigenen Nicht-Farm-Investition (Support-Rolle im Koop). */
  maxNonFarmInvest?: number;
  /** Frost-Stun ab so vielen Gegnern in Range (Standard 4). */
  frostMin?: number;
  /** Münzen, die nicht für Kampf-Units ausgegeben werden. */
  reserve?: number;
}

export interface Env {
  sim: Sim;
  playerId: number;
  rng: RngState;
  memo: Memo;
  wave: number;
  coins: number;
  defs: Map<string, UnitDef>;
  slots: SlotInfo[];
  own: UnitState[];
  team: UnitState[];
  armor: number;
  airNeed: boolean;
  airShare: number;
  /** Basiswert je Team-Unit (DPS x Abdeckung), ohne Luft-Bonus. */
  values: Map<number, number>;
}

export interface Option {
  kind: 'place' | 'upgrade';
  def: UnitDef;
  slot?: number;
  unit?: UnitState;
  cost: number;
  score: number;
}

export function makeEnv(ctx: BotContext, memo: Memo): Env {
  const { sim, playerId, rng } = ctx;
  const st = sim.state;
  const defs = new Map(sim.catalog().map((d) => [d.id, d]));
  const live = st.enemies.filter((e) => e.hp > 0);
  if (live.some((e) => e.flying)) memo.airSeen = true;
  let hp = 0;
  let ar = 0;
  for (const e of live) {
    hp += e.maxHp;
    ar += e.armor * e.maxHp;
  }
  if (hp > 0) memo.armor = Math.max(memo.armor, Math.min(40, Math.round(ar / hp)));
  const slots = sim.slots();
  const team = st.units;
  const env: Env = {
    sim,
    playerId,
    rng,
    memo,
    wave: st.wave,
    coins: st.players[playerId].coins,
    defs,
    slots,
    own: team.filter((u) => u.owner === playerId),
    team,
    armor: memo.armor,
    airNeed: st.wave >= AIR_FROM_WAVE || memo.airSeen,
    airShare: 0,
    values: new Map(),
  };
  let total = 0;
  let air = 0;
  for (const u of team) {
    const d = defs.get(u.defId) as UnitDef;
    if (!d.attack) continue;
    const s = slots[u.slot];
    const v = dpsOf(d, u.level, env.armor) * (s.coverageByRange(d.levels[u.level].rangeMilli) / 1000);
    env.values.set(u.id, v);
    total += v;
    if (d.canHitAir) air += v;
  }
  env.airShare = total > 0 ? air / total : 0;
  return env;
}

/** Erwarteter Einzelziel-DPS (HP/s) inkl. grober Multi-Target-/Effekt-Faktoren und Rüstung. */
export function dpsOf(def: UnitDef, level: number, armor: number): number {
  if (!def.attack) return 0;
  const ls = def.levels[level];
  let d = (ls.damageCenti * 20) / ls.spaTicks / 100;
  switch (def.attack.kind) {
    case 'circle':
      d *= 1.8;
      break;
    case 'line':
      d *= 1.6;
      break;
    case 'cone':
      d *= 1.4;
      break;
    default:
      break;
  }
  if (def.crit) d *= 1 + (def.crit.chanceBp / 10000) * (def.crit.multBp / 10000 - 1);
  for (const o of def.onHit) {
    if (o.kind === 'bleed') d *= 1.25;
    else if (o.kind === 'burn') d *= 1.35;
    else if (o.kind === 'slow') d *= 1.15;
  }
  return (d * 100) / (100 + Math.max(0, armor - def.penetration));
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Wert (DPS-Äquivalent x Pfadabdeckung in Tiles) einer Unit auf Stufe `level` am Slot. */
export function valueAt(env: Env, def: UnitDef, level: number, slot: SlotInfo, selfId = -1): number {
  if (def.aura) {
    const bp = def.aura.damageBpByLevel[level];
    let sum = 0;
    for (const u of env.team) {
      if (u.id === selfId) continue;
      const v = env.values.get(u.id);
      if (!v) continue;
      if (dist(env.slots[u.slot], slot) <= def.aura.radiusMilli) sum += v;
    }
    return (sum * bp) / 10000;
  }
  if (!def.attack) return 0;
  const v = dpsOf(def, level, env.armor) * (slot.coverageByRange(def.levels[level].rangeMilli) / 1000);
  // Fähigkeiten (Stun, Nuke) sind Boss-/Elite-Werkzeuge und zählen mit Nutzen-Aufschlag.
  return v * airFactor(env, def) * (def.ability ? ABILITY_BONUS : 1);
}

function airFactor(env: Env, def: UnitDef): number {
  return env.airNeed && env.airShare < 0.3 && def.canHitAir && def.attack ? 1.8 : 1;
}

export function pickTop<T extends { score: number }>(rng: RngState, sorted: T[], k = 3, frac = 0.7): T {
  const best = sorted[0].score;
  const cand = sorted.slice(0, k).filter((o) => o.score >= best * frac);
  return cand[nextInt(rng, cand.length)];
}

const investedOf = (env: Env, farm: boolean): number =>
  env.own.reduce((a, u) => a + ((env.defs.get(u.defId) as UnitDef).farm ? (farm ? u.invested : 0) : farm ? 0 : u.invested), 0);

function canPlaceBase(env: Env, def: UnitDef): boolean {
  if (env.own.filter((u) => u.defId === def.id).length >= def.cap) return false;
  if (env.team.length >= 60) return false;
  if (!env.own.some((u) => u.defId === def.id) && new Set(env.own.map((u) => u.defId)).size >= 6) return false;
  return true;
}

/** Alle bezahlbaren Kampf-Optionen (Farm wird gesondert behandelt). */
export function buildOptions(env: Env, pol: Policy): Option[] {
  const out: Option[] = [];
  const budget = env.coins - (pol.reserve ?? 0);
  const nonFarm = investedOf(env, false);
  const cap = pol.maxNonFarmInvest ?? Infinity;
  const small = env.slots.filter((s) => s.free && s.size === 1);
  for (const def of env.defs.values()) {
    if (def.farm || !def.attack && !def.aura) continue;
    if (!canPlaceBase(env, def)) continue;
    const cost = def.placeCost;
    if (cost > budget || nonFarm + cost > cap) continue;
    if (pol.canPlace && !pol.canPlace(def, env)) continue;
    const w = pol.weight ? pol.weight(def, 'place') : 1;
    if (w <= 0) continue;
    for (const s of small) {
      if (def.placement !== 'hybrid' && def.placement !== s.kind) continue;
      const v = valueAt(env, def, 0, s);
      if (v <= 0) continue;
      out.push({ kind: 'place', def, slot: s.id, cost, score: (v / cost) * w });
    }
  }
  for (const u of env.own) {
    const def = env.defs.get(u.defId) as UnitDef;
    if (def.farm || u.level >= def.maxLevel) continue;
    const cost = def.upgradeCosts[u.level];
    if (cost > budget || nonFarm + cost > cap) continue;
    if (pol.canUpgrade && !pol.canUpgrade(u, def, env)) continue;
    const w = pol.weight ? pol.weight(def, 'upgrade') : 1;
    if (w <= 0) continue;
    const s = env.slots[u.slot];
    const gain = valueAt(env, def, u.level + 1, s, u.id) - valueAt(env, def, u.level, s, u.id);
    if (gain <= 0) continue;
    out.push({ kind: 'upgrade', def, unit: u, cost, score: (gain / cost) * w });
  }
  out.sort((a, b) => b.score - a.score || a.cost - b.cost);
  return out;
}

/** Kauf-Schleife: wählt unter den Top-3-Optionen (seeded) und kauft, bis nichts mehr geht. */
export function spend(ctx: BotContext, memo: Memo, pol: Policy): void {
  const failed = new Set<string>();
  const key = (o: Option): string => (o.kind === 'place' ? `p${o.def.id}@${o.slot}` : `u${o.unit?.id}`);
  for (let i = 0; i < 80; i++) {
    const env = makeEnv(ctx, memo);
    const opts = buildOptions(env, pol).filter((o) => !failed.has(key(o)));
    if (opts.length === 0) return;
    const o = pickTop(ctx.rng, opts);
    const res =
      o.kind === 'place'
        ? ctx.sim.apply(ctx.playerId, { type: 'place', unitId: o.def.id, slot: o.slot as number })
        : ctx.sim.apply(ctx.playerId, { type: 'upgrade', entityId: (o.unit as UnitState).id });
    if (!res.ok) failed.add(key(o));
  }
}

/** Farm-Käufe nach §12-Fenster: Grenz-Payback <= Restwaves; nach Payback sortiert. */
export function farmStep(ctx: BotContext, memo: Memo, pol: Policy): void {
  const cfg = pol.farm;
  if (!cfg) return;
  for (let i = 0; i < 10; i++) {
    const env = makeEnv(ctx, memo);
    const farmDef = [...env.defs.values()].find((d) => d.farm);
    if (!farmDef?.farm) return;
    const rest = TOTAL_WAVES - env.wave;
    const attackers = env.own.filter((u) => (env.defs.get(u.defId) as UnitDef).attack).length;
    const farmInv = investedOf(env, true);
    const total = farmInv + investedOf(env, false);
    const ys = farmDef.farm.yieldByLevel;
    const cands: { payback: number; cost: number; place: boolean; unit?: UnitState }[] = [];
    const myFarms = env.own.filter((u) => u.defId === farmDef.id);
    if (myFarms.length < farmDef.cap) cands.push({ payback: farmDef.placeCost / ys[0], cost: farmDef.placeCost, place: true });
    for (const u of myFarms) {
      if (u.level >= farmDef.maxLevel) continue;
      const c = farmDef.upgradeCosts[u.level];
      cands.push({ payback: c / (ys[u.level + 1] - ys[u.level]), cost: c, place: false, unit: u });
    }
    const first = myFarms.length === 0 && env.wave <= 1;
    // Vor der Boss-Wave (10) keine Farm-Investition: Verteidigung geht vor.
    if (env.wave >= 9 && env.wave <= 10) return;
    const ok = cands
      .filter((c) => c.payback <= rest && c.cost <= env.coins)
      .filter((c) => first || attackers >= 2)
      .filter((c) => (first && c.place) || farmInv + c.cost <= cfg.share * (total + c.cost))
      .sort((a, b) => a.payback - b.payback || a.cost - b.cost);
    if (ok.length === 0) return;
    const c = ok[0];
    if (c.place) {
      const big = env.slots.filter((s) => s.free && s.size === 2 && s.kind === 'ground');
      if (big.length === 0) return;
      const s = big[nextInt(ctx.rng, big.length)];
      if (!ctx.sim.apply(ctx.playerId, { type: 'place', unitId: farmDef.id, slot: s.id }).ok) return;
    } else if (!ctx.sim.apply(ctx.playerId, { type: 'upgrade', entityId: (c.unit as UnitState).id }).ok) return;
  }
}

/** Verkauft Farms, deren restlicher Ertrag unter dem Verkaufswert (40 %) liegt. */
export function sellLateFarms(ctx: BotContext): void {
  const { sim, playerId } = ctx;
  const st = sim.state;
  if (st.wave < 14) return;
  const farm = sim.catalog().find((d) => d.farm);
  if (!farm?.farm) return;
  const payouts = TOTAL_WAVES - st.wave + (st.waveOpen ? 1 : 0);
  for (const u of st.units) {
    if (u.owner !== playerId || u.defId !== farm.id) continue;
    if (payouts * farm.farm.yieldByLevel[u.level] < Math.floor((u.invested * farm.sellBp) / 10000)) {
      sim.apply(playerId, { type: 'sell', entityId: u.id });
    }
  }
}

const isBig = (e: EnemyState): boolean => e.boss || e.elite;

/** Targeting: Titan immer strongest, andere Einzel-DPS strongest solange Boss/Elite lebt. */
export function manageTargeting(ctx: BotContext): void {
  const { sim, playerId } = ctx;
  const st = sim.state;
  const big = st.enemies.some((e) => e.hp > 0 && isBig(e));
  const defs = new Map(sim.catalog().map((d) => [d.id, d]));
  for (const u of st.units) {
    if (u.owner !== playerId) continue;
    const d = defs.get(u.defId) as UnitDef;
    if (!d.attack) continue;
    let want = d.defaultTargeting;
    if (d.id === 'titan') want = 'strongest';
    else if (big && d.attack.kind === 'single') want = 'strongest';
    else if (d.attack.kind === 'single') want = 'first';
    if (u.targeting !== want) sim.apply(playerId, { type: 'setTargeting', entityId: u.id, mode: want });
  }
}

/** Fähigkeiten: Frost-Stun bei >= N Gegnern in Radius oder Boss/Elite; Titan-Nuke auf Boss/Elite oder fetten Gegner. */
export function useAbilities(ctx: BotContext, frostMin = 4): void {
  const { sim, playerId } = ctx;
  const st = sim.state;
  const defs = new Map(sim.catalog().map((d) => [d.id, d]));
  const slots = sim.slots();
  const live = st.enemies.filter((e) => e.hp > 0);
  if (live.length === 0) return;
  for (const u of st.units) {
    if (u.owner !== playerId || u.abilityCd > 0) continue;
    const d = defs.get(u.defId) as UnitDef;
    const ab = d.ability;
    if (!ab) continue;
    if (ab.kind === 'stunAoe') {
      const s = slots[u.slot];
      const inR = live.filter((e) => (!e.flying || d.canHitAir) && e.stunTicks <= 0 && dist(e, s) <= ab.radiusMilli);
      if (inR.length >= frostMin || inR.some(isBig)) sim.apply(playerId, { type: 'useAbility', entityId: u.id });
    } else if (ab.kind === 'nuke') {
      const targets = live.filter((e) => !e.flying || d.canHitAir);
      if (targets.length === 0) continue;
      const dmg = (d.levels[u.level].damageCenti * ab.damageMulBp) / 10000;
      const top = targets.reduce((a, b) => (b.maxHp > a.maxHp ? b : a));
      if (targets.some(isBig) || top.hp >= dmg * 0.5) sim.apply(playerId, { type: 'useAbility', entityId: u.id });
    }
  }
}

/** Spendet in 50er-Schritten an den Mitspieler aus `to` mit den wenigsten Münzen. */
export function donateSurplus(ctx: BotContext, to: number[], keep: number): void {
  const { sim, playerId } = ctx;
  const players = sim.state.players;
  const mine = players[playerId].coins;
  const amount = Math.floor((mine - keep) / 50) * 50;
  if (amount < 50 || to.length === 0) return;
  const target = to.reduce((a, b) => (players[b].coins < players[a].coins ? b : a));
  sim.apply(playerId, { type: 'donate', to: target, amount });
}

/** Eine komplette Entscheidungsrunde nach Policy (Fähigkeiten, Targeting, Farm, Kauf). */
export function playTurn(ctx: BotContext, memo: Memo, pol: Policy): void {
  useAbilities(ctx, pol.frostMin ?? 4);
  manageTargeting(ctx);
  if (pol.farm) {
    if (pol.farm.sellLate) sellLateFarms(ctx);
    farmStep(ctx, memo, pol);
  }
  spend(ctx, memo, pol);
}

/** Baut einen Bot aus einer Policy (je Spieler eigene Instanz mit eigenem Gedächtnis). */
export function policyBot(name: string, pol: Policy | (() => Policy)): { name: string; decide(ctx: BotContext): void } {
  const memo = newMemo();
  const p = typeof pol === 'function' ? pol() : pol;
  return { name, decide: (ctx) => playTurn(ctx, memo, p) };
}
