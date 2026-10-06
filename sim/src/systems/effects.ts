/**
 * Statuseffekte (recommendations §10): Stun mit Sperre, Slow (stärkster gewinnt, Cap), DoT
 * (gleicher Typ erneuert nur, verschiedene Typen stapeln), Regen, Schaden anwenden.
 */
import { BP, mulBp } from '../fixed.js';
import type { EconomyData } from '../data/schema.js';
import type { DotKind, DotState, EnemyState, UnitState, World } from '../state.js';
import { wardBroken } from './boss.js';

type CcEco = Pick<EconomyData, 'cc'>;

/** Betäubung. Gibt false zurück, wenn bereits betäubt oder in der Sperre (kein Refresh). */
export function applyStun(e: EnemyState, ticks: number, eco: CcEco): boolean {
  // DESIGN-OFFEN: Stun wird weder während des Stuns noch in der 6-s-Sperre erneuert; die Sperre beginnt, wenn der Stun endet.
  // P4: Im Schwachstellen-Fenster eines Bosses gilt die volle Dauer und keine Sperre ("CC möglich"); ein Stun unterbricht den Telegraph.
  const inWindow = e.bossRun !== null && e.bossRun.vulnTicks > 0;
  if (e.stunTicks > 0 || (e.stunImmune > 0 && !inWindow)) return false;
  e.stunTicks = e.boss && !inWindow ? mulBp(ticks, eco.cc.bossCcBp) : ticks;
  if (e.stunTicks > 0 && e.bossRun?.tele) e.bossRun.tele.interrupted = true;
  return e.stunTicks > 0;
}

/** Verlangsamung: stärkster Slow gewinnt (nicht additiv), Gesamt max. slowMaxBp, Boss-Dauer halbiert. */
export function applySlow(e: EnemyState, pctBp: number, ticks: number, eco: CcEco): boolean {
  const pct = Math.min(pctBp, eco.cc.slowMaxBp);
  const dur = e.boss ? mulBp(ticks, eco.cc.bossCcBp) : ticks;
  if (e.slowTicks > 0) {
    if (e.slowBp > pct) return false;
    if (e.slowBp === pct) {
      e.slowTicks = Math.max(e.slowTicks, dur);
      return true;
    }
  }
  e.slowBp = pct;
  e.slowTicks = dur;
  return true;
}

/**
 * DoT anwenden: totalCenti verteilt sich auf ticks/intervalTicks Intervalle.
 * Gleicher Typ: Dauer wird erneuert, Rate = Maximum (kein Stapeln). Boss/Elite nehmen x0,5.
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
  // DESIGN-OFFEN: gleicher DoT-Typ: Dauer wird erneuert, Rate = Maximum (kein Stapeln); DoT ignoriert Schild und Mindestschaden.
  const cur = e[kind];
  if (cur) {
    cur.ticksLeft = ticks;
    if (per >= cur.perIntervalCenti) {
      cur.perIntervalCenti = per;
      cur.owner = owner;
      cur.unit = unit;
    }
  } else {
    const d: DotState = { ticksLeft: ticks, nextIn: eco.dot.intervalTicks, perIntervalCenti: per, owner, unit };
    e[kind] = d;
  }
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
      e.stunTicks--;
      if (e.stunTicks === 0) e.stunImmune = eco.cc.stunImmuneTicks;
    } else if (e.stunImmune > 0) e.stunImmune--;
    if (e.slowTicks > 0) {
      e.slowTicks--;
      if (e.slowTicks === 0) e.slowBp = 0;
    }
    for (const kind of ['bleed', 'burn', 'poison'] as const) {
      const d = e[kind];
      if (!d) continue;
      d.nextIn--;
      if (d.nextIn === 0) {
        d.nextIn = eco.dot.intervalTicks;
        const src = state.units.find((u) => u.id === d.unit) ?? null;
        applyDamage(w, e, d.perIntervalCenti, d.owner, src, true);
      }
      d.ticksLeft--;
      if (d.ticksLeft <= 0) e[kind] = null;
    }
    if (e.regen && e.hp > 0 && state.tick % 20 === 0 && e.hp < e.maxHp) {
      if (!regenStops.some((k) => e[k] !== null)) {
        e.hp = Math.min(e.maxHp, e.hp + mulBp(e.maxHp, eco.regen.perSecondBp));
      }
    }
  }
}

export { BP };
