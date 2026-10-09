/**
 * Renderer (Pixi v8, Runde 11 / P3): Spielfeld als 640 x 360-Textur, scharf hochskaliert (CSS image-rendering: pixelated).
 * Ebenen: Karte (Boden, Wasser, Deko) -> Schatten -> Welt (Props, Tuerme, Gegner nach y sortiert) -> Projektile -> Effekte
 * -> Licht -> Oberflaeche (Geist, Reichweite). Animationen kommen aus Sim-Events, Positionen aus dem Zustand (zwischen zwei
 * Ticks interpoliert). Der Renderer schreibt nie in die Sim.
 */
import { Application, Container, Sprite, Texture } from 'pixi.js';
import { Buf, C, NAME_OF, bayer, rng } from '../pixel/map/buf';
import { meadowArt } from '../pixel/map/compose';
import { flagFrame, MILL_STEPS, WATER_FRAMES, windmillBlades } from '../pixel/map/paint';
import { PAL } from '../pixel/palette';
import { type EnemyState, type EnemyType, type GameState, type ProjectileState, type SimEvent, type TowerState } from '../sim';
import { FxLayer } from './fx';
import { footMilli } from './info';
import { enemySprite, explosionSprite, heroSprite, projectileSprite, ringSprite, towerSprite, type Spr } from './sprites';
import { tex } from './textures';
import { PATH } from '../pixel/map/layout';

export const VIEW_W = 640;
export const VIEW_H = 360;
const hex = (c: number): number => parseInt(PAL[NAME_OF(c)].slice(1), 16);
const R = rng(77);

const SHARD_COL: Record<EnemyType, number[]> = {
  red: [C.red, C.crimson, C.coral], blue: [C.sky, C.navy, C.ice], green: [C.leaf, C.grass, C.yellow], gold: [C.amber, C.yellow, C.orange],
  ironshell: [C.stone, C.silver, C.slate], ember: [C.orange, C.yellow, C.red], brute: [C.slate, C.dusk, C.stone], leviathan: [C.navy, C.stone, C.sky],
};

interface TowerView { spr: Sprite; shadow: Sprite; key: string; drop: number; up: number }
interface EnemyView { spr: Sprite; shadow: Sprite; key: string; px: number; py: number; cx: number; cy: number; flash: number; bar?: Sprite; barBg?: Sprite }
interface ProjView { spr: Sprite; shadow?: Sprite; key: string; px: number; py: number; cx: number; cy: number }

function shadowCanvas(rx: number, ry: number): HTMLCanvasElement {
  const b = new Buf(rx * 2 + 3, ry * 2 + 3);
  b.ellipse(rx + 1, ry + 1, rx, ry, C.ink);
  return b.toCanvas();
}
const shadows = new Map<string, HTMLCanvasElement>();
const shadowTex = (rx: number, ry: number): Texture => {
  const k = `${rx}x${ry}`;
  let c = shadows.get(k);
  if (!c) { c = shadowCanvas(rx, ry); shadows.set(k, c); }
  return tex(c);
};

function glowCanvas(r: number, col: number): HTMLCanvasElement {
  const b = new Buf(r * 2 + 1, r * 2 + 1);
  for (let y = 0; y <= r * 2; y++) for (let x = 0; x <= r * 2; x++) {
    const d = Math.hypot(x - r, y - r) / r;
    if (d < 1 && bayer(x, y) < Math.pow(1 - d, 1.4) * 0.95) b.set(x, y, col);
  }
  return b.toCanvas();
}

