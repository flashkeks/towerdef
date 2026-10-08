/**
 * Spiel-Bundle (wird erst nach bestandener Desktop-Pruefung geladen, siehe boot.ts).
 * Verdrahtet Session, Renderer und DOM-UI und treibt alles per Pixi-Ticker.
 */
import './styles.css';
import { GameBus } from './game/events';
import { Recorder } from './game/recorder';
import { Renderer } from './game/renderer';
import { Session } from './game/session';
import { loadBrowserData, STAGE_ID, type DifficultyId, type UnitMod } from './sim';
import { AudioEngine } from './audio/engine';
import { getBackend } from './backend';
import { Ui } from './ui/app';
import { mountPauseDownload, replayDownloadBox } from './ui/download';
import { mountCutIn } from './ui/cutin';
import { mountLeakShake } from './ui/leak-shake';
import { notify } from './ui/flash';
import { errorText } from './ui/meta-model';

export interface GameHandle {
  /** Desktop-Sperre greift (true) oder ist wieder aufgehoben (false): Sim pausiert, nichts geht verloren. */
  setBlocked(blocked: boolean): void;
}

declare global {
  interface Window {
    /** Test-/Debug-Zugriff (Playwright-Smoke): nur lesender Blick auf den Zustand. */
    __duskwardens?: { session: () => Session | null; renderer: () => Renderer; bus: GameBus; audio: AudioEngine };
  }
}

export async function startGame(root: HTMLElement): Promise<GameHandle> {
  /** Ein Bus fuer die ganze Seite: Replay, Effekte, Ton usw. abonnieren hier (game/events.ts). */
  const bus = new GameBus();
  new Recorder(bus);
  mountPauseDownload(bus);
  const renderer = new Renderer(bus);
  // P5: Ton (nach erster Nutzeraktion) und Leak-Wackeln der Leben-Anzeige
  const audio = new AudioEngine(bus, (fn) => renderer.fx.onShot(fn), (fn) => renderer.fx.onCue(fn));
  mountLeakShake(bus);
  let session: Session | null = null;
  let endEmitted = false;
  let blocked = false;

  const ui = new Ui(root, {
    onStart: (d, stageId) => void begin(d, stageId),
    onMenu: () => {
      session = null;
      ui.showStart();
    },
    // P2 x P6: Replay-Knopf samt Freitext im Ergebnis-Bildschirm und Pause-Menue.
    replayButton: () => replayDownloadBox(),
  });
  mountCutIn(bus, ui.boardWrap);
  await renderer.init(ui.boardWrap);
  ui.boardWrap.prepend(renderer.app.canvas);

  const fit = (): void => {
    const side = root.querySelector('.side')?.getBoundingClientRect().width ?? 0;
    const hud = root.querySelector('.hud')?.getBoundingClientRect().height ?? 0;
    const shop = root.querySelector('.shop')?.getBoundingClientRect().height ?? 0;
    renderer.fit(window.innerWidth - side - 24, window.innerHeight - hud - shop - 24);
  };

  let starting = false;

  /** Match starten: Team und Mods (Level, Sterne) kommen aus dem Profil ueber `Backend.matchSetup`, nie aus der UI. */
  async function begin(d: DifficultyId, stageId: string = STAGE_ID): Promise<void> {
    if (starting) return;
    starting = true;
    try {
      const setup = await getBackend().matchSetup(d, stageId);
      if (!setup.ok) {
        notify(errorText(setup), 'error');
        return;
      }
      launch(d, setup.team, setup.unitMods, stageId);
    } finally {
      starting = false;
    }
  }

  function launch(d: DifficultyId, team: string[], unitMods: UnitMod[], stageId: string): void {
    session = new Session(d, undefined, bus, unitMods, stageId);
    // Team in die Session: Unit-Leiste, Besitzpruefung im Replay (Recorder liest `session.team` beim Start)
    session.team = team;
    endEmitted = false;
    session.blocked = blocked;
    const data = loadBrowserData();
    renderer.setup(data.stages[stageId], session.sim.catalog());
    ui.bind(session);
    fit();
    renderer.ctx.version++; // Raster kann sich je Welt aendern: Ansichten neu bauen
    bus.emitRunStart(session);
  }

  window.__duskwardens = { session: () => session, renderer: () => renderer, bus, audio };
  window.addEventListener('resize', fit);
  ui.showStart();
  fit();

  renderer.app.ticker.add((ticker) => {
    if (!session) return;
    const dt = ticker.deltaMS;
    session.advance(dt);
    renderer.draw(session, performance.now(), dt);
    if (session.over && !endEmitted) {
      endEmitted = true;
      bus.emitRunEnd(session);
    }
    ui.update(session, renderer.tile, renderer.ctx.cols, renderer.ctx.rows);
  });

  return {
    setBlocked(b: boolean): void {
      blocked = b;
      if (session) session.blocked = b;
    },
  };
}
