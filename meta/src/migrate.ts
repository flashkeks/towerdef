/**
 * Laden und Migrieren. `migrate(raw)` wirft nie: kaputte, zu neue oder unbekannte Daten kommen als Fehler-Objekt zurueck.
 *
 * Ablauf: Version bestimmen -> Migrationen v -> v+1 der Reihe nach -> zod-Schema -> Ledger auf Doppelbuchungen pruefen ->
 * `wallet` aus dem Ledger neu berechnen -> Spieler-Level aus XP.
 *
 * Neue Schema-Version: `SCHEMA_VERSION` in profile.ts erhoehen, Schema anpassen, hier einen Eintrag in `MIGRATIONS` ergaenzen
 * (Schluessel = Ausgangsversion) und einen Test.
 */
import costsJson from '../data/unit-costs.json';
import { isKnownUnit } from './catalog';
import { findDuplicateBooking, withWalletFromLedger } from './ledger';
import { levelUpTotalCost } from './leveling';
import { levelFromXp } from './progression';
import { ProfileSchema, SCHEMA_VERSION, type Profile } from './profile';
import { fail, type Fail } from './result';
import { isRecord } from './util';

type Raw = Record<string, unknown>;

/**
 * Aelteste Form (v0, nur zur Uebung/Test, nie ausgeliefert): Zaehler statt Ledger, `units` als ID-Liste.
 * Wird zu v1 mit einer `adjust`-Buchung je Waehrung als Startsaldo.
 */
function v0ToV1(raw: Raw): Raw {
  if (typeof raw.id !== 'string' || !raw.id) throw new Error('v0: id fehlt');
  const created = typeof raw.createdAt === 'string' ? raw.createdAt : '1970-01-01T00:00:00.000Z';
  const ledger: Raw[] = [];
  for (const c of ['crystals', 'gold'] as const) {
    const v = raw[c];
    if (typeof v === 'number' && Number.isInteger(v) && v !== 0) {
      ledger.push({ id: `L${String(ledger.length + 1).padStart(6, '0')}`, currency: c, delta: v, kind: 'adjust', refType: 'migration', refId: 'v0', createdAt: created });
    }
  }
  const units: Record<string, unknown> = {};
  if (Array.isArray(raw.units)) {
    for (const u of raw.units) if (typeof u === 'string') units[u] = { level: 1, xp: 0, copies: 1, stars: 1, firstObtainedAt: created };
  }
  return {
    schemaVersion: 1,
    id: raw.id,
    displayName: typeof raw.name === 'string' ? raw.name : 'Warden',
    createdAt: created,
    playerLevel: 1,
    playerXp: 0,
    wallet: { crystals: 0, gold: 0 },
    ledger,
    units,
    team: [],
    pity: {},
    pullHistory: [],
    stages: {},
    settings: {},
    flags: { starterGiftClaimed: false },
    counters: {},
    idem: {},
  };
}

/** Die 14 handgemachten Units der Runde 7 (`sim/data/units.json` vor Runde 8) samt Seltenheit; sie gibt es nicht mehr. */
export const LEGACY_R7_UNITS: Readonly<Record<string, string>> = {
  striker: 'rare', gunner: 'rare', warden: 'rare',
  blaster: 'epic', banner: 'epic', farm: 'epic', mortar: 'epic', broker: 'epic',
  lancer: 'legendary', frost: 'legendary', stormcaller: 'legendary', seer: 'legendary',
  titan: 'mythic', weaver: 'mythic',
};

const REFUND_PER_COPY = (costsJson as { migrationRefund: { crystalsPerCopy: Record<string, number> } }).migrationRefund.crystalsPerCopy;
const asInt = (v: unknown, d: number): number => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : d);

/**
 * v1 -> v2 (Runde 8 / P2: AA-Units). Entfernt die Runde-7-Units (`LEGACY_R7_UNITS`) und alles, was der Katalog nicht kennt, und erstattet:
 * Crystals je Kopie nach Seltenheit (`data/unit-costs.json`, `migrationRefund`), Gold zu 100 % fuer die gekauften Unit-Level (`levelUpTotalCost`).
 * Beides als Ledger-Buchungen `refund` / `migration/v2-units` (je Waehrung eine). Team wird geleert, Idempotenz-Tabelle geleert,
 * `starterGiftClaimed` zurueckgesetzt (das neue Geschenk mit AA-Units darf geholt werden; Crystals gibt es dabei nicht noch einmal, wenn `starter/v1` gebucht ist).
 * Pity je Banner bleibt (Zaehler gelten weiter, die Regeln sind gleich); der inaktive Beispiel-Banner entfaellt. Verlauf und Stage-Fortschritt bleiben.
 * Fuer die UI steht der Bericht in `settings.migrationR8` (`removedUnits`, `refundCrystals`, `refundGold`).
 */
