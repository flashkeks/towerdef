/**
 * LocalBackend: Profil im Browser, Logik aus `meta/`. Besitzer: P1.
 *
 * - Aufrufe laufen nacheinander (Warteschlange), damit sich zwei schnelle Klicks nicht ueberholen.
 * - Jede Mutation: Idempotenz pruefen -> reine Meta-Funktion -> speichern -> erst dann das neue Profil uebernehmen.
 * - Zufall `crypto.getRandomValues`, Uhr und IDs injiziert (Tests geben eigene).
 * - Ist der gespeicherte Stand kaputt oder zu neu, bleibt er unangetastet; jede Methode antwortet mit dem Ladefehler,
 *   bis `resetProfile()` oder `importSave()` ausdruecklich aufgerufen wird.
 */
import type { ReplayFile } from '../game/recorder';
import type { Backend, BFail, BResult, Saved } from './backend';
import {
  MockPaymentProvider,
  SAVE_FORMAT,
  SHOP_CATALOG,
  bannerView,
  buy,
  claimStarterGift,
  collectionView,
  evolve,
  exportProfile,
  importProfile,
  levelUp,
  listBanners,
  migrate,
  newProfile,
  playerView,
  pull,
  pullHistoryView,
  refreshOrder,
  rerollTrait,
  rewardFromReplay,
  setTeam,
  stageView,
  worldView,
  unitModsFor,
  isDifficultyUnlocked,
  isStageUnlocked,
  withIdempotency,
  withIdempotencyAsync,
  type MetaEnv,
  type Op,
  type PaymentProvider,
  type Profile,
} from './meta';
import { loadBrowserData, type DifficultyId } from '../sim';
import { cryptoRandomInt, cryptoUuid } from './random';
import { defaultStorage, type Persistence, type ProfileStorage } from './storage';

export const cryptoEnv = (): MetaEnv => ({ randomInt: (n) => cryptoRandomInt(n), now: () => new Date().toISOString(), newId: () => cryptoUuid() });

export interface LocalBackendOptions {
  storage?: ProfileStorage;
  env?: MetaEnv;
  provider?: PaymentProvider;
}

const fail = (code: string, message: string): BFail => ({ ok: false, code, message });

export class LocalBackend implements Backend {
  private readonly storage: ProfileStorage;
  private readonly env: MetaEnv;
  private readonly provider: PaymentProvider;
  private profile: Profile | null = null;
  private persistence: Persistence = 'memory';
  private loadError: BFail | null = null;
  private chain: Promise<unknown> = Promise.resolve();

  constructor(opts: LocalBackendOptions = {}) {
    this.storage = opts.storage ?? defaultStorage();
    this.env = opts.env ?? cryptoEnv();
    this.provider = opts.provider ?? new MockPaymentProvider(this.env);
  }

  /** Aufrufe nacheinander ausfuehren; Exceptions werden zu `internal-error`. */
  private serial<T extends { ok: boolean }>(fn: () => Promise<T | BFail>): Promise<T | BFail> {
    const run = async (): Promise<T | BFail> => {
      try {
        return await fn();
      } catch (e) {
        return fail('internal-error', `Something went wrong (${e instanceof Error ? e.message : 'unknown'}).`);
      }
    };
    const next = this.chain.then(run, run);
    this.chain = next;
    return next;
  }

  /** Profil im Speicher haben oder aus dem Speicher holen. Setzt `loadError` bei kaputten Daten. */
  private async ensure(): Promise<{ profile: Profile; created: boolean } | BFail> {
    if (this.profile) return { profile: this.profile, created: false };
    const out = await this.storage.load();
    if (out.kind === 'empty') {
      const p = newProfile(this.env);
      this.persistence = await this.storage.save(p);
      this.profile = p;
      this.loadError = null;
      return { profile: p, created: true };
    }
    if (out.kind === 'corrupt') {
      this.loadError = fail('profile-corrupt', 'Your saved progress could not be read.');
      return this.loadError;
    }
    const m = migrate(out.profile);
    if (!m.ok) {
      this.loadError = fail(m.code, m.message);
      return this.loadError;
    }
    this.profile = m.profile;
    this.loadError = null;
    if (m.migratedFrom !== m.profile.schemaVersion) this.persistence = await this.storage.save(m.profile);
    else this.persistence = this.storage.expectedPersistence();
    return { profile: m.profile, created: false };
  }

