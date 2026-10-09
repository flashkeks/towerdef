/**
 * Turm-Panel wie BTD6 (Runde 11c, schlank): je Pfad EINE Zeile. Links fuenf Punkte (gekauft = in Pfadfarbe) und die zuletzt
 * gekaufte Stufe, rechts ein grosser Knopf nur fuer die NAECHSTE Stufe (Zustaende: `tier-button.ts`). Nicht freigeschaltete
 * Stufen zeigen die Turm-XP; Klick -> Bestaetigung (Callback `askUnlock`), danach steht der Goldpreis im Knopf. Die 3 x 5
 * Uebersicht bleibt im Freischalt-Menue ("All upgrades").
 * Held: Level, XP-Balken, Faehigkeiten (Aufbau wie in Runde 11), dazu Targeting, Verkaufen, Pops.
 * Das Panel entscheidet nichts: es fragt `game.upgradeInfo` und schickt Kommandos ueber die Callbacks.
 */
import { DATA, type Game, type GameOptions, type GameState, type TargetMode, type TowerState, type TowerType, type UpgradeInfo } from '../sim';
import { h, setText } from '../ui/dom';
import { t } from '../i18n/t';
import { displayName, isHero } from './info';
import { heroPortrait, iconUpgrade, towerSprite } from './sprites';
import { tierButton, type TierBtn } from './tier-button';
import { ABILITY_TEXT, PATH_COLORS, TARGET_TEXT } from './tower-text';
import { copyCanvas, uiIcon } from './ui-icons';

/** Platz fuer den Turm in der Buehne (px): Stufen-Kuerzel oben, Targeting unten bleiben frei. */
const FIG_W = 300, FIG_H = 100;

/** Rand ohne Pixel abschneiden und ganzzahlig so gross zeigen, wie es in die Buehne passt (1..4x). */
export function fitFigure(src: HTMLCanvasElement, maxW: number, maxH: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  const box = opaqueBox(src);
  c.width = box.w; c.height = box.h;
  c.getContext('2d')!.drawImage(src, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
  const sc = figureScale(box.w, box.h, maxW, maxH);
  c.style.width = `${box.w * sc}px`;
  c.style.height = `${box.h * sc}px`;
  c.className = 'px-ic';
  return c;
}

/** Ganzzahliger Massstab (1..4), bei dem w x h in maxW x maxH passt. Reine Funktion. */
export function figureScale(w: number, h: number, maxW: number, maxH: number): number {
  return Math.max(1, Math.min(4, Math.floor(maxW / Math.max(1, w)), Math.floor(maxH / Math.max(1, h))));
}

function opaqueBox(src: HTMLCanvasElement): { x: number; y: number; w: number; h: number } {
  const w = src.width, hh = src.height;
  try {
    const d = src.getContext('2d')!.getImageData(0, 0, w, hh).data;
    let x0 = w, y0 = hh, x1 = -1, y1 = -1;
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 >= 0) return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  } catch { /* Canvas nicht lesbar: ganzes Bild */ }
  return { x: 0, y: 0, w, h: hh };
}

const MODES: TargetMode[] = ['first', 'last', 'strong', 'close'];

export interface PanelCallbacks {
  upgrade(towerId: number, path: 0 | 1 | 2): void;
  sell(towerId: number): void;
  target(towerId: number, mode: TargetMode): void;
  close(): void;
  toast(msg: string): void;
  openUnlock(type: TowerType): void;
  /** Nicht freigeschaltete Stufe angeklickt (Turm-XP reichen): Bestaetigung zeigen. */
  askUnlock(type: TowerType, path: 0 | 1 | 2): void;
}

export class Panel {
  readonly el = h('div', 'm-panel pxbox hidden');
  private towerId: number | null = null;
  private sig = '';
  private popsEl: HTMLElement | null = null;
  private xpFill: HTMLElement | null = null;
  private xpText: HTMLElement | null = null;
  private descBox: HTMLElement | null = null;
  private defaultDesc = '';
  /** Worauf die Maus zeigt (ueberlebt den Neuaufbau): 'next' = Knopf rechts, 'own' = Stufe links */
  private hover: { path: number; which: 'next' | 'own' } | null = null;
  private descs = new Map<string, string>();
  private side: 'left' | 'right' = 'right';

  constructor(private readonly game: Game, private readonly opts: GameOptions, private readonly cb: PanelCallbacks) {}

  get selected(): number | null { return this.towerId; }

  show(id: number | null, towerX = 0): void {
    this.towerId = id;
    this.sig = '';
    this.hover = null;
    this.el.classList.toggle('hidden', id == null);
    // gegenueber dem Turm andocken
    this.side = towerX > 320 ? 'left' : 'right';
    this.el.dataset.side = this.side;
  }

