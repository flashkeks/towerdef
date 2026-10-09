/** Kleine Lese-Helfer auf die Sim-Daten (Namen, Fussabdruck), damit Renderer und UI nicht je Turm/Held unterscheiden muessen. */
import { DATA, type HeroType, type TowerType } from '../sim';

export const isHero = (t: TowerType | HeroType): t is HeroType => t === 'wren';
/** Fussabdruck-Radius in Milli-px */
export const footMilli = (t: TowerType | HeroType): number => (isHero(t) ? DATA.hero.wren.radius : DATA.towers[t].radius) * 1000;
/** Reichweite der Basisstufe in px (nur fuer den Geist; die Sim rechnet Stufen und Wissensbaum selbst) */
export const baseRangePx = (t: TowerType | HeroType): number => Number((isHero(t) ? DATA.hero.wren.base : DATA.towers[t].base).range) / 1000;
export const displayName = (t: TowerType | HeroType): string => (isHero(t) ? DATA.hero.wren.name : DATA.towers[t].name);
