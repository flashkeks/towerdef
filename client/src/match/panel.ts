/**
 * Upgrade-Panel wie BTD6 (Runde 11 / P3): drei Pfade nebeneinander, je 5 Stufen mit Pixel-Icon, Name, Preis, Kaufknopf.
 * Gesperrt durch Crosspath ("Path closed") oder Turm-XP ("Unlock with Tower XP") ist sichtbar, zu wenig Geld rot.
 * Held: Level, XP-Balken, Faehigkeiten. Dazu Targeting-Umschalter, Verkaufen mit Wert, Pops-Zaehler.
 * Das Panel entscheidet nichts: es fragt `game.upgradeInfo` und schickt Kommandos ueber die Callbacks.
 */
import { DATA, round5, type Game, type GameOptions, type GameState, type TargetMode, type TowerState, type UpgradeInfo } from '../sim';
import { h, setText } from '../ui/dom';
import { t } from '../i18n/t';
import { displayName, isHero } from './info';
import { towerSprite, heroSprite, iconUpgrade } from './sprites';
import { ABILITY_TEXT, PATH_COLORS, TARGET_TEXT } from './tower-text';
import { copyCanvas, uiIcon } from './ui-icons';

const MODES: TargetMode[] = ['first', 'last', 'strong', 'close'];

export interface PanelCallbacks {
  upgrade(towerId: number, path: 0 | 1 | 2): void;
  sell(towerId: number): void;
  target(towerId: number, mode: TargetMode): void;
  close(): void;
  toast(msg: string): void;
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
  private side: 'left' | 'right' = 'right';

  constructor(private readonly game: Game, private readonly opts: GameOptions, private readonly cb: PanelCallbacks) {}

  get selected(): number | null { return this.towerId; }

  show(id: number | null, towerX = 0): void {
    this.towerId = id;
    this.sig = '';
    this.el.classList.toggle('hidden', id == null);
    // gegenueber dem Turm andocken
    this.side = towerX > 320 ? 'left' : 'right';
    this.el.dataset.side = this.side;
  }

