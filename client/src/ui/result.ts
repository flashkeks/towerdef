/** Ergebnis-Bildschirm (Sieg/Niederlage, Welle, Leaks, MVP, Dauer) und Pause-Menue. Besitzer: P6. */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import { getRecorder } from '../game/recorder';
import { defeatTips, type TipInput } from '../view/tips';
import { h } from './dom';
import { formatDuration, type Mvp } from './mvp';

/** Platz fuer den Replay-Knopf (P2, `ui/download.ts`): die Hauptsitzung liefert den Knopf per `replayButton`. */
export type ReplayButtonFactory = (session: Session) => HTMLElement | null;

export function replaySlot(session: Session, factory?: ReplayButtonFactory): HTMLElement {
  const slot = h('div', 'replay-slot');
  slot.dataset.slot = 'replay';
  const btn = factory?.(session);
  if (btn) slot.append(btn);
  return slot;
}

/** Eingabe fuer die Tipps aus dem Recorder (Wellenstatistik, Befehle) und dem Team; ohne Recorder nur Endstand. */
export function tipInput(s: Session): TipInput {
  const rec = getRecorder()?.snapshot() ?? null;
  const st = s.sim.state;
  const bossWaves: number[] = [];
  for (let n = 1; n <= s.totalWaves; n++) if (s.sim.previewWave(n)?.boss) bossWaves.push(n);
  return {
    result: st.result ?? null,
    endWave: st.wave,
    endCoins: st.players[0]?.coins ?? 0,
    waves: rec?.waves ?? [],
    commands: rec?.commands ?? [],
    team: s.teamCatalog(),
    bossWaves,
  };
}

function tipsBox(s: Session): HTMLElement {
  const box = h('div', 'tips');
  box.append(h('h2', undefined, t('tips.title')));
  const ul = h('ul', 'tip-list');
  for (const tip of defeatTips(tipInput(s))) {
    const li = h('li', undefined, tip.text);
    li.dataset.tip = tip.id;
    ul.append(li);
  }
  box.append(ul);
  return box;
}

export interface ResultHandlers {
  onAgain(): void;
  onOther(): void;
  onMenu(): void;
}

export function buildResult(s: Session, mvp: Mvp | null, handlers: ResultHandlers, replay?: ReplayButtonFactory, rewards?: HTMLElement): HTMLElement {
  const st = s.sim.state;
  const win = st.result === 'win';
  const box = h('div', `dialog end ${win ? 'win' : 'loss'}`);
  box.append(h('h1', 'title', t(win ? 'end.win' : 'end.loss')), h('p', 'tagline', t(win ? 'end.win.text' : 'end.loss.text')));
  const stats = h('dl', 'result-stats');
  const row = (key: string, value: string, cls: string): void => {
    const dt = h('dt', undefined, t(key));
    const dd = h('dd', cls, value);
    stats.append(dt, dd);
  };
  row('result.stats.wave', `${st.wave} / ${s.totalWaves}`, 'r-wave');
  row('hud.lives', String(st.lives), 'r-lives');
  row('result.stats.leaks', String(st.stats.leaks), 'r-leaks');
  row('result.stats.time', formatDuration(st.tick), 'r-time');
  row('result.stats.mvp', mvp ? t('result.mvp.value', { name: t(`unit.${mvp.unit}.name`), damage: Math.round(mvp.damage) }) : t('result.mvp.none'), 'r-mvp');
  box.append(stats);
  if (rewards) box.append(rewards);
  if (!win) box.append(tipsBox(s));
  const btns = h('div', 'diff-row');
  const again = h('button', 'btn primary restart', t('result.again'));
  again.addEventListener('click', handlers.onAgain);
  const other = h('button', 'btn other', t('result.other'));
  other.addEventListener('click', handlers.onOther);
  const menu = h('button', 'btn menu', t('result.menu'));
  menu.addEventListener('click', handlers.onMenu);
  btns.append(again, other, menu);
  box.append(btns, replaySlot(s, replay));
  return box;
}

export interface PauseHandlers {
  onResume(): void;
  onRestart(): void;
  onMenu(): void;
}

export function buildPause(handlers: PauseHandlers, slot: HTMLElement): HTMLElement {
  const box = h('div', 'dialog pause');
  box.append(h('h1', 'title small', t('pause.title')));
  const col = h('div', 'menu-col');
  const items: [string, string, () => void, boolean][] = [
    ['resume', 'pause.resume', handlers.onResume, true],
    ['restart', 'pause.restart', handlers.onRestart, false],
    ['menu', 'pause.menu', handlers.onMenu, false],
  ];
  for (const [id, key, fn, primary] of items) {
    const b = h('button', `btn pause-${id}${primary ? ' primary' : ''}`, t(key));
    b.addEventListener('click', fn);
    col.append(b);
  }
  box.append(col, slot);
  return box;
}
