/**
 * Seeded PRNG: sfc32 mit 32-Bit-Integer-Arithmetik.
 * Zustand = Array aus 4 uint32, direkt serialisierbar und Teil des Zustands-Hashes.
 */

export type RngState = number[];

/** splitmix32 zur Ableitung des Startzustands aus einem Seed. */
export function seedRng(seed: number): RngState {
  let s = seed >>> 0;
  const sm = (): number => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
    return (z ^ (z >>> 16)) >>> 0;
  };
  const st = [sm(), sm(), sm(), sm()];
  for (let i = 0; i < 12; i++) nextU32(st);
  return st;
}

/** Nächste 32-Bit-Zufallszahl (uint32); verändert den Zustand in place. */
export function nextU32(st: RngState): number {
  let a = st[0] | 0;
  let b = st[1] | 0;
  let c = st[2] | 0;
  let d = st[3] | 0;
  const t = (((a + b) | 0) + d) | 0;
  d = (d + 1) | 0;
  a = b ^ (b >>> 9);
  b = (c + (c << 3)) | 0;
  c = (c << 21) | (c >>> 11);
  c = (c + t) | 0;
  st[0] = a >>> 0;
  st[1] = b >>> 0;
  st[2] = c >>> 0;
  st[3] = d >>> 0;
  return t >>> 0;
}

/** Gleichverteilte Ganzzahl in [0, n). n <= 2^20 (Produkt bleibt exakt). */
export function nextInt(st: RngState, n: number): number {
  return Math.floor((nextU32(st) * n) / 4294967296);
}
