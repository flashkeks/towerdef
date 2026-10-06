/**
 * Reine Abbildung Sim-Zustand -> Anzeige. Keine Spielregeln, kein DOM, kein Pixi: gut testbar.
 * Alles, was hier "gerechnet" wird, ist Darstellung (Sekunden statt Ticks, Farben, Kuerzel).
 */
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

const UNIT_COLORS: Record<string, number> = {
  striker: 0xf07a2a,
  gunner: 0x4a86d8,
  blaster: 0xff9a3c,
  banner: 0xf5c542,
  farm: 0x8ab85a,
  lancer: 0x2c4a8a,
  frost: 0x9ad8f0,
  titan: 0x59607a,
};
export const unitColor = (id: string): number => UNIT_COLORS[id] ?? 0xc3c7d6;

/** Verkaufserloes zur Anzeige. Maßgeblich ist die Sim: das `sell`-Event meldet den tatsaechlichen Betrag (Test vergleicht beide). */
export const sellPreview = (def: UnitDef, u: UnitState): number => Math.floor((u.invested * def.sellBp) / 10000);

/** Verbleibende Abklingzeit einer Fertigkeit in Sekunden (0 = bereit). */
export const abilitySeconds = (u: UnitState): number => ticksToSeconds(u.abilityCd);

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
