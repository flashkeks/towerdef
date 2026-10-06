/**
 * Vollbild-Dialoge ueber dem Spiel: Start (Stufenwahl), Ende (Sieg/Niederlage), Pause-Hinweis.
 * Besitzer: P6 (Hauptmenue, Team-Auswahl, Einstellungen, Ergebnis-Bildschirm, Pause-Menue). Neue Bildschirme als weitere
 * `show…`-Methoden hier oder in eigenen Dateien, `app.ts` schaltet nur um.
 */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import type { DifficultyId } from '../sim';
import { clear, h, setClass } from './dom';
import { replayDownloadBox } from './download';

const DIFFICULTIES: readonly DifficultyId[] = ['normal', 'hard', 'nightmare'];

export interface ScreenHandlers {
  onStart(d: DifficultyId): void;
  onMenu(): void;
}

export class Screens {
  /** Dialog-Ebene ueber dem ganzen Spiel. */
  readonly el = h('div', 'overlay hidden');
  /** "Paused"-Hinweis ueber dem Spielfeld (P6: wird zum Pause-Menue). */
  readonly pausedEl = h('div', 'paused hidden');

  constructor(private readonly handlers: ScreenHandlers) {
    this.pausedEl.textContent = t('hud.paused');
  }

  get hidden(): boolean {
    return this.el.classList.contains('hidden');
  }

  hide(): void {
    this.el.classList.add('hidden');
  }

  updatePaused(s: Session): void {
    setClass(this.pausedEl, 'hidden', !s.paused);
  }

  showStart(): void {
    clear(this.el);
    const box = h('div', 'dialog start');
    box.append(h('h1', 'title', t('game.title')), h('p', 'tagline', t('start.tagline')), h('h2', undefined, t('start.pick')));
    const row = h('div', 'diff-row');
    for (const d of DIFFICULTIES) {
      const b = h('button', `btn diff ${d}`);
      b.dataset.difficulty = d;
      b.append(h('strong', undefined, t(`difficulty.${d}`)), h('span', undefined, t(`difficulty.${d}.desc`)));
      b.addEventListener('click', () => this.handlers.onStart(d));
      row.append(b);
    }
    box.append(row);
    this.el.append(box);
    this.el.classList.remove('hidden');
  }

  showEnd(s: Session): void {
    const win = s.sim.state.result === 'win';
    clear(this.el);
    const box = h('div', `dialog end ${win ? 'win' : 'loss'}`);
    box.append(
      h('h1', 'title', t(win ? 'end.win' : 'end.loss')),
      h('p', 'tagline', t(win ? 'end.win.text' : 'end.loss.text')),
      h('p', 'stats', t('end.stats', { wave: s.sim.state.wave, total: s.totalWaves, lives: s.sim.state.lives })),
    );
    const row = h('div', 'diff-row');
    const again = h('button', 'btn primary restart', t('end.restart'));
    again.addEventListener('click', () => this.handlers.onStart(s.difficulty));
    const change = h('button', 'btn menu', t('end.change'));
    change.addEventListener('click', () => this.handlers.onMenu());
    row.append(again, change);
    box.append(replayDownloadBox(), row);
    this.el.append(box);
    this.el.classList.remove('hidden');
  }
}
