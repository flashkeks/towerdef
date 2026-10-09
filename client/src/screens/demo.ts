/**
 * Vorfuehr-Seite der Meta-Bildschirme ohne echtes Match (Bilder, Handpruefung): /p4-screens.html?scene=home|result|knowledge|tower|notice|settings
 * Das Profil lebt nur im Speicher. `startMatch` ist ein Attrappe, die sofort ein Ergebnis liefert.
 */
import './../base.css';
import { applyMatch, newProfile, type Profile } from '../meta';
import { openStore } from '../meta/store';
import type { MatchOutcome } from '../meta/types';
import { runApp } from './app';

const q = new URLSearchParams(location.search);
const scene = q.get('scene') ?? 'home';

function seeded(): Profile {
  let p = newProfile('2026-10-09T10:00:00.000Z');
  if (scene === 'home' || scene === 'tower' || scene === 'knowledge') {
    // ein paar Partien gespielt: Level 5, Medaillen Easy + Medium, Turm-XP auf Stand
    const play = (id: string, d: 'easy' | 'medium' | 'hard', won: boolean, rounds: number, pops: number): void => {
      p = applyMatch(p, { matchId: id, map: 'meadow', difficulty: d, won, roundsCleared: rounds, livesLost: 12, pops: { ranger: pops, bombardier: Math.floor(pops / 2) }, towerXp: { ranger: 100, bombardier: 100, frostcaller: 100 }, towerXpGained: { ranger: Math.floor(pops / 3), bombardier: Math.floor(pops / 6), frostcaller: 0 } }).profile;
    };
    play('a', 'easy', true, 20, 1200);
    if (scene === 'knowledge') {
      play('c', 'medium', true, 20, 1500);
      p = { ...p, knowledge: ['head-start', 'better-deals', 'sharp-eyes', 'extra-lives'] };
    }
    if (scene === 'tower') p = { ...p, towerTiers: { ...p.towerTiers, ranger: [2, 3, 0] }, towerXp: { ...p.towerXp, ranger: 1130 } };
  }
  if (scene === 'notice') p = { ...p, showResetNotice: true };
  return p;
}

const fakeMatch = async (_root: HTMLElement, o: { difficulty: 'easy' | 'medium' | 'hard' }): Promise<MatchOutcome> => ({
  won: true, round: 20, difficulty: o.difficulty, livesLeft: 117, pops: { ranger: 900, bombardier: 700, frostcaller: 300, wren: 400 },
  upgrades: [
    ...Array.from({ length: 8 }, () => ({ tower: 'ranger' as const, path: 0, tier: 1 })),
    ...Array.from({ length: 6 }, () => ({ tower: 'bombardier' as const, path: 1, tier: 1 })),
    ...Array.from({ length: 3 }, () => ({ tower: 'frostcaller' as const, path: 2, tier: 1 })),
  ],
});

const store = await openStore({ memoryOnly: true });
await store.update(seeded());
const root = document.getElementById('app') as HTMLElement;
const route = scene === 'knowledge' ? ({ name: 'knowledge' } as const) : scene === 'tower' ? ({ name: 'towers', tower: 'ranger' } as const) : scene === 'settings' ? ({ name: 'settings' } as const) : scene === 'notice' ? ({ name: 'notice' } as const) : ({ name: 'home' } as const);
const app = await runApp(root, { startMatch: fakeMatch, store, initial: route });
if (scene === 'result') {
  // frisches Profil, volle Medium-Partie: Level 1 -> 5 in einem Match
  app.ctx.play('medium');
}
(window as unknown as { __ready: boolean; __app: unknown }).__app = app;
(window as unknown as { __ready: boolean }).__ready = true;
