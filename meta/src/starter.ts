/**
 * Starter-Geschenk fuer neue Profile. Besitzer: P5. Jetzt: alle Rare-Units aus sim/data/units.json plus Crystals fuer einen 10er-Zug
 * (Preis aus der Standard-Banner-Datei). Setzt ausserdem das Team auf diese Units, falls noch keins gewaehlt ist.
 * TODO P5: Menge/Auswahl entscheiden (run.md: "Crystals fuer einen 10er-Zug plus die Rare-Units").
 */
import { unitsOfRarity } from './catalog';
import type { MetaEnv } from './env';
import { getBanner, pullCost } from './gacha';
import { book, KIND } from './ledger';
import { MAX_TEAM, type Profile } from './profile';
import { starsForCopies } from './stars';
import { fail, opOk, type Op } from './result';

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
  const granted = unitsOfRarity('rare');
  const units = { ...r.profile.units };
  for (const id of granted) {
    if (!units[id]) units[id] = { level: 1, xp: 0, copies: 1, stars: starsForCopies(1), firstObtainedAt: now };
  }
  const team = r.profile.team.length ? r.profile.team : granted.slice(0, MAX_TEAM);
  const profile: Profile = { ...r.profile, units, team, flags: { ...r.profile.flags, starterGiftClaimed: true } };
  return opOk(profile, { crystals, units: granted });
}
