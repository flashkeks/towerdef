/** Zufall und IDs fuer das LocalBackend: `crypto.getRandomValues`, nie `Math.random`, nie die Sim-PRNG. Besitzer: P1. */

interface CryptoLike {
  getRandomValues<T extends ArrayBufferView>(a: T): T;
  randomUUID?: () => string;
}

const defaultCrypto = (): CryptoLike => {
  const c = (globalThis as { crypto?: CryptoLike }).crypto;
  if (!c || typeof c.getRandomValues !== 'function') throw new Error('crypto.getRandomValues is not available');
  return c;
};

/** Gleichverteilte Ganzzahl in [0, n) ohne Modulo-Verzerrung (Rejection Sampling). */
export function cryptoRandomInt(n: number, c: CryptoLike = defaultCrypto()): number {
  if (!Number.isInteger(n) || n < 1 || n > 0x100000000) throw new RangeError('randomInt: n must be an integer in 1..2^32');
  if (n === 1) return 0;
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  let x: number;
  do {
    c.getRandomValues(buf);
    x = buf[0]!;
  } while (x >= limit);
  return x % n;
}

/** UUID v4; faellt auf `getRandomValues` zurueck, wenn `randomUUID` fehlt (unsicherer Kontext). */
export function cryptoUuid(c: CryptoLike = defaultCrypto()): string {
  if (typeof c.randomUUID === 'function') return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