function v1ToV2(raw: Raw): Raw {
  const units = isRecord(raw.units) ? raw.units : {};
  const ledger = Array.isArray(raw.ledger) ? [...(raw.ledger as Raw[])] : [];
  const removed: string[] = [];
  const kept: Record<string, unknown> = {};
  let crystals = 0;
  let gold = 0;
  for (const [id, u] of Object.entries(units)) {
    if (!(id in LEGACY_R7_UNITS) && isKnownUnit(id)) {
      kept[id] = u;
      continue;
    }
    removed.push(id);
    const o = isRecord(u) ? u : {};
    crystals += asInt(o.copies, 1) * (REFUND_PER_COPY[LEGACY_R7_UNITS[id] ?? 'rare'] ?? 0);
    gold += levelUpTotalCost(1, asInt(o.level, 1));
  }
  const last = ledger.length ? (ledger[ledger.length - 1] as Raw) : null;
  const at = typeof last?.createdAt === 'string' ? last.createdAt : typeof raw.createdAt === 'string' ? raw.createdAt : '1970-01-01T00:00:00.000Z';
  const add = (currency: string, delta: number): void => {
    if (delta > 0) ledger.push({ id: `L${String(ledger.length + 1).padStart(6, '0')}`, currency, delta, kind: 'refund', refType: 'migration', refId: 'v2-units', createdAt: at });
  };
  add('crystals', crystals);
  add('gold', gold);
  const pity = isRecord(raw.pity) ? { ...raw.pity } : {};
  delete pity['featured-example'];
  const flags = isRecord(raw.flags) ? { ...raw.flags } : {};
  flags.starterGiftClaimed = false;
  const settings = isRecord(raw.settings) ? { ...raw.settings } : {};
  if (removed.length) settings.migrationR8 = { removedUnits: removed.sort(), refundCrystals: crystals, refundGold: gold };
  return { ...raw, schemaVersion: 2, units: kept, team: [], ledger, pity, flags, settings, idem: {} };
}

/** Schluessel = Ausgangsversion. */
export const MIGRATIONS: Record<number, (raw: Raw) => Raw> = {
  0: v0ToV1,
  1: v1ToV2,
};

export type MigrateResult = { ok: true; profile: Profile; migratedFrom: number } | Fail;

export function migrate(raw: unknown): MigrateResult {
  try {
    if (!isRecord(raw)) return fail('profile-corrupt', 'Save data is not an object.');
    let version: number;
    if (raw.schemaVersion === undefined) {
      // ohne Versionsfeld: nur als v0 akzeptieren, wenn es nach der alten Form aussieht
      if (typeof raw.id !== 'string') return fail('profile-corrupt', 'Save data has no version and is not a known old format.');
      version = 0;
    } else if (typeof raw.schemaVersion === 'number' && Number.isInteger(raw.schemaVersion) && raw.schemaVersion >= 0) {
      version = raw.schemaVersion;
    } else {
      return fail('profile-corrupt', 'Save data has an invalid version.');
    }
    if (version > SCHEMA_VERSION) return fail('profile-too-new', `Save data is version ${version}, this build understands up to ${SCHEMA_VERSION}.`);

    let cur: Raw = raw;
    for (let v = version; v < SCHEMA_VERSION; v++) {
      const step = MIGRATIONS[v];
      if (!step) return fail('profile-corrupt', `No migration from version ${v}.`);
      cur = step(cur);
    }

    const parsed = ProfileSchema.safeParse(cur);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return fail('profile-corrupt', `Save data is invalid at ${issue ? issue.path.join('.') || '(root)' : '?'}.`);
    }
    const dup = findDuplicateBooking(parsed.data.ledger);
    if (dup) return fail('profile-corrupt', `Ledger has a duplicate booking (${dup.refType}/${dup.refId}/${dup.kind}).`);

    const profile = withWalletFromLedger(parsed.data);
    profile.playerLevel = levelFromXp(profile.playerXp);
    return { ok: true, profile, migratedFrom: version };
  } catch (e) {
    return fail('profile-corrupt', `Save data could not be read (${e instanceof Error ? e.message : 'unknown error'}).`);
  }
}
