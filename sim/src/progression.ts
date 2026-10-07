/**
 * Meta-Fortschritt -> Sim-Mods (Runde 7 / P2). Reine Funktionen auf den Daten aus `data/progression.json`; Meta, Bots und Client
 * lesen dieselbe Quelle. Kein Dateizugriff (läuft auch im Browser). Keine Unit-Liste: gilt für jede Unit.
 */
import type { ProgressionData } from './data/schema.js';
import type { UnitMod } from './state.js';

export type MetaProfileName = 'fresh' | 'mid' | 'max';

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, Math.floor(v)));

/** Kopien -> Sterne (1..Anzahl der Stufen). */
export function starsForCopies(p: ProgressionData, copies: number): number {
  let s = 1;
  for (let i = 0; i < p.starCopies.length; i++) if (copies >= p.starCopies[i]) s = i + 1;
  return s;
}

/** Schadens-Faktor (Basispunkte, 10000 = x1) aus Level (1..maxLevel) und Sternen (1..max). Werte außerhalb werden begrenzt. */
export function damageBpFor(p: ProgressionData, level: number, stars: number): number {
  const l = clamp(level, 1, p.maxLevel);
  const s = clamp(stars, 1, p.starDamageBp.length);
  return 10000 + p.levelDamageBpPerLevel * (l - 1) + p.starDamageBp[s - 1];
}

/** `UnitMod` einer Unit für einen Spieler aus (Level, Sterne). Einzige Stelle, die Kurven in Mods umrechnet. */
export function unitModFor(p: ProgressionData, player: number, unit: string, level: number, stars: number): UnitMod {
  return { player, unit, lvlBp: damageBpFor(p, level, stars) };
}

/** Meta-Profile der Bots: `fresh` = alles Level 1/Stern 1 (neutral), `mid` = Level 20/Stern 3, `max` = Level 40/Stern 5 (letzter Stern der Daten). */
export function metaProfileLevels(p: ProgressionData, name: MetaProfileName): { level: number; stars: number } {
  const top = p.starDamageBp.length;
  if (name === 'fresh') return { level: 1, stars: 1 };
  if (name === 'mid') return { level: Math.round(p.maxLevel / 2), stars: Math.min(3, top) };
  return { level: p.maxLevel, stars: top };
}

/** Mods für alle angegebenen Units und Spieler nach Meta-Profil (Bots/Messung). `fresh` liefert neutrale Mods (lvlBp 10000). */
export function metaProfileMods(p: ProgressionData, name: MetaProfileName, unitIds: readonly string[], players: number): UnitMod[] {
  const { level, stars } = metaProfileLevels(p, name);
  const out: UnitMod[] = [];
  for (let pl = 0; pl < players; pl++) for (const u of unitIds) out.push(unitModFor(p, pl, u, level, stars));
  return out;
}
