/**
 * Runde 16 TP (Client): Darstellung der Tinker-Dinge im Match, ohne Entscheidungen (die faellt die Sim).
 * - Sentries (`state.sentries`, Events `sentry` / `sentryGone`, `fire` mit `sentry`-Feld): Mini-Geschuetze neben dem Tinker, Aufbau, Blick zum Ziel,
 *   Muendungsfeuer, Schuss startet an der Sentry (nicht am Tinker), Flackern kurz vor dem Abbau.
 * - Fallen (`trapSet`): sind normale `TrapState` und werden vom Renderer wie die Caltrops der Powers gezeichnet; hier steht nur die Ladungs-Obergrenze je Falle.
 * - Overclock (`overclock`): Funkenring am Ziel-Turm, solange er laeuft.
 * Die reinen Rechenfunktionen oben sind ohne Pixi testbar; `TinkerFx` haengt sie an Pixi-Container.
 */
import { Container, Sprite } from 'pixi.js';
import { C } from '../pixel/map/buf';
import type { GameState, SentryState, SimEvent, TowerState } from '../sim';
import { dir8 } from '../pixel/sprites';
import type { FxLayer } from './fx';
import { OC_FRAMES, alarmMarkFx as _unused, buildPuffFx, overclockFx, sentryMuzzle, sentrySprite, shadowSprite, type Spr } from './sprites';
import { tex } from './textures';

void _unused;
/** Die Sentry steht mit dem Fuss so viel px unter ihrer Sim-Position (Rohr-Drehpunkt ~ Sim-Position). */
export const SENTRY_FOOT_DY = 8;
/** Aufbau in Ticks (3 Bilder) und Restzeit, ab der die Sentry flackert. */
export const SENTRY_BUILD_TICKS = 12;
export const SENTRY_BLINK_TICKS = 60;
/** Dauer des Muendungsfeuer-Bildes in ms. */
const FIRE_MS = 110;

/** Aussehen der Sentry aus den Stufen ihres Tinkers (Sentry-Pfad A1..A5 -> 0..4). */
export const sentryLook = (tiers: readonly number[]): number => Math.max(0, Math.min(4, (tiers[0] ?? 1) - 1));

/** Blickrichtung 0..7 von der Sentry zum Ziel (Milli-px oder px, y nach unten). */
export const sentryFacing = (sx: number, sy: number, tx: number, ty: number): number => dir8(tx - sx, ty - sy);

/** Muendung der Sentry relativ zu ihrer Sim-Position (px): wo das Geschoss sichtbar das Rohr verlaesst. */
export function sentryShotOffset(look: number, facing: number): { x: number; y: number } {
  const m = sentryMuzzle(look, facing);
  return { x: m.x, y: m.y + SENTRY_FOOT_DY };
}

/** Bild der Sentry: Aufbau (b0..b2 je 4 Ticks), danach Idle im 400-ms-Takt, `fire` kurz nach dem Schuss. `age` in Ticks, `fireLeft` in ms. */
export function sentryFrameOf(age: number, nowMs: number, fireLeft: number): 'b0' | 'b1' | 'b2' | 'idle0' | 'idle1' | 'fire' {
  if (age < SENTRY_BUILD_TICKS) return (['b0', 'b1', 'b2'] as const)[Math.min(2, Math.floor(age / (SENTRY_BUILD_TICKS / 3)))];
  if (fireLeft > 0) return 'fire';
  return Math.floor(nowMs / 400) & 1 ? 'idle1' : 'idle0';
}

/** Soll die Sentry gerade unsichtbar sein (Flackern vor dem Abbau)? */
export const sentryBlink = (ttl: number, nowMs: number): boolean => ttl < SENTRY_BLINK_TICKS && (Math.floor(nowMs / 100) & 1) === 1;

interface View { spr: Sprite; shadow: Sprite; facing: number; fireUntil: number; born: number; look: number; x: number; y: number }

export class TinkerFx {
  private views = new Map<number, View>();
  /** Geschoss-Id -> Sentry-Id (nur solange das Geschoss frisch ist), fuer den Muendungsversatz im Renderer. */
  private shots = new Map<number, number>();
  private pendingAim: { sentry: number; proj: number }[] = [];
  private caps = new Map<number, number>();
  private oc = new Map<number, number>();

  constructor(private readonly world: Container, private readonly shadows: Container, private readonly fx: () => FxLayer, private readonly towers: () => TowerState[]) {}

  clear(): void {
    for (const v of this.views.values()) { v.spr.destroy(); v.shadow.destroy(); }
    this.views.clear(); this.shots.clear(); this.pendingAim = []; this.caps.clear(); this.oc.clear();
  }

  /** Obergrenze der Ladungen einer Tinker-Falle (aus `trapSet`), fuer die Zackenzahl am Bild. */
  trapMax(id: number): number | undefined { return this.caps.get(id); }

  /** Muendungsversatz (px) fuer ein Sentry-Geschoss, sonst null. */
  shotOffset(proj: number): { x: number; y: number } | null {
    const sid = this.shots.get(proj);
    if (sid === undefined) return null;
    const v = this.views.get(sid);
    return v ? sentryShotOffset(v.look, v.facing) : { x: 0, y: 0 };
  }

