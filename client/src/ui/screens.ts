/**
 * Vollbild-Dialoge ueber dem Spiel: Start (Stufenwahl), Ende (Sieg/Niederlage), Pause-Hinweis.
 * Besitzer: P6 (Hauptmenue, Team-Auswahl, Einstellungen, Ergebnis-Bildschirm, Pause-Menue). Neue Bildschirme als weitere
 * `show…`-Methoden hier oder in eigenen Dateien, `app.ts` schaltet nur um.
 */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import type { DifficultyId } from '../sim';
import { clear, h, setClass } from './dom';
import { buildCredits, buildMenu } from './menu';
import type { Mvp } from './mvp';
import { buildPause, buildResult, replaySlot, type ReplayButtonFactory } from './result';
import { buildSettings } from './settings-screen';
import { buildTeamSelect } from './team-select';

const DIFFICULTIES: readonly DifficultyId[] = ['normal', 'hard', 'nightmare'];

export interface ScreenHandlers {
  /** Neue Runde mit dieser Stufe (das Team steht dann schon im Speicher, `Ui.bind` liest es). */
  onStart(d: DifficultyId): void;
  /** Zurueck zum Hauptmenue: die laufende Runde wird verworfen. */
  onMenu(): void;
  /** Replay-Knopf fuer Ergebnis und Pause (P2, `ui/download.ts`); die Hauptsitzung verbindet ihn in `main.ts`. */
  replayButton?: ReplayButtonFactory;
}

export class Screens {
  /** Dialog-Ebene ueber dem ganzen Spiel. */
  readonly el = h('div', 'overlay hidden');
  /** Pause-Menue ueber dem Spielfeld (nur sichtbar, solange pausiert). */
  readonly pausedEl = h('div', 'paused menu hidden');
  private session: Session | null = null;
  private pauseShown = false;

  constructor(private readonly handlers: ScreenHandlers) {}

  get hidden(): boolean {
    return this.el.classList.contains('hidden');
  }

  hide(): void {
    this.el.classList.add('hidden');
  }

  /** Neue Runde: Pause-Menue zuruecksetzen. */
  bind(s: Session): void {
    this.session = s;
    this.pauseShown = false;
    clear(this.pausedEl);
    this.pausedEl.classList.add('hidden');
  }

  updatePaused(s: Session): void {
    const show = s.paused && !s.over;
    if (show === this.pauseShown) return;
    this.pauseShown = show;
    clear(this.pausedEl);
    if (show) {
      const slot = replaySlot(s, this.handlers.replayButton);
      this.pausedEl.append(
        buildPause(
          { onResume: () => s.togglePause(), onRestart: () => this.handlers.onStart(s.difficulty), onMenu: () => this.handlers.onMenu() },
          slot,
        ),
      );
    }
    setClass(this.pausedEl, 'hidden', !show);
  }

  private open(box: HTMLElement): void {
    clear(this.el);
    this.el.append(box);
    this.el.classList.remove('hidden');
  }

  /** Hauptmenue (Titel, Spielen, Einstellungen, Credits). */
  showStart(): void {
    this.session = null;
    this.pauseShown = false;
    this.pausedEl.classList.add('hidden');
    this.open(buildMenu({ onPlay: () => this.showDifficulty(), onSettings: () => this.showSettings(), onCredits: () => this.showCredits() }));
  }

  showSettings(): void {
    this.open(buildSettings(() => this.showStart()));
  }

  showCredits(): void {
    this.open(buildCredits(() => this.showStart()));
  }

  /** Stufenwahl, danach die Team-Auswahl. */
  showDifficulty(): void {
    const box = h('div', 'dialog start');
    box.append(h('h1', 'title small', t('game.title')), h('h2', undefined, t('start.pick')));
    const row = h('div', 'diff-row');
    for (const d of DIFFICULTIES) {
      const b = h('button', `btn diff ${d}`);
      b.dataset.difficulty = d;
      b.append(h('strong', undefined, t(`difficulty.${d}`)), h('span', undefined, t(`difficulty.${d}.desc`)));
      b.addEventListener('click', () => this.showTeam(d));
      row.append(b);
    }
    const back = h('button', 'btn menu-back', t('menu.back'));
    back.addEventListener('click', () => this.showStart());
    box.append(row, h('div', 'diff-row'));
    box.lastElementChild?.append(back);
    this.open(box);
  }

  showTeam(d: DifficultyId): void {
    this.open(buildTeamSelect(() => this.handlers.onStart(d), () => this.showDifficulty()));
  }

  showEnd(s: Session, mvp: Mvp | null): void {
    this.open(
      buildResult(
        s,
        mvp,
        {
          onAgain: () => this.handlers.onStart(s.difficulty),
          onOther: () => {
            this.handlers.onMenu();
            this.showDifficulty();
          },
          onMenu: () => this.handlers.onMenu(),
        },
        this.handlers.replayButton,
      ),
    );
  }
}
