/**
 * Effekte (P5, Runde 10 / P2 neu): Schuesse und Treffer je Angriffsform x Element, Schadenszahlen (Krit gelb und gross), Tod mit Muenzen,
 * Aufsetz-, Upgrade- und Verkaufs-Effekte, Leak-Rand, Boss-Auftritt, Bildschuettern (abschaltbar).
 * Liest NUR Ereignisse vom `GameBus` und den Sim-Zustand (Abklingzeit, HP-Differenz) und aendert den Sim-Zustand nie.
 * Aussehen entscheidet `view/look.ts` (`attackLook`), Zeichnen `attack-gfx.ts`. Alles gepoolt und gedeckelt: ein Graphics fuer Formen,
 * Splitter als wiederverwendete Sprites in zwei Pools (normal/additiv), Zahlen als wiederverwendete Texte. `detailFactor` nimmt bei Last Splitter weg.
 */
import { Container, Graphics, Sprite, Text } from 'pixi.js';
import type { SimEvent, UnitDef, UnitState } from '../sim';
import type { SoundId } from '../audio/logic';
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
import { attackLook, detailFactor, enemyLook, guessCrit, lookOf, rarityLook, unitLook, type ElementLook, type ParticleKind } from '../view/look';
import { reachMilli } from '../view/unit-info';
import { t } from '../i18n/t';
import { getSettings } from '../ui/settings';
import { C } from './palette';
import { drawBeam, drawFan, drawProjectile, drawSlash, drawWave, easeOut, type GfxEff } from './attack-gfx';
import { type RenderContext } from './context';
import type { EntitiesLayer } from './entities-layer';
import type { GameBus } from './events';
import type { Session } from './session';

export const MAX_EFFECTS = 90;
/** Splitter je Pool (normal und additiv). */
export const MAX_PARTICLES = 130;
const MAX_POPS = 48;
const MAX_NUMBERS = 30;
const MAX_NEW_NUMBERS_PER_FRAME = 4;
/** Hoechstens so viele Schuesse je Frame bekommen die volle Grafik, der Rest nur Aufleuchten + Ton (30 Units im Dauerfeuer). */
const MAX_SHOTS_PER_FRAME = 14;

const enum K {
  Proj,
  Slash,
  Ring,
  Wave,
  Fan,
  Beam,
  Glow,
  Tracer,
}
/** Was nach dem Flug eines Geschosses am Ziel passiert. */
const enum After {
  None,
  Impact,
  Blast,
}

interface Eff extends GfxEff {
  k: K;
  /** Alter in Sekunden, negativ = wartet noch (Verzoegerung). */
  t: number;
  dur: number;
  color: number;
  color2: number;
  after: After;
}

interface Part {
  s: Sprite;
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  grav: number;
  spin: number;
  aim: boolean;
  delay: number;
  shrink: boolean;
}

interface Pop {
  text: Text;
  vy: number;
  life: number;
  max: number;
  age: number;
  base: number;
  punch: number;
}

interface LastShot {
  t: number;
  n: number;
  base: number;
  critBp: number;
  critMultBp: number;
  el: ElementLook;
}

interface Later {
  at: number;
  fn: () => void;
}

const lighten = (c: number, f: number): number => {
  const r = Math.min(255, ((c >> 16) & 255) + (255 - ((c >> 16) & 255)) * f);
  const g = Math.min(255, ((c >> 8) & 255) + (255 - ((c >> 8) & 255)) * f);
  const b = Math.min(255, (c & 255) + (255 - (c & 255)) * f);
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
};
/** Splitterarten, die leuchten (additiv gemischt) und solche, die als feste Koerper erscheinen. */
const GLOW_KINDS = new Set<ParticleKind>(['ember', 'spark', 'star', 'ray', 'rune', 'wisp', 'coin']);
const SPIN_KINDS = new Set<ParticleKind>(['shard', 'petal', 'chip', 'star', 'rune']);
const PROJ_SPEED: Record<string, number> = { bullet: 34, bolt: 42, orb: 15, shard: 24, blade: 20, petal: 13 };
const PROJ_RANGE: Record<string, [number, number]> = { bullet: [0.06, 0.16], bolt: [0.05, 0.1], orb: [0.1, 0.34], shard: [0.08, 0.22], blade: [0.1, 0.26], petal: [0.14, 0.34] };

