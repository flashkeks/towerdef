/** Wave-Reiter (Runde 12): Vorschau der naechsten Runde als reines Datenmodell (Sim: `game.roundPreview(r)`). */

import type { EnemyType, RoundPreview } from '../sim';
export type { RoundPreview };
export type EnemyKind = EnemyType;

export type Warning = 'camo' | 'armor' | 'ember' | 'boss' | 'frostling' | 'blimp' | 'regrow' | 'fortified';
export const WARNING_TEXT: Record<Warning, { name: string; tip: string }> = {
  camo: { name: 'Camo', tip: 'Camo enemies need a tower that sees them.' },
  armor: { name: 'Armor', tip: 'Armored: arrows bounce off, use blasts or magic.' },
  ember: { name: 'Ember', tip: 'Emberlings burn out and cannot be frozen.' },
  boss: { name: 'Boss', tip: 'A boss walks this round.' },
  frostling: { name: 'Blast-proof', tip: 'Frostlings shrug off explosions. Use arrows, frost or magic.' },
  blimp: { name: 'Blimp', tip: 'Gloomships, Cruisers and Duskrunners cannot be frozen, slow down by half, and their children take no damage until the hull breaks.' },
  regrow: { name: 'Regrow', tip: 'Bloom foes grow a layer back every 3 seconds. Pop them fast.' },
  fortified: { name: 'Fortified', tip: 'Fortified foes have double hull. Bring heavy hitters.' },
};

export const ENEMY_NAMES: Record<EnemyKind, string> = {
  red: 'Red Glim', blue: 'Blue Glim', green: 'Green Glim', gold: 'Gold Glim', ironshell: 'Ironshell', ember: 'Emberling', brute: 'Brute', leviathan: 'Dusk Leviathan',
  pink: 'Pink Glim', frostling: 'Frostling', crystal: 'Crystal Brute', gloomship: 'Gloomship', wyrm: 'Frost Wyrm', colossus: 'Ember Colossus',
  cruiser: 'Gloom Cruiser', duskrunner: 'Duskrunner', dreadnought: 'Dusk Dreadnought',
};

export function warnings(p: RoundPreview): Warning[] {
  const w: Warning[] = [];
  if (p.hasCamo) w.push('camo');
  if (p.hasArmor) w.push('armor');
  if (p.hasEmber) w.push('ember');
  if (p.hasBoss) w.push('boss');
  if (p.hasFrostling) w.push('frostling');
  if (p.hasBlimp) w.push('blimp');
  if (p.hasRegrow) w.push('regrow');
  if (p.hasFortified) w.push('fortified');
  return w;
}

export interface WaveRow { type: EnemyKind; camo: boolean; regrow: boolean; fortified: boolean; n: number; label: string }

/** Zeilen fuer den Reiter: gleiche (Typ, Camo, Regrow, Fortified) zusammengefasst, Reihenfolge der Sim bleibt (erstes Auftreten). */
export function waveRows(p: RoundPreview): WaveRow[] {
  const out: WaveRow[] = [];
  for (const g of p.groups) {
    if (g.n <= 0) continue;
    const rg = !!g.regrow, fo = !!g.fortified;
    const hit = out.find((r) => r.type === g.type && r.camo === g.camo && r.regrow === rg && r.fortified === fo);
    if (hit) hit.n += g.n;
    else out.push({ type: g.type, camo: g.camo, regrow: rg, fortified: fo, n: g.n, label: ENEMY_NAMES[g.type] ?? g.type });
  }
  return out;
}

/** Welche Runde zeigt der Reiter? Vor dem Start die naechste, waehrend der Welle die laufende; nach der letzten Runde der Karte nichts. */
export function previewRound(phase: string, round: number, maxRound: number, freeplay = false): number | null {
  if (phase === 'won' || phase === 'lost') return null;
  const r = phase === 'wave' ? round : round + 1;
  // Runde 15b: im Freeplay gibt es keine letzte Runde mehr (die Sim liefert auch Formel-Runden ab R121)
  return r >= 1 && (freeplay || r <= maxRound) ? r : null;
}

export const totalEnemies = (p: RoundPreview): number => p.groups.reduce((a, g) => a + Math.max(0, g.n), 0);
