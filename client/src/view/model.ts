/**
 * Reine Abbildung Sim-Zustand -> Anzeige. Keine Spielregeln, kein DOM, kein Pixi: gut testbar.
 * Alles, was hier "gerechnet" wird, ist Darstellung (Sekunden statt Ticks, Farben, Kuerzel).
 */
import { t } from '../i18n/t';
import type { EnemyState, SimState, UnitDef, UnitState, WavePreview } from '../sim';

export const TICKS_PER_SECOND = 20;
export const TICK_MS = 1000 / TICKS_PER_SECOND;

/** Ticks -> ganze Sekunden, aufgerundet (Countdown zeigt nie 0 vor dem Ereignis). */
export const ticksToSeconds = (ticks: number): number => Math.max(0, Math.ceil(ticks / TICKS_PER_SECOND));

export interface HudModel {
  coins: number;
  lives: number;
  maxLives: number;
  livesRatio: number;
  wave: number;
  totalWaves: number;
  phase: SimState['phase'];
  /** Sekunden bis zur naechsten Welle (Prep oder Wellen-Timer), null wenn keine mehr kommt. */
  countdownSeconds: number | null;
  /** Nummer der Welle, die der Startknopf ausloest, null wenn es keine mehr gibt. */
  nextWave: number | null;
  canStartWave: boolean;
  finalWave: boolean;
}

export function hudModel(state: SimState, totalWaves: number, waveTimerTicks: number, player = 0): HudModel {
  const over = state.phase === 'over';
  const nextWave = over ? null : state.phase === 'prep' ? 1 : state.wave < totalWaves ? state.wave + 1 : null;
  let countdown: number | null = null;
  if (!over) {
    if (state.phase === 'prep') countdown = ticksToSeconds(state.prepTicksLeft);
    else if (state.waveOpen && nextWave !== null) countdown = ticksToSeconds(waveTimerTicks - state.waveTimer);
  }
  return {
    coins: state.players[player]?.coins ?? 0,
    lives: state.lives,
    maxLives: state.maxLives,
    livesRatio: state.maxLives > 0 ? Math.max(0, Math.min(1, state.lives / state.maxLives)) : 0,
    wave: state.wave,
    totalWaves,
    phase: state.phase,
    countdownSeconds: countdown,
    nextWave,
    canStartWave: nextWave !== null,
    finalWave: !over && state.phase === 'wave' && state.wave >= totalWaves,
  };
}

// ---- Gegner ------------------------------------------------------------------------------------------------------

export type ShapeKind = 'circle' | 'triangle' | 'square' | 'diamond' | 'split' | 'hex';

export interface EnemyStyle {
  shape: ShapeKind;
  /** Hauptfarbe (Palette: Schatten-Rampe, art-styleguide §4). */
  color: number;
  /** Radius in Tiles. */
  radius: number;
}

const ENEMY_STYLES: Record<string, EnemyStyle> = {
  grunt: { shape: 'circle', color: 0x6a3fa0, radius: 0.3 },
  runner: { shape: 'triangle', color: 0xa67ae0, radius: 0.26 },
  brute: { shape: 'square', color: 0x3a2260, radius: 0.38 },
  flyer: { shape: 'diamond', color: 0x6a3fa0, radius: 0.3 },
  splitter: { shape: 'split', color: 0x6a3fa0, radius: 0.32 },
  splitter_child: { shape: 'split', color: 0x6a3fa0, radius: 0.18 },
  elite: { shape: 'square', color: 0x3a2260, radius: 0.5 },
  boss: { shape: 'hex', color: 0x3a2260, radius: 0.85 },
};

export const enemyStyle = (type: string): EnemyStyle => ENEMY_STYLES[type] ?? { shape: 'circle', color: 0x8a90a6, radius: 0.3 };

// ---- Units -------------------------------------------------------------------------------------------------------

