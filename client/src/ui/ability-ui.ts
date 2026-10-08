/**
 * Fähigkeits-Anzeige im Match (Runde 9 / P1): Ring-Knopf mit Abklingzeit (Unit-Panel und Unit-Leiste) und der Fähigkeiten-Block im Unit-Panel
 * (Name, Beschreibung aus den Sim-Daten, Auto-Schalter, Aura). Reine Darstellung: gedrückt wird über `Session.useAbility` /
 * `useAbilityType` / `toggleAuto`, entschieden hat die Sim.
 */
import './ability.css';
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import type { SummonDef, UnitDef, UnitState } from '../sim';
import { abilityViews, describeAbility, describeAura, firstButton, secondsLeft, type AbilityView } from '../view/ability';
import { h, setClass, setText } from './dom';
import { icon } from './kit';

export type RingState = 'ready' | 'cooldown' | 'locked' | 'passive';

/** Runder Knopf mit Fortschrittsring (CSS-Variable `--p` 0..1, 1 = bereit). */
export class Ring {
  readonly el: HTMLElement;
  private readonly time = h('span', 'ab-time');
  private last = '';

  constructor(cls = '', glyph = 'bolt') {
    this.el = h('span', `ab-ring ${cls}`.trim());
    this.el.append(icon(glyph, 'ab-glyph'), this.time);
  }

  set(state: RingState, ratio: number, label: string): void {
    const key = `${state}|${Math.round(ratio * 360)}|${label}`;
    if (key === this.last) return;
    this.last = key;
    this.el.style.setProperty('--p', ratio.toFixed(3));
    this.el.dataset.state = state;
    setText(this.time, label);
  }
}

/** Fähigkeiten-Block eines gewählten Units im Panel: wird beim Wechsel der Unit/Stufe neu gebaut, `update` läuft jeden Frame. */
export class AbilityBlock {
  readonly el = h('div', 'ab-block');
  private rows: { ring: Ring; btn: HTMLButtonElement; v: AbilityView; cd: HTMLElement }[] = [];
  private auto: HTMLButtonElement | null = null;

  constructor(
    private readonly s: Session,
    private readonly def: UnitDef,
    private u: UnitState,
    summons: Record<string, SummonDef>,
  ) {
    const aura = describeAura(def, u.level);
    if (aura) {
      const a = h('div', 'ab-aura');
      a.append(h('strong', undefined, t('aura.title')), h('span', undefined, aura));
      this.el.append(a);
    }
    const views = abilityViews(s.sim, def, u);
    for (const v of views) {
      const row = h('div', `ab-row${v.button ? '' : ' passive'}`);
      const btn = h('button', 'ab-btn');
      btn.type = 'button';
      const ring = new Ring(v.button ? 'big' : 'big passive', v.button ? 'bolt' : 'summon');
      btn.append(ring.el);
      btn.disabled = !v.button;
      if (v.button) btn.addEventListener('click', () => s.useAbility(this.u.id, v.index));
      const info = h('div', 'ab-info');
      const head = h('div', 'ab-head');
      head.append(h('strong', 'ab-name', v.def.name));
      if (!v.button) head.append(h('span', 'ab-tag', t('ability.passive')));
      else if (v.index === firstButton(def)) head.append(h('span', 'ab-key', 'Q'));
      const cd = h('span', 'ab-cd', t('ability.cooldown', { s: Math.round(v.def.cooldownTicks / 20) }));
      info.append(head);
      for (const line of describeAbility(v.def, summons)) info.append(h('p', 'ab-line', line));
      info.append(cd);
      row.append(btn, info);
      this.el.append(row);
      this.rows.push({ ring, btn, v, cd });
    }
    if (views.some((v) => v.button)) {
      const a = h('button', 'btn ab-auto');
      a.type = 'button';
      a.title = t('ability.auto.tip');
      a.addEventListener('click', () => s.toggleAuto(this.u.id));
      this.auto = a;
      this.el.append(a);
    }
    this.update(u);
  }

  update(u: UnitState): void {
    this.u = u;
    const views = abilityViews(this.s.sim, this.def, u);
    this.rows.forEach((r, i) => {
      const v = views[i];
      r.v = v;
      if (!v.button) {
        r.ring.set('passive', v.locked ? 0 : v.ratio, v.locked ? `L${v.def.minLevel + 1}` : secondsLeft(v.cdTicks) === '0.0' ? '' : secondsLeft(v.cdTicks));
        setText(r.cd, v.locked ? t('ability.locked', { n: v.def.minLevel + 1 }) : t('ability.cooldown', { s: Math.round(v.def.cooldownTicks / 20) }));
        return;
      }
      if (v.locked) r.ring.set('locked', 0, `L${v.def.minLevel + 1}`);
      else if (v.cdTicks > 0) r.ring.set('cooldown', v.ratio, secondsLeft(v.cdTicks));
      else r.ring.set('ready', 1, t('ability.ready'));
      r.btn.disabled = v.locked || v.cdTicks > 0;
      setClass(r.btn, 'ready', v.ready && v.blocked === null);
      setText(r.cd, v.locked ? t('ability.locked', { n: v.def.minLevel + 1 }) : t('ability.cooldown', { s: Math.round(v.def.cooldownTicks / 20) }));
    });
    if (this.auto) {
      setText(this.auto, t(u.auto ? 'ability.auto.on' : 'ability.auto.off'));
      setClass(this.auto, 'on', !!u.auto);
    }
  }
}
