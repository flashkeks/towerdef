/**
 * Formen-Fabrik: baut die Pixi-Objekte fuer Units und Gegner (heute Formen, spaeter Atlas-Sprites). Besitzer: P4 (Grafik).
 * Die Ebenen (`entities-layer.ts`) kennen nur diese Funktionen, nicht die Formen selbst.
 */
import { Container, Graphics, Text } from 'pixi.js';
import { t } from '../i18n/t';
import type { EnemyState, UnitDef, UnitState } from '../sim';
import { enemyStyle, unitColor } from '../view/model';
import { C } from './palette';
import type { RenderContext } from './context';

export interface UnitNode {
  c: Container;
  g: Graphics;
  label: Text;
}

export function makeUnitNode(ctx: RenderContext, defId: string): UnitNode {
  const c = new Container();
  const g = new Graphics();
  const label = new Text({ text: t(`unit.${defId}.abbr`), style: { fontFamily: 'monospace', fontSize: Math.round(ctx.tile * 0.26), fontWeight: 'bold', fill: C.ink } });
  label.anchor.set(0.5);
  c.addChild(g, label);
  return { c, g, label };
}

/** Zeichnet eine Unit neu (Aufruf nur bei geaenderter Signatur: Stufe, Auswahl, Fertigkeit bereit). */
export function drawUnit(node: UnitNode, ctx: RenderContext, def: UnitDef, u: UnitState, selected: boolean, ready: boolean): void {
  const T = ctx.tile;
  const r = def.footprint === 2 ? T * 0.8 : T * 0.36;
  const g = node.g;
  g.clear();
  const col = unitColor(u.defId);
  if (def.footprint === 2) g.roundRect(-r, -r, r * 2, r * 2, 8).fill(col).stroke({ width: 3, color: C.ink });
  else g.circle(0, 0, r).fill(col).stroke({ width: 3, color: C.ink });
  if (def.placement === 'hill') g.rect(-r * 0.6, r * 0.65, r * 1.2, r * 0.22).fill(C.hillEdge);
  // Level-Punkte
  for (let i = 0; i < u.level; i++) g.circle(-((u.level - 1) * 0.5 - i) * T * 0.14, -r - T * 0.1, T * 0.05).fill(C.gold);
  if (selected) g.circle(0, 0, r + 5).stroke({ width: 3, color: C.white });
  // Fertigkeit bereit?
  if (ready) g.circle(r * 0.8, -r * 0.8, T * 0.09).fill(C.teal).stroke({ width: 1, color: C.ink });
  node.label.style.fill = u.defId === 'lancer' || u.defId === 'titan' ? C.white : C.ink;
}

/** Koerper eines Gegners (ohne Lebensbalken, den haengt die Ebene an). */
export function makeEnemyBody(ctx: RenderContext, e: EnemyState): Graphics {
  const s = enemyStyle(e.type);
  const r = s.radius * ctx.tile;
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
  return body;
}
