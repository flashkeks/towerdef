/**
 * Anzeige-Werte einer Unit je Stufe und die Wirkung eines Upgrades (alt -> neu). Nur Darstellung, Zahlen aus den Sim-Daten
 * (`UnitDef.levels[]`: Schaden, SPA, Reichweite, Angriff mit Form, Treffern, DoT und Effekten). Runde 8: ein einziger Pfad fuer alle Units.
 */
import { t } from '../i18n/t';
import type { LevelStat, UnitDef } from '../sim';
import { auraShort } from './ability';

const TICKS_PER_SECOND = 20;

const levelOf = (def: UnitDef, level: number): LevelStat | undefined => def.levels[Math.min(level, def.levels.length - 1)];

/** Reichweite in Milli-Tiles, die der Spieler sehen soll: Angriffsreichweite der Stufe, 0 ohne Angriff (Farm). */
export function reachMilli(def: UnitDef, level: number): number {
  const lv = levelOf(def, level);
  return lv?.attack ? lv.rangeMilli : 0;
}

export interface StatRow {
  /** i18n-Schluessel `stat.*` */
  key: string;
  from: string;
  to: string;
}

const tiles = (milli: number): string => (milli / 1000).toFixed(1);
const secs = (ticks: number): string => (ticks / TICKS_PER_SECOND).toFixed(1);
const dmg = (centi: number): string => {
  const v = centi / 100;
  return v >= 100 ? String(Math.round(v)) : v.toFixed(1);
};

/** Form des Angriffs als Text ("Circle 1.8", "Cone 60°", "Line 0.8", "Whole range", "Single target"). */
export function attackForm(lv: LevelStat | undefined): string {
  const a = lv?.attack;
  if (!a) return '';
  switch (a.kind) {
    case 'circle':
      return t('form.circle', { r: tiles(a.radiusMilli) });
    case 'cone':
      return t('form.cone', { deg: a.coneDeg });
    case 'line':
      return t('form.line', { w: tiles(a.widthMilli) });
    case 'full':
      return t('form.full');
    default:
      return t('form.single');
  }
}

/** Namen der Effekte eines Angriffs (DoT-Art zuerst, dann die Spezialeffekte aus dem Katalog), z. B. ["Bleed", "Slow"]. */
export function attackEffects(lv: LevelStat | undefined): string[] {
  const a = lv?.attack;
  if (!a) return [];
  const out: string[] = [];
  if (a.dot) out.push(a.dot.kind.charAt(0).toUpperCase() + a.dot.kind.slice(1));
  for (const f of a.fx) out.push(f.name);
  return out;
}

/** Werte der Stufe `level` als Zeilen (key, Wert). */
export function statValues(def: UnitDef, level: number): { key: string; value: string }[] {
  const lv = levelOf(def, level);
  const rows: { key: string; value: string }[] = [];
  if (lv?.attack) {
    rows.push({ key: 'stat.damage', value: dmg(lv.damageCenti) }, { key: 'stat.cooldown', value: `${secs(lv.spaTicks)}s` }, { key: 'stat.range', value: tiles(lv.rangeMilli) });
    if (lv.attack.hits > 1) rows.push({ key: 'stat.hits', value: String(lv.attack.hits) });
    rows.push({ key: 'stat.form', value: attackForm(lv) });
    const fx = attackEffects(lv);
    if (fx.length > 0) rows.push({ key: 'stat.effects', value: fx.join(', ') });
  }
  // Fähigkeiten und Aura (Runde 9 / P1): Units ohne eigenen Angriff (Buffer, Beschwörer) zeigen ihre Wirkung als Zeile
  const open = def.abilities.filter((a) => level >= a.minLevel).map((a) => a.name);
  if (def.abilities.length > 0) rows.push({ key: 'stat.ability', value: open.length > 0 ? open.join(', ') : '-' });
  const aura = auraShort(def, level);
  if (aura) rows.push({ key: 'stat.aura', value: aura });
  if (def.farm) rows.push({ key: 'stat.yield', value: String(def.farm.yieldByLevel[Math.min(level, def.farm.yieldByLevel.length - 1)] ?? 0) });
  return rows;
}

/** Was ein Upgrade von `level` auf `level + 1` aendert; nur Werte, die sich wirklich aendern (nach Schluessel verglichen). Leer auf Max-Stufe. */
export function upgradeEffect(def: UnitDef, level: number): StatRow[] {
  if (level >= def.maxLevel) return [];
  const a = statValues(def, level);
  const b = new Map(statValues(def, level + 1).map((r) => [r.key, r.value]));
  const rows: StatRow[] = [];
  for (const r of a) {
    const to = b.get(r.key);
    if (to !== undefined && to !== r.value) rows.push({ key: r.key, from: r.value, to });
  }
  // neu hinzugekommene Zeilen (z. B. ein Angriff mit Treffern oder Effekten ab dieser Stufe)
  for (const [key, to] of b) if (!a.some((r) => r.key === key)) rows.push({ key, from: '-', to });
  return rows;
}