  /** Behandelt die Tinker-Events. Liefert true, wenn das Event damit fertig ist (Sentry-Schuss: der Renderer soll keinen Turm-Muendungsblitz zeigen). */
  handle(ev: SimEvent, nowMs: number): boolean {
    const fx = this.fx();
    const m = (v: number): number => v / 1000;
    switch (ev.type) {
      case 'fire':
        if (ev.sentry === undefined) return false;
        if (ev.projectile !== undefined) { this.shots.set(ev.projectile, ev.sentry); this.pendingAim.push({ sentry: ev.sentry, proj: ev.projectile }); }
        const v = this.views.get(ev.sentry);
        if (v) {
          v.fireUntil = nowMs + FIRE_MS;
          const o = sentryShotOffset(v.look, v.facing);
          fx.burst(v.x + o.x, v.y + o.y, [C.yellow, C.white, C.silver], 2, 0.8, 1, 0.02, 6);
        }
        return true;
      case 'sentry':
        fx.anim(m(ev.x), m(ev.y) + SENTRY_FOOT_DY, 5, (f) => buildPuffFx(f), { per: 3 });
        fx.burst(m(ev.x), m(ev.y), [C.yellow, C.amber, C.white], 5, 1.2, 1, 0.04, 14);
        return true;
      case 'sentryGone': {
        const sv = this.views.get(ev.id);
        const x = sv ? sv.x : 0, y = sv ? sv.y : 0;
        if (sv) {
          fx.puff(x, y + SENTRY_FOOT_DY - 4, null);
          fx.burst(x, y, ev.reason === 'sold' ? [C.silver, C.stone, C.amber] : [C.stone, C.slate, C.amber], 8, 1.4, 1, 0.06, 18);
        }
        return true;
      }
      case 'trapSet':
        this.caps.set(ev.id, ev.charges);
        fx.burst(m(ev.x), m(ev.y) - 2, [C.silver, C.stone, C.white], 5, 1.3, 1, 0.06, 12);
        return true;
      case 'overclock': {
        const t = this.towers().find((q) => q.id === ev.tower);
        if (!t) return true;
        const src = this.towers().find((q) => q.id === ev.source);
        const big = !!src && (src.tiers[2] ?? 0) >= 5;
        this.oc.set(ev.tower, nowMs + (ev.ticks / 60) * 1000);
        const x = m(t.x), y = m(t.y);
        const loops = Math.max(1, Math.ceil(ev.ticks / (OC_FRAMES * 4)));
        fx.anim(x, y, OC_FRAMES, (f) => overclockFx(f, big), { per: 4, loop: loops, alpha: 0.95 });
        fx.ring(x, y - 10, 3, 22, C.ice, 14);
        fx.burst(x, y - 16, [C.yellow, C.white, C.ice], 8, 1.6, 1, 0.02, 16);
        return true;
      }
      case 'ability':
        if (ev.id === 'overclock') {
          fx.flash(C.ice, 0.14);
          for (const t of this.towers()) if (t.type === 'tinker') fx.float(m(t.x), m(t.y) - 46, 'OVERCLOCK', C.ice, 50, 0.3);
        }
        return false;
      default:
        return false;
    }
  }

  /** Overclock noch aktiv auf dem Turm? (fuer Tests und Panel) */
  overclocked(towerId: number, nowMs: number): boolean { return (this.oc.get(towerId) ?? 0) > nowMs; }

  /** Pro Frame: Sentries aus dem Zustand zeichnen. */
  sync(state: GameState, nowMs: number, tick: number): void {
    // Blickrichtung aus der Flugrichtung des frischen Geschosses
    if (this.pendingAim.length) {
      for (const a of this.pendingAim) {
        const p = state.projectiles.find((q) => q.id === a.proj), v = this.views.get(a.sentry);
        if (p && v) v.facing = dir8(p.vx, p.vy);
      }
      this.pendingAim = [];
    }
    const seen = new Set<number>();
    const tinkers = new Map(this.towers().map((t) => [t.id, t] as const));
    for (const s of state.sentries) {
      seen.add(s.id);
      this.syncOne(s, tinkers.get(s.owner), nowMs, tick);
    }
    for (const [id, v] of this.views) if (!seen.has(id)) { v.spr.destroy(); v.shadow.destroy(); this.views.delete(id); }
    // alte Geschoss-Zuordnungen aufraeumen
    if (this.shots.size > 400) { const live = new Set(state.projectiles.map((p) => p.id)); for (const k of this.shots.keys()) if (!live.has(k)) this.shots.delete(k); }
  }

  private syncOne(s: SentryState, owner: TowerState | undefined, nowMs: number, _tick: number): void {
    const x = Math.round(s.x / 1000), y = Math.round(s.y / 1000);
    let v = this.views.get(s.id);
    const look = owner ? sentryLook(owner.tiers) : 0;
    if (!v) {
      const shadow = new Sprite(tex(shadowSprite(11, 4).canvas));
      this.shadows.addChild(shadow);
      const spr = new Sprite();
      this.world.addChild(spr);
      // Blick zunaechst vom Tinker weg nach aussen (Platz auf dem Kreis um den Tinker)
      const face = owner ? sentryFacing(owner.x, owner.y, s.x, s.y) : 0;
      v = { spr, shadow, facing: face, fireUntil: 0, born: nowMs, look, x, y };
      this.views.set(s.id, v);
    }
    v.x = x; v.y = y; v.look = look;
    const age = (nowMs - v.born) / (1000 / 60);
    const sp: Spr = sentrySprite(look, v.facing, sentryFrameOf(age, nowMs, v.fireUntil - nowMs));
    v.spr.texture = tex(sp.canvas);
    v.spr.position.set(x - sp.ax, y + SENTRY_FOOT_DY - sp.ay);
    v.spr.zIndex = y + SENTRY_FOOT_DY;
    v.spr.visible = !sentryBlink(s.ttl, nowMs);
    v.shadow.position.set(x - 6, y + SENTRY_FOOT_DY - 3);
    v.shadow.visible = v.spr.visible;
  }
}
