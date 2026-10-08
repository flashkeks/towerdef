/**
 * Profil-Schema (zod) und `newProfile`. Besitzer: P1; Felder duerfen andere Pakete nur ADDITIV ergaenzen
 * (neues optionales Feld oder neuer Schluessel in `counters`/`flags`/`settings`, dazu eine Migration, wenn sich Bestehendes aendert).
 *
 * Angelehnt an architecture.md 6.7/7.5, aber lokal: kein kekgameSub. Ganzzahlen ueberall, keine Floats.
 * Waehrungen: `crystals` (Gacha, erspielbar + Mock-Shop, = `shards` aus architecture 7) und `gold` (Unit-Level, nur erspielbar).
 */
import { z } from 'zod';
import type { MetaEnv } from './env';

/**
 * Version 2 (Runde 8 / P2): AA-Units statt der 14 alten, `OwnedUnit.trait`. Migration 1 -> 2 in `migrate.ts`.
 * Version 3 (Runde 9 / P3): `inventory` (Raid-Marken, Evolutions-Material). Migration 2 -> 3 in `migrate.ts`.
 */
export const SCHEMA_VERSION = 3;
export const MAX_TEAM = 6;
export const PULL_HISTORY_MAX = 500;
export const IDEM_MAX = 200;

export const CURRENCIES = ['crystals', 'gold'] as const;
export type Currency = (typeof CURRENCIES)[number];

const int = z.number().int();
const nat = z.number().int().min(0);
const iso = z.string().min(1);

export const LedgerEntrySchema = z.object({
  id: z.string().min(1),
  currency: z.enum(CURRENCIES),
  delta: int,
  /** frei waehlbar, bekannte Werte in `ledger.ts` (`KIND`) */
  kind: z.string().min(1),
  refType: z.string().min(1),
  refId: z.string().min(1),
  createdAt: iso,
});
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

export const OwnedUnitSchema = z.object({
  level: z.number().int().min(1),
  xp: nat,
  /** Kopien inkl. der ersten (Duplikat = +1) */
  copies: z.number().int().min(1),
  /** abgeleitet aus `copies` (`stars.ts`), hier als Cache fuer die Anzeige */
  stars: z.number().int().min(1),
  firstObtainedAt: iso,
  /** Trait (Runde 8): `id` aus `data/aa/traits.json`, `tier` 1..3 bei gestaffelten Traits (sonst 1). Fehlt = kein Trait. */
  trait: z.object({ id: z.string().min(1), tier: z.number().int().min(1).max(3) }).optional(),
});
export type OwnedUnit = z.infer<typeof OwnedUnitSchema>;

export const PitySchema = z.object({
  sinceTop: nat,
  sinceMid: nat,
  /** Featured-Banner (P3): letzte Treffer der Featured-Stufe war nicht die Featured-Unit -> der naechste ist sie garantiert. Fehlt = false. */
  guaranteeFeatured: z.boolean().optional(),
});
export type Pity = z.infer<typeof PitySchema>;

/** Eintrag im Ziehungsverlauf, angelehnt an `gacha_pull` (architecture 7.5). */
export const PullRecordSchema = z.object({
  id: z.string().min(1),
  bannerId: z.string().min(1),
  ratesVersion: z.string().min(1),
  batchId: z.string().min(1),
  idx: nat,
  /** gewuerfelter Wert 0..9999 (Basispunkte) */
  rollBp: nat,
  rarity: z.string().min(1),
  unitId: z.string().min(1),
  /** true = Unit vorher nicht besessen */
  isNew: z.boolean(),
  /** Zaehler `sinceTop` vor/nach dem Zug */
  pityBefore: nat,
  pityAfter: nat,
  /** durch welche Regel erzwungen (`top` = Hoechststufe, `mid` = Mittelstufe, `batch` = Garantie im 10er), sonst `null` */
  pityForced: z.enum(['top', 'mid', 'batch']).nullable(),
  /** P3, additiv: Zaehler `sinceMid` vor/nach dem Zug */
  pityMidBefore: nat.optional(),
  pityMidAfter: nat.optional(),
  /** P3, additiv: Hash der Banner-Datei (kanonisches JSON), mit der gewuerfelt wurde; zusammen mit `ratesVersion` das Protokoll der Raten */
  ratesHash: z.string().optional(),
  /** P3, additiv (Featured-Banner): `won` = 50-%-Wurf, `lost` = andere Unit der Stufe, `guaranteed` = Garantie nach Fehlschlag */
  featured: z.enum(['won', 'lost', 'guaranteed']).optional(),
  costCrystals: nat,
  createdAt: iso,
});
export type PullRecord = z.infer<typeof PullRecordSchema>;

