/** Ergebnis-Bildschirm (Sieg/Niederlage, Welle, Leaks, MVP, Dauer) und Pause-Menue. Besitzer: P6. */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import { getRecorder } from '../game/recorder';
import { defeatTips, type TipInput } from '../view/tips';
import { h } from './dom';
import { icon, sigil } from './kit';
import { formatDuration, type Mvp } from './mvp';
import { unitName } from './meta-model';
import { miniOf, unitMeta } from './unit-card';

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

/** Eine Kennzahl-Kachel (Symbol, Beschriftung, Wert); bleibt `dt`/`dd` in einem `dl`, damit der Text auslesbar ist. */
function statTile(ic: string, label: string, value: string, cls: string): HTMLElement {
  const el = h('div', `stat-tile ${cls}`);
  const bub = h('span', 'stat-ic');
  bub.append(icon(ic));
  const copy = h('span', 'stat-copy');
  copy.append(h('dt', undefined, label), h('dd', cls, value));
  el.append(bub, copy);
  return el;
}

/** Kachel der wertvollsten Unit: Karte mit Porträt (oder Ersatzkarte), Name, Schaden. */
function mvpTile(mvp: Mvp | null): HTMLElement {
  const el = h('div', 'stat-tile mvp-tile');
  if (!mvp) {
    const bub = h('span', 'stat-ic');
    bub.append(icon('star'));
    const copy = h('span', 'stat-copy');
    copy.append(h('dt', undefined, t('result.stats.mvp')), h('dd', 'r-mvp', t('result.mvp.none')));
    el.append(bub, copy);
    return el;
  }
  const m = unitMeta(mvp.unit);
  const card = miniOf(mvp.unit, 74, 'mvp-card');
  const copy = h('span', 'stat-copy');
  copy.append(h('dt', undefined, t('result.mvp.title')), h('dd', 'r-mvp', unitName(mvp.unit)), h('span', 'mvp-dmg', t('result.mvp.damage', { damage: Math.round(mvp.damage).toLocaleString('en-US') })));
  el.append(card, copy);
  el.dataset.rarity = m.rarity;
  return el;
}

export function buildResult(s: Session, mvp: Mvp | null, handlers: ResultHandlers, replay?: ReplayButtonFactory, rewards?: HTMLElement): HTMLElement {
  const st = s.sim.state;
  const win = st.result === 'win';
  const box = h('div', `dialog end ${win ? 'win' : 'loss'}`);

  const head = h('header', 'end-head');
  const seal = h('div', 'end-seal');
  seal.append(sigil(), icon(win ? 'crown' : 'skull', 'end-seal-ic'));
  head.append(
    seal,
    h('span', 'eyebrow end-eyebrow', `${t(win ? 'result.eyebrow.win' : 'result.eyebrow.loss')} - ${t(`difficulty.${s.difficulty}`)}`),
    h('h1', 'title', t(win ? 'end.win' : 'end.loss')),
    h('p', 'tagline', t(win ? 'end.win.text' : 'end.loss.text')),
  );
  box.append(head);

  const grid = h('div', `end-grid${rewards ? '' : ' single'}`);
  const left = h('div', 'end-left');
  const stats = h('dl', 'result-stats');
  stats.append(
    statTile('flag', t('result.stats.wave'), `${st.wave} / ${s.totalWaves}`, 'r-wave'),
    statTile('heart', t('hud.lives'), String(st.lives), 'r-lives'),
    statTile('skull', t('result.stats.leaks'), String(st.stats.leaks), 'r-leaks'),
    statTile('fast', t('result.stats.time'), formatDuration(st.tick), 'r-time'),
    mvpTile(mvp),
  );
  left.append(stats);
  if (!win) left.append(tipsBox(s));
  grid.append(left);
  if (rewards) grid.append(rewards);
  box.append(grid);

  const btns = h('div', 'diff-row end-actions');
  const again = h('button', 'btn primary restart');
  again.append(icon('reroll'), t('result.again'));
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

/** Laufdaten fuer die Kopfzeile des Pause-Menues (optional, damit Tests ohne Session auskommen). */
export interface PauseInfo {
  wave: number;
  totalWaves: number;
  lives: number;
  coins: number;
  difficulty: string;
}

export function buildPause(handlers: PauseHandlers, slot: HTMLElement, info?: PauseInfo): HTMLElement {
  const box = h('div', 'dialog pause');
  const bars = h('span', 'pause-ic');
  bars.append(icon('pause'));
  box.append(bars, h('h1', 'title small', t('pause.title')), h('p', 'tagline', t('pause.sub')));
  if (info) {
    const chips = h('div', 'pause-chips');
    const chip = (ic: string, text: string, cls: string): void => {
      const c = h('span', `pause-chip ${cls}`);
      c.append(icon(ic), text);
      chips.append(c);
    };
    chip('flag', t('pause.wave', { n: info.wave, max: info.totalWaves }), 'wave');
    chip('heart', String(info.lives), 'lives');
    chip('coin', String(info.coins), 'coins');
    chip('shield', t(`difficulty.${info.difficulty}`), 'diff');
    box.append(chips);
  }
  const col = h('div', 'menu-col');
  const items: [string, string, string, () => void, boolean][] = [
    ['resume', 'play', 'pause.resume', handlers.onResume, true],
    ['restart', 'reroll', 'pause.restart', handlers.onRestart, false],
    ['menu', 'back', 'pause.menu', handlers.onMenu, false],
  ];
  for (const [id, ic, key, fn, primary] of items) {
    const b = h('button', `btn pause-${id}${primary ? ' primary' : ''}`);
    b.append(icon(ic), t(key));
    b.addEventListener('click', fn);
    col.append(b);
  }
  box.append(col, slot);
  return box;
}
