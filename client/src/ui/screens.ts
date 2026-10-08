/**
 * Vollbild-Dialoge ueber dem Spiel. Besitzer: P6 (Runde 5), Runde 7 umgebaut von P4: Startbildschirm ist die Lobby (`lobby.ts`),
 * dazu Summon, Units, Team, Stage-Auswahl, Shop (je eine Datei). Hier nur das Umschalten (`Nav`) plus Ergebnis- und Pause-Dialog.
 */
import { getBackend } from '../backend';
import { menuTheme, uiSound } from '../audio/ui-audio';
import { getRecorder } from '../game/recorder';
import type { Session } from '../game/session';
import type { DifficultyId } from '../sim';
import { clear } from './dom';
import { buildShop } from './crystal-shop';
import { buildLobby, buildLobbyLoading, buildLoadError } from './lobby';
import { buildCredits } from './menu';
import type { Mvp } from './mvp';
import type { Nav } from './nav';
import { buildPause, buildResult, replaySlot, type ReplayButtonFactory } from './result';
import { buildRewardBox } from './reward-box';
import { buildRaidShop } from './raid-shop';
import { buildSettings } from './settings-screen';
import { buildStageSelect } from './stage-select';
import { buildWorldMap } from './world-map';
import { buildSummon } from './summon';
import { buildTeam } from './team-screen';
import { buildUnits } from './units';
import { h } from './dom';

export interface ScreenHandlers {
  /** Neue Runde mit dieser Stufe (Team und Mods holt `main.ts` ueber `Backend.matchSetup`). */
  onStart(d: DifficultyId, stageId?: string): void;
  /** Zurueck zur Lobby: die laufende Runde wird verworfen. */
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

  /** Wohin die Bildschirme einander schicken. */
  readonly nav: Nav = {
    lobby: () => void this.showLobby(),
    summon: () => this.go('arcane', buildSummon(this.nav)),
    units: (id) => this.go('march', buildUnits(this.nav, id)),
    team: () => this.go('march', buildTeam(this.nav)),
    shop: () => this.go('bazaar', buildShop(this.nav)),
    settings: () => this.go('dusk', buildSettings(this.nav)),
    credits: () => this.go('dusk', buildCredits(this.nav)),
    world: (mode) => this.go('march', buildWorldMap(this.nav, mode)),
    raidShop: () => this.go('bazaar', buildRaidShop(this.nav)),
    stage: (id) => this.go('march', buildStageSelect(this.nav, id)),
    play: (d, stageId) => this.handlers.onStart(d, stageId),
  };

  constructor(private readonly handlers: ScreenHandlers) {}

  get hidden(): boolean {
    return this.el.classList.contains('hidden');
  }

  hide(): void {
    this.el.classList.add('hidden');
    clear(this.el); // Lobby und Meta-Bildschirme nicht im Hintergrund weiterlaufen lassen (Hintergrund-Animation)
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
          { onResume: () => s.togglePause(), onRestart: () => this.handlers.onStart(s.difficulty, s.stageId), onMenu: () => this.handlers.onMenu() },
          slot,
          { wave: s.sim.state.wave, totalWaves: s.totalWaves, lives: s.sim.state.lives, coins: s.sim.state.players[0]?.coins ?? 0, difficulty: s.difficulty },
        ),
      );
    }
    this.pausedEl.classList.toggle('hidden', !show);
  }

  /** Meta-Bildschirm zeigen und die Menue-Musik auf dessen Stimmung stellen. */
  private go(theme: Parameters<typeof menuTheme>[0], box: HTMLElement): void {
    menuTheme(theme);
    uiSound('ui.open');
    this.open(box);
  }

  private open(box: HTMLElement): void {
    // ohne laufende Runde (Lobby und Meta-Bildschirme) deckt der Dialog das Spielfeld voll ab, sonst scheint der letzte Frame durch
    this.el.classList.toggle('solid', this.session === null);
    clear(this.el);
    this.el.append(box);
    this.el.classList.remove('hidden');
  }

  /** Startbildschirm = Lobby. */
  showStart(): void {
    this.session = null;
    this.pauseShown = false;
    this.pausedEl.classList.add('hidden');
    void this.showLobby();
  }

  /** Lobby aus dem Profil bauen; Ladefehler zeigen Import/Reset statt eines Absturzes. */
  async showLobby(): Promise<void> {
    const loading = buildLobbyLoading();
    menuTheme('dusk');
    this.open(loading);
    const [r, c] = await Promise.all([getBackend().playerView(), getBackend().collectionView()]);
    if (this.el.firstElementChild !== loading) return; // inzwischen woanders
    if (!r.ok) {
      this.open(buildLoadError(r, () => void this.showLobby()));
      return;
    }
    this.open(buildLobby(r.player, r.persistence, this.nav, c.ok ? c.units : []));
  }

  showEnd(s: Session, mvp: Mvp | null): void {
    const win = s.sim.state.result === 'win';
    // Der Recorder hat die Runde beim Ende abgeschlossen; die Meldung rechnet das Backend nach (Belohnung nur aus dem Replay).
    const rewards = buildRewardBox(getRecorder()?.snapshot() ?? null, win);
    this.open(
      buildResult(
        s,
        mvp,
        {
          onAgain: () => this.handlers.onStart(s.difficulty, s.stageId),
          onOther: () => {
            this.handlers.onMenu();
            this.nav.world();
          },
          onMenu: () => this.handlers.onMenu(),
        },
        this.handlers.replayButton,
        rewards,
      ),
    );
  }
}
