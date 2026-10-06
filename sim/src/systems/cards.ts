/**
 * Risikokarten (P4, K1): Karte wählen, Wirkung auf die Gruppen einer Wave, Wellenvorschau.
 * Die Vorschau benutzt dieselben Funktionen wie der Wave-Start (`applyCardToGroup`, `enemyStats`), damit beide nie auseinanderlaufen.
 */
import { parseModifier, type Ctx } from '../data/compile.js';
import { mulBp } from '../fixed.js';
import type { SimState } from '../state.js';
import { getWave, type GenGroup } from './infinite.js';
import { enemyStats } from './spawn.js';

/** Nummer der nächsten zu startenden Wave (Prep: 1). */
export const nextWaveNumber = (state: Pick<SimState, 'phase' | 'wave'>): number => (state.phase === 'prep' ? 1 : state.wave + 1);

/** Enthält Wave n einen Boss (Archetyp-Flag)? Auf Boss-Waves sind keine Karten erlaubt. */
export function waveHasBoss(ctx: Ctx, n: number): boolean {
  return getWave(ctx, n).groups.some((g) => ctx.enemies[g.type].boss);
}

/** Anzahl und Modifier einer Gruppe nach Karte. Boss/Elite-Gruppen bleiben bei Anzahl und Modifiern unberührt. */
export function applyCardToGroup(ctx: Ctx, g: GenGroup, cardId: string | null): { count: number; modifiers: string[] } {
  const card = cardId ? ctx.cards[cardId] : undefined;
  const def = ctx.enemies[g.type];
  if (!card || def.boss || def.elite) return { count: g.count, modifiers: g.modifiers };
  const count = Math.floor((g.count * card.countBp + 9999) / 10000);
  const have = new Set(g.modifiers.map((m) => parseModifier(m).kind));
  const modifiers = [...g.modifiers];
  for (const m of card.addModifiers) {
    const k = parseModifier(m).kind;
    if (!have.has(k)) {
      have.add(k);
      modifiers.push(m);
    }
  }
  return { count, modifiers };
}

/** Lebenskosten eines Leaks nach Karte (Faktor leakBp, mindestens 1). */
export function cardLeakCost(ctx: Ctx, cost: number, cardId: string | null): number {
  const card = cardId ? ctx.cards[cardId] : undefined;
  return card && card.leakBp !== 10000 ? Math.max(1, mulBp(cost, card.leakBp)) : cost;
}

export interface WavePreviewGroup {
  type: string;
  count: number;
  modifiers: string[];
  element: number;
  flying: boolean;
  boss: boolean;
  elite: boolean;
  /** Max-HP je Gegner dieser Gruppe in Centi-HP (inkl. Stufe, Koop, Karte). */
  hpCenti: number;
  /** Gegner, die beim Tod eines Gegners dieser Gruppe entstehen (Splitter). */
  childType: string | null;
  childCount: number;
}

export interface WavePreview {
  wave: number;
  boss: boolean;
  elite: boolean;
  /** Boss-Kit der Wave (Kit-ID, Name, Phasenzahl, Namen der aktiven Fähigkeiten dieser Stufe) oder null. */
  bossKit: { id: string; name: string; phases: number; abilities: string[] } | null;
  groups: WavePreviewGroup[];
  /** Summe der Gruppen-Anzahlen (ohne Splitter-Kinder und Beschwörungen des Bosses). */
  enemyCount: number;
  /** HP-Summe aller Gegner inkl. Splitter-Kindern (Centi-HP, ohne Beschwörungen). */
  poolHpCenti: number;
  /** Karte, unter der diese Wave steht (gewählte Karte, wenn sie die nächste Wave ist) oder null. */
  card: string | null;
  /** Darf für diese Wave eine Karte gewählt werden (Boss-Waves: nein)? */
  cardAllowed: boolean;
}

/** Wellenvorschau (K1): reine Daten, ändert den Zustand nicht. `cardId` = hypothetische Karte; Standard: die gewählte Karte der nächsten Wave. */
export function previewWave(ctx: Ctx, state: Pick<SimState, 'phase' | 'wave' | 'nextCard'>, n: number, cardId?: string | null): WavePreview | null {
  if (!Number.isInteger(n) || n < 1 || n > ctx.totalWaves) return null;
  const wave = getWave(ctx, n);
  const boss = waveHasBoss(ctx, n);
  const card = boss ? null : cardId !== undefined ? cardId : n === nextWaveNumber(state) ? state.nextCard : null;
  let enemyCount = 0;
  let pool = 0;
  let elite = false;
  const groups: WavePreviewGroup[] = wave.groups.map((g) => {
    const def = ctx.enemies[g.type];
    const eff = applyCardToGroup(ctx, g, card);
    const { maxHp } = enemyStats(ctx, g.type, n, card);
    enemyCount += eff.count;
    pool += maxHp * eff.count;
    if (def.elite) elite = true;
    if (def.child) pool += enemyStats(ctx, def.child.type, n, card).maxHp * def.child.count * eff.count;
    return {
      type: g.type,
      count: eff.count,
      modifiers: eff.modifiers,
      element: ctx.difficulty.elementsActive ? g.element : 0,
      flying: def.flying,
      boss: def.boss,
      elite: def.elite,
      hpCenti: maxHp,
      childType: def.child?.type ?? null,
      childCount: def.child?.count ?? 0,
    };
  });
  const kit = ctx.bossKits[n];
  return {
    wave: n,
    boss,
    elite,
    bossKit: boss && kit
      ? {
          id: kit.id,
          name: kit.name,
          phases: kit.phases.length,
          abilities: kit.abilities.filter((a) => ctx.difficultyRank >= ['normal', 'hard', 'nightmare'].indexOf(a.minDifficulty)).map((a) => a.id),
        }
      : null,
    groups,
    enemyCount,
    poolHpCenti: pool,
    card,
    cardAllowed: !boss,
  };
}
