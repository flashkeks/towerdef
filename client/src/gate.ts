/**
 * Desktop-Sperre (architecture.md §4). Abhaengigkeitsfrei und winzig: wird vor dem Spiel-Bundle geladen.
 * Entscheidend ist die Faehigkeit (Zeiger, Groesse), der User-Agent ist nur Zusatz.
 */
export type GateReason = 'touch-primary' | 'mobile-ua' | 'small-viewport';
export const MIN_VIEWPORT = { width: 1024, height: 600 };

/** Das Minimum an Window, das `gateReason` braucht (macht den Test mit einem Fake moeglich). */
export interface GateWindow {
  matchMedia(q: string): { matches: boolean };
  navigator: { maxTouchPoints?: number; userAgent: string; userAgentData?: { mobile?: boolean } };
  innerWidth: number;
  innerHeight: number;
}

export function gateReason(w: GateWindow = window as unknown as GateWindow): GateReason | null {
  const mm = (q: string): boolean => w.matchMedia(q).matches;
  const nav = w.navigator;
  const coarsePrimary = mm('(pointer: coarse)') && mm('(hover: none)');
  const noFinePointer = !mm('(any-pointer: fine)');
  if ((coarsePrimary && noFinePointer) || ((nav.maxTouchPoints ?? 0) > 0 && noFinePointer)) return 'touch-primary';
  if (nav.userAgentData?.mobile === true) return 'mobile-ua';
  if (/Android|iPhone|iPad|iPod|Mobile|Silk|Opera Mini/i.test(nav.userAgent)) return 'mobile-ua';
  if (w.innerWidth < MIN_VIEWPORT.width || w.innerHeight < MIN_VIEWPORT.height) return 'small-viewport';
  return null;
}
