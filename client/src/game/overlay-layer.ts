/**
 * Overlays ueber der Karte: Reichweitenkreis der gewaehlten Unit (unter den Figuren) und Boss-Telegraph/-Fenster/-Schild (darueber).
 * Platzier-Geist und Platzier-Reichweite (P1) kommen hier hinein, Boss-Zeichnung gehoert P5.
 */
import { Container, Graphics } from 'pixi.js';
import { enemyStyle, unitColor } from '../view/model';
import { slotAt, slotFit } from '../view/placement';
import { reachMilli } from '../view/unit-info';
import { telegraphProgress } from '../view/telegraph';
import { C } from './palette';
import type { RenderContext } from './context';
import type { EntitiesLayer } from './entities-layer';
import type { Session } from './session';

export class OverlayLayer {
  /** Liegt unter Units und Gegnern. */
  readonly below = new Container();
  /** Liegt ueber Units und Gegnern. */
  readonly above = new Container();
  private readonly rangeG = new Graphics();
  private readonly bossG = new Graphics();
  /** Platzier-Modus (P1): Reichweitenkreis unter den Figuren, Geist darueber. */
  private readonly ghostRangeG = new Graphics();
  private readonly ghostG = new Graphics();
  private ghostSig = '';
  private rangeSig = '';
  private bossDrawn = false;

  constructor(private readonly ctx: RenderContext, private readonly entities: EntitiesLayer) {
    this.below.addChild(this.rangeG, this.ghostRangeG);
    this.above.addChild(this.bossG, this.ghostG);
  }

  /** Neue Runde. */
  reset(): void {
    this.rangeSig = '';
    this.rangeG.clear();
    this.bossG.clear();
    this.bossDrawn = false;
    this.ghostSig = '';
    this.ghostRangeG.clear();
    this.ghostG.clear();
  }

  /** Vor `entities.sync`: Ebene unter den Figuren. */
  drawBelow(session: Session): void {
    this.drawRange(session);
    this.drawPlacing(session);
  }

  /** Nach `entities.sync` (braucht die frischen Gegner-Positionen): Ebene ueber den Figuren. */
  drawAbove(session: Session, nowMs: number): void {
    this.drawBoss(session, nowMs);
  }

  private drawRange(session: Session): void {
    const { ctx } = this;
    const g = this.rangeG;
    const u = session.selectedUnit === null ? undefined : session.sim.state.units.find((x) => x.id === session.selectedUnit);
    const def = u ? ctx.defs[u.defId] : undefined;
    const slot = u && ctx.stage ? ctx.stage.slots[u.slot] : undefined;
    const range = u && def ? reachMilli(def, u.level) : 0;
    const sig = u && slot && range > 0 ? `${u.id}|${u.level}|${ctx.tile}|${ctx.version}` : '';
    if (sig === this.rangeSig) return;
    this.rangeSig = sig;
    g.clear();
    if (!u || !slot || range <= 0) return;
    const c = ctx.px(slot.x, slot.y);
    const r = (range / 1000) * ctx.tile;
    g.circle(c.x, c.y, r).fill({ color: C.white, alpha: 0.08 }).stroke({ width: 2, color: C.white, alpha: 0.6 });
  }

  /** Platzier-Geist: Unit-Scheibe plus Reichweitenkreis am Zeiger; rastet auf den Slot unter dem Zeiger ein. Gruen = passt, rot = passt nicht. */
  private drawPlacing(session: Session): void {
    const { ctx } = this;
    const def = session.placing ? ctx.defs[session.placing] : undefined;
    const p = session.pointer;
    const stage = ctx.stage;
    if (!def || !p || !stage) {
      if (this.ghostSig !== '') {
        this.ghostSig = '';
        this.ghostRangeG.clear();
        this.ghostG.clear();
      }
      return;
    }
    const T = ctx.tile;
    const slotId = slotAt(stage.slots, p.x / T - 0.5, p.y / T - 0.5);
    const slot = slotId === null ? undefined : stage.slots[slotId];
    const taken = slotId !== null && session.sim.state.units.some((u) => u.slot === slotId);
    const fit = slot ? slotFit(def, slot, !taken) : null;
    const ok = !!fit && fit.ok;
    const c = slot ? ctx.px(slot.x, slot.y) : p;
    const sig = `${def.id}|${Math.round(c.x)}|${Math.round(c.y)}|${ok}|${slotId === null}|${T}`;
    if (sig === this.ghostSig) return;
    this.ghostSig = sig;
    const tint = slot ? (ok ? C.teal : C.red) : C.white;
    const reach = reachMilli(def, 0);
    const gr = this.ghostRangeG.clear();
    if (reach > 0) gr.circle(c.x, c.y, (reach / 1000) * T).fill({ color: tint, alpha: 0.1 }).stroke({ width: 2, color: tint, alpha: 0.65 });
    const g = this.ghostG.clear();
    const r = T * 0.3;
    g.circle(c.x, c.y, r).fill({ color: unitColor(def.id), alpha: ok || !slot ? 0.8 : 0.4 }).stroke({ width: 3, color: tint, alpha: 0.95 });
    if (slot && !ok) {
      const d = r * 0.6;
      g.moveTo(c.x - d, c.y - d).lineTo(c.x + d, c.y + d).moveTo(c.x + d, c.y - d).lineTo(c.x - d, c.y + d).stroke({ width: 4, color: C.red });
    }
  }

  private drawBoss(session: Session, nowMs: number): void {
    const g = this.bossG;
    const bosses = session.sim.state.enemies.filter((e) => e.boss);
    if (bosses.length === 0) {
      if (this.bossDrawn) {
        g.clear();
        this.bossDrawn = false;
      }
      return;
    }
    g.clear();
    this.bossDrawn = true;
    const tr = session.tracker;
    const tick = session.sim.state.tick;
    const T = this.ctx.tile;
    for (const e of bosses) {
      const pos = this.entities.enemyView(e.id);
      if (!pos) continue;
      const cx = pos.x;
      const cy = pos.y;
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
