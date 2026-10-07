/**
 * (Runde 8: `portrait()` baut jetzt eine Karte, siehe unten.) Portrait einer Unit fuer die DOM-Oberflaeche: ein Ausschnitt des Sprite-Atlas (`assets/atlas`), per CSS-Hintergrund, ganzzahlig skaliert
 * (`image-rendering: pixelated`). Kennt der Atlas die Unit nicht (neue Unit ohne Sprite), erscheint ein farbiges Kuerzel-Abzeichen.
 * Besitzer: P4 (Runde 7).
 */
import atlasData from '../../assets/atlas/atlas.json';
import { miniOf } from './unit-card';

interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
}

const FRAMES = atlasData.frames as unknown as Record<string, { frame: Frame }>;
const ATLAS = atlasData.meta.size;

/** Rahmen der Unit im Atlas oder `null`. */
export const frameOf = (unitId: string, frames: Record<string, { frame: Frame }> = FRAMES): Frame | null => frames[`units/${unitId}`]?.frame ?? null;

export interface PortraitSpec {
  /** ganzzahlig, solange die Figur kleiner als die Box ist; sonst (z. B. 64er Farm in 32er Box) verkleinert auf die Box */
  scale: number;
  width: number;
  height: number;
  bgSize: string;
  bgPos: string;
}

/** Hintergrund-Angaben, damit der Rahmen `frame` in eine Box von `box` Pixeln passt (groesster ganzzahliger Massstab; zu grosse Figuren schrumpfen auf die Box). */
export function portraitSpec(frame: Frame, box: number, atlas: { w: number; h: number } = ATLAS): PortraitSpec {
  const side = Math.max(frame.w, frame.h);
  const scale = side > box ? box / side : Math.max(1, Math.floor(box / side));
  return {
    scale,
    width: frame.w * scale,
    height: frame.h * scale,
    bgSize: `${atlas.w * scale}px ${atlas.h * scale}px`,
    bgPos: `-${frame.x * scale}px -${frame.y * scale}px`,
  };
}

/** Kleines Portrait (Karte mit Bild oder Ersatzfigur, Runde 8); `box` = Hoehe in px. Die Atlas-Rechnung oben bleibt fuer Pixel-Sprites. */
export function portrait(unitId: string, box = 64): HTMLElement {
  return miniOf(unitId, Math.round((box * 3) / 4));
}
