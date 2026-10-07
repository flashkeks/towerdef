/**
 * Injizierte Umgebung: Zufall, Uhr, IDs. Meta ruft nie `Math.random`, `Date.now` oder `crypto` selbst auf.
 * Der Client reicht `crypto.getRandomValues` hinein, der Server `crypto.randomInt`, Tests einen Seed.
 */
export interface MetaEnv {
  /** Gleichverteilte Ganzzahl in [0, n). `n` >= 1. Muss kryptografisch sein, wenn es um Gacha geht. */
  randomInt(n: number): number;
  /** ISO-8601-UTC-Zeitstempel. */
  now(): string;
  /** Neue eindeutige ID (UUID oder aehnlich). */
  newId(): string;
}

/** `randomInt` aus einer Quelle fuer Gleitkommazahlen in [0,1) (nur fuer Tests, nicht fuer Gacha im Betrieb). */
export const randomIntFrom = (rng: () => number) => (n: number): number => Math.min(n - 1, Math.floor(rng() * n));

/** Kleiner deterministischer Generator (mulberry32) fuer Tests und Simulationen. */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministische Umgebung fuer Tests: Zufall nach Seed, Uhr tickt je Aufruf eine Sekunde, IDs zaehlen hoch. */
export function testEnv(seed = 1, startIso = '2026-10-07T12:00:00.000Z'): MetaEnv {
  const rng = seededRng(seed);
  let ms = Date.parse(startIso);
  let n = 0;
  return {
    randomInt: randomIntFrom(rng),
    now: () => new Date((ms += 1000)).toISOString(),
    newId: () => `id-${String(++n).padStart(4, '0')}`,
  };
}
