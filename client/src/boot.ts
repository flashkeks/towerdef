/**
 * Allererster Einstieg: Desktop-Sperre pruefen, BEVOR das Spiel-Bundle (Pixi, Sim, Daten) geladen wird.
 * Nur ein Treffer der Sperre zeigt den Hinweis; sonst `import('./main')`. Prueft bei Groessen-/Zeigeraenderung erneut.
 */
import './base.css';
import { gateReason, MIN_VIEWPORT, type GateReason } from './gate';
import { t } from './i18n/t';

const root = document.getElementById('app') as HTMLElement;
document.title = t('game.title');

let game: { setBlocked(b: boolean): void } | null = null;
let loading = false;
let notice: HTMLElement | null = null;

function showNotice(reason: GateReason): void {
  hideNotice();
  const box = document.createElement('div');
  box.className = 'gate';
  box.dataset.reason = reason;
  const h1 = document.createElement('h1');
  h1.textContent = t('gate.title');
  const p = document.createElement('p');
  p.textContent = t('gate.text', { title: t('game.title') });
  box.append(h1, p);
  if (reason === 'small-viewport') {
    const small = document.createElement('p');
    small.textContent = t('gate.small', { w: MIN_VIEWPORT.width, h: MIN_VIEWPORT.height });
    box.append(small);
  }
  const back = import.meta.env.VITE_KEKGAME_URL as string | undefined;
  if (back) {
    const a = document.createElement('a');
    a.href = back;
    a.textContent = t('gate.back');
    box.append(a);
  }
  document.body.append(box);
  notice = box;
}

function hideNotice(): void {
  notice?.remove();
  notice = null;
}

async function check(): Promise<void> {
  const reason = gateReason();
  if (reason) {
    game?.setBlocked(true);
    showNotice(reason);
    return;
  }
  hideNotice();
  if (game) {
    game.setBlocked(false);
    return;
  }
  if (loading) return;
  loading = true;
  const mod = await import('./main');
  game = await mod.startGame(root);
  loading = false;
  // Fenster koennte waehrend des Ladens zu klein geworden sein
  if (gateReason()) void check();
}

window.addEventListener('resize', () => void check());
window.addEventListener('orientationchange', () => void check());
for (const q of ['(pointer: coarse)', '(any-pointer: fine)', '(hover: none)']) window.matchMedia(q).addEventListener('change', () => void check());
void check();
