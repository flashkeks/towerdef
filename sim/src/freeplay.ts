/**
 * Runde 15b: Runden ab R121 (Formel). Die Runden 1-120 stehen fest in `data/rounds.json` (Quelle: scripts/gen-rounds.mjs).
 * Max, 10.10.2026: "reine Formel ab Runde 120 ... fast unmoeglich, extremst schwer, soll lange dauern".
 *
 * Aufbau: Runde `r` > 120 nimmt die Gruppen einer festen Runde 101-119 (zyklisch, Seed verschiebt den Start), skaliert die Anzahl
 * (+3,5 % je Runde, hoechstens x6, Abstand schrumpft mit), setzt Fortified auf alle schweren Typen und wuerfelt (Seed) Tarnung/Regrow
 * auf einzelne Gruppen. Jede 10. Runde ist das Finale (Gruppen von R120). Huelle (ab 10 HP) und Tempo steigen je Runde
 * (`fpHpBp`, `fpSpeedBp`), die Sim wendet das ueber `EnemyState.round` an (Kinder erben die Runde).
 * Deterministisch: gleiche (Runde, Seed) -> gleiche Gruppen.
 */
import { DATA, type RoundData } from './data.js';
import { nextInt, seedRng } from './prng.js';

/** Laenge der festen Rundenliste. */
export const LIST_ROUNDS = 120;

/**
 * Pop-Gold-Faktor (Basispunkte) nach der Runde des Gegners: bis R20 voll (x1), danach fallend auf x0,4 (R40), x0,2 (R80), x0,12 (ab R120).
 * Grund: eine Liste fuer 80-120 Runden; die alte 20-Runden-Kurve (2 Gold je Schicht) trug schon den Fortschritt von BTD6-R1-40.
 */
export const popBp = (r: number): number => {
  if (r <= 20) return 10000;
  if (r <= 40) return 10000 - 300 * (r - 20);
  if (r <= 80) return 4000 - 50 * (r - 40);
  if (r <= 120) return 2000 - 20 * (r - 80);
  return 1200;
};
/** Rundenbonus (Gold) nach Abschluss der Runde `r`: 100 + r bis R20, danach +5 je Runde mehr (R40 220, R60 320, R80 420 ...). */
export const roundBonus = (r: number): number => 100 + r + (r > 20 ? 5 * (r - 20) : 0);

/** Huelle-Faktor in Basispunkten ab R121: 1 + 4 % x d + 0,1 % x d^2 (d = Runde - 120): R130 x1,5, R150 x3,0, R200 x10. */
export const fpHpBp = (r: number): number => {
  const d = Math.max(0, r - LIST_ROUNDS);
  return 10000 + 400 * d + 10 * d * d;
};
/** Tempo-Faktor in Basispunkten ab R121: +0,8 % je Runde, hoechstens x2. */
export const fpSpeedBp = (r: number): number => Math.min(20000, 10000 + 80 * Math.max(0, r - LIST_ROUNDS));
/** Anzahl-Faktor in Basispunkten ab R121: +3,5 % je Runde, hoechstens x6. */
export const fpCountBp = (r: number): number => Math.min(60000, 10000 + 350 * Math.max(0, r - LIST_ROUNDS));

const HEAVY = new Set(['ironshell', 'brute', 'crystal', 'gloomship', 'cruiser', 'dreadnought', 'leviathan', 'wyrm', 'colossus']);

/** Gruppen der Freeplay-Runde `r` (> 120). */
export function freeplayGroups(r: number, seed = 0): RoundData['groups'] {
  const rng = seedRng(Math.imul(seed | 0, 7919) ^ Math.imul(r, 104729));
  const d = r - LIST_ROUNDS;
  const finale = r % 10 === 0;
  const base = finale ? LIST_ROUNDS : 101 + ((d - 1 + (Math.imul(seed | 0, 31) >>> 0) % 19) % 19);
  const cnt = fpCountBp(r);
  return DATA.rounds[base - 1].groups.map((g) => {
    const big = g.type === 'dreadnought';
    const n = big ? g.n + Math.floor(d / 10) : Math.max(1, Math.ceil((g.n * cnt) / 10000));
    const out: RoundData['groups'][number] = {
      type: g.type, n, gapMs: big ? g.gapMs : Math.max(40, Math.floor((g.gapMs * 10000) / cnt)), startMs: g.startMs,
    };
    if (g.camo || nextInt(rng, 4) === 0) out.camo = true;
    if (g.regrow || (['gold', 'pink'].includes(g.type) && nextInt(rng, 2) === 0)) out.regrow = true;
    if (g.fortified || HEAVY.has(g.type)) out.fortified = true;
    return out;
  });
}
