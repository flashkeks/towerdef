/**
 * Units und Gegner: Ansichten anlegen, positionieren (Interpolation), Lebensbalken/Statuszeichen, aufraeumen.
 * Aussehen kommt aus `sprites.ts`. Besitzer: P4 (Grafik); Treffer-/Todeseffekte gehoeren in `fx.ts` (P5).
 */
import { Container, Graphics, Text } from 'pixi.js';
import type { EnemyState, UnitState } from '../sim';
import { enemyHpRatio, enemyStyle, hpBarColor } from '../view/model';
import { C } from './palette';
import type { RenderContext } from './context';
import type { Session } from './session';
import { drawUnit, makeEnemyBody, makeUnitNode, type UnitNode } from './sprites';

interface UnitView extends UnitNode {
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

export class EntitiesLayer {
  readonly unitLayer = new Container();
  readonly enemyLayer = new Container();
  private unitViews = new Map<number, UnitView>();
  private enemyViews = new Map<number, EnemyView>();
  /** Letzte Canvas-Position je Gegner (fuer Effekte an Gegner-Positionen, z. B. Kill-Popup). */
  private lastPos = new Map<number, { x: number; y: number }>();

  constructor(private readonly ctx: RenderContext) {}

  /** Alle Ansichten verwerfen (neue Runde). */
  reset(): void {
    for (const v of this.unitViews.values()) v.c.destroy({ children: true });
    for (const v of this.enemyViews.values()) v.c.destroy({ children: true });
    this.unitViews.clear();
    this.enemyViews.clear();
    this.lastPos.clear();
  }

  /** Canvas-Position (Mitte) eines Gegners, auch noch im Frame seines Todes. */
  enemyPos(id: number): { x: number; y: number } | undefined {
    return this.lastPos.get(id);
  }

  /** Aktuelle Position der Figur (inkl. Schwebe-Versatz), fuer Overlays an Gegnern. */
  enemyView(id: number): { x: number; y: number } | undefined {
    const v = this.enemyViews.get(id);
    return v ? { x: v.c.x, y: v.c.y } : undefined;
  }

  sync(session: Session, nowMs: number): void {
    this.syncUnits(session, session.sim.state.units);
    this.syncEnemies(session, session.sim.state.enemies, nowMs);
  }

  private syncUnits(session: Session, units: readonly UnitState[]): void {
    const { ctx } = this;
    const seen = new Set<number>();
    for (const u of units) {
      seen.add(u.id);
      const def = ctx.defs[u.defId];
      const slot = ctx.stage?.slots[u.slot];
      if (!def || !slot) continue;
      let v = this.unitViews.get(u.id);
      if (!v || v.version !== ctx.version) {
        v?.c.destroy({ children: true });
        const node = makeUnitNode(ctx, u.defId);
        this.unitLayer.addChild(node.c);
        v = { ...node, version: ctx.version, sig: '' };
        this.unitViews.set(u.id, v);
      }
      const pos = ctx.px(slot.x, slot.y);
      v.c.position.set(pos.x, pos.y);
      const ready = def.ability !== undefined && u.abilityCd === 0;
      const selected = session.selectedUnit === u.id;
      const sig = `${u.level}|${selected}|${ready}`;
      if (sig === v.sig) continue;
      v.sig = sig;
      drawUnit(v, ctx, def, u, selected, ready);
    }
    for (const [id, v] of this.unitViews) {
      if (!seen.has(id)) {
        v.c.destroy({ children: true });
        this.unitViews.delete(id);
      }
    }
  }

  private syncEnemies(session: Session, enemies: readonly EnemyState[], nowMs: number): void {
    const { ctx } = this;
    const T = ctx.tile;
    const seen = new Set<number>();
    for (const e of enemies) {
      seen.add(e.id);
      let v = this.enemyViews.get(e.id);
      if (!v || v.version !== ctx.version) {
        v?.c.destroy({ children: true });
        v = this.makeEnemy(e);
        this.enemyViews.set(e.id, v);
      }
      const prev = session.prevPos.get(e.id) ?? { x: e.x, y: e.y };
      const x = (prev.x + (e.x - prev.x) * session.alpha) / 1000;
      const y = (prev.y + (e.y - prev.y) * session.alpha) / 1000;
      const p = ctx.px(x, y);
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
    const c = new Container();
    const body = makeEnemyBody(this.ctx, e);
    const bar = new Graphics();
    c.addChild(body, bar);
    this.enemyLayer.addChild(c);
    return { c, body, bar, tag: null, version: this.ctx.version, sig: '' };
  }
}