export class Fx {
  /** Effekte ueber Overlays. */
  readonly container = new Container();
  /** Vollbild-Blitz und Leak-Rand, liegt ganz oben. */
  readonly flash = new Graphics();
  private readonly g = new Graphics();
  private readonly partsNormal = new Container();
  private readonly partsAdd = new Container();
  private readonly textLayer = new Container();
  private effs: Eff[] = [];
  private effFree: Eff[] = [];
  private readonly pn: Part[] = [];
  private readonly pa: Part[] = [];
  private idxN = 0;
  private idxA = 0;
  private pops: Pop[] = [];
  private popPool: Text[] = [];
  private session: Session | null = null;
  private readonly shots = new ShotDetector();
  private readonly dmg = new DamageNumbers();
  private snap: TargetCandidate[] = [];
  private readonly gone = new Map<number, 'kill' | 'leak'>();
  private readonly lastShot = new Map<number, LastShot>();
  private readonly shotListeners: ((style: HitStyle, element?: string) => void)[] = [];
  private readonly cueListeners: ((id: SoundId, gain?: number) => void)[] = [];
  private readonly pendingEntrance = new Set<number>();
  private later: Later[] = [];
  private clock = 0;
  private seedCounter = 1;
  private blink = { age: 99, seconds: 1, strength: 0 };
  private flashDrawn = false;
  private shakeAmp = 0;
  private shakeT = 0;
  private shakeDur = 1;
  private shaking = false;
  private gDrawn = false;
  private lastDetail = 1;
  private readonly calm = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  constructor(private readonly ctx: RenderContext, private readonly entities: EntitiesLayer, bus: GameBus) {
    this.container.addChild(this.g, this.partsNormal, this.partsAdd, this.textLayer);
    this.partsAdd.blendMode = 'add';
    bus.onRunStart((s) => {
      this.reset();
      this.session = s;
    });
    bus.onEvents((events) => {
      for (const e of events) this.handle(e);
    });
    bus.onCommand((rec) => {
      if (!rec.result.ok) return;
      const c = rec.cmd;
      if (c.type === 'place') this.onPlace(c.unitId, c.x, c.y, rec.result.entityId);
      else if (c.type === 'upgrade') this.onUpgrade(c.entityId);
      else if (c.type === 'sell') this.onSell(c.entityId);
    });
  }

