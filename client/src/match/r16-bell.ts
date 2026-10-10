/**
 * Runde 16 TP (Client): Darstellung des Bellringers im Match, ohne Entscheidungen.
 * - Solange der Alarm laeuft (Faehigkeit `alarm`: alle Gegner stehen still), schlaegt die Glocke voll aus (Atk-Frames) und ueber jedem
 *   stehenden Gegner steht ein rotes Ausrufezeichen; vom Bellringer laufen rote Schallringe ueber die Karte.
 * - Die Aura-Reichweite zeigt der Renderer wie beim Market (`rangeView`).
 */
import { Container, Sprite } from 'pixi.js';
import { C } from '../pixel/map/buf';
import type { EnemyState, GameState, SimEvent, TowerState } from '../sim';
import type { FxLayer } from './fx';
import { ALARM_MARK_FRAMES, alarmMarkFx } from './sprites';
import { tex } from './textures';

/** So lange (ms) zeigt der Client die Alarm-Anzeige hoechstens (Dusk Siren: 4 s) - die Marken haengen zusaetzlich an `stunTicks`. */
export const ALARM_SHOW_MS = 4500;
/** Glockenbild: Alarm = voller Ausschlag im 110-ms-Takt, sonst ruhiges Idle (166 ms). */
export function bellFrameOf(towerId: number, nowMs: number, alarmUntil: number): 'idle0' | 'idle1' | 'idle2' | 'idle3' | 'atk0' | 'atk1' | 'atk2' | 'atk3' {
  if (nowMs < alarmUntil) return `atk${(Math.floor(nowMs / 110) + towerId) & 3}` as 'atk0';
  return `idle${(Math.floor(nowMs / 166) + towerId) & 3}` as 'idle0';
}
/** Soll der Gegner das Alarm-Zeichen tragen? */
export const alarmMarked = (e: Pick<EnemyState, 'stunTicks' | 'dead'>, nowMs: number, alarmUntil: number): boolean => nowMs < alarmUntil && e.stunTicks > 0 && !e.dead;

export class BellFx {
  alarmUntil = 0;
  private marks = new Map<number, Sprite>();

  constructor(private readonly host: Container, private readonly fx: () => FxLayer, private readonly towers: () => TowerState[]) {}

  clear(): void { for (const s of this.marks.values()) s.destroy(); this.marks.clear(); this.alarmUntil = 0; }

  handle(ev: SimEvent, nowMs: number): void {
    if (ev.type !== 'ability' || ev.id !== 'alarm') return;
    const fx = this.fx();
    this.alarmUntil = nowMs + ALARM_SHOW_MS;
    fx.flash(C.coral, 0.2);
    fx.shake.t = 8; fx.shake.amp = 1;
    for (const t of this.towers()) {
      if (t.type !== 'bellringer') continue;
      const x = t.x / 1000, y = t.y / 1000 - 30;
      fx.ring(x, y, 4, 70, C.red, 22);
      fx.ring(x, y, 2, 46, C.yellow, 16);
      fx.ring(x, y, 1, 100, C.coral, 30);
      fx.float(x, y - 22, 'ALARM', C.red, 56, 0.3);
    }
  }

  sync(state: GameState, nowMs: number): void {
    const seen = new Set<number>();
    const f = Math.floor(nowMs / 140) % ALARM_MARK_FRAMES;
    for (const e of state.enemies) {
      if (!alarmMarked(e, nowMs, this.alarmUntil)) continue;
      seen.add(e.id);
      let s = this.marks.get(e.id);
      if (!s) { s = new Sprite(); this.host.addChild(s); this.marks.set(e.id, s); }
      const sp = alarmMarkFx(f + e.id);
      s.texture = tex(sp.canvas);
      s.position.set(Math.round(e.x / 1000) - sp.ax, Math.round(e.y / 1000) - 16 - sp.ay);
    }
    for (const [id, s] of this.marks) if (!seen.has(id)) { s.destroy(); this.marks.delete(id); }
  }
}