  /** Knopf-Zustand eines Pfads fuer Hotkeys und Panel (gleiche Quelle). */
  buttonFor(towerId: number, path: 0 | 1 | 2): { btn: TierBtn; info: UpgradeInfo; type: TowerType } | null {
    const tw = this.game.state.towers.find((q) => q.id === towerId);
    if (!tw || isHero(tw.type)) return null;
    const info = this.game.upgradeInfo(towerId)[path];
    if (!info) return null;
    return { btn: tierButton(info, this.game.state.towerXp[tw.type as TowerType]), info, type: tw.type as TowerType };
  }

  /** Jeden Frame: baut nur neu, wenn sich etwas Sichtbares geaendert hat. */
  update(state: GameState): void {
    if (this.towerId == null) return;
    const tw = state.towers.find((q) => q.id === this.towerId);
    if (!tw) { this.show(null); this.cb.close(); return; }
    const infos = this.game.upgradeInfo(tw.id);
    const sell = this.game.sellValue(tw.id);
    const hero = isHero(tw.type);
    const xp = hero ? 0 : state.towerXp[tw.type as TowerType];
    const sig = JSON.stringify([tw.tiers, tw.target, tw.heroLevel, tw.camo, infos.map((i) => [i.next, i.price, i.canBuy, i.reason, i.revealed, i.unlocked, i.unlockCost, tierButton(i, xp).kind]), sell, xp, hero ? state.abilities.map((a) => [a.id, a.ready]) : 0]);
    if (sig !== this.sig) {
      this.sig = sig;
      this.build(tw, infos, sell, state);
    }
    if (this.popsEl) setText(this.popsEl, String(tw.pops));
    if (hero && this.xpFill) this.updateXp(tw);
    if (hero) this.updateCooldowns(state);
  }

  private updateXp(tw: TowerState): void {
    const lv = DATA.hero.wren.levels;
    const cur = lv[tw.heroLevel - 1]?.xp ?? 0, nxt = lv[tw.heroLevel]?.xp;
    const pct = nxt == null ? 100 : Math.max(0, Math.min(100, ((tw.heroXp - cur) / (nxt - cur)) * 100));
    this.xpFill!.style.width = `${pct}%`;
    setText(this.xpText!, nxt == null ? t('panel.maxLevel') : `${tw.heroXp} / ${nxt} XP`);
  }

  private updateCooldowns(state: GameState): void {
    for (const a of state.abilities) {
      const el = this.el.querySelector<HTMLElement>(`[data-ab="${a.id}"] .cd`);
      if (el) { el.style.height = a.ready ? '0%' : `${(a.cdLeft / Math.max(1, a.cdTotal)) * 100}%`; }
    }
  }

  private setDesc(text: string): void {
    if (this.descBox) this.descBox.textContent = text;
  }

  private sellButton(tw: TowerState, sell: number): HTMLButtonElement {
    const sellB = h('button', 'p-sell');
    sellB.append(h('span', 'lbl', t('panel.sell')), uiIcon('coin', 2), h('b', 'num', String(sell)));
    sellB.onclick = () => this.cb.sell(tw.id);
    return sellB;
  }

  private build(tw: TowerState, infos: UpgradeInfo[], sell: number, state: GameState): void {
    this.el.replaceChildren();
    this.popsEl = this.xpFill = this.xpText = this.descBox = null;
    this.el.classList.toggle('slim', !isHero(tw.type));
    if (isHero(tw.type)) this.buildHeroPanel(tw, sell, state);
    else this.buildTowerPanel(tw, infos, sell, state);
  }

