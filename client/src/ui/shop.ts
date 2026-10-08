/**
 * Unit-Leiste unten (Tasten 1-6 liegen in `input.ts`): je Team-Unit eine Portraet-Karte mit Taste, Kosten, Platzierungs-Chip und Symbolen.
 * Besitzer: P1 (Bedienbarkeit); Team-Auswahl 6 aus der Sammlung (Runde 7, P4) bestimmt, welche Units sie zeigt; Karten im neuen Look: Runde 8, P4.
 */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import type { UnitDef } from '../sim';
import { needOf } from '../view/placement';
import { unitTags } from '../view/readability';
import { Ring } from './ability-ui';
import { typeAbility, firstButton, secondsLeft } from '../view/ability';
import { clear, h, setClass, setText } from './dom';
import { icon, portraitCard } from './kit';
import { unitName, unitSeries } from './meta-model';

export class Shop {
  readonly el = h('footer', 'shop');
  private hint = h('div', 'hint');
  private btns = new Map<string, HTMLButtonElement>();
  private costs = new Map<string, HTMLElement>();
  /** Fähigkeits-Knopf je Unit-Typ mit Knopf-Fähigkeit (Runde 9 / P1). */
  private abilities = new Map<string, { ring: Ring; count: HTMLElement; dot: HTMLElement }>();

  bind(session: Session): void {
    clear(this.el);
    this.btns.clear();
    this.costs.clear();
    this.abilities.clear();
    const list = h('div', 'shop-list');
    session.teamCatalog().forEach((d, i) => list.append(this.button(session, d, i)));
    this.el.append(h('div', 'shop-title', t('shop.title')), list, this.hint);
  }

  private button(session: Session, d: UnitDef, index: number): HTMLButtonElement {
    const b = portraitCard({ unitId: d.id, name: unitName(d.id), series: unitSeries(d.id), rarity: d.rarity, elements: d.elements, tag: 'button', cls: 'unit-btn', tile: false }) as HTMLButtonElement;
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
    const ai = firstButton(d);
    if (ai >= 0) {
      // Fähigkeits-Knopf auf der Karte: erscheint, sobald eine Unit dieser Art steht; Klick löst bei allen bereiten aus, der Punkt schaltet Auto
      b.dataset.abilityUnit = d.id;
      const slot = h('span', 'ab-slot');
      const ring = new Ring();
      const count = h('span', 'ab-count', '');
      const dot = h('span', 'ab-auto-dot');
      dot.title = t('ability.auto.tip');
      ring.el.setAttribute('role', 'button');
      ring.el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        session.useAbilityType(d.id);
      });
      dot.addEventListener('click', (ev) => {
        ev.stopPropagation();
        session.toggleAutoType(d.id);
      });
      slot.append(ring.el, count, dot);
      b.querySelector('.pc-sheen')?.before(slot);
      this.abilities.set(d.id, { ring, count, dot });
    }
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
      const ab = this.abilities.get(d.id);
      if (ab) {
        const ta = typeAbility(s.sim.state.units, d);
        setClass(b, 'has-ability', ta !== null);
        if (ta) {
          if (ta.ready > 0) ab.ring.set('ready', 1, '');
          else ab.ring.set('cooldown', ta.ratio, secondsLeft(ta.cdTicks));
          setText(ab.count, ta.count > 1 ? `${ta.ready}/${ta.count}` : '');
          ab.count.style.display = ta.count > 1 ? '' : 'none';
          setClass(ab.dot, 'on', ta.auto > 0);
          const tip = t('ability.shop.tip', { name: ta.def.name, unit: unitName(d.id), ready: ta.ready, count: ta.count });
          if (ab.ring.el.title !== tip) ab.ring.el.title = tip;
        }
      }
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
