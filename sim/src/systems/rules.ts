/**
 * Stufen-Regeln (Runde 4 / P3): macht aus der Stage-Wave (Basis, für alle Stufen gleich) die Wave der gewählten Stufe.
 *
 * Reihenfolge je Wave: 1. Wellen-Variante (seeded Wahl: Anzahl, Spawn-Dichte, Typ-Tausch)
 *                      2. Modifier-Vergabe (seeded, nur reguläre Gruppen ohne eigene Modifier)
 *                      3. Element je Gruppe (`elementMode: mixed`).
 * Alles ist Ganzzahl-Arithmetik und hängt nur von (Seed, Wave, Gruppen-Index, Stufe) ab: kein Sim-PRNG, kein Hash-Eingriff,
 * gleiche Eingabe liefert dieselbe Wave. Boss und Elite bleiben unberührt (Boss-Kits: P4).
 * Basis-Stufe ohne Regeln (Dichte 0, keine Varianten, Element-Modus `wave`) liefert die Stage-Wave unverändert.
 */
import type { Ctx } from '../data/compile.js';
import type { GenGroup, GenWave } from './infinite.js';

/** Spawn-Abstand (Ticks) je Typ für getauschte Gruppen; entspricht den Stage-Daten. */
const INTERVAL: Record<string, number> = { grunt: 16, runner: 10, flyer: 18, brute: 40, splitter: 30 };

const cache = new WeakMap<Ctx, Map<number, GenWave>>();

/** Integer-Mischer (32 Bit), liefert eine Zahl in [0, 2^32). */
export function mix(seed: number, a: number, b: number, c: number): number {
  let h = (seed ^ Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(b + 1, 0x85ebca6b) ^ Math.imul(c + 1, 0xc2b2ae35)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}
/** Ganzzahl in [0, n) aus mix(...). */
const roll = (seed: number, a: number, b: number, c: number, n: number): number => Math.floor((mix(seed, a, b, c) * n) / 4294967296);

const isRegular = (type: string): boolean => type !== 'boss' && type !== 'elite';

export function hasRules(ctx: Ctx): boolean {
  const d = ctx.difficulty;
  return d.modifiers.densityBp > 0 || d.waveVariants.length > 0 || d.elementMode === 'mixed';
}

/** Wave n der Stage, mit den Regeln der Stufe angewandt (gecacht je Ctx). */
export function ruleWave(ctx: Ctx, n: number, base: GenWave): GenWave {
  if (!hasRules(ctx)) return base;
  let m = cache.get(ctx);
  if (!m) cache.set(ctx, (m = new Map()));
  let w = m.get(n);
  if (!w) m.set(n, (w = buildRuleWave(ctx, n, base)));
  return w;
}

/** Gewählte Variante der Wave (oder null); für Tests und die Wellenvorschau (P4). */
export function pickVariant(ctx: Ctx, n: number): string | null {
  const d = ctx.difficulty;
  for (let i = 0; i < d.waveVariants.length; i++) {
    const v = d.waveVariants[i];
    if (n >= v.fromWave && roll(ctx.waveSeed, n, i, 1, 10000) < v.chanceBp) return v.id;
  }
  return null;
}

function buildRuleWave(ctx: Ctx, n: number, base: GenWave): GenWave {
  const d = ctx.difficulty;
  let groups: GenGroup[] = base.groups.map((g) => ({ ...g, modifiers: [...g.modifiers] }));

  const vid = pickVariant(ctx, n);
  const v = vid === null ? undefined : d.waveVariants.find((x) => x.id === vid);
  if (v) {
    const out: GenGroup[] = [];
    for (const g of groups) {
      if (!isRegular(g.type)) {
        out.push(g);
        continue;
      }
      let count = Math.max(1, Math.floor((g.count * v.countBp) / 10000));
      const interval = Math.floor((g.intervalTicks * v.intervalBp) / 10000);
      let moved = 0;
      if (v.swap && g.type === v.swap.from) {
        moved = Math.min(count, Math.floor((count * v.swap.shareBp) / 10000));
        count -= moved;
      }
      if (count > 0) out.push({ ...g, count, intervalTicks: count > 1 ? Math.max(1, interval) : 0 });
      if (moved > 0 && v.swap) {
        const iv = Math.max(1, Math.floor(((INTERVAL[v.swap.to] ?? g.intervalTicks) * v.intervalBp) / 10000));
        out.push({ type: v.swap.to, count: moved, intervalTicks: moved > 1 ? iv : 0, delayTicks: g.delayTicks, modifiers: [], element: g.element });
      }
    }
    if (v.forceModifier) for (const g of out) if (isRegular(g.type) && g.modifiers.length === 0) g.modifiers = [v.forceModifier];
    groups = out;
  }

  const mod = d.modifiers;
  if (mod.densityBp > 0 && n >= mod.fromWave) {
    const total = mod.pool.reduce((s, p) => s + p.weight, 0);
    groups.forEach((g, gi) => {
      if (!isRegular(g.type) || g.modifiers.length > 0) return;
      if (roll(ctx.waveSeed, n, gi, 2, 10000) >= mod.densityBp) return;
      let r = roll(ctx.waveSeed, n, gi, 3, total);
      for (const p of mod.pool) {
        if (r < p.weight) {
          g.modifiers = [p.id];
          return;
        }
        r -= p.weight;
      }
    });
  }

  if (d.elementMode === 'mixed') groups.forEach((g, gi) => (g.element = 1 + ((g.element - 1 + gi * 2) % 5)));
  return { n: base.n, groups };
}