  // ------------------------------------------------------------------ Turm (schlank)
  private buildTowerPanel(tw: TowerState, infos: UpgradeInfo[], sell: number, state: GameState): void {
    const el = this.el;
    const ty = tw.type as TowerType;
    const xp = state.towerXp[ty];
    // Kopf: Name, Pops, Schliessen
    const head = h('div', 'ps-head');
    head.append(h('div', 'p-title', displayName(ty)));
    const pops = h('div', 'p-pops');
    pops.append(uiIcon('sword', 2), h('span', 'lbl', t('panel.pops')));
    this.popsEl = h('b', 'num', String(tw.pops));
    pops.append(this.popsEl);
    const close = h('button', 'p-close', 'x');
    close.title = t('panel.close');
    close.onclick = () => this.cb.close();
    head.append(pops, close);
    el.append(head);

    // Buehne: Sprite gross in der aktuellen Stufe, Targeting mit Pfeilen
    const stage = h('div', 'ps-stage');
    const spr = towerSprite(ty, tw.tiers, 0, 'idle0');
    const fig = h('div', 'ps-fig');
    fig.append(fitFigure(spr.canvas, FIG_W, FIG_H));
    const label = `${tw.tiers.join(' - ')}${tw.camo ? '  ' + t('panel.camo') : ''}`;
    const mi = MODES.indexOf(tw.target);
    const arrow = (dir: -1 | 1): HTMLButtonElement => {
      const b = h('button', `ps-arrow ${dir < 0 ? 'l' : 'r'}`);
      b.title = t('panel.target');
      b.setAttribute('aria-label', `${t('panel.target')} ${dir < 0 ? '<' : '>'}`);
      b.onclick = () => this.cb.target(tw.id, MODES[(mi + dir + MODES.length) % MODES.length]);
      return b;
    };
    const tg = h('div', 'ps-target', TARGET_TEXT[tw.target]);
    stage.append(fig, h('div', 'ps-tiers', label), arrow(-1), arrow(1), tg);
    el.append(stage);

    // drei Pfadzeilen
    const data = DATA.towers[ty];
    this.descs.clear();
    const rows = h('div', 'ps-rows');
    for (const info of infos) {
      const p = info.path;
      const btn = tierButton(info, xp);
      const pd = data.paths[p];
      const row = h('div', 'ps-row');
      row.style.setProperty('--pc', PATH_COLORS[p]);
      row.dataset.path = String(p);
      row.dataset.kind = btn.kind;

      // links: Punkte + zuletzt gekaufte Stufe
      const own = h('div', 'ps-own');
      const pips = h('div', 'ps-pips');
      for (let i = 0; i < 5; i++) pips.append(h('i', i < info.current ? 'on' : ''));
      own.append(pips);
      const ob = h('div', 'ps-own-b');
      if (info.current > 0) {
        const last = pd.tiers[info.current - 1];
        ob.append(h('div', 'ps-own-ic p-ic'), h('div', 'ps-own-n', last.name), h('div', 'ps-own-s', t('panel.owned')));
        ob.firstElementChild!.append(copyCanvas(iconUpgrade(ty, p, info.current).canvas, 2));
        this.descs.set(`${p}|own`, `${last.name}: ${last.desc}`);
      } else {
        ob.append(h('div', 'ps-own-n none', t('panel.notUpgraded')));
        this.descs.set(`${p}|own`, pd.name);
      }
      own.append(ob);
      own.onmouseenter = () => { this.hover = { path: p, which: 'own' }; this.setDesc(this.descFor(p, 'own')); };
      own.onmouseleave = () => { this.hover = null; this.setDesc(this.defaultDesc); };

      // rechts: der grosse Knopf
      const nb = h('button', `ps-next k-${btn.kind}`);
      nb.dataset.kind = btn.kind;
      nb.disabled = false;
      nb.setAttribute('aria-disabled', btn.clickable ? 'false' : 'true');
      this.fillNext(nb, ty, p, info, btn);
      nb.onmouseenter = () => { this.hover = { path: p, which: 'next' }; this.setDesc(this.descFor(p, 'next')); };
      nb.onmouseleave = () => { this.hover = null; this.setDesc(this.defaultDesc); };
      nb.onclick = () => {
        if (btn.kind === 'buy') this.cb.upgrade(tw.id, p);
        else if (btn.kind === 'unlock') this.cb.askUnlock(ty, p);
        else if (btn.kind === 'needxp') this.cb.toast(t('panel.needXp', { n: btn.xpMissing }));
        else if (btn.kind === 'closed') this.cb.toast(t('reason.crosspath'));
        else if (btn.kind === 'poor') this.cb.toast(t('reason.no-cash'));
      };
      row.append(own, nb);
      rows.append(row);
    }
    el.append(rows);

    // Infozeile
    this.defaultDesc = t('panel.hoverHint');
    this.descBox = h('div', 'p-desc ps-desc', this.defaultDesc);
    el.append(this.descBox);
    if (this.hover) this.setDesc(this.descFor(this.hover.path, this.hover.which));

    // Fuss: Verkaufen, alle Stufen
    const foot = h('div', 'p-foot');
    const ready = this.game.unlockInfo(ty).some((pi) => pi.next != null && pi.reason == null);
    const ub = h('button', `p-unlock${ready ? ' ready' : ''}`);
    ub.append(uiIcon('bolt', 2), h('span', 'lbl', t('panel.allUpgrades')), h('b', 'num', `${xp} XP`));
    ub.title = t('panel.towerXp');
    ub.onclick = () => this.cb.openUnlock(ty);
    foot.append(ub, this.sellButton(tw, sell));
    el.append(foot);
  }

  private descFor(path: number, which: 'next' | 'own'): string {
    return this.descs.get(`${path}|${which}`) ?? this.defaultDesc;
  }

