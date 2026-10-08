/**
 * Belohnungen der Legend Stages und Raids (Runde 9 / P3). Reine Funktionen auf dem Profil; aufgerufen aus `rewardForMatch` (rewards.ts),
 * also nur mit einem nachgerechneten Replay. Daten: `data/modes.json`, Material: `data/materials.json`, Raids: `sim/data/modes/raids.json`.
 *
 * Legend Stage: Crystals/Gold/XP wie ein Story-Act mal Faktor; beim Sieg zusaetzlich Material (Menge aus dem Act, mal Stufen-Faktor),
 * Erst-Clear (je Stage und Stufe) gibt die grosse Menge, Wiederholung die kleine.
 * Raid: kleinere Crystals/Gold/XP; beim Sieg Raid-Marken (mal Stufen-Faktor, beim Erst-Clear zusaetzlich `firstClearMarks`).
 *       Meilensteine zaehlen alle Siege des Raids (alle Acts, alle Stufen): `milestones` einmalig, garantierte Unit bei `guarantee.clears`.
 */
import { UNIT_CATALOG } from './catalog';
import type { MetaEnv } from './env';
import { applyInventory } from './inventory';
import { book, KIND } from './ledger';
import { modeById } from './mode-catalog';
import type { Profile } from './profile';
import { fail, type Fail } from './result';
import { starsForCopies } from './stars';
import modesJson from '../data/modes.json';
import type { ModeStageInfo } from '../../sim/src/index';

interface Milestone {
  clears: number;
  crystals?: number;
  marks?: number;
}
export const MODE_TABLE = modesJson as unknown as {
  difficultyBp: Record<string, number>;
  legend: { crystalsBp: number; goldBp: number; xpBp: number };
  raid: { crystalsBp: number; goldBp: number; xpBp: number; firstClearMarks: number; milestones: Milestone[] };
};

const bp = (v: number, f: number): number => Math.floor((v * f + 5000) / 10000);

/** Crystals/Gold/XP eines Modus-Laufs aus den Story-Werten. */
export function scaleModeAmounts(kind: 'legend' | 'raid', a: { crystals: number; gold: number; xp: number }): { crystals: number; gold: number; xp: number } {
  const t = MODE_TABLE[kind];
  return { crystals: bp(a.crystals, t.crystalsBp), gold: bp(a.gold, t.goldBp), xp: bp(a.xp, t.xpBp) };
}

/** Material und Raid-Marken eines Sieges (Verlust: nichts). */
export function modeDrops(m: ModeStageInfo, difficulty: string, win: boolean, firstClear: boolean): { materials: Record<string, number>; raidMarks: number } {
  const none = { materials: {}, raidMarks: 0 };
  if (!win) return none;
  const f = MODE_TABLE.difficultyBp[difficulty] ?? 10000;
  if (m.mode === 'legend' && m.drop) {
    const n = bp(firstClear ? m.drop.first : m.drop.repeat, f);
    return { materials: n > 0 ? { [m.drop.material]: n } : {}, raidMarks: 0 };
  }
  if (m.mode === 'raid') return { materials: {}, raidMarks: bp(m.marks, f) + (firstClear ? MODE_TABLE.raid.firstClearMarks : 0) };
  return none;
}

/** Eine Unit gutschreiben: neu (Stufe 1) oder Kopie +1. */
export function grantUnit(p: Profile, unitId: string, env: Pick<MetaEnv, 'now'>): { profile: Profile; isNew: boolean } | Fail {
  if (!UNIT_CATALOG.some((u) => u.id === unitId)) return fail('unknown-unit', `Unknown unit ${unitId}.`);
  const owned = p.units[unitId];
  const units = { ...p.units };
  if (owned) {
    const copies = owned.copies + 1;
    units[unitId] = { ...owned, copies, stars: starsForCopies(copies) };
  } else {
    units[unitId] = { level: 1, xp: 0, copies: 1, stars: starsForCopies(1), firstObtainedAt: env.now() };
  }
  return { profile: { ...p, units }, isNew: !owned };
}

/** Siege eines Raids ueber alle Acts und Stufen. */
export function raidClears(p: Profile, raidId: string): number {
  const raid = modeById('raid', raidId);
  if (!raid) return 0;
  let n = 0;
  for (const a of raid.acts) for (const d of Object.values(p.stages[a.stageId] ?? {})) n += d.clears;
  return n;
}

export const raidMilestoneFlag = (raidId: string, clears: number): string => `raidms:${raidId}:${clears}`;
export const raidUnitFlag = (raidId: string): string => `raidunit:${raidId}`;

export interface MilestoneResult {
  clears: number;
  crystals: number;
  raidMarks: number;
}

/** Meilensteine und garantierte Unit eines Raids nach einem Sieg; jeder genau einmal (Flags im Profil, Buchung mit fester Referenz). */
export function applyRaidMilestones(p: Profile, raidId: string, env: Pick<MetaEnv, 'now'>): { profile: Profile; milestones: MilestoneResult[]; unit: { id: string; isNew: boolean } | null } | Fail {
  const raid = modeById('raid', raidId);
  if (!raid) return { profile: p, milestones: [], unit: null };
  const total = raidClears(p, raidId);
  let cur = p;
  const milestones: MilestoneResult[] = [];
  for (const m of MODE_TABLE.raid.milestones) {
    const flag = raidMilestoneFlag(raidId, m.clears);
    if (total < m.clears || cur.flags[flag]) continue;
    cur = { ...cur, flags: { ...cur.flags, [flag]: true } };
    if (m.crystals) {
      const b = book(cur, { currency: 'crystals', delta: m.crystals, kind: KIND.reward, refType: 'raid-milestone', refId: `${raidId}:${m.clears}` }, env);
      if (!b.ok) return b;
      cur = b.profile;
    }
    if (m.marks) {
      const inv = applyInventory(cur, { raidMarks: m.marks });
      if (!inv.ok) return inv;
      cur = inv.profile;
    }
    milestones.push({ clears: m.clears, crystals: m.crystals ?? 0, raidMarks: m.marks ?? 0 });
  }
  let unit: { id: string; isNew: boolean } | null = null;
  const g = raid.guarantee;
  if (g && total >= g.clears && !cur.flags[raidUnitFlag(raidId)]) {
    const gu = grantUnit(cur, g.unit, env);
    if (!('profile' in gu)) return gu;
    cur = { ...gu.profile, flags: { ...gu.profile.flags, [raidUnitFlag(raidId)]: true } };
    unit = { id: g.unit, isNew: gu.isNew };
  }
  return { profile: cur, milestones, unit };
}
