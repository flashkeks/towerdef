/**
 * Export/Import als JSON mit Pruefsumme. Die Summe schuetzt vor Kopierfehlern und abgeschnittenen Dateien,
 * nicht vor Manipulation (lokal ist der Stand ohnehin editierbar).
 * Format: { format: 'duskwardens-save', formatVersion: 11, exportedAt, checksum, profile }
 */
import { SAVE_SCHEMA, ProfileSchema, sanitize, type Profile } from './profile';
import type { Fail } from './progress';

export const SAVE_FORMAT = 'duskwardens-save';

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function canonicalJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(',')}]`;
  if (isRecord(v)) return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(v[k])}`).join(',')}}`;
  return JSON.stringify(v) ?? 'null';
}

/** FNV-1a 32 Bit, zweimal mit verschiedenem Start (64 Bit Hex). */
export function checksum(text: string): string {
  let a = 0x811c9dc5;
  let b = 0x01000193 ^ 0x9e3779b9;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b ^ c, 0x85ebca6b) >>> 0;
  }
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}

export function exportProfile(p: Profile, now: string): string {
  return JSON.stringify({ format: SAVE_FORMAT, formatVersion: SAVE_SCHEMA, exportedAt: now, checksum: checksum(canonicalJson(p)), profile: p }, null, 2);
}

/** Codes: `import-invalid-json`, `import-wrong-format`, `import-old-version`, `import-bad-checksum`, `import-invalid-profile`. */
export function importProfile(json: string): { ok: true; profile: Profile } | Fail {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, code: 'import-invalid-json', message: 'The file is not valid JSON.' };
  }
  if (!isRecord(raw) || raw.format !== SAVE_FORMAT) return { ok: false, code: 'import-wrong-format', message: 'This is not a Duskwardens save file.' };
  if (raw.formatVersion !== SAVE_SCHEMA) {
    return { ok: false, code: 'import-old-version', message: 'This save comes from a different version of the game and cannot be used.' };
  }
  if (typeof raw.checksum !== 'string' || checksum(canonicalJson(raw.profile)) !== raw.checksum) {
    return { ok: false, code: 'import-bad-checksum', message: 'The file is damaged (checksum does not match).' };
  }
  const p = ProfileSchema.safeParse(raw.profile);
  if (!p.success) return { ok: false, code: 'import-invalid-profile', message: 'The save file content is invalid.' };
  return { ok: true, profile: sanitize({ ...p.data, showResetNotice: false }) };
}
