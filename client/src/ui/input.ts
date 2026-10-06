/**
 * Eingabe: Tastatur (Esc, Leertaste, N, 1-9, U, T, A, S, ?/H) und Rechtsklick. Klicks auf Slots liegen in `slots.ts`.
 * Besitzer: P1 (Bedienbarkeit).
 */
import { SPEEDS, type Session } from '../game/session';

export class Input {
  /** `getSession` liefert die laufende Runde oder null (Menue). `onHelp` schaltet die Hilfe um, `helpOpen`/`closeHelp` fuer Esc. */
  constructor(
    private readonly getSession: () => Session | null,
    private readonly help: { toggle(): void; close(): void; readonly isOpen: boolean },
  ) {
    window.addEventListener('keydown', (e) => this.onKey(e));
    // Rechtsklick bricht ab (Platzieren/Auswahl); das Browser-Menue hat im Spiel nichts verloren.
    window.addEventListener('contextmenu', (e) => {
      const s = this.getSession();
      if (!s) return;
      e.preventDefault();
      s.cancel();
    });
  }

  private onKey(e: KeyboardEvent): void {
    const s = this.getSession();
    if (!s || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '?' || e.key === 'h' || e.key === 'H') {
      this.help.toggle();
      return;
    }
    if (this.help.isOpen) {
      if (e.key === 'Escape') this.help.close();
      return;
    }
    const k = e.key;
    if (k === 'Escape') s.cancel();
    else if (k === ' ') {
      e.preventDefault();
      s.togglePause();
    } else if (k === 'n' || k === 'N') s.startNextWave();
    else if (k === 'u' || k === 'U') s.upgrade();
    else if (k === 't' || k === 'T') s.cycleTargeting();
    else if (k === 'a' || k === 'A') s.useAbility();
    else if (k === 's' || k === 'S') s.setSpeed(SPEEDS[(SPEEDS.indexOf(s.speed) + 1) % SPEEDS.length]);
    else if (/^[1-9]$/.test(k)) {
      const d = s.sim.catalog()[Number(k) - 1];
      if (d) s.choosePlacing(d.id);
    }
  }
}
