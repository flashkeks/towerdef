/**
 * Runde 15 (Paket A): Platzhalter-Look der neuen Gegner, bis Paket B2 (Pixel-Gegner) eigene Figuren liefert.
 * Die Sprite-Schicht kennt nur die acht alten Typen; die neuen werden auf aehnliche abgebildet.
 */
import type { EnemyType as SimEnemyType } from '../sim';
import type { EnemyType as SpriteEnemyType } from '../pixel/sprites/types';

const LOOK: Record<SimEnemyType, SpriteEnemyType> = {
  red: 'red', blue: 'blue', green: 'green', gold: 'gold', ironshell: 'ironshell', ember: 'ember', brute: 'brute', leviathan: 'leviathan',
  pink: 'gold', frostling: 'blue', crystal: 'brute', gloomship: 'ironshell', wyrm: 'leviathan', colossus: 'leviathan',
};
export const spriteType = (t: SimEnemyType): SpriteEnemyType => LOOK[t];
