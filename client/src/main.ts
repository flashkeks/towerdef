/**
 * Spiel-Bundle (nach bestandener Desktop-Pruefung aus boot.ts geladen).
 * Runde 11 / P0: Platzhalter, bis P3 die neue Match-Oberflaeche einhaengt.
 */
import './ui/kit/fonts.css';
import './ui/kit/tokens.css';
import { t } from './i18n/t';

export interface GameHandle {
  setBlocked(blocked: boolean): void;
}

export async function startGame(root: HTMLElement): Promise<GameHandle> {
  root.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'wip';
  const h1 = document.createElement('h1');
  h1.textContent = t('wip.title');
  const p = document.createElement('p');
  p.textContent = t('wip.text', { title: t('game.title') });
  box.append(h1, p);
  root.append(box);
  return { setBlocked: () => undefined };
}
