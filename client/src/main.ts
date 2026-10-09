/**
 * Spiel-Bundle (nach bestandener Desktop-Pruefung aus boot.ts geladen): startet die Meta-Huelle
 * (Startseite -> Match -> Ergebnis, `screens/app.ts`). URL-Parameter fuer Pruefskripte:
 *   ?debug oder ?test  alles freigeschaltet, Profil nur im Speicher (verschmutzt den echten Spielstand nicht)
 *   ?hooks             Pruefskripte (Runde 11b): normales Profil (Sperren sichtbar, Level 4 = alle Tuerme), nur im Arbeitsspeicher, dazu `window.__dw`
 *   ?seed=N            fester Seed fuer das Match
 */
import './ui/kit/fonts.css';
import './ui/kit/tokens.css';
import './ui/kit/kit.css';
import { startMatch } from './match/match';
import { audio } from './audio/engine';
import { runApp, type SoundId } from './screens';
import { newProfile, xpForLevel } from './meta';
import { openStore } from './meta/store';

export interface GameHandle {
  setBlocked(blocked: boolean): void;
}

const SOUND: Record<SoundId, string> = { click: 'ui.click', buy: 'ui.buy', unlock: 'ui.unlock', levelup: 'ui.levelup', error: 'ui.bad', xp: 'ui.tick', storeBuy: 'store.buy', ember: 'embers.count' };

export async function startGame(root: HTMLElement): Promise<GameHandle> {
  root.innerHTML = '';
  const q = new URLSearchParams(location.search);
  const test = q.has('debug') || q.has('test');
  const hooks = q.has('hooks');
  const store = await openStore({ memoryOnly: test || hooks });
  if (test) {
    const p = newProfile();
    await store.update({ ...p, settings: { ...p.settings, unlockAll: true } });
  }
  if (hooks && !test) await store.update({ ...newProfile(), playerXp: xpForLevel(4) });
  audio.attach(); // AudioContext schon beim ersten Klick/Tastendruck im Menue entsperren
  void runApp(root, {
    store,
    startMatch: (r, o) => startMatch(r, { ...o, debug: q.has('debug') || hooks, seed: q.has('seed') ? Number(q.get('seed')) : undefined }),
    sound: (id) => audio.play(SOUND[id]),
    audio: audio.volumeApi,
    adoptLegacyVolume: (pct) => audio.adoptLegacy(pct),
    // Menue-Musik entfernt (Max, 09.10.2026): im Menue nur Klick-/UI-Toene, Musik nur im Match
    theme: () => undefined,
  });
  return { setBlocked: () => undefined };
}
