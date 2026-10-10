/**
 * Runde 16 TP (Client): Effekte des Riverkeepers, ohne Eingriff in die Sim. Sonar-Ping (B1+: gelegentlich ein Ring um den Turm,
 * rein optisch) und Leviathan-Schlag (B5: die Sim meldet jeden Schlag als `chain`-Ereignis des Turms, Ziel = letzter Punkt).
 */
import { C } from '../pixel/map/buf';
import { rowsToCanvas, type Sprite } from '../pixel/sprites/canvas';
import { LEVIATHAN_FRAMES, leviathanStrikeRaster, sonarRingRaster } from '../pixel/sprites/riverkeeper';
import type { TowerState } from '../sim';
import type { FxLayer } from './fx';

const cache = new Map<string, Sprite>();
const cached = (key: string, make: () => Sprite): Sprite => { let s = cache.get(key); if (!s) { s = make(); cache.set(key, s); } return s; };
const spr = (r: { rows: string[]; ax: number; ay: number }): Sprite => rowsToCanvas(r.rows, r.ax, r.ay);

/** Seeschlange schlaegt am Ziel (x, y in px) zu: 9 Bilder, Gischt, kleines Wackeln. */
export function leviathanStrike(fx: FxLayer, x: number, y: number): void {
  fx.anim(x, y + 4, LEVIATHAN_FRAMES, (f) => cached(`lev|${f}`, () => spr(leviathanStrikeRaster(f))), { per: 3 });
  fx.burst(x, y - 2, [C.ice, C.white, C.sky], 8, 1.7, 2, 0.05, 20);
  fx.shake.t = 6; fx.shake.amp = 1;
}

/** Radius des Pings in px: Sonar Array+ wirkt auf Tuerme im Umkreis von 80 px, Sonar Ping auf die Reichweite des Turms. */
export function pingRadius(t: Pick<TowerState, 'tiers' | 'range'>): number {
  return t.tiers[1] >= 2 ? 80 : Math.min(120, Math.round(t.range / 1000));
}

/** Wann der naechste Ping faellig ist: alle ~3,6 s, je Turm versetzt (nur Anzeige, kein Sim-Zustand). */
export class SonarPinger {
  private next = new Map<number, number>();
  update(towers: readonly TowerState[], now: number, fx: FxLayer): void {
    for (const t of towers) {
      if (t.type !== 'riverkeeper' || t.tiers[1] < 1) { this.next.delete(t.id); continue; }
      const due = this.next.get(t.id);
      if (due === undefined) { this.next.set(t.id, now + 600 + (t.id % 7) * 450); continue; }
      if (now < due) continue;
      this.next.set(t.id, now + 3600 + (t.id % 5) * 220);
      const x = Math.round(t.x / 1000), y = Math.round(t.y / 1000), r = pingRadius(t);
      fx.ring(x, y + 2, 4, r, t.tiers[1] >= 4 ? C.sky : C.ice, 34);
      if (t.tiers[1] >= 3) fx.ring(x, y + 2, 2, r * 0.7, C.white, 26);
    }
  }
  clear(): void { this.next.clear(); }
}
void sonarRingRaster;
