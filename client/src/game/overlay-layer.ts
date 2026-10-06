/**
 * Overlays ueber der Karte: Reichweitenkreis der gewaehlten Unit (unter den Figuren) und Boss-Telegraph/-Fenster/-Schild (darueber).
 * Platzier-Geist und Platzier-Reichweite (P1) kommen hier hinein, Boss-Zeichnung gehoert P5.
 */
import { Container, Graphics, Text } from 'pixi.js';
import { t } from '../i18n/t';
import { enemyStyle, unitColor } from '../view/model';
import { slotAt, slotFit } from '../view/placement';
import { reachMilli } from '../view/unit-info';
import { telegraphProgress, telegraphSecondsLeft } from '../view/telegraph';
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
  /** Wiederverwendete Texte am Boss: Countdown und Fenster-Marke (je Boss-Id, nie zerstoert). */
  private readonly countTexts = new Map<number, Text>();
  private readonly tagTexts = new Map<number, Text>();

  constructor(private readonly ctx: RenderContext, private readonly entities: EntitiesLayer) {
    this.below.addChild(this.rangeG, this.ghostRangeG);
    this.above.addChild(this.bossG, this.ghostG);
  }

  /** Neue Runde. */
  reset(): void {
    this.rangeSig = '';
    this.rangeG.clear();
    this.bossG.clear();
    this.hideLabels();
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

  private labelFor(map: Map<number, Text>, id: number): Text {
    let tx = map.get(id);
    if (!tx) {
      tx = new Text({ text: '', style: { fontFamily: 'monospace', fontSize: 20, fontWeight: 'bold', fill: C.white, stroke: { color: C.ink, width: 4 } } });
      tx.anchor.set(0.5);
      this.above.addChild(tx);
      map.set(id, tx);
    }
    return tx;
  }

  private setLabel(tx: Text, text: string, color: number, x: number, y: number, scale: number): void {
    if (tx.text !== text) tx.text = text;
    tx.style.fill = color;
    tx.position.set(Math.round(x), Math.round(y));
    tx.scale.set(scale);
    tx.visible = text !== '';
  }

  private hideLabels(): void {
    for (const tx of this.countTexts.values()) tx.visible = false;
    for (const tx of this.tagTexts.values()) tx.visible = false;
  }

  /** Diagonale Schraffur im Kreis (Styleguide: Telegraph = rot + Schraffur), wandert langsam. */
  private hatch(g: Graphics, cx: number, cy: number, R: number, gap: number, nowMs: number, color: number, alpha: number): void {
    const shift = ((nowMs / 40) % gap);
    for (let c = -R * Math.SQRT2 - gap + shift; c <= R * Math.SQRT2; c += gap) {
      const d = Math.abs(c) / Math.SQRT2;
      if (d >= R) continue;
      const hl = Math.sqrt(R * R - d * d);
      const fx = cx - c / 2;
      const fy = cy + c / 2;
      const k = hl / Math.SQRT2;
      g.moveTo(fx - k, fy - k).lineTo(fx + k, fy + k);
    }
    g.stroke({ width: 2, color, alpha });
  }

  private drawBoss(session: Session, nowMs: number): void {
    const g = this.bossG;
    const bosses = session.sim.state.enemies.filter((e) => e.boss);
    if (bosses.length === 0) {
      if (this.bossDrawn) {
        g.clear();
        this.hideLabels();
        this.bossDrawn = false;
      }
      return;
    }
    g.clear();
    this.hideLabels();
    this.bossDrawn = true;
    const tr = session.tracker;
    const tick = session.sim.state.tick;
    const T = this.ctx.tile;
    const textScale = T / 48;
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
        const urgent = prog > 0.75 ? 0.5 + 0.5 * Math.sin(nowMs / 55) : pulse;
        g.circle(cx, cy, R * prog).fill({ color: C.red, alpha: 0.2 + 0.15 * urgent });
        g.circle(cx, cy, R).fill({ color: C.red, alpha: 0.07 });
        this.hatch(g, cx, cy, R, Math.max(8, T * 0.2), nowMs, C.red, 0.35 + 0.3 * urgent);
        g.circle(cx, cy, R).stroke({ width: 4, color: C.red, alpha: 0.7 + 0.3 * urgent });
        g.moveTo(cx + Math.cos(-Math.PI / 2) * (R + 7), cy + Math.sin(-Math.PI / 2) * (R + 7));
        g.arc(cx, cy, R + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog).stroke({ width: 4, color: C.gold });
        if (tl.kind === 'mend') {
          // Heil-Sog: gruene Funken laufen zum Boss hin
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2 + nowMs / 900;
            const q = 1 - ((nowMs / 600 + i * 0.37) % 1);
            const rr = base * (0.9 + 1.6 * q);
            g.circle(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, Math.max(2, T * 0.05)).fill({ color: 0x7bd868, alpha: 0.9 });
          }
        }
        // Countdown in Sekunden mitten im Ring
        const secs = telegraphSecondsLeft(tl, tick);
        this.setLabel(this.labelFor(this.countTexts, e.id), secs.toFixed(1), prog > 0.75 ? C.white : C.gold, cx, cy + base * 1.05, textScale * (1.25 + (prog > 0.75 ? 0.3 * pulse : 0)));
        // Fortschritt zum Brechen: Leiste unter dem Boss, fuellt sich mit Schaden
        const need = e.bossRun?.tele?.need ?? tl.staggerNeed;
        if (need > 0) {
          const ratio = Math.max(0, Math.min(1, (e.bossRun?.tele?.dmg ?? 0) / need));
          const bw = base * 3.2;
          const bh = Math.max(7, T * 0.16);
          const bx = cx - bw / 2;
          const by = cy + R + 12;
          g.rect(bx - 2, by - 2, bw + 4, bh + 4).fill({ color: C.ink, alpha: 0.9 });
          g.rect(bx, by, bw * ratio, bh).fill({ color: ratio >= 1 ? C.white : C.ice });
          for (let q = 1; q < 4; q++) g.rect(bx + (bw * q) / 4 - 1, by, 2, bh).fill({ color: C.ink, alpha: 0.6 });
          g.rect(bx - 2, by - 2, bw + 4, bh + 4).stroke({ width: 2, color: ratio >= 1 ? C.teal : C.gold });
        }
      }
      const win = tr.windows.get(e.id);
      if (win) {
        const total = Math.max(1, win.totalTicks);
        const left = Math.max(0, (win.untilTick - tick) / total);
        const opened = Math.min(1, (1 - left) * total / 6);
        const blinking = left * total < 40 ? (Math.sin(nowMs / 60) > 0 ? 1 : 0.35) : 1;
        const open = win.armor === 0;
        g.circle(cx, cy, base * 1.35).fill({ color: C.teal, alpha: 0.1 + 0.08 * pulse });
        g.circle(cx, cy, base * 1.35).stroke({ width: 5, color: C.teal, alpha: (0.6 + 0.4 * pulse) * blinking });
        g.moveTo(cx + Math.cos(-Math.PI / 2) * base * 1.6, cy + Math.sin(-Math.PI / 2) * base * 1.6);
        g.arc(cx, cy, base * 1.6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left).stroke({ width: 5, color: C.teal, alpha: blinking });
        if (open) {
          // Panzer offen: sechs Platten klappen nach aussen, goldener Rand
          const out = base * (1.0 + 0.45 * easeOutQ(opened));
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
            const a0 = a - 0.32;
            const a1 = a + 0.32;
            const r0 = out;
            const r1 = out + base * 0.38;
            g.poly([cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0, cx + Math.cos(a1) * r0, cy + Math.sin(a1) * r0, cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1, cx + Math.cos(a0) * r1, cy + Math.sin(a0) * r1]).fill({ color: 0x59607a, alpha: 0.9 }).stroke({ width: 2, color: C.gold, alpha: blinking });
          }
        } else {
          // "Boss keucht": nur der pulsierende Ring (kleiner, ohne Platten)
          g.circle(cx, cy, base * (1.0 + 0.12 * pulse)).stroke({ width: 3, color: C.ice, alpha: 0.8 * blinking });
        }
        const mult = (win.damageBp / 10000).toFixed(1);
        this.setLabel(this.labelFor(this.tagTexts, e.id), open ? t('boss.tag.open', { mult }) : t('boss.tag.winded', { mult }), C.teal, cx, cy + base * 1.95, textScale * 0.85);
      }
      if (tr.wards.has(e.id)) {
        g.circle(cx, cy, base * 1.2).fill({ color: C.ice, alpha: 0.12 });
        g.circle(cx, cy, base * 1.2).stroke({ width: 4, color: C.ice, alpha: 0.7 + 0.3 * pulse });
        g.circle(cx, cy, base * 1.38).stroke({ width: 2, color: C.white, alpha: 0.4 });
      }
    }
  }
}

const easeOutQ = (p: number): number => 1 - (1 - p) * (1 - p);
