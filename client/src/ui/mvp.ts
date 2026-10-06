/** MVP der Runde: die einzelne Unit mit dem meisten Schaden. Zaehlt aus Sim-Ereignissen (`place`, `damage`), liest nur. Besitzer: P6. */
import type { SimEvent } from '../sim';

export interface Mvp {
  /** Unit-Typ (z. B. `striker`) */
  unit: string;
  entityId: number;
  damage: number;
}

export class MvpTracker {
  private readonly typeOf = new Map<number, string>();
  private readonly damage = new Map<number, number>();

  consume(events: readonly SimEvent[]): void {
    for (const e of events) {
      if (e.type === 'place') this.typeOf.set(e.unitId, e.unit);
      else if (e.type === 'damage') this.damage.set(e.unitId, (this.damage.get(e.unitId) ?? 0) + e.amount);
    }
  }

  /** Meister Schaden; bei Gleichstand die zuerst gesetzte Unit (kleinere Id). Null, wenn nie Schaden fiel. */
  mvp(): Mvp | null {
    let best: Mvp | null = null;
    for (const [id, dmg] of this.damage) {
      const unit = this.typeOf.get(id);
      if (!unit || dmg <= 0) continue;
      if (!best || dmg > best.damage || (dmg === best.damage && id < best.entityId)) best = { unit, entityId: id, damage: dmg };
    }
    return best;
  }
}

/** m:ss aus Sim-Ticks (20 je Sekunde). */
export function formatDuration(ticks: number, ticksPerSecond = 20): string {
  const total = Math.max(0, Math.floor(ticks / ticksPerSecond));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
