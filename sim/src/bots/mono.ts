import type { Bot } from './types.js';
import { policyBot } from './util.js';

/**
 * Runde 6 / P2, Messbot für „Spam ohne Limit“: nur eine Sorte, so viele Exemplare wie bezahlbar (kein Bot-Limit, kein Boss-Plan,
 * kein Sparen), Upgrades nur wenn keine Platzierung mehr möglich ist (`canUpgrade` nach der Platzierung bleibt aus: reines Spam).
 * Farm als Einzelsorte: keine Kampfkraft, nur zur Vollständigkeit der Reihe (`mono-farm` gewinnt nie).
 */
export const mono = (unitId: string, upgrades = false): Bot =>
  policyBot(`mono-${unitId}${upgrades ? '+up' : ''}`, {
    mono: unitId,
    save: false,
    bossPlan: false,
    canUpgrade: () => upgrades,
  });
