/**
 * Effekte (P5): Schuesse und Treffer je Unit-Typ, Schadenszahlen, Tod mit Zerfall, Muenz-Popup, Leak-Rand, Boss-Auftritt und -Phasen, Bildschuettern.
 * Liest NUR Ereignisse vom `GameBus` und den Sim-Zustand (Abklingzeit, HP-Differenz) und aendert den Sim-Zustand nie.
 * Alles gepoolt und gedeckelt: ein Graphics-Objekt fuer Formen und Splitter, wiederverwendete Text-Objekte fuer Zahlen
 * (Zerstoeren/Neuanlegen pro Kill brachte SwiftShader zum Absturz).
 */
import { Container, Graphics, Text } from 'pixi.js';
import type { SimEvent, UnitDef } from '../sim';
import {
  blinkAlpha,
  cueFor,
  DamageNumbers,
  deathParticles,
  formatDamage,
  hitStyle,
  leakBlink,
  pickTarget,
  ShotDetector,
  type HitStyle,
  type TargetCandidate,
} from '../view/feel';
import { enemyStyle, unitColor } from '../view/model';
import { reachMilli } from '../view/unit-info';
import { t } from '../i18n/t';
import { getSettings } from '../ui/settings';
import { C } from './palette';
import { WORLD_H, WORLD_W, type RenderContext } from './context';
import type { EntitiesLayer } from './entities-layer';
import type { GameBus } from './events';
import type { Session } from './session';

const MAX_EFFECTS = 80;
const MAX_PARTICLES = 170;
const MAX_POPS = 44;
const MAX_NUMBERS = 30;
const MAX_NEW_NUMBERS_PER_FRAME = 4;

const enum K {
  Bolt,
  Tracer,
  Slash,
  Ring,
  Blast,
  Cone,
  Line,
  Glow,
}
/** Was nach dem Flug eines Geschosses am Ziel passiert. */
const enum After {
  None,
  Impact,
  Heavy,
  Blast,
}

interface Eff {
  k: K;
  /** Alter in Sekunden, negativ = wartet noch (Verzoegerung). */
  t: number;
  dur: number;
  x: number;
  y: number;
  x2: number;
  y2: number;
  r: number;
  r2: number;
  w: number;
  color: number;
  color2: number;
  ang: number;
  spread: number;
  after: After;
}

interface Part {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: number;
  grav: number;
}

interface Pop {
  text: Text;
  vy: number;
  life: number;
  max: number;
}

const lighten = (c: number, f: number): number => {
  const r = Math.min(255, ((c >> 16) & 255) + (255 - ((c >> 16) & 255)) * f);
  const g = Math.min(255, ((c >> 8) & 255) + (255 - ((c >> 8) & 255)) * f);
  const b = Math.min(255, (c & 255) + (255 - (c & 255)) * f);
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
};
const easeOut = (p: number): number => 1 - (1 - p) * (1 - p);

export class Fx {
  /** Effekte ueber Overlays. */
  readonly container = new Container();
  /** Vollbild-Blitz und Leak-Rand, liegt ganz oben. */
  readonly flash = new Graphics();
  private readonly g = new Graphics();
  private readonly textLayer = new Container();
  private effs: Eff[] = [];
  private effFree: Eff[] = [];
  private readonly parts: Part[] = [];
  private partIdx = 0;
  private pops: Pop[] = [];
  private popPool: Text[] = [];
  private session: Session | null = null;
  private readonly shots = new ShotDetector();
  private readonly dmg = new DamageNumbers();
  private snap: TargetCandidate[] = [];
  private readonly gone = new Map<number, 'kill' | 'leak'>();
  private readonly shotListeners: ((style: HitStyle) => void)[] = [];
  private readonly pendingEntrance = new Set<number>();
  private blink = { age: 99, seconds: 1, strength: 0 };
  private flashDrawn = false;
  private shakeAmp = 0;
  private shakeT = 0;
  private shakeDur = 1;
  private shaking = false;
  private gDrawn = false;
  private readonly calm = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  constructor(private readonly ctx: RenderContext, private readonly entities: EntitiesLayer, bus: GameBus) {
    for (let i = 0; i < MAX_PARTICLES; i++) this.parts.push({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 3, color: 0, grav: 0 });
    this.container.addChild(this.g, this.textLayer);
    bus.onRunStart((s) => {
      this.reset();
      this.session = s;
    });
    bus.onEvents((events) => {
      for (const e of events) this.handle(e);
    });
  }

