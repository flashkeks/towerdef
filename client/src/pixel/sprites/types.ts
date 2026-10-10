/** Lokale Typen passend zum Vertrag (docs/design/schnittstelle.md); keine Abhaengigkeit von der Sim. */
export type TowerType = 'ranger' | 'bombardier' | 'frostcaller' | 'market' | 'longshot' | 'thornweaver' | 'alchemist';
export type HeroType = 'wren';
/** Runde 15: pink, frostling, crystal, gloomship (Blimp), wyrm und colossus (Bosse) — IDs wie in der Sim (docs/design/karten-gegner-r15.md). */
export type EnemyType = 'red' | 'blue' | 'green' | 'gold' | 'ironshell' | 'ember' | 'brute' | 'leviathan' | 'pink' | 'frostling' | 'crystal' | 'gloomship' | 'wyrm' | 'colossus';
/** Merkmale als Ueberlagerung (Runde 15): regrow = Blaetterkranz, fortified = Eisenbaender. Mit Camo kombinierbar. */
export type EnemyTrait = 'regrow' | 'fortified';
/** thorn/thornMagic: Thornweaver; potion/potionGold: Alchemist (Runde 14; bei potion* ist `dir16` die Drehung der Flasche). snipe/snipeHeavy/snipeGold/splinter: Longshot (Runde 13). */
export type ProjectileKind = 'arrow' | 'bigArrow' | 'bolt' | 'starBolt' | 'bomb' | 'frag' | 'frost' | 'shard' | 'lantern' | 'snipe' | 'snipeHeavy' | 'snipeGold' | 'splinter' | 'thorn' | 'thornMagic' | 'potion' | 'potionGold';
export type AbilityId = 'arrowRain' | 'absoluteZero' | 'flare' | 'dawnbreak' | 'grant' | 'focus' | 'supplyDrop' | 'wallOfTrees' | 'transformingTonic';
export type Tiers = [number, number, number];
export const TOWER_TYPES: TowerType[] = ['ranger', 'bombardier', 'frostcaller', 'market', 'longshot', 'thornweaver', 'alchemist'];
/** Tuerme, die zielen und schiessen (Market tut das nicht: nur Idle). */
export const SHOOTER_TYPES: TowerType[] = ['ranger', 'bombardier', 'frostcaller', 'longshot', 'thornweaver', 'alchemist'];
export const ENEMY_TYPES: EnemyType[] = ['red', 'blue', 'green', 'gold', 'ironshell', 'ember', 'brute', 'leviathan', 'pink', 'frostling', 'crystal', 'gloomship', 'wyrm', 'colossus'];
export const ENEMY_TRAITS: EnemyTrait[] = ['regrow', 'fortified'];
export const PROJECTILE_KINDS: ProjectileKind[] = ['arrow', 'bigArrow', 'bolt', 'starBolt', 'bomb', 'frag', 'frost', 'shard', 'lantern', 'snipe', 'snipeHeavy', 'snipeGold', 'splinter', 'thorn', 'thornMagic', 'potion', 'potionGold'];
export const ABILITIES: AbilityId[] = ['arrowRain', 'absoluteZero', 'flare', 'dawnbreak', 'grant', 'focus', 'supplyDrop', 'wallOfTrees', 'transformingTonic'];
