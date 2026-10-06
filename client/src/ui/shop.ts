/** Unit-Leiste unten (Tasten 1-8 liegen in `input.ts`). Besitzer: P1 (Bedienbarkeit); Team-Auswahl 6 aus 8 (P6) bestimmt, welche Units sie zeigt. */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import type { UnitDef } from '../sim';
import { unitColor } from '../view/model';
import { clear, h, setClass, setText } from './dom';

const css = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;

export class Shop {
  readonly el = h('footer', 'shop');
  private hint = h('div', 'hint');
  private btns = new Map<string, HTMLButtonElement>();

  bind(session: Session): void {
    clear(this.el);
    this.btns.clear();
    const list = h('div', 'shop-list');
    session.sim.catalog().forEach((d, i) => list.append(this.button(session, d, i)));
    this.el.append(h('div', 'shop-title', t('shop.title')), list, this.hint);
  }

  private button(session: Session, d: UnitDef, index: number): HTMLButtonElement {
    const b = h('button', 'unit-btn');
    b.type = 'button';
    b.dataset.unit = d.id;
    b.title = `${t(`rarity.${d.rarity}`)} - ${t(`placement.${d.placement}`)}`;
    const badge = h('span', 'badge', t(`unit.${d.id}.abbr`));
    badge.style.background = css(unitColor(d.id));
    b.append(h('span', 'key', String(index + 1)), badge, h('span', 'uname', t(`unit.${d.id}.name`)), h('span', 'ucost', String(d.placeCost)));
    b.addEventListener('click', () => session.choosePlacing(d.id));
    this.btns.set(d.id, b);
    return b;
  }

  update(s: Session): void {
    const coins = s.sim.state.players[0]?.coins ?? 0;
    for (const d of s.sim.catalog()) {
      const b = this.btns.get(d.id);
      if (!b) continue;
      setClass(b, 'active', s.placing === d.id);
      setClass(b, 'poor', coins < s.sim.placeCost(d.id));
    }
    setText(this.hint, s.placing ? t('shop.hint.place', { name: t(`unit.${s.placing}.name`) }) : t('shop.hint.idle'));
  }
}
