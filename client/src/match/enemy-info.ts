/**
 * Darstellungsdaten der Gegner (Runde 15 C): Schatten, Lebensbalken, Abstand fuer Markierungen ueber dem Kopf.
 * Loest den Platzhalter `enemy-look.ts` ab: seit Paket B2 gibt es fuer jeden Typ einen eigenen Sprite.
 */
import type { EnemyState, EnemyType } from '../sim';

export interface EnemyLook {
  /** Schlagschatten-Ellipse (Breite x Hoehe), 0 = eigener Schatten (Gloomship) */
  shadow: [number, number];
  /** Hoehe ueber dem Fusspunkt, an der Markierungen (Fadenkreuz, Saeure, Blase) sitzen */
  top: number;
  /** Breite des Lebensbalkens, 0 = nie einen Balken */
  bar: number;
  /** Balken immer zeigen (Bosse, Blimps), sonst erst nach Schaden */
  barAlways: boolean;
  /** Y-Abstand des Balkens ueber dem Fusspunkt */
  barY: number;
  /** Sprite schwebt (Boss-Schweben, Blimp): Zusatzhoehe der Z-Ordnung */
  lift: number;
}

const GLIM: EnemyLook = { shadow: [9, 3], top: 14, bar: 0, barAlways: false, barY: 18, lift: 0 };
export const ENEMY_LOOK: Record<EnemyType, EnemyLook> = {
  red: GLIM, blue: GLIM, green: GLIM, gold: GLIM, pink: GLIM, frostling: { ...GLIM, top: 15 },
  ironshell: { ...GLIM, shadow: [11, 3], top: 17 }, ember: { ...GLIM, top: 17 },
  brute: { shadow: [16, 5], top: 26, bar: 14, barAlways: false, barY: 18, lift: 0 },
  crystal: { shadow: [24, 6], top: 33, bar: 18, barAlways: false, barY: 36, lift: 0 },
  leviathan: { shadow: [40, 10], top: 46, bar: 40, barAlways: true, barY: 34, lift: 40 },
  gloomship: { shadow: [0, 0], top: 52, bar: 30, barAlways: true, barY: 58, lift: 30 },
  wyrm: { shadow: [42, 10], top: 54, bar: 40, barAlways: true, barY: 58, lift: 24 },
  colossus: { shadow: [44, 10], top: 56, bar: 40, barAlways: true, barY: 60, lift: 24 },
};

/**
 * Schadensstufe fuer den Sprite. Die Sim zaehlt Stufen nur fuer Gegner mit `stages` (Brute, Crystal, Bosse); der Gloomship
 * hat keine, sein Rumpf zeigt Schaden nach Lebenspunkten (unter 2/3 und unter 1/3).
 */
export function spriteStage(e: Pick<EnemyState, 'type' | 'hp' | 'maxHp' | 'damageStage'>): number {
  if (e.type !== 'gloomship') return e.damageStage;
  const f = e.hp / Math.max(1, e.maxHp);
  return f <= 1 / 3 ? 2 : f <= 2 / 3 ? 1 : 0;
}

/** Bosse und Blimps: bekommen Schatten- und Absturz-Effekte, sind nicht einfrierbar usw. */
export const isBoss = (t: EnemyType): boolean => t === 'leviathan' || t === 'wyrm' || t === 'colossus';

/** Anzeigenamen der Bosse fuer das Banner "<Boss> approaches". */
export const BOSS_NAMES: Partial<Record<EnemyType, string>> = { leviathan: 'Dusk Leviathan', wyrm: 'Frost Wyrm', colossus: 'Ember Colossus' };
