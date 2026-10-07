/**
 * Auswahl-Panel einer gesetzten Unit: Stufe, Reichweite, Upgrade (Kosten und Wirkung alt -> neu), Verkaufswert,
 * Fertigkeit, Zielmodus. Besitzer: P1 (Bedienbarkeit).
 */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import { sellPreview } from '../view/model';
import { attackEffects, attackForm, reachMilli, upgradeEffect } from '../view/unit-info';
import { clear, h, setClass } from './dom';
import { elementIcon, icon } from './kit';
import { rarityName, unitName } from './meta-model';
import { miniOf } from './unit-card';

export class UnitPanel {
  readonly el = h('section', 'panel unitpanel');
  private sig = '';

  bind(): void {
    this.sig = '';
  }

  update(s: Session): void {
    const st = s.sim.state;
    const u = s.selectedUnit === null ? undefined : st.units.find((x) => x.id === s.selectedUnit);
    if (s.selectedUnit !== null && !u) s.selectedUnit = null;
    const coins = st.players[0]?.coins ?? 0;
    const up = u ? s.sim.upgradeCost(u.id) : null;
    const def = u ? s.sim.catalog().find((d) => d.id === u.defId) : undefined;
    const sig = u && def ? `${u.id}|${u.level}|${u.targeting}|${up}|${coins >= (up ?? 0)}|${u.invested}` : 'none';
    if (sig === this.sig) return;
    this.sig = sig;
    clear(this.el);
    if (!u || !def) {
      this.el.append(h('p', 'muted', t('unit.none')));
      return;
    }
    const head = h('div', 'up-head');
    const who = h('div', 'up-who');
    const meta = h('div', 'up-meta');
    meta.append(h('span', `up-rarity r-${def.rarity.toLowerCase()}`, rarityName(def.rarity.toLowerCase())), ...def.elements.slice(0, 3).map((e) => elementIcon(e, 'up-el')));
    who.append(h('h3', undefined, unitName(def.id)), meta);
    head.append(miniOf(def.id, 46), who);
    const pips = h('div', 'lvlpips');
    pips.setAttribute('aria-hidden', 'true');
    for (let i = 0; i <= def.maxLevel; i++) pips.append(h('span', `pip${i <= u.level ? ' on' : ''}`));
    this.el.append(head, h('p', 'lvl', t('unit.level', { n: u.level + 1, max: def.maxLevel + 1 })), pips);
    const reach = reachMilli(def, u.level);
    if (reach > 0) this.el.append(h('p', 'reach', t('panel.range', { n: (reach / 1000).toFixed(1) })));
    const lv = def.levels[u.level];
    if (lv?.attack) {
      // Runde 8: Form, Treffer und Effekte des aktuellen Angriffs (alles aus den Unit-Daten)
      const bits = [attackForm(lv), ...(lv.attack.hits > 1 ? [t('stat.hits') + ' ' + lv.attack.hits] : []), ...attackEffects(lv)];
      this.el.append(h('p', 'muted attack', bits.join(' · ')));
    }
    // Upgrade: Kosten, Wirkung alt -> neu
    const upBtn = h('button', 'btn primary upgrade');
    if (up === null) upBtn.textContent = t('unit.maxed');
    else upBtn.append(icon('up'), t('unit.upgrade', { cost: up }));
    upBtn.disabled = up === null;
    setClass(upBtn, 'poor', up !== null && coins < up);
    upBtn.addEventListener('click', () => s.upgrade());
    this.el.append(upBtn);
    if (up !== null) {
      const eff = h('ul', 'effect');
      for (const r of upgradeEffect(def, u.level)) {
        const li = h('li');
        const v = h('span', 'v');
        v.append(h('span', 'from', r.from), icon('arrow'), h('span', 'to', r.to));
        li.append(h('span', 'k', t(r.key)), v);
        eff.append(li);
      }
      this.el.append(eff);
      if (coins < up) this.el.append(h('p', 'muted need', t('panel.tooPoor', { n: up - coins })));
    }
    const sellBtn = h('button', 'btn sell', t('unit.sell', { value: sellPreview(def, u) }));
    sellBtn.addEventListener('click', () => s.sell());
    this.el.append(sellBtn);
    if (def.levels[u.level]?.attack) {
      const tg = h('button', 'btn targeting', t('unit.targeting', { mode: t(`targeting.${u.targeting}`) }));
      tg.addEventListener('click', () => s.cycleTargeting());
      this.el.append(tg);
    }
  }
}
