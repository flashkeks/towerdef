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
import { type EnemyState, type EnemyType, type GameState, type ProjectileState, type SimEvent, type TowerAura, type TowerState } from '../sim';
import { rangeView, coinCount, coinDelay, coinPath, hasAura, isMarked, projectileLook, type RangeView } from './r13';
import { FxLayer, FRAMES } from './fx';
import { footMilli } from './info';
import { TRAP_W, bigHeart, bombLantern, bubbleSprite, coinSprite, trapSprite, discSprite, enemySprite, fx as P2, heroSprite, projectileSprite, ringSprite, shadowSprite, heroMuzzle, towerMuzzle, towerSprite, type HeroFrame, type Spr, type TowerFrame } from './sprites';
import { tex } from './textures';
import { PATH } from '../pixel/map/layout';
import { TRAP_CHARGES, trapPieces } from '../powers/info';
import type { PowerKey, TrapState } from '../sim';

export const VIEW_W = 640;
export const VIEW_H = 360;
const hex = (c: number): number => parseInt(PAL[NAME_OF(c)].slice(1), 16);
const R = rng(77);

const SHARD_COL: Record<EnemyType, number[]> = {
  red: [C.red, C.crimson, C.coral], blue: [C.sky, C.navy, C.ice], green: [C.leaf, C.grass, C.yellow], gold: [C.amber, C.yellow, C.orange],
  ironshell: [C.stone, C.silver, C.slate], ember: [C.orange, C.yellow, C.red], brute: [C.slate, C.dusk, C.stone], leviathan: [C.navy, C.stone, C.sky],
};

interface TowerView { spr: Sprite; shadow: Sprite; key: string; drop: number; up: number; tiers: string; kick: number; flag?: Sprite }
interface EnemyView { bub?: Sprite; mark?: Sprite; spr: Sprite; shadow: Sprite; key: string; px: number; py: number; cx: number; cy: number; flash: number; flip: boolean; bar?: Sprite; barBg?: Sprite }
interface TrapView { spr: Sprite; x: number; y: number; kind: 'caltrops' | 'frostTrap'; key: string; drop: number }
interface ProjView { spr: Sprite; shadow?: Sprite; key: string; px: number; py: number; cx: number; cy: number; mx: number; my: number }

const shadowTex = (w: number, h: number): Texture => tex(shadowSprite(w, h).canvas);

function glowCanvas(r: number, col: number): HTMLCanvasElement {
  const b = new Buf(r * 2 + 1, r * 2 + 1);
  for (let y = 0; y <= r * 2; y++) for (let x = 0; x <= r * 2; x++) {
    const d = Math.hypot(x - r, y - r) / r;
    if (d < 1 && bayer(x, y) < Math.pow(1 - d, 1.4) * 0.95) b.set(x, y, col);
  }
  return b.toCanvas();
}

/** Faehnchen fuer Tuerme in einer Market-Aura (7 x 10, 2 Wehbilder): Stange, goldener Wimpel, Glanzpunkt. */
function pennantCanvas(frame: number): HTMLCanvasElement {
  const b = new Buf(8, 11);
  b.rect(1, 1, 1, 9, C.stone);
  b.set(1, 0, C.yellow);
  b.set(1, 10, C.ink); b.set(2, 10, C.ink);
  const len = frame ? 4 : 5;
  b.rect(2, 1, len, 3, C.amber);
  b.rect(2, 1, len, 1, C.yellow);
  b.set(2 + len - 1, 3, C.orange);
  if (frame) b.set(2 + len, 2, C.amber);
  b.set(3, 2, C.white);
  b.outline(C.ink);
  return b.toCanvas();
}
const PENNANTS = [0, 1].map((f) => pennantCanvas(f));

