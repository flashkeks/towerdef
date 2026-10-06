/** Boss-Banner oben im Spielfeld: Name, Phase, Lebensbalken, Telegraph-/Fenster-/Schild-Zeile. Besitzer: P5 (Boss-Feedback). */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import { telegraphSecondsLeft } from '../view/telegraph';
import { h, setText } from './dom';

export class BossBanner {
  readonly el = h('div', 'boss-banner hidden');
  private nameEl = h('div', 'name');
  private bar = h('div', 'bar-fill boss');
  private line = h('div', 'line');

  constructor() {
    const barWrap = h('div', 'bar');
    barWrap.append(this.bar);
    this.el.append(this.nameEl, barWrap, this.line);
  }

  update(s: Session): void {
    const boss = s.sim.state.enemies.find((e) => e.boss);
    if (!boss) {
      this.el.classList.add('hidden');
      return;
    }
    this.el.classList.remove('hidden');
    const tr = s.tracker;
    const tick = s.sim.state.tick;
    const kit = boss.bossRun?.kit;
    const phase = tr.phases.get(boss.id);
    const nameText = kit ? t(`boss.kit.${kit}`) : t('enemy.boss.name');
    setText(this.nameEl, phase ? `${nameText} - ${t('boss.phase', { name: t(`boss.phase.${phase.id}`) })}` : nameText);
    this.bar.style.width = `${Math.round((boss.hp / Math.max(1, boss.maxHp)) * 100)}%`;
    const tl = tr.telegraphs.get(boss.id);
    const win = tr.windows.get(boss.id);
    let line = '';
    let mode = '';
    if (tl) {
      line = t('boss.telegraph', { name: nameText, ability: t(`boss.ability.${tl.ability}`), s: telegraphSecondsLeft(tl, tick).toFixed(1) });
      if (tl.interruptible) line += ` ${t('boss.interrupt')}`;
      mode = 'danger';
    } else if (win) {
      line = t('boss.window', { s: Math.max(0, Math.ceil((win.untilTick - tick) / 2) / 10).toFixed(1) });
      mode = 'chance';
    } else if (tr.wards.has(boss.id)) {
      line = t('boss.ward');
      mode = 'ward';
    }
    setText(this.line, line);
    this.line.dataset.mode = mode;
    this.el.dataset.mode = mode;
  }
}
