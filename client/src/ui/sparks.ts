/**
 * Partikel fuer Beschwoeren und Menue-Effekte (Runde 10, P3): Canvas 2D, additiv, gedeckelt (hoechstens `MAX` Teilchen), laeuft nur, solange
 * etwas fliegt. Koordinaten in Bildschirm-Pixeln (das Canvas liegt `position: fixed; inset: 0` bzw. deckt sein Elternelement ab).
 * - `burst`: Ausbruch von einem Punkt (Standard: Mitte, etwas ueber der Bildmitte)
 * - `converge`: Licht sammelt sich von aussen zur Mitte (Aufbau des Portals)
 * - `glitter`: funkelnde Sterne um einen Punkt (Shiny, Level-Up)
 */
const MAX = 900;

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  max: number;
  hue: number;
  rainbow: boolean;
  /** 0 = Funke, 1 = Stern (Glitzer), 2 = Sog (zur Mitte, ohne Schwerkraft) */
  kind: 0 | 1 | 2;
}

const reduced = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Sparks {
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly parts: P[] = [];
  private running = false;
  private w = 0;
  private h = 0;
  private ox = 0;
  private oy = 0;
  private dpr = 1;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
  }

  private resize(): void {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(1.5, window.devicePixelRatio || 1);
    this.ox = r.left;
    this.oy = r.top;
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.max(2, Math.round(r.width * this.dpr));
    this.canvas.height = Math.max(2, Math.round(r.height * this.dpr));
  }

  private center(): { x: number; y: number } {
    return { x: this.ox + this.w / 2, y: this.oy + this.h * 0.44 };
  }

  private push(p: P): void {
    if (this.parts.length >= MAX) this.parts.shift();
    this.parts.push(p);
  }

  private hueOf(hue: number | 'rainbow'): number {
    return hue === 'rainbow' ? Math.random() * 360 : hue;
  }

  burst(hue: number | 'rainbow', count: number, speed = 5, at?: { x: number; y: number }): void {
    if (reduced()) return;
    this.resize();
    const c = at ?? this.center();
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (0.25 + Math.random()) * speed;
      this.push({ x: c.x - this.ox, y: c.y - this.oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.8, r: 0.8 + Math.random() * 2.6, life: 0, max: 40 + Math.random() * 60, hue: this.hueOf(hue), rainbow: hue === 'rainbow', kind: 0 });
    }
    this.run();
  }

  converge(hue: number | 'rainbow', count: number): void {
    if (reduced()) return;
    this.resize();
    const c = this.center();
    const cx = c.x - this.ox;
    const cy = c.y - this.oy;
    const rad = Math.max(this.w, this.h) * 0.45;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = rad * (0.55 + Math.random() * 0.5);
      const life = 40 + Math.random() * 30;
      const x = cx + Math.cos(a) * d;
      const y = cy + Math.sin(a) * d;
      this.push({ x, y, vx: (cx - x) / life, vy: (cy - y) / life, r: 0.8 + Math.random() * 2, life: 0, max: life, hue: this.hueOf(hue), rainbow: hue === 'rainbow', kind: 2 });
    }
    this.run();
  }

  glitter(at?: { x: number; y: number }, spread = 140, count = 26): void {
    if (reduced()) return;
    this.resize();
    const c = at ?? this.center();
    for (let i = 0; i < count; i++) {
      this.push({ x: c.x - this.ox + (Math.random() - 0.5) * spread * 2, y: c.y - this.oy + (Math.random() - 0.5) * spread * 2.4, vx: 0, vy: -0.2 - Math.random() * 0.3, r: 2 + Math.random() * 3.5, life: -Math.random() * 30, max: 40 + Math.random() * 40, hue: 40 + Math.random() * 30, rainbow: true, kind: 1 });
    }
    this.run();
  }

  private run(): void {
    if (this.running || !this.ctx) return;
    this.running = true;
    requestAnimationFrame(this.frame);
  }

  private readonly frame = (): void => {
    const ctx = this.ctx;
    if (!ctx || !this.canvas.isConnected) {
      this.running = false;
      this.parts.length = 0;
      return;
    }
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i]!;
      p.life++;
      if (p.life < 0) continue;
      const k = p.life / p.max;
      if (k >= 1) {
        this.parts.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      if (p.kind === 0) {
        p.vy += 0.05;
        p.vx *= 0.985;
      }
      const hue = p.rainbow ? (p.hue + p.life * 4) % 360 : p.hue;
      if (p.kind === 1) {
        const a = Math.sin(k * Math.PI);
        const s = p.r * (0.6 + a);
        ctx.strokeStyle = `hsla(${hue},100%,85%,${a})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(p.x - s * 2, p.y);
        ctx.lineTo(p.x + s * 2, p.y);
        ctx.moveTo(p.x, p.y - s * 2);
        ctx.lineTo(p.x, p.y + s * 2);
        ctx.stroke();
        ctx.fillStyle = `hsla(${hue},100%,92%,${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, s * 0.45, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      const a = p.kind === 2 ? Math.min(1, k * 3) * 0.9 : (1 - k) * 0.95;
      const rr = p.r * 3.2;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr);
      g.addColorStop(0, `hsla(${hue},100%,78%,${a})`);
      g.addColorStop(1, `hsla(${hue},100%,55%,0)`);
      ctx.fillStyle = g;
      ctx.fillRect(p.x - rr, p.y - rr, rr * 2, rr * 2);
    }
    if (this.parts.length > 0) requestAnimationFrame(this.frame);
    else {
      this.running = false;
      ctx.clearRect(0, 0, this.w, this.h);
    }
  };
}
