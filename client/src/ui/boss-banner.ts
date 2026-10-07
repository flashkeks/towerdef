/**
 * Boss-Banner oben im Spielfeld: Name, Phase, Lebensbalken, Telegraph-/Fenster-/Schild-Zeile, Fortschritt zum Brechen,
 * kurze Einblendung "gebrochen durch ..." und Auftritts-/Phasen-Animation. Besitzer: P5 (Boss-Feedback). Liest nur Zustand.
 */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import { bossDisplayName } from '../view/model';
import type { LastCast } from '../view/telegraph';
import { telegraphSecondsLeft } from '../view/telegraph';
import { h, setClass, setText } from './dom';

/** Wie lange die Meldung zum letzten Wirken/Brechen stehen bleibt (ms, echte Zeit). */
const CAST_SHOW_MS = 2800;

/** Text zur letzten Wirkung: gebrochen durch Stun/Schaden oder "ging los". Rein, damit testbar. */
export function castMessageKey(c: Pick<LastCast, 'interrupted' | 'cause'>): { key: string; mode: 'good' | 'bad' } {
  if (!c.interrupted) return { key: 'boss.cast.landed', mode: 'bad' };
  if (c.cause === 'stun') return { key: 'boss.cast.stun', mode: 'good' };
  if (c.cause === 'damage') return { key: 'boss.cast.damage', mode: 'good' };
  return { key: 'boss.cast.broken', mode: 'good' };
}

export class BossBanner {
  readonly el = h('div', 'boss-banner hidden');
  private nameEl = h('div', 'name');
  private bar = h('div', 'bar-fill boss');
  private line = h('div', 'line');
  private breakWrap = h('div', 'break hidden');
  private breakFill = h('div', 'break-fill');
  private breakText = h('span', 'break-text');
  private cast = h('div', 'cast hidden');
  private shownBoss = -1;
  private lastPhase = '';
  private castSeen: LastCast | null = null;
  private castUntil = 0;
  private atBottom = false;

  constructor() {
    const barWrap = h('div', 'bar');
    barWrap.append(this.bar);
    const br = h('div', 'break-bar');
    br.append(this.breakFill);
    this.breakWrap.append(this.breakText, br);
    this.el.append(this.nameEl, barWrap, this.line, this.breakWrap, this.cast);
  }

  private pulse(cls: string): void {
    this.el.classList.remove(cls);
    void this.el.offsetWidth; // Animation neu starten
    this.el.classList.add(cls);
  }

  update(s: Session): void {
    const boss = s.sim.state.enemies.find((e) => e.boss);
    if (!boss) {
      this.el.classList.add('hidden');
      this.shownBoss = -1;
      this.lastPhase = '';
      this.castSeen = null;
      return;
    }
    this.el.classList.remove('hidden');
    if (boss.id !== this.shownBoss) {
      this.shownBoss = boss.id;
      this.lastPhase = '';
      this.castSeen = null;
      this.pulse('enter');
    }
    // Der Boss laeuft zuerst unter dem Banner entlang (oberste Pfadreihe): dann wandert das Banner nach unten. Mit Hysterese, damit es nicht flackert.
    const row = boss.y / 1000;
    if (!this.atBottom && row < 2.6) this.atBottom = true;
    else if (this.atBottom && row > 3.4) this.atBottom = false;
    this.el.dataset.pos = this.atBottom ? 'bottom' : 'top';
    const tr = s.tracker;
    const tick = s.sim.state.tick;
    const kit = boss.bossRun?.kit;
    const phase = tr.phases.get(boss.id);
    if (phase && phase.id !== this.lastPhase) {
      if (this.lastPhase !== '') this.pulse('phase');
      this.lastPhase = phase.id;
    }
    const nameText = bossDisplayName(kit ? t(`boss.kit.${kit}`) : t('enemy.boss.name'));
    setText(this.nameEl, phase ? `${nameText} - ${t('boss.phase', { name: t(`boss.phase.${phase.id}`) })}` : nameText);
    this.bar.style.width = `${Math.round((boss.hp / Math.max(1, boss.maxHp)) * 100)}%`;
    const tl = tr.telegraphs.get(boss.id);
    const win = tr.windows.get(boss.id);
    let line = '';
    let mode = '';
    let breakPct = -1;
    if (tl) {
      line = t('boss.telegraph', { name: nameText, ability: t(`boss.ability.${tl.ability}`), s: telegraphSecondsLeft(tl, tick).toFixed(1) });
      if (tl.interruptible) line += ` ${t('boss.interrupt')}`;
      mode = 'danger';
      const need = boss.bossRun?.tele?.need ?? tl.staggerNeed;
      if (need > 0) breakPct = Math.max(0, Math.min(100, Math.round(((boss.bossRun?.tele?.dmg ?? 0) / need) * 100)));
    } else if (win) {
      const mult = (win.damageBp / 10000).toFixed(1);
      const s10 = Math.max(0, Math.ceil((win.untilTick - tick) / 2) / 10).toFixed(1);
      line = t(win.armor === 0 ? 'boss.window.armor' : 'boss.window', { s: s10, mult });
      mode = 'chance';
    } else if (tr.wards.has(boss.id)) {
      line = t('boss.ward');
      mode = 'ward';
    }
    setText(this.line, line);
    this.line.dataset.mode = mode;
    this.el.dataset.mode = mode;

    setClass(this.breakWrap, 'hidden', breakPct < 0);
    if (breakPct >= 0) {
      this.breakFill.style.width = `${breakPct}%`;
      setText(this.breakText, t('boss.break', { pct: breakPct }));
      setClass(this.breakWrap, 'full', breakPct >= 100);
    }

    // Kurze Einblendung: womit die letzte Faehigkeit gebrochen wurde
    const lc = tr.lastCast.get(boss.id) ?? null;
    if (lc && lc !== this.castSeen) {
      this.castSeen = lc;
      this.castUntil = performance.now() + CAST_SHOW_MS;
      const m = castMessageKey(lc);
      setText(this.cast, t(m.key, { ability: t(`boss.ability.${lc.ability}`) }));
      this.cast.dataset.mode = m.mode;
      this.cast.classList.remove('hidden', 'pop');
      void this.cast.offsetWidth;
      this.cast.classList.add('pop');
    }
    if (!this.cast.classList.contains('hidden') && performance.now() > this.castUntil) this.cast.classList.add('hidden');
  }
}
