/**
 * Traits (Runde 8 / P2): Daten `data/aa/traits.json` (Importer, 12 AA-Traits), Wurf, Reroll, Wirkung im Match.
 *
 * - Ein Trait sitzt an einer besessenen Unit (`profile.units[id].trait = { id, tier }`) und wird nur durch `rerollTrait` gesetzt/getauscht
 *   (neue Units haben keinen; AA gibt 1 % beim Ziehen - hier bewusst nicht, damit der Gacha-Wurf unveraendert bleibt).
 * - `rerollTrait`: Kosten in Crystals nach Seltenheit der Unit (`data/unit-costs.json`), eine Ledger-Buchung `trait_reroll/<unit>:<n>`
 *   (n = Zaehler `counters['reroll:<unit>']`), Wurf nach Gewicht (`weight`), Stufe bei Superior/Nimble/Range nach `tierWeights`.
 *   Dasselbe Trait darf wieder fallen (wie AA). Doppel-Trait gibt es nicht (No-op).
 * - Wirkung: `traitMod(unitId, trait)` -> Anteile fuer `UnitMod` (Schaden additiv, Reichweite, SPA, Yen nur fuer die genannten Farm-Units).
 *   Bedingte Teile (Boss, wenig HP, True-Damage-Anteil, XP) sind Daten ohne Wirkung (`docs/aa-import/unsupported.md`).
 */
import traitsJson from '../data/aa/traits.json';
import costsJson from '../data/unit-costs.json';
import { rarityOf } from './catalog';
import type { MetaEnv } from './env';
import { bookAll, KIND } from './ledger';
import type { OwnedUnit, Profile } from './profile';
import { fail, opOk, type Op } from './result';

export interface TraitEffect {
  damageBp?: number;
  rangeBp?: number;
  spaBp?: number;
  damageMultBp?: number;
  yieldBp?: number;
}
export interface TraitDef extends TraitEffect {
  id: string;
  name: string;
  rarity: string;
  weight: number;
  tiers?: TraitEffect[];
  yieldUnits?: string[];
  noop?: string[];
}
export interface TraitRef {
  id: string;
  tier: number;
}

const DATA = traitsJson as unknown as { tierWeights: number[]; traits: TraitDef[] };
export const TRAITS: readonly TraitDef[] = DATA.traits;
export const TRAIT_TIER_WEIGHTS: readonly number[] = DATA.tierWeights;
export const TRAIT_WEIGHT_TOTAL = TRAITS.reduce((s, t) => s + t.weight, 0);
export const traitById = (id: string): TraitDef | null => TRAITS.find((t) => t.id === id) ?? null;

const REROLL_CRYSTALS = (costsJson as { reroll: { crystals: Record<string, number> } }).reroll.crystals;
/** Crystals fuer einen Reroll dieser Unit (nach Seltenheit). */
export const rerollCost = (unitId: string): number | null => {
  const r = rarityOf(unitId);
  return r ? (REROLL_CRYSTALS[r] ?? null) : null;
};

/** Effekt eines Traits (bei gestaffelten Traits der Stufe `tier`). */
export function traitEffect(t: TraitDef, tier: number): TraitEffect {
  if (t.tiers) return t.tiers[Math.min(Math.max(tier, 1), t.tiers.length) - 1] ?? {};
  return t;
}

/** Anzeigetext, z. B. "Divine: +20% damage, 10% faster, +20% range" (Englisch). */
export function traitText(ref: TraitRef): string {
  const t = traitById(ref.id);
  if (!t) return ref.id;
  const e = traitEffect(t, ref.tier);
  const parts: string[] = [];
  const pct = (bp: number): string => `${Math.round(Math.abs(bp) / 10) / 10}%`;
  if (e.damageMultBp) parts.push(`x${(e.damageMultBp / 10000).toString()} damage`);
  if (e.damageBp) parts.push(`${e.damageBp > 0 ? '+' : '-'}${pct(e.damageBp)} damage`);
  if (e.spaBp) parts.push(`${pct(e.spaBp)} ${e.spaBp < 0 ? 'faster' : 'slower'}`);
  if (e.rangeBp) parts.push(`+${pct(e.rangeBp)} range`);
  if (e.yieldBp) parts.push(`+${pct(e.yieldBp)} yen (${(t.yieldUnits ?? []).join(', ')})`);
  const name = t.tiers && ref.tier > 1 ? `${t.name} ${'I'.repeat(ref.tier)}` : t.name;
  return parts.length ? `${name}: ${parts.join(', ')}` : name;
}