  private async commit(next: Profile): Promise<Persistence | BFail> {
    try {
      const persistence = await this.storage.save(next);
      this.profile = next;
      this.persistence = persistence;
      return persistence;
    } catch {
      return fail('save-failed', 'Your progress could not be saved.');
    }
  }

  /** Gemeinsamer Ablauf aller Mutationen. */
  private mutate<T, K extends string>(route: string, request: unknown, idemKey: string, key: K, fn: (p: Profile) => Op<T> | Promise<Op<T>>): Promise<BResult<Saved & Record<K, T>>> {
    return this.serial<{ ok: true } & Saved & Record<K, T>>(async () => {
      const cur = await this.ensure();
      if ('ok' in cur) return cur;
      const r = await withIdempotencyAsync<T>(cur.profile, { key: idemKey, route, request }, this.env, async (p) => fn(p));
      if (!r.ok) return fail(r.code, r.message);
      if (r.replayed) return { ok: true, profile: r.profile, persistence: this.persistence, replayed: true, [key]: r.result } as { ok: true } & Saved & Record<K, T>;
      const saved = await this.commit(r.profile);
      if (typeof saved !== 'string') return saved;
      return { ok: true, profile: r.profile, persistence: saved, replayed: false, [key]: r.result } as { ok: true } & Saved & Record<K, T>;
    }) as Promise<BResult<Saved & Record<K, T>>>;
  }

  loadProfile(): ReturnType<Backend['loadProfile']> {
    return this.serial(async () => {
      const cur = await this.ensure();
      if ('ok' in cur) return cur;
      return { ok: true as const, profile: cur.profile, created: cur.created, persistence: this.persistence };
    });
  }

  resetProfile(): ReturnType<Backend['resetProfile']> {
    return this.serial(async () => {
      try {
        await this.storage.backup(this.profile ? JSON.stringify(this.profile) : undefined);
      } catch {
        /* Sicherung ist best effort */
      }
      const p = newProfile(this.env);
      const saved = await this.commit(p);
      if (typeof saved !== 'string') return saved;
      this.loadError = null;
      return { ok: true as const, profile: p, persistence: saved };
    });
  }

  claimStarterGift(idemKey: string): ReturnType<Backend['claimStarterGift']> {
    return this.mutate('claimStarterGift', {}, idemKey, 'gift', (p) => claimStarterGift(p, this.env));
  }

  async listBanners(): ReturnType<Backend['listBanners']> {
    return { ok: true, banners: listBanners() };
  }

  bannerViews(): ReturnType<Backend['bannerViews']> {
    return this.serial(async () => {
      const cur = await this.ensure();
      if ('ok' in cur) return cur;
      return { ok: true as const, views: listBanners().map((b) => bannerView(b, cur.profile)) };
    });
  }

  pull(bannerId: string, count: 1 | 10, idemKey: string): ReturnType<Backend['pull']> {
    return this.mutate('pull', { bannerId, count }, idemKey, 'pull', (p) => pull(p, bannerId, count, this.env));
  }

  levelUp(unitId: string, idemKey: string): ReturnType<Backend['levelUp']> {
    return this.mutate('levelUp', { unitId }, idemKey, 'level', (p) => levelUp(p, unitId, this.env));
  }

  evolve(unitId: string, idemKey: string): ReturnType<Backend['evolve']> {
    return this.mutate('evolve', { unitId }, idemKey, 'evolution', (p) => evolve(p, unitId, this.env));
  }

  rerollTrait(unitId: string, idemKey: string): ReturnType<Backend['rerollTrait']> {
    return this.mutate('rerollTrait', { unitId }, idemKey, 'reroll', (p) => rerollTrait(p, unitId, this.env));
  }

  setTeam(unitIds: string[], idemKey: string): ReturnType<Backend['setTeam']> {
    return this.mutate('setTeam', { unitIds }, idemKey, 'team', (p) => {
      const r = setTeam(p, unitIds);
      return r.ok ? { ...r, result: r.result.team } : r;
    });
  }

