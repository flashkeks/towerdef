/**
 * Schwebende Teilchen ueber der Karte (Runde 10 / P4): wenige billige Sprites (Schnee, Glut, Sporen, Irrlichter, Staub, Leuchtstaub),
 * Art und Farbe kommen aus `theme.board.light`. Nur Darstellung, kein Spielwissen; die Sim sieht nichts davon.
 * Bewegung in Kacheln je Sekunde, damit sie mit der Fenstergroesse mitwaechst. Hoechstens `MAX` Sprites.
 */
import { Container, Sprite, Texture } from 'pixi.js';

type Kind = 'none' | 'motes' | 'snow' | 'embers' | 'spores' | 'wisps' | 'dust';

interface Part {
  s: Sprite;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ph: number;
  size: number;
  base: number;
}

interface Recipe {
  n: number;
  size: [number, number];
  vx: [number, number];
  vy: [number, number];
  alpha: [number, number];
  add: boolean;
  /** Schwingen in x (Kacheln). */
  sway: number;
  /** Funkeln (Alpha schwankt). */
  twinkle: number;
  white?: boolean;
}

const RECIPES: Record<Exclude<Kind, 'none'>, Recipe> = {
  motes: { n: 22, size: [0.08, 0.16], vx: [-0.04, 0.04], vy: [-0.05, 0.03], alpha: [0.25, 0.7], add: true, sway: 0.05, twinkle: 0.6 },
  snow: { n: 42, size: [0.05, 0.1], vx: [-0.05, 0.05], vy: [0.28, 0.5], alpha: [0.5, 0.9], add: false, sway: 0.25, twinkle: 0, white: true },
  embers: { n: 24, size: [0.06, 0.13], vx: [-0.04, 0.06], vy: [-0.5, -0.2], alpha: [0.4, 0.9], add: true, sway: 0.12, twinkle: 0.4 },
  spores: { n: 24, size: [0.08, 0.17], vx: [-0.03, 0.03], vy: [-0.1, -0.02], alpha: [0.2, 0.5], add: true, sway: 0.12, twinkle: 0.3 },
  wisps: { n: 12, size: [0.5, 1.0], vx: [-0.06, 0.06], vy: [-0.05, 0.03], alpha: [0.08, 0.2], add: true, sway: 0.2, twinkle: 0.5 },
  dust: { n: 20, size: [0.2, 0.4], vx: [0.18, 0.4], vy: [-0.02, 0.04], alpha: [0.06, 0.16], add: false, sway: 0.05, twinkle: 0 },
};

let glowTex: Texture | null = null;
function glow(): Texture {
  if (glowTex) return glowTex;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const c = cv.getContext('2d');
  if (c) {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  }
  glowTex = Texture.from(cv);
  return glowTex;
}

const rnd = (a: number, b: number): number => a + Math.random() * (b - a);

export class Ambient {
  readonly container = new Container();
  private parts: Part[] = [];
  private recipe: Recipe | null = null;
  private cols = 0;
  private rows = 0;
  private tile = 0;
  private t = 0;
  private sig = '';

  /** Neu aufbauen, wenn sich Art, Farbe oder Kartengroesse aendern; sonst nur die Kachelgroesse nachfuehren. */
  configure(kind: Kind, color: string, cols: number, rows: number, tile: number): void {
    this.tile = tile;
    const sig = `${kind}|${color}|${cols}x${rows}`;
    if (sig === this.sig) return;
    this.sig = sig;
    this.cols = cols;
    this.rows = rows;
    for (const p of this.parts) p.s.destroy();
    this.parts = [];
    this.container.removeChildren();
    if (kind === 'none') {
      this.recipe = null;
      return;
    }
    const rc = RECIPES[kind];
    this.recipe = rc;
    const n = Math.max(6, Math.round((rc.n * (cols * rows)) / 200));
    const tint = rc.white ? 0xffffff : parseInt(color.slice(1), 16);
    for (let i = 0; i < n; i++) {
      const s = new Sprite(glow());
      s.anchor.set(0.5);
      s.tint = tint;
      s.blendMode = rc.add ? 'add' : 'normal';
      this.container.addChild(s);
      const base = rnd(rc.alpha[0], rc.alpha[1]);
      this.parts.push({ s, x: rnd(0, cols), y: rnd(0, rows), vx: rnd(rc.vx[0], rc.vx[1]), vy: rnd(rc.vy[0], rc.vy[1]), ph: rnd(0, 6.28), size: rnd(rc.size[0], rc.size[1]), base });
    }
    this.place();
  }

  private place(): void {
    const rc = this.recipe;
    if (!rc) return;
    const T = this.tile;
    for (const p of this.parts) {
      p.s.position.set((p.x + Math.sin(this.t * 0.9 + p.ph) * rc.sway) * T, p.y * T);
      p.s.scale.set((p.size * T) / 64 * 2);
      p.s.alpha = rc.twinkle > 0 ? p.base * (1 - rc.twinkle * (0.5 + 0.5 * Math.sin(this.t * 2.2 + p.ph))) : p.base;
    }
  }

  update(dtMs: number): void {
    if (!this.recipe) return;
    const dt = Math.min(dtMs, 100) / 1000;
    this.t += dt;
    for (const p of this.parts) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < -0.5) p.x += this.cols + 1;
      else if (p.x > this.cols + 0.5) p.x -= this.cols + 1;
      if (p.y < -0.5) p.y += this.rows + 1;
      else if (p.y > this.rows + 0.5) p.y -= this.rows + 1;
    }
    this.place();
  }
}
