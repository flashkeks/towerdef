/**
 * Speicherstand im Browser. Besitzer: P1.
 *
 * Stufen (alle in try/catch, jede darf ausfallen): IndexedDB (eine DB `dw-meta`, ein Store `kv`, ein Schluessel `profile`),
 * `localStorage` (zwei Plaetze `a`/`b`), Speicher (nur diese Sitzung). Gespeichert wird in ALLE verfuegbaren Stufen;
 * gelesen wird der Eintrag mit der hoechsten Revision `rev`, so verdeckt eine veraltete Stufe nie eine neuere.
 *
 * Absturzsicher: IndexedDB schreibt in einer Transaktion (alles oder nichts). `localStorage` schreibt immer auf den AELTEREN der beiden
 * Plaetze; stirbt die Seite mitten im Schreiben, ist hoechstens dieser Platz kaputt (nicht lesbar -> ignoriert), der neuere bleibt heil.
 */

export type Persistence = 'indexeddb' | 'localstorage' | 'memory';

const APP = 'dw-meta';

/** Eine Speicherstufe. `read` liefert alle Rohtexte, die sie hat; `write` schreibt (wirft bei Fehler). */
export interface StorageTier {
  readonly name: Persistence;
  read(): Promise<string[]>;
  write(rev: number, text: string): Promise<void>;
  /** optional: Sicherungskopie abgelegt (ersetzter oder kaputter Stand), nie lesend verwendet */
  backup?(text: string): Promise<void>;
}

export const makeEnvelope = (rev: number, profile: unknown): string => JSON.stringify({ app: APP, rev, profile });

/** Revision eines Rohtextes oder -1, wenn er kein heiler Umschlag ist. */
function parseEnvelope(text: string): { rev: number; profile: unknown } | null {
  try {
    const o = JSON.parse(text) as { app?: unknown; rev?: unknown; profile?: unknown };
    if (!o || typeof o !== 'object' || o.app !== APP || typeof o.rev !== 'number' || !Number.isInteger(o.rev) || o.rev < 0 || !('profile' in o)) return null;
    return { rev: o.rev, profile: o.profile };
  } catch {
    return null;
  }
}

export type LoadOutcome =
  | { kind: 'empty' }
  /** `profile` ist ungeprueft (-> `migrate`) */
  | { kind: 'ok'; profile: unknown; rev: number }
  /** es gibt Daten, aber keine heile Stufe; `raws` zur Sicherung */
  | { kind: 'corrupt'; raws: string[] };

export class ProfileStorage {
  private rev = 0;
  private lastRaws: string[] = [];

  constructor(private readonly tiers: StorageTier[]) {}

  /** Beste Stufe, in die das naechste Speichern voraussichtlich geht (vor dem ersten Speichern nur eine Vermutung). */
  expectedPersistence(): Persistence {
    return this.tiers.find((t) => t.name !== 'memory')?.name ?? 'memory';
  }

  async load(): Promise<LoadOutcome> {
    const raws: string[] = [];
    for (const t of this.tiers) {
      try {
        raws.push(...(await t.read()));
      } catch {
        /* Stufe nicht lesbar -> naechste */
      }
    }
    this.lastRaws = raws;
    let best: { rev: number; profile: unknown } | null = null;
    for (const r of raws) {
      const e = parseEnvelope(r);
      if (e && (!best || e.rev > best.rev)) best = e;
    }
    if (best) {
      this.rev = best.rev;
      return { kind: 'ok', profile: best.profile, rev: best.rev };
    }
    return raws.length ? { kind: 'corrupt', raws } : { kind: 'empty' };
  }

  /** Schreibt in alle Stufen. Gibt die beste Stufe zurueck, in die es ging; wirft nur, wenn gar keine schrieb. */
  async save(profile: unknown): Promise<Persistence> {
    const rev = this.rev + 1;
    const text = makeEnvelope(rev, profile);
    const ok: Persistence[] = [];
    await Promise.all(
      this.tiers.map(async (t) => {
        try {
          await t.write(rev, text);
          ok.push(t.name);
        } catch {
          /* diese Stufe faellt aus */
        }
      }),
    );
    if (!ok.length) throw new Error('no storage tier accepted the write');
    this.rev = rev;
    return (['indexeddb', 'localstorage', 'memory'] as const).find((n) => ok.includes(n)) ?? 'memory';
  }