export class Renderer {
  app!: Application;
  fx!: FxLayer;
  private mapC = new Container();
  private trapC = new Container();
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
  private traps = new Map<number, TrapView>();
  private aimSpr = new Sprite();
  private aimOn = false;
  private warpSpr = new Sprite(Texture.WHITE);
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
  private auraSpr = new Sprite();
  private auraProbe: ((id: number) => TowerAura) | null = null;
  private auraOf = new Map<number, boolean>();
  /** Ziel der Muenzfluege (Kartenpixel), vom Match gesetzt: Mitte der Geldanzeige */
  cashTarget = { x: 24, y: 2 };
  private ghost = new Sprite();
  private ghostShadow = new Sprite();
  private ghostOk = true;
  private selectedId: number | null = null;
  private latest: GameState | null = null;
  private heroCast = 0;
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
    st.addChild(this.mapC, this.trapC, this.shadowC, this.worldC, this.projC, this.fxHost, this.lightC, this.uiC);
    this.worldC.sortableChildren = true;
    this.buildMap();
    this.flashSpr = new Sprite(Texture.WHITE);
    this.flashSpr.width = VIEW_W; this.flashSpr.height = VIEW_H; this.flashSpr.alpha = 0;
    this.fx = new FxLayer(this.flashSpr);
    this.fxHost.addChild(this.fx.node, this.flashSpr);
    for (const s of [this.selRing, this.rangeDisc, this.rangeRing, this.auraSpr, this.ghostShadow, this.ghost]) { s.visible = false; this.uiC.addChild(s); }
    this.aimSpr.visible = false; this.uiC.addChild(this.aimSpr);
    this.warpSpr.width = VIEW_W; this.warpSpr.height = VIEW_H; this.warpSpr.tint = hex(C.sky); this.warpSpr.alpha = 0; this.warpSpr.visible = false;
    this.lightC.addChild(this.warpSpr);
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
    for (const v of this.traps.values()) v.spr.destroy();
    this.traps.clear();
    this.fx.clear();
    this.lastTick = -1;
  }

  // ---------------------------------------------------------------- Auswahl und Geist
  select(id: number | null): void {
    this.selectedId = id;
  }

  /** Geist beim Platzieren: Turm-Sprite, Fussabdruck, Reichweite (rot, wenn ungueltig). */
  setGhost(g: { x: number; y: number; spr: Spr; view: RangeView; foot: number; ok: boolean } | null): void {
    const show = !!g;
    this.ghost.visible = this.ghostShadow.visible = show;
    this.ghostOk = g?.ok ?? true;
    if (!g) { this.hideRange('ghost'); return; }
    const x = Math.round(g.x), y = Math.round(g.y);
    this.ghost.texture = tex(g.spr.canvas);
    this.ghost.position.set(x - g.spr.ax, y - g.spr.ay);
    this.ghost.alpha = 0.72;
    this.ghost.tint = g.ok ? 0xffffff : hex(C.coral);
    this.ghostShadow.texture = shadowTex(16, 5);
    this.ghostShadow.alpha = 1;
    this.ghostShadow.position.set(x - 9, y - 3);
    this.showRange(x, y, g.view, g.ok ? C.white : C.red, 'ghost');
  }

  /** Zielvorschau fuer Powers: Bombe (Radius-Kreis), Falle (Sprite auf dem Weg, gruen = gueltig, rot = nicht). */
  setAim(a: { kind: 'bomb' | 'caltrops' | 'frostTrap'; x: number; y: number; r?: number; ok: boolean } | null): void {
    if (!a) {
      if (this.aimOn) { this.aimSpr.visible = false; this.hideRange('ghost'); this.aimOn = false; }
      return;
    }
    this.aimOn = true;
    const x = Math.round(a.x), y = Math.round(a.y);
    const col = a.ok ? C.leaf : C.red;
    if (a.kind === 'bomb') {
      const sp = bombLantern(Math.floor(this.now / 160));
      this.aimSpr.texture = tex(sp.canvas);
      this.aimSpr.position.set(x - sp.ax, y - sp.ay - 3);
      this.aimSpr.tint = a.ok ? 0xffffff : hex(C.coral);
      this.showRange(x, y, { kind: 'ring', r: a.r ?? 40 }, a.ok ? C.orange : C.red, 'ghost');
    } else {
      const sp = trapSprite(a.kind, a.kind === 'caltrops' ? 6 : 5, Math.floor(this.now / 300));
      this.aimSpr.texture = tex(sp.canvas);
      this.aimSpr.position.set(x - sp.ax, y - sp.ay);
      this.aimSpr.tint = a.ok ? hex(C.leaf) : hex(C.coral);
      this.showRange(x, y, { kind: 'ring', r: 10 }, col, 'ghost');
    }
    this.aimSpr.alpha = 0.85;
    this.aimSpr.visible = true;
  }

  private rangeOwner: 'ghost' | 'sel' | null = null;
  private showRange(x: number, y: number, view: RangeView, col: number, owner: 'ghost' | 'sel'): void {
    this.rangeOwner = owner;
    this.rangeRing.visible = this.rangeDisc.visible = this.auraSpr.visible = false;
    if (view.kind === 'none') return;
    const rr = Math.round(view.r);
    if (view.kind === 'aura') {
      // Market: kein Schussring, sondern der Aura-Ring in Pfadfarbe (Pixel-Effekt von Agent B), Bild wechselt in `animateMap`
      this.auraAt = { x, y, r: rr, bad: col === C.red };
      this.auraSpr.visible = true;
      const disc = discSprite(rr, col === C.red ? C.red : C.yellow);
      this.rangeDisc.texture = tex(disc.canvas);
      this.rangeDisc.position.set(x - disc.ax, y - disc.ay);
      this.rangeDisc.alpha = col === C.red ? 0.22 : 0.13;
      this.rangeDisc.visible = true;
      this.drawAura();
      return;
    }
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
  private auraAt: { x: number; y: number; r: number; bad: boolean } | null = null;
  private drawAura(): void {
    const a = this.auraAt;
    if (!a || !this.auraSpr.visible) return;
    const sp = P2.auraRing(Math.min(150, a.r), Math.floor(this.now / 140), 2);
    this.auraSpr.texture = tex(sp.canvas);
    this.auraSpr.position.set(a.x - sp.ax, a.y - sp.ay);
    this.auraSpr.tint = a.bad ? hex(C.coral) : 0xffffff;
  }
  private hideRange(owner: 'ghost' | 'sel'): void {
    if (this.rangeOwner !== owner) return;
    this.rangeRing.visible = this.rangeDisc.visible = this.auraSpr.visible = false;
    this.auraAt = null;
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
    for (const [id, v] of this.towers) if (!seenT.has(id)) { v.spr.destroy(); v.shadow.destroy(); v.flag?.destroy(); this.towers.delete(id); this.auraOf.delete(id); }
    if (this.auraProbe && (newTick && state.tick % 12 === 0 || this.auraOf.size !== state.towers.length)) {
      for (const t of state.towers) this.auraOf.set(t.id, t.type !== 'market' && hasAura(this.auraProbe(t.id)));
    }

    const seenE = new Set<number>();
    for (const e of state.enemies) { seenE.add(e.id); this.syncEnemy(e, newTick, alpha); }
    for (const [id, v] of this.enemies) if (!seenE.has(id)) { v.spr.destroy(); v.shadow.destroy(); v.bar?.destroy(); v.barBg?.destroy(); v.bub?.destroy(); v.mark?.destroy(); this.enemies.delete(id); }

    const seenP = new Set<number>();
    for (const p of state.projectiles) { seenP.add(p.id); this.syncProj(p, newTick, alpha); }
    for (const [id, v] of this.projs) if (!seenP.has(id)) { v.spr.destroy(); v.shadow?.destroy(); this.projs.delete(id); }

    // Fallen auf dem Weg: Zacken/Kristalle nehmen mit den Ladungen ab
    const seenTr = new Set<number>();
    for (const tr of state.traps) { seenTr.add(tr.id); this.syncTrap(tr); }
    for (const [id, v] of this.traps) if (!seenTr.has(id)) { v.spr.destroy(); this.traps.delete(id); }
    // Zeitblase: blaue Toenung, solange Time Warp laeuft (sanftes Ein- und Ausblenden)
    const wl = state.warpLeft;
    this.warpSpr.visible = wl > 0 || this.warpSpr.alpha > 0.01;
    const wt = wl > 0 ? 0.3 * Math.min(1, wl / 40) : 0;
    this.warpSpr.alpha += Math.sign(wt - this.warpSpr.alpha) * Math.min(Math.abs(wt - this.warpSpr.alpha), 0.04);
    // Auswahl: Ring + Reichweite
    const sel = this.selectedId == null ? null : state.towers.find((t) => t.id === this.selectedId) ?? null;
    if (sel) {
      const x = Math.round(sel.x / 1000), y = Math.round(sel.y / 1000);
      const ring = ringSprite(footMilli(sel.type) / 1000 + 3, C.yellow, true);
      this.selRing.texture = tex(ring.canvas);
      this.selRing.position.set(x - ring.ax, y - ring.ay);
      this.selRing.visible = true;
      if (this.rangeOwner !== 'ghost') this.showRange(x, y, rangeView(sel.type, sel.range / 1000), C.white, 'sel');
    } else {
      this.selRing.visible = false;
      this.hideRange('sel');
    }
    this.animateMap();
  }

  private syncTrap(t: TrapState): void {
    const slots = t.kind === 'caltrops' ? 6 : 5;
    const pieces = trapPieces(t.charges, TRAP_CHARGES[t.kind], slots);
    const fr = t.kind === 'frostTrap' ? Math.floor(this.now / 380) & 1 : 0;
    let v = this.traps.get(t.id);
    if (!v) {
      const spr = new Sprite();
      this.trapC.addChild(spr);
      v = { spr, x: t.x / 1000, y: t.y / 1000, kind: t.kind, key: '', drop: 8 };
      this.traps.set(t.id, v);
    }
    const sp = trapSprite(t.kind, pieces, fr);
    v.spr.texture = tex(sp.canvas);
    let dy = 0;
    if (v.drop > 0) { dy = -Math.round(Math.sin((v.drop / 8) * Math.PI * 0.5) * 14); v.drop -= 0.5; }
    v.spr.position.set(Math.round(v.x) - sp.ax, Math.round(v.y) - sp.ay + dy);
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
    const frame = (atk > 0 ? (atk < 4 ? 'atk0' : atk < 6 ? 'atk1' : atk < 11 ? 'atk2' : 'atk3') : `idle${(Math.floor(this.now / 166) + t.id) & 3}`) as TowerFrame;
    if (t.type === 'wren' && this.now < this.heroCast) return heroSprite(t.heroLevel, t.facing, this.heroCast - this.now > 150 ? 'cast0' : 'cast1');
    return t.type === 'wren' ? heroSprite(t.heroLevel, t.facing, frame as HeroFrame) : towerSprite(t.type, t.tiers, t.facing, frame);
  }

  private syncTower(t: TowerState): void {
    let v = this.towers.get(t.id);
    const x = Math.round(t.x / 1000), y = Math.round(t.y / 1000);
    if (!v) {
      const shadow = new Sprite(shadowTex(16, 5));
      this.shadowC.addChild(shadow);
      const spr = new Sprite();
      this.worldC.addChild(spr);
      v = { spr, shadow, key: '', drop: 8, up: 0, tiers: t.tiers.join(''), kick: 0 };
      this.towers.set(t.id, v);
    }
    const s = this.towerSpr(t);
    v.spr.texture = tex(s.canvas);
    let dy = 0;
    if (v.drop > 0) { dy = -Math.round(Math.sin((v.drop / 8) * Math.PI * 0.5) * 12); v.drop -= 0.5; }
    let dx = 0;
    if (v.up > 0) { dx = v.up % 2 < 1 ? 0 : 0; v.up -= 0.5; dy -= v.up > 3 ? 2 : v.up > 0 ? 1 : 0; }
    // Rueckstoss (Longshot): 1-2 px gegen die Blickrichtung, klingt in ein paar Ticks ab
    if (v.kick > 0) {
      const a = (t.facing * Math.PI) / 4;
      const k = v.kick > 2 ? 2 : 1;
      dx -= Math.round(Math.cos(a) * k); dy += Math.round(Math.sin(a) * k);
      v.kick -= 0.5;
    }
    v.spr.position.set(x - s.ax + dx, y - s.ay + dy);
    v.spr.zIndex = y;
    // Schatten waechst mit der Stufe (Market-Gebaeude sind breiter)
    const top = Math.max(t.tiers[0], t.tiers[1], t.tiers[2]);
    const sw = t.type === 'market' ? 18 + top * 2 : 16;
    v.shadow.texture = shadowTex(sw, 5);
    v.shadow.position.set(x - sw / 2 - 1, y - 3);
    // Faehnchen: Turm steht in einer Market-Aura
    const inAura = this.auraOf.get(t.id) === true;
    if (inAura) {
      if (!v.flag) { v.flag = new Sprite(); this.worldC.addChild(v.flag); }
      v.flag.texture = tex(PENNANTS[Math.floor(this.now / 220) & 1]);
      v.flag.position.set(x + (footMilli(t.type) / 1000) - 1, y - 12);
      v.flag.zIndex = y + 1;
      v.flag.visible = true;
    } else if (v.flag) { v.flag.destroy(); v.flag = undefined; }
  }

  private syncEnemy(e: EnemyState, newTick: boolean, alpha: number): void {
    let v = this.enemies.get(e.id);
    const cx = e.x / 1000, cy = e.y / 1000;
    if (!v) {
      const shadow = new Sprite();
      this.shadowC.addChild(shadow);
      const spr = new Sprite();
      this.worldC.addChild(spr);
      v = { spr, shadow, key: '', px: cx, py: cy, cx, cy, flash: 0, flip: false };
      this.enemies.set(e.id, v);
    } else if (newTick) {
      if (Math.abs(cx - v.cx) > 0.001) v.flip = cx < v.cx;
      v.px = v.cx; v.py = v.cy; v.cx = cx; v.cy = cy;
    }
    const x = Math.round(v.px + (v.cx - v.px) * alpha), y = Math.round(v.py + (v.cy - v.py) * alpha);
    const hitFlash = this.now < v.flash;
    const fr = (Math.floor(this.now / (e.type === 'gold' ? 110 : 170)) + e.id) & 3;
    const camo = e.camo && !e.revealed;
    const s = enemySprite(e.type, fr, { camo: e.camo, damageStage: e.damageStage, hitFlash, flip: v.flip });
    v.spr.texture = tex(s.canvas);
    v.spr.position.set(x - s.ax, y - s.ay + (e.type === 'leviathan' ? Math.round(Math.sin(this.now / 400) * 2) - 8 : 0));
    v.spr.zIndex = y + (e.type === 'leviathan' ? 40 : 0);
    v.spr.alpha = camo ? 0.55 + 0.2 * Math.sin(this.now / 90 + e.id) : 1;
    v.spr.tint = e.frozenTicks > 0 ? hex(C.ice) : e.stunTicks > 0 ? hex(C.yellow) : e.slowBp > 0 && e.slowTicks > 0 ? hex(C.silver) : 0xffffff;
    if (this.latest && this.latest.warpLeft > 0) {
      if (!v.bub) { v.bub = new Sprite(); this.fxHost.addChild(v.bub); }
      const bs = bubbleSprite(Math.floor(this.now / 200) + e.id, e.type === 'leviathan' ? 22 : e.type === 'brute' ? 11 : 8);
      v.bub.texture = tex(bs.canvas);
      v.bub.position.set(x - bs.ax, y - bs.ay - (e.type === 'leviathan' ? 14 : 5));
      v.bub.alpha = 0.9;
    } else if (v.bub) { v.bub.destroy(); v.bub = undefined; }
    // Crippling Shot: rotes Fadenkreuz ueber dem Ziel, solange die Sim die Markierung fuehrt
    if (isMarked(e)) {
      if (!v.mark) { v.mark = new Sprite(); this.fxHost.addChild(v.mark); }
      const ms = P2.bossMark(Math.floor(this.now / 110));
      v.mark.texture = tex(ms.canvas);
      v.mark.position.set(x - ms.ax, y - ms.ay - (e.type === 'leviathan' ? 52 : e.type === 'brute' ? 30 : 22));
      v.mark.alpha = e.markTicks < 30 && (Math.floor(this.now / 90) & 1) ? 0.4 : 1;
    } else if (v.mark) { v.mark.destroy(); v.mark = undefined; }
    const sw = e.type === 'leviathan' ? 40 : e.type === 'brute' ? 16 : 9, sh = e.type === 'leviathan' ? 10 : e.type === 'brute' ? 5 : 3;
    v.shadow.texture = shadowTex(sw, sh);
    v.shadow.alpha = e.type === 'leviathan' ? 0.8 : 1;
    v.shadow.position.set(x - sw / 2 - 1, y - sh / 2 - 1 + (e.type === 'leviathan' ? 8 : 0));
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
      // Start am Muendungspunkt der Waffe (Fuss-Anker + `towerMuzzle`), nicht in der Turmmitte; die Sim-Bahn bleibt, der
      // Versatz klingt in den ersten Ticks auf null ab (nur Optik, der Treffer gehoert der Sim)
      const own = this.latest?.towers.find((q) => q.id === p.owner);
      const mz = own ? (own.type === 'wren' ? heroMuzzle(own.heroLevel, own.facing) : towerMuzzle(own.type, own.tiers, own.facing)) : { x: 0, y: 0 };
      v = { spr, key: '', px: cx, py: cy, cx, cy, mx: p.sub === 1 ? 0 : mz.x, my: p.sub === 1 ? 0 : mz.y };
      if (p.kind === 'bomb') { v.shadow = new Sprite(shadowTex(7, 3)); this.shadowC.addChild(v.shadow); }
      this.projs.set(p.id, v);
    } else if (newTick) {
      v.px = v.cx; v.py = v.cy; v.cx = cx; v.cy = cy;
    }
    const gx0 = v.px + (v.cx - v.px) * alpha, gy0 = v.py + (v.cy - v.py) * alpha;
    const fade = Math.max(0, 1 - (p.age + alpha) / 8);
    const gx = gx0 + v.mx * fade, gy = gy0 + v.my * fade;
    let lift = 0;
    if (p.arc) lift = Math.sin((Math.min(10000, p.arc.t) / 10000) * Math.PI) * 26;
    const ang = Math.atan2(-p.vy, p.vx);
    const dir16 = ((Math.round((ang / (Math.PI * 2)) * 16) % 16) + 16) % 16;
    const look = projectileLook(p.kind, this.latest?.towers.find((q) => q.id === p.owner), p.sub);
    const s = projectileSprite(look, p.kind === 'bomb' ? Math.floor(this.now / 70) & 15 : dir16);
    v.spr.texture = tex(s.canvas);
    v.spr.position.set(Math.round(gx) - s.ax, Math.round(gy - lift) - s.ay);
    v.spr.zIndex = 0;
    if (v.shadow) v.shadow.position.set(Math.round(gx) - 4, Math.round(gy) - 2);
    v.spr.zIndex = 100000;
  }

  /** Fragt die Sim, ob eine Market-Aura auf einen Turm wirkt (Faehnchen am Turm). */
  setAuraProbe(fn: (id: number) => TowerAura): void {
    this.auraProbe = fn;
    this.auraOf.clear();
  }

  /** Muenzen fliegen von (x,y) zur Geldanzeige; `done` wird gerufen, wenn die erste landet (fuer Puls und Ton). */
  coinsToCash(x: number, y: number, amount: number, done?: () => void): void {
    const n = coinCount(amount);
    const FLIGHT = 34;
    const to = this.cashTarget;
    let landed = false;
    this.fx.custom(FLIGHT + coinDelay(n) + 2, (node) => {
      const coins = Array.from({ length: n }, (_, k) => { const sp = new Sprite(); node.addChild(sp); return { sp, k }; });
      return (age) => {
        for (const c of coins) {
          const t = (age - coinDelay(c.k)) / FLIGHT;
          c.sp.visible = t > 0 && t < 1;
          if (!c.sp.visible) continue;
          const p = coinPath({ x, y }, to, t, c.k, n);
          const s = coinSprite(Math.floor((age + c.k * 3) / 4));
          c.sp.texture = tex(s.canvas);
          c.sp.position.set(Math.round(p.x) - s.ax, Math.round(p.y) - s.ay);
          if (t > 0.9 && !landed) { landed = true; done?.(); }
        }
      };
    });
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

  /** Freischalten am gewaehlten Turm (Runde 11c): goldener Ring, Funken, "UNLOCKED". */
  unlockFx(towerId: number): void {
    const t = this.latest?.towers.find((q) => q.id === towerId);
    if (!t) return;
    const m = (v: number): number => v / 1000;
    this.fx.ring(m(t.x), m(t.y), 3, 24, C.amber, 16);
    this.fx.burst(m(t.x), m(t.y) - 12, [C.amber, C.yellow, C.white], 14, 1.6, 2, -0.02, 26);
    this.fx.float(m(t.x), m(t.y) - 38, 'UNLOCKED', C.yellow, 44, 0.3);
  }

  handle(ev: SimEvent): void {
    const fx = this.fx;
    const m = (v: number): number => v / 1000;
    switch (ev.type) {
      case 'fire': {
        const t = this.latest?.towers.find((q) => q.id === ev.tower);
        if (t) {
          const mz = t.type === 'wren' ? heroMuzzle(t.heroLevel, t.facing) : towerMuzzle(t.type, t.tiers, t.facing);
          const col = t.type === 'bombardier' ? [C.orange, C.stone, C.yellow] : t.type === 'frostcaller' ? [C.ice, C.white] : t.type === 'wren' ? [C.yellow, C.amber] : t.type === 'longshot' ? [C.yellow, C.white] : [C.sand, C.white];
          fx.burst(m(t.x) + mz.x, m(t.y) + mz.y, col, 3, 0.9, 1, 0.02, 8);
          if (t.type === 'longshot') {
            // Muendungsblitz: heller Ring plus Funken in Blickrichtung, dazu Rueckstoss am Sprite
            const top = Math.max(t.tiers[0], t.tiers[1], t.tiers[2]);
            const a = (t.facing * Math.PI) / 4;
            const gold = t.tiers[0] >= 5;
            fx.ring(m(t.x) + mz.x, m(t.y) + mz.y, 1, 4 + Math.min(top, 5), gold ? C.yellow : C.white, 5);
            fx.burst(m(t.x) + mz.x, m(t.y) + mz.y, gold ? [C.yellow, C.white, C.amber] : [C.yellow, C.white, C.orange], 4 + top, 1.7, 1, 0.01, 7 + top);
            void a;
            const v = this.towers.get(t.id);
            if (v) v.kick = 4;
          }
        }
        break;
      }
      case 'hit': {
        const x = m(ev.x), y = m(ev.y);
        const e = this.enemies.get(ev.enemy);
        if (e) e.flash = this.now + 90;
        fx.burst(x, y - 3, [C.white, C.yellow], 3, 1.1, 1, 0.03, 8);
        if (ev.dmg >= 5) fx.float(x, y - 12, String(ev.dmg), C.white, 26, 0.5);
        break;
      }
      case 'blocked': {
        fx.burst(m(ev.x), m(ev.y) - 3, [C.silver, C.stone], 4, 1.4, 1, 0.05, 10);
        fx.float(m(ev.x), m(ev.y) - 12, ev.reason === 'armor' ? 'TINK' : 'IMMUNE', C.silver, 22, 0.3);
        break;
      }
      case 'pop': {
        const x = m(ev.x), y = m(ev.y);
        fx.pop(x, y - 4, ev.etype);
        if (ev.etype === 'brute' || ev.etype === 'leviathan') fx.burst(x, y - 6, SHARD_COL[ev.etype], 12, 1.8, 2, 0.07, 22);
        if (ev.cash >= 3) fx.float(x, y - 14, `+${ev.cash}`, C.yellow, 30, 0.4);
        break;
      }
      case 'explode': {
        const r = m(ev.radius);
        fx.explosion(m(ev.x), m(ev.y), r, ev.kind);
        if (ev.kind === 'quake') { fx.shake.t = 14; fx.shake.amp = 2; }
        else if (ev.kind === 'star') { fx.shake.t = 8; fx.shake.amp = 1; }
        break;
      }
      case 'nova': fx.nova(m(ev.x), m(ev.y), m(ev.radius)); break;
      case 'ricochet': {
        const pts = ev.points.map(([x, y]) => [m(x), m(y) - 5] as [number, number]);
        if (pts.length >= 2) {
          const frames = [P2.ricochet(pts, 0), P2.ricochet(pts, 1)];
          fx.custom(12, (node) => {
            const sp = new Sprite(); node.addChild(sp);
            return (age) => {
              const f = frames[Math.floor(age / 2) % 2];
              sp.texture = tex(f.canvas);
              sp.position.set(-f.ax, -f.ay);
              sp.alpha = age > 7 ? 1 - (age - 7) / 5 : 1;
            };
          });
          for (const [x, y] of pts.slice(1)) fx.burst(x, y, [C.white, C.yellow], 3, 1.2, 1, 0.03, 8);
        }
        break;
      }
      case 'income': this.incomeFx(ev.tower, ev.amount, ev.cash, ev.bank); break;
      case 'withdraw': {
        const t = this.latest?.towers.find((q) => q.id === ev.tower);
        if (t) {
          const tx = m(t.x), ty = m(t.y);
          fx.anim(tx, ty - 6, 6, (f) => P2.bankChest(f), { per: 4 });
          fx.float(tx, ty - 44, `+${ev.amount}`, C.yellow, 46, 0.35);
          fx.burst(tx, ty - 20, [C.yellow, C.amber, C.white], 8, 1.6, 2, 0.05, 22);
          this.coinsToCash(tx, ty - 22, ev.amount, () => this.onCoinsLanded?.(ev.amount));
        }
        break;
      }
      case 'chain': fx.bolt(ev.points.map(([x, y]) => [m(x), m(y)] as [number, number])); break;
      case 'status': {
        const id = ev.enemy;
        const e = this.enemies.get(id);
        if (!e) break;
        const kind = ev.kind;
        if (kind === 'mark') {
          // das Fadenkreuz haengt in `syncEnemy` am Ziel, solange `markTicks` > 0; hier nur der Einschlag
          const q = this.enemyPos(id);
          if (q) { fx.ring(q.x, q.y - 14, 2, 14, C.red, 10); fx.float(q.x, q.y - 34, 'MARKED', C.coral, 34, 0.3); }
          break;
        }
        const etype = this.latest?.enemies.find((q) => q.id === id)?.type ?? 'red';
        const dur = kind === 'freeze' ? 60 : kind === 'stun' ? 30 : kind === 'burn' ? 36 : kind === 'reveal' ? 20 : 16;
        fx.anim(0, 0, FRAMES.STATUS_FRAMES, (f) => P2.status(kind, f, etype), {
          per: 4, loop: Math.max(1, Math.round(dur / (FRAMES.STATUS_FRAMES * 4))),
          follow: () => { const v = this.enemies.get(id); return v ? { x: v.cx, y: v.cy - (kind === 'freeze' ? 6 : etype === 'leviathan' ? 40 : etype === 'brute' ? 24 : 16) } : null; },
        });
        break;
      }
      case 'leak': {
        fx.shake.t = 10; fx.shake.amp = 2; fx.flash(C.red, 0.3);
        fx.anim(628, 160, 6, (f) => P2.leak(f), { per: 3 });
        fx.float(618, 140, `-${ev.lives}`, C.red, 40, 0.5);
        break;
      }
      case 'place': {
        const t = this.latest?.towers.find((q) => q.id === ev.tower);
        if (t) fx.puff(m(t.x), m(t.y) - 4, null);
        break;
      }
      case 'upgrade': {
        const t = this.latest?.towers.find((q) => q.id === ev.tower);
        const v = this.towers.get(ev.tower);
        const prev = v?.tiers ?? '000';
        const path = ev.tiers.findIndex((x, i) => x > Number(prev[i]));
        if (v) { v.up = 6; v.tiers = ev.tiers.join(''); }
        if (t) {
          fx.puff(m(t.x), m(t.y) - 4, path >= 0 ? path : null);
          fx.ring(m(t.x), m(t.y), 3, 20, C.yellow, 12);
          fx.float(m(t.x), m(t.y) - 38, 'UP!', C.yellow, 30, 0.4);
        }
        break;
      }
      case 'sell': {
        const t = this.latest?.towers.find((q) => q.id === ev.tower);
        if (t) { fx.puff(m(t.x), m(t.y) - 4, null); fx.burst(m(t.x), m(t.y) - 10, [C.amber, C.yellow], 10, 1.4, 2, 0.06, 22); fx.float(m(t.x), m(t.y) - 26, `+${ev.cash}`, C.yellow, 36, 0.4); }
        break;
      }
      case 'heroLevel': {
        const t = this.latest?.towers.find((q) => q.id === ev.tower);
        if (t) { fx.ring(m(t.x), m(t.y), 4, 30, C.yellow, 20); fx.burst(m(t.x), m(t.y) - 16, [C.yellow, C.white, C.amber], 16, 1.8, 2, -0.02, 30); fx.float(m(t.x), m(t.y) - 44, 'LEVEL UP', C.yellow, 50, 0.3); }
        break;
      }
      case 'ability': if (ev.id === 'flare' || ev.id === 'dawnbreak') this.heroCast = this.now + 300; this.abilityFx(ev.id, ev.x, ev.y, ev.cash); break;
      case 'power': this.powerFx(ev.power, ev.x, ev.y); break;
      case 'trap': {
        const v = this.traps.get(ev.id);
        if (v) {
          if (ev.kind === 'caltrops') fx.burst(v.x, v.y - 2, [C.silver, C.stone, C.white], 4, 1.4, 1, 0.06, 12);
          else fx.burst(v.x, v.y - 4, [C.ice, C.white, C.sky], 5, 1.2, 1, 0.03, 16);
        }
        break;
      }
      case 'trapGone': {
        const v = this.traps.get(ev.id);
        if (v) {
          fx.puff(v.x, v.y, null);
          fx.burst(v.x, v.y - 4, ev.kind === 'caltrops' ? [C.silver, C.stone, C.sand] : [C.ice, C.white, C.sky], 10, 1.6, 2, 0.05, 22);
          fx.float(v.x, v.y - 12, ev.reason === 'spent' ? 'SPENT' : 'GONE', ev.kind === 'caltrops' ? C.silver : C.ice, 26, 0.3);
        }
        break;
      }
      case 'roundEnd': if (ev.bonus) fx.float(320, 28, `+${ev.bonus}`, C.yellow, 50, 0.3); break;
      case 'bossStage': {
        const p = this.enemyPos(ev.enemy);
        fx.shake.t = 16; fx.shake.amp = 2; fx.flash(C.white, 0.35);
        if (p) {
          fx.anim(p.x, p.y - 20, FRAMES.PLATE_FRAMES, (f) => P2.bossPlate(f, ev.stage % 2 ? 1 : -1), { per: 3 });
          fx.burst(p.x, p.y - 20, [C.slate, C.stone, C.silver, C.navy], 14, 2.2, 3, 0.08, 28);
        }
        break;
      }
      default: break;
    }
  }

  /** Wird gerufen, wenn Muenzen die Geldanzeige erreichen (Match: Puls und Ton). */
  onCoinsLanded?: (amount: number) => void;

  /** Rundenende: Muenzen steigen vom Market auf; `cash` fliegt zur Geldanzeige, was auf die Bank ging, bleibt als Kontostand stehen. */
  private incomeFx(towerId: number, amount: number, cash: number, bank: number): void {
    const t = this.latest?.towers.find((q) => q.id === towerId);
    if (!t) return;
    const fx = this.fx;
    const tx = t.x / 1000, ty = t.y / 1000;
    fx.anim(tx, ty, FRAMES.COIN_RISE_FRAMES, (f) => P2.coinRise(f), { per: 4 });
    if (cash > 0) {
      fx.float(tx, ty - 46, `+${cash}`, C.yellow, 56, 0.3);
      this.coinsToCash(tx, ty - 24, cash, () => this.onCoinsLanded?.(cash));
    }
    const banked = amount - cash;
    if (banked > 0 || bank > 0) {
      fx.anim(tx + 14, ty - 2, 6, (f) => P2.bankChest(Math.min(5, f === 0 ? 0 : f)), { per: 3 });
      fx.float(tx, ty - (cash > 0 ? 58 : 46), `BANK ${bank}`, C.ice, 56, 0.25);
    }
  }

  /** Effekte der Powers (Runde 12). Bombe: die Sim sendet zusaetzlich `explode`, hier kommen nur Ring und Wackeln dazu. */
  private powerFx(key: PowerKey, x?: number, y?: number): void {
    const fx = this.fx;
    const m = (v: number): number => v / 1000;
    const px = x === undefined ? 320 : m(x), py = y === undefined ? 180 : m(y);
    switch (key) {
      case 'goldDrop': {
        fx.flash(C.yellow, 0.14);
        fx.float(320, 60, '+500', C.yellow, 70, 0.25);
        fx.custom(80, (node) => {
          const coins = Array.from({ length: 34 }, (_, i) => {
            const sp = new Sprite(); node.addChild(sp);
            return { sp, x: 20 + R() * 600, y: -8 - R() * 90, vy: 2.2 + R() * 2.4, ph: i * 3 };
          });
          return (age) => {
            for (const c of coins) {
              const yy = c.y + c.vy * age;
              const s = coinSprite(Math.floor((age + c.ph) / 4));
              c.sp.texture = tex(s.canvas);
              c.sp.position.set(Math.round(c.x) - s.ax, Math.round(yy) - s.ay);
              c.sp.visible = yy < 366;
            }
          };
        });
        break;
      }
      case 'lanternBomb':
        fx.ring(px, py, 4, 40, C.orange, 12);
        fx.ring(px, py, 2, 26, C.yellow, 9);
        fx.shake.t = 10; fx.shake.amp = 1;
        break;
      case 'caltrops': case 'frostTrap':
        fx.puff(px, py, null);
        fx.ring(px, py, 3, 14, key === 'caltrops' ? C.silver : C.ice, 10);
        break;
      case 'timeWarp': {
        fx.flash(C.sky, 0.22);
        fx.float(320, 52, 'TIME WARP', C.ice, 70, 0.15);
        fx.custom(38, (node) => {
          const sp = new Sprite(); node.addChild(sp);
          const sp2 = new Sprite(); node.addChild(sp2);
          return (age) => {
            const r = 12 + age * 5;
            const a = bubbleSprite(Math.floor(age / 4), Math.min(190, r)), b = bubbleSprite(Math.floor(age / 4) + 2, Math.min(190, Math.max(8, r - 34)));
            sp.texture = tex(a.canvas); sp.position.set(320 - a.ax, 180 - a.ay);
            sp2.texture = tex(b.canvas); sp2.position.set(320 - b.ax, 180 - b.ay);
            sp.alpha = Math.max(0, 1 - age / 38); sp2.alpha = sp.alpha;
          };
        });
        break;
      }
      case 'lanternOil':
        fx.flash(C.yellow, 0.12);
        fx.float(86, 34, 'OIL +25%', C.amber, 70, 0.2);
        fx.burst(44, 26, [C.amber, C.yellow, C.orange], 14, 1.2, 2, 0.05, 30);
        break;
      case 'extraLives':
        fx.flash(C.red, 0.1);
        fx.float(70, 34, '+25', C.coral, 70, 0.25);
        fx.custom(70, (node) => {
          const hs = Array.from({ length: 8 }, (_, i) => { const sp = new Sprite(); node.addChild(sp); return { sp, x: 60 + i * 74 + R() * 20, y: 380 + R() * 40, d: i * 3 }; });
          return (age) => {
            const hs0 = bigHeart();
            for (const hh of hs) {
              const a = Math.max(0, age - hh.d);
              hh.sp.texture = tex(hs0.canvas);
              hh.sp.position.set(Math.round(hh.x + Math.sin(a / 6 + hh.d) * 4) - hs0.ax, Math.round(hh.y - a * 4.2) - hs0.ay);
              hh.sp.visible = a > 0;
            }
          };
        });
        break;
      case 'heroBoost': {
        const t = this.latest?.towers.find((q) => q.type === 'wren');
        if (t) {
          this.heroCast = this.now + 300;
          fx.ring(m(t.x), m(t.y), 4, 40, C.leaf, 22);
          fx.ring(m(t.x), m(t.y), 2, 24, C.yellow, 16);
          fx.burst(m(t.x), m(t.y) - 16, [C.leaf, C.yellow, C.white], 22, 2, 2, -0.03, 34);
          fx.float(m(t.x), m(t.y) - 52, 'HERO BOOST', C.leaf, 60, 0.3);
        }
        break;
      }
      default: // Insta-Warden: Landung mit goldenem Ring
        fx.ring(px, py, 3, 30, C.amber, 16);
        fx.burst(px, py - 6, [C.amber, C.yellow, C.white], 18, 1.8, 2, 0.04, 28);
        fx.float(px, py - 44, 'INSTA-WARDEN', C.yellow, 54, 0.3);
        fx.shake.t = 8; fx.shake.amp = 1;
    }
  }

  /** Eine Aktion in n Ticks (laeuft ueber die Effektschicht, haelt also mit Pause und Tempo Schritt). */
  private after(ticks: number, fn: () => void): void {
    let done = false;
    this.fx.custom(ticks + 1, () => (age) => { if (!done && age >= ticks) { done = true; fn(); } });
  }

  private abilityFx(id: string, x?: number, y?: number, cash?: number): void {
    const fx = this.fx;
    if (id === 'arrowRain') {
      fx.flash(C.leaf, 0.1);
      // um jeden Ranger faellt Pfeilregen, solange die Sim den Regen laufen laesst
      for (const t of this.latest?.towers ?? []) {
        if (t.type !== 'ranger') continue;
        fx.anim(t.x / 1000, t.y / 1000, 6, (f) => P2.arrowRain(f, Math.round(t.range / 1000)), { per: 3, loop: 40 });
      }
    } else if (id === 'absoluteZero') {
      fx.flash(C.white, 0.6);
      fx.anim(0, 0, FRAMES.ZERO_FRAMES, (f) => P2.absoluteZero(f), { per: 4, loop: 1 });
      fx.anim(0, 0, 1, () => P2.absoluteZero(7), { per: 1, loop: 1 });
    } else if (id === 'flare') {
      fx.flash(C.yellow, 0.35);
      if (x !== undefined && y !== undefined) fx.anim(x / 1000, y / 1000, FRAMES.FLARE_FRAMES, (f) => P2.flare(f, 40), { per: 4 });
    } else if (id === 'focus') {
      // goldener Doppelring um jeden Longshot, solange der Fokus laeuft (8 s = 480 Ticks)
      fx.flash(C.amber, 0.12);
      for (const t of this.latest?.towers ?? []) {
        if (t.type !== 'longshot') continue;
        fx.anim(t.x / 1000, t.y / 1000 - 10, FRAMES.FOCUS_FRAMES, (f) => P2.focus(f), { per: 4, loop: 30 });
      }
    } else if (id === 'supplyDrop') {
      // Kiste faellt am Fallschirm neben den ausloesenden Longshot, springt auf, Gold fliegt zur Anzeige
      const bx = x !== undefined ? x / 1000 + 26 : 320, by = y !== undefined ? y / 1000 + 12 : 180;
      fx.anim(bx, by, FRAMES.DROP_FRAMES, (f) => P2.supplyDrop(f), { per: 5 });
      this.after(36, () => {
        if (cash) { fx.float(bx, by - 30, `+${cash}`, C.yellow, 60, 0.3); this.coinsToCash(bx, by - 10, cash, () => this.onCoinsLanded?.(cash)); }
        fx.burst(bx, by - 8, [C.yellow, C.amber, C.white], 10, 1.7, 2, 0.05, 24);
      });
    } else if (id === 'grant') {
      // Siegel-Blitz, Muenzfontaene und Goldregen ueber der Karte
      fx.flash(C.yellow, 0.25);
      const gx = x !== undefined ? x / 1000 : 320, gy = y !== undefined ? y / 1000 : 180;
      fx.anim(gx, gy - 14, FRAMES.GRANT_FRAMES, (f) => P2.grant(f), { per: 4 });
      if (cash) {
        fx.float(gx, gy - 52, `+${cash}`, C.yellow, 70, 0.3);
        this.coinsToCash(gx, gy - 24, cash, () => this.onCoinsLanded?.(cash));
      }
      fx.custom(70, (node) => {
        const coins = Array.from({ length: 26 }, (_, i) => { const sp = new Sprite(); node.addChild(sp); return { sp, x: 20 + R() * 600, y: -8 - R() * 70, vy: 2 + R() * 2.2, ph: i * 3 }; });
        return (age) => {
          for (const c of coins) {
            const yy = c.y + c.vy * age;
            const sp = coinSprite(Math.floor((age + c.ph) / 4));
            c.sp.texture = tex(sp.canvas);
            c.sp.position.set(Math.round(c.x) - sp.ax, Math.round(yy) - sp.ay);
            c.sp.visible = yy < 366;
          }
        };
      });
    } else if (id === 'dawnbreak') {
      fx.flash(C.yellow, 0.55);
      for (let i = 1; i < PATH.length; i++) {
        const [ax, ay] = PATH[i - 1], [bx, by] = PATH[i];
        const vert = ax === bx;
        const len = Math.abs(vert ? by - ay : bx - ax);
        const sx = Math.min(ax, bx), sy = Math.min(ay, by);
        fx.anim(sx, sy, FRAMES.BEAM_FRAMES, (f) => P2.dawnBeam(len, f, vert), { per: 3, loop: 4 });
      }
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

