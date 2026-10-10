/**
 * Effekte aus Sim-Events (Runde 11 / P3): P2-Effektsprites (Explosion, Platzen, Nova, Status, Puffs, Faehigkeiten) plus
 * kleine Partikel und schwebende Zahlen. Alles in ganzen Pixeln der 640 x 360-Karte; reine Anzeige, liest nie in die Sim hinein.
 */
import { Container, Sprite, Texture } from 'pixi.js';
import { C, NAME_OF, rng } from '../pixel/map/buf';
import { PAL, type PalName } from '../pixel/palette';
import type { EnemyType } from '../sim';
import { fx as P2, ringSprite, pixelText, EXPLOSION_FRAMES, POP_FRAMES, NOVA_FRAMES, PUFF_FRAMES, FLARE_FRAMES, ZERO_FRAMES, BEAM_FRAMES, PLATE_FRAMES, STATUS_FRAMES, COIN_RISE_FRAMES, GRANT_FRAMES, DROP_FRAMES, FOCUS_FRAMES, WIND_FRAMES, WALL_GROW_FRAMES, SPLASH_FRAMES, MARK_ACID_FRAMES, BUFF_FRAMES, DEATH_BLAST_FRAMES, TRANSFORM_FRAMES, SHRINK_FRAMES, GOLD_BURST_FRAMES, REGROW_FRAMES, FROST_BREATH_FRAMES, STOMP_FRAMES, GLOOM_CRASH_FRAMES, SHIP_CRASH_FRAMES, BOSS_DEATH_FRAMES, type Spr } from './sprites';
import { tex } from './textures';

export interface Fx { age: number; life: number; node: Container; update(dt: number): void }

const hex = (c: number): number => parseInt(PAL[NAME_OF(c)].slice(1), 16);
const R = rng(1234);
const PER = 3; // Ticks je Effekt-Bild (20 fps)

export class FxLayer {
  readonly node = new Container();
  private list: Fx[] = [];
  /** Wackeln (Leck, Boss): Ticks und Staerke, liest der Renderer */
  shake = { t: 0, amp: 0 };
  constructor(private readonly flashNode: Sprite) {}

  add(fx: Fx): Fx {
    this.list.push(fx);
    this.node.addChild(fx.node);
    return fx;
  }

