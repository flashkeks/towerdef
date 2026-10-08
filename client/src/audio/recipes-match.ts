/**
 * Klang-Rezepte des Matches (Runde 10 / P2), reine Daten wie `recipes.ts`: Schuesse je Element (dezent, kurz), Krit, Faehigkeits-Ansage, Boss-Tod.
 * Eigene Synthese, keine Dateien. Spaeter tauschbare Dateien: siehe Wunschliste in STATUS (`client/public/sfx/`).
 */
import type { MatchSoundId } from './logic-match';
import type { Voice } from './recipes';

export const MATCH_RECIPES: Record<MatchSoundId, Voice[]> = {
  'hit.fire': [
    { wave: 'noise', f0: 2600, f1: 500, dur: 0.17, vol: 0.15, attack: 0.02 },
    { wave: 'sawtooth', f0: 280, f1: 120, dur: 0.12, vol: 0.07, lp: 900 },
  ],
  'hit.water': [
    { wave: 'sine', f0: 640, f1: 1150, dur: 0.1, vol: 0.14 },
    { wave: 'triangle', f0: 520, f1: 980, dur: 0.09, vol: 0.08, delay: 0.05 },
    { wave: 'noise', f0: 4200, f1: 1500, dur: 0.05, vol: 0.05 },
  ],
  'hit.ice': [
    { wave: 'triangle', f0: 2600, f1: 1800, dur: 0.09, vol: 0.12 },
    { wave: 'sine', f0: 3400, f1: 2200, dur: 0.12, vol: 0.08, delay: 0.02 },
    { wave: 'noise', f0: 9000, f1: 4000, dur: 0.05, vol: 0.08 },
  ],
  'hit.lightning': [
    { wave: 'sawtooth', f0: 1800, f1: 200, dur: 0.07, vol: 0.12, lp: 5000 },
    { wave: 'square', f0: 90, f1: 60, dur: 0.08, vol: 0.1, lp: 400 },
    { wave: 'noise', f0: 6000, f1: 1000, dur: 0.06, vol: 0.12 },
  ],
  'hit.air': [
    { wave: 'noise', f0: 3600, f1: 900, dur: 0.14, vol: 0.12, attack: 0.03 },
    { wave: 'sine', f0: 1200, f1: 700, dur: 0.1, vol: 0.05 },
  ],
  'hit.light': [
    { wave: 'sine', f0: 1568, f1: 2093, dur: 0.16, vol: 0.12, vibHz: 18, vibSemi: 0.6 },
    { wave: 'triangle', f0: 2349, f1: 2349, dur: 0.14, vol: 0.07, delay: 0.03 },
  ],
  'hit.dark': [
    { wave: 'sawtooth', f0: 160, f1: 70, dur: 0.22, vol: 0.13, lp: 500 },
    { wave: 'sine', f0: 90, f1: 55, dur: 0.24, vol: 0.12 },
    { wave: 'noise', f0: 400, f1: 120, dur: 0.18, vol: 0.06 },
  ],
  'hit.rose': [
    { wave: 'triangle', f0: 880, f1: 1175, dur: 0.1, vol: 0.1 },
    { wave: 'sine', f0: 1760, f1: 1568, dur: 0.14, vol: 0.06, delay: 0.05 },
  ],
  'hit.magic': [
    { wave: 'square', f0: 660, f1: 990, dur: 0.12, vol: 0.08, lp: 3000, vibHz: 14, vibSemi: 0.8 },
    { wave: 'sine', f0: 1320, f1: 1760, dur: 0.16, vol: 0.08, delay: 0.04 },
  ],
  crit: [
    { wave: 'square', f0: 1568, f1: 2093, dur: 0.06, vol: 0.14, lp: 4500 },
    { wave: 'triangle', f0: 2093, f1: 2093, dur: 0.12, vol: 0.12, delay: 0.05 },
    { wave: 'noise', f0: 7000, f1: 3000, dur: 0.05, vol: 0.1 },
  ],
  cutin: [
    { wave: 'sawtooth', f0: 200, f1: 800, dur: 0.26, vol: 0.16, lp: 2500, attack: 0.05 },
    { wave: 'noise', f0: 400, f1: 5000, dur: 0.3, vol: 0.16, attack: 0.08 },
    { wave: 'sine', f0: 90, f1: 45, dur: 0.5, vol: 0.3, delay: 0.26 },
    { wave: 'triangle', f0: 523, f1: 523, dur: 0.3, vol: 0.2, delay: 0.26 },
    { wave: 'triangle', f0: 784, f1: 784, dur: 0.34, vol: 0.2, delay: 0.32 },
    { wave: 'noise', f0: 3000, f1: 300, dur: 0.2, vol: 0.18, delay: 0.26 },
  ],
  bossDeath: [
    { wave: 'sawtooth', f0: 200, f1: 30, dur: 1.0, vol: 0.34, lp: 600 },
    { wave: 'noise', f0: 3000, f1: 60, dur: 0.9, vol: 0.32 },
    { wave: 'triangle', f0: 523, f1: 523, dur: 0.2, vol: 0.2, delay: 0.5 },
    { wave: 'triangle', f0: 659, f1: 659, dur: 0.2, vol: 0.2, delay: 0.66 },
    { wave: 'triangle', f0: 784, f1: 784, dur: 0.2, vol: 0.2, delay: 0.82 },
    { wave: 'triangle', f0: 1047, f1: 1047, dur: 0.5, vol: 0.24, delay: 0.98 },
  ],
};
