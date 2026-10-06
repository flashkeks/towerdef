/**
 * Leak-Feedback in der Kopfzeile (P5): die Leben-Anzeige wackelt und blitzt rot, solange der Leak frisch ist.
 * Haengt nur am `GameBus` und setzt eine CSS-Klasse; der Rand-Blitz im Canvas steht in `game/fx.ts`.
 */
import type { GameBus } from '../game/events';

export function mountLeakShake(bus: GameBus): void {
  bus.onEvents((events) => {
    if (!events.some((e) => e.type === 'leak')) return;
    const el = document.querySelector<HTMLElement>('.hud .stat.lives');
    if (!el) return;
    el.classList.remove('leak-hit');
    void el.offsetWidth; // Animation neu starten
    el.classList.add('leak-hit');
  });
}
