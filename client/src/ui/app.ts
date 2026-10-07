/**
 * DOM-Oberflaeche ueber dem Canvas: nur Verdrahtung und Szenenwechsel. Die Bausteine liegen in eigenen Dateien
 * (hud, shop, board-input, panels, unit-panel, boss-banner, toast, screens, input), siehe client/README.md "Aufbau" und Besitzer.
 */
import type { Session } from '../game/session';
import type { DifficultyId } from '../sim';
import { BossBanner } from './boss-banner';
import { clear, h } from './dom';
import { MvpTracker } from './mvp';
import { getSettings } from './settings';
import { loadTeam } from './team';
import type { ReplayButtonFactory } from './result';
import { BoardInput } from './board-input';
import { Help } from './help';
import { Hints } from './hints';
import { Hud } from './hud';
import { Input } from './input';
import { Nudges } from './nudges';
import { WavePanels } from './panels';
import { Screens } from './screens';
import { Shop } from './shop';
import { Toast } from './toast';
import { UnitPanel } from './unit-panel';
import { versionEl } from './version';

export interface UiHandlers {
  onStart(d: DifficultyId): void;
  onMenu(): void;
  /** Replay-Knopf (P2) fuer Ergebnis- und Pause-Menue; `main.ts` verbindet ihn. */
  replayButton?: ReplayButtonFactory;
}

export class Ui {
  readonly boardWrap = h('div', 'boardwrap');
  private readonly help = new Help(() => this.session, () => this.hints.enable());
  private readonly hud = new Hud(() => this.help.toggle());
  private readonly hints = new Hints();
  private readonly shop = new Shop();
  private readonly board = new BoardInput(this.boardWrap);
  private readonly waves = new WavePanels();
  private readonly unitPanel = new UnitPanel();
  private readonly banner = new BossBanner();
  private readonly toast = new Toast();
  private readonly nudges = new Nudges();
  private readonly screens: Screens;
  private session: Session | null = null;
  private mvp = new MvpTracker();
  private unsubMvp: (() => void) | null = null;

  constructor(root: HTMLElement, handlers: UiHandlers) {
    this.screens = new Screens(handlers);
    clear(root);
    root.classList.add('game');
    const side = h('aside', 'side');
    side.append(this.hints.el, this.waves.previewEl, this.waves.cardsEl, this.unitPanel.el);
    this.boardWrap.append(this.banner.el, this.nudges.el, this.toast.el, this.screens.pausedEl);
    const main = h('main', 'main');
    main.append(this.boardWrap, side);
    root.append(this.hud.el, main, this.shop.el, this.screens.el, this.help.el, versionEl());
    new Input(() => this.session, this.help);
  }

  /** Neue Runde: Brett-Eingabe, Shop und Panels aufbauen. */
  bind(session: Session): void {
    this.session = session;
    session.team = loadTeam(session.sim.catalog().map((d) => d.id));
    session.speed = getSettings().defaultSpeed;
    this.unsubMvp?.();
    this.mvp = new MvpTracker();
    this.unsubMvp = session.bus.onEvents((events) => this.mvp.consume(events));
    this.screens.bind(session);
    this.screens.hide();
    this.board.bind(session);
    this.shop.bind(session);
    this.waves.bind();
    this.unitPanel.bind();
    this.hud.bind(session);
    this.nudges.bind(session);
    this.hints.bind();
  }

  showStart(): void {
    this.session = null;
    this.hud.unbind();
    this.screens.showStart();
  }

  /** `tile` = aktuelle Tile-Groesse des Renderers (fuer die Mausumrechnung). */
  update(s: Session, tile: number): void {
    const nextWave = this.hud.update(s);
    this.screens.updatePaused(s);
    this.shop.update(s);
    this.board.update(tile, s.placing !== null);
    this.waves.update(s, nextWave);
    this.unitPanel.update(s);
    this.hints.update(s);
    this.banner.update(s);
    this.toast.update(s);
    this.nudges.update(s);
    if (s.over && this.screens.hidden) this.screens.showEnd(s, this.mvp.mvp());
  }
}
