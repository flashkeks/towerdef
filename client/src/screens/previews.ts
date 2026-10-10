/**
 * Vorschaubilder der Karten fuer die Kartenwahl (Runde 15 C). Die Karten werden im Code gemalt (Frostfen ~1 s, Quarry ~2 s),
 * das blockiert den Hauptfaden. Darum malt eine Warteschlange sie nacheinander im Hintergrund, mit Luft dazwischen; die Kachel
 * zeigt bis dahin einen Platzhalter. Dieselben gemalten Karten nutzt danach das Match (Cache in `pixel/map/maps.ts`).
 */
import { MAP_IDS, mapPreview, type MapId } from '../pixel/map/maps';

const done = new Map<string, HTMLCanvasElement>();
const waiting = new Map<string, ((c: HTMLCanvasElement) => void)[]>();
let running = false;

function pump(): void {
  if (running) return;
  const id = [...waiting.keys()][0] ?? MAP_IDS.find((m) => !done.has(m));
  if (!id) return;
  running = true;
  setTimeout(() => {
    try {
      if (!done.has(id)) done.set(id, mapPreview(id as MapId).toCanvas());
      for (const cb of waiting.get(id) ?? []) cb(done.get(id)!);
    } finally {
      waiting.delete(id);
      running = false;
    }
    pump();
  }, 30);
}

/** Vorschau (160 x 90) einer Karte: sofort, wenn schon gemalt, sonst per Rueckruf. Der Aufrufer bekommt immer eine eigene Kopie. */
export function previewFor(id: string, cb: (c: HTMLCanvasElement) => void): HTMLCanvasElement | null {
  const copy = (c: HTMLCanvasElement): HTMLCanvasElement => {
    const o = document.createElement('canvas');
    o.width = c.width; o.height = c.height;
    o.getContext('2d')?.drawImage(c, 0, 0);
    return o;
  };
  const got = done.get(id);
  if (got) return copy(got);
  waiting.set(id, [...(waiting.get(id) ?? []), (c) => cb(copy(c))]);
  pump();
  return null;
}

/** Alle drei Vorschauen im Hintergrund vorbereiten (beim Start der Huelle). */
export function warmPreviews(): void {
  pump();
}
