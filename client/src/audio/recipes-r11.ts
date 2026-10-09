/** Klang-Rezepte der Runde 11 (Match): Abschuss je Turm, Platzen, Explosion, Blitz, Kauf, Runden, Boss. Eigene Synthese, reine Daten. */
import type { Voice } from './recipes';

export const R11_RECIPES: Record<string, Voice[]> = {
  'shoot.ranger': [
    { wave: 'triangle', f0: 640, f1: 260, dur: 0.07, vol: 0.14, lp: 3200 },
    { wave: 'noise', f0: 5200, f1: 1800, dur: 0.05, vol: 0.07 },
  ],
  'shoot.ballista': [
    { wave: 'sawtooth', f0: 300, f1: 90, dur: 0.14, vol: 0.18, lp: 1400 },
    { wave: 'noise', f0: 3000, f1: 600, dur: 0.1, vol: 0.1 },
  ],
  'shoot.volley': [
    { wave: 'triangle', f0: 720, f1: 300, dur: 0.06, vol: 0.12, lp: 3400 },
    { wave: 'triangle', f0: 840, f1: 340, dur: 0.06, vol: 0.09, delay: 0.025, lp: 3400 },
  ],
  'shoot.bomb': [
    { wave: 'sine', f0: 180, f1: 55, dur: 0.16, vol: 0.28 },
    { wave: 'noise', f0: 1400, f1: 200, dur: 0.12, vol: 0.14 },
  ],
  'shoot.frost': [
    { wave: 'sine', f0: 1500, f1: 2600, dur: 0.12, vol: 0.1, vibHz: 18, vibSemi: 1 },
    { wave: 'noise', f0: 7500, f1: 3500, dur: 0.07, vol: 0.06 },
  ],
  'shoot.hero': [
    { wave: 'sine', f0: 520, f1: 880, dur: 0.12, vol: 0.14 },
    { wave: 'triangle', f0: 1040, f1: 1760, dur: 0.1, vol: 0.07, delay: 0.02 },
  ],
  'shoot.chain': [
    { wave: 'sawtooth', f0: 1900, f1: 160, dur: 0.12, vol: 0.14, lp: 5200 },
    { wave: 'noise', f0: 6500, f1: 900, dur: 0.1, vol: 0.12 },
    { wave: 'square', f0: 80, f1: 50, dur: 0.12, vol: 0.1, lp: 380 },
  ],
  pop: [
    { wave: 'square', f0: 880, f1: 1320, dur: 0.045, vol: 0.1, lp: 4200 },
    { wave: 'noise', f0: 5000, f1: 1500, dur: 0.05, vol: 0.09 },
  ],
  'pop.big': [
    { wave: 'square', f0: 330, f1: 150, dur: 0.12, vol: 0.14, lp: 1800 },
    { wave: 'noise', f0: 3000, f1: 400, dur: 0.13, vol: 0.14 },
  ],
  tink: [
    { wave: 'triangle', f0: 2400, f1: 1900, dur: 0.07, vol: 0.12 },
    { wave: 'square', f0: 3600, f1: 3000, dur: 0.04, vol: 0.05, lp: 6000 },
  ],
  explode: [
    { wave: 'noise', f0: 1800, f1: 120, dur: 0.34, vol: 0.34 },
    { wave: 'sawtooth', f0: 140, f1: 38, dur: 0.3, vol: 0.28, lp: 520 },
  ],
  'explode.mini': [
    { wave: 'noise', f0: 2400, f1: 300, dur: 0.12, vol: 0.14 },
    { wave: 'sine', f0: 190, f1: 70, dur: 0.1, vol: 0.12 },
  ],
  quake: [
    { wave: 'sine', f0: 70, f1: 28, dur: 0.6, vol: 0.4 },
    { wave: 'noise', f0: 700, f1: 80, dur: 0.5, vol: 0.28 },
  ],
  nova: [
    { wave: 'triangle', f0: 3200, f1: 800, dur: 0.22, vol: 0.12 },
    { wave: 'noise', f0: 8000, f1: 2000, dur: 0.18, vol: 0.1 },
  ],
  freeze: [
    { wave: 'sine', f0: 2800, f1: 1200, dur: 0.3, vol: 0.12, vibHz: 22, vibSemi: 1.5 },
    { wave: 'noise', f0: 9000, f1: 3000, dur: 0.3, vol: 0.1 },
  ],
  leak: [
    { wave: 'sawtooth', f0: 420, f1: 160, dur: 0.22, vol: 0.2, lp: 1200 },
    { wave: 'square', f0: 210, f1: 80, dur: 0.26, vol: 0.14, lp: 700, delay: 0.05 },
  ],
  buy: [
    { wave: 'square', f0: 260, f1: 420, dur: 0.08, vol: 0.16, lp: 2600 },
    { wave: 'triangle', f0: 520, f1: 780, dur: 0.12, vol: 0.14, delay: 0.06 },
    { wave: 'sine', f0: 150, f1: 55, dur: 0.12, vol: 0.2, delay: 0.14 },
  ],
  roundStart: [
    { wave: 'square', f0: 392, f1: 392, dur: 0.1, vol: 0.14, lp: 2800 },
    { wave: 'square', f0: 587, f1: 587, dur: 0.16, vol: 0.14, delay: 0.1, lp: 2800 },
  ],
  roundEnd: [
    { wave: 'triangle', f0: 880, f1: 880, dur: 0.07, vol: 0.18 },
    { wave: 'triangle', f0: 1175, f1: 1175, dur: 0.07, vol: 0.18, delay: 0.07 },
    { wave: 'triangle', f0: 1568, f1: 1568, dur: 0.16, vol: 0.18, delay: 0.14 },
  ],
  boss: [
    { wave: 'sawtooth', f0: 110, f1: 82, dur: 0.9, vol: 0.28, lp: 520, attack: 0.08 },
    { wave: 'sawtooth', f0: 165, f1: 123, dur: 0.9, vol: 0.18, lp: 520, attack: 0.1 },
    { wave: 'noise', f0: 400, f1: 100, dur: 0.8, vol: 0.1, attack: 0.1 },
  ],
  bossPlate: [
    { wave: 'noise', f0: 2400, f1: 200, dur: 0.3, vol: 0.28 },
    { wave: 'square', f0: 160, f1: 60, dur: 0.25, vol: 0.2, lp: 700 },
  ],
  levelup: [
    { wave: 'triangle', f0: 523, f1: 523, dur: 0.1, vol: 0.2 },
    { wave: 'triangle', f0: 659, f1: 659, dur: 0.1, vol: 0.2, delay: 0.1 },
    { wave: 'triangle', f0: 784, f1: 784, dur: 0.1, vol: 0.2, delay: 0.2 },
    { wave: 'triangle', f0: 1047, f1: 1047, dur: 0.3, vol: 0.22, delay: 0.3 },
  ],
  ability: [
    { wave: 'sawtooth', f0: 200, f1: 900, dur: 0.35, vol: 0.2, lp: 2600, attack: 0.05 },
    { wave: 'noise', f0: 2000, f1: 6000, dur: 0.3, vol: 0.12 },
  ],
  flare: [
    { wave: 'sine', f0: 400, f1: 1600, dur: 0.4, vol: 0.2 },
    { wave: 'noise', f0: 4000, f1: 800, dur: 0.4, vol: 0.14 },
  ],
  click: [{ wave: 'square', f0: 700, f1: 520, dur: 0.04, vol: 0.1, lp: 3000 }],
};
