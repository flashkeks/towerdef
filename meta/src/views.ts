/**
 * Sichtmodelle fuer die Meta-UI (Runde 7, P4): reine Funktionen `Profil -> JSON`, kein DOM, keine Texte ausser Zahlen und IDs.
 * Die UI (P4) holt sie ueber `Backend.playerView/collectionView/stageView/pullHistory` und uebersetzt in `en.ts`; der Server (M2) liefert dieselben Formen.
 * Besitzer: P4.
 */
import { UNIT_CATALOG, type Rarity } from './catalog';
import { evolutionView, type EvolutionView } from './evolution';
import { rerollCost, traitName, traitText } from './traits';
import { levelUpCost, MAX_UNIT_LEVEL } from './leveling';
import { MAX_PLAYER_LEVEL, unlockLevelFor, xpToReach } from './progression';
import { MAX_TEAM, type Profile } from './profile';
import { REWARD_TABLE, repeatCrystals } from './rewards';
import { copiesForNextStar, MAX_STARS, starsForCopies } from './stars';
import { damageBpOf, NEUTRAL_BP } from './unit-mods';
import { stageInfoView, type StageInfoView } from './world-view';
import { materialName } from './materials';
import { modeStage } from './mode-catalog';
import { modeDrops, scaleModeAmounts } from './modes';
import { stageWaveCap } from './worlds';

export interface PlayerView {
  displayName: string;
  level: number;
  maxLevel: number;
  xp: number;
  /** XP seit Beginn des aktuellen Levels und Spanne bis zum naechsten (0 auf Maximum) */
  xpIntoLevel: number;
  xpForNext: number;
  /** Fuellstand des Balkens 0..100 (ganzzahlig) */
  xpPct: number;
  crystals: number;
  gold: number;
  /** Runde 9 / P3: Raid-Marken (Raid-Shop) und Evolutions-Material (nur Mengen > 0) */
  raidMarks: number;
  materials: { id: string; name: string; count: number }[];
  starterGiftAvailable: boolean;
  team: string[];
  /** Zielgroesse des Teams: `min(MAX_TEAM, Anzahl besessener Units)`; 0 ohne Units */
  teamTarget: number;
  ownedCount: number;
}

export function playerView(p: Profile): PlayerView {
  const maxed = p.playerLevel >= MAX_PLAYER_LEVEL;
  const base = xpToReach(p.playerLevel);
  const span = maxed ? 0 : xpToReach(p.playerLevel + 1) - base;
  const into = Math.max(0, p.playerXp - base);
  const owned = Object.keys(p.units).length;
  return {
    displayName: p.displayName,
    level: p.playerLevel,
    maxLevel: MAX_PLAYER_LEVEL,
    xp: p.playerXp,
    xpIntoLevel: maxed ? 0 : into,
    xpForNext: span,
    xpPct: maxed ? 100 : span > 0 ? Math.min(100, Math.floor((into * 100) / span)) : 0,
    crystals: p.wallet.crystals,
    gold: p.wallet.gold,
    raidMarks: p.inventory.raidMarks,
    materials: Object.entries(p.inventory.materials).filter(([, n]) => n > 0).map(([id, count]) => ({ id, name: materialName(id), count })),
    starterGiftAvailable: !p.flags.starterGiftClaimed,
    team: [...p.team],
    teamTarget: Math.min(MAX_TEAM, owned),
    ownedCount: owned,
  };
}

export interface CollectionUnitView {
  unitId: string;
  /** Anzeigename (AA `nameRR`) */
  name: string;
  rarity: Rarity;
  /** entwickelte Form: nur ueber Evolution zu bekommen (Vorstufe) */
  evolvedFrom: string | null;
  /** Trait der besessenen Unit (Name mit Stufe, Wirkungstext) oder `null` */
  trait: { id: string; tier: number; name: string; text: string } | null;
  /** Crystals fuer einen Trait-Reroll (nach Seltenheit) */
  rerollCost: number | null;
  /** Evolution dieser Unit (Ziel, Kosten, Voraussetzungen, `ready`) oder `null` ohne Rezept */
  evolution: EvolutionView | null;
  owned: boolean;
  level: number;
  maxLevel: number;
  copies: number;
  stars: number;
  maxStars: number;
  /** Kopien insgesamt fuer den naechsten Stern (`null` auf Maximum oder nicht besessen) und wie viele noch fehlen */
  copiesForNextStar: number | null;
  copiesToNextStar: number | null;
  /** Gold fuer den naechsten Level (`null` auf Maximum oder nicht besessen) */
  levelUpCost: number | null;
  canLevelUp: boolean;
  /** Schadens-Faktor aus Level und Sternen in Basispunkten (10000 = x1) und als Zuwachs in Prozent (z. B. 17.5) */
  powerBp: number;
  powerBonusPct: number;
  inTeam: boolean;
}

