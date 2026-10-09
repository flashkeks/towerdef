/**
 * Spiel-Bundle (nach bestandener Desktop-Pruefung aus boot.ts geladen): startet die App-Huelle
 * (Startbildschirm -> Match -> Ergebnis, `app/app.ts`).
 */
import './ui/kit/fonts.css';
import './ui/kit/tokens.css';
import './ui/kit/kit.css';
import { runApp } from './app/app';

export interface GameHandle {
  setBlocked(blocked: boolean): void;
}

export async function startGame(root: HTMLElement): Promise<GameHandle> {
  root.innerHTML = '';
  void runApp(root);
  return { setBlocked: () => undefined };
}