export class Renderer {
  app!: Application;
  fx!: FxLayer;
  private mapC = new Container();
  private shadowC = new Container();
  private worldC = new Container();
  private projC = new Container();
  private fxHost = new Container();
  private lightC = new Container();
  private uiC = new Container();
  private waterSpr = new Sprite();
  private towers = new Map<number, TowerView>();
  private enemies = new Map<number, EnemyView>();
  private projs = new Map<number, ProjView>();
  private lastTick = -1;
  private flashSpr!: Sprite;
  private mill!: Sprite;
  private flagSprs: Sprite[] = [];
  private lampGlows: { s: Sprite; base: number; ph: number }[] = [];
  private flies: { s: Sprite; g: Sprite; x: number; y: number; ph: number; sp: number; ax: number; ay: number }[] = [];
  private smokes: { parts: Sprite[]; x: number; y: number }[] = [];
  private beams: Sprite | null = null;
  private selRing = new Sprite();
  private rangeDisc = new Sprite();
  private rangeRing = new Sprite();
  private ghost = new Sprite();
  private ghostShadow = new Sprite();
  private ghostOk = true;
  private selectedId: number | null = null;
  private latest: GameState | null = null;
  /** Anzeige-Zeit in Millisekunden (nur fuer Idle-Animationen) */
  private now = 0;
  private canvasEl!: HTMLCanvasElement;
  private shakeOff = { x: 0, y: 0 };
  scale = 1;

  async init(host: HTMLElement): Promise<void> {
    this.app = new Application();
    await this.app.init({ width: VIEW_W, height: VIEW_H, antialias: false, resolution: 1, backgroundColor: hex(C.ink), autoStart: false, roundPixels: true, preference: 'webgl' });
    this.canvasEl = this.app.canvas;
    this.canvasEl.className = 'm-canvas';
    host.prepend(this.canvasEl);
    const st = this.app.stage;
    st.addChild(this.mapC, this.shadowC, this.worldC, this.projC, this.fxHost, this.lightC, this.uiC);
    this.worldC.sortableChildren = true;
    this.buildMap();
    this.flashSpr = new Sprite(Texture.WHITE);
    this.flashSpr.width = VIEW_W; this.flashSpr.height = VIEW_H; this.flashSpr.alpha = 0;
    this.fx = new FxLayer(this.flashSpr);
    this.fxHost.addChild(this.fx.node, this.flashSpr);
    for (const s of [this.selRing, this.rangeDisc, this.rangeRing, this.ghostShadow, this.ghost]) { s.visible = false; this.uiC.addChild(s); }
    this.uiC.children.forEach((c) => ((c as Sprite).roundPixels = true));
  }

  private buildMap(): void {
    const art = meadowArt();
    const ground = new Sprite(tex(art.ground.toCanvas()));
    this.mapC.addChild(ground);
    this.waterFrames = art.water.map((w) => tex(w.toCanvas()));
    this.waterSpr.texture = this.waterFrames[0];
    this.mapC.addChild(this.waterSpr);
    this.mapC.addChild(new Sprite(tex(art.deco.toCanvas())));
    for (const { prop, art: pa } of art.props) {
      const s = new Sprite(tex(pa.buf.toCanvas()));
      s.position.set(prop.x - pa.ax, prop.y - pa.ay);
      s.zIndex = prop.y;
      this.worldC.addChild(s);
    }
    // Windmuehle, Fahnen, Rauch, Lichter
    this.millFrames = Array.from({ length: MILL_STEPS }, (_, i) => tex(windmillBlades(i).toCanvas()));
    this.mill = new Sprite(this.millFrames[0]);
    this.mill.position.set(art.mill.x - 30, art.mill.y - 30);
    this.mill.zIndex = art.mill.y + 40;
    this.worldC.addChild(this.mill);
    this.flagFrames = Array.from({ length: 4 }, (_, i) => tex(flagFrame(i).toCanvas()));
    for (const f of art.flags) {
      const s = new Sprite(this.flagFrames[0]);
      s.position.set(f.x + 1, f.y - 1);
      s.zIndex = f.y + 60;
      this.worldC.addChild(s);
      this.flagSprs.push(s);
    }
    for (const sm of art.smoke) {
      const parts = Array.from({ length: 3 }, () => {
        const p = new Sprite(Texture.WHITE);
        p.width = p.height = 2; p.tint = hex(C.silver);
        this.fxHost.addChild(p);
        return p;
      });
      this.smokes.push({ parts, x: sm.x, y: sm.y });
    }
    for (const l of art.lights) {
      const g = new Sprite(tex(glowCanvas(l.r, l.warm ? C.yellow : C.ice)));
      g.anchor.set(0.5); g.position.set(l.x, l.y);
      g.alpha = l.warm ? 0.32 : 0.28;
      this.lightC.addChild(g);
      this.lampGlows.push({ s: g, base: g.alpha, ph: R() * 6 });
    }
    const flyGlow = tex(glowCanvas(4, C.yellow));
    for (let i = 0; i < 22; i++) {
      const west = i < 6;
      const x = west ? R() * 120 : 80 + R() * 520, y = 30 + R() * 300;
      const g = new Sprite(flyGlow); g.anchor.set(0.5); g.alpha = 0.35;
      const s = new Sprite(Texture.WHITE); s.width = s.height = 1; s.tint = hex(west ? C.ice : C.yellow);
      this.lightC.addChild(g, s);
      this.flies.push({ s, g, x, y, ph: R() * 10, sp: 0.3 + R() * 0.5, ax: 6 + R() * 10, ay: 4 + R() * 8 });
    }
  }
  private waterFrames: Texture[] = [];
  private millFrames: Texture[] = [];
  private flagFrames: Texture[] = [];

