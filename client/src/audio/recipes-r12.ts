/** Klang-Rezepte der Runde 12: Powers, Store, Embers. Eigene Synthese, reine Daten (siehe recipes.ts). */
import type { Voice } from './recipes';

export const R12_RECIPES: Record<string, Voice[]> = {
  'power.gold': [
    { wave: 'triangle', f0: 1318, f1: 1318, dur: 0.07, vol: 0.16 },
    { wave: 'triangle', f0: 1760, f1: 1760, dur: 0.07, vol: 0.16, delay: 0.06 },
    { wave: 'triangle', f0: 2093, f1: 2093, dur: 0.14, vol: 0.16, delay: 0.12 },
    { wave: 'noise', f0: 9000, f1: 4000, dur: 0.3, vol: 0.05, delay: 0.1 },
  ],
  'power.throw': [
    { wave: 'sine', f0: 300, f1: 700, dur: 0.18, vol: 0.12 },
    { wave: 'noise', f0: 4000, f1: 1200, dur: 0.14, vol: 0.06 },
  ],
  'power.bomb': [
    { wave: 'noise', f0: 2200, f1: 90, dur: 0.42, vol: 0.38 },
    { wave: 'sawtooth', f0: 150, f1: 36, dur: 0.36, vol: 0.3, lp: 520 },
    { wave: 'square', f0: 900, f1: 300, dur: 0.1, vol: 0.08, lp: 3000 },
  ],
  'power.trap': [
    { wave: 'noise', f0: 1600, f1: 400, dur: 0.1, vol: 0.14 },
    { wave: 'triangle', f0: 220, f1: 140, dur: 0.1, vol: 0.12, delay: 0.04 },
  ],
  'power.trapFrost': [
    { wave: 'sine', f0: 1800, f1: 2800, dur: 0.14, vol: 0.1, vibHz: 20, vibSemi: 1 },
    { wave: 'noise', f0: 8000, f1: 3500, dur: 0.1, vol: 0.06, delay: 0.02 },
  ],
  'power.trapHit': [
    { wave: 'square', f0: 1400, f1: 900, dur: 0.04, vol: 0.08, lp: 4000 },
    { wave: 'noise', f0: 5000, f1: 2000, dur: 0.04, vol: 0.06 },
  ],
  'power.trapFreeze': [
    { wave: 'sine', f0: 2600, f1: 1400, dur: 0.12, vol: 0.09 },
    { wave: 'noise', f0: 7500, f1: 3000, dur: 0.08, vol: 0.05 },
  ],
  'power.warp': [
    { wave: 'sine', f0: 880, f1: 110, dur: 0.7, vol: 0.2, vibHz: 6, vibSemi: 1.5 },
    { wave: 'triangle', f0: 440, f1: 55, dur: 0.7, vol: 0.14 },
    { wave: 'noise', f0: 5000, f1: 300, dur: 0.6, vol: 0.05, attack: 0.1 },
  ],
  'power.oil': [
    { wave: 'noise', f0: 900, f1: 250, dur: 0.22, vol: 0.12 },
    { wave: 'sine', f0: 330, f1: 220, dur: 0.2, vol: 0.12 },
    { wave: 'triangle', f0: 880, f1: 1320, dur: 0.18, vol: 0.1, delay: 0.14 },
  ],
  'power.heart': [
    { wave: 'sine', f0: 392, f1: 392, dur: 0.12, vol: 0.2 },
    { wave: 'sine', f0: 523, f1: 523, dur: 0.12, vol: 0.2, delay: 0.1 },
    { wave: 'sine', f0: 659, f1: 659, dur: 0.12, vol: 0.2, delay: 0.2 },
    { wave: 'sine', f0: 784, f1: 784, dur: 0.3, vol: 0.2, delay: 0.3 },
  ],
  'power.hero': [
    { wave: 'square', f0: 330, f1: 330, dur: 0.08, vol: 0.16, lp: 3000 },
    { wave: 'square', f0: 440, f1: 440, dur: 0.08, vol: 0.16, lp: 3000, delay: 0.08 },
    { wave: 'square', f0: 659, f1: 659, dur: 0.08, vol: 0.18, lp: 3000, delay: 0.16 },
    { wave: 'square', f0: 880, f1: 880, dur: 0.22, vol: 0.2, lp: 3000, delay: 0.24 },
    { wave: 'sine', f0: 1760, f1: 1760, dur: 0.3, vol: 0.08, delay: 0.24 },
  ],
  'power.insta': [
    { wave: 'sine', f0: 140, f1: 50, dur: 0.18, vol: 0.3 },
    { wave: 'noise', f0: 900, f1: 200, dur: 0.14, vol: 0.2 },
    { wave: 'triangle', f0: 523, f1: 784, dur: 0.14, vol: 0.18, delay: 0.1 },
    { wave: 'triangle', f0: 784, f1: 1047, dur: 0.2, vol: 0.18, delay: 0.2 },
  ],
  'store.buy': [
    { wave: 'triangle', f0: 1568, f1: 1568, dur: 0.06, vol: 0.18 },
    { wave: 'triangle', f0: 2093, f1: 2093, dur: 0.22, vol: 0.18, delay: 0.06 },
    { wave: 'noise', f0: 9000, f1: 5000, dur: 0.12, vol: 0.05, delay: 0.04 },
    { wave: 'sine', f0: 392, f1: 523, dur: 0.16, vol: 0.12, delay: 0.1 },
  ],
  'store.poor': [
    { wave: 'square', f0: 196, f1: 147, dur: 0.16, vol: 0.14, lp: 1400 },
  ],
  'embers.count': [
    { wave: 'triangle', f0: 1175, f1: 1175, dur: 0.03, vol: 0.08 },
  ],
};