/** Farbe je AA-Element (Fallback-Figur, Portrait-Abzeichen, Schussfarbe). */
export const ELEMENT_COLORS: Record<string, number> = {
  dark: 0x8a5ac8,
  fire: 0xff7a3c,
  lightning: 0xf5d742,
  ice: 0x9ad8f0,
  air: 0x7fe0b8,
  light: 0xffeea0,
  water: 0x4a90e0,
  rose: 0xe86a9a,
};
const TYPE_COLORS: Record<string, number> = { physical: 0xc3c7d6, magic: 0xa67ae0, true: 0xf1f2f7 };

/** Initialen aus dem Namen ("Vengeful Swordsman" -> "VS"; ein Wort: die ersten beiden Buchstaben). */
export function initials(name: string): string {
  const w = name.split(/[\s\-_:()]+/).filter((x) => /[A-Za-z0-9]/.test(x));
  if (w.length === 0) return '?';
  return (w.length === 1 ? w[0].slice(0, 2) : w[0][0] + w[1][0]).toUpperCase();
}

const colorCache = new Map<string, number>();
const nameCache = new Map<string, string>();
const seriesCache = new Map<string, string>();

/** Anzeigename aus den Unit-Daten (`UnitDef.name`); unbekannte ID: `null`. */
export const registeredUnitName = (id: string): string | null => nameCache.get(id) ?? null;
/** Serie aus den Unit-Daten (`UnitDef.series`, Runde 10 / P1); unbekannt oder ohne Serie: `null`. */
export const registeredUnitSeries = (id: string): string | null => seriesCache.get(id) ?? null;

/** Farbe einer Unit aus ihren Daten (erstes Element, sonst Damage-Typ). Wird beim Aufbau der Kataloge registriert; unbekannte IDs bekommen eine stabile Farbe aus der ID. */
export function registerUnitColors(defs: readonly Pick<UnitDef, 'id' | 'name' | 'series' | 'elements' | 'damageType'>[]): void {
  for (const d of defs) {
    colorCache.set(d.id, ELEMENT_COLORS[d.elements[0]] ?? TYPE_COLORS[d.damageType] ?? 0xc3c7d6);
    nameCache.set(d.id, d.name);
    if (d.series) seriesCache.set(d.id, d.series);
  }
}

export function unitColor(id: string): number {
  const hit = colorCache.get(id);
  if (hit !== undefined) return hit;
  let x = 0;
  for (let i = 0; i < id.length; i++) x = (Math.imul(x, 31) + id.charCodeAt(i)) >>> 0;
  const h = (x % 360) / 60;
  const c = 0.55;
  const m = 0.35;
  const f = (k: number): number => Math.round((m + c * Math.max(0, Math.min(1, Math.abs(((h + k) % 6) - 3) - 1))) * 255);
  return (f(0) << 16) | (f(4) << 8) | f(2);
}

/** Verkaufserloes zur Anzeige. Maßgeblich ist die Sim: das `sell`-Event meldet den tatsaechlichen Betrag (Test vergleicht beide). */
export const sellPreview = (def: UnitDef, u: UnitState): number => Math.floor((u.invested * def.sellBp) / 10000);

// ---- Statuszeichen (Runde 8: Effekte sichtbar machen) --------------------------------------------------------------

type StatusView = Pick<EnemyState, 'armor' | 'regen' | 'slowTicks' | 'stunTicks' | 'uncTicks' | 'backTicks' | 'dots' | 'physTakenBp' | 'magicTakenBp'>;

/** Kurzzeichen am Lebensbalken: A Rüstung, + Regen, ~ Slow, ! Stun/Freeze/bewusstlos, < läuft rückwärts, F Burn, B Bleed, P Poison, W Wither, C verwundbar (Curse/Hex/Dismember). */
export function statusMarks(e: StatusView): string {
  const has = (k: string): boolean => e.dots.some((d) => d.kind === k);
  return `${e.armor > 0 ? 'A' : ''}${e.regen ? '+' : ''}${e.slowTicks > 0 ? '~' : ''}${e.stunTicks > 0 || e.uncTicks > 0 ? '!' : ''}${e.backTicks > 0 ? '<' : ''}${has('burn') ? 'F' : ''}${has('bleed') ? 'B' : ''}${has('poison') ? 'P' : ''}${has('wither') ? 'W' : ''}${e.physTakenBp > 0 || e.magicTakenBp > 0 ? 'C' : ''}`;
}