export const StageProgressSchema = z.object({
  clears: nat,
  firstClearAt: iso.nullable(),
  bestWave: nat,
});
export type StageProgress = z.infer<typeof StageProgressSchema>;

export const IdemEntrySchema = z.object({
  route: z.string().min(1),
  requestHash: z.string().min(1),
  /** gespeicherte Antwort (JSON), wird bei Wiederholung unveraendert zurueckgegeben */
  response: z.unknown(),
  createdAt: iso,
});
export type IdemEntry = z.infer<typeof IdemEntrySchema>;

/** Mock-Shop-Bestellung (P3, additiv). Zustandsautomat `created -> pending -> paid -> refunded` bzw. `-> failed`, nie rueckwaerts. */
export const OrderSchema = z.object({
  orderId: z.string().min(1),
  sku: z.string().min(1),
  crystals: nat,
  status: z.enum(['created', 'pending', 'paid', 'failed', 'refunded']),
  providerRef: z.string(),
  createdAt: iso,
  updatedAt: iso,
  /** bereits verarbeitete Anbieter-Ereignis-IDs (Deduplikation) */
  eventIds: z.array(z.string()),
});
export type Order = z.infer<typeof OrderSchema>;

/**
 * Inventar (Runde 9 / P3): Raid-Waehrung und Evolutions-Material. Bewusst NICHT im Ledger/Wallet (kein Gacha, kein Mock-Shop, nie gekauft mit Geld);
 * gutgeschrieben werden beide nur mit der Match-Belohnung (Duplikatsperre ueber die Ledger-Buchung desselben Replays) oder im Raid-Shop.
 */
export const InventorySchema = z.object({
  /** Raid-Marken: Waehrung des Raid-Shops */
  raidMarks: nat,
  /** Material-ID (`data/materials.json`) -> Menge; Mengen 0 werden gestrichen */
  materials: z.record(z.string(), nat),
});
export type Inventory = z.infer<typeof InventorySchema>;

export const ProfileSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: z.string().min(1),
  displayName: z.string(),
  createdAt: iso,
  playerLevel: z.number().int().min(1),
  playerXp: nat,
  /** Cache des Ledger-Saldos; beim Laden aus dem Ledger neu berechnet (`migrate.ts`) */
  wallet: z.object({ crystals: int, gold: int }),
  ledger: z.array(LedgerEntrySchema),
  units: z.record(z.string(), OwnedUnitSchema),
  team: z.array(z.string()).max(MAX_TEAM),
  /** Pity je Banner-ID */
  pity: z.record(z.string(), PitySchema),
  /** die letzten `PULL_HISTORY_MAX` Zuege, neueste zuletzt */
  pullHistory: z.array(PullRecordSchema).max(PULL_HISTORY_MAX),
  /** stages[stageId][difficulty] */
  stages: z.record(z.string(), z.record(z.string(), StageProgressSchema)),
  settings: z.record(z.string(), z.unknown()),
  flags: z.record(z.string(), z.boolean()),
  /** freie Zaehler (z. B. `pullBatches`); neue Pakete legen hier eigene Schluessel an */
  counters: z.record(z.string(), nat),
  /** Idempotenz-Tabelle, gekappt auf `IDEM_MAX` */
  idem: z.record(z.string(), IdemEntrySchema),
  /** Runde 9 / P3: Raid-Marken und Evolutions-Material (Schema 3) */
  inventory: InventorySchema,
  /** Mock-Shop-Bestellungen (P3, additiv, optional; fehlt = keine) */
  orders: z.record(z.string(), OrderSchema).optional(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export function newProfile(env: MetaEnv, opts: { displayName?: string } = {}): Profile {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: env.newId(),
    displayName: opts.displayName ?? 'Warden',
    createdAt: env.now(),
    playerLevel: 1,
    playerXp: 0,
    wallet: { crystals: 0, gold: 0 },
    ledger: [],
    units: {},
    team: [],
    pity: {},
    pullHistory: [],
    stages: {},
    settings: {},
    flags: { starterGiftClaimed: false },
    counters: {},
    idem: {},
    inventory: { raidMarks: 0, materials: {} },
  };
}

/** Zaehler um 1 erhoehen (Kopie) und neuen Wert liefern. Fuer fortlaufende IDs wie Batch-Nummern. */
export function nextCounter(p: Profile, key: string): { profile: Profile; value: number } {
  const value = (p.counters[key] ?? 0) + 1;
  return { profile: { ...p, counters: { ...p.counters, [key]: value } }, value };
}
