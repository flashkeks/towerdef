/**
 * Export/Import des Speicherstands als JSON mit Pruefsumme. Die Summe schuetzt nur vor versehentlicher Beschaedigung
 * (Kopierfehler, abgeschnittene Datei), **nicht** vor Manipulation: lokal ist der Stand ohnehin editierbar.
 *
 * Format: { format: 'duskwardens-save', formatVersion: 1, exportedAt, checksum, profile }
 * `checksum` = FNV-1a 64 ueber das kanonische JSON von `profile`.
 */
import { migrate } from './migrate';
import type { MetaEnv } from './env';
import type { Profile } from './profile';
import { fail, type Fail } from './result';
import { canonicalJson, checksum, isRecord } from './util';

export const SAVE_FORMAT = 'duskwardens-save';
export const SAVE_FORMAT_VERSION = 1;

export interface SaveFile {
  format: typeof SAVE_FORMAT;
  formatVersion: number;
  exportedAt: string;
  checksum: string;
  profile: Profile;
}

export function exportProfile(p: Profile, env: Pick<MetaEnv, 'now'>): string {
  const file: SaveFile = {
    format: SAVE_FORMAT,
    formatVersion: SAVE_FORMAT_VERSION,
    exportedAt: env.now(),
    checksum: checksum(canonicalJson(p)),
    profile: p,
  };
  return JSON.stringify(file, null, 2);
}

/** Codes: `import-invalid-json`, `import-wrong-format`, `import-bad-checksum`, dazu die Fehler von `migrate` (`profile-corrupt`, `profile-too-new`). */
export function importProfile(json: string): { ok: true; profile: Profile; migratedFrom: number } | Fail {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return fail('import-invalid-json', 'The file is not valid JSON.');
  }
  if (!isRecord(raw) || raw.format !== SAVE_FORMAT) return fail('import-wrong-format', 'This is not a Duskwardens save file.');
  if (typeof raw.formatVersion !== 'number' || raw.formatVersion > SAVE_FORMAT_VERSION) return fail('import-wrong-format', 'This save file format is newer than this build.');
  if (typeof raw.checksum !== 'string' || checksum(canonicalJson(raw.profile)) !== raw.checksum) {
    return fail('import-bad-checksum', 'The file is damaged (checksum does not match).');
  }
  return migrate(raw.profile);
}
