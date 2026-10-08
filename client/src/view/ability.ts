/**
 * Fähigkeiten im Match (Runde 9 / P1), reine Logik ohne DOM: Zustand eines Knopfes (Abklingzeit, Ring, gesperrt/bereit), Zusammenfassung
 * je Unit-Typ für die Unit-Leiste und die Beschreibung aus den Sim-Daten (`UnitDef.abilities`, `UnitDef.aura`). Die Sim entscheidet
 * über alles (`sim.abilityBlocked`); hier wird nur gelesen.
 */
import { t } from '../i18n/t';
import type { AbilityDef, AuraDef, Sim, SummonDef, UnitDef, UnitState } from '../sim';

const TPS = 20;

export interface AbilityView {
  index: number;
  def: AbilityDef;
  /** Knopf-Fähigkeit (der Spieler löst aus) oder automatisch. */
  button: boolean;
  /** Stufe zu niedrig. */
  locked: boolean;
  cdTicks: number;
  /** 0 = gerade ausgelöst, 1 = bereit (Anteil der Abklingzeit, der schon um ist). */
  ratio: number;
  /** Abklingzeit um und freigeschaltet (der Knopf darf gedrückt werden; ob ein Ziel da ist, prüft die Sim beim Klick). */
  ready: boolean;
  /** Grund der Sim, warum jetzt nichts geht (`null` = geht). */
  blocked: string | null;
}

/** Zustand der Fähigkeiten einer gesetzten Unit. */
export function abilityViews(sim: Pick<Sim, 'abilityBlocked'>, def: UnitDef, u: UnitState): AbilityView[] {
  return def.abilities.map((a, index) => {
    const cdTicks = u.ab?.[index] ?? 0;
    const locked = u.level < a.minLevel;
    return {
      index,
      def: a,
      button: a.trigger === 'button',
      locked,
      cdTicks,
      ratio: locked ? 0 : Math.max(0, Math.min(1, 1 - cdTicks / a.cooldownTicks)),
      ready: !locked && cdTicks === 0,
      blocked: sim.abilityBlocked(u.id, index),
    };
  });
}

/** Hat die Unit eine Knopf-Fähigkeit? */
export const hasButton = (def: Pick<UnitDef, 'abilities'>): boolean => def.abilities.some((a) => a.trigger === 'button');

/** Die erste Knopf-Fähigkeit (die der Unit-Leiste und der Taste Q). */
export const firstButton = (def: Pick<UnitDef, 'abilities'>): number => def.abilities.findIndex((a) => a.trigger === 'button');

export interface TypeAbility {
  /** Gesetzte Units dieser Art. */
  count: number;
  /** Davon bereit (Abklingzeit um, freigeschaltet). */
  ready: number;
  /** Kürzeste Rest-Abklingzeit unter allen gesetzten Units (0 = mindestens eine bereit). */
  cdTicks: number;
  ratio: number;
  auto: number;
  def: AbilityDef;
}

/** Zusammenfassung der ersten Knopf-Fähigkeit über alle gesetzten Units einer Art, `null` ohne gesetzte Unit oder ohne Knopf-Fähigkeit. */
export function typeAbility(units: readonly UnitState[], def: UnitDef): TypeAbility | null {
  const i = firstButton(def);
  if (i < 0) return null;
  const a = def.abilities[i];
  let count = 0;
  let ready = 0;
  let auto = 0;
  let best = Infinity;
  for (const u of units) {
    if (u.defId !== def.id) continue;
    count++;
    if (u.auto) auto++;
    if (u.level < a.minLevel) continue;
    const cd = u.ab?.[i] ?? 0;
    if (cd === 0) ready++;
    best = Math.min(best, cd);
  }
  if (count === 0) return null;
  const cdTicks = best === Infinity ? a.cooldownTicks : best;
  return { count, ready, cdTicks, ratio: Math.max(0, Math.min(1, 1 - cdTicks / a.cooldownTicks)), auto, def: a };
}

export const secondsLeft = (ticks: number): string => (ticks / TPS < 10 ? (ticks / TPS).toFixed(1) : String(Math.ceil(ticks / TPS)));

const pct = (bp: number): string => `${Math.round(bp / 100)}%`;
const tilesOf = (milli: number): string => (milli / 1000).toFixed(1);

