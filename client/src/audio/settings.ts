/**
 * Lautstaerke-Einstellungen (Runde 12): Musik und Soundeffekte getrennt, je 0..1 (0 = stumm).
 * Alte Staende (`vol`, `muted`, `music`) werden uebernommen: Effekte = vol (0 bei muted), Musik = vol (0 bei muted oder music=false).
 * Reine Funktionen, in Node testbar; `engine.ts` liest und schreibt nur ueber sie.
 */
export interface AudioSettings { musicVol: number; sfxVol: number }
export const DEFAULT_AUDIO: AudioSettings = { musicVol: 0.5, sfxVol: 0.6 };
export const AUDIO_KEY = 'dw.audio';

const clamp01 = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : fallback);

/** Gespeicherten Wert (beliebiges JSON) in neue Einstellungen uebersetzen. `stored` = es gab etwas Brauchbares. */
export function migrateAudio(raw: unknown): { settings: AudioSettings; stored: boolean } {
  if (!raw || typeof raw !== 'object') return { settings: { ...DEFAULT_AUDIO }, stored: false };
  const o = raw as Record<string, unknown>;
  if ('musicVol' in o || 'sfxVol' in o) return { settings: { musicVol: clamp01(o.musicVol, DEFAULT_AUDIO.musicVol), sfxVol: clamp01(o.sfxVol, DEFAULT_AUDIO.sfxVol) }, stored: true };
  if ('vol' in o || 'muted' in o || 'music' in o) {
    const vol = clamp01(o.vol, 0.7);
    const muted = o.muted === true;
    const music = o.music !== false;
    return { settings: { sfxVol: muted ? 0 : vol, musicVol: muted || !music ? 0 : vol }, stored: true };
  }
  return { settings: { ...DEFAULT_AUDIO }, stored: false };
}

/** Prozent (0..100, ganzzahlig) <-> Anteil */
export const toPct = (v: number): number => Math.round(Math.max(0, Math.min(1, v)) * 100);
export const fromPct = (p: number): number => Math.max(0, Math.min(100, Math.round(p))) / 100;

/** Schnittstelle fuer Regler in Match und Menues (Engine implementiert sie, Tests setzen eine Attrappe ein). */
export interface VolumeApi {
  get(): { music: number; sfx: number };
  /** v = Prozent 0..100 */
  set(kind: 'music' | 'sfx', pct: number): void;
  /** Kurz-Stumm (Taste M): nicht gespeichert */
  toggleQuiet(): boolean;
  readonly quiet: boolean;
}
