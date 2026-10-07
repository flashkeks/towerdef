/**
 * Statuseffekte (recommendations §10): Stun mit Sperre, Slow (stärkster gewinnt, Cap), DoT
 * (gleicher Typ erneuert nur, verschiedene Typen stapeln), Regen, Schaden anwenden.
 */
import { BP, mulBp } from '../fixed.js';
import type { EconomyData } from '../data/schema.js';
import type { DotKind, DotState, EnemyState, UnitState, World } from '../state.js';
import { wardBroken } from './boss.js';

type CcEco = Pick<EconomyData, 'cc'>;

/**
 * CC-Gruppe (Stun, Freeze, Timestop, Rückwärtslaufen): höchstens eins zugleich, danach `immune` Ticks Sperre (nach Ablauf).
 * Im Schwachstellen-Fenster eines Bosses gilt die volle Dauer ohne Sperre; sonst Boss-Dauer x `cc.bossCcBp`.
 * Ein Stun unterbricht den Telegraph des Bosses. Gibt false zurück, wenn gesperrt oder wirkungslos.
 */
export function applyCc(e: EnemyState, kind: 'stun' | 'back', ticks: number, immune: number, eco: CcEco): boolean {
  const inWindow = e.bossRun !== null && e.bossRun.vulnTicks > 0;
  if (e.stunTicks > 0 || e.backTicks > 0 || (e.stunImmune > 0 && !inWindow)) return false;
  const dur = e.boss && !inWindow ? mulBp(ticks, eco.cc.bossCcBp) : ticks;
  if (dur <= 0) return false;
  if (kind === 'stun') {
    e.stunTicks = dur;
    if (e.bossRun?.tele && !e.bossRun.tele.interrupted) {
      e.bossRun.tele.interrupted = true;
      e.bossRun.tele.cause = 'stun';
    }
  } else e.backTicks = dur;
  e.stunImmuneAfter = immune;
  return true;
}

/** Betäubung mit der Standard-Sperre. */
export function applyStun(e: EnemyState, ticks: number, eco: CcEco): boolean {
  return applyCc(e, 'stun', ticks, eco.cc.stunImmuneTicks, eco);
}

/** Verlangsamung: stärkster Slow gewinnt (nicht additiv), Gesamt max. slowMaxBp, Boss-Dauer verkürzt; nach Ablauf `immune` Ticks Sperre. */
export function applySlow(e: EnemyState, pctBp: number, ticks: number, immune: number, eco: CcEco): boolean {
  if (e.slowTicks === 0 && e.slowImmune > 0) return false;
  const pct = Math.min(pctBp, eco.cc.slowMaxBp);
  const dur = e.boss ? mulBp(ticks, eco.cc.bossCcBp) : ticks;
  if (e.slowTicks > 0) {
    if (e.slowBp > pct) return false;
    if (e.slowBp === pct) {
      e.slowTicks = Math.max(e.slowTicks, dur);
      e.slowImmuneAfter = immune;
      return true;
    }
  }
  e.slowBp = pct;
  e.slowTicks = dur;
  e.slowImmuneAfter = immune;
  return true;
}

/** Mehr erhaltener Schaden (Cursed/Hexed/Dismembered): stärkster gewinnt, gleiche Stärke erneuert die Dauer, kein Stapeln. `ticks` -1 = dauerhaft. */
export function applyCurse(e: EnemyState, dtype: 'magic' | 'physical', bp: number, ticks: number): void {
  const cur = dtype === 'magic' ? e.magicTakenBp : e.physTakenBp;
  const curT = dtype === 'magic' ? e.magicTakenTicks : e.physTakenTicks;
  const active = cur > 0;
  if (active && cur > bp) return;
  const t = active && cur === bp ? (curT < 0 || ticks < 0 ? -1 : Math.max(curT, ticks)) : ticks;
  if (dtype === 'magic') {
    e.magicTakenBp = bp;
    e.magicTakenTicks = t;
  } else {
    e.physTakenBp = bp;
    e.physTakenTicks = t;
  }
}

/**
 * DoT anwenden: totalCenti verteilt sich auf ticks/intervalTicks Intervalle. Boss/Elite nehmen x0,5.
 * Dieselbe Unit erneuert ihre Instanz je Art (Dauer neu, Rate = Maximum); verschiedene Units stapeln bis `economy.dot.maxStacks`
 * je Art (am Limit ersetzt eine stärkere Instanz die schwächste).
 */
