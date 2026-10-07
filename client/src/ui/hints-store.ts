/** Ersthinweise: Speicher (localStorage, alles in try/catch) und die Schritt-Logik. Kein DOM. */
export const HINTS_KEY = 'dw.hints';

export interface KeyValueStore {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

/** localStorage kann fehlen oder werfen (privates Fenster, gesperrte Daten): dann gelten die Hinweise als an, ohne zu speichern. */
const defaultStore = (): KeyValueStore | null => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

export function hintsOff(store: KeyValueStore | null = defaultStore()): boolean {
  try {
    return store?.getItem(HINTS_KEY) === '1';
  } catch {
    return false;
  }
}

export function setHintsOff(off: boolean, store: KeyValueStore | null = defaultStore()): void {
  try {
    store?.setItem(HINTS_KEY, off ? '1' : '0');
  } catch {
    /* nicht speicherbar: die Hinweise kommen dann naechstes Mal wieder */
  }
}

export type HintStep = 1 | 2 | 3 | 'done';

/** Schritt 1: Unit waehlen, 2: Feld klicken, 3: Welle starten. Fertig, sobald die erste Welle laeuft. */
export function hintStep(p: { phase: string; placing: boolean; units: number }): HintStep {
  if (p.phase !== 'prep') return 'done';
  if (p.units > 0) return 3;
  return p.placing ? 2 : 1;
}
