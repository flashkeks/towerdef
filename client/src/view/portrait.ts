/**
 * Bild-URL einer Unit (Runde 8 / P2, zusammengefuehrt mit P4). Die Preview liefert Portraets unter `/aa/units/<id>.webp` (256 x 256, transparent);
 * lokal und in Screenshots gibt es sie nicht. Vereinbarte Signaturen: `portraitUrl(id): string`, `hasPortrait(id): Promise<boolean>`.
 *
 * Genau wird `hasPortrait` durch zwei Quellen:
 * - `client/public/aa/manifest.json` (Bild-Vorgabe des Importers): nur IDs darin kommen ueberhaupt in Frage (Crossover-Figuren, Unbekanntes: nie ein Bildversuch);
 * - `/aa/index.json`, wenn die Preview sie ausliefert (Liste der tatsaechlich vorhandenen IDs: Array, `{ units: [...] }` oder Objekt mit ID-Schluesseln):
 *   dann zaehlt nur sie. Fehlt die Datei (lokal immer), gilt der Ladeversuch je ID mit Fallback-Karte der UI bei Fehlern.
 */
import manifest from '../../public/aa/manifest.json';

export const portraitUrl = (id: string): string => `/aa/units/${encodeURIComponent(id)}.webp`;

const inManifest: ReadonlySet<string> = new Set(Object.keys((manifest as { units?: Record<string, unknown> }).units ?? {}));

/** Serie einer Unit aus dem Bild-Manifest (Feld `series`, seit Runde 10 / P1), sonst `null`. */
export function manifestSeries(id: string): string | null {
  const e = (manifest as { units?: Record<string, { series?: unknown }> }).units?.[id];
  return typeof e?.series === 'string' && e.series.trim() ? e.series : null;
}

/** Ids aus `/aa/index.json` bzw. `null` (noch nicht geladen / nicht vorhanden). */
let index: Set<string> | null = null;
let indexTried: Promise<void> | null = null;

/** Liest eine Index-Datei in ein ID-Set (tolerant gegenueber der Form). */
export function parseIndex(json: unknown): Set<string> {
  const out = new Set<string>();
  const take = (v: unknown): void => {
    if (typeof v === 'string') out.add(v.replace(/^.*\//, '').replace(/\.webp$/, ''));
  };
  if (Array.isArray(json)) json.forEach(take);
  else if (json && typeof json === 'object') {
    const o = json as { units?: unknown };
    if (Array.isArray(o.units)) o.units.forEach(take);
    else Object.keys((o.units as object) ?? json).forEach(take);
  }
  return out;
}

/** Index einmal laden (stilles Scheitern: lokal gibt es die Datei nicht). */
export function loadPortraitIndex(): Promise<void> {
  indexTried ??= (async () => {
    if (typeof fetch === 'undefined') return;
    try {
      const r = await fetch('/aa/index.json', { headers: { accept: 'application/json' } });
      if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return;
      const set = parseIndex(await r.json());
      if (set.size > 0) index = set;
    } catch {
      /* keine Datei: Fallback */
    }
  })();
  return indexTried;
}

/** Sofortige Antwort ohne Netz: `false` = sicher kein Bild, `true` = sicher vorhanden, `null` = unbekannt (Ladeversuch). */
export function portraitKnown(id: string): boolean | null {
  if (!inManifest.has(id)) return false;
  if (index) return index.has(id);
  return null;
}

const known = new Map<string, Promise<boolean>>();

/** `true`, wenn das Bild existiert bzw. geladen werden konnte. Ohne `Image` (Node, Tests) immer `false`. */
export function hasPortrait(id: string): Promise<boolean> {
  let hit = known.get(id);
  if (!hit) {
    hit = (async () => {
      await loadPortraitIndex();
      const k = portraitKnown(id);
      if (k !== null) return k;
      if (typeof Image === 'undefined') return false;
      return new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = portraitUrl(id);
      });
    })();
    known.set(id, hit);
  }
  return hit;
}