export function applyDot(
  e: EnemyState,
  kind: DotKind,
  totalCenti: number,
  ticks: number,
  owner: number,
  unit: number,
  eco: Pick<EconomyData, 'dot'>,
): void {
  let total = totalCenti;
  if (e.boss || e.elite) total = mulBp(total, eco.dot.bossEliteBp);
  const intervals = Math.max(1, Math.floor(ticks / eco.dot.intervalTicks));
  const per = Math.floor(total / intervals);
  if (per <= 0) return;
  const cur = e.dots.find((d) => d.kind === kind && d.unit === unit);
  if (cur) {
    cur.ticksLeft = ticks;
    if (per >= cur.perIntervalCenti) {
      cur.perIntervalCenti = per;
      cur.owner = owner;
    }
    return;
  }
  const same = e.dots.filter((d) => d.kind === kind);
  if (same.length >= eco.dot.maxStacks) {
    let weakest = same[0];
    for (const d of same) if (d.perIntervalCenti < weakest.perIntervalCenti) weakest = d;
    if (per <= weakest.perIntervalCenti) return;
    e.dots.splice(e.dots.indexOf(weakest), 1);
  }
  e.dots.push({ kind, ticksLeft: ticks, nextIn: eco.dot.intervalTicks, perIntervalCenti: per, owner, unit });
}

/**
 * Wendet Schaden an. Schild-Stacks absorbieren eine ganze Schadensinstanz (kein HP-Schaden),
 * außer bei `bypassShield` (True Damage, DoT). Gibt den tatsächlichen HP-Verlust zurück.
 */
export function applyDamage(
  w: World,
  e: EnemyState,
  amount: number,
  owner: number,
  credit: UnitState | null,
  bypassShield: boolean,
): number {
  if (e.hp <= 0) return 0;
  const run = e.bossRun;
  if (run) {
    // Boss-Kit (P4): Fenster verstärkt den Schaden, der Schild absorbiert vor den HP (auch True Damage und DoT); Überschuss geht durch.
    if (run.vulnTicks > 0) amount = mulBp(amount, run.vulnBp);
    // Zerstörbare Wirkung (Runde 5 / P3): Schaden während des Telegraphs zählt auf die Schwelle; bei Erreichen ist die Wirkung gebrochen
    // (Auflösung im nächsten Boss-Tick, `bossCast` mit cause "damage").
    const tele = run.tele;
    if (tele && tele.need > 0 && !tele.interrupted) {
      tele.dmg += amount;
      if (tele.dmg >= tele.need) {
        tele.interrupted = true;
        tele.cause = 'damage';
        tele.left = Math.min(tele.left, 1);
      }
    }
    if (run.ward > 0) {
      const absorbed = Math.min(amount, run.ward);
      run.ward -= absorbed;
      amount -= absorbed;
      if (run.ward === 0) wardBroken(w, e);
      if (amount <= 0) return 0;
    }
  }
  if (!bypassShield && e.shield > 0) {
    e.shield--;
    return 0;
  }
  const dealt = Math.min(amount, e.hp);
  e.hp -= dealt;
  e.dmgShare[owner] += dealt;
  w.state.stats.damageByPlayer[owner] += dealt;
  if (credit) credit.damageDealt += dealt;
  return dealt;
}

/** Pro Tick: CC-Timer, DoT-Ticks, Regen. */
export function tickEffects(w: World): void {
  const { state, ctx } = w;
  const eco = ctx.data.economy;
  const regenStops = ctx.data.modifiers.regen.stoppedBy;
  for (const e of state.enemies) {
    if (e.hp <= 0) continue;
    if (e.stunTicks > 0) {
      if (--e.stunTicks === 0) e.stunImmune = e.stunImmuneAfter;
    } else if (e.backTicks > 0) {
      if (--e.backTicks === 0) e.stunImmune = e.stunImmuneAfter;
    } else if (e.stunImmune > 0) e.stunImmune--;
    if (e.uncTicks > 0) e.uncTicks--;
    if (e.slowTicks > 0) {
      if (--e.slowTicks === 0) {
        e.slowBp = 0;
        e.slowImmune = e.slowImmuneAfter;
      }
    } else if (e.slowImmune > 0) e.slowImmune--;
    if (e.kbImmune > 0) e.kbImmune--;
    if (e.regenBlock > 0) e.regenBlock--;
    if (e.bleedAmpTicks > 0 && --e.bleedAmpTicks === 0) e.bleedAmpBp = 0;
    if (e.physTakenTicks > 0 && --e.physTakenTicks === 0) e.physTakenBp = 0;
    if (e.magicTakenTicks > 0 && --e.magicTakenTicks === 0) e.magicTakenBp = 0;
    if (e.dots.length > 0) {
      const keep: DotState[] = [];
      for (const d of e.dots) {
        d.nextIn--;
        if (d.nextIn === 0) {
          d.nextIn = eco.dot.intervalTicks;
          const src = state.units.find((u) => u.id === d.unit) ?? null;
          const amp = d.kind === 'bleed' && e.bleedAmpTicks > 0 ? e.bleedAmpBp : BP;
          applyDamage(w, e, mulBp(d.perIntervalCenti, amp), d.owner, src, true);
        }
        d.ticksLeft--;
        if (d.ticksLeft > 0) keep.push(d);
      }
      e.dots = keep;
    }
    if (e.regen && e.hp > 0 && state.tick % 20 === 0 && e.hp < e.maxHp) {
      if (e.regenBlock === 0 && !regenStops.some((k) => e.dots.some((d) => d.kind === k))) {
        e.hp = Math.min(e.maxHp, e.hp + mulBp(e.maxHp, eco.regen.perSecondBp));
      }
    }
  }
}

export { BP };
