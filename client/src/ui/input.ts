/** Eingabe: Tastatur (Esc, Leertaste, N, 1-9). Maus-Klicks auf Slots liegen heute in `slots.ts`/`panels`. Besitzer: P1 (Bedienbarkeit). */
import type { Session } from '../game/session';

export class Input {
  /** `getSession` liefert die laufende Runde oder null (Menue). */
  constructor(private readonly getSession: () => Session | null) {
    window.addEventListener('keydown', (e) => this.onKey(e));
  }

  private onKey(e: KeyboardEvent): void {
    const s = this.getSession();
    if (!s || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') s.cancel();
    else if (e.key === ' ') {
      e.preventDefault();
      s.togglePause();
    } else if (e.key === 'n' || e.key === 'N') s.startNextWave();
    else if (/^[1-9]$/.test(e.key)) {
      const d = s.teamCatalog()[Number(e.key) - 1];
      if (d) s.choosePlacing(d.id);
    }
  }
}