  /** Inhalt des grossen Knopfs je Zustand; legt auch den Hover-Text der naechsten Stufe ab. */
  private fillNext(nb: HTMLElement, ty: TowerType, p: 0 | 1 | 2, info: UpgradeInfo, btn: TierBtn): void {
    const pd = DATA.towers[ty].paths[p];
    const key = `${p}|next`;
    if (btn.kind === 'maxed') {
      nb.append(h('div', 'pn-state', t('panel.maxed')));
      this.descs.set(key, `${pd.name}: ${t('panel.maxedHint')}`);
      return;
    }
    if (btn.kind === 'closed') {
      nb.append(h('div', 'pn-state', t('panel.pathClosed')));
      this.descs.set(key, t('panel.closedHint'));
      return;
    }
    const ic = h('div', 'pn-ic p-ic');
    ic.append(btn.hidden ? uiIcon('lock', 3) : copyCanvas(iconUpgrade(ty, p, btn.tier).canvas, btn.kind === 'needxp' ? 2 : 3));
    nb.append(ic);
    nb.append(h('div', 'pn-name', btn.hidden ? t('panel.hidden') : info.name));
    const st = h('div', 'pn-price');
    if (btn.kind === 'buy' || btn.kind === 'poor') st.append(uiIcon('coin', 2), h('b', 'num', String(btn.price)));
    else st.append(uiIcon('bolt', 2), h('b', 'num', `${btn.xpCost} XP`));
    nb.append(st);
    if (btn.kind === 'needxp') nb.append(h('div', 'pn-need', t('panel.needXp', { n: btn.xpMissing })));
    let desc = btn.hidden ? t('panel.hiddenHint') : `${info.name}: ${info.desc}`;
    if (btn.kind === 'unlock') desc += `  [${t('panel.clickUnlock')}]`;
    this.descs.set(key, desc);
  }

  // ------------------------------------------------------------------ Held (wie Runde 11)
  private buildHeroPanel(tw: TowerState, sell: number, state: GameState): void {
    const el = this.el;
    const head = h('div', 'p-head');
    const port = h('div', 'p-port');
    port.append(copyCanvas(heroPortrait().canvas, 2));
    const nm = h('div', 'p-name');
    nm.append(h('div', 'p-title', displayName(tw.type)), h('div', 'p-sub', t('panel.level', { n: tw.heroLevel })));
    const pops = h('div', 'p-pops');
    pops.append(uiIcon('sword', 2), h('span', 'lbl', t('panel.pops')));
    this.popsEl = h('b', 'num', String(tw.pops));
    pops.append(this.popsEl);
    const close = h('button', 'p-close', 'x');
    close.title = t('panel.close');
    close.onclick = () => this.cb.close();
    head.append(port, nm, pops, close);
    el.append(head);

    const trow = h('div', 'p-target');
    trow.append(h('span', 'lbl', t('panel.target')));
    const seg = h('div', 'seg');
    for (const m of MODES) {
      const b = h('button', `seg-b${tw.target === m ? ' on' : ''}`, TARGET_TEXT[m]);
      b.onclick = () => this.cb.target(tw.id, m);
      seg.append(b);
    }
    trow.append(seg);
    el.append(trow);

    this.buildHero(tw, state);
    this.descBox = h('div', 'p-desc', this.defaultDesc);
    el.append(this.descBox);
    const foot = h('div', 'p-foot');
    foot.append(this.sellButton(tw, sell));
    el.append(foot);
  }

  private buildHero(tw: TowerState, state: GameState): void {
    const wrap = h('div', 'p-hero');
    const lv = DATA.hero.wren.levels;
    const xpBar = h('div', 'xp');
    this.xpFill = h('div', 'xp-fill');
    this.xpText = h('div', 'xp-t');
    xpBar.append(this.xpFill, this.xpText);
    wrap.append(xpBar);
    const nxt = lv[tw.heroLevel];
    this.defaultDesc = nxt ? t('panel.nextLevel', { desc: nxt.desc }) : t('panel.maxLevel');
    // Faehigkeiten
    const abs = h('div', 'p-abs');
    abs.append(h('div', 'lbl', t('panel.ability')));
    for (const a of state.abilities.filter((q) => q.id === 'flare' || q.id === 'dawnbreak')) {
      const b = h('div', 'ab-card');
      b.dataset.ab = a.id;
      b.append(h('b', '', ABILITY_TEXT[a.id].name), h('span', 'small', ABILITY_TEXT[a.id].desc), h('div', 'cd'));
      abs.append(b);
    }
    if (!abs.querySelector('.ab-card')) abs.append(h('span', 'small muted', lv.filter((l) => /Ability/.test(l.desc)).map((l) => `Level ${l.level}: ${l.desc.replace(/^Ability: /, '').split(' - ')[0]}`).join('   ')));
    wrap.append(abs);
    this.el.append(wrap);
    this.updateXp(tw);
  }
}
