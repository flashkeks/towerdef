/** Klang-Rezepte der Runde 14: Thornweaver (Dornen, Wirbelwind, Baumwand, Ranken), Alchemist (Trank, Saeure, Monster), Gold, Leben. Eigene Synthese. */
import type { Voice } from './recipes';

export const R14_RECIPES: Record<string, Voice[]> = {
  // Dornenfaecher: weiches Zupfen mit kurzem Rauschen
  'shoot.thorn': [
    { wave: 'triangle', f0: 820, f1: 420, dur: 0.07, vol: 0.09 },
    { wave: 'noise', f0: 3800, f1: 1400, dur: 0.06, vol: 0.05 },
  ],
  // Trank wird geworfen: Glas-Pfeifen
  'shoot.potion': [
    { wave: 'sine', f0: 700, f1: 1250, dur: 0.12, vol: 0.08 },
    { wave: 'noise', f0: 2600, f1: 900, dur: 0.1, vol: 0.04, delay: 0.02 },
  ],
  // Saeurespritzer: Zischen und Blubbern
  'splash.acid': [
    { wave: 'noise', f0: 5200, f1: 1800, dur: 0.22, vol: 0.09 },
    { wave: 'sine', f0: 240, f1: 420, dur: 0.1, vol: 0.06, delay: 0.04 },
    { wave: 'sine', f0: 310, f1: 520, dur: 0.08, vol: 0.05, delay: 0.12 },
  ],
  // Unstable Concoction: dumpfes Platzen
  'burst.unstable': [
    { wave: 'sine', f0: 170, f1: 50, dur: 0.2, vol: 0.2 },
    { wave: 'noise', f0: 3000, f1: 500, dur: 0.18, vol: 0.1 },
  ],
  'whirlwind': [
    { wave: 'noise', f0: 600, f1: 2600, dur: 0.5, vol: 0.09, attack: 0.15 },
    { wave: 'sine', f0: 180, f1: 320, dur: 0.45, vol: 0.05, vibHz: 9, vibSemi: 0.8 },
  ],
  'vine': [
    { wave: 'sawtooth', f0: 150, f1: 260, dur: 0.14, vol: 0.05, lp: 800 },
    { wave: 'noise', f0: 1800, f1: 600, dur: 0.12, vol: 0.04 },
  ],
  'zone': [{ wave: 'noise', f0: 900, f1: 300, dur: 0.14, vol: 0.04 }],
  // Baumwand waechst: Knarren und dumpfer Schlag
  'wall': [
    { wave: 'sawtooth', f0: 90, f1: 160, dur: 0.4, vol: 0.09, lp: 700, attack: 0.1 },
    { wave: 'noise', f0: 1400, f1: 400, dur: 0.35, vol: 0.06 },
    { wave: 'sine', f0: 110, f1: 45, dur: 0.18, vol: 0.2, delay: 0.3 },
  ],
  'wall.eat': [{ wave: 'noise', f0: 2200, f1: 500, dur: 0.1, vol: 0.05 }],
  'wall.gone': [
    { wave: 'noise', f0: 1800, f1: 300, dur: 0.3, vol: 0.07 },
    { wave: 'triangle', f0: 300, f1: 140, dur: 0.2, vol: 0.05 },
  ],
  // Buff-Trank: Gluckern nach oben
  'brew': [
    { wave: 'sine', f0: 400, f1: 700, dur: 0.08, vol: 0.08 },
    { wave: 'sine', f0: 520, f1: 900, dur: 0.08, vol: 0.08, delay: 0.08 },
    { wave: 'triangle', f0: 1046, f1: 1318, dur: 0.18, vol: 0.07, delay: 0.17 },
  ],
  // Monster-Verwandlung: Brodeln, tiefes Gebruell
  'monster': [
    { wave: 'noise', f0: 900, f1: 200, dur: 0.4, vol: 0.1 },
    { wave: 'sawtooth', f0: 110, f1: 55, dur: 0.6, vol: 0.14, lp: 500, delay: 0.15, vibHz: 14, vibSemi: 0.5 },
  ],
  'shrink': [
    { wave: 'sine', f0: 900, f1: 220, dur: 0.22, vol: 0.09 },
    { wave: 'triangle', f0: 1760, f1: 1760, dur: 0.05, vol: 0.06, delay: 0.22 },
  ],
  'bounty': [
    { wave: 'triangle', f0: 1760, f1: 1760, dur: 0.06, vol: 0.08 },
    { wave: 'triangle', f0: 2349, f1: 2349, dur: 0.1, vol: 0.08, delay: 0.07 },
  ],
  'heal': [
    { wave: 'sine', f0: 660, f1: 660, dur: 0.1, vol: 0.09 },
    { wave: 'sine', f0: 990, f1: 990, dur: 0.18, vol: 0.09, delay: 0.1 },
  ],
  'gate': [
    { wave: 'square', f0: 180, f1: 90, dur: 0.14, vol: 0.12, lp: 900 },
    { wave: 'triangle', f0: 880, f1: 1320, dur: 0.18, vol: 0.08, delay: 0.1 },
  ],
};