  /**
   * Belohnung aus dem Replay: wird mit der Sim nachgerechnet (`meta/src/verify.ts`), Angaben des Clients ausser dem Replay zaehlen nicht.
   * Fehler: `replay-mismatch` (Hash/Ergebnis stimmt nicht), `invalid-replay`, `replay-incomplete`, `already-reported` u. a.
   */
  reportMatch(replay: ReplayFile, idemKey: string): ReturnType<Backend['reportMatch']> {
    const head = { stage: replay?.stage, difficulty: replay?.difficulty, seed: replay?.seed, endTick: replay?.endTick, endHash: replay?.endHash };
    // bindToProfile: Team und unitMods im Replay muessen zum gespeicherten Profil passen (sonst gaebe sich ein Replay selbst Level)
    return this.mutate('reportMatch', head, idemKey, 'reward', (p) => rewardFromReplay(p, replay, this.env, { data: loadBrowserData(), bindToProfile: true }));
  }

  /** Ablauf der reinen Leseaufrufe: Profil sicherstellen, dann `fn` mit dem Profil. */
  private read<T extends { ok: true }>(fn: (p: Profile) => T | BFail): Promise<T | BFail> {
    return this.serial<T>(async () => {
      const cur = await this.ensure();
      if ('ok' in cur) return cur;
      return fn(cur.profile);
    });
  }

  playerView(): ReturnType<Backend['playerView']> {
    return this.read((p) => ({ ok: true as const, player: playerView(p), persistence: this.persistence }));
  }

  collectionView(): ReturnType<Backend['collectionView']> {
    return this.read((p) => ({ ok: true as const, ...collectionView(p) }));
  }

  stageView(stageId: string): ReturnType<Backend['stageView']> {
    return this.read((p) => ({ ok: true as const, ...stageView(p, stageId) }));
  }

  worldView(): ReturnType<Backend['worldView']> {
    return this.read((p) => ({ ok: true as const, world: worldView(p) }));
  }

  pullHistory(limit = 30): ReturnType<Backend['pullHistory']> {
    return this.read((p) => ({ ok: true as const, history: pullHistoryView(p, limit) }));
  }

  matchSetup(difficulty: DifficultyId, stageId?: string): ReturnType<Backend['matchSetup']> {
    return this.read((p) => {
      if (stageId && !isStageUnlocked(p, stageId)) return fail('stage-locked', 'This stage is not unlocked yet.');
      if (!isDifficultyUnlocked(p, difficulty)) return fail('difficulty-locked', 'This difficulty is not unlocked yet.');
      const owned = Object.keys(p.units).length;
      if (owned === 0 || p.team.length === 0) return fail('team-empty', 'Pick a team first.');
      const missing = p.team.find((u) => !p.units[u]);
      if (missing) return fail('unit-not-owned', `You do not own ${missing}.`);
      if (p.team.length < Math.min(6, owned)) return fail('team-incomplete', 'Pick a full team first.');
      return { ok: true as const, team: [...p.team], unitMods: unitModsFor(p, p.team) };
    });
  }

  async shopCatalog(): ReturnType<Backend['shopCatalog']> {
    return { ok: true, products: [...SHOP_CATALOG] };
  }

  buy(sku: string, idemKey: string): ReturnType<Backend['buy']> {
    return this.mutate('buy', { sku }, idemKey, 'order', (p) => buy(p, sku, this.env, this.provider));
  }

  refreshOrder(orderId: string, idemKey: string): ReturnType<Backend['refreshOrder']> {
    return this.mutate('refreshOrder', { orderId }, idemKey, 'order', (p) => refreshOrder(p, orderId, this.env, this.provider));
  }

  exportSave(): ReturnType<Backend['exportSave']> {
    return this.serial(async () => {
      const cur = await this.ensure();
      if ('ok' in cur) return cur;
      const day = this.env.now().slice(0, 10).replace(/-/g, '');
      return { ok: true as const, json: exportProfile(cur.profile, this.env), filename: `${SAVE_FORMAT}-${day}.json` };
    });
  }

  importSave(json: string): ReturnType<Backend['importSave']> {
    return this.serial(async () => {
      const r = importProfile(json);
      if (!r.ok) return fail(r.code, r.message);
      try {
        await this.storage.backup(this.profile ? JSON.stringify(this.profile) : undefined);
      } catch {
        /* best effort */
      }
      const saved = await this.commit(r.profile);
      if (typeof saved !== 'string') return saved;
      this.loadError = null;
      return { ok: true as const, profile: r.profile, persistence: saved };
    });
  }
}
