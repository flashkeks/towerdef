/** Gemeinsames der Helden-Figuren (Wren, Bram, Sela): Frames, sichtbare Stufen. Eigene Datei, damit hero.ts, bram.ts und sela.ts sich nicht gegenseitig importieren. */
import type { TowerFrame } from './pose';

export type HeroFrame = TowerFrame | 'cast0' | 'cast1';
export const HERO_FRAMES: HeroFrame[] = ['idle0', 'idle1', 'idle2', 'idle3', 'atk0', 'atk1', 'atk2', 'atk3', 'cast0', 'cast1'];

/** 0 = Level 1-4, 1 = 5-9, 2 = 10-14, 3 = 15-19, 4 = 20. */
export function heroStage(level: number): number {
  return level >= 20 ? 4 : level >= 15 ? 3 : level >= 10 ? 2 : level >= 5 ? 1 : 0;
}
/** Kleinstes Level der sichtbaren Stufe (1, 5, 10, 15, 20). */
export const STAGE_LEVEL = [1, 5, 10, 15, 20];

/** Welche Helden es gibt (wie `HeroType` in types.ts). */
export type HeroKind = 'wren' | 'bram' | 'sela';
