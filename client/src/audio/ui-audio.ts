/**
 * Zugang der Bildschirme zum Ton (Runde 10, P3). Die Oberflaeche kennt den `AudioEngine` nicht direkt (der entsteht in `main.ts`), sondern ruft
 * `uiSound('ui.click')` auf; ohne Engine (Tests, vor dem Start, kein WebAudio) passiert nichts. Drosselung je Klang steht hier, nicht in der Engine.
 */
import type { AudioEngine } from './engine';
import { chargeVoices, UI_GAP_MS, type MenuThemeId, type UiSoundId } from './recipes-ui';

let engine: AudioEngine | null = null;
const last = new Map<string, number>();

export function registerAudio(e: AudioEngine | null): void {
  engine = e;
}

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** Menue-/Beschwoer-Klang. `rate` verstimmt leicht (Zaehler-Ticks steigen mit dem Wert). */
export function uiSound(id: UiSoundId, gain = 1, rate = 1): void {
  if (!engine) return;
  const gap = UI_GAP_MS[id];
  if (gap) {
    const t = now();
    const l = last.get(id);
    if (l !== undefined && t - l < gap) return;
    last.set(id, t);
  }
  engine.playUi(id, gain, rate);
}

/** Aufstieg des Beschwoerens: `stages` Farbstufen ueber `ms` Millisekunden. */
export function chargeSound(stages: number, ms: number): void {
  engine?.playVoices(chargeVoices(stages, ms));
}

/** Stimmung der Menue-Musik (Lobby, Summon, ...). */
export function menuTheme(id: MenuThemeId): void {
  engine?.setMenuTheme(id);
}

export const hasAudio = (): boolean => engine !== null;
