/**
 * Spielgefuehl, reine Logik (P5): was ein Schuss, ein Treffer, ein Tod zeigen soll. Kein Pixi, kein DOM, kein Ton, kein Schreiben in die Sim.
 * Die Sim meldet Treffer nicht als Ereignis; der Client erkennt sie am Zustand: eine Unit hat gefeuert, wenn ihre Abklingzeit `cd` steigt,
 * Schaden steht in der Differenz der Gegner-HP. Alles hier ist Naeherung fuer die Anzeige (das Ziel wird nachgebildet, nicht uebernommen).
 */
import type { EnemyState, SimEvent, TargetMode, UnitDef, UnitState } from '../sim';
import { compactNumber } from './model';

// ---- Trefferstil je Unit --------------------------------------------------------------------------------------------

export type HitStyle = 'slash' | 'tracer' | 'shell' | 'bolt' | 'blast' | 'cone' | 'line' | 'full';

/**
 * Wie eine Unit angreift (Aussehen), nur aus den Daten der Stufe: Flaechenform des Angriffs, bei Einzelzielen die Reichweite
 * (Nahkampf = Hieb, weit = Leuchtspur, sonst Blitz). `null` = greift auf dieser Stufe nicht an (Farm).
 */
export function hitStyle(def: Pick<UnitDef, 'levels'>, level = 0): HitStyle | null {
  const lv = def.levels[Math.min(level, def.levels.length - 1)];
  const a = lv?.attack;
  if (!a) return null;
  if (a.kind === 'circle') return 'blast';
  if (a.kind === 'cone') return 'cone';
  if (a.kind === 'line') return 'line';
  if (a.kind === 'full') return 'full';
  if (lv.rangeMilli <= 2000) return 'slash';
  if (lv.rangeMilli >= 4500) return 'tracer';
  return 'bolt';
}

// ---- Schuss erkennen ------------------------------------------------------------------------------------------------

/** Merkt sich `cd` je Unit. Eine Unit hat gefeuert, wenn `cd` seit dem letzten Aufruf gestiegen ist (die Sim setzt es beim Angriff auf die Angriffsdauer). */
export class ShotDetector {
  private readonly cd = new Map<number, number>();

  /** Ids der Units, die seit dem letzten Aufruf gefeuert haben. Neue Units zaehlen erst ab dem naechsten Aufruf. */
  detect(units: readonly Pick<UnitState, 'id' | 'cd'>[]): number[] {
    const fired: number[] = [];
    const seen = new Set<number>();
    for (const u of units) {
      seen.add(u.id);
      const prev = this.cd.get(u.id);
      if (prev !== undefined && u.cd > prev) fired.push(u.id);
      this.cd.set(u.id, u.cd);
    }
    for (const id of this.cd.keys()) if (!seen.has(id)) this.cd.delete(id);
    return fired;
  }

  reset(): void {
    this.cd.clear();
  }
}

export interface TargetCandidate {
  id: number;
  x: number;
  y: number;
  flying: boolean;
  hp: number;
  progress: number;
}

/** Zielwahl wie in der Sim (Modus, Reichweite, Luft), nur fuer die Darstellung. Positionen in Milli-Tiles. */
export function pickTarget<T extends TargetCandidate>(
  origin: { x: number; y: number },
  rangeMilli: number,
  canHitAir: boolean,
  mode: TargetMode,
  enemies: readonly T[],
  slackMilli = 350,
): T | null {
  const reach = rangeMilli + slackMilli;
  const r2 = reach * reach;
  let best: T | null = null;
  let bestScore = -Infinity;
  for (const e of enemies) {
    if (e.hp <= 0 || (e.flying && !canHitAir)) continue;
    const dx = e.x - origin.x;
    const dy = e.y - origin.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > r2) continue;
    const score = mode === 'first' ? e.progress : mode === 'last' ? -e.progress : mode === 'close' ? -d2 : e.hp;
    if (score > bestScore || (score === bestScore && best !== null && e.id < best.id)) {
      best = e;
      bestScore = score;
    }
  }
  return best;
}

// ---- Schadenszahlen -------------------------------------------------------------------------------------------------

export interface DamageNumber {
  enemyId: number;
  /** Centi-HP (immer positiv) */
  centi: number;
  heal: boolean;
  kill: boolean;
}

interface Tracked {
  hp: number;
  maxHp: number;
  boss: boolean;
}

/**
 * Liest die HP-Differenz je Gegner und buendelt sie zu Zahlen: je Gegner hoechstens eine Zahl alle `gapMs`, beim Tod sofort der Rest.
 * Heilung zeigt nur der Boss und erst ab 1 % der Max-HP (Regeneration und kleine Heiler wuerden sonst Zahlen regnen).
 * Gegner, die verschwinden, ohne gestorben zu sein (Leak), erzeugen keine Zahl: `gone` benennt Kill und Leak.
 */
export class DamageNumbers {
  private readonly prev = new Map<number, Tracked>();
  private readonly acc = new Map<number, number>();
  private readonly lastPop = new Map<number, number>();

  constructor(private readonly gapMs = 260) {}

