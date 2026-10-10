/**
 * Renderer (Pixi v8, Runde 11 / P3): Spielfeld als 640 x 360-Textur, scharf hochskaliert (CSS image-rendering: pixelated).
 * Ebenen: Karte (Boden, Wasser, Deko) -> Schatten -> Welt (Props, Tuerme, Gegner nach y sortiert) -> Projektile -> Effekte
 * -> Licht -> Oberflaeche (Geist, Reichweite). Animationen kommen aus Sim-Events, Positionen aus dem Zustand (zwischen zwei
 * Ticks interpoliert). Der Renderer schreibt nie in die Sim.
 */
import { Application, Container, Sprite, Texture } from 'pixi.js';
import { Buf, C, NAME_OF, bayer, rng } from '../pixel/map/buf';
import { meadowArt } from '../pixel/map/compose';
import { mapArt, type MapId } from '../pixel/map/maps';
import { ambientPoints } from '../pixel/map/ambient';
import { flagFrame, MILL_STEPS, windmillBlades } from '../pixel/map/paint';
import { PAL } from '../pixel/palette';
import { type EnemyState, type EnemyType, type GameState, type ProjectileState, type PuddleState, type SimEvent, type TowerAura, type TowerBuff, type TowerState, type WallState } from '../sim';
import { glowKind, monsterScale, wallWear, zoneView, type GlowKind } from './r14';
import { rangeView, coinCount, coinDelay, coinPath, hasAura, isMarked, projectileLook, type RangeView } from './r13';
import { FxLayer, FRAMES } from './fx';
import { footMilli, isHero } from './info';
import { TRAP_W, monsterSprite, bigHeart, bombLantern, bubbleSprite, coinSprite, trapSprite, discSprite, enemySprite, fx as P2, heroSprite, projectileSprite, ringSprite, shadowSprite, heroMuzzle, towerMuzzle, towerSprite, type HeroFrame, type Spr, type TowerFrame } from './sprites';
import { tex } from './textures';
import { ENEMY_LOOK, spriteStage } from './enemy-info';
import { mapGeometry, type MapGeometry } from './map-info';
import { TRAP_CHARGES, trapPieces } from '../powers/info';
import { TinkerFx } from './r16-tinker';
import { BellFx, bellFrameOf } from './r16-bell';
import type { PowerKey, TrapState } from '../sim';

export const VIEW_W = 640;
export const VIEW_H = 360;
const hex = (c: number): number => parseInt(PAL[NAME_OF(c)].slice(1), 16);
const R = rng(77);

const SHARD_COL: Partial<Record<EnemyType, number[]>> = {
  red: [C.red, C.crimson, C.coral], blue: [C.sky, C.navy, C.ice], green: [C.leaf, C.grass, C.yellow], gold: [C.amber, C.yellow, C.orange],
  ironshell: [C.stone, C.silver, C.slate], ember: [C.orange, C.yellow, C.red], brute: [C.slate, C.dusk, C.stone], leviathan: [C.navy, C.stone, C.sky],
  pink: [C.orchid, C.coral, C.peach], frostling: [C.plum, C.violet, C.ice], crystal: [C.navy, C.sky, C.ice], gloomship: [C.night, C.violet, C.orchid], cruiser: [C.night, C.violet, C.slate], duskrunner: [C.ink, C.night, C.violet], dreadnought: [C.ink, C.night, C.violet, C.slate],
  wyrm: [C.ice, C.white, C.sky, C.navy], colossus: [C.red, C.orange, C.yellow, C.slate],
};
/** Gegner, die beim Platzen groessere Scherben werfen */
const BIG_SHARDS = new Set<EnemyType>(['brute', 'leviathan', 'crystal', 'gloomship', 'wyrm', 'colossus', 'cruiser', 'dreadnought']);
/** Schiffe (Blimps ohne Bodenkontakt): eigener Bodenschatten, Absturz beim Platzen */
const SHIPS = new Set<EnemyType>(['gloomship', 'cruiser', 'duskrunner', 'dreadnought']);

