/**
 * Sprite-Fabrik: Units und Gegner als Atlas-Sprites (Pixel-Optik, nearest, ganzzahlig skaliert). Besitzer: P4 (Grafik).
 * Die Ebenen (`entities-layer.ts`) kennen nur diese Funktionen. Ohne geladenen Atlas bleiben die Ansichten leer und werden nach dem Laden neu gebaut.
 */
import { Container, Graphics, Sprite, Text } from 'pixi.js';
import type { EnemyState, UnitDef, UnitState } from '../sim';
import { initials, unitColor } from '../view/model';
import { getAtlas } from './atlas';
import { C } from './palette';
import type { RenderContext } from './context';

/** Gehtakt je Archetyp (Bilder pro Sekunde, zwei Frames). */
const WALK_FPS: Record<string, number> = { runner: 12, flyer: 6, boss: 3, elite: 4, brute: 4 };

export interface UnitNode {
  c: Container;
  spr: Sprite;
  g: Graphics;
}

/** Hoehe (Quellpixel) einer Figur, fuer Lebensbalken und Pips ueber dem Kopf. */
export function spriteHeight(name: string): number {
  const a = getAtlas();
  return a?.has(name) ? a.rect(name).h : 24;
}

/** Seltenheits-Rand der Fallback-Figur. */
const RARITY_RING: Record<string, number> = { Rare: 0x8ab85a, Epic: 0x4a86d8, Legendary: 0xf5c542, Mythic: 0xd8344a, Secret: 0xf1f2f7, Exclusive: 0xa67ae0 };

/**
 * Figur einer Unit. Kennt der Atlas die Unit (alte Pixel-Sprites), erscheint das Sprite; sonst die Fallback-Figur: Kreis in der Farbe
 * des Elements (oder des Damage-Typs), Rand in der Seltenheits-Farbe, Initialen des Namens. So braucht eine neue Unit kein Bild.
 */
export function makeUnitNode(ctx: RenderContext, def: Pick<UnitDef, 'id' | 'name' | 'rarity' | 'footprint'>): UnitNode {
  const c = new Container();
  const spr = new Sprite();
  const a = getAtlas();
  const name = `units/${def.id}`;
  if (a?.has(name)) {
    spr.texture = a.tex(name);
    spr.anchor.set(0.5);
    spr.scale.set(ctx.art);
  }
  const g = new Graphics();
  c.addChild(spr, g);
  if (a && !a.has(name)) {
    const r = ctx.tile * (def.footprint === 2 ? 0.8 : 0.4);
    const base = new Graphics();
    base.circle(0, 0, r).fill({ color: unitColor(def.id), alpha: 0.95 }).stroke({ width: Math.max(2, ctx.art * 2), color: RARITY_RING[def.rarity] ?? C.white });
    base.circle(0, 0, r * 0.72).fill({ color: C.ink, alpha: 0.35 });
    const label = new Text({ text: initials(def.name), style: { fontFamily: 'sans-serif', fontSize: Math.round(r * 0.9), fontWeight: 'bold', fill: C.white, stroke: { color: C.ink, width: 3 } } });
    label.anchor.set(0.5);
    c.addChildAt(base, 0);
    c.addChildAt(label, 1);
  }
  return { c, spr, g };
}

/** Vertikaler Versatz einer Unit auf ihrem Untergrund (Quellpixel): Huegel-Sockel tragen die Figur auf der Deckflaeche. */
export const unitLift = (def: UnitDef, kind: 'ground' | 'hill'): number => (def.footprint === 2 ? 0 : kind === 'hill' ? 10 : 3);

/** Zeichnet Stufenpunkte und Auswahlring neu (Aufruf nur bei geaenderter Signatur). Das Sprite selbst bleibt. */
export function drawUnit(node: UnitNode, ctx: RenderContext, def: UnitDef, u: UnitState, selected: boolean, kind: 'ground' | 'hill', abilityReady = false): void {
  const s = ctx.art;
  const big = def.footprint === 2;
  const lift = unitLift(def, kind) * s;
  node.spr.position.set(0, -lift);
  const half = (big ? 32 : 16) * s;
  const g = node.g;
  g.clear();
  const topY = -lift - half - 2 * s;
  // Stufenpunkte: kleine Quadrate in Gold ueber dem Kopf
  const px = Math.max(2, s * 2);
  for (let i = 0; i < u.level; i++) g.rect(Math.round(-((u.level * (px + 1) - 1) / 2) + i * (px + 1)), topY, px, px).fill(C.gold).stroke({ width: 1, color: C.ink });
  if (abilityReady) {
    // Fähigkeit bereit (Runde 9 / P1): kleiner Blitz über dem Kopf
    const bx = Math.round(half * 0.9);
    const by = Math.round(topY - 2 * s);
    const k = Math.max(2, s * 2);
    g.poly([bx + k, by - k * 3, bx - k, by + 0, bx + 0, by + 0, bx - k, by + k * 3, bx + k * 2, by - k, bx + k, by - k]).fill(C.teal).stroke({ width: 1, color: C.ink });
  }
  if (selected) {
    // Auswahlring flach am Boden (Ellipse), Schrittweite in Pixeln
    const ry = (big ? 7 : 4) * s;
    const rx = (big ? 30 : 12) * s;
    g.ellipse(0, (big ? 24 : 10) * s - lift * 0.0, rx, ry).stroke({ width: Math.max(2, s), color: C.white });
  }
}

export interface EnemyBody {
  c: Container;
  spr: Sprite;
  shadow: Sprite | null;
  /** Halbe Hoehe in Bildschirmpixeln (Lebensbalken sitzt darueber). */
  half: number;
  /** Anzahl der Bilder je Takt. */
  fps: number;
}

/** Koerper eines Gegners (ohne Lebensbalken, den haengt die Ebene an). Zwei Geh-Frames `enemies/TYP_0|1`. */
export function makeEnemyBody(ctx: RenderContext, e: EnemyState): EnemyBody {
  const c = new Container();
  const a = getAtlas();
  const s = ctx.art;
  const name = a?.has(`enemies/${e.type}_0`) ? e.type : 'grunt';
  const spr = new Sprite();
  let half = 12 * s;
  let shadow: Sprite | null = null;
  if (a) {
    spr.texture = a.tex(`enemies/${name}_0`);
    spr.anchor.set(0.5);
    spr.scale.set(s);
    half = (a.rect(`enemies/${name}_0`).h * s) / 2;
    if (e.flying) {
      shadow = new Sprite(a.tex('enemies/shadow'));
      shadow.anchor.set(0.5);
      shadow.scale.set(s);
      shadow.alpha = 0.35;
      shadow.position.set(0, ctx.tile * 0.34);
      c.addChild(shadow);
    }
  }
  c.addChild(spr);
  return { c, spr, shadow, half, fps: WALK_FPS[name] ?? 8 };
}

/** Setzt das Geh-Frame (0/1) und die Blickrichtung (Standard: rechts). */
export function setEnemyFrame(ctx: RenderContext, e: EnemyState, body: EnemyBody, nowMs: number, faceLeft: boolean): void {
  const a = getAtlas();
  if (!a) return;
  const name = a.has(`enemies/${e.type}_0`) ? e.type : 'grunt';
  const frame = Math.floor((nowMs / 1000) * body.fps + e.id) % 2;
  body.spr.texture = a.tex(`enemies/${name}_${frame}`);
  body.spr.scale.x = (faceLeft ? -1 : 1) * ctx.art;
}