  /** Zahl lebender Effekte, Splitter und Zahlen (Obergrenzen-Pruefung, Screenshots). */
  get active(): { effects: number; particles: number; numbers: number } {
    return { effects: this.effs.length, particles: this.parts.filter((p) => p.alive).length, numbers: this.pops.length };
  }

  /** Abonnement fuer den Ton: wird bei jedem erkannten Schuss mit dem Trefferstil gerufen. */
  onShot(fn: (style: HitStyle) => void): () => void {
    this.shotListeners.push(fn);
    return () => {
      const i = this.shotListeners.indexOf(fn);
      if (i >= 0) this.shotListeners.splice(i, 1);
    };
  }

  /** Neue Runde: laufende Effekte beenden. */
  reset(): void {
    for (const p of this.pops) {
      p.text.visible = false;
      this.popPool.push(p.text);
    }
    this.pops = [];
    for (const e of this.effs) this.effFree.push(e);
    this.effs = [];
    for (const p of this.parts) p.alive = false;
    this.shots.reset();
    this.dmg.reset();
    this.snap = [];
    this.gone.clear();
    this.pendingEntrance.clear();
    this.blink.age = 99;
    this.shakeT = this.shakeDur;
    this.g.clear();
    this.gDrawn = false;
    this.applyShake(0);
  }

  // ---- Ereignisse ------------------------------------------------------------------------------------------------

  private handle(e: SimEvent): void {
    const cue = cueFor(e);
    if (!cue) return;
    const T = this.ctx.tile;
    switch (cue.kind) {
      case 'kill': {
        this.gone.set(cue.enemyId, 'kill');
        const p = this.entities.enemyPos(cue.enemyId);
        if (!p) break;
        if (this.pops.length < MAX_POPS) this.addPop(`+${cue.bounty}`, p.x, p.y - T * 0.62, C.gold, 0.85, 0.9);
        this.death(p.x, p.y, cue.enemy);
        break;
      }
      case 'leak': {
        this.gone.set(cue.enemyId, 'leak');
        if (cue.damage === 0 && !cue.fatal) {
          // Leak-Schild (Runde 7 / P6): abgefangen, kein Blinken, kein Wackeln, nur eine kleine Marke am Tor.
          const q = this.entities.enemyPos(cue.enemyId);
          if (q && this.pops.length < MAX_POPS) {
            this.addPop(t('leak.guarded'), q.x, q.y - T * 0.5, C.teal, 0.95, 1);
            this.ring(q.x, q.y, T * 0.2, T * 1.1, C.teal, 0.9, 0.4, 4);
          }
          break;
        }
        const b = leakBlink(cue.damage, cue.fatal);
        if (b.strength >= this.blink.strength * (1 - this.blink.age / this.blink.seconds)) this.blink = { age: 0, seconds: b.seconds, strength: b.strength };
        this.shake(cue.fatal ? 7 : 2 + Math.min(3, cue.damage * 0.4), cue.fatal ? 0.6 : 0.3);
        break;
      }
      case 'bossEnter':
        this.pendingEntrance.add(cue.enemyId);
        break;
      case 'bossPhase': {
        const p = this.entities.enemyView(cue.enemyId);
        if (!p) break;
        this.ring(p.x, p.y, T * 0.5, T * 3.2, C.rim, 0.9, 0.7, 6);
        this.ring(p.x, p.y, T * 0.3, T * 2.2, C.gold, 0.8, 0.55, 4, 0.08);
        this.shake(3, 0.35);
        break;
      }
      case 'bossCast': {
        const p = this.entities.enemyView(cue.enemyId);
        if (!p) break;
        if (cue.interrupted) {
          this.ring(p.x, p.y, T * 0.4, T * 2.6, C.white, 0.95, 0.45, 6);
          this.burst(p.x, p.y, 22, C.teal, T * 3.2, 0.7, 4);
          this.burst(p.x, p.y, 10, C.white, T * 2.4, 0.5, 3);
          this.shake(3.5, 0.3);
        } else {
          this.ring(p.x, p.y, T * 0.5, T * 3.4, C.red, 0.9, 0.5, 6);
          this.shake(2.5, 0.25);
        }
        break;
      }
      case 'windowOpen': {
        const p = this.entities.enemyView(cue.enemyId);
        if (!p) break;
        this.ring(p.x, p.y, T * 0.5, T * 2.4, C.teal, 0.95, 0.55, 5);
        this.ring(p.x, p.y, T * 0.3, T * 1.6, C.white, 0.8, 0.4, 3, 0.06);
        if (cue.armor === 0) this.burst(p.x, p.y, 14, C.teal, T * 2.4, 0.8, 4);
        break;
      }
      case 'windowClose': {
        const p = this.entities.enemyView(cue.enemyId);
        if (p) this.ring(p.x, p.y, T * 1.8, T * 0.6, C.teal, 0.6, 0.3, 3);
        break;
      }
      case 'wardBreak': {
        const p = this.entities.enemyView(cue.enemyId);
        if (!p) break;
        this.burst(p.x, p.y, 26, C.ice, T * 3.4, 0.8, 4);
        this.ring(p.x, p.y, T * 0.5, T * 2.4, C.ice, 0.9, 0.45, 5);
        this.shake(2.5, 0.25);
        break;
      }
      case 'ability':
        this.ability(cue.unitId, cue.ability);
        break;
      default:
        break;
    }
  }

