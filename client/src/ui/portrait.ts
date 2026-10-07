/**
 * Portrait einer Unit fuer die DOM-Oberflaeche: ein Ausschnitt des Sprite-Atlas (`assets/atlas`), per CSS-Hintergrund, ganzzahlig skaliert
 * (`image-rendering: pixelated`). Kennt der Atlas die Unit nicht (neue Unit ohne Sprite), erscheint ein farbiges Kuerzel-Abzeichen.
 * Besitzer: P4 (Runde 7).
 */
import atlasData from '../../assets/atlas/atlas.json';
import atlasUrl from '../../assets/atlas/atlas.png?url';
import { unitColor } from '../view/model';
import { h } from './dom';
import { unitAbbr } from './meta-model';

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

const css = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;

/** Portrait-Element in einer quadratischen Box von `box` Pixeln. */
export function portrait(unitId: string, box = 64): HTMLElement {
  const wrap = h('span', 'portrait');
  wrap.style.width = `${box}px`;
  wrap.style.height = `${box}px`;
  const f = frameOf(unitId);
  if (f) {
    const s = portraitSpec(f, box);
    const img = h('span', 'portrait-img');
    Object.assign(img.style, { width: `${s.width}px`, height: `${s.height}px`, backgroundImage: `url(${atlasUrl})`, backgroundSize: s.bgSize, backgroundPosition: s.bgPos });
    wrap.append(img);
  } else {
    wrap.classList.add('fallback');
    const badge = h('span', 'badge', unitAbbr(unitId));
    badge.style.background = css(unitColor(unitId));
    wrap.append(badge);
  }
  return wrap;
}
