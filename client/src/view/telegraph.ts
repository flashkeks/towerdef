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
}

export interface ActiveWindow {
  enemyId: number;
  untilTick: number;
  totalTicks: number;
  damageBp: number;
  cause: string;
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
          });
          break;
        case 'bossCast':
          this.telegraphs.delete(e.enemyId);
          break;
        case 'bossWindow':
          if (e.open) this.windows.set(e.enemyId, { enemyId: e.enemyId, untilTick: e.tick + e.ticks, totalTicks: e.ticks, damageBp: e.damageBp, cause: e.cause });
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
  }

  clear(): void {
    this.telegraphs.clear();
    this.windows.clear();
    this.wards.clear();
    this.phases.clear();
  }
}

/** Fortschritt eines Telegraphs 0..1 (1 = Wirkung jetzt). */
export const telegraphProgress = (tl: ActiveTelegraph, tick: number): number =>
  tl.warnTicks <= 0 ? 1 : Math.max(0, Math.min(1, (tick - tl.startTick) / tl.warnTicks));

export const telegraphSecondsLeft = (tl: ActiveTelegraph, tick: number): number => Math.max(0, Math.ceil((tl.fireTick - tick) / TICKS_PER_SECOND * 10) / 10);