  private ability(unitId: number, kind: string): void {
    const s = this.session;
    const u = s?.sim.state.units.find((x) => x.id === unitId);
    const def = u ? this.ctx.defs[u.defId] : undefined;
    if (!s || !u || !def) return;
    const T = this.ctx.tile;
    const o = this.ctx.px(u.x / 1000, u.y / 1000);
    if (kind === 'stunAoe') {
      const radius = ((def.ability as { radiusMilli?: number } | undefined)?.radiusMilli ?? 2500) / 1000;
      this.ring(o.x, o.y, T * 0.3, T * radius, C.ice, 0.95, 0.55, 6);
      this.ring(o.x, o.y, T * 0.2, T * radius * 0.7, C.white, 0.7, 0.4, 3, 0.05);
      this.add({ k: K.Glow, dur: 0.35, x: o.x, y: o.y, r: T * radius * 0.9, color: C.ice, w: 0.18 });
      this.burst(o.x, o.y, 18, C.ice, T * radius * 1.4, 0.7, 3);
    } else if (kind === 'nuke') {
      const list: TargetCandidate[] = this.snap.length > 0 ? this.snap : s.sim.state.enemies;
      const t = pickTarget({ x: 0, y: 0 }, 1e9, true, 'strongest', list);
      const tp = t ? this.ctx.px(t.x / 1000, t.y / 1000) : o;
      this.add({ k: K.Bolt, dur: 0.18, x: o.x, y: o.y, x2: tp.x, y2: tp.y, r: T * 0.16, w: T * 0.1, color: C.ember, color2: C.white, after: After.Blast, r2: T * 1.7 });
      this.shake(6, 0.5);
    }
  }

  private death(x: number, y: number, enemy: string): void {
    const T = this.ctx.tile;
    const col = enemyStyle(enemy).color;
    const n = deathParticles(enemy);
    const big = enemy === 'boss';
    this.burst(x, y, n, lighten(col, 0.25), T * (big ? 3.4 : 1.9), big ? 1 : 0.5, big ? 5 : 3);
    this.burst(x, y, Math.ceil(n / 3), C.white, T * (big ? 2.4 : 1.4), 0.35, 2);
    this.ring(x, y, T * 0.1, T * (big ? 2.6 : 0.55), lighten(col, 0.5), 0.8, big ? 0.6 : 0.28, big ? 6 : 3);
    if (big) {
      this.ring(x, y, T * 0.1, T * 3.4, C.gold, 0.8, 0.8, 5, 0.12);
      this.shake(7, 0.7);
    }
    // Muenz-Funken nach oben
    for (let i = 0; i < 3; i++) this.spawnPart(x, y - T * 0.1, (Math.random() - 0.5) * T * 0.8, -T * (1.1 + Math.random() * 0.8), 0.55, 3, C.gold, T * 3);
  }

  // ---- Bausteine -------------------------------------------------------------------------------------------------

