/**
 * Sichtmodelle der Meta-UI (Runde 7, P4): reine Funktionen ohne DOM, damit sie sich testen lassen und keine Unit-Liste fest verdrahtet ist.
 * Alles, was angezeigt wird, kommt vom Backend (`playerView`, `collectionView`, `bannerViews`, `stageView`) oder aus den Sim-Daten (`UnitDef`).
 * Texte nur ueber `en.ts` (`t`); wo es keinen Eintrag gibt (neue Unit, unbekannter Fehlercode), greift ein lesbarer Ersatz.
 */
import { hasKey, t } from '../i18n/t';
import type { BannerView, CollectionUnitView, MatchReward, PlayerView, StageDifficultyView } from '../backend/meta';
import type { UnitDef } from '../sim';
import { initials, registeredUnitName } from '../view/model';
import { unitCatalog } from './unit-defs';

// ---- Namen und Fehler ------------------------------------------------------------------------------------------------

const capitalize = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Anzeigename einer Unit; unbekannte IDs (neue Units ohne Text) erscheinen mit grossem Anfangsbuchstaben statt als Schluessel. */
/** Name aus den Unit-Daten; der Katalog (`unit-defs.ts`) wird beim ersten Zugriff gebaut und registriert alle Namen und Farben. */
const dataName = (id: string): string | null => registeredUnitName(id) ?? (unitCatalog(), registeredUnitName(id));
export const unitName = (id: string): string => (hasKey(`unit.${id}.name`) ? t(`unit.${id}.name`) : (dataName(id) ?? capitalize(id)));
export const unitAbbr = (id: string): string => {
  const n = dataName(id);
  return n ? initials(n) : id.slice(0, 3).toUpperCase();
};
export const rarityName = (r: string): string => (hasKey(`rarity.${r}`) ? t(`rarity.${r}`) : capitalize(r));

/** Fehlertext fuer einen Backend-Fehler: eigener Text zu `err.CODE`, sonst die englische `message` des Backends, sonst ein allgemeiner Satz. */
export function errorText(f: { code: string; message?: string }): string {
  const key = `err.${f.code}`;
  if (hasKey(key)) return t(key);
  return f.message && f.message !== f.code ? f.message : t('err.generic');
}

// ---- Seltenheit, Rolle, Filter ---------------------------------------------------------------------------------------

export const RARITY_ORDER = ['rare', 'epic', 'legendary', 'mythic', 'secret', 'exclusive'] as const;
/** Rang fuer Sortierung und Animation; unbekannte Seltenheit zaehlt wie die niedrigste. */
export const rarityRank = (r: string): number => Math.max(0, RARITY_ORDER.indexOf(r as (typeof RARITY_ORDER)[number]));

export type RoleCat = 'single' | 'area' | 'support' | 'economy' | 'control' | 'boss';
export const ROLE_CATS: readonly RoleCat[] = ['single', 'area', 'control', 'boss', 'support', 'economy'];

/** Rolle aus den Sim-Daten (nicht je Unit hart codiert; `UnitDef.role`): Farm = Wirtschaft, Kontroll-Effekt (Stun, Slow, Knockback ...) = Kontrolle, Flaechenangriff = Flaeche, sonst Einzelziel. */
export function roleCat(def: UnitDef): RoleCat {
  if (def.farm) return 'economy';
  if (def.role === 'control') return 'control';
  const k = def.levels[def.levels.length - 1]?.attack?.kind;
  if (k === 'circle' || k === 'line' || k === 'cone' || k === 'full') return 'area';
  return 'single';
}

export type PlacementCat = 'ground' | 'hill' | 'hybrid';
export const PLACEMENT_CATS: readonly PlacementCat[] = ['ground', 'hill', 'hybrid'];

export interface UnitFilter {
  rarity: string | null;
  role: RoleCat | null;
  placement: string | null;
  /** nur Besessene */
  ownedOnly?: boolean;
}

export const NO_FILTER: UnitFilter = { rarity: null, role: null, placement: null };

