/**
 * Pixi-Renderer: zeichnet den Sim-Zustand mit einfachen Formen (keine Assets). Kein Spielwissen, nur Darstellung.
 * Welt: 17 x 11 Tiles (Pfad und Slots liegen in Tile-Koordinaten, +0,5 Rand). Tile-Groesse folgt dem Platz (ganzzahlig).
 */
import { Application, Container, Graphics, Text } from 'pixi.js';
import { t } from '../i18n/t';
import type { EnemyState, SimEvent, StageData, UnitDef, UnitState } from '../sim';
import { enemyHpRatio, enemyStyle, hpBarColor, unitColor } from '../view/model';
import { telegraphProgress } from '../view/telegraph';
import type { Session } from './session';

export const WORLD_W = 17;
export const WORLD_H = 11;
const MIN_TILE = 24;
const MAX_TILE = 72;

const C = {
  grass: 0x2f5a3a,
  grassLight: 0x4e8a45,
  path: 0xd0a574,
  pathEdge: 0x8a5a3a,
  ground: 0x8a90a6,
  groundEdge: 0x59607a,
  hill: 0x8a5a3a,
  hillEdge: 0x5a3a2a,
  ink: 0x2a1e3a,
  gold: 0xf5c542,
  red: 0xd8344a,
  teal: 0x3fd8c0,
  ice: 0x9ad8f0,
  white: 0xf1f2f7,
  rim: 0xa67ae0,
  ember: 0xff9a3c,
};

interface UnitView {
  c: Container;
  g: Graphics;
  label: Text;
  version: number;
  sig: string;
}
interface EnemyView {
  c: Container;
  body: Graphics;
  bar: Graphics;
  tag: Text | null;
  version: number;
  sig: string;
}
interface Pop {
  text: Text;
  vy: number;
  life: number;
}

export class Renderer {
  readonly app = new Application();
  tile = 48;
  private version = 0;
  private terrain = new Graphics();
  private rangeG = new Graphics();
  private unitLayer = new Container();
  private enemyLayer = new Container();
  private overlay = new Graphics();
  private fxLayer = new Container();
  private flash = new Graphics();
  private unitViews = new Map<number, UnitView>();
  private enemyViews = new Map<number, EnemyView>();
  private lastPos = new Map<number, { x: number; y: number; bounty?: number }>();
  private pops: Pop[] = [];
  private flashAlpha = 0;
  private flashDrawn = false;
  private rangeSig = '';
  private overlayDrawn = false;
  private stage: StageData | null = null;
  private defs: Record<string, UnitDef> = {};