/** Tönung der Figur nach dem wichtigsten Zustand (Burn orange, Gift grün, Blutung rot, Slow/Freeze blau, verwundbar violett). */
export function statusTint(e: StatusView): number {
  if (e.stunTicks > 0) return 0xbfe6ff;
  if (e.dots.some((d) => d.kind === 'burn')) return 0xff9a6a;
  if (e.dots.some((d) => d.kind === 'poison')) return 0x9aff8a;
  if (e.dots.some((d) => d.kind === 'bleed')) return 0xff7a8a;
  if (e.slowTicks > 0) return 0x9ac8ff;
  if (e.physTakenBp > 0 || e.magicTakenBp > 0) return 0xd0a8ff;
  return 0xffffff;
}

// ---- Modifier, Vorschau ------------------------------------------------------------------------------------------

export interface ModifierLabel {
  key: string;
  params?: { n: number };
}

/** "shield:2" -> { key: 'modifier.shield', params: {n: 2} }, "regen" -> { key: 'modifier.regen' }. */
export function modifierLabel(m: string): ModifierLabel {
  const [kind, n] = m.split(':');
  return n !== undefined ? { key: `modifier.${kind}`, params: { n: Number(n) } } : { key: `modifier.${kind}` };
}

export interface PreviewRow {
  type: string;
  count: number;
  modifiers: ModifierLabel[];
  element: number;
  flying: boolean;
  boss: boolean;
  elite: boolean;
}

export interface PreviewModel {
  wave: number;
  rows: PreviewRow[];
  enemyCount: number;
  /** Gesamt-HP in ganzen HP (die Sim rechnet in Centi-HP). */
  totalHp: number;
  boss: boolean;
  elite: boolean;
  bossKit: WavePreview['bossKit'];
  cardAllowed: boolean;
  card: string | null;
}

export function previewModel(p: WavePreview): PreviewModel {
  return {
    wave: p.wave,
    rows: p.groups.map((g) => ({
      type: g.type,
      count: g.count,
      modifiers: g.modifiers.map(modifierLabel),
      element: g.element,
      flying: g.flying,
      boss: g.boss,
      elite: g.elite,
    })),
    enemyCount: p.enemyCount,
    totalHp: Math.round(p.poolHpCenti / 100),
    boss: p.boss,
    elite: p.elite,
    bossKit: p.bossKit,
    cardAllowed: p.cardAllowed,
    card: p.card,
  };
}

/** Lebensbalken-Farbe: gruen, unter 30 % rot (art-styleguide §6). */
export const hpBarColor = (ratio: number): number => (ratio < 0.3 ? 0xd8344a : 0x4e8a45);

export const enemyHpRatio = (e: Pick<EnemyState, 'hp' | 'maxHp'>): number => (e.maxHp > 0 ? Math.max(0, Math.min(1, e.hp / e.maxHp)) : 0);

/** Kompakte Zahl fuer grosse HP-Summen: 1234 -> "1.2k". */
export function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ---- Gegner-Anzeigenamen der Stage (Runde 8 / P3) -----------------------------------------------------------------------------

let stageRoster: Record<string, string> = {};
let stageBossName: string | null = null;

/** Merkt sich die Anzeigenamen der Stage (`stage.roster`, `stage.bossName`); Standard-Stage ohne Eintraege -> englische Standardnamen. */
export function registerStageNames(stage: { roster?: Record<string, string>; bossName?: string }): void {
  stageRoster = stage.roster ?? {};
  stageBossName = stage.bossName ?? null;
}

/** Anzeigename eines Gegnertyps: Name der Welt (AA-Name), sonst `enemy.<typ>.name`. */
export function enemyName(type: string): string {
  if (type === 'boss' && stageBossName) return stageBossName;
  return stageRoster[type] ?? t(`enemy.${type}.name`);
}

/** Name des Bosses in Banner und Vorschau: AA-Name der Stage, sonst Name des Kits. */
export const bossDisplayName = (kitName: string): string => stageBossName ?? kitName;
