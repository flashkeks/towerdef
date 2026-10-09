/**
 * Festkomma-Konventionen des Simulationskerns (siehe sim/README.md).
 *
 *  - Tick: 60 Ticks/s.
 *  - Positionen/Distanzen: Milli-px (1 px = 1000) auf der 640 x 360-Karte.
 *  - HP/Schaden: ganze Zahlen (1 = eine Glim-Schicht).
 *  - Multiplikatoren: Basispunkte (10000 = x1,0).
 *  - Zeiten: Ticks (Angriffsintervalle in Milli-Ticks). Geld: ganze Münzen.
 *
 * Alle Zwischenwerte bleiben unter 2^53; Division wird stets mit Math.floor
 * bzw. Math.trunc nach der Multiplikation ausgeführt (Produkte < 2^53 sind exakt).
 */

export const TICKS_PER_SECOND = 60;
/** 1 px = 1000 Milli-px. */
export const PX = 1000;
export const BP = 10000;

/** a * bp / 10000, abgerundet. Nur für nichtnegative a. */
export function mulBp(a: number, bp: number): number {
  return Math.floor((a * bp) / BP);
}

/** Ganzzahl-Division, abgerundet (nur für nichtnegative Werte). */
export function divFloor(a: number, b: number): number {
  return Math.floor(a / b);
}

/** Kaufmännische Rundung a/b (nichtnegativ). */
export function divRound(a: number, b: number): number {
  return Math.floor((2 * a + b) / (2 * b));
}

/** Ganzzahlige Wurzel (abgerundet), ohne Float-Abhängigkeit im Ergebnis. */
export function isqrt(n: number): number {
  if (n <= 0) return 0;
  let x = Math.floor(Math.sqrt(n));
  while (x * x > n) x--;
  while ((x + 1) * (x + 1) <= n) x++;
  return x;
}

/** Quadrat des euklidischen Abstands (Milli-px^2). */
export function dist2(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
