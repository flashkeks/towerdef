/** Kleine reine Helfer: tiefe Kopie, kanonisches JSON, Pruefsumme. */

/** Tiefe Kopie fuer reine JSON-Daten (Profile enthalten nichts anderes). */
export const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/** JSON mit rekursiv sortierten Schluesseln, damit gleiche Daten immer gleiche Zeichenkette ergeben. */
export function canonicalJson(x: unknown): string {
  if (x === null || typeof x !== 'object') return JSON.stringify(x) ?? 'null';
  if (Array.isArray(x)) return `[${x.map((v) => (v === undefined ? 'null' : canonicalJson(v))).join(',')}]`;
  const o = x as Record<string, unknown>;
  const keys = Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`).join(',')}}`;
}

const FNV_OFFSET = 0xcbf29ce484222325n;
const FNV_PRIME = 0x100000001b3n;
const MASK64 = 0xffffffffffffffffn;

/**
 * FNV-1a (64 Bit) ueber die UTF-16-Codeeinheiten. Nur gegen versehentliche Beschaedigung, **kein** Schutz gegen Manipulation.
 * Ausgabe: `fnv1a64:` + 16 Hex-Zeichen.
 */
export function checksum(text: string): string {
  let h = FNV_OFFSET;
  for (let i = 0; i < text.length; i++) {
    h ^= BigInt(text.charCodeAt(i));
    h = (h * FNV_PRIME) & MASK64;
  }
  return `fnv1a64:${h.toString(16).padStart(16, '0')}`;
}

export const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
