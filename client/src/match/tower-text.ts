/**
 * Anzeige-Texte und Preise der Tuerme (docs/design/tuerme.md, Preise = Medium). Nur zum ANZEIGEN im Upgrade-Panel
 * (Namen, Beschreibungen, Preise spaeterer Stufen); was gekauft werden kann und was es kostet, entscheidet die Sim.
 */
import type { HeroType, TowerType } from './sim';

export interface TierText { name: string; price: number; desc: string }
export interface PathText { name: string; tiers: TierText[] }
export interface TowerText {
  name: string;
  role: string;
  base: number;
  /** Fussabdruck-Radius (px), nur fuer den Geist vor der Sim-Pruefung */
  foot: number;
  /** Reichweite der Basisstufe (px) fuer den Geist */
  range: number;
  hotkey: string;
  paths: PathText[];
}

const t = (name: string, price: number, desc: string): TierText => ({ name, price, desc });

export const TOWER_TEXT: Record<TowerType, TowerText> = {
  ranger: {
    name: 'Ranger', role: 'Cheap single target', base: 200, foot: 9, range: 68, hotkey: 'Q',
    paths: [
      { name: 'Volley', tiers: [
        t('Sharp Tips', 120, 'Arrows pop 1 more Glim.'),
        t("Hunter's Arrows", 180, 'Arrows pop 2 more Glims.'),
        t('Triple Shot', 450, 'Fires 3 arrows in a fan.'),
        t('Arrowstorm', 1300, '5 arrows, more damage and pierce.'),
        t('Sky Splitter', 4200, '7 giant magic arrows that pierce armor.'),
      ] },
      { name: 'Rapid', tiers: [
        t('Quick Draw', 90, 'Shoots faster.'),
        t('Quicker Draw', 160, 'Shoots even faster.'),
        t('Repeater', 500, 'Much faster, faster arrows.'),
        t('Volley Captain', 1500, 'Ability: Arrow Rain, all Rangers shoot 3x faster.'),
        t('Thousand Arrows', 4600, 'Fires an endless stream of arrows.'),
      ] },
      { name: 'Eagle Eye', tiers: [
        t('Longbow', 80, 'Longer range.'),
        t('Eagle Eye', 170, 'Spots camo Glims. More range.'),
        t('Ballista', 600, 'Heavy bolts that pierce armor.'),
        t('Siege Ballista', 1500, 'Huge damage, extra vs Brutes and bosses.'),
        t('Starfall Ballista', 4400, 'Bolts explode on the last Glim they hit.'),
      ] },
    ],
  },
  bombardier: {
    name: 'Bombardier', role: 'Area damage, cracks armor', base: 350, foot: 10, range: 80, hotkey: 'W',
    paths: [
      { name: 'Bigger Blasts', tiers: [
        t('Bigger Bombs', 250, 'Bigger blast radius.'),
        t('Heavy Shells', 400, 'Blasts pop 2 layers.'),
        t('Shellcracker', 1000, 'Extra damage to Brutes and bosses.'),
        t('Siege Mortar', 2600, 'Big damage, bigger radius, faster.'),
        t('Doomsday Keg', 5200, 'Colossal explosion. Boss breaker.'),
      ] },
      { name: 'Clusters', tiers: [
        t('Quick Fuse', 200, 'Shoots faster.'),
        t('Long Barrel', 250, 'More range, faster shells.'),
        t('Cluster Bombs', 750, 'Blasts throw 6 sharp splinters.'),
        t('Clusterstorm', 2200, '8 splinters that explode.'),
        t('Bombardment', 4600, 'Rocket barrage: 12 splinters, very fast.'),
      ] },
      { name: 'Concussion', tiers: [
        t('Wide Range', 150, 'More range.'),
        t('Ringing Blast', 300, 'Stuns Glims briefly.'),
        t('Concussion Shells', 850, 'Longer stun.'),
        t('Thunder Cannon', 2400, 'Long stun, bigger blast, more damage.'),
        t('Earthshaker', 5000, 'Every 3rd shot is a quake that stuns all in range.'),
      ] },
    ],
  },
  frostcaller: {
    name: 'Frostcaller', role: 'Slows and controls', base: 300, foot: 9, range: 72, hotkey: 'E',
    paths: [
      { name: 'Permafrost', tiers: [
        t('Chill', 120, 'Stronger, longer slow.'),
        t('Frost Aura', 300, 'Slows every Glim in range.'),
        t('Blizzard', 900, 'Stronger aura that also hurts.'),
        t('Glacier Heart', 2400, 'Aura slows even bosses.'),
        t('Absolute Zero', 5000, 'Ability: freezes everything for 4s.'),
      ] },
      { name: 'Shatter', tiers: [
        t('Frost Nova', 180, 'Bolts burst on impact.'),
        t('Brittle Ice', 380, 'Slowed Glims take +1 damage.'),
        t('Ice Shards', 1000, 'Bursts throw sharp ice shards.'),
        t('Glacial Spike', 2700, 'Ice spear: fast, heavy, boss bonus.'),
        t("Winter's Wrath", 5400, 'Frost golem, 12 shards, huge novas.'),
      ] },
      { name: 'Storm', tiers: [
        t('Spark', 200, 'Hits jump to 2 more Glims.'),
        t('Storm Sight', 250, 'Spots camo Glims. More range.'),
        t('Chain Lightning', 1100, 'Instant lightning through 6 Glims.'),
        t('Tempest', 3000, 'Chains 10 Glims, faster.'),
        t('Stormcaller', 5800, 'Chains 18, plus a thunderclap on the strongest.'),
      ] },
    ],
  },
};

export const HERO_TEXT = {
  wren: { name: 'Wren', title: 'the Lamplighter', base: 540, foot: 10, range: 84, hotkey: 'R' },
} as const;

export const ABILITY_TEXT: Record<string, { name: string; desc: string }> = {
  arrowRain: { name: 'Arrow Rain', desc: 'All Rangers shoot 3x faster for a few seconds.' },
  absoluteZero: { name: 'Absolute Zero', desc: 'Freezes every Glim for 4 seconds.' },
  flare: { name: 'Flare', desc: 'A blast of lamplight on the strongest Glim. Reveals camo.' },
  dawnbreak: { name: 'Dawnbreak', desc: 'A beam of dawn burns along the whole path.' },
};

export const TARGET_TEXT: Record<string, string> = { first: 'First', last: 'Last', strong: 'Strong', close: 'Close' };

export const TOWER_TYPES: TowerType[] = ['ranger', 'bombardier', 'frostcaller'];
export const HERO_TYPES: HeroType[] = ['wren'];
export const PATH_COLORS = ['#feae34', '#2ce8f5', '#f6757a'];