  async init(host: HTMLElement): Promise<void> {
    await this.app.init({
      width: WORLD_W * this.tile,
      height: WORLD_H * this.tile,
      background: C.grass,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    this.app.canvas.classList.add('board');
    host.appendChild(this.app.canvas);
    const s = this.app.stage;
    s.addChild(this.terrain, this.rangeG, this.unitLayer, this.enemyLayer, this.overlay, this.fxLayer, this.flash);
  }

  /** Neue Runde: Karte und Katalog setzen, alle Ansichten verwerfen. */
  setup(stage: StageData, catalog: UnitDef[]): void {
    this.stage = stage;
    this.defs = Object.fromEntries(catalog.map((d) => [d.id, d]));
    for (const v of this.unitViews.values()) v.c.destroy({ children: true });
    for (const v of this.enemyViews.values()) v.c.destroy({ children: true });
    this.unitViews.clear();
    this.enemyViews.clear();
    this.lastPos.clear();
    for (const p of this.pops) {
      p.text.visible = false;
      this.popPool.push(p.text);
    }
    this.pops = [];
    this.drawTerrain();
  }

  /** Passt die Tile-Groesse an den verfuegbaren Platz an (ganzzahlig). Gibt die Tile-Groesse zurueck. */
  fit(availW: number, availH: number): number {
    const tile = Math.max(MIN_TILE, Math.min(MAX_TILE, Math.floor(Math.min(availW / WORLD_W, availH / WORLD_H))));
    if (tile !== this.tile) {
      this.tile = tile;
      this.version++;
      this.app.renderer.resize(WORLD_W * tile, WORLD_H * tile);
      this.drawTerrain();
    }
    return this.tile;
  }

  /** Mitte eines Weltpunkts (Tiles) in Canvas-Pixeln. */
  px(tx: number, ty: number): { x: number; y: number } {
    return { x: (tx + 0.5) * this.tile, y: (ty + 0.5) * this.tile };
  }

  // ---- Terrain -------------------------------------------------------------------------------------------------

  private drawTerrain(): void {
    const g = this.terrain;
    g.clear();
    const T = this.tile;
    if (!this.stage) return;
    // Rasterflecken, damit die Wiese nicht flach wirkt
    for (let x = 0; x < WORLD_W; x++) for (let y = 0; y < WORLD_H; y++) if ((x + y) % 2 === 0) g.rect(x * T, y * T, T, T).fill({ color: C.grassLight, alpha: 0.1 });
    const pts = this.stage.path.map(([x, y]) => this.px(x, y));
    // Pfad: dunkler Rand, helle Mitte
    for (const [w, col] of [[T * 0.98, C.pathEdge], [T * 0.8, C.path]] as const) {
      g.moveTo(pts[0].x, pts[0].y);
      for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
      g.stroke({ width: w, color: col, cap: 'round', join: 'round' });
    }
    // Start und Ziel
    const a = pts[0];
    const b = pts[pts.length - 1];
    g.circle(a.x, a.y, T * 0.3).fill(C.rim);
    g.circle(b.x, b.y, T * 0.4).fill({ color: C.gold, alpha: 0.9 }).stroke({ width: 3, color: C.ink });
    // Slots
    for (const s of this.stage.slots) {
      const c = this.px(s.x, s.y);
      const size = s.size * T * 0.92;
      const hill = s.kind === 'hill';
      g.roundRect(c.x - size / 2, c.y - size / 2, size, size, 6).fill(hill ? C.hill : C.ground).stroke({ width: 2, color: hill ? C.hillEdge : C.groundEdge });
      if (hill) g.poly([c.x, c.y - size * 0.3, c.x + size * 0.3, c.y + size * 0.2, c.x - size * 0.3, c.y + size * 0.2]).fill({ color: C.hillEdge, alpha: 0.45 });
    }
  }

  // ---- Frame ---------------------------------------------------------------------------------------------------

  draw(session: Session, nowMs: number, dtMs: number, events: SimEvent[]): void {
    const state = session.sim.state;
    this.handleEvents(events);
    this.drawRange(session);
    this.syncUnits(session, state.units);
    this.syncEnemies(session, state.enemies, nowMs);
    this.drawBossOverlay(session, nowMs);
    this.updateFx(dtMs);
  }

  private handleEvents(events: SimEvent[]): void {
    for (const e of events) {
      if (e.type === 'kill') {
        const p = this.lastPos.get(e.enemyId);
        if (p && this.pops.length < 40) this.addPop(`+${e.bounty}`, p.x, p.y, C.gold);
      } else if (e.type === 'leak') {
        this.flashAlpha = Math.min(0.6, 0.25 + e.damage * 0.04);
      }
    }
  }

  private popPool: Text[] = [];

  private addPop(label: string, x: number, y: number, color: number): void {
    // Text-Objekte werden wiederverwendet, nie zerstoert (Zerstoeren/Neuanlegen pro Kill brachte SwiftShader zum Absturz).
    let text = this.popPool.pop();
    if (!text) {
      text = new Text({ text: label, style: { fontFamily: 'monospace', fontSize: Math.round(this.tile * 0.28), fontWeight: 'bold', fill: C.gold, stroke: { color: C.ink, width: 3 } } });
      text.anchor.set(0.5);
      this.fxLayer.addChild(text);
    }
    text.text = label;
    text.style.fill = color;
    text.visible = true;
    text.alpha = 1;
    text.position.set(x, y - this.tile * 0.3);
    this.pops.push({ text, vy: -this.tile * 0.9, life: 0.8 });
  }

  private updateFx(dtMs: number): void {
    const dt = dtMs / 1000;
    for (const p of this.pops) {
      p.life -= dt;
      p.text.y += p.vy * dt;
      p.text.alpha = Math.max(0, Math.min(1, p.life / 0.4));
    }
    this.pops = this.pops.filter((p) => {
      if (p.life > 0) return true;
      p.text.visible = false;
      this.popPool.push(p.text);
      return false;
    });
    if (this.flashAlpha > 0.01) {
      this.flash.clear();
      this.flash.rect(0, 0, WORLD_W * this.tile, WORLD_H * this.tile).fill({ color: C.red, alpha: this.flashAlpha });
      this.flashAlpha *= Math.pow(0.02, dt);
      this.flashDrawn = true;
    } else if (this.flashDrawn) {
      this.flash.clear();
      this.flashDrawn = false;
    }
  }

  private drawRange(session: Session): void {
    const g = this.rangeG;
    const u = session.selectedUnit === null ? undefined : session.sim.state.units.find((x) => x.id === session.selectedUnit);
    const def = u ? this.defs[u.defId] : undefined;
    const slot = u && this.stage ? this.stage.slots[u.slot] : undefined;
    const range = u ? (def?.levels[u.level]?.rangeMilli ?? 0) : 0;
    const sig = u && slot && range > 0 ? `${u.id}|${u.level}|${this.tile}|${this.version}` : '';
    if (sig === this.rangeSig) return;
    this.rangeSig = sig;
    g.clear();
    if (!u || !slot || range <= 0) return;
    const c = this.px(slot.x, slot.y);
    const r = (range / 1000) * this.tile;
    g.circle(c.x, c.y, r).fill({ color: C.white, alpha: 0.08 }).stroke({ width: 2, color: C.white, alpha: 0.6 });
  }

  // ---- Units ---------------------------------------------------------------------------------------------------

  private syncUnits(session: Session, units: readonly UnitState[]): void {
    const seen = new Set<number>();
    const T = this.tile;
    for (const u of units) {
      seen.add(u.id);
      const def = this.defs[u.defId];
      const slot = this.stage?.slots[u.slot];
      if (!def || !slot) continue;
      let v = this.unitViews.get(u.id);
      if (!v || v.version !== this.version) {
        v?.c.destroy({ children: true });
        const c = new Container();
        const g = new Graphics();
        const label = new Text({ text: t(`unit.${u.defId}.abbr`), style: { fontFamily: 'monospace', fontSize: Math.round(T * 0.26), fontWeight: 'bold', fill: C.ink } });
        label.anchor.set(0.5);
        c.addChild(g, label);
        this.unitLayer.addChild(c);
        v = { c, g, label, version: this.version, sig: '' };
        this.unitViews.set(u.id, v);
      }
      const pos = this.px(slot.x, slot.y);
      v.c.position.set(pos.x, pos.y);
      const ready = def.ability !== undefined && u.abilityCd === 0;
      const sig = `${u.level}|${session.selectedUnit === u.id}|${ready}`;
      if (sig === v.sig) continue;
      v.sig = sig;
      const r = def.footprint === 2 ? T * 0.8 : T * 0.36;
      const g = v.g;
      g.clear();
      const col = unitColor(u.defId);
      if (def.footprint === 2) g.roundRect(-r, -r, r * 2, r * 2, 8).fill(col).stroke({ width: 3, color: C.ink });
      else g.circle(0, 0, r).fill(col).stroke({ width: 3, color: C.ink });
      if (def.placement === 'hill') g.rect(-r * 0.6, r * 0.65, r * 1.2, r * 0.22).fill(C.hillEdge);
      // Level-Punkte
      for (let i = 0; i < u.level; i++) g.circle(-((u.level - 1) * 0.5 - i) * T * 0.14, -r - T * 0.1, T * 0.05).fill(C.gold);
      if (session.selectedUnit === u.id) g.circle(0, 0, r + 5).stroke({ width: 3, color: C.white });
      // Fertigkeit bereit?
      if (ready) g.circle(r * 0.8, -r * 0.8, T * 0.09).fill(C.teal).stroke({ width: 1, color: C.ink });
      v.label.style.fill = u.defId === 'lancer' || u.defId === 'titan' ? C.white : C.ink;
    }
    for (const [id, v] of this.unitViews) {
      if (!seen.has(id)) {
        v.c.destroy({ children: true });
        this.unitViews.delete(id);
      }
    }
  }

  // ---- Gegner --------------------------------------------------------------------------------------------------

  private syncEnemies(session: Session, enemies: readonly EnemyState[], nowMs: number): void {
    const T = this.tile;
    const seen = new Set<number>();
    for (const e of enemies) {
      seen.add(e.id);
      let v = this.enemyViews.get(e.id);
      if (!v || v.version !== this.version) {
        v?.c.destroy({ children: true });
        v = this.makeEnemy(e);
        this.enemyViews.set(e.id, v);
      }
      const prev = session.prevPos.get(e.id) ?? { x: e.x, y: e.y };
      const x = (prev.x + (e.x - prev.x) * session.alpha) / 1000;
      const y = (prev.y + (e.y - prev.y) * session.alpha) / 1000;
      const p = this.px(x, y);
      const bob = e.flying ? Math.sin(nowMs / 220 + e.id) * T * 0.05 - T * 0.12 : 0;
      v.c.position.set(p.x, p.y + bob);
      this.lastPos.set(e.id, { x: p.x, y: p.y });
      v.c.alpha = e.stunTicks > 0 ? 0.6 : 1;
      // Lebensbalken, Schild-Pips, Statuszeichen
      const style = enemyStyle(e.type);
      const w = Math.max(T * 0.6, style.radius * T * 1.6);
      const top = -style.radius * T - T * 0.18;
      const ratio = enemyHpRatio(e);
      const fillPx = Math.round(w * ratio);
      const marks = `${e.armor > 0 ? 'A' : ''}${e.regen ? '+' : ''}${e.slowTicks > 0 ? '~' : ''}`;
      const sig = `${fillPx}|${e.shield > 0}|${marks}`;
      if (sig !== v.sig) {
        v.sig = sig;
        const bar = v.bar;
        bar.clear();
        bar.rect(-w / 2, top, w, 4).fill(C.ink);
        bar.rect(-w / 2, top, fillPx, 4).fill(hpBarColor(ratio));
        if (e.shield > 0) bar.rect(-w / 2, top - 4, w, 2).fill(C.white);
        if (marks && !v.tag) {
          v.tag = new Text({ text: marks, style: { fontFamily: 'monospace', fontSize: Math.round(T * 0.2), fontWeight: 'bold', fill: C.white, stroke: { color: C.ink, width: 3 } } });
          v.c.addChild(v.tag);
        }
        if (v.tag) {
          v.tag.text = marks;
          v.tag.position.set(w / 2 + 2, top - 6);
        }
      }
    }
    for (const [id, v] of this.enemyViews) {
      if (!seen.has(id)) {
        v.c.destroy({ children: true });
        this.enemyViews.delete(id);
      }
    }
    // Positionscache klein halten (Kill-Pops brauchen nur die letzten Positionen)
    if (this.lastPos.size > 400) for (const id of [...this.lastPos.keys()].slice(0, 200)) if (!seen.has(id)) this.lastPos.delete(id);
  }

  private makeEnemy(e: EnemyState): EnemyView {
    const T = this.tile;
    const s = enemyStyle(e.type);
    const r = s.radius * T;
    const c = new Container();
    const body = new Graphics();
    if (e.flying) body.ellipse(0, r * 1.1, r * 0.9, r * 0.28).fill({ color: C.ink, alpha: 0.35 });
    switch (s.shape) {
      case 'circle':
        body.circle(0, 0, r).fill(s.color).stroke({ width: 2, color: C.ink });
        body.circle(-r * 0.3, -r * 0.15, r * 0.14).fill(C.white);
        body.circle(r * 0.3, -r * 0.15, r * 0.14).fill(C.white);
        break;
      case 'triangle':
        body.poly([r * 1.1, 0, -r * 0.8, -r * 0.8, -r * 0.8, r * 0.8]).fill(s.color).stroke({ width: 2, color: C.ink });
        body.circle(r * 0.2, 0, r * 0.15).fill(C.gold);
        break;
      case 'square':
        body.roundRect(-r, -r, r * 2, r * 2, 4).fill(s.color).stroke({ width: 3, color: e.elite ? C.gold : C.groundEdge });
        if (e.elite) body.poly([-r * 0.7, -r, -r * 0.5, -r * 1.35, -r * 0.2, -r, r * 0.2, -r, r * 0.5, -r * 1.35, r * 0.7, -r]).fill(C.gold);
        break;
      case 'diamond':
        body.poly([0, -r, r * 1.2, 0, 0, r * 0.7, -r * 1.2, 0]).fill(s.color).stroke({ width: 2, color: C.ink });
        body.poly([r * 1.2, 0, r * 1.5, -r * 0.3, r * 1.1, r * 0.2]).fill(C.ice);
        body.poly([-r * 1.2, 0, -r * 1.5, -r * 0.3, -r * 1.1, r * 0.2]).fill(C.ice);
        break;
      case 'split':
        body.circle(-r * 0.3, 0, r * 0.8).fill(s.color).stroke({ width: 2, color: C.ink });
        body.circle(r * 0.3, 0, r * 0.8).fill(s.color).stroke({ width: 2, color: C.ink });
        body.moveTo(0, -r).lineTo(0, r).stroke({ width: 2, color: C.ember });
        break;
      case 'hex': {
        const pts: number[] = [];
        for (let i = 0; i < 6; i++) pts.push(Math.cos((i * Math.PI) / 3) * r, Math.sin((i * Math.PI) / 3) * r);
        body.poly(pts).fill(s.color).stroke({ width: 4, color: C.rim });
        body.circle(0, 0, r * 0.3).fill(C.teal).stroke({ width: 2, color: C.ink });
        break;
      }
    }
    const bar = new Graphics();
    c.addChild(body, bar);
    this.enemyLayer.addChild(c);
    return { c, body, bar, tag: null, version: this.version, sig: '' };
  }

  // ---- Boss: Telegraph, Fenster, Schild ------------------------------------------------------------------------

  private drawBossOverlay(session: Session, nowMs: number): void {
    const g = this.overlay;
    const bosses = session.sim.state.enemies.filter((e) => e.boss);
    if (bosses.length === 0) {
      if (this.overlayDrawn) {
        g.clear();
        this.overlayDrawn = false;
      }
      return;
    }
    g.clear();
    this.overlayDrawn = true;
    const tr = session.tracker;
    const tick = session.sim.state.tick;
    const T = this.tile;
    for (const e of session.sim.state.enemies) {
      if (!e.boss) continue;
      const v = this.enemyViews.get(e.id);
      if (!v) continue;
      const cx = v.c.x;
      const cy = v.c.y;
      const base = enemyStyle(e.type).radius * T;
      const pulse = 0.5 + 0.5 * Math.sin(nowMs / 120);
      const tl = tr.telegraphs.get(e.id);
      if (tl) {
        const prog = telegraphProgress(tl, tick);
        const R = base * 2.4;
        g.circle(cx, cy, R * prog).fill({ color: C.red, alpha: 0.2 + 0.15 * pulse });
        g.circle(cx, cy, R).stroke({ width: 4, color: C.red, alpha: 0.7 + 0.3 * pulse });
        g.arc(cx, cy, R + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog).stroke({ width: 4, color: C.gold });
      }
      const win = tr.windows.get(e.id);
      if (win) {
        const left = Math.max(0, (win.untilTick - tick) / Math.max(1, win.totalTicks));
        g.circle(cx, cy, base * 1.35).stroke({ width: 4, color: C.teal, alpha: 0.6 + 0.4 * pulse });
        g.arc(cx, cy, base * 1.6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left).stroke({ width: 5, color: C.teal });
      }
      if (tr.wards.has(e.id)) g.circle(cx, cy, base * 1.2).stroke({ width: 3, color: C.ice });
    }
  }
}
