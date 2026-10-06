/** Anzeige-Werte einer Unit je Stufe und die Wirkung eines Upgrades (alt -> neu). Nur Darstellung, Zahlen aus den Sim-Daten. */
import type { UnitDef } from '../sim';

const TICKS_PER_SECOND = 20;

/** Reichweite in Milli-Tiles, die der Spieler sehen soll: Aura-Radius bei Support, sonst Angriffsreichweite, 0 ohne Reichweite (Farm). */
export function reachMilli(def: UnitDef, level: number): number {
  if (def.aura) return def.aura.radiusMilli;
  if (!def.attack) return 0;
  return def.levels[Math.min(level, def.levels.length - 1)]?.rangeMilli ?? 0;
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

/** Werte der Stufe `level` als Zeilen (key, Wert). */
export function statValues(def: UnitDef, level: number): { key: string; value: string }[] {
  const lv = def.levels[Math.min(level, def.levels.length - 1)];
  const rows: { key: string; value: string }[] = [];
  if (def.attack && lv) {
    rows.push({ key: 'stat.damage', value: dmg(lv.damageCenti) }, { key: 'stat.cooldown', value: `${secs(lv.spaTicks)}s` }, { key: 'stat.range', value: tiles(lv.rangeMilli) });
  }
  if (def.aura) {
    const bp = def.aura.damageBpByLevel[Math.min(level, def.aura.damageBpByLevel.length - 1)] ?? 0;
    rows.push({ key: 'stat.aura', value: `+${Math.round(bp / 100)}%` }, { key: 'stat.range', value: tiles(def.aura.radiusMilli) });
  }
  if (def.farm) rows.push({ key: 'stat.yield', value: String(def.farm.yieldByLevel[Math.min(level, def.farm.yieldByLevel.length - 1)] ?? 0) });
  return rows;
}

/** Was ein Upgrade von `level` auf `level + 1` aendert; nur Werte, die sich wirklich aendern. Leer auf Max-Stufe. */
export function upgradeEffect(def: UnitDef, level: number): StatRow[] {
  if (level >= def.maxLevel) return [];
  const a = statValues(def, level);
  const b = statValues(def, level + 1);
  const rows: StatRow[] = [];
  a.forEach((r, i) => {
    const to = b[i]?.value;
    if (to !== undefined && to !== r.value) rows.push({ key: r.key, from: r.value, to });
  });
  return rows;
}
