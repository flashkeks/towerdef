/**
 * Evolution (Runde 8 / P2). Rezepte kommen aus `data/aa/evolutions.json` (Importer, 219 AA-Rezepte), Kosten aus `data/unit-costs.json`.
 *
 * `evolve(profile, unitId, env)`: die Unit wird durch ihre entwickelte Form ersetzt.
 * - Voraussetzung: besessen, Rezept vorhanden und nicht `blocked`, genug Kopien (`needs`: Basis `amount` Kopien, ggf. weitere Units).
 * - Kosten: Crystals + Gold nach Seltenheit der **entwickelten** Form (AA-Materialien entfallen, siehe Importer). Eine atomare Buchung je Waehrung
 *   `evolve/<von>:<n>` (n = Zaehler `counters['evolve:<von>']`). Fehlt Geld: `not-enough-crystals` / `not-enough-gold`, nichts passiert.
 * - Ergebnis: Level, XP, Trait und Kopien (abzueglich verbrauchter) bleiben erhalten, die Vorstufe verschwindet, die Team-Platz geht auf die neue Form.
 *   Zufalls-Evolutionen (Elize, Chance: mehrere Ziele) wuerfeln gleichverteilt mit `env.randomInt`.
 * - Idempotenz: wie alle Aktionen ueber `withIdempotency` im Backend (Doppelklick = eine Evolution).
 */
import evolutionsJson from '../data/aa/evolutions.json';
import costsJson from '../data/unit-costs.json';
import { UNIT_CATALOG, nameOf, rarityOf } from './catalog';
import type { MetaEnv } from './env';
import { bookAll, KIND } from './ledger';
import { MAX_TEAM, type OwnedUnit, type Profile } from './profile';
import { fail, opOk, type Op } from './result';
import { starsForCopies } from './stars';

export interface EvolutionRecipe {
  from: string;
  to: { id: string; weight: number }[];
  needs: { id: string; amount: number }[];
  text: string;
  attackPct: number | null;
  blocked?: string;
  aa: { starFruits: number; items: number; takedowns: number | null };
}

const RECIPES = (evolutionsJson as unknown as { recipes: EvolutionRecipe[] }).recipes;
const COSTS = costsJson.evolve as { crystals: Record<string, number>; gold: Record<string, number> };
const byFrom = new Map<string, EvolutionRecipe>(RECIPES.map((r) => [r.from, r]));

export const allRecipes = (): readonly EvolutionRecipe[] => RECIPES;
export const recipeFor = (unitId: string): EvolutionRecipe | null => byFrom.get(unitId) ?? null;

/** Kosten dieser Evolution (nach Seltenheit der entwickelten Form; bei mehreren Zielen das erste). `null` ohne Rezept. */
export function evolutionCost(unitId: string): { crystals: number; gold: number } | null {
  const r = byFrom.get(unitId);
  if (!r) return null;
  const rar = rarityOf(r.to[0]!.id) ?? rarityOf(unitId);
  if (!rar) return null;
  return { crystals: COSTS.crystals[rar] ?? 0, gold: COSTS.gold[rar] ?? 0 };
}

export interface EvolutionView {
  from: string;
  /** mehrere Ziele = Zufalls-Evolution */
  to: { id: string; name: string; chancePct: number }[];
  cost: { crystals: number; gold: number };
  needs: { id: string; name: string; amount: number; owned: number }[];
  text: string;
  /** Voraussetzungen erfuellt und Geld da (nur mit Profil) */
  ready: boolean;
  /** warum nicht (Englisch, anzeigbar), sonst null */
  reason: string | null;
}

/** Anzeige-Daten der Evolution einer Unit; `null` ohne Rezept. Die UI rechnet nichts selbst. */
export function evolutionView(unitId: string, profile: Profile | null): EvolutionView | null {
  const r = byFrom.get(unitId);
  const cost = evolutionCost(unitId);
  if (!r || !cost) return null;
  const owned = (id: string): number => profile?.units[id]?.copies ?? 0;
  const needs = r.needs.map((n) => ({ id: n.id, name: nameOf(n.id), amount: n.amount, owned: owned(n.id) }));
  let reason: string | null = null;
  if (r.blocked) reason = 'This evolution is not available yet.';
  else if (profile) {
    const short = needs.find((n) => n.owned < n.amount);
    if (!profile.units[unitId]) reason = 'You do not own this unit.';
    else if (short) reason = short.id === unitId ? `Needs ${short.amount} copies.` : `Needs ${short.amount} x ${short.name}.`;
    else if (profile.wallet.crystals < cost.crystals) reason = 'Not enough crystals.';
    else if (profile.wallet.gold < cost.gold) reason = 'Not enough gold.';
  }
  return {
    from: unitId,
    to: r.to.map((t) => ({ id: t.id, name: nameOf(t.id), chancePct: t.weight / 100 })),
    cost,
    needs,
    text: r.text,
    ready: !!profile && reason === null,
    reason,
  };
}