  step(enemies: readonly Pick<EnemyState, 'id' | 'hp' | 'maxHp' | 'shield' | 'boss'>[], gone: ReadonlyMap<number, 'kill' | 'leak'>, nowMs: number): DamageNumber[] {
    const out: DamageNumber[] = [];
    const seen = new Set<number>();
    for (const e of enemies) {
      seen.add(e.id);
      const total = e.hp + e.shield;
      const p = this.prev.get(e.id);
      if (p) {
        const delta = p.hp - total;
        if (delta > 0) this.acc.set(e.id, (this.acc.get(e.id) ?? 0) + delta);
        else if (delta < 0 && e.boss && -delta >= e.maxHp / 100) out.push({ enemyId: e.id, centi: -delta, heal: true, kill: false });
      }
      this.prev.set(e.id, { hp: total, maxHp: e.maxHp, boss: e.boss });
      const a = this.acc.get(e.id) ?? 0;
      if (a > 0 && nowMs - (this.lastPop.get(e.id) ?? -1e9) >= this.gapMs) {
        out.push({ enemyId: e.id, centi: a, heal: false, kill: false });
        this.acc.delete(e.id);
        this.lastPop.set(e.id, nowMs);
      }
    }
    for (const [id, p] of this.prev) {
      if (seen.has(id)) continue;
      const why = gone.get(id);
      const centi = (this.acc.get(id) ?? 0) + (why === 'kill' ? p.hp : 0);
      if (why === 'kill' && centi > 0) out.push({ enemyId: id, centi, heal: false, kill: true });
      this.prev.delete(id);
      this.acc.delete(id);
      this.lastPop.delete(id);
    }
    return out;
  }

  reset(): void {
    this.prev.clear();
    this.acc.clear();
    this.lastPop.clear();
  }
}

/** Anzeige: Centi-HP -> ganze Zahl (mindestens 1), grosse Werte kompakt. */
export const formatDamage = (centi: number): string => compactNumber(Math.max(1, Math.round(centi / 100)));

// ---- Ereignis -> Effekt ---------------------------------------------------------------------------------------------

export type FeelCue =
  | { kind: 'kill'; enemyId: number; enemy: string; bounty: number }
  | { kind: 'leak'; enemyId: number; damage: number; fatal: boolean }
  | { kind: 'bossEnter'; enemyId: number }
  | { kind: 'bossPhase'; enemyId: number }
  | { kind: 'bossWarn'; enemyId: number; warnTicks: number }
  | { kind: 'bossCast'; enemyId: number; interrupted: boolean }
  | { kind: 'windowOpen'; enemyId: number; armor: number }
  | { kind: 'windowClose'; enemyId: number }
  | { kind: 'wardBreak'; enemyId: number }
  | { kind: 'waveStart'; wave: number };

/** Welcher Effekt zu einem Sim-Ereignis gehoert (oder keiner). Rein, damit Ton und Bild dasselbe lesen. */
export function cueFor(e: SimEvent): FeelCue | null {
  switch (e.type) {
    case 'kill':
      return { kind: 'kill', enemyId: e.enemyId, enemy: e.enemy, bounty: e.bounty };
    case 'leak':
      return { kind: 'leak', enemyId: e.enemyId, damage: e.damage, fatal: e.fatal };
    case 'spawn':
      return e.enemy === 'boss' && !e.summon ? { kind: 'bossEnter', enemyId: e.enemyId } : null;
    case 'bossPhase':
      return e.phase > 0 ? { kind: 'bossPhase', enemyId: e.enemyId } : null;
    case 'bossTelegraph':
      return { kind: 'bossWarn', enemyId: e.enemyId, warnTicks: e.warnTicks };
    case 'bossCast':
      return { kind: 'bossCast', enemyId: e.enemyId, interrupted: e.interrupted };
    case 'bossWindow':
      return e.open ? { kind: 'windowOpen', enemyId: e.enemyId, armor: e.armor ?? -1 } : { kind: 'windowClose', enemyId: e.enemyId };
    case 'bossWard':
      return e.state === 'broken' ? { kind: 'wardBreak', enemyId: e.enemyId } : null;
    case 'waveStart':
      return { kind: 'waveStart', wave: e.wave };
    default:
      return null;
  }
}

/** Anzahl Splitter beim Tod nach Gegnergroesse (Boss gross, Elite mittel). */
export const deathParticles = (enemy: string): number => (enemy === 'boss' ? 46 : enemy === 'elite' ? 22 : enemy === 'brute' ? 14 : enemy.endsWith('_child') ? 5 : 9);

/** Rand-Blinken beim Leak: Staerke 0..1 (mehr Schaden = staerker, tödlich = voll), Dauer in Sekunden. */
export function leakBlink(damage: number, fatal: boolean): { strength: number; seconds: number } {
  if (fatal) return { strength: 1, seconds: 1.4 };
  return { strength: Math.min(1, 0.45 + damage * 0.08), seconds: 0.7 + Math.min(0.5, damage * 0.06) };
}

/** Blink-Faktor 0..1 zum Zeitpunkt `age` Sekunden nach Beginn: schnelles Pulsieren, das ausklingt. */
export function blinkAlpha(age: number, seconds: number, strength: number): number {
  if (age >= seconds) return 0;
  const fade = 1 - age / seconds;
  const pulse = Math.sin(age * 26) > -0.25 ? 1 : 0.3;
  return strength * fade * pulse;
}
