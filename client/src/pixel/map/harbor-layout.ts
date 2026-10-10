/**
 * Gloomharbor (Runde 16 / K2, Karte 9, Expert): Lage der Dinge. EINE Quelle fuer Zeichnung UND Sim-Daten
 * (`sim/data/maps/harbor.json` schreibt `scripts/gen-maps.ts`). Zwei Eingaenge (Westtor, Nordstrasse) laufen am Kai zusammen,
 * ~950 px je Ast. Das Hafenbecken im Sueden ist Wasser; Haeuser, Stadtmauer, Stege und Schiffe sind unbebaubar, Land ist knapp.
 */
import { closedSpline, pathLength, simplify, type Pt } from './kit';
import { fitLength } from './k2kit';

export const HB_HW = 13;
export const HB_BUILD: [number, number, number, number] = [8, 8, 624, 344];
export const HB_TARGET = 950;

// Schweif ab der Kai-Ecke (470,188): am Ostufer entlang zum Ausgang (Lagerhaus-Tor) unten rechts.
const TAIL: Pt[] = [[470, 188], [520, 188], [520, 318], [656, 318]];

export const HB_BRANCHES: Pt[][] = [
  // A: Westtor, durch die Fischgasse und dann die Kaistrasse entlang (Start y so gewaehlt, dass der Ast genau HB_TARGET lang ist)
  fitLength((v) => [[-16, v], [100, v], [100, 188], ...TAIL], HB_TARGET, 10, 80),
  // B: Nordstrasse, schlaengelt sich durch das Nordostviertel
  fitLength((v) => [[580, -16], [580, 50], [400, 50], [400, 100], [v, 100], [v, 150], [470, 150], [470, 188], ...TAIL.slice(1)], HB_TARGET, 480, 600),
];

// ---------- Wasser: das Hafenbecken ----------
const SEA_CTRL: Pt[] = [
  [-14, 262], [18, 246], [52, 232], [96, 222], [150, 218], [210, 223], [270, 216], [330, 221], [392, 217], [440, 222], [474, 236], [490, 262],
  [494, 300], [488, 336], [494, 376], [-14, 376],
];
export const SEA: Pt[] = closedSpline(SEA_CTRL, 5);
export const hbWater = (): Pt[][] => [simplify(SEA, 3)];
export const HB_LEN = HB_BRANCHES.map(pathLength);
