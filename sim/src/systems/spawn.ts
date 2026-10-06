/**
 * Gegner-Erzeugung und Spawn-Warteschlange.
 * HP-Kette (nach jedem Faktor abgerundet): HP_grunt(n) -> x f_HP -> x h(Koop) [= Bounty-Basis] -> x s_Diff.
 * Speed-Kette: Basis -> x f_Speed -> x v_Diff -> x Fast. Alle Schritte floor.
 */
import type { Ctx } from '../data/compile.js';
import { coopHpFor, parseModifier } from '../data/compile.js';
import { mulBp } from '../fixed.js';
import { positionAt } from '../path.js';
import type { BossRun, EnemyState, World } from '../state.js';

/** Startzustand des Boss-Kits für eine Boss-Wave (null, wenn die Wave kein Kit hat). */
export function initBossRun(ctx: Ctx, wave: number): BossRun | null {
  const kit = ctx.bossKits[wave];
  if (!kit) return null;
  return {
    kit: kit.id,
    phase: 0,
    ward: 0,
    wardTicks: 0,
    wardWindowTicks: 0,
    wardWindowBp: 0,
    wardWindowArmor: -1,
    vulnTicks: 0,
    vulnBp: 0,
    hasteTicks: 0,
    hasteBp: 0,
    exhaustTicks: 0,
    exhaustBp: 0,
    exhaustArmor: -1,
    cd: kit.abilities.map((a) => a.firstTicks),
    tele: null,
    armor: -1,
    vulnArmor: -1,
  };
}

/** Max-HP (Centi) und Bounty eines Gegners: eine Stelle für Spawn und Wellenvorschau. */
export function enemyStats(ctx: Ctx, type: string, wave: number, card: string | null): { maxHp: number; bounty: number } {
  const def = ctx.enemies[type];
  let hp = mulBp(ctx.hpGrunt(wave), def.fHpBp);
  hp = mulBp(hp, coopHpFor(ctx, type));
  let bounty = mulBp(ctx.bounty(wave, hp), ctx.difficulty.bountyBp);
  let maxHp = mulBp(hp, ctx.difficulty.hpBp);
  const c = card ? ctx.cards[card] : undefined;
  if (c) {
    maxHp = mulBp(maxHp, c.hpBp);
    bounty = mulBp(bounty, c.bountyBp);
  }
  return { maxHp, bounty };
}

export function createEnemy(
  ctx: Ctx,
  id: number,
  type: string,
  wave: number,
  modifiers: string[],
  element: number,
  progress = 0,
  frac = 0,
  card: string | null = null,
): EnemyState {
  const def = ctx.enemies[type];
  if (!def) throw new Error(`Unbekannter Gegnertyp ${type}`);
  const { maxHp, bounty } = enemyStats(ctx, type, wave, card);
  const baseSpeedMicro = Math.floor((ctx.data.enemies.baseSpeedMilliPerSec * 1000) / 20);
  let speedMicro = mulBp(mulBp(baseSpeedMicro, def.fSpeedBp), ctx.difficulty.speedBp);
  if (ctx.infinite) speedMicro = mulBp(speedMicro, ctx.speedInfBp(wave));
  if (card && ctx.cards[card]) speedMicro = mulBp(speedMicro, ctx.cards[card].speedBp);
  let armor = def.armor;
  let shield = 0;
  let regen = false;
  for (const m of modifiers) {
    const pm = parseModifier(m);
    if (pm.kind === 'shield') shield = pm.n;
    else if (pm.kind === 'regen') regen = true;
    else if (pm.kind === 'armored') armor += ctx.data.modifiers.armored.armorBonus;
    else speedMicro = mulBp(speedMicro, ctx.data.modifiers.fast.speedBp);
  }
  const pos = positionAt(ctx.path, progress);
  return {
    id,
    type,
    wave,
    flying: def.flying,
    boss: def.boss,
    elite: def.elite,
    hp: maxHp,
    maxHp,
    shield,
    armor,
    regen,
    element: ctx.difficulty.elementsActive ? element : 0,
    leak: def.leak,
    bounty,
    speedMicro,
    progress,
    frac,
    x: pos.x,
    y: pos.y,
    stunTicks: 0,
    stunImmune: 0,
    slowBp: 0,
    slowTicks: 0,
    bleed: null,
    burn: null,
    poison: null,
    dmgShare: new Array<number>(ctx.players).fill(0),
    bossRun: def.boss ? initBossRun(ctx, wave) : null,
    card,
  };
}

/** Lässt alle fälligen Einträge der Warteschlange spawnen (bis zum Gegner-Limit). */
export function processSpawns(w: World): void {
  const { state, ctx } = w;
  const q = state.spawnQueue;
  let n = 0;
  while (n < q.length && q[n].atTick <= state.tick) {
    if (state.enemies.length >= ctx.enemyCap) break; // DESIGN-OFFEN: Spawn wartet am Limit
    const s = q[n++];
    const e = createEnemy(ctx, state.nextId++, s.type, s.wave, s.modifiers, s.element, 0, 0, s.card);
    state.enemies.push(e);
    state.stats.spawned++;
    w.events.push({ type: 'spawn', tick: state.tick, enemyId: e.id, enemy: e.type, wave: e.wave });
  }
  if (n > 0) q.splice(0, n);
}