/** Alle Units des Katalogs (auch nicht besessene), in Katalogreihenfolge; ausgeblendete (`support: hidden`) nur, wenn sie besessen werden. Neue Units erscheinen von selbst. */
export function collectionView(p: Profile): { units: CollectionUnitView[]; ownedCount: number; total: number } {
  const units = UNIT_CATALOG.filter((c) => !c.hidden || p.units[c.id]).map((c): CollectionUnitView => {
    const o = p.units[c.id];
    const common = {
      name: c.name,
      evolvedFrom: c.evolvedFrom,
      trait: o?.trait ? { id: o.trait.id, tier: o.trait.tier, name: traitName(o.trait), text: traitText(o.trait) } : null,
      rerollCost: rerollCost(c.id),
      evolution: evolutionView(c.id, p),
    };
    if (!o) {
      return { ...common, unitId: c.id, rarity: c.rarity, owned: false, level: 0, maxLevel: MAX_UNIT_LEVEL, copies: 0, stars: 0, maxStars: MAX_STARS, copiesForNextStar: null, copiesToNextStar: null, levelUpCost: null, canLevelUp: false, powerBp: NEUTRAL_BP, powerBonusPct: 0, inTeam: false };
    }
    const stars = starsForCopies(o.copies);
    const next = copiesForNextStar(stars);
    const cost = o.level >= MAX_UNIT_LEVEL ? null : levelUpCost(o.level);
    const powerBp = damageBpOf(o);
    return {
      ...common,
      unitId: c.id,
      rarity: c.rarity,
      owned: true,
      level: o.level,
      maxLevel: MAX_UNIT_LEVEL,
      copies: o.copies,
      stars,
      maxStars: MAX_STARS,
      copiesForNextStar: next,
      copiesToNextStar: next === null ? null : Math.max(0, next - o.copies),
      levelUpCost: cost,
      canLevelUp: cost !== null && p.wallet.gold >= cost,
      powerBp,
      powerBonusPct: Math.round(((powerBp - NEUTRAL_BP) / NEUTRAL_BP) * 1000) / 10,
      inTeam: p.team.includes(c.id),
    };
  });
  return { units, ownedCount: units.filter((u) => u.owned).length, total: units.length };
}

export interface StageDifficultyView {
  difficulty: string;
  unlocked: boolean;
  /** Spieler-Level, ab dem die Stufe spielbar ist (die UI schreibt daraus "Player level 5") */
  unlockLevel: number;
  /** Crystals fuer den Erst-Clear und fuer jede Wiederholung */
  firstClearCrystals: number;
  repeatCrystals: number;
  /** schon einmal gewonnen? Dann gibt es den Erst-Clear-Bonus nicht mehr */
  cleared: boolean;
  clears: number;
  bestWave: number;
  maxWaves: number;
  /** Runde 9 / P3: Legend Stage: Material dieses Siegs (Erst-Clear bzw. Wiederholung); Raid: Raid-Marken */
  materialDrop?: { id: string; name: string; amount: number };
  raidMarks?: number;
}

export interface StageViewData {
  stageId: string;
  playerLevel: number;
  difficulties: StageDifficultyView[];
  /** Runde 8 / P3: Welt/Act/Boss/Sperre der Stage; `null` fuer Stages ausserhalb der Weltstruktur (`standard20`) */
  info: StageInfoView | null;
}

export function stageView(p: Profile, stageId: string): StageViewData {
  const maxWaves = stageWaveCap(stageId);
  const difficulties = Object.keys(REWARD_TABLE.crystals.firstClear).map((d): StageDifficultyView => {
    const prog = p.stages[stageId]?.[d];
    const unlockLevel = unlockLevelFor(d);
    const mode = modeStage(stageId);
    const cleared = !!prog?.firstClearAt;
    const drops = mode ? modeDrops(mode, d, true, !cleared) : null;
    const matId = drops ? Object.keys(drops.materials)[0] : undefined;
    const first = mode ? scaleModeAmounts(mode.mode, { crystals: REWARD_TABLE.crystals.firstClear[d]!, gold: 0, xp: 0 }).crystals : REWARD_TABLE.crystals.firstClear[d]!;
    const repeat = mode ? scaleModeAmounts(mode.mode, { crystals: repeatCrystals(d), gold: 0, xp: 0 }).crystals : repeatCrystals(d);
    return {
      difficulty: d,
      unlocked: p.playerLevel >= unlockLevel,
      unlockLevel,
      firstClearCrystals: first,
      repeatCrystals: repeat,
      ...(matId ? { materialDrop: { id: matId, name: materialName(matId), amount: drops!.materials[matId]! } } : {}),
      ...(drops && drops.raidMarks > 0 ? { raidMarks: drops.raidMarks } : {}),
      cleared: !!prog?.firstClearAt,
      clears: prog?.clears ?? 0,
      bestWave: prog?.bestWave ?? 0,
      maxWaves,
    };
  });
  return { stageId, playerLevel: p.playerLevel, difficulties, info: stageInfoView(p, stageId) };
}

export interface HistoryEntry {
  id: string;
  bannerId: string;
  batchId: string;
  unitId: string;
  rarity: string;
  isNew: boolean;
  pityForced: 'top' | 'mid' | 'batch' | null;
  createdAt: string;
}

/** Die letzten `limit` Zuege, neueste zuerst. */
export function pullHistoryView(p: Profile, limit = 30): HistoryEntry[] {
  const n = Math.max(0, Math.floor(limit));
  return (n === 0 ? [] : p.pullHistory.slice(-n))
    .reverse()
    .map((r) => ({ id: r.id, bannerId: r.bannerId, batchId: r.batchId, unitId: r.unitId, rarity: r.rarity, isNew: r.isNew, pityForced: r.pityForced, createdAt: r.createdAt }));
}
