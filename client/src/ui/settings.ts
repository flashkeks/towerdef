/**
 * Einstellungen des Spielers: typisiertes Get/Set ueber `localStorage` (try/catch, das Spiel laeuft auch ohne Speicher).
 * Besitzer: P6. Andere Pakete LESEN nur: P5 (Ton) liest `getSettings().master/sfx/music`, Effekte lesen `damageNumbers`,
 * der Client setzt die Start-Geschwindigkeit aus `defaultSpeed`. Lautstaerken sind 0..1.
 */
export interface Settings {
  /** Gesamtlautstaerke 0..1 */
  master: number;
  /** Effekte 0..1 (wirksam: master * sfx) */
  sfx: number;
  /** Musik 0..1 (wirksam: master * music) */
  music: number;
  /** Runde 10 / P3: ruhige Hintergrundmusik in Lobby und Menues (im Match spielt das Match-Lied ueber den Regler `music`) */
  menuMusic: boolean;
  /** Schadenszahlen ueber den Gegnern */
  damageNumbers: boolean;
  /** Bildschirmruckeln bei grossen Treffern, Faehigkeiten und Bossen (Runde 10); aus = Bild bleibt ruhig */
  screenShake: boolean;
  /** Start-Geschwindigkeit einer neuen Runde */
  defaultSpeed: 1 | 2 | 3;
}

export const DEFAULT_SETTINGS: Readonly<Settings> = { master: 0.8, sfx: 1, music: 0.6, menuMusic: true, damageNumbers: true, screenShake: true, defaultSpeed: 1 };

export const SETTINGS_KEY = 'dw.settings';
/** Schluessel der Erst-Start-Hinweise (P1 legt sie dort ab, `resetHints` loescht sie). */
export const HINTS_KEY = 'dw.hints';
export const TEAM_KEY = 'dw.team';

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function readJson(key: string): unknown {
  try {
    const raw = storage()?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    storage()?.setItem(key, JSON.stringify(value));
  } catch {
    /* Speicher gesperrt oder voll: Spiel laeuft weiter, Wert gilt nur fuer diese Sitzung */
  }
}

const clamp01 = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback);

/** Macht aus beliebigem (kaputtem) JSON gueltige Einstellungen; fehlende oder falsche Felder fallen auf den Standard. */
export function sanitize(raw: unknown): Settings {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_SETTINGS;
  return {
    master: clamp01(o.master, d.master),
    sfx: clamp01(o.sfx, d.sfx),
    music: clamp01(o.music, d.music),
    menuMusic: typeof o.menuMusic === 'boolean' ? o.menuMusic : d.menuMusic,
    damageNumbers: typeof o.damageNumbers === 'boolean' ? o.damageNumbers : d.damageNumbers,
    screenShake: typeof o.screenShake === 'boolean' ? o.screenShake : d.screenShake,
    defaultSpeed: o.defaultSpeed === 2 || o.defaultSpeed === 3 ? o.defaultSpeed : 1,
  };
}

/** Haelt die Werte im Speicher, damit auch ohne localStorage innerhalb der Sitzung gilt, was gesetzt wurde. */
let cache: Settings | null = null;

export function getSettings(): Settings {
  if (!cache) cache = sanitize(readJson(SETTINGS_KEY));
  return { ...cache };
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): Settings {
  cache = sanitize({ ...getSettings(), [key]: value });
  writeJson(SETTINGS_KEY, cache);
  return { ...cache };
}

/** Nur fuer Tests: Zwischenspeicher verwerfen, naechstes `getSettings` liest neu. */
export function resetSettingsCache(): void {
  cache = null;
}

/** Erst-Start-Hinweise wieder zeigen lassen. */
export function resetHints(): void {
  try {
    storage()?.removeItem(HINTS_KEY);
  } catch {
    /* egal */
  }
}