  update(dt: number): void {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const f = this.list[i];
      f.age += dt;
      f.update(dt);
      if (f.age >= f.life) {
        f.node.destroy({ children: true });
        this.list.splice(i, 1);
      }
    }
    if (this.shake.t > 0) this.shake.t -= dt;
    this.flashNode.alpha = Math.max(0, this.flashNode.alpha - dt * 0.05);
  }

  clear(): void {
    for (const f of this.list) f.node.destroy({ children: true });
    this.list = [];
  }

  flash(col: number, a = 0.5): void {
    this.flashNode.tint = hex(col);
    this.flashNode.alpha = a;
  }

  /** Sprite-Animation: frames Bilder, je PER Ticks, an Weltposition; `get` liefert das Bild. */
  anim(x: number, y: number, frames: number, get: (f: number) => Spr, opts: { per?: number; loop?: number; follow?: () => { x: number; y: number } | null; alpha?: number } = {}): Fx {
    const per = opts.per ?? PER, loops = opts.loop ?? 1;
    const node = new Container();
    const s = new Sprite();
    node.addChild(s);
    const fx: Fx = {
      age: 0, life: frames * per * loops, node,
      update: () => {
        const f = Math.floor(fx.age / per) % frames;
        const sp = get(f);
        let px = x, py = y;
        if (opts.follow) { const p = opts.follow(); if (!p) { fx.age = fx.life; return; } px = p.x; py = p.y; }
        s.texture = tex(sp.canvas);
        s.position.set(Math.round(px) - sp.ax, Math.round(py) - sp.ay);
        if (opts.alpha !== undefined) s.alpha = opts.alpha;
      },
    };
    fx.update(0);
    return this.add(fx);
  }

  /** Funken/Scherben: n kleine Quadrate in den angegebenen Farben, mit Schwerkraft. */
  burst(x: number, y: number, cols: number[], n: number, speed = 1.4, size = 2, gravity = 0.06, life = 22): void {
    const node = new Container();
    const parts = Array.from({ length: n }, (_, i) => {
      const s = new Sprite(Texture.WHITE);
      s.width = s.height = size;
      s.tint = hex(cols[i % cols.length]);
      const a = R() * Math.PI * 2, v = speed * (0.4 + R() * 0.8);
      node.addChild(s);
      return { s, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.6 };
    });
    this.add({
      age: 0, life, node,
      update: function (dt) {
        for (const p of parts) {
          p.vy += gravity * dt;
          p.x += p.vx * dt; p.y += p.vy * dt;
          p.s.position.set(Math.round(p.x), Math.round(p.y));
          if (this.age > life * 0.7) p.s.alpha = 1 - (this.age - life * 0.7) / (life * 0.3);
        }
      },
    });
  }

  explosion(x: number, y: number, radius: number, kind: 'bomb' | 'mini' | 'star' | 'quake'): void {
    this.anim(x, y, EXPLOSION_FRAMES, (f) => P2.explosion(kind, f, Math.max(6, Math.round(radius))));
    if (kind === 'bomb' || kind === 'star') this.burst(x, y, [C.amber, C.orange, C.stone], 6, 1.8, 2, 0.05, 18);
  }

  pop(x: number, y: number, etype: EnemyType): void {
    this.anim(x, y, POP_FRAMES, (f) => P2.popShards(etype, f));
  }

  nova(x: number, y: number, radius: number): void {
    this.anim(x, y, NOVA_FRAMES, (f) => P2.nova(f, Math.max(8, Math.round(radius))), { per: 4 });
  }

  /** Dust/Funken beim Kauf (path null) bzw. Upgrade (Pfadfarbe) */
  puff(x: number, y: number, path: number | null): void {
    this.anim(x, y, PUFF_FRAMES, (f) => P2.puff(f, path), { per: 2 });
  }

  ring(x: number, y: number, r0: number, r1: number, col: number, life = 14): void {
    const node = new Container();
    const s = new Sprite();
    node.addChild(s);
    const fx: Fx = {
      age: 0, life, node,
      update: () => {
        const t = fx.age / life;
        const r = Math.round(r0 + (r1 - r0) * (1 - (1 - t) * (1 - t)));
        const sp = ringSprite(r, col, t > 0.6);
        s.texture = tex(sp.canvas);
        s.position.set(Math.round(x) - sp.ax, Math.round(y) - sp.ay);
        s.alpha = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
      },
    };
    fx.update(0);
    this.add(fx);
  }

  /** Blitzkette: Pixel-Linie durch die Punkte (Weltkoordinaten), zwei wechselnde Bilder. */
  bolt(points: [number, number][]): void {
    if (points.length < 2) return;
    const frames = [P2.boltLine(points, 0), P2.boltLine(points, 1)];
    const node = new Container();
    const s = new Sprite(tex(frames[0].canvas));
    node.addChild(s);
    this.add({
      age: 0, life: 9, node,
      update: function () {
        const sp = frames[Math.floor(this.age / 2) % 2];
        s.texture = tex(sp.canvas);
        s.position.set(-sp.ax, -sp.ay);
        s.alpha = this.age > 6 ? 0.5 : 1;
      },
    });
  }

  /** Schwebender Text (Pixelschrift von P2), steigt auf und blendet aus. */
  float(x: number, y: number, text: string, col: number, life = 40, rise = 0.35): void {
    const t = pixelText(text, NAME_OF(col) as PalName);
    const s = new Sprite(tex(t.canvas));
    const node = new Container();
    node.addChild(s);
    this.add({
      age: 0, life, node,
      update: function () {
        s.position.set(Math.round(x) - t.ax, Math.round(y - this.age * rise) - t.ay);
        if (this.age > life * 0.6) s.alpha = 1 - (this.age - life * 0.6) / (life * 0.4);
      },
    });
  }

  /** Freies Gebilde mit eigener Updatefunktion */
  custom(life: number, init: (node: Container) => (age: number) => void): void {
    const node = new Container();
    const upd = init(node);
    this.add({ age: 0, life, node, update: function () { upd(this.age); } });
  }
}

export const FRAMES = { FLARE_FRAMES, ZERO_FRAMES, BEAM_FRAMES, PLATE_FRAMES, STATUS_FRAMES, COIN_RISE_FRAMES, GRANT_FRAMES, DROP_FRAMES, FOCUS_FRAMES, WIND_FRAMES, WALL_GROW_FRAMES, SPLASH_FRAMES, MARK_ACID_FRAMES, BUFF_FRAMES, DEATH_BLAST_FRAMES, TRANSFORM_FRAMES, SHRINK_FRAMES, GOLD_BURST_FRAMES, REGROW_FRAMES, FROST_BREATH_FRAMES, STOMP_FRAMES, GLOOM_CRASH_FRAMES, SHIP_CRASH_FRAMES, BOSS_DEATH_FRAMES, PER };
