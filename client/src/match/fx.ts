/**
 * Effekte aus Sim-Events (Runde 11 / P3): Partikel, Explosionen, Ringe, Blitzlinien, schwebende Zahlen.
 * Alles in ganzen Pixeln der 640 x 360-Karte. Effekte sind reine Anzeige und lesen nie in den Sim-Zustand hinein.
 */
import { Container, Sprite, Texture } from 'pixi.js';
import { Buf, C, NAME_OF, rng } from '../pixel/map/buf';
import { PAL } from '../pixel/palette';
import { explosionSprite, ringSprite } from './sprites';
import { pixText } from './pixfont';
import { tex } from './textures';

export interface Fx { age: number; life: number; node: Container; update(dt: number): void }

const hex = (c: number): number => parseInt(PAL[NAME_OF(c)].slice(1), 16);
const R = rng(1234);

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

  explosion(x: number, y: number, radius: number, kind: string): void {
    const node = new Container();
    const s = new Sprite();
    s.anchor.set(0, 0);
    node.addChild(s);
    const frames = 5, per = 3;
    const fx: Fx = {
      age: 0, life: frames * per, node,
      update: (dt) => {
        void dt;
        const f = Math.min(frames - 1, Math.floor(fx.age / per));
        const sp = explosionSprite(f, radius * (kind === 'mini' ? 1 : 1));
        s.texture = tex(sp.canvas);
        s.position.set(Math.round(x) - sp.ax, Math.round(y) - sp.ay);
      },
    };
    fx.update(0);
    this.add(fx);
    if (kind !== 'mini') this.burst(x, y, [C.amber, C.orange, C.stone], 8, 1.8, 2, 0.05, 18);
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

  /** Blitzlinie ueber mehrere Punkte (Pixel-Linien mit Zickzack), kurz sichtbar. */
  bolt(points: [number, number][], col = C.yellow): void {
    if (points.length < 2) return;
    const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
    const x0 = Math.floor(Math.min(...xs)) - 4, y0 = Math.floor(Math.min(...ys)) - 4;
    const w = Math.ceil(Math.max(...xs)) - x0 + 5, h = Math.ceil(Math.max(...ys)) - y0 + 5;
    const make = (): Buf => {
      const b = new Buf(Math.max(1, w), Math.max(1, h));
      for (let i = 1; i < points.length; i++) {
        const [ax, ay] = points[i - 1], [bx, by] = points[i];
        const segs = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay) / 6));
        let px = ax, py = ay;
        for (let k = 1; k <= segs; k++) {
          const t = k / segs;
          const nx = ax + (bx - ax) * t + (k < segs ? (R() - 0.5) * 6 : 0), ny = ay + (by - ay) * t + (k < segs ? (R() - 0.5) * 6 : 0);
          b.line(px - x0, py - y0, nx - x0, ny - y0, C.white);
          b.set(px - x0 + 1, py - y0, col); b.set(px - x0 - 1, py - y0, col);
          px = nx; py = ny;
        }
      }
      return b;
    };
    const frames = [make().toCanvas(), make().toCanvas()];
    const node = new Container();
    const s = new Sprite(tex(frames[0]));
    s.position.set(x0, y0);
    node.addChild(s);
    this.add({ age: 0, life: 9, node, update: function () { s.texture = tex(frames[Math.floor(this.age / 2) % 2]); s.alpha = this.age > 6 ? 0.5 : 1; } });
  }

  /** Schwebender Text (Pixelschrift), steigt auf und blendet aus. */
  float(x: number, y: number, text: string, col: number, life = 40, rise = 0.35): void {
    const t = pixText(text, col);
    const s = new Sprite(tex(t.canvas));
    const node = new Container();
    node.addChild(s);
    const px = Math.round(x - t.w / 2);
    this.add({
      age: 0, life, node,
      update: function () {
        s.position.set(px, Math.round(y - this.age * rise));
        if (this.age > life * 0.6) s.alpha = 1 - (this.age - life * 0.6) / (life * 0.4);
      },
    });
  }

  /** Beliebiger Sprite fuer eine feste Zeit (z. B. Staubwolke) mit eigener Updatefunktion */
  custom(life: number, init: (node: Container) => (age: number) => void): void {
    const node = new Container();
    const upd = init(node);
    this.add({ age: 0, life, node, update: function () { upd(this.age); } });
  }
}
