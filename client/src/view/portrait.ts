/**
 * Portrait-Bilder der Units: `/aa/units/<unit-id>.webp` (Runde 8: auf der Preview liegen 473 von 561, lokal keine).
 * Kleine Fassung von P4 mit der Signatur, die P2 in dieser Datei ebenfalls anlegt; beim Merge gilt die von P2 (gleiche Namen).
 * Der Client faellt bei fehlendem Bild auf eine gestaltete Karte zurueck (`ui/kit/index.ts` merkt sich Fehlschlaege selbst).
 */

/** Basis-URL (Vite `base`), immer mit Schraegstrich am Ende. */
const BASE = ((import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/').replace(/\/?$/, '/');

/** URL des Portrait-Bildes einer Unit (muss nicht existieren). */
export const portraitUrl = (id: string): string => `${BASE}aa/units/${encodeURIComponent(id)}.webp`;

/** Gibt es ein Bild? Ohne Manifest nicht vorab zu wissen: optimistisch `true`, die UI faellt bei einem Ladefehler zurueck. */
export const hasPortrait = (_id: string): boolean => true;
