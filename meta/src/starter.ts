/**
 * Starter-Geschenk fuer neue Profile. Besitzer: P5. Einmalig (Ledger `starter/v1` + Flag), idempotent.
 * Inhalt (STARTWERTE, Messung in docs/balancing/meta.md): Crystals fuer einen 10er-Zug (Preis aus der Standard-Banner-Datei, 450) und eine
 * spielbare Start-Sammlung: alle Rare- und Epic-Units plus die Units aus `STARTER_EXTRA`. Bot-Messung (Normal, 4 Seeds x 4 Bots):
 * nur Rare+Epic erreicht Welle 18-20 und scheitert am Boss; mit Lancer (Legendary) siegen die Bots fast immer. Die Sammlung wird aus dem
 * Katalog gebildet (neue Units der Runde 7 erscheinen nur, wenn sie Rare/Epic sind oder hier stehen). Das Team wird auf die ersten 6
 * Geschenk-Units gesetzt, falls noch keins gewaehlt ist.
 */
import { UNIT_CATALOG, isKnownUnit } from './catalog';
import type { MetaEnv } from './env';
import { getBanner, pullCost } from './gacha';
import { book, KIND } from './ledger';
import { MAX_TEAM, type Profile } from './profile';
import { starsForCopies } from './stars';
import { fail, opOk, type Op } from './result';

/** Zusaetzlich zu allen Rare/Epic: ein Legendary als Boss-Antwort (Lancer). Unbekannte IDs werden uebersprungen. */
export const STARTER_EXTRA: readonly string[] = ['lancer'];

/** Die Units des Geschenks in Katalogreihenfolge. */
export const starterUnits = (): string[] => UNIT_CATALOG.filter((u) => u.rarity === 'rare' || u.rarity === 'epic' || (STARTER_EXTRA.includes(u.id) && isKnownUnit(u.id))).map((u) => u.id);

export interface StarterResult {
  crystals: number;
  units: string[];
}

export function claimStarterGift(p: Profile, env: Pick<MetaEnv, 'now'>): Op<StarterResult> {
  if (p.flags.starterGiftClaimed) return fail('starter-already-claimed', 'The starter gift was already claimed.');
  const banner = getBanner('standard');
  const crystals = banner ? pullCost(banner, 10) : 450;
  const r = book(p, { currency: 'crystals', delta: crystals, kind: KIND.starterGift, refType: 'starter', refId: 'v1' }, env);
  if (!r.ok) return r.code === 'duplicate-booking' ? fail('starter-already-claimed', 'The starter gift was already claimed.') : r;
  const now = env.now();
  const granted = starterUnits();
  const units = { ...r.profile.units };
  for (const id of granted) {
    if (!units[id]) units[id] = { level: 1, xp: 0, copies: 1, stars: starsForCopies(1), firstObtainedAt: now };
  }
  const team = r.profile.team.length ? r.profile.team : [...granted.filter((u) => STARTER_EXTRA.includes(u)), ...granted.filter((u) => !STARTER_EXTRA.includes(u))].slice(0, MAX_TEAM);
  const profile: Profile = { ...r.profile, units, team, flags: { ...r.profile.flags, starterGiftClaimed: true } };
  return opOk(profile, { crystals, units: granted });
}
