/**
 * Starter-Geschenk fuer neue Profile (Runde 8 / P2: AA-Units). Besitzer: P5/P2. Einmalig (Ledger `starter/v2` + Flag), idempotent.
 * Inhalt (STARTWERTE, nur Rauchtest, kein Balancing): Crystals fuer einen 10er-Zug (Preis aus der Standard-Banner-Datei, 450) und eine feste,
 * spielbare Start-Sammlung aus `STARTER_UNITS`: eine starke Unit (Goku SSJ3, Mythic, Huegel) plus Rare/Epic-Units (Bodenkaempfer, drei Huegel-Units
 * gegen die Flieger ab Welle 8, eine Farm). Das Team sind die ersten sechs. Bot-Rauchtest: `mono-goku_ssj3,genos,krillin,speedwagon,jotaro,law`
 * gewinnt standard20 Normal (Test `starter-p2.test.ts`). Wer das Runde-7-Geschenk schon hat (`starter/v1` im Ledger, Migration setzt das Flag zurueck),
 * bekommt nur die Units, nicht noch einmal die Crystals.
 */
import { isKnownUnit } from './catalog';
import type { MetaEnv } from './env';
import { getBanner, pullCost } from './gacha';
import { book, hasBooking, KIND } from './ledger';
import { MAX_TEAM, type Profile } from './profile';
import { starsForCopies } from './stars';
import { fail, opOk, type Fail, type Op } from './result';

/** Die Geschenk-Units; die ersten `MAX_TEAM` sind das Start-Team. Unbekannte IDs werden uebersprungen. */
export const STARTER_UNITS: readonly string[] = [
  'goku_ssj3', 'genos', 'krillin', 'speedwagon', 'jotaro', 'law',
  'kakyoin', 'frieza', 'ichigo', 'luffy', 'naruto', 'tanjiro',
];

/** Die Units des Geschenks in Reihenfolge von `STARTER_UNITS`. */
export const starterUnits = (): string[] => STARTER_UNITS.filter((id) => isKnownUnit(id));

export interface StarterResult {
  crystals: number;
  units: string[];
}

export function claimStarterGift(p: Profile, env: Pick<MetaEnv, 'now'>): Op<StarterResult> {
  if (p.flags.starterGiftClaimed) return fail('starter-already-claimed', 'The starter gift was already claimed.');
  const banner = getBanner('standard');
  const had = hasBooking(p, { currency: 'crystals', kind: KIND.starterGift, refType: 'starter', refId: 'v1' });
  const crystals = had ? 0 : banner ? pullCost(banner, 10) : 450;
  let r: { ok: true; profile: Profile } | Fail = { ok: true, profile: p };
  if (crystals > 0) {
    r = book(p, { currency: 'crystals', delta: crystals, kind: KIND.starterGift, refType: 'starter', refId: 'v2' }, env);
    if (!r.ok) return r.code === 'duplicate-booking' ? fail('starter-already-claimed', 'The starter gift was already claimed.') : r;
  }
  const now = env.now();
  const granted = starterUnits();
  const units = { ...r.profile.units };
  for (const id of granted) {
    if (!units[id]) units[id] = { level: 1, xp: 0, copies: 1, stars: starsForCopies(1), firstObtainedAt: now };
  }
  const team = r.profile.team.length ? r.profile.team : granted.slice(0, MAX_TEAM);
  const profile: Profile = { ...r.profile, units, team, flags: { ...r.profile.flags, starterGiftClaimed: true } };
  return opOk(profile, { crystals, units: granted });
}
