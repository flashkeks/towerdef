/**
 * Profil im Browser: laden (mit Reset alter Staende), speichern, Export (Download), Import (Dateiwahl).
 * Speicher: IndexedDB, Rueckfall localStorage, zuletzt Arbeitsspeicher (siehe storage.ts).
 */
import { exportProfile, importProfile, loadProfile, type Profile } from './index';
import { ProfileStorage, defaultTiers, MemoryTier, type Persistence, type StorageTier } from './storage';

export interface MetaStore {
  readonly profile: Profile;
  persistence(): Persistence;
  /** Ersetzt das Profil und speichert (Fehler werden verschluckt, Anzeige bleibt stimmig). */
  update(next: Profile): Promise<void>;
  exportJson(): string;
  /** Laedt Datei-Inhalt; bei Erfolg ersetzt das Profil den Stand. */
  importJson(text: string): Promise<{ ok: true } | { ok: false; message: string }>;
  /** Hinweis "rebuilt from scratch" einmalig quittieren. */
  ackResetNotice(): Promise<void>;
  /** Alles loeschen: frisches Profil. */
  wipe(): Promise<void>;
}

export async function openStore(opts: { memoryOnly?: boolean; now?: () => string; tiers?: StorageTier[] } = {}): Promise<MetaStore> {
  const now = opts.now ?? ((): string => new Date().toISOString());
  const storage = new ProfileStorage(opts.tiers ?? (opts.memoryOnly ? [new MemoryTier()] : defaultTiers()));
  const out = await storage.load();
  let profile: Profile;
  if (out.kind === 'ok') {
    const l = loadProfile(out.profile, now());
    profile = l.profile;
    if (l.reset) await storage.backup(JSON.stringify(out.profile)).catch(() => undefined);
  } else if (out.kind === 'corrupt') {
    await storage.backup().catch(() => undefined);
    profile = { ...loadProfile(null, now()).profile, showResetNotice: true };
  } else {
    profile = loadProfile(null, now()).profile;
  }
  let persisted: Persistence = storage.expectedPersistence();
  const save = async (): Promise<void> => {
    try {
      persisted = await storage.save(profile);
    } catch {
      persisted = 'memory';
    }
  };
  // Reset sofort festschreiben, sonst verschwindet der alte Stand erst beim naechsten Speichern
  if (out.kind !== 'empty') await save();
  return {
    get profile() {
      return profile;
    },
    persistence: () => persisted,
    async update(next) {
      profile = next;
      await save();
    },
    exportJson: () => exportProfile(profile, now()),
    async importJson(text) {
      const r = importProfile(text);
      if (!r.ok) return { ok: false, message: r.message };
      profile = r.profile;
      await save();
      return { ok: true };
    },
    async ackResetNotice() {
      profile = { ...profile, showResetNotice: false };
      await save();
    },
    async wipe() {
      profile = loadProfile(null, now()).profile;
      await save();
    },
  };
}

/** Download einer Textdatei (Export). */
export function downloadText(name: string, text: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Dateiwahl, liefert den Text oder null bei Abbruch. */
export function pickTextFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = '.json,application/json';
    i.onchange = () => {
      const f = i.files?.[0];
      if (!f) return resolve(null);
      f.text().then(resolve, () => resolve(null));
    };
    i.oncancel = () => resolve(null);
    i.click();
  });
}
