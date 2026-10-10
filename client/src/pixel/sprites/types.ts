/** Lokale Typen passend zum Vertrag (docs/design/schnittstelle.md); keine Abhaengigkeit von der Sim. */
/** Tuerme mit eigener Figur (Runde 11-14). */
export type BaseTowerType = 'ranger' | 'bombardier' | 'frostcaller' | 'market' | 'longshot' | 'thornweaver' | 'alchemist' | 'bellringer' | 'tinker';
/**
 * Runde 16 (Paket TP): Bellringer und Tinker haben eigene Figuren (`bellringer.ts`, `tinker.ts`). Der Riverkeeper hat noch keine eigene Figur - bis sein
 * Paket fertig ist, zeichnet `baseLook` ihn als Longshot. Die Helden Bram und Sela zeichnen als Wren.
 */
export type TowerType = BaseTowerType | 'riverkeeper' | 'bellringer' | 'tinker';
export type HeroType = 'wren' | 'bram' | 'sela';
export const PLACEHOLDER_LOOK: Record<TowerType, BaseTowerType> = {
  ranger: 'ranger', bombardier: 'bombardier', frostcaller: 'frostcaller', market: 'market', longshot: 'longshot', thornweaver: 'thornweaver', alchemist: 'alchemist',
  riverkeeper: 'longshot', bellringer: 'bellringer', tinker: 'tinker',
};
/** Welche vorhandene Figur zeichnet `type` (Platzhalter bis Paket TP). */
export const baseLook = (type: TowerType): BaseTowerType => PLACEHOLDER_LOOK[type];
/** Runde 15e: cruiser (Gloom Cruiser), duskrunner (immer Camo), dreadnought (Dusk Dreadnought). Runde 15: pink, frostling, crystal, gloomship (Blimp), wyrm und colossus (Bosse) — IDs wie in der Sim (docs/design/karten-gegner-r15.md). */
export type EnemyType = 'red' | 'blue' | 'green' | 'gold' | 'ironshell' | 'ember' | 'brute' | 'leviathan' | 'pink' | 'frostling' | 'crystal' | 'gloomship' | 'wyrm' | 'colossus' | 'cruiser' | 'duskrunner' | 'dreadnought';
/** Merkmale als Ueberlagerung (Runde 15): regrow = Blaetterkranz, fortified = Eisenbaender. Mit Camo kombinierbar. */
export type EnemyTrait = 'regrow' | 'fortified';
/** thorn/thornMagic: Thornweaver; potion/potionGold: Alchemist (Runde 14; bei potion* ist `dir16` die Drehung der Flasche). snipe/snipeHeavy/snipeGold/splinter: Longshot (Runde 13). */
export type ProjectileKind = 'arrow' | 'bigArrow' | 'bolt' | 'starBolt' | 'bomb' | 'frag' | 'frost' | 'shard' | 'lantern' | 'snipe' | 'snipeHeavy' | 'snipeGold' | 'splinter' | 'thorn' | 'thornMagic' | 'potion' | 'potionGold' | 'nail';
export type BaseAbilityId = 'arrowRain' | 'absoluteZero' | 'flare' | 'dawnbreak' | 'grant' | 'focus' | 'supplyDrop' | 'wallOfTrees' | 'transformingTonic' | 'alarm' | 'overclock';
/** Runde 16: alarm und overclock haben eigene Icons (Paket TP Bellringer/Tinker); anvilDrop, forgeOfDawn, starfall, eclipse zeichnen vorerst die Icons der Vorbilder (`ABILITY_LOOK`). */
export type AbilityId = BaseAbilityId | 'alarm' | 'overclock' | 'anvilDrop' | 'forgeOfDawn' | 'starfall' | 'eclipse';
export const ABILITY_LOOK: Record<AbilityId, BaseAbilityId> = {
  arrowRain: 'arrowRain', absoluteZero: 'absoluteZero', flare: 'flare', dawnbreak: 'dawnbreak', grant: 'grant', focus: 'focus', supplyDrop: 'supplyDrop', wallOfTrees: 'wallOfTrees', transformingTonic: 'transformingTonic',
  alarm: 'alarm', overclock: 'overclock', anvilDrop: 'dawnbreak', forgeOfDawn: 'flare', starfall: 'flare', eclipse: 'absoluteZero',
};
export type Tiers = [number, number, number];
export const TOWER_TYPES: TowerType[] = ['ranger', 'bombardier', 'frostcaller', 'market', 'longshot', 'thornweaver', 'alchemist'];
/** Tuerme, die zielen und schiessen (Market tut das nicht: nur Idle). */
export const SHOOTER_TYPES: TowerType[] = ['ranger', 'bombardier', 'frostcaller', 'longshot', 'thornweaver', 'alchemist'];
export const ENEMY_TYPES: EnemyType[] = ['red', 'blue', 'green', 'gold', 'ironshell', 'ember', 'brute', 'leviathan', 'pink', 'frostling', 'crystal', 'gloomship', 'wyrm', 'colossus', 'cruiser', 'duskrunner', 'dreadnought'];
export const ENEMY_TRAITS: EnemyTrait[] = ['regrow', 'fortified'];
export const PROJECTILE_KINDS: ProjectileKind[] = ['arrow', 'bigArrow', 'bolt', 'starBolt', 'bomb', 'frag', 'frost', 'shard', 'lantern', 'snipe', 'snipeHeavy', 'snipeGold', 'splinter', 'thorn', 'thornMagic', 'potion', 'potionGold', 'nail'];
export const ABILITIES: AbilityId[] = ['arrowRain', 'absoluteZero', 'flare', 'dawnbreak', 'grant', 'focus', 'supplyDrop', 'wallOfTrees', 'transformingTonic'];
