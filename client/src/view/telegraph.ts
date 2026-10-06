/**
 * Boss-Telegraphs, Schwachstellen-Fenster und Schilde aus dem Sim-Eventstrom (P4/K5).
 * Der Client leitet daraus nur ab, WAS angezeigt wird; die Wirkung selbst bleibt in der Sim.
 */
import type { SimEvent } from '../sim';
import { TICKS_PER_SECOND } from './model';

export interface ActiveTelegraph {
  enemyId: number;
  ability: string;
  kind: string;
  startTick: number;
  fireTick: number;
  warnTicks: number;
  interruptible: boolean;
  /** Schaden-Schwelle (Centi-HP) zum Brechen durch Dauerschaden, 0 = nicht durch Schaden zu brechen (P3). */
  staggerNeed: number;
}

/** Letzte Wirkung/Abbruch einer Boss-Faehigkeit (fuer die kurze Einblendung "gebrochen durch ..."). */
export interface LastCast {
  enemyId: number;
  ability: string;
  interrupted: boolean;
  /** `stun`, `damage` oder null (nicht unterbrochen). */
  cause: 'stun' | 'damage' | null;
  tick: number;
}

export interface ActiveWindow {
  enemyId: number;
  untilTick: number;
  totalTicks: number;
  damageBp: number;
  cause: string;
  /** Ruestung im Fenster (0 = Panzer offen, -1 = unveraendert, "Boss keucht"); P3. */
  armor: number;
}

export interface ActivePhase {
  id: string;
  name: string;
}

export class BossTracker {
  readonly telegraphs = new Map<number, ActiveTelegraph>();
  readonly windows = new Map<number, ActiveWindow>();
  readonly wards = new Set<number>();
  readonly phases = new Map<number, ActivePhase>();
  readonly lastCast = new Map<number, LastCast>();
  /** Ruestungsphase (Ereignis `bossArmor`): aktuelle und normale Ruestung. */
  readonly armors = new Map<number, { armor: number; base: number }>();

  consume(events: readonly SimEvent[]): void {
    for (const e of events) {
      switch (e.type) {
        case 'bossTelegraph':
          this.telegraphs.set(e.enemyId, {
            enemyId: e.enemyId,
            ability: e.ability,
            kind: e.kind,
            startTick: e.tick,
            fireTick: e.fireTick,
            warnTicks: e.warnTicks,
            interruptible: e.interruptible,
            staggerNeed: e.staggerNeed ?? 0,
          });
          break;
        case 'bossCast':
          this.telegraphs.delete(e.enemyId);
          this.lastCast.set(e.enemyId, { enemyId: e.enemyId, ability: e.ability, interrupted: e.interrupted, cause: e.cause ?? null, tick: e.tick });
          break;
        case 'bossArmor':
          this.armors.set(e.enemyId, { armor: e.armor, base: e.base });
          break;
        case 'bossWindow':
          if (e.open) this.windows.set(e.enemyId, { enemyId: e.enemyId, untilTick: e.tick + e.ticks, totalTicks: e.ticks, damageBp: e.damageBp, cause: e.cause, armor: e.armor ?? -1 });
          else this.windows.delete(e.enemyId);
          break;
        case 'bossWard':
          if (e.state === 'up') this.wards.add(e.enemyId);
          else this.wards.delete(e.enemyId);
          break;
        case 'bossPhase':
          this.phases.set(e.enemyId, { id: e.id, name: e.name });
          break;
        default:
          break;
      }
    }
  }

  /** Raeumt Eintraege auf, die abgelaufen sind oder zu einem toten Boss gehoeren. */
  prune(tick: number, aliveIds: ReadonlySet<number>): void {
    for (const [id, w] of this.windows) if (tick >= w.untilTick || !aliveIds.has(id)) this.windows.delete(id);
    for (const [id, tl] of this.telegraphs) if (tick > tl.fireTick + TICKS_PER_SECOND || !aliveIds.has(id)) this.telegraphs.delete(id);
    for (const id of [...this.wards]) if (!aliveIds.has(id)) this.wards.delete(id);
    for (const id of [...this.phases.keys()]) if (!aliveIds.has(id)) this.phases.delete(id);
    for (const id of [...this.lastCast.keys()]) if (!aliveIds.has(id)) this.lastCast.delete(id);
    for (const id of [...this.armors.keys()]) if (!aliveIds.has(id)) this.armors.delete(id);
  }

  clear(): void {
    this.telegraphs.clear();
    this.windows.clear();
    this.wards.clear();
    this.phases.clear();
    this.lastCast.clear();
    this.armors.clear();
  }
}

/** Fortschritt eines Telegraphs 0..1 (1 = Wirkung jetzt). */
export const telegraphProgress = (tl: ActiveTelegraph, tick: number): number =>
  tl.warnTicks <= 0 ? 1 : Math.max(0, Math.min(1, (tick - tl.startTick) / tl.warnTicks));

export const telegraphSecondsLeft = (tl: ActiveTelegraph, tick: number): number => Math.max(0, Math.ceil((tl.fireTick - tick) / TICKS_PER_SECOND * 10) / 10);