  /** Jeden Frame: baut nur neu, wenn sich etwas Sichtbares geaendert hat. */
  update(state: GameState): void {
    if (this.towerId == null) return;
    const tw = state.towers.find((q) => q.id === this.towerId);
    if (!tw) { this.show(null); this.cb.close(); return; }
    const infos = this.game.upgradeInfo(tw.id);
    const sell = this.game.sellValue(tw.id);
    const sig = JSON.stringify([tw.tiers, tw.target, tw.heroLevel, tw.camo, infos.map((i) => [i.next, i.price, i.canBuy, i.reason]), sell, isHero(tw.type) ? state.abilities.map((a) => [a.id, a.ready]) : 0]);
    if (sig !== this.sig) {
      this.sig = sig;
      this.build(tw, infos, sell, state);
    }
    if (this.popsEl) setText(this.popsEl, String(tw.pops));
    if (isHero(tw.type) && this.xpFill) this.updateXp(tw);
    if (isHero(tw.type)) this.updateCooldowns(state);
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

  private build(tw: TowerState, infos: UpgradeInfo[], sell: number, state: GameState): void {
    const el = this.el;
    el.replaceChildren();
    const hero = isHero(tw.type);
    // Kopf
    const head = h('div', 'p-head');
    const spr = hero ? heroSprite(tw.heroLevel, 0, 'idle0') : towerSprite(tw.type, tw.tiers, 0, 'idle0');
    const port = h('div', 'p-port');
    port.append(copyCanvas(spr.canvas, 2));
    const nm = h('div', 'p-name');
    nm.append(h('div', 'p-title', displayName(tw.type)));
    if (hero) nm.append(h('div', 'p-sub', t('panel.level', { n: tw.heroLevel })));
    else nm.append(h('div', 'p-sub', `${tw.tiers.join(' - ')}${tw.camo ? '  ' + t('panel.camo') : ''}`));
    const pops = h('div', 'p-pops');
    pops.append(uiIcon('sword', 2), h('span', 'lbl', t('panel.pops')));
    this.popsEl = h('b', 'num', String(tw.pops));
    pops.append(this.popsEl);
    const close = h('button', 'p-close', 'x');
    close.title = t('panel.close');
    close.onclick = () => this.cb.close();
    head.append(port, nm, pops, close);
    el.append(head);

    // Targeting
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

    if (hero) this.buildHero(tw, state);
    else this.buildPaths(tw, infos);

    // Beschreibung + Verkauf
    this.descBox = h('div', 'p-desc', this.defaultDesc);
    el.append(this.descBox);
    const foot = h('div', 'p-foot');
    const sellB = h('button', 'p-sell');
    sellB.append(h('span', 'lbl', t('panel.sell')), uiIcon('coin', 2), h('b', 'num', String(sell)));
    sellB.onclick = () => this.cb.sell(tw.id);
    foot.append(sellB);
    el.append(foot);
  }

  private tierPrice(type: TowerState['type'], path: number, tierIdx: number, info: UpgradeInfo): number {
    if (info.next === tierIdx + 1) return info.price;
    if (isHero(type)) return 0;
    const base = DATA.towers[type];
    return round5(base.paths[path].tiers[tierIdx].price, DATA.difficulties[this.opts.difficulty].priceBp);
  }

  private buildPaths(tw: TowerState, infos: UpgradeInfo[]): void {
    if (isHero(tw.type)) return;
    const data = DATA.towers[tw.type];
    const cols = h('div', 'p-cols');
    this.defaultDesc = '';
    const maxTier = this.opts.unlocks?.maxTier[tw.type];
    infos.forEach((info) => {
      const p = info.path;
      const col = h('div', 'p-col');
      col.style.setProperty('--pc', PATH_COLORS[p]);
      col.append(h('div', 'p-col-h', data.paths[p].name));
      const closed = info.reason === 'crosspath';
      for (let i = 0; i < 5; i++) {
        const td = data.paths[p].tiers[i];
        const owned = i < info.current;
        const isNext = info.next === i + 1;
        const xpLocked = !!maxTier && i + 1 > maxTier[p];
        const row = h('button', 'p-tier');
        row.dataset.state = owned ? 'owned' : isNext ? (info.canBuy ? 'buy' : info.reason ?? 'no') : 'future';
        if (isNext && !info.canBuy && info.reason === 'no-cash') row.classList.add('poor');
        if (!owned && closed) row.classList.add('closed');
        if (!owned && !closed && (xpLocked || (isNext && info.reason === 'locked'))) row.classList.add('xplock');
        const ic = iconUpgrade(tw.type, p, i + 1);
        const icBox = h('div', 'p-ic');
        icBox.append(copyCanvas(ic.canvas, 2));
        const txt = h('div', 'p-tx');
        txt.append(h('div', 'p-tn', td.name));
        const price = this.tierPrice(tw.type, p, i, info);
        const st = h('div', 'p-ts');
        if (owned) { st.append(uiIcon('check', 2), h('span', '', t('panel.owned'))); }
        else if (closed) st.append(h('span', 'closed-t', t('panel.pathClosed')));
        else if (row.classList.contains('xplock')) { st.append(uiIcon('lock', 2), h('span', 'xp-t', t('panel.unlockXp'))); }
        else { st.append(uiIcon('coin', 2), h('b', 'num', String(price))); }
        txt.append(st);
        row.append(icBox, txt);
        row.onmouseenter = () => { if (this.descBox) this.descBox.textContent = `${td.name}: ${td.desc}`; };
        row.onmouseleave = () => { if (this.descBox) this.descBox.textContent = this.defaultDesc; };
        row.onclick = () => {
          if (owned) return;
          if (isNext && info.canBuy) this.cb.upgrade(tw.id, p);
          else if (closed) this.cb.toast(t('reason.crosspath'));
          else if (row.classList.contains('xplock')) this.cb.toast(t('panel.unlockXp'));
          else if (isNext) this.cb.toast(t(`reason.${info.reason ?? 'unknown'}`));
        };
        if (isNext) row.classList.add('next');
        col.append(row);
      }
      cols.append(col);
    });
    // Beschreibung der naechsten kaufbaren Stufe als Standard
    const nx = infos.find((i) => i.canBuy) ?? infos.find((i) => i.next != null && !i.reason?.startsWith('cross'));
    if (nx && nx.next) this.defaultDesc = `${nx.name}: ${nx.desc}`;
    this.el.append(cols);
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
    const keyOf = (id: string): string => String(['arrowRain', 'absoluteZero', 'flare', 'dawnbreak'].indexOf(id) + 1);
    for (const a of state.abilities.filter((q) => q.id === 'flare' || q.id === 'dawnbreak')) {
      const b = h('div', 'ab-card');
      b.dataset.ab = a.id;
      b.append(h('b', '', ABILITY_TEXT[a.id].name), h('span', 'small', ABILITY_TEXT[a.id].desc), h('div', 'cd'));
      void keyOf;
      abs.append(b);
    }
    if (!abs.querySelector('.ab-card')) abs.append(h('span', 'small muted', lv.filter((l) => /Ability/.test(l.desc)).map((l) => `Level ${l.level}: ${l.desc.replace(/^Ability: /, '').split(' - ')[0]}`).join('   ')));
    wrap.append(abs);
    this.el.append(wrap);
    this.updateXp(tw);
  }
}