interface TowerView { ice?: Sprite; spr: Sprite; shadow: Sprite; key: string; drop: number; up: number; tiers: string; kick: number; flag?: Sprite; zone?: Sprite; glow?: Sprite; mon: boolean; hide: number }
interface EnemyView { trail?: Sprite; vine?: Sprite; vol?: Sprite; bub?: Sprite; mark?: Sprite; spr: Sprite; shadow: Sprite; key: string; px: number; py: number; cx: number; cy: number; flash: number; flip: boolean; bar?: Sprite; barBg?: Sprite }
interface WallView { spr: Sprite; x: number; y: number; hide: number }
interface PuddleView { spr: Sprite; x: number; y: number; r: number }
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
  /** Runde 16 TP: Sentries/Fallen/Overclock des Tinkers und Alarm des Bellringers (eigene Dateien) */
  private r16t = new TinkerFx(this.worldC, this.shadowC, () => this.fx, () => this.latest?.towers ?? []);
  private r16b = new BellFx(this.projC, () => this.fx, () => this.latest?.towers ?? []);
  private walls = new Map<number, WallView>();
  private puddles = new Map<number, PuddleView>();
  private buffProbe: ((id: number) => TowerBuff) | null = null;
  private glowOf = new Map<number, GlowKind | null>();
  private aimSpr = new Sprite();
  private aimOn = false;
  private warpSpr = new Sprite(Texture.WHITE);
  private lastTick = -1;
  private flashSpr!: Sprite;
  private mill!: Sprite;
  private flagSprs: Sprite[] = [];
  private lampGlows: { s: Sprite; base: number; ph: number; pulse: boolean }[] = [];
  /** Luftteilchen (Schnee, Funken, Dunst) als Sprite-Pool ueber allem */
  private ambC = new Container();
  private ambPool: Sprite[] = [];
  private geo: MapGeometry;
  private art: ReturnType<typeof mapArt>;
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

  constructor(readonly mapId: MapId = 'meadow') {
    this.geo = mapGeometry(mapId);
    this.art = mapArt(mapId);
  }

  async init(host: HTMLElement): Promise<void> {
    this.app = new Application();
    await this.app.init({ width: VIEW_W, height: VIEW_H, antialias: false, resolution: 1, backgroundColor: hex(C.ink), autoStart: false, roundPixels: true, preference: 'webgl' });
    this.canvasEl = this.app.canvas;
    this.canvasEl.className = 'm-canvas';
    host.prepend(this.canvasEl);
    const st = this.app.stage;
    st.addChild(this.mapC, this.trapC, this.shadowC, this.worldC, this.projC, this.fxHost, this.lightC, this.ambC, this.uiC);
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
    const art = this.art;
    const meadow = this.mapId === 'meadow' ? meadowArt() : null;
    const ground = new Sprite(tex(art.ground.toCanvas()));
    this.mapC.addChild(ground);
    this.waterFrames = art.anim.map((w) => tex(w.toCanvas()));
    this.waterSpr.texture = this.waterFrames[0];
    this.mapC.addChild(this.waterSpr);
    this.mapC.addChild(new Sprite(tex(art.deco.toCanvas())));
    for (const { prop, art: pa } of art.props) {
      const s = new Sprite(tex(pa.buf.toCanvas()));
      s.position.set(prop.x - pa.ax, prop.y - pa.ay);
      s.zIndex = prop.y;
      this.worldC.addChild(s);
    }
    // Windmuehle und Fahnen gibt es nur auf der Wiese
    this.millFrames = Array.from({ length: MILL_STEPS }, (_, i) => tex(windmillBlades(i).toCanvas()));
    this.mill = new Sprite(this.millFrames[0]);
    this.flagFrames = Array.from({ length: 4 }, (_, i) => tex(flagFrame(i).toCanvas()));
    if (meadow) {
      this.mill.position.set(meadow.mill.x - 30, meadow.mill.y - 30);
      this.mill.zIndex = meadow.mill.y + 40;
      this.worldC.addChild(this.mill);
      for (const f of meadow.flags) {
        const s = new Sprite(this.flagFrames[0]);
        s.position.set(f.x + 1, f.y - 1);
        s.zIndex = f.y + 60;
        this.worldC.addChild(s);
        this.flagSprs.push(s);
      }
    }
    for (const sm of art.smoke) {
      const parts = Array.from({ length: 3 }, () => {
        const p = new Sprite(Texture.WHITE);
        p.width = p.height = 2; p.tint = hex(this.mapId === 'quarry' ? C.stone : C.silver);
        this.fxHost.addChild(p);
        return p;
      });
      this.smokes.push({ parts, x: sm.x, y: sm.y });
    }
    for (const l of art.lights) {
      const col = l.col ? C[l.col] : l.warm ? C.yellow : C.ice;
      const g = new Sprite(tex(glowCanvas(l.r, col)));
      g.anchor.set(0.5); g.position.set(l.x, l.y);
      g.alpha = l.warm ? 0.32 : 0.28;
      this.lightC.addChild(g);
      this.lampGlows.push({ s: g, base: g.alpha, ph: R() * 6, pulse: l.flicker === 'pulse' });
    }
    if (!meadow) return;
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
    this.r16t.clear(); this.r16b.clear();
    for (const v of this.walls.values()) v.spr.destroy();
    this.walls.clear();
    for (const v of this.puddles.values()) v.spr.destroy();
    this.puddles.clear();
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
    for (const [id, v] of this.towers) if (!seenT.has(id)) { v.spr.destroy(); v.shadow.destroy(); v.ice?.destroy(); v.flag?.destroy(); v.zone?.destroy(); v.glow?.destroy(); this.towers.delete(id); this.auraOf.delete(id); this.glowOf.delete(id); }
    if (this.auraProbe && (newTick && state.tick % 12 === 0 || this.auraOf.size !== state.towers.length)) {
      for (const t of state.towers) this.auraOf.set(t.id, t.type !== 'market' && t.type !== 'bellringer' && hasAura(this.auraProbe(t.id)));
    }
    if (this.buffProbe && (newTick && state.tick % 10 === 0 || this.glowOf.size !== state.towers.length)) {
      for (const t of state.towers) this.glowOf.set(t.id, isHero(t.type) || t.type === 'market' || t.type === 'bellringer' ? null : glowKind(this.buffProbe(t.id)));
    }

    const seenE = new Set<number>();
    for (const e of state.enemies) { seenE.add(e.id); this.syncEnemy(e, newTick, alpha); }
    for (const [id, v] of this.enemies) if (!seenE.has(id)) { v.spr.destroy(); v.shadow.destroy(); v.bar?.destroy(); v.barBg?.destroy(); v.bub?.destroy(); v.mark?.destroy(); v.vine?.destroy(); v.vol?.destroy(); v.trail?.destroy(); this.enemies.delete(id); }

    const seenP = new Set<number>();
    for (const p of state.projectiles) { seenP.add(p.id); this.syncProj(p, newTick, alpha); }
    for (const [id, v] of this.projs) if (!seenP.has(id)) { v.spr.destroy(); v.shadow?.destroy(); this.projs.delete(id); }

    this.r16t.sync(state, this.now, state.tick);
    this.r16b.sync(state, this.now);
    // Fallen auf dem Weg: Zacken/Kristalle nehmen mit den Ladungen ab
    const seenTr = new Set<number>();
    for (const tr of state.traps) { seenTr.add(tr.id); this.syncTrap(tr); }
    for (const [id, v] of this.traps) if (!seenTr.has(id)) { v.spr.destroy(); this.traps.delete(id); }
    // Runde 14: Baumwaende und Saeurepfuetzen auf dem Weg
    const seenW = new Set<number>();
    for (const w of state.walls) { seenW.add(w.id); this.syncWall(w); }
    for (const [id, v] of this.walls) if (!seenW.has(id)) { v.spr.destroy(); this.walls.delete(id); }
    const seenPu = new Set<number>();
    for (const pu of state.puddles) { seenPu.add(pu.id); this.syncPuddle(pu); }
    for (const [id, v] of this.puddles) if (!seenPu.has(id)) { v.spr.destroy(); this.puddles.delete(id); }
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
    const pieces = trapPieces(t.charges, this.r16t.trapMax(t.id) ?? TRAP_CHARGES[t.kind], slots);
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

  private syncWall(w: WallState): void {
    let v = this.walls.get(w.id);
    if (!v) {
      const spr = new Sprite();
      this.worldC.addChild(spr);
      v = { spr, x: w.x / 1000, y: w.y / 1000, hide: this.now + 6 * 3 * 16.7 };
      this.walls.set(w.id, v);
    }
    const sp = P2.treeWall(wallWear(w.left), Math.floor(this.now / 220));
    v.spr.texture = tex(sp.canvas);
    v.spr.position.set(Math.round(v.x) - sp.ax, Math.round(v.y) - sp.ay);
    v.spr.zIndex = Math.round(v.y);
    v.spr.visible = this.now >= v.hide;
    // kurz vor Ablauf flackert die ungenutzte Wand
    v.spr.alpha = w.ttl < 120 && (Math.floor(this.now / 120) & 1) ? 0.6 : 1;
  }

  private syncPuddle(p: PuddleState): void {
    let v = this.puddles.get(p.id);
    const r = Math.max(8, Math.round(p.radius / 1000));
    if (!v) {
      const spr = new Sprite();
      this.trapC.addChild(spr);
      v = { spr, x: p.x / 1000, y: p.y / 1000, r };
      this.puddles.set(p.id, v);
    }
    const sp = P2.acidPool(r, Math.floor(this.now / 240));
    v.spr.texture = tex(sp.canvas);
    v.spr.position.set(Math.round(v.x) - sp.ax, Math.round(v.y) - sp.ay);
    v.spr.alpha = 0.55 + 0.45 * Math.min(1, p.charges / 20);
  }

  private animateMap(): void {
    const t = this.now;
    this.waterSpr.texture = this.waterFrames[Math.floor(t / this.art.animMs) % this.waterFrames.length];
    if (this.mapId === 'meadow') this.mill.texture = this.millFrames[Math.floor(t / 260) % MILL_STEPS];
    const ff = this.flagFrames[Math.floor(t / 150) % 4];
    for (const f of this.flagSprs) f.texture = ff;
    for (const g of this.lampGlows) g.s.alpha = g.pulse ? g.base * (0.7 + 0.3 * Math.sin(t / 420 + g.ph)) : g.base * (0.82 + 0.18 * Math.sin(t / 130 + g.ph) * Math.sin(t / 47 + g.ph * 2));
    this.animateAmbient(t);
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

  /** Schnee, Funken und Dunst: Teilchen aus `ambientPoints` (rein rechnerisch) auf einen Sprite-Pool legen. */
  private animateAmbient(t: number): void {
    if (this.mapId === 'meadow') return;
    const pts = ambientPoints(this.mapId, t);
    for (let i = 0; i < pts.length; i++) {
      let s = this.ambPool[i];
      if (!s) { s = new Sprite(Texture.WHITE); this.ambPool.push(s); this.ambC.addChild(s); }
      const p = pts[i];
      s.visible = true;
      s.tint = hex(p.c);
      s.width = p.w; s.height = p.h ?? p.w;
      s.alpha = p.kind === 'haze' ? Math.min(0.22, p.a * 2.8) : p.a;
      s.position.set(p.x, p.y);
    }
    for (let i = pts.length; i < this.ambPool.length; i++) this.ambPool[i].visible = false;
  }

  private towerSpr(t: TowerState): Spr {
    const atk = t.attackTick;
    const frame = (atk > 0 ? (atk < 4 ? 'atk0' : atk < 6 ? 'atk1' : atk < 11 ? 'atk2' : 'atk3') : `idle${(Math.floor(this.now / 166) + t.id) & 3}`) as TowerFrame;
    if (isHero(t.type)) {
      // Runde 16: Bram und Sela zeichnen vorerst wie Wren (Platzhalter bis Paket TP)
      if (this.now < this.heroCast) return heroSprite(t.heroLevel, t.facing, this.heroCast - this.now > 150 ? 'cast0' : 'cast1');
      return heroSprite(t.heroLevel, t.facing, frame as HeroFrame);
    }
    if (t.type === 'bellringer') return towerSprite(t.type, t.tiers, 0, bellFrameOf(t.id, this.now, this.r16b.alarmUntil));
    if (t.monsterTicks > 0) return monsterSprite(t.facing, frame, monsterScale(t.type));
    return towerSprite(t.type, t.tiers, t.facing, frame);
  }

  private syncTower(t: TowerState): void {
    let v = this.towers.get(t.id);
    const x = Math.round(t.x / 1000), y = Math.round(t.y / 1000);
    if (!v) {
      const shadow = new Sprite(shadowTex(16, 5));
      this.shadowC.addChild(shadow);
      const spr = new Sprite();
      this.worldC.addChild(spr);
      v = { spr, shadow, key: '', drop: 8, up: 0, tiers: t.tiers.join(''), kick: 0, mon: false, hide: 0 };
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
    const monster = t.monsterTicks > 0;
    if (v.mon && !monster) { this.fx.puff(x, y - 6, null); this.fx.burst(x, y - 14, [C.leaf, C.grass, C.stone], 8, 1.4, 2, 0.04, 18); }
    v.mon = monster;
    v.spr.visible = this.now >= v.hide;
    // Frost Wyrm: Eisblock ueber dem eingefrorenen Turm (die Sim fuehrt `frozen`), flackert kurz vor dem Auftauen
    if (t.frozen > 0) {
      if (!v.ice) { v.ice = new Sprite(); this.worldC.addChild(v.ice); }
      const is = P2.towerFrozen(Math.floor(this.now / 160));
      v.ice.texture = tex(is.canvas);
      v.ice.position.set(x - is.ax, y - is.ay);
      v.ice.zIndex = y + 2;
      v.ice.alpha = t.frozen < 30 && (Math.floor(this.now / 90) & 1) ? 0.45 : 1;
    } else if (v.ice) { v.ice.destroy(); v.ice = undefined; }
    const sw = monster ? (t.type === 'alchemist' ? 34 : 20) : t.type === 'market' || t.type === 'bellringer' ? 18 + top * 2 : 16;
    v.shadow.texture = shadowTex(sw, 5);
    v.shadow.position.set(x - sw / 2 - 1, y - 3);
    // Ranken-Zone (Thornweaver B4/B5) dauerhaft unter dem Turm
    const zv = zoneView(t);
    if (zv) {
      if (!v.zone) { v.zone = new Sprite(); this.trapC.addChild(v.zone); }
      const zs = zv.world ? P2.worldTreeZone(zv.r, Math.floor(this.now / 200)) : P2.thornZone(zv.r, Math.floor(this.now / 200));
      v.zone.texture = tex(zs.canvas);
      v.zone.position.set(x - zs.ax, y - zs.ay);
      v.zone.alpha = 0.9;
    } else if (v.zone) { v.zone.destroy(); v.zone = undefined; }
    // Buff-Glanz (Trank des Alchemisten)
    const gk = this.glowOf.get(t.id) ?? null;
    if (gk && !monster) {
      if (!v.glow) { v.glow = new Sprite(); this.worldC.addChild(v.glow); }
      const gs = P2.buffGlow(Math.floor(this.now / 130), gk);
      v.glow.texture = tex(gs.canvas);
      v.glow.position.set(x - gs.ax, y - gs.ay);
      v.glow.zIndex = y + 1;
      v.glow.alpha = 0.8;
    } else if (v.glow) { v.glow.destroy(); v.glow = undefined; }
    // Faehnchen: Turm steht in einer Market-Aura
    const inAura = this.auraOf.get(t.id) === true;
    if (inAura) {
      if (!v.flag) { v.flag = new Sprite(); this.worldC.addChild(v.flag); }
      v.flag.texture = tex(PENNANTS[Math.floor(this.now / 220) & 1]);
      v.flag.position.set(x + (footMilli(t.type) / 1000) - 1, y - 12 - (monster ? 14 : 0));
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
    const look = ENEMY_LOOK[e.type];
    const fr = (Math.floor(this.now / (e.type === 'gold' || e.type === 'pink' ? 110 : look.top > 45 ? 220 : 170)) + e.id) & 3;
    const camo = e.camo && !e.revealed;
    const s = enemySprite(e.type, fr, { camo: e.camo, damageStage: spriteStage(e), hitFlash, flip: v.flip, regrow: e.regrowTo !== null, fortified: e.fortified });
    v.spr.texture = tex(s.canvas);
    // Grosse Gegner am Kartenrand (Frostfen oberer Ast y=40) nicht oben abschneiden: Oberkante mind. 2 px im Bild (10.10.2026)
    v.spr.position.set(x - s.ax, Math.max(2, y - s.ay + (e.type === 'leviathan' ? Math.round(Math.sin(this.now / 400) * 2) - 8 : 0)));
    v.spr.zIndex = y + look.lift;
    v.spr.alpha = camo ? 0.55 + 0.2 * Math.sin(this.now / 90 + e.id) : 1;
    v.spr.tint = e.frozenTicks > 0 ? hex(C.ice) : e.vineTicks > 0 ? 0xffffff : e.stunTicks > 0 ? hex(C.yellow) : e.goldTicks > 0 ? hex(C.sand) : e.hasteTicks > 0 ? hex(C.peach) : e.slowBp > 0 && e.slowTicks > 0 ? hex(C.silver) : 0xffffff;
    if (this.latest && this.latest.warpLeft > 0) {
      if (!v.bub) { v.bub = new Sprite(); this.fxHost.addChild(v.bub); }
      const bs = bubbleSprite(Math.floor(this.now / 200) + e.id, Math.max(8, Math.round(look.top / 2.1)));
      v.bub.texture = tex(bs.canvas);
      v.bub.position.set(x - bs.ax, y - bs.ay - Math.round(look.top * 0.3));
      v.bub.alpha = 0.9;
    } else if (v.bub) { v.bub.destroy(); v.bub = undefined; }
    // Duskrunner: Tempo-Streifen unter dem Schiff (Runde 15e)
    if (e.type === 'duskrunner') {
      if (!v.trail) { v.trail = new Sprite(); this.worldC.addChild(v.trail); }
      const ts = P2.duskTrail(Math.floor(this.now / 90), v.flip);
      v.trail.texture = tex(ts.canvas);
      v.trail.position.set(x - ts.ax, y - ts.ay);
      v.trail.zIndex = y + look.lift - 1;
    }
    // Ranken-Fessel (Vine Snare): Ranken um die Fuesse, solange die Sim den Gegner festhaelt
    if (e.vineTicks > 0) {
      if (!v.vine) { v.vine = new Sprite(); this.worldC.addChild(v.vine); }
      const vs = P2.vineSnare(Math.floor(this.now / 160));
      v.vine.texture = tex(vs.canvas);
      v.vine.position.set(x - vs.ax, y - vs.ay);
      v.vine.zIndex = y + 1;
      v.vine.alpha = e.vineTicks < 20 && (Math.floor(this.now / 80) & 1) ? 0.5 : 1;
    } else if (v.vine) { v.vine.destroy(); v.vine = undefined; }
    // Unstable Concoction: gruene Markierung, solange der Gegner beim Tod explodieren wuerde
    if (e.volatile > 0) {
      if (!v.vol) { v.vol = new Sprite(); this.fxHost.addChild(v.vol); }
      const as = P2.acidMark(Math.floor(this.now / 130));
      v.vol.texture = tex(as.canvas);
      v.vol.position.set(x - as.ax, y - as.ay - look.top);
    } else if (v.vol) { v.vol.destroy(); v.vol = undefined; }
    // Crippling Shot: rotes Fadenkreuz ueber dem Ziel, solange die Sim die Markierung fuehrt
    if (isMarked(e)) {
      if (!v.mark) { v.mark = new Sprite(); this.fxHost.addChild(v.mark); }
      const ms = P2.bossMark(Math.floor(this.now / 110));
      v.mark.texture = tex(ms.canvas);
      v.mark.position.set(x - ms.ax, y - ms.ay - look.top - 6);
      v.mark.alpha = e.markTicks < 30 && (Math.floor(this.now / 90) & 1) ? 0.4 : 1;
    } else if (v.mark) { v.mark.destroy(); v.mark = undefined; }
    // Schatten: Gloomship schwebt, sein Schatten liegt am Boden unter dem Anker (eigener Sprite, 35 % Alpha eingebaut)
    if (SHIPS.has(e.type)) {
      const gs = P2.shipShadow(e.type as 'gloomship' | 'cruiser' | 'duskrunner' | 'dreadnought', Math.floor(this.now / 200));
      v.shadow.texture = tex(gs.canvas);
      v.shadow.alpha = 1;
      v.shadow.position.set(x - gs.ax, y - gs.ay);
    } else {
      const [sw, sh] = look.shadow;
      v.shadow.texture = shadowTex(sw, sh);
      v.shadow.alpha = e.type === 'leviathan' ? 0.8 : 1;
      v.shadow.position.set(x - sw / 2 - 1, y - sh / 2 - 1 + (e.type === 'leviathan' ? 8 : 0));
    }
    if (look.bar > 0 && (look.barAlways || e.hp < e.maxHp)) {
      if (!v.bar) {
        v.barBg = new Sprite(Texture.WHITE); v.barBg.tint = hex(C.ink); v.barBg.height = 4;
        v.bar = new Sprite(Texture.WHITE); v.bar.tint = hex(C.red); v.bar.height = 2;
        this.fxHost.addChild(v.barBg, v.bar);
      }
      const w = look.bar;
      v.barBg!.width = w + 2;
      v.barBg!.position.set(x - w / 2 - 1, Math.max(0, y - look.barY));
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
      const mz = own ? (isHero(own.type) ? heroMuzzle(own.heroLevel, own.facing) : towerMuzzle(own.type, own.tiers, own.facing)) : { x: 0, y: 0 };
      const so = this.r16t.shotOffset(p.id);
      v = { spr, key: '', px: cx, py: cy, cx, cy, mx: so ? so.x : p.sub === 1 ? 0 : mz.x, my: so ? so.y : p.sub === 1 ? 0 : mz.y };
      if (p.kind === 'bomb' || p.kind === 'potion') { v.shadow = new Sprite(shadowTex(7, 3)); this.shadowC.addChild(v.shadow); }
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
    const s = projectileSprite(look, p.kind === 'bomb' || p.kind === 'potion' ? Math.floor(this.now / 70) & 15 : dir16);
    v.spr.texture = tex(s.canvas);
    v.spr.position.set(Math.round(gx) - s.ax, Math.round(gy - lift) - s.ay);
    v.spr.zIndex = 0;
    if (v.shadow) v.shadow.position.set(Math.round(gx) - 4, Math.round(gy) - 2);
    v.spr.zIndex = 100000;
  }

  /** Fragt die Sim nach dem Trank-Buff eines Turms (Glanz am Turm). */
  setBuffProbe(fn: (id: number) => TowerBuff): void {
    this.buffProbe = fn;
    this.glowOf.clear();
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
    this.r16b.handle(ev, this.now);
    if (this.r16t.handle(ev, this.now)) return;
    switch (ev.type) {
      case 'fire': {
        const t = this.latest?.towers.find((q) => q.id === ev.tower);
        if (t) {
          const mz = isHero(t.type) ? heroMuzzle(t.heroLevel, t.facing) : towerMuzzle(t.type, t.tiers, t.facing);
          const col = t.type === 'bombardier' ? [C.orange, C.stone, C.yellow] : t.type === 'frostcaller' ? [C.ice, C.white] : isHero(t.type) ? [C.yellow, C.amber] : t.type === 'longshot' ? [C.yellow, C.white] : t.type === 'thornweaver' ? [C.leaf, C.grass, C.yellow] : t.type === 'alchemist' ? [C.leaf, C.yellow, C.white] : [C.sand, C.white];
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
        fx.float(m(ev.x), m(ev.y) - 12, ev.reason === 'armor' ? 'TINK' : ev.reason === 'explosion' ? 'NO BLAST' : 'IMMUNE', ev.reason === 'explosion' ? C.ice : C.silver, 22, 0.3);
        break;
      }
      case 'pop': {
        const x = m(ev.x), y = m(ev.y);
        fx.pop(x, y - 4, ev.etype);
        if (BIG_SHARDS.has(ev.etype)) fx.burst(x, y - 6, SHARD_COL[ev.etype] ?? SHARD_COL.brute!, 12, 1.8, 2, 0.07, 22);
        if (ev.etype === 'gloomship') {
          // Absturz: das Schiff schlaegt am Boden unter sich ein
          fx.anim(x, y, FRAMES.GLOOM_CRASH_FRAMES, (f) => P2.gloomCrash(f), { per: 3 });
          fx.shake.t = 10; fx.shake.amp = 2;
        } else if (ev.etype === 'cruiser' || ev.etype === 'dreadnought') {
          fx.anim(x, y, FRAMES.SHIP_CRASH_FRAMES, (f) => P2.shipCrash(ev.etype as 'cruiser' | 'dreadnought', f), { per: 3 });
          fx.shake.t = ev.etype === 'dreadnought' ? 40 : 16; fx.shake.amp = ev.etype === 'dreadnought' ? 4 : 2;
        } else if (ev.etype === 'duskrunner') {
          fx.burst(x, y - 10, SHARD_COL.duskrunner!, 10, 2.2, 2, 0.06, 18);
        } else if (ev.etype === 'wyrm' || ev.etype === 'colossus') {
          fx.anim(x, y, FRAMES.BOSS_DEATH_FRAMES, (f) => P2.bossDeath(ev.etype as 'wyrm' | 'colossus', f), { per: 3 });
          fx.shake.t = 30; fx.shake.amp = 3;
          fx.flash(ev.etype === 'wyrm' ? C.ice : C.orange, 0.4);
          fx.float(x, y - 70, ev.etype === 'wyrm' ? 'WYRM SLAIN' : 'COLOSSUS SLAIN', C.yellow, 70, 0.3);
        }
        if (ev.cash >= 3) fx.float(x, y - 14, `+${ev.cash}`, C.yellow, 30, 0.4);
        break;
      }
      case 'explode': {
        const r = m(ev.radius);
        if (ev.kind === 'acid') fx.anim(m(ev.x), m(ev.y), FRAMES.SPLASH_FRAMES, (f) => P2.acidSplash(Math.max(8, Math.round(r)), f), { per: 3 });
        else if (ev.kind === 'unstable') { fx.anim(m(ev.x), m(ev.y), FRAMES.DEATH_BLAST_FRAMES, (f) => P2.deathBlast(f, Math.max(10, Math.round(r))), { per: 3 }); fx.burst(m(ev.x), m(ev.y), [C.leaf, C.yellow, C.grass], 6, 1.6, 2, 0.05, 16); }
        else fx.explosion(m(ev.x), m(ev.y), r, ev.kind);
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
      case 'chain': {
        const pts = ev.points.map(([x, y]) => [m(x), m(y)] as [number, number]);
        const own = this.latest?.towers.find((q) => q.id === ev.tower);
        if (own?.type === 'thornweaver' && pts.length >= 2) this.stormArc(pts, own.tiers[0] >= 4, own.tiers[0] >= 3);
        else fx.bolt(pts);
        break;
      }
      case 'whirlwind': {
        const x = m(ev.x), y = m(ev.y);
        fx.anim(x, y + 4, FRAMES.WIND_FRAMES, (f) => P2.whirlwind(f), { per: 3, loop: 2 });
        fx.ring(x, y, 4, Math.max(10, m(ev.radius)), C.ice, 14);
        fx.burst(x, y - 8, [C.ice, C.white, C.leaf], 8, 1.8, 1, -0.02, 18);
        break;
      }
      case 'vine': {
        const q = this.enemyPos(ev.enemy);
        const x = q?.x ?? m(ev.x), y = q?.y ?? m(ev.y);
        fx.burst(x, y, [C.leaf, C.grass, C.pine ?? C.grass], 6, 1.1, 1, 0.03, 14);
        break;
      }
      case 'zone': {
        const x = m(ev.x), y = m(ev.y), r = m(ev.radius);
        fx.ring(x, y, 4, Math.min(r, 120), ev.dmg >= 5 ? C.amber : C.leaf, 12);
        if (ev.hits > 0) fx.burst(x, y - 2, [C.leaf, C.grass, C.yellow], Math.min(8, 2 + ev.hits), 1.3, 1, 0.02, 12);
        break;
      }
      case 'wall': {
        const x = m(ev.x), y = m(ev.y);
        fx.anim(x, y, FRAMES.WALL_GROW_FRAMES, (f) => P2.treeWallGrow(f), { per: 3 });
        fx.burst(x, y - 2, [C.leaf, C.grass, C.wood], 10, 1.6, 2, 0.04, 20);
        fx.shake.t = 8; fx.shake.amp = 1;
        break;
      }
      case 'wallEat': {
        const x = m(ev.x), y = m(ev.y);
        fx.burst(x, y - 6, [C.leaf, C.grass, C.yellow], 6, 1.4, 1, 0.04, 14);
        if (ev.cash >= 3) fx.float(x, y - 22, `+${ev.cash}`, C.yellow, 30, 0.4);
        break;
      }
      case 'wallGone': {
        const v = this.walls.get(ev.id);
        if (v) {
          fx.puff(v.x, v.y - 4, null);
          fx.burst(v.x, v.y - 10, [C.leaf, C.grass, C.wood, C.bark ?? C.wood], 12, 1.6, 2, 0.05, 22);
          fx.float(v.x, v.y - 30, ev.reason === 'spent' ? 'SPENT' : 'GONE', C.leaf, 28, 0.3);
        }
        break;
      }
      case 'brew': {
        const t = this.latest?.towers.find((q) => q.id === ev.target);
        if (t) {
          const x = m(t.x), y = m(t.y);
          const kind = ev.ticks === 0 ? 'permanent' : ev.dmg >= 2 || ev.speedBp >= 2500 ? 'stimulant' : 'brew';
          fx.anim(x, y, FRAMES.BUFF_FRAMES, (f) => P2.buffGlow(f, kind), { per: 4, loop: 2 });
          fx.burst(x, y - 22, [C.leaf, C.yellow, C.white], 8, 1.3, 1, -0.02, 20);
          fx.float(x, y - 40, ev.ticks === 0 ? 'FOREVER' : 'BREW', kind === 'brew' ? C.coral : C.amber, 34, 0.35);
        }
        break;
      }
      case 'monster': {
        const t = this.latest?.towers.find((q) => q.id === ev.tower);
        const v = this.towers.get(ev.tower);
        if (t) {
          const x = m(t.x), y = m(t.y);
          if (v) v.hide = this.now + 8 * 3 * 16.7;
          fx.anim(x, y, FRAMES.TRANSFORM_FRAMES, (f) => P2.monsterTransform(f), { per: 3 });
          if (t.type === 'alchemist') { fx.shake.t = 10; fx.shake.amp = 1; }
        }
        break;
      }
      case 'shrink': {
        const x = m(ev.x), y = m(ev.y);
        fx.anim(x, y, FRAMES.SHRINK_FRAMES, (f) => P2.shrink(ev.from, f), { per: 3 });
        if (ev.cash >= 3) fx.float(x, y - 22, `+${ev.cash}`, C.yellow, 30, 0.4);
        break;
      }
      case 'bounty': {
        const x = m(ev.x), y = m(ev.y);
        fx.anim(x, y - 6, FRAMES.GOLD_BURST_FRAMES, (f) => P2.goldBurst('lead', f), { per: 3 });
        fx.float(x, y - 22, `+${ev.gold}`, C.yellow, 34, 0.4);
        break;
      }
      case 'heal': {
        const t = ev.tower ? this.latest?.towers.find((q) => q.id === ev.tower) : undefined;
        fx.float(70, 38, `+${ev.lives}`, C.coral, 60, 0.3);
        if (t) {
          const x = m(t.x), y = m(t.y);
          fx.custom(40, (node) => {
            const sp = new Sprite(); node.addChild(sp);
            const hs = bigHeart();
            sp.texture = tex(hs.canvas);
            return (age) => { sp.position.set(Math.round(x + Math.sin(age / 5) * 3) - hs.ax, Math.round(y - 30 - age * 0.9) - hs.ay); sp.alpha = age > 28 ? 1 - (age - 28) / 12 : 1; };
          });
        }
        break;
      }
      case 'gate': {
        fx.flash(C.leaf, 0.2);
        const ex = this.geo.exit;
        fx.ring(ex.x, ex.y, 3, 26, C.leaf, 18);
        fx.ring(ex.x, ex.y, 2, 16, C.white, 12);
        fx.burst(ex.x - 4, ex.y - 2, [C.leaf, C.white, C.silver], 12, 1.8, 2, 0.03, 22);
        fx.float(ex.x - 28, ex.y - 22, 'GATE HELD', C.leaf, 56, 0.3);
        break;
      }
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
        if (kind === 'snare' || kind === 'volatile') {
          // Ranke und Unstable-Markierung haengen in `syncEnemy` am Gegner, solange die Sim den Zustand fuehrt
          const q = this.enemyPos(id);
          if (q) fx.burst(q.x, q.y - 6, kind === 'snare' ? [C.leaf, C.grass] : [C.leaf, C.yellow], 4, 0.9, 1, 0.02, 10);
          break;
        }
        if (kind === 'gold') {
          const q = this.enemyPos(id);
          if (q) fx.anim(q.x, q.y - 6, FRAMES.GOLD_BURST_FRAMES, (f) => P2.goldBurst('rubber', f), { per: 3 });
          break;
        }
        const etype = this.latest?.enemies.find((q) => q.id === id)?.type ?? 'red';
        if (kind === 'acid') {
          fx.anim(0, 0, FRAMES.MARK_ACID_FRAMES, (f) => P2.acidMark(f), {
            per: 4, loop: 3,
            follow: () => { const v = this.enemies.get(id); return v ? { x: v.cx, y: v.cy - ENEMY_LOOK[etype].top } : null; },
          });
          break;
        }
        const dur = kind === 'freeze' ? 60 : kind === 'stun' ? 30 : kind === 'burn' ? 36 : kind === 'reveal' ? 20 : 16;
        fx.anim(0, 0, FRAMES.STATUS_FRAMES, (f) => P2.status(kind, f, etype), {
          per: 4, loop: Math.max(1, Math.round(dur / (FRAMES.STATUS_FRAMES * 4))),
          follow: () => { const v = this.enemies.get(id); return v ? { x: v.cx, y: v.cy - (kind === 'freeze' ? 6 : Math.round(ENEMY_LOOK[etype].top * 0.93) + 1) } : null; },
        });
        break;
      }
      case 'leak': {
        fx.shake.t = 10; fx.shake.amp = 2; fx.flash(C.red, 0.3);
        fx.anim(this.geo.exit.x, this.geo.exit.y, 6, (f) => P2.leak(f), { per: 3 });
        fx.float(this.geo.exit.x - 10, this.geo.exit.y - 20, `-${ev.lives}`, C.red, 40, 0.5);
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
        const bt = this.latest?.enemies.find((q) => q.id === ev.enemy)?.type;
        fx.shake.t = 16; fx.shake.amp = 2; fx.flash(bt === 'wyrm' ? C.ice : bt === 'colossus' ? C.orange : C.white, 0.35);
        if (p) {
          fx.anim(p.x, p.y - 20, FRAMES.PLATE_FRAMES, (f) => P2.bossPlate(f, ev.stage % 2 ? 1 : -1), { per: 3 });
          fx.burst(p.x, p.y - 20, bt === 'wyrm' ? [C.ice, C.white, C.sky, C.navy] : bt === 'colossus' ? [C.orange, C.red, C.slate, C.stone] : [C.slate, C.stone, C.silver, C.navy], 14, 2.2, 3, 0.08, 28);
        }
        break;
      }
      case 'regrow': {
        // Eine Schicht waechst nach: Blaetter ranken um den Gegner, der Sprite hat die neue Huelle schon
        fx.anim(m(ev.x), m(ev.y), FRAMES.REGROW_FRAMES, (f) => P2.regrow(ev.to, f), { per: 3 });
        break;
      }
      case 'bossBreath': {
        // Frosthauch: Ring um den Wyrm, Eis fliegt zu den getroffenen Tuermen (der Eisblock kommt aus `TowerState.frozen`)
        const x = m(ev.x), y = m(ev.y), r = Math.round(m(ev.radius));
        fx.anim(x, y - 8, FRAMES.FROST_BREATH_FRAMES, (f) => P2.frostBreath(f, r), { per: 4 });
        fx.flash(C.ice, 0.14);
        fx.shake.t = 8; fx.shake.amp = 1;
        fx.float(x, y - 66, 'FROST BREATH', C.ice, 50, 0.3);
        for (const id of ev.towers) {
          const t = this.latest?.towers.find((q) => q.id === id);
          if (t) fx.burst(m(t.x), m(t.y) - 12, [C.ice, C.white, C.sky], 8, 1.4, 2, 0.03, 18);
        }
        break;
      }
      case 'towerFrozen': {
        const t = this.latest?.towers.find((q) => q.id === ev.tower);
        if (t) fx.float(m(t.x), m(t.y) - 40, 'FROZEN', C.ice, 30, 0.3);
        break;
      }
      case 'bossSpit': {
        const x = m(ev.x), y = m(ev.y);
        fx.burst(x, y - 24, [C.ice, C.white, C.sky, C.plum], 16, 2.2, 2, 0.05, 24);
        fx.ring(x, y - 12, 3, 28, C.ice, 14);
        fx.shake.t = 8; fx.shake.amp = 1;
        fx.float(x, y - 70, 'FROSTLINGS!', C.ice, 50, 0.3);
        break;
      }
      case 'stomp': {
        // Lava-Stampfer: Druckwelle im Radius, die Gegner darin laufen schneller (Sprite-Tint in `syncEnemy`)
        const x = m(ev.x), y = m(ev.y), r = Math.round(m(ev.radius));
        fx.anim(x, y, FRAMES.STOMP_FRAMES, (f) => P2.stomp(f, r), { per: 3 });
        fx.shake.t = 16; fx.shake.amp = 2; fx.flash(C.orange, 0.2);
        fx.burst(x, y - 4, [C.orange, C.yellow, C.red, C.amber], 14, 2.2, 2, 0.06, 22);
        fx.float(x, y - 66, 'STOMP', C.orange, 40, 0.3);
        break;
      }
      default: break;
    }
  }

  /** Blitzbogen aus der Wolke des Thornweavers: Punkte[0] = Turm; die Wolke sitzt ueber dem Turm (ab A3 gross). */
  private stormArc(pts: [number, number][], big: boolean, cloud: boolean): void {
    const p = pts.map((q, i) => (i === 0 ? [q[0], q[1] - (cloud ? 36 : 22)] : [q[0], q[1] - 6]) as [number, number]);
    this.fx.custom(10, (node) => {
      const sp = new Sprite(); node.addChild(sp);
      return (age) => {
        const f = P2.stormArc(p, Math.floor(age / 2), big);
        sp.texture = tex(f.canvas);
        sp.position.set(-f.ax, -f.ay);
        sp.alpha = age > 6 ? 1 - (age - 6) / 4 : 1;
      };
    });
    for (const [x, y] of p.slice(1)) this.fx.burst(x, y, [C.ice, C.white, C.sky], 3, 1.2, 1, 0.02, 8);
    if (big) { this.fx.shake.t = 4; this.fx.shake.amp = 1; }
  }

  /** Wird gerufen, wenn Muenzen die Geldanzeige erreichen (Match: Puls und Ton). */
  onCoinsLanded?: (amount: number) => void;

  /** Rundenende: Muenzen steigen vom Market auf; `cash` fliegt zur Geldanzeige, was auf die Bank ging, bleibt als Kontostand stehen. */
  private incomeFx(towerId: number, amount: number, cash: number, bank: number): void {
    const t = this.latest?.towers.find((q) => q.id === towerId);
    if (!t) return;
    const fx = this.fx;
    const tx = t.x / 1000, ty = t.y / 1000;
    if (t.type !== 'market') {
      // Thornweaver (World Tree, Jungle's Bounty): Gold bluebt als Blaetter-Schauer, keine Markt-Muenzen
      fx.burst(tx, ty - 24, [C.leaf, C.grass, C.yellow], 8, 1.2, 1, -0.02, 22);
      if (cash > 0) { fx.float(tx, ty - 46, `+${cash}`, C.yellow, 56, 0.3); this.coinsToCash(tx, ty - 24, cash, () => this.onCoinsLanded?.(cash)); }
      return;
    }
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
        const t = this.latest?.towers.find((q) => isHero(q.type));
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
    } else if (id === 'wallOfTrees') {
      fx.flash(C.leaf, 0.12);
    } else if (id === 'tonic') {
      fx.flash(C.orchid ?? C.yellow, 0.16);
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
      // alle Wegaeste; Aeste teilen ihr Endstueck (Frostfen): jede Strecke nur einmal
      const seen = new Set<string>();
      for (const path of this.geo.paths) for (let i = 1; i < path.length; i++) {
        const [ax, ay] = path[i - 1], [bx, by] = path[i];
        if (ax !== bx && ay !== by) continue;
        const key = `${Math.min(ax, bx)},${Math.min(ay, by)},${Math.max(ax, bx)},${Math.max(ay, by)}`;
        if (seen.has(key)) continue;
        seen.add(key);
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