/** Filter anwenden. Units ohne Sim-Definition (neue Unit, Daten noch nicht geladen) fallen nur durch Rolle/Platzierung, nicht durch Seltenheit. */
export function filterUnits(units: readonly CollectionUnitView[], defs: ReadonlyMap<string, UnitDef>, f: UnitFilter): CollectionUnitView[] {
  return units.filter((u) => {
    if (f.ownedOnly && !u.owned) return false;
    if (f.rarity && u.rarity !== f.rarity) return false;
    const d = defs.get(u.unitId);
    if (f.role && (!d || roleCat(d) !== f.role)) return false;
    if (f.placement && (!d || d.placement !== f.placement)) return false;
    return true;
  });
}

/** Besessene zuerst, dann hoehere Seltenheit zuerst; sonst Katalogreihenfolge (stabil). */
export function sortUnits(units: readonly CollectionUnitView[]): CollectionUnitView[] {
  return units
    .map((u, i) => ({ u, i }))
    .sort((a, b) => Number(b.u.owned) - Number(a.u.owned) || rarityRank(b.u.rarity) - rarityRank(a.u.rarity) || a.i - b.i)
    .map((x) => x.u);
}

/** Sterne als Text: `★★☆☆☆` (gefuellt/leer). */
export const starsText = (stars: number, max: number): string => '★'.repeat(Math.max(0, stars)) + '☆'.repeat(Math.max(0, max - stars));

/** Zeile "Copies 2 / 4 for the next star" bzw. Maximum. */
export function copiesLine(u: CollectionUnitView): string {
  if (!u.owned) return t('units.notOwned');
  if (u.copiesForNextStar === null) return t('units.copies.max', { n: u.copies });
  return t('units.copies', { n: u.copies, next: u.copiesForNextStar, star: u.stars + 1 });
}

// ---- Summon ----------------------------------------------------------------------------------------------------------

/** Banner, die zur Auswahl stehen: aktive, nicht verbrauchte (Starter nur solange verfuegbar); Standard zuerst. */
export function selectableBanners(views: readonly BannerView[]): BannerView[] {
  return views
    .filter((v) => v.status === 'ok')
    .map((v, i) => ({ v, i }))
    .sort((a, b) => Number(b.v.kind === 'standard') - Number(a.v.kind === 'standard') || a.i - b.i)
    .map((x) => x.v);
}

/** Knopftext: "Pull x10 · Mythic pity 37/150" (Pity der obersten Stufe, wenn der Banner eine hat), sonst "Pull x10". */
export function pullButtonText(v: BannerView, count: 1 | 10): string {
  const top = v.pity.find((p) => p.kind === 'top');
  if (!top) return t('summon.pull', { n: count });
  return t('summon.pull.pity', { n: count, rarity: rarityName(top.rarity), cur: top.current, max: top.hardAt });
}

export interface PullOption {
  count: 1 | 10;
  cost: number;
  text: string;
}

/** Welche Zuege der Banner anbietet (Starter nur 10er), mit Preis aus dem Banner (die UI rechnet keine Preise). */
export function pullOptions(v: BannerView): PullOption[] {
  const out: PullOption[] = [];
  if (v.prices.single !== null) out.push({ count: 1, cost: v.prices.single, text: pullButtonText(v, 1) });
  if (v.prices.ten !== null) out.push({ count: 10, cost: v.prices.ten, text: pullButtonText(v, 10) });
  return out;
}

export interface RevealStyle {
  /** Verzoegerung zwischen zwei Karten in ms */
  stepMs: number;
  /** Zusatzzeit fuer den Blitz bei hohen Seltenheiten */
  flashMs: number;
  /** CSS-Klasse der Stufe */
  cls: string;
}

/** Enthuellung je Seltenheit: kurz (hoechstens ca. 2 s fuer 10 Zuege samt Blitz), hoehere Stufen bekommen Blitz und laengere Pause. */
export function revealStyle(rarity: string): RevealStyle {
  const r = rarityRank(rarity);
  return { stepMs: [110, 140, 200, 260][r]!, flashMs: [0, 0, 350, 600][r]!, cls: `r-${RARITY_ORDER[r]}` };
}

