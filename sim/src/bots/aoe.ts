import type { Bot } from './types.js';
import { policyBot } from './util.js';

const AOE = new Set(['blaster', 'lancer', 'frost']);

/**
 * AoE-Kern (Blaster, Lancer, Frost) plus zwei Einzelziel-Units: Gunner (einzige billige Luft-Antwort) und Titan (Boss).
 * Runde 4 / P1: vorher Einzelziel pauschal 0,6 und damit nie Titan (0 % Käufe, 0 % Siegquote auf Normal, Boss-Leak Wave 10);
 * jetzt ist die Einzelziel-Hälfte bewusst gewählt, Striker ausgeschlossen (Gewicht 0: als billigste Unit würde er das Team mit nur 6 Typ-Plätzen und die Anfangsmünzen füllen), Banner Beiwerk.
 */
export const aoe = (): Bot =>
  policyBot('aoe', {
    plan: { unit: 'titan', fromWave: 5 },
    weight: (d) => {
      if (AOE.has(d.id)) return 2.2;
      if (d.id === 'titan') return 1.8;
      if (d.id === 'gunner') return 1.2;
      return d.id === 'banner' ? 0.8 : 0;
    },
  });