/** Anzeigename mit Stufe ("Superior II"). */
export const traitName = (ref: TraitRef): string => {
  const t = traitById(ref.id);
  return t ? (t.tiers && ref.tier > 1 ? `${t.name} ${'I'.repeat(ref.tier)}` : t.name) : ref.id;
};

export interface TraitMod {
  /** additiver Schaden (Bp): `traitBp` der Sim */
  damageBp: number;
  rangeBp: number;
  spaBp: number;
  /** multiplikativer Farm-Ertrag (10000 = x1) */
  yieldBp: number;
}

/** Wirkung im Match fuer eine Unit mit Trait. Ohne bekanntes Trait: neutral. */
export function traitMod(unitId: string, ref: TraitRef | undefined): TraitMod {
  const out: TraitMod = { damageBp: 0, rangeBp: 0, spaBp: 0, yieldBp: 10000 };
  const t = ref ? traitById(ref.id) : null;
  if (!ref || !t) return out;
  const e = traitEffect(t, ref.tier);
  out.damageBp = (e.damageBp ?? 0) + (e.damageMultBp ? e.damageMultBp - 10000 : 0);
  out.rangeBp = e.rangeBp ?? 0;
  out.spaBp = e.spaBp ?? 0;
  if (e.yieldBp && t.yieldUnits?.includes(unitId)) out.yieldBp = 10000 + e.yieldBp;
  return out;
}

/** Einen Trait wuerfeln (Gewicht, danach Stufe). */
export function rollTrait(env: Pick<MetaEnv, 'randomInt'>): TraitRef {
  let pick = env.randomInt(TRAIT_WEIGHT_TOTAL);
  let t = TRAITS[0]!;
  for (const x of TRAITS) {
    if (pick < x.weight) {
      t = x;
      break;
    }
    pick -= x.weight;
  }
  let tier = 1;
  if (t.tiers) {
    const total = TRAIT_TIER_WEIGHTS.reduce((s, w) => s + w, 0);
    let p = env.randomInt(total);
    for (let i = 0; i < TRAIT_TIER_WEIGHTS.length; i++) {
      if (p < TRAIT_TIER_WEIGHTS[i]!) {
        tier = i + 1;
        break;
      }
      p -= TRAIT_TIER_WEIGHTS[i]!;
    }
  }
  return { id: t.id, tier };
}

export interface RerollResult {
  unitId: string;
  trait: TraitRef;
  previous: TraitRef | null;
  cost: number;
  /** wievielter Reroll dieser Unit */
  rerolls: number;
}

export function rerollTrait(p: Profile, unitId: string, env: MetaEnv): Op<RerollResult> {
  const u = p.units[unitId];
  if (!u) return fail('unit-not-owned', `You do not own ${unitId}.`);
  const cost = rerollCost(unitId);
  if (cost === null) return fail('unknown-unit', `Unknown unit ${unitId}.`);
  const key = `reroll:${unitId}`;
  const n = (p.counters[key] ?? 0) + 1;
  const paid = bookAll(p, [{ currency: 'crystals', delta: -cost, kind: KIND.traitReroll, refType: 'trait_reroll', refId: `${unitId}:${n}` }], env);
  if (!paid.ok) return paid;
  const trait = rollTrait(env);
  const next: OwnedUnit = { ...u, trait };
  const profile: Profile = { ...paid.profile, counters: { ...paid.profile.counters, [key]: n }, units: { ...paid.profile.units, [unitId]: next } };
  return opOk(profile, { unitId, trait, previous: u.trait ?? null, cost, rerolls: n });
}

