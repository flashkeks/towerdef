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

/** Pruefzugriff (Smoke, Screenshots): die letzten Menue-Klaenge in Reihenfolge, auch ohne laufendes Audio. Aendert nichts am Ton. */
function logSound(id: UiSoundId): void {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { __uiSounds?: { n: number; last: string[] } };
  const log = (w.__uiSounds ??= { n: 0, last: [] });
  log.n++;
  log.last.push(id);
  if (log.last.length > 40) log.last.shift();
}

/** Menue-/Beschwoer-Klang. `rate` verstimmt leicht (Zaehler-Ticks steigen mit dem Wert). */
export function uiSound(id: UiSoundId, gain = 1, rate = 1): void {
  logSound(id);
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

const CLICKABLE = 'button, .btn, [role="button"], a[href], summary, .tile, [data-go], .switch, .unit-tile[data-owned], input[type="range"]';
let installed = false;

/**
 * Hover und Klick fuer alle Knoepfe der Bildschirme, an einer Stelle (Delegation am Dokument), damit kein Bildschirm einzeln verdrahtet werden
 * muss und neue Knoepfe von selbst Ton bekommen. `data-sfx="none"` am Element schaltet den Klang ab (dann spielt der Bildschirm einen eigenen),
 * `.menu-back` und Abbrechen klingen als "zurueck". Maus-Hover nur mit Zeigergeraet Maus, nicht bei Touch.
 */
export function installUiSounds(doc: Document = document): void {
  if (installed) return;
  installed = true;
  let lastHover: Element | null = null;
  const find = (e: Event): HTMLElement | null => {
    const el = (e.target as Element | null)?.closest?.(CLICKABLE) as HTMLElement | null;
    if (!el || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return null;
    return el;
  };
  doc.addEventListener(
    'pointerover',
    (e) => {
      if ((e as PointerEvent).pointerType && (e as PointerEvent).pointerType !== 'mouse') return;
      const el = find(e);
      if (!el || el === lastHover) return;
      lastHover = el;
      uiSound('ui.hover');
    },
    true,
  );
  doc.addEventListener(
    'pointerout',
    (e) => {
      if (!(e.relatedTarget instanceof Element) || !lastHover?.contains(e.relatedTarget)) lastHover = null;
    },
    true,
  );
  doc.addEventListener(
    'click',
    (e) => {
      const el = find(e);
      if (!el || el.dataset.sfx === 'none') return;
      uiSound(el.matches('.menu-back, .confirm-no') ? 'ui.back' : 'ui.click');
    },
    true,
  );
}