/** Gesamtdauer der Animation fuer eine Liste von Seltenheiten (fuer den Timer "fertig"). */
export function revealDuration(rarities: readonly string[]): number {
  let at = 0;
  let flash = 0;
  for (const r of rarities) {
    const s = revealStyle(r);
    at += s.stepMs;
    flash = Math.max(flash, s.flashMs);
  }
  return at + flash + 500;
}

// ---- Team ------------------------------------------------------------------------------------------------------------

/** Auswahl umschalten: abwaehlen geht immer, hinzufuegen nur besessene Units und nur bis `target`. */
export function toggleTeam(team: readonly string[], unitId: string, owned: ReadonlySet<string>, target: number): string[] {
  if (team.includes(unitId)) return team.filter((x) => x !== unitId);
  if (!owned.has(unitId) || team.length >= target) return [...team];
  return [...team, unitId];
}

/** Gespeichertes Team bereinigen: nur Besessene, ohne Duplikate, hoechstens `target`. */
export function cleanTeam(team: readonly string[], owned: ReadonlySet<string>, target: number): string[] {
  return [...new Set(team)].filter((u) => owned.has(u)).slice(0, target);
}

export const teamComplete = (team: readonly string[], target: number): boolean => target > 0 && team.length === target;

// ---- Stage -----------------------------------------------------------------------------------------------------------

export interface StageCardView {
  difficulty: string;
  locked: boolean;
  /** Grund, wenn gesperrt ("Player level 5") */
  lockText: string | null;
  /** Belohnung: "First clear: 100 crystals" oder, nach dem Erst-Clear, "Repeat: 25 crystals" */
  rewardText: string;
  bestText: string;
  cleared: boolean;
}

export function stageCardView(d: StageDifficultyView): StageCardView {
  return {
    difficulty: d.difficulty,
    locked: !d.unlocked,
    lockText: d.unlocked ? null : t('stage.locked', { level: d.unlockLevel }),
    rewardText: d.cleared ? t('stage.reward.repeat', { n: d.repeatCrystals }) : t('stage.reward.first', { n: d.firstClearCrystals }),
    bestText: d.bestWave > 0 ? t('stage.best', { wave: d.bestWave, max: d.maxWaves }) : t('stage.best.none'),
    cleared: d.cleared,
  };
}

// ---- Belohnung -------------------------------------------------------------------------------------------------------

export interface RewardLine {
  kind: 'crystals' | 'gold' | 'xp';
  value: number;
  text: string;
}

export interface RewardView {
  lines: RewardLine[];
  firstClear: boolean;
  /** neues Spieler-Level, wenn aufgestiegen */
  levelUp: number | null;
  /** nur Niederlage ohne Crystals: Hinweis, dass Gold und XP trotzdem gezaehlt haben */
  consolation: boolean;
}

export function rewardView(r: MatchReward, won: boolean): RewardView {
  const lines: RewardLine[] = [];
  if (r.crystals > 0) lines.push({ kind: 'crystals', value: r.crystals, text: t('reward.crystals', { n: r.crystals }) });
  lines.push({ kind: 'gold', value: r.gold, text: t('reward.gold', { n: r.gold }) });
  lines.push({ kind: 'xp', value: r.xp, text: t('reward.xp', { n: r.xp }) });
  return { lines, firstClear: r.firstClear, levelUp: r.levelsGained > 0 ? r.playerLevel : null, consolation: !won };
}

// ---- Kopfzeile -------------------------------------------------------------------------------------------------------

export interface WalletView {
  crystals: string;
  gold: string;
  level: string;
  xp: string;
  xpPct: number;
}

const fmt = (n: number): string => n.toLocaleString('en-US');

export function walletView(p: PlayerView): WalletView {
  return {
    crystals: fmt(p.crystals),
    gold: fmt(p.gold),
    level: t('wallet.level', { n: p.level }),
    xp: p.xpForNext > 0 ? t('wallet.xp', { cur: fmt(p.xpIntoLevel), max: fmt(p.xpForNext) }) : t('wallet.xp.max'),
    xpPct: p.xpPct,
  };
}
