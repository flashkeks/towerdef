/**
 * Auswahl-Panel einer gesetzten Unit: Stufe, Reichweite, Upgrade (Kosten und Wirkung alt -> neu), Verkaufswert,
 * Fertigkeit, Zielmodus. Besitzer: P1 (Bedienbarkeit).
 */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import { abilitySeconds, sellPreview } from '../view/model';
import { reachMilli, upgradeEffect } from '../view/unit-info';
import { clear, h, setClass } from './dom';

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
    const sig = u && def ? `${u.id}|${u.level}|${u.targeting}|${up}|${coins >= (up ?? 0)}|${abilitySeconds(u)}|${u.invested}` : 'none';
    if (sig === this.sig) return;
    this.sig = sig;
    clear(this.el);
    if (!u || !def) {
      this.el.append(h('p', 'muted', t('unit.none')));
      return;
    }
    this.el.append(h('h3', undefined, t(`unit.${def.id}.name`)), h('p', 'lvl', t('unit.level', { n: u.level + 1, max: def.maxLevel + 1 })));
    const reach = reachMilli(def, u.level);
    if (reach > 0) this.el.append(h('p', 'reach', t(def.aura ? 'panel.aura' : 'panel.range', { n: (reach / 1000).toFixed(1) })));
    // Upgrade: Kosten, Wirkung alt -> neu
    const upBtn = h('button', 'btn upgrade', up === null ? t('unit.maxed') : t('unit.upgrade', { cost: up }));
    upBtn.disabled = up === null;
    setClass(upBtn, 'poor', up !== null && coins < up);
    upBtn.addEventListener('click', () => s.upgrade());
    this.el.append(upBtn);
    if (up !== null) {
      const eff = h('ul', 'effect');
      for (const r of upgradeEffect(def, u.level)) {
        const li = h('li');
        li.append(h('span', 'k', t(r.key)), h('span', 'v', `${r.from} → ${r.to}`));
        eff.append(li);
      }
      this.el.append(eff);
      if (coins < up) this.el.append(h('p', 'muted need', t('panel.tooPoor', { n: up - coins })));
    }
    const sellBtn = h('button', 'btn sell', t('unit.sell', { value: sellPreview(def, u) }));
    sellBtn.addEventListener('click', () => s.sell());
    this.el.append(sellBtn);
    if (def.ability) {
      const cd = abilitySeconds(u);
      const ab = h('button', 'btn ability', cd > 0 ? t('unit.ability.cooldown', { s: cd }) : t('unit.ability'));
      ab.disabled = cd > 0;
      ab.addEventListener('click', () => s.useAbility());
      this.el.append(ab);
    }
    if (def.attack) {
      const tg = h('button', 'btn targeting', t('unit.targeting', { mode: t(`targeting.${u.targeting}`) }));
      tg.addEventListener('click', () => s.cycleTargeting());
      this.el.append(tg);
    }
  }
}
