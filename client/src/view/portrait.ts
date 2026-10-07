/**
 * Bild-URL einer Unit (Runde 8 / P2). Die Preview liefert Portraets unter `/aa/units/<id>.webp` (256 x 256, transparent);
 * lokal und in Screenshots gibt es sie nicht. `hasPortrait` prueft einmal je ID (Ergebnis wird gemerkt), ob das Bild laedt;
 * die Fallback-Karte baut die UI (P4). Vereinbarte Signaturen: `portraitUrl(id: string): string`, `hasPortrait(id): Promise<boolean>`.
 */
export const portraitUrl = (id: string): string => `/aa/units/${encodeURIComponent(id)}.webp`;

const known = new Map<string, Promise<boolean>>();

/** `true`, wenn das Bild geladen werden konnte. Ohne `Image` (Node, Tests) immer `false`. */
export function hasPortrait(id: string): Promise<boolean> {
  let hit = known.get(id);
  if (!hit) {
    hit = new Promise<boolean>((resolve) => {
      if (typeof Image === 'undefined') return resolve(false);
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = portraitUrl(id);
    });
    known.set(id, hit);
  }
  return hit;
}