  /** Splitter-Sprites werden erst bei Bedarf angelegt (die Pools brauchen den Renderer nicht beim Konstruieren). */
  private ensureParts(): void {
    if (this.pn.length > 0) return;
    const mk = (into: Part[], c: Container): void => {
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const s = new Sprite();
        s.anchor.set(0.5);
        s.visible = false;
        c.addChild(s);
        into.push({ s, alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 4, grav: 0, spin: 0, aim: false, delay: 0, shrink: false });
      }
    };
    mk(this.pn, this.partsNormal);
    mk(this.pa, this.partsAdd);
  }

  /** Zahl lebender Effekte, Splitter und Zahlen (Obergrenzen-Pruefung, Screenshots, Leistungsmessung). */
  get active(): { effects: number; particles: number; numbers: number } {
    let n = 0;
    for (const p of this.pn) if (p.alive) n++;
    for (const p of this.pa) if (p.alive) n++;
    return { effects: this.effs.length, particles: n, numbers: this.pops.length };
  }

  /** Abonnement fuer den Ton: wird bei jedem erkannten Schuss mit Trefferstil und Element gerufen. */
  onShot(fn: (style: HitStyle, element?: string) => void): () => void {
    this.shotListeners.push(fn);
    return () => {
      const i = this.shotListeners.indexOf(fn);
      if (i >= 0) this.shotListeners.splice(i, 1);
    };
  }

  /** Abonnement fuer Ton-Zeichen, die aus der Darstellung kommen (Krit, Boss-Tod). */
  onCue(fn: (id: SoundId, gain?: number) => void): () => void {
    this.cueListeners.push(fn);
    return () => {
      const i = this.cueListeners.indexOf(fn);
      if (i >= 0) this.cueListeners.splice(i, 1);
    };
  }

  private cue(id: SoundId, gain = 1): void {
    for (const fn of this.cueListeners) fn(id, gain);
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
    for (const p of this.pn) this.kill(p);
    for (const p of this.pa) this.kill(p);
    this.shots.reset();
    this.dmg.reset();
    this.snap = [];
    this.gone.clear();
    this.lastShot.clear();
    this.pendingEntrance.clear();
    this.later = [];
    this.blink.age = 99;
    this.shakeT = this.shakeDur;
    this.g.clear();
    this.gDrawn = false;
    this.applyShake(0);
  }

  private kill(p: Part): void {
    p.alive = false;
    p.s.visible = false;
  }

  private get detail(): number {
    return this.lastDetail;
  }

  // ---- Befehle (Platzieren, Upgrade, Verkaufen) --------------------------------------------------------------------

  /** Aufsetzen: Hopser (Ansicht holt sich die Markierung), nach 0,2 s Staubring, Splitter und Seltenheits-Funken. */
  private onPlace(unitId: string, x: number, y: number, entityId: number | undefined): void {
    const def = this.ctx.defs[unitId];
    if (!def) return;
    if (entityId !== undefined) this.entities.markPlaced(entityId);
    const T = this.ctx.tile;
    const p = this.ctx.px(x / 1000, y / 1000);
    const rl = rarityLook(def.rarity);
    const R = def.footprint === 2 ? 1.5 : 1;
    // Landemarke: Ring zieht sich zusammen, bis die Figur aufsetzt
    this.ringEff(p.x, p.y + T * 0.2, T * 1.1 * R, T * 0.3 * R, rl.a, 0.7, 0.2, 3);
    this.after(0.2, () => {
      const q = p.y + T * 0.2;
      this.ringEff(p.x, q, T * 0.2, T * 1.15 * R, rl.a, 0.85, 0.32, 5);
      this.ringEff(p.x, q, T * 0.1, T * 0.7 * R, 0xffffff, 0.6, 0.22, 3);
      this.emitBurst('chip', false, p.x, q, 9, 0xd9c9a0, T * 1.6, 0.4, 4, T * 4, 0.5);
      if (rl.studs > 0) this.emitBurst('star', true, p.x, q - T * 0.1, def.rarity === 'Legendary' ? 5 : 10, rl.a, T * 2.4, 0.55, 5, -T * 1, 0.6);
      if (rl.live) this.shake(2, 0.2);
    });
  }

  private onUpgrade(entityId: number): void {
    this.entities.markUpgraded(entityId);
    const v = this.entities.unitView(entityId);
    if (!v) return;
    const T = this.ctx.tile;
    this.ringEff(v.x, v.y + v.R * 0.6, v.R * 0.4, v.R * 2.2, C.gold, 0.9, 0.4, 4);
    this.emitBurst('star', true, v.x, v.y, 10, C.gold, T * 2.2, 0.6, 5, -T * 1.4, 0.7);
  }

  private onSell(entityId: number): void {
    const v = this.entities.unitView(entityId);
    if (!v) return;
    const T = this.ctx.tile;
    this.ringEff(v.x, v.y, v.R * 0.5, v.R * 1.8, C.gold, 0.7, 0.3, 3);
    this.emitBurst('coin', true, v.x, v.y, 7, C.gold, T * 2.4, 0.7, 6, T * 4.5, 0.4);
  }

  // ---- Ereignisse ------------------------------------------------------------------------------------------------

  private handle(e: SimEvent): void {
    const cue = cueFor(e);
    if (!cue) return;
    const T = this.ctx.tile;
    switch (cue.kind) {
      case 'kill': {
        this.gone.set(cue.enemyId, 'kill');
        this.entities.markKilled(cue.enemyId);
        const p = this.entities.enemyPos(cue.enemyId);
        if (!p) break;
        if (this.pops.length < MAX_POPS) this.addPop(`+${cue.bounty}`, p.x, p.y - T * 0.62, C.gold, 0.85, 0.9);
        this.death(p.x, p.y, cue.enemy);
        if (cue.enemy === 'boss') this.cue('bossDeath');
        break;
      }
      case 'leak': {
        this.gone.set(cue.enemyId, 'leak');
        if (cue.damage === 0 && !cue.fatal) {
          // Leak-Schild (Runde 7 / P6): abgefangen, kein Blinken, kein Wackeln, nur eine kleine Marke am Tor.
          const q = this.entities.enemyPos(cue.enemyId);
          if (q && this.pops.length < MAX_POPS) {
            this.addPop(t('leak.guarded'), q.x, q.y - T * 0.5, C.teal, 0.95, 1);
            this.ringEff(q.x, q.y, T * 0.2, T * 1.1, C.teal, 0.9, 0.4, 4);
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
        this.ringEff(p.x, p.y, T * 0.5, T * 3.2, C.rim, 0.9, 0.7, 6);
        this.ringEff(p.x, p.y, T * 0.3, T * 2.2, C.gold, 0.8, 0.55, 4, 0.08);
        this.shake(3, 0.35);
        break;
      }
      case 'bossCast': {
        const p = this.entities.enemyView(cue.enemyId);
        if (!p) break;
        if (cue.interrupted) {
          this.ringEff(p.x, p.y, T * 0.4, T * 2.6, C.white, 0.95, 0.45, 6);
          this.emitBurst('shard', false, p.x, p.y, 16, C.teal, T * 3.2, 0.7, 5, T * 2, 0.6);
          this.emitBurst('spark', true, p.x, p.y, 10, C.white, T * 2.4, 0.5, 5, 0, 0.4);
          this.shake(3.5, 0.3);
        } else {
          this.ringEff(p.x, p.y, T * 0.5, T * 3.4, C.red, 0.9, 0.5, 6);
          this.shake(2.5, 0.25);
        }
        break;
      }
      case 'windowOpen': {
        const p = this.entities.enemyView(cue.enemyId);
        if (!p) break;
        this.ringEff(p.x, p.y, T * 0.5, T * 2.4, C.teal, 0.95, 0.55, 5);
        this.ringEff(p.x, p.y, T * 0.3, T * 1.6, C.white, 0.8, 0.4, 3, 0.06);
        if (cue.armor === 0) this.emitBurst('star', true, p.x, p.y, 12, C.teal, T * 2.4, 0.8, 5, 0, 0.6);
        break;
      }
      case 'windowClose': {
        const p = this.entities.enemyView(cue.enemyId);
        if (p) this.ringEff(p.x, p.y, T * 1.8, T * 0.6, C.teal, 0.6, 0.3, 3);
        break;
      }
      case 'wardBreak': {
        const p = this.entities.enemyView(cue.enemyId);
        if (!p) break;
        this.emitBurst('shard', false, p.x, p.y, 20, C.ice, T * 3.4, 0.8, 5, T * 2, 0.6);
        this.ringEff(p.x, p.y, T * 0.5, T * 2.4, C.ice, 0.9, 0.45, 5);
        this.shake(2.5, 0.25);
        break;
      }
      case 'ability': {
        const u = this.session?.sim.state.units.find((x) => x.id === cue.unitId);
        if (!u) break;
        const def = this.ctx.defs[u.defId];
        const el = def ? unitLook(def) : lookOf('physical');
        const p = this.ctx.px(u.x / 1000, u.y / 1000);
        this.ringEff(p.x, p.y, T * 0.3, T * (cue.auto ? 1.4 : 2.8), el.main, 0.95, 0.6, cue.auto ? 3 : 5);
        if (cue.auto) break;
        // Sammeln, dann Ausbruch: Licht saugt sich in die Figur, danach Welle und Splitter in Elementfarbe
        this.ringEff(p.x, p.y, T * 2, T * 0.3, el.light, 0.7, 0.28, 3);
        this.ringEff(p.x, p.y, T * 0.2, T * 1.8, C.white, 0.85, 0.4, 3, 0.1);
        this.addEff({ k: K.Glow, dur: 0.5, x: p.x, y: p.y, r: T * 1.5, color: el.main, w: 0.4 });
        this.elBurst(el, p.x, p.y, 18, T * 2.8, 0.75, 5);
        this.shake(2.5, 0.28);
        break;
      }
      case 'summon': {
        const p = this.ctx.px(cue.x / 1000, cue.y / 1000);
        this.ringEff(p.x, p.y, T * 0.1, T * 0.9, C.rim, 0.9, 0.4, 4);
        this.emitBurst('wisp', true, p.x, p.y, 8, C.rim, T * 1.4, 0.5, 6, -T * 0.6, 0.5);
        break;
      }
      case 'summonEnd': {
        const p = this.ctx.px(cue.x / 1000, cue.y / 1000);
        if (cue.cause === 'blast' || cue.cause === 'dead') this.emitBurst('ember', true, p.x, p.y, cue.cause === 'blast' ? 14 : 7, cue.cause === 'blast' ? C.ember : C.white, T * 1.8, 0.5, 5, 0, 0.5);
        else this.ringEff(p.x, p.y, T * 0.5, T * 0.1, C.rim, 0.6, 0.3, 3);
        break;
      }
      default:
        break;
    }
  }

  private death(x: number, y: number, enemy: string): void {
    const T = this.ctx.tile;
    const lk = enemyLook(enemy);
    const n = deathParticles(enemy);
    const big = enemy === 'boss';
    this.emitBurst('chip', false, x, y, n, lk.edge, T * (big ? 3.4 : 1.9), big ? 1 : 0.5, big ? 6 : 4, T * 4.5, big ? 0.9 : 0.5);
    this.emitBurst('spark', true, x, y, Math.ceil(n / 3), C.white, T * (big ? 2.4 : 1.4), 0.35, 4, 0, 0.5);
    this.ringEff(x, y, T * 0.1, T * (big ? 2.6 : 0.55), lighten(lk.edge, 0.5), 0.8, big ? 0.6 : 0.28, big ? 6 : 3);
    if (big) {
      this.ringEff(x, y, T * 0.1, T * 3.4, C.gold, 0.8, 0.8, 5, 0.12);
      this.shake(7, 0.7);
    }
    // Muenzen springen hoch und fallen zurueck
    const coins = big ? 8 : enemy === 'elite' ? 4 : 2;
    this.emitBurst('coin', true, x, y - T * 0.1, coins, C.gold, T * 1.1, 0.75, 7, T * 6, 0.35, true);
  }

  // ---- Bausteine -------------------------------------------------------------------------------------------------

  private addEff(p: Partial<Eff> & { k: K; dur: number; x: number; y: number }, delay = 0): void {
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
    e.el = p.el ?? lookOf('physical');
    e.shape = p.shape ?? '';
    e.seed = this.seedCounter++ * 1.37;
    this.effs.push(e);
  }

  private ringEff(x: number, y: number, r: number, r2: number, color: number, alpha: number, dur: number, w: number, delay = 0): void {
    this.addEff({ k: K.Ring, dur, x, y, r, r2, color, w, spread: alpha }, delay);
  }

  /** Eine Aktion nach `sec` Sekunden Spielzeit des Effekt-Takts (laeuft nur, wenn das Spiel nicht pausiert). */
  private after(sec: number, fn: () => void): void {
    if (this.later.length < 40) this.later.push({ at: this.clock + sec, fn });
  }

  /** Ein Splitter aus dem Pool (Ringpuffer: ist alles belegt, wird der aelteste ueberschrieben). */
  private emit(kind: ParticleKind, add: boolean, x: number, y: number, vx: number, vy: number, life: number, size: number, color: number, grav: number, delay = 0): void {
    this.ensureParts();
    const pool = add ? this.pa : this.pn;
    const i = add ? this.idxA : this.idxN;
    if (add) this.idxA = (this.idxA + 1) % MAX_PARTICLES;
    else this.idxN = (this.idxN + 1) % MAX_PARTICLES;
    const p = pool[i];
    p.alive = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.life = life;
    p.max = life;
    p.size = Math.max(3, size * Math.max(1, this.ctx.art * 0.75));
    p.grav = grav;
    p.delay = delay;
    p.aim = kind === 'spark' || kind === 'ray';
    p.spin = SPIN_KINDS.has(kind) ? (Math.random() - 0.5) * 12 : 0;
    p.shrink = kind === 'ember' || kind === 'wisp';
    const s = p.s;
    s.texture = this.ctx.figures.particle(kind);
    s.tint = color;
    s.rotation = p.aim ? Math.atan2(vy, vx) : Math.random() * 6.28;
    s.visible = delay <= 0;
    s.alpha = 1;
    const sc = p.size / 18;
    s.scale.set(sc);
  }

  /** Streuung von `n` Splittern (durch `detail` bei Last ausgeduennt). */
  private emitBurst(kind: ParticleKind, add: boolean, x: number, y: number, n: number, color: number, speed: number, life: number, size: number, grav: number, spread = 0.5, up = false): void {
    const count = Math.max(1, Math.round(n * this.detail));
    for (let i = 0; i < count; i++) {
      const a = up ? -Math.PI / 2 + (Math.random() - 0.5) * 1.8 : Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.65);
      this.emit(kind, add, x, y, Math.cos(a) * v, Math.sin(a) * v - (up ? speed * 0.4 : speed * spread * 0.3), life * (0.6 + Math.random() * 0.5), size, i % 4 === 0 ? lighten(color, 0.5) : color, grav);
    }
  }

  /** Splitter in Art und Farbe eines Elements. */
  private elBurst(el: ElementLook, x: number, y: number, n: number, speed: number, life: number, size: number): void {
    const kind = el.particle;
    const add = GLOW_KINDS.has(kind) && el.key !== 'dark';
    const count = Math.max(1, Math.round(n * this.detail));
    const T = this.ctx.tile;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.65);
      this.emit(kind, add, x, y, Math.cos(a) * v, Math.sin(a) * v, life * (0.6 + Math.random() * 0.5), size, i % 3 === 0 ? el.light : el.main, el.gravity * T);
    }
  }

  private addPop(label: string, x: number, y: number, color: number, scale: number, life: number, punch = 0): void {
    let text = this.popPool.pop();
    if (!text) {
      text = new Text({ text: label, style: { fontFamily: 'Rajdhani, monospace', fontSize: 22, fontWeight: '700', fill: C.gold, stroke: { color: C.ink, width: 4 } } });
      text.anchor.set(0.5);
      this.textLayer.addChild(text);
    }
    if (text.text !== label) text.text = label;
    text.style.fill = color;
    text.visible = true;
    text.alpha = 1;
    const base = (this.ctx.tile / 48) * scale;
    text.scale.set(base * (1 + punch));
    text.position.set(x, y);
    this.pops.push({ text, vy: -this.ctx.tile * (punch > 0 ? 1.1 : 0.9), life, max: life, age: 0, base, punch });
  }

  private shake(amp: number, dur: number): void {
    if (this.calm || !getSettings().screenShake) return;
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
    let full = 0;
    for (const id of fired) {
      const u = st.units.find((x) => x.id === id);
      const def = u ? this.ctx.defs[u.defId] : undefined;
      const style = def && u ? hitStyle(def, u.level) : null;
      if (!u || !def || !style) continue;
      const range = reachMilli(def, u.level);
      const origin = { x: u.x, y: u.y };
      const target = pickTarget(origin, range, def.canHitAir, u.targeting, pool) ?? pickTarget(origin, range, def.canHitAir, u.targeting, st.enemies);
      if (!target) continue;
      const o = this.ctx.px(u.x / 1000, u.y / 1000);
      const tp = this.ctx.px(target.x / 1000, target.y / 1000);
      const ang = Math.atan2(tp.y - o.y, tp.x - o.x);
      this.entities.unitShot(u.id, ang);
      const el = unitLook(def);
      this.noteShot(target.id, u, def, el, nowMs);
      if (full < MAX_SHOTS_PER_FRAME) {
        full++;
        this.shoot(style, def, u, o.x, o.y, tp.x, tp.y, range, T);
      }
      for (const fn of this.shotListeners) fn(style, el.key);
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
      const info = this.lastShot.get(n.enemyId);
      const fresh = !!info && nowMs - info.t < 700;
      const crit = !n.heal && fresh && info.n === 1 && guessCrit(n.centi, info.base, info.critBp, info.critMultBp);
      const label = n.heal ? `+${formatDamage(n.centi)}` : formatDamage(n.centi) + (crit ? '!' : '');
      const color = n.heal ? 0x7bd868 : crit ? 0xffd34a : inWindow ? C.gold : fresh && info.el.key !== 'physical' ? info.el.light : C.white;
      const scale = crit ? 1.45 : (inWindow ? 1.3 : 1) * (boss ? 1.1 : 0.78);
      this.addPop(label, p.x + (Math.random() - 0.5) * T * 0.35, p.y - T * 0.3, color, scale, crit ? 0.8 : 0.6, crit ? 0.6 : 0);
      if (crit) {
        this.emitBurst('star', true, p.x, p.y - T * 0.2, 7, 0xffd34a, T * 2.2, 0.45, 5, 0, 0.5);
        this.ringEff(p.x, p.y, T * 0.1, T * 0.7, 0xffd34a, 0.9, 0.22, 3);
        this.cue('crit', 0.8);
      }
      // Grosse Treffer auf Bosse: leichtes Ruckeln
      const maxHp = st.enemies.find((e) => e.id === n.enemyId)?.maxHp ?? 0;
      if (boss && maxHp > 0 && n.centi >= maxHp * 0.06) this.shake(2.2, 0.18);
    }
    for (const [id, v] of this.lastShot) if (nowMs - v.t > 2000) this.lastShot.delete(id);
    this.snap = st.enemies.map((e) => ({ id: e.id, x: e.x, y: e.y, flying: e.flying, hp: e.hp, progress: e.progress }));
  }

  /** Merkt, wer zuletzt auf einen Gegner geschossen hat: Grundlage der Krit-Schaetzung bei der Schadenszahl. */
  private noteShot(enemyId: number, u: UnitState, def: UnitDef, el: ElementLook, nowMs: number): void {
    const lv = def.levels[Math.min(u.level, def.levels.length - 1)];
    const base = lv.damageCenti * (u.lvlBp / 10000) * (1 + u.traitBp / 10000);
    const prev = this.lastShot.get(enemyId);
    if (prev && nowMs - prev.t < 500) {
      prev.n++;
      prev.t = nowMs;
      return;
    }
    this.lastShot.set(enemyId, { t: nowMs, n: 1, base, critBp: def.critBp, critMultBp: def.critMultBp, el });
  }

  private shoot(style: HitStyle, def: UnitDef, u: UnitState, ox: number, oy: number, tx: number, ty: number, rangeMilli: number, T: number): void {
    const look = attackLook(style, def);
    const el = look.element;
    const attack = def.levels[Math.min(u.level, def.levels.length - 1)].attack;
    const ang = Math.atan2(ty - oy, tx - ox);
    const dist = Math.hypot(tx - ox, ty - oy);
    const mx = ox + Math.cos(ang) * T * 0.38;
    const my = oy + Math.sin(ang) * T * 0.38;
    this.addEff({ k: K.Glow, dur: 0.1, x: mx, y: my, r: T * 0.2, color: el.main, w: 0.8 });
    switch (style) {
      case 'slash':
        this.addEff({ k: K.Slash, dur: 0.22, x: tx, y: ty, r: T * 0.38, ang, w: Math.max(3, T * 0.07), el, shape: look.shape });
        this.elBurst(el, tx, ty, 4, T * 1.4, 0.3, 4);
        break;
      case 'blast':
      case 'shell': {
        const R = ((attack?.radiusMilli ?? 1200) / 1000) * T;
        if (rangeMilli <= 2000) {
          // Nahkampf-Welle: kein Flug, die Druckwelle kommt gleich am Ziel
          this.addEff({ k: K.Wave, dur: 0.34, x: tx, y: ty, r2: R, w: Math.max(2.5, T * 0.06), el, shape: look.shape });
          this.elBurst(el, tx, ty, R > T * 1.5 ? 14 : 8, T * 2.2, 0.5, 5);
        } else {
          const d = this.projDur('orb', dist, T);
          this.addEff({ k: K.Proj, dur: d, x: mx, y: my, x2: tx, y2: ty, r: T * 0.14, w: T * 0.08, el, shape: 'orb', after: After.Blast, r2: R });
        }
        break;
      }
      case 'cone': {
        const half = ((attack?.coneDeg ?? 60) * Math.PI) / 360;
        this.addEff({ k: K.Fan, dur: 0.34, x: ox, y: oy, r: (rangeMilli / 1000) * T, ang, spread: half, el, shape: look.shape });
        this.elBurst(el, ox + Math.cos(ang) * T * 0.6, oy + Math.sin(ang) * T * 0.6, 6, T * 2.2, 0.4, 4);
        break;
      }
      case 'full': {
        // Alles in Reichweite: eine Welle aus der Unit bis zum Rand der Reichweite
        const R = (rangeMilli / 1000) * T;
        this.addEff({ k: K.Wave, dur: 0.46, x: ox, y: oy, r2: R, w: Math.max(3, T * 0.08), spread: 0.4, el, shape: look.shape });
        this.elBurst(el, tx, ty, 6, T * 1.6, 0.35, 4);
        break;
      }
      case 'line':
        this.addEff({ k: K.Beam, dur: 0.24, x: ox, y: oy, r: (rangeMilli / 1000) * T, w: ((attack?.widthMilli ?? 600) / 1000) * T, ang, el, shape: look.shape });
        this.elBurst(el, tx, ty, 4, T * 1.3, 0.3, 4);
        break;
      default: {
        // Einzelziel aus der Ferne: Geschoss in Form des Elements
        const d = this.projDur(look.shape, dist, T);
        this.addEff({ k: K.Proj, dur: d, x: mx, y: my, x2: tx, y2: ty, r: T * (look.shape === 'bullet' ? 0.06 : 0.1), w: T * (look.shape === 'bolt' ? 0.05 : 0.04), el, shape: look.shape, after: After.Impact });
      }
    }
  }

  private projDur(shape: string, dist: number, T: number): number {
    const [lo, hi] = PROJ_RANGE[shape] ?? [0.08, 0.2];
    return Math.min(hi, Math.max(lo, dist / (T * (PROJ_SPEED[shape] ?? 20))));
  }

  private landed(e: Eff): void {
    const T = this.ctx.tile;
    if (e.after === After.Impact) {
      this.ringEff(e.x2, e.y2, T * 0.06, T * 0.3, e.el.light, 0.9, 0.16, 2);
      this.elBurst(e.el, e.x2, e.y2, 5, T * 1.5, 0.3, 4);
    } else if (e.after === After.Blast) {
      const R = e.r2 || T * 1.2;
      this.addEff({ k: K.Wave, dur: 0.36, x: e.x2, y: e.y2, r2: R, w: Math.max(2.5, T * 0.06), el: e.el, shape: 'wave' });
      this.elBurst(e.el, e.x2, e.y2, R > T * 1.5 ? 16 : 9, T * 2.2, 0.5, 5);
      if (R > T * 1.5) this.shake(2.2, 0.2);
    }
  }

  // ---- Frame -------------------------------------------------------------------------------------------------------

  update(dtMs: number): void {
    const dt = Math.min(0.1, dtMs / 1000);
    const nowMs = performance.now();
    const paused = !this.session || this.session.paused;
    if (!paused) {
      this.clock += dt;
      this.scanState(nowMs);
      if (this.later.length > 0) {
        const due = this.later.filter((l) => l.at <= this.clock);
        if (due.length > 0) {
          this.later = this.later.filter((l) => l.at > this.clock);
          for (const l of due) l.fn();
        }
      }
    }

    // Boss-Auftritt, sobald die Figur eine Ansicht hat
    for (const id of this.pendingEntrance) {
      const p = this.entities.enemyView(id);
      if (!p) continue;
      this.pendingEntrance.delete(id);
      const T = this.ctx.tile;
      this.ringEff(p.x, p.y, T * 0.4, T * 4.2, C.red, 0.9, 0.9, 7);
      this.ringEff(p.x, p.y, T * 0.3, T * 3, C.gold, 0.8, 0.7, 5, 0.12);
      this.ringEff(p.x, p.y, T * 0.2, T * 2, C.rim, 0.8, 0.55, 4, 0.24);
      this.addEff({ k: K.Glow, dur: 0.6, x: p.x, y: p.y, r: T * 2.2, color: C.rim, w: 0.3 });
      this.emitBurst('ember', true, p.x, p.y, 28, C.rim, T * 4, 0.9, 6, -T * 0.8, 0.6);
      this.shake(7, 0.7);
      this.blink = { age: 0, seconds: 0.9, strength: 0.5 };
    }

    this.updateShapes(dt);
    this.updateParts(dt);
    this.updatePops(dt);
    this.updateFlash(dt);
    this.applyShake(dt);
  }

  private updateShapes(dt: number): void {
    const g = this.g;
    const effs = this.effs;
    for (let i = effs.length - 1; i >= 0; i--) {
      const e = effs[i];
      e.t += dt;
      if (e.t >= e.dur) {
        effs[i] = effs[effs.length - 1];
        effs.pop();
        if (e.k === K.Proj) this.landed(e);
        this.effFree.push(e);
      }
    }
    if (this.effs.length === 0) {
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
      const p = Math.min(1, e.t / e.dur);
      const inv = 1 - p;
      switch (e.k) {
        case K.Proj:
          drawProjectile(g, e, p);
          break;
        case K.Slash:
          drawSlash(g, e, p);
          break;
        case K.Wave:
          drawWave(g, e, p);
          break;
        case K.Fan:
          drawFan(g, e, p);
          break;
        case K.Beam:
          drawBeam(g, e, p);
          break;
        case K.Tracer:
          g.moveTo(e.x, e.y).lineTo(e.x2, e.y2).stroke({ width: e.w * (1 + inv), color: e.color, alpha: 0.7 * inv, cap: 'round' });
          break;
        case K.Ring: {
          const r = e.r + (e.r2 - e.r) * easeOut(p);
          g.circle(e.x, e.y, Math.max(1, r)).stroke({ width: Math.max(1, e.w * inv), color: e.color, alpha: inv * e.spread });
          break;
        }
        case K.Glow:
          g.circle(e.x, e.y, e.r * (0.7 + 0.5 * p)).fill({ color: e.color, alpha: inv * e.w });
          break;
        default:
          break;
      }
    }
  }

  private updateParts(dt: number): void {
    if (this.pn.length === 0) return;
    let live = 0;
    for (let pass = 0; pass < 2; pass++) {
      const pool = pass === 0 ? this.pn : this.pa;
      for (const q of pool) {
        if (!q.alive) continue;
        live++;
        if (q.delay > 0) {
          q.delay -= dt;
          if (q.delay <= 0) q.s.visible = true;
          continue;
        }
        q.life -= dt;
        if (q.life <= 0) {
          this.kill(q);
          continue;
        }
        q.vy += q.grav * dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.vx *= 1 - Math.min(1, 2.2 * dt);
        const s = q.s;
        s.position.set(q.x, q.y);
        const f = q.life / q.max;
        s.alpha = Math.min(1, f * 1.8);
        if (q.shrink) s.scale.set((q.size / 18) * (0.4 + 0.6 * f));
        if (q.aim) s.rotation = Math.atan2(q.vy, q.vx);
        else if (q.spin !== 0) s.rotation += q.spin * dt;
      }
    }
    this.lastDetail = detailFactor(this.effs.length, MAX_EFFECTS, live, MAX_PARTICLES * 2);
  }

  private updatePops(dt: number): void {
    for (const p of this.pops) {
      p.life -= dt;
      p.age += dt;
      p.text.y += p.vy * dt;
      p.vy *= 1 - Math.min(1, 2.5 * dt);
      p.text.alpha = Math.max(0, Math.min(1, p.life / (p.max * 0.45)));
      if (p.punch > 0) p.text.scale.set(p.base * (1 + p.punch * Math.max(0, 1 - p.age / 0.18)));
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
      const W = this.ctx.cols * this.ctx.tile;
      const H = this.ctx.rows * this.ctx.tile;
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