export interface EvolveResult {
  from: string;
  to: string;
  cost: { crystals: number; gold: number };
  level: number;
  copies: number;
  stars: number;
  trait: OwnedUnit['trait'] | null;
}

export function evolve(p: Profile, unitId: string, env: MetaEnv): Op<EvolveResult> {
  const u = p.units[unitId];
  if (!u) return fail('unit-not-owned', `You do not own ${unitId}.`);
  const r = byFrom.get(unitId);
  if (!r) return fail('no-evolution', 'This unit cannot evolve.');
  if (r.blocked) return fail('evolution-unavailable', 'This evolution is not available yet.');
  for (const n of r.needs) {
    const have = p.units[n.id]?.copies ?? 0;
    if (have < n.amount) return fail('evolution-needs-units', n.id === unitId ? `Needs ${n.amount} copies of ${nameOf(unitId)}.` : `Needs ${n.amount} x ${nameOf(n.id)}.`);
  }
  const cost = evolutionCost(unitId)!;
  const key = `evolve:${unitId}`;
  const n = (p.counters[key] ?? 0) + 1;
  const bookings = [
    ...(cost.crystals > 0 ? [{ currency: 'crystals' as const, delta: -cost.crystals, kind: KIND.evolve, refType: 'evolve', refId: `${unitId}:${n}` }] : []),
    ...(cost.gold > 0 ? [{ currency: 'gold' as const, delta: -cost.gold, kind: KIND.evolve, refType: 'evolve', refId: `${unitId}:${n}` }] : []),
  ];
  const paid = bookAll(p, bookings, env);
  if (!paid.ok) return paid;

  // Ziel: eine Unit, oder gewichtet gewuerfelt
  let to = r.to[0]!.id;
  if (r.to.length > 1) {
    let pick = env.randomInt(r.to.reduce((s, t) => s + t.weight, 0));
    for (const t of r.to) {
      if (pick < t.weight) {
        to = t.id;
        break;
      }
      pick -= t.weight;
    }
  }
  const baseNeed = r.needs.find((x) => x.id === unitId)?.amount ?? 1;
  const keptCopies = Math.max(1, u.copies - baseNeed + 1);
  const units = { ...paid.profile.units };
  delete units[unitId];
  for (const x of r.needs) {
    if (x.id === unitId) continue;
    const o = units[x.id];
    if (!o) continue;
    if (o.copies - x.amount < 1) {
      delete units[x.id];
    } else {
      const copies = o.copies - x.amount;
      units[x.id] = { ...o, copies, stars: starsForCopies(copies) };
    }
  }
  const existing = units[to];
  const evolved: OwnedUnit = existing
    ? { ...existing, copies: existing.copies + keptCopies, stars: starsForCopies(existing.copies + keptCopies), level: Math.max(existing.level, u.level) }
    : { level: u.level, xp: u.xp, copies: keptCopies, stars: starsForCopies(keptCopies), firstObtainedAt: u.firstObtainedAt, ...(u.trait ? { trait: u.trait } : {}) };
  units[to] = evolved;
  const team = paid.profile.team.filter((x) => units[x] || x === unitId).map((x) => (x === unitId ? to : x));
  const dedup = team.filter((x, i) => team.indexOf(x) === i && units[x]).slice(0, MAX_TEAM);
  const profile: Profile = { ...paid.profile, units, team: dedup, counters: { ...paid.profile.counters, [key]: n } };
  return opOk(profile, { from: unitId, to, cost, level: evolved.level, copies: evolved.copies, stars: evolved.stars, trait: evolved.trait ?? null });
}

/**
 * Sanity-Check fuer Tests: jede Evolutionsform ist ueber ein Rezept erreichbar oder ziehbar. `orphans` = Units mit `evolvedFrom`, die kein Rezept
 * als Ziel nennt (AA-Daten: aizen_chrys, mahoraga, josuke_2, kite_evolved; sie sind deshalb ziehbar, `UnitCatalog.evolvedOnly` = false).
 */
export function evolutionCoverage(): { orphans: string[]; unknownTargets: string[] } {
  const targets = new Set(RECIPES.flatMap((r) => r.to.map((t) => t.id)));
  const known = new Set(UNIT_CATALOG.map((u) => u.id));
  return {
    orphans: UNIT_CATALOG.filter((u) => u.evolvedFrom && !targets.has(u.id)).map((u) => u.id),
    unknownTargets: [...targets].filter((t) => !known.has(t)),
  };
}
