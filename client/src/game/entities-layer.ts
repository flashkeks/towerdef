/**
 * Units, Beschwoerungen und Gegner auf dem Feld (Runde 10 / P2): Porträt-Figuren statt Buchstaben-Kreisen, gestaltete Gegner je Typ.
 * Alle Bilder kommen als gebackene Texturen aus `figures.ts`; je Frame werden nur Position, Wippen, Drehung und Alpha gesetzt.
 *
 * Unit: Schatten, Scheibe mit Seltenheits-Ring (Mythic+ mit drehendem Glanz), Blickrichtungs-Keil zum Ziel, Rueckstoss + Aufleuchten beim
 * Schuss, Stufen-Pips unten, Element-Abzeichen oben links, Faehigkeit-bereit-Zeichen oben rechts, Aufsetz-Hopser nach dem Platzieren.
 * Gegner: Figur mit zwei Schrittbildern und Wippen, Blitz bei Treffer, Lebensbalken aus Sprites (kein Neuzeichnen), Aura unter Elite/Boss,
 * Namensbanner ueber dem Boss, kurze Aufloesung beim Tod. Treffer- und Splitter-Effekte bleiben in `fx.ts`.
 */
import { BitmapText, Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { EnemyState, SummonState, UnitDef, UnitState } from '../sim';
import { t } from '../i18n/t';
import { pickTarget } from '../view/feel';
import { dropIn, enemyLook, idleBob, pipCount, rarityLook, turnToward, unitLook } from '../view/look';
import { bossDisplayName, enemyHpRatio, hpBarColor, statusMarks, statusTint } from '../view/model';
import { reachMilli } from '../view/unit-info';
import { C } from './palette';
import type { RenderContext } from './context';
import { unitRadius } from './figures';
import type { Session } from './session';

interface UnitView {
  c: Container;
  body: Container;
  fig: Sprite;
  flash: Sprite;
  shine: Sprite | null;
  wedge: Sprite;
  badge: Sprite;
  g: Graphics;
  shadow: Sprite;
  version: number;
  rev: number;
  sig: string;
  aim: number;
  aimTo: number;
  hasAim: boolean;
  recoil: number;
  born: number;
  pop: number;
  R: number;
}
interface SummonView {
  c: Container;
  fig: Sprite;
  g: Graphics;
  version: number;
  sig: string;
}
interface EnemyView {
  c: Container;
  body: Sprite;
  flash: Sprite;
  shadow: Sprite;
  aura: Sprite | null;
  back: Sprite;
  fill: Sprite;
  shieldBar: Sprite;
  tag: BitmapText | null;
  plate: Container | null;
  faceLeft: boolean;
  frame: number;
  half: number;
  R: number;
  barW: number;
  barTop: number;
  version: number;
  sig: string;
  lastHp: number;
  hitT: number;
  born: number;
}
interface Dying {
  c: Container;
  t: number;
  dur: number;
  sx: number;
}

const DROP_MS = 380;
const RECOIL_S = 0.16;
const MAX_DYING = 40;

export class EntitiesLayer {
  readonly unitLayer = new Container();
  readonly enemyLayer = new Container();
  private unitViews = new Map<number, UnitView>();
  private enemyViews = new Map<number, EnemyView>();
  private summonViews = new Map<number, SummonView>();
  private dying: Dying[] = [];
  /** Letzte Canvas-Position je Gegner (fuer Effekte an Gegner-Positionen, z. B. Kill-Popup). */
  private lastPos = new Map<number, { x: number; y: number }>();
  private placed = new Set<number>();
  private killed = new Set<number>();
  private frameNo = 0;
  private lastNow = 0;

  constructor(private readonly ctx: RenderContext) {
    this.enemyLayer.sortableChildren = true;
    this.unitLayer.sortableChildren = true;
  }

  /** Alle Ansichten verwerfen (neue Runde). */
  reset(): void {
    for (const v of this.unitViews.values()) v.c.destroy({ children: true });
    for (const v of this.enemyViews.values()) v.c.destroy({ children: true });
    for (const v of this.summonViews.values()) v.c.destroy({ children: true });
    for (const d of this.dying) d.c.destroy({ children: true });
    this.unitViews.clear();
    this.summonViews.clear();
    this.enemyViews.clear();
    this.dying = [];
    this.lastPos.clear();
    this.placed.clear();
    this.killed.clear();
  }

  /** Fx meldet: Unit wurde gerade gesetzt (Aufsetz-Hopser beim Anlegen der Ansicht). */
  markPlaced(unitId: number): void {
    this.placed.add(unitId);
  }

  /** Fx meldet: Unit wurde hochgestuft (kurzes Aufploppen). */
  markUpgraded(unitId: number): void {
    const v = this.unitViews.get(unitId);
    if (v) v.pop = 1;
  }

  /** Fx meldet: Gegner starb (Aufloesung statt Verschwinden). */
  markKilled(enemyId: number): void {
    this.killed.add(enemyId);
  }

  /** Fx meldet einen Schuss: Blick zum Ziel, Rueckstoss, Aufleuchten. Winkel im Bildschirm (rad). */
  unitShot(unitId: number, ang: number): void {
    const v = this.unitViews.get(unitId);
    if (!v) return;
    v.aimTo = ang;
    if (!v.hasAim) v.aim = ang;
    v.hasAim = true;
    v.recoil = RECOIL_S;
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

  /** Mitte einer Unit-Figur (fuer Effekte), inkl. Wippen. */
  unitView(id: number): { x: number; y: number; R: number } | undefined {
    const v = this.unitViews.get(id);
    return v ? { x: v.c.x + v.body.x, y: v.c.y + v.body.y, R: v.R } : undefined;
  }

  /** Zaehler fuer Pruefskripte. */
  get counts(): { units: number; enemies: number; summons: number; dying: number } {
    return { units: this.unitViews.size, enemies: this.enemyViews.size, summons: this.summonViews.size, dying: this.dying.length };
  }

  sync(session: Session, nowMs: number): void {
    const dt = this.lastNow ? Math.min(0.1, (nowMs - this.lastNow) / 1000) : 0;
    this.lastNow = nowMs;
    this.frameNo++;
    const paused = session.paused;
    this.syncUnits(session, session.sim.state.units, nowMs, paused ? 0 : dt);
    this.syncEnemies(session, session.sim.state.enemies, nowMs, paused ? 0 : dt);
    this.syncSummons(session, session.sim.state.summons ?? []);
    this.updateDying(dt);
  }

  // ---- Units ---------------------------------------------------------------------------------------------------------

  private makeUnit(def: UnitDef, nowMs: number, fresh: boolean): UnitView {
    const { ctx } = this;
    const T = ctx.tile;
    const fg = ctx.figures;
    const c = new Container();
    const shadow = new Sprite(fg.shadow(T));
    shadow.anchor.set(0.5);
    const R = unitRadius(T, def.footprint);
    shadow.scale.set(def.footprint === 2 ? 1.9 : 1);
    shadow.position.set(0, R * 0.92);
    const body = new Container();
    const f = fg.unit(def, T);
    const fig = new Sprite(f.tex);
    fig.anchor.set(0.5);
    const flash = new Sprite(f.tex);
    flash.anchor.set(0.5);
    flash.blendMode = 'add';
    flash.alpha = 0;
    flash.visible = false;
    const rl = rarityLook(def.rarity);
    let shine: Sprite | null = null;
    if (rl.live) {
      shine = new Sprite(fg.shine(def.rarity, T, def.footprint));
      shine.anchor.set(0.5);
      shine.alpha = 0.55;
      shine.tint = rl.a;
    }
    const wedge = new Sprite(fg.wedge(T, def.footprint));
    wedge.anchor.set(0.5);
    wedge.tint = rl.a;
    wedge.visible = false;
    body.addChild(fig, flash);
    if (shine) body.addChild(shine);
    body.addChild(wedge);
    const look = unitLook(def);
    const badge = new Sprite(fg.badge(look.key, T));
    badge.anchor.set(0.5);
    badge.position.set(-R * 0.74, -R * 0.74);
    const g = new Graphics();
    c.addChild(shadow, body, badge, g);
    this.unitLayer.addChild(c);
    return { c, body, fig, flash, shine, wedge, badge, g, shadow, version: ctx.version, rev: fg.rev, sig: '', aim: 0, aimTo: 0, hasAim: false, recoil: 0, born: fresh ? nowMs : -1e9, pop: 0, R };
  }

  private syncUnits(session: Session, units: readonly UnitState[], nowMs: number, dt: number): void {
    const { ctx } = this;
    const T = ctx.tile;
    const seen = new Set<number>();
    const enemies = session.sim.state.enemies;
    for (const u of units) {
      seen.add(u.id);
      const def = ctx.defs[u.defId];
      if (!def) continue;
      let v = this.unitViews.get(u.id);
      if (!v || v.version !== ctx.version) {
        v?.c.destroy({ children: true });
        const fresh = this.placed.delete(u.id);
        v = this.makeUnit(def, nowMs, fresh);
        this.unitViews.set(u.id, v);
      } else if (v.rev !== ctx.figures.rev) {
        // Portraet nachgeladen: Textur tauschen
        v.rev = ctx.figures.rev;
        const f = ctx.figures.unit(def, T);
        v.fig.texture = f.tex;
        v.flash.texture = f.tex;
      }
      const pos = ctx.px(u.x / 1000, u.y / 1000);
      const kind = session.sim.zoneAt(u.x, u.y) === 'hill' ? 'hill' : 'ground';
      const lift = kind === 'hill' ? T * 0.1 : 0;
      v.c.position.set(Math.round(pos.x), Math.round(pos.y - lift));
      v.c.zIndex = pos.y;

      // Blickrichtung: alle 6 Frames (versetzt je Unit) das Ziel nachbilden, dazwischen weich drehen
      if ((this.frameNo + u.id) % 6 === 0 && def.attack) {
        const tg = pickTarget({ x: u.x, y: u.y }, reachMilli(def, u.level), def.canHitAir, u.targeting, enemies, 200);
        if (tg) {
          v.aimTo = Math.atan2(tg.y - u.y, tg.x - u.x);
          if (!v.hasAim) v.aim = v.aimTo;
          v.hasAim = true;
        }
      }
      if (v.hasAim) {
        v.aim = turnToward(v.aim, v.aimTo, dt * 9);
        v.wedge.visible = true;
        v.wedge.rotation = v.aim;
      }
      // Wippen, Aufsetzen, Rueckstoss, Aufploppen
      const sinceDrop = nowMs - v.born;
      let scale = 1;
      let sy = 1;
      let yOff = idleBob(nowMs, u.id) * T - T * 0.06;
      if (sinceDrop < DROP_MS) {
        const d = dropIn(sinceDrop / DROP_MS);
        scale = d.scale;
        sy = d.squash;
        yOff -= d.lift * T;
        v.c.alpha = Math.min(1, 0.3 + sinceDrop / (DROP_MS * 0.5));
      } else if (v.c.alpha !== 1) v.c.alpha = 1;
      let xOff = v.hasAim ? Math.cos(v.aim) * T * 0.025 : 0;
      if (v.recoil > 0) {
        v.recoil = Math.max(0, v.recoil - dt);
        const k = v.recoil / RECOIL_S;
        xOff -= Math.cos(v.aim) * T * 0.09 * k;
        yOff -= Math.sin(v.aim) * T * 0.09 * k;
        v.flash.visible = true;
        v.flash.alpha = 0.55 * k;
      } else if (v.flash.visible) v.flash.visible = false;
      if (v.pop > 0) {
        v.pop = Math.max(0, v.pop - dt * 3.2);
        scale *= 1 + Math.sin(v.pop * Math.PI) * 0.18;
      }
      v.body.position.set(xOff, yOff);
      v.body.scale.set(scale / Math.sqrt(sy), scale * sy);
      v.badge.position.set(-v.R * 0.74 + xOff, -v.R * 0.74 + yOff);
      if (v.shine) v.shine.rotation = (nowMs / 1000) * (def.rarity === 'Secret' ? 1.6 : 0.9);

      const selected = session.selectedUnit === u.id;
      const ready = def.abilities.some((a, i) => a.trigger === 'button' && u.level >= a.minLevel && (u.ab?.[i] ?? 0) === 0);
      const sig = `${u.level}|${selected}|${ready}`;
      if (ready) v.g.alpha = 0.75 + Math.sin(nowMs / 160) * 0.25;
      else if (v.g.alpha !== 1) v.g.alpha = 1;
      if (sig === v.sig) continue;
      v.sig = sig;
      this.drawUnitMarks(v, def, u, selected, ready);
    }
    for (const [id, v] of this.unitViews) {
      if (!seen.has(id)) {
        v.c.destroy({ children: true });
        this.unitViews.delete(id);
      }
    }
  }

  /** Stufen-Pips (unten am Ring), Auswahl am Boden, Faehigkeit bereit (oben rechts). Nur bei geaenderter Signatur. */
  private drawUnitMarks(v: UnitView, def: UnitDef, u: UnitState, selected: boolean, ready: boolean): void {
    const g = v.g;
    const T = this.ctx.tile;
    const R = v.R;
    g.clear();
    if (selected) {
      g.ellipse(0, R * 0.92, R * 1.25, R * 0.42).stroke({ width: Math.max(2, T * 0.05), color: C.white, alpha: 0.95 });
      g.ellipse(0, R * 0.92, R * 1.45, R * 0.52).stroke({ width: Math.max(1, T * 0.025), color: C.gold, alpha: 0.7 });
    }
    const n = pipCount(u.level);
    if (n > 0) {
      const max = u.level >= def.maxLevel;
      const s = Math.max(3, T * 0.065);
      const gap = s * 1.55;
      const y = R * 0.98 - T * 0.06;
      const x0 = -((n - 1) * gap) / 2;
      const col = max ? 0x7ff0ff : C.gold;
      g.roundRect(x0 - s * 1.1, y - s * 1.0, (n - 1) * gap + s * 2.2, s * 2.0, s).fill({ color: 0x0b0d1b, alpha: 0.85 });
      for (let i = 0; i < n; i++) {
        const x = x0 + i * gap;
        g.poly([x, y - s * 0.8, x + s * 0.62, y, x, y + s * 0.8, x - s * 0.62, y]).fill({ color: col }).stroke({ width: 1, color: 0x2a1e3a, alpha: 0.8 });
      }
    }
    if (ready) {
      const bx = R * 0.78;
      const by = -R * 0.78;
      const k = Math.max(5, T * 0.13);
      g.circle(bx, by, k * 1.25).fill({ color: C.teal, alpha: 0.3 });
      g.circle(bx, by, k).fill({ color: 0x0b2a2a }).stroke({ width: Math.max(1.5, k * 0.18), color: C.teal });
      g.poly([bx + k * 0.15, by - k * 0.7, bx - k * 0.45, by + k * 0.1, bx - k * 0.02, by + k * 0.1, bx - k * 0.15, by + k * 0.7, bx + k * 0.45, by - k * 0.1, bx + k * 0.02, by - k * 0.1]).fill({ color: C.teal });
    }
  }

  // ---- Beschwoerungen ------------------------------------------------------------------------------------------------

  /** Beschwoerung: kleine Figur des Beschwoerers mit tuerkisem Rand, Lebensdauer-Bogen, Haltbarkeitsbalken. */
  private syncSummons(session: Session, list: readonly SummonState[]): void {
    const { ctx } = this;
    const T = ctx.tile;
    const defs = session.sim.summonDefs();
    const seen = new Set<number>();
    for (const s of list) {
      const sd = defs[s.def];
      if (!sd) continue;
      seen.add(s.id);
      let v = this.summonViews.get(s.id);
      if (!v || v.version !== ctx.version) {
        v?.c.destroy({ children: true });
        const parent = session.sim.state.units.find((u) => u.id === s.parent);
        const pdef = parent ? ctx.defs[parent.defId] : undefined;
        const c = new Container();
        const shadow = new Sprite(ctx.figures.shadow(T));
        shadow.anchor.set(0.5);
        shadow.scale.set(0.7);
        shadow.position.set(0, T * 0.25);
        const fig = new Sprite(pdef ? ctx.figures.unit(pdef, T).tex : Texture.EMPTY);
        fig.anchor.set(0.5);
        fig.scale.set(0.68);
        fig.tint = 0xc8fff6;
        const g = new Graphics();
        c.addChild(shadow, fig, g);
        this.unitLayer.addChild(c);
        v = { c, fig, g, version: ctx.version, sig: '' };
        this.summonViews.set(s.id, v);
      }
      const p = ctx.px(s.x / 1000, s.y / 1000);
      v.c.position.set(Math.round(p.x), Math.round(p.y));
      v.c.zIndex = p.y;
      v.fig.y = Math.sin(performance.now() / 140 + s.id) * T * 0.03 - T * 0.04;
      const r = T * 0.27;
      const lifeRatio = s.life > 0 && sd.lifeTicks > 0 ? Math.round((s.life / sd.lifeTicks) * 24) / 24 : 1;
      const hpRatio = Math.round(Math.max(0, Math.min(1, s.hp / sd.durabilityTicks)) * 20) / 20;
      const sig = `${lifeRatio}|${hpRatio}`;
      if (sig === v.sig) continue;
      v.sig = sig;
      v.g.clear();
      v.g.circle(0, -T * 0.04, r + 2).stroke({ width: 2, color: C.teal, alpha: 0.6 });
      if (lifeRatio < 1) v.g.arc(0, -T * 0.04, r + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lifeRatio).stroke({ width: 2, color: C.teal, alpha: 0.95 });
      if (hpRatio < 1) {
        v.g.roundRect(-r, r + 6, r * 2, 4, 2).fill({ color: 0x0b0d1b });
        v.g.roundRect(-r, r + 6, Math.max(2, r * 2 * hpRatio), 4, 2).fill(hpBarColor(hpRatio));
      }
    }
    for (const [id, v] of this.summonViews) {
      if (!seen.has(id)) {
        v.c.destroy({ children: true });
        this.summonViews.delete(id);
      }
    }
  }

  // ---- Gegner --------------------------------------------------------------------------------------------------------

  private makeEnemy(session: Session, e: EnemyState, nowMs: number): EnemyView {
    const { ctx } = this;
    const T = ctx.tile;
    const fg = ctx.figures;
    const look = enemyLook(e.type);
    const f = fg.enemy(e.type, T, 0);
    const c = new Container();
    const shadow = new Sprite(fg.shadow(T));
    shadow.anchor.set(0.5);
    shadow.scale.set(Math.max(0.5, look.radius * 2.6));
    shadow.alpha = e.flying ? 0.55 : 1;
    shadow.position.set(0, f.R * (e.flying ? 1.6 : 0.95));
    c.addChild(shadow);
    let aura: Sprite | null = null;
    if (e.boss || e.elite) {
      aura = new Sprite(fg.aura(T, look.radius * (e.boss ? 1.45 : 1.25), e.boss ? look.edge : look.edge));
      aura.anchor.set(0.5);
      aura.alpha = e.boss ? 0.8 : 0.55;
      aura.scale.y = 0.45;
      aura.position.set(0, f.R * 0.9);
      c.addChild(aura);
    }
    const body = new Sprite(f.tex);
    body.anchor.set(0.5);
    const flash = new Sprite(fg.enemyFlash(e.type, T));
    flash.anchor.set(0.5);
    flash.blendMode = 'add';
    flash.visible = false;
    c.addChild(body, flash);
    // Lebensbalken: Sprites mit weisser Textur (Breite und Farbe ueber Skalierung/Toenung, kein Neuzeichnen)
    const barW = Math.round(Math.max(T * 0.55, Math.min(f.R * 2.1, T * 1.9)));
    const barH = e.boss ? Math.max(6, Math.round(T * 0.12)) : Math.max(4, Math.round(T * 0.075));
    const barTop = Math.round(-f.R * 1.25 - barH - 2);
    const back = new Sprite(Texture.WHITE);
    back.tint = 0x0b0d1b;
    back.alpha = 0.9;
    back.width = barW + 2;
    back.height = barH + 2;
    back.position.set(-barW / 2 - 1, barTop - 1);
    const fill = new Sprite(Texture.WHITE);
    fill.height = barH;
    fill.position.set(-barW / 2, barTop);
    const shieldBar = new Sprite(Texture.WHITE);
    shieldBar.tint = 0xdff4ff;
    shieldBar.height = Math.max(2, Math.round(barH * 0.45));
    shieldBar.width = barW;
    shieldBar.position.set(-barW / 2, barTop - shieldBar.height - 1);
    shieldBar.visible = false;
    c.addChild(back, fill, shieldBar);
    let plate: Container | null = null;
    if (e.boss) {
      // Namensbanner ueber dem Boss
      plate = new Container();
      const kit = e.bossRun?.kit;
      const name = bossDisplayName(kit ? t(`boss.kit.${kit}`) : t('enemy.boss.name')).toUpperCase();
      const txt = new BitmapText({ text: name, style: { fontFamily: 'Cinzel, Georgia, serif', fontSize: 30, fontWeight: '700', fill: 0xfbe7a6 } });
      txt.scale.set(Math.max(0.42, T / 90));
      txt.anchor.set(0.5);
      const w = txt.width + T * 0.6;
      const h = txt.height + T * 0.16;
      const bg = new Graphics();
      bg.poly([-w / 2 - h * 0.4, 0, -w / 2, -h / 2, w / 2, -h / 2, w / 2 + h * 0.4, 0, w / 2, h / 2, -w / 2, h / 2]).fill({ color: 0x1a0610, alpha: 0.92 }).stroke({ width: 2, color: 0xe9c56b });
      bg.moveTo(-w / 2 + 4, h / 2 - 3).lineTo(w / 2 - 4, h / 2 - 3).stroke({ width: 1, color: 0xff4a6a, alpha: 0.8 });
      plate.addChild(bg, txt);
      plate.position.set(0, barTop - h * 0.75 - 4);
      c.addChild(plate);
    }
    this.enemyLayer.addChild(c);
    return { c, body, flash, shadow, aura, back, fill, shieldBar, tag: null, plate, faceLeft: false, frame: 0, half: f.half, R: f.R, barW, barTop, version: ctx.version, sig: '', lastHp: e.hp + e.shield, hitT: 0, born: session.sim.state.tick > 0 ? nowMs : -1e9 };
  }

  private syncEnemies(session: Session, enemies: readonly EnemyState[], nowMs: number, dt: number): void {
    const { ctx } = this;
    const T = ctx.tile;
    const seen = new Set<number>();
    for (const e of enemies) {
      seen.add(e.id);
      let v = this.enemyViews.get(e.id);
      if (!v || v.version !== ctx.version) {
        v?.c.destroy({ children: true });
        v = this.makeEnemy(session, e, nowMs);
        this.enemyViews.set(e.id, v);
      }
      const look = enemyLook(e.type);
      const prev = session.prevPos.get(e.id) ?? { x: e.x, y: e.y };
      const x = (prev.x + (e.x - prev.x) * session.alpha) / 1000;
      const y = (prev.y + (e.y - prev.y) * session.alpha) / 1000;
      const p = ctx.px(x, y);
      const moving = e.stunTicks === 0 && e.uncTicks === 0;
      const ph = nowMs / 1000 + e.id * 0.37;
      const bob = moving ? Math.abs(Math.sin(ph * look.bobHz * Math.PI)) * look.bobDepth * T : 0;
      const hover = e.flying ? Math.sin(ph * 2.2) * T * 0.05 + T * 0.18 : 0;
      if (Math.abs(e.x - prev.x) > 20) v.faceLeft = e.x < prev.x;
      // Schrittbild
      const frame = moving ? Math.floor(ph * look.bobHz * 2) % 2 : 0;
      if (frame !== v.frame) {
        v.frame = frame;
        v.body.texture = ctx.figures.enemy(e.type, T, frame).tex;
      }
      const sx = v.faceLeft ? -1 : 1;
      v.body.scale.x = sx;
      v.flash.scale.x = sx;
      v.body.y = -bob - hover;
      v.flash.y = v.body.y;
      v.c.position.set(Math.round(p.x), Math.round(p.y));
      v.c.zIndex = p.y + (e.boss ? 0.5 : 0);
      this.lastPos.set(e.id, { x: p.x, y: p.y });
      if (v.aura) v.aura.rotation = nowMs / 1400;
      // Auftauchen
      const since = nowMs - v.born;
      if (since < 260) {
        v.c.alpha = since / 260;
        v.body.scale.y = 0.6 + 0.4 * (since / 260);
      } else {
        v.c.alpha = e.stunTicks > 0 || e.uncTicks > 0 ? 0.75 : 1;
        v.body.scale.y = 1;
      }
      // Treffer-Blitz bei HP-Verlust
      const hp = e.hp + e.shield;
      if (hp < v.lastHp) v.hitT = 0.12;
      v.lastHp = hp;
      if (v.hitT > 0) {
        v.hitT = Math.max(0, v.hitT - dt);
        v.flash.visible = true;
        v.flash.alpha = (v.hitT / 0.12) * 0.75;
      } else if (v.flash.visible) v.flash.visible = false;
      const tint = statusTint(e);
      if (v.body.tint !== tint) v.body.tint = tint;
      // Lebensbalken
      const ratio = enemyHpRatio(e);
      const fillPx = Math.max(0, Math.round(v.barW * ratio));
      const marks = statusMarks(e);
      const sig = `${fillPx}|${e.shield > 0}|${marks}`;
      if (sig !== v.sig) {
        v.sig = sig;
        v.fill.width = fillPx;
        v.fill.visible = fillPx > 0;
        v.fill.tint = e.boss ? (ratio > 0.5 ? 0xff4a6a : ratio > 0.25 ? 0xff8d4e : 0xffd34a) : hpBarColor(ratio);
        v.shieldBar.visible = e.shield > 0;
        if (marks && !v.tag) {
          v.tag = new BitmapText({ text: marks, style: { fontFamily: 'Rajdhani, monospace', fontSize: 22, fontWeight: '700', fill: 0xffffff } });
          v.tag.scale.set(Math.max(0.4, T / 110));
          v.c.addChild(v.tag);
        }
        if (v.tag) {
          v.tag.text = marks;
          v.tag.visible = marks !== '';
          v.tag.position.set(v.barW / 2 + 3, v.barTop - v.tag.height / 2 + 2);
        }
      }
    }
    for (const [id, v] of this.enemyViews) {
      if (seen.has(id)) continue;
      this.enemyViews.delete(id);
      if (this.killed.delete(id) && this.dying.length < MAX_DYING) {
        // Aufloesung: Balken weg, Figur blitzt weiss, waechst und verblasst
        v.back.visible = false;
        v.fill.visible = false;
        v.shieldBar.visible = false;
        if (v.tag) v.tag.visible = false;
        if (v.plate) v.plate.visible = false;
        v.flash.visible = true;
        v.flash.alpha = 1;
        this.dying.push({ c: v.c, t: 0, dur: v.plate ? 0.7 : 0.32, sx: v.body.scale.x });
      } else v.c.destroy({ children: true });
    }
    this.killed.clear();
    if (this.lastPos.size > 400) for (const id of [...this.lastPos.keys()].slice(0, 200)) if (!seen.has(id)) this.lastPos.delete(id);
  }

  private updateDying(dt: number): void {
    if (this.dying.length === 0) return;
    this.dying = this.dying.filter((d) => {
      d.t += dt;
      const p = d.t / d.dur;
      if (p >= 1) {
        d.c.destroy({ children: true });
        return false;
      }
      d.c.alpha = 1 - p;
      const s = 1 + p * 0.35;
      d.c.scale.set(s, s * (1 - p * 0.5));
      return true;
    });
  }
}