/** Beschreibung einer Fähigkeit in kurzen Zeilen (alles aus den Daten). `summons` für die Namen der Wesen. */
export function describeAbility(a: AbilityDef, summons: Record<string, SummonDef>): string[] {
  const out: string[] = [];
  if (a.attack) {
    const parts: string[] = [];
    if (a.damageCenti > 0) parts.push(t('ability.fx.damage.abs', { n: Math.round(a.damageCenti / 100) }));
    else if (a.damageMultBp > 0) parts.push(t('ability.fx.damage', { n: (a.damageMultBp / 10000).toFixed(a.damageMultBp % 10000 === 0 ? 0 : 1) }));
    parts.push(a.global ? t('ability.fx.global') : t('ability.fx.range'));
    const fx = [...(a.attack.dot ? [a.attack.dot.kind] : []), ...a.attack.fx.map((f) => f.name)];
    if (fx.length) parts.push(fx.join(', '));
    out.push(parts.join(' · '));
  }
  if (a.pulses > 1) out.push(t('ability.fx.pulses', { n: a.pulses, s: Math.round(((a.pulses - 1) * a.pulseEvery) / TPS) }));
  const buffBits = (b: { damageBp: number; rangeBp: number; tempoBp: number; critBp: number }): string[] => [
    ...(b.damageBp ? [t('ability.buff.damage', { n: pct(b.damageBp) })] : []),
    ...(b.rangeBp ? [t('ability.buff.range', { n: pct(b.rangeBp) })] : []),
    ...(b.tempoBp ? [t('ability.buff.tempo', { n: pct(b.tempoBp) })] : []),
    ...(b.critBp ? [t('ability.buff.crit', { n: pct(b.critBp) })] : []),
  ];
  if (a.selfBuff) out.push(t('ability.fx.self', { parts: buffBits(a.selfBuff).join(', '), s: Math.round(a.selfBuff.ticks / TPS) }));
  if (a.buff) out.push(t(a.buff.radiusMilli === null ? 'ability.fx.allies' : 'ability.fx.alliesNear', { parts: buffBits(a.buff).join(', '), s: Math.round(a.buff.ticks / TPS), r: a.buff.radiusMilli ? tilesOf(a.buff.radiusMilli) : '' }));
  for (const s of a.summon ?? []) out.push(t('ability.fx.summon', { n: s.count, name: summons[s.id]?.name ?? s.id }));
  if (a.coins > 0) out.push(t('ability.fx.coins', { n: a.coins }));
  return out;
}

/** Aura der Stufe als Zeile ("+25% damage, +10% crit within 5.0 tiles"), `null` ohne Aura. */
export function describeAura(def: Pick<UnitDef, 'aura'>, level: number): string | null {
  if (def.aura.length === 0) return null;
  const a: AuraDef = def.aura[Math.min(level, def.aura.length - 1)];
  const bits = [
    ...(a.damageBp ? [t('ability.buff.damage', { n: pct(a.damageBp) })] : []),
    ...(a.rangeBp ? [t('ability.buff.range', { n: pct(a.rangeBp) })] : []),
    ...(a.tempoBp ? [t('ability.buff.tempo', { n: pct(a.tempoBp) })] : []),
    ...(a.critBp ? [t('ability.buff.crit', { n: pct(a.critBp) })] : []),
  ];
  return t(a.radiusMilli === null ? 'aura.line.all' : 'aura.line', { parts: bits.join(', '), r: a.radiusMilli ? tilesOf(a.radiusMilli) : '' });
}

/** Kurzform der Aura einer Stufe für Wertezeilen ("+10% dmg, +25% crit"), `null` ohne Aura. */
export function auraShort(def: Pick<UnitDef, 'aura'>, level: number): string | null {
  if (def.aura.length === 0) return null;
  const a: AuraDef = def.aura[Math.min(level, def.aura.length - 1)];
  const bits = [...(a.damageBp ? [`+${pct(a.damageBp)} dmg`] : []), ...(a.rangeBp ? [`+${pct(a.rangeBp)} range`] : []), ...(a.tempoBp ? [`+${pct(a.tempoBp)} speed`] : []), ...(a.critBp ? [`+${pct(a.critBp)} crit`] : [])];
  return bits.join(', ');
}

/** Hat die Unit etwas Aktives (Knopf, Auto-Beschwörer, Aura)? Für Marken in der Sammlung. */
export const hasKit = (def: Pick<UnitDef, 'abilities' | 'aura'>): boolean => def.abilities.length > 0 || def.aura.length > 0;