  /** Letzte gelesene Rohdaten (fuer die Sicherung vor einem Reset) plus optional ein weiterer Text. */
  async backup(extra?: string): Promise<void> {
    const texts = [...this.lastRaws, ...(extra ? [extra] : [])];
    if (!texts.length) return;
    const joined = JSON.stringify(texts);
    for (const t of this.tiers) {
      try {
        await t.backup?.(joined);
      } catch {
        /* Sicherung ist best effort */
      }
    }
  }
}

// ---------------------------------------------------------------- Stufen

export class MemoryTier implements StorageTier {
  readonly name = 'memory' as const;
  private text: string | null = null;
  async read(): Promise<string[]> {
    return this.text === null ? [] : [this.text];
  }
  async write(_rev: number, text: string): Promise<void> {
    this.text = text;
  }
}

/** Minimal-Schnittstelle von `Storage`, damit Tests eine Attrappe geben koennen. */
export interface KeyValueStore {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem?(k: string): void;
}

export class LocalStorageTier implements StorageTier {
  readonly name = 'localstorage' as const;
  constructor(
    private readonly ls: KeyValueStore,
    private readonly prefix = 'dw.meta.profile',
  ) {}
  private slots = (): [string, string] => [`${this.prefix}.a`, `${this.prefix}.b`];
  async read(): Promise<string[]> {
    return this.slots()
      .map((k) => this.ls.getItem(k))
      .filter((x): x is string => typeof x === 'string' && x.length > 0);
  }
  async write(_rev: number, text: string): Promise<void> {
    const [a, b] = this.slots();
    const rev = (k: string): number => {
      const v = this.ls.getItem(k);
      return v ? (parseEnvelope(v)?.rev ?? -1) : -1;
    };
    // immer den aelteren (oder kaputten/leeren) Platz ueberschreiben
    const target = rev(a) <= rev(b) ? a : b;
    this.ls.setItem(target, text);
  }
  async backup(text: string): Promise<void> {
    this.ls.setItem(`${this.prefix}.backup`, text);
  }
}

const withTimeout = <T>(p: Promise<T>, ms: number, what: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`${what} timed out`)), ms);
    p.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      },
    );
  });

export class IndexedDbTier implements StorageTier {
  readonly name = 'indexeddb' as const;
  private db: Promise<IDBDatabase> | null = null;
  constructor(
    private readonly factory: IDBFactory,
    private readonly dbName = 'dw-meta',
    private readonly timeoutMs = 4000,
  ) {}

  private open(): Promise<IDBDatabase> {
    if (!this.db) {
      this.db = withTimeout(
        new Promise<IDBDatabase>((resolve, reject) => {
          const req = this.factory.open(this.dbName, 1);
          req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains('kv')) req.result.createObjectStore('kv');
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'));
          req.onblocked = () => reject(new Error('indexedDB open blocked'));
        }),
        this.timeoutMs,
        'indexedDB open',
      );
    }
    return this.db;
  }

  async read(): Promise<string[]> {
    const db = await this.open();
    const v = await withTimeout(
      new Promise<unknown>((resolve, reject) => {
        const req = db.transaction('kv', 'readonly').objectStore('kv').get('profile');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error('indexedDB read failed'));
      }),
      this.timeoutMs,
      'indexedDB read',
    );
    return typeof v === 'string' ? [v] : [];
  }

  async write(_rev: number, text: string): Promise<void> {
    const db = await this.open();
    await withTimeout(
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').put(text, 'profile');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('indexedDB write failed'));
        tx.onabort = () => reject(tx.error ?? new Error('indexedDB write aborted'));
      }),
      this.timeoutMs,
      'indexedDB write',
    );
  }

  async backup(text: string): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(text, 'profile.backup');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('indexedDB backup failed'));
    });
  }
}

/** Stufen aus der Umgebung: IndexedDB, `localStorage` (nur wenn der Zugriff nicht wirft), immer Speicher als letzte. */
export function defaultTiers(g: { indexedDB?: IDBFactory; localStorage?: KeyValueStore } = globalThis as never): StorageTier[] {
  const tiers: StorageTier[] = [];
  try {
    if (g.indexedDB) tiers.push(new IndexedDbTier(g.indexedDB));
  } catch {
    /* kein IndexedDB */
  }
  try {
    const ls = g.localStorage; // der Zugriff selbst kann werfen (Cookies gesperrt)
    if (ls) tiers.push(new LocalStorageTier(ls));
  } catch {
    /* kein localStorage */
  }
  tiers.push(new MemoryTier());
  return tiers;
}

export const defaultStorage = (): ProfileStorage => new ProfileStorage(defaultTiers());
