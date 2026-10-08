/**
 * Karten aus Spieldaten: loest Name, Seltenheit und Elemente einer Unit auf (Sim-Daten, `UnitDef`) und baut damit Karten aus dem Baukasten (`kit/`).
 * Kein Bildschirm baut Karten selbst, damit Raster, Team, Lobby und Leiste gleich aussehen. Besitzer: P4 (Runde 8).
 */
import type { CollectionUnitView } from '../backend/meta';
import { miniCard, portraitCard, rarityId } from './kit';
import { unitName, unitSeries } from './meta-model';
import { unitDefs } from './unit-defs';

export interface UnitMeta {
  name: string;
  /** Serie ("Naruto"), leer wenn unbekannt */
  series: string;
  rarity: string;
  elements: string[];
}

/** Anzeige-Eckdaten einer Unit; unbekannte IDs bekommen einen lesbaren Namen und `rare`. */
export function unitMeta(id: string, rarityHint?: string): UnitMeta {
  const d = unitDefs().get(id);
  return { name: unitName(id), series: unitSeries(id), rarity: rarityId(d?.rarity ?? rarityHint), elements: d?.elements ?? [] };
}

export interface CardOptions {
  tag?: 'div' | 'button';
  cls?: string;
  live?: boolean;
  selected?: boolean;
  picked?: boolean;
}

/** Karte einer Unit der Sammlung (Level, Sterne, Besitz, Team). */
export function cardOf(u: CollectionUnitView, o: CardOptions = {}): HTMLElement {
  const m = unitMeta(u.unitId, u.rarity);
  const c = portraitCard({ unitId: u.unitId, name: m.name, series: m.series, rarity: u.rarity || m.rarity, elements: m.elements, owned: u.owned, level: u.level, stars: u.stars, maxStars: u.maxStars, inTeam: u.inTeam, tag: o.tag ?? 'button', cls: o.cls, live: o.live });
  if (o.selected) c.classList.add('selected');
  if (o.picked) c.classList.add('picked');
  return c;
}

/** Kleine Karte ohne Text (Teamleiste, Slots, Starter-Geschenk). */
export function miniOf(id: string, px = 44, cls?: string): HTMLElement {
  const m = unitMeta(id);
  return miniCard({ unitId: id, name: m.name, rarity: m.rarity, elements: m.elements, px, cls });
}
