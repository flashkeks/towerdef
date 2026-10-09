/**
 * Freischalt-Menue eines Turmtyps im Match (Runde 11b): drei Pfade x fuenf Stufen wie das BTD6-Upgrade-Menue.
 * Freigeschaltete Stufen sind abgehakt, die naechste zeigt Text und Kosten mit Kaufknopf, verdeckte Stufen sind "???" mit
 * Schloss und nur den Kosten. Das Menue entscheidet nichts: es fragt `game.unlockInfo` und schickt `unlockTier` ueber den Callback.
 */
import type { Game, GameState, TowerType } from '../sim';
import { h } from '../ui/dom';
import { t } from '../i18n/t';
import { displayName } from './info';
import { iconUpgrade, towerPortrait } from './sprites';
import { PATH_COLORS } from './tower-text';
import { copyCanvas, uiIcon } from './ui-icons';

export interface UnlockCallbacks {
  unlock(type: TowerType, path: 0 | 1 | 2): void;
  close(): void;
}

export class UnlockMenu {
  readonly el = h('div', 'm-unlock hidden');
  private type: TowerType | null = null;
  private sig = '';

  constructor(private readonly game: Game, private readonly cb: UnlockCallbacks) {}

  get open(): TowerType | null { return this.type; }

  show(type: TowerType | null): void {
    this.type = type;
    this.sig = '';
    this.el.classList.toggle('hidden', type == null);
    if (type == null) this.el.replaceChildren();
  }

  /** Jeden Frame: baut nur neu, wenn sich Konto oder Stufen geaendert haben. */
  update(state: GameState): void {
    const ty = this.type;
    if (!ty) return;
    const sig = JSON.stringify([state.towerXp[ty], state.maxTier[ty]]);
    if (sig === this.sig) return;
    this.sig = sig;
    this.build(ty, state.towerXp[ty]);
  }

  private build(ty: TowerType, xp: number): void {
    const info = this.game.unlockInfo(ty);
    const box = h('div', 'um-box pxbox');
    const head = h('div', 'um-head');
    const port = h('div', 'p-port');
    port.append(copyCanvas(towerPortrait(ty).canvas, 2));
    const nm = h('div', 'p-name');
    nm.append(h('div', 'p-title', t('unlock.title', { name: displayName(ty) })), h('div', 'p-sub', t('unlock.hint')));
    const chip = h('div', 'um-xp');
    chip.append(uiIcon('bolt', 3), h('span', 'lbl', t('unlock.xp')), h('b', 'num um-xp-n', String(xp)));
    const close = h('button', 'p-close', 'x');
    close.title = t('panel.close');
    close.onclick = () => this.cb.close();
    head.append(port, nm, chip, close);
    box.append(head);

    const cols = h('div', 'um-cols');
    for (const path of info) {
      const col = h('div', 'p-col');
      col.style.setProperty('--pc', PATH_COLORS[path.path]);
      col.append(h('div', 'p-col-h', path.name));
      for (const tier of path.tiers) {
        const isNext = path.next === tier.tier;
        const row = h('div', 'p-tier um-tier');
        row.dataset.state = tier.unlocked ? 'owned' : isNext ? 'next' : 'future';
        if (isNext) row.classList.add('next');
        const icBox = h('div', 'p-ic');
        icBox.append(tier.revealed ? copyCanvas(iconUpgrade(ty, path.path, tier.tier).canvas, 2) : uiIcon('lock', 3));
        const tx = h('div', 'p-tx');
        tx.append(h('div', 'p-tn', tier.revealed ? tier.name : t('panel.hidden')));
        if (tier.revealed) tx.append(h('div', 'um-d', tier.desc));
        const st = h('div', 'p-ts um-s');
        if (tier.unlocked) {
          st.append(uiIcon('check', 2), h('span', '', t('unlock.done')));
        } else if (isNext && !path.reason?.startsWith('locked')) {
          const can = xp >= tier.cost;
          const b = h('button', `um-btn${can ? '' : ' off'}`);
          b.append(uiIcon('bolt', 2), h('b', 'num', `${t('unlock.button')} ${tier.cost}`));
          b.onclick = () => this.cb.unlock(ty, path.path);
          st.append(b);
          if (!can) st.append(h('span', 'um-need', t('unlock.need', { n: tier.cost - xp })));
        } else {
          st.append(uiIcon('lock', 2), h('b', 'num um-cost', `${tier.cost} XP`));
        }
        tx.append(st);
        row.append(icBox, tx);
        col.append(row);
      }
      cols.append(col);
    }
    box.append(cols);
    this.el.replaceChildren(box);
    this.el.onclick = (e) => { if (e.target === this.el) this.cb.close(); };
  }
}
