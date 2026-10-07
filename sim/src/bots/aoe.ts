import type { Bot } from './types.js';
import { policyBot, roleOf } from './util.js';

/**
 * AoE-Kern (Flächen-Units: Kreis, Linie, Kegel, Kette) plus zwei Einzelziel-Units: die billige Luft-Antwort (Gunner) und den Boss-Killer (Titan).
 * Runde 4 / P1: vorher Einzelziel pauschal 0,6 und damit nie Titan (0 % Käufe, 0 % Siegquote auf Normal, Boss-Leak Wave 10);
 * jetzt ist die Einzelziel-Hälfte bewusst gewählt, Striker ausgeschlossen (Gewicht 0: als billigste Unit würde er das Team mit nur 6 Typ-Plätzen und die Anfangsmünzen füllen), Banner Beiwerk.
 * Runde 7 / P6: Rollen aus den Daten (`roleOf`) statt Unit-IDs, damit die neuen Units (Mortar, Stormcaller, Weaver) mitspielen.
 */
export const aoe = (): Bot =>
  policyBot('aoe', {
    plan: { unit: 'titan', fromWave: 5 },
    weight: (d) => {
      switch (roleOf(d)) {
        case 'aoe':
        case 'control':
          return 2.2;
        case 'titan':
          return 1.8;
        case 'air':
          return 1.2;
        case 'aura':
          return 0.8;
        default:
          return 0;
      }
    },
  });