  private add(p: Partial<Eff> & { k: K; dur: number; x: number; y: number }, delay = 0): void {
    if (this.effs.length >= MAX_EFFECTS) return;
    const e = this.effFree.pop() ?? ({} as Eff);
    e.k = p.k;
    e.t = -delay;
    e.dur = p.dur;
    e.x = p.x;
    e.y = p.y;
    e.x2 = p.x2 ?? p.x;
    e.y2 = p.y2 ?? p.y;
    e.r = p.r ?? 0;
    e.r2 = p.r2 ?? 0;
    e.w = p.w ?? 3;
    e.color = p.color ?? C.white;
    e.color2 = p.color2 ?? C.white;
    e.ang = p.ang ?? 0;
    e.spread = p.spread ?? 0;
    e.after = p.after ?? After.None;
    this.effs.push(e);
  }

  private ring(x: number, y: number, r: number, r2: number, color: number, alpha: number, dur: number, w: number, delay = 0): void {
    this.add({ k: K.Ring, dur, x, y, r, r2, color, w, spread: alpha }, delay);
  }

  private burst(x: number, y: number, n: number, color: number, speed: number, life: number, size: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.65);
      this.spawnPart(x, y, Math.cos(a) * v, Math.sin(a) * v - speed * 0.15, life * (0.6 + Math.random() * 0.5), size, i % 4 === 0 ? lighten(color, 0.5) : color, speed * 0.9);
    }
  }

  private spawnPart(x: number, y: number, vx: number, vy: number, life: number, size: number, color: number, grav: number): void {
    // Ringpuffer: ist alles belegt, wird der aelteste Splitter ueberschrieben (Obergrenze, kein Wachstum)
    const p = this.parts[this.partIdx];
    this.partIdx = (this.partIdx + 1) % MAX_PARTICLES;
    p.alive = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.life = life;
    p.max = life;
    p.size = Math.max(2, Math.round(size * Math.max(1, this.ctx.art * 0.75)));
    p.color = color;
    p.grav = grav;
  }

  private addPop(label: string, x: number, y: number, color: number, scale: number, life: number): void {
    let text = this.popPool.pop();
    if (!text) {
      text = new Text({ text: label, style: { fontFamily: 'monospace', fontSize: 20, fontWeight: 'bold', fill: C.gold, stroke: { color: C.ink, width: 4 } } });
      text.anchor.set(0.5);
      this.textLayer.addChild(text);
    }
    if (text.text !== label) text.text = label;
    text.style.fill = color;
    text.visible = true;
    text.alpha = 1;
    text.scale.set((this.ctx.tile / 48) * scale);
    text.position.set(x, y);
    this.pops.push({ text, vy: -this.ctx.tile * 0.9, life, max: life });
  }

  private shake(amp: number, dur: number): void {
    if (this.calm) return;
    const left = this.shakeAmp * Math.max(0, 1 - this.shakeT / this.shakeDur);
    if (amp < left) return;
    this.shakeAmp = amp;
    this.shakeT = 0;
    this.shakeDur = dur;
  }

  private applyShake(dt: number): void {
    const stage = this.container.parent;
    if (!stage) return;
    this.shakeT += dt;
    if (this.shakeT >= this.shakeDur) {
      if (this.shaking) {
        stage.position.set(0, 0);
        this.shaking = false;
      }
      return;
    }
    const a = this.shakeAmp * (1 - this.shakeT / this.shakeDur);
    stage.position.set(Math.round((Math.random() * 2 - 1) * a), Math.round((Math.random() * 2 - 1) * a));
    this.shaking = true;
  }

  // ---- Schuesse und Zahlen (aus dem Zustand gelesen) -----------------------------------------------------------------

  private scanState(nowMs: number): void {
    const s = this.session;
    const stage = this.ctx.stage;
    if (!s || !stage) return;
    const st = s.sim.state;
    const T = this.ctx.tile;
    const fired = this.shots.detect(st.units);
    const pool: TargetCandidate[] = this.snap.length > 0 ? this.snap : st.enemies;
    for (const id of fired) {
      const u = st.units.find((x) => x.id === id);
      const def = u ? this.ctx.defs[u.defId] : undefined;
      const style = def ? hitStyle(def) : null;
      if (!u || !def || !style) continue;
      const range = reachMilli(def, u.level);
      const origin = { x: u.x, y: u.y };
      const target = pickTarget(origin, range, def.canHitAir, u.targeting, pool) ?? pickTarget(origin, range, def.canHitAir, u.targeting, st.enemies);
      if (!target) continue;
      const o = this.ctx.px(u.x / 1000, u.y / 1000);
      const tp = this.ctx.px(target.x / 1000, target.y / 1000);
      this.shoot(style, def.attack, unitColor(def.id), o.x, o.y, tp.x, tp.y, range, T);
      if (def.attack?.kind === 'chain') this.chainLinks(def, target, pool, unitColor(def.id), T);
      for (const fn of this.shotListeners) fn(style);
    }
    // Schadenszahlen aus der HP-Differenz
    const nums = this.dmg.step(st.enemies, this.gone, nowMs);
    this.gone.clear();
    const settings = getSettings();
    let budget = MAX_NEW_NUMBERS_PER_FRAME;
    for (const n of nums) {
      if (!settings.damageNumbers || budget <= 0 || this.pops.length >= MAX_NUMBERS) break;
      const p = this.entities.enemyView(n.enemyId) ?? this.entities.enemyPos(n.enemyId);
      if (!p) continue;
      budget--;
      const inWindow = s.tracker.windows.has(n.enemyId);
      const boss = s.tracker.phases.has(n.enemyId) || st.enemies.some((e) => e.id === n.enemyId && e.boss);
      const label = n.heal ? `+${formatDamage(n.centi)}` : formatDamage(n.centi);
      const color = n.heal ? 0x7bd868 : inWindow ? C.gold : C.white;
      const scale = (inWindow ? 1.3 : 1) * (boss ? 1.1 : 0.78);
      this.addPop(label, p.x + (Math.random() - 0.5) * T * 0.35, p.y - T * 0.3, color, scale, 0.6);
    }
    this.snap = st.enemies.map((e) => ({ id: e.id, x: e.x, y: e.y, flying: e.flying, hp: e.hp, progress: e.progress }));
  }

  private shoot(style: HitStyle, attack: { kind: string; radiusMilli?: number; widthMilli?: number; coneDeg?: number } | null, color: number, ox: number, oy: number, tx: number, ty: number, rangeMilli: number, T: number): void {
    const ang = Math.atan2(ty - oy, tx - ox);
    this.add({ k: K.Glow, dur: 0.09, x: ox, y: oy, r: T * 0.17, color, w: 0.8 });
    switch (style) {
      case 'slash':
        this.add({ k: K.Slash, dur: 0.2, x: tx, y: ty, r: T * 0.36, color, color2: C.white, ang, w: Math.max(3, T * 0.07) });
        this.burst(tx, ty, 4, color, T * 1.4, 0.3, 2);
        break;
      case 'tracer':
        this.add({ k: K.Tracer, dur: 0.1, x: ox, y: oy, x2: tx, y2: ty, color, color2: C.white, w: Math.max(2, T * 0.05) });
        this.add({ k: K.Ring, dur: 0.14, x: tx, y: ty, r: T * 0.05, r2: T * 0.2, color: C.white, w: 2, spread: 0.9 });
        this.burst(tx, ty, 3, color, T * 1.2, 0.25, 2);
        break;
      case 'shell':
        this.add({ k: K.Bolt, dur: 0.17, x: ox, y: oy, x2: tx, y2: ty, r: T * 0.15, w: T * 0.1, color: C.ember, color2: C.white, after: After.Heavy });
        break;
      case 'blast':
        this.add({ k: K.Bolt, dur: 0.14, x: ox, y: oy, x2: tx, y2: ty, r: T * 0.11, w: T * 0.06, color: C.ember, color2: C.gold, after: After.Blast, r2: ((attack?.radiusMilli ?? 1200) / 1000) * T });
        break;
      case 'cone': {
        const half = ((attack?.coneDeg ?? 60) * Math.PI) / 360;
        this.add({ k: K.Cone, dur: 0.32, x: ox, y: oy, r: (rangeMilli / 1000) * T, color, color2: C.white, ang, spread: half });
        this.burst(ox + Math.cos(ang) * T * 0.6, oy + Math.sin(ang) * T * 0.6, 5, C.ice, T * 2.2, 0.4, 2);
        break;
      }
      case 'line':
        this.add({ k: K.Line, dur: 0.22, x: ox, y: oy, r: (rangeMilli / 1000) * T, w: ((attack?.widthMilli ?? 600) / 1000) * T, color, color2: C.white, ang });
        this.burst(tx, ty, 4, C.ice, T * 1.3, 0.3, 2);
        break;
      default:
        this.add({ k: K.Bolt, dur: 0.1, x: ox, y: oy, x2: tx, y2: ty, r: T * 0.08, w: T * 0.04, color, color2: C.white, after: After.Impact });
        break;
    }
  }

  /** Kettenblitz (Runde 7 / P6): Linien vom Ziel zu den naechsten Gegnern (wie die Sim: naechster ungetroffener, Sprungweite aus den Daten). Nur Darstellung. */
  private chainLinks(def: UnitDef, first: TargetCandidate, pool: readonly TargetCandidate[], color: number, T: number): void {
    const a = def.attack;
    if (!a || a.kind !== 'chain') return;
    const jr = (a.jumpRadiusMilli ?? 1800) ** 2;
    const hit = new Set<number>([first.id]);
    let cur = first;
    for (let j = 0; j < (a.jumps ?? 4); j++) {
      let next: TargetCandidate | null = null;
      let nd = Infinity;
      for (const e of pool) {
        if (hit.has(e.id) || (e.flying && !def.canHitAir)) continue;
        const d2 = (e.x - cur.x) ** 2 + (e.y - cur.y) ** 2;
        if (d2 <= jr && d2 < nd) {
          next = e;
          nd = d2;
        }
      }
      if (!next) break;
      hit.add(next.id);
      const p = this.ctx.px(cur.x / 1000, cur.y / 1000);
      const q = this.ctx.px(next.x / 1000, next.y / 1000);
      this.add({ k: K.Tracer, dur: 0.14 + 0.03 * j, x: p.x, y: p.y, x2: q.x, y2: q.y, color, color2: C.white, w: Math.max(2, T * 0.05) });
      this.burst(q.x, q.y, 2, color, T * 1.0, 0.22, 2);
      cur = next;
    }
  }

  private landed(e: Eff): void {
    const T = this.ctx.tile;
    if (e.after === After.Impact) {
      this.ring(e.x2, e.y2, T * 0.06, T * 0.3, e.color2, 0.9, 0.16, 2);
      this.burst(e.x2, e.y2, 4, e.color, T * 1.4, 0.28, 2);
    } else if (e.after === After.Heavy) {
      this.ring(e.x2, e.y2, T * 0.1, T * 0.7, C.ember, 0.95, 0.28, 5);
      this.add({ k: K.Glow, dur: 0.18, x: e.x2, y: e.y2, r: T * 0.5, color: C.ember, w: 0.5 });
      this.burst(e.x2, e.y2, 12, C.ember, T * 2.2, 0.5, 3);
      this.shake(2, 0.18);
    } else if (e.after === After.Blast) {
      const R = e.r2 || T * 1.2;
      this.add({ k: K.Blast, dur: 0.34, x: e.x2, y: e.y2, r2: R, color: C.ember, color2: C.gold });
      this.burst(e.x2, e.y2, R > T * 1.5 ? 20 : 9, C.ember, T * 2.2, 0.5, 3);
      if (R > T * 1.5) this.shake(2.5, 0.2);
    }
  }

  // ---- Frame -------------------------------------------------------------------------------------------------------

  update(dtMs: number): void {
    const dt = Math.min(0.1, dtMs / 1000);
    const nowMs = performance.now();
    if (this.session && !this.session.paused) this.scanState(nowMs);

    // Boss-Auftritt, sobald die Figur eine Ansicht hat
    for (const id of this.pendingEntrance) {
      const p = this.entities.enemyView(id);
      if (!p) continue;
      this.pendingEntrance.delete(id);
      const T = this.ctx.tile;
      this.ring(p.x, p.y, T * 0.4, T * 4.2, C.red, 0.9, 0.9, 7);
      this.ring(p.x, p.y, T * 0.3, T * 3, C.gold, 0.8, 0.7, 5, 0.12);
      this.ring(p.x, p.y, T * 0.2, T * 2, C.rim, 0.8, 0.55, 4, 0.24);
      this.add({ k: K.Glow, dur: 0.6, x: p.x, y: p.y, r: T * 2.2, color: C.rim, w: 0.3 });
      this.burst(p.x, p.y, 30, C.rim, T * 4, 0.9, 4);
      this.shake(7, 0.7);
      this.blink = { age: 0, seconds: 0.9, strength: 0.5 };
    }

    this.updateShapes(dt);
    this.updatePops(dt);
    this.updateFlash(dt);
    this.applyShake(dt);
  }

  private updateShapes(dt: number): void {
    const g = this.g;
    let any = false;
    const effs = this.effs;
    for (let i = effs.length - 1; i >= 0; i--) {
      const e = effs[i];
      e.t += dt;
      if (e.t >= e.dur) {
        effs[i] = effs[effs.length - 1];
        effs.pop();
        if (e.k === K.Bolt) this.landed(e);
        this.effFree.push(e);
      }
    }
    let live = this.effs.length > 0;
    for (const p of this.parts) if (p.alive) live = true;
    if (!live) {
      if (this.gDrawn) {
        g.clear();
        this.gDrawn = false;
      }
      return;
    }
    g.clear();
    this.gDrawn = true;
    for (const e of this.effs) {
      if (e.t < 0) continue;
      any = true;
      const p = Math.min(1, e.t / e.dur);
      const inv = 1 - p;
      switch (e.k) {
        case K.Bolt: {
          const hx = e.x + (e.x2 - e.x) * p;
          const hy = e.y + (e.y2 - e.y) * p;
          const tp = Math.max(0, p - 0.35);
          const tx = e.x + (e.x2 - e.x) * tp;
          const ty = e.y + (e.y2 - e.y) * tp;
          g.moveTo(tx, ty).lineTo(hx, hy).stroke({ width: e.w, color: e.color, alpha: 0.65, cap: 'round' });
          g.circle(hx, hy, e.r).fill({ color: e.color2 });
          g.circle(hx, hy, e.r * 1.7).fill({ color: e.color, alpha: 0.35 });
          break;
        }
        case K.Tracer:
          g.moveTo(e.x, e.y).lineTo(e.x2, e.y2).stroke({ width: e.w * (1 + inv), color: e.color, alpha: 0.7 * inv, cap: 'round' });
          g.moveTo(e.x, e.y).lineTo(e.x2, e.y2).stroke({ width: Math.max(1, e.w * 0.4), color: e.color2, alpha: inv, cap: 'round' });
          break;
        case K.Slash: {
          const r = e.r * (0.7 + 0.5 * easeOut(p));
          const a0 = e.ang - 1.0 + p * 0.5;
          const a1 = e.ang + 1.0 + p * 0.5;
          g.moveTo(e.x + Math.cos(a0) * r, e.y + Math.sin(a0) * r).arc(e.x, e.y, r, a0, a1).stroke({ width: e.w, color: e.color2, alpha: inv, cap: 'round' });
          const r2 = r * 0.7;
          g.moveTo(e.x + Math.cos(a0 + 0.2) * r2, e.y + Math.sin(a0 + 0.2) * r2).arc(e.x, e.y, r2, a0 + 0.2, a1 - 0.2).stroke({ width: Math.max(2, e.w * 0.6), color: e.color, alpha: inv * 0.8, cap: 'round' });
          break;
        }
        case K.Ring: {
          const r = e.r + (e.r2 - e.r) * easeOut(p);
          g.circle(e.x, e.y, Math.max(1, r)).stroke({ width: Math.max(1, e.w * inv), color: e.color, alpha: inv * e.spread });
          break;
        }
        case K.Glow:
          g.circle(e.x, e.y, e.r * (0.7 + 0.5 * p)).fill({ color: e.color, alpha: inv * e.w });
          break;
        case K.Blast: {
          const r = e.r2 * easeOut(Math.min(1, p * 1.6));
          g.circle(e.x, e.y, r).fill({ color: e.color, alpha: 0.32 * inv });
          g.circle(e.x, e.y, r * 0.55).fill({ color: e.color2, alpha: 0.5 * inv });
          g.circle(e.x, e.y, r).stroke({ width: 3, color: e.color2, alpha: 0.9 * inv });
          break;
        }
        case K.Cone: {
          const r = e.r * easeOut(Math.min(1, p * 2.4));
          const a0 = e.ang - e.spread;
          const a1 = e.ang + e.spread;
          g.moveTo(e.x, e.y).lineTo(e.x + Math.cos(a0) * r, e.y + Math.sin(a0) * r).arc(e.x, e.y, r, a0, a1).lineTo(e.x, e.y).fill({ color: e.color, alpha: 0.32 * inv });
          g.moveTo(e.x, e.y).lineTo(e.x + Math.cos(a0) * r, e.y + Math.sin(a0) * r).arc(e.x, e.y, r, a0, a1).lineTo(e.x, e.y).stroke({ width: 3, color: e.color2, alpha: 0.85 * inv });
          // Eis-Zacken entlang der Mittellinie
          for (let k = 1; k <= 3; k++) {
            const rr = r * (k / 3.4);
            g.moveTo(e.x + Math.cos(e.ang) * rr, e.y + Math.sin(e.ang) * rr).lineTo(e.x + Math.cos(e.ang + 0.35) * (rr + 8), e.y + Math.sin(e.ang + 0.35) * (rr + 8)).stroke({ width: 2, color: e.color2, alpha: 0.7 * inv });
          }
          break;
        }
        case K.Line: {
          const reach = e.r * easeOut(Math.min(1, p * 4));
          const w = e.w * (1 - p * 0.6);
          const dx = Math.cos(e.ang);
          const dy = Math.sin(e.ang);
          const nx = -dy * (w / 2);
          const ny = dx * (w / 2);
          g.poly([e.x + nx, e.y + ny, e.x + dx * reach + nx, e.y + dy * reach + ny, e.x + dx * reach - nx, e.y + dy * reach - ny, e.x - nx, e.y - ny]).fill({ color: e.color, alpha: 0.5 * inv });
          g.moveTo(e.x, e.y).lineTo(e.x + dx * reach, e.y + dy * reach).stroke({ width: Math.max(2, w * 0.3), color: e.color2, alpha: inv });
          break;
        }
        default:
          break;
      }
    }
    // Splitter
    for (const q of this.parts) {
      if (!q.alive) continue;
      any = true;
      q.life -= dt;
      if (q.life <= 0) {
        q.alive = false;
        continue;
      }
      q.vy += q.grav * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= 1 - Math.min(1, 2.2 * dt);
      g.rect(Math.round(q.x - q.size / 2), Math.round(q.y - q.size / 2), q.size, q.size).fill({ color: q.color, alpha: Math.min(1, (q.life / q.max) * 1.6) });
    }
    if (!any) {
      g.clear();
      this.gDrawn = false;
    }
  }

  private updatePops(dt: number): void {
    for (const p of this.pops) {
      p.life -= dt;
      p.text.y += p.vy * dt;
      p.vy *= 1 - Math.min(1, 2.5 * dt);
      p.text.alpha = Math.max(0, Math.min(1, p.life / (p.max * 0.45)));
    }
    this.pops = this.pops.filter((p) => {
      if (p.life > 0) return true;
      p.text.visible = false;
      this.popPool.push(p.text);
      return false;
    });
  }

  /** Leak-Rand: roter Rahmen, der pulsiert und ausklingt, dazu ein leichter Schleier. */
  private updateFlash(dt: number): void {
    const b = this.blink;
    b.age += dt;
    const a = blinkAlpha(b.age, b.seconds, b.strength);
    if (a > 0.01) {
      const W = WORLD_W * this.ctx.tile;
      const H = WORLD_H * this.ctx.tile;
      const step = Math.max(6, this.ctx.tile * 0.14);
      const f = this.flash.clear();
      f.rect(0, 0, W, H).fill({ color: C.red, alpha: a * 0.1 });
      for (let i = 0; i < 4; i++) {
        const inset = step * (i + 0.5);
        f.rect(inset, inset, W - inset * 2, H - inset * 2).stroke({ width: step, color: C.red, alpha: Math.min(1, a * (0.95 - i * 0.2)) });
      }
      this.flashDrawn = true;
    } else if (this.flashDrawn) {
      this.flash.clear();
      this.flashDrawn = false;
    }
  }
}
