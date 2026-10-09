/** Lokale Typen passend zum Vertrag (docs/design/schnittstelle.md); keine Abhaengigkeit von der Sim. */
export type TowerType = 'ranger' | 'bombardier' | 'frostcaller' | 'market' | 'longshot' | 'thornweaver' | 'alchemist';
export type HeroType = 'wren';
export type EnemyType = 'red' | 'blue' | 'green' | 'gold' | 'ironshell' | 'ember' | 'brute' | 'leviathan';
/** snipe/snipeHeavy/snipeGold/splinter: Longshot (Runde 13). */
export type ProjectileKind = 'arrow' | 'bigArrow' | 'bolt' | 'starBolt' | 'bomb' | 'frag' | 'frost' | 'shard' | 'lantern' | 'snipe' | 'snipeHeavy' | 'snipeGold' | 'splinter' | 'thorn' | 'potion';
export type AbilityId = 'arrowRain' | 'absoluteZero' | 'flare' | 'dawnbreak' | 'grant' | 'focus' | 'supplyDrop' | 'wallOfTrees' | 'tonic';
export type Tiers = [number, number, number];
export const TOWER_TYPES: TowerType[] = ['ranger', 'bombardier', 'frostcaller', 'market', 'longshot'];
/** Tuerme, die zielen und schiessen (Market tut das nicht: nur Idle). */
export const SHOOTER_TYPES: TowerType[] = ['ranger', 'bombardier', 'frostcaller', 'longshot'];
export const ENEMY_TYPES: EnemyType[] = ['red', 'blue', 'green', 'gold', 'ironshell', 'ember', 'brute', 'leviathan'];
export const PROJECTILE_KINDS: ProjectileKind[] = ['arrow', 'bigArrow', 'bolt', 'starBolt', 'bomb', 'frag', 'frost', 'shard', 'lantern', 'snipe', 'snipeHeavy', 'snipeGold', 'splinter'];
export const ABILITIES: AbilityId[] = ['arrowRain', 'absoluteZero', 'flare', 'dawnbreak', 'grant', 'focus', 'supplyDrop'];
