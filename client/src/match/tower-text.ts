/**
 * Reine Anzeige-Zusaetze: Rolle, Hotkeys, Faehigkeitstexte. Namen, Beschreibungen und Preise der Stufen kommen aus den
 * Sim-Daten (`DATA.towers`), was gekauft werden kann entscheidet die Sim (`upgradeInfo`).
 */
import type { HeroType, TowerType } from '../sim';

export const TOWER_TYPES: TowerType[] = ['ranger', 'bombardier', 'frostcaller'];
export const HERO_TYPES: HeroType[] = ['wren'];
export const ROLE: Record<TowerType | HeroType, string> = {
  ranger: 'Cheap single target',
  bombardier: 'Area damage, cracks armor',
  frostcaller: 'Slows and controls',
  wren: 'Hero: lights the way',
};
export const HOTKEY: Record<TowerType | HeroType, string> = { ranger: 'Q', bombardier: 'W', frostcaller: 'E', wren: 'R' };
export const ABILITY_TEXT: Record<string, { name: string; desc: string }> = {
  arrowRain: { name: 'Arrow Rain', desc: 'All Rangers shoot 3x faster for a few seconds.' },
  absoluteZero: { name: 'Absolute Zero', desc: 'Freezes every Glim for 4 seconds.' },
  flare: { name: 'Flare', desc: 'A blast of lamplight on the strongest Glim. Reveals camo.' },
  dawnbreak: { name: 'Dawnbreak', desc: 'A beam of dawn burns along the whole path.' },
};
export const TARGET_TEXT: Record<string, string> = { first: 'First', last: 'Last', strong: 'Strong', close: 'Close' };
export const PATH_COLORS = ['#feae34', '#2ce8f5', '#f6757a'];
