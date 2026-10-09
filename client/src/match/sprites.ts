/**
 * Adapter zwischen Renderer/UI und den Sprite-Quellen. Die Figuren, Projektile, Icons und Effekte kommen von P2
 * (`pixel/sprites/index.ts`); Ringe/Scheiben (Reichweite, Auswahl) zeichnet `rings.ts`.
 */
export type { Sprite as Spr, TowerFrame, HeroFrame } from '../pixel/sprites';
export {
  towerSprite, heroSprite, enemySprite, projectileSprite, iconUpgrade, iconAbility, towerMuzzle, heroMuzzle, towerPortrait, heroPortrait,
  shadowSprite, fx, pixelText, iconPower, emberIcon, merchantSprite, trapSprite, coinSprite, bigHeart, bubbleSprite, bombLantern, TRAP_W, TRAP_H, EXPLOSION_FRAMES, NOVA_FRAMES, POP_FRAMES, PUFF_FRAMES, PLATE_FRAMES, FLARE_FRAMES, ZERO_FRAMES, BEAM_FRAMES, STATUS_FRAMES,
  COIN_RISE_FRAMES, CHEST_FRAMES, AURA_FRAMES, GRANT_FRAMES, DROP_FRAMES, FOCUS_FRAMES, MARK_FRAMES,
} from '../pixel/sprites';
export { ringSprite, discSprite } from './rings';