  /** Fenster-Platz in CSS-Pixeln: groesster Faktor, der passt (ganzzahlig, wenn er mindestens 88 % des moeglichen Faktors erreicht). */
  fit(availW: number, availH: number): void {
    const f = Math.max(1, Math.min(availW / VIEW_W, availH / VIEW_H));
    const k = Math.floor(f);
    this.scale = k >= 1 && k / f >= 0.88 ? k : f;
    this.canvasEl.style.width = `${Math.floor(VIEW_W * this.scale)}px`;
    this.canvasEl.style.height = `${Math.floor(VIEW_H * this.scale)}px`;
  }

  /** CSS-Position (clientX/Y) -> Kartenpixel */
  toMap(clientX: number, clientY: number): { x: number; y: number } {
    const r = this.canvasEl.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * VIEW_W, y: ((clientY - r.top) / r.height) * VIEW_H };
  }
  get canvasRect(): DOMRect {
    return this.canvasEl.getBoundingClientRect();
  }

  reset(): void {
    for (const m of [this.towers, this.enemies, this.projs] as Map<number, { spr: Sprite; shadow?: Sprite }>[]) {
      for (const v of m.values()) { v.spr.destroy(); v.shadow?.destroy(); }
      m.clear();
    }
    this.fx.clear();
    this.lastTick = -1;
  }

  // ---------------------------------------------------------------- Auswahl und Geist
  select(id: number | null): void {
    this.selectedId = id;
  }

  /** Geist beim Platzieren: Turm-Sprite, Fussabdruck, Reichweite (rot, wenn ungueltig). */
  setGhost(g: { x: number; y: number; spr: Spr; range: number; foot: number; ok: boolean } | null): void {
    const show = !!g;
    this.ghost.visible = this.ghostShadow.visible = show;
    this.ghostOk = g?.ok ?? true;
    if (!g) { this.hideRange('ghost'); return; }
    const x = Math.round(g.x), y = Math.round(g.y);
    this.ghost.texture = tex(g.spr.canvas);
    this.ghost.position.set(x - g.spr.ax, y - g.spr.ay);
    this.ghost.alpha = 0.72;
    this.ghost.tint = g.ok ? 0xffffff : hex(C.coral);
    this.ghostShadow.texture = shadowTex(g.foot, Math.max(2, Math.round(g.foot * 0.45)));
    this.ghostShadow.alpha = 0.35;
    this.ghostShadow.position.set(x - g.foot - 1, y - Math.round(g.foot * 0.45) - 1);
    this.showRange(x, y, g.range, g.ok ? C.white : C.red, 'ghost');
  }

  private rangeOwner: 'ghost' | 'sel' | null = null;
  private showRange(x: number, y: number, r: number, col: number, owner: 'ghost' | 'sel'): void {
    this.rangeOwner = owner;
    const rr = Math.round(r);
    const ring = ringSprite(rr, col);
    this.rangeRing.texture = tex(ring.canvas);
    this.rangeRing.position.set(x - ring.ax, y - ring.ay);
    this.rangeRing.visible = true;
    const disc = discSprite(rr, col);
    this.rangeDisc.texture = tex(disc.canvas);
    this.rangeDisc.position.set(x - disc.ax, y - disc.ay);
    this.rangeDisc.alpha = col === C.red ? 0.28 : 0.16;
    this.rangeDisc.visible = true;
  }
  private hideRange(owner: 'ghost' | 'sel'): void {
    if (this.rangeOwner !== owner) return;
    this.rangeRing.visible = this.rangeDisc.visible = false;
    this.rangeOwner = null;
  }

  // ---------------------------------------------------------------- Zustand -> Bild
  /** alpha = Fortschritt (0..1) zum naechsten Tick fuer die Interpolation. */
  sync(state: GameState, alpha: number, dtMs: number): void {
    this.now += dtMs;
    this.latest = state;
    const newTick = state.tick !== this.lastTick;
    this.lastTick = state.tick;
    const seenT = new Set<number>();
    for (const t of state.towers) { seenT.add(t.id); this.syncTower(t); }
    for (const [id, v] of this.towers) if (!seenT.has(id)) { v.spr.destroy(); v.shadow.destroy(); this.towers.delete(id); }

    const seenE = new Set<number>();
    for (const e of state.enemies) { seenE.add(e.id); this.syncEnemy(e, newTick, alpha); }
    for (const [id, v] of this.enemies) if (!seenE.has(id)) { v.spr.destroy(); v.shadow.destroy(); v.bar?.destroy(); v.barBg?.destroy(); this.enemies.delete(id); }

    const seenP = new Set<number>();
    for (const p of state.projectiles) { seenP.add(p.id); this.syncProj(p, newTick, alpha); }
    for (const [id, v] of this.projs) if (!seenP.has(id)) { v.spr.destroy(); v.shadow?.destroy(); this.projs.delete(id); }

    // Auswahl: Ring + Reichweite
    const sel = this.selectedId == null ? null : state.towers.find((t) => t.id === this.selectedId) ?? null;
    if (sel) {
      const x = Math.round(sel.x / 1000), y = Math.round(sel.y / 1000);
      const ring = ringSprite(footMilli(sel.type) / 1000 + 3, C.yellow, true);
      this.selRing.texture = tex(ring.canvas);
      this.selRing.position.set(x - ring.ax, y - ring.ay);
      this.selRing.visible = true;
      if (this.rangeOwner !== 'ghost') this.showRange(x, y, sel.range / 1000, C.white, 'sel');
    } else {
      this.selRing.visible = false;
      this.hideRange('sel');
    }
    this.animateMap();
  }

  private animateMap(): void {
    const t = this.now;
    this.waterSpr.texture = this.waterFrames[Math.floor(t / 170) % WATER_FRAMES];
    this.mill.texture = this.millFrames[Math.floor(t / 260) % MILL_STEPS];
    const ff = this.flagFrames[Math.floor(t / 150) % 4];
    for (const f of this.flagSprs) f.texture = ff;
    for (const g of this.lampGlows) g.s.alpha = g.base * (0.82 + 0.18 * Math.sin(t / 130 + g.ph) * Math.sin(t / 47 + g.ph * 2));
    for (const f of this.flies) {
      const a = t / 1000 * f.sp + f.ph;
      const x = Math.round(f.x + Math.sin(a * 1.3) * f.ax), y = Math.round(f.y + Math.sin(a * 0.9 + 1) * f.ay);
      f.s.position.set(x, y); f.g.position.set(x, y);
      const bl = Math.sin(a * 2.2) > -0.3;
      f.s.visible = bl; f.g.alpha = bl ? 0.3 + 0.15 * Math.sin(a * 5) : 0.08;
    }
    for (const s of this.smokes) {
      s.parts.forEach((p, i) => {
        const ph = ((t / 2400 + i / 3) % 1);
        p.position.set(Math.round(s.x + ph * 6 + Math.sin(ph * 9 + i) * 1.2), Math.round(s.y - ph * 18));
        p.alpha = (1 - ph) * 0.7; p.width = p.height = 1 + Math.round(ph * 3);
      });
    }
    // Bildschirm-Wackeln
    const sh = this.fx.shake;
    const ox = sh.t > 0 ? Math.round((R() - 0.5) * 2 * sh.amp) : 0, oy = sh.t > 0 ? Math.round((R() - 0.5) * 2 * sh.amp) : 0;
    if (ox !== this.shakeOff.x || oy !== this.shakeOff.y) {
      this.shakeOff = { x: ox, y: oy };
      this.app.stage.position.set(ox, oy);
    }
  }

  private towerSpr(t: TowerState): Spr {
    const atk = t.attackTick;
    const frame = atk > 0 ? (atk < 4 ? 'atk0' : atk < 6 ? 'atk1' : atk < 11 ? 'atk2' : 'atk3') : `idle${(Math.floor(this.now / 166) + t.id) & 3}`;
    return t.type === 'wren' ? heroSprite(t.heroLevel, t.facing, frame) : towerSprite(t.type, t.tiers, t.facing, frame);
  }

  private syncTower(t: TowerState): void {
    let v = this.towers.get(t.id);
    const x = Math.round(t.x / 1000), y = Math.round(t.y / 1000);
    if (!v) {
      const shadow = new Sprite(shadowTex(footMilli(t.type) / 1000 | 0, 4));
      this.shadowC.addChild(shadow);
      const spr = new Sprite();
      this.worldC.addChild(spr);
      v = { spr, shadow, key: '', drop: 8, up: 0 };
      this.towers.set(t.id, v);
    }
    const s = this.towerSpr(t);
    v.spr.texture = tex(s.canvas);
    let dy = 0;
    if (v.drop > 0) { dy = -Math.round(Math.sin((v.drop / 8) * Math.PI * 0.5) * 12); v.drop -= 0.5; }
    let dx = 0;
    if (v.up > 0) { dx = v.up % 2 < 1 ? 0 : 0; v.up -= 0.5; dy -= v.up > 3 ? 2 : v.up > 0 ? 1 : 0; }
    v.spr.position.set(x - s.ax + dx, y - s.ay + dy);
    v.spr.zIndex = y;
    const rx = Math.round(footMilli(t.type) / 1000);
    v.shadow.texture = shadowTex(rx + 2, Math.max(2, Math.round(rx * 0.45)));
    v.shadow.alpha = 0.35;
    v.shadow.position.set(x - rx - 3, y - Math.round(rx * 0.45) - 1);
  }

  private syncEnemy(e: EnemyState, newTick: boolean, alpha: number): void {
    let v = this.enemies.get(e.id);
    const cx = e.x / 1000, cy = e.y / 1000;
    if (!v) {
      const shadow = new Sprite();
      this.shadowC.addChild(shadow);
      const spr = new Sprite();
      this.worldC.addChild(spr);
      v = { spr, shadow, key: '', px: cx, py: cy, cx, cy, flash: 0 };
      this.enemies.set(e.id, v);
    } else if (newTick) {
      v.px = v.cx; v.py = v.cy; v.cx = cx; v.cy = cy;
    }
    const x = Math.round(v.px + (v.cx - v.px) * alpha), y = Math.round(v.py + (v.cy - v.py) * alpha);
    const hitFlash = this.now < v.flash;
    const fr = (Math.floor(this.now / (e.type === 'gold' ? 110 : 170)) + e.id) & 3;
    const camo = e.camo && !e.revealed;
    const s = enemySprite(e.type, fr, { camo: e.camo, damageStage: e.damageStage, hitFlash });
    v.spr.texture = tex(s.canvas);
    v.spr.position.set(x - s.ax, y - s.ay + (e.type === 'leviathan' ? Math.round(Math.sin(this.now / 400) * 2) - 8 : 0));
    v.spr.zIndex = y + (e.type === 'leviathan' ? 40 : 0);
    v.spr.alpha = camo ? 0.55 + 0.2 * Math.sin(this.now / 90 + e.id) : 1;
    v.spr.tint = e.frozenTicks > 0 ? hex(C.ice) : e.stunTicks > 0 ? hex(C.yellow) : e.slowBp > 0 && e.slowTicks > 0 ? hex(C.silver) : 0xffffff;
    const big = e.type === 'leviathan' ? 3 : e.type === 'brute' ? 1 : 0;
    const rx = e.type === 'leviathan' ? 20 : e.type === 'brute' ? 8 : e.type === 'ironshell' ? 6 : 5;
    v.shadow.texture = shadowTex(rx, 2 + big);
    v.shadow.alpha = 0.3;
    v.shadow.position.set(x - rx - 1, y + (e.type === 'leviathan' ? 8 : 1) - 2 - big);
    if (e.type === 'leviathan' || (e.type === 'brute' && e.hp < e.maxHp)) {
      if (!v.bar) {
        v.barBg = new Sprite(Texture.WHITE); v.barBg.tint = hex(C.ink); v.barBg.height = 4;
        v.bar = new Sprite(Texture.WHITE); v.bar.tint = hex(C.red); v.bar.height = 2;
        this.fxHost.addChild(v.barBg, v.bar);
      }
      const w = e.type === 'leviathan' ? 40 : 14;
      v.barBg!.width = w + 2;
      v.barBg!.position.set(x - w / 2 - 1, y - (e.type === 'leviathan' ? 34 : 18));
      v.bar.width = Math.max(1, Math.round((w * e.hp) / e.maxHp));
      v.bar.position.set(x - w / 2, v.barBg!.y + 1);
    }
  }

  private syncProj(p: ProjectileState, newTick: boolean, alpha: number): void {
    let v = this.projs.get(p.id);
    const cx = p.x / 1000, cy = p.y / 1000;
    if (!v) {
      const spr = new Sprite();
      this.projC.addChild(spr);
      v = { spr, key: '', px: cx, py: cy, cx, cy };
      if (p.kind === 'bomb') { v.shadow = new Sprite(shadowTex(3, 1)); v.shadow.alpha = 0.4; this.shadowC.addChild(v.shadow); }
      this.projs.set(p.id, v);
    } else if (newTick) {
      v.px = v.cx; v.py = v.cy; v.cx = cx; v.cy = cy;
    }
    const gx = v.px + (v.cx - v.px) * alpha, gy = v.py + (v.cy - v.py) * alpha;
    let lift = 0;
    if (p.arc) lift = Math.sin((Math.min(10000, p.arc.t) / 10000) * Math.PI) * 26;
    const ang = Math.atan2(-p.vy, p.vx);
    const dir16 = ((Math.round((ang / (Math.PI * 2)) * 16) % 16) + 16) % 16;
    const s = projectileSprite(p.kind, p.kind === 'bomb' ? 0 : dir16);
    v.spr.texture = tex(s.canvas);
    v.spr.position.set(Math.round(gx) - s.ax, Math.round(gy - lift) - s.ay);
    v.spr.zIndex = 0;
    if (v.shadow) v.shadow.position.set(Math.round(gx) - 4, Math.round(gy) - 2);
  }

  /** Zustand fuer Event-Effekte (Turmposition beim Abschuss usw.) */
  setLatest(s: GameState): void {
    this.latest = s;
  }

  // ---------------------------------------------------------------- Events -> Effekte
  private enemyPos(id: number): { x: number; y: number } | null {
    const e = this.enemies.get(id);
    return e ? { x: e.cx, y: e.cy } : null;
  }

  handle(ev: SimEvent): void {
    const fx = this.fx;
    const m = (v: number): number => v / 1000;
    switch (ev.type) {
      case 'fire': {
        const t = this.latest?.towers.find((q) => q.id === ev.tower);
        if (t) {
          const a = (t.facing * Math.PI) / 4;
          const col = t.type === 'bombardier' ? [C.orange, C.stone, C.yellow] : t.type === 'frostcaller' ? [C.ice, C.white] : t.type === 'wren' ? [C.yellow, C.amber] : [C.sand, C.white];
          fx.burst(m(t.x) + Math.cos(a) * 10, m(t.y) - 12 - Math.sin(a) * 7, col, 3, 0.9, 1, 0.02, 8);
        }
        break;
      }
      case 'hit': {
        const x = m(ev.x), y = m(ev.y);
        const e = this.enemies.get(ev.enemy);
        if (e) e.flash = this.now + 90;
        fx.burst(x, y, [C.white, C.yellow], 3, 1.1, 1, 0.03, 8);
        if (ev.dmg >= 5) fx.float(x, y - 8, String(ev.dmg), C.white, 26, 0.5);
        break;
      }
      case 'blocked': {
        fx.burst(m(ev.x), m(ev.y), [C.silver, C.stone], 4, 1.4, 1, 0.05, 10);
        fx.float(m(ev.x), m(ev.y) - 8, ev.reason === 'armor' ? 'TINK' : 'IMMUNE', C.silver, 22, 0.3);
        break;
      }
      case 'pop': {
        const x = m(ev.x), y = m(ev.y);
        fx.burst(x, y, SHARD_COL[ev.etype], ev.etype === 'brute' || ev.etype === 'leviathan' ? 14 : 8, 1.6, 2, 0.07, 22);
        fx.ring(x, y, 2, ev.etype === 'brute' ? 12 : 8, C.white, 8);
        if (ev.cash >= 3) fx.float(x, y - 6, `+${ev.cash}`, C.yellow, 30, 0.4);
        break;
      }
      case 'explode': {
        const r = m(ev.radius);
        fx.explosion(m(ev.x), m(ev.y), r, ev.kind);
        if (ev.kind === 'quake') { fx.shake.t = 14; fx.shake.amp = 2; fx.ring(m(ev.x), m(ev.y), 4, r, C.tan, 18); }
        else if (ev.kind === 'star') { fx.shake.t = 8; fx.shake.amp = 1; }
        break;
      }
      case 'nova': fx.ring(m(ev.x), m(ev.y), 3, m(ev.radius), C.ice, 14); fx.burst(m(ev.x), m(ev.y), [C.ice, C.white, C.sky], 8, 1.4, 2, 0.04, 16); break;
      case 'chain': fx.bolt(ev.points.map(([x, y]) => [m(x), m(y)] as [number, number]), C.yellow); break;
      case 'status': {
        const p = this.enemyPos(ev.enemy);
        if (!p) break;
        if (ev.kind === 'freeze') fx.burst(p.x, p.y - 4, [C.ice, C.white], 6, 1, 1, 0.02, 14);
        else if (ev.kind === 'stun') fx.burst(p.x, p.y - 10, [C.yellow], 3, 0.6, 1, 0, 14);
        else if (ev.kind === 'reveal') fx.burst(p.x, p.y - 4, [C.yellow, C.white], 5, 0.8, 1, -0.01, 16);
        break;
      }
      case 'leak': {
        fx.shake.t = 10; fx.shake.amp = 2; fx.flash(C.red, 0.35);
        fx.float(626, 150, `-${ev.lives}`, C.red, 40, 0.5);
        break;
      }
      case 'place': {
        const t = this.latest?.towers.find((q) => q.id === ev.tower);
        if (t) { fx.burst(m(t.x), m(t.y), [C.sand, C.tan, C.peach], 10, 1.2, 2, 0.05, 16); fx.ring(m(t.x), m(t.y), 2, 14, C.white, 10); }
        break;
      }
      case 'upgrade': {
        const t = this.latest?.towers.find((q) => q.id === ev.tower);
        const v = this.towers.get(ev.tower);
        if (v) v.up = 6;
        if (t) {
          fx.burst(m(t.x), m(t.y) - 10, [C.yellow, C.amber, C.white], 12, 1.5, 2, -0.01, 22);
          fx.ring(m(t.x), m(t.y), 3, 18, C.yellow, 12);
          fx.float(m(t.x), m(t.y) - 30, 'UP!', C.yellow, 30, 0.4);
        }
        break;
      }
      case 'sell': {
        const t = this.latest?.towers.find((q) => q.id === ev.tower);
        if (t) { fx.burst(m(t.x), m(t.y) - 6, [C.amber, C.yellow], 10, 1.4, 2, 0.06, 22); fx.float(m(t.x), m(t.y) - 16, `+${ev.cash}`, C.yellow, 36, 0.4); }
        break;
      }
      case 'heroLevel': {
        const t = this.latest?.towers.find((q) => q.id === ev.tower);
        if (t) { fx.ring(m(t.x), m(t.y), 4, 30, C.yellow, 20); fx.burst(m(t.x), m(t.y) - 12, [C.yellow, C.white, C.amber], 16, 1.8, 2, -0.02, 30); fx.float(m(t.x), m(t.y) - 34, 'LEVEL UP', C.yellow, 50, 0.3); }
        break;
      }
      case 'ability': this.abilityFx(ev.id, ev.x, ev.y); break;
      case 'roundEnd': if (ev.bonus) fx.float(320, 28, `+${ev.bonus}`, C.yellow, 50, 0.3); break;
      case 'bossStage': {
        const p = this.enemyPos(ev.enemy);
        fx.shake.t = 16; fx.shake.amp = 2; fx.flash(C.white, 0.35);
        if (p) fx.burst(p.x, p.y - 12, [C.slate, C.stone, C.silver, C.navy], 18, 2.2, 3, 0.08, 28);
        break;
      }
      default: break;
    }
  }

  private abilityFx(id: string, x?: number, y?: number): void {
    const fx = this.fx;
    if (id === 'arrowRain') {
      fx.flash(C.leaf, 0.12);
      fx.custom(150, (node) => {
        const arrows = Array.from({ length: 60 }, () => {
          const s = new Sprite(Texture.WHITE); s.width = 1; s.height = 5; s.tint = hex(C.sand); node.addChild(s);
          return { s, x: R() * VIEW_W, y: -R() * 340, v: 3 + R() * 2 };
        });
        return (age) => { for (const a of arrows) { const yy = a.y + age * a.v * 2.4; a.s.position.set(Math.round(a.x), Math.round(yy)); a.s.visible = yy > 0 && yy < VIEW_H; } };
      });
    } else if (id === 'absoluteZero') {
      fx.flash(C.white, 0.7);
      fx.ring(320, 180, 10, 420, C.ice, 40);
      fx.burst(320, 180, [C.ice, C.white, C.sky], 40, 4, 2, 0.02, 40);
    } else if (id === 'flare') {
      fx.flash(C.yellow, 0.4);
      if (x !== undefined && y !== undefined) { fx.ring(x / 1000, y / 1000, 4, 40, C.yellow, 18); fx.burst(x / 1000, y / 1000, [C.yellow, C.white, C.amber], 24, 2.4, 2, 0.01, 30); }
    } else if (id === 'dawnbreak') {
      fx.flash(C.yellow, 0.6);
      fx.custom(40, (node) => {
        const b = new Buf(VIEW_W, VIEW_H);
        for (let i = 1; i < PATH.length; i++) for (let o = -3; o <= 3; o++) b.line(PATH[i - 1][0] + o * (PATH[i][1] === PATH[i - 1][1] ? 0 : 1), PATH[i - 1][1] + o * (PATH[i][1] === PATH[i - 1][1] ? 1 : 0), PATH[i][0] + o * (PATH[i][1] === PATH[i - 1][1] ? 0 : 1), PATH[i][1] + o * (PATH[i][1] === PATH[i - 1][1] ? 1 : 0), Math.abs(o) < 2 ? C.white : C.yellow);
        const s = new Sprite(tex(b.toCanvas())); node.addChild(s);
        return (age) => { s.alpha = Math.max(0, 1 - age / 40); };
      });
    }
  }

  update(dtTicks: number): void {
    this.fx.update(dtTicks);
    this.app.render();
  }

  destroy(): void {
    this.app.destroy(true, { children: true });
  }
}

const discCache = new Map<string, Spr>();
function discSprite(r: number, col: number): Spr {
  const k = `${r}:${col}`;
  let s = discCache.get(k);
  if (!s) {
    const S = r * 2 + 3;
    const b = new Buf(S, S);
    b.disc(S >> 1, S >> 1, r, col);
    s = { canvas: b.toCanvas(), ax: S >> 1, ay: S >> 1 };
    discCache.set(k, s);
  }
  return s;
}
void explosionSprite;
