/**
 * Reine Anzeige-Zusaetze: Rolle, Hotkeys, Faehigkeitstexte. Namen, Beschreibungen und Preise der Stufen kommen aus den
 * Sim-Daten (`DATA.towers`), was gekauft werden kann entscheidet die Sim (`upgradeInfo`).
 */
import type { HeroType, TowerType } from '../sim';

/** Reihenfolge der Turm-Leiste (Runde 14): die drei Basistuerme, dann die Spezialisten (Longshot, Market, Thornweaver, Alchemist). */
export const TOWER_TYPES: TowerType[] = ['ranger', 'bombardier', 'frostcaller', 'longshot', 'market', 'thornweaver', 'alchemist'];
/**
 * Runde 16 (Paket T): Riverkeeper, Bellringer, Tinker und die Helden Bram und Sela sind in Sim und Meta fertig, aber noch nicht in der Turm-Leiste -
 * die Leiste, die Held-Auswahl und die Platzier-UI fuer Wasser bringt Paket TP. Der Held der Partie steht in `game.info.hero` (Held-Kachel in `match.ts`).
 */
export const HERO_TYPES: HeroType[] = ['wren'];
export const ROLE: Record<TowerType | HeroType, string> = {
  ranger: 'Cheap single target',
  bombardier: 'Area damage, cracks armor',
  frostcaller: 'Slows and controls',
  longshot: 'Sniper, whole-map range',
  market: 'Earns gold, buffs towers',
  thornweaver: 'Nature caster: thorns, vines, lightning',
  alchemist: 'Acid splash, buffs nearby towers',
  riverkeeper: 'Water tower: harpoons, sonar, cannons',
  bellringer: 'Support: bells buff nearby towers',
  tinker: 'Builder: sentries, caltrops, overclock',
  wren: 'Hero: lights the way',
  bram: 'Hero: cracks armor, forges',
  sela: 'Hero: long range, sees camo',
};
export const HOTKEY: Record<TowerType | HeroType, string> = { ranger: 'Q', bombardier: 'W', frostcaller: 'E', longshot: 'T', market: 'Z', thornweaver: 'D', alchemist: 'A', riverkeeper: 'V', bellringer: 'U', tinker: 'I', wren: 'R', bram: 'H', sela: 'J' };
/** Der Held-Platz laeuft immer ueber R, egal welcher Held gewaehlt ist (Paket TP: eigene Held-Kachel). */
export const HERO_KEY = 'R';
export const ABILITY_TEXT: Record<string, { name: string; desc: string }> = {
  arrowRain: { name: 'Arrow Rain', desc: 'All Rangers shoot 3x faster for a few seconds.' },
  absoluteZero: { name: 'Absolute Zero', desc: 'Freezes every Glim for 4 seconds.' },
  flare: { name: 'Flare', desc: 'A blast of lamplight on the strongest Glim. Reveals camo.' },
  dawnbreak: { name: 'Dawnbreak', desc: 'A beam of dawn burns along the whole path.' },
  focus: { name: 'Focus', desc: 'All Longshots shoot twice as fast for 8 seconds.' },
  supplyDrop: { name: 'Supply Drop', desc: 'A crate drops from the sky and pays out gold.' },
  wallOfTrees: { name: 'Wall of Trees', desc: 'A wall of trees rises on the path and swallows Glims.' },
  tonic: { name: 'Transforming Tonic', desc: 'The Alchemist turns into a monster for 20 seconds.' },
  grant: { name: 'Grant', desc: 'Your Grant Offices pay out a lump sum of gold.' },
  alarm: { name: 'Alarm', desc: 'Every Glim stops for a moment. Bosses stop for half as long.' },
  overclock: { name: 'Overclock', desc: 'Towers around your Tinkers attack much faster for a few seconds.' },
  anvilDrop: { name: 'Anvil Drop', desc: 'Bram drops an anvil on the strongest Glim: big damage and a stun.' },
  forgeOfDawn: { name: 'Forge of Dawn', desc: 'For 10 seconds every tower breaks armor.' },
  starfall: { name: 'Starfall', desc: 'A beam of starlight along the road in Sela\'s range.' },
  eclipse: { name: 'Eclipse', desc: 'Every Glim, ships and bosses too, moves at half speed for 4 seconds.' },
};
export const TARGET_TEXT: Record<string, string> = { first: 'First', last: 'Last', strong: 'Strong', close: 'Close' };
export const PATH_COLORS = ['#feae34', '#2ce8f5', '#f6757a'];
