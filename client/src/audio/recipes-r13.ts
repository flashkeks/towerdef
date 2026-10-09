/** Klang-Rezepte der Runde 13: Longshot (Schuss, Ricochet, Markierung), Market (Muenzen, Bank), Faehigkeiten. Eigene Synthese (siehe recipes.ts). */
import type { Voice } from './recipes';

export const R13_RECIPES: Record<string, Voice[]> = {
  // Scharfschuss: kurzer Knall mit tiefem Schlag und hohem Peitschenton
  'shoot.snipe': [
    { wave: 'noise', f0: 5200, f1: 700, dur: 0.1, vol: 0.2 },
    { wave: 'square', f0: 1500, f1: 260, dur: 0.07, vol: 0.1, lp: 3200 },
    { wave: 'sine', f0: 140, f1: 55, dur: 0.16, vol: 0.2, delay: 0.01 },
  ],
  'ricochet': [
    { wave: 'triangle', f0: 2400, f1: 1500, dur: 0.05, vol: 0.09 },
    { wave: 'triangle', f0: 2800, f1: 1800, dur: 0.05, vol: 0.08, delay: 0.06 },
  ],
  'mark': [
    { wave: 'square', f0: 1100, f1: 1100, dur: 0.05, vol: 0.07, lp: 3000 },
    { wave: 'square', f0: 1650, f1: 1650, dur: 0.08, vol: 0.07, lp: 3000, delay: 0.07 },
  ],
  // Rundenende-Einkommen: drei helle Muenzklaenge
  'income': [
    { wave: 'triangle', f0: 1568, f1: 1568, dur: 0.06, vol: 0.12 },
    { wave: 'triangle', f0: 2093, f1: 2093, dur: 0.06, vol: 0.12, delay: 0.07 },
    { wave: 'triangle', f0: 2637, f1: 2637, dur: 0.12, vol: 0.12, delay: 0.14 },
    { wave: 'noise', f0: 9000, f1: 5000, dur: 0.12, vol: 0.03, delay: 0.1 },
  ],
  'coin.land': [{ wave: 'triangle', f0: 2349, f1: 2637, dur: 0.05, vol: 0.07 }],
  // Bank abheben: Deckel knarrt auf, Muenzen rieseln
  'withdraw': [
    { wave: 'sawtooth', f0: 180, f1: 320, dur: 0.14, vol: 0.09, lp: 900 },
    { wave: 'noise', f0: 8000, f1: 3000, dur: 0.3, vol: 0.06, delay: 0.1 },
    { wave: 'triangle', f0: 1760, f1: 1760, dur: 0.06, vol: 0.12, delay: 0.14 },
    { wave: 'triangle', f0: 2349, f1: 2349, dur: 0.1, vol: 0.12, delay: 0.22 },
  ],
  // Fokus: aufsteigendes Rauschen
  'focus': [
    { wave: 'sine', f0: 330, f1: 990, dur: 0.4, vol: 0.12, vibHz: 12, vibSemi: 0.6 },
    { wave: 'noise', f0: 1200, f1: 6000, dur: 0.35, vol: 0.05, attack: 0.1 },
  ],
  // Supply Drop: Pfeifen, dumpfer Aufprall, Klingeln
  'supply': [
    { wave: 'sine', f0: 1500, f1: 500, dur: 0.5, vol: 0.07 },
    { wave: 'sine', f0: 120, f1: 45, dur: 0.2, vol: 0.22, delay: 0.5 },
    { wave: 'triangle', f0: 1760, f1: 1760, dur: 0.08, vol: 0.12, delay: 0.62 },
    { wave: 'triangle', f0: 2349, f1: 2349, dur: 0.14, vol: 0.12, delay: 0.7 },
  ],
  // Grant: Siegel-Stempel und Muenzregen
  'grant': [
    { wave: 'square', f0: 200, f1: 70, dur: 0.12, vol: 0.2, lp: 1200 },
    { wave: 'triangle', f0: 1318, f1: 1318, dur: 0.07, vol: 0.14, delay: 0.1 },
    { wave: 'triangle', f0: 1760, f1: 1760, dur: 0.07, vol: 0.14, delay: 0.17 },
    { wave: 'triangle', f0: 2093, f1: 2093, dur: 0.16, vol: 0.14, delay: 0.24 },
    { wave: 'noise', f0: 9000, f1: 4000, dur: 0.4, vol: 0.05, delay: 0.15 },
  ],
};
