/**
 * Unit-Leiste unten (Tasten 1-6 liegen in `input.ts`): je Team-Unit eine Portraet-Karte mit Taste, Kosten, Platzierungs-Chip und Symbolen.
 * Besitzer: P1 (Bedienbarkeit); Team-Auswahl 6 aus der Sammlung (Runde 7, P4) bestimmt, welche Units sie zeigt; Karten im neuen Look: Runde 8, P4.
 */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import type { UnitDef } from '../sim';
import { needOf } from '../view/placement';
import { unitTags } from '../view/readability';
import { clear, h, setClass, setText } from './dom';
import { icon, portraitCard } from './kit';
import { unitName } from './meta-model';

export class Shop {
  readonly el = h('footer', 'shop');
  private hint = h('div', 'hint');
  private btns = new Map<string, HTMLButtonElement>();
  private costs = new Map<string, HTMLElement>();

  bind(session: Session): void {
    clear(this.el);
    this.btns.clear();
    this.costs.clear();
    const list = h('div', 'shop-list');
    session.teamCatalog().forEach((d, i) => list.append(this.button(session, d, i)));
    this.el.append(h('div', 'shop-title', t('shop.title')), list, this.hint);
  }

  private button(session: Session, d: UnitDef, index: number): HTMLButtonElement {
    const b = portraitCard({ unitId: d.id, name: unitName(d.id), rarity: d.rarity, elements: d.elements, tag: 'button', cls: 'unit-btn', tile: false }) as HTMLButtonElement;
    b.title = `${t(`rarity.${d.rarity.toLowerCase()}`)} - ${t(`placement.${d.placement}`)}`;
    const need = d.placement === 'hybrid' && d.footprint === 1 ? 'any' : needOf(d);
    const chip = h('span', `ptype ${need}`, t(`ptype.${need}`));
    b.title = `${b.title} - ${t('ptype.' + need)}`;
    const tags = h('span', 'utags');
    for (const tag of unitTags(d)) {
      const sym = h('span', `utag ${tag}`, t(`tag.${tag}.sym`));
      sym.title = t(`tag.${tag}.tip`);
      tags.append(sym);
    }
    const cost = h('span', 'ucost');
    cost.title = t('shop.cost.tip');
    cost.append(icon('coin'), h('span', 'cv', String(d.placeCost)));
    this.costs.set(d.id, cost);
    const row = h('span', 'ub-row');
    row.append(cost, chip, tags);
    b.querySelector('.pc-cap')?.append(row);
    b.querySelector('.pc-sub')?.remove();
    b.querySelector('.pc-cap')?.classList.add('ub-cap');
    b.querySelector('.pc-sheen')?.before(h('span', 'key', String(index + 1)));
    b.addEventListener('click', () => session.choosePlacing(d.id));
    this.btns.set(d.id, b);
    return b;
  }

  update(s: Session): void {
    const coins = s.sim.state.players[0]?.coins ?? 0;
    for (const d of s.teamCatalog()) {
      const b = this.btns.get(d.id);
      if (!b) continue;
      setClass(b, 'active', s.placing === d.id);
      const price = s.sim.placeCost(0, d.id);
      setClass(b, 'poor', coins < price);
      const cost = this.costs.get(d.id);
      if (cost) {
        setText(cost.lastElementChild as HTMLElement, String(price));
        setClass(cost, 'up', price > d.placeCost);
        const tip = price > d.placeCost ? t('shop.cost.up', { now: price, base: d.placeCost }) : t('shop.cost.tip');
        if (cost.title !== tip) cost.title = tip;
      }
    }
    setText(this.hint, s.placing ? t('shop.hint.place2', { name: unitName(s.placing) }) : t('shop.hint.idle'));
  }
}
