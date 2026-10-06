/**
 * Zustands-Hash: stabile Serialisierung (sortierte Keys) + FNV-1a 64 Bit
 * (selbst implementiert mit 32-Bit-Hälften, kein BigInt im Hot-Path).
 * Nicht-ganzzahlige Zahlen im Zustand sind ein Fehler (Festkomma-Garantie).
 */

export function stableStringify(v: unknown): string {
  if (v === null) return 'null';
  switch (typeof v) {
    case 'number':
      if (!Number.isSafeInteger(v)) throw new Error(`Nicht-ganzzahliger Wert im Zustand: ${v}`);
      return String(v);
    case 'boolean':
      return v ? 'true' : 'false';
    case 'string':
      return JSON.stringify(v);
    case 'object': {
      if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
      const o = v as Record<string, unknown>;
      const keys = Object.keys(o).sort();
      const parts: string[] = [];
      for (const k of keys) {
        if (o[k] === undefined) continue;
        parts.push(JSON.stringify(k) + ':' + stableStringify(o[k]));
      }
      return '{' + parts.join(',') + '}';
    }
    default:
      throw new Error(`Nicht serialisierbarer Typ im Zustand: ${typeof v}`);
  }
}

/** FNV-1a 64 Bit über UTF-16-Code-Units (je 2 Bytes bei >255), Hex-Ausgabe (16 Zeichen). */
export function fnv1a64(str: string): string {
  // Offset basis 0xcbf29ce484222325, Prime 0x100000001b3
  let hi = 0xcbf29ce4;
  let lo = 0x84222325;
  const mix = (byte: number): void => {
    lo = (lo ^ byte) >>> 0;
    const t = lo * 0x1b3; // < 2^41, exakt
    const newLo = t % 4294967296;
    const carry = Math.floor(t / 4294967296);
    const newHi = (hi * 0x1b3 + carry + (lo << 8 >>> 0)) % 4294967296;
    lo = newLo;
    hi = newHi;
  };
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c > 255) {
      mix(c >>> 8);
      mix(c & 255);
    } else mix(c);
  }
  return hi.toString(16).padStart(8, '0') + lo.toString(16).padStart(8, '0');
}

export function hashState(state: unknown): string {
  return fnv1a64(stableStringify(state));
}
