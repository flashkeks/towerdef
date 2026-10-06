/**
 * Spiel-Bundle (wird erst nach bestandener Desktop-Pruefung geladen, siehe boot.ts).
 * Verdrahtet Session, Renderer und DOM-UI und treibt alles per Pixi-Ticker.
 */
import './styles.css';
import { Renderer } from './game/renderer';
import { Session } from './game/session';
import { loadBrowserData, STAGE_ID, type DifficultyId } from './sim';
import { Ui } from './ui/app';

export interface GameHandle {
  /** Desktop-Sperre greift (true) oder ist wieder aufgehoben (false): Sim pausiert, nichts geht verloren. */
  setBlocked(blocked: boolean): void;
}

declare global {
  interface Window {
    /** Test-/Debug-Zugriff (Playwright-Smoke): nur lesender Blick auf den Zustand. */
    __duskwardens?: { session: () => Session | null; renderer: () => Renderer };
  }
}

export async function startGame(root: HTMLElement): Promise<GameHandle> {
  const renderer = new Renderer();
  let session: Session | null = null;
  let blocked = false;

  const ui = new Ui(root, {
    onStart: (d) => begin(d),
    onMenu: () => {
      session = null;
      ui.showStart();
    },
  });
  await renderer.init(ui.boardWrap);
  ui.boardWrap.prepend(renderer.app.canvas);

  const fit = (): void => {
    const side = root.querySelector('.side')?.getBoundingClientRect().width ?? 0;
    const hud = root.querySelector('.hud')?.getBoundingClientRect().height ?? 0;
    const shop = root.querySelector('.shop')?.getBoundingClientRect().height ?? 0;
    renderer.fit(window.innerWidth - side - 24, window.innerHeight - hud - shop - 24);
  };

  function begin(d: DifficultyId): void {
    session = new Session(d);
    session.blocked = blocked;
    const data = loadBrowserData();
    renderer.setup(data.stages[STAGE_ID], session.sim.catalog());
    ui.bind(session);
    fit();
  }

  window.__duskwardens = { session: () => session, renderer: () => renderer };
  window.addEventListener('resize', fit);
  ui.showStart();
  fit();

  renderer.app.ticker.add((ticker) => {
    if (!session) return;
    const dt = ticker.deltaMS;
    session.advance(dt);
    renderer.draw(session, performance.now(), dt, session.takeEvents());
    ui.update(session, renderer.tile);
  });

  return {
    setBlocked(b: boolean): void {
      blocked = b;
      if (session) session.blocked = b;
    },
  };
}
